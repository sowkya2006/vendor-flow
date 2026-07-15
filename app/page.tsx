import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Building2, Truck, ArrowRight, Zap } from 'lucide-react'
import { InviteErrorDetector } from '@/components/auth/invite-error-detector'

interface PageProps {
  searchParams: Promise<{ error?: string; error_code?: string }>
}

// The landing page ALWAYS shows the portal selection cards.
// It never auto-redirects. If a user is already logged in and wants to
// go back to their portal, they can click the card — the proxy middleware
// will check their vf_portal cookie and skip the login form.

export default async function LandingPage({ searchParams }: PageProps) {
  const params = await searchParams

  if (params.error_code === 'otp_expired' || params.error === 'access_denied') {
    redirect('/invite/expired')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[--color-background] via-[--color-background-subtle] to-[--color-background] flex flex-col">
      <InviteErrorDetector />

      {/* Header */}
      <header className="h-16 flex items-center justify-between px-6 shrink-0 border-b border-[--color-border]/50">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center size-8 rounded-lg bg-[--color-primary]">
            <Zap className="size-4 text-white" />
          </div>
          <span className="text-base font-bold text-[--color-foreground] tracking-tight">
            VendorFlow
          </span>
        </div>
        <span className="text-xs text-[--color-foreground-muted]">
          Enterprise Procurement Platform
        </span>
      </header>

      {/* Main */}
      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-3xl space-y-10">
          {/* Hero */}
          <div className="text-center space-y-3">
            <div className="inline-flex items-center rounded-full border border-[--color-border] bg-[--color-card] px-3 py-1 text-xs font-medium text-[--color-foreground-muted] shadow-sm mb-2">
              ✦ Streamline your procurement workflow
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-[--color-foreground] sm:text-5xl">
              Welcome to{' '}
              <span className="text-[--color-primary]">VendorFlow</span>
            </h1>
            <p className="mx-auto max-w-lg text-base text-[--color-foreground-muted]">
              Choose your portal to continue.
            </p>
          </div>

          {/* Portal cards */}
          <div className="grid gap-5 sm:grid-cols-2">
            {/* Company Portal */}
            <Link
              href="/company/login"
              className="group relative overflow-hidden rounded-2xl border border-[--color-border] bg-[--color-card] p-8 shadow-[--shadow-sm] transition-all duration-300 hover:shadow-[--shadow-lg] hover:border-[--color-primary]/40 hover:-translate-y-0.5"
            >
              <div className="absolute inset-0 -z-10 bg-gradient-to-br from-[--color-primary]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="space-y-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[--color-primary]/10 text-[--color-primary] ring-1 ring-[--color-primary]/20 transition-transform group-hover:scale-105">
                  <Building2 className="h-7 w-7" />
                </div>
                <div className="space-y-1.5">
                  <h2 className="text-xl font-semibold text-[--color-foreground]">Company Portal</h2>
                  <p className="text-sm text-[--color-foreground-muted] leading-relaxed">
                    For procurement teams, finance managers, and administrators.
                  </p>
                </div>
                <ul className="space-y-1.5">
                  {['Vendor Management', 'Purchase Orders', 'Invoices & Payments', 'Analytics & Reports'].map((f) => (
                    <li key={f} className="flex items-center gap-2 text-xs text-[--color-foreground-muted]">
                      <span className="h-1.5 w-1.5 rounded-full bg-[--color-primary] shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <div className="flex items-center gap-1.5 text-sm font-semibold text-[--color-primary] group-hover:gap-2.5 transition-all">
                  Sign in to Company Portal <ArrowRight className="h-4 w-4" />
                </div>
              </div>
            </Link>

            {/* Vendor Portal */}
            <Link
              href="/vendor/login"
              className="group relative overflow-hidden rounded-2xl border border-[--color-border] bg-[--color-card] p-8 shadow-[--shadow-sm] transition-all duration-300 hover:shadow-[--shadow-lg] hover:border-emerald-500/40 hover:-translate-y-0.5"
            >
              <div className="absolute inset-0 -z-10 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="space-y-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/20 transition-transform group-hover:scale-105">
                  <Truck className="h-7 w-7" />
                </div>
                <div className="space-y-1.5">
                  <h2 className="text-xl font-semibold text-[--color-foreground]">Vendor Portal</h2>
                  <p className="text-sm text-[--color-foreground-muted] leading-relaxed">
                    For suppliers and vendors to respond to RFQs and track orders.
                  </p>
                </div>
                <ul className="space-y-1.5">
                  {['View RFQs', 'Submit Quotations', 'Track Purchase Orders', 'Invoice & Payment Status'].map((f) => (
                    <li key={f} className="flex items-center gap-2 text-xs text-[--color-foreground-muted]">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <div className="flex items-center gap-1.5 text-sm font-semibold text-emerald-600 dark:text-emerald-400 group-hover:gap-2.5 transition-all">
                  Sign in to Vendor Portal <ArrowRight className="h-4 w-4" />
                </div>
              </div>
            </Link>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-4">
            <div className="flex-1 h-px bg-[--color-border]" />
            <span className="text-xs text-[--color-foreground-subtle]">New to VendorFlow?</span>
            <div className="flex-1 h-px bg-[--color-border]" />
          </div>

          <div className="text-center">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 rounded-xl border border-[--color-border] bg-[--color-card] px-6 py-3 text-sm font-medium text-[--color-foreground] shadow-sm transition-all hover:shadow-md hover:border-[--color-primary]/40 hover:text-[--color-primary]"
            >
              <Zap className="h-4 w-4" />
              Create a new workspace
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </main>

      <footer className="py-6 text-center text-xs text-[--color-foreground-subtle] border-t border-[--color-border]/50">
        &copy; {new Date().getFullYear()} VendorFlow. Enterprise Procurement Management.
      </footer>
    </div>
  )
}
