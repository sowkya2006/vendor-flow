import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Workspace, User } from '@/types'

interface WorkspaceState {
  currentWorkspace: Workspace | null
  currentUser: User | null
  setCurrentWorkspace: (workspace: Workspace | null) => void
  setCurrentUser: (user: User | null) => void
}

// Placeholder data for Stage 1 — replaced by real auth in Stage 2
const PLACEHOLDER_WORKSPACE: Workspace = {
  id: 'ws-1',
  name: 'Acme Corp',
  slug: 'acme-corp',
  plan: 'growth',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}

const PLACEHOLDER_USER: User = {
  id: 'user-1',
  name: 'Alex Johnson',
  email: 'alex@acme.com',
  role: 'admin',
  workspaceId: 'ws-1',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set) => ({
      currentWorkspace: PLACEHOLDER_WORKSPACE,
      currentUser: PLACEHOLDER_USER,
      setCurrentWorkspace: (workspace) => set({ currentWorkspace: workspace }),
      setCurrentUser: (user) => set({ currentUser: user }),
    }),
    {
      name: 'vendorflow-workspace',
    }
  )
)
