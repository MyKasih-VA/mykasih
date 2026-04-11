---
phase: 01-scaffold-db-auth-dashboard-shell
plan: "02"
subsystem: frontend-infrastructure
tags: [css-tokens, fonts, supabase, env, design-system]
dependency_graph:
  requires: ["01-00", "01-01"]
  provides: [css-design-tokens, supabase-clients, font-config, env-template]
  affects: [all-subsequent-plans]
tech_stack:
  added: [class-variance-authority]
  patterns: [supabase-ssr-getall-setall, next-font-google, tailwind-v4-theme-inline]
key_files:
  created:
    - mykasih-crm/app/globals.css
    - mykasih-crm/app/layout.tsx
    - mykasih-crm/lib/supabase/client.ts
    - mykasih-crm/lib/supabase/server.ts
    - mykasih-crm/.env.example
    - mykasih-crm/app/(dashboard)/layout.tsx
  modified:
    - CLAUDE.md
    - mykasih-crm/.gitignore
    - mykasih-crm/package.json
decisions:
  - "Use getAll/setAll cookie pattern for Supabase SSR (not deprecated get/set/remove)"
  - "CLAUDE.md updated: Next.js 14 -> 15/16 per D-08; middleware.ts -> proxy.ts per research"
  - "Added !.env.example exception to .gitignore so template is committable"
metrics:
  duration_seconds: 169
  completed_date: "2026-04-11"
  tasks_completed: 2
  files_created: 6
  files_modified: 3
---

# Phase 01 Plan 02: CSS Design System, Fonts, Supabase Clients & Env Setup — Summary

**One-liner:** Dark-only CSS design system with 12 color tokens, Inter + JetBrains Mono fonts via next/font/google, and Supabase SSR clients using getAll/setAll async cookie pattern for Next.js 16.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Rewrite globals.css + update layout.tsx with fonts | 3b7067f | globals.css, layout.tsx |
| 2 | Create Supabase clients + env files + update CLAUDE.md | 6edd870 | client.ts, server.ts, .env.example, .gitignore, CLAUDE.md |
| - | Auto-fix: build blockers | f7ad21a | (dashboard)/layout.tsx, package.json |

## What Was Built

### globals.css
Full rewrite of the Next.js scaffold CSS. Contains exactly 12 CSS custom properties matching the design system:
- 3 surface tokens: `--bg-primary`, `--bg-surface`, `--bg-border`
- 2 accent tokens: `--accent-primary`, `--accent-teal`
- 2 text tokens: `--text-primary`, `--text-muted`
- 3 status tokens: `--status-green`, `--status-yellow`, `--status-red`
- 2 chart tokens: `--chart-voice`, `--chart-chat`

Tailwind v4 `@theme inline` block wires `--font-inter` and `--font-jetbrains-mono` CSS variables to `--font-sans` and `--font-mono`. Dark-only — no `@media (prefers-color-scheme: dark)` block.

### layout.tsx
Root layout now loads Inter (weights 400, 600) and JetBrains_Mono (weight 400) via `next/font/google`. CSS variable names match the `@theme inline` block in globals.css. Metadata updated to "MyKasih Command Centre / AI Helpline CRM v1.0".

### lib/supabase/client.ts
Browser-side Supabase client factory using `createBrowserClient` from `@supabase/ssr`. Reads `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` from env.

### lib/supabase/server.ts
Server-side Supabase client factory using `createServerClient` with the `getAll`/`setAll` cookie pattern. Uses `await cookies()` (Next.js 16 async cookies API). The `setAll` catch block is intentional — silences errors when called from Server Components (proxy.ts handles session refresh in that case).

### .env.example
All 13 required environment variables with empty values — safe to commit. `.gitignore` updated with `!.env.example` exception so the template is committable while `.env.local` remains protected.

### CLAUDE.md
- `Next.js 14` -> `Next.js 15/16` in Tech Stack and Constraints sections (per D-08)
- `middleware.ts` -> `proxy.ts` in Project Structure (per research finding — Next.js 16 convention)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Empty app/(dashboard)/layout.tsx caused TypeScript build failure**
- **Found during:** Overall build verification
- **Issue:** `app/(dashboard)/layout.tsx` was an empty file with no exports — Next.js type validator failed with "File is not a module"
- **Fix:** Added minimal passthrough `DashboardLayout` default export
- **Files modified:** `mykasih-crm/app/(dashboard)/layout.tsx`
- **Commit:** f7ad21a

**2. [Rule 3 - Blocking] Missing `class-variance-authority` dependency**
- **Found during:** Overall build verification (same build run)
- **Issue:** `components/ui/button.tsx` (Shadcn Button) imports `class-variance-authority` which was not listed in package.json — build failed with "Module not found"
- **Fix:** `npm install class-variance-authority`
- **Files modified:** `mykasih-crm/package.json`, `mykasih-crm/package-lock.json`
- **Commit:** f7ad21a

**3. [Rule 2 - Missing critical functionality] .gitignore blocked .env.example from being committed**
- **Found during:** Task 2 git commit
- **Issue:** `.gitignore` had `.env*` which matched `.env.example` — the template could not be committed for other developers
- **Fix:** Added `!.env.example` exception to `.gitignore`
- **Files modified:** `mykasih-crm/.gitignore`
- **Commit:** 6edd870

## Known Stubs

None. All files contain functional implementations — no placeholder data or TODO stubs.

## Threat Flags

No new threat surface introduced beyond what was in the plan's threat model:
- `.env.local` protected by `.gitignore` (T-01-01 mitigated)
- `SUPABASE_SERVICE_ROLE_KEY` not used in client.ts (T-01-02 mitigated)
- Anon key intentionally public in client.ts (T-01-03 accepted)

## Self-Check: PASSED

Files verified:
- `mykasih-crm/app/globals.css` — FOUND, contains 12 color tokens
- `mykasih-crm/app/layout.tsx` — FOUND, contains Inter + JetBrains_Mono
- `mykasih-crm/lib/supabase/client.ts` — FOUND, exports createClient
- `mykasih-crm/lib/supabase/server.ts` — FOUND, exports async createClient
- `mykasih-crm/.env.example` — FOUND, committed
- `CLAUDE.md` — FOUND, contains proxy.ts and Next.js 15/16

Commits verified:
- 3b7067f — FOUND (feat: globals.css + layout.tsx)
- 6edd870 — FOUND (feat: Supabase clients + env + CLAUDE.md)
- f7ad21a — FOUND (fix: build blockers)

`next build` — PASSED (all routes compiled successfully)
