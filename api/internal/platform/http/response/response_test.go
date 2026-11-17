package response

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestOKEnvelope(t *testing.T) {
	rec := httptest.NewRecorder()
	OK(rec, map[string]string{"a": "b"}, "Great")

	if rec.Code != http.StatusOK {
		t.Fatalf("status = %d", rec.Code)
	}
	var body Envelope
	if err := json.Unmarshal(rec.Body.Bytes(), &body); err != nil {
		t.Fatalf("decode: %v", err)
	}
	if !body.Success || body.Message != "Great" || body.Error != nil {
		t.Fatalf("bad envelope: %+v", body)
	}
	if rec.Header().Get("Content-Type") != "application/json; charset=utf-8" {
		t.Fatalf("bad content type: %q", rec.Header().Get("Content-Type"))
	}
}

func TestUnauthorizedEnvelope(t *testing.T) {
	rec := httptest.NewRecorder()
	Unauthorized(rec, "Nope")
	if rec.Code != http.StatusUnauthorized {
		t.Fatalf("status = %d", rec.Code)
	}
	var body Envelope
	if err := json.Unmarshal(rec.Body.Bytes(), &body); err != nil {
		t.Fatalf("decode: %v", err)
	}
	if body.Success || body.Data != nil {
		t.Fatalf("bad envelope: %+v", body)
	}
}

func TestValidationErrorEnvelope(t *testing.T) {
	rec := httptest.NewRecorder()
	ValidationError(rec, "Bad input", map[string]string{"title": "required"})
	if rec.Code != http.StatusUnprocessableEntity {
		t.Fatalf("status = %d", rec.Code)
	}
}
