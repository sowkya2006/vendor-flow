import { Suspense } from 'react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { Zap, ArrowLeft } from 'lucide-react'
import { LoginForm } from '@/components/auth/login-form'

export const metadata: Metadata = {
  title: 'Company Portal — Sign In',
  description: 'Sign in to your VendorFlow company portal',
}

export default function CompanyLoginPage() {
  return (
    <div className="min-h-screen bg-[--color-background-subtle] flex flex-col">
      {/* Header */}
      <header className="h-16 flex items-center justify-between px-6 shrink-0 border-b border-[--color-border]">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex items-center justify-center size-8 rounded-lg bg-[--color-primary]">
            <Zap className="size-4 text-white" />
          </div>
          <span className="text-base font-bold text-[--color-foreground] tracking-tight">
            VendorFlow
          </span>
        </Link>
        <Link
          href="/"
          className="flex items-center gap-1.5 text-xs text-[--color-foreground-muted] hover:text-[--color-foreground] transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to portal selection
        </Link>
      </header>

      {/* Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="rounded-2xl bg-[--color-card] border border-[--color-border] shadow-lg px-8 py-10">
            {/* Badge */}
            <div className="mb-6 flex justify-center">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[--color-primary]/30 bg-[--color-primary]/10 px-3 py-1 text-xs font-semibold text-[--color-primary]">
                <span className="h-1.5 w-1.5 rounded-full bg-[--color-primary]" />
                Company Portal
              </span>
            </div>

            <div className="mb-8 text-center">
              <h1 className="text-2xl font-bold tracking-tight text-[--color-foreground]">
                Welcome back
              </h1>
              <p className="mt-2 text-sm text-[--color-foreground-muted]">
                Sign in to your company workspace
              </p>
            </div>

            <Suspense>
              <LoginForm />
            </Suspense>
          </div>

          <p className="mt-6 text-center text-xs text-[--color-foreground-subtle]">
            Looking for the vendor portal?{' '}
            <Link href="/vendor/login" className="text-[--color-foreground-muted] underline hover:text-[--color-foreground]">
              Sign in here
            </Link>
          </p>
        </div>
      </main>
    </div>
  )
}
