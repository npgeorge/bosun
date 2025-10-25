// src/app/api/settlements/process/route.ts
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { calculateNetPositions, generateSettlements } from '@/lib/utils/netting'
import { checkCircuitBreakers, formatCircuitBreakerResult } from '@/lib/utils/circuit-breakers'
import { logAudit } from '@/lib/utils/audit-log'
import { processSettlementSchema } from '@/lib/validations/transaction'
import { createErrorResponse, logError, AuthorizationError } from '@/lib/utils/errors'
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
    throw new AuthorizationError('Admin access required for settlement processing')
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
        message: 'No transactions to settle',
        count: 0 
      })
    }

    // 2. Calculate net positions
    const positions = calculateNetPositions(transactions)

    // 3. Generate optimal settlements
    const settlements = generateSettlements(positions)

    // Calculate stats for circuit breakers
    const totalVolume = transactions.reduce((sum, tx) => sum + Number(tx.amount_usd), 0)
    const uniqueMembers = new Set([
      ...transactions.map(tx => tx.from_member_id),
      ...transactions.map(tx => tx.to_member_id)
    ])
    const maxSingleSettlement = Math.max(...settlements.map(s => s.amount))
    const maxMemberExposure = Math.max(...Array.from(positions.values()).map(p => Math.abs(p.netAmount)))

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

      return NextResponse.json({
        simulation: true,
        success: true,
        preview: {
          transactions_to_process: transactions.length,
          settlements_generated: settlements.length,
          total_volume: totalVolume,
          estimated_savings_percentage: ((transactions.length - settlements.length) / transactions.length * 100).toFixed(2),
          unique_members: uniqueMembers.size,
          max_single_settlement: maxSingleSettlement,
        },
        circuit_breakers: {
          passed: circuitBreakerResult.passed,
          warnings: circuitBreakerResult.warnings,
        },
        settlements: settlements.map(s => ({
          from_member_id: s.fromMemberId,
          to_member_id: s.toMemberId,
          amount: s.amount,
          fee: s.amount * 0.008,
        }))
      })
    }

    // 5. Create settlement cycle (REAL EXECUTION)
    const { data: cycle, error: cycleError } = await supabase
      .from('settlement_cycles')
      .insert({
        cycle_time: new Date().toISOString(),
        status: 'processing',
        total_transactions: transactions.length,
        total_volume: totalVolume,
      })
      .select()
      .single()

    if (cycleError) throw cycleError

    // 6. Insert settlement instructions
    const settlementRecords = settlements.map(s => ({
      cycle_id: cycle.id,
      from_member_id: s.fromMemberId,
      to_member_id: s.toMemberId,
      amount_usd: s.amount,
      fee_usd: s.amount * 0.008, // 0.8% fee
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

    // 9. Log successful completion
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

    return NextResponse.json({
      success: true,
      cycle_id: cycle.id,
      transactions_processed: transactions.length,
      settlements_generated: settlements.length,
      total_volume: totalVolume,
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