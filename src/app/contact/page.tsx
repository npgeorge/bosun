// src/app/contact/page.tsx
'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { Mail, MapPin, Building } from 'lucide-react'
import ShipWheelLogo from '@/components/ShipWheelLogo'

export default function ContactPage() {
  const router = useRouter()

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
            Get in Touch
          </h1>
          <p className="text-lg md:text-xl font-light text-gray-600 max-w-3xl mx-auto">
            Have questions about Bosun? We're here to help. Reach out to our team and we'll get back to you promptly.
          </p>
        </div>
      </section>

      {/* Contact Information */}
      <section className="max-w-5xl mx-auto px-4 md:px-6 py-12 md:py-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {/* Sales */}
          <div className="text-center p-8 border border-gray-200 hover:border-black transition-colors">
            <div className="flex justify-center mb-4">
              <Mail size={32} strokeWidth={1} className="text-gray-600" />
            </div>
            <h3 className="text-xl font-light mb-3">Sales</h3>
            <p className="text-sm font-light text-gray-600 mb-4">
              Interested in learning more about our platform?
            </p>
            <a
              href="mailto:sales@bosun.global"
              className="text-sm font-light underline hover:text-gray-600 transition-colors"
            >
              sales@bosun.global
            </a>
          </div>

          {/* Support */}
          <div className="text-center p-8 border border-gray-200 hover:border-black transition-colors">
            <div className="flex justify-center mb-4">
              <Mail size={32} strokeWidth={1} className="text-gray-600" />
            </div>
            <h3 className="text-xl font-light mb-3">Support</h3>
            <p className="text-sm font-light text-gray-600 mb-4">
              Need help with your account or a transaction?
            </p>
            <a
              href="mailto:support@bosun.global"
              className="text-sm font-light underline hover:text-gray-600 transition-colors"
            >
              support@bosun.global
            </a>
          </div>

          {/* General */}
          <div className="text-center p-8 border border-gray-200 hover:border-black transition-colors">
            <div className="flex justify-center mb-4">
              <Mail size={32} strokeWidth={1} className="text-gray-600" />
            </div>
            <h3 className="text-xl font-light mb-3">General</h3>
            <p className="text-sm font-light text-gray-600 mb-4">
              Other inquiries or feedback?
            </p>
            <a
              href="mailto:info@bosun.global"
              className="text-sm font-light underline hover:text-gray-600 transition-colors"
            >
              info@bosun.global
            </a>
          </div>
        </div>

        {/* Office Information */}
        <div className="border-t border-gray-200 pt-12">
          <h2 className="text-3xl font-light mb-8 text-center">Our Office</h2>
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-start gap-4 p-6 border border-gray-200">
              <Building size={24} strokeWidth={1} className="text-gray-600 mt-1 flex-shrink-0" />
              <div>
                <h3 className="text-lg font-light mb-2">Headquarters</h3>
                <p className="text-sm font-light text-gray-700 leading-relaxed">
                  Dubai International Financial Centre<br />
                  Dubai, United Arab Emirates
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-6 border border-gray-200">
              <MapPin size={24} strokeWidth={1} className="text-gray-600 mt-1 flex-shrink-0" />
              <div>
                <h3 className="text-lg font-light mb-2">Regulatory Information</h3>
                <p className="text-sm font-light text-gray-700 leading-relaxed">
                  Bosun is licensed and regulated by the Dubai International Financial Centre (DIFC).
                  We operate under strict regulatory oversight to ensure the security and compliance
                  of all transactions.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Response Time */}
      <section className="border-t border-gray-200 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-12 md:py-16 text-center">
          <h2 className="text-2xl md:text-3xl font-light mb-4">
            Response Time
          </h2>
          <p className="text-base font-light text-gray-600 max-w-2xl mx-auto">
            We typically respond to all inquiries within 24 hours during business days (Sunday-Thursday, UAE time).
            For urgent matters, existing customers can access priority support through their dashboard.
          </p>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-4 md:px-6 py-16 md:py-24 text-center">
        <h2 className="text-3xl md:text-4xl font-light mb-6">
          Ready to get started?
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
            onClick={() => router.push('/calculator')}
            className="px-8 py-4 border border-black text-black text-sm font-light hover:bg-black hover:text-white transition-colors"
          >
            Calculate Savings
          </button>
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
