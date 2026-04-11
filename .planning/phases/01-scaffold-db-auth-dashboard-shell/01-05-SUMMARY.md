---
phase: 01-scaffold-db-auth-dashboard-shell
plan: 05
subsystem: merchant-data
tags: [merchant-seed, lookup-utilities, integrations-page, admin-only, idempotency]
dependency_graph:
  requires: [01-02]
  provides: [merchant-seed-endpoint, merchant-lookup-utilities, integrations-page-stub]
  affects: [chatbot-merchant-lookup, beneficiaries-page, analytics-page]
tech_stack:
  added: []
  patterns: [service-role-bypass-for-bulk-seed, postcode-prefix-matching, admin-role-guard]
key_files:
  created:
    - mykasih-crm/app/api/seed/merchants/route.ts
    - mykasih-crm/lib/merchant-lookup.ts
    - mykasih-crm/app/(dashboard)/integrations/page.tsx
  modified: []
decisions:
  - Admin role guard implemented on both API (server-side JWT check) and UI (button visibility) as required by T-05-01 and T-05-05
  - merchants.json read from one directory above mykasih-crm/ (join(process.cwd(), '..', 'merchants.json')) to match actual file location at project root
  - Integrations page is a minimal stub per plan — full integration status cards deferred to Phase 5; Seed Merchants button is the sole Phase 1 requirement
metrics:
  duration_minutes: 15
  completed_date: "2026-04-11"
  tasks_completed: 2
  files_created: 3
---

# Phase 01 Plan 05: Merchant Seed Endpoint, Lookup Utilities, and Integrations Page Summary

**One-liner:** Admin-only POST /api/seed/merchants bulk-seeds 10,194 outlets in chunks of 500 with idempotency guard; `lookupByPostcode` and `lookupByState` utilities query the merchants table; Integrations page exposes the Seed Merchants button to admin users when merchants.count === 0 per D-15.

## Completed Tasks

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Create merchant seed API endpoint | 71ca76e | mykasih-crm/app/api/seed/merchants/route.ts |
| 2 | Create merchant lookup utilities + Integrations page stub | b36068a | mykasih-crm/lib/merchant-lookup.ts, mykasih-crm/app/(dashboard)/integrations/page.tsx |

## What Was Built

### Task 1 — POST /api/seed/merchants

Four-guard endpoint per D-14:

1. **Auth guard**: Validates Supabase JWT via `createClient()`, returns 401 if unauthenticated
2. **Role guard**: Checks `users.role === 'admin'` via users table, returns 403 for non-admin
3. **Idempotency guard**: Counts merchants table using service role client, returns 409 if count > 0
4. **Batch insert**: Reads merchants.json from project root (`process.cwd()/../merchants.json`), inserts in chunks of 500 using service role client to bypass RLS
5. **Response**: `{ inserted: N, skipped: 0, duration_ms: N }`
6. **Error handling**: Full try/catch on entire handler, returns 500 with detail on any failure

### Task 2 — Merchant Lookup Utilities

`lib/merchant-lookup.ts` exports two functions:
- `lookupByPostcode(postcode: string)`: Trims to first 4 digits, uses `.like('postcode', '${prefix}%')`, limits to 10 results
- `lookupByState(state: string, city?: string)`: Case-insensitive state filter via `.ilike()`, optional city filter, limits to 10 results
- Both return `Merchant[]` (empty array on error, never throws)

### Task 2 — Integrations Page Stub (D-15)

`app/(dashboard)/integrations/page.tsx`:
- Admin-only visibility: role fetched on mount from `users` table
- Seed Merchants button shown only when `userRole === 'admin' && merchantCount === 0 && !seedResult`
- On successful seed: button disappears, replaced by `<CheckCircle> N,NNN outlets loaded`
- BM/EN bilingual using `useLanguage()` hook
- All colors via CSS vars (`var(--accent-primary)`, `var(--bg-surface)`, etc.)
- Phase 5 stub message explains full integrations dashboard is deferred

## Deviations from Plan

None — plan executed exactly as written. Prerequisite files (`lib/supabase/client.ts`, `lib/supabase/server.ts`, `hooks/useLanguage.ts`) were already in place from prior plan executions (untracked but present).

## Known Stubs

| Stub | File | Line | Reason |
|------|------|------|--------|
| Integrations page content | app/(dashboard)/integrations/page.tsx | 16-20 | Full status cards for ElevenLabs, Meta WA, n8n, Supabase, Anam AI deferred to Phase 5 as per ROADMAP. Seed Merchants button is the sole Phase 1 requirement per D-15. |

## Threat Flags

None — all introduced surface items (POST endpoint, integrations page) are fully covered in the plan's threat model (T-05-01 through T-05-05).

## Self-Check: PASSED

- mykasih-crm/app/api/seed/merchants/route.ts: FOUND
- mykasih-crm/lib/merchant-lookup.ts: FOUND
- mykasih-crm/app/(dashboard)/integrations/page.tsx: FOUND
- Commit 71ca76e: FOUND
- Commit b36068a: FOUND
