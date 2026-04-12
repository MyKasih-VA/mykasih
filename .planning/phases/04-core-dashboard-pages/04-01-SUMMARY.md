---
phase: 04-core-dashboard-pages
plan: "01"
subsystem: dashboard-shared-components
tags: [translations, api, components, filters, table, modal, badges]
dependency_graph:
  requires: []
  provides:
    - translations Phase4 keys (40+ keys in lib/translations.ts)
    - GET /api/beneficiaries (wa_number + caller_name search)
    - TranscriptModal (wired fetch on [open, callId])
    - FilterBar (debounced search + selects + date range + export)
    - CallsTable (configurable columns, all 4 render states)
    - IntentBadge (color-mix pill for 5 intents)
  affects:
    - plans 02, 03, 04 (Voice Calls, Chat Messages, All Interactions, Tickets, Beneficiaries pages consume these)
tech_stack:
  added: []
  patterns:
    - jest.mock factory with mutable _cfg object to avoid TDZ — safe pattern for supabase/server mocks
    - color-mix(in srgb, var 12%, transparent) badge pattern for intent + outcome badges
    - 300ms debounce via useRef + setTimeout/clearTimeout (no lodash dependency)
    - useEffect on [open, callId] dependency array for TranscriptModal fetch
key_files:
  created:
    - mykasih-crm/lib/translations.ts (modified — 40+ new keys appended)
    - mykasih-crm/app/api/beneficiaries/route.ts
    - mykasih-crm/__tests__/api/beneficiaries.test.ts
    - mykasih-crm/components/calls/FilterBar.tsx
    - mykasih-crm/components/calls/CallsTable.tsx
    - mykasih-crm/components/chat/IntentBadge.tsx
  modified:
    - mykasih-crm/components/calls/TranscriptModal.tsx (stub replaced with real fetch)
decisions:
  - "mutable _cfg object pattern chosen for jest.mock factory — avoids TDZ when outer const variables would be undefined at hoist time"
  - "getOutcomeBadgeStyle, formatCategory, formatRelativeTime extracted as exports from CallsTable.tsx — shared by future page components"
  - "CallsTable uses useState for hover tracking rather than CSS :hover — matches established RecentInteractions.tsx pattern"
  - "FilterBar uses __all__ sentinel value for Select components — Radix Select does not support empty string as valid value"
metrics:
  duration: "~25 minutes"
  completed: "2026-04-12"
  tasks_completed: 2
  files_changed: 7
---

# Phase 04 Plan 01: Shared Components and Beneficiaries API Summary

**One-liner:** 40+ bilingual translation keys, beneficiaries search API with auth + validation, and 4 reusable dashboard components (TranscriptModal wired, FilterBar with debounce, CallsTable with configurable columns, IntentBadge with color-mix).

---

## What Was Built

### Task 1: Phase 4 Translation Keys + Beneficiaries API Route + Tests

**lib/translations.ts** — 40+ new keys appended after `common.search`:
- Page titles (5): `page.voiceCalls`, `page.chatMessages`, `page.allInteractions`, `page.tickets`, `page.beneficiaries`
- Table columns (7): `table.waNumber`, `table.intent`, `table.messages`, `table.refNo`, `table.maskedIc`, `table.status`, `table.durationMsgs`
- Filter labels (9): date presets, all-x placeholders, search placeholder
- Kanban (3): `kanban.open`, `kanban.inProgress`, `kanban.resolved`
- Actions (1): `action.export`
- Beneficiaries (6): search heading, subtext, no-results heading/body, interaction history, ticket history
- Empty states (7): voice/chat/filtered empty states
- Errors (4): load calls, load chat, load tickets, status update
- Pagination (2): `pagination.showing`, `pagination.of`

**app/api/beneficiaries/route.ts** — GET endpoint:
- Auth guard: `supabase.auth.getUser()` → 401 if missing
- Minimum 2-char query validation → 400 `Query too short`
- Supabase ilike search on `wa_number` and `caller_name` (OR), excludes `is_test=true`
- Fetches linked tickets by call IDs in a second query
- Returns `{ calls: [], tickets: [] }`

**Tests** — 4 passing tests covering all behaviors:
1. 401 unauthenticated
2. 400 missing query
3. 400 single-char query
4. 200 with calls + tickets populated

### Task 2: Shared UI Components

**TranscriptModal.tsx** — replaced Phase 4 stub:
- `useEffect` on `[open, callId]` — only fetches when modal opens
- Loading: 5 skeleton bars `h-8`
- Error: "Unable to load transcript."
- Empty: "No transcript available."
- Populated: scrollable list `max-h-[400px]`, speaker label colored by role (user=text-primary, bot=chart-chat, agent=status-yellow)

**FilterBar.tsx** — new component:
- Debounced search: local state + `setTimeout(300)` via `useRef`, no lodash
- Date preset Select: All time / Today / This week / This month / Custom
- Custom date range: two `<input type="date">` inline, styled with CSS vars, only shown when `datePreset === 'custom'`
- Language Select: conditional on `showLanguageFilter` prop (Voice Calls only)
- Category and Outcome Selects
- Export Button: `bg-[var(--accent-primary)]` with Download icon
- Exports: `FilterBar`, `CallFilters` interface, `DEFAULT_FILTERS` const

**CallsTable.tsx** — new component:
- Props control: `showWaNumber`, `showIntentBadge`, `showDuration`, `showDurMsgs`, `showMessageCount`, `showTicketRef`
- 4 render states: loading (8 skeleton rows `aria-busy`), error (centered message), empty (icon + heading + body), populated (table)
- Hover: `color-mix(in srgb, var(--bg-border) 40%, transparent)` via `useState`
- Exports: `CallsTable`, `CallRow`, `getOutcomeBadgeStyle`, `formatCategory`, `formatRelativeTime`, `CATEGORY_LABELS`

**IntentBadge.tsx** — new component in `components/chat/`:
- 5 intent colors using `color-mix(in srgb, var 12%, transparent)` pattern
- `balance_check` → `--accent-teal`, `merchant_lookup` → `--accent-primary`, `complaint` → `--status-red`, `faq` → `--status-yellow`, `unknown`/default → `--text-muted`
- null renders `--` in text-muted (no badge pill)

---

## Commits

| Hash | Description |
|------|-------------|
| `0ab5a25` | feat(04-01): add Phase 4 translation keys, beneficiaries API route, and tests |
| `09b439a` | feat(04-01): build shared UI components — TranscriptModal, FilterBar, CallsTable, IntentBadge |

---

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] FilterBar Select empty string sentinel**
- **Found during:** Task 2
- **Issue:** Radix UI Select (Shadcn) does not accept empty string `""` as a valid `SelectItem` value — causes console warnings and broken state
- **Fix:** Use `__all__` sentinel value for "all" options; convert to `""` when calling `onFilterChange`
- **Files modified:** `mykasih-crm/components/calls/FilterBar.tsx`
- **Commit:** `09b439a`

**2. [Rule 1 - Bug] TDZ in jest.mock factory for beneficiaries test**
- **Found during:** Task 1 test verification
- **Issue:** `jest.mock` factories are hoisted before `const` declarations — outer mock function refs (`mockGetUser`, etc.) are `undefined` at factory execution time
- **Fix:** Used mutable `_cfg` plain object (declared before `jest.mock`) that factory closes over; tests mutate `_cfg` directly per test case
- **Files modified:** `mykasih-crm/__tests__/api/beneficiaries.test.ts`
- **Commit:** `0ab5a25`

---

## Known Stubs

None — all components render real data or proper empty/error/loading states. No hardcoded placeholder values flow to UI rendering.

---

## Threat Flags

No new threat surface introduced beyond what was planned. The `/api/beneficiaries` route implements all mitigations from the plan's threat model:
- T-4-01: Auth check + `is_test` exclusion + 2-char minimum + Supabase SDK parameterizes ilike
- T-4-02: TranscriptModal fetch relies on Supabase cookie auth (handled by existing middleware)
- T-4-03: Auth check on every request via `supabase.auth.getUser()`

---

## Self-Check: PASSED

- `mykasih-crm/lib/translations.ts` — contains `page.voiceCalls`: FOUND
- `mykasih-crm/app/api/beneficiaries/route.ts` — contains `wa_number.ilike`: FOUND
- `mykasih-crm/components/calls/FilterBar.tsx` — contains `export function FilterBar`: FOUND
- `mykasih-crm/components/calls/CallsTable.tsx` — contains `export function CallsTable`: FOUND
- `mykasih-crm/components/chat/IntentBadge.tsx` — contains `export function IntentBadge`: FOUND
- Commits `0ab5a25` and `09b439a`: FOUND in git log
- `npx tsc --noEmit`: PASSED (0 errors)
- `npx jest --passWithNoTests`: PASSED (54 passed, 66 todo, 0 failed)
