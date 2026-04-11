# Phase 2: Voice Webhook, Ticket System & Excel Export — Research

**Researched:** 2026-04-11
**Domain:** Next.js App Router API routes, ElevenLabs Conversational AI webhooks, Supabase server-side data insertion, SheetJS XLSX generation, HMAC-SHA256 validation
**Confidence:** HIGH (core stack verified against local node_modules docs + npm registry; ElevenLabs payload structure verified from official API reference)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Category Detection**
- D-01: Category is a structured `data_collection` variable collected by SARA during the call — NOT inferred post-call. ElevenLabs agent collects a `category` field mapping to: `eligibility | faq | registration | complaint | merchant_lookup | balance_check`.
- D-02: Fallback if `category` is null/missing: keyword matching on transcript turns (e.g. "aduan"/"complaint" → complaint, "baki"/"balance" → balance_check). No post-call Claude API call.
- D-03: If category still indeterminate after fallback, store `category = null` and continue — do not block webhook response.

**IC Collection in Voice Calls**
- D-04: SARA does NOT collect IC numbers during voice calls. IC collection is chatbot-only (Phase 3).
- D-05: All voice call records will have `masked_ic = null` in the `calls` table. Expected behaviour.
- D-06: `lib/ic-mask.ts` must be created in this phase as a shared utility for Phase 3. Implement `maskIC(ic: string): string` — converts `880512123456` or `880512-12-3456` to `880512-**-****`.

**Excel Export Content**
- D-07: 3-sheet XLSX: Sheet 1 "Semua Interaksi" (calls data), Sheet 2 "Tiket" (tickets data), Sheet 3 "Ringkasan" (summary aggregates).
- D-08: Use `xlsx` (SheetJS) npm package — install from SheetJS CDN (not stale npm registry version).
- D-09: `GET /api/export/calls` accepts `?from=YYYY-MM-DD&to=YYYY-MM-DD` (optional). Excludes `is_test=true` by default; `?include_test=true` to override.
- D-10: Role guard: `admin` and `qmedia` only. Return 403 for other roles.

**Webhook Error Handling**
- D-11: Always return HTTP 200 to ElevenLabs even on Supabase failure — prevents duplicate records from retries.
- D-12: On DB failure: `console.error` with `conversation_id`, return `{ success: false, error: "DB write failed", conversation_id }` with status 200.
- D-13: On success: return `{ success: true, call_id, ticket_id }` (ticket_id is null if no complaint).
- D-14: Invalid webhook secret → return 401 (only case where 200 is NOT returned).

**Ticket Auto-Creation**
- D-15: Ticket created only when `category === 'complaint'`.
- D-16: Ticket fields from webhook: `call_id`, `channel='voice'`, `category='complaint'`, `description` = first 500 chars of complaint transcript turns joined, `status='open'`, `reference_no` from `generateTicketRef()`, `masked_ic=null`.
- D-17: `lib/ticket-ref.ts` → `generateTicketRef(): Promise<string>` — queries `tickets.MAX(reference_no)` where format matches `TKT-2026-NNNNN`, increments by 1, zero-pads to 5 digits. Starts at `TKT-2026-00001` on empty table.

### Claude's Discretion
- Exact HMAC-SHA256 implementation for ElevenLabs signature validation
- Sheet column widths and formatting in the Excel file
- Whether to add column freeze/header bold style to Excel sheets
- Specific keyword list for transcript category fallback matching

### Deferred Ideas (OUT OF SCOPE)
None — all discussion stayed within Phase 2 scope.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| VOICE-01 | POST /api/webhook/voice validates ElevenLabs webhook secret from header | HMAC-SHA256 via Node.js `crypto` module; ElevenLabs signature format documented below |
| VOICE-02 | Webhook parses ElevenLabs payload and inserts call record (channel='voice') into calls table | ElevenLabs payload fields mapped to DB schema in Code Examples section |
| VOICE-03 | Webhook inserts all transcript turns into transcripts table | ElevenLabs `transcript[]` array maps to `transcripts` table speaker/message/timestamp |
| VOICE-04 | If category = 'complaint', webhook generates TKT-YYYY-NNNNN reference and inserts ticket record | Ticket-ref query pattern + Supabase service role insert |
| VOICE-05 | lib/ic-mask.ts exports maskIC() | Pure regex utility — no external dependency needed |
| VOICE-06 | lib/ticket-ref.ts exports generateTicketRef() | MAX query against Supabase `tickets` table + string formatting |
| EXPORT-01 | GET /api/export/calls — admin+qmedia roles only, 3-sheet xlsx | SheetJS 0.20.3 from CDN, `XLSX.write()` with `type:'buffer'`, binary Response |
| EXPORT-02 | Excel export button on Voice Calls, Chat Messages, All Interactions pages | Frontend-only — anchor tag or fetch to `/api/export/calls`, handled in Phase 4 |
</phase_requirements>

---

## Summary

Phase 2 is a pure backend phase building four API routes and two utility libraries. The foundation (Supabase tables, auth pattern, Next.js 16.2.3 App Router) is established by Phase 1. The two primary technical risks are: (1) ElevenLabs webhook signature validation — must read raw body as text before parsing JSON, and (2) SheetJS installation — the npm registry version (0.18.5) is outdated and should not be used; install from the SheetJS CDN tarball (0.20.3).

The ElevenLabs payload is well-documented and consistent with the GET Conversation API response. `data.analysis.data_collection_results` contains the category field. Transcript turns use `role: 'agent' | 'user'` which maps to the DB schema speaker enum `'bot' | 'user'` (agent role → 'bot' in DB).

The existing API route pattern in `mykasih-crm/app/api/seed/merchants/route.ts` and the Supabase server client in `mykasih-crm/lib/supabase/server.ts` are the canonical patterns for all new routes. Webhook routes must use the Supabase service role key (not anon key) for inserts, matching the merchants seed route pattern.

**Primary recommendation:** Build in this order — utilities first (`ic-mask.ts`, `ticket-ref.ts`), then webhook route, then CRUD routes (`/api/calls`, `/api/calls/[id]/transcript`, `/api/tickets`), then export route last. Webhook route is the highest-risk item and should be built and tested with Postman before proceeding.

---

## Project Constraints (from CLAUDE.md)

| Directive | Requirement |
|-----------|-------------|
| TypeScript strict | No `any` — type all ElevenLabs payload fields explicitly with interfaces |
| Try/catch on all API routes | Wrap all route logic; return proper HTTP status codes |
| No hardcoded colors | Irrelevant for this pure-backend phase |
| IC masking | `maskIC()` applied before every DB write — no plain IC numbers in any field |
| is_test tagging | All test calls tagged `is_test=true` |
| Environment variables | All secrets via `.env.local` — never hardcoded |
| AGENTS.md directive | Read Next.js docs in `node_modules/next/dist/docs/` before writing any code (verified: route handler pattern confirmed from local docs) |
| RLS + service role | Webhook inserts must use `SUPABASE_SERVICE_ROLE_KEY` — RLS policies on `calls`, `transcripts`, `tickets` only allow `service_role` for INSERT |

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| next | 16.2.3 | App Router, API route handlers | Already installed — locked decision |
| @supabase/supabase-js | ^2.103.0 | Service role client for webhook inserts | Already installed |
| @supabase/ssr | ^0.10.2 | Auth client for role-guarded routes | Already installed |
| Node.js `crypto` | built-in (Node 24.7.0) | HMAC-SHA256 webhook signature validation | Native — no install needed |
| xlsx (SheetJS) | 0.20.3 (CDN) | XLSX workbook generation | Decided D-08; CDN version required |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @elevenlabs/elevenlabs-js | 2.42.0 | Optional SDK for `constructEvent()` | Can replace manual HMAC if preferred; adds ~100KB dependency |
| next/server (NextRequest) | 16.2.3 | `request.text()` for raw body, `searchParams` for query params | Used in webhook and export routes |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Manual HMAC-SHA256 (crypto) | `@elevenlabs/elevenlabs-js` SDK `constructEvent()` | SDK simpler but adds dependency; manual crypto is zero-dep and ~10 lines |
| SheetJS CDN tarball | `xlsx@0.18.5` from npm | npm version outdated/vulnerable; CDN version 0.20.3 is current |
| `json_to_sheet()` | `aoa_to_sheet()` | `json_to_sheet` easier for row objects; `aoa_to_sheet` better for summary sheet with mixed row shapes |

**Installation:**
```bash
# Install SheetJS from CDN (not npm)
cd mykasih-crm
npm install --save https://cdn.sheetjs.com/xlsx-0.20.3/xlsx-0.20.3.tgz
```

**Version verification:**
- `xlsx` on npm registry: 0.18.5 [VERIFIED: npm view xlsx version]
- `xlsx` on SheetJS CDN: 0.20.3 [VERIFIED: docs.sheetjs.com]
- `@elevenlabs/elevenlabs-js` on npm: 2.42.0 [VERIFIED: npm view]
- Next.js in project: 16.2.3 [VERIFIED: package.json]
- Node.js on machine: v24.7.0 [VERIFIED: node --version]

---

## Architecture Patterns

### Recommended Project Structure

New files for Phase 2:
```
mykasih-crm/
├── app/api/
│   ├── webhook/
│   │   └── voice/route.ts          ← POST — ElevenLabs webhook receiver
│   ├── calls/
│   │   ├── route.ts                ← GET — paginated calls list
│   │   └── [id]/
│   │       └── transcript/route.ts ← GET — transcript for a call
│   ├── tickets/
│   │   ├── route.ts                ← GET — ticket list
│   │   └── [id]/route.ts           ← PATCH — status update
│   └── export/
│       └── calls/route.ts          ← GET — binary XLSX download
└── lib/
    ├── ic-mask.ts                  ← maskIC() utility
    └── ticket-ref.ts               ← generateTicketRef() utility
```

### Pattern 1: Webhook Route — Raw Body First

**What:** For webhook signature validation, the raw body must be read as text BEFORE calling `request.json()`. Once consumed as JSON, the original bytes are gone.

**When to use:** Any route that validates a request signature against the raw body.

**Example:**
```typescript
// Source: Next.js route.md local docs (confirmed pattern) + ElevenLabs webhook pattern
import type { NextRequest } from 'next/server'
import { createHmac, timingSafeEqual } from 'crypto'

export async function POST(request: NextRequest) {
  // Step 1: Read raw body as text (preserves original bytes for HMAC)
  const rawBody = await request.text()
  const signature = request.headers.get('elevenlabs-signature') ?? ''

  // Step 2: Validate HMAC before any processing
  if (!validateElevenLabsSignature(rawBody, signature)) {
    return Response.json({ error: 'Invalid signature' }, { status: 401 })
  }

  // Step 3: Parse JSON from the already-read string
  const payload = JSON.parse(rawBody) as ElevenLabsWebhookPayload

  // ... process payload
  return Response.json({ success: true }, { status: 200 })
}
```

### Pattern 2: HMAC-SHA256 Signature Validation (Manual)

**What:** ElevenLabs sends the signature in the `elevenlabs-signature` header. The header format is `t=<timestamp>,v0=<hex-encoded-hmac>` where the HMAC is computed over `<timestamp>.<raw_body>`. [MEDIUM — confirmed format from multiple search results; exact format t=/v0= verified from Hookdeck documentation on ElevenLabs webhooks]

**When to use:** Every call to `POST /api/webhook/voice`.

**Example:**
```typescript
// Source: Node.js crypto docs (built-in) + ElevenLabs webhook signature format
import { createHmac, timingSafeEqual } from 'crypto'

function validateElevenLabsSignature(
  rawBody: string,
  signatureHeader: string,
  secret: string
): boolean {
  // Header format: "t=<unix_timestamp>,v0=<hex_hmac>"
  const parts = Object.fromEntries(
    signatureHeader.split(',').map(p => p.split('=') as [string, string])
  )
  const timestamp = parts['t']
  const receivedSig = parts['v0']

  if (!timestamp || !receivedSig) return false

  // Optional: reject replays older than 5 minutes
  const age = Math.abs(Date.now() / 1000 - Number(timestamp))
  if (age > 300) return false

  // Signed content: "<timestamp>.<raw_body>"
  const signedContent = `${timestamp}.${rawBody}`
  const expectedSig = createHmac('sha256', secret)
    .update(signedContent, 'utf8')
    .digest('hex')

  // Constant-time comparison prevents timing attacks
  const expected = Buffer.from(expectedSig, 'hex')
  const received = Buffer.from(receivedSig, 'hex')
  if (expected.length !== received.length) return false
  return timingSafeEqual(expected, received)
}
```

### Pattern 3: Supabase Service Role for Webhook Inserts

**What:** The RLS policy on `calls` table only allows `service_role` for INSERT. The webhook route cannot use the cookie-based auth client (no user session). Use `createClient` from `@supabase/supabase-js` directly with the service role key.

**When to use:** Any API route that inserts/updates without user auth context (webhooks).

**Example:**
```typescript
// Source: mykasih-crm/app/api/seed/merchants/route.ts (existing project pattern)
import { createClient as createServiceClient } from '@supabase/supabase-js'

const supabase = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
```

### Pattern 4: Role-Guarded GET Route

**What:** Standard pattern for authenticated CRUD routes — get user via cookie auth, check role in users table, then proceed.

**When to use:** `/api/calls`, `/api/tickets`, `/api/export/calls`.

**Example:**
```typescript
// Source: mykasih-crm/app/api/seed/merchants/route.ts + analytics/summary/route.ts
import { createClient } from '@/lib/supabase/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { data: userRecord } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    const allowedRoles = ['admin', 'qmedia'] // adjust per route
    if (!userRecord || !allowedRoles.includes(userRecord.role)) {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }
    // ... route logic
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return Response.json({ error: 'Internal server error', detail: message }, { status: 500 })
  }
}
```

### Pattern 5: Binary File Download Response

**What:** Return an XLSX buffer as a `Response` with appropriate headers to trigger browser download.

**When to use:** `GET /api/export/calls`.

**Example:**
```typescript
// Source: Next.js route.md (local docs) — non-UI response pattern + SheetJS write() docs
import * as XLSX from 'xlsx'

// Inside GET handler after building workbook:
const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' }) as Buffer
const filename = `mykasih-export-${new Date().toISOString().split('T')[0]}.xlsx`

return new Response(buffer, {
  status: 200,
  headers: {
    'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'Content-Disposition': `attachment; filename="${filename}"`,
    'Content-Length': buffer.length.toString(),
  },
})
```

### Pattern 6: SheetJS Multi-Sheet Workbook

**What:** Create a workbook, append three sheets, write to buffer.

**When to use:** `GET /api/export/calls`.

**Example:**
```typescript
// Source: docs.sheetjs.com (verified)
import * as XLSX from 'xlsx'

// Sheet 1: Calls data from array of row objects
const callsSheet = XLSX.utils.json_to_sheet(callRows)
callsSheet['!cols'] = [
  { wch: 5 },   // No.
  { wch: 22 },  // Timestamp
  { wch: 8 },   // Channel
  { wch: 20 },  // Caller Name
  // ... rest of columns
]

// Sheet 3: Summary — mixed row shapes use aoa_to_sheet
const summarySheet = XLSX.utils.aoa_to_sheet([
  ['Metrik', 'Nilai'],
  ['Jumlah Interaksi', totalCount],
  ['Suara (Voice)', voiceCount],
  // ...
])

const workbook = XLSX.utils.book_new()
XLSX.utils.book_append_sheet(workbook, callsSheet, 'Semua Interaksi')
XLSX.utils.book_append_sheet(workbook, ticketsSheet, 'Tiket')
XLSX.utils.book_append_sheet(workbook, summarySheet, 'Ringkasan')

const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' })
```

### Anti-Patterns to Avoid

- **Consuming request body as JSON before HMAC validation:** Once `request.json()` is called, `request.text()` returns empty. Always call `request.text()` first, then `JSON.parse()`.
- **Using `createClient()` from `@/lib/supabase/server` in webhook routes:** That client uses cookie-based session auth. Webhook routes have no user session — must use service role client directly.
- **Installing `xlsx` from npm registry:** `npm install xlsx` gives 0.18.5 (outdated, security vulnerabilities). Install from CDN tarball.
- **Generating ticket refs with an in-memory counter:** Counter resets on process restart, causing collisions. Always query `MAX(reference_no)` from DB.
- **Returning 4xx to ElevenLabs on DB failure:** ElevenLabs retries on non-200 responses → duplicate records. Only 401 (invalid signature) should be non-200.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Excel file generation | Custom XML builder | SheetJS `XLSX.utils.json_to_sheet` + `book_append_sheet` | Cell escaping, encoding, multi-format support already handled |
| Webhook signature timing-safe comparison | `===` string comparison | `timingSafeEqual` from Node.js `crypto` | String equality is timing-attack vulnerable |
| XLSX content-type string | Hardcode/guess | `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` | Exact MIME type required for browser download trigger |

**Key insight:** Webhook signature validation looks simple but has two non-obvious correctness requirements: raw body preservation and timing-safe comparison. Both are easily missed when rolling from scratch.

---

## ElevenLabs Payload Reference

### Post-Call Transcription Webhook — Full Structure

[VERIFIED: elevenlabs.io/docs/api-reference/conversations/get — payload matches GET conversation response]

```typescript
interface ElevenLabsWebhookPayload {
  type: 'post_call_transcription' | 'post_call_audio' | 'call_initiation_failure'
  event_timestamp: number  // Unix timestamp
  data: {
    agent_id: string
    conversation_id: string
    status: 'initiated' | 'in-progress' | 'processing' | 'done' | 'failed'
    user_id: string | null
    transcript: Array<{
      role: 'agent' | 'user'
      message: string | null
      time_in_call_secs: number
      tool_calls: unknown[] | null
      tool_results: unknown[] | null
      feedback: unknown | null
    }>
    metadata: {
      start_time_unix_secs: number
      call_duration_secs: number  // ← maps to calls.duration
      cost: number | null
      termination_reason: string
    }
    analysis: {
      call_successful: 'success' | 'failure' | 'unknown'
      transcript_summary: string
      data_collection_results: Record<string, {  // ← category lives here
        data_collection_id: string
        value: string | null          // e.g. "complaint"
        json_schema: unknown
        rationale: string | null
      }>
      evaluation_criteria_results: Record<string, unknown>
    }
    conversation_initiation_client_data: unknown | null
    has_audio: boolean
    has_user_audio: boolean
    has_response_audio: boolean
  }
}
```

### Field Mapping: ElevenLabs → Supabase calls Table

| ElevenLabs field | DB column | Notes |
|-----------------|-----------|-------|
| `data.conversation_id` | `elevenlabs_conversation_id` | For recovery logging |
| `data.metadata.call_duration_secs` | `duration` | Integer seconds |
| `data.metadata.start_time_unix_secs` | `timestamp` | Convert: `new Date(secs * 1000)` |
| `data.analysis.data_collection_results['category']?.value` | `category` | Apply D-02 fallback if null |
| `'voice'` (literal) | `channel` | Always 'voice' for this webhook |
| ElevenLabs doesn't collect | `caller_name` | Extract from transcript or null |
| ElevenLabs doesn't collect | `wa_number` | null for voice calls |
| `'resolved'` or map from `call_successful` | `outcome` | Map: success→resolved, failure→escalated, unknown→null |
| `data.analysis.data_collection_results['language']?.value` | `language` | If SARA collects it; fallback null |
| `false` (default) | `is_test` | Override from `dynamic_variables.is_test` if set |

### Field Mapping: ElevenLabs → Supabase transcripts Table

| ElevenLabs field | DB column | Notes |
|-----------------|-----------|-------|
| (call record id from insert) | `call_id` | UUID returned after calls insert |
| `turn.role === 'agent' ? 'bot' : 'user'` | `speaker` | 'agent' maps to 'bot' in DB enum |
| `turn.message` | `message` | May be null — handle gracefully |
| `new Date((data.metadata.start_time_unix_secs + turn.time_in_call_secs) * 1000)` | `timestamp` | Approximate per-turn timestamp |

---

## Common Pitfalls

### Pitfall 1: Body Consumed Before Signature Check
**What goes wrong:** Calling `await request.json()` before validating the signature. If validation fails, the body is already consumed and can't be re-read.
**Why it happens:** Developers parse JSON first, validate second — natural ordering fails here.
**How to avoid:** ALWAYS `const rawBody = await request.text()` first, then validate, then `JSON.parse(rawBody)`.
**Warning signs:** TypeScript error "body already used" or validation function receiving empty string.

### Pitfall 2: SheetJS npm Registry Version
**What goes wrong:** `npm install xlsx` installs 0.18.5 (last published to npm registry 2023). This version has known security CVEs and missing features.
**Why it happens:** npm registry still shows this as "latest" but SheetJS stopped publishing to npm.
**How to avoid:** Install from CDN: `npm install https://cdn.sheetjs.com/xlsx-0.20.3/xlsx-0.20.3.tgz`
**Warning signs:** `npm view xlsx version` returns `0.18.5` — that confirms the stale version is installed.

### Pitfall 3: Ticket Reference Race Condition
**What goes wrong:** Two simultaneous complaint calls both query MAX(reference_no) = "TKT-2026-00001", both insert "TKT-2026-00002" → unique constraint violation on `reference_no`.
**Why it happens:** MAX query + increment is not atomic without a transaction.
**How to avoid:** The `tickets.reference_no` column has `UNIQUE` constraint — the second insert will fail. Catch the constraint error and retry `generateTicketRef()` once. Alternatively, use a Postgres sequence or DB function (beyond Phase 2 scope — retry is sufficient for expected call volume).
**Warning signs:** Supabase insert error code `23505` (unique_violation) on `reference_no`.

### Pitfall 4: ElevenLabs Webhook Auto-Disable
**What goes wrong:** If the webhook endpoint returns non-200 responses for 10+ consecutive failures, ElevenLabs auto-disables the webhook. No more call data flows in.
**Why it happens:** ElevenLabs interprets repeated failures as a broken endpoint.
**How to avoid:** D-11 — always return 200 even on DB failure. The only legitimate 401 is invalid signature.
**Warning signs:** Calls end but no records appear in Supabase; check ElevenLabs dashboard for webhook delivery status.

### Pitfall 5: params is a Promise in Next.js 16
**What goes wrong:** `params.id` throws "params should be awaited before accessing" in Next.js 15+.
**Why it happens:** Next.js 15 changed `params` to return a Promise — `{ params }: { params: Promise<{ id: string }> }`.
**How to avoid:** `const { id } = await params` — always await params in dynamic route handlers.
**Warning signs:** Build warning or runtime error: "params should be awaited".

### Pitfall 6: HMAC String Comparison Timing Attack
**What goes wrong:** Using `receivedSig === expectedSig` — attacker can determine correct characters by measuring response time.
**Why it happens:** String comparison short-circuits on first mismatch.
**How to avoid:** Use `timingSafeEqual(Buffer.from(expected), Buffer.from(received))` from Node.js `crypto`.
**Warning signs:** No runtime error — this is a silent security flaw.

### Pitfall 7: Supabase Anon Key in Webhook Route
**What goes wrong:** Using `createClient()` from `@/lib/supabase/server` in the webhook route — fails because there's no user session (no cookies).
**Why it happens:** Server client requires cookie context for auth.
**How to avoid:** Use `createClient` from `@supabase/supabase-js` directly with `SUPABASE_SERVICE_ROLE_KEY` for all webhook inserts (same pattern as `/api/seed/merchants`).
**Warning signs:** Supabase returns 401 or RLS policy violation on insert.

---

## Code Examples

### IC Masking Utility
```typescript
// lib/ic-mask.ts
// Source: D-06 spec — pure string manipulation, no dependency

/**
 * Masks a Malaysian IC number to PDPA-compliant format.
 * Input:  "880512123456" or "880512-12-3456"
 * Output: "880512-**-****"
 */
export function maskIC(ic: string): string {
  // Strip existing dashes
  const digits = ic.replace(/-/g, '')

  if (digits.length !== 12 || !/^\d{12}$/.test(digits)) {
    // Return masked placeholder if format is invalid — never throw
    return '??????-**-****'
  }

  const dob = digits.substring(0, 6)
  return `${dob}-**-****`
}
```

### Ticket Reference Generator
```typescript
// lib/ticket-ref.ts
// Source: D-17 spec — queries Supabase MAX, increments, pads

import { createClient as createServiceClient } from '@supabase/supabase-js'

const YEAR = new Date().getFullYear()
const PREFIX = `TKT-${YEAR}-`

export async function generateTicketRef(): Promise<string> {
  const supabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data } = await supabase
    .from('tickets')
    .select('reference_no')
    .like('reference_no', `${PREFIX}%`)
    .order('reference_no', { ascending: false })
    .limit(1)
    .single()

  const lastRef = data?.reference_no as string | null
  let nextNum = 1

  if (lastRef) {
    const lastNum = parseInt(lastRef.replace(PREFIX, ''), 10)
    if (!isNaN(lastNum)) nextNum = lastNum + 1
  }

  return `${PREFIX}${String(nextNum).padStart(5, '0')}`
}
```

### Dynamic Route params (Next.js 16)
```typescript
// app/api/calls/[id]/transcript/route.ts
// Source: Next.js route.md local docs — params is a Promise in v15+

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params  // MUST await in Next.js 15/16
  // ...
}
```

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Jest 30.3.0 + ts-jest 29.4.9 |
| Config file | `jest.config.ts` (or package.json `jest` key — check after Phase 1) |
| Quick run command | `cd mykasih-crm && npm test -- --passWithNoTests` |
| Full suite command | `cd mykasih-crm && npm test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| VOICE-05 | `maskIC()` converts 12-digit and hyphenated IC to masked format | unit | `npm test -- --testPathPattern=ic-mask` | No — Wave 0 |
| VOICE-05 | `maskIC()` handles invalid input without throwing | unit | `npm test -- --testPathPattern=ic-mask` | No — Wave 0 |
| VOICE-06 | `generateTicketRef()` returns `TKT-2026-00001` on empty table | unit (mock Supabase) | `npm test -- --testPathPattern=ticket-ref` | No — Wave 0 |
| VOICE-06 | `generateTicketRef()` increments correctly from existing max | unit (mock Supabase) | `npm test -- --testPathPattern=ticket-ref` | No — Wave 0 |
| VOICE-01 | Webhook returns 401 on invalid signature | manual/Postman | N/A — requires live env | — |
| VOICE-02 | Webhook inserts call record with correct fields | manual/Postman | N/A — requires Supabase | — |
| VOICE-03 | Transcript turns inserted linked to call_id | manual/Postman | N/A — requires Supabase | — |
| VOICE-04 | Complaint category triggers ticket creation | manual/Postman | N/A — requires Supabase | — |
| EXPORT-01 | Export returns XLSX with 3 sheets | manual/Postman | N/A — requires auth + Supabase | — |

### Wave 0 Gaps

- [ ] `mykasih-crm/__tests__/lib/ic-mask.test.ts` — unit tests for `maskIC()`
- [ ] `mykasih-crm/__tests__/lib/ticket-ref.test.ts` — unit tests for `generateTicketRef()` with mocked Supabase

*(All API route tests are manual-only: webhook requires ElevenLabs or Postman simulation; export requires a full auth session. Unit tests cover the two pure utility libraries.)*

---

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | yes | Supabase Auth JWT — existing pattern from Phase 1 |
| V3 Session Management | no | Stateless API routes — no session state |
| V4 Access Control | yes | Role check from `users` table — admin/qmedia guard on export |
| V5 Input Validation | yes | TypeScript strict + explicit payload typing; no user-supplied SQL |
| V6 Cryptography | yes | `crypto.createHmac` (Node built-in) — never hand-rolled HMAC |

### Known Threat Patterns

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Replay attack on webhook | Spoofing | Timestamp check in signature validation — reject events older than 5 minutes |
| Webhook signature bypass | Tampering | `timingSafeEqual` — prevents timing oracle attacks |
| Mass export by unauthorized role | Info Disclosure | Role guard on `/api/export/calls` — 403 for mykasih/supervisor roles |
| IC number in plain text | Info Disclosure | `maskIC()` utility — enforced before every DB write (PDPA) |
| Supabase RLS bypass via service role | Elevation of Privilege | Service role key only in webhook route (no user data) and seed route — never exposed to client |
| Duplicate call records from webhook retry | Tampering | Always return 200 even on failure; `elevenlabs_conversation_id` enables dedup if needed |

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | All API routes | Yes | v24.7.0 | — |
| Next.js | All API routes | Yes | 16.2.3 | — |
| @supabase/supabase-js | Webhook insert, ticket-ref | Yes | ^2.103.0 | — |
| @supabase/ssr | Auth-guarded routes | Yes | ^0.10.2 | — |
| Node.js `crypto` (built-in) | HMAC validation | Yes | built-in | — |
| xlsx (SheetJS CDN) | Export route | No — needs install | 0.20.3 | — |
| ElevenLabs webhook (live) | End-to-end test | Unknown — not testable locally | — | Postman with mock payload |

**Missing dependencies with no fallback:**
- `xlsx` must be installed from CDN before the export route can be built.

**Missing dependencies with fallback:**
- ElevenLabs live webhook cannot be tested locally; use Postman with a constructed POST payload to simulate.

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `params.id` direct access | `const { id } = await params` | Next.js 15 | Must await params in all dynamic routes |
| `GET` handlers cached by default | `GET` handlers dynamic by default | Next.js 15 RC | Export route does not need `export const dynamic = 'force-dynamic'` explicitly |
| `NextResponse.json()` | `Response.json()` | Next.js 15+ | Both work; `Response.json()` is Web API standard |
| xlsx from npm | xlsx from SheetJS CDN tarball | ~2023 | npm version frozen at 0.18.5 with CVEs |

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | ElevenLabs signature header format is `t=<timestamp>,v0=<hex>` | HMAC Validation pattern | Low — SDK `constructEvent` can be used as fallback; format confirmed by multiple sources including Hookdeck docs on ElevenLabs |
| A2 | ElevenLabs `data.analysis.data_collection_results['category']` is the key name for the SARA category variable | Payload Reference | Medium — actual key name depends on what SARA agent's data collection field is named in the ElevenLabs dashboard. If SARA names it differently, the extraction path changes. Verify in ElevenLabs dashboard before deploying. |
| A3 | `outcome` mapping: `call_successful='success'` → `'resolved'`, `'failure'` → `'escalated'`, `'unknown'` → null | Field mapping table | Low — CONTEXT.md doesn't specify; can adjust logic easily after first test webhook |
| A4 | Webhook returns `role: 'agent'` (not `'bot'`) for SARA turns | Transcript mapping | Low — DB enum has `'bot'` and `'user'`; the mapping `agent→bot` is straightforward |

---

## Open Questions

1. **SARA data collection field name for category**
   - What we know: ElevenLabs `data_collection_results` is a `Record<string, { value: string }>` keyed by the field name configured in the ElevenLabs agent dashboard.
   - What's unclear: The exact key name used for the category field in the live SARA agent (could be `"category"`, `"call_category"`, `"intent"`, etc.).
   - Recommendation: Log the full `data_collection_results` object on first real webhook receipt. Build the extraction with a configurable key name or check multiple candidates.

2. **SARA data collection field for language**
   - What we know: The `language` field in the calls table should be `'bm' | 'en' | 'mixed'`.
   - What's unclear: Whether SARA collects language as a data_collection variable or if it must be inferred from transcript content.
   - Recommendation: Default to null if not present; Phase 3 can handle language detection if needed.

3. **Caller name and WA number in voice calls**
   - What we know: ElevenLabs webhook doesn't directly provide caller phone number in the payload (telephony metadata may contain it for phone calls, but SARA uses WebRTC widget).
   - What's unclear: Whether `dynamic_variables` passed to the agent at session start include caller info.
   - Recommendation: Set `caller_name = null` and `wa_number = null` for now. If SARA receives caller info via `conversation_initiation_client_data.dynamic_variables`, those fields can be extracted there.

---

## Sources

### Primary (HIGH confidence)
- Local `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/route.md` — Route handler patterns, params-as-Promise, binary response, webhook example
- `mykasih-crm/app/api/seed/merchants/route.ts` — Service role client pattern, role guard pattern (project codebase)
- `mykasih-crm/app/api/analytics/summary/route.ts` — Auth guard pattern (project codebase)
- `mykasih-crm/package.json` — Confirmed installed package versions
- `npm view xlsx version` — Confirmed 0.18.5 on npm registry [VERIFIED]
- `npm view @elevenlabs/elevenlabs-js version` — Confirmed 2.42.0 [VERIFIED]
- `docs.sheetjs.com/docs/getting-started/installation/nodejs/` — SheetJS 0.20.3 CDN install [CITED]
- `docs.sheetjs.com/docs/api/write-options/` — `XLSX.write()` buffer output pattern [CITED]
- `elevenlabs.io/docs/api-reference/conversations/get` — Full conversation response structure (same format as webhook payload) [CITED]

### Secondary (MEDIUM confidence)
- ElevenLabs webhook documentation (fetched via WebFetch from `/docs/eleven-agents/workflows/post-call-webhooks`) — payload JSON structure, HMAC header format overview
- WebSearch results confirming `t=<timestamp>,v0=<hex>` signature header format — multiple sources including Hookdeck ElevenLabs webhook guide
- WebSearch confirming ElevenLabs SDK `constructEvent` method handles 30-minute timestamp tolerance

### Tertiary (LOW confidence)
- `outcome` field mapping (success→resolved, failure→escalated) — [ASSUMED] — logical mapping not explicitly specified in ElevenLabs docs or CONTEXT.md

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all package versions verified from npm registry and local package.json
- ElevenLabs payload structure: MEDIUM-HIGH — verified from GET conversation API reference (same format as webhook); exact data_collection key names depend on agent configuration
- HMAC signature format: MEDIUM — confirmed from multiple secondary sources; format `t=,v0=` widely documented for ElevenLabs
- SheetJS API: HIGH — verified from official docs.sheetjs.com
- Architecture patterns: HIGH — derived from existing project code

**Research date:** 2026-04-11
**Valid until:** 2026-05-11 (30 days — stable libraries; ElevenLabs webhook format may evolve)
