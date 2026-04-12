---
status: passed
phase: 05-intelligence-system-pages
source: [05-VERIFICATION.md]
started: 2026-04-12T00:00:00Z
updated: 2026-04-12T00:00:00Z
---

## Current Test

All 5 tests passed after bug fixes applied.

## Tests

### 1. Analytics charts rendering
expected: Period selector (weekly/monthly) switches data correctly, all 4 Recharts charts display with CSS-var colors, peak heatmap shows color-mix() intensity gradients, calendar popover opens and date range picker is usable
result: passed — fixed timezone to MYT (UTC+8) for heatmap, volume-by-day, and peak hour; language 'unknown' bucket now populated via transcript keyword fallback

### 2. Knowledge Base CRUD flow
expected: Add/edit modal opens correctly, saves BM/EN fields, inline active toggle updates Supabase and reflects in UI, delete with AlertDialog confirmation works, Sync to ElevenLabs shows success/error toast via sonner
result: passed — fixed Switch visibility with explicit CSS-var background; fixed ElevenLabs sync to update agent system_prompt instead of knowledge_base field

### 3. Staff admin-only enforcement
expected: Admin role can invite new staff via Supabase Admin API (email invite sent), non-admin roles get 403 from /api/staff/* routes, role editing works, remove user with AlertDialog confirmation
result: passed — fixed users table INSERT to use adminClient (service role) instead of regular client to bypass RLS

### 4. Integrations live status and clipboard
expected: Health check cards show real status (green/yellow/red) based on live API calls, "Copy Webhook URL" button works with clipboard API, spinner shows during refresh, error state handled gracefully
result: passed — fixed n8n pending label to "Not Configured" (vs Meta WA "Pending Approval")

### 5. Live Monitor auto-refresh timing
expected: Active sessions appear within 10-second auto-refresh cycle, visibilitychange pauses refresh when tab hidden and resumes on focus, "Updated Ns ago" counter increments correctly, Refresh Now button triggers immediate fetch
result: passed — fixed stale session filtering: agent_id match, status=active client filter, 2-hour recency gate, caller_name mapped from metadata wa_number

## Summary

total: 5
passed: 5
issues: 0
pending: 0
skipped: 0
blocked: 0

## Gaps

| # | Bug | Fix | Status |
|---|-----|-----|--------|
| 1 | Analytics timestamps in UTC instead of MYT | Use (UTCHours+8)%24 and UTC+8 date offset throughout | resolved |
| 2 | Language field null — not stored from ElevenLabs | Added transcript keyword fallback detectLanguageFromTranscript() in webhook | resolved |
| 3 | CSAT collection missing | Added PATCH /api/calls/[id]/csat + star rating widget in TranscriptModal | resolved |
| 4 | KB Active Switch invisible in dark theme | Added explicit backgroundColor CSS vars to Switch component | resolved |
| 5 | KB ElevenLabs sync validation_error on knowledge_base field | Changed sync to update agent system_prompt by appending KB FAQ section | resolved |
| 6 | Staff invite RLS error on users table INSERT | Switch INSERT to adminClient (service role) | resolved |
| 7 | n8n status shows "Pending Approval" (misleading) | n8n pending label changed to "Not Configured" | resolved |
| 8 | Live Monitor showing 18 stale sessions | Added agent_id filter, status=active client filter, 2-hour recency gate | resolved |
