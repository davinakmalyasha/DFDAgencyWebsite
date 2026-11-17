package auth

import (
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/dfd-agency/api/internal/platform/http/response"
)

// CookieName is the HttpOnly session cookie shared with the Next.js frontend.
const CookieName = "token"

// CookieAuth validates the `token` cookie, enforces the database token version
// (so revoked sessions die instantly), and injects the user actor.
// CookieAuth validates the `token` cookie, enforces the database token version
// (so revoked sessions die instantly), and injects the user actor. When the
// session expires within 7 days the cookie is re-issued, mirroring the
// original sliding-session behavior.
func CookieAuth(secret string, pool *pgxpool.Pool, ttl time.Duration) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			cookie, err := r.Cookie(CookieName)
			if err != nil || cookie.Value == "" {
				response.Unauthorized(w, "Unauthorized: No token provided")
				return
			}

			claims, err := ParseJWT(secret, cookie.Value)
			if err != nil {
				clearCookie(w, cookie)
				response.Unauthorized(w, "Unauthorized: Invalid token")
				return
			}

			var tokenVersion int
			var deletedAt *time.Time
			err = pool.QueryRow(r.Context(),
				`SELECT token_version, deleted_at FROM users WHERE id = $1`, claims.UserID,
			).Scan(&tokenVersion, &deletedAt)
			if err != nil || deletedAt != nil || tokenVersion != claims.TokenVersion {
				clearCookie(w, cookie)
				response.Unauthorized(w, "Unauthorized: Token revoked")
				return
			}

			if claims.ExpiresAt != nil && time.Until(claims.ExpiresAt.Time) < 7*24*time.Hour {
				refreshed, err := SignJWT(secret, ttl, claims.UserID, claims.Role, tokenVersion)
				if err == nil {
					setSessionCookie(w, refreshed, ttl, r.TLS != nil)
				}
			}

			actor := Actor{Type: "user", UserID: claims.UserID, Role: claims.Role}
			next.ServeHTTP(w, r.WithContext(WithActor(r.Context(), actor)))
		})
	}
}

// setSessionCookie writes the session cookie with the production-aware
// SameSite policy (None + Secure in production for cross-site frontends).
func setSessionCookie(w http.ResponseWriter, token string, ttl time.Duration, tls bool) {
	sameSite := http.SameSiteStrictMode
	secure := tls
	if v := strings.ToLower(strings.TrimSpace(os.Getenv("APP_ENV"))); v == "production" {
		secure = true
		sameSite = http.SameSiteNoneMode
	}
	http.SetCookie(w, &http.Cookie{
		Name:     CookieName,
		Value:    token,
		Path:     "/",
		HttpOnly: true,
		Secure:   secure,
		SameSite: sameSite,
		MaxAge:   int(ttl.Seconds()),
	})
}

// ClearCookie removes the session cookie.
func ClearCookie(w http.ResponseWriter, secure bool) {
	clearCookie(w, &http.Cookie{Name: CookieName, Value: "", Path: "/", MaxAge: -1, Secure: secure})
}

func clearCookie(w http.ResponseWriter, cookie *http.Cookie) {
	http.SetCookie(w, &http.Cookie{
		Name:     cookie.Name,
		Value:    "",
		Path:     cookie.Path,
		HttpOnly: true,
		Secure:   cookie.Secure,
		SameSite: http.SameSiteStrictMode,
		MaxAge:   -1,
	})
}

// RequireRole restricts a route to the given roles.
func RequireRole(roles ...string) func(http.Handler) http.Handler {
	allowed := make(map[string]struct{}, len(roles))
	for _, r := range roles {
		allowed[r] = struct{}{}
	}
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			actor, ok := ActorFrom(r.Context())
			if !ok || actor.Type != "user" {
				response.Unauthorized(w, "Unauthorized")
				return
			}
			if _, ok := allowed[actor.Role]; !ok {
				response.Forbidden(w, "Forbidden: insufficient role")
				return
			}
			next.ServeHTTP(w, r)
		})
	}
}

// APIKeyAuth validates `Authorization: Bearer <key>`, enforces scopes, and
// injects an agent actor. It also stamps last_used_at.
func APIKeyAuth(pool *pgxpool.Pool, requiredScopes ...string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			header := r.Header.Get("Authorization")
			if !strings.HasPrefix(header, "Bearer ") {
				response.Unauthorized(w, "Unauthorized: missing bearer key")
				return
			}
			plain, err := NormalizeAPIKey(strings.TrimPrefix(header, "Bearer "))
			if err != nil {
				response.Unauthorized(w, "Unauthorized: invalid api key")
				return
			}

			var (
				id        string
				hash      string
				scopes    []string
				revokedAt *time.Time
			)
			err = pool.QueryRow(r.Context(),
				`SELECT id::text, key_hash, scopes, revoked_at FROM api_keys WHERE key_hash = $1`,
				HashAPIKey(plain),
			).Scan(&id, &hash, &scopes, &revokedAt)
			if err != nil {
				response.Unauthorized(w, "Unauthorized: unknown api key")
				return
			}
			if revokedAt != nil {
				response.Unauthorized(w, "Unauthorized: api key revoked")
				return
			}
			for _, required := range requiredScopes {
				if !HasScope(scopes, required) {
					response.Forbidden(w, "Forbidden: api key missing scope "+required)
					return
				}
			}

			// Best-effort usage stamp; never block the request on it.
			_, _ = pool.Exec(r.Context(), `UPDATE api_keys SET last_used_at = now() WHERE id = $1`, id)

			actor := Actor{Type: "agent", APIKeyID: id, Scopes: scopes}
			next.ServeHTTP(w, r.WithContext(WithActor(r.Context(), actor)))
		})
	}
}
