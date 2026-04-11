---
phase: 03-kasih-whatsapp-chatbot
plan: "05"
subsystem: chatbot-balance-handler
tags:
  - balance-handler
  - mock-balance-api
  - ic-masking
  - pdpa
  - wave-4
dependency_graph:
  requires:
    - "03-01: lib/chatbot/types.ts (Session, Language)"
    - "03-01: lib/chatbot/session-manager.ts (updateSession, expireSession)"
    - "02-xx: lib/ic-mask.ts (maskIC)"
    - "03-03: app/api/chatbot/message/route.ts (dispatcher that imports balanceHandler)"
  provides:
    - "lib/chatbot/mock-balance-api.ts: mockBalanceAPI(maskedIC) → BalanceResult"
    - "lib/chatbot/balance-handler.ts: balanceHandler(message, session, wamid?) → string"
  affects:
    - "app/api/chatbot/message/route.ts (removed @ts-expect-error for balance_check case)"
    - "mykasih-crm/lib/chatbot/complaint-handler.ts (Plan 06 — last remaining @ts-expect-error)"
tech_stack:
  added: []
  patterns:
    - "IC masked on very first line of step 1 — raw IC never reaches any assignment beyond local const"
    - "collected_data stores only masked_ic key — never raw IC"
    - "Transcript logs masked IC placeholder, not raw value"
    - "Mock balance API accepts maskedIC parameter (fixture data — real API in v2)"
    - "2-step handler: step 0 prompt, step 1 collect+process+save+expire"
    - "Same service-role Supabase client pattern as faq-handler and merchant-handler"
key_files:
  created:
    - mykasih-crm/lib/chatbot/mock-balance-api.ts
    - mykasih-crm/lib/chatbot/balance-handler.ts
  modified:
    - mykasih-crm/app/api/chatbot/message/route.ts
decisions:
  - "maskIC() called as the FIRST expression in step 1 — satisfies PDPA requirement that raw IC never persists beyond local scope"
  - "Mock balance API takes maskedIC as parameter (v2 will call real MyKasih API with the masked ID or a session token)"
  - "Parameter renamed to _maskedIC in mock-balance-api.ts to satisfy TypeScript no-unused-vars without suppression — fixture data is deterministic regardless of input"
metrics:
  duration: "~4 minutes"
  completed: "2026-04-12"
  tasks_completed: 1
  tasks_total: 1
  files_created: 2
  files_modified: 1
requirements_fulfilled:
  - CHAT-05
---

# Phase 3 Plan 05: Balance Check Handler + Mock Balance API Summary

**One-liner:** PDPA-safe 2-step balance handler — maskIC() called on first line of IC receipt, only masked_ic stored in session/transcripts, mock API returns deterministic RM100 fixture, call saved with channel='chat', category='balance_check', wa_message_id for dedup.

## What Was Built

Wave 4 delivers the most privacy-sensitive chatbot handler — balance check — which collects an IC number from the beneficiary and must comply with PDPA (Malaysia's Personal Data Protection Act):

- **lib/chatbot/mock-balance-api.ts** — `mockBalanceAPI(_maskedIC: string): BalanceResult` returns a deterministic fixture `{ name: 'Penerima SARA', balance: 100.00, expiry: '2026-12-31', nearest_merchant: '99 Speedmart, Jalan Kajang Utama' }`. The parameter is accepted but not used (fixture data is static). In v2, this function will be replaced with a real HTTP call to the MyKasih balance API. `BalanceResult` interface exported for consumers.

- **lib/chatbot/balance-handler.ts** — `balanceHandler(message, session, wamid?)` is a 2-step flow:
  - **Step 0:** `updateSession` sets intent=`balance_check` and step=1, returns bilingual IC prompt (BM/EN)
  - **Step 1 (PDPA-critical):** `maskIC(message)` called as the **very first expression** — raw IC is never assigned to any variable that outlives the local scope. Only `maskedIC` is stored in `session.collected_data.masked_ic`. Calls `mockBalanceAPI(maskedIC)`, formats bilingual balance response. Inserts call record with `channel='chat'`, `category='balance_check'`, `wa_message_id` (for DB-level dedup via UNIQUE constraint), `language`, `outcome='resolved'`. Inserts 3 transcript rows: bot prompt, user IC (as `[IC provided - masked: 880512-**-****]`), bot response. Calls `expireSession`.
  - **Default (safety):** Expires session, returns bilingual restart message.

- **app/api/chatbot/message/route.ts** — Removed the `@ts-expect-error` directive and the manual cast from the `balance_check` dispatch case. Now calls `await balanceHandler(message, session, wamid)` directly with full type safety. The `complaint` case still retains its `@ts-expect-error` until Plan 06.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Create mock-balance-api.ts and balance-handler.ts (CHAT-05) | 27c0dbd | lib/chatbot/mock-balance-api.ts, lib/chatbot/balance-handler.ts, app/api/chatbot/message/route.ts |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Unused parameter warning in mock-balance-api.ts**
- **Found during:** Task 1 — plan spec had `maskedIC: string` as the parameter name but the function body does not use it (fixture is static)
- **Issue:** TypeScript strict mode / no-unused-vars would flag `maskedIC` as unused
- **Fix:** Renamed parameter to `_maskedIC` (underscore prefix convention for intentionally unused params) — no suppression comment needed, TypeScript recognises the underscore prefix
- **Files modified:** `mykasih-crm/lib/chatbot/mock-balance-api.ts`
- **Commit:** 27c0dbd

**2. [Rule 1 - Bug] @ts-expect-error removed from route.ts balance_check case**
- **Found during:** Task 1 — after balance-handler.ts was created, the directive was no longer needed and would cause a `TS2578: Unused '@ts-expect-error' directive` error under strict mode
- **Fix:** Replaced the casted dynamic import pattern with a direct typed call `await balanceHandler(message, session, wamid)`
- **Files modified:** `mykasih-crm/app/api/chatbot/message/route.ts`
- **Commit:** 27c0dbd

## Known Stubs

One intentional stub:

| File | Pattern | Reason |
|------|---------|--------|
| `mykasih-crm/lib/chatbot/mock-balance-api.ts` | Returns hardcoded fixture regardless of input | Real MyKasih balance API integration is out of scope for POC (Phase 3). Confirmed decision in PROJECT.md. Will be replaced in v2. |

The stub does not prevent the plan's goal — the balance flow, IC masking, and DB persistence all function correctly with fixture data.

## Threat Surface Scan

All threat mitigations from the plan's threat model are implemented:

| Threat ID | Category | Mitigation |
|-----------|----------|------------|
| T-3-03 | Information Disclosure (balance-handler.ts) | `maskIC(message)` is the first expression in step 1; raw IC never written to session.collected_data, transcripts, or any DB field; only `masked_ic` persisted |
| T-3-03b | Information Disclosure (balance-handler transcripts) | Transcript row for user turn logs `[IC provided - masked: 880512-**-****]` — never the raw IC |

No new threat surface introduced beyond what the plan's threat model covers.

## Self-Check: PASSED

Verified:
- `mykasih-crm/lib/chatbot/mock-balance-api.ts` — FOUND
- `mykasih-crm/lib/chatbot/balance-handler.ts` — FOUND
- `export function mockBalanceAPI(` — PRESENT in mock-balance-api.ts
- `export interface BalanceResult` — PRESENT in mock-balance-api.ts
- `balance: 100.00` — PRESENT in mock-balance-api.ts
- `export async function balanceHandler(` — PRESENT in balance-handler.ts
- `import { maskIC } from '@/lib/ic-mask'` — PRESENT in balance-handler.ts
- `const maskedIC = maskIC(message)` — PRESENT in balance-handler.ts (first expression in step 1)
- `masked_ic: maskedIC` — PRESENT in balance-handler.ts
- `raw_ic` — NOT PRESENT (no raw IC stored)
- `channel: 'chat'` — PRESENT in balance-handler.ts
- `wa_message_id` — PRESENT in balance-handler.ts
- `category: 'balance_check'` — PRESENT in balance-handler.ts
- `mockBalanceAPI(maskedIC)` — PRESENT in balance-handler.ts
- `expireSession` — PRESENT in balance-handler.ts
- `tsc --noEmit` (full project) — EXIT 0
- `npm test --testPathPatterns="ic-mask|balance" --passWithNoTests` — 10 tests passed, 0 failed
- Commit 27c0dbd — FOUND
