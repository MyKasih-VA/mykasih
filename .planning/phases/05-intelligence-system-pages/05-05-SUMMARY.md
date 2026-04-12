---
phase: 05-intelligence-system-pages
plan: "05"
subsystem: dashboard-live-monitor
tags: [live-monitor, auto-refresh, elevenlabs, supabase, sessions, real-time]
dependency_graph:
  requires:
    - "05-01 (analytics page — established pattern for API route auth pattern)"
    - "Phase 03 (sessions table in Supabase — wa_phone, intent, step, expires_at)"
    - "Phase 01 (lib/supabase/server.ts — createClient with cookie handling)"
  provides:
    - "GET /api/live-monitor/status — active voice + chat session data"
    - "Live Monitor page at /live-monitor — real-time session display"
  affects:
    - "mykasih-crm/app/(dashboard)/live-monitor/page.tsx"
    - "mykasih-crm/app/api/live-monitor/status/route.ts"
    - "mykasih-crm/components/live-monitor/VoiceSessionCard.tsx"
    - "mykasih-crm/components/live-monitor/ChatSessionCard.tsx"
tech_stack:
  added: []
  patterns:
    - "Promise.allSettled for parallel ElevenLabs + Supabase fetch — no single failure blocks other"
    - "AbortSignal.timeout(5000) on external ElevenLabs API call to prevent hanging"
    - "visibilitychange event pauses setInterval polling when tab hidden, resumes on focus"
    - "Separate tick interval (1s) for 'Updated Ns ago' counter, reset to 0 on each fetch"
    - "useRef for interval handles to avoid stale closure issues with start/stop helpers"
key_files:
  created:
    - mykasih-crm/app/api/live-monitor/status/route.ts
    - mykasih-crm/components/live-monitor/VoiceSessionCard.tsx
    - mykasih-crm/components/live-monitor/ChatSessionCard.tsx
  modified:
    - mykasih-crm/app/(dashboard)/live-monitor/page.tsx
decisions:
  - "Promise.allSettled for parallel integration fetches — consistent with integrations page pattern from Phase 05"
  - "AbortSignal.timeout(5000) on ElevenLabs API — prevents hanging if EL is unreachable, degrades gracefully to empty array"
  - "useRef for interval handles in page — avoids stale closure issue when fetchStatus is used across multiple effects"
  - "Tick interval tied to lastFetchTime dependency — resets cleanly after each manual or auto-refresh"
  - "MessageCircleX used for empty chat state — MessageSquareOff not available in lucide-react version used"
metrics:
  duration_seconds: 116
  completed_date: "2026-04-12"
  tasks_completed: 2
  tasks_total: 2
  files_created: 3
  files_modified: 1
---

# Phase 05 Plan 05: Live Monitor — Summary

**One-liner:** Auto-refreshing Live Monitor page polling ElevenLabs active voice sessions and Supabase chat sessions every 10 seconds, with visibility-aware pause and live per-card timers.

## What Was Built

### Task 1 — Live Monitor Status API Route

`GET /api/live-monitor/status` — authenticated endpoint that fetches active sessions from two sources in parallel:

- **Voice sessions:** ElevenLabs Conversations API (`status=active` filter) with 5-second `AbortSignal.timeout`. Returns normalized shape: `id`, `caller_name`, `wa_number`, `language`, `started_at`.
- **Chat sessions:** Supabase `sessions` table filtered by `expires_at > now()`. Returns `id`, `wa_number`, `intent`, `language`, `started_at`, `message_count`.
- **Promise.allSettled** ensures a failure in one source never blocks the other.
- Auth check via `getUser()` — returns 401 if unauthenticated.
- Service role key used for sessions query (bypasses RLS on sessions table — server-side only, never client-bundled).

### Task 2 — Live Monitor Page + Session Cards

**VoiceSessionCard** (`components/live-monitor/VoiceSessionCard.tsx`):
- Live elapsed timer using `setInterval(1000)` counting from `started_at`
- Green dot indicator (`var(--status-green)`) + "Xm Ys" format
- Language badge (outline variant) + caller name / fallback to "Unknown Caller"

**ChatSessionCard** (`components/live-monitor/ChatSessionCard.tsx`):
- Live session age using same `setInterval(1000)` pattern
- Intent badge (capitalized, underscores replaced with spaces)
- Message count from `step` field, session start relative time

**Live Monitor Page** (`app/(dashboard)/live-monitor/page.tsx`):
- 10-second auto-refresh via `setInterval` with `useRef` for handle management
- `visibilitychange` listener: pauses interval when `document.visibilityState === 'hidden'`, resumes + refetches on visible
- Separate 1-second tick interval for "Updated Ns ago" counter (resets to 0 on each fetch)
- Manual "Refresh Now" button with `RefreshCw` icon
- Two-column grid (`lg:grid-cols-2`) — voice left, chat right with CSS var count badges
- Loading: 3 skeleton cards per column (`h-24`)
- Empty states: `PhoneOff` / `MessageCircleX` with bilingual text from translations
- Error: full-width banner with "Try again" button
- `aria-live="polite"` wrapper announces session counts for screen readers
- Replaces Phase 5 stub completely — no placeholder text remains

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None. Sessions are fetched from live APIs. When no active sessions exist, proper empty states are shown (not stub data).

## Threat Surface Scan

All mitigations from threat model applied:

| Threat | Mitigation Applied |
|--------|-------------------|
| T-5-LM-01 (auth on status API) | `getUser()` check → 401 if unauthenticated |
| T-5-LM-02 (ELEVENLABS_API_KEY exposure) | Used only in server-side API route, never passed to client |
| T-5-LM-04 (service role key exposure) | `SUPABASE_SERVICE_ROLE_KEY` accessed via `process.env` in route only |

No new threat surface introduced beyond what the plan's threat model covers.

## Self-Check

### Files created/modified:

- [x] `mykasih-crm/app/api/live-monitor/status/route.ts` — FOUND
- [x] `mykasih-crm/components/live-monitor/VoiceSessionCard.tsx` — FOUND
- [x] `mykasih-crm/components/live-monitor/ChatSessionCard.tsx` — FOUND
- [x] `mykasih-crm/app/(dashboard)/live-monitor/page.tsx` — FOUND (modified)

### Commits:

- `13de4de` feat(05-05): create Live Monitor status API route
- `8cbef84` feat(05-05): build Live Monitor page with auto-refresh and session cards

## Self-Check: PASSED
