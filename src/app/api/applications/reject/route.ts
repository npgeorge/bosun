// src/app/api/applications/reject/route.ts
import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { sendApplicationRejectedEmail } from '@/lib/email/service'
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
    const { applicationId, memberId, reason } = body

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
          email
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
        reviewed_at: new Date().toISOString(),
        reviewed_by: user.id
      })
      .eq('id', applicationId)

    if (appError) throw appError

    // Log audit event
    await logAudit({
      action: 'application.rejected',
      entityType: 'member_application',
      entityId: applicationId,
      details: {
        member_id: memberId,
        company_name: application.members?.company_name,
        reason,
      }
    })

    // Send rejection email
    const emailResult = await sendApplicationRejectedEmail({
      to: application.users?.email || application.members?.contact_email,
      companyName: application.members?.company_name || 'Company',
      reason,
    })

    if (!emailResult.success) {
      console.error('Failed to send rejection email:', emailResult.error)
      // Continue anyway - rejection is more important than email
    }

    await logAudit({
      action: 'application.rejection_email_sent',
      entityType: 'member_application',
      entityId: applicationId,
      details: {
        email_success: emailResult.success,
        email_to: application.users?.email || application.members?.contact_email,
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Application rejected',
      email_sent: emailResult.success
    })

  } catch (error) {
    console.error('Application rejection error:', error)
    return NextResponse.json(
      {
        error: 'Failed to reject application',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
