// src/app/privacy/page.tsx
'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import ShipWheelLogo from '@/components/ShipWheelLogo'

export default function PrivacyPolicyPage() {
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
        <h1 className="text-4xl md:text-5xl font-light mb-4">Privacy Policy</h1>
        <p className="text-sm font-light text-gray-600 mb-12">
          Last updated: January 2025
        </p>

        <div className="space-y-8 font-light leading-relaxed">
          <section>
            <h2 className="text-2xl font-light mb-4">1. Introduction</h2>
            <p className="text-gray-700 mb-4">
              Bosun ("we," "our," or "us") is committed to protecting your privacy. This Privacy
              Policy explains how we collect, use, disclose, and safeguard your information when
              you use our maritime settlement platform and related services.
            </p>
            <p className="text-gray-700">
              By using our Services, you consent to the data practices described in this policy.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-light mb-4">2. Information We Collect</h2>

            <h3 className="text-xl font-light mb-3 mt-6">2.1 Information You Provide</h3>
            <p className="text-gray-700 mb-3">
              We collect information that you provide directly to us, including:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>Account information (name, email address, company name)</li>
              <li>Business information (company details, industry, role)</li>
              <li>Financial information (bank account details, transaction data)</li>
              <li>Identity verification documents (as required by KYC/AML regulations)</li>
              <li>Communications with our support team</li>
            </ul>

            <h3 className="text-xl font-light mb-3 mt-6">2.2 Automatically Collected Information</h3>
            <p className="text-gray-700 mb-3">
              When you access our Services, we automatically collect certain information, including:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>Device information (IP address, browser type, operating system)</li>
              <li>Usage data (pages viewed, features used, time spent)</li>
              <li>Log data (access times, errors, performance metrics)</li>
              <li>Cookies and similar tracking technologies</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-light mb-4">3. How We Use Your Information</h2>
            <p className="text-gray-700 mb-3">
              We use the information we collect to:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>Provide, maintain, and improve our Services</li>
              <li>Process and complete transactions</li>
              <li>Verify your identity and comply with legal obligations (KYC/AML)</li>
              <li>Send you service-related communications</li>
              <li>Respond to your inquiries and provide customer support</li>
              <li>Detect, prevent, and address fraud and security issues</li>
              <li>Analyze usage patterns and optimize user experience</li>
              <li>Comply with applicable laws and regulations</li>
              <li>Enforce our Terms of Service</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-light mb-4">4. How We Share Your Information</h2>
            <p className="text-gray-700 mb-4">
              We do not sell your personal information. We may share your information in the
              following circumstances:
            </p>

            <h3 className="text-xl font-light mb-3 mt-6">4.1 Service Providers</h3>
            <p className="text-gray-700 mb-4">
              We may share information with third-party service providers who perform services on
              our behalf, such as payment processing, data analysis, and customer support.
            </p>

            <h3 className="text-xl font-light mb-3 mt-6">4.2 Business Transfers</h3>
            <p className="text-gray-700 mb-4">
              In connection with any merger, sale of company assets, financing, or acquisition of
              all or a portion of our business, your information may be transferred.
            </p>

            <h3 className="text-xl font-light mb-3 mt-6">4.3 Legal Requirements</h3>
            <p className="text-gray-700 mb-4">
              We may disclose your information if required by law or in response to valid legal
              requests from authorities, including to meet national security or law enforcement
              requirements.
            </p>

            <h3 className="text-xl font-light mb-3 mt-6">4.4 With Your Consent</h3>
            <p className="text-gray-700">
              We may share your information with third parties when you have given us explicit
              consent to do so.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-light mb-4">5. Data Security</h2>
            <p className="text-gray-700 mb-4">
              We implement appropriate technical and organizational security measures to protect
              your information against unauthorized access, alteration, disclosure, or destruction.
            </p>
            <p className="text-gray-700 mb-4">
              These measures include:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>Encryption of data in transit and at rest</li>
              <li>Regular security assessments and audits</li>
              <li>Access controls and authentication mechanisms</li>
              <li>Employee training on data protection practices</li>
              <li>Incident response procedures</li>
            </ul>
            <p className="text-gray-700 mt-4">
              However, no method of transmission over the internet or electronic storage is 100%
              secure. While we strive to protect your information, we cannot guarantee absolute
              security.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-light mb-4">6. Data Retention</h2>
            <p className="text-gray-700 mb-4">
              We retain your information for as long as necessary to provide our Services and comply
              with our legal obligations, resolve disputes, and enforce our agreements.
            </p>
            <p className="text-gray-700">
              Financial transaction data may be retained for extended periods as required by
              applicable financial regulations and anti-money laundering laws.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-light mb-4">7. Your Rights</h2>
            <p className="text-gray-700 mb-3">
              Depending on your location, you may have certain rights regarding your personal
              information, including:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>Access: Request access to your personal information</li>
              <li>Correction: Request correction of inaccurate information</li>
              <li>Deletion: Request deletion of your information (subject to legal requirements)</li>
              <li>Objection: Object to certain processing of your information</li>
              <li>Portability: Request transfer of your information to another service</li>
              <li>Withdraw consent: Withdraw consent for processing where applicable</li>
            </ul>
            <p className="text-gray-700 mt-4">
              To exercise these rights, please contact us at{' '}
              <a href="mailto:privacy@bosun.global" className="underline hover:text-black">
                privacy@bosun.global
              </a>
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-light mb-4">8. International Data Transfers</h2>
            <p className="text-gray-700 mb-4">
              Your information may be transferred to and processed in countries other than your
              country of residence. These countries may have different data protection laws.
            </p>
            <p className="text-gray-700">
              We ensure appropriate safeguards are in place to protect your information in
              accordance with this Privacy Policy and applicable laws.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-light mb-4">9. Cookies and Tracking</h2>
            <p className="text-gray-700 mb-4">
              We use cookies and similar tracking technologies to collect and track information
              about your use of our Services. You can control cookie preferences through your
              browser settings.
            </p>
            <p className="text-gray-700">
              Please note that disabling certain cookies may limit your ability to use some features
              of our Services.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-light mb-4">10. Children's Privacy</h2>
            <p className="text-gray-700">
              Our Services are not intended for individuals under the age of 18. We do not knowingly
              collect personal information from children. If you believe we have collected
              information from a child, please contact us immediately.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-light mb-4">11. Changes to This Privacy Policy</h2>
            <p className="text-gray-700 mb-4">
              We may update this Privacy Policy from time to time. We will notify you of any
              material changes by posting the updated policy on our website and updating the
              "Last updated" date.
            </p>
            <p className="text-gray-700">
              Your continued use of our Services after changes become effective constitutes your
              acceptance of the revised Privacy Policy.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-light mb-4">12. Contact Us</h2>
            <p className="text-gray-700 mb-4">
              If you have any questions, concerns, or requests regarding this Privacy Policy or
              our data practices, please contact us at:
            </p>
            <p className="text-gray-700">
              Email: <a href="mailto:privacy@bosun.global" className="underline hover:text-black">privacy@bosun.global</a><br />
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
