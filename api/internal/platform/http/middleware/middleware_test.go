package middleware

import (
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestCSRFAllowsNonBrowserAgents(t *testing.T) {
	next := http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) { w.WriteHeader(http.StatusTeapot) })
	h := CSRF([]string{"http://localhost:3000"})(next)

	req := httptest.NewRequest(http.MethodPost, "/api/v1/agent/leads", nil)
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)
	if rec.Code != http.StatusTeapot {
		t.Fatalf("expected passthrough for headerless agent call, got %d", rec.Code)
	}
}

func TestCSRFBlocksForeignOrigin(t *testing.T) {
	next := http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) { w.WriteHeader(http.StatusTeapot) })
	h := CSRF([]string{"http://localhost:3000"})(next)

	req := httptest.NewRequest(http.MethodPost, "/api/v1/orders", nil)
	req.Header.Set("Origin", "https://evil.example")
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)
	if rec.Code != http.StatusForbidden {
		t.Fatalf("expected 403, got %d", rec.Code)
	}
}

func TestCSRFAllowsFrontendOrigin(t *testing.T) {
	next := http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) { w.WriteHeader(http.StatusTeapot) })
	h := CSRF([]string{"http://localhost:3000"})(next)

	req := httptest.NewRequest(http.MethodPost, "/api/v1/orders", nil)
	req.Header.Set("Origin", "http://localhost:3000")
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)
	if rec.Code != http.StatusTeapot {
		t.Fatalf("expected passthrough, got %d", rec.Code)
	}
}

func TestRequestIDRoundTrip(t *testing.T) {
	var seen string
	next := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		seen = GetRequestID(r.Context())
	})
	h := RequestID(next)

	req := httptest.NewRequest(http.MethodGet, "/healthz", nil)
	req.Header.Set("X-Request-ID", "req-test-123")
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)
	if seen != "req-test-123" || rec.Header().Get("X-Request-ID") != "req-test-123" {
		t.Fatalf("request id not propagated: %q", seen)
	}
}
