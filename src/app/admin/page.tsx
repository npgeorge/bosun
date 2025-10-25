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

  return (
    <AdminClient
      applications={applications || []}
      members={members || []}
      recentSettlements={recentSettlements || []}
      auditLogs={auditLogs || []}
      userEmail={user.email || ''}
    />
  )
}