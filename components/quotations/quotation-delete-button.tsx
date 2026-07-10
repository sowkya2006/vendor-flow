'use client'

import { useState, useTransition } from 'react'
import { Trash2, Loader2, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import { isRedirectError } from 'next/dist/client/components/redirect-error'
import { Button } from '@/components/ui/button'
import { deleteQuotationAction } from '@/app/(dashboard)/quotations/actions'

interface QuotationDeleteButtonProps {
  quotationId: string
}

export function QuotationDeleteButton({ quotationId }: QuotationDeleteButtonProps) {
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const handleDelete = () => {
    startTransition(async () => {
      try {
        await deleteQuotationAction(quotationId)
      } catch (err) {
        if (isRedirectError(err)) throw err
        toast.error('Failed to delete quotation')
      }
    })
  }

  if (confirmOpen) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-[--color-error]/30 bg-[--color-error-bg] px-3 py-1.5">
        <AlertTriangle className="h-4 w-4 flex-shrink-0 text-[--color-error]" />
        <span className="text-xs text-[--color-error]">Delete this quotation?</span>
        <Button
          size="sm"
          variant="destructive"
          onClick={handleDelete}
          disabled={isPending}
          className="h-6 px-2 text-xs"
        >
          {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Yes, delete'}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setConfirmOpen(false)}
          disabled={isPending}
          className="h-6 px-2 text-xs"
        >
          Cancel
        </Button>
      </div>
    )
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => setConfirmOpen(true)}
      className="text-[--color-error] hover:bg-[--color-error-bg] hover:border-[--color-error]/30"
    >
      <Trash2 className="h-4 w-4" />
      Delete
    </Button>
  )
}
