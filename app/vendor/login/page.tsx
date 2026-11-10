import type { Metadata } from 'next'
import { Suspense } from 'react'
import Link from 'next/link'
import { Zap, AlertTriangle, Info } from 'lucide-react'
import { VendorLoginForm } from '@/components/vendor-portal/vendor-login-form'

export const metadata: Metadata = { title: 'Vendor Portal — Sign In' }

interface PageProps {
  searchParams: Promise<{ error?: string; hint?: string }>
}

export default async function VendorLoginPage({ searchParams }: PageProps) {
  const params = await searchParams
  const isWrongAccount = params.error === 'wrong_account'
  const usePassword = params.hint === 'use_password'

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: 'radial-gradient(ellipse at 20% 15%, rgba(139,159,232,0.13) 0%, transparent 50%), radial-gradient(ellipse at 80% 85%, rgba(201,168,76,0.08) 0%, transparent 50%), #080C18' }}
    >
      <header
        className="h-16 flex items-center justify-between px-6 shrink-0 border-b"
        style={{ borderColor: 'rgba(139,159,232,0.15)', background: 'rgba(8,12,24,0.8)', backdropFilter: 'blur(12px)' }}
      >
        <div className="flex items-center gap-2">
          <div
            className="flex items-center justify-center size-8 rounded-lg"
            style={{ background: 'linear-gradient(135deg, #8B9FE8, #C9A84C)', boxShadow: '0 2px 12px rgba(139,159,232,0.5)' }}
          >
            <Zap className="size-4 text-white" />
          </div>
          <span className="text-base font-bold text-white tracking-tight">VendorFlow</span>
          <span
            className="ml-2 rounded-full px-2 py-0.5 text-xs font-semibold"
            style={{ background: 'rgba(52,211,153,0.15)', color: '#6EDEB8', border: '1px solid rgba(52,211,153,0.3)' }}
          >
            Vendor Portal
          </span>
        </div>
        <Link href="/" className="text-xs hover:text-white transition-colors" style={{ color: '#8B96B4' }}>
          ← Back to home
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {isWrongAccount && (
            <div className="mb-4 flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3.5">
              <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-400">Wrong account</p>
                <p className="text-xs text-amber-400/80 mt-0.5">You are currently signed in to a company account. Please sign in with your vendor account below.</p>
              </div>
            </div>
          )}
          {usePassword && (
            <div className="mb-4 flex items-start gap-3 rounded-xl border border-[rgba(139,159,232,0.3)] bg-[rgba(139,159,232,0.08)] px-4 py-3.5">
              <Info className="h-4 w-4 shrink-0 mt-0.5" style={{ color: '#A5B6F0' }} />
              <div>
                <p className="text-sm font-medium" style={{ color: '#A5B6F0' }}>Email link already used</p>
                <p className="text-xs mt-0.5" style={{ color: '#8B96B4' }}>Your account is confirmed. Sign in with your email and password below.</p>
              </div>
            </div>
          )}
          <div
            className="rounded-2xl px-8 py-10"
            style={{
              background: 'rgba(10,15,38,0.85)',
              border: '1px solid rgba(139,159,232,0.25)',
              boxShadow: '0 8px 40px rgba(0,0,0,0.6), inset 0 1px 0 rgba(139,159,232,0.1)',
              backdropFilter: 'blur(20px)',
            }}
          >
            <div className="mb-8 text-center">
              <h1 className="text-2xl font-bold tracking-tight text-white">Vendor Portal Sign In</h1>
              <p className="mt-2 text-sm" style={{ color: '#D4DAEB' }}>Sign in to access your vendor account</p>
            </div>
            <Suspense>
              <VendorLoginForm />
            </Suspense>
          </div>
          <p className="mt-6 text-center text-sm" style={{ color: '#8B96B4' }}>
            New vendor?{' '}
            <Link href="/vendor/register" className="font-medium hover:underline" style={{ color: '#A5B6F0' }}>
              Register your company
            </Link>
          </p>
          <div
            className="mt-4 rounded-xl px-4 py-3 text-center"
            style={{ background: 'rgba(139,159,232,0.06)', border: '1px solid rgba(139,159,232,0.18)' }}
          >
            <p className="text-xs" style={{ color: '#8B96B4' }}>
              💡 <strong style={{ color: '#D4DAEB' }}>Tip:</strong> To use both portals simultaneously, open the vendor portal in a different browser or incognito window.
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
