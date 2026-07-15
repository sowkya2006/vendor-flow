'use client'

import { useRouter, usePathname } from 'next/navigation'
import { Bell, Building2, Shield, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ProfileTab } from '@/components/settings/profile-tab'
import { NotificationsTab } from '@/components/settings/notifications-tab'
import { OrganizationTab } from '@/components/settings/organization-tab'
import { SecurityTab } from '@/components/settings/security-tab'
import type { NotificationPrefsValues } from '@/lib/validations/settings'

const TABS = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'organization', label: 'Organization', icon: Building2 },
  { id: 'security', label: 'Security', icon: Shield },
] as const

export type TabId = (typeof TABS)[number]['id']

interface SettingsTabsProps {
  activeTab: TabId
  isAdmin?: boolean
  profile: {
    full_name: string
    email: string
    role: string
    created_at: string
    department?: string | null
    designation?: string | null
  }
  notifPrefs?: Partial<NotificationPrefsValues>
  org?: {
    name?: string
    timezone?: string
    currency?: string
    fiscal_year_start?: number
  }
}

export function SettingsTabs({
  activeTab,
  isAdmin = false,
  profile,
  notifPrefs,
  org,
}: SettingsTabsProps) {
  const router = useRouter()
  const pathname = usePathname()

  function navigate(tab: TabId) {
    router.push(`${pathname}?tab=${tab}`, { scroll: false })
  }

  return (
    <div className="flex gap-8">
      {/* Sidebar nav */}
      <nav className="w-48 shrink-0" aria-label="Settings navigation">
        <ul className="space-y-1" role="list">
          {TABS.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <li key={tab.id}>
                <button
                  onClick={() => navigate(tab.id)}
                  aria-current={isActive ? 'page' : undefined}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-[--color-primary] text-white shadow-sm'
                      : 'text-[--color-foreground-muted] hover:bg-[--color-accent] hover:text-[--color-foreground]',
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                  {tab.label}
                </button>
              </li>
            )
          })}
        </ul>

        {/* Admin-only links — Employees, Roles, Workspace */}
        {isAdmin && (
          <div className="mt-4 border-t border-[--color-border] pt-3">
            <p className="px-3 pb-1 text-[10px] font-bold uppercase tracking-widest text-[--color-foreground-subtle]">Admin</p>
            {[
              { href: '/settings/employees', label: 'Employees' },
              { href: '/settings/roles', label: 'Roles & Permissions' },
              { href: '/settings/workspace', label: 'Workspace' },
            ].map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-[--color-foreground-muted] hover:bg-[--color-accent] hover:text-[--color-foreground] transition-colors"
              >
                {link.label}
              </a>
            ))}
          </div>
        )}
      </nav>

      {/* Content area */}
      <div className="flex-1 min-w-0">
        {activeTab === 'profile' && <ProfileTab profile={profile} />}
        {activeTab === 'notifications' && <NotificationsTab prefs={notifPrefs} />}
        {activeTab === 'organization' && <OrganizationTab org={org} />}
        {activeTab === 'security' && <SecurityTab />}
      </div>
    </div>
  )
}
