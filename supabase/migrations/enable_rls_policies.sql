-- =====================================================
-- BOSUN PLATFORM - ROW LEVEL SECURITY POLICIES
-- =====================================================
-- This migration enables RLS on all tables and creates
-- appropriate security policies for production use
-- =====================================================

-- =====================================================
-- ENABLE RLS ON ALL TABLES
-- =====================================================

ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE settlement_cycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE settlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_manual_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_applications ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to check if current user is an admin
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

-- Function to get current user's member_id
CREATE OR REPLACE FUNCTION get_user_member_id()
RETURNS UUID AS $$
BEGIN
  RETURN (
    SELECT member_id FROM users
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- MEMBERS TABLE POLICIES
-- =====================================================

-- Admins can view all members
CREATE POLICY "Admins can view all members"
ON members FOR SELECT
TO authenticated
USING (is_admin());

-- Members can view their own member record
CREATE POLICY "Members can view their own record"
ON members FOR SELECT
TO authenticated
USING (id = get_user_member_id());

-- Admins can insert members (during approval process)
CREATE POLICY "Admins can insert members"
ON members FOR INSERT
TO authenticated
WITH CHECK (is_admin());

-- Admins can update members
CREATE POLICY "Admins can update members"
ON members FOR UPDATE
TO authenticated
USING (is_admin());

-- =====================================================
-- USERS TABLE POLICIES
-- =====================================================

-- Users can view their own user record
CREATE POLICY "Users can view their own record"
ON users FOR SELECT
TO authenticated
USING (id = auth.uid());

-- Admins can view all users
CREATE POLICY "Admins can view all users"
ON users FOR SELECT
TO authenticated
USING (is_admin());

-- Admins can insert users (during member approval)
CREATE POLICY "Admins can insert users"
ON users FOR INSERT
TO authenticated
WITH CHECK (is_admin());

-- Users can update their own record (name, last_login)
CREATE POLICY "Users can update their own record"
ON users FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- Admins can update any user
CREATE POLICY "Admins can update any user"
ON users FOR UPDATE
TO authenticated
USING (is_admin());

-- =====================================================
-- TRANSACTIONS TABLE POLICIES
-- =====================================================

-- Members can view transactions where they are involved
CREATE POLICY "Members can view their own transactions"
ON transactions FOR SELECT
TO authenticated
USING (
  from_member_id = get_user_member_id()
  OR to_member_id = get_user_member_id()
  OR is_admin()
);

-- Members can insert transactions where they are the sender
CREATE POLICY "Members can create transactions"
ON transactions FOR INSERT
TO authenticated
WITH CHECK (
  from_member_id = get_user_member_id()
  OR is_admin()
);

-- Members can update their own pending transactions
CREATE POLICY "Members can update their pending transactions"
ON transactions FOR UPDATE
TO authenticated
USING (
  (from_member_id = get_user_member_id() OR to_member_id = get_user_member_id())
  AND status = 'pending'
)
WITH CHECK (
  (from_member_id = get_user_member_id() OR to_member_id = get_user_member_id())
  AND status = 'pending'
);

-- Admins can update any transaction
CREATE POLICY "Admins can update any transaction"
ON transactions FOR UPDATE
TO authenticated
USING (is_admin());

-- =====================================================
-- SETTLEMENT_CYCLES TABLE POLICIES
-- =====================================================

-- Members can view settlement cycles they participated in
CREATE POLICY "Members can view their settlement cycles"
ON settlement_cycles FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM settlements s
    WHERE s.settlement_cycle_id = settlement_cycles.id
    AND (s.from_member_id = get_user_member_id() OR s.to_member_id = get_user_member_id())
  )
  OR is_admin()
);

-- Only admins can create settlement cycles
CREATE POLICY "Admins can create settlement cycles"
ON settlement_cycles FOR INSERT
TO authenticated
WITH CHECK (is_admin());

-- Only admins can update settlement cycles
CREATE POLICY "Admins can update settlement cycles"
ON settlement_cycles FOR UPDATE
TO authenticated
USING (is_admin());

-- =====================================================
-- SETTLEMENTS TABLE POLICIES
-- =====================================================

-- Members can view their own settlements
CREATE POLICY "Members can view their settlements"
ON settlements FOR SELECT
TO authenticated
USING (
  from_member_id = get_user_member_id()
  OR to_member_id = get_user_member_id()
  OR is_admin()
);

-- Only admins can create settlements
CREATE POLICY "Admins can create settlements"
ON settlements FOR INSERT
TO authenticated
WITH CHECK (is_admin());

-- Only admins can update settlements
CREATE POLICY "Admins can update settlements"
ON settlements FOR UPDATE
TO authenticated
USING (is_admin());

-- =====================================================
-- ADMIN_MANUAL_OVERRIDES TABLE POLICIES
-- =====================================================

-- Only admins can view overrides
CREATE POLICY "Admins can view overrides"
ON admin_manual_overrides FOR SELECT
TO authenticated
USING (is_admin());

-- Only admins can create overrides
CREATE POLICY "Admins can create overrides"
ON admin_manual_overrides FOR INSERT
TO authenticated
WITH CHECK (is_admin());

-- =====================================================
-- AUDIT_LOGS TABLE POLICIES
-- =====================================================

-- Only admins can view audit logs
CREATE POLICY "Admins can view audit logs"
ON audit_logs FOR SELECT
TO authenticated
USING (is_admin());

-- All authenticated users can insert audit logs (for tracking)
CREATE POLICY "Authenticated users can create audit logs"
ON audit_logs FOR INSERT
TO authenticated
WITH CHECK (true);

-- =====================================================
-- MEMBER_APPLICATIONS TABLE POLICIES
-- =====================================================

-- Anyone can insert applications (public registration)
CREATE POLICY "Anyone can submit applications"
ON member_applications FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Users can view their own applications
CREATE POLICY "Users can view their own applications"
ON member_applications FOR SELECT
TO authenticated
USING (contact_email = (SELECT email FROM users WHERE id = auth.uid()));

-- Admins can view all applications
CREATE POLICY "Admins can view all applications"
ON member_applications FOR SELECT
TO authenticated
USING (is_admin());

-- Admins can update applications (approve/reject)
CREATE POLICY "Admins can update applications"
ON member_applications FOR UPDATE
TO authenticated
USING (is_admin());

-- =====================================================
-- STORAGE BUCKET POLICIES
-- =====================================================

-- Note: Storage policies must be created in Supabase dashboard
-- or via separate storage API calls. The policies should be:

-- 1. member-documents bucket:
--    - INSERT: Authenticated users can upload their own documents
--    - SELECT: Admins can view all, applicants can view their own
--    - UPDATE/DELETE: Only admins

-- SQL Comments for reference:
-- CREATE POLICY "Authenticated users can upload documents"
-- ON storage.objects FOR INSERT
-- TO authenticated
-- WITH CHECK (bucket_id = 'member-documents');

-- CREATE POLICY "Admins can view all documents"
-- ON storage.objects FOR SELECT
-- TO authenticated
-- USING (bucket_id = 'member-documents' AND is_admin());

-- CREATE POLICY "Users can view their own documents"
-- ON storage.objects FOR SELECT
-- TO authenticated
-- USING (
--   bucket_id = 'member-documents'
--   AND (storage.foldername(name))[1] = auth.uid()::text
-- );

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

-- Grant execute permission on helper functions
GRANT EXECUTE ON FUNCTION is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_member_id() TO authenticated;

-- =====================================================
-- VERIFY RLS IS ENABLED
-- =====================================================

-- Query to verify RLS is enabled on all tables:
-- SELECT tablename, rowsecurity
-- FROM pg_tables
-- WHERE schemaname = 'public'
-- AND tablename IN ('members', 'users', 'transactions', 'settlement_cycles', 'settlements', 'admin_manual_overrides', 'audit_logs', 'member_applications');
