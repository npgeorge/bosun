-- =====================================================
-- STORAGE BUCKET POLICIES FOR MEMBER DOCUMENTS
-- =====================================================
-- Apply these policies to the 'member-documents' bucket
-- =====================================================

-- First, ensure the bucket exists and is NOT public
-- UPDATE storage.buckets
-- SET public = false
-- WHERE id = 'member-documents';

-- =====================================================
-- STORAGE OBJECT POLICIES
-- =====================================================

-- Allow authenticated users to upload documents
-- Folder structure: {user_id}/{filename}
CREATE POLICY "Authenticated users can upload their own documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'member-documents'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow admins to view all documents
CREATE POLICY "Admins can view all documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'member-documents'
  AND EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- Allow users to view their own documents
CREATE POLICY "Users can view their own documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'member-documents'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow admins to update documents
CREATE POLICY "Admins can update documents"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'member-documents'
  AND EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- Allow admins to delete documents
CREATE POLICY "Admins can delete documents"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'member-documents'
  AND EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- =====================================================
-- BUCKET CONFIGURATION
-- =====================================================

-- Set bucket to private (execute in Supabase dashboard or via API)
-- File size limit: 10MB
-- Allowed MIME types: application/pdf, image/jpeg, image/png

-- To apply via Supabase dashboard:
-- 1. Go to Storage > member-documents
-- 2. Click "Policies" tab
-- 3. Paste each policy above
-- 4. Go to "Configuration" tab
-- 5. Set "Public bucket" to OFF
-- 6. Set "File size limit" to 10MB
-- 7. Set "Allowed MIME types" to: application/pdf, image/jpeg, image/png
