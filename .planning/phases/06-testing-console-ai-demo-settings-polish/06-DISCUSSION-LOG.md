# Phase 6: Testing Console, AI Demo, Settings & Polish - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-12
**Phase:** 06-testing-console-ai-demo-settings-polish
**Areas discussed:** Voice Agent embed style, Chatbot simulator behavior, AI Demo page access & layout, Settings page storage & fields, Language polish scope

---

## Area Selection

User selected all 4 gray areas for discussion, then opted to use Claude's recommendations for all areas (no individual Q&A).

---

## Voice Agent Embed Style

| Option | Description | Selected |
|--------|-------------|----------|
| `useConversation` hook | Custom UI: mic button, status badge, live transcript. Matches dark theme. | ✓ |
| `convai-widget` web component | Drop-in embed, less control over styling | |

**Status indicators selected:** Status badge (Ready/Connecting/Active/Ended) + live transcript panel

**Notes:** WebRTC connection type chosen per CLAUDE.md spec. All sessions tagged `is_test=true` via `startSession()` metadata.

---

## Chatbot Simulator Behavior

| Option | Description | Selected |
|--------|-------------|----------|
| Real `/api/chatbot/message` | Same API as production — authentic simulation | ✓ |
| Local mock | No real API call — simulated responses only | |

**UI style selected:** Dark WhatsApp-style bubbles — user right (`--accent-primary`), bot left (`--bg-surface`). Fixed-height scroll, send-on-Enter, intent badge on bot responses.

**Notes:** No save-as-test-record needed from simulator UI. Clear conversation button resets state.

---

## AI Demo Page Access & Layout

| Option | Description | Selected |
|--------|-------------|----------|
| Public (no auth) | Shareable link for clients — no login required | ✓ |
| Admin-only | Requires dashboard login | |

**Layout selected:** Standalone route `app/demo/page.tsx` outside `(dashboard)` group. MyKasih logo + title header, full-height Anam AI embed, "Powered by Anam AI" footer. Dark background.

---

## Settings Page Storage & Fields

| Option | Description | Selected |
|--------|-------------|----------|
| Supabase `settings` table (key-value) | Persisted, editable, survives deploys | ✓ |
| Env vars only | Read-only display, no persistence needed | |

**Editable fields:** `agent_hours_start`, `agent_hours_end`, `notification_email`, `data_retention_days`
**Read-only fields:** Webhook URLs (copy button)
**Notes:** Single Save button → `PATCH /api/settings` upsert. Success/error toast feedback.

---

## Claude's Discretion

- Exact `useConversation` event handlers and error handling
- Live transcript update frequency/debouncing
- Tab 2 intent badge color mapping
- Mic button pulse animation intensity
- Demo page footer copy
- Settings table initial seed values

## Deferred Ideas

None raised during discussion.
