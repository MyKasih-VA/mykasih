# Phase 4: Core Dashboard Pages - Context

**Gathered:** 2026-04-12
**Status:** Ready for planning

<domain>
## Phase Boundary

Five staff-facing CRM pages replacing stub pages: Voice Calls (filterable table + transcript modal + export), Chat Messages (conversation table with intent badge), All Interactions (combined channel-toggle table), Tickets (kanban with dropdown status update), and Beneficiaries (search-first profile view). All data from existing Supabase API routes built in Phases 1–2.

</domain>

<decisions>
## Implementation Decisions

### Tickets Kanban
- **D-01:** Status change via dropdown on each card — no drag-and-drop, no @dnd-kit dependency
- **D-02:** Card content: Reference no (TKT-2026-NNNNN) + category + masked IC (880512-**-****) + relative time
- **D-03:** Three columns: Open | In Progress | Resolved — sourced from `/api/tickets` (Phase 2)

### Voice Calls Filter Bar
- **D-04:** All filters visible in one row: Search input + Date dropdown + Language dropdown + Category dropdown + Outcome dropdown
- **D-05:** Date filter uses preset dropdown: Today / This week / This month / Custom (custom opens a date range picker)
- **D-06:** Export button on the same row as filters (reuses Phase 2 `/api/export/calls`)

### Chat Messages Page
- **D-07:** One table row per WA conversation — same table style as Voice Calls (consistent, scannable)
- **D-08:** Columns: channel badge (💬) + WA number + intent badge + message count + outcome + timestamp + linked ticket ref
- **D-09:** Intent badge: colored text pill using same `color-mix` badge pattern as outcome badges on dashboard home

### Beneficiaries Page
- **D-10:** Search-first layout — blank page with prominent search bar; no list shown until staff searches by WA number or name
- **D-11:** Beneficiary profile view: contact name + WA number header, then two stacked sections: (1) interaction history table, (2) ticket history table
- **D-12:** PDPA-safe by design — no browsing all beneficiary data without explicit search intent

### All Interactions Page
- **D-13:** Channel toggle filter: [All | 📞 Voice | 💬 Chat] — same columns as Voice Calls plus message count column for chat rows
- **D-14:** Reuses `ChannelBadge` component; Duration column shows seconds for voice, message count for chat

### Claude's Discretion
- Pagination size (suggest 25 rows per page)
- Loading skeleton row count
- Empty state copy (use `t()` translations pattern)
- Exact column widths
- Mobile responsiveness approach (horizontal scroll on small screens is acceptable for CRM)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Design System
- `mykasih-crm/app/globals.css` — all 12 CSS color variables; never hardcode hex
- `CLAUDE.md` (project root) — full color token reference and channel distinction rules

### Existing Components (extend, don't rebuild)
- `mykasih-crm/components/calls/ChannelBadge.tsx` — voice/chat badge, correct colors
- `mykasih-crm/components/calls/TranscriptModal.tsx` — stub Dialog, needs transcript fetch wired up
- `mykasih-crm/components/dashboard/RecentInteractions.tsx` — table pattern, outcome badge style, skeleton, empty state pattern

### Existing API Routes (Phase 2)
- `mykasih-crm/app/api/calls/route.ts` — GET paginated calls list
- `mykasih-crm/app/api/calls/[id]/transcript/route.ts` — GET full transcript for a call
- `mykasih-crm/app/api/tickets/route.ts` — GET + PATCH tickets (status update)
- `mykasih-crm/app/api/export/calls/route.ts` — GET Excel export (admin + qmedia only)

### Translations
- `mykasih-crm/lib/translations.ts` — BM/EN string keys; use `t(key, language)` pattern

### Page Stubs (replace content, keep file)
- `mykasih-crm/app/(dashboard)/voice-calls/page.tsx`
- `mykasih-crm/app/(dashboard)/chat-messages/page.tsx`
- `mykasih-crm/app/(dashboard)/all-interactions/page.tsx`
- `mykasih-crm/app/(dashboard)/tickets/page.tsx`
- `mykasih-crm/app/(dashboard)/beneficiaries/page.tsx`

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `ChannelBadge` — ready to use, correct CSS vars and colors
- `TranscriptModal` — Dialog shell exists, needs `useEffect` fetch of `/api/calls/[id]/transcript`
- `RecentInteractions` — table row pattern, `getOutcomeBadgeStyle()`, `formatRelativeTime()`, skeleton pattern all reusable
- Shadcn UI: `Table`, `TableHeader`, `TableBody`, `TableRow`, `TableHead`, `TableCell`, `Skeleton`, `Dialog`, `Badge`, `Button`, `Input`, `Select`, `Tabs` — all installed

### Established Patterns
- Client-side data fetching: `useEffect` + `fetch('/api/...')` — matches Dashboard home pattern
- CSS variable usage: `style={{ color: 'var(--text-primary)' }}` or `className="text-[var(--text-primary)]"`
- Outcome badge: `color-mix(in srgb, var(--status-green) 12%, transparent)` for background
- Translations: `const { language } = useLanguage()` then `t('key', language)` or inline ternary for short strings
- Empty state: `Inbox` icon + heading + subtext, centered, py-16

### Integration Points
- All 5 pages live in `app/(dashboard)/` — already in the layout wrapper (sidebar + topbar)
- Tickets PATCH: `PATCH /api/tickets/[id]` with `{ status: 'in_progress' }` body
- Beneficiary search: query `calls` table by `wa_number` or `caller_name` — no dedicated API yet; planner should create `/api/beneficiaries` route

</code_context>

<specifics>
## Specific Ideas

- Chat Messages table preview confirmed: `| 💬 | +601X-XXX | balance_check | 6 msgs | resolved | 2h ago |`
- Beneficiaries page confirmed: blank search bar first, profile below after search — PDPA conscious
- Tickets: no drag-and-drop, keep it Shadcn-only (dropdown per card)

</specifics>

<deferred>
## Deferred Ideas

- WhatsApp-style bubble thread view — considered for Chat Messages, deferred; table row approach chosen
- Paginated beneficiary list (browseable) — deferred; search-first chosen for PDPA reasons
- Drag-and-drop kanban — deferred; dropdown status update chosen to avoid @dnd-kit

</deferred>

---

*Phase: 04-core-dashboard-pages*
*Context gathered: 2026-04-12*
