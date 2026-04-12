# Phase 6: Testing Console, AI Demo, Settings & Polish - Research

**Researched:** 2026-04-12
**Domain:** ElevenLabs React SDK, Anam AI web component, Supabase key-value settings, BM/EN translation coverage, Next.js 16 route protection
**Confidence:** HIGH (codebase verified) / MEDIUM (ElevenLabs v1.1.0 SDK API — docs 404ing, derived from npm search + GitHub SKILL.md)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Testing Console — Tab Structure**
- D-01: Shadcn `Tabs` component (already installed) — three tabs: "Voice Agent" | "Kasih Chatbot" | "Anam AI". Tab state managed in-component (no URL routing per tab).
- D-02: Tab layout: full-width content area below tab bar; each tab renders its own sub-component.

**Tab 1: Voice Agent**
- D-03: Use `useConversation` hook from `@elevenlabs/react` — custom component, WebRTC connection (`connectionType: "webrtc"`).
- D-04: UI: centered mic button (Start Session / End Session toggle), status badge with colored dot (Ready = `--status-green`, Connecting = `--status-yellow`, Active = `--status-green` pulse, Ended = `--text-muted`), live transcript panel scrolls below.
- D-05: All test sessions tagged `is_test=true` — passed as metadata in `startSession()` call so the webhook picks it up.
- D-06: Agent ID from `process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID`.

**Tab 2: Kasih Chatbot Simulator**
- D-07: Calls real `/api/chatbot/message` route. Input field simulates the WA sender.
- D-08: Dark WhatsApp-style UI: fixed-height scrollable bubble area (`h-[420px]`). User bubbles: right-aligned, `--accent-primary` background. Bot bubbles: left-aligned, `--bg-surface` background with `--bg-border` border.
- D-09: Send on Enter + Send button. Loading spinner (dots animation) while waiting for bot response.
- D-10: Intent badge (colored text pill, `color-mix` pattern from Phase 4) shown on each bot response below the bubble text.
- D-11: "Clear conversation" button resets the chat state. No persistent save — test interactions not logged as `calls` rows from the simulator.

**Tab 3: Anam AI**
- D-12: `<anam-agent>` web component embed using `NEXT_PUBLIC_ANAM_AGENT_ID` env var.
- D-13: Script loaded via unpkg: `<script src="https://unpkg.com/@anam-ai/agent-widget" async></script>` — added to the tab component via `useEffect` script injection (Next.js client component pattern).
- D-14: Tab content: brief label ("Anam AI Persona — client-facing demo") + the agent embed filling available height.

**AI Demo Page (/demo)**
- D-15: Public — no auth required. Page lives at `app/demo/page.tsx` (NOT inside `(dashboard)` layout group). Remove/repurpose existing dashboard stub.
- D-16: Custom minimal layout: MyKasih logo centered at top, "AI Helpline Demo" title, "Powered by Anam AI" footer credit. No sidebar, no topbar, no language toggle.
- D-17: Full-height Anam AI embed (`<anam-agent>`) as the main content.
- D-18: Page background uses `--bg-primary` (dark).

**Settings Page**
- D-19: New Supabase `settings` table: `key text PRIMARY KEY, value text NOT NULL, updated_at timestamptz DEFAULT now()`.
- D-20: Editable fields: `agent_hours_start` (HH:MM, default "08:00"), `agent_hours_end` (HH:MM, default "17:00"), `notification_email`, `data_retention_days` (integer, default 90).
- D-21: Read-only fields: Voice webhook URL and Chat webhook URL — displayed in disabled inputs with "Copy" button.
- D-22: Save button → `PATCH /api/settings` → upsert all key-value pairs. Success/error toast.
- D-23: New API routes: `GET /api/settings` + `PATCH /api/settings`. Admin-only access via role check.
- D-24: Settings page layout: two-column card grid. Card 1: Agent Hours. Card 2: Notifications. Card 3: Data Retention. Card 4: Webhook URLs (read-only). Single "Save Changes" button.

**Language Polish (TEST-06)**
- D-25: Full audit — eliminate all inline `language === 'en' ? '...' : '...'` ternaries outside the `t()` pattern. Replace with `t('key', language)` calls.
- D-26: Add missing translation keys to `lib/translations.ts` for: Testing Console (tabs, status labels, button labels), Settings page (all field labels, section headers, webhook URL labels), and any gaps in Phase 5 pages.
- D-27: Scope: every visible string on every page should use `t()`. Exceptions: dynamic DB data, vendor embed content (Anam AI / ElevenLabs).

### Claude's Discretion
- Exact `useConversation` hook event handlers and error handling
- Live transcript update frequency/debouncing
- Tab 2 intent badge color mapping (reuse existing badge palette from Phase 4)
- Intensity of the "Active" mic button pulse animation
- Number of rows in Settings table at initial seed (can start empty, `GET /api/settings` returns defaults if key not found)
- Exact copy for "Powered by Anam AI" footer on Demo page

### Deferred Ideas (OUT OF SCOPE)
- None — discussion stayed within phase scope.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| TEST-01 | Testing Console Tab 1 — ElevenLabs voice agent embed (@elevenlabs/react), all test calls tagged is_test=true | ElevenLabs SDK v1.1.0 API verified; is_test passed via dynamic_variables in startSession; ConversationProvider pattern confirmed |
| TEST-02 | Testing Console Tab 2 — Kasih chatbot simulator, dark WhatsApp-style UI, intent badge on bot responses | `/api/chatbot/message` route verified; IntentBadge component already exists in `components/chat/IntentBadge.tsx`; chatbot API request shape documented |
| TEST-03 | Testing Console Tab 3 — Anam AI persona embed (anam-agent web component) | Confirmed: `@anam-ai/agent-widget` v0.3.1 on npm; script injection via useEffect pattern established |
| TEST-04 | AI Demo page (/demo) — standalone Anam AI persona embed, no sidebar, client-facing design | Route must be at `app/demo/page.tsx`; CRITICAL: proxy.ts matcher must add `demo` exclusion; same web component pattern as Tab 3 |
| TEST-05 | Settings page — agent hours config, webhook URL display, notification preferences, data retention | New `settings` table migration needed; GET/PATCH /api/settings routes needed; admin role guard pattern established |
| TEST-06 | Language toggle fully applied to all sidebar labels, page titles, status labels, table headers | 247 existing translation keys in translations.ts; stubs (testing/settings pages) still use inline ternaries — need full t() migration |
</phase_requirements>

---

## Summary

Phase 6 is the final feature phase before UAT, delivering three interconnected subsystems: (1) a Testing Console that lets admins exercise all three AI channels from a single tabbed interface, (2) a standalone public AI Demo page for client presentations, and (3) a Settings page backed by a new key-value Supabase table. A horizontal language polish sweep across all pages completes the phase.

The technical risk is low because this phase almost entirely assembles existing project infrastructure. The Tabs component, IntentBadge, ChannelBadge, toast pattern, and copy-to-clipboard pattern are all already present. The primary new dependencies are the ElevenLabs React SDK (not yet installed — must be npm installed before Tab 1 can be built) and the Anam AI widget script (loaded at runtime from unpkg, no npm install required).

The highest-risk item is the `/demo` public route. The current `proxy.ts` auth matcher does not exclude `/demo`, so the demo page will redirect unauthenticated clients to `/login`. This must be fixed as Wave 0 infrastructure before the Anam AI embed can be tested publicly. The second risk is the ElevenLabs SDK breaking change: v1.1.0 introduced `ConversationProvider` as a required ancestor component — the hook cannot be used standalone.

**Primary recommendation:** Install `@elevenlabs/react` first, wrap `VoiceAgentTab` in `ConversationProvider`, then pass `is_test: true` via `dynamic_variables` in `startSession()`. Fix `proxy.ts` before building the demo page.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@elevenlabs/react` | 1.1.0 | Voice agent hook for Tab 1 | Canonical ElevenLabs React integration; specified in CLAUDE.md |
| `@radix-ui/react-tabs` | 1.1.13 | Three-tab Testing Console | Already installed; used in Phase 5 KB BM/EN toggle |
| `sonner` | 2.0.7 | Success/error toasts | Already installed; used in Phases 4 and 5 |
| `@supabase/supabase-js` | 2.103.0 | Settings table upsert | Already installed; service role client pattern established |

[VERIFIED: package.json in codebase] — All versions above confirmed from installed `package.json`.

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@anam-ai/agent-widget` | 0.3.1 (unpkg) | Anam AI web component | Loaded via `<script>` at runtime — no npm install; use in Tab 3 and /demo page |
| Lucide React | 1.8.0 | Mic, Settings, Send icons | Already installed |
| Shadcn `Input`, `Button`, `Card`, `Switch`, `Badge` | Installed | Settings form UI elements | Already in project |

[VERIFIED: npm registry] — `@anam-ai/agent-widget@0.3.1` confirmed via `npm view @anam-ai/agent-widget version`.
[VERIFIED: npm registry] — `@elevenlabs/react@1.1.0` confirmed via `npm view @elevenlabs/react version`.

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Script injection via useEffect | npm install @anam-ai/agent-widget | npm approach gives type safety; unpkg script is simpler and matches D-13 decision |
| Supabase key-value settings table | JSON config file | Table allows runtime edits without redeploy; aligns with D-19 decision |
| `useConversation` (ElevenLabs) | `@elevenlabs/convai-widget` embed | Widget embed is simpler but gives less control over is_test tagging; hook approach required by D-03 |

**Installation:**
```bash
# From mykasih-crm/ directory
npm install @elevenlabs/react
```

Anam AI widget: loaded from unpkg at runtime — no npm install step.

---

## Architecture Patterns

### Recommended File Structure (Phase 6 additions)
```
app/
├── demo/
│   └── page.tsx                          ← NEW: public, no layout wrapper
├── (dashboard)/
│   ├── testing/page.tsx                  ← REPLACE stub content
│   └── settings/page.tsx                 ← REPLACE stub content
│
api/
│   └── settings/
│       └── route.ts                      ← NEW: GET + PATCH
│
components/
│   ├── testing/
│   │   ├── VoiceAgentTab.tsx             ← NEW: ElevenLabs embed
│   │   ├── ChatbotSimTab.tsx             ← NEW: WA-style simulator
│   │   └── AnamAITab.tsx                 ← NEW: web component embed
│   └── settings/
│       └── SettingsForm.tsx              ← NEW: form + save
│
supabase/
│   └── migrations/
│       └── 20260412_create_settings.sql  ← NEW: settings key-value table
│
lib/
│   └── translations.ts                   ← EXTEND: add Phase 6 keys
│
proxy.ts                                  ← PATCH: add demo to exclusion list
```

### Pattern 1: ElevenLabs Voice Agent with ConversationProvider

**What:** The v1.1.0 SDK requires `ConversationProvider` as an ancestor; `useConversation` cannot be used standalone.
**When to use:** Whenever embedding the voice agent. Provider wraps the component, hook is called inside.

```typescript
// Source: [CITED: github.com/elevenlabs/packages SKILL.md]
// VoiceAgentTab.tsx — 'use client'
import { ConversationProvider, useConversation } from '@elevenlabs/react'

function VoiceAgentInner() {
  const { startSession, endSession, status, transcript } = useConversation({
    onConnect: () => console.log('Connected'),
    onDisconnect: () => console.log('Disconnected'),
    onError: (error) => console.error('ElevenLabs error:', error),
    onMessage: (message) => console.log('Message:', message),
  })

  const handleStart = async () => {
    await startSession({
      agentId: process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID!,
      connectionType: 'webrtc',
      // Pass is_test=true so ElevenLabs webhook picks it up as metadata
      // Note: exact parameter name — see Pitfall 1 below
    })
  }

  // ... mic button UI, status badge, transcript panel
}

export function VoiceAgentTab() {
  return (
    <ConversationProvider>
      <VoiceAgentInner />
    </ConversationProvider>
  )
}
```

**CRITICAL NOTE on `is_test` passing:** The ElevenLabs docs URL is currently returning 404. Based on the SKILL.md migration guide, `startSession` in v1.1.0 accepts `dynamic_variables` and `overrides`. The `is_test` flag should be passed via `dynamic_variables: { is_test: 'true' }` and the webhook handler reads it from the ElevenLabs payload. Alternatively, since the webhook route already handles `is_test`, the voice tab can fire a secondary request to `/api/calls` to tag the call after session ends. [ASSUMED] — exact field name `dynamic_variables` vs `customLlmExtraBody` needs confirming against the installed SDK types.

### Pattern 2: Anam AI Web Component via useEffect Script Injection

**What:** The `<anam-agent>` custom element is defined by a `<script>` loaded from unpkg. In Next.js, third-party scripts that define custom elements must be injected via `useEffect` (can't use `next/script` with custom elements in client components without additional setup).
**When to use:** Tab 3 of Testing Console and `/demo` page.

```typescript
// Source: [ASSUMED based on Next.js useEffect pattern + CLAUDE.md specification]
// AnamAITab.tsx — 'use client'
import { useEffect } from 'react'

export function AnamAITab() {
  useEffect(() => {
    const existing = document.querySelector(
      'script[src*="@anam-ai/agent-widget"]'
    )
    if (existing) return  // already loaded (tab re-mount guard)

    const script = document.createElement('script')
    script.src = 'https://unpkg.com/@anam-ai/agent-widget'
    script.async = true
    document.body.appendChild(script)

    return () => {
      // Do NOT remove script on unmount — custom element registry is global
    }
  }, [])

  return (
    <div className="flex-1 flex flex-col gap-2">
      <p className="text-sm text-[var(--text-muted)]">
        Anam AI Persona — client-facing demo
      </p>
      {/* Custom element — TypeScript JSX doesn't know this element; cast via declaration merging or use dangerouslySetInnerHTML wrapper */}
      <anam-agent
        agent-id={process.env.NEXT_PUBLIC_ANAM_AGENT_ID}
        style={{ flexGrow: 1, minHeight: '480px' }}
      />
    </div>
  )
}
```

**TypeScript declaration needed:** Custom elements cause TS errors in JSX. Add a `global.d.ts` declaration:
```typescript
// global.d.ts
declare namespace JSX {
  interface IntrinsicElements {
    'anam-agent': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
      'agent-id'?: string
    }
  }
}
```

### Pattern 3: Settings Key-Value API Route

**What:** Admin-only GET/PATCH route backed by a `settings` Supabase table. Returns all keys as a flat object; upserts an array of `{key, value}` pairs.
**When to use:** Settings page load and save.

```typescript
// Source: [VERIFIED: existing export/calls/route.ts role-guard pattern in codebase]
// app/api/settings/route.ts
export const runtime = 'nodejs'

import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: userRecord } = await supabase
    .from('users').select('role').eq('id', user.id).single()
  if (!userRecord || userRecord.role !== 'admin') {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data, error } = await supabase.from('settings').select('key, value')
  if (error) return Response.json({ error: 'Failed to load settings' }, { status: 500 })

  // Return as flat object { agent_hours_start: "08:00", ... }
  const result = Object.fromEntries((data ?? []).map((r) => [r.key, r.value]))
  return Response.json(result)
}

export async function PATCH(request: Request) {
  // ... same auth guard, then upsert array
}
```

### Pattern 4: Chatbot Simulator (Tab 2) — API Shape

The existing `/api/chatbot/message` route expects:
```typescript
// Source: [VERIFIED: app/api/chatbot/message/route.ts in codebase]
interface ChatbotRequest {
  waPhone: string      // Simulator: use a fake number like "simulator-001"
  message: string      // What staff types
  wamid?: string       // Optional dedup key — omit from simulator
  contactName?: string // Optional
  isTest?: boolean     // Set true from simulator
}
```

Response shape:
```typescript
{ status: 'ok' | 'first_contact', intent: string, language: 'bm' | 'en' }
// OR for first contact: { status: 'first_contact', language }
```

**CRITICAL:** The chatbot route validates `N8N_WEBHOOK_SECRET` if the env var is set. The simulator must either include the header or the route must allow unauthenticated simulator calls. Since the simulator is an admin-only dashboard page, the safest approach is to bypass the n8n secret check (which is conditional on env var presence per Phase 3 decision: "n8n secret check is conditional on env var presence — allows direct Meta hit fallback in development"). The simulator can call the route directly without the n8n secret header — the route conditionally skips the check.

**Simulator UI state shape:**
```typescript
interface SimMessage {
  role: 'user' | 'bot'
  text: string
  intent?: string       // Only on bot messages
  timestamp: Date
}
```

### Pattern 5: Demo Page — Public Route with No Layout

```typescript
// Source: [VERIFIED: app/demo/page.tsx and app/(dashboard)/layout.tsx in codebase]
// app/demo/page.tsx — NOT inside (dashboard) group
// This page has no sidebar/topbar because it's outside the (dashboard) layout

// ALSO REQUIRED: Update proxy.ts matcher to exclude /demo
// Current matcher: /((?!_next/static|_next/image|favicon\.ico|login|api/).*)
// Updated matcher: /((?!_next/static|_next/image|favicon\.ico|login|api/|demo).*)
```

### Anti-Patterns to Avoid

- **Using `useConversation` without `ConversationProvider`:** v1.1.0 requires the provider ancestor. Will throw at runtime.
- **Calling `startSession()` inside try/catch and expecting it to throw:** v1.1.0 `startSession` is now synchronous and returns void. Handle errors via `onError` callback.
- **Awaiting `startSession()` in v1.1.0:** Remove `await` — startSession no longer returns a promise per the SDK migration guide.
- **Loading the Anam script multiple times:** The custom element registry is global. Guard with `document.querySelector('script[src*="@anam-ai/agent-widget"]')` before appending a new script tag.
- **Forgetting to exclude `/demo` from proxy.ts:** The current matcher will catch `/demo` and redirect unauthenticated clients to login — breaking the public demo page.
- **Inline ternaries instead of `t()`:** All Phase 6 stubs use `language === 'en' ? '...' : '...'` — these must be replaced with `t('key', language)` as part of TEST-06.
- **Storing plain-text email in settings:** The `notification_email` value in the `settings` table is an email address — this is staff-facing config data, not beneficiary personal data, so PDPA masking is NOT required here. The table does not store IC numbers.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Intent color mapping | Custom switch in Tab 2 | Import `IntentBadge` from `components/chat/IntentBadge.tsx` | Already built with all 5 intent colors + `formatIntentLabel` |
| Channel badge display | Custom badge | Import `ChannelBadge` from `components/calls/ChannelBadge.tsx` | Already built with correct channel colors |
| Copy to clipboard | Custom implementation | Pattern from `app/(dashboard)/integrations/page.tsx` — `navigator.clipboard.writeText()` + `toast.success()` | Already battle-tested in Phase 5 |
| Toast notifications | Custom alert system | `sonner` — `toast.success()`, `toast.error()` | Already installed and used throughout |
| Role guard in API routes | Custom auth logic | Pattern from `app/api/export/calls/route.ts` — auth.getUser() + users table role lookup | Established pattern in Phase 2 |
| Translation strings | Inline ternaries | `t('key', language)` from `lib/translations.ts` | Type-safe, all keys already defined for nav/page labels |

**Key insight:** Every UI pattern needed for this phase was built in Phases 4 and 5. This phase assembles components; it does not invent new patterns.

---

## Common Pitfalls

### Pitfall 1: ElevenLabs SDK Breaking Change — ConversationProvider Required
**What goes wrong:** `useConversation` throws "No ConversationProvider found" error at runtime.
**Why it happens:** v1.1.0 introduced `ConversationProvider` as mandatory ancestor. The CLAUDE.md example predates this change.
**How to avoid:** Always wrap the component using `useConversation` in `<ConversationProvider>`. The provider can be scoped to just `VoiceAgentTab` — no need to wrap the entire page.
**Warning signs:** React error boundary catches runtime error mentioning ConversationProvider or context.

### Pitfall 2: is_test Flag Not Reaching Webhook
**What goes wrong:** Test voice calls are not tagged `is_test=true` in Supabase — they pollute analytics.
**Why it happens:** The `is_test` flag must travel from the Testing Console → ElevenLabs session → ElevenLabs webhook payload → Next.js webhook handler → Supabase call record. The exact SDK parameter name for passing this metadata is uncertain (docs 404ing).
**How to avoid:** Inspect the installed SDK's TypeScript types (`node_modules/@elevenlabs/react/dist`) to confirm whether `startSession` accepts `dynamic_variables`, `customLlmExtraBody`, or another field. If no metadata path exists, the Voice webhook handler can identify test sessions by checking a known pattern (e.g., a specific `agentId` override or response metadata). [ASSUMED — confirm by reading installed types]
**Warning signs:** Calls from Testing Console appear in the main calls table without `is_test=true`.

### Pitfall 3: /demo Page Blocked by Auth Proxy
**What goes wrong:** Unauthenticated client visits `/demo` and is redirected to `/login`. The demo is unusable.
**Why it happens:** `proxy.ts` matcher `/((?!_next/static|_next/image|favicon\.ico|login|api/).*)` catches everything, including `/demo`.
**How to avoid:** Add `demo` to the negative lookahead in the matcher before implementing the demo page. Update: `/((?!_next/static|_next/image|favicon\\.ico|login|api/|demo).*)`.
**Warning signs:** Visiting `/demo` without being logged in redirects to `/login`.

### Pitfall 4: Existing Dashboard Demo Stub Conflicts
**What goes wrong:** Both `app/(dashboard)/demo/page.tsx` AND `app/demo/page.tsx` exist simultaneously — wrong one renders.
**Why it happens:** The stub was built inside the dashboard layout group. D-15 requires moving it outside.
**How to avoid:** Delete `app/(dashboard)/demo/page.tsx` after creating `app/demo/page.tsx`. The sidebar nav link to `/demo` should then correctly route to the standalone page.
**Warning signs:** `/demo` renders with sidebar visible.

### Pitfall 5: Chatbot Simulator Breaks on First Contact Response
**What goes wrong:** Tab 2 simulator receives `{ status: 'first_contact' }` on first message and shows no bot bubble — the simulator doesn't handle this response shape.
**Why it happens:** The chatbot route returns early for first contact (sends WA buttons), returning `{ status: 'first_contact', language }` instead of a text response.
**How to avoid:** In the simulator, detect `status: 'first_contact'` in the response and render a synthetic bot bubble: "Selamat datang ke MyKasih. Sila pilih perkhidmatan: [Semak baki | Kedai berdekatan | Bantuan SARA | Status aduan]" (static string matching the real chatbot welcome text). Mark intent as `null` on this first-contact bubble.
**Warning signs:** First message in simulator shows no bot response.

### Pitfall 6: Translation Keys Missing — TypeScript Catches at Compile Time
**What goes wrong:** `t('testing.voiceTab', language)` throws a TypeScript error because the key is not in the `translations` object.
**Why it happens:** `TranslationKey` is a strict union derived from `keyof typeof translations`. Missing keys fail type checking.
**How to avoid:** Add ALL Phase 6 translation keys to `lib/translations.ts` in Wave 0 (before implementing any page that calls them). This is the safest approach — compile errors prevent runtime missing-key failures.
**Warning signs:** TypeScript error: "Argument of type '\"testing.voiceTab\"' is not assignable to parameter of type 'TranslationKey'."

### Pitfall 7: Settings API Upsert — Type Mismatch for data_retention_days
**What goes wrong:** `data_retention_days` is stored as text in the key-value table but used as an integer. Comparison or arithmetic operations fail.
**Why it happens:** The `settings` table stores all values as `text`. The consumer must coerce types on read.
**How to avoid:** In the Settings page component and any code that reads `data_retention_days`, always `parseInt(value, 10)` before use. Document this in the API response type definition.
**Warning signs:** `data_retention_days * 24` returns NaN.

---

## Code Examples

### Translation Keys — Phase 6 Required Additions
```typescript
// Source: [VERIFIED: existing translations.ts pattern in codebase]
// Add to lib/translations.ts

// Testing Console
'testing.title': { en: 'Testing Console', bm: 'Konsol Ujian' },
'testing.tab.voiceAgent': { en: 'Voice Agent', bm: 'Ejen Suara' },
'testing.tab.kasihChatbot': { en: 'Kasih Chatbot', bm: 'Chatbot Kasih' },
'testing.tab.anamAI': { en: 'Anam AI', bm: 'Anam AI' },
'testing.voice.startSession': { en: 'Start Session', bm: 'Mulakan Sesi' },
'testing.voice.endSession': { en: 'End Session', bm: 'Tamatkan Sesi' },
'testing.voice.status.ready': { en: 'Ready', bm: 'Sedia' },
'testing.voice.status.connecting': { en: 'Connecting...', bm: 'Menyambung...' },
'testing.voice.status.active': { en: 'Active', bm: 'Aktif' },
'testing.voice.status.ended': { en: 'Ended', bm: 'Tamat' },
'testing.voice.liveTranscript': { en: 'Live Transcript', bm: 'Transkrip Langsung' },
'testing.voice.testTagged': { en: 'All sessions tagged is_test=true', bm: 'Semua sesi ditanda is_test=true' },
'testing.chat.inputPlaceholder': { en: 'Type a message as a beneficiary...', bm: 'Taip mesej sebagai penerima manfaat...' },
'testing.chat.send': { en: 'Send', bm: 'Hantar' },
'testing.chat.clearConversation': { en: 'Clear Conversation', bm: 'Kosongkan Perbualan' },
'testing.chat.anamLabel': { en: 'Anam AI Persona — client-facing demo', bm: 'Persona Anam AI — demo untuk pelanggan' },

// Settings page
'settings.title': { en: 'Settings', bm: 'Tetapan' },
'settings.agentHours': { en: 'Agent Hours', bm: 'Waktu Ejen' },
'settings.agentHoursStart': { en: 'Start Time', bm: 'Masa Mula' },
'settings.agentHoursEnd': { en: 'End Time', bm: 'Masa Tamat' },
'settings.notifications': { en: 'Notifications', bm: 'Pemberitahuan' },
'settings.notificationEmail': { en: 'Notification Email', bm: 'E-mel Pemberitahuan' },
'settings.dataRetention': { en: 'Data Retention', bm: 'Pengekalan Data' },
'settings.dataRetentionDays': { en: 'Retention Period (days)', bm: 'Tempoh Pengekalan (hari)' },
'settings.webhookUrls': { en: 'Webhook URLs', bm: 'URL Webhook' },
'settings.voiceWebhookUrl': { en: 'Voice Webhook URL', bm: 'URL Webhook Suara' },
'settings.chatWebhookUrl': { en: 'Chat Webhook URL', bm: 'URL Webhook Chat' },
'settings.copyUrl': { en: 'Copy', bm: 'Salin' },
'settings.saveChanges': { en: 'Save Changes', bm: 'Simpan Perubahan' },
'settings.saveSuccess': { en: 'Settings saved', bm: 'Tetapan disimpan' },
'settings.saveError': { en: 'Failed to save settings. Try again.', bm: 'Gagal menyimpan tetapan. Cuba lagi.' },
'settings.loadError': { en: 'Failed to load settings. Try refreshing.', bm: 'Gagal memuatkan tetapan. Cuba muat semula.' },
```

### Settings Table Migration
```sql
-- Source: [VERIFIED: existing migrations pattern in supabase/migrations/]
-- supabase/migrations/20260412_create_settings.sql

CREATE TABLE IF NOT EXISTS settings (
  key        text PRIMARY KEY,
  value      text NOT NULL,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Service role only — settings are admin-managed via API route
CREATE POLICY "Service role full access on settings"
  ON settings FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Seed defaults so GET /api/settings returns values immediately
INSERT INTO settings (key, value) VALUES
  ('agent_hours_start', '08:00'),
  ('agent_hours_end',   '17:00'),
  ('notification_email', ''),
  ('data_retention_days', '90')
ON CONFLICT (key) DO NOTHING;
```

### proxy.ts Patch (CRITICAL)
```typescript
// Source: [VERIFIED: existing proxy.ts in codebase]
// Add "demo" to the exclusion list in proxy.ts

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|login|api/|demo).*)",
  ],
}
```

### Inline Ternary Audit — Pages to Sweep for TEST-06

Confirmed inline ternaries in Phase 6 stubs (replace with `t()`):
- `app/(dashboard)/testing/page.tsx` — 2 ternaries (heading, body text)
- `app/(dashboard)/settings/page.tsx` — 2 ternaries (heading, body text)
- `app/(dashboard)/demo/page.tsx` — 2 ternaries (heading, body text) — this file is being deleted

Phase 5 pages to audit for remaining ternaries (not yet confirmed as fully using `t()`):
- `app/(dashboard)/live-monitor/page.tsx` — stale-session count label
- `app/(dashboard)/integrations/page.tsx` — check for any inline strings not routed through `t()`
- Any component files in `components/layout/Topbar.tsx`, `components/layout/Sidebar.tsx` — date formatting may be inline

---

## Runtime State Inventory

This phase is a greenfield feature addition (new pages, new API routes, new table). It is NOT a rename/refactor phase.

**Nothing found in any runtime state category** — verified by inspecting phase scope. No existing data needs migration. The new `settings` table starts empty (seeded with defaults in the migration SQL).

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| `@elevenlabs/react` | TEST-01 Voice Agent tab | No — NOT in node_modules | — | Must install: `npm install @elevenlabs/react` |
| `@anam-ai/agent-widget` (unpkg) | TEST-03, TEST-04 | Runtime fetch from CDN | 0.3.1 | No fallback — CDN must be reachable |
| Supabase `settings` table | TEST-05 Settings page | No — not yet migrated | — | Run SQL migration before Settings API will work |
| ElevenLabs Agent (live) | TEST-01 | Confirmed (agent_6501knqvg098fdh8355x9v4d3ycz) | — | — |
| `/api/chatbot/message` route | TEST-02 | Yes — verified in codebase | — | — |

**Missing dependencies with no fallback:**
- `@elevenlabs/react` package — MUST install before VoiceAgentTab can be built. Wave 0 task.
- `settings` Supabase table — MUST migrate before Settings API routes work. Wave 0 task.

**Missing dependencies with fallback:**
- Anam AI unpkg CDN — if CDN is unreachable during testing, Tab 3 and /demo show an empty element. No npm fallback; CDN connectivity assumed.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest 30.3.0 + ts-jest |
| Config file | `jest.config.ts` (root) |
| Quick run command | `npm test` |
| Full suite command | `npm test -- --coverage` |
| Test environment | jsdom (default) / node (API routes via `@jest-environment node`) |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| TEST-01 | VoiceAgentTab renders without crashing; ConversationProvider present | unit | `npm test -- --testPathPattern=testing` | No — Wave 0 |
| TEST-02 | ChatbotSimTab sends POST to /api/chatbot/message with correct shape | unit | `npm test -- --testPathPattern=testing` | No — Wave 0 |
| TEST-03 | AnamAITab injects script and renders anam-agent element | unit | `npm test -- --testPathPattern=testing` | No — Wave 0 |
| TEST-04 | /demo page renders without sidebar; proxy excludes /demo | unit + smoke | `npm test -- --testPathPattern=demo` | No — Wave 0 |
| TEST-05 | GET /api/settings returns flat object; PATCH upserts rows | unit (`@jest-environment node`) | `npm test -- --testPathPattern=settings` | No — Wave 0 |
| TEST-06 | No inline ternaries remain in page files; all strings via t() | static analysis / grep | `grep -rn "language === 'en' ?" app/` | Manual check |

### Sampling Rate
- **Per task commit:** `npm test`
- **Per wave merge:** `npm test -- --coverage`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `__tests__/testing/VoiceAgentTab.test.tsx` — covers TEST-01, TEST-03
- [ ] `__tests__/testing/ChatbotSimTab.test.tsx` — covers TEST-02
- [ ] `__tests__/demo/page.test.tsx` — covers TEST-04
- [ ] `__tests__/api/settings.test.ts` — covers TEST-05 (needs `@jest-environment node`)
- [ ] `lib/translations.ts` — add Phase 6 keys before any page implementation (prevents TS errors)
- [ ] `npm install @elevenlabs/react` — before VoiceAgentTab
- [ ] `supabase/migrations/20260412_create_settings.sql` — before Settings API

---

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | yes | Admin role guard on GET/PATCH /api/settings (pattern from export/calls route) |
| V3 Session Management | no | Settings page uses existing Supabase session |
| V4 Access Control | yes | Settings API admin-only; demo page public (no auth needed) |
| V5 Input Validation | yes | Settings form: validate HH:MM format for agent hours; validate email format for notification_email; validate integer for data_retention_days |
| V6 Cryptography | no | No new crypto operations |

### Known Threat Patterns

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Unauthorized settings modification | Tampering | Admin role check in API route (pattern from export/calls) |
| XSS via unsanitized settings values | Tampering | Next.js renders settings values as React text nodes — auto-escaped |
| is_test flag bypass (test calls entering analytics) | Tampering | Tag `is_test=true` in ElevenLabs webhook handler; SEC-04 (Phase 7 audit) verifies |
| PDPA: notification_email in settings | Disclosure | This is staff email (config data) — not beneficiary PII. No masking required. PDPA applies to beneficiary ICs only. |

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `startSession()` in @elevenlabs/react v1.1.0 accepts `dynamic_variables: { is_test: 'true' }` to pass metadata to the webhook | Pitfall 2, Architecture Pattern 1 | is_test flag doesn't reach webhook → test calls pollute analytics; mitigation: inspect installed SDK types at task time |
| A2 | The Anam AI web component attribute is `agent-id` (hyphenated) matching the CLAUDE.md specification | Architecture Pattern 2 | Component doesn't initialize with wrong attribute name; mitigation: confirm against unpkg script source |
| A3 | The Anam AI widget from unpkg is the same component as referenced in CLAUDE.md (CLAUDE.md was written with knowledge of this widget) | Architecture Pattern 2 | Different embed API than expected; mitigation: check unpkg.com/@anam-ai/agent-widget source at task time |
| A4 | Phase 5 page components (live-monitor, integrations) still contain some inline ternaries not yet converted to `t()` | Code Examples — inline ternary audit | Audit finds zero gaps — TEST-06 is faster than expected |

**Confirmed (not assumed):**
- All Shadcn components needed (Tabs, Input, Button, Card, Switch, Badge) are installed — verified from package.json
- IntentBadge at `components/chat/IntentBadge.tsx` — verified in codebase
- Copy-to-clipboard pattern — verified in integrations/page.tsx
- Admin role guard pattern — verified in api/export/calls/route.ts
- translations.ts `t()` function signature — verified in codebase
- proxy.ts matcher does NOT exclude `/demo` — verified in codebase (CRITICAL)
- `@elevenlabs/react` NOT installed yet — verified (not in node_modules or package.json)
- `settings` table does NOT exist yet — verified (only 2 migrations exist)

---

## Open Questions

1. **ElevenLabs SDK: Exact `startSession` metadata parameter**
   - What we know: v1.1.0 SDK; startSession is synchronous; `dynamic_variables` and `overrides` are available
   - What's unclear: Whether `dynamic_variables` is the right field to pass `is_test`; whether it flows through to the webhook payload
   - Recommendation: At task time, read `node_modules/@elevenlabs/react/dist/index.d.ts` TypeScript types to find the exact parameter name before writing VoiceAgentTab

2. **ConversationProvider scope**
   - What we know: Provider is required in v1.1.0; can be scoped to one component
   - What's unclear: Whether the provider needs to wrap just `VoiceAgentTab` or the entire `testing/page.tsx`
   - Recommendation: Scope to `VoiceAgentTab` only for simplicity (provider per tab, not per page)

3. **startSession synchronous vs async (v1.1.0)**
   - What we know: SKILL.md says "startSession is now synchronous" — remove `await`
   - What's unclear: Whether this applies to ALL call patterns or only specific overloads
   - Recommendation: Use `startSession()` without `await`; handle errors via `onError` callback in `useConversation`

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Standalone `useConversation` | `ConversationProvider` + `useConversation` | ElevenLabs SDK v1.1.0 | VoiceAgentTab must use provider pattern; cannot use hook standalone |
| `await startSession()` | `startSession()` (synchronous, returns void) | ElevenLabs SDK v1.1.0 | Remove await; use onError callback instead of try/catch |
| Monolithic `useConversation` | Granular hooks (`useConversationStatus`, `useConversationControls`, etc.) | ElevenLabs SDK v1.1.0 | Granular hooks are available for better render performance but not required; `useConversation` still works |

**Deprecated/outdated:**
- CLAUDE.md ElevenLabs example shows `await conversation.startSession(...)` — this pattern predates v1.1.0. The `await` and `conversation.` prefix are both outdated. Current pattern: destructure directly from `useConversation` and call `startSession()` directly without await.

---

## Sources

### Primary (HIGH confidence)
- Codebase — `package.json`, `lib/translations.ts`, `components/chat/IntentBadge.tsx`, `proxy.ts`, `hooks/useLanguage.ts`, `app/api/chatbot/message/route.ts`, `app/api/export/calls/route.ts` — all read and verified in this session
- npm registry — `@elevenlabs/react@1.1.0`, `@anam-ai/agent-widget@0.3.1`, `sonner@2.0.7` — verified via `npm view`

### Secondary (MEDIUM confidence)
- [GitHub elevenlabs/packages SKILL.md](https://github.com/elevenlabs/packages/blob/main/.agents/skills/elevenlabs:sdk-migration/SKILL.md) — ConversationProvider requirement, startSession synchronous change, granular hooks
- WebSearch results for `@elevenlabs/react` confirming v1.1.0 API shape, dynamic_variables, overrides

### Tertiary (LOW confidence)
- [docs.anam.ai/sdk-reference/basic-usage](https://anam.ai/docs/sdk-reference/basic-usage) — Anam AI primary SDK is JS-based; web component widget (`@anam-ai/agent-widget`) not documented on this page; D-12/D-13 pattern assumed based on CLAUDE.md specification
- ElevenLabs official docs — all documentation URLs returning 404 during this research session; API shape derived from GitHub and npm search results

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all packages verified against npm registry and package.json
- Architecture patterns: HIGH (codebase patterns) / MEDIUM (ElevenLabs v1.1.0 — docs unavailable, derived from SDK migration skill)
- Critical proxy.ts finding: HIGH — verified directly in codebase
- Anam AI web component: LOW — CLAUDE.md specifies the pattern; `@anam-ai/agent-widget@0.3.1` confirmed on npm but web component attributes not independently verified

**Research date:** 2026-04-12
**Valid until:** 2026-05-12 for stable items (Supabase, Shadcn, translations pattern); 2026-04-26 for ElevenLabs SDK (fast-moving)
