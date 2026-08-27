'use client'

import { useTransition, useState } from 'react'
import { Loader2, CheckCircle, XCircle, Star, RefreshCw, Send, Eye } from 'lucide-react'
import { toast } from 'sonner'
import { isRedirectError } from 'next/dist/client/components/redirect-error'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  submitQuotationAction,
  approveQuotationAction,
  rejectQuotationAction,
  shortlistQuotationAction,
  reopenQuotationAction,
  markUnderReviewAction,
} from '@/app/(dashboard)/quotations/actions'
import type { QuotationStatus } from '@/types/quotation'

interface QuotationActionButtonsProps {
  quotationId: string
  status: QuotationStatus
  role?: string
}

export function QuotationActionButtons({ quotationId, status, role = 'viewer' }: QuotationActionButtonsProps) {
  const [isPending, startTransition] = useTransition()
  const [rejectOpen, setRejectOpen] = useState(false)
  const [rejectReason, setRejectReason] = useState('')

  // Procurement Manager can approve/reject/shortlist but cannot submit or reopen.
  // Only the creator (Procurement Officer / Admin) can submit / reopen quotations.
  const isPM = role === 'procurement_manager'
  const isAdmin = role === 'administrator' || role === 'admin'
  const canSubmit  = !isPM   // PO, Admin can submit
  const canApprove = isPM || isAdmin  // PM and Admin can approve/reject/shortlist

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
    run(() => rejectQuotationAction(quotationId, rejectReason))
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Draft → Submit — only officers/admin, not PM */}
      {status === 'draft' && canSubmit && (
        <Button
          size="sm"
          disabled={isPending}
          onClick={() => run(() => submitQuotationAction(quotationId))}
        >
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          Submit
        </Button>
      )}

      {/* Submitted → Under Review — PM and Admin can start review */}
      {status === 'submitted' && canApprove && (
        <Button
          size="sm"
          variant="outline"
          disabled={isPending}
          onClick={() => run(() => markUnderReviewAction(quotationId))}
        >
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
          Start Review
        </Button>
      )}

      {/* Under Review / Submitted → Shortlist — PM and Admin */}
      {(status === 'submitted' || status === 'under_review') && canApprove && (
        <Button
          size="sm"
          variant="outline"
          disabled={isPending}
          onClick={() => run(() => shortlistQuotationAction(quotationId))}
          className="text-[--color-primary] border-[--color-primary]/40 hover:bg-[--color-primary]/10"
        >
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Star className="h-4 w-4" />}
          Shortlist
        </Button>
      )}

      {/* Shortlisted / Under Review → Approve — PM and Admin */}
      {(status === 'shortlisted' || status === 'under_review' || status === 'submitted') && canApprove && (
        <Button
          size="sm"
          disabled={isPending}
          onClick={() => run(() => approveQuotationAction(quotationId))}
          className="bg-green-600 hover:bg-green-700 text-white"
        >
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
          Approve
        </Button>
      )}

      {/* Submitted / Under Review / Shortlisted → Reject — PM and Admin */}
      {['submitted', 'under_review', 'shortlisted'].includes(status) && canApprove && !rejectOpen && (
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

      {/* Rejected / Expired → Reopen — only non-PM */}
      {(status === 'rejected' || status === 'expired') && !isPM && (
        <Button
          size="sm"
          variant="outline"
          disabled={isPending}
          onClick={() => run(() => reopenQuotationAction(quotationId))}
        >
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Reopen
        </Button>
      )}

      {/* Reject inline form */}
      {rejectOpen && (
        <div className="w-full mt-2 flex flex-col gap-2 rounded-lg border border-[--color-error]/30 bg-[--color-error-bg] p-3">
          <p className="text-xs font-medium text-[--color-error]">Reason for rejection</p>
          <Textarea
            rows={2}
            placeholder="Explain why this quotation is being rejected…"
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
