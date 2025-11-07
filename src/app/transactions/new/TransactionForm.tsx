// src/app/transactions/new/TransactionForm.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Upload, X, FileText } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Member {
  id: string
  company_name: string
  contact_email: string
}

interface TransactionFormProps {
  currentMemberId: string
  members: Member[]
}

interface UploadedFile {
  file: File
  preview: string
}

export default function TransactionForm({ currentMemberId, members }: TransactionFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])


  const [formData, setFormData] = useState({
    direction: 'owed',
    counterpartyId: '',
    amount: '',
    referenceNumber: '',
    tradeDate: new Date().toISOString().split('T')[0],
    description: ''
  })

  // Handle file selection
  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files || files.length === 0) return

    const newFiles: UploadedFile[] = []

    Array.from(files).forEach(file => {
      // Validate file type
      const validTypes = [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // DOCX
        'application/msword', // DOC
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // XLSX
        'application/vnd.ms-excel', // XLS
        'image/jpeg',
        'image/png'
      ]

      if (!validTypes.includes(file.type)) {
        setError(`File type not supported: ${file.name}. Please upload PDF, DOCX, XLSX, JPG, or PNG files.`)
        return
      }

      // Validate file size (20MB max)
      if (file.size > 20 * 1024 * 1024) {
        setError(`File too large: ${file.name}. Maximum size is 20MB.`)
        return
      }

      newFiles.push({
        file,
        preview: file.name
      })
    })

    setUploadedFiles([...uploadedFiles, ...newFiles])
    // Reset input
    e.target.value = ''
  }

  // Remove file from upload list
  function removeFile(index: number) {
    setUploadedFiles(uploadedFiles.filter((_, i) => i !== index))
  }

  // Format number with commas
  function formatNumberWithCommas(value: string): string {
    // Remove all non-numeric characters except decimal point
    const cleaned = value.replace(/[^\d.]/g, '')

    // Split into integer and decimal parts
    const parts = cleaned.split('.')

    // Format integer part with commas
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',')

    // Limit to 2 decimal places
    if (parts[1]) {
      parts[1] = parts[1].substring(0, 2)
    }

    // Rejoin and return
    return parts.join('.')
  }

  // Handle amount input change
  function handleAmountChange(e: React.ChangeEvent<HTMLInputElement>) {
    const input = e.target.value

    // Remove all non-numeric characters except decimal point
    const rawValue = input.replace(/[^\d.]/g, '')

    // Prevent multiple decimal points
    const decimalCount = (rawValue.match(/\./g) || []).length
    if (decimalCount > 1) return

    // Update form data with raw value (for submission)
    setFormData({ ...formData, amount: rawValue })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const supabase = createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      setError('Not authenticated')
      setLoading(false)
      return
    }

    try {
      const fromMemberId = formData.direction === 'owing' ? currentMemberId : formData.counterpartyId
      const toMemberId = formData.direction === 'owing' ? formData.counterpartyId : currentMemberId

      // 1. Create transaction
      const { data: transaction, error: insertError } = await supabase
        .from('transactions')
        .insert({
          from_member_id: fromMemberId,
          to_member_id: toMemberId,
          amount_usd: parseFloat(formData.amount),
          reference_number: formData.referenceNumber || null,
          trade_date: formData.tradeDate,
          description: formData.description || null,
          status: 'pending',
          created_by: user.id
        })
        .select()
        .single()

      if (insertError) throw insertError

      // 2. Upload documents if any
      if (uploadedFiles.length > 0) {
        for (const { file } of uploadedFiles) {
          // Upload to storage
          const fileExt = file.name.split('.').pop()
          const fileName = `${user.id}/${transaction.id}/${Date.now()}.${fileExt}`

          const { error: uploadError } = await supabase.storage
            .from('transaction-documents')
            .upload(fileName, file)

          if (uploadError) {
            console.error('Failed to upload file:', file.name, uploadError)
            continue // Skip this file but continue with others
          }

          // Save document metadata
          await supabase
            .from('transaction_documents')
            .insert({
              transaction_id: transaction.id,
              file_name: file.name,
              file_type: file.type,
              file_size: file.size,
              storage_path: fileName,
              uploaded_by: user.id
            })
        }
      }

      router.push('/dashboard')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create transaction')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200">
        <div className="px-4 md:px-8 py-4 md:py-6 flex items-center gap-3 md:gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft size={20} strokeWidth={1} className="text-black" />
          </button>
          <div className="text-xl md:text-2xl font-light tracking-wider text-black">BOSUN</div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto p-4 md:p-8">
        <h1 className="text-3xl md:text-4xl font-light mb-6 md:mb-8 text-black">New Transaction</h1>

        <form onSubmit={handleSubmit} className="space-y-6 md:space-y-8">
          {error && (
            <div className="border border-red-200 bg-red-50 p-4 text-sm font-light text-red-600">
              {error}
            </div>
          )}

          {/* Direction */}
          <div>
            <label className="block text-xs font-light uppercase tracking-wider text-black mb-3">
              Transaction Type
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, direction: 'owed' })}
                className={`p-4 md:p-4 border text-sm font-light transition-colors ${
                  formData.direction === 'owed'
                    ? 'border-black bg-gray-50 text-black'
                    : 'border-gray-200 text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="font-medium mb-1">They Owe You</div>
                <div className="text-xs">You are owed money</div>
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, direction: 'owing' })}
                className={`p-4 md:p-4 border text-sm font-light transition-colors ${
                  formData.direction === 'owing'
                    ? 'border-black bg-gray-50 text-black'
                    : 'border-gray-200 text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="font-medium mb-1">You Owe Them</div>
                <div className="text-xs">You owe money</div>
              </button>
            </div>
          </div>

          {/* Counterparty */}
          <div>
            <label htmlFor="counterparty" className="block text-xs font-light uppercase tracking-wider text-black mb-2">
              Counterparty
            </label>
            <select
              id="counterparty"
              required
              value={formData.counterpartyId}
              onChange={(e) => setFormData({ ...formData, counterpartyId: e.target.value })}
              className="w-full px-4 py-3 border border-gray-200 text-sm font-light focus:outline-none focus:border-black transition-colors text-black"
            >
              <option value="">Select a company...</option>
              {members.map(member => (
                <option key={member.id} value={member.id}>
                  {member.company_name}
                </option>
              ))}
            </select>
            {members.length === 0 && (
              <p className="mt-2 text-sm text-red-600">
                No other companies available. You need at least one other approved member to create transactions.
              </p>
            )}
          </div>

          {/* Amount */}
          <div>
            <label htmlFor="amount" className="block text-xs font-light uppercase tracking-wider text-black mb-2">
              Amount (USD)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-3 text-gray-500 font-light">$</span>
              <input
                id="amount"
                type="text"
                inputMode="decimal"
                required
                value={formatNumberWithCommas(formData.amount)}
                onChange={handleAmountChange}
                className="w-full pl-8 pr-4 py-3 border border-gray-200 text-sm font-light focus:outline-none focus:border-black transition-colors text-black"
                placeholder="10,000,000.00"
              />
            </div>
          </div>

          {/* Trade Date */}
          <div>
            <label htmlFor="tradeDate" className="block text-xs font-light uppercase tracking-wider text-black mb-2">
              Trade Date
            </label>
            <input
              id="tradeDate"
              type="date"
              required
              value={formData.tradeDate}
              onChange={(e) => setFormData({ ...formData, tradeDate: e.target.value })}
              className="w-full px-4 py-3 border border-gray-200 text-sm font-light focus:outline-none focus:border-black transition-colors text-black"
            />
          </div>

          {/* Reference Number */}
          <div>
            <label htmlFor="reference" className="block text-xs font-light uppercase tracking-wider text-black mb-2">
              Reference Number (Optional)
            </label>
            <input
              id="reference"
              type="text"
              value={formData.referenceNumber}
              onChange={(e) => setFormData({ ...formData, referenceNumber: e.target.value })}
              className="w-full px-4 py-3 border border-gray-200 text-sm font-light focus:outline-none focus:border-black transition-colors text-black"
              placeholder="INV-2025-001"
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-xs font-light uppercase tracking-wider text-black mb-2">
              Description (Optional)
            </label>
            <textarea
              id="description"
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-3 border border-gray-200 text-sm font-light focus:outline-none focus:border-black transition-colors resize-none text-black"
              placeholder="Additional details about this transaction..."
            />
          </div>

          {/* Document Upload */}
          <div>
            <label className="block text-xs font-light uppercase tracking-wider text-black mb-2">
              Supporting Documents (Optional)
            </label>
            <p className="text-xs text-gray-600 font-light mb-3">
              Upload bills of lading, invoices, contracts, or other supporting documents (PDF, DOCX, XLSX, JPG, PNG - max 20MB each)
            </p>

            {/* File Input */}
            <label className="w-full flex flex-col items-center px-6 py-8 border-2 border-gray-200 border-dashed cursor-pointer hover:border-gray-300 transition-colors">
              <Upload size={32} strokeWidth={1} className="text-gray-400 mb-3" />
              <span className="text-sm font-light text-gray-600 mb-1">Click to upload documents</span>
              <span className="text-xs font-light text-gray-500">or drag and drop</span>
              <input
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                onChange={handleFileSelect}
                className="hidden"
              />
            </label>

            {/* Uploaded Files List */}
            {uploadedFiles.length > 0 && (
              <div className="mt-4 space-y-2">
                <div className="text-xs font-light uppercase tracking-wider text-gray-600 mb-2">
                  {uploadedFiles.length} Document{uploadedFiles.length !== 1 ? 's' : ''} Ready to Upload
                </div>
                {uploadedFiles.map((fileData, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 border border-gray-200 bg-gray-50"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <FileText size={20} strokeWidth={1} className="text-gray-600 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-light text-black truncate">
                          {fileData.file.name}
                        </div>
                        <div className="text-xs font-light text-gray-500">
                          {(fileData.file.size / 1024 / 1024).toFixed(2)} MB
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className="p-2 hover:bg-gray-200 transition-colors flex-shrink-0"
                      aria-label="Remove file"
                    >
                      <X size={16} strokeWidth={1} className="text-gray-600" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit Buttons */}
          <div className="flex flex-col-reverse sm:flex-row gap-3 md:gap-4 pt-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 py-3 md:py-3 border border-gray-200 text-black text-sm font-light hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || members.length === 0}
              className="flex-1 py-3 md:py-3 bg-black text-white text-sm font-light hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Transaction'}
            </button>
          </div>
        </form>
      </main>
    </div>
  )
}