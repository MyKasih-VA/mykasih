---
phase: 05-intelligence-system-pages
plan: "04"
subsystem: integrations
tags: [integrations, health-check, api, components, status]
dependency_graph:
  requires: [05-01]
  provides: [PAGE-09]
  affects: [integrations-page, status-api]
tech_stack:
  added: []
  patterns:
    - Promise.allSettled for parallel health checks with 5-second AbortSignal.timeout
    - navigator.clipboard.writeText for copy-to-clipboard with sonner toast feedback
    - n8n_url passed through status API response to avoid exposing N8N_BASE_URL directly to client
key_files:
  created:
    - mykasih-crm/app/api/integrations/status/route.ts
    - mykasih-crm/components/integrations/IntegrationCard.tsx
  modified:
    - mykasih-crm/app/(dashboard)/integrations/page.tsx
decisions:
  - "n8n_url included in status API response — N8N_BASE_URL is server-side only; passing URL through API avoids exposing it as NEXT_PUBLIC_"
  - "Promise.allSettled used for parallel health checks — all 5 checks run concurrently, no single failure blocks others"
  - "ElevenLabs Test Connection re-fetches full status endpoint — keeps single source of truth, avoids duplicate check logic"
metrics:
  duration: 8
  completed_date: "2026-04-12"
  tasks_completed: 2
  files_changed: 3
---

# Phase 05 Plan 04: Integrations Page — Summary

Enhanced Integrations page with 5 live status cards (ElevenLabs, Meta WA, n8n, Supabase, Anam AI), parallel health check API with 5-second timeouts, and per-card action buttons, while preserving existing merchant seed functionality.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Create integrations status API route | 229ddea | mykasih-crm/app/api/integrations/status/route.ts |
| 2 | Build IntegrationCard component and enhance Integrations page | c9ad816 | mykasih-crm/components/integrations/IntegrationCard.tsx, mykasih-crm/app/(dashboard)/integrations/page.tsx |

## What Was Built

### API Route — `/api/integrations/status` (GET)
- Auth-gated: returns 401 if no user session
- Runs 5 health checks in parallel via `Promise.allSettled` — each with a 5-second `AbortSignal.timeout`
- ElevenLabs: hits `https://api.elevenlabs.io/v1/convai/agents/{agentId}` with API key (server-side only, never exposed to client)
- Supabase: count query on `calls` table
- n8n: GET `{N8N_BASE_URL}/healthz` if env var set, else `pending`
- Meta WA: env var presence check — `ok` if set, `pending` if not
- Anam AI: always `ready`
- Returns `n8n_url` field so client can use it for Open n8n link without exposing env var directly

### Component — `IntegrationCard`
- Reusable card with icon, name, status badge, description, and action button
- Status badge colors: `ok`/`ready` → `--status-green`, `error` → `--status-red`, `pending` → `--status-yellow`
- Action types: `button` (onClick handler), `external-link` (anchor `target="_blank"`), `internal-link` (Next.js `Link`)
- Spinner shown when `actionLoading` is true

### Page — `/integrations`
- Header with page title + Refresh Status button (RefreshCw icon, spinner while loading)
- 5 IntegrationCard instances in responsive grid (1 col → 2 col → 3 col)
- ElevenLabs: Test Connection re-checks status inline
- Meta WA: Copy Webhook URL copies `${origin}/api/webhook/chat` to clipboard with sonner toast
- n8n: Open n8n external link (URL from status API response)
- Supabase: View Project external link to supabase.com/dashboard
- Anam AI: Open Demo internal link to `/demo`
- Error banner with Try again button if status fetch fails
- Merchant seed card preserved below Database section heading

## Deviations from Plan

None — plan executed exactly as written.

## Threat Surface Scan

| Flag | File | Description |
|------|------|-------------|
| (none) | — | No new trust boundaries introduced beyond those in plan's threat model |

The `/api/integrations/status` route was planned and its threat model (T-5-Int-01 through T-5-Int-03) was already addressed:
- Auth check present (401 on missing session)
- ELEVENLABS_API_KEY used server-side only
- All external calls use `AbortSignal.timeout(5000)` and `Promise.allSettled`

## Known Stubs

None — all 5 status cards fetch real data from the health check API. The Meta WA and n8n cards correctly show `pending` when env vars are not set (expected during development).

## Self-Check: PASSED

- mykasih-crm/app/api/integrations/status/route.ts: FOUND
- mykasih-crm/components/integrations/IntegrationCard.tsx: FOUND
- mykasih-crm/app/(dashboard)/integrations/page.tsx: FOUND (modified)
- Commit 229ddea: FOUND
- Commit c9ad816: FOUND
- `npx tsc --noEmit`: exits 0
