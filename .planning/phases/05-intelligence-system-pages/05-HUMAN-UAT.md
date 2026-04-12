---
status: partial
phase: 05-intelligence-system-pages
source: [05-VERIFICATION.md]
started: 2026-04-12T00:00:00Z
updated: 2026-04-12T00:00:00Z
---

## Current Test

[awaiting human testing]

## Tests

### 1. Analytics charts rendering
expected: Period selector (weekly/monthly) switches data correctly, all 4 Recharts charts display with CSS-var colors, peak heatmap shows color-mix() intensity gradients, calendar popover opens and date range picker is usable
result: [pending]

### 2. Knowledge Base CRUD flow
expected: Add/edit modal opens correctly, saves BM/EN fields, inline active toggle updates Supabase and reflects in UI, delete with AlertDialog confirmation works, Sync to ElevenLabs shows success/error toast via sonner
result: [pending]

### 3. Staff admin-only enforcement
expected: Admin role can invite new staff via Supabase Admin API (email invite sent), non-admin roles get 403 from /api/staff/* routes, role editing works, remove user with AlertDialog confirmation
result: [pending]

### 4. Integrations live status and clipboard
expected: Health check cards show real status (green/yellow/red) based on live API calls, "Copy Webhook URL" button works with clipboard API, spinner shows during refresh, error state handled gracefully
result: [pending]

### 5. Live Monitor auto-refresh timing
expected: Active sessions appear within 10-second auto-refresh cycle, visibilitychange pauses refresh when tab hidden and resumes on focus, "Updated Ns ago" counter increments correctly, Refresh Now button triggers immediate fetch
result: [pending]

## Summary

total: 5
passed: 0
issues: 0
pending: 5
skipped: 0
blocked: 0

## Gaps
