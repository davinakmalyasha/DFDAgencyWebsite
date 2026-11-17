// Package pdf renders order documents (invoice, contract, welcome pack) as
// PDF bytes. Documents are generated on demand and streamed; the contract
// file path is additionally cached in the database like the original.
package pdf

import (
	"bytes"
	"fmt"
	"time"

	"github.com/jung-kurt/gofpdf"
)

// DocData is everything the documents need.
type DocData struct {
	OrderID      string
	TotalAmount  float64
	Status       string
	CreatedAt    time.Time
	LeadName     string
	BusinessName string
	Whatsapp     string
	PackageName  string
	TrackURL     string
}

func newDoc() *gofpdf.Fpdf {
	pdf := gofpdf.New("P", "mm", "A4", "")
	pdf.SetMargins(20, 20, 20)
	pdf.AddPage()
	pdf.SetFont("Helvetica", "", 10)
	return pdf
}

func header(pdf *gofpdf.Fpdf, title string) {
	pdf.SetFont("Helvetica", "B", 20)
	pdf.CellFormat(0, 12, title, "", 1, "R", false, 0, "")
	pdf.SetFont("Helvetica", "", 10)
	pdf.CellFormat(0, 6, "DFD Agency — Jakarta, Indonesia", "", 1, "R", false, 0, "")
	pdf.CellFormat(0, 6, "hello@dfdagency.com", "", 1, "R", false, 0, "")
	pdf.Ln(6)
}

func money(v float64) string {
	s := fmt.Sprintf("%.0f", v)
	out := ""
	for i, c := range s {
		if i > 0 && (len(s)-i)%3 == 0 {
			out += "."
		}
		out += string(c)
	}
	return "Rp " + out
}

// Invoice renders the payment invoice.
func Invoice(d DocData) ([]byte, error) {
	pdf := newDoc()
	number := "INV-" + upper8(d.OrderID)
	header(pdf, "INVOICE")
	pdf.CellFormat(0, 6, "Date: "+d.CreatedAt.Format("02 Jan 2006"), "", 1, "R", false, 0, "")
	pdf.CellFormat(0, 6, "Invoice #: "+number, "", 1, "R", false, 0, "")
	pdf.Ln(4)

	pdf.SetFont("Helvetica", "B", 12)
	pdf.CellFormat(0, 7, "Billed To:", "", 1, "L", false, 0, "")
	pdf.SetFont("Helvetica", "", 10)
	pdf.CellFormat(0, 6, "Name: "+d.LeadName, "", 1, "L", false, 0, "")
	pdf.CellFormat(0, 6, "Business: "+orDash(d.BusinessName), "", 1, "L", false, 0, "")
	pdf.CellFormat(0, 6, "WhatsApp: "+d.Whatsapp, "", 1, "L", false, 0, "")
	pdf.Ln(4)

	pdf.SetFont("Helvetica", "B", 12)
	pdf.CellFormat(0, 7, "Order Items", "", 1, "L", false, 0, "")
	y := pdf.GetY()
	pdf.SetFont("Helvetica", "B", 10)
	pdf.Text(20, y+5, "Description")
	pdf.Text(150, y+5, "Amount")
	pdf.Line(20, y+10, 190, y+10)
	pdf.SetFont("Helvetica", "", 10)
	pdf.Text(20, y+17, "Website Package: "+d.PackageName)
	pdf.Text(150, y+17, money(d.TotalAmount))
	pdf.Line(20, y+22, 190, y+22)
	pdf.SetY(y + 30)
	pdf.SetFont("Helvetica", "B", 12)
	pdf.CellFormat(0, 7, "Total: "+money(d.TotalAmount), "", 1, "R", false, 0, "")
	pdf.Ln(6)
	pdf.SetFont("Helvetica", "", 10)
	pdf.CellFormat(0, 6, "Status: "+d.Status, "", 1, "L", false, 0, "")
	pdf.CellFormat(0, 6, "Order ID: "+d.OrderID, "", 1, "L", false, 0, "")
	pdf.Ln(10)
	pdf.CellFormat(0, 6, "Thank you for trusting DFD Agency.", "", 1, "C", false, 0, "")

	var buf bytes.Buffer
	if err := pdf.Output(&buf); err != nil {
		return nil, err
	}
	return buf.Bytes(), nil
}

// Contract renders the service agreement.
func Contract(d DocData) ([]byte, error) {
	pdf := newDoc()
	header(pdf, "SERVICE AGREEMENT")
	pdf.CellFormat(0, 6, "Contract No: CTR-"+upper8(d.OrderID), "", 1, "R", false, 0, "")
	pdf.CellFormat(0, 6, "Date: "+d.CreatedAt.Format("02 Jan 2006"), "", 1, "R", false, 0, "")
	pdf.Ln(4)

	pdf.SetFont("Helvetica", "", 10)
	paras := []string{
		"This Service Agreement (\"Agreement\") is made between DFD Agency (\"Agency\") and " + d.LeadName + " (" + orDash(d.BusinessName) + ", \"Client\").",
		"1. Scope. The Agency shall design, build, and deliver the " + d.PackageName + " package as described in order " + d.OrderID + ", including all milestones agreed through the client portal.",
		"2. Fees. The total project fee is " + money(d.TotalAmount) + ". Work begins after payment confirmation; the invoice INV-" + upper8(d.OrderID) + " forms part of this Agreement.",
		"3. Revisions. The Client may request revisions through milestones. Requests outside the agreed scope are quoted separately.",
		"4. Delivery & handover. Source access, credentials, and documentation are handed over when the order reaches COMPLETED status.",
		"5. Maintenance. Unless a maintenance plan is agreed, post-handover changes are billed separately.",
		"6. Confidentiality. Both parties keep shared credentials and business information confidential.",
	}
	for _, p := range paras {
		pdf.MultiCell(0, 6, p, "", "L", false)
		pdf.Ln(2)
	}
	pdf.Ln(6)
	pdf.CellFormat(95, 7, "For DFD Agency", "T", 0, "C", false, 0, "")
	pdf.CellFormat(95, 7, "For Client ("+d.LeadName+")", "T", 1, "C", false, 0, "")

	var buf bytes.Buffer
	if err := pdf.Output(&buf); err != nil {
		return nil, err
	}
	return buf.Bytes(), nil
}

// Welcome renders the project handoff pack.
func Welcome(d DocData) ([]byte, error) {
	pdf := newDoc()
	header(pdf, "WELCOME PACK")
	pdf.SetFont("Helvetica", "B", 12)
	pdf.CellFormat(0, 7, "Hi "+d.LeadName+", your project is underway.", "", 1, "L", false, 0, "")
	pdf.Ln(2)
	pdf.SetFont("Helvetica", "", 10)
	lines := []string{
		"Package: " + d.PackageName,
		"Order ID: " + d.OrderID,
		"Track your progress any time:",
		"  " + d.TrackURL,
		"",
		"What happens next:",
		"  1. We confirm your brief and payment.",
		"  2. Design and build milestones appear in your portal.",
		"  3. You approve (or request revisions on) each milestone.",
		"  4. On completion you receive handover access plus this pack.",
		"",
		"Questions? Reply in your portal or reach us at hello@dfdagency.com.",
	}
	for _, l := range lines {
		pdf.CellFormat(0, 6, l, "", 1, "L", false, 0, "")
	}
	var buf bytes.Buffer
	if err := pdf.Output(&buf); err != nil {
		return nil, err
	}
	return buf.Bytes(), nil
}

func upper8(id string) string {
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
	out := ""
	for _, r := range s {
		if r >= 'a' && r <= 'z' {
			r -= 32
		}
		out += string(r)
	}
	return out
}

func orDash(s string) string {
	if s == "" {
		return "N/A"
	}
	return s
}
