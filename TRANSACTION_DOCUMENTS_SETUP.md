# Transaction Document Upload - Setup Guide

## Overview

Transaction document upload is now fully integrated into the Bosun platform! Users can attach supporting documents (bills of lading, invoices, contracts, etc.) when creating transactions.

## Supported Document Types

- **PDF** - Most common format for contracts and official documents
- **DOCX** - Microsoft Word documents
- **DOC** - Legacy Word documents
- **XLSX** - Excel spreadsheets
- **XLS** - Legacy Excel files
- **JPG/JPEG** - Scanned documents and photos
- **PNG** - Scanned documents and photos

**File Size Limit**: 20MB per document
**Multiple Files**: Users can upload multiple documents per transaction

---

## Setup Instructions

### 1. Run Database Migration

Open your Supabase SQL Editor and run the migration file:

```bash
# Location: DATABASE_MIGRATION_transaction_documents.sql
```

This migration will:
- ✅ Create `transaction_documents` table
- ✅ Create `transaction-documents` storage bucket
- ✅ Set up RLS (Row Level Security) policies
- ✅ Configure storage policies

**Copy and paste the entire contents of `DATABASE_MIGRATION_transaction_documents.sql` into Supabase SQL Editor and run it.**

### 2. Verify Storage Bucket

After running the migration, verify in Supabase Dashboard:

1. Go to **Storage** section
2. You should see a new bucket: `transaction-documents`
3. Check that it's a **private bucket** (not public)

If the bucket wasn't created automatically:
- Click "New bucket"
- Name: `transaction-documents`
- Public: **OFF** (keep it private)
- Click "Create bucket"

### 3. Test the Feature

1. Go to your dashboard
2. Click "New Transaction"
3. Fill in transaction details
4. Scroll to "Supporting Documents (Optional)"
5. Click the upload area or drag files
6. Upload a sample PDF or image
7. Submit the transaction

The documents should upload successfully and be associated with the transaction.

---

## Features

### Transaction Creation Form

**New Document Upload Section:**
- Drag-and-drop interface
- Multiple file selection
- File type validation
- File size validation (20MB max)
- Preview uploaded files before submission
- Remove files from queue
- Shows file name and size

**User Experience:**
```
Supporting Documents (Optional)
Upload bills of lading, invoices, contracts, or other supporting documents

┌─────────────────────────────────────────┐
│         📤 Upload Icon                  │
│    Click to upload documents            │
│       or drag and drop                  │
└─────────────────────────────────────────┘

2 Documents Ready to Upload:
┌─────────────────────────────────────────┐
│ 📄 Bill_of_Lading_2025.pdf    2.5 MB  ❌│
│ 📄 Invoice_12345.pdf           0.8 MB  ❌│
└─────────────────────────────────────────┘
```

### Storage Organization

Documents are stored with this structure:
```
transaction-documents/
  {user_id}/
    {transaction_id}/
      {timestamp}.pdf
      {timestamp}.docx
      {timestamp}.jpg
```

### Security

✅ **RLS Enabled**: Users can only view/upload documents for transactions their member is involved in
✅ **Private Storage**: Documents are not publicly accessible
✅ **Authenticated Access**: Must be logged in to upload/view documents
✅ **User Ownership**: Users can delete their own uploaded documents

---

## Database Schema

### transaction_documents Table

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `transaction_id` | UUID | Foreign key to transactions |
| `file_name` | VARCHAR(255) | Original filename |
| `file_type` | VARCHAR(100) | MIME type (application/pdf, etc.) |
| `file_size` | INTEGER | File size in bytes |
| `storage_path` | TEXT | Path in Supabase storage |
| `uploaded_by` | UUID | Foreign key to users |
| `uploaded_at` | TIMESTAMP | Upload timestamp |

### Relationships

- **transaction_documents.transaction_id** → transactions.id (CASCADE DELETE)
- **transaction_documents.uploaded_by** → users.id

---

## Future Enhancements (Not Yet Implemented)

These features are planned but not yet implemented:

### Display Documents in Transaction Details Modal
- Show list of uploaded documents in transaction detail view
- Download button for each document
- Display file size and upload date
- Show who uploaded each document

### Document Management Dashboard
- View all documents across all transactions
- Search/filter by document type
- Bulk download options
- Document version history

### Additional Document Types
- CSV files
- TXT files
- ZIP archives (for multiple documents)

---

## API Usage

### Upload Documents Programmatically

```typescript
// 1. Create transaction
const { data: transaction } = await supabase
  .from('transactions')
  .insert({ ... })
  .select()
  .single()

// 2. Upload file to storage
const fileName = `${userId}/${transaction.id}/${Date.now()}.pdf`
const { error } = await supabase.storage
  .from('transaction-documents')
  .upload(fileName, file)

// 3. Save metadata
await supabase
  .from('transaction_documents')
  .insert({
    transaction_id: transaction.id,
    file_name: file.name,
    file_type: file.type,
    file_size: file.size,
    storage_path: fileName,
    uploaded_by: userId
  })
```

### Retrieve Documents for a Transaction

```typescript
const { data: documents } = await supabase
  .from('transaction_documents')
  .select('*')
  .eq('transaction_id', transactionId)
  .order('uploaded_at', { ascending: false })
```

### Download a Document

```typescript
const { data, error } = await supabase.storage
  .from('transaction-documents')
  .download(storagePath)

// Create download link
const url = URL.createObjectURL(data)
```

---

## Troubleshooting

### "Bucket not found" Error

**Solution**: Create the storage bucket manually in Supabase:
1. Go to Storage → Create bucket
2. Name: `transaction-documents`
3. Public: OFF
4. Create

### "Permission denied" Error

**Solution**: Check RLS policies are enabled:
```sql
-- Verify policies exist
SELECT * FROM pg_policies
WHERE tablename = 'transaction_documents';
```

### Files Not Uploading

**Check**:
1. File size < 20MB
2. File type is supported (PDF, DOCX, XLSX, JPG, PNG)
3. Storage bucket exists
4. RLS policies are correct
5. User is authenticated

### Console Errors

Check browser console for detailed error messages:
- `F12` → Console tab
- Look for red error messages
- Share full error text if you need help

---

## Testing Checklist

- [ ] Database migration run successfully
- [ ] Storage bucket created (transaction-documents)
- [ ] Can upload PDF file
- [ ] Can upload DOCX file
- [ ] Can upload multiple files at once
- [ ] File size validation works (try 25MB file)
- [ ] File type validation works (try .txt file)
- [ ] Can remove file before submission
- [ ] Documents associate with correct transaction
- [ ] Can see confirmation after upload

---

## Support

If you encounter any issues:
1. Check the browser console for errors (F12 → Console)
2. Verify the database migration ran successfully
3. Confirm the storage bucket exists in Supabase
4. Review the error messages in the transaction form

---

**Status**: ✅ Feature Complete (Upload Ready)
**Next Steps**: Run migration, test with sample documents
**Future**: Add document viewer in transaction details modal
