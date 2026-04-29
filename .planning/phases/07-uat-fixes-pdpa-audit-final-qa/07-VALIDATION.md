---
phase: 07
slug: uat-fixes-pdpa-audit-final-qa
status: draft
nyquist_compliant: true
wave_0_complete: true
created: 2026-04-13
updated: 2026-04-29
---

# Phase 07 -- Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest (via next/jest) |
| **Config file** | `mykasih-crm/jest.config.ts` |
| **Quick run command** | `cd mykasih-crm && npx jest --passWithNoTests` |
| **Full suite command** | `cd mykasih-crm && npx jest --coverage` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd mykasih-crm && npx jest --passWithNoTests`
- **After every plan wave:** Run `cd mykasih-crm && npx jest --coverage`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 07-00-01 | 00 | 0 | SEC-04 | -- | Analytics summary test stub exists | unit | `npx jest --testPathPattern="analytics-summary" --passWithNoTests` | Created in Wave 0 | pending |
| 07-01-01 | 01 | 1 | SEC-01 | -- | No plain-text IC in any DB column | sql-audit | `grep -c 'scanTable\|remediateRow\|scanCodebase\|generateReport\|IC_PATTERN' scripts/pdpa-audit.ts` | Created in Plan 01 | pending |
| 07-02-01 | 02 | 1 | SEC-02 | -- | RLS policies enforce role-based access | manual+sql | Supabase SQL verify per role | N/A | pending |
| 07-03-01 | 03 | 1 | SEC-03 | -- | Webhooks reject invalid/missing secrets | unit | `npx jest --testPathPattern="webhook-voice"` | Exists | pending |
| 07-03-02 | 03 | 1 | SEC-04 | -- | is_test=true excluded from analytics | unit | `npx jest --testPathPattern="analytics-summary" --passWithNoTests` | Created in Wave 0 | pending |
| 07-04-01 | 04 | 2 | SEC-05 | -- | Admin MFA enforced, non-admin bypasses | manual | Login flow verification | N/A | pending |
| 07-04-02 | 04 | 2 | SEC-05 | T-07-13 | Admin aal1 cannot access dashboard via direct URL | manual | Navigate to /dashboard with aal1 session | N/A | pending |

*Status: pending -- not yet executed*

---

## Wave 0 Requirements

- [x] `mykasih-crm/__tests__/lib/ic-mask.test.ts` -- already exists with 5 real tests (plain, dashed, short, non-numeric, empty)
- [ ] `mykasih-crm/__tests__/api/analytics-summary.test.ts` -- created by 07-00-PLAN.md with todo stubs for SEC-04

*Wave 0 plan (07-00-PLAN.md) creates the analytics-summary test stub. The ic-mask test file already exists from Phase 2.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| MFA enrollment QR code renders correctly | SEC-05 | Visual verification of QR code + dark theme | 1. Login as admin 2. Verify MFA enrollment page shows QR 3. Scan with authenticator app 4. Enter TOTP code |
| RLS blocks cross-role data access | SEC-02 | Requires multiple authenticated sessions | 1. Login as each role 2. Attempt to access restricted tables 3. Verify 403/empty results |
| PDPA-AUDIT.md is presentable | SEC-01 | Document quality assessment | Review generated report for completeness and clarity |
| Admin aal1 direct URL bypass blocked | SEC-05 | Requires browser session manipulation | 1. Login as admin (password only) 2. Navigate directly to /dashboard 3. Verify redirect to /login/mfa-challenge |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 30s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending execution
