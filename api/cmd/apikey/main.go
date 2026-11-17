// Command apikey generates and stores an agent API key.
//
//	go run ./cmd/apikey -name "stark-dfd" -scopes agent,read,write
//
// The plaintext key is printed once and cannot be retrieved again; only its
// SHA-256 hash is stored.
package main

import (
	"context"
	"flag"
	"fmt"
	"os"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"

	"github.com/dfd-agency/api/internal/config"
	"github.com/dfd-agency/api/internal/platform/auth"
)

func main() {
	name := flag.String("name", "dfd-agent", "human-readable key name")
	scopes := flag.String("scopes", "agent,read,write", "comma-separated scopes")
	createdBy := flag.Int64("created-by", 0, "issuing user id (optional)")
	flag.Parse()

	cfg, err := config.Load()
	if err != nil {
		fatal(err)
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	conn, err := pgx.Connect(ctx, cfg.DatabaseURL)
	if err != nil {
		fatal(err)
	}
	defer conn.Close(ctx)

	key, err := auth.GenerateAPIKey()
	if err != nil {
		fatal(err)
	}

	scopeList := splitScopes(*scopes)
	var createdByPtr *int64
	if *createdBy > 0 {
		createdByPtr = createdBy
	}

	_, err = conn.Exec(ctx,
		`INSERT INTO api_keys (name, key_hash, key_prefix, scopes, created_by)
		 VALUES ($1, $2, $3, $4, $5)`,
		*name, key.Hash, key.Prefix, scopeList, createdByPtr,
	)
	if err != nil {
		fatal(err)
	}

	fmt.Println("API key created. Store it now — it is shown only once.")
	fmt.Printf("name:   %s\n", *name)
	fmt.Printf("prefix: %s\n", key.Prefix)
	fmt.Printf("scopes: %s\n", strings.Join(scopeList, ","))
	fmt.Printf("key:    %s\n", key.Plaintext)
}

func splitScopes(raw string) []string {
	parts := strings.Split(raw, ",")
	out := make([]string, 0, len(parts))
	for _, p := range parts {
		p = strings.TrimSpace(p)
		if p != "" {
			out = append(out, p)
		}
	}
	return out
}

func fatal(err error) {
	fmt.Fprintln(os.Stderr, "apikey:", err)
	os.Exit(1)
}
