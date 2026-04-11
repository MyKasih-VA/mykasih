---
phase: 03-kasih-whatsapp-chatbot
plan: "07"
subsystem: chatbot-tests
tags:
  - unit-tests
  - meta-wa
  - intent-classifier
  - webhook-chat
  - chatbot-message
  - complaint-handler
  - wave-6
dependency_graph:
  requires:
    - "03-01: lib/chatbot/types.ts (Session, Classification)"
    - "03-02: lib/meta-wa.ts (sendWhatsAppMessage, sendWhatsAppButtons)"
    - "03-03: app/api/chatbot/message/route.ts (POST dispatcher)"
    - "03-03: app/api/webhook/chat/route.ts (GET/POST)"
    - "03-04: lib/chatbot/intent-classifier.ts (classifyIntent)"
    - "03-05: lib/chatbot/complaint-handler.ts (complaintHandler)"
    - "03-06: lib/chatbot/complaint-handler.ts (all steps)"
  provides:
    - "__tests__/lib/meta-wa.test.ts: stub-mode + list-type assertions"
    - "__tests__/lib/intent-classifier.test.ts: SDK mock + model + fallback tests"
    - "__tests__/api/webhook-chat.test.ts: GET hub verification + POST n8n auth tests"
    - "__tests__/api/chatbot-message.test.ts: dispatcher flow tests"
    - "__tests__/lib/complaint-handler.test.ts: 5-step multi-turn + PDPA maskIC tests"
  affects:
    - "Full test suite: 16 suites, 50 passing (up from 34), 0 failing"
tech_stack:
  added: []
  patterns:
    - "jest.mock() factory self-contained — no outer const references (TDZ fix)"
    - "Mock functions created inside factory, exposed via side-channel property on exported function"
    - "Typed mock references retrieved via import + cast after jest.mock()"
    - "@jest-environment node docblock on API route test files (Web Fetch API globals)"
    - "mockInsertCalls/Tickets/Transcripts exposed via createClient._insertCalls side-channel"
    - "Anthropic SDK mock: MockAnthropic._mockCreate exposes inner jest.fn()"
key_files:
  created: []
  modified:
    - mykasih-crm/__tests__/lib/meta-wa.test.ts
    - mykasih-crm/__tests__/lib/intent-classifier.test.ts
    - mykasih-crm/__tests__/api/webhook-chat.test.ts
    - mykasih-crm/__tests__/api/chatbot-message.test.ts
    - mykasih-crm/__tests__/lib/complaint-handler.test.ts
decisions:
  - "jest.mock() factories must not reference outer const variables — temporal dead zone causes ReferenceError at module evaluation time; fix is to create fns inside factory and expose via side-channel property"
  - "@jest-environment node required for API route tests — Next.js route handlers use Web Fetch API (Request/Response) which jsdom does not provide but Node 18+ does natively"
  - "Single-line /** @jest-environment node */ docblock required — multi-line blocks cause Jest to read description lines as part of environment name"
  - "Anthropic SDK mock exposes mockCreate via MockAnthropic._mockCreate side-channel — same TDZ fix pattern applied consistently"
requirements-completed:
  - CHAT-01
  - CHAT-02
  - CHAT-03
  - CHAT-05
  - CHAT-07
  - CHAT-08
  - CHAT-09
  - CHAT-10
metrics:
  duration: "~12 minutes"
  completed: "2026-04-12"
  tasks_completed: 2
  tasks_total: 2
  files_created: 0
  files_modified: 5
---

# Phase 3 Plan 07: Unit Tests (Wave 6) Summary

**Replaced all Phase 3 test stubs with real unit tests — meta-wa verifies list type not button, intent-classifier mocks @anthropic-ai/sdk and verifies claude-haiku-4-5-20251001 model, complaint-handler verifies maskIC called before DB write and wa_message_id in call insert, webhook-chat verifies hub.challenge GET and n8n auth POST; full suite 16/16 suites pass, 50 tests passing, 0 failing.**

## Performance

- **Duration:** ~12 minutes
- **Started:** 2026-04-11T16:30:00Z
- **Completed:** 2026-04-12
- **Tasks:** 2 of 2
- **Files modified:** 5

## Accomplishments

### Task 1: meta-wa.test.ts + intent-classifier.test.ts

- **meta-wa.test.ts** already had real tests from a prior session — verified all 5 pass (stub-mode console.log, live-mode fetch URL, list type not button, sections.rows count, stub-mode for buttons)
- **intent-classifier.test.ts** replaced 7 todos with 9 real tests: all 5 intents, JSON parse error fallback, API throw fallback, invalid intent/language normalisation, and model name assertion for `claude-haiku-4-5-20251001`
- Key pattern: `@anthropic-ai/sdk` mock creates `mockCreate` inside the factory and exposes it via `MockAnthropic._mockCreate` — avoids temporal dead zone that causes `ReferenceError: Cannot access 'mockCreate' before initialization`

### Task 2: webhook-chat.test.ts + chatbot-message.test.ts + complaint-handler.test.ts

- **webhook-chat.test.ts**: 9 tests covering GET hub verification (200 with challenge body, 403 wrong token, 403 wrong mode) and POST n8n auth (401 missing/wrong secret, 200 valid text, 200 no_message on status-only event, fetch forwarding to /api/chatbot/message)
- **chatbot-message.test.ts**: 7 tests covering 401/400 validation, first_contact list send, faq dispatch, and locked session intent reuse without re-classifying
- **complaint-handler.test.ts**: 12 tests covering all 5 complaint steps — step 0 greeting (BM+EN), step 1 name storage, step 2 maskIC called with raw IC + only masked_ic stored (not raw_ic/ic), step 3 description + step 4 advancement, step 4 ticket creation (channel=chat, category=complaint, outcome=escalated, wa_message_id, is_test flag, reference_no), and rejection path (expireSession, no call/ticket insert)

## Task Commits

1. **Task 1: Real unit tests for meta-wa + intent-classifier** - `7d95617` (test)
2. **Task 2: Real unit tests for webhook-chat, chatbot-message, complaint-handler** - `93d8ddd` (test)

## Files Created/Modified

- `mykasih-crm/__tests__/lib/meta-wa.test.ts` — already had real tests; verified 5 pass unchanged
- `mykasih-crm/__tests__/lib/intent-classifier.test.ts` — replaced 7 todos with 9 real tests; SDK mock with side-channel pattern
- `mykasih-crm/__tests__/api/webhook-chat.test.ts` — replaced 6 todos with 9 real tests; `@jest-environment node`
- `mykasih-crm/__tests__/api/chatbot-message.test.ts` — replaced 5 todos with 7 real tests; `@jest-environment node`
- `mykasih-crm/__tests__/lib/complaint-handler.test.ts` — replaced 8 todos with 12 real tests; supabase mock via side-channel

## Decisions Made

- jest.mock() factories must be self-contained (no outer const references) — temporal dead zone causes ReferenceError when Jest hoists the mock call above variable declarations
- @jest-environment node required for API route test files — Next.js route handlers depend on the Web Fetch API (Request/Response/Headers) which jsdom omits but Node 18+ provides natively
- Single-line `/** @jest-environment node */` docblock required — multi-line JSDoc blocks cause Jest to concatenate all lines into the environment name, producing a lookup failure
- Anthropic SDK mock and session-manager mock both use the side-channel pattern: create fn inside factory, expose via property on exported value, retrieve after import with typed cast

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Temporal dead zone in jest.mock() factories for all 4 test files**
- **Found during:** Task 1 (intent-classifier) and Task 2 (complaint-handler, chatbot-message)
- **Issue:** `const mockFn = jest.fn()` declared before `jest.mock(factory)` causes `ReferenceError: Cannot access 'mockFn' before initialization` — Jest hoists mock calls above variable declarations, so the factory runs before the `const` binding is initialized
- **Fix:** Restructured all mock factories to create `jest.fn()` instances internally and expose them via a side-channel property on the exported value. Tests retrieve them after import via typed cast.
- **Files modified:** All 4 affected test files
- **Committed in:** 7d95617 (Task 1), 93d8ddd (Task 2)

**2. [Rule 1 - Bug] `Request is not defined` in API route tests using jsdom environment**
- **Found during:** Task 2 — webhook-chat and chatbot-message test suites failed at runtime
- **Issue:** Default jest testEnvironment is `jsdom` (set in jest.config.ts). The jsdom environment does not provide the Web Fetch API globals (`Request`, `Response`). Next.js route handlers import and use `Request` directly.
- **Fix:** Added `/** @jest-environment node */` docblock to both API test files. Node 18+ provides `Request`/`Response` natively.
- **Files modified:** `__tests__/api/webhook-chat.test.ts`, `__tests__/api/chatbot-message.test.ts`
- **Committed in:** 93d8ddd (Task 2)

**3. [Rule 1 - Bug] Multi-line jest-environment docblock parsed as environment name**
- **Found during:** Task 2 — first attempt used multi-line `/** @jest-environment node\n * Description... */` which caused Jest to read the full comment text as the environment identifier
- **Fix:** Collapsed to single-line `/** @jest-environment node */`
- **Files modified:** Same two API test files
- **Committed in:** 93d8ddd (Task 2)

---

**Total deviations:** 3 auto-fixed bugs — all related to Jest mock/environment mechanics, not to the production code under test. No scope creep.

## Issues Encountered

None remaining — all 3 deviation patterns were resolved within the task execution.

## Known Stubs

The following test files still have `test.todo` stubs — these are OUT OF SCOPE for this plan (they belong to Phase 2 or other subsystems):

- `__tests__/api/webhook-voice.test.ts` — 10 todos (ElevenLabs voice webhook, Phase 2 scope)
- Various other `__tests__/` files with remaining todos not related to Phase 3 chatbot

All Phase 3 chatbot test files now have zero `test.todo` entries.

## Threat Surface Scan

Test files only — no production trust boundaries introduced. All test assertions verify security controls implemented in production code:
- maskIC() called before DB write (PDPA compliance)
- n8n webhook secret validation (auth boundary)
- hub.challenge verification (Meta webhook auth)
- wa_message_id in call insert (DB-level dedup)

No new threat surface introduced.

## Self-Check: PASSED

Verified:
- `mykasih-crm/__tests__/lib/meta-wa.test.ts` — FOUND, contains `type.*list` assertion (line 59: `expect(interactive['type']).toBe('list')`)
- `mykasih-crm/__tests__/lib/intent-classifier.test.ts` — FOUND, contains `jest.mock('@anthropic-ai/sdk'`, `claude-haiku-4-5-20251001`, `intent: 'unknown'` fallback tests, zero `test.todo`
- `mykasih-crm/__tests__/api/webhook-chat.test.ts` — FOUND, contains `hub.challenge` assertion, `toBe(403)`, `toBe(401)`, zero `test.todo`
- `mykasih-crm/__tests__/api/chatbot-message.test.ts` — FOUND, contains `toBe(401)`, `toBe(400)`, `first_contact`, zero `test.todo`
- `mykasih-crm/__tests__/lib/complaint-handler.test.ts` — FOUND, contains `maskIC`, `channel.*chat`/`'chat'`, `wa_message_id`, `generateTicketRef`, `expireSession`, zero `test.todo`
- Commit 7d95617 — FOUND
- Commit 93d8ddd — FOUND
- `npm test --passWithNoTests` — 16 suites passed, 50 tests passed, 0 failed

---
*Phase: 03-kasih-whatsapp-chatbot*
*Completed: 2026-04-12*
