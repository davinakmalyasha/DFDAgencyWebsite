package auth

import (
	"encoding/json"
	"errors"
	"io"
	"log/slog"
	"net/http"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	platformauth "github.com/dfd-agency/api/internal/platform/auth"
	"github.com/dfd-agency/api/internal/platform/http/middleware"
	"github.com/dfd-agency/api/internal/platform/http/response"
)

// Handler serves human auth routes.
type Handler struct {
	store     *Store
	pool      *pgxpool.Pool
	logger    *slog.Logger
	jwtSecret string
	jwtTTL    time.Duration
	secure    bool
}

// NewHandler builds an auth handler.
func NewHandler(store *Store, pool *pgxpool.Pool, logger *slog.Logger, jwtSecret string, jwtTTL time.Duration, secure bool) *Handler {
	return &Handler{store: store, pool: pool, logger: logger, jwtSecret: jwtSecret, jwtTTL: jwtTTL, secure: secure}
}

// Register mounts auth routes on the root mux.
func (h *Handler) Register(mux *http.ServeMux, loginLimiter, inviteLimiter *middleware.RateLimiter) {
	cookieGuard := platformauth.CookieAuth(h.jwtSecret, h.pool, h.jwtTTL)
	mux.Handle("POST /api/v1/auth/login", loginLimiter.Limit(http.HandlerFunc(h.login)))
	mux.Handle("POST /api/v1/auth/logout", cookieGuard(http.HandlerFunc(h.logout)))
	mux.Handle("GET /api/v1/auth/me", cookieGuard(http.HandlerFunc(h.me)))
	mux.Handle("POST /api/v1/auth/change-password", cookieGuard(http.HandlerFunc(h.changePassword)))
	mux.Handle("POST /api/v1/auth/invite/verify", inviteLimiter.Limit(http.HandlerFunc(h.verifyInvite)))
	mux.Handle("GET /api/v1/auth/invite/verify", inviteLimiter.Limit(http.HandlerFunc(h.verifyInvite)))
}

func (h *Handler) login(w http.ResponseWriter, r *http.Request) {
	var body struct {
		Email    string `json:"email"`
		Password string `json:"password"`
	}
	if !decodeJSON(w, r, &body) {
		return
	}
	if !strings.Contains(body.Email, "@") || len(body.Password) < 8 {
		// Same generic message as a real failure — no enumeration.
		response.Unauthorized(w, "Invalid credentials")
		return
	}
	user, hash, version, deletedAt, err := h.store.FindForLogin(r.Context(), body.Email)
	if err != nil && !errors.Is(err, pgx.ErrNoRows) {
		h.logger.ErrorContext(r.Context(), "login lookup failed", "error", err)
		response.Internal(w)
		return
	}
	active := err == nil && deletedAt == nil
	if !SecureCompare(body.Password, hash) || !active {
		response.Unauthorized(w, "Invalid credentials")
		return
	}
	token, err := platformauth.SignJWT(h.jwtSecret, h.jwtTTL, user.ID, user.Role, version)
	if err != nil {
		h.logger.ErrorContext(r.Context(), "login sign failed", "error", err)
		response.Internal(w)
		return
	}
	h.setCookie(w, token)
	response.OK(w, map[string]any{"user": user}, "Login successful")
}

func (h *Handler) logout(w http.ResponseWriter, r *http.Request) {
	if actor, ok := platformauth.ActorFrom(r.Context()); ok && actor.Type == "user" {
		_ = h.store.BumpTokenVersion(r.Context(), actor.UserID)
	}
	h.clearCookie(w)
	response.OK(w, nil, "Logged out and tokens invalidated")
}

func (h *Handler) me(w http.ResponseWriter, r *http.Request) {
	actor, ok := platformauth.ActorFrom(r.Context())
	if !ok || actor.Type != "user" {
		response.Unauthorized(w, "Not authenticated")
		return
	}
	user, err := h.store.GetProfile(r.Context(), actor.UserID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			h.clearCookie(w)
			response.Unauthorized(w, "Not authenticated")
			return
		}
		h.logger.ErrorContext(r.Context(), "me failed", "error", err)
		response.Internal(w)
		return
	}
	response.OK(w, map[string]any{"user": user}, "User profile retrieved")
}

func (h *Handler) changePassword(w http.ResponseWriter, r *http.Request) {
	actor, ok := platformauth.ActorFrom(r.Context())
	if !ok || actor.Type != "user" {
		response.Unauthorized(w, "Not authenticated")
		return
	}
	var body struct {
		CurrentPassword string `json:"currentPassword"`
		NewPassword     string `json:"newPassword"`
	}
	if !decodeJSON(w, r, &body) {
		return
	}
	if body.CurrentPassword == "" || !ValidPassword(body.NewPassword) {
		response.ValidationError(w, "Invalid password change", map[string]string{
			"newPassword": "New password must be at least 8 characters with letters and numbers",
		})
		return
	}
	hash, err := platformauth.HashPassword(body.NewPassword)
	if err != nil {
		h.logger.ErrorContext(r.Context(), "hash failed", "error", err)
		response.Internal(w)
		return
	}
	version, err := h.store.ChangePassword(r.Context(), actor.UserID, body.CurrentPassword, hash)
	if err != nil {
		if errors.Is(err, errWrongPassword) {
			response.Unauthorized(w, "Current password is incorrect")
			return
		}
		if errors.Is(err, pgx.ErrNoRows) {
			h.clearCookie(w)
			response.Unauthorized(w, "Not authenticated")
			return
		}
		h.logger.ErrorContext(r.Context(), "change password failed", "error", err)
		response.Internal(w)
		return
	}
	// Re-issue this session; every other session is now dead (tokenVersion++).
	profile, err := h.store.GetProfile(r.Context(), actor.UserID)
	if err != nil {
		h.clearCookie(w)
		response.Unauthorized(w, "Not authenticated")
		return
	}
	token, err := platformauth.SignJWT(h.jwtSecret, h.jwtTTL, profile.ID, profile.Role, version)
	if err != nil {
		response.Internal(w)
		return
	}
	h.setCookie(w, token)
	response.OK(w, nil, "Password changed")
}

func (h *Handler) verifyInvite(w http.ResponseWriter, r *http.Request) {
	token := strings.TrimSpace(r.URL.Query().Get("token"))
	if r.Method == http.MethodPost && token == "" {
		var parsed struct {
			Token string `json:"token"`
		}
		raw, _ := io.ReadAll(io.LimitReader(r.Body, 4096))
		if len(raw) > 0 {
			if err := json.Unmarshal(raw, &parsed); err == nil {
				token = strings.TrimSpace(parsed.Token)
			}
		}
	}
	if len(token) < 10 {
		response.BadRequest(w, "Invite token required")
		return
	}
	inv, err := h.store.FindInvite(r.Context(), token)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			response.Fail(w, http.StatusBadRequest, "Invite link invalid or expired", "INVALID_INVITE")
			return
		}
		h.logger.ErrorContext(r.Context(), "invite lookup failed", "error", err)
		response.Internal(w)
		return
	}
	if inv.Deleted || inv.Expiry.IsZero() || time.Now().After(inv.Expiry) {
		response.Fail(w, http.StatusBadRequest, "Invite link invalid or expired", "INVALID_INVITE")
		return
	}
	version, err := h.store.ConsumeInvite(r.Context(), inv.User.ID)
	if err != nil {
		h.logger.ErrorContext(r.Context(), "consume invite failed", "error", err)
		response.Internal(w)
		return
	}
	signed, err := platformauth.SignJWT(h.jwtSecret, h.jwtTTL, inv.User.ID, inv.User.Role, version)
	if err != nil {
		h.logger.ErrorContext(r.Context(), "invite sign failed", "error", err)
		response.Internal(w)
		return
	}
	h.setCookie(w, signed)
	response.OK(w, map[string]any{"user": inv.User}, "Invite verified — logged in")
}

func (h *Handler) setCookie(w http.ResponseWriter, token string) {
	sameSite := http.SameSiteStrictMode
	if h.secure {
		// Cross-site production frontend needs None + Secure.
		sameSite = http.SameSiteNoneMode
	}
	http.SetCookie(w, &http.Cookie{
		Name:     platformauth.CookieName,
		Value:    token,
		Path:     "/",
		HttpOnly: true,
		Secure:   h.secure,
		SameSite: sameSite,
		MaxAge:   int(h.jwtTTL.Seconds()),
	})
}

func (h *Handler) clearCookie(w http.ResponseWriter) {
	platformauth.ClearCookie(w, h.secure)
}

func decodeJSON(w http.ResponseWriter, r *http.Request, dst any) bool {
	raw, err := io.ReadAll(io.LimitReader(r.Body, 1<<20))
	if err != nil || len(raw) == 0 {
		response.BadRequest(w, "Request body is required")
		return false
	}
	if err := json.Unmarshal(raw, dst); err != nil {
		response.BadRequest(w, "Invalid JSON body")
		return false
	}
	return true
}
