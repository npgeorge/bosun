// src/app/settlements/page.tsx
import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import SettlementsClient from './SettlementsClient'

export default async function SettlementsPage() {
  const supabase = await createServerSupabaseClient()

  // Check authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/auth/login')
  }

  // Get user's member_id
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('member_id, role')
    .eq('id', user.id)
    .single()

  if (userError || !userData?.member_id) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-light mb-4">Access Denied</h1>
          <p className="text-gray-600">You must be associated with a member account.</p>
        </div>
      </div>
    )
  }

  // Get member details
  const { data: member, error: memberError } = await supabase
    .from('members')
    .select('id, company_name, contact_email')
    .eq('id', userData.member_id)
    .single()

  if (memberError || !member) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-light mb-4">Member Not Found</h1>
          <p className="text-gray-600">Unable to load member information.</p>
        </div>
      </div>
    )
  }

  // Get all settlements involving this member
  const { data: settlements, error: settlementsError } = await supabase
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
    .or(`from_member_id.eq.${member.id},to_member_id.eq.${member.id}`)
    .order('created_at', { ascending: false })
    .limit(50)

  // Get member names for counterparties
  const settlementData = settlements || []
  const counterpartyIds = new Set<string>()

  settlementData.forEach(s => {
    if (s.from_member_id !== member.id) counterpartyIds.add(s.from_member_id)
    if (s.to_member_id !== member.id) counterpartyIds.add(s.to_member_id)
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
    .or(`from_member_id.eq.${member.id},to_member_id.eq.${member.id}`)

  return (
    <SettlementsClient
      member={member}
      settlements={settlementData}
      counterpartyMap={Object.fromEntries(counterpartyMap)}
      transactionCount={transactionCount || 0}
      userEmail={user.email || ''}
    />
  )
}
