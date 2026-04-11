# Phase 1: Scaffold, DB, Auth & Dashboard Shell — Context

**Gathered:** 2026-04-11
**Status:** Ready for planning

<domain>
## Phase Boundary

Deliver a working dark-themed dashboard shell: login page → role-based redirect → sidebar + topbar + dashboard home with stat cards and charts. Also fix two live bugs on the SARA ElevenLabs voice agent (non-transferability guardrail and language lock). Merchant data seeded to Supabase. All infrastructure wired: Supabase schema, auth middleware, lib utilities.

This phase does NOT include: voice webhook processing (Phase 2), chatbot logic (Phase 3), or any dashboard data pages beyond the home (Phase 4).
</domain>

<decisions>
## Implementation Decisions

### SARA Voice Agent — AGENT-01 (Non-Transferability)

- **D-01:** Hard block + soft redirect. Zero wiggle room on the refusal. No escalation path to human agent for transferability requests — this is a program rule with no exceptions.
- **D-02:** Use the exact scripted response block below. SARA must not improvise this reply:

  **BM:** "Maaf, baki SARA pada MyKad anda adalah peribadi dan tidak boleh dipindahkan atau diwakilkan kepada sesiapa. Setiap individu mesti menggunakan MyKad sendiri semasa membuat pembelian di kaunter."

  **EN:** "I'm sorry, the SARA credit on your MyKad is personal and cannot be transferred or used by anyone else. Each person must use their own MyKad at the counter."

  **Then add (both languages):** Redirect caller to check their family member's own eligibility at sara.gov.my or call back with their own MyKad.

- **D-03:** Trigger conditions — any of: using MyKad for someone else, using someone else's MyKad, sending balance to family member, using a representative (wakil), or any variation of sharing/transferring SARA credit.

### SARA Voice Agent — AGENT-02 (Language Lock)

- **D-04:** Lock on ANY English request — no confirmation step. The moment a caller says anything equivalent to requesting English (e.g. "English please", "boleh cakap English?", "in English"), SARA immediately switches and locks. Response: "Sure, I'll continue in English."
- **D-05:** The root cause of the bug is "Match the caller's language" — this mirrors current input and causes reversion. Replace with the explicit lock rules below.
- **D-06:** Full language rules to replace existing tone section:
  - Session start: detect opening language, respond in kind. Default BM if unclear.
  - English lock: any English request → switch immediately → lock for full session → do NOT revert even if caller speaks BM.
  - BM lock: explicit BM request after English session → switch and lock to BM. Same rule applies.
  - NEVER alternate languages within a single response.

### Next.js Version

- **D-07:** Keep the installed version (package.json shows `16.2.3`). Do NOT downgrade to v14 as written in earlier spec docs — that spec was written before the install. 16.x is fully App Router compatible with better cold start performance.
- **D-08:** Update CLAUDE.md and any spec references from "Next.js 14" → "Next.js 15/16 (App Router, TypeScript strict)".
- **D-09:** Avoid the `<Form>` component introduced in v15+ — use standard `<form>` or Shadcn's Form component instead to stay safe.

### Dashboard Initial Data

- **D-10:** Seed realistic mock data into Supabase — NOT hardcoded in the frontend. The demo to the client is the make-or-break moment; zero-count stat cards undermine confidence regardless of UI polish.
- **D-11:** Seed volumes:
  - `calls`: ~120 rows — mix of voice/chat, all 6 categories, spread across last 30 days
  - `transcripts`: ~5–8 turns per call
  - `tickets`: ~15 rows — open/in-progress/resolved mix
  - `kb_entries`: full FAQ content from the 4 KB files at project root (kb_sara_faq_en.txt, kb_sara_faq_bm.txt, kb_quick_reference.txt, kb_merchant_directory.txt)
- **D-12:** All seed rows must use `caller_name LIKE 'DEMO_%'` convention so they can be flushed cleanly before go-live with `DELETE FROM calls WHERE is_test=true AND caller_name LIKE 'DEMO_%'`.

### Merchant Seed Endpoint

- **D-13:** `POST /api/seed/merchants` — admin-only API endpoint with idempotency guard.
- **D-14:** Four guards required:
  1. Admin role only — validate Supabase JWT
  2. Idempotency — if `merchants.count > 0`, return `409 { error: "Already seeded", count: N }`
  3. Batch insert in chunks of 500 (avoid Supabase payload limits)
  4. Return `{ inserted: N, skipped: 0, duration_ms: N }`
- **D-15:** Expose a "Seed Merchants" button on the Integrations page — admin-only, visible only when `merchants.count === 0`. After successful seed, button disappears and shows "✅ 10,194 outlets loaded."

### Claude's Discretion

- Exact skeleton/loading state design for stat cards and tables
- Specific Supabase RLS policy syntax (must enforce correct role access)
- Seed SQL file format (inline migration or separate seed.sql)
- Exact Recharts chart config for stacked bar and donut
</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Design System & Brand
- `CLAUDE.md` — Color tokens (12 CSS vars), typography, brand, full navigation structure (all 14 items, 5 sections), component standards, env vars
- `mykasih-crm/app/globals.css` — Current state (needs full rewrite with custom CSS vars + Inter font)

### Requirements
- `.planning/REQUIREMENTS.md` — All Phase 1 requirements: AGENT-01, AGENT-02, INFRA-01–08, AUTH-01–04, MERCH-01–03, DASH-01–09
- `.planning/ROADMAP.md` §Phase 1 — Success criteria (5 items that must be TRUE)

### Database Schema
- `supabase_migrations.sql` — Full schema for all 6 tables with indexes. Run in Supabase SQL Editor top-to-bottom before any API work.

### SARA Knowledge Base (for voice agent prompt fixes)
- `kb_sara_faq_en.txt` — Full English FAQ (Q18 = non-transferability ruling)
- `kb_sara_faq_bm.txt` — Full BM FAQ
- `kb_quick_reference.txt` — Key dates, amounts, 15 approved categories, merchant chains
- `kb_merchant_directory.txt` — Merchant directory content

### Existing Scaffold
- `mykasih-crm/package.json` — Installed deps (Next.js 16.2.3, all Shadcn/Radix/Recharts packages present)
- `mykasih-crm/components.json` — Shadcn config
- `mykasih-crm/app/layout.tsx` — Root layout (needs Inter font swap from Geist)

### Session Plan
- `SESSIONS.md` — Detailed step-by-step implementation prompts for Session 1 (reference for task breakdown)

No external specs beyond these — all requirements captured in decisions above and REQUIREMENTS.md.
</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `mykasih-crm/components/ui/` — Shadcn UI components already installed (Button, Input, Card, Dialog, Select, Tabs, Switch, Avatar, etc.) — use directly, do not reinstall
- `mykasih-crm/node_modules/recharts` — Recharts installed and ready for bar/donut charts
- `mykasih-crm/node_modules/lucide-react` — All icons available (LayoutDashboard, Phone, MessageSquare, Activity, Ticket, Users, Radio, BarChart2, BookOpen, UserCog, Plug, FlaskConical, Sparkles, Settings)
- `merchants.json` at project root — 10,194 outlet rows ready to read and bulk-insert
- `supabase_migrations.sql` at project root — schema ready, just needs to be run in Supabase SQL Editor

### Established Patterns
- App Router only — no Pages Router. All routes use `app/` directory with `page.tsx` / `layout.tsx`.
- No `src/` directory — files live at `mykasih-crm/app/`, `mykasih-crm/components/`, `mykasih-crm/lib/`
- TypeScript strict mode — `tsconfig.json` already configured
- Tailwind CSS 4 (`@import "tailwindcss"` syntax in globals.css) — NOT Tailwind 3 syntax

### Integration Points
- `globals.css` — needs full rewrite: add 12 CSS color vars, swap Geist → Inter, keep Tailwind import
- `app/layout.tsx` — swap `next/font/google` import from Geist to Inter
- `middleware.ts` — create at `mykasih-crm/middleware.ts` (does not exist yet)
- `lib/supabase/` — create `client.ts` and `server.ts` (does not exist yet)
- Dashboard layout wrapper at `app/(dashboard)/layout.tsx` — does not exist yet

### Version Notes
- Next.js 16.2.3 is installed. Avoid `<Form>` component (v15+ feature with breaking edge cases) — use standard `<form>` or Shadcn Form.
- `@supabase/ssr` v0.10.2 is installed — use `createBrowserClient` / `createServerClient` from this package (NOT deprecated `auth-helpers-nextjs`)
</code_context>

<specifics>
## Specific Ideas

- SARA non-transferability: "DO NOT offer any workaround, exception, or escalation path for this request. DO NOT transfer to a human agent for transferability requests — this is a program rule with no exceptions."
- SARA language lock: Root cause was "Match the caller's language" instruction — this must be fully replaced, not amended.
- Merchant seed button: disappears after seeding, replaced with "✅ 10,194 outlets loaded" — no re-seed allowed unless DB is manually cleared.
- Demo data cleanup script: `DELETE FROM calls WHERE is_test=true AND caller_name LIKE 'DEMO_%'` — must be documented in SESSIONS.md for pre-go-live checklist.
- The client demo is the make-or-break moment for Phase 2 scope and budget — this is the primary reason for Supabase-seeded mock data over empty state.
</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within Phase 1 scope.
</deferred>

---

*Phase: 01-scaffold-db-auth-dashboard-shell*
*Context gathered: 2026-04-11*
