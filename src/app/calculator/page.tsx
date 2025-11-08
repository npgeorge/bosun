// src/app/calculator/page.tsx
'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, TrendingDown, DollarSign, Clock } from 'lucide-react'
import ShipWheelLogo from '@/components/ShipWheelLogo'

export default function SavingsCalculatorPage() {
  const router = useRouter()
  const [monthlyVolume, setMonthlyVolume] = useState('1000000')
  const [avgTransactionSize, setAvgTransactionSize] = useState('50000')
  const [currentFeeRate, setCurrentFeeRate] = useState('2.5')
  const [savings, setSavings] = useState({
    annualFeeSavings: 0,
    annualCashFlowBenefit: 0,
    totalAnnualBenefit: 0,
    monthlyTransactions: 0,
    timeSaved: 0,
  })

  useEffect(() => {
    calculateSavings()
  }, [monthlyVolume, avgTransactionSize, currentFeeRate])

  function calculateSavings() {
    const volume = parseFloat(monthlyVolume) || 0
    const transactionSize = parseFloat(avgTransactionSize) || 0
    const currentRate = parseFloat(currentFeeRate) / 100 || 0

    // Bosun's competitive rate (example: 0.5%)
    const bosunRate = 0.005

    // Monthly calculations
    const monthlyTransactions = transactionSize > 0 ? volume / transactionSize : 0
    const currentMonthlyFees = volume * currentRate
    const bosunMonthlyFees = volume * bosunRate
    const monthlyFeeSavings = currentMonthlyFees - bosunMonthlyFees

    // Cash flow benefit (assuming 3-5 days faster settlement at 5% annual cost of capital)
    // Average 4 days * (5% / 365) * monthly volume
    const monthlyCashFlowBenefit = volume * (4 / 365) * 0.05

    // Annual totals
    const annualFeeSavings = monthlyFeeSavings * 12
    const annualCashFlowBenefit = monthlyCashFlowBenefit * 12
    const totalAnnualBenefit = annualFeeSavings + annualCashFlowBenefit

    // Time saved (assuming 2 hours per transaction manually tracking/reconciling)
    // With Bosun: automated, assume 0.2 hours per transaction
    const timeSaved = monthlyTransactions * 1.8 * 12 // hours per year

    setSavings({
      annualFeeSavings: Math.round(annualFeeSavings),
      annualCashFlowBenefit: Math.round(annualCashFlowBenefit),
      totalAnnualBenefit: Math.round(totalAnnualBenefit),
      monthlyTransactions: Math.round(monthlyTransactions),
      timeSaved: Math.round(timeSaved),
    })
  }

  function formatCurrency(value: number) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  function formatNumber(value: number) {
    return new Intl.NumberFormat('en-US').format(value)
  }

  return (
    <div className="min-h-screen bg-white text-black">
      {/* Navigation */}
      <nav className="border-b border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 md:py-6 flex justify-between items-center">
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-2 md:gap-3 hover:opacity-60 transition-opacity"
          >
            <ShipWheelLogo size={28} className="text-black" />
            <div className="text-xl md:text-2xl font-light tracking-wider">BOSUN</div>
          </button>
          <div className="flex gap-3 md:gap-6 items-center">
            <button
              onClick={() => router.push('/auth/login')}
              className="text-xs md:text-sm font-light hover:text-gray-600 transition-colors"
            >
              Sign In
            </button>
            <button
              onClick={() => router.push('/auth/register')}
              className="px-4 md:px-6 py-2 bg-black text-white text-xs md:text-sm font-light hover:bg-gray-800 transition-colors"
            >
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="border-b border-gray-200 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-12 md:py-20 text-center">
          <h1 className="text-4xl md:text-6xl font-light mb-6">
            Calculate Your Savings
          </h1>
          <p className="text-lg md:text-xl font-light text-gray-600 max-w-3xl mx-auto">
            See how much you could save by switching to Bosun's modern maritime settlement platform.
          </p>
        </div>
      </section>

      {/* Calculator Section */}
      <section className="max-w-6xl mx-auto px-4 md:px-6 py-12 md:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12">
          {/* Input Form */}
          <div className="space-y-8">
            <h2 className="text-2xl md:text-3xl font-light mb-6">Your Current Setup</h2>

            <div>
              <label className="block text-sm font-light text-gray-600 mb-2">
                Monthly Transaction Volume (USD)
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                <input
                  type="text"
                  value={monthlyVolume}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9]/g, '')
                    setMonthlyVolume(value)
                  }}
                  className="w-full pl-8 pr-4 py-4 border border-gray-200 focus:outline-none focus:border-black transition-colors text-lg font-light"
                  placeholder="1000000"
                />
              </div>
              <p className="mt-2 text-xs font-light text-gray-500">
                Total value of settlements per month
              </p>
            </div>

            <div>
              <label className="block text-sm font-light text-gray-600 mb-2">
                Average Transaction Size (USD)
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                <input
                  type="text"
                  value={avgTransactionSize}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9]/g, '')
                    setAvgTransactionSize(value)
                  }}
                  className="w-full pl-8 pr-4 py-4 border border-gray-200 focus:outline-none focus:border-black transition-colors text-lg font-light"
                  placeholder="50000"
                />
              </div>
              <p className="mt-2 text-xs font-light text-gray-500">
                Typical settlement amount
              </p>
            </div>

            <div>
              <label className="block text-sm font-light text-gray-600 mb-2">
                Current Fee Rate (%)
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={currentFeeRate}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9.]/g, '')
                    setCurrentFeeRate(value)
                  }}
                  className="w-full px-4 py-4 border border-gray-200 focus:outline-none focus:border-black transition-colors text-lg font-light"
                  placeholder="2.5"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">%</span>
              </div>
              <p className="mt-2 text-xs font-light text-gray-500">
                Current payment processing or wire transfer fees
              </p>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <div className="text-sm font-light text-gray-600 space-y-2">
                <p>Based on your inputs:</p>
                <p>• Monthly transactions: <strong>{formatNumber(savings.monthlyTransactions)}</strong></p>
                <p>• Annual volume: <strong>{formatCurrency(parseFloat(monthlyVolume) * 12)}</strong></p>
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="bg-black text-white p-8 md:p-12">
            <h2 className="text-2xl md:text-3xl font-light mb-8">Your Potential Savings</h2>

            <div className="space-y-8">
              <div>
                <div className="flex items-start gap-3 mb-3">
                  <TrendingDown size={24} strokeWidth={1} className="mt-1 flex-shrink-0" />
                  <div>
                    <div className="text-sm font-light text-gray-300 mb-1">
                      Annual Fee Savings
                    </div>
                    <div className="text-3xl md:text-4xl font-light">
                      {formatCurrency(savings.annualFeeSavings)}
                    </div>
                  </div>
                </div>
                <p className="text-sm font-light text-gray-400">
                  By switching from {currentFeeRate}% to Bosun's competitive 0.5% rate
                </p>
              </div>

              <div>
                <div className="flex items-start gap-3 mb-3">
                  <DollarSign size={24} strokeWidth={1} className="mt-1 flex-shrink-0" />
                  <div>
                    <div className="text-sm font-light text-gray-300 mb-1">
                      Cash Flow Benefit
                    </div>
                    <div className="text-3xl md:text-4xl font-light">
                      {formatCurrency(savings.annualCashFlowBenefit)}
                    </div>
                  </div>
                </div>
                <p className="text-sm font-light text-gray-400">
                  From same-day settlements vs. 3-5 day delays
                </p>
              </div>

              <div>
                <div className="flex items-start gap-3 mb-3">
                  <Clock size={24} strokeWidth={1} className="mt-1 flex-shrink-0" />
                  <div>
                    <div className="text-sm font-light text-gray-300 mb-1">
                      Time Saved
                    </div>
                    <div className="text-3xl md:text-4xl font-light">
                      {formatNumber(savings.timeSaved)} hrs/year
                    </div>
                  </div>
                </div>
                <p className="text-sm font-light text-gray-400">
                  Through automated settlement and reconciliation
                </p>
              </div>

              <div className="pt-8 border-t border-gray-700">
                <div className="text-sm font-light text-gray-300 mb-2">
                  Total Annual Benefit
                </div>
                <div className="text-4xl md:text-5xl font-light mb-8">
                  {formatCurrency(savings.totalAnnualBenefit)}
                </div>

                <button
                  onClick={() => router.push('/auth/register')}
                  className="w-full py-4 bg-white text-black text-sm font-light hover:bg-gray-100 transition-colors flex items-center justify-center gap-2"
                >
                  Get Started
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="mt-12 max-w-4xl mx-auto text-center">
          <p className="text-xs font-light text-gray-500 leading-relaxed">
            Savings calculations are estimates based on typical industry rates and scenarios.
            Actual savings may vary based on your specific transaction patterns, volume,
            settlement preferences, and current banking relationships. Cash flow benefits
            assume a 5% annual cost of capital and 4-day settlement acceleration.
          </p>
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-t border-gray-200 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-16 md:py-24 text-center">
          <h2 className="text-3xl md:text-4xl font-light mb-6">
            Ready to start saving?
          </h2>
          <p className="text-lg font-light text-gray-600 mb-8 max-w-2xl mx-auto">
            Join forward-thinking maritime companies already using Bosun to reduce costs and accelerate cash flow.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => router.push('/auth/register')}
              className="px-8 py-4 bg-black text-white text-sm font-light hover:bg-gray-800 transition-colors"
            >
              Request Access
            </button>
            <button
              onClick={() => router.push('/')}
              className="px-8 py-4 border border-black text-black text-sm font-light hover:bg-black hover:text-white transition-colors"
            >
              Learn More
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
          <div className="text-sm font-light text-gray-500 text-center">
            © 2025 Bosun | DIFC, Dubai
          </div>
        </div>
      </footer>
    </div>
  )
}
