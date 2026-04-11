---
phase: 01-scaffold-db-auth-dashboard-shell
plan: 03
subsystem: auth-translations
tags: [auth, middleware, translations, language-toggle, login, supabase]
dependency_graph:
  requires: [01-02]
  provides: [proxy.ts, translations.ts, useLanguage, login-page]
  affects: [all-dashboard-pages, language-toggle, auth-flow]
tech_stack:
  added: []
  patterns:
    - Supabase SSR proxy pattern with getUser() (not getSession) for tamper-proof auth
    - getAll/setAll cookie pattern inline in proxy (cannot import lib in middleware)
    - useLanguage hook with dual persistence: localStorage primary + Supabase users.language sync (DASH-04)
    - Role-based redirect after signInWithPassword: admin/mykasih -> /, qmedia -> /analytics, supervisor -> /live-monitor
    - Standard form onSubmit (no Next.js Form component per D-09)
key_files:
  created:
    - mykasih-crm/proxy.ts
    - mykasih-crm/lib/translations.ts
    - mykasih-crm/hooks/useLanguage.ts
    - mykasih-crm/app/(auth)/login/page.tsx
  modified: []
decisions:
  - proxy.ts uses getUser() not getSession() — getSession reads from cookie storage which can be tampered; getUser() validates server-side against Supabase
  - useLanguage Supabase sync is best-effort (try/catch) — localStorage is always the source of truth to prevent UI blocking
  - Login page defaults to 'en' language — user not authenticated on login page, no preference available
metrics:
  duration: 10m
  completed_date: "2026-04-11T09:26:39Z"
  tasks_completed: 2
  tasks_total: 2
  files_created: 4
  files_modified: 0
---

# Phase 1 Plan 3: Auth Proxy, Translations, Language Hook & Login Page Summary

**One-liner:** Supabase SSR proxy with getUser() route protection, full EN/BM translation dictionary, dual-persistence language hook, and role-based login redirect.

## What Was Built

### Task 1: proxy.ts + translations.ts + useLanguage hook

**proxy.ts** — Route protection middleware that guards all dashboard paths. Uses `getUser()` (not `getSession()`) per Supabase security guidance to validate JWT server-side rather than reading from potentially tampered cookies. Implements inline `getAll`/`setAll` cookie pattern (cannot import from lib/ in Next.js proxy files). Redirects unauthenticated users to `/login` and redirects authenticated users away from `/login` to `/`.

**lib/translations.ts** — Full EN/BM translation dictionary covering all Phase 1 UI labels: 5 nav group labels, 14 nav item labels, 6 login page strings, 8 dashboard labels, 2 empty state strings, 2 sidebar footer strings, 6 table column labels, 2 channel labels, and 1 common string. Exports typed `t()` helper function with `TranslationKey` type for compiler-enforced key safety.

**hooks/useLanguage.ts** — Client-side language toggle hook with `isLoaded` flag to prevent flash of wrong language on first render. Reads from localStorage on mount, defaults to `en`. Every language change writes to both localStorage (primary, synchronous) and Supabase `users.language` (DASH-04, best-effort async via try/catch). Exposes `language`, `setLanguage`, `toggleLanguage`, and `isLoaded`.

### Task 2: Login page

**app/(auth)/login/page.tsx** — Client component with full-page centered dark layout. MyKasih Foundation logo above card, app name and subtitle below. Card uses `--bg-surface` background with `--bg-border` border. Email and password inputs with `--accent-teal` focus ring. Sign In button with `--accent-primary` background shows `Loader2` spinner and "Signing in..." during loading. Error message in `--status-red` directly below button (AUTH-03). Role-based redirect after successful sign-in: qmedia → /analytics, supervisor → /live-monitor, all others → /. Uses standard `<form onSubmit>` (not Next.js `<Form>` per D-09).

## Commits

| Task | Commit | Files |
|------|--------|-------|
| Task 1: proxy + translations + useLanguage | 24ed933 | mykasih-crm/proxy.ts, mykasih-crm/lib/translations.ts, mykasih-crm/hooks/useLanguage.ts |
| Task 2: login page | d7d4881 | mykasih-crm/app/(auth)/login/page.tsx |

## Verification Results

- `npx next build` passes — /login compiled as static page, proxy detected as Middleware
- npm test passes — 25 todo tests, 0 failures
- All Task 1 acceptance criteria: PASS
- All Task 2 acceptance criteria: PASS

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Prerequisite plan 02 artifacts already present**
- **Found during:** Pre-task environment check
- **Issue:** Plan 03 depends on plan 02 (lib/supabase/client.ts, server.ts, globals.css) — these were already committed by a prior plan 02 executor
- **Fix:** Verified all prerequisites existed, no action required beyond confirming file contents
- **Files modified:** None (prerequisites verified as correct)

## Known Stubs

None — all four files implement their full intended functionality. No placeholder data, hardcoded empty values, or incomplete flows. The translation dictionary covers all Phase 1 UI labels as specified in the UI-SPEC copywriting contract.

## Threat Flags

No new threat surface introduced beyond what was documented in the plan's threat model. proxy.ts, login page, useLanguage hook, and translations.ts all operate within the boundaries defined in T-03-01 through T-03-06.

## Self-Check: PASSED

- [x] mykasih-crm/proxy.ts — FOUND
- [x] mykasih-crm/lib/translations.ts — FOUND
- [x] mykasih-crm/hooks/useLanguage.ts — FOUND
- [x] mykasih-crm/app/(auth)/login/page.tsx — FOUND
- [x] Commit 24ed933 — VERIFIED (feat(01-03): add proxy.ts, translations, useLanguage hook...)
- [x] Commit d7d4881 — VERIFIED (feat(01-03): create login page with Supabase auth...)
- [x] next build PASSED
- [x] npm test PASSED
