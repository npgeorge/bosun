// src/app/dashboard/DashboardClient.tsx
'use client'

import React, { useState, useMemo, useEffect } from 'react'
import { ArrowUpRight, ArrowDownLeft, Clock, DollarSign, Plus, Settings, LogOut, Play, Search, Filter, Download, FileText, Upload, X, TrendingUp, TrendingDown, Activity, Calendar, Paperclip, Menu, Bell, Users, BarChart3, CheckCircle2, AlertCircle } from 'lucide-react'
import { signOut } from '@/lib/supabase/auth'
import { useRouter } from 'next/navigation'
import type { SettlementResponse, SettlementErrorResponse } from '@/types/api'
import { isSettlementError, isSettlementSimulation, isNoTransactions } from '@/types/api'
import { createClient } from '@/lib/supabase/client'
import ShipWheelLogo from '@/components/ShipWheelLogo'

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
  documentCount: number
}

interface Document {
  id: string
  name: string
  size: number
  type: string
  uploadedAt: string
  url: string
  source: 'registration' | 'transaction'
  transactionId?: string
  transactionReference?: string
  transactionDate?: string
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
  settlement_cycles?: Array<{
    id: string
    cycle_time: string
    total_transactions: number
    total_volume: number
    net_settlements: number
    savings_percentage: number
    status: string
    completed_at: string
  }>
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
  const [viewingDocuments, setViewingDocuments] = useState<string | null>(null)
  const [transactionDocuments, setTransactionDocuments] = useState<Document[]>([])
  const [loadingDocuments, setLoadingDocuments] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // New filter states
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [amountMin, setAmountMin] = useState('')
  const [amountMax, setAmountMax] = useState('')

  // Notification states
  const [notifications, setNotifications] = useState<any[]>([])
  const [showNotifications, setShowNotifications] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  // Bulk import states
  const [showBulkImport, setShowBulkImport] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importPreview, setImportPreview] = useState<any[]>([])
  const [importing, setImporting] = useState(false)
  const [importError, setImportError] = useState('')

  // Outstanding Tasks state
  const [bankingInfo, setBankingInfo] = useState({
    bankName: '',
    bankAccountNumber: '',
    bankSwiftCode: ''
  })
  const [tradeLicense, setTradeLicense] = useState<File | null>(null)
  const [bankStatement, setBankStatement] = useState<File | null>(null)
  const [savingBanking, setSavingBanking] = useState(false)
  const [uploadingDocs, setUploadingDocs] = useState(false)
  const [taskError, setTaskError] = useState('')
  const [taskSuccess, setTaskSuccess] = useState('')

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

  async function viewTransactionDocuments(transactionId: string) {
    setLoadingDocuments(true)
    setViewingDocuments(transactionId)

    try {
      const supabase = createClient()

      // Get all documents for this transaction
      const { data: docs, error } = await supabase
        .from('transaction_documents')
        .select('*')
        .eq('transaction_id', transactionId)
        .order('uploaded_at', { ascending: false })

      if (error) throw error

      const formattedDocs: Document[] = docs?.map(doc => ({
        id: doc.id,
        name: doc.file_name,
        size: doc.file_size,
        type: doc.file_type,
        uploadedAt: doc.uploaded_at,
        url: doc.storage_path,
        source: 'transaction' as const,
        transactionId: doc.transaction_id
      })) || []

      setTransactionDocuments(formattedDocs)
    } catch (error) {
      console.error('Failed to load documents:', error)
      setTransactionDocuments([])
    } finally {
      setLoadingDocuments(false)
    }
  }

  async function downloadDocument(storagePath: string, fileName: string) {
    try {
      const supabase = createClient()

      const { data, error } = await supabase.storage
        .from('transaction-documents')
        .download(storagePath)

      if (error) throw error

      // Create download link
      const url = URL.createObjectURL(data)
      const a = document.createElement('a')
      a.href = url
      a.download = fileName
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Failed to download document:', error)
      alert('Failed to download document. Please try again.')
    }
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

  async function saveBankingInfo() {
    setSavingBanking(true)
    setTaskError('')
    setTaskSuccess('')

    try {
      const supabase = createClient()

      const { error } = await supabase
        .from('member_applications')
        .update({
          bank_name: bankingInfo.bankName,
          bank_account_number: bankingInfo.bankAccountNumber,
          bank_swift_code: bankingInfo.bankSwiftCode,
        })
        .eq('member_id', memberId)

      if (error) throw error

      setTaskSuccess('Banking information saved successfully!')
      setTimeout(() => setTaskSuccess(''), 3000)
    } catch (error) {
      console.error('Failed to save banking info:', error)
      setTaskError('Failed to save banking information. Please try again.')
    } finally {
      setSavingBanking(false)
    }
  }

  async function uploadDocuments() {
    setUploadingDocs(true)
    setTaskError('')
    setTaskSuccess('')

    try {
      if (!tradeLicense || !bankStatement) {
        throw new Error('Please select both documents to upload')
      }

      const supabase = createClient()

      // Upload trade license
      const licenseExt = tradeLicense.name.split('.').pop()
      const licensePath = `${memberId}/trade-license.${licenseExt}`

      const { error: licenseError } = await supabase.storage
        .from('member-documents')
        .upload(licensePath, tradeLicense, {
          upsert: true
        })

      if (licenseError) throw licenseError

      // Upload bank statement
      const statementExt = bankStatement.name.split('.').pop()
      const statementPath = `${memberId}/bank-statement.${statementExt}`

      const { error: statementError } = await supabase.storage
        .from('member-documents')
        .upload(statementPath, bankStatement, {
          upsert: true
        })

      if (statementError) throw statementError

      // Update member application with document paths
      const { error: updateError } = await supabase
        .from('member_applications')
        .update({
          trade_license_path: licensePath,
          bank_statement_path: statementPath,
          status: 'pending' // Update status from incomplete to pending
        })
        .eq('member_id', memberId)

      if (updateError) throw updateError

      setTaskSuccess('Documents uploaded successfully!')
      setTradeLicense(null)
      setBankStatement(null)
      setTimeout(() => {
        setTaskSuccess('')
        router.refresh()
      }, 2000)
    } catch (error) {
      console.error('Failed to upload documents:', error)
      setTaskError(error instanceof Error ? error.message : 'Failed to upload documents. Please try again.')
    } finally {
      setUploadingDocs(false)
    }
  }

  // Notifications - Load and subscribe to real-time updates
  useEffect(() => {
    const supabase = createClient()

    // Load initial notifications (mock for now - will be real-time)
    const loadNotifications = async () => {
      // This would fetch from a notifications table
      // For now, we'll simulate with transaction changes
      const recentTransactions = transactions.slice(0, 5).map(tx => ({
        id: `notif-${tx.id}`,
        type: 'transaction_created',
        message: `New transaction from ${tx.counterparty}`,
        data: tx,
        read: false,
        created_at: tx.createdAt
      }))
      setNotifications(recentTransactions)
      setUnreadCount(recentTransactions.length)
    }

    loadNotifications()

    // Set up real-time subscription
    const channel = supabase
      .channel('transactions')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'transactions' },
        (payload) => {
          // Handle real-time updates
          if (payload.eventType === 'INSERT') {
            const newNotif = {
              id: `notif-${payload.new.id}`,
              type: 'transaction_created',
              message: `New transaction received`,
              data: payload.new,
              read: false,
              created_at: new Date().toISOString()
            }
            setNotifications(prev => [newNotif, ...prev])
            setUnreadCount(prev => prev + 1)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [transactions])

  // CSV Export function
  async function exportToCSV() {
    const csvRows = []

    // Headers
    csvRows.push(['Date', 'Counterparty', 'Reference', 'Type', 'Amount', 'Status', 'Description', 'Created At'].join(','))

    // Data rows
    filteredTransactions.forEach(tx => {
      csvRows.push([
        tx.date,
        `"${tx.counterparty}"`,
        `"${tx.reference || ''}"`,
        tx.type === 'owed' ? 'Receivable' : 'Payable',
        tx.amount,
        tx.status,
        `"${tx.description || ''}"`,
        tx.createdAt
      ].join(','))
    })

    const csvContent = csvRows.join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `bosun-transactions-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // Bulk import CSV function
  async function handleFileImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setImportFile(file)
    setImportError('')

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string
        const lines = text.split('\n')
        const headers = lines[0].split(',').map(h => h.trim())

        const preview = lines.slice(1, 6).map(line => {
          const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''))
          const row: any = {}
          headers.forEach((header, i) => {
            row[header] = values[i]
          })
          return row
        }).filter(row => row.Counterparty) // Filter empty rows

        setImportPreview(preview)
      } catch (error) {
        setImportError('Failed to parse CSV file. Please check the format.')
      }
    }
    reader.readAsText(file)
  }

  async function processBulkImport() {
    if (!importFile) return

    setImporting(true)
    setImportError('')

    try {
      const reader = new FileReader()
      reader.onload = async (event) => {
        const text = event.target?.result as string
        const lines = text.split('\n')
        const headers = lines[0].split(',').map(h => h.trim())

        const supabase = createClient()
        const errors: string[] = []

        for (let i = 1; i < lines.length; i++) {
          if (!lines[i].trim()) continue

          const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''))
          const row: any = {}
          headers.forEach((header, j) => {
            row[header] = values[j]
          })

          // Insert transaction
          try {
            const { error } = await supabase.from('transactions').insert({
              member_id: memberId,
              counterparty_id: row.CounterpartyId || null,
              amount: parseFloat(row.Amount),
              type: row.Type?.toLowerCase() === 'receivable' ? 'owed' : 'owing',
              trade_date: row.Date,
              reference: row.Reference || '',
              description: row.Description || '',
              status: 'pending'
            })

            if (error) errors.push(`Row ${i}: ${error.message}`)
          } catch (err) {
            errors.push(`Row ${i}: Invalid data format`)
          }
        }

        if (errors.length > 0) {
          setImportError(`Import completed with ${errors.length} errors:\n${errors.join('\n')}`)
        } else {
          setShowBulkImport(false)
          setImportFile(null)
          setImportPreview([])
          router.refresh()
        }
      }
      reader.readAsText(importFile)
    } catch (error) {
      setImportError('Failed to import transactions. Please try again.')
    } finally {
      setImporting(false)
    }
  }

  // Mark notification as read
  function markAsRead(notifId: string) {
    setNotifications(prev => prev.map(n => n.id === notifId ? { ...n, read: true } : n))
    setUnreadCount(prev => Math.max(0, prev - 1))
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

      // Date range filter
      const txDate = new Date(tx.date)
      const matchesDateFrom = !dateFrom || txDate >= new Date(dateFrom)
      const matchesDateTo = !dateTo || txDate <= new Date(dateTo)

      // Amount range filter
      const matchesAmountMin = !amountMin || tx.amount >= parseFloat(amountMin)
      const matchesAmountMax = !amountMax || tx.amount <= parseFloat(amountMax)

      return matchesSearch && matchesStatus && matchesType && matchesDateFrom && matchesDateTo && matchesAmountMin && matchesAmountMax
    })
  }, [transactions, searchQuery, statusFilter, typeFilter, dateFrom, dateTo, amountMin, amountMax])

  // Calculate counterparty analytics
  const counterpartyAnalytics = useMemo(() => {
    const analytics: Record<string, {
      name: string
      totalTransactions: number
      totalVolume: number
      netPosition: number
      lastTransactionDate: string
    }> = {}

    transactions.forEach(tx => {
      if (!analytics[tx.counterparty]) {
        analytics[tx.counterparty] = {
          name: tx.counterparty,
          totalTransactions: 0,
          totalVolume: 0,
          netPosition: 0,
          lastTransactionDate: tx.date
        }
      }

      analytics[tx.counterparty].totalTransactions++
      analytics[tx.counterparty].totalVolume += tx.amount
      analytics[tx.counterparty].netPosition += tx.type === 'owed' ? tx.amount : -tx.amount

      if (new Date(tx.date) > new Date(analytics[tx.counterparty].lastTransactionDate)) {
        analytics[tx.counterparty].lastTransactionDate = tx.date
      }
    })

    return Object.values(analytics).sort((a, b) => b.totalVolume - a.totalVolume)
  }, [transactions])

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
        <div className="px-4 md:px-8 py-4 md:py-6 flex justify-between items-center">
          <div className="flex items-center gap-3">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 hover:bg-gray-50 transition-colors"
            >
              <Menu size={20} strokeWidth={1} className="text-black" />
            </button>
            <ShipWheelLogo size={28} className="text-black" />
            <div className="text-xl md:text-2xl font-light tracking-wider text-black">BOSUN</div>
          </div>
          <div className="flex items-center gap-2 md:gap-6">
            <span className="text-xs md:text-sm font-light text-black hidden sm:inline">{member.companyName}</span>

            {/* Notifications Bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 hover:bg-gray-50 transition-colors relative"
              >
                <Bell size={20} strokeWidth={1} className="text-black" />
                {unreadCount > 0 && (
                  <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-light">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notifications Backdrop */}
              {showNotifications && (
                <div
                  className="fixed inset-0 z-40 sm:hidden"
                  onClick={() => setShowNotifications(false)}
                />
              )}

              {/* Notifications Dropdown */}
              {showNotifications && (
                <div className="fixed sm:absolute right-4 sm:right-0 left-4 sm:left-auto mt-2 sm:w-80 max-w-sm bg-white border border-gray-200 shadow-lg z-50 max-h-96 overflow-y-auto">
                  <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                    <h3 className="font-light text-black">Notifications</h3>
                    <button
                      onClick={() => {
                        setNotifications(prev => prev.map(n => ({ ...n, read: true })))
                        setUnreadCount(0)
                      }}
                      className="text-xs font-light text-gray-600 hover:text-black"
                    >
                      Mark all read
                    </button>
                  </div>
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center text-gray-500 font-light text-sm">
                      No notifications
                    </div>
                  ) : (
                    <div>
                      {notifications.map(notif => (
                        <button
                          key={notif.id}
                          onClick={() => markAsRead(notif.id)}
                          className={`w-full p-4 border-b border-gray-100 text-left hover:bg-gray-50 transition-colors ${
                            !notif.read ? 'bg-blue-50' : ''
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`mt-1 ${!notif.read ? 'text-blue-600' : 'text-gray-400'}`}>
                              {notif.type === 'transaction_created' ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-light text-black">{notif.message}</p>
                              <p className="text-xs font-light text-gray-500 mt-1">
                                {new Date(notif.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {isAdmin && (
              <button
                onClick={() => router.push('/admin')}
                className="px-3 md:px-4 py-2 bg-gray-100 text-black text-xs md:text-sm font-light hover:bg-gray-200 transition-colors"
              >
                <span className="hidden sm:inline">Admin Panel</span>
                <span className="sm:hidden">Admin</span>
              </button>
            )}
            <button className="p-2 hover:bg-gray-50 transition-colors hidden sm:block">
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

      <div className="flex relative">
        {/* Mobile Menu Overlay */}
        {mobileMenuOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}

        {/* Sidebar Navigation */}
        <nav className={`${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 fixed lg:relative z-40 w-64 border-r border-gray-200 min-h-screen p-8 bg-white transition-transform duration-300 ease-in-out`}>
          <div className="space-y-2">
            <button
              onClick={() => { setActiveTab('overview'); setMobileMenuOpen(false); }}
              className={`w-full text-left px-4 py-3 text-sm font-light transition-colors text-black ${
                activeTab === 'overview' ? 'bg-gray-50' : 'hover:bg-gray-50'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => { setActiveTab('tasks'); setMobileMenuOpen(false); }}
              className={`w-full text-left px-4 py-3 text-sm font-light transition-colors text-black ${
                activeTab === 'tasks' ? 'bg-gray-50' : 'hover:bg-gray-50'
              }`}
            >
              Outstanding Tasks
            </button>
            <button
              onClick={() => { setActiveTab('transactions'); setMobileMenuOpen(false); }}
              className={`w-full text-left px-4 py-3 text-sm font-light transition-colors text-black ${
                activeTab === 'transactions' ? 'bg-gray-50' : 'hover:bg-gray-50'
              }`}
            >
              Transactions
            </button>
            <button
              onClick={() => { setActiveTab('counterparties'); setMobileMenuOpen(false); }}
              className={`w-full text-left px-4 py-3 text-sm font-light transition-colors text-black ${
                activeTab === 'counterparties' ? 'bg-gray-50' : 'hover:bg-gray-50'
              }`}
            >
              Counterparties
            </button>
            <button
              onClick={() => { setActiveTab('settlements'); setMobileMenuOpen(false); }}
              className={`w-full text-left px-4 py-3 text-sm font-light transition-colors text-black ${
                activeTab === 'settlements' ? 'bg-gray-50' : 'hover:bg-gray-50'
              }`}
            >
              Settlements
            </button>
            <button
              onClick={() => { setActiveTab('documents'); setMobileMenuOpen(false); }}
              className={`w-full text-left px-4 py-3 text-sm font-light transition-colors text-black ${
                activeTab === 'documents' ? 'bg-gray-50' : 'hover:bg-gray-50'
              }`}
            >
              Documents
            </button>
            <button
              onClick={() => { setActiveTab('reports'); setMobileMenuOpen(false); }}
              className={`w-full text-left px-4 py-3 text-sm font-light transition-colors text-black ${
                activeTab === 'reports' ? 'bg-gray-50' : 'hover:bg-gray-50'
              }`}
            >
              Reports & Export
            </button>
            <button
              onClick={() => { setActiveTab('test-settlement'); setMobileMenuOpen(false); }}
              className={`w-full text-left px-4 py-3 text-sm font-light transition-colors text-black ${
                activeTab === 'test-settlement' ? 'bg-gray-50' : 'hover:bg-gray-50'
              }`}
            >
              Test Settlement
            </button>
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1 p-4 md:p-8">
          {activeTab === 'overview' && (
            <div className="max-w-6xl">
              {/* Page Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 md:mb-12 gap-4">
                <h1 className="text-3xl md:text-4xl font-light text-black">Overview</h1>
                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                  <button
                    onClick={testSettlement}
                    disabled={testingSettlement}
                    className="px-4 md:px-6 py-2 md:py-3 border border-gray-300 text-black text-xs md:text-sm font-light hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <Play size={16} />
                    <span className="hidden sm:inline">{testingSettlement ? 'Testing...' : 'Test Settlement'}</span>
                    <span className="sm:hidden">{testingSettlement ? 'Test...' : 'Test'}</span>
                  </button>

                  <button
                    onClick={() => router.push('/transactions/new')}
                    className="px-4 md:px-6 py-2 md:py-3 bg-black text-white text-xs md:text-sm font-light hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
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
                          <div className="text-xs font-light text-gray-600 mb-1">Transaction Fees (0.8%)</div>
                          <div className="text-3xl font-light text-black">
                            ${Number(settlementResult.preview.total_fees).toLocaleString()}
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
              <div className="flex flex-col lg:flex-row gap-4 md:gap-6 mb-8 md:mb-12">
                {/* Account Balance */}
                <div className="flex-1 lg:flex-[3]">
                  <div className="border border-gray-200 p-6 md:p-8 bg-gray-50 h-full">
                    <div className="flex items-center gap-2 mb-4 text-black">
                      <DollarSign size={20} strokeWidth={1} />
                      <span className="text-xs md:text-sm font-light uppercase tracking-wider">Account Balance</span>
                    </div>
                    <div className="text-4xl md:text-5xl font-light mb-2 text-black">
                      ${Math.abs(member.balance.net).toLocaleString()}
                    </div>
                    <div className="text-sm font-light text-gray-600">
                      {member.balance.net < 0 ? 'You will pay' : member.balance.net > 0 ? 'You will receive' : 'Balanced'}
                    </div>
                  </div>
                </div>

                {/* Next Settlement */}
                <div className="flex-1 lg:flex-[1]">
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
                  <h2 className="text-xl md:text-2xl font-light text-black">Recent Transactions</h2>
                  <button
                    onClick={() => setActiveTab('transactions')}
                    className="text-xs md:text-sm font-light text-gray-700 hover:text-black transition-colors"
                  >
                    View all
                  </button>
                </div>
                {transactions.slice(0, 4).length > 0 ? (
                  <>
                    {/* Desktop Table View */}
                    <div className="hidden md:block border border-gray-200">
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

                    {/* Mobile Card View */}
                    <div className="md:hidden space-y-3">
                      {transactions.slice(0, 4).map(tx => (
                        <div key={tx.id} className="border border-gray-200 p-4 hover:bg-gray-50 transition-colors">
                          <div className="flex justify-between items-start mb-3">
                            <div className="text-sm font-light text-black">{tx.counterparty}</div>
                            <span className={`inline-block px-3 py-1 text-xs font-light ${
                              tx.status === 'settled' ? 'bg-gray-100 text-gray-700' :
                              tx.status === 'confirmed' ? 'bg-gray-50 text-black' :
                              'bg-gray-50 text-gray-600'
                            }`}>
                              {tx.status}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <div className={`text-lg font-light ${tx.type === 'owed' ? 'text-black' : 'text-gray-700'}`}>
                              {tx.type === 'owed' ? '+' : '-'}${tx.amount.toLocaleString()}
                            </div>
                            <div className="text-sm font-light text-gray-600">{tx.date}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
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

          {activeTab === 'tasks' && (
            <div className="max-w-4xl">
              {/* Page Header */}
              <div className="mb-8 md:mb-12">
                <h1 className="text-3xl md:text-4xl font-light text-black mb-4">Outstanding Tasks</h1>
                <p className="text-gray-600 font-light">
                  Complete these tasks to activate your account and start trading.
                </p>
              </div>

              {/* Status Messages */}
              {taskError && (
                <div className="mb-6 border border-red-200 bg-red-50 p-4 text-sm font-light text-red-600">
                  {taskError}
                </div>
              )}
              {taskSuccess && (
                <div className="mb-6 border border-green-200 bg-green-50 p-4 text-sm font-light text-green-600">
                  {taskSuccess}
                </div>
              )}

              {/* Banking Information */}
              <div className="border border-gray-200 mb-8">
                <div className="p-6 border-b border-gray-200 bg-gray-50">
                  <h2 className="text-xl font-light text-black">Banking Information</h2>
                  <p className="text-sm font-light text-gray-600 mt-2">
                    Provide your bank account details for settlements
                  </p>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-light uppercase tracking-wider text-gray-600 mb-2">
                        Bank Name *
                      </label>
                      <input
                        type="text"
                        value={bankingInfo.bankName}
                        onChange={(e) => setBankingInfo({ ...bankingInfo, bankName: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-200 text-sm font-light text-black focus:outline-none focus:border-black transition-colors"
                        placeholder="Enter your bank name"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-light uppercase tracking-wider text-gray-600 mb-2">
                        Account Number *
                      </label>
                      <input
                        type="text"
                        value={bankingInfo.bankAccountNumber}
                        onChange={(e) => setBankingInfo({ ...bankingInfo, bankAccountNumber: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-200 text-sm font-light text-black focus:outline-none focus:border-black transition-colors"
                        placeholder="Enter your account number"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-light uppercase tracking-wider text-gray-600 mb-2">
                        SWIFT/BIC Code *
                      </label>
                      <input
                        type="text"
                        value={bankingInfo.bankSwiftCode}
                        onChange={(e) => setBankingInfo({ ...bankingInfo, bankSwiftCode: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-200 text-sm font-light text-black focus:outline-none focus:border-black transition-colors"
                        placeholder="e.g., ABCDUAEXXXX"
                      />
                    </div>

                    <button
                      onClick={saveBankingInfo}
                      disabled={savingBanking || !bankingInfo.bankName || !bankingInfo.bankAccountNumber || !bankingInfo.bankSwiftCode}
                      className="px-6 py-3 bg-black text-white text-sm font-light hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {savingBanking ? 'Saving...' : 'Save Banking Information'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Required Documents */}
              <div className="border border-gray-200">
                <div className="p-6 border-b border-gray-200 bg-gray-50">
                  <h2 className="text-xl font-light text-black">Required Documents</h2>
                  <p className="text-sm font-light text-gray-600 mt-2">
                    Upload your trade license and bank statement for verification
                  </p>
                </div>
                <div className="p-6">
                  <div className="space-y-6">
                    {/* Trade License */}
                    <div>
                      <label className="block text-xs font-light uppercase tracking-wider text-gray-600 mb-2">
                        Trade License *
                      </label>
                      <div className="border-2 border-dashed border-gray-300 rounded p-6 text-center hover:border-gray-400 transition-colors">
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              const file = e.target.files[0]
                              if (file.size > 10 * 1024 * 1024) {
                                setTaskError('File size must be less than 10MB')
                                return
                              }
                              setTradeLicense(file)
                            }
                          }}
                          className="hidden"
                          id="trade-license"
                        />
                        <label htmlFor="trade-license" className="cursor-pointer">
                          {tradeLicense ? (
                            <div className="flex items-center justify-center gap-2">
                              <span className="text-sm text-green-600">✓ {tradeLicense.name}</span>
                              <button
                                type="button"
                                onClick={() => setTradeLicense(null)}
                                className="text-red-600 hover:text-red-800"
                              >
                                <X size={16} />
                              </button>
                            </div>
                          ) : (
                            <div>
                              <Upload className="mx-auto mb-2 text-gray-400" size={32} strokeWidth={1} />
                              <p className="text-sm font-light text-gray-600">Click to upload trade license</p>
                              <p className="text-xs font-light text-gray-500 mt-1">PDF, JPG, or PNG (max 10MB)</p>
                            </div>
                          )}
                        </label>
                      </div>
                    </div>

                    {/* Bank Statement */}
                    <div>
                      <label className="block text-xs font-light uppercase tracking-wider text-gray-600 mb-2">
                        Bank Statement (Last 3 months) *
                      </label>
                      <div className="border-2 border-dashed border-gray-300 rounded p-6 text-center hover:border-gray-400 transition-colors">
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              const file = e.target.files[0]
                              if (file.size > 10 * 1024 * 1024) {
                                setTaskError('File size must be less than 10MB')
                                return
                              }
                              setBankStatement(file)
                            }
                          }}
                          className="hidden"
                          id="bank-statement"
                        />
                        <label htmlFor="bank-statement" className="cursor-pointer">
                          {bankStatement ? (
                            <div className="flex items-center justify-center gap-2">
                              <span className="text-sm text-green-600">✓ {bankStatement.name}</span>
                              <button
                                type="button"
                                onClick={() => setBankStatement(null)}
                                className="text-red-600 hover:text-red-800"
                              >
                                <X size={16} />
                              </button>
                            </div>
                          ) : (
                            <div>
                              <Upload className="mx-auto mb-2 text-gray-400" size={32} strokeWidth={1} />
                              <p className="text-sm font-light text-gray-600">Click to upload bank statement</p>
                              <p className="text-xs font-light text-gray-500 mt-1">PDF, JPG, or PNG (max 10MB)</p>
                            </div>
                          )}
                        </label>
                      </div>
                    </div>

                    <button
                      onClick={uploadDocuments}
                      disabled={uploadingDocs || !tradeLicense || !bankStatement}
                      className="px-6 py-3 bg-black text-white text-sm font-light hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {uploadingDocs ? 'Uploading...' : 'Upload Documents'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'transactions' && (
            <div className="max-w-6xl">
              {/* Page Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 md:mb-12 gap-4">
                <h1 className="text-3xl md:text-4xl font-light text-black">Transactions</h1>
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={exportToCSV}
                    className="px-4 md:px-6 py-2 md:py-3 border border-gray-300 text-black text-xs md:text-sm font-light hover:bg-gray-50 transition-colors flex items-center gap-2"
                  >
                    <Download size={16} />
                    Export CSV
                  </button>
                  <button
                    onClick={() => setShowBulkImport(true)}
                    className="px-4 md:px-6 py-2 md:py-3 border border-gray-300 text-black text-xs md:text-sm font-light hover:bg-gray-50 transition-colors flex items-center gap-2"
                  >
                    <Upload size={16} />
                    Bulk Import
                  </button>
                  <button
                    onClick={() => router.push('/transactions/new')}
                    className="px-4 md:px-6 py-2 md:py-3 bg-black text-white text-xs md:text-sm font-light hover:bg-gray-800 transition-colors flex items-center gap-2"
                  >
                    <Plus size={16} />
                    New Transaction
                  </button>
                </div>
              </div>

              {/* Search and Filters */}
              <div className="mb-8 space-y-4">
                <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
                  {/* Search */}
                  <div className="flex-1 relative">
                    <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" strokeWidth={1} />
                    <input
                      type="text"
                      placeholder="Search by counterparty, reference, or description..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-12 pr-4 py-2 md:py-3 border border-gray-200 text-xs md:text-sm font-light text-black focus:outline-none focus:border-gray-400"
                    />
                  </div>

                  {/* Status Filter */}
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-4 py-2 md:py-3 border border-gray-200 text-xs md:text-sm font-light text-black focus:outline-none focus:border-gray-400 bg-white"
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
                    className="px-4 py-2 md:py-3 border border-gray-200 text-xs md:text-sm font-light text-black focus:outline-none focus:border-gray-400 bg-white"
                  >
                    <option value="all">All Types</option>
                    <option value="owed">Receivable</option>
                    <option value="owing">Payable</option>
                  </select>
                </div>

                {/* Advanced Filters */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                  {/* Date From */}
                  <div>
                    <label className="block text-xs font-light uppercase tracking-wider text-gray-600 mb-1">
                      Date From
                    </label>
                    <input
                      type="date"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                      className="w-full px-4 py-2 md:py-3 border border-gray-200 text-xs md:text-sm font-light text-black focus:outline-none focus:border-gray-400"
                    />
                  </div>

                  {/* Date To */}
                  <div>
                    <label className="block text-xs font-light uppercase tracking-wider text-gray-600 mb-1">
                      Date To
                    </label>
                    <input
                      type="date"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                      className="w-full px-4 py-2 md:py-3 border border-gray-200 text-xs md:text-sm font-light text-black focus:outline-none focus:border-gray-400"
                    />
                  </div>

                  {/* Amount Min */}
                  <div>
                    <label className="block text-xs font-light uppercase tracking-wider text-gray-600 mb-1">
                      Min Amount
                    </label>
                    <input
                      type="number"
                      value={amountMin}
                      onChange={(e) => setAmountMin(e.target.value)}
                      placeholder="0"
                      className="w-full px-4 py-2 md:py-3 border border-gray-200 text-xs md:text-sm font-light text-black focus:outline-none focus:border-gray-400"
                    />
                  </div>

                  {/* Amount Max */}
                  <div>
                    <label className="block text-xs font-light uppercase tracking-wider text-gray-600 mb-1">
                      Max Amount
                    </label>
                    <input
                      type="number"
                      value={amountMax}
                      onChange={(e) => setAmountMax(e.target.value)}
                      placeholder="999999"
                      className="w-full px-4 py-2 md:py-3 border border-gray-200 text-xs md:text-sm font-light text-black focus:outline-none focus:border-gray-400"
                    />
                  </div>
                </div>

                {/* Clear Filters Button */}
                {(dateFrom || dateTo || amountMin || amountMax || searchQuery || statusFilter !== 'all' || typeFilter !== 'all') && (
                  <button
                    onClick={() => {
                      setDateFrom('')
                      setDateTo('')
                      setAmountMin('')
                      setAmountMax('')
                      setSearchQuery('')
                      setStatusFilter('all')
                      setTypeFilter('all')
                    }}
                    className="text-xs md:text-sm font-light text-gray-600 hover:text-black transition-colors"
                  >
                    Clear all filters
                  </button>
                )}

                {/* Results count */}
                <div className="text-sm font-light text-gray-600">
                  Showing {filteredTransactions.length} of {transactions.length} transactions
                </div>
              </div>

              {/* Transactions Table */}
              {filteredTransactions.length > 0 ? (
                <>
                  {/* Desktop Table View */}
                  <div className="hidden md:block border border-gray-200 overflow-x-auto">
                    <div className="grid gap-4 px-6 py-4 border-b border-gray-200 bg-gray-50" style={{ gridTemplateColumns: '110px 2fr 1.5fr 110px 130px 100px 80px' }}>
                      <div className="text-xs font-light uppercase tracking-wider text-gray-700">Date</div>
                      <div className="text-xs font-light uppercase tracking-wider text-gray-700">Counterparty</div>
                      <div className="text-xs font-light uppercase tracking-wider text-gray-700">Reference</div>
                      <div className="text-xs font-light uppercase tracking-wider text-gray-700">Type</div>
                      <div className="text-xs font-light uppercase tracking-wider text-gray-700">Amount</div>
                      <div className="text-xs font-light uppercase tracking-wider text-gray-700">Status</div>
                      <div className="text-xs font-light uppercase tracking-wider text-gray-700 text-center">Docs</div>
                    </div>
                    {filteredTransactions.map(tx => (
                      <div
                        key={tx.id}
                        className="grid gap-4 px-6 py-4 border-b border-gray-200 last:border-b-0 hover:bg-gray-50 transition-colors"
                        style={{ gridTemplateColumns: '110px 2fr 1.5fr 110px 130px 100px 80px' }}
                      >
                        <div
                          onClick={() => setSelectedTransaction(tx)}
                          className="text-sm font-light text-gray-700 cursor-pointer"
                        >{tx.date}</div>
                        <div
                          onClick={() => setSelectedTransaction(tx)}
                          className="text-sm font-light text-black cursor-pointer"
                        >{tx.counterparty}</div>
                        <div
                          onClick={() => setSelectedTransaction(tx)}
                          className="text-sm font-light text-gray-600 cursor-pointer"
                        >{tx.reference || '—'}</div>
                        <div
                          onClick={() => setSelectedTransaction(tx)}
                          className="text-sm font-light text-gray-700 cursor-pointer"
                        >
                          {tx.type === 'owed' ? 'Receivable' : 'Payable'}
                        </div>
                        <div
                          onClick={() => setSelectedTransaction(tx)}
                          className={`text-sm font-light cursor-pointer ${tx.type === 'owed' ? 'text-black' : 'text-gray-700'}`}
                        >
                          {tx.type === 'owed' ? '+' : '-'}${tx.amount.toLocaleString()}
                        </div>
                        <div
                          onClick={() => setSelectedTransaction(tx)}
                          className="cursor-pointer"
                        >
                          <span className={`inline-block px-3 py-1 text-xs font-light ${
                            tx.status === 'settled' ? 'bg-gray-100 text-gray-700' :
                            tx.status === 'confirmed' ? 'bg-gray-50 text-black' :
                            'bg-gray-50 text-gray-600'
                          }`}>
                            {tx.status}
                          </span>
                        </div>
                        <div className="flex items-center justify-center">
                          {tx.documentCount > 0 ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                viewTransactionDocuments(tx.id)
                              }}
                              className="flex items-center gap-1 px-2 py-1 hover:bg-gray-100 transition-colors rounded"
                              title={`${tx.documentCount} document${tx.documentCount !== 1 ? 's' : ''}`}
                            >
                              <Paperclip size={16} strokeWidth={1} className="text-gray-600" />
                              <span className="text-xs font-light text-gray-600">{tx.documentCount}</span>
                            </button>
                          ) : (
                            <span className="text-xs font-light text-gray-400">—</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Mobile Card View */}
                  <div className="md:hidden space-y-3">
                    {filteredTransactions.map(tx => (
                      <div
                        key={tx.id}
                        onClick={() => setSelectedTransaction(tx)}
                        className="border border-gray-200 p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <div className="text-sm font-light text-black mb-1">{tx.counterparty}</div>
                            <div className="text-xs font-light text-gray-600">{tx.date}</div>
                          </div>
                          <span className={`inline-block px-3 py-1 text-xs font-light ${
                            tx.status === 'settled' ? 'bg-gray-100 text-gray-700' :
                            tx.status === 'confirmed' ? 'bg-gray-50 text-black' :
                            'bg-gray-50 text-gray-600'
                          }`}>
                            {tx.status}
                          </span>
                        </div>
                        <div className="flex justify-between items-center mb-2">
                          <div className={`text-lg font-light ${tx.type === 'owed' ? 'text-black' : 'text-gray-700'}`}>
                            {tx.type === 'owed' ? '+' : '-'}${tx.amount.toLocaleString()}
                          </div>
                          <div className="text-xs font-light text-gray-600">
                            {tx.type === 'owed' ? 'Receivable' : 'Payable'}
                          </div>
                        </div>
                        {tx.reference && (
                          <div className="text-xs font-light text-gray-600 mb-2">
                            Ref: {tx.reference}
                          </div>
                        )}
                        {tx.documentCount > 0 && (
                          <div className="flex items-center gap-1 text-xs font-light text-gray-600">
                            <Paperclip size={14} strokeWidth={1} />
                            <span>{tx.documentCount} document{tx.documentCount !== 1 ? 's' : ''}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </>

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
                            {selectedTransaction.type === 'owed' ? 'Receivable' : 'Payable'}
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

              {/* Document Viewer Modal */}
              {viewingDocuments && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setViewingDocuments(null)}>
                  <div className="bg-white p-8 max-w-3xl w-full mx-4 max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <h2 className="text-2xl font-light text-black">Transaction Documents</h2>
                        <p className="text-sm font-light text-gray-600 mt-1">
                          {transactionDocuments.length} document{transactionDocuments.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                      <button
                        onClick={() => setViewingDocuments(null)}
                        className="p-2 hover:bg-gray-50 transition-colors"
                      >
                        <X size={20} strokeWidth={1} className="text-black" />
                      </button>
                    </div>

                    {loadingDocuments ? (
                      <div className="py-12 text-center">
                        <p className="text-gray-600 font-light">Loading documents...</p>
                      </div>
                    ) : transactionDocuments.length === 0 ? (
                      <div className="py-12 text-center">
                        <FileText size={48} strokeWidth={1} className="mx-auto mb-4 text-gray-300" />
                        <p className="text-gray-600 font-light">No documents found</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {transactionDocuments.map(doc => (
                          <div
                            key={doc.id}
                            className="flex items-center justify-between p-4 border border-gray-200 hover:bg-gray-50 transition-colors"
                          >
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <FileText size={20} strokeWidth={1} className="text-gray-600 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-light text-black truncate">{doc.name}</div>
                                <div className="text-xs font-light text-gray-500">
                                  {formatFileSize(doc.size)} • Uploaded {formatDate(doc.uploadedAt)}
                                </div>
                              </div>
                            </div>
                            <button
                              onClick={() => downloadDocument(doc.url, doc.name)}
                              className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-black text-sm font-light hover:bg-gray-50 transition-colors flex-shrink-0"
                            >
                              <Download size={14} strokeWidth={1} />
                              Download
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="mt-8 flex justify-between">
                      {transactionDocuments.length > 1 && (
                        <button
                          onClick={() => {
                            transactionDocuments.forEach(doc => {
                              downloadDocument(doc.url, doc.name)
                            })
                          }}
                          className="px-6 py-3 bg-black text-white text-sm font-light hover:bg-gray-800 transition-colors"
                        >
                          Download All
                        </button>
                      )}
                      <button
                        onClick={() => setViewingDocuments(null)}
                        className="px-6 py-3 bg-gray-50 text-black text-sm font-light hover:bg-gray-100 transition-colors ml-auto"
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
              <div className="mb-8 md:mb-12">
                <h1 className="text-3xl md:text-4xl font-light text-black">Documents</h1>
              </div>

              {/* Documents Grid */}
              {documents.length > 0 ? (
                <div className="space-y-6">
                  {/* Statistics */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-8">
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
                        <span className="text-xs font-light uppercase tracking-wider">Registration Docs</span>
                      </div>
                      <div className="text-3xl font-light text-black">
                        {documents.filter(d => d.source === 'registration').length}
                      </div>
                    </div>

                    <div className="border border-gray-200 p-6">
                      <div className="flex items-center gap-2 mb-3 text-black">
                        <Paperclip size={16} strokeWidth={1} />
                        <span className="text-xs font-light uppercase tracking-wider">Transaction Docs</span>
                      </div>
                      <div className="text-3xl font-light text-black">
                        {documents.filter(d => d.source === 'transaction').length}
                      </div>
                    </div>
                  </div>

                  {/* Registration Documents Section */}
                  {documents.filter(d => d.source === 'registration').length > 0 && (
                    <div className="mb-8">
                      <h2 className="text-xl font-light mb-4 text-black">Registration Documents</h2>

                      {/* Desktop Table View */}
                      <div className="hidden md:block border border-gray-200 overflow-x-auto">
                        <div className="grid grid-cols-5 gap-4 px-6 py-4 border-b border-gray-200 bg-gray-50">
                          <div className="text-xs font-light uppercase tracking-wider text-gray-700">Document Name</div>
                          <div className="text-xs font-light uppercase tracking-wider text-gray-700">Type</div>
                          <div className="text-xs font-light uppercase tracking-wider text-gray-700">Size</div>
                          <div className="text-xs font-light uppercase tracking-wider text-gray-700">Upload Date</div>
                          <div className="text-xs font-light uppercase tracking-wider text-gray-700">Action</div>
                        </div>
                        {documents.filter(d => d.source === 'registration').map(doc => (
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

                      {/* Mobile Card View */}
                      <div className="md:hidden space-y-3">
                        {documents.filter(d => d.source === 'registration').map(doc => (
                          <div key={doc.id} className="border border-gray-200 p-4">
                            <div className="flex items-start gap-2 mb-3">
                              <FileText size={16} strokeWidth={1} className="text-gray-400 mt-1" />
                              <div className="flex-1">
                                <div className="text-sm font-light text-black mb-1">{doc.name}</div>
                                <div className="text-xs font-light text-gray-600">{doc.type}</div>
                              </div>
                            </div>
                            <div className="flex justify-between items-center mb-3 text-xs font-light text-gray-600">
                              <span>{formatFileSize(doc.size)}</span>
                              <span>{formatDate(doc.uploadedAt)}</span>
                            </div>
                            <a
                              href={doc.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center justify-center gap-2 w-full px-4 py-2 border border-gray-300 text-black text-sm font-light hover:bg-gray-50 transition-colors"
                            >
                              <Download size={14} strokeWidth={1} />
                              Download
                            </a>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Transaction Documents Section */}
                  {documents.filter(d => d.source === 'transaction').length > 0 && (
                    <div>
                      <h2 className="text-xl font-light mb-4 text-black">Transaction Documents</h2>

                      {/* Desktop Table View */}
                      <div className="hidden md:block border border-gray-200 overflow-x-auto">
                        <div className="grid grid-cols-6 gap-4 px-6 py-4 border-b border-gray-200 bg-gray-50">
                          <div className="text-xs font-light uppercase tracking-wider text-gray-700">Document Name</div>
                          <div className="text-xs font-light uppercase tracking-wider text-gray-700">Reference</div>
                          <div className="text-xs font-light uppercase tracking-wider text-gray-700">Trade Date</div>
                          <div className="text-xs font-light uppercase tracking-wider text-gray-700">Size</div>
                          <div className="text-xs font-light uppercase tracking-wider text-gray-700">Upload Date</div>
                          <div className="text-xs font-light uppercase tracking-wider text-gray-700">Action</div>
                        </div>
                        {documents.filter(d => d.source === 'transaction').map(doc => (
                          <div
                            key={doc.id}
                            className="grid grid-cols-6 gap-4 px-6 py-4 border-b border-gray-200 last:border-b-0 hover:bg-gray-50 transition-colors"
                          >
                            <div className="text-sm font-light text-black flex items-center gap-2">
                              <FileText size={16} strokeWidth={1} className="text-gray-400" />
                              <span className="truncate">{doc.name}</span>
                            </div>
                            <div className="text-sm font-light text-gray-700">{doc.transactionReference || '—'}</div>
                            <div className="text-sm font-light text-gray-600">{doc.transactionDate || '—'}</div>
                            <div className="text-sm font-light text-gray-600">{formatFileSize(doc.size)}</div>
                            <div className="text-sm font-light text-gray-600">{formatDate(doc.uploadedAt)}</div>
                            <div>
                              <button
                                onClick={() => downloadDocument(doc.url, doc.name)}
                                className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 text-black text-sm font-light hover:bg-gray-50 transition-colors"
                              >
                                <Download size={14} strokeWidth={1} />
                                Download
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Mobile Card View */}
                      <div className="md:hidden space-y-3">
                        {documents.filter(d => d.source === 'transaction').map(doc => (
                          <div key={doc.id} className="border border-gray-200 p-4">
                            <div className="flex items-start gap-2 mb-3">
                              <FileText size={16} strokeWidth={1} className="text-gray-400 mt-1" />
                              <div className="flex-1">
                                <div className="text-sm font-light text-black mb-1">{doc.name}</div>
                                <div className="text-xs font-light text-gray-600">Ref: {doc.transactionReference || '—'}</div>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2 mb-3 text-xs font-light text-gray-600">
                              <div>
                                <span className="text-gray-500">Trade Date: </span>
                                {doc.transactionDate || '—'}
                              </div>
                              <div>
                                <span className="text-gray-500">Size: </span>
                                {formatFileSize(doc.size)}
                              </div>
                              <div className="col-span-2">
                                <span className="text-gray-500">Uploaded: </span>
                                {formatDate(doc.uploadedAt)}
                              </div>
                            </div>
                            <button
                              onClick={() => downloadDocument(doc.url, doc.name)}
                              className="inline-flex items-center justify-center gap-2 w-full px-4 py-2 border border-gray-300 text-black text-sm font-light hover:bg-gray-50 transition-colors"
                            >
                              <Download size={14} strokeWidth={1} />
                              Download
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
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
              <div className="mb-8 md:mb-12">
                <h1 className="text-3xl md:text-4xl font-light text-black">Settlements</h1>
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
                  .filter(s => s.settlement_cycles?.[0]?.status === 'completed')
                  .map(s => s.settlement_cycles![0])
                  .filter((cycle, index, self) =>
                    cycle && index === self.findIndex(c => c?.id === cycle.id)
                  )

                const avgEfficiency = completedCycles.length > 0
                  ? completedCycles.reduce((sum, c) => sum + Number(c?.savings_percentage || 0), 0) / completedCycles.length
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
                    const cycle = cycleSettlements[0]?.settlement_cycles?.[0]
                    return { cycleId, settlements: cycleSettlements, cycle }
                  })
                  .filter(c => c.cycle)
                  .sort((a, b) =>
                    new Date(b.cycle!.cycle_time).getTime() - new Date(a.cycle!.cycle_time).getTime()
                  )

                return (
                  <>
                    {/* Statistics Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-8 md:mb-12">
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

          {activeTab === 'test-settlement' && (
            <div className="max-w-6xl">
              {/* Page Header */}
              <div className="mb-8 md:mb-12">
                <h1 className="text-3xl md:text-4xl font-light text-black mb-2">Test Settlement</h1>
                <p className="text-gray-600 font-light">
                  Run virtual settlement scenarios to understand the flow and test the platform
                </p>
              </div>

              {/* Test Scenario Setup */}
              <div className="border border-gray-200 mb-8">
                <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
                  <h2 className="text-xl font-light text-black">Settlement Scenario</h2>
                </div>
                <div className="p-6">
                  <div className="space-y-6">
                    <div>
                      <p className="text-sm font-light text-gray-700 mb-4">
                        This will simulate a settlement cycle based on your current transaction data.
                        The test will show you what settlements would be created, how much could be saved
                        through netting, and help you understand the complete settlement flow.
                      </p>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 p-4 rounded">
                      <h3 className="text-sm font-medium text-blue-900 mb-2">What this test will show:</h3>
                      <ul className="list-disc list-inside text-sm text-blue-800 space-y-1">
                        <li>Settlement calculations based on current transactions</li>
                        <li>Network netting efficiency and savings</li>
                        <li>Required settlements and amounts</li>
                        <li>Fee calculations</li>
                        <li>Any potential issues or violations</li>
                      </ul>
                    </div>

                    <div className="flex gap-4">
                      <button
                        onClick={testSettlement}
                        disabled={testingSettlement}
                        className="px-6 py-3 bg-black text-white text-sm font-light hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center gap-2"
                      >
                        <Play size={16} />
                        {testingSettlement ? 'Running Test...' : 'Run Settlement Test'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Settlement Test Results */}
              {settlementResult && (
                <div className={`border mb-8 ${
                  isSettlementError(settlementResult)
                    ? 'border-red-200 bg-red-50'
                    : isNoTransactions(settlementResult)
                    ? 'border-yellow-200 bg-yellow-50'
                    : 'border-green-200 bg-green-50'
                }`}>
                  <div className={`border-b px-6 py-4 ${
                    isSettlementError(settlementResult)
                      ? 'border-red-200 bg-red-100'
                      : isNoTransactions(settlementResult)
                      ? 'border-yellow-200 bg-yellow-100'
                      : 'border-green-200 bg-green-100'
                  }`}>
                    <h2 className="text-xl font-light text-black">Test Results</h2>
                  </div>
                  <div className="p-6">
                    {isSettlementSimulation(settlementResult) ? (
                      <div className="space-y-6">
                        <div>
                          <h3 className="text-lg font-light text-black mb-4">Settlement Summary</h3>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                            <div className="bg-white border border-gray-200 p-4">
                              <div className="text-xs font-light uppercase tracking-wider text-gray-600 mb-1">
                                Total Transactions
                              </div>
                              <div className="text-2xl font-light text-black">
                                {settlementResult.preview.transactions_to_process || 0}
                              </div>
                            </div>
                            <div className="bg-white border border-gray-200 p-4">
                              <div className="text-xs font-light uppercase tracking-wider text-gray-600 mb-1">
                                Total Volume
                              </div>
                              <div className="text-2xl font-light text-black">
                                ${(settlementResult.preview.total_volume || 0).toLocaleString()}
                              </div>
                            </div>
                            <div className="bg-white border border-gray-200 p-4">
                              <div className="text-xs font-light uppercase tracking-wider text-gray-600 mb-1">
                                Settlements Required
                              </div>
                              <div className="text-2xl font-light text-black">
                                {settlementResult.preview.settlements_generated || 0}
                              </div>
                            </div>
                          </div>

                          {settlementResult.preview.estimated_savings_percentage && (
                            <div className="bg-green-100 border border-green-300 p-4 rounded mb-6">
                              <div className="flex items-center gap-3 mb-2">
                                <TrendingDown size={24} strokeWidth={1} className="text-green-700" />
                                <div className="text-lg font-light text-green-900">
                                  Network Efficiency: {settlementResult.preview.estimated_savings_percentage}%
                                </div>
                              </div>
                              <p className="text-sm text-green-800">
                                Through multilateral netting, only {settlementResult.preview.settlements_generated} settlement{settlementResult.preview.settlements_generated !== 1 ? 's' : ''} needed
                                instead of {settlementResult.preview.transactions_to_process} individual transactions.
                              </p>
                            </div>
                          )}
                        </div>

                        {settlementResult.settlements && settlementResult.settlements.length > 0 && (
                          <div>
                            <h3 className="text-lg font-light text-black mb-4">Required Settlements</h3>
                            <div className="space-y-3">
                              {settlementResult.settlements.map((settlement: any, idx: number) => (
                                <div key={idx} className="bg-white border border-gray-200 p-4 flex justify-between items-center">
                                  <div className="flex-1">
                                    <div className="text-sm font-light text-gray-600">
                                      {counterpartyMap[settlement.from_member_id] || settlement.from_member_id}
                                      {' → '}
                                      {counterpartyMap[settlement.to_member_id] || settlement.to_member_id}
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <div className="text-lg font-light text-black">
                                      ${settlement.amount.toLocaleString()}
                                    </div>
                                    {settlement.fee > 0 && (
                                      <div className="text-xs font-light text-gray-500">
                                        Fee: ${settlement.fee.toLocaleString()}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {settlementResult.circuit_breakers.warnings && settlementResult.circuit_breakers.warnings.length > 0 && (
                          <div className="bg-yellow-50 border border-yellow-200 p-4 rounded">
                            <h3 className="text-lg font-medium text-yellow-900 mb-2">Circuit Breaker Warnings</h3>
                            <ul className="list-disc list-inside text-sm text-yellow-800 space-y-1">
                              {settlementResult.circuit_breakers.warnings.map((warning, idx: number) => (
                                <li key={idx}>{warning.message}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ) : isNoTransactions(settlementResult) ? (
                      <div className="flex items-center gap-3">
                        <Activity size={24} strokeWidth={1} className="text-yellow-600" />
                        <div>
                          <p className="text-yellow-900 font-light mb-1">
                            {settlementResult.message}
                          </p>
                          <p className="text-sm text-yellow-800">
                            Create some transactions first, then run the settlement test to see how netting works.
                          </p>
                        </div>
                      </div>
                    ) : isSettlementError(settlementResult) ? (
                      <div>
                        <div className="flex items-center gap-3 mb-4">
                          <X size={24} strokeWidth={1} className="text-red-600" />
                          <div>
                            <p className="text-red-900 font-light mb-1">
                              {settlementResult.message || 'Settlement test failed'}
                            </p>
                          </div>
                        </div>
                        {settlementResult.details && (
                          <div className="bg-red-100 border border-red-200 p-4 rounded">
                            <pre className="text-xs text-red-800 whitespace-pre-wrap font-mono">
                              {typeof settlementResult.details === 'string'
                                ? settlementResult.details
                                : JSON.stringify(settlementResult.details, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    ) : null}

                    <div className="mt-6 flex justify-end">
                      <button
                        onClick={() => setSettlementResult(null)}
                        className="px-6 py-2 text-sm font-light text-gray-700 hover:text-black transition-colors"
                      >
                        Clear Results
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Information Section */}
              <div className="bg-gray-50 border border-gray-200 p-6">
                <h3 className="text-lg font-light text-black mb-4">About Settlement Testing</h3>
                <div className="space-y-3 text-sm font-light text-gray-700">
                  <p>
                    This virtual testing environment allows you to simulate settlement cycles without affecting real transactions.
                    It's designed to help you understand how Bosun's multilateral netting system works.
                  </p>
                  <p>
                    <strong>Key Concepts:</strong>
                  </p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li><strong>Multilateral Netting:</strong> Instead of settling each transaction individually, Bosun calculates net positions across all participants</li>
                    <li><strong>Network Efficiency:</strong> The percentage reduction in required settlements compared to gross settlement</li>
                    <li><strong>Circuit Breakers:</strong> Safety mechanisms that prevent settlements if certain risk thresholds are exceeded</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'counterparties' && (
            <div className="max-w-6xl">
              {/* Page Header */}
              <div className="mb-8 md:mb-12">
                <h1 className="text-3xl md:text-4xl font-light text-black mb-2">Counterparties</h1>
                <p className="text-gray-600 font-light">
                  View and analyze your trading relationships
                </p>
              </div>

              {/* Summary Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-8">
                <div className="border border-gray-200 p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Users size={16} strokeWidth={1} className="text-black" />
                    <span className="text-xs font-light uppercase tracking-wider text-gray-600">
                      Total Counterparties
                    </span>
                  </div>
                  <div className="text-3xl font-light text-black">{counterpartyAnalytics.length}</div>
                </div>

                <div className="border border-gray-200 p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Activity size={16} strokeWidth={1} className="text-black" />
                    <span className="text-xs font-light uppercase tracking-wider text-gray-600">
                      Total Transactions
                    </span>
                  </div>
                  <div className="text-3xl font-light text-black">{transactions.length}</div>
                </div>

                <div className="border border-gray-200 p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <DollarSign size={16} strokeWidth={1} className="text-black" />
                    <span className="text-xs font-light uppercase tracking-wider text-gray-600">
                      Total Volume
                    </span>
                  </div>
                  <div className="text-3xl font-light text-black">
                    ${counterpartyAnalytics.reduce((sum, c) => sum + c.totalVolume, 0).toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Counterparties Table */}
              {counterpartyAnalytics.length > 0 ? (
                <>
                  {/* Desktop Table View */}
                  <div className="hidden md:block border border-gray-200 overflow-x-auto">
                    <div className="grid gap-4 px-6 py-4 border-b border-gray-200 bg-gray-50" style={{ gridTemplateColumns: '2fr 1fr 1.5fr 1.5fr 1.5fr' }}>
                      <div className="text-xs font-light uppercase tracking-wider text-gray-700">Counterparty</div>
                      <div className="text-xs font-light uppercase tracking-wider text-gray-700 text-center">Transactions</div>
                      <div className="text-xs font-light uppercase tracking-wider text-gray-700 text-right">Total Volume</div>
                      <div className="text-xs font-light uppercase tracking-wider text-gray-700 text-right">Net Position</div>
                      <div className="text-xs font-light uppercase tracking-wider text-gray-700 text-right">Last Transaction</div>
                    </div>
                    {counterpartyAnalytics.map(cp => (
                      <div
                        key={cp.name}
                        className="grid gap-4 px-6 py-4 border-b border-gray-200 last:border-b-0 hover:bg-gray-50 transition-colors"
                        style={{ gridTemplateColumns: '2fr 1fr 1.5fr 1.5fr 1.5fr' }}
                      >
                        <div className="text-sm font-light text-black">{cp.name}</div>
                        <div className="text-sm font-light text-gray-700 text-center">{cp.totalTransactions}</div>
                        <div className="text-sm font-light text-black text-right">
                          ${cp.totalVolume.toLocaleString()}
                        </div>
                        <div className={`text-sm font-light text-right ${cp.netPosition >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {cp.netPosition >= 0 ? '+' : ''}${cp.netPosition.toLocaleString()}
                        </div>
                        <div className="text-sm font-light text-gray-700 text-right">{cp.lastTransactionDate}</div>
                      </div>
                    ))}
                  </div>

                  {/* Mobile Card View */}
                  <div className="md:hidden space-y-3">
                    {counterpartyAnalytics.map(cp => (
                      <div key={cp.name} className="border border-gray-200 p-4">
                        <div className="text-base font-light text-black mb-3">{cp.name}</div>
                        <div className="grid grid-cols-2 gap-3 mb-3">
                          <div>
                            <div className="text-xs font-light text-gray-500 mb-1">Transactions</div>
                            <div className="text-sm font-light text-black">{cp.totalTransactions}</div>
                          </div>
                          <div>
                            <div className="text-xs font-light text-gray-500 mb-1">Total Volume</div>
                            <div className="text-sm font-light text-black">${cp.totalVolume.toLocaleString()}</div>
                          </div>
                          <div>
                            <div className="text-xs font-light text-gray-500 mb-1">Net Position</div>
                            <div className={`text-sm font-light ${cp.netPosition >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {cp.netPosition >= 0 ? '+' : ''}${cp.netPosition.toLocaleString()}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs font-light text-gray-500 mb-1">Last Transaction</div>
                            <div className="text-sm font-light text-gray-700">{cp.lastTransactionDate}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="border border-gray-200 p-12 text-center">
                  <Users size={48} strokeWidth={1} className="mx-auto mb-4 text-gray-300" />
                  <p className="text-gray-700 font-light">No counterparties yet</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'reports' && (
            <div className="max-w-6xl">
              {/* Page Header */}
              <div className="mb-8 md:mb-12">
                <h1 className="text-3xl md:text-4xl font-light text-black mb-2">Reports & Export</h1>
                <p className="text-gray-600 font-light">
                  Generate and download reports for accounting and analysis
                </p>
              </div>

              {/* Export Options */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {/* Transaction Export */}
                <div className="border border-gray-200 p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Download size={20} strokeWidth={1} className="text-black" />
                    <h2 className="text-xl font-light text-black">Transaction Export</h2>
                  </div>
                  <p className="text-sm font-light text-gray-600 mb-6">
                    Export all transactions to CSV format for accounting software or spreadsheet analysis.
                  </p>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-light uppercase tracking-wider text-gray-600 mb-2">
                          From Date
                        </label>
                        <input
                          type="date"
                          value={dateFrom}
                          onChange={(e) => setDateFrom(e.target.value)}
                          className="w-full px-4 py-2 border border-gray-200 text-sm font-light text-black focus:outline-none focus:border-gray-400"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-light uppercase tracking-wider text-gray-600 mb-2">
                          To Date
                        </label>
                        <input
                          type="date"
                          value={dateTo}
                          onChange={(e) => setDateTo(e.target.value)}
                          className="w-full px-4 py-2 border border-gray-200 text-sm font-light text-black focus:outline-none focus:border-gray-400"
                        />
                      </div>
                    </div>
                    <button
                      onClick={exportToCSV}
                      className="w-full px-6 py-3 bg-black text-white text-sm font-light hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
                    >
                      <Download size={16} />
                      Export Transactions CSV
                    </button>
                    <p className="text-xs font-light text-gray-500">
                      {filteredTransactions.length} transactions will be exported
                    </p>
                  </div>
                </div>

                {/* Counterparty Report */}
                <div className="border border-gray-200 p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <BarChart3 size={20} strokeWidth={1} className="text-black" />
                    <h2 className="text-xl font-light text-black">Counterparty Summary</h2>
                  </div>
                  <p className="text-sm font-light text-gray-600 mb-6">
                    Export a summary of all counterparty relationships with transaction volumes and net positions.
                  </p>
                  <button
                    onClick={() => {
                      const csvRows = []
                      csvRows.push(['Counterparty', 'Total Transactions', 'Total Volume', 'Net Position', 'Last Transaction Date'].join(','))
                      counterpartyAnalytics.forEach(cp => {
                        csvRows.push([
                          `"${cp.name}"`,
                          cp.totalTransactions,
                          cp.totalVolume,
                          cp.netPosition,
                          cp.lastTransactionDate
                        ].join(','))
                      })
                      const csvContent = csvRows.join('\n')
                      const blob = new Blob([csvContent], { type: 'text/csv' })
                      const url = URL.createObjectURL(blob)
                      const a = document.createElement('a')
                      a.href = url
                      a.download = `bosun-counterparties-${new Date().toISOString().split('T')[0]}.csv`
                      document.body.appendChild(a)
                      a.click()
                      document.body.removeChild(a)
                      URL.revokeObjectURL(url)
                    }}
                    className="w-full px-6 py-3 bg-black text-white text-sm font-light hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
                  >
                    <Download size={16} />
                    Export Counterparty Report
                  </button>
                  <p className="text-xs font-light text-gray-500 mt-4">
                    {counterpartyAnalytics.length} counterparties will be exported
                  </p>
                </div>
              </div>

              {/* CSV Import Template */}
              <div className="border border-gray-200 p-6 bg-gray-50">
                <h3 className="text-lg font-light text-black mb-4">Bulk Import Template</h3>
                <p className="text-sm font-light text-gray-700 mb-4">
                  Download a CSV template to use for bulk transaction imports. Fill in the required fields and upload via the Transactions page.
                </p>
                <button
                  onClick={() => {
                    const template = 'Date,Counterparty,CounterpartyId,Amount,Type,Reference,Description\n2025-01-15,Example Corp,uuid-here,1000,Receivable,REF-001,Sample transaction'
                    const blob = new Blob([template], { type: 'text/csv' })
                    const url = URL.createObjectURL(blob)
                    const a = document.createElement('a')
                    a.href = url
                    a.download = 'bosun-import-template.csv'
                    document.body.appendChild(a)
                    a.click()
                    document.body.removeChild(a)
                    URL.revokeObjectURL(url)
                  }}
                  className="px-6 py-3 border border-gray-300 text-black text-sm font-light hover:bg-gray-100 transition-colors flex items-center gap-2"
                >
                  <Download size={16} />
                  Download Import Template
                </button>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Bulk Import Modal */}
      {showBulkImport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowBulkImport(false)}>
          <div className="bg-white p-8 max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-light text-black mb-2">Bulk Import Transactions</h2>
                <p className="text-sm font-light text-gray-600">
                  Upload a CSV file to import multiple transactions at once
                </p>
              </div>
              <button
                onClick={() => setShowBulkImport(false)}
                className="p-2 hover:bg-gray-50 transition-colors"
              >
                <X size={20} strokeWidth={1} className="text-black" />
              </button>
            </div>

            {importError && (
              <div className="mb-6 border border-red-200 bg-red-50 p-4 text-sm font-light text-red-600 whitespace-pre-wrap">
                {importError}
              </div>
            )}

            <div className="space-y-6">
              {/* File Upload */}
              <div>
                <label className="block text-xs font-light uppercase tracking-wider text-gray-600 mb-2">
                  CSV File
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded p-6 text-center hover:border-gray-400 transition-colors">
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileImport}
                    className="hidden"
                    id="csv-import"
                  />
                  <label htmlFor="csv-import" className="cursor-pointer">
                    {importFile ? (
                      <div className="flex items-center justify-center gap-2">
                        <span className="text-sm text-green-600">✓ {importFile.name}</span>
                        <button
                          type="button"
                          onClick={() => {
                            setImportFile(null)
                            setImportPreview([])
                          }}
                          className="text-red-600 hover:text-red-800"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ) : (
                      <div>
                        <Upload className="mx-auto mb-2 text-gray-400" size={32} strokeWidth={1} />
                        <p className="text-sm font-light text-gray-600">Click to upload CSV file</p>
                        <p className="text-xs font-light text-gray-500 mt-1">Maximum 1000 transactions per upload</p>
                      </div>
                    )}
                  </label>
                </div>
              </div>

              {/* Preview */}
              {importPreview.length > 0 && (
                <div>
                  <h3 className="text-sm font-light uppercase tracking-wider text-gray-600 mb-3">
                    Preview (first 5 rows)
                  </h3>
                  <div className="border border-gray-200 overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          {Object.keys(importPreview[0]).map(header => (
                            <th key={header} className="px-4 py-2 text-left text-xs font-light uppercase tracking-wider text-gray-700">
                              {header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {importPreview.map((row, idx) => (
                          <tr key={idx} className="border-t border-gray-200">
                            {Object.values(row).map((value: any, i) => (
                              <td key={i} className="px-4 py-2 font-light text-black">
                                {value}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                <button
                  onClick={() => setShowBulkImport(false)}
                  className="px-6 py-3 bg-gray-50 text-black text-sm font-light hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={processBulkImport}
                  disabled={!importFile || importing}
                  className="px-6 py-3 bg-black text-white text-sm font-light hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {importing ? 'Importing...' : 'Import Transactions'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}