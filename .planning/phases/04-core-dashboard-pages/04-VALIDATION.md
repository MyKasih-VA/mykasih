---
phase: 4
slug: core-dashboard-pages
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-12
---

# Phase 4 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest 30.3.0 + ts-jest 29.4.9 |
| **Config file** | `mykasih-crm/jest.config.ts` |
| **Quick run command** | `cd mykasih-crm && npx jest --testPathPattern="__tests__/api/beneficiaries" --passWithNoTests` |
| **Full suite command** | `cd mykasih-crm && npx jest --passWithNoTests` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd mykasih-crm && npx jest --passWithNoTests`
- **After every plan wave:** Run `cd mykasih-crm && npx jest --passWithNoTests`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 4-01-01 | 01 | 0 | PAGE-05 | T-4-01 | Beneficiaries API returns 401 if unauthenticated | unit | `cd mykasih-crm && npx jest --testPathPattern="api/beneficiaries" --passWithNoTests` | ❌ W0 | ⬜ pending |
| 4-01-02 | 01 | 0 | PAGE-01..05 | — | N/A | unit | `cd mykasih-crm && npx jest --passWithNoTests` | Partial | ⬜ pending |
| 4-02-01 | 02 | 1 | PAGE-01 | — | N/A | manual | Open /voice-calls; apply each filter; verify API params in Network tab | — | ⬜ pending |
| 4-02-02 | 02 | 1 | PAGE-02 | — | N/A | manual | Open /chat-messages; verify channel=chat filter; intent badge renders per category | — | ⬜ pending |
| 4-02-03 | 02 | 1 | PAGE-03 | — | N/A | manual | Open /all-interactions; toggle All/Voice/Chat; verify row counts change | — | ⬜ pending |
| 4-03-01 | 03 | 1 | PAGE-04 | T-4-02 | masked_ic always shown as 880512-**-**** | manual | Open /tickets; change card status; verify optimistic update + DB persistence | — | ⬜ pending |
| 4-04-01 | 04 | 1 | PAGE-05 | T-4-03 | No beneficiary list without search; search requires ≥2 chars | manual | Open /beneficiaries; verify blank state; search by WA number; verify profile | — | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `mykasih-crm/__tests__/api/beneficiaries.test.ts` — stubs for PAGE-05 (beneficiary search, 401 unauthenticated, 400 short query, successful results)

*Existing Jest infrastructure covers all other phase requirements. Only the beneficiaries API test is a new file gap.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Voice Calls filter bar — all 5 filters in one row | PAGE-01 | Client UI state; fetch mock tests provide limited value | Open /voice-calls in browser; confirm search + date + language + category + outcome dropdowns visible in single row |
| Chat Messages intent badge colors | PAGE-02 | CSS `color-mix()` rendering; not testable in jsdom | Open /chat-messages; verify each intent (balance_check, merchant_lookup, complaint, faq, unknown) renders correct pill color |
| All Interactions channel toggle | PAGE-03 | Filter UI state interaction | Toggle [All / Voice / Chat]; verify row counts change and ChannelBadge icons match |
| Kanban optimistic update + revert on error | PAGE-04 | Network simulation required | Change ticket status; verify card moves immediately; simulate 500 (DevTools offline); verify card reverts |
| Beneficiaries search-first layout | PAGE-05 | PDPA UX verification | Load /beneficiaries; confirm page is blank (no list); type 1 char; confirm no results; type 2+ chars; confirm search fires |
| TranscriptModal fetch on open only | PAGE-01 | Race condition verification | Open modal; check Network tab for single transcript request; close and reopen same call; confirm single request not duplicate |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
