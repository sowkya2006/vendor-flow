import type { Metadata } from 'next'
import { Suspense } from 'react'
import { Send, Clock, CheckCircle2, XCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getVendorCollaborationRequests } from '@/lib/supabase/vendor-registration'
import { redirect } from 'next/navigation'
import { Skeleton } from '@/components/shared/loading-states'
import { formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'

export const metadata: Metadata = { title: 'My Requests' }

const STATUS: Record<string, { icon: React.ReactNode; style: string; label: string }> = {
  pending:  { icon: <Clock className="h-4 w-4" />,        style: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',   label: 'Pending' },
  accepted: { icon: <CheckCircle2 className="h-4 w-4" />, style: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', label: 'Accepted' },
  rejected: { icon: <XCircle className="h-4 w-4" />,      style: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',           label: 'Rejected' },
  withdrawn:{ icon: <XCircle className="h-4 w-4" />,      style: 'bg-gray-100 text-gray-600',                                               label: 'Withdrawn' },
}

async function RequestsContent() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/vendor/login')
  const requests = await getVendorCollaborationRequests(user.id)

  const counts = {
    pending:  requests.filter(r => r.status === 'pending').length,
    accepted: requests.filter(r => r.status === 'accepted').length,
    rejected: requests.filter(r => r.status === 'rejected').length,
  }

  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {Object.entries(counts).map(([status, count]) => (
          <div key={status} className="rounded-xl border border-[--color-border] bg-[--color-card] px-4 py-3 text-center shadow-[--shadow-sm]">
            <p className="text-2xl font-bold text-[--color-foreground]">{count}</p>
            <p className="text-xs font-medium text-[--color-foreground-muted] capitalize">{status}</p>
          </div>
        ))}
      </div>

      {requests.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[--color-border] py-16 text-center">
          <Send className="h-10 w-10 text-[--color-foreground-subtle] mx-auto mb-3" />
          <p className="text-sm font-medium text-[--color-foreground]">No requests yet</p>
          <p className="text-xs text-[--color-foreground-muted] mt-1">
            Discover companies and send collaboration requests to get started.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-[--color-border] bg-[--color-card] overflow-hidden shadow-[--shadow-sm]">
          <div className="divide-y divide-[--color-border]">
            {requests.map((req) => {
              const s = STATUS[req.status] ?? STATUS.pending
              const company = req.company as { name: string; workspace_name: string | null } | null
              return (
                <div key={req.id} className="flex items-start gap-4 px-5 py-4">
                  <div className={cn('flex items-center justify-center h-9 w-9 rounded-lg shrink-0', s.style)}>
                    {s.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[--color-foreground]">
                      {company?.workspace_name ?? company?.name ?? 'Unknown Company'}
                    </p>
                    {req.message && (
                      <p className="text-xs text-[--color-foreground-muted] mt-0.5 italic">"{req.message}"</p>
                    )}
                    {req.status === 'rejected' && req.rejection_reason && (
                      <p className="text-xs text-red-600 mt-0.5">Reason: {req.rejection_reason}</p>
                    )}
                    <p className="text-xs text-[--color-foreground-subtle] mt-1">{formatDate(req.created_at)}</p>
                  </div>
                  <span className={cn('shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium', s.style)}>
                    {s.label}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export default function VendorRequestsPage() {
  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[--color-primary]/10 text-[--color-primary]">
          <Send className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-[--color-foreground]">My Requests</h1>
          <p className="text-xs text-[--color-foreground-muted]">Track your collaboration requests to companies</p>
        </div>
      </div>
      <Suspense fallback={<div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>}>
        <RequestsContent />
      </Suspense>
    </div>
  )
}
