// ============================================================
// VendorFlow — Navigation Configuration
// ============================================================

export interface NavItem {
  label: string
  href: string
  iconName: string
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
      { label: 'Dashboard',     href: '/dashboard',     iconName: 'LayoutDashboard' },
      { label: 'Notifications', href: '/notifications', iconName: 'Bell'            },
    ],
  },
  {
    label: 'Procurement',
    items: [
      { label: 'Vendors',         href: '/vendors',          iconName: 'Building2'  },
      { label: 'Vendor Requests', href: '/vendors/requests', iconName: 'Users'      },
      { label: 'Products',        href: '/products',         iconName: 'Package'    },
      { label: 'RFQs',            href: '/rfqs',             iconName: 'FileText'   },
      { label: 'Quotations',      href: '/quotations',       iconName: 'FileSearch' },
      { label: 'Purchase Orders', href: '/purchase-orders',  iconName: 'ShoppingCart' },
    ],
  },
  {
    label: 'Operations',
    items: [
      { label: 'Inventory',     href: '/inventory',              iconName: 'Warehouse'     },
      { label: 'Warehouses',    href: '/inventory/warehouses',   iconName: 'Building2'     },
      { label: 'GRNs',          href: '/inventory/grn',          iconName: 'ClipboardList' },
      { label: 'Transactions',  href: '/inventory/transactions', iconName: 'History'       },
    ],
  },
  {
    label: 'Finance',
    items: [
      { label: 'Finance Dashboard', href: '/payments',          iconName: 'CreditCard'   },
      { label: 'Invoices',          href: '/payments/invoices', iconName: 'FileText'     },
      { label: 'Outstanding',       href: '/payments/outstanding', iconName: 'TrendingDown' },
      { label: 'Overdue',           href: '/payments/overdue',  iconName: 'AlertTriangle' },
      { label: 'Payment History',   href: '/payments/history',  iconName: 'History'      },
      { label: 'Vendor Balances',   href: '/payments/vendors',  iconName: 'Building2'    },
    ],
  },
  {
    label: 'Approvals',
    items: [
      { label: 'Approvals', href: '/approvals',         iconName: 'ClipboardList' },
      { label: 'Audit Log', href: '/audit-log',         iconName: 'ShieldCheck'   },
    ],
  },
  {
    label: 'Insights',
    items: [
      // IMPORTANT: Each item routes to its own dedicated analytics page.
      // Executive Dashboard → /analytics (admin-only overview)
      // All others → their specific sub-page
      { label: 'Executive Dashboard', href: '/analytics',              iconName: 'BarChart3'     },
      { label: 'Procurement',         href: '/analytics/procurement',  iconName: 'ShoppingCart'  },
      { label: 'Vendors',             href: '/analytics/vendors',      iconName: 'Building2'     },
      { label: 'Inventory',           href: '/analytics/inventory',    iconName: 'Warehouse'     },
      { label: 'Finance',             href: '/analytics/finance',      iconName: 'CreditCard'    },
      { label: 'Approvals',           href: '/analytics/approvals',    iconName: 'ClipboardList' },
    ],
  },
  {
    label: 'System',
    items: [
      { label: 'Settings',           href: '/settings',           iconName: 'Settings'   },
      { label: 'Employees',          href: '/settings/employees', iconName: 'Users'      },
      { label: 'Roles & Permissions',href: '/settings/roles',     iconName: 'ShieldCheck'},
      { label: 'Workspace',          href: '/settings/workspace', iconName: 'Building2'  },
    ],
  },
]
