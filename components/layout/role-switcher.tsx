'use client'

import { useTransition } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Eye, ChevronDown } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { setPreviewRoleAction, clearPreviewRoleAction } from '@/app/actions/role-preview'
import { ROLE_LABELS } from '@/config/nav-roles'
import { cn } from '@/lib/utils'

const PREVIEWABLE_ROLES = [
  { slug: 'administrator',       label: 'Administrator' },
  { slug: 'procurement_manager', label: 'Procurement Manager' },
  { slug: 'procurement_officer', label: 'Procurement Officer' },
  { slug: 'warehouse_manager',   label: 'Warehouse Manager' },
  { slug: 'finance_manager',     label: 'Finance Manager' },
]

interface RoleSwitcherProps {
  currentPreviewRole: string | null
  realRole: string
}

export function RoleSwitcher({ currentPreviewRole, realRole }: RoleSwitcherProps) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const pathname = usePathname()

  // Only admins can use this
  if (realRole !== 'administrator' && realRole !== 'admin') return null

  const activeRole = currentPreviewRole ?? realRole
  const isPreviewMode = !!currentPreviewRole && currentPreviewRole !== realRole

  function switchTo(slug: string) {
    startTransition(async () => {
      try {
        if (slug === realRole) {
          await clearPreviewRoleAction()
        } else {
          const result = await setPreviewRoleAction(slug)
          if (!result.ok) {
            console.warn('[RoleSwitcher] switch failed:', result.error)
            await clearPreviewRoleAction()
          }
        }
        // router.refresh() re-renders server components without a full page reload.
        // The session cookies remain intact. window.location.reload() was causing
        // the middleware to lose the session context.
        router.refresh()
      } catch (err) {
        console.warn('[RoleSwitcher] unexpected error:', err)
        try { await clearPreviewRoleAction() } catch { /* ignore */ }
        router.refresh()
      }
    })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={isPending}
          className={cn(
            'gap-1.5 text-xs h-8',
            isPreviewMode && 'border-amber-400 bg-amber-50 text-amber-700 hover:bg-amber-100 dark:border-amber-600 dark:bg-amber-900/20 dark:text-amber-400',
          )}
        >
          <Eye className="h-3.5 w-3.5" />
          {isPreviewMode ? `Viewing as: ${ROLE_LABELS[activeRole] ?? activeRole}` : 'View as Role'}
          <ChevronDown className="h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuLabel className="text-xs text-[--color-foreground-muted]">
          Preview as role
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {PREVIEWABLE_ROLES.map((role) => (
          <DropdownMenuItem
            key={role.slug}
            onClick={() => switchTo(role.slug)}
            className={cn(
              'text-sm cursor-pointer',
              activeRole === role.slug && 'font-semibold text-[--color-primary]',
            )}
          >
            {activeRole === role.slug && (
              <span className="mr-2 h-1.5 w-1.5 rounded-full bg-[--color-primary] inline-block" />
            )}
            {role.label}
          </DropdownMenuItem>
        ))}
        {isPreviewMode && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => switchTo(realRole)}
              className="text-sm text-amber-600 font-medium cursor-pointer"
            >
              ← Back to Administrator
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
