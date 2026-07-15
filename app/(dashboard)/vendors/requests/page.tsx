import type { Metadata } from 'next'
import { Suspense } from 'react'
import { Building2, CheckCircle2, XCircle, Clock } from 'lucide-react'
import { getCompanyId, getUser } from '@/lib/supabase/get-auth'
import { getIncomingCollaborationRequests, acceptCollaborationRequest, rejectCollaborationRequest } from '@/lib/supabase/vendor-registration'
import { revalidatePath } from 'next/cache'
import { Skeleton } from '@/components/shared/loading-states'
import { formatDate } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export const metadata: Metadata = { title: 'Vendor Collaboration Requests' }

// ── Server actions (inline for this page) ────────────────────
async function acceptAction(requestId: string) {
  'use server'
  const user = await getUser()
  const companyId = await getCompanyId()

  // Get vendor details before accepting (for the notification)
  const { getIncomingCollaborationRequests } = await import('@/lib/supabase/vendor-registration')
  const requests = await getIncomingCollaborationRequests(companyId)
  const req = requests.find(r => r.id === requestId)
  const vc = req?.vendor_company as { id: string; company_name: string; email: string; user_id: string } | null

  await acceptCollaborationRequest(requestId, user.id)

  // Notify company admins
  const { notifyAllWithRole } = await import('@/lib/supabase/notifications')
  await notifyAllWithRole(companyId, 'administrator', {
    type: 'vendor_approved',
    title: 'Vendor collaboration accepted',
    message: `${vc?.company_name ?? 'A vendor'} has been accepted as a vendor. They can now receive RFQs.`,
    link: '/vendors',
    entityType: 'vendor',
  })

  // Notify the vendor directly — they need to know their request was accepted
  if (vc?.user_id) {
    try {
      const { createAdminClient } = await import('@/lib/supabase/admin')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const db = createAdminClient() as any
      await db.from('approval_notifications').insert({
        company_id: companyId,
        recipient_id: vc.user_id,
        request_id: null,
        type: 'vendor_approved',
        title: 'Collaboration Request Accepted! 🎉',
        body: `Your collaboration request has been accepted. You can now receive RFQs, submit quotations, and work with this company on VendorFlow.`,
        link: '/vendor/companies',
        entity_type: 'vendor_request',
        entity_id: requestId,
        is_read: false,
        sent_at: new Date().toISOString(),
      })
    } catch { /* non-critical */ }
  }

  revalidatePath('/vendors/requests')
  revalidatePath('/vendors')
}

async function rejectAction(requestId: string, reason: string) {
  'use server'
  const user = await getUser()
  const companyId = await getCompanyId()

  // Get vendor details before rejecting
  const { getIncomingCollaborationRequests } = await import('@/lib/supabase/vendor-registration')
  const requests = await getIncomingCollaborationRequests(companyId)
  const req = requests.find(r => r.id === requestId)
  const vc = req?.vendor_company as { id: string; company_name: string; user_id: string } | null

  await rejectCollaborationRequest(requestId, user.id, reason || undefined)

  // Notify the vendor that their request was rejected
  if (vc?.user_id) {
    try {
      const { createAdminClient } = await import('@/lib/supabase/admin')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const db = createAdminClient() as any
      await db.from('approval_notifications').insert({
        company_id: companyId,
        recipient_id: vc.user_id,
        request_id: null,
        type: 'vendor_rejected',
        title: 'Collaboration Request Not Accepted',
        body: `Your collaboration request was not accepted at this time. Reason: ${reason || 'Not specified'}. You can try sending a request to other companies.`,
        link: '/vendor/companies',
        entity_type: 'vendor_request',
        entity_id: requestId,
        is_read: false,
        sent_at: new Date().toISOString(),
      })
    } catch { /* non-critical */ }
  }

  revalidatePath('/vendors/requests')
}

async function RequestsList() {
  const companyId = await getCompanyId()
  const [pending, all] = await Promise.all([
    getIncomingCollaborationRequests(companyId, 'pending'),
    getIncomingCollaborationRequests(companyId),
  ])

  const counts = {
    pending:  all.filter(r => r.status === 'pending').length,
    accepted: all.filter(r => r.status === 'accepted').length,
    rejected: all.filter(r => r.status === 'rejected').length,
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-center dark:border-amber-800 dark:bg-amber-900/10">
          <p className="text-2xl font-bold text-amber-700 dark:text-amber-400">{counts.pending}</p>
          <p className="text-xs font-medium text-amber-600">Pending</p>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-center dark:border-emerald-800 dark:bg-emerald-900/10">
          <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">{counts.accepted}</p>
          <p className="text-xs font-medium text-emerald-600">Accepted</p>
        </div>
        <div className="rounded-xl border border-[--color-border] bg-[--color-card] px-4 py-3 text-center">
          <p className="text-2xl font-bold text-[--color-foreground]">{counts.rejected}</p>
          <p className="text-xs font-medium text-[--color-foreground-muted]">Rejected</p>
        </div>
      </div>

      {/* Pending requests — action required */}
      {pending.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-[--color-card] overflow-hidden shadow-[--shadow-sm]">
          <div className="flex items-center gap-2 border-b border-amber-200 bg-amber-50 px-5 py-3 dark:bg-amber-900/10">
            <Clock className="h-4 w-4 text-amber-600" />
            <h2 className="text-sm font-semibold text-amber-700 dark:text-amber-400">
              Pending Requests ({pending.length})
            </h2>
          </div>
          <div className="divide-y divide-[--color-border]">
            {pending.map((req) => {
              const vc = req.vendor_company as {
                company_name: string; contact_name: string | null
                email: string; phone: string | null; industry: string | null
                description: string | null
              } | null
              return (
                <div key={req.id} className="p-5 space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[--color-primary]/10 text-[--color-primary] font-bold text-sm">
                        {(vc?.company_name ?? 'V')[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[--color-foreground]">{vc?.company_name ?? '—'}</p>
                        <p className="text-xs text-[--color-foreground-muted]">{vc?.email}</p>
                        {vc?.industry && <p className="text-xs text-[--color-foreground-subtle] capitalize">{vc.industry}</p>}
                      </div>
                    </div>
                    <p className="text-xs text-[--color-foreground-subtle] shrink-0">{formatDate(req.created_at)}</p>
                  </div>

                  {req.message && (
                    <div className="rounded-lg bg-[--color-background-subtle] px-4 py-3">
                      <p className="text-xs font-medium text-[--color-foreground-muted] mb-1">Message from vendor:</p>
                      <p className="text-sm text-[--color-foreground] italic">"{req.message}"</p>
                    </div>
                  )}

                  {vc?.description && (
                    <p className="text-xs text-[--color-foreground-muted]">{vc.description}</p>
                  )}

                  <div className="flex gap-2">
                    <form action={acceptAction.bind(null, req.id)} className="flex-1">
                      <Button type="submit" size="sm" className="w-full gap-1.5">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Accept & Add to Vendors
                      </Button>
                    </form>
                    <form action={rejectAction.bind(null, req.id, 'Not a suitable match at this time.')} className="flex-1">
                      <Button type="submit" size="sm" variant="outline" className="w-full text-red-600 border-red-200 hover:bg-red-50 gap-1.5">
                        <XCircle className="h-3.5 w-3.5" />
                        Reject
                      </Button>
                    </form>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* All requests history */}
      {all.filter(r => r.status !== 'pending').length > 0 && (
        <div className="rounded-xl border border-[--color-border] bg-[--color-card] overflow-hidden shadow-[--shadow-sm]">
          <div className="border-b border-[--color-border] px-5 py-4">
            <h2 className="text-sm font-semibold text-[--color-foreground]">Request History</h2>
          </div>
          <div className="divide-y divide-[--color-border]">
            {all.filter(r => r.status !== 'pending').map((req) => {
              const vc = req.vendor_company as { company_name: string; email: string } | null
              const statusStyles: Record<string, string> = {
                accepted: 'bg-emerald-100 text-emerald-700',
                rejected: 'bg-red-100 text-red-700',
                withdrawn: 'bg-gray-100 text-gray-600',
              }
              return (
                <div key={req.id} className="flex items-center justify-between gap-3 px-5 py-3">
                  <div>
                    <p className="text-sm font-medium text-[--color-foreground]">{vc?.company_name ?? '—'}</p>
                    <p className="text-xs text-[--color-foreground-muted]">{vc?.email}</p>
                  </div>
                  <div className="text-right">
                    <span className={cn('rounded-full px-2 py-0.5 text-[11px] font-medium capitalize', statusStyles[req.status] ?? 'bg-gray-100 text-gray-600')}>
                      {req.status}
                    </span>
                    <p className="text-xs text-[--color-foreground-subtle] mt-0.5">{formatDate(req.created_at)}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {all.length === 0 && (
        <div className="rounded-xl border border-dashed border-[--color-border] py-16 text-center">
          <Building2 className="h-10 w-10 text-[--color-foreground-subtle] mx-auto mb-3" />
          <p className="text-sm font-medium text-[--color-foreground]">No requests yet</p>
          <p className="text-xs text-[--color-foreground-muted] mt-1">
            When vendors request to collaborate with you, they'll appear here.
          </p>
        </div>
      )}
    </div>
  )
}

export default function VendorRequestsCompanyPage() {
  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[--color-primary]/10 text-[--color-primary]">
          <Building2 className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-[--color-foreground]">Vendor Collaboration Requests</h1>
          <p className="text-xs text-[--color-foreground-muted]">
            Review and accept vendor collaboration requests
          </p>
        </div>
      </div>
      <Suspense fallback={<div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-40 rounded-xl" />)}</div>}>
        <RequestsList />
      </Suspense>
    </div>
  )
}
