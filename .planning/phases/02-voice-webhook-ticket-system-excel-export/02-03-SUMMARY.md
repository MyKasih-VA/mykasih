---
phase: 02-voice-webhook-ticket-system-excel-export
plan: 03
subsystem: voice-webhook
tags: [elevenlabs, webhook, hmac, calls, transcripts, tickets, voice]
dependency_graph:
  requires: [02-01]
  provides: [POST /api/webhook/voice, ElevenLabsWebhookPayload]
  affects: [02-04-ticket-crud, 02-05-export-route, voice-calls-dashboard-page]
tech_stack:
  added: []
  patterns: [service-role-client, hmac-sha256-validation, raw-body-first, timing-safe-equal]
key_files:
  created:
    - mykasih-crm/lib/elevenlabs-types.ts
    - mykasih-crm/app/api/webhook/voice/route.ts
    - mykasih-crm/lib/ic-mask.ts (Rule 3 — missing dep from 02-01)
    - mykasih-crm/lib/ticket-ref.ts (Rule 3 — missing dep from 02-01)
  modified: []
decisions:
  - "Raw body read as text before JSON.parse — prevents body-consumed error on HMAC validation"
  - "timingSafeEqual used for HMAC comparison — prevents timing oracle attacks (T-02-03-01)"
  - "Replay protection: reject webhook events older than 5 minutes"
  - "Category key checked as 'category' | 'call_category' | 'intent' — covers Assumption A2 uncertainty"
  - "agent role maps to 'bot' in DB speaker enum per ElevenLabs docs (role 'agent' -> DB 'bot')"
  - "Ticket reference retry on unique constraint (code 23505) — handles race condition on simultaneous complaints"
  - "Always return 200 except 401 for invalid signature — prevents ElevenLabs webhook auto-disable (D-11/D-14)"
metrics:
  duration: "12 minutes"
  completed: "2026-04-11T12:00:00Z"
  tasks_completed: 2
  files_created: 4
  files_modified: 0
---

# Phase 02 Plan 03: ElevenLabs Voice Webhook Summary

**One-liner:** HMAC-SHA256-validated ElevenLabs webhook receiver that inserts calls + transcripts into Supabase and auto-creates TKT tickets for complaints, with category detection from data_collection and keyword fallback.

## Tasks Completed

| Task | Description | Commit | Status |
|------|-------------|--------|--------|
| 1 | Create ElevenLabs payload TypeScript interfaces | 6845535 | DONE |
| 2 | Implement POST /api/webhook/voice route | a370ed2 | DONE |

## Verification Results

### Task 1 — elevenlabs-types.ts

- `export interface ElevenLabsWebhookPayload` — PRESENT
- `export interface ElevenLabsTranscriptTurn` — PRESENT
- `export interface ElevenLabsDataCollectionResult` — PRESENT
- `data_collection_results: Record<string, ElevenLabsDataCollectionResult>` — PRESENT
- `call_duration_secs: number` — PRESENT
- No `any` type — CONFIRMED (all ElevenLabs polymorphic fields typed as `unknown`)

### Task 2 — webhook/voice/route.ts

- `export async function POST(request: NextRequest)` — PRESENT
- `await request.text()` before `JSON.parse` — CONFIRMED (line 87 vs ~105)
- `validateElevenLabsSignature` with `timingSafeEqual` — PRESENT
- `createHmac('sha256', secret)` — PRESENT
- `.from('calls').insert(` with `channel: 'voice'` — PRESENT
- `.from('transcripts').insert(` — PRESENT
- `import { generateTicketRef } from '@/lib/ticket-ref'` — PRESENT
- `category === 'complaint'` check for ticket creation — PRESENT
- `status: 401` only in signature validation branch — CONFIRMED
- All other returns `status: 200` — CONFIRMED
- `detectCategoryFromTranscript` function — PRESENT
- No `any` type — CONFIRMED

## Acceptance Criteria Check

**Task 1:**
- [x] File `mykasih-crm/lib/elevenlabs-types.ts` exists
- [x] Contains `export interface ElevenLabsWebhookPayload`
- [x] Contains `export interface ElevenLabsTranscriptTurn`
- [x] Contains `data_collection_results: Record<string, ElevenLabsDataCollectionResult>`
- [x] Contains `call_duration_secs: number`
- [x] Does NOT contain `any` type

**Task 2:**
- [x] File `mykasih-crm/app/api/webhook/voice/route.ts` exists
- [x] Contains `export async function POST(request: NextRequest)`
- [x] Contains `await request.text()` BEFORE any `JSON.parse` call
- [x] Contains `validateElevenLabsSignature` function with `timingSafeEqual`
- [x] Contains `createHmac('sha256', secret)` for HMAC computation
- [x] Contains `.from('calls').insert(` with `channel: 'voice'`
- [x] Contains `.from('transcripts').insert(`
- [x] Contains `import { generateTicketRef } from '@/lib/ticket-ref'`
- [x] Contains `category === 'complaint'` check before ticket creation
- [x] Contains `status: 401` ONLY in the signature validation failure branch
- [x] All other returns use `status: 200`
- [x] Contains `detectCategoryFromTranscript` function for keyword fallback
- [x] Does NOT contain `any` type
- [x] File `mykasih-crm/lib/elevenlabs-types.ts` exists and is imported

## Implementation Notes

### elevenlabs-types.ts

Single source of truth for ElevenLabs payload structure. Types derived directly from the ElevenLabs GET Conversation API reference (same structure as webhook payload). All polymorphic fields (`tool_calls`, `tool_results`, `feedback`, `json_schema`, `evaluation_criteria_results`, `conversation_initiation_client_data`) typed as `unknown` — no `any` usage.

### webhook/voice/route.ts

Processing order strictly follows plan specification:
1. `request.text()` first — preserves raw bytes for HMAC validation
2. HMAC-SHA256 validation with replay protection (5-minute window)
3. 401 return if signature invalid — the ONLY non-200 response
4. `JSON.parse(rawBody)` from already-consumed text
5. Category extraction from `data_collection_results` with three key candidates
6. Keyword fallback across 6 category types in BM+EN
7. Service role client for Supabase inserts (no user session in webhooks)
8. Call record inserted with `channel='voice'`, `is_test` from dynamic_variables
9. Transcript turns inserted with `agent→bot` role mapping
10. Complaint auto-ticketing with retry on `23505` unique constraint violation
11. Always 200 on any DB failure with `conversation_id` for audit recovery

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Created ic-mask.ts and ticket-ref.ts as missing dependencies**
- **Found during:** Task 2 pre-implementation check
- **Issue:** This plan's worktree branch (`worktree-agent-ae19221e`) was created from commit `3968db0` (end of Phase 01) before Plan 02-01 added `ic-mask.ts` and `ticket-ref.ts`. The webhook route imports `generateTicketRef` from `@/lib/ticket-ref` — file was absent in the worktree.
- **Fix:** Created both utility files in the worktree matching the spec in 02-RESEARCH.md and the implementations visible in the main repo.
- **Files modified:** `mykasih-crm/lib/ic-mask.ts`, `mykasih-crm/lib/ticket-ref.ts`
- **Commit:** `9c38b3e`

## Known Stubs

None — all fields are wired. Category extraction checks multiple key names to handle Assumption A2 uncertainty (exact ElevenLabs data_collection field name). `caller_name`, `wa_number`, and `masked_ic` are intentionally `null` for voice calls per D-04/D-05.

## Threat Surface Scan

New network endpoint introduced: `POST /api/webhook/voice` — internet-facing, untrusted input from ElevenLabs.

All threats from the plan's threat model are mitigated:

| Flag | File | Description |
|------|------|-------------|
| threat_flag: external-webhook | mykasih-crm/app/api/webhook/voice/route.ts | New POST endpoint accepting untrusted internet requests — mitigated by HMAC-SHA256 + replay protection |

Mitigations applied:
- T-02-03-01: HMAC-SHA256 + timingSafeEqual + 5-minute replay window
- T-02-03-02: Signature covers entire raw body — any modification invalidates HMAC
- T-02-03-03: `elevenlabs_conversation_id` logged in all error paths
- T-02-03-04: Error responses include only `conversation_id` — no stack traces
- T-02-03-05: Always return 200 (except 401) — prevents ElevenLabs webhook auto-disable
- T-02-03-06: `SUPABASE_SERVICE_ROLE_KEY` via `process.env` only — never client-exposed
- T-02-03-07: `masked_ic=null` for all voice calls — no PII risk

## Self-Check: PASSED

- [x] `mykasih-crm/lib/elevenlabs-types.ts` — FOUND
- [x] `mykasih-crm/app/api/webhook/voice/route.ts` — FOUND
- [x] `mykasih-crm/lib/ic-mask.ts` — FOUND (Rule 3 deviation)
- [x] `mykasih-crm/lib/ticket-ref.ts` — FOUND (Rule 3 deviation)
- [x] Commit 6845535 — feat(02-03): add ElevenLabs webhook payload TypeScript interfaces
- [x] Commit 9c38b3e — chore(02-03): add ic-mask and ticket-ref utilities (Rule 3)
- [x] Commit a370ed2 — feat(02-03): implement POST /api/webhook/voice
