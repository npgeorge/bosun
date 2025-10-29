// src/app/dashboard/DashboardClient.tsx
'use client'

import React, { useState, useMemo } from 'react'
import { ArrowUpRight, ArrowDownLeft, Clock, DollarSign, Plus, Settings, LogOut, Play, Search, Filter, Download, FileText, Upload, X, TrendingUp, TrendingDown, Activity, Calendar } from 'lucide-react'
import { signOut } from '@/lib/supabase/auth'
import { useRouter } from 'next/navigation'
import type { SettlementResponse, SettlementErrorResponse } from '@/types/api'
import { isSettlementError, isSettlementSimulation, isNoTransactions } from '@/types/api'

interface Transaction {
  id: string
  counterparty: string
  amount: number
  type: 'owing' | 'owed'
  date: string
  status: string
  reference: string
  description: string
  createdAt: string
}

interface Document {
  id: string
  name: string
  size: number
  type: string
  uploadedAt: string
  url: string
}

interface Settlement {
  id: string
  settlement_cycle_id: string
  from_member_id: string
  to_member_id: string
  amount_usd: number
  fee_usd: number
  status: string
  created_at: string
  settlement_cycles?: {
    id: string
    cycle_time: string
    total_transactions: number
    total_volume: number
    net_settlements: number
    savings_percentage: number
    status: string
    completed_at: string
  }
}

interface DashboardClientProps {
  member: {
    companyName: string
    balance: {
      owed: number
      owing: number
      net: number
    }
  }
  transactions: Transaction[]
  documents: Document[]
  settlements: Settlement[]
  counterpartyMap: Record<string, string>
  transactionCount: number
  memberId: string
  userEmail: string
  isAdmin?: boolean
}

export default function DashboardClient({ member, transactions, documents, settlements, counterpartyMap, transactionCount, memberId, userEmail, isAdmin = false }: DashboardClientProps) {
  const [activeTab, setActiveTab] = useState('overview')
  const [testingSettlement, setTestingSettlement] = useState(false)
  const [settlementResult, setSettlementResult] = useState<SettlementResponse | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)
  const [selectedCycle, setSelectedCycle] = useState<string | null>(null)
  const router = useRouter()

  const nextSettlement = {
    time: "5:00 PM",
    date: "Today",
    hoursRemaining: 4.5
  }

  async function handleLogout() {
    await signOut()
    router.push('/auth/login')
    router.refresh()
  }

  async function testSettlement() {
    setTestingSettlement(true)
    setSettlementResult(null)

    try {
      const response = await fetch('/api/settlements/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ simulation: true })
      })

      // Check if response is JSON
      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text()
        console.error('Non-JSON response received:', text.substring(0, 500))
        throw new Error('Server returned an error. Please check the console or try restarting the development server.')
      }

      const data = await response.json() as SettlementResponse
      setSettlementResult(data)

      if (!response.ok) {
        console.error('Settlement test failed:', data)
      }
    } catch (error) {
      console.error('Settlement test error:', error)
      const errorResponse: SettlementErrorResponse = {
        error: 'Failed to test settlement',
        message: error instanceof Error ? error.message : 'Unknown error'
      }
      setSettlementResult(errorResponse)
    } finally {
      setTestingSettlement(false)
    }
  }

  // Filter and search transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => {
      // Search filter
      const matchesSearch = searchQuery === '' ||
        tx.counterparty.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tx.reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tx.description.toLowerCase().includes(searchQuery.toLowerCase())

      // Status filter
      const matchesStatus = statusFilter === 'all' || tx.status === statusFilter

      // Type filter
      const matchesType = typeFilter === 'all' || tx.type === typeFilter

      return matchesSearch && matchesStatus && matchesType
    })
  }, [transactions, searchQuery, statusFilter, typeFilter])

  // Format file size
  function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  // Format date
  function formatDate(dateString: string): string {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200">
        <div className="px-8 py-6 flex justify-between items-center">
        <div className="text-2xl font-light tracking-wider text-black">BOSUN</div>
        <div className="flex items-center gap-6">
        <span className="text-sm font-light text-black">{member.companyName}</span>
        {isAdmin && (
          <button 
            onClick={() => router.push('/admin')}
            className="px-4 py-2 bg-gray-100 text-black text-sm font-light hover:bg-gray-200 transition-colors"
          >
          Admin Panel
          </button>
          )}
          <button className="p-2 hover:bg-gray-50 transition-colors">
          <Settings size={20} strokeWidth={1} className="text-black" />
        </button>
        <button 
        onClick={handleLogout}
        className="p-2 hover:bg-gray-50 transition-colors"
        >
        <LogOut size={20} strokeWidth={1} className="text-black" />
        </button>
        </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar Navigation */}
        <nav className="w-64 border-r border-gray-200 min-h-screen p-8">
          <div className="space-y-2">
            <button
              onClick={() => setActiveTab('overview')}
              className={`w-full text-left px-4 py-3 text-sm font-light transition-colors text-black ${
                activeTab === 'overview' ? 'bg-gray-50' : 'hover:bg-gray-50'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('transactions')}
              className={`w-full text-left px-4 py-3 text-sm font-light transition-colors text-black ${
                activeTab === 'transactions' ? 'bg-gray-50' : 'hover:bg-gray-50'
              }`}
            >
              Transactions
            </button>
            <button
              onClick={() => setActiveTab('settlements')}
              className={`w-full text-left px-4 py-3 text-sm font-light transition-colors text-black ${
                activeTab === 'settlements' ? 'bg-gray-50' : 'hover:bg-gray-50'
              }`}
            >
              Settlements
            </button>
            <button
              onClick={() => setActiveTab('documents')}
              className={`w-full text-left px-4 py-3 text-sm font-light transition-colors text-black ${
                activeTab === 'documents' ? 'bg-gray-50' : 'hover:bg-gray-50'
              }`}
            >
              Documents
            </button>
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1 p-8">
          {activeTab === 'overview' && (
            <div className="max-w-6xl">
              {/* Page Header */}
              <div className="flex justify-between items-center mb-12">
                <h1 className="text-4xl font-light text-black">Overview</h1>
                <div className="flex gap-4">
                  <button 
                    onClick={testSettlement}
                    disabled={testingSettlement}
                    className="px-6 py-3 border border-gray-300 text-black text-sm font-light hover:bg-gray-50 transition-colors flex items-center gap-2 disabled:opacity-50"
                  >
                    <Play size={16} />
                    {testingSettlement ? 'Testing...' : 'Test Settlement'}
                  </button>
                  
                  <button 
                    onClick={() => router.push('/transactions/new')}
                    className="px-6 py-3 bg-black text-white text-sm font-light hover:bg-gray-800 transition-colors flex items-center gap-2"
                  >
                    <Plus size={16} />
                    New Transaction
                  </button>
                </div>
              </div>

              {/* Settlement Test Result */}
              {settlementResult && (
                <div className={`mb-12 border p-6 ${
                  isSettlementError(settlementResult)
                    ? 'border-red-200 bg-red-50'
                    : isNoTransactions(settlementResult)
                    ? 'border-blue-200 bg-blue-50'
                    : 'border-green-200 bg-green-50'
                }`}>
                  <h3 className="text-lg font-medium mb-4 text-black">
                    {isSettlementSimulation(settlementResult) ? 'Settlement Test Result' : 'Settlement Result'}
                  </h3>

                  {isSettlementError(settlementResult) ? (
                    <div className="space-y-3">
                      <p className="text-red-700 font-medium">
                        ❌ {settlementResult.message}
                      </p>
                      {settlementResult.details && (
                        <pre className="text-xs bg-red-100 p-4 rounded overflow-auto font-mono text-red-800">
                          {typeof settlementResult.details === 'string'
                            ? settlementResult.details
                            : JSON.stringify(settlementResult.details, null, 2)}
                        </pre>
                      )}
                      {settlementResult.violations && settlementResult.violations.length > 0 && (
                        <div className="mt-4">
                          <p className="font-medium text-red-800 mb-2">Circuit Breaker Violations:</p>
                          <ul className="list-disc list-inside space-y-1 text-sm text-red-700">
                            {settlementResult.violations.map((v, i) => (
                              <li key={i}>{v.message}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ) : isNoTransactions(settlementResult) ? (
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">ℹ️</div>
                      <p className="text-blue-800 font-light text-lg">{settlementResult.message}</p>
                    </div>
                  ) : isSettlementSimulation(settlementResult) ? (
                    <div className="space-y-6">
                      <div className="grid grid-cols-2 gap-6">
                        <div>
                          <div className="text-xs font-light text-gray-600 mb-1">Transactions to Process</div>
                          <div className="text-3xl font-light text-black">
                            {settlementResult.preview.transactions_to_process}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs font-light text-gray-600 mb-1">Settlements Generated</div>
                          <div className="text-3xl font-light text-black">
                            {settlementResult.preview.settlements_generated}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs font-light text-gray-600 mb-1">Total Volume</div>
                          <div className="text-3xl font-light text-black">
                            ${Number(settlementResult.preview.total_volume).toLocaleString()}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs font-light text-gray-600 mb-1">Network Efficiency</div>
                          <div className="text-3xl font-light text-green-600">
                            {settlementResult.preview.estimated_savings_percentage}%
                          </div>
                        </div>
                      </div>
                      
                      {settlementResult.circuit_breakers.warnings.length > 0 && (
                        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded">
                          <p className="font-medium text-yellow-800 mb-2">⚠️ Warnings:</p>
                          <ul className="list-disc list-inside space-y-1 text-sm text-yellow-700">
                            {settlementResult.circuit_breakers.warnings.map((w, i) => (
                              <li key={i}>{w.message}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ) : null}
                  
                  <button
                    onClick={() => setSettlementResult(null)}
                    className="mt-4 text-sm font-light text-gray-600 hover:text-black transition-colors"
                  >
                    Dismiss
                  </button>
                </div>
              )}

              {/* Account Balance and Next Settlement */}
              <div className="flex gap-6 mb-12">
                {/* Account Balance - 75% width */}
                <div className="flex-[3]">
                  <div className="border border-gray-200 p-8 bg-gray-50 h-full">
                    <div className="flex items-center gap-2 mb-4 text-black">
                      <DollarSign size={20} strokeWidth={1} />
                      <span className="text-sm font-light uppercase tracking-wider">Account Balance</span>
                    </div>
                    <div className="text-5xl font-light mb-2 text-black">
                      ${Math.abs(member.balance.net).toLocaleString()}
                    </div>
                    <div className="text-sm font-light text-gray-600">
                      {member.balance.net < 0 ? 'You will pay' : member.balance.net > 0 ? 'You will receive' : 'Balanced'}
                    </div>
                  </div>
                </div>

                {/* Next Settlement - 25% width */}
                <div className="flex-[1]">
                  <div className="border border-gray-200 p-6 bg-white h-full">
                    <div className="flex items-center gap-2 mb-3">
                      <Clock size={14} strokeWidth={1} className="text-gray-600" />
                      <span className="text-xs font-light uppercase tracking-wider text-gray-600">Next Settlement</span>
                    </div>
                    <div className="text-2xl font-light mb-1 text-black">{nextSettlement.time}</div>
                    <div className="text-xs font-light text-gray-500 mb-4">{nextSettlement.date}</div>
                    <div className="inline-block px-3 py-1 bg-gray-50 text-xs font-light text-gray-600">
                      {nextSettlement.hoursRemaining}h remaining
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Transactions */}
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-light text-black">Recent Transactions</h2>
                  <button
                    onClick={() => setActiveTab('transactions')}
                    className="text-sm font-light text-gray-700 hover:text-black transition-colors"
                  >
                    View all
                  </button>
                </div>
                {transactions.slice(0, 4).length > 0 ? (
                  <div className="border border-gray-200">
                    <div className="grid grid-cols-4 gap-4 px-6 py-4 border-b border-gray-200 bg-gray-50">
                      <div className="text-xs font-light uppercase tracking-wider text-gray-700">Counterparty</div>
                      <div className="text-xs font-light uppercase tracking-wider text-gray-700">Amount</div>
                      <div className="text-xs font-light uppercase tracking-wider text-gray-700">Date</div>
                      <div className="text-xs font-light uppercase tracking-wider text-gray-700">Status</div>
                    </div>
                    {transactions.slice(0, 4).map(tx => (
                      <div key={tx.id} className="grid grid-cols-4 gap-4 px-6 py-4 border-b border-gray-200 last:border-b-0 hover:bg-gray-50 transition-colors">
                        <div className="text-sm font-light text-black">{tx.counterparty}</div>
                        <div className={`text-sm font-light ${tx.type === 'owed' ? 'text-black' : 'text-gray-700'}`}>
                          {tx.type === 'owed' ? '+' : '-'}${tx.amount.toLocaleString()}
                        </div>
                        <div className="text-sm font-light text-gray-700">{tx.date}</div>
                        <div>
                          <span className={`inline-block px-3 py-1 text-xs font-light ${
                            tx.status === 'settled' ? 'bg-gray-100 text-gray-700' :
                            tx.status === 'confirmed' ? 'bg-gray-50 text-black' :
                            'bg-gray-50 text-gray-600'
                          }`}>
                            {tx.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="border border-gray-200 p-12 text-center">
                    <p className="text-gray-700 font-light mb-4">No transactions yet</p>
                    <button 
                      onClick={() => router.push('/transactions/new')}
                      className="px-6 py-3 bg-black text-white text-sm font-light hover:bg-gray-800 transition-colors"
                    >
                      Create your first transaction
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'transactions' && (
            <div className="max-w-6xl">
              {/* Page Header */}
              <div className="flex justify-between items-center mb-12">
                <h1 className="text-4xl font-light text-black">Transactions</h1>
                <button
                  onClick={() => router.push('/transactions/new')}
                  className="px-6 py-3 bg-black text-white text-sm font-light hover:bg-gray-800 transition-colors flex items-center gap-2"
                >
                  <Plus size={16} />
                  New Transaction
                </button>
              </div>

              {/* Search and Filters */}
              <div className="mb-8 space-y-4">
                <div className="flex gap-4">
                  {/* Search */}
                  <div className="flex-1 relative">
                    <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" strokeWidth={1} />
                    <input
                      type="text"
                      placeholder="Search by counterparty, reference, or description..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 border border-gray-200 text-sm font-light text-black focus:outline-none focus:border-gray-400"
                    />
                  </div>

                  {/* Status Filter */}
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-4 py-3 border border-gray-200 text-sm font-light text-black focus:outline-none focus:border-gray-400 bg-white"
                  >
                    <option value="all">All Statuses</option>
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="settled">Settled</option>
                  </select>

                  {/* Type Filter */}
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="px-4 py-3 border border-gray-200 text-sm font-light text-black focus:outline-none focus:border-gray-400 bg-white"
                  >
                    <option value="all">All Types</option>
                    <option value="owed">They Owe You</option>
                    <option value="owing">You Owe Them</option>
                  </select>
                </div>

                {/* Results count */}
                <div className="text-sm font-light text-gray-600">
                  Showing {filteredTransactions.length} of {transactions.length} transactions
                </div>
              </div>

              {/* Transactions Table */}
              {filteredTransactions.length > 0 ? (
                <div className="border border-gray-200">
                  <div className="grid grid-cols-6 gap-4 px-6 py-4 border-b border-gray-200 bg-gray-50">
                    <div className="text-xs font-light uppercase tracking-wider text-gray-700">Date</div>
                    <div className="text-xs font-light uppercase tracking-wider text-gray-700">Counterparty</div>
                    <div className="text-xs font-light uppercase tracking-wider text-gray-700">Reference</div>
                    <div className="text-xs font-light uppercase tracking-wider text-gray-700">Type</div>
                    <div className="text-xs font-light uppercase tracking-wider text-gray-700">Amount</div>
                    <div className="text-xs font-light uppercase tracking-wider text-gray-700">Status</div>
                  </div>
                  {filteredTransactions.map(tx => (
                    <div
                      key={tx.id}
                      onClick={() => setSelectedTransaction(tx)}
                      className="grid grid-cols-6 gap-4 px-6 py-4 border-b border-gray-200 last:border-b-0 hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                      <div className="text-sm font-light text-gray-700">{tx.date}</div>
                      <div className="text-sm font-light text-black">{tx.counterparty}</div>
                      <div className="text-sm font-light text-gray-600">{tx.reference || '—'}</div>
                      <div className="text-sm font-light text-gray-700">
                        {tx.type === 'owed' ? 'Receivable' : 'Payable'}
                      </div>
                      <div className={`text-sm font-light ${tx.type === 'owed' ? 'text-black' : 'text-gray-700'}`}>
                        {tx.type === 'owed' ? '+' : '-'}${tx.amount.toLocaleString()}
                      </div>
                      <div>
                        <span className={`inline-block px-3 py-1 text-xs font-light ${
                          tx.status === 'settled' ? 'bg-gray-100 text-gray-700' :
                          tx.status === 'confirmed' ? 'bg-gray-50 text-black' :
                          'bg-gray-50 text-gray-600'
                        }`}>
                          {tx.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="border border-gray-200 p-12 text-center">
                  <p className="text-gray-700 font-light mb-4">
                    {searchQuery || statusFilter !== 'all' || typeFilter !== 'all'
                      ? 'No transactions match your filters'
                      : 'No transactions yet'}
                  </p>
                  {!searchQuery && statusFilter === 'all' && typeFilter === 'all' && (
                    <button
                      onClick={() => router.push('/transactions/new')}
                      className="px-6 py-3 bg-black text-white text-sm font-light hover:bg-gray-800 transition-colors"
                    >
                      Create your first transaction
                    </button>
                  )}
                </div>
              )}

              {/* Transaction Detail Modal */}
              {selectedTransaction && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setSelectedTransaction(null)}>
                  <div className="bg-white p-8 max-w-2xl w-full mx-4" onClick={(e) => e.stopPropagation()}>
                    <div className="flex justify-between items-start mb-6">
                      <h2 className="text-2xl font-light text-black">Transaction Details</h2>
                      <button
                        onClick={() => setSelectedTransaction(null)}
                        className="p-2 hover:bg-gray-50 transition-colors"
                      >
                        <X size={20} strokeWidth={1} className="text-black" />
                      </button>
                    </div>

                    <div className="space-y-6">
                      <div className="grid grid-cols-2 gap-6">
                        <div>
                          <div className="text-xs font-light text-gray-600 mb-1">Counterparty</div>
                          <div className="text-base font-light text-black">{selectedTransaction.counterparty}</div>
                        </div>
                        <div>
                          <div className="text-xs font-light text-gray-600 mb-1">Amount</div>
                          <div className={`text-base font-light ${selectedTransaction.type === 'owed' ? 'text-black' : 'text-gray-700'}`}>
                            {selectedTransaction.type === 'owed' ? '+' : '-'}${selectedTransaction.amount.toLocaleString()}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs font-light text-gray-600 mb-1">Type</div>
                          <div className="text-base font-light text-black">
                            {selectedTransaction.type === 'owed' ? 'They Owe You' : 'You Owe Them'}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs font-light text-gray-600 mb-1">Status</div>
                          <div className="text-base font-light text-black capitalize">{selectedTransaction.status}</div>
                        </div>
                        <div>
                          <div className="text-xs font-light text-gray-600 mb-1">Trade Date</div>
                          <div className="text-base font-light text-black">{selectedTransaction.date}</div>
                        </div>
                        <div>
                          <div className="text-xs font-light text-gray-600 mb-1">Created</div>
                          <div className="text-base font-light text-black">{selectedTransaction.createdAt}</div>
                        </div>
                      </div>

                      {selectedTransaction.reference && (
                        <div>
                          <div className="text-xs font-light text-gray-600 mb-1">Reference Number</div>
                          <div className="text-base font-light text-black">{selectedTransaction.reference}</div>
                        </div>
                      )}

                      {selectedTransaction.description && (
                        <div>
                          <div className="text-xs font-light text-gray-600 mb-1">Description</div>
                          <div className="text-base font-light text-black">{selectedTransaction.description}</div>
                        </div>
                      )}
                    </div>

                    <div className="mt-8 flex justify-end">
                      <button
                        onClick={() => setSelectedTransaction(null)}
                        className="px-6 py-3 bg-gray-50 text-black text-sm font-light hover:bg-gray-100 transition-colors"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'settlements' && (
            <div>
              <h1 className="text-4xl font-light mb-8 text-black">Settlements</h1>
              <p className="text-gray-700 font-light">Settlement history coming soon...</p>
            </div>
          )}

          {activeTab === 'documents' && (
            <div className="max-w-6xl">
              {/* Page Header */}
              <div className="flex justify-between items-center mb-12">
                <h1 className="text-4xl font-light text-black">Documents</h1>
              </div>

              {/* Documents Grid */}
              {documents.length > 0 ? (
                <div className="space-y-6">
                  {/* Statistics */}
                  <div className="grid grid-cols-3 gap-6 mb-8">
                    <div className="border border-gray-200 p-6">
                      <div className="flex items-center gap-2 mb-3 text-black">
                        <FileText size={16} strokeWidth={1} />
                        <span className="text-xs font-light uppercase tracking-wider">Total Documents</span>
                      </div>
                      <div className="text-3xl font-light text-black">{documents.length}</div>
                    </div>

                    <div className="border border-gray-200 p-6">
                      <div className="flex items-center gap-2 mb-3 text-black">
                        <FileText size={16} strokeWidth={1} />
                        <span className="text-xs font-light uppercase tracking-wider">Trade Licenses</span>
                      </div>
                      <div className="text-3xl font-light text-black">
                        {documents.filter(d => d.type === 'Trade License').length}
                      </div>
                    </div>

                    <div className="border border-gray-200 p-6">
                      <div className="flex items-center gap-2 mb-3 text-black">
                        <FileText size={16} strokeWidth={1} />
                        <span className="text-xs font-light uppercase tracking-wider">Bank Statements</span>
                      </div>
                      <div className="text-3xl font-light text-black">
                        {documents.filter(d => d.type === 'Bank Statement').length}
                      </div>
                    </div>
                  </div>

                  {/* Documents Table */}
                  <div className="border border-gray-200">
                    <div className="grid grid-cols-5 gap-4 px-6 py-4 border-b border-gray-200 bg-gray-50">
                      <div className="text-xs font-light uppercase tracking-wider text-gray-700">Document Name</div>
                      <div className="text-xs font-light uppercase tracking-wider text-gray-700">Type</div>
                      <div className="text-xs font-light uppercase tracking-wider text-gray-700">Size</div>
                      <div className="text-xs font-light uppercase tracking-wider text-gray-700">Upload Date</div>
                      <div className="text-xs font-light uppercase tracking-wider text-gray-700">Action</div>
                    </div>
                    {documents.map(doc => (
                      <div
                        key={doc.id}
                        className="grid grid-cols-5 gap-4 px-6 py-4 border-b border-gray-200 last:border-b-0 hover:bg-gray-50 transition-colors"
                      >
                        <div className="text-sm font-light text-black flex items-center gap-2">
                          <FileText size={16} strokeWidth={1} className="text-gray-400" />
                          {doc.name}
                        </div>
                        <div className="text-sm font-light text-gray-700">{doc.type}</div>
                        <div className="text-sm font-light text-gray-600">{formatFileSize(doc.size)}</div>
                        <div className="text-sm font-light text-gray-600">{formatDate(doc.uploadedAt)}</div>
                        <div>
                          <a
                            href={doc.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 text-black text-sm font-light hover:bg-gray-50 transition-colors"
                          >
                            <Download size={14} strokeWidth={1} />
                            Download
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="border border-gray-200 p-12 text-center">
                  <FileText size={48} strokeWidth={1} className="mx-auto mb-4 text-gray-300" />
                  <p className="text-gray-700 font-light mb-2">No documents uploaded yet</p>
                  <p className="text-sm text-gray-500 font-light">
                    Your documents will appear here once uploaded
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'settlements' && (
            <div className="max-w-7xl">
              {/* Page Header */}
              <div className="flex justify-between items-center mb-12">
                <h1 className="text-4xl font-light text-black">Settlements</h1>
              </div>

              {(() => {
                // Calculate aggregate statistics
                const totalSettlements = settlements.length
                const completedSettlements = settlements.filter(s => s.status === 'completed').length

                const totalPaid = settlements
                  .filter(s => s.from_member_id === memberId && s.status === 'completed')
                  .reduce((sum, s) => sum + Number(s.amount_usd), 0)

                const totalReceived = settlements
                  .filter(s => s.to_member_id === memberId && s.status === 'completed')
                  .reduce((sum, s) => sum + Number(s.amount_usd), 0)

                const totalFees = settlements
                  .filter(s => s.status === 'completed')
                  .reduce((sum, s) => sum + Number(s.fee_usd || 0), 0)

                // Calculate average network efficiency from completed settlement cycles
                const completedCycles = settlements
                  .filter(s => s.settlement_cycles?.status === 'completed')
                  .map(s => s.settlement_cycles!)
                  .filter((cycle, index, self) =>
                    index === self.findIndex(c => c.id === cycle.id)
                  )

                const avgEfficiency = completedCycles.length > 0
                  ? completedCycles.reduce((sum, c) => sum + Number(c.savings_percentage || 0), 0) / completedCycles.length
                  : 0

                // Calculate total savings (assuming 2.5% wire fee vs 0.8% platform fee)
                const grossVolume = settlements
                  .filter(s => s.status === 'completed')
                  .reduce((sum, s) => sum + Number(s.amount_usd), 0)

                const wireCost = grossVolume * 0.025
                const platformCost = totalFees
                const totalSavings = wireCost - platformCost

                // Group settlements by cycle
                const settlementsByCycle = settlements.reduce((acc, settlement) => {
                  const cycleId = settlement.settlement_cycle_id
                  if (!acc[cycleId]) {
                    acc[cycleId] = []
                  }
                  acc[cycleId].push(settlement)
                  return acc
                }, {} as Record<string, Settlement[]>)

                const cycles = Object.keys(settlementsByCycle)
                  .map(cycleId => {
                    const cycleSettlements = settlementsByCycle[cycleId]
                    const cycle = cycleSettlements[0]?.settlement_cycles
                    return { cycleId, settlements: cycleSettlements, cycle }
                  })
                  .filter(c => c.cycle)
                  .sort((a, b) =>
                    new Date(b.cycle!.cycle_time).getTime() - new Date(a.cycle!.cycle_time).getTime()
                  )

                return (
                  <>
                    {/* Statistics Cards */}
                    <div className="grid grid-cols-4 gap-6 mb-12">
                      {/* Total Settlements */}
                      <div className="border border-gray-200 p-6">
                        <div className="flex items-center gap-3 mb-3">
                          <Activity size={20} strokeWidth={1} className="text-black" />
                          <div className="text-xs font-light uppercase tracking-wider text-gray-600">
                            Total Settlements
                          </div>
                        </div>
                        <div className="text-3xl font-light text-black">{completedSettlements}</div>
                        <div className="text-xs font-light text-gray-500 mt-1">
                          {totalSettlements} total (including pending)
                        </div>
                      </div>

                      {/* Network Efficiency */}
                      <div className="border border-gray-200 p-6">
                        <div className="flex items-center gap-3 mb-3">
                          <TrendingUp size={20} strokeWidth={1} className="text-green-600" />
                          <div className="text-xs font-light uppercase tracking-wider text-gray-600">
                            Network Efficiency
                          </div>
                        </div>
                        <div className="text-3xl font-light text-green-600">
                          {avgEfficiency.toFixed(1)}%
                        </div>
                        <div className="text-xs font-light text-gray-500 mt-1">
                          Average across {completedCycles.length} cycles
                        </div>
                      </div>

                      {/* Total Savings */}
                      <div className="border border-gray-200 p-6">
                        <div className="flex items-center gap-3 mb-3">
                          <DollarSign size={20} strokeWidth={1} className="text-green-600" />
                          <div className="text-xs font-light uppercase tracking-wider text-gray-600">
                            Total Savings
                          </div>
                        </div>
                        <div className="text-3xl font-light text-green-600">
                          ${totalSavings.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                        </div>
                        <div className="text-xs font-light text-gray-500 mt-1">
                          vs wire transfers (2.5% fee)
                        </div>
                      </div>

                      {/* Net Position */}
                      <div className="border border-gray-200 p-6">
                        <div className="flex items-center gap-3 mb-3">
                          {totalReceived >= totalPaid ? (
                            <TrendingUp size={20} strokeWidth={1} className="text-green-600" />
                          ) : (
                            <TrendingDown size={20} strokeWidth={1} className="text-red-600" />
                          )}
                          <div className="text-xs font-light uppercase tracking-wider text-gray-600">
                            Net Position
                          </div>
                        </div>
                        <div className={`text-3xl font-light ${totalReceived >= totalPaid ? 'text-green-600' : 'text-red-600'}`}>
                          ${Math.abs(totalReceived - totalPaid).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                        </div>
                        <div className="text-xs font-light text-gray-500 mt-1">
                          {totalReceived >= totalPaid ? 'Net receiver' : 'Net payer'}
                        </div>
                      </div>
                    </div>

                    {/* Settlement History */}
                    <div>
                      <h2 className="text-2xl font-light mb-6 text-black">Settlement History</h2>

                      {cycles.length === 0 ? (
                        <div className="border border-gray-200 p-12 text-center">
                          <p className="text-gray-600 font-light mb-4">No settlements yet</p>
                          <p className="text-sm text-gray-500 font-light">
                            Settlements are processed daily at 5:00 PM Dubai time
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-6">
                          {cycles.map(({ cycleId, settlements: cycleSettlements, cycle }) => {
                            const isExpanded = selectedCycle === cycleId

                            // Calculate net for this member in this cycle
                            const netAmount = cycleSettlements.reduce((sum, s) => {
                              if (s.from_member_id === memberId) return sum - Number(s.amount_usd)
                              if (s.to_member_id === memberId) return sum + Number(s.amount_usd)
                              return sum
                            }, 0)

                            const totalFeeForCycle = cycleSettlements.reduce((sum, s) => sum + Number(s.fee_usd || 0), 0)

                            return (
                              <div key={cycleId} className="border border-gray-200">
                                {/* Cycle Header */}
                                <button
                                  onClick={() => setSelectedCycle(isExpanded ? null : cycleId)}
                                  className="w-full px-6 py-5 flex justify-between items-center hover:bg-gray-50 transition-colors text-left"
                                >
                                  <div className="flex items-center gap-6">
                                    <div>
                                      <div className="flex items-center gap-3 mb-2">
                                        <Calendar size={16} strokeWidth={1} className="text-black" />
                                        <div className="text-lg font-light text-black">
                                          {new Date(cycle!.cycle_time).toLocaleDateString('en-US', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                          })}
                                        </div>
                                      </div>
                                      <div className="text-sm font-light text-gray-600">
                                        {cycle!.total_transactions} transactions • {cycleSettlements.length} settlement{cycleSettlements.length !== 1 ? 's' : ''}
                                      </div>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-8">
                                    <div className="text-right">
                                      <div className="text-xs font-light uppercase tracking-wider text-gray-600 mb-1">
                                        Your Net Position
                                      </div>
                                      <div className={`text-xl font-light ${netAmount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {netAmount >= 0 ? '+' : ''}${netAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                      </div>
                                    </div>

                                    <div className="text-right">
                                      <div className="text-xs font-light uppercase tracking-wider text-gray-600 mb-1">
                                        Network Efficiency
                                      </div>
                                      <div className="text-xl font-light text-green-600">
                                        {Number(cycle!.savings_percentage || 0).toFixed(1)}%
                                      </div>
                                    </div>

                                    <div className="text-right">
                                      <span className={`inline-block px-3 py-1 text-xs font-light ${
                                        cycle!.status === 'completed' ? 'bg-green-50 text-green-700' :
                                        cycle!.status === 'processing' ? 'bg-yellow-50 text-yellow-700' :
                                        'bg-gray-50 text-gray-700'
                                      }`}>
                                        {cycle!.status}
                                      </span>
                                    </div>
                                  </div>
                                </button>

                                {/* Cycle Details (Expanded) */}
                                {isExpanded && (
                                  <div className="border-t border-gray-200 bg-gray-50">
                                    <div className="px-6 py-6">
                                      <div className="grid grid-cols-2 gap-8 mb-6">
                                        <div>
                                          <h4 className="text-xs font-light uppercase tracking-wider text-gray-600 mb-4">
                                            Cycle Statistics
                                          </h4>
                                          <div className="space-y-3 text-sm font-light">
                                            <div className="flex justify-between">
                                              <span className="text-gray-600">Total Volume:</span>
                                              <span className="text-black">
                                                ${Number(cycle!.total_volume).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                              </span>
                                            </div>
                                            <div className="flex justify-between">
                                              <span className="text-gray-600">Net Settlements:</span>
                                              <span className="text-black">{cycle!.net_settlements}</span>
                                            </div>
                                            <div className="flex justify-between">
                                              <span className="text-gray-600">Your Transaction Fee:</span>
                                              <span className="text-black">
                                                ${totalFeeForCycle.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                              </span>
                                            </div>
                                            <div className="flex justify-between">
                                              <span className="text-gray-600">Completed:</span>
                                              <span className="text-black">
                                                {cycle!.completed_at ? new Date(cycle!.completed_at).toLocaleString() : 'Pending'}
                                              </span>
                                            </div>
                                          </div>
                                        </div>

                                        <div>
                                          <h4 className="text-xs font-light uppercase tracking-wider text-gray-600 mb-4">
                                            Your Settlements
                                          </h4>
                                          <div className="space-y-3">
                                            {cycleSettlements.map(settlement => {
                                              const isPayer = settlement.from_member_id === memberId
                                              const counterpartyId = isPayer ? settlement.to_member_id : settlement.from_member_id
                                              const counterpartyName = counterpartyMap[counterpartyId] || 'Unknown'

                                              return (
                                                <div key={settlement.id} className="flex justify-between items-center text-sm font-light">
                                                  <div>
                                                    <span className="text-gray-600">
                                                      {isPayer ? 'Pay to' : 'Receive from'}:
                                                    </span>
                                                    <span className="ml-2 text-black">{counterpartyName}</span>
                                                  </div>
                                                  <span className={`font-medium ${isPayer ? 'text-red-600' : 'text-green-600'}`}>
                                                    {isPayer ? '-' : '+'}${Number(settlement.amount_usd).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                                  </span>
                                                </div>
                                              )
                                            })}
                                          </div>
                                        </div>
                                      </div>

                                      <div className="pt-4 border-t border-gray-200">
                                        <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
                                          <p className="text-sm font-light text-blue-900">
                                            <strong>Network Efficiency Explained:</strong> Through our settlement optimization,
                                            your {cycle!.total_transactions} transactions were consolidated into just {cycleSettlements.length}
                                            {cycleSettlements.length === 1 ? ' settlement' : ' settlements'},
                                            reducing settlement volume by {Number(cycle!.savings_percentage).toFixed(1)}%
                                            compared to individual wire transfers.
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>

                    {/* Info Box */}
                    {cycles.length > 0 && (
                      <div className="mt-12 border border-gray-200 p-6 bg-gray-50">
                        <h3 className="text-lg font-light mb-4 text-black">About Your Settlements</h3>
                        <div className="space-y-3 text-sm font-light text-gray-700">
                          <p>
                            <strong>Settlement Timing:</strong> Settlements are processed once daily at 5:00 PM Dubai time.
                            All pending transactions are included in the next settlement cycle.
                          </p>
                          <p>
                            <strong>Network Efficiency:</strong> This metric shows how much settlement volume was reduced
                            through our network optimization. Higher percentages mean more efficient settlements and lower costs.
                          </p>
                          <p>
                            <strong>Transaction Fees:</strong> You are charged 0.8% on your gross transaction volume.
                            This is significantly lower than traditional wire transfer fees (typically 2-3%).
                          </p>
                          <p>
                            <strong>Total Savings:</strong> Calculated by comparing our 0.8% fee to typical wire transfer fees of 2.5%,
                            showing your actual cost savings by using the Bosun platform.
                          </p>
                        </div>
                      </div>
                    )}
                  </>
                )
              })()}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}