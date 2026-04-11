# Plan 01-08 — Dashboard Shell SSR Fix: Summary

**Date:** 2026-04-12
**Status:** ✅ Complete
**Commit:** `dc87596` — `fix(layout): server/client split — dashboard shell SSR-safe, sidebar border fix`

---

## Root Cause

`app/(dashboard)/layout.tsx` was marked `'use client'` and called `useLanguage()` directly. On Vercel's SSR environment, Next.js attempted to render this layout on the server — the component threw (or hydration failed silently), causing Next.js to recover by rendering children bare. The entire layout shell (Sidebar + Topbar) was lost on the deployed site.

Note: `useLanguage.ts` was already SSR-safe (localStorage inside `useEffect` guard) — no regression introduced. The bug was purely the `'use client'` placement on the layout file itself.

---

## What Was Fixed

### Task 1 — `app/(dashboard)/layout.tsx` → Server Component
- Removed `'use client'` directive
- Removed direct imports of Sidebar, Topbar, useLanguage
- Delegates entirely to `<DashboardShell>`

### Task 2 — `components/layout/DashboardShell.tsx` (new)
- `'use client'` Client Component
- Holds `useLanguage()` hook
- Renders Sidebar + Topbar + main content (ml-[260px], flex-col)

### Task 3 — `hooks/useLanguage.ts` — No change
- Already SSR-safe: localStorage only inside useEffect
- Supabase language sync retained

### Task 4 — `components/layout/Sidebar.tsx`
- `border-r-2` → `border-r` (1px per design spec)

---

## Verification Results

| Check | Result |
|-------|--------|
| No 'use client' in layout.tsx | PASS |
| DashboardShell.tsx exists | PASS |
| ml-[260px] in DashboardShell | PASS |
| No border-r-2 in Sidebar | PASS |
| npx next build exits 0 | PASS |
| git push to main | PASS — Vercel redeploy triggered |

---

## Files Changed

| File | Change |
|------|--------|
| app/(dashboard)/layout.tsx | Converted to Server Component |
| components/layout/DashboardShell.tsx | Created — Client Component shell |
| components/layout/Sidebar.tsx | border-r-2 → border-r |
