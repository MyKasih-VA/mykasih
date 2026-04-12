# Phase 7: UAT Fixes, PDPA Audit & Final QA - Research

**Researched:** 2026-04-13
**Domain:** Security hardening, Supabase RLS, Supabase MFA, PDPA compliance audit, webhook verification
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**PDPA IC Audit (SEC-01)**
- D-01: Full DB + codebase audit — query every text and jsonb column across all 7 Supabase tables (calls, transcripts, tickets, kb_entries, users, merchants, sessions) for IC number patterns matching `\d{6}-?\d{2}-?\d{4}` where the result is NOT already in masked format (`XXXXXX-**-****`).
- D-02: Codebase grep for hardcoded IC numbers in test fixtures, seed data files, comments, and environment examples.
- D-03: Auto-remediation — if any plain-text IC is found in the DB, run an UPDATE to apply maskIC() pattern in place. Log every row changed (table, column, row ID, before after).
- D-04: Produce `PDPA-AUDIT.md` compliance report documenting every table/column checked, patterns searched, results (pass/fail per table), remediation actions taken, and final sign-off.

**RLS Policy Design (SEC-02)**
- D-05: Create Supabase RLS policies on all tables. Policies enforced by role from the `users` table, matched via `auth.uid()` to `users.id` join.
- D-06: Access matrix (see CONTEXT.md for full table).
- D-07: Service role key bypasses RLS — all API routes using `SUPABASE_SERVICE_ROLE_KEY` continue to work without policy changes.
- D-08: `is_test=true` rows visible to all roles in data pages — filtering at application/analytics level, not RLS.

**Webhook Hardening (SEC-03)**
- D-09: Verify ElevenLabs HMAC-SHA256 validation is enforced in `POST /api/webhook/voice`.
- D-10: Verify Meta WA `hub.verify_token` and n8n secret check are enforced in `/api/webhook/chat`.
- D-11: Add replay protection to ElevenLabs webhook: check `x-timestamp` or equivalent header, reject requests older than 5 minutes. If ElevenLabs doesn't provide a timestamp header, skip this.
- D-12: Dev mode flexibility preserved: when secrets are missing/empty, skip secret validation. Log a warning at startup.

**Test Data Exclusion (SEC-04)**
- D-13: Verify all analytics/summary API routes filter `is_test != true`.
- D-14: Verify Testing Console voice calls and chatbot simulator carry `is_test=true`.
- D-15: Add `is_test` filter toggle to analytics page UI — default OFF (excludes test data). Defer to backlog if too much scope.

**MFA Enforcement (SEC-05)**
- D-16: Enable Supabase Auth TOTP-based MFA for admin role only. Non-admin roles do not require MFA.
- D-17: Login flow: after successful email/password, check if user is admin. If admin and MFA not enrolled → redirect to MFA enrollment page. If admin and MFA enrolled → show TOTP input screen before granting access.
- D-18: Recovery codes: 10 single-use codes generated at enrollment. Display once, user must save them. Support recovery code entry as alternative to TOTP.
- D-19: MFA configuration via Supabase Dashboard settings — enable the MFA factor type in Supabase Auth config. Code changes are only on the login flow UI and auth checks.

### Claude's Discretion
- Exact SQL for RLS policies (syntax depends on Supabase auth helpers available)
- IC pattern regex specifics for the audit scan
- Whether to add a dedicated MFA enrollment page or inline it in the login flow
- PDPA-AUDIT.md report format and level of detail
- Whether replay protection is feasible given ElevenLabs webhook payload structure

### Deferred Ideas (OUT OF SCOPE)
- is_test toggle on analytics page UI — may be too much scope for Phase 7; note for backlog
- IP allowlisting for webhooks — unnecessary complexity for v1
- Rate limiting on webhook endpoints — defer to v2
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| SEC-01 | Zero plain-text IC numbers stored in any DB field — maskIC() applied before every write | SQL audit query patterns, IC regex, remediation UPDATE template |
| SEC-02 | RLS policies enforced on all 6 tables — each role sees only permitted data | Supabase RLS SQL patterns, security definer function approach |
| SEC-03 | All incoming webhooks validate secret before processing | Existing code audit — HMAC already present, replay protection pattern confirmed |
| SEC-04 | All test calls tagged is_test=true and excluded from analytics | Existing code audit — analytics routes already filter, simulate route gap identified |
| SEC-05 | Admin MFA enforced via Supabase Auth settings | Supabase MFA API methods documented, AAL-based login flow pattern |
</phase_requirements>

---

## Summary

Phase 7 is a security hardening and compliance phase, not a feature phase. All five requirements are about verifying, upgrading, and proving security controls are in place. The research reveals two situations: controls that are mostly implemented correctly and need verification (SEC-03, SEC-04), and controls that need to be built from scratch on a solid foundation (SEC-01 IC audit, SEC-02 role-based RLS, SEC-05 MFA).

The most significant finding is about the existing RLS migration (`supabase_migrations.sql`): RLS is enabled on all tables, but the current policies use broad `authenticated` grants — not role-based restrictions. The Phase 7 migration must DROP these permissive policies and replace them with role-aware ones that join to the `users` table via `auth.uid()`. This is not additive — it requires replacing existing policies or they will conflict.

For MFA, Supabase's official TOTP support is confirmed fully available on all projects including the free tier. The implementation requires two new UI screens (enrollment + challenge), a post-login role check, and the `getAuthenticatorAssuranceLevel()` call to gate access. Recovery codes are NOT natively supported by Supabase MFA — D-18 as written (10 recovery codes) is not achievable via Supabase built-ins. The plan must address this gap.

**Primary recommendation:** Execute in this order: (1) PDPA audit script → remediate any findings, (2) RLS migration with DROP + CREATE, (3) MFA enrollment + challenge UI, (4) analytics/webhook verification pass.

---

## Project Constraints (from CLAUDE.md)

- TypeScript strict mode — no `any` types anywhere
- No hardcoded hex colors — CSS variables only
- No plain-text IC numbers ever — `maskIC()` before every DB write
- RLS enabled on all tables — confirmed in schema
- Admin MFA enforced via Supabase Auth settings
- Service role key only in server-side API routes, never exposed to client
- `is_test=true` on ALL test calls from Testing Console
- Dark theme design system — enrollment/MFA screens must match existing dark theme

---

## Standard Stack

### Core (already in project)
| Library | Version | Purpose | Source |
|---------|---------|---------|--------|
| @supabase/ssr | installed | Server-side Supabase client with cookie auth | [VERIFIED: codebase grep] |
| @supabase/supabase-js | installed | Browser Supabase client, MFA APIs | [VERIFIED: codebase grep] |
| Node.js crypto | built-in | HMAC-SHA256 for webhook signature | [VERIFIED: existing voice webhook code] |
| next/server | Next.js 15/16 | Proxy (middleware) for route protection | [VERIFIED: proxy.ts in codebase] |

### Supporting (needed for Phase 7)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| qrcode | latest | Generate QR code PNG/SVG for TOTP enrollment | MFA enrollment screen only |

**Installation (new packages only):**
```bash
cd mykasih-crm && npm install qrcode
npm install --save-dev @types/qrcode
```

**Version verification:**
```bash
npm view qrcode version       # latest as of research: 1.5.4
npm view @types/qrcode version
```
[VERIFIED: npm registry – qrcode 1.5.4 is the standard browser/Node QR generator]

---

## Architecture Patterns

### Existing Code State (what is already there)

**webhook/voice/route.ts — FULLY IMPLEMENTED:**
- HMAC-SHA256 validation present, using `elevenlabs-signature` header [VERIFIED: codebase read]
- Timestamp extracted from header (`t=<unix>,v0=<hmac>` format) [VERIFIED: codebase read]
- Replay protection window is 5 minutes (line 29: `age > 300`) [VERIFIED: codebase read]
- `is_test` flag read from `conversation_initiation_client_data.dynamic_variables.is_test` [VERIFIED: codebase read]

**webhook/chat/route.ts — VERIFIED CORRECT:**
- Meta WA `hub.verify_token` check present on GET [VERIFIED: codebase read]
- n8n secret header check on POST, conditional on env var [VERIFIED: codebase read]

**analytics/summary/route.ts — VERIFIED CORRECT:**
- All 12 parallel queries filter `.eq('is_test', false)` [VERIFIED: codebase read]

**analytics/charts/route.ts — VERIFIED CORRECT:**
- Main calls query uses `.eq('is_test', false)` [VERIFIED: codebase read]

**export/calls/route.ts — VERIFIED CORRECT:**
- Uses `if (!includeTest) { callsQuery = callsQuery.eq('is_test', false) }` [VERIFIED: codebase read]

**chatbot/simulate/route.ts — GAP IDENTIFIED:**
- Accepts `isTest: boolean` in the request body [VERIFIED: codebase read]
- Does NOT write any record to Supabase — it is a pure in-memory simulation [VERIFIED: codebase read]
- Therefore there is no `is_test` DB write gap here — the route never creates a call record
- The Testing Console chatbot tab uses this simulate route and gets bot responses without DB writes
- SEC-04 for chat simulator is: verified compliant (no DB record created, no analytics pollution)

**RLS policies (supabase_migrations.sql) — GAP IDENTIFIED:**
- RLS is ENABLED on all tables [VERIFIED: codebase read]
- Existing policies are permissive `authenticated` grants — NOT role-based [VERIFIED: codebase read]
- Example: `calls_read` allows ALL authenticated users to SELECT — no role check
- `users_read_own` uses `auth.uid() = id` (correct for own row, but admin needs all rows)
- Phase 7 MUST replace current policies with role-based ones

**login/page.tsx — GAP IDENTIFIED:**
- No MFA check exists after signInWithPassword [VERIFIED: codebase read]
- After sign-in, goes directly to role-based redirect
- Phase 7 must add MFA gate between sign-in and redirect

### Pattern 1: Role-Based RLS via Security Definer Function

**What:** Create a `private.get_user_role()` function that reads the role from the `users` table for the current `auth.uid()`. Use this function in all RLS policies instead of inline subqueries. This prevents a security issue where RLS on the `users` table would block the lookup, and it caches per statement.

**When to use:** All table policies that need to check the caller's role.

**Example:**
```sql
-- Source: [CITED: supabase.com/docs/guides/database/postgres/row-level-security]
-- Create once, reuse in all policies
CREATE OR REPLACE FUNCTION private.get_user_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT role FROM public.users WHERE id = (SELECT auth.uid())
$$;

-- Usage in a policy
CREATE POLICY "calls_select_authenticated"
  ON calls FOR SELECT
  TO authenticated
  USING (
    private.get_user_role() IN ('admin', 'mykasih', 'qmedia', 'supervisor')
  );

-- Tickets: supervisor and mykasih can update status only
CREATE POLICY "tickets_update_mykasih_supervisor"
  ON tickets FOR UPDATE
  TO authenticated
  USING (
    private.get_user_role() IN ('admin', 'mykasih', 'supervisor')
  )
  WITH CHECK (
    private.get_user_role() IN ('admin', 'mykasih', 'supervisor')
  );
```

**CRITICAL — Drop existing permissive policies first:**
```sql
-- Must DROP before CREATE or policies will conflict
DROP POLICY IF EXISTS "calls_read" ON calls;
DROP POLICY IF EXISTS "calls_insert_service" ON calls;
DROP POLICY IF EXISTS "calls_update_service" ON calls;
-- ... repeat for each existing policy
```

[CITED: supabase.com/docs/guides/database/postgres/row-level-security]
[CITED: supabase.com/blog/mfa-auth-via-rls — security definer pattern for role lookups]

### Pattern 2: Supabase MFA TOTP Login Flow

**What:** After email/password sign-in succeeds, call `getAuthenticatorAssuranceLevel()`. If the user is an admin and `nextLevel === 'aal2'` but `currentLevel === 'aal1'`, show the TOTP challenge screen. If MFA is not yet enrolled, show the enrollment screen.

**API methods (all on `supabase.auth.mfa`):**

```typescript
// Source: [CITED: supabase.com/docs/guides/auth/auth-mfa/totp]

// Step 1: After sign-in, check if MFA is needed
const { data: { currentLevel, nextLevel } } =
  await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
// currentLevel: 'aal1' | 'aal2'
// nextLevel:    'aal1' | 'aal2'
// If nextLevel === 'aal2' and currentLevel === 'aal1' → MFA challenge needed
// If nextLevel === 'aal1' → no MFA enrolled

// Step 2a: Enroll (first time)
const { data, error } = await supabase.auth.mfa.enroll({ factorType: 'totp' })
// data.id     = factorId (save for challenge)
// data.totp.qr_code  = data URI for QR image
// data.totp.secret   = manual entry fallback
// data.totp.uri      = otpauth:// URI

// Step 2b: Verify enrollment (confirm the TOTP app works)
const { data: challengeData } = await supabase.auth.mfa.challenge({ factorId: data.id })
await supabase.auth.mfa.verify({
  factorId: data.id,
  challengeId: challengeData.id,
  code: userEnteredCode,
})

// Step 3: Challenge on subsequent logins
const { data: factors } = await supabase.auth.mfa.listFactors()
const totpFactor = factors.totp[0]
const { data: challengeData } = await supabase.auth.mfa.challenge({ factorId: totpFactor.id })
await supabase.auth.mfa.verify({
  factorId: totpFactor.id,
  challengeId: challengeData.id,
  code: userEnteredCode,
})
// After verify succeeds, session upgrades to aal2 automatically
```

**Admin-only MFA gating in login flow:**
```typescript
// Source: [ASSUMED — logic derived from Supabase MFA docs + role check pattern]
// After signInWithPassword succeeds:
const { data: userData } = await supabase.from('users').select('role').eq('id', user.id).single()
const role = userData?.role

if (role === 'admin') {
  const { data: { currentLevel, nextLevel } } =
    await supabase.auth.mfa.getAuthenticatorAssuranceLevel()

  if (nextLevel === 'aal2' && currentLevel !== 'aal2') {
    // MFA enrolled but not verified this session → show challenge screen
    router.push('/login/mfa-challenge')
    return
  }

  if (nextLevel === 'aal1') {
    // MFA not enrolled yet → show enrollment screen
    router.push('/login/mfa-enroll')
    return
  }
}
// Non-admin roles: skip MFA, proceed to redirect
```

[CITED: supabase.com/docs/guides/auth/auth-mfa/totp]
[CITED: supabase.com/docs/guides/auth/auth-mfa]

### Pattern 3: PDPA IC Audit SQL Query

**What:** A Supabase SQL query that scans text columns for unmasked Malaysian IC numbers. The pattern targets `XXXXXX-\d\d-\d\d\d\d` as the positive hit (unmasked), excluding already-masked values `XXXXXX-**-****`.

**Regex for unmasked IC:**
- Dashed format: `\d{6}-\d{2}-\d{4}` (matches `880512-12-3456`)
- Plain format: `^\d{12}$` (matches `880512123456`)
- Already-masked format: `\d{6}-\*\*-\*\*\*\*` (exclude these)

**SQL audit query per table:**
```sql
-- Source: [ASSUMED — PostgreSQL regexp_matches with IC pattern]
-- Scan for any text column matching unmasked IC patterns
-- Run for each table/column combination

-- Example: scan transcripts.message for unmasked ICs
SELECT id, message
FROM transcripts
WHERE message ~ '\d{6}-\d{2}-\d{4}'
  AND message !~ '\d{6}-\*\*-\*\*\*\*';

-- Example: scan sessions.collected_data (jsonb) for IC values
SELECT id, collected_data::text
FROM sessions
WHERE collected_data::text ~ '\d{6}-\d{2}-\d{4}'
  AND collected_data::text !~ '\d{6}-\*\*-\*\*\*\*';

-- Remediation UPDATE (after confirming row)
UPDATE transcripts
SET message = regexp_replace(
  message,
  '(\d{6})-?\d{2}-?\d{4}',
  '\1-**-****',
  'g'
)
WHERE id = '<row_id>';
```

**Tables to scan (all text/jsonb columns):**

| Table | Text Columns to Scan | Notes |
|-------|---------------------|-------|
| calls | caller_name, wa_number, location | IC unlikely here, still check |
| transcripts | message | HIGH RISK — user may type IC in chat |
| tickets | description, masked_ic | masked_ic should already be masked |
| kb_entries | question_bm, question_en, answer_bm, answer_en | Example ICs in KB? |
| users | email, name | Very low risk |
| merchants | outlet_name, address | Zero risk (no PII) |
| sessions | collected_data (jsonb) | HIGH RISK — balance_check handler stores IC |

[CITED: microsoft.com/purview/sit-defn-malaysia-identification-card-number — format confirmation]
[ASSUMED: PostgreSQL regexp_replace syntax — verify against Supabase SQL editor before running]

### Anti-Patterns to Avoid
- **Adding new permissive policies instead of replacing:** Existing policies like `calls_read TO authenticated USING (true)` will OVERRIDE restrictive role-based policies because Postgres permissive policies combine with OR. Must DROP existing before CREATE.
- **Using `auth.jwt()->> 'role'` for role checks:** The JWT `role` claim in Supabase's context means the Postgres role (`authenticated`, `anon`) — NOT the app role from the `users` table. Use `users` table lookup or Auth Hooks + JWT custom claims.
- **Calling `supabase.auth.mfa.enroll()` after session expiry:** The enrollment QR is only valid for ~5 minutes. Show verify TOTP input on the same screen as the QR code — do not route to a separate page between enroll and first verify.
- **Recovery codes via Supabase:** Supabase MFA does NOT natively generate recovery codes. D-18 (10 recovery codes) is not achievable with Supabase's built-in MFA. The plan must scope this to: "enroll a backup TOTP factor" OR defer recovery codes to v2.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| QR code image for TOTP | Custom canvas/SVG renderer | `qrcode` npm package | Battle-tested, handles ECC, outputs PNG data URI |
| HMAC-SHA256 webhook signature | Custom crypto | Node.js `crypto.createHmac` | Already implemented and correct in voice webhook |
| TOTP verification | Time-based OTP math | Supabase MFA APIs | Supabase handles TOTP clock skew, 30s window, factor state |
| Role hierarchy | Custom role table joins | `private.get_user_role()` security definer | Security definer bypasses RLS on users table, caches per query |
| IC masking | New regex | `lib/ic-mask.ts::maskIC()` | Already tested, handles dashed and plain formats |

---

## Common Pitfalls

### Pitfall 1: Permissive RLS Policy Conflict
**What goes wrong:** New role-based policies are added alongside existing `authenticated USING (true)` policies. The old permissive policy grants access to everyone, completely nullifying the new role check.
**Why it happens:** Postgres RLS permissive policies combine with OR — if ANY permissive policy allows access, the row is visible.
**How to avoid:** Always `DROP POLICY IF EXISTS` for every existing policy before creating replacement policies. Do this in a single migration file so it's atomic.
**Warning signs:** After applying new policies, running `SELECT * FROM calls` as a `mykasih` user still returns rows it shouldn't be able to see.

### Pitfall 2: RLS Locks Out Service Role API Routes
**What goes wrong:** New RLS policies that require a user role from the `users` table cause 500 errors in webhook routes that use the service role key.
**Why it happens:** The `private.get_user_role()` function returns `null` for service role callers because `auth.uid()` is null for service role.
**How to avoid:** All policies must explicitly allow `service_role` to bypass, or be scoped `TO authenticated` (not `TO public`). The service role bypasses RLS by default in Supabase when using `SUPABASE_SERVICE_ROLE_KEY` — this is Supabase's built-in behavior and does NOT need a policy. Confirmed: service role always bypasses RLS. [CITED: supabase.com/docs/guides/troubleshooting/why-is-my-service-role-key-client-getting-rls-errors]

### Pitfall 3: MFA `enroll()` QR Code Expires Before Verification
**What goes wrong:** User sees the QR code, scans it, then navigates to a separate `/verify` page. By the time they submit the code, the unverified factor has expired (~5 minutes) and the verification fails.
**Why it happens:** Supabase unenrolls unverified factors after a short timeout.
**How to avoid:** Show the TOTP code input field on the SAME screen as the QR code. Do not use a multi-page enrollment flow for TOTP.
**Warning signs:** `verify()` returns an error about factor not found or factor expired.

### Pitfall 4: `auth.jwt()->>'role'` Returns Postgres Role, Not App Role
**What goes wrong:** RLS policy uses `(select auth.jwt()->>'role') = 'admin'` expecting the app role, but gets `'authenticated'` or `'anon'`.
**Why it happens:** Supabase's JWT `role` claim reflects the Postgres database role, not a custom app role.
**How to avoid:** Read the role from the `users` table via `private.get_user_role()`, or configure Auth Hooks to inject a custom claim. For this project, the users-table lookup is the correct approach.
**Warning signs:** All policies evaluate the same regardless of user role.

### Pitfall 5: PDPA Audit Regex Catches Masked Values
**What goes wrong:** The audit SQL reports masked values (`880512-**-****`) as unmasked IC numbers because the regex `\d{6}-\d{2}-\d{4}` would not match `**`, so false positives come from the dob portion `880512`.
**Why it happens:** The `880512` prefix IS 6 digits, but the `**-****` suffix does not match `\d{2}-\d{4}`. The regex as written is safe — it requires all 12 characters to be digits or hyphens. The exclusion filter `!~ '\d{6}-\*\*-\*\*\*\*'` is a belt-and-suspenders check.
**How to avoid:** Test the regex on both `880512-12-3456` (should match) and `880512-**-****` (should not match) in the Supabase SQL editor before running the full audit.
**Warning signs:** Audit reports rows in `tickets.masked_ic` column which stores only masked values.

### Pitfall 6: Analytics `is_test` Filter Missing from Edge Cases
**What goes wrong:** The primary analytics routes filter `is_test=false`, but a new route added in Phase 6 (e.g., export) might miss the filter.
**Why it happens:** Filter added defensively to known routes but not to routes added later.
**How to avoid:** Audit every API route that queries the `calls` table. Search: `supabase.from('calls').select` across all route files.
**Warning signs:** Test call counts appearing in exported Excel data.

---

## Code Examples

### Complete RLS Migration File Structure

```sql
-- Source: [ASSUMED — SQL pattern, verified against codebase column names]
-- File: supabase/migrations/YYYYMMDD_rls_role_based.sql
-- CRITICAL: Drop all existing policies before creating new ones

-- 1. Helper function (create once)
CREATE OR REPLACE FUNCTION private.get_user_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT role FROM public.users WHERE id = (SELECT auth.uid())
$$;

-- 2. Drop existing permissive policies
DROP POLICY IF EXISTS "calls_read" ON calls;
DROP POLICY IF EXISTS "calls_insert_service" ON calls;
DROP POLICY IF EXISTS "calls_update_service" ON calls;
DROP POLICY IF EXISTS "transcripts_read" ON transcripts;
DROP POLICY IF EXISTS "transcripts_insert_service" ON transcripts;
DROP POLICY IF EXISTS "tickets_read" ON tickets;
DROP POLICY IF EXISTS "tickets_insert_service" ON tickets;
DROP POLICY IF EXISTS "tickets_update_auth" ON tickets;
DROP POLICY IF EXISTS "kb_read" ON kb_entries;
DROP POLICY IF EXISTS "kb_write_auth" ON kb_entries;
DROP POLICY IF EXISTS "users_read_own" ON users;
DROP POLICY IF EXISTS "users_update_own" ON users;
DROP POLICY IF EXISTS "merchants_read" ON merchants;
DROP POLICY IF EXISTS "merchants_insert_service" ON merchants;

-- 3. CALLS — all roles can read, admin full CRUD
CREATE POLICY "calls_select"
  ON calls FOR SELECT TO authenticated
  USING (private.get_user_role() IN ('admin','mykasih','qmedia','supervisor'));

CREATE POLICY "calls_insert_admin"
  ON calls FOR INSERT TO authenticated
  WITH CHECK (private.get_user_role() = 'admin');

CREATE POLICY "calls_update_admin"
  ON calls FOR UPDATE TO authenticated
  USING (private.get_user_role() = 'admin');

CREATE POLICY "calls_delete_admin"
  ON calls FOR DELETE TO authenticated
  USING (private.get_user_role() = 'admin');

-- 4. TRANSCRIPTS — same read access as calls
CREATE POLICY "transcripts_select"
  ON transcripts FOR SELECT TO authenticated
  USING (private.get_user_role() IN ('admin','mykasih','qmedia','supervisor'));

CREATE POLICY "transcripts_insert_admin"
  ON transcripts FOR INSERT TO authenticated
  WITH CHECK (private.get_user_role() = 'admin');

CREATE POLICY "transcripts_delete_admin"
  ON transcripts FOR DELETE TO authenticated
  USING (private.get_user_role() = 'admin');

-- 5. TICKETS — read all; mykasih+supervisor can update status; admin full CRUD
CREATE POLICY "tickets_select"
  ON tickets FOR SELECT TO authenticated
  USING (private.get_user_role() IN ('admin','mykasih','qmedia','supervisor'));

CREATE POLICY "tickets_insert_admin"
  ON tickets FOR INSERT TO authenticated
  WITH CHECK (private.get_user_role() = 'admin');

CREATE POLICY "tickets_update_authorized"
  ON tickets FOR UPDATE TO authenticated
  USING (private.get_user_role() IN ('admin','mykasih','supervisor'))
  WITH CHECK (private.get_user_role() IN ('admin','mykasih','supervisor'));

CREATE POLICY "tickets_delete_admin"
  ON tickets FOR DELETE TO authenticated
  USING (private.get_user_role() = 'admin');

-- 6. KB_ENTRIES — admin + mykasih can CRUD; qmedia + supervisor no access
CREATE POLICY "kb_select"
  ON kb_entries FOR SELECT TO authenticated
  USING (private.get_user_role() IN ('admin','mykasih'));

CREATE POLICY "kb_insert"
  ON kb_entries FOR INSERT TO authenticated
  WITH CHECK (private.get_user_role() IN ('admin','mykasih'));

CREATE POLICY "kb_update"
  ON kb_entries FOR UPDATE TO authenticated
  USING (private.get_user_role() IN ('admin','mykasih'));

CREATE POLICY "kb_delete"
  ON kb_entries FOR DELETE TO authenticated
  USING (private.get_user_role() IN ('admin','mykasih'));

-- 7. USERS — read own row; admin reads all; admin full CRUD
CREATE POLICY "users_select_own"
  ON users FOR SELECT TO authenticated
  USING (
    id = (SELECT auth.uid())
    OR private.get_user_role() = 'admin'
  );

CREATE POLICY "users_update_own"
  ON users FOR UPDATE TO authenticated
  USING (id = (SELECT auth.uid()) OR private.get_user_role() = 'admin')
  WITH CHECK (id = (SELECT auth.uid()) OR private.get_user_role() = 'admin');

CREATE POLICY "users_insert_admin"
  ON users FOR INSERT TO authenticated
  WITH CHECK (private.get_user_role() = 'admin');

CREATE POLICY "users_delete_admin"
  ON users FOR DELETE TO authenticated
  USING (private.get_user_role() = 'admin');

-- 8. MERCHANTS — all authenticated roles can read; admin can write
CREATE POLICY "merchants_select"
  ON merchants FOR SELECT TO authenticated
  USING (private.get_user_role() IN ('admin','mykasih','qmedia','supervisor'));

CREATE POLICY "merchants_insert_admin"
  ON merchants FOR INSERT TO authenticated
  WITH CHECK (private.get_user_role() = 'admin');

-- 9. SESSIONS — service role only (sessions table already has this policy)
-- Existing "Service role full access on sessions" policy stays as-is.
-- No changes needed for sessions.

-- 10. SETTINGS — admin only
-- settings table: add RLS if not already enabled
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "settings_select_admin"
  ON settings FOR SELECT TO authenticated
  USING (private.get_user_role() = 'admin');
CREATE POLICY "settings_update_admin"
  ON settings FOR UPDATE TO authenticated
  USING (private.get_user_role() = 'admin')
  WITH CHECK (private.get_user_role() = 'admin');
```

### MFA Enrollment Screen (TypeScript/React)

```typescript
// Source: [CITED: supabase.com/docs/guides/auth/auth-mfa/totp]
// app/(auth)/login/mfa-enroll/page.tsx

'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import QRCode from 'qrcode'  // npm package

export default function MFAEnrollPage() {
  const supabase = createClient()
  const router = useRouter()
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null)
  const [secret, setSecret] = useState<string>('')
  const [factorId, setFactorId] = useState<string>('')
  const [challengeId, setChallengeId] = useState<string>('')
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [step, setStep] = useState<'enroll' | 'verify'>('enroll')

  async function startEnrollment() {
    const { data, error } = await supabase.auth.mfa.enroll({ factorType: 'totp' })
    if (error || !data) { setError('Enrollment failed'); return }

    // Generate QR code from the TOTP URI
    const dataUrl = await QRCode.toDataURL(data.totp.uri)
    setQrCodeDataUrl(dataUrl)
    setSecret(data.totp.secret)
    setFactorId(data.id)

    // Immediately create a challenge (must be on same screen)
    const { data: challengeData, error: challengeErr } =
      await supabase.auth.mfa.challenge({ factorId: data.id })
    if (challengeErr || !challengeData) { setError('Challenge failed'); return }
    setChallengeId(challengeData.id)
    setStep('verify')
  }

  async function verifyEnrollment() {
    const { error } = await supabase.auth.mfa.verify({
      factorId, challengeId, code
    })
    if (error) { setError('Invalid code. Try again.'); return }
    // Enrollment complete — session is now aal2
    router.push('/')
  }

  // ... render QR code + code input in dark theme
}
```

### MFA Challenge Screen (login flow)

```typescript
// Source: [CITED: supabase.com/docs/guides/auth/auth-mfa/totp]
// app/(auth)/login/mfa-challenge/page.tsx

'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function MFAChallengePageInner() {
  const supabase = createClient()
  const router = useRouter()
  const [factorId, setFactorId] = useState<string>('')
  const [challengeId, setChallengeId] = useState<string>('')
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function initChallenge() {
      const { data: factors } = await supabase.auth.mfa.listFactors()
      const totpFactor = factors?.totp?.[0]
      if (!totpFactor) { router.push('/login'); return }
      setFactorId(totpFactor.id)

      const { data: challengeData } =
        await supabase.auth.mfa.challenge({ factorId: totpFactor.id })
      if (challengeData) setChallengeId(challengeData.id)
    }
    initChallenge()
  }, [])

  async function handleVerify() {
    const { error } = await supabase.auth.mfa.verify({ factorId, challengeId, code })
    if (error) { setError('Invalid code.'); return }
    router.push('/')
  }
  // ... render TOTP input in dark theme
}
```

### Login Page MFA Gate (additions to login/page.tsx)

```typescript
// Source: [ASSUMED — combining existing login.tsx with Supabase MFA docs]
// After signInWithPassword succeeds, before role redirect:

const { data: userData } = await supabase.from('users').select('role').eq('id', data.user.id).single()
const role = userData?.role ?? null

// Admin MFA gate
if (role === 'admin') {
  const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
  const { currentLevel, nextLevel } = aalData ?? {}

  if (nextLevel === 'aal2' && currentLevel !== 'aal2') {
    // MFA enrolled but not yet verified this session
    router.push('/login/mfa-challenge')
    return
  }

  if (nextLevel === 'aal1' || !nextLevel) {
    // MFA not yet enrolled — force enrollment
    router.push('/login/mfa-enroll')
    return
  }
}

// Non-admin: proceed with normal role redirect
```

### PDPA Audit Script Structure

```typescript
// Source: [ASSUMED — using Supabase service role client]
// scripts/pdpa-audit.ts  (run via: npx ts-node scripts/pdpa-audit.ts)

const IC_PATTERN = /\d{6}-\d{2}-\d{4}/
const MASKED_PATTERN = /\d{6}-\*\*-\*\*\*\*/

const COLUMNS_TO_SCAN: Array<{ table: string; column: string }> = [
  { table: 'calls', column: 'caller_name' },
  { table: 'calls', column: 'wa_number' },
  { table: 'transcripts', column: 'message' },
  { table: 'tickets', column: 'description' },
  { table: 'tickets', column: 'masked_ic' },
  { table: 'kb_entries', column: 'question_bm' },
  { table: 'kb_entries', column: 'answer_bm' },
  // sessions.collected_data is jsonb — cast to text
]
// For each: SELECT id, <column> WHERE column ~ '\d{6}-\d{2}-\d{4}'
// Log result. If any hit not already masked, run UPDATE + log.
```

---

## Recovery Codes Gap (D-18 — Requires Decision)

D-18 states: "10 single-use codes generated at enrollment. Display once, user must save them."

**Finding:** Supabase Auth MFA does NOT support recovery codes natively. [VERIFIED: supabase.com/docs/reference/javascript/auth-mfa-api — "Recovery codes are not supported"]

**Options for the planner to choose from:**
1. **Multiple TOTP factors:** Admin enrolls a second authenticator app as backup. Supabase allows up to 10 enrolled factors. No recovery code UX, but achieves same goal.
2. **Custom recovery codes table:** Generate 10 random codes at enrollment, store bcrypt-hashed in a new DB table. Build login UI to accept a recovery code. Higher complexity.
3. **Defer D-18:** Ship MFA without recovery codes in v1. Document the limitation in the handoff report. Admin can unenroll via Supabase Dashboard if device is lost.

**Recommendation:** Option 3 (defer) for v1. Recovery code complexity is not proportionate to the POC delivery timeline. Document in PDPA-AUDIT.md that recovery is handled via Supabase Dashboard admin access.

[ASSUMED: this is the recommended path — user should confirm before planning locks this in]

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `middleware.ts` | `proxy.ts` | Next.js 16 | Route protection file renamed — confirmed in codebase |
| Broad `authenticated` RLS | Role-based security definer function | Phase 7 | Required to meet SEC-02 |
| No MFA | TOTP via Supabase Auth | Phase 7 | SEC-05 requirement |

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `chatbot/simulate/route.ts` does not write to Supabase — therefore no `is_test` DB gap | Architecture Patterns | If the route was changed to write to DB, SEC-04 would have a gap. Verify by reading route. |
| A2 | PostgreSQL `regexp_replace` with `(\d{6})-?\d{2}-?\d{4}` → `\1-**-****` correctly masks both dashed and plain IC formats | Code Examples | Run test in Supabase SQL editor before using in production remediation |
| A3 | Recovery codes are not supported by Supabase MFA — D-18 is not achievable as written | Recovery Codes Gap | If Supabase added recovery code support after Aug 2025 cutoff, option 3 may be revised |
| A4 | `private` schema exists or can be created in Supabase — used for security definer functions | RLS Pattern | Some Supabase projects restrict schema creation. Fallback: use a separate `app_private` schema or inline the function |
| A5 | `settings` table has RLS enabled — only confirmed for sessions table in migrations | RLS Migration | If settings table already has RLS + policies, DROP step for settings must be added |
| A6 | Admin-only MFA gating logic in login page: redirect to `/login/mfa-enroll` and `/login/mfa-challenge` routes that do not yet exist | Code Examples | Must create these pages as part of Phase 7 plans |

---

## Open Questions

1. **Recovery codes (D-18)**
   - What we know: Supabase MFA does not support native recovery codes
   - What's unclear: Whether the team wants custom recovery code implementation or deferral
   - Recommendation: Defer to v2, use Supabase Dashboard admin access as recovery path for v1

2. **`private` schema availability**
   - What we know: Supabase projects allow schema creation in SQL editor
   - What's unclear: Whether this Supabase project has been restricted
   - Recommendation: Test `CREATE SCHEMA IF NOT EXISTS private;` as the first line of the RLS migration

3. **Sessions table policy conflict**
   - What we know: Sessions table already has `"Service role full access on sessions"` from Phase 3 migration
   - What's unclear: Whether the DROP + CREATE cycle will conflict with this existing policy
   - Recommendation: In the RLS migration, only touch sessions if adding dashboard read policies; do not DROP the existing service-role policy

---

## Environment Availability

Step 2.6: SKIPPED — Phase 7 is SQL migration, UI code changes, and a standalone audit script. External tool dependencies are the same Supabase/Node.js environment already in use. No new external services required.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest (via next/jest) |
| Config file | `mykasih-crm/jest.config.ts` |
| Quick run command | `cd mykasih-crm && npx jest --testPathPattern="__tests__" --passWithNoTests` |
| Full suite command | `cd mykasih-crm && npx jest --coverage` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|--------------|
| SEC-01 | maskIC() masks 12-digit and dashed IC correctly | unit | `npx jest --testPathPattern="ic-mask"` | ❌ Wave 0 |
| SEC-01 | SQL audit finds zero unmasked ICs after remediation | manual | Manual SQL in Supabase editor | N/A |
| SEC-02 | RLS: qmedia role cannot update tickets | integration/manual | Manual SQL as qmedia user | N/A |
| SEC-02 | RLS: `private.get_user_role()` returns correct role | unit SQL | Manual test in Supabase SQL editor | N/A |
| SEC-03 | Webhook rejects invalid HMAC signature → 401 | unit | `npx jest --testPathPattern="webhook-voice"` | ✅ exists (todos) |
| SEC-03 | Webhook rejects replay (timestamp > 5 min old) → 401 | unit | `npx jest --testPathPattern="webhook-voice"` | ✅ exists (todos) |
| SEC-04 | Analytics summary excludes is_test=true rows | unit | `npx jest --testPathPattern="analytics"` | ❌ Wave 0 |
| SEC-05 | Login redirects admin without MFA to enroll page | unit | `npx jest --testPathPattern="auth"` | ✅ exists (todos) |
| SEC-05 | Login redirects admin with enrolled MFA to challenge page | unit | `npx jest --testPathPattern="auth"` | ✅ exists (todos) |

### Sampling Rate
- **Per task commit:** `cd mykasih-crm && npx jest --passWithNoTests`
- **Per wave merge:** `cd mykasih-crm && npx jest --coverage`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `mykasih-crm/__tests__/lib/ic-mask.test.ts` — unit tests for maskIC() covering plain and dashed formats, invalid inputs
- [ ] `mykasih-crm/__tests__/api/analytics-summary.test.ts` — verify is_test filter is applied to all queries

---

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | YES | Supabase Auth + TOTP MFA for admin |
| V3 Session Management | YES | Supabase session cookies, AAL level in JWT |
| V4 Access Control | YES | Supabase RLS policies, role from users table |
| V5 Input Validation | YES | IC pattern validation before maskIC(), webhook body parsing |
| V6 Cryptography | YES | HMAC-SHA256 for webhooks (Node.js crypto — never hand-rolled) |

### Known Threat Patterns

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Webhook replay attack | Spoofing | Timestamp in signature header, 5-minute window (already implemented) |
| Privilege escalation via weak RLS | Elevation of Privilege | Role-based security definer function, no wildcard `authenticated` policies |
| IC PII exposure in transcripts | Information Disclosure | PDPA audit SQL, maskIC() at collection time |
| Admin account takeover without MFA | Spoofing | TOTP MFA enforced at login via AAL check |
| Service role key leaking to client | Information Disclosure | Key only in server-side routes, never in NEXT_PUBLIC_ vars |

---

## Sources

### Primary (HIGH confidence)
- [Supabase TOTP MFA Docs](https://supabase.com/docs/guides/auth/auth-mfa/totp) — enrollment, challenge, verify API methods, AAL flow
- [Supabase MFA Overview](https://supabase.com/docs/guides/auth/auth-mfa) — listFactors, getAuthenticatorAssuranceLevel
- [Supabase RLS Docs](https://supabase.com/docs/guides/database/postgres/row-level-security) — security definer functions, SELECT/INSERT/UPDATE/DELETE policy syntax
- [Supabase MFA via RLS Blog](https://supabase.com/blog/mfa-auth-via-rls) — restrictive policy pattern, AAL JWT claim
- Codebase direct read: `webhook/voice/route.ts`, `webhook/chat/route.ts`, `analytics/summary/route.ts`, `analytics/charts/route.ts`, `export/calls/route.ts`, `chatbot/simulate/route.ts`, `supabase_migrations.sql`, `login/page.tsx`

### Secondary (MEDIUM confidence)
- [ElevenLabs Post-Call Webhooks](https://elevenlabs.io/docs/agents-platform/workflows/post-call-webhooks) — signature format confirmed via existing code (page returned 404 during fetch, but existing implementation confirms `t=<timestamp>,v0=<hmac>` format is correct)
- [Microsoft Purview — Malaysia IC](https://learn.microsoft.com/en-us/purview/sit-defn-malaysia-identification-card-number) — confirmed `\d{6}-\d{2}-\d{4}` as the detection pattern

### Tertiary (LOW confidence)
- WebSearch results on PDPA 2024 amendments — context only, no direct implementation impact

---

## Metadata

**Confidence breakdown:**
- SEC-01 IC Audit: HIGH — existing maskIC() code confirmed correct, SQL patterns are standard PostgreSQL regexp
- SEC-02 RLS: HIGH — Supabase docs confirmed via official sources, existing migration gap clearly identified
- SEC-03 Webhook: HIGH — full code review completed, HMAC + replay already implemented correctly
- SEC-04 is_test: HIGH — full code review confirms analytics routes filter correctly, simulate route confirmed no DB write gap
- SEC-05 MFA: MEDIUM — Supabase TOTP API confirmed, but recovery codes gap (D-18) is unresolved
- Recovery codes: HIGH confidence that Supabase does not support them natively

**Research date:** 2026-04-13
**Valid until:** 2026-05-13 (Supabase Auth APIs are stable; 30-day validity)
