import type { Metadata } from 'next'
import { ResetPasswordForm } from '@/components/auth/reset-password-form'

export const metadata: Metadata = {
  title: 'Set New Password',
  description: 'Set a new password for your VendorFlow account',
}

export default function ResetPasswordPage() {
  return (
    <>
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold tracking-tight text-[--color-foreground]">
          Set new password
        </h1>
        <p className="mt-2 text-sm text-[--color-foreground-muted]">
          Choose a strong password for your account
        </p>
      </div>
      <ResetPasswordForm />
    </>
  )
}
