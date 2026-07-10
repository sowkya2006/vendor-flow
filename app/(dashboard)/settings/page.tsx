import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { Settings } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { WorkspaceHeader } from '@/components/layout/workspace-header'
import { PageContainer } from '@/components/shared/page-container'
import { SettingsTabs } from '@/components/settings/settings-tabs'
import type { TabId } from '@/components/settings/settings-tabs'

export const metadata: Metadata = { title: 'Settings — VendorFlow' }

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = (await createClient()) as any
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Fetch profile row
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, email, role, created_at')
    .eq('id', user.id)
    .single() as { data: { full_name: string; email: string; role: string; created_at: string } | null }

  // Fetch notification preferences (may not exist yet — that's fine)
  const { data: notifPrefs } = await supabase
    .from('notification_preferences')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle() as { data: Record<string, boolean> | null }

  // Fetch company/org settings via the user's company_id
  const companyId: string | undefined =
    (user.user_metadata?.company_id as string | undefined) ??
    (await (async () => {
      const { data } = await supabase
        .from('users')
        .select('company_id')
        .eq('id', user.id)
        .single()
      return data?.company_id as string | undefined
    })())

  const { data: company } = companyId
    ? (await supabase
        .from('companies')
        .select('name, timezone, currency, fiscal_year_start')
        .eq('id', companyId)
        .maybeSingle()) as {
        data: {
          name?: string
          timezone?: string
          currency?: string
          fiscal_year_start?: number
        } | null
      }
    : { data: null }

  const resolvedParams = await searchParams
  const activeTab = (resolvedParams?.tab as TabId | undefined) ?? 'profile'

  return (
    <div className="min-h-full">
      <WorkspaceHeader
        title="Settings"
        description="Manage your account and workspace preferences"
        actions={<Settings className="h-5 w-5 text-[--color-foreground-muted]" />}
      />
      <PageContainer>
        <SettingsTabs
          activeTab={activeTab}
          profile={{
            full_name: profile?.full_name ?? '',
            email: profile?.email ?? user.email ?? '',
            role: profile?.role ?? 'viewer',
            created_at: profile?.created_at ?? user.created_at,
          }}
          notifPrefs={notifPrefs ?? undefined}
          org={company ?? undefined}
        />
      </PageContainer>
    </div>
  )
}
