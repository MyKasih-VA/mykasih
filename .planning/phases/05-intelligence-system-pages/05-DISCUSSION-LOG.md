# Phase 5: Intelligence & System Pages - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-12
**Phase:** 05-intelligence-system-pages
**Mode:** discuss (auto-selected recommended options by user request)
**Areas discussed:** Analytics, Knowledge Base, Live Monitor, Staff Management, Integrations

---

## Analytics: Charts & Period Selector

| Option | Description | Selected |
|--------|-------------|----------|
| A — Presets only | Today / This Week / This Month / Last 3 Months — no custom picker | |
| B — Presets + custom date range picker | Matches Phase 4 Voice Calls filter pattern | ✓ |
| C — Claude decides | | |

| Option | Description | Selected |
|--------|-------------|----------|
| A — Hour × Day-of-week grid | 7 cols × 24 rows heatmap, more actionable for staffing decisions | ✓ |
| B — Hour-of-day bar chart only | 24 bars, simpler | |
| C — Claude decides | | |

| Option | Description | Selected |
|--------|-------------|----------|
| A — Show real data, empty state if none | Honest display, no fake fallback charts | ✓ |
| B — Replace CSAT with volume-by-channel | More useful when CSAT sparse | |
| C — Show both, CSAT secondary | More complex | |

| Option | Description | Selected |
|--------|-------------|----------|
| A — Simple table: Category / Voice / Chat / Total / % | Shadcn-only, no embellishment | ✓ |
| B — Table + mini bar per row | Slightly richer visual | |
| C — Claude decides | | |

**User's choice:** All recommended (Claude auto-selected)
**Notes:** User requested Claude pick all recommended options across all 5 areas in one go.

---

## Knowledge Base: Edit UX & ElevenLabs Sync

| Option | Description | Selected |
|--------|-------------|----------|
| Modal (Dialog) | Consistent with TranscriptModal from Phase 4 | ✓ |
| Inline row editing | Simpler but harder to fit BM+EN fields | |
| Separate page | Page navigation, breaks flow | |

| Option | Description | Selected |
|--------|-------------|----------|
| Full EL sync (push all active KB to agent prompt) | Real integration, backend calls EL PATCH API | ✓ |
| Stub with toast only | No real EL call | |

**User's choice:** All recommended (Claude auto-selected)

---

## Live Monitor: Data Sources & Refresh

| Option | Description | Selected |
|--------|-------------|----------|
| Backend polls EL Conversations API per client request | No background job, simple | ✓ |
| WebSocket / SSE live stream | Real-time, complex | |
| Static demo data | Not useful for real monitoring | |

| Option | Description | Selected |
|--------|-------------|----------|
| Query sessions table (expires_at > now()) | Already exists from Phase 3 | ✓ |
| Separate active_chats tracking table | Extra complexity | |

| Option | Description | Selected |
|--------|-------------|----------|
| setInterval 10s client polling | Simple, matches requirement, no SSE overhead | ✓ |
| SSE / WebSocket | Overkill for 10s refresh | |

**User's choice:** All recommended (Claude auto-selected)
**Notes:** Auto-refresh pauses on hidden tab (document.visibilityState) — avoids unnecessary API calls.

---

## Staff Management: Add/Edit User Flow

| Option | Description | Selected |
|--------|-------------|----------|
| Shadcn Dialog modal | Consistent pattern, no page navigation | ✓ |
| Separate page | Breaks flow | |

| Option | Description | Selected |
|--------|-------------|----------|
| Supabase inviteUserByEmail() | Email invite, no admin-set passwords, secure | ✓ |
| Admin creates password | Less secure, admin knows staff passwords | |

**User's choice:** All recommended (Claude auto-selected)
**Notes:** Pending invites shown with "Pending" badge + "Resend invite" button.

---

## Integrations: Live Status Checks & Action Buttons

| Option | Description | Selected |
|--------|-------------|----------|
| Backend /api/integrations/status route | Server-side checks, no API keys exposed to client | ✓ |
| Client-side ping to each service | Exposes API keys, CORS issues | |

| Action | Description | Selected |
|--------|-------------|----------|
| EL: Test connection | Inline health check | ✓ |
| Meta WA: Copy webhook URL | Clipboard copy of /api/webhook/chat URL | ✓ |
| n8n: Open n8n dashboard | External link | ✓ |
| Supabase: View project | External link | ✓ |
| Anam AI: Open demo | Internal /demo link | ✓ |

**User's choice:** All recommended (Claude auto-selected)

---

## Claude's Discretion

- Pagination size (25 rows suggested)
- Loading skeleton row count
- Empty state copy (use `t()` pattern)
- Peak heatmap intensity scaling formula
- Whether to extend existing `/api/analytics/summary` or add `/api/analytics/charts`
- Merchant seed card placement on Integrations page
- Last-refreshed timestamp format on Live Monitor

## Deferred Ideas

- Real-time WebSocket Live Monitor — out of scope per PROJECT.md
- Two-way EL KB sync — push-only for POC
- Staff bulk CSV import — single invite sufficient for v1
- Analytics Excel export — not in PAGE-06; consider Phase 7
