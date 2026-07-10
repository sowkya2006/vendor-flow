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
}

export function QuotationActionButtons({ quotationId, status }: QuotationActionButtonsProps) {
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
    run(() => rejectQuotationAction(quotationId, rejectReason))
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Draft → Submit */}
      {status === 'draft' && (
        <Button
          size="sm"
          disabled={isPending}
          onClick={() => run(() => submitQuotationAction(quotationId))}
        >
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          Submit
        </Button>
      )}

      {/* Submitted → Under Review */}
      {status === 'submitted' && (
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

      {/* Under Review / Submitted → Shortlist */}
      {(status === 'submitted' || status === 'under_review') && (
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

      {/* Shortlisted / Under Review → Approve */}
      {(status === 'shortlisted' || status === 'under_review' || status === 'submitted') && (
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

      {/* Submitted / Under Review / Shortlisted → Reject */}
      {['submitted', 'under_review', 'shortlisted'].includes(status) && !rejectOpen && (
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

      {/* Rejected / Expired → Reopen */}
      {(status === 'rejected' || status === 'expired') && (
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
