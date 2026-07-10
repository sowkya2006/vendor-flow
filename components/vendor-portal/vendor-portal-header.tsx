'use client'

import { useTransition } from 'react'
import { LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { vendorSignOut } from '@/app/vendor/actions'
import type { VendorUser } from '@/types/vendor-portal'

export function VendorPortalHeader({ vendorUser }: { vendorUser: VendorUser }) {
  const [isPending, startTransition] = useTransition()

  return (
    <header className="h-14 flex items-center justify-between px-5 border-b border-[--color-border] bg-[--color-card] shrink-0">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-[--color-foreground]">
          {vendorUser.full_name ?? vendorUser.email ?? 'Vendor User'}
        </span>
        <span className="rounded-full bg-[--color-primary]/10 px-2 py-0.5 text-[10px] font-semibold text-[--color-primary] capitalize">
          {vendorUser.role}
        </span>
      </div>
      <Button
        variant="outline"
        size="sm"
        disabled={isPending}
        onClick={() => startTransition(() => vendorSignOut())}
        className="gap-1.5"
      >
        <LogOut className="h-3.5 w-3.5" />
        Sign Out
      </Button>
    </header>
  )
}
