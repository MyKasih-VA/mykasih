# Phase 2: Voice Webhook, Ticket System & Excel Export — Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-11
**Phase:** 02-voice-webhook-ticket-system-excel-export
**Mode:** discuss (auto — all areas)
**Areas discussed:** Category Detection, IC Collection in Voice Calls, Excel Export Content, Webhook Error Handling

---

## Category Detection

| Option | Description | Selected |
|--------|-------------|----------|
| ElevenLabs data_collection variables | SARA collects structured category during the call — cleanest, no post-call API | ✓ |
| Post-call Claude API classification | Classify transcript via Claude API after call ends — adds latency + cost | |
| Keyword matching only | Simple but fragile for BM/EN mixed conversations | |

**User's choice:** ElevenLabs data_collection variables (recommended default)
**Notes:** Fallback to keyword matching if data_collection is null. No post-call Claude API call in Phase 2.

---

## IC Collection in Voice Calls

| Option | Description | Selected |
|--------|-------------|----------|
| SARA does NOT collect IC in voice | masked_ic = null for all voice records; IC only in chatbot Phase 3 | ✓ |
| SARA collects IC for balance checks | Adds complexity; balance check via voice not in scope | |

**User's choice:** SARA does NOT collect IC in voice (recommended default)
**Notes:** lib/ic-mask.ts still created in Phase 2 as shared utility for Phase 3 consumption.

---

## Excel Export Content

| Option | Description | Selected |
|--------|-------------|----------|
| 3-sheet standard (Interaksi + Tiket + Ringkasan) | Covers all data with aggregate summary sheet | ✓ |
| Single flat sheet | Simpler but loses ticket-specific structure | |
| No summary sheet | Leaves reporting to client — less polished | |

**User's choice:** 3-sheet standard (recommended default)
**Notes:** Sheet 3 Ringkasan = totals by channel, category, outcome + avg CSAT + ticket status counts + date range. Export excludes is_test rows by default.

---

## Webhook Error Handling

| Option | Description | Selected |
|--------|-------------|----------|
| Return 200 always (except invalid secret) | Prevents ElevenLabs retries / duplicates; log errors server-side | ✓ |
| Return 500 on Supabase failure | ElevenLabs retries — risk of duplicate records | |
| Queue failed webhooks for retry | More robust but over-engineered for Phase 2 | |

**User's choice:** Return 200 always, except 401 for invalid secret (recommended default)
**Notes:** Include conversation_id in error log for manual recovery from ElevenLabs dashboard.

---

## Claude's Discretion

- HMAC-SHA256 implementation for ElevenLabs signature validation
- Excel column widths, header bold, freeze row
- Keyword list for transcript category fallback

## Deferred Ideas

None.
