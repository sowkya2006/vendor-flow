import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  [
    'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold',
    'transition-all duration-150 ease-out',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--color-ring] focus-visible:ring-offset-2 focus-visible:ring-offset-[--color-background]',
    'disabled:pointer-events-none disabled:opacity-40',
    'active:scale-[0.97]',
    '[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
    'select-none',
  ].join(' '),
  {
    variants: {
      variant: {
        default: [
          'bg-gradient-to-br from-[#4F8CFF] to-[#6CA7FF] text-white',
          'shadow-[0_4px_16px_rgba(79,140,255,0.35)]',
          'hover:shadow-[0_6px_24px_rgba(79,140,255,0.45)] hover:brightness-110',
        ].join(' '),
        destructive: [
          'bg-gradient-to-br from-[#EF4444] to-[#f87171] text-white',
          'shadow-[0_4px_12px_rgba(239,68,68,0.3)]',
          'hover:shadow-[0_6px_20px_rgba(239,68,68,0.4)] hover:brightness-110',
        ].join(' '),
        outline: [
          'border border-[rgba(255,255,255,0.14)] bg-[rgba(255,255,255,0.04)] text-[#E5E7EB]',
          'backdrop-blur-sm',
          'hover:bg-[rgba(255,255,255,0.08)] hover:border-[rgba(255,255,255,0.22)] hover:text-white',
        ].join(' '),
        secondary: [
          'bg-[rgba(255,255,255,0.06)] text-[#E5E7EB] border border-[rgba(255,255,255,0.1)]',
          'hover:bg-[rgba(255,255,255,0.1)] hover:border-[rgba(255,255,255,0.18)]',
        ].join(' '),
        ghost: [
          'text-[#AEB4C2]',
          'hover:bg-[rgba(255,255,255,0.06)] hover:text-[#F5F5F5]',
        ].join(' '),
        link: 'text-[#4F8CFF] underline-offset-4 hover:underline p-0 h-auto',
        success: [
          'bg-[rgba(34,197,94,0.15)] text-[#4ade80] border border-[rgba(34,197,94,0.3)]',
          'hover:bg-[rgba(34,197,94,0.22)]',
        ].join(' '),
      },
      size: {
        default:   'h-9 px-4 py-2',
        sm:        'h-8 rounded-lg px-3 text-xs',
        lg:        'h-10 px-6 text-sm',
        xl:        'h-11 px-8 text-base rounded-xl',
        icon:      'h-9 w-9 rounded-xl',
        'icon-sm': 'h-7 w-7 rounded-lg',
        'icon-lg': 'h-10 w-10 rounded-xl',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }
