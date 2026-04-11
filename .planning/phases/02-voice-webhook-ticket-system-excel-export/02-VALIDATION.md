---
phase: 2
slug: voice-webhook-ticket-system-excel-export
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-11
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest (existing — from Phase 1 scaffold) |
| **Config file** | `mykasih-crm/vitest.config.ts` or `package.json` vitest config |
| **Quick run command** | `cd mykasih-crm && npm run test -- --run` |
| **Full suite command** | `cd mykasih-crm && npm run test -- --run --coverage` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd mykasih-crm && npm run test -- --run`
- **After every plan wave:** Run `cd mykasih-crm && npm run test -- --run --coverage`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 20 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|--------|
| 2-01-01 | 01 | 0 | VOICE-01 | T-2-01 | HMAC-SHA256 validation rejects invalid signatures | unit | `npm run test -- --run webhook` | ⬜ pending |
| 2-01-02 | 01 | 0 | VOICE-01 | T-2-01 | Returns 401 on invalid sig, 200 on all other errors | unit | `npm run test -- --run webhook` | ⬜ pending |
| 2-02-01 | 02 | 1 | VOICE-02 | — | N/A | unit | `npm run test -- --run transcript` | ⬜ pending |
| 2-03-01 | 03 | 1 | VOICE-03 | — | N/A | unit | `npm run test -- --run ticket` | ⬜ pending |
| 2-04-01 | 04 | 1 | VOICE-04 | T-2-02 | IC is never stored in plain text | unit | `npm run test -- --run ic-mask` | ⬜ pending |
| 2-05-01 | 05 | 1 | VOICE-05 | — | N/A | unit | `npm run test -- --run ticket-ref` | ⬜ pending |
| 2-06-01 | 06 | 1 | VOICE-06 | T-2-03 | Role guard rejects non-admin/qmedia | unit | `npm run test -- --run calls` | ⬜ pending |
| 2-07-01 | 07 | 2 | EXPORT-01 | T-2-03 | Role guard rejects non-admin/qmedia | unit | `npm run test -- --run export` | ⬜ pending |
| 2-07-02 | 07 | 2 | EXPORT-02 | — | N/A | unit | `npm run test -- --run export` | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `mykasih-crm/__tests__/webhook-voice.test.ts` — stubs for VOICE-01 (signature validation, payload parsing)
- [ ] `mykasih-crm/__tests__/ic-mask.test.ts` — stubs for VOICE-05 (IC masking utility)
- [ ] `mykasih-crm/__tests__/ticket-ref.test.ts` — stubs for VOICE-04 (reference number generation)
- [ ] `mykasih-crm/__tests__/export-calls.test.ts` — stubs for EXPORT-01, EXPORT-02 (role guard, sheet structure)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Real ElevenLabs webhook fires and is received | VOICE-01 | Requires live ElevenLabs agent + network | Trigger a test call via Testing Console; confirm record in Supabase |
| XLSX file opens in Excel with correct 3 sheets | EXPORT-01 | Binary file format visual check | Download via /api/export/calls; open in Excel/LibreOffice |
| Webhook auto-disable prevention (always return 200) | VOICE-01 | Requires simulated DB failure scenario | Mock DB failure; confirm 200 returned with error body |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 20s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
