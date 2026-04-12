---
status: partial
phase: 04-core-dashboard-pages
source: [04-VERIFICATION.md]
started: 2026-04-12T00:00:00Z
updated: 2026-04-12T00:00:00Z
---

## Current Test

[awaiting human testing]

## Tests

### 1. Voice Calls Page — End-to-End Interaction
expected: Filters drive real API queries; modal shows speaker-labeled transcript turns; XLSX saves to disk
result: [pending]

### 2. Chat Messages Page — Intent Badge Colors + Ticket Ref Linkage
expected: IntentBadge renders correct color-mix style per intent; ticketRefMap lookup correctly links call_id to reference_no
result: [pending]

### 3. All Interactions Page — Channel Toggle Tabs
expected: Each tab change fires a new /api/calls fetch with the correct channel param; row count changes accordingly
result: [pending]

### 4. Tickets Kanban — Optimistic Update + Persistence
expected: Optimistic update moves card instantly; PATCH /api/tickets/[id] writes to DB; refresh confirms persistence
result: [pending]

### 5. Beneficiaries Page — PDPA-Safe Search Flow
expected: 2-char guard prevents premature fetch; PDPA-safe blank state confirmed; profile populates from /api/beneficiaries response
result: [pending]

## Summary

total: 5
passed: 0
issues: 0
pending: 5
skipped: 0
blocked: 0

## Gaps
