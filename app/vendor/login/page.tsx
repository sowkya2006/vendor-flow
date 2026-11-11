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
    <div className="min-h-screen bg-[--color-background-subtle] flex flex-col">
      <header className="h-16 flex items-center justify-between px-6 shrink-0 border-b border-[--color-border] bg-[--color-card]">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center size-8 rounded-lg bg-[--color-primary]">
            <Zap className="size-4 text-white" />
          </div>
          <span className="text-base font-bold text-[--color-foreground] tracking-tight">VendorFlow</span>
          <span className="ml-2 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">Vendor Portal</span>
        </div>
        <Link href="/" className="text-xs text-[--color-foreground-muted] hover:text-[--color-foreground] transition-colors">
          ← Back to home
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {isWrongAccount && (
            <div className="mb-4 flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3.5">
              <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-500">Wrong account</p>
                <p className="text-xs text-amber-400/80 mt-0.5">
                  You are currently signed in to a company account. Please sign in with your vendor account below.
                </p>
              </div>
            </div>
          )}
          {usePassword && (
            <div className="mb-4 flex items-start gap-3 rounded-xl border border-blue-500/30 bg-blue-500/10 px-4 py-3.5">
              <Info className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-400">Email link already used</p>
                <p className="text-xs text-blue-400/80 mt-0.5">
                  Your account is confirmed. Sign in with your email and password below.
                </p>
              </div>
            </div>
          )}
          <div className="rounded-2xl bg-[--color-card] border border-[--color-border] shadow-lg px-8 py-10">
            <div className="mb-8 text-center">
              <h1 className="text-2xl font-bold tracking-tight text-[--color-foreground]">
                Vendor Portal Sign In
              </h1>
              <p className="mt-2 text-sm text-[--color-foreground-muted]">
                Sign in to access your vendor account
              </p>
            </div>
            <Suspense>
              <VendorLoginForm />
            </Suspense>
          </div>
          <p className="mt-6 text-center text-sm text-[--color-foreground-muted]">
            New vendor?{' '}
            <Link href="/vendor/register" className="font-medium text-[--color-primary] hover:underline">
              Register your company
            </Link>
          </p>
          <div className="mt-4 rounded-xl border border-[--color-border] bg-[--color-background-subtle] px-4 py-3 text-center">
            <p className="text-xs text-[--color-foreground-muted]">
              💡 <strong>Tip:</strong> To use both portals simultaneously, open the vendor portal in a different browser or incognito window.
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
