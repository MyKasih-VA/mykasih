CREATE TABLE ticket_notes (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id  uuid REFERENCES tickets(id) ON DELETE CASCADE,
  author     text NOT NULL,
  content    text NOT NULL,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX idx_ticket_notes_ticket_id ON ticket_notes(ticket_id);
ALTER TABLE ticket_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read ticket notes" ON ticket_notes
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can insert ticket notes" ON ticket_notes
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
