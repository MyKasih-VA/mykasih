---
phase: 01-scaffold-db-auth-dashboard-shell
plan: "01"
subsystem: sara-voice-agent
tags: [prompt-patch, elevenlabs, sara, language-lock, non-transferability]
dependency_graph:
  requires: []
  provides: [docs/SARA-PROMPT-PATCH.md]
  affects: [ElevenLabs agent_6501knqvg098fdh8355x9v4d3ycz]
tech_stack:
  added: []
  patterns: [prompt-engineering, bilingual-response-scripting]
key_files:
  created:
    - docs/SARA-PROMPT-PATCH.md
  modified: []
decisions:
  - "Hard block on transferability — zero workarounds, no human agent escalation for this request type (D-01)"
  - "Exact scripted BM/EN responses required — no improvisation allowed (D-02)"
  - "Replace 'Match the caller's language' with explicit session lock rules — root cause fix (D-05)"
metrics:
  duration: "3 minutes"
  completed: "2026-04-11T09:23:00Z"
  tasks_completed: 1
  tasks_total: 2
  files_created: 1
  files_modified: 0
---

# Phase 01 Plan 01: SARA Prompt Patch Summary

**One-liner:** Exact BM/EN scripted prompt patches for ElevenLabs SARA agent — non-transferability hard block and language session-lock replacing the "Match the caller's language" bug trigger.

## What Was Built

`docs/SARA-PROMPT-PATCH.md` — a ready-to-paste prompt patch document for the ElevenLabs voice agent `agent_6501knqvg098fdh8355x9v4d3ycz`. The document contains:

1. **Section 1 (AGENT-01 — Non-Transferability Guardrail):** Covers all trigger conditions (using another's MyKad, wakil/proxy, transferring balance, family purchases). Hard block instruction — no workarounds, no escalation to human agent. Exact scripted responses in both BM and EN, sourced from official FAQ Q18. Redirect to sara.gov.my for family eligibility checks.

2. **Section 2 (AGENT-02 — Language Lock):** Replaces the root-cause "Match the caller's language" instruction. Four explicit rules: session-start detection, English lock on any English request (immediate response "Sure, I'll continue in English."), BM lock on explicit BM request, and no mixing within a single response.

3. **How to Apply guide:** 8-step ElevenLabs dashboard instructions including the critical DELETE step for the buggy instruction.

4. **Test scenarios:** 6 test cases for immediate post-patch verification of both fixes.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Create SARA prompt patch document | 83385fd | docs/SARA-PROMPT-PATCH.md |

## Tasks Pending (Awaiting Human Action)

| Task | Name | Status |
|------|------|--------|
| 2 | Apply SARA prompt fixes in ElevenLabs dashboard | Awaiting user — checkpoint:human-action |

## Deviations from Plan

None — plan executed exactly as written. The `docs/` directory was created as it did not exist (normal first-time setup, not a deviation).

## Known Stubs

None — this plan produces a documentation artifact (prompt text), not code. No data stubs.

## Threat Flags

None — patch document contains no PII, no system secrets, and introduces no new network surface. Responses explicitly avoid revealing internal system details.

## Self-Check: PASSED

- [x] `docs/SARA-PROMPT-PATCH.md` exists at correct path
- [x] Commit `83385fd` verified in git log
- [x] All 7 acceptance criteria strings present in the document
- [x] Plan stopped at checkpoint:human-action as required (Task 2 requires manual ElevenLabs dashboard action)
