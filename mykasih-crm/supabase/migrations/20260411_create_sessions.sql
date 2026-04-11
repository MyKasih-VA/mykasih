-- Sessions table for WhatsApp chatbot conversation state
CREATE TABLE IF NOT EXISTS sessions (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wa_phone      text NOT NULL,
  wa_message_id text UNIQUE,
  intent        text CHECK (intent IN ('faq', 'balance_check', 'merchant_lookup', 'complaint', 'unknown')),
  step          integer DEFAULT 0,
  collected_data jsonb DEFAULT '{}',
  language      text DEFAULT 'bm' CHECK (language IN ('bm', 'en')),
  created_at    timestamptz DEFAULT now(),
  expires_at    timestamptz DEFAULT now() + interval '30 minutes'
);

CREATE INDEX idx_sessions_wa_phone ON sessions(wa_phone);
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);

ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

-- RLS policy: service role only (no browser access to sessions)
CREATE POLICY "Service role full access on sessions"
  ON sessions FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Add wa_message_id to calls table for chat deduplication
ALTER TABLE calls ADD COLUMN IF NOT EXISTS wa_message_id text UNIQUE;
