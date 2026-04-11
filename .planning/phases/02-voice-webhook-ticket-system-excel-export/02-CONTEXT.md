# Phase 2: Voice Webhook, Ticket System & Excel Export — Context

**Gathered:** 2026-04-11 (auto mode)
**Status:** Ready for planning

<domain>
## Phase Boundary

Backend API work only — ElevenLabs webhook endpoint that saves voice call records and transcripts to Supabase, auto-creates complaint tickets with reference numbers, IC masking utility, ticket reference generator, and Excel export API.

This phase does NOT include: any UI dashboard pages for viewing calls/tickets (Phase 4), WhatsApp chatbot (Phase 3), or any frontend components beyond what is needed to expose the export download button on existing pages.

</domain>

<decisions>
## Implementation Decisions

### Category Detection

- **D-01:** Category is collected as a structured `data_collection` variable by SARA during the call — NOT inferred post-call. Configure ElevenLabs agent to collect a `category` field during the conversation that maps to the DB enum values: `eligibility | faq | registration | complaint | merchant_lookup | balance_check`.
- **D-02:** Fallback if `category` is null or missing in the ElevenLabs webhook payload: apply keyword matching on the transcript turns (e.g. "aduan"/"complaint" → complaint, "baki"/"balance" → balance_check). Do NOT make a post-call Claude API call for category classification — keep Phase 2 dependency-free from Claude API (that's Phase 3).
- **D-03:** If category still cannot be determined after keyword fallback, store `category = null` and continue — do not block the webhook response.

### IC Collection in Voice Calls

- **D-04:** SARA does NOT ask callers for their IC number during voice calls. The voice agent handles FAQs, eligibility info, and merchant lookup — IC collection only happens in the chatbot balance check flow (Phase 3).
- **D-05:** All voice call records in the `calls` table will have `masked_ic = null`. This is correct and expected.
- **D-06:** `lib/ic-mask.ts` must still be created in this phase (VOICE-05) as it is a shared utility. The chatbot (Phase 3) will be its primary consumer. Implement it fully: `maskIC(ic: string): string` — converts `880512123456` or `880512-12-3456` to `880512-**-****`.

### Excel Export Content

- **D-07:** 3-sheet XLSX file structure:
  - **Sheet 1 — Semua Interaksi:** Columns: No., Timestamp, Channel (📞/💬), Caller Name, WA Number, Location, Language, Duration/Messages, Category, Outcome, CSAT Rating, Is Test
  - **Sheet 2 — Tiket:** Columns: No., Reference No. (TKT-YYYY-NNNNN), Created At, Category, Description, Status, Masked IC, Assigned To, Linked Call ID
  - **Sheet 3 — Ringkasan:** Aggregate summary rows — Total Interactions, By Channel (voice/chat counts), By Category (all 6), By Outcome (resolved/escalated/callback/abandoned), Average CSAT, Ticket counts by status (open/in_progress/resolved), Report date range (from/to)
- **D-08:** Use `xlsx` (SheetJS) npm package for Excel generation — already a widely-used, dependency-free option. Add to package.json.
- **D-09:** Export endpoint `GET /api/export/calls` accepts optional query params: `?from=YYYY-MM-DD&to=YYYY-MM-DD`. If omitted, exports all records. Excludes `is_test=true` rows by default; add `?include_test=true` param to override.
- **D-10:** Role guard: `admin` and `qmedia` roles only. Return 403 for other roles.

### Webhook Error Handling

- **D-11:** Always return HTTP 200 to ElevenLabs, even if Supabase insert fails. This prevents ElevenLabs from retrying the webhook (which would cause duplicate call records).
- **D-12:** On Supabase failure: log the full error server-side (`console.error`) with the ElevenLabs `conversation_id` so data can be recovered from the ElevenLabs dashboard. Return `{ success: false, error: "DB write failed", conversation_id }` with status 200.
- **D-13:** On successful save: return `{ success: true, call_id, ticket_id }` (ticket_id is null if no complaint ticket was created).
- **D-14:** Webhook secret validation (VOICE-01): ElevenLabs sends the secret in the `ElevenLabs-Signature` header. Validate using HMAC-SHA256 comparison against `ELEVENLABS_WEBHOOK_SECRET` env var. Return 401 if invalid — this is the only case where we DO NOT return 200.

### Ticket Auto-Creation

- **D-15:** Ticket is auto-created if and only if `category === 'complaint'` in the parsed webhook payload (after fallback resolution). No additional conditions.
- **D-16:** Ticket fields populated from webhook: `call_id`, `channel = 'voice'`, `category = 'complaint'`, `description` = first 500 chars of the complaint transcript turns joined, `status = 'open'`, `reference_no` from `generateTicketRef()`, `masked_ic = null` (voice — see D-05).
- **D-17:** `lib/ticket-ref.ts` → `generateTicketRef(): Promise<string>` — queries `tickets` table for `MAX(reference_no)` where format matches `TKT-2026-NNNNN`, increments by 1, zero-pads to 5 digits. Format: `TKT-2026-00001`. On empty table, starts at `TKT-2026-00001`.

### Claude's Discretion

- Exact HMAC-SHA256 implementation for ElevenLabs signature validation
- Sheet column widths and formatting in the Excel file
- Whether to add a column freeze/header bold style to Excel sheets
- Specific keyword list for transcript category fallback matching

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Database Schema
- `supabase_migrations.sql` — Full schema for calls, transcripts, tickets tables. Webhook must match column names exactly.
- `.planning/REQUIREMENTS.md` §Voice Webhook — VOICE-01 through VOICE-06, EXPORT-01, EXPORT-02 (exact acceptance criteria)
- `.planning/ROADMAP.md` §Phase 2 — 5 success criteria that must be TRUE

### Design System & Auth Patterns
- `CLAUDE.md` — Color tokens, role definitions (admin/mykasih/qmedia/supervisor), env vars, security rules (IC masking format)
- `.planning/phases/01-scaffold-db-auth-dashboard-shell/01-CONTEXT.md` — Auth pattern, Supabase client setup (@supabase/ssr), TypeScript conventions established in Phase 1

### Existing Code to Reuse
- `mykasih-crm/lib/supabase/server.ts` — Server-side Supabase client (created in Phase 1) — use for all API routes
- `mykasih-crm/lib/merchant-lookup.ts` — Reference for lib/ utility pattern (how to export typed functions)
- `mykasih-crm/app/api/seed/merchants/route.ts` — Reference for Next.js App Router API route pattern with Supabase auth check

No external specs beyond these — all requirements captured in decisions above.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `mykasih-crm/lib/supabase/server.ts` — Server Supabase client ready; use `createClient()` from here in all API routes
- `mykasih-crm/app/api/seed/merchants/route.ts` — Pattern for role-guarded API routes with Supabase JWT auth check
- `mykasih-crm/components/calls/ChannelBadge.tsx` — Already exists from Phase 1 scaffold; reference for channel display constants
- `mykasih-crm/components/calls/TranscriptModal.tsx` — Already exists; will need real data from the `/api/calls/[id]/transcript` route built in this phase

### Established Patterns
- App Router API routes: `app/api/[route]/route.ts` with named exports `GET`, `POST`, `PATCH`, `DELETE`
- Auth pattern: `const supabase = createClient()` → `const { data: { user } }` → check `users` table for role
- TypeScript strict: no `any` — type all ElevenLabs payload fields explicitly
- Tailwind CSS 4 syntax in place — irrelevant for this phase (pure backend)

### Integration Points
- `app/api/webhook/voice/route.ts` — NEW, must be created. ElevenLabs points to this URL.
- `app/api/export/calls/route.ts` — NEW, streaming XLSX file download
- `app/api/calls/route.ts` — NEW, paginated call list (needed by Phase 4 pages)
- `app/api/calls/[id]/transcript/route.ts` — NEW, transcript for modal
- `app/api/tickets/route.ts` — NEW, ticket list + status update
- `lib/ic-mask.ts` — NEW shared utility
- `lib/ticket-ref.ts` — NEW shared utility

</code_context>

<specifics>
## Specific Ideas

- ElevenLabs webhook header name: `ElevenLabs-Signature` — validate with HMAC-SHA256 against `ELEVENLABS_WEBHOOK_SECRET`
- IC mask format: input `880512123456` or `880512-12-3456` → output always `880512-**-****`
- Ticket reference: `TKT-2026-00001` incrementing — query MAX from DB, not a counter in memory (restart-safe)
- Excel export excludes `is_test=true` rows by default — important for clean client demos
- Return 200 even on DB failure (ElevenLabs retry prevention) — the one exception is invalid webhook secret (401)

</specifics>

<deferred>
## Deferred Ideas

None — all discussion stayed within Phase 2 scope.

</deferred>

---

*Phase: 02-voice-webhook-ticket-system-excel-export*
*Context gathered: 2026-04-11*
