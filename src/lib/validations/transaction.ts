// src/lib/validations/transaction.ts
import { z } from 'zod'

/**
 * Transaction creation validation schema
 */
export const createTransactionSchema = z.object({
  direction: z.enum(['owed', 'owing']),
  counterpartyId: z.string().uuid('Invalid counterparty ID'),
  amount: z
    .number()
    .positive('Amount must be greater than 0')
    .max(10_000_000, 'Amount cannot exceed $10,000,000')
    .multipleOf(0.01, 'Amount must have at most 2 decimal places'),
  referenceNumber: z.string().max(100).optional().nullable(),
  tradeDate: z.string().refine((date) => {
    const d = new Date(date)
    return !isNaN(d.getTime())
  }, 'Invalid trade date'),
  description: z.string().max(500).optional().nullable(),
})

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>

/**
 * Settlement processing validation schema
 */
export const processSettlementSchema = z.object({
  simulation: z.boolean().optional().default(false),
})

export type ProcessSettlementInput = z.infer<typeof processSettlementSchema>
