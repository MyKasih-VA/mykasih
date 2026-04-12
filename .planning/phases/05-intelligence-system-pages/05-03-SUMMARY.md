---
phase: 05-intelligence-system-pages
plan: 03
subsystem: ui
tags: [supabase-admin, staff-management, next-js, typescript, shadcn-ui]

# Dependency graph
requires:
  - phase: 05-01
    provides: analytics API foundation and Phase 5 patterns for Next.js 16 await params

provides:
  - GET /api/staff — admin-only user list with active/pending status
  - POST /api/staff/invite — Supabase Admin inviteUserByEmail + users row insert
  - PATCH /api/staff/[id] — role update with enum validation
  - DELETE /api/staff/[id] — removes from Supabase Auth + users table
  - StaffTable component — paginated table with Active/Pending badges, AlertDialog confirm
  - StaffInviteModal component — Dialog with Name/Email/Role fields
  - StaffEditRoleModal component — Dialog with Role Select, initialized from current user role
  - Staff Management page at /staff — replaces Phase 4 stub

affects: [05-04, 05-05, settings-page, integrations-page]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Service role client via @supabase/supabase-js direct (not @supabase/ssr) for Supabase Admin methods — same pattern as chatbot/session-manager.ts"
    - "Admin-only enforcement reads from users.role DB column, not JWT claims — avoids stale token issues"
    - "Role validated server-side against VALID_ROLES tuple before any write — T-5-Admin-04 mitigation"
    - "listUsers + find-by-email pattern for auth deletion — Supabase Admin has no deleteByEmail method"
    - "Status derived at query time: last_login null = pending, otherwise active — no separate status column needed"

key-files:
  created:
    - mykasih-crm/app/api/staff/route.ts
    - mykasih-crm/app/api/staff/invite/route.ts
    - mykasih-crm/app/api/staff/[id]/route.ts
    - mykasih-crm/components/staff/StaffInviteModal.tsx
    - mykasih-crm/components/staff/StaffEditRoleModal.tsx
    - mykasih-crm/components/staff/StaffTable.tsx
  modified:
    - mykasih-crm/app/(dashboard)/staff/page.tsx

key-decisions:
  - "Supabase Admin listUsers + find-by-email for auth deletion — no deleteByEmail API available"
  - "active/pending status derived from last_login null check at API response time — no DB column needed"
  - "Role enum validated server-side as VALID_ROLES tuple — satisfies T-5-Admin-04 tampering mitigation"
  - "getAdminClient() helper per route file (not shared module) — keeps service role key usage localized and auditable"

patterns-established:
  - "AlertDialog per-row in StaffTable — no separate state machine needed, Radix handles open/close per trigger"

requirements-completed: [PAGE-08]

# Metrics
duration: 3min
completed: 2026-04-12
---

# Phase 05 Plan 03: Staff Management Summary

**Invite-only staff management with Supabase Admin SDK — admin can invite, change roles, remove staff, and see Active/Pending status across all team members**

## Performance

- **Duration:** 3 min
- **Started:** 2026-04-12T07:32:32Z
- **Completed:** 2026-04-12T07:35:20Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments

- Three admin-only API routes enforce role check from DB (not JWT) — invite via Supabase Admin inviteUserByEmail, role PATCH, auth+DB DELETE
- StaffTable with Active (green) / Pending (yellow) status badges, per-row AlertDialog confirm for removal, resend invite for pending users, 25-row pagination
- Stub at /staff fully replaced — page fetches live data, handles all CRUD operations with sonner toast feedback

## Task Commits

1. **Task 1: Staff API routes (GET list, POST invite, PATCH role, DELETE user)** — `1dd9069` (feat)
2. **Task 2: Staff Management page with StaffTable, StaffInviteModal, StaffEditRoleModal** — `df16380` (feat)

## Files Created/Modified

- `mykasih-crm/app/api/staff/route.ts` — GET all staff users, admin check, active/pending status derivation
- `mykasih-crm/app/api/staff/invite/route.ts` — POST invite via Supabase Admin inviteUserByEmail + users row insert
- `mykasih-crm/app/api/staff/[id]/route.ts` — PATCH role update + DELETE from Supabase Auth and users table
- `mykasih-crm/components/staff/StaffInviteModal.tsx` — Dialog with Name/Email/Role fields, loading state
- `mykasih-crm/components/staff/StaffEditRoleModal.tsx` — Dialog with role Select, initialized from current user role
- `mykasih-crm/components/staff/StaffTable.tsx` — Paginated table, Active/Pending badges, per-row AlertDialog
- `mykasih-crm/app/(dashboard)/staff/page.tsx` — Replaces stub with full staff management page

## Decisions Made

- Used `listUsers` + find-by-email to locate auth user for deletion — Supabase Admin has no `deleteByEmail` method
- Status (active/pending) derived at API response from `last_login IS NULL` check — no separate status column required in schema
- `getAdminClient()` helper defined per route file rather than shared module — keeps service role key usage localized and easy to audit
- Role validated server-side against `VALID_ROLES` constant tuple before any DB write — satisfies T-5-Admin-04 tampering threat

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None. TypeScript strict mode passed with zero errors on first check.

## User Setup Required

None — no external service configuration required beyond existing Supabase service role key in `.env.local`.

## Known Stubs

None — all staff operations (invite, edit role, remove, resend invite) are fully wired to Supabase. No placeholder data.

## Threat Flags

No new threat surface introduced beyond the plan's threat model. All four STRIDE threats (T-5-Admin-01 through T-5-Admin-04) are mitigated:
- T-5-Admin-01: Every route checks `users.role === 'admin'` from DB (not JWT)
- T-5-Admin-02: Service role key used only in server-side handlers, never sent to client
- T-5-Admin-03: Invite flow uses Supabase-managed email — no admin-set passwords
- T-5-Admin-04: Role validated against enum before write

## Next Phase Readiness

- Staff Management (PAGE-08) complete — admin users can manage team access end-to-end
- Ready for Phase 05 Plan 04 (Testing Console) and Plan 05 (AI Demo + Settings)
- No blockers

---
*Phase: 05-intelligence-system-pages*
*Completed: 2026-04-12*
