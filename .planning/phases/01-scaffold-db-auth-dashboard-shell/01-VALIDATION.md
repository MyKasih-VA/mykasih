---
phase: 1
slug: scaffold-db-auth-dashboard-shell
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-11
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | jest 29.x / vitest (Next.js 14) |
| **Config file** | jest.config.ts or vitest.config.ts (Wave 0 installs) |
| **Quick run command** | `npm test -- --passWithNoTests` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test -- --passWithNoTests`
- **After every plan wave:** Run `npm test`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 1-01-01 | 01 | 1 | INFRA-01 | — | N/A | manual | `ls next.config.ts tailwind.config.ts` | ✅ W0 | ⬜ pending |
| 1-01-02 | 01 | 1 | INFRA-02 | — | N/A | manual | `cat package.json \| grep supabase` | ✅ W0 | ⬜ pending |
| 1-02-01 | 02 | 1 | AUTH-01 | T-1-01 | getUser() used (not getSession()) for auth decisions | unit | `npm test -- --testPathPattern=auth` | ❌ W0 | ⬜ pending |
| 1-02-02 | 02 | 1 | AUTH-02 | T-1-01 | Role-based redirect enforced | unit | `npm test -- --testPathPattern=middleware` | ❌ W0 | ⬜ pending |
| 1-03-01 | 03 | 2 | DASH-01 | — | N/A | unit | `npm test -- --testPathPattern=dashboard` | ❌ W0 | ⬜ pending |
| 1-04-01 | 04 | 3 | MERCH-01 | — | N/A | manual | `node -e "const d=require('./data/merchants.json'); console.log(d.length)"` | ✅ W0 | ⬜ pending |
| 1-05-01 | 05 | 3 | AGENT-01 | — | IC transfer blocked | manual | ElevenLabs dashboard verification | ✅ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `__tests__/auth.test.ts` — stubs for AUTH-01, AUTH-02, AUTH-03, AUTH-04
- [ ] `__tests__/middleware.test.ts` — role redirect stubs
- [ ] `__tests__/dashboard.test.ts` — stat card + chart render stubs
- [ ] `jest.config.ts` or `vitest.config.ts` — if no framework detected

*Install: `npm install -D jest @testing-library/react @testing-library/jest-dom ts-jest` if needed*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| SARA refuses IC transfer | AGENT-01 | ElevenLabs live voice session required | Open Testing Console → Voice Agent tab → attempt IC transfer phrase |
| SARA maintains English after language switch | AGENT-02 | ElevenLabs live voice session required | Switch language mid-call → confirm agent stays English |
| Login error message display | AUTH-01 | Visual UI verification | Enter invalid credentials → verify error appears below button |
| Role redirect (qmedia → analytics) | AUTH-02 | Requires live Supabase session | Log in as qmedia user → verify redirect to /analytics |

*All manual items require human tester with live Supabase + ElevenLabs credentials.*

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
