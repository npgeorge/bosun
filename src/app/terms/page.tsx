// src/app/terms/page.tsx
'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import ShipWheelLogo from '@/components/ShipWheelLogo'

export default function TermsOfServicePage() {
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

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 md:px-6 py-12 md:py-20">
        <h1 className="text-4xl md:text-5xl font-light mb-4">Terms of Service</h1>
        <p className="text-sm font-light text-gray-600 mb-12">
          Last updated: January 2025
        </p>

        <div className="space-y-8 font-light leading-relaxed">
          <section>
            <h2 className="text-2xl font-light mb-4">1. Introduction</h2>
            <p className="text-gray-700 mb-4">
              Welcome to Bosun. These Terms of Service ("Terms") govern your access to and use of
              Bosun's maritime settlement platform and related services (collectively, the "Services").
            </p>
            <p className="text-gray-700">
              By accessing or using our Services, you agree to be bound by these Terms. If you do not
              agree to these Terms, you may not access or use the Services.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-light mb-4">2. Eligibility</h2>
            <p className="text-gray-700 mb-4">
              Our Services are intended for use by qualified maritime trade participants, including
              but not limited to charterers, ship owners, brokers, and suppliers.
            </p>
            <p className="text-gray-700">
              To use our Services, you must:
            </p>
            <ul className="list-disc list-inside text-gray-700 mt-2 space-y-2 ml-4">
              <li>Be at least 18 years of age</li>
              <li>Have the authority to bind your organization to these Terms</li>
              <li>Provide accurate and complete information during registration</li>
              <li>Comply with all applicable laws and regulations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-light mb-4">3. Account Registration</h2>
            <p className="text-gray-700 mb-4">
              To access certain features of the Services, you must create an account. You agree to:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>Provide accurate, current, and complete information</li>
              <li>Maintain and promptly update your account information</li>
              <li>Maintain the security of your account credentials</li>
              <li>Notify us immediately of any unauthorized access or security breach</li>
              <li>Accept responsibility for all activities that occur under your account</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-light mb-4">4. Use of Services</h2>
            <p className="text-gray-700 mb-4">
              You may use the Services only for lawful purposes and in accordance with these Terms.
              You agree not to:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>Violate any applicable laws or regulations</li>
              <li>Infringe upon the rights of others</li>
              <li>Transmit any malicious code or malware</li>
              <li>Interfere with or disrupt the Services</li>
              <li>Attempt to gain unauthorized access to any part of the Services</li>
              <li>Use the Services for fraudulent or illegal purposes</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-light mb-4">5. Financial Services and Compliance</h2>
            <p className="text-gray-700 mb-4">
              Bosun is licensed and regulated by the Dubai International Financial Centre (DIFC).
              All financial transactions are subject to applicable laws, regulations, and compliance
              requirements.
            </p>
            <p className="text-gray-700">
              You acknowledge and agree that we may conduct due diligence, KYC (Know Your Customer),
              and AML (Anti-Money Laundering) checks as required by law.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-light mb-4">6. Fees and Payments</h2>
            <p className="text-gray-700 mb-4">
              Certain features of the Services may be subject to fees. You agree to pay all applicable
              fees as described in our pricing documentation. Fees are non-refundable except as
              required by law.
            </p>
            <p className="text-gray-700">
              We reserve the right to change our fees upon reasonable notice. Continued use of the
              Services after fee changes constitutes acceptance of the new fees.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-light mb-4">7. Intellectual Property</h2>
            <p className="text-gray-700 mb-4">
              The Services and all related content, features, and functionality are owned by Bosun
              and are protected by international copyright, trademark, and other intellectual property
              laws.
            </p>
            <p className="text-gray-700">
              You are granted a limited, non-exclusive, non-transferable license to access and use
              the Services for their intended purpose. You may not copy, modify, distribute, or
              create derivative works based on the Services.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-light mb-4">8. Limitation of Liability</h2>
            <p className="text-gray-700 mb-4">
              To the maximum extent permitted by law, Bosun shall not be liable for any indirect,
              incidental, special, consequential, or punitive damages, or any loss of profits or
              revenues, whether incurred directly or indirectly.
            </p>
            <p className="text-gray-700">
              Our total liability for any claims arising out of or relating to these Terms or the
              Services shall not exceed the amount you paid to us in the twelve (12) months preceding
              the claim.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-light mb-4">9. Termination</h2>
            <p className="text-gray-700 mb-4">
              We may suspend or terminate your access to the Services at any time, with or without
              cause or notice, including for violation of these Terms.
            </p>
            <p className="text-gray-700">
              You may terminate your account at any time by contacting us. Upon termination, your
              right to access the Services will immediately cease.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-light mb-4">10. Governing Law</h2>
            <p className="text-gray-700">
              These Terms shall be governed by and construed in accordance with the laws of the
              Dubai International Financial Centre (DIFC), without regard to its conflict of law
              provisions.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-light mb-4">11. Changes to Terms</h2>
            <p className="text-gray-700 mb-4">
              We reserve the right to modify these Terms at any time. We will notify you of any
              material changes by posting the updated Terms on our website and updating the "Last
              updated" date.
            </p>
            <p className="text-gray-700">
              Your continued use of the Services after changes become effective constitutes your
              acceptance of the revised Terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-light mb-4">12. Contact Information</h2>
            <p className="text-gray-700 mb-4">
              If you have any questions about these Terms, please contact us at:
            </p>
            <p className="text-gray-700">
              Email: <a href="mailto:legal@bosun.global" className="underline hover:text-black">legal@bosun.global</a><br />
              Address: Dubai International Financial Centre, Dubai, UAE
            </p>
          </section>
        </div>

        <div className="mt-16 pt-8 border-t border-gray-200">
          <button
            onClick={() => router.push('/')}
            className="text-sm font-light text-gray-600 hover:text-black transition-colors"
          >
            ← Back to Home
          </button>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-200 mt-20">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
          <div className="text-sm font-light text-gray-500 text-center">
            © 2025 Bosun | DIFC, Dubai
          </div>
        </div>
      </footer>
    </div>
  )
}
