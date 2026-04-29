---
phase: 06-testing-console-ai-demo-settings-polish
plan: "05"
subsystem: translations
tags: [language, translations, i18n, polish, uat]
dependency_graph:
  requires:
    - "06-02 (VoiceAgentTab, ChatbotSimTab translations)"
    - "06-03 (AnamAITab translations)"
    - "06-04 (Settings translations)"
  provides:
    - "Zero inline language ternaries across all dashboard pages"
    - "Complete BM/EN translation coverage via t() function"
    - "Human-verified Phase 6 deliverables (11/11 items passed)"
  affects:
    - "mykasih-crm/lib/translations.ts (new keys added)"
    - "mykasih-crm/app/(dashboard)/integrations/page.tsx (ternaries → t())"
    - "mykasih-crm/app/(dashboard)/live-monitor/page.tsx (ternaries → t())"
    - "mykasih-crm/components/layout/Sidebar.tsx (ternaries → t())"
    - "mykasih-crm/components/layout/Topbar.tsx (ternaries → t())"
tech_stack:
  added: []
  patterns:
    - "All UI strings use t(key, language) from translations.ts — no inline ternaries"
---

# Plan 06-05 Summary — Language Polish Sweep

## What Was Done

### Task 1: Automated language ternary elimination (commit e52a521)
- Audited all dashboard pages and components for `language === 'en' ? ... : ...` ternaries
- Replaced every inline ternary with `t()` calls from `@/lib/translations.ts`
- Added missing translation keys for integrations, live-monitor, sidebar, and topbar
- Verified zero remaining ternaries via grep (excluding /demo page and test files)

### Task 2: Human visual verification (approved 2026-04-13)
All 11 UAT items verified and approved:
1. Testing Console — 3 tabs (Voice Agent, Kasih Chatbot, Anam AI)
2. Voice Agent tab — session start/stop works
3. Kasih Chatbot tab — message send + bot response with intent badge
4. Kasih Chatbot — clear conversation resets chat
5. Anam AI tab — embed loads
6. /demo page — public access, no sidebar, MyKasih branding
7. Settings page — 4 cards visible
8. Settings — save changes with success toast
9. Settings — webhook URL copy to clipboard
10. Language toggle — all labels switch to BM
11. Full BM coverage — no stray English across all pages

## Files Changed
- `mykasih-crm/lib/translations.ts` — new keys for integrations, live-monitor, sidebar, topbar
- `mykasih-crm/app/(dashboard)/integrations/page.tsx` — ternaries → t()
- `mykasih-crm/app/(dashboard)/live-monitor/page.tsx` — ternaries → t()
- `mykasih-crm/components/layout/Sidebar.tsx` — ternaries → t()
- `mykasih-crm/components/layout/Topbar.tsx` — ternaries → t()

## Decisions
- D-27 exceptions maintained: /demo page stays English-only, dynamic DB data not translated, vendor embeds untouched

## Issues
None.

## Verification
- `grep -rn "language === 'en' ?" app/ components/ --include="*.tsx"` → 0 matches (excluding demo + tests)
- `npx tsc --noEmit` → passes
- Human UAT → 11/11 passed
