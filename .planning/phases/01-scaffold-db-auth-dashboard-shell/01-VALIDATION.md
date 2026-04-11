---
phase: 1
slug: scaffold-db-auth-dashboard-shell
status: draft
nyquist_compliant: true
wave_0_complete: true
created: 2026-04-11
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | jest 29.x (Next.js integration via next/jest) |
| **Config file** | jest.config.ts (Wave 0 installs) |
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
| 1-00-01 | 00 | 0 | INFRA-01 | — | N/A | config | `cd mykasih-crm && npx jest --passWithNoTests` | W0 | pending |
| 1-00-02 | 00 | 0 | INFRA-02 | — | N/A | stubs | `cd mykasih-crm && npx jest --verbose` | W0 | pending |
| 1-01-01 | 01 | 1 | AGENT-01 | — | N/A | manual | `grep -c "tidak boleh dipindahkan" docs/SARA-PROMPT-PATCH.md` | W0 | pending |
| 1-01-02 | 01 | 1 | AGENT-02 | — | N/A | manual | `grep -c "Sure, I'll continue in English" docs/SARA-PROMPT-PATCH.md` | W0 | pending |
| 1-02-01 | 02 | 1 | INFRA-03 | — | N/A | config | `grep -c "accent-primary" mykasih-crm/app/globals.css` | W0 | pending |
| 1-02-02 | 02 | 1 | INFRA-05 | T-1-01 | getAll/setAll pattern | unit | `npm test -- --testPathPattern=auth` | W0 | pending |
| 1-03-01 | 03 | 2 | AUTH-01 | T-3-01 | getUser() used (not getSession()) | unit | `npm test -- --testPathPattern=auth` | W0 | pending |
| 1-03-02 | 03 | 2 | AUTH-02 | T-3-05 | Role-based redirect enforced | unit | `npm test -- --testPathPattern=middleware` | W0 | pending |
| 1-03-03 | 03 | 2 | DASH-04 | T-3-06 | users.language sync | unit | `npm test -- --testPathPattern=auth` | W0 | pending |
| 1-04-01 | 04 | 3 | DASH-01 | — | N/A | build | `cd mykasih-crm && npx next build` | W0 | pending |
| 1-05-01 | 05 | 3 | MERCH-01 | T-5-01 | Admin-only seed | unit | `npm test -- --passWithNoTests` | W0 | pending |
| 1-06-01 | 06 | 4 | DASH-05 | T-6-01 | Auth check on API | unit | `npm test -- --testPathPattern=dashboard` | W0 | pending |
| 1-08-01 | 08 | 4 | DASH-08 | — | N/A | unit | `npm test -- --testPathPattern=dashboard` | W0 | pending |
| 1-07-01 | 07 | 5 | INFRA-07 | T-7-01 | Admin-only seed | manual | Supabase dashboard verification + /api/seed/data 500 detection | W0 | pending |

*Status: pending / green / red / flaky*

---

## Wave 0 Requirements

- [x] `__tests__/auth.test.ts` — stubs for AUTH-01, AUTH-02, AUTH-03, AUTH-04
- [x] `__tests__/middleware.test.ts` — role redirect stubs
- [x] `__tests__/dashboard.test.ts` — stat card + chart render stubs
- [x] `jest.config.ts` — configured via Plan 01-00

*Install: handled by Plan 01-00 Task 1*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| SARA refuses IC transfer | AGENT-01 | ElevenLabs live voice session required | Open Testing Console -> Voice Agent tab -> attempt IC transfer phrase |
| SARA maintains English after language switch | AGENT-02 | ElevenLabs live voice session required | Switch language mid-call -> confirm agent stays English |
| Login error message display | AUTH-01 | Visual UI verification | Enter invalid credentials -> verify error appears below button |
| Role redirect (qmedia -> analytics) | AUTH-02 | Requires live Supabase session | Log in as qmedia user -> verify redirect to /analytics |
| Supabase schema + seed data | INFRA-07 | Requires Supabase dashboard | Run migrations + seed endpoint -> verify tables populated |

*All manual items require human tester with live Supabase + ElevenLabs credentials.*

---

## Permanent Manual-Only Justifications

| Requirement | Justification |
|-------------|---------------|
| INFRA-07 (all 6 tables with RLS) | Supabase schema creation requires live database credentials and SQL Editor access. Cannot be automated without provisioned Supabase CLI or live connection string, neither of which are available during plan execution. The seed endpoint (POST /api/seed/data) provides an indirect detection mechanism: if tables do not exist, the endpoint returns HTTP 500 with Supabase error "relation does not exist", giving clear signal that migrations need to be run. This is an acceptable risk — the human checkpoint in Plan 01-07 Task 2 explicitly gates on migration completion. |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references (Plan 01-00 created)
- [x] No watch-mode flags
- [x] Feedback latency < 30s
- [x] `nyquist_compliant: true` set in frontmatter
- [x] INFRA-07 permanent-manual justification documented

**Approval:** ready (pending Plan 01-00 execution)
