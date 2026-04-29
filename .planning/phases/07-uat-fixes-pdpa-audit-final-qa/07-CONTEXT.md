# Phase 7: UAT Fixes, PDPA Audit & Final QA - Context

**Gathered:** 2026-04-13
**Status:** Ready for planning

<domain>
## Phase Boundary

The system passes user acceptance testing, every PDPA obligation is confirmed met, all security controls are verified, and the platform is production-ready for handoff to MyKasih Foundation. This phase audits, hardens, and signs off — it does not add new features.

</domain>

<decisions>
## Implementation Decisions

### PDPA IC Audit (SEC-01)
- **D-01:** Full DB + codebase audit. Query every text and jsonb column across all 7 Supabase tables (calls, transcripts, tickets, kb_entries, users, merchants, sessions) for IC number patterns matching `\d{6}-?\d{2}-?\d{4}` where the result is NOT already in masked format (`XXXXXX-**-****`).
- **D-02:** Codebase grep for hardcoded IC numbers in test fixtures, seed data files, comments, and environment examples. Pattern: 6+2+4 digit sequences that look like Malaysian IC numbers.
- **D-03:** Auto-remediation: if any plain-text IC is found in the DB, run an UPDATE to apply the maskIC() pattern in place. Log every row changed (table, column, row ID, before → after).
- **D-04:** Produce `PDPA-AUDIT.md` compliance report documenting: every table/column checked, patterns searched, results (pass/fail per table), remediation actions taken, and final sign-off. This report is for MyKasih Foundation handoff.

### RLS Policy Design (SEC-02)
- **D-05:** Create Supabase RLS policies on all tables. Policies enforced by role from the `users` table, matched via `auth.uid()` → `users.id` join.
- **D-06:** Access matrix:

| Table | admin | mykasih | qmedia | supervisor |
|-------|-------|---------|--------|------------|
| calls | full CRUD | read all | read all | read all |
| transcripts | full CRUD | read all | read all | read all |
| tickets | full CRUD | read + update status | read only | read + update status |
| kb_entries | full CRUD | full CRUD | no access | no access |
| users | full CRUD | read own | read own | read own |
| merchants | full CRUD | read all | read all | read all |
| sessions | full CRUD | read all | no access | read all |
| settings | full CRUD | no access | no access | no access |

- **D-07:** Service role key bypasses RLS — all API routes using `SUPABASE_SERVICE_ROLE_KEY` (webhooks, chatbot, seed) continue to work without policy changes. RLS protects the client-side Supabase calls and any future direct DB access.
- **D-08:** `is_test=true` rows visible to all roles in data pages — filtering is at the application/analytics level, not RLS. This avoids breaking Testing Console workflows.

### Webhook Hardening (SEC-03)
- **D-09:** Verify ElevenLabs HMAC-SHA256 validation is enforced in `POST /api/webhook/voice` — reject with 401 if `ELEVENLABS_WEBHOOK_SECRET` is set and signature doesn't match. Already implemented; verify it works correctly.
- **D-10:** Verify Meta WA `hub.verify_token` check is enforced in `GET /api/webhook/chat` and n8n secret check in `POST /api/webhook/chat`. Already implemented; verify it works correctly.
- **D-11:** Add replay protection to ElevenLabs webhook: check `x-timestamp` or equivalent header, reject requests older than 5 minutes. If ElevenLabs doesn't provide a timestamp header, skip this — don't over-engineer.
- **D-12:** Dev mode flexibility preserved: when `ELEVENLABS_WEBHOOK_SECRET` or `N8N_WEBHOOK_SECRET` env vars are missing/empty, skip secret validation (existing behavior). Log a warning at startup.

### Test Data Exclusion (SEC-04)
- **D-13:** Verify all analytics/summary API routes filter `is_test != true`. Check: `/api/analytics/summary`, `/api/analytics/charts`, and the Excel export route.
- **D-14:** Verify Testing Console voice calls and chatbot simulator interactions carry `is_test=true`. Voice tab already tags via `dynamicVariables.is_test` + fallback POST. Chatbot simulator uses `/api/chatbot/simulate` route — verify it sets `is_test=true` on any calls record it creates.
- **D-15:** Add an `is_test` filter toggle to the analytics page UI — default OFF (excludes test data), but admin can toggle ON to include test data for debugging. If this is too much scope for Phase 7, defer to backlog.

### MFA Enforcement (SEC-05)
- **D-16:** Enable Supabase Auth TOTP-based MFA for admin role only. Non-admin roles (mykasih, qmedia, supervisor) do not require MFA.
- **D-17:** Login flow: after successful email/password, check if user is admin. If admin and MFA not enrolled → redirect to MFA enrollment page (show QR code, verify first TOTP, generate recovery codes). If admin and MFA enrolled → show TOTP input screen before granting access.
- **D-18:** Recovery codes: 10 single-use codes generated at enrollment. Display once, user must save them. Support recovery code entry as alternative to TOTP.
- **D-19:** MFA configuration via Supabase Dashboard settings (not code) — enable the MFA factor type in Supabase Auth config. The code changes are only on the login flow UI and auth checks.

### Claude's Discretion
- Exact SQL for RLS policies (syntax depends on Supabase auth helpers available)
- IC pattern regex specifics for the audit scan
- Whether to add a dedicated MFA enrollment page or inline it in the login flow
- PDPA-AUDIT.md report format and level of detail
- Whether replay protection is feasible given ElevenLabs webhook payload structure

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Security Requirements
- `.planning/REQUIREMENTS.md` §Security & Compliance — SEC-01 through SEC-05 (exact acceptance criteria)
- `.planning/ROADMAP.md` §Phase 7 — 5 success criteria that must be TRUE

### Database Schema
- `supabase_migrations.sql` — Full schema for all tables; RLS policies must match column names and constraints
- `mykasih-crm/supabase/migrations/20260411_create_sessions.sql` — Sessions table with RLS already enabled

### Existing Security Code
- `mykasih-crm/lib/ic-mask.ts` — maskIC() utility; audit must verify this is called before every DB write
- `mykasih-crm/app/api/webhook/voice/route.ts` — ElevenLabs HMAC validation implementation
- `mykasih-crm/app/api/webhook/chat/route.ts` — Meta WA verify_token + n8n secret validation
- `mykasih-crm/app/api/chatbot/message/route.ts` — n8n webhook secret check
- `mykasih-crm/proxy.ts` — Route protection (cookie presence check only)

### Auth & Login
- `mykasih-crm/app/(auth)/login/page.tsx` — Current login page; MFA flow adds to this
- `mykasih-crm/lib/supabase/client.ts` — Browser Supabase client (MFA challenge handled here)
- `mykasih-crm/lib/supabase/server.ts` — Server Supabase client

### Analytics (test data filtering)
- `mykasih-crm/app/api/analytics/summary/route.ts` — Verify is_test filter
- `mykasih-crm/app/api/analytics/charts/route.ts` — Verify is_test filter
- `mykasih-crm/app/api/export/calls/route.ts` — Already excludes is_test by default

### Design System
- `CLAUDE.md` — Roles & Access table, Security Rules section, color tokens

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `lib/ic-mask.ts` — maskIC() already tested and used in balance-handler, complaint-handler, and voice webhook
- `lib/supabase/server.ts` — Server client for API routes; service role key bypasses RLS
- `lib/supabase/client.ts` — Browser client for auth flows; will need MFA challenge handling
- Supabase Auth built-in MFA support — `supabase.auth.mfa.enroll()`, `supabase.auth.mfa.challenge()`, `supabase.auth.mfa.verify()`

### Established Patterns
- API route auth pattern: `createClient()` → `getUser()` → check `users` table for role
- Webhook secret validation: HMAC-SHA256 for ElevenLabs, bearer token for n8n
- `is_test` filtering: `eq('is_test', false)` already used in analytics routes

### Integration Points
- RLS policies: applied via SQL migration in Supabase Dashboard or migration file
- MFA: Supabase Auth config + login page UI changes
- PDPA audit: standalone script or API route that scans all tables
- Webhook verification: existing route handlers — verify, don't rewrite

</code_context>

<specifics>
## Specific Ideas

- PDPA-AUDIT.md should be a proper compliance artifact suitable for presenting to MyKasih Foundation during handoff — not just a developer checklist
- RLS policies should use Supabase's `auth.uid()` and join to `users` table for role lookup — this is the standard Supabase pattern
- MFA enrollment QR code should use the same dark theme as the rest of the dashboard
- Phase 7 is the final phase — any bugs or issues found during UAT that aren't security-related should be fixed inline rather than deferred

</specifics>

<deferred>
## Deferred Ideas

- **D-18 (Recovery codes)** — Deferred to v2. Supabase MFA does not support native recovery codes. Admin recovery handled via Supabase Dashboard admin access. Caveat notice displayed to admins at MFA enrollment. User confirmed deferral 2026-04-29.
- is_test toggle on analytics page UI — may be too much scope for Phase 7; note for backlog if not included
- IP allowlisting for webhooks — unnecessary complexity for v1
- Rate limiting on webhook endpoints — defer to v2 when traffic is higher

</deferred>

---

*Phase: 07-uat-fixes-pdpa-audit-final-qa*
*Context gathered: 2026-04-13*
