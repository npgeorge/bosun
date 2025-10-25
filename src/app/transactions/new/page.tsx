// src/app/transactions/new/page.tsx
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import TransactionForm from './TransactionForm'

export default async function NewTransactionPage() {
  const supabase = await createServerSupabaseClient()
  
  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/auth/login')
  }

  // Get user's member info
  const { data: userData } = await supabase
    .from('users')
    .select('*, member:members(*)')
    .eq('id', user.id)
    .single()

  if (!userData?.member_id) {
    return (
      <div className="min-h-screen bg-white p-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-4xl font-light mb-4 text-black">No Company Profile</h1>
          <p className="text-gray-700 font-light">
            You need to be associated with a company to create transactions.
            Please contact support.
          </p>
        </div>
      </div>
    )
  }

  // Get all other members (potential counterparties)
  const { data: members } = await supabase
    .from('members')
    .select('*')
    .neq('id', userData.member_id)
    .eq('kyc_status', 'approved')
    .order('company_name')

  return (
    <TransactionForm 
      currentMemberId={userData.member_id}
      members={members || []}
    />
  )
}