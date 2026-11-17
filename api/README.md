# DFD Agency API (Go)

The backend for the DFD Agency platform. Go 1.27+, PostgreSQL (Supabase), MCP
and REST for the public site, admin dashboard, client portal, and external
agents.

## Layout

```
api/
├── cmd/api/                 # REST API entrypoint
├── cmd/mcp/                 # MCP server entrypoint (planned)
├── db/migrations/           # Embedded SQL migrations
├── internal/config/         # Env loading + validation
├── internal/platform/       # http, db, log, auth, notify, storage, outbox, worker
│   ├── http/                # router, middleware, response envelope
│   └── ...
└── internal/modules/        # domain packages (leads, orders, projects, agent, ...)
```

## Requirements

- Go 1.27.4 (`GOTOOLCHAIN=go1.27.4`)
- PostgreSQL 16+ (Supabase or local)
- `golang-migrate` is embedded; migrations run at boot

## Quick start

```bash
cp .env.example .env
# edit DATABASE_URL and JWT_SECRET
go mod tidy
go run ./cmd/api
```

The server applies migrations on boot, then serves:

- `GET /healthz` — liveness
- `GET /readyz` — database readiness
- `GET /api/v1` — API root
- `GET /api/v1/agent/*` — machine-facing agent API (bearer API key)
- `POST /mcp` — MCP streamable HTTP (planned)

## Response envelope

Every response uses the canonical envelope:

```json
{"success": true, "message": "OK", "data": null, "error": null}
```
