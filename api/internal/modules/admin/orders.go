package admin

import (
	"context"
	"encoding/json"
	"fmt"
	"regexp"
	"strings"
	"time"

	"github.com/jackc/pgx/v5/pgtype"
)

// AdminOrder is the back-office order list view.
type AdminOrder struct {
	ID             string          `json:"id"`
	IdempotencyKey *string         `json:"idempotencyKey"`
	TotalAmount    float64         `json:"totalAmount"`
	Status         string          `json:"status"`
	BriefData      json.RawMessage `json:"briefData"`
	CreatedAt      time.Time       `json:"createdAt"`
	CurrentStep    int             `json:"currentStep"`
	HandoffURL     *string         `json:"handoffUrl"`
	Lead           OrderLead       `json:"Lead"`
	Package        OrderPackage    `json:"Package"`
	Project        *OrderProject   `json:"Project,omitempty"`
	NotesCount     int             `json:"_count,omitempty"`
}

// OrderLead is the compact lead reference.
type OrderLead struct {
	ID           int64   `json:"id"`
	Name         string  `json:"name"`
	Whatsapp     string  `json:"whatsapp"`
	BusinessName *string `json:"businessName"`
}

// OrderPackage is the compact package reference.
type OrderPackage struct {
	ID   int64  `json:"id"`
	Name string `json:"name"`
}

// OrderProject is the compact project reference.
type OrderProject struct {
	ID    int64  `json:"id"`
	Title string `json:"title"`
}

// ListOrders returns orders newest first with a total count.
func (s *Store) ListOrders(ctx context.Context, limit, offset int) ([]AdminOrder, int64, error) {
	var total int64
	if err := s.pool.QueryRow(ctx, `SELECT count(*) FROM orders WHERE deleted_at IS NULL`).Scan(&total); err != nil {
		return nil, 0, err
	}
	rows, err := s.pool.Query(ctx, `SELECT o.id, o.idempotency_key, o.total_amount, o.status,
			o.brief_data, o.created_at, o.current_step, o.handoff_url,
			l.id, l.name, l.whatsapp, l.business_name,
			p.id, p.name,
			pr.id, pr.title,
			(SELECT count(*) FROM order_notes n WHERE n.order_id = o.id AND n.is_deleted = FALSE)
		FROM orders o
		JOIN leads l ON l.id = o.lead_id
		JOIN packages p ON p.id = o.package_id
		LEFT JOIN projects pr ON pr.order_id = o.id AND pr.deleted_at IS NULL
		WHERE o.deleted_at IS NULL
		ORDER BY o.created_at DESC LIMIT $1 OFFSET $2`, limit, offset)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()
	out := []AdminOrder{}
	for rows.Next() {
		var (
			o       AdminOrder
			idem    pgtype.Text
			amount  pgtype.Numeric
			brief   []byte
			handoff pgtype.Text
			biz     pgtype.Text
			prID    pgtype.Int8
			prTitle pgtype.Text
		)
		if err := rows.Scan(&o.ID, &idem, &amount, &o.Status, &brief, &o.CreatedAt, &o.CurrentStep, &handoff,
			&o.Lead.ID, &o.Lead.Name, &o.Lead.Whatsapp, &biz,
			&o.Package.ID, &o.Package.Name,
			&prID, &prTitle, &o.NotesCount); err != nil {
			return nil, 0, err
		}
		o.IdempotencyKey = textPtr(idem)
		o.TotalAmount = numericFloat(amount)
		o.BriefData = jsonRaw(brief)
		o.HandoffURL = textPtr(handoff)
		o.Lead.BusinessName = textPtr(biz)
		if prID.Valid {
			o.Project = &OrderProject{ID: prID.Int64}
			if prTitle.Valid {
				o.Project.Title = prTitle.String
			}
		}
		out = append(out, o)
	}
	return out, total, rows.Err()
}

// AdminOrderDetail is the full back-office order view (with PII).
type AdminOrderDetail struct {
	AdminOrder
	LeadFull struct {
		ID           int64   `json:"id"`
		Name         string  `json:"name"`
		Whatsapp     string  `json:"whatsapp"`
		BusinessName *string `json:"businessName"`
	} `json:"Lead"`
	Payments []OrderPayment `json:"Payments"`
}

// OrderPayment is a payment row.
type OrderPayment struct {
	ID            string     `json:"id"`
	PaymentMethod string     `json:"paymentMethod"`
	PaymentStatus string     `json:"paymentStatus"`
	PaidAt        *time.Time `json:"paidAt"`
}

// GetOrder returns the admin order detail.
func (s *Store) GetOrder(ctx context.Context, id string) (*AdminOrderDetail, error) {
	var (
		d       AdminOrderDetail
		idem    pgtype.Text
		amount  pgtype.Numeric
		brief   []byte
		handoff pgtype.Text
		biz     pgtype.Text
		prID    pgtype.Int8
		prTitle pgtype.Text
		prSlug  pgtype.Text
	)
	err := s.pool.QueryRow(ctx, `SELECT o.id, o.idempotency_key, o.total_amount, o.status,
			o.brief_data, o.created_at, o.current_step, o.handoff_url,
			l.id, l.name, l.whatsapp, l.business_name,
			p.id, p.name,
			pr.id, pr.title, pr.slug
		FROM orders o
		JOIN leads l ON l.id = o.lead_id
		JOIN packages p ON p.id = o.package_id
		LEFT JOIN projects pr ON pr.order_id = o.id AND pr.deleted_at IS NULL
		WHERE o.id = $1 AND o.deleted_at IS NULL`, id,
	).Scan(&d.ID, &idem, &amount, &d.Status, &brief, &d.CreatedAt, &d.CurrentStep, &handoff,
		&d.LeadFull.ID, &d.LeadFull.Name, &d.LeadFull.Whatsapp, &biz,
		&d.Package.ID, &d.Package.Name, &prID, &prTitle, &prSlug)
	if err != nil {
		return nil, err
	}
	d.IdempotencyKey = textPtr(idem)
	d.TotalAmount = numericFloat(amount)
	d.BriefData = jsonRaw(brief)
	d.HandoffURL = textPtr(handoff)
	d.LeadFull.BusinessName = textPtr(biz)
	d.Lead = OrderLead{ID: d.LeadFull.ID, Name: d.LeadFull.Name, Whatsapp: d.LeadFull.Whatsapp, BusinessName: d.LeadFull.BusinessName}
	d.Package = OrderPackage{ID: d.Package.ID, Name: d.Package.Name}
	if prID.Valid {
		title := ""
		if prTitle.Valid {
			title = prTitle.String
		}
		d.Project = &OrderProject{ID: prID.Int64, Title: title}
	}

	payRows, err := s.pool.Query(ctx, `SELECT id, payment_method, payment_status, paid_at FROM payments
		WHERE order_id = $1 ORDER BY created_at`, id)
	if err != nil {
		return nil, err
	}
	defer payRows.Close()
	for payRows.Next() {
		var (
			p    OrderPayment
			paid pgtype.Timestamptz
		)
		if err := payRows.Scan(&p.ID, &p.PaymentMethod, &p.PaymentStatus, &paid); err != nil {
			return nil, err
		}
		p.PaidAt = timePtr(paid)
		d.Payments = append(d.Payments, p)
	}
	return &d, payRows.Err()
}

// stepForStatus maps status to the tracker step.
func stepForStatus(status string) int {
	switch status {
	case "PENDING_PAYMENT":
		return 1
	case "PROCESSING":
		return 2
	case "REVISION":
		return 3
	case "COMPLETED":
		return 4
	default:
		return 0
	}
}

// UpdateOrderStatus sets status, handoff URL, and the derived step.
func (s *Store) UpdateOrderStatus(ctx context.Context, id, status string, handoffURL *string) (map[string]any, error) {
	var out struct {
		ID          string    `json:"id"`
		Status      string    `json:"status"`
		HandoffURL  *string   `json:"handoffUrl"`
		CurrentStep int       `json:"currentStep"`
		UpdatedAt   time.Time `json:"updatedAt"`
	}
	var handoff pgtype.Text
	err := s.pool.QueryRow(ctx, `UPDATE orders SET status = $1, handoff_url = $2, current_step = $3
		WHERE id = $4 AND deleted_at IS NULL
		RETURNING id, status, handoff_url, current_step, updated_at`,
		status, handoffURL, stepForStatus(status), id,
	).Scan(&out.ID, &out.Status, &handoff, &out.CurrentStep, &out.UpdatedAt)
	if err != nil {
		return nil, err
	}
	out.HandoffURL = textPtr(handoff)
	return map[string]any{
		"id": out.ID, "status": out.Status, "handoffUrl": out.HandoffURL,
		"currentStep": out.CurrentStep, "updatedAt": out.UpdatedAt,
	}, nil
}

// SoftDeleteOrder soft-deletes an order.
func (s *Store) SoftDeleteOrder(ctx context.Context, id string) error {
	_, err := s.pool.Exec(ctx, `UPDATE orders SET deleted_at = now() WHERE id = $1 AND deleted_at IS NULL`, id)
	return err
}

var slugRe = regexp.MustCompile(`[^a-z0-9]+`)

// PromoteOrder creates a portfolio project from a COMPLETED order.
func (s *Store) PromoteOrder(ctx context.Context, orderID string) (map[string]any, error) {
	var (
		status     string
		brief      []byte
		clientName string
		biz        pgtype.Text
		pkgName    string
		existing   pgtype.Int8
	)
	err := s.pool.QueryRow(ctx, `SELECT o.status, o.brief_data, l.name, l.business_name, p.name,
			(SELECT pr.id FROM projects pr WHERE pr.order_id = o.id AND pr.deleted_at IS NULL LIMIT 1)
		FROM orders o
		JOIN leads l ON l.id = o.lead_id
		JOIN packages p ON p.id = o.package_id
		WHERE o.id = $1 AND o.deleted_at IS NULL`, orderID,
	).Scan(&status, &brief, &clientName, &biz, &pkgName, &existing)
	if err != nil {
		return nil, err
	}
	if status != "COMPLETED" {
		return nil, errBadRequest("Only COMPLETED orders can be promoted to projects")
	}
	if existing.Valid {
		return nil, errConflict("This order has already been promoted to a project")
	}
	if biz.Valid && biz.String != "" {
		clientName = biz.String
	}
	slug := strings.Trim(slugRe.ReplaceAllString(strings.ToLower(clientName), "-"), "-")
	slug += fmt.Sprintf("-%d", time.Now().UnixMilli())

	description := fmt.Sprintf("Project for %s — %s package.", clientName, pkgName)
	var briefObj map[string]any
	if err := json.Unmarshal(brief, &briefObj); err == nil {
		if d, ok := briefObj["description"].(string); ok && d != "" {
			description = d
		}
	}

	var projectID int64
	err = s.pool.QueryRow(ctx, `INSERT INTO projects
		(order_id, title, slug, client_name, category, thumbnail_url, description, tech_stack, duration)
		VALUES ($1,$2,$3,$4,'SERVICES','',$5,'[]','TBD') RETURNING id`,
		orderID, clientName+" — "+pkgName, slug, clientName, description,
	).Scan(&projectID)
	if err != nil {
		return nil, err
	}
	return map[string]any{"id": projectID, "title": clientName + " — " + pkgName, "slug": slug, "clientName": clientName}, nil
}

// errBadRequest / errConflict carry status semantics to the handler.
type statusError struct {
	code    int
	message string
}

func (e *statusError) Error() string { return e.message }

func errBadRequest(msg string) error { return &statusError{code: 400, message: msg} }
func errConflict(msg string) error   { return &statusError{code: 409, message: msg} }
