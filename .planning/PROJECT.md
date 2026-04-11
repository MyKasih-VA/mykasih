# MyKasih Command Centre

## What This Is

MyKasih Command Centre is an AI-powered helpline CRM built by Iceberg AI Solutions for MyKasih Foundation, serving the SARA (Sumbangan Asas Rahmah) program that provides RM100 cashless credit to 23+ million eligible Malaysian citizens. It integrates three systems — a SARA Voice Agent (ElevenLabs), a Kasih WhatsApp Chatbot (n8n + Claude API), and a Next.js admin dashboard — all sharing one Supabase database, enabling 24/7 bilingual (BM/EN) beneficiary support and unified CRM visibility for internal staff.

## Core Value

Beneficiaries can get SARA help (eligibility, balance, merchant lookup, complaints) at any hour via voice or WhatsApp, and every interaction is captured, ticketed, and visible to MyKasih staff in real time.

## Requirements

### Validated

- ✓ ElevenLabs SARA voice agent live — existing (needs 2 prompt fixes)
- ✓ Anam AI persona ready — agent ID 32d94abf-9bfd-45c4-8076-b1ea6ef9e229
- ✓ 10,194 merchant outlets dataset available — merchants.json at project root
- ✓ Supabase project created — Singapore region (ap-southeast-1)
- ✓ GitHub repo created
- ✓ Vercel project created
- ✓ n8n Cloud Pro ready (10K executions/month)

### Active

**System 1 — SARA Voice Agent (ElevenLabs) — P0 Fixes**
- [ ] Fix non-transferability guardrail in agent prompt (cannot use another person's MyKad)
- [ ] Fix language switch logic (maintain EN once switched, never revert to BM)

**System 2 — Kasih WhatsApp Chatbot — P1**
- [ ] Intent classification via Claude API (faq | balance_check | merchant_lookup | complaint | unknown)
- [ ] FAQ handler — query kb_entries, BM/EN response
- [ ] Balance check handler — IC collection → IC masking → mock API response with nearest merchant
- [ ] Merchant lookup handler — state/city/postcode → query merchants table → top 3-5 results
- [ ] Complaint handler — multi-turn → ticket creation with reference number
- [ ] Quick reply buttons on first contact (Semak baki / Kedai berdekatan / Bantuan SARA / Status aduan)
- [ ] Save all chats to Supabase (channel='chat', calls + transcripts tables)
- [ ] Meta Cloud API webhook integration (GET verify + POST receive)

**System 3 — MyKasih Command Centre Dashboard — P1**
- [ ] Project scaffold — Next.js 14, TypeScript, Tailwind, Shadcn UI dark theme
- [ ] globals.css — all 12 CSS color variables + Inter font
- [ ] Supabase client/server setup + middleware (route protection, role-based redirect)
- [ ] Merchant seed API — POST /api/seed/merchants → bulk insert 10,194 rows
- [ ] lib/merchant-lookup.ts — lookupByPostcode() + lookupByState()
- [ ] Login page — dark card, MyKasih logo, Supabase Auth, role redirect
- [ ] Dashboard layout — sidebar (260px, all 14 nav items) + topbar (search, lang toggle, bell)
- [ ] Dashboard home — 4 stat cards + stacked bar chart + donut chart + recent interactions table
- [ ] Voice Calls page — filterable table, transcript modal, Excel export
- [ ] Chat Messages page — WA thread view, intent badge, linked ticket
- [ ] All Interactions page — combined table with channel toggle filter
- [ ] Tickets page — kanban (open/in-progress/resolved), reference no, masked IC
- [ ] Beneficiaries page — WA number lookup, interaction + ticket history
- [ ] Live Monitor page — active ElevenLabs sessions, active WA chats, auto-refresh
- [ ] Analytics page — period selector, 4 charts, category breakdown, Excel export
- [ ] Knowledge Base page — CRUD, BM/EN toggle, active switch, sync to ElevenLabs
- [ ] Staff Management page — add/edit/remove users, role select
- [ ] Integrations page — 5 status cards (ElevenLabs, Meta WA, n8n, Supabase, Anam AI)
- [ ] Testing Console — 3 tabs: Voice Agent embed + Kasih chatbot sim + Anam AI persona
- [ ] AI Demo page — standalone Anam AI persona embed (client-facing)
- [ ] Settings page — agent hours, webhook URLs, notification prefs
- [ ] EN/BM language toggle — useLanguage() hook, translations.ts, persisted to users.language
- [ ] ElevenLabs voice webhook — POST /api/webhook/voice → calls + transcripts + ticket if complaint
- [ ] IC masking — lib/ic-mask.ts → maskIC() before any DB write
- [ ] Ticket reference generator — lib/ticket-ref.ts → TKT-2026-NNNNN
- [ ] Excel export — /api/export/calls → 3-sheet xlsx (calls, tickets, summary)
- [ ] PDPA compliance — zero plain-text ICs, RLS on all tables, webhook secret validation

### Out of Scope

- Live MyKasih backend API for balance check — mock API used in POC; real integration Phase 2
- Warm transfer to live agents — requires SIP/PSTN; Phase 2
- WhatsApp rich media (buttons/maps/PDFs) — Phase 2
- Multi-language beyond BM/EN — not in scope
- Mobile app — web-first, mobile later
- Real-time chat — high complexity, not core to community value

## Context

- **Program:** SARA Untuk Semua — RM100 one-off cashless credit to all Malaysian citizens 18+, loaded to MyKad. Valid Feb 9 – Dec 31, 2026. 10,194+ merchant outlets nationwide.
- **Beneficiary personas:** Warga Emas (60+, rural, voice in BM), Ibu Tunggal (quick WA balance check), Belia B40 (FAQ + merchant lookup), OKU/Pesakit (eligibility + complaints)
- **Channel rule:** voice = 📞 duration | chat = 💬 message count — always distinguish, always show channel badge
- **Meta WA API:** Approval pending 3–7 days (Session 1–2 can proceed without it)
- **Security:** IC numbers must be masked (880512-**-****) before any DB write; RLS on all 6 tables; is_test=true on all Testing Console calls
- **Client:** Built by Iceberg AI Solutions (Navien + Avvie) for MyKasih Foundation | April 2026 | CONFIDENTIAL

## Constraints

- **Tech Stack:** Next.js 14, TypeScript strict (no `any`), Tailwind + Shadcn UI dark, Supabase Pro Singapore, Vercel Pro — locked
- **Colors:** All from CSS variables — never hardcode hex values
- **PDPA:** Zero plain-text IC numbers anywhere in DB; masked_ic format: 880512-**-****
- **Timeline:** 4-week delivery — Phase 0 (today) → Week 1 → Week 2 → Week 3 → Week 4 UAT
- **Meta WA:** API approval pending; chatbot integration blocked until approved (stub can be built)
- **Budget:** ElevenLabs Scale plan ($330/mo), n8n Cloud Pro (10K exec/mo)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Supabase over custom DB | Managed auth + RLS + realtime + storage in one; Singapore region for low latency | — Pending |
| n8n as orchestration layer | Low-code WA → Claude → Supabase pipeline without custom server | — Pending |
| Mock balance API for POC | Real MyKasih API integration is out of scope; mock validates UX and flow | — Pending |
| Single Supabase project for all 3 systems | Unified reporting; no cross-system API calls needed | — Pending |
| ElevenLabs ConvAI for voice | Already live; WebRTC lower latency than WebSocket for voice | ✓ Good |
| Anam AI for demo persona | Confirmed agent ID — embed in Testing Console + standalone demo page | ✓ Good |
| Meta Cloud API direct (no BSP) | Inbound messages free; no intermediary cost | — Pending |
| merchants table in Supabase | 10,194 rows with postcode + state indexes; enables real-time lookup | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-04-11 after initialization*
