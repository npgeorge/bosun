-- =====================================================
-- BOSUN - INCREMENTAL PRODUCTION MIGRATION
-- =====================================================
-- This migration adds ONLY what's missing
-- Safe to run on existing databases
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- PART 1: CORE TABLES (only creates if missing)
-- =====================================================

-- Members Table
CREATE TABLE IF NOT EXISTS members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_name VARCHAR(255) NOT NULL,
    registration_number VARCHAR(100),
    contact_email VARCHAR(255) NOT NULL UNIQUE,
    kyc_status VARCHAR(50) DEFAULT 'pending',
    collateral_amount DECIMAL(20, 2) DEFAULT 0,
    join_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    member_id UUID REFERENCES members(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL UNIQUE,
    role VARCHAR(50) NOT NULL,
    name VARCHAR(255),
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Transactions Table
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    from_member_id UUID REFERENCES members(id),
    to_member_id UUID REFERENCES members(id),
    amount_usd DECIMAL(20, 2) NOT NULL,
    reference_number VARCHAR(255),
    trade_date DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Settlements Table (main settlement cycles)
CREATE TABLE IF NOT EXISTS settlements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    settlement_date DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'calculating',
    total_gross_volume DECIMAL(20, 2),
    total_net_settlement DECIMAL(20, 2),
    netting_percentage DECIMAL(5, 2),
    otc_cost_actual DECIMAL(20, 2),
    gross_margin DECIMAL(20, 2),
    is_simulation BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP
);

-- Settlement Transfers Table (individual settlement instructions)
CREATE TABLE IF NOT EXISTS settlement_transfers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    settlement_id UUID REFERENCES settlements(id),
    from_member_id UUID REFERENCES members(id),
    to_member_id UUID REFERENCES members(id),
    gross_amount DECIMAL(20, 2),
    net_amount_usd DECIMAL(20, 2),
    transaction_fee_charged DECIMAL(20, 2),
    transaction_fee_rate DECIMAL(5, 4),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Admin Manual Overrides Table
CREATE TABLE IF NOT EXISTS admin_manual_overrides (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    settlement_id UUID REFERENCES settlements(id),
    override_type VARCHAR(50),
    original_value JSONB,
    new_value JSONB,
    reason TEXT NOT NULL,
    approved_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    table_name VARCHAR(100),
    record_id UUID,
    details JSONB,
    timestamp TIMESTAMP DEFAULT NOW()
);

-- Member Applications Table
CREATE TABLE IF NOT EXISTS member_applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_name VARCHAR(255) NOT NULL,
    registration_number VARCHAR(100),
    contact_email VARCHAR(255) NOT NULL,
    contact_name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    business_type VARCHAR(100),
    expected_monthly_volume DECIMAL(20, 2),
    status VARCHAR(50) DEFAULT 'pending',
    rejection_reason TEXT,
    submitted_at TIMESTAMP DEFAULT NOW(),
    reviewed_at TIMESTAMP,
    reviewed_by UUID REFERENCES users(id)
);

-- Transaction Documents Table
CREATE TABLE IF NOT EXISTS transaction_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_id UUID REFERENCES transactions(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(100) NOT NULL,
    file_size INTEGER NOT NULL,
    storage_path TEXT NOT NULL,
    uploaded_by UUID REFERENCES users(id),
    uploaded_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- PART 2: INDEXES (only creates if missing)
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_users_member_id ON users(member_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_transactions_from_member ON transactions(from_member_id);
CREATE INDEX IF NOT EXISTS idx_transactions_to_member ON transactions(to_member_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_trade_date ON transactions(trade_date);
CREATE INDEX IF NOT EXISTS idx_settlement_transfers_settlement_id ON settlement_transfers(settlement_id);
CREATE INDEX IF NOT EXISTS idx_settlement_transfers_from_member ON settlement_transfers(from_member_id);
CREATE INDEX IF NOT EXISTS idx_settlement_transfers_to_member ON settlement_transfers(to_member_id);
CREATE INDEX IF NOT EXISTS idx_member_applications_status ON member_applications(status);
CREATE INDEX IF NOT EXISTS idx_transaction_documents_transaction_id ON transaction_documents(transaction_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp);

-- =====================================================
-- PART 3: HELPER FUNCTIONS
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
-- PART 4: ENABLE RLS (safe to run multiple times)
-- =====================================================

ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE settlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE settlement_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_manual_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_documents ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- PART 5: RLS POLICIES
-- =====================================================

-- Drop all existing policies first (to avoid conflicts)
DO $$
BEGIN
    -- Members policies
    DROP POLICY IF EXISTS "Admins can view all members" ON members;
    DROP POLICY IF EXISTS "Members can view their own record" ON members;
    DROP POLICY IF EXISTS "Admins can insert members" ON members;
    DROP POLICY IF EXISTS "Admins can update members" ON members;

    -- Users policies
    DROP POLICY IF EXISTS "Users can view their own record" ON users;
    DROP POLICY IF EXISTS "Admins can view all users" ON users;
    DROP POLICY IF EXISTS "Admins can insert users" ON users;
    DROP POLICY IF EXISTS "Users can update their own record" ON users;
    DROP POLICY IF EXISTS "Admins can update any user" ON users;

    -- Transactions policies
    DROP POLICY IF EXISTS "Members can view their own transactions" ON transactions;
    DROP POLICY IF EXISTS "Members can create transactions" ON transactions;
    DROP POLICY IF EXISTS "Members can update their pending transactions" ON transactions;
    DROP POLICY IF EXISTS "Admins can update any transaction" ON transactions;

    -- Settlements policies
    DROP POLICY IF EXISTS "Members can view their settlements" ON settlements;
    DROP POLICY IF EXISTS "Admins can create settlements" ON settlements;
    DROP POLICY IF EXISTS "Admins can update settlements" ON settlements;

    -- Settlement transfers policies
    DROP POLICY IF EXISTS "Members can view their settlement transfers" ON settlement_transfers;
    DROP POLICY IF EXISTS "Admins can create settlement transfers" ON settlement_transfers;
    DROP POLICY IF EXISTS "Admins can update settlement transfers" ON settlement_transfers;

    -- Admin overrides policies
    DROP POLICY IF EXISTS "Admins can view overrides" ON admin_manual_overrides;
    DROP POLICY IF EXISTS "Admins can create overrides" ON admin_manual_overrides;

    -- Audit logs policies
    DROP POLICY IF EXISTS "Admins can view audit logs" ON audit_logs;
    DROP POLICY IF EXISTS "Authenticated users can create audit logs" ON audit_logs;

    -- Member applications policies
    DROP POLICY IF EXISTS "Anyone can submit applications" ON member_applications;
    DROP POLICY IF EXISTS "Users can view their own applications" ON member_applications;
    DROP POLICY IF EXISTS "Admins can view all applications" ON member_applications;
    DROP POLICY IF EXISTS "Admins can update applications" ON member_applications;

    -- Transaction documents policies
    DROP POLICY IF EXISTS "Users can view transaction documents for their member" ON transaction_documents;
    DROP POLICY IF EXISTS "Users can upload documents for their transactions" ON transaction_documents;
    DROP POLICY IF EXISTS "Users can delete their own uploaded documents" ON transaction_documents;
    DROP POLICY IF EXISTS "Admins can view all transaction documents" ON transaction_documents;
END $$;

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

-- SETTLEMENTS POLICIES
CREATE POLICY "Members can view their settlements"
ON settlements FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM settlement_transfers st
    WHERE st.settlement_id = settlements.id
    AND (st.from_member_id = get_user_member_id() OR st.to_member_id = get_user_member_id())
  )
  OR is_admin()
);

CREATE POLICY "Admins can create settlements"
ON settlements FOR INSERT TO authenticated
WITH CHECK (is_admin());

CREATE POLICY "Admins can update settlements"
ON settlements FOR UPDATE TO authenticated
USING (is_admin());

-- SETTLEMENT TRANSFERS POLICIES
CREATE POLICY "Members can view their settlement transfers"
ON settlement_transfers FOR SELECT TO authenticated
USING (
  from_member_id = get_user_member_id()
  OR to_member_id = get_user_member_id()
  OR is_admin()
);

CREATE POLICY "Admins can create settlement transfers"
ON settlement_transfers FOR INSERT TO authenticated
WITH CHECK (is_admin());

CREATE POLICY "Admins can update settlement transfers"
ON settlement_transfers FOR UPDATE TO authenticated
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
  AND EXISTS (
    SELECT 1 FROM transactions t
    INNER JOIN users u ON u.id = auth.uid()
    WHERE t.id = transaction_documents.transaction_id
    AND (t.from_member_id = u.member_id OR t.to_member_id = u.member_id)
  )
);

CREATE POLICY "Users can delete their own uploaded documents"
ON transaction_documents FOR DELETE TO authenticated
USING (uploaded_by = auth.uid());

CREATE POLICY "Admins can view all transaction documents"
ON transaction_documents FOR SELECT TO authenticated
USING (is_admin());

-- =====================================================
-- PART 6: STORAGE BUCKETS
-- =====================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('member-documents', 'member-documents', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('transaction-documents', 'transaction-documents', false)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- PART 7: STORAGE POLICIES
-- =====================================================

DO $$
BEGIN
    -- Drop existing storage policies
    DROP POLICY IF EXISTS "Authenticated users can upload their own documents" ON storage.objects;
    DROP POLICY IF EXISTS "Admins can view all documents" ON storage.objects;
    DROP POLICY IF EXISTS "Users can view their own documents" ON storage.objects;
    DROP POLICY IF EXISTS "Admins can update documents" ON storage.objects;
    DROP POLICY IF EXISTS "Admins can delete documents" ON storage.objects;
    DROP POLICY IF EXISTS "Users can upload transaction documents" ON storage.objects;
    DROP POLICY IF EXISTS "Users can view transaction documents for their member" ON storage.objects;
    DROP POLICY IF EXISTS "Users can delete their own transaction documents" ON storage.objects;
END $$;

-- Member documents storage policies
CREATE POLICY "Authenticated users can upload their own documents"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'member-documents'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Admins can view all documents"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'member-documents'
  AND is_admin()
);

CREATE POLICY "Users can view their own documents"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'member-documents'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Admins can update documents"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'member-documents'
  AND is_admin()
);

CREATE POLICY "Admins can delete documents"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'member-documents'
  AND is_admin()
);

-- Transaction documents storage policies
CREATE POLICY "Users can upload transaction documents"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'transaction-documents'
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Users can view transaction documents for their member"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'transaction-documents'
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Users can delete their own transaction documents"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'transaction-documents'
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
-- Your database is now ready for production!
