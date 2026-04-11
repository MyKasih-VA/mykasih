# Requirements: MyKasih Command Centre

**Defined:** 2026-04-11
**Core Value:** Beneficiaries can get SARA help at any hour via voice or WhatsApp, and every interaction is captured and visible to MyKasih staff in real time.

## v1 Requirements

### Phase 0 — Agent Fixes

- [ ] **AGENT-01**: SARA voice agent enforces non-transferability (cannot use another person's MyKad)
- [ ] **AGENT-02**: SARA voice agent maintains English language once switched (never reverts to BM)

### Scaffold & Infrastructure

- [ ] **INFRA-01**: Next.js project scaffolded with TypeScript strict mode, Tailwind CSS, App Router, no src/ dir
- [ ] **INFRA-02**: Shadcn UI initialized with dark theme and CSS variables
- [ ] **INFRA-03**: All 12 CSS color tokens defined as CSS variables in globals.css
- [ ] **INFRA-04**: Inter font loaded from Google Fonts as primary typeface
- [ ] **INFRA-05**: Supabase browser client (lib/supabase/client.ts) and server client (lib/supabase/server.ts) created
- [ ] **INFRA-06**: Middleware protects all /dashboard/* routes; unauthenticated users redirect to /login
- [ ] **INFRA-07**: All 6 Supabase tables created with indexes and RLS enabled (calls, transcripts, tickets, kb_entries, users, merchants)
- [ ] **INFRA-08**: .env.local created with all required environment variables

### Authentication

- [ ] **AUTH-01**: User can sign in with email and password via Supabase Auth
- [ ] **AUTH-02**: After sign-in, system reads user role from users table and redirects: admin/mykasih → /dashboard, qmedia → /analytics, supervisor → /live-monitor
- [ ] **AUTH-03**: Invalid credentials show error message below the login button
- [ ] **AUTH-04**: User session persists across browser refresh

### Merchant Data

- [ ] **MERCH-01**: POST /api/seed/merchants bulk-inserts all 10,194 merchant outlets into Supabase merchants table
- [ ] **MERCH-02**: lib/merchant-lookup.ts exports lookupByPostcode(postcode) — matches first 4 digits, returns nearest outlets
- [ ] **MERCH-03**: lib/merchant-lookup.ts exports lookupByState(state, city?) — filters by state + optional city, returns top 10

### Dashboard Layout & Home

- [ ] **DASH-01**: Fixed sidebar (260px, bg #161B22) with all 14 nav items grouped into 5 sections, MyKasih logo, active state highlight
- [ ] **DASH-02**: Sidebar bottom shows: user avatar, name, role badge, logout link, "● AI Connected" green dot
- [ ] **DASH-03**: Topbar shows: dynamic page title, date in BM or EN, search input, notification bell, user avatar dropdown
- [ ] **DASH-04**: EN/BM language toggle in topbar; preference saved to localStorage and users.language field
- [ ] **DASH-05**: Dashboard home shows 4 stat cards — Interaksi Hari Ini (voice+chat breakdown), Kadar Penyelesaian, Tiket Terbuka, Purata Tempoh
- [ ] **DASH-06**: Dashboard home shows stacked bar chart (last 7 days, voice #43A047, chat #00897B) using Recharts
- [ ] **DASH-07**: Dashboard home shows donut chart for call categories using Recharts
- [ ] **DASH-08**: Dashboard home shows Recent Interactions table (last 10) with channel badge, click → transcript modal
- [ ] **DASH-09**: All tables have loading skeleton (Shadcn Skeleton) and empty state

### Voice Webhook (Session 2)

- [ ] **VOICE-01**: POST /api/webhook/voice validates ElevenLabs webhook secret from header
- [ ] **VOICE-02**: Webhook parses ElevenLabs payload and inserts call record (channel='voice') into calls table
- [ ] **VOICE-03**: Webhook inserts all transcript turns into transcripts table
- [ ] **VOICE-04**: If category = 'complaint', webhook generates TKT-YYYY-NNNNN reference and inserts ticket record
- [ ] **VOICE-05**: lib/ic-mask.ts exports maskIC() — masks IC to 880512-**-**** format before any DB write
- [ ] **VOICE-06**: lib/ticket-ref.ts exports generateTicketRef() — sequential TKT-2026-NNNNN format

### WhatsApp Chatbot (Session 3)

- [ ] **CHAT-01**: GET /api/webhook/chat handles Meta WA webhook verification (hub.mode + hub.challenge + hub.verify_token)
- [ ] **CHAT-02**: POST /api/webhook/chat extracts WA message and routes to /api/chatbot/message
- [ ] **CHAT-03**: POST /api/chatbot/message classifies intent via Claude API (faq | balance_check | merchant_lookup | complaint | unknown)
- [ ] **CHAT-04**: FAQ handler queries kb_entries and returns answer in detected language (BM or EN)
- [ ] **CHAT-05**: Balance check handler collects IC, masks it, returns mock balance + expiry + nearest merchant
- [ ] **CHAT-06**: Merchant lookup handler extracts location entities and returns top 3-5 merchants from Supabase
- [ ] **CHAT-07**: Complaint handler runs multi-turn conversation, creates ticket with reference number
- [ ] **CHAT-08**: First contact sends 4 quick reply buttons: Semak baki / Kedai berdekatan / Bantuan SARA / Status aduan
- [ ] **CHAT-09**: All chat sessions saved to Supabase (channel='chat', calls + transcripts tables)
- [ ] **CHAT-10**: lib/meta-wa.ts exports sendWhatsAppMessage() and sendWhatsAppButtons()

### Dashboard Pages (Session 4)

- [ ] **PAGE-01**: Voice Calls page — filterable table (date, language, category, outcome, search), transcript modal, Excel export, channel badge
- [ ] **PAGE-02**: Chat Messages page — WA thread view, message count column, intent badge, linked ticket
- [ ] **PAGE-03**: All Interactions page — combined table with channel toggle filter [All | 📞 Voice | 💬 Chat]
- [ ] **PAGE-04**: Tickets page — kanban board (open/in-progress/resolved), reference no, masked IC, linked transcript, status update
- [ ] **PAGE-05**: Beneficiaries page — search by WA number or name, interaction history, ticket history

### Intelligence & System Pages (Session 5)

- [ ] **PAGE-06**: Analytics page — period selector, 4 charts (volume bar, CSAT trend, language pie, peak heatmap), category breakdown table
- [ ] **PAGE-07**: Knowledge Base page — CRUD table, BM/EN toggle, active/inactive switch, Sync to ElevenLabs button
- [ ] **PAGE-08**: Staff Management page — user table, add/edit/remove, role select, last login display
- [ ] **PAGE-09**: Integrations page — 5 status cards (ElevenLabs, Meta WA, n8n, Supabase, Anam AI) with live status and action buttons
- [ ] **PAGE-10**: Live Monitor page — active voice sessions (ElevenLabs API), active WA chats, auto-refresh every 10s

### Testing & Demo (Session 6)

- [ ] **TEST-01**: Testing Console Tab 1 — ElevenLabs voice agent embed (@elevenlabs/react), all test calls tagged is_test=true
- [ ] **TEST-02**: Testing Console Tab 2 — Kasih chatbot simulator, dark WhatsApp-style UI, intent badge on bot responses
- [ ] **TEST-03**: Testing Console Tab 3 — Anam AI persona embed (anam-agent web component)
- [ ] **TEST-04**: AI Demo page (/demo) — standalone Anam AI persona embed, no sidebar, client-facing design
- [ ] **TEST-05**: Settings page — agent hours config, webhook URL display, notification preferences, data retention
- [ ] **TEST-06**: Language toggle fully applied to all sidebar labels, page titles, status labels, table headers

### Excel Export

- [ ] **EXPORT-01**: GET /api/export/calls — admin + qmedia roles only, 3-sheet xlsx (Semua Interaksi, Tiket, Ringkasan)
- [ ] **EXPORT-02**: Excel export button on Voice Calls, Chat Messages, All Interactions pages

### Security & Compliance

- [ ] **SEC-01**: Zero plain-text IC numbers stored in any DB field — maskIC() applied before every write
- [ ] **SEC-02**: RLS policies enforced on all 6 tables — each role sees only permitted data
- [ ] **SEC-03**: All incoming webhooks validate secret before processing
- [ ] **SEC-04**: All test calls tagged is_test=true and excluded from analytics
- [ ] **SEC-05**: Admin MFA enforced via Supabase Auth settings

## v2 Requirements

### Notifications
- **NOTIF-01**: Email alerts for new escalated tickets
- **NOTIF-02**: Configurable notification preferences per user

### Enhanced Chatbot
- **ENH-01**: WhatsApp rich media — buttons, location maps, PDF documents
- **ENH-02**: Warm transfer to live agent (requires SIP/PSTN integration)

### Real Backend Integration
- **API-01**: Real MyKasih balance API integration (replace mock)

## Out of Scope

| Feature | Reason |
|---------|--------|
| Real balance API integration | Mock used for POC; real API out of scope for v1 |
| Warm transfer to live agents | Requires SIP/PSTN; Phase 2 |
| WhatsApp rich media (buttons/maps/PDFs) | Phase 2 |
| Multi-language beyond BM/EN | Out of scope |
| Mobile app | Web-first; mobile later |
| Real-time WebSocket chat | High complexity; not core to value |
| CRM integration with existing MyKasih CRM | We ARE building the CRM |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| AGENT-01, AGENT-02 | Phase 1 | Pending |
| INFRA-01 – INFRA-08 | Phase 1 | Pending |
| AUTH-01 – AUTH-04 | Phase 1 | Pending |
| MERCH-01 – MERCH-03 | Phase 1 | Pending |
| DASH-01 – DASH-09 | Phase 1 | Pending |
| VOICE-01 – VOICE-06 | Phase 2 | Pending |
| CHAT-01 – CHAT-10 | Phase 3 | Pending |
| PAGE-01 – PAGE-05 | Phase 4 | Pending |
| PAGE-06 – PAGE-10 | Phase 5 | Pending |
| TEST-01 – TEST-06 | Phase 6 | Pending |
| EXPORT-01 – EXPORT-02 | Phase 2 | Pending |
| SEC-01 – SEC-05 | Phase 1–6 (cross-cutting) | Pending |

**Coverage:**
- v1 requirements: 57 total
- Mapped to phases: 57
- Unmapped: 0 ✓

---
*Requirements defined: 2026-04-11*
*Last updated: 2026-04-11 after initial definition*
