package admin

import (
	"context"
	"encoding/json"
	"errors"
	"strings"
	"time"

	"github.com/jackc/pgerrcode"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgtype"
)

// AdminNote is a note with author name.
type AdminNote struct {
	ID        int64   `json:"id"`
	OrderID   string  `json:"orderId"`
	Content   string  `json:"content"`
	IsPublic  bool    `json:"isPublic"`
	IsClient  bool    `json:"isClient"`
	AuthorID  *int64  `json:"authorId"`
	Author    *string `json:"author,omitempty"`
	IsEdited  bool    `json:"isEdited"`
	IsDeleted bool    `json:"isDeleted"`
	ParentID  *int64  `json:"parentId"`
	CreatedAt string  `json:"createdAt"`
	UpdatedAt string  `json:"updatedAt"`
}

// ListNotes returns non-deleted notes with author names.
func (s *Store) ListNotes(ctx context.Context, orderID string) ([]AdminNote, error) {
	rows, err := s.pool.Query(ctx, `SELECT n.id, n.order_id, n.content, n.is_public, n.is_client,
			n.author_id, u.username, n.is_edited, n.is_deleted, n.parent_id, n.created_at, n.updated_at
		FROM order_notes n LEFT JOIN users u ON u.id = n.author_id
		WHERE n.order_id = $1 AND n.is_deleted = FALSE ORDER BY n.created_at ASC`, orderID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []AdminNote{}
	for rows.Next() {
		var (
			n        AdminNote
			authorID pgtype.Int8
			author   pgtype.Text
			parent   pgtype.Int8
			created  time.Time
			updated  time.Time
		)
		if err := rows.Scan(&n.ID, &n.OrderID, &n.Content, &n.IsPublic, &n.IsClient,
			&authorID, &author, &n.IsEdited, &n.IsDeleted, &parent, &created, &updated); err != nil {
			return nil, err
		}
		n.AuthorID = int8Ptr(authorID)
		n.Author = textPtr(author)
		n.ParentID = int8Ptr(parent)
		n.CreatedAt = created.Format(time.RFC3339)
		n.UpdatedAt = updated.Format(time.RFC3339)
		out = append(out, n)
	}
	return out, rows.Err()
}

// CreateAdminNote inserts a staff note.
func (s *Store) CreateAdminNote(ctx context.Context, orderID, content string, isPublic *bool, authorID *int64, parentID *int64) (*AdminNote, error) {
	pub := false
	if isPublic != nil {
		pub = *isPublic
	}
	var n AdminNote
	var (
		authorIDOut pgtype.Int8
		parentOut   pgtype.Int8
		created     time.Time
		updated     time.Time
	)
	err := s.pool.QueryRow(ctx, `INSERT INTO order_notes (order_id, content, is_public, is_client, author_id, parent_id)
		VALUES ($1,$2,$3,FALSE,$4,$5)
		RETURNING id, order_id, content, is_public, is_client, author_id, is_edited, is_deleted, parent_id, created_at, updated_at`,
		orderID, content, pub, authorID, parentID,
	).Scan(&n.ID, &n.OrderID, &n.Content, &n.IsPublic, &n.IsClient,
		&authorIDOut, &n.IsEdited, &n.IsDeleted, &parentOut, &created, &updated)
	if err != nil {
		return nil, err
	}
	n.AuthorID = int8Ptr(authorIDOut)
	n.ParentID = int8Ptr(parentOut)
	n.CreatedAt = created.Format(time.RFC3339)
	n.UpdatedAt = updated.Format(time.RFC3339)
	return &n, nil
}

// UpdateAdminNote updates note content and flags the edit.
func (s *Store) UpdateAdminNote(ctx context.Context, noteID int64, content *string) (*AdminNote, error) {
	setContent := true
	c := ""
	if content != nil {
		c = *content
	} else {
		setContent = false
	}
	_ = setContent
	row := s.pool.QueryRow(ctx, `UPDATE order_notes SET content = COALESCE(NULLIF($1,''), content),
		is_edited = TRUE WHERE id = $2 AND is_deleted = FALSE
		RETURNING id, order_id, content, is_public, is_client, author_id, is_edited, is_deleted, parent_id, created_at, updated_at`,
		c, noteID)
	var (
		n        AdminNote
		authorID pgtype.Int8
		parent   pgtype.Int8
		created  time.Time
		updated  time.Time
	)
	if err := row.Scan(&n.ID, &n.OrderID, &n.Content, &n.IsPublic, &n.IsClient,
		&authorID, &n.IsEdited, &n.IsDeleted, &parent, &created, &updated); err != nil {
		return nil, err
	}
	n.AuthorID = int8Ptr(authorID)
	n.ParentID = int8Ptr(parent)
	n.CreatedAt = created.Format(time.RFC3339)
	n.UpdatedAt = updated.Format(time.RFC3339)
	return &n, nil
}

// DeleteAdminNote soft-deletes a note.
func (s *Store) DeleteAdminNote(ctx context.Context, noteID int64) error {
	_, err := s.pool.Exec(ctx, `UPDATE order_notes SET is_deleted = TRUE WHERE id = $1`, noteID)
	return err
}

// Resource is a client-facing attachment.
type Resource struct {
	ID        int64   `json:"id"`
	OrderID   string  `json:"orderId"`
	Title     string  `json:"title"`
	URL       string  `json:"url"`
	Icon      *string `json:"icon"`
	CreatedAt string  `json:"createdAt"`
}

// ListResources returns order resources.
func (s *Store) ListResources(ctx context.Context, orderID string) ([]Resource, error) {
	rows, err := s.pool.Query(ctx, `SELECT id, order_id, title, url, icon, created_at FROM order_resources
		WHERE order_id = $1 ORDER BY created_at DESC`, orderID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []Resource{}
	for rows.Next() {
		var (
			r       Resource
			icon    pgtype.Text
			created time.Time
		)
		if err := rows.Scan(&r.ID, &r.OrderID, &r.Title, &r.URL, &icon, &created); err != nil {
			return nil, err
		}
		r.Icon = textPtr(icon)
		r.CreatedAt = created.Format(time.RFC3339)
		out = append(out, r)
	}
	return out, rows.Err()
}

// CreateResource inserts a resource.
func (s *Store) CreateResource(ctx context.Context, orderID, title, url string, icon *string) (*Resource, error) {
	var (
		r       Resource
		iconOut pgtype.Text
		created time.Time
	)
	err := s.pool.QueryRow(ctx, `INSERT INTO order_resources (order_id, title, url, icon)
		VALUES ($1,$2,$3,$4) RETURNING id, order_id, title, url, icon, created_at`,
		orderID, title, url, icon,
	).Scan(&r.ID, &r.OrderID, &r.Title, &r.URL, &iconOut, &created)
	if err != nil {
		return nil, err
	}
	r.Icon = textPtr(iconOut)
	r.CreatedAt = created.Format(time.RFC3339)
	return &r, nil
}

// UpdateResource applies a partial update.
func (s *Store) UpdateResource(ctx context.Context, id int64, title, url, icon *string) (*Resource, error) {
	sets := []string{}
	args := []any{}
	add := func(column string, value any) {
		args = append(args, value)
		sets = append(sets, column+` = $`+itoa(len(args)))
	}
	if title != nil {
		add("title", *title)
	}
	if url != nil {
		add("url", *url)
	}
	if icon != nil {
		add("icon", *icon)
	}
	if len(sets) == 0 {
		return s.getResource(ctx, id)
	}
	args = append(args, id)
	var (
		r       Resource
		iconOut pgtype.Text
		created time.Time
	)
	err := s.pool.QueryRow(ctx, `UPDATE order_resources SET `+joinComma(sets)+
		` WHERE id = $`+itoa(len(args))+` RETURNING id, order_id, title, url, icon, created_at`, args...,
	).Scan(&r.ID, &r.OrderID, &r.Title, &r.URL, &iconOut, &created)
	if err != nil {
		return nil, err
	}
	r.Icon = textPtr(iconOut)
	r.CreatedAt = created.Format(time.RFC3339)
	return &r, nil
}

func (s *Store) getResource(ctx context.Context, id int64) (*Resource, error) {
	var (
		r       Resource
		iconOut pgtype.Text
		created time.Time
	)
	err := s.pool.QueryRow(ctx, `SELECT id, order_id, title, url, icon, created_at FROM order_resources WHERE id = $1`, id).Scan(&r.ID, &r.OrderID, &r.Title, &r.URL, &iconOut, &created)
	if err != nil {
		return nil, err
	}
	r.Icon = textPtr(iconOut)
	r.CreatedAt = created.Format(time.RFC3339)
	return &r, nil
}

// DeleteResource removes a resource.
func (s *Store) DeleteResource(ctx context.Context, id int64) error {
	_, err := s.pool.Exec(ctx, `DELETE FROM order_resources WHERE id = $1`, id)
	return err
}

// Milestone is a production milestone.
type Milestone struct {
	ID           int64   `json:"id"`
	OrderID      string  `json:"orderId"`
	Title        string  `json:"title"`
	Description  *string `json:"description"`
	CoverURL     *string `json:"coverUrl"`
	Category     string  `json:"category"`
	Status       string  `json:"status"`
	NotifyClient bool    `json:"notifyClient"`
	CreatedByID  *int64  `json:"createdById"`
	CreatedAt    string  `json:"createdAt"`
	UpdatedAt    string  `json:"updatedAt"`
}

// ListMilestones returns milestones for an order.
func (s *Store) ListMilestones(ctx context.Context, orderID string) ([]Milestone, error) {
	rows, err := s.pool.Query(ctx, `SELECT id, order_id, title, description, cover_url, category, status,
		notify_client, created_by_id, created_at, updated_at FROM order_milestones
		WHERE order_id = $1 ORDER BY created_at ASC`, orderID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []Milestone{}
	for rows.Next() {
		m, err := scanMilestone(rows)
		if err != nil {
			return nil, err
		}
		out = append(out, *m)
	}
	return out, rows.Err()
}

func scanMilestone(row pgx.Row) (*Milestone, error) {
	var (
		m       Milestone
		desc    pgtype.Text
		cover   pgtype.Text
		created pgtype.Int8
		cAt     time.Time
		uAt     time.Time
	)
	if err := row.Scan(&m.ID, &m.OrderID, &m.Title, &desc, &cover, &m.Category, &m.Status,
		&m.NotifyClient, &created, &cAt, &uAt); err != nil {
		return nil, err
	}
	m.Description = textPtr(desc)
	m.CoverURL = textPtr(cover)
	m.CreatedByID = int8Ptr(created)
	m.CreatedAt = cAt.Format(time.RFC3339)
	m.UpdatedAt = uAt.Format(time.RFC3339)
	return &m, nil
}

// CreateMilestone inserts a milestone.
func (s *Store) CreateMilestone(ctx context.Context, orderID string, createdBy int64, title string,
	description, coverURL, category, status *string, notifyClient *bool) (*Milestone, error) {
	cat := "OTHER"
	if category != nil && *category != "" {
		cat = *category
	}
	st := "READY"
	if status != nil && *status != "" {
		st = *status
	}
	notify := true
	if notifyClient != nil {
		notify = *notifyClient
	}
	return scanMilestone(s.pool.QueryRow(ctx, `INSERT INTO order_milestones
		(order_id, title, description, cover_url, category, status, notify_client, created_by_id)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
		RETURNING id, order_id, title, description, cover_url, category, status, notify_client, created_by_id, created_at, updated_at`,
		orderID, title, description, coverURL, cat, st, notify, createdBy))
}

// UpdateMilestone applies a raw partial update.
func (s *Store) UpdateMilestone(ctx context.Context, id int64, fields map[string]any) (*Milestone, error) {
	allowed := map[string]bool{
		"title": true, "description": true, "coverUrl": true, "cover_url": true,
		"category": true, "status": true, "notifyClient": true, "notify_client": true,
	}
	columnOf := map[string]string{
		"title": "title", "description": "description", "coverUrl": "cover_url", "cover_url": "cover_url",
		"category": "category", "status": "status", "notifyClient": "notify_client", "notify_client": "notify_client",
	}
	sets := []string{}
	args := []any{}
	for k, v := range fields {
		if !allowed[k] {
			continue
		}
		args = append(args, v)
		sets = append(sets, columnOf[k]+` = $`+itoa(len(args)))
	}
	if len(sets) == 0 {
		return scanMilestone(s.pool.QueryRow(ctx, `SELECT id, order_id, title, description, cover_url, category,
			status, notify_client, created_by_id, created_at, updated_at FROM order_milestones WHERE id = $1`, id))
	}
	args = append(args, id)
	return scanMilestone(s.pool.QueryRow(ctx, `UPDATE order_milestones SET `+joinComma(sets)+
		` WHERE id = $`+itoa(len(args))+` RETURNING id, order_id, title, description, cover_url, category,
		status, notify_client, created_by_id, created_at, updated_at`, args...))
}

// DeleteMilestone removes a milestone.
func (s *Store) DeleteMilestone(ctx context.Context, id int64) error {
	_, err := s.pool.Exec(ctx, `DELETE FROM order_milestones WHERE id = $1`, id)
	return err
}

// Activity is a timeline event.
type Activity struct {
	ID        int64           `json:"id"`
	OrderID   string          `json:"orderId"`
	ActorID   *int64          `json:"actorId"`
	Type      string          `json:"type"`
	Message   string          `json:"message"`
	Meta      json.RawMessage `json:"meta,omitempty"`
	CreatedAt string          `json:"createdAt"`
}

// OrderActivity returns the timeline.
func (s *Store) OrderActivity(ctx context.Context, orderID string) ([]Activity, error) {
	rows, err := s.pool.Query(ctx, `SELECT id, order_id, actor_id, type, message, meta, created_at
		FROM order_activities WHERE order_id = $1 ORDER BY created_at DESC LIMIT 100`, orderID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []Activity{}
	for rows.Next() {
		var (
			a       Activity
			actor   pgtype.Int8
			meta    []byte
			created time.Time
		)
		if err := rows.Scan(&a.ID, &a.OrderID, &actor, &a.Type, &a.Message, &meta, &created); err != nil {
			return nil, err
		}
		a.ActorID = int8Ptr(actor)
		a.Meta = jsonRaw(meta)
		a.CreatedAt = created.Format(time.RFC3339)
		out = append(out, a)
	}
	return out, rows.Err()
}

// WhatsappLink builds the client tracking link for sharing.
func (s *Store) WhatsappLink(ctx context.Context, orderID, frontendURL string) (map[string]any, error) {
	var exists bool
	if err := s.pool.QueryRow(ctx, `SELECT EXISTS(SELECT 1 FROM orders WHERE id = $1 AND deleted_at IS NULL)`, orderID).Scan(&exists); err != nil {
		return nil, err
	}
	if !exists {
		return nil, pgx.ErrNoRows
	}
	base := strings.TrimSuffix(strings.TrimSpace(frontendURL), "/")
	if base == "" {
		base = "http://localhost:3000"
	}
	return map[string]any{"url": base + "/track/" + orderID}, nil
}

// WriteAudit records a back-office action.
func (s *Store) WriteAudit(ctx context.Context, userID int64, action, target string, details map[string]any, ip string) error {
	var detailsArg any
	if details != nil {
		var err error
		detailsArg, err = json.Marshal(details)
		if err != nil {
			return err
		}
		detailsArg = string(detailsArg.([]byte))
	}
	_, err := s.pool.Exec(ctx, `INSERT INTO audit_logs (user_id, actor_type, actor_id, action, target, details, ip_address)
		VALUES ($1,'USER',$6,$2,$3,$4::jsonb,$5::text)`,
		userID, action, target, detailsArg, nullIfEmpty(ip), itoa64(userID))
	return err
}

// RememberContract upserts the contract row after generation.
func (s *Store) RememberContract(ctx context.Context, orderID string) {
	_, _ = s.pool.Exec(ctx, `INSERT INTO contracts (order_id, status)
		VALUES ($1,'SENT') ON CONFLICT (order_id) DO UPDATE SET status = 'SENT'`, orderID)
}

// isUniqueViolation reports Postgres unique violations.
func isUniqueViolation(err error) bool {
	var pgErr *pgconn.PgError
	if errors.As(err, &pgErr) {
		return pgErr.Code == pgerrcode.UniqueViolation
	}
	return false
}
