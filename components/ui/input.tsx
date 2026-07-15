import * as React from 'react'
import { cn } from '@/lib/utils'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex h-9 w-full',
          'rounded-xl border bg-[rgba(255,255,255,0.06)] border-[rgba(255,255,255,0.12)]',
          'px-3 py-2 text-sm text-[#F5F5F5]',
          'placeholder:text-[#4B5563]',
          'hover:border-[rgba(255,255,255,0.2)] transition-colors duration-150',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(79,140,255,0.4)] focus-visible:border-[rgba(79,140,255,0.5)] focus-visible:ring-offset-0',
          'file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-[#E5E7EB]',
          'disabled:cursor-not-allowed disabled:opacity-50',
          'aria-[invalid=true]:border-[rgba(239,68,68,0.5)] aria-[invalid=true]:ring-[rgba(239,68,68,0.2)]',
          className,
        )}
        ref={ref}
        {...props}
      />
    )
  },
)
Input.displayName = 'Input'

export { Input }
