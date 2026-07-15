import type { Metadata } from 'next'
import { Suspense } from 'react'
import { ResetPasswordForm } from '@/components/auth/reset-password-form'

export const metadata: Metadata = {
  title: 'Set Password — VendorFlow',
}

interface PageProps {
  searchParams: Promise<{ invited?: string }>
}

export default async function ResetPasswordPage({ searchParams }: PageProps) {
  const params = await searchParams
  const isInvited = params.invited === '1'

  return (
    <>
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold tracking-tight text-[--color-foreground]">
          {isInvited ? 'Set your password' : 'Set new password'}
        </h1>
        <p className="mt-2 text-sm text-[--color-foreground-muted]">
          {isInvited
            ? 'Create a password to complete your account setup'
            : 'Choose a strong password for your account'}
        </p>
      </div>
      <Suspense>
        <ResetPasswordForm isInvited={isInvited} />
      </Suspense>
    </>
  )
}
