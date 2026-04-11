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

**System 1 — SARA Voice Agent (ElevenLabs) — P0 Fixes** ✅ Phase 1
- [x] Fix non-transferability guardrail in agent prompt (cannot use another person's MyKad)
- [x] Fix language switch logic (maintain EN once switched, never revert to BM)

**System 2 — Kasih WhatsApp Chatbot — P1** ✅ Phase 3
- [x] Intent classification via Claude Haiku 4.5 (faq | balance_check | merchant_lookup | complaint | unknown) + auto language detect
- [x] FAQ handler — query kb_entries, BM/EN response
- [x] Balance check handler — IC collection → IC masking → mock API response with nearest merchant
- [x] Merchant lookup handler — state/city/postcode → query merchants table → top 3-5 results
- [x] Complaint handler — multi-turn (sessions table) → ticket creation with reference number
- [x] Quick reply buttons on first contact (Semak baki / Kedai berdekatan / Bantuan SARA / Status aduan)
- [x] Save all chats to Supabase (channel='chat', calls + transcripts tables)
- [x] Meta Cloud API webhook integration (GET verify + POST receive) — stub until WA API approved
- [x] sessions table (Supabase) — wa_phone, intent, step, collected_data jsonb, language, expires_at
- [x] lib/meta-wa.ts — sendWhatsAppMessage() + sendWhatsAppButtons()
- [ ] n8n orchestration: WA → n8n → /api/chatbot/message → Claude → Supabase → n8n → WA reply (pending Meta WA approval)
- [ ] n8n webhook URL configurable from /integrations page

**System 3 — MyKasih Command Centre Dashboard — P1**
- [x] Project scaffold — Next.js 15/16, TypeScript, Tailwind, Shadcn UI dark theme ✅ Phase 1
- [x] globals.css — all 12 CSS color variables + Inter font ✅ Phase 1
- [x] Supabase client/server setup + middleware (route protection, role-based redirect) ✅ Phase 1
- [x] Merchant seed API — POST /api/seed/merchants → bulk insert 10,194 rows ✅ Phase 1
- [x] lib/merchant-lookup.ts — lookupByPostcode() + lookupByState() ✅ Phase 1
- [x] Login page — dark card, MyKasih logo, Supabase Auth, role redirect ✅ Phase 1
- [x] Dashboard layout — sidebar (260px, all 14 nav items) + topbar (search, lang toggle, bell) ✅ Phase 1
- [x] Dashboard home — 4 stat cards + stacked bar chart + donut chart + recent interactions table ✅ Phase 1
- [ ] Voice Calls page — filterable table, transcript modal, Excel export
- [ ] Chat Messages page — WA thread view, intent badge, linked ticket
- [ ] All Interactions page — combined table with channel toggle filter
- [ ] Tickets page — kanban (open/in-progress/resolved), reference no, masked IC
- [ ] Beneficiaries page — WA number lookup, interaction + ticket history
- [ ] Live Monitor page — active ElevenLabs sessions, active WA chats, auto-refresh
- [ ] Analytics page — period selector, 4 charts, category breakdown, Excel export
- [ ] Knowledge Base page — CRUD, BM/EN toggle, active switch, sync to ElevenLabs
- [ ] Staff Management page — add/edit/remove users, role select
- [x] Integrations page stub — 5 status cards (ElevenLabs, Meta WA, n8n, Supabase, Anam AI) ✅ Phase 1
- [ ] Testing Console — 3 tabs: Voice Agent embed + Kasih chatbot sim + Anam AI persona
- [ ] AI Demo page — standalone Anam AI persona embed (client-facing)
- [ ] Settings page — agent hours, webhook URLs, notification prefs
- [x] EN/BM language toggle — useLanguage() hook, translations.ts, persisted to users.language ✅ Phase 1
- [x] ElevenLabs voice webhook — POST /api/webhook/voice → calls + transcripts + ticket if complaint ✅ Phase 2
- [x] IC masking — lib/ic-mask.ts → maskIC() before any DB write ✅ Phase 2
- [x] Ticket reference generator — lib/ticket-ref.ts → TKT-2026-NNNNN ✅ Phase 2
- [x] Excel export — /api/export/calls → 3-sheet xlsx (calls, tickets, summary) ✅ Phase 2
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
| Supabase over custom DB | Managed auth + RLS + realtime + storage in one; Singapore region for low latency | ✓ Good (Phase 1) |
| n8n as orchestration layer | Low-code WA → Claude → Supabase pipeline without custom server | ✓ Confirmed (Phase 3) |
| Mock balance API for POC | Real MyKasih API integration is out of scope; mock validates UX and flow | ✓ Confirmed (Phase 3) |
| Single Supabase project for all 3 systems | Unified reporting; no cross-system API calls needed | ✓ Good (Phase 1) |
| ElevenLabs ConvAI for voice | Already live; WebRTC lower latency than WebSocket for voice | ✓ Good (Phase 1) |
| Anam AI for demo persona | Confirmed agent ID — embed in Testing Console + standalone demo page | ✓ Good |
| Meta Cloud API direct (no BSP) | Inbound messages free; no intermediary cost | ✓ Confirmed (Phase 3) |
| merchants table in Supabase | 10,194 rows with postcode + state indexes; enables real-time lookup | ✓ Good (Phase 1) |
| Claude Haiku 4.5 for intent classification | Fast (~$0.001/msg) and sufficient for intent + language detection; Sonnet reserved for complex reasoning | ✓ Confirmed (Phase 3) |
| Supabase sessions table for conversation state | Persistent, auditable, survives restarts; fits Supabase-first pattern from Phase 1–2 | ✓ Confirmed (Phase 3) |
| Auto language detection per message | Haiku detects BM/EN on first message; language locked to session for entire thread | ✓ Confirmed (Phase 3) |
| Meta WA approval pending — build stubs first | API approval 3–7 days; build all CHAT-01→10 now, test via Postman, go live on approval | ✓ Confirmed (Phase 3) |
| n8n webhook URL exposed in /integrations page | Configurable from dashboard; n8n workflow status visible alongside other integrations | ✓ Confirmed (Phase 3) |

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
