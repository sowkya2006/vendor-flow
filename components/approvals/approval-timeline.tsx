'use client'

import { motion } from 'framer-motion'
import {
  CheckCircle2,
  XCircle,
  Clock,
  RotateCcw,
  Send,
  MessageSquare,
  UserCheck,
  AlertTriangle,
  SkipForward,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { cn } from '@/lib/utils'
import { ApprovalStepStatusBadge } from './approval-status-badge'
import type { ApprovalStep, ApprovalAction, ApprovalActionType } from '@/types/approval'
import { APPROVAL_ACTION_LABELS, APPROVAL_ROLE_LABELS } from '@/types/approval'

// ---------------------------------------------------------------------------
// Step progress indicator
// ---------------------------------------------------------------------------

interface StepProgressProps {
  steps: ApprovalStep[]
  currentStep: number
}

export function ApprovalStepProgress({ steps, currentStep }: StepProgressProps) {
  if (steps.length === 0) {
    return (
      <p className="text-xs text-[--color-foreground-muted]">No workflow steps configured.</p>
    )
  }

  return (
    <div className="relative">
      {/* Connector line */}
      <div className="absolute left-4 top-4 bottom-4 w-px bg-[--color-border]" />

      <div className="space-y-3">
        {steps.map((step, idx) => {
          const isActive = step.step_order === currentStep && step.status === 'pending'
          const isDone = step.status === 'approved'
          const isRejected = step.status === 'rejected'
          const isReturned = step.status === 'returned'
          const isSkipped = step.status === 'skipped'

          return (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.06 }}
              className="relative flex items-start gap-4 pl-0"
            >
              {/* Icon */}
              <div
                className={cn(
                  'relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2',
                  isDone && 'bg-green-50 border-green-500 text-green-600',
                  isRejected && 'bg-red-50 border-red-500 text-red-600',
                  isReturned && 'bg-blue-50 border-blue-500 text-blue-600',
                  isSkipped && 'bg-[--color-muted] border-[--color-border] text-[--color-foreground-subtle]',
                  isActive && 'bg-amber-50 border-amber-400 text-amber-600 animate-pulse',
                  !isDone && !isRejected && !isReturned && !isSkipped && !isActive &&
                    'bg-[--color-background-subtle] border-[--color-border] text-[--color-foreground-muted]',
                )}
              >
                {isDone && <CheckCircle2 className="h-4 w-4" />}
                {isRejected && <XCircle className="h-4 w-4" />}
                {isReturned && <RotateCcw className="h-4 w-4" />}
                {isSkipped && <SkipForward className="h-4 w-4" />}
                {isActive && <Clock className="h-4 w-4" />}
                {!isDone && !isRejected && !isReturned && !isSkipped && !isActive && (
                  <span className="text-xs font-bold">{step.step_order}</span>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 pt-0.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={cn(
                      'text-sm font-medium',
                      isActive ? 'text-amber-700' : 'text-[--color-foreground]',
                    )}
                  >
                    {step.name}
                  </span>
                  <ApprovalStepStatusBadge status={step.status} />
                  {step.is_optional && (
                    <span className="text-[10px] text-[--color-foreground-muted] italic">optional</span>
                  )}
                </div>

                <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-[--color-foreground-muted]">
                  <span>{APPROVAL_ROLE_LABELS[step.role_required]}</span>
                  {step.approver && (
                    <span className="flex items-center gap-1">
                      <UserCheck className="h-3 w-3" />
                      {step.approver.full_name ?? step.approver.email}
                    </span>
                  )}
                  {step.decided_at && (
                    <span>
                      {formatDistanceToNow(new Date(step.decided_at), { addSuffix: true })}
                    </span>
                  )}
                  {step.due_at && step.status === 'pending' && (
                    <span
                      className={cn(
                        new Date(step.due_at) < new Date()
                          ? 'text-[--color-error] font-medium'
                          : '',
                      )}
                    >
                      Due {formatDistanceToNow(new Date(step.due_at), { addSuffix: true })}
                    </span>
                  )}
                </div>

                {step.comments && (
                  <p className="mt-1.5 rounded-md bg-[--color-background-subtle] border border-[--color-border] px-3 py-2 text-xs text-[--color-foreground-muted] italic leading-relaxed">
                    "{step.comments}"
                  </p>
                )}
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Action icon helper
// ---------------------------------------------------------------------------

function actionIcon(type: ApprovalActionType) {
  const map: Record<ApprovalActionType, React.ElementType> = {
    submitted: Send,
    approved: CheckCircle2,
    rejected: XCircle,
    returned: RotateCcw,
    cancelled: AlertTriangle,
    reassigned: UserCheck,
    escalated: AlertTriangle,
    commented: MessageSquare,
    reopened: RotateCcw,
  }
  return map[type] ?? MessageSquare
}

function actionColor(type: ApprovalActionType): string {
  if (type === 'approved') return 'bg-green-100 text-green-600 border-green-200'
  if (type === 'rejected') return 'bg-red-100 text-red-600 border-red-200'
  if (type === 'returned') return 'bg-blue-100 text-blue-600 border-blue-200'
  if (type === 'cancelled') return 'bg-orange-100 text-orange-600 border-orange-200'
  if (type === 'submitted') return 'bg-[--color-primary]/10 text-[--color-primary] border-[--color-primary]/20'
  return 'bg-[--color-background-subtle] text-[--color-foreground-muted] border-[--color-border]'
}

// ---------------------------------------------------------------------------
// Action timeline
// ---------------------------------------------------------------------------

interface ActionTimelineProps {
  actions: ApprovalAction[]
}

export function ApprovalActionTimeline({ actions }: ActionTimelineProps) {
  if (actions.length === 0) {
    return (
      <p className="text-xs text-[--color-foreground-muted] text-center py-6">
        No activity yet.
      </p>
    )
  }

  return (
    <div className="relative space-y-4">
      <div className="absolute left-4 top-4 bottom-0 w-px bg-[--color-border]" />

      {actions.map((action, idx) => {
        const Icon = actionIcon(action.action_type)
        return (
          <motion.div
            key={action.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.04 }}
            className="relative flex items-start gap-4"
          >
            {/* Icon */}
            <div
              className={cn(
                'relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border',
                actionColor(action.action_type),
              )}
            >
              <Icon className="h-3.5 w-3.5" />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 pt-0.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium text-[--color-foreground]">
                  {APPROVAL_ACTION_LABELS[action.action_type]}
                </span>
                {action.is_internal && (
                  <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">
                    Internal
                  </span>
                )}
              </div>

              <div className="mt-0.5 flex flex-wrap items-center gap-x-3 text-xs text-[--color-foreground-muted]">
                {action.actor && (
                  <span>{action.actor.full_name ?? action.actor.email}</span>
                )}
                <span>
                  {formatDistanceToNow(new Date(action.performed_at), { addSuffix: true })}
                </span>
              </div>

              {action.comment && (
                <p className="mt-1.5 rounded-md border border-[--color-border] bg-[--color-background-subtle] px-3 py-2 text-xs text-[--color-foreground-muted] leading-relaxed">
                  {action.comment}
                </p>
              )}
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}
