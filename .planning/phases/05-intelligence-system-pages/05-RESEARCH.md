# Phase 5: Intelligence & System Pages — Research

**Researched:** 2026-04-12
**Domain:** Next.js 16 App Router / Recharts 3 / Supabase Admin SDK / ElevenLabs Conversations API / CSS heatmap grid
**Confidence:** HIGH — all findings verified against installed packages or existing codebase patterns

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Analytics — Period Selector**
- D-01: Presets + custom date range — Today / This Week / This Month / Last 3 Months + Custom (opens date range picker). Matches Phase 4 Voice Calls filter pattern.

**Analytics — Charts**
- D-02: Volume bar chart — stacked voice vs chat, `--chart-voice` and `--chart-chat`. Recharts `BarChart`.
- D-03: CSAT trend — Recharts `LineChart`, Y axis 1–5. Empty state ("No CSAT ratings yet") when no data.
- D-04: Language pie — BM vs EN vs Mixed, Recharts `PieChart`.
- D-05: Peak heatmap — 7 col × 24 row CSS grid, `color-mix(in srgb, var(--accent-primary) {intensity}%, var(--bg-surface))`. Recharts NOT used here.
- D-06: Category breakdown table — Category | Voice Count | Chat Count | Total | % of all. Shadcn `Table`, no bar embellishment.

**Analytics — API**
- D-07: New route `/api/analytics/charts` (or extend existing) returning all chart data in one call (`?period=&from=&to=`). Claude has discretion on extend vs. new route.

**Knowledge Base**
- D-08: Shadcn `Dialog` modal for add/edit — consistent with `TranscriptModal` pattern.
- D-09: Modal fields: `question_bm`, `question_en`, `answer_bm`, `answer_en`, `category`, `is_active`.
- D-10: BM/EN toggle on table view — switches which language columns display, not a filter.
- D-11: Active/inactive switch — inline in table row, PATCH `/api/kb/[id]` on toggle immediately.
- D-12: "Sync to ElevenLabs" POST `/api/kb/sync` — fetches active entries, calls EL Agent API PATCH, shows spinner + toast.
- D-13: EL sync failure shows error toast — does not block KB usage. Supabase is source of truth.
- D-14: New routes: `/api/kb/route.ts` (GET + POST), `/api/kb/[id]/route.ts` (PATCH + DELETE), `/api/kb/sync/route.ts` (POST).

**Live Monitor**
- D-15: Active voice sessions — backend calls EL Conversations API `GET /v1/convai/conversations?agent_id={id}&status=active` per client request. No background job.
- D-16: Active WA chats — query `sessions` table where `expires_at > now()`. Table exists from Phase 3.
- D-17: New route `/api/live-monitor/status` returns `{ voice_sessions, chat_sessions, voice_count, chat_count }`.
- D-18: Client-side `setInterval` every 10 000ms. No SSE. "Updated Ns ago" timestamp. Pauses when tab hidden.
- D-19: Manual "Refresh now" button. Auto-refresh pauses on `visibilityState === 'hidden'`.

**Staff Management**
- D-20: Shadcn `Dialog` for add/edit staff.
- D-21: Add user via Supabase Admin `inviteUserByEmail()` server-side with `SUPABASE_SERVICE_ROLE_KEY`.
- D-22: Role assigned at invite time — stored in `users` table.
- D-23: Pending users shown with "Pending" badge and "Resend invite" action.
- D-24: Remove user — confirmation dialog → delete from `users` table + Supabase Admin `deleteUser()`.

**Integrations — Health Checks**
- D-25: New route `/api/integrations/status` — server-side checks, returns status object for all 5 services.
- D-26: ElevenLabs check — GET agent info from EL API; `ok` if agent responds.
- D-27: Supabase check — row count on `calls` table; `ok` if responds.
- D-28: n8n check — GET to health endpoint if `N8N_BASE_URL` set; `pending` otherwise.
- D-29: Meta WA check — `pending` until `META_WA_ACCESS_TOKEN` set; no Meta API call.
- D-30: Anam AI — always `ready` (embed-only).

**Integrations — Action Buttons**
- D-31 to D-36: Per-card actions locked. Merchant seed card stays on Integrations page in a "Database" section.

### Claude's Discretion
- Pagination size for KB and Staff tables (suggest 25 rows)
- Loading skeleton row count
- Exact empty state copy (use `t()` pattern)
- Intensity scaling formula for peak heatmap cells
- Whether to extend `/api/analytics/summary` or add a new `/api/analytics/charts` route
- Merchant seed card placement on Integrations page (keep or move to Settings)
- Last-refreshed timestamp format on Live Monitor

### Deferred Ideas (OUT OF SCOPE)
- Real-time WebSocket Live Monitor
- ElevenLabs two-way KB sync (pull from EL to Supabase)
- Staff bulk import (CSV upload)
- Analytics export to Excel
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| PAGE-06 | Analytics page — period selector, 4 charts (volume bar, CSAT trend, language pie, peak heatmap), category breakdown table | New `/api/analytics/charts` route using pattern from existing `/api/analytics/summary`; Recharts 3 BarChart/LineChart/PieChart verified installed; CSS grid heatmap approach confirmed via color-mix usage in existing components |
| PAGE-07 | Knowledge Base page — CRUD table, BM/EN toggle, active/inactive switch, Sync to ElevenLabs button | 3 new API routes; EL Agent PATCH API documented; `TranscriptModal` Dialog pattern is the direct template; `@supabase/supabase-js` v2.103.0 handles all CRUD |
| PAGE-08 | Staff Management page — user table, add/edit/remove, role select, last login display | Supabase Admin `inviteUserByEmail()` and `deleteUser()` confirmed on prototype chain of service-role client; `createClient` from `@supabase/supabase-js` directly (not SSR client) required — same pattern as `session-manager.ts` |
| PAGE-09 | Integrations page — 5 status cards with live status and action buttons | Existing page has partial implementation to extend; `N8N_BASE_URL` and `META_WA_ACCESS_TOKEN` env var presence drives status logic; EL agent health check via existing `ELEVENLABS_API_KEY` + `ELEVENLABS_AGENT_ID` |
| PAGE-10 | Live Monitor page — active voice sessions from EL API, active WA chats from sessions table, auto-refresh every 10s | `sessions` table exists with `expires_at` field (Phase 3 confirmed); EL Conversations API endpoint documented; `document.visibilityState` + `setInterval` pattern is standard client-side Web API |
</phase_requirements>

---

## Summary

Phase 5 builds five staff-facing pages on top of a mature, established codebase. All five page stubs already exist — the work is replacing placeholder content with working implementations. Phases 1–4 established the patterns (Dialog modals via `TranscriptModal`, table + skeleton + empty state via `RecentInteractions`, service-role Supabase client via `session-manager.ts`, CSS variable theming, `t(key, language)` translations) that Phase 5 should replicate, not reinvent.

The stack is locked and verified: Next.js 16.2.3 + React 19.2.4, Recharts 3.8.1 (all required chart components confirmed exported), Supabase JS 2.103.0 (Admin methods confirmed via prototype inspection), Shadcn components installed (calendar and popover need adding via `npx shadcn add`), and `color-mix()` already used in 5 existing components confirming browser support in the project's target environment.

The most technically novel element is the peak heatmap — a pure CSS grid with `color-mix()` shading, not a Recharts component. This is straightforward but requires careful intensity normalization (divide by max count, floor to minimum 5%) to prevent empty cells from being invisible on dark theme. The second area needing care is Staff Management: Supabase Admin methods (`inviteUserByEmail`, `deleteUser`) are on the prototype of a service-role client created via `createClient()` from `@supabase/supabase-js` directly — NOT from `@supabase/ssr`'s `createClient`, which uses cookies and the anon key. The pattern already exists in `lib/chatbot/session-manager.ts`.

**Primary recommendation:** Build each page in a self-contained wave — API route(s) first, then page component, then child components — using the `TranscriptModal` + `RecentInteractions` patterns as the direct templates for all Dialog and Table work.

---

## Standard Stack

### Core (all verified installed)
| Library | Version | Purpose | Verified |
|---------|---------|---------|---------|
| Next.js | 16.2.3 | App Router framework | [VERIFIED: package.json] |
| React | 19.2.4 | UI rendering | [VERIFIED: package.json] |
| @supabase/supabase-js | 2.103.0 | Database + Auth Admin SDK | [VERIFIED: package.json] |
| @supabase/ssr | 0.10.2 | Server-side Supabase client | [VERIFIED: package.json] |
| Recharts | 3.8.1 | Charts (BarChart, LineChart, PieChart) | [VERIFIED: node_modules/recharts/package.json] |
| Lucide React | 1.8.0 | Icons | [VERIFIED: package.json] |
| Sonner | 2.0.7 | Toast notifications | [VERIFIED: package.json] |
| Tailwind CSS | 4 | Styling | [VERIFIED: package.json] |

### Shadcn Components — Installed vs. Needs Adding
| Component | Status | Notes |
|-----------|--------|-------|
| button, dialog, tabs, select, switch, table, input, label, badge, skeleton, separator, card, sonner | Installed | [VERIFIED: components/ui/ directory listing] |
| `calendar` | NOT installed | Required for custom date range picker — `npx shadcn add calendar` |
| `popover` | NOT installed | Required to wrap calendar inline — `npx shadcn add popover` |
| `alert-dialog` | NOT installed | Required for destructive confirmations (KB delete, staff remove) — `npx shadcn add alert-dialog` |

**Installation command:**
```bash
npx shadcn add calendar popover alert-dialog
```

Note: Shadcn `calendar` component depends on `react-day-picker`. [ASSUMED] — verify it gets installed automatically by shadcn CLI. If not, run `npm install react-day-picker` separately. The project currently has no `react-day-picker` or `date-fns` in package.json.

### Recharts 3 — Confirmed Exports
```typescript
// All verified via node_modules introspection [VERIFIED: node -e require check]
import {
  BarChart, Bar,
  LineChart, Line,
  PieChart, Pie,
  XAxis, YAxis,
  CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ReferenceLine
} from 'recharts'
```

### Supabase Admin SDK — Critical Distinction
| Use Case | Client Factory | Key Used |
|----------|---------------|---------|
| All standard CRUD, auth checks | `createClient()` from `@supabase/ssr` | `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| Admin: `inviteUserByEmail`, `deleteUser` | `createClient()` from `@supabase/supabase-js` directly | `SUPABASE_SERVICE_ROLE_KEY` |

[VERIFIED: prototype chain inspection — `inviteUserByEmail` and `deleteUser` confirmed on `auth.admin` prototype when using `@supabase/supabase-js` createClient]

**Established pattern (copy from session-manager.ts):**
```typescript
// Source: mykasih-crm/lib/chatbot/session-manager.ts — verified pattern
import { createClient as createServiceClient } from '@supabase/supabase-js'

function getAdminClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// Usage in API route:
const supabase = getAdminClient()
await supabase.auth.admin.inviteUserByEmail(email, { data: { name, role } })
await supabase.auth.admin.deleteUser(userId)
```

---

## Architecture Patterns

### Recommended Project Structure for Phase 5

```
app/
├── (dashboard)/
│   ├── analytics/page.tsx          ← REPLACE stub content
│   ├── knowledge-base/page.tsx     ← REPLACE stub content
│   ├── staff/page.tsx              ← REPLACE stub content
│   ├── integrations/page.tsx       ← EXTEND existing (keep merchant seed logic)
│   └── live-monitor/page.tsx       ← REPLACE stub content
└── api/
    ├── analytics/
    │   ├── summary/route.ts        ← existing — do not touch
    │   └── charts/route.ts         ← NEW — period-aware chart data
    ├── kb/
    │   ├── route.ts                ← NEW — GET all + POST new
    │   ├── [id]/route.ts           ← NEW — PATCH + DELETE
    │   └── sync/route.ts           ← NEW — POST sync to ElevenLabs
    ├── staff/
    │   ├── invite/route.ts         ← NEW — POST inviteUserByEmail
    │   └── [id]/route.ts           ← NEW — PATCH role + DELETE user
    ├── integrations/
    │   └── status/route.ts         ← NEW — GET health checks for all 5 services
    └── live-monitor/
        └── status/route.ts         ← NEW — GET voice + chat active sessions

components/
├── analytics/
│   ├── PeriodSelector.tsx
│   ├── VolumeBarChart.tsx          ← extends CallVolumeChart.tsx pattern
│   ├── CsatTrendChart.tsx
│   ├── LanguagePieChart.tsx
│   ├── PeakHeatmap.tsx             ← CSS grid, no Recharts
│   └── CategoryTable.tsx
├── knowledge-base/
│   ├── KbTable.tsx
│   └── KbEntryModal.tsx            ← extends TranscriptModal pattern
├── staff/
│   ├── StaffTable.tsx
│   ├── StaffInviteModal.tsx
│   └── StaffEditRoleModal.tsx
├── integrations/
│   └── IntegrationCard.tsx
└── live-monitor/
    ├── VoiceSessionCard.tsx
    └── ChatSessionCard.tsx
```

### Pattern 1: Dialog Modal (KB and Staff)
**What:** Shadcn Dialog wrapping a form — same shell as TranscriptModal but with form fields instead of transcript display.
**When to use:** Add/Edit KB entries, Invite Staff, Edit Role.
**Template:** `components/calls/TranscriptModal.tsx` — the Dialog open/close, loading state, and error handling structure is the exact pattern to replicate.

```typescript
// Source: mykasih-crm/components/calls/TranscriptModal.tsx (verified)
// Minimal shell — replicate this exactly
<Dialog open={open} onOpenChange={onOpenChange}>
  <DialogContent
    className="max-w-[600px]"
    style={{ background: 'var(--bg-surface)', border: '1px solid var(--bg-border)' }}
  >
    <DialogHeader>
      <DialogTitle className="text-[var(--text-primary)]">{title}</DialogTitle>
    </DialogHeader>
    {/* form fields here */}
  </DialogContent>
</Dialog>
```

### Pattern 2: Table + Skeleton + Empty State
**What:** Full-width Shadcn Table with 5 skeleton rows on load and centered icon + text on empty.
**When to use:** KB table, Staff table.
**Template:** `components/dashboard/RecentInteractions.tsx` — the loading/empty/data ternary, Skeleton height, and Inbox icon + `py-16` empty state pattern.

```typescript
// Source: mykasih-crm/components/dashboard/RecentInteractions.tsx (verified)
// Loading state
{loading ? (
  <div aria-busy="true" className="px-5 pb-5 space-y-3">
    {Array.from({ length: 5 }).map((_, i) => (
      <Skeleton key={i} className="h-10 w-full bg-[var(--bg-border)]" />
    ))}
  </div>
) : data.length === 0 ? (
  <div className="flex flex-col items-center justify-center py-16 px-5">
    <IconName className="w-8 h-8 text-[var(--text-muted)] mb-3" />
    <p className="text-sm font-semibold text-[var(--text-primary)] mb-1">{heading}</p>
    <p className="text-xs text-[var(--text-muted)] text-center max-w-xs">{body}</p>
  </div>
) : (
  <Table>...</Table>
)}
```

### Pattern 3: Service-Role Supabase Client (Staff routes + Live Monitor)
**What:** Create `@supabase/supabase-js` client directly with service role key for Admin API calls.
**When to use:** Staff invite, delete user, Live Monitor sessions query (sessions table needs service role because RLS may block anon reads).
**Template:** `lib/chatbot/session-manager.ts` — the `getServiceClient()` function is the exact pattern.

### Pattern 4: Client-side fetch with useEffect
**What:** `useState<boolean>(false)` for loading + `useEffect` + `fetch('/api/...')`.
**When to use:** All 5 pages — they are all `'use client'` components matching the dashboard home pattern.
**Template:** `app/(dashboard)/voice-calls/page.tsx` and `app/(dashboard)/integrations/page.tsx`.

### Pattern 5: CSS Variable Color References
**What:** Never hardcode hex — always `var(--token-name)` via className or inline style.
**Examples verified in codebase:**
```typescript
// className approach (preferred for static):
className="text-[var(--text-primary)]"
className="bg-[var(--bg-surface)] border border-[var(--bg-border)]"

// style approach (required for dynamic/computed):
style={{ color: 'var(--status-green)' }}
style={{ background: `color-mix(in srgb, var(--accent-primary) ${intensity}%, var(--bg-surface))` }}
```

### Anti-Patterns to Avoid
- **Using `@supabase/ssr` createClient for Admin operations:** Admin methods (`inviteUserByEmail`, `deleteUser`) are only available on the `@supabase/supabase-js` client created with the service role key. The SSR client uses the anon key and does not expose `auth.admin` admin methods.
- **Importing Recharts in Server Components:** All Recharts components require client-side rendering — `'use client'` directive is mandatory on all chart components.
- **Hardcoding hex values:** Five existing components use CSS variables correctly — don't break the pattern.
- **Swallowing sync errors silently:** D-13 explicitly requires error toast on EL sync failure. The existing integrations page has a comment "Error handling — toast notifications deferred to Phase 5" — this is the queue to fix.
- **Calling EL API from client:** All external API calls (EL, health checks) must go through Next.js API routes — never expose `ELEVENLABS_API_KEY` to the browser.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Date range picker UI | Custom calendar component | Shadcn `calendar` + `popover` | Radix-based, accessible, matches design system |
| Confirmation dialogs | Custom modal with state | Shadcn `alert-dialog` | Focus trapping, keyboard handling, accessible by default |
| Toast notifications | Custom toast state | Sonner (`toast()`) — already installed | Used in Phase 4; consistent UX |
| Relative time formatting | Custom date math | Reuse `formatRelativeTime` from `CallsTable.tsx` | Already exported; exact same logic needed |
| Table pagination | Custom pagination | Follow Phase 4 pattern — manual page state + API `?page=N` | Consistent with existing pages |
| Stacked bar chart | SVG from scratch | Recharts `BarChart` with `stackId="a"` | Pattern exists in `CallVolumeChart.tsx` |

**Key insight:** Every complex UI problem in Phase 5 has a direct precedent in Phases 1-4. The planner should reference the existing component rather than spec a new approach.

---

## Common Pitfalls

### Pitfall 1: Supabase Admin Client Confusion
**What goes wrong:** Using the `@supabase/ssr` server client for staff invite/delete calls; the `auth.admin` object exists but admin methods are absent without service role key.
**Why it happens:** The SSR client uses the anon key and only exposes user-facing auth. Admin methods require `SUPABASE_SERVICE_ROLE_KEY`.
**How to avoid:** Use `createClient` from `@supabase/supabase-js` directly (not from `@supabase/ssr`) with `SUPABASE_SERVICE_ROLE_KEY`. Confirmed pattern in `session-manager.ts`.
**Warning signs:** `supabase.auth.admin.inviteUserByEmail is not a function` at runtime.

### Pitfall 2: Recharts in Server Component
**What goes wrong:** Recharts uses browser APIs (ResizeObserver for ResponsiveContainer) — importing in a Server Component crashes the build.
**Why it happens:** Next.js 16 App Router defaults to Server Components; forgetting `'use client'` on chart wrapper components.
**How to avoid:** All chart components (`VolumeBarChart`, `CsatTrendChart`, `LanguagePieChart`) must have `'use client'` at the top. Verified: existing `CallVolumeChart.tsx` does this correctly.
**Warning signs:** `Error: ResizeObserver is not defined` or similar at build/runtime.

### Pitfall 3: Heatmap Cell Invisible on Empty
**What goes wrong:** Setting intensity to 0 for zero-count cells causes them to be indistinguishable from the page background on dark theme.
**Why it happens:** `color-mix(in srgb, var(--accent-primary) 0%, var(--bg-surface))` == `var(--bg-surface)`.
**How to avoid:** Per UI-SPEC, use a minimum intensity of 5%: `Math.max(5, Math.round((count / maxCount) * 100))`. When `maxCount === 0` (no data at all), render all cells at 5%.
**Warning signs:** Users cannot see the 7×24 grid structure at all on first load.

### Pitfall 4: `setInterval` Leaking on Unmount
**What goes wrong:** Live Monitor auto-refresh continues running after navigating away, causing state updates on unmounted components and console warnings.
**Why it happens:** `setInterval` is not cleaned up in `useEffect` return function.
**How to avoid:**
```typescript
// Source pattern — React useEffect cleanup
useEffect(() => {
  const id = setInterval(fetchStatus, 10000)
  return () => clearInterval(id)  // CRITICAL cleanup
}, [])
```
**Warning signs:** "Can't perform a React state update on an unmounted component" in console.

### Pitfall 5: ElevenLabs API — Wrong Auth Header
**What goes wrong:** EL API returns 401 because the auth header format is wrong.
**Why it happens:** EL API requires `xi-api-key: {ELEVENLABS_API_KEY}` header, not Bearer token format.
**How to avoid:**
```typescript
// Correct ElevenLabs API auth [ASSUMED — based on EL docs pattern; verify against ELEVENLABS_API_KEY usage in existing webhook routes]
headers: { 'xi-api-key': process.env.ELEVENLABS_API_KEY! }
```
**Warning signs:** 401 from EL API in `/api/integrations/status` or `/api/kb/sync`.

### Pitfall 6: Translations Missing Phase 5 Keys
**What goes wrong:** `t(key, language)` call throws TypeScript error because `translations` object doesn't have the new key.
**Why it happens:** `TranslationKey` is a `keyof typeof translations` union — adding a string not in the object fails type-check.
**How to avoid:** Add all Phase 5 copy keys to `lib/translations.ts` in Wave 0 (or first task), before any page component references them. The UI-SPEC copywriting contract lists all required keys.
**Warning signs:** TypeScript error "Argument of type '...' is not assignable to parameter of type 'TranslationKey'".

### Pitfall 7: Pending User Detection in Staff Table
**What goes wrong:** Supabase Auth's `inviteUserByEmail()` creates an auth user but the `users` table row insert timing may differ from when auth record is confirmed.
**Why it happens:** The invite creates an auth record immediately. The `users` row is inserted by the invite API route, but `last_login` is null until the user accepts and logs in.
**How to avoid:** Define "Pending" as: user exists in `users` table but `last_login IS NULL`. This is safe — a confirmed user always has a login timestamp after first sign-in.
**Warning signs:** Accepted users still showing "Pending" badge.

---

## API Routes to Build — Supabase Query Reference

### `/api/analytics/charts` — GET

Required query parameters: `period` (today|week|month|3months|custom), `from` (ISO date), `to` (ISO date).

```typescript
// Returns one object with all chart data:
{
  stats: { totalInteractions, avgCsat, resolutionRate, peakHour },
  volume: Array<{ label: string; voice: number; chat: number }>,
  csat: Array<{ label: string; avg: number }>,          // null entries allowed
  language: Array<{ name: string; value: number }>,     // BM | EN | Mixed
  heatmap: Array<{ day: number; hour: number; count: number }>, // 0-6, 0-23
  categories: Array<{ category: string; voice: number; chat: number; total: number; pct: string }>
}
```

Key Supabase queries needed:
```typescript
// Volume — group by day (use timestamp field, filter is_test=false + date range)
supabase.from('calls').select('channel, timestamp').eq('is_test', false).gte('timestamp', from).lte('timestamp', to)

// CSAT — average per day/week
supabase.from('calls').select('csat_rating, timestamp').eq('is_test', false).not('csat_rating', 'is', null).gte('timestamp', from)

// Language breakdown
supabase.from('calls').select('language').eq('is_test', false).gte('timestamp', from)

// Heatmap — all timestamps in period; group client-side by day-of-week + hour
supabase.from('calls').select('timestamp').eq('is_test', false).gte('timestamp', from).lte('timestamp', to)

// Category breakdown with channel split
supabase.from('calls').select('category, channel').eq('is_test', false).gte('timestamp', from)
```

Note: Supabase JS SDK does not support SQL `GROUP BY` natively. All grouping is done client-side in the route handler after fetching rows. This is the same approach used in the existing `/api/analytics/summary` route. [VERIFIED: confirmed by reading existing route which does all grouping in JS]

### `/api/kb/route.ts` — GET + POST

```typescript
// GET — paginated list, all entries
supabase.from('kb_entries').select('*', { count: 'exact' }).order('last_updated', { ascending: false }).range(offset, offset + limit - 1)

// POST — insert new entry
supabase.from('kb_entries').insert({ question_bm, question_en, answer_bm, answer_en, category, is_active, updated_by: user.email }).select().single()
```

### `/api/kb/[id]/route.ts` — PATCH + DELETE

```typescript
// PATCH — update fields (partial update — use spread)
supabase.from('kb_entries').update({ ...updates, last_updated: new Date().toISOString(), updated_by: user.email }).eq('id', id)

// DELETE
supabase.from('kb_entries').delete().eq('id', id)
```

### `/api/kb/sync/route.ts` — POST

```typescript
// 1. Fetch all active entries
const { data } = await supabase.from('kb_entries').select('*').eq('is_active', true)

// 2. Format as knowledge document (plain text or structured prompt)
const knowledgeDoc = data.map(e => `Q: ${e.question_en}\nA: ${e.answer_en}`).join('\n\n')

// 3. Call EL Agent API
const elRes = await fetch(`https://api.elevenlabs.io/v1/convai/agents/${AGENT_ID}`, {
  method: 'PATCH',
  headers: { 'xi-api-key': ELEVENLABS_API_KEY, 'Content-Type': 'application/json' },
  body: JSON.stringify({ conversation_config: { agent: { prompt: { prompt: knowledgeDoc } } } })
})
// 4. Return ok/error — Supabase always stays as source of truth
```

[ASSUMED] — The EL Agent PATCH body structure (`conversation_config.agent.prompt.prompt`) is based on ElevenLabs Conversational AI documentation pattern. Verify against EL API docs before implementing. The route URL format `PATCH /v1/convai/agents/{agent_id}` is from CONTEXT.md (D-12, canonical_refs).

### `/api/staff/invite/route.ts` — POST

```typescript
// Admin client required (service role key)
const adminClient = createServiceClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

// 1. Insert users row first (role data must be stored before invite acceptance)
await adminClient.from('users').insert({ email, name, role, created_at: new Date().toISOString() })

// 2. Invite via Supabase Auth Admin
const { error } = await adminClient.auth.admin.inviteUserByEmail(email, {
  data: { name, role },  // user_metadata passed to auth record
  redirectTo: `${APP_URL}/login`
})
```

[ASSUMED] — `inviteUserByEmail` second argument `redirectTo` field name — confirm against @supabase/supabase-js v2 docs. Method existence confirmed via prototype inspection.

### `/api/staff/[id]/route.ts` — PATCH + DELETE

```typescript
// PATCH — role update only
await supabase.from('users').update({ role }).eq('id', id)

// DELETE — two-step: DB row + Auth user
const adminClient = createServiceClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
await adminClient.from('users').delete().eq('id', id)
await adminClient.auth.admin.deleteUser(id)  // id = Supabase Auth user UUID
```

### `/api/integrations/status/route.ts` — GET

```typescript
// ElevenLabs check
const elRes = await fetch(`https://api.elevenlabs.io/v1/convai/agents/${AGENT_ID}`, {
  headers: { 'xi-api-key': ELEVENLABS_API_KEY }
})
const elevenlabs = elRes.ok ? 'ok' : 'error'

// Supabase check
const { error: sbError } = await supabase.from('calls').select('*', { count: 'exact', head: true }).limit(1)
const supabaseStatus = sbError ? 'error' : 'ok'

// n8n check
const n8nUrl = process.env.N8N_BASE_URL
const n8n = n8nUrl
  ? await fetch(`${n8nUrl}/healthz`).then(r => r.ok ? 'ok' : 'error').catch(() => 'error')
  : 'pending'

// Meta WA — static
const meta_wa = process.env.META_WA_ACCESS_TOKEN ? 'ok' : 'pending'

// Anam AI — always ready
return { elevenlabs, supabase: supabaseStatus, n8n, meta_wa, anam_ai: 'ready' }
```

### `/api/live-monitor/status/route.ts` — GET

```typescript
// Active WA chats from sessions table (service role — RLS may block anon)
const adminClient = createServiceClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
const { data: chatSessions } = await adminClient
  .from('sessions')
  .select('id, wa_phone, intent, created_at, expires_at')
  .gt('expires_at', new Date().toISOString())
  .order('created_at', { ascending: false })

// Active voice sessions from ElevenLabs
const elRes = await fetch(
  `https://api.elevenlabs.io/v1/convai/conversations?agent_id=${AGENT_ID}&status=active`,
  { headers: { 'xi-api-key': ELEVENLABS_API_KEY } }
)
const { conversations: voiceSessions = [] } = elRes.ok ? await elRes.json() : {}

return { voice_sessions: voiceSessions, chat_sessions: chatSessions ?? [], voice_count: voiceSessions.length, chat_count: chatSessions?.length ?? 0 }
```

[ASSUMED] — EL Conversations API response shape (`conversations` array key, field names for caller info). Verify against EL API documentation before implementing. The endpoint URL is confirmed from CONTEXT.md D-15.

---

## Code Examples

### Recharts Stacked Bar Chart (Analytics Volume)
Extends existing verified pattern from `CallVolumeChart.tsx`:

```typescript
// Source: mykasih-crm/components/dashboard/CallVolumeChart.tsx (verified — copy pattern)
'use client'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

// For Analytics page — extends to include CartesianGrid and date labels
<ResponsiveContainer width="100%" height={240}>
  <BarChart data={data}>
    <CartesianGrid strokeDasharray="3 3" stroke="var(--bg-border)" vertical={false} />
    <XAxis dataKey="label" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} axisLine={false} tickLine={false} />
    <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 12 }} axisLine={false} tickLine={false} />
    <Tooltip contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--bg-border)', fontSize: 12 }} />
    <Bar dataKey="voice" stackId="a" fill="var(--chart-voice)" name="Voice" />
    <Bar dataKey="chat" stackId="a" fill="var(--chart-chat)" name="Chat" radius={[4, 4, 0, 0]} />
  </BarChart>
</ResponsiveContainer>
```

### Peak Heatmap CSS Grid

```typescript
// Source: UI-SPEC D-05 and design contract (CSS grid approach — no Recharts)
'use client'
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const HOURS = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`)

// Build lookup map: { "0-14": 23, ... } (dayIndex-hour: count)
const countMap = new Map(heatmapData.map(d => [`${d.day}-${d.hour}`, d.count]))
const maxCount = Math.max(...heatmapData.map(d => d.count), 1) // avoid div-by-zero

function cellIntensity(day: number, hour: number): number {
  const count = countMap.get(`${day}-${hour}`) ?? 0
  return count === 0 ? 5 : Math.round((count / maxCount) * 100)
}

// Render: 8-column grid (1 header col + 7 day cols), 25 rows (1 header row + 24 hour rows)
<div style={{ display: 'grid', gridTemplateColumns: '48px repeat(7, 28px)', gap: '2px' }}>
  {/* Header row */}
  <div /> {/* empty corner */}
  {DAYS.map(d => <div key={d} style={{ fontSize: 10, color: 'var(--text-muted)', textAlign: 'center' }}>{d}</div>)}

  {/* Data rows */}
  {HOURS.map((hour, h) => (
    <>
      <div key={`h-${h}`} style={{ fontSize: 10, color: 'var(--text-muted)', lineHeight: '28px' }}>{hour}</div>
      {DAYS.map((_, d) => {
        const intensity = cellIntensity(d, h)
        const count = countMap.get(`${d}-${h}`) ?? 0
        return (
          <div
            key={`${d}-${h}`}
            title={`${DAYS[d]} ${hour} — ${count} interactions`}
            aria-label={`${DAYS[d]} ${hour} — ${count} interactions`}
            style={{
              width: 28, height: 28,
              background: `color-mix(in srgb, var(--accent-primary) ${intensity}%, var(--bg-surface))`,
              borderRadius: 3,
            }}
          />
        )
      })}
    </>
  ))}
</div>
```

### Live Monitor Auto-Refresh with Visibility Pause

```typescript
// Source: D-18/D-19 requirements — standard Web API pattern
'use client'
import { useState, useEffect, useRef } from 'react'

const [lastFetched, setLastFetched] = useState<number>(Date.now())
const [secondsAgo, setSecondsAgo] = useState(0)
const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

function fetchStatus() {
  fetch('/api/live-monitor/status')
    .then(r => r.json())
    .then(data => { /* set state */ setLastFetched(Date.now()); setSecondsAgo(0) })
    .catch(() => { /* set error state */ })
}

function startAutoRefresh() {
  if (intervalRef.current) clearInterval(intervalRef.current)
  intervalRef.current = setInterval(fetchStatus, 10000)
}

useEffect(() => {
  fetchStatus()
  startAutoRefresh()

  // Tick the "N seconds ago" counter
  const ticker = setInterval(() => {
    setSecondsAgo(Math.floor((Date.now() - lastFetched) / 1000))
  }, 1000)

  // Pause/resume on visibility change
  function onVisibilityChange() {
    if (document.visibilityState === 'hidden') {
      if (intervalRef.current) clearInterval(intervalRef.current)
    } else {
      fetchStatus()
      startAutoRefresh()
    }
  }
  document.addEventListener('visibilitychange', onVisibilityChange)

  return () => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    clearInterval(ticker)
    document.removeEventListener('visibilitychange', onVisibilityChange)
  }
}, []) // eslint-disable-line react-hooks/exhaustive-deps
```

### Inline Switch for KB Active Toggle

```typescript
// Pattern: fire PATCH immediately on toggle — no save button needed
// Mirrors the ticket status update pattern from Phase 4
async function handleActiveToggle(id: string, current: boolean) {
  // Optimistic update
  setEntries(prev => prev.map(e => e.id === id ? { ...e, is_active: !current } : e))

  const res = await fetch(`/api/kb/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ is_active: !current }),
  })

  if (!res.ok) {
    // Revert on failure
    setEntries(prev => prev.map(e => e.id === id ? { ...e, is_active: current } : e))
    toast.error('Failed to update entry status')
  }
}
```

---

## Translation Keys to Add (Wave 0)

All of these must be added to `lib/translations.ts` before any page component references them. The current file ends at line 136 with `pagination.showing` and `pagination.of`.

```typescript
// Add to translations object in lib/translations.ts
// Analytics
'page.analytics': { en: 'Analytics', bm: 'Analitik' },
'analytics.totalInteractions': { en: 'Total Interactions', bm: 'Jumlah Interaksi' },
'analytics.avgCsat': { en: 'Avg. CSAT', bm: 'Purata CSAT' },
'analytics.resolutionRate': { en: 'Resolution Rate', bm: 'Kadar Penyelesaian' },
'analytics.peakHour': { en: 'Peak Hour', bm: 'Waktu Puncak' },
'analytics.volume': { en: 'Interaction Volume', bm: 'Jumlah Interaksi' },
'analytics.csatTrend': { en: 'CSAT Trend', bm: 'Trend CSAT' },
'analytics.languageSplit': { en: 'Language Split', bm: 'Pecahan Bahasa' },
'analytics.peakHeatmap': { en: 'Peak Hours Heatmap', bm: 'Peta Haba Waktu Puncak' },
'analytics.categoryBreakdown': { en: 'Category Breakdown', bm: 'Pecahan Kategori' },
'empty.noCsat.heading': { en: 'No CSAT ratings yet', bm: 'Tiada penilaian CSAT lagi' },
'empty.noCsat.body': { en: 'Ratings appear after calls are scored', bm: 'Penilaian akan dipaparkan selepas panggilan dinilai' },
'error.loadAnalytics': { en: 'Failed to load analytics. Try refreshing the page.', bm: 'Gagal memuatkan analitik. Cuba muat semula halaman.' },

// Knowledge Base
'page.knowledgeBase': { en: 'Knowledge Base', bm: 'Pangkalan Ilmu' },
'kb.addEntry': { en: 'Add Entry', bm: 'Tambah Entri' },
'kb.syncToElevenLabs': { en: 'Sync to ElevenLabs', bm: 'Segerak ke ElevenLabs' },
'kb.syncing': { en: 'Syncing...', bm: 'Menyegerak...' },
'kb.addModal.title': { en: 'Add KB Entry', bm: 'Tambah Entri KB' },
'kb.editModal.title': { en: 'Edit KB Entry', bm: 'Edit Entri KB' },
'kb.saveEntry': { en: 'Save Entry', bm: 'Simpan Entri' },
'kb.discardChanges': { en: 'Discard changes', bm: 'Buang perubahan' },
'kb.deleteConfirm': { en: 'Delete this KB entry? This cannot be undone.', bm: 'Padam entri KB ini? Tindakan ini tidak boleh dibatalkan.' },
'kb.keepEntry': { en: 'Keep entry', bm: 'Simpan entri' },
'kb.syncSuccess': { en: 'Knowledge base synced to ElevenLabs', bm: 'Pangkalan pengetahuan disegerakkan ke ElevenLabs' },
'kb.syncError': { en: 'Sync failed. Try again.', bm: 'Segerak gagal. Cuba lagi.' },
'empty.noKbEntries.heading': { en: 'No knowledge base entries', bm: 'Tiada entri pangkalan pengetahuan' },
'empty.noKbEntries.body': { en: 'Add your first entry to get started.', bm: 'Tambah entri pertama anda untuk bermula.' },
'error.loadKb': { en: 'Failed to load knowledge base. Try refreshing the page.', bm: 'Gagal memuatkan pangkalan pengetahuan. Cuba muat semula halaman.' },

// Staff
'page.staff': { en: 'Staff Management', bm: 'Pengurusan Kakitangan' },
'staff.inviteStaff': { en: 'Invite Staff', bm: 'Jemput Kakitangan' },
'staff.inviteModal.title': { en: 'Invite Staff Member', bm: 'Jemput Ahli Kakitangan' },
'staff.sendInvite': { en: 'Send Invite', bm: 'Hantar Jemputan' },
'staff.discard': { en: 'Discard', bm: 'Buang' },
'staff.editRoleModal.title': { en: 'Change Role', bm: 'Tukar Peranan' },
'staff.updateRole': { en: 'Update Role', bm: 'Kemaskini Peranan' },
'staff.keepRole': { en: 'Keep current role', bm: 'Kekalkan peranan semasa' },
'staff.removeConfirm': { en: 'They will lose access immediately.', bm: 'Mereka akan kehilangan akses serta-merta.' },
'staff.remove': { en: 'Remove', bm: 'Buang' },
'staff.keepMember': { en: 'Keep member', bm: 'Kekalkan ahli' },
'empty.noStaff.heading': { en: 'No staff members', bm: 'Tiada ahli kakitangan' },
'empty.noStaff.body': { en: 'Invite your first team member to get started.', bm: 'Jemput ahli pasukan pertama anda untuk bermula.' },
'error.loadStaff': { en: 'Failed to load staff. Try refreshing the page.', bm: 'Gagal memuatkan kakitangan. Cuba muat semula halaman.' },

// Integrations
'page.integrations': { en: 'Integrations', bm: 'Integrasi' },
'integrations.refreshStatus': { en: 'Refresh Status', bm: 'Muat Semula Status' },
'integrations.copyWebhook': { en: 'Copy Webhook URL', bm: 'Salin URL Webhook' },
'integrations.webhookCopied': { en: 'Webhook URL copied', bm: 'URL webhook telah disalin' },
'error.integrations': { en: 'Status check failed. Try refreshing.', bm: 'Semakan status gagal. Cuba muat semula.' },

// Live Monitor
'page.liveMonitor': { en: 'Live Monitor', bm: 'Monitor Langsung' },
'liveMonitor.voiceSessions': { en: 'Active Voice Sessions', bm: 'Sesi Suara Aktif' },
'liveMonitor.chatSessions': { en: 'Active Chat Sessions', bm: 'Sesi Chat Aktif' },
'liveMonitor.refreshNow': { en: 'Refresh Now', bm: 'Muat Semula' },
'liveMonitor.unknownCaller': { en: 'Unknown Caller', bm: 'Pemanggil Tidak Diketahui' },
'empty.noVoiceSessions.heading': { en: 'No active voice sessions', bm: 'Tiada sesi suara aktif' },
'empty.noVoiceSessions.body': { en: 'Live sessions appear here when calls are in progress.', bm: 'Sesi langsung dipaparkan di sini apabila panggilan sedang berlangsung.' },
'empty.noChatSessions.heading': { en: 'No active chat sessions', bm: 'Tiada sesi sembang aktif' },
'empty.noChatSessions.body': { en: 'Live sessions appear here when WhatsApp conversations are in progress.', bm: 'Sesi langsung dipaparkan di sini apabila perbualan WhatsApp sedang berlangsung.' },
'error.liveMonitor': { en: 'Could not load live sessions. Check your connection and try again.', bm: 'Tidak dapat memuatkan sesi langsung. Semak sambungan anda dan cuba lagi.' },
```

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Jest 30.3.0 + ts-jest 29.4.9 |
| Config file | `jest.config.ts` (project root) |
| Quick run command | `npx jest --testPathPattern=phase5 --passWithNoTests` |
| Full suite command | `npx jest` |

[VERIFIED: jest, @types/jest, ts-jest, jest-environment-jsdom all in devDependencies]

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | Notes |
|--------|----------|-----------|-------------------|-------|
| PAGE-06 | Analytics charts API returns correct shape for each period | Unit (API route) | `npx jest --testPathPattern=analytics` | Test date grouping logic for volume/heatmap |
| PAGE-06 | Period "today" returns only today's records | Unit (API route) | same | Boundary condition test |
| PAGE-06 | CSAT returns empty array when no ratings | Unit (API route) | same | Empty state trigger |
| PAGE-07 | GET /api/kb returns paginated list | Unit (API route) | `npx jest --testPathPattern=kb` | Mock Supabase client |
| PAGE-07 | POST /api/kb inserts entry with all fields | Unit (API route) | same | Validate required fields |
| PAGE-07 | PATCH /api/kb/[id] updates is_active | Unit (API route) | same | The inline toggle path |
| PAGE-07 | DELETE /api/kb/[id] removes entry | Unit (API route) | same | |
| PAGE-07 | POST /api/kb/sync returns error when EL API fails | Unit (API route) | same | Verify error propagation, not swallowed |
| PAGE-08 | POST /api/staff/invite calls inviteUserByEmail | Unit (API route) | `npx jest --testPathPattern=staff` | Mock Supabase Admin |
| PAGE-08 | DELETE /api/staff/[id] calls both deleteUser and table delete | Unit (API route) | same | Both steps verified |
| PAGE-09 | GET /api/integrations/status returns all 5 keys | Unit (API route) | `npx jest --testPathPattern=integrations` | |
| PAGE-09 | n8n returns "pending" when N8N_BASE_URL not set | Unit (API route) | same | Env var conditional |
| PAGE-10 | GET /api/live-monitor/status queries sessions where expires_at > now | Unit (API route) | `npx jest --testPathPattern=live-monitor` | |
| PAGE-10 | Returns empty arrays when no active sessions | Unit (API route) | same | Empty state path |

### Sampling Rate
- Per task commit: `npx jest --testPathPattern=(analytics|kb|staff|integrations|live-monitor) --passWithNoTests`
- Per wave merge: `npx jest`
- Phase gate: Full suite green before `/gsd-verify-work`

### Wave 0 Gaps (test files to create before implementation)
- [ ] `mykasih-crm/__tests__/api/analytics/charts.test.ts` — covers PAGE-06 date grouping logic
- [ ] `mykasih-crm/__tests__/api/kb/kb.test.ts` — covers PAGE-07 CRUD + sync error path
- [ ] `mykasih-crm/__tests__/api/staff/staff.test.ts` — covers PAGE-08 invite + delete
- [ ] `mykasih-crm/__tests__/api/integrations/status.test.ts` — covers PAGE-09 health checks
- [ ] `mykasih-crm/__tests__/api/live-monitor/status.test.ts` — covers PAGE-10 session query

Existing test pattern from Phase 3/4 (confirmed from STATE.md decisions):
- Use `@jest-environment node` for API route tests (not jsdom)
- Mock `@supabase/ssr` and `@supabase/supabase-js` via `jest.mock()` with `_cfg` mutable object pattern
- Test files live in `__tests__/` (check existing location — STATE.md confirms this pattern from Phase 3)

### Edge Cases and Error States per Page

**Analytics (PAGE-06):**
- Zero interactions in period → all chart arrays empty → each chart shows empty state independently
- Period "today" with no interactions → volume chart shows 0 bars (not empty state, just zero values)
- CSAT: all calls in period have no rating → show "No CSAT ratings yet" empty state instead of chart
- maxCount === 0 on heatmap → all cells render at 5% intensity (minimum)
- Custom date range: `from > to` → API returns 400 with error message

**Knowledge Base (PAGE-07):**
- 0 entries → empty state with "Add Entry" CTA button
- EL sync with 0 active entries → send empty knowledge doc (API still succeeds; EL may return 200)
- Inline toggle optimistic update must revert on PATCH failure
- Delete while syncing → race condition; sync uses snapshot at time of button click, not real-time

**Staff Management (PAGE-08):**
- Non-admin user navigates to `/staff` → redirect or read-only view (check role in `useEffect` same as Integrations page does)
- Invite to email already in system → Supabase Auth returns error; surface as toast
- Remove self → prevent (check auth user ID vs. row ID before DELETE)

**Integrations (PAGE-09):**
- All env vars missing → most cards show "pending" or "error"; page still renders
- EL API timeout (>5s) → set `AbortController` timeout, return `error` status rather than hanging request
- n8n health endpoint path `/healthz` may differ per deployment [ASSUMED] — verify or use configurable health path

**Live Monitor (PAGE-10):**
- EL API returns non-200 → voice_sessions = [] + log error; don't crash the route
- Tab becomes hidden and visible again → refresh triggers on visibility restore
- Session that expires between poll cycles → disappears naturally on next refresh; no special handling needed
- EL conversation object may not include caller name → use "Unknown Caller" fallback

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|-------------|-----------|---------|---------|
| Node.js | Build + test | Yes | (project runs) | — |
| `recharts` | Chart components | Yes | 3.8.1 | — |
| `@supabase/supabase-js` | Admin SDK (staff + live monitor) | Yes | 2.103.0 | — |
| `@supabase/ssr` | Standard server routes | Yes | 0.10.2 | — |
| `sonner` | Toast notifications | Yes | 2.0.7 | — |
| Shadcn `calendar` | Date range picker | No | — | Install via `npx shadcn add calendar` — blocking for Analytics custom date range |
| Shadcn `popover` | Date range calendar container | No | — | Install via `npx shadcn add popover` — blocking for Analytics custom date range |
| Shadcn `alert-dialog` | Destructive confirmations | No | — | Install via `npx shadcn add alert-dialog` — blocking for KB delete + Staff remove |
| `react-day-picker` | Shadcn calendar dependency | Unknown | — | Likely auto-installed by shadcn CLI |
| ElevenLabs API | Live Monitor voice sessions, KB sync, Integrations check | External service | — | Route returns `error` status if ELEVENLABS_API_KEY not set |
| n8n instance | Integrations health check | External service | — | Returns `pending` status when N8N_BASE_URL not set (D-28) |
| Meta WA API | Integrations status | External / pending approval | — | Static `pending` status until env var set (D-29) |

**Missing dependencies that block features (install before Wave 0):**
- `calendar`, `popover`, `alert-dialog` — run `npx shadcn add calendar popover alert-dialog` as first task in Wave 0

**Missing dependencies with fallback:**
- ElevenLabs, n8n, Meta WA — external services; pages degrade gracefully with status badges

---

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | Yes — all API routes must validate auth | `supabase.auth.getUser()` on every route |
| V4 Access Control | Yes — Staff Management is admin-only | Role check in API routes + UI role guard |
| V5 Input Validation | Yes — KB modal inputs, staff invite form | Validate required fields before Supabase insert; reject empty strings |
| V6 Cryptography | No — no crypto operations in Phase 5 | — |

### Role Enforcement on New API Routes

| Route | Required Role | Check Method |
|-------|--------------|--------------|
| `/api/kb/*` | `mykasih`, `admin` | Read `users.role` after `getUser()` |
| `/api/staff/*` | `admin` only | Read `users.role`; return 403 if not admin |
| `/api/integrations/status` | `admin` only | Read `users.role`; return 403 if not admin |
| `/api/analytics/charts` | `mykasih`, `admin`, `qmedia`, `supervisor` | Any authenticated user |
| `/api/live-monitor/status` | `mykasih`, `admin`, `supervisor` | Role check; `qmedia` excluded |

### Known Threat Patterns

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Unauthenticated access to KB CRUD | Spoofing | `getUser()` check on every route handler |
| Non-admin invoking staff delete | Elevation of Privilege | Role check before Admin SDK call |
| EL API key exposed to browser | Information Disclosure | All EL calls routed through Next.js API routes only — never fetch EL directly from client |
| Sync button spam → EL rate limit | Denial of Service | [ASSUMED] — consider debounce or last-sync timestamp check in `/api/kb/sync`; EL rate limits not confirmed |

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | EL Agent PATCH body uses `conversation_config.agent.prompt.prompt` structure | API Routes (KB sync) | KB sync fails silently or with 400 from EL API; need to check EL docs for correct payload shape |
| A2 | EL Conversations API response has `conversations` array key with caller/duration fields | API Routes (Live Monitor) | Live Monitor shows empty voice sessions even when calls are active |
| A3 | `react-day-picker` is auto-installed when `npx shadcn add calendar` runs | Environment Availability | Need to `npm install react-day-picker` separately if shadcn CLI doesn't add it |
| A4 | `inviteUserByEmail` second arg accepts `{ data: { name, role }, redirectTo }` shape | API Routes (Staff) | Invite succeeds but user_metadata not populated; role must still come from users table |
| A5 | n8n health endpoint is at `{N8N_BASE_URL}/healthz` | API Routes (Integrations) | n8n status check always returns error; workaround: try `/` or make endpoint configurable |
| A6 | EL sync with 0 active KB entries results in a 200 from EL API | KB sync edge case | EL may return 400 on empty prompt; add guard to skip sync and show warning toast if no active entries |
| A7 | Supabase RLS blocks anon reads on `sessions` table | API Routes (Live Monitor) | Live Monitor may work with anon client; service-role is safe regardless |

---

## State of the Art

| Old Approach | Current Approach | Notes |
|--------------|-----------------|-------|
| Recharts v2 `<Tooltip>` cursor styles | Recharts v3 same API | API is stable across v2→v3 for all components in use [VERIFIED: exports check] |
| `pages/` directory routes | App Router `app/` routes | Project fully on App Router from Phase 1 |
| `getServerSideProps` | Server Components + `async` fetch | Not used in this project — all pages are `'use client'` with `useEffect` |

**Deprecated/outdated in this project's context:**
- `next/navigation` `useRouter().push()` for data fetching: Not used — client fetch pattern is `useEffect + fetch('/api/...')` throughout
- `next-auth`: Not used — Supabase Auth handles authentication

---

## Open Questions

1. **EL Conversations API response shape for active voice sessions**
   - What we know: Endpoint is `GET /v1/convai/conversations?agent_id={id}&status=active` (from CONTEXT.md)
   - What's unclear: Field names in the conversation object (caller name, start time, duration)
   - Recommendation: Make the Live Monitor API route defensive — extract only what's available, use fallbacks for null fields; check EL docs before writing the route

2. **EL Agent PATCH payload for KB sync**
   - What we know: Endpoint is `PATCH /v1/convai/agents/{agent_id}` (from CONTEXT.md)
   - What's unclear: Exact JSON body structure to update the agent's knowledge/prompt content
   - Recommendation: Verify against ElevenLabs Conversational AI API docs before implementing `/api/kb/sync`. This is the one external API call with no existing codebase precedent.

3. **`sessions` table message_count field**
   - What we know: The sessions table has `wa_phone`, `intent`, `created_at`, `expires_at` (confirmed from session-manager.ts and types.ts)
   - What's unclear: Whether a `message_count` field exists on `sessions`, or whether it must be counted from `calls.message_count` via a join on the linked call record
   - Recommendation: For Live Monitor chat session cards, check if a message count is available on sessions directly. If not, omit or show "in progress" instead.

---

## Sources

### Primary (HIGH confidence)
- `mykasih-crm/package.json` — all dependency versions verified
- `mykasih-crm/node_modules/recharts/package.json` — version 3.8.1 confirmed
- `mykasih-crm/node_modules/@supabase/supabase-js` — version 2.103.0 confirmed; `inviteUserByEmail` and `deleteUser` confirmed on prototype chain
- `mykasih-crm/components/ui/` directory listing — installed Shadcn components confirmed
- `mykasih-crm/components/dashboard/CallVolumeChart.tsx` — Recharts pattern verified
- `mykasih-crm/lib/chatbot/session-manager.ts` — service-role client pattern verified
- `mykasih-crm/app/api/analytics/summary/route.ts` — existing analytics pattern verified
- `mykasih-crm/app/(dashboard)/integrations/page.tsx` — existing integrations stub verified
- `mykasih-crm/lib/translations.ts` — existing keys verified, Phase 5 additions identified
- `mykasih-crm/lib/chatbot/types.ts` — `sessions` table fields verified
- `05-CONTEXT.md` — all locked decisions D-01 through D-36
- `05-UI-SPEC.md` — interaction contract, component inventory, shadcn add list

### Secondary (MEDIUM confidence)
- Recharts 3 API confirmed stable vs. v2 via exports inspection — all components in scope export correctly
- Supabase JS v2 Admin methods confirmed via prototype chain inspection

### Tertiary (LOW confidence — verify before implementing)
- ElevenLabs Agent PATCH payload structure [ASSUMED: A1]
- ElevenLabs Conversations API response shape [ASSUMED: A2]
- n8n health endpoint path [ASSUMED: A5]

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all verified against installed node_modules
- Architecture: HIGH — all patterns traced to existing codebase files
- API route queries: HIGH — follow verified patterns from phases 1-4
- ElevenLabs external API calls: LOW — endpoints from CONTEXT.md but payload shapes assumed
- Pitfalls: HIGH — traced to specific bugs that would occur given the code as written

**Research date:** 2026-04-12
**Valid until:** 2026-05-12 (stable stack — Next.js/Recharts/Supabase APIs unlikely to change in 30 days)
