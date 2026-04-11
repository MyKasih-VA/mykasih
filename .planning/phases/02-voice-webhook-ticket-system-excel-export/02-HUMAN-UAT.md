---
status: partial
phase: 02-voice-webhook-ticket-system-excel-export
source: [02-VERIFICATION.md]
started: 2026-04-11T00:00:00Z
updated: 2026-04-11T00:00:00Z
---

## Current Test

[awaiting human testing]

## Tests

### 1. Live ElevenLabs webhook
expected: POST /api/webhook/voice with a real ElevenLabs call-end payload saves a call record in Supabase `calls` table with correct fields (channel=voice, category, outcome, masked IC if present)
result: [pending]

### 2. Complaint ticket auto-creation
expected: When a call with category=complaint is received via webhook, a ticket is auto-created in `tickets` table with reference_no in format TKT-YYYY-NNNNN
result: [pending]

### 3. Excel download file integrity
expected: GET /api/export/calls returns a valid .xlsx file with 3 sheets (Panggilan, Tiket, Ringkasan), no plain IC numbers visible in any cell
result: [pending]

### 4. Role guard on export endpoint
expected: Authenticated users with role=mykasih or role=supervisor receive 403 Forbidden; admin and qmedia receive 200 with file
result: [pending]

## Summary

total: 4
passed: 0
issues: 0
pending: 4
skipped: 0
blocked: 0

## Gaps
