'use client'

import React from 'react'
import { Sidebar } from './sidebar'
import { TopNav } from './top-nav'
import { MobileSidebar } from './mobile-sidebar'
import { RoleSwitcher } from './role-switcher'
import { CommandPalette } from './command-palette'
import type { PreviewEmployee } from '@/app/(dashboard)/layout'

interface AppShellProps {
  children: React.ReactNode
  initialRole: string
  realRole: string
  previewRole: string | null
  previewEmployee: PreviewEmployee | null
  workspaceName: string
}

export function AppShell({
  children,
  initialRole,
  realRole,
  previewRole,
  previewEmployee,
  workspaceName,
}: AppShellProps) {
  return (
    <div className="flex h-screen overflow-hidden bg-[--color-background]">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex">
        <Sidebar initialRole={initialRole} workspaceName={workspaceName} />
      </div>

      {/* Mobile Sidebar */}
      <MobileSidebar initialRole={initialRole} workspaceName={workspaceName} />

      {/* Main area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopNav
          previewEmployee={previewEmployee}
          roleSwitcher={
            <RoleSwitcher
              currentPreviewRole={previewRole}
              realRole={realRole}
            />
          }
        />
        <main
          id="main-content"
          className="flex-1 overflow-y-auto"
          style={{ background: 'var(--main-bg, var(--color-background-subtle))' }}
        >
          {/* Preview mode banner */}
          {previewRole && previewRole !== realRole && (
            <div className="sticky top-0 z-10 flex items-center justify-center gap-2 bg-amber-400/95 backdrop-blur-sm px-4 py-2 text-xs font-semibold text-amber-950 dark:bg-amber-600 dark:text-white shadow-sm">
              <span>
                👁 Preview mode — viewing as{' '}
                <strong>{previewRole.replace(/_/g, ' ')}</strong>
                {previewEmployee && (
                  <> · <span className="font-normal opacity-80">{previewEmployee.full_name}</span></>
                )}
              </span>
              <span className="opacity-60 hidden sm:inline">· Your admin session is unchanged</span>
            </div>
          )}
          {children}
        </main>
      </div>

      {/* Global search command palette */}
      <CommandPalette />
    </div>
  )
}
