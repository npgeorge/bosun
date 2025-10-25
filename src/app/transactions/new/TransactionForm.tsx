// src/app/transactions/new/TransactionForm.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
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

export default function TransactionForm({ currentMemberId, members }: TransactionFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  
  const [formData, setFormData] = useState({
    direction: 'owed',
    counterpartyId: '',
    amount: '',
    referenceNumber: '',
    tradeDate: new Date().toISOString().split('T')[0],
    description: ''
  })

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

    const fromMemberId = formData.direction === 'owing' ? currentMemberId : formData.counterpartyId
    const toMemberId = formData.direction === 'owing' ? formData.counterpartyId : currentMemberId

    const { data, error: insertError } = await supabase
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

    if (insertError) {
      setError(insertError.message)
      setLoading(false)
    } else {
      router.push('/dashboard')
      router.refresh()
    }
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200">
        <div className="px-8 py-6 flex items-center gap-4">
          <button 
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft size={20} strokeWidth={1} className="text-black" />
          </button>
          <div className="text-2xl font-light tracking-wider text-black">BOSUN</div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto p-8">
        <h1 className="text-4xl font-light mb-8 text-black">New Transaction</h1>

        <form onSubmit={handleSubmit} className="space-y-8">
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
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, direction: 'owed' })}
                className={`p-4 border text-sm font-light transition-colors ${
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
                className={`p-4 border text-sm font-light transition-colors ${
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
                type="number"
                step="0.01"
                min="0"
                required
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="w-full pl-8 pr-4 py-3 border border-gray-200 text-sm font-light focus:outline-none focus:border-black transition-colors text-black"
                placeholder="0.00"
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

          {/* Submit Buttons */}
          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 py-3 border border-gray-200 text-black text-sm font-light hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || members.length === 0}
              className="flex-1 py-3 bg-black text-white text-sm font-light hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Transaction'}
            </button>
          </div>
        </form>
      </main>
    </div>
  )
}