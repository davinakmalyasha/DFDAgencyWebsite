package intake

import (
	"encoding/json"
	"fmt"
	"regexp"
	"strings"
)

// whatsappRe mirrors the shared Zod rule: E.164 without spaces.
var whatsappRe = regexp.MustCompile(`^\+?[1-9]\d{1,14}$`)

// CreateLeadRequest is a public inquiry.
type CreateLeadRequest struct {
	Name         string  `json:"name"`
	Whatsapp     string  `json:"whatsapp"`
	BusinessName *string `json:"businessName"`
	Message      *string `json:"message"`
}

func (r CreateLeadRequest) validate() map[string]string {
	fields := map[string]string{}
	if len(strings.TrimSpace(r.Name)) < 2 {
		fields["name"] = "Name is required"
	}
	if !whatsappRe.MatchString(strings.TrimSpace(r.Whatsapp)) {
		fields["whatsapp"] = "Invalid WhatsApp number format (e.g., +628...)"
	}
	return fields
}

// CreateOrderRequest is a public order. agreedToTerms must be literally true.
type CreateOrderRequest struct {
	PackageID     int64           `json:"packageId"`
	Name          string          `json:"name"`
	Whatsapp      string          `json:"whatsapp"`
	BusinessName  *string         `json:"businessName"`
	BriefData     json.RawMessage `json:"briefData"`
	AgreedToTerms *bool           `json:"agreedToTerms"`
}

func (r CreateOrderRequest) validate() map[string]string {
	fields := map[string]string{}
	if r.PackageID <= 0 {
		fields["packageId"] = "Package ID must be valid"
	}
	if name := strings.TrimSpace(r.Name); len(name) < 2 || len(name) > 120 {
		fields["name"] = "Name is required"
	}
	if !whatsappRe.MatchString(strings.TrimSpace(r.Whatsapp)) {
		fields["whatsapp"] = "Invalid WhatsApp number"
	}
	if r.BusinessName != nil && len(*r.BusinessName) > 120 {
		fields["businessName"] = "Business name too long"
	}
	if r.AgreedToTerms == nil || !*r.AgreedToTerms {
		fields["agreedToTerms"] = "You must agree to the terms and conditions"
	}
	if len(r.BriefData) > 0 {
		if err := validateBrief(r.BriefData); err != nil {
			fields["briefData"] = err.Error()
		}
	}
	return fields
}

// validateBrief ports the shared Zod brief bounds: flat values only, strings
// capped at 5000 chars, arrays capped at 50 items, at most 20 keys.
func validateBrief(raw json.RawMessage) error {
	var obj map[string]json.RawMessage
	if err := json.Unmarshal(raw, &obj); err != nil {
		return fmt.Errorf("brief must be a JSON object")
	}
	if len(obj) > 20 {
		return fmt.Errorf("brief must have at most 20 fields")
	}
	for key, val := range obj {
		if len(key) > 64 {
			return fmt.Errorf("brief key too long: %q", key)
		}
		var scalar any
		if err := json.Unmarshal(val, &scalar); err != nil {
			return fmt.Errorf("brief field %q is not valid JSON", key)
		}
		switch v := scalar.(type) {
		case string:
			if len(v) > 5000 {
				return fmt.Errorf("brief fields must be under 5000 characters")
			}
		case float64:
			if v > 1e12 {
				return fmt.Errorf("brief number too large")
			}
		case bool, nil:
		case []any:
			if len(v) > 50 {
				return fmt.Errorf("brief arrays must be under 50 items")
			}
			for _, item := range v {
				switch iv := item.(type) {
				case string:
					if len(iv) > 5000 {
						return fmt.Errorf("brief fields must be under 5000 characters")
					}
				case float64:
					if iv > 1e12 {
						return fmt.Errorf("brief number too large")
					}
				case bool, nil:
				default:
					return fmt.Errorf("brief arrays must hold flat values only")
				}
			}
		default:
			return fmt.Errorf("brief field %q must be a flat value", key)
		}
	}
	return nil
}

// normalizeWhatsapp strips non-digits for identity comparison.
func normalizeWhatsapp(raw string) string {
	var b strings.Builder
	for _, r := range raw {
		if r >= '0' && r <= '9' {
			b.WriteRune(r)
		}
	}
	return b.String()
}
