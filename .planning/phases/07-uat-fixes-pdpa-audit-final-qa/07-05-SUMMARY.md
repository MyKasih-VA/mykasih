---
phase: 07-uat-fixes-pdpa-audit-final-qa
plan: "05"
subsystem: crm-beneficiaries
tags: [caller-name, name-extraction, beneficiaries, contacts-view, regex]
dependency_graph:
  requires: ["07-03"]
  provides: [caller-name-extraction, beneficiaries-contacts-tab]
  affects: [webhook-voice, beneficiaries-page, beneficiaries-api]
tech_stack:
  added: []
  patterns: [regex-name-extraction, dual-mode-api-handler, js-side-aggregation]
key_files:
  created:
    - mykasih-crm/lib/name-extraction.ts
    - (mykasih-crm/app/api/beneficiaries/route.ts — rewritten)
  modified:
    - mykasih-crm/app/api/webhook/voice/route.ts
    - mykasih-crm/app/(dashboard)/beneficiaries/page.tsx
    - mykasih-crm/lib/translations.ts
decisions:
  - "Dual-mode GET /api/beneficiaries: ?query= preserves existing search behaviour; no query triggers new contacts list aggregation — avoids breaking BeneficiaryProfile"
  - "JS-side aggregation with 5000-row cap acceptable at POC scale; avoids complex GROUP BY SQL across multiple grouping strategies"
  - "caller_name priority chain: dcResults['caller_name'].value (ElevenLabs data_collection) → extractNameFromTranscript fallback → null"
  - "open_ticket_count defaults to 0 — ticket join deferred; acceptable for POC contacts view"
metrics:
  duration_seconds: 151
  completed_date: "2026-04-30"
  tasks_completed: 4
  files_changed: 5
---

# Phase 07 Plan 05: Caller Name Extraction + Beneficiaries Contacts View Summary

**One-liner:** Regex-based caller name extractor (BM/EN) wired into ElevenLabs webhook with data_collection primary and transcript fallback; Beneficiaries page updated with Contacts tab showing aggregated list alongside preserved Search tab.

## What Was Built

### Task 1 — lib/name-extraction.ts
Created pure TypeScript name extractor with BM and EN regex patterns covering `nama saya/ialah`, `saya bernama`, `my name is`, `I'm/I am`. Guards include a FALSE_POSITIVE_WORDS list, length cap (2–60 chars), and trailing filler word trimming (`lah`, `kan`, `pun`). No external dependencies.

### Task 2 — webhook/voice/route.ts patch
Added `import { extractNameFromTranscript }` and replaced the hardcoded `caller_name: null` with a priority chain: `dcResults['caller_name'].value.trim()` (ElevenLabs data_collection primary) → `extractNameFromTranscript(payload.data.transcript)` (transcript regex fallback) → `null`. All other webhook logic unchanged.

### Task 3 — GET /api/beneficiaries (dual-mode)
Extended the existing route to support both modes in one handler. `?query=` triggers existing BeneficiaryProfile search (unchanged). No query param triggers new contacts list mode: fetches up to 5000 non-test calls, JS-aggregates by `wa_number` (chat) then `caller_name` (voice-only), returns `{ beneficiaries, total, unknown_count, page, limit }`. Exports `Beneficiary` interface for the page component.

### Task 4 — Beneficiaries page + translations
Added 8 new EN/BM translation keys (`beneficiaries.contacts/search/allContacts/unknownCaller/lastContact/interactions/noContacts/channel`). Rewrote `beneficiaries/page.tsx` with a two-tab layout:
- **Contacts tab** (default): fetches contacts list, shows name/avatar/channel/WA/last-contact/interaction-count table with skeleton loading, empty state, and pagination.
- **Search tab**: preserves all existing BeneficiaryProfile + TranscriptModal search behaviour.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical Functionality] Dual-mode GET /api/beneficiaries**
- **Found during:** Task 3
- **Issue:** The plan described creating a new `GET /api/beneficiaries` that would have overwritten the existing route. The existing route is used by the Beneficiaries page `SearchTab` for `?query=` lookups via `BeneficiaryProfile`. Replacing it would break search.
- **Fix:** Merged both modes into one handler: `?query=` param triggers existing search path (preserved exactly); absence of `?query=` triggers new contacts list aggregation. No breaking change.
- **Files modified:** `mykasih-crm/app/api/beneficiaries/route.ts`

## Known Stubs

- `open_ticket_count: 0` in all Beneficiary rows — ticket join is deferred to Phase 2 as documented in the plan. The contacts view goal (showing aggregated beneficiaries) is fully achieved; open ticket counts are cosmetic metadata.

## Threat Surface Scan

No new network endpoints, auth paths, or schema changes introduced beyond what was in the plan's threat model. `GET /api/beneficiaries` (T-07-13) auth guard present; returns aggregated caller_name + wa_number only — no IC, no transcript content. `extractNameFromTranscript` (T-07-12) regex capped at 60 chars with false-positive guard.

## Self-Check

See below.
