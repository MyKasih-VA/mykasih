-- Phase 7 SEC-02: Role-based RLS policies
-- Replaces all permissive 'authenticated' policies with role-based access

-- 1. Private schema + role lookup function
CREATE SCHEMA IF NOT EXISTS private;

CREATE OR REPLACE FUNCTION private.get_user_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT role FROM public.users WHERE id = (SELECT auth.uid())
$$;

-- 2. Drop existing permissive policies (CRITICAL — must happen before CREATE)
-- From supabase_migrations.sql
DROP POLICY IF EXISTS "calls_read" ON calls;
DROP POLICY IF EXISTS "calls_insert_service" ON calls;
DROP POLICY IF EXISTS "calls_update_service" ON calls;
DROP POLICY IF EXISTS "transcripts_read" ON transcripts;
DROP POLICY IF EXISTS "transcripts_insert_service" ON transcripts;
DROP POLICY IF EXISTS "tickets_read" ON tickets;
DROP POLICY IF EXISTS "tickets_insert_service" ON tickets;
DROP POLICY IF EXISTS "tickets_update_auth" ON tickets;
DROP POLICY IF EXISTS "kb_read" ON kb_entries;
DROP POLICY IF EXISTS "kb_write_auth" ON kb_entries;
DROP POLICY IF EXISTS "users_read_own" ON users;
DROP POLICY IF EXISTS "users_update_own" ON users;
DROP POLICY IF EXISTS "merchants_read" ON merchants;
DROP POLICY IF EXISTS "merchants_insert_service" ON merchants;
-- From ticket_notes migration
DROP POLICY IF EXISTS "Authenticated users can read ticket notes" ON ticket_notes;
DROP POLICY IF EXISTS "Authenticated users can insert ticket notes" ON ticket_notes;
-- DO NOT drop: "Service role full access on sessions"
-- DO NOT drop: "Service role full access on settings"

-- 3. CALLS
CREATE POLICY "calls_select" ON calls
  FOR SELECT TO authenticated
  USING (private.get_user_role() IN ('admin','mykasih','qmedia','supervisor'));

CREATE POLICY "calls_insert_admin" ON calls
  FOR INSERT TO authenticated
  WITH CHECK (private.get_user_role() = 'admin');

CREATE POLICY "calls_update_admin" ON calls
  FOR UPDATE TO authenticated
  USING (private.get_user_role() = 'admin');

CREATE POLICY "calls_delete_admin" ON calls
  FOR DELETE TO authenticated
  USING (private.get_user_role() = 'admin');

-- 4. TRANSCRIPTS
CREATE POLICY "transcripts_select" ON transcripts
  FOR SELECT TO authenticated
  USING (private.get_user_role() IN ('admin','mykasih','qmedia','supervisor'));

CREATE POLICY "transcripts_insert_admin" ON transcripts
  FOR INSERT TO authenticated
  WITH CHECK (private.get_user_role() = 'admin');

CREATE POLICY "transcripts_update_admin" ON transcripts
  FOR UPDATE TO authenticated
  USING (private.get_user_role() = 'admin');

CREATE POLICY "transcripts_delete_admin" ON transcripts
  FOR DELETE TO authenticated
  USING (private.get_user_role() = 'admin');

-- 5. TICKETS
CREATE POLICY "tickets_select" ON tickets
  FOR SELECT TO authenticated
  USING (private.get_user_role() IN ('admin','mykasih','qmedia','supervisor'));

CREATE POLICY "tickets_insert_admin" ON tickets
  FOR INSERT TO authenticated
  WITH CHECK (private.get_user_role() = 'admin');

CREATE POLICY "tickets_update_authorized" ON tickets
  FOR UPDATE TO authenticated
  USING (private.get_user_role() IN ('admin','mykasih','supervisor'))
  WITH CHECK (private.get_user_role() IN ('admin','mykasih','supervisor'));

CREATE POLICY "tickets_delete_admin" ON tickets
  FOR DELETE TO authenticated
  USING (private.get_user_role() = 'admin');

-- 6. KB_ENTRIES
CREATE POLICY "kb_select" ON kb_entries
  FOR SELECT TO authenticated
  USING (private.get_user_role() IN ('admin','mykasih'));

CREATE POLICY "kb_insert" ON kb_entries
  FOR INSERT TO authenticated
  WITH CHECK (private.get_user_role() IN ('admin','mykasih'));

CREATE POLICY "kb_update" ON kb_entries
  FOR UPDATE TO authenticated
  USING (private.get_user_role() IN ('admin','mykasih'))
  WITH CHECK (private.get_user_role() IN ('admin','mykasih'));

CREATE POLICY "kb_delete" ON kb_entries
  FOR DELETE TO authenticated
  USING (private.get_user_role() IN ('admin','mykasih'));

-- 7. USERS
CREATE POLICY "users_select" ON users
  FOR SELECT TO authenticated
  USING (
    id = (SELECT auth.uid())
    OR private.get_user_role() = 'admin'
  );

CREATE POLICY "users_insert_admin" ON users
  FOR INSERT TO authenticated
  WITH CHECK (private.get_user_role() = 'admin');

CREATE POLICY "users_update" ON users
  FOR UPDATE TO authenticated
  USING (id = (SELECT auth.uid()) OR private.get_user_role() = 'admin')
  WITH CHECK (id = (SELECT auth.uid()) OR private.get_user_role() = 'admin');

CREATE POLICY "users_delete_admin" ON users
  FOR DELETE TO authenticated
  USING (private.get_user_role() = 'admin');

-- 8. MERCHANTS
CREATE POLICY "merchants_select" ON merchants
  FOR SELECT TO authenticated
  USING (private.get_user_role() IN ('admin','mykasih','qmedia','supervisor'));

CREATE POLICY "merchants_insert_admin" ON merchants
  FOR INSERT TO authenticated
  WITH CHECK (private.get_user_role() = 'admin');

CREATE POLICY "merchants_update_admin" ON merchants
  FOR UPDATE TO authenticated
  USING (private.get_user_role() = 'admin');

CREATE POLICY "merchants_delete_admin" ON merchants
  FOR DELETE TO authenticated
  USING (private.get_user_role() = 'admin');

-- 9. SESSIONS (add role-based policies alongside existing service_role policy)
CREATE POLICY "sessions_select" ON sessions
  FOR SELECT TO authenticated
  USING (private.get_user_role() IN ('admin','mykasih','supervisor'));

CREATE POLICY "sessions_insert_admin" ON sessions
  FOR INSERT TO authenticated
  WITH CHECK (private.get_user_role() = 'admin');

CREATE POLICY "sessions_update_admin" ON sessions
  FOR UPDATE TO authenticated
  USING (private.get_user_role() = 'admin');

CREATE POLICY "sessions_delete_admin" ON sessions
  FOR DELETE TO authenticated
  USING (private.get_user_role() = 'admin');

-- 10. SETTINGS (add role-based policies alongside existing service_role policy)
CREATE POLICY "settings_select_admin" ON settings
  FOR SELECT TO authenticated
  USING (private.get_user_role() = 'admin');

CREATE POLICY "settings_insert_admin" ON settings
  FOR INSERT TO authenticated
  WITH CHECK (private.get_user_role() = 'admin');

CREATE POLICY "settings_update_admin" ON settings
  FOR UPDATE TO authenticated
  USING (private.get_user_role() = 'admin')
  WITH CHECK (private.get_user_role() = 'admin');

CREATE POLICY "settings_delete_admin" ON settings
  FOR DELETE TO authenticated
  USING (private.get_user_role() = 'admin');

-- 11. TICKET_NOTES
CREATE POLICY "ticket_notes_select" ON ticket_notes
  FOR SELECT TO authenticated
  USING (private.get_user_role() IN ('admin','mykasih','qmedia','supervisor'));

CREATE POLICY "ticket_notes_insert_authorized" ON ticket_notes
  FOR INSERT TO authenticated
  WITH CHECK (private.get_user_role() IN ('admin','mykasih','supervisor'));

CREATE POLICY "ticket_notes_update_admin" ON ticket_notes
  FOR UPDATE TO authenticated
  USING (private.get_user_role() = 'admin');

CREATE POLICY "ticket_notes_delete_admin" ON ticket_notes
  FOR DELETE TO authenticated
  USING (private.get_user_role() = 'admin');
