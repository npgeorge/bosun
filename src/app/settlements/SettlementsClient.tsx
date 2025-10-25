// src/app/settlements/SettlementsClient.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, TrendingUp, TrendingDown, DollarSign, Activity, Calendar } from 'lucide-react'

interface Member {
  id: string
  company_name: string
  contact_email: string
}

interface Settlement {
  id: string
  settlement_cycle_id: string
  from_member_id: string
  to_member_id: string
  amount_usd: number
  fee_usd: number
  status: string
  created_at: string
  settlement_cycles?: {
    id: string
    cycle_time: string
    total_transactions: number
    total_volume: number
    net_settlements: number
    savings_percentage: number
    status: string
    completed_at: string
  }
}

interface SettlementsClientProps {
  member: Member
  settlements: Settlement[]
  counterpartyMap: Record<string, string>
  transactionCount: number
  userEmail: string
}

export default function SettlementsClient({
  member,
  settlements,
  counterpartyMap,
  transactionCount,
  userEmail
}: SettlementsClientProps) {
  const router = useRouter()
  const [selectedCycle, setSelectedCycle] = useState<string | null>(null)

  // Calculate aggregate statistics
  const totalSettlements = settlements.length
  const completedSettlements = settlements.filter(s => s.status === 'completed').length

  const totalPaid = settlements
    .filter(s => s.from_member_id === member.id && s.status === 'completed')
    .reduce((sum, s) => sum + Number(s.amount_usd), 0)

  const totalReceived = settlements
    .filter(s => s.to_member_id === member.id && s.status === 'completed')
    .reduce((sum, s) => sum + Number(s.amount_usd), 0)

  const totalFees = settlements
    .filter(s => s.status === 'completed')
    .reduce((sum, s) => sum + Number(s.fee_usd || 0), 0)

  // Calculate average network efficiency from completed settlement cycles
  const completedCycles = settlements
    .filter(s => s.settlement_cycles?.status === 'completed')
    .map(s => s.settlement_cycles!)
    .filter((cycle, index, self) =>
      index === self.findIndex(c => c.id === cycle.id)
    )

  const avgEfficiency = completedCycles.length > 0
    ? completedCycles.reduce((sum, c) => sum + Number(c.savings_percentage || 0), 0) / completedCycles.length
    : 0

  // Calculate total savings (assuming 2.5% wire fee vs 0.8% platform fee)
  const grossVolume = settlements
    .filter(s => s.status === 'completed')
    .reduce((sum, s) => sum + Number(s.amount_usd), 0)

  const wireCost = grossVolume * 0.025
  const platformCost = totalFees
  const totalSavings = wireCost - platformCost

  // Group settlements by cycle
  const settlementsByCycle = settlements.reduce((acc, settlement) => {
    const cycleId = settlement.settlement_cycle_id
    if (!acc[cycleId]) {
      acc[cycleId] = []
    }
    acc[cycleId].push(settlement)
    return acc
  }, {} as Record<string, Settlement[]>)

  const cycles = Object.keys(settlementsByCycle)
    .map(cycleId => {
      const cycleSettlements = settlementsByCycle[cycleId]
      const cycle = cycleSettlements[0]?.settlement_cycles
      return { cycleId, settlements: cycleSettlements, cycle }
    })
    .filter(c => c.cycle)
    .sort((a, b) =>
      new Date(b.cycle!.cycle_time).getTime() - new Date(a.cycle!.cycle_time).getTime()
    )

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200">
        <div className="px-8 py-6 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/dashboard')}
              className="p-2 hover:bg-gray-50 transition-colors rounded"
            >
              <ArrowLeft size={20} strokeWidth={1} className="text-black" />
            </button>
            <div>
              <div className="text-2xl font-light tracking-wider text-black">SETTLEMENTS</div>
              <div className="text-sm font-light text-gray-600 mt-1">{member.company_name}</div>
            </div>
          </div>
          <div className="text-sm font-light text-black">{userEmail}</div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-8 py-12">
        {/* Statistics Cards */}
        <div className="grid grid-cols-4 gap-6 mb-12">
          {/* Total Settlements */}
          <div className="border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-3">
              <Activity size={20} strokeWidth={1} className="text-black" />
              <div className="text-xs font-light uppercase tracking-wider text-gray-600">
                Total Settlements
              </div>
            </div>
            <div className="text-3xl font-light text-black">{completedSettlements}</div>
            <div className="text-xs font-light text-gray-500 mt-1">
              {totalSettlements} total (including pending)
            </div>
          </div>

          {/* Network Efficiency */}
          <div className="border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-3">
              <TrendingUp size={20} strokeWidth={1} className="text-green-600" />
              <div className="text-xs font-light uppercase tracking-wider text-gray-600">
                Network Efficiency
              </div>
            </div>
            <div className="text-3xl font-light text-green-600">
              {avgEfficiency.toFixed(1)}%
            </div>
            <div className="text-xs font-light text-gray-500 mt-1">
              Average across {completedCycles.length} cycles
            </div>
          </div>

          {/* Total Savings */}
          <div className="border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-3">
              <DollarSign size={20} strokeWidth={1} className="text-green-600" />
              <div className="text-xs font-light uppercase tracking-wider text-gray-600">
                Total Savings
              </div>
            </div>
            <div className="text-3xl font-light text-green-600">
              ${totalSavings.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </div>
            <div className="text-xs font-light text-gray-500 mt-1">
              vs wire transfers (2.5% fee)
            </div>
          </div>

          {/* Net Position */}
          <div className="border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-3">
              {totalReceived >= totalPaid ? (
                <TrendingUp size={20} strokeWidth={1} className="text-green-600" />
              ) : (
                <TrendingDown size={20} strokeWidth={1} className="text-red-600" />
              )}
              <div className="text-xs font-light uppercase tracking-wider text-gray-600">
                Net Position
              </div>
            </div>
            <div className={`text-3xl font-light ${totalReceived >= totalPaid ? 'text-green-600' : 'text-red-600'}`}>
              ${Math.abs(totalReceived - totalPaid).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </div>
            <div className="text-xs font-light text-gray-500 mt-1">
              {totalReceived >= totalPaid ? 'Net receiver' : 'Net payer'}
            </div>
          </div>
        </div>

        {/* Settlement History */}
        <div>
          <h2 className="text-2xl font-light mb-6 text-black">Settlement History</h2>

          {cycles.length === 0 ? (
            <div className="border border-gray-200 p-12 text-center">
              <p className="text-gray-600 font-light mb-4">No settlements yet</p>
              <p className="text-sm text-gray-500 font-light">
                Settlements are processed daily at 5:00 PM Dubai time
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {cycles.map(({ cycleId, settlements: cycleSettlements, cycle }) => {
                const isExpanded = selectedCycle === cycleId

                // Calculate net for this member in this cycle
                const netAmount = cycleSettlements.reduce((sum, s) => {
                  if (s.from_member_id === member.id) return sum - Number(s.amount_usd)
                  if (s.to_member_id === member.id) return sum + Number(s.amount_usd)
                  return sum
                }, 0)

                const totalFeeForCycle = cycleSettlements.reduce((sum, s) => sum + Number(s.fee_usd || 0), 0)

                return (
                  <div key={cycleId} className="border border-gray-200">
                    {/* Cycle Header */}
                    <button
                      onClick={() => setSelectedCycle(isExpanded ? null : cycleId)}
                      className="w-full px-6 py-5 flex justify-between items-center hover:bg-gray-50 transition-colors text-left"
                    >
                      <div className="flex items-center gap-6">
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            <Calendar size={16} strokeWidth={1} className="text-black" />
                            <div className="text-lg font-light text-black">
                              {new Date(cycle!.cycle_time).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </div>
                          </div>
                          <div className="text-sm font-light text-gray-600">
                            {cycle!.total_transactions} transactions • {cycleSettlements.length} settlement{cycleSettlements.length !== 1 ? 's' : ''}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-8">
                        <div className="text-right">
                          <div className="text-xs font-light uppercase tracking-wider text-gray-600 mb-1">
                            Your Net Position
                          </div>
                          <div className={`text-xl font-light ${netAmount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {netAmount >= 0 ? '+' : ''}${netAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-xs font-light uppercase tracking-wider text-gray-600 mb-1">
                            Network Efficiency
                          </div>
                          <div className="text-xl font-light text-green-600">
                            {Number(cycle!.savings_percentage || 0).toFixed(1)}%
                          </div>
                        </div>

                        <div className="text-right">
                          <span className={`inline-block px-3 py-1 text-xs font-light ${
                            cycle!.status === 'completed' ? 'bg-green-50 text-green-700' :
                            cycle!.status === 'processing' ? 'bg-yellow-50 text-yellow-700' :
                            'bg-gray-50 text-gray-700'
                          }`}>
                            {cycle!.status}
                          </span>
                        </div>
                      </div>
                    </button>

                    {/* Cycle Details (Expanded) */}
                    {isExpanded && (
                      <div className="border-t border-gray-200 bg-gray-50">
                        <div className="px-6 py-6">
                          <div className="grid grid-cols-2 gap-8 mb-6">
                            <div>
                              <h4 className="text-xs font-light uppercase tracking-wider text-gray-600 mb-4">
                                Cycle Statistics
                              </h4>
                              <div className="space-y-3 text-sm font-light">
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Total Volume:</span>
                                  <span className="text-black">
                                    ${Number(cycle!.total_volume).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Net Settlements:</span>
                                  <span className="text-black">{cycle!.net_settlements}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Your Transaction Fee:</span>
                                  <span className="text-black">
                                    ${totalFeeForCycle.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Completed:</span>
                                  <span className="text-black">
                                    {cycle!.completed_at ? new Date(cycle!.completed_at).toLocaleString() : 'Pending'}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div>
                              <h4 className="text-xs font-light uppercase tracking-wider text-gray-600 mb-4">
                                Your Settlements
                              </h4>
                              <div className="space-y-3">
                                {cycleSettlements.map(settlement => {
                                  const isPayer = settlement.from_member_id === member.id
                                  const counterpartyId = isPayer ? settlement.to_member_id : settlement.from_member_id
                                  const counterpartyName = counterpartyMap[counterpartyId] || 'Unknown'

                                  return (
                                    <div key={settlement.id} className="flex justify-between items-center text-sm font-light">
                                      <div>
                                        <span className="text-gray-600">
                                          {isPayer ? 'Pay to' : 'Receive from'}:
                                        </span>
                                        <span className="ml-2 text-black">{counterpartyName}</span>
                                      </div>
                                      <span className={`font-medium ${isPayer ? 'text-red-600' : 'text-green-600'}`}>
                                        {isPayer ? '-' : '+'}${Number(settlement.amount_usd).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                      </span>
                                    </div>
                                  )
                                })}
                              </div>
                            </div>
                          </div>

                          <div className="pt-4 border-t border-gray-200">
                            <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
                              <p className="text-sm font-light text-blue-900">
                                <strong>Network Efficiency Explained:</strong> Through our settlement optimization,
                                your {cycle!.total_transactions} transactions were consolidated into just {cycleSettlements.length}
                                {cycleSettlements.length === 1 ? ' settlement' : ' settlements'},
                                reducing settlement volume by {Number(cycle!.savings_percentage).toFixed(1)}%
                                compared to individual wire transfers.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Info Box */}
        {cycles.length > 0 && (
          <div className="mt-12 border border-gray-200 p-6 bg-gray-50">
            <h3 className="text-lg font-light mb-4 text-black">About Your Settlements</h3>
            <div className="space-y-3 text-sm font-light text-gray-700">
              <p>
                <strong>Settlement Timing:</strong> Settlements are processed once daily at 5:00 PM Dubai time.
                All pending transactions are included in the next settlement cycle.
              </p>
              <p>
                <strong>Network Efficiency:</strong> This metric shows how much settlement volume was reduced
                through our network optimization. Higher percentages mean more efficient settlements and lower costs.
              </p>
              <p>
                <strong>Transaction Fees:</strong> You are charged 0.8% on your gross transaction volume.
                This is significantly lower than traditional wire transfer fees (typically 2-3%).
              </p>
              <p>
                <strong>Total Savings:</strong> Calculated by comparing our 0.8% fee to typical wire transfer fees of 2.5%,
                showing your actual cost savings by using the Bosun platform.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
