import type { Metadata } from 'next'
import Link from 'next/link'
import { ShieldX, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = { title: '403 — Access Denied' }

export default function AccessDeniedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[--color-background-subtle] px-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="flex justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400">
            <ShieldX className="h-10 w-10" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-[--color-foreground]">Access Denied</h1>
          <p className="text-[--color-foreground-muted]">
            You don't have permission to access this page. Contact your administrator if you need access.
          </p>
        </div>

        <div className="rounded-xl border border-[--color-border] bg-[--color-card] px-5 py-4 text-sm text-[--color-foreground-muted]">
          Your current role does not include access to this module.
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button variant="outline" asChild>
            <Link href="/dashboard">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
