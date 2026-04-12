---
phase: 05-intelligence-system-pages
plan: 02
subsystem: dashboard
tags: [knowledge-base, crud, elevenlabs-sync, bilingual, supabase]
dependency_graph:
  requires: [05-01]
  provides: [PAGE-07, KB-CRUD-API, KB-SYNC-API]
  affects: [knowledge-base-page, elevenlabs-voice-agent]
tech_stack:
  added: []
  patterns:
    - Next.js 16 dynamic route params with `await params`
    - Optimistic UI update for inline Switch toggle
    - Sonner toast for async feedback (sync success/error)
    - AlertDialog for destructive action confirmation
    - BM/EN language toggle via Tabs driving table column display
key_files:
  created:
    - mykasih-crm/app/api/kb/route.ts
    - mykasih-crm/app/api/kb/[id]/route.ts
    - mykasih-crm/app/api/kb/sync/route.ts
    - mykasih-crm/components/knowledge-base/KbEntryModal.tsx
    - mykasih-crm/components/knowledge-base/KbTable.tsx
  modified:
    - mykasih-crm/app/(dashboard)/knowledge-base/page.tsx
decisions:
  - "Next.js 16 `await params` pattern used in PATCH and DELETE dynamic routes — matches existing pattern in calls/[id]/transcript/route.ts"
  - "Optimistic active toggle — immediate UI response with revert on API failure; no toast on toggle (inline UX)"
  - "KbEntry interface exported from KbEntryModal.tsx so KbTable.tsx can import type without duplication"
  - "ElevenLabs sync builds knowledge_base as plain text string (Q/A pairs) — matches ElevenLabs PATCH agent API conversation_config.agent.prompt.knowledge_base field"
  - "Category dropdown uses same 6 values as calls.category constraint — consistent across all data"
metrics:
  duration_minutes: 15
  completed_date: "2026-04-12"
  tasks_completed: 2
  files_changed: 6
requirements_completed: [PAGE-07]
---

# Phase 05 Plan 02: Knowledge Base CRUD Page Summary

**One-liner:** Knowledge Base CRUD page with bilingual table, inline active toggle, add/edit modal, delete AlertDialog, and ElevenLabs sync — all backed by 4 authenticated API routes.

## What Was Built

### API Routes (3 files)

**`/api/kb` (GET + POST)**
- GET: returns all KB entries ordered by `last_updated` desc; requires auth
- POST: validates all 5 text fields non-empty, inserts with `updated_by: user.email`, returns 201

**`/api/kb/[id]` (PATCH + DELETE)**
- PATCH: partial update — only fields present in body are updated; sets `last_updated` and `updated_by`
- DELETE: removes entry by id, returns `{ success: true }`
- Both use Next.js 16 `await params` pattern

**`/api/kb/sync` (POST)**
- Fetches all `is_active=true` entries from Supabase
- Formats as Q/A bilingual text pairs
- PATCHes ElevenLabs Agent API with `conversation_config.agent.prompt.knowledge_base`
- Returns 502 with extracted error message on ElevenLabs failure
- `ELEVENLABS_API_KEY` and `ELEVENLABS_AGENT_ID` are server-side only

### Components (2 files)

**`KbEntryModal.tsx`**
- Add mode (POST) and Edit mode (PATCH) from single component; title swaps via `entry` prop null check
- 6 fields: category (Shadcn Select, 6 options), question_bm, answer_bm, question_en, answer_en (styled textareas), is_active (Switch)
- Loading spinner on Save button, disabled while saving, disabled if required fields empty
- `onSaved()` callback triggers page reload of entries

**`KbTable.tsx`**
- 25 rows/page with Previous/Next pagination and page indicator
- `opacity-50` on inactive rows
- `langToggle` prop controls whether Question/Answer columns show BM or EN content
- Delete AlertDialog: focus lands on "Keep entry" Cancel by default (safer UX)
- `KbEntry` interface exported for reuse by parent page

### Page (`knowledge-base/page.tsx`)

Fully replaced stub. Header row: page title + BM/EN Tabs toggle + Add Entry button + Sync to ElevenLabs button. Optimistic active toggle with revert on failure. Sonner toasts on sync success/error. All strings via `t()` from translations.ts.

## Threat Model Coverage

All T-5-KB threats mitigated as specified:

| Threat | Status |
|--------|--------|
| T-5-KB-01 Spoofing — all routes | Mitigated: `supabase.auth.getUser()` at entry of every handler |
| T-5-KB-02 Info Disclosure — API key | Mitigated: `ELEVENLABS_API_KEY` used only in server-side route.ts |
| T-5-KB-03 Tampering — text fields | Accepted: FAQ content, no PII, React escapes XSS by default |
| T-5-KB-04 DoS — sync button | Accepted: manual action by authenticated staff at internal-admin scale |

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None — all data wired to live Supabase API routes.

## Threat Flags

None — no new trust boundaries beyond those in the plan's threat model.

## Self-Check: PASSED

Files confirmed present:
- FOUND: mykasih-crm/app/api/kb/route.ts
- FOUND: mykasih-crm/app/api/kb/[id]/route.ts
- FOUND: mykasih-crm/app/api/kb/sync/route.ts
- FOUND: mykasih-crm/components/knowledge-base/KbEntryModal.tsx
- FOUND: mykasih-crm/components/knowledge-base/KbTable.tsx
- FOUND: mykasih-crm/app/(dashboard)/knowledge-base/page.tsx

Commits confirmed:
- FOUND: 5020c53 (Task 1 — KB API routes)
- FOUND: 62cdd30 (Task 2 — KB page components)

TypeScript: `npx tsc --noEmit` exits 0 — confirmed twice.
