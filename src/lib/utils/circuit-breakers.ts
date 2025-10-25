// src/lib/utils/circuit-breakers.ts

export interface CircuitBreakerConfig {
  maxSettlementAmount: number
  maxMembersPerBatch: number
  minOTCSpread: number
  maxOTCSpread: number
  settlementTimeout: number // seconds
  maxDailyVolume: number
  maxSingleMemberExposure: number
}

// Default circuit breaker limits
export const DEFAULT_CIRCUIT_BREAKERS: CircuitBreakerConfig = {
  maxSettlementAmount: 10_000_000,      // $10M max per settlement
  maxMembersPerBatch: 20,               // Max 20 members per settlement
  minOTCSpread: 0.003,                  // 0.3% minimum acceptable spread
  maxOTCSpread: 0.010,                  // 1% maximum spread before halt
  settlementTimeout: 3600,              // 1 hour max processing time
  maxDailyVolume: 100_000_000,          // $100M max daily volume
  maxSingleMemberExposure: 5_000_000,   // $5M max single member exposure
}

export interface CircuitBreakerViolation {
  type: string
  message: string
  severity: 'warning' | 'critical'
  value: number
  limit: number
}

export interface CircuitBreakerCheckResult {
  passed: boolean
  violations: CircuitBreakerViolation[]
  warnings: CircuitBreakerViolation[]
}

/**
 * Check if settlement cycle passes circuit breaker limits
 */
export function checkCircuitBreakers(
  data: {
    totalVolume: number
    memberCount: number
    maxSingleSettlement: number
    otcSpread?: number
    processingTimeSeconds?: number
    dailyVolume?: number
    maxMemberExposure?: number
  },
  config: CircuitBreakerConfig = DEFAULT_CIRCUIT_BREAKERS
): CircuitBreakerCheckResult {
  const violations: CircuitBreakerViolation[] = []
  const warnings: CircuitBreakerViolation[] = []

  // Check max settlement amount
  if (data.maxSingleSettlement > config.maxSettlementAmount) {
    violations.push({
      type: 'max_settlement_amount',
      message: `Single settlement amount ($${data.maxSingleSettlement.toLocaleString()}) exceeds maximum ($${config.maxSettlementAmount.toLocaleString()})`,
      severity: 'critical',
      value: data.maxSingleSettlement,
      limit: config.maxSettlementAmount,
    })
  }

  // Check max members per batch
  if (data.memberCount > config.maxMembersPerBatch) {
    violations.push({
      type: 'max_members',
      message: `Member count (${data.memberCount}) exceeds maximum (${config.maxMembersPerBatch})`,
      severity: 'critical',
      value: data.memberCount,
      limit: config.maxMembersPerBatch,
    })
  }

  // Check OTC spread if provided
  if (data.otcSpread !== undefined) {
    if (data.otcSpread < config.minOTCSpread) {
      warnings.push({
        type: 'min_otc_spread',
        message: `OTC spread (${(data.otcSpread * 100).toFixed(2)}%) below minimum (${(config.minOTCSpread * 100).toFixed(2)}%)`,
        severity: 'warning',
        value: data.otcSpread,
        limit: config.minOTCSpread,
      })
    }

    if (data.otcSpread > config.maxOTCSpread) {
      violations.push({
        type: 'max_otc_spread',
        message: `OTC spread (${(data.otcSpread * 100).toFixed(2)}%) exceeds maximum (${(config.maxOTCSpread * 100).toFixed(2)}%)`,
        severity: 'critical',
        value: data.otcSpread,
        limit: config.maxOTCSpread,
      })
    }
  }

  // Check processing timeout
  if (data.processingTimeSeconds !== undefined && data.processingTimeSeconds > config.settlementTimeout) {
    violations.push({
      type: 'processing_timeout',
      message: `Processing time (${data.processingTimeSeconds}s) exceeds timeout (${config.settlementTimeout}s)`,
      severity: 'critical',
      value: data.processingTimeSeconds,
      limit: config.settlementTimeout,
    })
  }

  // Check daily volume limit
  if (data.dailyVolume !== undefined && data.dailyVolume > config.maxDailyVolume) {
    violations.push({
      type: 'max_daily_volume',
      message: `Daily volume ($${data.dailyVolume.toLocaleString()}) exceeds maximum ($${config.maxDailyVolume.toLocaleString()})`,
      severity: 'critical',
      value: data.dailyVolume,
      limit: config.maxDailyVolume,
    })
  }

  // Check single member exposure
  if (data.maxMemberExposure !== undefined && data.maxMemberExposure > config.maxSingleMemberExposure) {
    warnings.push({
      type: 'max_member_exposure',
      message: `Single member exposure ($${data.maxMemberExposure.toLocaleString()}) exceeds recommended maximum ($${config.maxSingleMemberExposure.toLocaleString()})`,
      severity: 'warning',
      value: data.maxMemberExposure,
      limit: config.maxSingleMemberExposure,
    })
  }

  return {
    passed: violations.length === 0,
    violations,
    warnings,
  }
}

/**
 * Format circuit breaker result for display
 */
export function formatCircuitBreakerResult(result: CircuitBreakerCheckResult): string {
  if (result.passed && result.warnings.length === 0) {
    return '✅ All circuit breakers passed'
  }

  const lines: string[] = []

  if (result.violations.length > 0) {
    lines.push('🚨 CRITICAL VIOLATIONS:')
    result.violations.forEach(v => {
      lines.push(`  - ${v.message}`)
    })
  }

  if (result.warnings.length > 0) {
    lines.push('⚠️ WARNINGS:')
    result.warnings.forEach(w => {
      lines.push(`  - ${w.message}`)
    })
  }

  return lines.join('\n')
}