# Phase 1: Scaffold, DB, Auth & Dashboard Shell — Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-11
**Phase:** 01-scaffold-db-auth-dashboard-shell
**Areas discussed:** SARA prompt fixes, Next.js version, Dashboard initial data, Merchant seed trigger

---

## SARA Voice Agent — Non-Transferability (AGENT-01)

| Option | Description | Selected |
|--------|-------------|----------|
| Hard block | Refuse clearly, no workaround, specific scripted response | ✓ |
| Soft redirect only | Explain not transferable, redirect to eligibility check | (merged into selected) |
| Agent's own wording | Let agent improvise | |

**User's choice:** Hard block + soft redirect. Scripted response verbatim (BM + EN), then redirect to sara.gov.my / call back with own MyKad. No escalation path. No improvisation allowed.

**Notes:** Root cause identified — existing guardrail had the rule but no scripted response, causing agent to improvise and potentially soften the refusal. Q18 of the Ministry FAQ is the authoritative source: "No. SARA for All is specifically for the individual concerned."

---

## SARA Voice Agent — Language Lock (AGENT-02)

| Option | Description | Selected |
|--------|-------------|----------|
| Any English request — lock immediately | Switch + lock on any equivalent request, no confirmation | ✓ |
| Confirmed switch only | SARA asks "Switching to English now?" before locking | |
| Flag it (custom wording) | User provides exact behaviour | |

**User's choice:** Lock on any English request, no confirmation step.

**Notes:** Root cause identified — "Match the caller's language" instruction mirrors current input, causing reversion when caller drops back to BM. The confirmed-switch option was rejected because "if SARA asks 'Switching to English now?' and the caller responds 'Ya' (BM), you're back to the same problem." Full language rules block provided by user to replace existing tone section entirely.

---

## Next.js Version

| Option | Description | Selected |
|--------|-------------|----------|
| Keep 16.2.3 | Stay on installed version, update spec docs | ✓ |
| Downgrade to v14 | Match original spec | |

**User's choice:** Keep 16.2.3. Update CLAUDE.md spec from "Next.js 14" to "Next.js 15/16".

**Notes:** Spec was written before the install. 16.x has better performance (next/after, faster cold starts). All dependencies (Shadcn, Supabase, Vercel) support it. User note: avoid `<Form>` component in v15+ — use standard `<form>` or Shadcn Form.

---

## Dashboard Initial Data Strategy

| Option | Description | Selected |
|--------|-------------|----------|
| Seed Supabase with mock data | Realistic rows in DB, proves full pipeline | ✓ |
| Show live empty state (0 counts) | Honest but underwhelming for demo | |
| Hardcode in frontend | Fast but proves nothing | |

**User's choice:** Seed realistic mock data into Supabase (~120 calls, ~15 tickets, full KB entries). Not hardcoded.

**Notes:** "The client demo is the make-or-break moment for Phase 2 scope and budget." All demo rows use `caller_name LIKE 'DEMO_%'` convention for clean flush before go-live.

---

## Merchant Seed Trigger

| Option | Description | Selected |
|--------|-------------|----------|
| Admin-only API endpoint with idempotency | POST /api/seed/merchants, guarded, batch 500 | ✓ |
| CLI/script | Doesn't work cleanly on Vercel serverless | |

**User's choice:** `POST /api/seed/merchants` with 4 guards (JWT admin check, idempotency 409, batch 500, response shape). Button on Integrations page that disappears after seeding.

**Notes:** CLI scripts rejected due to Vercel serverless environment. Idempotency guard prevents accidental double-seeding.

---

## Claude's Discretion

- Exact skeleton/loading state design
- Supabase RLS policy syntax
- Seed SQL file format
- Recharts chart configuration details
