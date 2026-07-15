import * as React from 'react'
import { cn } from '@/lib/utils'

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          'flex min-h-[88px] w-full',
          'rounded-lg border border-white/[0.12] bg-white/[0.06]',
          'px-3 py-2.5 text-sm text-[#E5E7EB] leading-relaxed',
          'placeholder:text-[#6B7280]',
          'hover:border-white/[0.22] transition-colors duration-150',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4F8CFF]/50 focus-visible:ring-offset-0 focus-visible:border-[#4F8CFF]/50',
          'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-white/[0.03]',
          'aria-[invalid=true]:border-[#EF4444]/60',
          'resize-y',
          className,
        )}
        ref={ref}
        {...props}
      />
    )
  },
)
Textarea.displayName = 'Textarea'

export { Textarea }
