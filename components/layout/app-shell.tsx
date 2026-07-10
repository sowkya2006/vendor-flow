'use client'

import React from 'react'
import { Sidebar } from './sidebar'
import { TopNav } from './top-nav'
import { MobileSidebar } from './mobile-sidebar'

interface AppShellProps {
  children: React.ReactNode
}

/**
 * AppShell — the root authenticated layout shell.
 * Renders: sidebar (desktop) | mobile sidebar | top nav | main content area.
 */
export function AppShell({ children }: AppShellProps) {
  return (
    <div className="flex h-screen overflow-hidden bg-[--color-background]">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex">
        <Sidebar />
      </div>

      {/* Mobile Sidebar */}
      <MobileSidebar />

      {/* Main area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopNav />
        <main
          id="main-content"
          className="flex-1 overflow-y-auto bg-[--color-background-subtle]"
        >
          {children}
        </main>
      </div>
    </div>
  )
}
