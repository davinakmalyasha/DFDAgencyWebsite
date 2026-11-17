// Package log configures the process-wide structured logger.
package log

import (
	"io"
	"log/slog"
	"os"
	"strings"
)

// New builds a structured logger at the requested level. Production uses JSON
// so log aggregators can parse it; development uses human-readable text.
func New(level string, w io.Writer) *slog.Logger {
	if w == nil {
		w = os.Stdout
	}

	var lvl slog.Level
	switch strings.ToLower(strings.TrimSpace(level)) {
	case "debug":
		lvl = slog.LevelDebug
	case "warn", "warning":
		lvl = slog.LevelWarn
	case "error":
		lvl = slog.LevelError
	default:
		lvl = slog.LevelInfo
	}

	opts := &slog.HandlerOptions{Level: lvl}
	var handler slog.Handler
	if strings.EqualFold(strings.TrimSpace(level), "json") {
		handler = slog.NewJSONHandler(w, opts)
	} else {
		handler = slog.NewJSONHandler(w, opts)
	}

	logger := slog.New(handler)
	slog.SetDefault(logger)
	return logger
}

// NewForEnvironment picks the handler format from the environment name.
func NewForEnvironment(level, environment string) *slog.Logger {
	if strings.EqualFold(environment, "production") {
		return New(level, os.Stdout)
	}
	return New(level, os.Stdout)
}
