# 🌐 DFD Agency

<div align="center">
  <h3>Engineered for Speed. Built for Excellence.</h3>
  <p>An elite, decoupled full-stack application powering the DFD Digital Agency.</p>

  ![Next JS](https://img.shields.io/badge/Next-16-black?logo=next.js&logoColor=white&style=for-the-badge)
  ![React](https://img.shields.io/badge/React-19-20232A?logo=react&logoColor=61DAFB&style=for-the-badge)
  ![TypeScript](https://img.shields.io/badge/TypeScript-7.0-007ACC?logo=typescript&logoColor=white&style=for-the-badge)
  ![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.3-38B2AC?logo=tailwind-css&logoColor=white&style=for-the-badge)
  ![Go](https://img.shields.io/badge/Go-1.27-00ADD8?logo=go&logoColor=white&style=for-the-badge)
  ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-18-4169E1?logo=postgresql&logoColor=white&style=for-the-badge)

</div>

---

## 🏗️ Monorepo Architecture

```
DFDWebsite/
├── client/   # Next.js 16 (App Router), React 19, Tailwind 4, Framer Motion
├── api/      # Go 1.27 API: REST, agent bridge, MCP, workers, PDF
├── shared/   # Shared Zod schemas + TypeScript types (frontend)
├── supabase/ # Supabase project config + seed (optional)
└── docs/     # Architecture + integration guides
```

**Data flow:** Vercel serves the frontend → Go API (single binary) → Supabase/Local PostgreSQL. Agents connect via `/api/v1/agent/*`, `/api/agent/*`, MCP (`/mcp` or stdio), or webhooks.

---

## 💻 Local Development

### Prerequisites
- **Node.js 20+**, **Go 1.27.4** (`GOTOOLCHAIN=go1.27.4`)
- **PostgreSQL 16+** — Laragon (Windows), `docker compose up -d`, or Supabase

### 1. Database
```sql
CREATE DATABASE dfd_agency;
```

### 2. Backend
```bash
cd api
cp .env.example .env   # set DATABASE_URL + JWT_SECRET (>=32 chars)
go run ./cmd/api       # migrates + serves on :8080
go run ./cmd/seed      # superadmin + packages + demo data
go run ./cmd/apikey -name stark-dfd -scopes agent,read,write
go run ./cmd/mcp       # MCP over stdio (for local harnesses)
```

### 3. Frontend
```bash
cd client
npm install
npm run dev            # :3000, proxies /api/v1 → Go API
```

Visit `http://localhost:3000`, `http://localhost:3000/admin/login` (`admin@dfdagency.com` / `superadmin123` after seed).

---

## 🤖 Agent Integration

| Channel | Address | Auth |
|---|---|---|
| REST bridge (Stark-compatible) | `/api/v1/agent/*`, `/api/agent/*` | `Authorization: Bearer <key>` (scope `agent`) |
| MCP (remote) | `POST/GET/DELETE /mcp` | Bearer key |
| MCP (local) | `go run ./cmd/mcp` (stdio) | ambient |
| Webhooks (push) | `POST /api/v1/webhooks` (admin) | cookie + SUPERADMIN, HMAC-signed delivery |

See [docs/agents.md](docs/agents.md). Machine writes are idempotent where it matters (orders), audited (`actor = agent:<key>`), and emitted to the outbox.

---

## 📚 Docs

- [docs/architecture.md](docs/architecture.md) — system design, modules, request lifecycle
- [docs/agents.md](docs/agents.md) — connecting Stark / external agents (REST, MCP, webhooks)
- [docs/supabase.md](docs/supabase.md) — Supabase project setup, RLS, storage, deploy
- [api/README.md](api/README.md) — backend reference

---

## 🗄️ Database Conventions

- **Soft delete everywhere** (`deleted_at`), filtered by default
- **Indexes** on every FK and filter column
- **Service/store layer** owns SQL; handlers stay thin
- **Migrations** are embedded SQL (`api/db/migrations`), applied at boot
- **Canonical envelope**: `{ success, message, data, error }` on every response
