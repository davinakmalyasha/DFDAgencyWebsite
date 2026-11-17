package auth

import (
	"testing"

	platformauth "github.com/dfd-agency/api/internal/platform/auth"
)

func TestNormalizeEmail(t *testing.T) {
	if got := NormalizeEmail("  Admin@DFDagency.COM "); got != "admin@dfdagency.com" {
		t.Fatalf("got %q", got)
	}
}

func TestPasswordPolicy(t *testing.T) {
	if !ValidPassword("superadmin123") {
		t.Fatal("expected valid password")
	}
	for _, bad := range []string{"short1", "12345678", "password", "abc", ""} {
		if ValidPassword(bad) {
			t.Fatalf("expected %q to be rejected", bad)
		}
	}
}

func TestSecureCompare(t *testing.T) {
	hash, err := platformauth.HashPassword("demo1234")
	if err != nil {
		t.Fatalf("hash: %v", err)
	}
	if !SecureCompare("demo1234", hash) {
		t.Fatal("expected match")
	}
	if SecureCompare("wrong", hash) {
		t.Fatal("expected mismatch")
	}
	if SecureCompare("anything", "") {
		t.Fatal("expected empty hash to fail")
	}
}
