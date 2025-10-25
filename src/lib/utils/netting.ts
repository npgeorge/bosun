// src/lib/utils/netting.ts

interface Transaction {
  id: string
  from_member_id: string
  to_member_id: string
  amount_usd: number
}

interface NetPosition {
  memberId: string
  netAmount: number // positive = receives, negative = pays
  transactions: Transaction[]
}

interface Settlement {
  fromMemberId: string
  toMemberId: string
  amount: number
}

/**
 * Calculate net positions for all members
 * This is the core multilateral netting algorithm
 */
export function calculateNetPositions(transactions: Transaction[]): Map<string, NetPosition> {
  const positions = new Map<string, NetPosition>()

  // Initialize positions for all members
  transactions.forEach(tx => {
    if (!positions.has(tx.from_member_id)) {
      positions.set(tx.from_member_id, {
        memberId: tx.from_member_id,
        netAmount: 0,
        transactions: []
      })
    }
    if (!positions.has(tx.to_member_id)) {
      positions.set(tx.to_member_id, {
        memberId: tx.to_member_id,
        netAmount: 0,
        transactions: []
      })
    }
  })

  // Calculate net positions
  transactions.forEach(tx => {
    const fromPos = positions.get(tx.from_member_id)!
    const toPos = positions.get(tx.to_member_id)!

    fromPos.netAmount -= Number(tx.amount_usd) // They owe, so negative
    toPos.netAmount += Number(tx.amount_usd) // They receive, so positive

    fromPos.transactions.push(tx)
    toPos.transactions.push(tx)
  })

  return positions
}

/**
 * Generate optimal settlement instructions using multilateral netting
 * This minimizes the number of actual payments needed
 */
export function generateSettlements(positions: Map<string, NetPosition>): Settlement[] {
  const settlements: Settlement[] = []
  
  // Separate payers and receivers
  const payers = Array.from(positions.values())
    .filter(p => p.netAmount < 0)
    .map(p => ({ memberId: p.memberId, amount: Math.abs(p.netAmount) }))
    .sort((a, b) => b.amount - a.amount)

  const receivers = Array.from(positions.values())
    .filter(p => p.netAmount > 0)
    .map(p => ({ memberId: p.memberId, amount: p.netAmount }))
    .sort((a, b) => b.amount - a.amount)

  // Match payers with receivers (greedy algorithm)
  let i = 0, j = 0

  while (i < payers.length && j < receivers.length) {
    const payer = payers[i]
    const receiver = receivers[j]

    const settlementAmount = Math.min(payer.amount, receiver.amount)

    settlements.push({
      fromMemberId: payer.memberId,
      toMemberId: receiver.memberId,
      amount: settlementAmount
    })

    payer.amount -= settlementAmount
    receiver.amount -= settlementAmount

    if (payer.amount === 0) i++
    if (receiver.amount === 0) j++
  }

  return settlements
}

/**
 * Calculate savings from netting
 */
export function calculateSavings(
  originalTransactionCount: number,
  nettedSettlementCount: number,
  totalVolume: number
): {
  originalFees: number
  nettedFees: number
  savings: number
  savingsPercentage: number
} {
  const wireFeePercentage = 0.025 // 2.5% for traditional wire
  const bosunFeePercentage = 0.008 // 0.8%
  
  // Original fees on all transactions
  const originalFees = totalVolume * wireFeePercentage
  
  // Bosun fees on netted volume
  const nettedFees = totalVolume * bosunFeePercentage
  
  const savings = originalFees - nettedFees
  const savingsPercentage = (savings / originalFees) * 100

  return {
    originalFees,
    nettedFees,
    savings,
    savingsPercentage
  }
}