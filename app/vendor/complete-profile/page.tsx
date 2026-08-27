import type { Metadata } from 'next'
import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Zap } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { VendorCompleteProfileForm } from '@/components/vendor-portal/vendor-complete-profile-form'

export const metadata: Metadata = { title: 'Complete Your Profile — VendorFlow Vendor Portal' }

export default async function VendorCompleteProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Must be logged in
  if (!user) {
    redirect('/vendor/login')
  }

  // Must be a vendor user
  if (!user.user_metadata?.is_vendor) {
    redirect('/company/login')
  }

  // If vendor_companies already exists, they're already set up — go to dashboard
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const adminDb = createAdminClient() as any
  const { data: existing } = await adminDb
    .from('vendor_companies')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (existing) {
    redirect('/vendor/dashboard')
  }

  return (
    <div className="min-h-screen bg-[--color-background-subtle] flex flex-col">
      <header className="h-16 flex items-center justify-between px-6 shrink-0 border-b border-[--color-border] bg-[--color-card]">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center size-8 rounded-lg bg-[--color-primary]">
            <Zap className="size-4 text-white" />
          </div>
          <span className="text-base font-bold text-[--color-foreground] tracking-tight">VendorFlow</span>
          <span className="ml-2 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">Vendor Portal</span>
        </div>
        <Link href="/" className="text-xs text-[--color-foreground-muted] hover:text-[--color-foreground]">
          ← Back to home
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-xl">
          <div className="mb-8 text-center">
            <div className="mb-3 flex justify-center">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300/40 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-500">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Email Verified ✓
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-[--color-foreground]">
              Complete Your Vendor Profile
            </h1>
            <p className="mt-2 text-sm text-[--color-foreground-muted]">
              Tell us about your company to start connecting with procurement teams
            </p>
          </div>

          <div className="rounded-2xl bg-[--color-card] border border-[--color-border] shadow-lg px-8 py-8">
            <Suspense>
              <VendorCompleteProfileForm userEmail={user.email ?? ''} userId={user.id} />
            </Suspense>
          </div>
        </div>
      </main>
    </div>
  )
}
