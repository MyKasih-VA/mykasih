# MyKasih Command Centre — Claude Code Master Context
> **READ THIS FILE FIRST. Every session starts here.**
> Built by Iceberg AI Solutions for MyKasih Foundation | April 2026 | CONFIDENTIAL

---

## 🏗️ What We Are Building

Three integrated systems that share one Supabase database:

| # | System | Channel | Priority |
|---|--------|---------|----------|
| 1 | **SARA Voice Agent** (ElevenLabs) | WhatsApp voice notes | P0 — DONE (needs fixes) |
| 2 | **Kasih WhatsApp Chatbot** (n8n + Claude API) | WhatsApp text messages | P1 — BUILD |
| 3 | **MyKasih Command Centre Dashboard** (Next.js) | Web — admin CRM | P1 — BUILD |

---

## 🛠️ Tech Stack

```
Frontend:      Next.js 14 (App Router, TypeScript, strict mode)
Styling:       Tailwind CSS + Shadcn UI (dark theme)
Font:          Inter (Google Fonts) — primary
               JetBrains Mono — code/monospace only
Charts:        Recharts
Icons:         Lucide React
Database:      Supabase Pro (Singapore — ap-southeast-1)
Auth:          Supabase Auth (email/password + MFA for admin)
Hosting:       Vercel Pro
Orchestration: n8n Cloud Pro (10K executions/month)
Voice Agent:   ElevenLabs Conversational AI
Chatbot LLM:   Claude Sonnet API (Anthropic)
WhatsApp:      Meta Cloud API (direct — no BSP, inbound FREE)
AI Persona:    Anam AI (demo + testing embed)
```

---

## 🎨 Brand & Design System

```
App Name:    "MyKasih Command Centre"
Subtitle:    "AI Helpline CRM v1.0"
Logo URL:    https://mykasih.com.my/wp-content/uploads/2025/05/MyKasih-logo.png
Theme:       Dark (MBJB Command Centre style)
Language:    EN/BM toggle — user preference stored in session
```

### Color Tokens (never hardcode hex — use CSS vars)
```css
--bg-primary:     #0D1117   /* page background */
--bg-surface:     #161B22   /* cards, sidebar, panels */
--bg-border:      #21262D   /* dividers, input borders */
--accent-primary: #2E7D32   /* green — buttons, active nav, headings */
--accent-teal:    #00897B   /* teal — secondary actions */
--text-primary:   #E6EDF3   /* main text */
--text-muted:     #7D8590   /* labels, captions, metadata */
--status-green:   #3FB950   /* online, resolved */
--status-yellow:  #D29922   /* pending, in-progress, warning */
--status-red:     #F85149   /* error, escalated, failed */
--chart-voice:    #43A047   /* voice channel in charts */
--chart-chat:     #00897B   /* chat channel in charts */
```

### Typography
```
Headings:  Inter SemiBold 600
Body:      Inter Regular 400
Numbers:   Inter Bold 700
Captions:  Inter Regular 400, text-muted
Code:      JetBrains Mono Regular 400
```

---

## 🔑 Environment Variables

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# ElevenLabs
ELEVENLABS_API_KEY=
ELEVENLABS_AGENT_ID=agent_6501knqvg098fdh8355x9v4d3ycz
ELEVENLABS_WEBHOOK_SECRET=

# Claude API (Anthropic) — for Kasih chatbot
ANTHROPIC_API_KEY=

# Meta WhatsApp
META_WA_PHONE_NUMBER_ID=
META_WA_ACCESS_TOKEN=
META_WA_VERIFY_TOKEN=

# n8n
N8N_WEBHOOK_SECRET=
N8N_BASE_URL=

# Anam AI
NEXT_PUBLIC_ANAM_AGENT_ID=32d94abf-9bfd-45c4-8076-b1ea6ef9e229

# App
NEXT_PUBLIC_APP_NAME="MyKasih Command Centre"
NEXT_PUBLIC_APP_VERSION=1.0.0
NEXT_PUBLIC_DEFAULT_LANGUAGE=en
```

---

## 🗄️ Database Schema (Supabase)

### Table: calls
```sql
CREATE TABLE calls (
  id                         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  channel                    text NOT NULL CHECK (channel IN ('voice','chat','website')),
  caller_name                text,
  wa_number                  text,
  location                   text,
  postcode                   text,
  language                   text CHECK (language IN ('bm','en','mixed')),
  duration                   integer,        -- seconds (voice only)
  message_count              integer,        -- chat turns (chat only)
  category                   text CHECK (category IN (
                               'eligibility','faq','registration',
                               'complaint','merchant_lookup','balance_check')),
  outcome                    text CHECK (outcome IN (
                               'resolved','escalated','callback','abandoned')),
  csat_rating                integer CHECK (csat_rating BETWEEN 1 AND 5),
  is_test                    boolean DEFAULT false,
  elevenlabs_conversation_id text,           -- voice only
  timestamp                  timestamptz DEFAULT now()
);
```

### Table: transcripts
```sql
CREATE TABLE transcripts (
  id        uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  call_id   uuid REFERENCES calls(id) ON DELETE CASCADE,
  speaker   text CHECK (speaker IN ('user','bot','agent')),
  message   text,
  timestamp timestamptz DEFAULT now()
);
```

### Table: tickets
```sql
CREATE TABLE tickets (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  call_id      uuid REFERENCES calls(id),
  channel      text,
  category     text,
  description  text,
  status       text DEFAULT 'open'
               CHECK (status IN ('open','in_progress','resolved')),
  reference_no text UNIQUE,   -- format: TKT-2026-00001
  masked_ic    text,           -- format: 880512-**-****
  assigned_to  text,
  created_at   timestamptz DEFAULT now(),
  updated_at   timestamptz DEFAULT now()
);
```

### Table: kb_entries
```sql
CREATE TABLE kb_entries (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  category     text,
  question_bm  text,
  question_en  text,
  answer_bm    text,
  answer_en    text,
  is_active    boolean DEFAULT true,
  last_updated timestamptz DEFAULT now(),
  updated_by   text
);
```

### Table: users
```sql
CREATE TABLE users (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  email      text UNIQUE,
  name       text,
  role       text CHECK (role IN ('admin','mykasih','qmedia','supervisor')),
  language   text DEFAULT 'en' CHECK (language IN ('en','bm')),
  created_at timestamptz DEFAULT now(),
  last_login timestamptz
);
```

### Table: merchants (seed from MyKasih_Merchant_List.xlsx)
```sql
CREATE TABLE merchants (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  chain       text,           -- '99 Speedmart', 'Econsave', etc.
  outlet_name text,
  state       text,
  city        text,
  postcode    text,
  address     text
);
CREATE INDEX idx_merchants_postcode ON merchants(postcode);
CREATE INDEX idx_merchants_state ON merchants(state);
```
> **10,194 outlets | 16 states | 100% postcode coverage**
> Seed from: /data/merchants.json (generated from MyKasih_Merchant_List.xlsx)

---

## 👥 Roles & Access

| Role | Who | Access |
|------|-----|--------|
| `admin` | Iceberg AI / QMedia | Full access — all pages + config + integrations |
| `mykasih` | MyKasih Staff | Calls, tickets, KB editor — no config/integrations |
| `qmedia` | QMedia team | Analytics + reports only |
| `supervisor` | MyKasih Supervisor | Live monitor + tickets (read + update status) |

---

## 📱 Channel Distinction Rules

> **CRITICAL — apply everywhere in the UI**

| Rule | Voice | Chat |
|------|-------|------|
| Icon | 📞 | 💬 |
| Column label | Duration (seconds) | Messages (count) |
| Data source | ElevenLabs webhook | n8n + Meta WA webhook |
| `channel` value | `voice` | `chat` |
| Separate page | Voice Calls | Chat Messages |
| Combined page | All Interactions (with channel toggle) | ← same |
| Badge color | `--chart-voice` (#43A047) | `--chart-chat` (#00897B) |

---

## 🗺️ Dashboard Navigation

```
OVERVIEW
  └─ Dashboard (home — stats, charts, recent)

CALL MANAGEMENT
  ├─ Voice Calls        (ElevenLabs channel only)
  ├─ Chat Messages      (WhatsApp chatbot channel only)
  └─ All Interactions   (combined — channel toggle filter)

OPERATIONS
  ├─ Tickets            (kanban: open / in-progress / resolved)
  ├─ Beneficiaries      (lookup by WA number, interaction history)
  └─ Live Monitor       (active sessions, real-time)

INTELLIGENCE
  └─ Analytics          (weekly/monthly charts, CSAT, heatmap)

SYSTEM
  ├─ Knowledge Base     (CRUD, BM+EN, active toggle, sync to ElevenLabs)
  ├─ Staff Management   (users, roles, last login)
  ├─ Integrations       (status cards: ElevenLabs, Meta WA, n8n, Supabase, Anam AI)
  ├─ Testing Console    (3 tabs: Voice Agent | Kasih Chatbot | Anam AI Persona)
  ├─ AI Demo            (standalone Anam AI persona — client-facing demo page)
  └─ Settings           (agent hours, webhook URLs, language, notifications)
```

---

## 🤖 AI Integrations

### ElevenLabs Voice Agent
```
Agent ID: agent_6501knqvg098fdh8355x9v4d3ycz
React SDK: @elevenlabs/react
Connection: WebRTC (lower latency)
Widget embed: @elevenlabs/convai-widget

# React usage (Testing Console):
import { useConversation } from "@elevenlabs/react";
const conversation = useConversation({ ... });
await conversation.startSession({
  agentId: process.env.ELEVENLABS_AGENT_ID,
  connectionType: "webrtc"
});
```

### Anam AI Persona (Demo + Testing)
```
Agent ID:   32d94abf-9bfd-45c4-8076-b1ea6ef9e229
Share URL:  https://lab.anam.ai/share/ABLTOrY3iUovduzq_wplu

# HTML embed (use in iframe or web component):
<anam-agent agent-id="32d94abf-9bfd-45c4-8076-b1ea6ef9e229"></anam-agent>
<script src="https://unpkg.com/@anam-ai/agent-widget" async></script>

# Use in Testing Console tab 3 AND dedicated AI Demo page
```

### Kasih WhatsApp Chatbot (n8n + Claude API)
```
Intent labels: faq | balance_check | merchant_lookup | complaint | unknown
Mock balance API: returns { name, balance, expiry, nearest_merchant }
Merchant lookup: query merchants table by postcode prefix OR state/city
Quick reply buttons: Semak baki | Kedai berdekatan | Bantuan SARA | Status aduan
```

---

## 📡 API Routes

| Route | Method | Auth | Purpose |
|-------|--------|------|---------|
| `/api/webhook/voice` | POST | ElevenLabs secret | Receive call end → save to Supabase |
| `/api/webhook/chat` | POST | Meta verify token | Receive WA message → process chatbot |
| `/api/chatbot/message` | POST | n8n token | Process chatbot intent + return response |
| `/api/merchant/lookup` | POST | Supabase JWT | Postcode/state lookup → return nearby merchants |
| `/api/calls` | GET | Supabase JWT | Paginated calls list with filters |
| `/api/calls/[id]/transcript` | GET | Supabase JWT | Full transcript for a call |
| `/api/tickets` | GET/PATCH | Supabase JWT | Tickets list + status update |
| `/api/kb` | GET/POST/PUT/DELETE | Supabase JWT | KB CRUD |
| `/api/analytics/summary` | GET | Supabase JWT | Dashboard home stats |
| `/api/export/calls` | GET | admin + qmedia | Excel download |

---

## 🔒 Security Rules

- **IC masking**: ALWAYS mask before Supabase write: `880512-**-****`
- **No plain-text personal data** in any DB field
- **RLS enabled** on all tables
- **Admin MFA** enforced via Supabase Auth
- **Webhook secrets** validated on every incoming request
- **is_test=true** on ALL test calls from Testing Console

---

## 📁 Project Structure

```
mykasih-crm/
├── app/
│   ├── (auth)/
│   │   └── login/page.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx              ← sidebar + topbar wrapper
│   │   ├── page.tsx                ← dashboard home
│   │   ├── voice-calls/page.tsx
│   │   ├── chat-messages/page.tsx
│   │   ├── all-interactions/page.tsx
│   │   ├── tickets/page.tsx
│   │   ├── beneficiaries/page.tsx
│   │   ├── live-monitor/page.tsx
│   │   ├── analytics/page.tsx
│   │   ├── knowledge-base/page.tsx
│   │   ├── staff/page.tsx
│   │   ├── integrations/page.tsx
│   │   ├── testing/page.tsx        ← 3-tab: Voice | Chat | Anam AI
│   │   ├── demo/page.tsx           ← standalone Anam AI demo
│   │   └── settings/page.tsx
│   └── api/
│       ├── webhook/voice/route.ts
│       ├── webhook/chat/route.ts
│       ├── chatbot/message/route.ts
│       ├── merchant/lookup/route.ts
│       ├── calls/route.ts
│       ├── calls/[id]/transcript/route.ts
│       ├── tickets/route.ts
│       ├── tickets/[id]/route.ts
│       ├── kb/route.ts
│       ├── kb/[id]/route.ts
│       ├── analytics/summary/route.ts
│       └── export/calls/route.ts
├── components/
│   ├── layout/
│   │   ├── Sidebar.tsx
│   │   ├── Topbar.tsx
│   │   └── LanguageToggle.tsx
│   ├── dashboard/
│   │   ├── StatCard.tsx
│   │   ├── CallVolumeChart.tsx
│   │   ├── CategoryDonut.tsx
│   │   └── RecentInteractions.tsx
│   ├── calls/
│   │   ├── CallsTable.tsx
│   │   ├── TranscriptModal.tsx
│   │   └── ChannelBadge.tsx
│   ├── tickets/
│   │   ├── TicketKanban.tsx
│   │   └── TicketDetail.tsx
│   ├── testing/
│   │   ├── VoiceAgentTab.tsx
│   │   ├── ChatbotSimTab.tsx
│   │   └── AnamAITab.tsx
│   └── ui/                         ← Shadcn components
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   └── server.ts
│   ├── merchant-lookup.ts          ← postcode + state query helpers
│   ├── ic-mask.ts                  ← IC masking utility
│   ├── ticket-ref.ts               ← TKT-YYYY-NNNNN generator
│   └── translations.ts             ← EN/BM strings
├── data/
│   └── merchants.json              ← seeded from MyKasih_Merchant_List.xlsx
├── middleware.ts                   ← route protection + role redirect
├── docs/
│   ├── PRD.md
│   ├── SYSTEM_DESIGN.md
│   ├── WIREFRAMES.md
│   ├── FEATURE_BREAKDOWN.md
│   └── SESSIONS.md
└── CLAUDE.md                       ← THIS FILE
```

---

## ⚡ Code Standards

```typescript
// ALWAYS TypeScript — never `any`
// ALWAYS try/catch on API routes
// ALWAYS return proper HTTP status codes
// NEVER hardcode colors — use CSS vars
// NEVER store plain IC numbers
// ALWAYS add loading skeleton + empty state to tables
// ALWAYS tag test calls: is_test=true
// ALWAYS show channel badge (📞 voice / 💬 chat) on every row
// ALWAYS use channel-specific icons and colors from design system
```

---

## 🌐 Language Toggle

- Default: English (`en`)
- Toggle available in: Topbar (all pages) + Settings
- User preference saved to `users.language` in Supabase
- Key strings in `/lib/translations.ts`
- Use `useLanguage()` hook throughout

---

## ✅ Current State

| Component | Status |
|-----------|--------|
| ElevenLabs SARA voice agent | ✅ Live — 2 prompt fixes needed |
| Anam AI persona | ✅ Ready to embed |
| Merchant data (10,194 outlets) | ✅ Available — needs seeding to Supabase |
| Supabase project | ✅ Created — run SQL migrations |
| GitHub repo | ✅ Created |
| Vercel project | ✅ Created |
| n8n Cloud Pro | ✅ Ready |
| Meta WA API | ⏳ Approval pending (3–7 days) |
| Dashboard (Next.js) | 🔴 Not started |
| Kasih chatbot | 🔴 Not started |

<!-- GSD:project-start source:PROJECT.md -->
## Project

**MyKasih Command Centre**

MyKasih Command Centre is an AI-powered helpline CRM built by Iceberg AI Solutions for MyKasih Foundation, serving the SARA (Sumbangan Asas Rahmah) program that provides RM100 cashless credit to 23+ million eligible Malaysian citizens. It integrates three systems — a SARA Voice Agent (ElevenLabs), a Kasih WhatsApp Chatbot (n8n + Claude API), and a Next.js admin dashboard — all sharing one Supabase database, enabling 24/7 bilingual (BM/EN) beneficiary support and unified CRM visibility for internal staff.

**Core Value:** Beneficiaries can get SARA help (eligibility, balance, merchant lookup, complaints) at any hour via voice or WhatsApp, and every interaction is captured, ticketed, and visible to MyKasih staff in real time.

### Constraints

- **Tech Stack:** Next.js 14, TypeScript strict (no `any`), Tailwind + Shadcn UI dark, Supabase Pro Singapore, Vercel Pro — locked
- **Colors:** All from CSS variables — never hardcode hex values
- **PDPA:** Zero plain-text IC numbers anywhere in DB; masked_ic format: 880512-**-****
- **Timeline:** 4-week delivery — Phase 0 (today) → Week 1 → Week 2 → Week 3 → Week 4 UAT
- **Meta WA:** API approval pending; chatbot integration blocked until approved (stub can be built)
- **Budget:** ElevenLabs Scale plan ($330/mo), n8n Cloud Pro (10K exec/mo)
<!-- GSD:project-end -->

<!-- GSD:stack-start source:STACK.md -->
## Technology Stack

Technology stack not yet documented. Will populate after codebase mapping or first phase.
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

Conventions not yet established. Will populate as patterns emerge during development.
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

Architecture not yet mapped. Follow existing patterns found in the codebase.
<!-- GSD:architecture-end -->

<!-- GSD:skills-start source:skills/ -->
## Project Skills

No project skills found. Add skills to any of: `.claude/skills/`, `.agents/skills/`, `.cursor/skills/`, or `.github/skills/` with a `SKILL.md` index file.
<!-- GSD:skills-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd-quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd-debug` for investigation and bug fixing
- `/gsd-execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->

<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd-profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
