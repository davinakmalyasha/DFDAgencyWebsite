package pdf

import (
	"bytes"
	"testing"
	"time"
)

func sampleDoc() DocData {
	return DocData{
		OrderID:      "e5b90a7b-1b10-41fc-983e-ab6f227c9919",
		TotalAmount:  3500000,
		Status:       "PROCESSING",
		CreatedAt:    time.Date(2026, 11, 17, 0, 0, 0, 0, time.UTC),
		LeadName:     "Demo Client",
		BusinessName: "Demo Bakery",
		Whatsapp:     "6281234567890",
		PackageName:  "Business Pro",
		TrackURL:     "http://localhost:3000/track/e5b90a7b",
	}
}

func TestInvoiceRendersPDF(t *testing.T) {
	b, err := Invoice(sampleDoc())
	if err != nil {
		t.Fatalf("Invoice: %v", err)
	}
	if !bytes.HasPrefix(b, []byte("%PDF-")) {
		t.Fatal("invoice is not a PDF")
	}
	if len(b) < 1000 {
		t.Fatalf("invoice suspiciously small: %d bytes", len(b))
	}
}

func TestContractRendersPDF(t *testing.T) {
	b, err := Contract(sampleDoc())
	if err != nil {
		t.Fatalf("Contract: %v", err)
	}
	if !bytes.HasPrefix(b, []byte("%PDF-")) {
		t.Fatal("contract is not a PDF")
	}
}

func TestWelcomeRendersPDF(t *testing.T) {
	b, err := Welcome(sampleDoc())
	if err != nil {
		t.Fatalf("Welcome: %v", err)
	}
	if !bytes.HasPrefix(b, []byte("%PDF-")) {
		t.Fatal("welcome pack is not a PDF")
	}
}
