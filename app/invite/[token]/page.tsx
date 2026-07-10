import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Zap, XCircle } from 'lucide-react'
import { getInvitationByToken } from '@/lib/supabase/roles'
import { AcceptInviteForm } from '@/components/auth/accept-invite-form'

export const metadata: Metadata = { title: 'Accept Invitation — VendorFlow' }

interface PageProps { params: Promise<{ token: string }> }

export default async function AcceptInvitePage({ params }: PageProps) {
  const { token } = await params
  const invitation = await getInvitationByToken(token)

  return (
    <div className="min-h-screen bg-[--color-background-subtle] flex flex-col">
      <header className="h-16 flex items-center px-6 shrink-0 border-b border-[--color-border]">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex items-center justify-center size-8 rounded-lg bg-[--color-primary]">
            <Zap className="size-4 text-white" />
          </div>
          <span className="text-base font-bold text-[--color-foreground] tracking-tight">VendorFlow</span>
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="rounded-2xl bg-[--color-card] border border-[--color-border] shadow-lg px-8 py-10">
            {!invitation ? (
              <div className="text-center space-y-4">
                <div className="flex justify-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-red-600">
                    <XCircle className="h-8 w-8" />
                  </div>
                </div>
                <h1 className="text-xl font-bold text-[--color-foreground]">Invalid or Expired Invitation</h1>
                <p className="text-sm text-[--color-foreground-muted]">
                  This invitation link is invalid or has expired. Please ask your administrator to send a new invitation.
                </p>
                <Link
                  href="/company/login"
                  className="inline-block text-sm text-[--color-primary] hover:underline"
                >
                  Go to Company Login
                </Link>
              </div>
            ) : (
              <>
                <div className="mb-8 text-center">
                  <h1 className="text-2xl font-bold tracking-tight text-[--color-foreground]">
                    You've been invited!
                  </h1>
                  <p className="mt-2 text-sm text-[--color-foreground-muted]">
                    {invitation.full_name
                      ? `Hi ${invitation.full_name}, you've been invited to join VendorFlow as `
                      : "You've been invited to join VendorFlow as "}
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
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
