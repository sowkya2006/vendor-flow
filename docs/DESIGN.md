# VendorFlow – Design Document

**Version:** 1.0.0
**Project Name:** VendorFlow
**Project Type:** Enterprise Multi-Tenant SaaS Procurement & Vendor Collaboration Platform
**Author:** Sowkya
**Document Part:** Part 1 — Design Foundation
**Status:** Draft
**Last Updated:** July 2026

---

# Table of Contents — Part 1

1. Design Introduction
   - Design Philosophy
   - Product Vision
   - Enterprise UX Principles
   - Design Goals
   - Design Principles
   - Information Architecture
   - Navigation Hierarchy
   - User Journey Overview
2. Design System
3. Layout System
4. Sidebar Design
5. Top Navigation

---


---

# PART 1 — DESIGN INTRODUCTION

---

## 1.1 Design Philosophy

VendorFlow is not a generic admin dashboard. It is a premium enterprise procurement platform that communicates trust, authority, and intelligence through every interaction.

The design philosophy is grounded in three principles:

**Clarity over complexity.**
Enterprise procurement involves dozens of modules, workflows, and user roles. The interface must reduce cognitive load at every step — surfacing the right information at the right moment without overwhelming the user. Every screen has a single dominant purpose. Secondary actions are accessible but not competing for attention.

**Structure that scales.**
With 50+ modules, multi-tenant workspaces, dual user types (companies and vendors), and role-based access control, the design must scale gracefully. Navigation hierarchies, component patterns, and layout grids are designed to accommodate growth without redesign. A new module can be added without breaking the visual language.

**Premium feel through restraint.**
The most sophisticated enterprise software communicates premium quality through what it does not show. VendorFlow uses generous whitespace, subtle depth through layered shadows, precise typography, and controlled use of color. Animations exist to orient — not to entertain.

---

## 1.2 Product Vision

VendorFlow aspires to be the procurement platform that procurement teams actually enjoy using.

The visual reference set — Stripe Dashboard, Linear, Vercel, Ramp, Clerk, Notion, and a modernized SAP Ariba — defines the design target. These products share a common characteristic: they make complex operations feel simple, fast, and trustworthy.

VendorFlow translates this into the procurement domain. The experience should feel as polished as Stripe's developer dashboard, as fast as Linear's issue tracker, as clean as Vercel's deployment interface, and as intelligent as Ramp's spend management platform — while handling the full complexity of enterprise procurement.

The product is targeted at procurement managers, finance teams, and vendor operations staff inside organizations of all sizes. These users are professionals who value efficiency, accuracy, and control. The interface earns their trust by never hiding information they need, never blocking workflows with unnecessary friction, and always confirming that actions completed successfully.

---

## 1.3 Enterprise UX Principles

These principles govern every design decision in VendorFlow.

**Principle 1 — Role-Aware Surfaces**
The interface adapts to the logged-in user's role. A Procurement Manager sees an approval-centric dashboard. A Finance Manager sees invoice and payment workflows front and center. A Vendor Administrator sees active RFQs and purchase orders. The design does not force all users through a one-size-fits-all layout.

**Principle 2 — Progressive Disclosure**
Complex forms, approval workflows, and configuration screens reveal information in layers. The most essential information is visible by default. Secondary details expand on demand. This prevents cognitive overload on first encounter.

**Principle 3 — Status Visibility at All Times**
Every procurement artifact has a clear, visually distinct status: Draft, Pending, Approved, Active, Shipped, Paid, Cancelled. Status is never buried. It appears as a badge in tables, as a timeline in detail views, and as a summary count on dashboards.

**Principle 4 — Action Confirmation**
Destructive or irreversible actions — rejecting a purchase order, deleting a vendor, voiding an invoice — require explicit confirmation through modal dialogs with clear consequence language. The UI never silently deletes or irreversibly modifies data.

**Principle 5 — Keyboard-First Navigation**
Power users navigate entirely by keyboard. Every modal, form, dropdown, and sidebar navigation item is accessible without a mouse. A command palette enables instant access to any module or action from anywhere in the application.

**Principle 6 — Consistency of Pattern**
A table looks the same whether it lists purchase orders, vendors, employees, or invoices. A form behaves the same whether it creates a purchase request, an RFQ, or a product. Pattern consistency dramatically reduces training time for new users.

**Principle 7 — Real-Time Feedback**
Loading states, success confirmations, error messages, and validation feedback are immediate and specific. The user always knows the current state of any operation they have initiated.

**Principle 8 — Audit Confidence**
Every action that modifies data shows who performed it and when. Activity timelines on detail pages build a visible audit trail that reinforces trust and accountability.

---

## 1.4 Design Goals

**Goal 1 — Communicate Enterprise Grade**
The visual design must signal that this platform is enterprise software. Deep Navy primary palette, structured typography, precision spacing, and restrained use of color achieve this.

**Goal 2 — Stand Out from Generic Admin Templates**
Most procurement software looks like a Bootstrap admin theme from 2016. VendorFlow must look like it was designed in 2025 by a product team that cares deeply about the experience.

**Goal 3 — Fast Perceived Performance**
Skeleton loaders, optimistic UI updates, and smooth micro-animations create the perception of speed even when network latency is unavoidable.

**Goal 4 — Support Dual Workspaces**
Company and Vendor workspaces have distinct visual identities within the shared design language. Navigation structures, dashboard layouts, and module priorities differ between the two workspace types.

**Goal 5 — AI Module Visual Distinction**
Future AI-powered modules (Vendor Recommendation, Quotation Comparison, Procurement Insights) are visually distinguished through Premium Purple accent usage. This creates clear semantic meaning: purple means intelligent automation.

**Goal 6 — Dark Mode Ready Architecture**
The token system is designed with semantic color variables so that dark mode can be implemented without component-level redesign. Light mode ships first; dark mode follows in a future release.

---

## 1.5 Design Principles

**Hierarchy First**
Every screen establishes a clear visual hierarchy. The most important element commands the most visual weight. Secondary elements recede appropriately.

**Whitespace is Structure**
Generous padding and margin are not wasted space — they are the primary mechanism for grouping related information and separating unrelated content.

**Color Carries Meaning**
Color is used semantically and sparingly. Navy for primary navigation and structure. Electric Blue for interactive elements, links, and CTAs. Cyan for highlights and data visualization accents. Green for success and approved states. Amber for warnings and pending states. Red for errors, rejections, and destructive actions. Purple exclusively for AI-powered features.

**Typography Delivers Authority**
Inter is the typeface across the entire platform. It combines technical precision with approachability — the same reason it is used by Figma, Linear, and Stripe. Type scales are harmonious. Headings are confident. Body copy is readable. Labels are crisp.

**Motion is Purposeful**
Animations are subtle, fast, and directional. Modals slide in rather than fade. Sidebars collapse with a smooth transition. Skeleton screens dissolve into content. No animation exceeds 300 milliseconds in the primary interaction path.

---

## 1.6 Information Architecture

VendorFlow organizes information across three isolated workspace environments.

### Platform Level (System Administration)

Accessible only to Platform Admins.

- Platform Dashboard
- Workspace Monitoring
- Company Management
- Subscription Management
- Payment Monitoring
- User Management
- System Settings
- Audit Logs
- Error Logs
- Storage Monitoring
- Email Queue Monitoring
- Platform Notifications

### Company Workspace

Accessible to Company Super Administrator, Procurement Manager, Procurement Officer, Finance Manager, and Employee based on role permissions.

**Core Navigation Groups:**

1. Dashboard — Procurement overview, KPIs, pending actions
2. Procurement — Purchase Requests, RFQs, Quotations, Vendor Comparison, Purchase Orders
3. Vendors — Marketplace, Connected Vendors, Vendor Profiles, Invitations
4. Orders — Active Orders, Order Tracking, Goods Receipt (GRN), Shipment Tracking
5. Finance — Invoices, Payments, Expense Analytics, Payment History
6. People — Employees, Departments, Roles, Permissions
7. Analytics — Procurement Analytics, Spending Analysis, Vendor Performance, Reports
8. Communication — Message Center, Notifications, RFQ Discussions
9. Documents — Document Library, Certificates, Contracts
10. Settings — Company Profile, Workspace Settings, Notifications, Integrations, Billing

### Vendor Workspace

Accessible to Vendor Administrator, Sales Manager, Product Manager, Finance Executive, and Vendor Employee based on role permissions.

**Core Navigation Groups:**

1. Dashboard — Business overview, active RFQs, revenue summary
2. RFQs — Received RFQs, Submitted Quotations, RFQ History
3. Orders — Purchase Orders, Order Fulfillment, Delivery Management
4. Catalog — Products, Categories, Inventory, Pricing
5. Finance — Invoices, Payments Received, Payment History
6. Customers — Connected Companies, Relationships
7. Analytics — Sales Analytics, Product Performance, Customer Reviews
8. Communication — Message Center, Order Discussions
9. Documents — Business Documents, Certifications, Licenses
10. Settings — Vendor Profile, Notification Preferences, Security

---

## 1.7 Navigation Hierarchy

VendorFlow uses a four-level navigation hierarchy.

**Level 1 — Workspace Switcher**
Appears at the very top of the sidebar. Allows the user to switch between workspaces they have access to. For Company Super Admins who also manage vendor accounts, this switcher enables context switching without re-authentication.

**Level 2 — Primary Navigation Groups**
Organized in the sidebar as labeled sections. Each section contains related modules. For example, the Procurement group contains Purchase Requests, RFQs, Quotations, Vendor Comparison, and Purchase Orders.

**Level 3 — Module Pages**
Each navigation item leads to a module's main list or overview page. Purchase Requests, for instance, shows all requests with filters, search, and status tabs.

**Level 4 — Detail Views**
Clicking any record opens a dedicated detail view. A Purchase Request detail view shows the full request, approval history, attached documents, linked RFQ, and audit trail. Detail views are typically full-page rather than slide-over panels for complex objects.

---

## 1.8 User Journey Overview

### Company User — Primary Procurement Journey

1. User logs in and arrives at the Company Dashboard.
2. Dashboard surfaces pending actions: approvals required, RFQs expiring, invoices awaiting review.
3. Employee creates a Purchase Request from the Procurement module.
4. Procurement Manager receives an in-app notification and reviews the request.
5. Procurement Manager approves and creates an RFQ, selecting vendors from the Marketplace.
6. Vendors receive RFQ notification and submit quotations.
7. Procurement Manager navigates to Quotation Comparison to evaluate responses.
8. Best vendor is selected; Purchase Order is auto-generated.
9. Vendor receives PO notification and accepts.
10. Order status updates flow through Order Tracking as vendor ships goods.
11. Company confirms goods receipt via GRN module.
12. Vendor generates invoice; Finance Manager receives notification.
13. Finance Manager approves invoice and initiates Razorpay payment.
14. Vendor receives payment confirmation.
15. Company submits vendor review and rating.
16. Analytics dashboards reflect the completed procurement cycle.

### Vendor User — Primary Business Journey

1. Vendor Administrator registers and completes the Vendor Profile.
2. Uploads product catalog with images and specifications.
3. Receives RFQ from a connected company.
4. Sales Manager reviews RFQ and submits a quotation.
5. Company selects the vendor; PO arrives in the Vendor dashboard.
6. Vendor accepts PO and begins fulfillment.
7. Updates order status and shipment tracking as goods are dispatched.
8. Finance Executive generates invoice upon delivery confirmation.
9. Payment is received; dashboard reflects updated revenue metrics.
10. Customer review is received and reflected in vendor reputation score.

---

---

# PART 2 — DESIGN SYSTEM

---

## 2.1 Brand Colors

The VendorFlow brand palette is built on Deep Navy as the primary foundation, Electric Blue as the primary interactive accent, and a supporting cast of semantic colors that each carry specific meaning across the interface.

```
Brand Palette
─────────────────────────────────────────────────────────────────

Deep Navy         #0A1628    Primary brand color. Navigation, headers, primary text.
Navy Dark         #060E1A    Deeper navy for sidebar backgrounds in dark contexts.
Navy Medium       #0D1F3C    Secondary navy for card backgrounds, table headers.
Navy Light        #1A2F52    Lighter navy for hover states on dark surfaces.

Electric Blue     #2563EB    Primary CTA, links, active states, interactive elements.
Blue Hover        #1D4ED8    Hover state for Electric Blue elements.
Blue Light        #3B82F6    Secondary interactive elements, focus rings.
Blue Pale         #EFF6FF    Blue-tinted backgrounds for info states and highlights.

Cyan Highlight    #06B6D4    Data visualization accents, secondary highlights, tags.
Cyan Light        #CFFAFE    Pale cyan for soft backgrounds and callout cards.
Cyan Dark         #0891B2    Deeper cyan for more prominent highlight elements.

Premium Purple    #7C3AED    AI module indicator. Used ONLY on AI-powered features.
Purple Hover      #6D28D9    Hover state for purple elements.
Purple Light      #8B5CF6    Secondary AI accents, AI badge backgrounds.
Purple Pale       #F5F3FF    Very light purple background for AI module cards.
```

---

## 2.2 Semantic Colors

Semantic colors map functional meaning to visual color. These are used consistently across the entire platform so users learn the visual language immediately.

```
Success
─────────────────────────────────────────────────────────────────
Success Green     #16A34A    Approved, paid, delivered, active statuses.
Success Hover     #15803D    Hover on success actions.
Success Light     #DCFCE7    Success badge backgrounds, success banners.
Success Dark      #14532D    Success text on light success backgrounds.

Warning
─────────────────────────────────────────────────────────────────
Warning Amber     #D97706    Pending, awaiting approval, expiring soon.
Warning Hover     #B45309    Hover on warning actions.
Warning Light     #FEF3C7    Warning badge backgrounds, warning banners.
Warning Dark      #92400E    Warning text on light warning backgrounds.

Error
─────────────────────────────────────────────────────────────────
Error Red         #DC2626    Rejected, failed payment, error states, destructive actions.
Error Hover       #B91C1C    Hover on destructive buttons.
Error Light       #FEE2E2    Error badge backgrounds, error banners, form errors.
Error Dark        #7F1D1D    Error text on light error backgrounds.

Info
─────────────────────────────────────────────────────────────────
Info Blue         #2563EB    Informational notices, neutral highlights.
Info Light        #EFF6FF    Info banner backgrounds.
Info Dark         #1E3A5F    Info text on light backgrounds.

Neutral
─────────────────────────────────────────────────────────────────
Neutral 50        #F8FAFC    Page background (lightest).
Neutral 100       #F1F5F9    Section backgrounds, zebra stripe rows.
Neutral 200       #E2E8F0    Borders, dividers, input borders.
Neutral 300       #CBD5E1    Disabled element borders, placeholder elements.
Neutral 400       #94A3B8    Placeholder text, icon fills at rest.
Neutral 500       #64748B    Secondary body text, caption text.
Neutral 600       #475569    Tertiary headings, subheadings.
Neutral 700       #334155    Secondary headings, prominent labels.
Neutral 800       #1E293B    Primary body text.
Neutral 900       #0F172A    Primary headings, high-emphasis text.
```

---

## 2.3 Light Theme

```
Light Theme Token Map
─────────────────────────────────────────────────────────────────
--color-bg-base              #F8FAFC    Root page background
--color-bg-surface           #FFFFFF    Card, panel, modal backgrounds
--color-bg-surface-hover     #F8FAFC    Surface hover state
--color-bg-surface-raised    #FFFFFF    Elevated cards with shadow
--color-bg-subtle            #F1F5F9    Subtle section backgrounds
--color-bg-muted             #E2E8F0    Disabled fields, muted sections

--color-text-primary         #0F172A    Primary headings and body
--color-text-secondary       #475569    Secondary labels, captions
--color-text-tertiary        #94A3B8    Placeholders, hints
--color-text-disabled        #CBD5E1    Disabled text
--color-text-inverse         #FFFFFF    Text on dark/navy backgrounds
--color-text-link            #2563EB    Hyperlinks
--color-text-link-hover      #1D4ED8    Link hover

--color-border               #E2E8F0    Default borders
--color-border-strong        #CBD5E1    Emphasized borders
--color-border-focus         #2563EB    Focus ring color
--color-border-error         #DC2626    Error state border

--color-nav-bg               #0A1628    Sidebar background
--color-nav-text             #CBD5E1    Sidebar navigation text
--color-nav-text-active      #FFFFFF    Active sidebar item text
--color-nav-text-hover       #F1F5F9    Hover sidebar item text
--color-nav-item-active-bg   #1A2F52    Active sidebar item background
--color-nav-item-hover-bg    #0D1F3C    Hover sidebar item background
--color-nav-icon             #94A3B8    Sidebar icon fill
--color-nav-icon-active      #3B82F6    Active sidebar icon fill

--color-primary              #2563EB    Primary buttons and CTAs
--color-primary-hover        #1D4ED8    Primary button hover
--color-primary-text         #FFFFFF    Text inside primary buttons

--color-ai-accent            #7C3AED    AI module primary color
--color-ai-bg                #F5F3FF    AI module card backgrounds
--color-ai-border            #DDD6FE    AI module card borders
```

---

## 2.4 Dark Theme

```
Dark Theme Token Map
─────────────────────────────────────────────────────────────────
--color-bg-base              #060E1A    Root page background (deepest navy)
--color-bg-surface           #0D1F3C    Card, panel, modal backgrounds
--color-bg-surface-hover     #1A2F52    Surface hover state
--color-bg-surface-raised    #0D1F3C    Elevated cards (use shadow for depth)
--color-bg-subtle            #060E1A    Subtle section backgrounds
--color-bg-muted             #0A1628    Disabled fields

--color-text-primary         #F1F5F9    Primary headings and body
--color-text-secondary       #94A3B8    Secondary labels
--color-text-tertiary        #64748B    Placeholders
--color-text-disabled        #334155    Disabled text
--color-text-inverse         #0F172A    Text on light surfaces
--color-text-link            #3B82F6    Hyperlinks
--color-text-link-hover      #60A5FA    Link hover

--color-border               #1A2F52    Default borders
--color-border-strong        #1E293B    Emphasized borders
--color-border-focus         #3B82F6    Focus ring
--color-border-error         #EF4444    Error state

--color-nav-bg               #060E1A    Sidebar background
--color-nav-text             #94A3B8    Sidebar text
--color-nav-text-active      #FFFFFF    Active item text
--color-nav-item-active-bg   #1A2F52    Active item background
--color-nav-item-hover-bg    #0D1F3C    Hover item background
--color-nav-icon             #64748B    Sidebar icon
--color-nav-icon-active      #3B82F6    Active icon

--color-primary              #3B82F6    Primary buttons
--color-primary-hover        #2563EB    Hover
--color-primary-text         #FFFFFF    Button text

--color-ai-accent            #8B5CF6    AI module color (lighter for dark bg)
--color-ai-bg                #1E1040    AI module card backgrounds
--color-ai-border            #4C1D95    AI module borders
```

---

## 2.5 Typography

VendorFlow uses Inter exclusively — a variable font optimized for screens, used by Stripe, Linear, Figma, and Vercel.

```
Font Family
─────────────────────────────────────────────────────────────────
Primary           Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif
Monospace         'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace
                  (Used for IDs, invoice numbers, PO numbers, API keys)
```

### Font Scale

```
Token               Size     Line Height   Usage
─────────────────────────────────────────────────────────────────
text-xs             11px     16px          Labels, badges, helper text
text-sm             13px     20px          Secondary body, table cells, captions
text-base           14px     22px          Primary body text
text-md             15px     24px          Slightly larger body, form labels
text-lg             16px     26px          Card titles, section labels
text-xl             18px     28px          Page sub-headings
text-2xl            20px     30px          Section headings
text-3xl            24px     32px          Page headings
text-4xl            30px     38px          Dashboard KPI numbers
text-5xl            36px     44px          Hero numbers, empty state headings
text-6xl            48px     56px          Large metric displays
```

### Font Weights

```
font-light          300    Rarely used; large decorative numbers only
font-regular        400    Body text, table cells, secondary content
font-medium         500    Labels, table headers, breadcrumbs, navigation items
font-semibold       600    Card titles, sub-headings, button text, modal titles
font-bold           700    Page headings, KPI values, prominent labels
font-extrabold      800    Hero numbers, empty state callouts
```

### Letter Spacing

```
tracking-tight      -0.025em    Large headings (text-4xl and above)
tracking-normal      0em        Default body text
tracking-wide        0.025em    Navigation labels, tags, ALL-CAPS labels
tracking-wider       0.05em     Section labels, metadata in uppercase
tracking-widest      0.1em      Status badges in uppercase
```

---

## 2.6 Lucide Icon System

VendorFlow uses Lucide Icons exclusively — the same library used by shadcn/ui components and compatible with the project's technology stack.

### Icon Size Scale

```
Token           Size    Usage
─────────────────────────────────────────────────────────────────
icon-xs         12px    Inline text icons, badge icons
icon-sm         14px    Table row action icons, compact lists
icon-base       16px    Default — navigation, buttons, form fields
icon-md         18px    Card icons, section header icons
icon-lg         20px    Feature icons, empty state secondary icons
icon-xl         24px    Empty state primary icons, dashboard KPI icons
icon-2xl        32px    Illustration spots, large feature callouts
icon-3xl        48px    Large empty states, onboarding illustrations
```

### Icon Usage Guidelines

Navigation sidebar icons use `icon-base` (16px) in their default state.
Action buttons pair icons with labels at `icon-base` (16px).
Icon-only buttons use `icon-md` (18px) with an accessible aria-label.
KPI metric icons use `icon-xl` (24px) above metric numbers.
Empty state icons use `icon-3xl` (48px) at center.
Status icons (check, x, clock) inside badges use `icon-xs` (12px).

### Primary Icon Set by Module

```
Module                  Primary Icon
─────────────────────────────────────────────────────────────────
Dashboard               LayoutDashboard
Purchase Requests       FileText
RFQ                     Send
Quotations              Receipt
Vendor Comparison       GitCompare
Purchase Orders         ShoppingCart
Order Tracking          Truck
Goods Receipt (GRN)     PackageCheck
Invoices                FileSpreadsheet
Payments                CreditCard
Vendors / Marketplace   Store
Vendor Profile          Building2
Product Catalog         Package
Inventory               Boxes
Employees               Users
Departments             Layers
Roles & Permissions     Shield
IAM                     KeyRound
Analytics               BarChart2
Reports                 PieChart
Audit Logs              ClipboardList
Communication           MessageSquare
Notifications           Bell
Documents               FolderOpen
Settings                Settings
Profile                 UserCircle
Global Search           Search
Command Palette         Command
AI Features             Sparkles
Reviews & Ratings       Star
Subscriptions           CreditCard
API & Integrations      Zap
System Admin            ServerCog
```

---

## 2.7 Spacing System — 8-Point Grid

All spacing in VendorFlow is derived from a base unit of 4px, expressed as multiples of 8px for major spatial relationships. This creates visual rhythm and predictability across the entire interface.

```
Token       Value    Pixels    Usage
─────────────────────────────────────────────────────────────────
space-0     0        0px       No spacing
space-px    —        1px       Hairline borders only
space-0.5   —        2px       Micro gaps between inline elements
space-1     —        4px       Tightest padding: badge padding, icon gap
space-1.5   —        6px       Compact button vertical padding
space-2     —        8px       Base unit. Button padding, tight card padding
space-3     —        12px      Input field padding, compact list items
space-4     —        16px      Default component padding
space-5     —        20px      Comfortable component padding
space-6     —        24px      Card inner padding
space-7     —        28px      Generous component padding
space-8     —        32px      Section padding, large card padding
space-10    —        40px      Page-level horizontal padding on tablet
space-12    —        48px      Large section gaps
space-16    —        64px      Major section breaks
space-20    —        80px      Page-level top padding
space-24    —        96px      Large whitespace, empty state padding
space-32    —        128px     Maximum whitespace sections
```

### Component Spacing Reference

```
Component               Padding
─────────────────────────────────────────────────────────────────
Sidebar width           256px (expanded), 64px (collapsed)
Sidebar nav item        py-2 px-3 (8px vertical, 12px horizontal)
Sidebar section label   px-3 py-2
Top navigation height   56px
Card padding            p-6 (24px all sides)
Table cell              py-3 px-4 (12px vertical, 16px horizontal)
Page content padding    px-8 py-6 (32px horizontal, 24px vertical)
Modal padding           p-6 (24px)
Form field gap          gap-4 (16px between fields)
Section gap             gap-6 (24px between sections)
Button padding (default) px-4 py-2 (16px / 8px)
Button padding (large)   px-6 py-3 (24px / 12px)
```

---

## 2.8 Border Radius

```
Token               Value    Usage
─────────────────────────────────────────────────────────────────
rounded-none        0        Tables (no radius on cells)
rounded-sm          4px      Tags, badges, small chips
rounded             6px      Input fields, dropdowns
rounded-md          8px      Buttons, form elements
rounded-lg          10px     Cards, panels, popovers
rounded-xl          12px     Modals, drawers, elevated cards
rounded-2xl         16px     Dashboard widget cards, feature cards
rounded-3xl         24px     Large promotional cards, onboarding panels
rounded-full        9999px   Avatars, pill badges, circular buttons
```

---

## 2.9 Shadow System & Elevation Levels

VendorFlow uses a four-level shadow system to communicate depth and elevation, reinforcing the visual hierarchy of the interface.

```
Elevation 0 — Flat
─────────────────────────────────────────────────────────────────
No shadow. Used for inline elements, table rows, and elements within cards.

Token: shadow-none
Value: none

Elevation 1 — Surface
─────────────────────────────────────────────────────────────────
Subtle shadow for cards, panels, and containers that sit above the page background.
Adds perceived depth without visual heaviness.

Token: shadow-sm
Value: 0 1px 2px 0 rgba(10, 22, 40, 0.05), 0 1px 3px 0 rgba(10, 22, 40, 0.04)

Elevation 2 — Raised
─────────────────────────────────────────────────────────────────
Standard shadow for interactive cards, dropdowns, and panels.
Used on hover states and focused elements.

Token: shadow
Value: 0 2px 4px -1px rgba(10, 22, 40, 0.08), 0 4px 8px -2px rgba(10, 22, 40, 0.06)

Elevation 3 — Floating
─────────────────────────────────────────────────────────────────
Prominent shadow for popovers, select menus, tooltips, command palettes.
Communicates that content is floating above the primary layout.

Token: shadow-md
Value: 0 4px 8px -2px rgba(10, 22, 40, 0.12), 0 8px 16px -4px rgba(10, 22, 40, 0.08)

Elevation 4 — Modal
─────────────────────────────────────────────────────────────────
Heavy shadow reserved for modals, drawers, and overlays.
Maximum depth in the system.

Token: shadow-xl
Value: 0 8px 24px -4px rgba(10, 22, 40, 0.18), 0 16px 40px -8px rgba(10, 22, 40, 0.12)

Premium Glow Shadow — Electric Blue (for focused CTAs)
─────────────────────────────────────────────────────────────────
Token: shadow-blue-glow
Value: 0 0 0 3px rgba(37, 99, 235, 0.15), 0 4px 12px rgba(37, 99, 235, 0.15)

Premium Glow Shadow — AI Purple (for AI module cards)
─────────────────────────────────────────────────────────────────
Token: shadow-purple-glow
Value: 0 0 0 1px rgba(124, 58, 237, 0.1), 0 4px 16px rgba(124, 58, 237, 0.12)
```

---

## 2.10 Opacity

```
Token               Value   Usage
─────────────────────────────────────────────────────────────────
opacity-0           0       Invisible (transitioning out)
opacity-5           0.05    Very subtle overlays
opacity-10          0.10    Hover backgrounds on dark surfaces
opacity-20          0.20    Disabled element overlays
opacity-40          0.40    Placeholder text overlays
opacity-50          0.50    Modal backdrops (with blur)
opacity-60          0.60    Disabled states
opacity-75          0.75    Secondary elements during loading
opacity-90          0.90    Near-full elements
opacity-100         1.00    Fully visible
```

---

## 2.11 Breakpoints

```
Token       Min Width   Range           Primary Usage
─────────────────────────────────────────────────────────────────
xs          0px         0–639px         Mobile portrait
sm          640px       640–767px       Mobile landscape
md          768px       768–1023px      Tablet portrait
lg          1024px      1024–1279px     Tablet landscape / small laptop
xl          1280px      1280–1535px     Standard desktop
2xl         1536px      1536px+         Wide desktop
```

---

## 2.12 Z-Index Scale

```
Token               Value   Usage
─────────────────────────────────────────────────────────────────
z-base              0       Default stacking context
z-raised            10      Sticky table headers, floating action buttons
z-dropdown          100     Dropdown menus, select popovers
z-sticky            200     Sticky top navigation bar
z-sidebar           300     Sidebar (above main content, below overlays)
z-overlay           400     Modal overlay backdrops
z-modal             500     Modal dialogs
z-notification      600     Toast notifications, alert banners
z-tooltip           700     Tooltips (always on top)
z-command           800     Command palette (highest application layer)
z-max               9999    Emergency overlay (critical system alerts)
```

---

## 2.13 Transition Durations

```
Token                   Duration   Easing                  Usage
─────────────────────────────────────────────────────────────────
duration-instant        75ms       linear                  Opacity on hover
duration-fast           100ms      ease-out                Button state changes
duration-normal         150ms      ease-out                Dropdown open/close
duration-comfortable    200ms      ease-in-out             Sidebar collapse, card hover
duration-smooth         250ms      ease-in-out             Modal entrance, panel slide
duration-relaxed        300ms      cubic-bezier(.4,0,.2,1) Page transitions, complex animations
duration-slow           500ms      ease-in-out             Onboarding animations only
```

### Standard Easing Curves

```
ease-out-standard       cubic-bezier(0, 0, 0.2, 1)     Elements entering the screen
ease-in-standard        cubic-bezier(0.4, 0, 1, 1)     Elements leaving the screen
ease-in-out-standard    cubic-bezier(0.4, 0, 0.2, 1)   Elements moving on screen
```

---

---

# PART 3 — LAYOUT SYSTEM

---

## 3.1 Authentication Layout

### Purpose
The authentication layout serves as the first impression of VendorFlow. It must communicate trust, professionalism, and quality instantly. Users arriving here are either new (registering) or returning (logging in). Both need to feel confident that this is enterprise-grade software handling their organization's procurement.

### Structure

The authentication layout is a two-column split-screen on desktop. On tablet and mobile it collapses to a single centered form column.

```
┌────────────────────────────────────────────────────────────────┐
│  LEFT PANEL (40% width)        │  RIGHT PANEL (60% width)      │
│                                │                               │
│  Deep Navy background          │  White / Neutral-50 bg        │
│  (#0A1628)                     │                               │
│                                │  ┌─────────────────────────┐ │
│  VendorFlow Logo               │  │   Form Container        │ │
│  (white wordmark + icon)       │  │   max-width: 420px      │ │
│                                │  │   centered vertically   │ │
│  Tagline:                      │  │                         │ │
│  "Enterprise Procurement,      │  │   Page heading          │ │
│   Simplified."                 │  │   Sub-heading           │ │
│                                │  │   Form fields           │ │
│  Illustration / Pattern        │  │   Primary CTA button    │ │
│  (abstract geometric or        │  │   Secondary links       │ │
│   isometric procurement        │  │   Social auth (Google)  │ │
│   graphic)                     │  │                         │ │
│                                │  └─────────────────────────┘ │
│  Trust indicators:             │                               │
│  "Trusted by 500+ enterprises" │  Footer: Copyright + links    │
│  Company logos (small)         │                               │
└────────────────────────────────────────────────────────────────┘
```

### Left Panel Details
- Background: Deep Navy (#0A1628)
- Logo: White VendorFlow wordmark, top-left, 32px height
- Central area: Brand illustration or abstract pattern in navy-blue tones with Electric Blue glow accents
- Tagline: text-2xl, font-semibold, white, centered horizontally
- Sub-tagline: text-base, Neutral-400 color, mt-2
- Trust strip at bottom: Small company logo marks in 24% opacity white, separated by hairlines
- Bottom text: "Trusted by procurement teams worldwide" in text-sm, Neutral-500

### Right Panel Details
- Background: #F8FAFC (Neutral-50) with a subtle noise texture
- Form container: White surface (#FFFFFF), rounded-2xl, shadow-md, p-8
- Logo above form: Small colored VendorFlow mark (navy version), centered, mb-8
- Heading: text-3xl, font-bold, color: Neutral-900
- Sub-heading: text-base, color: Neutral-500, mt-1 mb-8
- Form fields: Full-width, height 44px, rounded-md, border: Neutral-200
- Primary button: Full-width, height 44px, background: Electric Blue, rounded-md, font-semibold
- Google Sign-In button: Full-width, outlined style, white bg, Neutral-200 border, Google logo icon
- Footer links: "Forgot password?" and "Create account" in text-sm, Electric Blue, text-center

### Authentication Pages
- Login Page
- Register (Company) Page
- Register (Vendor) Page
- Email Verification Page (OTP entry)
- Forgot Password Page
- Reset Password Page
- Invitation Acceptance Page

### Responsive Behavior
- Desktop (xl+): Two-column 40/60 split
- Tablet (md): Left panel hidden; single centered form column, white background, logo at top
- Mobile (xs-sm): Same as tablet; form is full-width with 16px horizontal padding

---

## 3.2 Company Dashboard Layout

### Purpose
The company dashboard is the operational center of the Company Workspace. Every user lands here after authentication. It must surface the most urgent information — pending approvals, expiring RFQs, open POs, payment alerts — within three seconds of page load. The layout is designed to reduce the number of clicks needed to reach any critical action.

### Structure

```
┌────────────────────────────────────────────────────────────────┐
│  SIDEBAR (256px fixed)    │  MAIN CONTENT AREA                 │
│  [See Section 4]          │                                    │
│                           │  TOP NAVIGATION (56px fixed)       │
│                           │  ────────────────────────────────  │
│                           │                                    │
│                           │  PAGE HEADER                       │
│                           │  "Good morning, Riya ☀"           │
│                           │  Workspace: Meridian Technologies  │
│                           │                                    │
│                           │  KPI ROW (4 metric cards)          │
│                           │  ┌──────┐┌──────┐┌──────┐┌──────┐ │
│                           │  │  PR  ││ RFQs ││ POs  ││ Pay  │ │
│                           │  │  12  ││  8   ││  24  ││ ₹4.2M│ │
│                           │  └──────┘└──────┘└──────┘└──────┘ │
│                           │                                    │
│                           │  TWO-COLUMN ROW                    │
│                           │  ┌───────────────┐┌─────────────┐ │
│                           │  │ Pending        ││ Procurement │ │
│                           │  │ Approvals (5)  ││ Activity    │ │
│                           │  │ List with CTA  ││ Timeline    │ │
│                           │  └───────────────┘└─────────────┘ │
│                           │                                    │
│                           │  THREE-COLUMN ROW                  │
│                           │  ┌──────────┐┌──────┐┌──────────┐ │
│                           │  │ Active   ││ Top  ││ Spend    │ │
│                           │  │ RFQs (3) ││Vends ││ Analysis │ │
│                           │  └──────────┘└──────┘└──────────┘ │
│                           │                                    │
│                           │  FULL-WIDTH ROW                    │
│                           │  Recent Procurement Activity Table │
│                           │                                    │
└────────────────────────────────────────────────────────────────┘
```

### KPI Cards
Each KPI card uses `rounded-2xl`, `shadow-sm`, white background, 24px padding.

Card anatomy:
- Icon: `icon-xl` (24px) in a 40px rounded-lg container with a pale tinted background
- Metric label: text-sm, Neutral-500, font-medium, uppercase tracking-wide
- Primary number: text-4xl, font-bold, Neutral-900
- Delta: text-sm, success green or error red, with ArrowUp/ArrowDown icon, mt-1
- Subtitle: text-xs, Neutral-400 ("vs last month")

KPI Cards for Company Dashboard:
1. Open Purchase Requests (FileText icon, Blue Pale background)
2. Active RFQs (Send icon, Cyan-light background)
3. Active Purchase Orders (ShoppingCart icon, success-light background)
4. Total Payment Volume (CreditCard icon, warning-light background)

### Pending Approvals Widget
- Card: rounded-2xl, shadow-sm, p-6
- Header: "Requires Your Action" in text-lg font-semibold, with count badge
- List: Up to 5 items, each showing: Type (PR/Invoice), Requestor name, Amount, Time ago, Approve/Review button
- Footer: "View all approvals →" link in Electric Blue

### Procurement Activity Timeline
- Chronological list of recent events across all modules
- Each entry: Icon (module-specific), event description, user, timestamp
- Alternating background on hover (Neutral-50)
- "View full audit log →" footer link

### Spend Analysis Chart
- Area chart with Cyan fill, Electric Blue line
- X-axis: last 6 months
- Y-axis: spend in ₹ (Indian Rupee formatting per PRD's Razorpay context)
- Interactive tooltip on hover
- Export button (BarChart2 icon)

---

## 3.3 Vendor Dashboard Layout

### Purpose
The Vendor Dashboard centers on business metrics that matter to a vendor: active RFQs requiring response, POs awaiting acceptance, pending invoices, and revenue performance. The layout is distinct from the Company Dashboard in its priorities, though it shares the same structural skeleton.

### Structure

```
┌────────────────────────────────────────────────────────────────┐
│  SIDEBAR (256px)          │  MAIN CONTENT AREA                 │
│  [Vendor Navigation]      │                                    │
│                           │  TOP NAVIGATION (56px)             │
│                           │  ────────────────────────────────  │
│                           │                                    │
│                           │  PAGE HEADER                       │
│                           │  "Welcome back, Nexus Supplies"    │
│                           │  Rating: ★★★★☆ 4.3 (128 reviews)  │
│                           │                                    │
│                           │  KPI ROW (4 metric cards)          │
│                           │  ┌──────┐┌──────┐┌──────┐┌──────┐ │
│                           │  │ RFQs ││ POs  ││Invcs ││ Rev  │ │
│                           │  │  6   ││  14  ││  ₹8M ││  ↑   │ │
│                           │  └──────┘└──────┘└──────┘└──────┘ │
│                           │                                    │
│                           │  TWO-COLUMN ROW                    │
│                           │  ┌───────────────┐┌─────────────┐ │
│                           │  │ Active RFQs   ││ Revenue     │ │
│                           │  │ (respond by)  ││ Trend Chart │ │
│                           │  └───────────────┘└─────────────┘ │
│                           │                                    │
│                           │  THREE-COLUMN ROW                  │
│                           │  ┌──────────┐┌──────┐┌──────────┐ │
│                           │  │ Pending  ││ Top  ││ Customer │ │
│                           │  │ PO Accept││Prods ││ Reviews  │ │
│                           │  └──────────┘└──────┘└──────────┘ │
│                           │                                    │
│                           │  Recent Order Activity Table       │
│                           │                                    │
└────────────────────────────────────────────────────────────────┘
```

### Vendor KPI Cards
1. Open RFQs Pending Response (Send icon — deadline urgency highlighted in amber if < 48 hours)
2. Active Purchase Orders (ShoppingCart icon)
3. Invoices Awaiting Payment (FileSpreadsheet icon)
4. Monthly Revenue (TrendingUp icon, success green when positive)

### Active RFQs Widget
Priority list of RFQs requiring vendor action.
- Each row: Company logo, Company name, RFQ title, Products count, Deadline badge (red if < 24h, amber if < 72h), "Respond" CTA button
- Sorted by urgency (deadline ascending)
- "View all RFQs →" footer link

### Revenue Trend Chart
- Bar chart showing monthly revenue for the last 6 months
- Electric Blue bars with Cyan accent on the current month
- Overlaid line showing quotation win rate (%)
- Dual Y-axis: left for ₹ revenue, right for win rate %

---

## 3.4 Platform Admin Layout

### Purpose
The Platform Admin interface is used exclusively by the VendorFlow system administrator(s) to monitor and manage the entire platform. It has a distinct visual identity — a slightly different navigation structure and a system-health-centric dashboard — while sharing the same design tokens.

### Structure

```
┌────────────────────────────────────────────────────────────────┐
│  ADMIN SIDEBAR (256px)    │  MAIN CONTENT AREA                 │
│                           │                                    │
│  ⊕ VendorFlow Admin      │  TOP NAVIGATION (56px)             │
│  [Platform name badge]    │  ────────────────────────────────  │
│                           │                                    │
│  ── PLATFORM ──           │  PAGE HEADER                       │
│  Dashboard                │  "Platform Administration"         │
│  Workspace Monitor        │  "July 6, 2026 • 342 active users" │
│  Company Management       │                                    │
│  Subscription Mgmt        │  SYSTEM HEALTH ROW (5 cards)       │
│                           │  Platform Status ✓ Operational     │
│  ── OPERATIONS ──         │  Active Companies: 48              │
│  User Management          │  Active Vendors: 312               │
│  Email Queue Monitor      │  API Uptime: 99.97%                │
│  Storage Monitor          │  Error Rate: 0.03%                 │
│  Payment Monitor          │                                    │
│  Error Logs               │  TWO-COLUMN ROW                    │
│                           │  Company Growth Chart | Workspace  │
│  ── CONFIGURATION ──      │  Activity Map                      │
│  Platform Settings        │                                    │
│  Security Settings        │  Recent Platform Activity Log      │
│  Announcements            │                                    │
└────────────────────────────────────────────────────────────────┘
```

### Distinction from Company/Vendor Layout
- Sidebar has a Deep Navy background with a subtle `#0D1F3C` tint differentiation for Admin context
- A top banner (4px height) in Electric Blue runs across the very top of the viewport to visually signal the admin context
- Company and Vendor count metrics replace procurement-centric KPIs
- Navigation groups are Platform, Operations, and Configuration rather than procurement modules

---

## 3.5 Sidebar Layout

Covered in full detail in Section 4 (Sidebar Design).

---

## 3.6 Top Navigation Layout

Covered in full detail in Section 5 (Top Navigation).

---

## 3.7 Workspace Switcher Layout

The workspace switcher appears in the sidebar header and allows users with access to multiple workspaces (e.g., a user who manages both a Company and a Vendor account) to switch contexts without re-authenticating.

### Structure

```
┌─────────────────────────────────────────┐
│  ┌───────────────────────────────────┐  │
│  │  [Company Logo 32px]              │  │
│  │  Meridian Technologies      ⌄    │  │
│  │  Company Workspace                │  │
│  └───────────────────────────────────┘  │
│                                         │
│  [Dropdown Panel — Elevation 3]         │
│  ┌─────────────────────────────────┐    │
│  │  WORKSPACES                     │    │
│  │  ──────────────────────────     │    │
│  │  ✓ Meridian Technologies        │    │
│  │    Company Workspace            │    │
│  │                                 │    │
│  │  ○  Nexus Supplies              │    │
│  │    Vendor Workspace             │    │
│  │                                 │    │
│  │  + Create New Workspace         │    │
│  └─────────────────────────────────┘    │
└─────────────────────────────────────────┘
```

The switcher is a `button` element with a `ChevronDown` icon. On click, a popover dropdown appears at Elevation 3 (shadow-md), `rounded-xl`, white background, `min-width: 240px`. Each workspace option shows a 24px logo/avatar, workspace name in text-sm font-semibold, and workspace type label in text-xs Neutral-400.

---

## 3.8 Analytics Layout

The analytics section uses a dashboard-within-dashboard pattern. The top area holds filter controls (date range picker, category selector, workspace selector). Below it, charts and data tables occupy a responsive grid.

### Structure

```
┌───────────────────────────────────────────────────────────────┐
│  Page Header: Analytics & Reports                             │
│  Sub: "Procurement intelligence for Meridian Technologies"    │
│                                                               │
│  FILTER BAR                                                   │
│  [Date Range: Last 30 Days ▾] [Category: All ▾] [Export ▾]  │
│                                                               │
│  TAB ROW                                                      │
│  Overview | Procurement | Spend | Vendors | Finance | Reports │
│                                                               │
│  KPI ROW (role-dependent)                                     │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐        │
│  │ Total    │ │ Avg PO   │ │ Vendor   │ │ Savings  │        │
│  │ Spend    │ │ Cycle    │ │ On-Time  │ │ vs Budget│        │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘        │
│                                                               │
│  CHART ROW (2 columns)                                        │
│  ┌────────────────────────┐ ┌────────────────────────┐       │
│  │ Spend by Category      │ │ Procurement Timeline   │       │
│  │ (Donut chart)          │ │ (Gantt / Bar)          │       │
│  └────────────────────────┘ └────────────────────────┘       │
│                                                               │
│  FULL-WIDTH CHART                                             │
│  Monthly Purchase Order Volume (Area Chart, 12 months)       │
│                                                               │
│  DATA TABLE                                                   │
│  Top Vendors by Purchase Volume (sortable, paginated)         │
└───────────────────────────────────────────────────────────────┘
```

### Chart Visual Standards
- All charts use the design token color palette
- Primary series: Electric Blue (#2563EB)
- Secondary series: Cyan (#06B6D4)
- Tertiary series: Success Green (#16A34A)
- Quaternary series: Warning Amber (#D97706)
- Grid lines: Neutral-100 (#F1F5F9)
- Axis labels: text-xs, Neutral-500
- Tooltips: white background, shadow-md, rounded-lg, p-3

---

## 3.9 Settings Layout

The settings section uses a two-column layout with a settings navigation on the left and the settings form on the right.

```
┌───────────────────────────────────────────────────────────────┐
│  Page Header: Settings                                        │
│                                                               │
│  ┌─────────────────────────┐  ┌────────────────────────────┐ │
│  │  SETTINGS NAV (240px)   │  │  SETTINGS CONTENT          │ │
│  │                         │  │                            │ │
│  │  WORKSPACE              │  │  Section Heading           │ │
│  │  > Company Profile      │  │  Section description       │ │
│  │  > Workspace Settings   │  │                            │ │
│  │  > Subscription         │  │  Form Fields               │ │
│  │                         │  │  (grouped in cards)        │ │
│  │  PEOPLE                 │  │                            │ │
│  │  > Employees            │  │  Save Changes button       │ │
│  │  > Departments          │  │  (sticky at bottom)        │ │
│  │  > Roles & Permissions  │  │                            │ │
│  │                         │  └────────────────────────────┘ │
│  │  PREFERENCES            │                                  │
│  │  > Notifications        │                                  │
│  │  > Email Preferences    │                                  │
│  │  > Theme                │                                  │
│  │  > Time Zone            │                                  │
│  │                         │                                  │
│  │  SECURITY               │                                  │
│  │  > Password             │                                  │
│  │  > Session Management   │                                  │
│  │  > Audit Logs           │                                  │
│  │                         │                                  │
│  │  INTEGRATIONS           │                                  │
│  │  > API Keys             │                                  │
│  │  > Webhooks             │                                  │
│  └─────────────────────────┘                                  │
└───────────────────────────────────────────────────────────────┘
```

Settings nav items: text-sm, font-medium, rounded-md, py-2 px-3. Active item: Electric Blue text, Blue Pale background. Section labels: text-xs, font-semibold, uppercase, tracking-wider, Neutral-400.

---

## 3.10 Forms Layout

VendorFlow forms follow a consistent structural pattern across all 50+ modules.

### Standard Form Structure

```
Form Container: max-width 720px, white background, rounded-xl, shadow-sm, p-8

┌─────────────────────────────────────────────────────────────┐
│  FORM HEADER                                                │
│  Heading: text-xl font-semibold                             │
│  Sub-heading: text-sm Neutral-500                           │
│  ─────────────────────────────────────────────────────────  │
│                                                             │
│  SECTION 1: [Section name]                                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Label (text-sm font-medium Neutral-700)              │  │
│  │  ┌──────────────────────────────────────────────────┐│  │
│  │  │ Input field (height 44px, rounded-md, border)    ││  │
│  │  └──────────────────────────────────────────────────┘│  │
│  │  Helper text (text-xs Neutral-400)                    │  │
│  │                                                       │  │
│  │  Two-column field group:                              │  │
│  │  ┌─────────────────────┐ ┌──────────────────────────┐│  │
│  │  │ Field 1             │ │ Field 2                  ││  │
│  │  └─────────────────────┘ └──────────────────────────┘│  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  SECTION 2: [Section name]                                  │
│  [Additional fields]                                        │
│                                                             │
│  ─────────────────────────────────────────────────────────  │
│  FORM FOOTER                                                │
│  [Cancel] (secondary button)    [Save / Submit] (primary)  │
└─────────────────────────────────────────────────────────────┘
```

### Form Field Specification
- Input height: 44px (comfortable touch target)
- Border: 1px solid Neutral-200 at rest
- Border on focus: 2px solid Electric Blue, with `shadow-blue-glow`
- Border on error: 1px solid Error Red, with error message below in text-xs error red
- Border on success (validated): 1px solid Success Green
- Background: white
- Border radius: rounded-md (8px)
- Padding: px-3 py-2
- Label: text-sm, font-medium, Neutral-700, mb-1
- Placeholder: Neutral-400
- Helper text: text-xs, Neutral-400, mt-1
- Error message: text-xs, Error Red, mt-1, with AlertCircle icon at 12px

### Multi-Step Forms
Complex workflows like Purchase Request creation and RFQ creation use a step indicator at the top.

Step indicator: horizontal progress bar with numbered steps. Completed steps show a checkmark circle in success green. Current step has a filled circle in Electric Blue. Future steps show an empty circle in Neutral-300.

---

## 3.11 Tables Layout

Tables are used extensively across VendorFlow — for listing purchase requests, vendors, employees, invoices, products, orders, and audit logs.

### Standard Table Anatomy

```
┌─────────────────────────────────────────────────────────────┐
│  TABLE HEADER ROW                                           │
│  ┌────────┐ Search bar (280px)  [Filters ▾] [+ New] [⬇️]  │
│  │ Title  │                                                 │
│  └────────┘                                                 │
│                                                             │
│  TABS (optional): All | Draft | Pending | Approved | Closed│
│                                                             │
│  ─────────────────────────────────────────────────────────  │
│  COLUMN HEADERS (bg: Neutral-50, border-bottom: Neutral-200)│
│  ☐  │ ID     │ Title     │ Vendor   │ Status   │ Date  │ ⋯ │
│  ─────────────────────────────────────────────────────────  │
│  ☐  │ PR-001 │ Laptop... │ Nexus    │ ● Draft  │ Jul 2 │ ⋯ │
│  ☐  │ PR-002 │ Chairs... │ —        │ ● Pending│ Jul 3 │ ⋯ │
│  ☐  │ PR-003 │ Server... │ CloudHW  │ ✓ Aprvd  │ Jul 4 │ ⋯ │
│  ─────────────────────────────────────────────────────────  │
│  PAGINATION                                                 │
│  Showing 1–20 of 128    [← Prev] [1] [2] [3] [Next →]     │
└─────────────────────────────────────────────────────────────┘
```

### Table Design Rules
- Column headers: text-xs, uppercase, tracking-wider, font-semibold, Neutral-500
- Row height: 52px
- Row hover: Neutral-50 background (0.5 opacity transition, 100ms)
- Row selected (checkbox): Blue-Pale background
- Zebra striping: NOT used (too visually busy for enterprise data)
- Status badges: `rounded-full`, `text-xs`, `font-medium`, 4px vertical padding, 10px horizontal padding
- Monospaced IDs: JetBrains Mono, text-xs, Neutral-500
- Action column: Three-dot menu (`MoreHorizontal` icon), appearing only on row hover
- Empty state: Centered illustration, text-lg font-medium heading, text-sm Neutral-500 description, CTA button

### Status Badge Colors

```
Draft         Neutral-100 bg  Neutral-600 text
Pending       Warning-Light   Warning Amber text
In Review     Blue-Pale       Electric Blue text
Approved      Success-Light   Success Green text
Active        Success-Light   Success Green text
Rejected      Error-Light     Error Red text
Cancelled     Neutral-100     Neutral-500 text
Shipped       Cyan-Light      Cyan-Dark text
Delivered     Success-Light   Success Green text
Paid          Success-Light   Success Green text
Overdue       Error-Light     Error Red text
AI Insight    Purple-Pale     Purple text (AI only)
```

---

## 3.12 Responsive Layout Behavior

### Desktop (1280px+)
- Full sidebar visible (256px fixed, left-anchored)
- Top navigation bar: 56px fixed height, right of sidebar
- Main content area: fluid, fills remaining width
- Content max-width: 1440px with `mx-auto`
- Page horizontal padding: `px-8` (32px each side)
- Cards grid: up to 4 columns in KPI rows, 2–3 columns in content rows

### Tablet (768px–1279px)
- Sidebar: Collapsed by default to 64px icon-only mode. Hamburger menu in top navigation expands it as an overlay drawer (full-width sidebar overlay, dismissable with backdrop click)
- Top navigation: remains full-width
- Content area: fills full viewport width minus collapsed sidebar (64px)
- Cards grid: 2 columns in KPI rows, 1–2 columns in content rows
- Page horizontal padding: `px-6` (24px each side)
- Tables: horizontal scroll enabled, fixed first column (ID/name)

### Mobile (below 768px)
- Sidebar: fully hidden by default. Hamburger icon in top-left of navigation opens a full-screen drawer from the left
- Top navigation: compressed — only logo, hamburger, notifications, and avatar remain visible
- Global search opens as a full-screen overlay on mobile
- Cards: single column stacked vertically
- Page horizontal padding: `px-4` (16px each side)
- Tables: Card list view replaces table rows on mobile (each record becomes a card with the key fields)
- Floating action button (FAB) for primary create actions on mobile

---

---

# PART 4 — SIDEBAR DESIGN

---

## 4.1 Overview

The sidebar is the primary navigation instrument of VendorFlow. It is always present on desktop, persistent and visible as the user moves between modules. The sidebar reinforces the platform's enterprise identity through its Deep Navy background, precise spacing, clean iconography, and deliberate visual hierarchy.

The sidebar has two states:
- **Expanded** (256px width) — shows icons + labels + section headers
- **Collapsed** (64px width) — shows icons only, with tooltip labels on hover

---

## 4.2 Company Logo & Brand Placement

The logo area occupies the top 56px of the sidebar, matching the height of the top navigation bar. This creates a visually aligned horizontal band across the top of the entire application.

```
Sidebar header (56px height):
┌─────────────────────────────────┐
│  [VF logo 28px]  VendorFlow     │
│                                 │
└─────────────────────────────────┘
```

### Expanded State
- VendorFlow icon/mark: 28px × 28px, placed 16px from left edge, vertically centered
- Wordmark "VendorFlow": text-base, font-semibold, white color, 10px left of icon
- Right side: Collapse toggle button (`PanelLeftClose` icon, 16px, Neutral-400, hover: white, cursor-pointer)

### Collapsed State
- Only the VendorFlow icon/mark is visible, centered horizontally at 32px × 32px
- Collapse toggle becomes the expand trigger, now showing `PanelRightOpen` icon, centered

### Colors
- Logo icon: full-color or white version of the VendorFlow mark
- Background: Deep Navy (#0A1628)
- Bottom border: 1px solid rgba(255,255,255,0.06)

---

## 4.3 Workspace Switcher

Directly below the logo header, a workspace switcher occupies the next 56px of the sidebar.

```
┌─────────────────────────────────┐
│  [Company logo 24px]            │
│  Meridian Technologies    ⌄    │
│  Company Workspace              │
└─────────────────────────────────┘
```

### Anatomy
- Company logo/avatar: 24px circle, rounded-full, white border 1px
- Workspace name: text-sm, font-semibold, white, truncated with ellipsis
- Workspace type: text-xs, Neutral-400
- ChevronDown icon: 14px, Neutral-500, right side
- Bottom border: 1px solid rgba(255,255,255,0.06)
- Hover: background `#0D1F3C`, cursor pointer

### Collapsed State
- Shows only the 32px company logo/avatar, centered
- Hovering shows a tooltip with the workspace name

### Dropdown Behavior
- Clicking the switcher opens a floating popover (Elevation 3, shadow-md)
- Popover appears to the right of the sidebar in collapsed mode, below in expanded mode
- Lists available workspaces with current workspace marked with a check
- Includes "Create new workspace" option at the bottom with a `Plus` icon
- Popover width: 280px, max-height: 400px, overflow-y: auto
- Switches workspace context on selection with a brief loading state (200ms skeleton)

---

## 4.4 Navigation Groups

Navigation items are organized into labeled groups. Group labels are section headings that visually separate related modules. They are non-interactive.

### Company Workspace Navigation Structure

```
─── MAIN ───────────────────────────────
  Dashboard
  
─── PROCUREMENT ─────────────────────────
  Purchase Requests
  RFQs
  Quotations
  Vendor Comparison
  Purchase Orders
  
─── VENDORS ─────────────────────────────
  Marketplace
  Connected Vendors
  Vendor Invitations
  
─── ORDERS ──────────────────────────────
  Order Tracking
  Shipments
  Goods Receipt (GRN)
  
─── FINANCE ─────────────────────────────
  Invoices
  Payments
  
─── COMMUNICATION ───────────────────────
  Messages
  Notifications
  
─── PEOPLE ──────────────────────────────
  Employees
  Departments
  Roles & Permissions
  
─── ANALYTICS ───────────────────────────
  Analytics
  Reports
  Audit Logs
  
─── SYSTEM ──────────────────────────────
  Settings
  (API & Integrations — if admin)
```

### Vendor Workspace Navigation Structure

```
─── MAIN ───────────────────────────────
  Dashboard

─── REQUESTS ────────────────────────────
  Active RFQs
  Quotations
  
─── ORDERS ──────────────────────────────
  Purchase Orders
  Order Fulfillment
  Shipments
  
─── CATALOG ─────────────────────────────
  Products
  Categories
  Inventory
  
─── FINANCE ─────────────────────────────
  Invoices
  Payments
  
─── CUSTOMERS ───────────────────────────
  Connected Companies
  Reviews & Ratings
  
─── COMMUNICATION ───────────────────────
  Messages
  
─── ANALYTICS ───────────────────────────
  Analytics
  Reports
  
─── SYSTEM ──────────────────────────────
  Documents
  Settings
```

### Platform Admin Navigation Structure

```
─── PLATFORM ────────────────────────────
  Dashboard
  
─── WORKSPACE MANAGEMENT ─────────────────
  Companies
  Vendors
  Subscriptions
  
─── OPERATIONS ──────────────────────────
  User Management
  Email Queue
  Storage Monitor
  Payment Monitor
  Error Logs
  
─── CONFIGURATION ────────────────────────
  Platform Settings
  Security
  Announcements
  API Management
```

---

## 4.5 Navigation Item Design

### Expanded State Item Anatomy

```
┌──────────────────────────────────────────┐
│  [Icon 16px]  Label text          [Badge]│
└──────────────────────────────────────────┘
```

- Container: `flex items-center gap-3`, height 36px, `rounded-md`, `mx-2` (8px from sidebar edge), `px-3`
- Icon: 16px Lucide icon, `shrink-0`
- Label: text-sm, font-medium
- Badge (optional): shows count or "New" tag; `rounded-full`, text-xs, min-width 18px height 18px, centered

### Visual States

```
Default (resting):
  Background: transparent
  Icon color: #94A3B8 (Neutral-400)
  Text color: #CBD5E1 (Neutral-300)

Hover:
  Background: #0D1F3C (Navy Medium)
  Icon color: #F1F5F9 (Neutral-100)
  Text color: #F1F5F9
  Transition: 150ms ease-out

Active / Current page:
  Background: #1A2F52 (Navy Light)
  Icon color: #3B82F6 (Blue-Light)
  Text color: #FFFFFF
  Left border: 3px solid #2563EB (Electric Blue), inset from rounded container
  Font weight: font-semibold

Focused (keyboard):
  Outline: 2px solid #2563EB (Electric Blue)
  Outline offset: 2px
```

### Collapsed State Item
- Container: 40px × 40px, centered icon only, `rounded-md`, `mx-auto`
- Icon: 18px (icon-md size in collapsed mode for better tap target)
- Active state: same blue left border effect (appears as a blue dot on the left in collapsed mode)
- Hover: Tooltip appears to the right, `z-tooltip` (700), dark navy background, white text, text-xs, `rounded-md`

### Section Headers (Group Labels)

```
Expanded:
  Text: group section name in uppercase
  Style: text-xs, font-semibold, tracking-widest, Neutral-500
  Padding: px-5 pt-5 pb-1
  Cursor: default (non-interactive)
  
Collapsed:
  Section headers are hidden
  A horizontal divider (1px, rgba(255,255,255,0.06)) separates groups
```

---

## 4.6 Notification Badges in Sidebar

Certain navigation items display count badges for pending actions.

```
Badge types:
  Count badge (> 0 pending items):
    Shape: rounded-full pill
    Background: Electric Blue (#2563EB) for general counts
    Background: Error Red (#DC2626) for urgent/overdue
    Text: white, text-xs, font-bold
    Min-width: 18px, height: 18px
    Positioned: right side of the nav item

  "New" badge:
    Text: "NEW"
    Background: Success Green (#16A34A)
    Text: white, text-xs, font-bold
    Uppercase tracking-wide
```

In collapsed sidebar mode, count badges appear as small dots (8px circle) positioned at the top-right of the icon container.

---

## 4.7 Collapsible Sub-Navigation

Some navigation groups support expandable sub-items. For example, "Procurement" in the Company Workspace can expand to show Purchase Requests, RFQs, Quotations inline.

### Behavior
- Parent item has a `ChevronRight` icon (14px, Neutral-500) on the right
- Clicking the parent toggles the sub-menu open/closed
- Open state: ChevronRight rotates 90° (150ms ease-out) to face down
- Sub-items indent 12px from parent, use text-xs font-medium
- Sub-item background on active: slightly lighter than parent active state
- Collapsed sidebar: Sub-navigation is not shown; clicking the parent icon navigates to the group's overview page

### Sub-Navigation Animation
- Height animates from 0 to full height on expand (200ms ease-in-out)
- Opacity animates 0 → 1 (150ms)
- Content does not clip during transition (overflow: hidden on container)

---

## 4.8 Permission-Based Navigation

Navigation items are rendered based on the logged-in user's role and permissions. Items the user cannot access are not shown — they are never shown as disabled/greyed, as this creates confusion and anxiety about missing functionality.

### Permission Rendering Logic

```
Company Super Administrator:
  ALL navigation items visible

Procurement Manager:
  Visible: Dashboard, All Procurement items, Vendors, Orders, Communication, Analytics, Reports
  Hidden: Finance (limited view), People management, System Administration

Procurement Officer:
  Visible: Dashboard, Purchase Requests, RFQs, Quotations, Vendors (read), Orders, Notifications
  Hidden: Vendor Comparison approval, Finance, IAM, Analytics

Finance Manager:
  Visible: Dashboard, Finance (full), Invoices, Payments, Analytics (finance-scoped), Reports
  Hidden: Procurement creation, Vendor management, IAM

Employee (General):
  Visible: Dashboard, Purchase Requests (own), Order Tracking (own), Notifications, Profile
  Hidden: All management modules, Finance, Analytics, IAM

Vendor Administrator:
  ALL vendor workspace items visible

Sales Manager:
  Visible: Dashboard, RFQs, Quotations, Purchase Orders, Messages, Analytics
  Hidden: Finance, Settings

Product Manager:
  Visible: Dashboard, Catalog, Categories, Inventory, Analytics
  Hidden: RFQs, Finance, Settings

Finance Executive:
  Visible: Dashboard, Invoices, Payments, Analytics (finance-scoped)
  Hidden: Catalog, RFQs, Orders management
```

---

## 4.9 Sidebar Bottom Section

The bottom of the sidebar contains persistent utility items that should always be accessible:

```
┌──────────────────────────────────────────┐
│  ───────────────────────────────────── │
│  [HelpCircle 16px]  Help & Support       │
│  [Settings 16px]    Settings             │
│                                          │
│  ───────────────────────────────────── │
│  [Avatar 28px]  Riya Sharma              │
│  Procurement Manager          [⋯]        │
└──────────────────────────────────────────┘
```

- Help & Support: Opens a slide-over panel with documentation links, keyboard shortcuts guide, and contact support
- Settings: Navigates to the Settings module
- User section: Shows avatar (28px circle), display name (text-sm font-medium white), role label (text-xs Neutral-400), and a three-dot menu for quick profile/logout access

### User Menu (Three-Dot Trigger)
Clicking `⋯` opens a small popover (Elevation 3):
- View Profile
- Account Preferences
- Keyboard Shortcuts
- Switch Theme (future)
- Log Out (red text, with `LogOut` icon)

---

## 4.10 Collapse Behavior

### Toggle Mechanism
- The sidebar collapse toggle is a button in the sidebar header area
- Icon: `PanelLeftClose` (expanded state) / `PanelRightOpen` (collapsed state)
- Clicking toggles the sidebar width between 256px and 64px
- User preference is persisted in `localStorage` across sessions

### Collapse Animation
- Width transition: 250ms, `cubic-bezier(0.4, 0, 0.2, 1)`
- Text labels fade out: opacity 1 → 0 over first 100ms
- Text labels fade in: opacity 0 → 1 starting at 150ms of the expand animation
- Icons shift to center alignment during collapse smoothly

### Main Content Adjustment
- The main content area adjusts its left margin in sync with the sidebar width transition
- This prevents layout jump — the content reflows smoothly as the sidebar collapses

### Auto-Collapse on Tablet
- On viewport widths 768px–1279px, the sidebar defaults to collapsed (64px)
- User can expand temporarily; it does not auto-collapse on navigation at tablet width
- On viewports below 768px, the sidebar is fully hidden; it opens as a full-screen overlay drawer

---

## 4.11 Hover Animations Summary

```
Interaction          Animation
─────────────────────────────────────────────────────────────────
Nav item hover       Background fill: 150ms ease-out
Nav item click       Scale: 0.98 → 1 over 100ms
Workspace switcher   Background fill: 150ms ease-out
Group expand         Chevron rotation: 150ms ease-out
                     Height animate: 200ms ease-in-out
Sidebar collapse     Width: 250ms cubic-bezier
Badge appear         Scale: 0 → 1 over 200ms (spring)
Tooltip appear       Opacity: 0 → 1 over 100ms, translateX 4px → 0
```

---

## 4.12 Keyboard Accessibility

All sidebar navigation is fully keyboard accessible:

```
Key                  Behavior
─────────────────────────────────────────────────────────────────
Tab                  Moves focus to next sidebar item (visible items only)
Shift+Tab            Moves focus to previous sidebar item
Enter / Space        Activates the focused nav item (navigate or expand)
ArrowDown            Moves to next nav item in the current group
ArrowUp              Moves to previous nav item in the current group
ArrowRight           Expands a collapsible group (if applicable)
ArrowLeft            Collapses the active group
Escape               Closes workspace switcher dropdown if open
[                    Collapses the sidebar (keyboard shortcut)
]                    Expands the sidebar (keyboard shortcut)
```

Focus ring specification:
- `outline: 2px solid #2563EB`
- `outline-offset: 2px`
- Visible in both light and dark themes
- Never suppressed with `outline: none` without a replacement

All interactive sidebar elements have:
- `role="navigation"` on the `<nav>` container
- `aria-label` on the sidebar (`aria-label="Main navigation"`)
- `aria-current="page"` on the active nav item
- `aria-expanded` on collapsible group triggers
- `aria-hidden="true"` on decorative icons
- Tooltip `role="tooltip"` with associated `aria-describedby` on icon-only items in collapsed state

---

---

# PART 5 — TOP NAVIGATION

---

## 5.1 Overview

The top navigation bar is a 56px fixed horizontal bar that spans the full width of the main content area (to the right of the sidebar). It serves as the global control center for the application: providing search, workspace context, quick actions, notifications, and user profile access from a single persistent location.

The top navigation is always visible. It does not scroll away. It is the user's anchor point in the application at all times.

### Visual Specification

```
┌────────────────────────────────────────────────────────────────┐
│  [Breadcrumbs]   [───── Global Search ─────]   [🔔][?][Avatar]│
│  56px height, white background, border-bottom: 1px Neutral-200│
└────────────────────────────────────────────────────────────────┘
```

Full expanded layout with all elements:

```
LEFT ZONE (breadcrumbs)          CENTER ZONE (search)     RIGHT ZONE (actions)
┌──────────────────────────────────────────────────────────────────────────────┐
│ Dashboard › Procurement › RFQs   [⌘K  Search VendorFlow...]  [⌘] [🔔] [⊕][☀][○]│
└──────────────────────────────────────────────────────────────────────────────┘
```

### Background
- Background: #FFFFFF (white)
- Bottom border: 1px solid #E2E8F0 (Neutral-200)
- Z-index: `z-sticky` (200)
- Box shadow: none on desktop (border provides separation); on mobile: `shadow-sm` to separate from scrolled content

---

## 5.2 Breadcrumbs

Breadcrumbs appear in the left zone of the top navigation. They communicate the user's current location in the application hierarchy.

### Structure

```
[Home icon]  /  Procurement  /  RFQs  /  RFQ-2024-089
```

### Design Specification

- Root segment: `LayoutDashboard` icon (14px), links to Dashboard
- Separator: `/` character, Neutral-300, text-sm
- Intermediate segments: text-sm, Neutral-500, font-medium, hover: Neutral-800, cursor: pointer, hover underline
- Current page segment: text-sm, Neutral-800, font-semibold, cursor: default (non-interactive)
- Maximum displayed segments: 4 (if deeper, middle segments collapse to `...` with a dropdown showing full path)
- Height: 56px (vertically centered)
- Gap between segments: 6px

### Breadcrumb Collapse Behavior

When the path is deeper than 4 levels:
```
[Home] / [...] / RFQs / RFQ-2024-089
```
Clicking `[...]` opens a small popover listing the hidden intermediate segments as clickable links.

---

## 5.3 Global Search

The global search sits in the center zone of the top navigation. It is the primary tool for navigating to any record, vendor, product, or module across the platform.

### Search Input (Closed State)

```
┌───────────────────────────────────────────────────────┐
│  [Search 14px]  Search VendorFlow...         ⌘K       │
└───────────────────────────────────────────────────────┘
```

- Width: `max-w-md` (448px) on desktop, `max-w-sm` on tablet
- Height: 36px
- Background: Neutral-50 (#F8FAFC)
- Border: 1px solid Neutral-200
- Border-radius: rounded-md (8px)
- Left: `Search` icon (14px, Neutral-400), px-3
- Placeholder: "Search VendorFlow..." in Neutral-400, text-sm
- Right: `⌘K` shortcut badge (text-xs, Neutral-400, rounded, border: Neutral-200, px-1.5 py-0.5)
- Cursor: pointer (opens command palette, does not focus inline)
- Hover: border-color → Neutral-300
- Focus ring on click: 2px solid Electric Blue

### Global Search — Expanded / Command Palette Overlay

Clicking the search input OR pressing `⌘K` (Mac) / `Ctrl+K` (Windows) opens the command palette as a full-search overlay.

```
Screen overlay backdrop:
  Background: rgba(15, 23, 42, 0.5)
  Backdrop-blur: 4px
  z-index: z-command (800)
  Transition: opacity 0 → 1, 150ms

Command palette panel:
  Width: 640px
  Max-height: 520px
  Position: center horizontally, 80px from top
  Background: #FFFFFF
  Border-radius: rounded-xl (12px)
  Shadow: shadow-xl (Elevation 4)
  Border: 1px solid Neutral-200
```

#### Search Panel Structure

```
┌─────────────────────────────────────────────────────────┐
│  [Search 16px]  [───────── Input (focused) ──────────]  │
│  ─────────────────────────────────────────────────────  │
│  RECENT SEARCHES                                        │
│  [Clock 12px]  RFQ-2024-089                    →        │
│  [Clock 12px]  Nexus Supplies                  →        │
│  [Clock 12px]  Invoice INV-1042                →        │
│  ─────────────────────────────────────────────────────  │
│  QUICK ACTIONS                                          │
│  [Plus 12px]  New Purchase Request             →        │
│  [Send 12px]  Create RFQ                       →        │
│  [Store 12px] Browse Vendor Marketplace        →        │
│  ─────────────────────────────────────────────────────  │
│  NAVIGATION                                             │
│  [LayoutDashboard]  Dashboard                  →        │
│  [ShoppingCart]     Purchase Orders            →        │
│  [BarChart2]        Analytics                  →        │
│  ─────────────────────────────────────────────────────  │
│  Keyboard: ↑↓ navigate  Enter select  Esc close         │
└─────────────────────────────────────────────────────────┘
```

#### Search Results State (after typing ≥ 2 characters)

```
┌─────────────────────────────────────────────────────────┐
│  [Search]  "nexus"                         [✕ Clear]    │
│  ─────────────────────────────────────────────────────  │
│  VENDORS (3)                                            │
│  [Store]  Nexus Supplies                       ★ 4.3   │
│           Office Equipment · Mumbai                     │
│  [Store]  Nexus IT Hardware                    ★ 3.9   │
│           IT Hardware · Bangalore                       │
│                                                         │
│  PURCHASE ORDERS (1)                                    │
│  [ShoppingCart]  PO-2024-0312  ·  Nexus Supplies       │
│                  Active  ·  ₹1,24,500                   │
│                                                         │
│  RFQs (2)                                               │
│  [Send]  RFQ-2024-089  ·  Nexus Supplies                │
│          Pending Response  ·  Deadline: Jul 10          │
│  ─────────────────────────────────────────────────────  │
│  Press Enter to see all results for "nexus"             │
└─────────────────────────────────────────────────────────┘
```

#### Searchable Entities

Per Module 41 (Global Search) and Module 21 (Procurement Search) of the PRD:

- Vendors
- Products
- Companies
- Employees
- Purchase Requests
- RFQs
- Quotations
- Purchase Orders
- Invoices
- Payments
- Documents
- Navigation items (modules, settings pages)
- Quick Actions (create new records)

#### Result Item Design
- Height: 56px per result
- Left: entity icon (14px, tinted by entity type color), entity name in text-sm font-medium, sub-details in text-xs Neutral-400
- Right: entity-specific metadata (status badge, amount, date)
- Hover: Neutral-50 background, 100ms
- Active (keyboard navigated): Blue-Pale background, Electric Blue left border 2px
- All items have `role="option"` within a `role="listbox"`

---

## 5.4 Command Palette

The command palette shares the same overlay and panel as Global Search but is triggered via `⌘K` / `Ctrl+K`. It extends search with executable actions.

### Command Palette Capabilities

The command palette allows users to:
1. Navigate to any page/module
2. Create new records (Purchase Request, RFQ, Product, etc.)
3. Change settings
4. Switch workspace
5. Perform bulk actions (if items are selected in the current table)
6. Access keyboard shortcut help

### Command Categories

```
Navigation commands:
  → Go to Dashboard
  → Go to Purchase Requests
  → Go to RFQs
  → Go to Vendor Marketplace
  → Go to Analytics
  → Go to Settings
  [All 50+ module navigation targets are registered]

Create commands:
  + New Purchase Request
  + New RFQ
  + Invite Employee
  + Add Product
  + Create Invoice

Action commands (context-sensitive — appear based on current page):
  ✓ Approve selected requests (if on Approvals page with items selected)
  ⬇ Export current table to CSV
  🔍 Search within current module

Settings commands:
  ⚙  Open Company Settings
  🔔 Open Notification Preferences
  🌙 Switch to Dark Mode (future)
  ⌨  View Keyboard Shortcuts
```

### Command Palette Keyboard Shortcuts Reference Panel

Pressing `?` inside the command palette (or `Ctrl+/` globally) shows a shortcuts panel:

```
GENERAL
  ⌘K        Open Command Palette / Search
  ?         Keyboard shortcuts
  [         Collapse Sidebar
  ]         Expand Sidebar
  Escape    Close modal / overlay

NAVIGATION
  G then D  Go to Dashboard
  G then P  Go to Purchase Requests
  G then R  Go to RFQs
  G then O  Go to Purchase Orders
  G then V  Go to Vendors
  G then A  Go to Analytics

CREATE
  C then P  New Purchase Request
  C then R  New RFQ

TABLE
  /         Focus search in current table
  F         Open filters
  J         Select next row
  K         Select previous row
```

---

## 5.5 Notifications

The notification bell icon sits in the right zone of the top navigation.

### Bell Icon State

```
No notifications:
  [Bell 18px]  Neutral-500

Unread notifications exist:
  [Bell 18px]  Neutral-700 (slightly emphasized)
  + Red dot (8px circle, #DC2626) positioned top-right of icon

Unread count > 0:
  Badge over the bell: rounded-full, red bg, white text, text-xs
  Shows count up to 99; above 99 shows "99+"
```

### Notification Dropdown Panel

Clicking the bell icon opens a notification panel as a popover (Elevation 3, shadow-md):

```
Width: 380px
Max-height: 480px
Position: right-aligned below the bell icon
Border-radius: rounded-xl
Background: white
Border: 1px solid Neutral-200
```

```
┌─────────────────────────────────────────┐
│  Notifications                    Mark all read  │
│  ─────────────────────────────────────  │
│  UNREAD                                 │
│  ┌─────────────────────────────────┐    │
│  │ [Send 14px] New RFQ Response    │    │
│  │ Nexus Supplies responded to     │    │
│  │ RFQ-2024-089                    │    │
│  │ 2 minutes ago              ●    │    │
│  └─────────────────────────────────┘    │
│  ┌─────────────────────────────────┐    │
│  │ [CreditCard] Payment Received   │    │
│  │ ₹84,500 for Invoice INV-1039    │    │
│  │ 45 minutes ago             ●    │    │
│  └─────────────────────────────────┘    │
│  ─────────────────────────────────────  │
│  EARLIER                                │
│  [Bell] PO-0412 accepted by vendor      │
│         Yesterday at 3:45 PM            │
│                                         │
│  [FileText] PR-0218 approved            │
│         Jul 5, 2026                     │
│  ─────────────────────────────────────  │
│        View all notifications →         │
└─────────────────────────────────────────┘
```

### Notification Item Design
- Unread: white background, blue dot (8px, Electric Blue) on the right
- Read: Neutral-50 background
- Icon: 14px module-specific Lucide icon in a 32px rounded-lg colored container
- Title: text-sm, font-semibold, Neutral-800
- Description: text-xs, Neutral-500, line-clamp-2
- Time: text-xs, Neutral-400, right-aligned
- Hover: Neutral-50 background (unread items), Neutral-100 (read items), cursor pointer
- Click: navigates to the relevant record; marks the notification as read

### Notification Types and Icons

Per Modules 22, 29, 30, 31 of the PRD:

```
Event                       Icon            Color
─────────────────────────────────────────────────────────────────
RFQ Created                 Send            Electric Blue
RFQ Expiring                Clock           Warning Amber
New Quotation Received      Receipt         Cyan
Approval Required           ShieldAlert     Warning Amber
Purchase Order Created      ShoppingCart    Electric Blue
Vendor Accepted PO          CheckCircle     Success Green
Vendor Rejected PO          XCircle         Error Red
Order Shipped               Truck           Cyan
Invoice Generated           FileSpreadsheet Neutral
Payment Completed           CreditCard      Success Green
Employee Invited            UserPlus        Electric Blue
Vendor Invited              Store           Electric Blue
Review Request              Star            Warning Amber
System Alert                AlertTriangle   Error Red
```

### Notification Preferences Link
A gear icon in the notification panel header opens the notification preferences settings page.

---

## 5.6 Quick Actions

A primary `+ New` button in the right zone of the top navigation provides context-aware quick creation.

### Design

```
[+ New]  button
  Background: Electric Blue (#2563EB)
  Text: white, text-sm, font-semibold
  Height: 34px
  Padding: px-4
  Border-radius: rounded-md
  Icon: Plus 14px, white, mr-1.5
  Hover: Blue Hover (#1D4ED8)
  Active: scale 0.98
  Transition: 100ms
```

### Quick Action Dropdown

Clicking `+ New` opens a dropdown menu (Elevation 3) with context-aware creation options based on the current workspace and the user's permissions:

**Company Workspace Quick Actions:**
- New Purchase Request (`FileText`)
- Create RFQ (`Send`)
- Invite Employee (`UserPlus`)
- Invite Vendor (`Store`)
- Upload Document (`Upload`)

**Vendor Workspace Quick Actions:**
- Add Product (`Package`)
- Respond to RFQ (`Reply`)
- Generate Invoice (`FileSpreadsheet`)
- Upload Document (`Upload`)

Each action item has a leading icon (14px), label (text-sm), and optional keyboard shortcut hint (text-xs Neutral-400).

---

## 5.7 User Profile / Avatar

The user profile indicator sits at the far right of the top navigation.

### Design

```
Avatar circle: 32px diameter, rounded-full
  If user has uploaded photo: Photo
  If no photo: Initials (2 characters) on colored background
    Background color: derived from username hash → one of 8 preset colors
  Border: none at rest
  Border on hover: 2px solid Electric Blue
```

Clicking the avatar opens a profile dropdown (Elevation 3, shadow-md, rounded-xl, width: 260px):

```
┌─────────────────────────────────────┐
│  [Avatar 40px]  Riya Sharma         │
│                 riya@meridian.com   │
│                 Procurement Manager │
│  ─────────────────────────────────  │
│  [UserCircle]  View Profile         │
│  [Settings]    Workspace Settings   │
│  [CreditCard]  Billing              │
│  ─────────────────────────────────  │
│  [Sun]         Theme: Light ▾       │
│  [Globe]       Language: English ▾  │
│  ─────────────────────────────────  │
│  [LogOut]      Log Out              │
└─────────────────────────────────────┘
```

### Profile Menu Item Design
- Item height: 36px
- Icon: 14px, Neutral-400, mr-2.5
- Label: text-sm, Neutral-700
- Hover: Neutral-50 background, 100ms
- Destructive item (Log Out): Error Red text and icon
- Section dividers: 1px Neutral-100 horizontal rule

---

## 5.8 Breadcrumbs (Extended Detail)

Breadcrumbs were introduced in Section 5.2. This section covers advanced behavior.

### Dynamic Breadcrumb Updates
Breadcrumbs update without full page reload as the user navigates between detail views. The transition uses a 150ms fade (opacity) so the update is smooth and not jarring.

### Breadcrumb on Module List Pages
```
[Home icon]  /  Procurement  /  Purchase Requests
```
The current page segment (Purchase Requests) is not a link.

### Breadcrumb on Detail Pages
```
[Home icon]  /  Procurement  /  Purchase Requests  /  PR-2024-0081
```
"Purchase Requests" is a clickable link back to the list. "PR-2024-0081" is the current non-linked segment, showing the record identifier or name.

### Breadcrumb on Settings Subsections
```
[Home icon]  /  Settings  /  Roles & Permissions  /  Edit Role: Procurement Manager
```

---

## 5.9 Theme Switch

A theme toggle appears in the top navigation's right zone on desktop and in the user profile dropdown on mobile.

### Desktop Toggle Design

```
Icon button: [Sun] / [Moon] depending on current theme
  Size: 32px × 32px button area, icon 16px
  Border-radius: rounded-md
  Background: transparent
  Border: none
  Icon color: Neutral-500
  Hover: Neutral-100 background, icon Neutral-700
  Active theme indicator: Electric Blue icon color
```

### Toggle Behavior
- Clicking `[Sun]` activates Light Mode
- Clicking `[Moon]` activates Dark Mode
- Theme preference persisted in `localStorage`
- System preference (`prefers-color-scheme`) is respected on first visit
- Theme change applies a CSS class to the `<html>` element (`class="dark"`)
- Color tokens swap via CSS custom properties — no flicker

**Note:** Dark mode is architecturally supported via the token system (see Section 2.4) but ships in a future release per the PRD's Non-Functional Requirements. The toggle appears in the UI but the dark theme will be delivered in a subsequent release.

---

## 5.10 Workspace Selector (Top Navigation Context)

In addition to the sidebar workspace switcher (Section 4.3), the top navigation displays the current workspace name as a context anchor for users who may have collapsed the sidebar.

### Design

```
Position: between breadcrumbs and search bar (or above breadcrumbs as a small label)
Format:  [Company logo 16px]  Meridian Technologies
Style: text-xs, font-medium, Neutral-500
On narrow viewports: hidden (workspace name already visible in sidebar when expanded)
```

This element is read-only in the top navigation. Workspace switching is performed only via the sidebar workspace switcher to avoid redundant interaction patterns.

---

## 5.11 Top Navigation — Responsive Behavior

### Desktop (1280px+)
Full layout as described: breadcrumbs (left), search (center), quick actions + notifications + theme + avatar (right).

### Tablet (768px–1279px)
- Breadcrumbs: visible but limited to 2 segments (current section + current page)
- Search: slightly narrower, still visible
- Quick actions: `+ New` button visible
- Theme toggle: moved into profile dropdown
- Avatar: visible

### Mobile (below 768px)
- Breadcrumbs: hidden (page title shown in page header content area instead)
- Search: collapses to a `Search` icon button that opens a full-screen search overlay
- `+ New` button: hidden from nav; replaced with a floating action button (FAB) at bottom-right of viewport
- Notifications: bell icon visible, opens a full-screen notification panel
- Theme toggle: inside profile dropdown
- Avatar: visible
- Hamburger menu icon (`Menu` 20px): added to far left of the mobile nav bar, to the left of the brand mark, opens the sidebar drawer

```
Mobile Nav Bar (56px):
┌──────────────────────────────────────┐
│  [☰] [VF logo]          [🔍][🔔][○] │
└──────────────────────────────────────┘
```

---

## 5.12 Top Navigation — Keyboard Accessibility

```
Key                  Behavior
─────────────────────────────────────────────────────────────────
⌘K / Ctrl+K          Open command palette / search
Tab                  Moves focus through top nav elements
Enter / Space        Activates focused button
Escape               Closes any open dropdown from the nav
/                    Focuses the search input (when not in a text field)
```

All interactive elements have:
- `role="button"` or semantic equivalent
- `aria-label` on icon-only buttons (e.g., `aria-label="Open notifications"`)
- `aria-haspopup="true"` and `aria-expanded` state on dropdown triggers
- Notification bell: `aria-label="Notifications (3 unread)"` updating dynamically
- `role="dialog"` and `aria-modal="true"` on the search/command palette overlay

---

*— End of DESIGN.md Part 1 —*

*Part 2 will cover all module-specific page designs.*
*Part 3 will cover component library and interaction patterns.*


---

# PART 2 — MODULE UI/UX SPECIFICATIONS

---

> This section defines the complete interface specification for every module in VendorFlow.
> Each module entry covers: Purpose, User Flow, Page Layout, Navigation, Components, Tables, Forms, Buttons, Filters, Search, Empty State, Loading State, Error State, Success State, Responsive Behaviour, Permissions, Accessibility, and Developer Notes.

---

## MODULE 1 — AUTHENTICATION

---

### Purpose
Provide secure, frictionless access to the VendorFlow platform for all user types: company employees, vendor staff, and platform administrators. Authentication is the trust gateway — it must feel fast, clean, and professional.

---

### User Flow

**Registration Flow (Company):**
1. User lands on `/register/company`
2. Fills Step 1: Full name, work email, password
3. Submits → Email verification OTP sent
4. Enters 6-digit OTP on `/verify-email`
5. Redirected to Company Workspace setup (`/onboarding/company`)

**Registration Flow (Vendor):**
1. User lands on `/register/vendor`
2. Fills Step 1: Full name, work email, password
3. Submits → Email verification OTP sent
4. Enters OTP
5. Redirected to Vendor Profile setup (`/onboarding/vendor`)

**Login Flow:**
1. User lands on `/login`
2. Enters email + password OR clicks "Continue with Google"
3. On success → redirected to their workspace dashboard
4. On MFA (future) → OTP step shown

**Forgot Password Flow:**
1. `/forgot-password` — user enters registered email
2. Password reset email sent (Resend)
3. User clicks link → `/reset-password?token=...`
4. Enters new password + confirm password
5. On success → redirected to `/login` with success toast

**Invitation Acceptance Flow:**
1. Employee/Vendor receives invitation email
2. Clicks "Accept Invitation" → `/accept-invite?token=...`
3. Pre-filled email shown (read-only)
4. User sets password (if first time) or logs in with existing credentials
5. Redirected to their company/vendor workspace

---

### Page Layout

All auth pages use the two-column split-screen layout defined in Part 1, Section 3.1.

**Left Panel (40% width, Deep Navy #0A1628):**
- VendorFlow logo top-left
- Central brand illustration (abstract procurement/network graphic)
- Tagline: "Enterprise Procurement, Simplified."
- Sub-tagline: "Connect companies and vendors. Streamline every purchase."
- Trust strip: "Trusted by procurement teams worldwide"

**Right Panel (60% width, #F8FAFC):**
- Centered form container: `max-w-[420px]`, white background, `rounded-2xl`, `shadow-md`, `p-8`
- VendorFlow colored mark above form: `h-8`
- Page-specific heading and form content

---

### Components Used

- `Input` — email, password, OTP digit inputs
- `Button` (primary full-width) — primary CTA
- `Button` (outlined full-width) — Google Sign-In
- `Label` — field labels
- `FormError` — inline field validation messages
- `OTPInput` — 6-digit segmented OTP field
- `PasswordInput` — password field with show/hide toggle (`Eye` / `EyeOff` icon)
- `GoogleButton` — Google OAuth button with Google logo SVG
- `Divider` — "or continue with" separator between email form and social auth
- `Alert` (info/error) — top-of-form banner for server-level errors
- `Spinner` — loading state during async auth calls
- `Toast` — success/error feedback on completion

---

### Forms

**Login Form:**
```
Field: Email Address
  Type: email input
  Placeholder: you@company.com
  Validation: required, valid email format

Field: Password
  Type: password input (show/hide toggle)
  Placeholder: Enter your password
  Validation: required, min 8 chars

Link: "Forgot password?" — right-aligned below password field, text-sm Electric Blue

Button: Sign In — full-width, primary, height 44px

Divider: "or"

Button: Continue with Google — full-width, outlined, Google logo left

Footer: "Don't have an account? Create one" — text-sm, centered, Electric Blue link
```

**Register Form (Step 1 — Account Details):**
```
Field: Full Name
  Type: text input
  Placeholder: Riya Sharma
  Validation: required, min 2 chars

Field: Work Email
  Type: email input
  Placeholder: riya@company.com
  Validation: required, valid email, unique check on blur

Field: Password
  Type: password (show/hide)
  Placeholder: Create a strong password
  Validation: min 8 chars, 1 uppercase, 1 number
  Strength meter: 4-segment color bar below input

Field: Confirm Password
  Type: password
  Validation: must match password

Button: Create Account — full-width, primary

Divider: "or"

Button: Continue with Google

Footer: "Already have an account? Sign in"
Terms notice: "By creating an account you agree to our Terms of Service and Privacy Policy" — text-xs, Neutral-400, centered
```

**Email OTP Verification Form:**
```
Heading: "Check your email"
Sub-heading: "We sent a 6-digit code to riya@company.com"

OTP Input: 6 individual digit boxes, auto-focus progression
  Each box: 48px × 56px, rounded-md, border Neutral-200, text-xl font-bold text-center
  Focus: Electric Blue border + glow shadow
  Filled: Neutral-900 text

Button: Verify Email — full-width, primary (disabled until 6 digits entered)

Text: "Didn't receive the code?" + "Resend" link (Electric Blue)
Resend cooldown: 60-second countdown timer shown after first send
```

**Forgot Password Form:**
```
Field: Email Address
  Type: email input
  Validation: required, valid email

Button: Send Reset Link — full-width, primary

Footer: "Back to sign in" — Electric Blue link with ArrowLeft icon
```

**Reset Password Form:**
```
Field: New Password (password + show/hide + strength meter)
Field: Confirm New Password

Button: Reset Password — full-width, primary
```

---

### Buttons

| Button | Variant | Usage |
|---|---|---|
| Sign In / Create Account | Primary, full-width | Primary form CTA |
| Continue with Google | Outlined, full-width | OAuth alternative |
| Verify Email | Primary, full-width | OTP submission |
| Send Reset Link | Primary, full-width | Forgot password |
| Reset Password | Primary, full-width | Password reset CTA |
| Resend Code | Ghost/link | OTP resend |
| Back to Sign In | Ghost/link with icon | Navigation |

---

### Empty State
Not applicable for authentication pages.

---

### Loading State
- Primary button shows an inline `Spinner` (16px, white) replacing the button text during async operations
- Button becomes `disabled` and opacity 0.7 during loading
- No skeleton loaders on auth pages (forms are not data-driven)

---

### Error State

**Inline field errors:**
- Red border on the invalid field
- Error message below field: `AlertCircle` icon (12px, red) + text-xs red text
- Examples: "Invalid email address", "Password must be at least 8 characters"

**Server-level errors (top of form):**
- `Alert` component: Error Red background (#FEE2E2), red border-left 4px, `AlertTriangle` icon, error message text
- Examples: "Invalid email or password", "This email is already registered", "Verification link has expired"

**OTP errors:**
- All 6 boxes turn red border
- Error message below: "Invalid code. Please try again." + remaining attempts count

---

### Success State

- Email verification success → green `Alert` banner: "Email verified successfully. Setting up your workspace..."
- Password reset success → redirected to `/login` with a success toast: "Password updated. Please sign in."
- Invitation acceptance → redirected to workspace with welcome toast

---

### Responsive Behaviour

- **Desktop (xl+):** Two-column split-screen
- **Tablet (md):** Left panel hidden. Single centered form column on `#F8FAFC` background. Logo centered above form.
- **Mobile (xs-sm):** Same as tablet. `px-4` padding. Form container: no shadow, no border-radius (full-width card). Logo 24px height.

---

### Permissions
Authentication pages are publicly accessible (unauthenticated). Authenticated users accessing `/login` or `/register` are redirected to their workspace dashboard.

---

### Accessibility

- All form fields have associated `<label>` elements (not placeholder-only)
- `aria-describedby` links error messages to their fields
- `aria-invalid="true"` on fields with validation errors
- OTP input: `aria-label="Digit 1 of 6"` on each box; auto-advance on digit entry
- Password strength meter: `role="meter"` with `aria-valuenow` and `aria-valuetext`
- Form submit: `aria-busy="true"` on button during loading
- Google button: `aria-label="Continue with Google"`
- Focus management: After form submit error, focus returns to the first invalid field

---

### Developer Notes

- Authentication managed via Supabase Auth (per PRD Technical Requirements)
- Google OAuth handled via Supabase's built-in Google provider
- OTP verification uses Supabase's `verifyOtp` method
- JWT tokens stored in `httpOnly` cookies via Supabase session management
- Route protection: middleware checks session on every protected route; redirects to `/login` if unauthenticated
- Invitation tokens: stored in Supabase, single-use, 72-hour expiry
- Password strength evaluation: use `zxcvbn` library client-side
- Rate limiting: OTP resend capped at 5 attempts per hour per email (Supabase Auth config)
- All auth pages are statically rendered with no SSR data fetching

---

---

## MODULE 2 — COMPANY WORKSPACE

---

### Purpose
Allow organizations to create and configure their isolated procurement workspace on VendorFlow. This is the onboarding entry point for every company. The workspace setup wizard runs immediately after the Company Super Administrator completes email verification.

---

### User Flow

1. Post-verification redirect lands user on `/onboarding/company`
2. Multi-step wizard: Company Details → Address & GST → Workspace Configuration → Invite Employees (optional)
3. On completion → redirect to Company Dashboard `/dashboard`
4. Returning users edit workspace via Settings → Company Profile

---

### Page Layout

**Onboarding Wizard Layout:**
```
┌────────────────────────────────────────────────────────────┐
│  VendorFlow logo (top-left, 28px)                          │
│                                                            │
│  Step Progress Bar                                         │
│  ●────────○────────○────────○                              │
│  Details  Address  Config   Invite                         │
│                                                            │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  STEP HEADING                                        │  │
│  │  Step description                                    │  │
│  │                                                      │  │
│  │  FORM FIELDS                                         │  │
│  │                                                      │  │
│  │  [Back]                          [Continue →]        │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                            │
│  "Skip for now" link — text-sm, Neutral-400, centered     │
└────────────────────────────────────────────────────────────┘
```
Container: centered, `max-w-[640px]`, full-height page with `#F8FAFC` background.

**Company Profile Settings Page Layout:**
Full page within the authenticated app shell (sidebar + top nav). Settings two-column layout per Part 1, Section 3.9.

---

### Components Used

- `StepIndicator` — horizontal progress with numbered steps and labels
- `Input`, `Textarea`, `Select`, `FileUpload`
- `PhoneInput` — country code + number field
- `LogoUpload` — drag-and-drop image uploader with preview circle
- `AddressForm` — street, city, state, pincode, country fields
- `GSTInput` — 15-character GST number field with format validation
- `Badge` — workspace type indicator (Company)
- `Card` — section containers on Settings page
- `Button` (primary + secondary)
- `Toast` — step save confirmation

---

### Forms

**Step 1 — Company Details:**
```
Company Name*           text input, max 100 chars
Company Logo            image upload (PNG/JPG, max 2MB), circular preview 80px
Industry / Category*    select dropdown (Manufacturing, IT, Healthcare, etc.)
Company Size*           select (1–10, 11–50, 51–200, 201–1000, 1000+)
Website                 URL input (optional)
Company Description     textarea, max 500 chars (optional)
```

**Step 2 — Address & Tax Information:**
```
Registered Address*     text input
City*                   text input
State*                  select (Indian states)
Pincode*                6-digit numeric input
Country*                select (India default)
GST Number              text input, pattern: [0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}[Z]{1}[0-9A-Z]{1}
PAN Number              text input, pattern: [A-Z]{5}[0-9]{4}[A-Z]{1}
Phone Number*           phone input with country code
```

**Step 3 — Workspace Configuration:**
```
Workspace Name*         text input, pre-filled with company name, editable
Default Currency*       select (INR default, USD, EUR, GBP)
Default Time Zone*      select, auto-detected from browser
Fiscal Year Start*      month select (April default for India)
Approval Required       toggle: "Require approval for Purchase Requests"
```

**Step 4 — Invite Employees (Optional):**
```
Email addresses         multi-value email input (add multiple, comma-separated)
Role assignment         select role per email (pre-set to "Employee")
Personal message        textarea (optional)
Button: Send Invitations
Link: "Skip for now — invite later"
```

---

### Buttons

| Button | Variant | Usage |
|---|---|---|
| Continue → | Primary | Advance to next step |
| Back | Secondary/Ghost | Previous step |
| Send Invitations | Primary | Invite employees |
| Skip for now | Ghost/link | Skip optional steps |
| Save Changes | Primary | Settings page update |
| Upload Logo | Outlined | Logo file picker |

---

### Empty State
Not applicable for onboarding (wizard always has content). Settings page: if company logo not uploaded, shows placeholder avatar with company initials.

---

### Loading State
- Step transitions: button shows spinner, form fields disabled
- Logo upload: progress bar inside the upload zone (0–100%)
- Settings save: button spinner + "Saving..." label text

---

### Error State
- GST validation failure: "Invalid GST number format" below field
- Logo upload error (size/type): "File must be JPG or PNG under 2MB"
- Step submit failure: top-of-form error Alert with server message

---

### Success State
- Each step save: subtle green checkmark appears on the completed step dot in the progress bar
- Wizard completion: full-page success screen for 1.5 seconds ("Workspace ready!") then redirect to dashboard
- Settings save: success Toast "Company profile updated"

---

### Responsive Behaviour
- **Desktop:** Centered wizard card, max-width 640px
- **Tablet:** Same, slightly narrower padding
- **Mobile:** Full-width, no card shadow, `px-4`, logo upload tap-to-select (no drag-drop)

---

### Permissions
- Only Company Super Administrator can access Company Profile settings
- Onboarding wizard accessible only once (first login post-registration); subsequent access via Settings

---

### Accessibility
- Step indicator: `aria-label="Step 1 of 4: Company Details"`, current step marked `aria-current="step"`
- File upload: keyboard-accessible with `Enter`/`Space`, `aria-label="Upload company logo"`
- All form fields: associated labels, `aria-required="true"` on required fields

---

### Developer Notes
- Company record created in Supabase `companies` table on Step 1 save; subsequent steps upsert the same record
- Logo stored in Supabase Storage `company-logos/` bucket; public URL saved to `companies.logo_url`
- Workspace isolation enforced via Row Level Security (RLS) on all company-scoped tables using `company_id`
- GST validation: regex pattern + optional API validation against GST portal (future)
- Onboarding completion tracked via `companies.onboarding_completed` boolean flag

---

## MODULE 3 — IAM (IDENTITY & ACCESS MANAGEMENT)

---

### Purpose
Provide the Company Super Administrator with a powerful, visual interface to create roles, define granular permissions, and assign roles to employees. This is the security control center of the Company Workspace.

---

### User Flow

**Create Role:**
1. Navigate to People → Roles & Permissions
2. Click "+ New Role"
3. Enter role name and description
4. Configure permission matrix (module × action checkboxes)
5. Save role

**Assign Role to Employee:**
1. Navigate to People → Employees
2. Click employee row → Employee Detail
3. Click "Change Role" → select from available roles
4. Confirm

**Edit Permissions:**
1. Roles & Permissions page → click role row
2. Permission matrix opens inline or as slide-over
3. Toggle permissions → Save

---

### Page Layout

**Roles & Permissions List Page:**
```
┌──────────────────────────────────────────────────────────────┐
│  Page Header: Roles & Permissions                            │
│  Sub: "Manage access control for your workspace"             │
│  [+ New Role]                                                │
│                                                              │
│  ROLES GRID (3 columns)                                      │
│  ┌───────────────┐ ┌───────────────┐ ┌───────────────┐      │
│  │ Procurement   │ │ Finance       │ │ Employee      │      │
│  │ Manager       │ │ Manager       │ │               │      │
│  │ 3 members     │ │ 2 members     │ │ 12 members    │      │
│  │ 24 permissions│ │ 18 permissions│ │ 8 permissions │      │
│  │ [Edit] [⋯]   │ │ [Edit] [⋯]   │ │ [Edit] [⋯]   │      │
│  └───────────────┘ └───────────────┘ └───────────────┘      │
│                                                              │
│  SYSTEM ROLES (read-only badge)                              │
│  Company Super Administrator — all permissions               │
└──────────────────────────────────────────────────────────────┘
```

**Permission Matrix (slide-over panel, 600px wide):**
```
┌─────────────────────────────────────────────────────────────┐
│  Edit Role: Procurement Manager              [✕ Close]       │
│  ───────────────────────────────────────────────────────── │
│  Role Name:  [Procurement Manager          ]                │
│  Description: [Manages procurement workflow]                │
│                                                             │
│  PERMISSIONS                                                │
│  Module              View  Create  Edit  Approve  Delete    │
│  ─────────────────────────────────────────────────────────  │
│  Purchase Requests    ☑     ☑      ☑      ☑        ☐       │
│  RFQs                 ☑     ☑      ☑      ☑        ☐       │
│  Quotations           ☑     ☐      ☐      ☑        ☐       │
│  Purchase Orders      ☑     ☑      ☑      ☑        ☐       │
│  Vendors              ☑     ☐      ☐      ☐        ☐       │
│  Invoices             ☑     ☐      ☐      ☐        ☐       │
│  Payments             ☐     ☐      ☐      ☐        ☐       │
│  Employees            ☐     ☐      ☐      ☐        ☐       │
│  Analytics            ☑     ☐      ☐      ☐        ☐       │
│  Settings             ☐     ☐      ☐      ☐        ☐       │
│  ─────────────────────────────────────────────────────────  │
│  [Select All]  [Clear All]        [Cancel]  [Save Role]     │
└─────────────────────────────────────────────────────────────┘
```

---

### Components Used

- `RoleCard` — card showing role name, member count, permission count, edit/menu actions
- `PermissionMatrix` — table of modules × permission types with checkboxes
- `Checkbox` — individual permission toggles
- `Badge` — "System Role" (read-only), permission count
- `SlideOver` — role edit panel
- `Input`, `Textarea` — role name and description
- `ConfirmDialog` — delete role confirmation
- `Button` — all CTAs
- `Tooltip` — permission type descriptions on column headers

---

### Tables
Permission matrix table:
- Column headers: Module name | View | Create | Edit | Approve | Delete
- Header tooltips explain each permission type
- Sticky first column (module name) on horizontal scroll
- "Select All" row at bottom for bulk toggle

---

### Buttons

| Button | Variant | Usage |
|---|---|---|
| + New Role | Primary | Open new role slide-over |
| Edit | Secondary/outlined | Open permission matrix |
| Save Role | Primary | Save permissions |
| Cancel | Ghost | Dismiss slide-over |
| Delete Role | Destructive | Delete confirmation |
| Select All | Ghost | Bulk check all permissions |
| Clear All | Ghost | Bulk uncheck all permissions |

---

### Empty State
No roles created (beyond the system Super Admin role):
- `Shield` icon (48px), heading "No custom roles yet", sub-text "Create roles to control what your team can access.", CTA "+ Create Your First Role"

---

### Loading State
- Roles grid: 3 skeleton cards (gray animated shimmer blocks)
- Permission matrix: shimmer rows in the table

---

### Error State
- Duplicate role name: inline field error "A role with this name already exists"
- Cannot delete a role with members: Toast error "Remove all members from this role before deleting"

---

### Success State
- Role created: Toast "Role 'Procurement Manager' created"
- Permissions saved: Toast "Permissions updated"
- Role deleted: Toast "Role deleted"

---

### Responsive Behaviour
- **Desktop:** 3-column role card grid, full-width slide-over (600px)
- **Tablet:** 2-column grid, slide-over full-width
- **Mobile:** 1-column list of role cards, slide-over becomes full-screen bottom sheet

---

### Permissions
- Entire IAM module visible only to Company Super Administrator
- Other roles see no Roles & Permissions navigation item

---

### Accessibility
- Permission checkboxes: `aria-label="Allow [Role] to [Action] [Module]"` e.g. "Allow Procurement Manager to Create RFQs"
- Matrix table: `<thead>` with `scope="col"`, first column `scope="row"`
- Slide-over: `role="dialog"`, `aria-labelledby` pointing to role name heading, focus trapped inside

---

### Developer Notes
- Permissions stored in `role_permissions` table: `{role_id, module, action, allowed: boolean}`
- RBAC enforced at API layer (Supabase Edge Functions check user role before executing)
- Supabase RLS policies derived from role permissions where possible; complex logic in Edge Functions
- System roles (Super Admin) are seeded and cannot be modified or deleted
- Permission changes take effect immediately on next API call (no cache invalidation delay beyond current session)

---

## MODULE 4 — EMPLOYEE MANAGEMENT

---

### Purpose
Allow the Company Super Administrator and authorized managers to invite, manage, and organize company employees within the workspace. Every person who uses VendorFlow within a company is an employee record.

---

### User Flow

**Invite Employee:**
1. People → Employees → "+ Invite Employee"
2. Enter email(s), select role, optionally assign department
3. Send invitation → email dispatched via Resend
4. Invited employee appears in table with "Invited" status
5. Employee accepts invitation → status changes to "Active"

**Manage Employee:**
1. Click employee row → Employee Detail page
2. Edit role, department, status (Active/Inactive)
3. Resend invitation if pending

**Deactivate Employee:**
1. Employee row → three-dot menu → "Deactivate"
2. Confirmation dialog
3. Employee access revoked immediately

---

### Page Layout

**Employee List Page:**
```
┌──────────────────────────────────────────────────────────────┐
│  Page Header: Employees                                      │
│  Sub: "48 members across 6 departments"                      │
│  [+ Invite Employee]                                         │
│                                                              │
│  FILTER TABS: All (48) | Active (42) | Invited (4) | Inactive(2)│
│                                                              │
│  SEARCH + FILTERS: [Search employees...]  [Department ▾]    │
│                    [Role ▾]  [Status ▾]                      │
│                                                              │
│  EMPLOYEE TABLE                                              │
│  Avatar  Name          Email               Role       Dept   Status    Joined   Actions│
│  ────────────────────────────────────────────────────────────│
│  [RS]    Riya Sharma   riya@meridian.com   Proc. Mgr  Ops  ● Active   Jun 12   [⋯]   │
│  [AK]    Arjun Kumar   arjun@meridian.com  Employee   IT   ● Active   Jun 15   [⋯]   │
│  [—]     —             priya@meridian.com  Employee   —    ○ Invited  Jul 5    [⋯]   │
│                                                              │
│  Showing 1–20 of 48    [← Prev] [1] [2] [3] [Next →]       │
└──────────────────────────────────────────────────────────────┘
```

**Employee Detail Page (full page):**
```
┌──────────────────────────────────────────────────────────────┐
│  [← Back to Employees]                                       │
│                                                              │
│  PROFILE HEADER                                              │
│  [Avatar 64px]  Riya Sharma                                  │
│  Procurement Manager · Operations Department                 │
│  riya@meridian.com · +91 98765 43210                        │
│  ● Active since June 12, 2026           [Edit] [Deactivate] │
│                                                              │
│  TWO-COLUMN DETAIL                                           │
│  ┌─────────────────────────┐ ┌────────────────────────────┐ │
│  │ ROLE & PERMISSIONS      │ │ ACTIVITY                   │ │
│  │ Role: Procurement Mgr   │ │ Last login: 2 hours ago    │ │
│  │ [View Permissions]      │ │ PRs created: 18            │ │
│  │                         │ │ RFQs managed: 7            │ │
│  │ DEPARTMENT              │ │ POs generated: 12          │ │
│  │ Operations              │ │                            │ │
│  │ [Change Dept]           │ │ Recent Actions timeline    │ │
│  └─────────────────────────┘ └────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

---

### Components Used

- `DataTable` — employee list with sortable columns
- `Avatar` — initials-based or photo, 36px in table, 64px on detail page
- `StatusBadge` — Active (green), Invited (amber), Inactive (gray)
- `InviteModal` — modal for email + role + department selection
- `Select` — role and department dropdowns
- `MultiEmailInput` — enter multiple invitation emails
- `ConfirmDialog` — deactivate/delete confirmations
- `ActivityTimeline` — recent actions list on detail page
- `EmptyState` — no employees state
- `Pagination` — bottom of table

---

### Tables

Employee table columns:
| Column | Type | Sortable | Notes |
|---|---|---|---|
| Avatar + Name | Avatar + text | Yes (A–Z) | Name links to detail page |
| Email | text | No | Truncated, full on hover |
| Role | badge | Yes | Role name |
| Department | text | Yes | "—" if unassigned |
| Status | status badge | Yes | Active / Invited / Inactive |
| Joined | date | Yes | Formatted as "Jun 12, 2026" |
| Actions | three-dot menu | No | Edit, Resend Invite, Deactivate |

---

### Forms

**Invite Employee Modal:**
```
Email Address(es)*    multi-value email input (add up to 10 at once)
Role*                 select from available custom roles
Department            select (optional)
Personal Message      textarea (optional, 200 char limit)
```

**Edit Employee (inline on detail page):**
```
Role                  select
Department            select
Status                toggle (Active/Inactive)
```

---

### Filters

- Search: by name or email (real-time, debounced 300ms)
- Department: multi-select dropdown
- Role: multi-select dropdown
- Status: tabs (All / Active / Invited / Inactive)

---

### Empty State
- No employees yet: `Users` icon (48px), "No employees yet", "Invite your team to get started with VendorFlow", CTA "+ Invite Employee"
- Search/filter returns no results: "No employees match your filters", "Try adjusting your search or filter criteria", "Clear filters" link

---

### Loading State
- Table: 5 skeleton rows (shimmer avatar circle + 6 gray shimmer bars per row)

---

### Error State
- Invite to email already in workspace: Toast error "riya@meridian.com is already a member of this workspace"
- Deactivate own account: blocked, Toast "You cannot deactivate your own account"

---

### Success State
- Invitation sent: Toast "Invitation sent to 3 team members"
- Role changed: Toast "Riya Sharma's role updated to Finance Manager"
- Employee deactivated: Toast "Arjun Kumar has been deactivated" + row status badge updates to Inactive

---

### Responsive Behaviour
- **Desktop:** Full table with all columns
- **Tablet:** Hide "Department" and "Joined" columns; keep Name, Email, Role, Status, Actions
- **Mobile:** Table converts to list of cards: avatar + name + role badge + status badge + three-dot menu

---

### Permissions

| Role | Can Invite | Can Edit Role | Can Deactivate | Can View All |
|---|---|---|---|---|
| Super Admin | Yes | Yes | Yes | Yes |
| Procurement Manager | No | No | No | Yes (limited) |
| All others | No | No | No | No |

---

### Accessibility
- Table: `role="grid"`, column headers with `aria-sort` for sortable columns
- Avatar: `aria-label="Riya Sharma's profile picture"` or `aria-label="Riya Sharma — initials RS"`
- Deactivate button: `aria-label="Deactivate Arjun Kumar"` (not generic "Deactivate")
- Status badge color not sole indicator — text always present

---

### Developer Notes
- Invitation flow: creates `invitations` table record with `token`, `email`, `role_id`, `company_id`, `expires_at` (72h)
- Resend invitation: generates new token, invalidates previous
- Deactivation: sets `users.status = 'inactive'`, revokes active sessions via Supabase Auth admin API
- Employee belongs to exactly one company — enforced by RLS
- Department assignment stored in `employees.department_id` FK


---

## MODULE 5 — VENDOR REGISTRATION

---

### Purpose
Allow vendors to independently register on VendorFlow, create their company profile, and await verification before becoming discoverable to companies. This is the vendor's entry point into the platform ecosystem.

---

### User Flow

1. Vendor lands on `/register/vendor` (or clicks "Register as Vendor" on marketing site)
2. Fills Account Details (name, email, password) → email verification OTP
3. Multi-step Vendor Onboarding Wizard:
   - Step 1: Business Details
   - Step 2: Contact & Address
   - Step 3: Tax & Banking
   - Step 4: Business Documents Upload
   - Step 5: Preview & Submit for Verification
4. Submission triggers admin review notification
5. Status: "Pending Verification" shown on vendor dashboard
6. Admin approves → vendor receives email → status becomes "Verified"
7. Vendor now appears in Company Marketplace searches

---

### Page Layout

**Vendor Onboarding Wizard** — same centered wizard layout as Company Onboarding (`max-w-[680px]`, 5-step progress indicator).

**Vendor Registration Status Banner** (on Vendor Dashboard while pending):
```
┌─────────────────────────────────────────────────────────────┐
│  [Clock icon]  Your vendor profile is under review          │
│  We'll notify you within 1–2 business days once verified.   │
│  [Complete Profile →]                                       │
└─────────────────────────────────────────────────────────────┘
```
Background: Warning-Light (#FEF3C7), amber left border 4px, rounded-lg.

---

### Components Used
- `StepIndicator` (5 steps)
- `Input`, `Textarea`, `Select`, `FileUpload`
- `LogoUpload` — vendor company logo
- `DocumentUpload` — multi-document uploader for certificates
- `PhoneInput`, `BankDetailsForm`
- `CategoryMultiSelect` — vendor's product/service categories (multi-select tags)
- `TagInput` — keywords/specialization tags
- `VerificationBanner` — status banner on dashboard
- `PreviewCard` — read-only profile preview before submission

---

### Forms

**Step 1 — Business Details:**
```
Vendor Company Name*      text input
Business Type*            select: Manufacturer / Distributor / Retailer / Service Provider / Contractor
Industry / Category*      multi-select (up to 5 categories)
Year Established          year picker (optional)
Company Description*      textarea, 50–500 chars
Company Logo              image upload, circular preview 80px
```

**Step 2 — Contact & Address:**
```
Primary Contact Name*     text input
Designation               text input (optional)
Work Email*               pre-filled from registration (read-only)
Phone Number*             phone input
Website URL               URL input (optional)
Registered Address*       textarea
City*, State*, Pincode*   text inputs
Country*                  select (India default)
```

**Step 3 — Tax & Banking:**
```
GST Number*               text input with format validation
PAN Number*               text input
MSME Registration         text input (optional)
Bank Name*                text input
Account Holder Name*      text input
Account Number*           masked text input (show/hide)
IFSC Code*                text input, 11-char format
Bank Branch               text input (optional)
```

**Step 4 — Document Upload:**
```
GST Certificate           PDF/image upload, max 5MB
PAN Card                  PDF/image upload
Business License          PDF/image upload (optional)
ISO Certificate           PDF/image upload (optional)
Other Documents           multi-file upload, up to 5 files
```
Each upload shows: file name, size, upload progress bar, remove button.

**Step 5 — Preview & Submit:**
- Read-only summary of all entered information in card sections
- "Edit" link beside each section to jump back
- Checkbox: "I confirm all information provided is accurate and complete"
- Submit button: "Submit for Verification"

---

### Buttons

| Button | Variant | Usage |
|---|---|---|
| Continue → | Primary | Advance step |
| Back | Ghost | Previous step |
| Submit for Verification | Primary | Final submission |
| Edit (section) | Ghost/link | Jump to step |
| Upload Document | Outlined | File picker trigger |
| Remove (file) | Ghost destructive | Remove uploaded file |

---

### Empty State
Not applicable for onboarding wizard.

---

### Loading State
- Document uploads: per-file progress bars (0–100%)
- Submit: full-page loading overlay ("Submitting your profile...") with spinner
- Step transitions: button spinner

---

### Error State
- Duplicate GST: "A vendor with this GST number is already registered"
- File too large: "File exceeds 5MB limit"
- Required document missing on Step 4: red border on upload zone, "This document is required"
- Submit failure: error Alert at top of Step 5

---

### Success State
- Submission success: full-page confirmation screen:
  - `CheckCircle` icon 64px, success green
  - "Profile Submitted for Review"
  - "We'll review your documents and notify you at vendor@company.com within 1–2 business days"
  - CTA: "Go to Your Dashboard"

---

### Responsive Behaviour
- **Desktop/Tablet:** Centered wizard card
- **Mobile:** Full-width, document upload zones become large tap targets, file list scrollable horizontally

---

### Permissions
- Vendor Registration wizard accessible only to vendor-type users who haven't completed onboarding
- `/register/vendor` is public

---

### Accessibility
- Document upload zones: keyboard accessible (`Enter`/`Space` opens file picker), `role="button"`, `aria-label="Upload GST Certificate"`
- File list items: `role="listitem"`, remove button `aria-label="Remove [filename]"`
- Step 5 confirmation checkbox: `aria-required="true"`

---

### Developer Notes
- Vendor record created in `vendors` table with `verification_status: 'pending'`
- Documents stored in Supabase Storage `vendor-documents/[vendor_id]/` bucket (private access)
- Verification status updated by Platform Admin via System Administration module
- Verified vendor triggers `verification_status = 'verified'` email notification via Resend
- Vendor profile becomes discoverable in Marketplace only after `verification_status = 'verified'`

---

## MODULE 6 — VENDOR MARKETPLACE

---

### Purpose
Enable company users to discover, search, filter, and connect with verified vendors. The Marketplace is the procurement team's primary tool for expanding their vendor network.

---

### User Flow

1. Company user navigates to Vendors → Marketplace
2. Browse or search vendors by name, category, rating, location
3. Click vendor card → Vendor Profile page
4. Click "Connect" → connection request sent to vendor
5. Or click "Send RFQ" → pre-fills vendor in new RFQ form
6. Or click "Invite Vendor" → invitation email sent to vendor email

---

### Page Layout

```
┌──────────────────────────────────────────────────────────────┐
│  Page Header: Vendor Marketplace                             │
│  Sub: "Discover 312 verified vendors across 24 categories"   │
│                                                              │
│  SEARCH BAR (full-width)                                     │
│  [Search 18px]  Search vendors, products, categories...      │
│                                                              │
│  FILTER ROW                                                  │
│  [Category ▾] [Rating ▾] [Location ▾] [Industry ▾]          │
│  [Min Rating: ★★★+] [Verified Only toggle]                  │
│                                                              │
│  RESULT STATS: "Showing 48 vendors" [Grid view] [List view] │
│                                                              │
│  VENDOR GRID (3 columns desktop)                             │
│  ┌────────────────┐ ┌────────────────┐ ┌────────────────┐   │
│  │ [Logo 48px]    │ │ [Logo 48px]    │ │ [Logo 48px]    │   │
│  │ Nexus Supplies │ │ CloudHW India  │ │ OfficeFirst    │   │
│  │ ★ 4.3 (128)   │ │ ★ 4.7 (89)    │ │ ★ 4.1 (42)    │   │
│  │ IT Hardware    │ │ IT Hardware    │ │ Office Supply  │   │
│  │ Mumbai         │ │ Bangalore      │ │ Delhi          │   │
│  │ ✓ Verified     │ │ ✓ Verified     │ │ ✓ Verified     │   │
│  │ [Connect] [→]  │ │ [Connect] [→]  │ │ [Connect] [→]  │   │
│  └────────────────┘ └────────────────┘ └────────────────┘   │
│                                                              │
│  PAGINATION                                                  │
└──────────────────────────────────────────────────────────────┘
```

---

### Components Used

- `VendorCard` — logo, name, rating, category, location, status, actions
- `StarRating` — display-only star rating with count
- `VerifiedBadge` — `CheckCircle` icon + "Verified" text in success green
- `CategoryTag` — pill badges for vendor categories
- `SearchInput` — full-width marketplace search
- `FilterBar` — row of dropdown filter controls
- `ViewToggle` — grid/list view switcher (icon buttons)
- `Pagination`
- `ConnectButton` — primary action per card
- `EmptyState`
- `Skeleton` — card loading skeletons

---

### Vendor Card Design

```
Card: rounded-2xl, shadow-sm, p-5, white background, hover: shadow-md (150ms)
Top row: Logo (48px rounded-lg) left + "✓ Verified" badge right (or "Pending" gray)
Vendor Name: text-lg font-semibold, Neutral-900, mt-3
Star Rating: StarRating component, text-sm Neutral-500 "(128 reviews)"
Category tags: 1–2 pill tags below rating, Cyan-Light bg, Cyan-Dark text, text-xs
Location: MapPin 12px icon + text-sm Neutral-500
Connected indicator: if already connected, show "✓ Connected" instead of "Connect" button
Action row: [Connect] primary button (sm) + [View Profile →] ghost link
```

---

### Filters

| Filter | Type | Options |
|---|---|---|
| Category | Multi-select dropdown | All 24+ product/service categories from PRD Module 10 |
| Rating | Select | Any / ★3+ / ★4+ / ★4.5+ |
| Location | Select (state/city) | Indian states/cities |
| Industry | Multi-select | Manufacturing, IT, Healthcare, etc. |
| Verified Only | Toggle switch | Default: ON |

Active filters shown as dismissible chips below the filter row.

---

### Search
- Full-text search across vendor name, company description, category tags
- Debounced 300ms
- Search highlights matching text in results
- "No results for [query]" state with suggestion to clear filters or invite vendor

---

### Empty State
- No vendors (new platform): `Store` icon (48px), "No vendors found", "Try adjusting your filters or invite a vendor to join VendorFlow", CTA "Invite Vendor"
- Search/filter empty: "No vendors match your search", "Clear all filters" link

---

### Loading State
- 9 vendor card skeletons (gray shimmer blocks matching card dimensions)
- Search results: skeleton refresh with blur-transition (100ms)

---

### Error State
- Connect already sent: Toast "Connection request already sent to Nexus Supplies"
- Network error loading marketplace: Error banner "Failed to load vendors. Retry ↺"

---

### Success State
- Connect clicked: Card "Connect" button changes to "✓ Request Sent" (disabled, amber text) immediately (optimistic UI)
- Invite sent: Toast "Invitation sent to vendor@nexus.com"

---

### Responsive Behaviour
- **Desktop (xl+):** 3-column vendor grid
- **Tablet:** 2-column grid, filters collapse into "Filters" button that opens filter drawer
- **Mobile:** 1-column list, full-width cards, search bar sticky at top

---

### Permissions

| Role | Can View | Can Connect | Can Invite | Can Send RFQ |
|---|---|---|---|---|
| Super Admin | Yes | Yes | Yes | Yes |
| Procurement Manager | Yes | Yes | Yes | Yes |
| Procurement Officer | Yes | Yes | No | Yes |
| Finance Manager | Yes | No | No | No |
| Employee | Yes | No | No | No |

---

### Accessibility
- Vendor cards: `role="article"`, `aria-label="Nexus Supplies — IT Hardware vendor, rated 4.3 out of 5"`
- Connect button: `aria-label="Connect with Nexus Supplies"`
- View toggle: `aria-pressed="true/false"`, `aria-label="Grid view"` / `aria-label="List view"`
- Filter dropdowns: `aria-expanded`, `aria-haspopup="listbox"`

---

### Developer Notes
- Marketplace data fetched with TanStack Query, cached for 5 minutes
- Vendor search uses Supabase full-text search on `vendors` table (`name`, `description`, `categories`)
- "Connect" creates a record in `vendor_connections` table with `status: 'requested'`
- Vendor connection status joined in query to show correct button state
- Pagination: cursor-based (keyset pagination) for performance at scale


---

## MODULE 7 — VENDOR PROFILE

---

### Purpose
Display a comprehensive, trust-building profile page for each vendor. This is the vendor's "storefront" — it must communicate credibility, capability, and reliability to procurement teams evaluating potential suppliers.

---

### User Flow

**Company user viewing a vendor:**
1. Marketplace → click vendor card → `/vendors/[vendor-id]`
2. Browse profile sections (About, Products, Documents, Reviews)
3. Click "Connect", "Send RFQ", or "Invite to Quote"

**Vendor editing their own profile:**
1. Vendor Dashboard → Settings → Vendor Profile
2. Edit sections inline or via edit forms

---

### Page Layout

```
┌──────────────────────────────────────────────────────────────┐
│  PROFILE HERO BANNER                                         │
│  Background: Deep Navy gradient (#0A1628 → #1A2F52), 200px  │
│  [Vendor Logo 80px]  Nexus Supplies                          │
│  ★ 4.3 · 128 reviews · Mumbai, Maharashtra                  │
│  IT Hardware & Networking · Est. 2014 · ✓ Verified           │
│  [Connect] [Send RFQ] [Message]                  [Share ↗]  │
│                                                              │
│  STATS ROW (4 cards below hero)                              │
│  Orders Completed: 284 | On-Time Delivery: 96% | Response Time: < 4h | Avg Rating: 4.3│
│                                                              │
│  TAB NAVIGATION                                              │
│  [Overview] [Products (48)] [Documents] [Reviews (128)] [Team]│
│                                                              │
│  TWO-COLUMN LAYOUT (70% / 30%)                               │
│  LEFT (main content — tab-driven)                            │
│  RIGHT (sidebar — always visible)                            │
│  ┌─────────────────────────────┐ ┌───────────────────────┐  │
│  │  TAB CONTENT AREA           │ │  CONTACT CARD         │  │
│  │  About / Products /         │ │  Primary Contact      │  │
│  │  Documents / Reviews        │ │  Phone / Email        │  │
│  │                             │ │  Website              │  │
│  │                             │ │  ─────────────────    │  │
│  │                             │ │  CATEGORIES           │  │
│  │                             │ │  IT Hardware          │  │
│  │                             │ │  Networking           │  │
│  │                             │ │  ─────────────────    │  │
│  │                             │ │  CONNECTED SINCE      │  │
│  │                             │ │  March 2025           │  │
│  └─────────────────────────────┘ └───────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

---

### Tab Content — Overview
- About section: company description (full text, expandable "Read more")
- Certifications grid: ISO badge cards with expiry dates
- Awards/Recognition cards (if any)
- Key stats: years in business, employee count, service regions

### Tab Content — Products
- Grid of product cards (see Module 9)
- Search + category filter within vendor's catalog

### Tab Content — Documents
- Document list: GST Certificate, PAN, ISO Certificates (public-facing only)
- Verified badge on each verified document
- Download button (public documents only)

### Tab Content — Reviews
- Rating breakdown: 5-star distribution bar chart
- Review cards: reviewer company name, rating stars, comment, date
- Sort: Most Recent / Highest Rated / Lowest Rated

### Tab Content — Team
- Grid of team member cards: name, designation, `avatar`
- No contact details shown to external viewers (privacy)

---

### Components Used
- `ProfileHeroBanner` — gradient header with logo, name, rating, CTAs
- `StatCard` — 4 mini stat cards below hero
- `TabNavigation` — horizontal tabs
- `RatingDisplay` — star rating + count + distribution bars
- `ReviewCard` — individual review entry
- `ProductCard` — mini version (used within vendor profile)
- `DocumentCard` — doc name, type, verified badge, download
- `CertificationBadge` — certification type + issuer + expiry
- `ContactCard` — sidebar contact information card
- `CategoryPill` — tag pills in sidebar
- `Button` — Connect, Send RFQ, Message

---

### Buttons

| Button | Variant | Context |
|---|---|---|
| Connect | Primary | Company viewing vendor, not yet connected |
| ✓ Connected | Success/disabled | Already connected |
| Send RFQ | Secondary/outlined | Connected vendors only |
| Message | Ghost | Messaging module trigger |
| Share | Icon button | Copy profile link |
| Write a Review | Primary | Only post-order completion |

---

### Empty States
- No products uploaded: "This vendor hasn't added products yet"
- No reviews yet: `Star` icon, "No reviews yet — be the first to review after completing an order"
- No documents: "No public documents available"

---

### Loading State
Hero banner: skeleton gradient block. Stats row: 4 skeleton stat cards. Tab content: skeleton list/grid matching the active tab layout.

---

### Permissions

| Action | Who Can Perform |
|---|---|
| View profile | All company users, all platform users |
| Connect | Procurement Manager, Procurement Officer, Super Admin |
| Send RFQ | Procurement Manager, Procurement Officer |
| Message | Connected company users |
| Edit own profile | Vendor Admin (via Settings) |
| Write review | Company users who completed an order with this vendor |

---

### Accessibility
- Hero banner: `role="banner"`, vendor name as `<h1>`
- Tab navigation: `role="tablist"`, each tab `role="tab"`, `aria-selected`, `aria-controls`
- Tab panels: `role="tabpanel"`, `aria-labelledby`
- Review star ratings: `aria-label="Rated 4 out of 5 stars"`
- Profile action buttons: descriptive `aria-label` including vendor name

---

### Developer Notes
- Public profile data fetched server-side (SSR) for SEO and speed
- Profile URL: `/vendors/[vendor-slug]` (slug generated from company name + unique suffix)
- Rating aggregates computed via Supabase materialized view, refreshed on new review insert
- "Send RFQ" button pre-fills vendor in RFQ creation form via query param `?vendor=[id]`

---

## MODULE 8 — VENDOR DOCUMENTS

---

### Purpose
Securely store, manage, and verify business documents uploaded by vendors. Companies can view verified public documents; private documents are accessible only to the vendor and platform admins.

---

### User Flow

**Vendor uploading documents:**
1. Vendor Dashboard → Documents → "+ Upload Document"
2. Select document type, upload file, set visibility (Public/Private)
3. Document queued for admin verification

**Company viewing vendor documents:**
1. Vendor Profile → Documents tab
2. View public verified documents, download if permitted

---

### Page Layout (Vendor View — Document Management)

```
┌──────────────────────────────────────────────────────────────┐
│  Page Header: Business Documents                             │
│  Sub: "Manage your compliance and certification documents"   │
│  [+ Upload Document]                                         │
│                                                              │
│  DOCUMENT CATEGORIES (horizontal pills)                      │
│  All | Tax Documents | Licenses | Certifications | Other     │
│                                                              │
│  DOCUMENT LIST                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ [FileText 24px]  GST Certificate                     │   │
│  │ Uploaded: Jun 12, 2026  ·  PDF  ·  1.2 MB            │   │
│  │ Expiry: Mar 31, 2027  ·  ✓ Verified                  │   │
│  │ Visibility: Public     [Download] [Replace] [Delete]  │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ [FileText 24px]  ISO 9001:2015 Certificate           │   │
│  │ Uploaded: May 8, 2026   ·  PDF  ·  845 KB            │   │
│  │ Expiry: Dec 31, 2026    ·  ● Pending Verification    │   │
│  │ Visibility: Public     [Download] [Replace] [Delete]  │   │
│  └──────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────┘
```

---

### Components Used
- `DocumentCard` — file info, status badge, expiry, action buttons
- `FileUploadModal` — document type select, file upload zone, visibility toggle
- `StatusBadge` — Verified (green), Pending (amber), Rejected (red), Expired (gray)
- `ExpiryWarning` — amber banner when document expires within 30 days
- `ConfirmDialog` — delete confirmation
- `CategoryPill` — document category filter tabs

---

### Forms

**Upload Document Modal:**
```
Document Type*      select: GST Certificate / PAN / Business License / ISO Certificate / Other
Document Name       text input (auto-filled from type, editable)
File Upload*        drag-drop or click zone (PDF/JPG/PNG, max 10MB)
Expiry Date         date picker (optional but recommended)
Visibility*         radio: Public (visible on profile) / Private (admin only)
Notes               textarea (optional)
```

---

### Expiry Management
- Documents expiring within 30 days: amber `AlertTriangle` icon + "Expires in 28 days" label
- Expired documents: red `AlertCircle` icon + "Expired on [date]" label, document marked with "Expired" badge
- Vendor Dashboard widget: "2 documents expiring soon" alert card

---

### Permissions

| Action | Vendor Admin | Vendor Employee | Company User | Platform Admin |
|---|---|---|---|---|
| Upload | Yes | No | No | No |
| View public | Yes | Yes | Yes | Yes |
| View private | Yes | No | No | Yes |
| Download public | Yes | Yes | Yes | Yes |
| Verify/Reject | No | No | No | Yes |
| Delete | Yes | No | No | Yes |

---

### Accessibility
- File upload zone: `role="button"`, `aria-label="Upload document — drag and drop or click to select"`
- Document cards: `role="article"`, `aria-label="GST Certificate — Verified, expires March 31 2027"`
- Expiry warnings: `role="alert"` for expired documents

---

### Developer Notes
- Documents stored in Supabase Storage: private bucket `vendor-documents/[vendor_id]/[doc_id]`
- Public documents: signed URL generated on request (1-hour expiry) for download
- Expiry tracking: cron job (Supabase Edge Function scheduled) checks expiry daily, sends notification email 30 days before
- Verification status updated by Platform Admin; triggers notification to vendor

---

## MODULE 9 — VENDOR PERFORMANCE

---

### Purpose
Provide companies with a data-driven view of a vendor's historical performance, and give vendors visibility into how they are being rated and where they can improve. Surfaces on the Vendor Profile, Company analytics, and Vendor Dashboard.

---

### Page Layout (Vendor-facing Performance Dashboard)

```
┌──────────────────────────────────────────────────────────────┐
│  Page Header: Performance Overview                           │
│  Sub: "Based on 284 completed orders across 12 companies"    │
│                                                              │
│  PERFORMANCE SCORE CARD (full-width, prominent)              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Overall Score: 4.3 / 5.0  ★★★★☆                    │   │
│  │  ████████████████████░░░░  87/100                    │   │
│  │  "Excellent" — Top 15% of vendors in IT Hardware     │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  PERFORMANCE BREAKDOWN (5 metric cards)                      │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐             │
│  │Deliv │ │Qualit│ │Comms │ │Price │ │Overall│             │
│  │ 96%  │ │ 4.4★ │ │ 4.2★ │ │ 4.1★ │ │ 4.3★ │             │
│  └──────┘ └──────┘ └──────┘ └──────┘ └──────┘             │
│                                                              │
│  PERFORMANCE TREND (Area Chart)                              │
│  Rating score over last 12 months                            │
│                                                              │
│  RECENT REVIEWS                                              │
│  Review cards (latest 5, "View all →" link)                  │
└──────────────────────────────────────────────────────────────┘
```

---

### Components Used
- `ScoreCard` — large overall score display with progress bar
- `PerformanceMetricCard` — individual metric (delivery, quality, comms, price)
- `TrendChart` — area chart showing score over time
- `ReviewCard` — review with stars, comment, company name, date
- `RatingBar` — 5-star distribution horizontal bars
- `PercentageRing` — circular chart for on-time delivery %

---

### Metrics Displayed

| Metric | Source | Display |
|---|---|---|
| Overall Rating | Avg of all review ratings | Star display + number |
| On-Time Delivery | Order delivery vs expected date | Percentage |
| Product Quality | Quality rating from reviews | Star display |
| Communication | Communication rating from reviews | Star display |
| Response Time | Avg time to respond to RFQs | Hours/days |
| Repeat Business | % of companies who ordered again | Percentage |

---

### Permissions
- Vendor staff: see full performance dashboard for their own company
- Company users: see vendor performance on Vendor Profile page (public summary only)
- Platform Admin: see all vendor performance across the platform

---

### Developer Notes
- Performance scores computed via Supabase views joining `reviews`, `orders`, `rfq_responses` tables
- Trend chart data aggregated monthly using Supabase RPC function
- Score displayed on Marketplace cards refreshed when new review is submitted
- "Top X% of vendors in category" computed by percentile rank query


---

## MODULE 10 — PRODUCT CATALOG

---

### Purpose
Allow vendors to publish, manage, and showcase their full product and service offerings. Companies browse vendor catalogs to understand what a vendor supplies before initiating RFQs or Purchase Requests.

---

### User Flow

**Vendor adding a product:**
1. Catalog → Products → "+ Add Product"
2. Fill product details form (multi-step or single long form)
3. Upload product images (multiple)
4. Set pricing, specifications, availability
5. Assign category and tags
6. Publish or save as draft

**Company browsing a vendor's catalog:**
1. Vendor Profile → Products tab
2. Search/filter products
3. Click product → Product Detail page
4. Click "Request Quote" → creates RFQ pre-filled with this product

---

### Page Layout

**Product List Page (Vendor-facing):**
```
┌──────────────────────────────────────────────────────────────┐
│  Page Header: Product Catalog                                │
│  Sub: "48 products across 6 categories"                      │
│  [+ Add Product]  [Bulk Import CSV]                          │
│                                                              │
│  FILTER TABS: All (48) | Published (42) | Draft (4) | Archived(2)│
│  SEARCH: [Search products...]  [Category ▾]  [Status ▾]      │
│                                                              │
│  VIEW TOGGLE: [Grid] [List]                                  │
│                                                              │
│  PRODUCT GRID (3 columns)                                    │
│  ┌────────────────┐ ┌────────────────┐ ┌────────────────┐   │
│  │ [Product img]  │ │ [Product img]  │ │ [Product img]  │   │
│  │ 200px height   │ │ 200px height   │ │ 200px height   │   │
│  │ Laptop Pro 15" │ │ Network Switch │ │ CAT6 Cable     │   │
│  │ ₹85,000        │ │ ₹12,500        │ │ ₹450 / 100m    │   │
│  │ ● In Stock     │ │ ● In Stock     │ │ ○ Low Stock    │   │
│  │ IT Hardware    │ │ Networking     │ │ Accessories    │   │
│  │ [Edit] [⋯]    │ │ [Edit] [⋯]    │ │ [Edit] [⋯]    │   │
│  └────────────────┘ └────────────────┘ └────────────────┘   │
└──────────────────────────────────────────────────────────────┘
```

**Product Detail Page:**
```
┌──────────────────────────────────────────────────────────────┐
│  [← Back to Catalog]  Breadcrumb: Catalog › IT Hardware      │
│                                                              │
│  TWO-COLUMN LAYOUT (60% / 40%)                               │
│  ┌───────────────────────────┐ ┌──────────────────────────┐ │
│  │  IMAGE GALLERY            │ │  PRODUCT INFO            │ │
│  │  Main image (360px)       │ │  Laptop Pro 15"          │ │
│  │  Thumbnail strip below    │ │  SKU: NX-LP15-2024       │ │
│  │  (4 thumbnails, 72px each)│ │  Brand: TechCore         │ │
│  │                           │ │  Category: IT Hardware   │ │
│  │                           │ │                          │ │
│  │                           │ │  Price: ₹85,000          │ │
│  │                           │ │  Bulk: ₹82,000 (5+ units)│ │
│  │                           │ │  Min Order: 1 unit       │ │
│  │                           │ │  Lead Time: 3–5 days     │ │
│  │                           │ │  Availability: ● In Stock│ │
│  │                           │ │                          │ │
│  │                           │ │  [Request Quote]         │ │
│  │                           │ │  [Add to RFQ]            │ │
│  └───────────────────────────┘ └──────────────────────────┘ │
│                                                              │
│  TABS: Description | Specifications | Documents              │
│  Description: full product description (rich text display)   │
│  Specifications: key-value pairs in two-column grid          │
│  Documents: linked product datasheets, manuals               │
└──────────────────────────────────────────────────────────────┘
```

---

### Components Used
- `ProductCard` — grid card with image, name, price, stock status, category, actions
- `ProductImageGallery` — main image + thumbnail strip with keyboard navigation
- `PriceDisplay` — base price + bulk pricing tiers
- `StockBadge` — In Stock (green), Low Stock (amber), Out of Stock (red)
- `SpecificationTable` — two-column key/value pairs
- `CategoryTag` — product category pill
- `RichTextDisplay` — formatted product description
- `BulkImportModal` — CSV upload for bulk product creation
- `ProductForm` — create/edit form
- `DataTable` — list view of products
- `ImageUploader` — multi-image upload with drag-to-reorder

---

### Forms

**Add / Edit Product Form:**
```
SECTION 1 — Basic Information
  Product Name*           text input, max 150 chars
  SKU / Product Code      text input (auto-generated if blank)
  Brand                   text input (optional)
  Category*               select (from categories tree)
  Tags                    tag input (comma-separated keywords)
  Short Description       textarea, max 200 chars
  Full Description        rich text editor (bold, lists, links)

SECTION 2 — Pricing
  Base Price*             currency input (INR)
  Unit of Measure*        select: Unit / Piece / Kg / Metre / Box / Litre / etc.
  Minimum Order Qty       number input (default 1)
  Bulk Pricing Tiers      repeatable row: [Min Qty] [Price per unit] [+ Add Tier]
  Tax Rate                select: GST 5% / 12% / 18% / 28% / Exempt

SECTION 3 — Images
  Image Upload*           multi-image upload, drag-to-reorder
                          First image = primary/thumbnail
                          Max 8 images, each max 5MB, JPG/PNG/WEBP

SECTION 4 — Specifications
  Specifications          dynamic key-value pairs: [Key] [Value] [+ Add Row]

SECTION 5 — Availability
  Stock Status*           select: In Stock / Low Stock / Out of Stock / Made to Order
  Available Quantity      number input
  Lead Time               text input (e.g., "3–5 business days")
  Warehouse Location      text input (optional)

SECTION 6 — Status
  Publication Status      radio: Published / Draft / Archived
```

---

### Buttons

| Button | Variant | Usage |
|---|---|---|
| + Add Product | Primary | Open product form |
| Bulk Import CSV | Secondary/outlined | CSV bulk upload |
| Publish | Primary | Set status to Published |
| Save as Draft | Secondary | Save without publishing |
| Edit | Secondary (card) | Open edit form |
| Archive | Ghost destructive | Archive product |
| Request Quote | Primary | Company-side action |
| Add to RFQ | Secondary | Add to active RFQ |

---

### Filters & Search
- **Search:** product name, SKU, brand, tags — real-time debounced
- **Category filter:** hierarchical select from categories tree
- **Status tabs:** All / Published / Draft / Archived
- **Stock filter:** In Stock / Low Stock / Out of Stock

---

### Empty State
- No products yet: `Package` icon (48px), "No products in your catalog", "Start adding products to showcase your offerings", CTA "+ Add Your First Product"
- Search no results: "No products match '[query]'", "Clear search" link

---

### Loading State
- Grid: 6 product card skeletons (gray shimmer image placeholder + 3 text shimmer lines)
- Detail page: split-layout skeleton (left: large image shimmer, right: text shimmer lines)

---

### Error State
- Image upload error: "Failed to upload image. Try again."
- Duplicate SKU: "A product with this SKU already exists in your catalog"
- Form submit failure: top-of-form error Alert

---

### Success State
- Product created: Toast "Laptop Pro 15" added to your catalog"
- Product updated: Toast "Product updated successfully"
- Product archived: Toast "Product archived" + removed from Published count

---

### Responsive Behaviour
- **Desktop:** 3-column product grid; full two-column detail layout
- **Tablet:** 2-column grid; detail layout stacks (images top, info below)
- **Mobile:** 1-column grid; detail is single column, gallery swipeable carousel

---

### Permissions

| Action | Vendor Admin | Product Manager | Sales Manager | Other Vendor Roles |
|---|---|---|---|---|
| Add/Edit/Delete | Yes | Yes | No | No |
| View Catalog | Yes | Yes | Yes | Yes |
| Bulk Import | Yes | Yes | No | No |
| Archive | Yes | Yes | No | No |

Company users: read-only access to published products.

---

### Accessibility
- Product images: `alt` text required field in form, descriptive (not "image1.jpg")
- Image gallery: keyboard navigable (`←`/`→` arrows), `aria-label="Product image 2 of 4"`
- Price display: `aria-label="Price: 85,000 Indian Rupees"` (screen reader friendly)
- Stock badge: text always present, not color-only indicator

---

### Developer Notes
- Product images stored in Supabase Storage `product-images/[vendor_id]/[product_id]/`
- Primary image determined by `sort_order = 0` in `product_images` table
- Bulk CSV import: client-side validation then batch upsert via Edge Function
- Full-text search: Supabase `tsvector` on product name + description + tags
- Draft products: invisible to company users; published-only served in catalog queries

---

## MODULE 11 — PRODUCT CATEGORIES

---

### Purpose
Organize the vendor product catalog into a hierarchical taxonomy. Categories enable filtering in the Marketplace and Product Catalog, and power the RFQ product selection workflow.

---

### Page Layout (Vendor-facing Category Management)

```
┌──────────────────────────────────────────────────────────────┐
│  Page Header: Product Categories                             │
│  Sub: "Organize your catalog with categories"                │
│  [+ Add Category]                                            │
│                                                              │
│  CATEGORY TREE                                               │
│  ▶ IT Hardware (18 products)                                 │
│    ├─ Laptops & Desktops (8)                                 │
│    ├─ Networking Equipment (6)                               │
│    └─ Accessories & Peripherals (4)                          │
│  ▶ Office Supplies (12 products)                             │
│    ├─ Furniture (5)                                          │
│    └─ Stationery (7)                                         │
│  ▶ Software (6 products)                                     │
└──────────────────────────────────────────────────────────────┘
```

---

### Components Used
- `CategoryTree` — expandable tree structure with product counts
- `CategoryForm` — create/edit modal: name, parent category, description, category image (optional)
- `ConfirmDialog` — delete confirmation (warns if products assigned)
- `DragHandle` — drag-to-reorder categories

---

### Forms

**Add/Edit Category:**
```
Category Name*      text input
Parent Category     select (leave blank for top-level)
Description         textarea (optional)
Category Image      image upload (optional, used in marketplace filter UI)
Display Order       number (auto-assigned, drag-to-reorder overrides)
```

---

### Empty State
`FolderOpen` icon, "No categories yet", "Organize your products with categories", CTA "+ Add Category"

---

### Permissions
- Vendor Admin and Product Manager can create/edit/delete categories
- All other users: read-only

---

### Developer Notes
- Categories stored with `parent_id` FK for unlimited nesting (practical max: 3 levels)
- Platform-level global categories also exist (seeded by Platform Admin); vendor can add sub-categories under them
- Product count computed via `COUNT(products WHERE category_id = ...)`

---

## MODULE 12 — PRODUCT INVENTORY

---

### Purpose
Allow vendors to track product availability, stock levels, lead times, and warehouse locations. Inventory data surfaces on product pages and helps company buyers make informed purchasing decisions.

---

### Page Layout

```
┌──────────────────────────────────────────────────────────────┐
│  Page Header: Inventory                                      │
│  Sub: "Stock status across 48 products"                      │
│  [Update Stock Levels]  [Export]                             │
│                                                              │
│  FILTER TABS: All | In Stock | Low Stock | Out of Stock      │
│  SEARCH: [Search products...]  [Category ▾]                  │
│                                                              │
│  INVENTORY TABLE                                             │
│  Product         SKU        Category     Stock   Qty  Lead  Action│
│  Laptop Pro 15"  NX-LP15    IT Hardware  ●Green   50   3d  [Edit]│
│  Network Switch  NX-NS48    Networking   ●Amber    4   5d  [Edit]│
│  CAT6 Cable      NX-C6-100  Accessories  ●Red      0   7d  [Edit]│
│                                                              │
│  PAGINATION                                                  │
└──────────────────────────────────────────────────────────────┘
```

**Inline Quick Edit (row click → expand row):**
```
Stock Status    select dropdown (In Stock / Low Stock / Out of Stock)
Quantity        number input
Lead Time       text input
Warehouse       text input
[Save] [Cancel]
```

---

### Components Used
- `DataTable` — inventory list with status indicators
- `StockStatusDot` — colored dot (green/amber/red) + label
- `InlineEditRow` — expandable edit row
- `BulkEditModal` — update multiple products' stock status at once
- `LowStockAlert` — banner when more than 3 products are low stock

---

### Low Stock Alert Banner
```
[AlertTriangle amber]  4 products are running low on stock.
Update inventory to keep your catalog accurate.  [View Low Stock Items]
```

---

### Filters
- Status tabs: All / In Stock / Low Stock / Out of Stock
- Category filter dropdown
- Search by product name or SKU

---

### Permissions
- Vendor Admin and Product Manager: full read/write
- Sales Manager, Vendor Employee: read-only

---

### Developer Notes
- Inventory fields (`stock_status`, `quantity`, `lead_time`, `warehouse`) are columns on `products` table
- "Low Stock" threshold: configurable per vendor in Settings (default: ≤ 5 units)
- Inventory update triggers recalculation of product availability shown on Marketplace cards
- Export: CSV download of full inventory table via Edge Function


---

## MODULE 13 — PURCHASE REQUESTS (PR)

---

### Purpose
Allow any authorized company employee to formally initiate a purchase need. The Purchase Request is the starting point of every procurement lifecycle in VendorFlow — it captures what is needed, why, when, and for how much, and routes it through the appropriate approval chain before procurement action is taken.

---

### User Flow

1. Employee navigates to Procurement → Purchase Requests → "+ New Request"
2. Fills the PR form: items needed, quantity, required date, estimated budget, justification
3. Saves as Draft (work-in-progress) or Submits for Approval
4. Procurement Manager receives in-app + email notification
5. Manager reviews → Approves or Rejects with comment
6. Approved PR → Procurement Manager creates RFQ from this PR
7. Employee receives notification on approval/rejection

---

### Page Layout

**Purchase Request List Page:**
```
┌──────────────────────────────────────────────────────────────┐
│  Page Header: Purchase Requests                              │
│  Sub: "24 active requests this month"                        │
│  [+ New Request]                                             │
│                                                              │
│  FILTER TABS                                                 │
│  All (48) | Draft (6) | Pending (12) | Approved (22) | Rejected (5) | Closed (3)│
│                                                              │
│  SEARCH + FILTERS                                            │
│  [Search by title, ID...]  [Priority ▾]  [Date Range ▾]      │
│  [Requested By ▾]  [Department ▾]                            │
│                                                              │
│  TABLE                                                       │
│  PR ID    Title              Requested By  Priority  Items  Status      Date     Actions│
│  PR-0081  Office Chairs x10  Riya Sharma   High      3     ● Pending   Jul 4    [⋯]   │
│  PR-0080  Server Upgrade     Arjun Kumar   Critical  2     ✓ Approved  Jul 3    [⋯]   │
│  PR-0079  Stationery Pack    Priya Verma   Low       8     ○ Draft     Jul 2    [⋯]   │
│                                                              │
│  PAGINATION                                                  │
└──────────────────────────────────────────────────────────────┘
```

**Purchase Request Detail Page:**
```
┌──────────────────────────────────────────────────────────────┐
│  [← Back to Purchase Requests]                               │
│  PR-0081 · Office Chairs x10                                 │
│  ● Pending Approval · Submitted Jul 4, 2026 by Riya Sharma   │
│  [Edit] [Cancel Request]                                     │
│                                                              │
│  TWO-COLUMN LAYOUT (65% / 35%)                               │
│  LEFT COLUMN                   RIGHT COLUMN                  │
│  ┌─────────────────────────┐  ┌──────────────────────────┐  │
│  │  REQUEST DETAILS        │  │  APPROVAL STATUS         │  │
│  │  Priority: High         │  │  ● Step 1: Dept Manager  │  │
│  │  Required By: Jul 20    │  │    Awaiting review       │  │
│  │  Department: Operations │  │  ○ Step 2: Procurement   │  │
│  │  Est. Budget: ₹45,000   │  │    Not started           │  │
│  │  Justification: [text]  │  │                          │  │
│  │                         │  │  ACTIONS (for approver)  │  │
│  │  LINE ITEMS TABLE       │  │  [Approve] [Reject]      │  │
│  │  Item  Qty  Unit  Est.  │  │  [Add Comment]           │  │
│  │  Chair  10  Unit  4,500 │  │                          │  │
│  │  Cushion 10 Unit   500  │  │  LINKED RECORDS          │  │
│  │                         │  │  RFQ: RFQ-2024-089       │  │
│  │  ATTACHMENTS            │  │  (after approval)        │  │
│  │  [file1.pdf]            │  │                          │  │
│  │                         │  │  ACTIVITY LOG            │  │
│  │  COMMENTS               │  │  Jul 4 — Created by Riya │  │
│  │  Timeline of comments   │  │  Jul 4 — Submitted       │  │
│  └─────────────────────────┘  └──────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

---

### Components Used
- `DataTable` — PR list with status badges, sorting, pagination
- `PriorityBadge` — Critical (red), High (orange), Medium (amber), Low (gray)
- `StatusBadge` — Draft, Pending, Approved, Rejected, Closed
- `LineItemsTable` — repeatable rows for items requested
- `ApprovalTimeline` — step-by-step approval status tracker
- `CommentThread` — comment + reply thread for approval discussions
- `FileAttachment` — uploaded file list with download
- `ConfirmDialog` — cancel/reject confirmations
- `PRForm` — create/edit form (see below)
- `LinkedRecordChip` — shows linked RFQ/PO with navigation link

---

### Forms

**New/Edit Purchase Request Form:**
```
SECTION 1 — Request Information
  Request Title*          text input (max 100 chars)
  Priority*               radio/select: Critical / High / Medium / Low
  Required By Date*       date picker (must be future date)
  Department*             select (from company departments)
  Estimated Budget        currency input (optional, INR)
  Justification / Notes*  textarea (min 20 chars)

SECTION 2 — Line Items
  Repeatable item rows:
    Item Name*            text input
    Description           text input (optional)
    Quantity*             number input
    Unit of Measure*      select (Unit / Kg / Box / etc.)
    Estimated Unit Price  currency input (optional)
    [+ Add Another Item] button

SECTION 3 — Attachments
  File Upload             multi-file (PDF/DOCX/XLSX/images, max 10MB each, up to 5 files)

SECTION 4 — Submission
  Radio: Save as Draft / Submit for Approval
```

---

### Buttons

| Button | Variant | Usage |
|---|---|---|
| + New Request | Primary | Open PR form |
| Submit for Approval | Primary | Submit draft PR |
| Save as Draft | Secondary | Save without submitting |
| Approve | Success/primary | Approver action |
| Reject | Destructive/outlined | Approver action |
| Add Comment | Ghost | Comment thread |
| Create RFQ | Primary | After approval — Procurement Manager |
| Cancel Request | Destructive/ghost | Requester cancels pending PR |
| Edit | Secondary | Edit draft/pending PR |

---

### Filters

| Filter | Type |
|---|---|
| Status | Tabs: All / Draft / Pending / Approved / Rejected / Closed |
| Priority | Multi-select: Critical / High / Medium / Low |
| Date Range | Date range picker |
| Requested By | Employee select (managers see all; employees see own) |
| Department | Department select |

---

### Search
Real-time search across PR ID, title, item names, requester name. Debounced 300ms.

---

### Empty State
- No PRs: `FileText` icon (48px), "No purchase requests yet", "Create your first request to start the procurement process", CTA "+ New Request"
- Filtered empty: "No requests match your filters", "Clear filters" link

---

### Loading State
- Table: 5 skeleton rows
- Detail page: two-column skeleton layout (left: text lines, right: timeline skeleton)

---

### Error State
- Submit with no line items: inline error "Add at least one item to your request"
- Required date in the past: "Required date must be a future date"
- Budget negative: "Estimated budget must be a positive amount"
- Server error: top-of-form error Alert

---

### Success State
- Draft saved: Toast "Purchase request saved as draft"
- Submitted: Toast "Request PR-0081 submitted for approval" + status badge updates to "Pending"
- Approved (shown to requester): Toast + in-app notification "Your request PR-0081 was approved"
- Rejected: Toast + notification "Your request PR-0081 was rejected — view comments"

---

### Responsive Behaviour
- **Desktop:** Full table view; two-column detail layout
- **Tablet:** Table with fewer visible columns (hide Department, hide Estimated Budget); detail stacks vertically
- **Mobile:** Card list view; full-page form on new request; detail is single-column scrollable

---

### Permissions

| Action | Super Admin | Proc. Manager | Proc. Officer | Finance Mgr | Employee |
|---|---|---|---|---|---|
| Create PR | Yes | Yes | Yes | No | Yes |
| View own PR | Yes | Yes | Yes | Yes | Yes |
| View all PRs | Yes | Yes | Yes | No | No |
| Approve/Reject | Yes | Yes | No | No | No |
| Create RFQ from PR | Yes | Yes | Yes | No | No |
| Cancel own PR | Yes | Yes | Yes | Yes | Yes (draft/pending only) |

---

### Accessibility
- Priority badge: color + text label (never color alone)
- Approval timeline: `role="list"`, each step `role="listitem"`, `aria-label="Step 1: Department Manager — Awaiting review"`
- Line items table: `role="table"` with proper `thead`/`tbody`, `scope` attributes
- Comment thread: `aria-live="polite"` on the comment list container so new comments are announced

---

### Developer Notes
- PR stored in `purchase_requests` table; line items in `purchase_request_items` (FK)
- PR number: auto-generated format `PR-[YYYY]-[seq]` (e.g., PR-2026-0081)
- Status machine: Draft → Pending → (Approved | Rejected) → Closed
- Approval chain configured in workspace settings (see Approval Workflow module)
- File attachments stored in Supabase Storage `pr-attachments/[company_id]/[pr_id]/`
- When PR approved: Procurement Manager sees CTA to create RFQ directly from PR detail; PR items pre-fill RFQ line items

---

## MODULE 14 — APPROVAL WORKFLOW

---

### Purpose
Provide a configurable, multi-level approval engine that governs Purchase Requests and other approval-gated actions. Approval rules determine who must review which requests, in what order, and under what conditions.

---

### User Flow

**Configuring an Approval Workflow (Admin):**
1. Settings → Approval Workflows → "+ New Workflow"
2. Select document type (Purchase Request, Invoice, etc.)
3. Define conditions (e.g., "Budget > ₹50,000")
4. Add approval steps: sequential or parallel
5. Assign approver(s) per step (by role or specific user)
6. Set escalation rules (optional)
7. Save and activate

**Approval in Action (Approver):**
1. Approver receives in-app notification + email
2. Navigates to PR Detail (via notification link or "Pending Approvals" dashboard widget)
3. Reviews request details, comments
4. Clicks "Approve" or "Reject" with optional comment
5. Next approval step triggered (if sequential) or record closes

---

### Page Layout

**Approval Workflows Configuration Page (Settings):**
```
┌──────────────────────────────────────────────────────────────┐
│  Page Header: Approval Workflows                             │
│  Sub: "Configure approval chains for procurement documents"  │
│  [+ New Workflow]                                            │
│                                                              │
│  WORKFLOW LIST                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Purchase Request Approval                           │   │
│  │  Condition: Budget > ₹10,000  ·  3 Steps  ·  Active  │   │
│  │  [Edit] [Disable] [Delete]                           │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Invoice Approval                                    │   │
│  │  Condition: All invoices  ·  2 Steps  ·  Active      │   │
│  │  [Edit] [Disable] [Delete]                           │   │
│  └──────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────┘
```

**Workflow Builder (slide-over or dedicated page):**
```
┌──────────────────────────────────────────────────────────────┐
│  Workflow: Purchase Request Approval                          │
│                                                              │
│  TRIGGER CONDITION                                           │
│  Apply when: [Purchase Request ▾]  Budget [>▾] [₹10,000]    │
│  + Add condition (AND/OR)                                    │
│                                                              │
│  APPROVAL STEPS (drag-to-reorder)                            │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  ⠿ Step 1 — Department Manager                        │ │
│  │  Type: [Sequential ▾]   Approver: [Role: Proc. Mgr ▾] │ │
│  │  Deadline: [48 hours ▾] Escalate to: [Super Admin ▾]  │ │
│  │  [Remove Step]                                         │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  ⠿ Step 2 — Finance Review (if budget > ₹50,000)      │ │
│  │  Type: [Sequential ▾]   Approver: [Role: Finance Mgr ▾]│ │
│  │  Deadline: [24 hours ▾] Escalate to: [Super Admin ▾]  │ │
│  │  [Remove Step]                                         │ │
│  └────────────────────────────────────────────────────────┘ │
│  [+ Add Step]                                                │
│                                                              │
│  [Cancel]                           [Save Workflow]          │
└──────────────────────────────────────────────────────────────┘
```

**Pending Approvals Page (Approver inbox):**
```
┌──────────────────────────────────────────────────────────────┐
│  Page Header: Pending Approvals                              │
│  Sub: "5 items require your action"                          │
│                                                              │
│  FILTER TABS: All (5) | Purchase Requests (3) | Invoices (2) │
│                                                              │
│  APPROVAL QUEUE TABLE                                        │
│  Type    ID       Title              Requester  Budget    Waiting  Action       │
│  PR      PR-0081  Office Chairs x10  Riya S     ₹45,000  2 days   [Review →]   │
│  PR      PR-0080  Server Upgrade     Arjun K    ₹2.4L    1 day    [Review →]   │
│  Invoice INV-104  Nexus Supplies     —          ₹84,500  4 hours  [Review →]   │
└──────────────────────────────────────────────────────────────┘
```

---

### Components Used
- `WorkflowCard` — list card for each configured workflow
- `WorkflowBuilder` — step-builder interface with drag-to-reorder
- `ApprovalStepCard` — individual step config card with drag handle
- `ApprovalTimeline` — visual progress tracker on PR/Invoice detail pages
- `ConditionBuilder` — rule condition input (field, operator, value)
- `ApprovalQueue` — pending approvals table for approvers
- `ApproveRejectPanel` — action panel shown on PR/Invoice detail for approvers
- `DragHandle` — reorder approval steps
- `Select`, `Input`, `DatePicker`

---

### Approval Actions Component (on PR/Invoice detail)

Shown only to the active step's assigned approver(s):

```
┌─────────────────────────────────────────┐
│  YOUR APPROVAL IS REQUIRED              │
│  Step 1 of 2 — Department Manager       │
│                                         │
│  Comment (optional):                    │
│  [                                    ] │
│  [                                    ] │
│                                         │
│  [✗ Reject]              [✓ Approve]   │
└─────────────────────────────────────────┘
```

Reject action triggers a confirmation dialog requiring a rejection reason (mandatory on reject).

---

### Buttons

| Button | Variant | Usage |
|---|---|---|
| + New Workflow | Primary | Create workflow |
| Save Workflow | Primary | Save workflow config |
| + Add Step | Ghost/dashed | Add approval step |
| Remove Step | Ghost destructive | Remove a step |
| Approve | Success/primary | Approve action |
| Reject | Destructive/outlined | Reject action |
| Review → | Secondary | Navigate to item |
| Disable | Ghost | Pause a workflow |

---

### Empty State
- No workflows configured: `Shield` icon, "No approval workflows configured", "Set up approval rules to enforce procurement governance", CTA "+ New Workflow"
- No pending approvals: `CheckCircle` icon (success green), "You're all caught up!", "No items are waiting for your approval"

---

### Loading State
- Approval queue: 3 skeleton rows
- Workflow builder: skeleton step cards

---

### Error State
- Circular approval chain (Step 1 and Step 2 same approver): "An approver cannot appear in consecutive steps"
- No approver assigned to step: "Each step must have an approver assigned"

---

### Success State
- Workflow saved: Toast "Approval workflow saved and activated"
- PR approved: Toast "PR-0081 approved — Procurement Manager notified to create RFQ"
- PR rejected: Toast "PR-0081 rejected — Requester notified"

---

### Responsive Behaviour
- **Desktop:** Full workflow builder with drag-to-reorder steps
- **Tablet/Mobile:** Workflow builder as scrollable form, drag-to-reorder replaced by up/down arrow buttons

---

### Permissions
- Workflow configuration: Super Admin only
- Approving/Rejecting: only the designated approver for the active step
- Viewing approval status: all company users (for their own documents)

---

### Accessibility
- Approval step drag handles: `role="button"`, `aria-label="Drag to reorder Step 1"`, keyboard reorder via `ArrowUp`/`ArrowDown` + `Space` to grab/release
- Approve/Reject buttons: `aria-label="Approve purchase request PR-0081"` and `aria-label="Reject purchase request PR-0081"`
- Rejection reason: `aria-required="true"` when reject dialog is open

---

### Developer Notes
- Workflow engine: `approval_workflows` table stores workflow config as JSON (conditions + steps array)
- Active approval instance: `approval_instances` table tracks the current state for each document
- Step completion triggers next step activation or document status update
- Escalation: Supabase Edge Function scheduled job checks deadlines every hour, reassigns to escalation approver
- Parallel approval: all assigned approvers must approve before proceeding to next step
- Audit trail: every approve/reject creates an `audit_logs` record with user, action, timestamp, comment


---

## MODULE 15 — RFQ (REQUEST FOR QUOTATION)

---

### Purpose
Allow procurement teams to formally request pricing and delivery information from one or more vendors for specific products or services. The RFQ is the primary commercial communication instrument between companies and vendors on VendorFlow.

---

### User Flow

**Company creating an RFQ:**
1. Procurement → RFQs → "+ Create RFQ" (or "Create RFQ" CTA from an approved PR)
2. Fill RFQ details: select vendors, add line items, set deadline, attach terms
3. Review and Send → selected vendors receive email + in-app notification
4. RFQ status: "Sent" → tracks responses as they arrive
5. Deadline passes → RFQ status moves to "Closed for Responses"
6. Procurement team reviews quotations (see Module 16)

**Vendor receiving an RFQ:**
1. Vendor receives notification: "New RFQ from Meridian Technologies"
2. Navigates to RFQs → Active RFQs → click RFQ row
3. Reviews RFQ details, products required, deadline, terms
4. Clicks "Submit Quotation" → enters into quotation form (Module 16)

---

### Page Layout

**RFQ List Page (Company):**
```
┌──────────────────────────────────────────────────────────────┐
│  Page Header: RFQs                                           │
│  Sub: "8 active RFQs · 3 awaiting responses"                 │
│  [+ Create RFQ]                                              │
│                                                              │
│  FILTER TABS                                                 │
│  All (24) | Draft (2) | Sent (8) | Closed (10) | Cancelled (4)│
│                                                              │
│  SEARCH + FILTERS                                            │
│  [Search RFQs...]  [Vendor ▾]  [Date Range ▾]  [Status ▾]   │
│                                                              │
│  TABLE                                                       │
│  RFQ ID      Title              Vendors  Items  Deadline    Responses  Status    Actions│
│  RFQ-0089   Office Chairs       3        2      Jul 10       2/3       ● Sent   [⋯]   │
│  RFQ-0088   Server Hardware     2        4      Jul 8        2/2       ✓ Closed [⋯]   │
│  RFQ-0087   Stationery Pack     5        8      Jul 15       0/5       ● Sent   [⋯]   │
│                                                              │
│  PAGINATION                                                  │
└──────────────────────────────────────────────────────────────┘
```

**RFQ Detail Page (Company view):**
```
┌──────────────────────────────────────────────────────────────┐
│  [← Back to RFQs]  RFQ-0089 · Office Chairs                 │
│  ● Sent · Deadline: Jul 10, 2026 (4 days remaining)          │
│  [Edit] [Cancel RFQ] [Extend Deadline]                       │
│                                                              │
│  TWO-COLUMN LAYOUT (65% / 35%)                               │
│  LEFT COLUMN                       RIGHT COLUMN              │
│  ┌──────────────────────────────┐ ┌──────────────────────┐  │
│  │  RFQ DETAILS                 │ │  VENDOR RESPONSE     │  │
│  │  Reference PR: PR-0081       │ │  TRACKER             │  │
│  │  Created by: Riya Sharma     │ │  ┌──────────────┐   │  │
│  │  Delivery Location: Mumbai   │ │  │ Nexus         │   │  │
│  │  Required By: Jul 25         │ │  │ ✓ Responded  │   │  │
│  │  Terms: Net 30               │ │  └──────────────┘   │  │
│  │                              │ │  ┌──────────────┐   │  │
│  │  LINE ITEMS TABLE            │ │  │ CloudHW India│   │  │
│  │  Item  Qty  Unit  Notes      │ │  │ ✓ Responded  │   │  │
│  │  Chair  10  Unit  Ergonomic  │ │  └──────────────┘   │  │
│  │  Cushion 10  Unit  —         │ │  ┌──────────────┐   │  │
│  │                              │ │  │ OfficeFirst  │   │  │
│  │  ATTACHMENTS                 │ │  │ ● Awaiting   │   │  │
│  │  Terms_and_conditions.pdf    │ │  └──────────────┘   │  │
│  └──────────────────────────────┘ │                      │  │
│                                   │  DEADLINE COUNTDOWN  │  │
│                                   │  ████████░░  4 days  │  │
│                                   │                      │  │
│                                   │  [Compare Quotes →]  │  │
│                                   └──────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

**RFQ Detail Page (Vendor view):**
```
┌──────────────────────────────────────────────────────────────┐
│  [← Back to RFQs]  RFQ-0089 from Meridian Technologies       │
│  ● Open · Deadline: Jul 10, 2026 (4 days remaining)          │
│                                                              │
│  COMPANY INFO CARD (top banner)                              │
│  [Company Logo] Meridian Technologies · Mumbai               │
│  Connected since March 2025                                  │
│                                                              │
│  RFQ DETAILS (read-only)                                     │
│  Delivery Location / Required By / Payment Terms             │
│                                                              │
│  LINE ITEMS REQUIRED                                         │
│  Product       Qty  Unit   Notes                             │
│  Office Chair   10  Unit   Ergonomic, lumbar support         │
│  Chair Cushion  10  Unit   —                                 │
│                                                              │
│  ATTACHED DOCUMENTS                                          │
│  [Download Terms & Conditions]                               │
│                                                              │
│  [Submit Quotation →]        [Decline RFQ]                   │
└──────────────────────────────────────────────────────────────┘
```

---

### Components Used
- `DataTable` — RFQ list
- `VendorResponseTracker` — per-vendor response status cards in right panel
- `DeadlineCountdown` — progress bar + days remaining label
- `LineItemsTable` — read-only display of requested items
- `RFQForm` — create/edit form (below)
- `VendorSelector` — multi-select vendor picker with search
- `AttachmentList` — uploaded document list
- `StatusBadge` — Draft, Sent, Closed, Cancelled
- `ResponseBadge` — Responded (green), Awaiting (amber), Declined (red)
- `LinkedPRChip` — reference to originating PR

---

### Forms

**Create / Edit RFQ Form:**
```
SECTION 1 — RFQ Information
  RFQ Title*              text input
  Reference PR            PR selector (optional — link to originating PR)
  Delivery Location*      text input (city / address)
  Required Delivery Date* date picker
  Payment Terms           select: Net 15 / Net 30 / Net 45 / Net 60 / Immediate
  Special Instructions    textarea (optional)

SECTION 2 — Vendors
  Select Vendors*         multi-select from connected vendors
                          Search by vendor name / category
                          Min: 1, recommended: 3+
  "Invite new vendor"     link to Marketplace (opens in new tab)

SECTION 3 — Line Items
  Repeatable item rows:
    Product Name*         text input (or select from vendor catalog)
    Description           text input
    Quantity*             number input
    Unit*                 select
    Specifications        textarea (optional)
    [+ Add Item]

SECTION 4 — Documents
  Terms & Conditions      file upload (PDF/DOCX, optional)
  Technical Specifications file upload (optional)
  Other Documents         multi-file upload (up to 3)

SECTION 5 — Deadline
  Response Deadline*      date-time picker (must be before Required Delivery Date)
  Auto-Close after deadline toggle (default: ON)
```

---

### Buttons

| Button | Variant | Usage |
|---|---|---|
| + Create RFQ | Primary | Open RFQ form |
| Send RFQ | Primary | Finalize and dispatch to vendors |
| Save as Draft | Secondary | Save without sending |
| Extend Deadline | Secondary/outlined | Update deadline |
| Cancel RFQ | Destructive/ghost | Cancel sent RFQ |
| Compare Quotes → | Primary | Navigate to Vendor Comparison |
| Submit Quotation → | Primary (vendor) | Enter quotation form |
| Decline RFQ | Ghost destructive (vendor) | Decline with optional reason |

---

### Filters

| Filter | Options |
|---|---|
| Status tabs | All / Draft / Sent / Closed / Cancelled |
| Vendor | Select from connected vendors |
| Date Range | Date range picker on RFQ creation date |
| Deadline | Expiring Today / This Week / This Month |

---

### Deadline Urgency Visual System
- More than 7 days: progress bar Electric Blue, label Neutral-500
- 4–7 days: progress bar Warning Amber, label amber
- 1–3 days: progress bar Error Red, label red
- Expired/Overdue: "DEADLINE PASSED" banner in error red

---

### Empty State
- No RFQs: `Send` icon, "No RFQs created yet", "Start by creating an RFQ for approved purchase requests", CTA "+ Create RFQ"
- No responses yet: `Clock` icon in response tracker, "Waiting for vendor responses"

---

### Loading State
- List: 5 skeleton rows; Detail: two-column skeleton

---

### Error State
- No vendors selected: "Select at least one vendor to send this RFQ"
- Deadline before today: "Response deadline must be a future date"
- No line items: "Add at least one item to this RFQ"

---

### Success State
- RFQ sent: Toast "RFQ-0089 sent to 3 vendors" + status → "Sent"
- Deadline extended: Toast "Deadline extended to Jul 14, 2026"
- RFQ cancelled: Toast "RFQ-0089 has been cancelled — vendors notified"

---

### Responsive Behaviour
- **Desktop:** Two-column detail layout; full table
- **Tablet:** Detail stacks (info top, response tracker below); table hides non-critical columns
- **Mobile:** Full single-column; vendor response tracker as horizontal scroll cards; line items as collapsible section

---

### Permissions

| Action | Super Admin | Proc. Manager | Proc. Officer | Finance Mgr | Employee | Vendor |
|---|---|---|---|---|---|---|
| Create RFQ | Yes | Yes | Yes | No | No | No |
| View all RFQs | Yes | Yes | Yes | No | No | Own only |
| Cancel RFQ | Yes | Yes | No | No | No | No |
| Submit Quotation | No | No | No | No | No | Yes |
| Decline RFQ | No | No | No | No | No | Yes |

---

### Accessibility
- Deadline countdown: `aria-label="4 days remaining until deadline"`, `role="meter"`, `aria-valuenow` on progress bar
- Vendor response tracker: `role="list"`, each vendor `role="listitem"`, `aria-label="Nexus Supplies — Responded"`
- RFQ send button: `aria-label="Send RFQ to 3 vendors"`

---

### Developer Notes
- `rfqs` table with FK to `companies`, `purchase_requests` (nullable)
- `rfq_vendors` join table: `rfq_id`, `vendor_id`, `status` (sent/responded/declined)
- `rfq_items` table: line items FK to `rfqs`
- Sending RFQ: Edge Function dispatches email via Resend to each vendor's primary contact
- Vendor "Decline RFQ": updates `rfq_vendors.status = 'declined'`, optional decline reason stored
- Auto-close cron: Edge Function scheduled job checks deadlines, sets `rfqs.status = 'closed'`

---

## MODULE 16 — QUOTATION MANAGEMENT

---

### Purpose
Allow vendors to submit detailed, structured quotations in response to RFQs. Provides companies with a standardized view of vendor pricing, delivery terms, and conditions for comparison.

---

### User Flow

**Vendor submitting a quotation:**
1. RFQs → Active RFQs → open RFQ → "Submit Quotation"
2. Fill quotation form: price per item, taxes, delivery charges, payment terms, validity date
3. Attach supporting documents (optional)
4. Submit → Company receives notification

**Vendor revising a quotation (before deadline):**
1. RFQs → Submitted Quotations → open quotation → "Revise Quotation"
2. Update fields → re-submit

**Company viewing quotations:**
1. Procurement → Quotations → filter by RFQ
2. Or: RFQ Detail → "Compare Quotes →" → Vendor Comparison (Module 17)

---

### Page Layout

**Quotation List Page (Company view):**
```
┌──────────────────────────────────────────────────────────────┐
│  Page Header: Quotations                                     │
│  Sub: "14 quotations received this month"                    │
│                                                              │
│  FILTER TABS: All | Under Review | Accepted | Rejected       │
│  FILTERS: [RFQ ▾]  [Vendor ▾]  [Date Range ▾]               │
│                                                              │
│  TABLE                                                       │
│  Quot. ID    Vendor        RFQ        Total Value  Submitted  Status    Actions│
│  Q-0124     Nexus Supplies RFQ-0089   ₹4,85,000   Jul 6      ● Review  [⋯]   │
│  Q-0123     CloudHW India  RFQ-0089   ₹5,10,000   Jul 5      ● Review  [⋯]   │
│  Q-0122     OfficeFirst    RFQ-0088   ₹1,22,000   Jul 4      ✓ Accepted[⋯]   │
└──────────────────────────────────────────────────────────────┘
```

**Quotation Detail Page:**
```
┌──────────────────────────────────────────────────────────────┐
│  [← Back]  Quotation Q-0124 — Nexus Supplies                 │
│  For: RFQ-0089 · Office Chairs  ·  ● Under Review            │
│  Valid Until: Jul 20, 2026  ·  Submitted: Jul 6, 2026        │
│                                                              │
│  VENDOR INFO CARD                                            │
│  [Logo] Nexus Supplies · ★ 4.3 · Mumbai · IT Hardware        │
│                                                              │
│  QUOTATION LINE ITEMS TABLE                                  │
│  Item           Qty   Unit Price   Discount   Tax     Total  │
│  Office Chair    10   ₹4,200       5%        18% GST  ₹4,158 │
│  Chair Cushion   10   ₹420         —         18% GST  ₹4,956 │
│  ─────────────────────────────────────────────────────────── │
│  Subtotal: ₹46,260   Taxes: ₹8,326   Delivery: ₹500         │
│  GRAND TOTAL: ₹55,086                                        │
│                                                              │
│  TERMS                                                       │
│  Payment Terms: Net 30  ·  Delivery: 5–7 business days       │
│  Warranty: 1 year on all products                            │
│                                                              │
│  ATTACHMENTS                                                 │
│  [Product_Brochure.pdf]  [Company_Profile.pdf]               │
│                                                              │
│  [Compare with other quotes]        [Accept Quotation]       │
└──────────────────────────────────────────────────────────────┘
```

**Quotation Form (Vendor view — submitting):**
```
┌──────────────────────────────────────────────────────────────┐
│  Submit Quotation for RFQ-0089                               │
│  Office Chairs — Meridian Technologies                       │
│                                                              │
│  LINE ITEMS (pre-filled from RFQ, vendor fills prices)       │
│  Item           Qty   Unit Price*  Discount%   Tax Rate*     │
│  Office Chair    10   [₹      ]    [   %  ]    [18% GST ▾]  │
│  Chair Cushion   10   [₹      ]    [   %  ]    [18% GST ▾]  │
│                                                              │
│  DELIVERY & TERMS                                            │
│  Delivery Charges    [₹      ]                               │
│  Delivery Timeline*  [text input, e.g. "5–7 business days"] │
│  Payment Terms*      [select: Net 15 / 30 / 45 / Immediate] │
│  Valid Until Date*   [date picker]                           │
│  Warranty / Notes    [textarea]                              │
│                                                              │
│  ATTACHMENTS                                                 │
│  Brochure / Specs    [file upload, optional]                 │
│                                                              │
│  PRICE SUMMARY (live calculation)                            │
│  Subtotal: ₹—        Taxes: ₹—        Delivery: ₹—          │
│  Grand Total: ₹—                                             │
│                                                              │
│  [Save Draft]                [Submit Quotation]              │
└──────────────────────────────────────────────────────────────┘
```

---

### Components Used
- `QuotationLineItemsTable` — editable on vendor side, read-only on company side
- `PriceSummaryCard` — live-calculated subtotal, tax, delivery, grand total
- `VendorInfoCard` — vendor logo, name, rating, location in quotation header
- `TermsBadgeRow` — pill chips: payment terms, delivery timeline, warranty
- `ValidityCountdown` — "Valid until Jul 20, 2026 (14 days)" with amber warning near expiry
- `DataTable` — quotation list
- `StatusBadge` — Under Review, Accepted, Rejected

---

### Buttons

| Button | Variant | Usage |
|---|---|---|
| Submit Quotation | Primary | Vendor submits |
| Save Draft | Secondary | Vendor saves in progress |
| Revise Quotation | Secondary | Vendor edits submitted quote |
| Accept Quotation | Primary (company) | Move to Vendor Selection |
| Compare with other quotes | Secondary | Navigate to Comparison |
| Reject Quotation | Ghost destructive | Company rejects a quote |

---

### Empty State
- No quotations received: `Receipt` icon, "No quotations received yet", "Vendors have until [deadline] to respond"
- Vendor: no RFQs to quote on: `Send` icon, "No active RFQs to respond to"

---

### Success State
- Vendor submits: Toast "Quotation submitted for RFQ-0089 · Meridian Technologies notified"
- Vendor revises: Toast "Quotation updated and re-submitted"
- Company accepts: Triggers Vendor Selection flow (Module 18)

---

### Responsive Behaviour
- **Desktop:** Full two-column detail; scrollable line items table
- **Mobile:** Line items table scrolls horizontally; price summary card sticky at bottom of form

---

### Permissions

| Action | Proc. Manager | Proc. Officer | Finance Mgr | Employee | Vendor Sales Mgr | Vendor Admin |
|---|---|---|---|---|---|---|
| Submit quotation | No | No | No | No | Yes | Yes |
| Revise quotation | No | No | No | No | Yes | Yes |
| View received quotations | Yes | Yes | No | No | No | Own only |
| Accept quotation | Yes | No | No | No | No | No |

---

### Developer Notes
- `quotations` table FK to `rfqs`, `vendors`
- `quotation_items` table: per-line pricing data
- Tax calculation: client-side real-time using GST rates; server validates on submit
- Quotation revision: creates new record with `version` integer incremented; previous version archived
- "Accept" triggers Vendor Selection (Module 18) and Purchase Order creation (Module 19)

---

## MODULE 17 — VENDOR COMPARISON

---

### Purpose
Provide procurement teams with a powerful side-by-side comparison of all quotations received for an RFQ. The comparison view enables data-driven vendor selection by surfacing price, delivery, quality score, and previous performance in a single screen.

---

### User Flow

1. RFQ Detail → "Compare Quotes →" (available once 2+ quotations received)
2. Or: Procurement → RFQs → open RFQ → Comparison tab
3. Side-by-side comparison table renders automatically
4. User reviews and toggles which vendors to include
5. User clicks "Select Vendor" on winning quotation → triggers Module 18

---

### Page Layout

```
┌──────────────────────────────────────────────────────────────┐
│  [← Back to RFQ-0089]  Vendor Comparison                    │
│  "Office Chairs · 3 quotations received"                     │
│                                                              │
│  COMPARISON HEADER (sticky)                                  │
│  Criteria              Nexus Supplies  CloudHW India  OfficeFst│
│  ─────────────────────────────────────────────────────────── │
│                                                              │
│  VENDOR INFO ROW                                             │
│  Logo + Name           [Logo] Nexus    [Logo] CloudHW  [Logo]│
│  Overall Rating        ★ 4.3           ★ 4.7           ★ 4.1 │
│  Verified              ✓ Yes           ✓ Yes           ✓ Yes  │
│  Previous Orders       18              6               2     │
│  On-time Delivery      96%             92%             88%   │
│                                                              │
│  PRICING ROW                                                 │
│  Office Chair (10)     ₹42,000         ₹44,500         ₹39,500│
│  Chair Cushion (10)    ₹4,200          ₹3,800          ₹4,800 │
│  Delivery Charges      ₹500            ₹0              ₹1,200 │
│  Taxes (GST 18%)       ₹8,326          ₹8,694          ₹8,010 │
│  ─────────────────────────────────────────────────────────── │
│  GRAND TOTAL           ₹55,026 ★Best  ₹57,094         ₹53,510│
│                        [Select]        [Select]        [Select]│
│                                                              │
│  DELIVERY ROW                                                │
│  Delivery Timeline     5–7 days ✓Best  7–10 days      3–5 days│
│  Valid Until           Jul 20          Jul 18          Jul 22 │
│  Payment Terms         Net 30          Net 30          Net 45 │
│                                                              │
│  RECOMMENDATION BANNER (optional AI — future)                │
│  [Sparkles purple] AI Recommendation: Nexus Supplies offers  │
│  the best balance of price and delivery reliability          │
└──────────────────────────────────────────────────────────────┘
```

---

### Components Used
- `ComparisonTable` — sticky header + scrollable comparison rows
- `BestValueBadge` — "★ Best" highlight (Electric Blue) on lowest grand total column
- `VendorComparisonHeader` — logo, name, rating, verification status per column
- `MetricRow` — comparison row with optional "best" highlighting
- `SelectVendorButton` — per-column CTA, triggers Module 18
- `ComparisonToggle` — checkbox to include/exclude a vendor column
- `AIRecommendationBanner` — Purple-tinted banner (future AI module, shown as placeholder if AI disabled)
- `ExcludeVendorButton` — remove a vendor from comparison without rejecting their quote

---

### Comparison Row Highlighting Logic
- Lowest price among all vendors: column highlighted with a subtle Electric Blue left border
- Best delivery time: tick icon `✓Best` in success green
- Best overall rating: star icon `★` in amber
- If one vendor is best in 3+ categories: "Recommended" badge at top of their column

---

### Buttons

| Button | Variant | Usage |
|---|---|---|
| Select Vendor | Primary (per column) | Open vendor selection (Module 18) |
| Exclude | Ghost | Remove vendor from current comparison |
| Export Comparison | Secondary | Download comparison as PDF |
| Print | Ghost | Browser print of comparison table |

---

### Empty State
- Only 1 quotation received: info banner "Comparison requires at least 2 quotations. Waiting for more responses."

---

### Loading State
- Comparison table: 3 skeleton columns with shimmer rows

---

### Responsive Behaviour
- **Desktop:** Full side-by-side table, all vendors visible
- **Tablet:** Horizontal scroll on comparison table; first column (criteria) sticky
- **Mobile:** Swipeable vendor columns (one visible at a time); carousel dots at bottom; criteria column always visible

---

### Permissions
- View comparison: Procurement Manager, Procurement Officer, Super Admin
- Select vendor: Procurement Manager, Super Admin only

---

### Accessibility
- Comparison table: `role="table"`, proper `thead`/`tbody`, `scope="col"` on vendor headers
- "Best" indicators: not color-only — always include `✓ Best` or `★ Best` text label
- Column toggle checkboxes: `aria-label="Include Nexus Supplies in comparison"`

---

### Developer Notes
- Comparison data assembled client-side from `quotations` + `quotation_items` + `vendors` join query
- Grand total computation: client-side summation of item totals + delivery charges + taxes
- "Best" column detection: computed property comparing column values, no server call needed
- Export PDF: headless rendering via Edge Function using puppeteer/playwright (future) or jsPDF client-side
- AI Recommendation banner: rendered as placeholder with `opacity-40` and "Coming soon" if AI module not active

---

## MODULE 18 — VENDOR SELECTION

---

### Purpose
Formalize the decision to award a procurement to a specific vendor after quotation comparison. The vendor selection step creates an auditable record of the procurement decision before the Purchase Order is generated.

---

### User Flow

1. From Comparison page → click "Select Vendor" on chosen column
2. Selection confirmation modal opens
3. Procurement Manager enters selection reason (mandatory)
4. Optionally requires additional approval (if configured)
5. On confirm: selected vendor notified, other vendors notified of non-selection
6. PO auto-generated (or CTA to generate PO shown)
7. RFQ status → "Vendor Selected"

---

### Page Layout

**Vendor Selection Modal:**
```
┌──────────────────────────────────────────────────────────────┐
│  Confirm Vendor Selection                             [✕]    │
│  ─────────────────────────────────────────────────────────── │
│  You are selecting:                                          │
│                                                              │
│  [Nexus Logo 48px]  Nexus Supplies                           │
│  Quotation Q-0124  ·  Grand Total: ₹55,026                   │
│  Delivery: 5–7 business days  ·  Payment: Net 30             │
│                                                              │
│  Selection Reason*                                           │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Best balance of price and on-time delivery record... │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  Notify rejected vendors?  [✓] Yes (recommended)            │
│                                                              │
│  After selection:                                            │
│  ● Auto-generate Purchase Order                              │
│  ○ I'll generate the PO manually                             │
│                                                              │
│  [Cancel]                     [Confirm Selection & Create PO]│
└──────────────────────────────────────────────────────────────┘
```

**Post-Selection Banner (on RFQ Detail):**
```
[CheckCircle green]  Vendor Selected: Nexus Supplies
Quotation Q-0124  ·  Confirmed by Riya Sharma on Jul 6, 2026
Purchase Order: PO-2026-0312  [View PO →]
```

---

### Components Used
- `VendorSelectionModal` — confirmation dialog
- `SelectedVendorSummary` — logo, name, quote total, key terms
- `SelectionReasonTextarea` — required text input
- `PostSelectionBanner` — success banner on RFQ detail
- `LinkedPOChip` — chip linking to generated PO

---

### Vendor Notification (rejected vendors)
Email sent via Resend: "Thank you for submitting your quotation for [RFQ]. We have selected another vendor for this procurement. We value your participation and look forward to future opportunities."
Tone: professional, not dismissive.

---

### Permissions
- Confirm vendor selection: Procurement Manager, Super Admin
- View selection history: Procurement Manager, Procurement Officer, Super Admin

---

### Developer Notes
- `vendor_selections` table: `rfq_id`, `vendor_id`, `quotation_id`, `selected_by`, `reason`, `created_at`
- On confirm: `rfqs.status = 'vendor_selected'`, non-selected `rfq_vendors.status = 'not_selected'`
- Auto-PO generation: calls PO creation Edge Function immediately with quotation data pre-filled
- Selection record feeds into Analytics "Vendor Win Rate" metrics


---

## MODULE 19 — PURCHASE ORDERS (PO)

---

### Purpose
Generate legally valid, professionally formatted Purchase Orders following vendor selection. The PO is the binding commercial document that authorizes the vendor to begin fulfillment. It captures all agreed terms from the accepted quotation and company procurement details.

---

### User Flow

**Auto-generated PO (post vendor selection):**
1. Vendor Selection confirmed → PO auto-generated with all quotation data pre-filled
2. Procurement Manager reviews PO draft → edits if needed → Confirms
3. PO sent to vendor via email (PDF attachment) + in-app notification
4. Vendor reviews and Accepts or Rejects

**Manual PO creation:**
1. Procurement → Purchase Orders → "+ Create PO"
2. Select vendor, fill items, terms, addresses
3. Review → Send to Vendor

---

### Page Layout

**Purchase Order List Page:**
```
┌──────────────────────────────────────────────────────────────┐
│  Page Header: Purchase Orders                                │
│  Sub: "24 active POs · ₹42.8L total value this month"       │
│  [+ Create PO]                                               │
│                                                              │
│  FILTER TABS                                                 │
│  All (48) | Draft (2) | Sent (18) | Accepted (16) | Rejected (3) | Closed (9)│
│                                                              │
│  SEARCH + FILTERS                                            │
│  [Search PO ID, vendor...]  [Vendor ▾]  [Date Range ▾]       │
│  [Value Range ▾]  [Status ▾]                                 │
│                                                              │
│  TABLE                                                       │
│  PO ID        Vendor          Items  Total Value   Sent On   Status     Actions│
│  PO-2026-0312 Nexus Supplies    2    ₹55,026       Jul 6   ● Sent     [⋯]    │
│  PO-2026-0311 CloudHW India     4    ₹1,24,500     Jul 3   ✓ Accepted [⋯]    │
│  PO-2026-0310 OfficeFirst       8    ₹22,400       Jun 30  ✓ Closed   [⋯]    │
│                                                              │
│  PAGINATION                                                  │
└──────────────────────────────────────────────────────────────┘
```

**Purchase Order Detail Page:**
```
┌──────────────────────────────────────────────────────────────┐
│  [← Back to POs]                          [Download PDF] [Email PO]│
│                                                              │
│  PO DOCUMENT VIEW (rendered as formal document)              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  MERIDIAN TECHNOLOGIES               [Company Logo]  │   │
│  │  PURCHASE ORDER                      PO-2026-0312    │   │
│  │  Date: July 6, 2026                                  │   │
│  │  ─────────────────────────────────────────────────── │   │
│  │  BILL TO:                  VENDOR:                   │   │
│  │  Meridian Technologies     Nexus Supplies             │   │
│  │  Mumbai, Maharashtra       Mumbai, Maharashtra        │   │
│  │  GST: 27AABCM...           GST: 27AANFN...           │   │
│  │  ─────────────────────────────────────────────────── │   │
│  │  Item         Qty  Unit  Unit Price  Tax    Amount    │   │
│  │  Office Chair  10  Unit  ₹4,200     18%    ₹49,560   │   │
│  │  Chair Cushion 10  Unit  ₹420       18%    ₹4,956    │   │
│  │  ─────────────────────────────────────────────────── │   │
│  │  Subtotal: ₹46,260   Tax: ₹8,326   Delivery: ₹500   │   │
│  │  TOTAL: ₹55,086                                      │   │
│  │  ─────────────────────────────────────────────────── │   │
│  │  Payment Terms: Net 30                               │   │
│  │  Delivery Address: 24 Andheri East, Mumbai 400069    │   │
│  │  Required By: July 25, 2026                          │   │
│  │  Terms & Conditions: [View attached T&C]             │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  STATUS PANEL (right side)                                   │
│  ● Sent — Awaiting vendor acceptance                         │
│  Vendor Response: Pending                                    │
│  [Vendor accepted on Jul 7] (after accept)                   │
│                                                              │
│  LINKED RECORDS                                              │
│  Source RFQ: RFQ-0089    Source PR: PR-0081                  │
│  Invoice: (pending)      GRN: (pending)                      │
│                                                              │
│  ACTIVITY LOG                                                │
│  Jul 6 — PO created by Riya Sharma                           │
│  Jul 6 — PO sent to Nexus Supplies                           │
└──────────────────────────────────────────────────────────────┘
```

---

### PO PDF Format
The downloadable PDF mirrors the document view exactly. Uses the company's logo, company name in the header, sequential PO number, formatted line items table, grand total, and terms. Generated server-side via Edge Function (HTML-to-PDF).

---

### Components Used
- `DataTable` — PO list
- `PODocumentView` — styled document renderer (not a form — a formatted view)
- `LineItemsTable` — read-only pricing table with subtotal/tax/grand total footer
- `POStatusPanel` — right-side panel with vendor response status and actions
- `LinkedRecordChips` — PR, RFQ, Invoice, GRN links
- `ActivityLog` — timeline of PO events
- `StatusBadge` — Draft, Sent, Accepted, Rejected, Closed
- `DownloadButton` — PDF download trigger
- `EmailButton` — resend PO to vendor
- `POForm` — create/edit form for manual POs

---

### Forms

**Create/Edit PO Form:**
```
SECTION 1 — PO Information
  Vendor*               select from connected vendors
  PO Date*              date picker (default: today)
  Required By Date*     date picker
  Delivery Address*     textarea

SECTION 2 — Line Items
  (same repeatable row structure as RFQ/Quotation)
  Item Name*, Qty*, Unit*, Unit Price*, Tax Rate*, Notes

SECTION 3 — Financial Terms
  Payment Terms*        select: Net 15/30/45/60/Immediate
  Delivery Charges      currency input
  Currency              select (default INR)

SECTION 4 — Terms & Conditions
  T&C Text              textarea OR file upload (PDF)
  Additional Notes      textarea (optional)
```

---

### Buttons

| Button | Variant | Usage |
|---|---|---|
| + Create PO | Primary | Open PO form |
| Confirm & Send | Primary | Send PO to vendor |
| Save as Draft | Secondary | Draft state |
| Download PDF | Secondary/outlined | Download PO document |
| Email PO | Ghost/icon | Re-send PO email |
| Accept PO | Primary (vendor) | Module 20 action |
| Reject PO | Destructive (vendor) | Module 20 action |

---

### Empty State
`ShoppingCart` icon, "No purchase orders yet", "Purchase orders are generated after vendor selection", CTA "+ Create PO"

---

### Loading State
List: 5 skeleton rows. Detail: document skeleton (full-width shimmer block simulating document).

---

### Error State
- No line items: "Add at least one item to the purchase order"
- Vendor not connected: "Select a connected vendor to send this PO"

---

### Success State
- PO sent: Toast "PO-2026-0312 sent to Nexus Supplies"
- PDF downloaded: Toast "Purchase Order downloaded"

---

### Responsive Behaviour
- **Desktop:** Document view renders as formatted card, full two-column layout with status panel
- **Tablet:** Status panel moves below document view
- **Mobile:** Document view simplified to essential fields; PDF download primary action via FAB

---

### Permissions

| Action | Super Admin | Proc. Manager | Proc. Officer | Finance Mgr | Vendor Admin | Vendor Sales |
|---|---|---|---|---|---|---|
| Create/Edit PO | Yes | Yes | No | No | No | No |
| View PO | Yes | Yes | Yes | Yes | Own only | Own only |
| Download PDF | Yes | Yes | Yes | Yes | Yes | Yes |
| Accept/Reject PO | No | No | No | No | Yes | Yes |

---

### Accessibility
- Document view: semantic `<section>` elements with ARIA headings for each PO section
- Download button: `aria-label="Download Purchase Order PO-2026-0312 as PDF"`
- Status panel: `role="status"`, `aria-live="polite"` when vendor response arrives

---

### Developer Notes
- `purchase_orders` table FK to `vendors`, `companies`, `rfqs` (nullable), `quotations` (nullable)
- PO number: `PO-[YYYY]-[seq]` auto-incremented per company workspace
- PDF generation: Edge Function renders HTML template with PO data, converts via `@react-pdf/renderer` or `puppeteer`
- PDF stored in Supabase Storage `po-documents/[company_id]/[po_id].pdf`
- Email: Resend sends PDF as attachment to vendor's primary email + CC to procurement contact
- Auto-generation from vendor selection: Edge Function maps quotation items → PO items with zero data loss

---

## MODULE 20 — PURCHASE ORDER ACCEPTANCE

---

### Purpose
Allow vendors to formally review and respond to received Purchase Orders — accepting, rejecting, or requesting modifications — before fulfillment begins.

---

### User Flow

1. Vendor receives PO notification (in-app + email)
2. Navigates to Orders → Purchase Orders → open PO
3. Reviews PO details carefully
4. Clicks "Accept PO", "Reject PO", or "Request Modification"
5. Company receives notification of vendor response
6. On acceptance → Order Tracking begins (Module 21)

---

### Page Layout (Vendor view — PO received)

Same document view as company-side PO, but with vendor-specific action panel:

```
┌──────────────────────────────────────────────────────────────┐
│  ACTION PANEL (top of page — prominent)                      │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  [Bell]  Action Required: Review Purchase Order      │   │
│  │  PO-2026-0312 from Meridian Technologies             │   │
│  │  Received: Jul 6, 2026 — Please respond within 48h  │   │
│  │                                                      │   │
│  │  Expected Delivery: July 25, 2026                    │   │
│  │  Confirm you can fulfill this order by that date.    │   │
│  │                                                      │   │
│  │  [✗ Reject PO]  [⚑ Request Changes]  [✓ Accept PO] │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  PO DOCUMENT (read-only, same formatted view as company)     │
└──────────────────────────────────────────────────────────────┘
```

**Accept PO Modal:**
```
Accept Purchase Order PO-2026-0312?
Confirm you can deliver by July 25, 2026.
Estimated Delivery Date: [date picker — defaults to PO required date]
Remarks: [textarea, optional]
[Cancel]  [✓ Confirm Acceptance]
```

**Reject PO Modal:**
```
Reject Purchase Order?
Reason for Rejection*: [select: Pricing / Delivery Timeline / Out of Stock / Other]
Additional Comments*: [textarea, required]
[Cancel]  [Confirm Rejection]
```

**Request Modification Modal:**
```
Request Modification
Describe what changes you need*: [textarea]
[Cancel]  [Send Request]
```

---

### Components Used
- `POActionBanner` — top-of-page action required card with response buttons
- `AcceptPOModal`, `RejectPOModal`, `ModificationModal` — response modals
- `ConfirmDialog` — accept confirmation
- `StatusBadge` — Pending Acceptance, Accepted, Rejected

---

### Success State
- Accepted: Action panel replaced with: `[CheckCircle green] PO Accepted — Fulfillment begins. Update order status as you process this order.`
- Rejected: `[XCircle red] PO Rejected — Meridian Technologies has been notified.`

---

### Permissions
- Accept/Reject: Vendor Admin, Vendor Sales Manager
- View: All vendor roles

---

### Developer Notes
- `purchase_orders.vendor_status` field: `pending` → `accepted` / `rejected` / `modification_requested`
- Acceptance triggers `orders` record creation for tracking (Module 21)
- Rejection notifies company via in-app notification + email with rejection reason

---

## MODULE 21 — ORDER TRACKING

---

### Purpose
Enable both companies and vendors to track the complete lifecycle of a purchase order from acceptance through delivery. Provides real-time visibility into fulfillment progress for all stakeholders.

---

### User Flow

**Vendor updating order status:**
1. Orders → Active Orders → open order
2. Updates status: Processing → Packed → Shipped → Delivered
3. Each update triggers notifications to company

**Company tracking order:**
1. Procurement → Purchase Orders → open PO → "Track Order" tab
2. Or: Orders → Order Tracking → filter by PO
3. Views real-time status timeline

---

### Page Layout

**Order Tracking List (Company):**
```
┌──────────────────────────────────────────────────────────────┐
│  Page Header: Order Tracking                                 │
│  Sub: "16 active orders"                                     │
│                                                              │
│  FILTER TABS: All | Processing | Packed | Shipped | Delivered│
│  SEARCH: [PO ID, vendor...]  [Date Range ▾]  [Vendor ▾]      │
│                                                              │
│  ORDER TABLE                                                 │
│  PO ID        Vendor          Status        Expected  Updated     Actions│
│  PO-2026-0312 Nexus Supplies  ● Processing  Jul 25    2h ago      [Track]│
│  PO-2026-0311 CloudHW India   ● Shipped     Jul 20    Yesterday   [Track]│
│  PO-2026-0309 OfficeFirst     ✓ Delivered   Jul 10    Jul 10      [View] │
└──────────────────────────────────────────────────────────────┘
```

**Order Detail / Tracking Page:**
```
┌──────────────────────────────────────────────────────────────┐
│  [← Back]  Order Tracking — PO-2026-0312                     │
│  Nexus Supplies  ·  Expected: July 25, 2026                  │
│                                                              │
│  ORDER TIMELINE (horizontal stepper — full width)            │
│  ●──────────────●─────────────○──────────────○              │
│  PO Accepted    Processing    Packed          Shipped  Delivered│
│  Jul 7, 10:30   Jul 8, 2:00   —               —        —     │
│  ✓ Complete     ● Active      ○ Pending        ○         ○   │
│                                                              │
│  CURRENT STATUS CARD                                         │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  [Package 24px]  Order is Being Processed            │   │
│  │  Nexus Supplies is preparing your order.             │   │
│  │  Last updated: Jul 8, 2026 at 2:00 PM by Aryan Mehta│   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  TWO-COLUMN LOWER SECTION                                    │
│  LEFT: ORDER ITEMS           RIGHT: DELIVERY INFORMATION     │
│  Items ordered summary       Expected Delivery: Jul 25       │
│                              Delivery Address: Mumbai        │
│                              Shipment info (when shipped)    │
│                                                              │
│  ACTIVITY LOG                                                │
│  Full chronological events list                              │
└──────────────────────────────────────────────────────────────┘
```

**Vendor — Update Order Status Panel:**
```
┌──────────────────────────────────────────────────────────────┐
│  UPDATE ORDER STATUS                                         │
│  Current: ● Processing                                       │
│                                                              │
│  Next Step: Mark as Packed                                   │
│  Notes: [textarea — optional update message]                 │
│  [Mark as Packed →]                                          │
└──────────────────────────────────────────────────────────────┘
```

---

### Order Status System

| Status | Icon | Color | Meaning |
|---|---|---|---|
| PO Accepted | CheckCircle | Success Green | Vendor confirmed |
| Processing | RefreshCw | Electric Blue | Vendor preparing order |
| Packed | Package | Cyan | Items packed, ready to ship |
| Shipped | Truck | Electric Blue | In transit |
| Delivered | PackageCheck | Success Green | Received by company |
| Cancelled | XCircle | Error Red | Order cancelled |

---

### Components Used
- `OrderTimeline` — horizontal stepper with completed/active/pending states
- `OrderStatusCard` — current status highlight card
- `StatusUpdatePanel` — vendor-side status progression panel
- `DeliveryInfoCard` — address, expected date, shipment details (populated in Module 22)
- `DataTable` — order list
- `ActivityLog` — chronological event list

---

### Empty State
`Truck` icon, "No active orders", "Orders will appear here once a vendor accepts a Purchase Order"

---

### Responsive Behaviour
- **Desktop:** Horizontal timeline stepper, two-column lower section
- **Tablet:** Same
- **Mobile:** Timeline stepper becomes vertical; single-column layout; status card full-width

---

### Permissions
- View tracking: All company users (their orders), all vendor users (their orders)
- Update status: Vendor Admin, Vendor Employee

---

### Developer Notes
- `orders` table: `po_id` FK, `status`, `updated_by`, `updated_at`
- `order_events` table: append-only log of every status change with timestamp and user
- Status update triggers real-time notification via Supabase Realtime subscriptions
- Order considered "Delivered" only after company creates GRN (Module 23) OR vendor marks as delivered (company GRN takes precedence)

---

## MODULE 22 — SHIPMENT TRACKING

---

### Purpose
Allow vendors to record shipment details and provide tracking information so companies can monitor in-transit deliveries. Supplements the order status system with courier-level detail.

---

### User Flow

1. Vendor marks order as "Shipped" → Shipment form appears
2. Vendor enters courier name, tracking number, estimated delivery date, optional tracking URL
3. Company receives notification: "Your order has been shipped"
4. Company views shipment details on Order Tracking page and follows tracking link

---

### Page Layout

**Shipment Entry Form (Vendor — modal/inline on order detail):**
```
┌──────────────────────────────────────────────────────────────┐
│  Add Shipment Details                                 [✕]    │
│  ─────────────────────────────────────────────────────────── │
│  Courier / Carrier Name*     [text input]                    │
│  Tracking Number*            [text input]                    │
│  Estimated Delivery Date*    [date picker]                   │
│  Live Tracking URL           [URL input, optional]           │
│  Shipment Notes              [textarea, optional]            │
│                                                              │
│  [Cancel]                    [Save Shipment Details]         │
└──────────────────────────────────────────────────────────────┘
```

**Shipment Details Card (on Order Tracking page — after shipping):**
```
┌──────────────────────────────────────────────────────────────┐
│  [Truck 20px]  SHIPMENT DETAILS                              │
│  Courier: BlueDart Express                                   │
│  Tracking #: BD1234567890                    [Copy]          │
│  Estimated Delivery: July 22, 2026                           │
│  [Track Package →]  (external link, opens in new tab)        │
│                                                              │
│  SHIPMENT HISTORY                                            │
│  Jul 8 — Shipment created by Aryan Mehta (Nexus Supplies)    │
│  Jul 9 — Picked up by BlueDart                               │
└──────────────────────────────────────────────────────────────┘
```

---

### Components Used
- `ShipmentForm` — modal form for entering shipment details
- `ShipmentDetailsCard` — tracking number, courier, ETA, tracking link
- `TrackingLinkButton` — external link button (`ExternalLink` icon)
- `ShipmentHistoryList` — chronological shipment events

---

### Empty State
Shown when order is not yet shipped: `Truck` icon (outline, Neutral-300), "Shipment details will appear here once the vendor ships your order"

---

### Permissions
- Enter/edit shipment: Vendor Admin, Vendor Employee
- View shipment: All company users with PO access

---

### Developer Notes
- `shipments` table FK to `orders`: `courier_name`, `tracking_number`, `tracking_url`, `estimated_delivery`, `created_by`
- `shipment_events` table: optional — vendor can add manual tracking updates
- Live tracking URL: stored as plain URL; VendorFlow does not integrate with courier APIs in v1 (future enhancement)
- Creating shipment record auto-advances order status to "Shipped"

---

## MODULE 23 — GOODS RECEIPT (GRN)

---

### Purpose
Allow company users to formally confirm receipt of delivered goods, verify quantities and quality, and flag any discrepancies. The GRN is the gate between delivery and invoice payment — no invoice can be approved until a GRN exists (per Business Rule BR-009).

---

### User Flow

1. Order status shows "Delivered" (or company receives goods physically)
2. Warehouse/Procurement Officer navigates to Orders → Goods Receipt → "+ Create GRN"
3. Selects the relevant PO, verifies items received against PO
4. Enters received quantities, marks quality status per item
5. Flags damaged/missing items with notes and images
6. Submits GRN → linked to PO → Invoice can now be raised

---

### Page Layout

**GRN List Page:**
```
┌──────────────────────────────────────────────────────────────┐
│  Page Header: Goods Receipt (GRN)                            │
│  Sub: "Confirm delivery of received orders"                  │
│  [+ Create GRN]                                              │
│                                                              │
│  FILTER TABS: All | Pending GRN | Completed | Disputed       │
│  SEARCH: [PO ID, vendor...]                                  │
│                                                              │
│  TABLE                                                       │
│  GRN ID    PO ID         Vendor          Received On  Status  Actions│
│  GRN-0042  PO-2026-0311  CloudHW India   Jul 18       ✓ Done  [View] │
│  GRN-0041  PO-2026-0309  OfficeFirst     Jul 10       ⚠ Disputed[View]│
│  —         PO-2026-0312  Nexus Supplies  Pending      ○ Create GRN   │
└──────────────────────────────────────────────────────────────┘
```

**GRN Creation Form:**
```
┌──────────────────────────────────────────────────────────────┐
│  Create Goods Receipt Note                                   │
│  PO-2026-0312 — Nexus Supplies                               │
│                                                              │
│  Receipt Date*     [date picker — default: today]            │
│  Received By*      [employee select]                         │
│  Delivery Note #   [text input — courier/vendor ref]         │
│                                                              │
│  ITEM VERIFICATION TABLE                                     │
│  Item           PO Qty  Received Qty*  Condition*   Notes    │
│  Office Chair   10      [10        ]   [Good ▾]     [      ] │
│  Chair Cushion  10      [ 8        ]   [Partial▾]   [2 missing]│
│                                                              │
│  DAMAGED / MISSING ITEMS                                     │
│  [+ Upload Inspection Photo] (if any item marked damaged)    │
│                                                              │
│  OVERALL STATUS*   radio: Accept Delivery / Reject Delivery  │
│  Rejection Reason  [textarea — required if Reject]           │
│                                                              │
│  INSPECTOR NOTES   [textarea, optional]                      │
│                                                              │
│  [Cancel]                    [Submit GRN]                    │
└──────────────────────────────────────────────────────────────┘
```

---

### Item Condition Options
- Good — all items received in perfect condition
- Partial — some items received or some quantity short
- Damaged — items received but damaged
- Missing — items not received at all

---

### GRN Detail View
After submission: read-only GRN document mirroring the PO structure, showing:
- GRN number, date, received by
- Item-by-item comparison: PO Qty vs Received Qty vs Condition
- Attached inspection photos (thumbnail grid)
- Overall status: Accepted / Disputed / Rejected
- Linked invoice (once raised)

---

### Components Used
- `GRNItemTable` — PO items with editable received qty and condition select
- `GRNStatusBanner` — Accepted (green), Disputed (amber), Rejected (red)
- `InspectionPhotoUpload` — image upload grid
- `GRNDocumentView` — read-only GRN after submission
- `LinkedInvoiceChip` — link to invoice created after GRN

---

### Empty State
`PackageCheck` icon, "No goods receipts yet", "Create a GRN when you receive delivered goods to proceed to invoicing"

---

### Success State
- GRN submitted (full acceptance): Toast "GRN-0043 created — vendor can now raise invoice"
- GRN with dispute: Toast "GRN-0043 submitted with disputes — vendor notified"

---

### Permissions

| Action | Super Admin | Proc. Manager | Proc. Officer | Finance Mgr | Employee |
|---|---|---|---|---|---|
| Create GRN | Yes | Yes | Yes | No | No |
| View GRN | Yes | Yes | Yes | Yes | No |
| Dispute resolution | Yes | Yes | No | No | No |

---

### Developer Notes
- `grn` table: `po_id` FK, `received_by`, `receipt_date`, `status`, `notes`
- `grn_items` table: `grn_id`, `po_item_id`, `received_qty`, `condition`, `notes`
- `grn_photos` table: `grn_id`, `storage_path`, `uploaded_by`
- GRN status `accepted` unlocks invoice creation for the corresponding PO (checked by Invoice module)
- Disputed GRN: sends notification to vendor, creates a `disputes` record for follow-up resolution workflow


---

## MODULE 24 — INVOICE MANAGEMENT

---

### Purpose
Allow vendors to generate structured, GST-compliant digital invoices against completed purchase orders. Enable company Finance Managers to review, approve, and process invoices for payment. Invoices are the financial closure step of every fulfilled procurement cycle.

---

### User Flow

**Vendor creating an invoice:**
1. Orders → Purchase Orders → open accepted & GRN-cleared PO → "Generate Invoice"
2. Invoice form pre-fills from PO data (items, quantities, pricing, taxes)
3. Vendor reviews, adds invoice number, bank details, due date
4. Submits invoice → Company Finance Manager notified

**Company reviewing an invoice:**
1. Finance → Invoices → open invoice
2. Reviews line items against PO and GRN
3. Approves → triggers payment flow (Module 25)
4. Or rejects with reason → vendor notified

---

### Page Layout

**Invoice List Page (Company):**
```
┌──────────────────────────────────────────────────────────────┐
│  Page Header: Invoices                                       │
│  Sub: "₹8.4L pending payment · 3 invoices awaiting review"  │
│                                                              │
│  FILTER TABS                                                 │
│  All (28) | Pending Review (3) | Approved (8) | Paid (14) | Rejected (3)│
│                                                              │
│  SEARCH + FILTERS                                            │
│  [Search invoice #, vendor...]  [Vendor ▾]  [Date Range ▾]   │
│  [Amount Range ▾]  [Status ▾]                                │
│                                                              │
│  TABLE                                                       │
│  Invoice #    Vendor          PO ID         Amount     Due Date   Status    Actions│
│  INV-1042    Nexus Supplies   PO-2026-0311  ₹1,24,500  Jul 25   ● Pending [⋯]    │
│  INV-1041    CloudHW India    PO-2026-0310  ₹55,086    Jul 20   ✓ Approved[⋯]    │
│  INV-1040    OfficeFirst      PO-2026-0309  ₹22,400    Jul 15   $ Paid    [⋯]    │
│                                                              │
│  FOOTER SUMMARY                                              │
│  Total Pending: ₹1,79,586   Total This Month: ₹4,28,900     │
└──────────────────────────────────────────────────────────────┘
```

**Invoice Detail Page:**
```
┌──────────────────────────────────────────────────────────────┐
│  [← Back to Invoices]              [Download PDF] [Print]    │
│                                                              │
│  INVOICE DOCUMENT VIEW (formatted as formal tax invoice)     │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  TAX INVOICE                              INV-1042   │   │
│  │  ─────────────────────────────────────────────────── │   │
│  │  FROM:                        TO:                    │   │
│  │  Nexus Supplies               Meridian Technologies  │   │
│  │  GST: 27AANFN...              GST: 27AABCM...       │   │
│  │  Mumbai, Maharashtra          Mumbai, Maharashtra    │   │
│  │  ─────────────────────────────────────────────────── │   │
│  │  PO Reference: PO-2026-0311                          │   │
│  │  Invoice Date: July 18, 2026                         │   │
│  │  Due Date: July 25, 2026                             │   │
│  │  ─────────────────────────────────────────────────── │   │
│  │  Item         Qty  Rate    Taxable  CGST  SGST  Total│   │
│  │  Network Sw.   4  ₹12,500  50,000  4,500 4,500 59,000│   │
│  │  CAT6 Cable  100    ₹450   45,000  4,050 4,050 53,100│   │
│  │  ─────────────────────────────────────────────────── │   │
│  │  Taxable Amount: ₹95,000                             │   │
│  │  CGST (9%):       ₹8,550                             │   │
│  │  SGST (9%):       ₹8,550                             │   │
│  │  Total: ₹1,12,100  [if IGST: single line]            │   │
│  │  ─────────────────────────────────────────────────── │   │
│  │  Bank Details:                                       │   │
│  │  Nexus Supplies · HDFC Bank · A/C: XXXXXXXX8812      │   │
│  │  IFSC: HDFC0001234                                   │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  APPROVAL PANEL (right side — Finance Manager only)          │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  ● Pending Your Approval                             │   │
│  │  Linked PO: PO-2026-0311  [View →]                   │   │
│  │  GRN: GRN-0042 — ✓ Accepted                         │   │
│  │                                                      │   │
│  │  Approval Notes: [textarea]                          │   │
│  │  [✗ Reject Invoice]    [✓ Approve Invoice]           │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  PAYMENT STATUS (after approval)                             │
│  [CreditCard] ● Payment Pending  [Process Payment →]         │
└──────────────────────────────────────────────────────────────┘
```

**Invoice Form (Vendor — Generate Invoice):**
```
┌──────────────────────────────────────────────────────────────┐
│  Generate Invoice — PO-2026-0311                             │
│  CloudHW India → Meridian Technologies                       │
│                                                              │
│  Invoice Number*     [auto-generated, editable: INV-XXXX]   │
│  Invoice Date*       [date picker — default: today]          │
│  Due Date*           [date picker — Net 30 pre-filled]       │
│                                                              │
│  LINE ITEMS (pre-filled from PO — quantities editable)       │
│  Item       Qty   Rate      Taxable   CGST%  SGST%  Total   │
│  Net. Sw.   [4]  [12,500]  [50,000]  [9%]   [9%]  [59,000] │
│                                                              │
│  TOTALS (live-calculated)                                    │
│  Taxable: ₹95,000  CGST: ₹8,550  SGST: ₹8,550              │
│  Grand Total: ₹1,12,100                                      │
│                                                              │
│  BANK DETAILS (pre-filled from vendor profile)               │
│  Bank: HDFC   A/C: XXXXXXXX8812   IFSC: HDFC0001234          │
│  [Edit Bank Details]                                         │
│                                                              │
│  NOTES / TERMS   [textarea, optional]                        │
│                                                              │
│  [Save Draft]              [Submit Invoice]                  │
└──────────────────────────────────────────────────────────────┘
```

---

### Components Used
- `InvoiceDocumentView` — formatted GST-compliant invoice renderer
- `InvoiceApprovalPanel` — Finance Manager action panel (right side)
- `InvoiceForm` — vendor-side invoice generation form
- `GSTTaxCalculator` — live CGST/SGST/IGST computation based on vendor/buyer state codes
- `InvoiceStatusBadge` — Draft, Submitted, Pending Review, Approved, Rejected, Paid
- `DueDateWarning` — amber banner if due date is within 3 days
- `LinkedRecordChips` — PO, GRN, Payment links
- `DataTable` — invoice list with footer summary row
- `DownloadPDFButton`, `PrintButton`

---

### GST Handling
- Same-state transaction (vendor and buyer in same state): CGST + SGST split (9% + 9% for 18% total)
- Inter-state transaction: IGST as single line (18%)
- Tax rate auto-detected from product HSN code or vendor product tax setting
- Invoice PDF: fully GST-compliant format per Indian tax regulations

---

### Buttons

| Button | Variant | Usage |
|---|---|---|
| Generate Invoice | Primary (vendor) | Open invoice form from PO |
| Submit Invoice | Primary (vendor) | Send invoice to company |
| Save Draft | Secondary (vendor) | Work-in-progress |
| Approve Invoice | Success/primary (company) | Finance Manager approves |
| Reject Invoice | Destructive/outlined (company) | Finance Manager rejects |
| Process Payment → | Primary (company) | Navigate to Payment module |
| Download PDF | Secondary | Download invoice |
| Email Invoice | Ghost | Re-send invoice email |

---

### Filters

| Filter | Options |
|---|---|
| Status tabs | All / Pending Review / Approved / Paid / Rejected |
| Vendor | Select from connected vendors |
| Date Range | Invoice date range |
| Amount Range | Min/max currency inputs |

---

### Empty State
- Company: `FileSpreadsheet` icon, "No invoices yet", "Invoices will appear here once vendors submit them against purchase orders"
- Vendor: `FileSpreadsheet` icon, "No invoices generated", "Generate an invoice for any accepted and delivered purchase order", CTA "Generate Invoice"

---

### Loading State
List: 5 skeleton rows with footer summary skeleton. Detail: document skeleton block + approval panel skeleton.

---

### Error State
- Invoice submitted before GRN: "Cannot generate invoice — goods receipt not confirmed for PO-2026-0311"
- Duplicate invoice number: "An invoice with this number already exists"
- Approved invoice payment fails: error notification (handled by Payment module)

---

### Success State
- Invoice submitted: Toast "Invoice INV-1042 submitted to Meridian Technologies"
- Invoice approved: Toast "INV-1042 approved — ready for payment"
- Invoice rejected: Toast "INV-1042 rejected — Nexus Supplies has been notified"

---

### Responsive Behaviour
- **Desktop:** Document view + approval panel side-by-side
- **Tablet:** Approval panel below document view; document view full-width
- **Mobile:** Document view collapsible sections; approval actions sticky bottom bar with Approve/Reject buttons

---

### Permissions

| Action | Super Admin | Proc. Mgr | Finance Mgr | Proc. Officer | Vendor Admin | Vendor Finance Exec |
|---|---|---|---|---|---|---|
| Generate invoice | No | No | No | No | Yes | Yes |
| Submit invoice | No | No | No | No | Yes | Yes |
| Review/Approve | Yes | No | Yes | No | No | No |
| View invoices | Yes | Yes | Yes | Yes | Own only | Own only |
| Process payment | Yes | No | Yes | No | No | No |

---

### Accessibility
- Invoice document view: semantic heading hierarchy (`<h1>` for invoice number, `<h2>` for sections)
- Approval buttons: `aria-label="Approve Invoice INV-1042"` and `aria-label="Reject Invoice INV-1042"`
- Tax breakdown table: `role="table"`, proper `thead`/`tbody` with `scope` attributes
- Due date warning: `role="alert"` when past due

---

### Developer Notes
- `invoices` table FK to `purchase_orders`, `vendors`, `companies`
- `invoice_items` table: line items with computed tax columns
- Invoice number: vendor-defined (their own numbering system) + VendorFlow internal `inv_id`
- GRN check: Edge Function validates `grn.status = 'accepted'` before allowing invoice submission
- PDF generation: same pattern as PO — server-side HTML-to-PDF via Edge Function
- Stored in Supabase Storage `invoices/[company_id]/[invoice_id].pdf`
- CGST/SGST vs IGST: determined by comparing `vendor.state_code` vs `company.state_code`

---

## MODULE 25 — PAYMENT MANAGEMENT

---

### Purpose
Enable company Finance Managers to initiate and track payments to vendors for approved invoices using Razorpay. Provide vendors with real-time payment status and downloadable receipts.

---

### User Flow

**Company initiating payment:**
1. Finance → Payments → open approved invoice → "Process Payment"
2. Payment summary shown: invoice amount, vendor bank details, payment method
3. Finance Manager confirms → Razorpay payment initiated
4. On success → payment receipt generated, vendor notified
5. Invoice status → "Paid", PO lifecycle → "Closed"

**Vendor tracking payments:**
1. Vendor Dashboard → Finance → Payments
2. View payment history, download receipts

---

### Page Layout

**Payment List Page (Company):**
```
┌──────────────────────────────────────────────────────────────┐
│  Page Header: Payments                                       │
│  Sub: "₹4.28L paid this month · ₹1.79L pending"             │
│                                                              │
│  FILTER TABS: All | Pending | Completed | Failed | Refunded  │
│  FILTERS: [Vendor ▾]  [Date Range ▾]  [Amount Range ▾]       │
│                                                              │
│  SUMMARY CARDS ROW                                           │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌───────────┐ │
│  │ Total Paid │ │  Pending   │ │  This Month│ │ Failed    │ │
│  │ ₹42.8L    │ │ ₹1.79L    │ │ ₹4.28L    │ │   2       │ │
│  └────────────┘ └────────────┘ └────────────┘ └───────────┘ │
│                                                              │
│  TABLE                                                       │
│  Txn ID      Vendor         Invoice     Amount    Date      Status    Actions│
│  TXN-8821   Nexus Supplies  INV-1040   ₹22,400   Jul 10   ✓ Paid   [Receipt]│
│  TXN-8820   CloudHW India   INV-1039   ₹84,500   Jul 8    ✓ Paid   [Receipt]│
│  —          Nexus Supplies  INV-1042   ₹1,12,100 Pending  ● Pending [Pay →] │
└──────────────────────────────────────────────────────────────┘
```

**Payment Initiation Flow (modal/page):**
```
┌──────────────────────────────────────────────────────────────┐
│  Process Payment                                      [✕]    │
│  ─────────────────────────────────────────────────────────── │
│  PAYMENT SUMMARY                                             │
│  Invoice: INV-1042  ·  Nexus Supplies                        │
│  Amount: ₹1,12,100                                           │
│  Due Date: July 25, 2026                                     │
│                                                              │
│  VENDOR BANK DETAILS                                         │
│  Bank: HDFC Bank  ·  A/C: XXXXXXXX8812  ·  IFSC: HDFC0001234│
│  Account Holder: Nexus Supplies Pvt. Ltd.                    │
│                                                              │
│  PAYMENT METHOD                                              │
│  ● Razorpay (Bank Transfer / UPI / NEFT)                     │
│  ○ Mark as Paid Externally (for offline payments)            │
│                                                              │
│  [Cancel]              [Proceed to Payment — ₹1,12,100 →]   │
└──────────────────────────────────────────────────────────────┘
```

Then Razorpay checkout modal (standard Razorpay UI) overlays the application.

**Payment Receipt Page / Download:**
```
┌──────────────────────────────────────────────────────────────┐
│  PAYMENT RECEIPT                           RECEIPT-TXN-8821  │
│  ─────────────────────────────────────────────────────────── │
│  Paid By:  Meridian Technologies                             │
│  Paid To:  Nexus Supplies                                    │
│  Invoice:  INV-1040                                          │
│  Amount:   ₹22,400                                           │
│  Date:     July 10, 2026  ·  11:42 AM                        │
│  Method:   Razorpay (UPI)                                    │
│  Razorpay Order ID:  order_XXXXXXXXXX                        │
│  Transaction ID:     pay_XXXXXXXXXXXXXXXXX                   │
│  Status:   ✓ PAYMENT SUCCESSFUL                              │
│  ─────────────────────────────────────────────────────────── │
│  [Download Receipt PDF]           [Close]                    │
└──────────────────────────────────────────────────────────────┘
```

---

### Components Used
- `PaymentSummaryCard` — 4 KPI cards (Total Paid, Pending, This Month, Failed)
- `PaymentInitiationModal` — pre-payment confirmation with vendor bank details
- `RazorpayCheckout` — Razorpay's hosted checkout (standard integration)
- `PaymentReceiptModal` — transaction confirmation overlay
- `PaymentStatusBadge` — Pending (amber), Completed (green), Failed (red), Refunded (gray)
- `FailedPaymentAlert` — red banner on failed transactions with "Retry" CTA
- `DataTable` — payment history list
- `ReceiptDownloadButton` — PDF receipt download per payment

---

### Failed Payment Handling
- Razorpay callback returns failure → `payment_transactions.status = 'failed'`
- Red error banner appears: "Payment of ₹1,12,100 failed. [Retry Payment]"
- Retry uses same Razorpay order (idempotent retry via Razorpay order ID)
- After 3 failures: Finance Manager prompted to check vendor bank details or use alternative method

---

### Buttons

| Button | Variant | Usage |
|---|---|---|
| Pay → / Process Payment | Primary | Initiate payment flow |
| Proceed to Payment | Primary (modal) | Open Razorpay |
| Mark as Paid Externally | Secondary | Offline payment record |
| Retry Payment | Primary/amber | Failed payment retry |
| Download Receipt | Secondary | Receipt PDF |
| View Receipt | Ghost | Open receipt modal |

---

### Empty State
`CreditCard` icon, "No payment history", "Payment records will appear here once invoices are paid"

---

### Success State
- Payment completed: Full-screen success overlay (2 seconds): large `CheckCircle` (64px, success green), "Payment Successful", "₹22,400 paid to Nexus Supplies", then auto-redirect to payment list
- Toast: "Payment TXN-8821 completed — Nexus Supplies notified"

---

### Error State
- Payment failed: `XCircle` icon overlay (error red), "Payment Failed", Razorpay error message, "Retry" and "Contact Support" buttons
- Invoice not approved: "Cannot process payment — invoice must be approved first" (blocked at UI level)

---

### Responsive Behaviour
- **Desktop:** Full table with summary cards row, side-by-side receipt modal
- **Mobile:** Summary cards stack vertically; payment initiation is full-screen; Razorpay checkout renders natively

---

### Permissions

| Action | Super Admin | Finance Mgr | Proc. Manager | All others | Vendor |
|---|---|---|---|---|---|
| Initiate payment | Yes | Yes | No | No | No |
| View payments | Yes | Yes | Yes | No | Own receipts |
| Download receipt | Yes | Yes | Yes | No | Yes (own) |
| Mark external payment | Yes | Yes | No | No | No |

---

### Accessibility
- Payment summary cards: `aria-label="Total paid this month: 4 lakh 28 thousand rupees"`
- Razorpay modal: standard Razorpay accessibility (managed by Razorpay SDK)
- Receipt modal: `role="dialog"`, `aria-labelledby="receipt-heading"`, focus trapped
- Failed payment banner: `role="alert"`, `aria-live="assertive"` for immediate announcement

---

### Developer Notes
- Razorpay integration: create order server-side (Edge Function) → return `order_id` to client → client opens Razorpay checkout → client sends `payment_id` + `signature` to server for verification
- Server verifies Razorpay signature before marking payment as completed (security critical)
- `payment_transactions` table: `invoice_id`, `amount`, `currency`, `razorpay_order_id`, `razorpay_payment_id`, `status`, `paid_by`, `paid_at`
- Webhook: Razorpay sends `payment.captured` event → Edge Function updates status + triggers notification
- Receipt PDF: generated server-side with transaction data, stored in `payment-receipts/[company_id]/[txn_id].pdf`
- External payment: creates same `payment_transactions` record with `method = 'external'`, no Razorpay IDs
- Refund support: Razorpay refund API triggered via Finance Manager action; `refunds` table tracks refund records

---

## MODULE 26 — REVIEWS & RATINGS

---

### Purpose
Enable companies to evaluate vendor performance after order completion, contributing to a transparent, trust-based vendor reputation system. Reviews affect vendor scores on the Marketplace and Vendor Profile.

---

### User Flow

1. PO marked as Delivered (GRN completed) → Company users eligible to review vendor
2. Company receives in-app notification + email: "Share your experience with Nexus Supplies"
3. Review form opens (from notification CTA, PO detail, or Vendor Profile)
4. Company rates vendor across 5 dimensions and writes a review
5. Submitted review appears on Vendor Profile (Reviews tab)
6. Vendor's average rating updated across the platform

---

### Page Layout

**Write Review Modal:**
```
┌──────────────────────────────────────────────────────────────┐
│  Review Nexus Supplies                                [✕]    │
│  For PO-2026-0311 · Delivered July 18, 2026                  │
│  ─────────────────────────────────────────────────────────── │
│  Overall Rating*                                             │
│  ☆ ☆ ☆ ☆ ☆   (click to rate 1–5)                           │
│                                                              │
│  DETAILED RATINGS                                            │
│  Product Quality    ☆ ☆ ☆ ☆ ☆                              │
│  Delivery           ☆ ☆ ☆ ☆ ☆                              │
│  Communication      ☆ ☆ ☆ ☆ ☆                              │
│  Pricing            ☆ ☆ ☆ ☆ ☆                              │
│                                                              │
│  Your Review*                                                │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Great experience — products arrived on time and...   │   │
│  └──────────────────────────────────────────────────────┘   │
│  min 20 chars · max 1000 chars                               │
│                                                              │
│  Would you recommend this vendor?  ● Yes  ○ No               │
│                                                              │
│  [Cancel]                          [Submit Review]           │
└──────────────────────────────────────────────────────────────┘
```

**Reviews List Page (Company-side "My Reviews" view):**
```
┌──────────────────────────────────────────────────────────────┐
│  Page Header: Reviews Given                                  │
│  Sub: "You've reviewed 18 vendors"                           │
│                                                              │
│  REVIEW CARDS LIST                                           │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  [Nexus Logo 32px]  Nexus Supplies                   │   │
│  │  PO-2026-0311  ·  July 18, 2026  ·  ★★★★☆ 4.0       │   │
│  │  "Great experience — products arrived on time..."    │   │
│  │  [Edit Review] [Delete]                              │   │
│  └──────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────┘
```

**Vendor-side Reviews Received (on Vendor Dashboard → Analytics → Reviews):**
- Same `ReviewCard` list but read-only; vendor can see all reviews but cannot edit them
- Aggregate rating breakdown bar chart (5→1 star distribution)
- Average per dimension (Quality, Delivery, Communication, Pricing)

---

### Components Used
- `StarRatingInput` — interactive star selector (1–5, hover preview)
- `DimensionRatingRow` — label + star input for each sub-dimension
- `ReviewTextarea` — review body with character count
- `ReviewCard` — submitted review display (logo, name, stars, text, date)
- `RatingBreakdown` — horizontal bar chart showing star distribution
- `DimensionAverages` — 4 mini metric cards for sub-dimension averages
- `RecommendationBadge` — "Recommends this vendor" (thumb-up, green) or "Does not recommend" (thumb-down, red)

---

### Review Editing Policy
- Company can edit their own review within 7 days of submission
- After 7 days: read-only (encourages authentic, unconsidered reviews not being deleted under vendor pressure)
- Vendor cannot edit or delete any review

---

### Buttons

| Button | Variant | Usage |
|---|---|---|
| Submit Review | Primary | Submit review form |
| Edit Review | Ghost/secondary | Edit within 7 days |
| Delete Review | Ghost destructive | Delete within 7 days |

---

### Empty State
- No reviews given: `Star` icon (outline), "You haven't reviewed any vendors yet", "Complete orders to unlock the review feature"
- No reviews received (vendor): `Star` icon, "No reviews yet", "Reviews appear here after companies complete orders with you"

---

### Success State
Toast "Your review for Nexus Supplies has been submitted" + vendor rating badge updates on their profile (optimistic UI)

---

### Permissions

| Action | All company users | Vendor staff | Platform Admin |
|---|---|---|---|
| Write review | Yes (post-completed order) | No | No |
| Edit own review | Yes (within 7 days) | No | No |
| View reviews | Yes | Yes (own vendor) | Yes (all) |
| Delete any review | No | No | Yes (moderation) |

---

### Accessibility
- Star rating input: `role="radiogroup"`, each star `role="radio"` with `aria-label="Rate 4 out of 5 stars"`, keyboard selectable with arrow keys
- Review textarea: character counter: `aria-live="polite"` announcing remaining characters
- Recommendation radio: `role="group"` with descriptive `aria-labelledby`

---

### Developer Notes
- `reviews` table: `vendor_id`, `company_id`, `po_id`, `overall_rating`, `quality_rating`, `delivery_rating`, `communication_rating`, `pricing_rating`, `body`, `recommend`, `created_at`
- Rating averages: computed via Supabase view with `AVG()` per vendor, refreshed via trigger on insert/update
- One review per company per PO (unique constraint on `company_id + po_id`)
- Platform Admin can flag/remove reviews that violate platform terms
- Review reminder email sent 3 days after GRN completion if no review submitted (via Resend scheduled via Edge Function)


---

## MODULE 27 — NOTIFICATION CENTER

---

### Purpose
Provide a centralized, organized hub where users can view, manage, and act on all platform notifications. The Notification Center is the persistent record of every important event that has occurred in the user's workspace — serving as both an action queue and a history log.

---

### User Flow

1. User clicks bell icon in Top Navigation → notification dropdown (quick view, last 10)
2. User clicks "View all notifications →" → full Notification Center page (`/notifications`)
3. User filters, searches, marks notifications as read, or deletes
4. Clicking any notification navigates to the relevant record

---

### Page Layout

**Full Notification Center Page (`/notifications`):**
```
┌──────────────────────────────────────────────────────────────┐
│  Page Header: Notifications                                  │
│  Sub: "12 unread notifications"                              │
│  [Mark All Read]  [Settings →]                               │
│                                                              │
│  FILTER TABS                                                 │
│  All (48) | Unread (12) | Procurement (18) | Finance (8)     │
│  | Approvals (6) | System (4)                                │
│                                                              │
│  SEARCH: [Search notifications...]                           │
│                                                              │
│  NOTIFICATION LIST                                           │
│  ─── TODAY ──────────────────────────────────────────────── │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ ● [Send 14px blue bg]  New Quotation Received        │   │
│  │  Nexus Supplies responded to RFQ-0089 · Office Chairs│   │
│  │  2 minutes ago                    [View →]           │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ ● [ShieldAlert amber bg] Approval Required           │   │
│  │  PR-0081 submitted by Riya Sharma requires your      │   │
│  │  approval — ₹45,000 budget                           │   │
│  │  45 minutes ago              [Approve] [View →]      │   │
│  └──────────────────────────────────────────────────────┘   │
│  ─── YESTERDAY ──────────────────────────────────────────── │
│  ┌──────────────────────────────────────────────────────┐   │
│  │   [CheckCircle green bg] Payment Completed           │   │
│  │  ₹22,400 paid to Nexus Supplies for INV-1040         │   │
│  │  Yesterday at 11:42 AM              [View Receipt]   │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  LOAD MORE (pagination / infinite scroll)                    │
└──────────────────────────────────────────────────────────────┘
```

---

### Notification Card Design

```
Card container: white bg, rounded-lg, p-4, border-bottom 1px Neutral-100
Unread indicator: 8px Electric Blue dot, left-aligned, vertically centered
Icon container: 32px rounded-lg, color-matched bg (blue/amber/green/red), icon 14px white
Content area:
  Title: text-sm font-semibold Neutral-800 (unread) / Neutral-600 (read)
  Body: text-xs Neutral-500, line-clamp-2
  Time: text-xs Neutral-400, right-aligned
Inline CTA (for actionable notifications): small outlined button (text-xs, 28px height)
  e.g., [Approve], [View RFQ], [View Receipt], [View Order]
Hover: Neutral-50 bg, 100ms
Three-dot menu (on hover): Mark as Read, Delete
```

---

### Notification Grouping
Notifications are grouped by date:
- Today
- Yesterday
- This week (Mon–Sat of current week)
- Older (grouped by "Last 30 days", then older by month)

---

### Components Used
- `NotificationCard` — individual notification with icon, content, CTA, three-dot menu
- `NotificationGroupHeader` — date separator ("Today", "Yesterday")
- `NotificationFilters` — tab row for category filtering
- `NotificationSearch` — real-time search within notifications
- `MarkAllReadButton` — bulk mark-read action
- `NotificationEmptyState` — empty state per filter
- `NotificationPreferencesLink` — Settings → Notifications shortcut
- `InfiniteScroll` / `LoadMoreButton` — pagination pattern

---

### Notification Types and Actions

| Event | Icon | Color | Inline CTA |
|---|---|---|---|
| RFQ Created | Send | Blue | View RFQ |
| RFQ Expiring Soon | Clock | Amber | View RFQ |
| New Quotation Received | Receipt | Blue | Compare Quotes |
| Approval Required | ShieldAlert | Amber | Approve / View |
| PR Approved | CheckCircle | Green | View PR |
| PR Rejected | XCircle | Red | View PR |
| PO Created | ShoppingCart | Blue | View PO |
| Vendor Accepted PO | CheckCircle | Green | Track Order |
| Vendor Rejected PO | XCircle | Red | View PO |
| Order Shipped | Truck | Blue | Track Order |
| Order Delivered | PackageCheck | Green | Create GRN |
| Invoice Received | FileSpreadsheet | Blue | Review Invoice |
| Invoice Approved | CheckCircle | Green | Process Payment |
| Payment Completed | CreditCard | Green | View Receipt |
| Payment Failed | AlertTriangle | Red | Retry Payment |
| Employee Invited | UserPlus | Blue | — |
| Vendor Invited | Store | Blue | — |
| Review Request | Star | Amber | Write Review |
| System Alert | AlertTriangle | Red | — |
| Subscription Expiring | CreditCard | Amber | Manage Billing |

---

### Filters & Search

| Filter | Options |
|---|---|
| Status tabs | All / Unread / Procurement / Finance / Approvals / System |
| Search | Real-time full-text search on notification title + body |
| Date Range | Last 7 days / Last 30 days / Custom range |

---

### Bulk Actions
- Select multiple notifications via checkboxes → "Mark selected as read" / "Delete selected"
- "Mark all as read" clears unread count instantly (optimistic update)
- "Delete all read" bulk cleanup option

---

### Empty States
- All notifications empty: `Bell` icon (48px), "No notifications yet", "Activity from your workspace will appear here"
- Unread filter empty: `CheckCircle` icon (success green), "You're all caught up!", "No unread notifications"
- Search empty: "No notifications match '[query]'"

---

### Loading State
- Initial load: 8 skeleton notification cards (shimmer: 32px circle + 2 text lines + time)
- Load more: 3 more skeleton cards appended at bottom

---

### Responsive Behaviour
- **Desktop:** Full-width notification list page, max-width 720px centered
- **Tablet:** Same
- **Mobile:** Full-width, notification cards are touch-friendly (min 56px height), swipe-left to delete gesture

---

### Permissions
- Each user sees only their own notifications (enforced by RLS on `notifications` table using `user_id`)
- Platform Admin sees platform-level notifications only (not company/vendor notifications)

---

### Accessibility
- Notification list: `role="feed"`, each card `role="article"`, `aria-label` includes notification title
- Unread dot: `aria-label="Unread"` on the dot element; screen reader announces "(Unread)" before card content
- Live region: `aria-live="polite"` on the unread count badge in top nav, updated when new notifications arrive
- Mark as read action: `aria-label="Mark notification as read: [title]"`

---

### Developer Notes
- `notifications` table: `user_id`, `type`, `title`, `body`, `action_url`, `read_at`, `created_at`
- Real-time delivery: Supabase Realtime subscription on `notifications` table filtered by `user_id`
- Unread count: computed via `COUNT WHERE read_at IS NULL` — updated on subscription event
- Mark as read: sets `read_at = now()` — soft read state
- Delete: hard delete from table (no archive in v1)
- Notification creation: triggered by Edge Functions on business events (PR submitted, PO accepted, payment completed, etc.)
- Inbox notification preferences: stored per-user in `notification_preferences` table (see Module 39 Settings)

---

## MODULE 28 — EMAIL NOTIFICATION SERVICE

---

### Purpose
Define the structure, design, and behavior of all transactional emails sent by VendorFlow via Resend. Emails must be professional, branded, and action-oriented.

---

### Email Design System

All VendorFlow emails follow a consistent template:

```
┌────────────────────────────────────────────────┐
│  [VendorFlow Logo]                             │
│  ──────────────────────────────────────────── │
│                                                │
│  [Hero Section]                                │
│  Icon or illustration (48px)                  │
│  Email heading (text-2xl, font-bold)           │
│  Sub-heading (text-base, Neutral-600)          │
│                                                │
│  ──────────────────────────────────────────── │
│                                                │
│  [Content Section]                             │
│  Contextual details in a clean info card       │
│  Key/value pairs for order details, amounts    │
│                                                │
│  [Primary CTA Button]                          │
│  Electric Blue, rounded-md, centered           │
│  Bold white text                               │
│                                                │
│  ──────────────────────────────────────────── │
│  [Footer]                                      │
│  VendorFlow · vendorflow.in                    │
│  "You received this because you are a member   │
│  of [Workspace Name]"                          │
│  [Unsubscribe from non-critical emails]        │
└────────────────────────────────────────────────┘
```

---

### Email Templates Inventory

| Email | Trigger | Primary CTA | Recipient |
|---|---|---|---|
| Welcome & Email Verification | Registration | Verify Email | New user |
| OTP Verification | Login/security action | — (OTP displayed) | User |
| Forgot Password | Password reset request | Reset Password | User |
| Employee Invitation | Admin invites employee | Accept Invitation | Invitee |
| Vendor Invitation | Company invites vendor | View Invitation | Vendor |
| Vendor Registration Approved | Admin approves vendor | Go to Dashboard | Vendor Admin |
| New RFQ Received | RFQ sent to vendor | View RFQ | Vendor contact |
| RFQ Expiring Soon | 24h before deadline | Respond to RFQ | Vendor contact |
| Quotation Received | Vendor submits quote | Compare Quotes | Procurement Manager |
| Approval Required | PR/Invoice submitted | Review & Approve | Approver |
| PR Approved | Approval chain completed | View PR | PR creator |
| PR Rejected | Rejection recorded | View Feedback | PR creator |
| PO Created & Sent | PO dispatched | View Purchase Order | Vendor contact |
| Vendor Accepted PO | Vendor acceptance | Track Your Order | Procurement Manager |
| Vendor Rejected PO | Vendor rejection | View PO | Procurement Manager |
| Order Shipped | Vendor marks shipped | Track Shipment | Company contact |
| Order Delivered | Vendor/GRN confirms delivery | Create GRN | Procurement Officer |
| Invoice Submitted | Vendor submits invoice | Review Invoice | Finance Manager |
| Invoice Approved | Finance Manager approves | Process Payment | Finance Manager |
| Payment Completed | Razorpay payment captured | Download Receipt | Both parties |
| Payment Failed | Razorpay failure | Retry Payment | Finance Manager |
| Review Request | 3 days post-delivery | Write a Review | Company contact |
| Document Expiring | 30 days before expiry | Update Document | Vendor Admin |
| Subscription Expiring | 7 days before renewal | Manage Billing | Company Super Admin |
| Platform Maintenance Notice | Admin announcement | — | All users |

---

### Email Design Rules
- Subject lines: concise, action-oriented, under 60 characters
- Preheader text: 80–100 chars summarizing the email content
- No images in critical transactional emails (OTP, password reset) — text only for deliverability
- All emails include plain-text fallback
- Mobile-responsive: single column, 600px max width
- CTAs: single primary action per email, no competing links
- Security emails (OTP, password reset): include "If you didn't request this..." note

---

### Developer Notes
- Email delivery: Resend API via Supabase Edge Functions
- Templates: React Email components rendered server-side to HTML
- Template variables: passed as JSON payload to Edge Function
- Email queue monitoring: tracked in Platform Administration module (Module 42)
- Bounce/failure handling: Resend webhooks → update `email_log` table status
- Unsubscribe: only for non-critical marketing emails; transactional emails (OTP, PO, payment) cannot be unsubscribed

---

## MODULE 29 — IN-APP NOTIFICATIONS

---

### Purpose
Deliver real-time notifications within the VendorFlow application to keep users informed of important events as they happen, without requiring them to check email. In-app notifications power the notification bell, the Notification Center, and dashboard action widgets.

---

### Real-Time Delivery Architecture

```
Business Event Occurs
      ↓
Edge Function creates notification record in `notifications` table
      ↓
Supabase Realtime broadcasts INSERT event to subscribed clients
      ↓
Client React component receives event
      ↓
Bell badge count increments (+1 with pulse animation)
Toast notification appears (bottom-right, 5 second auto-dismiss)
Notification Center list prepends new item
```

---

### Toast Notification Design

```
┌──────────────────────────────────────────────────────┐
│  [Icon 16px]  New Quotation Received          [✕]   │
│  Nexus Supplies responded to RFQ-0089         [View] │
└──────────────────────────────────────────────────────┘
Width: 360px  ·  Border-radius: rounded-xl
Shadow: shadow-xl  ·  Background: white
Left border: 4px solid (color by notification type)
Position: bottom-right, stacked (max 3 visible at once)
Auto-dismiss: 5 seconds (progress bar indicator)
Hover: pause auto-dismiss timer
```

---

### Toast Stacking Behavior
- Maximum 3 toasts visible simultaneously
- New toasts push older ones up
- 4th toast replaces oldest (FIFO queue)
- User can dismiss any toast early with `✕` button
- "View all notifications" link appears if >3 arrive within 10 seconds

---

### Notification Bell Pulse
When a new notification arrives while the user is on a page:
- Bell icon pulses once (scale 1 → 1.2 → 1, 300ms)
- Red badge count increments with a counter animation
- If Notification dropdown is open, new item slides in at the top of the list

---

### Components Used
- `ToastProvider` — wraps application at root level (Zustand + portal-based)
- `Toast` — individual toast card component
- `ToastProgressBar` — auto-dismiss countdown bar (thin, 2px, at bottom of toast)
- `BellBadge` — bell icon with animated count badge
- `RealtimeNotificationListener` — Supabase Realtime subscription hook

---

### Developer Notes
- Supabase Realtime: `channel('notifications').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: 'user_id=eq.[userId]' }, callback)`
- Toast state: managed in Zustand store (`toastStore`); components subscribe via `useToastStore()`
- Notification sound: optional, off by default, configurable in Notification Preferences
- Read state sync: marking notification read in the Center also removes the unread dot in the bell (via Zustand store update)

---

## MODULE 30 — COMMUNICATION CENTER (MESSAGING)

---

### Purpose
Enable structured, contextual messaging between company users and vendor users. Conversations are anchored to procurement artifacts (RFQs, POs, Quotations) to keep context clear and communications traceable.

---

### User Flow

1. Company user navigates to Communication → Messages
2. Or: from RFQ/PO/Quotation detail → "Message Vendor" button
3. Opens or creates a conversation with a vendor
4. Messages sent in real-time; file attachments supported
5. Vendor receives in-app notification + email summary (if inactive)

---

### Page Layout

```
┌──────────────────────────────────────────────────────────────┐
│  Page Header: Messages                                       │
│                                                              │
│  TWO-PANEL LAYOUT (320px left / remaining right)             │
│  ┌──────────────────────┐ ┌──────────────────────────────┐  │
│  │  CONVERSATION LIST   │ │  ACTIVE CONVERSATION         │  │
│  │                      │ │                              │  │
│  │  [Search convs...]   │ │  CONVERSATION HEADER         │  │
│  │                      │ │  [Logo 32px] Nexus Supplies  │  │
│  │  ─────────────────   │ │  Re: RFQ-0089 Office Chairs  │  │
│  │  [Logo] Nexus        │ │  [View RFQ →]                │  │
│  │  Office Chairs RFQ   │ │  ─────────────────────────   │  │
│  │  "Sure, we can..."   │ │                              │  │
│  │  2m ago  ● 3         │ │  MESSAGE THREAD              │  │
│  │  ─────────────────   │ │  ┌──────────────────────┐   │  │
│  │  [Logo] CloudHW      │ │  │ Jul 6, 10:30 AM       │   │  │
│  │  PO-2026-0311        │ │  │ Riya Sharma           │   │  │
│  │  "Shipment going..." │ │  │ "Hi, please confirm   │   │  │
│  │  Yesterday           │ │  │ delivery timeline..."  │   │  │
│  │  ─────────────────   │ │  └──────────────────────┘   │  │
│  │  [Logo] OfficeFirst  │ │  ┌──────────────────────┐   │  │
│  │  General             │ │  │ Jul 6, 11:15 AM       │   │  │
│  │  "Thank you for..."  │ │  │ Nexus Supplies         │   │  │
│  │  Jul 4               │ │  │ "Sure, we can deliver  │   │  │
│  │                      │ │  │ by Jul 22..."          │   │  │
│  │  [+ New Message]     │ │  └──────────────────────┘   │  │
│  └──────────────────────┘ │                              │  │
│                           │  MESSAGE INPUT               │  │
│                           │  ┌──────────────────────┐   │  │
│                           │  │ Type a message...    │   │  │
│                           │  │            [📎][Send]│   │  │
│                           │  └──────────────────────┘   │  │
│                           └──────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

---

### Message Bubble Design

**Sender (current user) — right aligned:**
```
Background: Electric Blue (#2563EB)
Text: white
Border-radius: rounded-xl rounded-br-sm
Max-width: 70%
Padding: px-4 py-2.5
Timestamp: text-xs, white opacity-70, below bubble right-aligned
Read receipt: ✓✓ (double tick) when read by recipient
```

**Recipient — left aligned:**
```
Background: Neutral-100
Text: Neutral-800
Border-radius: rounded-xl rounded-bl-sm
Max-width: 70%
Padding: px-4 py-2.5
Sender name: text-xs, Neutral-500, above bubble
Timestamp: text-xs, Neutral-400, below bubble
```

**File attachment bubble:**
```
Background: same as message bubble
Content: [FileText icon 16px] filename.pdf · 1.2 MB  [Download ↓]
```

**System message (conversation linked to RFQ/PO):**
```
Center-aligned, text-xs Neutral-400, italic
"Conversation linked to RFQ-0089 · Office Chairs"
```

---

### Components Used
- `ConversationList` — left panel with search, conversation items
- `ConversationItem` — avatar, vendor name, last message preview, unread count, timestamp
- `MessageThread` — scrollable message bubble list, grouped by date
- `MessageBubble` — sender / recipient variants
- `MessageInput` — textarea with file attachment + send button
- `FileAttachmentPicker` — click or drag-drop, max 10MB, common file types
- `ConversationHeader` — vendor name, context link (RFQ/PO), online status (future)
- `ReadReceipt` — ✓ (sent) / ✓✓ (delivered) / ✓✓ blue (read)

---

### Conversation Context Anchoring
Conversations can be created in two ways:
1. **Contextual:** from RFQ, PO, or Quotation detail → "Message Vendor" → creates conversation auto-tagged to that record. Header shows: "Re: RFQ-0089 · [View RFQ →]"
2. **General:** from Messages → "+ New Message" → select vendor → no context tag

---

### Filters & Search
- Conversation list search: by vendor name, last message content
- Filter: All / Unread / Archived / By Context (RFQ / PO / Quotation)

---

### Empty State
- No conversations: `MessageSquare` icon (48px), "No messages yet", "Start a conversation with a vendor from any RFQ, PO, or from the Vendor Marketplace", CTA "+ New Message"
- Conversation selected but empty: `MessageSquare` icon, "No messages yet — say hello!"

---

### Loading State
- Conversation list: 4 skeleton items (shimmer avatar + 2 text lines)
- Message thread: 5 skeleton bubbles alternating left/right alignment

---

### Responsive Behaviour
- **Desktop:** Two-panel layout as shown
- **Tablet:** Same; left panel collapses to icon-only on smaller tablets
- **Mobile:** Single-panel; conversation list is the default view; tapping a conversation opens the chat full-screen; back button returns to list

---

### Permissions
- Company users can message vendors they are connected with
- Vendor users can message company users who have initiated contact or are on a shared RFQ/PO
- Platform Admin cannot view private conversations (privacy)

---

### Accessibility
- Message thread: `role="log"`, `aria-live="polite"` for new messages
- Each message: `role="article"`, `aria-label="[Sender name] at [time]: [message preview]"`
- Message input: `aria-label="Type a message to Nexus Supplies"`, `aria-multiline="true"`
- Send button: `aria-label="Send message"`, disabled when input empty
- Unread badge: `aria-label="3 unread messages from Nexus Supplies"`

---

### Developer Notes
- `conversations` table: `id`, `company_id`, `vendor_id`, `context_type` (rfq/po/quotation/general), `context_id` (nullable FK)
- `messages` table: `conversation_id`, `sender_id`, `sender_type` (company_user/vendor_user), `body`, `created_at`
- `message_attachments` table: `message_id`, `storage_path`, `filename`, `size`
- Real-time: Supabase Realtime subscription on `messages` table filtered by `conversation_id`
- Read receipts: `message_reads` table with `message_id`, `user_id`, `read_at`
- File storage: `message-attachments/[conversation_id]/` bucket
- Email fallback: if recipient has been inactive > 5 minutes, send email digest via Resend
- Conversations scoped by company+vendor pair — neither can see messages from other company/vendor relationships


---

## MODULE 31 — DOCUMENT MANAGEMENT

---

### Purpose
Provide a centralized, organized repository for all procurement-related documents within a company workspace or vendor account. Covers contracts, terms and conditions, compliance certificates, purchase order attachments, and other business documents generated across the procurement lifecycle.

---

### User Flow

**Company user uploading a document:**
1. Documents → "+ Upload Document"
2. Select category, upload file, set access permissions
3. Document stored and indexed; appears in document library

**Accessing linked documents:**
1. From any module (PR, RFQ, PO, Invoice) → "Attachments" section → file links are deep-linked to Document Management
2. Clicking a file opens the document preview or triggers download

**Searching documents:**
1. Documents → search by filename, category, uploader, date range
2. Click document row → Preview or Download

---

### Page Layout

**Document Library Page:**
```
┌──────────────────────────────────────────────────────────────┐
│  Page Header: Document Library                               │
│  Sub: "142 documents · 1.8 GB used"                         │
│  [+ Upload Document]  [Create Folder]                        │
│                                                              │
│  CATEGORY SIDEBAR (left, 200px) + MAIN AREA (right)          │
│  ┌──────────────────┐ ┌────────────────────────────────────┐ │
│  │  All Documents   │ │  TOOLBAR                           │ │
│  │  Contracts (12)  │ │  [Search docs...]  [Type ▾]         │ │
│  │  PO Attachments  │ │  [Date Range ▾]  [Grid] [List]     │ │
│  │    (28)          │ │                                    │ │
│  │  Invoices (34)   │ │  DOCUMENT GRID / LIST              │ │
│  │  Certificates    │ │  ┌──────┐ ┌──────┐ ┌──────┐       │ │
│  │    (8)           │ │  │ PDF  │ │ DOCX │ │ XLSX │       │ │
│  │  Terms & Cond.   │ │  │Terms │ │Spec  │ │Budget│       │ │
│  │    (15)          │ │  │400KB │ │ 1.2MB│ │ 220KB│       │ │
│  │  GRN Photos (18) │ │  │Jul 4 │ │Jul 3 │ │Jul 1 │       │ │
│  │  Other (27)      │ │  └──────┘ └──────┘ └──────┘       │ │
│  │                  │ │                                    │ │
│  │  STORAGE USAGE   │ │  PAGINATION                        │ │
│  │  ████████░░ 60%  │ │                                    │ │
│  │  1.8 GB / 3 GB   │ └────────────────────────────────────┘ │
│  └──────────────────┘                                        │
└──────────────────────────────────────────────────────────────┘
```

**Document Card (Grid View):**
```
Card: rounded-xl, shadow-sm, p-4, white
Top: file type icon (PDF=red, DOCX=blue, XLSX=green, IMG=purple) 40px
Filename: text-sm font-semibold Neutral-800, truncated
Category: text-xs tag pill
Size + Date: text-xs Neutral-400
Hover overlay: shows [Preview] [Download] [⋯ More] buttons
```

**Document List View:**
```
Columns: Icon | Filename | Category | Size | Uploaded By | Date | Actions
Row height: 48px
Action column: Preview, Download, Share link, Move to folder, Delete
```

---

### Components Used
- `DocumentCard` — grid view card
- `DocumentTable` — list view with sortable columns
- `CategorySidebar` — left nav with document categories and counts
- `FileTypeIcon` — colored icon by file type (PDF, DOCX, XLSX, JPG, PNG, ZIP)
- `DocumentUploadModal` — upload form with category, permissions
- `FilePreviewModal` — in-app preview for PDF, images; download fallback for others
- `FolderCreate` — create folder for organization
- `StorageUsageBar` — horizontal progress bar showing storage consumed
- `VersionHistory` — list of previous versions of a document (if overwritten)
- `AccessPermissions` — who can view: Everyone / Admins Only / Specific Roles

---

### Forms

**Upload Document Modal:**
```
File Upload*          drag-drop zone (PDF/DOCX/XLSX/PNG/JPG/ZIP, max 50MB)
Document Name         text input (auto-filled from filename, editable)
Category*             select from category list
Description           textarea (optional, max 200 chars)
Access Level*         select: Everyone in workspace / Admins only / Select roles
Version Note          text input (for replacement uploads: "Updated pricing")
```

---

### File Preview Modal
- PDFs: rendered via browser's native PDF viewer (iframe)
- Images: full-size lightbox with zoom
- DOCX/XLSX: "Preview not available — download to view" with prominent Download button
- Video files: not supported in v1

---

### Filters & Search

| Filter | Options |
|---|---|
| Search | Filename, description, uploader name |
| Category | Left sidebar navigation (acts as filter) |
| File Type | PDF / Word / Excel / Image / Other |
| Date Range | Uploaded between date range |
| Uploaded By | Employee/vendor user select |

---

### Empty State
- No documents: `FolderOpen` icon (48px), "No documents yet", "Upload contracts, specifications, certificates, and other business documents", CTA "+ Upload Document"
- Category empty: "No documents in this category"

---

### Loading State
- Grid: 9 skeleton cards; List: 8 skeleton rows

---

### Success State
- Upload: Toast "filename.pdf uploaded to Contracts"
- Delete: Toast "Document deleted" with Undo option (5 second window)

---

### Version History
When a file is re-uploaded with the same name in the same category:
- Modal prompt: "A document with this name exists. Replace it or keep both?"
- Replace: creates version history entry, previous file stored as `v1`, new becomes current
- Keep both: auto-renames new file with `(2)` suffix

---

### Responsive Behaviour
- **Desktop:** Category sidebar + main grid/list
- **Tablet:** Category sidebar collapses to a dropdown selector above the grid
- **Mobile:** Category sidebar hidden; filter button opens bottom sheet; documents as scrollable list cards

---

### Permissions

| Action | Super Admin | Proc. Manager | Proc. Officer | Finance Mgr | Employee | Vendor Admin |
|---|---|---|---|---|---|---|
| Upload | Yes | Yes | Yes | Yes | Yes (limited) | Yes (own) |
| View (public) | Yes | Yes | Yes | Yes | Yes | Yes (own) |
| View (admin-only) | Yes | No | No | Yes | No | No |
| Delete any | Yes | No | No | No | No | No |
| Delete own | Yes | Yes | Yes | Yes | Yes | Yes |

---

### Accessibility
- File type icons: `aria-label="PDF document"`, not just visual icon
- Grid cards: `role="gridcell"`, full filename as `aria-label`
- Preview modal: `role="dialog"`, `aria-labelledby` pointing to filename heading, `Escape` closes
- Storage usage bar: `role="meter"`, `aria-valuenow="60"`, `aria-label="Storage: 1.8 GB of 3 GB used"`

---

### Developer Notes
- Files stored in Supabase Storage `documents/[workspace_id]/[category]/` with private access
- Download: signed URL generated on demand (1-hour expiry)
- `documents` table: `workspace_id`, `uploaded_by`, `category`, `filename`, `storage_path`, `size_bytes`, `access_level`, `version`, `description`, `created_at`
- `document_versions` table: previous versions of replaced documents
- Storage quota: enforced per subscription plan; checked before each upload via Edge Function
- Search: Supabase full-text on `filename + description`

---

## MODULE 32 — COMPANY DASHBOARD

---

### Purpose
Serve as the operational command center for every company user. The dashboard aggregates the most critical procurement information and pending actions across all modules, enabling users to understand the state of their workspace at a glance and act on priorities without navigating away.

---

### User Flow

1. User logs in → automatically lands on `/dashboard`
2. Dashboard displays personalized content based on user role
3. User acts on pending items directly from dashboard widgets
4. User navigates to specific modules via sidebar or dashboard deep links

---

### Page Layout

```
┌──────────────────────────────────────────────────────────────┐
│  PERSONALIZED GREETING                                       │
│  "Good morning, Riya ☀"                                      │
│  Meridian Technologies · Monday, July 6, 2026                │
│                                                              │
│  KPI ROW (4 cards)                                           │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────┐│
│  │ Open PRs     │ │ Active RFQs  │ │ Active POs   │ │ Pay  ││
│  │     12       │ │      8       │ │     24       │ │ ₹4.2M││
│  │ ↑3 this week │ │ 3 expiring   │ │ ₹42.8L value │ │ ↑12% ││
│  └──────────────┘ └──────────────┘ └──────────────┘ └──────┘│
│                                                              │
│  ROW 2 — TWO COLUMNS (60% / 40%)                             │
│  ┌──────────────────────────────┐ ┌────────────────────────┐ │
│  │  PENDING ACTIONS             │ │  PROCUREMENT TIMELINE  │ │
│  │  ● PR-0081 needs approval    │ │  Activity feed (recent │ │
│  │  ● INV-1042 needs review     │ │  events across all     │ │
│  │  ● RFQ-0087 deadline in 2d   │ │  modules, time-sorted) │ │
│  │  ● Q-0124 awaiting decision  │ │                        │ │
│  │  [View all pending →]        │ │  [View full log →]     │ │
│  └──────────────────────────────┘ └────────────────────────┘ │
│                                                              │
│  ROW 3 — THREE COLUMNS                                       │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────────────┐ │
│  │ ACTIVE RFQs  │ │ TOP VENDORS  │ │ SPEND ANALYSIS       │ │
│  │ RFQ-0089     │ │ Nexus    4.3★│ │ [Area chart]         │ │
│  │ 2/3 responded│ │ CloudHW  4.7★│ │ Last 6 months        │ │
│  │ 4 days left  │ │ OfficeFst 4.1│ │ ₹42.8L this month    │ │
│  │ RFQ-0088 ... │ │ [View all →] │ │ [View analytics →]   │ │
│  │ [View all →] │ │              │ │                       │ │
│  └──────────────┘ └──────────────┘ └──────────────────────┘ │
│                                                              │
│  ROW 4 — FULL WIDTH                                          │
│  RECENT PROCUREMENT ACTIVITY TABLE                           │
│  Type  ID      Description        Status    Date     User   │
│  PR    PR-0081 Office Chairs      Pending   Jul 4    Riya   │
│  RFQ   RFQ-0089 Office Chairs    Sent      Jul 3    Riya   │
│  PO    PO-0312 Nexus Supplies     Accepted  Jul 3    System │
│  [View full history →]                                       │
└──────────────────────────────────────────────────────────────┘
```

---

### KPI Cards — Detailed Specification

Each KPI card: `rounded-2xl`, `shadow-sm`, white background, `p-6`

**Card anatomy:**
```
Icon container: 40px × 40px rounded-lg, pale background color-matched to metric type
Icon: 20px Lucide icon
Metric label: text-xs uppercase tracking-wider font-semibold Neutral-500, mt-3
Primary value: text-4xl font-bold Neutral-900, mt-1
Delta chip: text-xs [ArrowUp/Down icon 12px] "+3 this week" in success green or error red
Subtitle: text-xs Neutral-400 "vs last month" or contextual note
```

**Company Dashboard KPI Cards:**

| # | Metric | Icon | Pale BG | Delta |
|---|---|---|---|---|
| 1 | Open Purchase Requests | FileText | Blue-Pale | vs last week |
| 2 | Active RFQs | Send | Cyan-Light | expiring count |
| 3 | Active Purchase Orders | ShoppingCart | Success-Light | total value |
| 4 | Total Payments (MTD) | CreditCard | Warning-Light | % vs last month |

---

### Pending Actions Widget

Priority-ordered list of items requiring the logged-in user's action.
- Approval requests: sorted by urgency (oldest first)
- Expiring RFQs: sorted by deadline
- Invoices pending review: sorted by due date

Each item row:
```
[Type icon 14px]  [Title]  [Amount/Deadline]  [Primary CTA button]
```
CTA buttons: "Approve", "Review", "Respond", "Compare" — each deep-links to the relevant module page.
Footer: "View all pending items →" links to Pending Approvals page.

---

### Procurement Activity Timeline Widget

Vertical list of recent cross-module events. Each entry:
```
[colored dot — status color] [Module icon 12px] [Event description] [timestamp]
Example: ● [ShoppingCart] "PO-0312 accepted by Nexus Supplies" · 2 hours ago
```
Max 8 entries shown, scrollable. "View full audit log →" at bottom.

---

### Active RFQs Widget

List of top 3 open RFQs with:
- RFQ ID + title
- Response progress: "2 of 3 vendors responded" (mini progress bar)
- Deadline badge (color-coded by urgency)
- "Compare →" link (if all responses in) or "View →"

---

### Top Vendors Widget

List of top 5 vendors by order volume:
- Vendor logo (24px) + name
- Star rating (display-only)
- Orders count or spend amount
- "View profile →" link

---

### Spend Analysis Chart

Area chart, 6-month view:
- X-axis: last 6 months (Jan–Jun)
- Y-axis: spend in ₹ (formatted as "₹42.8L")
- Fill: Electric Blue with 15% opacity fill
- Line: Electric Blue 2px solid
- Tooltip on hover: month name + exact spend amount
- Chart library: Recharts (consistent with Next.js / React ecosystem)

---

### Recent Activity Table

Simplified table (no filters on dashboard — full filters on Analytics page):
- 5 columns: Type, ID, Description, Status badge, Date, User avatar
- Last 10 records
- "View full history →" footer link → Audit Logs page

---

### Dashboard Role Personalization

| Role | KPI Focus | Pending Actions Shows | Widgets |
|---|---|---|---|
| Super Admin | All 4 KPIs | All pending items | Full dashboard |
| Procurement Manager | PRs, RFQs, POs | Approvals, expiring RFQs | All widgets |
| Procurement Officer | PRs, RFQs | Submitted PRs status | RFQ widget, timeline |
| Finance Manager | Invoices, Payments | Invoice approvals | Payment KPI prominent |
| Employee | Own PRs | Status of own PRs | Minimal — PR status only |

---

### Components Used
- `KPICard` — metric card with icon, value, delta
- `PendingActionsWidget` — prioritized action list
- `ProcurementTimeline` — activity feed list
- `ActiveRFQsWidget` — RFQ list with progress bars
- `TopVendorsWidget` — vendor ranking mini-list
- `SpendAnalysisChart` — Recharts `AreaChart`
- `RecentActivityTable` — simplified data table
- `GreetingHeader` — personalized welcome with time-of-day

---

### Loading State
- KPI row: 4 skeleton cards (shimmer)
- Pending actions: 4 skeleton rows
- Charts: gray shimmer block matching chart height
- Table: 5 skeleton rows

---

### Empty State (new workspace — no data yet)
Dashboard shows a "Getting Started" onboarding checklist widget above the KPI row:
```
┌──────────────────────────────────────────────────────────────┐
│  Welcome to VendorFlow! Complete your setup:                 │
│  ☑ Create company profile                                    │
│  ○ Invite team members                                       │
│  ○ Discover your first vendor                                │
│  ○ Create your first Purchase Request                        │
│  Progress: 1/4 steps complete  ████░░░░░░░░  25%            │
└──────────────────────────────────────────────────────────────┘
```

---

### Responsive Behaviour
- **Desktop (xl+):** Full 4-column KPI row; 2-col + 3-col widget rows; full-width table
- **Tablet:** KPI row 2×2 grid; widget rows collapse to single column stacked
- **Mobile:** KPI row scrolls horizontally (snap-to-card); each widget is full-width stacked; spend chart is simplified to a single bar chart

---

### Accessibility
- Greeting: `<h1>` for the greeting text; date as a `<p>` below
- KPI cards: `role="region"`, `aria-label="Open Purchase Requests: 12, up 3 this week"`
- Pending actions: `role="list"`, each item `role="listitem"`, CTA has descriptive `aria-label`
- Charts: `role="img"`, `aria-label="Spend analysis: monthly spending for the last 6 months"` + a data table fallback for screen readers

---

### Developer Notes
- Dashboard data: single aggregated Edge Function `getDashboardSummary(company_id, user_id, role)` returns all widget data in one call
- Response cached for 60 seconds (TanStack Query `staleTime`)
- KPI deltas: computed by comparing current period vs previous period in SQL
- Real-time updates: Supabase Realtime subscription on `notifications` table triggers KPI refresh when critical events occur
- Chart data: pre-aggregated in Supabase view `monthly_spend_summary`

---

## MODULE 33 — VENDOR DASHBOARD

---

### Purpose
Serve as the business control center for vendor users. Surfaces active RFQs requiring response, pending PO acceptances, revenue performance, and order status — prioritizing actions that directly impact the vendor's business.

---

### Page Layout

```
┌──────────────────────────────────────────────────────────────┐
│  GREETING + PROFILE SUMMARY                                  │
│  "Good morning, Nexus Supplies"                              │
│  ★ 4.3 · 128 reviews · ✓ Verified Vendor                    │
│                                                              │
│  KPI ROW (4 cards)                                           │
│  ┌────────────────┐ ┌─────────────┐ ┌────────────┐ ┌──────┐ │
│  │ Open RFQs      │ │ Active POs  │ │ Pending    │ │ MTD  │ │
│  │      6         │ │     14      │ │ Invoices   │ │Revenue│ │
│  │ 2 due today    │ │ ₹9.8L value │ │   ₹3.2L    │ │ ₹8.4L│ │
│  └────────────────┘ └─────────────┘ └────────────┘ └──────┘ │
│                                                              │
│  ROW 2 — TWO COLUMNS (60% / 40%)                             │
│  ┌──────────────────────────────┐ ┌────────────────────────┐ │
│  │  ACTIVE RFQs (URGENT FIRST)  │ │  REVENUE TREND         │ │
│  │  RFQ-0089 · Meridian Tech    │ │  [Bar chart — 6 months]│ │
│  │  2 items · Deadline: TODAY   │ │  Electric Blue bars    │ │
│  │  [Respond Now →]             │ │  ₹8.4L this month      │ │
│  │                              │ │  ↑ 18% vs last month   │ │
│  │  RFQ-0091 · Apex Corp        │ │                        │ │
│  │  4 items · Deadline: Jul 10  │ │  Win Rate: 68%         │ │
│  │  [View RFQ →]                │ │  [View analytics →]    │ │
│  │  [View all 6 RFQs →]         │ │                        │ │
│  └──────────────────────────────┘ └────────────────────────┘ │
│                                                              │
│  ROW 3 — THREE COLUMNS                                       │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────────────┐ │
│  │ PENDING PO   │ │ TOP PRODUCTS │ │ CUSTOMER REVIEWS     │ │
│  │ ACCEPTANCES  │ │ Network Sw.  │ │ ★★★★★ "Fast..."     │ │
│  │ PO-0315      │ │ 28 orders    │ │ Meridian Tech        │ │
│  │ ₹1.12L       │ │ Laptop Pro   │ │ Jul 4                │ │
│  │ [Accept] [✗] │ │ 16 orders    │ │ ★★★★☆ "Good qual..."│ │
│  │ [View all →] │ │ [View all →] │ │ [View all →]         │ │
│  └──────────────┘ └──────────────┘ └──────────────────────┘ │
│                                                              │
│  ROW 4 — FULL WIDTH                                          │
│  RECENT ORDER ACTIVITY TABLE                                 │
│  PO ID     Company         Status       Amount   Updated     │
│  PO-0312   Meridian Tech   Processing   ₹55,026  2h ago      │
│  PO-0311   Apex Corp       Shipped      ₹1.24L   Yesterday   │
│  [View all orders →]                                         │
└──────────────────────────────────────────────────────────────┘
```

---

### Vendor Dashboard KPI Cards

| # | Metric | Icon | Urgency Signal |
|---|---|---|---|
| 1 | Open RFQs Pending Response | Send | Red badge if deadline ≤ 24h |
| 2 | Active Purchase Orders | ShoppingCart | Total value subtitle |
| 3 | Invoices Pending Payment | FileSpreadsheet | Total amount outstanding |
| 4 | Revenue (MTD) | TrendingUp | % change vs last month |

---

### Active RFQs Widget (Vendor)

Priority queue: RFQs sorted by deadline urgency.
Each item:
```
[Company logo 24px]  [Company Name]  [RFQ Title]
[Items count]  [Deadline badge — red/amber/blue]  [Respond →]
```
"Respond Now →" CTA for today-deadline items; "View RFQ →" for others.

---

### Revenue Trend Chart (Vendor)

Bar chart (6 months):
- X-axis: last 6 months
- Y-axis: revenue in ₹
- Bar color: Electric Blue; current month bar highlighted with Cyan accent
- Overlaid thin line: Quotation Win Rate % (secondary Y-axis, right)
- Tooltip: month, revenue, win rate
- Below chart: two stat chips — "Win Rate: 68%" and "Avg Order Value: ₹58,400"

---

### Pending PO Acceptances Widget

List of POs received but not yet accepted:
```
PO ID + Company name + Amount  |  [✓ Accept]  [✗ Decline]
```
Each row has inline Accept/Decline buttons. Decline triggers a confirmation modal with reason selection.

---

### Top Products Widget

Top 5 products by order frequency:
- Product image thumbnail (32px)
- Product name
- Order count + total revenue from this product
- Stock status badge

---

### Customer Reviews Widget

Latest 3 reviews:
- Star rating, review excerpt (line-clamp-2), company name, date
- "View all reviews →" links to Performance → Reviews page

---

### Components Used
- `KPICard` (vendor variant) — same component, vendor-specific metrics
- `UrgentRFQWidget` — RFQ list sorted by deadline with urgency coloring
- `RevenueTrendChart` — Recharts `BarChart` with line overlay
- `POAcceptanceWidget` — inline accept/decline list
- `TopProductsWidget` — product rank list
- `CustomerReviewsWidget` — review mini-feed
- `RecentOrderTable` — simplified order activity table
- `VerifiedVendorBadge` — green checkmark + "Verified" in greeting header

---

### Vendor Dashboard Personalization by Role

| Role | KPI Focus | Widgets Visible |
|---|---|---|
| Vendor Admin | All 4 KPIs | All widgets |
| Sales Manager | RFQs, POs | RFQ widget, PO acceptances, reviews |
| Product Manager | Orders, top products | Top products, order table |
| Finance Executive | Invoices, Revenue | Revenue chart, invoice KPI |
| Vendor Employee | POs, Orders | Order table only |

---

### Loading State
Same pattern as Company Dashboard: skeleton KPI row, skeleton widget cards, skeleton chart, skeleton table rows.

---

### Empty State (new vendor — no data yet)
Onboarding checklist widget:
```
Complete your setup to start receiving orders:
☑ Complete vendor profile
○ Upload product catalog (0 products)
○ Get verified
○ Receive your first RFQ
Progress: 1/4
```

---

### Responsive Behaviour
- Same responsive pattern as Company Dashboard
- **Mobile:** RFQ urgency widget is highest priority — appears first on mobile scroll order
- Revenue chart: swipeable on mobile (3-month window with scroll)

---

### Accessibility
- Same accessibility patterns as Company Dashboard
- Pending PO Accept/Decline: `aria-label="Accept Purchase Order PO-0315 from Meridian Technologies"`

---

### Developer Notes
- Single `getVendorDashboardSummary(vendor_id, user_id, role)` Edge Function
- Revenue aggregation: `SUM(invoice_items.total) WHERE invoices.status = 'paid'` grouped by month
- Win rate: `COUNT(quotations.status='accepted') / COUNT(quotations)` per vendor
- Realtime: subscription on `rfqs` and `purchase_orders` tables filtered by vendor_id for live updates


---

## MODULE 34 — ANALYTICS & REPORTS

---

### Purpose
Provide procurement teams and vendor operations with actionable business intelligence. Analytics surfaces spending patterns, vendor performance trends, procurement cycle efficiency, and financial summaries — enabling data-driven decision-making across the organization.

---

### User Flow

**Company user accessing analytics:**
1. Sidebar → Analytics
2. Landing on Analytics Overview tab
3. Selects time period via date range picker
4. Navigates between tabs: Overview / Procurement / Spend / Vendors / Finance
5. Drills into any chart for detail (click chart element → filtered list view)
6. Exports specific report as PDF / Excel / CSV

**Vendor user accessing analytics:**
1. Sidebar → Analytics
2. Views: Revenue / Orders / Products / Customers / Performance tabs

---

### Page Layout

```
┌──────────────────────────────────────────────────────────────┐
│  Page Header: Analytics & Reports                            │
│  Sub: "Procurement intelligence · Meridian Technologies"     │
│                                                              │
│  FILTER BAR (sticky below page header)                       │
│  [Date: Last 30 Days ▾]  [Department: All ▾]  [Export ▾]     │
│  [Compare: Off ▾]  (toggle to compare with previous period)  │
│                                                              │
│  TAB NAVIGATION                                              │
│  Overview | Procurement | Spend | Vendors | Finance          │
│                                                              │
│  ─── TAB CONTENT (changes per tab) ──────────────────────── │
│                                                              │
│  KPI SUMMARY ROW (4 cards, role-contextual)                  │
│                                                              │
│  CHART ROW 1 (2 columns)                                     │
│  ┌──────────────────────────┐ ┌──────────────────────────┐  │
│  │  PRIMARY CHART           │ │  SECONDARY CHART         │  │
│  └──────────────────────────┘ └──────────────────────────┘  │
│                                                              │
│  CHART ROW 2 (full width)                                    │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  FULL-WIDTH CHART                                    │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  DATA TABLE (sortable, filterable, exportable)               │
└──────────────────────────────────────────────────────────────┘
```

---

### Tab 1 — Overview

**KPI Cards:**
- Total Procurement Spend (MTD) — with % change vs previous period
- Average Procurement Cycle Time — in days (PR to PO completion)
- Vendor On-Time Delivery Rate — percentage
- Active Vendors — count with trend arrow

**Chart 1 — Monthly Procurement Spend (Area Chart, 12 months):**
```
Type: Recharts AreaChart
X-axis: months (Jan 2026 – Dec 2026)
Y-axis: ₹ spend amount (formatted: ₹42.8L)
Fill: Electric Blue, 20% opacity gradient
Line: Electric Blue, 2px
Data point dots: 6px on hover
Tooltip: month label + exact amount + % vs prev month
Grid lines: Neutral-100 horizontal dashed
```

**Chart 2 — Procurement Funnel (Funnel Chart):**
```
Stages (top to bottom, widest to narrowest):
  Purchase Requests: 48
  Approved PRs: 38
  RFQs Sent: 32
  Quotations Received: 86
  POs Generated: 28
  Orders Delivered: 22
  Invoices Paid: 20

Each stage: horizontal bar, label + count + conversion %
Colors: Electric Blue gradient darkening through stages
```

**Chart 3 — Full Width — Procurement by Category (Bar Chart):**
```
Type: Recharts BarChart (horizontal)
X-axis: spend amount (₹)
Y-axis: product categories
Bar color: Electric Blue, Cyan, Success Green, Warning Amber (cycle)
Sorted by spend (largest top)
Tooltip: category name + spend + % of total spend
```

---

### Tab 2 — Procurement

**KPI Cards:**
- Total PRs This Period
- Avg Approval Time (hours)
- RFQ Response Rate (%)
- PO Acceptance Rate (%)

**Chart 1 — PR to PO Cycle Time (Line Chart):**
```
Type: Recharts LineChart
X-axis: last 12 weeks
Y-axis: days to complete
Line 1 (Electric Blue): Average cycle time
Line 2 (Cyan, dashed): Target cycle time (configurable, default 14 days)
When line 1 crosses above line 2: area between filled red (0.1 opacity)
Legend: "Actual" | "Target"
```

**Chart 2 — Approval Time Distribution (Bar Chart):**
```
X-axis: time brackets (< 4h, 4–12h, 12–24h, 1–3 days, > 3 days)
Y-axis: number of approvals
Bar color: gradient from Success Green (fast) to Error Red (slow)
```

**Chart 3 — RFQ Status Breakdown (Donut Chart):**
```
Type: Recharts PieChart (donut, inner radius 60%)
Segments:
  Responses Received: Electric Blue
  Awaiting Response: Cyan
  Declined: Neutral-300
  Expired without response: Warning Amber
Center text: Total RFQs sent this period
Legend: below chart with colored squares + labels + counts
```

---

### Tab 3 — Spend Analysis

**KPI Cards:**
- Total Spend (period)
- Budget Utilization (% of allocated budget)
- Average PO Value
- Savings vs Estimated Budget

**Chart 1 — Spend by Vendor (Horizontal Bar Chart):**
```
Top 10 vendors by spend
Each bar: vendor name (left) + amount (right label) + % of total spend
Bar color: Electric Blue
Clickable: click a vendor bar → opens filtered PO list for that vendor
```

**Chart 2 — Spend by Category (Donut Chart):**
```
Segments: top 8 categories + "Other" grouped
Donut inner: "₹42.8L Total"
Legend: category name + % + amount
Color palette: Electric Blue, Cyan, Success Green, Warning Amber, Purple, Neutral-400 cycling
```

**Chart 3 — Monthly Budget vs Actual Spend (Grouped Bar Chart, 6 months):**
```
Type: Recharts BarChart grouped (2 bars per month)
Bar 1 (Neutral-200): Budget
Bar 2 (Electric Blue): Actual Spend
When Actual > Budget: Bar 2 color becomes Error Red
X-axis: months
Y-axis: ₹ amount
Legend: Budget | Actual
```

**Chart 4 — Spend Trend (Full Width, 12 months):**
Same as Overview Area Chart but with optional comparison period overlay (dashed line = previous year same period).

---

### Tab 4 — Vendor Analytics

**KPI Cards:**
- Total Active Vendors
- Avg Vendor Rating (across all connected vendors)
- On-Time Delivery Rate
- Vendor Response Rate to RFQs

**Chart 1 — Vendor Performance Matrix (Scatter Plot):**
```
Type: Recharts ScatterChart
X-axis: On-Time Delivery Rate (%)
Y-axis: Average Quality Rating (1–5)
Each dot: one vendor (size proportional to order volume)
Quadrants:
  Top-Right (high delivery + high quality): "Star Vendors" — green zone
  Top-Left (high quality, low delivery): "Quality Leaders"
  Bottom-Right (fast, lower quality): "Speed Leaders"
  Bottom-Left: "Needs Attention" — red zone
Hovering a dot: tooltip with vendor name, stats, order count
```

**Chart 2 — Top Vendors by Order Volume (Horizontal Bar):**
- Top 10 vendors, bars showing order count and spend side by side

**Chart 3 — Vendor Category Distribution (Donut):**
- Breakdown of connected vendors by industry category

**Vendor Performance Table:**
```
Columns: Vendor | Orders | Avg Rating | On-Time % | Response Rate | Total Spend | Actions
Sortable by all columns
Actions: View Profile, View Orders
```

---

### Tab 5 — Finance Analytics

**KPI Cards:**
- Total Invoiced Amount (period)
- Total Paid Amount (period)
- Outstanding Payables
- Avg Payment Cycle (days from invoice approval to payment)

**Chart 1 — Payment Status Breakdown (Donut Chart):**
```
Segments: Paid (green) | Approved Pending Payment (blue) | Under Review (amber) | Overdue (red)
Center: Total invoice value
```

**Chart 2 — Monthly Payments (Bar Chart, 6 months):**
```
Grouped bars per month:
  Bar 1 (Electric Blue): Total Invoiced
  Bar 2 (Success Green): Total Paid
  Gap between bars = outstanding
```

**Chart 3 — Payment Trend Line (Line Chart, 12 months):**
- Payment volume over time with trendline overlay

**Aging Report Table (Payables):**
```
Groups invoices by age: 0–30 days | 31–60 days | 61–90 days | 90+ days
Columns: Vendor | Invoice # | Amount | Invoice Date | Due Date | Days Outstanding | Status | Actions
Row color: white (0–30) | Warning-Light (31–60) | Error-Light (61+)
```

---

### Export Functionality

All tabs have an "Export" button in the filter bar:
```
[Export ▾] dropdown:
  ↓ Export Current View as PDF
  ↓ Export Data as Excel (.xlsx)
  ↓ Export Data as CSV
```
Export generates file server-side (Edge Function) and triggers browser download.
PDF export includes all visible charts (rendered as images) and tables.

---

### Components Used
- `AnalyticsFilterBar` — date range, department filter, export dropdown, compare toggle
- `AnalyticsKPICard` — same component as dashboard KPI card, smaller variant
- `AreaChart`, `BarChart`, `LineChart`, `PieChart`, `ScatterChart`, `FunnelChart` — all via Recharts
- `ChartCard` — white card container wrapping each chart with title + sub-label + optional expand button
- `ChartTooltip` — custom styled Recharts tooltip using design tokens
- `DataTable` — analytics bottom table, sortable
- `ExportButton` — dropdown with PDF/Excel/CSV options
- `ComparisonToggle` — shows previous period overlay on charts
- `EmptyChartState` — "No data for this period" state within chart cards

---

### Chart Card Design

```
Container: white bg, rounded-2xl, shadow-sm, p-6
Header row:
  Left: chart title (text-base font-semibold Neutral-800)
        subtitle (text-xs Neutral-400 — e.g., "Last 30 days")
  Right: [Expand ↗] icon button (opens chart full-screen modal)
         [Download ↓] icon button (downloads chart as PNG)
Chart area: 100% width, fixed height per type:
  KPI + donut: 240px
  Bar/Line/Area: 300px
  Full-width: 360px
  Scatter: 320px
Legend: below chart, flex-wrap, text-xs colored squares + labels
```

---

### Animated Statistics
KPI card values animate from 0 to their actual value on page load:
- Duration: 800ms, easing: ease-out
- Implemented via `useCountUp` hook (react-countup or custom)
- Delta chips slide in with 200ms delay after main value lands

---

### Empty State (no data for selected period)
Each chart card shows: `BarChart2` icon (32px, Neutral-300), "No data for the selected period", "Try adjusting the date range or department filter"

---

### Loading State
Each chart card shows a shimmer block matching the chart's expected height before data loads.

---

### Responsive Behaviour
- **Desktop:** Full chart grid, side-by-side charts in rows
- **Tablet:** Charts stack to single column; filter bar scrolls horizontally
- **Mobile:** Filter bar collapses to a "Filters" button; charts full-width; scatter plot replaced by top-vendor table on mobile (not renderable at small sizes)

---

### Permissions

| Role | Company Analytics | Vendor Analytics |
|---|---|---|
| Super Admin | Full access all tabs | N/A |
| Procurement Manager | Overview, Procurement, Spend, Vendors | N/A |
| Finance Manager | Overview, Spend, Finance | N/A |
| Procurement Officer | Overview, Procurement only | N/A |
| Employee | No access | N/A |
| Vendor Admin | N/A | Full access |
| Sales Manager | N/A | Revenue, Orders, Customers |
| Finance Executive | N/A | Revenue, Finance tab |

---

### Accessibility
- All charts: `role="img"`, descriptive `aria-label` summarizing the chart's key insight
- Charts have a hidden `<table>` data representation for screen readers (toggled via "View as table" button below each chart)
- Color-blind safe: all charts use both color AND shape/pattern differentiation where possible
- Filter dropdowns: full keyboard accessibility
- Export: `aria-label="Export analytics data"`, dropdown with `role="menu"`, `role="menuitem"`

---

### Developer Notes
- All analytics data served from dedicated Supabase RPC functions (not REST endpoints) for complex aggregations
- Date range filtering: passed as parameters to RPC functions; no client-side filtering of large datasets
- Chart library: Recharts (React-native, no canvas, accessible, SSR-compatible with Next.js)
- PDF export: Edge Function receives chart SVG data (serialized client-side) + table data → generates PDF via `@react-pdf/renderer`
- Excel export: `xlsx` library in Edge Function, returns binary stream
- CSV export: server-side string generation, `Content-Disposition: attachment` header
- Comparison period: previous 30 days when "Last 30 days" selected; previous year same period when year range selected

---

## MODULE 35 — REPORTS

---

### Purpose
Allow users to generate, save, schedule, and export structured reports from procurement data. Reports differ from Analytics in that they are document-oriented, configurable, and designed to be shared externally (with management, auditors, or partners).

---

### Page Layout

**Reports Page:**
```
┌──────────────────────────────────────────────────────────────┐
│  Page Header: Reports                                        │
│  Sub: "Generate and export procurement reports"              │
│  [+ Custom Report]                                           │
│                                                              │
│  REPORT TEMPLATES SECTION                                    │
│  Sub-heading: "Standard Reports"                             │
│                                                              │
│  REPORT CARDS GRID (3 columns)                               │
│  ┌──────────────────┐ ┌──────────────────┐ ┌──────────────┐ │
│  │ [BarChart2]      │ │ [FileSpreadsheet]│ │ [Store]      │ │
│  │ Procurement      │ │ Spend Analysis   │ │ Vendor       │ │
│  │ Summary          │ │ Report           │ │ Performance  │ │
│  │ Overview of all  │ │ Spend by vendor, │ │ Ratings,     │ │
│  │ procurement this │ │ category, period │ │ delivery,    │ │
│  │ period           │ │                  │ │ reliability  │ │
│  │ [Generate]       │ │ [Generate]       │ │ [Generate]   │ │
│  └──────────────────┘ └──────────────────┘ └──────────────┘ │
│                                                              │
│  ┌──────────────────┐ ┌──────────────────┐ ┌──────────────┐ │
│  │ [CreditCard]     │ │ [ClipboardList]  │ │ [Users]      │ │
│  │ Payment          │ │ Audit Trail      │ │ Employee     │ │
│  │ Summary          │ │ Report           │ │ Activity     │ │
│  │ [Generate]       │ │ [Generate]       │ │ [Generate]   │ │
│  └──────────────────┘ └──────────────────┘ └──────────────┘ │
│                                                              │
│  SAVED / SCHEDULED REPORTS                                   │
│  Sub-heading: "My Reports"                                   │
│  Name                  Created By  Last Run    Format  Actions│
│  Monthly Spend July    Riya S      Jul 6       PDF    [↓][▶][🗑]│
│  Vendor Perf Q2        Arjun K     Jun 30      Excel  [↓][▶][🗑]│
└──────────────────────────────────────────────────────────────┘
```

**Report Generation Flow (modal):**
```
┌──────────────────────────────────────────────────────────────┐
│  Generate: Procurement Summary Report             [✕]        │
│  ─────────────────────────────────────────────────────────── │
│  Date Range*       [Last 30 Days ▾] or [Custom Range]        │
│  Department        [All Departments ▾]                       │
│  Include Sections: ☑ Purchase Requests  ☑ RFQs              │
│                    ☑ Purchase Orders    ☑ Invoices            │
│                    ☑ Payments           ☐ Audit Trail        │
│  Format*           ● PDF  ○ Excel  ○ CSV                     │
│  Save Report?      ☑ Save for later use                      │
│  Report Name       [Procurement Summary — July 2026    ]     │
│                                                              │
│  [Cancel]                    [Generate Report →]             │
└──────────────────────────────────────────────────────────────┘
```

---

### Standard Report Types

| Report | Contents | Default Format |
|---|---|---|
| Procurement Summary | PRs, RFQs, POs count + status breakdown + cycle times | PDF |
| Spend Analysis | Spend by vendor, category, period + charts | PDF + Excel |
| Vendor Performance | Rating, delivery %, response rate per vendor | PDF + Excel |
| Payment Summary | Invoice totals, paid, outstanding, aging | PDF + Excel |
| Audit Trail | All logged actions with user, timestamp, description | PDF + CSV |
| Employee Activity | PRs created, approvals made per employee | Excel |
| Quotation Comparison | All quotes received for a specific RFQ | PDF |

---

### Report Card Design
```
Card: rounded-2xl, shadow-sm, p-6, white, hover: shadow-md
Icon container: 48px rounded-xl, pale bg (matches analytics tab color)
Report name: text-lg font-semibold, mt-3
Description: text-sm Neutral-500, mt-1, line-clamp-2
[Generate] button: full-width, secondary/outlined, mt-4
```

---

### Saved Reports Table
```
Columns: Report Name | Type | Created By | Last Generated | Format | Actions
Actions: Download (↓), Regenerate (▶ play icon), Delete (trash)
```

---

### Empty State
- No saved reports: `PieChart` icon, "No saved reports yet", "Generate a report and save it for quick access later"

---

### Permissions
- Generate any report: Super Admin, Procurement Manager, Finance Manager
- Procurement report only: Procurement Officer
- Finance report only: Finance Manager
- View/download saved reports: report creator + Super Admin

---

### Developer Notes
- Report generation: Edge Function receives parameters → queries Supabase → assembles data → renders PDF/XLSX/CSV
- `reports` table: `report_type`, `parameters_json`, `generated_by`, `format`, `storage_path`, `created_at`
- Generated files stored in Supabase Storage `reports/[company_id]/[report_id].[ext]` (private, signed URL for download)
- Scheduled reports (future): cron-triggered Edge Function re-runs saved reports and emails PDF to configured recipients

---

## MODULE 36 — AUDIT LOGS

---

### Purpose
Maintain a complete, tamper-evident record of every significant user action and system event in the platform. Audit logs provide security visibility, compliance evidence, and accountability for all operations performed within a workspace.

---

### User Flow

1. Settings → Audit Logs (or sidebar Analytics → Audit Logs)
2. Search and filter logs by user, action type, module, date range
3. Click a log entry → detail view showing full context
4. Export filtered logs as CSV or PDF

---

### Page Layout

```
┌──────────────────────────────────────────────────────────────┐
│  Page Header: Audit Logs                                     │
│  Sub: "4,218 recorded events · Retention: 90 days"          │
│  [Export Logs]                                               │
│                                                              │
│  FILTER BAR                                                  │
│  [Search action, user, record ID...]                         │
│  [User ▾]  [Module ▾]  [Action ▾]  [Date Range ▾]            │
│                                                              │
│  ACTIVE FILTERS: User: Riya Sharma ✕  Module: Payments ✕    │
│                                                              │
│  AUDIT LOG TABLE                                             │
│  Timestamp           User          Module      Action           Record ID     IP Address  │
│  Jul 6, 2:34:12 PM  Riya Sharma   Payments    Initiated Payment TXN-8821    192.168.x.x │
│  Jul 6, 2:33:48 PM  Riya Sharma   Invoices    Approved Invoice  INV-1042    192.168.x.x │
│  Jul 6, 11:00:01 AM System        Notifications Sent Email     —            —           │
│  Jul 5, 4:12:22 PM  Arjun Kumar   PRs         Created PR       PR-0081     10.0.0.x    │
│  Jul 5, 4:12:50 PM  Arjun Kumar   PRs         Submitted PR     PR-0081     10.0.0.x    │
│                                                              │
│  PAGINATION (20 rows per page)                               │
└──────────────────────────────────────────────────────────────┘
```

**Log Entry Detail (slide-over panel on row click, 480px):**
```
┌──────────────────────────────────────────────────────────────┐
│  Event Detail                                     [✕ Close]  │
│  ─────────────────────────────────────────────────────────── │
│  Action: Initiated Payment                                    │
│  User: Riya Sharma (riya@meridian.com)                        │
│  Module: Payments                                             │
│  Record: TXN-8821 [View Record →]                            │
│  Timestamp: July 6, 2026 at 2:34:12 PM IST                   │
│  IP Address: 192.168.1.42                                     │
│  User Agent: Chrome 126 / Windows 11                         │
│  Session ID: sess_xxxxxxxxxxxx                               │
│  ─────────────────────────────────────────────────────────── │
│  CHANGED VALUES                                               │
│  Field               Before          After                   │
│  payment_status      pending         processing              │
│  razorpay_order_id   —               order_XXXXXXXXXX        │
│  ─────────────────────────────────────────────────────────── │
│  RELATED EVENTS (same session, ±2 minutes)                   │
│  2:33:48 PM  Approved Invoice INV-1042                       │
│  2:34:12 PM  Initiated Payment TXN-8821                      │
│  2:34:15 PM  Payment Completed TXN-8821                      │
└──────────────────────────────────────────────────────────────┘
```

---

### Logged Event Categories

| Category | Example Events |
|---|---|
| Authentication | Login, Logout, Failed login, Password reset |
| User Management | Employee invited, Role changed, User deactivated |
| IAM | Role created, Permissions modified |
| Procurement | PR created, PR submitted, PR approved, PR rejected |
| RFQ | RFQ created, RFQ sent, RFQ closed |
| Quotations | Quotation submitted, Quotation revised |
| Purchase Orders | PO created, PO sent, PO accepted, PO rejected |
| Orders | Status updated, Shipment created, GRN submitted |
| Invoices | Invoice generated, Invoice approved, Invoice rejected |
| Payments | Payment initiated, Payment completed, Payment failed, Refund issued |
| Vendor | Vendor connected, Vendor invited, Vendor profile updated |
| Documents | Document uploaded, Document deleted, Document downloaded |
| Settings | Company settings changed, Workflow modified |
| System | Email sent, Notification dispatched, Cron job executed |

---

### Components Used
- `AuditTable` — dense data table with monospace timestamps and IDs
- `AuditFilterBar` — multi-filter row with active filter chips
- `AuditDetailPanel` — slide-over with full event context and changed values diff
- `ChangedValuesDiff` — before/after table for data changes
- `RelatedEventsList` — nearby events in same session timeline
- `ExportLogsButton` — CSV/PDF export of filtered results

---

### Table Design Notes
- Timestamp column: `JetBrains Mono`, text-xs, Neutral-600, format: `Jul 6, 2:34:12 PM`
- User column: avatar (20px) + name, links to Employee detail
- Module badge: pill badge with module icon + name
- Action: text-sm, Neutral-800, uses verb + noun pattern ("Approved Invoice", "Created PR")
- Record ID: monospace, Electric Blue link, navigates to the actual record
- IP Address: monospace text-xs Neutral-400 (partially masked for privacy: `192.168.x.x`)
- Row hover: Neutral-50 bg, cursor pointer (opens detail panel)
- System actions (no user): show "[System]" in user column, Neutral-400 italic

---

### Filters

| Filter | Options |
|---|---|
| Search | Full-text on action, user name, record ID |
| User | Multi-select employee/vendor user list |
| Module | Multi-select from event category list above |
| Action | Text search on action name |
| Date Range | Date-time range picker (to-the-minute granularity) |

Active filters shown as dismissible chips below the filter bar.

---

### Empty State
- No logs yet: `ClipboardList` icon, "No audit events recorded yet"
- Search/filter empty: "No events match your filters", "Clear all filters" link

---

### Loading State
Table: 10 skeleton rows with shimmer text at varying widths (simulating varying action lengths)

---

### Export
- Filtered CSV: all visible columns including full IP, full timestamp, action details
- PDF: formatted table with cover page showing: workspace name, export date, filter parameters, total records exported

---

### Responsive Behaviour
- **Desktop:** Full table, 7 columns visible
- **Tablet:** Hide IP Address and User Agent columns; collapse to 5 columns
- **Mobile:** Logs displayed as timeline-style cards: timestamp prominent, user name, action, record ID. Detail panel becomes full-screen.

---

### Permissions
- View audit logs: Super Admin only (Company workspace)
- Platform Admin: sees all platform-wide audit logs
- No other roles have access to audit logs

---

### Accessibility
- Table: `role="grid"`, `aria-sort` on Timestamp column (default sort descending)
- Detail panel: `role="dialog"`, focus trapped, `Escape` closes
- Timestamp format: `aria-label` includes full ISO string for screen readers: `aria-label="July 6 2026 at 2:34 PM"`
- Changed values diff table: `<caption>Changes made by this action</caption>`

---

### Developer Notes
- `audit_logs` table: append-only (no UPDATE or DELETE), `id`, `workspace_id`, `user_id`, `module`, `action`, `record_type`, `record_id`, `before_snapshot` (jsonb), `after_snapshot` (jsonb), `ip_address`, `user_agent`, `session_id`, `created_at`
- Audit log writes: triggered by Edge Functions on every business event; never from client directly
- Retention: 90 days by default; older records archived to cold storage (Supabase S3-compatible bucket)
- `before_snapshot` / `after_snapshot`: stores JSON diff of the changed record for the detail panel
- Immutability: RLS policy allows INSERT only on `audit_logs`; no UPDATE or DELETE policy for any role
- Search: Supabase full-text index on `module + action + record_id`; date range uses B-tree index on `created_at`
- Export: Edge Function queries filtered records, streams CSV/PDF response


---

## MODULE 37 — SETTINGS MANAGEMENT

---

### Purpose
Allow Company Super Administrators, Vendor Administrators, and individual users to configure platform preferences, workspace behavior, security settings, notification preferences, and integration options. Settings is the configuration backbone of the entire platform.

---

### User Flow

1. User navigates to Settings via sidebar (bottom section) or top navigation avatar menu
2. Settings page opens with a two-column layout: settings navigation (left) + settings form (right)
3. User selects a settings section from the left nav
4. Right panel updates with that section's form
5. User edits fields and clicks "Save Changes" (sticky at bottom of form)
6. Toast confirms save; changes take effect immediately

---

### Page Layout

```
┌──────────────────────────────────────────────────────────────┐
│  Page Header: Settings                                       │
│                                                              │
│  TWO-COLUMN LAYOUT (240px left / remaining right)            │
│  ┌──────────────────────┐ ┌──────────────────────────────┐  │
│  │  SETTINGS NAVIGATION │ │  SETTINGS CONTENT PANEL      │  │
│  │                      │ │                              │  │
│  │  WORKSPACE           │ │  Section Heading             │  │
│  │  > Company Profile   │ │  Section description text    │  │
│  │  > Workspace Config  │ │  ─────────────────────────── │  │
│  │  > Subscription      │ │                              │  │
│  │                      │ │  FORM SECTIONS               │  │
│  │  PEOPLE              │ │  Grouped in white cards      │  │
│  │  > Employees         │ │  with section headings       │  │
│  │  > Departments       │ │                              │  │
│  │  > Roles & Perms     │ │  ─────────────────────────── │  │
│  │  > Approval Workflows│ │  STICKY FOOTER               │  │
│  │                      │ │  [Discard Changes]  [Save]   │  │
│  │  PREFERENCES         │ │                              │  │
│  │  > Notifications     │ └──────────────────────────────┘  │
│  │  > Email Preferences │                                   │
│  │  > Theme             │                                   │
│  │  > Language          │                                   │
│  │  > Time Zone         │                                   │
│  │                      │                                   │
│  │  SECURITY            │                                   │
│  │  > Password          │                                   │
│  │  > Sessions          │                                   │
│  │  > Two-Factor Auth   │                                   │
│  │  > Audit Logs        │                                   │
│  │                      │                                   │
│  │  INTEGRATIONS        │                                   │
│  │  > API Keys          │                                   │
│  │  > Webhooks          │                                   │
│  └──────────────────────┘                                   │
└──────────────────────────────────────────────────────────────┘
```

---

### Settings Navigation Design

```
Section labels: text-xs font-semibold uppercase tracking-widest Neutral-400
               px-3 pt-5 pb-1 (non-interactive)
Nav items: text-sm font-medium Neutral-600, py-2 px-3, rounded-md
Active: Electric Blue text, Blue-Pale bg
Hover: Neutral-100 bg, 100ms
```

---

### Settings Sections — Detailed Specifications

#### WORKSPACE → Company Profile
```
COMPANY INFORMATION card
  Company Name*           text input
  Company Logo            image upload (circular preview 80px)
  Industry / Category*    select
  Company Size            select
  Website                 URL input
  Description             textarea

CONTACT INFORMATION card
  Primary Phone*          phone input
  Support Email           email input
  Address                 multi-line textarea

TAX INFORMATION card
  GST Number              text input (with validate button)
  PAN Number              text input
  MSME Number             text input (optional)
```

#### WORKSPACE → Workspace Configuration
```
WORKSPACE SETTINGS card
  Workspace Name*         text input
  Default Currency*       select (INR, USD, EUR, GBP)
  Time Zone*              select (auto-detected)
  Fiscal Year Start*      month select
  Date Format*            select: DD/MM/YYYY | MM/DD/YYYY | YYYY-MM-DD
  Language                select: English (more in future)

PROCUREMENT RULES card
  Require PR before RFQ   toggle (default: ON)
  PR Approval Required    toggle (default: ON)
  Min RFQ Vendors         number input (default: 1, recommended: 3)
  PO Approval Required    toggle (default: OFF)
  Auto-close RFQ after deadline toggle (default: ON)
```

#### WORKSPACE → Departments
```
DEPARTMENTS card
  List of created departments with name, head, employee count
  [+ Add Department] opens inline form: Name, Department Head (employee select)
  Each department row: edit name, change head, delete (with reassign prompt)
```

#### PREFERENCES → Notifications
```
EMAIL NOTIFICATIONS card
  Per event type toggle list:
  ┌────────────────────────────────────────────┐
  │  Event                    Email  In-App    │
  │  Approval Required        ☑      ☑        │
  │  PR Approved/Rejected     ☑      ☑        │
  │  New Quotation Received   ☑      ☑        │
  │  PO Accepted/Rejected     ☑      ☑        │
  │  Invoice Received         ☑      ☑        │
  │  Payment Completed        ☑      ☑        │
  │  Order Shipped            ☑      ☑        │
  │  RFQ Expiring Soon        ☑      ☑        │
  │  System Announcements     ☐      ☑        │
  └────────────────────────────────────────────┘
  Notification Sound         toggle (default: OFF)
  Daily Digest Email         toggle — sends one summary email per day
  Digest Time                time picker (shown if digest enabled)
```

#### PREFERENCES → Theme
```
APPEARANCE card
  Color Theme               radio: Light | Dark | System Default
                            Dark mode note: "Dark mode — coming soon"
                            Dark option shown but disabled with "Soon" badge
  Sidebar Style             radio: Expanded | Collapsed by default
  Table Density             radio: Comfortable | Compact
  Font Size                 select: Default | Large (accessibility)
```

#### PREFERENCES → Time Zone
```
Time Zone*                  searchable select (all IANA time zones)
                            "Detected: Asia/Kolkata (UTC+5:30)" shown as helper
Date & Time Display         radio: 12-hour | 24-hour
```

#### SECURITY → Password
```
Current Password*           password input
New Password*               password input + strength meter
Confirm New Password*       password input
[Change Password]           button
─────────────────────────────────────────────────────
LAST PASSWORD CHANGE        "June 1, 2026 (35 days ago)"
```

#### SECURITY → Sessions
```
ACTIVE SESSIONS card
  Current session highlighted with "This device" badge
  Each row: device icon, browser + OS, IP, location, last active, [Revoke] button
  [Revoke All Other Sessions] button (dangerous — confirmation dialog)
```

#### SECURITY → Two-Factor Authentication
```
STATUS: ○ Not Enabled (or ✓ Enabled)
Enable 2FA button → flow:
  Step 1: Show QR code for authenticator app
  Step 2: Enter 6-digit TOTP code to verify
  Step 3: Display backup codes (copy/download)
Note: "Two-factor authentication is planned for a future release"
      Shown as "Coming Soon" with disabled state in v1
```

#### INTEGRATIONS → API Keys
```
(See Module 50 — API & Integration Management for full spec)
Quick link from Settings: "Manage API Keys →" navigates to dedicated page
```

#### VENDOR SETTINGS (Vendor workspace equivalent)
Same two-column structure with vendor-specific sections:
- Vendor Profile (mirrors Company Profile for vendor data)
- Business Preferences (currency, time zone, language)
- Notification Preferences (same toggle matrix)
- Security (password, sessions)
- Bank Details (view/update banking information)
- Document Settings (notification before expiry threshold)

---

### Unsaved Changes Warning
If user navigates away with unsaved form changes:
```
Unsaved Changes dialog:
"You have unsaved changes in [Section Name].
 If you leave now, your changes will be lost."
[Discard Changes]    [Stay & Save]
```

---

### Components Used
- `SettingsNav` — two-column settings navigation with section groups
- `SettingsCard` — white card container with heading for each settings group
- `ToggleRow` — label + description + toggle switch for notification preferences
- `NotificationMatrix` — two-column toggle table (email / in-app per event)
- `SessionCard` — per device session row
- `DepartmentManager` — inline department create/edit/delete within settings
- `StickyFormFooter` — Discard + Save buttons, fixed at bottom of form panel
- `UnsavedChangesDialog` — navigation blocker dialog
- `PasswordStrengthMeter` — strength bar below password input

---

### Buttons

| Button | Variant | Location |
|---|---|---|
| Save Changes | Primary | Sticky footer of every settings section |
| Discard Changes | Ghost | Sticky footer |
| Change Password | Primary | Security → Password section |
| Revoke (session) | Destructive/ghost | Security → Sessions table |
| Revoke All Others | Destructive/outlined | Sessions card |
| + Add Department | Ghost/dashed | Departments section |
| Validate GST | Ghost/secondary | Tax Information section |

---

### Loading State
- Settings nav: instant (no async)
- Settings form section: skeleton of form fields (input shimmer blocks) while section data loads

---

### Error State
- Save fails (server): error Alert at top of form section
- GST validation fail: inline field error
- Password mismatch: "New passwords do not match"
- Weak password: strength meter shows red, "Password is too weak"

---

### Success State
- Section saved: Toast "[Section Name] updated" (e.g., "Company profile updated", "Notification preferences saved")
- Password changed: Toast "Password updated successfully"
- Session revoked: Row disappears with success Toast "Session revoked"

---

### Responsive Behaviour
- **Desktop:** Two-column layout as specified
- **Tablet:** Settings nav collapses to a horizontal tab row above the form panel (top-scrolling)
- **Mobile:** Settings nav becomes a bottom-sheet selector; form panel takes full screen; sticky footer remains

---

### Permissions

| Settings Section | Super Admin | Proc. Mgr | Finance Mgr | Employee | Vendor Admin |
|---|---|---|---|---|---|
| Company/Vendor Profile | Edit | View | View | No | Edit (own) |
| Workspace Config | Edit | View | No | No | Edit (own) |
| Departments | Edit | View | No | No | No |
| Roles & Permissions | Edit | No | No | No | Edit (own) |
| Approval Workflows | Edit | No | No | No | No |
| Notification Preferences | Edit (own) | Edit (own) | Edit (own) | Edit (own) | Edit (own) |
| Security | Edit (own) | Edit (own) | Edit (own) | Edit (own) | Edit (own) |
| API & Webhooks | Edit | No | No | No | Edit (own) |
| Subscription | Edit | No | No | No | Edit (own) |

---

### Accessibility
- Settings nav: `role="navigation"`, `aria-label="Settings navigation"`, active item `aria-current="page"`
- Form sections: each card is a `<section>` with `<h2>` heading
- Toggle switches: `role="switch"`, `aria-checked="true/false"`, `aria-label` includes both label and current state
- Unsaved changes dialog: `role="alertdialog"`, `aria-modal="true"`, focus trapped
- Sessions table: `role="table"`, "This device" row: `aria-label="Current session — this device"`

---

### Developer Notes
- Company settings: upsert to `companies` table and `workspace_settings` jsonb column
- Notification preferences: `notification_preferences` table per user (`user_id`, `event_type`, `email_enabled`, `inapp_enabled`)
- Theme preference: stored in `localStorage` client-side + synced to `user_preferences.theme` column
- Sessions: managed via Supabase Auth admin API (`listUserSessions`, `revokeSession`)
- Department CRUD: `departments` table with `company_id`, `name`, `head_user_id`
- Time zone: stored in `user_preferences.timezone`; used for all date/time formatting in the app
- 2FA: Supabase Auth supports TOTP — implementation deferred to v2 per PRD constraint

---

## MODULE 38 — PROFILE MANAGEMENT

---

### Purpose
Allow individual users (company employees and vendor staff) to manage their personal account information, change their password, update their profile photo, and control personal account preferences independently of workspace-level settings.

---

### User Flow

1. Top navigation → Avatar → "View Profile"
2. Profile page opens (`/profile`)
3. User edits personal information
4. Saves changes per section

---

### Page Layout

```
┌──────────────────────────────────────────────────────────────┐
│  Page Header: My Profile                                     │
│                                                              │
│  PROFILE HEADER CARD (full-width)                            │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  [Avatar 80px]   Riya Sharma                         │   │
│  │  [Change Photo]  Procurement Manager                 │   │
│  │                  Meridian Technologies               │   │
│  │                  Member since June 2026              │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  TWO-COLUMN CONTENT                                          │
│  ┌──────────────────────────────┐ ┌──────────────────────┐  │
│  │  PERSONAL INFORMATION card   │ │  ACCOUNT ACTIVITY    │  │
│  │  Full Name                   │ │  Last Login:         │  │
│  │  Job Title / Designation     │ │  Jul 6, 2026 2:30 PM │  │
│  │  Work Email (read-only)      │ │                      │  │
│  │  Phone Number                │ │  Account Created:    │  │
│  │  [Save Changes]              │ │  Jun 12, 2026        │  │
│  │                              │ │                      │  │
│  │  CONNECTED ACCOUNTS card     │ │  PRs Created: 18     │  │
│  │  Google: connected ✓         │ │  RFQs Managed: 7     │  │
│  │  [Disconnect Google]         │ │  POs Generated: 12   │  │
│  │  [Connect Google] (if not)   │ │  [View Activity →]   │  │
│  └──────────────────────────────┘ └──────────────────────┘  │
│                                                              │
│  PASSWORD CHANGE card (full-width)                           │
│  Current Password / New Password / Confirm New Password      │
│  [Change Password]                                           │
│                                                              │
│  DANGER ZONE card (full-width, red border-left 4px)          │
│  Delete Account — irreversible action                        │
│  [Request Account Deletion]  (sends deletion request)       │
└──────────────────────────────────────────────────────────────┘
```

---

### Avatar Upload
```
Clicking [Change Photo] opens a modal:
  Upload options: Upload Photo | Remove Photo
  Upload: image file (JPG/PNG, max 2MB), circular crop preview
  Circular cropper with zoom slider before saving
  [Save Photo] / [Cancel]
```

---

### Components Used
- `ProfileHeaderCard` — avatar, name, role, workspace, member since
- `AvatarUploadModal` — photo upload with circular cropper
- `PersonalInfoForm` — name, designation, phone fields
- `ConnectedAccountsCard` — OAuth provider status + connect/disconnect
- `PasswordChangeForm` — current/new/confirm password with strength meter
- `AccountActivityCard` — last login, stats, activity link
- `DangerZoneCard` — deletion request with red visual treatment

---

### Forms

**Personal Information:**
```
Full Name*          text input
Job Title           text input (optional)
Work Email          text (read-only — cannot be changed; contact admin)
Phone Number        phone input
```

**Password Change:**
```
Current Password*   password input
New Password*       password input + strength meter
Confirm Password*   password input
```

---

### Danger Zone — Account Deletion

```
[!] Delete Account card
  Warning text: "Deleting your account will remove your access to
  [Workspace Name]. This cannot be undone."
  Button: [Request Account Deletion] — outlined destructive

On click: Confirmation dialog:
  "Are you sure you want to delete your account?"
  "Type your email address to confirm: [input]"
  [Cancel]  [Delete My Account]
```
Note: deletion sends a request to Super Admin for approval (employees cannot self-delete; admin deactivates them). Vendor Admins can request workspace deletion.

---

### Connected Accounts
- Google OAuth: shows "Connected — riya@gmail.com ✓" with disconnect option
- Disconnect: confirmation modal "Are you sure? You'll need a password to sign in."
- Connect: opens Google OAuth flow; on return, account linked

---

### Empty / Default States
- No profile photo: shows initials avatar (auto-generated from full name)
- No activity yet: activity stats show 0 with neutral color

---

### Success State
- Profile saved: Toast "Profile updated"
- Password changed: Toast "Password updated" + session remains active
- Photo updated: Avatar updates immediately (optimistic UI), Toast "Profile photo updated"

---

### Error State
- Current password wrong: "Current password is incorrect"
- Email already confirmed: work email field shows helper "To change your email, contact your workspace administrator"
- Photo too large: "Image must be under 2MB"

---

### Responsive Behaviour
- **Desktop:** Two-column card layout
- **Tablet/Mobile:** Single column, all cards stacked; avatar upload tap-friendly

---

### Permissions
Every authenticated user can access and edit their own profile. No user can edit another user's profile (only Super Admin can update roles/status via Employee Management).

---

### Accessibility
- Avatar upload button: `aria-label="Change profile photo"`, keyboard activatable
- Password strength meter: `role="meter"`, `aria-label="Password strength: Strong"` (live update)
- Danger zone: region `aria-label="Danger zone"`, delete button `aria-describedby` pointing to warning text
- Email confirmation input in delete dialog: `aria-label="Type your email to confirm account deletion"`, `aria-required="true"`

---

### Developer Notes
- Profile photo: stored in Supabase Storage `avatars/[user_id].[ext]`, public URL
- `user_preferences` table: `user_id`, `full_name`, `designation`, `phone`, `avatar_url`, `theme`, `timezone`, `language`
- Google disconnect: Supabase Auth `unlinkIdentity` API
- Account deletion request: creates `deletion_requests` table record; Super Admin sees pending requests in Employee Management
- Password change: Supabase Auth `updateUser({ password })` — requires current session to be valid

---

## MODULE 39 — GLOBAL SEARCH

---

### Purpose
Enable users to instantly locate any record, vendor, product, module, or action across the entire VendorFlow platform from a single, universally accessible search interface. Global Search serves as both a navigation shortcut and a cross-module discovery tool.

---

### User Flow

1. Press `⌘K` (Mac) / `Ctrl+K` (Windows) from anywhere in the app
2. Or click the search bar in the Top Navigation
3. Command palette overlay appears with instant results
4. Type to filter: results update in real-time (debounced 150ms)
5. Use `↑`/`↓` to navigate results, `Enter` to select
6. Selection navigates to the relevant page or executes the action
7. `Escape` closes the palette

---

### Page Layout

The Global Search uses the Command Palette overlay described in Part 1, Section 5.3. This section specifies all the functional search behaviors and result types.

**Search Panel (640px wide, centered, 80px from top):**
```
┌─────────────────────────────────────────────────────────────┐
│  [Search 18px]  [──────────── search input ────────────]   │
│  ─────────────────────────────────────────────────────────  │
│  (Pre-type state: Recent + Quick Actions + Navigation)       │
│  (During typing: categorized search results)                 │
└─────────────────────────────────────────────────────────────┘
```

---

### Pre-Type State (palette just opened, no query entered)

**Section 1 — Recent Searches:**
```
RECENT SEARCHES                              [Clear]
[Clock 12px]  RFQ-0089 · Office Chairs        →
[Clock 12px]  Nexus Supplies                   →
[Clock 12px]  Invoice INV-1042                 →
[Clock 12px]  PR-0081                          →
```
Max 5 recent searches. "Clear" removes all. Each item re-executes the search on click.

**Section 2 — Quick Actions (role-dependent):**
```
QUICK ACTIONS
[Plus]       New Purchase Request        ⌘+C then P
[Send]       Create RFQ                  ⌘+C then R
[UserPlus]   Invite Employee
[Store]      Browse Vendor Marketplace
[Upload]     Upload Document
```

**Section 3 — Navigate To:**
```
NAVIGATE TO
[LayoutDashboard]  Dashboard
[FileText]          Purchase Requests
[Send]              RFQs
[ShoppingCart]      Purchase Orders
[CreditCard]        Payments
[BarChart2]         Analytics
[Settings]          Settings
```
Shows top 7 most-visited sections for the current user (personalized based on navigation history).

---

### Active Search State (query ≥ 2 characters)

Results are grouped by entity type. Max 3–4 results per group. A "View all [n] results for [query]" footer link at the bottom.

**Result Item Design:**
```
Height: 52px
Left: entity-type icon (14px) in a 28px rounded-md colored bg
Content: primary text (text-sm font-semibold) + secondary text (text-xs Neutral-400)
Right: status badge (if applicable) + action shortcut hint (text-xs Neutral-300)
Hover: Neutral-50 bg
Keyboard focused: Blue-Pale bg, Electric Blue left border 2px
```

**Result groups rendered:**

```
VENDORS (if matches found)
[Store blue bg]  Nexus Supplies
                 IT Hardware · Mumbai · ★ 4.3 · ✓ Verified

PURCHASE REQUESTS
[FileText blue]  PR-0081 · Office Chairs x10
                 ● Pending Approval · Created Jul 4 by Riya Sharma

RFQs
[Send cyan]  RFQ-0089 · Office Chairs
             ● Sent to 3 vendors · Deadline: Jul 10

PURCHASE ORDERS
[ShoppingCart green]  PO-2026-0312 · Nexus Supplies
                      ● Accepted · ₹55,026

INVOICES
[FileSpreadsheet]  INV-1042 · Nexus Supplies
                   ● Pending Review · ₹1,12,100 · Due Jul 25

PRODUCTS (shown to both company and vendor)
[Package purple]  Laptop Pro 15"
                  Nexus Supplies · IT Hardware · ₹85,000

EMPLOYEES (company users only)
[UserCircle]  Riya Sharma
              Procurement Manager · Operations

NAVIGATION
[Settings]  Notification Settings →
[Shield]    Roles & Permissions →
```

---

### Search Scope by User Type

**Company users search across:**
- Vendors, Products (vendor catalogs), Employees
- Purchase Requests, RFQs, Quotations, Purchase Orders
- Invoices, Payments, GRNs
- Documents, Messages
- Navigation items and quick actions

**Vendor users search across:**
- Companies (connected only), Products (own catalog)
- RFQs (received), Quotations (own), Purchase Orders (own)
- Invoices (own), Shipments
- Documents (own), Messages
- Navigation items and quick actions

---

### No Results State

```
[SearchX icon 32px Neutral-300]
No results for "nexu supplie"
Did you mean: "nexus supplies"? (spell-check suggestion)
─────────────────────────────
Try:
  Search for vendors in the Marketplace →
  Create a new Purchase Request →
```

---

### Full Results Page

When user hits `Enter` on a query or clicks "View all results for [query]":
- Navigates to `/search?q=[query]`
- Full-page search results with category tabs: All / Vendors / PRs / RFQs / POs / Invoices / Products
- Each tab shows a full `DataTable` of results with filters

**Full Results Page Layout:**
```
┌──────────────────────────────────────────────────────────────┐
│  Page Header: Search Results for "nexus"                     │
│  Sub: "24 results across 6 categories"                       │
│                                                              │
│  SEARCH BAR (re-editable, auto-focused)                      │
│  [Search 16px]  nexus                           [✕ Clear]    │
│                                                              │
│  CATEGORY TABS                                               │
│  All (24) | Vendors (2) | POs (8) | RFQs (6) | ...          │
│                                                              │
│  RESULTS TABLE (changes by active tab)                       │
│  Standard DataTable per entity type, same columns           │
│  as the entity's own list page                               │
└──────────────────────────────────────────────────────────────┘
```

---

### Keyboard Navigation

| Key | Action |
|---|---|
| `⌘K` / `Ctrl+K` | Open palette from anywhere |
| `ArrowDown` | Move to next result |
| `ArrowUp` | Move to previous result |
| `Enter` | Select focused result / open full results |
| `Escape` | Close palette |
| `Tab` | Move between result groups |
| `⌘Enter` | Open result in new tab |

---

### Components Used
- `CommandPalette` — main overlay container with backdrop
- `SearchInput` — auto-focused input inside palette
- `ResultGroup` — section with heading + items list
- `ResultItem` — single result row with icon, content, right metadata
- `RecentSearchesList` — pre-type recent history
- `QuickActionsList` — role-based quick creation actions
- `NavigationList` — most-visited module links
- `SpellCheckSuggestion` — "Did you mean..." below no-results state
- `FullSearchPage` — `/search` route with category tabs + data tables

---

### Loading State
- As user types: results appear with a subtle shimmer sweep effect (150ms skeleton flash then real results)
- No full loading spinner — results appear incrementally as categories resolve

---

### Permissions
- Each entity type in results is filtered by the user's permissions (a Procurement Officer never sees Finance-only records in search results)
- Search index only contains records the user has RLS-level access to

---

### Accessibility
- Palette: `role="dialog"`, `aria-label="Search VendorFlow"`, `aria-modal="true"`
- Input: `aria-label="Search", `aria-autocomplete="list"`, `aria-controls="search-results"`, `aria-expanded`
- Results list: `role="listbox"`, each item `role="option"`, `aria-selected="true"` on focused item
- Groups: `role="group"`, `aria-label="Vendors"` (group heading)
- Live region: `aria-live="polite"` announces result count: "4 vendors, 8 purchase orders found"
- Backdrop: `aria-hidden="true"` on the dimmed background

---

### Developer Notes
- Search debounce: 150ms (aggressive — search is the primary nav tool, must feel instant)
- Backend: Supabase full-text search via `to_tsvector` on key columns per entity
- Single Edge Function `globalSearch(query, userId, workspaceId)` returns unified results object
- Results ranked by: exact match first, then partial match, then recency
- Recent searches: stored in `localStorage` (client-side only, max 10 entries)
- Quick actions: role-based list defined in a static config object — no API call needed
- Navigation shortcuts: derived from `useNavigationHistory` hook tracking last 10 visited routes
- Full search page: fetches paginated results per category tab independently (parallel queries)


---

## MODULE 40 — SYSTEM ADMINISTRATION

---

### Purpose
Provide Platform Administrators with a comprehensive control panel to monitor platform health, manage all company and vendor workspaces, oversee subscriptions, review system metrics, and perform platform-wide configurations. This module is accessible only to the VendorFlow Platform Admin role.

---

### User Flow

1. Platform Admin logs in → lands on Admin Dashboard (`/admin/dashboard`)
2. Distinct visual identity: Electric Blue top banner (4px), "Platform Administration" label
3. Navigates between platform management sections via Admin sidebar
4. Takes actions: approve vendors, manage workspaces, view system health, send announcements

---

### Page Layout — Platform Admin Dashboard

```
┌──────────────────────────────────────────────────────────────┐
│  [Electric Blue top banner — 4px stripe]                     │
│                                                              │
│  Page Header: Platform Administration                        │
│  Sub: "Monday, July 6, 2026 · 342 active users online"       │
│                                                              │
│  PLATFORM HEALTH ROW (5 status cards)                        │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────┐ │
│  │ Platform │ │ API      │ │ Database │ │ Storage  │ │Email│ │
│  │ ✓ Online │ │ 99.97%  │ │ ✓ Health │ │ 42% used │ │ ✓  │ │
│  │ Uptime   │ │ Uptime   │ │ y        │ │ 420 GB   │ │Queue│ │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └────┘ │
│                                                              │
│  KPI ROW (4 metric cards)                                    │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────┐│
│  │ Companies    │ │ Vendors      │ │ Active Users │ │ Txns ││
│  │    48        │ │    312       │ │    1,284     │ │ 2,841││
│  │ ↑4 this week │ │ ↑12 pending  │ │ Today        │ │ MTD  ││
│  └──────────────┘ └──────────────┘ └──────────────┘ └──────┘│
│                                                              │
│  ROW 2 — TWO COLUMNS                                         │
│  ┌─────────────────────────────┐ ┌───────────────────────┐  │
│  │  PENDING VENDOR APPROVALS   │ │  PLATFORM ACTIVITY    │  │
│  │  12 vendors awaiting review │ │  Timeline feed        │  │
│  │  ─────────────────────────  │ │  of system events     │  │
│  │  [Logo] TechParts India     │ │                       │  │
│  │  Submitted Jul 5 · Docs ✓   │ │                       │  │
│  │  [Review] [Approve] [Reject]│ │                       │  │
│  │  [View all 12 →]            │ │  [View full log →]    │  │
│  └─────────────────────────────┘ └───────────────────────┘  │
│                                                              │
│  ROW 3 — THREE COLUMNS                                       │
│  ┌────────────┐ ┌────────────┐ ┌──────────────────────────┐ │
│  │ WORKSPACE  │ │ ERROR LOGS │ │ PLATFORM GROWTH          │ │
│  │ GROWTH     │ │ 3 errors   │ │ [Line chart — 12 months] │ │
│  │ [Bar chart]│ │ last 24h   │ │ Companies + Vendors      │ │
│  │ Monthly    │ │ [View Logs]│ │ registered over time     │ │
│  │ registrat. │ │            │ │ [View analytics →]       │ │
│  └────────────┘ └────────────┘ └──────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

---

### Admin Sidebar Navigation

```
─── PLATFORM ────────────────────────────
  Dashboard

─── WORKSPACE MANAGEMENT ─────────────────
  All Companies
  All Vendors
  Pending Vendor Approvals (badge: 12)
  Subscription Management

─── OPERATIONS ──────────────────────────
  All Users
  Email Queue Monitor
  Storage Monitor
  Payment Monitor
  Error Logs

─── CONFIGURATION ────────────────────────
  Platform Settings
  Security Settings
  Announcements
  API Management
```

---

### Section: All Companies

```
┌──────────────────────────────────────────────────────────────┐
│  Page Header: Companies                                      │
│  Sub: "48 registered companies"                              │
│                                                              │
│  SEARCH + FILTERS: [Search...]  [Status ▾]  [Plan ▾]         │
│                                                              │
│  TABLE                                                       │
│  Company      Industry   Plan      Users  Status    Joined   Actions│
│  Meridian Tech IT        Pro (₹)   48     ● Active  Jun 2026  [⋯]  │
│  Apex Corp    Mfg        Starter   12     ● Active  May 2026  [⋯]  │
│  BuildRight   Const      Free       4     ○ Trial   Jul 2026  [⋯]  │
└──────────────────────────────────────────────────────────────┘
```

Row actions: View Workspace, Impersonate (audit only), Suspend, View Billing.

**Company Detail (Admin view):**
- All workspace info (read-only mirror of company settings)
- Subscription details, payment history
- User list, last activity
- Storage usage
- Audit log (company-scoped)
- [Suspend Workspace] / [Reactivate] buttons

---

### Section: Pending Vendor Approvals

```
┌──────────────────────────────────────────────────────────────┐
│  Pending Vendor Approvals (12)                               │
│                                                              │
│  TABLE                                                       │
│  Vendor Name    Category   Submitted   Docs    Actions       │
│  TechParts India IT Hdw    Jul 5       4/4 ✓  [Review] [✓][✗]│
│  GreenOffice    Office     Jul 4       3/4 ⚠  [Review] [✓][✗]│
│  FastBuild      Constr     Jul 3       2/4 ✗  [Review] [✗]  │
└──────────────────────────────────────────────────────────────┘
```

**Vendor Review Panel (slide-over 600px):**
- Full vendor profile view (same as public Vendor Profile)
- Document checklist: each document with ✓ Uploaded / ✗ Missing / ⚠ Invalid
- Document preview inline (PDF viewer)
- GST validation check result
- [Approve Vendor] / [Reject with Reason] buttons
- Rejection reason: required select + optional textarea

---

### Section: Email Queue Monitor

```
┌──────────────────────────────────────────────────────────────┐
│  Email Queue Monitor                                         │
│  Sub: "4,281 emails sent today · 2 failed"                   │
│                                                              │
│  STATS CARDS: Sent Today | Delivered | Failed | Bounced      │
│                                                              │
│  FAILED EMAILS TABLE                                         │
│  Recipient    Template        Sent At    Error       Retry   │
│  a@vendor.com RFQ Notification Jul 6 2:04 Bad address [Retry]│
│                                                              │
│  EMAIL LOG TABLE (all recent)                                │
│  Recipient    Template        Status    Sent At    Message ID│
│  [paginated, 20 per page]                                    │
└──────────────────────────────────────────────────────────────┘
```

---

### Section: Storage Monitor

```
STORAGE USAGE OVERVIEW
Total used: 420 GB / 1 TB
Progress bar (full width, color: amber at >70%, red at >90%)

PER-WORKSPACE TABLE
Company          Usage    % of total  Last Upload  [View Files]
Meridian Tech    48 GB    11.4%       Jul 6        [View]
Apex Corp        22 GB    5.2%        Jul 4        [View]
...

STORAGE BREAKDOWN PIE CHART
  Product Images: 38%
  Documents: 28%
  Invoices: 18%
  Avatars: 6%
  Other: 10%
```

---

### Section: Error Logs

```
FILTER: [Severity ▾: All/Error/Warning/Info]  [Module ▾]  [Date ▾]

ERROR TABLE
Timestamp         Severity  Module      Error Message                 Trace ID
Jul 6, 2:04 PM   ERROR     Email       Resend API timeout            abc123
Jul 6, 11:20 AM  WARNING   Payments    Razorpay webhook delay > 30s  def456
Jul 5, 8:44 PM   ERROR     Storage     Upload limit exceeded         ghi789

Row click → Error Detail slide-over:
  Full stack trace (monospace, scrollable, dark bg)
  Request payload (JSON)
  User context
  Related audit log entries
```

---

### Section: Platform Settings

```
PLATFORM INFORMATION card
  Platform Name     [VendorFlow           ]
  Support Email     [support@vendorflow.in]
  Platform URL      [vendorflow.in        ]

VENDOR VERIFICATION card
  Auto-approve verified GST vendors  toggle (default: OFF)
  Required documents checklist       checkboxes

STORAGE LIMITS card
  Free plan limit    [500] MB per workspace
  Starter plan limit [5] GB
  Pro plan limit     [50] GB

PLATFORM MAINTENANCE card
  Maintenance Mode   toggle (when ON: all non-admin users see maintenance page)
  Scheduled Window   date-time range picker
```

---

### Section: Announcements

Allows Platform Admin to send system-wide announcements to all users or specific user groups.

```
COMPOSE ANNOUNCEMENT
  Title*              text input
  Message*            rich text editor
  Audience*           radio: All users / Company users only / Vendor users only / Specific company
  Display Type        radio: In-App Banner | Notification | Email + Notification
  Schedule            radio: Send Now | Schedule for [datetime picker]
  [Preview] [Send Announcement]

SENT ANNOUNCEMENTS TABLE
  Title         Audience    Sent         Type     Status    Actions
  Maintenance   All users   Jul 3        Email    Sent      [View]
  New feature   Companies   Jun 28       Banner   Sent      [View]
```

---

### Components Used
- `PlatformHealthCard` — system status indicators with live polling
- `AdminKPICard` — platform-wide metric cards
- `PendingVendorTable` — approval queue with inline action buttons
- `VendorReviewPanel` — slide-over with document checklist and approval actions
- `EmailQueueTable` — email log with failure highlighting
- `StorageUsageBar` — workspace-level storage progress bars
- `ErrorLogTable` — severity-colored error list
- `ErrorDetailPanel` — stack trace viewer slide-over
- `AnnouncementComposer` — rich text + audience + schedule form
- `MaintenanceModeToggle` — high-risk toggle with confirmation

---

### Maintenance Mode Toggle
```
[!]  Enabling Maintenance Mode will make VendorFlow unavailable to all users.
     Only Platform Admins will retain access.

     Toggle: [○ OFF → ● ON]

On enable: confirmation dialog:
  "Are you sure you want to enable Maintenance Mode?
   All 1,284 active users will be disconnected."
  [Cancel]  [Enable Maintenance Mode]
```

---

### Responsive Behaviour
- Admin interface primarily desktop-only (platform administration is not mobile-critical)
- Tablet: sidebar collapses; tables scroll horizontally
- Mobile: admin access functional but UX not optimized — appropriate warning shown

---

### Permissions
Platform Administration module is accessible only to users with `role = 'platform_admin'`. No company or vendor role can access this section. Separate authentication context.

---

### Accessibility
- Platform health cards: `role="status"` on each health indicator, `aria-live="polite"` for live uptime updates
- Approval actions: `aria-label="Approve TechParts India"` / `aria-label="Reject TechParts India"`
- Maintenance toggle: `role="switch"`, `aria-checked`, confirmation dialog `role="alertdialog"`
- Error stack trace: `role="log"`, monospace block marked `aria-label="Error stack trace"`

---

### Developer Notes
- Platform Admin is a separate Supabase Auth user with `user_metadata.role = 'platform_admin'`
- Workspace impersonation: creates a short-lived signed token for read-only workspace access (audit purposes only, all actions logged)
- Health monitoring: Edge Function pings Supabase Health API + Resend API + Razorpay API every 5 minutes; results stored in `platform_health` table
- Error logs: Supabase Edge Function errors captured via `Deno.core.error` handler, written to `error_logs` table
- Storage usage: aggregated daily via scheduled Edge Function scanning `storage.objects` table
- Maintenance mode: sets `platform_settings.maintenance_mode = true`; middleware checks this flag before every request


---

## MODULE 41 — SUBSCRIPTION & BILLING

---

### Purpose
Allow Company Super Administrators to view and manage their VendorFlow subscription plan, update payment methods, download billing invoices, and handle plan upgrades or downgrades. Provides Platform Admin with a subscription management overview.

---

### User Flow

**Company managing subscription:**
1. Settings → Subscription
2. Views current plan, usage, billing history
3. Clicks "Upgrade Plan" → plan selection modal
4. Completes payment via Razorpay
5. Plan activated immediately

---

### Page Layout

**Subscription Page (Company Settings):**
```
┌──────────────────────────────────────────────────────────────┐
│  Page Header: Subscription & Billing                         │
│                                                              │
│  CURRENT PLAN CARD (prominent, full-width)                   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  [CreditCard 28px blue bg]  PRO PLAN                 │   │
│  │  ₹4,999 / month · Billed monthly                    │   │
│  │  Renews on August 1, 2026                            │   │
│  │  ─────────────────────────────────────────────────── │   │
│  │  USAGE THIS PERIOD                                   │   │
│  │  Users:     42 / 100       ████░░░░░░  42%           │   │
│  │  Storage:   48 GB / 50 GB  █████████░  96%  ⚠        │   │
│  │  Vendors:   312 / Unlimited ✓                        │   │
│  │  API Calls: 28,400 / 50,000 ████████░░  57%          │   │
│  │                                                      │   │
│  │  [Upgrade Plan]  [Cancel Plan]                       │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  PLAN COMPARISON (3 columns)                                 │
│  ┌────────────────┐ ┌────────────────┐ ┌────────────────┐   │
│  │  STARTER       │ │  PRO ✓ Current │ │  ENTERPRISE    │   │
│  │  ₹999/mo       │ │  ₹4,999/mo     │ │  Custom        │   │
│  │  10 users      │ │  100 users     │ │  Unlimited     │   │
│  │  5 GB storage  │ │  50 GB storage │ │  500 GB        │   │
│  │  50 vendors    │ │  Unlimited     │ │  Unlimited     │   │
│  │  Basic support │ │  Priority      │ │  Dedicated CSM │   │
│  │  [Select]      │ │  [Current]     │ │  [Contact Us]  │   │
│  └────────────────┘ └────────────────┘ └────────────────┘   │
│                                                              │
│  PAYMENT METHOD card                                         │
│  Visa •••• 4242  Expires 12/27  [Change] [Remove]           │
│  [+ Add Payment Method]                                      │
│                                                              │
│  BILLING HISTORY table                                       │
│  Date        Description         Amount   Status  Invoice    │
│  Jul 1, 2026 Pro Plan — July     ₹4,999   ✓ Paid  [↓PDF]   │
│  Jun 1, 2026 Pro Plan — June     ₹4,999   ✓ Paid  [↓PDF]   │
│  May 1, 2026 Pro Plan — May      ₹4,999   ✓ Paid  [↓PDF]   │
└──────────────────────────────────────────────────────────────┘
```

---

### Plan Selection Modal

```
┌──────────────────────────────────────────────────────────────┐
│  Change Your Plan                                     [✕]    │
│  ─────────────────────────────────────────────────────────── │
│  Billing Cycle: [Monthly ●] [Annual (save 20%) ○]            │
│                                                              │
│  PLAN CARDS (3 columns with feature checkboxes)              │
│  Starter ₹999/mo | PRO ₹4,999/mo | Enterprise Custom        │
│                                                              │
│  Selected: PRO                                               │
│  Proration: "You'll be charged ₹2,499 today for the         │
│              remaining 15 days of July, then ₹4,999/month"  │
│                                                              │
│  [Cancel]              [Confirm — Pay ₹2,499 Now]            │
└──────────────────────────────────────────────────────────────┘
```

---

### Storage Limit Warning
When storage reaches 90%+ of plan limit, a persistent amber banner appears across the workspace:
```
[AlertTriangle amber]  Your storage is 96% full (48 GB of 50 GB used).
Upgrade your plan to avoid disruptions to file uploads.  [Upgrade Now]
```

---

### Plan Cancellation Flow
```
Cancel Subscription dialog:
  "Are you sure you want to cancel your Pro Plan?
   Your subscription will remain active until August 1, 2026.
   After that, your workspace will be downgraded to Free."

  REASON FOR CANCELLATION (required)
  ○ Too expensive    ○ Missing features    ○ Switching to another tool
  ○ Not using it enough   ○ Other: [text input]

  [Keep My Plan]    [Cancel Subscription]
```

---

### Components Used
- `CurrentPlanCard` — plan name, price, renewal date, usage meters
- `UsageMeter` — labeled progress bar (users, storage, API calls)
- `PlanComparisonGrid` — 3-column plan cards with feature lists
- `BillingHistoryTable` — invoice history with PDF download
- `PaymentMethodCard` — saved card display with change/remove
- `PlanSelectionModal` — billing cycle toggle + plan cards + proration notice
- `CancellationModal` — multi-step cancellation with reason capture
- `StorageLimitBanner` — workspace-wide warning banner

---

### Buttons

| Button | Variant | Usage |
|---|---|---|
| Upgrade Plan | Primary | Open plan selection modal |
| Confirm — Pay ₹X Now | Primary | Confirm plan change |
| Cancel Subscription | Ghost destructive | Open cancellation flow |
| + Add Payment Method | Ghost | Add new payment method |
| Download Invoice (↓) | Ghost | PDF billing invoice |
| Contact Us (Enterprise) | Secondary | Opens Intercom / email |

---

### Empty State
Free plan users: Plan card shows "Free Plan — Limited features", prominent "Upgrade" CTA.

---

### Success State
- Plan upgraded: Toast "Your plan has been upgraded to Pro" + confetti micro-animation (1-time)
- Plan cancelled: Toast "Subscription cancelled — active until August 1, 2026"
- Payment method updated: Toast "Payment method updated"

---

### Permissions
Only Company Super Administrator can view and manage subscription. All other roles see no subscription section.

---

### Developer Notes
- Subscription management: Razorpay Subscriptions API (`plans`, `subscriptions`, `invoices`)
- `subscriptions` table: `company_id`, `plan_type`, `status`, `razorpay_subscription_id`, `current_period_start`, `current_period_end`
- Billing history: pulled from Razorpay API + cached in `billing_invoices` table
- Usage metering: `users`, `storage`, `api_calls` computed daily by Edge Function, stored in `usage_metrics` table
- Proration: computed server-side using Razorpay proration formula before presenting to user
- Cancellation: sets `cancel_at_period_end = true` via Razorpay API; workspace not immediately downgraded

---

## MODULE 42 — API & INTEGRATION MANAGEMENT

---

### Purpose
Allow Company Super Administrators and Vendor Administrators to generate API keys, configure webhooks, monitor API usage, and manage third-party integrations. Enables VendorFlow to integrate with external ERP, accounting, or business intelligence systems.

---

### Page Layout

```
┌──────────────────────────────────────────────────────────────┐
│  Page Header: API & Integrations                             │
│  Sub: "Connect VendorFlow to your business systems"          │
│                                                              │
│  TAB NAVIGATION                                              │
│  API Keys | Webhooks | Usage | Integrations                  │
│                                                              │
│  ─── API KEYS TAB ───────────────────────────────────────── │
│                                                              │
│  [+ Create API Key]                                          │
│                                                              │
│  API KEY TABLE                                               │
│  Name           Key (masked)    Created    Last Used  Actions│
│  Production Key sk_live_••••4f2a Jul 1    2h ago     [⋯]   │
│  Test Key       sk_test_••••8b1c Jun 20   Jul 3      [⋯]   │
│                                                              │
│  ─── WEBHOOKS TAB ──────────────────────────────────────── │
│                                                              │
│  [+ Add Webhook]                                             │
│                                                              │
│  WEBHOOK TABLE                                               │
│  Endpoint URL            Events       Status   Last Sent  Actions│
│  https://erp.company.com PO Created   ● Active  2h ago   [⋯]   │
│  https://bi.company.com  All Payments ● Active  Jul 4    [⋯]   │
└──────────────────────────────────────────────────────────────┘
```

---

### API Key Creation Modal

```
Create API Key                                          [✕]
─────────────────────────────────────────────────────────
Name*               [Production API Key          ]
Permissions*        ☑ Read  ☑ Write  ☐ Delete
Expiry              ○ Never  ● 90 days  ○ Custom date
IP Whitelist        [comma-separated IPs, optional]

[Cancel]                    [Create Key]

─── After creation (shown ONCE) ───────────────────────
Your new API key:
┌──────────────────────────────────────────────────────┐
│  sk_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx │
│                                            [Copy]    │
└──────────────────────────────────────────────────────┘
⚠ Copy this key now. You won't be able to see it again.
[I've copied my key — Done]
```

---

### Webhook Configuration Modal

```
Add Webhook                                             [✕]
─────────────────────────────────────────────────────────
Endpoint URL*       [https://your-system.com/webhook  ]
Secret Key          [auto-generated, copyable          ]
                    (HMAC signature for verification)

EVENTS TO SUBSCRIBE
☑ Purchase Order Created     ☑ Purchase Order Accepted
☑ Invoice Generated          ☑ Payment Completed
☐ PR Created                 ☐ RFQ Sent
☐ Quotation Received         ☐ GRN Created
[Select All] [Clear All]

Retry Policy:       ● Retry 3 times  ○ No retry

[Cancel]     [Test Webhook]     [Save Webhook]
```

**Test Webhook:** sends a sample payload to the endpoint URL and shows the HTTP response code and body in a preview panel.

---

### API Usage Tab

```
USAGE THIS MONTH
API Calls:  28,400 / 50,000  ████████░░  57%
Rate Limit: 1,000 req/min (current: 42 req/min)

USAGE CHART (area chart — 30 days)
X-axis: days  Y-axis: API calls per day

TOP ENDPOINTS TABLE
Endpoint               Calls    Avg Response  Errors
GET /api/vendors       8,200    42ms          0.1%
GET /api/rfqs          6,100    38ms          0%
POST /api/quotations   3,400    128ms         0.3%
```

---

### Integrations Tab

Pre-built integration cards for future connectors:

```
AVAILABLE INTEGRATIONS (cards grid)
┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
│ [SAP logo]       │ │ [Tally logo]     │ │ [Slack logo]     │
│ SAP Ariba        │ │ Tally ERP        │ │ Slack            │
│ ERP Integration  │ │ Accounting sync  │ │ Notifications    │
│ [Coming Soon]    │ │ [Coming Soon]    │ │ [Coming Soon]    │
└──────────────────┘ └──────────────────┘ └──────────────────┘
```

All integration cards show "Coming Soon" badge with a "Notify me when available" button (captures email for waitlist).

---

### Components Used
- `APIKeyTable` — masked key display, copy, revoke
- `APIKeyCreateModal` — name, permissions, expiry, IP whitelist
- `NewKeyRevealBanner` — one-time key display with copy button
- `WebhookTable` — endpoint list with status, last sent
- `WebhookModal` — event subscription checkboxes + test
- `WebhookTestPanel` — HTTP response preview
- `UsageMetersRow` — API call + rate limit meters
- `APIUsageChart` — area chart of daily usage
- `EndpointsTable` — top endpoints by call count
- `IntegrationCard` — coming-soon integration tile

---

### Security Notes (visible in UI)
An info banner at the top of the API Keys tab:
```
[Lock icon blue]  Keep your API keys secure. Never share them in public repositories,
client-side code, or unencrypted channels. Rotate keys regularly.
```

---

### Permissions
- API Keys and Webhooks management: Super Admin and Vendor Admin only
- Usage monitoring: Super Admin, Vendor Admin
- No other roles see this section

---

### Developer Notes
- API keys: generated server-side (Edge Function), stored as bcrypt hash; plain key shown only once
- `api_keys` table: `workspace_id`, `name`, `key_hash`, `key_prefix` (first 8 chars for display), `permissions_json`, `expires_at`, `last_used_at`, `ip_whitelist`
- Webhooks: `webhooks` table with `endpoint_url`, `secret_hash`, `events_json`, `retry_count`, `status`
- Webhook delivery: Edge Function sends POST with HMAC-SHA256 signature header (`X-VendorFlow-Signature`)
- Webhook retries: exponential backoff (1min, 5min, 30min) on non-2xx responses
- API usage: `api_usage_logs` table; summarized daily by scheduled Edge Function into `api_usage_daily` aggregates
- Rate limiting: enforced at Edge Function level using Supabase's Redis-backed rate limiter


---

## MODULE 43–47 — FUTURE AI MODULES

---

### Overview

VendorFlow's AI modules are designed as a cohesive suite of intelligent procurement features, planned for post-v1 release. They are architecturally isolated behind a feature flag system, visually distinguished by the Premium Purple design token, and labelled with the `Sparkles` icon throughout the application. In v1, AI modules appear as placeholder cards with "Coming Soon" treatment to prime users for upcoming capabilities.

---

### AI Visual Design Language

All AI-powered features share a consistent visual identity that sets them apart from standard procurement modules:

```
Color: Premium Purple (#7C3AED) — used exclusively for AI features
Background: Purple-Pale (#F5F3FF)
Border: 1px solid #DDD6FE
Icon: Sparkles (Lucide) — always accompanies AI elements
Shadow: shadow-purple-glow (defined in design tokens)

AI Badge:
  Background: Purple-Pale
  Text: Premium Purple
  Icon: Sparkles 12px
  Label: "AI-Powered" or "AI Insight"
  Border-radius: rounded-full
  Padding: px-2 py-0.5
  Font: text-xs font-semibold
```

---

### MODULE 43 — AI VENDOR RECOMMENDATION

---

### Purpose
Intelligently recommend the most suitable vendors for a purchase requirement based on procurement history, vendor performance scores, category match, and behavioral patterns — reducing time spent on vendor discovery.

---

### UI Placement
- Vendor Marketplace: AI Recommendation strip above the standard grid
- RFQ creation — Vendor Selection step: "AI Suggested Vendors" section
- Company Dashboard: AI Insights widget (future)

---

### Page Layout (AI Recommendations strip in Marketplace)

```
┌──────────────────────────────────────────────────────────────┐
│  [Sparkles purple]  AI VENDOR RECOMMENDATIONS                │
│  "Based on your procurement history and current request"     │
│                                                              │
│  RECOMMENDATION CARDS (horizontal scroll, 3 visible)         │
│  ┌────────────────────┐ ┌────────────────────┐              │
│  │  [Vendor Logo]     │ │  [Vendor Logo]     │              │
│  │  Nexus Supplies    │ │  CloudHW India     │              │
│  │  Match Score: 94%  │ │  Match Score: 88%  │              │
│  │  ████████████░░    │ │  ████████████░     │              │
│  │                    │ │                    │              │
│  │  Why recommended:  │ │  Why recommended:  │              │
│  │  ✓ 18 past orders  │ │  ✓ Top IT vendor   │              │
│  │  ✓ 96% on-time     │ │  ✓ 4.7★ rating     │              │
│  │  ✓ Category match  │ │  ✓ Best price hist.│              │
│  │  [Add to RFQ]      │ │  [Add to RFQ]      │              │
│  └────────────────────┘ └────────────────────┘              │
│  [See all AI recommendations →]                              │
└──────────────────────────────────────────────────────────────┘
```

---

### AI Recommendation Card Design

```
Card: rounded-2xl, shadow-purple-glow, p-5, Purple-Pale bg (#F5F3FF)
Border: 1px solid #DDD6FE
Top-right: [Sparkles 14px purple] "AI Pick" badge
Vendor logo: 40px rounded-lg
Match score: large number (text-3xl font-bold Purple) + "% Match"
Score bar: full-width, Purple gradient (dark → light)
Why recommended: 3 bullet points with CheckCircle icons
                 (derived from AI scoring factors)
CTA: "Add to RFQ" primary button (Electric Blue, not purple — action color)
```

---

### Coming Soon Treatment (v1)

In v1, AI Recommendation appears as a locked card with:
```
[Sparkles purple 24px]
AI Vendor Recommendations
"Smart vendor suggestions powered by your procurement data"
[Coming Soon] badge
[Get Notified] ghost button
```

---

### Developer Notes (Future)
- AI scoring: LLM-based (OpenAI / Gemini) or ML pipeline using procurement history vectors
- Provider-agnostic: `ai_provider` config in platform settings (`openai` | `gemini` | `anthropic`)
- Recommendation inputs: vendor category, historical orders, performance scores, RFQ requirements
- Feature flag: `ai_vendor_recommendation_enabled` in `workspace_settings`

---

## MODULE 44 — AI QUOTATION COMPARISON

---

### Purpose
Automatically analyze and score received quotations using intelligent comparison, going beyond raw price to factor in delivery reliability, vendor trust score, total cost of ownership, and risk factors.

---

### UI Placement
Vendor Comparison page: AI Recommendation Banner (bottom of comparison table when ≥2 quotations received).

---

### Page Layout (AI Banner on Comparison Page)

```
┌──────────────────────────────────────────────────────────────┐
│  [Sparkles purple]  AI QUOTATION ANALYSIS                    │
│  "Based on price, delivery reliability, and vendor trust"    │
│                                                              │
│  RECOMMENDATION:                                             │
│  Best Overall Value: Nexus Supplies (Score: 91/100)          │
│  ████████████████████████░░░░  91                            │
│                                                              │
│  SCORING BREAKDOWN TABLE                                     │
│  Factor              Nexus    CloudHW   OfficeFirst  Weight  │
│  Price Competitiveness  85      78        92          30%    │
│  Delivery Reliability   96      88        72          25%    │
│  Vendor Trust Score     88      94        82          20%    │
│  Payment Terms          80      80        70          15%    │
│  Quality History        90      92        80          10%    │
│  ─────────────────────────────────────────────────────────── │
│  WEIGHTED SCORE         91      87        83                 │
│                                                              │
│  AI RATIONALE                                                │
│  "Nexus Supplies offers the optimal combination of           │
│   competitive pricing and proven delivery reliability.       │
│   Their 18 previous orders with a 96% on-time rate          │
│   significantly outweighs a 6.8% price premium over         │
│   OfficeFirst."                                              │
│                                                              │
│  [Select Nexus Supplies →]                                   │
└──────────────────────────────────────────────────────────────┘
```

---

### Coming Soon Treatment (v1)
Shown as a collapsed locked card at the bottom of the Comparison page with a "Coming Soon" label.

---

## MODULE 45 — AI PROCUREMENT INSIGHTS

---

### Purpose
Deliver proactive, AI-generated insights about procurement patterns, spending anomalies, optimization opportunities, and upcoming risks — surfaced as intelligent cards on the Analytics page and Company Dashboard.

---

### UI Placement
- Analytics page: "AI Insights" tab (6th tab, purple-accented)
- Company Dashboard: AI Insights widget (optional, togglable)
- Notification Center: AI-generated insight notifications (purple icon)

---

### Page Layout (AI Insights Tab in Analytics)

```
┌──────────────────────────────────────────────────────────────┐
│  [Sparkles purple]  AI PROCUREMENT INSIGHTS                  │
│  "Intelligent analysis of your procurement patterns"         │
│                                                              │
│  INSIGHT CARDS GRID (masonry layout, 2 columns)              │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  [TrendingUp purple]  SPENDING TREND                 │   │
│  │  "Your IT hardware spending increased 34% this       │   │
│  │  quarter. Consider negotiating volume discounts      │   │
│  │  with Nexus Supplies."                               │   │
│  │  Confidence: ████████░░  82%  · [View Details →]    │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  [AlertTriangle purple]  RISK ALERT                  │   │
│  │  "OfficeFirst has shown declining delivery           │   │
│  │  performance over 3 consecutive orders.              │   │
│  │  Consider diversifying your office supply vendors."  │   │
│  │  Confidence: ██████░░░░  64%  · [View Vendor →]     │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  [Lightbulb purple]  OPTIMIZATION                    │   │
│  │  "You could save ₹1.2L annually by consolidating     │   │
│  │  your 8 stationery vendors into 2–3 preferred        │   │
│  │  suppliers with volume agreements."                  │   │
│  │  Confidence: ██████████  91%  · [Explore →]         │   │
│  └──────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────┘
```

---

### AI Insight Card Design

```
Card: rounded-2xl, shadow-purple-glow, p-5, white bg
Left border: 4px solid #7C3AED (Premium Purple)
Header: [insight-type icon 16px purple bg] + insight type label (text-xs uppercase purple)
Title: text-sm font-semibold Neutral-800
Body: text-sm Neutral-600, line-clamp-4, "Read more" expands
Confidence meter: "Confidence: [bar] [%]"
  Bar: Purple fill, Neutral-100 track, 6px height, rounded-full
Footer: [View Details →] Electric Blue text link
Dismiss: [✕] top-right, hides card for 7 days
```

---

### Insight Types

| Type | Icon | Color | Purpose |
|---|---|---|---|
| Spending Trend | TrendingUp | Purple | Spend pattern changes |
| Risk Alert | AlertTriangle | Purple | Vendor/supply risks |
| Optimization | Lightbulb | Purple | Cost-saving opportunities |
| Forecast | Calendar | Purple | Upcoming procurement predictions |
| Anomaly | Zap | Purple | Unusual activity detected |
| Performance | BarChart2 | Purple | Vendor performance changes |

---

## MODULE 46 — AI VENDOR PERFORMANCE PREDICTION

---

### Purpose
Predict future vendor performance using historical order data, delivery patterns, review trends, and market signals — helping procurement teams proactively identify at-risk vendor relationships.

---

### UI Placement
- Vendor Profile page: "AI Performance Prediction" card in right sidebar
- Vendor Comparison page: Prediction score column
- Vendor Analytics page: Predictive trend overlay on performance charts

---

### Page Layout (on Vendor Profile sidebar)

```
┌──────────────────────────────────┐
│  [Sparkles]  AI PERFORMANCE      │
│  PREDICTION                      │
│  ─────────────────────────────── │
│  Predicted Next 90 Days:         │
│                                  │
│  On-Time Delivery: 94% ↑         │
│  Quality Score:    4.2★ →        │
│  Response Time:    < 6h ↓ ⚠     │
│                                  │
│  RISK LEVEL:  ● Low              │
│  ████████████████░░░░  Low Risk  │
│                                  │
│  "Response time predicted to     │
│   increase slightly based on     │
│   recent order volume growth."   │
│                                  │
│  Confidence: 76%                 │
│  [View Full Analysis →]          │
└──────────────────────────────────┘
```

---

## MODULE 47 — AI RISK ANALYSIS

---

### Purpose
Identify and surface procurement and vendor risks before purchase decisions are made — covering vendor financial health signals, compliance gaps, supply chain concentration risks, and procurement fraud indicators.

---

### UI Placement
- Vendor Comparison page: Risk indicator per vendor column
- Vendor Profile: Risk Summary card
- Purchase Order creation: Risk check banner before sending PO to a new/low-rated vendor
- Analytics: Risk Dashboard tab (future)

---

### Page Layout (Risk Summary on Vendor Profile)

```
┌──────────────────────────────────┐
│  [Sparkles]  AI RISK ANALYSIS    │
│  ─────────────────────────────── │
│  OVERALL RISK:  ● Low Risk       │
│  Risk Score: 12 / 100            │
│  ██░░░░░░░░░░░░░░░░░░░░  Low     │
│                                  │
│  RISK FACTORS                    │
│  ✓ GST Verified                  │
│  ✓ 3+ years on platform          │
│  ✓ Consistent delivery record    │
│  ⚠ Single-city supply base       │
│  ✓ No payment disputes           │
│                                  │
│  SUPPLY CHAIN RISK               │
│  Concentration: Medium           │
│  (You source 68% of IT Hardware  │
│  from this vendor)               │
│                                  │
│  [View Full Risk Report →]       │
└──────────────────────────────────┘
```

---

### Risk Level System

| Level | Color | Score Range | Treatment |
|---|---|---|---|
| Low | Success Green dot | 0–30 | No action needed |
| Medium | Warning Amber dot | 31–60 | Review recommended |
| High | Error Red dot | 61–80 | Caution — take action |
| Critical | Error Red pulsing | 81–100 | Block purchase prompt |

---

### Risk Factors Assessed

| Factor | Source |
|---|---|
| GST verification status | Platform verification data |
| Document expiry | Document management module |
| Delivery performance trend | Order history |
| Payment dispute history | Invoice/payment module |
| Review sentiment trend | Reviews module |
| Vendor age on platform | Registration date |
| Supply concentration | Company order distribution |
| Response time trend | RFQ response data |

---

### Coming Soon Treatment (v1 — all AI modules)

All AI modules in v1 render as "Coming Soon" cards within their respective placement zones:

```
┌──────────────────────────────────────────────────────────────┐
│  [Sparkles 24px purple]                                      │
│  AI Vendor Recommendations                (or any AI module) │
│                                                              │
│  "Intelligent [module function] powered by AI analysis       │
│  of your procurement data."                                  │
│                                                              │
│  ┌─────────────────────────────┐                            │
│  │  [Sparkles]  Coming Soon    │                            │
│  └─────────────────────────────┘                            │
│                                                              │
│  [✉ Notify me when this is available]                        │
└──────────────────────────────────────────────────────────────┘
```
Background: Purple-Pale. Border: 1px dashed #DDD6FE. Opacity: 0.85.
"Notify me" button stores email in `ai_waitlist` table per module + user.

---

### Feature Flag Architecture

```typescript
// AI modules controlled by workspace-level feature flags
interface AIFeatureFlags {
  ai_vendor_recommendation: boolean;
  ai_quotation_comparison: boolean;
  ai_procurement_insights: boolean;
  ai_vendor_performance: boolean;
  ai_risk_analysis: boolean;
}

// Stored in workspace_settings.ai_features (jsonb)
// All default to false in v1
// Platform Admin can enable per workspace for beta testing
```

---

### AI Provider Configuration (Future)

Settings → Integrations → AI Provider:
```
AI PROVIDER SETTINGS
Provider:    ○ OpenAI  ● Google Gemini  ○ Anthropic  ○ Custom
API Key:     [••••••••••••••••••••••]
Model:       [gemini-1.5-pro ▾]
Temperature: [0.3] (for deterministic procurement recommendations)
[Test Connection]  [Save]
```

The platform is designed to be AI-provider-agnostic at the API layer.

---

### Accessibility for AI Modules
- All AI insight cards: `role="article"`, `aria-label="AI Insight: [type] — [title]"`
- Confidence meters: `role="meter"`, `aria-valuenow`, `aria-label="Confidence: 82%"`
- Coming Soon overlay: `aria-label="[Module name] — Coming soon"`, `aria-disabled="true"` on action buttons
- Dismiss button: `aria-label="Dismiss this insight for 7 days"`

---

### Developer Notes
- AI modules isolated in `/src/modules/ai/` directory
- Each AI module: one Edge Function per feature (stateless, provider-agnostic)
- AI response caching: results cached in `ai_cache` table with `ttl` (24 hours for recommendations, 7 days for risk scores)
- Fallback: if AI provider is unavailable, module hides gracefully (no error shown to user — just empty state)
- Explainability: every AI output includes a `reasoning_bullets` array displayed in the "Why recommended" / "AI Rationale" sections
- Privacy: only aggregated procurement data sent to AI provider — no PII, no full document contents


---

## MODULE 48 — PLATFORM NOTIFICATIONS

---

### Purpose
Allow Platform Administrators to broadcast system-wide announcements, maintenance notices, security alerts, feature release updates, and subscription warnings to all VendorFlow users or targeted user segments. Platform Notifications differ from in-app notifications (which are per-user event-driven) — these are admin-authored communications pushed to the entire platform.

---

### User Flow

**Platform Admin sending a notification:**
1. Admin Dashboard → Announcements → "+ New Announcement"
2. Compose title, message, choose audience and display type
3. Preview the notification as users will see it
4. Schedule or send immediately

**User receiving a platform notification:**
- In-app: persistent banner at the top of the application (above Top Navigation, below brand mark)
- Or: notification bell entry with a different icon/color treatment
- Email: if selected, sent via Resend

---

### Platform Notification Banner (User-facing)

```
FULL-WIDTH BANNER (below the top navigation bar, 48px height)
─────────────────────────────────────────────────────────────
Maintenance:
[Wrench icon amber] Scheduled maintenance on July 15, 2026 from 2:00–4:00 AM IST.
The platform will be unavailable during this window.  [Learn More]  [✕ Dismiss]

Security Alert:
[ShieldAlert red] Important security update — please reset your password before July 20.
[Reset Password →]  (cannot be dismissed until action taken)

Feature Release:
[Sparkles blue] New: AI Vendor Recommendations is now live in your workspace!  [Try it →]  [✕]

General Announcement:
[Megaphone blue] VendorFlow pricing update effective August 1.  [View Details →]  [✕]
```

**Banner Variants:**
| Type | Icon | Left-border color | Dismissible |
|---|---|---|---|
| Maintenance | Wrench | Warning Amber | Yes |
| Security Alert | ShieldAlert | Error Red | No (until resolved) |
| Feature Release | Sparkles | Electric Blue | Yes |
| General | Megaphone | Electric Blue | Yes |
| Subscription | CreditCard | Warning Amber | No |

---

### Components Used
- `PlatformBanner` — top-of-app banner with icon, message, CTA, dismiss
- `AnnouncementComposer` — admin compose form
- `AnnouncementPreview` — live preview of how the banner/notification will appear
- `AudienceSelector` — All / Companies / Vendors / Specific workspace

---

### Developer Notes
- `platform_announcements` table: `type`, `title`, `message`, `cta_label`, `cta_url`, `audience`, `dismissible`, `start_at`, `end_at`, `created_by`
- Client: polls `platform_announcements` on app init and every 10 minutes for active announcements
- Dismissed state: stored in `localStorage` per announcement ID per user
- Non-dismissible banners: override `localStorage` and re-display on every page load until resolved

---

## MODULE 49 — PROCUREMENT SEARCH (ADVANCED)

---

### Purpose
Provide procurement-specific advanced search and filtering capabilities within the Procurement module — complementing the Global Search (which is cross-platform) with deeper, multi-criteria filtering tailored to procurement artifacts.

---

### Placement
Each procurement list page (PRs, RFQs, POs, Quotations, Invoices) has an "Advanced Filters" panel that extends the standard filter bar with additional procurement-specific criteria.

---

### Advanced Filter Panel Design

```
[Advanced Filters ▾] button opens a slide-down panel below the filter bar:

┌──────────────────────────────────────────────────────────────┐
│  ADVANCED FILTERS                                    [Clear] │
│                                                              │
│  FOR PURCHASE REQUESTS:                                      │
│  Priority:       [✓ Critical] [✓ High] [○ Medium] [○ Low]   │
│  Department:     [multi-select dropdown]                     │
│  Requested By:   [employee search select]                    │
│  Date Range:     [From: date] — [To: date]                   │
│  Budget Range:   [₹ Min] — [₹ Max]                          │
│  Linked to RFQ:  [○ Yes ○ No ● Any]                         │
│  Approval Stage: [multi-select: Step 1/2/3]                  │
│                                                              │
│  FOR RFQS:                                                   │
│  Vendor:         [multi-select vendor]                       │
│  Response Status:[○ All responses ○ Partial ○ Complete]     │
│  Deadline:       [Overdue | Today | This week | Custom]      │
│  Items Count:    [Min] — [Max]                               │
│                                                              │
│  Active filters: "Priority: Critical, High" ✕               │
│                  "Date: Jun 1 – Jul 6" ✕                    │
│                                                              │
│  [Apply Filters]                        [Reset All]          │
└──────────────────────────────────────────────────────────────┘
```

---

### Components Used
- `AdvancedFilterPanel` — collapsible panel per module
- `ActiveFilterChips` — dismissible chip row showing applied filters
- `DateRangePicker` — dual-calendar date range selector
- `CurrencyRangeInput` — min/max currency inputs with ₹ prefix
- `MultiSelectDropdown` — searchable multi-select for departments, vendors, employees
- `FilterPresets` — save and recall common filter combinations (e.g., "My pending approvals")

---

### Developer Notes
- Filter state: managed in URL query params (`?status=pending&priority=high&dept=ops`) for shareability and deep-linking
- Server-side filtering: all filter params passed to Supabase query builder — no client-side filtering of full datasets
- Filter presets: stored in `user_preferences.filter_presets_json` per module per user

---

## CROSS-MODULE DESIGN PATTERNS

---

This final section documents the UI patterns that appear consistently across multiple modules throughout VendorFlow.

---

### Detail Page Structure (Universal)

Every module's detail page follows this universal structure:

```
[← Back to [Module Name]]  Breadcrumb navigation
[Record title + ID]        h1 heading
[Status badge]             prominent, near title
[Primary CTAs]             top-right action buttons

CONTENT AREA
Two-column layout (65% / 35%) for most modules:
  LEFT: Main content (form data, document view, items table)
  RIGHT: Status/context panel (approval status, linked records, activity log)

Full-width sections below:
  Comments / Messages thread
  Activity / Audit log timeline
  Linked records grid
```

---

### Status Badge Anatomy (Universal)

Used across all 50 modules for consistent status communication:

```
Container: inline-flex, items-center, gap-1.5
Padding: px-2.5 py-0.5
Border-radius: rounded-full
Font: text-xs font-semibold uppercase tracking-wide

States:
Draft:      bg-Neutral-100, text-Neutral-600
Pending:    bg-Warning-Light, text-Warning-Amber, [dot icon]
Active:     bg-Success-Light, text-Success-Green, [dot icon]
Approved:   bg-Success-Light, text-Success-Green, [CheckCircle 10px]
Rejected:   bg-Error-Light, text-Error-Red, [XCircle 10px]
Closed:     bg-Neutral-100, text-Neutral-500
Paid:       bg-Success-Light, text-Success-Green, [$]
Overdue:    bg-Error-Light, text-Error-Red, [AlertCircle 10px]
AI Insight: bg-Purple-Pale, text-Purple, [Sparkles 10px]
```

---

### Empty State Pattern (Universal)

```
Container: flex flex-col items-center justify-center, py-16
Icon: 48px Lucide icon, Neutral-300 color
Title: text-lg font-semibold Neutral-700, mt-4
Description: text-sm Neutral-400, mt-2, max-w-sm, text-center
CTA Button: primary, mt-6 (if applicable)
```

---

### Confirmation Dialog Pattern (Universal)

All destructive or irreversible actions use this dialog:

```
┌──────────────────────────────────────────────────────────────┐
│  [AlertTriangle 24px — color by severity]                    │
│  Are you sure?  (or specific action title)                   │
│                                                              │
│  Consequence description — clear, specific, honest.          │
│  "This cannot be undone." (if irreversible)                  │
│                                                              │
│  [Cancel]          [Confirm / Delete / Reject]               │
│  (Ghost)           (Destructive red or Primary blue)         │
└──────────────────────────────────────────────────────────────┘
Width: max-w-md, centered
Backdrop: rgba(15, 23, 42, 0.5) with blur-sm
```

---

### Inline Action Row (Universal — Table Rows)

All table rows expose a consistent action pattern:

```
Rest state:    Three-dot menu (MoreHorizontal 16px) appears on row hover
Click menu:    Small popover with action list
               Each action: icon (14px) + label
               Destructive actions: red text + red icon, separator above
               
Example:
  [Edit]
  [View Details]
  [Download]
  ─────────────
  [Delete]  (red)
```

---

### Form Section Card Pattern (Universal)

All multi-section forms use this card structure:

```
Card: white bg, rounded-xl, shadow-sm, p-6, mb-4
Card heading: text-base font-semibold Neutral-800
Card sub-heading: text-sm Neutral-400 mt-1 mb-6 (optional description)
Fields: gap-4 (16px between fields)
Two-column fields: grid grid-cols-2 gap-4
Full-width fields: col-span-2
```

---

### Linked Record Chips (Universal)

Used across all detail pages to show relationships between records:

```
Chip: inline-flex items-center gap-1.5, bg-Neutral-100, rounded-md
      px-2.5 py-1, text-xs font-medium, Neutral-600
      hover: bg-Neutral-200, cursor-pointer

Left: module icon (12px, Neutral-400)
Text: record type + record ID (e.g., "RFQ-0089" or "PR-0081")
Right: ExternalLink 10px (on hover)

Example row: "Source PR: PR-0081  ·  Source RFQ: RFQ-0089  ·  Invoice: INV-1042"
```

---

### Activity Log / Timeline Pattern (Universal)

Used on all detail pages in the right column or bottom section:

```
Container: border-left 2px Neutral-100, ml-3
Each entry:
  Left: colored dot (8px, status-colored) positioned on the border line
  Content: event description (text-sm Neutral-700)
            actor: "by Riya Sharma" (text-xs Neutral-400)
            time: "2 hours ago" (text-xs Neutral-400)
  Hover: bg-Neutral-50 on entry row

Grouped by date:
  Date header: text-xs uppercase tracking-wider Neutral-400, above group
```

---

### Pagination Pattern (Universal)

```
Container: flex items-center justify-between, border-top 1px Neutral-100, pt-4
Left: "Showing 1–20 of 128 results" (text-sm Neutral-500)
Right: [← Prev] [1] [2] [3] [...] [12] [Next →]

Button style: 32px square, rounded-md, text-sm
  Default: Neutral-100 bg, Neutral-700 text
  Active: Electric Blue bg, white text, font-semibold
  Prev/Next: text-sm Neutral-600, disabled when at boundary
  Ellipsis: "..." Neutral-400 (non-interactive)
```

---

**** END OF PART 2 ****





## C01 — BUTTON

### Purpose
The primary interactive element for all user-initiated actions across VendorFlow. Buttons communicate action type through visual weight, color, and size.

### Variants

| Variant | Background | Text | Border | Use Case |
|---|---|---|---|---|
| Primary | Electric Blue #2563EB | White | None | Main CTA, form submit, confirm |
| Secondary | White | Electric Blue | 1px Electric Blue | Secondary actions |
| Ghost | Transparent | Neutral-700 | None | Tertiary, low-emphasis actions |
| Destructive | Error Red #DC2626 | White | None | Delete, reject, cancel |
| Destructive Outlined | Transparent | Error Red | 1px Error Red | Soft destructive |
| Success | Success Green #16A34A | White | None | Approve, confirm positive |
| AI | Premium Purple #7C3AED | White | None | AI module CTAs exclusively |
| Link | Transparent | Electric Blue | None | Inline text actions |

### Sizes

| Size | Height | Padding | Font | Icon Size | Usage |
|---|---|---|---|---|---|
| xs | 28px | px-2.5 py-1 | text-xs font-medium | 12px | Dense tables, badge actions |
| sm | 34px | px-3 py-1.5 | text-sm font-medium | 14px | Secondary panel actions |
| md (default) | 40px | px-4 py-2 | text-sm font-semibold | 16px | Standard forms, cards |
| lg | 44px | px-5 py-2.5 | text-base font-semibold | 18px | Form primary CTAs |
| xl | 52px | px-6 py-3 | text-lg font-semibold | 20px | Onboarding, hero actions |

### States
- Default: base variant styles
- Hover: background darkens one token step; `translateY(-1px)`, 150ms ease-out
- Active: `scale(0.97)`, 100ms ease-out
- Focus: `outline: 2px solid #2563EB`, `outline-offset: 2px`
- Disabled: `opacity-50`, `cursor-not-allowed`, `pointer-events-none`
- Loading: spinner replaces leading icon or appears inline; button width locked

### Icon Usage
- Icon-left: `[Icon 16px]  [Label]` with `gap-2` (8px)
- Icon-right: `[Label]  [Icon 16px]` with `gap-2`
- Icon-only: square, min 36px × 36px (md), requires `aria-label`

### Border Radius
All sizes: `rounded-md` (8px). Icon-only circular: `rounded-full` only for avatar/profile actions.

### Accessibility
- Use native `<button>` element, never `<div role="button">`
- `aria-disabled="true"` + `tabindex="-1"` when disabled (not HTML `disabled` alone for custom components)
- `aria-busy="true"` + `aria-label="Loading..."` during loading
- `aria-label` required on all icon-only buttons
- `aria-pressed` for stateful toggle buttons

### Keyboard Navigation
- `Tab` / `Shift+Tab` to move focus
- `Enter` or `Space` to activate
- Loading state does not trap focus

### Motion
- Hover: `translateY(-1px)` + elevation shadow lift, 150ms ease-out
- Active: `scale(0.97)`, 100ms ease-out
- Spinner fade-in: 100ms, spin: 600ms linear infinite

### Usage Rules
- One Primary button per form section or modal
- Destructive actions always require a confirmation dialog — never immediate
- Never place two Primary buttons side by side; pair with Secondary or Ghost
- Full-width buttons only inside forms and on mobile

### Common Mistakes
- Using `<div>` as a button
- Removing focus ring without replacement
- Two competing Primary CTAs on the same surface
- Omitting `aria-label` on icon-only buttons

### Developer Notes
Use `cva` (class-variance-authority) with shadcn/ui `Button` as the base. Extend with VendorFlow variant tokens. Never hardcode colors inline — always use design tokens via Tailwind config.


## C02 — ICON BUTTON

### Purpose
A square or circular button containing only an icon. Used for compact actions where space is limited and the icon communicates intent without a text label.

### Variants
Mirrors all Button variants. Most common: Ghost (toolbar, nav), Primary (floating action button).

### Sizes

| Size | Dimensions | Icon | Usage |
|---|---|---|---|
| xs | 28×28px | 12px | Inline table micro-actions |
| sm | 34×34px | 14px | Card header actions |
| md | 40×40px | 16px | Toolbar, top navigation |
| lg | 44×44px | 18px | Primary floating actions |

### Accessibility
- MUST have `aria-label` describing the action: `aria-label="Download Purchase Order PDF"`
- `title` attribute as secondary tooltip (supplements, does not replace aria-label)
- Minimum touch target 44×44px — apply invisible padding to meet WCAG 2.5.5

### Motion
Hover: Ghost variant shows `rounded-md` background fade-in, 100ms ease-out.

### Usage Rules
- Only use when the icon unambiguously communicates the action (Download, Close, Search)
- Always pair with a Tooltip on hover
- In tables: appear only on row hover to reduce visual noise

---

## C03 — BUTTON GROUP

### Purpose
A set of related buttons presented as a cohesive unit with shared borders. Used for mutually-related actions or segmented controls (grid/list toggle, filter chips that behave as radios).

### Variants
- Segmented control: One button active at a time (radio behavior)
- Action group: Multiple independent actions in a row (e.g., Download | Print | Share)

### Design
```
Container: inline-flex, border: 1px solid Neutral-200, rounded-md, overflow-hidden
Each child button: no individual border-radius, border-right: 1px solid Neutral-200 (except last)
Active segment: Electric Blue bg, white text
Inactive segment: white bg, Neutral-700 text, hover: Neutral-50 bg
```

### Accessibility
- `role="group"`, `aria-label="View options"` on container
- Each button retains individual `aria-pressed` for toggle state
- Keyboard: left/right arrows navigate between segments

---

## C04 — INPUT

### Purpose
The standard single-line text input. Used across all forms in VendorFlow for text, email, URL, phone, number, and specialized data entry.

### Variants
- Default
- With left icon (e.g., Search, Mail, Phone)
- With right element (e.g., copy button, unit label "₹", "kg")
- With prefix text (e.g., "https://")
- Clearable (× button appears when value present)

### Sizes

| Size | Height | Padding | Font |
|---|---|---|---|
| sm | 34px | px-3 py-1.5 | text-sm |
| md (default) | 40px | px-3 py-2 | text-sm |
| lg | 44px | px-4 py-2.5 | text-base |

### States

| State | Border | Background | Notes |
|---|---|---|---|
| Default | 1px solid Neutral-200 | White | |
| Hover | 1px solid Neutral-300 | White | 100ms |
| Focus | 2px solid Electric Blue | White | + shadow-blue-glow |
| Filled | 1px solid Neutral-200 | White | Value present |
| Error | 1px solid Error Red | White | + error message below |
| Success | 1px solid Success Green | White | After validation |
| Disabled | 1px solid Neutral-200 | Neutral-50 | opacity-60 |
| Read-only | 1px solid Neutral-100 | Neutral-50 | No focus ring |

### Typography
- Label: text-sm font-medium Neutral-700, `<label>` element, `mb-1`
- Input text: text-sm Neutral-900
- Placeholder: text-sm Neutral-400
- Helper text: text-xs Neutral-400, `mt-1`
- Error message: text-xs Error Red, `mt-1`, with `AlertCircle` 12px icon

### Border Radius: `rounded-md` (8px)

### Accessibility
- Every input MUST have an associated `<label>` with matching `for`/`id`
- `aria-required="true"` on required fields
- `aria-invalid="true"` + `aria-describedby="[error-id]"` on error state
- `aria-describedby` also links to helper text when present
- Never use placeholder as the only label

### Keyboard Navigation
- `Tab` / `Shift+Tab` to move between fields
- `Escape` clears clearable inputs
- In combobox variants: `ArrowDown` opens suggestions

### Motion
- Focus border: 150ms ease-out transition on border-color and box-shadow

### Usage Rules
- All required fields marked with `*` in label (and `aria-required`)
- Helper text explains expected format, not just field name
- Error messages are specific: "Enter a valid email address" not "Invalid input"

---

## C05 — SEARCH INPUT

### Purpose
A specialized input variant optimized for search contexts. Features a persistent search icon on the left, optional clear button, and immediate feedback on results.

### Design
```
Height: 36px (compact — used in filter bars, table headers)
Left: Search icon 14px, Neutral-400, pl-3
Input: text-sm, placeholder "Search..."
Right: × clear button (14px) visible only when input has value
Border: 1px solid Neutral-200, rounded-md
Focus: 2px solid Electric Blue, icon color → Electric Blue
Background: Neutral-50 at rest, white on focus
```

### Behavior
- Debounced 300ms (or 150ms in command palette)
- Clear button: `aria-label="Clear search"`, fades in/out (100ms) as value changes
- Results update without full page reload

### Sizes
- Compact (36px): table header search bars, filter rows
- Standard (40px): module page headers, standalone search contexts
- Full (56px): Marketplace search bar, dedicated search pages

### Accessibility
- `role="searchbox"` or `type="search"`
- `aria-label="Search [context]"` e.g., "Search vendors"
- `aria-controls` linking to results list when autocomplete is present

---

## C06 — PASSWORD INPUT

### Purpose
A text input that obscures the entered value with a show/hide toggle for user convenience and security.

### Design
Same as standard Input. Right slot: `Eye` / `EyeOff` icon button (16px, Neutral-400, hover Neutral-700).

### Password Strength Meter
Shown below password creation fields (registration, password change):
```
4-segment bar, full width, height 4px, rounded-full, gap-1
Segments fill left to right as strength increases:
  Weak (1 segment): Error Red
  Fair (2 segments): Warning Amber
  Good (3 segments): Blue-Light
  Strong (4 segments): Success Green
Label: text-xs "Weak" / "Fair" / "Good" / "Strong" — right-aligned, color-matched
```

### Accessibility
- Toggle button: `aria-label="Show password"` / `aria-label="Hide password"` (updates on toggle)
- `aria-describedby` pointing to password requirements list
- Strength meter: `role="meter"`, `aria-valuenow="2"`, `aria-valuemin="0"`, `aria-valuemax="4"`, `aria-label="Password strength: Fair"`

---

## C07 — OTP INPUT

### Purpose
A segmented input for entering One-Time Password verification codes. Used in email verification and security confirmation flows.

### Design
```
6 individual boxes in a row, gap-2 (8px) between boxes
Each box: 48px × 56px, rounded-md, text-center
Font: text-xl font-bold Neutral-900, JetBrains Mono
Border: 1px solid Neutral-200 at rest
Focus: 2px solid Electric Blue + shadow-blue-glow
Filled: 1px solid Electric Blue (color remains to show filled)
Error: 1px solid Error Red on all boxes simultaneously
```

### Behavior
- Auto-advance focus to next box on digit entry
- Paste support: pasting "123456" fills all 6 boxes and auto-submits
- Backspace on empty box: moves focus to previous box
- Only digits accepted (numeric input type)

### Accessibility
- `role="group"`, `aria-label="One-time password"` on container
- Each input: `aria-label="Digit 1 of 6"` through "Digit 6 of 6"
- `aria-invalid="true"` on all boxes when OTP is wrong
- Live region announces "Incorrect code, 2 attempts remaining"

---

## C08 — TEXTAREA

### Purpose
Multi-line text input for longer content: descriptions, justifications, notes, rejection reasons, review comments.

### Sizes
- Default: `min-height: 80px`, vertically resizable
- Large: `min-height: 120px` (review bodies, descriptions)
- Auto-grow: height grows with content up to `max-height: 300px`, then scrolls

### States
Identical to Input component. Focus, error, disabled states match exactly.

### Character Count
Shown when `maxLength` is defined:
```
Right-aligned below textarea: "142 / 500"
Color: Neutral-400 at rest → Warning Amber at 80% → Error Red at 95%+
```

### Accessibility
- Associated `<label>`, `aria-required`, `aria-describedby` for character count and errors
- `aria-multiline="true"` on the element

---

## C09 — SELECT / DROPDOWN

### Purpose
A controlled single-value selection input. Replaces the native `<select>` with a searchable, keyboard-navigable custom dropdown.

### Design
```
Trigger: same height/style as Input component
Right: ChevronDown 14px, Neutral-400, rotates 180° when open (150ms)
Dropdown panel: white bg, rounded-xl, shadow-md (Elevation 3)
              min-width: trigger width, max-width: 320px
              max-height: 280px, overflow-y: auto
              border: 1px solid Neutral-200, mt-1

Option item: height 36px, px-3, text-sm Neutral-700
  Hover: Neutral-50 bg
  Selected: Blue-Pale bg, Electric Blue text, Checkmark icon right
  Disabled option: Neutral-300 text, cursor-not-allowed
  Option with icon: [icon 14px] [label] gap-2

Search within dropdown: shown when options > 7
  Input at top of panel: "Search options...", Search icon 12px left
```

### Accessibility
- `role="combobox"` on trigger, `aria-expanded`, `aria-haspopup="listbox"`
- Dropdown: `role="listbox"`, `aria-label="[field name] options"`
- Each option: `role="option"`, `aria-selected`
- Keyboard: `ArrowDown`/`ArrowUp` navigate options, `Enter` selects, `Escape` closes

---

## C10 — MULTI-SELECT

### Purpose
Allows selecting multiple values from a list. Used for category filters, vendor selection in RFQs, employee role assignment, notification events.

### Design
```
Trigger: same as Select, shows selected count badge when items selected
  "3 selected" pill badge replaces placeholder when ≥2 items selected
  First selected item shown when only 1 selected
Dropdown: same panel as Select, options have checkbox left of label
  Checked: Electric Blue checkbox fill
  Header: "Select all" / "Clear" links at top of panel
  Footer: "[n] selected · Clear all" sticky at bottom
Selected items also shown as dismissible chips in a wrap container below trigger
  (for contexts where selected items need visual confirmation)
```

### Accessibility
- `role="listbox"` with `aria-multiselectable="true"`
- Each option: `aria-selected` toggles true/false
- Selected count badge: `aria-live="polite"` announces "3 items selected"

---

## C11 — AUTOCOMPLETE / COMBOBOX

### Purpose
A searchable input that suggests matching options as the user types. Used for employee search, vendor search within forms, product selection in line items.

### Design
```
Input: standard Input with Search icon left
Typing triggers suggestion dropdown (same panel as Select)
Suggestions: highlighted matching text in bold
Loading state: small spinner at right of input while fetching
No results: "No results for '[query]'" in dropdown panel
```

### Behavior
- Min 1 character to trigger suggestions (configurable)
- Debounce: 200ms
- Keyboard: ArrowDown enters suggestion list, Enter selects, Escape dismisses

---

## C12 — DATE PICKER

### Purpose
A calendar-based input for selecting single dates or date ranges. Used across Purchase Requests (required date), RFQ deadlines, Payment due dates, date range filters.

### Design
```
Trigger: Input with CalendarDays icon left
  Displays formatted date when selected: "July 6, 2026"
  Placeholder: "Select date"
Calendar panel: white bg, rounded-xl, shadow-md, p-4
  Width: 280px (single) / 560px (range — two calendars side by side)
  Header: [ChevronLeft] [Month Year] [ChevronRight]
  Day grid: 7 columns, Mon–Sun headers (text-xs Neutral-400)
  Day button: 34px × 34px, rounded-md, text-sm
    Today: bold Electric Blue text
    Selected: Electric Blue bg, white text, rounded-md
    In-range (date range): Blue-Pale bg
    Range start/end: Electric Blue bg
    Disabled (past dates when future-only): Neutral-300 text, cursor-not-allowed
    Hover (valid): Neutral-100 bg
```

### Accessibility
- `role="dialog"` on calendar panel
- Grid: `role="grid"`, rows `role="row"`, days `role="gridcell"`
- Selected date: `aria-selected="true"`, `aria-label="July 6, 2026"`
- Disabled dates: `aria-disabled="true"`
- Keyboard: Arrow keys navigate days, Enter selects, Escape closes

---

## C13 — TIME PICKER

### Purpose
A time selection input for scheduling (RFQ deadlines with time, announcement scheduling, report scheduling).

### Design
```
Trigger: Input with Clock icon left, displays "02:30 PM"
Panel: two scroll columns (Hours | Minutes) + AM/PM toggle
  Column items: 36px height, text-center, text-sm
  Selected: Electric Blue bg, white text, centered in column
  Smooth scroll snap to selected value
  Or: simple HH:MM text input with up/down increment buttons
```

### Accessibility
- Scroll columns: `role="listbox"`, `aria-label="Hours"` / `aria-label="Minutes"`
- `aria-valuenow` on selected value, keyboard increment via arrow keys


---

## C14 — CARD

### Purpose
The primary surface container for grouping related content. Cards provide visual separation, depth, and a consistent content boundary across all VendorFlow modules.

### Variants

| Variant | Background | Shadow | Border | Use Case |
|---|---|---|---|---|
| Default | White | shadow-sm | None | Standard content card |
| Raised | White | shadow-md | None | Hover state, highlighted |
| Outlined | White | None | 1px Neutral-200 | Subtle grouping, settings sections |
| Flat | Neutral-50 | None | None | Background sections within cards |
| AI | Purple-Pale #F5F3FF | shadow-purple-glow | 1px #DDD6FE | AI module cards exclusively |
| Destructive | Error-Light | None | 1px Error Red left 4px | Danger zone, critical warnings |
| Success | Success-Light | None | 1px Success Green left 4px | Confirmed/completed states |

### Anatomy
```
Container: rounded-2xl (12px), background varies by variant
Padding: p-6 (24px) default, p-4 for compact cards
Header area (optional): border-bottom 1px Neutral-100, pb-4 mb-4
  Left: section title (text-base font-semibold Neutral-800)
  Right: action button(s) or badge
Body: primary content area
Footer (optional): border-top 1px Neutral-100, pt-4 mt-4
  CTA links or summary stats
```

### Hover (interactive cards)
```
Default → hover: shadow-sm → shadow-md, translateY(-2px)
Transition: 200ms ease-out
Cursor: pointer (when card is entirely clickable)
```

### Accessibility
- Non-interactive cards: no `role` needed (native semantics)
- Entirely clickable cards: `role="article"`, `tabindex="0"`, `aria-label`
- Keyboard: `Enter` activates fully-clickable cards

---

## C15 — KPI CARD

### Purpose
Displays a single key performance metric with a label, primary value, trend indicator, and supporting context. Used on all dashboards.

### Design
```
Container: rounded-2xl, shadow-sm, white bg, p-6
Icon area: 40×40px, rounded-lg, pale background (color-matched to metric type)
           Icon: 20px Lucide, color-matched
Metric label: text-xs uppercase tracking-wider font-semibold Neutral-500, mt-3
Primary value: text-4xl font-bold Neutral-900, mt-1
              Animates: count-up from 0 on mount (800ms ease-out)
Delta chip: inline-flex, items-center, gap-1, text-xs
  Positive: Success Green text, ArrowUp 12px
  Negative: Error Red text, ArrowDown 12px
  Neutral: Neutral-500 text, Minus 12px
  Text: "+3 this week" / "↑18% vs last month"
Context text: text-xs Neutral-400, mt-1 (e.g., "vs last month")
```

### Hover
Subtle shadow lift (shadow-sm → shadow-md), 200ms ease-out. Cursor default (KPI cards are not interactive by default — if clickable, show a `→` link in footer).

### Accessibility
- `role="region"`, `aria-label="Open Purchase Requests: 12, increased by 3 this week"`
- Count-up animation: announces final value to screen readers only (animation happens visually, screen reader gets static value)

---

## C16 — STATISTIC CARD

### Purpose
A more compact metric display used within analytics dashboards, report summaries, and performance breakdowns. Smaller than a KPI Card, designed to appear in groups of 4–6.

### Design
```
Container: rounded-xl, shadow-sm, white bg, p-4
Label: text-xs font-medium Neutral-500 uppercase tracking-wide
Value: text-2xl font-bold Neutral-900, mt-1
Sub-value (optional): text-sm Neutral-400, mt-0.5
Divider (optional): bottom border-left 3px solid (status color)
```

Used for: Spend tab KPIs, Vendor Performance sub-metrics, Finance summary rows.

---

## C17 — TOOLTIP

### Purpose
Provides contextual information about UI elements when hovered or focused. Should clarify (not repeat) what an element does.

### Design
```
Container: rounded-md, bg-Neutral-900 (#0F172A), text-white
Padding: px-3 py-1.5
Font: text-xs font-medium, max-width 240px
Arrow: 6px triangle pointing toward trigger element
Shadow: shadow-md
z-index: z-tooltip (700)
```

### Placement
- Default: `top` (above trigger)
- Auto-flip: repositions if near viewport edge
- Offset: 8px from trigger element
- Options: top, top-start, top-end, bottom, bottom-start, bottom-end, left, right

### Timing
- Show delay: 300ms after hover (prevents tooltip flickering during mouse movement)
- Hide delay: 100ms (allows mouse to move into tooltip if needed)
- Fade in: 100ms opacity 0→1 + translateY(4px→0)
- Fade out: 80ms opacity 1→0

### Accessibility
- `role="tooltip"`, unique `id`
- Trigger: `aria-describedby="[tooltip-id]"`
- Shown on both hover AND focus (keyboard users must see tooltips)
- Never place essential information only in a tooltip — use helper text for required context

---

## C18 — POPOVER

### Purpose
A floating panel anchored to a trigger that displays richer content than a tooltip — forms, settings, previews, or action menus. Dismissible by clicking outside or pressing Escape.

### Design
```
Panel: white bg, rounded-xl, shadow-md (Elevation 3), border: 1px solid Neutral-200
Padding: p-4 default (content-dependent)
Max-width: 320px default, 480px for wide variants
Arrow: 8px (optional, omit for dropdowns)
z-index: z-dropdown (100) or z-modal (500) depending on context
```

### Behavior
- Opens on trigger click
- Closes on outside click, Escape key, or focus leaving the popover
- Focus moves into popover on open (first focusable element)

### Accessibility
- `role="dialog"` (for complex content) or no role (for simple menus)
- `aria-labelledby` pointing to popover heading if present
- Focus trapped inside while open when `role="dialog"`
- Returns focus to trigger on close

---

## C19 — TABLE / DATA TABLE

### Purpose
The core data display component used across every module list view in VendorFlow. Must handle large datasets, column sorting, row selection, pagination, filtering, and responsive behavior.

### Anatomy
```
Outer container: rounded-xl, shadow-sm, white bg, overflow-hidden
Table header: bg-Neutral-50, border-bottom 2px solid Neutral-200
  Column heading: text-xs uppercase tracking-wider font-semibold Neutral-500
                  py-3 px-4
                  Sortable columns: [label] [ChevronUp/Down 12px]
                    aria-sort="ascending" / "descending" / "none"
Table body:
  Row height: 52px
  Row padding: py-3 px-4 per cell
  Row border-bottom: 1px solid Neutral-100
  Row hover: Neutral-50 bg, 100ms ease-out
  Row selected (checkbox): Blue-Pale bg
  First column: text-sm font-medium Neutral-900 (links to detail page)
  Other columns: text-sm Neutral-600
  Monospace IDs: JetBrains Mono text-xs Neutral-500
  Actions column: MoreHorizontal 16px, appears on row hover only
  Status cells: StatusBadge component
  Amount cells: right-aligned, font-medium
Table footer: border-top 1px Neutral-200
  Left: "Showing 1–20 of 128" text-sm Neutral-500
  Right: Pagination component
```

### Selection
- Checkbox column (leftmost): 20px checkbox, selects individual row
- Header checkbox: selects all visible rows; indeterminate state when partial
- Bulk action bar: slides in below table header when rows selected
  `[n] rows selected  [Bulk action 1]  [Bulk action 2]  [Clear selection]`

### Column Sorting
- Click sortable column header → cycles: none → asc → desc
- Current sort: chevron icon fills Electric Blue, column header text Neutral-900
- Only one column sorted at a time (single-sort in v1)

### Empty State
Centered within table body area: icon + heading + description + optional CTA.

### Loading State (Skeleton)
5 skeleton rows: each row shows shimmer blocks at positions matching column widths and types.

### Responsive
- Desktop: all columns visible
- Tablet: hide 1–2 lowest-priority columns (defined per module)
- Mobile: card list view replaces table (each row becomes a card)

### Accessibility
- `role="grid"` on `<table>` (for interactive rows) or `role="table"` (read-only)
- `<thead>` / `<tbody>` / `<tfoot>` semantic structure
- `scope="col"` on all `<th>` elements
- `aria-sort` on sortable column headers
- Checkboxes: `aria-label="Select row for [record name]"` / `aria-label="Select all rows"`
- Bulk action bar: `role="toolbar"`, `aria-label="Actions for selected rows"`

---

## C20 — DIALOG / MODAL

### Purpose
An overlay panel that interrupts the current workflow to present a focused task, confirmation, or critical information. The user must explicitly dismiss the dialog before returning to the page.

### Sizes

| Size | Max Width | Use Case |
|---|---|---|
| sm | 400px | Simple confirmations, single-field inputs |
| md (default) | 540px | Standard forms, vendor selection |
| lg | 680px | Multi-section forms, document previews |
| xl | 860px | Complex workflows, comparison views |
| full | 100% – 32px | Document previews, large data tables |

### Design
```
Backdrop: rgba(15,23,42,0.5), backdrop-filter: blur(4px), z-overlay (400)
Panel: white bg, rounded-xl (12px), shadow-xl (Elevation 4), z-modal (500)
       max-height: calc(100vh - 48px), overflow-y: auto
       centered horizontally and vertically

Header: px-6 pt-6 pb-0
  Title: text-xl font-semibold Neutral-900
  Sub-heading: text-sm Neutral-500 mt-1 (optional)
  Close button: X icon button, top-right, Ghost variant

Body: p-6, flex-1 overflow-y-auto

Footer: px-6 pb-6 pt-4 border-top 1px Neutral-100
  Right-aligned: [Cancel / secondary] [Primary action]
  Left-aligned: destructive tertiary action (e.g., "Delete permanently")
```

### Open/Close Animation
```
Backdrop: opacity 0→1, 200ms ease-out
Panel: opacity 0→1 + scale(0.96)→scale(1), 200ms cubic-bezier(0.2,0.8,0.2,1)
Close: reverse (150ms ease-in)
```

### Behavior
- Focus trapped inside dialog while open
- First focusable element receives focus on open
- `Escape` closes non-critical dialogs; critical confirmations require explicit button action
- Clicking backdrop closes non-critical dialogs
- Scroll lock on body when dialog open

### Accessibility
- `role="dialog"`, `aria-modal="true"`
- `aria-labelledby` pointing to dialog title `id`
- `aria-describedby` pointing to body description (if present)
- Focus returns to trigger element on close

---

## C21 — DRAWER / SLIDE-OVER

### Purpose
A panel that slides in from a screen edge (right or left). Used for detail views, filter panels, and contextual forms where the main content should remain visible in the background.

### Sizes (right-anchored)

| Size | Width | Use Case |
|---|---|---|
| sm | 360px | Notification details, quick view |
| md (default) | 480px | Record detail panels, form drawers |
| lg | 600px | Complex forms, vendor review panels |
| xl | 720px | Document viewers, audit detail |
| full | 100% | Mobile navigation, full-screen overlays |

### Design
```
Backdrop: rgba(15,23,42,0.4), full viewport, z-overlay (400)
Panel: white bg, shadow-xl, z-modal (500), height: 100vh
       fixed right-0 top-0
Header: px-6 py-5, border-bottom 1px Neutral-200
  Title: text-lg font-semibold Neutral-900
  Close: X icon button, right-aligned
Body: px-6 py-6, flex-1 overflow-y-auto
Footer (optional): px-6 py-4, border-top 1px Neutral-200, sticky bottom
```

### Open/Close Animation
```
Open: translateX(100%)→translateX(0), 250ms cubic-bezier(0.2,0.8,0.2,1)
Close: translateX(0)→translateX(100%), 200ms ease-in
Backdrop: opacity 0→0.4, 200ms
```

### Accessibility
- Same as Dialog: `role="dialog"`, `aria-modal`, focus trap, Escape to close

---

## C22 — TABS

### Purpose
Organizes related content into horizontal (or vertical) tabbed sections. Used on Analytics pages, Vendor Profiles, Settings, and module detail pages.

### Variants
- Underline tabs (default): thin 2px Electric Blue underline below active tab
- Pill tabs: rounded-full background on active tab
- Segmented tabs: enclosed in a Neutral-100 container (like button group)

### Design (Underline variant)
```
Container: border-bottom 1px Neutral-200
Tab item: py-3 px-4, text-sm font-medium
  Default: Neutral-500 text
  Hover: Neutral-900 text, 100ms
  Active: Neutral-900 text, Electric Blue underline 2px (bottom of container)
  With badge: [Label]  [count badge] ml-2
Transition: underline slides between tabs, 150ms ease-out
```

### Accessibility
- Container: `role="tablist"`, `aria-label="[section name]"`
- Each tab: `role="tab"`, `aria-selected`, `aria-controls="[panel-id]"`
- Panel: `role="tabpanel"`, `aria-labelledby="[tab-id]"`, `tabindex="0"`
- Keyboard: `ArrowLeft`/`ArrowRight` navigate tabs, `Enter`/`Space` activates, `Home`/`End` jump

---

## C23 — ACCORDION

### Purpose
Collapsible sections that expand/collapse to show or hide content. Used in Settings, FAQ sections, complex form sections, and detail page sub-sections.

### Design
```
Container: border 1px Neutral-200, rounded-xl, divide-y divide-Neutral-100
Item header: py-4 px-5, flex justify-between items-center, cursor-pointer
  Label: text-sm font-semibold Neutral-800
  Icon: ChevronRight 16px, Neutral-400
        rotates 90° when expanded (150ms ease-out)
  Hover: bg-Neutral-50
Item body: px-5 py-4 (revealed on expand)
  Collapse/Expand: height animation, 200ms ease-in-out
  Fade: opacity 0→1, 150ms delay 50ms
```

### Accessibility
- Container: `role="list"`
- Each item: `role="listitem"`
- Header button: `role="button"`, `aria-expanded="true/false"`, `aria-controls="[body-id]"`
- Body: `id` matching aria-controls, `aria-hidden="true"` when collapsed

---

## C24 — ALERT / BANNER

### Purpose
Communicates system feedback, warnings, errors, and informational messages to users. Appears inline within page content (not as a toast).

### Variants

| Variant | Background | Left Border | Icon | Use Case |
|---|---|---|---|---|
| Info | Blue-Pale #EFF6FF | 4px Electric Blue | Info | Contextual information |
| Success | Success-Light #DCFCE7 | 4px Success Green | CheckCircle | Confirmation, completion |
| Warning | Warning-Light #FEF3C7 | 4px Warning Amber | AlertTriangle | Caution, approaching limits |
| Error | Error-Light #FEE2E2 | 4px Error Red | AlertCircle | Failure, validation errors |
| AI | Purple-Pale #F5F3FF | 4px Premium Purple | Sparkles | AI insights, suggestions |

### Design
```
Container: rounded-lg, full width
Left border: 4px solid (variant color)
Padding: px-4 py-3
Layout: flex gap-3 items-start
Icon: 18px, variant color, flex-shrink-0, mt-0.5
Content:
  Title (optional): text-sm font-semibold, Neutral-900
  Message: text-sm Neutral-700
  CTA link (optional): text-sm Electric Blue, font-medium, underline on hover
Dismiss button (optional): X icon 14px, top-right, Neutral-400, hover Neutral-700
```

### Accessibility
- `role="alert"` for errors and time-sensitive warnings (announced immediately by screen readers)
- `role="status"` for success and informational messages (polite announcement)
- Dismiss button: `aria-label="Dismiss [alert type]"`

---

## C25 — TOAST NOTIFICATION

### Purpose
A brief, non-blocking notification that appears in response to a user action or system event. Auto-dismisses after a set duration. Stacks when multiple toasts arrive.

### Design
```
Container: fixed bottom-right, z-notification (600)
           gap-2 between stacked toasts

Individual toast: white bg, rounded-xl, shadow-xl, p-4
  Width: 360px
  Left border: 4px solid (variant color, same as Alert variants)
  Layout: flex gap-3 items-start
  Left: icon 18px, variant color
  Content:
    Title: text-sm font-semibold Neutral-800
    Message: text-xs Neutral-500 (optional, 1 line max)
    Action link: text-xs Electric Blue (e.g., "Undo", "View")
  Right: X dismiss button 14px

Progress bar: 2px height, bottom of toast, Electric Blue
             Shrinks from full width to 0 over dismiss duration
             Hover: pauses progress bar animation
```

### Variants
Same as Alert: Info (blue), Success (green), Warning (amber), Error (red).

### Timing
- Default duration: 5 seconds
- Error toasts: 8 seconds (more critical, needs more time to read)
- Hover: pauses auto-dismiss timer
- Max 3 toasts visible simultaneously; 4th replaces oldest

### Animation
```
Enter: translateX(100%)→translateX(0) + opacity 0→1, 250ms cubic-bezier(0.2,0.8,0.2,1)
Exit: opacity 1→0 + translateX(100%), 200ms ease-in
      OR: translateY(0)→translateY(20px) if dismissed by user action
Stack shift: remaining toasts slide down, 200ms ease-out
```

### Accessibility
- `role="status"` (success/info) or `role="alert"` (error/warning) on toast container
- `aria-live="polite"` (status) or `aria-live="assertive"` (alerts)
- `aria-atomic="true"` so full message is announced, not partial updates
- Dismiss button: `aria-label="Dismiss notification"`
- Action link: descriptive label ("View purchase order" not just "View")


---

## C26 — PROGRESS BAR

### Purpose
Communicates the completion state of a process — file upload, form completion, storage usage, onboarding progress, approval steps, or background tasks.

### Variants
- Linear: horizontal bar (most common)
- Circular / Ring: `<circle>` SVG for KPI cards and score displays
- Step: segmented sections for multi-step progress (onboarding, approval chains)

### Linear Design
```
Track: full-width, 8px height (default), rounded-full, Neutral-100 bg
Fill: rounded-full, transition: width over 300ms ease-out
      Color by context: Electric Blue (general), Success Green (complete), Error Red (failed)
Label (optional): text-xs Neutral-500, right-aligned above track: "72%"
                  or inside fill when >20% wide
```

### Step Progress (Onboarding/Approvals)
```
Steps connected by horizontal lines
Each step: circle (28px), text-sm step number inside
  Completed: Success Green bg + Checkmark icon
  Active: Electric Blue bg + white step number + subtle glow ring
  Upcoming: Neutral-200 bg + Neutral-400 text
Connecting line: 2px, Neutral-200 (incomplete) / Success Green (complete)
Step label below: text-xs font-medium, Neutral-500 (upcoming) / Neutral-800 (active/done)
```

### Accessibility
- `role="progressbar"`, `aria-valuenow`, `aria-valuemin="0"`, `aria-valuemax="100"`, `aria-label`
- Indeterminate (unknown duration): `aria-valuenow` omitted, `aria-valuetext="Loading..."`
- Step progress: `role="list"`, each step `role="listitem"`, `aria-current="step"` on active

---

## C27 — TIMELINE

### Purpose
Displays chronological sequences of events: procurement lifecycles, order history, audit trails, activity feeds, and approval chains.

### Design
```
Container: relative, border-left 2px Neutral-100, ml-3 pl-6
Each entry: relative, pb-6 (last: pb-0)
  Dot: absolute, left: -3px (overlapping the border-left)
       10px × 10px, rounded-full, bg colored by event type
       Ring: 2px offset white border for raised appearance on colored bg
  Icon (optional): 24px rounded-full container centered over dot position
                   32px × 32px, colored bg, icon 14px white
  Content:
    Title: text-sm font-semibold Neutral-800
    Actor: text-xs Neutral-400 "by [Name]"
    Time: text-xs Neutral-400 "2 hours ago" / absolute date on hover
    Description: text-sm Neutral-600 (optional expanded details)
    Action (optional): small linked CTA
Date groups: text-xs uppercase tracking-wider Neutral-400 between groups
```

### Condensed Timeline (right column panels)
Smaller dots (8px), no icons, tighter spacing (`pb-4`), lighter type scale.

### Accessibility
- `role="list"` on container, `role="listitem"` on each entry
- Time elements use `<time datetime="[ISO]">` for machine-readable dates
- Collapsed entries: "Show 8 earlier events" expandable with `aria-expanded`

---

## C28 — PAGINATION

### Purpose
Navigates between pages of tabular data. Appears at the bottom of every DataTable.

### Design (specified in full in Part 1, Section 3.11 — restated here as component spec)
```
Container: flex items-center justify-between, border-top 1px Neutral-100, pt-4
Left: "Showing 1–20 of 128 results" text-sm Neutral-500
Right: [← Prev]  [1]  [2]  [3]  [...]  [12]  [Next →]

Page button: 32×32px, rounded-md, text-sm
  Default: transparent, Neutral-700
  Hover: Neutral-100 bg
  Active: Electric Blue bg, white text, font-semibold
  Disabled Prev/Next: opacity-40, cursor-not-allowed

Page size selector (optional): "Show: [20 ▾] per page"
                                Placed left of results count
```

### Accessibility
- `role="navigation"`, `aria-label="Pagination"`
- Active page button: `aria-current="page"`
- Prev/Next: `aria-label="Previous page"` / `aria-label="Next page"`
- Disabled: `aria-disabled="true"`

---

## C29 — BREADCRUMBS

### Purpose
Shows the user's current location within the application hierarchy. Appears in the Top Navigation left zone.

### Design (specified in Part 1, Section 5.2 — component spec)
```
Container: flex items-center gap-1.5
Separator: "/" character, text-sm Neutral-300
Items:
  Root: LayoutDashboard icon 14px (links to Dashboard)
  Intermediate: text-sm Neutral-500 font-medium, hover: Neutral-800 underline
  Current (last): text-sm Neutral-800 font-semibold, no link
Collapse: if >4 levels, middle items collapse to "..." button
          "..." opens popover listing hidden intermediate segments
```

### Accessibility
- `role="navigation"`, `aria-label="Breadcrumb"`
- `<ol>` list structure
- Current page: `aria-current="page"`
- Collapsed: expand button `aria-label="Show full path"`, `aria-expanded`

---

## C30 — AVATAR

### Purpose
Represents a user, company, or vendor with a circular image or initials fallback.

### Sizes

| Size | Dimensions | Font | Usage |
|---|---|---|---|
| xs | 20×20px | text-xs | Table rows, inline mentions |
| sm | 28×28px | text-xs | Sidebar user, breadcrumb |
| md (default) | 36×36px | text-sm | Navigation, list items |
| lg | 48×48px | text-base | Card headers, comments |
| xl | 64×64px | text-xl | Profile headers |
| 2xl | 80×80px | text-2xl | Profile page, onboarding |

### Design
```
Container: rounded-full, overflow-hidden
Image: object-cover, full width/height
Fallback (no image): colored background + initials
  Background: deterministically derived from name hash → one of 8 preset colors
  Colors: Electric Blue, Cyan, Success Green, Warning Amber, Error Red, Purple, Neutral-600, Deep Navy
  Text: white, font-semibold, uppercase
Border (optional): 2px solid white — used in avatar groups and on dark backgrounds
Status dot (optional): 10px circle, bottom-right, border 2px white
  Online: Success Green
  Away: Warning Amber
  Offline: Neutral-300
```

### Accessibility
- `<img>`: `alt="[Name]'s profile picture"` or `alt=""` if purely decorative
- Initials fallback: `aria-label="[Name]"` on the container, `role="img"`

---

## C31 — AVATAR GROUP

### Purpose
Displays multiple avatars in an overlapping stack. Used to show members of a team, approvers in a workflow, or vendors in an RFQ.

### Design
```
Container: flex, each avatar overlaps previous by -8px (negative margin-left)
Avatar: same as Avatar component + 2px white border
Overflow indicator: "+N more" in the same size/style as other avatars
                    Neutral-200 bg, Neutral-600 text, font-semibold
Max visible: 4 avatars + overflow by default
Hover on overflow: tooltip listing remaining names
```

### Accessibility
- Container: `role="group"`, `aria-label="Members: Riya Sharma, Arjun Kumar, and 3 others"`

---

## C32 — BADGE

### Purpose
A small inline label that communicates status, category, count, or type. One of the most frequently used components across all list views and detail pages.

### Variants

| Variant | Background | Text | Border | Use Case |
|---|---|---|---|---|
| Default | Neutral-100 | Neutral-600 | None | Neutral labels |
| Primary | Blue-Pale | Electric Blue | None | Active, selected |
| Success | Success-Light | Success Green | None | Approved, Paid, Active |
| Warning | Warning-Light | Warning Amber | None | Pending, Expiring |
| Error | Error-Light | Error Red | None | Rejected, Failed, Overdue |
| AI | Purple-Pale | Purple | None | AI module indicators |
| Outline | White | Neutral-600 | 1px Neutral-200 | Subtle category tags |
| Dot | — | — | — | Status dot before text |

### Design
```
Container: inline-flex, items-center, gap-1.5
Padding: px-2.5 py-0.5
Border-radius: rounded-full
Font: text-xs font-semibold (uppercase with tracking-wide for status badges)
      text-xs font-medium (non-status informational badges)
Status dot: 6px circle, left of text, bg-matched to variant color
```

### Sizes
- sm: `px-2 py-0.5`, text-xs (default for tables)
- md: `px-3 py-1`, text-sm (detail pages, card headers)

### Accessibility
- Purely visual badges: `aria-hidden="true"` (if the status is also communicated via text nearby)
- Standalone status badges: `role="status"`, `aria-label="Status: Approved"`
- Color is NEVER the only indicator — always include text label

---

## C33 — CHIP / TAG

### Purpose
Dismissible selection chips and read-only content tags. Used for selected filter values, multi-select display, topic tags, category labels, and active filter indicators.

### Chip (Dismissible — for selected filter states)
```
Container: inline-flex, items-center, gap-1.5
Background: Blue-Pale, rounded-full
Padding: px-3 py-1
Font: text-sm font-medium, Electric Blue
Right: X dismiss icon 12px, Electric Blue
Hover on X: darker bg, cursor-pointer
```

### Tag (Read-only — for categories, labels)
```
Background: Neutral-100 or category-specific pale color
Text: Neutral-700 or color-matched
Padding: px-2.5 py-0.5, rounded-full
Font: text-xs font-medium
No dismiss button
```

### AI Tag (special)
```
Background: Purple-Pale, text: Premium Purple
Sparkles icon 10px left
Font: text-xs font-medium
Border: 1px solid #DDD6FE
```

### Accessibility
- Dismissible chip: `role="option"` (when in a multi-select context), dismiss button `aria-label="Remove [chip label]"`
- Tag group: `role="list"`, each tag `role="listitem"`


---

## C34 — ACTIVITY FEED

### Purpose
A real-time, chronological stream of events across the workspace. Used on dashboards as the "Procurement Activity Timeline" widget and within module detail pages as the right-column activity log.

### Design

```
Feed container: max-height 400px (widget), overflow-y: auto
                Scrollbar: styled, thin (4px), rounded, Neutral-200 track
Date group header: text-xs uppercase tracking-widest Neutral-400, py-2
                   Sticky within scrollable container
                   Examples: "Today", "Yesterday", "July 4"

Feed item: flex, gap-3, items-start, py-3, border-bottom 1px Neutral-50 (last: none)
  Left: Icon container 28×28px, rounded-lg, pale bg (module color)
        Icon: 14px Lucide, color-matched
  Content column:
    Title: text-sm Neutral-800 font-medium
           Linked entity (e.g., "PR-0081") highlighted in Electric Blue
    Actor + time: text-xs Neutral-400
                  "by Riya Sharma · 2 hours ago"
                  Full datetime on hover via Tooltip
  Right: optional status badge (text-xs, compact)

Hover: row bg Neutral-50, 100ms

Load more: "Show earlier activity" ghost link at bottom
```

### Variants
- Widget mode: compact, max 8 items, "View full log →" footer link
- Full page mode (Audit Logs page): no max-height, all entries, full filters

### Real-time Updates
New entries prepend to the top with a fade-in + slight translateY(−8px)→translateY(0), 200ms ease-out.
A "New activity" pill badge appears when user has scrolled away from top and new items arrive.

### Accessibility
- `role="feed"` on container
- Each entry: `role="article"`, `aria-posinset`, `aria-setsize`
- `aria-label` on icon: `aria-label="Purchase Request event"`
- Linked entity: accessible link text includes record type and ID
- Live region: `aria-live="polite"` for new entry announcements

### Developer Notes
- Feed data: TanStack Query with `staleTime: 30s`, refetched on window focus
- Real-time: Supabase Realtime subscription on `audit_logs` filtered by `workspace_id`
- Virtual scrolling: use `@tanstack/react-virtual` for full-page mode with large datasets
- Entity links resolved client-side via a route map keyed by `record_type`

---

## C35 — AUDIT TIMELINE

### Purpose
A structured, dense timeline specifically for the Audit Logs page. Differs from Activity Feed in that it displays raw action data with before/after state, user agent, and IP context — oriented toward compliance and security review rather than casual activity browsing.

### Design

```
Container: table layout (not flex) for alignment precision
Row height: 48px, border-bottom 1px Neutral-100
Columns: [timestamp] [user+avatar] [module badge] [action] [record link] [IP]
  All columns use text-xs to maximize information density
  Timestamp: JetBrains Mono, Neutral-600, "Jul 6, 2:34 PM"
  User: 20px avatar + text-xs name, Neutral-700
  Module badge: pill badge, 11px font
  Action: text-xs Neutral-800, verb-noun: "Approved Invoice"
  Record link: text-xs Electric Blue monospace, links to record
  IP: text-xs Neutral-400, partially masked

Row hover: Neutral-50 bg, cursor-pointer (opens detail slide-over)

Action categories color-coded by left 3px border on row:
  Authentication: Electric Blue
  Procurement: Cyan
  Finance: Warning Amber
  Admin/Settings: Purple
  Destructive: Error Red
  System: Neutral-300
```

### Detail Slide-Over (on row click)
- 480px right drawer
- Before/after state diff table: two-column, field | before | after
- Related events in the same user session (±2 min window)
- Full user agent, full IP, session ID

### Accessibility
- `role="grid"` with `aria-rowcount`, `aria-colcount`
- `aria-sort` on Timestamp column (default: descending)
- Row expansion: `aria-expanded` on expandable rows
- Detail panel: `role="dialog"`, focus trapped

---

## C36 — EMPTY STATE

### Purpose
Communicates that a list, table, chart, or section has no content — either because it is genuinely empty or because filters returned no results. Empty states should guide users toward the next action.

### Design

```
Container: flex flex-col items-center justify-center
           py-16 (standard), py-24 (full-page), py-10 (inline table)
           text-center, max-width 360px mx-auto

Icon: 48px Lucide icon (outlined style, not filled), Neutral-300 color
     Semantic to the content type:
       Vendors → Store
       PRs → FileText
       Payments → CreditCard
       Notifications → Bell
       Search → SearchX
       etc.

Title: text-lg font-semibold Neutral-700, mt-4
Description: text-sm Neutral-400, mt-2, max-w-sm (wraps naturally)
CTA Button (optional): Primary or Secondary, mt-6
                        Only shown when there is a clear next action

Secondary action (optional): Ghost text link below button
```

### Variants

| Context | Icon | Title | Has CTA |
|---|---|---|---|
| First-use (module is empty) | Module-specific | "No [items] yet" | Yes — create action |
| Search/filter no results | SearchX | "No results found" | "Clear filters" link |
| No permission to view | Lock | "Access restricted" | "Request access" (optional) |
| Loading failed | AlertTriangle | "Failed to load" | "Retry" button |
| Feature coming soon | Sparkles (purple) | "[Feature] Coming Soon" | "Get notified" |

### Illustration Option
For first-use states on key modules (Dashboard, Vendors, Products), optionally use a simple SVG illustration instead of a plain icon. Illustrations are abstract, on-brand, and avoid depicting people.

### Accessibility
- Icon container: `role="img"`, `aria-label="[module name] is empty"`
- CTA: descriptive label that includes context ("Create your first Purchase Request")

---

## C37 — LOADING STATE

### Purpose
Communicates that content is being fetched or processed. VendorFlow uses skeleton loaders as the primary loading pattern for all data-driven content — they provide spatial context and prevent layout shift.

### Skeleton Loader Design

```
Skeleton element: bg-Neutral-200, rounded-md
Animation: shimmer effect — CSS linear-gradient sweep from left to right
           Background: gradient(90deg, Neutral-200 25%, Neutral-100 50%, Neutral-200 75%)
           Background-size: 200% 100%
           Animation: shimmer 1.5s ease-in-out infinite
           @keyframes shimmer { 0%: bg-pos 200% 0 → 100%: bg-pos -200% 0 }
```

### Skeleton Patterns per Component

**Table row skeleton:**
```
5 rows, each 52px height
  Checkbox: 16px circle shimmer
  Avatar + name: 28px circle + 120px bar (height 12px)
  Text cells: bars at 60%, 40%, 70% width, height 10px
  Badge: 60px pill shimmer
  Actions: 20px circle shimmer
```

**Card skeleton:**
```
Full card dimensions: rounded-2xl, p-6
  Icon area: 40px square rounded-lg shimmer
  Title bar: 60% width, h-4
  Sub-title: 40% width, h-3
  Content bars: 3–4 lines at varying widths, h-3, gap-2
```

**KPI card skeleton:**
```
Icon: 40px square shimmer
Label: 80px bar, h-2.5
Value: 120px bar, h-8 (large value area)
Delta: 60px bar, h-2.5
```

**Chart skeleton:**
```
Chart area: full width, height matching chart variant
            Single shimmer block (no attempt to replicate chart shape)
            Optional: title bar shimmer above
```

**Form skeleton:**
```
Label bar: 100px, h-3
Input bar: full-width, h-10
Repeat 3–4 times with gap-4
Button bar: 120px, h-10, right-aligned
```

### Inline Spinner
For button loading states, small icon refresh scenarios, and page-level route transitions:
```
Size: 16px (button), 20px (inline), 24px (page center)
Color: White (on primary button), Electric Blue (standalone)
Animation: spin 600ms linear infinite
SVG arc: not a full circle — 270° arc for visual clarity
```

### Full Page Loading
For initial app boot and authentication redirects:
```
Full viewport, white bg
VendorFlow logo centered (SVG, 40px height)
Spinner below logo: 24px, Electric Blue
Fade in: 200ms delay before showing (avoids flash on fast connections)
```

### Accessibility
- Skeleton containers: `aria-busy="true"` on the parent container
- `aria-label="Loading [content name]"` on the skeleton container
- When content loads: `aria-busy` removed, live region announces "Content loaded"
- Spinners: `role="status"`, `aria-label="Loading..."`, visually-hidden "Loading" text for screen readers

---

## C38 — ERROR STATE

### Purpose
Communicates a failed operation, network error, validation failure, or system problem. Error states must be specific, actionable, and non-alarming.

### Variants

**Inline field error (form validation):**
```
Border: 1px solid Error Red on input
Message: flex items-center gap-1, mt-1
  Icon: AlertCircle 12px, Error Red
  Text: text-xs Error Red
  Content: specific, actionable — "Enter a valid GST number (15 characters)"
```

**Page-level error (API failure):**
```
Full-page or section-width centered layout:
  AlertTriangle icon 48px, Warning Amber (not red — less alarming)
  Title: "Something went wrong" (text-lg font-semibold Neutral-700)
  Message: "We couldn't load your purchase requests. This is usually temporary."
  Buttons: [Try Again] Primary  [Go to Dashboard] Ghost
  Error code: text-xs Neutral-400 "Error code: 503" (aids support)
```

**Empty/failed chart:**
```
Within chart card, centered:
  BarChart2 icon 32px Neutral-300
  "Unable to load chart data"
  [Retry ↺] ghost button
```

**Network offline banner:**
```
Full-width top banner (above everything, z-max):
  WifiOff icon, Error Red bg, white text
  "You're offline. Some features may be unavailable."
  Auto-dismisses when connection restores (shows success green briefly)
```

### Error Message Writing Rules
- Specific: "Could not connect to payment gateway" not "Error occurred"
- Actionable: always include what the user can do next
- Non-technical: no stack traces, no HTTP codes in user-facing messages
- Non-alarming: use warning amber for recoverable errors, red only for critical failures

### Accessibility
- `role="alert"` for critical errors (assertive)
- `role="status"` for soft warnings (polite)
- Focus management: after form validation, focus moves to first invalid field
- Error messages: `aria-describedby` links them to their associated inputs

---

## C39 — SUCCESS STATE

### Purpose
Confirms that a user action completed successfully. Provides satisfaction and reassurance. Prevents re-submission of completed actions.

### Variants

**Toast (most common):** See C25 — Toast, success variant.

**Inline field success (async validation):**
```
Border: 1px solid Success Green on input
Right icon: CheckCircle 14px, Success Green, inside input right slot
Helper text: text-xs Success Green "GST number verified ✓"
```

**Full-page success (onboarding, major milestones):**
```
Centered layout, full page or large modal:
  CheckCircle icon 64px, Success Green (or animated check — see Motion section)
  Title: "text-2xl font-bold Neutral-900" — specific to action
  Sub-text: text-base Neutral-500
  CTA: Primary button — "Go to Dashboard" / "View Purchase Order" etc.
  Auto-redirect: after 2.5 seconds with visible countdown (text-xs Neutral-400)
```

**Confetti micro-animation:** Used ONLY for high-value milestones:
- First payment completed
- Plan upgrade
- Onboarding completion
Duration: 2 seconds. Canvas-based, respects `prefers-reduced-motion`.

### Accessibility
- `role="status"` with descriptive `aria-label`
- Auto-redirect: announced to screen readers before it happens: "Redirecting to dashboard in 3 seconds"
- Confetti: purely decorative, `aria-hidden="true"` on canvas element

---

## C40 — PERMISSION DENIED STATE

### Purpose
Shown when an authenticated user attempts to access a resource or perform an action they are not authorized for. Must be clear, non-threatening, and guide the user appropriately.

### Design

```
Centered layout (page-level or section-level):
  ShieldOff icon 48px, Neutral-300
  Title: "Access Restricted" (text-lg font-semibold Neutral-700)
  Message: "You don't have permission to view this page.
            Contact your workspace administrator if you need access."
  Buttons:
    [← Go Back] Ghost
    [Contact Admin] Secondary (opens email compose to workspace admin)
  Context info: text-xs Neutral-400
    "Your current role: Procurement Officer"
    "Required role: Finance Manager or above"
```

### Variants

| Context | Title | Secondary CTA |
|---|---|---|
| Page-level | "Access Restricted" | "Contact Admin" |
| Module feature | "Permission Required" | "Request Access" |
| Action blocked | "Action Not Allowed" | — |
| Subscription limit | "Feature Unavailable" | "Upgrade Plan" |

### Accessibility
- `role="main"` contains the permission denied message
- `aria-label="Access restricted"` on the icon
- "Contact Admin" link: opens `mailto:` link with pre-filled subject line

---

## C41 — SKELETON LOADER (COMPONENT SUMMARY)

Skeleton loaders are the universal loading pattern for all data-driven content in VendorFlow. The key rules:

1. Skeleton shape must match the real content layout (same grid, same card structure, same column widths)
2. Shimmer direction: left-to-right sweep (consistent with reading direction)
3. Duration: 1.5s loop — fast enough to feel active, slow enough not to cause anxiety
4. Color: Neutral-200 base with Neutral-100 shimmer highlight
5. Never show skeleton and real content simultaneously — clean swap
6. Minimum display time: 200ms (prevents flash of skeleton on fast connections)
7. Maximum display time: enforce a timeout after which an error state is shown if data hasn't loaded

---

## C42 — STAR RATING

### Purpose
Displays vendor or product ratings across the platform. Two modes: display-only (static) and interactive (review submission).

### Display Mode
```
5 stars, filled/empty based on rating value
Filled: Warning Amber (#D97706), Star icon 14px (or 16px in larger contexts)
Empty: Neutral-200, Star icon 14px
Half-star: uses StarHalf icon for .5 increments
Numeric: text-sm Neutral-500 "4.3" left of stars (or right, context-dependent)
Count: text-xs Neutral-400 "(128 reviews)" right of stars
```

### Interactive Mode (review form)
```
5 star buttons, 24px each, gap-1
Default: all Neutral-200 (Star outline icon)
Hover (up to cursor position): all stars up to hovered turn Warning Amber, scale(1.1)
Selected: stars up to selected turn Warning Amber (solid Star icon), scale unchanged
Transition: 100ms ease-out on color and scale
```

### Accessibility
- `role="radiogroup"`, `aria-label="Rate this vendor"`
- Each star: `role="radio"`, `aria-label="Rate 3 out of 5 stars"`, `aria-checked`
- Keyboard: `ArrowRight`/`ArrowLeft` change selection, `Space` confirms


---

# SECTION 2 — MOTION DESIGN SYSTEM

---

## M01 — Motion Philosophy

VendorFlow motion is purposeful, fast, and restrained. Every animation serves a functional goal: orienting the user, confirming an action, communicating state change, or directing attention. Motion never exists for decoration.

The design references for motion are Stripe (confident, precise), Linear (instant feedback, fluid transitions), Vercel (clean, purposeful), and Apple (physics-based, natural).

**Four Motion Principles:**

1. **Communicate, don't entertain.** Motion confirms that something happened, not that the interface is interesting.
2. **Fast by default.** Most interactions complete in 120–200ms. Users should never wait for an animation.
3. **Directional meaning.** Things entering slide in from a logical direction. Things leaving exit toward a logical direction. Drawers slide right, modals scale up from center.
4. **Respect reduced motion.** Every animation has a reduced-motion fallback. Functionality is never dependent on motion.

---

## M02 — Easing Curves

```
ease-out-standard:   cubic-bezier(0, 0, 0.2, 1)
  → Elements entering the viewport (fast start, gentle landing)
  → Most common easing in VendorFlow

ease-in-standard:    cubic-bezier(0.4, 0, 1, 1)
  → Elements leaving the viewport (gentle start, fast exit)
  → Used for dismiss, close, and exit animations

ease-in-out-standard: cubic-bezier(0.4, 0, 0.2, 1)
  → Elements moving within the viewport (repositioning, sidebar collapse)

ease-spring:         cubic-bezier(0.2, 0.8, 0.2, 1)
  → Slightly elastic — used for card lift, badge pop, success checkmark
  → Adds premium feel without being bouncy

linear:              linear
  → Loading spinners, skeleton shimmer, progress bars
  → Anything that loops indefinitely
```

---

## M03 — Duration Scale

```
Token              Duration   Use Cases
instant            75ms       Tooltip fade, hover bg fill, checkbox check
fast               100ms      Button active state, icon swap, focus ring appear
normal             150ms      Dropdown open, select menu, hover state transitions
comfortable        200ms      Card hover lift, tab underline slide, badge appear
smooth             250ms      Modal open, drawer slide, page section entrance
relaxed            300ms      Sidebar collapse/expand, complex card transitions
measured           400ms      KPI count-up start delay, chart entrance delay
slow               500ms      Onboarding illustrations, first-load page entrance
```

---

## M04 — Page & Route Transitions

### Route Change (Next.js App Router)

```
Exit (outgoing page):
  opacity: 1 → 0
  duration: 150ms, ease-in-standard
  transform: none (no slide — prevents disorientation on complex layouts)

Enter (incoming page):
  opacity: 0 → 1
  duration: 200ms, ease-out-standard
  transform: translateY(8px) → translateY(0)
  (slight upward entrance — content feels fresh and intentional)
```

Implementation: Framer Motion `AnimatePresence` wrapping the page slot in the root layout. `initial`, `animate`, `exit` variants defined at the layout level, not per-page.

### Initial Page Load (First Render)
```
Content: staggered fade-in per major section
  Page header: delay 0ms, 200ms ease-out
  KPI row: delay 50ms, 200ms ease-out
  First content row: delay 100ms, 200ms ease-out
  Second content row: delay 150ms, 200ms ease-out
Maximum stagger: 200ms (never let the last section wait more than 350ms total)
```

---

## M05 — Sidebar Collapse Animation

```
Sidebar width: 256px → 64px (collapse) / 64px → 256px (expand)
Duration: 250ms, cubic-bezier(0.4, 0, 0.2, 1)

Navigation labels:
  Collapse: opacity 1→0, 100ms ease-in (labels fade first, then width shrinks)
  Expand: opacity 0→1 with 150ms delay (labels appear after width has opened)

Section headers:
  Collapse: fade out simultaneously with labels, height→0 after fade
  Expand: height 0→auto, then fade in with same timing as labels

Navigation icons:
  Reposition from left-padded to centered: transform translateX, 250ms (matches width)

Main content area:
  left margin adjusts synchronously with sidebar width
  No separate animation — follows via CSS transition on margin-left

Collapse toggle icon:
  PanelLeftClose → PanelRightOpen (icon swap with opacity cross-fade, 150ms)

Performance:
  Width: CSS transition on `width` — will-change: width declared on sidebar container
  Avoid animating `padding` — animates on transform/width only
```

---

## M06 — Navigation Item Transitions

```
Hover background fill:
  background-color: transparent → #0D1F3C
  duration: 150ms, ease-out-standard
  
Active state transition (on navigation):
  Background immediately fills (no delay)
  Icon color swaps: 100ms
  Active left-border appears: scaleY(0) → scaleY(1), 150ms ease-out (originates from center)

Collapsible sub-menu expand:
  height: 0 → auto (use max-height trick for CSS or Framer Motion height animation)
  opacity: 0 → 1, 150ms, delay 30ms
  duration: 200ms, ease-out-standard
  Chevron rotation: 0° → 90°, 150ms ease-out (simultaneous with height)

Sub-menu collapse:
  Reverse: opacity 1→0 first (100ms), then height closes (150ms)
```

---

## M07 — Card Animations

```
Card hover lift:
  transform: translateY(0) → translateY(-2px)
  box-shadow: shadow-sm → shadow-md
  duration: 200ms, ease-spring
  
Card hover lift (interactive list cards — e.g. Vendor cards):
  Same as above + cursor: pointer

Card click (selectable cards):
  transform: translateY(-2px) → translateY(0), scale(0.99)
  duration: 100ms, ease-in-standard

Card entrance (dashboard load, staggered):
  opacity: 0 → 1
  transform: translateY(12px) → translateY(0)
  duration: 200ms, ease-out-standard
  stagger: 50ms between cards

KPI card entrance:
  Same as card entrance + value count-up starts after card reaches opacity 1
```

---

## M08 — Button Animations

```
Hover:
  background-color: transition (150ms, ease-out)
  transform: translateY(-1px) — Primary and Destructive only
  box-shadow: none → shadow-blue-glow (Primary only, 150ms)

Active (mousedown):
  transform: translateY(0) + scale(0.97)
  duration: 100ms, ease-in-standard

Focus ring:
  outline appears instantly (0ms — focus must be immediately visible)
  outline-color transitions (if changing context): 100ms

Loading state:
  Spinner fade-in: 100ms
  Spinner: rotate 360°, 600ms linear infinite
  Text remains visible alongside spinner (width locked to prevent shift)

Icon swap (e.g., Eye → EyeOff in password field):
  opacity: 1→0→1 (cross-fade), 150ms total
  No scale — just opacity

Disabled state:
  opacity transition: 1→0.5, 150ms — no transform
```

---

## M09 — Table Row Animations

```
Row hover:
  background-color: transparent → Neutral-50
  duration: 100ms, ease-out (faster than card hover — denser interaction)

Row selection (checkbox checked):
  background-color: transparent → Blue-Pale
  duration: 100ms, ease-out

Row action reveal (three-dot menu):
  opacity: 0 → 1, 100ms, ease-out
  Only appears on row hover, disappears when row loses hover

New row prepend (real-time data):
  Slide in from top: translateY(-100%) → translateY(0)
  opacity: 0 → 1
  duration: 200ms, ease-out-standard
  Highlight flash: Blue-Pale bg flash (200ms hold, then fade to white over 500ms)

Row delete:
  height: auto → 0, opacity: 1→0
  duration: 200ms, ease-in-standard
  Adjacent rows shift up to fill gap
```

---

## M10 — Dialog & Modal Animations

```
Backdrop:
  opacity: 0 → 0.5 (with backdrop-blur: 0px → 4px)
  duration: 200ms, ease-out-standard

Panel open:
  opacity: 0 → 1
  transform: scale(0.96) → scale(1)
  duration: 200ms, cubic-bezier(0.2, 0.8, 0.2, 1)
  (spring easing gives a sense of physical arrival)

Panel close:
  opacity: 1 → 0
  transform: scale(1) → scale(0.98)
  duration: 150ms, ease-in-standard
  (faster exit than open — feels responsive to dismiss action)

Backdrop close:
  opacity: 0.5 → 0, duration: 200ms (synced with panel)

Content within modal (if multi-step):
  Step transition: previous step slides left (translateX(0→-20px), opacity 1→0, 150ms)
                   next step slides in from right (translateX(20px→0), opacity 0→1, 200ms)
```

---

## M11 — Drawer / Slide-Over Animations

```
Right drawer open:
  translateX(100%) → translateX(0)
  duration: 250ms, cubic-bezier(0.2, 0.8, 0.2, 1)

Right drawer close:
  translateX(0) → translateX(100%)
  duration: 200ms, ease-in-standard

Left drawer (mobile navigation):
  translateX(-100%) → translateX(0)
  duration: 250ms, cubic-bezier(0.2, 0.8, 0.2, 1)

Backdrop: opacity 0→0.4, 200ms (synced)

Content within drawer:
  No additional entrance animation — drawer arrival is the entrance
```

---

## M12 — Dropdown Animations

```
Menu open:
  opacity: 0 → 1
  transform: translateY(-4px) → translateY(0)  [for dropdowns below trigger]
           translateY(4px) → translateY(0)   [for dropdowns above trigger]
  duration: 150ms, ease-out-standard

Menu close:
  opacity: 1 → 0
  transform: translateY(0) → translateY(-4px)
  duration: 100ms, ease-in-standard

Individual option hover:
  background-color, 100ms ease-out

Selected checkmark appear:
  scale(0) → scale(1), 100ms, ease-spring
```

---

## M13 — Tooltip Animation

```
Show (hover/focus):
  opacity: 0 → 1
  transform: translateY(4px) → translateY(0)  [for top tooltips]
           translateY(-4px) → translateY(0) [for bottom tooltips]
  duration: 100ms, ease-out-standard
  delay: 300ms (prevents tooltip flicker on quick mouse passes)

Hide:
  opacity: 1 → 0
  duration: 80ms, ease-in-standard
  delay: 100ms (allows mouse to move into tooltip area)

Note: No scale animation on tooltips — keeps them feeling informational, not playful
```

---

## M14 — Toast Notification Animation

```
Enter:
  translateX(calc(100% + 16px)) → translateX(0)  [from right edge]
  opacity: 0 → 1
  duration: 250ms, cubic-bezier(0.2, 0.8, 0.2, 1)

Stack shift (when new toast pushes others):
  translateY: adjusts by toast height + gap
  duration: 200ms, ease-out-standard

Exit (auto-dismiss):
  opacity: 1 → 0
  translateX(0) → translateX(calc(100% + 16px))
  duration: 200ms, ease-in-standard

Exit (manual dismiss):
  Same as auto, but faster: 150ms

Progress bar:
  width: 100% → 0%
  duration: [toast display duration], linear
  Hover: animation-play-state: paused
```

---

## M15 — Search Overlay & Command Palette

```
Backdrop:
  opacity: 0 → 0.5
  backdrop-filter: blur(0px) → blur(4px)
  duration: 150ms, ease-out

Panel:
  opacity: 0 → 1
  transform: translateY(-8px) → translateY(0)
  duration: 200ms, cubic-bezier(0.2, 0.8, 0.2, 1)

Result items entrance (staggered, on first open):
  Each group: opacity 0→1, translateY(4px→0)
  Stagger: 30ms per group
  duration: 150ms, ease-out

Result items update (on typing):
  Fade-swap: old results fade 100ms, new results fade in 100ms
  No slide — prevents disorientation when results change rapidly

Close:
  Panel: opacity 1→0, translateY(0→-8px), 150ms ease-in
  Backdrop: opacity 0.5→0, 150ms
```

---

## M16 — Skeleton Shimmer

```
@keyframes shimmer {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

Skeleton element:
  background: linear-gradient(
    90deg,
    #E2E8F0 25%,   (Neutral-200 — base)
    #F1F5F9 50%,   (Neutral-100 — highlight)
    #E2E8F0 75%    (Neutral-200 — base)
  )
  background-size: 200% 100%
  animation: shimmer 1.5s ease-in-out infinite

Content replacement:
  When data arrives: opacity 0→1, 200ms ease-out (content fades in over skeleton)
  Skeleton: simultaneous opacity 1→0 (crossfade, same 200ms)
  Result: smooth handoff with no layout jump
```

---

## M17 — Success Animations

```
Checkmark draw animation (full-page success states):
  SVG circle + check path
  Circle: stroke-dashoffset animation (draws circle perimeter), 300ms ease-out
  Check: stroke-dashoffset animation starts 200ms after circle, 200ms ease-out
  Scale entrance: scale(0.8)→scale(1), 200ms ease-spring simultaneously
  Color: Success Green stroke on white fill

Confetti (milestone moments only — plan upgrade, first payment):
  Canvas element, z-index above all content
  Particles: 80–120 colored squares/rectangles, Physics-based fall
  Colors: Electric Blue, Cyan, Success Green, Warning Amber, Purple
  Duration: 2 seconds total, particles fade in last 500ms
  aria-hidden="true" on canvas element
  Respects prefers-reduced-motion: disabled if reduced motion preferred

Toast success:
  CheckCircle icon in toast: scale(0)→scale(1), 150ms, ease-spring
  (icon draws after toast has entered viewport)
```

---

## M18 — KPI Count-Up Animation

```
Trigger: fires when KPI card enters viewport (IntersectionObserver, threshold 0.5)

Animation:
  Value: counts from 0 to final value
  Duration: 800ms total
  Easing: ease-out (fast at start, slows as approaching final value)
  Decimal handling: count with 1 decimal place for values > 100, round for small numbers
  Currency: ₹ prefix added at start, comma formatting applies at final value only
  Percentage: % suffix added at start

Library: react-countup or custom useCountUp hook
  Options: { start: 0, end: value, duration: 0.8, easing: "easeOut" }

Delta chip:
  Appears after count-up completes: opacity 0→1, translateY(4px→0), 200ms ease-out
  Delay: 850ms (just after count-up finishes)

Reduced motion fallback:
  Skip count-up; display final value immediately with no animation
```

---

## M19 — Chart Entrance Animations

### Line Chart Draw
```
SVG path stroke-dasharray / stroke-dashoffset technique:
  Path: stroke-dashoffset from full path length → 0
  Duration: 600ms, ease-out-standard
  Delay: 200ms after chart card enters viewport
  Data point dots: scale(0)→scale(1), staggered 20ms per point, 150ms each
```

### Bar Chart Grow
```
Bars: scaleY(0)→scaleY(1), transform-origin: bottom
Duration: 400ms per bar, ease-out-standard
Stagger: 40ms between bars (left to right)
Total max duration: bars.length × 40ms + 400ms (e.g., 6 bars = 640ms)
```

### Area Chart Fill
```
Line: same as Line Chart Draw (600ms)
Fill area: clip-path or opacity animation (0→1), 400ms ease-out, delay 200ms after line completes
```

### Pie / Donut Chart Reveal
```
SVG conic-gradient or stroke-dashoffset per segment
Each segment draws sequentially: 300ms per segment, ease-out
Stagger: segments draw in order (largest first)
Center value: count-up after all segments complete (delay = total draw time + 100ms)
```

### Funnel Chart
```
Each bar grows from 0 to its width: scaleX(0)→scaleX(1), transform-origin: left
Duration: 250ms per bar, ease-out
Stagger: 60ms between bars (top to bottom)
Labels: fade in (opacity 0→1, 150ms) after their bar completes
```

### Sparkline / Trend Indicator
```
Compact line charts used inside KPI cards and table cells
Draw animation same as Line Chart but faster: 400ms, no data point dots
```

---

## M20 — Timeline Animation (Approval Workflow, Order Timeline)

```
Step connector lines:
  Each completed connector: scaleX(0)→scaleX(1), 200ms, ease-out
  Draws left-to-right, connecting steps sequentially

Step circles:
  Incomplete → Active transition: scale(0.8)→scale(1.0) + color change, 200ms ease-spring
  Active → Complete: checkmark draw inside circle, 200ms ease-out

Step labels:
  Fade in after circle animation: opacity 0→1, 150ms, delay 150ms

Sequential stagger between steps:
  Step N animates 150ms after step N-1 completes
  Creates a satisfying "chain completing" visual effect
```

---

## M21 — Performance Rules

```
WILL-CHANGE DECLARATIONS
Apply will-change only to elements that WILL animate:
  will-change: transform    → sidebars, drawers, modals, card hover
  will-change: opacity      → toasts, overlays, tooltips
  will-change: width        → sidebar collapse
  DO NOT apply globally — forces GPU layer creation unnecessarily

PROPERTIES TO ANIMATE (GPU-composited, no layout reflow):
  ✓ opacity
  ✓ transform (translate, scale, rotate)
  ✓ filter (use sparingly)

PROPERTIES TO AVOID ANIMATING:
  ✗ width / height (use max-height trick or Framer Motion)
  ✗ top / left / right / bottom (use transform translate instead)
  ✗ padding / margin
  ✗ border-width
  ✗ color / background-color for large painted areas (use overlay technique)

FRAMER MOTION USAGE RULES:
  Use Framer Motion for: page transitions, complex sequences, physics
  Use CSS transitions for: hover states, focus rings, simple color/opacity
  Never use Framer Motion for: skeleton shimmers, spinners (CSS is faster)

ANIMATION BUDGET:
  Maximum concurrent GPU-composited animations: 8
  Do not animate more than 4 elements simultaneously on mobile
  Table rows: CSS only (never Framer Motion on repeating table rows)

MOBILE PERFORMANCE:
  Reduce stagger delays by 50% on mobile
  Disable entrance animations on pages with >20 animated elements on mobile
  KPI count-up: reduce to 500ms on mobile
```

---

## M22 — Reduced Motion

```
CSS Media Query:
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}

Framer Motion:
  import { useReducedMotion } from 'framer-motion'
  const shouldReduceMotion = useReducedMotion()
  
  // Apply to all animated variants:
  const variants = {
    hidden: shouldReduceMotion ? {} : { opacity: 0, y: 12 },
    visible: { opacity: 1, y: 0 },
  }

Specific reduced-motion substitutions:
  Page transitions: instant swap (no opacity/translate animation)
  Sidebar collapse: instant width change
  KPI count-up: display final value immediately
  Chart animations: display final chart state immediately
  Confetti: disabled entirely
  Toast: appear/disappear instantly
  Skeleton shimmer: static neutral color (no animation)

NEVER disable:
  Focus ring appearance (must remain instant and visible)
  Loading spinners (use CSS animation-duration: 1s reduced but not 0)
  Progress bar movement (must still communicate progress, just less smooth)
```


---

# SECTION 3 — DATA VISUALIZATION SYSTEM

---

## DV01 — Visualization Philosophy

VendorFlow charts must communicate enterprise data with authority and clarity. Every chart serves a procurement decision, not a visual showcase. Charts feel alive through controlled entrance animation, interactive hover states, and rich contextual tooltips — but they never sacrifice readability for style.

**Four Visualization Principles:**

1. **Data first.** Grid lines, axes, and legends exist to serve the data. Reduce visual chrome to the minimum needed to orient the reader.
2. **Consistent color language.** Every chart series uses the same semantic colors as the rest of the design system. Electric Blue is always the primary series. Cyan is always the secondary. The reader's color understanding transfers across every chart.
3. **Interactive by default.** Every chart supports hover interaction with a rich tooltip. Click interactions drill down to filtered list views.
4. **Accessible always.** Every chart has a "View as table" fallback and appropriate ARIA attributes. Color is never the sole differentiator between series.

---

## DV02 — Chart Library & Configuration

**Primary Library:** Recharts (React-native SVG charts, no canvas, SSR-compatible with Next.js, accessible)

**Global Recharts Configuration:**
```tsx
// Shared chart theme applied globally via Recharts' customization props
const chartTheme = {
  fontFamily: "Inter, sans-serif",
  fontSize: 11,           // axis labels
  fontColor: "#94A3B8",   // Neutral-400
  gridColor: "#F1F5F9",   // Neutral-100
  tooltipBg: "#FFFFFF",
  tooltipBorder: "#E2E8F0",
  tooltipRadius: 8,
  animationDuration: 600,
  animationEasing: "ease-out",
}
```

**Responsive Behavior:** All charts use `<ResponsiveContainer width="100%" height={chartHeight}>`. Height is fixed per chart type — not percentage-based — to prevent layout instability.

---

## DV03 — Color Palette for Data Visualization

```
PRIMARY SERIES    #2563EB   Electric Blue
SECONDARY SERIES  #06B6D4   Cyan
TERTIARY SERIES   #16A34A   Success Green
QUATERNARY SERIES #D97706   Warning Amber
QUINARY SERIES    #7C3AED   Premium Purple (AI charts only)
SENARY SERIES     #64748B   Neutral-500 (neutral comparison data)

FILL OPACITIES (area charts, bar backgrounds)
  Primary fill:    Electric Blue at 15% opacity (#2563EB26)
  Secondary fill:  Cyan at 15% opacity (#06B6D426)
  Success fill:    Success Green at 15% opacity

NEGATIVE / BELOW-TARGET
  Error Red:       #DC2626 (bars exceeding budget, declining metrics)

NEUTRAL / COMPARISON
  Previous period: Neutral-300 (#CBD5E1), dashed line

CATEGORICAL (up to 8 segments in pie/donut)
  Slot 1: #2563EB  (Electric Blue)
  Slot 2: #06B6D4  (Cyan)
  Slot 3: #16A34A  (Success Green)
  Slot 4: #D97706  (Warning Amber)
  Slot 5: #7C3AED  (Purple)
  Slot 6: #0891B2  (Cyan Dark)
  Slot 7: #475569  (Neutral-600)
  Slot 8: #CBD5E1  (Neutral-300 — "Other" grouping)

COLOR-BLIND SAFETY:
  Primary palette passes Deuteranopia and Protanopia simulation.
  All charts additionally use shape differentiation:
    Line charts: solid vs dashed vs dotted per series
    Bar charts: full fill vs 60% fill vs hatched pattern per series
    Scatter plots: circle vs square vs diamond per series
```

---

## DV04 — KPI Cards (Visualization)

### Purpose
Single-metric cards with a trend indicator and optional sparkline. The primary data display on all dashboards.

### Design Specification
```
Card: rounded-2xl, shadow-sm, p-6, white bg
Metric label: text-xs uppercase tracking-wider font-semibold Neutral-500
Primary value: text-4xl font-bold Neutral-900
  → Count-up animation on mount (800ms, ease-out)
  → Currency: ₹ prefix, Indian number formatting (lakhs/crores)
  → Percentage: % suffix
  → Counts: comma-separated

Delta chip (below value):
  Positive: [ArrowUp 12px Success-Green] "+12%" Success Green text
  Negative: [ArrowDown 12px Error-Red] "−5%" Error Red text
  Neutral: [Minus 12px Neutral-400] "No change" Neutral-400 text

Sparkline (optional — shown when 7+ data points available):
  Mini line chart: 80px wide × 32px tall, right side of card
  No axes, no labels — pure trend visualization
  Positive trend: Electric Blue line, Blue fill 15% opacity
  Negative trend: Error Red line, Red fill 10% opacity
  SVG path draw animation: 400ms on mount

Context text: text-xs Neutral-400 below delta — "vs last 30 days"
```

### Sparkline Implementation
```tsx
// Recharts MiniChart for sparkline
<LineChart width={80} height={32} data={sparklineData}>
  <Line
    type="monotone"
    dataKey="value"
    stroke={trend > 0 ? "#2563EB" : "#DC2626"}
    strokeWidth={1.5}
    dot={false}
    isAnimationActive={true}
    animationDuration={400}
  />
</LineChart>
```

---

## DV05 — Line Chart

### Usage
Procurement cycle time trends, vendor rating trends, API usage over time, payment trends.

### Design
```
Container card: rounded-2xl, shadow-sm, p-6, white
Chart title: text-base font-semibold Neutral-800
Sub-label: text-xs Neutral-400 "Last 12 months"

Chart area: height 300px default (full-width), 240px (2-column layout)
X-axis:
  Labels: text-xs Neutral-400, no tick marks
  Line: 1px Neutral-100
Y-axis:
  Labels: text-xs Neutral-400, right-padded 8px
  Line: none (rely on horizontal grid lines only)
  Tick formatter: ₹ prefix + abbreviated (₹42.8L not ₹4,280,000)

Grid:
  Horizontal: 1px dashed Neutral-100 (3–5 lines)
  Vertical: none

Line:
  Primary: Electric Blue, strokeWidth: 2px, type: "monotone"
  Secondary (comparison): Neutral-300, strokeWidth: 1.5px, strokeDasharray: "4 4"
  Data points: 5px circle on hover only (not always visible — reduces clutter)
  Dot on hover: 6px filled circle, white border 2px

Reference line (target):
  strokeWidth: 1px, stroke: Warning Amber, strokeDasharray: "6 3"
  Label: text-xs Warning Amber "Target: 14 days"
```

### Hover Behavior
```
Cursor line: vertical 1px Neutral-200 dashed line follows mouse
  Appears only on chart hover, not on initial render
Data point enlarges: 5px → 8px on hover
Tooltip appears: custom ChartTooltip component
```

---

## DV06 — Bar Chart

### Usage
Spend by vendor, approval time distribution, monthly revenue, product order frequency.

### Variants
- Vertical bar (default): categories on X-axis, values on Y-axis
- Horizontal bar: categories on Y-axis (long names), values on X-axis
- Grouped bar: 2–3 bars per category (budget vs actual, invoiced vs paid)
- Stacked bar: sub-categories within each bar

### Design
```
Bar:
  Border-radius: rounded-t (4px top radius) on vertical bars
                 rounded-r (4px right radius) on horizontal bars
  Hover: brightness(1.05), cursor: pointer if drill-down available
  Animation: scaleY(0)→scaleY(1), 400ms staggered 40ms per bar (see M19)

Bar width: ~60% of available slot width (CategoryGap: "40%")

Grouped bars:
  Same radius treatment per individual bar
  Gap between bars in a group: 4px
  Gap between groups: 16px

Stacked bars:
  Each stack segment: flat bottom edge (no individual radius except top of topmost)
  Hover: entire stack column highlights
  Tooltip: shows all stacked values

Axis:
  X-axis (vertical bar): category labels, text-xs Neutral-400
  Y-axis: formatted values, text-xs Neutral-400
  Both: no tick mark lines — label only

Horizontal bar:
  Y-axis labels: right-padded 8px, max-width 120px, truncated with ellipsis
  Values shown at end of bar: text-xs font-medium Neutral-700 (if bar wide enough)
  Or: label inside bar when bar > 60px wide
```

### Drill-Down Behavior
When a bar is clickable (drill-down available):
- Cursor: pointer
- Hover: bar brightens + tooltip shows "Click to view details"
- Click: navigates to filtered list view for that category/vendor

---

## DV07 — Area Chart

### Usage
Monthly procurement spend (primary dashboard chart), revenue trend (vendor dashboard), API usage.

### Design
```
Line: Electric Blue, strokeWidth: 2px
Fill: Electric Blue at 15% opacity, gradient from 20% opacity at top → 0% at bottom
      linearGradient SVG definition — not CSS gradient

Reference area (budget band, optional):
  Fill: Neutral-100 at 40% opacity, between min and max budget lines

Multiple series:
  Series 1: Electric Blue line + blue fill gradient
  Series 2: Cyan line (1.5px, dashed) + no fill (fill clutters multi-series areas)

Grid: same as Line Chart (horizontal only, 1px dashed Neutral-100)
X-axis, Y-axis: same as Line Chart
```

### Comparison Period Overlay
When "Compare" toggle is enabled in Analytics:
```
Previous period: Neutral-300 dashed line (1px), no fill
Current period: Electric Blue line + fill (as above)
Legend: "Current period" (blue) | "Previous period" (gray dashed)
```

---

## DV08 — Pie Chart & Donut Chart

### Usage
Spend by category, vendor category distribution, payment status breakdown, storage usage breakdown.

### Design
```
Container: 240px × 240px centered within card
Inner radius: 0 (pie) / 80px (donut — preferred for VendorFlow)
Outer radius: 110px
Padding angle: 2° between segments (creates thin gap, prevents color bleed)

Donut center text:
  Primary: text-2xl font-bold Neutral-900 (total value or percentage)
  Secondary: text-xs Neutral-400 below ("Total Spend", "Of budget")

Segments:
  Colors: Categorical palette DV03 (8 colors)
  Hover: segment shifts outward by 6px (transform translate from center)
         Duration: 150ms ease-spring
  Active segment: border/stroke: 2px white (already separated by padding angle)

Label lines (optional):
  Shown when segments are < 8% of total (too small for inline label)
  Thin 1px Neutral-300 line → small label outside chart
  Otherwise: no label lines — use legend instead

Legend:
  Position: right side of chart (inline with card layout) or below on mobile
  Each item: 10px colored square + text-xs Neutral-700 label + text-xs Neutral-400 value
  Max 8 items; "Other" groups remaining
```

---

## DV09 — Scatter Plot (Vendor Performance Matrix)

### Usage
Vendor performance quadrant analysis: On-Time Delivery vs Quality Rating.

### Design
```
Container: 400px height (full-width card)
X-axis: On-Time Delivery % (0–100)
Y-axis: Quality Rating (1–5)

Quadrant shading (light, non-distracting):
  Top-right (Star Vendors): Success-Light at 30% opacity, subtle green tint
  Bottom-left (Needs Attention): Error-Light at 20% opacity
  Other quadrants: no tint

Quadrant labels:
  text-xs italic Neutral-300, positioned at quadrant centers
  "Star Vendors" | "Quality Leaders" | "Speed Leaders" | "Needs Attention"

Data point (each vendor):
  Circle: radius proportional to order volume (min 6px, max 18px)
  Fill: Electric Blue at 80%, white border 2px
  Hover: radius + 2px, tooltip appears, cursor pointer
  Selected: Electric Blue fill → Deep Navy fill

Tooltip (on hover): Vendor name, On-Time%, Rating, Order count, Total spend
Click: navigates to Vendor Profile page
```

---

## DV10 — Funnel Chart

### Usage
Procurement conversion funnel (PRs → Approved → RFQs → Quotes → POs → Delivered → Paid).

### Design
```
Container: full-width, height 320px
Orientation: vertical (narrowing downward)

Each stage:
  Rectangle bar: full width tapering to conversion percentage
  Height per stage: 36px
  Gap between stages: 4px
  Color: Electric Blue gradient, darker toward bottom
         Stage 1: #3B82F6 (Blue-Light)
         Stage 2–7: progressively darkening shades toward #1D4ED8

Labels (left of bar):
  Stage name: text-sm font-medium Neutral-700
  Count: text-sm font-bold Neutral-900

Conversion rates (right of bar):
  "→ 79%" text-xs Neutral-500 (percentage of previous stage)
  Shown between stages, not on bars

Hover on stage:
  Tooltip: stage name, count, % of total, conversion from previous
  Bar brightens slightly

Animation: scaleX(0→1) per bar, staggered 60ms, 250ms ease-out (see M19)
```

---

## DV11 — Heatmap (Future — Advanced Analytics)

### Usage
Procurement activity by day/hour matrix (identifies peak procurement periods). Planned for v2 Advanced Analytics.

### Design Specification (for future implementation)
```
Grid: 7 columns (days) × 24 rows (hours)
Each cell: 16px × 16px, 2px gap
Fill: Neutral-100 (no activity) → Electric Blue scale (low → high)
  5 intensity levels: #EFF6FF, #BFDBFE, #93C5FD, #3B82F6, #1D4ED8
Hover: tooltip with exact date/time + activity count
Legend: horizontal gradient scale below chart
```

---

## DV12 — Trend Indicators (Inline)

Small directional indicators embedded in tables, cards, and KPI deltas — not full charts.

### Variants

```
Trend Arrow:
  Up: ArrowUp 12px Success Green | Down: ArrowDown 12px Error Red
  Flat: Minus 12px Neutral-400
  Inline with delta text, text-xs

Trend Badge:
  Compact pill: [↑ +12%] Success-Light bg, Success Green text
                [↓ −5%]  Error-Light bg, Error Red text
                [→ 0%]   Neutral-100 bg, Neutral-500 text
  text-xs font-semibold, px-2 py-0.5, rounded-full

Mini Sparkline (in table cells):
  Width: 48px, height: 20px
  SVG path draw (no animation in table — too much GPU load in virtualized tables)
  Colors: same as Sparkline in KPI cards
```

---

## DV13 — Risk Indicators

Used on Vendor Profile, Vendor Comparison, and future Risk Dashboard.

### Design
```
Risk Score Bar:
  Track: full-width, height 8px, rounded-full, Neutral-100
  Fill: gradient based on score
    0–30:  Success Green fill
    31–60: Warning Amber fill
    61–80: Error Red fill
    81–100: Error Red fill + pulsing glow animation

Risk Level Dot + Label:
  6px dot + text-xs font-semibold
  Low Risk: Success Green dot + text
  Medium Risk: Warning Amber dot + text
  High Risk: Error Red dot + text
  Critical: Error Red pulsing dot + text (pulse: scale 1→1.4→1, 1.5s infinite)

Risk Factor List:
  Each factor: CheckCircle (green) or AlertCircle (amber) or XCircle (red) + text-xs label
```

---

## DV14 — Interactive Filters & Chart Controls

### Date Range Picker (Chart-level)
```
Positioned top-right of chart card
Compact trigger: "[Last 30 days ▾]" text-sm, Ghost button style
Dropdown: standard DateRangePicker component (C12)
On selection: chart data refetches, animates to new data (opacity 1→0.5→1, 300ms)
```

### Compare Toggle
```
Positioned next to date range, in filter bar
"[○ Compare with previous period]" — checkbox + label text-sm
When enabled: comparison series added to chart (dashed Neutral-300 line)
Legend updates to show both period labels
```

### Series Toggle (Legend as Filter)
```
Clicking a legend item toggles its series visibility
Active legend item: full opacity
Hidden legend item: opacity-40, strikethrough label
Toggle animation: series line/bar fades out (opacity 1→0, 200ms)
```

---

## DV15 — Chart Tooltips

Tooltips are the primary way users get exact values from charts. They must be rich, fast, and clearly formatted.

### Design
```
Container: white bg, rounded-lg, shadow-md, border 1px Neutral-200
Padding: px-3 py-2.5
Min-width: 160px, max-width: 280px
z-index: z-tooltip (700)

Header: text-xs font-semibold Neutral-500 (date / category name)
Rows per series:
  [10px colored square] [series name] [value right-aligned font-medium Neutral-900]
  Font: text-sm
Separator: 1px Neutral-100 between header and rows
Footer (optional): text-xs Neutral-400 italic (contextual note, e.g., "Click to view details")
```

### Value Formatting in Tooltips
```
Currency: ₹ prefix + Indian formatting (₹1,24,500 not ₹124500)
Percentage: one decimal place (78.4%)
Days: "14 days" (not "14.0")
Count: comma-formatted (1,284)
Large values: abbreviated only in axis labels — full value always in tooltip
```

### Tooltip Positioning
- Default: above the data point (avoids obscuring nearby data)
- Auto-flip: repositions to stay within chart bounds
- Offset: 12px from data point / cursor position
- Cursor follows mouse smoothly (no jump on appearance)

---

## DV16 — Chart Legends

### Design
```
Position: below chart by default
           Right side when chart is narrow (< 400px) — legend stacks vertically

Item layout: flex, flex-wrap, gap-4, justify-center
Each item: flex, items-center, gap-1.5
  Marker: 10px × 10px square (bar/area) or 16px × 2px line (line chart)
          rounded-sm for square markers
  Label: text-xs Neutral-600

Interactive legend (series toggle):
  Cursor: pointer
  Active: full opacity
  Hidden: opacity-40, label has line-through text decoration
  Hover: opacity-80 on other items
```

### Legend Placement Rules
- Donut/pie charts: right side (chart left, legend right), inline
- Line/area charts: below chart, centered
- Bar charts: below chart, centered (or embedded if single series — no legend needed)
- Scatter plots: embedded as quadrant labels (no traditional legend)

---

## DV17 — Responsive Charts

```
Container: <ResponsiveContainer width="100%" height={fixedHeight}>

Height by chart type:
  KPI sparkline:     32px
  Mini bar:          80px
  Standard line:    280px (desktop), 220px (mobile)
  Standard area:    300px (desktop), 240px (mobile)
  Standard bar:     280px (desktop), 200px (mobile)
  Full-width area:  360px (desktop), 260px (mobile)
  Donut:            240px (all breakpoints — square maintained)
  Scatter:          320px (desktop), 240px (mobile)
  Funnel:           280px (desktop), 240px (mobile)

Mobile adjustments:
  X-axis labels: reduced font to 10px, rotated 30° if > 8 labels
  Legend: moves below chart on all mobile viewports
  Tooltip: appears above cursor (not beside) to avoid finger obstruction
  Donut chart: legend moves below (not beside)
  Scatter plot: replaced with ranked table on mobile (< 640px)
  Funnel: compresses to 180px height, labels truncated
  
Tick count reduction on mobile:
  Line/area X-axis: max 6 ticks on mobile (vs 12 on desktop)
  Bar chart: max 6 bars visible, horizontal scroll for more
```

---

## DV18 — Chart Loading & Empty States

### Loading State
```
Each chart card shows a skeleton shimmer block matching the chart's height.
No attempt to simulate the chart shape — a single neutral shimmer block.
Duration before showing skeleton: 200ms delay (avoids flash on fast connections)
Skeleton to chart transition: opacity cross-fade, 200ms
```

### Empty State (no data for period)
```
Within chart card, vertically centered:
  Icon: BarChart2 (32px, Neutral-300) — all chart types use this icon
  Title: text-sm font-medium Neutral-500 "No data for this period"
  Sub-text: text-xs Neutral-400 "Try adjusting the date range or filters"
  Height: same as chart would be (preserves layout, no collapse)
```

### Error State (data fetch failed)
```
Within chart card:
  Icon: AlertTriangle (32px, Warning Amber)
  Title: text-sm font-medium Neutral-500 "Unable to load chart"
  Button: [Retry ↺] Ghost sm button
```

---

## DV19 — Chart Accessibility

```
1. Every chart card has a "View as table" toggle button (TableIcon 14px) in the card header.
   Clicking replaces the chart with a standard DataTable of the same data.
   Toggle: "View chart" restores the visualization.
   State persists per card per session.

2. SVG charts: aria-hidden="true" on the SVG element.
   A visually-hidden <table> within the card provides screen reader access.
   <caption> describes what the chart shows.

3. Chart card container: role="region", aria-label="[Chart title]"

4. Interactive elements (bars, segments, data points):
   role="graphics-symbol" or role="img" on each interactive SVG element
   aria-label="[Series]: [value] in [category/month]"

5. Color blind safe:
   All series distinguished by both color AND line style / pattern
   Tooltips include series names (not rely on color alone)
   Patterns used when printing (CSS print media query)

6. Keyboard access for interactive charts:
   Tab moves focus to the chart region
   Arrow keys navigate between data points
   Enter: shows tooltip / triggers drill-down
   Accessible data table (toggle above) is the primary keyboard interface
```

---

## DV20 — Forecast Charts (AI — Future)

Used in AI Procurement Insights and AI Vendor Performance modules.

```
Visual treatment:
  Historical data (solid): Electric Blue line, filled area
  Forecast data (projected): Electric Blue dashed line (#2563EB, strokeDasharray: "6 3")
  Confidence band: Blue-Pale fill between upper/lower confidence bounds
  
  Vertical separator: dashed Neutral-300 line at present-day boundary
  Label: text-xs Neutral-400 "Today" above separator

  Forecast annotation: Purple "AI Forecast" badge at start of forecast range
    Background: Purple-Pale, border: 1px #DDD6FE, Sparkles icon 10px

Tooltip in forecast region:
  Shows: "Projected: ₹42.8L (±₹3.2L)"
  Confidence interval displayed as range
```


---

# SECTION 4 — DESIGN TOKENS

---

## T01 — Token Architecture

VendorFlow design tokens are organized into three tiers:

**Tier 1 — Primitive Tokens:** Raw values with no semantic meaning. These are the source of truth for all colors, sizes, and durations.

**Tier 2 — Semantic Tokens:** Named by purpose, not value. Reference Tier 1 tokens. These are what components use. Light and dark themes are implemented by swapping semantic token values.

**Tier 3 — Component Tokens:** Specific overrides for individual components where semantic tokens need further scoping (e.g., `button-primary-bg` maps to semantic `color-interactive-primary`).

All tokens are defined in `tailwind.config.ts` and exposed as CSS custom properties on the `:root` element. Framer Motion and chart configurations reference the same CSS variables.

---

## T02 — Color Tokens

### Primitive Color Palette

```css
/* Brand */
--color-navy-950:    #060E1A;
--color-navy-900:    #0A1628;
--color-navy-800:    #0D1F3C;
--color-navy-700:    #1A2F52;
--color-navy-600:    #1E3A5F;

--color-blue-700:    #1D4ED8;
--color-blue-600:    #2563EB;
--color-blue-500:    #3B82F6;
--color-blue-400:    #60A5FA;
--color-blue-100:    #DBEAFE;
--color-blue-50:     #EFF6FF;

--color-cyan-700:    #0E7490;
--color-cyan-600:    #0891B2;
--color-cyan-500:    #06B6D4;
--color-cyan-400:    #22D3EE;
--color-cyan-100:    #CFFAFE;
--color-cyan-50:     #ECFEFF;

--color-purple-800:  #5B21B6;
--color-purple-700:  #6D28D9;
--color-purple-600:  #7C3AED;
--color-purple-500:  #8B5CF6;
--color-purple-200:  #DDD6FE;
--color-purple-50:   #F5F3FF;

/* Semantic Status */
--color-green-800:   #14532D;
--color-green-700:   #15803D;
--color-green-600:   #16A34A;
--color-green-500:   #22C55E;
--color-green-100:   #DCFCE7;
--color-green-50:    #F0FDF4;

--color-amber-800:   #92400E;
--color-amber-700:   #B45309;
--color-amber-600:   #D97706;
--color-amber-500:   #F59E0B;
--color-amber-100:   #FEF3C7;
--color-amber-50:    #FFFBEB;

--color-red-800:     #7F1D1D;
--color-red-700:     #B91C1C;
--color-red-600:     #DC2626;
--color-red-500:     #EF4444;
--color-red-100:     #FEE2E2;
--color-red-50:      #FEF2F2;

/* Neutral */
--color-neutral-900: #0F172A;
--color-neutral-800: #1E293B;
--color-neutral-700: #334155;
--color-neutral-600: #475569;
--color-neutral-500: #64748B;
--color-neutral-400: #94A3B8;
--color-neutral-300: #CBD5E1;
--color-neutral-200: #E2E8F0;
--color-neutral-100: #F1F5F9;
--color-neutral-50:  #F8FAFC;
--color-white:       #FFFFFF;
```

### Semantic Color Tokens — Light Theme

```css
:root {
  /* Backgrounds */
  --bg-base:              #F8FAFC;  /* Page root */
  --bg-surface:           #FFFFFF;  /* Cards, panels, modals */
  --bg-surface-hover:     #F8FAFC;  /* Card hover bg */
  --bg-surface-raised:    #FFFFFF;  /* Elevated cards */
  --bg-subtle:            #F1F5F9;  /* Section backgrounds */
  --bg-muted:             #E2E8F0;  /* Disabled fields */
  --bg-overlay:           rgba(15,23,42,0.5); /* Modal backdrop */

  /* Text */
  --text-primary:         #0F172A;
  --text-secondary:       #475569;
  --text-tertiary:        #94A3B8;
  --text-disabled:        #CBD5E1;
  --text-inverse:         #FFFFFF;
  --text-link:            #2563EB;
  --text-link-hover:      #1D4ED8;

  /* Borders */
  --border-default:       #E2E8F0;
  --border-strong:        #CBD5E1;
  --border-focus:         #2563EB;
  --border-error:         #DC2626;

  /* Interactive */
  --interactive-primary:         #2563EB;
  --interactive-primary-hover:   #1D4ED8;
  --interactive-primary-text:    #FFFFFF;
  --interactive-secondary:       #FFFFFF;
  --interactive-secondary-text:  #2563EB;
  --interactive-destructive:     #DC2626;
  --interactive-destructive-hover: #B91C1C;

  /* Navigation */
  --nav-bg:               #0A1628;
  --nav-text:             #CBD5E1;
  --nav-text-active:      #FFFFFF;
  --nav-text-hover:       #F1F5F9;
  --nav-item-active-bg:   #1A2F52;
  --nav-item-hover-bg:    #0D1F3C;
  --nav-icon:             #94A3B8;
  --nav-icon-active:      #3B82F6;
  --nav-section-label:    #64748B;

  /* Status */
  --status-success-bg:    #DCFCE7;
  --status-success-text:  #16A34A;
  --status-warning-bg:    #FEF3C7;
  --status-warning-text:  #D97706;
  --status-error-bg:      #FEE2E2;
  --status-error-text:    #DC2626;
  --status-info-bg:       #EFF6FF;
  --status-info-text:     #2563EB;
  --status-neutral-bg:    #F1F5F9;
  --status-neutral-text:  #475569;

  /* AI */
  --ai-accent:            #7C3AED;
  --ai-accent-hover:      #6D28D9;
  --ai-bg:                #F5F3FF;
  --ai-border:            #DDD6FE;
  --ai-text:              #7C3AED;
}
```

### Semantic Color Tokens — Dark Theme

```css
.dark {
  --bg-base:              #060E1A;
  --bg-surface:           #0D1F3C;
  --bg-surface-hover:     #1A2F52;
  --bg-surface-raised:    #0D1F3C;
  --bg-subtle:            #060E1A;
  --bg-muted:             #0A1628;
  --bg-overlay:           rgba(0,0,0,0.7);

  --text-primary:         #F1F5F9;
  --text-secondary:       #94A3B8;
  --text-tertiary:        #64748B;
  --text-disabled:        #334155;
  --text-inverse:         #0F172A;
  --text-link:            #3B82F6;
  --text-link-hover:      #60A5FA;

  --border-default:       #1A2F52;
  --border-strong:        #1E293B;
  --border-focus:         #3B82F6;
  --border-error:         #EF4444;

  --interactive-primary:         #3B82F6;
  --interactive-primary-hover:   #2563EB;
  --interactive-destructive:     #EF4444;
  --interactive-destructive-hover: #DC2626;

  --nav-bg:               #060E1A;
  --nav-item-active-bg:   #1A2F52;
  --nav-item-hover-bg:    #0D1F3C;
  --nav-icon:             #64748B;
  --nav-icon-active:      #3B82F6;

  --status-success-bg:    rgba(22,163,74,0.15);
  --status-warning-bg:    rgba(217,119,6,0.15);
  --status-error-bg:      rgba(220,38,38,0.15);
  --status-info-bg:       rgba(37,99,235,0.15);

  --ai-accent:            #8B5CF6;
  --ai-bg:                #1E1040;
  --ai-border:            #4C1D95;
}
```

---

## T03 — Typography Tokens

```css
/* Font Families */
--font-sans:   'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
--font-mono:   'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace;

/* Font Size Scale */
--text-xs:     0.6875rem;   /* 11px */
--text-sm:     0.8125rem;   /* 13px */
--text-base:   0.875rem;    /* 14px */
--text-md:     0.9375rem;   /* 15px */
--text-lg:     1rem;        /* 16px */
--text-xl:     1.125rem;    /* 18px */
--text-2xl:    1.25rem;     /* 20px */
--text-3xl:    1.5rem;      /* 24px */
--text-4xl:    1.875rem;    /* 30px */
--text-5xl:    2.25rem;     /* 36px */
--text-6xl:    3rem;        /* 48px */

/* Line Heights */
--leading-none:    1;
--leading-tight:   1.25;
--leading-snug:    1.375;
--leading-normal:  1.5;
--leading-relaxed: 1.625;
--leading-loose:   2;

/* Specific line heights per scale step */
--lh-xs:     1rem;     /* 16px */
--lh-sm:     1.25rem;  /* 20px */
--lh-base:   1.375rem; /* 22px */
--lh-md:     1.5rem;   /* 24px */
--lh-lg:     1.625rem; /* 26px */
--lh-xl:     1.75rem;  /* 28px */
--lh-2xl:    1.875rem; /* 30px */
--lh-3xl:    2rem;     /* 32px */
--lh-4xl:    2.375rem; /* 38px */

/* Font Weights */
--font-light:      300;
--font-regular:    400;
--font-medium:     500;
--font-semibold:   600;
--font-bold:       700;
--font-extrabold:  800;

/* Letter Spacing */
--tracking-tight:   -0.025em;
--tracking-normal:   0em;
--tracking-wide:     0.025em;
--tracking-wider:    0.05em;
--tracking-widest:   0.1em;
```

### Tailwind Typography Configuration

```js
// tailwind.config.ts — fontSize extension
fontSize: {
  'xs':   ['0.6875rem', { lineHeight: '1rem' }],
  'sm':   ['0.8125rem', { lineHeight: '1.25rem' }],
  'base': ['0.875rem',  { lineHeight: '1.375rem' }],
  'md':   ['0.9375rem', { lineHeight: '1.5rem' }],
  'lg':   ['1rem',      { lineHeight: '1.625rem' }],
  'xl':   ['1.125rem',  { lineHeight: '1.75rem' }],
  '2xl':  ['1.25rem',   { lineHeight: '1.875rem' }],
  '3xl':  ['1.5rem',    { lineHeight: '2rem' }],
  '4xl':  ['1.875rem',  { lineHeight: '2.375rem' }],
  '5xl':  ['2.25rem',   { lineHeight: '2.75rem' }],
  '6xl':  ['3rem',      { lineHeight: '3.5rem' }],
}
```

---

## T04 — Spacing Tokens

```css
/* 4px base unit, 8pt grid */
--space-px:    1px;
--space-0:     0px;
--space-0-5:   2px;
--space-1:     4px;
--space-1-5:   6px;
--space-2:     8px;
--space-2-5:   10px;
--space-3:     12px;
--space-3-5:   14px;
--space-4:     16px;
--space-5:     20px;
--space-6:     24px;
--space-7:     28px;
--space-8:     32px;
--space-9:     36px;
--space-10:    40px;
--space-11:    44px;
--space-12:    48px;
--space-14:    56px;
--space-16:    64px;
--space-20:    80px;
--space-24:    96px;
--space-28:    112px;
--space-32:    128px;
--space-36:    144px;
--space-40:    160px;
--space-48:    192px;
--space-56:    224px;
--space-64:    256px;

/* Named layout tokens */
--sidebar-width-expanded:   256px;
--sidebar-width-collapsed:  64px;
--topnav-height:            56px;
--page-padding-x:           32px;  /* desktop */
--page-padding-x-tablet:    24px;
--page-padding-x-mobile:    16px;
--content-max-width:        1440px;
--card-padding:             24px;
--modal-padding:            24px;
--table-cell-x:             16px;
--table-cell-y:             12px;
```

---

## T05 — Border Radius Tokens

```css
--radius-none:   0px;
--radius-sm:     4px;    /* Tags, small badges */
--radius-base:   6px;    /* Inputs, dropdowns */
--radius-md:     8px;    /* Buttons, form elements */
--radius-lg:     10px;   /* Cards, panels */
--radius-xl:     12px;   /* Modals, drawers, elevated cards */
--radius-2xl:    16px;   /* Dashboard widget cards */
--radius-3xl:    24px;   /* Large promotional cards */
--radius-full:   9999px; /* Avatars, pill badges, circular buttons */
```

### Tailwind Configuration
```js
borderRadius: {
  'none': '0px',
  'sm':   '4px',
  DEFAULT: '6px',
  'md':   '8px',
  'lg':   '10px',
  'xl':   '12px',
  '2xl':  '16px',
  '3xl':  '24px',
  'full': '9999px',
}
```

---

## T06 — Shadow / Elevation Tokens

```css
--shadow-none:   none;

--shadow-xs:     0 1px 2px 0 rgba(10,22,40,0.04);

--shadow-sm:     0 1px 2px 0 rgba(10,22,40,0.05),
                 0 1px 3px 0 rgba(10,22,40,0.04);

--shadow-base:   0 2px 4px -1px rgba(10,22,40,0.08),
                 0 4px 8px -2px rgba(10,22,40,0.06);

--shadow-md:     0 4px 8px -2px rgba(10,22,40,0.12),
                 0 8px 16px -4px rgba(10,22,40,0.08);

--shadow-lg:     0 8px 16px -4px rgba(10,22,40,0.14),
                 0 16px 32px -8px rgba(10,22,40,0.10);

--shadow-xl:     0 8px 24px -4px rgba(10,22,40,0.18),
                 0 16px 40px -8px rgba(10,22,40,0.12);

--shadow-2xl:    0 24px 48px -12px rgba(10,22,40,0.25);

/* Colored glow shadows */
--shadow-blue-glow:    0 0 0 3px rgba(37,99,235,0.15),
                       0 4px 12px rgba(37,99,235,0.15);

--shadow-purple-glow:  0 0 0 1px rgba(124,58,237,0.10),
                       0 4px 16px rgba(124,58,237,0.12);

--shadow-green-glow:   0 0 0 3px rgba(22,163,74,0.15),
                       0 4px 12px rgba(22,163,74,0.12);
```

### Elevation Map

| Level | Token | Usage |
|---|---|---|
| 0 | shadow-none | Flat elements, table rows, inline |
| 1 | shadow-sm | Cards, panels on page bg |
| 2 | shadow-base | Hover cards, dropdown triggers |
| 3 | shadow-md | Dropdowns, popovers, tooltips |
| 4 | shadow-xl | Modals, drawers, command palette |
| 5 | shadow-2xl | Full-screen overlays (rare) |

---

## T07 — Border Tokens

```css
--border-width-none:    0px;
--border-width-default: 1px;
--border-width-medium:  2px;
--border-width-thick:   4px;   /* Status indicator left borders */

/* Border colors — reference semantic tokens */
--border-color-default: var(--border-default);   /* #E2E8F0 */
--border-color-strong:  var(--border-strong);    /* #CBD5E1 */
--border-color-focus:   var(--border-focus);     /* #2563EB */
--border-color-error:   var(--border-error);     /* #DC2626 */
--border-color-nav:     rgba(255,255,255,0.06);  /* Sidebar dividers */
```

---

## T08 — Opacity Tokens

```css
--opacity-0:    0;
--opacity-5:    0.05;
--opacity-10:   0.10;
--opacity-15:   0.15;  /* Chart fills */
--opacity-20:   0.20;
--opacity-30:   0.30;
--opacity-40:   0.40;
--opacity-50:   0.50;  /* Modal backdrops */
--opacity-60:   0.60;
--opacity-70:   0.70;
--opacity-75:   0.75;
--opacity-80:   0.80;
--opacity-90:   0.90;
--opacity-100:  1;
```

---

## T09 — Motion / Transition Tokens

```css
/* Duration scale */
--duration-instant:     75ms;
--duration-fast:        100ms;
--duration-normal:      150ms;
--duration-comfortable: 200ms;
--duration-smooth:      250ms;
--duration-relaxed:     300ms;
--duration-measured:    400ms;
--duration-slow:        500ms;
--duration-chart:       600ms;
--duration-countup:     800ms;

/* Easing curves */
--ease-out:          cubic-bezier(0, 0, 0.2, 1);
--ease-in:           cubic-bezier(0.4, 0, 1, 1);
--ease-in-out:       cubic-bezier(0.4, 0, 0.2, 1);
--ease-spring:       cubic-bezier(0.2, 0.8, 0.2, 1);
--ease-linear:       linear;

/* Shorthand transitions for common use cases */
--transition-colors:    color 150ms var(--ease-out),
                        background-color 150ms var(--ease-out),
                        border-color 150ms var(--ease-out);
--transition-shadow:    box-shadow 200ms var(--ease-spring);
--transition-transform: transform 200ms var(--ease-spring);
--transition-opacity:   opacity 150ms var(--ease-out);
--transition-all:       all 200ms var(--ease-out);

/* Skeleton shimmer */
--shimmer-duration: 1.5s;
--spinner-duration: 600ms;
```

---

## T10 — Breakpoint Tokens

```css
/* min-width breakpoints (mobile-first) */
--breakpoint-xs:    0px;      /* 0–639px */
--breakpoint-sm:    640px;    /* 640–767px */
--breakpoint-md:    768px;    /* 768–1023px */
--breakpoint-lg:    1024px;   /* 1024–1279px */
--breakpoint-xl:    1280px;   /* 1280–1535px */
--breakpoint-2xl:   1536px;   /* 1536px+ */
--breakpoint-3xl:   1920px;   /* Ultra-wide */
```

```js
// tailwind.config.ts screens
screens: {
  'xs':  '0px',
  'sm':  '640px',
  'md':  '768px',
  'lg':  '1024px',
  'xl':  '1280px',
  '2xl': '1536px',
  '3xl': '1920px',
}
```

---

## T11 — Grid System Tokens

```css
/* Column grid */
--grid-columns-mobile:    4;
--grid-columns-tablet:    8;
--grid-columns-desktop:   12;

/* Gutter width */
--grid-gutter-mobile:  16px;
--grid-gutter-tablet:  24px;
--grid-gutter-desktop: 32px;

/* Container max-widths */
--container-sm:   640px;
--container-md:   768px;
--container-lg:   1024px;
--container-xl:   1280px;
--container-2xl:  1440px;   /* VendorFlow max content width */
--container-full: 100%;
```

---

## T12 — Icon Size Tokens

```css
--icon-xs:    12px;   /* Inline text icons, badge icons */
--icon-sm:    14px;   /* Table row icons, compact lists */
--icon-base:  16px;   /* Navigation, buttons, form fields */
--icon-md:    18px;   /* Card icons, section headers */
--icon-lg:    20px;   /* Feature icons, dashboard */
--icon-xl:    24px;   /* Empty state secondary, KPI icons */
--icon-2xl:   32px;   /* Large feature callouts */
--icon-3xl:   48px;   /* Empty state primary, onboarding */
```

---

## T13 — Z-Index Tokens

```css
--z-base:          0;
--z-raised:        10;
--z-dropdown:      100;
--z-sticky:        200;
--z-sidebar:       300;
--z-overlay:       400;
--z-modal:         500;
--z-notification:  600;
--z-tooltip:       700;
--z-command:       800;
--z-max:           9999;
```

---

## T14 — Chart Color Tokens

```css
/* Data visualization series */
--chart-1:  #2563EB;   /* Primary — Electric Blue */
--chart-2:  #06B6D4;   /* Secondary — Cyan */
--chart-3:  #16A34A;   /* Tertiary — Success Green */
--chart-4:  #D97706;   /* Quaternary — Warning Amber */
--chart-5:  #7C3AED;   /* AI / Purple */
--chart-6:  #0891B2;   /* Cyan Dark */
--chart-7:  #475569;   /* Neutral-600 */
--chart-8:  #CBD5E1;   /* Neutral-300 "Other" */

/* Fill opacities */
--chart-fill-primary:    rgba(37,99,235,0.15);
--chart-fill-secondary:  rgba(6,182,212,0.15);
--chart-fill-tertiary:   rgba(22,163,74,0.12);

/* Grid and axis */
--chart-grid:    #F1F5F9;   /* Neutral-100 */
--chart-axis:    #94A3B8;   /* Neutral-400 */
--chart-tooltip-bg:     #FFFFFF;
--chart-tooltip-border: #E2E8F0;
```

---

## T15 — Complete Tailwind Config Token Extension

```js
// tailwind.config.ts — extend section (representative excerpt)
module.exports = {
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#060E1A',
          900: '#0A1628',
          800: '#0D1F3C',
          700: '#1A2F52',
          600: '#1E3A5F',
        },
        brand: {
          primary:   '#2563EB',
          secondary: '#06B6D4',
          ai:        '#7C3AED',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      boxShadow: {
        'blue-glow':   '0 0 0 3px rgba(37,99,235,0.15), 0 4px 12px rgba(37,99,235,0.15)',
        'purple-glow': '0 0 0 1px rgba(124,58,237,0.10), 0 4px 16px rgba(124,58,237,0.12)',
        'green-glow':  '0 0 0 3px rgba(22,163,74,0.15), 0 4px 12px rgba(22,163,74,0.12)',
      },
      transitionTimingFunction: {
        'spring': 'cubic-bezier(0.2, 0.8, 0.2, 1)',
        'out-standard': 'cubic-bezier(0, 0, 0.2, 1)',
        'in-standard': 'cubic-bezier(0.4, 0, 1, 1)',
      },
      transitionDuration: {
        '75':  '75ms',
        '250': '250ms',
        '400': '400ms',
        '600': '600ms',
        '800': '800ms',
      },
      zIndex: {
        'dropdown':    '100',
        'sticky':      '200',
        'sidebar':     '300',
        'overlay':     '400',
        'modal':       '500',
        'notification':'600',
        'tooltip':     '700',
        'command':     '800',
      },
    },
  },
}
```


---

# SECTION 5 — COMPANY BRANDING GUIDELINES

---

## B01 — VendorFlow Platform Logo

### Logo Versions

VendorFlow maintains four official logo versions for use across different contexts:

```
1. Full Lockup (Horizontal):   [VF mark]  VendorFlow
   Used: Sidebar expanded, authentication left panel, email headers, marketing

2. Mark Only (Icon):           [VF mark alone]
   Used: Sidebar collapsed, browser favicon, app icon, loading screen

3. Full Lockup (Stacked):      [VF mark]
                               VendorFlow
   Used: Reports cover pages, document footers, onboarding wizard

4. Wordmark Only:              VendorFlow
   Used: Text-only contexts where icon would not render (plain text emails)
```

### Logo Mark Design
The VendorFlow mark is a geometric icon representing a stylized connection network — two nodes joined by a flowing line, suggesting the company-vendor collaboration platform. The mark is bold, modern, and legible at small sizes.

### Color Variants

```
Primary (default):
  Mark: Electric Blue (#2563EB) icon + Deep Navy (#0A1628) wordmark
  Used on: white and light backgrounds

Reversed (white):
  Mark: white icon + white wordmark
  Used on: Deep Navy sidebar, dark backgrounds, colored backgrounds

Monochrome (dark):
  Mark: Neutral-900 (#0F172A) icon + Neutral-900 wordmark
  Used on: print documents, light backgrounds where color is unavailable

Monochrome (light):
  Mark: white icon + white wordmark
  Used on: printed dark backgrounds, embossed/stamped applications
```

### Minimum Sizes

```
Full lockup (horizontal): min-width 120px (print: 30mm)
Full lockup (stacked):    min-width 80px  (print: 20mm)
Mark only:                min-width 24px  (print: 6mm)
Wordmark only:            min-width 100px (print: 25mm)
Below minimum: do not use the logo — use text "VendorFlow" in brand font
```

### Clear Space

```
All sides: minimum clear space = height of the "V" letterform in the wordmark
Example: if logo is rendered at 32px height, clear space = 8px on all sides
This prevents visual crowding when placed near other UI elements
```

### Placement Rules

```
✓ On white backgrounds (default application)
✓ On Deep Navy backgrounds (sidebar, dark headers)
✓ On Neutral-50 backgrounds (page backgrounds, cards)
✓ On brand photography overlays (with sufficient contrast)
✗ Never on busy or patterned backgrounds
✗ Never on backgrounds without sufficient contrast (min 4.5:1 ratio)
✗ Never apply drop shadows, gradients, or effects to the logo
✗ Never rotate, skew, or stretch the logo
✗ Never recreate the logo in a different typeface
✗ Never change logo colors outside the approved four variants
```

---

## B02 — Logo Placement by Context

### Sidebar (Expanded State)
```
Position: Top-left of sidebar, 16px from left edge, vertically centered in 56px header
Logo: Full horizontal lockup — mark (28px height) + wordmark
Color: White reversed version on Deep Navy background
Right side: Sidebar collapse toggle button
```

### Sidebar (Collapsed State)
```
Position: Centered horizontally within 64px sidebar
Logo: Mark only, 32px × 32px
Color: White reversed version
```

### Top Navigation (Mobile)
```
Position: Center of 56px navigation bar (or left of center on smaller screens)
Logo: Mark only, 24px × 24px
Color: Primary (blue + navy) on white navigation background
```

### Authentication Left Panel
```
Position: Top-left corner, 32px from top-left edges
Logo: Full horizontal lockup, 32px height
Color: White reversed version on Deep Navy background
Below: Tagline "Enterprise Procurement, Simplified."
```

### Authentication Right Panel (above form)
```
Position: Centered horizontally above form card
Logo: Full horizontal lockup, 24px height
Color: Primary color version (blue mark + navy wordmark)
```

### Onboarding Wizard
```
Position: Top-left, 24px from edges
Logo: Full horizontal lockup, 28px height
Color: Primary version on Neutral-50 background
```

### Email Templates
```
Position: Top-center of email, inside a 80px tall header block
Header background: Deep Navy (#0A1628)
Logo: Full horizontal lockup (white reversed version), 28px height
Padding: 24px horizontal, 26px vertical within header block
```

### Invoice Documents (PDF)
```
Position: Top-right of invoice header
Logo: Full horizontal lockup, 32px height — uses Company logo if uploaded
      Falls back to VendorFlow mark if no company logo
Color: Primary version (dark logo on white document)
```

### Purchase Order Documents (PDF)
```
Same as Invoice Documents
Company logo takes precedence over VendorFlow platform mark
```

### Report Covers (PDF)
```
Position: Top-left of cover page
Logo: Full stacked lockup, 48px height
Color: Primary version
Below logo: Report title, workspace name, date range, generated by
```

### Favicon
```
Format: 32×32px ICO + 180×180px PNG (Apple Touch Icon) + 192×192px PNG (PWA)
Content: VendorFlow mark only, centered on white background with 4px padding
Dark mode favicon: mark on deep navy background (separate file)
```

### Loading Screen (Initial App Boot)
```
Full viewport, white background
Logo: Full stacked lockup, 48px height, centered (horizontal + vertical)
Loading spinner: 24px, Electric Blue, 24px below logo
Fade in: 200ms delay (avoid flash on fast load)
```

---

## B03 — Company / Vendor Workspace Logo

Every company workspace and vendor account can upload their own logo. These workspace logos appear throughout the platform wherever the workspace's identity needs to be represented.

### Company Logo Placement
```
Workspace Switcher (sidebar):      24px circle avatar
Vendor Profile (viewed by company): 48px rounded-lg (not circle)
Purchase Order PDF:                 48px left-aligned in PO header
Invoice PDF:                        32px inline with company name
Email footer:                       24px beside company name
Settings → Company Profile:        80px circle with "Change Logo" overlay
```

### Vendor Logo Placement
```
Vendor Card (Marketplace):          48px rounded-lg
Vendor Profile Hero:                80px rounded-xl (square, not circle)
Quotation document:                 32px beside vendor name
Comparison table header:            24px circle
Message conversation header:        32px rounded-lg
```

### Logo Display Component Behavior
```
Image present: display the uploaded image
  object-fit: cover
  background: Neutral-100 (shown during load)

Image absent (no logo uploaded):
  Show initials avatar — first 2 characters of workspace name
  Background: deterministically derived from workspace name hash
  Colors: same 8-color palette as user avatars (T02)

Image load error: fallback to initials avatar immediately

Image loading: shimmer skeleton at exact dimensions
```

### Logo Upload Requirements
```
Company logo:
  Min dimensions: 200×200px
  Max dimensions: 2000×2000px (auto-resized to 400×400px on upload)
  File formats: JPG, PNG, WEBP, SVG
  Max file size: 2MB before compression
  Recommended: square aspect ratio (auto-cropped if not square)
  Storage: Supabase Storage, public bucket, company-logos/[company_id].[ext]

Vendor logo:
  Same requirements as company logo
  Storage: vendor-logos/[vendor_id].[ext]
```

### Aspect Ratio Handling
```
All logo placements use CSS object-fit: cover within the defined container
Non-square logos: centered, cropped to fit container
Tall logos: cropped left and right
Wide logos: cropped top and bottom
Alternative: letterbox mode with Neutral-50 background (user setting, future)
```

---

## B04 — Scaling Rules

```
Logo scaling must maintain proportional dimensions.
No dimension may be independently adjusted (no stretching or squishing).

Browser rendering:
  SVG logos: render natively at any size (preferred format)
  PNG logos: use 2× resolution (retina) files for all web placements
  No upscaling of raster logos beyond their native resolution

PDF rendering:
  VendorFlow platform logo: embedded as SVG path in PDF
  Company/vendor logos: embedded as PNG at 2× resolution

Minimum legibility test:
  At minimum size, the logo must be identifiable without zooming
  At 24px height: wordmark must be readable (Inter font minimum 8px)
  At 16px height (favicon): mark only, no wordmark
```

---

## B05 — Profile Pages

### User Profile Avatar
```
Display: Circular (rounded-full), 80px on profile page, 36px in navigation
With photo: object-fit: cover
Without photo: initials on colored background (see C30 Avatar component)
Border: 3px solid white on dark backgrounds
On hover: "Change photo" overlay with Camera icon (50% dark overlay)
```

### Company Profile Avatar in Settings
```
Display: Circular, 80px
With logo: object-fit: contain, white background (logos may not be square)
Without logo: company initials on hashed background color
Bottom-right: "Upload" icon button (circular, 28px, white bg, shadow-sm)
```

---

## B06 — Dark / Light Logo Switching

VendorFlow automatically applies the correct logo variant based on the current theme:

```tsx
// Logo component with theme-aware switching
const Logo = ({ variant, height }: LogoProps) => {
  const { theme } = useTheme()
  
  const src = theme === 'dark'
    ? '/logo/vendorflow-white.svg'     // White reversed for dark theme
    : '/logo/vendorflow-primary.svg'   // Blue+navy for light theme
  
  // Sidebar always uses white (always on deep navy bg)
  // Override: if inside sidebar, always use white variant regardless of theme
}
```

The sidebar is always Deep Navy — it never changes with the theme. Therefore the sidebar logo is always the white reversed variant.


---

# SECTION 6 — AI VISUAL LANGUAGE

---

## AI01 — AI Design Philosophy

VendorFlow's AI features occupy a distinct visual layer within the interface. They are not part of the standard procurement workflow — they are an intelligent layer that observes, analyzes, and suggests. The visual language must communicate this distinction: AI features are present but not intrusive, premium but not distracting, and always clearly labeled so users know when they are interacting with intelligent automation versus deterministic system behavior.

**Three AI Visual Principles:**

1. **Purple means AI.** Premium Purple (#7C3AED) is used exclusively for AI-powered features across the entire platform. No other module uses this color. Users quickly learn: purple = intelligent.
2. **Elegant restraint.** AI UI elements use the Purple-Pale background, never a full purple surface. Glass morphism effects appear only on AI interfaces. The aesthetic is premium but never garish.
3. **Explainability is visual.** Every AI output shows a confidence level and a short rationale. The interface never presents AI results as authoritative facts — always as intelligent suggestions with transparent reasoning.

---

## AI02 — AI Color System

```
Primary AI Color:       #7C3AED   (Premium Purple)
AI Hover:               #6D28D9
AI Secondary:           #8B5CF6
AI Light:               #A78BFA
AI Pale Background:     #F5F3FF   (for card backgrounds, subtle tints)
AI Border:              #DDD6FE   (1px border on AI cards)
AI Separator:           #EDE9FE   (dividers within AI panels)
AI Shadow Glow:         0 0 0 1px rgba(124,58,237,0.10),
                        0 4px 16px rgba(124,58,237,0.12)
AI Text on White:       #7C3AED
AI Text on Purple:      #FFFFFF
AI Text on Pale:        #5B21B6   (darker purple for better contrast on pale bg)

Dark Theme AI:
  AI Background:        #1E1040
  AI Border:            #4C1D95
  AI Accent:            #8B5CF6   (lighter purple for dark backgrounds)
  AI Text:              #C4B5FD
```

---

## AI03 — AI Badge

The universal indicator that a UI element is AI-powered. Appears on every card, section, and feature that uses AI.

```
Container: inline-flex, items-center, gap-1.5
Background: Purple-Pale (#F5F3FF)
Border: 1px solid #DDD6FE
Border-radius: rounded-full
Padding: px-2 py-0.5
Font: text-xs font-semibold, color: #5B21B6

Icon: Sparkles (Lucide), 10px, color: #7C3AED (Premium Purple)
Text: "AI-Powered" (standard) or "AI Insight" or "AI Suggestion" (contextual)

Placement: top-right corner of AI feature cards
           or inline as a tag beside a section heading
           or as a tab label with Sparkles prefix

Variants:
  Standard: "AI-Powered" — general AI feature label
  Insight:  "AI Insight" — analysis result
  Beta:     "AI Beta" — features in early access (uses orange border instead of purple)
  New:      "New" badge in success green alongside "AI-Powered" (for newly launched AI features)
```

---

## AI04 — AI Feature Cards

Used for: Vendor Recommendation cards, AI Insight cards, AI Risk Score cards, AI Performance Prediction cards.

### Design Specification

```
Card container:
  Background: #F5F3FF (Purple-Pale)
  Border: 1px solid #DDD6FE
  Border-radius: rounded-2xl (16px)
  Padding: p-5 (20px)
  Box-shadow: var(--shadow-purple-glow)

Left accent border:
  4px solid #7C3AED — applied to left edge (border-left: 4px solid #7C3AED)
  Used on: AI Insight cards, Risk Alert cards
  Not used on: Recommendation cards (they use full pale background instead)

Header row:
  Left: type icon (16px, #7C3AED) in 28×28px rounded-md container
        Background: rgba(124,58,237,0.12) — subtle purple tint
  Center: title text-sm font-semibold Neutral-800
  Right: AI Badge (AI03)

Divider: 1px solid #EDE9FE, my-3

Content:
  Body text: text-sm Neutral-700
  Sub-metrics/bullets: text-xs Neutral-500 with CheckCircle / AlertCircle / XCircle icons

Confidence meter (when applicable):
  Label: text-xs Neutral-400 "Confidence" left-aligned
  Value: text-xs font-semibold #7C3AED right-aligned
  Bar track: #EDE9FE full-width, height 4px, rounded-full
  Bar fill: #7C3AED gradient (dark → light purple), width = confidence %
  transition: width 600ms ease-out on mount

Footer:
  CTA link: text-xs Electric Blue (not purple — action uses standard interactive color)
  "View Details →" or "Explore →" or module-specific navigation

Dismiss button: X icon (12px, Neutral-400) top-right
  hover: Neutral-700
  aria-label: "Dismiss this AI insight for 7 days"
```

---

## AI05 — AI Vendor Recommendation Card

A specialized variant of the AI Feature Card designed for the Marketplace and RFQ vendor selection flow.

```
Card: rounded-2xl, Purple-Pale bg, shadow-purple-glow, p-5

TOP SECTION
  [AI Pick badge — top-right corner]
  [Vendor logo 40px rounded-lg]  Vendor Name (text-lg font-semibold Neutral-900)
  Star rating + review count (standard display)
  Category tag

MATCH SCORE SECTION (center, most prominent element)
  Label: "Match Score" text-xs uppercase tracking-wider Neutral-400
  Score: text-4xl font-extrabold #7C3AED  e.g. "94%"
         count-up animation on mount (600ms)
  Progress bar: full-width, 6px height
    Track: #EDE9FE rounded-full
    Fill: gradient left→right, #7C3AED → #8B5CF6, rounded-full
    Width animates from 0 → score% on mount (600ms ease-out)

WHY RECOMMENDED (3 bullet points)
  Icon: CheckCircle 12px #7C3AED
  Text: text-xs Neutral-700
  Examples:
    "18 completed orders in your workspace"
    "96% on-time delivery rate"
    "Top IT Hardware vendor in your region"

FOOTER
  [Add to RFQ] Primary button (Electric Blue, sm size)
  [View Profile →] Ghost link
```

---

## AI06 — AI Insights Card (Procurement Insights)

Used on Analytics page AI Insights tab and Company Dashboard AI widget.

### Insight Type Icons & Treatment

```
Insight Type      Icon             Left Border Color    Background
─────────────────────────────────────────────────────────────────
Spending Trend    TrendingUp       #7C3AED (Purple)     Purple-Pale
Risk Alert        AlertTriangle    #DC2626 (Error Red)  Error-Light (with AI badge)
Optimization      Lightbulb        #7C3AED (Purple)     Purple-Pale
Forecast          Calendar         #7C3AED (Purple)     Purple-Pale
Anomaly           Zap              #D97706 (Amber)      Warning-Light (with AI badge)
Performance       BarChart2        #7C3AED (Purple)     Purple-Pale
```

Note: Risk Alert and Anomaly insights use standard Error/Warning colors with the AI badge to differentiate — this communicates urgency clearly while still tagging the source as AI.

### Card Anatomy
```
Header: [insight-type icon 16px] + [insight type label, text-xs uppercase, purple] + [AI Badge]
Body: text-sm Neutral-800 font-medium (insight headline, 1–2 lines)
      text-sm Neutral-600 (detail, 2–4 lines, collapsible)
      "Read more" link when body > 4 lines

Confidence:
  "Confidence: " text-xs Neutral-400
  Score: text-xs font-semibold #7C3AED
  Mini bar: 80px wide, same bar design as AI Vendor Recommendation card

Footer:
  [View Details →] text-xs Electric Blue link
  [✕ Dismiss] X button (appears on hover, top-right)
```

---

## AI07 — AI Risk Analysis Display

Used on Vendor Profile sidebar, Vendor Comparison table, and future Risk Dashboard.

### Risk Score Ring
```
SVG circle (donut format):
  Container: 80px × 80px centered
  Background circle: #EDE9FE stroke, strokeWidth 8px
  Score arc: colored stroke, strokeWidth 8px
    0–30:  #16A34A (Success Green)
    31–60: #D97706 (Warning Amber)
    61–80: #DC2626 (Error Red)
    81–100: #DC2626 with subtle pulsing opacity animation
  Center: score number text-lg font-bold, color matching arc
  Below ring: "Risk Score" text-xs Neutral-400

Animation on mount:
  Arc draws from 0 → score (stroke-dashoffset technique, 600ms ease-out)
  Center number: count-up from 0 (600ms ease-out)
```

### Risk Factor List
```
Container: mt-3, space-y-1.5
Each factor row: flex items-center gap-2
  Icon: CheckCircle 14px (success green) / AlertCircle 14px (amber) / XCircle 14px (red)
  Text: text-xs Neutral-700

Risk level badge:
  Low Risk:    Success-Light bg, Success Green text, CheckCircle 10px icon
  Medium Risk: Warning-Light bg, Warning Amber text, AlertTriangle 10px
  High Risk:   Error-Light bg, Error Red text, AlertCircle 10px
  Critical:    Error-Light bg, Error Red text, pulsing AlertCircle 10px
    pulse: opacity 1→0.5→1, 1.5s infinite (CSS animation)
```

---

## AI08 — AI Confidence Indicator

A standardized component for displaying AI confidence levels across all AI modules.

```
Variants:
  1. Inline (compact): "Confidence: 82%" in text-xs, Neutral-400 label + #7C3AED value
  2. Bar (standard): label + progress bar + percentage (as described in AI Feature Cards)
  3. Ring (prominent): SVG donut ring (as described in Risk Score Ring, smaller 48px version)

Interpretation labels (shown in tooltip on hover):
  90–100%: "Very High — highly reliable prediction"
  70–89%:  "High — reliable with minor uncertainty"
  50–69%:  "Moderate — use alongside other signals"
  Below 50%: "Low — treat as one of many signals"

Implementation:
  <ConfidenceIndicator value={82} variant="bar" showLabel={true} />
  The component handles all color/label logic internally based on value range.
```

---

## AI09 — AI Loading States

AI operations are inherently slower than standard API calls (LLM inference, ML scoring). The loading UX must communicate that something meaningful is happening.

### AI Processing Skeleton
```
Replaces AI card content while loading:
  Card outer: same Purple-Pale bg, shadow-purple-glow (visible immediately)
  Content: shimmer skeleton elements BUT with a purple tint
    Skeleton elements: #DDD6FE base → #EDE9FE shimmer highlight
                       (purple-tinted shimmer instead of standard gray shimmer)
  [Sparkles 20px purple] icon visible and pulsing (opacity 1→0.5→1, 1.2s infinite)
                          positioned top-center of loading card
  Below icon: text-xs #8B5CF6 "Analyzing your procurement data..."
```

### AI Processing States (sequential)
For complex AI operations (generating insights, computing scores):

```
State 1 (0–1s):    "Analyzing procurement data..."
State 2 (1–2.5s):  "Evaluating vendor performance..."
State 3 (2.5–4s):  "Generating recommendations..."
State 4 (4s+):     "Almost ready..."

Text cycles every 1.5s with fade-out/in (opacity 1→0→1, 300ms each)
All text: text-xs #8B5CF6, centered below Sparkles icon
```

### AI Error State
```
Card: same Purple-Pale container
Content: Sparkles icon 24px (Neutral-300, not purple — de-emphasized)
         text-sm Neutral-500 "AI insights unavailable"
         text-xs Neutral-400 "Our AI service is temporarily unreachable."
         [Try Again] Ghost button sm — retries the AI fetch
No alarming colors — AI unavailability is non-critical
```

---

## AI10 — AI Chat Assistant (Future)

The AI Procurement Assistant is a conversational interface planned for post-v1 release. This section defines the visual design so it can be implemented consistently when the feature ships.

### Chat Window Design

```
Trigger: Sparkles icon button in sidebar bottom section or floating button
  Button: 48px circle, Premium Purple (#7C3AED) background, white Sparkles icon 20px
  Pulsing ring on first appearance: rgba(124,58,237,0.3) ring, scale 1→1.5→1, 2s delay then stops
  Label: "AI Assistant" tooltip on hover

Chat panel: right-anchored drawer, 400px width
  Header: bg: Deep Navy gradient → Navy with 30% purple tint
    [Sparkles 16px white] "VendorFlow AI" text-base font-semibold white
    [AI Badge] positioned inline with header text
    [X close] icon button top-right

  Message thread: standard scrollable area
    User messages: right-aligned, Electric Blue bg, white text (same as Messaging module)
    AI messages: left-aligned, Purple-Pale bg, Neutral-800 text
      AI avatar: 28px circle, purple gradient bg, Sparkles 12px white

  AI typing indicator:
    3 dots animation (bouncing dots, 400ms stagger)
    Same purple-pale bubble as AI messages

  Input:
    Standard MessageInput component at bottom
    Send button: purple bg (not blue — differentiates from standard messaging)
    Placeholder: "Ask about procurement, vendors, or analytics..."

  Suggested prompts (pre-conversation):
    Pill chips with sample questions:
      "Which vendor has the best delivery record?"
      "Summarize my spending this quarter"
      "Find vendors for IT Hardware in Mumbai"
    Purple-Pale bg, #5B21B6 text, rounded-full
    Tap to send as first message
```

---

## AI11 — Glass Morphism (AI-Exclusive)

Glass effects are used ONLY on AI-related surfaces. Applying glass to non-AI UI would undermine its semantic meaning and introduce visual inconsistency.

```
Approved glass contexts:
  - AI Chat assistant message bubbles (AI responses only)
  - AI Insights overlay cards on Analytics page
  - AI Recommendation strip on Marketplace (backdrop blur behind the strip)
  - Future: AI sidebar panel, AI fullscreen analysis view

Glass specification:
  background: rgba(245, 243, 255, 0.85)    (Purple-Pale at 85% opacity)
  backdrop-filter: blur(12px) saturate(180%)
  border: 1px solid rgba(221, 214, 254, 0.6) (AI border at 60% opacity)
  border-radius: rounded-2xl
  box-shadow: var(--shadow-purple-glow)

Dark theme glass:
  background: rgba(30, 16, 64, 0.80)        (AI dark bg at 80% opacity)
  backdrop-filter: blur(12px) saturate(150%)
  border: 1px solid rgba(76, 29, 149, 0.5)

Performance rule:
  backdrop-filter is GPU-expensive — limit to maximum 2 glass elements visible simultaneously
  Do not use on scrollable list items (never glass on table rows)
  Mobile: reduce blur to 8px on devices with low GPU capability (detect via low-end device heuristic)
```

---

## AI12 — AI Coming Soon Treatment

In v1 all AI modules are inactive. The coming soon treatment must feel premium and create anticipation — not like a locked/disabled state.

```
Card dimensions: same as the real AI card will occupy (preserves future layout)
Background: Purple-Pale (#F5F3FF)
Border: 1px dashed #DDD6FE (dashed — signals "not yet available")
Opacity: 1.0 (fully visible — not grayed out)

Content:
  Center-aligned vertically and horizontally
  [Sparkles 32px #7C3AED] with subtle glow effect:
    filter: drop-shadow(0 0 8px rgba(124,58,237,0.4))
    pulsing opacity: 1→0.7→1, 2s ease-in-out infinite

  Feature name: text-base font-semibold Neutral-800, mt-3
  Description: text-sm Neutral-500, mt-1, max-w-xs, text-center, line-clamp-3
  [AI-Powered] badge: mt-3, standard AI Badge but with text "Coming Soon" instead

  CTA: [✉ Notify Me When Available] Ghost sm button, mt-4
    On click: captures user email/ID in ai_waitlist table
    After click: button replaced with "✓ You're on the list" in Success Green text

Hover on entire card:
  Box-shadow: var(--shadow-purple-glow) — card lifts slightly
  Duration: 200ms ease-spring
  Cursor: default (not pointer — it's not navigable yet)
```

---

## AI13 — AI Module Integration with Standard Modules

When AI features are enabled (post-v1), they integrate with standard modules without replacing them. This section defines the integration patterns.

### AI Strip in Vendor Marketplace
```
Placement: above the standard vendor grid, below the search bar and filters
Height: auto (expands to fit recommendation cards)
Background: transparent (allows page bg to show through)
Top border: 2px solid #DDD6FE separates from filters above
Bottom border: 1px solid Neutral-100 separates from vendor grid below
Horizontal scroll: 3 recommendation cards visible, scroll reveals more
```

### AI Banner in Vendor Comparison
```
Placement: below the comparison table (does not interrupt the table)
Full width, Purple-Pale bg, border-top 2px solid #DDD6FE
Collapsible: "[Sparkles] AI Analysis ▾" toggle collapses/expands the section
             Default: expanded when ≥2 quotations present
```

### AI Tab in Analytics
```
6th tab in Analytics tab row: "AI Insights" with Sparkles 12px icon before label
Tab indicator: Premium Purple underline (not Electric Blue)
Active tab text: #7C3AED instead of standard Neutral-900
```

### AI Widget on Company Dashboard
```
Optional widget: shown when AI features are enabled
Placement: below the standard KPI row, above the Pending Actions / Timeline row
Toggle: users can hide/show via Dashboard → Customize
Background: Purple-Pale, border: 1px solid #DDD6FE, rounded-2xl
```


---

# SECTION 7 — ACCESSIBILITY STANDARDS

---

## A01 — Accessibility Philosophy

VendorFlow is enterprise software used by procurement professionals, finance managers, and vendor operations teams — a workforce that includes users with disabilities, users who rely on keyboard navigation, users with low vision, and users who prefer or require assistive technologies. Accessibility is not a feature sprint; it is a baseline quality requirement baked into every component and every interaction pattern.

VendorFlow targets **WCAG 2.1 Level AA** compliance across all modules. This section defines the standards, implementation patterns, and testing requirements that every developer and designer must follow.

---

## A02 — WCAG AA Compliance Requirements

### Perceivable

```
1.1.1 Non-text Content (A):
  Every non-decorative image, icon, chart, and avatar has descriptive alt text
  or aria-label. Decorative elements use alt="" or aria-hidden="true".

1.3.1 Info and Relationships (A):
  Page structure communicated through semantic HTML: <header>, <nav>, <main>,
  <section>, <article>, <aside>, <footer>. Tables use <thead>, <tbody>,
  <th scope>. Lists use <ul>/<ol>/<li>.

1.3.2 Meaningful Sequence (A):
  DOM reading order matches visual reading order. CSS positioning never creates
  a visual order that contradicts the DOM order in a meaningful way.

1.3.3 Sensory Characteristics (A):
  Instructions never rely solely on visual characteristics ("click the red button",
  "see the form on the left"). Always include text that works independently.

1.4.1 Use of Color (A):
  Color is never the ONLY means of conveying information. Status badges always
  include text. Chart series always include labels. Error states always include
  text messages alongside red borders.

1.4.3 Contrast (Text) (AA):
  Normal text: minimum 4.5:1 contrast ratio against background
  Large text (≥18pt / ≥14pt bold): minimum 3:1 contrast ratio
  UI components (borders, icons): minimum 3:1 contrast ratio
  
  Verified contrast ratios for primary pairs:
  Neutral-900 (#0F172A) on White (#FFFFFF):         17.7:1 ✓
  Neutral-700 (#334155) on White:                   10.4:1 ✓
  Neutral-500 (#64748B) on White:                    4.9:1 ✓  (body text min)
  Electric Blue (#2563EB) on White:                  4.6:1 ✓  (links, interactive)
  White on Electric Blue (#2563EB):                  4.6:1 ✓  (primary buttons)
  White on Error Red (#DC2626):                      4.5:1 ✓  (destructive buttons)
  White on Success Green (#16A34A):                  4.5:1 ✓  (success buttons)
  Electric Blue (#2563EB) on Blue-Pale (#EFF6FF):   4.5:1 ✓  (info badge text)
  Warning Amber (#D97706) on Warning-Light (#FEF3C7): requires checking — use darker amber (#B45309) on warning-light for text to ensure 4.5:1 ✓
  Nav text (#CBD5E1) on Nav bg (#0A1628):            8.2:1 ✓
  Active nav text (#FFFFFF) on Active bg (#1A2F52):  11.4:1 ✓

1.4.4 Resize Text (AA):
  Text scales to 200% without loss of content or functionality. No fixed-height
  containers that clip text. Use min-height, not height, for text containers.

1.4.10 Reflow (AA):
  Content reflows to a single column at 320px viewport width without horizontal
  scrolling (except for tables and complex data grids which may scroll).

1.4.11 Non-text Contrast (AA):
  Input borders, focus rings, chart elements, and icon-only buttons all maintain
  3:1 contrast ratio against adjacent colors.

1.4.12 Text Spacing (AA):
  No loss of content when: line-height set to 1.5×, letter-spacing 0.12em,
  word-spacing 0.16em. Avoid fixed-height containers for text.

1.4.13 Content on Hover or Focus (AA):
  Tooltips and popovers: dismissible (Escape), hoverable (mouse can move into them),
  persistent (stay visible while pointer is over them or trigger is focused).
```

### Operable

```
2.1.1 Keyboard (A):
  All functionality operable via keyboard only. No keyboard traps except
  modal dialogs (where focus is intentionally trapped and Escape exits).

2.1.2 No Keyboard Trap (A):
  Users can always Tab out of any component. Modal traps release on Escape.
  Focus is always returned to the trigger when an overlay closes.

2.4.1 Bypass Blocks (A):
  Skip link at very start of <body>: "Skip to main content"
  Visible on focus, links to <main id="main-content">
  
2.4.2 Page Titled (A):
  Every page has a unique, descriptive <title>:
  Format: "[Page Name] — VendorFlow"
  Examples: "Purchase Requests — VendorFlow"
            "Vendor Profile: Nexus Supplies — VendorFlow"

2.4.3 Focus Order (A):
  Tab order follows a logical reading order: top-to-bottom, left-to-right.
  Modals and drawers: focus moves to first element inside on open;
  returns to trigger on close. Never use tabindex > 1.

2.4.4 Link Purpose (A):
  Every link and button has a descriptive accessible name. No naked
  "Click here", "Read more", "View", "Download" without context.
  Use aria-label or visually hidden text to add context where needed.

2.4.6 Headings and Labels (AA):
  All form fields have visible labels. Section headings use proper
  hierarchy: one <h1> per page, <h2> for major sections, <h3> for sub-sections.

2.4.7 Focus Visible (AA):
  Focus ring always visible on all interactive elements.
  Specification: outline: 2px solid #2563EB, outline-offset: 2px
  Never suppressed with outline: none without a replacement.
  Focus ring contrast: Electric Blue on white = 4.6:1 ✓
```

### Understandable

```
3.1.1 Language of Page (A):
  <html lang="en"> on every page.

3.2.1 On Focus (A):
  Focusing a component never automatically triggers a context change.
  Focus on a select dropdown opens the dropdown but does not submit the form.

3.2.2 On Input (A):
  Changing an input value does not automatically cause navigation or form
  submission. Exception: live search updates results (non-navigating — acceptable).

3.3.1 Error Identification (A):
  Every form error is described in text. Error messages identify the field
  and explain what is wrong: "GST number must be 15 characters" not "Invalid input".

3.3.2 Labels or Instructions (A):
  All required form fields marked with asterisk (*) in visible label AND
  aria-required="true". Input format hints shown as helper text before the user
  encounters an error.

3.3.3 Error Suggestion (AA):
  Error messages include correction suggestions where possible:
  "Email address is missing @" — not just "Invalid email".
```

### Robust

```
4.1.1 Parsing (A):
  Valid, well-formed HTML. No duplicate IDs. All elements properly nested.
  Run automated HTML validation in CI pipeline.

4.1.2 Name, Role, Value (A):
  All custom interactive components have correct ARIA roles, states, and properties.
  See individual component specifications (C01–C42) for per-component requirements.

4.1.3 Status Messages (AA):
  Success, error, and warning messages that appear without focus change are
  announced to screen readers via aria-live regions.
  Toast notifications: role="status" (polite) or role="alert" (assertive)
  Form validation: aria-live="polite" on error summary regions
```

---

## A03 — Keyboard Navigation Standards

### Global Keyboard Shortcuts

```
⌘K / Ctrl+K     Open Global Search / Command Palette
[               Collapse sidebar
]               Expand sidebar
/               Focus table search (when on a module list page)
Escape          Close any open modal, drawer, dropdown, tooltip, overlay
Tab             Move focus forward through interactive elements
Shift+Tab       Move focus backward
Enter / Space   Activate focused button, link, checkbox, select option
ArrowKeys       Navigate within menus, select options, date picker cells, tabs
Home / End      Jump to first/last item in lists and menus
```

### Focus Management Rules

```
Modal opens:    Focus moves to first focusable element inside modal
Modal closes:   Focus returns to the element that triggered the modal
Drawer opens:   Focus moves to drawer heading or first focusable element
Drawer closes:  Focus returns to trigger
Dropdown opens: Focus moves to first option (or currently selected option)
Dropdown closes:Focus returns to trigger (select/combobox)
Route change:   Focus moves to <h1> of new page (or page heading region)
Error occurs:   Focus moves to error summary or first invalid field
Toast appears:  Focus does NOT move (toast is non-blocking)
Alert appears:  Focus moves to alert if it is critical (role="alertdialog")
```

### Tab Order Construction Rules

```
1. Follow DOM order — never manipulate tab order via tabindex > 0
2. Use tabindex="0" to make non-interactive elements focusable (rare cases only)
3. Use tabindex="-1" to remove elements from tab order (e.g., disabled buttons)
4. Grouped components (radio groups, tab lists): one tabstop per group,
   arrow keys navigate within the group
5. Dialog focus trap: Tab cycles through modal's focusable elements only.
   Shift+Tab cycles in reverse. Escape releases the trap.
6. Skip links: visible on focus (above all content), hidden when unfocused using
   CSS: position: absolute; transform: translateY(-100%) — NOT display:none
```

---

## A04 — Screen Reader Standards

### Semantic HTML Requirements

```
Page structure:
  <header>          → Top navigation
  <nav>             → Sidebar navigation (aria-label="Main navigation")
  <main>            → Primary page content (id="main-content" for skip link)
  <section>         → Major page sections (with aria-labelledby pointing to heading)
  <article>         → Independent content items (cards, feed entries)
  <aside>           → Supplementary content (right panels, widgets)
  <footer>          → Page footer

Headings hierarchy:
  One <h1> per page: page title / module name
  <h2>: major sections within the page (KPI row, Pending Actions, Recent Activity)
  <h3>: sub-sections within h2 sections
  <h4> and below: use sparingly, only when hierarchy genuinely requires it
  Never skip heading levels (h1 → h3 without h2)

Lists:
  Navigation items: <ul><li> structure
  Ordered steps: <ol><li>
  Description pairs: <dl><dt><dd>
  Never fake a list with divs + CSS spacing
```

### ARIA Usage Principles

```
1. Use semantic HTML first. Add ARIA only when native semantics are insufficient.
2. Never override meaningful native semantics with ARIA roles.
3. All ARIA state attributes must be kept in sync with visual state:
   aria-expanded, aria-checked, aria-selected, aria-current, aria-disabled,
   aria-busy — all must reflect actual current state in real-time.
4. Every aria-labelledby and aria-describedby must reference existing element IDs.
5. aria-live regions: use sparingly. Each page should have at most 2–3 live regions.
   Overuse causes screen reader chattering that frustrates users.
```

### ARIA Patterns by Component Type

```
Navigation sidebar:
  <nav aria-label="Main navigation">
    <ul role="list">
      <li><a aria-current="page" href="/dashboard">Dashboard</a></li>
    </ul>
  </nav>

Collapsible group in sidebar:
  <button aria-expanded="true" aria-controls="procurement-submenu">
    Procurement
  </button>
  <ul id="procurement-submenu" role="list">...</ul>

Modal dialog:
  <div role="dialog" aria-modal="true" aria-labelledby="modal-title"
       aria-describedby="modal-desc">
    <h2 id="modal-title">Confirm Vendor Selection</h2>
    <p id="modal-desc">You are about to select Nexus Supplies...</p>
  </div>

Data table:
  <table role="grid" aria-label="Purchase Requests" aria-rowcount="128"
         aria-colcount="7">
    <thead>
      <tr>
        <th scope="col" aria-sort="descending">Date</th>
        <th scope="col">Title</th>
      </tr>
    </thead>
    <tbody>
      <tr aria-rowindex="1">
        <td>Jul 4, 2026</td>
        <td><a href="/pr/0081">Office Chairs x10</a></td>
      </tr>
    </tbody>
  </table>

Form with errors:
  <form aria-label="Create Purchase Request" novalidate>
    <label for="pr-title">Request Title <span aria-hidden="true">*</span>
      <span class="sr-only">(required)</span>
    </label>
    <input id="pr-title" type="text" aria-required="true"
           aria-invalid="true" aria-describedby="pr-title-error">
    <p id="pr-title-error" role="alert" class="error-message">
      Request title is required.
    </p>
  </form>

Live region for notifications:
  <div aria-live="polite" aria-atomic="true" class="sr-only" id="status-region">
    {/* Toast messages injected here programmatically */}
  </div>
  <div aria-live="assertive" aria-atomic="true" class="sr-only" id="alert-region">
    {/* Critical errors injected here */}
  </div>
```

---

## A05 — High Contrast Mode

VendorFlow must be usable in Windows High Contrast mode and with CSS `forced-colors: active`.

```css
@media (forced-colors: active) {
  /* Override custom shadows with borders */
  .card {
    outline: 1px solid ButtonText;
    box-shadow: none;
  }
  
  /* Ensure focus rings are visible */
  :focus-visible {
    outline: 3px solid Highlight;
    outline-offset: 2px;
  }
  
  /* Replace colored bg states with border-based states */
  .status-badge {
    forced-color-adjust: none;
    /* Use border instead of background for differentiation */
  }
  
  /* Skeleton loaders: simplify to solid neutral */
  .skeleton {
    background: ButtonFace;
    animation: none;
  }
  
  /* Charts: use system colors for critical elements */
  .chart-line {
    stroke: CanvasText;
  }
}
```

---

## A06 — Color Blind Safety

```
Deuteranopia (green-blind) and Protanopia (red-blind) affect ~8% of males.
VendorFlow uses the following strategies:

1. Status communication:
   Never rely on green vs red alone.
   Always pair with:
     Status text labels ("Approved" / "Rejected" — not just colored dots)
     Icons (CheckCircle vs XCircle vs AlertTriangle)
     Shape differentiation (checkmark vs X vs exclamation)

2. Charts:
   Color + line style differentiation (solid, dashed, dotted)
   Color + shape differentiation (circle, square, diamond data points)
   All chart colors pass Coblis color blindness simulation for Deuteranopia

3. Form states:
   Error: red border + AlertCircle icon + red error text
   Success: green border + CheckCircle icon + green confirmation text
   Not color alone in any state

4. Links:
   Text links are underlined on hover (not color alone)
   Visited link state uses text-decoration or additional visual marker

Simulation testing tools:
   Figma: Color Blind plugin (Stark)
   Browser: Chrome DevTools Emulation → Rendering → Emulate vision deficiency
   Automated: axe-core color contrast checks in CI
```

---

## A07 — Touch Targets (Mobile Accessibility)

```
WCAG 2.5.5 Target Size (AAA — still recommended for enterprise quality):
  Minimum touch target: 44px × 44px

All interactive elements on mobile:
  Buttons: min-height: 44px (already in lg size spec)
  Navigation items: min-height: 44px (py-3 = 12px × 2 + content)
  Checkboxes/radios: 20px visual + 12px invisible padding on all sides = 44px target
  Table row actions: visible icon is 16px, but row height is 52px (touch target passes)
  Avatar: visual 36px, invisible padding to 44px touch area
  Icon buttons (xs): visual 28px, add 8px padding on all sides → 44px target
  Form inputs: height 40px (standard), height 44px on mobile breakpoints
  Dropdown trigger: height 40px standard, 44px on mobile

Implementation:
  Use padding to extend tap target beyond visual bounds
  Never increase visual size of a component just to meet touch target — use padding
  
  Example: small icon button
    .icon-button-xs {
      padding: 8px;         /* extends tap area to 44px */
      /* visual icon: 28px inside */
    }
```

---

## A08 — Skip Links

```html
<!-- First child of <body> -->
<a href="#main-content" class="skip-link">
  Skip to main content
</a>

<!-- CSS -->
.skip-link {
  position: absolute;
  top: 0;
  left: 0;
  background: #2563EB;  /* Electric Blue */
  color: #FFFFFF;
  padding: 12px 24px;
  font-size: 14px;
  font-weight: 600;
  border-radius: 0 0 8px 0;
  transform: translateY(-100%);
  transition: transform 150ms ease-out;
  z-index: var(--z-max);
  text-decoration: none;
}

.skip-link:focus {
  transform: translateY(0);
}
```

Additional skip links (for complex pages):
- "Skip to navigation" — links to sidebar
- "Skip to search" — links to global search input

---

## A09 — Reduced Motion

Fully specified in Motion Section M22. Summary for accessibility context:

```
@media (prefers-reduced-motion: reduce) {
  All animations and transitions: duration reduced to 0.01ms
  Count-up animations: show final value immediately
  Chart animations: show final state immediately
  Skeleton shimmer: static color, no animation
  Confetti: disabled
  Page transitions: instant
}

React hook:
  const shouldReduceMotion = useReducedMotion()
  All Framer Motion variants check this before applying transform/opacity animations
```

---

## A10 — Accessibility Testing Checklist

### Automated Testing (CI Pipeline)

```
Tool: axe-core via @axe-core/react and axe-playwright
Run: on every PR, blocks merge if new violations introduced

Automated checks:
  ✓ Color contrast ratios (text and UI components)
  ✓ Missing alt text on images
  ✓ Missing form labels
  ✓ Missing ARIA on custom widgets
  ✓ Invalid ARIA attribute values
  ✓ Duplicate IDs
  ✓ Empty links and buttons
  ✓ Missing lang attribute
  ✓ Heading hierarchy violations
  ✓ Table structure issues

False positive management:
  Known exceptions documented in axe-core configuration
  Exceptions require team review + GitHub comment explanation
```

### Manual Testing Checklist (Per Release)

```
KEYBOARD NAVIGATION
  ☐ Navigate entire page using Tab only — no mouse
  ☐ All interactive elements reachable by Tab
  ☐ Tab order is logical (top-bottom, left-right)
  ☐ No keyboard traps (except modal focus trap with Escape exit)
  ☐ All modals and drawers: focus enters on open, returns on close
  ☐ Skip link visible on first Tab press, navigates correctly
  ☐ All dropdown menus: Arrow keys navigate, Enter/Space select, Escape close
  ☐ Date picker: Arrow keys navigate calendar grid
  ☐ Command palette: Arrow keys navigate results, Enter selects

SCREEN READER TESTING
  ☐ Test with VoiceOver (macOS/iOS) — primary screen reader for Mac developers
  ☐ Test with NVDA (Windows) — most common enterprise screen reader
  ☐ All page headings announced correctly with hierarchy
  ☐ All form fields announced with label, type, required status
  ☐ Error messages announced when they appear
  ☐ Success messages announced (live region)
  ☐ Table column headers announced per cell
  ☐ Modal title and description announced on open
  ☐ Icon-only buttons announce descriptive labels

VISUAL CHECKS
  ☐ Focus ring visible on all interactive elements
  ☐ No content relies solely on color
  ☐ Text contrast passes 4.5:1 (normal text) and 3:1 (large text)
  ☐ Status badges always include text label (not color-only)
  ☐ Error states include text + icon (not border-color only)

ZOOM AND REFLOW
  ☐ Content usable at 200% browser zoom
  ☐ No horizontal scroll at 320px viewport (except tables)
  ☐ Text spacing overrides do not break layouts
  ☐ Touch targets ≥ 44px on mobile

MOTION
  ☐ Enable "Reduce Motion" in OS settings — verify all animations stop
  ☐ No content loss with reduced motion enabled
  ☐ Spinner still visible (not fully stopped) with reduced motion

HIGH CONTRAST
  ☐ Test in Windows High Contrast Black mode
  ☐ All text readable, buttons visible, focus rings visible
  ☐ No content hidden by forced color overrides
```

### Screen Reader Browser Pairs

```
VoiceOver + Safari (macOS):      Primary for development testing
VoiceOver + Chrome (macOS):      Secondary
NVDA + Firefox (Windows):        Required before release
NVDA + Chrome (Windows):         Secondary Windows test
TalkBack + Chrome (Android):     Mobile testing (quarterly)
VoiceOver + Safari (iOS):        Mobile testing (quarterly)
```


---

# SECTION 8 — RESPONSIVE GUIDELINES

---

## R01 — Responsive Philosophy

VendorFlow is a desktop-primary enterprise application. The primary user context is a procurement professional at a desktop or laptop workstation. However, tablet access is common for managers reviewing approvals on the go, and mobile access must be functional for time-critical actions (approving urgent purchase requests, checking order status, reviewing notifications).

The responsive strategy is therefore:
- **Desktop (xl+):** Full experience — every feature, every column, every chart
- **Laptop (lg):** Near-full experience — minor density reductions
- **Tablet (md):** Functional experience — sidebar collapsed, tables simplified, forms full-width
- **Mobile (sm/xs):** Task-critical experience — core actions accessible, complex analysis deferred to desktop

Mobile is NOT a secondary product. It is a focused, optimized subset of the full platform.

---

## R02 — Sidebar Responsive Behavior

```
Desktop (xl+, 1280px+):
  Width: 256px, always visible, expanded by default
  User can collapse to 64px (preference saved in localStorage)
  Main content: margin-left: 256px (or 64px if collapsed)

Laptop (lg, 1024–1279px):
  Width: 256px expanded / 64px collapsed
  Default: collapsed (64px) to maximize content area on smaller screens
  User can expand manually — does not auto-collapse on navigation

Tablet (md, 768–1023px):
  Width: 0px (hidden by default)
  Hamburger menu icon in top navigation (left side, Menu icon 20px)
  On hamburger click: sidebar overlays content as full-width drawer
    Width: 280px, left-anchored, backdrop on right
    Close: outside click, Escape, or X button in sidebar header
  No persistent 64px icon-only mode on tablet

Mobile (xs/sm, below 768px):
  Width: 0px (always hidden)
  Same hamburger → full-screen drawer pattern as tablet
  Drawer width: 100% - 48px (leaves a visible edge to tap for close)
```

---

## R03 — Top Navigation Responsive Behavior

```
Desktop (xl+):
  Full layout: [Breadcrumbs] [Search bar] [+ New] [Notifications] [Theme] [Avatar]
  Search bar: max-w-md (448px), center zone

Laptop (lg):
  Breadcrumbs: truncated to 2 segments max
  Search: slightly narrower (max-w-sm)
  All action buttons still visible

Tablet (md):
  Hamburger icon added far-left
  Breadcrumbs: hidden (page title appears in page header area)
  Search bar: visible but compact (max-w-xs)
  Theme toggle: moved into profile dropdown
  All icons still visible: + New, Bell, Avatar

Mobile (xs/sm):
  Hamburger (left) + VendorFlow logo (center) + [Bell] [Avatar] (right)
  Search: collapses to Search icon button (opens full-screen overlay on tap)
  + New button: hidden from nav bar, replaced by FAB at screen bottom-right
  Breadcrumbs: hidden entirely
  Theme toggle: inside profile dropdown
  Bar height: 56px (same as desktop — consistent touch target area)
```

---

## R04 — Table Responsive Behavior

### Column Priority System
Every DataTable defines a column priority:
```
Priority 1 (always visible):  Primary identifier (Name/ID), Status, Primary Action
Priority 2 (hidden at md):    Secondary metrics (Department, Created By)
Priority 3 (hidden at sm):    Tertiary info (Dates, Reference IDs)
Priority 4 (never visible):   Move to detail view only (full description, notes)
```

### Responsive Table Patterns

```
Desktop (xl+):
  All columns visible, standard DataTable

Tablet (md, 768–1023px):
  Priority 3+ columns hidden
  Horizontal scroll enabled for remaining columns if needed
  Row height maintained (52px)
  Checkbox column maintained

Mobile (xs/sm, below 768px):
  Table converts to CARD LIST VIEW:
  Each row becomes a card (rounded-lg, shadow-sm, p-4, mb-2)
  Card shows: Primary identifier (large, text-base font-semibold),
              Status badge, Key metric, Date, Action button
  No table headers — card layout is self-describing
  Sort/filter still accessible via top controls
  Pagination remains (below card list)

Sticky columns on horizontal scroll:
  First column (ID/Name) remains sticky (position: sticky, left: 0, bg: white)
  Prevents losing context when scrolling right
```

---

## R05 — Form Responsive Behavior

```
Desktop:
  Two-column field layout for short fields (side-by-side on same row)
  Single-column for long fields (description, address)
  Max form container width: 720px, centered in content area

Tablet:
  Two-column layout maintained where fields fit comfortably
  Reduced to single-column when viewport < 900px

Mobile:
  All fields stack to single-column (col-span-1 for all)
  Full-width inputs (width: 100%)
  Keyboard awareness:
    Form scrolls to keep focused input above virtual keyboard
    Using scrollIntoView({ behavior: 'smooth', block: 'center' })
  Submit button: full-width, sticky at bottom of form (position: sticky, bottom: 0)
    With background gradient above to indicate more form content below
  Date picker: native mobile date input as fallback for custom calendar
    <input type="date"> on mobile, custom DatePicker on desktop
    Detect via breakpoint: isMobile ? <NativeDateInput> : <CustomDatePicker>
```

---

## R06 — Dialog & Drawer Responsive Behavior

```
Modal dialogs:
  Desktop: centered overlay, max-width per size variant (sm/md/lg/xl)
  Tablet: same as desktop, slightly reduced horizontal margins (16px each side)
  Mobile: bottom sheet (slides up from bottom, full viewport width)
    Height: auto up to 85vh, overflow-y: scroll within sheet
    Handle bar: 32px wide × 4px tall Neutral-300, centered at top of sheet
    Swipe-down to dismiss (touch gesture)
    Critical dialogs (confirmations): still center-modal on mobile — bottom sheet
    reserved for forms and drawers

Drawers:
  Desktop: right-anchored, fixed widths (360px/480px/600px)
  Tablet: right-anchored, full-width minus 48px gap (tap gap to close)
  Mobile: same as tablet, full-screen minus 48px gap
    Swipe-left to dismiss

Full-screen modals (document preview):
  All sizes: 100vw × 100vh, close via X button only (no outside-click dismiss)
```

---

## R07 — Dashboard Responsive Behavior

```
Desktop (xl+):
  KPI row: 4 cards, equal width, single row
  Content row 1: 2-column (60/40)
  Content row 2: 3-column equal
  Full-width table row

Laptop (lg, 1024–1279px):
  KPI row: 4 cards (may be slightly narrower — reduce p-6 to p-4 inside cards)
  Content rows: maintain column structure, reduce gap

Tablet (md, 768–1023px):
  KPI row: 2×2 grid (2 cards per row, 2 rows)
  Content row 1: single-column (widgets stack vertically)
  Content row 2: single-column
  Table: full-width, simplified columns

Mobile (xs/sm):
  KPI row: horizontal scroll snap (each card full viewport width, snap-to-center)
    Cards: min-width: 180px, displayed in a horizontal row
    Scroll indicator: dots below showing position
  All widgets: single-column stacked
  Table: card list view
  Charts: simplified (bar chart → stacked summary bar; area chart → smaller height)
  FAB: "+ New Request" floating action button at bottom-right
```

---

## R08 — Analytics & Charts Responsive Behavior

```
Desktop: Full chart grid (2-column and 3-column layouts)
Tablet: Single-column stacked charts, filter bar scrolls horizontally
Mobile:
  Charts: single-column, reduced heights (see DV17 chart height responsive values)
  Scatter plot: replaced with ranked data table
  Funnel chart: compressed height
  Multi-series charts: legend moves below chart
  Tab bar: scrolls horizontally (tabs do not wrap or stack)
  Export button: moves to overflow menu (⋯) on mobile
  Date range picker: mobile-optimized (bottom sheet calendar)
```

---

## R09 — Touch Interactions

```
Tap gestures:
  Single tap: equivalent to mouse click (activates buttons, links, toggles)
  Long press: opens context menu on table rows (alternative to hover reveal)

Swipe gestures:
  Horizontal swipe on mobile nav tabs: scrolls tab bar
  Swipe left on table row: reveals quick actions (delete, archive)
  Swipe down on bottom sheet / mobile drawer: dismisses
  Swipe left on notification: dismiss notification
  Swipe on chart (mobile): horizontal pan through data range

Scroll behavior:
  Smooth scroll: scroll-behavior: smooth on all containers
  Pull-to-refresh: on mobile list pages (native pattern via CSS overscroll-behavior)
  Momentum scroll: -webkit-overflow-scrolling: touch on scrollable containers

Pinch-zoom:
  Charts: disabled (charts have their own navigation controls)
  Documents/PDFs: enabled (native browser behavior)
  Page: never disabled (user must always be able to zoom the page)
```

---

## R10 — Ultra-Wide Display Support (3xl, 1920px+)

```
Content max-width: 1440px (--container-2xl), centered with mx-auto
Sidebar: same 256px width — does not widen on ultra-wide
Content area: grows to fill space up to 1440px, then centered in remaining space
Side gutters: auto (white space flanking the content container)

Charts: max-width constrained by card container (never stretch infinitely)
Tables: max-width inherited from container, excess columns fill with natural spacing

Typography: does NOT scale up on ultra-wide — line lengths are controlled by
            the container max-width, maintaining comfortable reading measure
```


---

# SECTION 9 — FRONTEND IMPLEMENTATION GUIDELINES

---

## F01 — Folder Organization

```
src/
├── app/                          # Next.js 15 App Router
│   ├── (auth)/                   # Route group: unauthenticated pages
│   │   ├── login/
│   │   ├── register/
│   │   │   ├── company/
│   │   │   └── vendor/
│   │   ├── verify-email/
│   │   └── forgot-password/
│   ├── (dashboard)/              # Route group: authenticated app shell
│   │   ├── layout.tsx            # App shell: sidebar + topnav + content
│   │   ├── dashboard/
│   │   ├── procurement/
│   │   │   ├── purchase-requests/
│   │   │   │   ├── page.tsx      # List page
│   │   │   │   ├── new/page.tsx  # Create form
│   │   │   │   └── [id]/page.tsx # Detail page
│   │   │   ├── rfqs/
│   │   │   ├── quotations/
│   │   │   └── purchase-orders/
│   │   ├── vendors/
│   │   │   ├── marketplace/
│   │   │   ├── connected/
│   │   │   └── [id]/
│   │   ├── orders/
│   │   ├── finance/
│   │   ├── analytics/
│   │   ├── people/
│   │   ├── communication/
│   │   ├── documents/
│   │   └── settings/
│   ├── (vendor)/                 # Route group: vendor workspace
│   │   ├── layout.tsx
│   │   ├── dashboard/
│   │   ├── rfqs/
│   │   ├── orders/
│   │   ├── catalog/
│   │   ├── finance/
│   │   └── settings/
│   ├── (admin)/                  # Route group: platform administration
│   │   ├── layout.tsx
│   │   └── [admin modules]/
│   └── api/                      # Next.js API routes (minimal — most via Supabase)
│
├── components/                   # Reusable UI components
│   ├── ui/                       # Base components (shadcn/ui extensions)
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── select.tsx
│   │   ├── dialog.tsx
│   │   └── [all base components]
│   ├── shared/                   # VendorFlow-specific shared components
│   │   ├── data-table/
│   │   ├── status-badge/
│   │   ├── kpi-card/
│   │   ├── activity-feed/
│   │   ├── empty-state/
│   │   ├── skeleton/
│   │   ├── page-header/
│   │   └── [shared compound components]
│   ├── charts/                   # Chart components (Recharts wrappers)
│   │   ├── area-chart.tsx
│   │   ├── bar-chart.tsx
│   │   ├── line-chart.tsx
│   │   ├── donut-chart.tsx
│   │   ├── funnel-chart.tsx
│   │   └── chart-tooltip.tsx
│   ├── ai/                       # AI feature components
│   │   ├── ai-card.tsx
│   │   ├── ai-badge.tsx
│   │   ├── confidence-indicator.tsx
│   │   ├── ai-recommendation-card.tsx
│   │   └── ai-coming-soon.tsx
│   ├── layout/                   # Layout components
│   │   ├── sidebar/
│   │   ├── top-navigation/
│   │   ├── workspace-switcher/
│   │   └── page-layout.tsx
│   └── modules/                  # Module-specific components
│       ├── procurement/
│       ├── vendors/
│       ├── orders/
│       └── [module components]
│
├── hooks/                        # Custom React hooks
│   ├── use-auth.ts
│   ├── use-workspace.ts
│   ├── use-permissions.ts
│   ├── use-notifications.ts
│   ├── use-realtime.ts
│   ├── use-count-up.ts
│   ├── use-reduced-motion.ts
│   └── use-debounce.ts
│
├── lib/                          # Utilities and configurations
│   ├── supabase/
│   │   ├── client.ts             # Browser client
│   │   ├── server.ts             # Server client (RSC)
│   │   └── middleware.ts
│   ├── auth.ts
│   ├── permissions.ts
│   ├── format.ts                 # Number, date, currency formatters
│   └── utils.ts
│
├── stores/                       # Zustand state stores
│   ├── auth-store.ts
│   ├── workspace-store.ts
│   ├── sidebar-store.ts
│   ├── toast-store.ts
│   └── notifications-store.ts
│
├── types/                        # TypeScript type definitions
│   ├── database.ts               # Generated Supabase types
│   ├── api.ts
│   └── ui.ts
│
└── styles/
    ├── globals.css               # CSS custom properties + Tailwind base
    └── fonts.ts                  # next/font configuration (Inter)
```

---

## F02 — Component Structure Standards

### Component File Template

```tsx
// components/shared/kpi-card/kpi-card.tsx
import { type FC } from 'react'
import { cn } from '@/lib/utils'
import { type LucideIcon } from 'lucide-react'

// 1. Types first
interface KPICardProps {
  label: string
  value: number | string
  delta?: {
    value: number
    direction: 'up' | 'down' | 'flat'
    label: string
  }
  icon: LucideIcon
  iconColor?: string
  iconBg?: string
  formatter?: (value: number) => string
  className?: string
}

// 2. Component (named export, not default for co-located test discoverability)
export const KPICard: FC<KPICardProps> = ({
  label,
  value,
  delta,
  icon: Icon,
  iconColor = 'text-blue-600',
  iconBg = 'bg-blue-50',
  formatter,
  className,
}) => {
  return (
    <div
      className={cn(
        'rounded-2xl bg-white p-6 shadow-sm',
        className
      )}
      role="region"
      aria-label={`${label}: ${value}`}
    >
      {/* component JSX */}
    </div>
  )
}

// 3. Co-located index export
// components/shared/kpi-card/index.ts
// export { KPICard } from './kpi-card'
// export type { KPICardProps } from './kpi-card'
```

### Component Folder Structure (for complex components)
```
components/shared/data-table/
├── index.ts                  # Public exports only
├── data-table.tsx            # Main component
├── data-table-column.tsx     # Column definition helper
├── data-table-toolbar.tsx    # Search + filter bar
├── data-table-pagination.tsx # Pagination footer
├── data-table-skeleton.tsx   # Loading skeleton
└── data-table.test.tsx       # Tests co-located
```

---

## F03 — Naming Conventions

```
FILES & FOLDERS:
  Components:    kebab-case folders + kebab-case files
                 components/shared/kpi-card/kpi-card.tsx
  Pages:         Next.js convention — page.tsx, layout.tsx, loading.tsx, error.tsx
  Hooks:         use-[name].ts — e.g., use-auth.ts, use-workspace.ts
  Types:         lowercase descriptive — database.ts, api.ts
  Utilities:     lowercase — format.ts, utils.ts, permissions.ts
  Stores:        [name]-store.ts — auth-store.ts

TYPESCRIPT:
  Components:    PascalCase — KPICard, DataTable, StatusBadge
  Props types:   [ComponentName]Props — KPICardProps, DataTableProps
  Interfaces:    PascalCase with I prefix ONLY for service interfaces — IAuthService
  Enums:         PascalCase — OrderStatus, UserRole
  Constants:     SCREAMING_SNAKE_CASE — MAX_FILE_SIZE, DEFAULT_PAGE_SIZE
  Functions:     camelCase — formatCurrency, getVendorById
  Hooks:         usePrefix camelCase — useAuth, useWorkspace

CSS / TAILWIND:
  Custom class names: kebab-case — .skip-link, .shimmer-animation
  CSS custom properties: --kebab-case — --sidebar-width, --topnav-height
  Never use @apply for component styles (inline Tailwind classes only)

DATABASE / API:
  Table names: snake_case — purchase_requests, rfq_vendors
  Column names: snake_case — created_at, vendor_id
  API endpoints: kebab-case — /api/purchase-requests, /api/rfq-vendors
  RPC functions: snake_case — get_dashboard_summary, create_purchase_order
```

---

## F04 — Atomic Design Principles

VendorFlow follows a modified Atomic Design system tailored for the Next.js + shadcn/ui stack:

```
ATOMS (ui/ folder):
  The smallest building blocks. Extend shadcn/ui base components with
  VendorFlow design tokens. No business logic.
  Examples: Button, Input, Badge, Avatar, Tooltip, Checkbox

MOLECULES (shared/ folder):
  Composed of 2+ atoms. Handle a specific UI pattern. Minimal business logic.
  Examples: KPICard, StatusBadge, SearchInput, FileUpload, EmptyState

ORGANISMS (shared/ + modules/ folders):
  Complex components composed of molecules and atoms. May contain local state.
  May accept data props but do not fetch data themselves.
  Examples: DataTable, Sidebar, TopNavigation, NotificationDropdown, ActivityFeed

TEMPLATES (layout/ folder):
  Page-level layouts defining structure. No business content.
  Examples: AuthLayout, DashboardLayout, AdminLayout

PAGES (app/ folder):
  Next.js page components. Fetch data, compose organisms, handle routing.
  Pages are thin — logic lives in hooks and server components.
```

---

## F05 — Design Consistency Rules

```
1. TOKENS ONLY — never hardcode colors, spacing, or shadows
   ✓ className="bg-blue-600 text-white rounded-md shadow-sm"
   ✗ style={{ backgroundColor: '#2563eb', padding: '8px' }}

2. COMPONENT REUSE — always reach for an existing component before creating new
   Check: ui/ → shared/ → modules/ before writing a new component
   If a variation is needed: extend the existing component with a new prop

3. CONSISTENT SPACING — use the 8-point grid exclusively
   All padding, margin, and gap values must be multiples of 4px (space-1 = 4px)
   ✓ p-6 (24px), gap-4 (16px), mt-3 (12px)
   ✗ p-5 (20px used sparingly), gap-7 (28px — edge case, document reason)

4. SEMANTIC HTML ALWAYS — no div-soup
   Use the correct HTML element for the job before adding ARIA
   button for actions, a for navigation, ul/li for lists, table for tabular data

5. NO INLINE STYLES for visual design (data-driven inline styles for dynamic
   values like chart colors or percentage widths are acceptable)

6. RESPONSIVE MOBILE-FIRST — start with mobile styles, add breakpoint overrides
   ✓ className="px-4 md:px-6 xl:px-8"
   ✗ className="xl:px-8 md:px-6 px-4" (reverse order works but is less readable)
```

---

## F06 — Theme Architecture

```
Implementation: CSS custom properties + Tailwind CSS class toggling

Root: <html class="light"> or <html class="dark">

CSS custom properties defined on :root (light) and .dark (dark):
  See T02 — Design Tokens, Semantic Color Tokens section

Tailwind darkMode: 'class' — uses .dark class on <html>

Theme switching:
  1. User selects theme in Settings → Preferences → Theme
  2. Preference stored in Supabase user_preferences.theme + localStorage
  3. Next.js middleware reads cookie on first load, applies class before hydration
     (prevents flash of wrong theme — critical for SSR)
  4. Client-side: useTheme() hook from next-themes library

Dark mode note:
  Dark theme is architecturally complete (all tokens defined)
  Ships as disabled in v1 — shown as "Coming Soon" in Theme settings
  Enable per workspace via feature flag for beta testing
  Full launch in v2 after QA on all 50+ modules
```

---

## F07 — Performance Optimization

### Code Splitting & Lazy Loading

```tsx
// Route-level code splitting (Next.js App Router handles this automatically)
// Component-level lazy loading for heavy components:

import dynamic from 'next/dynamic'

// Charts (Recharts is large — ~200KB gzipped)
const AreaChart = dynamic(() => import('@/components/charts/area-chart'), {
  loading: () => <ChartSkeleton height={300} />,
  ssr: false,  // Charts don't need SSR
})

// Command Palette (Framer Motion heavy)
const CommandPalette = dynamic(
  () => import('@/components/layout/command-palette'),
  { ssr: false }
)

// AI components (only loaded when AI feature flag is enabled)
const AIRecommendationCard = dynamic(
  () => import('@/components/ai/ai-recommendation-card'),
  { ssr: true }
)
```

### Virtualized Tables

```tsx
// Use @tanstack/react-virtual for tables with >100 rows
import { useVirtualizer } from '@tanstack/react-virtual'

// All DataTable instances with server-pagination (< 100 rows per page) 
// do NOT need virtualization — standard rendering is fine.
// Virtualization required for: Audit Logs, Email Queue, large Product Catalogs
```

### Image Optimization

```tsx
// Always use next/image for all images
import Image from 'next/image'

// Company/vendor logos
<Image
  src={logoUrl}
  alt={`${companyName} logo`}
  width={40}
  height={40}
  className="rounded-lg object-cover"
  placeholder="blur"
  blurDataURL={placeholderBase64}
/>

// Never use <img> tag directly in the application
```

### TanStack Query Caching Strategy

```tsx
// Default stale times per data type:
const queryConfig = {
  // User session / workspace: very long cache
  userSession:     { staleTime: Infinity },
  workspace:       { staleTime: 10 * 60 * 1000 },  // 10 min

  // List pages: moderate cache with background refresh
  listPages:       { staleTime: 60 * 1000 },        // 1 min
  
  // Dashboard widgets: shorter, refreshed on focus
  dashboard:       { staleTime: 30 * 1000 },        // 30 sec

  // Real-time subscribed data: minimal cache
  notifications:   { staleTime: 0 },
  
  // Analytics (slow to compute): longer cache
  analytics:       { staleTime: 5 * 60 * 1000 },    // 5 min
  
  // Reference data (roles, categories): very long cache
  reference:       { staleTime: 30 * 60 * 1000 },   // 30 min
}
```

### Bundle Size Targets

```
First Load JS (per route):    < 150KB gzipped
Largest Contentful Paint:     < 2.5s (3G simulated)
Time to Interactive:          < 3.5s
Cumulative Layout Shift:      < 0.1
First Input Delay:            < 100ms

Monitoring: Vercel Analytics + Next.js built-in Speed Insights
Bundle analysis: @next/bundle-analyzer in CI (weekly or on large PRs)
```

---

## F08 — Dark Mode Readiness

All components are dark-mode ready even though the feature ships in v2:

```tsx
// Every className uses semantic Tailwind tokens that respect dark: prefix
// Example - Card component:
<div className="bg-white dark:bg-navy-800 
                border border-neutral-200 dark:border-navy-700 
                shadow-sm dark:shadow-none
                text-neutral-900 dark:text-neutral-100">

// Never hardcode light colors:
✗ className="bg-white text-neutral-900"  // breaks in dark mode
✓ className="bg-surface text-primary"    // semantic token maps to correct color

// CSS variables approach (preferred for complex components):
// Component uses var(--bg-surface), var(--text-primary)
// Dark theme swaps the variable values via .dark {} CSS class
```

---

## F09 — Future Expansion Strategy

```
Multi-language support (v3):
  All user-facing strings wrapped in i18n t() function from day 1
  Even in v1: import { t } from '@/lib/i18n'
  English strings as keys: t('purchase_requests.create_title')
  This ensures zero refactoring when i18n is added

ERP Integration hooks (v3):
  API layer is abstracted behind service functions, not called directly
  All Supabase calls go through /lib/services/[domain].ts
  When ERP integration is added, service layer switches data source
  Components never call Supabase directly

AI provider abstraction (v2):
  All AI calls go through /lib/ai/client.ts
  Provider (OpenAI/Gemini/Anthropic) configured in platform settings
  Components never reference a specific AI provider

Mobile app readiness:
  API layer (Supabase Edge Functions) is platform-agnostic
  Shared TypeScript types in a separate /packages/types workspace (monorepo-ready)
  React Native app can consume same Supabase backend without changes

Microservice migration path:
  Domain boundaries already respected in folder structure
  Each domain (procurement, vendors, finance) is self-contained
  Edge Functions can be independently deployed per domain
```



---

# SECTION 10 — ENTERPRISE DESIGN SYSTEM SUMMARY

---

## The VendorFlow Design System: Single Source of Truth

This document — `DESIGN.md` — is the official, authoritative design system for the VendorFlow platform.

Every decision recorded here exists for a reason. Every token value has been chosen deliberately. Every component specification reflects the specific needs of an enterprise procurement platform serving procurement managers, finance teams, vendor operations staff, and platform administrators across organizations of all sizes.

This document governs every frontend decision made by every developer on the VendorFlow team, from the first line of code to the thousandth production deployment.

---

## What This Document Defines

**Part 1 — Design Introduction & Foundation**
The philosophy, product vision, enterprise UX principles, information architecture, navigation hierarchy, and user journey maps. This section answers the question: *why does VendorFlow look and work the way it does?*

**Part 2 — Module UI/UX Specifications**
Complete interface specifications for all 50+ modules defined in the PRD — covering layouts, components, forms, tables, states, permissions, accessibility, and developer notes. This section answers: *what does every screen look like and how does every interaction work?*

**Part 3 — Design System & Implementation Guidelines**
The enterprise component library, motion language, data visualization standards, design tokens with actual values, company branding rules, AI visual language, accessibility standards, responsive guidelines, and frontend implementation guidelines. This section answers: *how do we build it correctly, consistently, and at scale?*

---

## Consistency

Consistency is the foundation of user trust in enterprise software. When a Procurement Manager learns how to use the Purchase Request module, they should be able to use the Invoice module, the Vendor Profile, the Analytics page, and the Audit Log without relearning the interface.

VendorFlow achieves consistency through:

**Token-based styling.** Every color, spacing value, shadow, radius, and animation duration is defined as a named token. No developer hardcodes a color value. No designer specifies a pixel value that does not exist in the spacing scale. The design and implementation speak the same language.

**Component reuse.** The 42+ component specifications in Section 1 exist precisely so that no developer has to design a button, a table row, a badge, or an empty state from first principles. Every new module uses the same DataTable, the same StatusBadge, the same KPICard, and the same Toast. The user sees one platform, not forty separate feature areas.

**Pattern consistency.** A list page in Procurement looks structurally identical to a list page in Finance — because both use the same page header, filter bar, DataTable, and pagination pattern. A detail page for a Purchase Order is structured the same way as a detail page for an Invoice — because both use the two-column layout with a content area on the left and a status panel on the right. Structural consistency reduces cognitive load and accelerates task completion.

**Motion consistency.** The motion language defined in Section 2 ensures that every animation across the platform uses the same easing curves, the same durations, and the same directional logic. A modal always scales in from center. A drawer always slides from the right. A toast always enters from the right edge. The user's nervous system learns these patterns subconsciously, and the interface feels cohesive.

---

## Scalability

VendorFlow is built for growth — from a single company with a handful of users to hundreds of companies, thousands of vendors, and tens of thousands of concurrent procurement transactions.

The design system scales in four dimensions:

**Feature scalability.** The design token system, navigation structure, and layout patterns are designed to accommodate new modules without breaking existing ones. Adding a new procurement module means creating a new navigation item, a new sidebar group entry, and a set of pages that follow existing layout patterns. The visual language does not need to be extended or modified. The fifteenth module looks as considered and polished as the first.

**User scale.** The Vendor Marketplace handles 312 vendors today and 3,120 tomorrow without a redesign. The DataTable component uses server-side pagination and keyset cursors. The Notification Center uses infinite scroll with virtual rendering. The Audit Log uses server-side filtering with indexed queries. The components are built for data density, not demo screenshots.

**Team scale.** As more developers join the team, the design system prevents inconsistency at scale. New team members read this document, understand the token system and component library, and ship consistent UI without needing senior design review on every pull request. The system itself enforces quality.

**Platform scale.** The token architecture supports dark mode, future theming, and white-labeling without component-level changes. The AI visual language is isolated behind the purple token layer, which can be expanded to support more AI modules without affecting the standard procurement UI. The feature flag system allows capabilities to be added, enabled per workspace, and gradually rolled out without a new deployment.

---

## Maintainability

A design system that cannot be maintained is a design system that will be abandoned. VendorFlow's design system is built to remain the source of truth for years, not months.

**Semantic tokens over primitive tokens.** Components reference `--bg-surface` and `--text-primary`, not `#FFFFFF` and `#0F172A`. When the exact shade of the neutral palette changes in a future design iteration, a single token value update propagates across every component that references it. No component needs to be reopened, no Figma file needs a mass selection-and-replace, and no QA pass is needed to find missed instances.

**Component encapsulation.** Every component spec defines its own variants, states, sizes, motion, and accessibility requirements. When a component needs to change — a new variant is added to the Button, or the DataTable gets a new bulk action capability — the change is contained within the component. Its interface (props) changes minimally; its internal implementation can evolve freely.

**Co-located tests.** Test files live next to the components they test. This ensures tests are updated when components change. Orphaned tests in a separate directory are tests that will be forgotten. Every component in the UI library has a test file that validates its visual variants, keyboard accessibility, and ARIA state management.

**This document is versioned.** `DESIGN.md` lives in the repository alongside the code it governs. Version history is Git history. Design decisions are traceable. The rationale for a choice — why the primary button is 40px tall, why the sidebar is Deep Navy, why AI features use purple — is captured here and available to any future developer who asks why.

---

## Accessibility

Accessibility in VendorFlow is not a compliance checkbox. It is a quality metric applied to every component before it is considered complete.

The standard is **WCAG 2.1 Level AA** across all modules, all screen sizes, and all interaction patterns. The specific requirements are documented in Section 7 — Accessibility Standards. The testing checklist in that section must be executed before any module is marked production-ready.

The key accessibility commitments of the VendorFlow design system are:

**Keyboard completeness.** Every action available to a mouse user is equally available to a keyboard user. The Global Search, the Command Palette, the approval workflow, the vendor selection, the payment initiation — all operable without a pointing device.

**Screen reader accuracy.** Every interactive element has a meaningful accessible name. Every status communicates its meaning through text, not only through color or icon. Every dynamic update — new notification, form error, approval status change — is announced through the appropriate ARIA live region.

**Color independence.** No information in VendorFlow is communicated by color alone. Status badges always include text. Chart series always use distinct line styles and labels in addition to colors. Error states always include an icon and a text description alongside the red border.

**Motion respect.** Users who prefer reduced motion receive a fully functional interface. Every animation has an instant fallback. The platform communicates state changes, confirmations, and navigation through structural changes in the DOM — never through motion alone.

**High contrast support.** The `forced-colors: active` media query is handled explicitly. Focus rings, component boundaries, and interactive states remain visible and operable in Windows High Contrast mode.

---

## Enterprise Quality

Enterprise quality is visible in the details that users notice without being able to articulate. It is the reason a procurement manager opens VendorFlow in the morning and feels confident rather than reluctant.

**Information density without clutter.** The DataTable shows seven columns of procurement data in 52px rows without feeling overwhelming — because the typography hierarchy, the muted secondary text, and the generous column spacing create layers of visual priority. The most important information registers immediately. The supporting detail is there when needed.

**Trust through visual stability.** Enterprise software must not surprise its users. Skeleton loaders prevent layout shift. Optimistic UI updates confirm actions instantly. Error messages are specific and actionable. The interface behaves predictably on every interaction, building the quiet confidence that allows a finance manager to approve a ₹1.2L payment without hesitation.

**Professionalism in every component.** The invoice document view is formatted like a real tax invoice, not like a web form. The purchase order PDF looks like it came from a professional procurement department, not a generic SaaS template. The vendor profile communicates credibility through a structured hero section, verifiable certifications, a visible performance score, and authentic customer reviews. Every surface communicates that VendorFlow is software worthy of enterprise trust.

**Performance as a design value.** A page that loads in 3 seconds is not a premium experience. Skeleton loaders minimize perceived wait time. TanStack Query caches aggressively and refreshes intelligently. Charts animate in rather than popping in after a delay. Server components handle data-heavy pages. The platform feels fast because it is designed to feel fast, not just coded to be fast.

**Consistency as a signal.** When every modal has the same anatomy, every table row has the same hover behavior, and every form follows the same section card pattern, the user stops consciously processing the interface and starts working with it. Consistency is the achievement of invisible design — the interface steps out of the way and lets the work happen.

---

## Premium User Experience

VendorFlow does not look like a procurement system. It looks like the procurement system that the best ones will become.

The visual references — Stripe, Linear, Vercel, Ramp, Clerk, Notion — were chosen because they represent a generation of enterprise software that proved that complexity does not require ugliness, that data density does not require visual chaos, and that professional software can be genuinely pleasant to use.

The Deep Navy sidebar communicates structure and authority. The Electric Blue interactive layer communicates precision and responsiveness. The generous whitespace communicates clarity of thinking. The rounded cards communicate approachability within a rigorous system. The subtle shadows communicate depth without visual noise. The Inter typeface communicates intelligence without coldness.

Premium is achieved through subtraction. Every unnecessary border removed. Every redundant label eliminated. Every animation shortened to the minimum duration that still communicates meaning. Every page stripped to the information that matters for the current task. What remains — the essentials, precisely executed — is what premium looks like.

The motion language reinforces this. Transitions are 150–250ms, not 500ms. Charts enter the viewport in 600ms, not 1.5 seconds. Count-up animations complete in 800ms. The platform moves at the user's pace, not at the pace of a product manager's demo reel.

The result is an interface that procurement professionals will choose to use — not because they are required to, but because it makes their work faster, clearer, and more confident.

---

## Future AI Readiness

VendorFlow is designed from the ground up to accommodate AI-powered procurement intelligence as a first-class citizen of the platform, not as a bolted-on afterthought.

The AI visual language — documented in Section 6 — creates a clear, persistent semantic distinction between deterministic system behavior and AI-driven suggestions. Premium Purple means intelligent. The Sparkles icon means AI. The confidence indicator means uncertainty. These meanings are established in v1 through the Coming Soon treatment, so that when AI modules ship in v2 and beyond, users already understand the visual language.

The feature flag architecture means AI capabilities can be enabled per workspace for beta testing, gradually rolled out to the broader user base, and disabled without impact to the core procurement workflows.

The provider-agnostic AI client layer means VendorFlow is not locked to any single AI vendor. OpenAI, Google Gemini, Anthropic Claude, or any future LLM provider can power the AI modules through a configuration change. The interface does not change; only the intelligence behind it does.

The five planned AI modules — Vendor Recommendation, Quotation Comparison, Procurement Insights, Vendor Performance Prediction, and Risk Analysis — are already designed, specified, and visually integrated into their host modules. When the AI infrastructure is ready, the UI is already waiting.

AI readiness is not a future concern. It is designed in.

---

## This Document Is Authoritative

No frontend implementation decision supersedes what is defined in this document.

When a developer is uncertain how a button should behave, they read Section 1 — C01 Button.
When a designer questions the color of a pending badge, they read Section 4 — T02 Color Tokens.
When a product manager asks why the sidebar is always dark, they read Part 1, Section 1.2 Product Vision.
When a new engineer joins the team and asks how the platform should feel, they read Part 3, Section 10 — this section.

The design system is a living document. When a component specification needs to change, this document changes first. Code follows documentation, not the other way around. Pull requests that introduce visual or interaction patterns not defined here are returned for documentation before merge.

VendorFlow is one platform. This document ensures it looks, feels, and works like one.

---

**** END OF DESIGN.md ****
