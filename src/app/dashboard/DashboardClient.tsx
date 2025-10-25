// src/app/dashboard/DashboardClient.tsx
'use client'

import React, { useState } from 'react'
import { ArrowUpRight, ArrowDownLeft, Clock, DollarSign, Plus, Settings, LogOut, Play } from 'lucide-react'
import { signOut } from '@/lib/supabase/auth'
import { useRouter } from 'next/navigation'

interface Transaction {
  id: string
  counterparty: string
  amount: number
  type: 'owing' | 'owed'
  date: string
  status: string
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
  userEmail: string
  isAdmin?: boolean
}

export default function DashboardClient({ member, transactions, userEmail, isAdmin = false }: DashboardClientProps) {
  const [activeTab, setActiveTab] = useState('overview')
  const [testingSettlement, setTestingSettlement] = useState(false)
  const [settlementResult, setSettlementResult] = useState<any>(null)
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

      const data = await response.json()
      setSettlementResult(data)

      if (!response.ok) {
        console.error('Settlement test failed:', data)
      }
    } catch (error) {
      console.error('Settlement test error:', error)
      setSettlementResult({ error: 'Failed to test settlement' })
    } finally {
      setTestingSettlement(false)
    }
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
                  settlementResult.error || settlementResult.violations 
                    ? 'border-red-200 bg-red-50' 
                    : 'border-green-200 bg-green-50'
                }`}>
                  <h3 className="text-lg font-medium mb-4 text-black">
                    {settlementResult.simulation ? 'Settlement Test Result' : 'Settlement Result'}
                  </h3>
                  
                  {settlementResult.error ? (
                    <div className="space-y-3">
                      <p className="text-red-700 font-medium">
                        ❌ {settlementResult.message || settlementResult.error}
                      </p>
                      {settlementResult.details && (
                        <pre className="text-xs bg-red-100 p-4 rounded overflow-auto font-mono text-red-800">
                          {settlementResult.details}
                        </pre>
                      )}
                      {settlementResult.violations && settlementResult.violations.length > 0 && (
                        <div className="mt-4">
                          <p className="font-medium text-red-800 mb-2">Circuit Breaker Violations:</p>
                          <ul className="list-disc list-inside space-y-1 text-sm text-red-700">
                            {settlementResult.violations.map((v: any, i: number) => (
                              <li key={i}>{v.message}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ) : settlementResult.preview ? (
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
                      
                      {settlementResult.circuit_breakers?.warnings && 
                       settlementResult.circuit_breakers.warnings.length > 0 && (
                        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded">
                          <p className="font-medium text-yellow-800 mb-2">⚠️ Warnings:</p>
                          <ul className="list-disc list-inside space-y-1 text-sm text-yellow-700">
                            {settlementResult.circuit_breakers.warnings.map((w: any, i: number) => (
                              <li key={i}>{w.message}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ) : settlementResult.message ? (
                    <p className="text-gray-700 font-light">{settlementResult.message}</p>
                  ) : null}
                  
                  <button
                    onClick={() => setSettlementResult(null)}
                    className="mt-4 text-sm font-light text-gray-600 hover:text-black transition-colors"
                  >
                    Dismiss
                  </button>
                </div>
              )}

              {/* Balance Cards */}
              <div className="grid grid-cols-3 gap-6 mb-12">
                <div className="border border-gray-200 p-6">
                  <div className="flex items-center gap-2 mb-3 text-black">
                    <ArrowDownLeft size={16} strokeWidth={1} />
                    <span className="text-xs font-light uppercase tracking-wider">You Are Owed</span>
                  </div>
                  <div className="text-3xl font-light mb-1 text-black">
                    ${member.balance.owed.toLocaleString()}
                  </div>
                  <div className="text-xs font-light text-gray-500">Pending settlement</div>
                </div>

                <div className="border border-gray-200 p-6">
                  <div className="flex items-center gap-2 mb-3 text-black">
                    <ArrowUpRight size={16} strokeWidth={1} />
                    <span className="text-xs font-light uppercase tracking-wider">You Owe</span>
                  </div>
                  <div className="text-3xl font-light mb-1 text-black">
                    ${member.balance.owing.toLocaleString()}
                  </div>
                  <div className="text-xs font-light text-gray-500">Pending settlement</div>
                </div>

                <div className="border border-gray-200 p-6 bg-gray-50">
                  <div className="flex items-center gap-2 mb-3 text-black">
                    <DollarSign size={16} strokeWidth={1} />
                    <span className="text-xs font-light uppercase tracking-wider">Net Position</span>
                  </div>
                  <div className="text-3xl font-light mb-1 text-black">
                    ${Math.abs(member.balance.net).toLocaleString()}
                  </div>
                  <div className="text-xs font-light text-gray-600">
                    {member.balance.net < 0 ? 'You will pay' : 'You will receive'}
                  </div>
                </div>
              </div>

              {/* Next Settlement */}
              <div className="border border-gray-200 p-8 mb-12">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-3 text-black">
                      <Clock size={16} strokeWidth={1} />
                      <span className="text-xs font-light uppercase tracking-wider">Next Settlement</span>
                    </div>
                    <div className="text-4xl font-light mb-2 text-black">{nextSettlement.time}</div>
                    <div className="text-sm font-light text-gray-700 mb-6">{nextSettlement.date}</div>
                    <div className="inline-block px-4 py-2 bg-gray-50 text-sm font-light text-black">
                      {nextSettlement.hoursRemaining} hours remaining
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-light text-gray-600 mb-2">Estimated settlement</div>
                    <div className="text-2xl font-light mb-1 text-black">
                      ${Math.abs(member.balance.net).toLocaleString()}
                    </div>
                    <div className="text-xs font-light text-gray-500">
                      Fee: ${(Math.abs(member.balance.net) * 0.008).toLocaleString()} (0.8%)
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
                {transactions.length > 0 ? (
                  <div className="border border-gray-200">
                    <div className="grid grid-cols-4 gap-4 px-6 py-4 border-b border-gray-200 bg-gray-50">
                      <div className="text-xs font-light uppercase tracking-wider text-gray-700">Counterparty</div>
                      <div className="text-xs font-light uppercase tracking-wider text-gray-700">Amount</div>
                      <div className="text-xs font-light uppercase tracking-wider text-gray-700">Date</div>
                      <div className="text-xs font-light uppercase tracking-wider text-gray-700">Status</div>
                    </div>
                    {transactions.map(tx => (
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
            <div>
              <h1 className="text-4xl font-light mb-8 text-black">Transactions</h1>
              <p className="text-gray-700 font-light">Transaction list view coming soon...</p>
            </div>
          )}

          {activeTab === 'settlements' && (
            <div>
              <h1 className="text-4xl font-light mb-8 text-black">Settlements</h1>
              <p className="text-gray-700 font-light">Settlement history coming soon...</p>
            </div>
          )}

          {activeTab === 'documents' && (
            <div>
              <h1 className="text-4xl font-light mb-8 text-black">Documents</h1>
              <p className="text-gray-700 font-light">Document repository coming soon...</p>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}