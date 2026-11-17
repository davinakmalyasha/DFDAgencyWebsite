// Package client implements the client portal: own orders, milestones,
// requests, feedback, and admin request triage. Downloads are served by the
// PDF service (separate module); until then they return 501.
package client

import (
	"context"
	"encoding/json"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
)

// Store owns client portal data access.
type Store struct {
	pool *pgxpool.Pool
}

// NewStore builds a client Store.
func NewStore(pool *pgxpool.Pool) *Store { return &Store{pool: pool} }

// OwnsOrder reports whether the user may access the order. Staff always can;
// clients can when their lead matches or the lead WhatsApp equals their email.
func (s *Store) OwnsOrder(ctx context.Context, userID int64, role, orderID string) (bool, error) {
	if role == "SUPERADMIN" || role == "EDITOR" {
		return true, nil
	}
	var (
		leadID    pgtype.Int8
		email     string
		orderLead pgtype.Int8
		leadWA    string
	)
	if err := s.pool.QueryRow(ctx, `SELECT lead_id, email FROM users WHERE id = $1`, userID).Scan(&leadID, &email); err != nil {
		return false, err
	}
	err := s.pool.QueryRow(ctx, `SELECT o.lead_id, l.whatsapp FROM orders o
		JOIN leads l ON l.id = o.lead_id WHERE o.id = $1 AND o.deleted_at IS NULL`,
		orderID).Scan(&orderLead, &leadWA)
	if err != nil {
		if err == pgx.ErrNoRows {
			return false, nil
		}
		return false, err
	}
	if leadID.Valid && orderLead.Valid && leadID.Int64 == orderLead.Int64 {
		return true, nil
	}
	return leadWA != "" && leadWA == email, nil
}

// ClientOrder is the portal order view.
type ClientOrder struct {
	ID          string            `json:"id"`
	Status      string            `json:"status"`
	TotalAmount float64           `json:"totalAmount"`
	BriefData   json.RawMessage   `json:"briefData"`
	CurrentStep int               `json:"currentStep"`
	HandoffURL  *string           `json:"handoffUrl"`
	CreatedAt   time.Time         `json:"createdAt"`
	UpdatedAt   time.Time         `json:"updatedAt"`
	PackageName string            `json:"packageName"`
	Progress    map[string]any    `json:"progress"`
	Milestones  []ClientMilestone `json:"milestones,omitempty"`
}

// ClientMilestone is the client-visible milestone.
type ClientMilestone struct {
	ID          int64      `json:"id"`
	Title       string     `json:"title"`
	Description *string    `json:"description"`
	CoverURL    *string    `json:"coverUrl"`
	Category    string     `json:"category"`
	Status      string     `json:"status"`
	ViewedAt    *time.Time `json:"viewedAt"`
	DecidedAt   *time.Time `json:"decidedAt"`
	CreatedAt   time.Time  `json:"createdAt"`
	UpdatedAt   time.Time  `json:"updatedAt"`
}

// ListMyOrders returns orders visible to the user.
func (s *Store) ListMyOrders(ctx context.Context, userID int64, role string) ([]ClientOrder, error) {
	var (
		leadID pgtype.Int8
		email  string
	)
	if err := s.pool.QueryRow(ctx, `SELECT lead_id, email FROM users WHERE id = $1`, userID).Scan(&leadID, &email); err != nil {
		return nil, err
	}

	where := `o.deleted_at IS NULL`
	args := []any{}
	if role != "SUPERADMIN" && role != "EDITOR" {
		// Match by lead or by lead-WhatsApp == email, mirroring the original.
		where += ` AND (o.lead_id = $1 OR l.whatsapp = $2)`
		if leadID.Valid {
			args = append(args, leadID.Int64)
		} else {
			args = append(args, -1)
		}
		args = append(args, email)
	}
	rows, err := s.pool.Query(ctx, `SELECT o.id, o.status, o.total_amount, o.brief_data, o.current_step,
			o.handoff_url, o.created_at, o.updated_at, p.name
		FROM orders o JOIN leads l ON l.id = o.lead_id JOIN packages p ON p.id = o.package_id
		WHERE `+where+` ORDER BY o.created_at DESC LIMIT 100`, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []ClientOrder{}
	for rows.Next() {
		var (
			o       ClientOrder
			amount  pgtype.Numeric
			brief   []byte
			handoff pgtype.Text
		)
		if err := rows.Scan(&o.ID, &o.Status, &amount, &brief, &o.CurrentStep,
			&handoff, &o.CreatedAt, &o.UpdatedAt, &o.PackageName); err != nil {
			return nil, err
		}
		o.TotalAmount = numericFloat(amount)
		o.BriefData = jsonRaw(brief)
		o.HandoffURL = textPtr(handoff)
		o.Progress = map[string]any{"currentStep": o.CurrentStep, "status": o.Status}
		out = append(out, o)
	}
	return out, rows.Err()
}

// ListMilestones returns client-visible (non-draft) milestones with view state.
func (s *Store) ListMilestones(ctx context.Context, orderID string, userID int64) ([]ClientMilestone, error) {
	rows, err := s.pool.Query(ctx, `SELECT m.id, m.title, m.description, m.cover_url, m.category, m.status,
			v.viewed_at, m.decided_at, m.created_at, m.updated_at
		FROM order_milestones m LEFT JOIN milestone_views v ON v.milestone_id = m.id AND v.user_id = $2
		WHERE m.order_id = $1 AND m.status <> 'DRAFT' ORDER BY m.created_at ASC`, orderID, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []ClientMilestone{}
	for rows.Next() {
		var (
			m       ClientMilestone
			desc    pgtype.Text
			cover   pgtype.Text
			viewed  pgtype.Timestamptz
			decided pgtype.Timestamptz
		)
		if err := rows.Scan(&m.ID, &m.Title, &desc, &cover, &m.Category, &m.Status,
			&viewed, &decided, &m.CreatedAt, &m.UpdatedAt); err != nil {
			return nil, err
		}
		m.Description = textPtr(desc)
		m.CoverURL = textPtr(cover)
		m.ViewedAt = timePtr(viewed)
		m.DecidedAt = timePtr(decided)
		out = append(out, m)
	}
	return out, rows.Err()
}

// MarkViewed records a milestone view.
func (s *Store) MarkViewed(ctx context.Context, milestoneID, userID int64) error {
	_, err := s.pool.Exec(ctx, `INSERT INTO milestone_views (milestone_id, user_id, viewed_at)
		VALUES ($1,$2,now()) ON CONFLICT (milestone_id, user_id) DO UPDATE SET viewed_at = now()`,
		milestoneID, userID)
	if err != nil {
		return err
	}
	_, err = s.pool.Exec(ctx, `UPDATE order_milestones SET viewed_at = now() WHERE id = $1 AND viewed_at IS NULL`, milestoneID)
	return err
}

// DecideMilestone applies a client decision.
func (s *Store) DecideMilestone(ctx context.Context, milestoneID, userID int64, action, note, orderID string) (map[string]any, error) {
	var (
		current string
		title   string
		belongs bool
	)
	err := s.pool.QueryRow(ctx, `SELECT status, title, order_id = $2 FROM order_milestones WHERE id = $1`,
		milestoneID, orderID).Scan(&current, &title, &belongs)
	if err != nil {
		return nil, err
	}
	if !belongs {
		return nil, errForbidden("milestone does not belong to this order")
	}
	if current == "APPROVED" || current == "REJECTED" {
		return nil, errConflict("Already decided")
	}
	status := "REVISION_NEEDED"
	activityType := "MILESTONE_REVISION_REQUESTED"
	if action == "APPROVE" {
		status = "APPROVED"
		activityType = "MILESTONE_APPROVED"
	}
	var decidedAt time.Time
	if err := s.pool.QueryRow(ctx, `UPDATE order_milestones SET status = $1, decided_at = now()
		WHERE id = $2 RETURNING decided_at`, status, milestoneID).Scan(&decidedAt); err != nil {
		return nil, err
	}
	message := "Client approved: " + title
	if action != "APPROVE" {
		message = "Client requested revision: " + title
		if note != "" {
			message += " — " + note
		}
	}
	meta := `{"milestoneId":` + itoa64(milestoneID) + `}`
	if _, err := s.pool.Exec(ctx, `INSERT INTO order_activities (order_id, actor_id, type, message, meta)
		VALUES ($1,$2,$3,$4,$5::jsonb)`, orderID, userID, activityType, message, meta); err != nil {
		return nil, err
	}
	if err := s.MarkViewed(ctx, milestoneID, userID); err != nil {
		return nil, err
	}
	return map[string]any{"id": milestoneID, "status": status, "decidedAt": decidedAt}, nil
}

// Request is a client request.
type Request struct {
	ID               int64     `json:"id"`
	UserID           *int64    `json:"userId"`
	OrderID          *string   `json:"orderId"`
	Type             string    `json:"type"`
	Title            string    `json:"title"`
	Body             string    `json:"body"`
	Status           string    `json:"status"`
	AdminNote        *string   `json:"adminNote"`
	DriveURL         *string   `json:"driveUrl"`
	CalendlyEventURL *string   `json:"calendlyEventUrl"`
	CreatedAt        time.Time `json:"createdAt"`
	UpdatedAt        time.Time `json:"updatedAt"`
	User             *struct {
		Email    string `json:"email"`
		Username string `json:"username"`
	} `json:"User,omitempty"`
}

// ListMyRequests returns the user's requests.
func (s *Store) ListMyRequests(ctx context.Context, userID int64) ([]Request, error) {
	return s.listRequests(ctx, `WHERE r.user_id = $1 AND r.deleted_at IS NULL ORDER BY r.created_at DESC LIMIT 100`, []any{userID})
}

// ListAllRequestsAdmin returns every request.
func (s *Store) ListAllRequestsAdmin(ctx context.Context, status string) ([]Request, error) {
	where := `WHERE r.deleted_at IS NULL`
	args := []any{}
	if status != "" {
		args = append(args, status)
		where += ` AND r.status = $1`
	}
	return s.listRequests(ctx, where+` ORDER BY r.created_at DESC LIMIT 200`, args)
}

func (s *Store) listRequests(ctx context.Context, where string, args []any) ([]Request, error) {
	rows, err := s.pool.Query(ctx, `SELECT r.id, r.user_id, r.order_id, r.type, r.title, r.body, r.status,
		r.admin_note, r.drive_url, r.calendly_event_url, r.created_at, r.updated_at, u.email, u.username
		FROM client_requests r LEFT JOIN users u ON u.id = r.user_id `+where, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []Request{}
	for rows.Next() {
		var (
			r     Request
			user  pgtype.Int8
			order pgtype.UUID
			note  pgtype.Text
			drive pgtype.Text
			cal   pgtype.Text
			email pgtype.Text
			uname pgtype.Text
		)
		if err := rows.Scan(&r.ID, &user, &order, &r.Type, &r.Title, &r.Body, &r.Status,
			&note, &drive, &cal, &r.CreatedAt, &r.UpdatedAt, &email, &uname); err != nil {
			return nil, err
		}
		r.UserID = int8Ptr(user)
		r.OrderID = uuidPtr(order)
		r.AdminNote = textPtr(note)
		r.DriveURL = textPtr(drive)
		r.CalendlyEventURL = textPtr(cal)
		if email.Valid {
			r.User = &struct {
				Email    string `json:"email"`
				Username string `json:"username"`
			}{Email: email.String, Username: uname.String}
		}
		out = append(out, r)
	}
	return out, rows.Err()
}

// CreateRequest inserts a client request.
func (s *Store) CreateRequest(ctx context.Context, userID int64, orderID *string, reqType, title, body string) (*Request, error) {
	var (
		r     Request
		user  pgtype.Int8
		order pgtype.UUID
		note  pgtype.Text
		drive pgtype.Text
		cal   pgtype.Text
	)
	err := s.pool.QueryRow(ctx, `INSERT INTO client_requests (user_id, order_id, type, title, body)
		VALUES ($1,$2,$3,$4,$5)
		RETURNING id, user_id, order_id, type, title, body, status, admin_note, drive_url, calendly_event_url, created_at, updated_at`,
		userID, orderID, reqType, title, body,
	).Scan(&r.ID, &user, &order, &r.Type, &r.Title, &r.Body, &r.Status,
		&note, &drive, &cal, &r.CreatedAt, &r.UpdatedAt)
	if err != nil {
		return nil, err
	}
	r.UserID = int8Ptr(user)
	r.OrderID = uuidPtr(order)
	r.AdminNote = textPtr(note)
	r.DriveURL = textPtr(drive)
	r.CalendlyEventURL = textPtr(cal)
	return &r, nil
}

// DecideRequest applies an admin decision.
func (s *Store) DecideRequest(ctx context.Context, id int64, status string, adminNote, driveURL, calendlyURL *string) (*Request, error) {
	var (
		r     Request
		user  pgtype.Int8
		order pgtype.UUID
		note  pgtype.Text
		drive pgtype.Text
		cal   pgtype.Text
	)
	err := s.pool.QueryRow(ctx, `UPDATE client_requests SET status = $1, admin_note = $2, drive_url = $3,
		calendly_event_url = $4 WHERE id = $5 AND deleted_at IS NULL
		RETURNING id, user_id, order_id, type, title, body, status, admin_note, drive_url, calendly_event_url, created_at, updated_at`,
		status, adminNote, driveURL, calendlyURL, id,
	).Scan(&r.ID, &user, &order, &r.Type, &r.Title, &r.Body, &r.Status,
		&note, &drive, &cal, &r.CreatedAt, &r.UpdatedAt)
	if err != nil {
		return nil, err
	}
	r.UserID = int8Ptr(user)
	r.OrderID = uuidPtr(order)
	r.AdminNote = textPtr(note)
	r.DriveURL = textPtr(drive)
	r.CalendlyEventURL = textPtr(cal)
	return &r, nil
}

// SubmitFeedback stores a testimonial on the linked project.
func (s *Store) SubmitFeedback(ctx context.Context, orderID, quote, authorName string) (map[string]any, error) {
	var (
		status   string
		project  pgtype.Int8
		existing pgtype.Text
	)
	err := s.pool.QueryRow(ctx, `SELECT o.status, p.id, p.testimonial_quote FROM orders o
		LEFT JOIN projects p ON p.order_id = o.id AND p.deleted_at IS NULL
		WHERE o.id = $1 AND o.deleted_at IS NULL`, orderID).Scan(&status, &project, &existing)
	if err != nil {
		return nil, err
	}
	if existing.Valid && existing.String != "" {
		return nil, errConflict("Feedback already submitted")
	}
	if !project.Valid {
		return nil, errForbidden("Project is still being finalized for portfolio")
	}
	if status != "COMPLETED" {
		return nil, errForbidden("Project is not yet completed")
	}
	var out struct {
		ID                int64   `json:"id"`
		TestimonialQuote  *string `json:"testimonialQuote"`
		TestimonialAuthor *string `json:"testimonialAuthor"`
	}
	var (
		quoteOut  pgtype.Text
		authorOut pgtype.Text
	)
	if err := s.pool.QueryRow(ctx, `UPDATE projects SET testimonial_quote = $1, testimonial_author = $2
		WHERE id = $3 RETURNING id, testimonial_quote, testimonial_author`,
		quote, authorName, project.Int64).Scan(&out.ID, &quoteOut, &authorOut); err != nil {
		return nil, err
	}
	out.TestimonialQuote = textPtr(quoteOut)
	out.TestimonialAuthor = textPtr(authorOut)
	return map[string]any{
		"id": out.ID, "testimonialQuote": out.TestimonialQuote, "testimonialAuthor": out.TestimonialAuthor,
	}, nil
}

// RequestAuthor returns the request owner's display info.
func (s *Store) RequestAuthor(ctx context.Context, requestID int64) (userID int64, email, username string, err error) {
	err = s.pool.QueryRow(ctx, `SELECT u.id, u.email, u.username FROM client_requests r
		JOIN users u ON u.id = r.user_id WHERE r.id = $1`, requestID).Scan(&userID, &email, &username)
	return userID, email, username, err
}

// LeadNameForOrder returns the lead display name for feedback authorship.
func (s *Store) LeadNameForOrder(ctx context.Context, orderID string) (name, business string, err error) {
	var biz pgtype.Text
	err = s.pool.QueryRow(ctx, `SELECT l.name, l.business_name FROM orders o
		JOIN leads l ON l.id = o.lead_id WHERE o.id = $1`, orderID).Scan(&name, &biz)
	if biz.Valid {
		business = biz.String
	}
	return name, business, err
}
