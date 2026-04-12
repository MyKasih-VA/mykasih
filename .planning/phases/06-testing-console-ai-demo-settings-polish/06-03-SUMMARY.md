---
phase: 06-testing-console-ai-demo-settings-polish
plan: "03"
subsystem: anam-ai-demo
tags: [anam-ai, testing-console, demo-page, web-component, public-page]
dependency_graph:
  requires:
    - "06-01 (Wave 0 foundation — global.d.ts, proxy.ts /demo exclusion, test stubs)"
    - "06-02 (Testing Console page with Tab 3 AnamAIPlaceholder)"
  provides:
    - "AnamAITab component — Anam AI web component embed for Testing Console Tab 3"
    - "app/demo/page.tsx — standalone public-facing Anam AI demo page"
    - "Tab 3 of Testing Console wired to real AnamAITab component"
  affects:
    - "mykasih-crm/app/(dashboard)/testing/page.tsx (Tab 3 placeholder replaced)"
tech_stack:
  added: []
  patterns:
    - "useEffect script injection guard for third-party CDN web component (re-mount safe)"
    - "React.JSX namespace augmentation for custom web component (react-jsx transform)"
    - "Standalone page outside dashboard layout group — no auth, no sidebar, no topbar"
key_files:
  created:
    - mykasih-crm/components/testing/AnamAITab.tsx
    - mykasih-crm/app/demo/page.tsx
  modified:
    - mykasih-crm/app/(dashboard)/testing/page.tsx
    - mykasih-crm/global.d.ts
  deleted:
    - mykasih-crm/app/(dashboard)/demo/page.tsx
decisions:
  - "React.JSX namespace augmentation in global.d.ts — Next.js 16 with react-jsx transform requires JSX types in React.JSX, not global JSX namespace; updated global.d.ts to declare namespace React { namespace JSX { ... } }"
  - "Script injection guard checks existing script before appending — prevents duplicate custom element registration on tab re-mount"
  - "Script NOT removed on unmount — custom element registry is global; removing and re-adding would throw DOMException"
  - "app/demo/page.tsx placed outside (dashboard) group — renders with no layout wrapper; proxy.ts already excludes /demo from auth"
  - "Dashboard demo stub (app/(dashboard)/demo/page.tsx) deleted — prevented standalone page from being the canonical /demo route"
metrics:
  duration_seconds: 540
  completed_date: "2026-04-12"
  tasks_completed: 2
  tasks_total: 2
  files_created: 2
  files_modified: 2
  files_deleted: 1
---

# Phase 06 Plan 03: Anam AI Demo + Testing Console Tab 3 Summary

**One-liner:** Built AnamAITab with CDN script injection guard for Testing Console Tab 3, created a standalone public /demo page with MyKasih branding and Anam AI embed, deleted the dashboard demo stub, and fixed global.d.ts to use React.JSX namespace for Next.js 16 react-jsx compatibility.

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | AnamAITab component for Testing Console Tab 3 | `f69d5da` | components/testing/AnamAITab.tsx, global.d.ts |
| 2 | Standalone /demo page + delete dashboard stub + wire Tab 3 | `6542ed0` | app/demo/page.tsx, app/(dashboard)/testing/page.tsx, deleted app/(dashboard)/demo/page.tsx |

## Verification Results

- `npx tsc --noEmit`: exits 0, no TypeScript errors
- `npm test -- --passWithNoTests`: 21 test suites, 132 tests — all pass
- `app/demo/page.tsx` exists — contains "AI Helpline Demo", "Powered by Anam AI", "anam-agent", "NEXT_PUBLIC_ANAM_AGENT_ID", "mykasih.com.my"
- `app/(dashboard)/demo/page.tsx` does NOT exist — stub deleted
- `app/(dashboard)/testing/page.tsx` contains "AnamAITab" import and usage
- `components/testing/AnamAITab.tsx` contains "anam-agent", "unpkg.com/@anam-ai/agent-widget", "NEXT_PUBLIC_ANAM_AGENT_ID", "useEffect", "t('testing.chat.anamLabel'"
- proxy.ts matcher already excludes /demo — public access confirmed

## Decisions Made

1. **React.JSX namespace fix in global.d.ts** — The original global.d.ts declared `declare namespace JSX { interface IntrinsicElements { ... } }` which is the TypeScript 4.x / classic JSX factory pattern. Next.js 16 uses `react-jsx` transform (`jsx: "react-jsx"` in tsconfig), where TypeScript resolves JSX types from `React.JSX` (inside `declare namespace React`). Changing to `declare namespace React { namespace JSX { interface IntrinsicElements { ... } } }` resolves the TS2339 error cleanly.

2. **Script injection guard — no cleanup on unmount** — The `@anam-ai/agent-widget` script registers a custom element (`anam-agent`) in the browser's global custom element registry. Once registered, attempting to re-register throws a `DOMException`. The `useEffect` guard (`document.querySelector('script[src*="@anam-ai/agent-widget"]')`) prevents duplicate injection when the Anam AI tab is re-mounted. The script is intentionally NOT removed on unmount.

3. **Stub deletion required for correct routing** — The dashboard layout group `(dashboard)` wraps all pages inside it with the sidebar/topbar layout. The `/demo` route was resolving to `app/(dashboard)/demo/page.tsx`, which would render inside the dashboard layout. Deleting the stub allows Next.js to resolve `/demo` to `app/demo/page.tsx`, which renders standalone with no layout.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed global.d.ts JSX IntrinsicElements declaration for Next.js 16**
- **Found during:** Task 1 — TypeScript compilation after creating AnamAITab.tsx
- **Issue:** `global.d.ts` used `declare namespace JSX { interface IntrinsicElements }` which is the TypeScript classic JSX pattern. Next.js 16 uses `react-jsx` transform; TypeScript 5.9 resolves JSX types from `React.JSX` namespace, not global `JSX`. TSC reported TS2339: Property 'anam-agent' does not exist on type 'JSX.IntrinsicElements'.
- **Fix:** Changed declaration to `declare namespace React { namespace JSX { interface IntrinsicElements { 'anam-agent': ... } } }`
- **Files modified:** mykasih-crm/global.d.ts
- **Commit:** f69d5da

**2. [Rule 3 - Blocking] Stale .next/types/validator.ts referencing deleted dashboard demo stub**
- **Found during:** Task 2 — TypeScript compilation after deleting dashboard demo stub
- **Issue:** `.next/types/validator.ts` (auto-generated by Next.js) contained a validation block importing `app/(dashboard)/demo/page.js` which no longer exists after stub deletion. This caused TS2307 error.
- **Fix:** Updated the validation block to import `app/demo/page.js` (the new standalone page). Note: `.next` is gitignored — this fix only applies to the local build cache. The file will be regenerated correctly on the next `next build` or `next dev` run.
- **Files modified:** .next/types/validator.ts (local only, not committed — gitignored)

## Threat Surface Scan

No new threat surface beyond what is already documented in the plan's threat model:

| Flag | File | Description |
|------|------|-------------|
| threat_flag: public-access | mykasih-crm/app/demo/page.tsx | Public unauthenticated page — per T-06-07 (accepted). No admin data, no Supabase queries, no API calls. Only renders Anam AI widget. |
| threat_flag: third-party-script | mykasih-crm/app/demo/page.tsx | unpkg.com CDN script loaded at runtime — per T-06-08 (accepted). Widget renders video avatar persona only; no access to app state. |

## Known Stubs

None — all stubs from this plan are fully implemented. The `__tests__/demo/page.test.tsx` Wave 0 stub tests continue to pass (using `expect(true).toBe(true)` placeholder assertions). Per Plan 01 design, these stubs are intentional scaffolding and remain as-is unless a dedicated test implementation plan replaces them.

## Self-Check: PASSED

Files verified:
- FOUND: mykasih-crm/components/testing/AnamAITab.tsx
- FOUND: mykasih-crm/app/demo/page.tsx
- FOUND: mykasih-crm/app/(dashboard)/testing/page.tsx (contains AnamAITab)
- CONFIRMED DELETED: mykasih-crm/app/(dashboard)/demo/page.tsx

Commits verified:
- FOUND: f69d5da
- FOUND: 6542ed0
