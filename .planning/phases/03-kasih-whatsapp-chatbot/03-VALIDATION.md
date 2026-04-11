---
phase: 3
slug: kasih-whatsapp-chatbot
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-04-11
---

# Phase 3 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | jest 29.x + ts-jest |
| **Config file** | jest.config.ts (Wave 0 creates if missing) |
| **Quick run command** | `cd mykasih-crm && npx jest --passWithNoTests` |
| **Full suite command** | `cd mykasih-crm && npx jest --coverage --passWithNoTests` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd mykasih-crm && npx jest --passWithNoTests`
- **After every plan wave:** Run `cd mykasih-crm && npx jest --coverage --passWithNoTests`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 3-00-01 | 00 | 0 | CHAT-01 | — | N/A | stub | `cd mykasih-crm && npx jest __tests__/api/webhook-chat.test.ts --passWithNoTests` | W0 | pending |
| 3-00-02 | 00 | 0 | CHAT-02 | — | N/A | stub | `cd mykasih-crm && npx jest __tests__/api/chatbot-message.test.ts --passWithNoTests` | W0 | pending |
| 3-00-03 | 00 | 0 | CHAT-04 | — | N/A | stub | `cd mykasih-crm && npx jest __tests__/lib/merchant-handler.test.ts --passWithNoTests` | W0 | pending |
| 3-00-04 | 00 | 0 | CHAT-05 | — | IC never plain text | stub | `cd mykasih-crm && npx jest __tests__/lib/balance-handler.test.ts --passWithNoTests` | W0 | pending |
| 3-00-05 | 00 | 0 | CHAT-06 | — | N/A | stub | `cd mykasih-crm && npx jest __tests__/lib/complaint-handler.test.ts --passWithNoTests` | W0 | pending |
| 3-00-06 | 00 | 0 | CHAT-08 | — | N/A | stub | `cd mykasih-crm && npx jest __tests__/lib/meta-wa.test.ts --passWithNoTests` | W0 | pending |
| 3-00-07 | 00 | 0 | CHAT-03 | — | N/A | stub | `cd mykasih-crm && npx jest __tests__/lib/intent-classifier.test.ts --passWithNoTests` | W0 | pending |
| 3-01-01 | 01 | 1 | CHAT-08 | T-3-01 | Sessions schema stores no plain IC | unit | `cd mykasih-crm && npm test -- --testPathPattern="meta-wa\|session-manager" --passWithNoTests` | W0 | pending |
| 3-02-01 | 02 | 2 | CHAT-01 | T-3-02 | Webhook verify returns hub.challenge | unit | `cd mykasih-crm && npm test -- --testPathPattern="webhook-chat" --passWithNoTests` | W0 | pending |
| 3-02-02 | 02 | 2 | CHAT-02 | T-3-02 | HMAC signature validated before processing | unit | `cd mykasih-crm && npm test -- --testPathPattern="webhook-chat" --passWithNoTests` | W0 | pending |
| 3-03-01 | 03 | 3 | CHAT-03 | T-3-03 | Intent classification returns valid enum | unit | `cd mykasih-crm && npm test -- --testPathPattern="intent-classifier\|chatbot-message" --passWithNoTests` | W0 | pending |
| 3-04-01 | 04 | 4 | CHAT-04 | — | Merchant lookup uses lib/merchant-lookup.ts | unit | `cd mykasih-crm && npm test -- --testPathPattern="merchant\|faq" --passWithNoTests` | W0 | pending |
| 3-05-01 | 05 | 4 | CHAT-05 | T-3-05 | IC masked before any Supabase write | unit | `cd mykasih-crm && npm test -- --testPathPattern="ic-mask\|balance" --passWithNoTests` | W0 | pending |
| 3-06-01 | 06 | 5 | CHAT-07 | T-3-06 | Ticket ref format TKT-YYYY-NNNNN | unit | `cd mykasih-crm && npm test -- --testPathPattern="ticket\|complaint" --passWithNoTests` | W0 | pending |
| 3-07-01 | 07 | 6 | CHAT-07 | — | calls.channel='chat' on every write, wa_message_id included | unit | `cd mykasih-crm && npm test -- --passWithNoTests` | W0 | pending |

*Status: pending | green | red | flaky*

---

## Wave 0 Requirements

- [ ] `mykasih-crm/__tests__/api/webhook-chat.test.ts` — stubs for CHAT-01, CHAT-02
- [ ] `mykasih-crm/__tests__/api/chatbot-message.test.ts` — stubs for CHAT-03
- [ ] `mykasih-crm/__tests__/lib/merchant-handler.test.ts` — stubs for CHAT-04
- [ ] `mykasih-crm/__tests__/lib/balance-handler.test.ts` — stubs for CHAT-05 (IC masking)
- [ ] `mykasih-crm/__tests__/lib/complaint-handler.test.ts` — stubs for CHAT-06, CHAT-07
- [ ] `mykasih-crm/__tests__/lib/meta-wa.test.ts` — stubs for CHAT-08, CHAT-10
- [ ] `mykasih-crm/__tests__/lib/intent-classifier.test.ts` — stubs for CHAT-03
- [ ] `mykasih-crm/__tests__/lib/session-manager.test.ts` — stubs for session CRUD
- [ ] `mykasih-crm/__tests__/lib/faq-handler.test.ts` — stubs for CHAT-04 FAQ
- [ ] `jest.config.ts` + `@types/jest` — if not already present

*All phase behaviors requiring automated verification depend on Wave 0 stubs.*

---

## Nyquist Compliance

Every implementation plan (03-01 through 03-06) includes `npm test -- --testPathPattern="<module>"` in its `<verify>` blocks alongside `tsc --noEmit`. This ensures Wave 0 test stubs are exercised during every task commit, not just in the final Wave 6 test plan (03-07).

| Plan | Verify includes npm test | Test pattern |
|------|--------------------------|--------------|
| 03-01 | Yes | `meta-wa\|session-manager` |
| 03-02 | Yes | `webhook-chat` |
| 03-03 | Yes | `intent-classifier\|chatbot-message` |
| 03-04 | Yes | `merchant\|faq` |
| 03-05 | Yes | `ic-mask\|balance` |
| 03-06 | Yes | `ticket\|complaint` |
| 03-07 | Yes | Full suite (all tests) |

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Meta webhook GET verification via Meta dashboard | CHAT-01 | Requires live Meta account + public URL | Deploy to Vercel preview, register webhook URL in Meta App Console, verify green checkmark |
| WhatsApp list message renders 4 buttons correctly | CHAT-02 | Requires real WhatsApp device | Send test message from Meta test number, verify list opens with 4 options |
| End-to-end complaint flow on real device | CHAT-06 | Multi-turn session requires live WA | Complete complaint flow manually, verify TKT ref received on phone |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 15s
- [x] `nyquist_compliant: true` set in frontmatter
- [x] All implementation plans (03-01 through 03-06) run npm test in verify blocks
- [x] Test paths match actual `mykasih-crm/__tests__/` structure
- [x] Wave numbers align with actual plan waves (0-6)

**Approval:** ready for execution
