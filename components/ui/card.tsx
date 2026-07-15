import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const cardVariants = cva(
  [
    'rounded-2xl border bg-[--color-card] text-[--color-card-foreground] relative overflow-hidden',
    'transition-all duration-200',
  ].join(' '),
  {
    variants: {
      variant: {
        default: [
          'border-[--color-border] shadow-[0_4px_24px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.06)]',
        ].join(' '),
        flat: 'border-[--color-border] shadow-none',
        elevated: [
          'border-[--color-border-strong] shadow-[0_8px_32px_rgba(0,0,0,0.5)]',
        ].join(' '),
        interactive: [
          'border-[--color-border] shadow-[0_4px_24px_rgba(0,0,0,0.4)] cursor-pointer',
          'hover:-translate-y-1 hover:shadow-[0_8px_32px_rgba(0,0,0,0.5)] hover:border-[--color-border-strong]',
          'active:translate-y-0',
        ].join(' '),
        outlined: 'shadow-none border-2 border-[--color-border]',
        ghost: 'border-transparent shadow-none bg-transparent',
      },
    },
    defaultVariants: { variant: 'default' },
  }
)

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(cardVariants({ variant }), className)}
      {...props}
    />
  )
)
Card.displayName = 'Card'

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex flex-col space-y-1 p-5 pb-0', className)}
      {...props}
    />
  )
)
CardHeader.displayName = 'CardHeader'

const CardTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn('text-[15px] font-semibold leading-snug tracking-tight text-[--color-foreground]', className)}
      {...props}
    />
  )
)
CardTitle.displayName = 'CardTitle'

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn('text-xs text-[--color-foreground-muted] leading-relaxed', className)}
    {...props}
  />
))
CardDescription.displayName = 'CardDescription'

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('p-5 pt-4', className)} {...props} />
  )
)
CardContent.displayName = 'CardContent'

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'flex items-center p-5 pt-0 border-t border-[--color-border] mt-4',
        className
      )}
      {...props}
    />
  )
)
CardFooter.displayName = 'CardFooter'

const CardDivider = React.forwardRef<HTMLHRElement, React.HTMLAttributes<HTMLHRElement>>(
  ({ className, ...props }, ref) => (
    <hr ref={ref} className={cn('border-[--color-border] mx-5', className)} {...props} />
  )
)
CardDivider.displayName = 'CardDivider'

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent, CardDivider, cardVariants }
