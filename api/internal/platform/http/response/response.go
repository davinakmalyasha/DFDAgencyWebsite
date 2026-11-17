// Package response writes the canonical DFD API envelope.
//
// Every endpoint returns the same shape so clients (browser, MCP, agents) can
// decode responses uniformly:
//
//	{"success":true,"message":"...","data":...,"error":null}
package response

import (
	"encoding/json"
	"net/http"
)

// Envelope is the canonical API response body.
type Envelope struct {
	Success bool   `json:"success"`
	Message string `json:"message"`
	Data    any    `json:"data"`
	Error   any    `json:"error"`
}

// JSON writes an envelope with an explicit status code.
func JSON(w http.ResponseWriter, status int, payload Envelope) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.Header().Set("X-Content-Type-Options", "nosniff")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(payload)
}

// OK writes a 200 success envelope.
func OK(w http.ResponseWriter, data any, message string) {
	if message == "" {
		message = "OK"
	}
	JSON(w, http.StatusOK, Envelope{Success: true, Message: message, Data: data, Error: nil})
}

// Created writes a 201 success envelope.
func Created(w http.ResponseWriter, data any, message string) {
	if message == "" {
		message = "Created"
	}
	JSON(w, http.StatusCreated, Envelope{Success: true, Message: message, Data: data, Error: nil})
}

// NoContent writes a 204 with no body.
func NoContent(w http.ResponseWriter) {
	w.WriteHeader(http.StatusNoContent)
}

// Fail writes an error envelope. The exposed error is intentionally generic in
// production; internal details stay in the server logs.
func Fail(w http.ResponseWriter, status int, message string, exposed any) {
	JSON(w, status, Envelope{Success: false, Message: message, Data: nil, Error: exposed})
}

// BadRequest writes a 400 envelope.
func BadRequest(w http.ResponseWriter, message string) {
	Fail(w, http.StatusBadRequest, message, "BAD_REQUEST")
}

// Unauthorized writes a 401 envelope.
func Unauthorized(w http.ResponseWriter, message string) {
	Fail(w, http.StatusUnauthorized, message, "UNAUTHORIZED")
}

// Forbidden writes a 403 envelope.
func Forbidden(w http.ResponseWriter, message string) {
	Fail(w, http.StatusForbidden, message, "FORBIDDEN")
}

// NotFound writes a 404 envelope.
func NotFound(w http.ResponseWriter, message string) {
	Fail(w, http.StatusNotFound, message, "NOT_FOUND")
}

// Conflict writes a 409 envelope.
func Conflict(w http.ResponseWriter, message string) {
	Fail(w, http.StatusConflict, message, "CONFLICT")
}

// TooManyRequests writes a 429 envelope.
func TooManyRequests(w http.ResponseWriter, message string) {
	Fail(w, http.StatusTooManyRequests, message, "RATE_LIMITED")
}

// Internal writes a 500 envelope without leaking internals.
func Internal(w http.ResponseWriter) {
	Fail(w, http.StatusInternalServerError, "Internal Server Error", "INTERNAL")
}

// ValidationError writes a 422 envelope carrying field errors.
func ValidationError(w http.ResponseWriter, message string, fields map[string]string) {
	Fail(w, http.StatusUnprocessableEntity, message, map[string]any{"fields": fields})
}
