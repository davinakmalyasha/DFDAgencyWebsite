package intake

import (
	"context"
	"encoding/json"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
)

// Store owns intake writes.
type Store struct {
	pool interface {
		Query(ctx context.Context, sql string, args ...any) (pgx.Rows, error)
		QueryRow(ctx context.Context, sql string, args ...any) pgx.Row
		Begin(ctx context.Context) (pgx.Tx, error)
	}
}

// NewStore builds an intake Store. The pool is the pgx pool; the narrow
// interface keeps the store testable.
func NewStore(pool interface {
	Query(ctx context.Context, sql string, args ...any) (pgx.Rows, error)
	QueryRow(ctx context.Context, sql string, args ...any) pgx.Row
	Begin(ctx context.Context) (pgx.Tx, error)
},
) *Store {
	return &Store{pool: pool}
}

// Lead is a created inquiry.
type Lead struct {
	ID           int64     `json:"id"`
	Name         string    `json:"name"`
	Whatsapp     string    `json:"whatsapp"`
	BusinessName *string   `json:"businessName"`
	Message      *string   `json:"message"`
	Status       string    `json:"status"`
	CreatedAt    time.Time `json:"createdAt"`
}

// CreatedOrder is the order intake result.
type CreatedOrder struct {
	ID          string    `json:"id"`
	TotalAmount float64   `json:"totalAmount"`
	Status      string    `json:"status"`
	LeadID      int64     `json:"leadId"`
	PackageID   int64     `json:"packageId"`
	CreatedAt   time.Time `json:"createdAt"`
	IsDuplicate bool      `json:"isDuplicate,omitempty"`
}

// CreateLead inserts a public inquiry.
func (s *Store) CreateLead(ctx context.Context, req CreateLeadRequest) (*Lead, error) {
	var (
		l   Lead
		biz pgtype.Text
		msg pgtype.Text
	)
	err := s.pool.QueryRow(ctx, `INSERT INTO leads (name, whatsapp, business_name, message)
		VALUES ($1,$2,$3,$4) RETURNING id, name, whatsapp, business_name, message, status, created_at`,
		strings.TrimSpace(req.Name), strings.TrimSpace(req.Whatsapp), req.BusinessName, req.Message,
	).Scan(&l.ID, &l.Name, &l.Whatsapp, &biz, &msg, &l.Status, &l.CreatedAt)
	if err != nil {
		return nil, err
	}
	l.BusinessName = textPtr(biz)
	l.Message = textPtr(msg)
	return &l, nil
}

// CreateOrder runs the full intake transaction: idempotency check, lead
// find-or-create, package pricing, order + UNPAID payment rows, and an
// ORDER_CREATED activity. It mirrors the original Express semantics exactly.
func (s *Store) CreateOrder(ctx context.Context, req CreateOrderRequest, idempotencyKey string) (*CreatedOrder, error) {
	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback(ctx)

	// 1. Idempotency: return the existing order untouched.
	if idempotencyKey != "" {
		var existing CreatedOrder
		var amount pgtype.Numeric
		err := tx.QueryRow(ctx, `SELECT id, total_amount, status, lead_id, package_id, created_at
			FROM orders WHERE idempotency_key = $1`, idempotencyKey,
		).Scan(&existing.ID, &amount, &existing.Status, &existing.LeadID, &existing.PackageID, &existing.CreatedAt)
		if err == nil {
			existing.TotalAmount = numericFloat(amount)
			existing.IsDuplicate = true
			return &existing, nil
		}
		if err != pgx.ErrNoRows {
			return nil, err
		}
	}

	// 2. Find-or-create lead by WhatsApp.
	whatsapp := strings.TrimSpace(req.Whatsapp)
	var leadID int64
	err = tx.QueryRow(ctx, `SELECT id FROM leads WHERE whatsapp = $1 AND deleted_at IS NULL`, whatsapp).Scan(&leadID)
	if err == pgx.ErrNoRows {
		err = tx.QueryRow(ctx, `INSERT INTO leads (name, whatsapp, business_name)
			VALUES ($1,$2,$3) RETURNING id`,
			strings.TrimSpace(req.Name), whatsapp, req.BusinessName).Scan(&leadID)
		if err != nil {
			return nil, err
		}
	} else if err != nil {
		return nil, err
	} else {
		_, err = tx.Exec(ctx, `UPDATE leads SET name = $1,
			business_name = COALESCE($2, business_name) WHERE id = $3`,
			strings.TrimSpace(req.Name), req.BusinessName, leadID)
		if err != nil {
			return nil, err
		}
	}

	// 3. Package pricing: discount wins when present.
	var (
		price    pgtype.Numeric
		discount pgtype.Numeric
	)
	if err := tx.QueryRow(ctx, `SELECT price, discount_price FROM packages
		WHERE id = $1 AND deleted_at IS NULL`, req.PackageID).Scan(&price, &discount); err != nil {
		return nil, err
	}
	total := numericFloat(price)
	if d := numericFloatPtr(discount); d != nil {
		total = *d
	}

	// 4. Order + UNPAID payment.
	brief := []byte(`{}`)
	if len(req.BriefData) > 0 {
		brief = req.BriefData
	}
	var created CreatedOrder
	var amount pgtype.Numeric
	idem := nullIfEmpty(idempotencyKey)
	err = tx.QueryRow(ctx, `INSERT INTO orders
		(lead_id, package_id, total_amount, brief_data, agreed_to_terms_at, status, idempotency_key)
		VALUES ($1,$2,$3,$4,now(),'PENDING_PAYMENT',$5)
		RETURNING id, total_amount, status, lead_id, package_id, created_at`,
		leadID, req.PackageID, total, brief, idem,
	).Scan(&created.ID, &amount, &created.Status, &created.LeadID, &created.PackageID, &created.CreatedAt)
	if err != nil {
		return nil, err
	}
	created.TotalAmount = numericFloat(amount)

	if _, err := tx.Exec(ctx, `INSERT INTO payments (order_id, payment_method, payment_status)
		VALUES ($1,'MANUAL','UNPAID')`, created.ID); err != nil {
		return nil, err
	}

	meta, _ := json.Marshal(map[string]any{"packageId": req.PackageID, "totalAmount": total})
	if _, err := tx.Exec(ctx, `INSERT INTO order_activities (order_id, type, message, meta)
		VALUES ($1,'ORDER_CREATED',$2,$3)`, created.ID,
		"New order placed", meta); err != nil {
		return nil, err
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, err
	}
	return &created, nil
}

// LeadWhatsappForOrder returns the lead WhatsApp for magic-link comparison.
func (s *Store) LeadWhatsappForOrder(ctx context.Context, orderID string) (string, error) {
	var whatsapp string
	err := s.pool.QueryRow(ctx, `SELECT l.whatsapp FROM orders o
		JOIN leads l ON l.id = o.lead_id
		WHERE o.id = $1 AND o.deleted_at IS NULL`, orderID).Scan(&whatsapp)
	return whatsapp, err
}

// ClientNote is a note submitted by the client.
type ClientNote struct {
	ID        int64     `json:"id"`
	OrderID   string    `json:"orderId"`
	Content   string    `json:"content"`
	IsPublic  bool      `json:"isPublic"`
	IsClient  bool      `json:"isClient"`
	IsEdited  bool      `json:"isEdited"`
	ParentID  *int64    `json:"parentId"`
	CreatedAt time.Time `json:"createdAt"`
}

// CreateClientNote inserts a public client note.
func (s *Store) CreateClientNote(ctx context.Context, orderID, content string, parentID *int64) (*ClientNote, error) {
	var (
		n      ClientNote
		parent pgtype.Int8
	)
	err := s.pool.QueryRow(ctx, `INSERT INTO order_notes (order_id, content, is_public, is_client, parent_id)
		VALUES ($1,$2,TRUE,TRUE,$3)
		RETURNING id, order_id, content, is_public, is_client, is_edited, parent_id, created_at`,
		orderID, content, parentID,
	).Scan(&n.ID, &n.OrderID, &n.Content, &n.IsPublic, &n.IsClient, &n.IsEdited, &parent, &n.CreatedAt)
	if err != nil {
		return nil, err
	}
	n.ParentID = int8Ptr(parent)
	return &n, nil
}

func int8Ptr(n pgtype.Int8) *int64 {
	if !n.Valid {
		return nil
	}
	v := n.Int64
	return &v
}

// TrackLocked returns the zero-PII locked tracker payload.
func (s *Store) TrackLocked(ctx context.Context, orderID string) (map[string]any, error) {
	var (
		id        string
		status    string
		pkgName   string
		createdAt time.Time
		updatedAt time.Time
	)
	err := s.pool.QueryRow(ctx, `SELECT o.id, o.status, p.name, o.created_at, o.updated_at
		FROM orders o JOIN packages p ON p.id = o.package_id
		WHERE o.id = $1 AND o.deleted_at IS NULL`, orderID,
	).Scan(&id, &status, &pkgName, &createdAt, &updatedAt)
	if err != nil {
		return nil, err
	}
	return map[string]any{
		"id": id, "status": status, "packageName": pkgName,
		"createdAt": createdAt, "updatedAt": updatedAt, "isLocked": true,
	}, nil
}

// TrackUnlocked returns the full tracker payload (public notes only, no PII).
func (s *Store) TrackUnlocked(ctx context.Context, orderID string) (*OrderTrack, error) {
	var (
		t        OrderTrack
		amount   pgtype.Numeric
		brief    []byte
		driveURL pgtype.Text
		biz      pgtype.Text
		features []byte
	)
	err := s.pool.QueryRow(ctx, `SELECT o.id, o.status, o.total_amount, o.brief_data,
			o.created_at, o.updated_at, o.drive_folder_url,
			l.name, l.business_name, p.id, p.name, p.features
		FROM orders o
		JOIN leads l ON l.id = o.lead_id
		JOIN packages p ON p.id = o.package_id
		WHERE o.id = $1 AND o.deleted_at IS NULL`, orderID,
	).Scan(&t.ID, &t.Status, &amount, &brief, &t.CreatedAt, &t.UpdatedAt, &driveURL,
		&t.Lead.Name, &biz, &t.Package.ID, &t.Package.Name, &features)
	if err != nil {
		return nil, err
	}
	t.TotalAmount = numericFloat(amount)
	t.BriefData = jsonRaw(brief)
	t.Lead.BusinessName = textPtr(biz)
	t.Package.Features = jsonRaw(features)
	if driveURL.Valid && (t.Status == "PROCESSING" || t.Status == "REVISION" || t.Status == "COMPLETED") {
		v := driveURL.String
		t.HandoffURL = &v
	}

	noteRows, err := s.pool.Query(ctx, `SELECT n.id, n.content, n.created_at, u.username
		FROM order_notes n LEFT JOIN users u ON u.id = n.author_id
		WHERE n.order_id = $1 AND n.is_public = TRUE AND n.is_deleted = FALSE
		ORDER BY n.created_at DESC`, orderID)
	if err != nil {
		return nil, err
	}
	defer noteRows.Close()
	for noteRows.Next() {
		var (
			n struct {
				ID        int64     `json:"id"`
				Content   string    `json:"content"`
				CreatedAt time.Time `json:"createdAt"`
				Author    *string   `json:"author"`
			}
			author pgtype.Text
		)
		if err := noteRows.Scan(&n.ID, &n.Content, &n.CreatedAt, &author); err != nil {
			return nil, err
		}
		n.Author = textPtr(author)
		t.Notes = append(t.Notes, n)
	}
	if err := noteRows.Err(); err != nil {
		return nil, err
	}

	resRows, err := s.pool.Query(ctx, `SELECT id, title, url, icon, created_at FROM order_resources
		WHERE order_id = $1 ORDER BY created_at DESC`, orderID)
	if err != nil {
		return nil, err
	}
	defer resRows.Close()
	for resRows.Next() {
		var (
			r struct {
				ID        int64     `json:"id"`
				Title     string    `json:"title"`
				URL       string    `json:"url"`
				Icon      *string   `json:"icon"`
				CreatedAt time.Time `json:"createdAt"`
			}
			icon pgtype.Text
		)
		if err := resRows.Scan(&r.ID, &r.Title, &r.URL, &icon, &r.CreatedAt); err != nil {
			return nil, err
		}
		r.Icon = textPtr(icon)
		t.Resources = append(t.Resources, r)
	}
	if err := resRows.Err(); err != nil {
		return nil, err
	}

	msRows, err := s.pool.Query(ctx, `SELECT id, title, description, cover_url, category, status, created_at, updated_at
		FROM order_milestones WHERE order_id = $1 AND status <> 'DRAFT' ORDER BY created_at ASC`, orderID)
	if err != nil {
		return nil, err
	}
	defer msRows.Close()
	for msRows.Next() {
		var (
			m struct {
				ID          int64     `json:"id"`
				Title       string    `json:"title"`
				Description *string   `json:"description"`
				CoverURL    *string   `json:"coverUrl"`
				Category    string    `json:"category"`
				Status      string    `json:"status"`
				CreatedAt   time.Time `json:"createdAt"`
				UpdatedAt   time.Time `json:"updatedAt"`
			}
			desc  pgtype.Text
			cover pgtype.Text
		)
		if err := msRows.Scan(&m.ID, &m.Title, &desc, &cover, &m.Category, &m.Status, &m.CreatedAt, &m.UpdatedAt); err != nil {
			return nil, err
		}
		m.Description = textPtr(desc)
		m.CoverURL = textPtr(cover)
		t.Milestones = append(t.Milestones, m)
	}
	if err := msRows.Err(); err != nil {
		return nil, err
	}

	t.IsLocked = false
	return &t, nil
}

// OrderTrack is the unlocked tracker payload (public notes only, no PII).
type OrderTrack struct {
	ID          string          `json:"id"`
	Status      string          `json:"status"`
	TotalAmount float64         `json:"totalAmount"`
	BriefData   json.RawMessage `json:"briefData"`
	CreatedAt   time.Time       `json:"createdAt"`
	UpdatedAt   time.Time       `json:"updatedAt"`
	HandoffURL  *string         `json:"handoffUrl"`
	Lead        struct {
		Name         string  `json:"name"`
		BusinessName *string `json:"businessName"`
	} `json:"Lead"`
	Package struct {
		ID       int64           `json:"id"`
		Name     string          `json:"name"`
		Features json.RawMessage `json:"features"`
	} `json:"Package"`
	Notes []struct {
		ID        int64     `json:"id"`
		Content   string    `json:"content"`
		CreatedAt time.Time `json:"createdAt"`
		Author    *string   `json:"author"`
	} `json:"Notes"`
	Resources []struct {
		ID        int64     `json:"id"`
		Title     string    `json:"title"`
		URL       string    `json:"url"`
		Icon      *string   `json:"icon"`
		CreatedAt time.Time `json:"createdAt"`
	} `json:"Resources"`
	Milestones []struct {
		ID          int64     `json:"id"`
		Title       string    `json:"title"`
		Description *string   `json:"description"`
		CoverURL    *string   `json:"coverUrl"`
		Category    string    `json:"category"`
		Status      string    `json:"status"`
		CreatedAt   time.Time `json:"createdAt"`
		UpdatedAt   time.Time `json:"updatedAt"`
	} `json:"Milestones"`
	IsLocked bool `json:"isLocked"`
}
