// Package middleware contains HTTP middleware used by the API.
package middleware

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"net/http"
)

type contextKey string

// RequestIDKey is the context key holding the request identifier.
const RequestIDKey contextKey = "request_id"

// RequestID attaches a stable request identifier to the response headers and
// context. Callers may supply X-Request-ID (for example agents retrying a call)
// and it is reused.
func RequestID(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		id := r.Header.Get("X-Request-ID")
		if id == "" {
			id = newID()
		}
		w.Header().Set("X-Request-ID", id)
		ctx := context.WithValue(r.Context(), RequestIDKey, id)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

// GetRequestID returns the request id from the context, if present.
func GetRequestID(ctx context.Context) string {
	if v, ok := ctx.Value(RequestIDKey).(string); ok {
		return v
	}
	return ""
}

func newID() string {
	var b [16]byte
	if _, err := rand.Read(b[:]); err != nil {
		return "req-0000000000000000"
	}
	return "req-" + hex.EncodeToString(b[:])
}
