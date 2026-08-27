import { Suspense } from 'react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { Zap, ArrowLeft, XCircle, Mail, Building2, Shield, TrendingUp } from 'lucide-react'
import { LoginForm } from '@/components/auth/login-form'
import { InviteErrorDetector } from '@/components/auth/invite-error-detector'

export const metadata: Metadata = {
  title: 'Sign In — VendorFlow',
}

interface PageProps {
  searchParams: Promise<{ error?: string; error_code?: string; invited?: string; hint?: string }>
}

export default async function CompanyLoginPage({ searchParams }: PageProps) {
  const params = await searchParams
  const isExpiredInvite =
    params.error_code === 'otp_expired' ||
    (params.error === 'access_denied' && params.error_code === 'otp_expired') ||
    params.error === 'invite_expired'

  const hint = params.hint ? decodeURIComponent(params.hint) : null

  return (
    <div className="min-h-screen relative overflow-hidden flex" style={{ background: '#090B11' }}>
      {/* ── Ambient blobs ── */}
      <div className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full blur-3xl pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(79,140,255,0.12) 0%, transparent 70%)' }} />
      <div className="absolute -bottom-40 -right-20 w-[400px] h-[400px] rounded-full blur-3xl pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.10) 0%, transparent 70%)' }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] blur-3xl pointer-events-none" style={{ background: 'radial-gradient(ellipse, rgba(79,140,255,0.05) 0%, transparent 70%)' }} />

      {/* ── Left panel (hidden on mobile) ── */}
      <div className="hidden lg:flex lg:w-[480px] xl:w-[520px] flex-col justify-between p-10 relative"
        style={{ background: 'rgba(255,255,255,0.02)', borderRight: '1px solid rgba(255,255,255,0.06)' }}>

        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: 'linear-gradient(135deg, #4F8CFF, #8B5CF6)', boxShadow: '0 4px 16px rgba(79,140,255,0.4)' }}>
            <Zap className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-base font-bold text-white">VendorFlow</p>
            <p className="text-[11px]" style={{ color: '#6B7280' }}>Enterprise Procurement</p>
          </div>
        </div>

        {/* Hero text */}
        <div className="space-y-6">
          <div>
            <h1 className="text-4xl font-bold leading-tight" style={{ color: '#F5F5F5', letterSpacing: '-0.03em' }}>
              Streamline your<br />
              <span style={{ background: 'linear-gradient(135deg, #4F8CFF, #8B5CF6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                procurement workflow
              </span>
            </h1>
            <p className="mt-4 text-base leading-relaxed" style={{ color: '#AEB4C2' }}>
              Enterprise vendor management, RFQs, purchase orders, and analytics — all in one place.
            </p>
          </div>

          {/* Feature bullets */}
          <div className="space-y-3">
            {[
              { icon: Building2, label: 'Vendor Management', desc: 'Manage all your vendors in one place' },
              { icon: TrendingUp,  label: 'Real-time Analytics', desc: 'Live procurement insights and reports' },
              { icon: Shield,      label: 'Enterprise Security', desc: 'Role-based access control' },
            ].map(({ icon: Icon, label, desc }) => (
              <div key={label} className="flex items-start gap-3 rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg" style={{ background: 'rgba(79,140,255,0.15)', border: '1px solid rgba(79,140,255,0.25)' }}>
                  <Icon className="h-4 w-4" style={{ color: '#4F8CFF' }} />
                </div>
                <div>
                  <p className="text-sm font-semibold" style={{ color: '#E5E7EB' }}>{label}</p>
                  <p className="text-xs" style={{ color: '#6B7280' }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-[11px]" style={{ color: '#4B5563' }}>
          © {new Date().getFullYear()} VendorFlow · Enterprise Procurement Platform
        </p>
      </div>

      {/* ── Right panel — form ── */}
      <div className="flex flex-1 flex-col">
        {/* InviteErrorDetector for fragment-based errors */}
        <InviteErrorDetector />

        {/* Back link */}
        <div className="flex items-center justify-between p-6">
          <Link href="/" className="flex items-center gap-1.5 text-xs text-[#6B7280] transition-colors hover:text-[#E5E7EB]">
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to home
          </Link>
          <Link href="/vendor/login" className="text-xs" style={{ color: '#4F8CFF' }}>
            Vendor Portal →
          </Link>
        </div>

        {/* Form container */}
        <div className="flex flex-1 items-center justify-center px-6 py-8">
          <div className="w-full max-w-[400px]">

            {isExpiredInvite ? (
              /* ── Expired invite ── */
              <div className="rounded-2xl p-8 text-center space-y-5" style={{ background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}>
                <div className="flex h-16 w-16 items-center justify-center rounded-full mx-auto" style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)' }}>
                  <XCircle className="h-8 w-8" style={{ color: '#EF4444' }} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Invitation Expired</h2>
                  <p className="mt-2 text-sm" style={{ color: '#AEB4C2' }}>
                    {hint || 'This invite link has expired. Ask your admin to resend it from Settings → Employees.'}
                  </p>
                </div>
                <div className="rounded-xl p-3 text-left flex gap-2.5" style={{ background: 'rgba(250,204,21,0.08)', border: '1px solid rgba(250,204,21,0.2)' }}>
                  <Mail className="h-4 w-4 shrink-0 mt-0.5" style={{ color: '#FACC15' }} />
                  <p className="text-xs" style={{ color: '#fde68a' }}>
                    Invite links expire after 24 hours. Request a new one from your administrator.
                  </p>
                </div>
                <Link href="/company/login" className="block w-full rounded-xl py-2.5 text-sm font-semibold text-center text-white transition-all" style={{ background: 'linear-gradient(135deg, #4F8CFF, #6CA7FF)', boxShadow: '0 4px 16px rgba(79,140,255,0.3)' }}>
                  Go to Sign In
                </Link>
              </div>
            ) : (
              /* ── Normal login form ── */
              <div>
                {/* Mobile logo */}
                <div className="lg:hidden flex items-center gap-3 mb-8">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: 'linear-gradient(135deg, #4F8CFF, #8B5CF6)' }}>
                    <Zap className="h-4 w-4 text-white" />
                  </div>
                  <span className="text-base font-bold text-white">VendorFlow</span>
                </div>

                {/* Heading */}
                <div className="mb-8">
                  <h2 className="text-3xl font-bold" style={{ color: '#F5F5F5', letterSpacing: '-0.025em' }}>Welcome back</h2>
                  <p className="mt-2 text-sm" style={{ color: '#AEB4C2' }}>Sign in to your company workspace</p>
                </div>

                {params.invited === '1' && (
                  <div className="mb-6 rounded-xl p-3.5 flex items-start gap-2.5" style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)' }}>
                    <span className="text-emerald-400 mt-0.5">✓</span>
                    <p className="text-sm" style={{ color: '#4ade80' }}>Invitation accepted! Sign in with your new password.</p>
                  </div>
                )}

                {/* Form card */}
                <div className="rounded-2xl p-8" style={{ background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 8px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)' }}>
                  {/* Top reflection */}
                  <div className="absolute top-0 left-8 right-8 h-px pointer-events-none" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent)' }} />

                  <Suspense>
                    <LoginForm />
                  </Suspense>
                </div>

                <p className="mt-6 text-center text-sm" style={{ color: '#6B7280' }}>
                  Don&apos;t have an account?{' '}
                  <Link href="/signup" style={{ color: '#4F8CFF' }} className="font-medium hover:underline">
                    Create one
                  </Link>
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
