import { Suspense } from 'react'
import { getCurrentUserRole } from '@/lib/supabase/roles'
import { Skeleton } from '@/components/shared/loading-states'

// Role-specific quick-action links
const ROLE_QUICK_LINKS: Record<string, Array<{ label: string; href: string }>> = {
  procurement_manager: [
    { label: 'New RFQ', href: '/rfqs/new' },
    { label: 'New PO', href: '/purchase-orders/new' },
    { label: 'Approve Quotations', href: '/quotations' },
    { label: 'Analytics', href: '/analytics/procurement' },
  ],
  procurement_officer: [
    { label: 'New RFQ', href: '/rfqs/new' },
    { label: 'New Quotation', href: '/quotations/new' },
    { label: 'View POs', href: '/purchase-orders' },
  ],
  warehouse_manager: [
    { label: 'Inventory', href: '/inventory' },
    { label: 'New GRN', href: '/inventory/grn/new' },
    { label: 'Stock Alerts', href: '/inventory?filter=low_stock' },
    { label: 'Analytics', href: '/analytics/inventory' },
  ],
  finance_manager: [
    { label: 'Invoices', href: '/payments/invoices' },
    { label: 'Outstanding', href: '/payments/outstanding' },
    { label: 'Record Payment', href: '/payments/invoices' },
    { label: 'Finance Analytics', href: '/analytics/finance' },
  ],
}

async function RoleQuickLinks() {
  const userRole = await getCurrentUserRole()
  if (!userRole) return null

  const links = ROLE_QUICK_LINKS[userRole.role]
  if (!links) return null

  return (
    <div className="flex flex-wrap gap-2 mb-4 px-6 pt-2">
      {links.map((link) => (
        <a
          key={link.href}
          href={link.href}
          className="rounded-full border border-[--color-border] bg-[--color-card] px-3 py-1.5 text-xs font-medium text-[--color-foreground-muted] transition-colors hover:border-[--color-primary]/50 hover:text-[--color-primary] shadow-sm"
        >
          {link.label}
        </a>
      ))}
    </div>
  )
}

/** Drop this anywhere in the dashboard to get role-contextual quick links */
export function RoleDashboardRouter() {
  return (
    <Suspense fallback={null}>
      <RoleQuickLinks />
    </Suspense>
  )
}
