package client

import (
	"encoding/json"
	"fmt"
	"strings"
	"time"

	"github.com/jackc/pgx/v5/pgtype"
)

func textPtr(t pgtype.Text) *string {
	if !t.Valid {
		return nil
	}
	v := t.String
	return &v
}

func int8Ptr(n pgtype.Int8) *int64 {
	if !n.Valid {
		return nil
	}
	v := n.Int64
	return &v
}

func timePtr(t pgtype.Timestamptz) *time.Time {
	if !t.Valid {
		return nil
	}
	v := t.Time
	return &v
}

func uuidPtr(u pgtype.UUID) *string {
	if !u.Valid {
		return nil
	}
	b := u.Bytes
	s := fmt.Sprintf("%x-%x-%x-%x-%x", b[0:4], b[4:6], b[6:8], b[8:10], b[10:16])
	return &s
}

func numericFloat(n pgtype.Numeric) float64 {
	f, err := n.Float64Value()
	if err != nil || !f.Valid {
		return 0
	}
	return f.Float64
}

func jsonRaw(b []byte) json.RawMessage {
	if len(b) == 0 {
		return json.RawMessage(`null`)
	}
	return json.RawMessage(b)
}

func itoa64(n int64) string {
	return strings.TrimSpace(fmt.Sprintf("%d", n))
}

type statusError struct {
	code    int
	message string
}

func (e *statusError) Error() string { return e.message }

func errForbidden(msg string) error { return &statusError{code: 403, message: msg} }
func errConflict(msg string) error  { return &statusError{code: 409, message: msg} }
