# Roadmap: MyKasih Command Centre

## Overview

Seven build sessions deliver a complete AI-powered helpline CRM for MyKasih Foundation. The journey starts with SARA voice agent prompt fixes and full project scaffolding, builds the WhatsApp chatbot and admin dashboard, adds analytics and intelligence pages, finishes with the testing console and polish, then closes with UAT and PDPA audit before handoff. Every interaction — voice or chat — is captured, ticketed, and visible to staff in real time.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Scaffold, DB, Auth & Dashboard Shell** - Project foundation, Supabase schema, login, sidebar, and dashboard home
- [x] **Phase 2: Voice Webhook, Ticket System & Excel Export** - ElevenLabs webhook processing, IC masking, ticket generation, and export API
- [x] **Phase 3: Kasih WhatsApp Chatbot** - Meta WA webhook, Claude intent classification, all handlers, and chat storage (completed 2026-04-11)
- [ ] **Phase 4: Core Dashboard Pages** - Voice Calls, Chat Messages, All Interactions, Tickets, and Beneficiaries pages
- [x] **Phase 5: Intelligence & System Pages** - Analytics, Knowledge Base, Staff, Integrations, and Live Monitor pages (completed 2026-04-12)
- [ ] **Phase 6: Testing Console, AI Demo, Settings & Polish** - Three-tab testing console, standalone demo page, settings, and full BM/EN coverage
- [ ] **Phase 7: UAT Fixes, PDPA Audit & Final QA** - User acceptance testing, compliance audit, security hardening, and production sign-off

## Phase Details

### Phase 1: Scaffold, DB, Auth & Dashboard Shell
**Goal**: MyKasih staff can log in to a working dark-themed dashboard with the sidebar, stat cards, and charts visible — and the SARA voice agent handles non-transferability and language correctly
**Depends on**: Nothing (first phase)
**Requirements**: AGENT-01, AGENT-02, INFRA-01, INFRA-02, INFRA-03, INFRA-04, INFRA-05, INFRA-06, INFRA-07, INFRA-08, AUTH-01, AUTH-02, AUTH-03, AUTH-04, MERCH-01, MERCH-02, MERCH-03, DASH-01, DASH-02, DASH-03, DASH-04, DASH-05, DASH-06, DASH-07, DASH-08, DASH-09
**Success Criteria** (what must be TRUE):
  1. User can sign in with email and password; invalid credentials show an error message below the login button
  2. After sign-in, the user lands on the correct page for their role (admin/mykasih → dashboard, qmedia → analytics, supervisor → live-monitor)
  3. The sidebar shows all 14 nav items grouped into 5 sections; the topbar shows page title, language toggle, search, and bell
  4. The dashboard home displays 4 stat cards, a stacked bar chart, a donut chart, and a recent interactions table with loading skeletons when data is loading
  5. SARA voice agent refuses IC transfer attempts and maintains English once the user switches language
**Plans**: 8 plans
Plans:
- [x] 01-00-PLAN.md — Wave 0: test framework + stub test files
- [x] 01-01-PLAN.md — SARA voice agent prompt fixes (non-transferability + language lock)
- [x] 01-02-PLAN.md — Foundation: globals.css, fonts, Supabase clients, env vars, CLAUDE.md update (D-08)
- [x] 01-03-PLAN.md — Auth proxy, login page, translations, language hook
- [x] 01-04-PLAN.md — Dashboard layout shell: sidebar, topbar, language toggle
- [x] 01-05-PLAN.md — Merchant seed endpoint + lookup utilities + Integrations page stub (D-15)
- [x] 01-06-PLAN.md — Dashboard home: stat cards, charts, recent interactions table
- [x] 01-07-PLAN.md — Demo data seed + Supabase schema migration
**UI hint**: yes

### Phase 2: Voice Webhook, Ticket System & Excel Export
**Goal**: Voice call data flows automatically from ElevenLabs into Supabase — transcripts saved, complaint tickets generated with reference numbers, and staff can download an Excel report
**Depends on**: Phase 1
**Requirements**: VOICE-01, VOICE-02, VOICE-03, VOICE-04, VOICE-05, VOICE-06, EXPORT-01, EXPORT-02
**Success Criteria** (what must be TRUE):
  1. When a voice call ends, ElevenLabs fires the webhook and the call record appears in Supabase with correct channel, duration, and category
  2. All transcript turns are stored in the transcripts table linked to the correct call record
  3. If the call category is complaint, a ticket is automatically created with a unique TKT-2026-NNNNN reference number
  4. IC numbers written to the DB are always in masked format (880512-**-****)
  5. Admin and qmedia users can download a 3-sheet Excel file covering all interactions, tickets, and a summary
**Plans**: 7 plans
Plans:
- [ ] 02-00-PLAN.md — Wave 0: test stubs for all Phase 2 utilities and routes
- [ ] 02-01-PLAN.md — IC masking utility + ticket reference generator (lib/ic-mask.ts, lib/ticket-ref.ts)
- [ ] 02-02-PLAN.md — SheetJS install + XLSX workbook builder helper (lib/export-helpers.ts)
- [ ] 02-03-PLAN.md — POST /api/webhook/voice (HMAC validation, call/transcript save, complaint ticket)
- [ ] 02-04-PLAN.md — GET /api/calls + GET /api/calls/[id]/transcript
- [ ] 02-05-PLAN.md — GET+PATCH /api/tickets + PATCH /api/tickets/[id]
- [ ] 02-06-PLAN.md — GET /api/export/calls (3-sheet XLSX download, role guard)

### Phase 3: Kasih WhatsApp Chatbot
**Goal**: Beneficiaries can send a WhatsApp message and receive instant bilingual responses for FAQs, balance checks, merchant lookups, and complaint filing — all interactions saved to Supabase
**Depends on**: Phase 2
**Requirements**: CHAT-01, CHAT-02, CHAT-03, CHAT-04, CHAT-05, CHAT-06, CHAT-07, CHAT-08, CHAT-09, CHAT-10
**Success Criteria** (what must be TRUE):
  1. Meta WA webhook verification (GET with hub.challenge) succeeds and the endpoint accepts incoming POST messages
  2. First contact from a beneficiary triggers 4 quick reply buttons (Semak baki / Kedai berdekatan / Bantuan SARA / Status aduan)
  3. A beneficiary asking about balance receives a mock balance response with expiry date and nearest merchant — IC is never stored in plain text
  4. A beneficiary asking for nearby shops receives 3-5 merchants from Supabase filtered by their postcode or state
  5. A complaint conversation completes and creates a ticket in Supabase with a reference number the beneficiary can quote
**Plans**: 8 plans
Plans:
- [x] 03-00-PLAN.md — Wave 0: install @anthropic-ai/sdk + test stubs for all Phase 3 routes and utils
- [x] 03-01-PLAN.md — Sessions table migration + shared types + lib/meta-wa.ts + session-manager.ts + [BLOCKING] schema push
- [x] 03-02-PLAN.md — GET /api/webhook/chat (Meta verify) + POST /api/webhook/chat (receive + extract + forward)
- [x] 03-03-PLAN.md — Claude Haiku intent classifier + POST /api/chatbot/message dispatcher with first-contact list
- [x] 03-04-PLAN.md — FAQ handler (kb_entries query) + merchant lookup handler (postcode/state query)
- [x] 03-05-PLAN.md — Balance check handler (IC collect, maskIC, mock API, balance + expiry + nearest merchant)
- [x] 03-06-PLAN.md — Complaint handler (5-step multi-turn, ticket creation with TKT ref, IC masking)
- [x] 03-07-PLAN.md — Real unit tests replacing all stubs (meta-wa, intent-classifier, webhook-chat, complaint-handler)

### Phase 4: Core Dashboard Pages
**Goal**: MyKasih staff can browse, search, and manage all voice calls, chat sessions, tickets, and beneficiary records through dedicated, filterable pages
**Depends on**: Phase 3
**Requirements**: PAGE-01, PAGE-02, PAGE-03, PAGE-04, PAGE-05
**Success Criteria** (what must be TRUE):
  1. Staff can open the Voice Calls page, filter by date / language / category / outcome, click a row to view the full transcript, and export results to Excel
  2. Staff can open the Chat Messages page and see WA thread view with intent badge and a link to any associated ticket
  3. Staff can view All Interactions in one table and toggle between All, Voice-only, and Chat-only views
  4. Staff can move a ticket between open, in-progress, and resolved columns on the Tickets kanban board; masked IC and reference number are always visible
  5. Staff can search beneficiaries by WA number or name and see their full interaction and ticket history
**Plans**: 4 plans
Plans:
- [x] 04-01-PLAN.md — Shared foundation: translations, TranscriptModal wired, FilterBar, CallsTable, IntentBadge, beneficiaries API + test
- [x] 04-02-PLAN.md — Voice Calls + Chat Messages + All Interactions pages
- [x] 04-03-PLAN.md — Tickets kanban page (TicketCard + TicketKanban + page)
- [x] 04-04-PLAN.md — Beneficiaries search-first page (BeneficiaryProfile + page)
**UI hint**: yes

### Phase 5: Intelligence & System Pages
**Goal**: Staff can analyse trends, manage knowledge base content, administer users, monitor integration health, and watch live active sessions
**Depends on**: Phase 4
**Requirements**: PAGE-06, PAGE-07, PAGE-08, PAGE-09, PAGE-10
**Success Criteria** (what must be TRUE):
  1. Staff can select a date period and see 4 charts (volume bar, CSAT trend, language pie, peak heatmap) plus a category breakdown table on the Analytics page
  2. Staff can add, edit, delete, and toggle active/inactive KB entries in both BM and EN, and trigger a sync to ElevenLabs
  3. Admin can add, edit, or remove staff users and assign roles from the Staff Management page
  4. The Integrations page shows live status for ElevenLabs, Meta WA, n8n, Supabase, and Anam AI with action buttons
  5. The Live Monitor page auto-refreshes every 10 seconds and shows all currently active voice sessions and active WA chats
**Plans**: 5 plans
Plans:
- [x] 05-01-PLAN.md — Foundation + Analytics page (shadcn installs, all translations, charts API, 6 chart components)
- [x] 05-02-PLAN.md — Knowledge Base page (CRUD API, table with BM/EN toggle, add/edit modal, ElevenLabs sync)
- [x] 05-03-PLAN.md — Staff Management page (invite API, role edit, remove, admin-only enforcement)
- [x] 05-04-PLAN.md — Integrations page (health check API, 5 status cards, action buttons, merchant seed preserved)
- [x] 05-05-PLAN.md — Live Monitor page (ElevenLabs + sessions API, auto-refresh 10s, visibility-aware polling)
**UI hint**: yes

### Phase 6: Testing Console, AI Demo, Settings & Polish
**Goal**: Admins can test all three AI channels from one console, share a standalone Anam AI demo with clients, configure system settings, and every page label appears correctly in both BM and EN
**Depends on**: Phase 5
**Requirements**: TEST-01, TEST-02, TEST-03, TEST-04, TEST-05, TEST-06
**Success Criteria** (what must be TRUE):
  1. Admin can open the Testing Console and start a voice session with SARA via the ElevenLabs embed — the call is tagged is_test=true in Supabase
  2. Admin can simulate a chat conversation in the Kasih chatbot tab and see intent badges on bot responses
  3. Admin can view the Anam AI persona in Tab 3 of the Testing Console and on the standalone /demo page (no sidebar)
  4. Admin can save agent hours, view webhook URLs, and set notification preferences on the Settings page
  5. Switching the language toggle on any page instantly relabels all sidebar items, page titles, status labels, and table headers to the selected language
**Plans**: 5 plans
Plans:
- [x] 06-01-PLAN.md — Wave 0: install @elevenlabs/react, translations, proxy patch, global.d.ts, settings migration
- [x] 06-02-PLAN.md — Testing Console: VoiceAgentTab + ChatbotSimTab + 3-tab page shell
- [x] 06-03-PLAN.md — AnamAITab + standalone /demo page + delete dashboard demo stub
- [x] 06-04-PLAN.md — Settings API (GET/PATCH) + SettingsForm + Settings page
- [x] 06-05-PLAN.md — Language polish sweep + full Phase 6 visual verification
**UI hint**: yes

### Phase 7: UAT Fixes, PDPA Audit & Final QA
**Goal**: The system passes user acceptance testing, every PDPA obligation is confirmed met, all security controls are verified, and the platform is production-ready for handoff to MyKasih Foundation
**Depends on**: Phase 6
**Requirements**: SEC-01, SEC-02, SEC-03, SEC-04, SEC-05
**Success Criteria** (what must be TRUE):
  1. A manual audit confirms zero plain-text IC numbers exist in any Supabase table field
  2. RLS policies are verified — each role can only see data permitted by their access level
  3. All incoming webhooks (ElevenLabs, Meta WA) reject requests with invalid or missing secrets
  4. All calls and chats triggered from the Testing Console carry is_test=true and are excluded from analytics charts
  5. Admin MFA is enforced at Supabase Auth level and cannot be bypassed on the login flow
**Plans**: 5 plans
Plans:
- [x] 07-00-PLAN.md — Wave 0: analytics summary test stub (ic-mask tests already exist)
- [x] 07-01-PLAN.md — PDPA IC audit script + compliance report (SEC-01)
- [x] 07-02-PLAN.md — Role-based RLS migration + [BLOCKING] schema push (SEC-02)
- [x] 07-03-PLAN.md — Webhook hardening verification + test data exclusion audit (SEC-03, SEC-04)
- [ ] 07-04-PLAN.md — Admin TOTP MFA enrollment + challenge flow + AAL enforcement (SEC-05)

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6 → 7

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Scaffold, DB, Auth & Dashboard Shell | 9/9 | Complete | 2026-04-11 |
| 2. Voice Webhook, Ticket System & Excel Export | 7/7 | Complete | 2026-04-11 |
| 3. Kasih WhatsApp Chatbot | 8/8 | Complete   | 2026-04-11 |
| 4. Core Dashboard Pages | 4/4 | Complete | 2026-04-11 |
| 5. Intelligence & System Pages | 5/5 | Complete   | 2026-04-12 |
| 6. Testing Console, AI Demo, Settings & Polish | 5/5 | Complete | 2026-04-13 |
| 7. UAT Fixes, PDPA Audit & Final QA | 4/6 | In Progress|  |
