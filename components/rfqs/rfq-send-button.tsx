'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Send, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { updateRFQStatusAction } from '@/app/(dashboard)/rfqs/actions'

export function RFQSendButton({ rfqId }: { rfqId: string }) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleSend() {
    startTransition(async () => {
      try {
        await updateRFQStatusAction(rfqId, 'sent')
        toast.success('RFQ sent to vendor')
        router.refresh()
      } catch {
        toast.error('Failed to send RFQ. Please try again.')
      }
    })
  }

  return (
    <Button size="sm" onClick={handleSend} disabled={isPending}>
      {isPending
        ? <><Loader2 className="h-4 w-4 animate-spin" />Sending…</>
        : <><Send className="h-4 w-4" />Send to Vendor</>
      }
    </Button>
  )
}
