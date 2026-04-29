---
phase: 6
slug: testing-console-ai-demo-settings-polish
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-12
---

# Phase 6 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | jest 29.x / React Testing Library |
| **Config file** | jest.config.ts |
| **Quick run command** | `npm run test -- --passWithNoTests` |
| **Full suite command** | `npm run test` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run test -- --passWithNoTests`
- **After every plan wave:** Run `npm run test`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 60 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 6-01-01 | 01 | 0 | TEST-01 | — | is_test=true on voice test calls | unit | `npm run test -- --testPathPattern=VoiceAgentTab` | ❌ W0 | ⬜ pending |
| 6-01-02 | 01 | 1 | TEST-01 | — | ElevenLabs session starts, tags call | integration | `npm run test -- --testPathPattern=VoiceAgentTab` | ❌ W0 | ⬜ pending |
| 6-02-01 | 02 | 1 | TEST-02 | — | Chat simulator shows intent badges | unit | `npm run test -- --testPathPattern=ChatbotSimTab` | ❌ W0 | ⬜ pending |
| 6-03-01 | 03 | 1 | TEST-03 | — | Anam AI renders in Tab 3 and /demo | manual | — | N/A | ⬜ pending |
| 6-04-01 | 04 | 1 | TEST-04 | — | Settings save to Supabase | unit | `npm run test -- --testPathPattern=settings` | ❌ W0 | ⬜ pending |
| 6-05-01 | 05 | 0 | TEST-06 | — | Translation keys exist for all Phase 6 pages | unit | `npm run test -- --testPathPattern=translations` | ❌ W0 | ⬜ pending |
| 6-05-02 | 05 | 2 | TEST-05 | — | Language toggle relabels all UI | manual | — | N/A | ⬜ pending |
| 6-06-01 | 06 | 0 | — | — | /demo accessible without auth | integration | `npm run build` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `__tests__/VoiceAgentTab.test.tsx` — stubs for TEST-01
- [ ] `__tests__/ChatbotSimTab.test.tsx` — stubs for TEST-02
- [ ] `__tests__/settings.test.ts` — stubs for TEST-04
- [ ] `__tests__/translations.test.ts` — stubs for TEST-06
- [ ] `@elevenlabs/react` installed — required for VoiceAgentTab
- [ ] Translation keys added to `lib/translations.ts` before page implementation

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Anam AI persona renders in Tab 3 and /demo | TEST-03 | Web component (custom element) — jsdom cannot load @anam-ai/agent-widget | Open /testing, click Tab 3; open /demo — confirm video avatar renders |
| Language toggle relabels all sidebar/page UI | TEST-05 | Global state mutation across multiple components | Toggle language in topbar on Dashboard; verify sidebar items, page title, table headers switch language |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 60s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
