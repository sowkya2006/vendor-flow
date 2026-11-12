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
          'bg-[#6B8F8A] text-white',
          'shadow-[0_2px_8px_rgba(107,143,138,0.35)]',
          'hover:bg-[#5A7E79] hover:shadow-[0_4px_16px_rgba(107,143,138,0.40)]',
        ].join(' '),
        destructive: [
          'bg-[#E05252] text-white',
          'shadow-[0_2px_6px_rgba(224,82,82,0.30)]',
          'hover:bg-[#C94040]',
        ].join(' '),
        outline: [
          'border border-[rgba(0,0,0,0.14)] bg-white text-[#374151]',
          'hover:bg-[rgba(107,143,138,0.08)] hover:border-[rgba(107,143,138,0.40)] hover:text-[#2D3748]',
        ].join(' '),
        secondary: [
          'bg-[rgba(107,143,138,0.10)] text-[#374151] border border-[rgba(107,143,138,0.20)]',
          'hover:bg-[rgba(107,143,138,0.18)] hover:border-[rgba(107,143,138,0.35)]',
        ].join(' '),
        ghost: [
          'text-[#64748B]',
          'hover:bg-[rgba(107,143,138,0.08)] hover:text-[#2D3748]',
        ].join(' '),
        link: 'text-[#6B8F8A] underline-offset-4 hover:underline hover:text-[#5A7E79] p-0 h-auto',
        success: [
          'bg-[rgba(107,143,138,0.12)] text-[#3D7A74] border border-[rgba(107,143,138,0.28)]',
          'hover:bg-[rgba(107,143,138,0.22)]',
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
