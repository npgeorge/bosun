// src/app/admin/AdminClient.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Users, 
  FileText, 
  Activity, 
  Settings, 
  LogOut, 
  CheckCircle, 
  XCircle, 
  Download,
  RefreshCw,
  Play,
  Clock
} from 'lucide-react'
import { signOut } from '@/lib/supabase/auth'
import { createClient } from '@/lib/supabase/client'

interface Application {
  id: string
  member_id: string
  user_id: string
  bank_name: string
  bank_account_number: string
  bank_swift_code: string
  company_address: string
  company_phone: string
  trade_license_path: string
  bank_statement_path: string
  status: string
  created_at: string
  members: {
    id: string
    company_name: string
    registration_number: string
    contact_email: string
    kyc_status: string
    created_at: string
  }
  users: {
    email: string
    name: string
  }
}

interface Member {
  id: string
  company_name: string
  registration_number: string
  contact_email: string
  kyc_status: string
  collateral_amount: number
  join_date: string
  created_at: string
  users: {
    name: string
    email: string
  }[]
}

interface Settlement {
  id: string
  cycle_time: string
  status: string
  total_transactions: number
  total_volume: number
  net_settlements: number
  savings_percentage: number
  created_at: string
  completed_at: string
}

interface AuditLog {
  id: string
  action: string
  entity_type: string
  entity_id: string
  details: any
  timestamp: string
  users: {
    name: string
    email: string
  }
}

export default function AdminClient({
  applications,
  members,
  recentSettlements,
  auditLogs,
  userEmail
}: {
  applications: Application[]
  members: Member[]
  recentSettlements: Settlement[]
  auditLogs: AuditLog[]
  userEmail: string
}) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('applications')
  const [processing, setProcessing] = useState<string | null>(null)
  const [settlementRunning, setSettlementRunning] = useState(false)
  const [settlementResult, setSettlementResult] = useState<any>(null)

  async function handleLogout() {
    await signOut()
    router.push('/auth/login')
    router.refresh()
  }

  async function approveApplication(applicationId: string, memberId: string) {
    if (!confirm('Are you sure you want to approve this application?')) return

    setProcessing(applicationId)

    try {
      const supabase = createClient()

      // Update member status
      const { error: memberError } = await supabase
        .from('members')
        .update({ kyc_status: 'approved' })
        .eq('id', memberId)

      if (memberError) throw memberError

      // Update application status
      const { error: appError } = await supabase
        .from('member_applications')
        .update({ 
          status: 'approved',
          reviewed_at: new Date().toISOString()
        })
        .eq('id', applicationId)

      if (appError) throw appError

      alert('Application approved successfully!')
      router.refresh()

    } catch (error: any) {
      console.error('Approval error:', error)
      alert(`Failed to approve: ${error.message}`)
    } finally {
      setProcessing(null)
    }
  }

  async function rejectApplication(applicationId: string, memberId: string) {
    const reason = prompt('Enter rejection reason:')
    if (!reason) return

    setProcessing(applicationId)

    try {
      const supabase = createClient()

      // Update member status
      const { error: memberError } = await supabase
        .from('members')
        .update({ kyc_status: 'rejected' })
        .eq('id', memberId)

      if (memberError) throw memberError

      // Update application status
      const { error: appError } = await supabase
        .from('member_applications')
        .update({ 
          status: 'rejected',
          rejection_reason: reason,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', applicationId)

      if (appError) throw appError

      alert('Application rejected')
      router.refresh()

    } catch (error: any) {
      console.error('Rejection error:', error)
      alert(`Failed to reject: ${error.message}`)
    } finally {
      setProcessing(null)
    }
  }

  async function downloadDocument(path: string) {
    try {
      const supabase = createClient()
      const { data, error } = await supabase.storage
        .from('member-documents')
        .download(path)

      if (error) throw error

      // Create download link
      const url = URL.createObjectURL(data)
      const a = document.createElement('a')
      a.href = url
      a.download = path.split('/').pop() || 'document'
      a.click()
      URL.revokeObjectURL(url)

    } catch (error: any) {
      console.error('Download error:', error)
      alert(`Failed to download: ${error.message}`)
    }
  }

  async function runSettlement(simulation: boolean = false) {
    if (!simulation && !confirm('Are you sure you want to run ACTUAL settlement?')) return

    setSettlementRunning(true)
    setSettlementResult(null)

    try {
      const response = await fetch('/api/settlements/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ simulation })
      })

      const data = await response.json()
      setSettlementResult(data)

      if (data.success && !simulation) {
        alert('Settlement completed successfully!')
        router.refresh()
      }

    } catch (error: any) {
      console.error('Settlement error:', error)
      setSettlementResult({ error: error.message })
    } finally {
      setSettlementRunning(false)
    }
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200">
        <div className="px-8 py-6 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="text-2xl font-light tracking-wider text-black">BOSUN</div>
            <span className="px-3 py-1 bg-black text-white text-xs font-light">ADMIN</span>
          </div>
          <div className="flex items-center gap-6">
            <span className="text-sm font-light text-black">{userEmail}</span>
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
              onClick={() => setActiveTab('applications')}
              className={`w-full text-left px-4 py-3 text-sm font-light transition-colors text-black flex items-center gap-3 ${
                activeTab === 'applications' ? 'bg-gray-50' : 'hover:bg-gray-50'
              }`}
            >
              <FileText size={18} strokeWidth={1} />
              Applications
              {applications.length > 0 && (
                <span className="ml-auto px-2 py-0.5 bg-black text-white text-xs rounded-full">
                  {applications.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('settlements')}
              className={`w-full text-left px-4 py-3 text-sm font-light transition-colors text-black flex items-center gap-3 ${
                activeTab === 'settlements' ? 'bg-gray-50' : 'hover:bg-gray-50'
              }`}
            >
              <RefreshCw size={18} strokeWidth={1} />
              Settlements
            </button>

            <button
              onClick={() => setActiveTab('members')}
              className={`w-full text-left px-4 py-3 text-sm font-light transition-colors text-black flex items-center gap-3 ${
                activeTab === 'members' ? 'bg-gray-50' : 'hover:bg-gray-50'
              }`}
            >
              <Users size={18} strokeWidth={1} />
              Members
            </button>

            <button
              onClick={() => setActiveTab('audit')}
              className={`w-full text-left px-4 py-3 text-sm font-light transition-colors text-black flex items-center gap-3 ${
                activeTab === 'audit' ? 'bg-gray-50' : 'hover:bg-gray-50'
              }`}
            >
              <Activity size={18} strokeWidth={1} />
              Audit Log
            </button>

            <div className="pt-4 border-t border-gray-200 mt-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="w-full text-left px-4 py-3 text-sm font-light transition-colors text-gray-600 hover:text-black hover:bg-gray-50"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1 p-8">
          {/* Applications Tab */}
          {activeTab === 'applications' && (
            <div className="max-w-6xl">
              <h1 className="text-4xl font-light mb-8 text-black">Pending Applications</h1>

              {applications.length === 0 ? (
                <div className="border border-gray-200 p-12 text-center">
                  <p className="text-gray-600 font-light">No pending applications</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {applications.map(app => (
                    <div key={app.id} className="border border-gray-200 p-6">
                      <div className="flex justify-between items-start mb-6">
                        <div>
                          <h3 className="text-2xl font-light mb-2 text-black">
                            {app.members.company_name}
                          </h3>
                          <p className="text-sm font-light text-gray-600">
                            {app.members.contact_email}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-xs font-light text-gray-500 mb-1">
                            Applied {new Date(app.created_at).toLocaleDateString()}
                          </div>
                          <span className="inline-block px-3 py-1 bg-yellow-50 text-yellow-700 text-xs font-light">
                            Pending Review
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-6 mb-6">
                        <div>
                          <h4 className="text-xs font-light uppercase tracking-wider text-gray-600 mb-3">
                            Company Details
                          </h4>
                          <div className="space-y-2 text-sm font-light">
                            <div>
                              <span className="text-gray-600">Registration:</span>{' '}
                              <span className="text-black">{app.members.registration_number}</span>
                            </div>
                            <div>
                              <span className="text-gray-600">Contact:</span>{' '}
                              <span className="text-black">{app.users.name}</span>
                            </div>
                            <div>
                              <span className="text-gray-600">Phone:</span>{' '}
                              <span className="text-black">{app.company_phone}</span>
                            </div>
                            <div>
                              <span className="text-gray-600">Address:</span>{' '}
                              <span className="text-black">{app.company_address}</span>
                            </div>
                          </div>
                        </div>

                        <div>
                          <h4 className="text-xs font-light uppercase tracking-wider text-gray-600 mb-3">
                            Banking Details
                          </h4>
                          <div className="space-y-2 text-sm font-light">
                            <div>
                              <span className="text-gray-600">Bank:</span>{' '}
                              <span className="text-black">{app.bank_name}</span>
                            </div>
                            <div>
                              <span className="text-gray-600">Account:</span>{' '}
                              <span className="text-black">{app.bank_account_number}</span>
                            </div>
                            <div>
                              <span className="text-gray-600">SWIFT:</span>{' '}
                              <span className="text-black">{app.bank_swift_code}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="mb-6">
                        <h4 className="text-xs font-light uppercase tracking-wider text-gray-600 mb-3">
                          Documents
                        </h4>
                        <div className="flex gap-4">
                          <button
                            onClick={() => downloadDocument(app.trade_license_path)}
                            className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-sm font-light hover:bg-gray-50 transition-colors"
                          >
                            <Download size={16} />
                            Trade License
                          </button>
                          <button
                            onClick={() => downloadDocument(app.bank_statement_path)}
                            className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-sm font-light hover:bg-gray-50 transition-colors"
                          >
                            <Download size={16} />
                            Bank Statement
                          </button>
                        </div>
                      </div>

                      <div className="flex gap-4 border-t border-gray-200 pt-6">
                        <button
                          onClick={() => approveApplication(app.id, app.members.id)}
                          disabled={processing === app.id}
                          className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-black text-white text-sm font-light hover:bg-gray-800 transition-colors disabled:opacity-50"
                        >
                          <CheckCircle size={18} />
                          {processing === app.id ? 'Processing...' : 'Approve Application'}
                        </button>
                        <button
                          onClick={() => rejectApplication(app.id, app.members.id)}
                          disabled={processing === app.id}
                          className="flex-1 flex items-center justify-center gap-2 px-6 py-3 border border-red-300 text-red-600 text-sm font-light hover:bg-red-50 transition-colors disabled:opacity-50"
                        >
                          <XCircle size={18} />
                          Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Settlements Tab */}
          {activeTab === 'settlements' && (
            <div className="max-w-6xl">
              <div className="flex justify-between items-center mb-8">
                <h1 className="text-4xl font-light text-black">Settlement Control</h1>
                <div className="flex gap-4">
                  <button
                    onClick={() => runSettlement(true)}
                    disabled={settlementRunning}
                    className="px-6 py-3 border border-gray-300 text-black text-sm font-light hover:bg-gray-50 transition-colors flex items-center gap-2 disabled:opacity-50"
                  >
                    <Play size={16} />
                    Test Settlement
                  </button>
                  <button
                    onClick={() => runSettlement(false)}
                    disabled={settlementRunning}
                    className="px-6 py-3 bg-black text-white text-sm font-light hover:bg-gray-800 transition-colors flex items-center gap-2 disabled:opacity-50"
                  >
                    <RefreshCw size={16} />
                    {settlementRunning ? 'Running...' : 'Run Settlement'}
                  </button>
                </div>
              </div>

              {/* Settlement Result */}
              {settlementResult && (
                <div className={`mb-8 border p-6 ${
                  settlementResult.error || settlementResult.violations 
                    ? 'border-red-200 bg-red-50' 
                    : 'border-green-200 bg-green-50'
                }`}>
                  <h3 className="text-lg font-medium mb-4 text-black">
                    {settlementResult.simulation ? 'Simulation Result' : 'Settlement Complete'}
                  </h3>
                  
                  {settlementResult.error ? (
                    <div>
                      <p className="text-red-700 font-medium">❌ {settlementResult.message || settlementResult.error}</p>
                      {settlementResult.violations && (
                        <ul className="mt-3 list-disc list-inside space-y-1 text-sm text-red-600">
                          {settlementResult.violations.map((v: any, i: number) => (
                            <li key={i}>{v.message}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ) : settlementResult.preview ? (
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Transactions:</span>
                        <span className="ml-2 font-medium">{settlementResult.preview.transactions_to_process}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Settlements:</span>
                        <span className="ml-2 font-medium">{settlementResult.preview.settlements_generated}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Volume:</span>
                        <span className="ml-2 font-medium">${Number(settlementResult.preview.total_volume).toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Efficiency:</span>
                        <span className="ml-2 font-medium text-green-600">{settlementResult.preview.estimated_savings_percentage}%</span>
                      </div>
                    </div>
                  ) : settlementResult.success ? (
                    <div>
                      <p className="text-green-700 font-medium">✅ Settlement processed successfully!</p>
                      <div className="mt-3 text-sm text-gray-700">
                        <div>Cycle ID: {settlementResult.cycle_id}</div>
                        <div>Transactions: {settlementResult.transactions_processed}</div>
                        <div>Settlements: {settlementResult.settlements_generated}</div>
                        <div>Efficiency: {settlementResult.savings_percentage}%</div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-600">{settlementResult.message}</p>
                  )}
                  
                  <button
                    onClick={() => setSettlementResult(null)}
                    className="mt-4 text-sm font-light text-gray-600 hover:text-black transition-colors"
                  >
                    Dismiss
                  </button>
                </div>
              )}

              {/* Recent Settlements */}
              <div>
                <h2 className="text-2xl font-light mb-6 text-black">Recent Settlements</h2>
                {recentSettlements.length === 0 ? (
                  <div className="border border-gray-200 p-12 text-center">
                    <p className="text-gray-600 font-light">No settlements yet</p>
                  </div>
                ) : (
                  <div className="border border-gray-200">
                    <div className="grid grid-cols-6 gap-4 px-6 py-4 border-b border-gray-200 bg-gray-50">
                      <div className="text-xs font-light uppercase tracking-wider text-gray-700">Date</div>
                      <div className="text-xs font-light uppercase tracking-wider text-gray-700">Status</div>
                      <div className="text-xs font-light uppercase tracking-wider text-gray-700">Transactions</div>
                      <div className="text-xs font-light uppercase tracking-wider text-gray-700">Volume</div>
                      <div className="text-xs font-light uppercase tracking-wider text-gray-700">Settlements</div>
                      <div className="text-xs font-light uppercase tracking-wider text-gray-700">Efficiency</div>
                    </div>
                    {recentSettlements.map(settlement => (
                      <div key={settlement.id} className="grid grid-cols-6 gap-4 px-6 py-4 border-b border-gray-200 last:border-b-0 hover:bg-gray-50 transition-colors">
                        <div className="text-sm font-light text-gray-700">
                          {new Date(settlement.cycle_time).toLocaleDateString()}
                        </div>
                        <div>
                          <span className={`inline-block px-3 py-1 text-xs font-light ${
                            settlement.status === 'completed' ? 'bg-green-50 text-green-700' :
                            settlement.status === 'processing' ? 'bg-yellow-50 text-yellow-700' :
                            'bg-red-50 text-red-700'
                          }`}>
                            {settlement.status}
                          </span>
                        </div>
                        <div className="text-sm font-light text-black">{settlement.total_transactions}</div>
                        <div className="text-sm font-light text-black">
                          ${Number(settlement.total_volume || 0).toLocaleString()}
                        </div>
                        <div className="text-sm font-light text-black">{settlement.net_settlements || 0}</div>
                        <div className="text-sm font-light text-green-600">
                          {Number(settlement.savings_percentage || 0).toFixed(1)}%
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Members Tab */}
          {activeTab === 'members' && (
            <div className="max-w-6xl">
              <h1 className="text-4xl font-light mb-8 text-black">All Members</h1>

              {members.length === 0 ? (
                <div className="border border-gray-200 p-12 text-center">
                  <p className="text-gray-600 font-light">No members yet</p>
                </div>
              ) : (
                <div className="border border-gray-200">
                  <div className="grid grid-cols-5 gap-4 px-6 py-4 border-b border-gray-200 bg-gray-50">
                    <div className="text-xs font-light uppercase tracking-wider text-gray-700">Company</div>
                    <div className="text-xs font-light uppercase tracking-wider text-gray-700">Contact</div>
                    <div className="text-xs font-light uppercase tracking-wider text-gray-700">Registration</div>
                    <div className="text-xs font-light uppercase tracking-wider text-gray-700">Status</div>
                    <div className="text-xs font-light uppercase tracking-wider text-gray-700">Joined</div>
                  </div>
                  {members.map(member => (
                    <div key={member.id} className="grid grid-cols-5 gap-4 px-6 py-4 border-b border-gray-200 last:border-b-0 hover:bg-gray-50 transition-colors">
                      <div className="text-sm font-light text-black">{member.company_name}</div>
                      <div className="text-sm font-light text-gray-700">{member.contact_email}</div>
                      <div className="text-sm font-light text-gray-700">{member.registration_number}</div>
                      <div>
                        <span className={`inline-block px-3 py-1 text-xs font-light ${
                          member.kyc_status === 'approved' ? 'bg-green-50 text-green-700' :
                          member.kyc_status === 'pending' ? 'bg-yellow-50 text-yellow-700' :
                          'bg-red-50 text-red-700'
                        }`}>
                          {member.kyc_status}
                        </span>
                      </div>
                      <div className="text-sm font-light text-gray-700">
                        {new Date(member.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Audit Log Tab */}
          {activeTab === 'audit' && (
            <div className="max-w-6xl">
              <h1 className="text-4xl font-light mb-8 text-black">Audit Log</h1>

              {auditLogs.length === 0 ? (
                <div className="border border-gray-200 p-12 text-center">
                  <p className="text-gray-600 font-light">No audit logs yet</p>
                </div>
              ) : (
                <div className="border border-gray-200">
                  <div className="grid grid-cols-5 gap-4 px-6 py-4 border-b border-gray-200 bg-gray-50">
                    <div className="text-xs font-light uppercase tracking-wider text-gray-700">Timestamp</div>
                    <div className="text-xs font-light uppercase tracking-wider text-gray-700">User</div>
                    <div className="text-xs font-light uppercase tracking-wider text-gray-700">Action</div>
                    <div className="text-xs font-light uppercase tracking-wider text-gray-700">Entity</div>
                    <div className="text-xs font-light uppercase tracking-wider text-gray-700">Details</div>
                  </div>
                  {auditLogs.map(log => (
                    <div key={log.id} className="grid grid-cols-5 gap-4 px-6 py-4 border-b border-gray-200 last:border-b-0 hover:bg-gray-50 transition-colors">
                      <div className="text-sm font-light text-gray-700">
                        {new Date(log.timestamp).toLocaleString()}
                      </div>
                      <div className="text-sm font-light text-black">
                        {log.users?.name || 'System'}
                      </div>
                      <div className="text-sm font-light text-black">{log.action}</div>
                      <div className="text-sm font-light text-gray-700">{log.entity_type}</div>
                      <div className="text-sm font-light text-gray-700 truncate">
                        {JSON.stringify(log.details).slice(0, 50)}...
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}