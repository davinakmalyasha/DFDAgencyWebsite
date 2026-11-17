// Package httpserver wires the HTTP router, middleware, and handlers.
package httpserver

import (
	"context"
	"log/slog"
	"net/http"
	"time"

	"github.com/dfd-agency/api/internal/config"
	"github.com/dfd-agency/api/internal/modules/admin"
	"github.com/dfd-agency/api/internal/modules/agent"
	authmodule "github.com/dfd-agency/api/internal/modules/auth"
	"github.com/dfd-agency/api/internal/modules/client"
	"github.com/dfd-agency/api/internal/modules/content"
	"github.com/dfd-agency/api/internal/modules/docs"
	"github.com/dfd-agency/api/internal/modules/intake"
	"github.com/dfd-agency/api/internal/modules/mcpserver"
	"github.com/dfd-agency/api/internal/modules/misc"
	"github.com/dfd-agency/api/internal/platform/auth"
	"github.com/dfd-agency/api/internal/platform/db"
	"github.com/dfd-agency/api/internal/platform/http/middleware"
	"github.com/dfd-agency/api/internal/platform/http/response"
	"github.com/dfd-agency/api/internal/platform/notify"
	"github.com/modelcontextprotocol/go-sdk/mcp"
)

// Server holds shared dependencies for HTTP handlers.
type Server struct {
	cfg    config.Config
	logger *slog.Logger
	db     *db.DB
}

// New builds a Server.
func New(cfg config.Config, logger *slog.Logger, database *db.DB) *Server {
	return &Server{cfg: cfg, logger: logger, db: database}
}

// Handler returns the fully wrapped root handler.
func (s *Server) Handler() http.Handler {
	mux := http.NewServeMux()

	mux.HandleFunc("GET /healthz", s.health)
	mux.HandleFunc("GET /readyz", s.ready)
	mux.HandleFunc("GET /api/v1", s.root)

	// Public catalog reads (landing, blog, promos, settings).
	notifier := notify.New(s.logger, s.cfg.AgencyWhatsapp)
	content.NewHandler(content.NewStore(s.db.Pool), s.logger).Register(mux)

	// Public intake: leads, orders, magic-link tracking. Write endpoints
	// are rate-limited per IP (3/hour for forms, 10/15min for verification).
	intakeHandler := intake.NewHandler(intake.NewStore(s.db.Pool), docs.NewStore(s.db.Pool), s.db.Pool, s.logger, notifier, s.cfg.JWTSecret, s.cfg.FrontendURL)
	formLimiter := middleware.NewRateLimiter(3, time.Hour)
	intakeMux := http.NewServeMux()
	intakeHandler.Register(intakeMux)
	mux.Handle("/api/v1/leads", formLimiter.Limit(intakeMux))
	mux.Handle("/api/v1/leads/", formLimiter.Limit(intakeMux))
	mux.Handle("/api/v1/orders", formLimiter.Limit(intakeMux))
	mux.Handle("/api/v1/orders/", formLimiter.Limit(intakeMux))

	// Human auth: login rate-limited at 5/15min, invite at 10/15min.
	authHandler := authmodule.NewHandler(
		authmodule.NewStore(s.db.Pool),
		s.db.Pool,
		s.logger,
		s.cfg.JWTSecret,
		time.Duration(s.cfg.JWTTTLHours)*time.Hour,
		s.cfg.IsProduction(),
	)
	authHandler.Register(mux,
		middleware.NewRateLimiter(5, 15*time.Minute),
		middleware.NewRateLimiter(10, 15*time.Minute),
	)

	// Back-office admin API (SUPERADMIN cookie sessions). Method-qualified
	// patterns take precedence over the intake subtree mounts for the
	// shared /leads and /orders prefixes.
	adminHandler := admin.NewHandler(
		admin.NewStore(s.db.Pool),
		docs.NewStore(s.db.Pool),
		s.db.Pool,
		s.logger,
		s.cfg.FrontendURL,
	)
	adminMux := http.NewServeMux()
	adminHandler.Register(adminMux, func(next http.Handler) http.Handler { return next })
	adminHandler.RegisterCatalog(adminMux, func(next http.Handler) http.Handler { return next })
	adminGuard := auth.CookieAuth(s.cfg.JWTSecret, s.db.Pool, time.Duration(s.cfg.JWTTTLHours)*time.Hour)(
		auth.RequireRole("SUPERADMIN")(adminMux),
	)
	mux.Handle("/api/v1/users", adminGuard)
	mux.Handle("/api/v1/users/", adminGuard)
	mux.Handle("GET /api/v1/leads", adminGuard)
	mux.Handle("GET /api/v1/leads/{id}", adminGuard)
	mux.Handle("PUT /api/v1/leads/{id}/status", adminGuard)
	mux.Handle("DELETE /api/v1/leads/{id}", adminGuard)
	mux.Handle("GET /api/v1/orders", adminGuard)
	mux.Handle("GET /api/v1/orders/{id}", adminGuard)
	mux.Handle("PATCH /api/v1/orders/{segment}/{key}", adminGuard)
	mux.Handle("DELETE /api/v1/orders/{id}", adminGuard)
	mux.Handle("POST /api/v1/orders/{id}/promote", adminGuard)
	mux.Handle("GET /api/v1/orders/{orderId}/notes", adminGuard)
	mux.Handle("POST /api/v1/orders/{orderId}/notes", adminGuard)
	mux.Handle("GET /api/v1/orders/{orderId}/resources", adminGuard)
	mux.Handle("POST /api/v1/orders/{orderId}/resources", adminGuard)
	mux.Handle("GET /api/v1/orders/{orderId}/milestones", adminGuard)
	mux.Handle("POST /api/v1/orders/{orderId}/milestones", adminGuard)
	mux.Handle("DELETE /api/v1/orders/notes/{noteId}", adminGuard)
	mux.Handle("DELETE /api/v1/orders/resources/{resourceId}", adminGuard)
	mux.Handle("DELETE /api/v1/orders/milestones/{id}", adminGuard)
	mux.Handle("GET /api/v1/orders/{orderId}/activity", adminGuard)
	mux.Handle("GET /api/v1/orders/{orderId}/whatsapp-link", adminGuard)
	mux.Handle("GET /api/v1/orders/{id}/invoice", adminGuard)
	mux.Handle("GET /api/v1/orders/{id}/contract", adminGuard)
	mux.Handle("GET /api/v1/orders/{id}/welcome", adminGuard)

	// Catalog, hosting, settings, dashboard, audit (all SUPERADMIN).
	mux.Handle("GET /api/v1/hosting", adminGuard)
	mux.Handle("POST /api/v1/hosting", adminGuard)
	mux.Handle("GET /api/v1/hosting/stats", adminGuard)
	mux.Handle("GET /api/v1/hosting/{id}", adminGuard)
	mux.Handle("PUT /api/v1/hosting/{id}", adminGuard)
	mux.Handle("DELETE /api/v1/hosting/{id}", adminGuard)
	mux.Handle("POST /api/v1/packages", adminGuard)
	mux.Handle("PATCH /api/v1/packages/{id}", adminGuard)
	mux.Handle("DELETE /api/v1/packages/{id}", adminGuard)
	mux.Handle("POST /api/v1/projects", adminGuard)
	mux.Handle("PUT /api/v1/projects/{id}", adminGuard)
	mux.Handle("DELETE /api/v1/projects/{id}", adminGuard)
	mux.Handle("POST /api/v1/projects/{projectId}/images", adminGuard)
	mux.Handle("DELETE /api/v1/projects/{projectId}/images/{imageId}", adminGuard)
	mux.Handle("POST /api/v1/articles", adminGuard)
	mux.Handle("PUT /api/v1/articles/{id}", adminGuard)
	mux.Handle("DELETE /api/v1/articles/{id}", adminGuard)
	mux.Handle("GET /api/v1/promos", adminGuard)
	mux.Handle("POST /api/v1/promos", adminGuard)
	mux.Handle("PUT /api/v1/promos/{id}", adminGuard)
	mux.Handle("DELETE /api/v1/promos/{id}", adminGuard)
	mux.Handle("GET /api/v1/webhooks", adminGuard)
	mux.Handle("POST /api/v1/webhooks", adminGuard)
	mux.Handle("DELETE /api/v1/webhooks/{id}", adminGuard)
	mux.Handle("PUT /api/v1/settings", adminGuard)
	// (dashboard is mounted below with the any-role cookie guard)
	mux.Handle("GET /api/v1/audit", adminGuard)
	mux.Handle("GET /api/v1/admin/audit", adminGuard)

	// Dashboard analytics: any authenticated role (mirrors the original).
	cookieOnly := auth.CookieAuth(s.cfg.JWTSecret, s.db.Pool, time.Duration(s.cfg.JWTTTLHours)*time.Hour)
	mux.Handle("GET /api/v1/dashboard", cookieOnly(adminMux))

	// Misc: upload, WhatsApp, AI stub (SUPERADMIN).
	miscHandler := misc.NewHandler(s.logger, misc.Config{
		SupabaseURL:        s.cfg.SupabaseURL,
		SupabaseServiceKey: s.cfg.SupabaseServiceKey,
		SupabaseBucket:     s.cfg.SupabaseBucket,
	})
	miscHandler.Register(adminMux, func(next http.Handler) http.Handler { return next })
	mux.Handle("POST /api/v1/upload", adminGuard)
	mux.Handle("GET /api/v1/whatsapp/status", adminGuard)
	mux.Handle("GET /api/v1/whatsapp/qr", adminGuard)
	mux.Handle("POST /api/v1/whatsapp/start", adminGuard)
	mux.Handle("POST /api/v1/whatsapp/logout", adminGuard)
	mux.Handle("POST /api/v1/ai/generate-copy", adminGuard)

	// Client portal: CLIENT, SUPERADMIN, or EDITOR cookie sessions; the
	// request-triage endpoints stay SUPERADMIN-only.
	clientMux := http.NewServeMux()
	clientHandler := client.NewHandler(client.NewStore(s.db.Pool), docs.NewStore(s.db.Pool), s.db.Pool, s.logger, notifier, s.cfg.FrontendURL)
	clientCookie := auth.CookieAuth(s.cfg.JWTSecret, s.db.Pool, time.Duration(s.cfg.JWTTTLHours)*time.Hour)
	clientHandler.Register(clientMux,
		func(next http.Handler) http.Handler {
			return clientCookie(auth.RequireRole("CLIENT", "SUPERADMIN", "EDITOR")(next))
		},
		func(next http.Handler) http.Handler {
			return clientCookie(auth.RequireRole("SUPERADMIN")(next))
		},
	)
	mux.Handle("/api/v1/client/", clientMux)

	// MCP over streamable HTTP. Bearer API key required (scope: agent).
	// Local harnesses should prefer `dfd-mcp` over stdio instead.
	mcpHandler := mcp.NewStreamableHTTPHandler(func(r *http.Request) *mcp.Server {
		return mcpserver.Build(mcpserver.Deps{
			Store:    agent.NewStore(s.db.Pool),
			Logger:   s.logger,
			Notifier: notifier,
		})
	}, nil)
	mux.Handle("POST /mcp", auth.APIKeyAuth(s.db.Pool, "agent")(mcpHandler))
	mux.Handle("GET /mcp", auth.APIKeyAuth(s.db.Pool, "agent")(mcpHandler))
	mux.Handle("DELETE /mcp", auth.APIKeyAuth(s.db.Pool, "agent")(mcpHandler))
	agentHandler := agent.NewHandler(
		agent.NewStore(s.db.Pool),
		s.db.Pool,
		s.logger,
		notifier,
	)
	agentMux := http.NewServeMux()
	agentHandler.Register(agentMux)
	agentGuard := auth.APIKeyAuth(s.db.Pool, "agent")(agentMux)
	mux.Handle("/api/v1/agent/", http.StripPrefix("/api/v1/agent", agentGuard))
	mux.Handle("/api/agent/", http.StripPrefix("/api/agent", agentGuard))
	// Exact prefix without trailing slash: redirect to the subtree so the
	// inner mux always sees a leading slash.
	mux.HandleFunc("/api/v1/agent", func(w http.ResponseWriter, r *http.Request) {
		http.Redirect(w, r, "/api/v1/agent/", http.StatusPermanentRedirect)
	})
	mux.HandleFunc("/api/agent", func(w http.ResponseWriter, r *http.Request) {
		http.Redirect(w, r, "/api/agent/", http.StatusPermanentRedirect)
	})

	mux.HandleFunc("/api/v1/", s.notFound)

	var h http.Handler = mux
	h = middleware.SecurityHeaders(h)
	h = middleware.CSRF(s.cfg.AllowedOrigins)(h)
	h = middleware.CORS(s.cfg.AllowedOrigins)(h)
	if s.cfg.EnableAccessLog {
		h = middleware.Logger(s.logger)(h)
	}
	h = middleware.Recover(s.logger)(h)
	h = middleware.RequestID(h)
	return h
}

func (s *Server) health(w http.ResponseWriter, _ *http.Request) {
	response.OK(w, map[string]any{
		"status":      "ok",
		"environment": s.cfg.Environment,
		"time":        time.Now().UTC(),
	}, "DFD Agency API running securely")
}

func (s *Server) ready(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(r.Context(), 3*time.Second)
	defer cancel()
	if err := s.db.Ping(ctx); err != nil {
		s.logger.ErrorContext(ctx, "readiness probe failed", "error", err)
		response.Fail(w, http.StatusServiceUnavailable, "Service Unavailable", "DATABASE_UNAVAILABLE")
		return
	}
	response.OK(w, map[string]any{"database": "up"}, "Ready")
}

func (s *Server) root(w http.ResponseWriter, _ *http.Request) {
	response.OK(w, nil, "DFD Agency API running securely")
}

func (s *Server) notFound(w http.ResponseWriter, _ *http.Request) {
	response.NotFound(w, "Resource not found")
}
