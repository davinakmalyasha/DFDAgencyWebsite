package admin

import (
	"context"
	"time"

	"github.com/jackc/pgx/v5/pgtype"
)

// AdminLead is the back-office lead view.
type AdminLead struct {
	ID           int64       `json:"id"`
	Name         string      `json:"name"`
	Whatsapp     string      `json:"whatsapp"`
	BusinessName *string     `json:"businessName"`
	Message      *string     `json:"message"`
	Status       string      `json:"status"`
	CreatedAt    time.Time   `json:"createdAt"`
	Orders       []LeadOrder `json:"Orders,omitempty"`
}

// LeadOrder is the compact order reference on a lead.
type LeadOrder struct {
	ID          string    `json:"id"`
	Status      string    `json:"status"`
	TotalAmount float64   `json:"totalAmount"`
	CreatedAt   time.Time `json:"createdAt"`
}

// ListLeads returns leads newest first with a total count.
func (s *Store) ListLeads(ctx context.Context, limit, offset int) ([]AdminLead, int64, error) {
	var total int64
	if err := s.pool.QueryRow(ctx, `SELECT count(*) FROM leads WHERE deleted_at IS NULL`).Scan(&total); err != nil {
		return nil, 0, err
	}
	rows, err := s.pool.Query(ctx, `SELECT id, name, whatsapp, business_name, message, status, created_at
		FROM leads WHERE deleted_at IS NULL ORDER BY created_at DESC LIMIT $1 OFFSET $2`, limit, offset)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()
	out := []AdminLead{}
	for rows.Next() {
		var (
			l   AdminLead
			biz pgtype.Text
			msg pgtype.Text
		)
		if err := rows.Scan(&l.ID, &l.Name, &l.Whatsapp, &biz, &msg, &l.Status, &l.CreatedAt); err != nil {
			return nil, 0, err
		}
		l.BusinessName = textPtr(biz)
		l.Message = textPtr(msg)
		out = append(out, l)
	}
	return out, total, rows.Err()
}

// GetLead returns one lead with its orders.
func (s *Store) GetLead(ctx context.Context, id int64) (*AdminLead, error) {
	var (
		l   AdminLead
		biz pgtype.Text
		msg pgtype.Text
	)
	err := s.pool.QueryRow(ctx, `SELECT id, name, whatsapp, business_name, message, status, created_at
		FROM leads WHERE id = $1 AND deleted_at IS NULL`, id,
	).Scan(&l.ID, &l.Name, &l.Whatsapp, &biz, &msg, &l.Status, &l.CreatedAt)
	if err != nil {
		return nil, err
	}
	l.BusinessName = textPtr(biz)
	l.Message = textPtr(msg)

	rows, err := s.pool.Query(ctx, `SELECT id, status, total_amount, created_at FROM orders
		WHERE lead_id = $1 AND deleted_at IS NULL ORDER BY created_at DESC`, id)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	for rows.Next() {
		var (
			o      LeadOrder
			amount = pgtype.Numeric{}
		)
		if err := rows.Scan(&o.ID, &o.Status, &amount, &o.CreatedAt); err != nil {
			return nil, err
		}
		o.TotalAmount = numericFloat(amount)
		l.Orders = append(l.Orders, o)
	}
	return &l, rows.Err()
}

// UpdateLeadStatus sets the lead status.
func (s *Store) UpdateLeadStatus(ctx context.Context, id int64, status string) (*AdminLead, error) {
	var (
		l   AdminLead
		biz pgtype.Text
		msg pgtype.Text
	)
	err := s.pool.QueryRow(ctx, `UPDATE leads SET status = $1 WHERE id = $2 AND deleted_at IS NULL
		RETURNING id, name, whatsapp, business_name, message, status, created_at`,
		status, id,
	).Scan(&l.ID, &l.Name, &l.Whatsapp, &biz, &msg, &l.Status, &l.CreatedAt)
	if err != nil {
		return nil, err
	}
	l.BusinessName = textPtr(biz)
	l.Message = textPtr(msg)
	return &l, nil
}

// SoftDeleteLead soft-deletes a lead.
func (s *Store) SoftDeleteLead(ctx context.Context, id int64) error {
	_, err := s.pool.Exec(ctx, `UPDATE leads SET deleted_at = now() WHERE id = $1 AND deleted_at IS NULL`, id)
	return err
}
