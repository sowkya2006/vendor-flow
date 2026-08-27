import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const metadata: Metadata = { title: 'Privacy Policy — VendorFlow' }

export default function PrivacyPage() {
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

        <h1 className="text-2xl font-bold text-[--color-foreground]">Privacy Policy</h1>
        <p className="mt-2 text-sm text-[--color-foreground-muted]">Last updated: January 2025</p>

        <div className="mt-8 space-y-6 text-sm text-[--color-foreground-muted] leading-relaxed">
          <section>
            <h2 className="mb-2 text-base font-semibold text-[--color-foreground]">1. Information We Collect</h2>
            <p>
              We collect information you provide directly — such as your name, email address, and
              company details when you register — as well as data generated through your use of the
              platform (procurement records, vendor data, usage analytics).
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold text-[--color-foreground]">2. How We Use Your Information</h2>
            <p>
              We use the information we collect to operate and improve VendorFlow, send transactional
              emails (e.g. approval notifications, invoice alerts), provide customer support, and
              comply with legal obligations. We do not sell your personal data to third parties.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold text-[--color-foreground]">3. Data Storage and Security</h2>
            <p>
              Your data is stored securely using Supabase (PostgreSQL), protected by row-level
              security policies, encrypted in transit (TLS), and access-controlled by role. We apply
              industry-standard security practices to protect your information.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold text-[--color-foreground]">4. Cookies</h2>
            <p>
              VendorFlow uses cookies for authentication (session management) and portal routing. We
              do not use third-party advertising cookies. You can control cookies through your browser
              settings, though disabling them may prevent you from logging in.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold text-[--color-foreground]">5. Data Retention</h2>
            <p>
              We retain your data for as long as your account is active, or as required by law. You
              may request deletion of your account and associated data by contacting us.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold text-[--color-foreground]">6. Third-Party Services</h2>
            <p>
              VendorFlow integrates with Supabase (database/auth), Brevo (transactional email), and
              optionally OpenAI (AI features). Each service has its own privacy policy governing how
              they handle data.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold text-[--color-foreground]">7. Your Rights</h2>
            <p>
              You have the right to access, correct, or delete your personal data. To exercise these
              rights, contact us at{' '}
              <a href="mailto:support@vendorflow.app" className="text-[--color-primary] hover:underline">
                support@vendorflow.app
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold text-[--color-foreground]">8. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy periodically. We will notify you of significant
              changes via email or an in-app notification. Continued use of VendorFlow after changes
              constitutes acceptance.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
