// src/app/auth/reset-password/page.tsx
'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { X } from 'lucide-react'
import { resetPassword } from '@/lib/supabase/auth'
import { createClient } from '@/lib/supabase/client'
import ShipWheelLogo from '@/components/ShipWheelLogo'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [mode, setMode] = useState<'request' | 'reset'>('request')

  useEffect(() => {
    // Check if this is a password reset link (has access_token in URL)
    const hashParams = new URLSearchParams(window.location.hash.substring(1))
    const accessToken = hashParams.get('access_token')

    if (accessToken) {
      setMode('reset')
    }
  }, [])

  async function handleRequestReset(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error } = await resetPassword(email)

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setSuccess(true)
      setLoading(false)
    }
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    setLoading(true)

    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setSuccess(true)
      setLoading(false)
      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        router.push('/dashboard')
      }, 2000)
    }
  }

  if (success && mode === 'request') {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <div className="flex items-center justify-center gap-3 mb-2">
              <ShipWheelLogo size={32} className="text-black" />
              <div className="text-2xl font-light tracking-wider">BOSUN</div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 p-8">
            <h1 className="text-3xl font-light mb-6">Check Your Email</h1>
            <p className="text-gray-600 font-light mb-6 leading-relaxed">
              We've sent a password reset link to <strong>{email}</strong>.
              Click the link in the email to reset your password.
            </p>
            <p className="text-sm text-gray-500 font-light mb-6">
              If you don't see the email, check your spam folder.
            </p>
            <button
              onClick={() => router.push('/')}
              className="w-full py-4 bg-black text-white text-sm font-light hover:bg-gray-800 transition-colors"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (success && mode === 'reset') {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <div className="flex items-center justify-center gap-3 mb-2">
              <ShipWheelLogo size={32} className="text-black" />
              <div className="text-2xl font-light tracking-wider">BOSUN</div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 p-8">
            <h1 className="text-3xl font-light mb-6">Password Reset Successfully</h1>
            <p className="text-gray-600 font-light mb-6 leading-relaxed">
              Your password has been updated. Redirecting to dashboard...
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (mode === 'reset') {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <div className="flex items-center justify-center gap-3 mb-2">
              <ShipWheelLogo size={32} className="text-black" />
              <div className="text-2xl font-light tracking-wider">BOSUN</div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 p-8">
            <div className="flex justify-between items-center mb-8">
              <h1 className="text-3xl font-light">Set New Password</h1>
              <button
                onClick={() => router.push('/')}
                className="hover:opacity-60 transition-opacity"
              >
                <X size={24} strokeWidth={1} />
              </button>
            </div>

            <form onSubmit={handleResetPassword} className="space-y-6">
              {error && (
                <div className="border border-red-200 bg-red-50 p-4 text-sm font-light text-red-600">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-light text-gray-600 mb-2">
                  New Password
                </label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 focus:outline-none focus:border-black transition-colors text-sm font-light"
                  placeholder="At least 8 characters"
                />
              </div>

              <div>
                <label className="block text-sm font-light text-gray-600 mb-2">
                  Confirm Password
                </label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 focus:outline-none focus:border-black transition-colors text-sm font-light"
                  placeholder="Re-enter your password"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-black text-white text-sm font-light hover:bg-gray-800 transition-colors disabled:opacity-50"
              >
                {loading ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center gap-3 mb-2">
            <ShipWheelLogo size={32} className="text-black" />
            <div className="text-2xl font-light tracking-wider">BOSUN</div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 p-8">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-light">Reset Password</h1>
            <button
              onClick={() => router.push('/')}
              className="hover:opacity-60 transition-opacity"
            >
              <X size={24} strokeWidth={1} />
            </button>
          </div>

          <form onSubmit={handleRequestReset} className="space-y-6">
            {error && (
              <div className="border border-red-200 bg-red-50 p-4 text-sm font-light text-red-600">
                {error}
              </div>
            )}

            <p className="text-gray-600 font-light leading-relaxed">
              Enter your email address and we'll send you a link to reset your password.
            </p>

            <div>
              <label className="block text-sm font-light text-gray-600 mb-2">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 focus:outline-none focus:border-black transition-colors text-sm font-light"
                placeholder="your@email.com"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-black text-white text-sm font-light hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => router.push('/auth/login')}
                className="text-sm font-light text-gray-600 hover:text-black transition-colors"
              >
                Back to Sign In
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
