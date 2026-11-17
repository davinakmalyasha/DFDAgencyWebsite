# Connecting Agents

The API is the system of record; agents are a workforce on top. Three
channels, same operations.

## 1. REST bridge (Stark-compatible)

Base: `/api/v1/agent` (alias: `/api/agent`).
Header: `Authorization: Bearer <dfd_agent_...>` (scope `agent`).

Named actions (identical to `dfd_bridge`):

```
lead_list | lead_get | lead_update
order_list | order_get | order_milestones
milestone_create | milestone_update
note_create | note_update
activity_create
request_list | request_get | request_update
project_list | project_get | project_update
article_list | article_create | article_update
whatsapp_send
```

Plus: `email_send` (progress/report mail, non-money).

```bash
curl -H "Authorization: Bearer $KEY" \
  "http://localhost:8080/api/v1/agent/orders?status=PROCESSING"
```

Mint keys with `go run ./cmd/apikey -name stark-dfd -scopes agent,read,write`.
The plaintext shows once; only the hash is stored. Writes are audited as
`agent:<key-id>` and emitted to the outbox.

## 2. MCP

Remote (streamable HTTP), bearer-guarded like the bridge:

```
POST /mcp   (initialize → session → tools/list → tools/call)
```

Local (stdio, ambient trust) for harnesses that spawn servers:

```bash
cd api && go run ./cmd/mcp
```

Tools mirror the bridge 1:1 (`lead_list`, `milestone_create`, …, plus
`email_send`). For Stark, register either the HTTP endpoint or the stdio
command — then drop `dfd_bridge` entirely.

## 3. Webhooks (push, not poll)

Admin registers a subscriber (cookie + SUPERADMIN):

```bash
curl -b admin.jar -X POST localhost:8080/api/v1/webhooks \
  -H 'Content-Type: application/json' \
  -d '{"url":"https://agents.example.com/dfd-hook","eventTypes":["order.created","milestone.decided","request.created"]}'
# → { subscription, secret }  (secret shows once)
```

Deliveries are `POST`ed with `X-DFD-Event` + `X-DFD-Signature: sha256=<hmac>`.

Event types: `lead.created`, `order.created`, `order.status`,
`milestone.created`, `milestone.updated`, `milestone.decided`,
`note.created`, `note.updated`, `activity.created`, `request.created`,
`request.updated`, `project.updated`, `article.created`, `article.updated`.

## Automation loop (Stark)

1. Webhook fires → DFD agent wakes with the event payload.
2. Agent works via MCP/bridge (read lead/order, create milestones, post
   notes/activities, update requests, send WhatsApp/email).
3. Client approves in the portal → `milestone.decided` / `request.updated`
   events flow back.
4. Order completes → portfolio/testimonial follow-ups run on schedule.

Money-adjacent actions (payments, invoices, contracts) stay human-approved
by design: the API exposes them read-only to agents.
