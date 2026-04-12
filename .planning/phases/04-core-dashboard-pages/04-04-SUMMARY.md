---
phase: 04-core-dashboard-pages
plan: "04"
subsystem: beneficiaries-page
tags: [beneficiaries, search, profile, pdpa, table, modal]
dependency_graph:
  requires:
    - "04-01 (TranscriptModal, ChannelBadge, CallsTable shared helpers, translations)"
  provides:
    - BeneficiaryProfile component (profile header + interaction history + ticket history)
    - Beneficiaries page (search-first, PDPA-safe, min 2-char guard)
  affects:
    - "app/(dashboard)/beneficiaries/page.tsx — stub replaced with full implementation"
tech_stack:
  added: []
  patterns:
    - search-first blank page pattern — no data visible until staff submits query
    - 2-char minimum guard on client before firing fetch
    - imports getOutcomeBadgeStyle/formatCategory/formatRelativeTime from CallsTable.tsx exports
    - ticket status badge reuses color-mix pattern (resolved=green, in_progress=yellow, open=red)
    - font-mono for reference_no and masked_ic fields
key_files:
  created:
    - mykasih-crm/components/beneficiaries/BeneficiaryProfile.tsx
  modified:
    - mykasih-crm/app/(dashboard)/beneficiaries/page.tsx (stub replaced)
decisions:
  - "BeneficiaryProfile imports getOutcomeBadgeStyle/formatCategory/formatRelativeTime from CallsTable.tsx — avoids duplicating helpers, stays consistent with Phase 04 pattern"
  - "Ticket status badge uses separate getTicketStatusStyle function — ticket statuses (open/in_progress/resolved) differ from call outcomes; avoids coupling to call outcome logic"
  - "onCallClick callback passed into BeneficiaryProfile — keeps TranscriptModal state in the page, not the profile component (single source of truth for modal)"
metrics:
  duration: "~8 minutes"
  completed: "2026-04-12"
  tasks_completed: 1
  files_changed: 2
---

# Phase 04 Plan 04: Beneficiaries Page Summary

**One-liner:** Search-first PDPA-safe beneficiaries lookup page with BeneficiaryProfile component showing profile header, interaction history table (with ChannelBadge + TranscriptModal), and ticket history table (with masked IC in font-mono).

---

## What Was Built

### Task 1: BeneficiaryProfile component + Beneficiaries page (PAGE-05, D-10, D-11, D-12)

**BeneficiaryProfile.tsx** — new component at `components/beneficiaries/`:
- Profile header card: 40px circle avatar (`bg-[var(--accent-primary)]`) with initial letter, name, WA number, last-seen relative time
- Interaction History table: Channel (ChannelBadge) | Category | Outcome (badge) | Dur/Msgs | Time — row click fires `onCallClick`
- Ticket History table: Ref No. (`font-mono`) | Category | IC masked (`font-mono text-muted`) | Status badge | Time
- Empty states for both tables: `Inbox` icon + text centered `py-8`
- Exports: `BeneficiaryProfile`, `BeneficiaryCall`, `BeneficiaryTicket` types

**app/(dashboard)/beneficiaries/page.tsx** — stub replaced:
- `'use client'` page with `useLanguage()`
- Search-first: blank page with centered search panel (`min-h-[40vh]`) before first search
- After search: panel compresses to top, results area shows profile or no-results state
- 2-char minimum guard: `trimmed.length < 2` blocks fetch before firing
- Search on button click or Enter key
- Button shows `Search` icon idle, `Loader2 animate-spin` while loading
- No-results: `UserX` icon + bilingual heading + body text
- Results: `BeneficiaryProfile` component wired with `onCallClick` → TranscriptModal opens
- PDPA-safe: zero data rendered without explicit staff query (D-10, D-12)

---

## Commits

| Hash | Description |
|------|-------------|
| `c96c52a` | feat(04-04): build Beneficiaries page — search-first with BeneficiaryProfile component |

---

## Deviations from Plan

None — plan executed exactly as written.

---

## Known Stubs

None — all components render real data or proper empty/error/loading states. The beneficiaries page fetches from `/api/beneficiaries` (built in Plan 01). No hardcoded placeholder values flow to UI rendering.

---

## Threat Flags

No new threat surface beyond what was planned. All three threat model mitigations implemented:
- T-4-11: Search-first design + 2-char minimum + API auth — no list rendered without query
- T-4-12: `ticket.masked_ic` rendered directly from DB field (already stored masked); no IC derivation in UI
- T-4-13: Auth check delegated to `/api/beneficiaries` route (built Plan 01, verified via Supabase `auth.getUser()`)

---

## Self-Check: PASSED

- `mykasih-crm/components/beneficiaries/BeneficiaryProfile.tsx` — contains `export function BeneficiaryProfile`: FOUND
- `mykasih-crm/components/beneficiaries/BeneficiaryProfile.tsx` — contains `font-mono`: FOUND
- `mykasih-crm/components/beneficiaries/BeneficiaryProfile.tsx` — contains `masked_ic`: FOUND
- `mykasih-crm/components/beneficiaries/BeneficiaryProfile.tsx` — contains `ChannelBadge`: FOUND
- `mykasih-crm/components/beneficiaries/BeneficiaryProfile.tsx` — contains `interactionHistory`: FOUND
- `mykasih-crm/components/beneficiaries/BeneficiaryProfile.tsx` — contains `ticketHistory`: FOUND
- `mykasih-crm/app/(dashboard)/beneficiaries/page.tsx` — contains `'use client'`: FOUND
- `mykasih-crm/app/(dashboard)/beneficiaries/page.tsx` — contains `api/beneficiaries`: FOUND
- `mykasih-crm/app/(dashboard)/beneficiaries/page.tsx` — contains `trimmed.length < 2`: FOUND
- `mykasih-crm/app/(dashboard)/beneficiaries/page.tsx` — contains `BeneficiaryProfile`: FOUND
- `mykasih-crm/app/(dashboard)/beneficiaries/page.tsx` — contains `TranscriptModal`: FOUND
- `mykasih-crm/app/(dashboard)/beneficiaries/page.tsx` — contains `Search`: FOUND
- `mykasih-crm/app/(dashboard)/beneficiaries/page.tsx` — contains `Loader2`: FOUND
- `mykasih-crm/app/(dashboard)/beneficiaries/page.tsx` — contains `UserX`: FOUND
- `mykasih-crm/app/(dashboard)/beneficiaries/page.tsx` — contains `min-h-[40vh]`: FOUND
- `mykasih-crm/app/(dashboard)/beneficiaries/page.tsx` — does NOT contain "Phase 4" or "being built": CONFIRMED
- Commit `c96c52a`: FOUND in git log
- `npx tsc --noEmit`: PASSED (0 errors)
- `npx jest --passWithNoTests`: PASSED (54 passed, 66 todo, 0 failed)
