package intake

import (
	"encoding/json"
	"testing"
)

func TestLeadValidation(t *testing.T) {
	ok := CreateLeadRequest{Name: "Davin", Whatsapp: "+6281234567890"}
	if fields := ok.validate(); len(fields) != 0 {
		t.Fatalf("expected valid, got %v", fields)
	}
	bad := CreateLeadRequest{Name: "A", Whatsapp: "not-a-number"}
	fields := bad.validate()
	if fields["name"] == "" || fields["whatsapp"] == "" {
		t.Fatalf("expected name+whatsapp errors, got %v", fields)
	}
}

func TestOrderValidation(t *testing.T) {
	agreed := true
	ok := CreateOrderRequest{
		PackageID: 2, Name: "Davin", Whatsapp: "+6281234567890",
		BriefData: json.RawMessage(`{"description":"new site"}`), AgreedToTerms: &agreed,
	}
	if fields := ok.validate(); len(fields) != 0 {
		t.Fatalf("expected valid, got %v", fields)
	}

	notAgreed := false
	bad := CreateOrderRequest{PackageID: 0, Name: "x", Whatsapp: "0", AgreedToTerms: &notAgreed}
	fields := bad.validate()
	for _, k := range []string{"packageId", "name", "whatsapp", "agreedToTerms"} {
		if fields[k] == "" {
			t.Fatalf("expected %s error, got %v", k, fields)
		}
	}

	var nilTerms CreateOrderRequest
	nilTerms.PackageID = 1
	nilTerms.Name = "Davin"
	nilTerms.Whatsapp = "+6281234567890"
	if fields := nilTerms.validate(); fields["agreedToTerms"] == "" {
		t.Fatalf("expected agreedToTerms error, got %v", fields)
	}
}

func TestBriefBounds(t *testing.T) {
	if err := validateBrief(json.RawMessage(`{"a":"b"}`)); err != nil {
		t.Fatalf("flat brief should pass: %v", err)
	}
	if err := validateBrief(json.RawMessage(`{"a":{"nested":1}}`)); err == nil {
		t.Fatal("nested objects must fail")
	}
	long := make([]byte, 5001)
	for i := range long {
		long[i] = 'x'
	}
	raw, _ := json.Marshal(map[string]string{"a": string(long)})
	if err := validateBrief(raw); err == nil {
		t.Fatal("oversize string must fail")
	}
	many := map[string]int{}
	for i := 0; i < 21; i++ {
		many[string(rune('a'+i))+string(rune('0'+i))] = i
	}
	raw, _ = json.Marshal(many)
	if err := validateBrief(raw); err == nil {
		t.Fatal("more than 20 keys must fail")
	}
}

func TestNormalizeWhatsapp(t *testing.T) {
	if got := normalizeWhatsapp("+62 812-3456-7890"); got != "6281234567890" {
		t.Fatalf("got %q", got)
	}
}
