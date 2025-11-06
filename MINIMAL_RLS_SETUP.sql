-- =====================================================
-- BOSUN - MINIMAL RLS SETUP (Step 1 of 2)
-- =====================================================
-- This adds only the essential security policies
-- Run this first, then we'll add table-specific policies
-- =====================================================

-- =====================================================
-- STEP 1: CREATE HELPER FUNCTIONS
-- =====================================================

CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_user_member_id()
RETURNS UUID AS $$
BEGIN
  RETURN (
    SELECT member_id FROM users
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_member_id() TO authenticated;

-- =====================================================
-- STEP 2: ENABLE RLS ON ALL TABLES
-- =====================================================

ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE settlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE settlement_cycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_manual_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_documents ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- STEP 3: BASIC POLICIES (Admin can do everything)
-- =====================================================

-- MEMBERS
CREATE POLICY "Admins full access to members"
ON members FOR ALL TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

CREATE POLICY "Members view own record"
ON members FOR SELECT TO authenticated
USING (id = get_user_member_id());

-- USERS
CREATE POLICY "Admins full access to users"
ON users FOR ALL TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

CREATE POLICY "Users view own record"
ON users FOR SELECT TO authenticated
USING (id = auth.uid());

CREATE POLICY "Users update own record"
ON users FOR UPDATE TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- TRANSACTIONS
CREATE POLICY "Admins full access to transactions"
ON transactions FOR ALL TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

CREATE POLICY "Members view own transactions"
ON transactions FOR SELECT TO authenticated
USING (
  from_member_id = get_user_member_id()
  OR to_member_id = get_user_member_id()
);

CREATE POLICY "Members create transactions"
ON transactions FOR INSERT TO authenticated
WITH CHECK (from_member_id = get_user_member_id());

-- SETTLEMENTS & SETTLEMENT_CYCLES
CREATE POLICY "Admins full access to settlements"
ON settlements FOR ALL TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

CREATE POLICY "Admins full access to settlement_cycles"
ON settlement_cycles FOR ALL TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

-- Members can view settlements (adjust based on your schema)
CREATE POLICY "Members view settlements"
ON settlements FOR SELECT TO authenticated
USING (true); -- Temporarily allow all authenticated users to view

CREATE POLICY "Members view settlement_cycles"
ON settlement_cycles FOR SELECT TO authenticated
USING (true); -- Temporarily allow all authenticated users to view

-- ADMIN OVERRIDES
CREATE POLICY "Admins full access to overrides"
ON admin_manual_overrides FOR ALL TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

-- AUDIT LOGS
CREATE POLICY "Admins view audit logs"
ON audit_logs FOR SELECT TO authenticated
USING (is_admin());

CREATE POLICY "All authenticated can insert audit logs"
ON audit_logs FOR INSERT TO authenticated
WITH CHECK (true);

-- MEMBER APPLICATIONS
CREATE POLICY "Anyone can submit applications"
ON member_applications FOR INSERT TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Admins full access to applications"
ON member_applications FOR ALL TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

-- TRANSACTION DOCUMENTS
CREATE POLICY "Admins full access to transaction documents"
ON transaction_documents FOR ALL TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

CREATE POLICY "Users upload own transaction documents"
ON transaction_documents FOR INSERT TO authenticated
WITH CHECK (uploaded_by = auth.uid());

CREATE POLICY "Users view transaction documents"
ON transaction_documents FOR SELECT TO authenticated
USING (
  uploaded_by = auth.uid()
  OR is_admin()
);

-- =====================================================
-- STEP 4: STORAGE BUCKETS
-- =====================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('member-documents', 'member-documents', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('transaction-documents', 'transaction-documents', false)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- STEP 5: BASIC STORAGE POLICIES
-- =====================================================

CREATE POLICY "Auth users upload member docs"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'member-documents');

CREATE POLICY "Auth users view member docs"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'member-documents');

CREATE POLICY "Auth users upload transaction docs"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'transaction-documents');

CREATE POLICY "Auth users view transaction docs"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'transaction-documents');

-- =====================================================
-- COMPLETE! Basic RLS is now enabled.
-- =====================================================
