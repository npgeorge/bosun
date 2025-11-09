// src/app/auth/register/page.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signUp } from '@/lib/supabase/auth'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import ShipWheelLogo from '@/components/ShipWheelLogo'

export default function RegisterPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  // Form data
  const [formData, setFormData] = useState({
    // Personal info
    name: '',
    email: '',
    password: '',
    confirmPassword: '',

    // Company info
    companyName: '',
    registrationNumber: '',
    companyAddress: '',
    companyPhone: '',
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // 1. Validation
      if (formData.password !== formData.confirmPassword) {
        throw new Error('Passwords do not match')
      }

      if (formData.password.length < 8) {
        throw new Error('Password must be at least 8 characters')
      }

      console.log('🚀 Starting registration for:', formData.email)

      // 2. Create auth user
      console.log('📝 Step 1: Creating auth user...')
      const { data: authData, error: authError } = await signUp(
        formData.email,
        formData.password,
        formData.name
      )

      if (authError) {
        console.error('❌ Auth error:', authError)
        throw authError
      }
      if (!authData.user) {
        throw new Error('User creation failed - no user returned')
      }

      console.log('✅ Auth user created:', authData.user.id)
      const userId = authData.user.id
      const supabase = createClient()

      // 3. Create member record
      console.log('📝 Step 2: Creating member record...')
      const memberInsertData = {
        company_name: formData.companyName,
        registration_number: formData.registrationNumber,
        contact_email: formData.email,
        kyc_status: 'pending',
        collateral_amount: 0,
      }

      console.log('Inserting member data:', memberInsertData)

      const { data: memberData, error: memberError } = await supabase
        .from('members')
        .insert(memberInsertData)
        .select()
        .single()

      if (memberError) {
        console.error('❌ Member creation error:', {
          code: memberError.code,
          message: memberError.message,
          details: memberError.details,
          hint: memberError.hint,
        })
        throw new Error(`Failed to create company profile: ${memberError.message}`)
      }

      console.log('✅ Member created:', memberData)

      // 4. Link user to member
      console.log('📝 Step 3: Linking user to member...')
      const { error: userUpdateError } = await supabase
        .from('users')
        .update({ member_id: memberData.id })
        .eq('id', userId)

      if (userUpdateError) {
        console.warn('⚠️ User link warning:', userUpdateError)
        // Don't fail - can be fixed manually
      } else {
        console.log('✅ User linked to member')
      }

      // 5. Create member application (basic info only)
      console.log('📝 Step 4: Creating member application...')
      const { error: appError } = await supabase
        .from('member_applications')
        .insert({
          member_id: memberData.id,
          user_id: userId,
          company_address: formData.companyAddress,
          company_phone: formData.companyPhone,
          status: 'incomplete',  // Mark as incomplete since banking info and docs are pending
        })

      if (appError) {
        console.warn('⚠️ Application warning:', appError)
        // Don't fail - member is created
      } else {
        console.log('✅ Application created')
      }

      console.log('🎉 Registration complete!')
      setSuccess(true)

    } catch (err: any) {
      console.error('❌ Registration failed:', err)
      setError(err.message || 'Registration failed. Please try again.')
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="text-center">
            <h2 className="text-2xl md:text-3xl font-light mb-4 text-black">Account Created!</h2>
            <div className="mb-6 p-6 bg-green-50 border border-green-200 rounded">
              <p className="text-green-800 font-light mb-4">
                Welcome to Bosun! Your account has been created successfully.
              </p>
              <p className="text-sm text-green-700 font-light">
                We've sent a confirmation email to <strong>{formData.email}</strong>.
                Please verify your email address to access your dashboard.
              </p>
            </div>
            <p className="text-sm text-gray-600 font-light mb-6">
              You can now sign in to your dashboard. Complete your banking information and upload
              required documents in the Outstanding Tasks section to activate your account.
            </p>
            <Link
              href="/auth/login"
              className="inline-block px-6 py-3 bg-black text-white text-sm font-light hover:bg-gray-800 transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white py-8 md:py-12">
      <div className="max-w-2xl mx-auto px-4 md:px-6">
        <Link href="/" className="flex flex-col items-center justify-center mb-8 md:mb-12 hover:opacity-60 transition-opacity">
          <div className="flex items-center gap-3 mb-2">
            <ShipWheelLogo size={32} className="text-black" />
            <div className="text-3xl md:text-4xl font-light tracking-wider text-black">BOSUN</div>
          </div>
          <p className="text-xs md:text-sm font-light text-gray-600">Create Your Account</p>
        </Link>

        <form onSubmit={handleSubmit} className="space-y-6 md:space-y-8">
          {error && (
            <div className="border border-red-200 bg-red-50 p-4 text-sm font-light text-red-600">
              {error}
            </div>
          )}

          {/* Personal Information */}
          <div className="border-b border-gray-200 pb-8">
            <h2 className="text-xl font-light mb-6 text-black">Personal Information</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-light uppercase tracking-wider text-gray-600 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 text-sm font-light text-black focus:outline-none focus:border-black transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-light uppercase tracking-wider text-gray-600 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 text-sm font-light text-black focus:outline-none focus:border-black transition-colors"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-light uppercase tracking-wider text-gray-600 mb-2">
                    Password *
                  </label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 text-sm font-light text-black focus:outline-none focus:border-black transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-light uppercase tracking-wider text-gray-600 mb-2">
                    Confirm Password *
                  </label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 text-sm font-light text-black focus:outline-none focus:border-black transition-colors"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Company Information */}
          <div className="border-b border-gray-200 pb-8">
            <h2 className="text-xl font-light mb-6 text-black">Company Information</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-light uppercase tracking-wider text-gray-600 mb-2">
                  Company Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 text-sm font-light text-black focus:outline-none focus:border-black transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-light uppercase tracking-wider text-gray-600 mb-2">
                  Registration Number *
                </label>
                <input
                  type="text"
                  required
                  value={formData.registrationNumber}
                  onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 text-sm font-light text-black focus:outline-none focus:border-black transition-colors"
                  placeholder="Trade license or company registration number"
                />
              </div>

              <div>
                <label className="block text-xs font-light uppercase tracking-wider text-gray-600 mb-2">
                  Company Address *
                </label>
                <textarea
                  required
                  rows={2}
                  value={formData.companyAddress}
                  onChange={(e) => setFormData({ ...formData, companyAddress: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 text-sm font-light text-black focus:outline-none focus:border-black transition-colors resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-light uppercase tracking-wider text-gray-600 mb-2">
                  Company Phone *
                </label>
                <input
                  type="tel"
                  required
                  value={formData.companyPhone}
                  onChange={(e) => setFormData({ ...formData, companyPhone: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 text-sm font-light text-black focus:outline-none focus:border-black transition-colors"
                  placeholder="+971 XX XXX XXXX"
                />
              </div>
            </div>
          </div>

          {/* Terms */}
          <div className="bg-gray-50 p-6 border border-gray-200">
            <p className="text-xs font-light text-gray-600 leading-relaxed">
              By creating an account, you agree to Bosun's Terms of Service and Privacy Policy.
              You'll need to complete your banking information and upload required documents from
              your dashboard to activate full account access.
            </p>
          </div>

          {/* Submit */}
          <div className="flex flex-col-reverse sm:flex-row gap-3 md:gap-4">
            <Link
              href="/auth/login"
              className="flex-1 py-3 text-center border border-gray-300 text-black text-sm font-light hover:bg-gray-50 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 bg-black text-white text-sm font-light hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}