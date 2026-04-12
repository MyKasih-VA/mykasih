# Phase 7: UAT Fixes, PDPA Audit & Final QA - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-13
**Phase:** 07-uat-fixes-pdpa-audit-final-qa
**Areas discussed:** PDPA IC audit scope, RLS policy design, Webhook hardening, MFA enforcement

---

## PDPA IC Audit Scope

| Option | Description | Selected |
|--------|-------------|----------|
| DB + codebase scan | Query all Supabase text/jsonb columns AND grep codebase for hardcoded ICs. Auto-fix violations. | |
| DB-only scan | Only scan Supabase tables. Trust codebase is clean. | |
| Full audit + report | DB + codebase scan + produce PDPA-AUDIT.md compliance report for handoff | ✓ |

**User's choice:** Claude recommendation — DB + codebase scan with auto-masking AND compliance report (combined best of options 1 and 3)
**Notes:** User delegated all decisions to Claude's recommended defaults.

### IC Violation Handling

| Option | Description | Selected |
|--------|-------------|----------|
| Auto-mask in place | Run UPDATE with maskIC() pattern, log changes | ✓ |
| Report only | Flag but don't fix | |
| Auto-mask + alert | Fix + notify staff | |

**User's choice:** Auto-mask in place (recommended default)

---

## RLS Policy Design

**User's choice:** Claude recommendation — full role-based RLS matrix with admin=full, mykasih=operational, qmedia=read-only, supervisor=read+update-tickets. Service role key bypasses RLS for webhook/API routes.
**Notes:** Access matrix designed based on existing role definitions in CLAUDE.md.

---

## Webhook Hardening

**User's choice:** Claude recommendation — verify existing HMAC/secret checks work correctly, add replay protection if ElevenLabs supports timestamps, keep dev mode flexible.
**Notes:** No IP allowlisting or rate limiting for v1.

---

## MFA Enforcement

**User's choice:** Claude recommendation — Supabase Auth TOTP for admin role only, enrollment redirect on first admin login, 10 recovery codes, non-admin roles exempt.
**Notes:** Configuration via Supabase Dashboard; code changes limited to login flow UI.

---

## Claude's Discretion

- RLS policy SQL syntax
- IC audit regex specifics
- MFA enrollment page design
- PDPA-AUDIT.md format
- Replay protection feasibility

## Deferred Ideas

- is_test toggle on analytics UI (backlog)
- IP allowlisting (v2)
- Rate limiting (v2)
