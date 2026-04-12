---
phase: 06-testing-console-ai-demo-settings-polish
plan: "02"
subsystem: testing-console
tags: [testing-console, voice-agent, chatbot-simulator, elevenlabs, tabs]
dependency_graph:
  requires:
    - "06-01 (Wave 0 foundation — @elevenlabs/react installed, translation keys, test stubs)"
  provides:
    - "VoiceAgentTab component with ElevenLabs ConversationProvider"
    - "ChatbotSimTab component with WhatsApp-style bubble UI"
    - "Testing Console page with 3 Shadcn tabs"
    - "is_test=true tagging via dynamicVariables + fallback POST to /api/calls"
  affects:
    - "mykasih-crm/app/(dashboard)/testing/page.tsx (Plan 03 replaces AnamAI placeholder)"
tech_stack:
  added: []
  patterns:
    - "ConversationProvider wrapping useConversation inner component pattern"
    - "Dual is_test tagging: SDK dynamicVariables + onDisconnect fallback POST"
    - "SimMessage interface for typed chatbot bubble state"
key_files:
  created:
    - mykasih-crm/components/testing/VoiceAgentTab.tsx
    - mykasih-crm/components/testing/ChatbotSimTab.tsx
  modified:
    - mykasih-crm/app/(dashboard)/testing/page.tsx
decisions:
  - "dynamicVariables.is_test=true passed to startSession AND fallback POST to /api/calls in onDisconnect — dual path guarantees is_test reaches Supabase regardless of SDK processing"
  - "AnamAITab uses inline placeholder component in testing/page.tsx — Plan 03 replaces placeholder in-place, no file restructuring needed"
  - "ChatbotSimTab uses native input element instead of Shadcn Input — avoids import for a component that needs custom keyDown handler; styling matches design system using CSS vars"
  - "VoiceAgentInner is a private component inside VoiceAgentTab module — ConversationProvider must wrap useConversation consumers; outer export provides the provider boundary"
metrics:
  duration_seconds: 420
  completed_date: "2026-04-12"
  tasks_completed: 2
  tasks_total: 2
  files_created: 2
  files_modified: 1
---

# Phase 06 Plan 02: Testing Console (Voice + Chatbot) Summary

**One-liner:** Built VoiceAgentTab with ElevenLabs ConversationProvider, dual is_test tagging (dynamicVariables + fallback POST), live transcript, and ChatbotSimTab with WhatsApp-style bubbles and IntentBadge; replaced testing/page.tsx stub with a 3-tab Shadcn Tabs layout.

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | VoiceAgentTab + ChatbotSimTab components | `07b02db` | components/testing/VoiceAgentTab.tsx, components/testing/ChatbotSimTab.tsx |
| 2 | Testing Console page with three Shadcn tabs | `c1fbfe9` | app/(dashboard)/testing/page.tsx |

## Verification Results

- `npx tsc --noEmit`: exits 0, no TypeScript errors
- `npm test -- --passWithNoTests`: 21 test suites, 132 tests — all pass
- VoiceAgentTab: contains ConversationProvider, useConversation, startSession, endSession, NEXT_PUBLIC_ELEVENLABS_AGENT_ID, is_test, /api/calls, t('testing.voice.startSession'
- ChatbotSimTab: contains IntentBadge, /api/chatbot/message, simulator-001, isTest: true, first_contact, h-[420px]
- testing/page.tsx: contains TabsContent, VoiceAgentTab, ChatbotSimTab, t('testing.title'), t('testing.tab.voiceAgent') — does NOT contain "This page is being built"

## Decisions Made

1. **Dual is_test tagging** — `dynamicVariables: { is_test: 'true' }` passed to `startSession()` for SDK-level metadata, AND a fallback `POST /api/calls` in the `onDisconnect` callback unconditionally ensures `is_test=true` reaches Supabase. Per threat model T-06-04: both paths are admin-only behind dashboard auth proxy.

2. **AnamAITab inline placeholder** — Since Plan 03 builds AnamAITab, an `AnamAIPlaceholder` function component is defined inline in `testing/page.tsx`. Plan 03 can replace the `<AnamAIPlaceholder />` usage with `<AnamAITab />` without restructuring the file.

3. **ChatbotSimTab uses native input** — The message input uses `<input>` directly rather than the Shadcn Input component. This avoids an extra import and allows clean `onKeyDown` handling while still following the design system's CSS variable tokens for colors and borders.

4. **ConversationProvider / VoiceAgentInner split** — The `useConversation` hook must be used inside a `ConversationProvider`. The exported `VoiceAgentTab` provides the `ConversationProvider` boundary; `VoiceAgentInner` (private, same file) consumes the hook.

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

- `mykasih-crm/app/(dashboard)/testing/page.tsx` — Tab 3 (Anam AI) renders `AnamAIPlaceholder` which shows `t('testing.chat.anamLabel', language)` as a centered text-muted message. Plan 03 replaces this with the real `AnamAITab` component. The plan's core goal (3-tab Testing Console with Voice + Chatbot functional) is fully achieved; the placeholder is intentional Wave 0 scaffolding per plan spec.

## Threat Surface Scan

No new threat surface introduced. All components are admin-only (behind dashboard auth proxy). The `POST /api/calls` fallback uses the existing authenticated route. The chatbot simulator sends `isTest: true` per T-06-03 disposition.

## Self-Check: PASSED

Files verified:
- FOUND: mykasih-crm/components/testing/VoiceAgentTab.tsx
- FOUND: mykasih-crm/components/testing/ChatbotSimTab.tsx
- FOUND: mykasih-crm/app/(dashboard)/testing/page.tsx

Commits verified:
- FOUND: 07b02db
- FOUND: c1fbfe9
