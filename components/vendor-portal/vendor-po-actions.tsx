'use client'

import { useState, useTransition } from 'react'
import { Check, X, MessageSquare, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  vendorAcceptPOAction,
  vendorRejectPOAction,
  vendorRequestClarificationAction,
} from '@/app/vendor/actions'

interface VendorPOActionsProps {
  poId: string
}

export function VendorPOActions({ poId }: VendorPOActionsProps) {
  const [isPending, startTransition] = useTransition()
  const [mode, setMode] = useState<'idle' | 'reject' | 'clarify'>('idle')
  const [message, setMessage] = useState('')

  function handleAccept() {
    startTransition(async () => {
      try {
        await vendorAcceptPOAction(poId)
        toast.success('Purchase Order accepted')
        // Hard redirect to force a full server re-render with fresh DB data
        // router.refresh() alone doesn't guarantee fresh RSC data for force-dynamic pages
        window.location.reload()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to accept PO')
      }
    })
  }

  function handleReject() {
    if (!message.trim()) { toast.error('Please provide a rejection reason'); return }
    startTransition(async () => {
      try {
        await vendorRejectPOAction(poId, message)
        toast.success('Purchase Order rejected')
        window.location.reload()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to reject PO')
      }
    })
  }

  function handleClarify() {
    if (!message.trim()) { toast.error('Please describe your clarification request'); return }
    startTransition(async () => {
      try {
        await vendorRequestClarificationAction(poId, message)
        toast.success('Clarification request sent')
        window.location.reload()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to send clarification')
      }
    })
  }

  return (
    <div className="space-y-3">
      {mode === 'idle' && (
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            onClick={handleAccept}
            disabled={isPending}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            Accept Purchase Order
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => setMode('reject')}
            disabled={isPending}
          >
            <X className="h-4 w-4" />
            Reject
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setMode('clarify')}
            disabled={isPending}
          >
            <MessageSquare className="h-4 w-4" />
            Request Clarification
          </Button>
        </div>
      )}

      {mode === 'reject' && (
        <div className="space-y-2">
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Please provide the reason for rejection…"
            rows={3}
            className="text-sm"
          />
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setMode('idle')}>Cancel</Button>
            <Button size="sm" variant="destructive" onClick={handleReject} disabled={isPending}>
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Confirm Rejection
            </Button>
          </div>
        </div>
      )}

      {mode === 'clarify' && (
        <div className="space-y-2">
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Describe what clarification you need before accepting…"
            rows={3}
            className="text-sm"
          />
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setMode('idle')}>Cancel</Button>
            <Button size="sm" onClick={handleClarify} disabled={isPending}>
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Send Request
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
