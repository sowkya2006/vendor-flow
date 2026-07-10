import { Suspense } from 'react'
import type { Metadata } from 'next'
import { LoginForm } from '@/components/auth/login-form'

export const metadata: Metadata = {
  title: 'Sign In',
  description: 'Sign in to your VendorFlow account',
}

export default function LoginPage() {
  return (
    <>
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold tracking-tight text-[--color-foreground]">
          Welcome back
        </h1>
        <p className="mt-2 text-sm text-[--color-foreground-muted]">
          Sign in to continue to VendorFlow
        </p>
      </div>
      <Suspense>
        <LoginForm />
      </Suspense>
    </>
  )
}
