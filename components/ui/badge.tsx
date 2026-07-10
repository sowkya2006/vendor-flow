import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-[--color-ring] focus:ring-offset-2',
  {
    variants: {
      variant: {
        default:
          'border-transparent bg-[--color-primary] text-[--color-primary-foreground]',
        secondary:
          'border-transparent bg-[--color-secondary] text-[--color-secondary-foreground]',
        destructive:
          'border-transparent bg-[--color-destructive] text-[--color-destructive-foreground]',
        outline:
          'text-[--color-foreground]',
        success:
          'border-transparent bg-[--color-success-bg] text-[--color-success]',
        warning:
          'border-transparent bg-[--color-warning-bg] text-[--color-warning]',
        error:
          'border-transparent bg-[--color-error-bg] text-[--color-error]',
        info:
          'border-transparent bg-[--color-info-bg] text-[--color-info]',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
