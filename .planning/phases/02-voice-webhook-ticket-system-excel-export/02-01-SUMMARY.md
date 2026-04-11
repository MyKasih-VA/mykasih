---
phase: 02-voice-webhook-ticket-system-excel-export
plan: 01
subsystem: lib-utilities
tags: [ic-masking, pdpa, ticket-ref, tdd, utilities]
dependency_graph:
  requires: [02-00]
  provides: [maskIC, generateTicketRef]
  affects: [02-03-webhook-route, 02-04-ticket-crud]
tech_stack:
  added: []
  patterns: [service-role-client, pure-function-utility]
key_files:
  created:
    - mykasih-crm/lib/ic-mask.ts
    - mykasih-crm/lib/ticket-ref.ts
    - mykasih-crm/__tests__/lib/ic-mask.test.ts
    - mykasih-crm/__tests__/lib/ticket-ref.test.ts
  modified: []
decisions:
  - "maskIC uses strip-then-validate pattern: remove dashes, check 12 numeric digits, extract DOB prefix"
  - "generateTicketRef uses ORDER BY DESC + LIMIT 1 (not MAX aggregate) for compatibility with Supabase PostgREST"
  - "Safe placeholder '??????-**-****' used for invalid IC input — never throws per PDPA spec"
metrics:
  duration: "4 minutes"
  completed: "2026-04-11T11:32:55Z"
  tasks_completed: 2
  files_created: 4
  files_modified: 0
---

# Phase 02 Plan 01: Shared Utility Libraries Summary

**One-liner:** PDPA-compliant IC masking (maskIC) and restart-safe sequential ticket reference generator (generateTicketRef) via pure TypeScript utilities — 8/8 tests GREEN.

## Tasks Completed

| Task | Description | Commit | Status |
|------|-------------|--------|--------|
| 1 | Implement lib/ic-mask.ts (VOICE-05 / D-06) | 0cb304d | DONE |
| 2 | Implement lib/ticket-ref.ts (VOICE-06 / D-17) | bb63404 | DONE |

## Verification Results

- `lib/ic-mask.ts` — 5/5 tests GREEN
  - maskIC("880512123456") === "880512-**-****"
  - maskIC("880512-12-3456") === "880512-**-****"
  - maskIC("123") === "??????-**-****"
  - maskIC("abcdefghijkl") === "??????-**-****"
  - maskIC("") === "??????-**-****"

- `lib/ticket-ref.ts` — 3/3 tests GREEN
  - Returns "TKT-2026-00001" when table is empty
  - Increments from "TKT-2026-00001" to "TKT-2026-00002"
  - Zero-pads: "TKT-2026-00099" -> "TKT-2026-00100"

**Full suite:** 8/8 tests pass (`jest --testPathPatterns="lib"`)

## Acceptance Criteria Check

- [x] `mykasih-crm/lib/ic-mask.ts` exists — exports `maskIC(ic: string): string`
- [x] No `any` types in either file
- [x] 5/5 ic-mask tests GREEN
- [x] `mykasih-crm/lib/ticket-ref.ts` exists — exports `generateTicketRef(): Promise<string>`
- [x] Contains `createClient` import from `@supabase/supabase-js`
- [x] Contains `.from('tickets')` query
- [x] Contains `.padStart(5, '0')` for zero-padding
- [x] 3/3 ticket-ref tests GREEN

## Implementation Notes

### ic-mask.ts
Pure function, no external dependencies. Strip dashes, validate 12 numeric digits, extract first 6 chars (DOB prefix), append masked segments. Invalid input returns safe placeholder — never throws (T-02-01-01 mitigation).

### ticket-ref.ts
Uses service role client (`@supabase/supabase-js` direct, not `@supabase/ssr`) — same pattern as `app/api/seed/merchants/route.ts`. Queries `tickets` table for max `reference_no` matching current year prefix, increments, zero-pads to 5 digits. On empty table or no match, starts at 00001. Service role key accessed only via `process.env` — never exposed to client (T-02-01-03 mitigation).

## Deviations from Plan

### Auto-fixed Issues

None — plan executed exactly as written.

### Notes on Worktree Execution

- This plan ran in a parallel worktree (`worktree-agent-a32d318c`)
- Test files from plan 02-00 were not available in the worktree branch (worktree branched from pre-02-00 commit 3968db0)
- Equivalent test files were recreated in the worktree matching the main-branch spec exactly
- node_modules symlinked from main repo (`mykasih-crm/node_modules`) to run tests in worktree context

## Known Stubs

None — both utilities are fully implemented with no placeholder values.

## Threat Surface Scan

No new network endpoints, auth paths, or schema changes introduced. Both utilities are internal server-side only. Mitigations T-02-01-01 and T-02-01-03 applied as specified in plan threat model.

## Self-Check: PASSED

- [x] `mykasih-crm/lib/ic-mask.ts` — FOUND
- [x] `mykasih-crm/lib/ticket-ref.ts` — FOUND
- [x] `mykasih-crm/__tests__/lib/ic-mask.test.ts` — FOUND
- [x] `mykasih-crm/__tests__/lib/ticket-ref.test.ts` — FOUND
- [x] Commit 0cb304d — FOUND (feat(02-01): implement maskIC utility)
- [x] Commit bb63404 — FOUND (feat(02-01): implement generateTicketRef utility)
