import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Workspace, User } from '@/types'

interface WorkspaceState {
  currentWorkspace: Workspace | null
  currentUser: User | null
  setCurrentWorkspace: (workspace: Workspace | null) => void
  setCurrentUser: (user: User | null) => void
  clearSession: () => void
}

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set) => ({
      currentWorkspace: null,
      currentUser: null,
      setCurrentWorkspace: (workspace) => set({ currentWorkspace: workspace }),
      setCurrentUser: (user) => set({ currentUser: user }),
      clearSession: () => set({ currentWorkspace: null, currentUser: null }),
    }),
    {
      name: 'vendorflow-workspace-v2',   // v2 = forces all browsers to start fresh
      partialize: (state) => ({
        currentWorkspace: state.currentWorkspace
          ? {
              id: state.currentWorkspace.id,
              name: state.currentWorkspace.name,
              slug: state.currentWorkspace.slug,
              plan: state.currentWorkspace.plan,
              createdAt: state.currentWorkspace.createdAt,
              updatedAt: state.currentWorkspace.updatedAt,
            }
          : null,
        // NEVER persist the user — role must always come from the database
        currentUser: null,
      }),
    },
  ),
)
