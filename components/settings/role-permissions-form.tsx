'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { updateRolePermissionsAction } from '@/app/(dashboard)/settings/actions'
import type { PortalRole, Permission, PermissionKey } from '@/lib/supabase/roles'
import { cn } from '@/lib/utils'

interface Props {
  role: PortalRole
  allPermissions: Permission[]
}

export function RolePermissionsForm({ role, allPermissions }: Props) {
  const [enabled, setEnabled] = useState<Set<PermissionKey>>(
    new Set(role.permissions ?? []),
  )
  const [isPending, startTransition] = useTransition()

  // Group permissions by group_name
  const groups = allPermissions.reduce<Record<string, Permission[]>>((acc, p) => {
    if (!acc[p.group_name]) acc[p.group_name] = []
    acc[p.group_name].push(p)
    return acc
  }, {})

  function toggle(key: PermissionKey) {
    setEnabled((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  function save() {
    startTransition(async () => {
      try {
        await updateRolePermissionsAction({
          role_id: role.id,
          permissions: Array.from(enabled),
        })
        toast.success(`Permissions saved for ${role.name}`)
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Save failed')
      }
    })
  }

  return (
    <div className="space-y-5">
      {Object.entries(groups).map(([groupName, perms]) => (
        <div key={groupName}>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[--color-foreground-muted]">
            {groupName}
          </p>
          <div className="space-y-2">
            {perms.map((perm) => (
              <div
                key={perm.key}
                className={cn(
                  'flex items-start justify-between gap-3 rounded-lg border border-[--color-border] bg-[--color-background-subtle] px-4 py-3',
                  role.is_system && role.slug === 'administrator' && 'opacity-70',
                )}
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[--color-foreground]">{perm.label}</p>
                  {perm.description && (
                    <p className="text-xs text-[--color-foreground-muted] mt-0.5">{perm.description}</p>
                  )}
                </div>
                <Switch
                  checked={enabled.has(perm.key as PermissionKey)}
                  onCheckedChange={() => toggle(perm.key as PermissionKey)}
                  disabled={role.is_system && role.slug === 'administrator'}
                  aria-label={`Toggle ${perm.label}`}
                />
              </div>
            ))}
          </div>
        </div>
      ))}

      {!(role.is_system && role.slug === 'administrator') && (
        <div className="flex justify-end pt-2">
          <Button onClick={save} disabled={isPending}>
            {isPending ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Saving…</> : 'Save Permissions'}
          </Button>
        </div>
      )}
      {role.is_system && role.slug === 'administrator' && (
        <p className="text-xs text-center text-[--color-foreground-muted] italic">
          Administrator always has all permissions and cannot be restricted.
        </p>
      )}
    </div>
  )
}
