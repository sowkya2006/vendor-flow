'use client'

import { useState, useTransition } from 'react'
import {
  CheckCircle,
  XCircle,
  RotateCcw,
  Send,
  Loader2,
  MessageSquare,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import { isRedirectError } from 'next/dist/client/components/redirect-error'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import {
  submitApprovalRequestAction,
  approveStepAction,
  rejectRequestAction,
  returnRequestAction,
  cancelRequestAction,
  addCommentAction,
} from '@/app/(dashboard)/approvals/actions'
import type { ApprovalRequestStatus, ApprovalStep } from '@/types/approval'

interface ApprovalActionButtonsProps {
  requestId: string
  status: ApprovalRequestStatus
  /** The pending step this user can act on (if any) */
  activeStep?: ApprovalStep
  /** Whether the current user is the requester */
  isRequester?: boolean
}

type Panel = 'reject' | 'return' | 'comment' | null

export function ApprovalActionButtons({
  requestId,
  status,
  activeStep,
  isRequester = false,
}: ApprovalActionButtonsProps) {
  const [isPending, startTransition] = useTransition()
  const [panel, setPanel] = useState<Panel>(null)
  const [reason, setReason] = useState('')
  const [comment, setComment] = useState('')
  const [isInternal, setIsInternal] = useState(false)

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

  const closePanel = () => {
    setPanel(null)
    setReason('')
    setComment('')
  }

  const isDraft = status === 'draft'
  const isPendingAny = ['pending_manager', 'pending_procurement', 'pending_finance', 'pending_final'].includes(status)
  const isTerminal = ['approved', 'rejected', 'cancelled', 'completed'].includes(status)
  const canApproveStep = !!activeStep && isPendingAny
  const canSubmit = isDraft && isRequester
  const canCancel = !isTerminal && isRequester

  return (
    <div className="space-y-3">
      {/* Primary action row */}
      <div className="flex flex-wrap items-center gap-2">

        {/* Submit (requester, draft) */}
        {canSubmit && (
          <Button
            size="sm"
            disabled={isPending}
            onClick={() => run(() => submitApprovalRequestAction(requestId))}
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Submit for Approval
          </Button>
        )}

        {/* Approve step */}
        {canApproveStep && panel === null && (
          <Button
            size="sm"
            disabled={isPending}
            onClick={() => run(() => approveStepAction(requestId, activeStep.id, null, false))}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
            Approve
          </Button>
        )}

        {/* Reject */}
        {canApproveStep && panel !== 'reject' && (
          <Button
            size="sm"
            variant="outline"
            disabled={isPending}
            onClick={() => setPanel('reject')}
            className="text-[--color-error] border-[--color-error]/40 hover:bg-[--color-error-bg]"
          >
            <XCircle className="h-4 w-4" />
            Reject
          </Button>
        )}

        {/* Return for revision */}
        {canApproveStep && panel !== 'return' && (
          <Button
            size="sm"
            variant="outline"
            disabled={isPending}
            onClick={() => setPanel('return')}
          >
            <RotateCcw className="h-4 w-4" />
            Return
          </Button>
        )}

        {/* Add comment */}
        {!isTerminal && panel !== 'comment' && (
          <Button
            size="sm"
            variant="ghost"
            disabled={isPending}
            onClick={() => setPanel('comment')}
          >
            <MessageSquare className="h-4 w-4" />
            Comment
          </Button>
        )}

        {/* Cancel */}
        {canCancel && (
          <Button
            size="sm"
            variant="ghost"
            disabled={isPending}
            onClick={() => run(() => cancelRequestAction(requestId))}
            className="text-[--color-foreground-muted] hover:text-[--color-error]"
          >
            <X className="h-4 w-4" />
            Cancel
          </Button>
        )}
      </div>

      {/* Reject panel */}
      {panel === 'reject' && (
        <ActionPanel
          title="Reason for rejection"
          placeholder="Explain why this request is being rejected…"
          value={reason}
          onChange={setReason}
          isInternal={isInternal}
          onToggleInternal={() => setIsInternal((v) => !v)}
          onConfirm={() => {
            if (!reason.trim()) { toast.error('Please provide a reason.'); return }
            run(() => rejectRequestAction(requestId, activeStep?.id ?? null, reason))
            closePanel()
          }}
          onCancel={closePanel}
          confirmLabel="Confirm Reject"
          confirmClass="bg-red-600 hover:bg-red-700 text-white"
          isPending={isPending}
        />
      )}

      {/* Return panel */}
      {panel === 'return' && (
        <ActionPanel
          title="Reason for return"
          placeholder="Describe what needs to be corrected…"
          value={reason}
          onChange={setReason}
          onConfirm={() => {
            if (!reason.trim()) { toast.error('Please provide a reason.'); return }
            run(() => returnRequestAction(requestId, activeStep?.id ?? null, reason))
            closePanel()
          }}
          onCancel={closePanel}
          confirmLabel="Return for Revision"
          isPending={isPending}
        />
      )}

      {/* Comment panel */}
      {panel === 'comment' && (
        <ActionPanel
          title="Add a comment"
          placeholder="Write your comment…"
          value={comment}
          onChange={setComment}
          isInternal={isInternal}
          onToggleInternal={() => setIsInternal((v) => !v)}
          onConfirm={() => {
            if (!comment.trim()) { toast.error('Comment cannot be empty.'); return }
            run(() => addCommentAction(requestId, comment, isInternal))
            closePanel()
          }}
          onCancel={closePanel}
          confirmLabel="Post Comment"
          isPending={isPending}
        />
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Shared inline panel
// ---------------------------------------------------------------------------

interface ActionPanelProps {
  title: string
  placeholder: string
  value: string
  onChange: (v: string) => void
  isInternal?: boolean
  onToggleInternal?: () => void
  onConfirm: () => void
  onCancel: () => void
  confirmLabel: string
  confirmClass?: string
  isPending: boolean
}

function ActionPanel({
  title,
  placeholder,
  value,
  onChange,
  isInternal,
  onToggleInternal,
  onConfirm,
  onCancel,
  confirmLabel,
  confirmClass,
  isPending,
}: ActionPanelProps) {
  return (
    <div className="rounded-lg border border-[--color-border] bg-[--color-background-subtle] p-4 space-y-3">
      <p className="text-xs font-semibold text-[--color-foreground]">{title}</p>
      <Textarea
        rows={3}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="text-sm"
      />
      {onToggleInternal !== undefined && (
        <label className="flex items-center gap-2 text-xs text-[--color-foreground-muted] cursor-pointer">
          <input
            type="checkbox"
            checked={isInternal}
            onChange={onToggleInternal}
            className="h-3.5 w-3.5 rounded"
          />
          Internal note (not visible to requester)
        </label>
      )}
      <div className="flex gap-2">
        <Button
          size="sm"
          onClick={onConfirm}
          disabled={isPending}
          className={cn('h-7 px-3 text-xs', confirmClass)}
        >
          {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : confirmLabel}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={onCancel}
          disabled={isPending}
          className="h-7 px-3 text-xs"
        >
          Cancel
        </Button>
      </div>
    </div>
  )
}
