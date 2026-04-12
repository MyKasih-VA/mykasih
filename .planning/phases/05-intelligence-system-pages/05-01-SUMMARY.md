---
phase: 05-intelligence-system-pages
plan: "01"
subsystem: dashboard-analytics
tags: [analytics, recharts, shadcn, translations, heatmap, charts]
dependency_graph:
  requires:
    - "mykasih-crm/lib/supabase/server.ts"
    - "mykasih-crm/components/dashboard/StatCard.tsx"
    - "mykasih-crm/components/calls/CallsTable.tsx"
    - "mykasih-crm/hooks/useLanguage.ts"
  provides:
    - "mykasih-crm/app/api/analytics/charts/route.ts"
    - "mykasih-crm/app/(dashboard)/analytics/page.tsx"
    - "mykasih-crm/components/analytics/PeriodSelector.tsx"
    - "mykasih-crm/components/analytics/VolumeBarChart.tsx"
    - "mykasih-crm/components/analytics/CsatTrendChart.tsx"
    - "mykasih-crm/components/analytics/LanguagePieChart.tsx"
    - "mykasih-crm/components/analytics/PeakHeatmap.tsx"
    - "mykasih-crm/components/analytics/CategoryTable.tsx"
    - "mykasih-crm/lib/translations.ts (all Phase 5 keys)"
    - "mykasih-crm/components/ui/calendar.tsx"
    - "mykasih-crm/components/ui/popover.tsx"
    - "mykasih-crm/components/ui/alert-dialog.tsx"
  affects:
    - "Plans 02-05 (consume Phase 5 translation keys)"
    - "Plans 02-05 (consume shadcn alert-dialog, popover)"
tech_stack:
  added:
    - "react-day-picker (calendar date range picker)"
    - "date-fns (calendar dependency)"
    - "@radix-ui/react-popover (via shadcn popover)"
  patterns:
    - "Recharts ResponsiveContainer for all chart components"
    - "CSS color-mix() for heatmap intensity shading"
    - "Shadcn Tabs for period selector preset switching"
    - "Shadcn Popover + Calendar in range mode for custom date picker"
    - "useCallback + useEffect fetch pattern for analytics data"
key_files:
  created:
    - "mykasih-crm/app/api/analytics/charts/route.ts"
    - "mykasih-crm/components/analytics/PeriodSelector.tsx"
    - "mykasih-crm/components/analytics/VolumeBarChart.tsx"
    - "mykasih-crm/components/analytics/CsatTrendChart.tsx"
    - "mykasih-crm/components/analytics/LanguagePieChart.tsx"
    - "mykasih-crm/components/analytics/PeakHeatmap.tsx"
    - "mykasih-crm/components/analytics/CategoryTable.tsx"
    - "mykasih-crm/components/ui/calendar.tsx"
    - "mykasih-crm/components/ui/popover.tsx"
    - "mykasih-crm/components/ui/alert-dialog.tsx"
  modified:
    - "mykasih-crm/app/(dashboard)/analytics/page.tsx"
    - "mykasih-crm/lib/translations.ts"
decisions:
  - "CSS grid (not Recharts) for PeakHeatmap — per UI-SPEC; enables color-mix intensity per cell"
  - "Single Supabase query fetching all calls in range, then JavaScript-side grouping — avoids N+1 queries for 6 different aggregations"
  - "formatCategory imported from CallsTable.tsx — consistent display names, no duplication"
  - "PeakHeatmap day index: JS getDay() 0=Sun converted to Mon=0..Sun=6 per plan spec"
  - "avgCsat returns null when no ratings — StatCard displays em-dash, avoids misleading 0"
metrics:
  duration: "4 minutes"
  completed: "2026-04-12T07:25:12Z"
  tasks_completed: 2
  files_created: 10
  files_modified: 2
---

# Phase 05 Plan 01: Analytics Page — Summary

**One-liner:** Full Analytics page with period selector, stacked bar/line/pie/heatmap charts, and category breakdown table, all served from a new authenticated `/api/analytics/charts` endpoint querying Supabase.

## What Was Built

### Task 1: Shadcn components + Phase 5 translations + analytics charts API

Installed three missing shadcn components (`calendar`, `popover`, `alert-dialog`) with their peer dependencies (`react-day-picker`, `date-fns`, `@radix-ui/react-popover`).

Added all Phase 5 translation keys to `translations.ts` — analytics (32 keys), kb (17 keys), staff (17 keys), integrations (12 keys), liveMonitor (12 keys), and `common.tryAgain`. These are now available for Plans 02-05.

Created `GET /api/analytics/charts` with:
- Auth check via `supabase.auth.getUser()` (T-5-01 mitigation — returns 401 if no session)
- Period params: `today | thisWeek | thisMonth | last3Months | custom` with `from`/`to` ISO dates
- All queries filtered with `is_test=false`
- Returns: `stats`, `volumeByDay`, `csatByDay`, `languageDistribution`, `heatmap`, `categoryBreakdown`
- Peak hour computed by counting calls per hour and finding the max
- Heatmap uses Mon=0..Sun=6 day indexing (converted from JS Sun=0 convention)

### Task 2: Analytics page + 6 chart/table components

**PeriodSelector** — Shadcn Tabs with 5 presets; Custom tab opens a Popover containing a Calendar in range mode. Active tab styled with `--accent-primary` background.

**VolumeBarChart** — Recharts stacked BarChart, voice (`--chart-voice`) + chat (`--chart-chat`) bars, CartesianGrid with `--bg-border`, dark Tooltip, Legend.

**CsatTrendChart** — Recharts LineChart, Y-axis domain 1-5, `ReferenceLine` at 3.5, `--accent-primary` stroke. Empty state renders `TrendingUp` Lucide icon with heading/body from translations when no CSAT data.

**LanguagePieChart** — Recharts donut PieChart, `Cell` per segment: BM=`--accent-primary`, EN=`--accent-teal`, Mixed=`--status-yellow`.

**PeakHeatmap** — CSS grid `auto repeat(7, 28px)` x `auto repeat(24, 28px)`, 2px gap. Each cell uses `color-mix(in srgb, var(--accent-primary) ${intensity}%, var(--bg-surface))` where intensity = max(5, count/maxCount*100). Cells have `title` and `aria-label` attributes.

**CategoryTable** — Shadcn Table, columns: Category | Voice | Chat | Total | % of Total. Category display names from `formatCategory()` imported from `CallsTable.tsx`.

**Analytics page** — Replaces stub. State: `period` (default `thisWeek`), `from`, `to`, `data`, `loading`, `error`. `useEffect` fetches on period/from/to change. Layout: header + PeriodSelector, 4 StatCards (2-col sm / 4-col lg), 2x2 chart grid (1-col sm / 2-col lg), CategoryTable. All charts wrapped in `--bg-surface` cards. Loading state uses `Skeleton` at h-[240px].

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None — all data flows are wired to `/api/analytics/charts` which queries Supabase live.

## Threat Flags

No new threat surface beyond what was planned. The `/api/analytics/charts` endpoint follows the T-5-01 mitigation: auth check at route entry, all data filtered with `is_test=false`.

## Self-Check: PASSED

All 10 created files verified to exist on disk. Both task commits confirmed in git log.

| Check | Result |
|-------|--------|
| calendar.tsx | FOUND |
| popover.tsx | FOUND |
| alert-dialog.tsx | FOUND |
| charts/route.ts | FOUND |
| PeriodSelector.tsx | FOUND |
| VolumeBarChart.tsx | FOUND |
| CsatTrendChart.tsx | FOUND |
| LanguagePieChart.tsx | FOUND |
| PeakHeatmap.tsx | FOUND |
| CategoryTable.tsx | FOUND |
| Commit 1ad6705 (Task 1) | FOUND |
| Commit ae49ac3 (Task 2) | FOUND |
| `npx tsc --noEmit` | PASSED (0 errors) |
