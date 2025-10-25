// src/app/auth/login/page.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from '@/lib/supabase/auth'
import Link from 'next/link'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { data, error } = await signIn(email, password)

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/dashboard')
      router.refresh()
    }
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="w-full max-w-md">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-light tracking-wider mb-2 text-black">BOSUN</h1>
          <p className="text-sm font-light text-gray-600">Maritime Settlement Platform</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="border border-red-200 bg-red-50 p-4 text-sm font-light text-red-600">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-xs font-light uppercase tracking-wider text-gray-600 mb-2">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 text-sm font-light text-black focus:outline-none focus:border-black transition-colors"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-xs font-light uppercase tracking-wider text-gray-600 mb-2">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 text-sm font-light text-black focus:outline-none focus:border-black transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-black text-white text-sm font-light hover:bg-gray-800 transition-colors disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>

          <div className="text-center space-y-2">
            <Link href="/auth/signup" className="block text-sm font-light text-gray-600 hover:text-black transition-colors">
              Create an account
            </Link>
            <Link href="/auth/reset-password" className="block text-sm font-light text-gray-600 hover:text-black transition-colors">
              Forgot password?
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}