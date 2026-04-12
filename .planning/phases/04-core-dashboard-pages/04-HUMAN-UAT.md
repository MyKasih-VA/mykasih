---
status: complete
phase: 04-core-dashboard-pages
source: [04-VERIFICATION.md]
started: 2026-04-12T00:00:00Z
updated: 2026-04-12T00:00:00Z
---

## Current Test

All tests complete — UAT passed.

## Tests

### 1. Voice Calls Page — End-to-End Interaction
expected: Filters drive real API queries; modal shows speaker-labeled transcript turns; XLSX saves to disk
result: PASSED. Filter bar works (date/search/category/outcome). Debounced search filters rows correctly. TranscriptModal opens with speaker-labeled turns (Bot/User). XLSX export downloads successfully.

### 2. Chat Messages Page — Intent Badge Colors + Ticket Ref Linkage
expected: IntentBadge renders correct color-mix style per intent; ticketRefMap lookup correctly links call_id to reference_no
result: PASSED. Intent badge colors correct (Complaint=red, FAQ=yellow, Merchant Lookup=green, Balance Check=teal, eligibility=muted). Ticket refs show TKT-2026-NNNNN where linked, -- elsewhere. TranscriptModal opens on row click.

### 3. All Interactions Page — Channel Toggle Tabs
expected: Each tab change fires a new /api/calls fetch with the correct channel param; row count changes accordingly
result: PASSED. All/Voice/Chat tab toggle works. Each tab fires new API call with correct channel param. Dur/Msgs column shows seconds for voice and msg count for chat.

### 4. Tickets Kanban — Optimistic Update + Persistence
expected: Optimistic update moves card instantly; PATCH /api/tickets/[id] writes to DB; refresh confirms persistence
result: PASSED (with 1 bug found and fixed). 3-column kanban renders with correct dot colors. Card anatomy correct (ref no monospace, masked IC, category badge, relative time, status dropdown). Optimistic update moves card instantly. DB persistence confirmed after hard refresh. Bug fixed: SelectContent had transparent background showing cards behind — fixed by adding bg-[var(--bg-surface)] border border-[var(--bg-border)] to SelectContent.

### 5. Beneficiaries Page — PDPA-Safe Search Flow
expected: 2-char guard prevents premature fetch; PDPA-safe blank state confirmed; profile populates from /api/beneficiaries response
result: PASSED. Blank state confirmed (PDPA-safe). 1-char guard confirmed via Network tab (no API call fires). Search returns profile with avatar, name, WA number, last-seen time, Interaction History and Ticket History tables. No-results state shows UserX icon with correct copy.

## Summary

total: 5
passed: 5
issues: 1
pending: 0
skipped: 0
blocked: 0

## Gaps

### G1 — SelectContent transparent background (RESOLVED)
file: components/tickets/TicketCard.tsx
description: SelectContent dropdown had transparent background, showing kanban cards behind it when opened.
fix: Added className="bg-[var(--bg-surface)] border border-[var(--bg-border)]" to <SelectContent>.
status: resolved
