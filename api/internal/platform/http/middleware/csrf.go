package middleware

import (
	"net/http"
	"net/url"

	"github.com/dfd-agency/api/internal/platform/http/response"
)

// CSRF mirrors the original Express policy: state-changing browser requests
// must originate from an allowed site. Non-browser callers (agents, MCP, CLI)
// send neither Origin nor Referer and are allowed through, because CSRF is a
// browser-only attack.
func CSRF(allowedOrigins []string) func(http.Handler) http.Handler {
	allowedHosts := make(map[string]struct{}, len(allowedOrigins))
	for _, raw := range allowedOrigins {
		if u, err := url.Parse(raw); err == nil && u.Host != "" {
			allowedHosts[u.Host] = struct{}{}
		}
	}

	stateChanging := map[string]bool{
		http.MethodPost:   true,
		http.MethodPut:    true,
		http.MethodPatch:  true,
		http.MethodDelete: true,
	}

	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			if !stateChanging[r.Method] {
				next.ServeHTTP(w, r)
				return
			}

			origin := r.Header.Get("Origin")
			referer := r.Header.Get("Referer")

			if origin == "" && referer == "" {
				next.ServeHTTP(w, r)
				return
			}

			if _, ok := allowedHosts[hostOf(origin)]; ok && origin != "" {
				next.ServeHTTP(w, r)
				return
			}
			if _, ok := allowedHosts[hostOf(referer)]; ok && referer != "" {
				next.ServeHTTP(w, r)
				return
			}

			response.Fail(w, http.StatusForbidden,
				"Forbidden: CSRF validation failed. Requests must originate from the official frontend.",
				"INVALID_ORIGIN")
		})
	}
}

func hostOf(raw string) string {
	if raw == "" {
		return ""
	}
	u, err := url.Parse(raw)
	if err != nil {
		return ""
	}
	return u.Host
}
