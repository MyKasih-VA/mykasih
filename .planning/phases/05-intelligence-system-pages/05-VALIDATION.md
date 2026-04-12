---
phase: 5
slug: intelligence-system-pages
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-12
---

# Phase 5 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest (Next.js 15 + TypeScript) |
| **Config file** | vitest.config.ts |
| **Quick run command** | `npx vitest run --reporter=verbose` |
| **Full suite command** | `npx vitest run && npx tsc --noEmit` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run --reporter=verbose`
- **After every plan wave:** Run `npx vitest run && npx tsc --noEmit`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 05-01-01 | 01 | 1 | PAGE-06 | — | N/A | build | `npx tsc --noEmit` | ✅ | ⬜ pending |
| 05-01-02 | 01 | 1 | PAGE-06 | — | N/A | build | `npx tsc --noEmit` | ✅ | ⬜ pending |
| 05-01-03 | 01 | 1 | PAGE-06 | — | N/A | build | `npx tsc --noEmit` | ✅ | ⬜ pending |
| 05-02-01 | 02 | 1 | PAGE-07 | T-5-KB | Auth check before KB mutation | build | `npx tsc --noEmit` | ✅ | ⬜ pending |
| 05-02-02 | 02 | 1 | PAGE-07 | — | N/A | build | `npx tsc --noEmit` | ✅ | ⬜ pending |
| 05-03-01 | 03 | 2 | PAGE-08 | T-5-Admin | Admin role enforced before user ops | unit | `npx vitest run --reporter=verbose` | ⬜ W0 | ⬜ pending |
| 05-03-02 | 03 | 2 | PAGE-08 | T-5-Admin | Service role key not exposed to client | build | `npx tsc --noEmit` | ✅ | ⬜ pending |
| 05-04-01 | 04 | 2 | PAGE-09 | — | N/A | build | `npx tsc --noEmit` | ✅ | ⬜ pending |
| 05-05-01 | 05 | 2 | PAGE-10 | — | N/A | build | `npx tsc --noEmit` | ✅ | ⬜ pending |
| 05-05-02 | 05 | 2 | PAGE-10 | — | N/A | build | `npx tsc --noEmit` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `npx shadcn add calendar popover alert-dialog` — Shadcn components not yet installed
- [ ] `vitest.config.ts` — confirm vitest is configured (or install: `npm install -D vitest @vitejs/plugin-react`)
- [ ] `tests/phase05/staff-management.test.ts` — stubs for PAGE-08 admin role enforcement

*If none: "Existing infrastructure covers all phase requirements."*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Live Monitor auto-refreshes every 10s with real Supabase data | PAGE-10 | Real-time subscription behaviour requires live Supabase session | Open /live-monitor, check Network tab for 10s polling, confirm active sessions update without page reload |
| ElevenLabs KB sync PATCH succeeds with live agent | PAGE-07 | ElevenLabs API call requires live credentials and agent | Edit a KB entry, click Sync, check ElevenLabs dashboard for updated knowledge |
| Integrations page shows LIVE status (not mock) | PAGE-09 | Requires real external API health checks | Open /integrations with valid env vars, verify each card shows actual status |
| Anam AI demo embed loads in Testing Console tab 3 | PAGE-07+ | Requires browser and live Anam AI credentials | Open /testing, click Anam AI tab, confirm persona video loads |
| Analytics date range picker filters charts correctly | PAGE-06 | Requires real Supabase data across date range | Select a 7-day range, verify chart data updates and matches Supabase query |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
