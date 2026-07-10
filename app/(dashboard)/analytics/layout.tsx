import { BarChart3 } from 'lucide-react'
import { AnalyticsSubNav } from '@/components/analytics/analytics-sub-nav'

export default function AnalyticsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-full">
      <div className="mx-auto max-w-screen-2xl space-y-6 p-6">
        {/* Page header */}
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[--color-primary]/10 text-[--color-primary]">
            <BarChart3 className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-[--color-foreground]">Analytics & Reports</h1>
            <p className="text-xs text-[--color-foreground-muted]">Live data across all VendorFlow modules</p>
          </div>
        </div>

        {/* Sub-navigation */}
        <AnalyticsSubNav />

        {/* Page content */}
        {children}
      </div>
    </div>
  )
}
