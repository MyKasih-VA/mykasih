# Phase 6: Testing Console, AI Demo, Settings & Polish - Context

**Gathered:** 2026-04-12
**Status:** Ready for planning

<domain>
## Phase Boundary

Three-tab Testing Console (Voice Agent, Chatbot Simulator, Anam AI), standalone public AI Demo page, Settings page with persisted config, and full BM/EN language coverage across all dashboard pages. All pages are stubs — replace content, keep files.

</domain>

<decisions>
## Implementation Decisions

### Testing Console — Tab Structure
- **D-01:** Shadcn `Tabs` component (already installed) — three tabs: "Voice Agent" | "Kasih Chatbot" | "Anam AI". Tab state managed in-component (no URL routing per tab).
- **D-02:** Tab layout: full-width content area below tab bar; each tab renders its own sub-component.

### Testing Console — Tab 1: Voice Agent
- **D-03:** Use `useConversation` hook from `@elevenlabs/react` — custom component, WebRTC connection (`connectionType: "webrtc"`).
- **D-04:** UI: centered mic button (Start Session / End Session toggle), status badge with colored dot (Ready = `--status-green`, Connecting = `--status-yellow`, Active = `--status-green` pulse, Ended = `--text-muted`), live transcript panel scrolls below.
- **D-05:** All test sessions tagged `is_test=true` — passed as metadata in `startSession()` call so the webhook picks it up.
- **D-06:** Agent ID from `process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID` (env var already defined).

### Testing Console — Tab 2: Kasih Chatbot Simulator
- **D-07:** Calls real `/api/chatbot/message` route — same API the production chatbot uses. Input field simulates the WA sender (staff types as if they are a beneficiary).
- **D-08:** Dark WhatsApp-style UI: fixed-height scrollable bubble area (`h-[420px]`). User bubbles: right-aligned, `--accent-primary` background. Bot bubbles: left-aligned, `--bg-surface` background with `--bg-border` border.
- **D-09:** Send on Enter + Send button. Loading spinner (dots animation) while waiting for bot response.
- **D-10:** Intent badge (colored text pill, same `color-mix` pattern from Phase 4) shown on each bot response below the bubble text.
- **D-11:** "Clear conversation" button resets the chat state. No persistent save — test interactions not logged as `calls` rows from the simulator (simulator is UI-only; the real chatbot webhook handles production logging).

### Testing Console — Tab 3: Anam AI
- **D-12:** `<anam-agent>` web component embed using `NEXT_PUBLIC_ANAM_AGENT_ID` env var.
- **D-13:** Script loaded via unpkg: `<script src="https://unpkg.com/@anam-ai/agent-widget" async></script>` — added to the tab component via `useEffect` script injection (Next.js client component pattern).
- **D-14:** Tab content: brief label ("Anam AI Persona — client-facing demo") + the agent embed filling available height.

### AI Demo Page (/demo)
- **D-15:** Public — no auth required. Page lives outside `(dashboard)` layout group: `app/demo/page.tsx` (not `app/(dashboard)/demo/page.tsx`). Create new route; remove or repurpose the existing dashboard stub.
- **D-16:** Custom minimal layout: MyKasih logo (from CLAUDE.md URL) centered at top, "AI Helpline Demo" title, "Powered by Anam AI" footer credit. No sidebar, no topbar, no language toggle.
- **D-17:** Full-height Anam AI embed (`<anam-agent>`) as the main content. Same web component pattern as Tab 3.
- **D-18:** Page background uses `--bg-primary` (dark) to match dashboard feel — demo looks native, not a blank white page.

### Settings Page
- **D-19:** New Supabase `settings` table: `key text PRIMARY KEY, value text NOT NULL, updated_at timestamptz DEFAULT now()`. Key-value store — simple, no schema migration complexity.
- **D-20:** Editable fields (stored in `settings` table):
  - `agent_hours_start` — HH:MM, default "08:00"
  - `agent_hours_end` — HH:MM, default "17:00"
  - `notification_email` — email address for escalation alerts
  - `data_retention_days` — integer, default 90
- **D-21:** Read-only display fields (not stored — derived from env/config):
  - Voice webhook URL: `[NEXT_PUBLIC_APP_URL]/api/webhook/voice` — displayed in a disabled input with "Copy" button (same copy-to-clipboard pattern as Phase 5 Integrations page)
  - Chat webhook URL: `[NEXT_PUBLIC_APP_URL]/api/webhook/chat` — same pattern
- **D-22:** Save button → `PATCH /api/settings` → upsert all key-value pairs in a single call. Success toast on save. Error toast if upsert fails.
- **D-23:** New API routes needed: `GET /api/settings` (return all key-value pairs as an object) + `PATCH /api/settings` (upsert array of `{key, value}` pairs). Admin-only access (role check via Supabase service role).
- **D-24:** Settings page layout: two-column card grid. Card 1: Agent Hours. Card 2: Notifications. Card 3: Data Retention. Card 4: Webhook URLs (read-only). Single "Save Changes" button at bottom applies all editable fields.

### Language Polish (TEST-06)
- **D-25:** Full audit of all pages — eliminate all inline `language === 'en' ? '...' : '...'` ternaries outside the `t()` pattern. Replace with `t('key', language)` calls.
- **D-26:** Add missing translation keys to `lib/translations.ts` for: Testing Console (tabs, status labels, button labels), Settings page (all field labels, section headers, webhook URL labels), and any gaps in Analytics, KB, Staff, Live Monitor pages from Phase 5.
- **D-27:** Scope: every visible string on every page should use `t()`. The only exceptions are: dynamic data from the database (names, WA numbers, etc.) and content inside the Anam AI / ElevenLabs embeds (those are controlled by the vendor).

### Claude's Discretion
- Exact `useConversation` hook event handlers and error handling
- Live transcript update frequency/debouncing
- Tab 2 intent badge color mapping (reuse existing badge palette from Phase 4)
- Intensity of the "Active" mic button pulse animation
- Number of rows in Settings table at initial seed (can start empty, `GET /api/settings` returns defaults if key not found)
- Exact copy for "Powered by Anam AI" footer on Demo page

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Design System
- `mykasih-crm/app/globals.css` — all 12 CSS color variables; never hardcode hex
- `CLAUDE.md` (project root) — full color token reference, AI integration IDs, env var names

### ElevenLabs Integration
- CLAUDE.md §AI Integrations — `useConversation` hook usage, agent ID, WebRTC connection type
- `@elevenlabs/react` SDK: `useConversation({ onConnect, onDisconnect, onMessage, onError })` + `startSession({ agentId, connectionType, customLlmExtraBody })` + `endSession()`

### Anam AI Integration
- CLAUDE.md §AI Integrations — web component embed pattern, agent ID `32d94abf-9bfd-45c4-8076-b1ea6ef9e229`, unpkg script URL

### Existing API Routes (consume in this phase)
- `mykasih-crm/app/api/chatbot/message/route.ts` — chatbot simulator calls this directly
- `mykasih-crm/app/api/integrations/status/route.ts` — copy-button pattern reference (Phase 5)

### Existing Components (extend, don't rebuild)
- `mykasih-crm/components/calls/TranscriptModal.tsx` — Dialog pattern reference
- `mykasih-crm/components/calls/ChannelBadge.tsx` — badge pattern for intent pills
- `mykasih-crm/components/dashboard/RecentInteractions.tsx` — skeleton + empty state pattern

### Translations
- `mykasih-crm/lib/translations.ts` — add all Phase 6 string keys here; use `t(key, language)` pattern

### Page Stubs (replace content, keep files)
- `mykasih-crm/app/(dashboard)/testing/page.tsx` — replace with 3-tab console
- `mykasih-crm/app/(dashboard)/settings/page.tsx` — replace with settings form
- `mykasih-crm/app/(dashboard)/demo/page.tsx` — REMOVE this stub; new demo page is at `app/demo/page.tsx` (outside dashboard layout)

### Environment Variables
- `NEXT_PUBLIC_ELEVENLABS_AGENT_ID` — voice agent
- `NEXT_PUBLIC_ANAM_AGENT_ID` — Anam AI persona
- `SUPABASE_SERVICE_ROLE_KEY` — settings API route (admin upsert)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `useConversation` from `@elevenlabs/react` — already declared in CLAUDE.md as the integration method; confirm package is installed in package.json
- Shadcn `Tabs`, `TabsContent`, `TabsList`, `TabsTrigger` — installed (Phase 5 used Tabs for KB BM/EN toggle)
- Shadcn `Input`, `Button`, `Card`, `Switch`, `Badge`, `Skeleton` — all installed
- `useLanguage()` hook — available on all client components
- `toast()` from Shadcn — used in Phase 4 and 5 for success/error feedback

### Established Patterns
- Copy-to-clipboard button: Phase 5 Integrations page (D-32 Meta WA webhook URL copy)
- Modal: Shadcn `Dialog` — Phase 4/5 TranscriptModal pattern
- API route with role check: `mykasih-crm/app/api/export/calls/route.ts` — admin+qmedia guard
- Client-side data fetching: `useEffect` + `fetch('/api/...')` with loading state

### Integration Points
- Testing Console: `app/(dashboard)/testing/page.tsx` — already inside sidebar/topbar layout
- Demo page: needs new file `app/demo/page.tsx` — no layout wrapper (public, standalone)
- Settings: new `GET/PATCH /api/settings/route.ts` + new `settings` table migration
- Language polish: `lib/translations.ts` + all `app/(dashboard)/*/page.tsx` files from Phases 4–5

</code_context>

<specifics>
## Specific Ideas

- Voice tab: mic button should feel like a push-to-talk — prominent, center-stage. Status badge uses the same dot + label pattern already visible on the Integrations page health checks.
- Chatbot simulator: the fixed-height bubble area should auto-scroll to the latest message on each new response. Bot typing indicator (animated dots) while waiting for `/api/chatbot/message` response.
- AI Demo page: intended for sharing with clients / MyKasih Foundation — it must look polished and branded, not like an admin tool.
- Settings: start with sensible defaults seeded as comments in the migration SQL so the table isn't empty on first load.

</specifics>

<deferred>
## Deferred Ideas

- None — discussion stayed within phase scope.

</deferred>

---

*Phase: 06-testing-console-ai-demo-settings-polish*
*Context gathered: 2026-04-12*
