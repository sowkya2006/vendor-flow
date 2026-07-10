'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { TriangleAlert as AlertTriangle, RefreshCw, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function PRDetailError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error('[PRDetail] Unhandled error:', error)
  }, [error])

  return (
    <div className="min-h-full flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[--color-error-bg] text-[--color-error]">
            <AlertTriangle className="h-8 w-8" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-xl font-bold text-[--color-foreground]">
            Failed to load request
          </h1>
          <p className="text-sm text-[--color-foreground-muted]">
            An error occurred while loading this purchase request. The record may
            have been deleted or you may not have permission to view it.
          </p>
          {error.digest && (
            <p className="font-mono text-xs text-[--color-foreground-subtle]">
              Error ID: {error.digest}
            </p>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button variant="outline" onClick={reset} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Try again
          </Button>
          <Button asChild variant="outline">
            <Link href="/procurement" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Purchase Requests
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
