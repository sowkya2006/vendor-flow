import { cn } from '@/lib/utils'

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Show a circular shape (e.g. for avatars) */
  circle?: boolean
}

/**
 * Skeleton — shimmer placeholder for loading states.
 * Uses the `.skeleton` utility defined in globals.css.
 */
export function Skeleton({ className, circle, ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        'skeleton',
        circle ? 'rounded-full' : 'rounded-md',
        className
      )}
      aria-hidden="true"
      {...props}
    />
  )
}

/** Skeleton row for table loading states */
export function SkeletonRow({ cols = 4 }: { cols?: number }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <Skeleton className={cn('h-4', i === 0 ? 'w-36' : 'w-24')} />
        </td>
      ))}
    </tr>
  )
}

/** Skeleton card for KPI / dashboard card loading */
export function SkeletonCard() {
  return (
    <div className="rounded-xl border border-[--color-border] bg-[--color-card] p-5 shadow-[var(--shadow-sm)]">
      <div className="flex items-start justify-between">
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-8 w-28" />
          <Skeleton className="h-3 w-32" />
        </div>
        <Skeleton circle className="h-10 w-10 mt-0.5" />
      </div>
      <div className="mt-4 flex items-center gap-2">
        <Skeleton className="h-5 w-14 rounded-full" />
        <Skeleton className="h-3 w-20" />
      </div>
    </div>
  )
}
