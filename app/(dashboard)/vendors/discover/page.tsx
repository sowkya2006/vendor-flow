import type { Metadata } from 'next'
import { Suspense } from 'react'
import { revalidatePath } from 'next/cache'
import {
  Building2, Search, Globe, Mail, Phone,
  CheckCircle2, Clock, XCircle, Sparkles, Send,
} from 'lucide-react'
import { getCompanyId, getUser } from '@/lib/supabase/get-auth'
import {
  getPublicVendorCompanies,
  getCollaborationStatus,
  sendCompanyToVendorRequest,
  type PublicVendorCompany,
} from '@/lib/supabase/vendor-registration'
import { PageContainer } from '@/components/shared/page-container'
import { WorkspaceHeader } from '@/components/layout/workspace-header'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/shared/loading-states'
import { cn } from '@/lib/utils'
import Link from 'next/link'

export const metadata: Metadata = { title: 'Discover Vendors — VendorFlow' }

const INDUSTRY_COLORS: Record<string, string> = {
  Manufacturing: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  Retail:        'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300',
  Technology:    'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  Healthcare:    'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  Construction:  'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  Logistics:     'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300',
  Education:     'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300',
  Finance:       'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300',
  Government:    'bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-300',
  Other:         'bg-[--color-muted] text-[--color-foreground-muted]',
}

// ── Server action ─────────────────────────────────────────────────────────────
async function inviteVendorAction(vendorCompanyId: string, message: string) {
  'use server'
  const companyId = await getCompanyId()
  const user = await getUser()
  await sendCompanyToVendorRequest(companyId, vendorCompanyId, message || undefined)

  // Notify the vendor
  try {
    const { notifyVendor } = await import('@/lib/notifications/engine')
    const { createAdminClient } = await import('@/lib/supabase/admin')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = createAdminClient() as any
    const { data: vc } = await db
      .from('vendor_companies')
      .select('company_name, user_id')
      .eq('id', vendorCompanyId)
      .maybeSingle()
    const { data: company } = await db
      .from('companies')
      .select('name')
      .eq('id', companyId)
      .maybeSingle()

    if (vc?.user_id) {
      await notifyVendor(vc.user_id, {
        type: 'vendor_request',
        title: `Collaboration Invitation from ${company?.name ?? 'a company'}`,
        body: `${company?.name ?? 'A procurement company'} has invited ${vc.company_name} to collaborate. Accept to start receiving RFQs and Purchase Orders.`,
        link: '/vendor/requests',
        entityType: 'vendor_request',
        entityId: vendorCompanyId,
        companyId,
      })
    }
  } catch { /* non-critical */ }

  revalidatePath('/vendors/discover')
  revalidatePath('/vendors')
}

// ── Vendor card with status ───────────────────────────────────────────────────
async function VendorDiscoverCard({
  vendor,
  companyId,
}: {
  vendor: PublicVendorCompany
  companyId: string
}) {
  const reqStatus = await getCollaborationStatus(companyId, vendor.id)
  const initials = vendor.company_name
    .split(' ')
    .map((w: string) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const industryColor = vendor.industry ? (INDUSTRY_COLORS[vendor.industry] ?? INDUSTRY_COLORS.Other) : INDUSTRY_COLORS.Other

  const statusBadge = reqStatus
    ? ({
        pending:  { label: 'Request Sent', cls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',   icon: Clock },
        accepted: { label: 'Collaborating', cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', icon: CheckCircle2 },
        rejected: { label: 'Declined',  cls: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',              icon: XCircle },
        withdrawn:{ label: 'Withdrawn', cls: 'bg-gray-100 text-gray-600',                                                  icon: XCircle },
      }[reqStatus.status] ?? null)
    : null

  return (
    <div className="relative flex flex-col gap-4 rounded-xl border border-[--color-border] bg-[--color-card] p-5 shadow-[--shadow-sm] transition-all hover:shadow-[--shadow-md] hover:border-[--color-primary]/30 hover:-translate-y-0.5">

      {/* Status badge top-right */}
      {statusBadge && (
        <div className={cn('absolute right-3 top-3 flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold', statusBadge.cls)}>
          <statusBadge.icon className="h-3 w-3" />
          {statusBadge.label}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[--color-primary]/10 text-sm font-bold text-[--color-primary]">
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-[--color-foreground]">
            {vendor.company_name}
          </p>
          {vendor.industry && (
            <span className={cn('mt-1 inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium', industryColor)}>
              {vendor.industry}
            </span>
          )}
        </div>
      </div>

      {/* Description */}
      {vendor.description && (
        <p className="text-xs text-[--color-foreground-muted] line-clamp-2 leading-relaxed">
          {vendor.description}
        </p>
      )}

      {/* Contact info */}
      <div className="space-y-1">
        {vendor.email && (
          <div className="flex items-center gap-1.5 text-xs text-[--color-foreground-muted] truncate">
            <Mail className="h-3.5 w-3.5 shrink-0" />{vendor.email}
          </div>
        )}
        {vendor.phone && (
          <div className="flex items-center gap-1.5 text-xs text-[--color-foreground-muted]">
            <Phone className="h-3.5 w-3.5 shrink-0" />{vendor.phone}
          </div>
        )}
        {vendor.website && (
          <div className="flex items-center gap-1.5 text-xs text-[--color-foreground-muted] truncate">
            <Globe className="h-3.5 w-3.5 shrink-0" />
            {vendor.website.replace(/^https?:\/\//, '')}
          </div>
        )}
      </div>

      {/* Action */}
      <div className="mt-auto pt-2 border-t border-[--color-border]">
        {!reqStatus && (
          <form action={inviteVendorAction.bind(null, vendor.id, '')}>
            <Button type="submit" size="sm" className="w-full gap-1.5">
              <Send className="h-3.5 w-3.5" />
              Invite to Collaborate
            </Button>
          </form>
        )}
        {reqStatus?.status === 'pending' && (
          <p className="text-center text-xs text-amber-600 font-medium">
            Waiting for vendor to respond
          </p>
        )}
        {reqStatus?.status === 'accepted' && (
          <div className="text-center space-y-1.5">
            <p className="text-xs text-emerald-600 font-medium flex items-center justify-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5" /> Vendor added to your network
            </p>
            <Button asChild size="sm" variant="outline" className="w-full">
              <Link href="/vendors">View in Vendors →</Link>
            </Button>
          </div>
        )}
        {reqStatus?.status === 'rejected' && (
          <form action={inviteVendorAction.bind(null, vendor.id, '')}>
            <Button type="submit" size="sm" variant="outline" className="w-full gap-1.5">
              <Send className="h-3.5 w-3.5" />
              Send New Request
            </Button>
          </form>
        )}
      </div>
    </div>
  )
}

// ── Vendor grid ───────────────────────────────────────────────────────────────
async function VendorDiscoverGrid({
  companyId,
  search,
  industry,
  page,
}: {
  companyId: string
  search: string
  industry: string
  page: number
}) {
  const { data: vendors, total } = await getPublicVendorCompanies(page, 12, search || undefined, industry || undefined)

  if (vendors.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-[--color-border] bg-[--color-background-subtle] py-20 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[--color-background-muted]">
          <Building2 className="h-7 w-7 text-[--color-foreground-subtle]" />
        </div>
        <div>
          <p className="text-[15px] font-semibold text-[--color-foreground]">
            {search || industry ? 'No vendors match your filters' : 'No vendors registered yet'}
          </p>
          <p className="mt-1 text-sm text-[--color-foreground-muted]">
            {search || industry
              ? 'Try adjusting your search or filter.'
              : 'Vendors who register on VendorFlow will appear here.'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-[--color-foreground-muted]">
        {total} vendor{total !== 1 ? 's' : ''} registered on VendorFlow
      </p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {vendors.map((vendor) => (
          <Suspense key={vendor.id} fallback={<Skeleton className="h-56 rounded-xl" />}>
            <VendorDiscoverCard vendor={vendor} companyId={companyId} />
          </Suspense>
        ))}
      </div>

      {/* Pagination */}
      {(page > 1 || total > page * 12) && (
        <div className="flex items-center justify-center gap-3 pt-4 border-t border-[--color-border]">
          <Button variant="outline" size="sm" asChild={page > 1} disabled={page <= 1}>
            {page > 1 ? (
              <Link href={`/vendors/discover?page=${page - 1}${industry ? `&industry=${industry}` : ''}${search ? `&search=${search}` : ''}`}>
                Previous
              </Link>
            ) : <span>Previous</span>}
          </Button>
          <span className="text-xs text-[--color-foreground-muted]">Page {page}</span>
          <Button variant="outline" size="sm" asChild={total > page * 12} disabled={!(total > page * 12)}>
            {total > page * 12 ? (
              <Link href={`/vendors/discover?page=${page + 1}${industry ? `&industry=${industry}` : ''}${search ? `&search=${search}` : ''}`}>
                Next
              </Link>
            ) : <span>Next</span>}
          </Button>
        </div>
      )}
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
const INDUSTRIES = ['Manufacturing', 'Retail', 'Technology', 'Healthcare', 'Construction', 'Logistics', 'Education', 'Finance', 'Government', 'Other']

interface PageProps {
  searchParams: Promise<{ search?: string; industry?: string; page?: string }>
}

export default async function DiscoverVendorsPage({ searchParams }: PageProps) {
  const params = await searchParams
  const search = params.search ?? ''
  const industry = params.industry ?? ''
  const page = Math.max(1, parseInt(params.page ?? '1', 10))
  const companyId = await getCompanyId()

  return (
    <div className="min-h-full">
      <WorkspaceHeader
        title="Discover Vendors"
        description="Browse all registered vendors and invite them to collaborate with your company."
        actions={
          <Button asChild variant="outline" size="sm">
            <Link href="/vendors/requests">
              <Building2 className="h-4 w-4 mr-1.5" />
              Incoming Requests
            </Link>
          </Button>
        }
      />
      <PageContainer>
        {/* Hero banner */}
        <div className="mb-6 rounded-2xl bg-gradient-to-br from-[--color-primary]/10 via-[--color-card] to-[--color-background-subtle] border border-[--color-border] px-6 py-6">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-5 w-5 text-[--color-primary]" />
            <span className="text-xs font-semibold text-[--color-primary] uppercase tracking-wide">Vendor Discovery</span>
          </div>
          <h2 className="text-xl font-bold text-[--color-foreground]">Find & Invite Vendors</h2>
          <p className="mt-1 text-sm text-[--color-foreground-muted]">
            Invite vendors to collaborate — once accepted, you can send them RFQs, issue Purchase Orders, and manage the full procurement cycle.
          </p>
        </div>

        {/* Search bar */}
        <form method="GET" action="/vendors/discover" className="mb-5 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[--color-foreground-muted]" />
            <input
              name="search"
              defaultValue={search}
              placeholder="Search vendors by name…"
              className="flex h-9 w-full rounded-md border border-[--color-input] bg-transparent pl-9 pr-3 text-sm placeholder:text-[--color-foreground-subtle] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--color-ring]"
            />
            {industry && <input type="hidden" name="industry" value={industry} />}
          </div>
          <Button type="submit" size="sm">Search</Button>
        </form>

        {/* Industry filter pills */}
        <div className="mb-6 flex flex-wrap gap-2">
          <Link
            href={`/vendors/discover${search ? `?search=${search}` : ''}`}
            className={cn(
              'rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
              !industry ? 'bg-[--color-primary] text-white' : 'bg-[--color-muted] text-[--color-foreground-muted] hover:bg-[--color-accent]',
            )}
          >
            All Industries
          </Link>
          {INDUSTRIES.map((ind) => (
            <Link
              key={ind}
              href={`/vendors/discover?industry=${ind}${search ? `&search=${search}` : ''}`}
              className={cn(
                'rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
                industry === ind ? 'bg-[--color-primary] text-white' : 'bg-[--color-muted] text-[--color-foreground-muted] hover:bg-[--color-accent]',
              )}
            >
              {ind}
            </Link>
          ))}
        </div>

        {/* Vendor grid */}
        <Suspense
          fallback={
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-56 rounded-xl" />)}
            </div>
          }
        >
          <VendorDiscoverGrid companyId={companyId} search={search} industry={industry} page={page} />
        </Suspense>
      </PageContainer>
    </div>
  )
}
