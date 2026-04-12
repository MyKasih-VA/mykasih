---
phase: 04-core-dashboard-pages
plan: "02"
subsystem: dashboard-interaction-pages
tags: [voice-calls, chat-messages, all-interactions, pagination, filters, export, tabs]
dependency_graph:
  requires:
    - 04-01 (FilterBar, CallsTable, TranscriptModal, IntentBadge, translation keys)
  provides:
    - Voice Calls page (/voice-calls) — filter bar + paginated table + transcript modal + XLSX export
    - Chat Messages page (/chat-messages) — intent badge + WA number + message count + ticket ref
    - All Interactions page (/all-interactions) — Tabs channel toggle + filter bar + combined table
  affects:
    - plans 03, 04 (Tickets, Beneficiaries pages share the same fetch/pagination pattern)
tech_stack:
  added: []
  patterns:
    - useCallback + useEffect fetch pattern — fetchCalls wrapped in useCallback, triggered by useEffect on dependency change
    - Separate useEffect resets page to 1 on filter/tab change — prevents stale pagination
    - Date preset → from/to conversion inline helper — today/week/month/custom all handled without external library
    - ticketRefMap built from /api/tickets?limit=100 client-side filter — low volume acceptable for chat page
    - Tabs used as visual channel toggle only — no TabsContent, all tabs show same table with different channel param
    - Export as blob download — URL.createObjectURL + anchor click + revokeObjectURL pattern
key_files:
  created: []
  modified:
    - mykasih-crm/app/(dashboard)/voice-calls/page.tsx (stub fully replaced)
    - mykasih-crm/app/(dashboard)/chat-messages/page.tsx (stub fully replaced)
    - mykasih-crm/app/(dashboard)/all-interactions/page.tsx (stub fully replaced)
decisions:
  - "ticketRefMap fetched via /api/tickets?limit=100 and filtered client-side — avoids adding call_id IN filter to tickets API; acceptable at current ticket volume"
  - "All Interactions uses Tabs for visual toggle only with no TabsContent — single table re-renders with new channel param, avoids duplicate state/fetch for each tab"
  - "Date preset helper is inline function per page — avoids shared utility file for a 30-line pure function; refactor if third page needs it"
  - "Chat Messages page has no FilterBar per UI-SPEC — page shows all chat sessions with pagination only"
metrics:
  duration: "~5 minutes"
  completed: "2026-04-12"
  tasks_completed: 2
  files_changed: 3
---

# Phase 04 Plan 02: Interaction Listing Pages Summary

**One-liner:** Three fully functional interaction listing pages — Voice Calls with filter bar + export, Chat Messages with intent badge + ticket ref linkage, All Interactions with Tabs channel toggle — all using shared components from Plan 01.

---

## What Was Built

### Task 1: Voice Calls page (PAGE-01)

**app/(dashboard)/voice-calls/page.tsx** — stub fully replaced:

- State: `filters` (CallFilters), `page`, `data`, `pagination`, `loading`, `error`, `exporting`, `selectedCallId`, `modalOpen`
- Data fetch: `useCallback` wrapping fetch to `/api/calls?channel=voice&page=N&limit=25` + filter params (search, category, outcome, language)
- Date preset conversion: inline `getDateRange()` helper handles today/week/month/custom → `from`/`to` ISO date strings
- Page reset: separate `useEffect` resets `page` to 1 whenever `filters` changes
- Export: `handleExport()` fetches `/api/export/calls`, receives XLSX blob, triggers anchor download, revokes URL
- Layout: page title → card with FilterBar (`showLanguageFilter={true}`) → CallsTable (`showDuration={true}`) → pagination row
- Pagination: "Showing N–M of total" text + Prev/Next Shadcn Button (outline, sm), disabled at boundaries
- TranscriptModal: opens with `selectedCallId` on row click

### Task 2: Chat Messages page + All Interactions page (PAGE-02, PAGE-03)

**app/(dashboard)/chat-messages/page.tsx** — stub fully replaced:

- Simpler state (no filter bar per UI-SPEC — page shows all chat sessions)
- Fetches `/api/calls?channel=chat&page=N&limit=25`
- After calls fetch, makes second fetch to `/api/tickets?limit=100` and builds `ticketRefMap: Record<string, string>` (call_id → reference_no)
- CallsTable: `showWaNumber={true}`, `showIntentBadge={true}`, `showMessageCount={true}`, `showTicketRef={true}`, `ticketRefs={ticketRefMap}`
- Ticket map fetch is best-effort — table renders without refs if tickets API fails
- Pagination + TranscriptModal same pattern as Voice Calls

**app/(dashboard)/all-interactions/page.tsx** — stub fully replaced:

- Extra state: `channelTab: '' | 'voice' | 'chat'`
- Shadcn Tabs with three triggers (All / Voice / Chat) as visual channel toggle — no TabsContent
- `onValueChange` updates `channelTab` + resets page to 1
- Fetches `/api/calls?page=N&limit=25` + optional `channel` param from tab state
- FilterBar: `showLanguageFilter={false}` (language filter omitted per UI-SPEC)
- CallsTable: `showDurMsgs={true}` — shows seconds for voice rows, message count for chat rows
- Export button downloads from `/api/export/calls`

---

## Commits

| Hash | Description |
|------|-------------|
| `33fd4b8` | feat(04-02): Voice Calls page — FilterBar + CallsTable + TranscriptModal + export + pagination |
| `d17dc38` | feat(04-02): Chat Messages + All Interactions pages |

---

## Deviations from Plan

None — plan executed exactly as written.

---

## Known Stubs

None — all three pages fetch real data from `/api/calls`. Loading skeletons, empty states, and error states all implemented. No hardcoded placeholder values flow to UI rendering.

---

## Threat Flags

No new threat surface introduced. All threats from plan's threat model handled:
- T-4-05: Auth check on `/api/calls` prevents unauthenticated access; `is_test` exclusion handled server-side
- T-4-06: Export button calls `/api/export/calls` which enforces admin+qmedia role guard server-side; UI is convenience only
- T-4-07: Filter values are enum-constrained in FilterBar Select dropdowns; API validates via Supabase SDK

---

## Self-Check: PASSED

- `mykasih-crm/app/(dashboard)/voice-calls/page.tsx` contains `'use client'`: FOUND
- `mykasih-crm/app/(dashboard)/voice-calls/page.tsx` contains `FilterBar`: FOUND
- `mykasih-crm/app/(dashboard)/voice-calls/page.tsx` contains `CallsTable`: FOUND
- `mykasih-crm/app/(dashboard)/voice-calls/page.tsx` contains `TranscriptModal`: FOUND
- `mykasih-crm/app/(dashboard)/voice-calls/page.tsx` contains `channel=voice`: FOUND
- `mykasih-crm/app/(dashboard)/voice-calls/page.tsx` contains `api/export/calls`: FOUND
- `mykasih-crm/app/(dashboard)/voice-calls/page.tsx` contains `limit=25` or `limit', '25'`: FOUND (via URLSearchParams set)
- `mykasih-crm/app/(dashboard)/voice-calls/page.tsx` contains `showLanguageFilter`: FOUND
- `mykasih-crm/app/(dashboard)/voice-calls/page.tsx` contains `showDuration`: FOUND
- `mykasih-crm/app/(dashboard)/voice-calls/page.tsx` contains `setModalOpen`: FOUND
- `mykasih-crm/app/(dashboard)/chat-messages/page.tsx` contains `'use client'`: FOUND
- `mykasih-crm/app/(dashboard)/chat-messages/page.tsx` contains `channel=chat`: FOUND
- `mykasih-crm/app/(dashboard)/chat-messages/page.tsx` contains `showIntentBadge`: FOUND
- `mykasih-crm/app/(dashboard)/chat-messages/page.tsx` contains `showTicketRef`: FOUND
- `mykasih-crm/app/(dashboard)/chat-messages/page.tsx` contains `showWaNumber`: FOUND
- `mykasih-crm/app/(dashboard)/chat-messages/page.tsx` contains `showMessageCount`: FOUND
- `mykasih-crm/app/(dashboard)/chat-messages/page.tsx` contains `TranscriptModal`: FOUND
- `mykasih-crm/app/(dashboard)/all-interactions/page.tsx` contains `'use client'`: FOUND
- `mykasih-crm/app/(dashboard)/all-interactions/page.tsx` contains `Tabs`: FOUND
- `mykasih-crm/app/(dashboard)/all-interactions/page.tsx` contains `TabsTrigger`: FOUND
- `mykasih-crm/app/(dashboard)/all-interactions/page.tsx` contains `FilterBar`: FOUND
- `mykasih-crm/app/(dashboard)/all-interactions/page.tsx` contains `showDurMsgs`: FOUND
- `mykasih-crm/app/(dashboard)/all-interactions/page.tsx` contains `api/export/calls`: FOUND
- Commits `33fd4b8` and `d17dc38`: FOUND in git log
- `npx tsc --noEmit`: PASSED (0 errors)
- `npx jest --passWithNoTests`: PASSED (54 passed, 66 todo, 0 failed)
