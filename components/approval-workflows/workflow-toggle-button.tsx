'use client'

import { useTransition } from 'react'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { toggleWorkflowActiveAction } from '@/app/(dashboard)/approval-workflows/actions'

interface WorkflowToggleButtonProps {
  workflowId: string
  isActive: boolean
}

export function WorkflowToggleButton({ workflowId, isActive }: WorkflowToggleButtonProps) {
  const [isPending, startTransition] = useTransition()

  const toggle = () => {
    startTransition(async () => {
      try {
        await toggleWorkflowActiveAction(workflowId, !isActive)
        // Trigger page refresh via router isn't available in server components —
        // the parent page will revalidate on next navigation. Toast confirms it.
        toast.success(isActive ? 'Workflow deactivated.' : 'Workflow activated.')
      } catch {
        toast.error('Failed to update workflow status.')
      }
    })
  }

  return (
    <Button
      size="sm"
      variant="outline"
      onClick={toggle}
      disabled={isPending}
      className={
        isActive
          ? 'text-[--color-error] border-[--color-error]/40 hover:bg-[--color-error-bg]'
          : 'text-green-600 border-green-300 hover:bg-green-50'
      }
    >
      {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
      {isActive ? 'Deactivate' : 'Activate'}
    </Button>
  )
}
