# Claude Code Session Prompts
> Copy the relevant session block. Always start with: "Read CLAUDE.md first, then proceed."

---

## SESSION 1 — Scaffold + DB Seed + Login + Dashboard Shell
**Goal:** Project running on Vercel with login + dashboard home + merchant data seeded
**Est:** 3–4 hrs

```
Read CLAUDE.md first, then proceed with the following tasks in order.

SESSION 1: Project scaffold, login page, dashboard layout, home page, merchant DB seed.

STEP 1 — Next.js Init:
- npx create-next-app@latest mykasih-crm --typescript --tailwind --app --src-dir=false
- npx shadcn-ui@latest init (select: dark theme, CSS variables yes)
- npm install @supabase/supabase-js @supabase/auth-helpers-nextjs
- npm install recharts lucide-react
- npm install next-themes (for EN/BM lang toggle support)

STEP 2 — globals.css:
Add ALL CSS variables from CLAUDE.md color system to :root.
Import Inter from Google Fonts in app/layout.tsx.

STEP 3 — Supabase client:
Create lib/supabase/client.ts (browser client)
Create lib/supabase/server.ts (server component client)
Create middleware.ts — protect /dashboard/* routes, redirect unauthenticated to /login

STEP 4 — Merchant data seed:
- Read /data/merchants.json (I will provide this file)
- Create app/api/seed/merchants/route.ts — POST endpoint that bulk-inserts to merchants table
- Create lib/merchant-lookup.ts with two functions:
  a. lookupByPostcode(postcode: string) — find merchants within same postcode prefix (first 4 digits)
  b. lookupByState(state: string, city?: string) — find merchants in state/city, return top 10

STEP 5 — Login page (app/(auth)/login/page.tsx):
- Full dark page, bg #0D1117
- Centered card: bg #161B22, rounded-2xl, shadow-2xl, padding 2.5rem
- MyKasih logo (img from CLAUDE.md logo URL), centered, 180px wide, mb-6
- Title: "MyKasih Command Centre" in #2E7D32, font-semibold, text-xl
- Subtitle: "AI Helpline CRM v1.0" in #7D8590, text-sm, mb-8
- Email input + password input (Shadcn Input, dark styled)
- "Log Masuk / Sign In" button — full width, bg #2E7D32, hover #1B5E20, text white
- Supabase Auth signInWithPassword()
- On success: query users table for role → redirect:
  admin/mykasih → /dashboard
  qmedia → /analytics  
  supervisor → /live-monitor
- Error message below button in #F85149

STEP 6 — Dashboard Layout (app/(dashboard)/layout.tsx):
Build Sidebar component with:
- Fixed left, 260px wide, full height, bg #161B22, border-right 1px #21262D
- Header: MyKasih logo (32px) + "MyKasih Command Centre" + "AI Helpline CRM v1.0"
- Navigation sections from CLAUDE.md (OVERVIEW, CALL MANAGEMENT, OPERATIONS, INTELLIGENCE, SYSTEM)
- All nav items with correct Lucide icons:
  Dashboard=LayoutDashboard, VoiceCalls=Phone, ChatMessages=MessageSquare,
  AllInteractions=Activity, Tickets=Ticket, Beneficiaries=Users,
  LiveMonitor=Radio, Analytics=BarChart2, KnowledgeBase=BookOpen,
  Staff=UserCog, Integrations=Plug, Testing=FlaskConical, Demo=Sparkles, Settings=Settings
- Active state: bg #2E7D32 (10% opacity), left border 3px #2E7D32, text #2E7D32
- Bottom: avatar + user name + role badge + logout link + "● AI Connected" (green dot)

Build Topbar component with:
- Page title (dynamic from route) + date in BM or EN
- Search input (Shadcn) "Cari interaksi..."
- Language toggle button: "EN | BM" — toggles and saves to localStorage + users table
- Notification bell with badge
- User avatar dropdown (name, role, logout)

STEP 7 — Dashboard Home (app/(dashboard)/page.tsx):
4 stat cards (grid-cols-4):
  Card 1: 📞💬 "Interaksi Hari Ini" — count of today's calls+chats, show voice/chat breakdown below
  Card 2: ✅ "Kadar Penyelesaian" — resolved/total this month as %
  Card 3: 🎫 "Tiket Terbuka" — count of open tickets, show in-progress count below
  Card 4: ⏱ "Purata Tempoh" — avg duration for voice calls in seconds

Charts row:
  Left (70%): Stacked bar chart — last 7 days, voice bars in #43A047, chat bars in #00897B
  Right (30%): Donut chart — call categories (eligibility/faq/registration/complaint/merchant/balance)

Recent Interactions table (last 10):
  Columns: Channel (icon+badge), Nama, Kategori, Outcome, Bahasa, Masa
  Channel badge: 📞 Voice (green) | 💬 Chat (teal)
  Click row → transcript modal (build this too)
  "Lihat semua →" link to /all-interactions

All data from Supabase. If empty, show empty state with "Tiada interaksi" message.

STEP 8 — .env.local:
Create with all vars from CLAUDE.md. Leave values empty with comments.

STEP 9 — Deploy:
- Push to GitHub
- Deploy to Vercel
- Confirm build passes

Show complete file contents as you create each one. After each step, confirm before moving on.
```

---

## SESSION 2 — Voice Webhook + Ticket System + Excel Export
**Goal:** Every ElevenLabs call end saves to Supabase + creates ticket if complaint + Excel appends
**Est:** 3–4 hrs

```
Read CLAUDE.md first.

SESSION 2: ElevenLabs webhook handler, ticket creation, IC masking, Excel export.

Files already exist from Session 1: scaffold, login, dashboard home.

STEP 1 — lib/ic-mask.ts:
Export maskIC(ic: string): string
  - Input: "880512031234" or "880512-03-1234"
  - Output: "880512-**-****"
  - If invalid format: return "[MASKED]"

STEP 2 — lib/ticket-ref.ts:
Export async generateTicketRef(): Promise<string>
  - Format: TKT-2026-NNNNN (zero-padded 5 digits)
  - Query tickets table for MAX reference_no to get next number
  - Return: "TKT-2026-00001"

STEP 3 — POST /api/webhook/voice:
ElevenLabs sends POST when conversation ends.
Payload structure:
{
  conversation_id: string,
  agent_id: string,
  status: "done",
  transcript: [{ role: "user"|"agent", message: string, time_in_call_secs: number }],
  metadata: {
    call_duration: number,
    call_successful: "success"|"failure",
    termination_reason: string
  },
  analysis: {
    call_successful: boolean,
    transcript_summary: string,
    data_collection_results: {
      caller_name?: { value: string },
      location?: { value: string },
      category?: { value: string },
      outcome?: { value: string },
      csat_rating?: { value: number },
      masked_ic?: { value: string }
    }
  }
}

Steps:
1. Verify ElevenLabs webhook secret from header
2. Extract all fields, apply IC masking
3. Insert into calls table (channel='voice')
4. Insert transcript rows (map role: 'agent'→'bot', 'user'→'user')
5. If category === 'complaint': generateTicketRef() → insert ticket
6. Call n8n Excel append webhook (fire and forget)
7. Return { success: true, call_id }

STEP 4 — GET /api/export/calls:
Auth: admin + qmedia roles only
Query: calls + transcripts joined, filtered by optional ?from=&to=&channel= params
Build Excel with xlsx library:
  Sheet 1 "Semua Interaksi": all calls columns
  Sheet 2 "Tiket": all tickets columns
  Sheet 3 "Ringkasan": summary stats (total, by channel, by category, avg duration, avg CSAT)
Return as attachment: mykasih-calls-YYYY-MM-DD.xlsx

STEP 5 — Excel download button in dashboard:
Add "Export Excel" button to Voice Calls, Chat Messages, All Interactions pages header.
On click: fetch /api/export/calls with current filters → trigger browser download.

STEP 6 — n8n workflow description (create DOCS/n8n-voice-webhook.md):
Document the exact n8n workflow JSON structure for:
  Trigger: Webhook (POST from /api/webhook/voice)
  Node 1: Set — format Excel row
  Node 2: Supabase Storage — append row to master.xlsx

Show all complete files.
```

---

## SESSION 3 — Kasih WhatsApp Chatbot
**Goal:** Full chatbot working — FAQ, balance check, merchant lookup, complaints
**Est:** 4–5 hrs

```
Read CLAUDE.md first.

SESSION 3: Kasih WhatsApp chatbot — all intent handlers + Testing Console chatbot tab.

STEP 1 — POST /api/chatbot/message:
Input: { wa_number: string, message: string, timestamp: string, is_test?: boolean }
Output: { response_text: string, intent: string, success: boolean, ticket_ref?: string }

Flow:
a. Claude API intent classification:
   System prompt: "You are an intent classifier for MyKasih SARA chatbot.
   Classify into EXACTLY one: faq|balance_check|merchant_lookup|complaint|unknown
   Extract entities: state, city, postcode, ic_number (if present, mask immediately)
   Return JSON only: { intent, confidence, lang: 'bm'|'en', entities: {} }"
   
b. Route by intent:

FAQ HANDLER:
  - Query kb_entries table: match question_bm OR question_en (case-insensitive)
  - Use Claude API to find best matching KB entry if no exact match
  - Return answer in detected language (lang from classification)
  - If no match: "Maaf, sila hubungi 03-7720 1800 atau sara@treasury.gov.my"

BALANCE CHECK HANDLER (mock):
  - Step 1: If no IC in message, ask: "Sila kongsi nombor IC anda (12 digit)"
  - Step 2: Validate IC format (12 digits)
  - Step 3: Mask IC immediately
  - Step 4: Return mock response:
    "Terima kasih [Puan/Encik].\n\nBaki Semasa: RM80.00\nTempoh Sah: sehingga 31 Dis 2026\n\nKedai terdekat: Econsave [City] ([X]km)\n✓ Aktif & sedia digunakan"
  - Use lookupByPostcode() with IC prefix for nearby merchant

MERCHANT LOOKUP HANDLER:
  - Extract state/city/postcode from message entities
  - Call lib/merchant-lookup.ts lookupByState() or lookupByPostcode()
  - Return top 3-5 results: "Chain Name — Outlet Name, [City] ([Postcode])"
  - If no state/city found: ask "Di negeri atau kawasan mana?"

COMPLAINT HANDLER:
  Multi-turn conversation:
  - Turn 1: Ask category: "Aduan mengenai: (1) Barangan salah / (2) Masalah kedai / (3) Lain-lain"
  - Turn 2: Ask description: "Sila terangkan masalah anda"
  - Turn 3: Confirm + generate ticket
  - generateTicketRef() → insert ticket (channel='chat', masked_ic if provided)
  - Return: "✅ Aduan anda telah direkodkan.\nNo. Rujukan: TKT-2026-00042\nKami akan menghubungi anda dalam 2-3 hari bekerja."

c. Insert calls row (channel='chat', is_test=is_test)
d. Insert transcript rows
e. Return response

STEP 2 — GET/POST /api/webhook/chat:
- GET: Meta WA webhook verification (hub.mode + hub.challenge + hub.verify_token)
- POST: Extract message from Meta WA payload → call /api/chatbot/message → send reply via Meta API

STEP 3 — Meta WA reply sender (lib/meta-wa.ts):
Export sendWhatsAppMessage(to: string, text: string): Promise<void>
Export sendWhatsAppButtons(to: string, body: string, buttons: {id:string,title:string}[]): Promise<void>

STEP 4 — Testing Console — Chat tab (components/testing/ChatbotSimTab.tsx):
Dark chat UI (matches Kasih mockup from project files — image reference):
- Header: "Kasih (MyKasih Bot)" + bot avatar
- Chat bubble area (scrollable)
- Input field + Send button
- On mount: send welcome message + 4 quick reply buttons
- Calls /api/chatbot/message directly (is_test=true)
- User bubbles: right-aligned, green background
- Bot bubbles: left-aligned, surface background
- Typing indicator (animated dots) while waiting for response

Show all complete files.
```

---

## SESSION 4 — Dashboard Pages: Calls, Chat, Tickets, Beneficiaries
**Goal:** 4 core data pages fully functional
**Est:** 4–5 hrs

```
Read CLAUDE.md first.

SESSION 4: Voice Calls page, Chat Messages page, All Interactions, Tickets, Beneficiaries.

VOICE CALLS PAGE (/voice-calls):
- Title "Voice Calls" + 📞 badge showing today's count
- Filters row: Date range | Language (BM/EN/All) | Category | Outcome | Search by name
- Table columns: Timestamp, Caller Name, Location, Language, Duration, Category, Outcome, CSAT (stars), Action
- CSAT: show star icons (⭐ filled = rating)
- Row click: open TranscriptModal (full conversation view, dark styled)
- Bulk select + "Export Excel" button
- Pagination (20 per page)
- Empty state with illustration

CHAT MESSAGES PAGE (/chat-messages):
- Title "Chat Messages" + 💬 badge showing today's count
- Table columns: Timestamp, WA Number (masked last 4: +601X-XXX-XXXX), Messages, Category, Outcome, Language, Action
- Row click: open ChatThreadModal (shows full WA conversation thread style)
- Same filters as Voice Calls

ALL INTERACTIONS PAGE (/all-interactions):
- Channel toggle: [All] [📞 Voice] [💬 Chat] — highlighted when active
- Combined table showing both channels with channel badge on each row
- All same filters

TICKETS PAGE (/tickets):
- Kanban board: 3 columns — Open | In Progress | Resolved
- Each card shows: Reference No, Category, Channel badge, Date, Description preview
- Click card: TicketDetailModal with full details + linked transcript + update status dropdown
- List view toggle (table format alternative)
- Filter by category, channel, date

BENEFICIARIES PAGE (/beneficiaries):
- Search by WA number or name
- Results show: WA Number, Name, Total Interactions, Last Contact, Tickets count
- Click → Beneficiary Profile page:
  - All past interactions (voice + chat timeline)
  - All linked tickets
  - CSAT history

Show all complete files.
```

---

## SESSION 5 — Analytics, KB, Staff, Integrations, Live Monitor
**Goal:** All intelligence + system pages functional
**Est:** 3–4 hrs

```
Read CLAUDE.md first.

SESSION 5: Analytics, Knowledge Base, Staff Management, Integrations, Live Monitor.

ANALYTICS PAGE (/analytics):
- Period selector: Today | This Week | This Month | Custom range
- Top stats row: Total interactions, Resolution rate, Avg CSAT, Avg duration
- Charts (2x2 grid):
  1. Volume by day (stacked bar: voice + chat)
  2. CSAT trend over time (line chart, 1-5 scale)
  3. Language distribution (pie: BM / EN / Mixed)
  4. Peak hours heatmap (7 days × 24 hours, darker = more calls)
- Category breakdown table: category | count | % | trend arrow
- Excel export for full analytics report

KNOWLEDGE BASE PAGE (/knowledge-base):
- Table: Category | Question (BM) | Question (EN) | Active | Last Updated | Actions
- BM/EN tab toggle to see questions in either language
- Inline edit: click cell to edit answer
- Add new entry button → modal form with BM + EN fields
- Category filter dropdown
- Active/Inactive toggle per row
- "Sync to ElevenLabs" button → POST to ElevenLabs KB API → show success toast
- Search by question text

STAFF MANAGEMENT PAGE (/staff):
- Table: Name | Email | Role | Last Login | Created | Actions
- Add user button → form: name, email, role select, temp password
- Edit role dropdown inline
- Remove user (with confirmation)
- Role badge colors: admin=red, mykasih=green, qmedia=teal, supervisor=yellow

INTEGRATIONS PAGE (/integrations):
5 integration status cards (2x3 grid):
  1. ElevenLabs — agent ID, plan, status dot, "Test Connection" button
  2. Meta WhatsApp — phone number, status, "Test Webhook" button
  3. n8n Cloud — webhook URL, executions used/total, "View Workflows" link
  4. Supabase — region, DB size, storage used, "View Tables" link
  5. Anam AI — agent ID, share URL, status, "Open Demo" button
Each card: title + logo + status dot + key info + action button

LIVE MONITOR PAGE (/live-monitor):
- Auto-refresh every 10 seconds
- Active Voice Sessions: list of current ElevenLabs conversations (from ElevenLabs API)
- Active Chat Sessions: WA numbers with unresolved open chats in last 30 mins
- Each session card: channel icon, caller/user, duration/messages, category, status dot
- "No active sessions" empty state with animated pulse
- System health row: ElevenLabs latency, Supabase ping, n8n status

Show all complete files.
```

---

## SESSION 6 — Testing Console (All 3 Tabs) + AI Demo + Settings + Polish
**Goal:** All remaining pages + language toggle + production polish
**Est:** 3–4 hrs

```
Read CLAUDE.md first.

SESSION 6: Testing Console (3 tabs), AI Demo page, Settings, language toggle polish.

TESTING CONSOLE PAGE (/testing):
3 tabs using Shadcn Tabs component:

TAB 1 — Voice Agent:
  - ElevenLabs React SDK widget (@elevenlabs/react)
  - useConversation hook with agentId from env
  - Large mic button center: click to start/stop conversation
  - Status text: "Idle" | "Connecting..." | "Listening..." | "Speaking..."
  - Waveform visualizer (animated CSS when speaking)
  - All test calls automatically tagged is_test=true via contextual update
  - Last 5 test calls shown below (from Supabase where is_test=true)
  - Warning banner: "⚠️ Test calls are excluded from analytics"

TAB 2 — Kasih Chatbot Simulator:
  - Build full chat UI (dark, WhatsApp-style)
  - Calls /api/chatbot/message with is_test=true
  - Shows intent classification result below each bot message (small badge)
  - Reset conversation button
  - Export test chat as JSON button

TAB 3 — Anam AI Persona:
  - Full embed of Anam AI widget:
    <anam-agent agent-id="32d94abf-9bfd-45c4-8076-b1ea6ef9e229"></anam-agent>
    Load script: https://unpkg.com/@anam-ai/agent-widget
  - Load via next/script with strategy="lazyOnload"
  - Dark container matching dashboard theme
  - Label: "SARA AI Persona — Demo Mode"
  - Link to standalone demo page

AI DEMO PAGE (/demo):
  - Clean, minimal, client-facing design
  - MyKasih logo + "SARA AI Assistant" title
  - Full-width Anam AI embed
  - Brief description: "Tanya Sara tentang program SARA anda"
  - NO sidebar navigation (standalone page — different layout)
  - Green accent matching MyKasih brand

SETTINGS PAGE (/settings):
  - Agent Hours: time picker for start/end (default 9:00 AM – 6:00 PM)
  - Language Default: EN | BM radio select
  - Webhook URLs: display (masked) + copy button for each
  - Notification preferences: checkboxes for email alerts
  - Data retention: dropdown (30 / 60 / 90 days)
  - Save button with confirmation toast

LANGUAGE TOGGLE (polish pass):
  - lib/translations.ts: create all EN/BM strings for nav labels, page titles, status labels
  - useLanguage() hook: reads from users.language, falls back to localStorage
  - Apply translations to: sidebar labels, topbar, stat card labels, table headers
  - Language change: instant UI update + save to users table

FINAL POLISH:
  - All pages: add loading skeleton (Shadcn Skeleton) for tables + charts
  - All pages: add empty states with relevant message
  - All modals: ESC to close + backdrop click to close
  - Mobile responsive: sidebar collapses on < 768px
  - Toast notifications (Shadcn Sonner): success/error on all mutations
  - Confirm dialogs for destructive actions

Show all complete files.
```

---

## SESSION 7 — UAT Fixes + Final QA
**Goal:** All bugs resolved, PDPA audit pass, ready for handover
**Est:** 2–3 hrs (run after UAT testing)

```
Read CLAUDE.md first.

SESSION 7: Fix UAT failures, PDPA audit, performance check.

Provide list of UAT failures found during testing.
For each failure: diagnose root cause → fix → re-test.

PDPA AUDIT CHECKLIST (verify each):
□ IC masking: check Supabase records — zero plain-text ICs
□ AES-256: confirm in Supabase Pro settings
□ TLS 1.2: verify Vercel HTTPS settings
□ RLS policies: test each role can only access permitted data
□ Webhook secrets: confirm all incoming webhooks validated
□ Audit log: verify all API calls logged

PERFORMANCE CHECKS:
□ Dashboard home: loads in < 3s
□ Voice agent response: < 2s (tested in Testing Console)
□ Chatbot response: < 3s (tested in Testing Console)
□ Vercel build: zero warnings
□ Supabase query times: add indexes if any query > 100ms

UAT REPORT EXPORT:
Build: /api/export/uat-report
  - Pull all is_test=true calls from last 30 days
  - Format as Excel: test scenario | channel | outcome | pass/fail | notes
  - Summary sheet: total tests, pass rate, by category breakdown
```
