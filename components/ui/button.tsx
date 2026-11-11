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
          'bg-gradient-to-br from-[#8B9FD4] to-[#A5B6E8] text-[#1E2340]',
          'shadow-[0_4px_16px_rgba(139,159,212,0.40)]',
          'hover:shadow-[0_6px_24px_rgba(139,159,212,0.55)] hover:brightness-110',
        ].join(' '),
        destructive: [
          'bg-gradient-to-br from-[#E87070] to-[#F0A8A8] text-white',
          'shadow-[0_4px_12px_rgba(232,112,112,0.35)]',
          'hover:shadow-[0_6px_20px_rgba(232,112,112,0.50)] hover:brightness-110',
        ].join(' '),
        outline: [
          'border border-[rgba(180,190,220,0.30)] bg-[rgba(26,31,56,0.60)] text-[#C8D0E8]',
          'backdrop-blur-sm',
          'hover:bg-[rgba(139,159,212,0.14)] hover:border-[rgba(139,159,212,0.50)] hover:text-white',
        ].join(' '),
        secondary: [
          'bg-[rgba(139,159,212,0.12)] text-[#C8D0E8] border border-[rgba(180,190,220,0.22)]',
          'hover:bg-[rgba(139,159,212,0.20)] hover:border-[rgba(139,159,212,0.40)] hover:text-white',
        ].join(' '),
        ghost: [
          'text-[#A8B0CC]',
          'hover:bg-[rgba(139,159,212,0.12)] hover:text-[#E8EAF2]',
        ].join(' '),
        link: 'text-[#A8C0F0] underline-offset-4 hover:underline hover:text-[#C8D8FF] p-0 h-auto',
        success: [
          'bg-[rgba(110,207,168,0.16)] text-[#8EDFC0] border border-[rgba(110,207,168,0.35)]',
          'hover:bg-[rgba(110,207,168,0.26)] hover:text-[#6ECFA8]',
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
