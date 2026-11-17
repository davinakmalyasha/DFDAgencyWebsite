package middleware

import (
	"net/http"
	"sync"
	"time"

	"github.com/dfd-agency/api/internal/platform/http/response"
)

// RateLimiter is a fixed-window per-IP limiter for public write endpoints.
// It is intentionally dependency-free; replace with a distributed limiter if
// the API ever runs behind more than one instance.
type RateLimiter struct {
	mu       sync.Mutex
	requests map[string][]time.Time
	limit    int
	window   time.Duration
}

// NewRateLimiter allows limit requests per window per client IP.
func NewRateLimiter(limit int, window time.Duration) *RateLimiter {
	return &RateLimiter{
		requests: make(map[string][]time.Time),
		limit:    limit,
		window:   window,
	}
}

// Limit wraps a handler with the fixed-window check.
func (l *RateLimiter) Limit(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		ip := r.Header.Get("X-Forwarded-For")
		if ip == "" {
			ip = r.RemoteAddr
		}
		now := time.Now()
		cutoff := now.Add(-l.window)

		l.mu.Lock()
		history := l.requests[ip]
		kept := history[:0]
		for _, t := range history {
			if t.After(cutoff) {
				kept = append(kept, t)
			}
		}
		if len(kept) >= l.limit {
			l.mu.Unlock()
			response.TooManyRequests(w, "Too many requests, please try again later.")
			return
		}
		l.requests[ip] = append(kept, now)
		if len(l.requests) > 100000 {
			for k, v := range l.requests {
				if len(v) == 0 {
					delete(l.requests, k)
				}
			}
		}
		l.mu.Unlock()

		next.ServeHTTP(w, r)
	})
}
