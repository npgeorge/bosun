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
      to_member:members!transactions_to_member_id_fkey(company_name)
    `)
    .or(`from_member_id.eq.${userData?.member_id},to_member_id.eq.${userData?.member_id}`)
    .order('created_at', { ascending: false })

  // Calculate balances
  const balance = {
    owed: transactions?.reduce((sum, t) => 
      t.to_member_id === userData?.member_id && t.status !== 'settled' 
        ? sum + Number(t.amount_usd) 
        : sum, 
      0
    ) || 0,
    owing: transactions?.reduce((sum, t) => 
      t.from_member_id === userData?.member_id && t.status !== 'settled'
        ? sum + Number(t.amount_usd) 
        : sum, 
      0
    ) || 0,
  }
  balance.net = balance.owed - balance.owing

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
  })) || []

  // Get member's documents from storage
  const { data: documentFiles } = await supabase.storage
    .from('member-documents')
    .list(userData?.member_id || '', {
      limit: 100,
      offset: 0,
      sortBy: { column: 'created_at', order: 'desc' }
    })

  // Format documents for component
  const documents = documentFiles?.map(file => {
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
      url: publicUrl
    }
  }) || []

  return (
    <DashboardClient
      member={{
        companyName: userData?.member?.company_name || user.email || 'Your Company',
        balance
      }}
      transactions={formattedTransactions}
      documents={documents}
      userEmail={user.email || ''}
      isAdmin={isAdmin}
    />
  )
}