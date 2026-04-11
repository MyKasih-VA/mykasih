---
phase: 02-voice-webhook-ticket-system-excel-export
plan: "06"
subsystem: export-api
tags:
  - excel-export
  - api-route
  - role-guard
  - xlsx
dependency_graph:
  requires:
    - 02-02  # export-helpers.ts with buildExportWorkbook
  provides:
    - GET /api/export/calls — 3-sheet XLSX download endpoint
  affects:
    - Phase 4 Voice Calls page (EXPORT-02 frontend button)
tech_stack:
  added: []
  patterns:
    - "Role guard from users table (admin/qmedia)"
    - "Binary Response with XLSX MIME type and Content-Disposition"
    - "Optional date range filtering via query params"
    - "is_test exclusion by default"
key_files:
  created:
    - mykasih-crm/app/api/export/calls/route.ts
  modified: []
decisions:
  - "Role check reads role from users DB table (not JWT claims) — prevents privilege escalation"
  - "is_test=false default protects against test data leaking into production exports"
  - "Date range uses ISO timestamps with full day boundaries (T00:00:00.000Z / T23:59:59.999Z)"
metrics:
  duration: "~10 minutes"
  completed: "2026-04-11"
  tasks_completed: 1
  files_changed: 1
---

# Phase 2 Plan 6: Excel Export Endpoint Summary

**One-liner:** GET /api/export/calls with admin+qmedia role guard, date range filters, is_test exclusion, and binary XLSX download using buildExportWorkbook from export-helpers.

## What Was Built

Single task: `mykasih-crm/app/api/export/calls/route.ts`

The export API endpoint:
1. Authenticates request via Supabase JWT (`supabase.auth.getUser()`)
2. Role-guards to `admin` and `qmedia` only — returns 403 for `mykasih` and `supervisor`
3. Accepts optional query params: `from`, `to` (YYYY-MM-DD), `include_test` (boolean)
4. Excludes `is_test=true` rows by default (override with `?include_test=true`)
5. Queries `calls` and `tickets` tables with date range and test filters
6. Maps raw Supabase rows to typed `CallExportRow[]` and `TicketExportRow[]`
7. Computes `ExportSummary` aggregates (counts by channel, category, outcome; average CSAT; ticket status counts)
8. Calls `buildExportWorkbook(exportData)` from `@/lib/export-helpers`
9. Returns binary `Response` with XLSX MIME type and Content-Disposition header triggering browser download

## Task Commits

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Implement GET /api/export/calls | c0e2552 | mykasih-crm/app/api/export/calls/route.ts |

## Acceptance Criteria Verification

- [x] File `mykasih-crm/app/api/export/calls/route.ts` exists
- [x] Contains `export async function GET(request: NextRequest)`
- [x] Contains `import { buildExportWorkbook` from `@/lib/export-helpers`
- [x] Contains role guard with `allowedRoles = ['admin', 'qmedia']`
- [x] Contains `status: 403` for unauthorized roles
- [x] Contains `.eq('is_test', false)` as default filter
- [x] Contains `searchParams.get('from')` and `searchParams.get('to')` for date range
- [x] Contains `searchParams.get('include_test')` for test inclusion override
- [x] Contains `Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
- [x] Contains `Content-Disposition: attachment; filename=`
- [x] Contains `buildExportWorkbook(exportData)` call
- [x] Returns binary `new Response(buffer, ...)` — NOT `Response.json()`
- [x] No untyped `any` — uses `as string | null` type assertions from Supabase row data

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None — the endpoint is fully wired. The EXPORT-02 frontend download button is deferred to Phase 4 (Voice Calls page) as planned.

## Threat Surface Scan

No new threat surface beyond what is documented in the plan's threat model:
- T-02-06-01: Auth gate via supabase.auth.getUser() — mitigated
- T-02-06-02: Role bypass via explicit DB role check — mitigated
- T-02-06-03: Mass export limited to admin/qmedia; is_test excluded — mitigated
- T-02-06-04: IC already masked in DB (masked_ic field) — accepted
- T-02-06-05: Volume <10K rows acceptable for v1 — accepted

## Self-Check: PASSED

- [x] `mykasih-crm/app/api/export/calls/route.ts` — FOUND
- [x] Commit c0e2552 — FOUND (git log confirms feat(02-06) commit)
