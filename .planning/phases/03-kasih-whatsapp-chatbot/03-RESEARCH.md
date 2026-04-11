# Phase 3: Kasih WhatsApp Chatbot - Research

**Researched:** 2026-04-11
**Domain:** Meta WhatsApp Cloud API + Claude Haiku intent classification + Supabase session state + n8n orchestration
**Confidence:** HIGH (core patterns verified via official docs and npm registry)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
| # | Decision | Choice |
|---|----------|--------|
| 1 | Meta WA API status | Pending — build stubs now, test via Postman, go live on approval |
| 2 | n8n architecture | Option A: n8n orchestrates WA→Claude→Supabase; webhook URL in /integrations |
| 3 | Conversation state | Supabase `sessions` table — persistent, auditable, survives restarts |
| 4 | Claude model | Haiku 4.5 — intent classification only (~$0.001/msg) |
| 5 | Language | Auto-detect BM/EN from first message; lock to session for entire thread |

### Claude's Discretion
(None specified — all architectural decisions are locked above)

### Deferred Ideas (OUT OF SCOPE)
- Real balance API integration (mock used for POC; real API deferred to v2)
- Warm transfer to live agents (requires SIP/PSTN)
- WhatsApp rich media (buttons/maps/PDFs)
- Real-time WebSocket chat
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| CHAT-01 | GET /api/webhook/chat handles Meta WA webhook verification (hub.mode + hub.challenge + hub.verify_token) | Meta webhook verification pattern documented in §Architecture Patterns |
| CHAT-02 | POST /api/webhook/chat extracts WA message and routes to /api/chatbot/message | Meta incoming payload JSON structure documented in §Code Examples |
| CHAT-03 | POST /api/chatbot/message classifies intent via Claude API (faq \| balance_check \| merchant_lookup \| complaint \| unknown) | Claude Haiku 4.5 Messages API pattern documented in §Code Examples |
| CHAT-04 | FAQ handler queries kb_entries and returns answer in detected language | Supabase query pattern + translations.ts reuse documented |
| CHAT-05 | Balance check handler collects IC, masks it, returns mock balance + expiry + nearest merchant | maskIC() reuse from Phase 2 documented; IC collection via multi-turn session |
| CHAT-06 | Merchant lookup handler extracts location entities and returns top 3-5 merchants from Supabase | lookupByPostcode() / lookupByState() reuse from Phase 1 documented |
| CHAT-07 | Complaint handler runs multi-turn conversation, creates ticket with reference number | generateTicketRef() reuse from Phase 2; multi-turn via sessions table |
| CHAT-08 | First contact sends 4 quick reply buttons: Semak baki / Kedai berdekatan / Bantuan SARA / Status aduan | Meta interactive list message (4 items) documented in §Code Examples — buttons limited to 3, use list message instead |
| CHAT-09 | All chat sessions saved to Supabase (channel='chat', calls + transcripts tables) | Existing calls + transcripts schema reused; session-to-call persistence pattern documented |
| CHAT-10 | lib/meta-wa.ts exports sendWhatsAppMessage() and sendWhatsAppButtons() | Meta Send Message API endpoint documented; stub pattern for pre-approval documented |
</phase_requirements>

---

## Summary

Phase 3 builds the Kasih WhatsApp Chatbot: inbound WA messages flow from Meta Cloud API through n8n → Next.js `/api/chatbot/message` → Claude Haiku 4.5 for intent classification → one of four handlers (FAQ, balance check, merchant lookup, complaint) → response JSON back to n8n → Meta Send Message API → user receives reply.

The architecture is already locked: n8n orchestrates the WA side (verification GET, incoming POST, outbound send), while Next.js owns all business logic. Conversation state lives in a new `sessions` Supabase table with a 30-minute TTL. All four handlers reuse utilities built in Phases 1 and 2: `maskIC()`, `generateTicketRef()`, `lookupByPostcode()`, `lookupByState()`.

One critical finding: WhatsApp interactive reply **buttons are limited to 3 maximum**. The design calls for 4 quick-reply options. The correct Meta API type for 4+ items is an **interactive list message** (type `"list"`), which supports up to 10 rows. The plan must use `sendWhatsAppButtons()` with `type: "list"` not `type: "button"` for the first-contact welcome message.

**Primary recommendation:** Build all handlers as thin modules in `lib/chatbot/` behind a single dispatcher in `/api/chatbot/message`. Stub `sendWhatsAppMessage()` to `console.log` until Meta WA API is approved — the stub interface must match the real implementation exactly.

---

## Project Constraints (from CLAUDE.md)

| Directive | Detail |
|-----------|--------|
| TypeScript strict | No `any` — all types must be explicit |
| No hardcoded colors | CSS vars only (not relevant to API layer) |
| PDPA | Zero plain-text IC — `maskIC()` before every Supabase write |
| Webhook secrets | Validate `N8N_WEBHOOK_SECRET` on every POST to `/api/chatbot/message` |
| is_test flag | All test calls from Testing Console must set `is_test=true` |
| API route pattern | `try/catch` on all routes; return proper HTTP status codes |
| No plain-text personal data | IC, name, WA number must be handled per PDPA |
| Node.js runtime | API routes that use `node:crypto` must declare `export const runtime = 'nodejs'` |

---

## Standard Stack

### Core (Phase 3 additions)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@anthropic-ai/sdk` | 0.88.0 | Claude Haiku 4.5 intent classification | Official Anthropic TypeScript SDK; not yet installed — needed for Phase 3 |
| `@supabase/supabase-js` | 2.103.0 | Supabase service client (sessions, calls, transcripts, tickets) | Already installed from Phase 1 |

**Version verification:** [VERIFIED: npm registry] — `@anthropic-ai/sdk` latest is 0.88.0 as of 2026-04-11. Not yet in `mykasih-crm/package.json` — must be installed in Wave 0 or Plan 03-01.

### Supporting (Reused from Phases 1 and 2)

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `lib/ic-mask.ts` | — | `maskIC()` — PDPA IC masking | Called in balance handler + complaint handler before any Supabase write |
| `lib/ticket-ref.ts` | — | `generateTicketRef()` — TKT-YYYY-NNNNN | Called in complaint handler after user confirms details |
| `lib/merchant-lookup.ts` | — | `lookupByPostcode()`, `lookupByState()` | Called in merchant lookup handler |
| `lib/translations.ts` | — | BM/EN response strings | All handler reply text should go through translation layer |
| `lib/supabase/server.ts` | — | Server-side Supabase client | Used in all handlers for reads |

### Installation

```bash
cd mykasih-crm
npm install @anthropic-ai/sdk@0.88.0
```

---

## Architecture Patterns

### Recommended Project Structure (new files)

```
lib/
├── meta-wa.ts                  ← sendWhatsAppMessage() + sendWhatsAppButtons() stub → real
├── chatbot/
│   ├── intent-classifier.ts    ← Claude Haiku 4.5 classifier
│   ├── session-manager.ts      ← create/get/update/expire sessions
│   ├── faq-handler.ts          ← kb_entries query + BM/EN response
│   ├── balance-handler.ts      ← IC collection → mask → mock API
│   ├── merchant-handler.ts     ← postcode/state dispatch
│   └── complaint-handler.ts    ← multi-turn → ticket creation

app/api/
├── webhook/chat/route.ts       ← GET (verify) + POST (receive from Meta/n8n)
└── chatbot/message/route.ts    ← POST (n8n → intent dispatch → handler)

__tests__/
├── api/
│   ├── webhook-chat.test.ts
│   └── chatbot-message.test.ts
└── lib/
    ├── meta-wa.test.ts
    ├── intent-classifier.test.ts
    ├── session-manager.test.ts
    ├── faq-handler.test.ts
    ├── balance-handler.test.ts
    ├── merchant-handler.test.ts
    └── complaint-handler.test.ts
```

### Pattern 1: Meta WA Webhook Verification (CHAT-01)

**What:** Meta sends a GET request with three query params to verify the webhook endpoint.
**When to use:** GET handler on `/api/webhook/chat`.

```typescript
// Source: Meta for Developers — Set Up Webhooks
// https://developers.facebook.com/docs/whatsapp/cloud-api/guides/set-up-webhooks/
export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url)
  const mode = searchParams.get('hub.mode')
  const token = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')

  if (mode === 'subscribe' && token === process.env.META_WA_VERIFY_TOKEN) {
    return new Response(challenge, { status: 200 })
  }
  return new Response('Forbidden', { status: 403 })
}
```

### Pattern 2: Meta WA Incoming Message Payload (CHAT-02)

**What:** Meta POSTs webhook events with this JSON envelope for text messages.
**When to use:** POST handler on `/api/webhook/chat` to extract sender + message body.

```typescript
// Source: Meta for Developers — Webhook Messages Reference
// Verified: Web search cross-referenced with n8n community guides
interface MetaWATextPayload {
  object: 'whatsapp_business_account'
  entry: Array<{
    id: string
    changes: Array<{
      value: {
        messaging_product: 'whatsapp'
        metadata: { display_phone_number: string; phone_number_id: string }
        contacts: Array<{ profile: { name: string }; wa_id: string }>
        messages: Array<{
          from: string          // sender phone number
          id: string            // WAMID — use as dedup key
          timestamp: string
          type: 'text' | 'interactive'
          text?: { body: string }
          interactive?: {
            type: 'button_reply'
            button_reply: { id: string; title: string }
          }
        }>
      }
      field: 'messages'
    }>
  }>
}

// Extraction helper
function extractMessage(payload: MetaWATextPayload) {
  const value = payload.entry[0]?.changes[0]?.value
  const msg = value?.messages?.[0]
  if (!msg) return null
  const body =
    msg.type === 'text'
      ? msg.text?.body ?? ''
      : msg.interactive?.button_reply?.title ?? ''
  return {
    from: msg.from,
    wamid: msg.id,
    body,
    contactName: value.contacts?.[0]?.profile?.name ?? '',
  }
}
```

### Pattern 3: Claude Haiku 4.5 Intent Classifier (CHAT-03)

**What:** Single-message Claude call that returns structured intent + language.
**When to use:** `lib/chatbot/intent-classifier.ts` — called by `/api/chatbot/message`.

```typescript
// Source: [VERIFIED: platform.claude.com/docs/en/api/messages]
// Model ID: claude-haiku-4-5-20251001 (alias: claude-haiku-4-5)
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export type Intent = 'faq' | 'balance_check' | 'merchant_lookup' | 'complaint' | 'unknown'
export type Language = 'bm' | 'en'

export interface Classification {
  intent: Intent
  language: Language
  confidence: 'high' | 'low'
}

const SYSTEM_PROMPT = `
You are a bilingual (BM/EN) intent classifier for the MyKasih SARA helpline.
Classify the user message into EXACTLY ONE intent:
- faq: general questions about SARA program, eligibility, how to use credit
- balance_check: checking balance, baki, credit amount
- merchant_lookup: finding nearby stores, kedai berdekatan, mana boleh guna
- complaint: reporting a problem, aduan, issue with card or merchant
- unknown: anything else

Also detect the language: "bm" for Bahasa Melayu, "en" for English.

Respond with ONLY a JSON object (no markdown):
{"intent": "<intent>", "language": "<bm|en>", "confidence": "<high|low>"}
`.trim()

export async function classifyIntent(message: string): Promise<Classification> {
  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 64,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: message }],
  })
  const text = response.content[0].type === 'text' ? response.content[0].text : '{}'
  try {
    return JSON.parse(text) as Classification
  } catch {
    return { intent: 'unknown', language: 'bm', confidence: 'low' }
  }
}
```

**Cost note:** [VERIFIED: platform.claude.com] claude-haiku-4-5 costs $1/MTok input + $5/MTok output. A classification call uses ~200 input tokens + ~20 output tokens = ~$0.0002/call. Well within budget.

### Pattern 4: Meta WA Send Message API (CHAT-10)

**What:** POST to Graph API to send text or interactive messages.
**API endpoint:** `https://graph.facebook.com/v20.0/${PHONE_NUMBER_ID}/messages`

```typescript
// Source: Meta for Developers — Send Messages guide
// [VERIFIED: WebSearch + Meta dev docs]
// lib/meta-wa.ts

const META_API_BASE = 'https://graph.facebook.com/v20.0'

export async function sendWhatsAppMessage(to: string, text: string): Promise<void> {
  const phoneNumberId = process.env.META_WA_PHONE_NUMBER_ID
  const token = process.env.META_WA_ACCESS_TOKEN

  if (!phoneNumberId || !token) {
    // Stub mode: Meta WA API not yet approved
    console.log(`[WA STUB] To: ${to} | Message: ${text}`)
    return
  }

  await fetch(`${META_API_BASE}/${phoneNumberId}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to,
      type: 'text',
      text: { body: text },
    }),
  })
}

// Sends a list interactive message (supports 4+ items — use instead of buttons for first contact)
export async function sendWhatsAppButtons(
  to: string,
  bodyText: string,
  items: Array<{ id: string; title: string; description?: string }>
): Promise<void> {
  const phoneNumberId = process.env.META_WA_PHONE_NUMBER_ID
  const token = process.env.META_WA_ACCESS_TOKEN

  if (!phoneNumberId || !token) {
    console.log(`[WA STUB] To: ${to} | List: ${items.map(i => i.title).join(', ')}`)
    return
  }

  await fetch(`${META_API_BASE}/${phoneNumberId}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to,
      type: 'interactive',
      interactive: {
        type: 'list',            // NOT "button" — "button" only supports 3 max
        body: { text: bodyText },
        action: {
          button: 'Pilih / Select',
          sections: [
            {
              title: 'Pilih perkhidmatan',
              rows: items.map(item => ({
                id: item.id,
                title: item.title,
                description: item.description ?? '',
              })),
            },
          ],
        },
      },
    }),
  })
}
```

### Pattern 5: Session Manager (Supabase sessions table)

**What:** Create, fetch, and expire conversation sessions keyed by `wa_phone`.
**When to use:** Called in `/api/chatbot/message` before handler dispatch.

```typescript
// Source: [ASSUMED] — Supabase client pattern consistent with existing lib/supabase/server.ts
// Session lookup: always fetch most recent non-expired session for wa_phone
import { createClient as createServiceClient } from '@supabase/supabase-js'

function getServiceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!   // bypass RLS — server-side only
  )
}

export async function getActiveSession(waPhone: string) {
  const supabase = getServiceClient()
  const { data } = await supabase
    .from('sessions')
    .select('*')
    .eq('wa_phone', waPhone)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(1)
    .single()
  return data
}

export async function createSession(waPhone: string, language: 'bm' | 'en') {
  const supabase = getServiceClient()
  const { data } = await supabase
    .from('sessions')
    .insert({ wa_phone: waPhone, language, step: 0, collected_data: {} })
    .select()
    .single()
  return data
}

export async function updateSession(
  id: string,
  updates: { intent?: string; step?: number; collected_data?: Record<string, unknown> }
) {
  const supabase = getServiceClient()
  await supabase.from('sessions').update(updates).eq('id', id)
}

export async function expireSession(id: string) {
  const supabase = getServiceClient()
  await supabase
    .from('sessions')
    .update({ expires_at: new Date().toISOString() })
    .eq('id', id)
}
```

### Pattern 6: Webhook Route — Respond 200 Immediately (critical)

**What:** Meta retries if webhook doesn't respond within ~5 seconds. All LLM and DB work must happen quickly or be made async.
**When to use:** POST handler on `/api/webhook/chat`.

```typescript
// Source: [VERIFIED: hookdeck.com/webhooks/platforms/guide-to-whatsapp-webhooks]
// Pattern: respond 200 first, then process (fire-and-forget in Next.js)
export const runtime = 'nodejs'  // required — uses node:crypto for secret validation

export async function POST(request: Request): Promise<Response> {
  const rawBody = await request.text()

  // Validate n8n webhook secret (inbound from n8n, not directly from Meta)
  const secret = request.headers.get('x-n8n-webhook-secret')
  if (secret !== process.env.N8N_WEBHOOK_SECRET) {
    return new Response('Unauthorized', { status: 401 })
  }

  // Respond 200 immediately — then process
  // In Next.js (Node.js runtime) we can use waitUntil or simply process inline
  // since Vercel Pro has generous function timeout (300s)
  // For this project: inline processing is acceptable given Claude Haiku latency < 1s
  const payload = JSON.parse(rawBody)
  // ... process ...
  return new Response('OK', { status: 200 })
}
```

**Note:** In the architecture (CONTEXT.md), n8n receives the webhook from Meta, then n8n POSTs to `/api/chatbot/message`. This means the Next.js route does NOT face Meta's 5-second timeout directly — n8n handles that. The 5-second limit applies to n8n's webhook response to Meta, which n8n handles natively. Next.js has more headroom.

### Pattern 7: First Contact Quick Reply — 4 Items (CHAT-08)

**What:** When a user has no active session, send 4 quick-reply options.
**Critical:** Reply buttons (`type: "button"`) max 3 items. Use list message for 4.

```typescript
// Source: [VERIFIED: WebSearch + Meta dev docs — interactive-reply-buttons-messages]
// Button type = max 3. List type = up to 10. We need 4 → use list.
const FIRST_CONTACT_ITEMS = [
  { id: 'balance_check',    title: 'Semak baki', description: 'Semak kredit SARA anda' },
  { id: 'merchant_lookup',  title: 'Kedai berdekatan', description: 'Cari kedai yang menerima SARA' },
  { id: 'faq',              title: 'Bantuan SARA', description: 'Soalan lazim tentang program' },
  { id: 'complaint',        title: 'Status aduan', description: 'Buat atau semak aduan' },
]

await sendWhatsAppButtons(
  waPhone,
  'Selamat datang ke MyKasih. Apa yang boleh kami bantu?',
  FIRST_CONTACT_ITEMS
)
```

**When a user taps a list item**, Meta sends an interactive webhook with `type: "interactive"`, `interactive.type: "list_reply"`, `interactive.list_reply.id` = the row ID. The handler extracts this ID and uses it directly as the intent.

### Anti-Patterns to Avoid

- **Storing IC plain-text in sessions.collected_data:** Always `maskIC()` before writing to any Supabase column. During balance-check flow, hold the IC in memory within the request only — never persist the raw value.
- **Using `type: "button"` for 4 items:** Will fail with a Meta API error. Use `type: "list"` for 4+ options.
- **Checking `messages[0]` without null guard:** Meta sends webhook events for status updates (delivered, read) with no `messages` array. Always guard: `if (!payload.entry?.[0]?.changes?.[0]?.value?.messages?.[0]) return`.
- **Creating multiple active sessions per user:** Always query `expires_at > now()` and limit 1 before creating a new session.
- **Calling Claude API from Edge Runtime:** Anthropic SDK uses `node:crypto`. Declare `export const runtime = 'nodejs'` on any route that imports it.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Intent classification | Custom regex keyword matcher | Claude Haiku 4.5 via `@anthropic-ai/sdk` | BM/EN mixed language, colloquial phrasing, ambiguous intent — regex fails in production |
| IC masking | New masking logic | `lib/ic-mask.ts` (Phase 2) | Already tested, handles dashed/undashed, returns safe fallback |
| Ticket reference generation | Custom counter | `lib/ticket-ref.ts` (Phase 2) | Restart-safe, uses MAX query not in-memory counter |
| Merchant lookup | Custom Supabase query | `lib/merchant-lookup.ts` (Phase 1) | Handles 4-digit prefix, ilike, city+state |
| Session state | In-memory Map / Redis | Supabase `sessions` table | Locked decision; survives server restarts, Vercel serverless-compatible |
| WA message sending | Direct fetch in every handler | `lib/meta-wa.ts` centralized | Single stub point for pre-approval; easy to swap console.log → real fetch |

**Key insight:** The most expensive mistake in WhatsApp chatbot development is building a custom NLU layer. Claude Haiku 4.5 handles BM/EN mixed speech (campur code), colloquialisms, and typos far better than any keyword-matching approach, at $0.0002/call.

---

## Common Pitfalls

### Pitfall 1: Button Limit (4 items > 3 max for reply buttons)
**What goes wrong:** `sendWhatsAppButtons()` uses `type: "button"` with 4 items. Meta returns HTTP 400 "Number of buttons cannot exceed 3".
**Why it happens:** Reply buttons (`type: "button"`) max 3; list messages (`type: "list"`) max 10.
**How to avoid:** Implement `sendWhatsAppButtons()` using `type: "list"` from the start. Never use `type: "button"`.
**Warning signs:** Meta API returns 400 on send; test with Postman before going live.

### Pitfall 2: Meta Webhook Status Events (no messages array)
**What goes wrong:** Route crashes on `payload.entry[0].changes[0].value.messages[0]` when Meta sends a delivery/read receipt.
**Why it happens:** Status updates (`statuses` array present, `messages` absent) have the same envelope shape.
**How to avoid:** Check `value.messages` exists before processing. Return 200 early for status-only events.
**Warning signs:** 500 errors in Vercel logs correlated with message delivery timestamps.

### Pitfall 3: IC Leaked in Session collected_data
**What goes wrong:** Raw IC number written to `sessions.collected_data` JSONB field.
**Why it happens:** Developer stores the full IC to "keep for next step" without masking.
**How to avoid:** During balance-check step 1 (collect IC), pass it to `mockBalanceAPI()` immediately, store only `masked_ic` in `collected_data`. PDPA violation if plain IC is persisted.
**Warning signs:** PDPA audit in Phase 7 will flag any unmasked IC in sessions table.

### Pitfall 4: Duplicate Message Processing (Meta retries)
**What goes wrong:** Same WA message processed twice — two calls created, ticket duplicated.
**Why it happens:** n8n retries if it doesn't get 200 within timeout; or Meta retries n8n's webhook.
**How to avoid:** Use `wamid` (message ID from Meta payload) as a deduplication key. Before processing, check if the WAMID has already been processed (can use `calls.elevenlabs_conversation_id` repurposed, or add a `wa_message_id` column to `calls`).
**Warning signs:** Duplicate `calls` rows in Supabase with same `wa_number` and timestamp within seconds.

### Pitfall 5: Session Expiry Race Condition
**What goes wrong:** Two concurrent messages from the same `wa_phone` create two sessions.
**Why it happens:** Serverless functions can run in parallel; Supabase INSERT is not atomic with SELECT.
**How to avoid:** Use Supabase's `upsert` with `onConflict: 'wa_phone'` or add a UNIQUE constraint on `(wa_phone, expires_at > now())`. For Phase 3 volume (low), simple SELECT-then-INSERT is acceptable — document the known limitation.
**Warning signs:** Multiple active sessions for same wa_phone in sessions table.

### Pitfall 6: Claude API Key Exposed to n8n
**What goes wrong:** ANTHROPIC_API_KEY placed in n8n environment variables; n8n calls Claude directly.
**Why it happens:** Temptation to skip Next.js and call Claude from n8n's HTTP node.
**How to avoid:** Architecture is locked: n8n only routes messages to `/api/chatbot/message`. All Claude API calls stay inside Next.js server. Key never leaves Next.js environment.
**Warning signs:** n8n workflow has an "Anthropic" or "HTTP Request" node pointing to api.anthropic.com.

### Pitfall 7: n8n Webhook vs Meta Direct Webhook
**What goes wrong:** Confusion about which service holds the Meta webhook URL.
**Clarification:** n8n Cloud Pro handles the Meta webhook subscription. n8n's webhook URL is configured in Meta App settings. n8n then forwards to Next.js `/api/chatbot/message`. `/api/webhook/chat` (GET verify endpoint) is separate — n8n may proxy the verification, or Meta may call it directly depending on n8n's WA node configuration.
**How to avoid:** Confirm in n8n whether the "WhatsApp Trigger" node handles verification natively. If yes, `/api/webhook/chat` GET is only needed for direct Meta-to-Next.js fallback.

---

## Code Examples

### Intent Dispatcher in /api/chatbot/message

```typescript
// Source: [ASSUMED] — standard dispatcher pattern
// app/api/chatbot/message/route.ts
export const runtime = 'nodejs'

export async function POST(request: Request): Promise<Response> {
  try {
    const secret = request.headers.get('x-n8n-webhook-secret')
    if (secret !== process.env.N8N_WEBHOOK_SECRET) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json() as { waPhone: string; message: string; isTest?: boolean }
    const { waPhone, message, isTest = false } = body

    // 1. Session lookup
    let session = await getActiveSession(waPhone)

    // 2. First contact — send quick reply list + create session
    if (!session) {
      const { language } = await classifyIntent(message)
      session = await createSession(waPhone, language)
      await sendWhatsAppButtons(waPhone, getWelcomeText(language), FIRST_CONTACT_ITEMS)
      return Response.json({ status: 'first_contact' })
    }

    // 3. Classify if no intent locked, else use locked intent
    const intent = session.intent ?? (await classifyIntent(message)).intent

    // 4. Dispatch
    let responseText: string
    switch (intent) {
      case 'faq':             responseText = await faqHandler(message, session); break
      case 'balance_check':   responseText = await balanceHandler(message, session); break
      case 'merchant_lookup': responseText = await merchantHandler(message, session); break
      case 'complaint':       responseText = await complaintHandler(message, session, isTest); break
      default:                responseText = getFallbackText(session.language)
    }

    await sendWhatsAppMessage(waPhone, responseText)
    return Response.json({ status: 'ok' })
  } catch (err) {
    console.error('[chatbot/message]', err)
    return Response.json({ error: 'Internal error' }, { status: 500 })
  }
}
```

### Mock Balance API

```typescript
// Source: [ASSUMED] — deterministic fixture keyed by IC prefix
// lib/chatbot/mock-balance-api.ts
export interface BalanceResult {
  name: string
  balance: number      // RM amount
  expiry: string       // ISO date string
  nearest_merchant: string
}

// Returns deterministic fixture data keyed by last 2 digits of IC birth year
export function mockBalanceAPI(maskedIC: string): BalanceResult {
  return {
    name: 'Penerima SARA',
    balance: 100.00,
    expiry: '2026-12-31',
    nearest_merchant: '99 Speedmart, Jalan Kajang Utama',
  }
}
```

### Complaint Handler Multi-Turn Flow

```typescript
// Source: [ASSUMED] — based on step machine pattern documented in CONTEXT.md
// lib/chatbot/complaint-handler.ts
export async function complaintHandler(
  message: string,
  session: Session,
  isTest: boolean
): Promise<string> {
  const lang = session.language
  const data = session.collected_data as Record<string, string>

  switch (session.step) {
    case 0:
      await updateSession(session.id, { intent: 'complaint', step: 1 })
      return lang === 'bm'
        ? 'Terima kasih. Boleh saya tahu nama anda?'
        : 'Thank you. May I have your name?'

    case 1:
      await updateSession(session.id, { step: 2, collected_data: { ...data, name: message } })
      return lang === 'bm'
        ? 'Boleh berikan nombor IC anda? (cth: 880512-12-3456)'
        : 'Please provide your IC number (e.g. 880512-12-3456)'

    case 2: {
      const masked = maskIC(message)  // NEVER store raw IC
      await updateSession(session.id, { step: 3, collected_data: { ...data, masked_ic: masked } })
      return lang === 'bm'
        ? 'Sila huraikan masalah anda.'
        : 'Please describe your issue.'
    }

    case 3: {
      await updateSession(session.id, { step: 4, collected_data: { ...data, description: message } })
      const confirmed = lang === 'bm'
        ? `Aduan anda:\nNama: ${data.name}\nIC: ${data.masked_ic}\nMasalah: ${message}\n\nSahkan? (Ya/Tidak)`
        : `Your complaint:\nName: ${data.name}\nIC: ${data.masked_ic}\nIssue: ${message}\n\nConfirm? (Yes/No)`
      return confirmed
    }

    case 4: {
      const yesWords = ['ya', 'yes', 'ok', 'okay', 'sahkan', 'confirm']
      if (!yesWords.some(w => message.toLowerCase().includes(w))) {
        await expireSession(session.id)
        return lang === 'bm' ? 'Aduan dibatalkan.' : 'Complaint cancelled.'
      }
      // Create ticket
      const ref = await generateTicketRef()
      const supabase = getServiceClient()
      // 1. Create call record
      const { data: callData } = await supabase
        .from('calls')
        .insert({
          channel: 'chat',
          wa_number: session.wa_phone,
          caller_name: data.name,
          language: session.language,
          category: 'complaint',
          outcome: 'escalated',
          message_count: 4,
          is_test: isTest,
        })
        .select()
        .single()
      // 2. Create ticket
      await supabase.from('tickets').insert({
        call_id: callData?.id,
        channel: 'chat',
        category: 'complaint',
        description: data.description,
        reference_no: ref,
        masked_ic: data.masked_ic,
      })
      await expireSession(session.id)
      return lang === 'bm'
        ? `Aduan anda telah difailkan. Nombor rujukan: ${ref}. Kami akan menghubungi anda dalam 2-3 hari bekerja.`
        : `Your complaint has been filed. Reference: ${ref}. We will contact you within 2-3 business days.`
    }

    default:
      await expireSession(session.id)
      return lang === 'bm' ? 'Sesi tamat. Sila mulakan semula.' : 'Session ended. Please start again.'
  }
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Claude 3 Haiku for classification | Claude Haiku 4.5 (`claude-haiku-4-5-20251001`) | Oct 2025 | Significantly better multilingual + reasoning; claude-3-haiku deprecated Apr 19 2026 |
| `type: "button"` for quick replies (3 max) | `type: "list"` for 4+ options | Always the case | Must use list for the 4-item first-contact menu |
| Edge Runtime for all Next.js routes | Node.js runtime required for routes using `node:crypto` or Anthropic SDK | Next.js 13+ | Declare `export const runtime = 'nodejs'` on webhook/chatbot routes |

**Deprecated/outdated:**
- `claude-3-haiku-20240307`: Deprecated — retirement April 19, 2026. Do not use. Use `claude-haiku-4-5-20251001`.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Next.js runtime | ✓ | (project existing) | — |
| `@anthropic-ai/sdk` | Intent classifier | ✗ | Not in package.json | None — must install |
| `@supabase/supabase-js` | Sessions, calls, tickets | ✓ | 2.103.0 | — |
| Meta WA API | Send messages | ✗ (pending) | Approval pending | Stub: `console.log` in `sendWhatsAppMessage()` |
| n8n Cloud Pro | Webhook orchestration | ✓ (ready) | Cloud Pro | — |
| ANTHROPIC_API_KEY | Claude Haiku calls | Unconfirmed | — | Cannot classify intent without it |

**Missing dependencies with no fallback:**
- `@anthropic-ai/sdk` 0.88.0 — must be installed (`npm install @anthropic-ai/sdk`)
- `ANTHROPIC_API_KEY` must be present in `.env.local` — intent classification fails without it

**Missing dependencies with fallback:**
- Meta WA API (pending approval) — `sendWhatsAppMessage()` stubs to `console.log` until token present

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Jest 29 with `next/jest.js` wrapper |
| Config file | `mykasih-crm/jest.config.ts` (exists) |
| Quick run command | `cd mykasih-crm && npm test -- --testPathPattern=chatbot` |
| Full suite command | `cd mykasih-crm && npm test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| CHAT-01 | GET /api/webhook/chat returns hub.challenge on valid token | unit | `npm test -- --testPathPattern=webhook-chat` | ❌ Wave 0 |
| CHAT-01 | GET /api/webhook/chat returns 403 on wrong token | unit | same | ❌ Wave 0 |
| CHAT-02 | POST /api/webhook/chat extracts message body from Meta payload | unit | same | ❌ Wave 0 |
| CHAT-02 | POST /api/webhook/chat extracts button_reply.title from interactive payload | unit | same | ❌ Wave 0 |
| CHAT-03 | classifyIntent('semak baki') returns {intent:'balance_check', language:'bm'} | unit (mock Claude) | `npm test -- --testPathPattern=intent-classifier` | ❌ Wave 0 |
| CHAT-03 | classifyIntent returns 'unknown' on parse error without throwing | unit | same | ❌ Wave 0 |
| CHAT-04 | faqHandler queries kb_entries with is_active=true | unit (mock Supabase) | `npm test -- --testPathPattern=faq-handler` | ❌ Wave 0 |
| CHAT-05 | balanceHandler masks IC before storing in session | unit | `npm test -- --testPathPattern=balance-handler` | ❌ Wave 0 |
| CHAT-06 | merchantHandler calls lookupByPostcode with 4-digit prefix | unit | `npm test -- --testPathPattern=merchant-handler` | ❌ Wave 0 |
| CHAT-07 | complaintHandler step 4 creates ticket with TKT ref | unit (mock Supabase) | `npm test -- --testPathPattern=complaint-handler` | ❌ Wave 0 |
| CHAT-08 | sendWhatsAppButtons uses type:"list" not type:"button" | unit | `npm test -- --testPathPattern=meta-wa` | ❌ Wave 0 |
| CHAT-09 | complaintHandler inserts call with channel='chat' | unit (mock Supabase) | `npm test -- --testPathPattern=complaint-handler` | ❌ Wave 0 |
| CHAT-10 | sendWhatsAppMessage logs to console when env vars absent | unit | `npm test -- --testPathPattern=meta-wa` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `cd mykasih-crm && npm test -- --testPathPattern=<changed-module>`
- **Per wave merge:** `cd mykasih-crm && npm test`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps

- [ ] `__tests__/api/webhook-chat.test.ts` — covers CHAT-01, CHAT-02
- [ ] `__tests__/api/chatbot-message.test.ts` — covers CHAT-03 dispatch path
- [ ] `__tests__/lib/meta-wa.test.ts` — covers CHAT-08, CHAT-10
- [ ] `__tests__/lib/intent-classifier.test.ts` — covers CHAT-03
- [ ] `__tests__/lib/session-manager.test.ts` — session CRUD, expiry
- [ ] `__tests__/lib/faq-handler.test.ts` — covers CHAT-04
- [ ] `__tests__/lib/balance-handler.test.ts` — covers CHAT-05
- [ ] `__tests__/lib/merchant-handler.test.ts` — covers CHAT-06
- [ ] `__tests__/lib/complaint-handler.test.ts` — covers CHAT-07, CHAT-09

Install: `@anthropic-ai/sdk` needed before tests can import the classifier.

---

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | No | No user login in chatbot flow |
| V3 Session Management | Yes | Supabase sessions table with 30-min TTL + expires_at check |
| V4 Access Control | Yes | Service role key (server-only); n8n secret validates inbound calls |
| V5 Input Validation | Yes | All user messages sanitized before DB write; IC validated before masking |
| V6 Cryptography | No | No encryption needed beyond Supabase TLS (PDPA masks IC, doesn't encrypt) |

### Known Threat Patterns for WhatsApp Chatbot Stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Replay attack on n8n → Next.js webhook | Tampering | Validate `x-n8n-webhook-secret` header on every POST |
| IC number leaked in session storage | Info Disclosure | `maskIC()` before any Supabase write; never log raw IC |
| Session hijacking by spoofing wa_phone | Tampering | `wa_phone` comes from Meta payload — verified by n8n/Meta; acceptable for POC |
| Prompt injection via WA message | Tampering | Claude system prompt instructs classification only; output parsed as JSON with try/catch |
| Duplicate ticket from retry | Elevation of Privilege | Deduplicate on WAMID; ticket reference is UNIQUE in DB |
| ANTHROPIC_API_KEY exposure | Info Disclosure | Key only in `.env.local` (server-side only); never in `NEXT_PUBLIC_*` |

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `sendWhatsAppButtons()` using `type: "list"` will correctly render 4 items as a tappable list in WhatsApp | Code Examples | If Meta's list format changed, buttons won't render — test via Postman before go-live |
| A2 | n8n "WhatsApp Trigger" node handles Meta webhook GET verification natively | Architecture Patterns — Pitfall 7 | If not, must expose `/api/webhook/chat` GET endpoint directly to Meta |
| A3 | Claude Haiku 4.5 accurately classifies BM/EN chatbot intents with the given system prompt | Code Examples — Pattern 3 | Requires prompt tuning if classification accuracy is low — add few-shot examples |
| A4 | Session manager uses service role client (bypasses RLS) for sessions table | Pattern 5 | If anon key used, RLS will block inserts — test with actual Supabase config |
| A5 | `calls.elevenlabs_conversation_id` column is repurposed or a new `wa_message_id` column is needed for WAMID dedup | Common Pitfalls | Without dedup, retries create duplicate calls records |

---

## Open Questions

1. **Does n8n handle Meta webhook verification (GET) natively?**
   - What we know: n8n Cloud Pro has a WhatsApp Business Cloud node
   - What's unclear: Whether the WA Trigger node in n8n absorbs the GET verification, or whether the Meta App must be pointed directly at Next.js `/api/webhook/chat`
   - Recommendation: When configuring n8n, check if the WA Trigger node exposes a verification URL. If yes, `/api/webhook/chat` GET is only a fallback. If no, it must be the primary verification endpoint.

2. **What n8n node POSTs to `/api/chatbot/message`?**
   - What we know: Architecture says "n8n HTTP POST → Next.js /api/chatbot/message"
   - What's unclear: Whether the n8n workflow passes the raw Meta payload or a cleaned message body; what secret header is sent
   - Recommendation: Define the n8n → Next.js payload contract in Plan 03-02. The simplest contract: `{ waPhone, message, contactName, wamid, isTest }`.

3. **Is WAMID deduplication required in Phase 3?**
   - What we know: Meta delivers at-least-once; retries can cause duplicate processing
   - What's unclear: Whether n8n already deduplicates at the workflow level
   - Recommendation: Add `wa_message_id` column to `calls` table in sessions migration (Plan 03-01) as UNIQUE. Low cost to add now, painful to retrofit later.

---

## Sources

### Primary (HIGH confidence)
- [VERIFIED: platform.claude.com/docs/en/about-claude/models/overview] — Claude Haiku 4.5 model ID `claude-haiku-4-5-20251001`, pricing $1/$5 per MTok
- [VERIFIED: platform.claude.com/docs/en/api/messages] — Messages API TypeScript examples, system prompt format, model parameters
- [VERIFIED: npm registry] — `@anthropic-ai/sdk` latest version 0.88.0
- [VERIFIED: WebSearch + Meta dev docs] — Meta WA webhook verification flow (hub.mode, hub.challenge, hub.verify_token)
- [VERIFIED: WebSearch + Meta dev docs] — Interactive buttons max 3; list messages support up to 10 rows
- [VERIFIED: WebSearch] — Meta incoming webhook JSON structure (entry → changes → value → messages array)
- [VERIFIED: WebSearch] — `interactive.button_reply.id` for button click payloads; `interactive.list_reply.id` for list click payloads

### Secondary (MEDIUM confidence)
- [CITED: hookdeck.com/webhooks/platforms/guide-to-whatsapp-webhooks] — Respond 200 immediately pattern; WAMID deduplication
- [CITED: supabase.com/docs/guides/database/postgres/row-level-security] — Service role key bypasses RLS; never use in browser

### Tertiary (LOW confidence)
- n8n WhatsApp Trigger node behavior (GET verification handling) — unverified for specific n8n Cloud Pro version

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — Anthropic SDK version verified on npm; existing dependencies confirmed in package.json
- Architecture: HIGH — Meta webhook format verified; Claude API verified; session pattern consistent with Phase 2 patterns
- Pitfalls: HIGH — button limit (3 max) verified via Meta docs; other pitfalls from known patterns
- n8n internal behavior: LOW — assumed from community guides; needs confirmation during plan execution

**Research date:** 2026-04-11
**Valid until:** 2026-05-11 (30 days — Meta API and Claude model IDs are stable)
