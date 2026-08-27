import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { Zap } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { WorkspaceSetupWizard } from '@/components/workspace/workspace-setup-wizard'

export const metadata: Metadata = { title: 'Set Up Your Workspace — VendorFlow' }

export default async function WorkspaceSetupPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/company/login')

  // Use admin client to bypass RLS — new admins may not yet have
  // their RLS policies fully evaluated for their own row
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const adminDb = (await import('@/lib/supabase/admin')).createAdminClient() as any

  const { data: userRow } = await adminDb
    .from('users')
    .select('company_id, role')
    .eq('id', user.id)
    .maybeSingle()

  const companyId = (userRow as { company_id: string; role: string } | null)?.company_id
  const role      = (userRow as { company_id: string; role: string } | null)?.role ?? 'viewer'

  // Only admins can set up the workspace.
  const isAdmin = role === 'administrator' || role === 'admin'
  if (!isAdmin) redirect('/dashboard')

  if (companyId) {
    const { data: company } = await adminDb
      .from('companies')
      .select('setup_complete')
      .eq('id', companyId)
      .maybeSingle()
    if ((company as { setup_complete: boolean } | null)?.setup_complete) {
      redirect('/dashboard')
    }
  }

  return (
    <div className="min-h-screen bg-[--color-background-subtle] flex flex-col">
      <header className="h-16 flex items-center px-6 shrink-0 border-b border-[--color-border]">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center size-8 rounded-lg bg-[--color-primary]">
            <Zap className="size-4 text-white" />
          </div>
          <span className="text-base font-bold text-[--color-foreground] tracking-tight">VendorFlow</span>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-lg">
          <div className="rounded-2xl bg-[--color-card] border border-[--color-border] shadow-lg px-8 py-10">
            <div className="mb-8 text-center">
              <h1 className="text-2xl font-bold tracking-tight text-[--color-foreground]">
                Set Up Your Workspace
              </h1>
              <p className="mt-2 text-sm text-[--color-foreground-muted]">
                Tell us about your company to personalize your VendorFlow experience.
              </p>
            </div>
            <WorkspaceSetupWizard />
          </div>
        </div>
      </main>
    </div>
  )
}
