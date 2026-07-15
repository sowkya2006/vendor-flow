import { Skeleton } from '@/components/shared/loading-states'

export default function PRDetailLoading() {
  return (
    <div className="min-h-full">
      {/* Header skeleton */}
      <div className="border-b border-[--color-border] bg-[--color-background] px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-6 w-64" />
            <Skeleton className="h-3.5 w-40" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-8 w-20 rounded-md" />
            <Skeleton className="h-8 w-20 rounded-md" />
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Main content */}
          <div className="space-y-6 lg:col-span-2">
            {/* Actions card skeleton */}
            <div className="rounded-xl border border-[--color-border] bg-[--color-card] p-5">
              <Skeleton className="h-3.5 w-20 mb-3" />
              <div className="flex gap-2">
                <Skeleton className="h-8 w-32 rounded-md" />
                <Skeleton className="h-8 w-24 rounded-md" />
              </div>
            </div>

            {/* Description skeleton */}
            <div className="rounded-xl border border-[--color-border] bg-[--color-card] p-6">
              <Skeleton className="h-4 w-28 mb-3" />
              <Skeleton className="h-3 w-full mb-2" />
              <Skeleton className="h-3 w-5/6 mb-2" />
              <Skeleton className="h-3 w-4/6" />
            </div>

            {/* Items table skeleton */}
            <div className="rounded-xl border border-[--color-border] bg-[--color-card] overflow-hidden">
              <div className="border-b border-[--color-border] px-6 py-4 flex items-center justify-between">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
              <div className="divide-y divide-[--color-border]">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4 px-6 py-3">
                    <Skeleton className="h-3.5 flex-1" />
                    <Skeleton className="h-3.5 w-16" />
                    <Skeleton className="h-3.5 w-16" />
                    <Skeleton className="h-3.5 w-20" />
                    <Skeleton className="h-3.5 w-20" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <div className="rounded-xl border border-[--color-border] bg-[--color-card] p-5">
              <Skeleton className="h-3.5 w-16 mb-3" />
              <div className="flex gap-2">
                <Skeleton className="h-5 w-20 rounded-full" />
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
            </div>
            <div className="rounded-xl border border-[--color-border] bg-[--color-card] p-5 space-y-3">
              <Skeleton className="h-3.5 w-16 mb-1" />
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-start gap-3 py-2">
                  <Skeleton className="h-7 w-7 rounded-md shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-2.5 w-16" />
                    <Skeleton className="h-3.5 w-28" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
