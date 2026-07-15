import type { Metadata } from 'next'
import { Suspense } from 'react'
import Link from 'next/link'
import { Zap } from 'lucide-react'
import { VendorSignupForm } from '@/components/vendor-portal/vendor-signup-form'

export const metadata: Metadata = { title: 'Register as Vendor — VendorFlow' }

export default function VendorRegisterPage() {
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
        <Link href="/vendor/login" className="text-xs text-[--color-foreground-muted] hover:text-[--color-foreground]">
          Already have an account? Sign in
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-xl">
          <div className="rounded-2xl bg-[--color-card] border border-[--color-border] shadow-lg px-8 py-10">
            <div className="mb-8 text-center">
              <div className="mb-3 flex justify-center">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Vendor Self-Registration
                </span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-[--color-foreground]">
                Register Your Company
              </h1>
              <p className="mt-2 text-sm text-[--color-foreground-muted]">
                Create your vendor profile and connect with procurement companies
              </p>
            </div>
            <Suspense>
              <VendorSignupForm />
            </Suspense>
          </div>
        </div>
      </main>
    </div>
  )
}
