'use client'

import { useEffect } from 'react'
import type { UserRole } from '@/types'
import { useAuth } from './auth-provider'
import { useWorkspaceStore } from '@/store/workspace-store'
import { createClient } from '@/lib/supabase/client'

/**
 * AuthSync — runs once inside the dashboard shell.
 * Keeps the Zustand workspace store in sync with the live
 * Supabase session so TopNav, Sidebar and other components
 * always display the real authenticated user's role and data.
 */
export function AuthSync() {
  const { user } = useAuth()
  const { setCurrentUser, setCurrentWorkspace } = useWorkspaceStore()

  useEffect(() => {
    if (!user) {
      setCurrentUser(null)
      return
    }

    async function syncFromDb() {
      const supabase = createClient()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase as any)
        .from('users')
        .select('role, company_id, full_name, phone, department, designation, status')
        .eq('id', user!.id)
        .single()

      const dbUser = data as {
        role: string; company_id: string; full_name: string | null
        phone: string | null; department: string | null
        designation: string | null; status: string
      } | null

      if (dbUser?.company_id) {
        // Also sync workspace name
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: company } = await (supabase as any)
          .from('companies')
          .select('id, name, workspace_name')
          .eq('id', dbUser.company_id)
          .single()

        const co = company as { id: string; name: string; workspace_name: string | null } | null
        if (co) {
          setCurrentWorkspace({
            id: co.id,
            name: co.workspace_name ?? (co.name && !co.name.includes('@') ? co.name : 'My Workspace'),
            slug: co.id,
            plan: 'growth',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          })
        }
      }

      setCurrentUser({
        id: user!.id,
        name: (dbUser?.full_name && dbUser.full_name !== 'User')
          ? dbUser.full_name
          : (user!.user_metadata?.full_name ?? user!.email?.split('@')[0] ?? 'User'),
        email: user!.email ?? '',
        avatar: user!.user_metadata?.avatar_url ?? undefined,
        role: (dbUser?.role ?? 'member') as UserRole,
        workspaceId: dbUser?.company_id ?? '',
        department: dbUser?.department ?? null,
        designation: dbUser?.designation ?? null,
        createdAt: user!.created_at,
        updatedAt: user!.updated_at ?? user!.created_at,
      })
    }

    syncFromDb()
  }, [user, setCurrentUser, setCurrentWorkspace])

  return null
}
