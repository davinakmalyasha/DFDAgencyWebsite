// Command api runs the DFD Agency HTTP API.
package main

import (
	"context"
	"errors"
	"fmt"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/dfd-agency/api/internal/config"
	"github.com/dfd-agency/api/internal/platform/db"
	"github.com/dfd-agency/api/internal/platform/httpserver"
	plog "github.com/dfd-agency/api/internal/platform/log"
	"github.com/dfd-agency/api/internal/platform/notify"
	"github.com/dfd-agency/api/internal/platform/worker"
)

func main() {
	if err := run(); err != nil {
		logger := plog.New("info", os.Stderr)
		logger.Error("fatal", "error", err)
		os.Exit(1)
	}
}

func run() error {
	cfg, err := config.Load()
	if err != nil {
		return err
	}

	logger := plog.NewForEnvironment(cfg.LogLevel, cfg.Environment)
	logger.Info("starting DFD Agency API",
		"environment", cfg.Environment,
		"port", cfg.Port,
		"go", "1.27.4",
	)

	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	database, err := db.Connect(ctx, cfg.DatabaseURL, cfg.DatabaseMinConns, cfg.DatabaseMaxConns)
	if err != nil {
		return fmt.Errorf("database: %w", err)
	}
	defer database.Close()

	if err := db.Migrate(cfg.DatabaseURL); err != nil {
		return fmt.Errorf("migrate: %w", err)
	}
	logger.Info("database migrations applied")

	srv := httpserver.New(cfg, logger, database)

	// Background automation (cron parity + outbox dispatch). Shares the
	// process lifetime; jobs are idempotent and never crash the server.
	notifier := notify.New(logger, cfg.AgencyWhatsapp)
	telegram := notify.NewTelegram(logger, cfg.TelegramBotToken, cfg.TelegramChatID)
	w := worker.New(logger, database.Pool, notifier, telegram, cfg.AgencyWhatsapp, worker.BackupConfig{
		Enabled:       cfg.BackupEnabled,
		Dir:           cfg.BackupDir,
		RetentionDays: cfg.BackupRetentionDays,
		DatabaseURL:   cfg.DatabaseURL,
	})
	go w.Run(ctx)

	httpServer := &http.Server{
		Addr:              fmt.Sprintf(":%d", cfg.Port),
		Handler:           srv.Handler(),
		ReadHeaderTimeout: 10 * time.Second,
		ReadTimeout:       15 * time.Second,
		WriteTimeout:      30 * time.Second,
		IdleTimeout:       60 * time.Second,
	}

	errCh := make(chan error, 1)
	go func() {
		logger.Info("http server listening", "addr", httpServer.Addr)
		if err := httpServer.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			errCh <- err
		}
	}()

	select {
	case err := <-errCh:
		return fmt.Errorf("http server: %w", err)
	case <-ctx.Done():
		logger.Info("shutdown signal received")
	}

	shutdownCtx, cancel := context.WithTimeout(context.Background(), 20*time.Second)
	defer cancel()
	if err := httpServer.Shutdown(shutdownCtx); err != nil {
		return fmt.Errorf("http shutdown: %w", err)
	}
	logger.Info("shutdown complete")
	return nil
}
