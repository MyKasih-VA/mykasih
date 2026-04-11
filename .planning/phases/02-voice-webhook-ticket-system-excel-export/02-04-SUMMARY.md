---
phase: 02-voice-webhook-ticket-system-excel-export
plan: "04"
subsystem: dashboard-api
tags: [api, calls, transcript, pagination, supabase, auth]
dependency_graph:
  requires: [02-01]
  provides: [calls-list-endpoint, transcript-endpoint]
  affects: [voice-calls-page, chat-messages-page, all-interactions-page, transcript-modal]
tech_stack:
  added: []
  patterns: [supabase-cookie-auth, paginated-get, dynamic-route-params-await]
key_files:
  created:
    - mykasih-crm/app/api/calls/route.ts
    - mykasih-crm/app/api/calls/[id]/transcript/route.ts
  modified: []
decisions:
  - "All authenticated roles (admin, mykasih, qmedia, supervisor) can read calls — no role restriction on reads"
  - "is_test=false by default to exclude test calls from dashboard views unless include_test=true"
  - "Limit capped at 100 to prevent DoS via large page size"
  - "params typed as Promise<{ id: string }> and awaited per Next.js 16 dynamic route requirement"
metrics:
  duration: "~15 minutes"
  completed: "2026-04-11"
  tasks_completed: 2
  files_created: 2
---

# Phase 02 Plan 04: Calls List and Transcript API Endpoints Summary

Paginated GET /api/calls with 9 filter params and GET /api/calls/[id]/transcript returning call metadata plus ordered transcript turns, both guarded by Supabase cookie auth.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | GET /api/calls with pagination and filters | pending-commit | mykasih-crm/app/api/calls/route.ts |
| 2 | GET /api/calls/[id]/transcript | pending-commit | mykasih-crm/app/api/calls/[id]/transcript/route.ts |

## What Was Built

### Task 1: GET /api/calls

Endpoint at `mykasih-crm/app/api/calls/route.ts` that supports:

- **Authentication:** `supabase.auth.getUser()` via cookie — returns 401 if no valid session
- **Pagination:** `page` (default 1) and `limit` (default 20, max 100) with `offset` calculation
- **Filters:**
  - `channel` — voice | chat | website
  - `category` — eligibility | faq | registration | complaint | merchant_lookup | balance_check
  - `outcome` — resolved | escalated | callback | abandoned
  - `language` — bm | en | mixed
  - `from` / `to` — ISO date range (YYYY-MM-DD)
  - `search` — ilike match on caller_name and wa_number
  - `include_test` — default false (excludes is_test=true rows)
- **Response shape:** `{ data: Call[], pagination: { page, limit, total, total_pages } }`
- **Ordering:** timestamp DESC (most recent first)

### Task 2: GET /api/calls/[id]/transcript

Endpoint at `mykasih-crm/app/api/calls/[id]/transcript/route.ts` that:

- **Next.js 16 compliance:** `params` typed as `Promise<{ id: string }>` and awaited before use
- **Authentication:** Same cookie auth pattern — 401 if no session
- **Call existence check:** Fetches call metadata first — returns 404 if not found
- **Transcript fetch:** Ordered ASC by timestamp (chronological conversation order)
- **Response shape:** `{ call: { id, channel, caller_name, timestamp, duration, category, outcome }, transcript: TranscriptTurn[] }`

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None — these are read endpoints with no hardcoded data.

## Threat Surface Scan

All mitigations from the threat model are implemented:

| Threat ID | Mitigation Applied |
|-----------|-------------------|
| T-02-04-01 (Spoofing) | `supabase.auth.getUser()` in both endpoints — 401 returned on auth failure |
| T-02-04-03 (Search injection) | Search passed through Supabase `.ilike()` — parameterized, no raw SQL |
| T-02-04-04 (DoS via pagination) | `Math.min(100, ...)` caps limit at 100 |

T-02-04-02 (UUID-based IDs) — accepted by design per threat model.

## Self-Check

- [x] `mykasih-crm/app/api/calls/route.ts` — created and verified
- [x] `mykasih-crm/app/api/calls/[id]/transcript/route.ts` — created and verified
- [ ] Git commits — BLOCKED: Bash tool access denied in this execution context

**Note:** Both files were written successfully. Git commits could not be created because Bash tool access was denied. The files are staged for commit by the caller/orchestrator.

## Self-Check: PARTIAL

Files created successfully. Commit hashes not available due to Bash tool restriction.
