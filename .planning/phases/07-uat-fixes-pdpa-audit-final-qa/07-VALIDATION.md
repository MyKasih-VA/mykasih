---
phase: 07
slug: uat-fixes-pdpa-audit-final-qa
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-13
---

# Phase 07 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest / Supabase SQL checks |
| **Config file** | `mykasih-crm/vitest.config.ts` or "none — Wave 0 installs" |
| **Quick run command** | `cd mykasih-crm && npx vitest run --reporter=verbose` |
| **Full suite command** | `cd mykasih-crm && npx vitest run` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd mykasih-crm && npx vitest run --reporter=verbose`
- **After every plan wave:** Run `cd mykasih-crm && npx vitest run`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 07-01-01 | 01 | 1 | SEC-01 | — | No plain-text IC in any DB column | sql-audit | `psql -c "SELECT ... WHERE col ~ '\\d{6}-?\\d{2}-?\\d{4}'"` | ❌ W0 | ⬜ pending |
| 07-02-01 | 02 | 1 | SEC-02 | — | RLS policies enforce role-based access | manual+sql | Supabase SQL verify per role | ❌ W0 | ⬜ pending |
| 07-03-01 | 03 | 1 | SEC-03 | — | Webhooks reject invalid/missing secrets | unit | `vitest run webhook` | ❌ W0 | ⬜ pending |
| 07-04-01 | 04 | 1 | SEC-04 | — | is_test=true excluded from analytics | unit | `vitest run analytics` | ❌ W0 | ⬜ pending |
| 07-05-01 | 05 | 2 | SEC-05 | — | Admin MFA enforced, non-admin bypasses | manual | Login flow verification | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] Verify vitest is installed in mykasih-crm
- [ ] SQL audit script for IC number scanning across all tables
- [ ] RLS policy verification queries per role

*If none: "Existing infrastructure covers all phase requirements."*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| MFA enrollment QR code renders correctly | SEC-05 | Visual verification of QR code + dark theme | 1. Login as admin 2. Verify MFA enrollment page shows QR 3. Scan with authenticator app 4. Enter TOTP code |
| RLS blocks cross-role data access | SEC-02 | Requires multiple authenticated sessions | 1. Login as each role 2. Attempt to access restricted tables 3. Verify 403/empty results |
| PDPA-AUDIT.md is presentable | SEC-01 | Document quality assessment | Review generated report for completeness and clarity |

*If none: "All phase behaviors have automated verification."*

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
