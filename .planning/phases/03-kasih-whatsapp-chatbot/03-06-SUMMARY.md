---
phase: 03-kasih-whatsapp-chatbot
plan: "06"
subsystem: chatbot-complaint-handler
tags:
  - complaint-handler
  - multi-turn
  - ic-masking
  - pdpa
  - ticket-creation
  - wave-5
dependency_graph:
  requires:
    - "03-01: lib/chatbot/types.ts (Session, Language)"
    - "03-01: lib/chatbot/session-manager.ts (updateSession, expireSession)"
    - "02-xx: lib/ic-mask.ts (maskIC)"
    - "02-xx: lib/ticket-ref.ts (generateTicketRef)"
    - "03-03: app/api/chatbot/message/route.ts (dispatcher that imports complaintHandler)"
  provides:
    - "lib/chatbot/complaint-handler.ts: complaintHandler(message, session, isTest, wamid?) -> string"
  affects:
    - "app/api/chatbot/message/route.ts (removed @ts-expect-error for complaint case — now fully type-safe)"
tech_stack:
  added: []
  patterns:
    - "5-step multi-turn handler: acknowledge -> name -> IC (masked) -> describe -> confirm"
    - "maskIC() called as first expression in case 2 — raw IC never reaches any assignment beyond local const"
    - "collected_data stores only masked_ic key — never raw IC"
    - "Transcript logs [IC masked: ...] placeholder, never raw IC"
    - "Cancellation path: expireSession() with no ticket created"
    - "Confirmation path: generateTicketRef() + call insert + ticket insert + transcript insert + expireSession()"
    - "Same service-role Supabase client pattern (getServiceClient()) as all other chatbot handlers"
    - "isTest flag threaded from dispatcher through to call record's is_test field"
key_files:
  created:
    - mykasih-crm/lib/chatbot/complaint-handler.ts
  modified:
    - mykasih-crm/app/api/chatbot/message/route.ts
decisions:
  - "maskIC() called as the FIRST expression in case 2 — satisfies PDPA requirement that raw IC never persists beyond local scope"
  - "Yes-word list includes both BM (ya, sahkan, betul) and EN (yes, ok, okay, confirm) to handle bilingual confirmation"
  - "callData insert guards with early return on failure — expireSession called to avoid stuck session state on DB error"
  - "ticket insert failure only logs error (does not abort) — ticket is secondary; call record is the primary audit trail"
requirements-completed:
  - CHAT-07
  - CHAT-09
metrics:
  duration: "~4 minutes"
  completed: "2026-04-12"
  tasks_completed: 1
  tasks_total: 1
  files_created: 1
  files_modified: 1
---

# Phase 3 Plan 06: Complaint Handler Summary

**PDPA-safe 5-step multi-turn complaint handler — maskIC() on IC receipt, only masked_ic stored, ticket created with TKT-YYYY-NNNNN on confirmation, call saved with channel='chat'/category='complaint'/outcome='escalated'/wa_message_id, cancellation expires session without creating ticket.**

## Performance

- **Duration:** ~4 minutes
- **Started:** 2026-04-11T16:27:42Z
- **Completed:** 2026-04-12
- **Tasks:** 1 of 1
- **Files modified:** 2

## Accomplishments

- Created the final and most complex chatbot handler — 5-step multi-turn complaint flow that is the only chatbot feature producing actionable tickets for MyKasih staff
- IC masking enforced at step 2: `maskIC(message)` is the first expression, so raw IC never touches `collected_data`, transcripts, or any DB field — full PDPA compliance
- On confirmation: `generateTicketRef()` generates TKT-2026-NNNNN, call record inserted with `channel='chat'`, `category='complaint'`, `outcome='escalated'`, `wa_message_id` for dedup, 7 transcript turns saved, then session expired
- Cancellation (any non-yes response) expires session immediately and returns bilingual cancelled message — no ticket, no call record
- Removed `@ts-expect-error` from route.ts complaint case — all 4 handlers now fully type-safe with no suppression directives remaining

## Task Commits

1. **Task 1: Create complaint-handler.ts + remove route.ts @ts-expect-error** - `37cd1bf` (feat)

## Files Created/Modified

- `mykasih-crm/lib/chatbot/complaint-handler.ts` — 5-step multi-turn complaint handler: acknowledge, collect name, collect IC (masked immediately), collect description, confirm and create ticket
- `mykasih-crm/app/api/chatbot/message/route.ts` — Removed `@ts-expect-error` from complaint case; now calls `await complaintHandler(message, session, isTest, wamid)` directly

## Decisions Made

- maskIC() called as the FIRST expression in case 2 — satisfies PDPA requirement that raw IC never persists beyond local scope
- Yes-word list covers both BM (ya, sahkan, betul) and EN (yes, ok, okay, confirm) to handle bilingual confirmation step
- callData insert failure triggers early return with expireSession() — avoids stuck session state on DB error
- ticket insert failure only logs (does not abort) — call record is the primary audit trail; ticket is secondary and a failed ticket can be recreated from the call record

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Removed stale @ts-expect-error from route.ts complaint dispatch**
- **Found during:** Task 1 — once complaint-handler.ts was created, the `@ts-expect-error` directive would become an unused suppression error under strict TypeScript
- **Issue:** `TS2578: Unused '@ts-expect-error' directive` would cause `tsc --noEmit` to fail
- **Fix:** Replaced the `@ts-expect-error` + cast pattern with a direct typed call `await complaintHandler(message, session, isTest, wamid)`
- **Files modified:** `mykasih-crm/app/api/chatbot/message/route.ts`
- **Verification:** `tsc --noEmit` exits 0
- **Committed in:** 37cd1bf (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 bug — stale TypeScript suppression directive)
**Impact on plan:** Essential for correctness — leaving the directive would cause tsc to fail. No scope creep.

## Issues Encountered

None — plan executed smoothly. All interfaces from prior plans (session-manager, ic-mask, ticket-ref, types) matched the spec exactly.

## Known Stubs

None — complaint handler is fully wired: real DB writes, real ticket ref generation, real IC masking. No hardcoded or placeholder responses (bilingual strings are chatbot conversational text, intentionally inline per prior decision).

## Threat Surface Scan

All threat mitigations from the plan's threat model are implemented:

| Threat ID | Category | Mitigation |
|-----------|----------|------------|
| T-3-03 | Information Disclosure (case 2) | `maskIC(message)` is the first expression in case 2; raw IC never written to `collected_data`, transcripts, or any DB field; only `masked_ic: maskedIC` persisted |
| T-3-04 | Tampering (reference_no) | `generateTicketRef()` queries MAX for restart safety; `reference_no` has UNIQUE constraint in DB |
| T-3-02 | Tampering (description) | Accepted as-is (React auto-escapes on display; no HTML/script injection risk in plain-text field) |

No new threat surface introduced beyond what the plan's threat model covers.

## User Setup Required

None — no external service configuration required. All wiring uses existing Supabase service-role key and previously established patterns.

## Next Phase Readiness

- All 4 chatbot handlers are now complete and fully type-safe: faq, balance_check, merchant_lookup, complaint
- No `@ts-expect-error` directives remain in the codebase for chatbot handlers
- Phase 3 chatbot wave is complete — all CHAT-01 through CHAT-09 requirements fulfilled
- Ready for Phase 3 wave 6+ (webhook integration, testing console) or phase transition

---
*Phase: 03-kasih-whatsapp-chatbot*
*Completed: 2026-04-12*

## Self-Check: PASSED

Verified:
- `mykasih-crm/lib/chatbot/complaint-handler.ts` — FOUND
- `export async function complaintHandler(` — PRESENT
- `import { maskIC } from '@/lib/ic-mask'` — PRESENT
- `import { generateTicketRef } from '@/lib/ticket-ref'` — PRESENT
- `const maskedIC = maskIC(message)` — PRESENT in case 2 (first expression)
- `masked_ic: maskedIC` — PRESENT (only masked IC stored)
- `channel: 'chat'` — PRESENT
- `wa_message_id` — PRESENT
- `category: 'complaint'` — PRESENT
- `outcome: 'escalated'` — PRESENT
- `reference_no: referenceNo` — PRESENT
- `is_test: isTest` — PRESENT
- `expireSession` — PRESENT
- `case 0:` through `case 4:` — ALL PRESENT
- `raw_ic` — NOT PRESENT (no raw IC stored)
- `tsc --noEmit` (full project) — EXIT 0
- `npm test --testPathPatterns="ticket|complaint" --passWithNoTests` — 11 tests (3 passed, 8 todo), 0 failed
- Commit 37cd1bf — FOUND
