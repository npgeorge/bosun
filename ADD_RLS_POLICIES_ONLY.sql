-- =====================================================
-- BOSUN - ADD RLS POLICIES TO EXISTING DATABASE
-- =====================================================
-- Run this on your existing database with tables already created
-- =====================================================

-- =====================================================
-- PART 1: HELPER FUNCTIONS
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
-- PART 2: ENABLE RLS ON ALL TABLES
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
-- PART 3: DROP EXISTING POLICIES (if any)
-- =====================================================

DO $$
BEGIN
    -- Members
    DROP POLICY IF EXISTS "Admins can view all members" ON members;
    DROP POLICY IF EXISTS "Members can view their own record" ON members;
    DROP POLICY IF EXISTS "Admins can insert members" ON members;
    DROP POLICY IF EXISTS "Admins can update members" ON members;

    -- Users
    DROP POLICY IF EXISTS "Users can view their own record" ON users;
    DROP POLICY IF EXISTS "Admins can view all users" ON users;
    DROP POLICY IF EXISTS "Admins can insert users" ON users;
    DROP POLICY IF EXISTS "Users can update their own record" ON users;
    DROP POLICY IF EXISTS "Admins can update any user" ON users;

    -- Transactions
    DROP POLICY IF EXISTS "Members can view their own transactions" ON transactions;
    DROP POLICY IF EXISTS "Members can create transactions" ON transactions;
    DROP POLICY IF EXISTS "Members can update their pending transactions" ON transactions;
    DROP POLICY IF EXISTS "Admins can update any transaction" ON transactions;

    -- Settlements
    DROP POLICY IF EXISTS "Members can view their settlements" ON settlements;
    DROP POLICY IF EXISTS "Admins can create settlements" ON settlements;
    DROP POLICY IF EXISTS "Admins can update settlements" ON settlements;

    -- Settlement Cycles
    DROP POLICY IF EXISTS "Members can view their settlement cycles" ON settlement_cycles;
    DROP POLICY IF EXISTS "Admins can create settlement cycles" ON settlement_cycles;
    DROP POLICY IF EXISTS "Admins can update settlement cycles" ON settlement_cycles;

    -- Overrides
    DROP POLICY IF EXISTS "Admins can view overrides" ON admin_manual_overrides;
    DROP POLICY IF EXISTS "Admins can create overrides" ON admin_manual_overrides;

    -- Audit
    DROP POLICY IF EXISTS "Admins can view audit logs" ON audit_logs;
    DROP POLICY IF EXISTS "Authenticated users can create audit logs" ON audit_logs;

    -- Applications
    DROP POLICY IF EXISTS "Anyone can submit applications" ON member_applications;
    DROP POLICY IF EXISTS "Users can view their own applications" ON member_applications;
    DROP POLICY IF EXISTS "Admins can view all applications" ON member_applications;
    DROP POLICY IF EXISTS "Admins can update applications" ON member_applications;

    -- Documents
    DROP POLICY IF EXISTS "Users can view transaction documents for their member" ON transaction_documents;
    DROP POLICY IF EXISTS "Users can upload documents for their transactions" ON transaction_documents;
    DROP POLICY IF EXISTS "Users can delete their own uploaded documents" ON transaction_documents;
    DROP POLICY IF EXISTS "Admins can view all transaction documents" ON transaction_documents;
END $$;

-- =====================================================
-- PART 4: CREATE RLS POLICIES
-- =====================================================

-- MEMBERS POLICIES
CREATE POLICY "Admins can view all members"
ON members FOR SELECT TO authenticated
USING (is_admin());

CREATE POLICY "Members can view their own record"
ON members FOR SELECT TO authenticated
USING (id = get_user_member_id());

CREATE POLICY "Admins can insert members"
ON members FOR INSERT TO authenticated
WITH CHECK (is_admin());

CREATE POLICY "Admins can update members"
ON members FOR UPDATE TO authenticated
USING (is_admin());

-- USERS POLICIES
CREATE POLICY "Users can view their own record"
ON users FOR SELECT TO authenticated
USING (id = auth.uid());

CREATE POLICY "Admins can view all users"
ON users FOR SELECT TO authenticated
USING (is_admin());

CREATE POLICY "Admins can insert users"
ON users FOR INSERT TO authenticated
WITH CHECK (is_admin());

CREATE POLICY "Users can update their own record"
ON users FOR UPDATE TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

CREATE POLICY "Admins can update any user"
ON users FOR UPDATE TO authenticated
USING (is_admin());

-- TRANSACTIONS POLICIES
CREATE POLICY "Members can view their own transactions"
ON transactions FOR SELECT TO authenticated
USING (
  from_member_id = get_user_member_id()
  OR to_member_id = get_user_member_id()
  OR is_admin()
);

CREATE POLICY "Members can create transactions"
ON transactions FOR INSERT TO authenticated
WITH CHECK (
  from_member_id = get_user_member_id()
  OR is_admin()
);

CREATE POLICY "Members can update their pending transactions"
ON transactions FOR UPDATE TO authenticated
USING (
  (from_member_id = get_user_member_id() OR to_member_id = get_user_member_id())
  AND status = 'pending'
)
WITH CHECK (
  (from_member_id = get_user_member_id() OR to_member_id = get_user_member_id())
  AND status = 'pending'
);

CREATE POLICY "Admins can update any transaction"
ON transactions FOR UPDATE TO authenticated
USING (is_admin());

-- SETTLEMENTS POLICIES (works with your existing settlements table)
CREATE POLICY "Members can view their settlements"
ON settlements FOR SELECT TO authenticated
USING (is_admin()); -- Adjust based on your settlements table structure

CREATE POLICY "Admins can create settlements"
ON settlements FOR INSERT TO authenticated
WITH CHECK (is_admin());

CREATE POLICY "Admins can update settlements"
ON settlements FOR UPDATE TO authenticated
USING (is_admin());

-- SETTLEMENT CYCLES POLICIES
CREATE POLICY "Members can view their settlement cycles"
ON settlement_cycles FOR SELECT TO authenticated
USING (is_admin()); -- Adjust based on your settlement_cycles table structure

CREATE POLICY "Admins can create settlement cycles"
ON settlement_cycles FOR INSERT TO authenticated
WITH CHECK (is_admin());

CREATE POLICY "Admins can update settlement cycles"
ON settlement_cycles FOR UPDATE TO authenticated
USING (is_admin());

-- ADMIN OVERRIDES POLICIES
CREATE POLICY "Admins can view overrides"
ON admin_manual_overrides FOR SELECT TO authenticated
USING (is_admin());

CREATE POLICY "Admins can create overrides"
ON admin_manual_overrides FOR INSERT TO authenticated
WITH CHECK (is_admin());

-- AUDIT LOGS POLICIES
CREATE POLICY "Admins can view audit logs"
ON audit_logs FOR SELECT TO authenticated
USING (is_admin());

CREATE POLICY "Authenticated users can create audit logs"
ON audit_logs FOR INSERT TO authenticated
WITH CHECK (true);

-- MEMBER APPLICATIONS POLICIES
CREATE POLICY "Anyone can submit applications"
ON member_applications FOR INSERT TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Users can view their own applications"
ON member_applications FOR SELECT TO authenticated
USING (contact_email = (SELECT email FROM users WHERE id = auth.uid()));

CREATE POLICY "Admins can view all applications"
ON member_applications FOR SELECT TO authenticated
USING (is_admin());

CREATE POLICY "Admins can update applications"
ON member_applications FOR UPDATE TO authenticated
USING (is_admin());

-- TRANSACTION DOCUMENTS POLICIES
CREATE POLICY "Users can view transaction documents for their member"
ON transaction_documents FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM transactions t
    INNER JOIN users u ON u.id = auth.uid()
    WHERE t.id = transaction_documents.transaction_id
    AND (t.from_member_id = u.member_id OR t.to_member_id = u.member_id)
  )
  OR is_admin()
);

CREATE POLICY "Users can upload documents for their transactions"
ON transaction_documents FOR INSERT TO authenticated
WITH CHECK (
  uploaded_by = auth.uid()
);

CREATE POLICY "Users can delete their own uploaded documents"
ON transaction_documents FOR DELETE TO authenticated
USING (uploaded_by = auth.uid());

CREATE POLICY "Admins can view all transaction documents"
ON transaction_documents FOR SELECT TO authenticated
USING (is_admin());

-- =====================================================
-- PART 5: STORAGE BUCKETS
-- =====================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('member-documents', 'member-documents', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('transaction-documents', 'transaction-documents', false)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- PART 6: STORAGE POLICIES
-- =====================================================

DO $$
BEGIN
    DROP POLICY IF EXISTS "Auth users upload own docs" ON storage.objects;
    DROP POLICY IF EXISTS "Admins view all docs" ON storage.objects;
    DROP POLICY IF EXISTS "Users view own docs" ON storage.objects;
    DROP POLICY IF EXISTS "Admins update docs" ON storage.objects;
    DROP POLICY IF EXISTS "Admins delete docs" ON storage.objects;
    DROP POLICY IF EXISTS "Upload transaction docs" ON storage.objects;
    DROP POLICY IF EXISTS "View transaction docs" ON storage.objects;
    DROP POLICY IF EXISTS "Delete own transaction docs" ON storage.objects;
END $$;

CREATE POLICY "Auth users upload own docs"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'member-documents'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Admins view all docs"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'member-documents'
  AND is_admin()
);

CREATE POLICY "Users view own docs"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'member-documents'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Admins update docs"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'member-documents'
  AND is_admin()
);

CREATE POLICY "Admins delete docs"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'member-documents'
  AND is_admin()
);

CREATE POLICY "Upload transaction docs"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'transaction-documents'
);

CREATE POLICY "View transaction docs"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'transaction-documents'
);

CREATE POLICY "Delete own transaction docs"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'transaction-documents'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- =====================================================
-- COMPLETE!
-- =====================================================
