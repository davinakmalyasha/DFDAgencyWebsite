package admin

import (
	"encoding/json"
	"errors"
	"io"
	"log/slog"
	"net/http"
	"strconv"
	"strings"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/dfd-agency/api/internal/modules/docs"
	platformauth "github.com/dfd-agency/api/internal/platform/auth"
	"github.com/dfd-agency/api/internal/platform/http/response"
	"github.com/dfd-agency/api/internal/platform/worker"
)

// Handler serves back-office routes.
type Handler struct {
	store       *Store
	docs        *docs.Store
	pool        *pgxpool.Pool
	logger      *slog.Logger
	frontendURL string
}

// NewHandler builds an admin handler.
func NewHandler(store *Store, docStore *docs.Store, pool *pgxpool.Pool, logger *slog.Logger, frontendURL string) *Handler {
	return &Handler{store: store, docs: docStore, pool: pool, logger: logger, frontendURL: frontendURL}
}

// Register mounts admin routes. Cookie auth + role enforcement is applied by
// the caller via the guard wrapper.
func (h *Handler) Register(mux *http.ServeMux, guard func(http.Handler) http.Handler) {
	// Users
	mux.Handle("GET /api/v1/users", guard(http.HandlerFunc(h.listUsers)))
	mux.Handle("GET /api/v1/users/{id}", guard(http.HandlerFunc(h.getUser)))
	mux.Handle("POST /api/v1/users", guard(http.HandlerFunc(h.createUser)))
	mux.Handle("PUT /api/v1/users/{id}", guard(http.HandlerFunc(h.updateUser)))
	mux.Handle("DELETE /api/v1/users/{id}", guard(http.HandlerFunc(h.deleteUser)))
	mux.Handle("POST /api/v1/users/{id}/resend-invite", guard(http.HandlerFunc(h.resendInvite)))
	mux.Handle("POST /api/v1/users/{id}/revoke", guard(http.HandlerFunc(h.revokeSessions)))

	// Leads
	mux.Handle("GET /api/v1/leads", guard(http.HandlerFunc(h.listLeads)))
	mux.Handle("GET /api/v1/leads/{id}", guard(http.HandlerFunc(h.getLead)))
	mux.Handle("PUT /api/v1/leads/{id}/status", guard(http.HandlerFunc(h.updateLeadStatus)))
	mux.Handle("DELETE /api/v1/leads/{id}", guard(http.HandlerFunc(h.deleteLead)))

	// Orders
	mux.Handle("GET /api/v1/orders", guard(http.HandlerFunc(h.listOrders)))
	mux.Handle("GET /api/v1/orders/{id}", guard(http.HandlerFunc(h.getOrder)))
	mux.Handle("DELETE /api/v1/orders/{id}", guard(http.HandlerFunc(h.deleteOrder)))
	mux.Handle("POST /api/v1/orders/{id}/promote", guard(http.HandlerFunc(h.promoteOrder)))

	// Order notes / resources / milestones / activity (admin). All PATCH
	// shapes share one two-segment pattern with manual dispatch because Go
	// ServeMux rejects overlapping wildcards
	// (/orders/notes/{id} vs /orders/{id}/status).
	mux.Handle("GET /api/v1/orders/{orderId}/notes", guard(http.HandlerFunc(h.listNotes)))
	mux.Handle("POST /api/v1/orders/{orderId}/notes", guard(http.HandlerFunc(h.createNote)))
	mux.Handle("GET /api/v1/orders/{orderId}/resources", guard(http.HandlerFunc(h.listResources)))
	mux.Handle("POST /api/v1/orders/{orderId}/resources", guard(http.HandlerFunc(h.createResource)))
	mux.Handle("GET /api/v1/orders/{orderId}/milestones", guard(http.HandlerFunc(h.listMilestones)))
	mux.Handle("POST /api/v1/orders/{orderId}/milestones", guard(http.HandlerFunc(h.createMilestone)))
	mux.Handle("PATCH /api/v1/orders/{segment}/{key}", guard(http.HandlerFunc(h.patchOrderSub)))
	mux.Handle("DELETE /api/v1/orders/notes/{noteId}", guard(http.HandlerFunc(h.deleteNote)))
	mux.Handle("DELETE /api/v1/orders/resources/{resourceId}", guard(http.HandlerFunc(h.deleteResource)))
	mux.Handle("DELETE /api/v1/orders/milestones/{id}", guard(http.HandlerFunc(h.deleteMilestone)))
	mux.Handle("GET /api/v1/orders/{orderId}/activity", guard(http.HandlerFunc(h.orderActivity)))
	mux.Handle("GET /api/v1/orders/{orderId}/whatsapp-link", guard(http.HandlerFunc(h.whatsappLink)))
	mux.Handle("GET /api/v1/orders/{id}/invoice", guard(http.HandlerFunc(h.downloadInvoice)))
	mux.Handle("GET /api/v1/orders/{id}/contract", guard(http.HandlerFunc(h.downloadContract)))
	mux.Handle("GET /api/v1/orders/{id}/welcome", guard(http.HandlerFunc(h.downloadWelcome)))
}

// patchOrderSub dispatches the overlapping PATCH shapes the frontend uses:
//   - /orders/{id}/status             → order status
//   - /orders/notes/{noteId}          → note update
//   - /orders/resources/{resourceId}  → resource update
//   - /orders/milestones/{id}         → milestone update
func (h *Handler) patchOrderSub(w http.ResponseWriter, r *http.Request) {
	segment := strings.TrimSpace(r.PathValue("segment"))
	key := strings.TrimSpace(r.PathValue("key"))
	if key == "status" {
		r.SetPathValue("id", segment)
		h.updateOrderStatus(w, r)
		return
	}
	if _, err := strconv.ParseInt(key, 10, 64); err != nil {
		response.BadRequest(w, "Invalid id")
		return
	}
	switch segment {
	case "notes":
		r.SetPathValue("noteId", key)
		h.updateNote(w, r)
	case "resources":
		r.SetPathValue("resourceId", key)
		h.updateResource(w, r)
	case "milestones":
		r.SetPathValue("id", key)
		h.updateMilestone(w, r)
	default:
		response.NotFound(w, "Resource not found")
	}
}

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------

func (h *Handler) listUsers(w http.ResponseWriter, r *http.Request) {
	limit, offset := adminPagination(r)
	users, total, err := h.store.ListUsers(r.Context(),
		strings.TrimSpace(r.URL.Query().Get("role")),
		strings.TrimSpace(r.URL.Query().Get("search")),
		limit, offset)
	if err != nil {
		writeErr(w, h.logger, err)
		return
	}
	page, limitOut := pageOf(r, limit)
	writePaginated(w, users, total, page, limitOut)
}

func (h *Handler) getUser(w http.ResponseWriter, r *http.Request) {
	id, ok := pathInt(w, r)
	if !ok {
		return
	}
	user, err := h.store.GetUser(r.Context(), id)
	if err != nil {
		writeErr(w, h.logger, err)
		return
	}
	response.OK(w, user, "User retrieved")
}

func (h *Handler) createUser(w http.ResponseWriter, r *http.Request) {
	var body struct {
		Username   string `json:"username"`
		Email      string `json:"email"`
		Password   string `json:"password"`
		Role       string `json:"role"`
		LeadID     *int64 `json:"leadId"`
		SendInvite *bool  `json:"sendInvite"`
	}
	if !decodeJSON(w, r, &body) {
		return
	}
	if len(strings.TrimSpace(body.Username)) < 3 || !strings.Contains(body.Email, "@") {
		response.ValidationError(w, "Invalid user", map[string]string{
			"username": "min 3 chars", "email": "invalid email",
		})
		return
	}
	role := strings.ToUpper(strings.TrimSpace(body.Role))
	if role == "" {
		role = "EDITOR"
	}
	switch role {
	case "SUPERADMIN", "EDITOR", "CLIENT":
	default:
		response.ValidationError(w, "Invalid role", map[string]string{"role": "unknown role"})
		return
	}
	if role != "CLIENT" && len(body.Password) < 8 {
		response.ValidationError(w, "Invalid user", map[string]string{"password": "min 8 chars"})
		return
	}
	user, err := h.store.CreateUser(r.Context(), body.Username, body.Email, body.Password, role, body.LeadID)
	if err != nil {
		if isUniqueViolation(err) {
			response.Conflict(w, "Username or email already exists")
			return
		}
		writeErr(w, h.logger, err)
		return
	}
	// CLIENT accounts (or explicit sendInvite) get a passwordless invite.
	inviteURL := ""
	sendInvite := body.SendInvite == nil || *body.SendInvite
	if (sendInvite && role == "CLIENT") || (body.SendInvite != nil && *body.SendInvite) {
		_, url, _, err := h.store.IssueInvite(r.Context(), user.ID, h.frontendURL)
		if err != nil {
			h.logger.ErrorContext(r.Context(), "issue invite failed", "error", err)
		} else {
			inviteURL = url
		}
	}
	h.audit(r, "CREATE_USER", "User ID: "+itoa64(user.ID), nil)
	response.Created(w, map[string]any{"user": user, "inviteUrl": inviteURL}, "User created")
}

func (h *Handler) updateUser(w http.ResponseWriter, r *http.Request) {
	id, ok := pathInt(w, r)
	if !ok {
		return
	}
	var body struct {
		Username  *string `json:"username"`
		Email     *string `json:"email"`
		Role      *string `json:"role"`
		LeadID    *int64  `json:"leadId"`
		ClearLead *bool   `json:"clearLead"`
	}
	if !decodeJSON(w, r, &body) {
		return
	}
	var role *string
	if body.Role != nil {
		up := strings.ToUpper(strings.TrimSpace(*body.Role))
		switch up {
		case "SUPERADMIN", "EDITOR", "CLIENT":
			role = &up
		default:
			response.ValidationError(w, "Invalid role", map[string]string{"role": "unknown role"})
			return
		}
	}
	clearLead := body.ClearLead != nil && *body.ClearLead
	user, err := h.store.UpdateUser(r.Context(), id, body.Username, body.Email, role, body.LeadID, clearLead)
	if err != nil {
		if isUniqueViolation(err) {
			response.Conflict(w, "Username or email already exists")
			return
		}
		writeErr(w, h.logger, err)
		return
	}
	h.audit(r, "UPDATE_USER", "User ID: "+itoa64(id), nil)
	response.OK(w, user, "User updated")
}

func (h *Handler) deleteUser(w http.ResponseWriter, r *http.Request) {
	id, ok := pathInt(w, r)
	if !ok {
		return
	}
	actor, _ := platformauth.ActorFrom(r.Context())
	if actor.UserID == id {
		response.Fail(w, http.StatusBadRequest, "You cannot delete your own account", "SELF_DELETE")
		return
	}
	if err := h.store.SoftDeleteUser(r.Context(), id); err != nil {
		writeErr(w, h.logger, err)
		return
	}
	h.audit(r, "DELETE_USER", "User ID: "+itoa64(id), nil)
	response.OK(w, nil, "User deleted")
}

func (h *Handler) resendInvite(w http.ResponseWriter, r *http.Request) {
	id, ok := pathInt(w, r)
	if !ok {
		return
	}
	_, url, expiry, err := h.store.IssueInvite(r.Context(), id, h.frontendURL)
	if err != nil {
		writeErr(w, h.logger, err)
		return
	}
	h.audit(r, "RESEND_INVITE", "User "+itoa64(id), map[string]any{"inviteUrl": url})
	response.OK(w, map[string]any{"inviteUrl": url, "expiry": expiry}, "Invite sent")
}

func (h *Handler) revokeSessions(w http.ResponseWriter, r *http.Request) {
	id, ok := pathInt(w, r)
	if !ok {
		return
	}
	if err := h.store.RevokeSessions(r.Context(), id); err != nil {
		writeErr(w, h.logger, err)
		return
	}
	h.audit(r, "REVOKE_SESSIONS", "User "+itoa64(id), nil)
	response.OK(w, nil, "Sessions revoked")
}

// ---------------------------------------------------------------------------
// Leads
// ---------------------------------------------------------------------------

func (h *Handler) listLeads(w http.ResponseWriter, r *http.Request) {
	limit, offset := adminPagination(r)
	leads, total, err := h.store.ListLeads(r.Context(), limit, offset)
	if err != nil {
		writeErr(w, h.logger, err)
		return
	}
	page, limitOut := pageOf(r, limit)
	writePaginatedData(w, leads, total, page, limitOut, "Leads retrieved")
}

func (h *Handler) getLead(w http.ResponseWriter, r *http.Request) {
	id, ok := pathInt(w, r)
	if !ok {
		return
	}
	lead, err := h.store.GetLead(r.Context(), id)
	if err != nil {
		writeErr(w, h.logger, err)
		return
	}
	response.OK(w, lead, "Lead retrieved")
}

func (h *Handler) updateLeadStatus(w http.ResponseWriter, r *http.Request) {
	id, ok := pathInt(w, r)
	if !ok {
		return
	}
	var body struct {
		Status string `json:"status"`
	}
	if !decodeJSON(w, r, &body) {
		return
	}
	switch body.Status {
	case "NEW", "CONTACTED", "CLOSED_WON", "CLOSED_LOST":
	default:
		response.ValidationError(w, "Invalid status", map[string]string{"status": "unknown status"})
		return
	}
	lead, err := h.store.UpdateLeadStatus(r.Context(), id, body.Status)
	if err != nil {
		writeErr(w, h.logger, err)
		return
	}
	response.OK(w, lead, "Lead status updated")
}

func (h *Handler) deleteLead(w http.ResponseWriter, r *http.Request) {
	id, ok := pathInt(w, r)
	if !ok {
		return
	}
	if err := h.store.SoftDeleteLead(r.Context(), id); err != nil {
		writeErr(w, h.logger, err)
		return
	}
	response.OK(w, nil, "Lead deleted")
}

// ---------------------------------------------------------------------------
// Orders
// ---------------------------------------------------------------------------

func (h *Handler) listOrders(w http.ResponseWriter, r *http.Request) {
	limit, offset := adminPagination(r)
	orders, total, err := h.store.ListOrders(r.Context(), limit, offset)
	if err != nil {
		writeErr(w, h.logger, err)
		return
	}
	page, limitOut := pageOf(r, limit)
	writePaginatedData(w, orders, total, page, limitOut, "Orders retrieved")
}

func (h *Handler) getOrder(w http.ResponseWriter, r *http.Request) {
	id := strings.TrimSpace(r.PathValue("id"))
	order, err := h.store.GetOrder(r.Context(), id)
	if err != nil {
		writeErr(w, h.logger, err)
		return
	}
	response.OK(w, order, "Order retrieved")
}

func (h *Handler) updateOrderStatus(w http.ResponseWriter, r *http.Request) {
	id := strings.TrimSpace(r.PathValue("id"))
	var body struct {
		Status     string  `json:"status"`
		HandoffURL *string `json:"handoffUrl"`
	}
	if !decodeJSON(w, r, &body) {
		return
	}
	switch body.Status {
	case "PENDING_PAYMENT", "PROCESSING", "REVISION", "COMPLETED", "CANCELLED":
	default:
		response.ValidationError(w, "Invalid status", map[string]string{"status": "unknown status"})
		return
	}
	updated, err := h.store.UpdateOrderStatus(r.Context(), id, body.Status, body.HandoffURL)
	if err != nil {
		writeErr(w, h.logger, err)
		return
	}
	worker.Emit(r.Context(), h.pool, "order.status", "order", id, updated)
	response.OK(w, updated, "Order status updated")
}

func (h *Handler) deleteOrder(w http.ResponseWriter, r *http.Request) {
	id := strings.TrimSpace(r.PathValue("id"))
	if err := h.store.SoftDeleteOrder(r.Context(), id); err != nil {
		writeErr(w, h.logger, err)
		return
	}
	response.OK(w, nil, "Order deleted")
}

func (h *Handler) promoteOrder(w http.ResponseWriter, r *http.Request) {
	id := strings.TrimSpace(r.PathValue("id"))
	project, err := h.store.PromoteOrder(r.Context(), id)
	if err != nil {
		if se, ok := err.(*statusError); ok {
			response.Fail(w, se.code, se.message, "PROMOTE_FAILED")
			return
		}
		writeErr(w, h.logger, err)
		return
	}
	h.audit(r, "PROMOTE_ORDER_TO_PROJECT", "Order: "+id, nil)
	response.Created(w, project, "Order promoted to portfolio project successfully")
}

// ---------------------------------------------------------------------------
// Order notes
// ---------------------------------------------------------------------------

// NoteView is the admin note view with author name.
type NoteView struct {
	ID        int64   `json:"id"`
	OrderID   string  `json:"orderId"`
	Content   string  `json:"content"`
	IsPublic  bool    `json:"isPublic"`
	IsClient  bool    `json:"isClient"`
	AuthorID  *int64  `json:"authorId"`
	Author    *string `json:"author,omitempty"`
	IsEdited  bool    `json:"isEdited"`
	IsDeleted bool    `json:"isDeleted"`
	ParentID  *int64  `json:"parentId"`
	CreatedAt string  `json:"createdAt"`
	UpdatedAt string  `json:"updatedAt"`
}

func (h *Handler) listNotes(w http.ResponseWriter, r *http.Request) {
	orderID := strings.TrimSpace(r.PathValue("orderId"))
	notes, err := h.store.ListNotes(r.Context(), orderID)
	if err != nil {
		writeErr(w, h.logger, err)
		return
	}
	response.OK(w, notes, "Notes retrieved")
}

func (h *Handler) createNote(w http.ResponseWriter, r *http.Request) {
	orderID := strings.TrimSpace(r.PathValue("orderId"))
	var body struct {
		Content  string `json:"content"`
		IsPublic *bool  `json:"isPublic"`
		ParentID *int64 `json:"parentId"`
	}
	if !decodeJSON(w, r, &body) {
		return
	}
	if strings.TrimSpace(body.Content) == "" {
		response.BadRequest(w, "Note content cannot be empty")
		return
	}
	actor, _ := platformauth.ActorFrom(r.Context())
	var authorID *int64
	if actor.Type == "user" {
		authorID = &actor.UserID
	}
	note, err := h.store.CreateAdminNote(r.Context(), orderID, strings.TrimSpace(body.Content), body.IsPublic, authorID, body.ParentID)
	if err != nil {
		writeErr(w, h.logger, err)
		return
	}
	response.Created(w, note, "Note created")
}

func (h *Handler) updateNote(w http.ResponseWriter, r *http.Request) {
	noteID, ok := pathInt64(w, r, "noteId")
	if !ok {
		return
	}
	var body struct {
		Content *string `json:"content"`
	}
	if !decodeJSON(w, r, &body) {
		return
	}
	note, err := h.store.UpdateAdminNote(r.Context(), noteID, body.Content)
	if err != nil {
		writeErr(w, h.logger, err)
		return
	}
	response.OK(w, note, "Note updated")
}

func (h *Handler) deleteNote(w http.ResponseWriter, r *http.Request) {
	noteID, ok := pathInt64(w, r, "noteId")
	if !ok {
		return
	}
	if err := h.store.DeleteAdminNote(r.Context(), noteID); err != nil {
		writeErr(w, h.logger, err)
		return
	}
	response.OK(w, nil, "Note deleted")
}

// ---------------------------------------------------------------------------
// Order resources
// ---------------------------------------------------------------------------

func (h *Handler) listResources(w http.ResponseWriter, r *http.Request) {
	orderID := strings.TrimSpace(r.PathValue("orderId"))
	resources, err := h.store.ListResources(r.Context(), orderID)
	if err != nil {
		writeErr(w, h.logger, err)
		return
	}
	response.OK(w, resources, "Resources retrieved")
}

func (h *Handler) createResource(w http.ResponseWriter, r *http.Request) {
	orderID := strings.TrimSpace(r.PathValue("orderId"))
	var body struct {
		Title string  `json:"title"`
		URL   string  `json:"url"`
		Icon  *string `json:"icon"`
	}
	if !decodeJSON(w, r, &body) {
		return
	}
	if strings.TrimSpace(body.Title) == "" || strings.TrimSpace(body.URL) == "" {
		response.ValidationError(w, "Invalid resource", map[string]string{"title": "required", "url": "required"})
		return
	}
	resource, err := h.store.CreateResource(r.Context(), orderID, strings.TrimSpace(body.Title), strings.TrimSpace(body.URL), body.Icon)
	if err != nil {
		writeErr(w, h.logger, err)
		return
	}
	response.Created(w, resource, "Resource created")
}

func (h *Handler) updateResource(w http.ResponseWriter, r *http.Request) {
	resourceID, ok := pathInt64(w, r, "resourceId")
	if !ok {
		return
	}
	var body struct {
		Title *string `json:"title"`
		URL   *string `json:"url"`
		Icon  *string `json:"icon"`
	}
	if !decodeJSON(w, r, &body) {
		return
	}
	resource, err := h.store.UpdateResource(r.Context(), resourceID, body.Title, body.URL, body.Icon)
	if err != nil {
		writeErr(w, h.logger, err)
		return
	}
	response.OK(w, resource, "Resource updated")
}

func (h *Handler) deleteResource(w http.ResponseWriter, r *http.Request) {
	resourceID, ok := pathInt64(w, r, "resourceId")
	if !ok {
		return
	}
	if err := h.store.DeleteResource(r.Context(), resourceID); err != nil {
		writeErr(w, h.logger, err)
		return
	}
	response.OK(w, nil, "Resource deleted")
}

// ---------------------------------------------------------------------------
// Milestones (admin)
// ---------------------------------------------------------------------------

func (h *Handler) listMilestones(w http.ResponseWriter, r *http.Request) {
	orderID := strings.TrimSpace(r.PathValue("orderId"))
	milestones, err := h.store.ListMilestones(r.Context(), orderID)
	if err != nil {
		writeErr(w, h.logger, err)
		return
	}
	response.OK(w, milestones, "Milestones retrieved")
}

func (h *Handler) createMilestone(w http.ResponseWriter, r *http.Request) {
	orderID := strings.TrimSpace(r.PathValue("orderId"))
	var body struct {
		Title        string  `json:"title"`
		Description  *string `json:"description"`
		CoverURL     *string `json:"coverUrl"`
		Category     *string `json:"category"`
		Status       *string `json:"status"`
		NotifyClient *bool   `json:"notifyClient"`
	}
	if !decodeJSON(w, r, &body) {
		return
	}
	if strings.TrimSpace(body.Title) == "" {
		response.ValidationError(w, "Invalid milestone", map[string]string{"title": "required"})
		return
	}
	actor, _ := platformauth.ActorFrom(r.Context())
	milestone, err := h.store.CreateMilestone(r.Context(), orderID, actor.UserID, body.Title,
		body.Description, body.CoverURL, body.Category, body.Status, body.NotifyClient)
	if err != nil {
		writeErr(w, h.logger, err)
		return
	}
	response.Created(w, milestone, "Milestone created")
}

func (h *Handler) updateMilestone(w http.ResponseWriter, r *http.Request) {
	id, ok := pathInt(w, r)
	if !ok {
		return
	}
	var body map[string]any
	if !decodeJSON(w, r, &body) {
		return
	}
	milestone, err := h.store.UpdateMilestone(r.Context(), id, body)
	if err != nil {
		writeErr(w, h.logger, err)
		return
	}
	response.OK(w, milestone, "Milestone updated")
}

func (h *Handler) deleteMilestone(w http.ResponseWriter, r *http.Request) {
	id, ok := pathInt(w, r)
	if !ok {
		return
	}
	if err := h.store.DeleteMilestone(r.Context(), id); err != nil {
		writeErr(w, h.logger, err)
		return
	}
	response.OK(w, nil, "Milestone deleted")
}

// ---------------------------------------------------------------------------
// Activity + WhatsApp link
// ---------------------------------------------------------------------------

func (h *Handler) orderActivity(w http.ResponseWriter, r *http.Request) {
	orderID := strings.TrimSpace(r.PathValue("orderId"))
	activities, err := h.store.OrderActivity(r.Context(), orderID)
	if err != nil {
		writeErr(w, h.logger, err)
		return
	}
	response.OK(w, activities, "Activity retrieved")
}

func (h *Handler) whatsappLink(w http.ResponseWriter, r *http.Request) {
	orderID := strings.TrimSpace(r.PathValue("orderId"))
	link, err := h.store.WhatsappLink(r.Context(), orderID, h.frontendURL)
	if err != nil {
		writeErr(w, h.logger, err)
		return
	}
	response.OK(w, link, "WhatsApp link generated")
}

func (h *Handler) downloadInvoice(w http.ResponseWriter, r *http.Request) {
	docs.Serve(w, r, h.docs, strings.TrimSpace(r.PathValue("id")), docs.KindInvoice, h.frontendURL)
}

func (h *Handler) downloadContract(w http.ResponseWriter, r *http.Request) {
	orderID := strings.TrimSpace(r.PathValue("id"))
	docs.Serve(w, r, h.docs, orderID, docs.KindContract, h.frontendURL)
	h.store.RememberContract(r.Context(), orderID)
}

func (h *Handler) downloadWelcome(w http.ResponseWriter, r *http.Request) {
	docs.Serve(w, r, h.docs, strings.TrimSpace(r.PathValue("id")), docs.KindWelcome, h.frontendURL)
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

func adminPagination(r *http.Request) (limit, offset int) {
	limit = 10
	offset = 0
	if raw := r.URL.Query().Get("limit"); raw != "" {
		if v, err := strconv.Atoi(raw); err == nil && v > 0 {
			limit = v
		}
	}
	if limit > 100 {
		limit = 100
	}
	if raw := r.URL.Query().Get("page"); raw != "" {
		if v, err := strconv.Atoi(raw); err == nil && v > 1 {
			offset = (v - 1) * limit
		}
	}
	return limit, offset
}

func pageOf(r *http.Request, limit int) (page, limitOut int) {
	page = 1
	if raw := r.URL.Query().Get("page"); raw != "" {
		if v, err := strconv.Atoi(raw); err == nil && v > 0 {
			page = v
		}
	}
	return page, limit
}

func pathInt(w http.ResponseWriter, r *http.Request) (int64, bool) {
	raw := strings.TrimSpace(r.PathValue("id"))
	id, err := strconv.ParseInt(raw, 10, 64)
	if err != nil || id <= 0 {
		response.BadRequest(w, "Invalid id")
		return 0, false
	}
	return id, true
}

func pathInt64(w http.ResponseWriter, r *http.Request, name string) (int64, bool) {
	raw := strings.TrimSpace(r.PathValue(name))
	id, err := strconv.ParseInt(raw, 10, 64)
	if err != nil || id <= 0 {
		response.BadRequest(w, "Invalid id")
		return 0, false
	}
	return id, true
}

func decodeJSON(w http.ResponseWriter, r *http.Request, dst any) bool {
	raw, err := io.ReadAll(io.LimitReader(r.Body, 1<<20))
	if err != nil || len(raw) == 0 {
		response.BadRequest(w, "Request body is required")
		return false
	}
	if err := json.Unmarshal(raw, dst); err != nil {
		response.BadRequest(w, "Invalid JSON body")
		return false
	}
	return true
}

func writeErr(w http.ResponseWriter, logger *slog.Logger, err error) {
	if errors.Is(err, pgx.ErrNoRows) {
		response.NotFound(w, "Resource not found")
		return
	}
	if se, ok := err.(*statusError); ok {
		response.Fail(w, se.code, se.message, "REQUEST_FAILED")
		return
	}
	if isUniqueViolation(err) {
		response.Conflict(w, "Resource already exists")
		return
	}
	logger.Error("admin store error", "error", err)
	response.Internal(w)
}

func writePaginated(w http.ResponseWriter, data any, total int64, page, limit int) {
	totalPages := int((total + int64(limit) - 1) / int64(limit))
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(map[string]any{
		"success": true,
		"data":    data,
		"meta": map[string]any{
			"total": total, "page": page, "limit": limit, "totalPages": totalPages,
			"hasNextPage": page < totalPages, "hasPrevPage": page > 1,
		},
	})
}

// writePaginatedData keeps the legacy {data:{data,meta}} shape some admin
// pages expect... no — the canonical envelope carries data directly; admin
// list pages read res.data.data which is the array. Plain OK is enough.
func writePaginatedData(w http.ResponseWriter, data any, total int64, page, limit int, message string) {
	if message == "" {
		message = "OK"
	}
	response.OK(w, data, message)
}

func (h *Handler) audit(r *http.Request, action, target string, details map[string]any) {
	actor, ok := platformauth.ActorFrom(r.Context())
	if !ok || actor.Type != "user" {
		return
	}
	if err := h.store.WriteAudit(r.Context(), actor.UserID, action, target, details, clientIP(r)); err != nil {
		h.logger.WarnContext(r.Context(), "audit write failed", "error", err)
	}
}

func clientIP(r *http.Request) string {
	if fwd := r.Header.Get("X-Forwarded-For"); fwd != "" {
		if i := strings.Index(fwd, ","); i >= 0 {
			return strings.TrimSpace(fwd[:i])
		}
		return strings.TrimSpace(fwd)
	}
	return r.RemoteAddr
}

func itoa64(n int64) string {
	return strconv.FormatInt(n, 10)
}

var _ = pgtype.Text{}
