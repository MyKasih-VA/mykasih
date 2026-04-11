---
phase: 01-scaffold-db-auth-dashboard-shell
plan: "06"
subsystem: dashboard-analytics
tags: [analytics, api, recharts, dashboard, stat-card, bar-chart, donut-chart]
dependency_graph:
  requires: ["01-04"]
  provides: ["analytics-summary-api", "stat-card-component", "call-volume-chart", "category-donut-chart"]
  affects: ["01-08"]
tech_stack:
  added: [recharts@3.8.1, clsx@2.1.1, tailwind-merge]
  patterns: [server-component-api-route, client-chart-component, loading-skeleton-pattern]
key_files:
  created:
    - mykasih-crm/app/api/analytics/summary/route.ts
    - mykasih-crm/components/dashboard/StatCard.tsx
    - mykasih-crm/components/dashboard/CallVolumeChart.tsx
    - mykasih-crm/components/dashboard/CategoryDonut.tsx
    - mykasih-crm/lib/utils.ts
  modified:
    - mykasih-crm/package.json
decisions:
  - "Analytics API uses sequential Supabase queries (10 calls) for simplicity; can be optimized with parallel Promise.all if latency becomes an issue"
  - "CategoryDonut legend placed in flex row next to chart, not below, for better space usage on wide screens"
  - "lib/utils.ts added with clsx + tailwind-merge (Rule 3 auto-fix: skeleton.tsx already imported cn from this path)"
metrics:
  duration_minutes: 12
  completed_date: "2026-04-11"
  tasks_completed: 2
  tasks_total: 2
  files_created: 5
  files_modified: 2
---

# Phase 01 Plan 06: Analytics API and Dashboard Chart Components Summary

**One-liner:** Analytics summary API (Supabase aggregation, auth-protected) and three dashboard visualization components — StatCard, CallVolumeChart (stacked Recharts BarChart), and CategoryDonut (Recharts PieChart with right-side legend).

## What Was Built

### Task 1: Analytics Summary API Endpoint

**File:** `mykasih-crm/app/api/analytics/summary/route.ts`

GET endpoint that:
- Validates session via `supabase.auth.getUser()` — returns 401 if unauthenticated
- Excludes all `is_test=true` rows from every query
- Returns four top-level keys: `stats`, `dailyVolume`, `categories`, `recent`
- `stats`: todayTotal, todayVoice, todayChat, resolutionRate, openTickets, inProgressTickets, avgDuration (voice), avgMessages (chat)
- `dailyVolume`: last 7 days grouped by day name (Sun–Sat) with voice/chat counts
- `categories`: category name + count for all non-test calls
- `recent`: 10 most recent non-test interactions with id, channel, caller_name, category, outcome, timestamp

### Task 2: Dashboard Chart Components

**StatCard** (`components/dashboard/StatCard.tsx`):
- Props: `label`, `value`, `subInfo?`, `loading?`
- `role="region"` with `aria-label={label}` and `aria-busy` for accessibility
- Loading: 3 Skeleton bars (label h-4, value h-9, subInfo h-3)
- Value displayed at `text-[28px] font-semibold`
- All colors via CSS vars (--bg-surface, --bg-border, --text-muted, --text-primary)

**CallVolumeChart** (`components/dashboard/CallVolumeChart.tsx`):
- Props: `data`, `title`, `loading?`
- Recharts `BarChart` with `ResponsiveContainer` (100% x 240px)
- Two stacked `Bar` elements (`stackId="a"`) — voice (--chart-voice) + chat (--chart-chat)
- Top bar (chat) gets `radius={[4,4,0,0]}`
- Custom legend: colored dot + label below title
- Loading: full-width `Skeleton` at h-[240px]

**CategoryDonut** (`components/dashboard/CategoryDonut.tsx`):
- Props: `data`, `title`, `loading?`
- Recharts `PieChart` with `Pie` (`innerRadius={50}`, `outerRadius={80}`, `cx="40%"`)
- 6-color array using CSS vars: accent-primary, accent-teal, status-green, status-yellow, chart-voice, chart-chat
- Right-side vertical legend with color dot, category name, count, and percentage
- Loading: centered circular Skeleton (160x160 rounded-full)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added lib/utils.ts (cn helper)**
- **Found during:** Task 2 — skeleton.tsx already imports `cn` from `@/lib/utils` but the file didn't exist
- **Fix:** Created `lib/utils.ts` with clsx + tailwind-merge cn helper; installed both as direct dependencies
- **Files modified:** `lib/utils.ts`, `package.json`
- **Commit:** 205ace5

## Known Stubs

None. The analytics API queries real Supabase tables; components accept real data props. No hardcoded mock data.

## Threat Flags

None. The `/api/analytics/summary` endpoint follows the threat model: auth check via getUser() at entry, returns 401 if no session, is_test filtering applied to all queries, aggregate stats only (no PII beyond caller_name display name).

## Self-Check: PASSED

- `mykasih-crm/app/api/analytics/summary/route.ts` — FOUND
- `mykasih-crm/components/dashboard/StatCard.tsx` — FOUND
- `mykasih-crm/components/dashboard/CallVolumeChart.tsx` — FOUND
- `mykasih-crm/components/dashboard/CategoryDonut.tsx` — FOUND
- `mykasih-crm/lib/utils.ts` — FOUND
- Commit 205ace5 (analytics API) — FOUND
- Commit a164d2a (chart components) — FOUND
- `npx next build` passes — CONFIRMED
