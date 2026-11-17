package intake

import (
	"context"
	"encoding/json"
	"errors"
	"io"
	"log/slog"
	"net/http"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/dfd-agency/api/internal/modules/docs"
	"github.com/dfd-agency/api/internal/platform/auth"
	"github.com/dfd-agency/api/internal/platform/http/response"
	"github.com/dfd-agency/api/internal/platform/worker"
)

// Notifier receives intake events (lead created, order created, client note).
type Notifier interface {
	SendWhatsApp(ctx context.Context, to, message string) error
	SendEmail(ctx context.Context, to, subject, html string) error
}

// Handler serves public intake routes.
type Handler struct {
	store       *Store
	docs        *docs.Store
	pool        *pgxpool.Pool
	logger      *slog.Logger
	notifier    Notifier
	jwtSecret   string
	frontendURL string
}

// NewHandler builds an intake handler.
func NewHandler(store *Store, docStore *docs.Store, pool *pgxpool.Pool, logger *slog.Logger, notifier Notifier, jwtSecret, frontendURL string) *Handler {
	return &Handler{store: store, docs: docStore, pool: pool, logger: logger, notifier: notifier, jwtSecret: jwtSecret, frontendURL: frontendURL}
}

// Register mounts public intake routes on the root mux.
func (h *Handler) Register(mux *http.ServeMux) {
	mux.HandleFunc("POST /api/v1/leads", h.createLead)
	mux.HandleFunc("POST /api/v1/orders", h.createOrder)
	mux.HandleFunc("GET /api/v1/orders/track/{orderId}", h.track)
	mux.HandleFunc("POST /api/v1/orders/track/{orderId}/verify", h.verify)
	mux.HandleFunc("POST /api/v1/orders/track/{orderId}/notes", h.createClientNote)
	mux.HandleFunc("GET /api/v1/orders/track/{orderId}/invoice", h.trackDoc(docs.KindInvoice))
	mux.HandleFunc("GET /api/v1/orders/track/{orderId}/contract", h.trackDoc(docs.KindContract))
	mux.HandleFunc("GET /api/v1/orders/track/{orderId}/welcome", h.trackDoc(docs.KindWelcome))
}

// ---------------------------------------------------------------------------
// Leads & orders
// ---------------------------------------------------------------------------

func (h *Handler) createLead(w http.ResponseWriter, r *http.Request) {
	var req CreateLeadRequest
	if !decodeJSON(w, r, &req) {
		return
	}
	if fields := req.validate(); len(fields) > 0 {
		response.ValidationError(w, "Invalid lead", fields)
		return
	}
	lead, err := h.store.CreateLead(r.Context(), req)
	if err != nil {
		h.logger.ErrorContext(r.Context(), "create lead failed", "error", err)
		response.Internal(w)
		return
	}
	h.logger.InfoContext(r.Context(), "new lead", "id", lead.ID, "name", lead.Name)
	worker.Emit(r.Context(), h.pool, "lead.created", "lead", itoa64(lead.ID), lead)
	response.Created(w, lead, "Lead received")
}

func (h *Handler) createOrder(w http.ResponseWriter, r *http.Request) {
	var req CreateOrderRequest
	if !decodeJSON(w, r, &req) {
		return
	}
	if fields := req.validate(); len(fields) > 0 {
		response.ValidationError(w, "Invalid order", fields)
		return
	}
	order, err := h.store.CreateOrder(r.Context(), req, strings.TrimSpace(r.Header.Get("X-Idempotency-Key")))
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			response.ValidationError(w, "Package not found", map[string]string{"packageId": "unknown package"})
			return
		}
		h.logger.ErrorContext(r.Context(), "create order failed", "error", err)
		response.Internal(w)
		return
	}
	if order.IsDuplicate {
		response.OK(w, order, "Order already received")
		return
	}
	h.logger.InfoContext(r.Context(), "new order", "id", order.ID, "amount", order.TotalAmount)
	worker.Emit(r.Context(), h.pool, "order.created", "order", order.ID, order)
	response.Created(w, order, "Order created")
}

// ---------------------------------------------------------------------------
// Magic-link tracking
// ---------------------------------------------------------------------------

// magicCookieName returns the per-order session cookie.
func magicCookieName(orderID string) string { return "magic_session_" + orderID }

// magicAuthenticated verifies the JWT in the per-order cookie.
func (h *Handler) magicAuthenticated(r *http.Request, orderID string) bool {
	cookie, err := r.Cookie(magicCookieName(orderID))
	if err != nil || cookie.Value == "" {
		return false
	}
	claims, err := auth.ParseJWT(h.jwtSecret, cookie.Value)
	if err != nil {
		return false
	}
	return claims.Subject == orderID
}

func (h *Handler) track(w http.ResponseWriter, r *http.Request) {
	orderID := strings.TrimSpace(r.PathValue("orderId"))
	if !h.magicAuthenticated(r, orderID) {
		locked, err := h.store.TrackLocked(r.Context(), orderID)
		if err != nil {
			writeStoreErr(w, h.logger, err)
			return
		}
		response.OK(w, locked, "Order track retrieved (Verification required for details).")
		return
	}
	full, err := h.store.TrackUnlocked(r.Context(), orderID)
	if err != nil {
		writeStoreErr(w, h.logger, err)
		return
	}
	response.OK(w, full, "Order track retrieved.")
}

func (h *Handler) verify(w http.ResponseWriter, r *http.Request) {
	orderID := strings.TrimSpace(r.PathValue("orderId"))
	var body struct {
		Whatsapp string `json:"whatsapp"`
	}
	if !decodeJSON(w, r, &body) {
		return
	}
	if strings.TrimSpace(body.Whatsapp) == "" {
		response.BadRequest(w, "WhatsApp number is required.")
		return
	}

	stored, err := h.store.LeadWhatsappForOrder(r.Context(), orderID)
	if err != nil {
		writeStoreErr(w, h.logger, err)
		return
	}
	if normalizeWhatsapp(body.Whatsapp) != normalizeWhatsapp(stored) {
		response.Fail(w, http.StatusUnauthorized, "Verification failed. Incorrect WhatsApp number.", "INVALID_WHATSAPP")
		return
	}

	token, err := auth.SignJWTWithSubject(h.jwtSecret, 24*time.Hour, orderID)
	if err != nil {
		h.logger.ErrorContext(r.Context(), "magic sign failed", "error", err)
		response.Internal(w)
		return
	}
	http.SetCookie(w, &http.Cookie{
		Name:     magicCookieName(orderID),
		Value:    token,
		Path:     "/",
		HttpOnly: true,
		Secure:   r.TLS != nil,
		SameSite: http.SameSiteStrictMode,
		MaxAge:   24 * 60 * 60,
	})
	response.OK(w, nil, "Identity verified. Project details unlocked.")
}

func (h *Handler) createClientNote(w http.ResponseWriter, r *http.Request) {
	orderID := strings.TrimSpace(r.PathValue("orderId"))
	if !h.magicAuthenticated(r, orderID) {
		response.Fail(w, http.StatusForbidden, "Verification required to perform this action.", "LOCKED")
		return
	}
	var body struct {
		Content  string `json:"content"`
		ParentID *int64 `json:"parentId"`
	}
	if !decodeJSON(w, r, &body) {
		return
	}
	if strings.TrimSpace(body.Content) == "" {
		response.BadRequest(w, "Note content cannot be empty.")
		return
	}
	note, err := h.store.CreateClientNote(r.Context(), orderID, strings.TrimSpace(body.Content), body.ParentID)
	if err != nil {
		writeStoreErr(w, h.logger, err)
		return
	}
	response.Created(w, note, "Note submitted")
}

// trackDoc streams a document after magic-link verification.
func (h *Handler) trackDoc(kind docs.Kind) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		orderID := strings.TrimSpace(r.PathValue("orderId"))
		if !h.magicAuthenticated(r, orderID) {
			response.Fail(w, http.StatusForbidden, "Verification required to perform this action.", "LOCKED")
			return
		}
		docs.Serve(w, r, h.docs, orderID, kind, h.frontendURL)
	}
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

func decodeJSON(w http.ResponseWriter, r *http.Request, dst any) bool {
	body, err := io.ReadAll(io.LimitReader(r.Body, 1<<20))
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

func writeStoreErr(w http.ResponseWriter, logger *slog.Logger, err error) {
	if errors.Is(err, pgx.ErrNoRows) {
		response.NotFound(w, "Order track not found")
		return
	}
	logger.Error("intake store error", "error", err)
	response.Internal(w)
}
