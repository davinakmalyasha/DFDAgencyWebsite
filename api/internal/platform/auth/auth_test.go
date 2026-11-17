package auth

import (
	"strings"
	"testing"
	"time"
)

func TestPasswordRoundTrip(t *testing.T) {
	hash, err := HashPassword("superadmin123")
	if err != nil {
		t.Fatalf("HashPassword: %v", err)
	}
	if !CheckPassword(hash, "superadmin123") {
		t.Fatal("expected password to verify")
	}
	if CheckPassword(hash, "wrong") {
		t.Fatal("expected wrong password to fail")
	}
}

func TestJWTRoundTrip(t *testing.T) {
	secret := "test_secret_at_least_32_characters_long"
	signed, err := SignJWT(secret, time.Hour, 42, "SUPERADMIN", 3)
	if err != nil {
		t.Fatalf("SignJWT: %v", err)
	}
	claims, err := ParseJWT(secret, signed)
	if err != nil {
		t.Fatalf("ParseJWT: %v", err)
	}
	if claims.UserID != 42 || claims.Role != "SUPERADMIN" || claims.TokenVersion != 3 {
		t.Fatalf("unexpected claims: %+v", claims)
	}
}

func TestJWTRejectsShortSecret(t *testing.T) {
	if _, err := SignJWT("short", time.Hour, 1, "ADMIN", 0); err == nil {
		t.Fatal("expected error for short secret")
	}
}

func TestJWTRejectsTamperedToken(t *testing.T) {
	secret := "test_secret_at_least_32_characters_long"
	signed, err := SignJWT(secret, time.Hour, 1, "ADMIN", 0)
	if err != nil {
		t.Fatalf("SignJWT: %v", err)
	}
	if _, err := ParseJWT(secret, signed+"tampered"); err == nil {
		t.Fatal("expected tampered token to fail")
	}
}

func TestAPIKeyShape(t *testing.T) {
	key, err := GenerateAPIKey()
	if err != nil {
		t.Fatalf("GenerateAPIKey: %v", err)
	}
	if !strings.HasPrefix(key.Plaintext, APIKeyPrefix) {
		t.Fatalf("bad prefix: %q", key.Plaintext)
	}
	if !strings.HasPrefix(key.Prefix, APIKeyPrefix) || len(key.Prefix) >= len(key.Plaintext) {
		t.Fatalf("bad stored prefix: %q", key.Prefix)
	}
	if len(key.Hash) != 64 {
		t.Fatalf("expected 64-char sha256 hex, got %q", key.Hash)
	}
	if _, err := NormalizeAPIKey("  " + key.Plaintext + "  "); err != nil {
		t.Fatalf("NormalizeAPIKey should trim: %v", err)
	}
	if _, err := NormalizeAPIKey("bogus"); err == nil {
		t.Fatal("expected invalid prefix to fail")
	}
}

func TestHasScope(t *testing.T) {
	if !HasScope([]string{"agent", "read"}, "read") {
		t.Fatal("expected read scope")
	}
	if HasScope([]string{"read"}, "write") {
		t.Fatal("unexpected write scope")
	}
	if !HasScope([]string{"*"}, "anything") {
		t.Fatal("expected wildcard to grant")
	}
}
