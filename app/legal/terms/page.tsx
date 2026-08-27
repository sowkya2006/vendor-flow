import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const metadata: Metadata = { title: 'Terms of Service — VendorFlow' }

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[--color-background] px-4 py-12">
      <div className="mx-auto max-w-2xl">
        <Link
          href="/"
          className="mb-8 inline-flex items-center gap-1.5 text-sm text-[--color-foreground-muted] hover:text-[--color-foreground] transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to home
        </Link>

        <h1 className="text-2xl font-bold text-[--color-foreground]">Terms of Service</h1>
        <p className="mt-2 text-sm text-[--color-foreground-muted]">Last updated: January 2025</p>

        <div className="mt-8 space-y-6 text-sm text-[--color-foreground-muted] leading-relaxed">
          <section>
            <h2 className="mb-2 text-base font-semibold text-[--color-foreground]">1. Acceptance of Terms</h2>
            <p>
              By accessing or using VendorFlow, you agree to be bound by these Terms of Service. If
              you do not agree to these terms, please do not use the platform.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold text-[--color-foreground]">2. Use of the Platform</h2>
            <p>
              VendorFlow is an enterprise procurement management platform. You agree to use it only
              for lawful purposes and in accordance with these terms. You are responsible for
              maintaining the confidentiality of your account credentials.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold text-[--color-foreground]">3. Data and Privacy</h2>
            <p>
              Your use of VendorFlow is also governed by our{' '}
              <Link href="/legal/privacy" className="text-[--color-primary] hover:underline">
                Privacy Policy
              </Link>
              , which is incorporated into these terms by reference.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold text-[--color-foreground]">4. Intellectual Property</h2>
            <p>
              All content, features, and functionality of VendorFlow are owned by VendorFlow and
              protected by applicable intellectual property laws. You may not copy, modify, or
              distribute any part of the platform without prior written consent.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold text-[--color-foreground]">5. Limitation of Liability</h2>
            <p>
              VendorFlow is provided &quot;as is&quot; without warranty of any kind. To the maximum extent
              permitted by law, VendorFlow shall not be liable for any indirect, incidental, or
              consequential damages arising from your use of the platform.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold text-[--color-foreground]">6. Changes to Terms</h2>
            <p>
              We reserve the right to update these terms at any time. Continued use of the platform
              after changes constitutes acceptance of the new terms.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold text-[--color-foreground]">7. Contact</h2>
            <p>
              For questions about these terms, contact us at{' '}
              <a href="mailto:support@vendorflow.app" className="text-[--color-primary] hover:underline">
                support@vendorflow.app
              </a>
              .
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
