# VendorFlow

> Enterprise Procurement Management Platform

**VendorFlow** is a full-stack, production-ready procurement management platform that digitizes the entire procurement lifecycle — from vendor onboarding and RFQ creation to purchase orders, goods receipt, invoicing, and payment.

🌐 **Live Demo:** [https://vendor-flow-tau.vercel.app](https://vendor-flow-tau.vercel.app)  
💻 **GitHub:** [https://github.com/sowkya2006/vendor-flow](https://github.com/sowkya2006/vendor-flow)

---

## Table of Contents

- [Overview](#overview)
- [Two Independent Portals](#two-independent-portals)
- [Roles and Permissions](#roles-and-permissions)
- [Features](#features)
- [Procurement Workflow](#procurement-workflow)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Database Schema](#database-schema)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Deployment](#deployment)
- [Database Migrations](#database-migrations)
- [Screenshots](#screenshots)

---

## Overview

VendorFlow solves the problem of disconnected procurement processes. Most businesses manage vendors, purchase orders, and invoices through emails and spreadsheets — leading to lost documents, no visibility, and zero audit trail.

VendorFlow replaces all of that with a single platform where:

- Companies manage their entire procurement workflow
- Vendors respond to RFQs, submit quotations, and track payments
- Every action is logged, notified, and audited automatically
- Role-based access ensures each user sees exactly what they need

---

## Two Independent Portals

VendorFlow operates as two completely separate applications sharing the same backend.

### Company Portal — `/company/login`

For internal procurement teams. Features full procurement workflow management, analytics, employee management, and vendor relationship management.

**Access:** Administrator, Procurement Manager, Procurement Officer, Finance Manager, Warehouse Manager

### Vendor Portal — `/vendor/login`

For suppliers and vendors. Allows vendors to respond to RFQs, submit quotations, acknowledge purchase orders, submit invoices, and track payment status.

**Access:** Vendor accounts only

> Company users can never access Vendor Portal routes.  
> Vendor users can never access Company Portal routes.  
> Portal separation is enforced at the middleware level on every request.

---

## Roles and Permissions

### Company Portal Roles

| Role | Access |
|---|---|
| **Administrator** | Full access — all modules, employee management, workspace settings, role configuration |
| **Procurement Manager** | Approves RFQs, quotations, and purchase orders. Procurement analytics. No finance or inventory access |
| **Procurement Officer** | Creates RFQs and purchase orders. Vendor analytics. No approvals, finance, or inventory |
| **Finance Manager** | Full finance module — invoices, payments, outstanding, overdue. Finance analytics only |
| **Warehouse Manager** | Full inventory module — warehouses, GRNs, stock, transactions. Inventory analytics only |

### Vendor Portal Role

| Role | Access |
|---|---|
| **Vendor** | View RFQs, submit quotations, view POs, submit invoices, track payments, manage company profile |

---

## Features

### Company Portal

**Dashboard**
- Role-specific KPI cards and widgets
- Recent activity feed
- Pending approvals widget
- Quick action shortcuts

**Vendor Management**
- Add and manage vendors with full profiles
- Vendor status tracking (active, inactive, suspended)
- Vendor collaboration request management
- Document storage per vendor

**RFQ Management**
- Create and send Requests for Quotation to vendors
- Line items with quantity, unit, and estimated pricing
- Priority levels (low, medium, high, urgent)
- Auto-generated RFQ numbers (RFQ-YYYY-NNNN)
- Status tracking (draft, sent, under review, awarded, cancelled)

**Quotation Management**
- Review vendor-submitted quotations
- Side-by-side quotation comparison
- Approve or reject with comments
- Quotation history and audit trail

**Purchase Orders**
- Create POs from approved quotations
- Auto-generated PO numbers (PO-YYYY-NNNN)
- Approval workflow (draft → pending approval → approved → sent → acknowledged)
- Send POs directly to vendors

**Inventory Management**
- Multi-warehouse support
- Goods Receipt Notes (GRN) with three-way matching
- Stock transaction history
- Inventory valuation
- Low stock alerts with notifications

**Payments & Invoicing**
- Invoice management with status tracking
- Three-way matching (PO → GRN → Invoice)
- Payment recording and history
- Outstanding and overdue tracking
- Vendor balance management

**Analytics**
- Procurement analytics — spend by vendor, category, time period
- Vendor performance metrics
- Finance dashboards — cash flow, outstanding, overdue
- Inventory analytics — stock levels, valuation, turnover
- Approval analytics — approval rates and turnaround times

**Settings**
- Workspace configuration
- Employee management with role assignment
- Invite employees via email (automated onboarding)
- Custom roles and permissions
- Role preview mode for administrators

**Notifications**
- Real-time in-app notifications
- Email notifications via Brevo for critical events
- Role-based notification routing — each role only gets relevant notifications

### Vendor Portal

- View and respond to incoming RFQs
- Submit detailed quotations with line items, tax, and discounts
- View and acknowledge Purchase Orders
- Submit invoices against POs
- Track payment status
- Manage vendor company profile
- Send collaboration requests to companies
- In-app and email notifications

---

## Procurement Workflow

The complete end-to-end cycle:

```
1. Admin invites employees → role-based onboarding
          ↓
2. Procurement Officer creates RFQ → sends to vendor
          ↓
3. Vendor receives notification → submits quotation
          ↓
4. Procurement Manager reviews quotations → approves best one
          ↓
5. Procurement Officer creates Purchase Order
          ↓
6. Procurement Manager approves PO → sends to vendor
          ↓
7. Vendor acknowledges PO
          ↓
8. Goods arrive → Warehouse Manager creates GRN
          ↓
9. Vendor submits invoice
          ↓
10. Finance Manager approves invoice → records payment
          ↓
11. Cycle complete — full audit trail maintained ✅
```

---

## Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| Framework | Next.js 15 (App Router) | Full-stack React framework |
| Language | TypeScript | Type safety |
| Styling | Tailwind CSS | Utility-first CSS |
| UI Components | Radix UI + shadcn/ui | Accessible component primitives |
| Database | PostgreSQL (Supabase) | Relational database with RLS |
| Auth | Supabase Auth | PKCE flow, email invites, JWT |
| Backend | Next.js Server Actions | Type-safe server mutations |
| ORM | Supabase JS Client | Database queries with TypeScript types |
| Email | Brevo SMTP + API | Transactional email delivery |
| Forms | React Hook Form + Zod | Form handling and validation |
| Charts | Recharts | Analytics visualizations |
| Deployment | Vercel | Edge-optimized hosting |
| State | Zustand | Lightweight client state |

---

## Project Structure

```
vendorflow/
├── app/
│   ├── (auth)/                  # Auth pages (login, signup, reset password)
│   ├── (dashboard)/             # Company portal pages
│   │   ├── analytics/           # Analytics dashboards
│   │   ├── approvals/           # Approval management
│   │   ├── audit-log/           # Audit trail
│   │   ├── dashboard/           # Main dashboard
│   │   ├── inventory/           # Inventory & GRN management
│   │   ├── notifications/       # Notification center
│   │   ├── payments/            # Invoices & payments
│   │   ├── products/            # Product catalog
│   │   ├── purchase-orders/     # Purchase order management
│   │   ├── quotations/          # Quotation review
│   │   ├── rfqs/                # RFQ management
│   │   ├── settings/            # Workspace & employee settings
│   │   └── vendors/             # Vendor management
│   ├── api/                     # API routes (auth, search, debug)
│   ├── auth/                    # Auth callbacks (PKCE, confirm)
│   ├── company/                 # Company portal login
│   ├── invite/                  # Employee invitation flow
│   ├── vendor/                  # Vendor portal
│   │   └── (portal)/            # Vendor portal pages
│   └── workspace/               # Workspace setup wizard
├── components/
│   ├── analytics/               # Chart and analytics components
│   ├── auth/                    # Authentication forms
│   ├── dashboard/               # Dashboard widgets
│   ├── inventory/               # Inventory components
│   ├── layout/                  # Sidebar, topnav, shell
│   ├── notifications/           # Notification components
│   ├── purchase-orders/         # PO components
│   ├── quotations/              # Quotation components
│   ├── rfqs/                    # RFQ form and list
│   ├── settings/                # Settings forms
│   ├── ui/                      # Base UI components (shadcn)
│   └── vendor-portal/           # Vendor portal components
├── lib/
│   ├── notifications/           # Notification engine
│   ├── supabase/                # Supabase clients and data functions
│   └── validations/             # Zod validation schemas
├── supabase/
│   └── migrations/              # All database migrations (in order)
├── types/                       # TypeScript type definitions
├── config/                      # Navigation and role configuration
├── proxy.ts                     # Edge middleware — portal routing
└── .env.example                 # Environment variable template
```

---

## Database Schema

Key tables:

| Table | Description |
|---|---|
| `companies` | Company workspaces |
| `users` | Company employees with roles |
| `vendors` | Vendor profiles linked to companies |
| `vendor_companies` | Self-registered vendor accounts |
| `rfqs` + `rfq_items` | Requests for Quotation |
| `quotations` + `quotation_items` | Vendor quotations with line items |
| `purchase_orders` + `purchase_order_items` | Purchase orders |
| `inventory_items` | Product/inventory catalog |
| `warehouses` | Warehouse locations |
| `grn_records` + `grn_items` | Goods Receipt Notes |
| `invoices` + `invoice_items` | Vendor invoices |
| `payments` | Payment records |
| `approval_notifications` | In-app notification store |
| `employee_invitations` | Pending employee invites |
| `roles` + `permissions` | Custom role configuration |

All tables have **Row-Level Security (RLS)** enabled. Users can only read and write data belonging to their own company.

---

## Getting Started

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project
- A [Brevo](https://brevo.com) account (for email)

### Local Development

**1. Clone the repository**

```bash
git clone https://github.com/sowkya2006/vendor-flow.git
cd vendor-flow
```

**2. Install dependencies**

```bash
npm install
```

**3. Set up environment variables**

```bash
cp .env.example .env.local
```

Fill in all values in `.env.local` (see [Environment Variables](#environment-variables)).

**4. Run database migrations**

Go to your Supabase project → SQL Editor and run each migration file in `supabase/migrations/` in order (by filename).

**5. Start the development server**

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Environment Variables

Copy `.env.example` to `.env.local` and fill in:

```env
# Supabase — get from your Supabase project settings
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# App URL — use http://localhost:3000 for local dev
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=VendorFlow
NEXT_PUBLIC_APP_VERSION=1.0.0

# Brevo — for sending invitation and notification emails
BREVO_API_KEY=your-brevo-api-key
BREVO_SENDER_EMAIL=your-verified-sender@example.com

# AI features (optional)
OPENAI_API_KEY=your-openai-key
GOOGLE_GENERATIVE_AI_API_KEY=your-google-ai-key
```

> ⚠️ Never commit `.env.local` — it is gitignored by default.

---

## Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com) → New Project → Import your repo
3. Add all environment variables (use your production values)
4. Set `NEXT_PUBLIC_APP_URL` to your Vercel deployment URL
5. Click **Deploy**

### After Deployment

Update Supabase Auth settings:

- Go to **Authentication → URL Configuration**
- Set **Site URL** to your Vercel URL
- Add to **Redirect URLs**:
  - `https://your-app.vercel.app/auth/callback`
  - `https://your-app.vercel.app/auth/confirm`
  - `https://your-app.vercel.app/**`

---

## Database Migrations

Run migrations in order from `supabase/migrations/`. Each file is prefixed with a timestamp to ensure correct ordering.

Key migrations:

| File | Description |
|---|---|
| `20240101000000_initial_schema.sql` | Base schema — companies, users, vendors |
| `20240103000000_rfq_and_purchase_orders.sql` | RFQ and PO tables with RLS |
| `20240104000000_quotations.sql` | Quotation system with auto-calculated totals |
| `20240107000000_inventory.sql` | Inventory, warehouses, GRN |
| `20240108000000_invoices_payments.sql` | Invoice and payment management |
| `20240109000000_vendor_portal.sql` | Vendor portal tables |
| `20240110000000_roles_permissions_employees.sql` | RBAC system |
| `20240112000000_vendor_self_registration.sql` | Vendor self-registration flow |
| `20240122000000_fix_quotation_totals_trigger.sql` | Fix RLS on quotation totals trigger |
| `20240124000000_fix_users_rls_circular.sql` | Fix circular RLS on users table |
| `20240125000000_get_user_portal_fn.sql` | Portal detection RPC function |

---

## License

MIT — free to use, modify, and distribute.

---

## Author

Built by **Sowkya Vaddi**

- GitHub: [https://github.com/sowkya2006](https://github.com/sowkya2006)
- Live: [https://vendor-flow-tau.vercel.app](https://vendor-flow-tau.vercel.app)
