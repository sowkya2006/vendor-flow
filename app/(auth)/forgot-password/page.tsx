import type { Metadata } from 'next'
import { ForgotPasswordForm } from '@/components/auth/forgot-password-form'

export const metadata: Metadata = {
  title: 'Reset Password',
  description: 'Reset your VendorFlow password',
}

export default function ForgotPasswordPage() {
  return (
    <>
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold tracking-tight text-[--color-foreground]">
          Forgot your password?
        </h1>
        <p className="mt-2 text-sm text-[--color-foreground-muted]">
          Enter your email and we&apos;ll send you a reset link
        </p>
      </div>
      <ForgotPasswordForm />
    </>
  )
}
