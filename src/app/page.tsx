// src/app/page.tsx
'use client'

import React, { useState } from 'react'
import { ArrowRight, Shield, Zap, TrendingDown, X, CheckCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { signIn, signUp } from '@/lib/supabase/auth'
import ShipWheelLogo from '@/components/ShipWheelLogo'

// Login/Signup Modal Component
function AuthModal({ isOpen, onClose, mode }: { isOpen: boolean; onClose: () => void; mode: string }) {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [company, setCompany] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  if (!isOpen) return null

  const isSignup = mode === 'signup'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (isSignup) {
      const { data, error } = await signUp(email, password, name)
      if (error) {
        setError(error.message)
        setLoading(false)
      } else {
        setSuccess(true)
      }
    } else {
      const { data, error } = await signIn(email, password)
      if (error) {
        setError(error.message)
        setLoading(false)
      } else {
        router.push('/dashboard')
        router.refresh()
      }
    }
  }

  if (success) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white w-full max-w-md mx-4">
          <div className="p-8">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-3xl font-light">Check Your Email</h2>
              <button onClick={onClose} className="hover:opacity-60 transition-opacity">
                <X size={24} strokeWidth={1} />
              </button>
            </div>
            <p className="text-gray-600 font-light mb-6">
              We've sent you a confirmation email. Click the link to verify your account and get started.
            </p>
            <button
              onClick={onClose}
              className="w-full py-4 bg-black text-white text-sm font-light hover:bg-gray-800 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white w-full max-w-md mx-4">
        <div className="p-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-light">{isSignup ? 'Request Access' : 'Sign In'}</h2>
            <button onClick={onClose} className="hover:opacity-60 transition-opacity">
              <X size={24} strokeWidth={1} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="border border-red-200 bg-red-50 p-4 text-sm font-light text-red-600">
                {error}
              </div>
            )}

            {isSignup && (
              <>
                <div>
                  <label className="block text-sm font-light text-gray-600 mb-2">Full Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 focus:outline-none focus:border-black transition-colors text-sm font-light"
                  />
                </div>
                <div>
                  <label className="block text-sm font-light text-gray-600 mb-2">Company Name (Optional)</label>
                  <input
                    type="text"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 focus:outline-none focus:border-black transition-colors text-sm font-light"
                  />
                </div>
              </>
            )}
            
            <div>
              <label className="block text-sm font-light text-gray-600 mb-2">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 focus:outline-none focus:border-black transition-colors text-sm font-light"
              />
            </div>

            <div>
              <label className="block text-sm font-light text-gray-600 mb-2">Password</label>
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 focus:outline-none focus:border-black transition-colors text-sm font-light"
              />
            </div>

            {!isSignup && (
              <div className="flex justify-end">
                <a href="/auth/reset-password" className="text-sm font-light text-gray-600 hover:text-black transition-colors">
                  Forgot password?
                </a>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-black text-white text-sm font-light hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              {loading ? 'Loading...' : isSignup ? 'Submit Request' : 'Sign In'}
            </button>

            {isSignup && (
              <p className="text-xs font-light text-gray-500 text-center">
                Access is limited to qualified maritime trade participants. 
                We'll review your application within 24 hours.
              </p>
            )}
          </form>
        </div>
      </div>
    </div>
  )
}

export default function BosunLanding() {
  const router = useRouter()
  const [emailInput, setEmailInput] = useState('')
  const [authModal, setAuthModal] = useState({ isOpen: false, mode: 'signin' })

  const openAuth = (mode: string) => setAuthModal({ isOpen: true, mode })
  const closeAuth = () => setAuthModal({ isOpen: false, mode: 'signin' })

  return (
    <div className="min-h-screen bg-white text-black">
      <AuthModal 
        isOpen={authModal.isOpen} 
        onClose={closeAuth} 
        mode={authModal.mode}
      />

      {/* Navigation */}
      <nav className="border-b border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 md:py-6 flex justify-between items-center">
          <div className="flex items-center gap-2 md:gap-3">
            <ShipWheelLogo size={28} className="text-black" />
            <div className="text-xl md:text-2xl font-light tracking-wider">BOSUN</div>
          </div>
          <div className="flex gap-3 md:gap-8 items-center">
            <a href="#benefits" className="text-xs md:text-sm font-light hover:text-gray-600 transition-colors hidden sm:inline">Benefits</a>
            <a href="#how" className="text-xs md:text-sm font-light hover:text-gray-600 transition-colors hidden sm:inline">How It Works</a>
            <button
              onClick={() => openAuth('signin')}
              className="text-xs md:text-sm font-light hover:text-gray-600 transition-colors"
            >
              Sign In
            </button>
            <button
              onClick={() => router.push('/auth/register')}
              className="px-4 md:px-6 py-2 bg-black text-white text-xs md:text-sm font-light hover:bg-gray-800 transition-colors"
            >
              <span className="hidden sm:inline">Request Access</span>
              <span className="sm:hidden">Join</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section with Background Image */}
      <section className="relative min-h-[400px] md:min-h-[600px] flex items-center overflow-hidden">
        {/* Background Image Layer */}
        <div
          className="absolute inset-0 z-0"
          style={{
            backgroundImage: 'url(https://images.unsplash.com/photo-1582488719899-a2a54cb479fe?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=1686)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            filter: 'grayscale(100%) brightness(0.4)',
          }}
        />

        {/* Dark overlay */}
        <div className="absolute inset-0 bg-black opacity-40 z-1" />

        {/* Content */}
        <div className="relative max-w-7xl mx-auto px-4 md:px-6 py-16 md:py-32 w-full z-10">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-light leading-tight mb-6 md:mb-8 tracking-tight text-white">
              Maritime settlement, reimagined.
            </h1>
            <p className="text-xl md:text-2xl font-light text-gray-100 mb-4 md:mb-6 leading-relaxed">
              Still waiting 3-5 days for payment? There's a better way.
            </p>
            <p className="text-base md:text-xl font-light text-gray-200 mb-8 md:mb-12 leading-relaxed">
              Reduce costs. Accelerate cash flow. Simplify operations.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
              <button
                onClick={() => router.push('/auth/register')}
                className="px-6 md:px-8 py-3 md:py-4 bg-white text-black text-sm font-light hover:bg-gray-100 transition-colors flex items-center justify-center gap-2"
              >
                Get Started
                <ArrowRight size={16} />
              </button>
              <button className="px-6 md:px-8 py-3 md:py-4 border border-white text-white text-sm font-light hover:bg-white hover:text-black transition-colors">
                Schedule Demo
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Value Propositions Section */}
      <section id="benefits" className="max-w-7xl mx-auto px-4 md:px-6 py-16 md:py-32">
        <h2 className="text-3xl md:text-5xl font-light mb-12 md:mb-20 text-center">Why leading maritime companies choose Bosun</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16">
          <div>
            <div className="w-12 h-12 mb-6 flex items-center justify-center">
              <Zap size={32} strokeWidth={1} />
            </div>
            <h3 className="text-2xl font-light mb-4">Settlements completed same business day</h3>
            <p className="text-gray-600 font-light leading-relaxed">
              No more waiting. No more uncertainty. Funds settled and confirmed within 24 hours, with options as fast as 30 minutes.
            </p>
          </div>
          <div>
            <div className="w-12 h-12 mb-6 flex items-center justify-center">
              <TrendingDown size={32} strokeWidth={1} />
            </div>
            <h3 className="text-2xl font-light mb-4">Reduce transaction costs significantly</h3>
            <p className="text-gray-600 font-light leading-relaxed">
              Stop paying 2-3% in fees and hidden charges. Transparent pricing based on your settlement needs.
            </p>
          </div>
          <div>
            <div className="w-12 h-12 mb-6 flex items-center justify-center">
              <Shield size={32} strokeWidth={1} />
            </div>
            <h3 className="text-2xl font-light mb-4">Single platform for all counterparties</h3>
            <p className="text-gray-600 font-light leading-relaxed">
              One account. One system. Handle all your maritime payments with charterers, owners, suppliers, and brokers.
            </p>
          </div>
          <div>
            <div className="w-12 h-12 mb-6 flex items-center justify-center">
              <ArrowRight size={32} strokeWidth={1} />
            </div>
            <h3 className="text-2xl font-light mb-4">Working capital optimization included</h3>
            <p className="text-gray-600 font-light leading-relaxed">
              Pre-fund your account and earn returns on idle balances. Access your funds when you need them.
            </p>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how" className="border-t border-gray-200 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-16 md:py-32 text-center">
          <h2 className="text-3xl md:text-5xl font-light mb-8 md:mb-12">How it works</h2>
          <div className="text-xl md:text-3xl font-light mb-6 md:mb-8 text-gray-800">
            Fund your account → Execute trades → Receive settlements
          </div>
          <p className="text-base md:text-xl font-light text-gray-600 max-w-3xl mx-auto">
            That's it. No complex integrations. No lengthy onboarding. Operational within 48 hours.
          </p>
        </div>
      </section>

      {/* Testimonial Section */}
      <section className="max-w-7xl mx-auto px-4 md:px-6 py-16 md:py-32">
        <div className="max-w-4xl mx-auto text-center">
          <blockquote className="text-xl md:text-3xl font-light leading-relaxed mb-6 md:mb-8">
            "Bosun transformed our settlement operations. What used to take days
            and cost us millions now happens in minutes at a fraction of the cost."
          </blockquote>
          <div className="text-xs md:text-sm font-light text-gray-600">
            — CFO, Leading Maritime Trading Company
          </div>
        </div>
      </section>

      {/* Trust Signals Section */}
      <section className="border-t border-b border-gray-200 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-12 md:py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            <div className="flex items-center gap-3">
              <CheckCircle size={24} strokeWidth={1.5} className="text-green-600 flex-shrink-0" />
              <span className="text-sm md:text-base font-light">Licensed and regulated by DIFC</span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle size={24} strokeWidth={1.5} className="text-green-600 flex-shrink-0" />
              <span className="text-sm md:text-base font-light">Bank-grade security and compliance</span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle size={24} strokeWidth={1.5} className="text-green-600 flex-shrink-0" />
              <span className="text-sm md:text-base font-light">Serving MENA maritime trade</span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle size={24} strokeWidth={1.5} className="text-green-600 flex-shrink-0" />
              <span className="text-sm md:text-base font-light">Member deposits protected</span>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-t border-gray-200 bg-black text-white">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-16 md:py-32 text-center">
          <h2 className="text-3xl md:text-5xl font-light mb-6 md:mb-8">Join forward-thinking maritime companies already saving time and money.</h2>
          <p className="text-base md:text-xl font-light mb-8 md:mb-12 text-gray-300">
            See how much you could save on your next settlement.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center">
            <button
              onClick={() => router.push('/auth/register')}
              className="px-8 py-4 bg-white text-black text-sm font-light hover:bg-gray-100 transition-colors"
            >
              Calculate Savings
            </button>
            <button
              className="px-8 py-4 border border-white text-white text-sm font-light hover:bg-white hover:text-black transition-colors"
            >
              Contact Sales
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 bg-black text-white">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-12">
          <div className="text-sm font-light text-gray-400 text-center">
            © 2025 Bosun | DIFC, Dubai | <a href="#" className="hover:text-white transition-colors">Terms</a> | <a href="#" className="hover:text-white transition-colors">Privacy</a> | <a href="#" className="hover:text-white transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  )
}