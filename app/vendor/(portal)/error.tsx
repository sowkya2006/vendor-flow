'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function VendorPortalError({ error, reset }: ErrorProps) {
  const router = useRouter()

  useEffect(() => {
    console.error('[VendorPortalError]', error)
  }, [error])

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center p-8 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-100 mb-5">
        <AlertTriangle className="h-7 w-7 text-red-500" />
      </div>
      <h1 className="text-lg font-semibold text-[--color-foreground] mb-2">Something went wrong</h1>
      <p className="text-sm text-[--color-foreground-muted] max-w-md mb-6">
        An unexpected error occurred. Your session is still active.
      </p>
      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" onClick={() => reset()} className="gap-1.5">
          <RefreshCw className="h-3.5 w-3.5" />
          Try Again
        </Button>
        <Button size="sm" onClick={() => router.push('/vendor/dashboard')} className="gap-1.5">
          <Home className="h-3.5 w-3.5" />
          Go to Dashboard
        </Button>
      </div>
      {process.env.NODE_ENV === 'development' && error.message && (
        <details className="mt-6 max-w-lg text-left">
          <summary className="text-xs text-[--color-foreground-muted] cursor-pointer">Error details (dev only)</summary>
          <pre className="mt-2 rounded-lg bg-[--color-background-subtle] border border-[--color-border] p-3 text-xs text-red-600 overflow-auto max-h-48">
            {error.message}
          </pre>
        </details>
      )}
    </div>
  )
}
