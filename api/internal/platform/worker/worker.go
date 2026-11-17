// Package worker runs the agency's scheduled automation: hosting expiry
// reminders, testimonial follow-ups, stale milestone flags, database backups,
// and agent-event webhook dispatch. Each job is idempotent and logs its
// outcome; a job never takes the process down.
package worker

import (
	"context"
	"log/slog"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

// Notifier delivers outbound messages.
type Notifier interface {
	SendWhatsApp(ctx context.Context, to, message string) error
	SendEmail(ctx context.Context, to, subject, html string) error
}

// Telegram posts agency alerts when configured.
type Telegram interface {
	Post(ctx context.Context, message string) error
}

// Worker owns schedules and their dependencies.
type Worker struct {
	logger   *slog.Logger
	pool     *pgxpool.Pool
	notify   Notifier
	telegram Telegram
	agencyWA string
	backup   BackupConfig
}

// BackupConfig gates the midnight database dump.
type BackupConfig struct {
	Enabled       bool
	Dir           string
	RetentionDays int
	DatabaseURL   string
}

// New builds a Worker.
func New(logger *slog.Logger, pool *pgxpool.Pool, notify Notifier, telegram Telegram, agencyWA string, backup BackupConfig) *Worker {
	return &Worker{logger: logger, pool: pool, notify: notify, telegram: telegram, agencyWA: agencyWA, backup: backup}
}

// Run starts all schedules and blocks until ctx is cancelled.
func (w *Worker) Run(ctx context.Context) {
	w.logger.Info("worker started")
	tickers := []struct {
		name string
		at   [2]int // hour, minute local
		job  func(context.Context)
	}{
		{"hosting-expiry", [2]int{8, 0}, w.hostingExpiry},
		{"testimonial", [2]int{9, 0}, w.testimonial},
		{"stale-milestones", [2]int{10, 0}, w.staleMilestones},
		{"backup", [2]int{0, 0}, w.backupDB},
		{"outbox-dispatch", [2]int{-1, -1}, w.dispatchOutbox},
	}
	for _, t := range tickers {
		go w.loop(ctx, t.name, t.at, t.job)
	}
	<-ctx.Done()
	w.logger.Info("worker stopped")
}

func (w *Worker) loop(ctx context.Context, name string, at [2]int, job func(context.Context)) {
	if at[0] < 0 {
		// High-frequency loop for the outbox.
		t := time.NewTicker(30 * time.Second)
		defer t.Stop()
		for {
			select {
			case <-ctx.Done():
				return
			case <-t.C:
				w.safe(name, job)
			}
		}
	}
	for {
		next := nextDaily(at[0], at[1])
		select {
		case <-ctx.Done():
			return
		case <-time.After(time.Until(next)):
			w.safe(name, job)
		}
	}
}

func (w *Worker) safe(name string, job func(context.Context)) {
	defer func() {
		if rec := recover(); rec != nil {
			w.logger.Error("worker job panicked", "job", name, "recover", rec)
		}
	}()
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Minute)
	defer cancel()
	start := time.Now()
	job(ctx)
	w.logger.Info("worker job finished", "job", name, "duration_ms", time.Since(start).Milliseconds())
}

func nextDaily(hour, minute int) time.Time {
	now := time.Now()
	next := time.Date(now.Year(), now.Month(), now.Day(), hour, minute, 0, 0, now.Location())
	if !next.After(now) {
		next = next.Add(24 * time.Hour)
	}
	return next
}
