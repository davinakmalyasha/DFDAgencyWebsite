package admin

import (
	"context"
	"time"

	"github.com/jackc/pgx/v5/pgtype"
)

// Hosting is a managed hosting/domain entry.
type Hosting struct {
	ID               int64      `json:"id"`
	Domain           string     `json:"domain"`
	ClientName       string     `json:"clientName"`
	ClientWhatsapp   string     `json:"clientWhatsapp"`
	ClientEmail      *string    `json:"clientEmail"`
	HostingProvider  string     `json:"hostingProvider"`
	HostingStartDate time.Time  `json:"hostingStartDate"`
	HostingEndDate   time.Time  `json:"hostingEndDate"`
	DomainEndDate    *time.Time `json:"domainEndDate"`
	NotifyBeforeDays int        `json:"notifyBeforeDays"`
	Status           string     `json:"status"`
	Notes            *string    `json:"notes"`
	ProjectID        *int64     `json:"projectId"`
	LastNotifiedAt   *time.Time `json:"lastNotifiedAt"`
	CreatedAt        time.Time  `json:"createdAt"`
	UpdatedAt        time.Time  `json:"updatedAt"`
}

// ListHosting returns entries newest first.
func (s *Store) ListHosting(ctx context.Context, limit, offset int) ([]Hosting, int64, error) {
	var total int64
	if err := s.pool.QueryRow(ctx, `SELECT count(*) FROM hosting WHERE deleted_at IS NULL`).Scan(&total); err != nil {
		return nil, 0, err
	}
	rows, err := s.pool.Query(ctx, `SELECT id, domain, client_name, client_whatsapp, client_email,
		hosting_provider, hosting_start_date, hosting_end_date, domain_end_date, notify_before_days,
		status, notes, project_id, last_notified_at, created_at, updated_at
		FROM hosting WHERE deleted_at IS NULL ORDER BY hosting_end_date ASC LIMIT $1 OFFSET $2`, limit, offset)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()
	out := []Hosting{}
	for rows.Next() {
		h, err := scanHosting(rows)
		if err != nil {
			return nil, 0, err
		}
		out = append(out, *h)
	}
	return out, total, rows.Err()
}

func scanHosting(row interface {
	Scan(dest ...any) error
},
) (*Hosting, error) {
	var (
		h       Hosting
		email   pgtype.Text
		domEnd  pgtype.Timestamptz
		notes   pgtype.Text
		project pgtype.Int8
		notifed pgtype.Timestamptz
	)
	if err := row.Scan(&h.ID, &h.Domain, &h.ClientName, &h.ClientWhatsapp, &email,
		&h.HostingProvider, &h.HostingStartDate, &h.HostingEndDate, &domEnd, &h.NotifyBeforeDays,
		&h.Status, &notes, &project, &notifed, &h.CreatedAt, &h.UpdatedAt); err != nil {
		return nil, err
	}
	h.ClientEmail = textPtr(email)
	h.DomainEndDate = timePtr(domEnd)
	h.Notes = textPtr(notes)
	h.ProjectID = int8Ptr(project)
	h.LastNotifiedAt = timePtr(notifed)
	return &h, nil
}

// GetHosting returns one entry.
func (s *Store) GetHosting(ctx context.Context, id int64) (*Hosting, error) {
	return scanHosting(s.pool.QueryRow(ctx, `SELECT id, domain, client_name, client_whatsapp, client_email,
		hosting_provider, hosting_start_date, hosting_end_date, domain_end_date, notify_before_days,
		status, notes, project_id, last_notified_at, created_at, updated_at
		FROM hosting WHERE id = $1 AND deleted_at IS NULL`, id))
}

// CreateHosting inserts an entry.
func (s *Store) CreateHosting(ctx context.Context, h Hosting) (*Hosting, error) {
	return scanHosting(s.pool.QueryRow(ctx, `INSERT INTO hosting
		(domain, client_name, client_whatsapp, client_email, hosting_provider,
		hosting_start_date, hosting_end_date, domain_end_date, notify_before_days, status, notes, project_id)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
		RETURNING id, domain, client_name, client_whatsapp, client_email,
		hosting_provider, hosting_start_date, hosting_end_date, domain_end_date, notify_before_days,
		status, notes, project_id, last_notified_at, created_at, updated_at`,
		h.Domain, h.ClientName, h.ClientWhatsapp, h.ClientEmail, h.HostingProvider,
		h.HostingStartDate, h.HostingEndDate, h.DomainEndDate, h.NotifyBeforeDays, h.Status, h.Notes, h.ProjectID))
}

// UpdateHosting applies a partial update.
func (s *Store) UpdateHosting(ctx context.Context, id int64, fields map[string]any) (*Hosting, error) {
	allowed := map[string]string{
		"domain": "domain", "clientName": "client_name", "clientWhatsapp": "client_whatsapp",
		"clientEmail": "client_email", "hostingProvider": "hosting_provider",
		"hostingStartDate": "hosting_start_date", "hostingEndDate": "hosting_end_date",
		"domainEndDate": "domain_end_date", "notifyBeforeDays": "notify_before_days",
		"status": "status", "notes": "notes", "projectId": "project_id",
	}
	sets := []string{}
	args := []any{}
	for k, v := range fields {
		col, ok := allowed[k]
		if !ok {
			continue
		}
		args = append(args, v)
		sets = append(sets, col+` = $`+itoa(len(args)))
	}
	if len(sets) == 0 {
		return s.GetHosting(ctx, id)
	}
	args = append(args, id)
	return scanHosting(s.pool.QueryRow(ctx, `UPDATE hosting SET `+joinComma(sets)+
		` WHERE id = $`+itoa(len(args))+` AND deleted_at IS NULL
		RETURNING id, domain, client_name, client_whatsapp, client_email,
		hosting_provider, hosting_start_date, hosting_end_date, domain_end_date, notify_before_days,
		status, notes, project_id, last_notified_at, created_at, updated_at`, args...))
}

// SoftDeleteHosting soft-deletes an entry.
func (s *Store) SoftDeleteHosting(ctx context.Context, id int64) error {
	_, err := s.pool.Exec(ctx, `UPDATE hosting SET deleted_at = now() WHERE id = $1 AND deleted_at IS NULL`, id)
	return err
}

// HostingStats mirrors the original dashboard stats.
func (s *Store) HostingStats(ctx context.Context) (map[string]int64, error) {
	var active, soon, expired, total int64
	err := s.pool.QueryRow(ctx, `SELECT
		count(*) FILTER (WHERE deleted_at IS NULL AND status = 'ACTIVE'),
		count(*) FILTER (WHERE deleted_at IS NULL AND status = 'EXPIRING_SOON'),
		count(*) FILTER (WHERE deleted_at IS NULL AND status = 'EXPIRED'),
		count(*) FILTER (WHERE deleted_at IS NULL)
		FROM hosting`).Scan(&active, &soon, &expired, &total)
	if err != nil {
		return nil, err
	}
	return map[string]int64{"active": active, "expiringSoon": soon, "expired": expired, "total": total}, nil
}

// RefreshHostingStatuses recomputes ACTIVE/EXPIRING_SOON/EXPIRED from end dates.
func (s *Store) RefreshHostingStatuses(ctx context.Context) error {
	_, err := s.pool.Exec(ctx, `UPDATE hosting SET status = CASE
		WHEN hosting_end_date <= now() THEN 'EXPIRED'
		WHEN hosting_end_date <= now() + (notify_before_days || ' days')::interval THEN 'EXPIRING_SOON'
		ELSE 'ACTIVE' END
		WHERE deleted_at IS NULL AND status IN ('ACTIVE','EXPIRING_SOON','EXPIRED')`)
	return err
}
