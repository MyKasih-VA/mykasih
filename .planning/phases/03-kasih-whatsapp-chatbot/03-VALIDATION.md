---
phase: 3
slug: kasih-whatsapp-chatbot
status: draft
nyquist_compliant: false
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
| **Quick run command** | `npx jest --testPathPattern="phase-03" --passWithNoTests` |
| **Full suite command** | `npx jest --coverage --passWithNoTests` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx jest --testPathPattern="phase-03" --passWithNoTests`
- **After every plan wave:** Run `npx jest --coverage --passWithNoTests`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 3-00-01 | 00 | 0 | CHAT-01 | — | N/A | stub | `npx jest tests/phase-03/webhook-chat.test.ts --passWithNoTests` | ❌ W0 | ⬜ pending |
| 3-00-02 | 00 | 0 | CHAT-02 | — | N/A | stub | `npx jest tests/phase-03/chatbot-message.test.ts --passWithNoTests` | ❌ W0 | ⬜ pending |
| 3-00-03 | 00 | 0 | CHAT-04 | — | N/A | stub | `npx jest tests/phase-03/merchant-lookup.test.ts --passWithNoTests` | ❌ W0 | ⬜ pending |
| 3-00-04 | 00 | 0 | CHAT-05 | — | IC never plain text | stub | `npx jest tests/phase-03/ic-mask.test.ts --passWithNoTests` | ❌ W0 | ⬜ pending |
| 3-00-05 | 00 | 0 | CHAT-06 | — | N/A | stub | `npx jest tests/phase-03/ticket-creation.test.ts --passWithNoTests` | ❌ W0 | ⬜ pending |
| 3-01-01 | 01 | 1 | CHAT-01 | T-3-01 | Sessions schema stores no plain IC | unit | `npx jest tests/phase-03/meta-wa.test.ts` | ❌ W0 | ⬜ pending |
| 3-02-01 | 02 | 1 | CHAT-01 | T-3-02 | Webhook verify returns hub.challenge | unit | `npx jest tests/phase-03/webhook-chat.test.ts` | ❌ W0 | ⬜ pending |
| 3-02-02 | 02 | 1 | CHAT-02 | T-3-02 | HMAC signature validated before processing | unit | `npx jest tests/phase-03/webhook-chat.test.ts` | ❌ W0 | ⬜ pending |
| 3-03-01 | 03 | 2 | CHAT-03 | T-3-03 | Intent classification returns valid enum | unit | `npx jest tests/phase-03/chatbot-message.test.ts` | ❌ W0 | ⬜ pending |
| 3-04-01 | 04 | 2 | CHAT-04 | — | Merchant lookup returns max 5 results | unit | `npx jest tests/phase-03/merchant-lookup.test.ts` | ❌ W0 | ⬜ pending |
| 3-05-01 | 05 | 2 | CHAT-05 | T-3-05 | IC masked before any Supabase write | unit | `npx jest tests/phase-03/ic-mask.test.ts` | ❌ W0 | ⬜ pending |
| 3-06-01 | 06 | 2 | CHAT-06 | T-3-06 | Ticket ref format TKT-YYYY-NNNNN | unit | `npx jest tests/phase-03/ticket-creation.test.ts` | ❌ W0 | ⬜ pending |
| 3-07-01 | 07 | 3 | CHAT-07 | — | calls.channel='chat' on every write | unit | `npx jest tests/phase-03/chat-persistence.test.ts` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/phase-03/webhook-chat.test.ts` — stubs for CHAT-01, CHAT-02
- [ ] `tests/phase-03/chatbot-message.test.ts` — stubs for CHAT-03
- [ ] `tests/phase-03/merchant-lookup.test.ts` — stubs for CHAT-04
- [ ] `tests/phase-03/ic-mask.test.ts` — stubs for CHAT-05 (IC masking)
- [ ] `tests/phase-03/ticket-creation.test.ts` — stubs for CHAT-06
- [ ] `tests/phase-03/chat-persistence.test.ts` — stubs for CHAT-07
- [ ] `tests/phase-03/meta-wa.test.ts` — stubs for lib/meta-wa.ts helpers
- [ ] `jest.config.ts` + `@types/jest` — if not already present

*All phase behaviors requiring automated verification depend on Wave 0 stubs.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Meta webhook GET verification via Meta dashboard | CHAT-01 | Requires live Meta account + public URL | Deploy to Vercel preview, register webhook URL in Meta App Console, verify green checkmark |
| WhatsApp list message renders 4 buttons correctly | CHAT-02 | Requires real WhatsApp device | Send test message from Meta test number, verify list opens with 4 options |
| End-to-end complaint flow on real device | CHAT-06 | Multi-turn session requires live WA | Complete complaint flow manually, verify TKT ref received on phone |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
