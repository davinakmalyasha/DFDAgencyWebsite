// Package auth implements human authentication: cookie login/logout/me,
// password change, and single-use invite verification.
package auth

import (
	"strings"

	"golang.org/x/crypto/bcrypt"
)

// NormalizeEmail lowercases and trims for case-insensitive uniqueness.
func NormalizeEmail(email string) string {
	return strings.ToLower(strings.TrimSpace(email))
}

// dummyHash burns comparable time when the user does not exist, preventing
// user-enumeration via timing.
const dummyHash = "$2a$12$C6UzMDM.H6dfI/f/IKcEeO7lT2h3qTZ0h6BQ2X9QrHtVJ2l8r0v0u"

// SecureCompare checks the password, or burns time and fails when hash is "".
func SecureCompare(password, hash string) bool {
	target := hash
	if target == "" {
		target = dummyHash
	}
	ok := bcrypt.CompareHashAndPassword([]byte(target), []byte(password)) == nil
	return ok && hash != ""
}

// ValidPassword reports whether the new password meets the policy: min 8
// chars with at least one letter and one digit.
func ValidPassword(password string) bool {
	if len(password) < 8 {
		return false
	}
	var hasLetter, hasDigit bool
	for _, r := range password {
		switch {
		case r >= 'a' && r <= 'z', r >= 'A' && r <= 'Z':
			hasLetter = true
		case r >= '0' && r <= '9':
			hasDigit = true
		}
	}
	return hasLetter && hasDigit
}
