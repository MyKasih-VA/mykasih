---
phase: 04-core-dashboard-pages
plan: "03"
subsystem: tickets-kanban
tags: [kanban, tickets, optimistic-update, status-change, color-mix, masked-ic]
dependency_graph:
  requires:
    - 04-01 (translations: kanban.open/inProgress/resolved, error.loadTickets, error.statusUpdate, empty.noTickets)
    - /api/tickets GET (Phase 2)
    - /api/tickets/[id] PATCH (Phase 2)
  provides:
    - TicketKanban — 3-column kanban fetching /api/tickets with optimistic status updates
    - TicketCard — individual ticket card with reference_no, masked_ic, category badge, relative time, status Select
  affects:
    - mykasih-crm/app/(dashboard)/tickets/page.tsx (stub replaced with live kanban)
tech_stack:
  added: []
  patterns:
    - Optimistic update with prevTickets revert pattern — PATCH fails → rollback + show error bar
    - color-mix(in srgb, var 12%, transparent) badge pattern for category badges (matches Plan 01 pattern)
    - formatRelativeTime() copied from RecentInteractions.tsx — same utility logic
    - Empty column state uses dashed border box (border-dashed) — consistent with design spec
key_files:
  created:
    - mykasih-crm/components/tickets/TicketCard.tsx
    - mykasih-crm/components/tickets/TicketKanban.tsx
  modified:
    - mykasih-crm/app/(dashboard)/tickets/page.tsx (stub replaced)
decisions:
  - "TicketCard exports Ticket interface so TicketKanban can import the type alongside the component — avoids duplicating the interface"
  - "COLUMNS array typed with labelKey as union of literal translation keys — ensures type safety without casting in t() call"
  - "Update error bar auto-dismisses after 3s via setTimeout — matches UX pattern from plan spec"
metrics:
  duration: "~2 minutes"
  completed: "2026-04-12"
  tasks_completed: 2
  files_changed: 3
---

# Phase 04 Plan 03: Tickets Kanban Page Summary

**One-liner:** 3-column kanban board with optimistic status updates, category color-mix badges, masked IC + reference number in monospace, and loading/empty/error states.

---

## What Was Built

### Task 1: TicketCard + TicketKanban components

**TicketCard.tsx** — new component at `mykasih-crm/components/tickets/TicketCard.tsx`:
- Exports `Ticket` interface (id, call_id, channel, category, description, status, reference_no, masked_ic, assigned_to, created_at, updated_at)
- Row 1: `reference_no` in `font-mono text-xs`, category badge using `color-mix(in srgb, var 12%, transparent)` — 6 categories mapped to design system colors
- Row 2: `masked_ic` in `font-mono text-xs text-[var(--text-muted)]`
- Row 3: `formatRelativeTime(created_at)` in `text-xs text-[var(--text-muted)]`
- Separator: `<hr className="border-[var(--bg-border)]" />`
- Row 4: Shadcn Select with `value={ticket.status}` and 3 options (open / in_progress / resolved) via `t()` translations

**TicketKanban.tsx** — new component at `mykasih-crm/components/tickets/TicketKanban.tsx`:
- Fetches `GET /api/tickets?limit=100` on mount via `useEffect`
- 3 columns defined as typed `COLUMNS` array with `key`, `labelKey`, `dotColor` using CSS vars (`--status-red`, `--status-yellow`, `--status-green`)
- `grid grid-cols-3 gap-6` layout
- Column header: colored dot + uppercase label + ticket count in `(N)` format
- `handleStatusChange`: optimistic update → `setTickets` immediately → PATCH → revert `prevTickets` + show update error bar on failure
- Loading: 3 `Skeleton` cards per column (`h-24 w-full bg-[var(--bg-border)] rounded-lg`)
- Empty column: dashed border box `h-24` with "No tickets" text
- Error state: centered text with `t('error.loadTickets', language)`
- Update error: inline bar with `bg-[var(--status-red)]/10 border border-[var(--status-red)]/30`, auto-dismisses after 3s

### Task 2: Tickets page

**tickets/page.tsx** — stub replaced:
- `'use client'` directive
- `useLanguage()` hook for language context
- `t('page.tickets', language)` page title
- Passes `language` prop to `TicketKanban`
- No business logic in page — all logic lives in `TicketKanban`

---

## Commits

| Hash | Description |
|------|-------------|
| `56226a5` | feat(04-03): build TicketCard and TicketKanban components |
| `38b77bb` | feat(04-03): wire TicketKanban into tickets page — replace stub with kanban board |

---

## Deviations from Plan

None — plan executed exactly as written.

---

## Known Stubs

None — all components render real data fetched from `/api/tickets` or proper empty/error/loading states. No hardcoded placeholder values flow to UI rendering.

---

## Threat Flags

No new threat surface introduced beyond what was planned. Threat mitigations from the plan's threat model:
- T-4-08: masked_ic rendered directly from DB value — no raw IC ever reaches client (DB stores already-masked format)
- T-4-09: PATCH status validated by `/api/tickets/[id]` route against VALID_STATUSES enum — rejects invalid values with 400
- T-4-10: Auth check via `supabase.auth.getUser()` in both GET and PATCH routes (implemented in Phase 2)

---

## Self-Check: PASSED

- `mykasih-crm/components/tickets/TicketCard.tsx` — contains `export function TicketCard`: FOUND
- `mykasih-crm/components/tickets/TicketKanban.tsx` — contains `export function TicketKanban`: FOUND
- `mykasih-crm/app/(dashboard)/tickets/page.tsx` — contains `TicketKanban`: FOUND
- Commits `56226a5` and `38b77bb`: FOUND in git log
- `npx tsc --noEmit`: PASSED (0 errors)
- `npx jest --passWithNoTests`: PASSED (54 passed, 66 todo, 0 failed)
