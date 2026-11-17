package middleware

import (
	"log/slog"
	"net/http"
	"runtime/debug"

	"github.com/dfd-agency/api/internal/platform/http/response"
)

// Recover converts a panic into a clean 500 and logs the stack. A crashed
// handler must never take down the process or leak a stack trace.
func Recover(logger *slog.Logger) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			defer func() {
				rec := recover()
				if rec == nil {
					return
				}
				logger.ErrorContext(r.Context(), "panic recovered",
					"recover", rec,
					"method", r.Method,
					"path", r.URL.Path,
					"stack", string(debug.Stack()),
				)
				response.Internal(w)
			}()
			next.ServeHTTP(w, r)
		})
	}
}
