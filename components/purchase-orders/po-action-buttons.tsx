'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Send, Check, X, Loader2, RotateCcw } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { updatePOStatusAction } from '@/app/(dashboard)/purchase-orders/actions'
import type { POStatus } from '@/types/purchase-order'

interface POActionButtonsProps {
  poId: string
  status: POStatus
  role: string
}

export function POActionButtons({ poId, status, role }: POActionButtonsProps) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const isAdmin = role === 'administrator' || role === 'admin'
  const isManager = role === 'procurement_manager' || isAdmin
  const isOfficer = role === 'procurement_officer' || isAdmin

  function handleAction(newStatus: string, successMsg: string) {
    startTransition(async () => {
      try {
        await updatePOStatusAction(poId, newStatus)
        toast.success(successMsg)
        router.refresh()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Action failed')
      }
    })
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Officer: Submit for approval */}
      {isOfficer && status === 'draft' && (
        <Button
          size="sm"
          onClick={() => handleAction('pending_approval', 'Submitted for approval')}
          disabled={isPending}
        >
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          Submit for Approval
        </Button>
      )}

      {/* Manager: Approve PO */}
      {isManager && status === 'pending_approval' && (
        <Button
          size="sm"
          onClick={() => handleAction('approved', 'Purchase Order approved')}
          disabled={isPending}
          className="bg-emerald-600 hover:bg-emerald-700 text-white"
        >
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          Approve PO
        </Button>
      )}

      {/* Manager: Reject PO */}
      {isManager && status === 'pending_approval' && (
        <Button
          size="sm"
          variant="destructive"
          onClick={() => handleAction('cancelled', 'Purchase Order rejected')}
          disabled={isPending}
        >
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
          Reject PO
        </Button>
      )}

      {/* Manager: Send to Vendor — only after approval */}
      {isManager && status === 'approved' && (
        <Button
          size="sm"
          onClick={() => handleAction('sent', 'PO sent to vendor')}
          disabled={isPending}
        >
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          Send to Vendor
        </Button>
      )}
    </div>
  )
}
