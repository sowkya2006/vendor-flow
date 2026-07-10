import type { Metadata } from 'next'
import { Suspense } from 'react'
import { VendorLoginForm } from '@/components/vendor-portal/vendor-login-form'

export const metadata: Metadata = { title: 'Vendor Login' }

export default function VendorLoginPage() {
  return (
    <div className="min-h-screen bg-[--color-background-subtle] flex flex-col">
      <header className="h-16 flex items-center px-6 shrink-0 border-b border-[--color-border] bg-[--color-card]">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center size-8 rounded-lg bg-[--color-primary]">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M3 4h10M3 8h7M3 12h4" stroke="white" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
          <span className="text-base font-bold text-[--color-foreground] tracking-tight">VendorFlow</span>
          <span className="ml-2 rounded-full bg-[--color-primary]/10 px-2 py-0.5 text-xs font-semibold text-[--color-primary]">Vendor Portal</span>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="rounded-2xl bg-[--color-card] border border-[--color-border] shadow-lg px-8 py-10">
            <div className="mb-8 text-center">
              <h1 className="text-2xl font-bold tracking-tight text-[--color-foreground]">Vendor Portal Sign In</h1>
              <p className="mt-2 text-sm text-[--color-foreground-muted]">
                Sign in to access your vendor account
              </p>
            </div>
            <Suspense>
              <VendorLoginForm />
            </Suspense>
          </div>
        </div>
      </main>
    </div>
  )
}
