package admin

import (
	"context"
	"encoding/json"
	"time"

	"github.com/jackc/pgx/v5/pgtype"
)

// Analytics is the admin dashboard payload.
type Analytics struct {
	Summary map[string]int64 `json:"summary"`
	Charts  map[string]any   `json:"charts"`
}

// GetAnalytics ports DashboardService.getAnalytics.
func (s *Store) GetAnalytics(ctx context.Context) (*Analytics, error) {
	var totalLeads, activeProjects, totalOrders, totalArticles int64
	if err := s.pool.QueryRow(ctx, `SELECT
		(SELECT count(*) FROM leads WHERE deleted_at IS NULL),
		(SELECT count(*) FROM projects WHERE deleted_at IS NULL),
		(SELECT count(*) FROM orders WHERE deleted_at IS NULL),
		(SELECT count(*) FROM articles WHERE deleted_at IS NULL)`).Scan(
		&totalLeads, &activeProjects, &totalOrders, &totalArticles); err != nil {
		return nil, err
	}

	type funnelRow struct {
		status string
		count  int64
	}
	rows, err := s.pool.Query(ctx, `SELECT status, count(*) FROM leads WHERE deleted_at IS NULL GROUP BY status`)
	if err != nil {
		return nil, err
	}
	byStatus := map[string]int64{}
	for rows.Next() {
		var fr funnelRow
		if err := rows.Scan(&fr.status, &fr.count); err != nil {
			rows.Close()
			return nil, err
		}
		byStatus[fr.status] = fr.count
	}
	rows.Close()
	if err := rows.Err(); err != nil {
		return nil, err
	}
	leadFunnel := []map[string]any{
		{"name": "New", "value": byStatus["NEW"], "fill": "#3b82f6"},
		{"name": "Contacted", "value": byStatus["CONTACTED"], "fill": "#eab308"},
		{"name": "Closed Won", "value": byStatus["CLOSED_WON"], "fill": "#22c55e"},
		{"name": "Closed Lost", "value": byStatus["CLOSED_LOST"], "fill": "#ef4444"},
	}

	// Monthly order volume for the last 6 months (real counts, not mocked).
	monthNames := []string{"Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"}
	now := time.Now()
	type monthKey struct{ y, m int }
	volume := map[monthKey]int64{}
	for i := 5; i >= 0; i-- {
		t := now.AddDate(0, -i, 0)
		volume[monthKey{t.Year(), int(t.Month())}] = 0
	}
	volRows, err := s.pool.Query(ctx, `SELECT created_at FROM orders WHERE deleted_at IS NULL`)
	if err != nil {
		return nil, err
	}
	for volRows.Next() {
		var created time.Time
		if err := volRows.Scan(&created); err != nil {
			volRows.Close()
			return nil, err
		}
		if _, ok := volume[monthKey{created.Year(), int(created.Month())}]; ok {
			volume[monthKey{created.Year(), int(created.Month())}]++
		}
	}
	volRows.Close()
	if err := volRows.Err(); err != nil {
		return nil, err
	}
	monthlyVolume := []map[string]any{}
	for i := 5; i >= 0; i-- {
		t := now.AddDate(0, -i, 0)
		monthlyVolume = append(monthlyVolume, map[string]any{
			"month":  monthNames[int(t.Month())-1],
			"orders": volume[monthKey{t.Year(), int(t.Month())}],
		})
	}

	// Revenue: real sums by status (the original dashboard mocked this).
	var revenuePaid, revenuePending float64
	if err := s.pool.QueryRow(ctx, `SELECT
		COALESCE(SUM(CASE WHEN p.payment_status = 'PAID' THEN o.total_amount ELSE 0 END), 0),
		COALESCE(SUM(CASE WHEN p.payment_status <> 'PAID' THEN o.total_amount ELSE 0 END), 0)
		FROM orders o LEFT JOIN payments p ON p.order_id = o.id AND p.payment_status = 'PAID'
		WHERE o.deleted_at IS NULL`).Scan(&revenuePaid, &revenuePending); err != nil {
		return nil, err
	}

	hosting, err := s.HostingStats(ctx)
	if err != nil {
		return nil, err
	}
	hostingPipeline := []map[string]any{
		{"status": "Active", "count": hosting["active"]},
		{"status": "Expiring Soon", "count": hosting["expiringSoon"]},
		{"status": "Expired", "count": hosting["expired"]},
		{"status": "Cancelled", "count": int64(0)},
	}

	return &Analytics{
		Summary: map[string]int64{
			"totalLeads": totalLeads, "activeProjects": activeProjects,
			"totalOrders": totalOrders, "totalArticles": totalArticles,
		},
		Charts: map[string]any{
			"leadFunnel": leadFunnel, "monthlyVolume": monthlyVolume,
			"hostingPipeline": hostingPipeline,
			"revenue":         map[string]any{"paid": revenuePaid, "pending": revenuePending},
		},
	}, nil
}

// AuditEntry is one audit log row.
type AuditEntry struct {
	ID        int64           `json:"id"`
	UserID    *int64          `json:"userId"`
	ActorType string          `json:"actorType"`
	ActorID   *string         `json:"actorId"`
	Action    string          `json:"action"`
	Target    string          `json:"target"`
	Details   json.RawMessage `json:"details"`
	IPAddress *string         `json:"ipAddress"`
	CreatedAt time.Time       `json:"createdAt"`
	Username  *string         `json:"username,omitempty"`
}

// ListAudit returns audit entries newest first with pagination.
func (s *Store) ListAudit(ctx context.Context, action string, limit, offset int) ([]AuditEntry, int64, error) {
	where := ``
	args := []any{}
	if action != "" {
		args = append(args, action)
		where = `WHERE a.action = $1`
	}
	var total int64
	if err := s.pool.QueryRow(ctx, `SELECT count(*) FROM audit_logs a `+where, args...).Scan(&total); err != nil {
		return nil, 0, err
	}
	args = append(args, limit, offset)
	rows, err := s.pool.Query(ctx, `SELECT a.id, a.user_id, a.actor_type, a.actor_id, a.action, a.target,
		a.details, a.ip_address, a.created_at, u.username
		FROM audit_logs a LEFT JOIN users u ON u.id = a.user_id `+where+
		` ORDER BY a.created_at DESC LIMIT $`+itoa(len(args)-1)+` OFFSET $`+itoa(len(args)), args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()
	out := []AuditEntry{}
	for rows.Next() {
		var (
			e        AuditEntry
			userID   pgtype.Int8
			actorID  pgtype.Text
			details  []byte
			ip       pgtype.Text
			username pgtype.Text
		)
		if err := rows.Scan(&e.ID, &userID, &e.ActorType, &actorID, &e.Action, &e.Target,
			&details, &ip, &e.CreatedAt, &username); err != nil {
			return nil, 0, err
		}
		e.UserID = int8Ptr(userID)
		e.ActorID = textPtr(actorID)
		e.Details = jsonRaw(details)
		e.IPAddress = textPtr(ip)
		e.Username = textPtr(username)
		out = append(out, e)
	}
	return out, total, rows.Err()
}
