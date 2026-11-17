package content

import (
	"errors"
	"log/slog"
	"net/http"
	"strconv"
	"strings"

	"github.com/jackc/pgx/v5"

	"github.com/dfd-agency/api/internal/platform/http/response"
)

// Handler serves public catalog reads.
type Handler struct {
	store  *Store
	logger *slog.Logger
}

// NewHandler builds a content handler.
func NewHandler(store *Store, logger *slog.Logger) *Handler {
	return &Handler{store: store, logger: logger}
}

// Register mounts public routes on the root mux.
func (h *Handler) Register(mux *http.ServeMux) {
	mux.HandleFunc("GET /api/v1/packages", h.listPackages)
	mux.HandleFunc("GET /api/v1/packages/{slug}", h.getPackage)
	mux.HandleFunc("GET /api/v1/projects", h.listProjects)
	mux.HandleFunc("GET /api/v1/projects/{slug}", h.getProject)
	mux.HandleFunc("GET /api/v1/articles", h.listArticles)
	mux.HandleFunc("GET /api/v1/articles/{slug}", h.getArticle)
	mux.HandleFunc("GET /api/v1/promos/active", h.getActivePromo)
	mux.HandleFunc("GET /api/v1/settings", h.getSettings)
}

func (h *Handler) listPackages(w http.ResponseWriter, r *http.Request) {
	packages, err := h.store.ListPackages(r.Context(),
		r.URL.Query().Get("includeInactive") == "true",
		r.URL.Query().Get("hasDiscount") == "true")
	if err != nil {
		writeErr(w, h.logger, err)
		return
	}
	response.OK(w, packages, "Packages retrieved")
}

func (h *Handler) getPackage(w http.ResponseWriter, r *http.Request) {
	pkg, err := h.store.GetPackageBySlug(r.Context(), strings.TrimSpace(r.PathValue("slug")))
	if err != nil {
		writeErr(w, h.logger, err)
		return
	}
	response.OK(w, pkg, "Package retrieved")
}

func (h *Handler) listProjects(w http.ResponseWriter, r *http.Request) {
	limit, offset := pagination(r)
	projects, err := h.store.ListProjects(r.Context(), limit, offset)
	if err != nil {
		writeErr(w, h.logger, err)
		return
	}
	response.OK(w, projects, "Projects retrieved")
}

func (h *Handler) getProject(w http.ResponseWriter, r *http.Request) {
	project, err := h.store.GetProjectBySlug(r.Context(), strings.TrimSpace(r.PathValue("slug")))
	if err != nil {
		writeErr(w, h.logger, err)
		return
	}
	response.OK(w, project, "Project retrieved")
}

func (h *Handler) listArticles(w http.ResponseWriter, r *http.Request) {
	limit, offset := pagination(r)
	articles, err := h.store.ListPublishedArticles(r.Context(),
		r.URL.Query().Get("includeUnpublished") == "true", limit, offset)
	if err != nil {
		writeErr(w, h.logger, err)
		return
	}
	response.OK(w, articles, "Articles retrieved")
}

func (h *Handler) getArticle(w http.ResponseWriter, r *http.Request) {
	article, err := h.store.GetArticleBySlug(r.Context(), strings.TrimSpace(r.PathValue("slug")))
	if err != nil {
		writeErr(w, h.logger, err)
		return
	}
	response.OK(w, article, "Article retrieved")
}

func (h *Handler) getActivePromo(w http.ResponseWriter, r *http.Request) {
	promo, err := h.store.GetActivePromo(r.Context())
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			response.OK(w, nil, "No active promo")
			return
		}
		writeErr(w, h.logger, err)
		return
	}
	response.OK(w, promo, "Promo retrieved")
}

func (h *Handler) getSettings(w http.ResponseWriter, r *http.Request) {
	settings, err := h.store.GetSettings(r.Context())
	if err != nil {
		writeErr(w, h.logger, err)
		return
	}
	response.OK(w, settings, "Settings retrieved successfully")
}

func pagination(r *http.Request) (limit, offset int) {
	limit = 50
	offset = 0
	if raw := r.URL.Query().Get("limit"); raw != "" {
		if v, err := strconv.Atoi(raw); err == nil && v > 0 {
			limit = v
		}
	}
	if limit > 200 {
		limit = 200
	}
	if raw := r.URL.Query().Get("offset"); raw != "" {
		if v, err := strconv.Atoi(raw); err == nil && v > 0 {
			offset = v
		}
	}
	if raw := r.URL.Query().Get("page"); raw != "" {
		if v, err := strconv.Atoi(raw); err == nil && v > 1 {
			offset = (v - 1) * limit
		}
	}
	return limit, offset
}

func writeErr(w http.ResponseWriter, logger *slog.Logger, err error) {
	if errors.Is(err, pgx.ErrNoRows) {
		response.NotFound(w, "Resource not found")
		return
	}
	logger.Error("content store error", "error", err)
	response.Internal(w)
}
