---
plan: 01-07
phase: 01-scaffold-db-auth-dashboard-shell
status: complete
completed: 2026-04-11
commit: cb90de1
---

## What Was Built

Demo seed data system — API endpoint to populate Supabase with realistic SARA demo data, plus Supabase schema migration documentation.

## Key Files Created

- `mykasih-crm/app/api/seed/data/route.ts` — POST endpoint (admin-only, idempotent) that inserts: ~120 calls with DEMO_ prefix and is_test=true, 5-8 transcript turns per call, ~15 tickets (TKT-2026-NNNNN format), 5 hardcoded KB entries (BM+EN), 4 test users (admin/mykasih/qmedia/supervisor roles)
- `supabase_migrations.sql` — SQL migration creating all 6 tables with indexes and RLS (pre-existing at project root)

## Human Checkpoint Completed

- ✓ Supabase migrations run — all 6 tables exist with RLS
- ✓ .env.local filled with Supabase credentials
- ✓ 4 auth users created in Supabase Auth dashboard
- ✓ POST /api/seed/data triggered — demo data inserted
- ✓ Dashboard verified — stat cards, charts, and recent interactions show populated data

## Self-Check: PASSED

- ✓ route.ts exports POST handler
- ✓ Admin role check + idempotency guard (409 if DEMO_ rows exist)
- ✓ All calls use DEMO_ prefix and is_test=true
- ✓ All 6 categories distributed across calls
- ✓ All 4 outcomes distributed across calls
- ✓ KB_SEED_DATA hardcoded (5 Q&A pairs) — does NOT reference kb_*.txt files
- ✓ Tickets use TKT-2026-NNNNN format with masked_ic
- ✓ Uses SUPABASE_SERVICE_ROLE_KEY (bypasses RLS for bulk insert)
- ✓ INFRA-07 detection: if tables don't exist, returns 500 "relation does not exist"

## Deviations

icPrefix leading zero for 001230 was adjusted by linter to 1230 — no functional impact on masked_ic display.
