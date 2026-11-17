// Package config loads and validates runtime configuration from the
// environment. Every required value fails fast at boot so a misconfigured
// instance never serves traffic.
package config

import (
	"fmt"
	"strings"

	"github.com/caarlos0/env/v11"
)

// Config is the immutable runtime configuration for the API.
type Config struct {
	Environment string `env:"APP_ENV" envDefault:"development"`
	Port        int    `env:"PORT" envDefault:"8080"`

	DatabaseURL      string `env:"DATABASE_URL,required"`
	DatabaseMaxConns int32  `env:"DATABASE_MAX_CONNS" envDefault:"10"`
	DatabaseMinConns int32  `env:"DATABASE_MIN_CONNS" envDefault:"1"`

	JWTSecret   string `env:"JWT_SECRET,required"`
	JWTTTLHours int    `env:"JWT_TTL_HOURS" envDefault:"720"`

	FrontendURL    string   `env:"FRONTEND_URL" envDefault:"http://localhost:3000"`
	AllowedOrigins []string `env:"ALLOWED_ORIGINS" envDefault:"http://localhost:3000,https://dfd-agency-website.vercel.app,https://dfdagencywebsite.vercel.app" envSeparator:","`

	LogLevel        string `env:"LOG_LEVEL" envDefault:"info"`
	EnableAccessLog bool   `env:"ENABLE_ACCESS_LOG" envDefault:"true"`

	// Agency WhatsApp number used for outbound notifications.
	AgencyWhatsapp string `env:"AGENCY_WHATSAPP" envDefault:""`

	// Telegram agency alerts (optional; outbox falls back to logs).
	TelegramBotToken string `env:"TELEGRAM_BOT_TOKEN" envDefault:""`
	TelegramChatID   string `env:"TELEGRAM_CHAT_ID" envDefault:""`

	// Email via Resend (optional; outbox falls back to logs).
	ResendAPIKey string `env:"RESEND_API_KEY" envDefault:""`
	EmailFrom    string `env:"EMAIL_FROM" envDefault:"DFD Agency <hello@dfdagency.com>"`

	// Supabase Storage (media uploads). Empty = upload endpoint reports
	// NOT_CONFIGURED instead of failing obscurely.
	SupabaseURL        string `env:"SUPABASE_URL" envDefault:""`
	SupabaseServiceKey string `env:"SUPABASE_SERVICE_ROLE_KEY" envDefault:""`
	SupabaseBucket     string `env:"SUPABASE_BUCKET" envDefault:"dfd-media"`

	// Midnight database backup (pg_dump must be on PATH). Off by default.
	BackupEnabled       bool   `env:"BACKUP_ENABLED" envDefault:"false"`
	BackupDir           string `env:"BACKUP_DIR" envDefault:"backups"`
	BackupRetentionDays int    `env:"BACKUP_RETENTION_DAYS" envDefault:"30"`
}

// Load parses configuration from the process environment.
func Load() (Config, error) {
	var cfg Config
	if err := env.Parse(&cfg); err != nil {
		return Config{}, fmt.Errorf("config: %w", err)
	}

	cfg.Environment = strings.ToLower(strings.TrimSpace(cfg.Environment))
	if cfg.Environment == "" {
		cfg.Environment = "development"
	}
	cfg.LogLevel = strings.ToLower(strings.TrimSpace(cfg.LogLevel))
	if cfg.LogLevel == "" {
		cfg.LogLevel = "info"
	}
	if cfg.Port <= 0 || cfg.Port > 65535 {
		return Config{}, fmt.Errorf("config: invalid PORT %d", cfg.Port)
	}
	if len(cfg.JWTSecret) < 32 {
		return Config{}, fmt.Errorf("config: JWT_SECRET must be at least 32 characters")
	}
	if cfg.JWTTTLHours <= 0 {
		cfg.JWTTTLHours = 720
	}
	if cfg.DatabaseMaxConns <= 0 {
		cfg.DatabaseMaxConns = 10
	}
	if cfg.DatabaseMinConns < 0 {
		cfg.DatabaseMinConns = 0
	}
	if len(cfg.AllowedOrigins) == 0 {
		cfg.AllowedOrigins = []string{cfg.FrontendURL}
	}

	return cfg, nil
}

// IsProduction reports whether the API runs in production mode.
func (c Config) IsProduction() bool { return c.Environment == "production" }
