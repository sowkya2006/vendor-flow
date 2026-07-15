import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { Settings } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getEffectiveProfile, getUserRole } from '@/lib/supabase/get-auth'
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
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/company/login')

  // Use preview-aware profile — shows the previewed employee's profile in preview mode
  let effectiveProfile
  try {
    effectiveProfile = await getEffectiveProfile()
  } catch {
    redirect('/company/login')
  }

  const role = await getUserRole()
  const isAdmin = role === 'administrator' || role === 'admin'

  // Fetch notification preferences for the effective user
  const { data: notifPrefs } = await supabase
    .from('notification_preferences')
    .select('*')
    .eq('user_id', effectiveProfile.id)
    .maybeSingle() as { data: Record<string, boolean> | null }

  // Fetch company info
  const { data: company } = effectiveProfile.company_id
    ? (await supabase
        .from('companies')
        .select('name, timezone, workspace_name')
        .eq('id', effectiveProfile.company_id)
        .maybeSingle()) as {
        data: { name?: string; timezone?: string; workspace_name?: string } | null
      }
    : { data: null }

  const resolvedParams = await searchParams
  const activeTab = (resolvedParams?.tab as TabId | undefined) ?? 'profile'

  return (
    <div className="min-h-full">
      <WorkspaceHeader
        title="Settings"
        description={effectiveProfile.isPreview
          ? `Viewing as ${effectiveProfile.full_name ?? effectiveProfile.email ?? role}`
          : 'Manage your account and workspace preferences'
        }
        actions={<Settings className="h-5 w-5 text-[--color-foreground-muted]" />}
      />
      <PageContainer>
        <SettingsTabs
          activeTab={activeTab}
          isAdmin={isAdmin}
          profile={{
            full_name: effectiveProfile.full_name ?? '',
            email: effectiveProfile.email ?? user.email ?? '',
            role: effectiveProfile.role,
            created_at: user.created_at,
            department: effectiveProfile.department,
            designation: effectiveProfile.designation,
          }}
          notifPrefs={notifPrefs ?? undefined}
          org={
            company
              ? {
                  name: company.name ?? '',
                  timezone: company.timezone,
                  currency: undefined,
                  fiscal_year_start: undefined,
                }
              : undefined
          }
        />
      </PageContainer>
    </div>
  )
}
