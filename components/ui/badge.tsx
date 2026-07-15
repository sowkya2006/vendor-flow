import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-[--color-ring] focus:ring-offset-2 select-none',
  {
    variants: {
      variant: {
        default:
          'bg-[--color-primary] text-[--color-primary-foreground]',
        secondary:
          'bg-[--color-secondary] text-[--color-secondary-foreground] border border-[--color-border]',
        destructive:
          'bg-[--color-error-bg] text-[--color-error] border border-[--color-error-border]',
        outline:
          'border border-[--color-border] text-[--color-foreground] bg-transparent',
        success:
          'bg-[--color-success-bg] text-[--color-success] border border-[--color-success-border]',
        warning:
          'bg-[--color-warning-bg] text-[--color-warning] border border-[--color-warning-border]',
        error:
          'bg-[--color-error-bg] text-[--color-error] border border-[--color-error-border]',
        info:
          'bg-[--color-info-bg] text-[--color-info] border border-[--color-info-border]',
        // Solid variants for stronger emphasis
        'solid-success':
          'bg-[--color-success] text-white',
        'solid-warning':
          'bg-[--color-warning] text-white',
        'solid-error':
          'bg-[--color-error] text-white',
        'solid-info':
          'bg-[--color-info] text-white',
        // Muted / ghost
        muted:
          'bg-[--color-background-muted] text-[--color-foreground-muted]',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  dot?: boolean
}

function Badge({ className, variant, dot, children, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props}>
      {dot && (
        <span
          className={cn(
            'inline-block h-1.5 w-1.5 rounded-full shrink-0',
            variant === 'success' || variant === 'solid-success' ? 'bg-[--color-success]' :
            variant === 'warning' || variant === 'solid-warning' ? 'bg-[--color-warning]' :
            variant === 'error' || variant === 'destructive' || variant === 'solid-error' ? 'bg-[--color-error]' :
            variant === 'info' || variant === 'solid-info' ? 'bg-[--color-info]' :
            'bg-current'
          )}
        />
      )}
      {children}
    </div>
  )
}

export { Badge, badgeVariants }
