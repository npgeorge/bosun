// src/app/page.tsx
'use client'

import React, { useState } from 'react'
import { ArrowRight, Shield, Zap, TrendingDown, X } from 'lucide-react'
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
        <div className="max-w-7xl mx-auto px-6 py-6 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <ShipWheelLogo size={32} className="text-black" />
            <div className="text-2xl font-light tracking-wider">BOSUN</div>
          </div>
          <div className="flex gap-8 items-center">
            <a href="#benefits" className="text-sm font-light hover:text-gray-600 transition-colors">Benefits</a>
            <a href="#how" className="text-sm font-light hover:text-gray-600 transition-colors">How It Works</a>
            <button 
              onClick={() => openAuth('signin')}
              className="text-sm font-light hover:text-gray-600 transition-colors"
            >
              Sign In
            </button>
            <button 
              onClick={() => router.push('/auth/register')}
              className="px-6 py-2 bg-black text-white text-sm font-light hover:bg-gray-800 transition-colors"
            >
              Request Access
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section with Background Image */}
      <section className="relative min-h-[600px] flex items-center">
        {/* Background Image */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: 'url(/ship-wheel.jpg)',
            filter: 'grayscale(100%) brightness(0.4)'
          }}
        >
          {/* Dark overlay for better text contrast */}
          <div className="absolute inset-0 bg-black bg-opacity-40" />
        </div>

        {/* Content */}
        <div className="relative max-w-7xl mx-auto px-6 py-32 w-full">
          <div className="max-w-3xl">
            <h1 className="text-7xl font-light leading-tight mb-8 tracking-tight text-white">
              Maritime settlement,<br />reimagined
            </h1>
            <p className="text-xl font-light text-gray-200 mb-12 leading-relaxed">
              Reduce transaction costs by 85%. Settle in minutes, not days.
              Purpose-built for the maritime industry.
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => router.push('/auth/register')}
                className="px-8 py-4 bg-white text-black text-sm font-light hover:bg-gray-100 transition-colors flex items-center gap-2"
              >
                Get Started
                <ArrowRight size={16} />
              </button>
              <button className="px-8 py-4 border border-white text-white text-sm font-light hover:bg-white hover:text-black transition-colors">
                View Demo
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="border-t border-b border-gray-200 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="grid grid-cols-3 gap-12">
            <div>
              <div className="text-5xl font-light mb-3">85%</div>
              <div className="text-sm font-light text-gray-600">Cost reduction vs traditional settlement</div>
            </div>
            <div>
              <div className="text-5xl font-light mb-3">20min</div>
              <div className="text-sm font-light text-gray-600">Average settlement time</div>
            </div>
            <div>
              <div className="text-5xl font-light mb-3">$655B</div>
              <div className="text-sm font-light text-gray-600">Global maritime trade volume</div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="benefits" className="max-w-7xl mx-auto px-6 py-32">
        <h2 className="text-5xl font-light mb-20 text-center">Built for efficiency</h2>
        <div className="grid grid-cols-3 gap-16">
          <div>
            <div className="w-12 h-12 mb-6 flex items-center justify-center">
              <TrendingDown size={32} strokeWidth={1} />
            </div>
            <h3 className="text-2xl font-light mb-4">Dramatically lower costs</h3>
            <p className="text-gray-600 font-light leading-relaxed">
              Traditional wire transfers cost 2-3% per transaction. Bosun reduces 
              settlement costs to 0.4-0.8% through advanced network optimization.
            </p>
          </div>
          <div>
            <div className="w-12 h-12 mb-6 flex items-center justify-center">
              <Zap size={32} strokeWidth={1} />
            </div>
            <h3 className="text-2xl font-light mb-4">Settle in minutes</h3>
            <p className="text-gray-600 font-light leading-relaxed">
              No more 3-5 day wire transfers. Bosun processes settlements twice 
              daily with 10-20 minute confirmation times.
            </p>
          </div>
          <div>
            <div className="w-12 h-12 mb-6 flex items-center justify-center">
              <Shield size={32} strokeWidth={1} />
            </div>
            <h3 className="text-2xl font-light mb-4">Enhanced security</h3>
            <p className="text-gray-600 font-light leading-relaxed">
              Advanced fraud detection and multilateral verification ensure every 
              transaction is authentic and authorized.
            </p>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how" className="border-t border-gray-200 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6 py-32">
          <h2 className="text-5xl font-light mb-20 text-center">Seamless integration</h2>
          <div className="max-w-3xl mx-auto space-y-16">
            <div className="flex gap-8">
              <div className="text-4xl font-light text-gray-300">01</div>
              <div>
                <h3 className="text-2xl font-light mb-3">Record transactions</h3>
                <p className="text-gray-600 font-light leading-relaxed">
                  Enter trade details through our simple interface or upload 
                  documents for automatic processing.
                </p>
              </div>
            </div>
            <div className="flex gap-8">
              <div className="text-4xl font-light text-gray-300">02</div>
              <div>
                <h3 className="text-2xl font-light mb-3">Network optimization</h3>
                <p className="text-gray-600 font-light leading-relaxed">
                  Our proprietary system analyzes your obligations across all 
                  counterparties to minimize settlement requirements.
                </p>
              </div>
            </div>
            <div className="flex gap-8">
              <div className="text-4xl font-light text-gray-300">03</div>
              <div>
                <h3 className="text-2xl font-light mb-3">Instant settlement</h3>
                <p className="text-gray-600 font-light leading-relaxed">
                  Receive your settlement notification and confirm. Funds are 
                  settled within minutes, twice daily.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonial Section */}
      <section className="max-w-7xl mx-auto px-6 py-32">
        <div className="max-w-4xl mx-auto text-center">
          <blockquote className="text-3xl font-light leading-relaxed mb-8">
            "Bosun transformed our settlement operations. What used to take days 
            and cost us millions now happens in minutes at a fraction of the cost."
          </blockquote>
          <div className="text-sm font-light text-gray-600">
            — CFO, Leading Maritime Trading Company
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-t border-gray-200 bg-black text-white">
        <div className="max-w-7xl mx-auto px-6 py-32 text-center">
          <h2 className="text-5xl font-light mb-8">Ready to optimize your settlements?</h2>
          <p className="text-xl font-light mb-12 text-gray-300">
            Join the maritime companies already saving millions with Bosun.
          </p>
          <div className="flex gap-4 justify-center max-w-md mx-auto">
            <input
              type="email"
              placeholder="Your email address"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              className="flex-1 px-6 py-4 bg-white text-black text-sm font-light focus:outline-none focus:ring-2 focus:ring-white"
            />
            <button 
              onClick={() => router.push('/auth/register')}
              className="px-8 py-4 bg-white text-black text-sm font-light hover:bg-gray-100 transition-colors"
            >
              Request Access
            </button>
          </div>
          <p className="text-xs font-light text-gray-400 mt-6">
            Limited to qualified maritime trade participants
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 bg-black text-white">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="grid grid-cols-4 gap-12">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <ShipWheelLogo size={24} className="text-white" />
                <div className="text-xl font-light">BOSUN</div>
              </div>
              <p className="text-sm font-light text-gray-400">
                Maritime settlement infrastructure
              </p>
            </div>
            <div>
              <div className="text-sm font-light mb-4">Product</div>
              <ul className="space-y-2 text-sm font-light text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Security</a></li>
              </ul>
            </div>
            <div>
              <div className="text-sm font-light mb-4">Company</div>
              <ul className="space-y-2 text-sm font-light text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>
            <div>
              <div className="text-sm font-light mb-4">Legal</div>
              <ul className="space-y-2 text-sm font-light text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Privacy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Compliance</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-12 pt-8 text-sm font-light text-gray-400 text-center">
            © 2025 Bosun. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}