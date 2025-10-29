// src/app/api/settlements/process/route.ts
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { calculateNetPositions, generateSettlements } from '@/lib/utils/netting'
import { checkCircuitBreakers, formatCircuitBreakerResult } from '@/lib/utils/circuit-breakers'
import { dollarsToCents, centsToDollars } from '@/lib/utils/currency'
import { logAudit } from '@/lib/utils/audit-log'
import { processSettlementSchema } from '@/lib/validations/transaction'
import { createErrorResponse, logError, AuthorizationError } from '@/lib/utils/errors'
import { sendSettlementCompleteEmail } from '@/lib/email/service'
import { alertSettlementComplete, alertSettlementFailed, alertCircuitBreakerTriggered } from '@/lib/monitoring/slack'
import { NextResponse } from 'next/server'
import { ZodError } from 'zod'

export async function POST(request: Request) {
  const startTime = Date.now()
  const supabase = await createServerSupabaseClient()

  // Check if user is authenticated
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Check if user is admin
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (userError || !userData) {
    return NextResponse.json({ error: 'Failed to verify user role' }, { status: 500 })
  }

  if (userData.role !== 'admin') {
    return NextResponse.json({
      error: 'Unauthorized',
      message: 'Admin access required for settlement processing'
    }, { status: 403 })
  }

  // Validate request body
  const body = await request.json().catch(() => ({}))
  const validationResult = processSettlementSchema.safeParse(body)

  if (!validationResult.success) {
    return NextResponse.json({
      error: 'Invalid request',
      details: validationResult.error.format()
    }, { status: 400 })
  }

  const { simulation: isSimulation } = validationResult.data

  try {
    // Log start of settlement process
    await logAudit({
      action: isSimulation ? 'settlement.simulation_started' : 'settlement.started',
      entityType: 'settlement_cycle',
      details: { simulation: isSimulation }
    })

    // 1. Get all pending/confirmed transactions
    const { data: transactions, error: txError } = await supabase
      .from('transactions')
      .select('*')
      .in('status', ['pending', 'confirmed'])
      .is('settlement_cycle_id', null)

    if (txError) throw txError

    if (!transactions || transactions.length === 0) {
      await logAudit({
        action: 'settlement.no_transactions',
        entityType: 'settlement_cycle',
        details: { count: 0 }
      })

      return NextResponse.json({
        message: 'No settlements needed at the moment!',
        count: 0
      })
    }

    // 2. Convert transactions from DB format (dollars) to algorithm format (cents)
    const transactionsInCents = transactions.map(tx => ({
      id: tx.id,
      from_member_id: tx.from_member_id,
      to_member_id: tx.to_member_id,
      amount_cents: dollarsToCents(Number(tx.amount_usd))
    }))

    // 3. Calculate net positions using integer cents
    const positions = calculateNetPositions(transactionsInCents)

    // 4. Generate optimal settlements
    const settlements = generateSettlements(positions)

    // Calculate stats for circuit breakers (using cents, converting to dollars for circuit breaker checks)
    const totalVolumeCents = transactionsInCents.reduce((sum, tx) => sum + tx.amount_cents, 0)
    const totalVolume = centsToDollars(totalVolumeCents)

    const uniqueMembers = new Set([
      ...transactions.map(tx => tx.from_member_id),
      ...transactions.map(tx => tx.to_member_id)
    ])

    const maxSingleSettlementCents = settlements.length > 0
      ? Math.max(...settlements.map(s => s.amountCents))
      : 0
    const maxSingleSettlement = centsToDollars(maxSingleSettlementCents)

    const maxMemberExposureCents = Array.from(positions.values()).length > 0
      ? Math.max(...Array.from(positions.values()).map(p => Math.abs(p.netAmountCents)))
      : 0
    const maxMemberExposure = centsToDollars(maxMemberExposureCents)

    // 4. Check circuit breakers
    const circuitBreakerResult = checkCircuitBreakers({
      totalVolume,
      memberCount: uniqueMembers.size,
      maxSingleSettlement,
      maxMemberExposure,
      processingTimeSeconds: (Date.now() - startTime) / 1000,
    })

    // Log circuit breaker check
    await logAudit({
      action: 'settlement.circuit_breaker_check',
      entityType: 'settlement_cycle',
      details: {
        passed: circuitBreakerResult.passed,
        violations: circuitBreakerResult.violations,
        warnings: circuitBreakerResult.warnings,
      }
    })

    // If circuit breakers failed, halt
    if (!circuitBreakerResult.passed) {
      await logAudit({
        action: 'settlement.circuit_breaker_triggered',
        entityType: 'settlement_cycle',
        details: {
          violations: circuitBreakerResult.violations,
          totalVolume,
          memberCount: uniqueMembers.size,
          maxSingleSettlement,
        }
      })

      // Send Slack alert for circuit breaker
      alertCircuitBreakerTriggered({
        violations: circuitBreakerResult.violations,
        totalVolume,
        memberCount: uniqueMembers.size,
      }).catch(err => console.error('Failed to send Slack alert:', err))

      return NextResponse.json({
        error: 'Circuit breakers triggered',
        message: 'Settlement halted due to safety limits',
        details: formatCircuitBreakerResult(circuitBreakerResult),
        violations: circuitBreakerResult.violations,
        warnings: circuitBreakerResult.warnings,
      }, { status: 400 })
    }

    // If simulation mode, return preview without executing
    if (isSimulation) {
      await logAudit({
        action: 'settlement.simulation_completed',
        entityType: 'settlement_cycle',
        details: {
          transactions_count: transactions.length,
          settlements_count: settlements.length,
          total_volume: totalVolume,
          circuit_breaker_warnings: circuitBreakerResult.warnings,
        }
      })

      // Calculate total fees based on TRANSACTIONS not settlements
      const totalTransactionFeeCents = transactionsInCents.reduce((sum, tx) =>
        sum + Math.round(tx.amount_cents * 0.008), // 0.8% fee per transaction
        0
      )
      const totalTransactionFee = centsToDollars(totalTransactionFeeCents)

      return NextResponse.json({
        simulation: true,
        success: true,
        preview: {
          transactions_to_process: transactions.length,
          settlements_generated: settlements.length,
          total_volume: totalVolume,
          total_fees: totalTransactionFee, // Fees charged on all transactions
          estimated_savings_percentage: ((transactions.length - settlements.length) / transactions.length * 100).toFixed(2),
          unique_members: uniqueMembers.size,
          max_single_settlement: maxSingleSettlement,
        },
        circuit_breakers: {
          passed: circuitBreakerResult.passed,
          warnings: circuitBreakerResult.warnings,
        },
        settlements: settlements.map(s => ({
          settlement_id: s.settlementId,
          from_member_id: s.fromMemberId,
          to_member_id: s.toMemberId,
          amount: centsToDollars(s.amountCents),
          source_transactions: s.sourceTransactionIds,
          created_at: s.createdAt,
        }))
      })
    }

    // 5. Calculate total fees based on all transactions (charged per transaction)
    const totalTransactionFeeCents = transactionsInCents.reduce((sum, tx) =>
      sum + Math.round(tx.amount_cents * 0.008), // 0.8% fee per transaction
      0
    )
    const totalTransactionFee = centsToDollars(totalTransactionFeeCents)

    // 6. Create settlement cycle (REAL EXECUTION)
    const { data: cycle, error: cycleError } = await supabase
      .from('settlement_cycles')
      .insert({
        cycle_time: new Date().toISOString(),
        status: 'processing',
        total_transactions: transactions.length,
        total_volume: totalVolume,
        total_fees: totalTransactionFee, // Fees based on transactions, not settlements
      })
      .select()
      .single()

    if (cycleError) throw cycleError

    // 7. Insert settlement instructions (converting cents back to dollars for DB)
    const settlementRecords = settlements.map(s => ({
      cycle_id: cycle.id,
      from_member_id: s.fromMemberId,
      to_member_id: s.toMemberId,
      amount_usd: centsToDollars(s.amountCents), // Convert cents to dollars for DB
      status: 'pending'
    }))

    const { error: settlementsError } = await supabase
      .from('settlements')
      .insert(settlementRecords)

    if (settlementsError) throw settlementsError

    // 7. Update transactions with cycle_id
    const { error: updateError } = await supabase
      .from('transactions')
      .update({ 
        settlement_cycle_id: cycle.id,
        status: 'confirmed'
      })
      .in('id', transactions.map(tx => tx.id))

    if (updateError) throw updateError

    // 8. Update cycle with final stats
    const savingsPercentage = ((transactions.length - settlements.length) / transactions.length * 100)
    
    const { error: cycleUpdateError } = await supabase
      .from('settlement_cycles')
      .update({
        net_settlements: settlements.length,
        savings_percentage: savingsPercentage,
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('id', cycle.id)

    if (cycleUpdateError) throw cycleUpdateError

    // 9. Send email notifications to all members
    const memberIds = Array.from(uniqueMembers)
    const { data: members, error: membersError } = await supabase
      .from('members')
      .select('id, company_name, contact_email')
      .in('id', memberIds)

    if (!membersError && members) {
      // Get user contact emails
      const { data: users } = await supabase
        .from('users')
        .select('member_id, email')
        .in('member_id', memberIds)

      const emailMap = new Map(users?.map(u => [u.member_id, u.email]) || [])

      // Send emails to each member with their settlement info
      for (const member of members) {
        const email = emailMap.get(member.id) || member.contact_email

        // Find settlements for this member
        const memberSettlements = settlements.filter(s =>
          s.fromMemberId === member.id || s.toMemberId === member.id
        )

        if (memberSettlements.length === 0) continue

        // Calculate net position for this member (in dollars)
        const netPosition = memberSettlements.reduce((sum, s) => {
          const amountDollars = centsToDollars(s.amountCents)
          if (s.fromMemberId === member.id) return sum - amountDollars
          if (s.toMemberId === member.id) return sum + amountDollars
          return sum
        }, 0)

        // Calculate gross volume for this member
        const memberTransactions = transactions.filter(tx =>
          tx.from_member_id === member.id || tx.to_member_id === member.id
        )
        const grossAmount = memberTransactions.reduce((sum, tx) => sum + Number(tx.amount_usd), 0)

        // Calculate savings (assuming 2.5% wire fee vs 0.8% platform fee)
        const wireCost = grossAmount * 0.025
        const platformFee = grossAmount * 0.008
        const savings = wireCost - platformFee

        // Send email (don't block on email failures)
        sendSettlementCompleteEmail({
          to: email,
          memberName: member.company_name,
          settlementId: cycle.id,
          netAmount: Math.abs(netPosition),
          netPosition: netPosition < 0 ? 'pay' : 'receive',
          settlementDate: new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          }),
          numTransactions: memberTransactions.length,
          grossAmount,
          savings,
        }).catch(error => {
          console.error(`Failed to send settlement email to ${email}:`, error)
          // Log but don't fail the settlement
        })
      }

      await logAudit({
        action: 'settlement.emails_sent',
        entityType: 'settlement_cycle',
        entityId: cycle.id,
        details: {
          emails_attempted: members.length,
        }
      })
    }

    // 10. Log successful completion
    const processingTime = (Date.now() - startTime) / 1000
    await logAudit({
      action: 'settlement.completed',
      entityType: 'settlement_cycle',
      entityId: cycle.id,
      details: {
        transactions_processed: transactions.length,
        settlements_generated: settlements.length,
        total_volume: totalVolume,
        savings_percentage: savingsPercentage.toFixed(2),
        processing_time_seconds: processingTime,
        warnings: circuitBreakerResult.warnings,
      }
    })

    // Send Slack alert for successful settlement
    alertSettlementComplete({
      cycleId: cycle.id,
      transactionsProcessed: transactions.length,
      settlementsGenerated: settlements.length,
      totalVolume,
      savingsPercentage,
      processingTime,
    }).catch(err => console.error('Failed to send Slack alert:', err))

    return NextResponse.json({
      success: true,
      cycle_id: cycle.id,
      transactions_processed: transactions.length,
      settlements_generated: settlements.length,
      total_volume: totalVolume,
      total_fees: totalTransactionFee, // Fees charged on all transactions
      savings_percentage: savingsPercentage.toFixed(2),
      processing_time_seconds: processingTime,
      circuit_breaker_warnings: circuitBreakerResult.warnings,
    })

  } catch (error: unknown) {
    logError(error, { action: 'settlement_processing' })

    // Log failure (attempt audit log but don't throw if it fails)
    try {
      await logAudit({
        action: 'settlement.failed',
        entityType: 'settlement_cycle',
        details: {
          error: error instanceof Error ? error.message : 'Unknown error',
          errorType: error instanceof Error ? error.name : typeof error,
        }
      })
    } catch (auditError) {
      logError(auditError, { action: 'audit_log_failed' })
    }

    // Send Slack alert for settlement failure
    alertSettlementFailed({
      error: error instanceof Error ? error.message : 'Unknown error',
      stage: 'settlement_processing',
      details: error instanceof Error ? {
        name: error.name,
        stack: error.stack?.split('\n').slice(0, 3).join('\n'), // First 3 lines of stack
      } : undefined,
    }).catch(err => console.error('Failed to send Slack alert:', err))

    const errorResponse = createErrorResponse(error, 'Failed to process settlements')
    return NextResponse.json(
      {
        error: errorResponse.error,
        message: errorResponse.message,
        details: errorResponse.details
      },
      { status: errorResponse.statusCode }
    )
  }
}