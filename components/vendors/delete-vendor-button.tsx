'use client'

import { useTransition, useState } from 'react'
import { Trash2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { deleteVendorAction } from '@/app/actions/vendors'

interface DeleteVendorButtonProps {
  id: string
  name: string
}

export function DeleteVendorButton({ id, name }: DeleteVendorButtonProps) {
  const [isPending, startTransition] = useTransition()
  const [confirmed, setConfirmed] = useState(false)

  function handleClick() {
    if (!confirmed) {
      // First click: ask for confirmation
      setConfirmed(true)
      // Auto-reset after 4 seconds if user doesn't confirm
      setTimeout(() => setConfirmed(false), 4000)
      return
    }

    startTransition(async () => {
      const result = await deleteVendorAction(id)
      if (result && !result.success) {
        toast.error(result.error)
        setConfirmed(false)
      }
      // On success the action redirects
    })
  }

  return (
    <Button
      variant={confirmed ? 'destructive' : 'outline'}
      size="sm"
      onClick={handleClick}
      disabled={isPending}
      aria-label={confirmed ? `Confirm delete ${name}` : `Delete ${name}`}
    >
      {isPending ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <Trash2 className="h-3.5 w-3.5" />
      )}
      {confirmed ? 'Confirm delete' : 'Delete'}
    </Button>
  )
}
