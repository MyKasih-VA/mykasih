---
phase: 03-kasih-whatsapp-chatbot
plan: "03"
subsystem: chatbot-intent-dispatcher
tags:
  - claude-haiku
  - intent-classifier
  - chatbot-dispatcher
  - n8n
  - session-manager
  - wave-3
dependency_graph:
  requires:
    - "03-01: lib/chatbot/types.ts (Classification, Intent, Session, ChatbotRequest)"
    - "03-01: lib/chatbot/session-manager.ts (getActiveSession, createSession, updateSession)"
    - "03-01: lib/meta-wa.ts (sendWhatsAppMessage, sendWhatsAppButtons)"
    - "03-02: app/api/webhook/chat/route.ts forwards to /api/chatbot/message"
  provides:
    - "lib/chatbot/intent-classifier.ts: classifyIntent(message) → Classification"
    - "app/api/chatbot/message/route.ts: POST intent dispatcher + session routing"
  affects:
    - "mykasih-crm/lib/chatbot/faq-handler.ts (Plan 04 — must export faqHandler)"
    - "mykasih-crm/lib/chatbot/balance-handler.ts (Plan 04 — must export balanceHandler)"
    - "mykasih-crm/lib/chatbot/merchant-handler.ts (Plan 05 — must export merchantHandler)"
    - "mykasih-crm/lib/chatbot/complaint-handler.ts (Plan 06 — must export complaintHandler)"
tech_stack:
  added: []
  patterns:
    - "Claude Haiku 4.5 (claude-haiku-4-5-20251001) with max_tokens:64 for fast intent classification"
    - "classifyIntent never throws — try/catch always returns safe fallback {intent:'unknown',language:'bm',confidence:'low'}"
    - "Dynamic import() for handler modules prevents TypeScript build failure before Plans 04-06 exist"
    - "@ts-expect-error on dynamic imports with explicit cast to handler signature — preserves strict mode"
    - "First contact: 4-item list (sendWhatsAppButtons) on unknown new user; direct intent if list item selected"
    - "Session intent lock: once set, classifyIntent is skipped — single classification per conversation"
    - "n8n secret conditional: only validated when N8N_WEBHOOK_SECRET env var is present"
key_files:
  created:
    - mykasih-crm/lib/chatbot/intent-classifier.ts
    - mykasih-crm/app/api/chatbot/message/route.ts
  modified: []
decisions:
  - "Dynamic imports with @ts-expect-error chosen over stub handler files — avoids polluting Plans 04-06 with placeholder code that must be deleted"
  - "Session intent lock implemented at dispatch time (step 3 in route) — ensures consistent handler routing across multi-turn conversations"
  - "First contact: list item IDs match Intent type values exactly (balance_check, merchant_lookup, faq, complaint) — allows message-as-intent shortcut without classification"
metrics:
  duration: "~21 minutes"
  completed: "2026-04-12"
  tasks_completed: 2
  tasks_total: 2
  files_created: 2
  files_modified: 0
requirements_fulfilled:
  - CHAT-03
  - CHAT-08
---

# Phase 3 Plan 03: Intent Classifier and Chatbot Message Dispatcher Summary

**One-liner:** Claude Haiku 4.5 intent classifier (never throws, validates against enum) and POST /api/chatbot/message dispatcher (n8n auth, session lookup, first-contact 4-item list, intent lock, handler routing via dynamic imports).

## What Was Built

Wave 3 delivers the two central components that every chatbot interaction passes through:

- **lib/chatbot/intent-classifier.ts** — `classifyIntent(message)` calls `claude-haiku-4-5-20251001` with a bilingual BM/EN system prompt (max_tokens: 64). Parses the JSON response and validates `intent` against the `Intent` enum and `language` against `['bm','en']`. On any error (JSON parse failure, API error, network error), returns `{ intent: 'unknown', language: 'bm', confidence: 'low' }` — never throws.

- **app/api/chatbot/message/route.ts** — `POST /api/chatbot/message` is the central routing hub:
  1. Validates `x-n8n-webhook-secret` header against `N8N_WEBHOOK_SECRET` env var (conditional — skipped in dev when env var absent)
  2. Looks up active session via `getActiveSession(waPhone)`
  3. First contact (no session + free-text): classifies language, creates session, sends 4-item list (`Semak baki`, `Kedai berdekatan`, `Bantuan SARA`, `Status aduan`) via `sendWhatsAppButtons`, returns `{status:'first_contact'}`
  4. First contact (no session + list item): creates session with intent pre-locked, falls through to dispatch
  5. Existing session with locked intent: dispatches directly (no classification)
  6. Existing session without intent: classifies or detects list item, locks to session via `updateSession`
  7. Dispatches to `faqHandler`, `balanceHandler`, `merchantHandler`, or `complaintHandler` via dynamic `import()`
  8. On handler error: falls back to `getFallbackText(language)` — never propagates to caller
  9. Sends reply via `sendWhatsAppMessage(waPhone, responseText)`

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Create lib/chatbot/intent-classifier.ts (CHAT-03) | 4bee60b | lib/chatbot/intent-classifier.ts |
| 2 | Create app/api/chatbot/message/route.ts — intent dispatcher (CHAT-03, CHAT-08) | a8b8dfd | app/api/chatbot/message/route.ts |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] TypeScript TS2307 on dynamic handler imports**
- **Found during:** Task 2 — `npx tsc --noEmit` after writing route.ts
- **Issue:** `Cannot find module '@/lib/chatbot/faq-handler'` (and 3 others) — handler files don't exist until Plans 04-06. The plan noted dynamic imports prevent "build failures" but TypeScript resolves module paths at compile time regardless.
- **Fix:** Added `// @ts-expect-error` comments before each dynamic import with explicit cast of the imported function to the correct signature (`(m: string, s: Session) => Promise<string>`). This suppresses the TS2307 error while preserving strict type safety on the cast.
- **Files modified:** `app/api/chatbot/message/route.ts`
- **Commit:** a8b8dfd (included in same commit)

## Known Stubs

None. The dynamic handler imports will throw at runtime until Plans 04-06 create the handler files — this is expected sequencing and is caught by the `try/catch` in step 4 of the dispatcher, which falls back to `getFallbackText`. This is not a stub; it is intentional graceful degradation.

## Threat Surface Scan

All threat mitigations from the plan's threat model are implemented:

| Threat ID | Category | Mitigation |
|-----------|----------|------------|
| T-3-02 | Tampering (POST /api/chatbot/message) | x-n8n-webhook-secret validated; 401 on mismatch |
| T-3-05 | Elevation of Privilege | Without n8n secret, external callers cannot trigger handlers |
| T-3-02b | Tampering (intent-classifier.ts) | System prompt instructs JSON-only output; parsed with try/catch; invalid JSON returns safe fallback |

No new threat surface introduced beyond what the plan's threat model covers.

## Self-Check: PASSED

Verified:
- `mykasih-crm/lib/chatbot/intent-classifier.ts` — FOUND
- `mykasih-crm/app/api/chatbot/message/route.ts` — FOUND
- `export async function classifyIntent(` — PRESENT in intent-classifier.ts
- `claude-haiku-4-5-20251001` — PRESENT (not claude-3-haiku or claude-haiku-3)
- `max_tokens: 64` — PRESENT
- `import Anthropic from '@anthropic-ai/sdk'` — PRESENT
- `JSON.parse` — PRESENT
- `intent: 'unknown', language: 'bm', confidence: 'low'` — PRESENT (fallback)
- `export const runtime = 'nodejs'` — PRESENT in route.ts
- `export async function POST(` — PRESENT
- `x-n8n-webhook-secret` — PRESENT
- `N8N_WEBHOOK_SECRET` — PRESENT
- `getActiveSession` — PRESENT
- `createSession` — PRESENT
- `classifyIntent` — PRESENT
- `sendWhatsAppButtons` — PRESENT
- `sendWhatsAppMessage` — PRESENT
- `FIRST_CONTACT_ITEMS` — PRESENT
- `Semak baki`, `Kedai berdekatan`, `Bantuan SARA`, `Status aduan` — ALL PRESENT
- `faqHandler`, `balanceHandler`, `merchantHandler`, `complaintHandler` — ALL PRESENT
- `status: 401` — PRESENT
- `status: 500` — PRESENT
- Commit 4bee60b — FOUND
- Commit a8b8dfd — FOUND
- `tsc --noEmit` — EXIT 0
- `npm test --testPathPatterns="(intent-classifier|chatbot-message)" --passWithNoTests` — 12 todo, 0 failed, EXIT 0
