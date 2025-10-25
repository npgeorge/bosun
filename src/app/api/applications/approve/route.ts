// src/app/api/applications/approve/route.ts
import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { sendApplicationApprovedEmail } from '@/lib/email/service'
import { logAudit } from '@/lib/utils/audit-log'

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient()

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!userData || userData.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Parse request body
    const body = await request.json()
    const { applicationId, memberId } = body

    if (!applicationId || !memberId) {
      return NextResponse.json(
        { error: 'Missing required fields: applicationId, memberId' },
        { status: 400 }
      )
    }

    // Get application details
    const { data: application, error: appFetchError } = await supabase
      .from('member_applications')
      .select(`
        *,
        members (
          company_name,
          contact_email
        ),
        users (
          email,
          name
        )
      `)
      .eq('id', applicationId)
      .single()

    if (appFetchError || !application) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      )
    }

    // Generate temporary password
    const tempPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8)

    // Update member status
    const { error: memberError } = await supabase
      .from('members')
      .update({ kyc_status: 'approved' })
      .eq('id', memberId)

    if (memberError) throw memberError

    // Update user password (they'll be prompted to change it)
    const { error: passwordError } = await supabase.auth.admin.updateUserById(
      application.user_id,
      { password: tempPassword }
    )

    if (passwordError) {
      console.warn('Failed to set temp password:', passwordError)
      // Continue anyway - user can use password reset
    }

    // Update application status
    const { error: appError } = await supabase
      .from('member_applications')
      .update({
        status: 'approved',
        reviewed_at: new Date().toISOString(),
        reviewed_by: user.id
      })
      .eq('id', applicationId)

    if (appError) throw appError

    // Log audit event
    await logAudit({
      action: 'application.approved',
      entityType: 'member_application',
      entityId: applicationId,
      details: {
        member_id: memberId,
        company_name: application.members?.company_name,
      }
    })

    // Send approval email
    const loginUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://bosun.ae'}/auth/login`

    const emailResult = await sendApplicationApprovedEmail({
      to: application.users?.email || application.members?.contact_email,
      companyName: application.members?.company_name || 'Company',
      loginUrl,
      password: tempPassword,
    })

    if (!emailResult.success) {
      console.error('Failed to send approval email:', emailResult.error)
      // Continue anyway - approval is more important than email
    }

    await logAudit({
      action: 'application.email_sent',
      entityType: 'member_application',
      entityId: applicationId,
      details: {
        email_success: emailResult.success,
        email_to: application.users?.email || application.members?.contact_email,
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Application approved successfully',
      email_sent: emailResult.success
    })

  } catch (error) {
    console.error('Application approval error:', error)
    return NextResponse.json(
      {
        error: 'Failed to approve application',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
