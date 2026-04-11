---
status: partial
phase: 03-kasih-whatsapp-chatbot
source: [03-VERIFICATION.md]
started: 2026-04-11T00:00:00Z
updated: 2026-04-11T00:00:00Z
---

## Current Test

[awaiting human testing]

## Tests

### 1. Supabase Sessions Migration Applied
expected: Sessions table exists in Supabase with RLS enabled; `calls.wa_message_id` column present. Every chatbot handler can write to DB without error.
result: [pending]

### 2. Meta WA End-to-End Flow
expected: After `META_WA_PHONE_NUMBER_ID` and `META_WA_ACCESS_TOKEN` are configured (post Meta API approval), send a WhatsApp message to the bot number and receive a 4-item interactive list reply (Semak baki / Kedai berdekatan / Bantuan SARA / Status aduan).
result: [pending — blocked on Meta WA API approval]

## Summary

total: 2
passed: 0
issues: 0
pending: 2
skipped: 0
blocked: 0

## Gaps
