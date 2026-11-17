package worker

import (
	"bytes"
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"io"
	"net/http"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

// dispatchOutbox delivers pending agent_events to active webhook subscriptions.
func (w *Worker) dispatchOutbox(ctx context.Context) {
	rows, err := w.pool.Query(ctx, `SELECT id, event_type, aggregate_type, aggregate_id, payload
		FROM agent_events WHERE processed_at IS NULL ORDER BY id ASC LIMIT 50`)
	if err != nil {
		w.logger.ErrorContext(ctx, "outbox query failed", "error", err)
		return
	}
	type event struct {
		id    int64
		etype string
		agg   string
		aggID string
		body  []byte
	}
	var events []event
	for rows.Next() {
		var e event
		if err := rows.Scan(&e.id, &e.etype, &e.agg, &e.aggID, &e.body); err != nil {
			rows.Close()
			return
		}
		events = append(events, e)
	}
	rows.Close()
	if err := rows.Err(); err != nil {
		return
	}
	if len(events) == 0 {
		return
	}

	subs, err := w.pool.Query(ctx, `SELECT id, url, secret, event_types FROM webhook_subscriptions
		WHERE is_active = TRUE`)
	if err != nil {
		w.logger.ErrorContext(ctx, "webhook subs query failed", "error", err)
		return
	}
	type sub struct {
		id     string
		url    string
		secret string
		types  []string
	}
	var subsList []sub
	for subs.Next() {
		var s sub
		if err := subs.Scan(&s.id, &s.url, &s.secret, &s.types); err != nil {
			subs.Close()
			return
		}
		subsList = append(subsList, s)
	}
	subs.Close()

	client := &http.Client{Timeout: 15 * time.Second}
	for _, e := range events {
		delivered := false
		payload, _ := json.Marshal(map[string]any{
			"id": e.id, "type": e.etype, "aggregate": e.agg, "aggregateId": e.aggID,
			"payload": json.RawMessage(e.body), "at": time.Now().UTC(),
		})
		for _, s := range subsList {
			if len(s.types) > 0 && !contains(s.types, e.etype) && !contains(s.types, "*") {
				continue
			}
			mac := hmac.New(sha256.New, []byte(s.secret))
			mac.Write(payload)
			sig := hex.EncodeToString(mac.Sum(nil))
			req, err := http.NewRequestWithContext(ctx, http.MethodPost, s.url, bytes.NewReader(payload))
			if err != nil {
				continue
			}
			req.Header.Set("Content-Type", "application/json")
			req.Header.Set("X-DFD-Event", e.etype)
			req.Header.Set("X-DFD-Signature", "sha256="+sig)
			resp, err := client.Do(req)
			code := 0
			body := ""
			if err == nil {
				code = resp.StatusCode
				b, _ := io.ReadAll(io.LimitReader(resp.Body, 4096))
				body = string(b)
				resp.Body.Close()
			}
			_, _ = w.pool.Exec(ctx, `INSERT INTO webhook_deliveries
				(subscription_id, event_id, url, status_code, response_body, attempts, delivered_at)
				VALUES ($1,$2,$3,$4,$5,1,CASE WHEN $4 BETWEEN 200 AND 299 THEN now() END)`,
				s.id, e.id, s.url, code, body)
			if code >= 200 && code < 300 {
				delivered = true
			}
		}
		if delivered || len(subsList) == 0 {
			_, _ = w.pool.Exec(ctx, `UPDATE agent_events SET processed_at = now(), attempts = attempts + 1 WHERE id = $1`, e.id)
		} else {
			_, _ = w.pool.Exec(ctx, `UPDATE agent_events SET attempts = attempts + 1, last_error = 'delivery failed' WHERE id = $1`, e.id)
		}
	}
}

func contains(list []string, v string) bool {
	for _, s := range list {
		if s == v {
			return true
		}
	}
	return false
}

// Emit records an agent event. Callers never fail the request on emit errors.
func Emit(ctx context.Context, pool *pgxpool.Pool, eventType, aggregateType, aggregateID string, payload any) {
	var raw []byte
	if payload != nil {
		var err error
		raw, err = json.Marshal(payload)
		if err != nil {
			return
		}
	} else {
		raw = []byte(`{}`)
	}
	_, _ = pool.Exec(ctx, `INSERT INTO agent_events (event_type, aggregate_type, aggregate_id, payload)
		VALUES ($1,$2,$3,$4)`, eventType, aggregateType, aggregateID, raw)
}
