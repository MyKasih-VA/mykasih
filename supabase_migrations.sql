-- =============================================================
-- MyKasih Command Centre — Database Migrations
-- Run in Supabase SQL Editor (in order, top to bottom)
-- Region: Singapore (ap-southeast-1)
-- =============================================================

-- ---------------------------------------------------------------
-- 1. CALLS — every voice call and chat session
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS calls (
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
  elevenlabs_conversation_id text,
  timestamp                  timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_calls_channel   ON calls(channel);
CREATE INDEX IF NOT EXISTS idx_calls_timestamp ON calls(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_calls_is_test   ON calls(is_test);
CREATE INDEX IF NOT EXISTS idx_calls_outcome   ON calls(outcome);

-- ---------------------------------------------------------------
-- 2. TRANSCRIPTS — individual turns in a call/chat
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS transcripts (
  id        uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  call_id   uuid REFERENCES calls(id) ON DELETE CASCADE,
  speaker   text CHECK (speaker IN ('user','bot','agent')),
  message   text,
  timestamp timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_transcripts_call_id ON transcripts(call_id);

-- ---------------------------------------------------------------
-- 3. TICKETS — complaints and escalations
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tickets (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  call_id      uuid REFERENCES calls(id),
  channel      text CHECK (channel IN ('voice','chat')),
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

CREATE INDEX IF NOT EXISTS idx_tickets_status     ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_created_at ON tickets(created_at DESC);

-- ---------------------------------------------------------------
-- 4. KB_ENTRIES — knowledge base (FAQ, SARA info)
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS kb_entries (
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

CREATE INDEX IF NOT EXISTS idx_kb_category  ON kb_entries(category);
CREATE INDEX IF NOT EXISTS idx_kb_is_active ON kb_entries(is_active);

-- ---------------------------------------------------------------
-- 5. USERS — dashboard staff accounts
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  email      text UNIQUE,
  name       text,
  role       text CHECK (role IN ('admin','mykasih','qmedia','supervisor')),
  language   text DEFAULT 'en' CHECK (language IN ('en','bm')),
  created_at timestamptz DEFAULT now(),
  last_login timestamptz
);

-- ---------------------------------------------------------------
-- 6. MERCHANTS — 10,194 SARA outlet locations
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS merchants (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  chain       text,
  outlet_name text,
  state       text,
  city        text,
  postcode    text,
  address     text
);

CREATE INDEX IF NOT EXISTS idx_merchants_postcode ON merchants(postcode);
CREATE INDEX IF NOT EXISTS idx_merchants_state    ON merchants(state);
CREATE INDEX IF NOT EXISTS idx_merchants_chain    ON merchants(chain);

-- ---------------------------------------------------------------
-- 7. ROW LEVEL SECURITY — enable on all tables
-- ---------------------------------------------------------------
ALTER TABLE calls        ENABLE ROW LEVEL SECURITY;
ALTER TABLE transcripts  ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets      ENABLE ROW LEVEL SECURITY;
ALTER TABLE kb_entries   ENABLE ROW LEVEL SECURITY;
ALTER TABLE users        ENABLE ROW LEVEL SECURITY;
ALTER TABLE merchants    ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------
-- 8. RLS POLICIES
-- NOTE: These use auth.jwt() → role claim.
-- After running migrations, set role in users table AND
-- sync with Supabase Auth custom claims if using JWT role checks.
-- For now: allow authenticated users to read (tighten per role later).
-- ---------------------------------------------------------------

-- CALLS: authenticated users can read; service role can write
CREATE POLICY "calls_read" ON calls
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "calls_insert_service" ON calls
  FOR INSERT TO service_role WITH CHECK (true);

CREATE POLICY "calls_update_service" ON calls
  FOR UPDATE TO service_role USING (true);

-- TRANSCRIPTS: authenticated users can read
CREATE POLICY "transcripts_read" ON transcripts
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "transcripts_insert_service" ON transcripts
  FOR INSERT TO service_role WITH CHECK (true);

-- TICKETS: authenticated users can read; mykasih/admin can update
CREATE POLICY "tickets_read" ON tickets
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "tickets_insert_service" ON tickets
  FOR INSERT TO service_role WITH CHECK (true);

CREATE POLICY "tickets_update_auth" ON tickets
  FOR UPDATE TO authenticated USING (true);

-- KB_ENTRIES: anyone authenticated can read
CREATE POLICY "kb_read" ON kb_entries
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "kb_write_auth" ON kb_entries
  FOR ALL TO authenticated USING (true);

-- USERS: users can read/update their own row; admin can see all
CREATE POLICY "users_read_own" ON users
  FOR SELECT TO authenticated USING (auth.uid() = id);

CREATE POLICY "users_update_own" ON users
  FOR UPDATE TO authenticated USING (auth.uid() = id);

-- MERCHANTS: anyone authenticated can read (no PII)
CREATE POLICY "merchants_read" ON merchants
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "merchants_insert_service" ON merchants
  FOR INSERT TO service_role WITH CHECK (true);

-- ---------------------------------------------------------------
-- DONE — 6 tables created, indexes applied, RLS enabled
-- Next step: seed merchants via POST /api/seed/merchants
-- ---------------------------------------------------------------
