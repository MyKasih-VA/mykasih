---
phase: 03-kasih-whatsapp-chatbot
plan: "04"
subsystem: chatbot-faq-merchant-handlers
tags:
  - faq-handler
  - merchant-handler
  - supabase-service-role
  - kb-entries
  - merchant-lookup
  - wave-4
dependency_graph:
  requires:
    - "03-01: lib/chatbot/types.ts (Session, Language)"
    - "03-01: lib/chatbot/session-manager.ts (updateSession, expireSession)"
    - "03-01: lib/merchant-lookup.ts (Merchant interface, cookie-based lookups)"
    - "03-03: app/api/chatbot/message/route.ts (dispatcher that imports handlers)"
  provides:
    - "lib/chatbot/faq-handler.ts: faqHandler(message, session, wamid?) → string"
    - "lib/chatbot/merchant-handler.ts: merchantHandler(message, session, wamid?) → string"
    - "lib/merchant-lookup.ts: lookupByPostcodeServiceRole, lookupByStateServiceRole"
  affects:
    - "app/api/chatbot/message/route.ts (removed @ts-expect-error for resolved handler imports)"
    - "mykasih-crm/lib/chatbot/balance-handler.ts (Plan 05 — must export balanceHandler)"
    - "mykasih-crm/lib/chatbot/complaint-handler.ts (Plan 06 — must export complaintHandler)"
tech_stack:
  added: []
  patterns:
    - "Service-role Supabase client in API route handlers — avoids cookie context requirement"
    - "FAQ handler: keyword split on whitespace, ilike per keyword, first match wins, general fallback"
    - "Merchant handler: /^\\d{4,5}$/ regex to detect postcode vs state/city text"
    - "Both handlers save call+transcript + expire session on completion (single/two-turn)"
    - "wamid passed from dispatcher through to all handlers for call-level dedup at DB"
    - "Dynamic @ts-expect-error directives removed when handler files materialise — strict mode preserved"
key_files:
  created:
    - mykasih-crm/lib/chatbot/faq-handler.ts
    - mykasih-crm/lib/chatbot/merchant-handler.ts
  modified:
    - mykasih-crm/lib/merchant-lookup.ts
    - mykasih-crm/app/api/chatbot/message/route.ts
decisions:
  - "Service-role variants added to merchant-lookup.ts rather than inlining Supabase queries in handlers — reuses tested query logic, preserves DRY"
  - "wamid forwarded from dispatcher to all handlers (not just faq/merchant) — ensures dedup works uniformly when other handlers are created"
  - "FAQ keyword search: split message on whitespace, filter words >2 chars, ilike each against question field — balances simplicity with recall for BM/EN mixed queries"
metrics:
  duration: "~6 minutes"
  completed: "2026-04-12"
  tasks_completed: 2
  tasks_total: 2
  files_created: 2
  files_modified: 2
requirements_fulfilled:
  - CHAT-04
  - CHAT-06
---

# Phase 3 Plan 04: FAQ Handler and Merchant Lookup Handler Summary

**One-liner:** Service-role Supabase FAQ handler (keyword-match kb_entries, BM/EN answer, expire session) and 2-step merchant handler (postcode regex vs state/city text, lookupByPostcodeServiceRole/lookupByStateServiceRole, top 5 formatted results) — both save call+transcript with wa_message_id for dedup.

## What Was Built

Wave 4 delivers the two simplest intent handlers, validating the handler pattern before multi-turn flows:

- **lib/merchant-lookup.ts** — Extended with `lookupByPostcodeServiceRole` and `lookupByStateServiceRole`. These mirror the existing cookie-based `lookupByPostcode`/`lookupByState` but use `@supabase/supabase-js` `createClient` with `SUPABASE_SERVICE_ROLE_KEY` directly, making them safe to call from webhook API routes that have no browser cookie context. Original functions unchanged.

- **lib/chatbot/faq-handler.ts** — `faqHandler(message, session, wamid?)` is single-turn:
  1. Splits user message into keywords (words >2 chars), iterates `ilike` against `question_bm` or `question_en` (based on `session.language`) with `is_active=true` — first match wins
  2. Falls back to a `category='general'` entry if no keyword match
  3. Inserts call record (`channel='chat'`, `category='faq'`, `wa_message_id`, `outcome='resolved'|'abandoned'`) and transcript (user + bot turns)
  4. Calls `expireSession` — session closed after single answer
  5. Returns the matched answer or a bilingual helpline redirect string

- **lib/chatbot/merchant-handler.ts** — `merchantHandler(message, session, wamid?)` is 2-step:
  - **Step 0:** `updateSession` to lock intent + advance to step 1, returns bilingual location prompt
  - **Step 1:** Regex `/^\d{4,5}$/` to detect postcode vs state/city text → calls `lookupByPostcodeServiceRole` or `lookupByStateServiceRole` from `lib/merchant-lookup.ts` (no inline queries). Inserts call record (`category='merchant_lookup'`, `message_count=2`) + transcript. Calls `expireSession`. Returns top 5 formatted merchant list or a "none found" fallback.

- **app/api/chatbot/message/route.ts** — Removed the two `@ts-expect-error` directives for `faq` and `merchant_lookup` cases (now resolved), replaced casted dynamic imports with direct typed calls. Also wired `wamid` through to all four handler calls (previously only `void wamid` was used).

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Add service-role lookup functions + create faq-handler.ts (CHAT-04) | 303c515 | lib/merchant-lookup.ts, lib/chatbot/faq-handler.ts, app/api/chatbot/message/route.ts |
| 2 | Create lib/chatbot/merchant-handler.ts using lookupByPostcodeServiceRole (CHAT-06) | c1a4fac | lib/chatbot/merchant-handler.ts, app/api/chatbot/message/route.ts |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Unused @ts-expect-error directives after handler files created**
- **Found during:** Task 1 — `npx tsc --noEmit` after creating faq-handler.ts returned `TS2578: Unused '@ts-expect-error' directive` on line 92 of route.ts
- **Issue:** The 03-03 plan added `@ts-expect-error` on all four handler dynamic imports to suppress TS2307 (module not found). Once faq-handler.ts (Task 1) and merchant-handler.ts (Task 2) existed, their directives became invalid under strict TypeScript.
- **Fix:** Removed `@ts-expect-error` for `faq` (Task 1) and `merchant_lookup` (Task 2) cases. Replaced casted dynamic import patterns with direct typed calls (`await faqHandler(...)`, `await merchantHandler(...)`). The two remaining directives (`balance_check`, `complaint`) are still valid until Plans 05-06.
- **Files modified:** `app/api/chatbot/message/route.ts`
- **Commits:** 303c515, c1a4fac

**2. [Rule 2 - Missing critical functionality] wamid not forwarded to handlers**
- **Found during:** Task 1 — reading route.ts revealed `void wamid` (suppression) rather than passing wamid to handlers
- **Issue:** The dispatcher received `wamid` from the request body but discarded it. Without forwarding, call records in all handlers would always have `wa_message_id=null`, defeating the DB-level dedup established by the sessions migration (UNIQUE constraint on `calls.wa_message_id`).
- **Fix:** Removed `void wamid` and passed `wamid` as third argument to all four handler calls (faq, balance_check, merchant_lookup, complaint).
- **Files modified:** `app/api/chatbot/message/route.ts`
- **Commit:** 303c515

## Known Stubs

None. Both handlers query real Supabase tables (`kb_entries`, `merchants`). The kb_entries table may have no seed data in development, causing FAQ to always return the fallback string — this is expected behaviour, not a stub.

## Threat Surface Scan

All threat mitigations from the plan's threat model are implemented:

| Threat ID | Category | Mitigation |
|-----------|----------|------------|
| T-3-02 | Tampering (faq-handler.ts) | User message used in `ilike` — Supabase client auto-parameterizes; no raw SQL |
| T-3-02b | Tampering (merchant-handler.ts) | Postcode regex-validated before query; text input goes through ilike (parameterized) via merchant-lookup.ts |
| T-3-03 | Information Disclosure | No IC data handled in FAQ or merchant flows |

No new threat surface introduced beyond what the plan's threat model covers.

## Self-Check: PASSED

Verified:
- `mykasih-crm/lib/merchant-lookup.ts` — FOUND
- `mykasih-crm/lib/chatbot/faq-handler.ts` — FOUND
- `mykasih-crm/lib/chatbot/merchant-handler.ts` — FOUND
- `export async function lookupByPostcodeServiceRole(` — PRESENT in merchant-lookup.ts
- `export async function lookupByStateServiceRole(` — PRESENT in merchant-lookup.ts
- `SUPABASE_SERVICE_ROLE_KEY` — PRESENT in merchant-lookup.ts
- `export async function lookupByPostcode(` — STILL PRESENT (unchanged) in merchant-lookup.ts
- `export async function faqHandler(` — PRESENT
- `from('kb_entries')` — PRESENT in faq-handler.ts
- `is_active`, true` — PRESENT in faq-handler.ts
- `answer_bm` and `answer_en` — BOTH PRESENT in faq-handler.ts
- `channel: 'chat'` — PRESENT in faq-handler.ts
- `wa_message_id` — PRESENT in faq-handler.ts
- `category: 'faq'` — PRESENT in faq-handler.ts
- `expireSession` — PRESENT in faq-handler.ts
- `export async function merchantHandler(` — PRESENT
- `import { lookupByPostcodeServiceRole, lookupByStateServiceRole } from '@/lib/merchant-lookup'` — PRESENT
- `from('merchants')` — NOT PRESENT in merchant-handler.ts (uses imported lookup functions)
- `channel: 'chat'` — PRESENT in merchant-handler.ts
- `wa_message_id` — PRESENT in merchant-handler.ts
- `category: 'merchant_lookup'` — PRESENT in merchant-handler.ts
- `expireSession` — PRESENT in merchant-handler.ts
- `tsc --noEmit` — EXIT 0
- `npm test --testPathPatterns="merchant|faq" --passWithNoTests` — 9 todo, 0 failed, EXIT 0
- Commit 303c515 — FOUND
- Commit c1a4fac — FOUND
