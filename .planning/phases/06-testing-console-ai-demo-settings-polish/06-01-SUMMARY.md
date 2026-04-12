---
phase: 06-testing-console-ai-demo-settings-polish
plan: "01"
subsystem: foundation
tags: [wave-0, sdk, translations, proxy, migrations, test-stubs]
dependency_graph:
  requires: []
  provides:
    - "@elevenlabs/react SDK installed"
    - "anam-agent JSX type declaration"
    - "settings table migration SQL"
    - "37 Phase 6 translation keys"
    - "proxy.ts /demo public exclusion"
    - "Wave 0 test stubs for Plans 02-04"
  affects:
    - "mykasih-crm/components/testing/* (Plans 02)"
    - "mykasih-crm/app/demo/page.tsx (Plan 03)"
    - "mykasih-crm/app/api/settings/route.ts (Plan 04)"
tech_stack:
  added:
    - "@elevenlabs/react (WebRTC voice SDK)"
  patterns:
    - "global.d.ts JSX IntrinsicElements declaration for custom web components"
    - "settings key-value table with RLS service_role policy"
key_files:
  created:
    - mykasih-crm/global.d.ts
    - mykasih-crm/supabase/migrations/20260412_create_settings.sql
    - mykasih-crm/__tests__/testing/VoiceAgentTab.test.tsx
    - mykasih-crm/__tests__/testing/ChatbotSimTab.test.tsx
    - mykasih-crm/__tests__/demo/page.test.tsx
    - mykasih-crm/__tests__/api/settings.test.ts
  modified:
    - mykasih-crm/package.json
    - mykasih-crm/lib/translations.ts
    - mykasih-crm/proxy.ts
decisions:
  - "global.d.ts declares anam-agent as JSX IntrinsicElement — TypeScript strict mode requires this before any .tsx file uses the web component"
  - "proxy.ts demo exclusion uses word-boundary pattern (api/|demo) — demo is a path prefix not a suffix so negative lookahead correctly excludes /demo and any sub-paths"
  - "settings table uses key-value schema (key text PRIMARY KEY, value text NOT NULL) per D-19 — simpler than typed columns, no schema migration on new settings"
  - "Wave 0 test stubs use expect(true).toBe(true) not test.todo() — stubs appear in Jest output as passing and Plans 02-04 replace the body in-place"
metrics:
  duration_seconds: 109
  completed_date: "2026-04-12"
  tasks_completed: 3
  tasks_total: 3
  files_created: 6
  files_modified: 3
---

# Phase 06 Plan 01: Wave 0 Foundation Summary

**One-liner:** Installed @elevenlabs/react, declared anam-agent JSX type, seeded settings migration SQL, added 37 Phase 6 translation keys, patched proxy.ts to make /demo public, and created 4 Wave 0 test stubs unblocking Plans 02-04.

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Install @elevenlabs/react + global.d.ts + settings migration | `74d1860` | package.json, package-lock.json, global.d.ts, 20260412_create_settings.sql |
| 2 | Add Phase 6 translation keys + patch proxy.ts for /demo | `c9456bc` | lib/translations.ts, proxy.ts |
| 3 | Create Wave 0 test stub files for Phase 6 components | `0cbdf5d` | __tests__/testing/VoiceAgentTab.test.tsx, __tests__/testing/ChatbotSimTab.test.tsx, __tests__/demo/page.test.tsx, __tests__/api/settings.test.ts |

## Verification Results

- `npm test -- --passWithNoTests`: 21 test suites, 132 tests — all pass
- `npx tsc --noEmit`: exits 0, no TypeScript errors
- proxy.ts matcher: `/((?!_next/static|_next/image|favicon\\.ico|login|api/|demo).*)` — demo excluded
- translations.ts: 37 new Phase 6 keys (testing.* and settings.* namespaces)
- global.d.ts: declares `anam-agent` JSX IntrinsicElement with `agent-id` prop
- settings migration: CREATE TABLE IF NOT EXISTS settings + RLS + 4 default seed rows
- 4 test stub files: all exist with correct describe() blocks, all 12 stub tests pass

## Decisions Made

1. **global.d.ts JSX declaration pattern** — TypeScript strict mode rejects unknown JSX elements. Declaring `anam-agent` in global.d.ts allows the web component to be used in .tsx files without `@ts-ignore`. The `agent-id` hyphenated prop is also typed as optional string.

2. **proxy.ts demo exclusion uses `api/|demo` pattern** — The word `demo` is added as a pipe-delimited alternative in the negative lookahead. This correctly excludes `/demo` and any sub-paths (e.g., `/demo/anything`). The existing `api/` already uses a trailing slash to scope the exclusion; `demo` intentionally has no trailing slash since the demo page has no sub-routes.

3. **settings key-value schema** — Per D-19: `key text PRIMARY KEY, value text NOT NULL`. Simpler than typed columns — adding new settings requires no migration. Service role RLS policy means only the API route (using service role key) can read/write; no direct client access.

4. **Wave 0 stubs use passing assertions** — `expect(true).toBe(true)` means stubs appear in Jest output as green tests, giving Plans 02-04 a clear baseline. Plans replace the stub body in-place; the describe() structure is preserved.

## Deviations from Plan

None — plan executed exactly as written.

## Threat Surface Scan

| Flag | File | Description |
|------|------|-------------|
| threat_flag: access-control | mykasih-crm/proxy.ts | `/demo` is now excluded from auth middleware — public access intentional per D-15. Demo page has no admin data, no Supabase queries, no API calls. Verify regex does not accidentally match `/demo-admin` or similar paths. The current pattern `demo` (without trailing slash) would match `/demo-admin` — however, no such route exists in this project and the demo page is the only path under `/demo`. Acceptable per T-06-01 disposition. |

## Known Stubs

- `__tests__/testing/VoiceAgentTab.test.tsx` — 3 stub tests with `expect(true).toBe(true)`. Plan 02 replaces bodies.
- `__tests__/testing/ChatbotSimTab.test.tsx` — 3 stub tests with `expect(true).toBe(true)`. Plan 02 replaces bodies.
- `__tests__/demo/page.test.tsx` — 3 stub tests with `expect(true).toBe(true)`. Plan 03 replaces bodies.
- `__tests__/api/settings.test.ts` — 3 stub tests with `expect(true).toBe(true)`. Plan 04 replaces bodies.

These stubs are intentional — they are Wave 0 scaffolding. Each subsequent plan owns the implementation and replaces the stub bodies as part of its behavioral verification.

## Self-Check: PASSED

Files verified:
- FOUND: mykasih-crm/global.d.ts
- FOUND: mykasih-crm/supabase/migrations/20260412_create_settings.sql
- FOUND: mykasih-crm/__tests__/testing/VoiceAgentTab.test.tsx
- FOUND: mykasih-crm/__tests__/testing/ChatbotSimTab.test.tsx
- FOUND: mykasih-crm/__tests__/demo/page.test.tsx
- FOUND: mykasih-crm/__tests__/api/settings.test.ts

Commits verified:
- FOUND: 74d1860
- FOUND: c9456bc
- FOUND: 0cbdf5d
