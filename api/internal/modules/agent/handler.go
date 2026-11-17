package agent

import (
	"context"
	"encoding/json"
	"errors"
	"io"
	"log/slog"
	"net/http"
	"strconv"
	"strings"

	"github.com/jackc/pgerrcode"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/dfd-agency/api/internal/platform/http/response"
	"github.com/dfd-agency/api/internal/platform/worker"
)

// Notifier delivers an outbound WhatsApp message.
type Notifier interface {
	SendWhatsApp(ctx context.Context, to, message string) error
}

// Handler serves the agent API.
type Handler struct {
	store    *Store
	pool     *pgxpool.Pool
	logger   *slog.Logger
	notifier Notifier
}

// NewHandler builds an agent handler.
func NewHandler(store *Store, pool *pgxpool.Pool, logger *slog.Logger, notifier Notifier) *Handler {
	return &Handler{store: store, pool: pool, logger: logger, notifier: notifier}
}

// Register mounts every agent route on the supplied mux. Routes are relative
// to the mount point (/api/v1/agent or /api/agent).
func (h *Handler) Register(mux *http.ServeMux) {
	mux.HandleFunc("GET /health", h.health)

	mux.HandleFunc("GET /leads", h.listLeads)
	mux.HandleFunc("GET /leads/{id}", h.getLead)
	mux.HandleFunc("PATCH /leads/{id}", h.updateLead)

	mux.HandleFunc("GET /orders", h.listOrders)
	mux.HandleFunc("GET /orders/{id}", h.getOrder)
	mux.HandleFunc("GET /orders/{orderId}/milestones", h.listMilestones)
	mux.HandleFunc("POST /orders/{orderId}/milestones", h.createMilestone)
	mux.HandleFunc("PATCH /milestones/{id}", h.updateMilestone)
	mux.HandleFunc("POST /orders/{orderId}/notes", h.createNote)
	mux.HandleFunc("PATCH /notes/{id}", h.updateNote)
	mux.HandleFunc("POST /orders/{orderId}/activities", h.createActivity)

	mux.HandleFunc("GET /requests", h.listRequests)
	mux.HandleFunc("GET /requests/{id}", h.getRequest)
	mux.HandleFunc("PATCH /requests/{id}", h.updateRequest)

	mux.HandleFunc("GET /projects", h.listProjects)
	mux.HandleFunc("GET /projects/{id}", h.getProject)
	mux.HandleFunc("PATCH /projects/{id}", h.updateProject)

	mux.HandleFunc("GET /articles", h.listArticles)
	mux.HandleFunc("POST /articles", h.createArticle)
	mux.HandleFunc("PATCH /articles/{id}", h.updateArticle)

	mux.HandleFunc("POST /whatsapp/send", h.whatsappSend)
}

func (h *Handler) health(w http.ResponseWriter, _ *http.Request) {
	response.OK(w, map[string]any{"status": "ok", "channel": "agent"}, "Agent API ready")
}

// ---------------------------------------------------------------------------
// Leads
// ---------------------------------------------------------------------------

func (h *Handler) listLeads(w http.ResponseWriter, r *http.Request) {
	limit, offset := pagination(r)
	status := strings.TrimSpace(r.URL.Query().Get("status"))
	leads, err := h.store.ListLeads(r.Context(), status, limit, offset)
	if err != nil {
		writeStoreError(w, h.logger, err)
		return
	}
	response.OK(w, leads, "Leads retrieved")
}

func (h *Handler) getLead(w http.ResponseWriter, r *http.Request) {
	id, ok := pathID(w, r)
	if !ok {
		return
	}
	lead, err := h.store.GetLead(r.Context(), id)
	if err != nil {
		writeStoreError(w, h.logger, err)
		return
	}
	response.OK(w, lead, "Lead retrieved")
}

func (h *Handler) updateLead(w http.ResponseWriter, r *http.Request) {
	id, ok := pathID(w, r)
	if !ok {
		return
	}
	var req UpdateLeadRequest
	if !decodeJSON(w, r, &req) {
		return
	}
	lead, err := h.store.UpdateLead(r.Context(), id, req)
	if err != nil {
		writeStoreError(w, h.logger, err)
		return
	}
	response.OK(w, lead, "Lead updated")
}

// ---------------------------------------------------------------------------
// Orders
// ---------------------------------------------------------------------------

func (h *Handler) listOrders(w http.ResponseWriter, r *http.Request) {
	limit, offset := pagination(r)
	status := strings.TrimSpace(r.URL.Query().Get("status"))
	orders, err := h.store.ListOrders(r.Context(), status, limit, offset)
	if err != nil {
		writeStoreError(w, h.logger, err)
		return
	}
	response.OK(w, orders, "Orders retrieved")
}

func (h *Handler) getOrder(w http.ResponseWriter, r *http.Request) {
	id := strings.TrimSpace(r.PathValue("id"))
	order, err := h.store.GetOrder(r.Context(), id)
	if err != nil {
		writeStoreError(w, h.logger, err)
		return
	}
	response.OK(w, order, "Order retrieved")
}

// ---------------------------------------------------------------------------
// Milestones
// ---------------------------------------------------------------------------

func (h *Handler) listMilestones(w http.ResponseWriter, r *http.Request) {
	orderID := strings.TrimSpace(r.PathValue("orderId"))
	milestones, err := h.store.ListMilestones(r.Context(), orderID)
	if err != nil {
		writeStoreError(w, h.logger, err)
		return
	}
	response.OK(w, milestones, "Milestones retrieved")
}

func (h *Handler) createMilestone(w http.ResponseWriter, r *http.Request) {
	orderID := strings.TrimSpace(r.PathValue("orderId"))
	var req CreateMilestoneRequest
	if !decodeJSON(w, r, &req) {
		return
	}
	if strings.TrimSpace(req.Title) == "" {
		response.ValidationError(w, "title is required", map[string]string{"title": "required"})
		return
	}
	milestone, err := h.store.CreateMilestone(r.Context(), orderID, req)
	if err != nil {
		writeStoreError(w, h.logger, err)
		return
	}
	worker.Emit(r.Context(), h.pool, "milestone.created", "order", orderID, milestone)
	response.Created(w, milestone, "Milestone created")
}

func (h *Handler) updateMilestone(w http.ResponseWriter, r *http.Request) {
	id, ok := pathID(w, r)
	if !ok {
		return
	}
	var req UpdateMilestoneRequest
	if !decodeJSON(w, r, &req) {
		return
	}
	milestone, err := h.store.UpdateMilestone(r.Context(), id, req)
	if err != nil {
		writeStoreError(w, h.logger, err)
		return
	}
	worker.Emit(r.Context(), h.pool, "milestone.updated", "milestone", itoa64(milestone.ID), milestone)
	response.OK(w, milestone, "Milestone updated")
}

// ---------------------------------------------------------------------------
// Notes
// ---------------------------------------------------------------------------

func (h *Handler) createNote(w http.ResponseWriter, r *http.Request) {
	orderID := strings.TrimSpace(r.PathValue("orderId"))
	var req CreateNoteRequest
	if !decodeJSON(w, r, &req) {
		return
	}
	if strings.TrimSpace(req.Content) == "" {
		response.ValidationError(w, "content is required", map[string]string{"content": "required"})
		return
	}
	note, err := h.store.CreateNote(r.Context(), orderID, req)
	if err != nil {
		writeStoreError(w, h.logger, err)
		return
	}
	worker.Emit(r.Context(), h.pool, "note.created", "order", orderID, note)
	response.Created(w, note, "Note created")
}

func (h *Handler) updateNote(w http.ResponseWriter, r *http.Request) {
	id, ok := pathID(w, r)
	if !ok {
		return
	}
	var req UpdateNoteRequest
	if !decodeJSON(w, r, &req) {
		return
	}
	if req.Content == nil || strings.TrimSpace(*req.Content) == "" {
		response.ValidationError(w, "content is required", map[string]string{"content": "required"})
		return
	}
	note, err := h.store.UpdateNote(r.Context(), id, req)
	if err != nil {
		writeStoreError(w, h.logger, err)
		return
	}
	worker.Emit(r.Context(), h.pool, "note.updated", "note", itoa64(note.ID), note)
	response.OK(w, note, "Note updated")
}

// ---------------------------------------------------------------------------
// Activities
// ---------------------------------------------------------------------------

func (h *Handler) createActivity(w http.ResponseWriter, r *http.Request) {
	orderID := strings.TrimSpace(r.PathValue("orderId"))
	var req CreateActivityRequest
	if !decodeJSON(w, r, &req) {
		return
	}
	if strings.TrimSpace(req.Type) == "" || strings.TrimSpace(req.Message) == "" {
		response.ValidationError(w, "type and message are required", map[string]string{
			"type": "required", "message": "required",
		})
		return
	}
	activity, err := h.store.CreateActivity(r.Context(), orderID, req)
	if err != nil {
		writeStoreError(w, h.logger, err)
		return
	}
	worker.Emit(r.Context(), h.pool, "activity.created", "order", orderID, activity)
	response.Created(w, activity, "Activity recorded")
}

// ---------------------------------------------------------------------------
// Requests
// ---------------------------------------------------------------------------

func (h *Handler) listRequests(w http.ResponseWriter, r *http.Request) {
	limit, offset := pagination(r)
	status := strings.TrimSpace(r.URL.Query().Get("status"))
	requests, err := h.store.ListRequests(r.Context(), status, limit, offset)
	if err != nil {
		writeStoreError(w, h.logger, err)
		return
	}
	response.OK(w, requests, "Requests retrieved")
}

func (h *Handler) getRequest(w http.ResponseWriter, r *http.Request) {
	id, ok := pathID(w, r)
	if !ok {
		return
	}
	request, err := h.store.GetRequest(r.Context(), id)
	if err != nil {
		writeStoreError(w, h.logger, err)
		return
	}
	response.OK(w, request, "Request retrieved")
}

func (h *Handler) updateRequest(w http.ResponseWriter, r *http.Request) {
	id, ok := pathID(w, r)
	if !ok {
		return
	}
	var req UpdateRequestRequest
	if !decodeJSON(w, r, &req) {
		return
	}
	request, err := h.store.UpdateRequest(r.Context(), id, req)
	if err != nil {
		writeStoreError(w, h.logger, err)
		return
	}
	worker.Emit(r.Context(), h.pool, "request.updated", "request", itoa64(request.ID), request)
	response.OK(w, request, "Request updated")
}

// ---------------------------------------------------------------------------
// Projects
// ---------------------------------------------------------------------------

func (h *Handler) listProjects(w http.ResponseWriter, r *http.Request) {
	limit, offset := pagination(r)
	projects, err := h.store.ListProjects(r.Context(), limit, offset)
	if err != nil {
		writeStoreError(w, h.logger, err)
		return
	}
	response.OK(w, projects, "Projects retrieved")
}

func (h *Handler) getProject(w http.ResponseWriter, r *http.Request) {
	id, ok := pathID(w, r)
	if !ok {
		return
	}
	project, err := h.store.GetProject(r.Context(), id)
	if err != nil {
		writeStoreError(w, h.logger, err)
		return
	}
	response.OK(w, project, "Project retrieved")
}

func (h *Handler) updateProject(w http.ResponseWriter, r *http.Request) {
	id, ok := pathID(w, r)
	if !ok {
		return
	}
	var req UpdateProjectRequest
	if !decodeJSON(w, r, &req) {
		return
	}
	project, err := h.store.UpdateProject(r.Context(), id, req)
	if err != nil {
		writeStoreError(w, h.logger, err)
		return
	}
	worker.Emit(r.Context(), h.pool, "project.updated", "project", itoa64(project.ID), project)
	response.OK(w, project, "Project updated")
}

// ---------------------------------------------------------------------------
// Articles
// ---------------------------------------------------------------------------

func (h *Handler) listArticles(w http.ResponseWriter, r *http.Request) {
	limit, offset := pagination(r)
	includeUnpublished := strings.EqualFold(r.URL.Query().Get("includeUnpublished"), "true")
	articles, err := h.store.ListArticles(r.Context(), includeUnpublished, limit, offset)
	if err != nil {
		writeStoreError(w, h.logger, err)
		return
	}
	response.OK(w, articles, "Articles retrieved")
}

func (h *Handler) createArticle(w http.ResponseWriter, r *http.Request) {
	var req CreateArticleRequest
	if !decodeJSON(w, r, &req) {
		return
	}
	if strings.TrimSpace(req.Title) == "" || strings.TrimSpace(req.Slug) == "" || strings.TrimSpace(req.Content) == "" {
		response.ValidationError(w, "title, slug and content are required", map[string]string{
			"title": "required", "slug": "required", "content": "required",
		})
		return
	}
	article, err := h.store.CreateArticle(r.Context(), req)
	if err != nil {
		writeStoreError(w, h.logger, err)
		return
	}
	worker.Emit(r.Context(), h.pool, "article.created", "article", itoa64(article.ID), article)
	response.Created(w, article, "Article created")
}

func (h *Handler) updateArticle(w http.ResponseWriter, r *http.Request) {
	id, ok := pathID(w, r)
	if !ok {
		return
	}
	var req UpdateArticleRequest
	if !decodeJSON(w, r, &req) {
		return
	}
	article, err := h.store.UpdateArticle(r.Context(), id, req)
	if err != nil {
		writeStoreError(w, h.logger, err)
		return
	}
	worker.Emit(r.Context(), h.pool, "article.updated", "article", itoa64(article.ID), article)
	response.OK(w, article, "Article updated")
}

// ---------------------------------------------------------------------------
// WhatsApp
// ---------------------------------------------------------------------------

func (h *Handler) whatsappSend(w http.ResponseWriter, r *http.Request) {
	var req WhatsAppSendRequest
	if !decodeJSON(w, r, &req) {
		return
	}
	if strings.TrimSpace(req.To) == "" || strings.TrimSpace(req.Message) == "" {
		response.ValidationError(w, "to and message are required", map[string]string{
			"to": "required", "message": "required",
		})
		return
	}
	if h.notifier == nil {
		response.Fail(w, http.StatusServiceUnavailable, "WhatsApp delivery is not configured", "NOT_CONFIGURED")
		return
	}
	if err := h.notifier.SendWhatsApp(r.Context(), req.To, req.Message); err != nil {
		h.logger.ErrorContext(r.Context(), "whatsapp send failed", "error", err, "to", req.To)
		response.Fail(w, http.StatusBadGateway, "WhatsApp delivery failed", "DELIVERY_FAILED")
		return
	}
	response.OK(w, map[string]any{"to": req.To, "accepted": true}, "WhatsApp message accepted")
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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
	return limit, offset
}

func pathID(w http.ResponseWriter, r *http.Request) (int64, bool) {
	raw := strings.TrimSpace(r.PathValue("id"))
	id, err := strconv.ParseInt(raw, 10, 64)
	if err != nil || id <= 0 {
		response.BadRequest(w, "Invalid id")
		return 0, false
	}
	return id, true
}

func decodeJSON(w http.ResponseWriter, r *http.Request, dst any) bool {
	body, err := io.ReadAll(io.LimitReader(r.Body, 4<<20))
	if err != nil {
		response.BadRequest(w, "Unable to read request body")
		return false
	}
	if len(body) == 0 {
		response.BadRequest(w, "Request body is required")
		return false
	}
	if err := json.Unmarshal(body, dst); err != nil {
		response.BadRequest(w, "Invalid JSON body")
		return false
	}
	return true
}

func writeStoreError(w http.ResponseWriter, logger *slog.Logger, err error) {
	var pgErr *pgconn.PgError
	if errors.As(err, &pgErr) {
		switch pgErr.Code {
		case pgerrcode.UniqueViolation:
			response.Conflict(w, "Resource already exists")
			return
		case pgerrcode.ForeignKeyViolation:
			response.ValidationError(w, "Related resource does not exist", map[string]string{"reference": "invalid"})
			return
		case pgerrcode.CheckViolation, pgerrcode.InvalidTextRepresentation, pgerrcode.NotNullViolation:
			response.ValidationError(w, "Invalid value", map[string]string{"value": pgErr.Message})
			return
		}
	}
	if errors.Is(err, pgx.ErrNoRows) {
		response.NotFound(w, "Resource not found")
		return
	}
	logger.Error("agent store error", "error", err)
	response.Internal(w)
}
