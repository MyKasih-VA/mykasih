# Phase 4: Core Dashboard Pages - Research

**Researched:** 2026-04-12
**Domain:** Next.js 16 App Router client pages — filterable tables, kanban board, transcript modal, search-first profile view
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

#### Tickets Kanban
- **D-01:** Status change via dropdown on each card — no drag-and-drop, no @dnd-kit dependency
- **D-02:** Card content: Reference no (TKT-2026-NNNNN) + category + masked IC (880512-**-****) + relative time
- **D-03:** Three columns: Open | In Progress | Resolved — sourced from `/api/tickets` (Phase 2)

#### Voice Calls Filter Bar
- **D-04:** All filters visible in one row: Search input + Date dropdown + Language dropdown + Category dropdown + Outcome dropdown
- **D-05:** Date filter uses preset dropdown: Today / This week / This month / Custom (custom opens a date range picker)
- **D-06:** Export button on the same row as filters (reuses Phase 2 `/api/export/calls`)

#### Chat Messages Page
- **D-07:** One table row per WA conversation — same table style as Voice Calls (consistent, scannable)
- **D-08:** Columns: channel badge (💬) + WA number + intent badge + message count + outcome + timestamp + linked ticket ref
- **D-09:** Intent badge: colored text pill using same `color-mix` badge pattern as outcome badges on dashboard home

#### Beneficiaries Page
- **D-10:** Search-first layout — blank page with prominent search bar; no list shown until staff searches by WA number or name
- **D-11:** Beneficiary profile view: contact name + WA number header, then two stacked sections: (1) interaction history table, (2) ticket history table
- **D-12:** PDPA-safe by design — no browsing all beneficiary data without explicit search intent

#### All Interactions Page
- **D-13:** Channel toggle filter: [All | 📞 Voice | 💬 Chat] — same columns as Voice Calls plus message count column for chat rows
- **D-14:** Reuses `ChannelBadge` component; Duration column shows seconds for voice, message count for chat

### Claude's Discretion
- Pagination size (suggest 25 rows per page)
- Loading skeleton row count
- Empty state copy (use `t()` translations pattern)
- Exact column widths
- Mobile responsiveness approach (horizontal scroll on small screens is acceptable for CRM)

### Deferred Ideas (OUT OF SCOPE)
- WhatsApp-style bubble thread view — considered for Chat Messages, deferred; table row approach chosen
- Paginated beneficiary list (browseable) — deferred; search-first chosen for PDPA reasons
- Drag-and-drop kanban — deferred; dropdown status update chosen to avoid @dnd-kit

</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| PAGE-01 | Voice Calls page — filterable table (date, language, category, outcome, search), transcript modal, Excel export, channel badge | API route `/api/calls` already supports all filter params; transcript route verified; export route verified; `ChannelBadge` ready |
| PAGE-02 | Chat Messages page — WA thread view, message count column, intent badge, linked ticket | Same `/api/calls?channel=chat` query; intent badge reuses `color-mix` pattern from `RecentInteractions`; no dedicated API needed |
| PAGE-03 | All Interactions page — combined table with channel toggle filter [All / Voice / Chat] | Same `/api/calls` with optional `channel` param; `ChannelBadge` handles both; Duration/messages column pattern already in `RecentInteractions` |
| PAGE-04 | Tickets page — kanban board (open/in-progress/resolved), reference no, masked IC, linked transcript, status update | `/api/tickets` GET + `/api/tickets/[id]` PATCH both verified; Shadcn Select already installed for dropdown |
| PAGE-05 | Beneficiaries page — search by WA number or name, interaction history, ticket history | No `/api/beneficiaries` route yet — must be created; queries `calls` by `wa_number`/`caller_name` + `tickets` by `call_id` |

</phase_requirements>

---

## Summary

Phase 4 replaces five stub pages with fully functional CRM views. All heavy lifting — auth, Supabase, API routes, design tokens, and reusable components — was completed in Phases 1-3. This phase is almost entirely UI composition work.

The existing `/api/calls` route already supports every filter the Voice Calls and All Interactions pages need (channel, category, outcome, language, from/to date, search text, pagination). The `/api/tickets` + `/api/tickets/[id]` PATCH route covers the kanban. The only missing API is `/api/beneficiaries`, which queries the `calls` and `tickets` tables by beneficiary identity.

The main technical decisions are: (1) how to wire up client-side filter state to API query params, (2) how to complete the `TranscriptModal` with a live fetch, (3) how to lay out the kanban with three CSS columns rather than a drag-and-drop library, and (4) how to add missing translation keys for all new page strings.

**Primary recommendation:** Compose existing components and API routes. Build one new reusable `FilterBar` component shared by Voice Calls and All Interactions. Create the `/api/beneficiaries` route as a thin query wrapper. Complete `TranscriptModal` with a `useEffect` fetch. Keep the kanban as a flex/grid layout with Shadcn `Select` per card.

---

## Project Constraints (from CLAUDE.md)

| Directive | Rule |
|-----------|------|
| TypeScript | Strict mode — zero `any` types |
| Colors | CSS variables only — never hardcode hex |
| PDPA | No plain-text IC anywhere; masked_ic format: `880512-**-****` |
| Test calls | Tag `is_test=true` — excluded from analytics |
| Tables | Always include loading skeleton + empty state |
| Channel | Always show `ChannelBadge` on every row; voice = `--chart-voice`, chat = `--chart-chat` |
| Fonts | Inter (body), JetBrains Mono (code/monospace only) |
| Next.js | `params` must be awaited (`const { id } = await params`) — Next.js 16 breaking change |
| API routes | Always `try/catch`, always return proper HTTP status codes |

---

## Standard Stack

### Core (all installed — verified via `mykasih-crm/package.json`)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| next | 16.2.3 | App Router, route handlers, client components | Project foundation [VERIFIED: package.json] |
| react | 19.2.4 | UI rendering | Project foundation [VERIFIED: package.json] |
| typescript | ^5 | Type safety | CLAUDE.md mandates strict mode [VERIFIED: package.json] |
| tailwindcss | ^4 | Utility CSS | Project foundation [VERIFIED: package.json] |
| @supabase/supabase-js | ^2.103.0 | Database queries | Project foundation [VERIFIED: package.json] |

### Shadcn UI Components (all installed — verified via `components/ui/`)
| Component | Purpose | Status |
|-----------|---------|--------|
| Table, TableHeader, TableBody, TableRow, TableHead, TableCell | Data tables | Installed [VERIFIED: glob] |
| Skeleton | Loading states | Installed [VERIFIED: glob] |
| Dialog, DialogContent, DialogHeader, DialogTitle | TranscriptModal wrapper | Installed [VERIFIED: glob] |
| Select, SelectContent, SelectItem, SelectTrigger, SelectValue | Filter dropdowns + kanban status | Installed [VERIFIED: glob] |
| Badge | Intent/outcome pills | Installed [VERIFIED: glob] |
| Button | Export, search trigger | Installed [VERIFIED: glob] |
| Input | Search box | Installed [VERIFIED: glob] |
| Tabs | Channel toggle (if using Tabs pattern) | Installed [VERIFIED: glob] |
| Card | Kanban cards | Installed [VERIFIED: glob] |

### Missing — Must Install Before Phase 4

No new npm packages are required. All UI primitives are present. The only gap is a date range picker for the "Custom" date option in D-05.

**Date range picker options:**
- Use two `<Input type="date">` fields inside a Shadcn Popover as a custom range picker — zero new dependencies, matches existing dark theme [ASSUMED: no separate date picker library is installed; native `<input type="date">` works in all modern browsers]
- Alternative: `react-day-picker` (peer dep of many Shadcn installs) — only if already transitively present

**Recommendation:** Use two native `<input type="date">` fields inside a Shadcn Dialog or Popover when "Custom" is selected. Avoids any new dependency.

---

## Architecture Patterns

### Existing Patterns (verified in codebase)

**1. Client-side data fetching**
All dashboard pages use `'use client'` + `useEffect` + `fetch('/api/...')`. This is the established project pattern. Do not introduce server-side data fetching (RSC) for these pages — they require interactive filter state.

```typescript
// Source: inferred from mykasih-crm/components/dashboard/RecentInteractions.tsx pattern
// Pages that fetch on load with state-driven filters:
'use client'
const [data, setData] = useState<CallRow[]>([])
const [loading, setLoading] = useState(true)
const [page, setPage] = useState(1)

useEffect(() => {
  async function load() {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page), limit: '25', ...activeFilters })
    const res = await fetch(`/api/calls?${params}`)
    const json = await res.json()
    setData(json.data)
    setLoading(false)
  }
  load()
}, [page, activeFilters])
```
[VERIFIED: pattern confirmed in RecentInteractions.tsx and calls/route.ts]

**2. Outcome badge — `color-mix` pattern**
```typescript
// Source: mykasih-crm/components/dashboard/RecentInteractions.tsx line 36–64
function getOutcomeBadgeStyle(outcome: string | null): React.CSSProperties {
  switch (outcome) {
    case 'resolved':
      return {
        background: 'color-mix(in srgb, var(--status-green) 12%, transparent)',
        color: 'var(--status-green)',
      }
    // ... etc
  }
}
```
Intent badges for Chat Messages use the same pattern with different CSS vars (e.g. `--accent-teal` for `balance_check`, `--status-yellow` for `complaint`).

**3. Next.js 16 dynamic params — must await**
```typescript
// Source: mykasih-crm/app/api/calls/[id]/transcript/route.ts line 8
// Source: mykasih-crm/app/api/tickets/[id]/route.ts line 17
const { id } = await params  // MUST await — Next.js 16 breaking change
```
[VERIFIED: both route files use this pattern]

**4. Language hook**
```typescript
// Source: mykasih-crm/hooks/useLanguage.ts
const { language } = useLanguage()
// then: t('key', language) or inline ternary
```
[VERIFIED: useLanguage.ts confirmed]

**5. Empty state pattern**
```tsx
// Source: mykasih-crm/components/dashboard/RecentInteractions.tsx line 119–128
<div className="flex flex-col items-center justify-center py-16 px-5">
  <Inbox className="w-8 h-8 text-[var(--text-muted)] mb-3" />
  <p className="text-sm font-semibold text-[var(--text-primary)] mb-1">...</p>
  <p className="text-xs text-[var(--text-muted)] text-center max-w-xs">...</p>
</div>
```
[VERIFIED: RecentInteractions.tsx]

**6. Skeleton loading**
```tsx
// Source: mykasih-crm/components/dashboard/RecentInteractions.tsx line 113–117
<div aria-busy="true" className="px-5 pb-5 space-y-3">
  {Array.from({ length: 10 }).map((_, i) => (
    <Skeleton key={i} className="h-12 w-full bg-[var(--bg-border)]" />
  ))}
</div>
```
[VERIFIED: RecentInteractions.tsx]

### Recommended Component Structure for Phase 4

```
components/
├── calls/
│   ├── ChannelBadge.tsx         ← EXISTS — use as-is
│   ├── TranscriptModal.tsx      ← EXISTS — wire up useEffect fetch
│   ├── FilterBar.tsx            ← NEW — shared by Voice Calls + All Interactions
│   └── CallsTable.tsx           ← NEW — reusable table, props control columns shown
├── chat/
│   └── IntentBadge.tsx          ← NEW — color-mix pill for intent labels
├── tickets/
│   ├── TicketKanban.tsx         ← NEW — 3-column flex layout, calls /api/tickets
│   └── TicketCard.tsx           ← NEW — card with Select for status
└── beneficiaries/
    └── BeneficiaryProfile.tsx   ← NEW — profile header + 2 history tables

app/(dashboard)/
├── voice-calls/page.tsx         ← REPLACE stub content
├── chat-messages/page.tsx       ← REPLACE stub content
├── all-interactions/page.tsx    ← REPLACE stub content
├── tickets/page.tsx             ← REPLACE stub content
└── beneficiaries/page.tsx       ← REPLACE stub content

app/api/
└── beneficiaries/route.ts       ← NEW — query calls + tickets by identity
```

### Kanban Layout — No @dnd-kit

Three-column layout with CSS flex/grid. Status update via `PATCH /api/tickets/[id]`.

```tsx
// Source: [ASSUMED] Tailwind grid pattern for kanban
<div className="grid grid-cols-3 gap-4">
  {(['open', 'in_progress', 'resolved'] as const).map(col => (
    <div key={col} className="flex flex-col gap-3">
      <h3 className="text-xs font-semibold uppercase text-[var(--text-muted)]">{col}</h3>
      {tickets.filter(t => t.status === col).map(ticket => (
        <TicketCard key={ticket.id} ticket={ticket} onStatusChange={handleStatusChange} />
      ))}
    </div>
  ))}
</div>
```

### Anti-Patterns to Avoid

- **Direct hex colors:** Never `className="text-[#43A047]"` — always `text-[var(--chart-voice)]`
- **Plain-text IC in UI:** Tickets kanban shows `masked_ic` field only — never derive or display raw IC
- **Importing from `next/router`:** Must use `next/navigation` in App Router [VERIFIED: Next.js 16 docs]
- **`params` not awaited:** In dynamic route handlers, always `const { id } = await params` [VERIFIED: transcript/route.ts]
- **Missing `'use client'` directive:** All 5 pages use `useLanguage()` — they must be client components
- **Fetching without error handling:** Every `fetch()` call needs `.ok` check + error state
- **Kanban with all tickets in one request:** Load per-column with `?status=open` etc., or load all and filter client-side. For v1 with expected low ticket volume, load all and filter client-side is simpler and acceptable [ASSUMED: ticket volume is small for a CRM POC]

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Outcome badge colors | Custom CSS class system | `color-mix()` pattern in `getOutcomeBadgeStyle()` | Already built in RecentInteractions — reuse/extract |
| Channel labels + icons | New badge component | Existing `ChannelBadge` component | Already handles both channels, correct CSS vars |
| Transcript dialog shell | New Dialog wrapper | Existing `TranscriptModal` — just wire up the fetch | Shell already built with correct dark theme styling |
| Relative time formatting | Custom `date-fns` install | `formatRelativeTime()` in RecentInteractions | Already implemented, no extra dependency |
| Table skeleton | Custom animation | Shadcn `Skeleton` with `bg-[var(--bg-border)]` | Consistent with dashboard home pattern |
| Status PATCH | Custom fetch util | `PATCH /api/tickets/[id]` with `{ status }` body | Route already handles validation + timestamps |
| Ticket reference display | Re-derive TKT number | Use `reference_no` field from DB directly | Already generated by `generateTicketRef()` in Phase 2 |

---

## Key API Route Reference (Phase 2 — Verified)

### `/api/calls` GET
Supports all filter params the pages need [VERIFIED: route.ts]:
- `channel` — `'voice' | 'chat'` or omit for all
- `category` — enum values
- `outcome` — enum values
- `language` — `'bm' | 'en' | 'mixed'`
- `from`, `to` — YYYY-MM-DD date bounds
- `search` — searches `caller_name` and `wa_number` (ilike)
- `page`, `limit` — pagination (default limit 20, max 100)
- `include_test` — `'true'` to include test records

Returns: `{ data: Call[], pagination: { page, limit, total, total_pages } }`

### `/api/calls/[id]/transcript` GET
Returns: `{ call: CallMeta, transcript: TranscriptTurn[] }` [VERIFIED: transcript/route.ts]
- `transcript` is ordered by timestamp ascending
- `speaker` values: `'user' | 'bot' | 'agent'`

### `/api/tickets` GET
Supports: `status`, `category`, `channel`, `search`, `page`, `limit` [VERIFIED: tickets/route.ts]

### `/api/tickets/[id]` PATCH
Body: `{ status?: 'open' | 'in_progress' | 'resolved', assigned_to?: string | null }` [VERIFIED: tickets/[id]/route.ts]
Returns: `{ data: Ticket }` — updated ticket record

### `/api/export/calls` GET
Role guard: admin + qmedia only [VERIFIED: export/calls/route.ts]
Supports: `from`, `to`, `include_test`
Returns: XLSX binary with 3 sheets

### `/api/beneficiaries` GET — MUST BE CREATED in Phase 4
Query: `?query=<wa_number_or_name>`
Behavior:
1. Query `calls` table: `wa_number.ilike.%${q}% OR caller_name.ilike.%${q}%` (exclude is_test)
2. Return unique callers (group by wa_number), their interactions, and linked tickets
3. For a specific beneficiary profile: query calls by wa_number exact match, then tickets by call_ids

---

## Common Pitfalls

### Pitfall 1: `useSearchParams()` Without Suspense Boundary
**What goes wrong:** Next.js 16 requires `useSearchParams()` to be wrapped in a `<Suspense>` boundary or it throws during prerendering.
**Why it happens:** `useSearchParams` causes client-side rendering up to the closest Suspense boundary [VERIFIED: Next.js 16 docs/useRouter.md line 115].
**How to avoid:** For these pages, manage filter state with `useState` (not URL search params) since filter changes don't need to be bookmarkable for v1. Avoids Suspense requirement entirely.
**Warning signs:** Build error "useSearchParams() should be wrapped in a suspense boundary"

### Pitfall 2: Filtering Without Debounce on Search Input
**What goes wrong:** Every keystroke fires an API request causing excessive Supabase reads.
**Why it happens:** `useEffect` dependency on search string triggers on every change.
**How to avoid:** Debounce search input by 300ms before adding to filter state, or use a separate "search" button to trigger fetch.
**Warning signs:** Network tab shows request on every keypress.

### Pitfall 3: Kanban Losing Optimistic Updates
**What goes wrong:** After a PATCH status update, the card doesn't move columns until next full fetch, giving laggy UX.
**Why it happens:** Local state is not updated before the API response.
**How to avoid:** Optimistic update — move the ticket in local state immediately, then revert on PATCH error.
**Warning signs:** Card stays in old column after dropdown selection, then jumps on next refresh.

### Pitfall 4: TranscriptModal Fetching on Every Render
**What goes wrong:** Modal re-fetches transcript every time it re-renders, not just when opened.
**Why it happens:** `useEffect` without correct dependency array.
**How to avoid:** Depend on `[callId, open]` — only fetch when `open === true && callId !== null`.
**Warning signs:** Network tab shows duplicate transcript requests.

### Pitfall 5: Missing Translation Keys
**What goes wrong:** `t('key', language)` throws TypeScript error because key doesn't exist in `translations.ts`.
**Why it happens:** `TranslationKey` is a strict union of existing keys — the type system enforces completeness.
**How to avoid:** Add all new strings to `lib/translations.ts` before using `t()`. New keys needed for Phase 4: filter labels, column headers (WA number, Intent, Messages, Ref No.), empty state copy for each page, kanban column labels.
**Warning signs:** TypeScript error "Argument of type '"..." is not assignable to parameter of type 'TranslationKey'"

### Pitfall 6: Beneficiaries Page Showing Unmasked Data
**What goes wrong:** Beneficiary profile view accidentally renders `wa_number` + `caller_name` in a way that exposes full personal data.
**Why it happens:** The calls table stores `wa_number` and `caller_name` as plain text (not PDPA-sensitive fields per schema — only `masked_ic` has the PDPA constraint).
**How to avoid:** `wa_number` and `caller_name` are intentionally stored and are the search key — display is correct. The PDPA constraint is specifically on IC numbers. `masked_ic` from tickets must always be shown in masked form (already stored masked in DB).

### Pitfall 7: Kanban Not Handling Missing `masked_ic`
**What goes wrong:** Ticket card crashes or shows `null` when a ticket has no `masked_ic` (e.g. complaints that didn't collect IC).
**Why it happens:** `masked_ic` is nullable in the tickets schema.
**How to avoid:** Always render `ticket.masked_ic ?? '--'`.

---

## Code Examples

### Voice Calls Page — Filter State Pattern
```typescript
// Recommended pattern for all filterable pages
'use client'
import { useState, useEffect, useCallback } from 'react'
import { useLanguage } from '@/hooks/useLanguage'

type CallFilters = {
  search: string
  datePreset: 'today' | 'week' | 'month' | 'custom' | ''
  dateFrom: string
  dateTo: string
  language: string
  category: string
  outcome: string
}

const DEFAULT_FILTERS: CallFilters = {
  search: '', datePreset: '', dateFrom: '', dateTo: '',
  language: '', category: '', outcome: '',
}

export default function VoiceCallsPage() {
  const { language } = useLanguage()
  const [filters, setFilters] = useState<CallFilters>(DEFAULT_FILTERS)
  const [page, setPage] = useState(1)
  const [data, setData] = useState<Call[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [selectedCallId, setSelectedCallId] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  const fetchCalls = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ channel: 'voice', page: String(page), limit: '25' })
    if (filters.search) params.set('search', filters.search)
    if (filters.category) params.set('category', filters.category)
    if (filters.outcome) params.set('outcome', filters.outcome)
    if (filters.language) params.set('language', filters.language)
    if (filters.dateFrom) params.set('from', filters.dateFrom)
    if (filters.dateTo) params.set('to', filters.dateTo)

    const res = await fetch(`/api/calls?${params}`)
    if (res.ok) {
      const json = await res.json()
      setData(json.data)
      setTotal(json.pagination.total)
    }
    setLoading(false)
  }, [filters, page])

  useEffect(() => { fetchCalls() }, [fetchCalls])
  // ...
}
```

### TranscriptModal — Wired Fetch
```typescript
// Source: TranscriptModal.tsx — stub to be replaced
'use client'
import { useEffect, useState } from 'react'

interface TranscriptTurn {
  id: string
  speaker: 'user' | 'bot' | 'agent'
  message: string
  timestamp: string
}

export function TranscriptModal({ callId, open, onOpenChange, language }: TranscriptModalProps) {
  const [turns, setTurns] = useState<TranscriptTurn[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open || !callId) return
    setLoading(true)
    fetch(`/api/calls/${callId}/transcript`)
      .then(r => r.json())
      .then(json => { setTurns(json.transcript ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [open, callId])
  // ...
}
```

### Intent Badge for Chat Messages
```typescript
// Following same color-mix pattern as getOutcomeBadgeStyle()
function getIntentBadgeStyle(intent: string | null): React.CSSProperties {
  switch (intent) {
    case 'balance_check':
      return { background: 'color-mix(in srgb, var(--accent-teal) 12%, transparent)', color: 'var(--accent-teal)' }
    case 'merchant_lookup':
      return { background: 'color-mix(in srgb, var(--accent-primary) 12%, transparent)', color: 'var(--accent-primary)' }
    case 'complaint':
      return { background: 'color-mix(in srgb, var(--status-red) 12%, transparent)', color: 'var(--status-red)' }
    case 'faq':
      return { background: 'color-mix(in srgb, var(--status-yellow) 12%, transparent)', color: 'var(--status-yellow)' }
    case 'unknown':
    default:
      return { background: 'color-mix(in srgb, var(--text-muted) 12%, transparent)', color: 'var(--text-muted)' }
  }
}
```

### Ticket Status PATCH
```typescript
async function updateTicketStatus(ticketId: string, status: 'open' | 'in_progress' | 'resolved') {
  // Optimistic update first
  setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, status } : t))

  const res = await fetch(`/api/tickets/${ticketId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  })
  if (!res.ok) {
    // Revert on failure
    fetchTickets()
  }
}
```

### `/api/beneficiaries` Route (to be created)
```typescript
// app/api/beneficiaries/route.ts
import { createClient } from '@/lib/supabase/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const q = request.nextUrl.searchParams.get('query')?.trim()
  if (!q || q.length < 2) return Response.json({ error: 'Query too short' }, { status: 400 })

  const { data: calls } = await supabase
    .from('calls')
    .select('*')
    .or(`wa_number.ilike.%${q}%,caller_name.ilike.%${q}%`)
    .eq('is_test', false)
    .order('timestamp', { ascending: false })

  const callIds = (calls ?? []).map(c => c.id)

  const { data: tickets } = callIds.length > 0
    ? await supabase.from('tickets').select('*').in('call_id', callIds)
    : { data: [] }

  return Response.json({ calls: calls ?? [], tickets: tickets ?? [] })
}
```

---

## New Translation Keys Required

The following keys must be added to `lib/translations.ts` before any new page strings use `t()`:

| Key | EN | BM |
|-----|----|----|
| `page.voiceCalls` | `Voice Calls` | `Panggilan Suara` |
| `page.chatMessages` | `Chat Messages` | `Mesej Chat` |
| `page.allInteractions` | `All Interactions` | `Semua Interaksi` |
| `page.tickets` | `Tickets` | `Tiket` |
| `page.beneficiaries` | `Beneficiaries` | `Penerima Manfaat` |
| `table.waNumber` | `WA Number` | `No. WA` |
| `table.intent` | `Intent` | `Niat` |
| `table.messages` | `Messages` | `Mesej` |
| `table.refNo` | `Ref No.` | `No. Ruj.` |
| `table.maskedIc` | `IC (masked)` | `IC (tersembunyi)` |
| `table.status` | `Status` | `Status` |
| `filter.allChannels` | `All` | `Semua` |
| `filter.today` | `Today` | `Hari Ini` |
| `filter.thisWeek` | `This week` | `Minggu ini` |
| `filter.thisMonth` | `This month` | `Bulan ini` |
| `filter.custom` | `Custom` | `Tersuai` |
| `filter.allCategories` | `All categories` | `Semua kategori` |
| `filter.allOutcomes` | `All outcomes` | `Semua hasil` |
| `filter.allLanguages` | `All languages` | `Semua bahasa` |
| `kanban.open` | `Open` | `Terbuka` |
| `kanban.inProgress` | `In Progress` | `Dalam Proses` |
| `kanban.resolved` | `Resolved` | `Selesai` |
| `action.export` | `Export` | `Eksport` |
| `beneficiaries.searchPrompt` | `Search by WA number or name` | `Cari mengikut nombor WA atau nama` |
| `beneficiaries.noResults` | `No beneficiary found` | `Tiada penerima manfaat ditemui` |
| `empty.noTickets.heading` | `No tickets yet` | `Tiada tiket lagi` |
| `empty.noCalls.heading` | `No calls yet` | `Tiada panggilan lagi` |

[ASSUMED: exact BM translations above should be verified with MyKasih staff for accuracy]

---

## State of the Art

| Old Approach | Current Approach | Impact |
|--------------|------------------|--------|
| next/router | next/navigation (useRouter, usePathname, useSearchParams) | Must import from `next/navigation` [VERIFIED: Next.js 16 docs] |
| params sync access | `await params` required | All dynamic API route handlers must await params [VERIFIED: existing routes] |
| Shadcn date picker component | Not yet in shadcn/ui for all setups | Use native `<input type="date">` or two inputs; avoids extra install [ASSUMED] |

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Two native `<input type="date">` fields for custom date range (no extra library) | Standard Stack | If browser date input styling is incompatible with dark theme, may need a styled wrapper or a library |
| A2 | Ticket volume is small enough for client-side filtering (load all, filter locally) | Architecture Patterns | If kanban has hundreds of tickets, should paginate per-column; add pagination if needed |
| A3 | BM translations listed are accurate for MyKasih context | New Translation Keys | Wrong translations would need correction — MyKasih staff should verify BM strings |
| A4 | `category` field on `calls` table represents the chatbot intent for chat sessions | Chat Messages Page | If chat sessions use a different field for intent, IntentBadge logic needs adjustment |

---

## Open Questions (RESOLVED)

1. **Beneficiaries unique profile identity**
   - What we know: Search queries `calls.wa_number` and `calls.caller_name`
   - What's unclear: If one WA number has multiple `caller_name` values (e.g. same number, different name given), the profile view may show ambiguous results
   - RESOLVED: Group by `wa_number` in the profile — treat `wa_number` as the canonical beneficiary identity; show the most recent `caller_name`

2. **Chat Messages page — is `category` the intent field?**
   - What we know: `calls.category` stores `eligibility | faq | registration | complaint | merchant_lookup | balance_check`
   - What's unclear: The chatbot classifies intent as `faq | balance_check | merchant_lookup | complaint | unknown` — these partially overlap with the category enum but `unknown` and `eligibility/registration` don't match
   - RESOLVED: Use `category` for the intent badge; map `unknown` to a neutral style; note that chatbot may write `null` for category if no intent matched [ASSUMED]

3. **Date range picker dark theme**
   - What we know: Native `<input type="date">` uses browser default calendar widget
   - What's unclear: Browser calendar popup may render in light mode on some platforms
   - RESOLVED: Two text inputs with `type="date"` are sufficient for v1 CRM use; style with `bg-[var(--bg-surface)]` border to match the dark theme

---

## Environment Availability

Step 2.6: SKIPPED — Phase 4 is pure UI composition using Next.js + Supabase APIs already established in prior phases. No new external tools, services, or CLIs are required.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest 30.3.0 + ts-jest 29.4.9 |
| Config file | `mykasih-crm/jest.config.ts` |
| Quick run command | `cd mykasih-crm && npx jest --testPathPattern="__tests__/api/beneficiaries" --passWithNoTests` |
| Full suite command | `cd mykasih-crm && npx jest --passWithNoTests` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| PAGE-01 | Voice Calls filters map to correct API params | unit | `npx jest --testPathPattern="api/calls"` | ❌ Wave 0 |
| PAGE-02 | Chat Messages filters channel=chat and shows intent | unit | `npx jest --testPathPattern="api/calls"` | ❌ Wave 0 |
| PAGE-03 | All Interactions channel toggle sends correct param | unit | `npx jest --testPathPattern="api/calls"` | ❌ Wave 0 |
| PAGE-04 | Ticket PATCH updates status correctly | unit | `npx jest --testPathPattern="api/tickets"` (partial exists from Phase 2) | Partial |
| PAGE-05 | Beneficiaries GET returns calls + tickets for query | unit | `npx jest --testPathPattern="api/beneficiaries"` | ❌ Wave 0 |

**Note:** Phase 4 is heavily UI-focused. The most testable unit in this phase is the new `/api/beneficiaries` route. Client component behavior (filter state, modal open/close, kanban optimistic updates) is best verified by manual QA or E2E tests — unit tests of React components with fetch mocks provide limited value for this CRUD-style page work and are not required for phase gate.

### Sampling Rate
- **Per task commit:** `cd mykasih-crm && npx jest --passWithNoTests`
- **Per wave merge:** `cd mykasih-crm && npx jest --passWithNoTests`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `mykasih-crm/__tests__/api/beneficiaries.test.ts` — covers PAGE-05 (beneficiary search and profile data)

*(Existing test infrastructure covers the framework; only the beneficiaries API test is a new file gap)*

---

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | yes | Supabase Auth — all API routes check `getUser()` and return 401 [VERIFIED: all Phase 2 routes] |
| V3 Session Management | yes | Supabase handles session tokens; `@supabase/ssr` cookie management [VERIFIED: Phase 1] |
| V4 Access Control | yes — export only | `/api/export/calls` role guard: admin + qmedia only; `/api/beneficiaries` — all authenticated roles |
| V5 Input Validation | yes | Beneficiaries query: minimum 2-char check before hitting DB; ilike queries are parameterized via Supabase SDK (no raw SQL injection risk) |
| V6 Cryptography | no — not applicable | No new crypto in this phase |

### Known Threat Patterns

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Unrestricted beneficiary browsing | Information Disclosure | Search-first layout (D-10) — no list without explicit search intent [VERIFIED: D-10 decision] |
| IC exposure in kanban | Information Disclosure | Always render `ticket.masked_ic` from DB (stored masked), never derive raw IC in UI |
| Export without role check | Elevation of Privilege | `/api/export/calls` already has admin/qmedia role guard [VERIFIED: export/calls/route.ts] |
| Open redirect from ticket reference link | Tampering | Ticket ref links navigate within the app only (`/voice-calls?id=...`); no external redirect |

---

## Sources

### Primary (HIGH confidence)
- `mykasih-crm/package.json` — exact library versions installed
- `mykasih-crm/components/calls/ChannelBadge.tsx` — verified component interface
- `mykasih-crm/components/calls/TranscriptModal.tsx` — verified stub state
- `mykasih-crm/components/dashboard/RecentInteractions.tsx` — verified patterns (badge, skeleton, empty state, relative time)
- `mykasih-crm/app/api/calls/route.ts` — verified all filter params and response shape
- `mykasih-crm/app/api/calls/[id]/transcript/route.ts` — verified response shape
- `mykasih-crm/app/api/tickets/route.ts` — verified response shape
- `mykasih-crm/app/api/tickets/[id]/route.ts` — verified PATCH interface
- `mykasih-crm/app/api/export/calls/route.ts` — verified role guard and params
- `mykasih-crm/lib/translations.ts` — verified all existing keys and `t()` function signature
- `mykasih-crm/hooks/useLanguage.ts` — verified hook interface
- `mykasih-crm/app/globals.css` — verified all 12 CSS color token names
- `mykasih-crm/jest.config.ts` — verified test framework and match patterns
- `mykasih-crm/node_modules/next/dist/docs/` — verified Next.js 16 patterns (await params, useSearchParams Suspense requirement)

### Secondary (MEDIUM confidence)
- CLAUDE.md (project root) — project constraints, design system, security rules
- `.planning/phases/04-core-dashboard-pages/04-CONTEXT.md` — locked decisions

### Tertiary (LOW confidence)
- None — all critical claims verified from codebase or official Next.js 16 docs

---

## Metadata

**Confidence breakdown:**
- Standard Stack: HIGH — all packages verified via package.json; all Shadcn components verified via glob
- Architecture: HIGH — patterns verified directly from existing component source files
- API contracts: HIGH — all routes read and verified
- Translation keys: MEDIUM — new BM strings are assumed correct; need MyKasih staff review
- Pitfalls: HIGH — derived from verified code patterns and Next.js 16 docs

**Research date:** 2026-04-12
**Valid until:** 2026-05-12 (stable stack — 30 days)
