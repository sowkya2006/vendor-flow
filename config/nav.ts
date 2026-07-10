// ============================================================
// VendorFlow — Navigation Configuration
// All sidebar nav items are defined here and referenced by
// the Sidebar component. No nav logic lives in components.
// ============================================================

export interface NavItem {
  label: string
  href: string
  iconName: string // Lucide icon name
  badge?: string | number
  children?: NavItem[]
}

export interface NavGroup {
  label?: string
  items: NavItem[]
}

export const mainNav: NavGroup[] = [
  {
    items: [
      { label: 'Dashboard', href: '/dashboard', iconName: 'LayoutDashboard' },
    ],
  },
  {
    label: 'Procurement',
    items: [
      { label: 'Vendors', href: '/vendors', iconName: 'Building2' },
      { label: 'Products', href: '/products', iconName: 'Package' },
      { label: 'RFQs', href: '/rfqs', iconName: 'FileText' },
      { label: 'Quotations', href: '/quotations', iconName: 'FileSearch' },
      { label: 'Purchase Orders', href: '/purchase-orders', iconName: 'ShoppingCart' },
    ],
  },
  {
    label: 'Operations',
    items: [
      { label: 'Inventory', href: '/inventory', iconName: 'Warehouse' },
    ],
  },
  {
    label: 'Finance',
    items: [
      { label: 'Finance Dashboard', href: '/payments', iconName: 'CreditCard' },
      { label: 'Invoices', href: '/payments/invoices', iconName: 'FileText' },
      { label: 'Outstanding', href: '/payments/outstanding', iconName: 'TrendingDown' },
      { label: 'Overdue', href: '/payments/overdue', iconName: 'AlertTriangle' },
      { label: 'Payment History', href: '/payments/history', iconName: 'History' },
      { label: 'Vendor Balances', href: '/payments/vendors', iconName: 'Building2' },
    ],
  },
  {
    label: 'Approvals',
    items: [
      { label: 'Approvals', href: '/approvals', iconName: 'ClipboardList' },
      { label: 'Pending', href: '/approvals/pending', iconName: 'Clock' },
      { label: 'Workflows', href: '/approval-workflows', iconName: 'GitBranch' },
      { label: 'Audit Log', href: '/audit-log', iconName: 'ShieldCheck' },
    ],
  },
  {
    label: 'Insights',
    items: [
      { label: 'Executive Dashboard', href: '/analytics', iconName: 'BarChart3' },
      { label: 'Procurement', href: '/analytics/procurement', iconName: 'ShoppingCart' },
      { label: 'Vendors', href: '/analytics/vendors', iconName: 'Building2' },
      { label: 'Inventory', href: '/analytics/inventory', iconName: 'Warehouse' },
      { label: 'Finance', href: '/analytics/finance', iconName: 'CreditCard' },
      { label: 'Approvals', href: '/analytics/approvals', iconName: 'ClipboardList' },
    ],
  },
  {
    label: 'System',
    items: [
      { label: 'Settings', href: '/settings', iconName: 'Settings' },
      { label: 'Employees', href: '/settings/employees', iconName: 'Users' },
      { label: 'Roles & Permissions', href: '/settings/roles', iconName: 'ShieldCheck' },
      { label: 'Workspace', href: '/settings/workspace', iconName: 'Building2' },
    ],
  },
]
