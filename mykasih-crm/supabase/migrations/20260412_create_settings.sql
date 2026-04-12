CREATE TABLE IF NOT EXISTS settings (
  key        text PRIMARY KEY,
  value      text NOT NULL,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Service role only — settings are admin-managed via API route
CREATE POLICY "Service role full access on settings"
  ON settings FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Seed defaults so GET /api/settings returns values immediately
INSERT INTO settings (key, value) VALUES
  ('agent_hours_start', '08:00'),
  ('agent_hours_end',   '17:00'),
  ('notification_email', ''),
  ('data_retention_days', '90')
ON CONFLICT (key) DO NOTHING;
