import { Suspense } from 'react'
import type { Metadata } from 'next'
import { VerifyEmail } from '@/components/auth/verify-email'

export const metadata: Metadata = {
  title: 'Verify Email',
  description: 'Verify your email to activate your VendorFlow account',
}

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmail />
    </Suspense>
  )
}
