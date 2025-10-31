// src/app/admin/page.tsx
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AdminClient from './AdminClient'

export default async function AdminPage() {
  const supabase = await createServerSupabaseClient()

  // Check if user is authenticated
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/auth/login')
  }

  // Check if user is admin
  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (userData?.role !== 'admin') {
    redirect('/dashboard')
  }

  // Fetch pending applications
  const { data: applications } = await supabase
    .from('member_applications')
    .select(`
      *,
      members:member_id (
        id,
        company_name,
        registration_number,
        contact_email,
        kyc_status,
        created_at
      ),
      users:user_id (
        email,
        name
      )
    `)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })

  // Fetch all members
  const { data: members } = await supabase
    .from('members')
    .select(`
      *,
      users!inner (
        name,
        email
      )
    `)
    .order('created_at', { ascending: false })

  // Fetch recent settlements
  const { data: recentSettlements } = await supabase
    .from('settlement_cycles')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10)

  // Fetch recent audit logs
  const { data: auditLogs } = await supabase
    .from('audit_logs')
    .select(`
      *,
      users (
        name,
        email
      )
    `)
    .order('timestamp', { ascending: false })
    .limit(50)

  // Fetch efficiency metrics
  // Get all completed settlement cycles for metrics
  const { data: allSettlements } = await supabase
    .from('settlement_cycles')
    .select('*')
    .eq('status', 'completed')

  // Get all transactions
  const { data: allTransactions } = await supabase
    .from('transactions')
    .select('amount, status, created_at')

  // Calculate efficiency metrics
  const totalGrossObligations = allSettlements?.reduce((sum, s) => sum + (s.total_volume || 0), 0) || 0
  const totalNetSettlements = allSettlements?.reduce((sum, s) => sum + (s.net_settlements || 0), 0) || 0
  const totalSavings = totalGrossObligations - totalNetSettlements
  const nettingEfficiency = totalGrossObligations > 0 ? ((totalSavings / totalGrossObligations) * 100) : 0

  // Fee calculations (0.8% on gross obligations)
  const totalFeesCollected = totalGrossObligations * 0.008

  // Transaction metrics
  const totalTransactions = allTransactions?.length || 0
  const settledTransactions = allTransactions?.filter(t => t.status === 'settled').length || 0
  const pendingTransactions = allTransactions?.filter(t => t.status === 'pending').length || 0

  // Member metrics
  const totalMembers = members?.length || 0
  const avgVolumePerMember = totalMembers > 0 ? (totalGrossObligations / totalMembers) : 0

  // Settlement metrics
  const totalSettlementCycles = allSettlements?.length || 0
  const avgTransactionsPerCycle = totalSettlementCycles > 0 ? (settledTransactions / totalSettlementCycles) : 0

  const efficiencyMetrics = {
    totalGrossObligations,
    totalNetSettlements,
    totalSavings,
    nettingEfficiency,
    totalFeesCollected,
    totalTransactions,
    settledTransactions,
    pendingTransactions,
    totalMembers,
    avgVolumePerMember,
    totalSettlementCycles,
    avgTransactionsPerCycle
  }

  return (
    <AdminClient
      applications={applications || []}
      members={members || []}
      recentSettlements={recentSettlements || []}
      auditLogs={auditLogs || []}
      userEmail={user.email || ''}
      efficiencyMetrics={efficiencyMetrics}
    />
  )
}