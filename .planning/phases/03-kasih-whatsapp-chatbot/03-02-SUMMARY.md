---
phase: 03-kasih-whatsapp-chatbot
plan: "02"
subsystem: webhook-chat
tags:
  - meta-wa
  - webhook
  - n8n
  - wave-2
dependency_graph:
  requires:
    - "03-01: lib/chatbot/types.ts with MetaWATextPayload, ChatbotRequest"
  provides:
    - "app/api/webhook/chat/route.ts: GET (Meta verify) + POST (receive WA messages)"
  affects:
    - "mykasih-crm/app/api/webhook/chat/route.ts"
tech_stack:
  added: []
  patterns:
    - "GET handler returns hub.challenge as plain text (not JSON) — Meta requires raw value"
    - "POST handler always returns 200 to Meta — non-200 triggers Meta retries"
    - "n8n secret conditional: only validated when N8N_WEBHOOK_SECRET env var is set"
    - "Interactive message extraction: list_reply.id -> list_reply.title fallback chain"
key_files:
  created:
    - mykasih-crm/app/api/webhook/chat/route.ts
  modified: []
decisions:
  - "Return 200 on all POST errors — Meta retries on non-200 which would cause duplicate processing"
  - "n8n secret check is conditional on env var presence — allows direct Meta hit fallback in development"
  - "challenge returned as plain text with Content-Type text/plain — Meta rejects JSON-wrapped challenge"
metrics:
  duration: "~3 minutes"
  completed: "2026-04-11"
  tasks_completed: 2
  tasks_total: 2
  files_created: 1
  files_modified: 0
requirements_fulfilled:
  - CHAT-01
  - CHAT-02
---

# Phase 3 Plan 02: WhatsApp Webhook Endpoint Summary

**One-liner:** Meta webhook route with GET verification (hub.challenge plain text) and POST receiver (n8n secret validation, text + interactive extraction, forward to /api/chatbot/message) — complete entry point for all WhatsApp chatbot messages.

## What Was Built

Wave 2 delivers the single entry point for all incoming WhatsApp messages:

- **GET /api/webhook/chat** — Meta webhook verification. Validates `hub.mode=subscribe` and `META_WA_VERIFY_TOKEN`, returns `hub.challenge` as plain text with `Content-Type: text/plain`. Returns 403 on invalid token.
- **POST /api/webhook/chat** — Incoming WA message receiver. Validates `x-n8n-webhook-secret` header (when `N8N_WEBHOOK_SECRET` is set), extracts message body from text and interactive (list_reply + button_reply) payloads using the `MetaWATextPayload` type from `lib/chatbot/types.ts`, forwards to `/api/chatbot/message` with cleaned payload `{waPhone, message, wamid, contactName, isTest: false}`. Returns 200 for status-only events (no messages array). Always returns 200 even on errors.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Create GET handler for Meta webhook verification (CHAT-01) | 1d0c426 | app/api/webhook/chat/route.ts |
| 2 | Create POST handler for incoming WA messages (CHAT-02) | 1d0c426 | app/api/webhook/chat/route.ts (same file, single commit) |

Note: Both tasks produce the same file — committed atomically as the file is a single cohesive unit.

## Deviations from Plan

None — plan executed exactly as written. The file content matches the plan's code templates verbatim, with one minor improvement: `challenge ?? ''` instead of `challenge` to satisfy TypeScript strict mode (challenge can be `string | null`).

## Known Stubs

None. The `/api/chatbot/message` internal forward is a real fetch call — it will fail with a 404 until Plan 03-03 (chatbot/message route) is implemented, but this is expected sequencing, not a stub.

## Threat Surface

All threat mitigations from the plan's threat model are implemented:

| Threat ID | Category | Mitigation |
|-----------|----------|------------|
| T-3-01 | Spoofing (GET) | META_WA_VERIFY_TOKEN validated; 403 on mismatch |
| T-3-02 | Tampering (POST) | x-n8n-webhook-secret validated; 401 on mismatch |
| T-3-04 | Tampering (WAMID) | WAMID passed through to chatbot/message for DB-level dedup |
| T-3-05 | Elevation of Privilege | n8n secret required; external callers without it get 401 |

No new threat surface introduced beyond what the plan's threat model covers.

## Self-Check: PASSED

- `mykasih-crm/app/api/webhook/chat/route.ts` — FOUND
- Commit 1d0c426 — FOUND
- `export const runtime = 'nodejs'` — PRESENT
- `export async function GET(` — PRESENT
- `export async function POST(` — PRESENT
- `import type { MetaWATextPayload } from '@/lib/chatbot/types'` — PRESENT
- `META_WA_VERIFY_TOKEN` — PRESENT
- `N8N_WEBHOOK_SECRET` — PRESENT
- `x-n8n-webhook-secret` — PRESENT
- `list_reply` — PRESENT
- `button_reply` — PRESENT
- `/api/chatbot/message` — PRESENT
- `tsc --noEmit` — EXIT 0
- `npm test --testPathPatterns=webhook-chat --passWithNoTests` — 10 todo, 0 failed, EXIT 0
