'use client'

/**
 * InviteErrorDetector — reads URL fragment for Supabase auth errors.
 * Fragments (#...) are browser-only and never reach the server.
 * This component detects otp_expired in the fragment and redirects
 * to the proper expired-invite page.
 */
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export function InviteErrorDetector() {
  const router = useRouter()

  useEffect(() => {
    const hash = window.location.hash
    if (!hash) return

    const params = new URLSearchParams(hash.replace('#', ''))
    const errorCode = params.get('error_code')
    const error = params.get('error')

    if (errorCode === 'otp_expired' || error === 'access_denied') {
      // Clear the hash and redirect to the proper expired page
      router.replace('/invite/expired')
    }
  }, [router])

  return null
}
