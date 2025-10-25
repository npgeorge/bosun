// src/lib/utils/currency.ts

/**
 * Currency utilities for safe financial calculations
 * Uses integer cents to avoid floating point precision errors
 */

/**
 * Convert dollars to cents for safe integer math
 */
export function dollarsToCents(dollars: number): number {
  return Math.round(dollars * 100)
}

/**
 * Convert cents back to dollars for display
 */
export function centsToDollars(cents: number): number {
  return cents / 100
}

/**
 * Format cents as USD currency string
 */
export function formatCurrency(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(centsToDollars(cents))
}

/**
 * Calculate percentage with proper rounding
 */
export function calculatePercentage(
  amount: number,
  percentage: number
): number {
  return Math.round(amount * percentage)
}

/**
 * Safely add multiple amounts
 */
export function sumAmounts(...amounts: number[]): number {
  return amounts.reduce((sum, amount) => sum + amount, 0)
}

/**
 * Validate that an amount is within safe integer range
 */
export function isValidAmount(cents: number): boolean {
  return (
    Number.isInteger(cents) &&
    cents >= 0 &&
    cents <= Number.MAX_SAFE_INTEGER
  )
}
