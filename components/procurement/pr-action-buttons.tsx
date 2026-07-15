'use client'

import { useState, useTransition } from 'react'
import { Send, CircleCheck as CheckCircle, Circle as XCircle, Loader as Loader2, X } from 'lucide-react'
import { toast } from 'sonner'
import { isRedirectError } from 'next/dist/client/components/redirect-error'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  submitPRAction,
  approvePRAction,
  rejectPRAction,
  cancelPRAction,
} from '@/app/(dashboard)/procurement/actions'
import type { PRStatus } from '@/types/purchase-request'

interface PRActionButtonsProps {
  requestId: string
  status: PRStatus
  isRequester?: boolean
}

export function PRActionButtons({ requestId, status, isRequester = false }: PRActionButtonsProps) {
  const [isPending, startTransition] = useTransition()
  const [rejectOpen, setRejectOpen] = useState(false)
  const [rejectReason, setRejectReason] = useState('')

  function run(action: () => Promise<void>) {
    startTransition(async () => {
      try {
        await action()
      } catch (err) {
        if (isRedirectError(err)) throw err
        toast.error('Action failed. Please try again.')
      }
    })
  }

  const handleReject = () => {
    if (!rejectReason.trim()) {
      toast.error('Please enter a rejection reason.')
      return
    }
    run(() => rejectPRAction(requestId, rejectReason))
  }

  const isDraft = status === 'draft'
  const isSubmitted = status === 'submitted'
  const isUnderReview = status === 'under_review'
  const canSubmit = isDraft && isRequester
  const canApprove = isSubmitted || isUnderReview
  const canCancel = isRequester && !['approved', 'rejected', 'cancelled', 'converted'].includes(status)

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        {canSubmit && (
          <Button
            size="sm"
            disabled={isPending}
            onClick={() => run(() => submitPRAction(requestId))}
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Submit for Approval
          </Button>
        )}

        {canApprove && (
          <Button
            size="sm"
            disabled={isPending}
            onClick={() => run(() => approvePRAction(requestId))}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
            Approve
          </Button>
        )}

        {canApprove && !rejectOpen && (
          <Button
            size="sm"
            variant="outline"
            disabled={isPending}
            onClick={() => setRejectOpen(true)}
            className="text-[--color-error] border-[--color-error]/40 hover:bg-[--color-error-bg]"
          >
            <XCircle className="h-4 w-4" />
            Reject
          </Button>
        )}

        {canCancel && (
          <Button
            size="sm"
            variant="ghost"
            disabled={isPending}
            onClick={() => run(() => cancelPRAction(requestId))}
            className="text-[--color-foreground-muted] hover:text-[--color-error]"
          >
            <X className="h-4 w-4" />
            Cancel
          </Button>
        )}
      </div>

      {rejectOpen && (
        <div className="rounded-lg border border-[--color-error]/30 bg-[--color-error-bg] p-4 space-y-3">
          <p className="text-xs font-semibold text-[--color-error]">Reason for rejection</p>
          <Textarea
            rows={3}
            placeholder="Explain why this request is being rejected…"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            className="text-sm"
          />
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="destructive"
              onClick={handleReject}
              disabled={isPending}
              className="h-7 px-3 text-xs"
            >
              {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Confirm Reject'}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => { setRejectOpen(false); setRejectReason('') }}
              disabled={isPending}
              className="h-7 px-3 text-xs"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
