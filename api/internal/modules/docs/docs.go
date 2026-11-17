// Package docs owns order document data and streaming. Surfaces (admin,
// client portal, magic-link tracker) perform their own authorization and
// then call Serve.
package docs

import (
	"context"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/dfd-agency/api/internal/platform/http/response"
	"github.com/dfd-agency/api/internal/platform/pdf"
)

// Store fetches document data.
type Store struct {
	pool *pgxpool.Pool
}

// NewStore builds a docs Store.
func NewStore(pool *pgxpool.Pool) *Store { return &Store{pool: pool} }

// Doc fetches the data for an order's documents.
func (s *Store) Doc(ctx context.Context, orderID, trackURL string) (pdf.DocData, error) {
	var (
		d       pdf.DocData
		amount  pgtype.Numeric
		created time.Time
		biz     pgtype.Text
	)
	err := s.pool.QueryRow(ctx, `SELECT o.id, o.total_amount, o.status, o.created_at,
			l.name, l.business_name, l.whatsapp, p.name
		FROM orders o JOIN leads l ON l.id = o.lead_id JOIN packages p ON p.id = o.package_id
		WHERE o.id = $1 AND o.deleted_at IS NULL`, orderID,
	).Scan(&d.OrderID, &amount, &d.Status, &created, &d.LeadName, &biz, &d.Whatsapp, &d.PackageName)
	if err != nil {
		return pdf.DocData{}, err
	}
	if f, ferr := amount.Float64Value(); ferr == nil && f.Valid {
		d.TotalAmount = f.Float64
	}
	d.CreatedAt = created
	if biz.Valid {
		d.BusinessName = biz.String
	}
	d.TrackURL = trackURL
	return d, nil
}

// Kind identifies the document.
type Kind string

const (
	KindInvoice  Kind = "invoice"
	KindContract Kind = "contract"
	KindWelcome  Kind = "welcome"
)

// Serve renders the document and streams it as a download.
func Serve(w http.ResponseWriter, r *http.Request, store *Store, orderID string, kind Kind, trackURL string) {
	doc, err := store.Doc(r.Context(), orderID, trackURL)
	if err != nil {
		if err == pgx.ErrNoRows {
			response.NotFound(w, "Order not found")
			return
		}
		response.Internal(w)
		return
	}
	var (
		data     []byte
		filename string
	)
	switch kind {
	case KindInvoice:
		data, err = pdf.Invoice(doc)
		filename = fmt.Sprintf("INV-%s.pdf", strings.ToUpper(first8(orderID)))
	case KindContract:
		data, err = pdf.Contract(doc)
		filename = fmt.Sprintf("CTR-%s.pdf", strings.ToUpper(first8(orderID)))
	default:
		data, err = pdf.Welcome(doc)
		filename = fmt.Sprintf("WELCOME-%s.pdf", strings.ToUpper(first8(orderID)))
	}
	if err != nil {
		response.Internal(w)
		return
	}
	w.Header().Set("Content-Type", "application/pdf")
	w.Header().Set("Content-Disposition", `attachment; filename="`+filename+`"`)
	w.Header().Set("Content-Length", fmt.Sprintf("%d", len(data)))
	w.WriteHeader(http.StatusOK)
	_, _ = w.Write(data)
}

func first8(id string) string {
	s := ""
	for _, r := range id {
		if r == '-' {
			continue
		}
		s += string(r)
		if len(s) == 8 {
			break
		}
	}
	return s
}
