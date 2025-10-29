// src/lib/utils/netting.ts

/**
 * Transaction using integer cents for precise financial calculations
 * All amounts are stored as cents (integers) to avoid floating-point errors
 */
interface Transaction {
  id: string
  from_member_id: string
  to_member_id: string
  amount_cents: number // Amount in cents (e.g., $100.50 = 10050 cents)
}

/**
 * Net position for a member after aggregating all transactions
 */
interface NetPosition {
  memberId: string
  netAmountCents: number // positive = receives, negative = pays (in cents)
  transactions: Transaction[]
}

/**
 * Settlement instruction with metadata and traceability
 */
interface Settlement {
  settlementId: string
  fromMemberId: string
  toMemberId: string
  amountCents: number // Amount in cents
  sourceTransactionIds: string[] // Original transactions that contributed to this settlement
  createdAt: string // ISO timestamp
}

/**
 * Calculate net positions for all members
 * This is the core multilateral netting algorithm
 *
 * Uses integer arithmetic with cents to avoid floating-point precision errors
 */
export function calculateNetPositions(transactions: Transaction[]): Map<string, NetPosition> {
  const positions = new Map<string, NetPosition>()

  // Initialize positions for all members
  transactions.forEach(tx => {
    if (!positions.has(tx.from_member_id)) {
      positions.set(tx.from_member_id, {
        memberId: tx.from_member_id,
        netAmountCents: 0,
        transactions: []
      })
    }
    if (!positions.has(tx.to_member_id)) {
      positions.set(tx.to_member_id, {
        memberId: tx.to_member_id,
        netAmountCents: 0,
        transactions: []
      })
    }
  })

  // Calculate net positions using integer arithmetic (cents)
  transactions.forEach(tx => {
    const fromPos = positions.get(tx.from_member_id)!
    const toPos = positions.get(tx.to_member_id)!

    // Integer arithmetic - no floating point errors
    fromPos.netAmountCents -= tx.amount_cents // They owe, so negative
    toPos.netAmountCents += tx.amount_cents   // They receive, so positive

    fromPos.transactions.push(tx)
    toPos.transactions.push(tx)
  })

  return positions
}

/**
 * Generate optimal settlement instructions using multilateral netting
 * This minimizes the number of actual payments needed
 *
 * Includes full traceability - tracks which original transactions contributed to each settlement
 */
export function generateSettlements(positions: Map<string, NetPosition>): Settlement[] {
  const settlements: Settlement[] = []
  const timestamp = new Date().toISOString()

  // Separate payers and receivers with transaction tracking
  const payers = Array.from(positions.values())
    .filter(p => p.netAmountCents < 0)
    .map(p => ({
      memberId: p.memberId,
      amountCents: Math.abs(p.netAmountCents),
      transactions: p.transactions
    }))
    .sort((a, b) => b.amountCents - a.amountCents)

  const receivers = Array.from(positions.values())
    .filter(p => p.netAmountCents > 0)
    .map(p => ({
      memberId: p.memberId,
      amountCents: p.netAmountCents,
      transactions: p.transactions
    }))
    .sort((a, b) => b.amountCents - a.amountCents)

  // Match payers with receivers (greedy algorithm)
  let i = 0, j = 0
  let settlementCounter = 0

  while (i < payers.length && j < receivers.length) {
    const payer = payers[i]
    const receiver = receivers[j]

    const settlementAmountCents = Math.min(payer.amountCents, receiver.amountCents)

    // Collect all unique transaction IDs that contributed to this member's position
    const sourceTransactionIds = [
      ...new Set([
        ...payer.transactions.map(t => t.id),
        ...receiver.transactions.map(t => t.id)
      ])
    ].sort() // Sort for deterministic output

    // Generate unique settlement ID
    const settlementId = `STL-${timestamp.split('T')[0].replace(/-/g, '')}-${String(++settlementCounter).padStart(4, '0')}`

    settlements.push({
      settlementId,
      fromMemberId: payer.memberId,
      toMemberId: receiver.memberId,
      amountCents: settlementAmountCents,
      sourceTransactionIds,
      createdAt: timestamp
    })

    payer.amountCents -= settlementAmountCents
    receiver.amountCents -= settlementAmountCents

    if (payer.amountCents === 0) i++
    if (receiver.amountCents === 0) j++
  }

  return settlements
}

/**
 * Calculate savings from netting
 *
 * @param originalTransactionCount - Number of original bilateral transactions
 * @param nettedSettlementCount - Number of settlements after netting
 * @param totalVolumeCents - Total transaction volume in cents
 * @returns Fee comparison showing savings from netting (all amounts in cents)
 */
export function calculateSavings(
  originalTransactionCount: number,
  nettedSettlementCount: number,
  totalVolumeCents: number
): {
  originalFeesCents: number
  nettedFeesCents: number
  savingsCents: number
  savingsPercentage: number
} {
  const wireFeePercentage = 0.025 // 2.5% for traditional wire
  const bosunFeePercentage = 0.008 // 0.8%

  // Original fees on all transactions (integer arithmetic)
  const originalFeesCents = Math.round(totalVolumeCents * wireFeePercentage)

  // Bosun fees on netted volume
  const nettedFeesCents = Math.round(totalVolumeCents * bosunFeePercentage)

  const savingsCents = originalFeesCents - nettedFeesCents
  const savingsPercentage = originalFeesCents > 0
    ? (savingsCents / originalFeesCents) * 100
    : 0

  return {
    originalFeesCents,
    nettedFeesCents,
    savingsCents,
    savingsPercentage
  }
}