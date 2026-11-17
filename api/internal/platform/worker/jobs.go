package worker

import (
	"context"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"time"

	"github.com/jackc/pgx/v5/pgtype"
)

type pgtypeText = pgtype.Text

// hostingExpiry mirrors the original 08:00 cron: refresh statuses, then remind
// clients on WhatsApp and the agency on Telegram for entries within their
// notify window.
func (w *Worker) hostingExpiry(ctx context.Context) {
	if _, err := w.pool.Exec(ctx, `UPDATE hosting SET status = CASE
		WHEN hosting_end_date <= now() THEN 'EXPIRED'
		WHEN hosting_end_date <= now() + (notify_before_days || ' days')::interval THEN 'EXPIRING_SOON'
		ELSE 'ACTIVE' END
		WHERE deleted_at IS NULL AND status IN ('ACTIVE','EXPIRING_SOON','EXPIRED')`); err != nil {
		w.logger.ErrorContext(ctx, "hosting status refresh failed", "error", err)
		return
	}

	rows, err := w.pool.Query(ctx, `SELECT id, domain, client_name, client_whatsapp, hosting_end_date,
		notify_before_days, last_notified_at FROM hosting
		WHERE deleted_at IS NULL AND status IN ('ACTIVE','EXPIRING_SOON')`)
	if err != nil {
		w.logger.ErrorContext(ctx, "hosting expiry query failed", "error", err)
		return
	}
	defer rows.Close()

	type entry struct {
		id           int64
		domain       string
		client       string
		whatsapp     string
		end          time.Time
		notifyDays   int
		lastNotified *time.Time
	}
	now := time.Now()
	for rows.Next() {
		var e entry
		var end time.Time
		// last_notified_at is nullable; scan via interface.
		var rawLast any
		if err := rows.Scan(&e.id, &e.domain, &e.client, &e.whatsapp, &end, &e.notifyDays, &rawLast); err != nil {
			w.logger.ErrorContext(ctx, "hosting row scan failed", "error", err)
			continue
		}
		e.end = end
		if t, ok := rawLast.(time.Time); ok {
			e.lastNotified = &t
		}
		daysLeft := int(e.end.Sub(now).Hours() / 24)
		if daysLeft > e.notifyDays {
			continue
		}
		if e.lastNotified != nil && now.Sub(*e.lastNotified) < 24*time.Hour {
			continue
		}
		msg := fmt.Sprintf("Hosting expiry: %s (%s) expires %s — %d day(s) left. Provider record #%d.",
			e.domain, e.client, e.end.Format("02 Jan 2006"), daysLeft, e.id)
		if w.notify != nil {
			_ = w.notify.SendWhatsApp(ctx, e.whatsapp, msg)
		}
		if w.telegram != nil {
			_ = w.telegram.Post(ctx, msg)
		}
		_, _ = w.pool.Exec(ctx, `UPDATE hosting SET last_notified_at = now() WHERE id = $1`, e.id)
	}
}

// testimonial mirrors the 09:00 cron: flag orders completed exactly 7 days ago.
func (w *Worker) testimonial(ctx context.Context) {
	rows, err := w.pool.Query(ctx, `SELECT o.id, l.name, l.whatsapp, l.business_name FROM orders o
		JOIN leads l ON l.id = o.lead_id
		WHERE o.status = 'COMPLETED' AND o.deleted_at IS NULL
		AND o.updated_at >= now() - interval '8 days' AND o.updated_at < now() - interval '7 days'`)
	if err != nil {
		w.logger.ErrorContext(ctx, "testimonial query failed", "error", err)
		return
	}
	defer rows.Close()
	for rows.Next() {
		var (
			id       string
			name     string
			whatsapp string
			biz      pgtypeText
		)
		if err := rows.Scan(&id, &name, &whatsapp, &biz); err != nil {
			continue
		}
		client := name
		if biz.Valid && biz.String != "" {
			client = biz.String
		}
		msg := fmt.Sprintf("Testimonial follow-up: %s (%s) completed order %s 7 days ago — please request a testimonial.", client, whatsapp, id)
		if w.telegram != nil {
			_ = w.telegram.Post(ctx, msg)
		}
		w.logger.InfoContext(ctx, "testimonial follow-up", "order", id, "client", client)
	}
}

// staleMilestones mirrors the 10:00 cron: flag READY/IN_REVIEW milestones
// older than 7 days.
func (w *Worker) staleMilestones(ctx context.Context) {
	rows, err := w.pool.Query(ctx, `SELECT m.id, m.title, m.status, m.created_at, o.id, COALESCE(l.business_name, l.name)
		FROM order_milestones m JOIN orders o ON o.id = m.order_id
		JOIN leads l ON l.id = o.lead_id
		WHERE m.status IN ('READY','IN_REVIEW') AND m.created_at < now() - interval '7 days'
		AND o.deleted_at IS NULL AND o.status <> 'COMPLETED'`)
	if err != nil {
		w.logger.ErrorContext(ctx, "stale milestone query failed", "error", err)
		return
	}
	defer rows.Close()
	count := 0
	var lines []string
	for rows.Next() {
		var id int64
		var title, status, orderID, client string
		var created time.Time
		if err := rows.Scan(&id, &title, &status, &created, &orderID, &client); err != nil {
			continue
		}
		days := int(time.Since(created).Hours() / 24)
		lines = append(lines, fmt.Sprintf("- %s: %s (%s, %dd old) order %s", client, title, status, days, orderID))
		count++
	}
	if count == 0 {
		return
	}
	msg := fmt.Sprintf("Stale milestones (%d need attention):\n%s", count, strings.Join(lines, "\n"))
	if w.telegram != nil {
		_ = w.telegram.Post(ctx, msg)
	}
	w.logger.InfoContext(ctx, "stale milestones", "count", count)
}

// backupDB mirrors the midnight cron. Disabled unless BACKUP_ENABLED=true.
func (w *Worker) backupDB(ctx context.Context) {
	if !w.backup.Enabled {
		return
	}
	dir := w.backup.Dir
	if dir == "" {
		dir = "backups"
	}
	if err := os.MkdirAll(dir, 0o755); err != nil {
		w.logger.ErrorContext(ctx, "backup dir failed", "error", err)
		return
	}
	stamp := time.Now().Format("20060102-150405")
	out := filepath.Join(dir, "dfd_agency-"+stamp+".sql")
	// pg_dump must be on PATH (Postgres bin dir).
	cmd := exec.CommandContext(ctx, "pg_dump", w.backup.DatabaseURL, "-f", out)
	if out2, err := cmd.CombinedOutput(); err != nil {
		w.logger.ErrorContext(ctx, "backup failed", "error", err, "output", string(out2))
		return
	}
	w.logger.InfoContext(ctx, "backup written", "file", out)
	// Prune beyond retention.
	retention := w.backup.RetentionDays
	if retention <= 0 {
		retention = 30
	}
	cutoff := time.Now().AddDate(0, 0, -retention)
	entries, _ := os.ReadDir(dir)
	for _, e := range entries {
		if info, err := e.Info(); err == nil && info.ModTime().Before(cutoff) {
			_ = os.Remove(filepath.Join(dir, e.Name()))
		}
	}
}
