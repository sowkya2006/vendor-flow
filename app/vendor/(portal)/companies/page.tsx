import type { Metadata } from 'next'
import { Suspense } from 'react'
import { Building2, Send, CheckCircle2, Clock, XCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getPublicCompanies, getVendorCompanyByUserId, getVendorCollaborationRequests } from '@/lib/supabase/vendor-registration'
import { sendCollaborationRequestAction, withdrawCollaborationRequestAction } from '@/app/vendor/actions'
import { redirect } from 'next/navigation'
import { Skeleton } from '@/components/shared/loading-states'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export const metadata: Metadata = { title: 'Discover Companies' }

const STATUS_ICON: Record<string, React.ReactNode> = {
  pending:  <Clock className="h-3.5 w-3.5 text-amber-500" />,
  accepted: <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />,
  rejected: <XCircle className="h-3.5 w-3.5 text-red-500" />,
}
const STATUS_STYLE: Record<string, string> = {
  pending:  'bg-amber-50 border-amber-200 text-amber-700',
  accepted: 'bg-emerald-50 border-emerald-200 text-emerald-700',
  rejected: 'bg-red-50 border-red-200 text-red-700',
  withdrawn:'bg-gray-50 border-gray-200 text-gray-600',
}

async function CompaniesContent() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/vendor/login')

  const vendorCompany = await getVendorCompanyByUserId(user.id)
  if (!vendorCompany) redirect('/vendor/register')

  const [{ data: companies }, existingRequests] = await Promise.all([
    getPublicCompanies(1, 50),
    getVendorCollaborationRequests(user.id),
  ])

  const requestMap = new Map(existingRequests.map(r => [r.company_id, r]))

  return (
    <div className="space-y-4">
      <p className="text-xs text-[--color-foreground-muted]">
        {companies.length} registered {companies.length === 1 ? 'company' : 'companies'} on VendorFlow
      </p>

      {companies.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[--color-border] py-16 text-center">
          <Building2 className="h-10 w-10 text-[--color-foreground-subtle] mx-auto mb-3" />
          <p className="text-sm font-medium text-[--color-foreground]">No companies yet</p>
          <p className="text-xs text-[--color-foreground-muted] mt-1">
            Companies will appear here once they register on VendorFlow.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {companies.map((company) => {
            const request = requestMap.get(company.id)
            const isAccepted = request?.status === 'accepted'

            return (
              <div key={company.id} className={cn(
                'rounded-xl border bg-[--color-card] p-5 shadow-[--shadow-sm] flex flex-col gap-3',
                isAccepted ? 'border-emerald-300' : 'border-[--color-border]',
              )}>
                {/* Company info */}
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[--color-primary]/10 text-[--color-primary] text-sm font-bold">
                    {(company.workspace_name ?? company.name)[0].toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[--color-foreground] truncate">
                      {company.workspace_name ?? company.name}
                    </p>
                    {company.industry && (
                      <p className="text-xs text-[--color-foreground-muted] capitalize">{company.industry}</p>
                    )}
                    {company.address && (
                      <p className="text-xs text-[--color-foreground-subtle] truncate">{company.address}</p>
                    )}
                  </div>
                </div>

                {/* Request status / action */}
                {request ? (
                  <div className="mt-auto space-y-2">
                    <div className={cn('flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium', STATUS_STYLE[request.status] ?? STATUS_STYLE.pending)}>
                      {STATUS_ICON[request.status]}
                      <span className="capitalize">{request.status === 'accepted' ? '✓ Collaboration active' : `Request ${request.status}`}</span>
                    </div>
                    {request.status === 'pending' && (
                      <form action={withdrawCollaborationRequestAction.bind(null, request.id)}>
                        <Button type="submit" size="sm" variant="outline" className="w-full text-xs">
                          Withdraw Request
                        </Button>
                      </form>
                    )}
                    {request.status === 'rejected' && (
                      <p className="text-xs text-[--color-foreground-muted] italic">
                        {request.rejection_reason ?? 'Request was declined.'}
                      </p>
                    )}
                  </div>
                ) : (
                  <form action={sendCollaborationRequestAction.bind(null, company.id, undefined)} className="mt-auto">
                    <Button type="submit" size="sm" className="w-full gap-1.5">
                      <Send className="h-3.5 w-3.5" />
                      Send Collaboration Request
                    </Button>
                  </form>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default function VendorCompaniesPage() {
  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[--color-primary]/10 text-[--color-primary]">
          <Building2 className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-[--color-foreground]">Discover Companies</h1>
          <p className="text-xs text-[--color-foreground-muted]">
            Find procurement companies and request collaboration
          </p>
        </div>
      </div>
      <Suspense fallback={<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-40 rounded-xl" />)}</div>}>
        <CompaniesContent />
      </Suspense>
    </div>
  )
}
