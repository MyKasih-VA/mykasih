# Phase 5: Intelligence & System Pages - Context

**Gathered:** 2026-04-12
**Status:** Ready for planning

<domain>
## Phase Boundary

Five staff-facing pages: Analytics (4 charts + category table), Knowledge Base (CRUD, BM/EN, active toggle, EL sync stub), Staff Management (invite-based user admin), Integrations (enhance existing stub with live health checks + action buttons), and Live Monitor (active sessions auto-refresh). All pages are stubs in the codebase — replace content, keep files.

</domain>

<decisions>
## Implementation Decisions

### Analytics: Period Selector
- **D-01:** Presets + custom date range picker — Today / This Week / This Month / Last 3 Months + Custom (opens date range picker). Matches the Phase 4 Voice Calls filter pattern for consistent UX.

### Analytics: Charts
- **D-02:** Volume bar chart — stacked voice vs chat, using `--chart-voice` and `--chart-chat` CSS vars. Recharts `BarChart` (already in stack).
- **D-03:** CSAT trend — line chart showing average CSAT rating over time. If no data, show empty state ("No CSAT ratings yet") — no fake fallback chart.
- **D-04:** Language pie — BM vs EN vs Mixed, using Recharts `PieChart`.
- **D-05:** Peak heatmap — 7 columns (Mon–Sun) × 24 rows (00:00–23:00) grid. Each cell shaded by interaction count. Recharts does not support heatmaps natively — build as a CSS grid with `color-mix(in srgb, var(--accent-primary) {intensity}%, var(--bg-surface))` for cell color. Claude has discretion on intensity scaling.
- **D-06:** Category breakdown table — Category | Voice Count | Chat Count | Total | % of all interactions. Simple Shadcn `Table`, no bar-per-row embellishment.

### Analytics: API
- **D-07:** New API route `/api/analytics/summary` already exists (has `summary` sub-folder). Extend or add `/api/analytics/charts` to return all chart data in one call (period + from + to query params). Claude has discretion on whether to extend existing or add a new route.

### Knowledge Base: Edit UX
- **D-08:** Shadcn `Dialog` modal for add/edit KB entries — consistent with `TranscriptModal` pattern from Phase 4. No page navigation.
- **D-09:** Modal fields: `question_bm`, `question_en`, `answer_bm`, `answer_en`, `category`, `is_active` toggle.
- **D-10:** BM/EN toggle on the table view — switches which language columns are shown (question + answer), not a filter. Both BM and EN always stored.
- **D-11:** Active/inactive switch — inline toggle in the table row (`is_active` column). PATCH `/api/kb/[id]` on toggle.

### Knowledge Base: ElevenLabs Sync
- **D-12:** "Sync to ElevenLabs" button triggers POST `/api/kb/sync`. For POC: route fetches all active `kb_entries`, formats them as a knowledge document, and calls the ElevenLabs Agent API (`PATCH /v1/convai/agents/{agent_id}`) to update the agent's prompt/knowledge. Show loading spinner on button + success toast on completion.
- **D-13:** If the EL API call fails, show an error toast — do not silently swallow. The sync is a best-effort push; KB data in Supabase is always the source of truth.

### Knowledge Base: API
- **D-14:** New routes needed — `/api/kb/route.ts` (GET all + POST new) and `/api/kb/[id]/route.ts` (PATCH + DELETE) and `/api/kb/sync/route.ts` (POST sync to EL). No KB API exists yet.

### Live Monitor: Data Sources
- **D-15:** Active ElevenLabs voice sessions — backend route calls ElevenLabs Conversations API (`GET /v1/convai/conversations?agent_id={AGENT_ID}&status=active`) on each client request. No persistent background job.
- **D-16:** Active WA chat sessions — query `sessions` table where `expires_at > now()`. Sessions table already exists from Phase 3.
- **D-17:** New API route `/api/live-monitor/status` returns `{ voice_sessions: [...], chat_sessions: [...], voice_count: N, chat_count: N }`.

### Live Monitor: Refresh
- **D-18:** Client-side `setInterval` every 10 seconds calling `/api/live-monitor/status`. No SSE. Show last-refreshed timestamp ("Updated 3s ago"). Claude has discretion on exact timestamp format.
- **D-19:** Manual "Refresh now" button alongside auto-refresh. Auto-refresh pauses if the tab is hidden (`document.visibilityState`).

### Staff Management: Add/Edit Flow
- **D-20:** Shadcn `Dialog` modal for add/edit staff — same modal pattern as KB. No page navigation.
- **D-21:** Add new user via Supabase Admin `inviteUserByEmail()` (server-side, using `SUPABASE_SERVICE_ROLE_KEY`). Email invite sent to new staff member. No admin-set passwords.
- **D-22:** Role assigned at invite time — stored in `users` table. Invite creates a `users` row with `role` and `name`; Supabase Auth creates the auth record on acceptance.
- **D-23:** Pending users (invited, not yet accepted) shown with a "Pending" badge and a "Resend invite" action button.
- **D-24:** Remove user — confirmation dialog ("Remove {name}? They will lose access immediately.") → delete from `users` table + Supabase Admin `deleteUser()`.

### Integrations: Health Checks
- **D-25:** New API route `/api/integrations/status` — runs all checks server-side, returns `{ elevenlabs: 'ok'|'error', supabase: 'ok'|'error', n8n: 'pending'|'ok'|'error', meta_wa: 'pending'|'ok', anam_ai: 'ready' }`.
- **D-26:** ElevenLabs check: GET agent info from EL API — if agent responds, status = `ok`.
- **D-27:** Supabase check: simple row count query on `calls` table — if it responds, status = `ok`.
- **D-28:** n8n check: if `N8N_BASE_URL` env var is set, attempt a GET to the n8n health endpoint; otherwise `pending`.
- **D-29:** Meta WA check: static `pending` until `META_WA_ACCESS_TOKEN` env var is set and non-empty — then attempt token validation; no approval status from Meta API.
- **D-30:** Anam AI: always `ready` (embed-only, no API health check needed).

### Integrations: Action Buttons
- **D-31:** ElevenLabs card → "Test connection" button (triggers `/api/integrations/status` EL check inline).
- **D-32:** Meta WA card → "Copy webhook URL" button (copies `/api/webhook/chat` full URL to clipboard).
- **D-33:** n8n card → "Open n8n" external link button (opens `N8N_BASE_URL` in new tab).
- **D-34:** Supabase card → "View project" external link button (opens Supabase dashboard URL from env var or hardcoded project URL).
- **D-35:** Anam AI card → "Open demo" internal link button (navigates to `/demo`).
- **D-36:** Existing Integrations page stub (merchant seed button) — keep the merchant seed card as a separate "Database" card or move to Settings. Claude has discretion.

### Claude's Discretion
- Pagination size for KB table and Staff table (suggest 25 rows)
- Loading skeleton row count
- Exact empty state copy (use `t()` pattern)
- Intensity scaling formula for peak heatmap cells
- Whether to extend `/api/analytics/summary` or add a new `/api/analytics/charts` route
- Merchant seed card placement on Integrations page (keep or move to Settings)
- Last-refreshed timestamp format on Live Monitor

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Design System
- `mykasih-crm/app/globals.css` — all 12 CSS color variables; never hardcode hex
- `CLAUDE.md` (project root) — full color token reference, channel distinction rules, role access table

### Existing Components (extend, don't rebuild)
- `mykasih-crm/components/calls/TranscriptModal.tsx` — Dialog modal pattern to follow for KB edit + Staff edit modals
- `mykasih-crm/components/dashboard/RecentInteractions.tsx` — table row pattern, skeleton, empty state pattern
- `mykasih-crm/components/calls/ChannelBadge.tsx` — voice/chat badge

### Existing API Routes
- `mykasih-crm/app/api/analytics/summary/route.ts` — existing analytics endpoint; extend or supplement for chart data
- `mykasih-crm/app/api/tickets/route.ts` — PATCH pattern for status update (reuse for KB `is_active` PATCH)
- `mykasih-crm/app/api/calls/route.ts` — GET paginated list pattern

### Translations
- `mykasih-crm/lib/translations.ts` — BM/EN string keys; use `t(key, language)` pattern

### Page Stubs (replace content, keep file)
- `mykasih-crm/app/(dashboard)/analytics/page.tsx`
- `mykasih-crm/app/(dashboard)/knowledge-base/page.tsx`
- `mykasih-crm/app/(dashboard)/staff/page.tsx`
- `mykasih-crm/app/(dashboard)/integrations/page.tsx` — partial implementation exists (merchant seed, role check)
- `mykasih-crm/app/(dashboard)/live-monitor/page.tsx`

### External APIs
- ElevenLabs Conversations API: `GET /v1/convai/conversations?agent_id={id}&status=active`
- ElevenLabs Agent API: `PATCH /v1/convai/agents/{agent_id}` — for KB sync
- Supabase Admin SDK: `inviteUserByEmail()`, `deleteUser()` — staff management

### Database
- `sessions` table (Phase 3) — `expires_at` field used for active WA chat detection on Live Monitor
- `kb_entries` table — full schema in CLAUDE.md; `question_bm`, `question_en`, `answer_bm`, `answer_en`, `category`, `is_active`
- `users` table — `role`, `name`, `email`, `last_login` fields

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `TranscriptModal` — Shadcn `Dialog` shell; replicate this pattern for KB edit modal and Staff edit modal
- `RecentInteractions` — table pattern with skeleton and empty state; use for KB table and Staff table
- `ChannelBadge` — for Live Monitor active session cards (voice vs chat distinction)
- Recharts — already installed (used in Dashboard home); use `BarChart`, `PieChart`, `LineChart`
- Shadcn: `Table`, `Dialog`, `Button`, `Input`, `Select`, `Switch`, `Badge`, `Skeleton`, `Tabs` — all installed
- `useLanguage()` hook — available on all pages

### Established Patterns
- Client-side data fetching: `useEffect` + `fetch('/api/...')` — match Dashboard home pattern
- CSS variable usage: `className="text-[var(--text-primary)]"` or `style={{ color: 'var(--text-primary)' }}`
- Modal: Shadcn `Dialog` + `DialogContent` + `DialogHeader` + form fields
- Loading state: `useState<boolean>(false)` + `Skeleton` rows
- Empty state: `Inbox` icon + heading + subtext, centered, `py-16`
- Toast: Shadcn `toast()` for success/error feedback (used in Phase 4)

### Integration Points
- All 5 pages in `app/(dashboard)/` — already inside sidebar/topbar layout
- Integrations page has existing `useEffect` for merchant count and role check — keep, extend around it
- New API routes needed: `/api/kb/`, `/api/kb/[id]/`, `/api/kb/sync/`, `/api/live-monitor/status`, `/api/integrations/status`, `/api/staff/` (or use Supabase Admin directly from server route)

</code_context>

<specifics>
## Specific Ideas

- Peak heatmap: CSS grid approach (no Recharts) — `color-mix(in srgb, var(--accent-primary) {intensity}%, var(--bg-surface))` for cell shading
- Live Monitor auto-refresh pauses when tab is hidden (`document.visibilityState`) to avoid unnecessary API calls
- KB sync: Supabase is source of truth — EL sync is push-only; failures show error toast but don't block KB usage
- Staff invite flow: no admin-set passwords — invite-only via Supabase `inviteUserByEmail()`
- Integrations: Meta WA card shows "Pending approval" status until env vars are set (static, no Meta API call needed)

</specifics>

<deferred>
## Deferred Ideas

- Real-time WebSocket Live Monitor — deferred; 10s polling chosen (real-time is out of scope per PROJECT.md)
- ElevenLabs two-way KB sync (pull from EL to Supabase) — deferred; push-only sync chosen for POC
- Staff bulk import (CSV upload) — deferred; single-invite flow sufficient for v1
- Analytics export to Excel — noted but not in PAGE-06 requirements; defer to Phase 7 or add to `/api/export/calls`

</deferred>

---

*Phase: 05-intelligence-system-pages*
*Context gathered: 2026-04-12*
