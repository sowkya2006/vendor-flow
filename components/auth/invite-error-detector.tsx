'use client'

/**
 * InviteErrorDetector
 *
 * Reads the URL fragment (#...) for Supabase auth tokens/errors.
 * Fragments are browser-only — they never reach the server.
 *
 * Handles two cases:
 *
 * 1. Valid invite/recovery tokens in hash
 *    e.g. #access_token=...&type=invite
 *    → Redirect to /auth/confirm which handles the implicit flow
 *
 * 2. Error tokens (expired/invalid links)
 *    e.g. #error_code=otp_expired
 *    → Redirect to /invite/expired
 */
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export function InviteErrorDetector() {
  const router = useRouter()

  useEffect(() => {
    const hash = window.location.hash
    if (!hash || hash === '#') return

    const params = new URLSearchParams(hash.replace('#', ''))

    const errorCode    = params.get('error_code')
    const error        = params.get('error')
    const accessToken  = params.get('access_token')
    const refreshToken = params.get('refresh_token')
    const type         = params.get('type')

    // Case 1: Error in hash — expired or invalid link
    if (errorCode === 'otp_expired' || error === 'access_denied') {
      router.replace('/invite/expired')
      return
    }

    // Case 2: Valid tokens in hash — this is an implicit flow callback
    // (invite, recovery, signup confirmation)
    // Redirect to /auth/confirm which knows how to handle hash tokens
    if (accessToken && refreshToken) {
      // Preserve the full hash so /auth/confirm can parse the tokens
      router.replace(`/auth/confirm${hash}`)
      return
    }

    // Case 3: type=invite but no tokens — unusual, send to expired
    if (type === 'invite' && !accessToken) {
      router.replace('/invite/expired')
    }
  }, [router])

  return null
}
