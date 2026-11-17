package client

import (
	"context"
	"encoding/json"
	"errors"
	"io"
	"log/slog"
	"net/http"
	"strconv"
	"strings"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/dfd-agency/api/internal/modules/docs"
	platformauth "github.com/dfd-agency/api/internal/platform/auth"
	"github.com/dfd-agency/api/internal/platform/http/response"
	"github.com/dfd-agency/api/internal/platform/worker"
)

// Notifier receives client portal events.
type Notifier interface {
	SendWhatsApp(ctx context.Context, to, message string) error
	SendEmail(ctx context.Context, to, subject, html string) error
}

// Handler serves the client portal.
type Handler struct {
	store       *Store
	docs        *docs.Store
	pool        *pgxpool.Pool
	logger      *slog.Logger
	notifier    Notifier
	frontendURL string
}

// NewHandler builds a client handler.
func NewHandler(store *Store, docStore *docs.Store, pool *pgxpool.Pool, logger *slog.Logger, notifier Notifier, frontendURL string) *Handler {
	return &Handler{store: store, docs: docStore, pool: pool, logger: logger, notifier: notifier, frontendURL: frontendURL}
}

// Register mounts client routes. Access is cookie auth; requireClientOrAdmin
// allows CLIENT, SUPERADMIN, and EDITOR.
func (h *Handler) Register(mux *http.ServeMux, guard func(http.Handler) http.Handler, adminGuard func(http.Handler) http.Handler) {
	mux.Handle("GET /api/v1/client/orders", guard(http.HandlerFunc(h.myOrders)))
	mux.Handle("GET /api/v1/client/orders/{id}/invoice", guard(http.HandlerFunc(h.downloadInvoice)))
	mux.Handle("GET /api/v1/client/orders/{id}/contract", guard(http.HandlerFunc(h.downloadContract)))
	mux.Handle("GET /api/v1/client/orders/{id}/welcome", guard(http.HandlerFunc(h.downloadWelcome)))
	mux.Handle("GET /api/v1/client/orders/{id}/milestones", guard(http.HandlerFunc(h.milestones)))
	mux.Handle("POST /api/v1/client/orders/{id}/milestones/{milestoneId}/view", guard(http.HandlerFunc(h.viewMilestone)))
	mux.Handle("POST /api/v1/client/orders/{id}/milestones/{milestoneId}/decide", guard(http.HandlerFunc(h.decideMilestone)))
	mux.Handle("GET /api/v1/client/requests", guard(http.HandlerFunc(h.myRequests)))
	mux.Handle("POST /api/v1/client/requests", guard(http.HandlerFunc(h.createRequest)))
	mux.Handle("POST /api/v1/client/feedback", guard(http.HandlerFunc(h.feedback)))
	mux.Handle("GET /api/v1/client/admin/requests", adminGuard(http.HandlerFunc(h.adminRequests)))
	mux.Handle("PATCH /api/v1/client/admin/requests/{id}", adminGuard(http.HandlerFunc(h.decideRequest)))
}

func (h *Handler) actor(r *http.Request) (platformauth.Actor, bool) {
	return platformauth.ActorFrom(r.Context())
}

func (h *Handler) myOrders(w http.ResponseWriter, r *http.Request) {
	actor, ok := h.actor(r)
	if !ok || actor.Type != "user" {
		response.Unauthorized(w, "Unauthorized")
		return
	}
	orders, err := h.store.ListMyOrders(r.Context(), actor.UserID, actor.Role)
	if err != nil {
		writeErr(w, h.logger, err)
		return
	}
	response.OK(w, orders, "Orders retrieved")
}

func (h *Handler) milestones(w http.ResponseWriter, r *http.Request) {
	actor, ok := h.actor(r)
	if !ok || actor.Type != "user" {
		response.Unauthorized(w, "Unauthorized")
		return
	}
	orderID := strings.TrimSpace(r.PathValue("id"))
	allowed, err := h.store.OwnsOrder(r.Context(), actor.UserID, actor.Role, orderID)
	if err != nil {
		writeErr(w, h.logger, err)
		return
	}
	if !allowed {
		response.Forbidden(w, "Forbidden")
		return
	}
	milestones, err := h.store.ListMilestones(r.Context(), orderID, actor.UserID)
	if err != nil {
		writeErr(w, h.logger, err)
		return
	}
	response.OK(w, milestones, "Milestones retrieved")
}

func (h *Handler) viewMilestone(w http.ResponseWriter, r *http.Request) {
	actor, ok := h.actor(r)
	if !ok || actor.Type != "user" {
		response.Unauthorized(w, "Unauthorized")
		return
	}
	orderID := strings.TrimSpace(r.PathValue("id"))
	milestoneID, good := pathInt64(w, r, "milestoneId")
	if !good {
		return
	}
	allowed, err := h.store.OwnsOrder(r.Context(), actor.UserID, actor.Role, orderID)
	if err != nil {
		writeErr(w, h.logger, err)
		return
	}
	if !allowed {
		response.Forbidden(w, "Forbidden")
		return
	}
	if err := h.store.MarkViewed(r.Context(), milestoneID, actor.UserID); err != nil {
		writeErr(w, h.logger, err)
		return
	}
	response.OK(w, nil, "Viewed")
}

func (h *Handler) decideMilestone(w http.ResponseWriter, r *http.Request) {
	actor, ok := h.actor(r)
	if !ok || actor.Type != "user" {
		response.Unauthorized(w, "Unauthorized")
		return
	}
	orderID := strings.TrimSpace(r.PathValue("id"))
	milestoneID, good := pathInt64(w, r, "milestoneId")
	if !good {
		return
	}
	allowed, err := h.store.OwnsOrder(r.Context(), actor.UserID, actor.Role, orderID)
	if err != nil {
		writeErr(w, h.logger, err)
		return
	}
	if !allowed {
		response.Forbidden(w, "Forbidden")
		return
	}
	var body struct {
		Action string  `json:"action"`
		Note   *string `json:"note"`
	}
	if !decodeJSON(w, r, &body) {
		return
	}
	if body.Action != "APPROVE" && body.Action != "REQUEST_REVISION" {
		response.ValidationError(w, "Invalid action", map[string]string{"action": "must be APPROVE or REQUEST_REVISION"})
		return
	}
	note := ""
	if body.Note != nil {
		note = *body.Note
	}
	result, err := h.store.DecideMilestone(r.Context(), milestoneID, actor.UserID, body.Action, note, orderID)
	if err != nil {
		if se, ok := err.(*statusError); ok {
			response.Fail(w, se.code, se.message, "DECIDE_FAILED")
			return
		}
		writeErr(w, h.logger, err)
		return
	}
	worker.Emit(r.Context(), h.pool, "milestone.decided", "order", orderID, result)
	if h.notifier != nil {
		_ = h.notifier.SendWhatsApp(r.Context(), "", "milestone decision")
	}
	response.OK(w, result, "Decision recorded")
}

func (h *Handler) myRequests(w http.ResponseWriter, r *http.Request) {
	actor, ok := h.actor(r)
	if !ok || actor.Type != "user" {
		response.Unauthorized(w, "Unauthorized")
		return
	}
	requests, err := h.store.ListMyRequests(r.Context(), actor.UserID)
	if err != nil {
		writeErr(w, h.logger, err)
		return
	}
	response.OK(w, requests, "Requests retrieved")
}

func (h *Handler) createRequest(w http.ResponseWriter, r *http.Request) {
	actor, ok := h.actor(r)
	if !ok || actor.Type != "user" {
		response.Unauthorized(w, "Unauthorized")
		return
	}
	var body struct {
		OrderID *string `json:"orderId"`
		Type    *string `json:"type"`
		Title   string  `json:"title"`
		Body    string  `json:"body"`
	}
	if !decodeJSON(w, r, &body) {
		return
	}
	reqType := "GENERAL"
	if body.Type != nil && *body.Type != "" {
		reqType = strings.ToUpper(strings.TrimSpace(*body.Type))
	}
	switch reqType {
	case "ACCESS", "FILE", "MEETING", "REVISION", "GENERAL":
	default:
		response.ValidationError(w, "Invalid type", map[string]string{"type": "unknown type"})
		return
	}
	if len(strings.TrimSpace(body.Title)) < 3 || len(body.Title) > 200 {
		response.ValidationError(w, "Invalid request", map[string]string{"title": "3-200 chars required"})
		return
	}
	if len(strings.TrimSpace(body.Body)) < 10 || len(body.Body) > 5000 {
		response.ValidationError(w, "Invalid request", map[string]string{"body": "10-5000 chars required"})
		return
	}
	var orderID *string
	if body.OrderID != nil && strings.TrimSpace(*body.OrderID) != "" {
		v := strings.TrimSpace(*body.OrderID)
		orderID = &v
	}
	row, err := h.store.CreateRequest(r.Context(), actor.UserID, orderID, reqType,
		strings.TrimSpace(body.Title), strings.TrimSpace(body.Body))
	if err != nil {
		writeErr(w, h.logger, err)
		return
	}
	worker.Emit(r.Context(), h.pool, "request.created", "request", itoa64(row.ID), row)
	response.Created(w, row, "Request created")
}

func (h *Handler) feedback(w http.ResponseWriter, r *http.Request) {
	actor, ok := h.actor(r)
	if !ok || actor.Type != "user" {
		response.Unauthorized(w, "Unauthorized")
		return
	}
	var body struct {
		OrderID string `json:"orderId"`
		Quote   string `json:"quote"`
	}
	if !decodeJSON(w, r, &body) {
		return
	}
	if len(strings.TrimSpace(body.Quote)) < 10 {
		response.BadRequest(w, "Feedback too short (min 10)")
		return
	}
	allowed, err := h.store.OwnsOrder(r.Context(), actor.UserID, actor.Role, strings.TrimSpace(body.OrderID))
	if err != nil {
		writeErr(w, h.logger, err)
		return
	}
	if !allowed {
		response.Forbidden(w, "Forbidden")
		return
	}
	name, business, err := h.store.LeadNameForOrder(r.Context(), strings.TrimSpace(body.OrderID))
	if err != nil {
		writeErr(w, h.logger, err)
		return
	}
	author := business
	if author == "" {
		author = name
	}
	project, err := h.store.SubmitFeedback(r.Context(), strings.TrimSpace(body.OrderID), strings.TrimSpace(body.Quote), author)
	if err != nil {
		if se, ok := err.(*statusError); ok {
			response.Fail(w, se.code, se.message, "FEEDBACK_FAILED")
			return
		}
		writeErr(w, h.logger, err)
		return
	}
	response.OK(w, project, "Feedback submitted")
}

func (h *Handler) adminRequests(w http.ResponseWriter, r *http.Request) {
	status := strings.TrimSpace(r.URL.Query().Get("status"))
	requests, err := h.store.ListAllRequestsAdmin(r.Context(), status)
	if err != nil {
		writeErr(w, h.logger, err)
		return
	}
	response.OK(w, requests, "Requests retrieved")
}

func (h *Handler) decideRequest(w http.ResponseWriter, r *http.Request) {
	id, ok := pathInt(w, r)
	if !ok {
		return
	}
	var body struct {
		Status           string  `json:"status"`
		AdminNote        *string `json:"adminNote"`
		DriveURL         *string `json:"driveUrl"`
		CalendlyEventURL *string `json:"calendlyEventUrl"`
	}
	if !decodeJSON(w, r, &body) {
		return
	}
	if body.Status != "APPROVED" && body.Status != "REJECTED" {
		response.ValidationError(w, "Invalid status", map[string]string{"status": "must be APPROVED or REJECTED"})
		return
	}
	updated, err := h.store.DecideRequest(r.Context(), id, body.Status, body.AdminNote, body.DriveURL, body.CalendlyEventURL)
	if err != nil {
		writeErr(w, h.logger, err)
		return
	}
	_, email, _, _ := h.store.RequestAuthor(r.Context(), id)
	if email != "" && h.notifier != nil {
		subject := "Your request was " + strings.ToLower(body.Status)
		_ = h.notifier.SendEmail(r.Context(), email, subject, subject)
	}
	response.OK(w, updated, "Request "+strings.ToLower(body.Status))
}

// Downloads stream generated PDFs after the ownership check.
func (h *Handler) downloadInvoice(w http.ResponseWriter, r *http.Request) {
	h.serveDoc(w, r, docs.KindInvoice)
}

func (h *Handler) downloadContract(w http.ResponseWriter, r *http.Request) {
	h.serveDoc(w, r, docs.KindContract)
}

func (h *Handler) downloadWelcome(w http.ResponseWriter, r *http.Request) {
	h.serveDoc(w, r, docs.KindWelcome)
}

func (h *Handler) serveDoc(w http.ResponseWriter, r *http.Request, kind docs.Kind) {
	actor, ok := h.actor(r)
	if !ok || actor.Type != "user" {
		response.Unauthorized(w, "Unauthorized")
		return
	}
	orderID := strings.TrimSpace(r.PathValue("id"))
	allowed, err := h.store.OwnsOrder(r.Context(), actor.UserID, actor.Role, orderID)
	if err != nil {
		writeErr(w, h.logger, err)
		return
	}
	if !allowed {
		response.Forbidden(w, "Forbidden")
		return
	}
	docs.Serve(w, r, h.docs, orderID, kind, h.frontendURL)
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

func pathInt(w http.ResponseWriter, r *http.Request) (int64, bool) {
	return pathInt64(w, r, "id")
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
	logger.Error("client store error", "error", err)
	response.Internal(w)
}
