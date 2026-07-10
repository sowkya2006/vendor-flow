import type { Metadata } from 'next'
import { SignupForm } from '@/components/auth/signup-form'

export const metadata: Metadata = {
  title: 'Create Account',
  description: 'Create your VendorFlow account',
}

export default function SignupPage() {
  return (
    <>
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold tracking-tight text-[--color-foreground]">
          Create your account
        </h1>
        <p className="mt-2 text-sm text-[--color-foreground-muted]">
          Start managing your vendors and procurement
        </p>
      </div>
      <SignupForm />
    </>
  )
}
