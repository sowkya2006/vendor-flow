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
          'bg-gradient-to-br from-[#8B9FE8] to-[#A5B6F0] text-[#0D1225]',
          'shadow-[0_4px_16px_rgba(139,159,232,0.40)]',
          'hover:shadow-[0_6px_24px_rgba(139,159,232,0.55)] hover:brightness-110',
        ].join(' '),
        destructive: [
          'bg-gradient-to-br from-[#F87171] to-[#FCA5A5] text-white',
          'shadow-[0_4px_12px_rgba(248,113,113,0.35)]',
          'hover:shadow-[0_6px_20px_rgba(248,113,113,0.5)] hover:brightness-110',
        ].join(' '),
        outline: [
          'border border-[rgba(139,159,232,0.30)] bg-[rgba(139,159,232,0.06)] text-[#D4DAEB]',
          'backdrop-blur-sm',
          'hover:bg-[rgba(139,159,232,0.12)] hover:border-[rgba(139,159,232,0.50)] hover:text-white',
        ].join(' '),
        secondary: [
          'bg-[rgba(139,159,232,0.10)] text-[#D4DAEB] border border-[rgba(139,159,232,0.20)]',
          'hover:bg-[rgba(139,159,232,0.18)] hover:border-[rgba(139,159,232,0.38)] hover:text-white',
        ].join(' '),
        ghost: [
          'text-[#D4DAEB]',
          'hover:bg-[rgba(139,159,232,0.10)] hover:text-white',
        ].join(' '),
        link: 'text-[#A5B6F0] underline-offset-4 hover:underline hover:text-[#C5D2F8] p-0 h-auto',
        success: [
          'bg-[rgba(52,211,153,0.15)] text-[#6EDEB8] border border-[rgba(52,211,153,0.35)]',
          'hover:bg-[rgba(52,211,153,0.25)] hover:text-[#34D399]',
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
