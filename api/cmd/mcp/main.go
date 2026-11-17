// Command mcp runs the DFD Agency MCP server over stdio.
//
// It is intended for local agent harnesses (e.g. Stark) that spawn MCP
// servers as child processes. Authentication is ambient (local process);
// the streamable HTTP variant enforces bearer API keys instead.
package main

import (
	"context"
	"fmt"
	"log/slog"
	"os"

	"github.com/dfd-agency/api/internal/config"
	"github.com/dfd-agency/api/internal/modules/agent"
	"github.com/dfd-agency/api/internal/modules/mcpserver"
	"github.com/dfd-agency/api/internal/platform/db"
	plog "github.com/dfd-agency/api/internal/platform/log"
	"github.com/dfd-agency/api/internal/platform/notify"
	"github.com/modelcontextprotocol/go-sdk/mcp"
)

func main() {
	if err := run(); err != nil {
		fmt.Fprintln(os.Stderr, "mcp:", err)
		os.Exit(1)
	}
}

func run() error {
	cfg, err := config.Load()
	if err != nil {
		return err
	}
	logger := plog.NewForEnvironment(cfg.LogLevel, cfg.Environment)

	ctx := context.Background()
	database, err := db.Connect(ctx, cfg.DatabaseURL, cfg.DatabaseMinConns, cfg.DatabaseMaxConns)
	if err != nil {
		return fmt.Errorf("database: %w", err)
	}
	defer database.Close()

	if err := db.Migrate(cfg.DatabaseURL); err != nil {
		return fmt.Errorf("migrate: %w", err)
	}

	server := mcpserver.Build(mcpserver.Deps{
		Store:    agent.NewStore(database.Pool),
		Logger:   logger,
		Notifier: notify.New(logger, cfg.AgencyWhatsapp),
	})
	logger.Info("dfd mcp server listening on stdio")
	return server.Run(ctx, &mcp.StdioTransport{})
}

var _ = slog.LevelInfo
