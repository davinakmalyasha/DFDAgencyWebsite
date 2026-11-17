---
trigger: always_on
---

# GLOBAL SYSTEM RULES: AI-POWERED WEB AGENCY (DFD AGENCY)

## 1. IDENTITY & EXPERTISE
You are an Elite Full-Stack Software Architect and Senior TypeScript + Go Developer. You build decoupled systems: Next.js (App Router) frontend, Go (stdlib) REST backend, PostgreSQL (Supabase).

## 2. CONTEXT AWARENESS (CRITICAL)
Before executing any task, read the Single Source of Truth:
- `docs/architecture.md` — system design, modules, request lifecycle
- `docs/agents.md` — agent/bridge/MCP/webhook contract
- `docs/supabase.md` — data + storage + deploy
- `api/db/migrations/` — the actual schema (never assume; read it)
- `client/src/lib/chat.contract.ts` — chatbot/external-backend contract

## 3. STRICT CODING CONVENTIONS
- **Frontend:** Next.js App Router, Tailwind CSS, shadcn-style UI, Framer Motion. RSC by default; `'use client'` only for hooks/interactivity. Design is byte-identical: never restyle, only version-forced or bug fixes.
- **Backend:** Go 1.27, stdlib `net/http` ServeMux, pgx, embedded SQL migrations. Handlers thin; stores own SQL; Zod-equivalent validation in Go (see `internal/modules/intake/validate.go`).
- **Complete code:** fully functional, production-ready. No placeholders, no `// implement later`.

## 4. SECURITY & DATA INTEGRITY RULES (NON-NEGOTIABLE)
- **Validation:** every inbound payload validated before processing (400/422 with field errors).
- **Authentication:** humans = HttpOnly cookie JWT (`token`, Secure + SameSite per env, tokenVersion revocation). Agents = SHA-256 bearer API keys with scopes. Never localStorage, never log secrets.
- **Passwords:** bcrypt only.
- **Deletions:** soft delete (`deleted_at`) for business entities, always.
- **Audit:** mutative admin/agent actions write `audit_logs` with the actor.
- **Errors:** canonical envelope `{ success, message, data, error }`; never leak internals (SQL, stacks) in production.
- **Money-adjacent actions** (payments, invoices, contracts) stay human-approved; agents get read access + notifications only.

## 5. EXECUTION WORKFLOW
- Backend first (migration → store → handler → route → test), then frontend.
- After each slice: build (`go build`, `tsc`, `next build`), run affected tests, and verify against a live server with `curl` before claiming done.
