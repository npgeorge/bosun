// src/app/dashboard/page.tsx
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import DashboardClient from './DashboardClient'
import Link from 'next/link'

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient()
  
  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/auth/login')
  }

  // Get user details from our users table
  const { data: userData } = await supabase
    .from('users')
    .select(`
      *,
      member:members(*)
    `)
    .eq('id', user.id)
    .single()

  // Check if user is admin
  const isAdmin = userData?.role === 'admin'

  // If no member linked yet, show pending approval message
  if (!userData?.member_id && !isAdmin) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="max-w-md text-center">
          <h1 className="text-3xl font-light mb-4 text-black">Application Pending</h1>
          <p className="text-gray-600 font-light mb-6">
            Your application is under review. You will receive an email once approved.
          </p>
          <Link
            href="/auth/login"
            className="inline-block px-6 py-3 bg-black text-white text-sm font-light hover:bg-gray-800 transition-colors"
          >
            Logout
          </Link>
        </div>
      </div>
    )
  }

  // Get transactions involving this user's member
  const { data: transactions } = await supabase
    .from('transactions')
    .select(`
      *,
      from_member:members!transactions_from_member_id_fkey(company_name),
      to_member:members!transactions_to_member_id_fkey(company_name),
      transaction_documents(id)
    `)
    .or(`from_member_id.eq.${userData?.member_id},to_member_id.eq.${userData?.member_id}`)
    .order('created_at', { ascending: false })

  // Calculate balances
  const owed = transactions?.reduce((sum, t) =>
    t.to_member_id === userData?.member_id && t.status !== 'settled'
      ? sum + Number(t.amount_usd)
      : sum,
    0
  ) || 0

  const owing = transactions?.reduce((sum, t) =>
    t.from_member_id === userData?.member_id && t.status !== 'settled'
      ? sum + Number(t.amount_usd)
      : sum,
    0
  ) || 0

  const balance = {
    owed,
    owing,
    net: owed - owing
  }

  // Format transactions for component
  const formattedTransactions = transactions?.map(t => ({
    id: t.id,
    counterparty: t.from_member_id === userData?.member_id
      ? t.to_member?.company_name || 'Unknown'
      : t.from_member?.company_name || 'Unknown',
    amount: Number(t.amount_usd),
    type: (t.to_member_id === userData?.member_id ? 'owed' : 'owing') as 'owed' | 'owing',
    date: new Date(t.trade_date).toISOString().split('T')[0],
    status: t.status,
    reference: t.reference_number || '',
    description: t.description || '',
    createdAt: new Date(t.created_at).toISOString().split('T')[0],
    documentCount: t.transaction_documents?.length || 0,
  })) || []

  // Get member's documents from storage
  const { data: documentFiles } = await supabase.storage
    .from('member-documents')
    .list(userData?.member_id || '', {
      limit: 100,
      offset: 0,
      sortBy: { column: 'created_at', order: 'desc' }
    })

  // Get transaction documents for this member's transactions
  const transactionIds = formattedTransactions.map(t => t.id)
  const { data: transactionDocuments } = await supabase
    .from('transaction_documents')
    .select(`
      *,
      transactions(
        reference_number,
        trade_date,
        from_member_id,
        to_member_id,
        amount_usd
      )
    `)
    .in('transaction_id', transactionIds)
    .order('uploaded_at', { ascending: false })

  // Format documents for component
  const memberDocuments = documentFiles?.map(file => {
    const { data: { publicUrl } } = supabase.storage
      .from('member-documents')
      .getPublicUrl(`${userData?.member_id}/${file.name}`)

    return {
      id: file.id,
      name: file.name,
      size: file.metadata?.size || 0,
      type: file.name.toLowerCase().includes('license') ? 'Trade License' :
            file.name.toLowerCase().includes('bank') ? 'Bank Statement' : 'Other',
      uploadedAt: file.created_at || new Date().toISOString(),
      url: publicUrl,
      source: 'registration' as const
    }
  }) || []

  // Format transaction documents
  const transactionDocs = transactionDocuments?.map(doc => ({
    id: doc.id,
    name: doc.file_name,
    size: doc.file_size,
    type: 'Transaction Document',
    uploadedAt: doc.uploaded_at,
    url: doc.storage_path,
    source: 'transaction' as const,
    transactionId: doc.transaction_id,
    transactionReference: doc.transactions?.reference_number || 'N/A',
    transactionDate: doc.transactions?.trade_date ? new Date(doc.transactions.trade_date).toISOString().split('T')[0] : 'N/A'
  })) || []

  // Combine all documents
  const documents = [...memberDocuments, ...transactionDocs]

  // Get all settlements involving this member
  const { data: settlements } = await supabase
    .from('settlements')
    .select(`
      id,
      settlement_cycle_id,
      from_member_id,
      to_member_id,
      amount_usd,
      fee_usd,
      status,
      created_at,
      settlement_cycles (
        id,
        cycle_time,
        total_transactions,
        total_volume,
        net_settlements,
        savings_percentage,
        status,
        completed_at
      )
    `)
    .or(`from_member_id.eq.${userData?.member_id},to_member_id.eq.${userData?.member_id}`)
    .order('created_at', { ascending: false })
    .limit(50)

  // Get member names for counterparties
  const settlementData = settlements || []
  const counterpartyIds = new Set<string>()

  settlementData.forEach(s => {
    if (s.from_member_id !== userData?.member_id) counterpartyIds.add(s.from_member_id)
    if (s.to_member_id !== userData?.member_id) counterpartyIds.add(s.to_member_id)
  })

  const { data: counterparties } = await supabase
    .from('members')
    .select('id, company_name')
    .in('id', Array.from(counterpartyIds))

  const counterpartyMap = new Map(
    (counterparties || []).map(cp => [cp.id, cp.company_name])
  )

  // Get transaction count for this member (all time)
  const { count: transactionCount } = await supabase
    .from('transactions')
    .select('*', { count: 'exact', head: true })
    .or(`from_member_id.eq.${userData?.member_id},to_member_id.eq.${userData?.member_id}`)

  return (
    <DashboardClient
      member={{
        companyName: userData?.member?.company_name || user.email || 'Your Company',
        balance
      }}
      transactions={formattedTransactions}
      documents={documents}
      settlements={settlementData}
      counterpartyMap={Object.fromEntries(counterpartyMap)}
      transactionCount={transactionCount || 0}
      memberId={userData?.member_id || ''}
      userEmail={user.email || ''}
      isAdmin={isAdmin}
    />
  )
}