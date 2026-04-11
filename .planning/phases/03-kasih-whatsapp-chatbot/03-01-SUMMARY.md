---
phase: 03-kasih-whatsapp-chatbot
plan: "01"
subsystem: chatbot-foundation
tags:
  - meta-wa
  - session-manager
  - supabase-migration
  - chatbot-types
  - wave-1
dependency_graph:
  requires:
    - "03-00: @anthropic-ai/sdk installed, test stubs created"
  provides:
    - "lib/meta-wa.ts: sendWhatsAppMessage + sendWhatsAppButtons"
    - "lib/chatbot/session-manager.ts: getActiveSession, createSession, updateSession, expireSession"
    - "lib/chatbot/types.ts: Intent, Language, Classification, Session, ChatbotRequest, HandlerResponse, MetaWATextPayload"
    - "supabase/migrations/20260411_create_sessions.sql: sessions table DDL + calls.wa_message_id column"
  affects:
    - "mykasih-crm/lib/chatbot/*"
    - "mykasih-crm/lib/meta-wa.ts"
    - "mykasih-crm/supabase/migrations/*"
tech_stack:
  added: []
  patterns:
    - "sendWhatsAppButtons uses type:'list' (not 'button') — WhatsApp button max is 3 items, list supports 10"
    - "Session manager uses service role client directly (createClient from @supabase/supabase-js) — bypasses RLS needed for sessions table"
    - "Stub mode: META_WA env vars absent → console.log [WA STUB] prefix, no HTTP call made"
    - "wa_message_id UNIQUE on sessions AND calls tables — prevents WAMID replay attacks (Meta delivers at-least-once)"
key_files:
  created:
    - mykasih-crm/lib/meta-wa.ts
    - mykasih-crm/lib/chatbot/session-manager.ts
    - mykasih-crm/lib/chatbot/types.ts
    - mykasih-crm/supabase/migrations/20260411_create_sessions.sql
  modified:
    - mykasih-crm/__tests__/lib/meta-wa.test.ts
decisions:
  - "sendWhatsAppButtons uses type:'list' not type:'button' — confirmed list supports 10 items vs button max 3"
  - "Session manager uses @supabase/supabase-js createClient directly with service role key — same pattern as lib/ticket-ref.ts, avoids cookie context requirement of lib/supabase/server.ts"
  - "wa_message_id UNIQUE on both sessions and calls tables — deduplication at DB level for Meta at-least-once delivery"
  - "Task 3 (Supabase db push) blocked — project not linked, no SUPABASE_ACCESS_TOKEN set; migration SQL is ready and must be applied manually"
metrics:
  duration: "~10 minutes"
  completed: "2026-04-11"
  tasks_completed: 2
  tasks_total: 3
  files_created: 4
  files_modified: 1
requirements_fulfilled:
  - CHAT-08
  - CHAT-09
  - CHAT-10
---

# Phase 3 Plan 01: Sessions Migration, Types, Meta WA Helpers, Session Manager Summary

**One-liner:** Supabase sessions table migration (with WAMID dedup), shared chatbot TypeScript types, Meta WA send helpers with stub mode, and session CRUD manager using service role client — all 4 foundational modules ready for downstream handlers.

## What Was Built

Wave 1 builds the foundation that all chatbot handlers (Plans 02–06) depend on:

- **supabase/migrations/20260411_create_sessions.sql** — sessions table with `wa_message_id UNIQUE` for WAMID dedup, RLS service-role-only policy, and `ALTER TABLE calls ADD COLUMN wa_message_id` for chat channel dedup
- **lib/chatbot/types.ts** — shared TypeScript types: `Intent`, `Language`, `Classification`, `Session`, `ChatbotRequest`, `HandlerResponse`, `MetaWATextPayload` (including list_reply interactive type)
- **lib/meta-wa.ts** — `sendWhatsAppMessage()` and `sendWhatsAppButtons()`. Stub mode logs `[WA STUB]` to console when META_WA env vars absent. Buttons function uses `type:'list'` (not `type:'button'`) to support 4+ quick-reply items
- **lib/chatbot/session-manager.ts** — `getActiveSession`, `createSession`, `updateSession`, `expireSession` using Supabase service role client (bypasses RLS, same pattern as `lib/ticket-ref.ts`)
- **__tests__/lib/meta-wa.test.ts** — 5 passing tests replacing the `test.todo()` stubs from Plan 00; covers stub behavior and list type serialization

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Create sessions migration SQL and shared chatbot types | 4fdc152 | supabase/migrations/20260411_create_sessions.sql, lib/chatbot/types.ts |
| 2 | Create lib/meta-wa.ts and lib/chatbot/session-manager.ts | ad18ce3 | lib/meta-wa.ts, lib/chatbot/session-manager.ts, __tests__/lib/meta-wa.test.ts |
| 3 | Run Supabase schema push | BLOCKED | Migration SQL ready — manual apply required |

## Deviations from Plan

### Auto-fixed Issues

None — plan executed as written for Tasks 1 and 2.

### Blocked Tasks

**Task 3: Supabase db push**
- **Status:** Blocked — auth gate
- **Issue:** `npx supabase db push` returned "Cannot find project ref. Have you run supabase link?" — the Supabase CLI is not linked to the project and `SUPABASE_ACCESS_TOKEN` is not set in the environment
- **Resolution needed:** Apply the migration SQL manually in the Supabase Dashboard SQL Editor, OR run `supabase link --project-ref <ref>` and `supabase db push`
- **SQL file:** `mykasih-crm/supabase/migrations/20260411_create_sessions.sql`

## Known Stubs

None in the implementation files. The `[WA STUB]` behavior in `lib/meta-wa.ts` is intentional — it is the production fallback when META_WA env vars are absent (e.g., during development and testing), not a data stub.

## Threat Surface Scan

The threat mitigations defined in the plan's threat model are all implemented:

| Threat ID | Mitigation Status |
|-----------|------------------|
| T-3-01 (Spoofing: lib/meta-wa.ts) | Mitigated — stub mode skips API call when env vars absent; token only in server env |
| T-3-03 (Info Disclosure: sessions.collected_data) | Documented — handlers MUST call maskIC() before writing IC to collected_data (enforced in Plan 05) |
| T-3-04 (Tampering: sessions table) | Mitigated — wa_message_id UNIQUE constraint in migration SQL |

No new threat surface introduced beyond what the plan's threat model covers.

## Self-Check: PASSED

Verified:
- `mykasih-crm/supabase/migrations/20260411_create_sessions.sql` — FOUND
- `mykasih-crm/lib/chatbot/types.ts` — FOUND
- `mykasih-crm/lib/meta-wa.ts` — FOUND
- `mykasih-crm/lib/chatbot/session-manager.ts` — FOUND
- `mykasih-crm/__tests__/lib/meta-wa.test.ts` — UPDATED (5 passing tests)
- Commit 4fdc152 — FOUND (feat: sessions migration + types)
- Commit ad18ce3 — FOUND (feat: meta-wa + session-manager)
- tsc --noEmit on all 3 implementation files — EXIT 0
- npm test meta-wa|session-manager — 5 PASSED, 8 todo, 0 failed
