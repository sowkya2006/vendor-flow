'use client'

import * as React from 'react'
import * as SelectPrimitive from '@radix-ui/react-select'
import { Check, ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'

const Select = SelectPrimitive.Root
const SelectGroup = SelectPrimitive.Group
const SelectValue = SelectPrimitive.Value

// ── Trigger ───────────────────────────────────────────────────────────────────
const SelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Trigger
    ref={ref}
    className={cn(
      'flex h-9 w-full items-center justify-between gap-2 whitespace-nowrap',
      'rounded-lg border border-white/[0.12] bg-white/[0.06] px-3 py-2 text-sm text-[#E5E7EB]',
      'hover:border-white/[0.22] transition-colors duration-150',
      'focus:outline-none focus:ring-2 focus:ring-[#4F8CFF]/50 focus:ring-offset-0',
      'disabled:cursor-not-allowed disabled:opacity-50',
      '[&>span]:line-clamp-1 [&>span]:flex-1 [&>span]:text-left',
      className,
    )}
    {...props}
  >
    {children}
    <SelectPrimitive.Icon asChild>
      <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-50" />
    </SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
))
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName

// ── Scroll buttons ────────────────────────────────────────────────────────────
const SelectScrollUpButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollUpButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollUpButton>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollUpButton
    ref={ref}
    className={cn('flex cursor-default items-center justify-center py-1 text-[#6B7280]', className)}
    {...props}
  >
    <ChevronUp className="h-3.5 w-3.5" />
  </SelectPrimitive.ScrollUpButton>
))
SelectScrollUpButton.displayName = SelectPrimitive.ScrollUpButton.displayName

const SelectScrollDownButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollDownButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollDownButton>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollDownButton
    ref={ref}
    className={cn('flex cursor-default items-center justify-center py-1 text-[#6B7280]', className)}
    {...props}
  >
    <ChevronDown className="h-3.5 w-3.5" />
  </SelectPrimitive.ScrollDownButton>
))
SelectScrollDownButton.displayName = SelectPrimitive.ScrollDownButton.displayName

// ── Content ───────────────────────────────────────────────────────────────────
// bg-[#0f1623] is hardcoded dark — never depends on the .dark class.
// This is the fix for white-background dropdowns.
const SelectContent = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ className, children, position = 'popper', ...props }, ref) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      ref={ref}
      className={cn(
        'relative z-[9999] max-h-[min(24rem,var(--radix-select-content-available-height))]',
        'min-w-[var(--radix-select-trigger-width)] overflow-hidden',
        'rounded-xl border border-white/[0.08]',
        // Hardcoded dark — no bg-white/dark: flip
        'bg-[#0f1623] text-[#F5F5F5]',
        'shadow-[0_16px_48px_rgba(0,0,0,0.65),0_4px_12px_rgba(0,0,0,0.45)]',
        'backdrop-blur-xl',
        // Animations
        'data-[state=open]:animate-in data-[state=closed]:animate-out',
        'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
        'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
        'data-[side=bottom]:slide-in-from-top-1',
        'data-[side=top]:slide-in-from-bottom-1',
        'data-[side=left]:slide-in-from-right-1',
        'data-[side=right]:slide-in-from-left-1',
        position === 'popper' && [
          'data-[side=bottom]:translate-y-1',
          'data-[side=top]:-translate-y-1',
          'data-[side=left]:-translate-x-1',
          'data-[side=right]:translate-x-1',
        ],
        className,
      )}
      avoidCollisions
      position={position}
      {...props}
    >
      <SelectScrollUpButton />
      <SelectPrimitive.Viewport
        className={cn(
          'p-1.5',
          position === 'popper' && 'w-full min-w-[var(--radix-select-trigger-width)]',
        )}
      >
        {children}
      </SelectPrimitive.Viewport>
      <SelectScrollDownButton />
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
))
SelectContent.displayName = SelectPrimitive.Content.displayName

// ── Label ─────────────────────────────────────────────────────────────────────
const SelectLabel = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Label>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Label
    ref={ref}
    className={cn(
      'px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#6B7280]',
      className,
    )}
    {...props}
  />
))
SelectLabel.displayName = SelectPrimitive.Label.displayName

// ── Item ──────────────────────────────────────────────────────────────────────
const SelectItem = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={cn(
      'relative flex w-full cursor-pointer select-none items-center',
      'rounded-lg py-2 pl-3 pr-9 text-sm',
      'text-[#E5E7EB] outline-none',
      'transition-colors duration-100',
      'focus:bg-white/[0.08] focus:text-white',
      'hover:bg-white/[0.08] hover:text-white',
      'data-[disabled]:pointer-events-none data-[disabled]:opacity-40',
      className,
    )}
    {...props}
  >
    <span className="absolute right-3 flex h-4 w-4 items-center justify-center">
      <SelectPrimitive.ItemIndicator>
        <Check className="h-3.5 w-3.5 text-[#4F8CFF]" />
      </SelectPrimitive.ItemIndicator>
    </span>
    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
  </SelectPrimitive.Item>
))
SelectItem.displayName = SelectPrimitive.Item.displayName

// ── Separator ─────────────────────────────────────────────────────────────────
const SelectSeparator = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Separator
    ref={ref}
    className={cn('-mx-1 my-1 h-px bg-white/[0.07]', className)}
    {...props}
  />
))
SelectSeparator.displayName = SelectPrimitive.Separator.displayName

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton,
}
