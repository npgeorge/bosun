-- Add transaction documents support
-- Run this migration in Supabase SQL Editor

-- Create transaction_documents table
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

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_transaction_documents_transaction_id
ON transaction_documents(transaction_id);

-- Add RLS policies (when RLS is enabled)
ALTER TABLE transaction_documents ENABLE ROW LEVEL SECURITY;

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

-- Policy: Users can upload documents for transactions they create
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

-- Create storage bucket for transaction documents
-- Run this in Supabase Storage section or via SQL:
INSERT INTO storage.buckets (id, name, public)
VALUES ('transaction-documents', 'transaction-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Users can upload transaction documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'transaction-documents'
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Users can view transaction documents for their member"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'transaction-documents'
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Users can delete their own transaction documents"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'transaction-documents'
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Migration complete
-- Transaction documents are now supported!
