# Architecture

## Runtime

```
Browser / Agent
      │  cookie (humans) · bearer key (agents/MCP)
      ▼
Next.js 16 (Vercel or :3000)
  │  /api/v1/*  (rewrite → Go)
  ▼
Go API :8080 (single binary, net/http ServeMux)
  ├─ /api/v1/public…   content reads, intake, magic-link tracking
  ├─ /api/v1/auth…     cookie sessions (JWT, tokenVersion revocation)
  ├─ /api/v1/admin…    SUPERADMIN cookie CRUD, dashboard, audit, webhooks
  ├─ /api/v1/client…   CLIENT/ADMIN/EDITOR portal
  ├─ /api/v1/agent… + /api/agent…  bearer-key machine API (Stark parity)
  ├─ /mcp               MCP over streamable HTTP (bearer key)
  └─ /healthz /readyz
      │  pgx pool
      ▼
PostgreSQL (Supabase or local) — 25 tables, embedded migrations
```

`cmd/mcp` runs the same MCP server over stdio for local harnesses.
A background worker (same process) runs cron parity jobs + outbox dispatch.

## Backend layout (`api/`)

```
cmd/api      REST entrypoint (migrate → serve → worker)
cmd/mcp      MCP stdio entrypoint
cmd/seed     idempotent seed
cmd/apikey   scoped key minting
db/migrations embedded SQL (golang-migrate)
internal/config        env parse + fail-fast validation
internal/platform/
  http/        router glue, middleware (request-id, recover, logger,
               CSRF, CORS, security headers, rate limit), envelope
  db/          pgx pool + migrate
  auth/        bcrypt, JWT, API keys, cookie/bearer guards, RBAC
  log/         slog
  notify/      WhatsApp/Telegram/email transports (env-gated, log fallback)
  storage/     (reserved: Supabase client)
  pdf/         invoice / contract / welcome-pack generators (gofpdf)
  outbox→worker worker/ cron parity + webhook dispatch (HMAC, retries)
  httpserver/  route table
internal/modules/
  auth/      login/logout/me/change-password/invite
  content/   public catalog (packages, projects, articles, promos, settings)
  intake/    leads, orders (+idempotency), magic-link tracking + downloads
  client/    client portal + request triage
  admin/     back-office CRUD, dashboard, audit, webhooks, hosting
  agent/     machine API (22 Stark actions + whatsapp)
  mcpserver/ MCP tools (mirror of agent actions + email)
  docs/      order document data + streaming
  misc/      upload (Supabase, env-gated), WhatsApp stubs, AI 503 stub
```

## Key decisions

- **Single Go binary**, stdlib router — no framework lock-in, tiny image.
- **Stark contract first**: the agent API mirrors `dfd_bridge` exactly, so
  existing agents connect with zero changes; MCP reuses the same store.
- **Push over poll**: mutations emit `agent_events`; the worker delivers to
  HMAC-signed webhook subscriptions with retries.
- **Idempotency**: `X-Idempotency-Key` on order creation.
- **Auth**: HttpOnly cookies (`token`, Sliding 30d, 7-day refresh) for
  humans; SHA-256 bearer keys with scopes for machines.
- **No LLM keys in the API**: chatbots and copy run outside; the API only
  defines their contract (`client/src/lib/chat.contract.ts`).
