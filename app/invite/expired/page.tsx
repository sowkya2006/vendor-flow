import Link from 'next/link'
import { XCircle, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function InviteExpiredPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[--color-background-subtle] px-4">
      <div className="rounded-2xl border border-[--color-border] bg-[--color-card] shadow-lg px-10 py-12 w-full max-w-md text-center space-y-5">
        <div className="flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <XCircle className="h-8 w-8 text-red-500" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-xl font-semibold text-[--color-foreground]">
            Invitation Link Expired
          </h1>
          <p className="text-sm text-[--color-foreground-muted] leading-relaxed">
            This invitation link has expired or has already been used.
            Invitation links are valid for <strong>24 hours</strong>.
          </p>
        </div>

        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 text-left space-y-1">
          <p className="font-medium flex items-center gap-2">
            <Mail className="h-4 w-4 shrink-0" />
            What to do next
          </p>
          <p className="text-xs text-amber-700">
            Ask your Administrator to send you a new invitation from
            <strong> Settings → Employees → Invite Employee</strong>.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <Button asChild>
            <Link href="/company/login">Sign in if you already have an account</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/">Back to Home</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
