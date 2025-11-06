// src/types/api.ts

/**
 * API response types for type-safe API calls
 */

import type { CircuitBreakerViolation } from '@/lib/utils/circuit-breakers'

export interface SettlementPreview {
  transactions_to_process: number
  settlements_generated: number
  total_volume: number
  total_fees: number
  estimated_savings_percentage: string
  unique_members: number
  max_single_settlement: number
}

export interface SettlementSimulationResponse {
  simulation: true
  success: true
  preview: SettlementPreview
  circuit_breakers: {
    passed: boolean
    warnings: CircuitBreakerViolation[]
  }
  settlements: Array<{
    from_member_id: string
    to_member_id: string
    amount: number
    fee: number
  }>
}

export interface SettlementSuccessResponse {
  success: true
  cycle_id: string
  transactions_processed: number
  settlements_generated: number
  total_volume: number
  savings_percentage: string
  processing_time_seconds: number
  circuit_breaker_warnings: CircuitBreakerViolation[]
}

export interface SettlementErrorResponse {
  error: string
  message: string
  details?: string
  violations?: CircuitBreakerViolation[]
  warnings?: CircuitBreakerViolation[]
}

export interface SettlementNoTransactionsResponse {
  message: string
  count: number
}

export type SettlementResponse =
  | SettlementSimulationResponse
  | SettlementSuccessResponse
  | SettlementErrorResponse
  | SettlementNoTransactionsResponse

export function isSettlementError(
  response: SettlementResponse
): response is SettlementErrorResponse {
  return 'error' in response
}

export function isSettlementSimulation(
  response: SettlementResponse
): response is SettlementSimulationResponse {
  return 'simulation' in response && response.simulation === true
}

export function isSettlementSuccess(
  response: SettlementResponse
): response is SettlementSuccessResponse {
  return 'success' in response && !('simulation' in response)
}

export function isNoTransactions(
  response: SettlementResponse
): response is SettlementNoTransactionsResponse {
  return 'message' in response && 'count' in response
}
