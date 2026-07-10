import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { Building2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getCompanyId } from '@/lib/supabase/get-company-id'
import { WorkspaceSettingsForm } from '@/components/settings/workspace-settings-form'

export const metadata: Metadata = { title: 'Workspace Settings' }

export default async function WorkspaceSettingsPage() {
  const companyId = await getCompanyId()
  const supabase = await createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: company } = await (supabase as any)
    .from('companies')
    .select('id, name, workspace_name, industry, gst_number, phone, address, timezone')
    .eq('id', companyId)
    .single()

  if (!company) redirect('/workspace/setup')

  return (
    <div className="p-6 max-w-2xl space-y-5">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[--color-primary]/10 text-[--color-primary]">
          <Building2 className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-[--color-foreground]">Workspace Settings</h1>
          <p className="text-xs text-[--color-foreground-muted]">Manage your company profile</p>
        </div>
      </div>

      <div className="rounded-xl border border-[--color-border] bg-[--color-card] p-5 shadow-[--shadow-sm]">
        <WorkspaceSettingsForm
          defaultValues={{
            company_name: (company as { name: string }).name,
            workspace_name: (company as { workspace_name: string | null }).workspace_name ?? '',
            industry: (company as { industry: string | null }).industry ?? '',
            gst_number: (company as { gst_number: string | null }).gst_number ?? '',
            phone: (company as { phone: string | null }).phone ?? '',
            address: (company as { address: string | null }).address ?? '',
            timezone: (company as { timezone: string | null }).timezone ?? 'Asia/Kolkata',
          }}
        />
      </div>
    </div>
  )
}
