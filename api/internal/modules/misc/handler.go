// Package misc covers the auxiliary back-office endpoints: media upload,
// WhatsApp session management, and the AI copywriter stub.
package misc

import (
	"bytes"
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"path/filepath"
	"strings"
	"time"

	"github.com/dfd-agency/api/internal/platform/http/response"
)

// Config carries the optional external integrations.
type Config struct {
	SupabaseURL        string
	SupabaseServiceKey string
	SupabaseBucket     string
}

// Handler serves misc routes.
type Handler struct {
	logger *slog.Logger
	cfg    Config
	client *http.Client
}

// NewHandler builds a misc handler.
func NewHandler(logger *slog.Logger, cfg Config) *Handler {
	return &Handler{
		logger: logger,
		cfg:    cfg,
		client: &http.Client{Timeout: 30 * time.Second},
	}
}

// Register mounts misc routes. All are SUPERADMIN-guarded by the caller.
func (h *Handler) Register(mux *http.ServeMux, guard func(http.Handler) http.Handler) {
	mux.Handle("POST /api/v1/upload", guard(http.HandlerFunc(h.upload)))
	mux.Handle("GET /api/v1/whatsapp/status", guard(http.HandlerFunc(h.waStatus)))
	mux.Handle("GET /api/v1/whatsapp/qr", guard(http.HandlerFunc(h.waQR)))
	mux.Handle("POST /api/v1/whatsapp/start", guard(http.HandlerFunc(h.waStart)))
	mux.Handle("POST /api/v1/whatsapp/logout", guard(http.HandlerFunc(h.waLogout)))
	mux.Handle("POST /api/v1/ai/generate-copy", guard(http.HandlerFunc(h.aiCopy)))
}

// ---------------------------------------------------------------------------
// Upload (Supabase Storage, env-gated)
// ---------------------------------------------------------------------------

var allowedExt = map[string]bool{
	".jpg": true, ".jpeg": true, ".png": true, ".webp": true, ".gif": true,
}

func (h *Handler) upload(w http.ResponseWriter, r *http.Request) {
	if h.cfg.SupabaseURL == "" || h.cfg.SupabaseServiceKey == "" {
		response.Fail(w, http.StatusNotImplemented,
			"Media storage is not configured — set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY",
			"NOT_CONFIGURED")
		return
	}
	if err := r.ParseMultipartForm(5 << 20); err != nil {
		response.BadRequest(w, "File too large (max 5MB) or invalid form")
		return
	}
	file, header, err := r.FormFile("file")
	if err != nil {
		response.BadRequest(w, "Field 'file' is required")
		return
	}
	defer file.Close()

	ext := strings.ToLower(filepath.Ext(header.Filename))
	if !allowedExt[ext] {
		response.ValidationError(w, "Only image files (jpg, jpeg, png, webp, gif) are allowed",
			map[string]string{"file": "invalid type"})
		return
	}
	data, err := io.ReadAll(io.LimitReader(file, 5<<20+1))
	if err != nil || len(data) == 0 || len(data) > 5<<20 {
		response.BadRequest(w, "File too large (max 5MB) or empty")
		return
	}
	if ct := http.DetectContentType(data); !strings.HasPrefix(ct, "image/") {
		response.ValidationError(w, "File content is not an image", map[string]string{"file": "invalid content"})
		return
	}

	var key [8]byte
	if _, err := rand.Read(key[:]); err != nil {
		h.logger.ErrorContext(r.Context(), "rand failed", "error", err)
		response.Internal(w)
		return
	}
	objectKey := fmt.Sprintf("uploads/%d-%s%s", time.Now().Unix(), hex.EncodeToString(key[:]), ext)
	bucket := h.cfg.SupabaseBucket
	if bucket == "" {
		bucket = "dfd-media"
	}
	putURL := strings.TrimSuffix(h.cfg.SupabaseURL, "/") + "/storage/v1/object/" + bucket + "/" + objectKey
	req, err := http.NewRequestWithContext(r.Context(), http.MethodPut, putURL, bytes.NewReader(data))
	if err != nil {
		response.Internal(w)
		return
	}
	req.Header.Set("Authorization", "Bearer "+h.cfg.SupabaseServiceKey)
	req.Header.Set("apikey", h.cfg.SupabaseServiceKey)
	req.Header.Set("Content-Type", http.DetectContentType(data))
	resp, err := h.client.Do(req)
	if err != nil {
		h.logger.ErrorContext(r.Context(), "supabase upload failed", "error", err)
		response.Fail(w, http.StatusBadGateway, "Storage upload failed", "UPLOAD_FAILED")
		return
	}
	defer resp.Body.Close()
	if resp.StatusCode >= 300 {
		body, _ := io.ReadAll(io.LimitReader(resp.Body, 4096))
		h.logger.ErrorContext(r.Context(), "supabase upload rejected",
			"status", resp.StatusCode, "body", string(body))
		response.Fail(w, http.StatusBadGateway, "Storage upload failed", "UPLOAD_FAILED")
		return
	}
	publicURL := strings.TrimSuffix(h.cfg.SupabaseURL, "/") + "/storage/v1/object/public/" + bucket + "/" + objectKey
	response.Created(w, map[string]any{"url": publicURL}, "Upload successful")
}

// ---------------------------------------------------------------------------
// WhatsApp (provider-gated stubs)
// ---------------------------------------------------------------------------

func (h *Handler) waStatus(w http.ResponseWriter, r *http.Request) {
	response.OK(w, map[string]any{
		"status":    "not_configured",
		"connected": false,
		"detail":    "WhatsApp delivery moves to the Meta Cloud API next; the legacy QR session is retired",
	}, "WhatsApp status retrieved")
}

func (h *Handler) waQR(w http.ResponseWriter, r *http.Request) {
	response.OK(w, map[string]any{"qr": nil}, "No QR session available")
}

func (h *Handler) waStart(w http.ResponseWriter, r *http.Request) {
	response.Fail(w, http.StatusNotImplemented,
		"WhatsApp sessions are disabled pending the Cloud API migration", "NOT_CONFIGURED")
}

func (h *Handler) waLogout(w http.ResponseWriter, r *http.Request) {
	response.OK(w, nil, "Logged out")
}

// ---------------------------------------------------------------------------
// AI copywriter stub
// ---------------------------------------------------------------------------

func (h *Handler) aiCopy(w http.ResponseWriter, r *http.Request) {
	raw, err := io.ReadAll(io.LimitReader(r.Body, 1<<20))
	if err != nil || len(raw) == 0 {
		response.BadRequest(w, "Request body is required")
		return
	}
	// The copywriter is external now (chatbot backend / agent layer). The API
	// intentionally holds no LLM keys.
	response.Fail(w, http.StatusServiceUnavailable,
		"AI Service currently unavailable (Missing API Key)", "NO_API_KEY")
}
