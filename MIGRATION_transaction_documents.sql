-- ============================================================================
-- TRANSACTION DOCUMENTS MIGRATION
-- Copy and paste this ENTIRE file into Supabase SQL Editor and click RUN
-- ============================================================================

-- Step 1: Create transaction_documents table
CREATE TABLE IF NOT EXISTS transaction_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(100) NOT NULL,
    file_size INTEGER NOT NULL,
    storage_path TEXT NOT NULL,
    uploaded_by UUID NOT NULL,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 2: Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_transaction_documents_transaction_id
ON transaction_documents(transaction_id);

CREATE INDEX IF NOT EXISTS idx_transaction_documents_uploaded_by
ON transaction_documents(uploaded_by);

-- Step 3: Enable RLS on transaction_documents table
ALTER TABLE transaction_documents ENABLE ROW LEVEL SECURITY;

-- Step 4: Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view transaction documents for their member" ON transaction_documents;
DROP POLICY IF EXISTS "Users can upload documents for their transactions" ON transaction_documents;
DROP POLICY IF EXISTS "Users can delete their own uploaded documents" ON transaction_documents;

-- Step 5: Create RLS policies for transaction_documents table

-- Policy: Users can view documents for transactions their member is involved in
CREATE POLICY "Users can view transaction documents for their member"
ON transaction_documents FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM transactions t
    INNER JOIN users u ON u.id = auth.uid()
    WHERE t.id = transaction_documents.transaction_id
    AND (t.from_member_id = u.member_id OR t.to_member_id = u.member_id)
  )
);

-- Policy: Users can upload documents for their own transactions
CREATE POLICY "Users can upload documents for their transactions"
ON transaction_documents FOR INSERT
WITH CHECK (
  uploaded_by = auth.uid()
  AND EXISTS (
    SELECT 1 FROM transactions t
    INNER JOIN users u ON u.id = auth.uid()
    WHERE t.id = transaction_documents.transaction_id
    AND (t.from_member_id = u.member_id OR t.to_member_id = u.member_id)
  )
);

-- Policy: Users can delete their own uploaded documents
CREATE POLICY "Users can delete their own uploaded documents"
ON transaction_documents FOR DELETE
USING (uploaded_by = auth.uid());

-- Step 6: Create storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'transaction-documents',
  'transaction-documents',
  false,
  20971520, -- 20MB limit
  ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/jpeg',
    'image/png'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- Step 7: Drop existing storage policies if they exist
DROP POLICY IF EXISTS "Users can upload transaction documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can view transaction documents for their member" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own transaction documents" ON storage.objects;

-- Step 8: Create storage policies

-- Policy: Authenticated users can upload to transaction-documents bucket
CREATE POLICY "Users can upload transaction documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'transaction-documents'
  AND auth.uid() IS NOT NULL
);

-- Policy: Authenticated users can view files in transaction-documents bucket
CREATE POLICY "Users can view transaction documents for their member"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'transaction-documents'
  AND auth.uid() IS NOT NULL
);

-- Policy: Users can delete their own files
CREATE POLICY "Users can delete their own transaction documents"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'transaction-documents'
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- ============================================================================
-- MIGRATION COMPLETE!
-- ============================================================================
--
-- Next steps:
-- 1. Verify the storage bucket exists: Storage > Buckets > transaction-documents
-- 2. Test uploading a document when creating a transaction
--
-- ============================================================================
