# Phase 3 Context — Kasih WhatsApp Chatbot

**Captured:** 2026-04-11
**Status:** Ready to plan

---

## Goal

Beneficiaries can send a WhatsApp message and receive instant bilingual (BM/EN) responses for FAQs, balance checks, merchant lookups, and complaint filing — all interactions saved to Supabase.

---

## Architecture

```
WA user
  ↓ Meta Cloud API
n8n Cloud Pro  ← webhook URL shown + configurable in /integrations page
  ↓ HTTP POST
Next.js /api/chatbot/message
  ↓ Claude Haiku 4.5 (intent + lang detect)
  ↓ Supabase (sessions + calls + transcripts + tickets + merchants)
  ↑ response JSON
n8n → Meta Cloud API → WA reply to user
```

---

## Confirmed Decisions

| # | Decision | Choice |
|---|----------|--------|
| 1 | Meta WA API status | Pending — build stubs now, test via Postman, go live on approval |
| 2 | n8n architecture | Option A: n8n orchestrates WA→Claude→Supabase; webhook URL in /integrations |
| 3 | Conversation state | Supabase `sessions` table — persistent, auditable, survives restarts |
| 4 | Claude model | Haiku 4.5 — intent classification only (~$0.001/msg) |
| 5 | Language | Auto-detect BM/EN from first message; lock to session for entire thread |

---

## New DB Table: sessions

```sql
create table sessions (
  id            uuid primary key default gen_random_uuid(),
  wa_phone      text not null,
  intent        text,  -- complaint | balance_check | merchant_lookup | faq
  step          integer default 0,
  collected_data jsonb default '{}',
  language      text default 'bm',
  created_at    timestamptz default now(),
  expires_at    timestamptz default now() + interval '30 minutes'
);
create index on sessions(wa_phone);
alter table sessions enable row level security;
```

Session lookup: always fetch the most recent non-expired session for a `wa_phone`.
On session completion or timeout: mark expired (or delete) and start fresh on next message.

---

## Intent Labels

| Intent | Trigger examples | Handler |
|--------|-----------------|---------|
| `faq` | "apa tu sara", "macam mana nak guna" | FAQ handler → kb_entries |
| `balance_check` | "semak baki", "berapa baki saya" | Balance handler → IC → mock API |
| `merchant_lookup` | "kedai berdekatan", "mana boleh guna" | Merchant handler → postcode/state |
| `complaint` | "ada masalah", "nak buat aduan" | Complaint handler → multi-turn → ticket |
| `unknown` | anything else | Fallback + re-prompt |

Quick reply buttons sent on **first contact** (no prior session):
- Semak baki 💳
- Kedai berdekatan 🏪
- Bantuan SARA ❓
- Status aduan 📋

---

## Handler Flows

### Balance Check
1. Ask for MyKad / IC number
2. Receive IC → `maskIC()` → store `masked_ic` in session `collected_data`
3. Call mock balance API → returns `{ name, balance, expiry, nearest_merchant }`
4. Reply: name, balance (RM), expiry date, nearest merchant name + address
5. Save completed call to `calls` table (`channel='chat'`, `category='balance_check'`)

### Merchant Lookup
1. Ask for postcode or state/city
2. Query `merchants` table via `lookupByPostcode()` or `lookupByState()`
3. Return top 3–5 results with chain, outlet name, address
4. Save call to `calls` table (`category='merchant_lookup'`)

### Complaint (multi-turn)
1. Acknowledge → ask for name
2. Ask for IC (mask immediately)
3. Ask to describe issue
4. Confirm details → create ticket via `generateTicketRef()`
5. Reply with TKT-2026-NNNNN reference number
6. Save call + transcript turns + ticket to Supabase

### FAQ
1. Detect question intent
2. Query `kb_entries` matching category, filter by `is_active=true`
3. Return answer in detected language (BM or EN)
4. Save call to `calls` table (`category='faq'`)

---

## New Files

| File | Purpose |
|------|---------|
| `lib/meta-wa.ts` | `sendWhatsAppMessage(to, text)` + `sendWhatsAppButtons(to, buttons[])` |
| `app/api/webhook/chat/route.ts` | GET (hub.challenge verify) + POST (receive WA message) |
| `app/api/chatbot/message/route.ts` | Intent classification + handler dispatch |
| `lib/chatbot/` | `intent-classifier.ts`, `faq-handler.ts`, `balance-handler.ts`, `merchant-handler.ts`, `complaint-handler.ts` |

---

## Reused from Phase 1 & 2

- `lib/ic-mask.ts` — maskIC()
- `lib/ticket-ref.ts` — generateTicketRef()
- `lib/merchant-lookup.ts` — lookupByPostcode(), lookupByState()
- `lib/supabase/server.ts` — server-side Supabase client
- `lib/translations.ts` — BM/EN strings

---

## Test Strategy

- All handlers tested via Postman with stub WA payloads (Meta WA format)
- `is_test=true` on all calls triggered from Testing Console
- Mock balance API returns deterministic fixture data keyed by IC prefix
- Complaint flow: simulate 4-turn conversation, verify ticket created in Supabase

---

## Constraints

- IC numbers: **never stored plain-text** — always `maskIC()` before any write
- Language lock: once detected, language stays for the session — no mid-session switch
- Session TTL: 30 minutes — expired sessions treated as new first contact
- n8n webhook secret: validated on every inbound POST to `/api/webhook/chat`
- Meta WA API pending: stub `sendWhatsAppMessage()` logs to console until live
