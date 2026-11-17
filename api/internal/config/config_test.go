package config

import (
	"testing"
)

func TestLoadRejectsShortSecret(t *testing.T) {
	t.Setenv("DATABASE_URL", "postgresql://postgres@localhost:5432/dfd_agency?sslmode=disable")
	t.Setenv("JWT_SECRET", "short")
	if _, err := Load(); err == nil {
		t.Fatal("expected error for short JWT secret")
	}
}

func TestLoadDefaults(t *testing.T) {
	t.Setenv("DATABASE_URL", "postgresql://postgres@localhost:5432/dfd_agency?sslmode=disable")
	t.Setenv("JWT_SECRET", "test_secret_at_least_32_characters_long")
	t.Setenv("PORT", "8080")
	cfg, err := Load()
	if err != nil {
		t.Fatalf("Load: %v", err)
	}
	if cfg.Port != 8080 || cfg.JWTTTLHours != 720 || cfg.DatabaseMaxConns != 10 {
		t.Fatalf("bad defaults: %+v", cfg)
	}
	if len(cfg.AllowedOrigins) == 0 {
		t.Fatal("expected default origins")
	}
}
