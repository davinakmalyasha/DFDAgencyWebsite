package auth

import (
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"strings"
)

// APIKeyPrefix is the human-readable prefix on every generated agent key.
const APIKeyPrefix = "dfd_agent_"

// APIKey is a newly generated key: the plaintext is shown once, the hash is
// what gets stored.
type APIKey struct {
	Plaintext string
	Prefix    string
	Hash      string
}

// GenerateAPIKey creates a cryptographically random agent API key.
func GenerateAPIKey() (APIKey, error) {
	var raw [32]byte
	if _, err := rand.Read(raw[:]); err != nil {
		return APIKey{}, fmt.Errorf("auth: generate api key: %w", err)
	}
	plain := APIKeyPrefix + hex.EncodeToString(raw[:])
	return APIKey{
		Plaintext: plain,
		Prefix:    plain[:len(APIKeyPrefix)+8],
		Hash:      HashAPIKey(plain),
	}, nil
}

// HashAPIKey returns the hex SHA-256 digest stored in the database.
func HashAPIKey(plaintext string) string {
	sum := sha256.Sum256([]byte(plaintext))
	return hex.EncodeToString(sum[:])
}

// NormalizeAPIKey trims whitespace and rejects keys without the DFD prefix.
func NormalizeAPIKey(raw string) (string, error) {
	plain := strings.TrimSpace(raw)
	if plain == "" {
		return "", fmt.Errorf("auth: empty api key")
	}
	if !strings.HasPrefix(plain, APIKeyPrefix) {
		return "", fmt.Errorf("auth: api key has invalid prefix")
	}
	return plain, nil
}

// HasScope reports whether the scope set contains the required scope. The
// wildcard "*" grants everything.
func HasScope(scopes []string, required string) bool {
	for _, s := range scopes {
		if s == "*" || s == required {
			return true
		}
	}
	return false
}
