package auth

import (
	"context"
	"time"

	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
)

// Store owns auth reads/writes.
type Store struct {
	pool *pgxpool.Pool
}

// NewStore builds an auth Store.
func NewStore(pool *pgxpool.Pool) *Store { return &Store{pool: pool} }

func int64Ptr(n pgtype.Int8) *int64 {
	if !n.Valid {
		return nil
	}
	v := n.Int64
	return &v
}

func textPtr(t pgtype.Text) *string {
	if !t.Valid {
		return nil
	}
	v := t.String
	return &v
}

// User is the authenticated profile.
type User struct {
	ID       int64  `json:"id"`
	Username string `json:"username"`
	Email    string `json:"email"`
	Role     string `json:"role"`
}

// LoginResult carries the user plus the session material.
type LoginResult struct {
	User         User
	TokenVersion int
}

// FindForLogin returns the user row for credential checking, or pgx.ErrNoRows.
func (s *Store) FindForLogin(ctx context.Context, email string) (User, string, int, *time.Time, error) {
	var (
		u       User
		hash    string
		version int
		deleted pgtype.Timestamptz
	)
	err := s.pool.QueryRow(ctx, `SELECT id, username, email, password_hash, role, token_version, deleted_at
		FROM users WHERE email = $1`, NormalizeEmail(email),
	).Scan(&u.ID, &u.Username, &u.Email, &hash, &u.Role, &version, &deleted)
	if err != nil {
		return User{}, "", 0, nil, err
	}
	var deletedAt *time.Time
	if deleted.Valid {
		v := deleted.Time
		deletedAt = &v
	}
	return u, hash, version, deletedAt, nil
}

// BumpTokenVersion invalidates every session for the user.
func (s *Store) BumpTokenVersion(ctx context.Context, userID int64) error {
	_, err := s.pool.Exec(ctx, `UPDATE users SET token_version = token_version + 1 WHERE id = $1`, userID)
	return err
}

// GetProfile returns the public profile, or pgx.ErrNoRows.
func (s *Store) GetProfile(ctx context.Context, userID int64) (*User, error) {
	var u User
	err := s.pool.QueryRow(ctx, `SELECT id, username, email, role FROM users
		WHERE id = $1 AND deleted_at IS NULL`, userID).Scan(&u.ID, &u.Username, &u.Email, &u.Role)
	if err != nil {
		return nil, err
	}
	return &u, nil
}

// Invite holds a pending invite.
type Invite struct {
	User         User
	TokenVersion int
	Expiry       time.Time
	Deleted      bool
}

// FindInvite returns the invite row for a token, or pgx.ErrNoRows.
func (s *Store) FindInvite(ctx context.Context, token string) (*Invite, error) {
	var (
		inv     Invite
		expiry  pgtype.Timestamptz
		deleted pgtype.Timestamptz
	)
	err := s.pool.QueryRow(ctx, `SELECT id, username, email, role, token_version,
		invite_token_expiry, deleted_at FROM users WHERE invite_token = $1`,
		token,
	).Scan(&inv.User.ID, &inv.User.Username, &inv.User.Email, &inv.User.Role,
		&inv.TokenVersion, &expiry, &deleted)
	if err != nil {
		return nil, err
	}
	if expiry.Valid {
		inv.Expiry = expiry.Time
	}
	inv.Deleted = deleted.Valid
	return &inv, nil
}

// ConsumeInvite nulls the token (single use) and returns the session version.
func (s *Store) ConsumeInvite(ctx context.Context, userID int64) (int, error) {
	var version int
	err := s.pool.QueryRow(ctx, `UPDATE users SET invite_token = NULL, invite_token_expiry = NULL
		WHERE id = $1 RETURNING token_version`, userID).Scan(&version)
	return version, err
}

// ChangePassword verifies the current password, sets the new hash, bumps the
// token version so other sessions die, and returns the new version.
func (s *Store) ChangePassword(ctx context.Context, userID int64, currentPassword, newHash string) (int, error) {
	var hash string
	if err := s.pool.QueryRow(ctx, `SELECT password_hash FROM users
		WHERE id = $1 AND deleted_at IS NULL`, userID).Scan(&hash); err != nil {
		return 0, err
	}
	if !SecureCompare(currentPassword, hash) {
		return 0, errWrongPassword
	}
	var version int
	err := s.pool.QueryRow(ctx, `UPDATE users SET password_hash = $1, token_version = token_version + 1
		WHERE id = $2 RETURNING token_version`, newHash, userID).Scan(&version)
	return version, err
}

// errWrongPassword distinguishes bad credentials from missing rows.
var errWrongPassword = errSentinel("wrong password")

type errSentinel string

func (e errSentinel) Error() string { return string(e) }
