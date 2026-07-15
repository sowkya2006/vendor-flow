import type { Metadata } from 'next'
import Link from 'next/link'
import { Zap, XCircle } from 'lucide-react'
import { getInvitationByToken } from '@/lib/supabase/roles'
import { AcceptInviteForm } from '@/components/auth/accept-invite-form'

export const metadata: Metadata = { title: 'Accept Invitation — VendorFlow' }

interface PageProps {
  params: Promise<{ token: string }>
}

export default async function AcceptInvitePage({ params }: PageProps) {
  const { token } = await params
  const invitation = await getInvitationByToken(token)

  return (
    <div className="min-h-screen bg-[--color-background-subtle] flex flex-col">
      {/* Header */}
      <header className="h-16 flex items-center px-6 shrink-0 border-b border-[--color-border] bg-[--color-card]">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex items-center justify-center size-8 rounded-lg bg-[--color-primary]">
            <Zap className="size-4 text-white" />
          </div>
          <span className="text-base font-bold text-[--color-foreground] tracking-tight">
            VendorFlow
          </span>
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="rounded-2xl bg-[--color-card] border border-[--color-border] shadow-lg px-8 py-10">
            {!invitation ? (
              /* Invalid / expired */
              <div className="text-center space-y-5">
                <div className="flex justify-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400">
                    <XCircle className="h-8 w-8" />
                  </div>
                </div>
                <div className="space-y-2">
                  <h1 className="text-xl font-bold text-[--color-foreground]">
                    Invalid or Expired Invitation
                  </h1>
                  <p className="text-sm text-[--color-foreground-muted]">
                    This invitation link is invalid or has already expired.
                    Ask your administrator to send a new one.
                  </p>
                </div>
                <Link
                  href="/company/login"
                  className="inline-block text-sm font-medium text-[--color-primary] hover:underline"
                >
                  Go to Company Login
                </Link>
              </div>
            ) : (
              /* Valid invitation */
              <>
                <div className="mb-8 text-center">
                  <div className="mb-3 flex justify-center">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-[--color-primary]/30 bg-[--color-primary]/10 px-3 py-1 text-xs font-semibold text-[--color-primary]">
                      <span className="h-1.5 w-1.5 rounded-full bg-[--color-primary]" />
                      You&apos;ve been invited
                    </span>
                  </div>
                  <h1 className="text-2xl font-bold tracking-tight text-[--color-foreground]">
                    Create your account
                  </h1>
                  <p className="mt-2 text-sm text-[--color-foreground-muted]">
                    {invitation.full_name
                      ? `Hi ${invitation.full_name}, you've been invited to join as `
                      : "You've been invited to join as "}
                    <span className="font-semibold text-[--color-foreground]">
                      {invitation.role_slug.replace(/_/g, ' ')}
                    </span>
                    .
                  </p>
                </div>

                <AcceptInviteForm
                  token={token}
                  email={invitation.email}
                  fullName={invitation.full_name ?? undefined}
                />

                <p className="mt-5 text-center text-xs text-[--color-foreground-subtle]">
                  Already have an account?{' '}
                  <Link
                    href="/company/login"
                    className="text-[--color-primary] hover:underline"
                  >
                    Sign in
                  </Link>
                </p>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
