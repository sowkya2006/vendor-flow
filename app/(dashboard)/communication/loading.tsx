export default function CommunicationLoading() {
  return (
    <div className="flex h-[calc(100vh-3.5rem)] overflow-hidden">
      {/* Sidebar skeleton */}
      <div className="flex flex-col w-80 shrink-0 border-r border-[--color-border] bg-[--color-card]">
        <div className="border-b border-[--color-border] px-4 py-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="h-4 w-24 rounded bg-[--color-muted] animate-pulse" />
            <div className="h-7 w-16 rounded-md bg-[--color-muted] animate-pulse" />
          </div>
          <div className="h-8 w-full rounded-md bg-[--color-muted] animate-pulse" />
          <div className="flex gap-2">
            <div className="h-7 flex-1 rounded-md bg-[--color-muted] animate-pulse" />
            <div className="h-7 w-20 rounded-md bg-[--color-muted] animate-pulse" />
          </div>
        </div>
        <div className="divide-y divide-[--color-border]">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex gap-3 px-4 py-4">
              <div className="h-9 w-9 rounded-full bg-[--color-muted] animate-pulse shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="flex justify-between">
                  <div className="h-3.5 w-28 rounded bg-[--color-muted] animate-pulse" />
                  <div className="h-3 w-12 rounded bg-[--color-muted] animate-pulse" />
                </div>
                <div className="h-2.5 w-40 rounded bg-[--color-muted] animate-pulse" />
                <div className="h-2.5 w-full rounded bg-[--color-muted] animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Thread skeleton */}
      <div className="flex flex-1 flex-col bg-[--color-background-subtle]">
        <div className="flex items-center gap-3 border-b border-[--color-border] bg-[--color-card] px-5 py-3.5">
          <div className="h-9 w-9 rounded-full bg-[--color-muted] animate-pulse" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3.5 w-40 rounded bg-[--color-muted] animate-pulse" />
            <div className="h-2.5 w-56 rounded bg-[--color-muted] animate-pulse" />
          </div>
        </div>

        <div className="flex-1 px-5 py-5 space-y-4">
          {[false, true, false, true, false].map((isOwn, i) => (
            <div key={i} className={`flex gap-2.5 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className="h-7 w-7 rounded-full bg-[--color-muted] animate-pulse shrink-0 mt-1" />
              <div className="space-y-1 max-w-sm">
                <div className="h-2.5 w-20 rounded bg-[--color-muted] animate-pulse" />
                <div
                  className="rounded-2xl bg-[--color-muted] animate-pulse"
                  style={{ height: `${40 + (i % 3) * 20}px`, width: `${180 + (i % 4) * 40}px` }}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-[--color-border] bg-[--color-card] px-4 pb-4 pt-3">
          <div className="h-12 w-full rounded-xl bg-[--color-muted] animate-pulse" />
        </div>
      </div>
    </div>
  )
}
