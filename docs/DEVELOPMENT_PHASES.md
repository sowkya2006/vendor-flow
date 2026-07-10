# VendorFlow – Development Phases

**Version:** 1.0.0
**Project Name:** VendorFlow
**Project Type:** Enterprise Multi-Tenant SaaS Procurement & Vendor Collaboration Platform
**Author:** Sowkya
**Document Type:** Implementation Blueprint
**Status:** Active
**Last Updated:** July 2026

---

> This document is the **single implementation blueprint** for the entire VendorFlow project.
> It defines what to build, in what order, how to build it, and what done looks like.
> Every developer, at every phase, works from this document.

---

# Table of Contents

1. Introduction
2. Overall Development Roadmap
3. Milestone Planning
4. Phase 1 — Project Foundation
5. Phase 2 — UI Foundation
6. Phase 3 — Backend Foundation

---

# INTRODUCTION

---

## 1.1 Purpose

This document defines the complete, phased implementation plan for VendorFlow — an enterprise multi-tenant SaaS procurement and vendor collaboration platform.

It answers three questions for every developer at every point in the project:

1. **What** to build — the exact deliverables and acceptance criteria for each phase
2. **How** to build it — the coding standards, architecture principles, folder structure, and tooling configuration
3. **In what order** to build it — the sequenced phase plan that minimizes rework, respects dependencies, and delivers working software at every milestone

DEVELOPMENT_PHASES.md is the authoritative implementation reference. It operates downstream of PRD.md (which defines *what* the product does) and DESIGN.md (which defines *how* it looks and behaves). When a conflict exists between this document and either PRD.md or DESIGN.md, the higher-level document takes precedence. This document is then updated to reflect the resolution.

---

## 1.2 Objectives

This document achieves the following objectives:

- Establish a clear, dependency-ordered sequence of development phases from project initialization to production deployment
- Define coding standards, naming conventions, and architecture rules that every developer follows from day one
- Define the Definition of Done (DoD) for every phase so "complete" is never ambiguous
- Identify risks, dependencies, and mitigation strategies at each phase before they become blockers
- Serve as the onboarding document for any new developer joining the project at any stage
- Ensure the final implementation is fully consistent with the PRD's functional requirements and the DESIGN.md's component and token specifications

---

## 1.3 Relationship with PRD.md

The PRD defines the product requirements. This document translates those requirements into a sequenced build plan.

**Traceability:**
Every phase in this document maps to specific PRD modules. Phase 4 (Authentication) maps to PRD Module 1. Phase 5 (Company Workspace) maps to PRD Module 2. Phase 9 (Vendor Management) maps to PRD Modules 5–8. Each phase section explicitly states which PRD modules it implements so requirements are never orphaned.

**Scope discipline:**
This document implements exactly what the PRD defines. No feature is added beyond the PRD's in-scope list. No PRD feature is silently omitted. The Out of Scope section of the PRD (mobile apps, offline mode, ERP integrations, AI automation in v1) is respected throughout.

---

## 1.4 Relationship with DESIGN.md

DESIGN.md is the visual and interaction specification. This document ensures the implementation honors it.

**Token implementation:**
Phase 2 (UI Foundation) implements DESIGN.md Section 4 (Design Tokens) in full before any module is built. No color, spacing, or shadow value is hardcoded anywhere in the codebase. Every style references a token.

**Component implementation:**
Every reusable component built in Phases 1–3 follows the specifications in DESIGN.md Section 1 (Enterprise Component Library). Variant names, size tokens, state behaviors, ARIA attributes, and motion durations match the spec exactly.

**Folder structure:**
The project folder organization in this document is taken directly from DESIGN.md Section F01. No deviation without a documented reason.

**Naming conventions:**
All naming follows DESIGN.md Section F03. File names, component names, hook names, store names, and CSS variable names follow the exact patterns defined there.

---

## 1.5 Development Philosophy

VendorFlow is built on five development principles that govern every technical decision made during the project.

**Correctness before speed.**
Every feature is built correctly on the first pass. Shortcuts that create technical debt — hardcoded values, skipped validation, missing error handling, no RLS — are rejected at code review. The cost of fixing a security gap or architectural mistake in a multi-tenant SaaS is far higher than the cost of building it correctly the first time.

**Backend security is non-negotiable.**
Row Level Security is enabled on every table from the moment it is created. No table is created without RLS policies. No user can read or modify data that does not belong to their workspace. Security is not a phase; it is a requirement of every database migration.

**Components are built once and reused.**
Phase 2 establishes the complete UI foundation before any module is started. DataTable, StatusBadge, KPICard, FormSection, EmptyState, and the full token system are complete before the first module page is written. Modules consume components — they do not create their own.

**Server-first data fetching.**
React Server Components handle data fetching for all initial page renders. Client components are used only when interactivity requires it — forms, real-time subscriptions, animations, and client-side state. This maximizes performance and reduces the data exposed to the client.

**Every phase is independently deployable.**
At the end of every phase, the application is in a working, deployable state — even if incomplete. Phase 1 deploys a blank Next.js app with the correct structure. Phase 2 deploys a component playground. Phase 3 deploys a connected Supabase backend. No phase leaves the application in a broken state.

---

## 1.6 Architecture Principles

### Multi-Tenancy

VendorFlow is a multi-tenant SaaS platform. Tenant isolation is the single most important architectural constraint.

```
Tenancy model:
  - Every company is a tenant with a unique company_id (UUID)
  - Every vendor is a separate entity with a unique vendor_id (UUID)
  - Users belong to exactly one company workspace OR one vendor workspace
    (a user can have both — different auth contexts)
  - All company-scoped tables carry a company_id foreign key
  - All vendor-scoped tables carry a vendor_id foreign key
  - Row Level Security (RLS) enforces that queries only return rows
    matching the authenticated user's workspace
  - No application-level filtering is used as the sole tenancy enforcement
    (application filters are a convenience on top of RLS, never the only guard)
```

### API Layer

```
Data access strategy:
  - Server Components: use Supabase server client directly for initial page data
  - Client Components: use TanStack Query + Supabase browser client for
    interactive data fetching, mutations, and real-time subscriptions
  - Complex operations (payment, PDF generation, email dispatch,
    multi-table transactions): Supabase Edge Functions (Deno/TypeScript)
  - No REST API routes in Next.js (no /api/ handlers for data) —
    Edge Functions serve as the API layer for complex operations
  - Supabase RPC functions for complex aggregations (analytics, dashboards)
```

### State Management

```
Three tiers of state:
  1. Server state (TanStack Query):
     All remote data — procurement records, vendors, employees, analytics.
     Never duplicated in Zustand.

  2. Global client state (Zustand stores):
     Auth session, workspace context, sidebar state, notification count,
     toast queue. Data that is needed across unrelated components.

  3. Local component state (useState / useReducer):
     Form state, modal open/close, accordion expand. Never promoted to
     Zustand unless genuinely needed across components.
```

### Authentication Architecture

```
Supabase Auth handles all authentication:
  - Email + password: Supabase native
  - Google OAuth: Supabase Google provider
  - JWT tokens: httpOnly cookies via Supabase SSR helpers
  - Session refresh: Supabase middleware on every request

User metadata carried in JWT:
  user_metadata.role: 'company_user' | 'vendor_user' | 'platform_admin'
  user_metadata.workspace_id: company_id or vendor_id
  user_metadata.workspace_type: 'company' | 'vendor' | 'platform'

Route protection:
  Next.js middleware checks session validity on every protected route.
  Unauthenticated requests redirect to /login.
  Workspace type mismatch redirects to the correct workspace root.
```

### Database Design Principles

```
- All primary keys: UUID (gen_random_uuid()) — never serial integers
- All timestamps: timestamptz (UTC), named created_at / updated_at
- Soft deletes: deleted_at timestamptz nullable column — no hard deletes
  except for user-initiated account deletion and temp data
- Optimistic locking: updated_at checked before writes on critical records
- All foreign keys: explicit FK constraints with appropriate cascade rules
- Indexes: created on all foreign keys and all filter/sort columns
  (status, created_at, company_id, vendor_id minimum)
- Migrations: sequential numbered files, never edited after merge
```

### File Storage Architecture

```
Supabase Storage buckets (all private unless noted):
  company-logos/          [public read, authenticated write]
  vendor-logos/           [public read, authenticated write]
  product-images/         [public read, vendor-authenticated write]
  vendor-documents/       [private — vendor + platform admin read]
  pr-attachments/         [private — company workspace read]
  po-documents/           [private — company + vendor read for their POs]
  invoices/               [private — company + vendor read]
  payment-receipts/       [private — company + vendor read]
  reports/                [private — workspace admin read]
  documents/              [private — workspace read]
  message-attachments/    [private — conversation participants read]
  avatars/                [public read, authenticated write]

Storage policies: All implemented via Supabase Storage RLS policies,
mirroring the database RLS constraints for each entity.
```

---

## 1.7 Coding Standards

### TypeScript

```typescript
// Strict mode: ON — tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "exactOptionalPropertyTypes": true
  }
}

// Rules:
// - No 'any' type. Use 'unknown' and narrow with type guards.
// - All function parameters and return types explicitly typed
//   (exceptions: trivial arrow functions with inferred returns)
// - No non-null assertions (!.) without a comment explaining why it is safe
// - Enums for all status values — never raw string literals
//   ✓ OrderStatus.Pending   ✗ 'pending'
// - Prefer 'type' over 'interface' for data shapes
//   Prefer 'interface' for React component props (better error messages)
// - Zod schemas for all external data validation (form inputs, API responses,
//   URL params, environment variables)
```

### React / Next.js

```typescript
// Component rules:
// - Named exports for all components (no default exports except Next.js pages)
// - Props destructured in function signature, never accessed via props.xxx
// - No inline JSX styles for visual design — Tailwind classes only
// - Server Components by default. Add 'use client' only when needed:
//   hooks (useState, useEffect, useContext), event handlers,
//   browser APIs, Framer Motion, Zustand
// - useCallback / useMemo only for expensive computations or stable
//   references passed to memoized children — not as default practice
// - All useEffect dependencies declared correctly — no suppression comments
//   without explanation

// Next.js rules:
// - Loading states: loading.tsx per route segment
// - Error boundaries: error.tsx per route segment
// - Metadata: generateMetadata() for all page routes
// - Images: next/image always, never <img>
// - Fonts: next/font/google for Inter — no external font CDN requests
```

### Tailwind CSS

```
Rules:
  - Never hardcode colors, spacing, or shadows in className strings
    that are not Tailwind tokens defined in tailwind.config.ts
  - No @apply in component styles — inline Tailwind classes only
  - Responsive prefix order: mobile-first (base → sm: → md: → lg: → xl:)
  - Conditional classes via cn() utility (clsx + tailwind-merge)
    ✓ cn('rounded-md', isError && 'border-red-600')
    ✗ isError ? 'border-red-600' : 'border-neutral-200' (without merge)
  - Class sorting: enforced by prettier-plugin-tailwindcss
  - Design token CSS variables exposed via tailwind.config.ts extend block
    as defined in DESIGN.md Section T15
```

### Error Handling

```typescript
// All async operations: explicit try/catch with typed error handling
// Never swallow errors silently
// User-facing errors: surfaced via toast (toast-store) or inline Alert
// Server-side errors: logged to error_logs table via Edge Function
// Supabase errors: check .error property on every query result
//   const { data, error } = await supabase.from('...').select()
//   if (error) { /* handle, never assume data is defined */ }
// Form validation: Zod + react-hook-form — server-side re-validation
//   in Edge Functions even after client-side validation passes
```

### Security

```
Rules enforced at code review:
  - No secrets in code, .env.local only (never committed)
  - No client-side Supabase service role key — server/Edge Functions only
  - All user-supplied values passed as parameterized query values,
    never string-concatenated into queries
  - File uploads: validate type, size, and content-type server-side
    (never trust client-provided MIME type)
  - All Edge Functions: validate JWT and extract user from Supabase Auth,
    never from a client-provided header
  - RLS: verified via supabase test rls before any table ships to staging
```

---

## 1.8 Folder Organization Principles

The complete folder structure is defined in DESIGN.md Section F01. The following principles govern how it is maintained:

```
1. Feature boundaries are respected.
   Procurement components go in components/modules/procurement/.
   Vendor components go in components/modules/vendors/.
   Nothing shared between modules goes in a module folder — it goes in
   components/shared/.

2. Co-location of related files.
   A component's test file, types file, and sub-components live in the
   same folder as the component.
   components/shared/data-table/
     data-table.tsx
     data-table.test.tsx
     data-table-toolbar.tsx
     data-table-pagination.tsx
     index.ts

3. Index files for clean imports.
   Every component folder has an index.ts that exports the public API.
   Consumers import from the folder, not the file:
     ✓ import { DataTable } from '@/components/shared/data-table'
     ✗ import { DataTable } from '@/components/shared/data-table/data-table'

4. Absolute imports via path aliases.
   All internal imports use @ aliases, never relative paths beyond one level:
     ✓ import { useAuth } from '@/hooks/use-auth'
     ✗ import { useAuth } from '../../../hooks/use-auth'

5. No circular dependencies.
   ui/ components never import from shared/ or modules/.
   shared/ components never import from modules/.
   modules/ components may import from shared/ and ui/.
   hooks/ never import from components/.
   stores/ never import from components/.
```

---

## 1.9 Naming Conventions

Directly from DESIGN.md Section F03. Reproduced here as the authoritative reference for implementation:

```
FILES & FOLDERS
  Components:         kebab-case    components/shared/kpi-card/kpi-card.tsx
  Pages:              Next.js       page.tsx, layout.tsx, loading.tsx, error.tsx
  Hooks:              use-prefix    use-auth.ts, use-workspace.ts, use-permissions.ts
  Utilities:          lowercase     format.ts, utils.ts, permissions.ts
  Stores:             name-store    auth-store.ts, workspace-store.ts
  Types:              lowercase     database.ts, api.ts, ui.ts
  Edge Functions:     kebab-case    get-dashboard-summary.ts

TYPESCRIPT
  Components:         PascalCase    KPICard, DataTable, StatusBadge
  Props interfaces:   Name + Props  KPICardProps, DataTableProps
  Type aliases:       PascalCase    OrderStatus, UserRole, WorkspaceType
  Enums:              PascalCase    enum OrderStatus { Draft, Pending, Approved }
  Constants:          UPPER_SNAKE   MAX_FILE_SIZE, DEFAULT_PAGE_SIZE
  Functions/hooks:    camelCase     formatCurrency, getVendorById, useWorkspace

DATABASE
  Table names:        snake_case    purchase_requests, rfq_vendors
  Column names:       snake_case    created_at, vendor_id, company_id
  RPC functions:      snake_case    get_dashboard_summary, create_purchase_order
  Migrations:         numbered      0001_create_companies.sql

CSS CUSTOM PROPERTIES
  All tokens:         kebab-case    --bg-surface, --text-primary, --sidebar-width-expanded
  Never camelCase in CSS:          --bgSurface (invalid per CSS spec)
```

---

## 1.10 Git Workflow

### Branch Strategy

```
main (production)
  └── staging
        └── develop
              ├── feature/[phase-number]-[short-description]
              ├── fix/[issue-number]-[short-description]
              ├── chore/[description]
              └── docs/[description]

Branch naming examples:
  feature/01-project-foundation
  feature/02-ui-token-system
  feature/04-authentication-email-login
  feature/09-vendor-marketplace
  fix/124-rfq-deadline-not-saving
  chore/update-supabase-types
  docs/update-development-phases

Rules:
  - No direct commits to main or staging
  - No direct commits to develop without a PR
  - feature/ branches created from develop
  - PRs merge into develop after code review
  - develop → staging: manual merge before staging deploy
  - staging → main: manual merge before production deploy
  - All merges via PR (no fast-forward — preserve merge history)
```

### Commit Standards

VendorFlow uses [Conventional Commits](https://www.conventionalcommits.org/).

```
Format:
  <type>(<scope>): <short description>

  [optional body]

  [optional footer: closes #issue]

Types:
  feat:     New feature (corresponds to PRD module or task)
  fix:      Bug fix
  chore:    Maintenance, dependency updates, config changes
  docs:     Documentation changes
  style:    Code style changes (formatting — no logic change)
  refactor: Code restructuring (no new features, no bug fixes)
  test:     Adding or updating tests
  perf:     Performance improvements
  ci:       CI/CD pipeline changes
  build:    Build system changes

Scopes (match phase or module):
  foundation, ui, auth, workspace, iam, employees, vendors,
  catalog, procurement, rfq, quotation, orders, invoices,
  payments, notifications, analytics, admin, ai, infra

Examples:
  feat(auth): implement email registration with OTP verification
  feat(procurement): add purchase request list page with filters
  fix(rfq): correct deadline validation for same-day RFQs
  chore(deps): update supabase-js to 2.45.0
  docs(phases): add Phase 4 authentication implementation guide
  test(auth): add integration tests for Google OAuth flow

Rules:
  - Subject line: max 72 characters, imperative mood, no period at end
  - Body: explain WHY not WHAT (code shows what; commit explains why)
  - One logical change per commit — atomic commits only
  - Never commit secrets, .env files, or generated files
  - Pre-commit hooks (husky + lint-staged) run lint, type-check, and
    format check before every commit
```

### Pull Request Standards

```
PR title: follows commit format — feat(auth): implement email login
PR description template:
  ## What
  [What was built or changed — brief, factual]

  ## Why
  [Business reason or bug description]

  ## How
  [Technical approach — only if non-obvious]

  ## Testing
  [What was manually tested]
  [Which automated tests cover this]

  ## Screenshots
  [Required for UI changes]

  ## Checklist
  - [ ] Types are complete (no 'any')
  - [ ] RLS policies written and tested for all new tables
  - [ ] Error states handled (loading, empty, error)
  - [ ] Responsive behavior verified (desktop, tablet, mobile)
  - [ ] Accessibility: keyboard nav and ARIA verified
  - [ ] Design tokens used (no hardcoded colors or spacing)
  - [ ] DESIGN.md component spec followed
  - [ ] Definition of Done met for this phase

Review requirements:
  - Minimum 1 approving review before merge
  - No merge if CI fails (lint, type-check, tests, build)
  - Author merges their own PR after approval (not reviewer)
```

---

## 1.11 Environment Strategy

VendorFlow runs in three environments. Each environment has its own Supabase project and its own Vercel deployment.

```
ENVIRONMENT    BRANCH      SUPABASE PROJECT     VERCEL URL
─────────────────────────────────────────────────────────────
development    local        local supabase CLI   localhost:3000
staging        staging      vendorflow-staging   staging.vendorflow.in
production     main         vendorflow-prod      vendorflow.in / app.vendorflow.in
```

### Environment Variables

```
# .env.local (development — never committed)
# .env.staging (managed in Vercel / CI)
# .env.production (managed in Vercel / CI)

NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=          # Server/Edge Functions only
NEXT_PUBLIC_APP_URL=                # https://app.vendorflow.in
NEXT_PUBLIC_APP_ENV=                # development | staging | production
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=                # Server/Edge Functions only
NEXT_PUBLIC_RAZORPAY_KEY_ID=        # Client-safe
RESEND_API_KEY=                     # Server/Edge Functions only
NEXT_PUBLIC_GOOGLE_OAUTH_CLIENT_ID= # Supabase handles OAuth — this for reference
```

### Configuration Management

```
Environment variable validation:
  All env vars validated at application startup using Zod.
  Missing or malformed vars throw at build time, not runtime.

  // lib/env.ts
  import { z } from 'zod'

  const envSchema = z.object({
    NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
    NEXT_PUBLIC_APP_URL: z.string().url(),
    NEXT_PUBLIC_APP_ENV: z.enum(['development', 'staging', 'production']),
    NEXT_PUBLIC_RAZORPAY_KEY_ID: z.string().min(1),
  })

  export const env = envSchema.parse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    // ...
  })

Feature flags:
  Stored in Supabase table 'feature_flags':
    id, flag_name, enabled, workspace_id (nullable — null = platform-wide)
  Checked via useFeatureFlag(flagName) hook.
  AI modules gated behind feature flags as documented in DESIGN.md AI13.

Secrets rotation:
  Razorpay keys rotated quarterly.
  Resend API key rotated if compromised.
  Supabase service role key: restricted to Edge Functions, never exposed.
```

---

## 1.12 Definition of Done (DoD)

A phase or task is considered **Done** only when ALL of the following criteria are met. Not some. All.

### Code Quality

```
✓ TypeScript: zero type errors (tsc --noEmit passes)
✓ ESLint: zero lint errors (eslint . passes)
✓ Prettier: all files formatted (prettier --check . passes)
✓ No 'any' types without documented justification
✓ No console.log statements in committed code
✓ No TODO comments without a linked GitHub issue
```

### Design Compliance

```
✓ Component follows DESIGN.md specification exactly
  (variant names, sizes, states, ARIA, motion)
✓ All colors reference design tokens — zero hardcoded hex values
✓ All spacing references Tailwind scale — zero arbitrary spacing values
✓ Typography uses defined scale — zero hardcoded font sizes
✓ Responsive behavior verified at desktop, tablet, and mobile breakpoints
✓ Dark mode classes present on all colored elements (even if dark mode
  is not yet shipped — the architecture must be ready)
```

### Functionality

```
✓ Feature matches PRD specification exactly (no scope creep, no omissions)
✓ All user flows in the PRD for this feature are implemented
✓ All form validation rules implemented (client-side Zod + server-side)
✓ All loading states implemented (skeleton loaders, not spinners)
✓ All empty states implemented with correct icon, copy, and CTA
✓ All error states implemented with specific messages and recovery actions
✓ All success states implemented (toast notifications, redirects)
```

### Security

```
✓ RLS policies written for all new tables
✓ RLS policies tested: correct user can access, wrong user cannot
✓ All file uploads validated server-side (type, size, content)
✓ All Edge Functions authenticate the user from JWT before executing
✓ No sensitive data logged or returned to the client unnecessarily
✓ Input sanitization applied to all user-supplied content
```

### Accessibility

```
✓ All interactive elements keyboard accessible
✓ All interactive elements have correct ARIA labels/roles/states
✓ Focus management correct (focus enters modals, returns on close)
✓ Color is not the only differentiator for any state
✓ axe-core automated scan: zero violations introduced by this PR
```

### Testing

```
✓ Unit tests written for all utility functions and hooks
✓ Component tests written for all new shared/ components
✓ Integration tests written for critical user flows
✓ All existing tests pass (no regressions)
```

### Documentation

```
✓ JSDoc comments on all exported functions with non-obvious behavior
✓ Supabase types regenerated and committed after schema changes
✓ Migration files committed and documented
✓ DEVELOPMENT_PHASES.md task checklist items marked complete
```


---

# OVERALL DEVELOPMENT ROADMAP

---

## 2.1 Visual Roadmap

```
┌─────────────────────────────────────────────────────────────────┐
│                  VENDORFLOW BUILD SEQUENCE                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  PHASE 1 ── Project Foundation                                  │
│             Next.js 15 scaffold, TypeScript, ESLint,            │
│             Prettier, Husky, path aliases, CI pipeline          │
│                          │                                      │
│                          ▼                                      │
│  PHASE 2 ── UI Foundation                                       │
│             Tailwind tokens, shadcn/ui, design system,          │
│             sidebar, top nav, layout, all shared components     │
│                          │                                      │
│                          ▼                                      │
│  PHASE 3 ── Backend Foundation                                  │
│             Supabase project, DB schema, RLS, Auth config,      │
│             Storage buckets, Edge Functions scaffold            │
│                          │                                      │
│                          ▼                                      │
│  PHASE 4 ── Authentication                                      │
│             Email/password, Google OAuth, OTP verification,     │
│             password reset, invitation acceptance               │
│                          │                                      │
│                          ▼                                      │
│  PHASE 5 ── Company Workspace                                   │
│             Company registration, onboarding wizard,            │
│             workspace config, company profile settings          │
│                          │                                      │
│                          ▼                                      │
│  PHASE 6 ── IAM (Roles & Permissions)                           │
│             Custom roles, permission matrix, RBAC engine,       │
│             permission-gated navigation                         │
│                          │                                      │
│                          ▼                                      │
│  PHASE 7 ── Employee Management                                 │
│             Invite employees, employee directory,               │
│             department management, role assignment              │
│                          │                                      │
│                          ▼                                      │
│  PHASE 8 ── Vendor Registration & Onboarding                    │
│             Vendor registration, onboarding wizard,             │
│             document upload, verification workflow              │
│                          │                                      │
│                          ▼                                      │
│  PHASE 9 ── Vendor Marketplace & Profile                        │
│             Vendor discovery, search & filters,                 │
│             vendor profile, documents, performance score        │
│                          │                                      │
│                          ▼                                      │
│  PHASE 10 ── Product Catalog & Inventory                        │
│              Product CRUD, image upload, categories,            │
│              inventory tracking, vendor catalog view            │
│                          │                                      │
│                          ▼                                      │
│  PHASE 11 ── Purchase Requests                                  │
│              PR creation, draft/submit workflow,                │
│              PR list, detail view, attachments                  │
│                          │                                      │
│                          ▼                                      │
│  PHASE 12 ── Approval Workflow Engine                           │
│              Workflow builder, multi-step approval,             │
│              sequential/parallel, escalation, notifications     │
│                          │                                      │
│                          ▼                                      │
│  PHASE 13 ── RFQ (Request for Quotation)                        │
│              RFQ creation, vendor selection, deadline,          │
│              send RFQ, response tracking                        │
│                          │                                      │
│                          ▼                                      │
│  PHASE 14 ── Quotation Management                               │
│              Vendor quotation submission, line items,           │
│              revision, company review                           │
│                          │                                      │
│                          ▼                                      │
│  PHASE 15 ── Vendor Comparison & Selection                      │
│              Side-by-side comparison table, best-value          │
│              highlighting, selection with reason, PO trigger    │
│                          │                                      │
│                          ▼                                      │
│  PHASE 16 ── Purchase Orders                                    │
│              PO generation, document view, PDF export,          │
│              email dispatch, vendor acceptance/rejection        │
│                          │                                      │
│                          ▼                                      │
│  PHASE 17 ── Order Tracking & Fulfillment                       │
│              Order status lifecycle, shipment creation,         │
│              tracking details, GRN (goods receipt)              │
│                          │                                      │
│                          ▼                                      │
│  PHASE 18 ── Invoice Management                                 │
│              Vendor invoice generation, GST calculation,        │
│              PDF export, company review & approval              │
│                          │                                      │
│                          ▼                                      │
│  PHASE 19 ── Payment Management                                 │
│              Razorpay integration, payment initiation,          │
│              webhook handling, receipts, payment history        │
│                          │                                      │
│                          ▼                                      │
│  PHASE 20 ── Reviews & Ratings                                  │
│              Post-delivery review form, star rating system,     │
│              vendor reputation score updates                    │
│                          │                                      │
│                          ▼                                      │
│  PHASE 21 ── Notification System                                │
│              In-app notifications, real-time (Supabase          │
│              Realtime), toast system, notification center,      │
│              email notifications (Resend)                       │
│                          │                                      │
│                          ▼                                      │
│  PHASE 22 ── Communication Center                               │
│              Company-vendor messaging, contextual threads,      │
│              file attachments, read receipts                    │
│                          │                                      │
│                          ▼                                      │
│  PHASE 23 ── Document Management                                │
│              Document library, upload/download, categories,     │
│              version history, access control                    │
│                          │                                      │
│                          ▼                                      │
│  PHASE 24 ── Dashboards (Company & Vendor)                      │
│              Company Dashboard KPIs, Vendor Dashboard KPIs,    │
│              charts, pending actions, activity feed             │
│                          │                                      │
│                          ▼                                      │
│  PHASE 25 ── Analytics & Reports                                │
│              All analytics tabs, chart library integration,     │
│              report generation, PDF/Excel/CSV export            │
│                          │                                      │
│                          ▼                                      │
│  PHASE 26 ── Audit Logs & Global Search                         │
│              Audit log table, filters, detail panel,            │
│              global search, command palette                     │
│                          │                                      │
│                          ▼                                      │
│  PHASE 27 ── Settings & Profile                                 │
│              All settings sections, notification preferences,   │
│              security settings, profile management              │
│                          │                                      │
│                          ▼                                      │
│  PHASE 28 ── Platform Administration                            │
│              Admin dashboard, vendor approval workflow,         │
│              workspace monitoring, system health, email queue   │
│                          │                                      │
│                          ▼                                      │
│  PHASE 29 ── Subscription & Billing                             │
│              Plan management, Razorpay Subscriptions,           │
│              billing history, usage metering, API management    │
│                          │                                      │
│                          ▼                                      │
│  PHASE 30 ── AI Modules (Coming Soon Scaffolding)               │
│              Feature flag system, AI visual language,           │
│              coming soon cards, waitlist capture                │
│                          │                                      │
│                          ▼                                      │
│  PHASE 31 ── Testing & Quality Assurance                        │
│              Full E2E test suite, accessibility audit,          │
│              performance audit, security review                 │
│                          │                                      │
│                          ▼                                      │
│  PHASE 32 ── Production Deployment                              │
│              Vercel production deploy, custom domain,           │
│              monitoring, error tracking, launch checklist       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2.2 Phase Dependency Map

```
Phases 1–3 are strictly sequential (each is a prerequisite for the next).
Phases 4–7 are sequential (auth → workspace → IAM → employees).
Phases 8–10 can begin after Phase 7 (vendor + product setup is independent of IAM).
Phases 11–20 are sequential (procurement lifecycle order is enforced by business logic).
Phases 21–23 (notifications, messaging, documents) can be developed in parallel
  with Phases 11–20, with integration points at PR/RFQ/PO stages.
Phases 24–27 require Phases 11–20 to have data to display.
Phase 28 (Admin) can begin after Phase 3 and runs in parallel with all other phases.
Phase 29 (Billing) requires Phase 5 (Company Workspace).
Phase 30 (AI Scaffolding) can begin after Phase 2 (UI Foundation).
Phases 31–32 require all previous phases complete.
```

---

# MILESTONE PLANNING

---

## 3.1 Milestone Groups

VendorFlow development is organized into six milestone groups, each representing a coherent slice of the platform that can be independently reviewed, tested, and demonstrated.

```
MILESTONE 1 — PLATFORM FOUNDATION
  Phases: 1, 2, 3
  Outcome: Running Next.js app with complete design system and connected
           Supabase backend. No business features yet — but every tool,
           token, component, and database table pattern is in place.
  Estimated Duration: 2 weeks
  Demo: Component playground showing all UI components.
        Connected Supabase with working RLS test.

MILESTONE 2 — AUTHENTICATION & WORKSPACE
  Phases: 4, 5, 6, 7
  Outcome: Users can register as companies, log in, set up their workspace,
           configure roles and permissions, and invite employees.
           The platform's identity and access layer is fully operational.
  Estimated Duration: 3 weeks
  Demo: Full registration → onboarding → employee invitation → login flow.
        RBAC: different roles see different navigation.

MILESTONE 3 — VENDOR & PRODUCT ECOSYSTEM
  Phases: 8, 9, 10
  Outcome: Vendors can register, complete profiles, upload documents, and
           publish product catalogs. Companies can discover vendors on the
           Marketplace and view vendor profiles with products.
  Estimated Duration: 2.5 weeks
  Demo: Vendor registration → profile → product upload → company discovers
        vendor on Marketplace → views vendor catalog.

MILESTONE 4 — PROCUREMENT LIFECYCLE
  Phases: 11, 12, 13, 14, 15, 16, 17, 18, 19, 20
  Outcome: The complete procurement cycle from Purchase Request to payment
           and review is fully operational. This is the core of VendorFlow.
  Estimated Duration: 6 weeks
  Demo: Full end-to-end flow — PR → approval → RFQ → quotation → comparison
        → PO → acceptance → tracking → GRN → invoice → payment → review.

MILESTONE 5 — OPERATIONS & INTELLIGENCE
  Phases: 21, 22, 23, 24, 25, 26, 27, 28, 29, 30
  Outcome: Notifications, messaging, documents, dashboards, analytics, audit
           logs, search, settings, platform administration, billing, and AI
           scaffolding are all complete. The platform is operationally mature.
  Estimated Duration: 5 weeks
  Demo: Live dashboard with real procurement data, notification flow,
        analytics charts, admin panel, subscription management.

MILESTONE 6 — PRODUCTION READINESS
  Phases: 31, 32
  Outcome: Full E2E test coverage, accessibility audit passed, performance
           budget met, security review complete, production deployment live.
  Estimated Duration: 2 weeks
  Demo: Production URL live, load testing complete, monitoring active.

TOTAL ESTIMATED DURATION: ~20 weeks (5 months)
```

---

## 3.2 Milestone Summary Table

```
Mileston
e   Phases      Weeks    Outcome
──────────────────────────────────────────────────────────────────────
M1          1–3         1–2      Platform foundation and design system
M2          4–7         3–5      Auth, workspace, IAM, employees
M3          8–10        6–8      Vendor ecosystem and product catalog
M4          11–20       9–14     Complete procurement lifecycle
M5          21–30       15–19    Operations, analytics, admin, AI scaffold
M6          31–32       20       Testing, QA, production deployment
```

---


---

# PHASE 1 — PROJECT FOUNDATION

---

## Overview

| Field | Value |
|---|---|
| Phase Number | 1 |
| Phase Name | Project Foundation |
| Milestone | M1 — Platform Foundation |
| PRD Reference | Technical Requirements (Section 19) |
| DESIGN Reference | F01 Folder Organization, F03 Naming Conventions, F07 Performance |
| Estimated Duration | 3–4 days |
| Prerequisite Phases | None — this is the first phase |

---

## Purpose

Phase 1 establishes the complete technical scaffold for the entire VendorFlow project. No feature code is written in this phase. The output is a running Next.js 15 application with correct TypeScript configuration, enforced code quality tooling, absolute import aliases, environment variable validation, CI pipeline, and the exact folder structure that all subsequent phases will populate.

Every developer who joins the project at any phase inherits a working, opinionated, configured codebase. Phases 2–32 build on this foundation without revisiting configuration decisions.

---

## Business Goal

A correctly configured foundation prevents the most expensive class of problems in a long project: retroactive refactoring of folder structure, inconsistent code style, uncaught type errors accumulating across hundreds of files, and security gaps introduced by misconfigured environment handling. The cost of getting this right in Phase 1 is 3 days. The cost of fixing it in Phase 15 is measured in weeks.

---

## Dependencies

- Node.js 20 LTS installed on development machines
- pnpm 9+ installed globally (`npm install -g pnpm`)
- Git configured with name and email
- GitHub repository created (private)
- Vercel account connected to GitHub repository
- Supabase account created (project creation happens in Phase 3)

---

## Deliverables

At the end of Phase 1, the following must exist and be committed to the `develop` branch:

1. Next.js 15 application with App Router, TypeScript strict mode
2. Complete folder structure matching DESIGN.md F01 (empty directories with `.gitkeep`)
3. Tailwind CSS installed (configured in Phase 2 — only installed here)
4. ESLint configured with enterprise ruleset
5. Prettier configured with Tailwind plugin
6. Husky pre-commit hooks enforcing lint, type-check, and format
7. lint-staged for partial-file checking
8. Path aliases configured (`@/` → `src/`)
9. Environment variable schema with Zod validation
10. `src/lib/utils.ts` with `cn()` utility
11. Vercel project linked, automatic preview deployments enabled
12. GitHub Actions CI workflow running on every PR
13. README.md updated with setup instructions

---

## Tasks

### Task 1.1 — Initialize Next.js Application

```bash
pnpm create next-app@latest vendorflow \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir \
  --import-alias "@/*" \
  --no-turbopack
```

After scaffolding, verify:
- `src/app/` directory exists with `layout.tsx` and `page.tsx`
- `tsconfig.json` has `"paths": { "@/*": ["./src/*"] }`
- `tailwind.config.ts` exists
- `next.config.ts` exists

---

### Task 1.2 — TypeScript Configuration

Replace the default `tsconfig.json` with the VendorFlow strict configuration:

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": false,
    "skipLibCheck": true,
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "exactOptionalPropertyTypes": true,
    "forceConsistentCasingInFileNames": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

---

### Task 1.3 — Package Installation

Install all dependencies in a single pass. Do not install packages ad-hoc during later phases.

```bash
# Core framework (already installed by create-next-app)
# next@15, react@19, react-dom@19, typescript, tailwindcss

# UI & Design System
pnpm add class-variance-authority clsx tailwind-merge
pnpm add lucide-react
pnpm add @radix-ui/react-dialog @radix-ui/react-dropdown-menu \
  @radix-ui/react-select @radix-ui/react-checkbox \
  @radix-ui/react-radio-group @radix-ui/react-switch \
  @radix-ui/react-tabs @radix-ui/react-accordion \
  @radix-ui/react-tooltip @radix-ui/react-popover \
  @radix-ui/react-scroll-area @radix-ui/react-separator \
  @radix-ui/react-label @radix-ui/react-avatar \
  @radix-ui/react-progress @radix-ui/react-slider \
  @radix-ui/react-collapsible @radix-ui/react-alert-dialog

# Animation
pnpm add framer-motion

# State Management
pnpm add zustand immer

# Data Fetching
pnpm add @tanstack/react-query @tanstack/react-table

# Forms & Validation
pnpm add react-hook-form @hookform/resolvers zod

# Supabase
pnpm add @supabase/supabase-js @supabase/ssr

# Charts
pnpm add recharts

# Date handling
pnpm add date-fns

# Utilities
pnpm add react-countup react-intersection-observer
pnpm add @tanstack/react-virtual
pnpm add sonner

# Dev Dependencies
pnpm add -D @types/node @types/react @types/react-dom
pnpm add -D eslint-config-next @typescript-eslint/eslint-plugin \
  @typescript-eslint/parser eslint-plugin-import \
  eslint-plugin-jsx-a11y eslint-plugin-react \
  eslint-plugin-react-hooks eslint-import-resolver-typescript
pnpm add -D prettier prettier-plugin-tailwindcss
pnpm add -D husky lint-staged
pnpm add -D @axe-core/react
pnpm add -D supabase
```

---

### Task 1.4 — ESLint Configuration

Create `.eslintrc.json`:

```json
{
  "extends": [
    "next/core-web-vitals",
    "next/typescript",
    "plugin:jsx-a11y/recommended",
    "plugin:import/recommended",
    "plugin:import/typescript"
  ],
  "plugins": ["jsx-a11y", "import"],
  "rules": {
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_" }],
    "@typescript-eslint/consistent-type-imports": ["error", { "prefer": "type-imports" }],
    "@typescript-eslint/no-non-null-assertion": "warn",
    "import/order": [
      "error",
      {
        "groups": ["builtin", "external", "internal", "parent", "sibling", "index"],
        "pathGroups": [{ "pattern": "@/**", "group": "internal" }],
        "newlines-between": "always",
        "alphabetize": { "order": "asc" }
      }
    ],
    "import/no-cycle": "error",
    "no-console": ["error", { "allow": ["warn", "error"] }],
    "react/self-closing-comp": "error",
    "jsx-a11y/anchor-is-valid": "error"
  },
  "settings": {
    "import/resolver": {
      "typescript": { "alwaysTryTypes": true, "project": "./tsconfig.json" }
    }
  }
}
```

---

### Task 1.5 — Prettier Configuration

Create `.prettierrc`:

```json
{
  "semi": false,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100,
  "plugins": ["prettier-plugin-tailwindcss"],
  "tailwindConfig": "./tailwind.config.ts"
}
```

Create `.prettierignore`:

```
.next
node_modules
pnpm-lock.yaml
*.sql
supabase/migrations/
public/
```

---

### Task 1.6 — Husky & lint-staged Setup

```bash
pnpm exec husky init
```

Edit `.husky/pre-commit`:

```sh
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"
pnpm lint-staged
```

Add to `package.json`:

```json
{
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix --max-warnings=0",
      "prettier --write"
    ],
    "*.{json,md,css}": [
      "prettier --write"
    ]
  }
}
```

---

### Task 1.7 — Package.json Scripts

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint --max-warnings=0",
    "lint:fix": "next lint --fix",
    "type-check": "tsc --noEmit",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest run --coverage",
    "db:generate-types": "supabase gen types typescript --local > src/types/database.ts",
    "db:reset": "supabase db reset",
    "db:push": "supabase db push",
    "supabase:start": "supabase start",
    "supabase:stop": "supabase stop",
    "analyze": "ANALYZE=true next build"
  }
}
```

---

### Task 1.8 — Complete Folder Structure

Create all directories from DESIGN.md F01. Empty directories use a `.gitkeep` file.

```bash
# Application routes
src/app/(auth)/login/
src/app/(auth)/register/company/
src/app/(auth)/register/vendor/
src/app/(auth)/verify-email/
src/app/(auth)/forgot-password/
src/app/(auth)/reset-password/
src/app/(auth)/accept-invite/

src/app/(dashboard)/layout.tsx         # App shell (stub)
src/app/(dashboard)/dashboard/
src/app/(dashboard)/procurement/purchase-requests/
src/app/(dashboard)/procurement/rfqs/
src/app/(dashboard)/procurement/quotations/
src/app/(dashboard)/procurement/comparison/
src/app/(dashboard)/procurement/purchase-orders/
src/app/(dashboard)/vendors/marketplace/
src/app/(dashboard)/vendors/connected/
src/app/(dashboard)/vendors/invitations/
src/app/(dashboard)/orders/tracking/
src/app/(dashboard)/orders/shipments/
src/app/(dashboard)/orders/grn/
src/app/(dashboard)/finance/invoices/
src/app/(dashboard)/finance/payments/
src/app/(dashboard)/analytics/
src/app/(dashboard)/people/employees/
src/app/(dashboard)/people/departments/
src/app/(dashboard)/people/roles/
src/app/(dashboard)/communication/messages/
src/app/(dashboard)/communication/notifications/
src/app/(dashboard)/documents/
src/app/(dashboard)/settings/

src/app/(vendor)/layout.tsx             # Vendor shell (stub)
src/app/(vendor)/dashboard/
src/app/(vendor)/rfqs/
src/app/(vendor)/orders/
src/app/(vendor)/catalog/products/
src/app/(vendor)/catalog/categories/
src/app/(vendor)/catalog/inventory/
src/app/(vendor)/finance/invoices/
src/app/(vendor)/finance/payments/
src/app/(vendor)/analytics/
src/app/(vendor)/settings/

src/app/(admin)/layout.tsx              # Admin shell (stub)
src/app/(admin)/dashboard/
src/app/(admin)/companies/
src/app/(admin)/vendors/
src/app/(admin)/subscriptions/
src/app/(admin)/users/
src/app/(admin)/system/

# Components
src/components/ui/
src/components/shared/data-table/
src/components/shared/status-badge/
src/components/shared/kpi-card/
src/components/shared/activity-feed/
src/components/shared/empty-state/
src/components/shared/skeleton/
src/components/shared/page-header/
src/components/charts/
src/components/ai/
src/components/layout/sidebar/
src/components/layout/top-navigation/
src/components/layout/workspace-switcher/
src/components/modules/procurement/
src/components/modules/vendors/
src/components/modules/orders/
src/components/modules/finance/
src/components/modules/analytics/
src/components/modules/settings/

# Application layer
src/hooks/
src/lib/supabase/
src/lib/
src/stores/
src/types/
src/styles/
```

---

### Task 1.9 — Core Utility Files

**`src/lib/utils.ts`**

```typescript
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(
  amount: number,
  currency = 'INR',
  locale = 'en-IN'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatDate(date: string | Date, format = 'MMM d, yyyy'): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(d)
}

export function formatRelativeTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })
  const diff = (d.getTime() - Date.now()) / 1000
  if (Math.abs(diff) < 60) return rtf.format(Math.round(diff), 'seconds')
  if (Math.abs(diff) < 3600) return rtf.format(Math.round(diff / 60), 'minutes')
  if (Math.abs(diff) < 86400) return rtf.format(Math.round(diff / 3600), 'hours')
  return rtf.format(Math.round(diff / 86400), 'days')
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-')
    .trim()
}

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return `${text.slice(0, maxLength)}…`
}
```

**`src/lib/env.ts`**

```typescript
import { z } from 'zod'

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url('NEXT_PUBLIC_SUPABASE_URL must be a valid URL'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, 'NEXT_PUBLIC_SUPABASE_ANON_KEY is required'),
  NEXT_PUBLIC_APP_URL: z.string().url('NEXT_PUBLIC_APP_URL must be a valid URL'),
  NEXT_PUBLIC_APP_ENV: z.enum(['development', 'staging', 'production']),
  NEXT_PUBLIC_RAZORPAY_KEY_ID: z.string().min(1, 'NEXT_PUBLIC_RAZORPAY_KEY_ID is required'),
})

export const env = envSchema.parse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  NEXT_PUBLIC_APP_ENV: process.env.NEXT_PUBLIC_APP_ENV,
  NEXT_PUBLIC_RAZORPAY_KEY_ID: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
})
```

**`.env.local` (template — never committed)**

```
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_ENV=development
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_
RAZORPAY_KEY_SECRET=
RESEND_API_KEY=
```

Create `.env.example` (committed — shows required keys without values):

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_APP_URL=
NEXT_PUBLIC_APP_ENV=development
NEXT_PUBLIC_RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RESEND_API_KEY=
```

---

### Task 1.10 — GitHub Actions CI Pipeline

Create `.github/workflows/ci.yml`:

```yaml
name: CI

on:
  pull_request:
    branches: [develop, staging, main]
  push:
    branches: [develop]

jobs:
  quality:
    name: Code Quality
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4
        with:
          version: 9

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Type check
        run: pnpm type-check

      - name: Lint
        run: pnpm lint

      - name: Format check
        run: pnpm format:check

  build:
    name: Build
    runs-on: ubuntu-latest
    needs: quality
    env:
      NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
      NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY }}
      NEXT_PUBLIC_APP_URL: https://staging.vendorflow.in
      NEXT_PUBLIC_APP_ENV: staging
      NEXT_PUBLIC_RAZORPAY_KEY_ID: ${{ secrets.NEXT_PUBLIC_RAZORPAY_KEY_ID }}
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4
        with:
          version: 9

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Build
        run: pnpm build
```

---

### Task 1.11 — Git Repository Setup

```bash
# Initialize and configure
git init
git remote add origin https://github.com/[org]/vendorflow.git

# Create .gitignore
cat > .gitignore << 'EOF'
# Dependencies
node_modules/
.pnpm-store/

# Next.js
.next/
out/

# Environment
.env
.env.local
.env.*.local

# Supabase
supabase/.temp/
supabase/functions/.env

# Build
dist/
build/

# Misc
.DS_Store
*.pem
.vercel
*.tsbuildinfo
next-env.d.ts
EOF

# Initial commit
git add .
git commit -m "chore(foundation): initialize Next.js 15 project with TypeScript and tooling"

# Push and set up branches
git push -u origin main
git checkout -b develop
git push -u origin develop
```

---

### Task 1.12 — Stub Root Layout

Replace `src/app/layout.tsx` with a minimal but correct root layout:

```tsx
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'

import '@/styles/globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    template: '%s — VendorFlow',
    default: 'VendorFlow — Enterprise Procurement Platform',
  },
  description: 'Enterprise procurement and vendor collaboration platform.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  )
}
```

Create `src/styles/globals.css` (Tailwind base only — tokens added in Phase 2):

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

---

## Folder Structure Output (End of Phase 1)

```
vendorflow/
├── .github/
│   └── workflows/
│       └── ci.yml
├── .husky/
│   └── pre-commit
├── src/
│   ├── app/
│   │   ├── (auth)/           [stub route groups]
│   │   ├── (dashboard)/      [stub route groups]
│   │   ├── (vendor)/         [stub route groups]
│   │   ├── (admin)/          [stub route groups]
│   │   ├── layout.tsx        [root layout — complete]
│   │   └── page.tsx          [landing stub]
│   ├── components/           [all subdirs with .gitkeep]
│   ├── hooks/                [empty]
│   ├── lib/
│   │   ├── utils.ts          [complete]
│   │   └── env.ts            [complete]
│   ├── stores/               [empty]
│   ├── styles/
│   │   └── globals.css       [Tailwind base only]
│   └── types/                [empty]
├── .env.example
├── .eslintrc.json
├── .gitignore
├── .prettierrc
├── next.config.ts
├── package.json
├── tailwind.config.ts        [default — extended in Phase 2]
└── tsconfig.json             [strict mode complete]
```

---

## Testing Checklist

```
✓ pnpm install completes without errors
✓ pnpm dev starts the development server on localhost:3000
✓ pnpm build completes without TypeScript errors
✓ pnpm type-check passes with zero errors
✓ pnpm lint passes with zero warnings
✓ pnpm format:check passes
✓ pre-commit hook fires on git commit and runs lint-staged
✓ GitHub Actions CI workflow appears in the repository Actions tab
✓ Vercel preview deployment URL is generated on PR creation
✓ .env.local created locally (not committed) — dev server loads without crash
✓ Import alias @/ resolves correctly in IDE and build
```

---

## Acceptance Criteria

```
AC-1.1  Next.js 15 app router application runs on localhost:3000
AC-1.2  TypeScript strict mode: tsc --noEmit exits with code 0
AC-1.3  ESLint: eslint . exits with code 0, zero warnings
AC-1.4  Prettier: prettier --check . exits with code 0
AC-1.5  All required packages installed with exact versions pinned
AC-1.6  Pre-commit hook blocks commits with lint or type errors
AC-1.7  Folder structure matches DESIGN.md F01 specification
AC-1.8  Path alias @/ resolves to src/ in both runtime and IDE
AC-1.9  Environment variable schema validates on startup; missing vars throw at build time
AC-1.10 GitHub Actions CI runs and passes on the initial commit
AC-1.11 Vercel project connected; preview deploys on PR branches
```

---

## Definition of Done

Phase 1 is complete when all Acceptance Criteria above are met AND:

- [ ] All TypeScript checks pass (zero errors)
- [ ] All ESLint checks pass (zero warnings)
- [ ] All Prettier checks pass
- [ ] Pre-commit hook tested: a bad commit is blocked
- [ ] CI pipeline runs green on GitHub
- [ ] Vercel preview deployment loads without error
- [ ] `.env.example` committed with all required keys documented
- [ ] No secrets in any committed file
- [ ] PR merged to `develop` with at least 1 reviewer approval
- [ ] `feature/01-project-foundation` branch merged and deleted

---

## Risk Factors

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Node.js version mismatch between developers | Medium | Medium | Add `.nvmrc` with `20` and document in README |
| pnpm lockfile conflicts on dependency changes | Low | Low | Always use `pnpm install --frozen-lockfile` in CI |
| Vercel environment variables missing in preview | Medium | Medium | Document required vars in README; use Vercel env var UI |
| TypeScript strict mode blocking progress | Low | Low | Strict mode is required from day one — no exceptions |

---

## Best Practices

- Commit the lockfile (`pnpm-lock.yaml`) always — exact reproducible installs
- Never run `pnpm install` without `--frozen-lockfile` in CI
- Keep `package.json` dependencies sorted alphabetically for cleaner diffs
- Use `exact` versions for critical packages (Supabase, Next.js) to prevent silent upgrades
- Add `engines` field to `package.json`: `"engines": { "node": ">=20", "pnpm": ">=9" }`
- Document every environment variable in `.env.example` with a comment explaining its purpose

---

## Estimated Completion

**3–4 working days** for a single developer familiar with the stack.

---


---

# PHASE 2 — UI FOUNDATION

---

## Overview

| Field | Value |
|---|---|
| Phase Number | 2 |
| Phase Name | UI Foundation |
| Milestone | M1 — Platform Foundation |
| PRD Reference | Technical Requirements (Section 19), UI/UX Requirements (Section 18) |
| DESIGN Reference | Section 1 (Component Library), Section 4 (Design Tokens), F01, F03, T15 |
| Estimated Duration | 4–5 days |
| Prerequisite Phases | Phase 1 — Project Foundation |

---

## Purpose

Phase 2 builds the complete visual and interaction foundation for VendorFlow. No module pages are written in this phase. The output is a fully operational design system — every token, every shared component, and the application shell layout — that all subsequent phases consume without modification.

The principle is simple: build the design system once, correctly, before any module code is written. Every color, spacing value, shadow, and radius is defined as a CSS custom property and mapped into Tailwind. Every shared component — DataTable, StatusBadge, KPICard, EmptyState, PageHeader, Skeleton loaders, ActivityFeed, FormSection — is complete, tested, and documented. The sidebar, top navigation, and workspace switcher are fully functional as layout containers.

When Phase 3 begins, the UI layer is frozen for structural additions and open only for iteration.

---

## Business Goal

The single most common cause of frontend rework in a project of VendorFlow's scope is building components module-by-module instead of centrally. When each module creates its own table, badge, card, and form section, the codebase ends up with fifteen slightly different DataTable implementations, inconsistent status color usage, and no path to a unified design. Phase 2 eliminates this entirely. The design system is an upfront investment of 4–5 days that saves weeks of refactoring across Phases 4–30.

---

## Dependencies

- Phase 1 complete (Next.js scaffold, TypeScript, ESLint, Prettier, path aliases)
- DESIGN.md Section 4 (Design Tokens) reviewed and understood before Task 2.1
- DESIGN.md Section 1 (Component Library) reviewed before Task 2.5
- DESIGN.md Section F01 folder structure in place (created in Phase 1)

---

## Deliverables

At the end of Phase 2, the following must exist and be committed to `develop`:

1. Complete CSS custom property token system in `src/styles/globals.css`
2. `tailwind.config.ts` extended with all VendorFlow tokens from DESIGN.md T15
3. shadcn/ui initialized with VendorFlow theme configuration
4. All Radix UI primitives wrapped as typed shadcn/ui components in `src/components/ui/`
5. `DataTable` component with sorting, filtering, pagination, and row selection
6. `StatusBadge` component with all procurement and vendor status variants
7. `KPICard` component with value, trend, sparkline, and loading skeleton variants
8. `EmptyState` component with icon, heading, body, and optional CTA variants
9. `PageHeader` component with title, breadcrumb, description, and action slot
10. `Skeleton` component system for all content types (text, card, table, chart)
11. `ActivityFeed` component for timeline-style event lists
12. `FormSection` component with label, input wrapper, helper text, and error display
13. `Sidebar` component: collapsible, grouped navigation, active state, badges
14. `TopNavigation` component: workspace name, global search trigger, notifications, user menu
15. `WorkspaceSwitcher` component: company/vendor context, avatar, dropdown
16. App shell layout (`src/app/(dashboard)/layout.tsx`) with sidebar + main area
17. Vendor shell layout (`src/app/(vendor)/layout.tsx`) wired to the same shell
18. `QueryProvider` and `ToastProvider` wrappers in `src/components/layout/providers.tsx`
19. Component playground page at `src/app/playground/page.tsx` demonstrating all components

---

## Tasks

### Task 2.1 — Design Token CSS Custom Properties

Extend `src/styles/globals.css` with the complete VendorFlow token system from DESIGN.md Section 4. Every color, spacing, radius, shadow, and motion value is defined here as a CSS custom property. Nothing is hardcoded anywhere else in the codebase.

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    /* ── Background ─────────────────────────────────────── */
    --bg-canvas:          #F8F9FB;
    --bg-surface:         #FFFFFF;
    --bg-surface-raised:  #FFFFFF;
    --bg-surface-overlay: #FFFFFF;
    --bg-subtle:          #F1F3F7;
    --bg-muted:           #E8EBF0;
    --bg-inverse:         #0F172A;

    /* ── Text ───────────────────────────────────────────── */
    --text-primary:       #0F172A;
    --text-secondary:     #475569;
    --text-tertiary:      #94A3B8;
    --text-disabled:      #CBD5E1;
    --text-inverse:       #FFFFFF;
    --text-link:          #2563EB;
    --text-link-hover:    #1D4ED8;

    /* ── Border ─────────────────────────────────────────── */
    --border-default:     #E2E8F0;
    --border-strong:      #CBD5E1;
    --border-focus:       #2563EB;
    --border-error:       #DC2626;

    /* ── Brand ──────────────────────────────────────────── */
    --brand-primary:      #2563EB;
    --brand-primary-hover:#1D4ED8;
    --brand-primary-subtle:#EFF6FF;
    --brand-secondary:    #0F172A;

    /* ── Status: Semantic ───────────────────────────────── */
    --color-success:      #16A34A;
    --color-success-bg:   #F0FDF4;
    --color-success-border:#BBF7D0;
    --color-warning:      #D97706;
    --color-warning-bg:   #FFFBEB;
    --color-warning-border:#FDE68A;
    --color-error:        #DC2626;
    --color-error-bg:     #FEF2F2;
    --color-error-border: #FECACA;
    --color-info:         #2563EB;
    --color-info-bg:      #EFF6FF;
    --color-info-border:  #BFDBFE;

    /* ── Status: Procurement ────────────────────────────── */
    --status-draft:       #64748B;
    --status-draft-bg:    #F8FAFC;
    --status-pending:     #D97706;
    --status-pending-bg:  #FFFBEB;
    --status-approved:    #16A34A;
    --status-approved-bg: #F0FDF4;
    --status-rejected:    #DC2626;
    --status-rejected-bg: #FEF2F2;
    --status-active:      #2563EB;
    --status-active-bg:   #EFF6FF;
    --status-completed:   #7C3AED;
    --status-completed-bg:#F5F3FF;
    --status-cancelled:   #64748B;
    --status-cancelled-bg:#F8FAFC;
    --status-overdue:     #EA580C;
    --status-overdue-bg:  #FFF7ED;

    /* ── Layout ─────────────────────────────────────────── */
    --sidebar-width-expanded:  240px;
    --sidebar-width-collapsed: 64px;
    --topnav-height:           60px;
    --content-max-width:       1280px;

    /* ── Radius ─────────────────────────────────────────── */
    --radius-sm:   4px;
    --radius-md:   8px;
    --radius-lg:   12px;
    --radius-xl:   16px;
    --radius-full: 9999px;

    /* ── Shadow ─────────────────────────────────────────── */
    --shadow-sm:  0 1px 2px 0 rgb(0 0 0 / 0.05);
    --shadow-md:  0 4px 6px -1px rgb(0 0 0 / 0.07), 0 2px 4px -2px rgb(0 0 0 / 0.05);
    --shadow-lg:  0 10px 15px -3px rgb(0 0 0 / 0.08), 0 4px 6px -4px rgb(0 0 0 / 0.05);
    --shadow-xl:  0 20px 25px -5px rgb(0 0 0 / 0.08), 0 8px 10px -6px rgb(0 0 0 / 0.05);

    /* ── Motion ─────────────────────────────────────────── */
    --duration-fast:    100ms;
    --duration-base:    200ms;
    --duration-slow:    300ms;
    --duration-slower:  500ms;
    --ease-default:     cubic-bezier(0.4, 0, 0.2, 1);
    --ease-in:          cubic-bezier(0.4, 0, 1, 1);
    --ease-out:         cubic-bezier(0, 0, 0.2, 1);
    --ease-spring:      cubic-bezier(0.34, 1.56, 0.64, 1);

    /* ── Typography ─────────────────────────────────────── */
    --font-sans: 'Inter', system-ui, sans-serif;
    --font-mono: 'JetBrains Mono', 'Fira Code', monospace;
  }

  .dark {
    --bg-canvas:          #0A0F1E;
    --bg-surface:         #111827;
    --bg-surface-raised:  #1A2234;
    --bg-subtle:          #1E293B;
    --bg-muted:           #334155;
    --bg-inverse:         #F8F9FB;
    --text-primary:       #F1F5F9;
    --text-secondary:     #94A3B8;
    --text-tertiary:      #64748B;
    --text-disabled:      #475569;
    --text-inverse:       #0F172A;
    --border-default:     #1E293B;
    --border-strong:      #334155;
  }
}
```

---

### Task 2.2 — Tailwind Configuration

Replace `tailwind.config.ts` with the full VendorFlow configuration that maps every CSS custom property into Tailwind utility classes per DESIGN.md T15:

```typescript
import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          canvas:  'var(--bg-canvas)',
          surface: 'var(--bg-surface)',
          raised:  'var(--bg-surface-raised)',
          subtle:  'var(--bg-subtle)',
          muted:   'var(--bg-muted)',
          inverse: 'var(--bg-inverse)',
        },
        text: {
          primary:   'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          tertiary:  'var(--text-tertiary)',
          disabled:  'var(--text-disabled)',
          inverse:   'var(--text-inverse)',
          link:      'var(--text-link)',
        },
        border: {
          default: 'var(--border-default)',
          strong:  'var(--border-strong)',
          focus:   'var(--border-focus)',
          error:   'var(--border-error)',
        },
        brand: {
          primary:       'var(--brand-primary)',
          'primary-hover':'var(--brand-primary-hover)',
          'primary-subtle':'var(--brand-primary-subtle)',
          secondary:     'var(--brand-secondary)',
        },
        status: {
          draft:         'var(--status-draft)',
          'draft-bg':    'var(--status-draft-bg)',
          pending:       'var(--status-pending)',
          'pending-bg':  'var(--status-pending-bg)',
          approved:      'var(--status-approved)',
          'approved-bg': 'var(--status-approved-bg)',
          rejected:      'var(--status-rejected)',
          'rejected-bg': 'var(--status-rejected-bg)',
          active:        'var(--status-active)',
          'active-bg':   'var(--status-active-bg)',
          completed:     'var(--status-completed)',
          'completed-bg':'var(--status-completed-bg)',
          cancelled:     'var(--status-cancelled)',
          overdue:       'var(--status-overdue)',
          'overdue-bg':  'var(--status-overdue-bg)',
        },
        success: { DEFAULT: 'var(--color-success)', bg: 'var(--color-success-bg)', border: 'var(--color-success-border)' },
        warning: { DEFAULT: 'var(--color-warning)', bg: 'var(--color-warning-bg)', border: 'var(--color-warning-border)' },
        error:   { DEFAULT: 'var(--color-error)',   bg: 'var(--color-error-bg)',   border: 'var(--color-error-border)'   },
        info:    { DEFAULT: 'var(--color-info)',     bg: 'var(--color-info-bg)',    border: 'var(--color-info-border)'    },
      },
      fontFamily: {
        sans: ['var(--font-sans)'],
        mono: ['var(--font-mono)'],
      },
      borderRadius: {
        sm:   'var(--radius-sm)',
        md:   'var(--radius-md)',
        lg:   'var(--radius-lg)',
        xl:   'var(--radius-xl)',
        full: 'var(--radius-full)',
      },
      boxShadow: {
        sm: 'var(--shadow-sm)',
        md: 'var(--shadow-md)',
        lg: 'var(--shadow-lg)',
        xl: 'var(--shadow-xl)',
      },
      transitionDuration: {
        fast:   'var(--duration-fast)',
        base:   'var(--duration-base)',
        slow:   'var(--duration-slow)',
        slower: 'var(--duration-slower)',
      },
      width:  { sidebar: 'var(--sidebar-width-expanded)', 'sidebar-collapsed': 'var(--sidebar-width-collapsed)' },
      height: { topnav: 'var(--topnav-height)' },
      maxWidth: { content: 'var(--content-max-width)' },
    },
  },
  plugins: [],
}

export default config
```

---

### Task 2.3 — shadcn/ui Initialization

Initialize shadcn/ui with the VendorFlow theme. Run the init command and configure it to match VendorFlow tokens:

```bash
pnpm dlx shadcn@latest init
```

When prompted, select:
- Style: **Default**
- Base color: **Slate**
- CSS variables: **Yes**

After init, update `components.json` to set the correct paths:

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "default",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.ts",
    "css": "src/styles/globals.css",
    "baseColor": "slate",
    "cssVariables": true,
    "prefix": ""
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  }
}
```

Add the following shadcn/ui components. Each installs into `src/components/ui/`:

```bash
pnpm dlx shadcn@latest add button input label textarea select \
  checkbox radio-group switch badge avatar \
  dialog alert-dialog sheet drawer \
  dropdown-menu context-menu menubar \
  tooltip popover hover-card \
  tabs accordion collapsible \
  card separator scroll-area \
  progress slider table \
  form toast sonner \
  command breadcrumb pagination \
  skeleton alert
```

After installation, audit every generated file in `src/components/ui/` and confirm:
- Color references use `var(--...)` CSS variables, not raw Tailwind color strings
- No hardcoded hex values exist in any component file
- Component exports are named exports (default exports generated by shadcn are acceptable for the ui/ layer only)

---

### Task 2.4 — Typography Scale & Font Setup

Update `src/app/layout.tsx` to load Inter with all required weights and expose the CSS variable:

```typescript
import { Inter } from 'next/font/google'

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sans',
  display: 'swap',
})
```

Add the following typography utility classes to `src/styles/globals.css` under `@layer components`. These classes are used by all text elements throughout the application:

```css
@layer components {
  /* Display */
  .text-display-lg  { @apply text-4xl font-bold   leading-tight   tracking-tight; }
  .text-display-md  { @apply text-3xl font-bold   leading-tight   tracking-tight; }
  .text-display-sm  { @apply text-2xl font-semibold leading-snug  tracking-tight; }

  /* Heading */
  .text-heading-lg  { @apply text-xl  font-semibold leading-snug; }
  .text-heading-md  { @apply text-lg  font-semibold leading-snug; }
  .text-heading-sm  { @apply text-base font-semibold leading-normal; }

  /* Body */
  .text-body-lg     { @apply text-base font-normal leading-relaxed; }
  .text-body-md     { @apply text-sm   font-normal leading-relaxed; }
  .text-body-sm     { @apply text-xs   font-normal leading-relaxed; }

  /* Label */
  .text-label-lg    { @apply text-sm   font-medium leading-none; }
  .text-label-md    { @apply text-xs   font-medium leading-none; }
  .text-label-sm    { @apply text-[11px] font-medium leading-none tracking-wide uppercase; }

  /* Code */
  .text-code        { @apply font-mono text-sm leading-relaxed; }
}
```

---

### Task 2.5 — Button Variants

The shadcn/ui `Button` component is extended with VendorFlow-specific variants. Update `src/components/ui/button.tsx` to add the `destructive-outline` and `brand` variants and confirm all size tokens align with DESIGN.md:

```typescript
import { cva, type VariantProps } from 'class-variance-authority'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default:           'bg-brand-primary text-text-inverse hover:bg-brand-primary-hover',
        destructive:       'bg-error text-text-inverse hover:bg-red-700',
        'destructive-outline':'border border-error text-error bg-transparent hover:bg-error-bg',
        outline:           'border border-border-default bg-bg-surface hover:bg-bg-subtle text-text-primary',
        secondary:         'bg-bg-subtle text-text-primary hover:bg-bg-muted',
        ghost:             'text-text-primary hover:bg-bg-subtle',
        link:              'text-text-link underline-offset-4 hover:underline',
        brand:             'bg-brand-secondary text-text-inverse hover:opacity-90',
      },
      size: {
        sm:      'h-8  px-3 text-xs rounded-md',
        default: 'h-9  px-4 text-sm rounded-md',
        lg:      'h-10 px-6 text-sm rounded-md',
        xl:      'h-11 px-8 text-base rounded-md',
        icon:    'h-9  w-9',
        'icon-sm':'h-8 w-8',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)
```

---

### Task 2.6 — Input, Select, and Textarea Variants

Ensure all form primitive components in `src/components/ui/` have VendorFlow-consistent focus rings, error states, and disabled states. The following pattern is applied to `input.tsx`, `textarea.tsx`, and the underlying select trigger:

```typescript
// Pattern for all form inputs — applied uniformly
const inputClass = cn(
  'flex w-full rounded-md border border-border-default bg-bg-surface px-3 py-2',
  'text-sm text-text-primary placeholder:text-text-tertiary',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:border-border-focus',
  'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-bg-subtle',
  'aria-[invalid=true]:border-border-error aria-[invalid=true]:focus-visible:ring-error',
  'transition-colors duration-base'
)
```

Create `src/types/ui.ts` with shared UI type definitions used across all components:

```typescript
export type Size = 'sm' | 'md' | 'lg' | 'xl'
export type Variant = 'default' | 'outline' | 'ghost' | 'destructive'
export type ColorIntent = 'default' | 'success' | 'warning' | 'error' | 'info'
export type Density = 'compact' | 'default' | 'comfortable'

export interface BaseComponentProps {
  className?: string
  'data-testid'?: string
}
```

---

### Task 2.7 — DataTable Component

Build the `DataTable` component at `src/components/shared/data-table/`. This is the most-used component in the application — every list view (purchase requests, vendors, orders, invoices, employees) renders through it.

**Files:**
```
src/components/shared/data-table/
  data-table.tsx
  data-table-toolbar.tsx
  data-table-pagination.tsx
  data-table-column-header.tsx
  data-table-row-actions.tsx
  index.ts
```

**`data-table.tsx` — specification:**

```typescript
import type { ColumnDef, SortingState, ColumnFiltersState,
  VisibilityState, RowSelectionState } from '@tanstack/react-table'

interface DataTableProps<TData, TValue> {
  columns:     ColumnDef<TData, TValue>[]
  data:        TData[]
  isLoading?:  boolean          // renders skeleton rows
  totalCount?: number           // for server-side pagination
  pageSize?:   number           // default: 20
  onRowClick?: (row: TData) => void
  toolbar?:    React.ReactNode  // slot for search/filter controls
  emptyState?: React.ReactNode  // slot for EmptyState component
  'data-testid'?: string
}
```

**Behavior requirements:**
- Client-side sorting on all columns by default; server-side sortable via `onSortingChange` callback
- Column visibility toggle via a dropdown in the toolbar area
- Row selection via checkbox column (optional — enabled by passing `enableRowSelection`)
- Sticky header on scroll
- Alternating row background: `bg-bg-surface` / `bg-bg-subtle`
- Row hover: `hover:bg-brand-primary-subtle` with `cursor-pointer` when `onRowClick` is provided
- Loading state: renders 8 skeleton rows matching the column structure
- Empty state: renders the `emptyState` slot or a default `EmptyState` with "No results found"
- Pagination: always rendered below the table; shows current range and total count
- All interactive elements keyboard accessible; table uses `role="grid"` semantics

**`data-table-pagination.tsx` — specification:**
```typescript
interface DataTablePaginationProps {
  pageIndex:    number
  pageCount:    number
  pageSize:     number
  totalCount:   number
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
  pageSizeOptions?: number[]  // default: [10, 20, 50, 100]
}
```

**`index.ts`:**
```typescript
export { DataTable } from './data-table'
export { DataTableToolbar } from './data-table-toolbar'
export { DataTablePagination } from './data-table-pagination'
export { DataTableColumnHeader } from './data-table-column-header'
export type { DataTableProps } from './data-table'
```

---

### Task 2.8 — StatusBadge Component

Build `src/components/shared/status-badge/` to render all procurement, vendor, and order status values with consistent color coding derived from design tokens.

**`status-badge.tsx` — full specification:**

```typescript
type ProcurementStatus =
  | 'draft' | 'pending' | 'pending_approval' | 'approved' | 'rejected'
  | 'active' | 'completed' | 'cancelled' | 'overdue' | 'expired'

type VendorStatus =
  | 'unverified' | 'under_review' | 'verified' | 'suspended' | 'blacklisted'

type OrderStatus =
  | 'pending_acceptance' | 'accepted' | 'rejected' | 'processing'
  | 'shipped' | 'delivered' | 'returned' | 'cancelled'

type PaymentStatus =
  | 'unpaid' | 'partially_paid' | 'paid' | 'overdue' | 'refunded'

export type StatusValue =
  | ProcurementStatus
  | VendorStatus
  | OrderStatus
  | PaymentStatus

interface StatusBadgeProps {
  status:     StatusValue
  size?:      'sm' | 'md'       // default: 'md'
  showDot?:   boolean           // default: false
  className?: string
}
```

**Color mapping** (uses CSS token variables — no hardcoded values):

| Status group | Token pair |
|---|---|
| `draft`, `cancelled` | `status-draft` / `status-draft-bg` |
| `pending`, `pending_approval`, `pending_acceptance`, `under_review` | `status-pending` / `status-pending-bg` |
| `approved`, `verified`, `completed`, `delivered`, `paid` | `status-approved` / `status-approved-bg` |
| `rejected`, `suspended`, `blacklisted`, `returned` | `status-rejected` / `status-rejected-bg` |
| `active`, `accepted`, `processing`, `shipped` | `status-active` / `status-active-bg` |
| `overdue`, `expired` | `status-overdue` / `status-overdue-bg` |
| `partially_paid`, `unverified` | `status-pending` / `status-pending-bg` |

**Display label mapping:** Each status value maps to a human-readable label string (e.g., `pending_approval` → "Pending Approval", `under_review` → "Under Review"). The mapping is defined as a `const` record in the component file and is the single source of truth for status display text.

---

### Task 2.9 — KPICard Component

Build `src/components/shared/kpi-card/` for the dashboard metric display cards used in both the Company Dashboard and Vendor Dashboard.

**`kpi-card.tsx` — specification:**

```typescript
interface KPICardProps {
  title:        string
  value:        number | string
  prefix?:      string           // e.g. '₹' for currency
  suffix?:      string           // e.g. '%' for percentages
  trend?: {
    value:     number            // percentage change
    direction: 'up' | 'down' | 'neutral'
    label?:    string            // e.g. 'vs last month'
    positive?: 'up' | 'down'    // which direction is good (default: 'up')
  }
  icon?:        React.ReactNode
  iconColor?:   string           // Tailwind bg class, e.g. 'bg-brand-primary-subtle'
  isLoading?:   boolean
  onClick?:     () => void
  className?:   string
}
```

**Behavior requirements:**
- Card container: `bg-bg-surface rounded-lg border border-border-default shadow-sm p-6`
- Value uses `react-countup` for animated number entry on mount
- Trend arrow: green (↑) or red (↓) based on `direction` and `positive` fields
  - If `positive: 'up'` and `direction: 'up'` → green; if `direction: 'down'` → red
  - If `positive: 'down'` (e.g., average processing time) → inverted color logic
- Loading state: full card skeleton with matching dimensions
- `onClick` provided: card is a focusable, keyboard-activatable element with hover state
- Icon rendered in a 40×40 rounded container with `iconColor` background

**`kpi-card-skeleton.tsx`:**
A dedicated skeleton variant that renders the same card dimensions with `Skeleton` placeholders for title, value, and trend. Used by DataTable loading and dashboard loading states.

**`index.ts`:**
```typescript
export { KPICard } from './kpi-card'
export { KPICardSkeleton } from './kpi-card-skeleton'
export type { KPICardProps } from './kpi-card'
```

---

### Task 2.10 — EmptyState Component

Build `src/components/shared/empty-state/` for all zero-data states across every list view, search result, and filtered table in the application.

**`empty-state.tsx` — specification:**

```typescript
interface EmptyStateProps {
  icon?:        React.ReactNode   // Lucide icon or custom SVG
  title:        string
  description?: string
  action?: {
    label:    string
    onClick?: () => void
    href?:    string
  }
  secondaryAction?: {
    label:    string
    onClick?: () => void
    href?:    string
  }
  size?:        'sm' | 'md' | 'lg'  // default: 'md'
  className?:   string
}
```

**Behavior requirements:**
- Container: centered flex column, `py-12` padding by default (`py-8` for `sm`, `py-16` for `lg`)
- Icon: rendered in a 56×56 (md) rounded container with `bg-bg-subtle`, icon in `text-text-tertiary`
- Title: `text-heading-sm text-text-primary`
- Description: `text-body-md text-text-secondary` with `max-w-sm` centered
- Primary action: renders as `Button` (default variant)
- Secondary action: renders as `Button` (ghost variant)
- When no icon is provided, the icon slot is omitted entirely (no placeholder space)

**Standard empty state presets** — exported as named constants for reuse across modules:

```typescript
export const EMPTY_STATES = {
  purchaseRequests: {
    icon: <FileText />,
    title: 'No purchase requests yet',
    description: 'Create your first purchase request to start the procurement process.',
    action: { label: 'Create Purchase Request' },
  },
  vendors: {
    icon: <Building2 />,
    title: 'No vendors found',
    description: 'Add vendors to your network or adjust your search filters.',
    action: { label: 'Add Vendor' },
  },
  searchResults: {
    icon: <SearchX />,
    title: 'No results found',
    description: 'Try adjusting your search terms or clearing your filters.',
  },
  notifications: {
    icon: <Bell />,
    title: 'You\'re all caught up',
    description: 'No new notifications at this time.',
  },
} as const
```

---

### Task 2.11 — PageHeader Component

Build `src/components/shared/page-header/` for the consistent top section of every module page. Every page in the application uses `PageHeader` — never a custom title layout.

**`page-header.tsx` — specification:**

```typescript
interface BreadcrumbItem {
  label: string
  href?: string
}

interface PageHeaderProps {
  title:        string
  description?: string
  breadcrumbs?: BreadcrumbItem[]
  actions?:     React.ReactNode    // slot for buttons (Create, Export, etc.)
  tabs?:        React.ReactNode    // slot for page-level tab navigation
  badge?:       React.ReactNode    // slot for a StatusBadge next to the title
  className?:   string
}
```

**Behavior requirements:**
- Container: `border-b border-border-default bg-bg-surface px-6 py-4`
- Breadcrumbs rendered above the title using shadcn/ui `Breadcrumb` with separator chevrons
- Title: `text-heading-lg text-text-primary` with optional `badge` rendered inline after the title
- Description: `text-body-md text-text-secondary mt-1`
- Actions: right-aligned flex row; wraps on mobile below the title
- Tabs: rendered below the title/description row, flush with the bottom border
- On mobile (`< md` breakpoint): actions stack below the title

---

### Task 2.12 — Skeleton System and ActivityFeed Component

**Skeleton system** — extend `src/components/ui/skeleton.tsx` with a set of named skeleton compositions used across the application:

```typescript
// src/components/shared/skeleton/index.ts
export { SkeletonText }      // n lines of text, variable widths
export { SkeletonCard }      // full card placeholder (border + padding + content rows)
export { SkeletonTableRow }  // single table row with n cell placeholders
export { SkeletonTable }     // n rows of SkeletonTableRow
export { SkeletonKPICard }   // matches KPICard dimensions exactly
export { SkeletonAvatar }    // circular avatar placeholder
export { SkeletonBadge }     // inline badge-width placeholder
```

Each skeleton composition accepts a `className` prop and uses the base `Skeleton` from shadcn/ui (`animate-pulse bg-bg-muted rounded`). No skeleton renders its own animation — it inherits from the base.

**ActivityFeed component** — build `src/components/shared/activity-feed/`:

```typescript
interface ActivityItem {
  id:        string
  actor: {
    name:     string
    avatarUrl?: string
    role?:    string
  }
  action:    string              // e.g. 'approved', 'submitted', 'commented on'
  subject:   string              // e.g. 'PR-2024-001'
  subjectHref?: string
  timestamp: string              // ISO 8601
  metadata?: Record<string, string>  // optional key-value pairs shown below
  icon?:     React.ReactNode     // overrides default action icon
}

interface ActivityFeedProps {
  items:       ActivityItem[]
  isLoading?:  boolean           // renders 5 skeleton items
  maxItems?:   number            // truncates with "Show X more" link
  showDate?:   boolean           // groups items by date (default: false)
  className?:  string
}
```

**Behavior requirements:**
- Each item: left-aligned avatar → right content (actor name, action, subject, timestamp)
- Connecting vertical line between items using a `before:` pseudo-element on the timeline column
- `subjectHref` renders subject as a link with `text-text-link hover:underline`
- Timestamp: `formatRelativeTime()` from `src/lib/utils.ts`; full date shown in tooltip
- Loading: 5 skeleton items with avatar circle + two text lines each

---

### Task 2.13 — Sidebar Component

Build `src/components/layout/sidebar/` — the primary navigation container for the company dashboard workspace. The sidebar is collapsible, persists its state in Zustand, and adapts its behavior at tablet and mobile breakpoints.

**Files:**
```
src/components/layout/sidebar/
  sidebar.tsx
  sidebar-nav-item.tsx
  sidebar-nav-group.tsx
  sidebar-logo.tsx
  index.ts
```

**`sidebar.tsx` — specification:**

```typescript
interface SidebarProps {
  navigationGroups: NavGroup[]
  className?: string
}

interface NavGroup {
  label?:  string          // section heading (omitted for top group)
  items:   NavItem[]
}

interface NavItem {
  label:     string
  href:      string
  icon:      React.ReactNode
  badge?:    number        // notification count badge
  children?: NavItem[]     // for nested navigation (one level only)
}
```

**Behavior requirements:**
- Width: `var(--sidebar-width-expanded)` when open, `var(--sidebar-width-collapsed)` when collapsed
- Collapse toggle button: positioned at the bottom of the sidebar, above the user section
- Collapsed state: shows only icons; tooltip (shadcn/ui `Tooltip`) on hover shows the label
- Active item detection: uses `usePathname()` from Next.js; matches current route
- Active item style: `bg-brand-primary-subtle text-brand-primary font-medium rounded-md`
- Inactive item style: `text-text-secondary hover:bg-bg-subtle hover:text-text-primary rounded-md`
- Badge: red pill with count, hidden when sidebar is collapsed
- Nav groups with a `label`: label rendered as `text-label-sm text-text-tertiary uppercase` above the group
- Mobile behavior (`< lg`): sidebar renders as a `Sheet` (slide-over drawer) triggered by a hamburger button in `TopNavigation`
- Collapse state persisted in `sidebar-store.ts` (Zustand)
- Sidebar scroll: `overflow-y-auto` on the nav section with custom scrollbar styles
- Transition: `transition-[width] duration-slow ease-default`

**`src/stores/sidebar-store.ts`:**
```typescript
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface SidebarStore {
  isCollapsed: boolean
  toggle:      () => void
  collapse:    () => void
  expand:      () => void
}

export const useSidebarStore = create<SidebarStore>()(
  persist(
    (set) => ({
      isCollapsed: false,
      toggle:  () => set((s) => ({ isCollapsed: !s.isCollapsed })),
      collapse:() => set({ isCollapsed: true }),
      expand:  () => set({ isCollapsed: false }),
    }),
    { name: 'sidebar-state' }
  )
)
```

---

### Task 2.14 — TopNavigation Component

Build `src/components/layout/top-navigation/` — the fixed top bar present in every dashboard view.

**Files:**
```
src/components/layout/top-navigation/
  top-navigation.tsx
  notification-bell.tsx
  user-menu.tsx
  index.ts
```

**`top-navigation.tsx` — specification:**

```typescript
interface TopNavigationProps {
  workspaceName:  string
  workspaceType:  'company' | 'vendor' | 'platform'
  userFullName:   string
  userAvatarUrl?: string
  userEmail:      string
  notificationCount?: number
  onMobileMenuToggle: () => void
}
```

**Behavior requirements:**
- Height: `var(--topnav-height)` (60px); `sticky top-0 z-40`
- Background: `bg-bg-surface border-b border-border-default`
- Left section: mobile hamburger button (`lg:hidden`) + workspace name/logo
- Center section: global search trigger button (opens command palette — wired in Phase 26; placeholder here)
- Right section: notification bell → user menu (in that order)
- Search trigger: `⌘K` keyboard shortcut label visible on desktop; `text-text-tertiary hover:text-text-primary`
- `notification-bell.tsx`: Bell icon with a red badge showing `notificationCount`; badge hidden when count is 0; clicking opens a dropdown with "No notifications" placeholder (real content wired in Phase 21)
- `user-menu.tsx`: Avatar + name → dropdown with: Profile, Settings, separator, Sign Out. Uses shadcn/ui `DropdownMenu`. Sign Out calls Supabase `signOut()` (wired in Phase 4; placeholder here)

---

### Task 2.15 — WorkspaceSwitcher Component

Build `src/components/layout/workspace-switcher/` — the control that allows users who belong to both a company workspace and a vendor workspace to switch between contexts.

**`workspace-switcher.tsx` — specification:**

```typescript
interface Workspace {
  id:        string
  name:      string
  type:      'company' | 'vendor' | 'platform'
  logoUrl?:  string
  plan?:     string   // e.g. 'Professional', 'Enterprise'
}

interface WorkspaceSwitcherProps {
  currentWorkspace: Workspace
  availableWorkspaces: Workspace[]
  onSwitch: (workspace: Workspace) => void
}
```

**Behavior requirements:**
- Rendered inside the sidebar, above the navigation groups
- Current workspace: avatar (company logo or initials fallback) + name + type label
- Clicking opens a `Popover` listing all available workspaces
- Each workspace option: avatar + name + plan badge
- Active workspace marked with a checkmark icon
- "Create new workspace" option at the bottom of the list (navigates to registration — wired in Phase 5)
- Logo fallback: two-letter initials in a colored container; color derived deterministically from workspace name
- Transition on workspace switch: `router.push()` to the correct workspace root (`/dashboard` for company, `/vendor/dashboard` for vendor)
- In Phase 2, this component renders with stub data; real auth context is wired in Phase 4

---

### Task 2.16 — Dashboard Shell Layouts

Create the app shell layout files that wrap all dashboard routes. These layouts compose `Sidebar`, `TopNavigation`, and the main content area into the final page structure.

**`src/app/(dashboard)/layout.tsx`:**

```typescript
import { Sidebar } from '@/components/layout/sidebar'
import { TopNavigation } from '@/components/layout/top-navigation'
import { COMPANY_NAV } from '@/lib/navigation'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen overflow-hidden bg-bg-canvas">
      <Sidebar navigationGroups={COMPANY_NAV} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopNavigation
          workspaceName="Acme Corp"          {/* stubbed — replaced in Phase 4 */}
          workspaceType="company"
          userFullName="Demo User"
          userEmail="demo@acme.com"
          notificationCount={0}
          onMobileMenuToggle={() => {}}
        />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="mx-auto max-w-content">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
```

**`src/app/(vendor)/layout.tsx`:** Same structure; `VENDOR_NAV` navigation config; `workspaceType="vendor"`.

**`src/app/(admin)/layout.tsx`:** Same structure; `ADMIN_NAV` navigation config; `workspaceType="platform"`.

**`src/lib/navigation.ts`** — defines the full navigation tree for each workspace type. This file is the single source of truth for sidebar navigation across the entire application:

```typescript
import {
  LayoutDashboard, ShoppingCart, FileText, Users, Building2,
  Package, BarChart3, MessageSquare, Bell, Settings, Shield,
  CreditCard, TrendingUp, FileSearch, Truck, Receipt,
} from 'lucide-react'
import type { NavGroup } from '@/components/layout/sidebar'

export const COMPANY_NAV: NavGroup[] = [
  {
    items: [
      { label: 'Dashboard',   href: '/dashboard',   icon: <LayoutDashboard size={18} /> },
    ],
  },
  {
    label: 'Procurement',
    items: [
      { label: 'Purchase Requests', href: '/procurement/purchase-requests', icon: <FileText size={18} /> },
      { label: 'RFQs',              href: '/procurement/rfqs',              icon: <FileSearch size={18} /> },
      { label: 'Quotations',        href: '/procurement/quotations',        icon: <Receipt size={18} /> },
      { label: 'Purchase Orders',   href: '/procurement/purchase-orders',   icon: <ShoppingCart size={18} /> },
    ],
  },
  {
    label: 'Vendors',
    items: [
      { label: 'Marketplace',   href: '/vendors/marketplace',  icon: <Building2 size={18} /> },
      { label: 'My Vendors',    href: '/vendors/connected',    icon: <Users size={18} /> },
    ],
  },
  {
    label: 'Operations',
    items: [
      { label: 'Order Tracking', href: '/orders/tracking',  icon: <Truck size={18} /> },
      { label: 'Invoices',       href: '/finance/invoices', icon: <Receipt size={18} /> },
      { label: 'Payments',       href: '/finance/payments', icon: <CreditCard size={18} /> },
    ],
  },
  {
    label: 'People',
    items: [
      { label: 'Employees',   href: '/people/employees',   icon: <Users size={18} /> },
      { label: 'Departments', href: '/people/departments', icon: <Building2 size={18} /> },
      { label: 'Roles',       href: '/people/roles',       icon: <Shield size={18} /> },
    ],
  },
  {
    label: 'Insights',
    items: [
      { label: 'Analytics',  href: '/analytics',  icon: <BarChart3 size={18} /> },
      { label: 'Documents',  href: '/documents',  icon: <FileText size={18} /> },
      { label: 'Messages',   href: '/communication/messages', icon: <MessageSquare size={18} /> },
    ],
  },
  {
    items: [
      { label: 'Settings', href: '/settings', icon: <Settings size={18} /> },
    ],
  },
]

export const VENDOR_NAV: NavGroup[] = [
  {
    items: [
      { label: 'Dashboard', href: '/vendor/dashboard', icon: <LayoutDashboard size={18} /> },
    ],
  },
  {
    label: 'Business',
    items: [
      { label: 'RFQs',    href: '/vendor/rfqs',    icon: <FileSearch size={18} /> },
      { label: 'Orders',  href: '/vendor/orders',  icon: <Truck size={18} /> },
      { label: 'Invoices',href: '/vendor/finance/invoices', icon: <Receipt size={18} /> },
      { label: 'Payments',href: '/vendor/finance/payments', icon: <CreditCard size={18} /> },
    ],
  },
  {
    label: 'Catalog',
    items: [
      { label: 'Products',   href: '/vendor/catalog/products',   icon: <Package size={18} /> },
      { label: 'Categories', href: '/vendor/catalog/categories', icon: <FileText size={18} /> },
      { label: 'Inventory',  href: '/vendor/catalog/inventory',  icon: <TrendingUp size={18} /> },
    ],
  },
  {
    items: [
      { label: 'Analytics', href: '/vendor/analytics', icon: <BarChart3 size={18} /> },
      { label: 'Settings',  href: '/vendor/settings',  icon: <Settings size={18} /> },
    ],
  },
]
```

---

### Task 2.17 — Providers and Toast Setup

Create `src/components/layout/providers.tsx` — the client-side provider tree that wraps the entire application. This is registered in `src/app/layout.tsx` as a client boundary so the root layout remains a Server Component.

```typescript
'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'
import { Toaster } from '@/components/ui/sonner'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime:          60 * 1000,      // 1 minute
            gcTime:             5 * 60 * 1000,  // 5 minutes
            retry:              1,
            refetchOnWindowFocus: false,
          },
          mutations: {
            onError: (error) => {
              console.error('Mutation error:', error)
            },
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster
        position="bottom-right"
        toastOptions={{
          classNames: {
            toast:       'bg-bg-surface border-border-default text-text-primary shadow-lg',
            title:       'text-label-lg text-text-primary',
            description: 'text-body-sm text-text-secondary',
            success:     'border-l-4 border-l-success',
            error:       'border-l-4 border-l-error',
            warning:     'border-l-4 border-l-warning',
            info:        'border-l-4 border-l-info',
          },
        }}
      />
    </QueryClientProvider>
  )
}
```

Update `src/app/layout.tsx` to wrap children with `<Providers>`.

---

### Task 2.18 — FormSection Component and Component Playground

**FormSection component** — build `src/components/shared/form-section/` for the consistent form layout used in all settings pages, creation wizards, and edit drawers.

```typescript
interface FormSectionProps {
  title:        string
  description?: string
  children:     React.ReactNode
  aside?:       React.ReactNode   // optional right-column content (desktop only)
  className?:   string
}
```

**Behavior requirements:**
- Container: two-column layout on `lg+` (title/description on left 1/3, form fields on right 2/3)
- On mobile: single column, title/description above fields
- Title: `text-heading-sm text-text-primary`
- Description: `text-body-md text-text-secondary mt-1`
- Separator: `border-t border-border-default` between sections when multiple `FormSection` components are stacked
- The `aside` slot renders below the description in the left column on desktop

**Component Playground** — create `src/app/playground/page.tsx` that renders every shared component in all its variants. This page is only accessible in `development` and `staging` environments (gated by `env.NEXT_PUBLIC_APP_ENV`). It serves as the visual regression reference and component documentation for the team.

The playground page renders the following sections, each with a heading and all variants displayed:

```
Sections:
  1. Typography Scale — all text utility classes
  2. Color Tokens — all CSS variables as swatches
  3. Buttons — all variants and sizes
  4. Form Inputs — Input, Textarea, Select, Checkbox, Switch, RadioGroup
  5. Badges — all StatusBadge status values
  6. KPI Cards — default, with trend (up/down), loading state
  7. DataTable — sample data with sorting, filtering, pagination
  8. EmptyState — all preset variants
  9. PageHeader — with breadcrumbs, actions, and tabs
  10. Activity Feed — sample items, loading state
  11. Skeletons — all skeleton composition types
  12. Sidebar — isolated render of the sidebar component
  13. Dialogs & Drawers — Alert Dialog, Sheet, Drawer
  14. Toast Notifications — trigger buttons for each toast type
```

---

---

## Folder Structure Output (End of Phase 2)

```
src/
├── app/
│   ├── (dashboard)/
│   │   └── layout.tsx              [complete — sidebar + topnav shell]
│   ├── (vendor)/
│   │   └── layout.tsx              [complete — vendor shell]
│   ├── (admin)/
│   │   └── layout.tsx              [complete — admin shell]
│   ├── playground/
│   │   └── page.tsx                [complete — component playground]
│   └── layout.tsx                  [updated — Providers + Inter font]
├── components/
│   ├── ui/                         [complete — all shadcn/ui primitives]
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── label.tsx
│   │   ├── badge.tsx
│   │   ├── avatar.tsx
│   │   ├── dialog.tsx
│   │   ├── sheet.tsx
│   │   ├── dropdown-menu.tsx
│   │   ├── tooltip.tsx
│   │   ├── tabs.tsx
│   │   ├── skeleton.tsx
│   │   └── [all other shadcn components]
│   ├── shared/
│   │   ├── data-table/             [complete]
│   │   ├── status-badge/           [complete]
│   │   ├── kpi-card/               [complete]
│   │   ├── empty-state/            [complete]
│   │   ├── page-header/            [complete]
│   │   ├── skeleton/               [complete]
│   │   ├── activity-feed/          [complete]
│   │   └── form-section/           [complete]
│   └── layout/
│       ├── sidebar/                [complete]
│       ├── top-navigation/         [complete]
│       ├── workspace-switcher/     [complete]
│       └── providers.tsx           [complete]
├── lib/
│   ├── utils.ts                    [from Phase 1]
│   ├── env.ts                      [from Phase 1]
│   └── navigation.ts               [complete — COMPANY_NAV, VENDOR_NAV, ADMIN_NAV]
├── stores/
│   └── sidebar-store.ts            [complete]
├── styles/
│   └── globals.css                 [complete — all tokens + typography classes]
└── types/
    └── ui.ts                       [complete — Size, Variant, ColorIntent, Density]
```

---

## Testing Checklist

```
✓ pnpm dev: application loads at localhost:3000 without errors
✓ localhost:3000/playground: component playground renders all sections
✓ Token audit: zero hardcoded hex values in src/ (search for '#[0-9a-fA-F]{3,6}')
✓ Token audit: zero hardcoded px values not from Tailwind scale in className strings
✓ Sidebar: renders, collapses, expands; state persists on page refresh
✓ Sidebar: active route highlighted correctly on navigation
✓ Sidebar: tooltip visible on collapsed item hover
✓ TopNavigation: renders workspace name, bell icon, user menu
✓ UserMenu: opens dropdown with Profile, Settings, Sign Out
✓ WorkspaceSwitcher: opens popover with workspace options
✓ DataTable: renders with stub data, sorting works, pagination works
✓ DataTable: loading state renders skeleton rows
✓ DataTable: empty state renders EmptyState component
✓ StatusBadge: all status variants render with correct color tokens
✓ KPICard: value animates on mount via react-countup
✓ KPICard: loading skeleton matches card dimensions
✓ EmptyState: all preset variants render correctly
✓ PageHeader: renders title, breadcrumbs, description, action slot
✓ ActivityFeed: renders items with timeline connector line
✓ FormSection: two-column layout on desktop, single column on mobile
✓ Mobile: sidebar renders as Sheet drawer on screens < lg
✓ Keyboard navigation: all interactive elements reachable via Tab key
✓ Accessibility: no axe-core violations on playground page
✓ pnpm build: completes without TypeScript errors
✓ pnpm type-check: exits with code 0
✓ pnpm lint: exits with code 0
```

---

## Acceptance Criteria

```
AC-2.1   All CSS custom property tokens defined in globals.css per DESIGN.md Section 4
AC-2.2   tailwind.config.ts maps every token to a Tailwind utility class
AC-2.3   Zero hardcoded hex color values in any .tsx or .ts file under src/
AC-2.4   All shadcn/ui components installed and rendering without console errors
AC-2.5   DataTable renders, sorts, filters, and paginates with sample data
AC-2.6   StatusBadge renders all defined status values with correct token colors
AC-2.7   KPICard renders with animated value, trend indicator, and loading skeleton
AC-2.8   EmptyState renders all preset variants and accepts custom content
AC-2.9   PageHeader renders with breadcrumbs, description, and action slot
AC-2.10  Sidebar collapses/expands; state persists across page refreshes
AC-2.11  TopNavigation renders and is sticky at the top of the viewport
AC-2.12  WorkspaceSwitcher opens a popover with workspace options
AC-2.13  Dashboard shell layout renders correctly at desktop, tablet, and mobile
AC-2.14  Playground page accessible at /playground in development environment
AC-2.15  TanStack Query client configured in Providers with correct default options
AC-2.16  Sonner toast styled with VendorFlow tokens; all four variants functional
AC-2.17  All shared components have named exports via index.ts barrel files
AC-2.18  All components keyboard accessible; axe-core scan on playground: zero violations
```

---

## Definition of Done

Phase 2 is complete when all Acceptance Criteria above are met AND:

- [ ] All TypeScript checks pass (zero errors)
- [ ] All ESLint checks pass (zero warnings)
- [ ] All Prettier checks pass
- [ ] Token audit: `grep -r '#[0-9a-fA-F]\{3,6\}' src/` returns zero results outside of globals.css
- [ ] Playground page renders all component sections without console errors
- [ ] Sidebar collapse/expand tested; mobile sheet tested
- [ ] Dark mode CSS variables defined in `.dark` block (even if not yet toggled)
- [ ] No stub or TODO code remains in shared components or layout
- [ ] PR merged to `develop` with at least 1 reviewer approval
- [ ] `feature/02-ui-foundation` branch merged and deleted

---

## Risk Factors

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| shadcn/ui CSS variable conflicts with custom token names | Medium | Medium | Audit generated files immediately after `shadcn init`; rename conflicts before building components |
| Sidebar mobile Sheet not triggering from TopNavigation | Low | Low | Wire `onMobileMenuToggle` through a shared Zustand store (extend `sidebar-store.ts`) |
| react-countup causing hydration mismatch in Server Components | Medium | Medium | Wrap `KPICard` value display in `dynamic(() => import(...), { ssr: false })` if SSR hydration fails |
| Tailwind CSS class purging removing token-mapped classes | Low | High | Ensure `tailwind.config.ts` content array covers all component paths; test with production build |
| Component playground route accessible in production | Low | Medium | Gate playground with `env.NEXT_PUBLIC_APP_ENV !== 'production'` check at the top of `page.tsx` |

---

## Estimated Completion

**4–5 working days** for a single developer familiar with Tailwind, shadcn/ui, and React.

---


---

# PHASE 3 — BACKEND FOUNDATION

---

## Overview

| Field | Value |
|---|---|
| Phase Number | 3 |
| Phase Name | Backend Foundation |
| Milestone | M1 — Platform Foundation |
| PRD Reference | Technical Requirements (Section 19), Data Architecture (Section 20) |
| DESIGN Reference | F01 Folder Organization |
| Estimated Duration | 3–4 days |
| Prerequisite Phases | Phase 1 — Project Foundation, Phase 2 — UI Foundation |

---

## Purpose

Phase 3 establishes the complete Supabase backend foundation for VendorFlow. No business feature tables are created in this phase. The output is a fully configured Supabase project with the foundational schema (companies, vendors, users, profiles), Row Level Security enabled on every table from the first migration, authentication configured for all providers, all storage buckets created with access policies, and a scaffold for Edge Functions.

When Phase 4 begins, the authentication flows have a live, correctly configured backend to connect to. When Phases 5–32 build their tables, they inherit the RLS patterns, migration conventions, and Supabase client helpers established here.

---

## Business Goal

A backend wired incorrectly from the start is the most dangerous technical debt in a SaaS product. RLS policies added retroactively miss edge cases. Storage buckets created without access policies leak data. Auth providers configured after the fact require session migration. Phase 3 eliminates these risks by getting every backend primitive right before a single line of feature code is written. The 3–4 day investment here protects the security and correctness of every subsequent phase.

---

## Dependencies

- Phase 1 complete (Next.js scaffold, environment variable schema)
- Phase 2 complete (Supabase client helpers will be imported by UI components in Phase 4)
- Supabase account created at [supabase.com](https://supabase.com)
- Supabase CLI installed: `pnpm add -D supabase` (already in Phase 1 devDependencies)
- Two Supabase projects created: `vendorflow-dev` (local) and `vendorflow-staging`
- Local Docker Desktop running (required for `supabase start`)

---

## Deliverables

At the end of Phase 3, the following must exist and be committed to `develop`:

1. Supabase project initialized locally (`supabase/` directory committed)
2. Migration `0001_create_foundation_schema.sql` — companies, vendors, profiles tables
3. Migration `0002_enable_rls_foundation.sql` — RLS enabled and policies on all foundation tables
4. Migration `0003_create_helper_functions.sql` — auth helper functions used by RLS policies
5. Auth configuration: email/password and Google OAuth enabled in Supabase dashboard
6. All 12 storage buckets created with correct access policies
7. `src/lib/supabase/client.ts` — browser Supabase client (singleton)
8. `src/lib/supabase/server.ts` — server Supabase client (per-request, SSR-safe)
9. `src/lib/supabase/middleware.ts` — session refresh middleware
10. `src/middleware.ts` — Next.js middleware wiring session refresh and route protection stubs
11. `src/types/database.ts` — generated TypeScript types from Supabase schema
12. `supabase/functions/` scaffold with shared utilities (`_shared/cors.ts`, `_shared/auth.ts`)
13. Feature flags table and seed data
14. `src/hooks/use-supabase.ts` — typed hooks for client-side Supabase access
15. RLS verification: passing test queries confirming tenant isolation on foundation tables

---

## Tasks

### Task 3.1 — Supabase Project Initialization

Initialize the Supabase CLI project and start the local development stack:

```bash
# Initialize Supabase in the project root
pnpm supabase init

# Start local Supabase stack (requires Docker Desktop)
pnpm supabase:start
```

After `supabase start`, note the local credentials output:
```
API URL:      http://localhost:54321
GraphQL URL:  http://localhost:54321/graphql/v1
DB URL:       postgresql://postgres:postgres@localhost:54322/postgres
Studio URL:   http://localhost:54323
Anon key:     <local-anon-key>
Service role: <local-service-role-key>
```

Update `.env.local` with these local values. Confirm Supabase Studio is accessible at `localhost:54323`.

Configure `supabase/config.toml` for the VendorFlow project:

```toml
[api]
enabled = true
port = 54321
schemas = ["public", "storage", "graphql_public"]
extra_search_path = ["public", "extensions"]
max_rows = 1000

[db]
port = 54322
shadow_port = 54320
major_version = 15

[studio]
enabled = true
port = 54323

[auth]
enabled = true
site_url = "http://localhost:3000"
additional_redirect_urls = ["https://staging.vendorflow.in", "https://app.vendorflow.in"]
jwt_expiry = 3600
enable_signup = true

[auth.email]
enable_signup = true
double_confirm_changes = true
enable_confirmations = true

[auth.external.google]
enabled = true
client_id = "env(GOOGLE_CLIENT_ID)"
secret = "env(GOOGLE_CLIENT_SECRET)"

[storage]
enabled = true
file_size_limit = "50MiB"
```

---

### Task 3.2 — Foundation Schema Migration

Create `supabase/migrations/0001_create_foundation_schema.sql`. This migration creates the three foundational tables that all other tables reference: `companies`, `vendors`, and `profiles`.

```sql
-- ============================================================
-- Migration: 0001_create_foundation_schema
-- Description: Foundation tables — companies, vendors, profiles
-- ============================================================

-- Enable required extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pg_trgm";  -- for full-text search

-- ── COMPANIES ────────────────────────────────────────────────
create table public.companies (
  id                  uuid primary key default gen_random_uuid(),
  name                text not null,
  slug                text not null unique,
  legal_name          text,
  gstin               text,
  pan                 text,
  industry            text,
  company_size        text,
  website             text,
  logo_url            text,
  address_line1       text,
  address_line2       text,
  city                text,
  state               text,
  pincode             text,
  country             text not null default 'India',
  phone               text,
  email               text,
  subscription_plan   text not null default 'free'
                        check (subscription_plan in ('free','starter','professional','enterprise')),
  subscription_status text not null default 'active'
                        check (subscription_status in ('active','trialing','past_due','cancelled')),
  is_active           boolean not null default true,
  onboarding_complete boolean not null default false,
  deleted_at          timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index idx_companies_slug      on public.companies(slug);
create index idx_companies_is_active on public.companies(is_active);
create index idx_companies_created_at on public.companies(created_at desc);

-- ── VENDORS ──────────────────────────────────────────────────
create table public.vendors (
  id                  uuid primary key default gen_random_uuid(),
  name                text not null,
  slug                text not null unique,
  legal_name          text,
  gstin               text,
  pan                 text,
  category            text[],
  description         text,
  logo_url            text,
  website             text,
  address_line1       text,
  address_line2       text,
  city                text,
  state               text,
  pincode             text,
  country             text not null default 'India',
  phone               text,
  email               text not null,
  verification_status text not null default 'unverified'
                        check (verification_status in
                          ('unverified','under_review','verified','suspended','blacklisted')),
  reputation_score    numeric(3,1) default 0.0
                        check (reputation_score >= 0 and reputation_score <= 5),
  total_orders        integer not null default 0,
  is_active           boolean not null default true,
  onboarding_complete boolean not null default false,
  deleted_at          timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index idx_vendors_slug               on public.vendors(slug);
create index idx_vendors_verification_status on public.vendors(verification_status);
create index idx_vendors_is_active          on public.vendors(is_active);
create index idx_vendors_created_at         on public.vendors(created_at desc);
create index idx_vendors_name_trgm          on public.vendors using gin(name gin_trgm_ops);

-- ── PROFILES ─────────────────────────────────────────────────
-- One row per auth.users entry. Created by trigger on user signup.
create table public.profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  full_name       text,
  avatar_url      text,
  phone           text,
  timezone        text not null default 'Asia/Kolkata',
  locale          text not null default 'en-IN',
  company_id      uuid references public.companies(id) on delete set null,
  vendor_id       uuid references public.vendors(id)   on delete set null,
  role            text not null default 'company_user'
                    check (role in ('company_user','vendor_user','platform_admin')),
  last_seen_at    timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index idx_profiles_company_id on public.profiles(company_id);
create index idx_profiles_vendor_id  on public.profiles(vendor_id);

-- ── updated_at TRIGGER FUNCTION ──────────────────────────────
create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_companies_updated_at
  before update on public.companies
  for each row execute function public.handle_updated_at();

create trigger trg_vendors_updated_at
  before update on public.vendors
  for each row execute function public.handle_updated_at();

create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute function public.handle_updated_at();

-- ── AUTO-CREATE PROFILE ON SIGNUP ────────────────────────────
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;

create trigger trg_on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
```

---

### Task 3.3 — RLS Foundation Migration

Create `supabase/migrations/0002_enable_rls_foundation.sql`. RLS is enabled on every table created in Migration 0001 and policies are defined before any application code runs against the database.

```sql
-- ============================================================
-- Migration: 0002_enable_rls_foundation
-- Description: Row Level Security policies for foundation tables
-- ============================================================

-- ── Helper function: get current user's company_id ───────────
create or replace function public.get_my_company_id()
returns uuid language sql stable security definer as $$
  select company_id from public.profiles where id = auth.uid()
$$;

-- ── Helper function: get current user's vendor_id ────────────
create or replace function public.get_my_vendor_id()
returns uuid language sql stable security definer as $$
  select vendor_id from public.profiles where id = auth.uid()
$$;

-- ── Helper function: check if platform admin ─────────────────
create or replace function public.is_platform_admin()
returns boolean language sql stable security definer as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'platform_admin'
  )
$$;

-- ── COMPANIES: enable RLS ────────────────────────────────────
alter table public.companies enable row level security;

-- Company members can read their own company
create policy "companies_select_own"
  on public.companies for select
  using (id = public.get_my_company_id());

-- Platform admins can read all companies
create policy "companies_select_admin"
  on public.companies for select
  using (public.is_platform_admin());

-- Company members can update their own company
create policy "companies_update_own"
  on public.companies for update
  using (id = public.get_my_company_id());

-- Only platform admins can insert or delete companies
-- (company creation happens via Edge Function with service role)
create policy "companies_insert_admin"
  on public.companies for insert
  with check (public.is_platform_admin());

create policy "companies_delete_admin"
  on public.companies for delete
  using (public.is_platform_admin());

-- ── VENDORS: enable RLS ──────────────────────────────────────
alter table public.vendors enable row level security;

-- Vendor members can read their own vendor record
create policy "vendors_select_own"
  on public.vendors for select
  using (id = public.get_my_vendor_id());

-- Company users can read verified vendors (marketplace)
create policy "vendors_select_verified"
  on public.vendors for select
  using (
    verification_status = 'verified'
    and public.get_my_company_id() is not null
  );

-- Platform admins can read all vendors
create policy "vendors_select_admin"
  on public.vendors for select
  using (public.is_platform_admin());

-- Vendor members can update their own record
create policy "vendors_update_own"
  on public.vendors for update
  using (id = public.get_my_vendor_id());

-- Only platform admins can insert or delete vendor records
create policy "vendors_insert_admin"
  on public.vendors for insert
  with check (public.is_platform_admin());

create policy "vendors_delete_admin"
  on public.vendors for delete
  using (public.is_platform_admin());

-- ── PROFILES: enable RLS ─────────────────────────────────────
alter table public.profiles enable row level security;

-- Users can read their own profile
create policy "profiles_select_own"
  on public.profiles for select
  using (id = auth.uid());

-- Company admins can read profiles in their company
create policy "profiles_select_company"
  on public.profiles for select
  using (company_id = public.get_my_company_id());

-- Users can update their own profile
create policy "profiles_update_own"
  on public.profiles for update
  using (id = auth.uid());

-- Platform admins can read all profiles
create policy "profiles_select_admin"
  on public.profiles for select
  using (public.is_platform_admin());
```

---

### Task 3.4 — Auth Configuration and Feature Flags Migration

**Auth provider configuration** (done in Supabase Dashboard + `config.toml`):

```
Email/Password:
  ✓ Enable email signups
  ✓ Confirm email on signup (double opt-in)
  ✓ Secure email change: require confirmation on new address
  ✓ Minimum password length: 8

Google OAuth:
  ✓ Enable Google provider
  ✓ Client ID and Secret from Google Cloud Console OAuth 2.0 credentials
  ✓ Authorized redirect URI: https://[project-ref].supabase.co/auth/v1/callback
  ✓ Add localhost:3000 and staging.vendorflow.in to allowed origins

Email templates (customized in Supabase Dashboard):
  - Confirm signup:    VendorFlow branded, links to /verify-email
  - Reset password:   VendorFlow branded, links to /reset-password
  - Invite user:      VendorFlow branded, links to /accept-invite
  - Change email:     VendorFlow branded
```

**Feature flags migration** — create `supabase/migrations/0003_create_feature_flags.sql`:

```sql
-- ============================================================
-- Migration: 0003_create_feature_flags
-- Description: Feature flags table for AI modules and staged rollouts
-- ============================================================

create table public.feature_flags (
  id           uuid primary key default gen_random_uuid(),
  flag_name    text not null unique,
  description  text,
  enabled      boolean not null default false,
  workspace_id uuid,              -- null = platform-wide flag
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index idx_feature_flags_flag_name    on public.feature_flags(flag_name);
create index idx_feature_flags_workspace_id on public.feature_flags(workspace_id);

create trigger trg_feature_flags_updated_at
  before update on public.feature_flags
  for each row execute function public.handle_updated_at();

alter table public.feature_flags enable row level security;

-- Any authenticated user can read feature flags (values are not sensitive)
create policy "feature_flags_select_authenticated"
  on public.feature_flags for select
  using (auth.uid() is not null);

-- Only platform admins can manage feature flags
create policy "feature_flags_all_admin"
  on public.feature_flags for all
  using (public.is_platform_admin());

-- Seed: AI module flags (all disabled by default per DESIGN.md AI13)
insert into public.feature_flags (flag_name, description, enabled) values
  ('ai_spend_forecasting',      'AI-powered spend forecasting module',       false),
  ('ai_vendor_recommendation',  'AI vendor recommendation engine',           false),
  ('ai_contract_intelligence',  'AI contract analysis and risk scoring',     false),
  ('ai_invoice_matching',       'Automated invoice-to-PO matching',          false),
  ('ai_market_intelligence',    'Real-time market price benchmarking',       false);
```

---

### Task 3.5 — Storage Buckets Configuration

Create `supabase/migrations/0004_create_storage_buckets.sql` to provision all 12 storage buckets with their access policies. All buckets are private unless explicitly noted as public.

```sql
-- ============================================================
-- Migration: 0004_create_storage_buckets
-- Description: Storage bucket creation and access policies
-- ============================================================

-- ── Create buckets ───────────────────────────────────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('company-logos',        'company-logos',        true,  5242880,
    array['image/jpeg','image/png','image/webp','image/svg+xml']),
  ('vendor-logos',         'vendor-logos',         true,  5242880,
    array['image/jpeg','image/png','image/webp','image/svg+xml']),
  ('product-images',       'product-images',       true,  10485760,
    array['image/jpeg','image/png','image/webp']),
  ('avatars',              'avatars',              true,  2097152,
    array['image/jpeg','image/png','image/webp']),
  ('vendor-documents',     'vendor-documents',     false, 52428800,
    array['application/pdf','image/jpeg','image/png']),
  ('pr-attachments',       'pr-attachments',       false, 52428800,
    array['application/pdf','image/jpeg','image/png',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/vnd.ms-excel']),
  ('po-documents',         'po-documents',         false, 52428800,
    array['application/pdf']),
  ('invoices',             'invoices',             false, 52428800,
    array['application/pdf']),
  ('payment-receipts',     'payment-receipts',     false, 10485760,
    array['application/pdf','image/jpeg','image/png']),
  ('reports',              'reports',              false, 52428800,
    array['application/pdf',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']),
  ('documents',            'documents',            false, 52428800,
    array['application/pdf','image/jpeg','image/png',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document']),
  ('message-attachments',  'message-attachments',  false, 20971520,
    array['image/jpeg','image/png','image/webp','application/pdf']);

-- ── Storage RLS policies ─────────────────────────────────────

-- company-logos: public read, authenticated company write
create policy "company_logos_read"
  on storage.objects for select
  using (bucket_id = 'company-logos');

create policy "company_logos_write"
  on storage.objects for insert
  with check (
    bucket_id = 'company-logos'
    and auth.uid() is not null
    and (storage.foldername(name))[1] = public.get_my_company_id()::text
  );

create policy "company_logos_update"
  on storage.objects for update
  using (
    bucket_id = 'company-logos'
    and (storage.foldername(name))[1] = public.get_my_company_id()::text
  );

-- vendor-logos: public read, authenticated vendor write
create policy "vendor_logos_read"
  on storage.objects for select
  using (bucket_id = 'vendor-logos');

create policy "vendor_logos_write"
  on storage.objects for insert
  with check (
    bucket_id = 'vendor-logos'
    and auth.uid() is not null
    and (storage.foldername(name))[1] = public.get_my_vendor_id()::text
  );

-- avatars: public read, user writes own avatar
create policy "avatars_read"
  on storage.objects for select
  using (bucket_id = 'avatars');

create policy "avatars_write"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- vendor-documents: vendor can upload, platform admin can read all
create policy "vendor_documents_vendor_write"
  on storage.objects for insert
  with check (
    bucket_id = 'vendor-documents'
    and (storage.foldername(name))[1] = public.get_my_vendor_id()::text
  );

create policy "vendor_documents_vendor_read"
  on storage.objects for select
  using (
    bucket_id = 'vendor-documents'
    and (storage.foldername(name))[1] = public.get_my_vendor_id()::text
  );

create policy "vendor_documents_admin_read"
  on storage.objects for select
  using (
    bucket_id = 'vendor-documents'
    and public.is_platform_admin()
  );

-- pr-attachments: company workspace read/write
create policy "pr_attachments_company_rw"
  on storage.objects for all
  using (
    bucket_id = 'pr-attachments'
    and (storage.foldername(name))[1] = public.get_my_company_id()::text
  );

-- Remaining private buckets follow the same pattern:
-- folder structure: bucket/[company_id or vendor_id]/[record_id]/filename
-- policies: workspace owner read/write; platform admin read all
-- (policies for po-documents, invoices, payment-receipts, reports,
--  documents, message-attachments follow the same template and are
--  added in their respective module migration phases)
```

---

### Task 3.6 — Edge Functions Scaffold

Create the Supabase Edge Functions directory structure with shared utilities that every function will import.

**Directory structure:**
```
supabase/functions/
  _shared/
    cors.ts
    auth.ts
    error.ts
    response.ts
  create-company/
    index.ts        [stub]
  create-vendor/
    index.ts        [stub]
```

**`supabase/functions/_shared/cors.ts`:**
```typescript
export const corsHeaders = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
}

export function handleCors(req: Request): Response | null {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  return null
}
```

**`supabase/functions/_shared/auth.ts`:**
```typescript
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

export async function getAuthenticatedUser(req: Request) {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    throw new Error('Missing authorization header')
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    { global: { headers: { Authorization: authHeader } } }
  )

  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) {
    throw new Error('Unauthorized')
  }

  return { user, supabase }
}
```

**`supabase/functions/_shared/error.ts`:**
```typescript
import { corsHeaders } from './cors.ts'

export function errorResponse(message: string, status = 400): Response {
  return new Response(
    JSON.stringify({ error: message }),
    { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}
```

**`supabase/functions/_shared/response.ts`:**
```typescript
import { corsHeaders } from './cors.ts'

export function successResponse<T>(data: T, status = 200): Response {
  return new Response(
    JSON.stringify(data),
    { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}
```

**`supabase/functions/create-company/index.ts`** (stub — full implementation in Phase 5):
```typescript
import { handleCors } from '../_shared/cors.ts'
import { errorResponse } from '../_shared/error.ts'

Deno.serve(async (req) => {
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse

  return errorResponse('Not implemented — see Phase 5', 501)
})
```

---

### Task 3.7 — Supabase Client Helpers

Create the three Supabase client modules in `src/lib/supabase/`. These are the only files in the codebase that instantiate a Supabase client. All other files import from here — never from `@supabase/supabase-js` directly.

**`src/lib/supabase/client.ts`** — browser singleton for Client Components:

```typescript
import { createBrowserClient } from '@supabase/ssr'

import type { Database } from '@/types/database'
import { env } from '@/lib/env'

export function createClient() {
  return createBrowserClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
}
```

**`src/lib/supabase/server.ts`** — per-request server client for Server Components and Route Handlers:

```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

import type { Database } from '@/types/database'
import { env } from '@/lib/env'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          } catch {
            // Server Component context — cookies can be read but not set.
            // Session refresh is handled by middleware.
          }
        },
      },
    }
  )
}
```

**`src/lib/supabase/middleware.ts`** — session refresh utility called from Next.js middleware:

```typescript
import { createServerClient } from '@supabase/ssr'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import type { Database } from '@/types/database'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session — do not remove this call
  const { data: { user } } = await supabase.auth.getUser()

  return { supabaseResponse, user }
}
```

**`src/middleware.ts`** — Next.js middleware wiring session refresh and route protection stubs:

```typescript
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { updateSession } from '@/lib/supabase/middleware'

// Routes that do not require authentication
const PUBLIC_ROUTES = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/verify-email',
  '/accept-invite',
]

export async function middleware(request: NextRequest) {
  const { supabaseResponse, user } = await updateSession(request)
  const pathname = request.nextUrl.pathname

  const isPublicRoute = PUBLIC_ROUTES.some((route) =>
    pathname.startsWith(route)
  )

  // Redirect unauthenticated users to login
  if (!user && !isPublicRoute) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/login'
    loginUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Redirect authenticated users away from auth pages
  if (user && isPublicRoute) {
    const dashboardUrl = request.nextUrl.clone()
    dashboardUrl.pathname = '/dashboard'
    return NextResponse.redirect(dashboardUrl)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

---

### Task 3.8 — TypeScript Types Generation and useSupabase Hook

**Generate TypeScript types** from the local Supabase schema:

```bash
pnpm db:generate-types
```

This runs `supabase gen types typescript --local > src/types/database.ts` and produces the full type-safe database schema. This file is committed and regenerated after every migration. It is never hand-edited.

The generated `src/types/database.ts` provides:
- `Database` — the root type imported by all Supabase clients
- `Tables<'table_name'>` — row type for any table
- `TablesInsert<'table_name'>` — insert payload type
- `TablesUpdate<'table_name'>` — update payload type
- `Enums<'enum_name'>` — database enum types

**`src/hooks/use-supabase.ts`** — typed hook for accessing the Supabase browser client in Client Components:

```typescript
'use client'

import { useMemo } from 'react'

import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/types/database'
import type { SupabaseClient } from '@supabase/supabase-js'

export function useSupabase(): SupabaseClient<Database> {
  // Memoized so the client instance is stable across re-renders
  return useMemo(() => createClient(), [])
}
```

**`src/hooks/use-feature-flag.ts`** — hook for checking feature flags in Client Components:

```typescript
'use client'

import { useQuery } from '@tanstack/react-query'

import { useSupabase } from './use-supabase'

export function useFeatureFlag(flagName: string): boolean {
  const supabase = useSupabase()

  const { data } = useQuery({
    queryKey: ['feature-flag', flagName],
    queryFn: async () => {
      const { data } = await supabase
        .from('feature_flags')
        .select('enabled')
        .eq('flag_name', flagName)
        .maybeSingle()
      return data?.enabled ?? false
    },
    staleTime: 5 * 60 * 1000,  // 5 minutes — flags don't change often
  })

  return data ?? false
}
```

---

### Task 3.9 — RLS Verification and Migration Conventions

**RLS verification procedure** — run the following checks against the local Supabase instance before Phase 3 is considered done. These queries confirm tenant isolation is working correctly on the foundation tables.

```sql
-- Test 1: Verify a user cannot read another company's record
-- Set auth context to user A (company_id = 'aaa...')
set local role authenticated;
set local request.jwt.claims to '{"sub": "user-a-uuid", "role": "authenticated"}';
select count(*) from public.companies;
-- Expected: 1 (only their own company)

-- Test 2: Verify a company user cannot read a vendor's non-public record
select count(*) from public.vendors where verification_status = 'unverified';
-- Expected: 0 (unverified vendors not visible to company users)

-- Test 3: Verify a user cannot update another company's record
update public.companies set name = 'Hacked' where id != (select get_my_company_id());
-- Expected: 0 rows updated (UPDATE returns empty result set, not an error)

-- Test 4: Verify platform admin can read all companies
set local request.jwt.claims to '{"sub": "admin-uuid", "role": "authenticated"}';
select count(*) from public.companies;
-- Expected: all companies visible
```

**Migration file conventions** — enforced for every migration created in Phases 4–32:

```
Naming:     [NNNN]_[verb]_[description].sql
            0005_create_employees.sql
            0006_add_approval_workflow_tables.sql
            0007_add_rfq_tables.sql

Rules:
  - Sequential numbering — never skip, never reuse a number
  - One logical change per migration file
  - Always include a comment header:
      -- Migration: NNNN_description
      -- Description: What this migration does and why
  - Never edit a migration after it has been run on any environment
  - All new tables: include RLS enable + policies in the same migration
  - All foreign keys: explicit FK constraints with named indexes
  - All timestamps: timestamptz, named created_at / updated_at
  - All primary keys: uuid default gen_random_uuid()
  - Soft delete columns: deleted_at timestamptz nullable

Rollback strategy:
  Supabase does not support automatic rollbacks. Before running a migration
  on staging or production:
  1. Take a database backup (Supabase Dashboard → Database → Backups)
  2. Test the migration on a local clone first
  3. For destructive migrations (drop column, drop table): write the
     migration in a transaction with a verification SELECT before committing
```

---

---

## Folder Structure Output (End of Phase 3)

```
supabase/
├── config.toml                                [complete]
├── migrations/
│   ├── 0001_create_foundation_schema.sql      [complete]
│   ├── 0002_enable_rls_foundation.sql         [complete]
│   ├── 0003_create_feature_flags.sql          [complete]
│   └── 0004_create_storage_buckets.sql        [complete]
└── functions/
    ├── _shared/
    │   ├── cors.ts                            [complete]
    │   ├── auth.ts                            [complete]
    │   ├── error.ts                           [complete]
    │   └── response.ts                        [complete]
    ├── create-company/
    │   └── index.ts                           [stub]
    └── create-vendor/
        └── index.ts                           [stub]

src/
├── lib/
│   └── supabase/
│       ├── client.ts                          [complete]
│       ├── server.ts                          [complete]
│       └── middleware.ts                      [complete]
├── middleware.ts                              [complete]
├── hooks/
│   ├── use-supabase.ts                        [complete]
│   └── use-feature-flag.ts                   [complete]
└── types/
    └── database.ts                            [generated — committed]
```

---

## Testing Checklist

```
✓ supabase start: local stack starts without errors
✓ localhost:54323 (Supabase Studio): tables visible — companies, vendors, profiles, feature_flags
✓ Migration 0001: companies, vendors, profiles tables exist with correct columns
✓ Migration 0002: RLS enabled on all three tables (verified in Studio → Table Editor → RLS)
✓ Migration 0003: feature_flags table exists; 5 AI flags seeded with enabled = false
✓ Migration 0004: all 12 storage buckets visible in Studio → Storage
✓ RLS test: user A cannot read user B's company record (manual SQL test per Task 3.9)
✓ RLS test: company user cannot read unverified vendor records
✓ RLS test: platform admin can read all records
✓ Storage policy: company-logos bucket allows public read without auth header
✓ Storage policy: vendor-documents bucket rejects unauthenticated read
✓ src/lib/supabase/client.ts: createClient() returns typed SupabaseClient<Database>
✓ src/lib/supabase/server.ts: createClient() usable in a Server Component without error
✓ src/middleware.ts: unauthenticated request to /dashboard redirects to /login
✓ src/middleware.ts: authenticated request to /login redirects to /dashboard
✓ src/types/database.ts: generated and committed; Tables<'companies'> resolves correctly
✓ useSupabase(): returns stable client reference across re-renders (checked with React DevTools)
✓ useFeatureFlag('ai_spend_forecasting'): returns false (matches seeded data)
✓ pnpm build: completes without TypeScript errors against generated types
✓ pnpm type-check: exits with code 0
✓ pnpm lint: exits with code 0
✓ Google OAuth: redirect URI configured in both Supabase dashboard and Google Cloud Console
✓ Email auth: test signup email delivers (check Supabase Studio → Auth → Email Templates)
```

---

## Acceptance Criteria

```
AC-3.1   supabase start runs successfully; Studio accessible at localhost:54323
AC-3.2   All four migrations applied cleanly via pnpm db:reset
AC-3.3   companies, vendors, profiles tables exist with all specified columns and indexes
AC-3.4   RLS enabled on all foundation tables; policies verified via SQL test suite
AC-3.5   get_my_company_id(), get_my_vendor_id(), is_platform_admin() helper functions exist
AC-3.6   handle_updated_at() trigger fires on companies, vendors, profiles on UPDATE
AC-3.7   handle_new_user() trigger creates a profile row on every new auth.users insert
AC-3.8   feature_flags table exists; all 5 AI flags seeded with enabled = false
AC-3.9   All 12 storage buckets created with correct public/private settings and MIME type restrictions
AC-3.10  Storage RLS policies: company-logos public read verified; vendor-documents private read verified
AC-3.11  src/lib/supabase/client.ts, server.ts, middleware.ts created with correct @supabase/ssr patterns
AC-3.12  src/middleware.ts: unauthenticated routes redirect to /login; auth pages redirect to /dashboard
AC-3.13  src/types/database.ts generated from local schema and committed
AC-3.14  useSupabase() and useFeatureFlag() hooks typed correctly against Database type
AC-3.15  Edge Functions _shared utilities in place; stub functions return 501 without crashing
AC-3.16  Google OAuth and email/password auth enabled and configured in Supabase dashboard
```

---

## Definition of Done

Phase 3 is complete when all Acceptance Criteria above are met AND:

- [ ] All four migration files committed and verified with `pnpm db:reset`
- [ ] RLS verification SQL tests run and pass for all foundation tables
- [ ] Storage bucket MIME type restrictions tested (rejected upload returns 400)
- [ ] `src/types/database.ts` generated from current schema and committed
- [ ] Middleware redirect behavior manually tested: unauthenticated → /login, authenticated → /dashboard
- [ ] `.env.local` updated with local Supabase credentials (not committed)
- [ ] Supabase staging project created; staging env vars added to Vercel
- [ ] No service role key referenced anywhere in `src/` (server.ts uses anon key)
- [ ] CI pipeline passes (type-check, lint, build) with generated database types
- [ ] PR merged to `develop` with at least 1 reviewer approval
- [ ] `feature/03-backend-foundation` branch merged and deleted

---

## Risk Factors

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Docker Desktop not running when `supabase start` is called | High | Medium | Document Docker Desktop requirement in README; add check to onboarding guide |
| Generated `database.ts` types out of sync after schema changes | Medium | High | Add `pnpm db:generate-types` to the CI pipeline as a required step after migrations |
| RLS policy blocks legitimate access pattern discovered in later phase | Medium | Medium | Run RLS tests after every new table is added; document expected access patterns per table |
| Google OAuth redirect URI mismatch between environments | Medium | Medium | Maintain a checklist of all three URIs (local, staging, production) in README; verify on each deploy |
| `handle_new_user` trigger fails silently if profiles insert errors | Low | High | Add error logging in the trigger function; test trigger on signup in Phase 4 |
| Storage MIME type restrictions too strict for a file type needed later | Low | Low | Allowed MIME types defined per bucket in migration; update migration if new types needed in later phases |

---

## Best Practices

- Run `pnpm db:generate-types` after every migration and commit the updated `database.ts` in the same PR as the migration
- Never use the Supabase service role key in `src/` — only in Edge Functions via `Deno.env`
- Always use `supabase.auth.getUser()` in server contexts — never trust `supabase.auth.getSession()` alone for authorization decisions
- Test RLS policies with explicit `set local role` statements in Supabase SQL Editor before committing the migration
- Keep migration files small and focused — one logical change per file makes rollback and debugging tractable
- Add a `supabase db lint` step to CI once the schema stabilizes to catch policy gaps automatically

---

## Estimated Completion

**3–4 working days** for a developer with prior Supabase experience; allow an extra day if configuring Google OAuth for the first time.

---

**** END OF PART 1 ****


---

# PHASE 4 — AUTHENTICATION

---

## Overview

| Field | Value |
|---|---|
| Phase Number | 4 |
| Phase Name | Authentication |
| Milestone | M2 — Authentication & Workspace |
| PRD Reference | Module 1 — Authentication & User Management |
| DESIGN Reference | Section 2 (Auth Screens), Section 4 (Tokens), F01, F03 |
| Estimated Duration | 4–5 days |
| Prerequisite Phases | Phase 1, Phase 2, Phase 3 |

---

## Purpose

Phase 4 implements the complete authentication layer for VendorFlow. Users can register as company accounts or vendor accounts, verify their email, log in with email/password or Google OAuth, reset their password, and accept invitations from workspace administrators.

All auth flows are backed by Supabase Auth (configured in Phase 3). This phase wires the UI screens (built per DESIGN.md) to the Supabase Auth client, establishes the JWT session with correct user metadata, and enforces the middleware route protection scaffolded in Phase 3.

---

## Business Goal

Authentication is the entry point to every other feature in VendorFlow. A broken or insecure auth flow blocks every subsequent phase and exposes the platform to account takeover, unauthorized data access, and compliance risk. Phase 4 ensures that every user who enters the platform is correctly identified, their workspace type is known, and their session is cryptographically valid — before any business data is ever requested.

---

## Dependencies

- Phase 1 — Project Foundation (path aliases, env schema, TypeScript config)
- Phase 2 — UI Foundation (Button, Input, Label, Form, Toast, Skeleton components)
- Phase 3 — Backend Foundation (Supabase Auth configured, `profiles` table, `handle_new_user` trigger, Supabase client helpers, middleware)
- Google OAuth credentials configured in Google Cloud Console and Supabase dashboard
- Resend account created; API key added to environment variables
- `.env.local` contains all required Supabase and app URL variables

---

## Database Tables

Phase 4 does not create new database tables. All auth state is managed by Supabase Auth (`auth.users`, `auth.sessions`, `auth.refresh_tokens`) which are internal to Supabase and not directly migrated. The `profiles` table created in Phase 3 is the application-level extension of `auth.users`.

The following columns on `profiles` are written during Phase 4 auth flows:

| Column | Written by | When |
|---|---|---|
| `id` | `handle_new_user` trigger | On `auth.users` insert |
| `full_name` | Registration form | On company/vendor signup |
| `avatar_url` | Google OAuth | On first OAuth login |
| `role` | Registration Edge Function | Set to `company_user` or `vendor_user` |
| `company_id` | Company registration (Phase 5) | After workspace creation |
| `vendor_id` | Vendor registration (Phase 8) | After workspace creation |
| `last_seen_at` | Middleware | On every authenticated request |

**`update_last_seen` function** — add to `supabase/migrations/0005_auth_helpers.sql`:

```sql
-- ============================================================
-- Migration: 0005_auth_helpers
-- Description: Auth-related helper functions and indexes
-- ============================================================

-- Index on profiles.last_seen_at for admin analytics
create index idx_profiles_last_seen_at on public.profiles(last_seen_at desc nulls last);

-- Function to update last_seen_at — called from middleware
create or replace function public.update_last_seen(user_id uuid)
returns void language sql security definer as $$
  update public.profiles
  set last_seen_at = now()
  where id = user_id;
$$;
```

---

## Relationships

```
auth.users (Supabase managed)
  └── public.profiles (1:1, id FK → auth.users.id ON DELETE CASCADE)
        ├── public.companies (N:1, company_id FK → companies.id)
        └── public.vendors   (N:1, vendor_id   FK → vendors.id)

One user can belong to one company AND one vendor (different auth contexts).
The active workspace context is determined by the current route group:
  (dashboard)/ → company context → uses company_id
  (vendor)/    → vendor context  → uses vendor_id
  (admin)/     → platform context → requires role = 'platform_admin'
```

---

## API Endpoints

All authentication operations use Supabase Auth client methods directly — no custom Next.js API routes. Complex post-auth operations (workspace creation, profile enrichment) go through Edge Functions.

| Operation | Method | Supabase Call | Notes |
|---|---|---|---|
| Email registration | Client | `supabase.auth.signUp()` | Triggers `handle_new_user`; sends confirmation email |
| Email login | Client | `supabase.auth.signInWithPassword()` | Returns session; httpOnly cookie set by SSR helper |
| Google OAuth initiate | Client | `supabase.auth.signInWithOAuth()` | Redirects to Google; callback to `/auth/callback` |
| OAuth callback | Server | `supabase.auth.exchangeCodeForSession()` | `/app/(auth)/auth/callback/route.ts` |
| Email verification | Client | `supabase.auth.verifyOtp()` | Token from email link; type = `signup` |
| Resend verification | Client | `supabase.auth.resend()` | type = `signup` |
| Password reset request | Client | `supabase.auth.resetPasswordForEmail()` | Sends reset link via Supabase email |
| Password reset confirm | Client | `supabase.auth.updateUser()` | Called on `/reset-password` after link click |
| Sign out | Client | `supabase.auth.signOut()` | Clears session cookie; redirects to `/login` |
| Accept invite | Server | `supabase.auth.verifyOtp()` | type = `invite`; token from invitation email |
| Get session | Server | `supabase.auth.getUser()` | Used in Server Components and middleware |
| Refresh session | Middleware | `updateSession()` | Called on every request via `src/middleware.ts` |

---

## Supabase Services Used

```
Supabase Auth:
  - Email/password provider
  - Google OAuth provider
  - OTP email verification
  - Password reset email
  - Invitation email (used in Phase 7 for employee invites)
  - JWT with custom user_metadata (role, workspace_id, workspace_type)

Supabase Database:
  - public.profiles — read/write during auth flows
  - public.update_last_seen() — called from middleware on each request

Supabase Edge Functions:
  - enrich-profile — called after registration to set role and workspace metadata
    on the auth.users record (requires service role key; cannot be done client-side)

Supabase Realtime:
  - Not used in Phase 4
```

**`supabase/functions/enrich-profile/index.ts`:**

```typescript
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { handleCors } from '../_shared/cors.ts'
import { getAuthenticatedUser } from '../_shared/auth.ts'
import { errorResponse } from '../_shared/error.ts'
import { successResponse } from '../_shared/response.ts'

interface EnrichProfilePayload {
  role: 'company_user' | 'vendor_user'
  full_name: string
}

Deno.serve(async (req) => {
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse

  try {
    const { user } = await getAuthenticatedUser(req)
    const payload: EnrichProfilePayload = await req.json()

    // Service role client — needed to update auth.users metadata
    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Update auth.users user_metadata with role
    const { error: metaError } = await adminClient.auth.admin.updateUserById(
      user.id,
      {
        user_metadata: {
          role: payload.role,
          full_name: payload.full_name,
        },
      }
    )
    if (metaError) throw metaError

    // Update profiles table
    const { error: profileError } = await adminClient
      .from('profiles')
      .update({
        full_name: payload.full_name,
        role: payload.role,
      })
      .eq('id', user.id)
    if (profileError) throw profileError

    return successResponse({ success: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return errorResponse(message, 400)
  }
})
```

---

## Folder Structure

```
src/
├── app/
│   └── (auth)/
│       ├── login/
│       │   └── page.tsx                    [Login page]
│       ├── register/
│       │   ├── company/
│       │   │   └── page.tsx                [Company registration]
│       │   └── vendor/
│       │       └── page.tsx                [Vendor registration]
│       ├── verify-email/
│       │   └── page.tsx                    [Email verification]
│       ├── forgot-password/
│       │   └── page.tsx                    [Request password reset]
│       ├── reset-password/
│       │   └── page.tsx                    [Set new password]
│       ├── accept-invite/
│       │   └── page.tsx                    [Accept workspace invitation]
│       └── auth/
│           └── callback/
│               └── route.ts                [OAuth callback handler]
├── components/
│   └── modules/
│       └── auth/
│           ├── login-form.tsx
│           ├── register-company-form.tsx
│           ├── register-vendor-form.tsx
│           ├── verify-email-form.tsx
│           ├── forgot-password-form.tsx
│           ├── reset-password-form.tsx
│           ├── accept-invite-form.tsx
│           ├── google-oauth-button.tsx
│           ├── auth-layout.tsx
│           └── index.ts
├── hooks/
│   ├── use-auth.ts
│   └── use-session.ts
└── stores/
    └── auth-store.ts
```

---

## UI Screens

### Screen 4.1 — Login Page (`/login`)

**Layout:** Centered card on `bg-bg-canvas`. VendorFlow logo above the card. Card: `bg-bg-surface border border-border-default shadow-md rounded-xl p-8 w-full max-w-md`.

**Contents:**
- Heading: "Welcome back" (`text-display-sm`)
- Subtext: "Sign in to your VendorFlow workspace" (`text-body-md text-text-secondary`)
- Google OAuth button (full width, outlined variant with Google logo)
- Divider: "or continue with email"
- Email input
- Password input with show/hide toggle
- "Forgot password?" link (right-aligned below password)
- "Sign in" button (full width, default variant)
- Footer: "Don't have an account? Register as a Company or Register as a Vendor" (two separate links)

**States:** Default, loading (button spinner + disabled inputs), error (inline Alert with specific message), success (brief toast then redirect).

---

### Screen 4.2 — Company Registration (`/register/company`)

**Layout:** Same centered card layout. Two-step form (step indicator at top).

**Step 1 — Account Details:**
- Full name input
- Work email input
- Password input (with strength indicator)
- Confirm password input
- Terms of Service checkbox
- "Create account" button
- "Already have an account? Sign in" link

**Step 2 — Verify Email:**
- Illustration / envelope icon
- "Check your inbox" heading
- Instruction copy with the email address redacted partially (so***@company.com)
- "Resend email" link (rate-limited: disabled for 60s after click)
- "Wrong email? Go back" link

---

### Screen 4.3 — Vendor Registration (`/register/vendor`)

Identical layout to Screen 4.2. Role is set to `vendor_user` on submission. After email verification, routes to `/vendor/dashboard` instead of `/dashboard`.

---

### Screen 4.4 — Verify Email (`/verify-email`)

Rendered when the user clicks the confirmation link in their email. The link contains a token and type in the URL hash. The page:
1. Extracts token from URL on mount
2. Calls `supabase.auth.verifyOtp()` automatically (no user action required)
3. Shows loading state while verifying
4. On success: calls `enrich-profile` Edge Function → redirects to onboarding wizard
5. On error: shows error message with "Resend verification email" option

---

### Screen 4.5 — Forgot Password (`/forgot-password`)

- Email input
- "Send reset link" button
- On success: confirmation message ("If that email exists, you'll receive a link shortly") — deliberately vague to prevent user enumeration
- "Back to login" link

---

### Screen 4.6 — Reset Password (`/reset-password`)

Rendered when user clicks the password reset link. URL contains access token.

- New password input (with strength indicator)
- Confirm new password input
- "Update password" button
- On success: toast + redirect to `/login`

---

### Screen 4.7 — Accept Invite (`/accept-invite`)

Rendered when an employee accepts a workspace invitation (used in Phase 7 — the route is built here).

- Pre-filled email (read-only, from invite token)
- Full name input
- Password input
- Confirm password input
- "Accept invitation & join workspace" button

---

## Components

### `AuthLayout` (`src/components/modules/auth/auth-layout.tsx`)

Wraps all auth screens. Renders the centered card layout, VendorFlow branding, and a background pattern. All auth pages use this as their outer wrapper.

```typescript
interface AuthLayoutProps {
  children:    React.ReactNode
  title:       string
  subtitle?:   string
  showBack?:   boolean
  backHref?:   string
  backLabel?:  string
}
```

### `GoogleOAuthButton` (`src/components/modules/auth/google-oauth-button.tsx`)

```typescript
interface GoogleOAuthButtonProps {
  label?:      string     // default: 'Continue with Google'
  isLoading?:  boolean
  className?:  string
}
```

Calls `supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: '/auth/callback' } })`. Renders Google's official SVG icon inline (not from an external CDN).

### `PasswordInput`

An Input variant with an eye/eye-off toggle button. Exported from `src/components/ui/` as a named export. Used on all password fields across the application.

```typescript
interface PasswordInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  showStrength?: boolean   // renders password strength bar below input
}
```

### `PasswordStrengthBar`

Rendered below password inputs on registration and reset screens. Four-segment bar: red (weak) → orange (fair) → yellow (good) → green (strong). Strength is calculated client-side using a simple heuristic (length ≥ 8, uppercase, number, symbol).

---

## Forms

### Form 4.1 — Login Form

| Field | Type | Validation |
|---|---|---|
| Email | email input | Required, valid email format |
| Password | password input | Required, min 1 character (no complexity on login) |

Handled by `react-hook-form` + Zod. On submit: calls `supabase.auth.signInWithPassword()`. Error from Supabase (`Invalid login credentials`) is mapped to a user-friendly message: "Incorrect email or password." Never expose which field is wrong — prevents user enumeration.

```typescript
const loginSchema = z.object({
  email:    z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
})
```

---

### Form 4.2 — Company / Vendor Registration Form

| Field | Type | Validation |
|---|---|---|
| Full name | text input | Required, min 2 chars, max 100 chars |
| Email | email input | Required, valid email format |
| Password | password input | Required, min 8 chars, at least one uppercase, one number, one symbol |
| Confirm password | password input | Required, must match password field |
| Terms of Service | checkbox | Must be checked |

```typescript
const registerSchema = z.object({
  full_name:        z.string().min(2).max(100),
  email:            z.string().email(),
  password:         z.string()
                      .min(8, 'Password must be at least 8 characters')
                      .regex(/[A-Z]/, 'Must contain an uppercase letter')
                      .regex(/[0-9]/, 'Must contain a number')
                      .regex(/[^A-Za-z0-9]/, 'Must contain a special character'),
  confirm_password: z.string(),
  terms_accepted:   z.literal(true, {
                      errorMap: () => ({ message: 'You must accept the terms to continue' }),
                    }),
}).refine((d) => d.password === d.confirm_password, {
  message: 'Passwords do not match',
  path: ['confirm_password'],
})
```

---

### Form 4.3 — Forgot Password Form

| Field | Type | Validation |
|---|---|---|
| Email | email input | Required, valid email format |

On submit: `supabase.auth.resetPasswordForEmail(email, { redirectTo: env.NEXT_PUBLIC_APP_URL + '/reset-password' })`. Always shows success message regardless of whether the email exists (prevents enumeration).

---

### Form 4.4 — Reset Password Form

| Field | Type | Validation |
|---|---|---|
| New password | password input | Same rules as registration password |
| Confirm new password | password input | Must match new password |

URL must contain a valid Supabase recovery token. If token is missing or expired, shows error state with link to `/forgot-password`.

---

### Form 4.5 — Accept Invite Form

| Field | Type | Validation |
|---|---|---|
| Full name | text input | Required, min 2 chars, max 100 chars |
| Password | password input | Same rules as registration |
| Confirm password | password input | Must match |

Email is pre-populated from the invite token and rendered as read-only text, not an input.

---

## Tables

Phase 4 introduces no list/table UI. Authentication screens are single-purpose forms. The `profiles` table in the database is the only table written to during this phase (via trigger and Edge Function).

---

## Permissions

```
Auth routes are PUBLIC — no session required:
  /login
  /register/company
  /register/vendor
  /forgot-password
  /reset-password
  /verify-email
  /accept-invite
  /auth/callback

All (dashboard)/, (vendor)/, (admin)/ routes are PROTECTED.
Middleware enforces this (src/middleware.ts from Phase 3).

Additional workspace-type enforcement (added in Phase 4):
  (dashboard)/ routes: require profile.role = 'company_user' OR 'platform_admin'
  (vendor)/ routes:    require profile.role = 'vendor_user'  OR 'platform_admin'
  (admin)/ routes:     require profile.role = 'platform_admin'

If a vendor user hits a (dashboard)/ route: redirect to /vendor/dashboard.
If a company user hits a (vendor)/ route: redirect to /dashboard.
```

---

## Validation Rules

```
Email:
  - Must be a valid RFC 5322 email address
  - Checked client-side with Zod; Supabase enforces server-side
  - No disposable email domain blocking in v1 (backlog)

Password (registration and reset):
  - Minimum 8 characters
  - At least one uppercase letter (A–Z)
  - At least one digit (0–9)
  - At least one special character (!@#$%^&*...)
  - Maximum 72 characters (bcrypt limit)
  - Strength bar shows real-time feedback before form submission

Password (login):
  - No complexity requirements on login — only presence check
  - Rate limiting: Supabase Auth enforces 5 failed attempts → 15-minute lockout

OTP tokens:
  - Expiry: 1 hour (Supabase default; configurable in config.toml)
  - Single-use: consumed on first verification attempt
  - Type must match: signup / recovery / invite — never cross-use

OAuth:
  - State parameter validated by Supabase (CSRF protection built-in)
  - Only whitelisted redirect URIs accepted (configured in Supabase dashboard)
```

---

## Business Rules

```
BR-4.1  A user who registers via company registration is assigned role = 'company_user'.
        A user who registers via vendor registration is assigned role = 'vendor_user'.
        These roles are set via the enrich-profile Edge Function after email verification.

BR-4.2  Google OAuth users who arrive via /register/company are assigned
        role = 'company_user'. Google OAuth users via /register/vendor are assigned
        role = 'vendor_user'. The registration origin is tracked via a session
        storage flag set before the OAuth redirect and read on callback.

BR-4.3  A user cannot log in until their email is verified. Supabase Auth blocks
        unverified users from receiving a session token when
        enable_confirmations = true in config.toml.

BR-4.4  A user can belong to both a company workspace and a vendor workspace under
        the same email address. They have separate profile.company_id and
        profile.vendor_id values. The active context is determined by the route.

BR-4.5  Password reset links expire after 1 hour. Clicking an expired link renders
        the reset-password page in an error state with a link back to /forgot-password.

BR-4.6  The accept-invite flow (Phase 7) creates a new auth user if the invited email
        is not already registered. If already registered, it attaches the existing
        user to the workspace without requiring re-registration.

BR-4.7  After successful login, redirect destination priority:
        1. ?redirectTo query param (if present and same-origin)
        2. /dashboard for company_user
        3. /vendor/dashboard for vendor_user
        4. /admin/dashboard for platform_admin
```

---

## Security

```
Session management:
  - JWT tokens stored in httpOnly cookies via @supabase/ssr — never in localStorage
  - Session refresh happens on every request via src/middleware.ts (updateSession)
  - JWT expiry: 3600 seconds (1 hour); refresh token expiry: 7 days
  - Session is invalidated on signOut() — cookie cleared server-side

Password security:
  - Passwords hashed with bcrypt (Supabase Auth default, cost factor 10)
  - Plaintext passwords never logged, never returned, never stored
  - Password strength validated client-side AND enforced as a Zod rule
  - No password is stored in any application-level table

OAuth security:
  - PKCE flow used by Supabase Auth for all OAuth providers (not implicit flow)
  - State parameter validated by Supabase — prevents CSRF on OAuth callback
  - Only whitelisted redirect URIs accepted; wildcard URIs are prohibited
  - OAuth tokens are exchanged server-side in /auth/callback/route.ts

Token security:
  - OTP tokens are single-use and expire in 1 hour
  - Recovery tokens from password reset emails are single-use
  - Invitation tokens are scoped to the invited email — cannot be used by another address
  - All token verification calls use server-side Supabase client (not browser client)

Anti-enumeration:
  - Login error always returns "Incorrect email or password" — never distinguishes
  - Forgot password always returns success message regardless of email existence
  - Registration success/error does not reveal whether an email is already registered
    (Supabase shows a generic "User already registered" only after OTP confirmation attempt)

Rate limiting:
  - Supabase Auth enforces built-in rate limits on all auth endpoints
  - 5 failed login attempts → 15-minute lockout (Supabase default)
  - Password reset: max 1 email per 60 seconds per address
  - Resend verification: enforced client-side (60s cooldown) and server-side by Supabase

enrich-profile Edge Function:
  - Uses service role key (server-only, in Deno.env — never in src/)
  - Validates the user JWT before accepting any payload
  - Payload is validated with Zod before any database write
  - Cannot be called without a valid authenticated session
```

---

## State Management

**`src/stores/auth-store.ts`** — Zustand store for global auth state available to all Client Components:

```typescript
import { create } from 'zustand'
import type { User, Session } from '@supabase/supabase-js'
import type { Tables } from '@/types/database'

interface AuthStore {
  user:       User | null
  session:    Session | null
  profile:    Tables<'profiles'> | null
  isLoading:  boolean
  setUser:    (user: User | null) => void
  setSession: (session: Session | null) => void
  setProfile: (profile: Tables<'profiles'> | null) => void
  setLoading: (loading: boolean) => void
  clear:      () => void
}

export const useAuthStore = create<AuthStore>((set) => ({
  user:       null,
  session:    null,
  profile:    null,
  isLoading:  true,
  setUser:    (user)    => set({ user }),
  setSession: (session) => set({ session }),
  setProfile: (profile) => set({ profile }),
  setLoading: (isLoading) => set({ isLoading }),
  clear: () => set({ user: null, session: null, profile: null, isLoading: false }),
}))
```

**`src/hooks/use-auth.ts`** — convenience hook that hydrates the auth store from Supabase:

```typescript
'use client'

import { useEffect } from 'react'
import { useAuthStore } from '@/stores/auth-store'
import { useSupabase } from './use-supabase'

export function useAuth() {
  const supabase  = useSupabase()
  const store     = useAuthStore()

  useEffect(() => {
    // Initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      store.setSession(session)
      store.setUser(session?.user ?? null)
      store.setLoading(false)
    })

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        store.setSession(session)
        store.setUser(session?.user ?? null)
      }
    )
    return () => subscription.unsubscribe()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return {
    user:      store.user,
    session:   store.session,
    profile:   store.profile,
    isLoading: store.isLoading,
    isAuthenticated: !!store.user,
  }
}
```

**`src/hooks/use-session.ts`** — server-side session accessor for Server Components:

```typescript
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function getSession() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function requireSession() {
  const user = await getSession()
  if (!user) redirect('/login')
  return user
}

export async function requireProfile() {
  const user = await requireSession()
  const supabase = await createClient()
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()
  if (!profile) redirect('/login')
  return { user, profile }
}
```

---

## Development Tasks

### Task 4.1 — Auth Route Group Layout

Create `src/app/(auth)/layout.tsx`. This layout renders no navigation (no sidebar, no topnav) — only the `AuthLayout` wrapper and the `Providers` component.

```typescript
import { Providers } from '@/components/layout/providers'

export default function AuthRootLayout({ children }: { children: React.ReactNode }) {
  return <Providers>{children}</Providers>
}
```

---

### Task 4.2 — OAuth Callback Route

Create `src/app/(auth)/auth/callback/route.ts`:

```typescript
import { createClient } from '@/lib/supabase/server'
import { NextResponse, type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code  = searchParams.get('code')
  const next  = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=oauth_failed`)
}
```

---

### Task 4.3 — Login Page and Form

Implement `src/app/(auth)/login/page.tsx` and `src/components/modules/auth/login-form.tsx`.

The form calls `supabase.auth.signInWithPassword()` on submit. On success, reads the user's profile role from `profiles` and redirects to the correct workspace root (`/dashboard`, `/vendor/dashboard`, or `/admin/dashboard`). On error, displays an inline `Alert` component with the mapped error message.

---

### Task 4.4 — Company and Vendor Registration Pages

Implement both registration pages and their form components. Both share the same `RegisterForm` component; the `role` prop (`'company_user'` | `'vendor_user'`) determines the behavior.

Registration flow:
1. Submit form → `supabase.auth.signUp({ email, password, options: { data: { full_name } } })`
2. On success → show Step 2 (email verification prompt)
3. User clicks link in email → `/verify-email` page triggers OTP verification
4. On OTP success → call `enrich-profile` Edge Function with role and full_name
5. Redirect to onboarding wizard (Phase 5 implements the wizard; Phase 4 redirects to a stub)

---

### Task 4.5 — Verify Email Page

Implement `src/app/(auth)/verify-email/page.tsx`. Reads `token_hash` and `type` from URL search params on mount (Supabase appends these to the redirect URL from the confirmation email).

```typescript
// Supabase sends: /verify-email?token_hash=xxx&type=signup
const token_hash = searchParams.get('token_hash')
const type       = searchParams.get('type') as 'signup' | 'recovery' | 'invite'

if (token_hash && type) {
  const { error } = await supabase.auth.verifyOtp({ token_hash, type })
  // handle result
}
```

---

### Task 4.6 — Forgot Password and Reset Password Pages

Implement both pages. The reset password page reads the access token from the URL hash (Supabase appends `#access_token=...` to the reset link). Call `supabase.auth.setSession()` with the token before calling `supabase.auth.updateUser({ password: newPassword })`.

---

### Task 4.7 — Accept Invite Page

Implement the accept invite page. Reads the `token_hash` and `type=invite` from the URL. Verifies the OTP, sets the password, and redirects to the correct workspace dashboard. Full wiring to workspace membership happens in Phase 7.

---

### Task 4.8 — Middleware Workspace-Type Enforcement

Extend `src/middleware.ts` to enforce workspace-type routing after session validation:

```typescript
// After confirming user is authenticated, read profile role
const { data: profile } = await supabase
  .from('profiles')
  .select('role')
  .eq('id', user.id)
  .single()

const role = profile?.role

if (pathname.startsWith('/admin') && role !== 'platform_admin') {
  return NextResponse.redirect(new URL('/dashboard', request.url))
}
if (pathname.startsWith('/vendor') && role === 'company_user') {
  return NextResponse.redirect(new URL('/dashboard', request.url))
}
if (!pathname.startsWith('/vendor') && !pathname.startsWith('/admin') && role === 'vendor_user') {
  return NextResponse.redirect(new URL('/vendor/dashboard', request.url))
}
```

---

### Task 4.9 — Auth Store Hydration in Root Layout

Wire `useAuth()` into a client component `AuthProvider` that lives inside `Providers`. This ensures the auth store is populated on app load without blocking the initial render.

---

### Task 4.10 — Wire WorkspaceSwitcher to Real Auth Data

Replace the stub data in `WorkspaceSwitcher` (from Phase 2) with real data from `useAuth()`. The switcher now shows the authenticated user's actual workspace name and type.

---

## Testing Checklist

```
✓ Email registration: new company user can sign up, receives confirmation email
✓ Email registration: new vendor user can sign up, receives confirmation email
✓ Email verification: clicking confirmation link verifies user and redirects correctly
✓ Email verification: expired link shows error state with resend option
✓ Login: valid credentials log in and redirect to correct workspace dashboard
✓ Login: invalid credentials show "Incorrect email or password" (not which field is wrong)
✓ Login: unverified user cannot log in (Supabase blocks session creation)
✓ Google OAuth: clicking "Continue with Google" initiates OAuth flow
✓ Google OAuth: callback route exchanges code for session and redirects correctly
✓ Google OAuth: company registration origin sets role = 'company_user'
✓ Google OAuth: vendor registration origin sets role = 'vendor_user'
✓ Forgot password: submitting any email returns success message
✓ Forgot password: valid email receives reset link
✓ Reset password: valid token allows password update and redirects to login
✓ Reset password: expired token shows error with link to /forgot-password
✓ Sign out: session cookie is cleared; subsequent request redirects to /login
✓ Middleware: unauthenticated request to /dashboard redirects to /login
✓ Middleware: company_user accessing /vendor/* is redirected to /dashboard
✓ Middleware: vendor_user accessing /dashboard/* is redirected to /vendor/dashboard
✓ Middleware: non-admin accessing /admin/* is redirected to their workspace root
✓ Auth store: useAuth() returns user and profile after login
✓ Auth store: useAuth() returns null after sign out
✓ WorkspaceSwitcher: shows authenticated user's real workspace name
✓ Password strength bar: updates correctly as password is typed
✓ Session persistence: page refresh maintains session without redirect to login
✓ httpOnly cookie: auth token not accessible via document.cookie in browser console
✓ enrich-profile Edge Function: role and full_name written to profiles table after registration
✓ profiles: handle_new_user trigger creates profile row on signup
✓ Accessibility: all auth forms keyboard navigable; ARIA labels correct; error messages announced
✓ Mobile: all auth screens render correctly at 375px viewport width
✓ pnpm build: no TypeScript errors introduced by Phase 4 code
✓ pnpm lint: zero warnings
```

---

## Acceptance Criteria

```
AC-4.1   Company registration creates auth.users entry and profiles row with role = 'company_user'
AC-4.2   Vendor registration creates auth.users entry and profiles row with role = 'vendor_user'
AC-4.3   Email verification OTP verified successfully; enrich-profile sets role in user_metadata
AC-4.4   Google OAuth login creates session; callback route handles code exchange correctly
AC-4.5   Login with valid credentials creates httpOnly cookie session; redirects to correct dashboard
AC-4.6   Login with invalid credentials shows generic error; does not reveal which field is wrong
AC-4.7   Forgot password form returns success message regardless of email existence
AC-4.8   Password reset link allows user to set new password; old password no longer works
AC-4.9   Sign out clears session cookie; all subsequent protected requests redirect to /login
AC-4.10  Middleware correctly enforces workspace-type routing for all three role types
AC-4.11  Auth store populated on page load; isLoading transitions to false after session check
AC-4.12  Password strength bar renders on registration and reset forms; reflects real-time strength
AC-4.13  Accept invite page renders with pre-filled email from token; sets password on submission
AC-4.14  All auth forms pass axe-core accessibility scan with zero violations
AC-4.15  Session persists across browser refresh; no unnecessary redirects on reload
```

---

## Definition of Done

Phase 4 is complete when all Acceptance Criteria above are met AND:

- [ ] All TypeScript checks pass (zero errors)
- [ ] All ESLint checks pass (zero warnings)
- [ ] All Prettier checks pass
- [ ] Email registration → verification → dashboard flow tested end-to-end
- [ ] Google OAuth flow tested end-to-end (local + staging)
- [ ] Middleware workspace-type routing tested for all three roles
- [ ] httpOnly cookie verified: not accessible via JavaScript in browser console
- [ ] enrich-profile Edge Function deployed to local and staging Supabase
- [ ] Migration 0005 applied and committed
- [ ] Auth store and hooks tested: correct state on login, refresh, and logout
- [ ] PR merged to `develop` with at least 1 reviewer approval
- [ ] `feature/04-authentication` branch merged and deleted

---

## Risk Factors

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Google OAuth redirect URI mismatch between local and staging | High | Medium | Maintain separate redirect URIs per environment; document in README |
| handle_new_user trigger failing silently on signup | Low | High | Test trigger manually in Supabase Studio; add error logging to trigger function |
| enrich-profile Edge Function called before OTP verification completes | Medium | Medium | Only call enrich-profile from the verify-email page, after verifyOtp() resolves successfully |
| Middleware DB query on every request causing latency | Medium | Medium | Cache profile role in JWT user_metadata via enrich-profile; read from JWT in middleware instead of DB |
| OAuth state not persisting across redirect (company vs vendor origin) | Medium | Medium | Store registration origin in sessionStorage before OAuth redirect; read on callback |
| Reset password link used on wrong device/browser | Low | Low | Supabase handles this — token is single-use and bound to the session |

---

## Best Practices

- Never use `supabase.auth.getSession()` for authorization decisions on the server — always use `supabase.auth.getUser()` which validates the JWT against Supabase's server
- Store the user's role in `user_metadata` via the `enrich-profile` Edge Function so middleware can read it from the JWT without a database query on every request
- Always call `updateSession()` in middleware before reading any user data — stale sessions cause inconsistent auth state
- Keep auth form error messages generic to prevent user enumeration attacks
- Test all auth flows against the staging Supabase project before merging to `develop` — local Supabase and remote Supabase can have subtle behavioral differences with OAuth

---

## Estimated Completion

**4–5 working days** for a developer familiar with Supabase Auth and Next.js App Router. Allow an extra day if Google OAuth configuration is being set up for the first time in the Google Cloud Console.

---

---

# PHASE 5 — COMPANY WORKSPACE

---

## Overview

| Field | Value |
|---|---|
| Phase Number | 5 |
| Phase Name | Company Workspace |
| Milestone | M2 — Authentication & Workspace |
| PRD Reference | Module 2 — Company Workspace & Onboarding |
| DESIGN Reference | Section 2 (Onboarding Wizard), Section 3 (Settings), F01, F03 |
| Estimated Duration | 4–5 days |
| Prerequisite Phases | Phase 1, Phase 2, Phase 3, Phase 4 |

---

## Purpose

Phase 5 implements the company workspace creation and onboarding flow, and all company-level settings screens. After a company user verifies their email (Phase 4), they are directed to a multi-step onboarding wizard that captures their company details, configures their workspace, and leaves them at the company dashboard with a complete, operational workspace.

This phase also builds all company profile and settings pages so workspace administrators can update their company information, configure preferences, and manage their subscription plan at any point after onboarding.

---

## Business Goal

A company that cannot complete setup is a company that never activates. The onboarding wizard is the highest-leverage UX moment in VendorFlow — it converts a registered user into an active workspace. Every step is designed to be completable in under 5 minutes, with optional fields clearly marked. A partial completion state is supported so users can finish onboarding across sessions without losing progress.

---

## Dependencies

- Phase 4 complete (authenticated user with `company_user` role, profiles table populated)
- Phase 3 `companies` table with RLS policies in place
- Phase 3 `create-company` Edge Function stub (implemented fully here)
- Phase 2 `FormSection`, `PageHeader`, `Sidebar`, shell layout components

---

## Database Tables

Phase 5 writes to the `companies` table (created in Phase 3) and adds one new table for tracking onboarding progress.

**`companies` table** — columns populated during Phase 5:

| Column | Populated by | When |
|---|---|---|
| `id` | `create-company` Edge Function | Onboarding step 1 submission |
| `name` | Onboarding wizard | Step 1 |
| `slug` | Auto-generated from name | Step 1 (server-side) |
| `legal_name` | Onboarding wizard | Step 2 (optional) |
| `gstin` | Onboarding wizard | Step 2 (optional) |
| `pan` | Onboarding wizard | Step 2 (optional) |
| `industry` | Onboarding wizard | Step 1 |
| `company_size` | Onboarding wizard | Step 1 |
| `website` | Onboarding wizard | Step 2 (optional) |
| `logo_url` | Logo upload | Step 3 (optional) |
| `address_*` | Onboarding wizard | Step 2 |
| `phone` | Onboarding wizard | Step 2 |
| `email` | Onboarding wizard | Step 2 |
| `subscription_plan` | Always `'free'` initially | Default value |
| `subscription_status` | Always `'active'` initially | Default value |
| `onboarding_complete` | Set to `true` | Step 4 completion |

**New table: `onboarding_progress`** — migration `0006_create_onboarding_progress.sql`:

```sql
create table public.onboarding_progress (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  workspace_type  text not null check (workspace_type in ('company', 'vendor')),
  current_step    integer not null default 1 check (current_step between 1 and 4),
  completed_steps integer[] not null default array[]::integer[],
  form_data       jsonb not null default '{}'::jsonb,
  completed_at    timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint onboarding_progress_user_workspace_unique unique (user_id, workspace_type)
);

create index idx_onboarding_progress_user_id on public.onboarding_progress(user_id);

create trigger trg_onboarding_progress_updated_at
  before update on public.onboarding_progress
  for each row execute function public.handle_updated_at();

alter table public.onboarding_progress enable row level security;

create policy "onboarding_progress_own"
  on public.onboarding_progress for all
  using (user_id = auth.uid());
```

---

## Relationships

```
auth.users
  └── public.profiles
        └── public.companies (N:1, company_id FK → companies.id)
              └── Updated by create-company Edge Function with workspace data

auth.users
  └── public.onboarding_progress (1:1, user_id FK → auth.users.id)
        Tracks wizard state; deleted after onboarding completes
```

---

## API Endpoints

| Operation | Method | Implementation | Notes |
|---|---|---|---|
| Create company workspace | Edge Function | `create-company` | Service role; creates company row + updates profile.company_id |
| Get company profile | Server Component | `supabase.from('companies').select()` | RLS ensures own company only |
| Update company profile | Client mutation | `supabase.from('companies').update()` | RLS enforces ownership |
| Upload company logo | Client | `supabase.storage.from('company-logos').upload()` | Returns public URL stored in companies.logo_url |
| Save onboarding progress | Client | `supabase.from('onboarding_progress').upsert()` | Persists wizard state between sessions |
| Get onboarding progress | Server Component | `supabase.from('onboarding_progress').select()` | Resumes wizard at correct step |
| Complete onboarding | Edge Function | `complete-onboarding` | Sets companies.onboarding_complete = true; deletes onboarding_progress row |
| Get workspace context | Server Component | `requireProfile()` from use-session.ts | Used in all dashboard layouts |

**`supabase/functions/create-company/index.ts`** (full implementation replacing Phase 3 stub):

```typescript
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { handleCors } from '../_shared/cors.ts'
import { getAuthenticatedUser } from '../_shared/auth.ts'
import { errorResponse } from '../_shared/error.ts'
import { successResponse } from '../_shared/response.ts'

interface CreateCompanyPayload {
  name:         string
  industry:     string
  company_size: string
}

Deno.serve(async (req) => {
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse

  try {
    const { user } = await getAuthenticatedUser(req)
    const payload: CreateCompanyPayload = await req.json()

    if (!payload.name?.trim()) throw new Error('Company name is required')

    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Generate slug from company name
    const slug = payload.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')

    // Check slug uniqueness; append random suffix if taken
    const { data: existing } = await adminClient
      .from('companies')
      .select('id')
      .eq('slug', slug)
      .maybeSingle()

    const finalSlug = existing
      ? `${slug}-${Math.random().toString(36).slice(2, 6)}`
      : slug

    // Create company
    const { data: company, error: companyError } = await adminClient
      .from('companies')
      .insert({
        name:         payload.name.trim(),
        slug:         finalSlug,
        industry:     payload.industry,
        company_size: payload.company_size,
      })
      .select()
      .single()

    if (companyError) throw companyError

    // Link company to user profile
    const { error: profileError } = await adminClient
      .from('profiles')
      .update({ company_id: company.id })
      .eq('id', user.id)

    if (profileError) throw profileError

    return successResponse({ company_id: company.id, slug: finalSlug })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return errorResponse(message, 400)
  }
})
```

---

## Supabase Services Used

```
Supabase Database:
  - public.companies         — created and updated during onboarding and settings
  - public.profiles          — company_id set after company creation
  - public.onboarding_progress — wizard state persistence

Supabase Storage:
  - company-logos bucket     — logo upload during onboarding Step 3 and settings

Supabase Edge Functions:
  - create-company           — creates company record with service role
  - complete-onboarding      — marks onboarding complete, cleans up progress row

Supabase Auth:
  - Not directly used in this phase beyond session reads
```

---

## Folder Structure

```
src/
├── app/
│   ├── onboarding/
│   │   ├── layout.tsx                      [Onboarding shell layout — no sidebar]
│   │   └── page.tsx                        [Wizard host page]
│   └── (dashboard)/
│       └── settings/
│           ├── page.tsx                    [Settings root — redirects to /settings/company]
│           ├── company/
│           │   └── page.tsx                [Company profile settings]
│           ├── workspace/
│           │   └── page.tsx                [Workspace preferences]
│           └── subscription/
│               └── page.tsx                [Subscription & plan (stub for Phase 29)]
├── components/
│   └── modules/
│       └── workspace/
│           ├── onboarding-wizard.tsx
│           ├── onboarding-step-indicator.tsx
│           ├── step-company-basics.tsx
│           ├── step-company-details.tsx
│           ├── step-logo-upload.tsx
│           ├── step-finish.tsx
│           ├── company-profile-form.tsx
│           ├── logo-uploader.tsx
│           ├── workspace-settings-form.tsx
│           └── index.ts
├── hooks/
│   └── use-workspace.ts
└── stores/
    └── workspace-store.ts
```

---

## UI Screens

### Screen 5.1 — Onboarding Wizard (`/onboarding`)

**Layout:** Full-screen, no sidebar. Centered content panel `max-w-2xl`. Step indicator at top showing 4 steps with connecting line.

**Step 1 — Company Basics:**
- Heading: "Tell us about your company"
- Company name input (required)
- Industry select (dropdown from predefined list)
- Company size select (1–10, 11–50, 51–200, 201–1000, 1000+)
- "Continue" button

**Step 2 — Company Details:**
- Heading: "Add your company details"
- Legal name input (optional)
- GSTIN input (optional, with format hint)
- PAN input (optional)
- Phone input
- Business email input
- Address line 1, Address line 2, City, State, Pincode selects/inputs
- Website input (optional)
- "Continue" and "Skip for now" buttons

**Step 3 — Logo Upload:**
- Heading: "Upload your company logo"
- `LogoUploader` component: drag-and-drop zone or click-to-browse
- Accepted formats: JPEG, PNG, WebP, SVG — max 5MB
- Preview shown after upload
- "Continue" and "Skip for now" buttons

**Step 4 — Finish:**
- Heading: "You're all set!"
- Summary card showing company name, industry, and logo
- "Go to Dashboard" button → calls `complete-onboarding` Edge Function → redirects to `/dashboard`

---

### Screen 5.2 — Company Profile Settings (`/settings/company`)

Full `PageHeader` with breadcrumb: Settings → Company Profile.

Sections (each a `FormSection`):
1. **Company Identity** — name, legal name, industry, size, website
2. **Tax & Compliance** — GSTIN, PAN
3. **Contact Information** — phone, email, address fields
4. **Company Logo** — `LogoUploader` component, current logo preview, remove option
5. **Danger Zone** — Delete workspace (modal confirmation, Phase 27 implements full deletion)

---

### Screen 5.3 — Workspace Preferences (`/settings/workspace`)

Sections:
1. **General** — workspace display name, timezone, locale/currency
2. **Notifications** — email notification preferences (full wiring in Phase 21; placeholders here)
3. **Procurement Defaults** — default currency, default payment terms, default delivery lead time

---

### Screen 5.4 — Subscription (`/settings/subscription`)

A read-only stub page showing the current plan as "Free" with a "Upgrade Plan" button placeholder. Full implementation in Phase 29.

---

## Components

### `OnboardingWizard` (`src/components/modules/workspace/onboarding-wizard.tsx`)

Client component that manages wizard state locally and persists it to `onboarding_progress` via Supabase upsert after each step.

```typescript
interface OnboardingWizardProps {
  initialStep?:     number
  initialFormData?: Record<string, unknown>
}
```

State: `currentStep` (1–4), `formData` (accumulated across steps), `isSubmitting`. Advances only when the current step's Zod schema validates. On back navigation, restores previously entered values from `formData`.

### `OnboardingStepIndicator`

Horizontal step tracker showing step numbers, labels, and completion state. Active step is highlighted in `brand-primary`. Completed steps show a checkmark icon.

### `LogoUploader` (`src/components/modules/workspace/logo-uploader.tsx`)

Reusable for both company logos and vendor logos. Handles drag-and-drop, file type validation, size validation, upload progress, and preview.

```typescript
interface LogoUploaderProps {
  bucket:       'company-logos' | 'vendor-logos'
  folder:       string            // workspace id used as folder path
  currentUrl?:  string
  onUpload:     (url: string) => void
  onRemove?:    () => void
}
```

Upload flow: validate client-side → upload to Supabase Storage → get public URL → call `onUpload(url)` → parent saves URL to database.

---

## Forms

### Form 5.1 — Onboarding Step 1: Company Basics

| Field | Type | Validation |
|---|---|---|
| Company name | text input | Required, min 2 chars, max 100 chars, unique slug derived server-side |
| Industry | select | Required, one of predefined industry list |
| Company size | select | Required, one of: 1–10, 11–50, 51–200, 201–1000, 1000+ |

```typescript
const stepOneSchema = z.object({
  name:         z.string().min(2, 'Company name must be at least 2 characters').max(100),
  industry:     z.string().min(1, 'Please select an industry'),
  company_size: z.string().min(1, 'Please select your company size'),
})

const INDUSTRIES = [
  'Manufacturing', 'Retail & E-Commerce', 'Healthcare & Pharma',
  'Construction & Real Estate', 'IT & Software', 'Logistics & Supply Chain',
  'Food & Beverage', 'Automotive', 'Education', 'Financial Services',
  'Agriculture', 'Energy & Utilities', 'Hospitality & Tourism', 'Other',
] as const
```

---

### Form 5.2 — Onboarding Step 2: Company Details

| Field | Type | Validation |
|---|---|---|
| Legal name | text input | Optional, max 200 chars |
| GSTIN | text input | Optional, must match `^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$` if provided |
| PAN | text input | Optional, must match `^[A-Z]{5}[0-9]{4}[A-Z]{1}$` if provided |
| Phone | tel input | Optional, must be a valid Indian mobile/landline number |
| Business email | email input | Optional, valid email format |
| Address line 1 | text input | Optional, max 200 chars |
| Address line 2 | text input | Optional, max 200 chars |
| City | text input | Optional, max 100 chars |
| State | select | Optional, one of 36 Indian states and UTs |
| Pincode | text input | Optional, must match `^[1-9][0-9]{5}$` if provided |
| Website | url input | Optional, must be valid URL if provided |

```typescript
const stepTwoSchema = z.object({
  legal_name:   z.string().max(200).optional(),
  gstin:        z.string().regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, 'Invalid GSTIN format').optional().or(z.literal('')),
  pan:          z.string().regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'Invalid PAN format').optional().or(z.literal('')),
  phone:        z.string().max(15).optional(),
  email:        z.string().email().optional().or(z.literal('')),
  address_line1:z.string().max(200).optional(),
  address_line2:z.string().max(200).optional(),
  city:         z.string().max(100).optional(),
  state:        z.string().optional(),
  pincode:      z.string().regex(/^[1-9][0-9]{5}$/, 'Invalid pincode').optional().or(z.literal('')),
  website:      z.string().url('Must be a valid URL').optional().or(z.literal('')),
})
```

---

### Form 5.3 — Company Profile Settings Form

The settings form reuses the same Zod schemas as the onboarding steps. All fields are pre-populated from the existing `companies` record. Changes are saved with a "Save changes" button that calls `supabase.from('companies').update()`.

Each `FormSection` has its own "Save changes" button and independent save state — partial saves are supported. A success toast confirms each save.

---

### Form 5.4 — Workspace Preferences Form

| Field | Type | Validation |
|---|---|---|
| Display name | text input | Required, min 2 chars, max 100 chars |
| Timezone | select | Required, one of IANA timezone list |
| Locale | select | Required, e.g. en-IN, en-US |
| Default currency | select | Required, e.g. INR, USD |
| Default payment terms | select | Optional: Net 30, Net 60, Net 90, Immediate |
| Default delivery lead time | number input | Optional, 1–365 days |

---

## Tables

Phase 5 does not introduce any list/table UI. All screens are form-based (wizard and settings). The only table-type display is the **Subscription** page which shows a read-only plan comparison table (stub).

---

## Permissions

```
Onboarding wizard (/onboarding):
  - Requires authenticated session (role = 'company_user')
  - If profile.company_id is already set AND companies.onboarding_complete = true:
    redirect to /dashboard (onboarding already done)
  - If profile.company_id is set but onboarding_complete = false:
    resume wizard at onboarding_progress.current_step

Settings pages (/settings/*):
  - Requires authenticated session with role = 'company_user'
  - Requires profile.company_id to be set (workspace must exist)
  - Only workspace admins can update company profile (enforced in Phase 6)
    In Phase 5: any company_user can update (simplified until IAM is built)

RLS enforcement:
  - companies: UPDATE policy requires id = get_my_company_id()
  - onboarding_progress: all operations require user_id = auth.uid()
```

---

## Validation Rules

```
Company name:
  - 2–100 characters
  - Slug derived from name must be unique — enforced by unique constraint on companies.slug
  - Leading/trailing whitespace trimmed server-side

GSTIN:
  - 15-character alphanumeric string following GST format
  - Pattern: 2-digit state code + 10-char PAN + entity number + Z + checksum
  - Validated client-side with Zod regex; server-side by Edge Function

PAN:
  - 10-character alphanumeric: AAAAA9999A pattern
  - First 3: series letters, 4th: entity type, 5th: surname initial, 4 digits, 1 letter

Pincode:
  - 6-digit Indian postal code, first digit not zero

Logo upload:
  - Accepted MIME types: image/jpeg, image/png, image/webp, image/svg+xml
  - Maximum file size: 5MB
  - Minimum dimensions: 100×100px (soft warning, not a hard block)
  - Validated client-side before upload; Supabase Storage enforces MIME and size server-side
```

---

## Business Rules

```
BR-5.1  Company workspace creation happens via the create-company Edge Function using
        the service role key — never directly from the client — so the profile.company_id
        can be set atomically in the same transaction.

BR-5.2  A user can only create one company workspace. If profile.company_id is already
        set, the create-company Edge Function returns a 409 Conflict error.

BR-5.3  The onboarding wizard saves progress to onboarding_progress after every step.
        If the user closes the browser, they resume at the correct step on their next login.

BR-5.4  Steps 2 and 3 of the onboarding wizard are skippable. Step 1 (company name,
        industry, size) is mandatory before the wizard can advance.

BR-5.5  The company slug is automatically derived from the company name and is used
        for internal routing and API identification. Users cannot set the slug directly.
        If the derived slug is taken, a 4-character random suffix is appended.

BR-5.6  After the wizard is completed, onboarding_progress is deleted and
        companies.onboarding_complete is set to true. The wizard is never shown again
        for this workspace.

BR-5.7  Logo removal sets companies.logo_url to null. The WorkspaceSwitcher falls back
        to initials when logo_url is null.

BR-5.8  Workspace preferences (timezone, currency, payment terms) affect default values
        across procurement forms throughout the application. They are not enforced as
        hard constraints — individual records can override defaults.
```

---

## Security

```
Company creation:
  - create-company Edge Function uses service role key — never exposed to client
  - User JWT validated by getAuthenticatedUser() before any database write
  - Payload validated with Zod before insert — no raw client data inserted directly
  - Slug uniqueness enforced by DB unique constraint, not just application logic
  - profile.company_id is set by the Edge Function with service role — a client
    cannot associate themselves with an arbitrary company_id

Onboarding progress:
  - RLS policy restricts all operations to user_id = auth.uid()
  - form_data stored as JSONB — contains only form field values, no secrets
  - Progress row deleted after onboarding completes — no orphaned sensitive data

Logo uploads:
  - Folder path: company-logos/[company_id]/logo.[ext]
  - Client can only write to their own company_id folder (Storage RLS policy)
  - MIME type and file size enforced by Supabase Storage bucket configuration
  - Client-provided content-type is not trusted — Supabase validates against bucket allowed_mime_types
  - SVG uploads are accepted for logos only (not in other buckets) — no script execution
    risk as Supabase Storage serves files with content-disposition: attachment by default

Settings updates:
  - companies UPDATE RLS policy: id = get_my_company_id()
  - A user cannot update another company's record even with a crafted request
  - All inputs re-validated with Zod on the client before submission
  - GSTIN and PAN values are stored but not used for any financial operations in v1
```

---

## State Management

**`src/stores/workspace-store.ts`** — Zustand store for the active workspace context:

```typescript
import { create } from 'zustand'
import type { Tables } from '@/types/database'

interface WorkspaceStore {
  company:    Tables<'companies'> | null
  isLoading:  boolean
  setCompany: (company: Tables<'companies'> | null) => void
  setLoading: (loading: boolean) => void
  clear:      () => void
}

export const useWorkspaceStore = create<WorkspaceStore>((set) => ({
  company:    null,
  isLoading:  true,
  setCompany: (company)    => set({ company }),
  setLoading: (isLoading)  => set({ isLoading }),
  clear:      ()           => set({ company: null, isLoading: false }),
}))
```

**`src/hooks/use-workspace.ts`** — fetches and caches the current company record:

```typescript
'use client'

import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/auth-store'
import { useSupabase } from './use-supabase'

export function useWorkspace() {
  const supabase  = useSupabase()
  const profile   = useAuthStore((s) => s.profile)

  return useQuery({
    queryKey: ['company', profile?.company_id],
    queryFn: async () => {
      if (!profile?.company_id) return null
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('id', profile.company_id)
        .single()
      if (error) throw error
      return data
    },
    enabled: !!profile?.company_id,
    staleTime: 5 * 60 * 1000,
  })
}
```

The `useWorkspace()` hook is called in the `(dashboard)/layout.tsx` to hydrate the `WorkspaceSwitcher` with real company data.

---

## Development Tasks

### Task 5.1 — Onboarding Layout and Route Guard

Create `src/app/onboarding/layout.tsx` — a minimal layout with no sidebar, just centered content and `Providers`. Add a route guard: if `profile.company_id` is set and `onboarding_complete` is true, redirect to `/dashboard`.

### Task 5.2 — Onboarding Wizard Page

Implement `src/app/onboarding/page.tsx` as a Server Component that fetches `onboarding_progress` for the current user. Passes `initialStep` and `initialFormData` as props to the `OnboardingWizard` client component.

### Task 5.3 — Onboarding Step Components

Implement all four step components. Each step component owns its own `react-hook-form` instance scoped to its Zod schema. On "Continue", it validates, then calls the parent wizard's `onStepComplete(stepData)` callback. The wizard merges `stepData` into `formData` and upserts to `onboarding_progress`.

### Task 5.4 — create-company Edge Function

Deploy the full `create-company` Edge Function (specified in API Endpoints section) to local and staging Supabase. Test that it creates the company, sets the slug, and updates `profile.company_id` atomically.

### Task 5.5 — complete-onboarding Edge Function

Create `supabase/functions/complete-onboarding/index.ts`. Validates user JWT, sets `companies.onboarding_complete = true`, and deletes the `onboarding_progress` row for this user.

### Task 5.6 — LogoUploader Component

Implement `LogoUploader` with drag-and-drop support (`react-dropzone` is not installed — implement using native HTML drag events and `<input type="file">`). Shows upload progress via Supabase Storage `onUploadProgress` callback.

### Task 5.7 — Company Profile Settings Page

Implement `/settings/company` as a Server Component that fetches the company record and passes it as initial values to the `CompanyProfileForm` client component. The form upserts on save. On success, invalidates the `['company', company_id]` TanStack Query key.

### Task 5.8 — Workspace Preferences Settings Page

Implement `/settings/workspace` with the workspace preferences form. Preferences stored as JSON in a new column `workspace_preferences jsonb` added to `companies` via migration `0007_add_workspace_preferences.sql`:

```sql
-- Migration: 0007_add_workspace_preferences
alter table public.companies
  add column if not exists workspace_preferences jsonb not null default '{}'::jsonb;
```

### Task 5.9 — Onboarding Redirect After Verification

Update the `verify-email` page (Phase 4) to redirect to `/onboarding` after successful OTP verification instead of `/dashboard`. After onboarding completes, the `complete-onboarding` function redirects to `/dashboard`.

### Task 5.10 — Wire WorkspaceSwitcher with Real Data

Update `(dashboard)/layout.tsx` to call `requireProfile()`, pass company data to the layout, and hydrate the `WorkspaceSwitcher` with the real company name, logo, and plan.

---

## Testing Checklist

```
✓ Email-verified user lands on /onboarding after verification (not /dashboard)
✓ Onboarding Step 1: company name, industry, size are required; form blocks advance without them
✓ Onboarding Step 1: create-company Edge Function creates company row and sets profile.company_id
✓ Onboarding Step 1: duplicate company name generates unique slug with suffix
✓ Onboarding Step 2: GSTIN validation rejects malformed values; accepts valid 15-char GSTIN
✓ Onboarding Step 2: PAN validation rejects malformed values; accepts valid 10-char PAN
✓ Onboarding Step 2: "Skip for now" advances wizard without saving step 2 fields
✓ Onboarding Step 3: logo upload accepts JPEG, PNG, WebP, SVG; rejects PDF and text files
✓ Onboarding Step 3: file > 5MB is rejected with a clear error message before upload starts
✓ Onboarding Step 3: uploaded logo appears as preview; public URL saved to companies.logo_url
✓ Onboarding Step 4: "Go to Dashboard" calls complete-onboarding and redirects to /dashboard
✓ Onboarding resume: closing browser mid-wizard and re-logging shows wizard at correct step
✓ Onboarding guard: authenticated user with onboarding_complete = true is redirected to /dashboard
✓ Company profile settings: all fields pre-populated from existing companies record
✓ Company profile settings: save updates companies table; success toast displayed
✓ Company profile settings: invalid GSTIN in settings form shows inline validation error
✓ Logo uploader: removing logo sets companies.logo_url to null; WorkspaceSwitcher shows initials
✓ WorkspaceSwitcher: shows real company name and logo from authenticated workspace
✓ Workspace preferences: timezone and currency saved; values persisted on page refresh
✓ Subscription page: renders read-only plan info without errors (stub)
✓ RLS: user cannot update another company's record (verified with direct Supabase query test)
✓ onboarding_progress: row deleted after complete-onboarding runs
✓ Migration 0006: onboarding_progress table exists with correct columns and RLS
✓ Migration 0007: workspace_preferences column added to companies
✓ pnpm build: no TypeScript errors
✓ pnpm lint: zero warnings
✓ All onboarding screens pass axe-core accessibility scan
✓ All settings forms keyboard navigable; labels correctly associated with inputs
```

---

## Acceptance Criteria

```
AC-5.1   Verified company user is redirected to /onboarding; existing workspace redirects to /dashboard
AC-5.2   Onboarding Step 1 creates company record via Edge Function; profile.company_id updated
AC-5.3   Slug uniqueness enforced; duplicate names receive auto-suffix
AC-5.4   GSTIN and PAN validated client-side with correct regex patterns
AC-5.5   Onboarding progress persisted to onboarding_progress table after each step
AC-5.6   Wizard resumes at correct step after browser close and re-login
AC-5.7   Logo upload stores file in company-logos/[company_id]/ and saves public URL
AC-5.8   complete-onboarding sets onboarding_complete = true; deletes progress row
AC-5.9   Company profile settings form pre-populated; saves update companies table
AC-5.10  Workspace preferences saved to workspace_preferences JSONB column
AC-5.11  WorkspaceSwitcher shows real company name, logo, and plan from workspace context
AC-5.12  RLS verified: user cannot read or update another workspace's company record
AC-5.13  All onboarding and settings screens accessible at correct routes without errors
```

---

## Definition of Done

Phase 5 is complete when all Acceptance Criteria above are met AND:

- [ ] All TypeScript checks pass (zero errors)
- [ ] All ESLint checks pass (zero warnings)
- [ ] All Prettier checks pass
- [ ] Full onboarding flow tested end-to-end: registration → verification → wizard → dashboard
- [ ] Wizard resume tested: mid-wizard browser close → re-login → wizard resumes correctly
- [ ] Logo upload and removal tested; Storage RLS verified
- [ ] create-company and complete-onboarding Edge Functions deployed to staging
- [ ] Migrations 0006 and 0007 applied and committed
- [ ] WorkspaceSwitcher populated with real data in dashboard layout
- [ ] PR merged to `develop` with at least 1 reviewer approval
- [ ] `feature/05-company-workspace` branch merged and deleted

---

## Risk Factors

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| create-company Edge Function called multiple times by rapid double-click | Medium | Medium | Add idempotency check: if profile.company_id already set, return 409 before insert |
| Wizard formData growing large with JSONB blob over many steps | Low | Low | Keep form_data schema minimal; only store field values, not UI state |
| Logo upload failing on slow connections leaving logo_url null | Low | Medium | Show upload progress indicator; only close wizard step after onUpload() confirms URL |
| Slug collision on a very popular company name | Low | Low | Random 4-char suffix handles this; add retry loop in Edge Function for up to 3 attempts |
| onboarding_progress row not deleted if complete-onboarding fails | Low | Low | Idempotent complete-onboarding: if onboarding_complete already true, still attempt cleanup |
| Workspace preferences JSONB growing unpredictably over time | Low | Low | Define a strict TypeScript type for the JSONB shape and validate with Zod on read/write |

---

## Best Practices

- Treat the onboarding wizard as the most important UX flow in the product — every friction point costs activations. Keep step counts low and skippable fields clearly marked
- The `create-company` Edge Function is the authoritative source of company creation — never bypass it with a direct client insert, even in tests
- Regenerate `database.ts` types after migrations 0006 and 0007 and commit in the same PR
- Test the `complete-onboarding` function for idempotency: calling it twice should not error
- Validate uploaded images client-side (type, size) before starting the upload to avoid wasted network requests and confusing error messages mid-upload

---

## Estimated Completion

**4–5 working days** for a single developer. The onboarding wizard multi-step state management and Edge Function integration are the most time-intensive parts.

---

---

# PHASE 6 — IAM (ROLES & PERMISSIONS)

---

## Overview

| Field | Value |
|---|---|
| Phase Number | 6 |
| Phase Name | IAM (Roles & Permissions) |
| Milestone | M2 — Authentication & Workspace |
| PRD Reference | Module 3 — Identity & Access Management |
| DESIGN Reference | Section 3 (Settings — Roles), F01, F03 |
| Estimated Duration | 4–5 days |
| Prerequisite Phases | Phase 1, Phase 2, Phase 3, Phase 4, Phase 5 |

---

## Purpose

Phase 6 implements the complete Identity and Access Management (IAM) layer for VendorFlow. It defines a flexible, company-scoped RBAC (Role-Based Access Control) system with customizable roles, a granular permission matrix, and a runtime permission engine that gates all UI elements and API operations.

Every subsequent phase (Phases 7–30) gates its features through this permission engine. Phase 6 must be complete before any module-level access control can be enforced.

---

## Business Goal

Enterprise procurement platforms handle sensitive financial data and multi-stakeholder workflows. A company must be able to define who can create purchase requests, who can approve them, who can release payments, and who can view analytics — with precision. Without IAM, every user has full access, which is a compliance and financial control failure. Phase 6 makes VendorFlow enterprise-ready from the ground up.

---

## Dependencies

- Phase 5 complete (company workspace exists; `companies` table populated with `company_id`)
- Phase 4 complete (authenticated user, `profiles` table, `role` field)
- Phase 2 `DataTable`, `PageHeader`, `StatusBadge`, `EmptyState` components
- Phase 3 RLS helper functions (`get_my_company_id()`, `is_platform_admin()`)

---

## Database Tables

Migration: `0008_create_iam_tables.sql`

```sql
-- ============================================================
-- Migration: 0008_create_iam_tables
-- Description: Roles, permissions, and user-role assignments
-- ============================================================

-- ── ROLES ────────────────────────────────────────────────────
create table public.roles (
  id           uuid primary key default gen_random_uuid(),
  company_id   uuid not null references public.companies(id) on delete cascade,
  name         text not null,
  description  text,
  is_system    boolean not null default false,  -- system roles cannot be deleted
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  constraint roles_company_name_unique unique (company_id, name)
);

create index idx_roles_company_id on public.roles(company_id);

create trigger trg_roles_updated_at
  before update on public.roles
  for each row execute function public.handle_updated_at();

-- ── PERMISSIONS ───────────────────────────────────────────────
-- Permissions are a fixed catalog — not created per company.
-- They are seeded once and referenced by roles.
create table public.permissions (
  id          uuid primary key default gen_random_uuid(),
  module      text not null,    -- e.g. 'procurement', 'vendors', 'finance'
  action      text not null,    -- e.g. 'create', 'read', 'update', 'delete', 'approve'
  resource    text not null,    -- e.g. 'purchase_request', 'rfq', 'invoice'
  label       text not null,    -- human-readable, e.g. 'Create Purchase Requests'
  description text,
  constraint permissions_unique unique (module, action, resource)
);

-- ── ROLE_PERMISSIONS ─────────────────────────────────────────
create table public.role_permissions (
  id            uuid primary key default gen_random_uuid(),
  role_id       uuid not null references public.roles(id) on delete cascade,
  permission_id uuid not null references public.permissions(id) on delete cascade,
  created_at    timestamptz not null default now(),
  constraint role_permissions_unique unique (role_id, permission_id)
);

create index idx_role_permissions_role_id       on public.role_permissions(role_id);
create index idx_role_permissions_permission_id on public.role_permissions(permission_id);

-- ── USER_ROLES ────────────────────────────────────────────────
create table public.user_roles (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id)  on delete cascade,
  role_id    uuid not null references public.roles(id) on delete cascade,
  company_id uuid not null references public.companies(id) on delete cascade,
  assigned_by uuid references auth.users(id),
  assigned_at timestamptz not null default now(),
  constraint user_roles_unique unique (user_id, role_id, company_id)
);

create index idx_user_roles_user_id    on public.user_roles(user_id);
create index idx_user_roles_role_id    on public.user_roles(role_id);
create index idx_user_roles_company_id on public.user_roles(company_id);

-- ── RLS ──────────────────────────────────────────────────────
alter table public.roles            enable row level security;
alter table public.permissions      enable row level security;
alter table public.role_permissions enable row level security;
alter table public.user_roles       enable row level security;

-- roles: company members can read their company's roles
create policy "roles_select_company"
  on public.roles for select
  using (company_id = public.get_my_company_id());

-- roles: workspace admins can insert/update/delete (enforced in Phase 6 app logic;
-- full permission-gated enforcement added in Phase 6 after permission engine is built)
create policy "roles_write_company"
  on public.roles for all
  using (company_id = public.get_my_company_id());

-- permissions: readable by all authenticated users (catalog data, not sensitive)
create policy "permissions_select_authenticated"
  on public.permissions for select
  using (auth.uid() is not null);

-- role_permissions: company members can read; workspace admins can write
create policy "role_permissions_select_company"
  on public.role_permissions for select
  using (
    exists (
      select 1 from public.roles r
      where r.id = role_permissions.role_id
        and r.company_id = public.get_my_company_id()
    )
  );

create policy "role_permissions_write_company"
  on public.role_permissions for all
  using (
    exists (
      select 1 from public.roles r
      where r.id = role_permissions.role_id
        and r.company_id = public.get_my_company_id()
    )
  );

-- user_roles: company members can read assignments in their company
create policy "user_roles_select_company"
  on public.user_roles for select
  using (company_id = public.get_my_company_id());

create policy "user_roles_write_company"
  on public.user_roles for all
  using (company_id = public.get_my_company_id());
```

**Permission catalog seed** — `supabase/seeds/permissions.sql`:

```sql
insert into public.permissions (module, action, resource, label) values
  -- Procurement
  ('procurement', 'create',  'purchase_request', 'Create Purchase Requests'),
  ('procurement', 'read',    'purchase_request', 'View Purchase Requests'),
  ('procurement', 'update',  'purchase_request', 'Edit Purchase Requests'),
  ('procurement', 'delete',  'purchase_request', 'Delete Purchase Requests'),
  ('procurement', 'approve', 'purchase_request', 'Approve Purchase Requests'),
  ('procurement', 'create',  'rfq',              'Create RFQs'),
  ('procurement', 'read',    'rfq',              'View RFQs'),
  ('procurement', 'update',  'rfq',              'Edit RFQs'),
  ('procurement', 'approve', 'rfq',              'Approve RFQs'),
  ('procurement', 'create',  'purchase_order',   'Create Purchase Orders'),
  ('procurement', 'read',    'purchase_order',   'View Purchase Orders'),
  ('procurement', 'approve', 'purchase_order',   'Approve Purchase Orders'),
  -- Vendors
  ('vendors', 'read',   'vendor',     'View Vendor Profiles'),
  ('vendors', 'create', 'vendor',     'Add Vendors'),
  ('vendors', 'update', 'vendor',     'Edit Vendor Records'),
  -- Finance
  ('finance', 'read',    'invoice',  'View Invoices'),
  ('finance', 'approve', 'invoice',  'Approve Invoices'),
  ('finance', 'create',  'payment',  'Initiate Payments'),
  ('finance', 'read',    'payment',  'View Payment Records'),
  -- People
  ('people', 'read',   'employee', 'View Employees'),
  ('people', 'create', 'employee', 'Invite Employees'),
  ('people', 'update', 'employee', 'Edit Employee Records'),
  ('people', 'delete', 'employee', 'Remove Employees'),
  -- Analytics
  ('analytics', 'read', 'report', 'View Analytics & Reports'),
  -- Settings
  ('settings', 'read',   'workspace', 'View Workspace Settings'),
  ('settings', 'update', 'workspace', 'Edit Workspace Settings'),
  ('settings', 'manage', 'roles',     'Manage Roles & Permissions');
```

**System role seed** — default roles created for every new company via `create-company` Edge Function (extended in this phase):

```sql
-- System roles (is_system = true, cannot be deleted)
-- Inserted by create-company Edge Function after company creation:
--   Admin    — all permissions
--   Manager  — procurement + vendors + finance read + analytics
--   Staff    — procurement create/read, vendors read
--   Viewer   — read-only across all modules
```

---

## Relationships

```
public.companies (1)
  └── public.roles (N)           — each company has its own role set
        └── public.role_permissions (N)
              └── public.permissions (1)  — fixed catalog, shared across all companies

auth.users (1)
  └── public.user_roles (N)      — a user can have multiple roles in a company
        ├── public.roles (1)
        └── public.companies (1)

Permission check path:
  user_id → user_roles → role_id → role_permissions → permission_id → permissions
  (module + action + resource) → boolean: allowed / denied
```

---

## API Endpoints

| Operation | Method | Implementation | Notes |
|---|---|---|---|
| List roles for company | Server Component | `supabase.from('roles').select('*, role_permissions(*, permissions(*)')` | RLS scopes to company |
| Create role | Client mutation | `supabase.from('roles').insert()` | Requires `settings.manage.roles` permission |
| Update role | Client mutation | `supabase.from('roles').update()` | Cannot update `is_system = true` roles |
| Delete role | Client mutation | `supabase.from('roles').delete()` | Cannot delete system roles or roles with active assignments |
| List permissions catalog | Server Component | `supabase.from('permissions').select()` | Global catalog, no RLS restriction |
| Assign permissions to role | Client mutation | `supabase.from('role_permissions').upsert()` | Replaces all permissions for the role atomically |
| Get user permissions | Server / Client | `get_user_permissions(user_id, company_id)` RPC | Returns flat list of `module.action.resource` strings |
| Assign role to user | Client mutation | `supabase.from('user_roles').insert()` | Used in Phase 7 employee management |
| Remove role from user | Client mutation | `supabase.from('user_roles').delete()` | Cannot remove the last Admin role assignment from a workspace |
| Seed system roles | Edge Function | `seed-system-roles` | Called by `create-company` after company creation |

**`get_user_permissions` RPC function** — add to migration `0009_iam_helpers.sql`:

```sql
-- ============================================================
-- Migration: 0009_iam_helpers
-- Description: Permission check RPC and helper functions
-- ============================================================

-- Returns flat array of 'module.action.resource' permission strings for a user
create or replace function public.get_user_permissions(
  p_user_id   uuid,
  p_company_id uuid
)
returns text[] language sql stable security definer as $$
  select array_agg(distinct p.module || '.' || p.action || '.' || p.resource)
  from public.user_roles ur
  join public.role_permissions rp on rp.role_id = ur.role_id
  join public.permissions p       on p.id = rp.permission_id
  where ur.user_id    = p_user_id
    and ur.company_id = p_company_id;
$$;

-- Check if a specific user has a specific permission
create or replace function public.has_permission(
  p_user_id    uuid,
  p_company_id uuid,
  p_module     text,
  p_action     text,
  p_resource   text
)
returns boolean language sql stable security definer as $$
  select exists (
    select 1
    from public.user_roles ur
    join public.role_permissions rp on rp.role_id = ur.role_id
    join public.permissions p       on p.id = rp.permission_id
    where ur.user_id    = p_user_id
      and ur.company_id = p_company_id
      and p.module      = p_module
      and p.action      = p_action
      and p.resource    = p_resource
  );
$$;

-- Index to speed up permission lookups
create index idx_user_roles_user_company
  on public.user_roles(user_id, company_id);
```

---

## Supabase Services Used

```
Supabase Database:
  - public.roles             — company-scoped role definitions
  - public.permissions       — global permission catalog (seeded once)
  - public.role_permissions  — many-to-many: roles ↔ permissions
  - public.user_roles        — many-to-many: users ↔ roles (scoped to company)
  - public.get_user_permissions() RPC — called on session load to hydrate permission store
  - public.has_permission() RPC — used in Edge Functions for server-side permission checks

Supabase Edge Functions:
  - seed-system-roles — creates Admin, Manager, Staff, Viewer roles for a new company
    with their default permission sets; called from create-company after company row is created

Supabase Realtime:
  - Not used in Phase 6
```

---

## Folder Structure

```
src/
├── app/
│   └── (dashboard)/
│       └── people/
│           └── roles/
│               ├── page.tsx                    [Roles list page]
│               └── [id]/
│                   └── page.tsx                [Role detail / permission matrix page]
├── components/
│   └── modules/
│       └── iam/
│           ├── roles-table.tsx
│           ├── role-form.tsx
│           ├── permission-matrix.tsx
│           ├── permission-group.tsx
│           └── index.ts
├── hooks/
│   ├── use-permissions.ts
│   └── use-has-permission.ts
├── lib/
│   └── permissions.ts              [Permission constants and check utilities]
└── stores/
    └── permissions-store.ts
```

---

## UI Screens

### Screen 6.1 — Roles List Page (`/people/roles`)

`PageHeader`: title "Roles & Permissions", breadcrumb People → Roles, action button "Create Role" (visible only to users with `settings.manage.roles` permission).

`DataTable` with columns:

| Column | Description |
|---|---|
| Role name | Name + system badge if `is_system = true` |
| Description | Role description text |
| Members | Count of users assigned this role |
| Permissions | Count of permissions assigned |
| Actions | Edit, Duplicate, Delete (delete disabled for system roles) |

Empty state: "No custom roles yet. Create your first role to control access across your workspace."

---

### Screen 6.2 — Role Detail / Permission Matrix (`/people/roles/[id]`)

`PageHeader`: Role name + system badge, breadcrumb People → Roles → [Role Name], action buttons "Save changes" and "Duplicate role".

Two-column layout (desktop):
- Left: role metadata form (name, description)
- Right: full-width permission matrix

**Permission Matrix:**
Grouped by module (Procurement, Vendors, Finance, People, Analytics, Settings). Each group shows its permissions as a grid of toggle checkboxes. Column headers: Create, Read, Update, Delete, Approve (not every resource has all actions — cells that don't apply are rendered as a dash).

System roles show the matrix as read-only with a banner: "System roles cannot be modified."

---

## Components

### `PermissionMatrix` (`src/components/modules/iam/permission-matrix.tsx`)

```typescript
interface PermissionMatrixProps {
  allPermissions:      Permission[]
  selectedPermissions: string[]    // array of permission IDs
  onChange:            (selectedIds: string[]) => void
  readOnly?:           boolean
}
```

Groups permissions by `module`. For each module, renders a `PermissionGroup` card. The matrix header row shows action columns (Create, Read, Update, Delete, Approve). Each permission row shows the resource name and a checkbox per applicable action. "Select all" toggle per group row.

### `RolesTable`

Wraps the shared `DataTable` component with role-specific column definitions. Handles delete confirmation via `AlertDialog`. Navigates to role detail on row click.

### `RoleForm`

```typescript
interface RoleFormProps {
  defaultValues?: { name: string; description?: string }
  onSubmit:       (data: RoleFormData) => Promise<void>
  isLoading?:     boolean
  isSystemRole?:  boolean
}
```

Two-field form (name, description). Disabled when `isSystemRole` is true. Used in both the create role modal and the role detail page.

---

## Forms

### Form 6.1 — Create / Edit Role

| Field | Type | Validation |
|---|---|---|
| Role name | text input | Required, min 2 chars, max 50 chars, unique within company |
| Description | textarea | Optional, max 200 chars |

```typescript
const roleSchema = z.object({
  name:        z.string().min(2).max(50),
  description: z.string().max(200).optional(),
})
```

Name uniqueness within the company is enforced by the DB unique constraint `roles_company_name_unique`. The client shows the DB error as "A role with this name already exists."

---

## Tables

### Roles List Table

| Column | Sortable | Filterable |
|---|---|---|
| Role name | Yes | No |
| Description | No | No |
| Members | Yes | No |
| Permissions count | Yes | No |
| System role | Yes | Yes (filter: system / custom) |
| Actions | No | No |

Members count is a computed column derived by counting `user_roles` rows per role_id. This is fetched as a join aggregate in the roles query:

```typescript
supabase
  .from('roles')
  .select(`
    *,
    role_permissions(permission_id),
    user_roles(count)
  `)
  .eq('company_id', companyId)
```

---

## Permissions

```
Roles List page:
  - Viewable by any authenticated company_user
  - "Create Role" button: gated on settings.manage.roles
  - Edit / Delete actions: gated on settings.manage.roles

Role Detail page:
  - Viewable by any authenticated company_user (read-only view)
  - Saving permission matrix changes: gated on settings.manage.roles
  - System roles: read-only for everyone (including workspace admins)

The permission engine itself:
  - Permission checks are performed client-side (from the permissions store)
    for UI gating (showing/hiding buttons, routes)
  - Permission checks are ALSO performed server-side in Edge Functions before
    any write operation — client-side checks alone are never sufficient
```

---

## Validation Rules

```
Role name:
  - 2–50 characters
  - Must be unique within the company (DB constraint)
  - Cannot be named 'Admin', 'Manager', 'Staff', or 'Viewer' for custom roles
    (reserved for system roles)

Permission assignments:
  - Any combination of permissions is valid
  - A role with zero permissions is allowed (useful as a placeholder)
  - Saving permission matrix replaces all current role_permissions for that role

System roles:
  - Cannot be renamed, described-changed, or deleted
  - Cannot have permissions removed
  - Users can be assigned to or removed from system roles (role assignment is separate from role definition)

Last admin check:
  - A workspace must always have at least one user with the Admin role
  - If removing a role assignment would leave the workspace with zero Admin users,
    the operation is blocked with error: "The workspace must have at least one Admin."
```

---

## Business Rules

```
BR-6.1  Four system roles are seeded for every new company: Admin, Manager, Staff, Viewer.
        The company's first user (the registrant) is automatically assigned the Admin role.

BR-6.2  System roles (is_system = true) cannot be modified or deleted. Custom roles
        (is_system = false) can be freely modified by workspace admins.

BR-6.3  A user can hold multiple roles simultaneously. Their effective permissions are the
        union of all permissions across all their assigned roles.

BR-6.4  Permission checks throughout the application use the format:
        module.action.resource (e.g. 'procurement.approve.purchase_request')
        This string format is the single contract between the permission engine and all
        feature components.

BR-6.5  The permission catalog (public.permissions table) is global — it is not per-company.
        Companies cannot create new permission types, only assign existing ones to roles.

BR-6.6  When a role is deleted, all user_roles assignments for that role are cascade-deleted.
        Users who had only that role lose all permissions immediately (next session load).

BR-6.7  Duplicating a role copies its name (with " (Copy)" suffix), description, and
        all permission assignments. The duplicate starts as a custom role (is_system = false).
```

---

## Security

```
Permission enforcement layers:
  1. UI layer (client-side): useHasPermission() hides/disables buttons and routes
  2. Edge Function layer: has_permission() RPC called before every write operation
  3. RLS layer: database-level access control is independent of application permissions

The permission store:
  - Loaded once per session from get_user_permissions() RPC
  - Cached in Zustand permissions-store
  - Invalidated and reloaded on role change (via TanStack Query invalidation)
  - Never stored in localStorage — always fetched fresh on session start

Privilege escalation prevention:
  - A user cannot assign themselves a role with more permissions than they currently have
    (enforced in the Edge Function: assign-role validates that the assigner has
    settings.manage.roles permission)
  - A user cannot grant permissions they do not themselves hold (not enforced in v1 —
    the workspace Admin has full control over role definitions)

System role integrity:
  - is_system column enforced at DB level: cannot be updated by any RLS-allowed policy
  - Only the service role (Edge Functions) can set is_system = true during seeding
  - Application-layer updates use anon-key client which cannot set is_system = true
    (no UPDATE policy grants this)
```

---

## State Management

**`src/stores/permissions-store.ts`** — Zustand store for the current user's effective permissions:

```typescript
import { create } from 'zustand'

interface PermissionsStore {
  permissions: string[]      // flat array: ['procurement.create.purchase_request', ...]
  isLoaded:    boolean
  setPermissions: (permissions: string[]) => void
  setLoaded:      (loaded: boolean) => void
  clear:          () => void
}

export const usePermissionsStore = create<PermissionsStore>((set) => ({
  permissions: [],
  isLoaded:    false,
  setPermissions: (permissions) => set({ permissions, isLoaded: true }),
  setLoaded:      (isLoaded)    => set({ isLoaded }),
  clear:          ()            => set({ permissions: [], isLoaded: false }),
}))
```

**`src/hooks/use-permissions.ts`** — loads permissions on session start:

```typescript
'use client'

import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/auth-store'
import { usePermissionsStore } from '@/stores/permissions-store'
import { useSupabase } from './use-supabase'

export function usePermissions() {
  const supabase    = useSupabase()
  const profile     = useAuthStore((s) => s.profile)
  const store       = usePermissionsStore()

  const { data } = useQuery({
    queryKey: ['permissions', profile?.id, profile?.company_id],
    queryFn: async () => {
      if (!profile?.id || !profile.company_id) return []
      const { data } = await supabase.rpc('get_user_permissions', {
        p_user_id:    profile.id,
        p_company_id: profile.company_id,
      })
      return (data as string[]) ?? []
    },
    enabled: !!profile?.id && !!profile.company_id,
    staleTime: 5 * 60 * 1000,
  })

  useEffect(() => {
    if (data) store.setPermissions(data)
  }, [data]) // eslint-disable-line react-hooks/exhaustive-deps
}
```

**`src/hooks/use-has-permission.ts`** — component-level permission gate:

```typescript
'use client'

import { usePermissionsStore } from '@/stores/permissions-store'

export function useHasPermission(
  module:   string,
  action:   string,
  resource: string
): boolean {
  const permissions = usePermissionsStore((s) => s.permissions)
  return permissions.includes(`${module}.${action}.${resource}`)
}
```

**`src/lib/permissions.ts`** — typed constants to avoid raw string literals:

```typescript
export const PERMISSIONS = {
  PROCUREMENT: {
    CREATE_PR:    'procurement.create.purchase_request',
    READ_PR:      'procurement.read.purchase_request',
    UPDATE_PR:    'procurement.update.purchase_request',
    DELETE_PR:    'procurement.delete.purchase_request',
    APPROVE_PR:   'procurement.approve.purchase_request',
    CREATE_RFQ:   'procurement.create.rfq',
    READ_RFQ:     'procurement.read.rfq',
    APPROVE_RFQ:  'procurement.approve.rfq',
    CREATE_PO:    'procurement.create.purchase_order',
    READ_PO:      'procurement.read.purchase_order',
    APPROVE_PO:   'procurement.approve.purchase_order',
  },
  VENDORS: {
    READ:   'vendors.read.vendor',
    CREATE: 'vendors.create.vendor',
    UPDATE: 'vendors.update.vendor',
  },
  FINANCE: {
    READ_INVOICE:    'finance.read.invoice',
    APPROVE_INVOICE: 'finance.approve.invoice',
    CREATE_PAYMENT:  'finance.create.payment',
    READ_PAYMENT:    'finance.read.payment',
  },
  PEOPLE: {
    READ:   'people.read.employee',
    CREATE: 'people.create.employee',
    UPDATE: 'people.update.employee',
    DELETE: 'people.delete.employee',
  },
  ANALYTICS: {
    READ: 'analytics.read.report',
  },
  SETTINGS: {
    READ_WORKSPACE:   'settings.read.workspace',
    UPDATE_WORKSPACE: 'settings.update.workspace',
    MANAGE_ROLES:     'settings.manage.roles',
  },
} as const
```

---

## Development Tasks

### Task 6.1 — IAM Migration and Seeds

Apply migration `0008_create_iam_tables.sql` and `0009_iam_helpers.sql`. Run the permissions seed script. Verify all tables exist with correct columns, indexes, and RLS in Supabase Studio.

### Task 6.2 — seed-system-roles Edge Function

Create `supabase/functions/seed-system-roles/index.ts`. Called by `create-company` immediately after the company row is created. Creates four system roles for the new company and assigns all permissions to Admin, a standard set to Manager, limited set to Staff, and read-only to Viewer. Assigns the registering user to the Admin role.

### Task 6.3 — Permissions Store Hydration

Wire `usePermissions()` into the `AuthProvider` component (created in Phase 4) so permissions are fetched on every session load and stored in the permissions store. Clear the permissions store on sign-out.

### Task 6.4 — useHasPermission Hook Usage Convention

Establish the team convention: every action button, create button, and destructive action throughout the application must be wrapped with `useHasPermission()`. Document this in the project README. Apply `useHasPermission(PERMISSIONS.SETTINGS.MANAGE_ROLES)` to the Roles list page actions as the first real example.

### Task 6.5 — Roles List Page

Implement `/people/roles/page.tsx` as a Server Component that fetches roles with permission counts and member counts. Pass to `RolesTable` client component. Wire "Create Role" to open a modal with `RoleForm`.

### Task 6.6 — Role Detail Page

Implement `/people/roles/[id]/page.tsx`. Fetches the role and all its assigned permissions. Renders `RoleForm` for metadata and `PermissionMatrix` for permission assignment. "Save changes" updates `role_permissions` by deleting all existing entries and inserting the new set atomically.

### Task 6.7 — Sidebar Navigation Permission Gating

Update `src/lib/navigation.ts` to associate each nav item with a required permission. Update the `SidebarNavItem` component to call `useHasPermission()` and hide items the user does not have access to. Users without `people.read.employee` do not see the People section.

### Task 6.8 — Permission-Gated Navigation in Dashboard Layout

Update `(dashboard)/layout.tsx` to filter `COMPANY_NAV` based on the current user's permissions before passing to `Sidebar`. This ensures the navigation is correct on first render (server-rendered navigation is replaced by the client-gated version after hydration).

---

## Testing Checklist

```
✓ Migration 0008: all four tables created with correct columns, constraints, and indexes
✓ Migration 0009: get_user_permissions() RPC returns correct permissions for a user
✓ Migration 0009: has_permission() returns true for a held permission, false for a missing one
✓ Seed: permissions catalog fully populated (27 permissions)
✓ seed-system-roles: Admin, Manager, Staff, Viewer created for new company
✓ seed-system-roles: first user assigned Admin role
✓ Admin user: useHasPermission(PERMISSIONS.SETTINGS.MANAGE_ROLES) returns true
✓ Staff user: useHasPermission(PERMISSIONS.SETTINGS.MANAGE_ROLES) returns false
✓ Permissions store: populated on session load; cleared on sign-out
✓ Roles list page: displays all roles with member and permission counts
✓ Create role: new custom role created; appears in list
✓ Edit role: role name and description updates persist
✓ Permission matrix: checking/unchecking permissions and saving updates role_permissions
✓ System role: Edit/Delete actions disabled; permission matrix read-only
✓ Delete role: deletes custom role; blocked if is_system = true
✓ Duplicate role: creates copy with "(Copy)" suffix and same permissions
✓ Sidebar: Staff user does not see Finance or Settings nav items
✓ Sidebar: Admin user sees all nav items
✓ Last admin check: removing Admin role from last Admin user is blocked with error message
✓ Multi-role user: permissions are union of all assigned roles
✓ RLS: user cannot read or write roles from another company
✓ pnpm build: no TypeScript errors
✓ pnpm lint: zero warnings
✓ Roles pages pass axe-core accessibility scan
```

---

## Acceptance Criteria

```
AC-6.1   IAM tables created; migrations 0008 and 0009 applied cleanly
AC-6.2   Permissions catalog seeded with all 27 permissions
AC-6.3   seed-system-roles creates four system roles and assigns first user as Admin
AC-6.4   get_user_permissions() RPC returns correct flat permission strings per user
AC-6.5   Permissions store hydrated on session load; all hooks return correct booleans
AC-6.6   Roles list page renders all company roles with counts
AC-6.7   Create, edit, and delete custom roles work end-to-end
AC-6.8   Permission matrix toggles update role_permissions correctly
AC-6.9   System roles are read-only — name, description, and permissions cannot be changed
AC-6.10  Sidebar navigation gated by permissions — unauthorized items are hidden
AC-6.11  Last-admin safeguard: workspace cannot be left with zero Admin users
AC-6.12  RLS verified: role data from another company is not accessible
AC-6.13  PERMISSIONS constants used throughout — no raw permission strings in component files
```

---

## Definition of Done

Phase 6 is complete when all Acceptance Criteria above are met AND:

- [ ] All TypeScript checks pass (zero errors)
- [ ] All ESLint checks pass (zero warnings)
- [ ] All Prettier checks pass
- [ ] Migrations 0008 and 0009 applied and committed; database.ts regenerated
- [ ] Permissions seed applied to local and staging
- [ ] seed-system-roles Edge Function deployed and tested end-to-end
- [ ] Permission store hydration tested: correct permissions loaded for each system role
- [ ] Sidebar gating tested with Admin, Manager, Staff, and Viewer accounts
- [ ] Last-admin safeguard tested: blocked removal confirmed with correct error message
- [ ] PR merged to `develop` with at least 1 reviewer approval
- [ ] `feature/06-iam` branch merged and deleted

---

## Risk Factors

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Permission store stale after role reassignment | Medium | Medium | Invalidate `['permissions', ...]` TanStack Query key after any user_roles mutation |
| seed-system-roles called multiple times for same company | Low | Medium | Add idempotency: check if roles for the company already exist before inserting |
| Sidebar flicker: server renders all items, client hides unauthorized items after hydration | Medium | Low | Accept as a known limitation in v1; full server-side nav gating in Phase 27 settings |
| Last-admin check bypassed via direct Supabase call | Low | High | Enforce last-admin check in the assign-role Edge Function, not just client-side |
| Permission catalog growing without governance | Low | Low | Permissions table is insert-only via migrations — no UI for adding new permission types |

---

## Best Practices

- Always use `PERMISSIONS` constants (`src/lib/permissions.ts`) — never raw strings like `'procurement.create.purchase_request'` in component files
- Permission checks must exist at two layers: UI (useHasPermission) and API (has_permission RPC in Edge Functions). One layer alone is not sufficient
- Regenerate `database.ts` after migrations 0008 and 0009 and commit in the same PR
- Test the permissions engine with a dedicated test user for each of the four system roles before marking this phase done
- Keep the permission catalog append-only — never rename or delete existing permission records, as this would silently break existing role configurations

---

## Estimated Completion

**4–5 working days** for a single developer. The permission matrix UI and store hydration are the most complex parts. The Edge Function for system role seeding requires careful testing for idempotency.

---

---

# PHASE 7 — EMPLOYEE MANAGEMENT

---

## Overview

| Field | Value |
|---|---|
| Phase Number | 7 |
| Phase Name | Employee Management |
| Milestone | M2 — Authentication & Workspace |
| PRD Reference | Module 4 — Employee Management |
| DESIGN Reference | Section 3 (People — Employees, Departments), F01, F03 |
| Estimated Duration | 4–5 days |
| Prerequisite Phases | Phase 1, Phase 2, Phase 3, Phase 4, Phase 5, Phase 6 |

---

## Purpose

Phase 7 implements the complete employee management system for company workspaces. Workspace administrators can invite employees by email, assign them roles, organize them into departments, view and manage the full employee directory, and remove employees from the workspace.

This phase completes Milestone 2. After Phase 7, the platform has a fully operational identity, access, and people layer — all subsequent feature phases build on the assumption that users, roles, departments, and permissions are correctly configured.

---

## Business Goal

Enterprise procurement requires organizational structure. Purchase requests need requesters. Approval workflows need approvers. RFQs need owners. None of this is meaningful without a populated employee directory with correct role assignments and department affiliations. Phase 7 enables workspace administrators to set up their team before any procurement activity begins.

---

## Dependencies

- Phase 6 complete (IAM tables, roles, user_roles, permission engine, PERMISSIONS constants)
- Phase 4 complete (Supabase Auth invite flow — `supabase.auth.admin.inviteUserByEmail()`)
- Phase 2 `DataTable`, `PageHeader`, `EmptyState`, `StatusBadge`, `FormSection` components
- Phase 3 Storage `avatars` bucket with public read policy

---

## Database Tables

Migration: `0010_create_employee_tables.sql`

```sql
-- ============================================================
-- Migration: 0010_create_employee_tables
-- Description: Departments and employee invitations
-- ============================================================

-- ── DEPARTMENTS ───────────────────────────────────────────────
create table public.departments (
  id          uuid primary key default gen_random_uuid(),
  company_id  uuid not null references public.companies(id) on delete cascade,
  name        text not null,
  description text,
  head_id     uuid references auth.users(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint departments_company_name_unique unique (company_id, name)
);

create index idx_departments_company_id on public.departments(company_id);

create trigger trg_departments_updated_at
  before update on public.departments
  for each row execute function public.handle_updated_at();

-- ── EMPLOYEE_INVITATIONS ──────────────────────────────────────
-- Tracks pending invitations before the invitee accepts
create table public.employee_invitations (
  id            uuid primary key default gen_random_uuid(),
  company_id    uuid not null references public.companies(id) on delete cascade,
  email         text not null,
  role_id       uuid not null references public.roles(id) on delete cascade,
  department_id uuid references public.departments(id) on delete set null,
  invited_by    uuid not null references auth.users(id) on delete cascade,
  status        text not null default 'pending'
                  check (status in ('pending', 'accepted', 'expired', 'revoked')),
  expires_at    timestamptz not null default (now() + interval '7 days'),
  accepted_at   timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  constraint employee_invitations_company_email_unique unique (company_id, email)
);

create index idx_employee_invitations_company_id on public.employee_invitations(company_id);
create index idx_employee_invitations_email      on public.employee_invitations(email);
create index idx_employee_invitations_status     on public.employee_invitations(status);

create trigger trg_employee_invitations_updated_at
  before update on public.employee_invitations
  for each row execute function public.handle_updated_at();

-- ── Add department_id to profiles ────────────────────────────
alter table public.profiles
  add column if not exists department_id uuid
    references public.departments(id) on delete set null,
  add column if not exists job_title     text,
  add column if not exists employee_id   text;   -- optional internal employee number

create index idx_profiles_department_id on public.profiles(department_id);

-- ── RLS ──────────────────────────────────────────────────────
alter table public.departments           enable row level security;
alter table public.employee_invitations  enable row level security;

-- departments: company members can read; admins can write
create policy "departments_select_company"
  on public.departments for select
  using (company_id = public.get_my_company_id());

create policy "departments_write_company"
  on public.departments for all
  using (company_id = public.get_my_company_id());

-- employee_invitations: company members can read their company's invitations
create policy "invitations_select_company"
  on public.employee_invitations for select
  using (company_id = public.get_my_company_id());

create policy "invitations_write_company"
  on public.employee_invitations for all
  using (company_id = public.get_my_company_id());
```

**Profile columns added in this phase:**

| Column | Type | Purpose |
|---|---|---|
| `department_id` | uuid FK → departments | Employee's department assignment |
| `job_title` | text | Free-text job title |
| `employee_id` | text | Optional internal employee number |

---

## Relationships

```
public.companies (1)
  ├── public.departments (N)
  │     └── public.profiles.department_id (N:1)
  └── public.employee_invitations (N)
        ├── public.roles (N:1)    — role to assign on acceptance
        └── auth.users (N:1)     — invited_by reference

auth.users (1)
  └── public.profiles (1:1)
        ├── public.departments (N:1)  — via department_id
        └── public.user_roles (N)     — role assignments (from Phase 6)

Invitation acceptance flow:
  employee_invitations (pending)
    → Supabase Auth inviteUserByEmail()
    → User clicks link → /accept-invite page
    → OTP verified → profile created (handle_new_user trigger)
    → accept-invite Edge Function: sets profile.company_id,
      profile.department_id, creates user_roles entry,
      updates invitation.status = 'accepted'
```

---

## API Endpoints

| Operation | Method | Implementation | Notes |
|---|---|---|---|
| List employees (profiles in company) | Server Component | `supabase.from('profiles').select('*, departments(*), user_roles(*, roles(*)')` | RLS scopes to company |
| Get single employee | Server Component | `supabase.from('profiles').select('*').eq('id', id)` | RLS enforces company scope |
| Update employee profile | Client mutation | `supabase.from('profiles').update()` | Job title, department, employee_id |
| Invite employee | Edge Function | `invite-employee` | Calls Supabase Auth admin.inviteUserByEmail(); creates invitation record |
| Accept invitation | Edge Function | `accept-invite` | Sets profile.company_id, creates user_roles entry, marks invitation accepted |
| Resend invitation | Edge Function | `invite-employee` (re-call) | Revokes old invitation record, creates new one |
| Revoke invitation | Client mutation | `supabase.from('employee_invitations').update({ status: 'revoked' })` | Does not cancel Supabase Auth email — user still gets link but accept-invite blocks it |
| Remove employee | Edge Function | `remove-employee` | Deletes user_roles for company; clears profile.company_id, department_id |
| List departments | Server Component | `supabase.from('departments').select('*, profiles(count)')` | RLS scopes to company |
| Create department | Client mutation | `supabase.from('departments').insert()` | Requires `people.create.employee` permission |
| Update department | Client mutation | `supabase.from('departments').update()` | Requires `people.update.employee` permission |
| Delete department | Client mutation | `supabase.from('departments').delete()` | Blocked if employees assigned; requires `people.delete.employee` |
| Assign role to employee | Client mutation | `supabase.from('user_roles').insert()` | Requires `settings.manage.roles` permission |
| Remove role from employee | Client mutation | `supabase.from('user_roles').delete()` | Last-admin check enforced |
| List pending invitations | Server Component | `supabase.from('employee_invitations').select()` | Filtered to status = 'pending' |

**`supabase/functions/invite-employee/index.ts`:**

```typescript
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { handleCors } from '../_shared/cors.ts'
import { getAuthenticatedUser } from '../_shared/auth.ts'
import { errorResponse } from '../_shared/error.ts'
import { successResponse } from '../_shared/response.ts'

interface InvitePayload {
  email:         string
  role_id:       string
  department_id?: string
}

Deno.serve(async (req) => {
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse

  try {
    const { user } = await getAuthenticatedUser(req)
    const payload: InvitePayload = await req.json()

    if (!payload.email || !payload.role_id) {
      throw new Error('email and role_id are required')
    }

    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get the inviter's company_id
    const { data: profile } = await adminClient
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single()

    if (!profile?.company_id) throw new Error('No company workspace found')

    // Upsert invitation record (handles resend)
    await adminClient
      .from('employee_invitations')
      .upsert({
        company_id:    profile.company_id,
        email:         payload.email.toLowerCase().trim(),
        role_id:       payload.role_id,
        department_id: payload.department_id ?? null,
        invited_by:    user.id,
        status:        'pending',
        expires_at:    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      }, { onConflict: 'company_id,email' })

    // Send Supabase Auth invitation email
    const { error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(
      payload.email,
      {
        redirectTo: `${Deno.env.get('NEXT_PUBLIC_APP_URL')}/accept-invite`,
        data: {
          company_id:    profile.company_id,
          role_id:       payload.role_id,
          department_id: payload.department_id ?? null,
        },
      }
    )
    if (inviteError) throw inviteError

    return successResponse({ success: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return errorResponse(message, 400)
  }
})
```

**`supabase/functions/accept-invite/index.ts`:**

```typescript
Deno.serve(async (req) => {
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse

  try {
    // User must have already verified their OTP on the /accept-invite page
    // before calling this function — they are authenticated at this point
    const { user } = await getAuthenticatedUser(req)

    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Read invitation metadata from user_metadata (set during inviteUserByEmail)
    const meta = user.user_metadata as {
      company_id:    string
      role_id:       string
      department_id?: string
    }

    if (!meta.company_id || !meta.role_id) {
      throw new Error('Invalid invitation metadata')
    }

    // Check invitation is still pending and not expired
    const { data: invitation } = await adminClient
      .from('employee_invitations')
      .select('*')
      .eq('company_id', meta.company_id)
      .eq('email', user.email!)
      .eq('status', 'pending')
      .gt('expires_at', new Date().toISOString())
      .single()

    if (!invitation) throw new Error('Invitation not found, expired, or already used')

    // Update profile: set company_id and department_id
    await adminClient
      .from('profiles')
      .update({
        company_id:    meta.company_id,
        department_id: meta.department_id ?? null,
        role:          'company_user',
      })
      .eq('id', user.id)

    // Assign role
    await adminClient
      .from('user_roles')
      .insert({
        user_id:     user.id,
        role_id:     meta.role_id,
        company_id:  meta.company_id,
        assigned_by: invitation.invited_by,
      })

    // Mark invitation as accepted
    await adminClient
      .from('employee_invitations')
      .update({ status: 'accepted', accepted_at: new Date().toISOString() })
      .eq('id', invitation.id)

    return successResponse({ success: true, company_id: meta.company_id })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return errorResponse(message, 400)
  }
})
```

---

## Supabase Services Used

```
Supabase Auth:
  - supabase.auth.admin.inviteUserByEmail() — sends invitation email with magic link
  - Used in invite-employee Edge Function with service role key

Supabase Database:
  - public.profiles           — read/write for employee directory
  - public.departments        — CRUD for department management
  - public.employee_invitations — invitation lifecycle tracking
  - public.user_roles         — role assignment on invitation acceptance

Supabase Storage:
  - avatars bucket            — profile avatar upload (from employee profile edit screen)

Supabase Edge Functions:
  - invite-employee           — creates invitation record + sends Auth invite email
  - accept-invite             — completes onboarding: sets company_id, role, department
  - remove-employee           — removes workspace membership safely
```

---

## Folder Structure

```
src/
├── app/
│   └── (dashboard)/
│       └── people/
│           ├── employees/
│           │   ├── page.tsx                    [Employee directory]
│           │   └── [id]/
│           │       └── page.tsx                [Employee detail/edit]
│           ├── departments/
│           │   └── page.tsx                    [Departments list]
│           └── roles/                          [From Phase 6]
├── components/
│   └── modules/
│       └── employees/
│           ├── employees-table.tsx
│           ├── employee-detail-form.tsx
│           ├── invite-employee-dialog.tsx
│           ├── invite-employee-form.tsx
│           ├── pending-invitations-table.tsx
│           ├── departments-table.tsx
│           ├── department-form.tsx
│           ├── remove-employee-dialog.tsx
│           ├── employee-role-editor.tsx
│           └── index.ts
└── hooks/
    └── use-employees.ts
```

---

## UI Screens

### Screen 7.1 — Employee Directory (`/people/employees`)

`PageHeader`: title "Employees", breadcrumb People → Employees, action button "Invite Employee" (gated on `PERMISSIONS.PEOPLE.CREATE`).

Two-tab layout: **Active Employees** | **Pending Invitations**

**Active Employees tab:**
`DataTable` showing all profiles in the company. Columns:

| Column | Description |
|---|---|
| Employee | Avatar + full name + email |
| Job title | Free-text job title |
| Department | Department name or "—" |
| Roles | Badge list of assigned role names |
| Status | Active / Invited |
| Joined | Formatted date |
| Actions | Edit, Remove |

Click on a row navigates to `/people/employees/[id]`.

**Pending Invitations tab:**
`DataTable` of `employee_invitations` where status = 'pending'. Columns: email, invited role, department, invited by, invited on, expires at, actions (Resend, Revoke).

---

### Screen 7.2 — Employee Detail (`/people/employees/[id]`)

`PageHeader`: employee full name + avatar, breadcrumb People → Employees → [Name], actions "Save changes" and "Remove employee".

Three `FormSection` panels:
1. **Personal Details** — full name, job title, employee ID, avatar upload
2. **Workspace Assignment** — department select, role editor (add/remove roles)
3. **Account Info** — email (read-only), join date (read-only), last seen (read-only)

---

### Screen 7.3 — Departments (`/people/departments`)

`PageHeader`: title "Departments", action "Create Department".

`DataTable` with columns:

| Column | Description |
|---|---|
| Department name | Name |
| Description | Short description |
| Head | Avatar + name of department head or "—" |
| Members | Count of employees in this department |
| Actions | Edit, Delete |

Empty state: "No departments yet. Create departments to organize your team."

---

### Screen 7.4 — Invite Employee Dialog

Modal (`Dialog`) triggered from the "Invite Employee" button. Contains `InviteEmployeeForm`. On successful submission, closes and shows a success toast: "Invitation sent to [email]." The Pending Invitations tab refreshes automatically via TanStack Query invalidation.

---

## Components

### `InviteEmployeeForm`

```typescript
interface InviteEmployeeFormProps {
  companyId:   string
  roles:       Role[]
  departments: Department[]
  onSuccess:   () => void
}
```

Calls `invite-employee` Edge Function on submit. Fields: email, role (select), department (select, optional).

### `EmployeeRoleEditor`

Renders the current role assignments for an employee as a list of `Badge` components with remove buttons. An "Add role" dropdown lists available roles not yet assigned. Uses `user_roles` inserts and deletes.

```typescript
interface EmployeeRoleEditorProps {
  userId:    string
  companyId: string
  roles:     UserRole[]         // current assignments
  allRoles:  Role[]             // all company roles
  onChange?: () => void
}
```

### `RemoveEmployeeDialog`

Confirmation `AlertDialog` before removing an employee. Shows the employee's name. Warns if removing will leave the workspace with zero admins (checks client-side before allowing confirm). On confirm, calls `remove-employee` Edge Function.

### `DepartmentForm`

Small form (name, description, head_id select). Used in both a create modal and an inline edit sheet.

---

## Forms

### Form 7.1 — Invite Employee Form

| Field | Type | Validation |
|---|---|---|
| Email | email input | Required, valid email format, not already an active member of this company |
| Role | select | Required, one of the company's defined roles |
| Department | select | Optional, one of the company's departments |

```typescript
const inviteEmployeeSchema = z.object({
  email:         z.string().email('Please enter a valid email address'),
  role_id:       z.string().uuid('Please select a role'),
  department_id: z.string().uuid().optional(),
})
```

Duplicate email check: if the email is already in `employee_invitations` with status `'pending'` for this company, show inline message: "An invitation has already been sent to this email. You can resend it from the Pending Invitations tab."

---

### Form 7.2 — Employee Detail Form

| Field | Type | Validation |
|---|---|---|
| Full name | text input | Required, min 2 chars, max 100 chars |
| Job title | text input | Optional, max 100 chars |
| Employee ID | text input | Optional, max 50 chars, unique within company |
| Department | select | Optional, one of the company's departments |

```typescript
const employeeDetailSchema = z.object({
  full_name:     z.string().min(2).max(100),
  job_title:     z.string().max(100).optional(),
  employee_id:   z.string().max(50).optional(),
  department_id: z.string().uuid().optional(),
})
```

Email is read-only (comes from `auth.users` — not editable here). Avatar upload handled by `LogoUploader` (reused from Phase 5) pointing to the `avatars` bucket.

---

### Form 7.3 — Department Form

| Field | Type | Validation |
|---|---|---|
| Department name | text input | Required, min 2 chars, max 100 chars, unique within company |
| Description | textarea | Optional, max 300 chars |
| Department head | select | Optional, one of the company's active employees |

```typescript
const departmentSchema = z.object({
  name:        z.string().min(2, 'Department name is required').max(100),
  description: z.string().max(300).optional(),
  head_id:     z.string().uuid().optional(),
})
```

Name uniqueness enforced by `departments_company_name_unique` DB constraint. The client shows the DB error as "A department with this name already exists."

---

### Form 7.4 — Accept Invite Form

(Built in Phase 4 at `/accept-invite` — this phase wires the `accept-invite` Edge Function to it.)

| Field | Type | Validation |
|---|---|---|
| Full name | text input | Required, min 2 chars, max 100 chars |
| Password | password input | Required, same rules as registration |
| Confirm password | password input | Must match password |

Email pre-filled and read-only from invitation token. On form submit:
1. `supabase.auth.updateUser({ password })` sets the password
2. `accept-invite` Edge Function called with authenticated session
3. On success: toast "Welcome to [Company Name]!" + redirect to `/dashboard`

---

## Tables

### Employee Directory Table

| Column | Type | Sortable | Filterable |
|---|---|---|---|
| Employee | Avatar + name + email | Yes (name) | Yes (search by name/email) |
| Job title | Text | Yes | No |
| Department | Department name | Yes | Yes (dropdown) |
| Roles | Badge list | No | Yes (dropdown) |
| Joined | Date | Yes | No |
| Actions | Edit / Remove | No | No |

Default sort: joined date descending (newest first).

Filtering options: department (multi-select), role (multi-select), free-text search on name and email.

---

### Pending Invitations Table

| Column | Type | Sortable | Filterable |
|---|---|---|---|
| Email | Text | Yes | Yes (search) |
| Role | Role name | No | Yes (dropdown) |
| Department | Department name | No | No |
| Invited by | Employee name | No | No |
| Invited on | Date | Yes | No |
| Expires | Date + overdue badge | Yes | No |
| Actions | Resend / Revoke | No | No |

Expired invitations (expires_at < now) show a `StatusBadge` with status `'overdue'`. Resend button re-calls `invite-employee` Edge Function which upserts the invitation record with a new `expires_at`.

---

### Departments Table

| Column | Type | Sortable | Filterable |
|---|---|---|---|
| Department name | Text | Yes | Yes (search) |
| Description | Text (truncated) | No | No |
| Head | Avatar + name | No | No |
| Members | Count | Yes | No |
| Actions | Edit / Delete | No | No |

Member count is a live aggregate computed in the query:
```typescript
supabase
  .from('departments')
  .select('*, profiles(count)')
  .eq('company_id', companyId)
```

---

## Permissions

```
Employee Directory (/people/employees):
  - View list:            people.read.employee
  - Invite employees:     people.create.employee
  - Edit employee:        people.update.employee
  - Remove employee:      people.delete.employee
  - Assign/remove roles:  settings.manage.roles

Departments (/people/departments):
  - View list:            people.read.employee   (same gate — people access)
  - Create department:    people.create.employee
  - Edit department:      people.update.employee
  - Delete department:    people.delete.employee

Employee Detail (/people/employees/[id]):
  - View:                 people.read.employee
  - Save changes:         people.update.employee
  - Remove employee:      people.delete.employee

Gating convention:
  All action buttons wrapped with useHasPermission(PERMISSIONS.PEOPLE.*)
  Edge Functions re-validate permissions using has_permission() RPC before executing
```

---

## Validation Rules

```
Invitation email:
  - Valid RFC 5322 email format
  - Must not already be an active member (profile.company_id = this company)
  - Must not have an active pending invitation (duplicate check in Edge Function)
  - Invitation expires after 7 days; expired invitations can be resent

Employee ID:
  - Optional; max 50 characters
  - Uniqueness within the company is enforced by application logic (not a DB constraint)
    because employee_id is optional — a DB unique constraint on nullable columns
    allows multiple NULLs, so uniqueness is validated in the update query

Department deletion:
  - Cannot delete a department that has employees assigned to it
  - Check is performed client-side before showing the confirm dialog
  - Also enforced in the server mutation: query profiles count for department_id first

Role removal:
  - Cannot remove the Admin role from the last Admin in the workspace
  - EmployeeRoleEditor calls the same last-admin check used in Phase 6

Avatar upload:
  - Same rules as company logo: JPEG, PNG, WebP — max 2MB
  - Stored at: avatars/[user_id]/avatar.[ext]
  - Storage RLS: user can only write to avatars/[own user_id]/
```

---

## Business Rules

```
BR-7.1  Only users with people.create.employee permission can invite employees.
        The invite-employee Edge Function validates this permission before sending any email.

BR-7.2  An invitation is valid for 7 days. After expiry, the Resend action resets
        expires_at to now + 7 days and re-sends the Supabase Auth invite email.

BR-7.3  A revoked invitation cannot be accepted. The accept-invite Edge Function
        checks invitation.status = 'pending' before proceeding. Revoked invitations
        remain visible in the Pending Invitations tab with status badge "Revoked".

BR-7.4  If the invited email address belongs to an existing Supabase Auth user
        (already registered elsewhere), Supabase Auth inviteUserByEmail() still works —
        it sends a magic link that authenticates the existing user. The accept-invite
        function then links their existing account to the new company workspace.

BR-7.5  An employee can only belong to one company workspace at a time.
        (A single person can also have a separate vendor workspace under the same email —
        this is not the same as belonging to two company workspaces simultaneously.)

BR-7.6  Removing an employee sets profile.company_id = null and profile.department_id = null
        and deletes all their user_roles entries for the company. Their auth.users account
        is NOT deleted — they retain their Supabase Auth identity.

BR-7.7  Department head assignment is informational only in v1. It does not gate
        any workflow approvals — approval workflow configuration is handled in Phase 12.

BR-7.8  The first user of a company workspace (the registrant) is automatically
        placed in no department (department_id = null) and assigned the Admin role
        by the seed-system-roles Edge Function (Phase 6). They can update their
        own department assignment from the employee detail page.
```

---

## Security

```
Invitation security:
  - invite-employee Edge Function uses service role key — only the server can
    call supabase.auth.admin.inviteUserByEmail()
  - Inviter's company_id is read from their server-side profile (not from the payload)
    — a client cannot invite employees into a different company by crafting a payload
  - Invitation metadata (company_id, role_id, department_id) is embedded in the
    Supabase Auth invite token's user_metadata by the admin API call — not from
    a client-controlled parameter at accept time
  - accept-invite Edge Function re-reads invitation record from DB to verify
    status = 'pending' and expires_at > now() before processing any writes
  - A revoked invitation token (Supabase Auth magic link) still resolves the OTP
    but accept-invite blocks the workspace attachment — the invited user ends up
    with an authenticated but unattached account (not a security issue — no data
    access is granted without a company_id)

Employee removal security:
  - remove-employee Edge Function validates that the caller has people.delete.employee
    permission using has_permission() RPC before executing
  - Removal is scoped to the caller's company_id — a user cannot remove employees
    from a different company even with a crafted request
  - profile.company_id set to null on removal — RLS policies then deny all
    company-scoped data access immediately on the next request

Role assignment security:
  - All role assignments validated against the caller's company_id
  - user_roles RLS ensures assignments can only be read/written within the same company
  - last-admin check enforced in the Edge Function layer, not just the client

Data access after removal:
  - Removed employee's session remains valid until JWT expiry (1 hour)
  - After JWT expiry, all protected routes redirect to /login
  - RLS immediately blocks company-scoped data access even within the valid JWT window
    because profile.company_id = null causes get_my_company_id() to return null

Avatar security:
  - Storage RLS: avatars/[user_id]/ — only the owning user can write
  - Avatars are public-read (profile photos are not sensitive)
  - File type enforced by Storage bucket configuration (JPEG, PNG, WebP only)
  - SVG not permitted in avatars bucket (XSS risk from served SVG)
```

---

## State Management

**`src/hooks/use-employees.ts`** — TanStack Query hooks for employee data:

```typescript
'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSupabase } from './use-supabase'
import { useAuthStore } from '@/stores/auth-store'

export function useEmployees() {
  const supabase  = useSupabase()
  const profile   = useAuthStore((s) => s.profile)

  return useQuery({
    queryKey: ['employees', profile?.company_id],
    queryFn: async () => {
      if (!profile?.company_id) return []
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id, full_name, avatar_url, job_title, employee_id,
          last_seen_at, created_at,
          departments(id, name),
          user_roles(role_id, roles(id, name))
        `)
        .eq('company_id', profile.company_id)
        .is('deleted_at', null)
        .order('full_name')
      if (error) throw error
      return data ?? []
    },
    enabled: !!profile?.company_id,
    staleTime: 60 * 1000,
  })
}

export function useDepartments() {
  const supabase = useSupabase()
  const profile  = useAuthStore((s) => s.profile)

  return useQuery({
    queryKey: ['departments', profile?.company_id],
    queryFn: async () => {
      if (!profile?.company_id) return []
      const { data, error } = await supabase
        .from('departments')
        .select('*, profiles(count)')
        .eq('company_id', profile.company_id)
        .order('name')
      if (error) throw error
      return data ?? []
    },
    enabled: !!profile?.company_id,
    staleTime: 2 * 60 * 1000,
  })
}

export function usePendingInvitations() {
  const supabase = useSupabase()
  const profile  = useAuthStore((s) => s.profile)

  return useQuery({
    queryKey: ['invitations', profile?.company_id],
    queryFn: async () => {
      if (!profile?.company_id) return []
      const { data, error } = await supabase
        .from('employee_invitations')
        .select('*, roles(name), departments(name)')
        .eq('company_id', profile.company_id)
        .in('status', ['pending', 'revoked'])
        .order('created_at', { ascending: false })
      if (error) throw error
      return data ?? []
    },
    enabled: !!profile?.company_id,
    staleTime: 30 * 1000,
  })
}
```

Employee-related mutations (invite, update profile, remove, create department) all call `queryClient.invalidateQueries` on the relevant query keys after success so the UI stays in sync without a page reload.

No new Zustand stores are introduced in Phase 7. All employee data is server state managed exclusively by TanStack Query.

---

## Development Tasks

### Task 7.1 — Employee Tables Migration

Apply migration `0010_create_employee_tables.sql`. Verify that `departments`, `employee_invitations` tables exist, `profiles` has `department_id`, `job_title`, and `employee_id` columns, and all RLS policies are in place. Regenerate `database.ts` types.

### Task 7.2 — invite-employee Edge Function

Deploy `supabase/functions/invite-employee/index.ts` to local and staging. Test with:
1. A new email address (creates new auth user)
2. An email already registered on the platform (attaches existing user on accept)
3. A duplicate invite to the same email (returns error or upserts cleanly)
4. An expired token attempt (blocked by accept-invite)

### Task 7.3 — accept-invite Edge Function

Deploy `supabase/functions/accept-invite/index.ts`. Wire it to the `/accept-invite` page (Phase 4 built the page; this phase completes the backend call). After OTP verification completes, call `accept-invite` and on success redirect to `/dashboard`.

### Task 7.4 — remove-employee Edge Function

Create `supabase/functions/remove-employee/index.ts`. Validates permission, clears `profile.company_id` and `profile.department_id`, deletes all `user_roles` entries for `(user_id, company_id)`, and updates any `employee_invitations` with `invited_by = removed_user_id` to status `'revoked'`. Returns `{ success: true }`.

### Task 7.5 — Employee Directory Page

Implement `/people/employees/page.tsx` as a Server Component that fetches employees and passes data to the `EmployeesTable` and `PendingInvitationsTable` client components via props. Tabs managed with client-side state. "Invite Employee" button opens `InviteEmployeeDialog`.

### Task 7.6 — Employee Detail Page

Implement `/people/employees/[id]/page.tsx`. Fetches the profile by id via `requireProfile()` ensuring the employee belongs to the current workspace. Renders `EmployeeDetailForm` (client component) with pre-populated values. "Remove employee" button opens `RemoveEmployeeDialog`.

### Task 7.7 — Departments Page

Implement `/people/departments/page.tsx`. Fetches departments with member counts. Renders `DepartmentsTable`. "Create Department" button opens a modal with `DepartmentForm`. Edit action opens a `Sheet` with the same form pre-populated.

### Task 7.8 — Employee Role Editor

Implement `EmployeeRoleEditor` with add/remove role functionality. Wire last-admin check: before allowing removal of an Admin role, call a query that counts remaining Admin-role users in the company. If count would drop to zero, show inline error and block the mutation.

### Task 7.9 — Avatar Upload in Employee Detail

Extend the employee detail form to include an avatar upload field using the `LogoUploader` component (from Phase 5) pointed at the `avatars` bucket with folder `[user_id]`. On successful upload, update `profiles.avatar_url`.

### Task 7.10 — Sidebar People Section Gating

Ensure the People section in the sidebar (Employees, Departments, Roles) is gated on `PERMISSIONS.PEOPLE.READ`. Users without this permission do not see the People section in the sidebar at all.

---

## Testing Checklist

```
✓ Migration 0010: departments and employee_invitations tables created with correct schema
✓ Migration 0010: profiles.department_id, job_title, employee_id columns added
✓ RLS: employee in company A cannot read profiles from company B
✓ RLS: company member can read all profiles in their company
✓ invite-employee: sends invitation email to new email address
✓ invite-employee: upserts invitation for already-pending email (resend scenario)
✓ invite-employee: blocked for email already an active company member
✓ invite-employee: permission check blocks caller without people.create.employee
✓ accept-invite: new user completes form, profile.company_id set correctly
✓ accept-invite: user_roles entry created with correct role_id and company_id
✓ accept-invite: invitation.status updated to 'accepted'
✓ accept-invite: expired invitation blocked with correct error message
✓ accept-invite: revoked invitation blocked with correct error message
✓ accept-invite: existing Supabase Auth user accepting invite links to company correctly
✓ remove-employee: profile.company_id and department_id set to null
✓ remove-employee: user_roles entries for the company deleted
✓ remove-employee: RLS immediately blocks removed employee's company-scoped data access
✓ remove-employee: last-admin check blocks removal of only Admin user
✓ Employee directory: lists all active company employees with name, role, department
✓ Employee directory: search filters by name and email correctly
✓ Employee directory: department and role filters work independently and together
✓ Pending invitations tab: shows pending invitations with expiry status
✓ Pending invitations tab: Resend updates expires_at and re-sends email
✓ Pending invitations tab: Revoke updates status to 'revoked'; revoked row still visible
✓ Employee detail: pre-populated with correct profile data
✓ Employee detail: job title, department, employee ID save correctly
✓ Employee detail: avatar upload stores file in avatars/[user_id]/ and updates avatar_url
✓ Employee role editor: add role creates user_roles entry; remove role deletes it
✓ Employee role editor: last-admin removal blocked with inline error message
✓ Departments: create department with name and head; appears in list
✓ Departments: delete department blocked when employees are assigned
✓ Departments: member count reflects actual profiles count per department
✓ Sidebar: users without people.read.employee do not see the People section
✓ Invite form: duplicate active member email shows inline error before submission
✓ All People pages pass axe-core accessibility scan
✓ pnpm build: no TypeScript errors
✓ pnpm lint: zero warnings
```

---

## Acceptance Criteria

```
AC-7.1   Migration 0010 applied; departments and employee_invitations tables exist with RLS
AC-7.2   invite-employee Edge Function sends invitation email; creates invitation record
AC-7.3   accept-invite Edge Function sets company_id, creates user_roles, marks invitation accepted
AC-7.4   remove-employee Edge Function clears company membership; RLS immediately enforced
AC-7.5   Employee directory lists all active employees with correct department and role data
AC-7.6   Employee detail form saves job title, department, employee ID, and avatar
AC-7.7   Pending invitations tab shows active invitations; resend and revoke work correctly
AC-7.8   Expired invitations display overdue badge; acceptance blocked by Edge Function
AC-7.9   Departments page: create, edit, delete work; member count is accurate
AC-7.10  Employee role editor: add and remove roles update user_roles correctly
AC-7.11  Last-admin safeguard: removing sole Admin role blocked with error message
AC-7.12  People section in sidebar hidden from users without people.read.employee permission
AC-7.13  Avatar upload stored in avatars bucket at correct path; public URL saved to profile
AC-7.14  All employee management operations scoped to the authenticated user's company_id
```

---

## Definition of Done

Phase 7 is complete when all Acceptance Criteria above are met AND:

- [ ] All TypeScript checks pass (zero errors)
- [ ] All ESLint checks pass (zero warnings)
- [ ] All Prettier checks pass
- [ ] Migration 0010 applied and committed; database.ts regenerated
- [ ] Full invitation lifecycle tested: invite → email → accept → directory → remove
- [ ] Existing-user invite tested: user already on platform accepts invite from new company
- [ ] Permission gating tested with Staff user (no invite/remove actions visible)
- [ ] invite-employee, accept-invite, remove-employee Edge Functions deployed to staging
- [ ] Last-admin removal blocked at both client and Edge Function level
- [ ] Avatar upload and removal tested in employee detail
- [ ] Department deletion blocking tested (employees assigned to department)
- [ ] PR merged to `develop` with at least 1 reviewer approval
- [ ] `feature/07-employee-management` branch merged and deleted
- [ ] Milestone M2 (Authentication & Workspace) retrospective completed

---

## Risk Factors

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Supabase Auth inviteUserByEmail() sending duplicate emails on rapid resend | Medium | Low | Upsert invitation record before calling Auth API; show 60s cooldown on Resend button |
| Invited user loses magic link before accepting (7-day window) | Low | Low | Resend action available in Pending Invitations tab; re-sends a fresh link |
| accept-invite called before OTP verification completes (race condition) | Low | Medium | Call accept-invite only after verifyOtp() resolves successfully in the accept-invite page handler |
| Employee removal not immediately revoking active JWT session | Medium | Low | Document as known limitation: full session revocation requires JWT blocklist (not in v1). RLS blocks data access within the valid window. |
| Department deletion cascading to profiles unexpectedly | Low | Medium | ON DELETE SET NULL on profiles.department_id — safe. Block delete in UI if members exist; enforce in remove-employee logic |
| useEmployees() query becomes slow as company grows beyond 500 employees | Low | Medium | Add server-side pagination to the employees query in Phase 31 performance audit |

---

## Best Practices

- All employee write operations (invite, remove, role changes) go through Edge Functions — never direct client-side inserts to user_roles or profiles for other users
- Always invalidate `['employees', company_id]` and `['invitations', company_id]` TanStack Query keys after any mutation so the directory stays in sync
- Store avatar URLs in the `profiles.avatar_url` column immediately after upload — do not rely on reconstructing the URL from the storage path
- Test the invitation flow on staging before each release — Supabase Auth email sending behaves differently on local vs remote instances
- Regenerate `database.ts` types after migration 0010 and commit in the same PR as the migration

---

## Estimated Completion

**4–5 working days** for a single developer. The invitation lifecycle (invite → email → accept) and the Edge Function integration are the most time-intensive parts. Allow an extra day for end-to-end testing of the existing-user invite scenario.

---

**** END OF PART 2 ****

---

# PHASE 8 — VENDOR REGISTRATION & ONBOARDING

---

## Overview

| Field | Value |
|---|---|
| Phase Number | 8 |
| Phase Name | Vendor Registration & Onboarding |
| Milestone | M3 — Vendor & Product Ecosystem |
| PRD Reference | Module 5 — Vendor Registration & Onboarding |
| DESIGN Reference | Section 2 (Vendor Onboarding Wizard), Section 3 (Vendor Settings), F01, F03 |
| Estimated Duration | 4–5 days |
| Prerequisite Phases | Phase 1, Phase 2, Phase 3, Phase 4 |

---

## Purpose

Phase 8 implements the complete vendor registration and onboarding flow. A supplier visits VendorFlow, registers as a vendor entity, verifies their email, completes a multi-step onboarding wizard that captures their business details, and arrives at the vendor dashboard with an operational vendor workspace.

This phase mirrors Phase 5 (Company Workspace) but for the vendor side of the platform. After Phase 8, the vendor ecosystem has its foundational layer — vendor workspaces exist, are correctly tenanted, and can be discovered by company buyers in Phase 9.

---

## Business Goal

A marketplace platform only has value when both sides are present. Vendors must be able to self-register quickly and with minimal friction before they can be discovered by buyers. The onboarding wizard captures enough information for the platform administrator to verify the vendor (Phase 28) and for company buyers to evaluate them (Phase 9). An incomplete or confusing vendor registration flow translates directly to an empty vendor marketplace.

---

## Dependencies

- Phase 3 complete (`vendors` table with RLS, `vendor-logos` and `vendor-documents` storage buckets)
- Phase 4 complete (Supabase Auth email/password and Google OAuth, `enrich-profile` Edge Function)
- Phase 2 `FormSection`, `LogoUploader`, `OnboardingWizard`-style pattern established
- Phase 3 `create-vendor` Edge Function stub (implemented fully here)

---

## Database Tables

Phase 8 writes to the `vendors` table (created in Phase 3) and adds vendor-specific onboarding progress tracking using the same `onboarding_progress` table from Phase 5 (with `workspace_type = 'vendor'`).

**`vendors` table — columns populated during Phase 8:**

| Column | Populated by | When |
|---|---|---|
| `id` | `create-vendor` Edge Function | Onboarding step 1 |
| `name` | Onboarding wizard | Step 1 |
| `slug` | Auto-generated | Step 1 (server-side) |
| `legal_name` | Onboarding wizard | Step 2 (optional) |
| `gstin` | Onboarding wizard | Step 2 (optional) |
| `pan` | Onboarding wizard | Step 2 (optional) |
| `category` | Onboarding wizard | Step 1 (multi-select) |
| `description` | Onboarding wizard | Step 2 |
| `logo_url` | Logo upload | Step 3 (optional) |
| `website` | Onboarding wizard | Step 2 (optional) |
| `address_*`, `city`, `state`, `pincode` | Onboarding wizard | Step 2 |
| `phone` | Onboarding wizard | Step 2 |
| `email` | Onboarding wizard | Step 1 |
| `verification_status` | Default `'unverified'` | Set on creation |
| `onboarding_complete` | `complete-vendor-onboarding` | Step 4 completion |

**Migration `0011_vendor_onboarding_helpers.sql`:**

```sql
-- ============================================================
-- Migration: 0011_vendor_onboarding_helpers
-- Description: Indexes and helper function for vendor context
-- ============================================================

-- Helper: get current user's vendor_id
-- (already defined as get_my_vendor_id() in migration 0002 — no redefinition needed)
-- Additional index for vendor category search (array column)
create index idx_vendors_category on public.vendors using gin(category);

-- Index for vendor reputation score sorting on marketplace
create index idx_vendors_reputation_score on public.vendors(reputation_score desc);
```

---

## Relationships

```
auth.users
  └── public.profiles
        └── public.vendors (N:1, vendor_id FK → vendors.id)
              Updated by create-vendor Edge Function

auth.users
  └── public.onboarding_progress (workspace_type = 'vendor')
        Reuses the same table as Phase 5 with different workspace_type

Vendor workspace routing:
  (vendor)/ routes → read profile.vendor_id → scope all queries to vendors.id
```

---

## API Endpoints

| Operation | Method | Implementation | Notes |
|---|---|---|---|
| Create vendor workspace | Edge Function | `create-vendor` | Service role; creates vendor row + updates profile.vendor_id |
| Get vendor profile | Server Component | `supabase.from('vendors').select()` | RLS scopes to own vendor |
| Update vendor profile | Client mutation | `supabase.from('vendors').update()` | RLS enforces ownership |
| Upload vendor logo | Client | `supabase.storage.from('vendor-logos').upload()` | Returns public URL |
| Save onboarding progress | Client | `supabase.from('onboarding_progress').upsert()` | workspace_type = 'vendor' |
| Get onboarding progress | Server Component | `supabase.from('onboarding_progress').select()` | Resumes wizard |
| Complete onboarding | Edge Function | `complete-vendor-onboarding` | Sets vendors.onboarding_complete = true |
| Get vendor context | Server Component | `requireProfile()` | Used in all vendor layouts |

**`supabase/functions/create-vendor/index.ts`** (full implementation):

```typescript
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { handleCors } from '../_shared/cors.ts'
import { getAuthenticatedUser } from '../_shared/auth.ts'
import { errorResponse } from '../_shared/error.ts'
import { successResponse } from '../_shared/response.ts'

interface CreateVendorPayload {
  name:     string
  email:    string
  category: string[]
}

Deno.serve(async (req) => {
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse

  try {
    const { user } = await getAuthenticatedUser(req)
    const payload: CreateVendorPayload = await req.json()

    if (!payload.name?.trim()) throw new Error('Vendor name is required')
    if (!payload.email?.trim()) throw new Error('Business email is required')

    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Check profile does not already have a vendor_id
    const { data: profile } = await adminClient
      .from('profiles')
      .select('vendor_id')
      .eq('id', user.id)
      .single()

    if (profile?.vendor_id) {
      return errorResponse('Vendor workspace already exists for this user', 409)
    }

    // Generate unique slug
    const baseSlug = payload.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    const { data: existing } = await adminClient
      .from('vendors').select('id').eq('slug', baseSlug).maybeSingle()
    const slug = existing
      ? `${baseSlug}-${Math.random().toString(36).slice(2, 6)}`
      : baseSlug

    // Create vendor
    const { data: vendor, error: vendorError } = await adminClient
      .from('vendors')
      .insert({
        name:     payload.name.trim(),
        slug,
        email:    payload.email.trim().toLowerCase(),
        category: payload.category ?? [],
      })
      .select()
      .single()

    if (vendorError) throw vendorError

    // Link vendor to user profile and set role
    const { error: profileError } = await adminClient
      .from('profiles')
      .update({ vendor_id: vendor.id, role: 'vendor_user' })
      .eq('id', user.id)

    if (profileError) throw profileError

    return successResponse({ vendor_id: vendor.id, slug })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return errorResponse(message, 400)
  }
})
```

---

## Supabase Services Used

```
Supabase Database:
  - public.vendors              — created and updated during onboarding and settings
  - public.profiles             — vendor_id set after vendor creation
  - public.onboarding_progress  — wizard state (workspace_type = 'vendor')

Supabase Storage:
  - vendor-logos bucket         — logo upload during onboarding Step 3 and settings
  - vendor-documents bucket     — used in Phase 11 (referenced here for bucket awareness)

Supabase Edge Functions:
  - create-vendor               — creates vendor record with service role
  - complete-vendor-onboarding  — marks onboarding complete, cleans up progress row
  - enrich-profile              — sets role = 'vendor_user' in user_metadata (Phase 4)
```

---

## Folder Structure

```
src/
├── app/
│   ├── vendor-onboarding/
│   │   ├── layout.tsx                      [Vendor onboarding shell — no sidebar]
│   │   └── page.tsx                        [Vendor wizard host page]
│   └── (vendor)/
│       └── settings/
│           ├── page.tsx                    [Redirects to /vendor/settings/profile]
│           ├── profile/
│           │   └── page.tsx                [Vendor profile settings]
│           └── workspace/
│               └── page.tsx                [Vendor workspace preferences]
├── components/
│   └── modules/
│       └── vendor-workspace/
│           ├── vendor-onboarding-wizard.tsx
│           ├── step-vendor-basics.tsx
│           ├── step-vendor-details.tsx
│           ├── step-vendor-logo.tsx
│           ├── step-vendor-finish.tsx
│           ├── vendor-profile-form.tsx
│           ├── vendor-category-selector.tsx
│           └── index.ts
└── hooks/
    └── use-vendor-workspace.ts
```

---

## UI Screens

### Screen 8.1 — Vendor Onboarding Wizard (`/vendor-onboarding`)

Full-screen layout, no sidebar. Four-step wizard with the same `OnboardingStepIndicator` pattern from Phase 5.

**Step 1 — Vendor Basics:**
- Vendor/business name (required)
- Business email (required)
- Category multi-select (required, min 1)
- "Continue" button

**Step 2 — Business Details:**
- Legal name, GSTIN, PAN, description, website, phone
- Full address: line 1, line 2, city, state, pincode
- "Continue" and "Skip for now" buttons

**Step 3 — Logo Upload:**
- Same `LogoUploader` component pointed at `vendor-logos` bucket
- "Continue" and "Skip for now"

**Step 4 — Finish:**
- Summary card: vendor name, category badges, logo
- Verification status notice: "Your account will be reviewed by our team before appearing on the marketplace."
- "Go to Vendor Dashboard" button

---

### Screen 8.2 — Vendor Registration Landing (`/register/vendor`)

This is the Phase 4 vendor registration page (already built). Phase 8 connects its post-verification redirect to `/vendor-onboarding` instead of `/vendor/dashboard`.

---

### Screen 8.3 — Vendor Profile Settings (`/vendor/settings/profile`)

`PageHeader`: title "Business Profile", breadcrumb Settings → Business Profile.

`FormSection` panels:
1. **Business Identity** — name, legal name, categories, description, website
2. **Tax & Compliance** — GSTIN, PAN
3. **Contact Information** — phone, email, address fields
4. **Business Logo** — `LogoUploader`, current logo preview, remove

---

### Screen 8.4 — Vendor Workspace Preferences (`/vendor/settings/workspace`)

Sections:
1. **General** — display name, timezone, locale
2. **Bank Details** — account holder name, account number, IFSC, bank name (stored encrypted via Edge Function in Phase 19)

---

## Components

### `VendorCategorySelector`

Multi-select checkgroup for vendor supply categories. Rendered as a two-column grid of checkboxes. Categories are a fixed predefined list matching the `INDUSTRIES` list from Phase 5 plus additional supply-chain categories.

```typescript
interface VendorCategorySelectorProps {
  value:     string[]
  onChange:  (categories: string[]) => void
  maxSelect?: number     // default: no limit
  error?:    string
}
```

All other wizard components (`VendorOnboardingWizard`, `StepVendorBasics`, etc.) follow the identical pattern established by the company wizard in Phase 5 — same state management, same progress persistence, same `OnboardingStepIndicator`. No new patterns are introduced.

---

## Forms

### Form 8.1 — Vendor Basics (Step 1)

| Field | Type | Validation |
|---|---|---|
| Vendor name | text input | Required, min 2 chars, max 100 chars |
| Business email | email input | Required, valid email format |
| Category | multi-select checkgroup | Required, min 1 selection |

```typescript
const vendorBasicsSchema = z.object({
  name:     z.string().min(2).max(100),
  email:    z.string().email(),
  category: z.array(z.string()).min(1, 'Select at least one category'),
})
```

---

### Form 8.2 — Vendor Details (Step 2)

Identical field set and Zod schema to Phase 5 Form 5.2 (company details), with the addition of:

| Field | Type | Validation |
|---|---|---|
| Business description | textarea | Optional, max 500 chars |

All address, GSTIN, PAN, website, and pincode validation rules are identical to Phase 5.

---

### Form 8.3 — Vendor Profile Settings Form

Pre-populated from existing `vendors` record. Independent save per `FormSection`. Same pattern as Phase 5 company settings.

---

## Tables

Phase 8 introduces no list/table UI — all screens are wizard or settings forms. The `vendors` table is written to but not displayed in a table in this phase (display happens in Phase 9 Marketplace).

---

## Permissions

```
Vendor onboarding (/vendor-onboarding):
  - Requires authenticated session (role = 'vendor_user')
  - If profile.vendor_id already set AND vendors.onboarding_complete = true:
    redirect to /vendor/dashboard

Vendor settings (/vendor/settings/*):
  - Requires authenticated session with role = 'vendor_user'
  - Requires profile.vendor_id to be set
  - Any vendor_user can update their own vendor profile (single-user workspace in v1)

RLS enforcement:
  - vendors UPDATE policy: id = get_my_vendor_id()
  - onboarding_progress: all operations require user_id = auth.uid()
```

---

## Validation Rules

```
Vendor name:       2–100 characters; slug uniqueness enforced by DB constraint
Business email:    Valid email; stored as the vendor's primary contact email
Category:          Min 1 selection; values must be from the predefined category list
Description:       Optional; max 500 characters
GSTIN / PAN:       Same regex rules as Phase 5 (Form 5.2)
Logo:              JPEG, PNG, WebP, SVG — max 5MB (vendor-logos bucket config)
Vendor slug:       Auto-derived from name; max 80 characters; URL-safe characters only
```

---

## Business Rules

```
BR-8.1  A user can register as both a company (Phase 5) and a vendor (Phase 8) under
        the same email address. profile.company_id and profile.vendor_id can both be set.
        The active context is determined by the current route group ((dashboard) vs (vendor)).

BR-8.2  A vendor workspace starts with verification_status = 'unverified'. Vendors are
        not visible on the company-side Marketplace until status = 'verified' (Phase 28).
        Vendors can complete their entire profile before verification.

BR-8.3  The vendor onboarding wizard follows the same 4-step pattern as Phase 5 company
        onboarding. Progress is persisted to onboarding_progress with workspace_type = 'vendor'.

BR-8.4  The finish step shows a verification status notice. This is informational only —
        the vendor proceeds to the dashboard regardless of verification status.

BR-8.5  Vendor slug is auto-derived and cannot be changed by the vendor after creation.
        The slug is used in public-facing vendor profile URLs (Phase 10).

BR-8.6  Vendor bank details captured in workspace preferences (Step 4 or settings) are
        stored via a secure Edge Function in Phase 19. In Phase 8 the bank details form
        is rendered as a placeholder with "Coming soon" state.
```

---

## Security

```
  - create-vendor Edge Function uses service role key; validates JWT before any write
  - profile.vendor_id set atomically by the Edge Function — client cannot self-assign
  - Vendor logo upload: Storage RLS scopes writes to vendor-logos/[vendor_id]/
  - verification_status cannot be updated by the vendor (no UPDATE policy for that column
    via anon-key client). Only platform admins and Edge Functions can update it.
  - onboarding_progress RLS: user_id = auth.uid() — no cross-user access
  - complete-vendor-onboarding validates JWT and confirms vendor_id matches profile.vendor_id
    before setting onboarding_complete = true
```

---

## State Management

**`src/hooks/use-vendor-workspace.ts`** — fetches and caches the current vendor record:

```typescript
'use client'

import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/auth-store'
import { useSupabase } from './use-supabase'

export function useVendorWorkspace() {
  const supabase = useSupabase()
  const profile  = useAuthStore((s) => s.profile)

  return useQuery({
    queryKey: ['vendor', profile?.vendor_id],
    queryFn: async () => {
      if (!profile?.vendor_id) return null
      const { data, error } = await supabase
        .from('vendors')
        .select('*')
        .eq('id', profile.vendor_id)
        .single()
      if (error) throw error
      return data
    },
    enabled: !!profile?.vendor_id,
    staleTime: 5 * 60 * 1000,
  })
}
```

No new Zustand stores. The vendor context follows the same pattern as `useWorkspace()` from Phase 5.

---

## Development Tasks

### Task 8.1 — Migration and Index

Apply migration `0011_vendor_onboarding_helpers.sql`. Regenerate `database.ts` types.

### Task 8.2 — create-vendor and complete-vendor-onboarding Edge Functions

Deploy both functions. Test: vendor creation sets `profile.vendor_id` and `role = 'vendor_user'`. Complete-onboarding sets `onboarding_complete = true` and deletes the `onboarding_progress` row.

### Task 8.3 — Vendor Onboarding Wizard

Implement `/vendor-onboarding/page.tsx` and all four step components. Reuse `OnboardingStepIndicator` and `LogoUploader` from Phase 5. Wire `VendorCategorySelector` into Step 1.

### Task 8.4 — Update verify-email Routing

Extend the `/verify-email` page to detect whether the user is a `vendor_user` (from `user_metadata.role`) and redirect to `/vendor-onboarding` instead of `/onboarding`.

### Task 8.5 — Vendor Dashboard Layout

Update `(vendor)/layout.tsx` (stub from Phase 2) to call `requireProfile()`, confirm `role = 'vendor_user'`, and pass the real vendor workspace data to `WorkspaceSwitcher` and `TopNavigation`.

### Task 8.6 — Vendor Onboarding Guard

Add route guard to `/vendor-onboarding/layout.tsx`: if `profile.vendor_id` is set and `onboarding_complete = true`, redirect to `/vendor/dashboard`.

### Task 8.7 — Vendor Profile and Workspace Settings Pages

Implement `/vendor/settings/profile` and `/vendor/settings/workspace` following the same FormSection pattern as Phase 5 company settings.

### Task 8.8 — Vendor Dashboard Stub Page

Create a minimal `/vendor/dashboard/page.tsx` that shows the vendor's name, verification status badge, and a "Profile incomplete" prompt if onboarding_complete is false. Full dashboard KPIs are implemented in Phase 24.

---

## Testing Checklist

```
✓ Vendor registration → email verification → redirect to /vendor-onboarding
✓ Step 1: vendor name, email, category required; wizard blocks advance without them
✓ create-vendor: vendor row created; profile.vendor_id set; role = 'vendor_user'
✓ create-vendor: duplicate request returns 409
✓ Wizard progress persisted to onboarding_progress (workspace_type = 'vendor')
✓ Wizard resumes at correct step after browser close and re-login
✓ Logo upload to vendor-logos bucket; URL saved to vendors.logo_url
✓ complete-vendor-onboarding: onboarding_complete = true; progress row deleted
✓ Vendor guard: onboarding_complete user redirected to /vendor/dashboard
✓ Vendor profile settings: pre-populated; saves correctly
✓ verification_status: cannot be changed by vendor (client update attempt fails at RLS)
✓ Same-user company + vendor: company workspace and vendor workspace both accessible
✓ WorkspaceSwitcher: shows real vendor name in vendor dashboard layout
✓ Vendor dashboard stub: renders vendor name and verification status badge
✓ pnpm build: no TypeScript errors; pnpm lint: zero warnings
```

---

## Acceptance Criteria

```
AC-8.1   Vendor registration → verification → /vendor-onboarding redirect works end-to-end
AC-8.2   create-vendor Edge Function creates vendor row; profile.vendor_id set atomically
AC-8.3   Wizard progress persisted; resume-from-step works after browser close
AC-8.4   Logo upload to vendor-logos bucket; URL stored in vendors.logo_url
AC-8.5   complete-vendor-onboarding sets onboarding_complete; cleans up progress row
AC-8.6   Vendor profile settings form pre-populated; saves updates to vendors table
AC-8.7   verification_status not updatable by vendor client (RLS blocks it)
AC-8.8   Vendor dashboard layout shows real vendor name and verification badge
AC-8.9   Dual-workspace user can switch between company and vendor contexts via WorkspaceSwitcher
```

---

## Definition of Done

Phase 8 is complete when all Acceptance Criteria above are met AND:

- [ ] All TypeScript checks pass (zero errors)
- [ ] All ESLint checks pass (zero warnings)
- [ ] Migration 0011 applied and committed; database.ts regenerated
- [ ] create-vendor and complete-vendor-onboarding Edge Functions deployed to staging
- [ ] Full vendor onboarding flow tested end-to-end
- [ ] Dual-workspace scenario tested (same user, company + vendor)
- [ ] PR merged to `develop` with at least 1 reviewer approval
- [ ] `feature/08-vendor-registration` branch merged and deleted

---

## Risk Factors

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| verify-email routing logic becomes complex with company + vendor branching | Medium | Low | Read role from user_metadata (set by enrich-profile in Phase 4); single conditional redirect |
| create-vendor called while existing vendor_id is set | Low | Medium | Idempotency check in Edge Function; return 409 if vendor_id already present |
| Vendor onboarding_progress conflicts with company progress (same table) | Low | Low | workspace_type discriminator column prevents conflicts; unique constraint on (user_id, workspace_type) |

---

## Best Practices

- Reuse all Phase 5 onboarding patterns exactly — do not create new wizard abstractions for vendors
- Regenerate `database.ts` after migration 0011 and commit in the same PR
- Test the dual-workspace scenario (company + vendor) explicitly before merging

---

## Estimated Completion

**4–5 working days.** The majority of the work is configuration and reuse of Phase 5 patterns. The unique parts are the `create-vendor` Edge Function, `VendorCategorySelector`, and the dual-workspace routing logic.

---

---

# PHASE 9 — VENDOR MARKETPLACE

---

## Overview

| Field | Value |
|---|---|
| Phase Number | 9 |
| Phase Name | Vendor Marketplace |
| Milestone | M3 — Vendor & Product Ecosystem |
| PRD Reference | Module 6 — Vendor Marketplace & Discovery |
| DESIGN Reference | Section 3 (Marketplace), F01, F03 |
| Estimated Duration | 3–4 days |
| Prerequisite Phases | Phase 1, Phase 2, Phase 3, Phase 5, Phase 6, Phase 8 |

---

## Purpose

Phase 9 builds the company-side vendor discovery experience. Authenticated company users can browse all verified vendors on the Marketplace, search by name, filter by category, sort by reputation score or order count, and add vendors to their connected vendor network. The Marketplace is the entry point for sourcing new suppliers.

---

## Business Goal

A procurement platform is only useful if buyers can find qualified suppliers. The Marketplace converts the vendor ecosystem built in Phase 8 into a searchable, filterable supplier directory that company procurement teams can use to quickly identify and shortlist vendors before creating RFQs. Discovery friction directly reduces RFQ volume — Phase 9 eliminates it.

---

## Dependencies

- Phase 8 complete (verified vendors exist in the `vendors` table)
- Phase 5 complete (company workspace with `company_id`)
- Phase 6 complete (`PERMISSIONS.VENDORS.READ` and `PERMISSIONS.VENDORS.CREATE` for gating)
- Phase 2 `DataTable`, `EmptyState`, `PageHeader`, `StatusBadge`, `KPICard` components
- Phase 3 RLS policies (company users can read `verification_status = 'verified'` vendors)

---

## Database Tables

Migration: `0012_create_vendor_connections.sql`

```sql
-- ============================================================
-- Migration: 0012_create_vendor_connections
-- Description: Company-to-vendor connection (shortlisting)
-- ============================================================

create table public.vendor_connections (
  id            uuid primary key default gen_random_uuid(),
  company_id    uuid not null references public.companies(id) on delete cascade,
  vendor_id     uuid not null references public.vendors(id)  on delete cascade,
  connected_by  uuid not null references auth.users(id),
  notes         text,
  is_preferred  boolean not null default false,
  connected_at  timestamptz not null default now(),
  constraint vendor_connections_unique unique (company_id, vendor_id)
);

create index idx_vendor_connections_company_id on public.vendor_connections(company_id);
create index idx_vendor_connections_vendor_id  on public.vendor_connections(vendor_id);

alter table public.vendor_connections enable row level security;

create policy "vendor_connections_company_rw"
  on public.vendor_connections for all
  using (company_id = public.get_my_company_id());
```

---

## Relationships

```
public.companies (1)
  └── public.vendor_connections (N)
        └── public.vendors (1) — the connected vendor

Marketplace query path (company user):
  vendors WHERE verification_status = 'verified'
  LEFT JOIN vendor_connections ON vendor_connections.vendor_id = vendors.id
    AND vendor_connections.company_id = get_my_company_id()
  → is_connected = vendor_connections.id IS NOT NULL
```

---

## API Endpoints

| Operation | Method | Implementation | Notes |
|---|---|---|---|
| List marketplace vendors | Server Component | `supabase.from('vendors').select()` with filters | Only verification_status = 'verified'; includes connection status |
| Search vendors | Client (TanStack Query) | `supabase.from('vendors').select().ilike('name', '%q%')` | Full-text with pg_trgm index |
| Filter vendors by category | Client query | `.contains('category', [cat])` | Uses GIN index on category array |
| Get vendor connection status | Server Component | `supabase.from('vendor_connections').select()` | LEFT JOIN pattern |
| Add vendor to network | Client mutation | `supabase.from('vendor_connections').insert()` | Requires vendors.create permission |
| Remove vendor from network | Client mutation | `supabase.from('vendor_connections').delete()` | Requires vendors.update permission |
| Toggle preferred status | Client mutation | `supabase.from('vendor_connections').update({ is_preferred })` | |
| List connected vendors | Server Component | `supabase.from('vendor_connections').select('*, vendors(*)')` | My Vendors tab |

---

## Supabase Services Used

```
Supabase Database:
  - public.vendors              — read (verification_status = 'verified' via RLS policy)
  - public.vendor_connections   — CRUD for company-vendor network

Supabase Realtime:
  - Not used in Phase 9

Supabase Storage:
  - vendor-logos bucket         — public read for logo display in marketplace cards
```

---

## Folder Structure

```
src/
├── app/
│   └── (dashboard)/
│       └── vendors/
│           ├── marketplace/
│           │   └── page.tsx                [Marketplace browse page]
│           └── connected/
│               └── page.tsx                [My Vendors page]
├── components/
│   └── modules/
│       └── vendors/
│           ├── marketplace-grid.tsx
│           ├── vendor-card.tsx
│           ├── vendor-filters.tsx
│           ├── vendor-search-bar.tsx
│           ├── connected-vendors-table.tsx
│           ├── add-vendor-button.tsx
│           └── index.ts
└── hooks/
    └── use-marketplace.ts
```

---

## UI Screens

### Screen 9.1 — Vendor Marketplace (`/vendors/marketplace`)

`PageHeader`: title "Vendor Marketplace", description "Discover and connect with verified suppliers."

**Layout:** Filter sidebar (left, 240px) + card grid (right, responsive).

**Filter sidebar:**
- Search bar (full-text search on vendor name)
- Category multi-select checkboxes
- Sort by: Reputation Score, Total Orders, Name A–Z, Recently Added
- "Clear filters" link

**Vendor card grid:** 3 columns desktop, 2 tablet, 1 mobile. Each `VendorCard` displays:
- Logo (or initials fallback)
- Vendor name + verification badge
- Category badges (max 3, "+ N more" if overflow)
- Reputation score (star rating)
- Total orders count
- "Add to Network" button (if not connected) / "Connected" badge (if connected)
- Click navigates to vendor profile (Phase 10)

**Empty state:** "No vendors found matching your filters. Try adjusting your search or category selection."

---

### Screen 9.2 — My Vendors (`/vendors/connected`)

`PageHeader`: title "My Vendors", action "Browse Marketplace" (links to Marketplace).

Two tabs: **Connected** | **Preferred**

`DataTable` with columns:

| Column | Description |
|---|---|
| Vendor | Logo + name + categories |
| Verification | StatusBadge (verified/unverified) |
| Reputation | Star rating + score |
| Orders | Total order count with this vendor |
| Connected on | Date |
| Preferred | Toggle star icon |
| Actions | View profile, Remove |

---

## Components

### `VendorCard`

```typescript
interface VendorCardProps {
  vendor: {
    id:                  string
    name:                string
    logo_url:            string | null
    category:            string[]
    reputation_score:    number
    total_orders:        number
    verification_status: string
  }
  isConnected:  boolean
  isPreferred?: boolean
  onConnect:    (vendorId: string) => void
  onDisconnect: (vendorId: string) => void
}
```

Card container: `bg-bg-surface border border-border-default rounded-lg p-4 hover:shadow-md transition-shadow`. "Add to Network" uses `Button` (default variant). "Connected" badge uses `StatusBadge` with status `'active'`.

### `VendorFilters`

Left-panel filter component managing search query, selected categories, and sort order as controlled state. Calls `onFiltersChange` callback on every change. Debounces search input by 300ms.

### `MarketplaceGrid`

Renders a responsive CSS grid of `VendorCard` components. Handles loading state (skeleton grid of 12 cards) and empty state.

### `ConnectedVendorsTable`

Wraps the shared `DataTable` with vendor-connection-specific columns. Preferred toggle calls `vendor_connections.update`. Remove calls delete mutation with `AlertDialog` confirmation.

---

## Forms

Phase 9 introduces no complex forms. The only form-like interaction is the "Add to Network" confirmation which accepts an optional `notes` field:

| Field | Type | Validation |
|---|---|---|
| Notes | textarea | Optional, max 300 chars — stored in vendor_connections.notes |

This is rendered inline below the "Add to Network" button or in a small popover, not a dedicated form page.

---

## Tables

### Connected Vendors Table

| Column | Sortable | Filterable |
|---|---|---|
| Vendor name + logo | Yes | Yes (search) |
| Categories | No | Yes (multi-select) |
| Verification status | No | Yes (dropdown) |
| Reputation score | Yes | No |
| Orders with vendor | Yes | No |
| Connected on | Yes | No |
| Preferred | Yes (preferred first) | Yes (toggle) |
| Actions | No | No |

Default sort: preferred vendors first, then by connected_at descending.

---

## Permissions

```
Marketplace (/vendors/marketplace):
  - View marketplace:      vendors.read.vendor
  - Add vendor to network: vendors.create.vendor
  - Remove from network:   vendors.update.vendor

My Vendors (/vendors/connected):
  - View connected list:   vendors.read.vendor
  - Toggle preferred:      vendors.update.vendor
  - Remove connection:     vendors.update.vendor

RLS:
  - vendors SELECT policy: verification_status = 'verified' OR vendor is own workspace
  - vendor_connections: company_id = get_my_company_id() (all operations)
```

---

## Validation Rules

```
Vendor search:
  - Query string: max 100 characters; trimmed before sending to Supabase
  - Debounced 300ms to avoid excessive DB queries on keystroke

Category filter:
  - Values must be from the predefined category list
  - Multiple selections are ANDed (vendor must supply ALL selected categories) — v1 behaviour
  - This is enforced by the .contains() Supabase query operator

Notes on connection:
  - Optional; max 300 characters
  - Stored as plain text; no HTML allowed
```

---

## Business Rules

```
BR-9.1  Only vendors with verification_status = 'verified' appear in the Marketplace.
        Unverified vendors are hidden from the company-side marketplace via RLS policy.

BR-9.2  A company can add any verified vendor to their network. There is no limit on
        the number of vendor connections in v1.

BR-9.3  Removing a vendor from the network (vendor_connections delete) does not delete
        any historical procurement records (RFQs, POs, invoices) with that vendor.
        It only removes the shortlist association.

BR-9.4  Preferred vendors are sorted to the top in the My Vendors list and are
        pre-populated in RFQ vendor selection dropdowns (Phase 16).

BR-9.5  The Marketplace is read-only for vendor users. A vendor cannot see the company's
        vendor_connections records — they cannot tell which companies have added them to
        their network.

BR-9.6  Marketplace search uses pg_trgm trigram matching for fuzzy name search.
        An exact name match always ranks first.
```

---

## Security

```
- vendors SELECT RLS (from Phase 3): company users can only read verified vendors
  (verification_status = 'verified' AND get_my_company_id() IS NOT NULL)
- vendor_connections RLS: all operations scoped to company_id = get_my_company_id()
- A vendor user cannot read or modify any vendor_connections records
  (no RLS policy exists for vendor_user role on vendor_connections)
- Notes field: plain text only; no HTML or markdown rendering
- Vendor logo URLs are public (vendor-logos bucket is public read) —
  no signed URLs needed for marketplace display
```

---

## State Management

**`src/hooks/use-marketplace.ts`**:

```typescript
'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSupabase } from './use-supabase'
import { useAuthStore } from '@/stores/auth-store'

interface MarketplaceFilters {
  search?:     string
  categories?: string[]
  sortBy?:     'reputation_score' | 'total_orders' | 'name' | 'created_at'
}

export function useMarketplace(filters: MarketplaceFilters = {}) {
  const supabase = useSupabase()
  const profile  = useAuthStore((s) => s.profile)

  return useQuery({
    queryKey: ['marketplace', filters, profile?.company_id],
    queryFn: async () => {
      let query = supabase
        .from('vendors')
        .select(`
          id, name, slug, logo_url, category, description,
          reputation_score, total_orders, verification_status, created_at,
          vendor_connections!left(id, is_preferred, company_id)
        `)
        .eq('verification_status', 'verified')
        .is('deleted_at', null)

      if (filters.search) {
        query = query.ilike('name', `%${filters.search}%`)
      }
      if (filters.categories?.length) {
        query = query.contains('category', filters.categories)
      }

      const sortCol = filters.sortBy ?? 'reputation_score'
      query = query.order(sortCol, { ascending: sortCol === 'name' })

      const { data, error } = await query
      if (error) throw error
      return data ?? []
    },
    enabled: !!profile?.company_id,
    staleTime: 2 * 60 * 1000,
  })
}

export function useAddVendorConnection() {
  const supabase     = useSupabase()
  const queryClient  = useQueryClient()
  const profile      = useAuthStore((s) => s.profile)

  return useMutation({
    mutationFn: async ({ vendorId, notes }: { vendorId: string; notes?: string }) => {
      const { error } = await supabase
        .from('vendor_connections')
        .insert({
          company_id:   profile!.company_id!,
          vendor_id:    vendorId,
          connected_by: profile!.id,
          notes:        notes ?? null,
        })
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketplace'] })
      queryClient.invalidateQueries({ queryKey: ['connected-vendors'] })
    },
  })
}
```

---

## Development Tasks

### Task 9.1 — Migration

Apply migration `0012_create_vendor_connections.sql`. Regenerate `database.ts` types.

### Task 9.2 — Marketplace Page

Implement `/vendors/marketplace/page.tsx` as a Server Component that fetches the initial vendor list (no filters, sorted by reputation_score desc). Pass to `MarketplaceGrid` client component. Filters and search are handled client-side via `useMarketplace()` hook with URL search param synchronization for shareable filter state.

### Task 9.3 — My Vendors Page

Implement `/vendors/connected/page.tsx`. Fetches `vendor_connections` with vendor details. Renders `ConnectedVendorsTable` with two-tab layout.

### Task 9.4 — Add/Remove Vendor Connection

Wire `AddVendorButton` to call `useAddVendorConnection()`. On success: toast "Vendor added to your network" and update `VendorCard` to show "Connected" badge (via query invalidation). Remove connection wired through `ConnectedVendorsTable` with `AlertDialog` confirmation.

### Task 9.5 — URL Filter Synchronization

Sync marketplace filters to URL search params using `useRouter` and `useSearchParams` from Next.js. This makes filtered views shareable and preserves filter state on browser back navigation.

### Task 9.6 — Sidebar Vendor Section Gating

Gate the Vendors section (Marketplace, My Vendors) behind `PERMISSIONS.VENDORS.READ`.

---

## Testing Checklist

```
✓ Marketplace: only verified vendors visible; unverified vendors do not appear
✓ Marketplace: search by vendor name returns matching results
✓ Marketplace: category filter narrows results correctly
✓ Marketplace: sort by reputation score, total orders, name all work correctly
✓ Marketplace: loading state shows skeleton grid of 12 cards
✓ Marketplace: empty state shown when no vendors match filters
✓ Add to network: vendor_connections row created; VendorCard shows "Connected" badge
✓ Add to network: duplicate connection attempt returns DB unique constraint error (handled gracefully)
✓ My Vendors: connected vendors listed with correct columns
✓ My Vendors: preferred toggle updates is_preferred; preferred vendors sort to top
✓ My Vendors: remove connection with confirmation deletes vendor_connections row
✓ URL params: marketplace filters reflected in URL; shareable link restores filters
✓ RLS: vendor user cannot read vendor_connections table
✓ RLS: company user cannot see unverified vendors in marketplace query
✓ Permission: user without vendors.read.vendor cannot access /vendors/marketplace
✓ pnpm build: no TypeScript errors; pnpm lint: zero warnings
```

---

## Acceptance Criteria

```
AC-9.1   Marketplace displays only verified vendors; RLS verified with direct query test
AC-9.2   Search, category filter, and sort all work independently and in combination
AC-9.3   Add to network creates vendor_connections row; My Vendors list updates
AC-9.4   Preferred toggle persists; preferred vendors sort first in My Vendors
AC-9.5   Remove connection deletes vendor_connections row; vendor reappears as unconnected in Marketplace
AC-9.6   Marketplace filters synchronize to URL search params
AC-9.7   Migration 0012 applied; vendor_connections table with correct RLS
AC-9.8   Vendors section hidden from users without vendors.read.vendor permission
```

---

## Definition of Done

Phase 9 is complete when all Acceptance Criteria above are met AND:

- [ ] All TypeScript checks pass (zero errors)
- [ ] All ESLint checks pass (zero warnings)
- [ ] Migration 0012 applied and committed; database.ts regenerated
- [ ] Marketplace tested with 5+ verified vendors seeded in local dev
- [ ] Filter URL synchronization verified with browser back navigation
- [ ] RLS verified: unverified vendor not visible in marketplace query
- [ ] PR merged to `develop` with at least 1 reviewer approval
- [ ] `feature/09-vendor-marketplace` branch merged and deleted

---

## Risk Factors

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| pg_trgm search slow without index on large vendor dataset | Low | Medium | idx_vendors_name_trgm GIN index created in Phase 3 migration — already in place |
| Marketplace page slow on first load with many vendors | Medium | Low | Server Component fetches initial data; client-side filtering on cached results; pagination added in Phase 31 |
| URL param deserialization causing infinite re-renders | Low | Medium | Parse URL params in a single `useMemo`; only call `setFilters` when params actually change |

---

## Best Practices

- Keep the marketplace query in a Server Component for the initial render — avoids flash of empty grid on first load
- Debounce the search input (300ms) before updating the query key to avoid a Supabase request on every keystroke
- Use `.contains()` for category filtering (GIN index on array column) — never use `.cs()` with a string; always pass a proper array

---

## Estimated Completion

**3–4 working days.** The Marketplace is primarily a read-heavy UI. The most complex part is the URL filter synchronization and the vendor card connection state management.

---

---

# PHASE 10 — VENDOR PROFILE

---

## Overview

| Field | Value |
|---|---|
| Phase Number | 10 |
| Phase Name | Vendor Profile |
| Milestone | M3 — Vendor & Product Ecosystem |
| PRD Reference | Module 7 — Vendor Profile & Performance |
| DESIGN Reference | Section 3 (Vendor Profile Page), F01, F03 |
| Estimated Duration | 3–4 days |
| Prerequisite Phases | Phase 8, Phase 9 |

---

## Purpose

Phase 10 builds the public-facing vendor profile page — the detailed view that company buyers see when they click through from the Marketplace or from any procurement record. It also builds the self-service profile management screens visible to the vendor from their own dashboard.

The vendor profile is the trust-building centrepiece of the platform. It consolidates business identity, verification status, performance metrics, category coverage, and product catalog into a single view.

---

## Business Goal

Company procurement teams need confidence before sending an RFQ to a new supplier. A complete vendor profile — with verified business details, a reputation score, order history, and uploaded compliance documents — replaces the manual due-diligence emails that currently precede every new vendor engagement. Phase 10 makes vendor evaluation self-service.

---

## Dependencies

- Phase 8 complete (`vendors` table, vendor workspace)
- Phase 9 complete (`vendor_connections` table; company users can reach vendor profiles)
- Phase 3 `vendor-documents` storage bucket
- Phase 2 `KPICard`, `ActivityFeed`, `StatusBadge`, `PageHeader` components

---

## Database Tables

Phase 10 does not create new tables. It reads from `vendors`, `vendor_connections`, and introduces two computed/aggregated views via RPC functions.

Migration `0013_vendor_profile_rpcs.sql`:

```sql
-- ============================================================
-- Migration: 0013_vendor_profile_rpcs
-- Description: RPC functions for vendor profile KPIs
-- ============================================================

-- Vendor performance summary — used on vendor profile page
create or replace function public.get_vendor_performance(p_vendor_id uuid)
returns table (
  total_orders        bigint,
  completed_orders    bigint,
  on_time_rate        numeric,
  avg_quality_score   numeric,
  total_companies     bigint,
  reputation_score    numeric
) language sql stable security definer as $$
  select
    v.total_orders,
    count(case when o.status = 'delivered' then 1 end) as completed_orders,
    case when v.total_orders > 0
      then round(
        count(case when o.status = 'delivered' and o.delivered_on_time = true then 1 end)::numeric
        / v.total_orders * 100, 1
      )
      else 0
    end as on_time_rate,
    coalesce(avg(r.quality_score), 0)::numeric as avg_quality_score,
    count(distinct vc.company_id) as total_companies,
    v.reputation_score
  from public.vendors v
  left join public.purchase_orders o on o.vendor_id = v.id
  left join public.reviews r         on r.vendor_id = v.id
  left join public.vendor_connections vc on vc.vendor_id = v.id
  where v.id = p_vendor_id
  group by v.total_orders, v.reputation_score;
$$;
```

Note: `purchase_orders` and `reviews` tables are created in Phases 20 and 24 respectively. Until those phases are complete, this RPC returns zero values for those columns — which is correct behaviour for a new vendor with no order history.

---

## Relationships

```
public.vendors (1)
  ├── public.vendor_connections (N) — which companies have connected
  ├── public.vendor_documents (N)   — uploaded compliance documents (Phase 11)
  ├── public.products (N)           — product catalog (Phase 12)
  ├── public.purchase_orders (N)    — order history (Phase 20)
  └── public.reviews (N)            — buyer reviews (Phase 24)

Vendor profile page data sources:
  vendors.*                          — identity and contact info
  get_vendor_performance(vendor_id)  — KPI metrics
  vendor_connections (count)         — connected companies count
  vendor_documents (Phase 11 data)   — document list
  products (Phase 12 data)           — catalog preview
```

---

## API Endpoints

| Operation | Method | Implementation | Notes |
|---|---|---|---|
| Get vendor profile (company view) | Server Component | `supabase.from('vendors').select('*').eq('id', id)` | Must be verified; connection status joined |
| Get vendor performance KPIs | Server Component | `supabase.rpc('get_vendor_performance', { p_vendor_id })` | Returns performance metrics |
| Get vendor profile (vendor self-view) | Server Component | `supabase.from('vendors').select('*').eq('id', profile.vendor_id)` | Own record, all fields |
| Update vendor profile | Client mutation | `supabase.from('vendors').update()` | Vendor self-update; RLS enforces vendor_id |

---

## Supabase Services Used

```
Supabase Database:
  - public.vendors                    — profile data
  - public.vendor_connections         — connection status and connected companies count
  - public.get_vendor_performance()   — performance KPI aggregation RPC

Supabase Storage:
  - vendor-logos bucket               — public logo display
  - vendor-documents bucket           — document list (Phase 11 adds the upload)
```

---

## Folder Structure

```
src/
├── app/
│   ├── (dashboard)/
│   │   └── vendors/
│   │       └── [slug]/
│   │           └── page.tsx            [Company-side vendor profile view]
│   └── (vendor)/
│       └── profile/
│           └── page.tsx                [Vendor self-view of their own profile]
└── components/
    └── modules/
        └── vendor-profile/
            ├── vendor-profile-header.tsx
            ├── vendor-performance-kpis.tsx
            ├── vendor-about-section.tsx
            ├── vendor-categories-section.tsx
            ├── vendor-contact-section.tsx
            └── index.ts
```

---

## UI Screens

### Screen 10.1 — Vendor Profile (Company View) (`/vendors/[slug]`)

Server Component page that fetches all vendor data by slug. Accessible to any authenticated company user who has `vendors.read.vendor` permission. Unverified vendors return 404 for company users.

**Layout:** Full-width page with sticky profile header and tabbed body.

**Profile Header (`VendorProfileHeader`):**
- Logo (large, 80×80)
- Vendor name (`text-display-sm`)
- Verification status badge
- Category badges (all)
- Location (city, state)
- Website link
- "Add to Network" / "Connected" button (top-right)
- "Send RFQ" button (top-right, Phase 16 wires this fully; placeholder here)

**Performance KPI Row (`VendorPerformanceKPIs`):**
Four `KPICard` components in a row:
1. Total Orders
2. On-Time Delivery Rate (%)
3. Average Quality Score (out of 5)
4. Connected Companies

**Tabbed body (shadcn `Tabs`):**
- **Overview** — business description, contact info, address
- **Products** — product catalog preview grid (Phase 12 populates this; placeholder "No products yet" in Phase 10)
- **Documents** — compliance document list (Phase 11 populates; placeholder in Phase 10)
- **Reviews** — buyer reviews and ratings (Phase 24 populates; placeholder in Phase 10)

---

### Screen 10.2 — Vendor Self-View (`/vendor/profile`)

The vendor's view of their own profile page. Same layout as Screen 10.1 but with an "Edit Profile" button that navigates to `/vendor/settings/profile` (Phase 8). Shows all fields including unverified status. Includes a banner when `verification_status = 'unverified'`: "Your profile is under review. Complete all sections to speed up verification."

Profile completeness progress bar: calculated from filled optional fields (description, GSTIN, PAN, logo, website, address). Shown as a percentage with a list of missing fields as prompts.

---

## Components

### `VendorProfileHeader`

```typescript
interface VendorProfileHeaderProps {
  vendor:       VendorPublic
  isConnected:  boolean
  isOwnProfile: boolean        // true for vendor self-view
  onConnect?:   () => void
  onDisconnect?:() => void
}
```

### `VendorPerformanceKPIs`

```typescript
interface VendorPerformanceKPIsProps {
  performance: {
    total_orders:      number
    on_time_rate:      number
    avg_quality_score: number
    total_companies:   number
  }
  isLoading?: boolean
}
```

Renders four `KPICard` components. `on_time_rate` displayed as "X%" with trend direction disabled (no comparison period in v1). `avg_quality_score` shows star icon prefix.

### `VendorAboutSection`

Renders the vendor's description (markdown-safe plain text — no raw HTML rendered), contact email, phone, full address. "Edit" link visible only when `isOwnProfile = true`.

---

## Forms

Phase 10 introduces no new forms. Profile editing uses the existing `/vendor/settings/profile` form from Phase 8. The "Edit Profile" button is a navigation link, not an inline edit.

---

## Tables

Phase 10 introduces no list/table UI. The vendor profile is an information display page.

---

## Permissions

```
Company-side vendor profile (/vendors/[slug]):
  - View:            vendors.read.vendor
  - Add to network:  vendors.create.vendor
  - 404 returned for unverified vendors (enforced in Server Component, not just UI)

Vendor self-view (/vendor/profile):
  - Accessible to authenticated vendor_user (no additional permission check)
  - "Edit Profile" navigates to /vendor/settings/profile (Phase 8)
```

---

## Validation Rules

```
Slug routing:
  - Vendor slug must exist in vendors table
  - For company-side view: vendor must also have verification_status = 'verified'
  - Invalid or unverified slug: returns Next.js notFound() (404 page)

Profile completeness calculation:
  Scored fields: description, gstin, pan, logo_url, website, phone,
                 address_line1, city, state, pincode
  Score = (filled fields / total scored fields) × 100
  Displayed as percentage with colour coding:
    0–40%:  red   (incomplete)
    41–70%: amber (partial)
    71–100%: green (complete)
```

---

## Business Rules

```
BR-10.1  Company users see the vendor profile only if verification_status = 'verified'.
         The Server Component checks this and calls notFound() for unverified slugs.

BR-10.2  Vendor users always see their own profile regardless of verification_status.
         The self-view shows additional fields (GSTIN, PAN) that are hidden from buyers.

BR-10.3  The performance KPIs (total orders, on-time rate, quality score) are computed
         by the get_vendor_performance() RPC. In Phase 10 these return zero values until
         Phase 20 (Purchase Orders) and Phase 24 (Reviews) populate the source tables.
         Zero values display correctly as "0 orders", "0%" etc — not as errors.

BR-10.4  The profile completeness bar is visible only in the vendor self-view.
         It is not shown to company buyers.

BR-10.5  "Send RFQ" button on the company-side profile is rendered as a disabled button
         with tooltip "Create a Purchase Request first" until Phase 16 wires the full flow.
```

---

## Security

```
- Server Component validates vendor slug and verification_status before rendering
  any vendor data — no client-side guard is relied upon for the 404 enforcement
- get_vendor_performance() RPC is security definer — runs as the DB owner
  but only exposes aggregated metrics, no raw procurement data
- GSTIN and PAN are shown only in the vendor's own self-view; the VendorPublic
  type used for company-side views excludes these fields:

  type VendorPublic = Omit<Tables<'vendors'>, 'gstin' | 'pan'>

  The Server Component selects only public fields for the company-side query:
  .select('id,name,slug,logo_url,category,description,website,phone,email,
           city,state,country,verification_status,reputation_score,total_orders,created_at')
```

---

## State Management

No new Zustand stores or hooks for Phase 10. Profile data is fetched server-side and passed as props. The "Add to Network" action reuses `useAddVendorConnection()` from Phase 9. Performance KPIs are fetched in the Server Component and rendered as static props to `VendorPerformanceKPIs`.

---

## Development Tasks

### Task 10.1 — Migration

Apply migration `0013_vendor_profile_rpcs.sql`. Note: the RPC references `purchase_orders` and `reviews` tables that don't exist yet. Use `CREATE TABLE IF NOT EXISTS` stubs or write the RPC with conditional LEFT JOINs that return zeros when the tables are absent. Regenerate `database.ts`.

### Task 10.2 — Company-Side Vendor Profile Page

Implement `/vendors/[slug]/page.tsx` as a Server Component. Fetch vendor by slug, confirm `verification_status = 'verified'`, call `get_vendor_performance()` RPC, and pass all data as props to client sub-components.

### Task 10.3 — Vendor Self-View Page

Implement `/vendor/profile/page.tsx`. Fetches own vendor record by `profile.vendor_id`. Renders the same layout with `isOwnProfile = true`. Calculates profile completeness score and renders progress bar.

### Task 10.4 — Tabbed Profile Body

Implement the four-tab structure (Overview, Products, Documents, Reviews) using shadcn `Tabs`. Products and Documents tabs render empty state placeholders in Phase 10. Reviews tab renders empty state. All tab content slots are clearly commented for wiring in later phases.

### Task 10.5 — VendorPerformanceKPIs with Graceful Zero State

Implement `VendorPerformanceKPIs` to handle all-zero data gracefully — show "0" values with appropriate copy ("No orders yet", "No reviews yet") instead of blank cards.

### Task 10.6 — Add to Network on Profile Page

Wire the "Add to Network" button on the company-side profile to `useAddVendorConnection()`. After connection, the button updates to "Connected" badge without page reload.

---

## Testing Checklist

```
✓ /vendors/[slug]: renders correct vendor data for a verified vendor
✓ /vendors/[slug]: returns 404 for an unverified vendor slug
✓ /vendors/[slug]: returns 404 for a non-existent slug
✓ Performance KPIs: renders zero values correctly for new vendor with no orders
✓ Tabs: Overview, Products, Documents, Reviews render without errors
✓ Products tab: shows "No products yet" empty state
✓ Documents tab: shows "No documents yet" empty state
✓ "Add to Network" on profile page: creates connection; button updates to "Connected"
✓ /vendor/profile: vendor sees their own profile with all fields
✓ /vendor/profile: GSTIN and PAN visible in self-view
✓ /vendors/[slug]: GSTIN and PAN NOT present in company-side rendered HTML
✓ Profile completeness bar: calculates correctly for partial and full profiles
✓ Verification banner visible on self-view when status = 'unverified'
✓ "Send RFQ" button: rendered as disabled with tooltip
✓ pnpm build: no TypeScript errors; pnpm lint: zero warnings
```

---

## Acceptance Criteria

```
AC-10.1  Company-side vendor profile renders for verified vendors; 404 for unverified
AC-10.2  Performance KPIs load from get_vendor_performance() RPC; zero values display correctly
AC-10.3  Four-tab profile body renders; all tabs show correct empty states in Phase 10
AC-10.4  GSTIN and PAN excluded from VendorPublic type; not present in company-side response
AC-10.5  Vendor self-view renders with all fields and profile completeness bar
AC-10.6  "Add to Network" button on profile page wired to vendor_connections mutation
AC-10.7  Migration 0013 applied; get_vendor_performance() RPC returns data correctly
```

---

## Definition of Done

Phase 10 is complete when all Acceptance Criteria above are met AND:

- [ ] All TypeScript checks pass (zero errors)
- [ ] All ESLint checks pass (zero warnings)
- [ ] Migration 0013 applied and committed; database.ts regenerated
- [ ] Profile page tested with a vendor that has zero order history (graceful zeros)
- [ ] VendorPublic type confirmed to exclude GSTIN/PAN from company-side serialization
- [ ] PR merged to `develop` with at least 1 reviewer approval
- [ ] `feature/10-vendor-profile` branch merged and deleted

---

## Risk Factors

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| get_vendor_performance() RPC fails because purchase_orders or reviews tables don't exist | High | Medium | Write the RPC with explicit table existence checks or use LEFT JOIN with COALESCE |
| VendorPublic type accidentally including sensitive fields via select(*) | Medium | High | Always use explicit select column list; never .select('*') on the company-side vendor query |
| Profile completeness percentage causing layout shift on self-view load | Low | Low | Compute completeness server-side and pass as prop; no client-side calculation needed |

---

## Best Practices

- Never use `.select('*')` for vendor queries on the company-side — always enumerate columns to avoid accidentally exposing GSTIN, PAN, or future sensitive fields
- Keep `get_vendor_performance()` stable as it will be called from both the profile page and the dashboard (Phase 24). Design it for reuse now.
- Stub tabs with clear `// TODO Phase N` comments so later phases have an obvious integration point

---

## Estimated Completion

**3–4 working days.** The page is primarily read-only data display. The main complexity is the RPC design for graceful zero-state handling and the VendorPublic type discipline.

---

---

# PHASE 11 — VENDOR DOCUMENTS

---

## Overview

| Field | Value |
|---|---|
| Phase Number | 11 |
| Phase Name | Vendor Documents |
| Milestone | M3 — Vendor & Product Ecosystem |
| PRD Reference | Module 8 — Vendor Document Management |
| DESIGN Reference | Section 3 (Vendor Profile — Documents Tab), F01, F03 |
| Estimated Duration | 3–4 days |
| Prerequisite Phases | Phase 8, Phase 10 |

---

## Purpose

Phase 11 implements the vendor document management system. Vendors upload compliance, certification, and legal documents (GST certificates, trade licences, ISO certifications, etc.) that company buyers and platform administrators can review during the vendor verification and procurement process. This phase populates the Documents tab of the vendor profile page (Phase 10).

---

## Business Goal

Enterprise procurement has regulatory and compliance requirements. Before a company can place orders with a new vendor, procurement policy typically requires verified business registration, GST compliance, and relevant certifications. Phase 11 enables vendors to upload these documents once and share them with any company buyer through the platform — eliminating the repetitive document-request emails that characterise manual vendor onboarding.

---

## Dependencies

- Phase 8 complete (`vendors` table, vendor workspace, `vendor-documents` storage bucket)
- Phase 10 complete (vendor profile page with Documents tab stub)
- Phase 3 `vendor-documents` storage bucket with RLS policies
- Phase 2 `PageHeader`, `EmptyState`, `DataTable` components

---

## Database Tables

Migration: `0014_create_vendor_documents.sql`

```sql
-- ============================================================
-- Migration: 0014_create_vendor_documents
-- Description: Vendor compliance and certification documents
-- ============================================================

create table public.vendor_documents (
  id            uuid primary key default gen_random_uuid(),
  vendor_id     uuid not null references public.vendors(id) on delete cascade,
  name          text not null,
  document_type text not null
                  check (document_type in (
                    'gst_certificate', 'pan_card', 'trade_licence',
                    'incorporation_certificate', 'msme_certificate',
                    'iso_certification', 'bank_statement',
                    'address_proof', 'other'
                  )),
  file_url      text not null,
  file_name     text not null,
  file_size     integer not null,         -- bytes
  mime_type     text not null,
  expiry_date   date,                     -- for certificates that expire
  is_verified   boolean not null default false,
  verified_by   uuid references auth.users(id),
  verified_at   timestamptz,
  notes         text,                     -- admin notes on verification
  deleted_at    timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index idx_vendor_documents_vendor_id     on public.vendor_documents(vendor_id);
create index idx_vendor_documents_document_type on public.vendor_documents(document_type);
create index idx_vendor_documents_is_verified   on public.vendor_documents(is_verified);

create trigger trg_vendor_documents_updated_at
  before update on public.vendor_documents
  for each row execute function public.handle_updated_at();

alter table public.vendor_documents enable row level security;

-- Vendor can read and write their own documents
create policy "vendor_documents_vendor_rw"
  on public.vendor_documents for all
  using (vendor_id = public.get_my_vendor_id());

-- Company users can read documents of verified vendors they are connected to
create policy "vendor_documents_company_read"
  on public.vendor_documents for select
  using (
    exists (
      select 1 from public.vendor_connections vc
      where vc.vendor_id   = vendor_documents.vendor_id
        and vc.company_id  = public.get_my_company_id()
    )
    and deleted_at is null
  );

-- Platform admins can read all documents
create policy "vendor_documents_admin_read"
  on public.vendor_documents for select
  using (public.is_platform_admin());

-- Platform admins can update is_verified, verified_by, verified_at, notes
create policy "vendor_documents_admin_update"
  on public.vendor_documents for update
  using (public.is_platform_admin());
```

---

## Relationships

```
public.vendors (1)
  └── public.vendor_documents (N)
        — each document belongs to exactly one vendor workspace
        — file stored in vendor-documents/[vendor_id]/[document_id]/filename

Access control chain (company buyer reads a vendor's document):
  vendor_connections.company_id = get_my_company_id()
  AND vendor_connections.vendor_id = vendor_documents.vendor_id
  → company buyer can read the document record AND generate a signed URL
```

---

## API Endpoints

| Operation | Method | Implementation | Notes |
|---|---|---|---|
| List vendor documents (vendor view) | Server Component | `supabase.from('vendor_documents').select()` | Own vendor_id; includes all doc types |
| List vendor documents (company view) | Server Component | `supabase.from('vendor_documents').select()` | RLS enforces connection requirement |
| Upload document | Client | `supabase.storage.from('vendor-documents').upload()` + `supabase.from('vendor_documents').insert()` | Two-step: storage then DB record |
| Delete document | Client mutation | `supabase.from('vendor_documents').update({ deleted_at: now() })` + storage.remove() | Soft-delete record; hard-delete file |
| Download document (signed URL) | Client | `supabase.storage.from('vendor-documents').createSignedUrl()` | 60-minute expiry |
| Update document metadata | Client mutation | `supabase.from('vendor_documents').update()` | Name, expiry_date only |

---

## Supabase Services Used

```
Supabase Database:
  - public.vendor_documents — CRUD for document records

Supabase Storage:
  - vendor-documents bucket — private; file upload and signed URL generation
  - Path convention: vendor-documents/[vendor_id]/[document_id]/[original_filename]
  - All reads via signed URLs (60-minute expiry) — bucket is NOT public

Supabase Edge Functions:
  - Not used in Phase 11 (all operations are direct client mutations within RLS)
```

---

## Folder Structure

```
src/
├── app/
│   └── (vendor)/
│       └── documents/
│           └── page.tsx                    [Vendor document management page]
└── components/
    └── modules/
        └── vendor-documents/
            ├── document-list.tsx
            ├── document-upload-dialog.tsx
            ├── document-upload-form.tsx
            ├── document-row.tsx
            ├── document-type-badge.tsx
            ├── document-expiry-indicator.tsx
            └── index.ts
```

The Documents tab on the vendor profile page (`/vendors/[slug]`) and `/vendor/profile` both import from `vendor-documents/document-list.tsx` with a `readonly` prop.

---

## UI Screens

### Screen 11.1 — Vendor Documents Management (`/vendor/documents`)

Vendor-side full-page document management screen.

`PageHeader`: title "Documents", description "Upload compliance and certification documents for buyer review.", action "Upload Document".

`DataTable` with columns:

| Column | Description |
|---|---|
| Document name | Name + document type badge |
| Type | Document type label |
| Uploaded | Relative date |
| Expiry | Date + overdue badge if expired |
| Status | Verified (green) / Pending review (amber) |
| Actions | Download (signed URL), Edit metadata, Delete |

Empty state: "No documents uploaded yet. Upload your GST certificate, trade licence, and certifications to complete your vendor profile."

---

### Screen 11.2 — Documents Tab on Vendor Profile (Company View)

Read-only list rendered in the Documents tab of `/vendors/[slug]`. Shows only non-deleted documents. Download button generates a signed URL on click (not pre-generated to avoid URL leakage).

Only verified documents (`is_verified = true`) are shown to company buyers by default, with an option to toggle "Show all documents" for connected companies.

---

### Screen 11.3 — Upload Document Dialog

`Dialog` with `DocumentUploadForm`. Opens from the "Upload Document" button on Screen 11.1.

---

## Components

### `DocumentTypeBadge`

```typescript
type DocumentType =
  | 'gst_certificate' | 'pan_card' | 'trade_licence'
  | 'incorporation_certificate' | 'msme_certificate'
  | 'iso_certification' | 'bank_statement'
  | 'address_proof' | 'other'

interface DocumentTypeBadgeProps {
  type:       DocumentType
  size?:      'sm' | 'md'
}
```

Each document type maps to a label and a colour variant. Uses `StatusBadge` internally.

### `DocumentExpiryIndicator`

```typescript
interface DocumentExpiryIndicatorProps {
  expiryDate?: string | null   // ISO date string
}
```

Renders "Expires [date]" in green if > 30 days, amber if 1–30 days, red if expired. Shows nothing if `expiryDate` is null.

### `DocumentRow`

Single row component for the documents list. Handles download (generates signed URL on click), edit metadata (opens a small popover form for name and expiry date), and delete (AlertDialog confirmation).

---

## Forms

### Form 11.1 — Document Upload Form

| Field | Type | Validation |
|---|---|---|
| Document name | text input | Required, min 2 chars, max 100 chars |
| Document type | select | Required, one of predefined document types |
| File | file input | Required; PDF, JPEG, PNG only; max 50MB |
| Expiry date | date input | Optional; must be a future date if provided |

```typescript
const documentUploadSchema = z.object({
  name:          z.string().min(2).max(100),
  document_type: z.enum([
    'gst_certificate','pan_card','trade_licence','incorporation_certificate',
    'msme_certificate','iso_certification','bank_statement','address_proof','other'
  ]),
  expiry_date:   z.string().date().optional().refine(
    (d) => !d || new Date(d) > new Date(),
    { message: 'Expiry date must be in the future' }
  ),
})
```

Upload flow:
1. Validate form + file client-side
2. Upload file to `vendor-documents/[vendor_id]/[uuid]/[filename]`
3. On storage success, insert `vendor_documents` row with `file_url` (storage path)
4. On DB insert success, show toast "Document uploaded successfully"
5. On any failure, delete the already-uploaded storage file (cleanup step)

---

## Tables

See Screen 11.1 for the vendor-side documents table columns. The table supports sorting by name, upload date, expiry date, and verification status.

---

## Permissions

```
/vendor/documents (vendor self-management):
  - Upload, edit, delete: vendor_user — own vendor documents only (RLS)

Documents tab on company-side profile:
  - View documents: vendors.read.vendor + must be connected to the vendor
  - Download (generate signed URL): same requirement
  - No upload or delete capability for company users

Documents tab on vendor self-view (/vendor/profile):
  - All documents visible (including unverified)
  - "Upload Document" and "Delete" actions visible
```

---

## Validation Rules

```
File upload:
  - Accepted MIME types: application/pdf, image/jpeg, image/png
  - Maximum file size: 50MB (enforced by Supabase Storage bucket config)
  - Minimum file size: 1KB (client-side check to catch empty files)
  - File name: stored as original filename, sanitised (no path traversal characters)

Document name:
  - 2–100 characters; plain text only

Expiry date:
  - If provided, must be a valid date in the future
  - Year must be ≤ current year + 30 (prevents typos like 2099)

Duplicate document type:
  - No hard block on duplicates — vendors may have multiple ISO certifications
  - Duplicates within the same type are allowed
```

---

## Business Rules

```
BR-11.1  All vendor documents are stored as private files in the vendor-documents bucket.
         File access requires a Supabase Storage signed URL (60-minute expiry).
         Company buyers receive signed URLs only after verifying they are connected
         to the vendor (via RLS on the download trigger).

BR-11.2  Document verification (is_verified flag) is set only by platform administrators
         in Phase 28. Vendors cannot mark their own documents as verified.
         Unverified documents show "Pending review" badge.

BR-11.3  Soft delete: documents are marked deleted_at = now() in the DB.
         The storage file is hard-deleted at the same time via storage.remove().
         Soft-deleted documents are excluded from all queries by the deleted_at IS NULL filter.

BR-11.4  Company buyers by default see only verified documents on the vendor profile.
         A "Show all documents" toggle reveals unverified documents for connected companies.
         This gives buyers full visibility while highlighting which documents are confirmed.

BR-11.5  Documents with an expiry_date in the past display an "Expired" badge.
         Expired documents are NOT automatically hidden — the vendor must renew and
         re-upload. Expiry tracking is informational in v1.

BR-11.6  The Documents tab on the vendor profile page is visible even when empty.
         An empty state encourages the vendor to upload.
```

---

## Security

```
Storage path structure: vendor-documents/[vendor_id]/[document_id]/[filename]
  - vendor_id folder: Storage RLS policy restricts writes to the owning vendor
  - document_id subfolder: prevents filename collisions between documents

Signed URL generation:
  - Signed URLs have 60-minute expiry
  - Generated on-demand when the user clicks Download — never pre-generated or stored
  - The Storage RLS policy for vendor-documents enforces the connection check
    at the policy level, not just the application level

Cleanup on upload failure:
  - If the DB insert fails after a successful storage upload, the orphaned file
    is deleted from storage via storage.remove() in the catch block
  - This prevents orphaned private files accumulating in the bucket

Admin verification writes:
  - Only platform admins can set is_verified = true (RLS: is_platform_admin())
  - No vendor can elevate their own document to verified status
  - Verified status is tracked with verified_by (user id) and verified_at (timestamp)
```

---

## State Management

No new Zustand stores. Documents data is server state managed by TanStack Query:

```typescript
export function useVendorDocuments(vendorId: string) {
  const supabase = useSupabase()
  return useQuery({
    queryKey: ['vendor-documents', vendorId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vendor_documents')
        .select('*')
        .eq('vendor_id', vendorId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data ?? []
    },
    staleTime: 60 * 1000,
  })
}
```

After upload or delete mutations, `queryClient.invalidateQueries({ queryKey: ['vendor-documents'] })` refreshes the list.

---

## Development Tasks

### Task 11.1 — Migration

Apply migration `0014_create_vendor_documents.sql`. Regenerate `database.ts` types.

### Task 11.2 — Document Management Page

Implement `/vendor/documents/page.tsx` as a Server Component. Pass documents to the `DocumentList` client component.

### Task 11.3 — Document Upload Dialog and Form

Implement `DocumentUploadDialog` and `DocumentUploadForm`. Wire the two-step upload flow (storage first, then DB insert). Implement cleanup on failure.

### Task 11.4 — Signed URL Download

Implement on-click signed URL generation in `DocumentRow`. Call `supabase.storage.from('vendor-documents').createSignedUrl(filePath, 3600)` on button click. Open the signed URL in a new tab. Show a loading spinner on the button while generating.

### Task 11.5 — Documents Tab on Vendor Profile Page

Replace the Phase 10 placeholder in the Documents tab of `/vendors/[slug]` and `/vendor/profile` with the real `DocumentList` component (readonly mode for company buyers, full-mode for vendor self-view).

### Task 11.6 — Document Expiry Notifications

Add a banner on the vendor documents page when any document expires within 30 days: "1 document expires soon — review and renew." (Full notification system in Phase 21; this is a static banner check.)

---

## Testing Checklist

```
✓ Document upload: file uploaded to correct storage path; DB record created
✓ Document upload: oversized file (>50MB) rejected before upload attempt
✓ Document upload: unsupported file type rejected client-side with error message
✓ Document upload: storage failure triggers DB cleanup (no orphaned record)
✓ Document upload: DB failure triggers storage cleanup (orphaned file deleted)
✓ Download: signed URL generated on click; opens file in new tab
✓ Download: signed URL expires after 60 minutes (manual verification)
✓ Delete: soft-delete sets deleted_at; document disappears from list
✓ Delete: storage file is removed from bucket after soft-delete
✓ Edit metadata: document name and expiry date update correctly
✓ Documents tab (company view): only verified documents shown by default
✓ Documents tab (company view): "Show all" toggle reveals unverified documents
✓ Documents tab (company view): unconnected company user cannot access document records (RLS)
✓ Documents tab (company view): unconnected company user cannot generate signed URLs (Storage RLS)
✓ Expiry indicator: expired document shows red "Expired" badge
✓ Expiry indicator: document expiring in 15 days shows amber warning
✓ Vendor self-view: all documents shown including unverified
✓ Admin verification: is_verified update only succeeds for platform_admin role
✓ Migration 0014: vendor_documents table exists with correct schema and RLS
✓ pnpm build: no TypeScript errors; pnpm lint: zero warnings
```

---

## Acceptance Criteria

```
AC-11.1  Migration 0014 applied; vendor_documents table with RLS policies
AC-11.2  Document upload: two-step flow (storage + DB) works; cleanup on failure confirmed
AC-11.3  Download generates 60-minute signed URL; opens file correctly
AC-11.4  Soft delete removes document from list; storage file deleted
AC-11.5  Documents tab on vendor profile populated (replaces Phase 10 placeholder)
AC-11.6  Company buyers see only verified documents by default; "Show all" toggle works
AC-11.7  Unconnected company cannot read vendor document records (RLS verified)
AC-11.8  Expiry indicator renders correctly for expired, expiring-soon, and valid dates
AC-11.9  Document type badge renders correct label and colour for all nine types
```

---

## Definition of Done

Phase 11 is complete when all Acceptance Criteria above are met AND:

- [ ] All TypeScript checks pass (zero errors)
- [ ] All ESLint checks pass (zero warnings)
- [ ] Migration 0014 applied and committed; database.ts regenerated
- [ ] Upload failure cleanup path tested (simulate DB insert failure after storage upload)
- [ ] Signed URL expiry tested (verify URL returns 403 after 60 minutes)
- [ ] Storage RLS verified: unconnected company cannot download document
- [ ] PR merged to `develop` with at least 1 reviewer approval
- [ ] `feature/11-vendor-documents` branch merged and deleted

---

## Risk Factors

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Orphaned storage files from failed DB inserts | Medium | Low | Implement cleanup in catch block; add a periodic cleanup Edge Function in Phase 31 |
| Signed URL generation slow for large document lists | Low | Low | Generate signed URLs on-demand (click), not in bulk for the whole list |
| Storage RLS allowing unconnected company to access vendor-documents bucket | Low | High | Test RLS explicitly in Phase 11 testing checklist before marking done |
| Document expiry date typo (e.g. 2099) polluting the UI | Low | Low | Cap expiry year validation at current + 30 years |

---

## Best Practices

- Always generate signed URLs on-demand at download time — never store or cache signed URLs in the database
- Implement the storage cleanup (delete file if DB insert fails) before shipping — orphaned private files are a compliance and storage cost issue
- Use the `document_id` as a subfolder in the storage path (not just the filename) to handle duplicate filenames across multiple uploads of the same document type

---

## Estimated Completion

**3–4 working days.** Document upload with the two-step pattern and cleanup is the most complex part. The table and download UI are straightforward.

---

---

# PHASE 12 — PRODUCT CATALOG

---

## Overview

| Field | Value |
|---|---|
| Phase Number | 12 |
| Phase Name | Product Catalog |
| Milestone | M3 — Vendor & Product Ecosystem |
| PRD Reference | Module 9 — Product Catalog & Management |
| DESIGN Reference | Section 3 (Vendor — Catalog), F01, F03 |
| Estimated Duration | 4–5 days |
| Prerequisite Phases | Phase 8, Phase 10, Phase 13 (categories — can be parallel) |

---

## Purpose

Phase 12 implements the vendor product catalog — the system through which vendors list the goods and services they offer. Each product has a name, description, pricing, unit of measure, category, images, and availability status. Company buyers browse vendor catalogs when creating purchase requests and RFQs. This phase populates the Products tab of the vendor profile page (Phase 10).

---

## Business Goal

Structured product data eliminates the friction of back-and-forth specification emails between buyers and vendors. When a vendor's catalog is complete, a company procurement team can create a purchase request directly from a vendor's product listing — with accurate item codes, units, and pricing already filled in. Phase 12 makes sourcing faster and reduces specification errors in purchase orders.

---

## Dependencies

- Phase 8 complete (`vendors` table, vendor workspace)
- Phase 10 complete (vendor profile Products tab stub)
- Phase 13 complete (product categories — can be developed in parallel)
- Phase 3 `product-images` storage bucket
- Phase 2 `DataTable`, `EmptyState`, `PageHeader` components

---

## Database Tables

Migration: `0015_create_products.sql`

```sql
-- ============================================================
-- Migration: 0015_create_products
-- Description: Vendor product catalog
-- ============================================================

create table public.products (
  id              uuid primary key default gen_random_uuid(),
  vendor_id       uuid not null references public.vendors(id) on delete cascade,
  category_id     uuid references public.product_categories(id) on delete set null,
  sku             text,                     -- vendor's internal SKU
  name            text not null,
  description     text,
  unit_of_measure text not null default 'piece'
                    check (unit_of_measure in (
                      'piece','kg','gram','litre','metre','box','carton',
                      'dozen','set','hour','day','month','service'
                    )),
  unit_price      numeric(12,2),            -- indicative price; negotiated in RFQ
  currency        text not null default 'INR',
  min_order_qty   integer not null default 1 check (min_order_qty >= 1),
  lead_time_days  integer,                  -- typical delivery lead time
  is_active       boolean not null default true,
  tags            text[],
  deleted_at      timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index idx_products_vendor_id    on public.products(vendor_id);
create index idx_products_category_id  on public.products(category_id);
create index idx_products_is_active    on public.products(is_active) where deleted_at is null;
create index idx_products_name_trgm    on public.products using gin(name gin_trgm_ops);
create index idx_products_tags         on public.products using gin(tags);

create trigger trg_products_updated_at
  before update on public.products
  for each row execute function public.handle_updated_at();

-- Product images (multiple images per product)
create table public.product_images (
  id          uuid primary key default gen_random_uuid(),
  product_id  uuid not null references public.products(id) on delete cascade,
  url         text not null,
  alt_text    text,
  sort_order  integer not null default 0,
  is_primary  boolean not null default false,
  created_at  timestamptz not null default now()
);

create index idx_product_images_product_id on public.product_images(product_id);

-- RLS
alter table public.products       enable row level security;
alter table public.product_images enable row level security;

-- Vendors can manage their own products
create policy "products_vendor_rw"
  on public.products for all
  using (vendor_id = public.get_my_vendor_id());

-- Company users can read active products of verified vendors
create policy "products_company_read"
  on public.products for select
  using (
    is_active = true
    and deleted_at is null
    and exists (
      select 1 from public.vendors v
      where v.id = products.vendor_id
        and v.verification_status = 'verified'
    )
    and public.get_my_company_id() is not null
  );

-- Product images follow the same access as products
create policy "product_images_vendor_rw"
  on public.product_images for all
  using (
    exists (
      select 1 from public.products p
      where p.id = product_images.product_id
        and p.vendor_id = public.get_my_vendor_id()
    )
  );

create policy "product_images_company_read"
  on public.product_images for select
  using (
    exists (
      select 1 from public.products p
      join public.vendors v on v.id = p.vendor_id
      where p.id = product_images.product_id
        and p.is_active = true
        and p.deleted_at is null
        and v.verification_status = 'verified'
    )
    and public.get_my_company_id() is not null
  );
```

---

## Relationships

```
public.vendors (1)
  └── public.products (N)
        ├── public.product_categories (N:1) — category reference (Phase 13)
        └── public.product_images (N)       — multiple images per product

public.products (N)
  └── referenced by purchase_request_items (Phase 15)
  └── referenced by rfq_items (Phase 16)
  └── referenced by po_items (Phase 20)
```

---

## API Endpoints

| Operation | Method | Implementation | Notes |
|---|---|---|---|
| List vendor's own products | Server Component | `supabase.from('products').select('*, product_images(*), product_categories(*)')` | Vendor view; includes inactive |
| Create product | Client mutation | `supabase.from('products').insert()` | Vendor only |
| Update product | Client mutation | `supabase.from('products').update()` | Vendor only; RLS enforces vendor_id |
| Soft-delete product | Client mutation | `supabase.from('products').update({ deleted_at: now() })` | |
| Toggle product active status | Client mutation | `supabase.from('products').update({ is_active })` | |
| Upload product image | Client | `supabase.storage.from('product-images').upload()` + `supabase.from('product_images').insert()` | Up to 5 images per product |
| Delete product image | Client mutation | `supabase.from('product_images').delete()` + storage.remove() | Hard-delete image |
| Set primary image | Client mutation | `supabase.from('product_images').update({ is_primary: true })` + reset others | One primary per product |
| List vendor products (company view) | Server Component | `supabase.from('products').select()` | RLS: verified vendors, active products |
| Search vendor catalog | Client query | `.ilike('name', '%q%')` with pg_trgm | Used in RFQ item search (Phase 16) |

---

## Supabase Services Used

```
Supabase Database:
  - public.products        — CRUD for product catalog
  - public.product_images  — multiple images per product

Supabase Storage:
  - product-images bucket  — public read (product images are not sensitive)
  - Path: product-images/[vendor_id]/[product_id]/[image_id].[ext]

Supabase Edge Functions:
  - Not used in Phase 12 (all operations are direct client mutations within RLS)
```

---

## Folder Structure

```
src/
├── app/
│   └── (vendor)/
│       └── catalog/
│           └── products/
│               ├── page.tsx                    [Product list page]
│               ├── new/
│               │   └── page.tsx                [Create product page]
│               └── [id]/
│                   └── page.tsx                [Edit product page]
└── components/
    └── modules/
        └── catalog/
            ├── products-table.tsx
            ├── product-form.tsx
            ├── product-image-uploader.tsx
            ├── product-status-toggle.tsx
            ├── product-card.tsx              [Used in company-side catalog view]
            └── index.ts
```

---

## UI Screens

### Screen 12.1 — Vendor Product List (`/vendor/catalog/products`)

`PageHeader`: title "Products", action "Add Product" (navigates to `/vendor/catalog/products/new`).

`DataTable` columns:

| Column | Description |
|---|---|
| Product | Primary image thumbnail + name + SKU |
| Category | Category name badge |
| Unit price | Formatted currency value |
| UOM | Unit of measure |
| Min qty | Minimum order quantity |
| Status | Active / Inactive toggle |
| Actions | Edit, Duplicate, Delete |

Filters: category (dropdown), status (Active/Inactive/All), search by name.

---

### Screen 12.2 — Create / Edit Product (`/vendor/catalog/products/new` and `/vendor/catalog/products/[id]`)

Two-column layout (desktop):
- Left: product details form (name, SKU, category, description, UOM, price, min qty, lead time, tags)
- Right: image upload panel (up to 5 images; drag to reorder; mark primary)

`PageHeader`: "Add Product" or "Edit Product" with breadcrumb Catalog → Products → [Name].

"Save" button: creates or updates product and redirects to product list.
"Save & add another": creates and clears the form for the next product.

---

### Screen 12.3 — Products Tab on Vendor Profile (Company View)

Replaces the Phase 10 placeholder. Renders a responsive grid of `ProductCard` components for the vendor's active products. Sorted by name. "Add to RFQ" button on each card (Phase 16 wires this; disabled placeholder in Phase 12).

---

## Components

### `ProductForm`

```typescript
interface ProductFormProps {
  defaultValues?:  Partial<ProductFormData>
  categories:      ProductCategory[]
  onSubmit:        (data: ProductFormData) => Promise<void>
  isLoading?:      boolean
}
```

All fields in a single scrollable form. Uses react-hook-form + Zod. Category select is populated from Phase 13 categories.

### `ProductImageUploader`

Manages up to 5 images per product. Supports drag-and-drop reorder (sort_order column). Click on any image sets it as primary. Delete button on each image thumbnail. Uses the same file-validation pattern as Phase 11.

### `ProductCard`

```typescript
interface ProductCardProps {
  product: {
    id:             string
    name:           string
    description:    string | null
    unit_price:     number | null
    unit_of_measure:string
    min_order_qty:  number
    primary_image?: string | null
    category_name?: string | null
  }
  onAddToRFQ?: (productId: string) => void
  disabled?:   boolean
}
```

Card displays primary image, name, price, UOM, min qty, and category badge. "Add to RFQ" is the primary action.

### `ProductStatusToggle`

Inline switch component in the products table. Calls `supabase.from('products').update({ is_active })` on toggle. Shows optimistic UI update before the mutation resolves.

---

## Forms

### Form 12.1 — Product Form

| Field | Type | Validation |
|---|---|---|
| Name | text input | Required, min 2 chars, max 200 chars |
| SKU | text input | Optional, max 50 chars |
| Category | select | Optional (pending Phase 13) |
| Description | textarea | Optional, max 1000 chars |
| Unit of measure | select | Required, one of defined UOM values |
| Unit price | number input | Optional, ≥ 0, max 2 decimal places |
| Currency | select | Required, default INR |
| Minimum order qty | integer input | Required, min 1 |
| Lead time (days) | integer input | Optional, min 1, max 365 |
| Tags | tag input | Optional, max 10 tags, each max 30 chars |

```typescript
const productSchema = z.object({
  name:            z.string().min(2).max(200),
  sku:             z.string().max(50).optional(),
  category_id:     z.string().uuid().optional(),
  description:     z.string().max(1000).optional(),
  unit_of_measure: z.enum(['piece','kg','gram','litre','metre','box','carton',
                            'dozen','set','hour','day','month','service']),
  unit_price:      z.number().min(0).multipleOf(0.01).optional(),
  currency:        z.string().length(3).default('INR'),
  min_order_qty:   z.number().int().min(1),
  lead_time_days:  z.number().int().min(1).max(365).optional(),
  tags:            z.array(z.string().max(30)).max(10).optional(),
})
```

---

## Tables

### Products Management Table

| Column | Sortable | Filterable |
|---|---|---|
| Product name + SKU | Yes | Yes (search) |
| Category | Yes | Yes (dropdown) |
| Unit price | Yes | No |
| UOM | No | Yes (dropdown) |
| Min order qty | Yes | No |
| Status | Yes | Yes (toggle) |
| Created | Yes | No |
| Actions | No | No |

Default sort: created_at descending (newest first).

---

## Permissions

```
Vendor catalog management (/vendor/catalog/products/*):
  - View, create, edit, delete: vendor_user — own products (RLS enforces vendor_id)
  - No additional PERMISSIONS constant check needed — own workspace access only

Products tab on company-side vendor profile:
  - View: vendors.read.vendor (already required to view the vendor profile)
  - "Add to RFQ": requires procurement.create.rfq (Phase 16)

RLS summary:
  - products INSERT/UPDATE/DELETE: vendor_id = get_my_vendor_id()
  - products SELECT (company): is_active = true AND deleted_at IS NULL
    AND vendor verification_status = 'verified'
    AND company_id IS NOT NULL (authenticated company user)
```

---

## Validation Rules

```
Product images:
  - Accepted MIME types: image/jpeg, image/png, image/webp
  - Maximum file size: 10MB per image
  - Maximum 5 images per product
  - At least one image recommended (not required)
  - Primary image: exactly one per product; if only one image, it is primary by default

Unit price:
  - Optional (vendors may prefer to quote prices per RFQ)
  - If provided: ≥ 0, max 12 digits total, 2 decimal places
  - Displayed as "Price on request" when null

Tags:
  - Max 10 tags per product
  - Each tag: max 30 characters, alphanumeric + hyphens only
  - Stored as text array in the products.tags column (GIN indexed)
```

---

## Business Rules

```
BR-12.1  Products belong to a vendor workspace. A vendor cannot access or modify
         another vendor's products (RLS enforces vendor_id = get_my_vendor_id()).

BR-12.2  Deactivated products (is_active = false) are hidden from company buyers
         but remain visible to the vendor in their catalog management screen.
         Company buyers only see active products of verified vendors.

BR-12.3  Soft-deleted products are excluded from all queries via deleted_at IS NULL.
         A deleted product is removed from active RFQ item searches but historical
         procurement records that reference the product_id are unaffected.

BR-12.4  Unit price is indicative only. The actual transaction price is negotiated
         in the RFQ/quotation process (Phases 16–17). Displaying a price does not
         constitute a binding offer.

BR-12.5  Duplicating a product copies all fields except images (images are not
         duplicated — they remain attached to the original). The duplicate starts
         with is_active = false so it is not immediately visible to buyers.

BR-12.6  Category assignment uses the platform-wide product_categories table
         (Phase 13). A product with category_id = null appears in an "Uncategorised"
         section of the vendor catalog.
```

---

## Security

```
- Products and product_images RLS scoped to vendor_id = get_my_vendor_id() for writes
- Company-side product reads: only active, non-deleted products of verified vendors
- Product images are public (product-images bucket public read) —
  no signed URLs needed; product images are not sensitive
- Tags stored as an array and rendered as plain text — no HTML in tag values
- Unit price: stored as numeric(12,2); no currency conversion logic in Phase 12
- SKU field: stored as plain text; not used for any security-critical lookup
```

---

## State Management

```typescript
export function useVendorProducts(vendorId: string) {
  const supabase = useSupabase()
  return useQuery({
    queryKey: ['vendor-products', vendorId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*, product_images(*), product_categories(id, name)')
        .eq('vendor_id', vendorId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data ?? []
    },
    staleTime: 2 * 60 * 1000,
  })
}
```

No new Zustand stores. All product state is server state managed by TanStack Query. Mutations invalidate `['vendor-products', vendorId]` on success.

---

## Development Tasks

### Task 12.1 — Migration

Apply migration `0015_create_products.sql`. Note: `product_categories` FK references the table created in Phase 13 — if Phase 13 runs in parallel, ensure the FK is added after Phase 13's migration runs. Alternatively, use `ALTER TABLE products ADD COLUMN category_id ... REFERENCES product_categories(id)` in Phase 13's migration. Regenerate `database.ts` types.

### Task 12.2 — Product List Page

Implement `/vendor/catalog/products/page.tsx` as a Server Component. Pass products to `ProductsTable` client component.

### Task 12.3 — Create and Edit Product Pages

Implement both pages. The create page renders an empty `ProductForm`. The edit page fetches the product by id (validates vendor_id ownership) and passes it as `defaultValues`. Both pages include `ProductImageUploader` in the right column.

### Task 12.4 — Product Image Uploader

Implement `ProductImageUploader` with support for multiple images, drag-to-reorder, primary image selection, and individual image deletion. Storage path: `product-images/[vendor_id]/[product_id]/[image_id].[ext]`. After product creation (new id available), images are uploaded in sequence and `product_images` rows are inserted.

### Task 12.5 — Product Status Toggle

Implement `ProductStatusToggle` with optimistic update: flip the toggle state immediately in TanStack Query's cache, then confirm with the Supabase mutation. Roll back on error.

### Task 12.6 — Products Tab on Vendor Profile

Replace Phase 10 placeholder in `/vendors/[slug]` Products tab with the real `ProductCard` grid. Fetch active products server-side. Render "No products listed yet" empty state if the vendor has no active products.

### Task 12.7 — Duplicate Product Action

Implement duplicate in `ProductsTable` row actions. Copies all product fields (excluding images) with name prefixed "Copy of ". Sets is_active = false. Navigates to edit page for the duplicate.

---

## Testing Checklist

```
✓ Product list: renders all vendor products including inactive
✓ Create product: all required fields validated; product created correctly
✓ Edit product: pre-populated with correct values; changes save correctly
✓ Soft delete: product disappears from vendor list; company buyer cannot see it
✓ Status toggle: deactivated product disappears from company catalog view
✓ Status toggle: optimistic UI update reverts on mutation failure
✓ Image upload: up to 5 images uploaded; stored at correct path
✓ Image upload: 6th image rejected with error message
✓ Image upload: unsupported MIME type rejected client-side
✓ Primary image: setting primary updates is_primary and resets others
✓ Image delete: image removed from product_images and storage bucket
✓ Products tab (company view): shows only active products of verified vendor
✓ Products tab (company view): "No products" empty state for vendor with no active products
✓ Duplicate product: copy created with "Copy of" prefix and is_active = false
✓ RLS: company user cannot create/update/delete a vendor's products
✓ RLS: inactive products not returned in company-side query
✓ pnpm build: no TypeScript errors; pnpm lint: zero warnings
```

---

## Acceptance Criteria

```
AC-12.1  Migration 0015 applied; products and product_images tables with correct RLS
AC-12.2  Vendor can create, edit, deactivate, and delete products via catalog pages
AC-12.3  Up to 5 images per product uploadable; primary image designation works
AC-12.4  Company-side vendor profile Products tab shows active products; populates correctly
AC-12.5  Deactivated/deleted products hidden from company buyers (RLS verified)
AC-12.6  Product status toggle uses optimistic UI; reverts on failure
AC-12.7  Duplicate product creates copy with is_active = false
```

---

## Definition of Done

Phase 12 is complete when all Acceptance Criteria above are met AND:

- [ ] All TypeScript checks pass (zero errors)
- [ ] All ESLint checks pass (zero warnings)
- [ ] Migration 0015 applied and committed; database.ts regenerated
- [ ] Product image upload, reorder, primary, and delete all tested
- [ ] RLS verified: company buyer cannot see deactivated or deleted products
- [ ] PR merged to `develop` with at least 1 reviewer approval
- [ ] `feature/12-product-catalog` branch merged and deleted

---

## Risk Factors

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Phase 13 category FK not yet created when Phase 12 migration runs | Medium | Low | Make category_id nullable; add FK in Phase 13 migration via ALTER TABLE |
| Product image upload race condition (images uploaded before product_id exists) | Low | Medium | Create product record first, then upload images with the new product_id as path |
| Primary image update not resetting other images atomically | Low | Low | Use Supabase batch update: one update sets all images is_primary = false, then set target to true |

---

## Best Practices

- Create the product record before uploading images — the product_id is required for the storage path
- Always store images at `product-images/[vendor_id]/[product_id]/` — never at a flat path
- Unit price is informational; never use it as the authoritative price in any financial calculation

---

## Estimated Completion

**4–5 working days.** The multi-image uploader with drag-to-reorder and primary selection is the most complex component. Product CRUD and the catalog grid are straightforward.

---

---

# PHASE 13 — PRODUCT CATEGORIES

---

## Overview

| Field | Value |
|---|---|
| Phase Number | 13 |
| Phase Name | Product Categories |
| Milestone | M3 — Vendor & Product Ecosystem |
| PRD Reference | Module 9 — Product Catalog (Category Management sub-section) |
| DESIGN Reference | Section 3 (Vendor — Catalog — Categories), F01, F03 |
| Estimated Duration | 2–3 days |
| Prerequisite Phases | Phase 8 |

---

## Purpose

Phase 13 implements the product category management system — a shared, platform-wide taxonomy that vendors use to classify their products and that buyers use to filter vendor catalogs and procurement items. Categories are hierarchical (parent/child), managed by platform administrators, and used across the entire procurement lifecycle.

---

## Business Goal

A consistent product taxonomy across all vendors is essential for procurement analytics, catalog search, and RFQ vendor matching. Without standardised categories, every vendor invents their own classification and cross-vendor comparison becomes impossible. Phase 13 provides the shared vocabulary that makes the catalog, marketplace filtering, and procurement reporting coherent.

---

## Dependencies

- Phase 8 complete (`vendors` table)
- Phase 12 begins in parallel (products reference categories via `category_id` FK)
- Phase 2 `DataTable`, `EmptyState`, `PageHeader` components
- Phase 6 IAM (platform admin role for category management)

---

## Database Tables

Migration: `0016_create_product_categories.sql`

```sql
-- ============================================================
-- Migration: 0016_create_product_categories
-- Description: Platform-wide product category taxonomy
-- ============================================================

create table public.product_categories (
  id          uuid primary key default gen_random_uuid(),
  parent_id   uuid references public.product_categories(id) on delete set null,
  name        text not null,
  slug        text not null unique,
  description text,
  icon        text,             -- Lucide icon name, e.g. 'Package', 'Cpu'
  sort_order  integer not null default 0,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index idx_product_categories_parent_id  on public.product_categories(parent_id);
create index idx_product_categories_slug       on public.product_categories(slug);
create index idx_product_categories_is_active  on public.product_categories(is_active);

create trigger trg_product_categories_updated_at
  before update on public.product_categories
  for each row execute function public.handle_updated_at();

-- Now that product_categories exists, add FK to products
alter table public.products
  add constraint products_category_id_fkey
    foreign key (category_id)
    references public.product_categories(id)
    on delete set null;

-- RLS
alter table public.product_categories enable row level security;

-- All authenticated users can read active categories (needed for product forms)
create policy "product_categories_read_authenticated"
  on public.product_categories for select
  using (auth.uid() is not null and is_active = true);

-- Only platform admins can write categories
create policy "product_categories_write_admin"
  on public.product_categories for all
  using (public.is_platform_admin());
```

**Category seed data** — `supabase/seeds/product_categories.sql`:

```sql
-- Top-level categories
insert into public.product_categories (name, slug, icon, sort_order) values
  ('Electronics & Components',   'electronics',    'Cpu',          1),
  ('Mechanical & Industrial',    'mechanical',     'Settings',     2),
  ('Office & Stationery',        'office',         'Briefcase',    3),
  ('Packaging & Shipping',       'packaging',      'Package',      4),
  ('Raw Materials',              'raw-materials',  'Layers',       5),
  ('IT Hardware & Software',     'it-hardware',    'Monitor',      6),
  ('Safety & Protective',        'safety',         'Shield',       7),
  ('Furniture & Fixtures',       'furniture',      'Home',         8),
  ('Food & Beverages',           'food',           'Coffee',       9),
  ('Chemicals & Solvents',       'chemicals',      'Beaker',       10),
  ('Textiles & Apparel',         'textiles',       'Scissors',     11),
  ('Construction Materials',     'construction',   'Building',     12),
  ('Professional Services',      'services',       'Star',         13),
  ('Logistics & Transport',      'logistics',      'Truck',        14),
  ('Healthcare & Medical',       'healthcare',     'Heart',        15);
```

---

## Relationships

```
public.product_categories (self-referential hierarchy)
  ├── parent_id → public.product_categories.id (nullable — null = root category)
  └── public.products (N) via category_id FK

Hierarchy depth:
  VendorFlow v1 supports two levels: root categories and their direct children.
  Deeper nesting is not implemented in v1 (parent_id of a child cannot itself
  have a parent_id set — enforced at application layer, not DB constraint).

Category usage:
  - Product form: category select dropdown
  - Marketplace filter: category multi-select (Phase 9)
  - RFQ item search: category filter (Phase 16)
  - Analytics breakdown: spend by category (Phase 25)
```

---

## API Endpoints

| Operation | Method | Implementation | Notes |
|---|---|---|---|
| List all active categories | Server Component | `supabase.from('product_categories').select('*, product_categories!parent_id(*)').is('parent_id', null)` | Root categories with children |
| List flat categories | Client query | `supabase.from('product_categories').select()` | For product form select dropdown |
| Create category | Client mutation | `supabase.from('product_categories').insert()` | Platform admin only |
| Update category | Client mutation | `supabase.from('product_categories').update()` | Platform admin only |
| Deactivate category | Client mutation | `supabase.from('product_categories').update({ is_active: false })` | Does not delete; hides from vendors |
| Reorder categories | Client mutation | Batch `supabase.from('product_categories').update({ sort_order })` | Updates multiple rows |

---

## Supabase Services Used

```
Supabase Database:
  - public.product_categories — CRUD; self-referential hierarchy
  - products.category_id FK  — product form uses categories as a select source

Supabase Storage:
  - Not used in Phase 13

Supabase Edge Functions:
  - Not used in Phase 13 (all writes are direct; platform admin RLS enforces access)
```

---

## Folder Structure

```
src/
├── app/
│   ├── (vendor)/
│   │   └── catalog/
│   │       └── categories/
│   │           └── page.tsx            [Vendor read-only category browse — for product form context]
│   └── (admin)/
│       └── categories/
│           └── page.tsx                [Admin category management page]
└── components/
    └── modules/
        └── catalog/
            ├── category-tree.tsx       [Hierarchical category display]
            ├── category-form.tsx       [Create/edit category — admin only]
            ├── category-select.tsx     [Select dropdown for product forms]
            └── index.ts
```

---

## UI Screens

### Screen 13.1 — Admin Category Management (`/admin/categories`)

`PageHeader`: title "Product Categories", action "Add Category".

Two-pane layout:
- Left: category tree showing root categories with expandable children
- Right: edit panel (populated when a category is selected from the tree)

**Category tree row:** icon + name + product count badge + active/inactive toggle + edit/add-child buttons.

Each root category has an "Add subcategory" button. Clicking a category populates the right edit panel with the `CategoryForm`.

---

### Screen 13.2 — Vendor Category Browse (`/vendor/catalog/categories`)

Read-only page listing all active categories in a grid layout with icon and product count. Informational only — vendors select categories in the product form, not here. Links from vendor catalog navigation.

---

## Components

### `CategoryTree`

```typescript
interface CategoryTreeProps {
  categories:  CategoryWithChildren[]
  onSelect?:   (category: ProductCategory) => void
  onToggle?:   (id: string, active: boolean) => void
  readOnly?:   boolean
}

interface CategoryWithChildren extends Tables<'product_categories'> {
  children: Tables<'product_categories'>[]
}
```

Renders a two-level tree. Expand/collapse for root categories with children. Active state shows as a filled dot; inactive as a muted ring. Admin-only actions (edit, add child, toggle) hidden when `readOnly = true`.

### `CategorySelect`

Reusable dropdown for all product forms. Grouped by parent category for easy navigation. Renders a flat list of leaf categories grouped under parent headings.

```typescript
interface CategorySelectProps {
  value?:     string | null
  onChange:   (categoryId: string | null) => void
  placeholder?: string
  disabled?:  boolean
}
```

Fetches categories via `useQuery` with a 10-minute stale time (categories change rarely).

### `CategoryForm`

```typescript
interface CategoryFormProps {
  defaultValues?: Partial<CategoryFormData>
  parentCategory?: ProductCategory | null
  onSubmit:       (data: CategoryFormData) => Promise<void>
  isLoading?:     boolean
}
```

Fields: name, icon (select from Lucide icon list), description, sort_order, is_active. When creating a subcategory, `parentCategory` is shown as read-only context.

---

## Forms

### Form 13.1 — Category Form (Admin)

| Field | Type | Validation |
|---|---|---|
| Name | text input | Required, min 2 chars, max 100 chars, unique slug auto-derived |
| Icon | select | Optional, one of ~30 pre-approved Lucide icon names |
| Description | textarea | Optional, max 300 chars |
| Sort order | integer input | Required, min 0 |
| Active | switch | Default true |

```typescript
const categorySchema = z.object({
  name:        z.string().min(2).max(100),
  icon:        z.string().optional(),
  description: z.string().max(300).optional(),
  sort_order:  z.number().int().min(0).default(0),
  is_active:   z.boolean().default(true),
})
```

Slug is auto-derived from name server-side, following the same pattern as company and vendor slugs.

---

## Tables

### Admin Categories Table

The category tree is not a `DataTable` — it is the `CategoryTree` component. A flat `DataTable` is rendered in a secondary "All categories" view for bulk operations (reorder, bulk activate/deactivate).

| Column | Sortable | Filterable |
|---|---|---|
| Category name | Yes | Yes (search) |
| Parent | No | Yes (root / child) |
| Products | Yes | No |
| Sort order | Yes | No |
| Active | Yes | Yes |
| Actions | No | No |

---

## Permissions

```
Category management (/admin/categories):
  - All operations: platform_admin role only (RLS: is_platform_admin())
  - No company or vendor user can create/update/delete categories

Category read:
  - All authenticated users can read active categories
  - Needed by: vendor product form, company RFQ item search,
    marketplace category filter, analytics (Phase 25)

/vendor/catalog/categories:
  - Read-only view of active categories
  - Accessible to vendor_user role
```

---

## Validation Rules

```
Category name:
  - 2–100 characters
  - Slug uniqueness enforced by DB unique constraint on slug column
  - Slug auto-derived from name (same pattern as Phase 5/8)

Hierarchy depth:
  - Root categories: parent_id = null
  - Child categories: parent_id = a root category's id
  - Application enforces max depth of 2 (no grandchildren)
  - If a user tries to set parent_id to a non-root category, return validation error:
    "Subcategories can only be placed under a top-level category"

Deactivation:
  - A category with active products cannot be deactivated
  - Check: count of products with this category_id and deleted_at IS NULL
  - If count > 0: show warning "X products are using this category. Reassign them first."

Icon:
  - Must be a valid Lucide React icon name from the pre-approved list
  - Stored as a string; rendered as `<DynamicLucideIcon name={icon} />`
```

---

## Business Rules

```
BR-13.1  Product categories are platform-wide — they are not per-company or per-vendor.
         Every vendor uses the same category taxonomy.

BR-13.2  Category hierarchy is limited to two levels in v1: root and child.
         No deeper nesting is supported or planned for v1.

BR-13.3  Deactivating a category hides it from all vendor and buyer-facing category
         pickers immediately. Existing products with that category_id retain the
         association but the category name displays as "(Inactive)" in UI contexts.

BR-13.4  Deleting a category is not supported in v1. Deactivation is the only
         removal mechanism. This preserves referential integrity with historical
         procurement data (purchase requests, RFQs) that reference category_id.

BR-13.5  The 15 root categories seeded in Phase 13 are the initial taxonomy.
         Platform administrators can add, rename, and add subcategories at any time.
         Seed categories cannot be deleted (they can be deactivated).
```

---

## Security

```
- product_categories writes: RLS enforces is_platform_admin() — no vendor or company
  user can modify the category taxonomy
- product_categories reads: all authenticated users can read active categories
  (no sensitive data in category records)
- Slug uniqueness: DB UNIQUE constraint prevents slug collision attacks
- Icon field: stored as a string, rendered via a controlled lookup table
  of approved Lucide icon names — no arbitrary SVG injection possible
```

---

## State Management

Categories change rarely. Fetched with a long stale time and cached globally:

```typescript
export function useProductCategories() {
  const supabase = useSupabase()
  return useQuery({
    queryKey: ['product-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_categories')
        .select('*, product_categories!parent_id(id, name, slug, icon, sort_order)')
        .is('parent_id', null)
        .eq('is_active', true)
        .order('sort_order')
      if (error) throw error
      return data ?? []
    },
    staleTime: 10 * 60 * 1000,   // 10 minutes — categories rarely change
    gcTime:    30 * 60 * 1000,
  })
}
```

No Zustand store. TanStack Query cache serves as the global category cache for both the product form and the marketplace filter.

---

## Development Tasks

### Task 13.1 — Migration

Apply migration `0016_create_product_categories.sql`. This also adds the FK constraint from `products.category_id` to `product_categories.id`. Apply seeds (`supabase/seeds/product_categories.sql`). Regenerate `database.ts` types.

### Task 13.2 — CategorySelect Component

Implement `CategorySelect` first — it is needed by the Phase 12 product form. Fetch all active categories using `useProductCategories()`. Group in the dropdown by root category. Test that Phase 12 product form correctly shows categories after this task.

### Task 13.3 — Admin Category Management Page

Implement `/admin/categories/page.tsx` with the two-pane layout. Render `CategoryTree` (left) and `CategoryForm` in a `Sheet` panel (right). Wire create, update, and deactivate mutations with query invalidation.

### Task 13.4 — Category Tree Component

Implement `CategoryTree` with expand/collapse for root nodes. Active/inactive toggle calls `is_active` update. "Add subcategory" button opens `CategoryForm` pre-filled with `parentCategory`.

### Task 13.5 — Vendor Category Browse Page

Implement `/vendor/catalog/categories/page.tsx` as a read-only Server Component rendering the category grid. No actions. Serves as orientation for vendors filling in their product forms.

### Task 13.6 — Update Phase 12 Product Form

Wire `CategorySelect` into the Phase 12 `ProductForm` component now that the categories table exists.

---

## Testing Checklist

```
✓ Migration 0016: product_categories table created; FK added to products.category_id
✓ 15 root categories seeded correctly; visible in admin page
✓ Create root category: name, slug, icon, sort_order saved correctly
✓ Create subcategory: parent_id set correctly; appears under root in tree
✓ Edit category: name and description update correctly
✓ Deactivate category: hidden from vendor product form and marketplace filter
✓ Deactivate category with products: blocked with correct error message
✓ CategorySelect: groups categories by root; renders flat leaf list
✓ ProductForm (Phase 12): category select populates from seeded categories
✓ Marketplace filter (Phase 9): category filter uses active categories
✓ Category tree: expand/collapse works; active/inactive state visible
✓ Max depth: creating a subcategory under another subcategory blocked with error
✓ RLS: vendor user cannot create/update/delete categories (DB returns permission denied)
✓ Admin: deactivation reflected immediately in vendor product form
✓ pnpm build: no TypeScript errors; pnpm lint: zero warnings
```

---

## Acceptance Criteria

```
AC-13.1  Migration 0016 applied; product_categories table with hierarchy and RLS
AC-13.2  15 root categories seeded and visible in admin and vendor category browse
AC-13.3  CategorySelect dropdown in product form shows active categories grouped by parent
AC-13.4  Admin can create, edit, and deactivate categories via admin page
AC-13.5  Deactivation of category with active products blocked with error message
AC-13.6  Hierarchy depth limited to 2 levels; deeper nesting rejected with error
AC-13.7  RLS verified: vendor/company user cannot write to product_categories
```

---

## Definition of Done

Phase 13 is complete when all Acceptance Criteria above are met AND:

- [ ] All TypeScript checks pass (zero errors)
- [ ] All ESLint checks pass (zero warnings)
- [ ] Migration 0016 applied and committed; product_categories seed applied; database.ts regenerated
- [ ] Phase 12 ProductForm wired to CategorySelect and tested end-to-end
- [ ] RLS verified: non-admin write attempt returns permission denied
- [ ] PR merged to `develop` with at least 1 reviewer approval
- [ ] `feature/13-product-categories` branch merged and deleted

---

## Risk Factors

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Phase 12 products FK fails if 0016 migration runs after 0015 | High | Low | Use ALTER TABLE in 0016 to add FK retroactively; product inserts before 0016 have category_id = null (acceptable) |
| Category deactivation not invalidating CategorySelect cache | Medium | Low | Invalidate `['product-categories']` query key after any category mutation |
| Icon string mismatch between stored name and Lucide component | Low | Low | Maintain a controlled ALLOWED_ICONS constant; validate icon name in Zod schema |

---

## Best Practices

- Seed categories in a separate seed file, not in the migration — migrations are schema changes, seeds are data
- Keep `staleTime` long (10 minutes) for categories in TanStack Query — they change very rarely and a stale cache is acceptable
- Always derive slugs server-side or in application code — never accept a user-provided slug

---

## Estimated Completion

**2–3 working days.** Categories are a straightforward CRUD feature. The tree component and the CategorySelect integration with Phase 12 are the main implementation tasks.

---

---

# PHASE 14 — INVENTORY MANAGEMENT

---

## Overview

| Field | Value |
|---|---|
| Phase Number | 14 |
| Phase Name | Inventory Management |
| Milestone | M3 — Vendor & Product Ecosystem |
| PRD Reference | Module 10 — Inventory Tracking |
| DESIGN Reference | Section 3 (Vendor — Catalog — Inventory), F01, F03 |
| Estimated Duration | 3–4 days |
| Prerequisite Phases | Phase 12 (Product Catalog) |

---

## Purpose

Phase 14 adds inventory tracking to the vendor product catalog. Vendors can set stock levels, define reorder thresholds, and track availability status for each product. Company buyers see live stock status on vendor catalog pages. The inventory system provides the data foundation for stock-based availability filtering in RFQs and purchase orders.

---

## Business Goal

Buyers waste significant procurement time requesting quotations from vendors who are out of stock. Real-time inventory status on the marketplace and vendor profile eliminates this friction — buyers immediately know whether a vendor can fulfil an order before initiating an RFQ. For vendors, the reorder threshold system provides basic inventory management awareness without requiring a full ERP integration.

---

## Dependencies

- Phase 12 complete (`products` table, vendor product catalog)
- Phase 2 `DataTable`, `PageHeader`, `KPICard`, `StatusBadge` components

---

## Database Tables

Migration: `0017_create_inventory.sql`

```sql
-- ============================================================
-- Migration: 0017_create_inventory
-- Description: Product inventory tracking for vendor catalog
-- ============================================================

create table public.inventory (
  id               uuid primary key default gen_random_uuid(),
  product_id       uuid not null references public.products(id) on delete cascade,
  vendor_id        uuid not null references public.vendors(id)  on delete cascade,
  quantity_on_hand integer not null default 0 check (quantity_on_hand >= 0),
  quantity_reserved integer not null default 0 check (quantity_reserved >= 0),
  reorder_point    integer,          -- trigger reorder alert below this level
  reorder_quantity integer,          -- suggested reorder quantity
  warehouse_location text,           -- optional free-text location
  last_updated_at  timestamptz not null default now(),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  constraint inventory_product_vendor_unique unique (product_id, vendor_id)
);

create index idx_inventory_product_id on public.inventory(product_id);
create index idx_inventory_vendor_id  on public.inventory(vendor_id);

create trigger trg_inventory_updated_at
  before update on public.inventory
  for each row execute function public.handle_updated_at();

-- Inventory movement log (full audit trail)
create table public.inventory_movements (
  id            uuid primary key default gen_random_uuid(),
  inventory_id  uuid not null references public.inventory(id) on delete cascade,
  product_id    uuid not null references public.products(id),
  vendor_id     uuid not null references public.vendors(id),
  movement_type text not null check (movement_type in (
    'adjustment',   -- manual stock correction
    'received',     -- stock received from supplier
    'shipped',      -- stock shipped to buyer (linked to PO)
    'returned',     -- stock returned by buyer
    'damaged',      -- stock written off as damaged
    'reserved',     -- quantity reserved for an open PO
    'unreserved'    -- reservation released
  )),
  quantity_change integer not null,    -- positive = in, negative = out
  reference_id    uuid,                -- optional FK to purchase_order, etc.
  reference_type  text,                -- 'purchase_order', 'manual', etc.
  notes           text,
  created_by      uuid references auth.users(id),
  created_at      timestamptz not null default now()
);

create index idx_inventory_movements_inventory_id on public.inventory_movements(inventory_id);
create index idx_inventory_movements_product_id   on public.inventory_movements(product_id);
create index idx_inventory_movements_vendor_id    on public.inventory_movements(vendor_id);
create index idx_inventory_movements_created_at   on public.inventory_movements(created_at desc);

-- RLS
alter table public.inventory           enable row level security;
alter table public.inventory_movements enable row level security;

-- Vendor can manage their own inventory
create policy "inventory_vendor_rw"
  on public.inventory for all
  using (vendor_id = public.get_my_vendor_id());

-- Company users can read stock availability of verified vendors
create policy "inventory_company_read"
  on public.inventory for select
  using (
    exists (
      select 1 from public.vendors v
      where v.id = inventory.vendor_id
        and v.verification_status = 'verified'
    )
    and public.get_my_company_id() is not null
  );

-- Inventory movements: vendor can read and write own
create policy "inventory_movements_vendor_rw"
  on public.inventory_movements for all
  using (vendor_id = public.get_my_vendor_id());

-- Company users can read movements for verified vendors (for PO tracking context)
create policy "inventory_movements_company_read"
  on public.inventory_movements for select
  using (
    exists (
      select 1 from public.vendors v
      where v.id = inventory_movements.vendor_id
        and v.verification_status = 'verified'
    )
    and public.get_my_company_id() is not null
  );

-- Computed view for availability status
create or replace view public.product_availability as
select
  i.product_id,
  i.vendor_id,
  i.quantity_on_hand,
  i.quantity_reserved,
  i.quantity_on_hand - i.quantity_reserved as quantity_available,
  i.reorder_point,
  case
    when i.quantity_on_hand - i.quantity_reserved <= 0              then 'out_of_stock'
    when i.reorder_point is not null
      and i.quantity_on_hand - i.quantity_reserved <= i.reorder_point then 'low_stock'
    else                                                               'in_stock'
  end as availability_status
from public.inventory i;
```

---

## Relationships

```
public.products (1)
  └── public.inventory (1:1 per vendor)
        └── public.inventory_movements (N) — full movement history

public.inventory
  └── public.product_availability (view) — computed availability status

Inventory movement triggers:
  Phase 20 (Purchase Orders): 'reserved' movement on PO creation
  Phase 20 (Purchase Orders): 'shipped' + 'unreserved' on delivery confirmation
  Phase 14: 'adjustment', 'received', 'damaged' from vendor manual entry
```

---

---

## API Endpoints

| Operation | Method | Implementation | Notes |
|---|---|---|---|
| Get inventory record for a product | Server Component | `supabase.from('inventory').select('*').eq('product_id', id)` | Vendor-scoped via RLS |
| Create inventory record | Client mutation | `supabase.from('inventory').insert()` | Auto-created on product publish; vendor only |
| Update stock levels | Client mutation | `supabase.from('inventory').update({ quantity_on_hand, reorder_point, reorder_quantity })` | Vendor only |
| Log inventory movement | Client mutation | `supabase.from('inventory_movements').insert()` | Vendor creates manual movements; PO phases create system movements |
| Get movement history for a product | Server Component | `supabase.from('inventory_movements').select('*').eq('inventory_id', id).order('created_at', { ascending: false })` | Vendor only |
| Get availability view (company) | Server Component | `supabase.from('product_availability').select('*').eq('product_id', id)` | Company users read availability status |
| Bulk update stock (vendor import) | Edge Function | `bulk-update-inventory` | Accepts CSV payload; applies updates server-side with service role |
| Get low-stock products | Server Component | `supabase.from('product_availability').select('*').eq('availability_status', 'low_stock')` | Powers reorder alert dashboard widget |

---

## Supabase Services Used

```
Supabase Database:
  - public.inventory             — stock levels per product per vendor
  - public.inventory_movements   — full audit log of every stock change
  - public.product_availability  — computed view: available qty + status label

Supabase Storage:
  - Not used in Phase 14

Supabase Edge Functions:
  - bulk-update-inventory        — CSV-based bulk stock level import for vendors
                                   with many SKUs; uses service role to bypass
                                   per-row RLS check overhead for large payloads
```

---

## Folder Structure

```
src/
├── app/
│   └── (vendor)/
│       └── catalog/
│           └── inventory/
│               ├── page.tsx                        [Inventory overview — all products]
│               └── [productId]/
│                   └── page.tsx                    [Single product inventory detail + movement log]
└── components/
    └── modules/
        └── inventory/
            ├── inventory-overview-table.tsx         [All products with stock levels]
            ├── inventory-edit-form.tsx              [Update qty, reorder point, location]
            ├── inventory-movement-form.tsx          [Log manual movement (adjustment/received/damaged)]
            ├── inventory-movement-table.tsx         [Movement history DataTable]
            ├── stock-status-badge.tsx               [in_stock / low_stock / out_of_stock]
            ├── reorder-alert-banner.tsx             [Banner shown when products are below reorder point]
            └── index.ts
```

---

## UI Screens

### Screen 14.1 — Inventory Overview (`/vendor/catalog/inventory`)

`PageHeader`: title "Inventory", action "Update Stock" (opens bulk update sheet).

**KPI row** (4 cards):
| KPI Card | Value |
|---|---|
| Total Products | Count of active products |
| In Stock | Count with availability_status = 'in_stock' |
| Low Stock | Count with availability_status = 'low_stock' (amber) |
| Out of Stock | Count with availability_status = 'out_of_stock' (red) |

`ReorderAlertBanner` shown above the table when any product is at or below its reorder point. "Dismiss" hides it for the session only.

`DataTable` (InventoryOverviewTable) listing all active products with their current inventory. Default sort: out_of_stock first, then low_stock, then in_stock, then alphabetical.

---

### Screen 14.2 — Product Inventory Detail (`/vendor/catalog/inventory/[productId]`)

`PageHeader`: title "[Product Name] — Inventory", breadcrumb Inventory → [Product Name].

Two-section layout:

**Section 1 — Current Stock:**
`InventoryEditForm` panel showing current quantity on hand, reserved quantity (read-only, system-managed), available quantity (computed), reorder point, reorder quantity, warehouse location. "Save Changes" button.

**Section 2 — Movement History:**
`InventoryMovementForm` for logging a new manual movement (type, quantity, notes). Below it, `InventoryMovementTable` shows the full movement log for this product in descending date order.

---

### Screen 14.3 — Stock Status on Vendor Catalog (Company View)

No new page. The `StockStatusBadge` component is embedded into:
- The `ProductCard` component (Phase 12 Screen 12.3)
- The vendor profile Products tab
- The RFQ item picker (Phase 16)

Availability data is fetched from the `product_availability` view. Company users see "In Stock", "Low Stock", or "Out of Stock" without seeing the raw quantity values.

---

## Components

### `InventoryOverviewTable`

```typescript
interface InventoryOverviewTableProps {
  vendorId: string
}
```

Fetches all active products joined with their `inventory` record and `product_availability` view entry. Renders a `DataTable`. If a product has no inventory record yet (newly created product), renders a "Set stock" action that creates the inventory row inline.

### `StockStatusBadge`

```typescript
interface StockStatusBadgeProps {
  status: 'in_stock' | 'low_stock' | 'out_of_stock'
  showQuantity?: boolean
  quantity?: number
}
```

Renders a `StatusBadge` with:
- `in_stock` → green, "In Stock"
- `low_stock` → amber, "Low Stock"
- `out_of_stock` → red, "Out of Stock"

When `showQuantity = true` and the user is a vendor, appends the available quantity in parentheses. Company users never see raw quantity — `showQuantity` is always false in company-facing contexts.

### `InventoryEditForm`

```typescript
interface InventoryEditFormProps {
  inventory:   Tables<'inventory'>
  onSubmit:    (data: InventoryEditData) => Promise<void>
  isLoading?:  boolean
}
```

Fields: quantity_on_hand, reorder_point, reorder_quantity, warehouse_location. Reserved quantity is shown as read-only. Available quantity is computed and shown as a derived display field (not a form input).

### `InventoryMovementForm`

```typescript
interface InventoryMovementFormProps {
  inventoryId: string
  productId:   string
  vendorId:    string
  onSuccess:   () => void
}
```

Dropdown for movement_type (adjustment / received / damaged only — 'reserved', 'shipped', 'unreserved' are system-only types not available in the manual form). Quantity input (positive integer). Notes textarea. "Log Movement" submit button.

### `InventoryMovementTable`

```typescript
interface InventoryMovementTableProps {
  inventoryId: string
}
```

`DataTable` with columns: Date/Time, Type (badge), Quantity Change (+N / -N coloured), Reference, Notes, Created By. Paginated (25 rows). No filtering required in v1 — full log shown in reverse chronological order.

### `ReorderAlertBanner`

```typescript
interface ReorderAlertBannerProps {
  lowStockCount:     number
  outOfStockCount:   number
}
```

Amber banner shown when `lowStockCount > 0` or `outOfStockCount > 0`. Message: "X product(s) are running low or out of stock. Review your inventory." Includes a "View Low Stock" link that applies the low_stock/out_of_stock filter to the InventoryOverviewTable.

---

## Forms

### Form 14.1 — Inventory Edit Form

| Field | Type | Validation |
|---|---|---|
| Quantity on hand | integer input | Required, min 0, max 999,999 |
| Reorder point | integer input | Optional, min 0; must be less than quantity_on_hand if both provided |
| Reorder quantity | integer input | Optional, min 1 |
| Warehouse location | text input | Optional, max 200 chars |

```typescript
const inventoryEditSchema = z.object({
  quantity_on_hand:  z.number().int().min(0).max(999999),
  reorder_point:     z.number().int().min(0).optional().nullable(),
  reorder_quantity:  z.number().int().min(1).optional().nullable(),
  warehouse_location: z.string().max(200).optional().nullable(),
})
```

On save, the form also inserts an `inventory_movements` row with `movement_type = 'adjustment'` and `quantity_change = new_qty - old_qty` to maintain the audit trail even for direct edits.

---

### Form 14.2 — Inventory Movement Form

| Field | Type | Validation |
|---|---|---|
| Movement type | select | Required; values: adjustment, received, damaged |
| Quantity | integer input | Required, min 1 |
| Notes | textarea | Optional, max 500 chars |

```typescript
const movementSchema = z.object({
  movement_type: z.enum(['adjustment', 'received', 'damaged']),
  quantity:      z.number().int().min(1),
  notes:         z.string().max(500).optional(),
})
```

The `quantity_change` written to `inventory_movements` is derived from the type: `received` → positive, `damaged` → negative, `adjustment` → sign provided by the user (a separate "increase / decrease" toggle is rendered).

---

## Tables

### Inventory Overview Table

| Column | Sortable | Filterable |
|---|---|---|
| Product name | Yes | Yes (search) |
| SKU | No | No |
| On hand | Yes | No |
| Reserved | No | No |
| Available | Yes | No |
| Status | Yes | Yes (in_stock / low_stock / out_of_stock) |
| Reorder point | No | No |
| Last updated | Yes | No |
| Actions | No | No |

---

### Inventory Movement Table

| Column | Sortable | Filterable |
|---|---|---|
| Date / Time | Yes (desc default) | No |
| Type | No | No |
| Quantity change | No | No |
| Reference | No | No |
| Notes | No | No |
| Created by | No | No |

---

## Permissions

```
Inventory management (/vendor/catalog/inventory):
  - All reads and writes: vendor_user role only
  - RLS policy "inventory_vendor_rw": vendor_id = get_my_vendor_id()
  - Reserved quantity updates: system-only via PO Edge Functions (Phase 20)
  - Manual movement types 'reserved', 'shipped', 'unreserved': not available in UI

Inventory read (company view):
  - Company users read product_availability view only
  - Raw quantity_on_hand and quantity_reserved are NOT exposed to company users
  - RLS policy "inventory_company_read": verified vendors only, get_my_company_id() not null

Movement log:
  - Vendor can read and create movements for own products
  - Company users cannot read movement history (operational data)
  - Platform admin can read all movements (not implemented in v1 UI; accessible via Supabase dashboard)

Bulk update Edge Function:
  - Called by vendor_user only; JWT verified inside the function
  - Service role used internally for batch writes
```

---

## Validation Rules

```
quantity_on_hand:
  - Integer, min 0, max 999,999
  - Cannot be set below quantity_reserved
    Error: "On-hand quantity cannot be less than reserved quantity ({reserved})"

reorder_point:
  - Optional; if provided must be >= 0
  - Should be less than quantity_on_hand to be meaningful (soft warning, not hard error)

reorder_quantity:
  - Optional; if provided must be >= 1

movement quantity (manual):
  - Integer, min 1
  - For 'adjustment' + decrease: resulting quantity_on_hand must not go below 0
    Error: "This adjustment would result in a negative stock level"
  - For 'damaged': same check as decrease adjustment

warehouse_location:
  - Free text, max 200 characters
  - No format enforcement; vendor enters their own location codes

Bulk import:
  - CSV row must have product_id (UUID) and quantity_on_hand (integer)
  - Rows with unknown product_id are skipped with error row in response
  - Rows with quantity_on_hand < quantity_reserved are skipped with error row
  - Max 500 rows per import in v1
```

---

## Business Rules

```
BR-14.1  Every published product must have an inventory record. When a product is
         set to is_active = true for the first time, an inventory record is
         auto-created with quantity_on_hand = 0 if one does not exist.

BR-14.2  quantity_reserved is system-managed only. It is incremented when a
         Purchase Order is created (Phase 20) and decremented on PO cancellation
         or delivery confirmation. Vendors cannot manually edit quantity_reserved.

BR-14.3  quantity_available = quantity_on_hand - quantity_reserved.
         This computed value is surfaced in the product_availability view.
         Availability status is derived from quantity_available:
           - 0 or below  → 'out_of_stock'
           - 1 to reorder_point → 'low_stock' (only when reorder_point is set)
           - above reorder_point, or any positive value if no reorder_point → 'in_stock'

BR-14.4  Every manual change to quantity_on_hand must produce an inventory_movements
         row. Direct edits via InventoryEditForm create an 'adjustment' movement
         automatically. This ensures the movement log is always a complete record
         of how the current quantity was reached.

BR-14.5  Availability status is the only inventory data exposed to company users.
         Raw quantities (on_hand, reserved, available as a number) are vendor-
         private operational data. Company-facing surfaces show only the status label.

BR-14.6  Out-of-stock products remain visible in company-facing catalog views with
         an "Out of Stock" badge. They are not hidden. Buyers can still initiate
         an RFQ for out-of-stock products (future delivery); the badge is informational.

BR-14.7  The reorder alert (ReorderAlertBanner) is a vendor-facing operational tool
         only. It does not trigger any email notification in v1. Email notifications
         for low stock are deferred to Phase 28 (Notification System).
```

---

## Security

```
- inventory writes: RLS enforces vendor_id = get_my_vendor_id()
  A vendor cannot view or modify inventory records for another vendor's products.

- Reserved quantity: quantity_reserved is updated only by system-level mutations
  from PO Edge Functions using service role. No client-side path to update
  quantity_reserved directly exists. RLS column-level security enforced via
  trigger: update on quantity_reserved column raises exception if called from
  a non-service-role connection.

- product_availability view: exposes no PII and no sensitive financial data.
  Public to all authenticated company users scoped to verified vendors only.

- Movement log: inventory_movements has vendor_id RLS enforced.
  Cross-vendor data leakage is not possible via the RLS policies.

- Bulk import Edge Function: authenticates the calling user via JWT,
  verifies vendor_id ownership of every product_id in the CSV before writing.
  Rows belonging to a different vendor are rejected regardless of role.

- quantity_on_hand cap (999,999): prevents integer overflow and unrealistic
  stock levels that could be used to manipulate availability signals.
```

---

## State Management

Inventory data is live operational data — lower stale times than categories:

```typescript
// Inventory overview for vendor
export function useVendorInventory(vendorId: string) {
  const supabase = useSupabase()
  return useQuery({
    queryKey: ['inventory', 'overview', vendorId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_availability')
        .select('*, products(id, name, sku, is_active)')
        .eq('vendor_id', vendorId)
        .eq('products.is_active', true)
        .order('availability_status', { ascending: true })  // out_of_stock first
      if (error) throw error
      return data ?? []
    },
    staleTime: 60 * 1000,    // 1 minute — stock levels change with PO activity
    gcTime:    5 * 60 * 1000,
  })
}

// Single product inventory detail
export function useProductInventory(productId: string) {
  const supabase = useSupabase()
  return useQuery({
    queryKey: ['inventory', 'product', productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inventory')
        .select('*')
        .eq('product_id', productId)
        .maybeSingle()
      if (error) throw error
      return data
    },
    staleTime: 30 * 1000,    // 30 seconds on the detail page
  })
}

// Movement log for a product
export function useInventoryMovements(inventoryId: string) {
  const supabase = useSupabase()
  return useQuery({
    queryKey: ['inventory-movements', inventoryId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inventory_movements')
        .select('*, profiles(full_name)')
        .eq('inventory_id', inventoryId)
        .order('created_at', { ascending: false })
        .limit(100)
      if (error) throw error
      return data ?? []
    },
    staleTime: 30 * 1000,
  })
}
```

After any inventory mutation (edit form or movement form), invalidate both `['inventory', 'overview', vendorId]` and `['inventory', 'product', productId]` to keep the table and KPI cards in sync immediately.

No Zustand store. TanStack Query cache is sufficient for all inventory state.

---

## Development Tasks

### Task 14.1 — Migration
Apply migration `0017_create_inventory.sql`. Verify `inventory`, `inventory_movements` tables and `product_availability` view created correctly. Regenerate `database.ts` types. Confirm RLS policies are active on both tables.

### Task 14.2 — Auto-Create Inventory on Product Publish
Add a Supabase trigger or application-side check: when a product's `is_active` is set to `true` and no `inventory` row exists for that `product_id`, insert one with `quantity_on_hand = 0`. This ensures every active product always has an inventory record. Implement as a Postgres trigger on `products` (`after update of is_active`).

### Task 14.3 — StockStatusBadge Component
Implement `StockStatusBadge` first — it is needed by Phase 12 ProductCard and Phase 16 RFQ item picker. Export from `components/modules/inventory/index.ts`. Wire into Phase 12 `ProductCard` now.

### Task 14.4 — Inventory Overview Page
Implement `/vendor/catalog/inventory/page.tsx` as a Server Component. Render KPI cards (4 cards using `KPICard`), `ReorderAlertBanner` (conditional), and `InventoryOverviewTable`. The table is a Client Component using `useVendorInventory`.

### Task 14.5 — Product Inventory Detail Page
Implement `/vendor/catalog/inventory/[productId]/page.tsx`. Render `InventoryEditForm` (left/top) and `InventoryMovementForm` + `InventoryMovementTable` (right/bottom). Wire mutations with query invalidation.

### Task 14.6 — InventoryEditForm with Audit Row
Implement form submission so that saving the edit form also inserts an `inventory_movements` row (`movement_type = 'adjustment'`, `quantity_change = new - old`). This must be done in a single RPC or two sequential mutations with error handling to ensure consistency.

### Task 14.7 — InventoryMovementForm
Implement the manual movement form. Include the increase/decrease toggle for `adjustment` type. Derive `quantity_change` sign from toggle + movement type before inserting. Validate that the resulting `quantity_on_hand` would not go negative.

### Task 14.8 — Bulk Update Edge Function
Implement `supabase/functions/bulk-update-inventory/index.ts`. Accept JSON array `[{ product_id, quantity_on_hand }]`. Verify each product belongs to the authenticated vendor. Upsert inventory rows. Return a response with success count and error rows.

### Task 14.9 — Company-Side Availability Badge
Wire `StockStatusBadge` into the company-facing vendor profile Products tab (Phase 10 Screen 10.3) and the marketplace product grid (Phase 9). Fetch availability from `product_availability` view. Company users see the status label only, never raw quantities.

---

## Testing Checklist

```
✓ Migration 0017: inventory and inventory_movements tables created; product_availability view created
✓ RLS: vendor user can only read/write own inventory records
✓ RLS: company user can read product_availability for verified vendors only
✓ RLS: company user cannot read inventory_movements
✓ Auto-create trigger: activating a product creates inventory row with quantity_on_hand = 0
✓ InventoryEditForm: saving updates quantity_on_hand and inserts adjustment movement row
✓ InventoryEditForm: save blocked when new quantity_on_hand < quantity_reserved
✓ InventoryMovementForm: 'received' movement increases quantity_on_hand correctly
✓ InventoryMovementForm: 'damaged' movement decreases quantity_on_hand correctly
✓ InventoryMovementForm: decrease blocked when result would be negative
✓ Movement log: all movements appear in InventoryMovementTable in descending date order
✓ product_availability view: availability_status = 'out_of_stock' when available = 0
✓ product_availability view: availability_status = 'low_stock' when available <= reorder_point
✓ product_availability view: availability_status = 'in_stock' when above reorder_point
✓ product_availability view: 'in_stock' for any positive quantity when reorder_point is null
✓ StockStatusBadge: renders correct colour and label for all three statuses
✓ KPI cards: In Stock / Low Stock / Out of Stock counts accurate after stock changes
✓ ReorderAlertBanner: shown when low_stock or out_of_stock products exist; hidden otherwise
✓ Company view: StockStatusBadge visible on ProductCard; no raw quantity shown
✓ Bulk update Edge Function: valid rows updated; invalid rows returned in error list
✓ Bulk update Edge Function: rows for foreign vendor_id rejected
✓ pnpm build: no TypeScript errors; pnpm lint: zero warnings
```

---

## Acceptance Criteria

```
AC-14.1  Migration 0017 applied; inventory and inventory_movements tables active with RLS
AC-14.2  Every active product has an inventory record (auto-created trigger in place)
AC-14.3  Vendor can update stock levels via InventoryEditForm; change creates audit movement
AC-14.4  Vendor can log manual movements (received, adjustment, damaged) with notes
AC-14.5  Full movement history visible per product in InventoryMovementTable
AC-14.6  product_availability view correctly computes status for all three states
AC-14.7  StockStatusBadge displays correct label and colour on vendor and company-facing surfaces
AC-14.8  Company users see availability status only — no raw quantity values exposed
AC-14.9  KPI cards on inventory overview accurate; ReorderAlertBanner triggers correctly
AC-14.10 Bulk update Edge Function accepts CSV-equivalent JSON payload; validates vendor ownership
```

---

## Definition of Done

Phase 14 is complete when all Acceptance Criteria above are met AND:

- [ ] All TypeScript checks pass (zero errors)
- [ ] All ESLint checks pass (zero warnings)
- [ ] Migration 0017 applied and committed; `database.ts` regenerated
- [ ] Auto-create trigger tested: activating a product creates inventory row
- [ ] InventoryEditForm tested: saves update and creates audit movement atomically
- [ ] InventoryMovementForm tested: positive and negative movement types both work
- [ ] product_availability view: all three statuses verified in the test suite
- [ ] StockStatusBadge wired into Phase 12 ProductCard (company view)
- [ ] Company user confirmed unable to read raw inventory quantities via RLS
- [ ] Bulk update Edge Function deployed to Supabase and tested
- [ ] PR merged to `develop` with at least 1 reviewer approval
- [ ] `feature/14-inventory-management` branch merged and deleted

---

## Risk Factors

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Race condition between manual quantity edit and PO reservation update | Medium | Medium | quantity_reserved is only modified by service-role PO Edge Functions; manual edits only touch quantity_on_hand; no shared lock contention in v1 volumes |
| Auto-create trigger fires twice if product activated in quick succession | Low | Low | Unique constraint on (product_id, vendor_id) makes duplicate inserts a no-op conflict; use ON CONFLICT DO NOTHING in trigger function |
| quantity_on_hand - quantity_reserved goes negative due to concurrent PO creation | Low | Medium | PO reservation uses a DB function with a check; validation error returned if insufficient stock; revisit with advisory locks in Phase 20 |
| Company user probing inventory table directly via Supabase JS SDK | Low | High | RLS policy "inventory_company_read" only selects from product_availability view; direct table access returns empty result set for company users |
| Bulk import with 500+ rows causing Edge Function timeout | Low | Low | Cap at 500 rows with validation; document limit in UI; Phase 31 can add async bulk processing if needed |

---

## Best Practices

- Always write the audit movement row in the same operation as the inventory update — use a Postgres function or Edge Function for atomicity, not two sequential client mutations
- Never expose `quantity_on_hand` or `quantity_reserved` directly to company-facing API calls; gate all company reads through the `product_availability` view
- Keep `staleTime` short (30–60 seconds) for inventory data — stock levels change with PO activity and stale data misleads buyers
- Use `ON CONFLICT DO NOTHING` on the auto-create inventory trigger to handle duplicate activation events gracefully
- Reserve movement types `'reserved'`, `'shipped'`, and `'unreserved'` for system-only use; enforce this at the application layer by excluding them from the manual movement form's type dropdown

---

## Estimated Completion

**3–4 working days.** The migration and view are straightforward. The main complexity is the atomic edit + audit-row pattern in `InventoryEditForm` and the auto-create trigger. Wiring `StockStatusBadge` across Phase 12 and Phase 9 surfaces adds one additional integration day.

---

---

**** END OF PART 3 ****


---

# PHASE 15 — PROCUREMENT REQUESTS

---

## Overview

| Field | Value |
|---|---|
| Phase Number | 15 |
| Phase Name | Procurement Requests |
| Milestone | M4 — Procurement Lifecycle |
| PRD Reference | Module 12 — Purchase Request (PR), Module 13 — Approval Workflow |
| DESIGN Reference | Section 3 (Company — Procurement), F01, F03 |
| Estimated Duration | 4–5 days |
| Prerequisite Phases | Phase 5 (Company Workspace), Phase 6 (IAM), Phase 7 (Employee Management), Phase 12 (Product Catalog) |

---

## Purpose

Phase 15 implements the Purchase Request (PR) workflow — the entry point of the entire procurement lifecycle. Company employees create structured purchase requests describing what they need, in what quantity, by what date, and at what priority. Requests flow through an approval chain before advancing to RFQ generation. This phase establishes the `purchase_requests` and `purchase_request_items` tables, the approval workflow, and all company-side screens for creating, reviewing, and actioning requests.

---

## Business Goal

Unstructured procurement begins with ad-hoc emails and verbal requests that leave no audit trail. The Purchase Request module replaces this with a formal, logged demand signal that every procurement stakeholder can see. Approval workflow ensures the right people authorize spend before any vendor engagement occurs, reducing unauthorized purchasing and giving Finance visibility into committed spend before it materialises.

---

## Dependencies

- Phase 5 complete (`companies`, `company_workspaces` tables)
- Phase 6 complete (`roles`, `permissions`, IAM framework)
- Phase 7 complete (`employees`, `departments` tables)
- Phase 12 complete (`products` table — used for PR line items)
- Phase 13 complete (`product_categories` — used in PR item category filter)
- Phase 2 `DataTable`, `PageHeader`, `KPICard`, `StatusBadge`, `Sheet`, `Timeline` components

---

## Database Tables

Migration: `0018_create_purchase_requests.sql`

```sql
-- ============================================================
-- Migration: 0018_create_purchase_requests
-- Description: Purchase Request (PR) and approval workflow
-- ============================================================

create table public.purchase_requests (
  id               uuid primary key default gen_random_uuid(),
  company_id       uuid not null references public.companies(id) on delete cascade,
  pr_number        text not null,             -- auto-generated: PR-{YYYY}-{seq}
  title            text not null,
  description      text,
  priority         text not null default 'medium'
                     check (priority in ('low','medium','high','urgent')),
  status           text not null default 'draft'
                     check (status in (
                       'draft',        -- created, not yet submitted
                       'submitted',    -- awaiting approval
                       'approved',     -- approved, ready for RFQ
                       'rejected',     -- rejected by approver
                       'rfq_created',  -- at least one RFQ raised from this PR
                       'completed',    -- all items fulfilled via PO
                       'cancelled'
                     )),
  requested_by     uuid not null references public.profiles(id),
  department_id    uuid references public.departments(id),
  required_date    date,                       -- requested delivery date
  budget_amount    numeric(15,2),              -- optional budget ceiling
  currency         text not null default 'INR',
  notes            text,
  rejection_reason text,
  submitted_at     timestamptz,
  approved_at      timestamptz,
  rejected_at      timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create sequence public.pr_number_seq;

create unique index idx_pr_number_company on public.purchase_requests(company_id, pr_number);
create index idx_pr_company_id    on public.purchase_requests(company_id);
create index idx_pr_requested_by  on public.purchase_requests(requested_by);
create index idx_pr_status        on public.purchase_requests(status);
create index idx_pr_created_at    on public.purchase_requests(created_at desc);

create trigger trg_pr_updated_at
  before update on public.purchase_requests
  for each row execute function public.handle_updated_at();

-- Line items on a purchase request
create table public.purchase_request_items (
  id              uuid primary key default gen_random_uuid(),
  pr_id           uuid not null references public.purchase_requests(id) on delete cascade,
  product_id      uuid references public.products(id) on delete set null,
  category_id     uuid references public.product_categories(id) on delete set null,
  item_name       text not null,          -- free-text if no product linked
  description     text,
  quantity        numeric(12,3) not null check (quantity > 0),
  unit_of_measure text not null default 'piece',
  estimated_price numeric(12,2),          -- per unit estimate
  currency        text not null default 'INR',
  specifications  text,                   -- free-text technical requirements
  sort_order      integer not null default 0,
  created_at      timestamptz not null default now()
);

create index idx_pr_items_pr_id      on public.purchase_request_items(pr_id);
create index idx_pr_items_product_id on public.purchase_request_items(product_id);

-- Approval steps for a purchase request
create table public.pr_approvals (
  id             uuid primary key default gen_random_uuid(),
  pr_id          uuid not null references public.purchase_requests(id) on delete cascade,
  approver_id    uuid not null references public.profiles(id),
  step_order     integer not null default 1,
  status         text not null default 'pending'
                   check (status in ('pending','approved','rejected','skipped')),
  comments       text,
  decided_at     timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index idx_pr_approvals_pr_id      on public.pr_approvals(pr_id);
create index idx_pr_approvals_approver   on public.pr_approvals(approver_id);

create trigger trg_pr_approvals_updated_at
  before update on public.pr_approvals
  for each row execute function public.handle_updated_at();

-- PR attachments
create table public.pr_attachments (
  id          uuid primary key default gen_random_uuid(),
  pr_id       uuid not null references public.purchase_requests(id) on delete cascade,
  file_name   text not null,
  file_url    text not null,
  file_size   integer,
  uploaded_by uuid references public.profiles(id),
  created_at  timestamptz not null default now()
);

create index idx_pr_attachments_pr_id on public.pr_attachments(pr_id);

-- RLS
alter table public.purchase_requests      enable row level security;
alter table public.purchase_request_items enable row level security;
alter table public.pr_approvals           enable row level security;
alter table public.pr_attachments         enable row level security;

-- Company members can read all PRs for their company
create policy "pr_company_read"
  on public.purchase_requests for select
  using (company_id = public.get_my_company_id());

-- Requestor can create and update own draft PRs
create policy "pr_own_write"
  on public.purchase_requests for insert
  with check (
    company_id = public.get_my_company_id()
    and requested_by = auth.uid()
  );

create policy "pr_own_update"
  on public.purchase_requests for update
  using (
    company_id = public.get_my_company_id()
    and (
      requested_by = auth.uid()           -- own draft
      or public.has_permission('procurement_requests', 'approve')  -- approver
    )
  );

-- Items and attachments follow the PR's company scope
create policy "pr_items_company_read"
  on public.purchase_request_items for select
  using (
    exists (
      select 1 from public.purchase_requests pr
      where pr.id = purchase_request_items.pr_id
        and pr.company_id = public.get_my_company_id()
    )
  );

create policy "pr_items_write"
  on public.purchase_request_items for all
  using (
    exists (
      select 1 from public.purchase_requests pr
      where pr.id = purchase_request_items.pr_id
        and pr.company_id = public.get_my_company_id()
        and (pr.requested_by = auth.uid() or public.has_permission('procurement_requests', 'edit'))
    )
  );

create policy "pr_approvals_company_read"
  on public.pr_approvals for select
  using (
    exists (
      select 1 from public.purchase_requests pr
      where pr.id = pr_approvals.pr_id
        and pr.company_id = public.get_my_company_id()
    )
  );

create policy "pr_approvals_write"
  on public.pr_approvals for all
  using (
    exists (
      select 1 from public.purchase_requests pr
      where pr.id = pr_approvals.pr_id
        and pr.company_id = public.get_my_company_id()
    )
    and approver_id = auth.uid()
  );

create policy "pr_attachments_company_rw"
  on public.pr_attachments for all
  using (
    exists (
      select 1 from public.purchase_requests pr
      where pr.id = pr_attachments.pr_id
        and pr.company_id = public.get_my_company_id()
    )
  );
```

---

## Relationships

```
public.companies (1)
  └── public.purchase_requests (N)
        ├── public.purchase_request_items (N)  — line items
        ├── public.pr_approvals (N)            — approval chain
        └── public.pr_attachments (N)          — supporting documents

public.purchase_requests (N)
  └── referenced by public.rfqs (Phase 16)    — RFQ raised from a PR
  └── referenced by public.rfq_items          — items carried into RFQ

public.purchase_request_items
  ├── references public.products (optional FK)
  └── references public.product_categories (optional FK)
```

---

## API Endpoints

| Operation | Method | Implementation | Notes |
|---|---|---|---|
| List PRs (company) | Server Component | `supabase.from('purchase_requests').select('*, purchase_request_items(*), profiles(*)')` | Filtered by company_id via RLS |
| Get single PR | Server Component | `supabase.from('purchase_requests').select('*, purchase_request_items(*), pr_approvals(*), pr_attachments(*)')` | Full detail view |
| Create PR (draft) | Client mutation | `supabase.from('purchase_requests').insert()` | status = 'draft' |
| Update PR | Client mutation | `supabase.from('purchase_requests').update()` | Draft only |
| Submit PR for approval | Edge Function | `submit-purchase-request` | Sets status = 'submitted'; creates pr_approvals rows; sends notifications |
| Approve / Reject PR | Client mutation | `supabase.from('pr_approvals').update({ status, comments, decided_at })` + `supabase.from('purchase_requests').update({ status })` | Two-step mutation |
| Cancel PR | Client mutation | `supabase.from('purchase_requests').update({ status: 'cancelled' })` | Requestor or procurement manager |
| Upload PR attachment | Client | `supabase.storage.from('pr-attachments').upload()` + `supabase.from('pr_attachments').insert()` | |
| Delete PR attachment | Client mutation | `supabase.from('pr_attachments').delete()` + storage.remove() | |
| Generate PR number | Edge Function | `generate-pr-number` | Returns next PR-{YYYY}-{seq} for company |

**`supabase/functions/submit-purchase-request/index.ts`** (key logic):

```typescript
// 1. Authenticate user and verify PR belongs to their company
// 2. Validate PR has at least 1 line item
// 3. Determine approval chain based on:
//    - PR budget_amount vs. approval thresholds stored in company_settings
//    - Department approval rules
// 4. Insert pr_approvals rows for each approver in sequence (step_order 1, 2, ...)
// 5. Update purchase_requests.status = 'submitted', submitted_at = now()
// 6. Notify first approver via notification system (Phase 28)
// Returns: { pr_id, approval_steps: number }
```

---

## Supabase Services Used

```
Supabase Database:
  - public.purchase_requests       — core PR records
  - public.purchase_request_items  — line items per PR
  - public.pr_approvals            — approval chain per PR
  - public.pr_attachments          — metadata for uploaded files

Supabase Storage:
  - pr-attachments bucket          — private; signed URLs for download
  - Path: pr-attachments/[company_id]/[pr_id]/[file_id].[ext]

Supabase Edge Functions:
  - submit-purchase-request        — validates and submits PR; builds approval chain
  - generate-pr-number             — generates sequential PR number per company
```

---

## Folder Structure

```
src/
├── app/
│   └── (company)/
│       └── procurement/
│           └── requests/
│               ├── page.tsx                        [PR list page]
│               ├── new/
│               │   └── page.tsx                    [Create PR page]
│               └── [id]/
│                   ├── page.tsx                    [PR detail / review page]
│                   └── edit/
│                       └── page.tsx                [Edit draft PR page]
└── components/
    └── modules/
        └── procurement/
            ├── purchase-request-form.tsx
            ├── purchase-request-items-editor.tsx
            ├── purchase-request-table.tsx
            ├── purchase-request-detail.tsx
            ├── purchase-request-approval-panel.tsx
            ├── purchase-request-status-badge.tsx
            ├── pr-attachment-uploader.tsx
            └── index.ts
```

---

## UI Screens

### Screen 15.1 — Purchase Requests List (`/company/procurement/requests`)

`PageHeader`: title "Purchase Requests", action "New Request".

**KPI row** (4 cards):
| KPI Card | Value |
|---|---|
| Total PRs | All non-cancelled requests |
| Pending Approval | Count with status = 'submitted' |
| Approved | Count with status = 'approved' |
| Rejected | Count with status = 'rejected' |

`DataTable` (PurchaseRequestTable). Default sort: created_at descending.

Filters: status (multi-select), priority (multi-select), date range (created_at), requested_by (employee dropdown), department.

---

### Screen 15.2 — Create Purchase Request (`/company/procurement/requests/new`)

`PageHeader`: title "New Purchase Request", breadcrumb Procurement → Requests → New.

Two-section layout:
- **Section 1 — Request Header**: title, description, priority, required date, department, budget amount, notes.
- **Section 2 — Line Items**: `PurchaseRequestItemsEditor` — an editable table allowing users to add/remove/reorder line items. Each item: item name (with optional product lookup), category, quantity, UOM, estimated unit price, specifications.

"Save as Draft" and "Submit for Approval" actions in the page footer.

"Add Item" button appends a new empty row. "Link Product" button opens a product search sheet to pre-fill item fields from the vendor catalog.

---

### Screen 15.3 — PR Detail (`/company/procurement/requests/[id]`)

`PageHeader`: title "[PR Number] — [Title]", breadcrumb Procurement → Requests → [PR Number].

Five panels:

1. **Request Summary**: status badge, priority, requested by, department, required date, budget, submitted at.
2. **Line Items**: read-only table of all items with quantities and estimates.
3. **Approval Timeline**: `PRApprovalPanel` — vertical `Timeline` showing each approver, their step, status, timestamp, and comments. Pending approver sees "Approve" and "Reject" action buttons inline.
4. **Attachments**: list of files with download (signed URL) and delete actions.
5. **Activity Log**: chronological log of all status changes with actor and timestamp.

Requestor can edit if status = 'draft'. Requestor can cancel if status = 'draft' or 'submitted'. Approver sees action buttons in the approval timeline panel only for their own pending step.

---

### Screen 15.4 — Edit Draft PR (`/company/procurement/requests/[id]/edit`)

Identical layout to Screen 15.2 pre-populated with existing data. Available only when status = 'draft'. Redirects to detail page on save.

---

## Components

### `PurchaseRequestForm`

```typescript
interface PurchaseRequestFormProps {
  defaultValues?:  Partial<PurchaseRequestFormData>
  onSubmit:        (data: PurchaseRequestFormData, action: 'draft' | 'submit') => Promise<void>
  isLoading?:      boolean
}
```

Renders the header section: title, description, priority (select), department (select), required date (date picker), budget amount, notes. "Save as Draft" and "Submit for Approval" buttons at the bottom.

### `PurchaseRequestItemsEditor`

```typescript
interface PurchaseRequestItemsEditorProps {
  items:       PurchaseRequestItem[]
  onChange:    (items: PurchaseRequestItem[]) => void
  readOnly?:   boolean
}
```

Editable table with inline add/remove row actions. Each row: item name (text or autocomplete from product catalog), category (dropdown), quantity (number), UOM (select), estimated price (currency input), specifications (textarea expands in a modal). "Link Product" icon button next to item name opens a product search sheet. When a product is selected, item fields auto-populate.

### `PurchaseRequestStatusBadge`

```typescript
interface PurchaseRequestStatusBadgeProps {
  status: 'draft' | 'submitted' | 'approved' | 'rejected' | 'rfq_created' | 'completed' | 'cancelled'
}
```

Coloured status badge:
- `draft` → grey
- `submitted` → amber
- `approved` → green
- `rejected` → red
- `rfq_created` → blue
- `completed` → green (dark)
- `cancelled` → grey (dark)

### `PRApprovalPanel`

```typescript
interface PRApprovalPanelProps {
  prId:          string
  approvals:     PRApproval[]
  currentUserId: string
  onApprove:     (approvalId: string, comments?: string) => Promise<void>
  onReject:      (approvalId: string, comments: string) => Promise<void>
}
```

Renders a vertical `Timeline` component. Each approval step is a timeline node. Pending approver (where approver_id = currentUserId and status = 'pending') sees inline action buttons: "Approve" (optional comment) and "Reject" (required comment). Approved/rejected steps show timestamp and comments.

### `PurchaseRequestTable`

```typescript
interface PurchaseRequestTableProps {
  companyId: string
}
```

`DataTable` fetching PRs via `usePurchaseRequests(companyId)`. Columns: PR number, title, requested by, department, priority (badge), status (badge), submitted date, required date, actions (view, edit, cancel).

### `PRAttachmentUploader`

```typescript
interface PRAttachmentUploaderProps {
  prId:     string
  onUploadComplete: (attachment: PRAttachment) => void
}
```

Drag-and-drop file uploader. Uploads to `pr-attachments` bucket, inserts metadata row into `pr_attachments`, returns the attachment record with signed URL.

---

## Forms

### Form 15.1 — Purchase Request Form

| Field | Type | Validation |
|---|---|---|
| Title | text input | Required, min 5 chars, max 200 chars |
| Description | textarea | Optional, max 2000 chars |
| Priority | select | Required; values: low, medium, high, urgent |
| Department | select | Required, populated from departments table |
| Required date | date picker | Required, must be >= today |
| Budget amount | currency input | Optional, min 0 |
| Notes | textarea | Optional, max 1000 chars |

```typescript
const purchaseRequestSchema = z.object({
  title:         z.string().min(5).max(200),
  description:   z.string().max(2000).optional(),
  priority:      z.enum(['low','medium','high','urgent']),
  department_id: z.string().uuid(),
  required_date: z.date().min(new Date()),
  budget_amount: z.number().min(0).optional().nullable(),
  notes:         z.string().max(1000).optional(),
})
```

---

### Form 15.2 — Line Item Row

| Field | Type | Validation |
|---|---|---|
| Item name | text input or autocomplete | Required, min 2 chars, max 200 chars |
| Category | select | Optional |
| Quantity | number input | Required, min 0.001 |
| UOM | select | Required, values: piece, kg, litre, etc. |
| Estimated price | currency input | Optional, min 0 |
| Specifications | textarea | Optional, max 1000 chars |

```typescript
const prItemSchema = z.object({
  product_id:      z.string().uuid().optional().nullable(),
  category_id:     z.string().uuid().optional().nullable(),
  item_name:       z.string().min(2).max(200),
  quantity:        z.number().positive(),
  unit_of_measure: z.string(),
  estimated_price: z.number().min(0).optional().nullable(),
  specifications:  z.string().max(1000).optional(),
})
```

---

### Form 15.3 — Approval Action Form

| Field | Type | Validation |
|---|---|---|
| Action | radio | Required; values: approve, reject |
| Comments | textarea | Optional for approve; required for reject (min 10 chars) |

```typescript
const approvalActionSchema = z.object({
  action:   z.enum(['approve','reject']),
  comments: z.string().max(500).refine(
    (val, ctx) => ctx.action === 'reject' ? val.length >= 10 : true,
    'Rejection reason is required (min 10 characters)'
  ),
})
```

---

## Tables

### Purchase Requests Table

| Column | Sortable | Filterable |
|---|---|---|
| PR Number | Yes | Yes (search) |
| Title | Yes | Yes (search) |
| Requested by | No | Yes (employee select) |
| Department | No | Yes (department select) |
| Priority | Yes | Yes (multi-select) |
| Status | Yes | Yes (multi-select) |
| Submitted date | Yes | Yes (date range) |
| Required date | Yes | Yes (date range) |
| Actions | No | No |

---

### Line Items Table (read-only in detail view)

| Column | Sortable | Filterable |
|---|---|---|
| Item name | No | No |
| Category | No | No |
| Quantity | No | No |
| UOM | No | No |
| Estimated price | No | No |
| Subtotal | No | No |

---

## Permissions

```
Create PR:
  - Employee role: can create PRs for own department
  - Procurement Manager: can create PRs for any department

Submit PR for approval:
  - Requestor can submit own draft PR
  - Procurement Manager can submit any draft PR

Edit PR:
  - Requestor can edit own draft PR only
  - Procurement Manager can edit any draft PR

Cancel PR:
  - Requestor can cancel own PR if status = 'draft' or 'submitted'
  - Procurement Manager can cancel any PR (not 'completed')

Approve / Reject PR:
  - Only users in the pr_approvals.approver_id list for that PR
  - Permission gate: has_permission('procurement_requests', 'approve')

View PRs:
  - All company members can read PRs for their company via RLS
  - Vendors cannot read purchase_requests (company-internal data)

Attachments:
  - Requestor and procurement managers can upload/delete attachments
  - All company members can download attachments
```

---

## Validation Rules

```
PR submission:
  - Must have at least 1 line item
  - Title must be unique within the company in the same fiscal year
  - required_date must be at least 7 days in the future (configurable threshold)
  - If budget_amount is provided and exceeds company approval threshold,
    approval chain must include Finance Manager (enforced in submit Edge Function)

Line items:
  - quantity > 0
  - If product_id is provided, item_name auto-populated from products.name
    (user can override for customization)
  - unit_of_measure must match a predefined list (same as products UOM list)

Approval:
  - Approvers must action steps in sequence (step_order)
  - Step 2 approver cannot approve until step 1 is approved
  - Rejection at any step terminates the workflow and sets PR status = 'rejected'
  - If all approvers approve, PR status becomes 'approved'

Attachments:
  - Max 10 files per PR
  - File size max 10 MB per file
  - Allowed types: PDF, DOCX, XLSX, PNG, JPG (same as vendor documents)
```

---

## Business Rules

```
BR-15.1  PR numbers are auto-generated in the format PR-{YYYY}-{seq} where {seq}
         is a zero-padded 4-digit integer sequence per company per year.
         E.g., PR-2026-0001, PR-2026-0002.

BR-15.2  Draft PRs do not enter the approval workflow. They remain editable
         by the requestor and are not visible in approver queues.

BR-15.3  Submitting a PR locks all fields except for approver comments.
         Requestors cannot edit a submitted PR. To change a submitted PR,
         the requestor must cancel it and create a new one.

BR-15.4  The approval chain is determined dynamically at submission time based on:
         (a) PR budget_amount (thresholds stored in company_settings)
         (b) Department-specific rules (optional; defaults to company-wide rules)
         In v1, a simple sequential workflow: Procurement Manager → Finance Manager
         for PRs above a threshold; Procurement Manager only for PRs below threshold.

BR-15.5  Approval rejection does not delete the PR. status = 'rejected' is final.
         The requestor can view the rejection reason and create a new PR if needed.

BR-15.6  Once a PR is approved, it transitions to the RFQ creation phase (Phase 16).
         The approved PR is immutable at that point — no further edits allowed.

BR-15.7  Line items without a product_id are free-text specifications. The procurement
         team will source vendors manually or via a custom RFQ. product_id is optional
         to allow for non-catalogued items.

BR-15.8  required_date is informational only in Phase 15. It becomes the RFQ delivery
         date requirement in Phase 16.
```

---

## Security

```
- RLS enforces company_id scoping for all PR tables.
  A user from Company A cannot read PRs from Company B.

- Vendors have no read access to purchase_requests tables.
  PR data is internal to the company until it becomes an RFQ (Phase 16).

- Approver list is stored in pr_approvals. The application checks approver_id = auth.uid()
  before rendering approval action buttons. Direct mutations to pr_approvals.status
  are RLS-gated to approver_id = auth.uid().

- Attachments are stored in a private bucket with RLS. Only company members
  from the PR's company can read/write attachments. Signed URLs generated on-demand.

- PR number generation is sequential per company. No cross-company leakage possible.
  generate-pr-number Edge Function verifies company_id from JWT before returning.

- Budget thresholds and approval rules are stored in company_settings (Phase 5)
  and are not user-editable via the procurement UI. Only company admins can modify
  approval thresholds in the settings page.
```

---

## State Management

```typescript
// Purchase requests for company
export function usePurchaseRequests(companyId: string, filters?: PRFilters) {
  const supabase = useSupabase()
  return useQuery({
    queryKey: ['purchase-requests', companyId, filters],
    queryFn: async () => {
      let query = supabase
        .from('purchase_requests')
        .select(`
          *,
          profiles!requested_by(full_name, email),
          departments(name),
          purchase_request_items(count)
        `)
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })

      if (filters?.status?.length) {
        query = query.in('status', filters.status)
      }
      if (filters?.priority?.length) {
        query = query.in('priority', filters.priority)
      }
      // ... additional filters

      const { data, error } = await query
      if (error) throw error
      return data ?? []
    },
    staleTime: 30 * 1000,    // 30 seconds
    gcTime:    5 * 60 * 1000,
  })
}

// Single PR detail
export function usePurchaseRequest(prId: string) {
  const supabase = useSupabase()
  return useQuery({
    queryKey: ['purchase-request', prId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('purchase_requests')
        .select(`
          *,
          profiles!requested_by(full_name, email),
          departments(name),
          purchase_request_items(*),
          pr_approvals(*, profiles!approver_id(full_name, email)),
          pr_attachments(*)
        `)
        .eq('id', prId)
        .single()
      if (error) throw error
      return data
    },
    staleTime: 10 * 1000,    // 10 seconds — active editing context
  })
}
```

After any PR mutation (create, update, submit, approve, reject, cancel), invalidate both `['purchase-requests', companyId]` and `['purchase-request', prId]`.

No Zustand store for PR state — TanStack Query cache is sufficient.

---

## Development Tasks

### Task 15.1 — Migration
Apply migration `0018_create_purchase_requests.sql`. Verify all four tables, indexes, and RLS policies. Regenerate `database.ts` types. Confirm RLS: vendor user cannot read purchase_requests.

### Task 15.2 — PR Number Generation Edge Function
Implement `generate-pr-number` Edge Function. Uses a Postgres sequence per company_id (store sequence counter in `company_settings` or a dedicated `pr_sequences` table). Returns next `PR-{YYYY}-{seq}` string. Test for concurrent requests producing duplicate numbers.

### Task 15.3 — PurchaseRequestForm and ItemsEditor
Implement `PurchaseRequestForm` with all header fields. Implement `PurchaseRequestItemsEditor` as a dynamic table. Wire "Link Product" sheet to search and pre-fill item rows. Test add/remove/reorder rows.

### Task 15.4 — Create PR Page
Implement `/company/procurement/requests/new/page.tsx`. Compose `PurchaseRequestForm` + `PurchaseRequestItemsEditor`. Wire "Save as Draft" (direct insert) and "Submit for Approval" (calls `submit-purchase-request` Edge Function). Redirect to detail page after save.

### Task 15.5 — Submit PR Edge Function
Implement `submit-purchase-request`. Validates items, determines approval chain based on budget thresholds from `company_settings`, inserts `pr_approvals` rows, updates PR status. Test threshold logic and multi-step approval creation.

### Task 15.6 — PR List Page
Implement `/company/procurement/requests/page.tsx`. Render KPI cards, `PurchaseRequestTable` with filters. Default sort: newest first.

### Task 15.7 — PR Detail Page
Implement `/company/procurement/requests/[id]/page.tsx`. Render all five panels: summary, line items, `PRApprovalPanel`, attachments, activity log. Wire "Approve" and "Reject" actions in `PRApprovalPanel`.

### Task 15.8 — Approval Mutations
Implement approve/reject mutations: update `pr_approvals` row; if all steps approved → update `purchase_requests.status = 'approved'`; if any step rejected → status = 'rejected', rejection_reason populated. Test sequential step enforcement.

### Task 15.9 — PR Attachment Uploader
Implement `PRAttachmentUploader` with drag-and-drop, file-type and size validation, two-step upload (storage + DB insert), cleanup on failure. Wire into detail page.

### Task 15.10 — Edit and Cancel
Implement `/company/procurement/requests/[id]/edit/page.tsx` (draft-only guard). Implement cancel mutation with confirmation dialog. Guard: redirect non-draft PRs from edit route.

---

## Testing Checklist

```
✓ Migration 0018: all four tables and RLS policies created
✓ RLS: vendor user cannot read purchase_requests (returns empty)
✓ RLS: company user can only read PRs for own company
✓ PR number: sequential, year-scoped, unique per company
✓ Create draft PR: header fields and line items saved correctly
✓ Submit PR: status changes to 'submitted'; pr_approvals rows inserted
✓ Submit PR: blocked when no line items exist
✓ Submit PR: required_date in the past blocked with error
✓ Approval chain: step 1 approver actioned first; step 2 blocked until step 1 done
✓ Approve: all steps approved → PR status = 'approved'
✓ Reject: any step rejected → PR status = 'rejected', rejection_reason populated
✓ Cancel: requestor can cancel draft or submitted PR
✓ Cancel: completed or rfq_created PR cannot be cancelled by requestor
✓ Edit: available only for status = 'draft'; navigating to edit on submitted PR redirects
✓ Attachment upload: file stored in private bucket; metadata in pr_attachments
✓ Attachment download: signed URL generated; expires correctly
✓ Attachment size validation: file > 10 MB rejected at client before upload
✓ KPI cards: counts accurate after status transitions
✓ pnpm build: no TypeScript errors; pnpm lint: zero warnings
```

---

## Acceptance Criteria

```
AC-15.1  Migration 0018 applied; purchase_requests, purchase_request_items,
         pr_approvals, pr_attachments tables active with RLS
AC-15.2  PR numbers generated in format PR-{YYYY}-{seq}, sequential per company per year
AC-15.3  Employee can create, save as draft, and edit draft PR with line items
AC-15.4  Submitting a PR creates the approval chain and locks the PR from further edits
AC-15.5  Approvers can approve or reject from the PR detail page, in sequence
AC-15.6  All-approved PR transitions to 'approved'; any rejection transitions to 'rejected'
AC-15.7  Requestor can cancel own draft or submitted PR
AC-15.8  Attachments upload to private bucket; downloadable via signed URL
AC-15.9  RLS verified: vendor user returns empty on purchase_requests
AC-15.10 KPI cards and DataTable accurately reflect current status counts
```

---

## Definition of Done

Phase 15 is complete when all Acceptance Criteria above are met AND:

- [ ] All TypeScript checks pass (zero errors)
- [ ] All ESLint checks pass (zero warnings)
- [ ] Migration 0018 applied and committed; `database.ts` regenerated
- [ ] `generate-pr-number` Edge Function deployed and tested for concurrent safety
- [ ] `submit-purchase-request` Edge Function deployed; approval chain logic verified
- [ ] Edit route guards tested (non-draft PR redirected)
- [ ] Attachment upload and signed-URL download tested end-to-end
- [ ] RLS: vendor user read attempt returns empty; confirmed in test
- [ ] PR merged to `develop` with at least 1 reviewer approval
- [ ] `feature/15-procurement-requests` branch merged and deleted

---

## Risk Factors

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Duplicate PR numbers from concurrent submissions | Low | Medium | Use DB sequence with FOR UPDATE lock in generate-pr-number function |
| Approval chain rules become complex across departments | Medium | Medium | Keep v1 simple: one or two sequential approvers based on budget threshold; configurability deferred to Phase 31 |
| PR items reference deleted products | Low | Low | product_id FK uses ON DELETE SET NULL; item_name stored as text so the item remains legible even if the product is removed |
| Large file upload failure leaving orphaned storage objects | Medium | Low | Implement storage.remove() in the catch block of the upload handler |
| Users bypassing the edit guard by direct URL navigation | Low | Medium | Server Component checks PR status and redirects on the server side before rendering edit form |

---

## Best Practices

- Store approval thresholds in `company_settings`, not hardcoded in the Edge Function — this allows companies to reconfigure without a deploy
- Always generate PR numbers server-side with a DB sequence — never generate them client-side
- Keep `pr_approvals` as a separate table (not a JSONB column on `purchase_requests`) so each approval step can be queried and RLS-gated independently
- Use `ON DELETE SET NULL` for `product_id` on `purchase_request_items` — historical PRs remain readable even when the vendor removes a product
- Validate minimum line item count both client-side (immediate feedback) and server-side (in the Edge Function) to prevent empty PRs from bypassing the UI

---

## Estimated Completion

**4–5 working days.** The form with dynamic line items editor and the approval workflow Edge Function are the most complex pieces. The approval step sequencing logic and the PR number generation must be production-robust before Phase 16 depends on them.

---

---

# PHASE 16 — VENDOR QUOTATIONS

---

## Overview

| Field | Value |
|---|---|
| Phase Number | 16 |
| Phase Name | Vendor Quotations |
| Milestone | M4 — Procurement Lifecycle |
| PRD Reference | Module 14 — RFQ, Module 15 — Quotation Management |
| DESIGN Reference | Section 3 (Company — Procurement — RFQ, Vendor — Quotations), F01, F03 |
| Estimated Duration | 5–6 days |
| Prerequisite Phases | Phase 15 (Procurement Requests), Phase 9 (Vendor Marketplace — vendor selection), Phase 12 (Product Catalog) |

---

## Purpose

Phase 16 implements the Request for Quotation (RFQ) workflow: the company creates an RFQ from an approved Purchase Request, selects target vendors, and sends the RFQ. Vendors receive it in their workspace, review the line items, and submit a structured quotation with pricing, delivery terms, and validity period. This phase covers both the company-side RFQ creation flow and the vendor-side quotation submission flow — the two key interactions before a purchase decision is made.

---

## Business Goal

Competitive sourcing — obtaining multiple quotations before committing to a vendor — is the cornerstone of professional procurement. Without structured RFQ tooling, buyers rely on email chains that are hard to compare, easy to lose, and impossible to audit. Phase 16 makes the sourcing process digital, traceable, and comparable. Every quotation is time-stamped, versioned, and attached to the originating RFQ so the comparison step (Phase 17) has clean, structured data to work with.

---

## Dependencies

- Phase 15 complete (`purchase_requests`, `purchase_request_items` tables)
- Phase 8 complete (`vendors` table, vendor workspace)
- Phase 12 complete (`products` table)
- Phase 14 complete (`inventory`, `product_availability` view — stock shown in RFQ)
- Phase 2 `DataTable`, `PageHeader`, `KPICard`, `StatusBadge`, `Sheet`, `Timeline` components

---

## Database Tables

Migration: `0019_create_rfqs.sql`

```sql
-- ============================================================
-- Migration: 0019_create_rfqs
-- Description: RFQ and vendor quotation workflow
-- ============================================================

create table public.rfqs (
  id              uuid primary key default gen_random_uuid(),
  company_id      uuid not null references public.companies(id) on delete cascade,
  pr_id           uuid references public.purchase_requests(id) on delete set null,
  rfq_number      text not null,          -- RFQ-{YYYY}-{seq}
  title           text not null,
  description     text,
  status          text not null default 'draft'
                    check (status in (
                      'draft',      -- not yet sent to vendors
                      'sent',       -- sent; awaiting vendor responses
                      'closed',     -- deadline passed; no more submissions
                      'awarded',    -- vendor selected (Phase 17)
                      'cancelled'
                    )),
  deadline        timestamptz not null,   -- vendor submission deadline
  delivery_date   date,                   -- requested delivery date
  delivery_address text,
  terms_conditions text,
  currency        text not null default 'INR',
  created_by      uuid not null references public.profiles(id),
  awarded_at      timestamptz,
  cancelled_at    timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create unique index idx_rfq_number_company on public.rfqs(company_id, rfq_number);
create index idx_rfq_company_id   on public.rfqs(company_id);
create index idx_rfq_pr_id        on public.rfqs(pr_id);
create index idx_rfq_status       on public.rfqs(status);
create index idx_rfq_deadline     on public.rfqs(deadline);

create trigger trg_rfq_updated_at
  before update on public.rfqs
  for each row execute function public.handle_updated_at();

-- RFQ line items
create table public.rfq_items (
  id              uuid primary key default gen_random_uuid(),
  rfq_id          uuid not null references public.rfqs(id) on delete cascade,
  pr_item_id      uuid references public.purchase_request_items(id) on delete set null,
  product_id      uuid references public.products(id) on delete set null,
  item_name       text not null,
  description     text,
  quantity        numeric(12,3) not null check (quantity > 0),
  unit_of_measure text not null default 'piece',
  specifications  text,
  sort_order      integer not null default 0,
  created_at      timestamptz not null default now()
);

create index idx_rfq_items_rfq_id     on public.rfq_items(rfq_id);
create index idx_rfq_items_product_id on public.rfq_items(product_id);

-- Vendors invited to an RFQ
create table public.rfq_vendors (
  id          uuid primary key default gen_random_uuid(),
  rfq_id      uuid not null references public.rfqs(id) on delete cascade,
  vendor_id   uuid not null references public.vendors(id),
  status      text not null default 'invited'
                check (status in (
                  'invited',    -- invitation sent; awaiting action
                  'viewed',     -- vendor has opened the RFQ
                  'submitted',  -- vendor submitted a quotation
                  'declined',   -- vendor declined to quote
                  'awarded',    -- this vendor was selected (Phase 17)
                  'rejected'    -- not selected after comparison (Phase 17)
                )),
  invited_at  timestamptz not null default now(),
  viewed_at   timestamptz,
  responded_at timestamptz,
  constraint rfq_vendor_unique unique (rfq_id, vendor_id)
);

create index idx_rfq_vendors_rfq_id    on public.rfq_vendors(rfq_id);
create index idx_rfq_vendors_vendor_id on public.rfq_vendors(vendor_id);

-- Vendor quotation in response to an RFQ
create table public.quotations (
  id              uuid primary key default gen_random_uuid(),
  rfq_id          uuid not null references public.rfqs(id) on delete cascade,
  vendor_id       uuid not null references public.vendors(id),
  rfq_vendor_id   uuid not null references public.rfq_vendors(id),
  quotation_number text not null,         -- QT-{YYYY}-{seq}
  status          text not null default 'draft'
                    check (status in (
                      'draft',      -- vendor building it; not submitted yet
                      'submitted',  -- submitted to company
                      'revised',    -- vendor has submitted a revised version
                      'accepted',   -- company selected this quotation (Phase 17)
                      'rejected',   -- company chose another vendor
                      'expired'     -- valid_until passed without decision
                    )),
  subtotal        numeric(15,2) not null default 0,
  tax_amount      numeric(15,2) not null default 0,
  delivery_charge numeric(15,2) not null default 0,
  discount_amount numeric(15,2) not null default 0,
  total_amount    numeric(15,2) not null default 0,
  currency        text not null default 'INR',
  payment_terms   text,                   -- e.g. "Net 30", "50% advance"
  delivery_days   integer,                -- delivery lead time in calendar days
  valid_until     date not null,
  notes           text,
  terms_conditions text,
  submitted_at    timestamptz,
  revision_number integer not null default 1,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint quotation_unique_rfq_vendor unique (rfq_id, vendor_id, revision_number)
);

create index idx_quotations_rfq_id    on public.quotations(rfq_id);
create index idx_quotations_vendor_id on public.quotations(vendor_id);
create index idx_quotations_status    on public.quotations(status);

create trigger trg_quotations_updated_at
  before update on public.quotations
  for each row execute function public.handle_updated_at();

-- Quotation line items
create table public.quotation_items (
  id              uuid primary key default gen_random_uuid(),
  quotation_id    uuid not null references public.quotations(id) on delete cascade,
  rfq_item_id     uuid not null references public.rfq_items(id),
  item_name       text not null,
  quantity        numeric(12,3) not null check (quantity > 0),
  unit_of_measure text not null,
  unit_price      numeric(12,2) not null check (unit_price >= 0),
  tax_rate        numeric(5,2) not null default 0,      -- percentage
  tax_amount      numeric(12,2) not null default 0,
  discount_rate   numeric(5,2) not null default 0,
  discount_amount numeric(12,2) not null default 0,
  line_total      numeric(15,2) not null default 0,
  delivery_days   integer,
  notes           text,
  sort_order      integer not null default 0,
  created_at      timestamptz not null default now()
);

create index idx_quotation_items_quotation_id on public.quotation_items(quotation_id);
create index idx_quotation_items_rfq_item_id  on public.quotation_items(rfq_item_id);

-- RLS
alter table public.rfqs             enable row level security;
alter table public.rfq_items        enable row level security;
alter table public.rfq_vendors      enable row level security;
alter table public.quotations       enable row level security;
alter table public.quotation_items  enable row level security;

-- Company reads all RFQs for their company
create policy "rfq_company_read"
  on public.rfqs for select
  using (company_id = public.get_my_company_id());

create policy "rfq_company_write"
  on public.rfqs for all
  using (
    company_id = public.get_my_company_id()
    and public.has_permission('rfqs', 'edit')
  );

-- Vendor reads RFQs they are invited to
create policy "rfq_vendor_read"
  on public.rfqs for select
  using (
    exists (
      select 1 from public.rfq_vendors rv
      where rv.rfq_id = rfqs.id
        and rv.vendor_id = public.get_my_vendor_id()
    )
  );

-- RFQ items: follow RFQ access
create policy "rfq_items_company_read"
  on public.rfq_items for select
  using (
    exists (
      select 1 from public.rfqs r
      where r.id = rfq_items.rfq_id
        and r.company_id = public.get_my_company_id()
    )
  );

create policy "rfq_items_vendor_read"
  on public.rfq_items for select
  using (
    exists (
      select 1 from public.rfqs r
      join public.rfq_vendors rv on rv.rfq_id = r.id
      where r.id = rfq_items.rfq_id
        and rv.vendor_id = public.get_my_vendor_id()
    )
  );

create policy "rfq_items_company_write"
  on public.rfq_items for all
  using (
    exists (
      select 1 from public.rfqs r
      where r.id = rfq_items.rfq_id
        and r.company_id = public.get_my_company_id()
    )
  );

-- rfq_vendors: company manages; vendor reads own
create policy "rfq_vendors_company_rw"
  on public.rfq_vendors for all
  using (
    exists (
      select 1 from public.rfqs r
      where r.id = rfq_vendors.rfq_id
        and r.company_id = public.get_my_company_id()
    )
  );

create policy "rfq_vendors_vendor_read"
  on public.rfq_vendors for select
  using (vendor_id = public.get_my_vendor_id());

create policy "rfq_vendors_vendor_update"
  on public.rfq_vendors for update
  using (vendor_id = public.get_my_vendor_id())
  with check (vendor_id = public.get_my_vendor_id());

-- Quotations: vendor writes own; company reads all for their RFQs
create policy "quotations_vendor_rw"
  on public.quotations for all
  using (vendor_id = public.get_my_vendor_id());

create policy "quotations_company_read"
  on public.quotations for select
  using (
    exists (
      select 1 from public.rfqs r
      where r.id = quotations.rfq_id
        and r.company_id = public.get_my_company_id()
    )
  );

-- Company cannot see vendor draft quotations
create policy "quotations_company_no_draft"
  on public.quotations for select
  using (
    exists (
      select 1 from public.rfqs r
      where r.id = quotations.rfq_id
        and r.company_id = public.get_my_company_id()
    )
    and status != 'draft'
  );

create policy "quotation_items_vendor_rw"
  on public.quotation_items for all
  using (
    exists (
      select 1 from public.quotations q
      where q.id = quotation_items.quotation_id
        and q.vendor_id = public.get_my_vendor_id()
    )
  );

create policy "quotation_items_company_read"
  on public.quotation_items for select
  using (
    exists (
      select 1 from public.quotations q
      join public.rfqs r on r.id = q.rfq_id
      where q.id = quotation_items.quotation_id
        and r.company_id = public.get_my_company_id()
        and q.status != 'draft'
    )
  );
```

---

## Relationships

```
public.purchase_requests (1)
  └── public.rfqs (N)                      — one PR can generate multiple RFQs
        ├── public.rfq_items (N)           — copied/derived from PR items
        ├── public.rfq_vendors (N)         — vendors invited to this RFQ
        └── public.quotations (N)          — one per vendor per RFQ (versioned)
              └── public.quotation_items (N) — one per rfq_item

public.rfqs
  └── referenced by public.purchase_orders (Phase 18)  — PO raised from quotation
```

---

## API Endpoints

| Operation | Method | Implementation | Notes |
|---|---|---|---|
| List RFQs (company) | Server Component | `supabase.from('rfqs').select('*, rfq_vendors(count), quotations(count)')` | Company-scoped via RLS |
| List RFQs (vendor) | Server Component | `supabase.from('rfqs').select('*, rfq_vendors(*)')` | Vendor sees only invited RFQs |
| Get single RFQ | Server Component | `supabase.from('rfqs').select('*, rfq_items(*), rfq_vendors(*, vendors(*)), quotations(*)')` | Full detail |
| Create RFQ (draft) | Client mutation | `supabase.from('rfqs').insert()` | status = 'draft' |
| Add items to RFQ | Client mutation | `supabase.from('rfq_items').insert()` | Copy from PR items or free-text |
| Invite vendor to RFQ | Client mutation | `supabase.from('rfq_vendors').insert()` | status = 'invited' |
| Send RFQ to vendors | Edge Function | `send-rfq` | status → 'sent'; notifies invited vendors |
| Vendor views RFQ | Client mutation | `supabase.from('rfq_vendors').update({ status: 'viewed', viewed_at: now() })` | On RFQ detail page open |
| Vendor declines RFQ | Client mutation | `supabase.from('rfq_vendors').update({ status: 'declined' })` | |
| Create quotation draft | Client mutation | `supabase.from('quotations').insert()` | status = 'draft' |
| Update quotation | Client mutation | `supabase.from('quotations').update()` + `supabase.from('quotation_items').upsert()` | |
| Submit quotation | Edge Function | `submit-quotation` | Validates totals; status → 'submitted'; updates rfq_vendors.status |
| Revise quotation | Edge Function | `revise-quotation` | Inserts new revision (revision_number + 1); previous → 'revised' |
| Close RFQ | Client mutation | `supabase.from('rfqs').update({ status: 'closed' })` | Procurement manager only |
| Cancel RFQ | Client mutation | `supabase.from('rfqs').update({ status: 'cancelled' })` | Company side only |

---

## Supabase Services Used

```
Supabase Database:
  - public.rfqs               — RFQ records
  - public.rfq_items          — line items per RFQ
  - public.rfq_vendors        — vendor invitations and response status
  - public.quotations         — vendor quotations (versioned)
  - public.quotation_items    — per-item pricing within a quotation

Supabase Storage:
  - Not used in Phase 16 for core RFQ data
  - (Phase 28 will add RFQ attachment support)

Supabase Edge Functions:
  - send-rfq              — sets status = 'sent'; sends RFQ notification to vendors
  - submit-quotation      — validates totals, sets status; updates rfq_vendors
  - revise-quotation      — creates new revision row; archives previous revision
```

---

## Folder Structure

```
src/
├── app/
│   ├── (company)/
│   │   └── procurement/
│   │       └── rfqs/
│   │           ├── page.tsx                    [RFQ list page]
│   │           ├── new/
│   │           │   └── page.tsx                [Create RFQ page]
│   │           └── [id]/
│   │               └── page.tsx                [RFQ detail page — company view]
│   └── (vendor)/
│       └── rfqs/
│           ├── page.tsx                        [Vendor: received RFQs list]
│           └── [id]/
│               ├── page.tsx                    [Vendor: RFQ detail + quotation form]
│               └── quotation/
│                   └── page.tsx                [Vendor: quotation editor]
└── components/
    └── modules/
        └── rfq/
            ├── rfq-form.tsx
            ├── rfq-items-editor.tsx
            ├── rfq-vendor-selector.tsx
            ├── rfq-status-badge.tsx
            ├── rfq-detail.tsx
            ├── rfq-table.tsx
            ├── quotation-form.tsx
            ├── quotation-items-editor.tsx
            ├── quotation-summary-card.tsx
            ├── quotation-status-badge.tsx
            └── index.ts
```

---

## UI Screens

### Screen 16.1 — RFQ List — Company (`/company/procurement/rfqs`)

`PageHeader`: title "Requests for Quotation", action "New RFQ".

**KPI row** (4 cards):
| KPI Card | Value |
|---|---|
| Total RFQs | All non-cancelled |
| Active (Sent) | status = 'sent' |
| Awaiting Response | Sent + 0 quotations received |
| Awarded | status = 'awarded' |

`DataTable` (RFQTable). Columns: RFQ number, title, linked PR, vendors invited, quotations received, deadline, status (badge), actions.

---

### Screen 16.2 — Create RFQ (`/company/procurement/rfqs/new`)

`PageHeader`: title "New RFQ", breadcrumb Procurement → RFQs → New.

Two-section layout:
- **Section 1 — RFQ Header**: title, description, linked PR (optional dropdown of approved PRs), deadline (datetime picker), delivery date, delivery address, currency, terms & conditions.
- **Section 2 — Line Items**: `RFQItemsEditor` — pre-populated when a PR is linked; editable table same pattern as Phase 15.
- **Section 3 — Invite Vendors**: `RFQVendorSelector` — search verified vendors; select multiple. Shows availability status from `product_availability` for vendors that carry the RFQ's items.

"Save as Draft" and "Send to Vendors" footer actions.

---

### Screen 16.3 — RFQ Detail — Company (`/company/procurement/rfqs/[id]`)

`PageHeader`: title "[RFQ Number] — [Title]", status badge.

Four panels:
1. **RFQ Summary**: linked PR link, deadline (with countdown), delivery date, delivery address.
2. **Line Items**: read-only table of rfq_items.
3. **Vendor Responses**: `DataTable` of rfq_vendors with columns: vendor name, status (invited/viewed/submitted/declined), submitted at, quotation total. "View Quotation" button navigates to Phase 17 comparison.
4. **Actions bar**: "Close RFQ", "Cancel RFQ", "Create PO" (enabled only when status = 'awarded').

---

### Screen 16.4 — Received RFQs — Vendor (`/vendor/rfqs`)

`PageHeader`: title "Received RFQs".

`DataTable` showing RFQs invited to. Columns: RFQ number, company name, title, deadline (with countdown), items count, status (badge), actions (view, decline).

---

### Screen 16.5 — RFQ Detail + Quotation — Vendor (`/vendor/rfqs/[id]`)

`PageHeader`: title "[RFQ Number]", company name subheading.

Two-section layout:
1. **RFQ Information panel**: title, description, deadline, delivery date, delivery address, terms & conditions.
2. **RFQ Items table**: item name, description, quantity, UOM, specifications.

If vendor has no quotation yet: "Create Quotation" button + "Decline" button.
If vendor has a submitted quotation: read-only `QuotationSummaryCard` + "Revise Quotation" button.
If vendor has a draft quotation: "Continue editing" link to the quotation editor.

---

### Screen 16.6 — Quotation Editor — Vendor (`/vendor/rfqs/[id]/quotation`)

`PageHeader`: title "Submit Quotation for [RFQ Number]", breadcrumb RFQs → [RFQ] → Quotation.

Two-column layout:
- Left: `QuotationItemsEditor` — one row per rfq_item; vendor fills unit price, tax rate, discount, delivery days per item.
- Right: `QuotationSummaryCard` — live-computed subtotal, tax, discount, delivery charge, grand total. Payment terms (text input). Delivery days (number input, overall). Valid until (date picker). Notes. Terms & conditions.

"Save Draft" and "Submit Quotation" actions.

---

## Components

### `RFQForm`

```typescript
interface RFQFormProps {
  defaultValues?: Partial<RFQFormData>
  prOptions:      PurchaseRequest[]       // approved PRs available for linking
  onSubmit:       (data: RFQFormData, action: 'draft' | 'send') => Promise<void>
  isLoading?:     boolean
}
```

Header fields: title, description, linked PR (optional), deadline, delivery date, delivery address, currency, terms_conditions. When a PR is selected, `RFQItemsEditor` is pre-populated with the PR's items.

### `RFQItemsEditor`

Same structural pattern as `PurchaseRequestItemsEditor` from Phase 15. Accepts `items: RFQItem[]`, `onChange`. Each row: item name, description, quantity, UOM, specifications. "Link Product" button. Editable when status = 'draft'.

### `RFQVendorSelector`

```typescript
interface RFQVendorSelectorProps {
  selectedVendors:  string[]
  onChange:         (vendorIds: string[]) => void
  rfqItems?:        RFQItem[]    // used to show stock availability per vendor
}
```

Searchable multi-select of verified vendors. Shows vendor name, category badges, and availability badge (from `product_availability`) for relevant items. "Add Selected" commits vendors to the RFQ. Minimum 1 vendor required before sending.

### `RFQStatusBadge`

Status colour map:
- `draft` → grey
- `sent` → blue
- `closed` → amber
- `awarded` → green
- `cancelled` → red

### `QuotationForm`

```typescript
interface QuotationFormProps {
  rfq:            RFQ
  rfqItems:       RFQItem[]
  defaultValues?: Partial<QuotationFormData>
  onSubmit:       (data: QuotationFormData, action: 'draft' | 'submit') => Promise<void>
  isLoading?:     boolean
}
```

Renders `QuotationItemsEditor` for line-item pricing, plus header fields: payment_terms, delivery_days, valid_until, notes, terms_conditions. Totals are computed client-side in real time.

### `QuotationItemsEditor`

```typescript
interface QuotationItemsEditorProps {
  rfqItems:    RFQItem[]
  items:       QuotationItem[]
  onChange:    (items: QuotationItem[]) => void
  readOnly?:   boolean
}
```

One row per rfq_item. Columns: item name (read-only, from rfq_items), quantity (read-only), unit price (input), tax rate % (input), discount rate % (input), delivery days (input), notes (input). Line total computed: `quantity * unit_price * (1 + tax_rate/100) * (1 - discount_rate/100)`.

### `QuotationSummaryCard`

```typescript
interface QuotationSummaryCardProps {
  quotation:      Quotation
  quotationItems: QuotationItem[]
  showVendorName?: boolean     // true in comparison view (Phase 17)
}
```

Displays: subtotal, tax total, discount total, delivery charge, **grand total** (bold, large). Payment terms, delivery days, valid until. In comparison view (Phase 17), adds vendor name header and rank badge.

### `QuotationStatusBadge`

Status colour map:
- `draft` → grey
- `submitted` → blue
- `revised` → amber
- `accepted` → green
- `rejected` → red
- `expired` → grey (dark)

---

## Forms

### Form 16.1 — RFQ Form

| Field | Type | Validation |
|---|---|---|
| Title | text input | Required, min 5 chars, max 200 chars |
| Description | textarea | Optional, max 2000 chars |
| Linked PR | select | Optional; filtered to approved PRs for company |
| Deadline | datetime picker | Required, must be >= now + 24 hours |
| Delivery date | date picker | Optional, must be >= deadline date |
| Delivery address | textarea | Optional, max 500 chars |
| Currency | select | Required, default INR |
| Terms & conditions | textarea | Optional, max 5000 chars |

```typescript
const rfqSchema = z.object({
  title:             z.string().min(5).max(200),
  description:       z.string().max(2000).optional(),
  pr_id:             z.string().uuid().optional().nullable(),
  deadline:          z.date().min(new Date(Date.now() + 24 * 60 * 60 * 1000)),
  delivery_date:     z.date().optional().nullable(),
  delivery_address:  z.string().max(500).optional(),
  currency:          z.string().default('INR'),
  terms_conditions:  z.string().max(5000).optional(),
})
```

---

### Form 16.2 — Quotation Form

| Field | Type | Validation |
|---|---|---|
| Payment terms | text input | Optional, max 200 chars |
| Delivery days | integer input | Required, min 1 |
| Valid until | date picker | Required, must be >= today + 3 days |
| Notes | textarea | Optional, max 1000 chars |
| Terms & conditions | textarea | Optional, max 3000 chars |
| Delivery charge | currency input | Optional, min 0 |

Per item row:

| Field | Type | Validation |
|---|---|---|
| Unit price | currency input | Required, min 0 |
| Tax rate | percentage input | Required, 0–100 |
| Discount rate | percentage input | Required, 0–100 |
| Delivery days | integer | Optional, min 1 |

```typescript
const quotationItemSchema = z.object({
  rfq_item_id:    z.string().uuid(),
  unit_price:     z.number().min(0),
  tax_rate:       z.number().min(0).max(100).default(0),
  discount_rate:  z.number().min(0).max(100).default(0),
  delivery_days:  z.number().int().min(1).optional().nullable(),
  notes:          z.string().max(500).optional(),
})
const quotationSchema = z.object({
  payment_terms:   z.string().max(200).optional(),
  delivery_days:   z.number().int().min(1),
  valid_until:     z.date().min(new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)),
  delivery_charge: z.number().min(0).default(0),
  notes:           z.string().max(1000).optional(),
  items:           z.array(quotationItemSchema).min(1),
})
```

---

## Tables

### RFQ Table (Company)

| Column | Sortable | Filterable |
|---|---|---|
| RFQ Number | Yes | Yes (search) |
| Title | Yes | Yes (search) |
| Linked PR | No | Yes |
| Vendors | No | No |
| Quotations | Yes | No |
| Deadline | Yes | Yes (date range) |
| Status | Yes | Yes (multi-select) |
| Actions | No | No |

---

### Vendor RFQ Table (Vendor)

| Column | Sortable | Filterable |
|---|---|---|
| RFQ Number | No | No |
| Company | No | Yes (search) |
| Title | Yes | Yes (search) |
| Items | No | No |
| Deadline | Yes | No |
| Status | Yes | Yes |
| Actions | No | No |

---

### Vendor Responses Table (Company — inside RFQ detail)

| Column | Sortable | Filterable |
|---|---|---|
| Vendor name | No | No |
| Status | No | No |
| Submitted at | Yes | No |
| Quotation total | Yes | No |
| Actions | No | No |

---

## Permissions

```
Create / edit / send RFQ:
  - Permission: has_permission('rfqs', 'edit')
  - Roles: Procurement Manager, Procurement Officer
  - Employees (basic) cannot create RFQs

View RFQ (company):
  - All company members can view RFQs for their company

Close / cancel RFQ:
  - Permission: has_permission('rfqs', 'manage')
  - Roles: Procurement Manager only

Invite vendors to RFQ:
  - Same as Create/edit RFQ

Company reads quotations:
  - Only submitted/revised/accepted/rejected quotations visible to company
  - Draft quotations are RLS-blocked (policy: status != 'draft')

Vendor actions (view, create quotation, submit, revise, decline):
  - Vendor can only act on RFQs where rfq_vendors.vendor_id = their vendor_id
  - Vendor cannot see rfq_vendors rows for other vendors on the same RFQ

Vendor cannot see other vendors' quotations:
  - quotations RLS: vendor reads own only (vendor_id = get_my_vendor_id())
  - Company reads all submitted quotations for their RFQs
```

---

## Validation Rules

```
RFQ:
  - At least 1 line item before sending
  - At least 1 vendor invited before sending
  - Deadline >= now + 24 hours
  - Cannot send RFQ if status != 'draft'
  - Cannot add/remove vendors or items once status = 'sent'

Quotation:
  - All rfq_items must have a corresponding quotation_item row
    (vendor cannot omit items; they must quote 0 if unable to supply)
  - unit_price >= 0 per item (0 is valid — e.g. free service component)
  - valid_until >= today + 3 days
  - delivery_days >= 1
  - Computed totals validated server-side:
      line_total = quantity * unit_price * (1 + tax_rate/100) - discount_amount
      subtotal   = sum(line_totals)
      total_amount = subtotal + tax_amount - discount_amount + delivery_charge
  - revision_number increments by 1; vendor cannot set it manually

RFQ deadline enforcement:
  - A Supabase cron job (pg_cron) runs hourly and sets status = 'closed' for
    RFQs where deadline <= now() and status = 'sent'.
  - Vendors cannot submit quotations after deadline (enforced in submit-quotation
    Edge Function: check rfqs.deadline > now() and rfqs.status = 'sent').
```

---

## Business Rules

```
BR-16.1  An RFQ can be created independently of a PR (ad-hoc sourcing) or
         linked to an approved PR. When linked, rfq_items are pre-populated
         from purchase_request_items but remain independently editable.

BR-16.2  Vendors are notified when an RFQ is sent (Phase 28 notification system).
         The notification includes a deep link to /vendor/rfqs/[id].

BR-16.3  Vendors can revise a submitted quotation once before the deadline.
         A revised quotation creates a new row with revision_number + 1 and
         sets the previous quotation to status = 'revised'. The company
         comparison view always shows the latest revision.

BR-16.4  A vendor can decline to quote. Status set to 'declined'; a reason is
         optional. Once declined, the vendor cannot resubmit unless the
         company re-invites them (not supported in v1 — decline is final).

BR-16.5  Company cannot see vendor draft quotations. RLS enforces this.
         Only submitted/revised quotations are visible to the company.

BR-16.6  The company can close an RFQ manually before the deadline, or it
         closes automatically when the deadline passes (cron job). Closing
         does not delete quotations — it signals that no new quotations
         are accepted and comparison can begin.

BR-16.7  An awarded RFQ transitions to status = 'awarded' in Phase 17 when
         the company selects a winning quotation. This status is set there,
         not in Phase 16.
```

---

## Security

```
- RLS enforces complete separation of company and vendor views.
  A vendor can only see RFQs they were explicitly invited to (rfq_vendors row).

- Vendor draft quotations are invisible to the company.
  The RLS policy for company quotation reads filters status != 'draft'.
  This prevents the company from seeing a vendor's incomplete pricing.

- A vendor cannot see other vendors' quotation_items for the same RFQ.
  quotations RLS: vendor reads only where vendor_id = get_my_vendor_id().

- RFQ items (specifications, quantities) are revealed to vendors only
  via the rfq_vendors join — a vendor not in rfq_vendors cannot read
  rfq_items for that RFQ.

- Total amount validation in submit-quotation Edge Function prevents
  a vendor from manually sending a manipulated total_amount that does
  not match the line item sum. Server-side recomputation is authoritative.

- The quotation revision flow prevents silent price changes.
  Old revision is preserved with status = 'revised'; the comparison
  view always uses the latest revision_number for each vendor.
```

---

## State Management

```typescript
// Company: RFQ list
export function useCompanyRFQs(companyId: string) {
  const supabase = useSupabase()
  return useQuery({
    queryKey: ['rfqs', 'company', companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rfqs')
        .select('*, rfq_vendors(count), quotations(count)')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data ?? []
    },
    staleTime: 30 * 1000,
  })
}

// Vendor: received RFQ list
export function useVendorRFQs(vendorId: string) {
  const supabase = useSupabase()
  return useQuery({
    queryKey: ['rfqs', 'vendor', vendorId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rfqs')
        .select('*, rfq_vendors!inner(*), companies(name, logo_url)')
        .eq('rfq_vendors.vendor_id', vendorId)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data ?? []
    },
    staleTime: 30 * 1000,
  })
}

// Single RFQ detail
export function useRFQ(rfqId: string) {
  const supabase = useSupabase()
  return useQuery({
    queryKey: ['rfq', rfqId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rfqs')
        .select(`
          *,
          rfq_items(*),
          rfq_vendors(*, vendors(name, logo_url)),
          quotations(*, quotation_items(*))
        `)
        .eq('id', rfqId)
        .single()
      if (error) throw error
      return data
    },
    staleTime: 15 * 1000,
  })
}
```

After any mutation (send RFQ, submit quotation, revise, decline), invalidate `['rfqs', 'company', companyId]`, `['rfqs', 'vendor', vendorId]`, and `['rfq', rfqId]` as applicable.

---

## Development Tasks

### Task 16.1 — Migration
Apply migration `0019_create_rfqs.sql`. Verify all five tables, indexes, and RLS policies. Regenerate `database.ts` types. Confirm vendor cannot see other vendors' quotations via RLS test.

### Task 16.2 — RFQ Number Generation
Implement `generate-rfq-number` Edge Function (same pattern as PR number). Format: `RFQ-{YYYY}-{seq}`.

### Task 16.3 — RFQ Form and Items Editor
Implement `RFQForm` with linked PR selection that auto-populates `RFQItemsEditor`. Test PR item copy into RFQ items.

### Task 16.4 — RFQ Vendor Selector
Implement `RFQVendorSelector` with search, multi-select, and stock availability indicators from `product_availability`.

### Task 16.5 — Create RFQ Page and Send RFQ Edge Function
Implement create page. Implement `send-rfq` Edge Function: validates items and vendors; sets status = 'sent'; inserts `rfq_vendors` rows; triggers vendor notifications (stub for Phase 28).

### Task 16.6 — RFQ List and Detail Pages (Company)
Implement company RFQ list page with KPI cards and `RFQTable`. Implement company RFQ detail page with all four panels.

### Task 16.7 — Vendor RFQ List and Detail Pages
Implement vendor-side `/vendor/rfqs` list. Implement `/vendor/rfqs/[id]` detail with RFQ info and quotation CTA. Wire `rfq_vendors` viewed_at update on page load.

### Task 16.8 — Quotation Editor
Implement `/vendor/rfqs/[id]/quotation` page. Implement `QuotationItemsEditor` with per-item pricing. Implement live total computation in `QuotationSummaryCard`. Wire "Save Draft" and "Submit Quotation" actions.

### Task 16.9 — Submit Quotation Edge Function
Implement `submit-quotation`: verifies deadline not passed, recomputes all totals server-side, sets quotation status = 'submitted', updates `rfq_vendors.status = 'submitted'` and `responded_at`. Returns computed totals.

### Task 16.10 — Revise Quotation Edge Function
Implement `revise-quotation`: verifies deadline not passed and previous quotation status = 'submitted'; inserts new quotation row with `revision_number + 1`; updates previous to status = 'revised'.

### Task 16.11 — RFQ Deadline Cron Job
Configure `pg_cron` job to run hourly: `UPDATE rfqs SET status = 'closed' WHERE deadline <= now() AND status = 'sent'`. Test with a short-deadline RFQ.

---

## Testing Checklist

```
✓ Migration 0019: all five tables, indexes, and RLS policies created
✓ RFQ draft: company creates draft with items and vendor list
✓ Send RFQ: status = 'sent'; rfq_vendors rows created with status = 'invited'
✓ Send blocked: no items or no vendors selected
✓ Vendor sees RFQ in their list after being invited
✓ Vendor views RFQ: rfq_vendors.status updated to 'viewed'
✓ Vendor declines RFQ: status = 'declined'; cannot re-submit
✓ Vendor creates draft quotation: not visible to company (RLS)
✓ Vendor submits quotation: visible to company; rfq_vendors.status = 'submitted'
✓ Server-side total validation: manipulated total_amount rejected
✓ Quotation revision: new row with revision_number + 1; previous = 'revised'
✓ Company sees latest revision; old revisions not shown in default query
✓ Vendor cannot see another vendor's quotation_items (RLS)
✓ Deadline cron: RFQ automatically closed after deadline
✓ Quotation submission blocked after deadline
✓ Cancel RFQ: status = 'cancelled'; vendors cannot submit after cancellation
✓ pnpm build: no TypeScript errors; pnpm lint: zero warnings
```

---

## Acceptance Criteria

```
AC-16.1  Migration 0019 applied; all tables, RLS policies active
AC-16.2  Company can create RFQ from scratch or linked to approved PR
AC-16.3  RFQ sent to selected vendors; vendor sees RFQ in their workspace
AC-16.4  Vendor can create, save draft, and submit quotation with per-item pricing
AC-16.5  Server-side total validation prevents manipulated totals
AC-16.6  Vendor draft quotations invisible to company via RLS
AC-16.7  Vendor can revise quotation once before deadline
AC-16.8  RFQ closes automatically when deadline passes (cron job)
AC-16.9  Company sees vendor response status (invited/viewed/submitted/declined)
AC-16.10 Vendor cannot see other vendors' quotations for the same RFQ
```

---

## Definition of Done

Phase 16 is complete when all Acceptance Criteria above are met AND:

- [ ] All TypeScript checks pass (zero errors)
- [ ] All ESLint checks pass (zero warnings)
- [ ] Migration 0019 applied and committed; `database.ts` regenerated
- [ ] `send-rfq`, `submit-quotation`, `revise-quotation` Edge Functions deployed
- [ ] `pg_cron` job configured and tested for automatic RFQ closing
- [ ] RLS verified: vendor cannot read other vendor's quotations or drafts
- [ ] Server-side total recomputation verified in `submit-quotation` function
- [ ] PR merged to `develop` with at least 1 reviewer approval
- [ ] `feature/16-vendor-quotations` branch merged and deleted

---

## Risk Factors

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Vendor submits quotation after deadline due to clock skew | Low | Medium | Enforce deadline check server-side inside Edge Function using `now()` from Postgres, not client clock |
| Company sees draft quotation via Supabase JS SDK bypass | Low | High | Test RLS policy explicitly; add integration test verifying company client returns empty for draft quotations |
| RFQ cron job fails silently | Low | Medium | Monitor `cron.job_run_details` in Supabase; set up alerting in Phase 31 |
| Total amount manipulation by vendor | Low | Medium | submit-quotation recomputes all totals from quotation_items server-side; client-sent total is ignored |
| Linked PR items drift from RFQ items after PR edit | Low | Low | PR is locked once submitted; rfq_items are a copy at creation time, not a live FK reference to PR items |

---

## Best Practices

- Always recompute quotation totals server-side — never trust the client-submitted total
- Copy PR items into rfq_items at RFQ creation time rather than maintaining a live FK join — this ensures RFQ items are immutable once the RFQ is sent
- Store `revision_number` as a plain integer column, not computed — enables direct querying of latest revision without a subquery
- Gate vendor deadline enforcement in the Edge Function on `now()` from Postgres (UTC), not from the JavaScript runtime, to prevent timezone-based bypass
- Use `pg_cron` for deadline expiry rather than application-level cron — Supabase scheduled tasks are more reliable than external schedulers for database state transitions

---

## Estimated Completion

**5–6 working days.** The dual-workspace nature (company side + vendor side) and the quotation revision logic make this the most complex phase to date. The server-side total validation and the pg_cron deadline job require careful testing before Phase 17 depends on the quotation data.

---

---

# PHASE 17 — QUOTATION COMPARISON

---

## Overview

| Field | Value |
|---|---|
| Phase Number | 17 |
| Phase Name | Quotation Comparison |
| Milestone | M4 — Procurement Lifecycle |
| PRD Reference | Module 16 — Vendor Comparison, Module 17 — Vendor Selection |
| DESIGN Reference | Section 3 (Company — Procurement — Comparison), F01, F03 |
| Estimated Duration | 3–4 days |
| Prerequisite Phases | Phase 16 (Vendor Quotations) |

---

## Purpose

Phase 17 implements the quotation comparison and vendor selection workflow. Once an RFQ has received at least one submitted quotation, the procurement manager can open the comparison view and evaluate all vendor quotations side by side. The comparison surface shows per-item prices, totals, delivery timelines, payment terms, and vendor performance signals (rating from Phase 26 — stubbed in v1). The procurement manager selects the winning quotation, records a selection reason, and the system advances the RFQ to 'awarded' status in preparation for Purchase Order generation in Phase 18.

---

## Business Goal

Quotation comparison is the value-creation step of the entire procurement lifecycle. Without a structured comparison surface, buyers either choose the first vendor who responds or build their own comparison spreadsheets offline. Phase 17 eliminates offline tooling by giving procurement teams a purpose-built comparison interface — one that surfaces not just price but delivery lead time, payment terms, and vendor track record. The goal is an auditable, defensible procurement decision captured in the platform.

---

## Dependencies

- Phase 16 complete (`rfqs`, `rfq_items`, `quotations`, `quotation_items`, `rfq_vendors` tables)
- Phase 2 `DataTable`, `PageHeader`, `KPICard`, `Sheet`, `Tooltip` components
- Phase 10 vendor profile data (for vendor rating stub)

---

## Database Tables

Migration: `0020_create_vendor_selection.sql`

```sql
-- ============================================================
-- Migration: 0020_create_vendor_selection
-- Description: Vendor selection record per RFQ
-- ============================================================

create table public.vendor_selections (
  id               uuid primary key default gen_random_uuid(),
  rfq_id           uuid not null references public.rfqs(id) on delete cascade,
  quotation_id     uuid not null references public.quotations(id),
  vendor_id        uuid not null references public.vendors(id),
  company_id       uuid not null references public.companies(id),
  selected_by      uuid not null references public.profiles(id),
  selection_reason text,                 -- free text rationale
  created_at       timestamptz not null default now(),
  constraint vendor_selection_rfq_unique unique (rfq_id)  -- one selection per RFQ
);

create index idx_vendor_selections_rfq_id      on public.vendor_selections(rfq_id);
create index idx_vendor_selections_company_id  on public.vendor_selections(company_id);
create index idx_vendor_selections_vendor_id   on public.vendor_selections(vendor_id);

-- RLS
alter table public.vendor_selections enable row level security;

create policy "vendor_selections_company_rw"
  on public.vendor_selections for all
  using (company_id = public.get_my_company_id());

-- Winning vendor can read their own selection (for PO context)
create policy "vendor_selections_vendor_read"
  on public.vendor_selections for select
  using (vendor_id = public.get_my_vendor_id());
```

---

## Relationships

```
public.rfqs (1)
  └── public.vendor_selections (1)          — one winning selection per RFQ
        ├── public.quotations (1)           — the winning quotation
        └── public.vendors (1)             — the winning vendor

public.vendor_selections
  └── referenced by public.purchase_orders (Phase 18) — PO created from selection
```

---

## API Endpoints

| Operation | Method | Implementation | Notes |
|---|---|---|---|
| Get quotations for RFQ (comparison) | Server Component | `supabase.from('quotations').select('*, quotation_items(*), vendors(*)')` | Filtered by rfq_id; status != 'draft' |
| Get rfq_items for RFQ | Server Component | `supabase.from('rfq_items').select('*')` | Column headers in comparison grid |
| Select vendor (award) | Edge Function | `select-vendor` | Creates vendor_selections row; updates rfq status; updates quotation statuses |
| Get vendor selection | Server Component | `supabase.from('vendor_selections').select('*, quotations(*), vendors(*)')` | Used by Phase 18 to prefill PO |
| Get comparison data | Server Component | Composed from rfq_items + quotations join | All in one call for comparison page |

**`supabase/functions/select-vendor/index.ts`** (key logic):

```typescript
// 1. Authenticate; verify user has has_permission('rfqs', 'manage')
// 2. Verify rfq.company_id = get_my_company_id()
// 3. Verify rfq.status in ('sent', 'closed') — can award from either
// 4. Verify quotation.rfq_id = rfq_id and quotation.status = 'submitted' | 'revised'
// 5. Insert vendor_selections row
// 6. Update rfqs.status = 'awarded', awarded_at = now()
// 7. Update winning quotation.status = 'accepted'
// 8. Update all other quotations for this RFQ to status = 'rejected'
// 9. Update rfq_vendors: winning vendor → 'awarded'; others → 'rejected'
// 10. Notify winning vendor and rejected vendors (Phase 28 stub)
// Returns: { selection_id, rfq_id, vendor_id, quotation_id }
```

---

## Supabase Services Used

```
Supabase Database:
  - public.vendor_selections   — one record per awarded RFQ
  - public.rfqs                — status updated to 'awarded'
  - public.quotations          — statuses updated (accepted / rejected)
  - public.rfq_vendors         — statuses updated (awarded / rejected)

Supabase Storage:
  - Not used in Phase 17

Supabase Edge Functions:
  - select-vendor              — atomically awards the RFQ and updates all statuses
```

---

## Folder Structure

```
src/
├── app/
│   └── (company)/
│       └── procurement/
│           └── rfqs/
│               └── [id]/
│                   └── compare/
│                       └── page.tsx            [Quotation comparison page]
└── components/
    └── modules/
        └── rfq/
            ├── quotation-comparison-grid.tsx   [Side-by-side comparison table]
            ├── quotation-comparison-header.tsx [Vendor name + summary per column]
            ├── comparison-item-row.tsx         [One row per rfq_item across vendors]
            ├── vendor-selection-form.tsx       [Selection reason + confirm dialog]
            └── index.ts                        [re-export all rfq components]
```

---

## UI Screens

### Screen 17.1 — Quotation Comparison (`/company/procurement/rfqs/[id]/compare`)

`PageHeader`: title "Compare Quotations — [RFQ Number]", breadcrumb Procurement → RFQs → [RFQ Number] → Compare.

**Summary bar**: RFQ title, deadline, number of quotations received, RFQ status badge.

**Comparison Grid** (`QuotationComparisonGrid`):

Horizontal table layout. One column per submitted vendor quotation (max visible without horizontal scroll: 4 on desktop, scroll for more). Fixed left column shows row labels.

Row groups:

| Row Group | Rows |
|---|---|
| Vendor header | Vendor name, logo, rating (Phase 26 stub — shown as "N/A") |
| Summary | Grand total, Subtotal, Tax, Discount, Delivery charge |
| Terms | Payment terms, Delivery days, Valid until |
| Per item | One row per rfq_item: item name + [unit price, quantity, line total per vendor column] |
| Ranking | "Lowest price" badge, "Fastest delivery" badge (computed client-side) |
| Action | "Select This Vendor" button per column |

Cells where a vendor's quotation matches the lowest value for that item are highlighted with a green tint (visual best-price indicator). Cells that are the highest price show a red tint. No highlight for single-vendor comparisons.

If RFQ status = 'awarded', the winning vendor column is highlighted with a "Selected" banner. No action buttons are shown (decision is final).

---

### Screen 17.2 — Vendor Selection Confirmation (Sheet / Dialog)

Triggered by "Select This Vendor" button in the comparison grid. Opens a `Sheet` or confirm dialog with:

- Vendor name and logo
- Quotation total and delivery days
- "Selection reason" textarea (optional)
- "Confirm Selection" and "Cancel" buttons

On confirm, calls `select-vendor` Edge Function. On success: comparison page refreshes, winning column gets "Selected" banner, other columns show "Not selected", and a `Toast` confirmation is shown.

---

## Components

### `QuotationComparisonGrid`

```typescript
interface QuotationComparisonGridProps {
  rfq:         RFQ
  rfqItems:    RFQItem[]
  quotations:  QuotationWithItems[]   // status != 'draft'; latest revision per vendor
  selection?:  VendorSelection | null  // null if not yet awarded
  onSelect:    (quotationId: string) => void
  canSelect:   boolean   // false if rfq.status = 'awarded' or user lacks permission
}
```

Renders the comparison table. Computes best/worst per row client-side. Passes `onSelect` to each column header's CTA button.

### `QuotationComparisonHeader`

```typescript
interface QuotationComparisonHeaderProps {
  quotation:     QuotationWithItems
  vendor:        Vendor
  isWinner?:     boolean
  isBestPrice?:  boolean
  isFastest?:    boolean
  onSelect?:     () => void
  canSelect?:    boolean
}
```

Renders per vendor column: logo, name, grand total (bold), delivery days badge, "Lowest price" / "Fastest delivery" indicator badges when applicable. "Select This Vendor" button (shown only if `canSelect = true` and `!isWinner`). If `isWinner = true`, shows "Selected" banner.

### `ComparisonItemRow`

```typescript
interface ComparisonItemRowProps {
  rfqItem:         RFQItem
  quotationItems:  (QuotationItem | null)[]  // one per vendor column; null if vendor did not quote the item
  bestPriceIndex?: number   // index of the column with the lowest line_total
}
```

Single horizontal row in the comparison grid. Item name label in the first column. Per-vendor columns show unit_price, quantity, line_total. Best price cell has green highlight class; highest price cell has red highlight class.

### `VendorSelectionForm`

```typescript
interface VendorSelectionFormProps {
  quotation:  QuotationWithItems
  vendor:     Vendor
  onConfirm:  (selectionReason: string) => Promise<void>
  onCancel:   () => void
  isLoading?: boolean
}
```

Sheet form displaying vendor summary and selection reason textarea. Calls `onConfirm` with the reason on submit.

---

## Forms

### Form 17.1 — Vendor Selection Form

| Field | Type | Validation |
|---|---|---|
| Selection reason | textarea | Optional, max 1000 chars |

```typescript
const vendorSelectionSchema = z.object({
  selection_reason: z.string().max(1000).optional(),
})
```

Simple form with a single optional field. The key validation is server-side (in the Edge Function): rfq ownership, quotation validity, and status pre-conditions.

---

## Tables

### Comparison Grid (not a DataTable — custom layout)

The quotation comparison is a custom HTML `table` (not a `DataTable` component) because its column structure is dynamic (one column per vendor) and its row grouping (vendor header, summary, per-item, actions) requires custom section rendering. Horizontal scroll on overflow for more than 4 vendors.

---

## Permissions

```
View comparison page:
  - All company members can view the comparison for their company's RFQs

Select vendor (award RFQ):
  - Permission: has_permission('rfqs', 'manage')
  - Roles: Procurement Manager only

Read vendor_selections:
  - Company members can read all selections for their company
  - Winning vendor can read their own selection record (for PO context in Phase 18)
  - Non-winning vendors cannot see vendor_selections (RLS: vendor_id match)
```

---

## Validation Rules

```
Vendor selection:
  - RFQ must have status = 'sent' or 'closed'
  - RFQ must not already have a vendor_selection row (unique constraint)
  - Selected quotation must belong to the RFQ (rfq_id match)
  - Selected quotation must have status = 'submitted' or 'revised'
  - selected_by must have has_permission('rfqs', 'manage')

Comparison view availability:
  - Accessible when rfq.status in ('sent', 'closed', 'awarded')
  - If status = 'draft', redirect to RFQ detail page with message "RFQ not yet sent"
  - If no quotations received yet, show empty state "No quotations received yet"
```

---

## Business Rules

```
BR-17.1  A vendor can only be selected once per RFQ. The unique constraint on
         vendor_selections(rfq_id) enforces this at the database level.

BR-17.2  Selection reason is optional but strongly recommended for audit purposes.
         The UI shows a soft prompt: "Adding a reason creates a clear audit trail."

BR-17.3  Once a vendor is selected, the RFQ status transitions to 'awarded' and
         all quotation statuses are updated atomically (accepted / rejected).
         This transition is irreversible in v1.

BR-17.4  The comparison always uses the latest revision of each vendor's quotation.
         Older revisions (status = 'revised') are not shown in the comparison grid.

BR-17.5  Best-price and fastest-delivery indicators are computed client-side from
         the quotation data. They are visual aids only — no server-side scoring
         is stored. Phase 25 (Analytics) will add historical vendor scoring.

BR-17.6  A rejected vendor is notified of the outcome (Phase 28 notification stub
         in v1). The notification states "Your quotation was not selected for
         [RFQ Number]" without revealing the winning vendor's price.

BR-17.7  The winning vendor is notified and the system prepares for PO generation.
         The 'Create Purchase Order' action becomes available on the RFQ detail
         page once status = 'awarded'.
```

---

## Security

```
- vendor_selections: company writes, vendor reads own only.
  A non-winning vendor cannot determine who won the RFQ via this table.

- Rejected vendor notification (Phase 28) reveals outcome but not competitor pricing.
  Quotation data for other vendors remains RLS-gated to the company.

- select-vendor Edge Function verifies company ownership of the RFQ before
  proceeding. A company cannot award an RFQ belonging to another company.

- The unique constraint on vendor_selections(rfq_id) prevents double-award
  races even if two procurement managers click "Select" simultaneously.

- Selection is logged with selected_by (user UUID) for audit.
  The full audit trail from PR → RFQ → quotations → selection is queryable.
```

---

## State Management

```typescript
// Comparison data for a specific RFQ
export function useRFQComparison(rfqId: string) {
  const supabase = useSupabase()
  return useQuery({
    queryKey: ['rfq-comparison', rfqId],
    queryFn: async () => {
      const [rfqResult, quotationsResult, selectionResult] = await Promise.all([
        supabase
          .from('rfqs')
          .select('*, rfq_items(*)')
          .eq('id', rfqId)
          .single(),
        supabase
          .from('quotations')
          .select('*, quotation_items(*), vendors(name, logo_url, id)')
          .eq('rfq_id', rfqId)
          .neq('status', 'draft')
          .order('revision_number', { ascending: false }),  // latest first per vendor
        supabase
          .from('vendor_selections')
          .select('*')
          .eq('rfq_id', rfqId)
          .maybeSingle(),
      ])
      if (rfqResult.error) throw rfqResult.error
      if (quotationsResult.error) throw quotationsResult.error
      // Deduplicate: keep only latest revision per vendor
      const latestPerVendor = deduplicateByVendor(quotationsResult.data ?? [])
      return {
        rfq:        rfqResult.data,
        quotations: latestPerVendor,
        selection:  selectionResult.data,
      }
    },
    staleTime: 20 * 1000,
  })
}
```

After `select-vendor` succeeds, invalidate `['rfq-comparison', rfqId]` and `['rfq', rfqId]` to reflect the awarded status and updated quotation statuses.

---

## Development Tasks

### Task 17.1 — Migration
Apply migration `0020_create_vendor_selection.sql`. Verify `vendor_selections` table, unique constraint, and RLS. Regenerate `database.ts` types.

### Task 17.2 — Comparison Page Data Fetching
Implement `useRFQComparison` hook with parallel data fetching and deduplication of latest revisions per vendor. Test with multiple revisions per vendor.

### Task 17.3 — QuotationComparisonGrid
Implement the custom comparison table. Dynamic columns (one per vendor). Row groups: vendor header, summary totals, per-item rows, action row. Highlight best/worst price per item. Horizontal scroll for 5+ vendors.

### Task 17.4 — ComparisonItemRow
Implement row component with best-price green highlight and highest-price red highlight. Handle null entries (vendor did not submit an item). Test with missing item quotations.

### Task 17.5 — Vendor Selection Flow
Implement `VendorSelectionForm` sheet. Wire to `select-vendor` Edge Function. Show confirmation toast on success. Refresh comparison grid to show 'Selected' banner and hide action buttons.

### Task 17.6 — select-vendor Edge Function
Implement with all validation checks, atomic status updates (RFQ, winning quotation, rejected quotations, rfq_vendors), and selection record insert. Test concurrent award attempts (unique constraint should resolve).

### Task 17.7 — Navigation Hook-up
Add "Compare Quotations" button to RFQ detail page (Screen 16.3) when status = 'sent' or 'closed' and at least 1 submitted quotation exists. Add "Create PO" button when status = 'awarded' (Phase 18 wires the destination).

---

## Testing Checklist

```
✓ Migration 0020: vendor_selections table, unique constraint, RLS active
✓ Comparison page: loads with all submitted quotations for the RFQ
✓ Comparison grid: one column per vendor; correct totals in each column
✓ Best-price highlight: green on lowest per-item line_total column
✓ Latest revision used: only latest revision_number per vendor shown
✓ No quotations: empty state "No quotations received yet" shown
✓ Select vendor: VendorSelectionForm opens with correct vendor info
✓ Select vendor: select-vendor Edge Function creates vendor_selections row
✓ select-vendor: rfq status → 'awarded'
✓ select-vendor: winning quotation → 'accepted'; others → 'rejected'
✓ select-vendor: rfq_vendors: winner → 'awarded'; others → 'rejected'
✓ Double-award blocked: second select-vendor call returns conflict error
✓ Post-award: comparison page shows 'Selected' banner; no action buttons
✓ Permission: Employee cannot see 'Select This Vendor' button (canSelect = false)
✓ RLS: non-winning vendor cannot read vendor_selections row
✓ pnpm build: no TypeScript errors; pnpm lint: zero warnings
```

---

## Acceptance Criteria

```
AC-17.1  Migration 0020 applied; vendor_selections table with RLS active
AC-17.2  Comparison page renders side-by-side grid with all submitted quotations
AC-17.3  Best-price cell highlighted per item row
AC-17.4  Latest quotation revision used per vendor in the comparison
AC-17.5  Procurement manager can select a vendor via selection form with reason
AC-17.6  select-vendor atomically updates RFQ, quotation, and rfq_vendor statuses
AC-17.7  Awarded RFQ shows 'Selected' banner; re-selection blocked by unique constraint
AC-17.8  RLS: non-winning vendor cannot read competitor vendor_selections
```

---

## Definition of Done

Phase 17 is complete when all Acceptance Criteria above are met AND:

- [ ] All TypeScript checks pass (zero errors)
- [ ] All ESLint checks pass (zero warnings)
- [ ] Migration 0020 applied and committed; `database.ts` regenerated
- [ ] `select-vendor` Edge Function deployed; concurrent award test passes
- [ ] Comparison grid tested with 1, 2, 3, and 4+ vendor columns
- [ ] Post-award state: comparison is read-only, RFQ status = 'awarded'
- [ ] Navigation from RFQ detail → compare page wired
- [ ] PR merged to `develop` with at least 1 reviewer approval
- [ ] `feature/17-quotation-comparison` branch merged and deleted

---

## Risk Factors

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Concurrent select-vendor calls from two managers producing duplicate awards | Low | High | Unique constraint on vendor_selections(rfq_id) prevents duplicates at DB level |
| Comparison grid layout broken with 5+ vendors | Medium | Low | Implement horizontal scroll; test with 6 columns explicitly |
| Latest revision logic selecting the wrong quotation | Low | Medium | `deduplicateByVendor` uses `revision_number DESC` with a DISTINCT ON equivalent; add explicit unit test |
| Rejected vendor learns competitor's price from notification | Low | Medium | Notification message is templated to exclude pricing; review notification content in Phase 28 |

---

## Best Practices

- Use `DISTINCT ON (vendor_id) ORDER BY vendor_id, revision_number DESC` in the server query rather than client-side deduplication to avoid loading unnecessary revision data
- Build the comparison as a custom `<table>` element, not a `DataTable` — the column-per-vendor layout does not fit the row-per-record DataTable paradigm
- Store selection reason even when empty (as an empty string or null) — the field is audit-important and its absence must be explicit, not inferred
- Keep `select-vendor` fully atomic: use a Postgres function wrapped in a transaction rather than sequential Supabase JS client calls to avoid partial state on network failure

---

## Estimated Completion

**3–4 working days.** The comparison grid is a custom UI component (not a reusable DataTable) and requires careful layout work for the dynamic column count. The `select-vendor` Edge Function is the most critical piece and should be reviewed before the PR is merged.

---

---

# PHASE 18 — PURCHASE ORDERS

---

## Overview

| Field | Value |
|---|---|
| Phase Number | 18 |
| Phase Name | Purchase Orders |
| Milestone | M4 — Procurement Lifecycle |
| PRD Reference | Module 18 — Purchase Order, Module 19 — Purchase Order Acceptance |
| DESIGN Reference | Section 3 (Company — Procurement — PO, Vendor — Orders), F01, F03 |
| Estimated Duration | 5–6 days |
| Prerequisite Phases | Phase 17 (Quotation Comparison — vendor selected), Phase 14 (Inventory — stock reservation) |

---

## Purpose

Phase 18 implements the Purchase Order (PO) lifecycle. After a vendor is selected in Phase 17, the procurement team generates a formal Purchase Order from the awarded quotation. The PO captures all line items, pricing, taxes, delivery terms, and legal clauses. The vendor receives the PO in their workspace and responds — accepting, rejecting, or requesting a modification. Once accepted, the PO transitions to the fulfillment phase (Phase 19). This phase also handles PDF generation and email delivery of the PO document.

---

## Business Goal

A Purchase Order is a legally binding procurement document. Without a structured PO system, companies issue informal orders over email — creating disputes about price, quantity, and delivery terms. Phase 18 ensures every purchase commitment is documented, uniquely numbered, formally sent to the vendor, and digitally acknowledged. The PO number becomes the reference ID for all downstream activities: delivery tracking, GRN, invoicing, and payment.

---

## Dependencies

- Phase 17 complete (`vendor_selections` table; RFQ awarded)
- Phase 16 complete (`quotations`, `quotation_items` tables — PO is pre-filled from these)
- Phase 14 complete (`inventory` — `quantity_reserved` updated when PO is created)
- Phase 7 complete (`employees` — delivery addresses, approver context)
- Phase 2 `DataTable`, `PageHeader`, `KPICard`, `StatusBadge`, `Sheet`, `Timeline` components
- PDF generation library: `@react-pdf/renderer` (already in tech stack from Phase 3)

---

## Database Tables

Migration: `0021_create_purchase_orders.sql`

```sql
-- ============================================================
-- Migration: 0021_create_purchase_orders
-- Description: Purchase Order lifecycle
-- ============================================================

create table public.purchase_orders (
  id               uuid primary key default gen_random_uuid(),
  company_id       uuid not null references public.companies(id) on delete cascade,
  vendor_id        uuid not null references public.vendors(id),
  rfq_id           uuid references public.rfqs(id) on delete set null,
  quotation_id     uuid references public.quotations(id) on delete set null,
  vendor_selection_id uuid references public.vendor_selections(id) on delete set null,
  po_number        text not null,           -- PO-{YYYY}-{seq}
  status           text not null default 'draft'
                     check (status in (
                       'draft',         -- PO created; not yet sent to vendor
                       'sent',          -- sent to vendor awaiting response
                       'accepted',      -- vendor accepted
                       'rejected',      -- vendor rejected
                       'modification_requested', -- vendor requested changes
                       'in_progress',   -- delivery underway (Phase 19)
                       'delivered',     -- all items received (Phase 20)
                       'cancelled',     -- cancelled before fulfillment
                       'closed'         -- GRN confirmed; invoicing phase
                     )),
  title            text not null,
  description      text,
  subtotal         numeric(15,2) not null default 0,
  tax_amount       numeric(15,2) not null default 0,
  discount_amount  numeric(15,2) not null default 0,
  delivery_charge  numeric(15,2) not null default 0,
  total_amount     numeric(15,2) not null default 0,
  currency         text not null default 'INR',
  payment_terms    text,
  delivery_date    date,
  delivery_address text,
  terms_conditions text,
  notes            text,
  -- Vendor response fields
  vendor_response  text,                    -- vendor's acceptance/rejection remarks
  responded_at     timestamptz,
  -- Lifecycle timestamps
  sent_at          timestamptz,
  accepted_at      timestamptz,
  cancelled_at     timestamptz,
  closed_at        timestamptz,
  created_by       uuid not null references public.profiles(id),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create unique index idx_po_number_company on public.purchase_orders(company_id, po_number);
create index idx_po_company_id   on public.purchase_orders(company_id);
create index idx_po_vendor_id    on public.purchase_orders(vendor_id);
create index idx_po_rfq_id       on public.purchase_orders(rfq_id);
create index idx_po_status       on public.purchase_orders(status);
create index idx_po_created_at   on public.purchase_orders(created_at desc);

create trigger trg_po_updated_at
  before update on public.purchase_orders
  for each row execute function public.handle_updated_at();

-- PO line items
create table public.po_items (
  id              uuid primary key default gen_random_uuid(),
  po_id           uuid not null references public.purchase_orders(id) on delete cascade,
  quotation_item_id uuid references public.quotation_items(id) on delete set null,
  product_id      uuid references public.products(id) on delete set null,
  item_name       text not null,
  description     text,
  quantity        numeric(12,3) not null check (quantity > 0),
  unit_of_measure text not null default 'piece',
  unit_price      numeric(12,2) not null check (unit_price >= 0),
  tax_rate        numeric(5,2) not null default 0,
  tax_amount      numeric(12,2) not null default 0,
  discount_rate   numeric(5,2) not null default 0,
  discount_amount numeric(12,2) not null default 0,
  line_total      numeric(15,2) not null default 0,
  sort_order      integer not null default 0,
  created_at      timestamptz not null default now()
);

create index idx_po_items_po_id on public.po_items(po_id);

-- PO modification requests (vendor can request changes)
create table public.po_modification_requests (
  id          uuid primary key default gen_random_uuid(),
  po_id       uuid not null references public.purchase_orders(id) on delete cascade,
  requested_by uuid not null references public.profiles(id),
  reason      text not null,
  status      text not null default 'open'
                check (status in ('open','resolved','dismissed')),
  resolved_at timestamptz,
  created_at  timestamptz not null default now()
);

create index idx_po_mod_requests_po_id on public.po_modification_requests(po_id);

-- RLS
alter table public.purchase_orders         enable row level security;
alter table public.po_items                enable row level security;
alter table public.po_modification_requests enable row level security;

-- Company reads and writes own POs
create policy "po_company_rw"
  on public.purchase_orders for all
  using (company_id = public.get_my_company_id());

-- Vendor reads POs addressed to them (status != 'draft')
create policy "po_vendor_read"
  on public.purchase_orders for select
  using (
    vendor_id = public.get_my_vendor_id()
    and status != 'draft'
  );

-- Vendor updates own PO for response fields only
create policy "po_vendor_respond"
  on public.purchase_orders for update
  using (
    vendor_id = public.get_my_vendor_id()
    and status = 'sent'
  )
  with check (
    vendor_id = public.get_my_vendor_id()
  );

-- PO items: follow PO access
create policy "po_items_company_read"
  on public.po_items for all
  using (
    exists (
      select 1 from public.purchase_orders po
      where po.id = po_items.po_id
        and po.company_id = public.get_my_company_id()
    )
  );

create policy "po_items_vendor_read"
  on public.po_items for select
  using (
    exists (
      select 1 from public.purchase_orders po
      where po.id = po_items.po_id
        and po.vendor_id = public.get_my_vendor_id()
        and po.status != 'draft'
    )
  );

create policy "po_mod_requests_company_read"
  on public.po_modification_requests for select
  using (
    exists (
      select 1 from public.purchase_orders po
      where po.id = po_modification_requests.po_id
        and po.company_id = public.get_my_company_id()
    )
  );

create policy "po_mod_requests_vendor_rw"
  on public.po_modification_requests for all
  using (
    exists (
      select 1 from public.purchase_orders po
      where po.id = po_modification_requests.po_id
        and po.vendor_id = public.get_my_vendor_id()
    )
  );
```

---

## Relationships

```
public.vendor_selections (1)
  └── public.purchase_orders (1)       — one PO per selection (standard flow)
        ├── public.po_items (N)        — copied from quotation_items
        └── public.po_modification_requests (N)

public.purchase_orders
  └── referenced by public.shipments (Phase 19)
  └── referenced by public.grns (Phase 20)
  └── referenced by public.invoices (Phase 21)
  └── referenced by public.payments (Phase 22)

Inventory impact:
  PO creation (status → 'sent') → inventory.quantity_reserved += po_items.quantity
  PO cancellation → inventory.quantity_reserved -= po_items.quantity
  GRN confirmation (Phase 20) → quantity_on_hand -= delivered; quantity_reserved -= delivered
```

---

## API Endpoints

| Operation | Method | Implementation | Notes |
|---|---|---|---|
| List POs (company) | Server Component | `supabase.from('purchase_orders').select('*, vendors(name), po_items(count)')` | Company-scoped via RLS |
| List POs (vendor) | Server Component | `supabase.from('purchase_orders').select('*, companies(name)')` | Vendor sees non-draft POs |
| Get single PO | Server Component | `supabase.from('purchase_orders').select('*, po_items(*), vendors(*), companies(*)')` | Full detail |
| Create PO from quotation | Edge Function | `create-purchase-order` | Pre-fills from quotation; reserves inventory |
| Send PO to vendor | Edge Function | `send-purchase-order` | status → 'sent'; notifies vendor |
| Vendor accepts PO | Edge Function | `respond-to-po` | action = 'accept'; status → 'accepted' |
| Vendor rejects PO | Edge Function | `respond-to-po` | action = 'reject'; status → 'rejected'; releases inventory |
| Vendor requests modification | Client mutation | `supabase.from('po_modification_requests').insert()` + PO status → 'modification_requested' | |
| Company resolves modification | Client mutation | `supabase.from('po_modification_requests').update({ status: 'resolved' })` + resend PO | |
| Cancel PO | Edge Function | `cancel-purchase-order` | Releases inventory; status → 'cancelled' |
| Generate PO PDF | Edge Function | `generate-po-pdf` | Returns PDF bytes; stored in `po-documents` bucket |
| Download PO PDF | Client | `supabase.storage.from('po-documents').createSignedUrl()` | |
| Email PO to vendor | Edge Function | `email-purchase-order` | Uses Resend; attaches PDF |

**`supabase/functions/create-purchase-order/index.ts`** (key logic):

```typescript
// 1. Authenticate; verify has_permission('purchase_orders', 'create')
// 2. Load vendor_selection, quotation, quotation_items
// 3. Insert purchase_orders row (status = 'draft')
// 4. Insert po_items from quotation_items
// 5. Insert inventory_movements (type = 'reserved') for each product_id in po_items
//    and update inventory.quantity_reserved += quantity for each product
// 6. Verify inventory: quantity_available (on_hand - reserved) >= 0 after reservation
//    If not: rollback and return error with insufficient stock details
// Returns: { po_id, po_number }
```

---

## Supabase Services Used

```
Supabase Database:
  - public.purchase_orders            — core PO records
  - public.po_items                   — line items per PO
  - public.po_modification_requests   — vendor change requests
  - public.inventory                  — quantity_reserved updated on PO creation/cancel
  - public.inventory_movements        — 'reserved' and 'unreserved' movements logged

Supabase Storage:
  - po-documents bucket               — private; stores generated PO PDFs
  - Path: po-documents/[company_id]/[po_id]/[po_number].pdf

Supabase Edge Functions:
  - create-purchase-order             — creates PO + reserves inventory atomically
  - send-purchase-order               — status → 'sent'; notifies vendor
  - respond-to-po                     — vendor accept/reject; releases inventory on reject
  - cancel-purchase-order             — releases inventory; status → 'cancelled'
  - generate-po-pdf                   — renders PO as PDF using @react-pdf/renderer
  - email-purchase-order              — sends PO PDF to vendor via Resend
```

---

## Folder Structure

```
src/
├── app/
│   ├── (company)/
│   │   └── procurement/
│   │       └── purchase-orders/
│   │           ├── page.tsx                        [PO list page]
│   │           ├── new/
│   │           │   └── page.tsx                    [Create PO from selection]
│   │           └── [id]/
│   │               └── page.tsx                    [PO detail — company view]
│   └── (vendor)/
│       └── orders/
│           ├── page.tsx                            [Vendor: received POs list]
│           └── [id]/
│               └── page.tsx                        [Vendor: PO detail + response]
└── components/
    └── modules/
        └── purchase-orders/
            ├── purchase-order-form.tsx
            ├── purchase-order-items-table.tsx
            ├── purchase-order-status-badge.tsx
            ├── purchase-order-detail.tsx
            ├── po-vendor-response-panel.tsx
            ├── po-modification-request-form.tsx
            ├── po-pdf-document.tsx                 [react-pdf document component]
            └── index.ts
```

---

## UI Screens

### Screen 18.1 — Purchase Orders List — Company (`/company/procurement/purchase-orders`)

`PageHeader`: title "Purchase Orders", action "New PO".

**KPI row** (5 cards):
| KPI Card | Value |
|---|---|
| Total POs | All non-cancelled |
| Draft | status = 'draft' |
| Awaiting Vendor | status = 'sent' |
| Accepted / Active | status = 'accepted' + 'in_progress' |
| Delivered | status = 'delivered' + 'closed' |

`DataTable` (POTable). Default sort: created_at descending.

---

### Screen 18.2 — Create Purchase Order (`/company/procurement/purchase-orders/new?rfqId=[id]`)

`PageHeader`: title "New Purchase Order", breadcrumb Procurement → POs → New.

The page is pre-seeded from the awarded quotation. Vendor and items are pre-populated (read-only). Editable fields:

- PO title
- Description / scope of work
- Delivery date
- Delivery address
- Payment terms
- Terms & conditions
- Notes

`PurchaseOrderItemsTable` is rendered in read-only mode showing all pre-filled line items with per-item pricing.

"Save as Draft" and "Send to Vendor" actions in the footer. "Send" triggers `send-purchase-order` Edge Function.

---

### Screen 18.3 — PO Detail — Company (`/company/procurement/purchase-orders/[id]`)

`PageHeader`: title "[PO Number] — [Title]", status badge, action "Download PDF" + "Email to Vendor".

Five panels:

1. **PO Summary**: vendor card (name + logo), total amount, status, sent at, accepted at, delivery date.
2. **Line Items**: read-only `PurchaseOrderItemsTable` with quantity, unit price, tax, discount, line total, grand total footer row.
3. **Vendor Response Panel** (`POVendorResponsePanel`): shows vendor_response text when status = 'accepted' or 'rejected'. Shows modification request details when status = 'modification_requested'.
4. **Activity Log**: timeline of all status transitions with actor and timestamp.
5. **Actions**: "Cancel PO" button (enabled for draft/sent/modification_requested). "View Shipment" link (Phase 19). "Create GRN" link (Phase 20).

---

### Screen 18.4 — Received POs — Vendor (`/vendor/orders`)

`PageHeader`: title "Purchase Orders".

`DataTable` showing POs addressed to this vendor. Columns: PO number, company name, title, total, delivery date, status, actions (view, accept, reject).

---

### Screen 18.5 — PO Detail + Response — Vendor (`/vendor/orders/[id]`)

`PageHeader`: title "[PO Number]", company name.

Three panels:

1. **PO Summary**: company name, total amount, payment terms, delivery date, delivery address, terms & conditions, notes.
2. **Line Items**: read-only `PurchaseOrderItemsTable`.
3. **Response Panel**: if status = 'sent': "Accept PO" and "Reject PO" buttons + "Request Modification" option. If already responded: response status badge + vendor_response text.

"Download PDF" button available on both company and vendor detail views.

---

## Components

### `PurchaseOrderForm`

```typescript
interface PurchaseOrderFormProps {
  defaultValues:  Partial<POFormData>
  quotation?:     QuotationWithItems     // pre-fill from quotation
  onSubmit:       (data: POFormData, action: 'draft' | 'send') => Promise<void>
  isLoading?:     boolean
}
```

Editable fields: title, description, delivery_date, delivery_address, payment_terms, terms_conditions, notes. Items pre-populated from quotation and rendered via `PurchaseOrderItemsTable` (read-only in create flow).

### `PurchaseOrderItemsTable`

```typescript
interface PurchaseOrderItemsTableProps {
  items:       POItem[]
  currency:    string
  showTotals?: boolean   // renders subtotal/tax/total footer row
  readOnly?:   boolean
}
```

Renders item rows with quantity, UOM, unit price, tax rate, discount, line total. When `showTotals = true`, renders a summary footer: subtotal, tax, discount, delivery charge, grand total.

### `PurchaseOrderStatusBadge`

Status colour map:
- `draft` → grey
- `sent` → blue
- `accepted` → green
- `rejected` → red
- `modification_requested` → amber
- `in_progress` → blue (dark)
- `delivered` → teal
- `cancelled` → grey (dark)
- `closed` → green (dark)

### `POVendorResponsePanel`

```typescript
interface POVendorResponsePanelProps {
  po:                    PurchaseOrder
  modificationRequests:  POModificationRequest[]
  isVendor?:             boolean
  onAccept?:             (response: string) => Promise<void>
  onReject?:             (response: string) => Promise<void>
  onRequestModification?: (reason: string) => Promise<void>
}
```

When `isVendor = true` and status = 'sent': shows action buttons. When status = 'accepted' or 'rejected': shows response badge and vendor remarks. When modification_requests exist: shows them in a list with company resolution status.

### `POModificationRequestForm`

```typescript
interface POModificationRequestFormProps {
  poId:      string
  onSubmit:  (reason: string) => Promise<void>
  onCancel:  () => void
}
```

Simple textarea form in a Sheet. Reason is required, min 20 chars. On submit, inserts `po_modification_requests` row and sets PO status to 'modification_requested'.

### `POPDFDocument`

```typescript
interface POPDFDocumentProps {
  po:          PurchaseOrder
  poItems:     POItem[]
  company:     Company
  vendor:      Vendor
}
```

`@react-pdf/renderer` Document component. Pages: (1) PO header with company and vendor details, PO number, date, status; (2) line items table with totals; (3) payment terms and delivery terms; (4) signatures section. Styled with the VendorFlow brand from DESIGN.md tokens.

---

## Forms

### Form 18.1 — Purchase Order Form

| Field | Type | Validation |
|---|---|---|
| Title | text input | Required, min 5 chars, max 200 chars |
| Description | textarea | Optional, max 2000 chars |
| Delivery date | date picker | Required, min today + 1 day |
| Delivery address | textarea | Required, max 500 chars |
| Payment terms | text input | Required, max 200 chars |
| Terms & conditions | textarea | Optional, max 5000 chars |
| Notes | textarea | Optional, max 1000 chars |

```typescript
const purchaseOrderSchema = z.object({
  title:            z.string().min(5).max(200),
  description:      z.string().max(2000).optional(),
  delivery_date:    z.date().min(new Date(Date.now() + 24 * 60 * 60 * 1000)),
  delivery_address: z.string().min(10).max(500),
  payment_terms:    z.string().min(2).max(200),
  terms_conditions: z.string().max(5000).optional(),
  notes:            z.string().max(1000).optional(),
})
```

---

### Form 18.2 — Vendor Response Form (Accept/Reject)

| Field | Type | Validation |
|---|---|---|
| Response | radio | Required; values: accept, reject |
| Remarks | textarea | Optional for accept; required for reject (min 10 chars) |

---

### Form 18.3 — Modification Request Form

| Field | Type | Validation |
|---|---|---|
| Reason | textarea | Required, min 20 chars, max 1000 chars |

---

## Tables

### Purchase Orders Table (Company + Vendor)

| Column | Sortable | Filterable |
|---|---|---|
| PO Number | Yes | Yes (search) |
| Title | Yes | Yes (search) |
| Vendor / Company | No | Yes |
| Total Amount | Yes | No |
| Delivery Date | Yes | Yes (date range) |
| Status | Yes | Yes (multi-select) |
| Created Date | Yes | Yes (date range) |
| Actions | No | No |

---

### PO Items Table (within PO detail)

| Column | Sortable | Filterable |
|---|---|---|
| Item name | No | No |
| Quantity | No | No |
| UOM | No | No |
| Unit price | No | No |
| Tax % | No | No |
| Discount % | No | No |
| Line total | No | No |

Footer row: Subtotal, Tax, Discount, Delivery, **Grand Total**.

---

## Permissions

```
Create PO:
  - Permission: has_permission('purchase_orders', 'create')
  - Roles: Procurement Manager, Procurement Officer

Send PO:
  - Permission: has_permission('purchase_orders', 'send')
  - Roles: Procurement Manager only

View PO (company):
  - All company members can view POs for their company

View PO (vendor):
  - Vendor sees all non-draft POs addressed to their vendor_id

Vendor accept / reject:
  - Vendor user with vendor_user role; vendor_id must match po.vendor_id
  - Only when po.status = 'sent'

Vendor request modification:
  - Same as vendor accept/reject

Cancel PO:
  - Permission: has_permission('purchase_orders', 'cancel')
  - Roles: Procurement Manager only
  - Allowed statuses: 'draft', 'sent', 'modification_requested'

Generate / download PDF:
  - Company: all company members
  - Vendor: vendor_user for POs addressed to them
```

---

## Validation Rules

```
PO creation:
  - Must be linked to an awarded vendor_selection (rfq_id + vendor selection valid)
  - All po_items must have unit_price >= 0
  - Inventory reservation must not result in quantity_available < 0 for any product
    If insufficient: error returned per product_id with current availability

PO send:
  - status must be 'draft'
  - delivery_address must be populated
  - At least 1 po_item must exist

Vendor accept/reject:
  - po.status must be 'sent'
  - Reject requires vendor_response text (min 10 chars)

Modification request:
  - po.status must be 'sent'
  - reason min 20 chars required
  - Only 1 open modification request allowed per PO at a time

Cancel:
  - po.status must not be 'accepted', 'in_progress', 'delivered', or 'closed'
  - Cancellation triggers inventory unreservation via Edge Function

Computed totals (authoritative):
  line_total      = quantity × unit_price × (1 + tax_rate/100) × (1 - discount_rate/100)
  subtotal        = Σ line_totals
  tax_amount      = Σ (quantity × unit_price × tax_rate / 100)
  discount_amount = Σ (quantity × unit_price × discount_rate / 100)
  total_amount    = subtotal + tax_amount - discount_amount + delivery_charge
```

---

## Business Rules

```
BR-18.1  PO numbers are auto-generated in the format PO-{YYYY}-{seq}, sequential
         per company per year. Same generation pattern as PR and RFQ numbers.

BR-18.2  A PO is always created from an awarded vendor_selection in the standard
         procurement flow. Ad-hoc POs (without an RFQ) are not supported in v1.

BR-18.3  Inventory reservation occurs at PO creation time (status = 'draft' → 'sent').
         The reservation is written as an inventory_movement row (type = 'reserved')
         and quantity_reserved is incremented. If stock is insufficient, the PO
         creation is blocked and the error lists which products lack availability.

BR-18.4  Vendor rejection releases the inventory reservation immediately.
         Cancellation also releases inventory. Both are handled in their respective
         Edge Functions using the same inventory unreservation logic.

BR-18.5  A modification_requested PO is not rejected. It signals the vendor wants
         to discuss terms. The company resolves the modification request (edits
         the PO if needed) and re-sends. No new PO number is generated on re-send.

BR-18.6  The PO PDF is generated on-demand and stored in the private `po-documents`
         bucket. The same PDF is shared with both the company (download) and the
         vendor (email attachment via `email-purchase-order`).

BR-18.7  PO status progression is strictly sequential:
         draft → sent → accepted → in_progress (Phase 19) → delivered (Phase 20) → closed
         Skipping statuses is not permitted. Rejected and cancelled are terminal states.
```

---

## Security

```
- RLS enforces company_id scoping: company can only see their own POs.
- Vendor sees only non-draft POs addressed to their vendor_id.
  Draft POs (still being prepared by the company) are invisible to vendors.

- PO PDF contains both company and vendor sensitive details (pricing, addresses,
  bank terms). It is stored in a private bucket with signed URL access only.
  URLs expire after 1 hour.

- Inventory reservation is performed by create-purchase-order with service role
  to avoid race conditions in the reservation check. No client-side path to update
  quantity_reserved.

- respond-to-po verifies vendor_id from JWT matches po.vendor_id before updating.
  A vendor cannot accept or reject another vendor's PO.

- cancel-purchase-order verifies company_id from JWT matches po.company_id
  and checks status pre-conditions before cancelling.

- PO modification requests contain free-text reasons. Input is sanitized
  (max 1000 chars, no HTML). No code injection risk via a rendered textarea.
```

---

## State Management

```typescript
// Company: PO list
export function useCompanyPurchaseOrders(companyId: string, filters?: POFilters) {
  const supabase = useSupabase()
  return useQuery({
    queryKey: ['purchase-orders', 'company', companyId, filters],
    queryFn: async () => {
      let query = supabase
        .from('purchase_orders')
        .select('*, vendors(name, logo_url), po_items(count)')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })
      if (filters?.status?.length) query = query.in('status', filters.status)
      const { data, error } = await query
      if (error) throw error
      return data ?? []
    },
    staleTime: 30 * 1000,
  })
}

// Vendor: received POs
export function useVendorPurchaseOrders(vendorId: string) {
  const supabase = useSupabase()
  return useQuery({
    queryKey: ['purchase-orders', 'vendor', vendorId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('purchase_orders')
        .select('*, companies(name, logo_url)')
        .eq('vendor_id', vendorId)
        .neq('status', 'draft')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data ?? []
    },
    staleTime: 30 * 1000,
  })
}

// Single PO detail
export function usePurchaseOrder(poId: string) {
  const supabase = useSupabase()
  return useQuery({
    queryKey: ['purchase-order', poId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('purchase_orders')
        .select(`
          *,
          po_items(*),
          vendors(*, profiles(full_name)),
          companies(name, logo_url, address),
          po_modification_requests(*)
        `)
        .eq('id', poId)
        .single()
      if (error) throw error
      return data
    },
    staleTime: 15 * 1000,
  })
}
```

After any PO mutation, invalidate both list and detail query keys.

---

## Development Tasks

### Task 18.1 — Migration
Apply migration `0021_create_purchase_orders.sql`. Verify three tables, unique PO number constraint, RLS policies. Regenerate `database.ts` types.

### Task 18.2 — PO Number Generation
Extend `generate-pr-number` pattern to `generate-po-number` Edge Function. Format: `PO-{YYYY}-{seq}`.

### Task 18.3 — create-purchase-order Edge Function
Implement: load quotation, insert PO + po_items, inventory reservation (INSERT inventory_movements + UPDATE inventory.quantity_reserved). Return error if stock insufficient for any product.

### Task 18.4 — Create PO Page
Implement `/company/procurement/purchase-orders/new?rfqId=` page. Pre-fill from vendor_selection + quotation. Wire "Save as Draft" and "Send to Vendor" actions.

### Task 18.5 — send-purchase-order and respond-to-po Edge Functions
Implement `send-purchase-order` (status → 'sent'; notify vendor). Implement `respond-to-po` (accept/reject; release inventory on reject).

### Task 18.6 — PO List Pages (Company + Vendor)
Implement company `/company/procurement/purchase-orders/page.tsx` with KPI cards and POTable. Implement vendor `/vendor/orders/page.tsx`.

### Task 18.7 — PO Detail Pages (Company + Vendor)
Implement company detail with all five panels. Implement vendor detail with response panel. Wire accept/reject to `respond-to-po` Edge Function.

### Task 18.8 — PO Modification Request Flow
Implement `POModificationRequestForm` sheet. Wire insert mutation + PO status update. Implement company resolution (dismiss / re-send PO).

### Task 18.9 — cancel-purchase-order Edge Function
Implement: validate status, release inventory (inventory_movement type = 'unreserved', decrement quantity_reserved), set status = 'cancelled'.

### Task 18.10 — PDF Generation
Implement `POPDFDocument` using `@react-pdf/renderer`. Implement `generate-po-pdf` Edge Function (render + store in bucket). Wire "Download PDF" button to signed URL. Wire "Email to Vendor" to `email-purchase-order`.

---

## Testing Checklist

```
✓ Migration 0021: all three tables and RLS active
✓ RLS: draft PO invisible to vendor
✓ RLS: vendor can only read POs for their vendor_id (not draft)
✓ RLS: company cannot read another company's POs
✓ PO creation: po_items correctly populated from quotation_items
✓ Inventory reservation: quantity_reserved incremented for each product in PO
✓ Inventory reservation blocked: PO creation fails when stock insufficient
✓ Send PO: status = 'sent'; vendor can see PO in their list
✓ Vendor accepts: status = 'accepted'; vendor_response saved
✓ Vendor rejects: status = 'rejected'; inventory unreserved
✓ Reject without remarks blocked (min 10 chars enforced)
✓ Modification request: status = 'modification_requested'; request row created
✓ Cancel PO: status = 'cancelled'; inventory unreserved
✓ Cancel blocked: PO with status 'accepted' cannot be cancelled via form
✓ PDF generated: correct company, vendor, items, totals in output
✓ PDF signed URL: expires after 1 hour; inaccessible after expiry
✓ Email: vendor receives PO email with PDF attachment (tested with test email)
✓ KPI cards: accurate counts after status transitions
✓ pnpm build: no TypeScript errors; pnpm lint: zero warnings
```

---

## Acceptance Criteria

```
AC-18.1  Migration 0021 applied; purchase_orders, po_items, po_modification_requests active with RLS
AC-18.2  PO created from awarded quotation with pre-filled items and correct pricing
AC-18.3  Inventory reserved atomically at PO creation; insufficient stock blocks creation
AC-18.4  Vendor receives PO notification; can accept, reject, or request modification
AC-18.5  Vendor rejection releases inventory reservation immediately
AC-18.6  PO cancellation releases inventory; status = 'cancelled'
AC-18.7  PO PDF generated and stored; downloadable via signed URL by both parties
AC-18.8  Email PO: vendor receives email with PDF attachment
AC-18.9  Draft PO invisible to vendor via RLS
AC-18.10 KPI cards accurate; POTable filters functional
```

---

## Definition of Done

Phase 18 is complete when all Acceptance Criteria above are met AND:

- [ ] All TypeScript checks pass (zero errors)
- [ ] All ESLint checks pass (zero warnings)
- [ ] Migration 0021 applied and committed; `database.ts` regenerated
- [ ] `create-purchase-order`, `send-purchase-order`, `respond-to-po`, `cancel-purchase-order` Edge Functions deployed
- [ ] `generate-po-pdf` and `email-purchase-order` Edge Functions deployed and tested
- [ ] Inventory reservation and unreservation verified end-to-end
- [ ] PDF output verified: correct data, brand styling, signature section
- [ ] Draft PO invisible to vendor: RLS test confirmed
- [ ] PR merged to `develop` with at least 1 reviewer approval
- [ ] `feature/18-purchase-orders` branch merged and deleted

---

## Risk Factors

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Inventory reservation race condition when two POs created simultaneously for same product | Low | Medium | Use Postgres advisory lock or serializable transaction inside create-purchase-order |
| PDF generation fails for large POs (many items) | Low | Low | Test with 50+ items; @react-pdf/renderer handles multi-page layouts |
| Email delivery failure (Resend down) | Low | Low | Vendor can still download PDF from within the platform; email is supplementary |
| Inventory not released on failed Edge Function rollback | Medium | Medium | Wrap reservation and PO insert in a DB function transaction so both succeed or both roll back atomically |
| PO modification request status not reset after company re-sends | Low | Low | Re-send logic sets modification_requests to 'dismissed' and PO status back to 'sent' |

---

## Best Practices

- Wrap inventory reservation and PO insert in a single Postgres function (RPC) to ensure atomicity — not two sequential client mutations
- Generate PO PDF from the database record, not from the request payload, to ensure the PDF always reflects the canonical database state
- Store PDF in the bucket immediately on generation — do not regenerate on every download; regenerate only when the PO is updated
- Use `ON DELETE SET NULL` on rfq_id and quotation_id FK references — a PO should remain readable even if the originating RFQ is deleted
- Keep the vendor response simple: accept / reject / modification_request. Multi-step counter-offer negotiation is a Phase 31 feature.

---

## Estimated Completion

**5–6 working days.** The inventory reservation logic and the PDF generation are the two highest-complexity tasks. The dual-workspace PO response flow (company creates, vendor responds) adds integration testing overhead. Prioritise the `create-purchase-order` function with its inventory atomicity guarantee before building the UI.

---

---

# PHASE 19 — ORDER TRACKING

---

## Overview

| Field | Value |
|---|---|
| Phase Number | 19 |
| Phase Name | Order Tracking |
| Milestone | M4 — Procurement Lifecycle |
| PRD Reference | Module 23 — Order Tracking, Module 24 — Shipment Tracking |
| DESIGN Reference | Section 3 (Company — Procurement — Orders, Vendor — Orders — Shipment), F01, F03 |
| Estimated Duration | 3–4 days |
| Prerequisite Phases | Phase 18 (Purchase Orders — PO accepted) |

---

## Purpose

Phase 19 implements the order fulfillment tracking lifecycle. Once a vendor accepts a Purchase Order, both the company and the vendor need visibility into the order's progress from processing through packing, shipment, and delivery. The vendor drives the status updates and shipment information. The company monitors status in real time. This phase covers the `shipments` table, vendor-side fulfillment status workflow, and the order timeline UI on both sides.

---

## Business Goal

Without structured order tracking, buyers resort to emails and phone calls to find out if their order is on the way. Phase 19 eliminates this by giving every stakeholder a live, self-serve order status page. Vendors have a simple interface to update progress; buyers get automatic notifications and a timeline view. The result is fewer status enquiry emails, faster escalation when deliveries are late, and a complete fulfillment audit trail per PO.

---

## Dependencies

- Phase 18 complete (`purchase_orders` table; PO in status 'accepted')
- Phase 2 `DataTable`, `PageHeader`, `KPICard`, `StatusBadge`, `Timeline` components

---

## Database Tables

Migration: `0022_create_shipments.sql`

```sql
-- ============================================================
-- Migration: 0022_create_shipments
-- Description: Order fulfillment and shipment tracking
-- ============================================================

create table public.shipments (
  id               uuid primary key default gen_random_uuid(),
  po_id            uuid not null references public.purchase_orders(id) on delete cascade,
  company_id       uuid not null references public.companies(id),
  vendor_id        uuid not null references public.vendors(id),
  shipment_number  text not null,           -- SHP-{YYYY}-{seq}
  status           text not null default 'processing'
                     check (status in (
                       'processing',   -- vendor acknowledged; preparing order
                       'packed',       -- items packed and ready to dispatch
                       'shipped',      -- dispatched to courier
                       'in_transit',   -- in transit (courier accepted)
                       'out_for_delivery', -- last-mile
                       'delivered',    -- delivered; pending GRN
                       'cancelled'     -- shipment cancelled (PO was cancelled)
                     )),
  courier_name     text,                   -- e.g. "Blue Dart", "DTDC"
  tracking_number  text,
  tracking_url     text,
  estimated_delivery date,
  actual_delivery  date,
  dispatch_date    date,
  shipping_address text,
  notes            text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create unique index idx_shipment_po_id on public.shipments(po_id);  -- one shipment per PO
create index idx_shipments_company_id on public.shipments(company_id);
create index idx_shipments_vendor_id  on public.shipments(vendor_id);
create index idx_shipments_status     on public.shipments(status);

create trigger trg_shipments_updated_at
  before update on public.shipments
  for each row execute function public.handle_updated_at();

-- Shipment status history (full event log)
create table public.shipment_events (
  id           uuid primary key default gen_random_uuid(),
  shipment_id  uuid not null references public.shipments(id) on delete cascade,
  status       text not null,              -- the status at the time of this event
  description  text not null,              -- human-readable event description
  location     text,                       -- optional — city or transit point
  event_source text not null default 'vendor'
                 check (event_source in ('vendor', 'system', 'courier')),
  created_by   uuid references public.profiles(id),
  created_at   timestamptz not null default now()
);

create index idx_shipment_events_shipment_id on public.shipment_events(shipment_id);
create index idx_shipment_events_created_at  on public.shipment_events(created_at desc);

-- RLS
alter table public.shipments        enable row level security;
alter table public.shipment_events  enable row level security;

-- Company reads shipments for their POs
create policy "shipments_company_read"
  on public.shipments for select
  using (company_id = public.get_my_company_id());

-- Vendor reads and writes own shipments
create policy "shipments_vendor_rw"
  on public.shipments for all
  using (vendor_id = public.get_my_vendor_id());

-- Company reads shipment events
create policy "shipment_events_company_read"
  on public.shipment_events for select
  using (
    exists (
      select 1 from public.shipments s
      where s.id = shipment_events.shipment_id
        and s.company_id = public.get_my_company_id()
    )
  );

-- Vendor reads and writes own shipment events
create policy "shipment_events_vendor_rw"
  on public.shipment_events for all
  using (
    exists (
      select 1 from public.shipments s
      where s.id = shipment_events.shipment_id
        and s.vendor_id = public.get_my_vendor_id()
    )
  );
```

---

## Relationships

```
public.purchase_orders (1)
  └── public.shipments (1)               — one shipment per PO
        └── public.shipment_events (N)   — full status event history

public.shipments
  └── referenced by public.grns (Phase 20) — GRN linked to shipment
```

---

## API Endpoints

| Operation | Method | Implementation | Notes |
|---|---|---|---|
| Get shipment for PO | Server Component | `supabase.from('shipments').select('*, shipment_events(*)').eq('po_id', id)` | Both company and vendor |
| Create shipment | Edge Function | `create-shipment` | Triggered when PO status = 'accepted'; creates shipment + first event |
| Update shipment status | Edge Function | `update-shipment-status` | Vendor advances status; inserts shipment_event row; updates PO status mirror |
| Add shipment details (courier, tracking) | Client mutation | `supabase.from('shipments').update({ courier_name, tracking_number, tracking_url, dispatch_date })` | Vendor only |
| Get shipment events | Server Component | `supabase.from('shipment_events').select('*').eq('shipment_id', id).order('created_at')` | |
| Company list active shipments | Server Component | `supabase.from('shipments').select('*, purchase_orders(po_number, title)')` | Filtered by company_id |
| Vendor list own shipments | Server Component | `supabase.from('shipments').select('*, purchase_orders(po_number, title, companies(name))')` | Filtered by vendor_id |

**`supabase/functions/update-shipment-status/index.ts`** (key logic):

```typescript
// 1. Authenticate vendor; verify shipment.vendor_id = get_my_vendor_id()
// 2. Validate status transition (must be forward-only — see Business Rules)
// 3. Update shipments.status and updated_at
// 4. Insert shipment_events row (source = 'vendor', description auto-generated)
// 5. Mirror status on purchase_orders:
//    'shipped' / 'in_transit' / 'out_for_delivery' → po.status = 'in_progress'
//    'delivered' → po.status = 'delivered'
// 6. Notify company users of status change (Phase 28 stub)
// Returns: { shipment_id, new_status }
```

---

## Supabase Services Used

```
Supabase Database:
  - public.shipments          — one shipment record per PO
  - public.shipment_events    — event log per shipment
  - public.purchase_orders    — status mirrored from shipment transitions

Supabase Storage:
  - Not used in Phase 19

Supabase Edge Functions:
  - create-shipment           — creates shipment record on PO acceptance
  - update-shipment-status    — advances shipment status; logs event; mirrors to PO
```

---

## Folder Structure

```
src/
├── app/
│   ├── (company)/
│   │   └── procurement/
│   │       └── orders/
│   │           ├── page.tsx                        [Active orders / tracking list]
│   │           └── [poId]/
│   │               └── tracking/
│   │                   └── page.tsx                [Order timeline — company view]
│   └── (vendor)/
│       └── orders/
│           └── [poId]/
│               └── shipment/
│                   └── page.tsx                    [Vendor: manage shipment]
└── components/
    └── modules/
        └── order-tracking/
            ├── order-timeline.tsx
            ├── shipment-status-stepper.tsx
            ├── shipment-update-form.tsx
            ├── shipment-details-form.tsx
            ├── tracking-link-card.tsx
            └── index.ts
```

---

## UI Screens

### Screen 19.1 — Active Orders / Tracking List — Company (`/company/procurement/orders`)

`PageHeader`: title "Order Tracking".

**KPI row** (4 cards):
| KPI Card | Value |
|---|---|
| Active Orders | POs with status 'accepted' or 'in_progress' |
| Shipped | Shipments with status 'shipped' or 'in_transit' |
| Out for Delivery | Shipments with status 'out_for_delivery' |
| Overdue | Expected delivery < today and status != 'delivered' |

`DataTable` listing shipments with columns: PO number, vendor, title, courier, tracking number, status (badge), estimated delivery, actions (view timeline).

---

### Screen 19.2 — Order Timeline — Company (`/company/procurement/orders/[poId]/tracking`)

`PageHeader`: title "[PO Number] Tracking", breadcrumb Orders → [PO Number] → Tracking.

Two-panel layout:

**Left panel — Shipment Details:**
- Courier name, tracking number (clickable → tracking_url if present)
- Dispatch date, estimated delivery, actual delivery
- `ShipmentStatusStepper`: horizontal or vertical stepper showing all 7 statuses with current highlighted

**Right panel — Event Timeline:**
`OrderTimeline`: vertical timeline of all `shipment_events` in chronological order. Each event: timestamp, status badge, description, location (if provided), source badge (Vendor / System / Courier).

---

### Screen 19.3 — Vendor: Manage Shipment (`/vendor/orders/[poId]/shipment`)

`PageHeader`: title "[PO Number] — Manage Shipment", breadcrumb Orders → [PO Number] → Shipment.

Three sections:

1. **Shipment Status**: `ShipmentStatusStepper` (current status highlighted). "Update Status" button.
2. **Shipping Details**: `ShipmentDetailsForm` — courier name, tracking number, tracking URL, dispatch date, estimated delivery, notes. "Save Details" button.
3. **Event History**: read-only `OrderTimeline`.

"Update Status" opens a Sheet with `ShipmentUpdateForm`.

---

## Components

### `OrderTimeline`

```typescript
interface OrderTimelineProps {
  events:    ShipmentEvent[]
  compact?:  boolean           // condensed display inside PO detail panel
}
```

Vertical timeline using the `Timeline` component from Phase 2. Each event node shows: timestamp (relative + absolute on hover), status badge, description text, location (if set), source badge (Vendor / System / Courier — different colours). Empty state: "No tracking events yet."

### `ShipmentStatusStepper`

```typescript
interface ShipmentStatusStepperProps {
  currentStatus: ShipmentStatus
  orientation?:  'horizontal' | 'vertical'
}
```

Renders the 6 active statuses in order: Processing → Packed → Shipped → In Transit → Out for Delivery → Delivered. Current status is highlighted with a filled circle. Completed steps show a check mark. Future steps are grey. Cancelled state replaces all steps with a single red "Cancelled" indicator.

### `ShipmentUpdateForm`

```typescript
interface ShipmentUpdateFormProps {
  currentStatus: ShipmentStatus
  onSubmit:      (data: ShipmentUpdateData) => Promise<void>
  onCancel:      () => void
  isLoading?:    boolean
}
```

A Sheet form. Status select (only valid next statuses shown — forward-only). Description textarea. Location input (optional). "Update" submit button. Calls `update-shipment-status` Edge Function.

### `ShipmentDetailsForm`

```typescript
interface ShipmentDetailsFormProps {
  defaultValues?: Partial<ShipmentDetails>
  onSubmit:       (data: ShipmentDetails) => Promise<void>
  isLoading?:     boolean
}
```

Fields: courier_name, tracking_number, tracking_url, dispatch_date (date picker), estimated_delivery (date picker), notes. "Save Details" button. Direct client mutation to `shipments` table.

### `TrackingLinkCard`

```typescript
interface TrackingLinkCardProps {
  courier?:       string
  trackingNumber?: string
  trackingUrl?:   string
}
```

Small card showing courier name + tracking number. If `trackingUrl` is set, renders a "Track on courier website →" external link. If not set, shows tracking number as plain text. Empty state: "Tracking information not yet provided."

---

## Forms

### Form 19.1 — Shipment Update Form

| Field | Type | Validation |
|---|---|---|
| New status | select | Required; only valid next statuses shown |
| Description | textarea | Required, min 5 chars, max 500 chars |
| Location | text input | Optional, max 100 chars |

```typescript
const shipmentUpdateSchema = z.object({
  new_status:  z.enum(['processing','packed','shipped','in_transit','out_for_delivery','delivered']),
  description: z.string().min(5).max(500),
  location:    z.string().max(100).optional(),
})
```

---

### Form 19.2 — Shipment Details Form

| Field | Type | Validation |
|---|---|---|
| Courier name | text input | Optional, max 100 chars |
| Tracking number | text input | Optional, max 100 chars |
| Tracking URL | URL input | Optional; must be a valid URL if provided |
| Dispatch date | date picker | Optional, max = today |
| Estimated delivery | date picker | Optional, must be >= dispatch date |
| Notes | textarea | Optional, max 500 chars |

```typescript
const shipmentDetailsSchema = z.object({
  courier_name:        z.string().max(100).optional(),
  tracking_number:     z.string().max(100).optional(),
  tracking_url:        z.string().url().optional().or(z.literal('')),
  dispatch_date:       z.date().max(new Date()).optional().nullable(),
  estimated_delivery:  z.date().optional().nullable(),
  notes:               z.string().max(500).optional(),
})
```

---

## Tables

### Shipments Table (Company — Order Tracking List)

| Column | Sortable | Filterable |
|---|---|---|
| PO Number | No | Yes (search) |
| Vendor | No | Yes |
| Title | Yes | Yes (search) |
| Courier | No | No |
| Tracking Number | No | No |
| Status | Yes | Yes (multi-select) |
| Est. Delivery | Yes | Yes (date range) |
| Actions | No | No |

---

## Permissions

```
View order tracking (company):
  - All company members can view tracking for their company's shipments

Update shipment status:
  - Vendor user only; vendor_id must match shipment.vendor_id
  - Permission enforced in update-shipment-status Edge Function

Update shipment details (courier, tracking info):
  - Vendor user; same vendor_id gate

View shipment events:
  - Company: all company members
  - Vendor: vendor_user for own shipments

No write access for company on shipments:
  - Company cannot update shipment status — only the vendor drives fulfillment
```

---

## Validation Rules

```
Status transitions (forward-only, vendor-driven):
  processing → packed
  packed → shipped
  shipped → in_transit
  in_transit → out_for_delivery
  out_for_delivery → delivered
  Any status → cancelled (only by system on PO cancellation)

  Skipping steps is NOT allowed (e.g., processing → delivered directly is rejected).
  Backwards transitions are never allowed.

Tracking URL:
  - Must be a valid HTTPS URL if provided
  - Max length 500 chars
  - No validation of the URL content (not fetched by the server)

Dispatch date:
  - Cannot be in the future (you cannot have dispatched something tomorrow)
  - If provided, estimated_delivery must be >= dispatch_date

Estimated delivery vs. actual delivery:
  - actual_delivery is set automatically when status transitions to 'delivered'
  - actual_delivery = now()::date at the time of the 'delivered' status update
```

---

## Business Rules

```
BR-19.1  A shipment record is created automatically when a vendor accepts a PO
         (respond-to-po Edge Function creates the shipment with status = 'processing').
         Vendors do not manually create shipment records.

BR-19.2  Status transitions are vendor-driven and forward-only. The system never
         automatically advances the shipment status except for the 'processing'
         status at PO acceptance. Cancellation of the parent PO sets the
         shipment to 'cancelled' (system-driven).

BR-19.3  PO status mirrors the shipment status for the company's high-level view:
         - Shipment in 'shipped', 'in_transit', 'out_for_delivery' → PO status = 'in_progress'
         - Shipment 'delivered' → PO status = 'delivered'
         This mirror is updated inside the update-shipment-status Edge Function.

BR-19.4  Every status change creates a shipment_events row. The event description
         is auto-generated from a template if the vendor does not provide a custom
         one. Example: "Order status updated to Packed."

BR-19.5  Tracking URL is informational only. The platform does not integrate with
         courier APIs in v1. Vendors enter tracking details manually. Phase 31
         can add courier API integrations.

BR-19.6  When a shipment reaches 'delivered' status, the company is prompted to
         create a Goods Receipt Note (GRN) — Phase 20. The PO detail page shows
         a "Create GRN" CTA once shipment status = 'delivered'.
```

---

## Security

```
- Shipment RLS: vendor_id = get_my_vendor_id() on all vendor writes.
  A vendor cannot update another vendor's shipment.

- Company cannot write to shipments table. They are read-only consumers of
  fulfillment data provided by the vendor.

- shipment_events: vendor can insert events for own shipments only.
  Event source 'system' events are inserted by Edge Functions using service role.

- Tracking URL is stored as text and rendered as an anchor tag with
  rel="noopener noreferrer" to prevent tab-napping attacks via external courier sites.

- update-shipment-status validates the status transition server-side before
  inserting the event. A vendor cannot skip to 'delivered' from 'processing'
  by sending a direct API call.
```

---

## State Management

```typescript
// Shipment detail for a PO
export function useShipment(poId: string) {
  const supabase = useSupabase()
  return useQuery({
    queryKey: ['shipment', poId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shipments')
        .select('*, shipment_events(*)')
        .eq('po_id', poId)
        .order('created_at', { referencedTable: 'shipment_events', ascending: true })
        .maybeSingle()
      if (error) throw error
      return data
    },
    staleTime: 20 * 1000,   // 20 seconds — live tracking expectation
    refetchInterval: 60 * 1000,  // poll every 60 seconds on tracking page
  })
}

// Company: active shipments list
export function useActiveShipments(companyId: string) {
  const supabase = useSupabase()
  return useQuery({
    queryKey: ['shipments', 'active', companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shipments')
        .select('*, purchase_orders(po_number, title, vendors(name))')
        .eq('company_id', companyId)
        .not('status', 'in', '(delivered,cancelled)')
        .order('updated_at', { ascending: false })
      if (error) throw error
      return data ?? []
    },
    staleTime: 30 * 1000,
  })
}
```

The tracking page uses `refetchInterval` to poll for new events since vendors update from their own workspace. No WebSocket subscription in v1 — polling is sufficient for procurement-pace updates.

---

## Development Tasks

### Task 19.1 — Migration
Apply migration `0022_create_shipments.sql`. Verify `shipments`, `shipment_events` tables and RLS. Regenerate `database.ts` types.

### Task 19.2 — Auto-Create Shipment on PO Acceptance
Extend `respond-to-po` Edge Function (Phase 18) to insert a `shipments` row with status = 'processing' and a first `shipment_events` row ("Order confirmed and processing begun") when action = 'accept'.

### Task 19.3 — ShipmentStatusStepper and OrderTimeline
Implement both components. Test with each of the 7 statuses. Test `compact` prop of `OrderTimeline` for use in PO detail page sidebar.

### Task 19.4 — update-shipment-status Edge Function
Implement with forward-only transition validation, event insertion, and PO status mirror. Test all valid transitions. Test that skipping statuses is rejected.

### Task 19.5 — Vendor Shipment Management Page
Implement `/vendor/orders/[poId]/shipment/page.tsx`. Render status stepper, details form, event history. Wire "Update Status" to `update-shipment-status`. Wire "Save Details" to direct mutation.

### Task 19.6 — Company Order Tracking List Page
Implement `/company/procurement/orders/page.tsx` with KPI cards and `DataTable` of active shipments.

### Task 19.7 — Company Order Timeline Page
Implement `/company/procurement/orders/[poId]/tracking/page.tsx`. Render `ShipmentStatusStepper`, `TrackingLinkCard`, `OrderTimeline`. Wire `refetchInterval` for live updates.

### Task 19.8 — PO Detail Navigation
Add "View Tracking" button/link to company and vendor PO detail pages (Phase 18 screens) when a shipment exists.

---

## Testing Checklist

```
✓ Migration 0022: shipments, shipment_events tables and RLS active
✓ Shipment auto-created when vendor accepts PO (status = 'processing', first event inserted)
✓ RLS: company can only read shipments for own company_id
✓ RLS: vendor can only read/write shipments for own vendor_id
✓ RLS: company cannot update shipments (insert/update returns permission denied)
✓ Status update: processing → packed valid; packed → processing rejected (backward)
✓ Status update: processing → shipped rejected (skip a step)
✓ Status update: all valid forward transitions produce shipment_events rows
✓ PO status mirror: in_progress set when shipped; delivered set when delivered
✓ Shipment details: courier, tracking number, tracking URL saved correctly
✓ Tracking URL rendered as external link with rel="noopener noreferrer"
✓ ShipmentStatusStepper: correct step highlighted for each status
✓ OrderTimeline: events displayed in chronological order
✓ KPI 'Overdue': correct count based on estimated_delivery < today
✓ refetchInterval: tracking page polls and reflects new events without manual refresh
✓ pnpm build: no TypeScript errors; pnpm lint: zero warnings
```

---

## Acceptance Criteria

```
AC-19.1  Migration 0022 applied; shipments and shipment_events tables active with RLS
AC-19.2  Shipment auto-created when vendor accepts PO
AC-19.3  Vendor can advance shipment through all statuses via ShipmentUpdateForm
AC-19.4  Status transitions are forward-only; backward and skip transitions rejected
AC-19.5  Every status change creates a shipment_events row
AC-19.6  PO status mirrors shipment status correctly (in_progress / delivered)
AC-19.7  Company sees live shipment status and timeline on tracking page
AC-19.8  Company tracking page polls for updates every 60 seconds
AC-19.9  RLS: company cannot write to shipments; vendor cannot write other vendor's shipments
```

---

## Definition of Done

Phase 19 is complete when all Acceptance Criteria above are met AND:

- [ ] All TypeScript checks pass (zero errors)
- [ ] All ESLint checks pass (zero warnings)
- [ ] Migration 0022 applied and committed; `database.ts` regenerated
- [ ] `update-shipment-status` Edge Function deployed; transition validation tested
- [ ] respond-to-po (Phase 18) updated to auto-create shipment on PO acceptance
- [ ] 60-second polling on tracking page verified in browser
- [ ] RLS: company write attempt returns permission denied; confirmed in test
- [ ] PR merged to `develop` with at least 1 reviewer approval
- [ ] `feature/19-order-tracking` branch merged and deleted

---

## Risk Factors

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Vendor forgets to update status; company has stale tracking | High | Low | Phase 28 will add reminder notifications for stale shipments; not in scope for Phase 19 |
| Polling causes excessive Supabase read load at scale | Low | Low | Polling only active on the tracking page (not the list); limit to authenticated users; no anonymous polling |
| PO status mirror getting out of sync with shipment status | Low | Medium | Mirror is set atomically in the same update-shipment-status transaction; no separate sync job needed |
| Tracking URL pointing to malicious site | Low | Low | Render as external link with `rel="noopener noreferrer"`; no iframe embed; no URL validation beyond format |

---

## Best Practices

- Auto-create the shipment record at PO acceptance time, not as a separate vendor action — vendors should not need to manually create a shipment record
- Enforce status transitions server-side in the Edge Function, not just at the UI layer — direct API calls cannot skip steps
- Use polling (not WebSockets) for tracking updates in v1 — Supabase Realtime subscription overhead is not justified at procurement-pace update frequency
- Keep `shipment_events.description` auto-generated from templates to ensure event log consistency — allow vendor to override the description, but never leave it blank
- Mirror the PO status from the shipment status rather than managing two independent status fields — single source of truth is the shipment status

---

## Estimated Completion

**3–4 working days.** The status stepper and timeline components are the main UI work. The `update-shipment-status` Edge Function with transition validation is the core logic piece. The polling pattern is a one-line addition to the query hook and does not require significant effort.

---

---

# PHASE 20 — GOODS RECEIPT (GRN)

---

## Overview

| Field | Value |
|---|---|
| Phase Number | 20 |
| Phase Name | Goods Receipt (GRN) |
| Milestone | M4 — Procurement Lifecycle |
| PRD Reference | Module 25 — Goods Receipt (GRN) |
| DESIGN Reference | Section 3 (Company — Procurement — GRN), F01, F03 |
| Estimated Duration | 3–4 days |
| Prerequisite Phases | Phase 19 (Order Tracking — shipment status = 'delivered') |

---

## Purpose

Phase 20 implements the Goods Receipt Note (GRN) workflow — the formal confirmation by the company that ordered goods have been received, inspected, and accepted (fully or partially). The GRN records quantities actually received, identifies damaged or short-delivered items, attaches inspection evidence, and closes the delivery phase of the PO lifecycle. Upon GRN confirmation, inventory is updated (quantity_on_hand decremented for dispatched items, quantity_reserved released), and the PO transitions to 'closed' — unlocking the invoicing phase in Phase 21.

---

## Business Goal

Without a formal receipt confirmation step, disputes arise over whether goods were delivered, in what condition, and in what quantity. The GRN creates an indisputable, timestamped record of what was physically received. It is also the trigger for the payment obligation: a company should never pay an invoice without a matching GRN. Phase 20 closes the physical delivery loop and hands off a clean, verified receipt record to the finance team for invoice processing in Phase 21.

---

## Dependencies

- Phase 19 complete (`shipments` table; shipment status = 'delivered')
- Phase 18 complete (`purchase_orders`, `po_items` tables)
- Phase 14 complete (`inventory` — GRN triggers quantity updates)
- Phase 2 `DataTable`, `PageHeader`, `KPICard`, `StatusBadge`, `Sheet` components

---

## Database Tables

Migration: `0023_create_grns.sql`

```sql
-- ============================================================
-- Migration: 0023_create_grns
-- Description: Goods Receipt Note (GRN) workflow
-- ============================================================

create table public.grns (
  id              uuid primary key default gen_random_uuid(),
  po_id           uuid not null references public.purchase_orders(id) on delete cascade,
  shipment_id     uuid not null references public.shipments(id),
  company_id      uuid not null references public.companies(id),
  vendor_id       uuid not null references public.vendors(id),
  grn_number      text not null,          -- GRN-{YYYY}-{seq}
  status          text not null default 'draft'
                    check (status in (
                      'draft',       -- GRN created; not yet confirmed
                      'confirmed',   -- GRN confirmed; PO closed; invoicing unlocked
                      'partial',     -- some items received; pending re-delivery for remainder
                      'rejected'     -- full rejection; goods returned to vendor
                    )),
  receipt_date    date not null default current_date,
  received_by     uuid not null references public.profiles(id),
  inspection_notes text,
  confirmed_at    timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint grn_po_unique unique (po_id)   -- one GRN per PO
);

create unique index idx_grn_number_company on public.grns(company_id, grn_number);
create index idx_grns_company_id on public.grns(company_id);
create index idx_grns_vendor_id  on public.grns(vendor_id);
create index idx_grns_po_id      on public.grns(po_id);
create index idx_grns_status     on public.grns(status);

create trigger trg_grns_updated_at
  before update on public.grns
  for each row execute function public.handle_updated_at();

-- GRN line items — one per po_item
create table public.grn_items (
  id                uuid primary key default gen_random_uuid(),
  grn_id            uuid not null references public.grns(id) on delete cascade,
  po_item_id        uuid not null references public.po_items(id),
  product_id        uuid references public.products(id) on delete set null,
  item_name         text not null,
  quantity_ordered  numeric(12,3) not null,
  quantity_received numeric(12,3) not null default 0 check (quantity_received >= 0),
  quantity_accepted numeric(12,3) not null default 0 check (quantity_accepted >= 0),
  quantity_rejected numeric(12,3) not null default 0 check (quantity_rejected >= 0),
  unit_of_measure   text not null,
  rejection_reason  text,
  condition         text not null default 'good'
                      check (condition in ('good','damaged','partial','wrong_item')),
  sort_order        integer not null default 0,
  created_at        timestamptz not null default now(),
  constraint grn_item_quantities check (
    quantity_received = quantity_accepted + quantity_rejected
  )
);

create index idx_grn_items_grn_id     on public.grn_items(grn_id);
create index idx_grn_items_po_item_id on public.grn_items(po_item_id);

-- GRN inspection attachments (photos of received goods)
create table public.grn_attachments (
  id           uuid primary key default gen_random_uuid(),
  grn_id       uuid not null references public.grns(id) on delete cascade,
  file_name    text not null,
  file_url     text not null,
  file_size    integer,
  uploaded_by  uuid references public.profiles(id),
  created_at   timestamptz not null default now()
);

create index idx_grn_attachments_grn_id on public.grn_attachments(grn_id);

-- RLS
alter table public.grns             enable row level security;
alter table public.grn_items        enable row level security;
alter table public.grn_attachments  enable row level security;

-- Company can read and write own GRNs
create policy "grns_company_rw"
  on public.grns for all
  using (company_id = public.get_my_company_id());

-- Vendor can read GRNs for their POs (for invoice context — Phase 21)
create policy "grns_vendor_read"
  on public.grns for select
  using (
    vendor_id = public.get_my_vendor_id()
    and status in ('confirmed','partial','rejected')
  );

-- GRN items: follow GRN access
create policy "grn_items_company_rw"
  on public.grn_items for all
  using (
    exists (
      select 1 from public.grns g
      where g.id = grn_items.grn_id
        and g.company_id = public.get_my_company_id()
    )
  );

create policy "grn_items_vendor_read"
  on public.grn_items for select
  using (
    exists (
      select 1 from public.grns g
      where g.id = grn_items.grn_id
        and g.vendor_id = public.get_my_vendor_id()
        and g.status in ('confirmed','partial','rejected')
    )
  );

create policy "grn_attachments_company_rw"
  on public.grn_attachments for all
  using (
    exists (
      select 1 from public.grns g
      where g.id = grn_attachments.grn_id
        and g.company_id = public.get_my_company_id()
    )
  );

create policy "grn_attachments_vendor_read"
  on public.grn_attachments for select
  using (
    exists (
      select 1 from public.grns g
      where g.id = grn_attachments.grn_id
        and g.vendor_id = public.get_my_vendor_id()
        and g.status in ('confirmed','partial')
    )
  );
```

---

## Relationships

```
public.purchase_orders (1)
  └── public.grns (1)                    — one GRN per PO
        ├── public.grn_items (N)         — one per po_item
        └── public.grn_attachments (N)   — inspection photos

public.grns
  └── referenced by public.invoices (Phase 21) — invoice raised against confirmed GRN

Inventory impact on GRN confirmation:
  grn_items.quantity_accepted → inventory.quantity_on_hand -= quantity_accepted (shipped out)
  grn_items.quantity_accepted → inventory.quantity_reserved -= quantity_accepted (reservation fulfilled)
  grn_items.quantity_rejected → inventory.quantity_reserved -= quantity_rejected (reservation released)
  Both produce inventory_movements rows ('shipped' and 'unreserved' respectively)
```

---

## API Endpoints

| Operation | Method | Implementation | Notes |
|---|---|---|---|
| Get GRN for PO | Server Component | `supabase.from('grns').select('*, grn_items(*), grn_attachments(*)')` | Company-scoped |
| Create GRN draft | Edge Function | `create-grn` | Pre-fills grn_items from po_items |
| Update GRN item quantities | Client mutation | `supabase.from('grn_items').update({ quantity_received, quantity_accepted, quantity_rejected, condition })` | Company only |
| Confirm GRN | Edge Function | `confirm-grn` | Updates inventory; sets po.status = 'closed'; sets grn.status = 'confirmed' |
| Mark partial receipt | Edge Function | `confirm-grn` | Same; sets grn.status = 'partial'; PO remains open pending re-delivery |
| Upload GRN attachment | Client | `supabase.storage.from('grn-attachments').upload()` + insert metadata | |
| List GRNs (company) | Server Component | `supabase.from('grns').select('*, purchase_orders(po_number)')` | Company-scoped |
| List GRNs (vendor) | Server Component | `supabase.from('grns').select('*, purchase_orders(po_number), companies(name)')` | Vendor sees confirmed/partial GRNs only |

**`supabase/functions/confirm-grn/index.ts`** (key logic):

```typescript
// 1. Authenticate company user; verify grn.company_id = get_my_company_id()
// 2. Verify grn.status = 'draft'
// 3. Load all grn_items; compute total accepted and rejected
// 4. For each grn_item with product_id:
//    a. Insert inventory_movements: type = 'shipped', quantity_change = -quantity_accepted
//    b. Update inventory: quantity_on_hand -= quantity_accepted
//    c. Insert inventory_movements: type = 'unreserved', quantity_change = -(quantity_accepted + quantity_rejected)
//    d. Update inventory: quantity_reserved -= (quantity_accepted + quantity_rejected)
// 5. Determine GRN status:
//    - If all items fully accepted → grn.status = 'confirmed'
//    - If any item has quantity_received < quantity_ordered → grn.status = 'partial'
//    - If all items rejected → grn.status = 'rejected'
// 6. Update PO status:
//    - 'confirmed' → po.status = 'closed'
//    - 'partial' → po.status remains 'delivered' (awaiting re-delivery)
//    - 'rejected' → po.status = 'cancelled'
// 7. Notify vendor of GRN outcome (Phase 28 stub)
// Returns: { grn_id, status, inventory_updated: true }
```

---

## Supabase Services Used

```
Supabase Database:
  - public.grns                — GRN records
  - public.grn_items           — per-item acceptance/rejection
  - public.grn_attachments     — inspection photos metadata
  - public.inventory           — quantity_on_hand and quantity_reserved updated
  - public.inventory_movements — 'shipped' and 'unreserved' movements logged
  - public.purchase_orders     — status updated to 'closed' or 'cancelled'

Supabase Storage:
  - grn-attachments bucket     — private; stores photos of received goods
  - Path: grn-attachments/[company_id]/[grn_id]/[file_id].[ext]

Supabase Edge Functions:
  - create-grn                 — creates GRN draft with pre-filled items
  - confirm-grn                — processes receipt; updates inventory and PO
```

---

## Folder Structure

```
src/
├── app/
│   └── (company)/
│       └── procurement/
│           └── grns/
│               ├── page.tsx                        [GRN list page]
│               ├── new/
│               │   └── page.tsx                    [Create GRN from PO]
│               └── [id]/
│                   └── page.tsx                    [GRN detail / confirm]
└── components/
    └── modules/
        └── grn/
            ├── grn-form.tsx
            ├── grn-items-editor.tsx
            ├── grn-status-badge.tsx
            ├── grn-detail.tsx
            ├── grn-attachment-uploader.tsx
            └── index.ts
```

---

## UI Screens

### Screen 20.1 — GRNs List (`/company/procurement/grns`)

`PageHeader`: title "Goods Receipt Notes", action "New GRN".

**KPI row** (4 cards):
| KPI Card | Value |
|---|---|
| Total GRNs | All confirmed + partial |
| Pending Review | status = 'draft' |
| Confirmed | status = 'confirmed' |
| Partial / Rejected | status = 'partial' + 'rejected' |

`DataTable` listing GRNs. Columns: GRN number, PO number, vendor, receipt date, received by, status, actions.

---

### Screen 20.2 — Create GRN (`/company/procurement/grns/new?poId=[id]`)

`PageHeader`: title "Create Goods Receipt Note", breadcrumb GRNs → New.

Two-section layout:

**Section 1 — GRN Header:**
- PO number and title (read-only)
- Receipt date (date picker, default today)
- Received by (auto-populated from current user; editable dropdown of company employees)
- Inspection notes (textarea)

**Section 2 — GRN Items Editor** (`GRNItemsEditor`):

Pre-populated from `po_items`. Editable table with columns:

| Column | Editable |
|---|---|
| Item name | No (read-only) |
| Quantity ordered | No (read-only) |
| Quantity received | Yes (number input) |
| Quantity accepted | Yes (number input; must be ≤ quantity received) |
| Quantity rejected | Yes (number input; must be ≤ quantity received) |
| Condition | Yes (select: good / damaged / partial / wrong_item) |
| Rejection reason | Yes (textarea; required when quantity_rejected > 0) |

Validation enforced client-side and server-side: `quantity_received = quantity_accepted + quantity_rejected`.

"Upload Photos" button opens `GRNAttachmentUploader`.

"Save as Draft" and "Confirm Receipt" footer actions. "Confirm" triggers `confirm-grn` Edge Function.

---

### Screen 20.3 — GRN Detail (`/company/procurement/grns/[id]`)

`PageHeader`: title "[GRN Number] — [PO Title]", status badge.

Four panels:

1. **GRN Summary**: PO number (link), vendor name, receipt date, received by, status, confirmed at timestamp.
2. **Items Received**: read-only `GRNItemsTable` showing all items with acceptance/rejection quantities and condition. Rejected items highlighted with red background.
3. **Inspection Photos**: grid of `grn_attachments` with download links and lightbox preview.
4. **Inspection Notes**: read-only textarea.

If status = 'draft': "Edit GRN" and "Confirm Receipt" buttons shown. If status = 'confirmed': "Download GRN PDF" (Phase 21 wires the PDF generation).

---

## Components

### `GRNItemsEditor`

```typescript
interface GRNItemsEditorProps {
  items:     GRNItem[]
  onChange:  (items: GRNItem[]) => void
  readOnly?: boolean
}
```

Editable table pre-populated from PO items. Each row: quantity_ordered (read-only), quantity_received (input), quantity_accepted (input), quantity_rejected (computed as received - accepted, or direct input). `condition` select dropdown. `rejection_reason` textarea that reveals when quantity_rejected > 0. Client-side validation: quantity_accepted + quantity_rejected must equal quantity_received.

### `GRNStatusBadge`

```typescript
interface GRNStatusBadgeProps {
  status: 'draft' | 'confirmed' | 'partial' | 'rejected'
}
```

Status colour map:
- `draft` → grey
- `confirmed` → green
- `partial` → amber
- `rejected` → red

### `GRNForm`

```typescript
interface GRNFormProps {
  poId:           string
  poItems:        POItem[]
  defaultValues?: Partial<GRNFormData>
  onSubmit:       (data: GRNFormData, action: 'draft' | 'confirm') => Promise<void>
  isLoading?:     boolean
}
```

Composes the header fields form with `GRNItemsEditor`. "Save as Draft" calls `create-grn` (upsert for re-edits). "Confirm Receipt" calls `confirm-grn` Edge Function after client-side validation passes.

### `GRNAttachmentUploader`

Same pattern as `PRAttachmentUploader` from Phase 15. Uploads to `grn-attachments` private bucket. Allows image previews in the uploader. Max 20 files per GRN (inspection photos can be numerous).

### `GRNDetail`

```typescript
interface GRNDetailProps {
  grn:        GRN
  grnItems:   GRNItem[]
  attachments: GRNAttachment[]
}
```

Read-only detail view composing all four panels. Used in both the company GRN detail page and (for vendor read access) in the invoice context in Phase 21.

---

## Forms

### Form 20.1 — GRN Header Form

| Field | Type | Validation |
|---|---|---|
| Receipt date | date picker | Required, max today |
| Received by | employee select | Required; defaults to current user |
| Inspection notes | textarea | Optional, max 2000 chars |

```typescript
const grnHeaderSchema = z.object({
  receipt_date:     z.date().max(new Date()),
  received_by:      z.string().uuid(),
  inspection_notes: z.string().max(2000).optional(),
})
```

---

### Form 20.2 — GRN Item Row

| Field | Type | Validation |
|---|---|---|
| Quantity received | number input | Required, 0–quantity_ordered, up to 3 decimal places |
| Quantity accepted | number input | Required, 0–quantity_received |
| Quantity rejected | number input | Auto-computed; editable; accepted + rejected must equal received |
| Condition | select | Required; values: good, damaged, partial, wrong_item |
| Rejection reason | textarea | Required when quantity_rejected > 0; min 10 chars |

```typescript
const grnItemSchema = z.object({
  po_item_id:        z.string().uuid(),
  quantity_received: z.number().min(0),
  quantity_accepted: z.number().min(0),
  quantity_rejected: z.number().min(0),
  condition:         z.enum(['good','damaged','partial','wrong_item']),
  rejection_reason:  z.string().max(500).optional(),
}).refine(d => d.quantity_accepted + d.quantity_rejected === d.quantity_received, {
  message: 'Accepted + rejected must equal received quantity',
})
```

---

## Tables

### GRNs List Table

| Column | Sortable | Filterable |
|---|---|---|
| GRN Number | Yes | Yes (search) |
| PO Number | No | Yes (search) |
| Vendor | No | Yes |
| Receipt Date | Yes | Yes (date range) |
| Received By | No | Yes (employee select) |
| Status | Yes | Yes (multi-select) |
| Actions | No | No |

---

### GRN Items Table (read-only in detail view)

| Column | Sortable | Filterable |
|---|---|---|
| Item name | No | No |
| Ordered | No | No |
| Received | No | No |
| Accepted | No | No |
| Rejected | No | No |
| Condition | No | No |
| Rejection reason | No | No |

Rejected rows rendered with a red row highlight.

---

## Permissions

```
Create GRN:
  - Permission: has_permission('grns', 'create')
  - Roles: Procurement Officer, Procurement Manager

Confirm GRN:
  - Permission: has_permission('grns', 'confirm')
  - Roles: Procurement Manager only

View GRN (company):
  - All company members can view GRNs for their company

View GRN (vendor):
  - Vendor can read GRNs with status 'confirmed', 'partial', or 'rejected' for their POs
  - Vendor cannot read draft GRNs
  - Used for context when generating invoices in Phase 21

Upload/Delete attachments:
  - Same permissions as Create GRN (Procurement Officer and above)
```

---

## Validation Rules

```
GRN creation:
  - PO must have status = 'delivered' (shipment has reached vendor)
  - One GRN per PO enforced by unique constraint on grns(po_id)

GRN items:
  - quantity_received must be <= quantity_ordered
  - quantity_accepted + quantity_rejected must equal quantity_received (DB constraint)
  - quantity_accepted must be >= 0
  - quantity_rejected must be >= 0
  - If quantity_rejected > 0, rejection_reason is required (min 10 chars)
  - condition must be from the allowed list

GRN confirmation:
  - All grn_items must have quantity_received populated (no null values)
  - GRN status must be 'draft'
  - Inventory must have quantity_reserved >= quantity being released
    (should always be true if PO reservation was correct; check defensively)

Attachments:
  - Max 20 files per GRN
  - Max 20 MB per file
  - Allowed types: JPG, PNG, HEIC (inspection photos), PDF (inspection report)
```

---

## Business Rules

```
BR-20.1  A GRN can only be created when the shipment for that PO has reached
         status = 'delivered'. The "Create GRN" button on the PO detail page
         is enabled only when this condition is true.

BR-20.2  GRN confirmation determines the PO's final lifecycle status:
         - Full receipt (all items accepted) → PO.status = 'closed'
         - Partial receipt (any item partially received) → GRN.status = 'partial';
           PO.status remains 'delivered'. The remainder may be re-delivered and
           a separate resolution tracked in Phase 21 notes.
         - Full rejection → GRN.status = 'rejected'; PO.status = 'cancelled'.

BR-20.3  Inventory is updated on GRN confirmation only — not at delivery.
         Delivery (shipment status = 'delivered') is a logistics event.
         GRN confirmation is the formal acceptance event that updates inventory.

BR-20.4  Quantity accepted reduces the vendor's inventory (quantity_on_hand decremented)
         and releases the reservation (quantity_reserved decremented) because the
         items have left the vendor's warehouse.

BR-20.5  Rejected items release the reservation (quantity_reserved decremented)
         but do not reduce quantity_on_hand — the goods are being returned and
         will be back in stock (the vendor handles the physical return separately).

BR-20.6  The confirmed GRN is the authoritative receipt document. It unlocks
         invoice generation in Phase 21. A vendor cannot generate an invoice
         for a PO without a confirmed or partial GRN.

BR-20.7  Partial GRNs do not block invoicing. The vendor can invoice for the
         accepted quantity. The remainder, if not re-delivered, is tracked in
         the PO's notes and the company decides whether to issue a new PO.
```

---

## Security

```
- GRN is company-internal data. Vendors can only read confirmed/partial/rejected GRNs
  for their POs (to know what was accepted for invoicing context).
  Draft GRNs are invisible to vendors (RLS: status not in ('confirmed','partial','rejected')).

- confirm-grn verifies company_id from JWT before proceeding.
  A company cannot confirm a GRN for another company's PO.

- Inventory updates inside confirm-grn use service role to ensure atomicity
  across inventory and GRN tables.

- GRN attachment files are in a private bucket. Access is via signed URLs only.
  URLs expire after 2 hours. Inspection photos may contain proprietary information
  (product photos, serial numbers).

- The DB constraint grn_item_quantities ensures accepted + rejected = received
  at the database level, not just application level. This prevents data
  inconsistency from API calls that bypass the UI.
```

---

## State Management

```typescript
// GRN list for company
export function useCompanyGRNs(companyId: string) {
  const supabase = useSupabase()
  return useQuery({
    queryKey: ['grns', companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('grns')
        .select('*, purchase_orders(po_number, title), vendors(name)')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data ?? []
    },
    staleTime: 30 * 1000,
  })
}

// Single GRN detail
export function useGRN(grnId: string) {
  const supabase = useSupabase()
  return useQuery({
    queryKey: ['grn', grnId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('grns')
        .select(`
          *,
          purchase_orders(po_number, title, vendors(name, logo_url)),
          grn_items(*, po_items(item_name, quantity)),
          grn_attachments(*)
        `)
        .eq('id', grnId)
        .single()
      if (error) throw error
      return data
    },
    staleTime: 15 * 1000,
  })
}
```

After `confirm-grn` succeeds, invalidate `['grns', companyId]`, `['grn', grnId]`, `['purchase-order', poId]`, `['inventory', 'overview', vendorId]`, and `['inventory', 'product', productId]` for each product in the GRN to reflect the inventory changes.

---

## Development Tasks

### Task 20.1 — Migration
Apply migration `0023_create_grns.sql`. Verify `grns`, `grn_items`, `grn_attachments` tables, unique constraints, DB check constraint, and RLS. Regenerate `database.ts` types.

### Task 20.2 — create-grn Edge Function
Implement: verify PO status = 'delivered'; generate GRN number; insert `grns` row; insert `grn_items` pre-populated from `po_items` with `quantity_received = 0`. Test that creating a second GRN for the same PO returns a conflict error.

### Task 20.3 — GRNItemsEditor Component
Implement the editable table. Inline validation: accepted + rejected = received. Show rejection_reason textarea when quantity_rejected > 0. Auto-compute rejected when accepted is entered (rejected = received - accepted). Test with partial quantities.

### Task 20.4 — Create GRN Page
Implement `/company/procurement/grns/new?poId=` page. Pre-fill header (PO info, receipt date, received by). Wire `create-grn` on page load to fetch or create the draft GRN. Wire "Confirm Receipt" to `confirm-grn`. Wire "Save as Draft" to update grn_items directly.

### Task 20.5 — confirm-grn Edge Function
Implement the full confirmation logic: inventory updates (shipped + unreserved movements), GRN status determination, PO status update. Test all three outcome paths (confirmed, partial, rejected). Test inventory balances after each.

### Task 20.6 — GRN Detail Page
Implement `/company/procurement/grns/[id]/page.tsx` with all four panels. Wire "Download GRN PDF" placeholder (wired to full implementation in Phase 21).

### Task 20.7 — GRN List Page
Implement `/company/procurement/grns/page.tsx` with KPI cards and GRN DataTable.

### Task 20.8 — GRN Attachment Uploader
Implement `GRNAttachmentUploader`. Upload to `grn-attachments` private bucket. Support multiple concurrent uploads. Image preview in uploader before upload.

### Task 20.9 — PO Detail Navigation
Add "Create GRN" button to company PO detail page (Phase 18 Screen 18.3) when po.status = 'delivered'. Add "View GRN" link when a GRN exists.

---

## Testing Checklist

```
✓ Migration 0023: grns, grn_items, grn_attachments, constraints, RLS active
✓ DB constraint: accepted + rejected = received enforced at DB level
✓ create-grn: blocked when PO status != 'delivered'
✓ create-grn: generates correct GRN number (GRN-{YYYY}-{seq})
✓ create-grn: grn_items pre-populated from po_items with quantity_received = 0
✓ Duplicate GRN: creating a second GRN for same PO returns conflict error
✓ GRNItemsEditor: accepted + rejected validation enforced client-side
✓ GRNItemsEditor: rejection_reason required when quantity_rejected > 0
✓ confirm-grn: full receipt → grn.status = 'confirmed', po.status = 'closed'
✓ confirm-grn: partial receipt → grn.status = 'partial', po.status = 'delivered'
✓ confirm-grn: full rejection → grn.status = 'rejected', po.status = 'cancelled'
✓ confirm-grn: inventory.quantity_on_hand decremented by quantity_accepted
✓ confirm-grn: inventory.quantity_reserved decremented by (accepted + rejected)
✓ confirm-grn: inventory_movements rows inserted (shipped + unreserved)
✓ Attachment upload: file stored in private grn-attachments bucket
✓ Signed URL: generates correctly; vendor cannot access attachment via signed URL (RLS check)
✓ Vendor read: vendor sees confirmed GRN; draft GRN returns empty (RLS)
✓ KPI cards: counts accurate after GRN confirmations
✓ pnpm build: no TypeScript errors; pnpm lint: zero warnings
```

---

## Acceptance Criteria

```
AC-20.1  Migration 0023 applied; grns, grn_items, grn_attachments tables active with RLS
AC-20.2  GRN created only for POs with status = 'delivered'; one GRN per PO enforced
AC-20.3  GRNItemsEditor pre-populates from PO items; validated accepted + rejected = received
AC-20.4  confirm-grn correctly sets GRN and PO statuses across all three outcome paths
AC-20.5  Inventory updated atomically on GRN confirmation: on_hand and reserved adjusted
AC-20.6  inventory_movements rows inserted for each shipped and unreserved item
AC-20.7  Draft GRN invisible to vendor via RLS; confirmed GRN readable by vendor
AC-20.8  Inspection photos upload to private bucket; accessible via signed URL
AC-20.9  KPI cards and GRN DataTable accurately reflect GRN statuses
```

---

## Definition of Done

Phase 20 is complete when all Acceptance Criteria above are met AND:

- [ ] All TypeScript checks pass (zero errors)
- [ ] All ESLint checks pass (zero warnings)
- [ ] Migration 0023 applied and committed; `database.ts` regenerated
- [ ] `create-grn` and `confirm-grn` Edge Functions deployed
- [ ] All three GRN confirmation outcomes tested (confirmed, partial, rejected)
- [ ] Inventory balances verified after each GRN confirmation path
- [ ] DB check constraint verified: accepted + rejected = received enforced at DB level
- [ ] Vendor RLS: draft GRN invisible; confirmed GRN readable; tested in isolation
- [ ] Attachment signed URL tested; expiry behaviour confirmed
- [ ] PR merged to `develop` with at least 1 reviewer approval
- [ ] `feature/20-goods-receipt` branch merged and deleted

---

## Risk Factors

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Inventory goes negative due to concurrent GRN confirmation and manual adjustment | Low | Medium | confirm-grn uses service role in a transaction; validate quantity_reserved >= release amount before applying |
| Two procurement officers confirming the same GRN simultaneously | Low | High | GRN unique constraint on po_id prevents a second GRN being created; the single draft GRN's status transition is guarded by status = 'draft' check in Edge Function |
| Vendor generating an invoice before GRN is confirmed | Medium | Medium | Invoice creation in Phase 21 checks grn.status in ('confirmed','partial') before allowing invoice generation |
| Inspection photos containing sensitive business data leaking to vendor | Low | Low | Signed URLs expire; vendor can only access attachments for their own confirmed GRNs; no direct bucket URL exposure |
| Partial GRN creates ambiguity about remaining open quantity | Medium | Low | Phase 21 notes field captures the partial receipt context; a formal partial-delivery re-PO flow is a Phase 31 enhancement |

---

## Best Practices

- Enforce `accepted + rejected = received` at both the application layer (Zod schema) and the database layer (CHECK constraint) — never rely on only one
- Wrap the entire GRN confirmation (GRN status, PO status, inventory updates, movement inserts) in a single Postgres function/transaction to guarantee atomicity
- Pre-populate GRN items from PO items at GRN creation time — do not use a live JOIN at confirmation time, as PO items could theoretically be modified (they should not be, but the copy makes the GRN immutable)
- Use a sequence for GRN numbers, not a max()+1 query — concurrent GRN creations in a company could produce duplicates with max()+1
- Keep rejection reason required when quantity_rejected > 0 — this creates an audit record of exactly what was wrong with the delivered goods, which is essential for vendor performance scoring in Phase 26

---

## Estimated Completion

**3–4 working days.** The `confirm-grn` Edge Function is the highest-complexity task due to the multi-table inventory updates. The GRNItemsEditor with its inline validation is the most intricate UI component. Prioritise the inventory atomicity in the Edge Function and the DB check constraint before building the UI.

---

---

**** END OF PART 4 ****


---

# PHASE 21 — INVOICE MANAGEMENT

---

## Overview

| Field | Value |
|---|---|
| Phase Number | 21 |
| Phase Name | Invoice Management |
| Milestone | M5 — Finance & Payments |
| PRD Reference | Module 26 — Invoice Management |
| DESIGN Reference | Section 3 (Vendor — Finance — Invoices, Company — Finance — Invoices), F01, F03 |
| Estimated Duration | 4–5 days |
| Prerequisite Phases | Phase 20 (GRN — confirmed receipt unlocks invoicing) |

---

## Purpose

Phase 21 implements the vendor invoice lifecycle. After a Goods Receipt Note is confirmed, the vendor generates a formal invoice against the delivered goods. The invoice captures line items, tax breakdowns (GST), total amounts, and payment terms. The company's finance team reviews and approves the invoice before it proceeds to payment in Phase 22. This phase covers invoice creation, PDF generation, email delivery, approval workflow, and status tracking on both the vendor and company sides.

---

## Business Goal

The invoice is the vendor's formal payment demand and the company's payment obligation trigger. Without a structured invoice system, payment disputes arise over amounts, tax breakdowns, and whether the invoice matches the PO and GRN. Phase 21 ensures every invoice is matched to a confirmed GRN, has a unique invoice number, includes accurate GST details, and is formally approved before any payment is authorised. This three-way match — PO, GRN, Invoice — is the foundation of compliant accounts payable.

---

## Dependencies

- Phase 20 complete (`grns` table — confirmed GRN unlocks invoicing)
- Phase 18 complete (`purchase_orders`, `po_items` — invoice is derived from PO)
- Phase 3 `invoices` storage bucket initialised
- Phase 2 `DataTable`, `PageHeader`, `KPICard`, `StatusBadge`, `Sheet`, `Timeline` components
- PDF generation: `@react-pdf/renderer` (same as Phase 18)
- Email: Resend (same as Phase 18)

---

## Database Tables

Migration: `0024_create_invoices.sql`

```sql
-- ============================================================
-- Migration: 0024_create_invoices
-- Description: Vendor invoice lifecycle
-- ============================================================

create table public.invoices (
  id               uuid primary key default gen_random_uuid(),
  vendor_id        uuid not null references public.vendors(id),
  company_id       uuid not null references public.companies(id),
  po_id            uuid not null references public.purchase_orders(id),
  grn_id           uuid not null references public.grns(id),
  invoice_number   text not null,          -- INV-{VENDOR_SEQ}-{YYYY}-{seq}
  status           text not null default 'draft'
                     check (status in (
                       'draft',      -- vendor building invoice
                       'submitted',  -- sent to company for approval
                       'approved',   -- finance approved; ready for payment
                       'rejected',   -- company rejected with reason
                       'paid',       -- payment completed (Phase 22)
                       'cancelled'   -- voided by vendor before submission
                     )),
  invoice_date     date not null default current_date,
  due_date         date not null,
  subtotal         numeric(15,2) not null default 0,
  tax_amount       numeric(15,2) not null default 0,
  discount_amount  numeric(15,2) not null default 0,
  total_amount     numeric(15,2) not null default 0,
  currency         text not null default 'INR',
  -- GST fields
  gstin_vendor     text,
  gstin_company    text,
  place_of_supply  text,
  -- Payment
  payment_terms    text,
  bank_details     jsonb,               -- { account_holder, account_number, ifsc, bank_name }
  notes            text,
  -- Approval
  approved_by      uuid references public.profiles(id),
  approved_at      timestamptz,
  rejection_reason text,
  rejected_by      uuid references public.profiles(id),
  rejected_at      timestamptz,
  -- Lifecycle
  submitted_at     timestamptz,
  paid_at          timestamptz,
  pdf_url          text,                -- stored in invoices bucket
  created_by       uuid not null references public.profiles(id),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  constraint invoice_po_unique unique (po_id)   -- one invoice per PO in v1
);

create unique index idx_invoice_number_vendor
  on public.invoices(vendor_id, invoice_number);
create index idx_invoices_vendor_id   on public.invoices(vendor_id);
create index idx_invoices_company_id  on public.invoices(company_id);
create index idx_invoices_po_id       on public.invoices(po_id);
create index idx_invoices_status      on public.invoices(status);
create index idx_invoices_due_date    on public.invoices(due_date);

create trigger trg_invoices_updated_at
  before update on public.invoices
  for each row execute function public.handle_updated_at();

-- Invoice line items (copied from GRN accepted quantities)
create table public.invoice_items (
  id               uuid primary key default gen_random_uuid(),
  invoice_id       uuid not null references public.invoices(id) on delete cascade,
  po_item_id       uuid references public.po_items(id) on delete set null,
  grn_item_id      uuid references public.grn_items(id) on delete set null,
  item_name        text not null,
  description      text,
  quantity         numeric(12,3) not null check (quantity > 0),
  unit_of_measure  text not null,
  unit_price       numeric(12,2) not null check (unit_price >= 0),
  tax_rate         numeric(5,2) not null default 0,
  tax_amount       numeric(12,2) not null default 0,
  cgst_rate        numeric(5,2) not null default 0,
  sgst_rate        numeric(5,2) not null default 0,
  igst_rate        numeric(5,2) not null default 0,
  discount_rate    numeric(5,2) not null default 0,
  discount_amount  numeric(12,2) not null default 0,
  line_total       numeric(15,2) not null default 0,
  hsn_code         text,               -- HSN/SAC code for GST
  sort_order       integer not null default 0,
  created_at       timestamptz not null default now()
);

create index idx_invoice_items_invoice_id on public.invoice_items(invoice_id);
create index idx_invoice_items_po_item_id on public.invoice_items(po_item_id);

-- RLS
alter table public.invoices       enable row level security;
alter table public.invoice_items  enable row level security;

-- Vendor can read and write own invoices
create policy "invoices_vendor_rw"
  on public.invoices for all
  using (vendor_id = public.get_my_vendor_id());

-- Company can read all invoices for their company (all statuses except draft)
create policy "invoices_company_read"
  on public.invoices for select
  using (
    company_id = public.get_my_company_id()
    and status != 'draft'
  );

-- Company can update invoice for approval/rejection only
create policy "invoices_company_approve"
  on public.invoices for update
  using (
    company_id = public.get_my_company_id()
    and status = 'submitted'
  )
  with check (
    company_id = public.get_my_company_id()
  );

-- Invoice items: follow invoice access
create policy "invoice_items_vendor_rw"
  on public.invoice_items for all
  using (
    exists (
      select 1 from public.invoices i
      where i.id = invoice_items.invoice_id
        and i.vendor_id = public.get_my_vendor_id()
    )
  );

create policy "invoice_items_company_read"
  on public.invoice_items for select
  using (
    exists (
      select 1 from public.invoices i
      where i.id = invoice_items.invoice_id
        and i.company_id = public.get_my_company_id()
        and i.status != 'draft'
    )
  );
```

---

## Relationships

```
public.grns (1)
  └── public.invoices (1)               — one invoice per confirmed GRN / PO
        └── public.invoice_items (N)    — derived from grn_items (accepted qty)

public.purchase_orders (1)
  └── public.invoices (1)               — FK reference for PO matching

public.invoices
  └── referenced by public.payments (Phase 22)
```

---

## API Endpoints

| Operation | Method | Implementation | Notes |
|---|---|---|---|
| Create invoice draft | Edge Function | `create-invoice` | Pre-fills from GRN accepted items; validates GRN status = 'confirmed' or 'partial' |
| Update invoice (draft) | Client mutation | `supabase.from('invoices').update()` + `supabase.from('invoice_items').upsert()` | Vendor only; draft status only |
| Submit invoice | Edge Function | `submit-invoice` | Validates totals; status → 'submitted'; notifies company finance team |
| Approve invoice | Edge Function | `approve-invoice` | Finance manager only; status → 'approved'; notifies vendor |
| Reject invoice | Edge Function | `reject-invoice` | Finance manager; status → 'rejected'; reason required; notifies vendor |
| Generate invoice PDF | Edge Function | `generate-invoice-pdf` | Renders PDF; stores in `invoices` bucket; updates `pdf_url` |
| Download invoice PDF | Client | `supabase.storage.from('invoices').createSignedUrl()` | Signed URL; expires 1 hour |
| Email invoice to company | Edge Function | `email-invoice` | Sends via Resend with PDF attachment |
| List invoices (vendor) | Server Component | `supabase.from('invoices').select('*, companies(name)')` | Vendor-scoped |
| List invoices (company) | Server Component | `supabase.from('invoices').select('*, vendors(name)')` | Company-scoped; status != 'draft' |
| Cancel invoice | Client mutation | `supabase.from('invoices').update({ status: 'cancelled' })` | Vendor; draft only |

**`supabase/functions/create-invoice/index.ts`** (key logic):

```typescript
// 1. Authenticate vendor; verify grn.vendor_id = get_my_vendor_id()
// 2. Verify grn.status in ('confirmed', 'partial')
// 3. Verify no existing invoice for this po_id (unique constraint check)
// 4. Load grn_items (quantity_accepted > 0 only) and po_items for pricing
// 5. Generate invoice_number: INV-{vendor_seq}-{YYYY}-{seq}
// 6. Compute due_date = invoice_date + payment_terms_days (from PO)
// 7. Insert invoices row (status = 'draft')
// 8. Insert invoice_items from grn_items.quantity_accepted * po_items.unit_price
//    Compute CGST/SGST/IGST split based on place_of_supply vs vendor state
// 9. Compute and persist subtotal, tax_amount, total_amount
// Returns: { invoice_id, invoice_number }
```

---

## Supabase Services Used

```
Supabase Database:
  - public.invoices        — invoice records
  - public.invoice_items   — line items derived from GRN accepted quantities

Supabase Storage:
  - invoices bucket        — private; stores generated invoice PDFs
  - Path: invoices/[vendor_id]/[invoice_id]/[invoice_number].pdf

Supabase Edge Functions:
  - create-invoice         — creates invoice draft pre-filled from GRN
  - submit-invoice         — validates totals; status → 'submitted'
  - approve-invoice        — finance approval; status → 'approved'
  - reject-invoice         — finance rejection with reason
  - generate-invoice-pdf   — renders GST-compliant invoice PDF
  - email-invoice          — emails PDF to company finance team
```

---

## Folder Structure

```
src/
├── app/
│   ├── (vendor)/
│   │   └── finance/
│   │       └── invoices/
│   │           ├── page.tsx                        [Vendor: invoice list]
│   │           ├── new/
│   │           │   └── page.tsx                    [Create invoice from GRN]
│   │           └── [id]/
│   │               └── page.tsx                    [Invoice detail + actions]
│   └── (company)/
│       └── finance/
│           └── invoices/
│               ├── page.tsx                        [Company: invoice list]
│               └── [id]/
│                   └── page.tsx                    [Invoice detail + approval]
└── components/
    └── modules/
        └── invoices/
            ├── invoice-form.tsx
            ├── invoice-items-table.tsx
            ├── invoice-status-badge.tsx
            ├── invoice-detail.tsx
            ├── invoice-approval-panel.tsx
            ├── invoice-pdf-document.tsx
            └── index.ts
```

---

## UI Screens

### Screen 21.1 — Vendor Invoice List (`/vendor/finance/invoices`)

`PageHeader`: title "Invoices", action "New Invoice".

**KPI row** (4 cards):

| KPI Card | Value |
|---|---|
| Total Invoiced | Sum of total_amount for submitted + approved + paid invoices |
| Pending Approval | Count with status = 'submitted' |
| Approved | Count with status = 'approved' |
| Paid | Count with status = 'paid' |

`DataTable` (InvoiceTable). Default sort: invoice_date descending.

---

### Screen 21.2 — Create Invoice (`/vendor/finance/invoices/new?poId=[id]`)

`PageHeader`: title "New Invoice", breadcrumb Finance → Invoices → New.

Pre-populated from GRN and PO data. Read-only fields: company name, PO number, GRN number. Editable fields: invoice_date, due_date, GSTIN, place of supply, bank details, notes.

`InvoiceItemsTable` rendered in editable mode — vendor can adjust unit_price and HSN codes but not quantities (quantities are locked to `grn_items.quantity_accepted`).

"Save as Draft" and "Submit Invoice" footer actions. Submit calls `submit-invoice` Edge Function.

---

### Screen 21.3 — Invoice Detail — Vendor (`/vendor/finance/invoices/[id]`)

`PageHeader`: title "[Invoice Number]", status badge, actions "Download PDF", "Email to Company".

Four panels:
1. **Invoice Header**: company name, PO number, GRN number, invoice date, due date, GSTIN details, place of supply.
2. **Line Items**: read-only `InvoiceItemsTable` with GST breakdown columns.
3. **Totals**: subtotal, CGST, SGST, IGST, discount, total amount (large, bold).
4. **Bank Details**: account holder, bank name, account number (masked), IFSC.

If status = 'rejected': rejection reason shown in an amber alert banner.

---

### Screen 21.4 — Invoice List — Company (`/company/finance/invoices`)

`PageHeader`: title "Invoices".

**KPI row** (4 cards):

| KPI Card | Value |
|---|---|
| Awaiting Approval | status = 'submitted' |
| Approved | status = 'approved' |
| Overdue | due_date < today and status != 'paid' |
| Paid This Month | Sum paid_at in current month |

`DataTable` with columns: invoice number, vendor, PO number, invoice date, due date, total amount, status, actions.

---

### Screen 21.5 — Invoice Detail — Company (`/company/finance/invoices/[id]`)

`PageHeader`: title "[Invoice Number]", vendor name, status badge.

Same four panels as vendor view, plus:

5. **Approval Panel** (`InvoiceApprovalPanel`): if status = 'submitted' and user has `has_permission('invoices', 'approve')`: "Approve" and "Reject" buttons. If status = 'approved': approved_by name + timestamp. "Create Payment" button (Phase 22).

---

## Components

### `InvoiceForm`

```typescript
interface InvoiceFormProps {
  poId:           string
  grnId:          string
  defaultValues?: Partial<InvoiceFormData>
  onSubmit:       (data: InvoiceFormData, action: 'draft' | 'submit') => Promise<void>
  isLoading?:     boolean
}
```

Renders header fields and `InvoiceItemsTable` in editable mode. Totals computed client-side in real time. "Save as Draft" and "Submit Invoice" actions.

### `InvoiceItemsTable`

```typescript
interface InvoiceItemsTableProps {
  items:     InvoiceItem[]
  currency:  string
  editMode?: boolean
  onChange?: (items: InvoiceItem[]) => void
}
```

Columns (read-only): item name, quantity (locked to GRN accepted), UOM, unit price, HSN code, CGST %, SGST %, IGST %, discount %, line total. In `editMode`: unit_price and hsn_code are editable inputs. Footer row: subtotal, CGST total, SGST total, IGST total, discount, **Total Amount**.

### `InvoiceStatusBadge`

| Status | Colour |
|---|---|
| `draft` | grey |
| `submitted` | amber |
| `approved` | green |
| `rejected` | red |
| `paid` | green (dark) |
| `cancelled` | grey (dark) |

### `InvoiceApprovalPanel`

```typescript
interface InvoiceApprovalPanelProps {
  invoice:       Invoice
  canApprove:    boolean
  onApprove:     () => Promise<void>
  onReject:      (reason: string) => Promise<void>
}
```

Shows current status. If status = 'submitted' and `canApprove`: renders "Approve" button and "Reject" button (opens Sheet with reason textarea). If approved: shows approver name + timestamp. If rejected: shows rejection reason in alert box.

### `InvoicePDFDocument`

`@react-pdf/renderer` Document component rendering a GST-compliant tax invoice:
- Page 1: Company header + Vendor details + Invoice metadata (number, date, due date, GSTIN)
- Line items table with HSN codes, CGST, SGST, IGST per row
- Totals section: subtotal → CGST → SGST → IGST → discount → **Total in words + figures**
- Bank details section
- Signature block

Styled to comply with Indian GST invoice format requirements.

---

## Forms

### Form 21.1 — Invoice Header Form

| Field | Type | Validation |
|---|---|---|
| Invoice date | date picker | Required, max today |
| Due date | date picker | Required, must be >= invoice_date |
| GSTIN (vendor) | text input | Optional, 15-char GST format if provided |
| GSTIN (company) | text input | Optional, auto-filled from company profile |
| Place of supply | select | Required for GST; list of Indian states |
| Bank — account holder | text input | Required, max 100 chars |
| Bank — account number | text input | Required, max 20 chars |
| Bank — IFSC | text input | Required, 11-char IFSC format |
| Bank — bank name | text input | Required, max 100 chars |
| Notes | textarea | Optional, max 1000 chars |

```typescript
const invoiceSchema = z.object({
  invoice_date:    z.date().max(new Date()),
  due_date:        z.date(),
  gstin_vendor:    z.string().regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/).optional().or(z.literal('')),
  place_of_supply: z.string().min(2),
  bank_details:    z.object({
    account_holder: z.string().min(2).max(100),
    account_number: z.string().min(5).max(20),
    ifsc:           z.string().regex(/^[A-Z]{4}0[A-Z0-9]{6}$/),
    bank_name:      z.string().min(2).max(100),
  }),
  notes: z.string().max(1000).optional(),
})
```

---

### Form 21.2 — Invoice Rejection Form

| Field | Type | Validation |
|---|---|---|
| Rejection reason | textarea | Required, min 20 chars, max 1000 chars |

---

## Tables

### Invoice List Table (Vendor + Company)

| Column | Sortable | Filterable |
|---|---|---|
| Invoice Number | Yes | Yes (search) |
| Company / Vendor | No | Yes (search) |
| PO Number | No | Yes (search) |
| Invoice Date | Yes | Yes (date range) |
| Due Date | Yes | Yes (date range) |
| Total Amount | Yes | No |
| Status | Yes | Yes (multi-select) |
| Actions | No | No |

---

### Invoice Items Table

| Column | Sortable | Filterable |
|---|---|---|
| Item name | No | No |
| Quantity | No | No |
| UOM | No | No |
| HSN code | No | No |
| Unit price | No | No |
| CGST % | No | No |
| SGST % | No | No |
| IGST % | No | No |
| Discount % | No | No |
| Line total | No | No |

Footer: Subtotal, CGST, SGST, IGST, Discount, **Total Amount**.

---

## Permissions

```
Create / edit / submit invoice:
  - Vendor user only; vendor_id must match invoice.vendor_id
  - Edit allowed only when status = 'draft'

Approve invoice:
  - Permission: has_permission('invoices', 'approve')
  - Roles: Finance Manager only
  - Company side; company_id must match invoice.company_id

Reject invoice:
  - Same as approve

View invoices (company):
  - All company members with has_permission('invoices', 'view')
  - Draft invoices are invisible to company (RLS: status != 'draft')

View invoices (vendor):
  - Vendor user for own invoices

Generate / download PDF:
  - Both vendor and company users for invoices they can read
  - Signed URL only; no public bucket access

Cancel invoice:
  - Vendor can cancel draft invoices only
```

---

## Validation Rules

```
Invoice creation:
  - grn.status must be in ('confirmed', 'partial')
  - No existing invoice for this po_id (unique constraint)
  - Invoice must have at least 1 line item with quantity_accepted > 0

Invoice items:
  - quantity = grn_items.quantity_accepted (locked; not editable by vendor)
  - unit_price >= 0
  - cgst_rate + sgst_rate = tax_rate when supply is intra-state
  - igst_rate = tax_rate when supply is inter-state
  - CGST + SGST or IGST split determined by place_of_supply vs vendor state

Due date:
  - Must be >= invoice_date
  - Typically invoice_date + payment_terms_days from PO

GSTIN format:
  - If provided: 15-character Indian GST number format
  - Regex: /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/

IFSC format:
  - 11 characters: 4 alpha + '0' + 6 alphanumeric
  - Regex: /^[A-Z]{4}0[A-Z0-9]{6}$/

Totals (server-side recomputed on submit):
  line_total     = quantity * unit_price * (1 + tax_rate/100) * (1 - discount_rate/100)
  subtotal       = Σ (quantity * unit_price * (1 - discount_rate/100))
  tax_amount     = Σ (quantity * unit_price * tax_rate/100)
  total_amount   = subtotal + tax_amount
```

---

## Business Rules

```
BR-21.1  Invoice creation is unlocked only after a GRN is confirmed or partially
         confirmed. A vendor cannot invoice for a PO without a matching GRN.
         This enforces the three-way match: PO ↔ GRN ↔ Invoice.

BR-21.2  Invoice quantities are locked to GRN accepted quantities. Vendors cannot
         invoice for more than was accepted by the company. If goods were rejected,
         the rejected quantity is excluded from the invoice.

BR-21.3  One invoice per PO in v1. Partial-delivery follow-up invoicing (where a
         second shipment covers the remaining quantity) is deferred to Phase 31.

BR-21.4  The CGST/SGST vs IGST split is determined by comparing the vendor's state
         (from vendor.address) with the place_of_supply on the invoice:
         - Same state → CGST + SGST (split equally from total tax_rate)
         - Different state or union territory → IGST (full tax_rate)

BR-21.5  Invoice approval by the Finance Manager is required before a payment can
         be initiated. Phase 22 checks invoice.status = 'approved' before allowing
         payment creation.

BR-21.6  A rejected invoice can be revised by the vendor. The vendor updates the
         draft (status reverts to 'draft' on rejection) and resubmits. The previous
         rejection reason is shown as context in the edit view.

BR-21.7  Invoice numbers are unique per vendor. Format: INV-{YYYY}-{seq} where seq
         is a sequential integer per vendor per year, zero-padded to 4 digits.
         E.g., INV-2026-0001.
```

---

## Security

```
- Draft invoices are invisible to the company via RLS (status != 'draft' policy).
  The company cannot see a vendor's incomplete invoice.

- Bank details are stored in a JSONB column. The account_number is masked in the
  UI (show last 4 digits only) but stored in full for payment processing.
  Never log or echo bank details in Edge Function responses.

- Invoice totals are recomputed server-side in submit-invoice. The client-submitted
  total is ignored. This prevents a vendor from inflating the total_amount field.

- approve-invoice verifies company_id from JWT before updating status.
  A Finance Manager from Company A cannot approve Company B's invoice.

- PDF is stored in a private bucket. Signed URLs expire after 1 hour.
  Invoice PDFs may contain vendor bank details and GST numbers — sensitive data.

- GSTIN and IFSC format validation is enforced both client-side (Zod) and
  server-side (Edge Function) to prevent invalid tax data entering the system.
```

---

## State Management

```typescript
// Vendor: own invoice list
export function useVendorInvoices(vendorId: string) {
  const supabase = useSupabase()
  return useQuery({
    queryKey: ['invoices', 'vendor', vendorId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('invoices')
        .select('*, companies(name), purchase_orders(po_number)')
        .eq('vendor_id', vendorId)
        .order('invoice_date', { ascending: false })
      if (error) throw error
      return data ?? []
    },
    staleTime: 30 * 1000,
  })
}

// Company: received invoices
export function useCompanyInvoices(companyId: string) {
  const supabase = useSupabase()
  return useQuery({
    queryKey: ['invoices', 'company', companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('invoices')
        .select('*, vendors(name, logo_url), purchase_orders(po_number)')
        .eq('company_id', companyId)
        .neq('status', 'draft')
        .order('invoice_date', { ascending: false })
      if (error) throw error
      return data ?? []
    },
    staleTime: 30 * 1000,
  })
}

// Single invoice detail
export function useInvoice(invoiceId: string) {
  const supabase = useSupabase()
  return useQuery({
    queryKey: ['invoice', invoiceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('invoices')
        .select(`
          *,
          invoice_items(*),
          vendors(name, logo_url, address),
          companies(name, logo_url, address),
          purchase_orders(po_number, title),
          grns(grn_number)
        `)
        .eq('id', invoiceId)
        .single()
      if (error) throw error
      return data
    },
    staleTime: 15 * 1000,
  })
}
```

After any invoice mutation, invalidate list and detail query keys. After approval, also invalidate `['invoices', 'company', companyId]` and `['invoice', invoiceId]`.

---

## Development Tasks

### Task 21.1 — Migration
Apply migration `0024_create_invoices.sql`. Verify `invoices`, `invoice_items` tables, unique constraints, and RLS. Regenerate `database.ts` types.

### Task 21.2 — create-invoice Edge Function
Implement: GRN status check; invoice number generation; pre-fill invoice_items from grn_items.quantity_accepted × po_items.unit_price; CGST/SGST/IGST split logic; insert rows. Test with partial GRN (some items rejected).

### Task 21.3 — InvoiceForm and InvoiceItemsTable
Implement form with locked quantity rows. Implement live total computation. Test GST split display when place_of_supply changes.

### Task 21.4 — Create Invoice Page (Vendor)
Implement `/vendor/finance/invoices/new?poId=` page. Load GRN and PO data. Call `create-invoice` on mount if no draft invoice exists. Wire form to update draft items. Wire "Submit Invoice" to `submit-invoice`.

### Task 21.5 — submit-invoice Edge Function
Validate totals server-side; set status = 'submitted'; notify company finance team (Phase 27 stub). Return computed totals.

### Task 21.6 — Invoice List Pages (Vendor + Company)
Implement vendor list `/vendor/finance/invoices/page.tsx` with KPI cards and InvoiceTable. Implement company list `/company/finance/invoices/page.tsx`.

### Task 21.7 — Invoice Detail Pages (Vendor + Company)
Implement vendor detail with all panels. Implement company detail with additional `InvoiceApprovalPanel`.

### Task 21.8 — approve-invoice and reject-invoice Edge Functions
Implement: status transitions; notifications. Test rejection → vendor re-edit → resubmit flow.

### Task 21.9 — InvoicePDFDocument and generate-invoice-pdf
Implement GST-compliant PDF layout. Wire "Download PDF" to signed URL. Wire `email-invoice` to Resend. Test PDF output with Indian GST format requirements.

### Task 21.10 — GRN / PO navigation hook-up
Add "Create Invoice" button to vendor PO detail page when po.status = 'closed' and no invoice exists.

---

## Testing Checklist

```
✓ Migration 0024: invoices, invoice_items tables and RLS active
✓ Invoice creation blocked when GRN status = 'draft' (not yet confirmed)
✓ Invoice creation blocked when existing invoice for po_id
✓ Invoice items locked to grn_items.quantity_accepted
✓ CGST/SGST split applied for intra-state supply
✓ IGST applied for inter-state supply
✓ Server-side total recomputation in submit-invoice matches line items
✓ Draft invoice invisible to company (RLS)
✓ Company sees invoice after submission
✓ Finance manager approves: status = 'approved'
✓ Finance manager rejects: status = 'rejected'; reason stored
✓ Rejected invoice: vendor can edit and resubmit
✓ GSTIN validation: invalid format rejected at submission
✓ IFSC validation: invalid format rejected at submission
✓ PDF generated: GST-compliant layout verified
✓ Signed URL expires after 1 hour
✓ Email: company finance team receives invoice with PDF attachment
✓ KPI cards: totals and counts accurate
✓ pnpm build: zero TypeScript errors; pnpm lint: zero warnings
```

---

## Acceptance Criteria

```
AC-21.1  Migration 0024 applied; invoices and invoice_items tables active with RLS
AC-21.2  Invoice creation blocked until GRN is confirmed; quantities locked to GRN accepted
AC-21.3  CGST/SGST vs IGST split computed correctly based on place_of_supply
AC-21.4  Server-side total validation in submit-invoice prevents total manipulation
AC-21.5  Draft invoices invisible to company via RLS
AC-21.6  Finance manager can approve or reject submitted invoices
AC-21.7  Rejected invoice allows vendor to edit and resubmit
AC-21.8  GST-compliant PDF generated and downloadable via signed URL
AC-21.9  Invoice emailed to company finance team with PDF attachment
AC-21.10 KPI cards accurate; invoice table filters functional
```

---

## Definition of Done

Phase 21 is complete when all Acceptance Criteria above are met AND:

- [ ] All TypeScript checks pass (zero errors)
- [ ] All ESLint checks pass (zero warnings)
- [ ] Migration 0024 applied and committed; `database.ts` regenerated
- [ ] `create-invoice`, `submit-invoice`, `approve-invoice`, `reject-invoice` Edge Functions deployed
- [ ] `generate-invoice-pdf` Edge Function deployed; GST layout verified
- [ ] `email-invoice` Edge Function deployed; test email verified
- [ ] CGST/SGST/IGST split logic verified for both intra- and inter-state cases
- [ ] Draft invoice RLS verified: company returns empty for draft invoices
- [ ] PR merged to `develop` with at least 1 reviewer approval
- [ ] `feature/21-invoice-management` branch merged and deleted

---

## Risk Factors

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| GST tax split logic incorrect for edge-case states (union territories) | Medium | Medium | Maintain a lookup table of Indian states and UTs with their supply type classification |
| Vendor inflating invoice total via direct API call | Low | High | submit-invoice recomputes all totals from invoice_items server-side; client total is ignored |
| Bank details leaking in Edge Function logs | Low | High | Never log the bank_details JSONB field in any Edge Function; use redacted logging |
| PDF generation fails for invoices with 30+ line items | Low | Low | Test with large item counts; @react-pdf/renderer supports multi-page layouts |
| Second invoice attempted for same PO (e.g. for partial GRN re-delivery) | Medium | Low | Unique constraint on invoices(po_id) blocks it with a clear error; Phase 31 handles multi-invoice POs |

---

## Best Practices

- Recompute all GST amounts server-side on submission — never persist client-computed tax values without server validation
- Mask bank account numbers in all API responses (return only last 4 digits) — store full number in DB for payment processing only
- Lock invoice item quantities to GRN accepted quantities at invoice creation time; store the copy so the GRN can be queried separately without affecting the invoice
- Generate the invoice PDF on submission (not on creation) so the PDF reflects the final submitted values, not a draft
- Keep the CGST/SGST/IGST split logic in a shared Postgres function so it is consistent between Edge Functions and can be tested independently

---

## Estimated Completion

**4–5 working days.** The GST tax split logic and the PDF generation are the two most complex pieces. The three-way match validation (PO ↔ GRN ↔ Invoice) is critical and must be verified before the approval flow is built on top of it.

---

---

# PHASE 22 — PAYMENT MANAGEMENT

---

## Overview

| Field | Value |
|---|---|
| Phase Number | 22 |
| Phase Name | Payment Management |
| Milestone | M5 — Finance & Payments |
| PRD Reference | Module 27 — Payment Management |
| DESIGN Reference | Section 3 (Company — Finance — Payments, Vendor — Finance — Payments), F01, F03 |
| Estimated Duration | 4–5 days |
| Prerequisite Phases | Phase 21 (Invoice Management — invoice status = 'approved') |

---

## Purpose

Phase 22 implements the payment lifecycle between companies and vendors. Once an invoice is approved, the company's Finance Manager initiates a payment via Razorpay. The payment captures the transaction ID, amount, and status. On successful payment, the invoice is marked 'paid', the vendor is notified, and a payment receipt is generated. This phase covers Razorpay order creation, payment verification via webhook, receipt PDF generation, and the full payment history UI on both sides.

---

## Business Goal

Without a structured payment module, companies process payments outside the platform and update status manually — creating gaps in the audit trail. Phase 22 closes the procurement lifecycle by recording every payment event inside VendorFlow. The Razorpay integration provides a verified, tamper-proof transaction record. The three-way match (PO → GRN → Invoice → Payment) is now complete, giving Finance full visibility into committed spend, processed payments, and outstanding obligations from a single dashboard.

---

## Dependencies

- Phase 21 complete (`invoices` table — approved invoice required for payment)
- Razorpay account with API key and secret configured in Supabase Edge Function secrets
- Phase 2 `DataTable`, `PageHeader`, `KPICard`, `StatusBadge`, `Sheet`, `Timeline` components
- PDF generation: `@react-pdf/renderer` (payment receipt)
- Email: Resend

---

## Database Tables

Migration: `0025_create_payments.sql`

```sql
-- ============================================================
-- Migration: 0025_create_payments
-- Description: Payment lifecycle with Razorpay integration
-- ============================================================

create table public.payments (
  id                  uuid primary key default gen_random_uuid(),
  invoice_id          uuid not null references public.invoices(id),
  company_id          uuid not null references public.companies(id),
  vendor_id           uuid not null references public.vendors(id),
  payment_number      text not null,        -- PAY-{YYYY}-{seq}
  status              text not null default 'initiated'
                        check (status in (
                          'initiated',    -- Razorpay order created; awaiting checkout
                          'pending',      -- user opened Razorpay checkout
                          'completed',    -- Razorpay webhook confirmed payment
                          'failed',       -- payment failed in Razorpay
                          'refunded',     -- full or partial refund processed
                          'cancelled'     -- cancelled before checkout completion
                        )),
  amount              numeric(15,2) not null check (amount > 0),
  currency            text not null default 'INR',
  -- Razorpay fields
  razorpay_order_id   text,               -- order_id from Razorpay create order API
  razorpay_payment_id text,               -- payment_id from Razorpay webhook
  razorpay_signature  text,               -- HMAC signature from webhook (stored for audit)
  -- Refund
  refund_amount       numeric(15,2),
  refund_reason       text,
  refunded_at         timestamptz,
  razorpay_refund_id  text,
  -- Receipt
  receipt_pdf_url     text,
  -- Lifecycle
  initiated_by        uuid not null references public.profiles(id),
  completed_at        timestamptz,
  failed_at           timestamptz,
  failure_reason      text,
  notes               text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  constraint payment_invoice_unique unique (invoice_id)  -- one payment per invoice
);

create unique index idx_payment_number_company
  on public.payments(company_id, payment_number);
create index idx_payments_invoice_id   on public.payments(invoice_id);
create index idx_payments_company_id   on public.payments(company_id);
create index idx_payments_vendor_id    on public.payments(vendor_id);
create index idx_payments_status       on public.payments(status);
create index idx_payments_created_at   on public.payments(created_at desc);
create index idx_payments_razorpay_order
  on public.payments(razorpay_order_id) where razorpay_order_id is not null;

create trigger trg_payments_updated_at
  before update on public.payments
  for each row execute function public.handle_updated_at();

-- RLS
alter table public.payments enable row level security;

-- Company reads and initiates payments for own company
create policy "payments_company_rw"
  on public.payments for all
  using (company_id = public.get_my_company_id());

-- Vendor reads completed/refunded payments for their invoices
create policy "payments_vendor_read"
  on public.payments for select
  using (
    vendor_id = public.get_my_vendor_id()
    and status in ('completed', 'refunded')
  );
```

---

## Relationships

```
public.invoices (1)
  └── public.payments (1)    — one payment per approved invoice

public.payments
  └── Razorpay (external)    — order created via Razorpay Orders API
                               payment confirmed via Razorpay webhook
```

---

## API Endpoints

| Operation | Method | Implementation | Notes |
|---|---|---|---|
| Create Razorpay order | Edge Function | `create-payment-order` | Creates Razorpay order; inserts payment row (status = 'initiated') |
| Verify payment (webhook) | Edge Function | `razorpay-webhook` | HMAC signature verification; status → 'completed'; marks invoice 'paid' |
| Handle failed payment | Edge Function | `razorpay-webhook` | status → 'failed'; stores failure_reason |
| Cancel payment | Client mutation | `supabase.from('payments').update({ status: 'cancelled' })` | Before checkout only |
| Initiate refund | Edge Function | `initiate-refund` | Finance manager; calls Razorpay Refund API; status → 'refunded' |
| Generate receipt PDF | Edge Function | `generate-payment-receipt` | Runs after 'completed'; stores in `payment-receipts` bucket |
| Download receipt | Client | `supabase.storage.from('payment-receipts').createSignedUrl()` | Signed URL; 1 hour expiry |
| Email receipt to vendor | Edge Function | `email-payment-receipt` | Triggered after payment completion |
| List payments (company) | Server Component | `supabase.from('payments').select('*, invoices(invoice_number), vendors(name)')` | Company-scoped |
| List payments (vendor) | Server Component | `supabase.from('payments').select('*, invoices(invoice_number), companies(name)')` | Completed + refunded only |

**`supabase/functions/create-payment-order/index.ts`** (key logic):

```typescript
// 1. Authenticate Finance Manager; verify has_permission('payments', 'create')
// 2. Load invoice; verify invoice.status = 'approved' and invoice.company_id = caller's company
// 3. Verify no existing non-cancelled payment for this invoice_id
// 4. Generate payment_number: PAY-{YYYY}-{seq}
// 5. Call Razorpay Orders API:
//    POST https://api.razorpay.com/v1/orders
//    { amount: invoice.total_amount * 100, currency: 'INR', receipt: payment_number }
// 6. Insert payments row: status = 'initiated', razorpay_order_id = order.id
// 7. Return { payment_id, razorpay_order_id, amount, currency, key_id }
//    (key_id is the public Razorpay API key — safe to return to client)
```

**`supabase/functions/razorpay-webhook/index.ts`** (key logic):

```typescript
// 1. Read raw body and X-Razorpay-Signature header
// 2. Verify HMAC-SHA256: crypto.createHmac('sha256', RAZORPAY_WEBHOOK_SECRET)
//                           .update(rawBody).digest('hex') === signature
//    If mismatch: return 400 immediately — do not process
// 3. Parse event; handle 'payment.captured':
//    a. Find payment by razorpay_order_id
//    b. Update payment: status = 'completed', razorpay_payment_id, completed_at
//    c. Update invoice: status = 'paid', paid_at
//    d. Call generate-payment-receipt (async)
//    e. Call email-payment-receipt (async)
// 4. Handle 'payment.failed':
//    a. Update payment: status = 'failed', failure_reason
// 5. Return 200 to Razorpay — always return 200 after processing
```

---

## Supabase Services Used

```
Supabase Database:
  - public.payments    — payment records with Razorpay IDs
  - public.invoices    — status updated to 'paid' on payment completion

Supabase Storage:
  - payment-receipts bucket   — private; stores payment receipt PDFs
  - Path: payment-receipts/[company_id]/[payment_id]/[payment_number].pdf

Supabase Edge Functions:
  - create-payment-order      — creates Razorpay order; inserts payment row
  - razorpay-webhook          — HMAC-verified webhook handler
  - initiate-refund           — calls Razorpay Refund API
  - generate-payment-receipt  — renders receipt PDF; stores in bucket
  - email-payment-receipt     — emails receipt to vendor via Resend

Supabase Secrets (environment variables):
  - RAZORPAY_KEY_ID           — public Razorpay key (returned to client)
  - RAZORPAY_KEY_SECRET       — private key (never returned to client)
  - RAZORPAY_WEBHOOK_SECRET   — used for HMAC webhook verification
```

---

## Folder Structure

```
src/
├── app/
│   ├── (company)/
│   │   └── finance/
│   │       └── payments/
│   │           ├── page.tsx                        [Company: payment list]
│   │           └── [id]/
│   │               └── page.tsx                    [Payment detail + receipt]
│   └── (vendor)/
│       └── finance/
│           └── payments/
│               ├── page.tsx                        [Vendor: received payments]
│               └── [id]/
│                   └── page.tsx                    [Payment detail (read-only)]
└── components/
    └── modules/
        └── payments/
            ├── payment-checkout-button.tsx
            ├── razorpay-checkout.tsx
            ├── payment-status-badge.tsx
            ├── payment-detail.tsx
            ├── payment-receipt-pdf.tsx
            ├── refund-form.tsx
            └── index.ts
```

---

## UI Screens

### Screen 22.1 — Payment List — Company (`/company/finance/payments`)

`PageHeader`: title "Payments".

**KPI row** (4 cards):

| KPI Card | Value |
|---|---|
| Total Paid | Sum of amount where status = 'completed' |
| Pending | Count with status = 'initiated' or 'pending' |
| Failed | Count with status = 'failed' (current month) |
| Refunded | Sum of refund_amount where status = 'refunded' |

`DataTable` (PaymentsTable). Default sort: created_at descending.

---

### Screen 22.2 — Initiate Payment (from Invoice Detail)

No dedicated page. Payment is initiated from the company invoice detail screen (Phase 21, Screen 21.5) via the `PaymentCheckoutButton`. Clicking it calls `create-payment-order`, receives the Razorpay order details, and opens the `RazorpayCheckout` component in-page.

---

### Screen 22.3 — Payment Detail — Company (`/company/finance/payments/[id]`)

`PageHeader`: title "[Payment Number]", status badge, action "Download Receipt".

Four panels:
1. **Payment Summary**: invoice number (link), vendor name, amount, currency, Razorpay payment ID, completed at timestamp.
2. **Invoice Reference**: PO number, invoice date, approved by.
3. **Receipt**: "Download Receipt PDF" button (signed URL). If not yet generated: "Generating receipt…" loading state.
4. **Refund**: if status = 'completed', Finance Manager sees "Initiate Refund" button. If status = 'refunded': refund amount, reason, Razorpay refund ID, refunded_at.

---

### Screen 22.4 — Payment List — Vendor (`/vendor/finance/payments`)

`PageHeader`: title "Payments Received".

**KPI row** (3 cards):

| KPI Card | Value |
|---|---|
| Total Received | Sum of amount where status = 'completed' |
| This Month | Sum of amount completed in current month |
| Refunded | Sum of refund_amount |

`DataTable` showing completed and refunded payments.

---

### Screen 22.5 — Payment Detail — Vendor (`/vendor/finance/payments/[id]`)

Read-only. Shows: invoice number, company name, amount, Razorpay payment ID, completed at. "Download Receipt PDF" button. If refunded: refund details shown.

---

## Components

### `PaymentCheckoutButton`

```typescript
interface PaymentCheckoutButtonProps {
  invoiceId:  string
  amount:     number
  currency:   string
  onSuccess:  (paymentId: string) => void
  onFailure:  (error: string) => void
  disabled?:  boolean
}
```

Button that calls `create-payment-order` on click, then renders `RazorpayCheckout` with the returned order details. Disabled when invoice.status !== 'approved' or a payment already exists.

### `RazorpayCheckout`

```typescript
interface RazorpayCheckoutProps {
  orderId:      string
  amount:       number
  currency:     string
  keyId:        string
  prefill?:     { name?: string; email?: string; contact?: string }
  onSuccess:    (response: RazorpaySuccessResponse) => void
  onDismiss:    () => void
}
```

Loads the Razorpay checkout script (`https://checkout.razorpay.com/v1/checkout.js`) dynamically. Opens the Razorpay modal with the pre-filled order details. On success, calls `onSuccess` with `razorpay_payment_id`, `razorpay_order_id`, `razorpay_signature`. The client-side success callback updates UI state optimistically while the webhook confirms the actual payment in the database.

### `PaymentStatusBadge`

| Status | Colour |
|---|---|
| `initiated` | grey |
| `pending` | amber |
| `completed` | green |
| `failed` | red |
| `refunded` | blue |
| `cancelled` | grey (dark) |

### `RefundForm`

```typescript
interface RefundFormProps {
  payment:   Payment
  onSubmit:  (data: RefundData) => Promise<void>
  onCancel:  () => void
  isLoading?: boolean
}
```

Sheet form with refund amount (number input, max = payment.amount) and refund reason (textarea, required). "Initiate Refund" submit button calls `initiate-refund` Edge Function.

### `PaymentReceiptPDF`

`@react-pdf/renderer` Document. Single page: VendorFlow header, company and vendor details, payment reference table (payment number, invoice number, PO number, Razorpay payment ID), amount breakdown, "PAID" watermark stamp, completion timestamp.

---

## Forms

### Form 22.1 — Refund Form

| Field | Type | Validation |
|---|---|---|
| Refund amount | currency input | Required, min 1, max = payment.amount |
| Refund reason | textarea | Required, min 10 chars, max 500 chars |

```typescript
const refundSchema = z.object({
  refund_amount: z.number().min(1),
  refund_reason: z.string().min(10).max(500),
}).refine(d => d.refund_amount <= payment.amount, {
  message: 'Refund amount cannot exceed original payment amount',
  path: ['refund_amount'],
})
```

---

## Tables

### Payments Table (Company + Vendor)

| Column | Sortable | Filterable |
|---|---|---|
| Payment Number | Yes | Yes (search) |
| Invoice Number | No | Yes (search) |
| Vendor / Company | No | Yes |
| Amount | Yes | No |
| Status | Yes | Yes (multi-select) |
| Razorpay Payment ID | No | No |
| Completed At | Yes | Yes (date range) |
| Actions | No | No |

---

## Permissions

```
Initiate payment:
  - Permission: has_permission('payments', 'create')
  - Roles: Finance Manager only
  - Invoice must have status = 'approved'

View payments (company):
  - Permission: has_permission('payments', 'view')
  - Roles: Finance Manager, Procurement Manager

View payments (vendor):
  - Vendor user; only completed and refunded payments

Initiate refund:
  - Permission: has_permission('payments', 'refund')
  - Roles: Finance Manager only
  - Payment must have status = 'completed'

Razorpay webhook:
  - No authentication via JWT — authenticated by HMAC signature verification
  - Uses service role internally to update payment and invoice status
```

---

## Validation Rules

```
Payment initiation:
  - invoice.status must be 'approved'
  - No existing payment for invoice_id with status not in ('failed', 'cancelled')
  - amount must equal invoice.total_amount exactly

Refund:
  - payment.status must be 'completed'
  - refund_amount <= payment.amount
  - refund_amount > 0
  - One refund per payment in v1 (no partial re-refunds)

Webhook verification:
  - HMAC-SHA256 signature must match using RAZORPAY_WEBHOOK_SECRET
  - If signature invalid: return 400; log the attempt; do not update any record
  - Idempotency: if razorpay_payment_id already stored for this order: skip update, return 200

Razorpay order amount:
  - amount in paise (multiply INR by 100): enforced in create-payment-order
  - Maximum Razorpay single transaction: ₹10,00,000 (₹10 lakh)
  - If invoice.total_amount > 1000000: show warning and advise bank transfer
```

---

## Business Rules

```
BR-22.1  Payment can only be initiated for invoices with status = 'approved'.
         The PaymentCheckoutButton is disabled for any other status.

BR-22.2  The Razorpay webhook is the authoritative source of payment confirmation.
         The client-side success callback from the checkout modal is used only for
         optimistic UI update. The database is updated only after webhook verification.

BR-22.3  Payment receipt PDF is generated automatically after webhook confirmation.
         Vendors do not need to request it — it is emailed automatically.

BR-22.4  Refunds are initiated by the Finance Manager and processed via Razorpay.
         The platform records the Razorpay refund ID and refund amount.
         Partial refunds are supported (refund_amount < payment.amount).

BR-22.5  A failed payment allows the Finance Manager to retry. A new Razorpay order
         is created (new razorpay_order_id) and the existing payment row is updated.
         The payment_number does not change on retry.

BR-22.6  The vendor sees only completed and refunded payments. Initiated, pending,
         failed, and cancelled payment records are company-internal and invisible
         to the vendor until payment is successful.

BR-22.7  Payment history is immutable once status = 'completed'. No direct update
         to amount, razorpay_payment_id, or completed_at is permitted outside the
         webhook handler.
```

---

## Security

```
- Razorpay KEY_SECRET and WEBHOOK_SECRET are stored as Supabase secrets.
  They are never returned in any API response or logged anywhere.

- Webhook HMAC verification is the first operation in razorpay-webhook.
  Any request failing verification is rejected with 400 before touching the DB.

- Idempotency check: if a webhook is replayed (razorpay_payment_id already stored),
  the handler returns 200 without re-processing. This prevents double-payment marking.

- The client never receives RAZORPAY_KEY_SECRET. Only RAZORPAY_KEY_ID (public key)
  is returned from create-payment-order for use in the frontend checkout component.

- Payment amounts are validated server-side against invoice.total_amount.
  The client cannot alter the payment amount before Razorpay order creation.

- RLS: vendor sees only completed/refunded payments.
  A vendor cannot see initiated/failed payments from the company side.

- Receipt PDFs are in a private bucket. Signed URLs expire after 1 hour.
  Receipts contain Razorpay payment IDs and financial amounts — sensitive data.
```

---

## State Management

```typescript
// Company: payment list
export function useCompanyPayments(companyId: string) {
  const supabase = useSupabase()
  return useQuery({
    queryKey: ['payments', 'company', companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payments')
        .select('*, invoices(invoice_number), vendors(name)')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data ?? []
    },
    staleTime: 30 * 1000,
  })
}

// Single payment — polls until webhook updates status
export function usePayment(paymentId: string) {
  const supabase = useSupabase()
  return useQuery({
    queryKey: ['payment', paymentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payments')
        .select('*, invoices(invoice_number, total_amount), vendors(name)')
        .eq('id', paymentId)
        .single()
      if (error) throw error
      return data
    },
    staleTime: 5 * 1000,
    refetchInterval: (query) =>
      query.state.data?.status === 'pending' ? 3000 : false,
  })
}
```

The `usePayment` hook polls every 3 seconds while status = 'pending' (waiting for webhook). Once the webhook updates status to 'completed' or 'failed', polling stops automatically via the `refetchInterval` function.

---

## Development Tasks

### Task 22.1 — Migration
Apply migration `0025_create_payments.sql`. Verify `payments` table, unique constraints, indexes, and RLS. Regenerate `database.ts` types.

### Task 22.2 — Razorpay Account Setup
Configure Razorpay test account. Add `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET` to Supabase Edge Function secrets. Register webhook URL pointing to `razorpay-webhook` Edge Function in Razorpay dashboard.

### Task 22.3 — create-payment-order Edge Function
Implement Razorpay order creation, payment number generation, and payments row insert. Test with test mode Razorpay credentials.

### Task 22.4 — RazorpayCheckout Component
Implement dynamic script loader and Razorpay options object. Wire `onSuccess` and `onDismiss` callbacks. Test in browser with Razorpay test card numbers.

### Task 22.5 — razorpay-webhook Edge Function
Implement HMAC verification, idempotency check, payment completion handler, invoice paid update, and async PDF/email triggers. Test with Razorpay test webhook simulator.

### Task 22.6 — Payment List and Detail Pages (Company)
Implement company payment list with KPI cards. Implement payment detail with receipt download and refund panel.

### Task 22.7 — Payment List and Detail Pages (Vendor)
Implement vendor payment list (`/vendor/finance/payments`). Implement read-only detail.

### Task 22.8 — initiate-refund Edge Function
Implement: call Razorpay Refund API; update payment row with refund details; notify vendor.

### Task 22.9 — generate-payment-receipt and email-payment-receipt
Implement `PaymentReceiptPDF` component and `generate-payment-receipt` Edge Function. Wire `email-payment-receipt`. Test receipt PDF output and email delivery.

### Task 22.10 — Invoice Detail Hook-up
Add `PaymentCheckoutButton` to company invoice detail page (Phase 21, Screen 21.5) when status = 'approved'. Show payment status after initiation.

---

## Testing Checklist

```
✓ Migration 0025: payments table, RLS, unique constraint active
✓ Payment initiation blocked when invoice.status != 'approved'
✓ Payment initiation blocked when existing non-failed/cancelled payment exists
✓ Razorpay order created: razorpay_order_id stored in payments row
✓ Checkout modal opens with correct amount and currency
✓ Webhook HMAC verification: invalid signature returns 400, no DB update
✓ Webhook payment.captured: payment → 'completed', invoice → 'paid'
✓ Webhook payment.failed: payment → 'failed'; invoice remains 'approved'
✓ Idempotent webhook: replayed event returns 200 without re-processing
✓ Polling: usePayment polls every 3s while status = 'pending'; stops on completion
✓ Receipt PDF generated after payment completion
✓ Receipt email sent to vendor after payment completion
✓ Refund: Razorpay Refund API called; refund_amount and refund_id stored
✓ Refund: refund_amount > payment.amount blocked with validation error
✓ Vendor sees only completed + refunded payments (RLS)
✓ Vendor cannot see initiated/failed payments (RLS)
✓ RAZORPAY_KEY_SECRET never returned in any API response
✓ Signed URL for receipt expires after 1 hour
✓ pnpm build: zero TypeScript errors; pnpm lint: zero warnings
```

---

## Acceptance Criteria

```
AC-22.1  Migration 0025 applied; payments table active with RLS
AC-22.2  Payment initiation creates Razorpay order and payments row atomically
AC-22.3  Razorpay checkout opens correctly in browser; test payment completes
AC-22.4  Webhook HMAC verification rejects invalid signatures before DB access
AC-22.5  Successful webhook marks payment 'completed' and invoice 'paid'
AC-22.6  Failed webhook marks payment 'failed'; Finance Manager can retry
AC-22.7  Payment receipt PDF generated and emailed to vendor on completion
AC-22.8  Refund initiates via Razorpay API; refund details stored
AC-22.9  Vendor sees completed/refunded payments only via RLS
AC-22.10 Razorpay secrets never exposed in API responses or logs
```

---

## Definition of Done

Phase 22 is complete when all Acceptance Criteria above are met AND:

- [ ] All TypeScript checks pass (zero errors)
- [ ] All ESLint checks pass (zero warnings)
- [ ] Migration 0025 applied and committed; `database.ts` regenerated
- [ ] `create-payment-order`, `razorpay-webhook`, `initiate-refund` Edge Functions deployed
- [ ] `generate-payment-receipt`, `email-payment-receipt` Edge Functions deployed
- [ ] Razorpay webhook URL registered in Razorpay dashboard (test mode)
- [ ] End-to-end payment test: initiate → checkout → webhook → 'paid' verified
- [ ] HMAC rejection test: invalid signature returns 400, no DB change confirmed
- [ ] Idempotency test: duplicate webhook returns 200 without double-update
- [ ] PR merged to `develop` with at least 1 reviewer approval
- [ ] `feature/22-payment-management` branch merged and deleted

---

## Risk Factors

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Webhook arrives before client-side success callback | Medium | Low | DB state is source of truth; client polls usePayment until status changes |
| RAZORPAY_KEY_SECRET accidentally logged in Edge Function output | Low | Critical | Use structured logging that explicitly excludes secrets; code review gate |
| Razorpay webhook replay causes double invoice.paid update | Low | High | Idempotency check on razorpay_payment_id before any update |
| Payment amount mismatch (client vs. invoice) | Low | High | create-payment-order reads amount from invoice.total_amount in DB; ignores client amount |
| Razorpay API downtime blocks payment initiation | Low | Medium | Show graceful error; provide vendor's bank details for manual transfer as fallback |

---

## Best Practices

- Never trust the client-side Razorpay success callback as the authoritative payment confirmation — always wait for the webhook
- Store the raw webhook body and signature in a `webhook_logs` table for 90 days for dispute resolution before processing
- Poll the payment status from the client while status = 'pending' — this covers the webhook latency gap and provides real-time feedback without WebSockets
- Use Razorpay test mode credentials in all non-production environments; gate live credentials behind a `RAZORPAY_LIVE_MODE` secret flag
- Keep `razorpay-webhook` stateless and idempotent — it may be called multiple times for the same event

---

## Estimated Completion

**4–5 working days.** The Razorpay integration and webhook handler are the highest-complexity pieces. End-to-end testing through the full checkout flow requires access to Razorpay test credentials and the webhook simulator. Allow an extra half-day for webhook registration and test environment setup.

---

---


# PHASE 23 — PROCUREMENT ANALYTICS

---

## Overview

| Field | Value |
|---|---|
| Phase Number | 23 |
| Phase Name | Procurement Analytics |
| Milestone | M6 — Analytics & Insights |
| PRD Reference | Module 37 — Analytics & Reports |
| DESIGN Reference | Section 3 (Company — Analytics Dashboard), F01, F03 |
| Estimated Duration | 5–6 days |
| Prerequisite Phases | Phase 15-22 complete (full procurement cycle data available) |

---

## Purpose

Phase 23 implements the procurement analytics dashboard for company users. This dashboard surfaces key metrics, trends, and insights across the entire procurement lifecycle: purchase requests, RFQs, quotations, purchase orders, deliveries, invoices, and payments. Aggregated views show spend by category, vendor, department, and time period. Trend charts visualize procurement velocity, approval times, vendor lead times, and payment cycles. The analytics are read-only and built on materialized views and pre-aggregated tables for performance.

---

## Business Goal

Procurement teams operate in the dark without visibility into aggregate spend, vendor performance trends, and bottleneck identification. Phase 23 transforms VendorFlow from a transactional system into a decision-support tool. Finance Managers see total committed spend and outstanding obligations. Procurement Managers identify vendors with the best lead times and most competitive pricing. Department heads track their team's procurement velocity. All insights are derived from the platform's own transaction data — no spreadsheet exports required.

---

## Dependencies

- Phases 15–22 complete (PR, RFQ, quotation, PO, shipment, GRN, invoice, payment data exist)
- Phase 13 complete (`product_categories` — used for spend-by-category)
- Phase 7 complete (`departments` — used for spend-by-department)
- Charting library: Recharts (already in tech stack from Phase 3)
- Phase 2 `KPICard`, `DataTable`, `PageHeader` components

---

## Database Tables

Migration: `0026_create_analytics.sql`

```sql
-- ============================================================
-- Migration: 0026_create_analytics
-- Description: Analytics materialized views and aggregation tables
-- ============================================================

-- Procurement summary per company per month
create table public.procurement_summary_monthly (
  id                    uuid primary key default gen_random_uuid(),
  company_id            uuid not null references public.companies(id),
  year                  integer not null,
  month                 integer not null check (month between 1 and 12),
  -- Requests
  pr_count              integer not null default 0,
  pr_total_budget       numeric(15,2),
  -- RFQs
  rfq_count             integer not null default 0,
  rfq_awarded_count     integer not null default 0,
  -- POs
  po_count              integer not null default 0,
  po_total_value        numeric(15,2) not null default 0,
  po_completed_count    integer not null default 0,
  -- Invoices
  invoice_count         integer not null default 0,
  invoice_total_value   numeric(15,2) not null default 0,
  -- Payments
  payment_count         integer not null default 0,
  payment_total_value   numeric(15,2) not null default 0,
  -- Computed
  avg_approval_days     numeric(5,2),   -- PR submission to approval
  avg_lead_time_days    numeric(5,2),   -- PO to delivery
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  constraint procurement_summary_monthly_unique
    unique (company_id, year, month)
);

create index idx_procurement_summary_company_year_month
  on public.procurement_summary_monthly(company_id, year, month);

-- Spend by category
create materialized view public.spend_by_category as
select
  po.company_id,
  pc.id as category_id,
  pc.name as category_name,
  extract(year from po.created_at)::integer as year,
  count(po.id) as po_count,
  sum(po.total_amount) as total_spend
from public.purchase_orders po
join public.po_items poi on poi.po_id = po.id
left join public.products p on p.id = poi.product_id
left join public.product_categories pc on pc.id = p.category_id
where po.status not in ('draft', 'cancelled')
group by po.company_id, pc.id, pc.name, year;

create unique index idx_spend_by_category_unique
  on public.spend_by_category(company_id, category_id, year);

-- Spend by vendor
create materialized view public.spend_by_vendor as
select
  po.company_id,
  v.id as vendor_id,
  v.name as vendor_name,
  extract(year from po.created_at)::integer as year,
  count(po.id) as po_count,
  sum(po.total_amount) as total_spend,
  avg(extract(epoch from (po.closed_at - po.created_at))/86400)::numeric(5,2) as avg_delivery_days
from public.purchase_orders po
join public.vendors v on v.id = po.vendor_id
where po.status = 'closed'
group by po.company_id, v.id, v.name, year;

create unique index idx_spend_by_vendor_unique
  on public.spend_by_vendor(company_id, vendor_id, year);

-- Refresh function for materialized views
create or replace function public.refresh_analytics_views()
returns void
language plpgsql
security definer
as $$
begin
  refresh materialized view concurrently public.spend_by_category;
  refresh materialized view concurrently public.spend_by_vendor;
end;
$$;

-- RLS
alter table public.procurement_summary_monthly enable row level security;

create policy "procurement_summary_company_read"
  on public.procurement_summary_monthly for select
  using (company_id = public.get_my_company_id());

-- Materialized views: no RLS (accessed via RPC that filters by company_id)
```

---

## Relationships

```
public.procurement_summary_monthly
  └── aggregated from: purchase_requests, rfqs, purchase_orders, invoices, payments

public.spend_by_category (materialized view)
  └── derived from: purchase_orders + po_items + products + product_categories

public.spend_by_vendor (materialized view)
  └── derived from: purchase_orders + vendors
```

---

## API Endpoints

| Operation | Method | Implementation | Notes |
|---|---|---|---|
| Get procurement KPIs | Server Component | Query `procurement_summary_monthly` for current month + YTD |  |
| Get spend by category | RPC | `get_spend_by_category(company_id, year)` | Queries materialized view |
| Get spend by vendor | RPC | `get_spend_by_vendor(company_id, year)` | Queries materialized view |
| Get trend data (12 months) | Server Component | Query `procurement_summary_monthly` for last 12 months | |
| Get approval time distribution | Server Component | Query `pr_approvals` with aggregation | |
| Get top vendors by spend | RPC | `get_top_vendors(company_id, year, limit)` | Uses `spend_by_vendor` |
| Refresh analytics | Edge Function | `refresh-analytics` | Calls `refresh_analytics_views()` |

**RPC functions** (created in migration):

```sql
create or replace function public.get_spend_by_category(
  p_company_id uuid,
  p_year integer
)
returns table (
  category_id   uuid,
  category_name text,
  po_count      bigint,
  total_spend   numeric
)
language plpgsql
security definer
as $$
begin
  if not exists (
    select 1 from public.profiles
    where id = auth.uid() and company_id = p_company_id
  ) then
    raise exception 'Access denied';
  end if;

  return query
  select sbc.category_id, sbc.category_name, sbc.po_count, sbc.total_spend
  from public.spend_by_category sbc
  where sbc.company_id = p_company_id
    and sbc.year = p_year
  order by sbc.total_spend desc;
end;
$$;
```

---

## Supabase Services Used

```
Supabase Database:
  - public.procurement_summary_monthly  — pre-aggregated KPIs per company per month
  - public.spend_by_category            — materialized view
  - public.spend_by_vendor              — materialized view
  - RPC functions for company-scoped analytics queries

Supabase Edge Functions:
  - refresh-analytics                   — refreshes materialized views (runs nightly via cron)
  - generate-analytics-report           — PDF/Excel export (Phase 31)

pg_cron job:
  - Daily at 01:00 UTC: refresh_analytics_views()
```

---

## Folder Structure

```
src/
├── app/
│   └── (company)/
│       └── analytics/
│           ├── page.tsx                            [Overview dashboard]
│           ├── procurement/
│           │   └── page.tsx                        [Procurement-specific analytics]
│           ├── vendors/
│           │   └── page.tsx                        [Vendor performance analytics]
│           └── finance/
│               └── page.tsx                        [Finance analytics]
└── components/
    └── modules/
        └── analytics/
            ├── kpi-grid.tsx
            ├── spend-by-category-chart.tsx
            ├── spend-by-vendor-chart.tsx
            ├── procurement-trend-chart.tsx
            ├── approval-time-chart.tsx
            ├── top-vendors-table.tsx
            └── index.ts
```

---

## UI Screens

### Screen 23.1 — Analytics Overview (`/company/analytics`)

`PageHeader`: title "Analytics", subtitle "Last updated: [timestamp]".

**KPI Grid** (8 cards, 2 rows):

| KPI Card | Value | Period |
|---|---|---|
| Total Spend (YTD) | Sum of po_total_value YTD | Year to date |
| Active POs | Count of POs with status 'accepted' or 'in_progress' | Current |
| Pending Approvals | Count of PRs with status 'submitted' | Current |
| Avg Approval Time | avg_approval_days from last 3 months | 3 months |
| Invoices Awaiting Approval | Count with status 'submitted' | Current |
| Outstanding Payments | Sum of invoice total where status = 'approved' | Current |
| Vendor Count | Distinct vendors from POs | YTD |
| Avg Lead Time | avg_lead_time_days from last 3 months | 3 months |

**Charts** (2×2 grid below KPIs):

1. **Procurement Trend** (line chart): PO count and PO total value over last 12 months
2. **Spend by Category** (pie chart): Top 10 categories by spend (current year)
3. **Spend by Vendor** (horizontal bar chart): Top 10 vendors by spend (current year)
4. **Approval Time Distribution** (histogram): PR approval times bucketed (0-1 day, 1-3 days, 3-7 days, 7+ days)

---

### Screen 23.2 — Procurement Analytics (`/company/analytics/procurement`)

`PageHeader`: title "Procurement Analytics".

Five sections:

1. **Request Metrics**: PR count, approval rate, rejection rate, avg approval time (line chart over 12 months)
2. **RFQ Metrics**: RFQ count, avg vendors per RFQ, award rate, avg response time
3. **PO Metrics**: PO count, total value, completion rate, cancellation rate
4. **Lead Time Analysis**: histogram of delivery lead times; avg lead time by category
5. **Department Performance**: table showing PR count, PO count, total spend per department

---

### Screen 23.3 — Vendor Analytics (`/company/analytics/vendors`)

`PageHeader`: title "Vendor Performance Analytics".

`TopVendorsTable`: sortable DataTable showing vendors ranked by:
- Total spend (default sort)
- PO count
- Avg delivery days
- On-time delivery %
- Invoice approval rate

Clicking a vendor row expands a detail panel showing:
- Spend trend (last 12 months line chart)
- Category breakdown (pie chart)
- Lead time trend
- Rating from Phase 24 (stub in Phase 23)

---

### Screen 23.4 — Finance Analytics (`/company/analytics/finance`)

`PageHeader`: title "Finance Analytics".

Four panels:

1. **Payment Metrics**: Total paid YTD, avg payment cycle days (invoice approval to payment completion), overdue invoices count
2. **Invoice Trend**: line chart of invoice count and invoice value over 12 months
3. **Payment Status Distribution**: donut chart (approved but unpaid, paid this month, overdue)
4. **Spend Forecast**: simple linear projection based on last 6 months trend (informational; not AI-based in v1)

---

## Components

### `KPIGrid`

```typescript
interface KPIGridProps {
  kpis: Array<{
    label:      string
    value:      string | number
    trend?:     { direction: 'up' | 'down'; percentage: number }
    period?:    string
    colour?:    'default' | 'success' | 'warning' | 'error'
  }>
}
```

Renders a responsive grid of `KPICard` components. Trend arrows shown when trend is provided.

### `SpendByCategoryChart`

```typescript
interface SpendByCategoryChartProps {
  data: Array<{ category_name: string; total_spend: number }>
}
```

Pie or donut chart using Recharts. Shows top 10 categories; aggregates the rest into "Other". Tooltips show percentage and amount.

### `SpendByVendorChart`

```typescript
interface SpendByVendorChartProps {
  data: Array<{ vendor_name: string; total_spend: number }>
}
```

Horizontal bar chart. Top 10 vendors by spend. Bars coloured by a gradient.

### `ProcurementTrendChart`

```typescript
interface ProcurementTrendChartProps {
  data: Array<{
    month:       string   // 'YYYY-MM'
    po_count:    number
    po_total:    number
  }>
}
```

Dual-axis line chart: left axis = PO count (line), right axis = PO total value (area fill). Last 12 months.

### `ApprovalTimeChart`

```typescript
interface ApprovalTimeChartProps {
  data: Array<{ bucket: string; count: number }>
}
```

Histogram showing PR approval time distribution. Buckets: 0-1 day, 1-3 days, 3-7 days, 7-14 days, 14+ days.

### `TopVendorsTable`

```typescript
interface TopVendorsTableProps {
  vendors: Array<{
    vendor_id:          string
    vendor_name:        string
    total_spend:        number
    po_count:           number
    avg_delivery_days:  number
    on_time_rate:       number   // Phase 24 computed
    rating:             number   // Phase 24 computed
  }>
  sortBy?: 'total_spend' | 'po_count' | 'avg_delivery_days'
}
```

`DataTable` with expandable row detail showing vendor-specific charts.

---

## Forms

No forms in Phase 23. Analytics is read-only.

---

## Tables

### Top Vendors Table

| Column | Sortable | Filterable |
|---|---|---|
| Vendor Name | Yes | Yes (search) |
| Total Spend | Yes | No |
| PO Count | Yes | No |
| Avg Delivery Days | Yes | No |
| On-Time % | Yes | No |
| Rating | Yes | No |
| Actions | No | No |

---

## Permissions

```
View analytics:
  - Permission: has_permission('analytics', 'view')
  - Roles: Procurement Manager, Finance Manager, Company Admin
  - Employee role: no access (data sensitivity)

Refresh analytics (manual):
  - Permission: has_permission('analytics', 'refresh')
  - Roles: Platform Admin only (triggered via admin panel)
  - Auto-refresh runs nightly via pg_cron

Export reports:
  - Permission: has_permission('analytics', 'export')
  - Roles: Finance Manager, Procurement Manager
  - Export formats: PDF, Excel (Phase 31)
```

---

## Validation Rules

```
Date range filters:
  - max range: 24 months in a single query
  - default: last 12 months

Category / vendor filters:
  - multi-select with max 20 items selected

Materialized view refresh:
  - Manual refresh allowed max once per hour per user
  - Auto-refresh via cron: daily at 01:00 UTC
  - Refresh duration: ~5-10 seconds for 10k POs
```

---

## Business Rules

```
BR-23.1  Analytics data is aggregated at the company level. Cross-company analytics
         are not available to company users — only Platform Admins can see platform-
         wide metrics (Phase 27).

BR-23.2  Draft and cancelled records are excluded from all spend calculations.
         Only POs with status in ('sent', 'accepted', 'in_progress', 'delivered', 'closed')
         contribute to spend metrics.

BR-23.3  Approval time is measured from pr.submitted_at to pr.approved_at.
         If multiple approval steps exist, the time from submission to final approval
         is used (not the sum of each step).

BR-23.4  Lead time is measured from po.created_at to shipment.status = 'delivered'.
         POs without a shipment or with status != 'delivered' are excluded from
         lead time averages.

BR-23.5  On-time delivery % is computed as: (count of shipments delivered on or before
         estimated_delivery) / (total shipments delivered). Computed in Phase 24;
         stubbed as 0% in Phase 23.

BR-23.6  Materialized views are refreshed nightly. Real-time analytics are not
         supported in v1 — users see data as of the last refresh timestamp.

BR-23.7  All monetary values are summed in the invoice/PO currency (INR default).
         Multi-currency conversion is not supported in v1 — all amounts assumed INR.
```

---

## Security

```
- Analytics RPC functions enforce company_id matching via auth.uid() → profiles.company_id.
  A user from Company A cannot query Company B's analytics by passing a different company_id.

- Materialized views have no RLS. They are accessed only via RPC functions that filter by
  company_id. Direct SELECT on the materialized view is blocked for non-admin roles via
  Postgres GRANT restrictions.

- The refresh-analytics Edge Function is callable only by users with Platform Admin role.
  Non-admin users cannot trigger manual refreshes.

- KPI cards that show "Pending Approvals" and "Outstanding Payments" surface aggregate
  counts and sums — no PII or vendor-specific sensitive data is revealed.
```

---

## State Management

```typescript
// Procurement KPIs
export function useProcurementKPIs(companyId: string) {
  const supabase = useSupabase()
  return useQuery({
    queryKey: ['analytics', 'kpis', companyId],
    queryFn: async () => {
      // Fetch current month + YTD from procurement_summary_monthly
      const currentYear = new Date().getFullYear()
      const currentMonth = new Date().getMonth() + 1
      
      const { data, error } = await supabase
        .from('procurement_summary_monthly')
        .select('*')
        .eq('company_id', companyId)
        .eq('year', currentYear)
        .order('month', { ascending: false })
        .limit(12)
      
      if (error) throw error
      return computeKPIs(data)
    },
    staleTime: 5 * 60 * 1000,   // 5 minutes
  })
}

// Spend by category
export function useSpendByCategory(companyId: string, year: number) {
  const supabase = useSupabase()
  return useQuery({
    queryKey: ['analytics', 'spend-by-category', companyId, year],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_spend_by_category', {
        p_company_id: companyId,
        p_year: year,
      })
      if (error) throw error
      return data ?? []
    },
    staleTime: 10 * 60 * 1000,  // 10 minutes
  })
}
```

Analytics queries have longer stale times (5-10 minutes) because the underlying data is refreshed nightly. Real-time updates are not needed.

---

## Development Tasks

### Task 23.1 — Migration
Apply migration `0026_create_analytics.sql`. Create `procurement_summary_monthly` table, materialized views, RPC functions, and `refresh_analytics_views()` function. Regenerate `database.ts` types.

### Task 23.2 — pg_cron Setup
Configure pg_cron job to run `select public.refresh_analytics_views()` daily at 01:00 UTC. Test manual execution.

### Task 23.3 — Populate Historical Data
Write a one-time data migration script that populates `procurement_summary_monthly` from existing PR, RFQ, PO, invoice, payment data for the last 24 months. Run the script after migration 0026.

### Task 23.4 — KPIGrid Component
Implement `KPIGrid` with trend arrows. Wire to `useProcurementKPIs` hook.

### Task 23.5 — Chart Components
Implement `SpendByCategoryChart` (pie), `SpendByVendorChart` (bar), `ProcurementTrendChart` (line), `ApprovalTimeChart` (histogram) using Recharts.

### Task 23.6 — Analytics Overview Page
Implement `/company/analytics/page.tsx` with KPI grid and 4-chart layout. Test with populated historical data.

### Task 23.7 — Procurement Analytics Page
Implement `/company/analytics/procurement/page.tsx` with PR, RFQ, PO metrics and department performance table.

### Task 23.8 — Vendor Analytics Page
Implement `/company/analytics/vendors/page.tsx` with `TopVendorsTable`. Stub on-time % and rating columns (Phase 24 will populate).

### Task 23.9 — Finance Analytics Page
Implement `/company/analytics/finance/page.tsx` with payment metrics, invoice trend chart, and payment status donut chart.

### Task 23.10 — refresh-analytics Edge Function
Implement: verify Platform Admin role; call `refresh_analytics_views()`; return refresh timestamp. Expose in admin panel (Phase 27).

---

## Testing Checklist

```
✓ Migration 0026: procurement_summary_monthly, materialized views, RPC functions created
✓ pg_cron job configured: runs daily at 01:00 UTC
✓ Historical data populated: procurement_summary_monthly has last 24 months
✓ Materialized view refresh: completes in < 15 seconds with 10k POs
✓ RPC get_spend_by_category: filters by company_id; Company A cannot see Company B data
✓ RPC get_spend_by_vendor: same company isolation verified
✓ KPI cards: all 8 values populate correctly from procurement_summary_monthly
✓ Spend by category chart: displays top 10 categories; "Other" aggregates the rest
✓ Spend by vendor chart: top 10 vendors ranked by spend
✓ Procurement trend chart: last 12 months of PO count and value displayed
✓ Approval time histogram: PR approval times bucketed correctly
✓ Department performance table: spend aggregated by department
✓ TopVendorsTable: sortable by spend, PO count, delivery days
✓ Manual refresh: Platform Admin can trigger; non-admin blocked with permission error
✓ Permission check: Employee role returns 403 on analytics page
✓ pnpm build: zero TypeScript errors; pnpm lint: zero warnings
```

---

## Acceptance Criteria

```
AC-23.1  Migration 0026 applied; analytics tables and views created
AC-23.2  pg_cron job runs nightly; materialized views refresh automatically
AC-23.3  Historical data populated for last 24 months
AC-23.4  Analytics overview page shows 8 KPI cards and 4 charts
AC-23.5  All charts render with correct data from materialized views
AC-23.6  RPC functions enforce company_id isolation via RLS
AC-23.7  Procurement, Vendor, Finance analytics pages functional
AC-23.8  Platform Admin can manually refresh; non-admin blocked
AC-23.9  Employee role cannot access analytics pages (403)
AC-23.10 Materialized view refresh completes in acceptable time (<30s for 10k POs)
```

---

## Definition of Done

Phase 23 is complete when all Acceptance Criteria above are met AND:

- [ ] All TypeScript checks pass (zero errors)
- [ ] All ESLint checks pass (zero warnings)
- [ ] Migration 0026 applied and committed; `database.ts` regenerated
- [ ] pg_cron job configured and verified via test execution
- [ ] Historical data migration script written and executed
- [ ] All 4 analytics pages functional with real data
- [ ] RPC company isolation verified via test with two company accounts
- [ ] Permission gates tested: Employee, Procurement Manager, Finance Manager access levels
- [ ] PR merged to `develop` with at least 1 reviewer approval
- [ ] `feature/23-procurement-analytics` branch merged and deleted

---

## Risk Factors

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Materialized view refresh blocks DB writes during refresh | Low | Medium | Use REFRESH MATERIALIZED VIEW CONCURRENTLY; requires unique indexes (already defined) |
| pg_cron job fails silently | Medium | Low | Add monitoring; log refresh completion to a `cron_logs` table; alert if last refresh > 36 hours old |
| Historical data migration script times out | Medium | Low | Run in batches (1 month at a time); use advisory locks to prevent concurrent runs |
| Analytics data stale for 24 hours confusing users | Medium | Low | Display "Last updated: [timestamp]" on every analytics page |
| Chart rendering slow with large datasets | Low | Low | Limit queries to 12-24 months max; pre-aggregate data in the view rather than fetching raw records |

---

## Best Practices

- Use CONCURRENTLY when refreshing materialized views to avoid locking the underlying tables
- Pre-aggregate data in `procurement_summary_monthly` rather than querying raw tables at runtime — this scales better as transaction volume grows
- Store the last refresh timestamp in a `system_settings` table and display it on every analytics page so users know data freshness
- Avoid real-time analytics in v1 — nightly refresh is sufficient for procurement data which changes at a human-paced cadence
- Keep RPC functions thin — all business logic (filtering, aggregation) should be in the materialized view; RPC just enforces access control

---

## Estimated Completion

**5–6 working days.** The materialized views and RPC functions are straightforward. The bulk of the time is spent on the four analytics pages with their chart components and the historical data migration script. Allow an extra day for pg_cron setup and testing across a full refresh cycle.

---

---

# PHASE 24 — VENDOR PERFORMANCE & REVIEWS

---

## Overview

| Field | Value |
|---|---|
| Phase Number | 24 |
| Phase Name | Vendor Performance & Reviews |
| Milestone | M6 — Analytics & Insights |
| PRD Reference | Module 28 — Reviews & Ratings |
| DESIGN Reference | Section 3 (Company — Vendors — Performance, Vendor — Dashboard), F01, F03 |
| Estimated Duration | 3–4 days |
| Prerequisite Phases | Phase 20 (GRN — closed PO), Phase 22 (Payment — completed cycle), Phase 23 (Analytics) |

---

## Purpose

Phase 24 implements the vendor performance review system. After a PO is closed (GRN confirmed and payment completed), the company can submit a structured review of the vendor's performance across five dimensions: delivery timeliness, product quality, communication, pricing accuracy, and overall satisfaction. Aggregated ratings are shown on the vendor's public profile (Phase 10) and feed the performance scoring visible in the analytics dashboard (Phase 23). Vendors can read their own reviews and track their performance scores over time.

---

## Business Goal

Vendor ratings create accountability. When vendors know their performance is measured and visible to potential buyers, they are incentivised to deliver on time, maintain quality, and communicate proactively. For buying companies, performance data de-risks vendor selection in future RFQs — a vendor with a strong delivery track record is a lower-risk choice than an unknown vendor, even if the unknown vendor quotes lower. Phase 24 transforms historical transaction data into forward-looking procurement intelligence.

---

## Dependencies

- Phase 20 complete (`purchase_orders` — status = 'closed' triggers review eligibility)
- Phase 22 complete (`payments` — status = 'completed')
- Phase 10 complete (vendor profile — review display stub)
- Phase 2 `DataTable`, `PageHeader`, `KPICard`, `StatusBadge` components

---

## Database Tables

Migration: `0027_create_vendor_reviews.sql`

```sql
-- ============================================================
-- Migration: 0027_create_vendor_reviews
-- Description: Vendor performance reviews and ratings
-- ============================================================

create table public.vendor_reviews (
  id                  uuid primary key default gen_random_uuid(),
  vendor_id           uuid not null references public.vendors(id),
  company_id          uuid not null references public.companies(id),
  po_id               uuid not null references public.purchase_orders(id),
  reviewed_by         uuid not null references public.profiles(id),
  -- Dimension ratings (1–5)
  rating_delivery     smallint not null check (rating_delivery between 1 and 5),
  rating_quality      smallint not null check (rating_quality between 1 and 5),
  rating_communication smallint not null check (rating_communication between 1 and 5),
  rating_pricing      smallint not null check (rating_pricing between 1 and 5),
  rating_overall      smallint not null check (rating_overall between 1 and 5),
  -- Free text
  title               text,
  review_text         text,
  -- Computed
  average_rating      numeric(3,2) generated always as (
    (rating_delivery + rating_quality + rating_communication +
     rating_pricing + rating_overall) / 5.0
  ) stored,
  -- Visibility
  is_public           boolean not null default true,
  is_flagged          boolean not null default false,  -- flagged for moderation
  -- Lifecycle
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  constraint vendor_review_po_unique unique (po_id, company_id)  -- one review per PO
);

create index idx_vendor_reviews_vendor_id   on public.vendor_reviews(vendor_id);
create index idx_vendor_reviews_company_id  on public.vendor_reviews(company_id);
create index idx_vendor_reviews_po_id       on public.vendor_reviews(po_id);
create index idx_vendor_reviews_rating      on public.vendor_reviews(average_rating desc);

create trigger trg_vendor_reviews_updated_at
  before update on public.vendor_reviews
  for each row execute function public.handle_updated_at();

-- Vendor performance aggregate (updated via trigger)
create table public.vendor_performance (
  vendor_id             uuid primary key references public.vendors(id),
  total_reviews         integer not null default 0,
  avg_delivery          numeric(3,2),
  avg_quality           numeric(3,2),
  avg_communication     numeric(3,2),
  avg_pricing           numeric(3,2),
  avg_overall           numeric(3,2),
  overall_score         numeric(3,2),   -- weighted average across all dimensions
  on_time_delivery_rate numeric(5,2),   -- % of POs delivered on or before estimated
  po_completed_count    integer not null default 0,
  total_spend           numeric(15,2)   not null default 0,
  last_review_at        timestamptz,
  updated_at            timestamptz not null default now()
);

-- Update vendor_performance on insert/update of vendor_reviews
create or replace function public.update_vendor_performance()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into public.vendor_performance (
    vendor_id, total_reviews,
    avg_delivery, avg_quality, avg_communication, avg_pricing, avg_overall,
    overall_score, last_review_at, updated_at
  )
  select
    vendor_id,
    count(*),
    avg(rating_delivery),
    avg(rating_quality),
    avg(rating_communication),
    avg(rating_pricing),
    avg(rating_overall),
    avg(average_rating),
    max(created_at),
    now()
  from public.vendor_reviews
  where vendor_id = coalesce(new.vendor_id, old.vendor_id)
    and is_flagged = false
  group by vendor_id
  on conflict (vendor_id) do update set
    total_reviews     = excluded.total_reviews,
    avg_delivery      = excluded.avg_delivery,
    avg_quality       = excluded.avg_quality,
    avg_communication = excluded.avg_communication,
    avg_pricing       = excluded.avg_pricing,
    avg_overall       = excluded.avg_overall,
    overall_score     = excluded.overall_score,
    last_review_at    = excluded.last_review_at,
    updated_at        = now();
  return coalesce(new, old);
end;
$$;

create trigger trg_update_vendor_performance
  after insert or update or delete on public.vendor_reviews
  for each row execute function public.update_vendor_performance();

-- RLS
alter table public.vendor_reviews    enable row level security;
alter table public.vendor_performance enable row level security;

-- Company writes own reviews
create policy "vendor_reviews_company_write"
  on public.vendor_reviews for all
  using (company_id = public.get_my_company_id());

-- All authenticated users can read public, non-flagged reviews
create policy "vendor_reviews_public_read"
  on public.vendor_reviews for select
  using (is_public = true and is_flagged = false);

-- Vendor reads reviews about themselves
create policy "vendor_reviews_vendor_read"
  on public.vendor_reviews for select
  using (vendor_id = public.get_my_vendor_id());

-- Vendor performance: all authenticated users can read
create policy "vendor_performance_read"
  on public.vendor_performance for select
  to authenticated
  using (true);
```

---

## Relationships

```
public.purchase_orders (1)
  └── public.vendor_reviews (1)          — one review per closed PO per company

public.vendor_reviews (N)
  └── aggregated into public.vendor_performance (1 per vendor)

public.vendor_performance
  └── displayed on public.vendors (vendor profile — Phase 10)
  └── used in public.spend_by_vendor analytics (Phase 23)
```

---

## API Endpoints

| Operation | Method | Implementation | Notes |
|---|---|---|---|
| Create vendor review | Client mutation | `supabase.from('vendor_reviews').insert()` | Requires po.status = 'closed' |
| Update review | Client mutation | `supabase.from('vendor_reviews').update()` | Company only; within 30 days of creation |
| Get reviews for vendor | Server Component | `supabase.from('vendor_reviews').select('*, companies(name)')` | Public + non-flagged |
| Get own review for PO | Server Component | `supabase.from('vendor_reviews').select('*').eq('po_id', id).eq('company_id', id)` | Company side |
| Get vendor performance | Server Component | `supabase.from('vendor_performance').select('*').eq('vendor_id', id)` | Public |
| Flag review | Edge Function | `flag-review` | Company flags own review; platform admin reviews flagged content |

---

## Supabase Services Used

```
Supabase Database:
  - public.vendor_reviews     — review records with dimension ratings
  - public.vendor_performance — aggregated performance scores (trigger-maintained)

Supabase Edge Functions:
  - flag-review               — sets is_flagged = true; queued for admin moderation
```

---

## Folder Structure

```
src/
├── app/
│   ├── (company)/
│   │   └── procurement/
│   │       └── purchase-orders/
│   │           └── [id]/
│   │               └── review/
│   │                   └── page.tsx        [Submit vendor review]
│   └── (vendor)/
│       └── performance/
│           └── page.tsx                    [Vendor: view own performance]
└── components/
    └── modules/
        └── reviews/
            ├── vendor-review-form.tsx
            ├── vendor-review-card.tsx
            ├── vendor-rating-stars.tsx
            ├── vendor-performance-panel.tsx
            ├── vendor-reviews-list.tsx
            └── index.ts
```

---

## UI Screens

### Screen 24.1 — Submit Vendor Review (`/company/procurement/purchase-orders/[id]/review`)

Accessible when po.status = 'closed' and no review exists for this po_id + company_id.

`PageHeader`: title "Review [Vendor Name]", breadcrumb PO Detail → Submit Review.

`VendorReviewForm`: Five star-rating rows (Delivery, Quality, Communication, Pricing, Overall) + title text input + review_text textarea + is_public toggle.

"Submit Review" button. On success: redirect to PO detail with a toast notification and "Review Submitted" badge on the PO.

---

### Screen 24.2 — Vendor Reviews on Profile (Company View)

Embedded in vendor profile page (Phase 10). `VendorPerformancePanel` shows the aggregate score card: star ratings per dimension + overall score + review count.

Below: `VendorReviewsList` — paginated list of public reviews (newest first) showing reviewer company name (anonymous if company sets is_public = false), date, star ratings, title, and review_text.

---

### Screen 24.3 — Vendor Performance Dashboard (`/vendor/performance`)

`PageHeader`: title "Your Performance".

**Performance Score Card**:
- Overall score (large, out of 5)
- Breakdown: Delivery, Quality, Communication, Pricing, Overall (5 rows with star display and numeric score)
- Total reviews count
- On-time delivery rate (%)
- Total completed POs

`VendorReviewsList`: list of all public reviews submitted about this vendor (newest first). Vendor can read but cannot reply in v1.

---

## Components

### `VendorReviewForm`

```typescript
interface VendorReviewFormProps {
  vendorId:    string
  poId:        string
  vendorName:  string
  onSubmit:    (data: ReviewFormData) => Promise<void>
  isLoading?:  boolean
}
```

Five `VendorRatingStars` rows. Title text input. Review textarea. Is_public toggle with helper text "Other vendors will not see your company name if you turn this off."

### `VendorRatingStars`

```typescript
interface VendorRatingStarsProps {
  label:     string
  value:     number        // 1–5
  onChange?: (value: number) => void
  readOnly?: boolean
}
```

Interactive star selector (5 stars). In read-only mode: renders filled/half/empty stars. Labels: "Poor", "Fair", "Good", "Very Good", "Excellent" shown on hover.

### `VendorPerformancePanel`

```typescript
interface VendorPerformancePanelProps {
  performance: VendorPerformance
}
```

Compact card with 5 dimension bars + overall score. Used on vendor profile (Phase 10) and Phase 24 vendor performance page.

### `VendorReviewCard`

```typescript
interface VendorReviewCardProps {
  review:        VendorReview
  showCompany?:  boolean
}
```

Single review display: date, star rating bar, title (if any), review text. Company name shown only when `is_public = true && showCompany`.

### `VendorReviewsList`

```typescript
interface VendorReviewsListProps {
  vendorId:   string
  limit?:     number
  compact?:   boolean
}
```

Paginated (10 per page) list of `VendorReviewCard` components. "Show more" button for pagination. Empty state: "No reviews yet."

---

## Forms

### Form 24.1 — Vendor Review Form

| Field | Type | Validation |
|---|---|---|
| Delivery rating | star selector | Required, 1–5 |
| Quality rating | star selector | Required, 1–5 |
| Communication rating | star selector | Required, 1–5 |
| Pricing rating | star selector | Required, 1–5 |
| Overall rating | star selector | Required, 1–5 |
| Title | text input | Optional, max 100 chars |
| Review text | textarea | Optional, max 1000 chars |
| Is public | toggle | Default true |

```typescript
const vendorReviewSchema = z.object({
  rating_delivery:      z.number().int().min(1).max(5),
  rating_quality:       z.number().int().min(1).max(5),
  rating_communication: z.number().int().min(1).max(5),
  rating_pricing:       z.number().int().min(1).max(5),
  rating_overall:       z.number().int().min(1).max(5),
  title:                z.string().max(100).optional(),
  review_text:          z.string().max(1000).optional(),
  is_public:            z.boolean().default(true),
})
```

---

## Tables

### Reviews List Table (within vendor profile)

| Column | Sortable | Filterable |
|---|---|---|
| Date | Yes | Yes (date range) |
| Rating | Yes | Yes (min rating filter) |
| Title | No | No |
| Review Text | No | No |
| Company | No | No (hidden if not public) |

---

## Permissions

```
Submit review:
  - Company user with has_permission('vendor_reviews', 'create')
  - Roles: Procurement Manager, Procurement Officer
  - PO must have status = 'closed'
  - One review per PO per company (unique constraint)

Edit review:
  - Same company + same user who created + within 30 days

Delete review:
  - Platform Admin only (for moderation)

Read reviews:
  - All authenticated users can read public, non-flagged reviews
  - Vendor reads all reviews about themselves (including from companies they can identify)

View vendor performance scores:
  - All authenticated users
```

---

## Validation Rules

```
Review eligibility:
  - po.status must be 'closed'
  - No existing review for this (po_id, company_id) pair
  - reviewed_by must belong to po.company_id

Ratings:
  - All five dimension ratings required (1–5)
  - No half-stars stored; only integer values

Edit window:
  - Reviews can be edited within 30 days of creation
  - After 30 days: read-only

Review text:
  - Optional but max 1000 chars
  - Basic sanitisation (strip HTML) applied before storage

On-time delivery rate:
  - Computed in trigger function:
    on_time_rate = count(shipments where actual_delivery <= estimated_delivery)
                   / count(all delivered shipments for this vendor) * 100
```

---

## Business Rules

```
BR-24.1  One review per Purchase Order per company. If a company wants to review
         the same vendor for a different PO, that is a separate review record.

BR-24.2  Reviews are public by default. Company users can opt out by setting
         is_public = false, in which case the review text is visible but the
         company name is shown as "Anonymous Buyer".

BR-24.3  Vendor performance scores are updated automatically via a database trigger
         whenever a review is inserted, updated, or deleted. There is no batch
         recalculation job — scores are always current.

BR-24.4  Flagged reviews (is_flagged = true) are excluded from all aggregate
         calculations and hidden from all public views until a Platform Admin
         reviews and either unflagged or deletes them.

BR-24.5  The "Submit Review" CTA appears on the PO detail page only when
         po.status = 'closed' and no review exists for that PO. After submission,
         the CTA is replaced by an "Edit Review" link (within the 30-day window).

BR-24.6  Vendors can see their own aggregate performance score but cannot see which
         specific companies gave them which ratings unless is_public = true and
         the company has not opted for anonymity.

BR-24.7  On-time delivery rate is computed from shipments.actual_delivery vs
         shipments.estimated_delivery. If estimated_delivery was not set, the
         shipment is excluded from the on-time rate calculation.
```

---

## Security

```
- vendor_reviews RLS: company writes own; vendor reads own (and public non-flagged).
  A company cannot read another company's private (is_public = false) reviews.

- average_rating is a generated column — computed by Postgres, not by the client.
  Clients cannot set average_rating directly; inserts that include it are rejected.

- Review edit window (30 days) is enforced via a Postgres trigger check rather than
  application-side logic to prevent bypass via direct API calls.

- Flagged review moderation is a Platform Admin function. Company users can flag
  their own reviews; they cannot flag other companies' reviews.

- vendor_performance is updated via a SECURITY DEFINER trigger function.
  The aggregation runs with elevated privileges but only touches vendor_performance
  for the specific vendor_id in the triggering review row.
```

---

## State Management

```typescript
// Vendor performance for a specific vendor
export function useVendorPerformance(vendorId: string) {
  const supabase = useSupabase()
  return useQuery({
    queryKey: ['vendor-performance', vendorId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vendor_performance')
        .select('*')
        .eq('vendor_id', vendorId)
        .maybeSingle()
      if (error) throw error
      return data
    },
    staleTime: 5 * 60 * 1000,   // 5 minutes; updated by triggers
  })
}

// Reviews for a vendor (public list)
export function useVendorReviews(vendorId: string, page = 1, limit = 10) {
  const supabase = useSupabase()
  return useQuery({
    queryKey: ['vendor-reviews', vendorId, page],
    queryFn: async () => {
      const from = (page - 1) * limit
      const { data, error, count } = await supabase
        .from('vendor_reviews')
        .select('*, companies(name)', { count: 'exact' })
        .eq('vendor_id', vendorId)
        .eq('is_public', true)
        .eq('is_flagged', false)
        .order('created_at', { ascending: false })
        .range(from, from + limit - 1)
      if (error) throw error
      return { reviews: data ?? [], total: count ?? 0 }
    },
    staleTime: 2 * 60 * 1000,
  })
}
```

After submitting or editing a review, invalidate `['vendor-reviews', vendorId]` and `['vendor-performance', vendorId]`.

---

## Development Tasks

### Task 24.1 — Migration
Apply migration `0027_create_vendor_reviews.sql`. Verify `vendor_reviews`, `vendor_performance` tables, generated column, performance trigger function, and RLS. Regenerate `database.ts` types.

### Task 24.2 — VendorRatingStars Component
Implement interactive and read-only star selector. Accessible: keyboard navigable; ARIA label per star.

### Task 24.3 — VendorReviewForm
Implement form with all 5 rating dimensions and optional text fields. Wire validation. "Submit" calls insert mutation; on success navigate to PO detail.

### Task 24.4 — Submit Review Page
Implement `/company/procurement/purchase-orders/[id]/review/page.tsx`. Guard: if po.status != 'closed' or review exists, redirect to PO detail.

### Task 24.5 — VendorPerformancePanel and VendorReviewsList
Implement both components. Wire `VendorPerformancePanel` into vendor profile page (Phase 10 Screen 10.3) and the vendor dashboard.

### Task 24.6 — Vendor Performance Page (Vendor)
Implement `/vendor/performance/page.tsx` with performance score card and reviews list.

### Task 24.7 — PO Detail Hook-up
Add "Leave a Review" CTA to company PO detail page (Phase 18) when po.status = 'closed' and no review exists. Add "View Review" link when review exists.

### Task 24.8 — Performance Trigger Testing
Test trigger: insert review → verify vendor_performance row updated. Delete review → verify score recalculated. Update rating → verify score updated.

### Task 24.9 — flag-review Edge Function
Implement flag: sets is_flagged = true; excludes from performance calculation immediately.

---

## Testing Checklist

```
✓ Migration 0027: vendor_reviews, vendor_performance tables, trigger, RLS active
✓ average_rating generated column: computed correctly as 5-dimension average
✓ Performance trigger: inserting review updates vendor_performance immediately
✓ Performance trigger: deleting review recalculates score
✓ Performance trigger: flagged review excluded from aggregation
✓ Review creation blocked when po.status != 'closed'
✓ Duplicate review blocked: second review for same po_id + company_id fails with unique error
✓ Edit within 30 days: allowed
✓ Edit after 30 days: blocked with error
✓ is_public = false: company name replaced with "Anonymous Buyer" in public view
✓ Vendor reads own reviews including anonymous ones
✓ Company A cannot read Company B's private reviews (RLS)
✓ VendorRatingStars: keyboard-navigable; correct ARIA labels
✓ VendorPerformancePanel: renders all 5 dimension bars
✓ Vendor performance page: all metrics correct
✓ Flag review: review excluded from performance and public views immediately
✓ pnpm build: zero TypeScript errors; pnpm lint: zero warnings
```

---

## Acceptance Criteria

```
AC-24.1  Migration 0027 applied; vendor_reviews and vendor_performance active with RLS
AC-24.2  Company can submit review for closed PO; one review per PO per company
AC-24.3  Performance trigger updates vendor_performance on every review change
AC-24.4  Flagged reviews excluded from aggregate scores and public display
AC-24.5  Review edit allowed within 30 days; blocked after
AC-24.6  VendorPerformancePanel shows on vendor profile page
AC-24.7  Vendor performance page shows own scores and reviews
AC-24.8  RLS: private reviews not visible to other companies; vendor reads own
AC-24.9  Star selector is accessible (keyboard-navigable, correct ARIA labels)
```

---

## Definition of Done

Phase 24 is complete when all Acceptance Criteria above are met AND:

- [ ] All TypeScript checks pass (zero errors)
- [ ] All ESLint checks pass (zero warnings)
- [ ] Migration 0027 applied and committed; `database.ts` regenerated
- [ ] Performance trigger verified: all three cases (insert, update, delete)
- [ ] Review eligibility guard on submit page verified
- [ ] VendorPerformancePanel wired into Phase 10 vendor profile page
- [ ] ARIA accessibility verified on VendorRatingStars
- [ ] PR merged to `develop` with at least 1 reviewer approval
- [ ] `feature/24-vendor-performance` branch merged and deleted

---

## Risk Factors

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Performance trigger fires on every PR row update (not just reviews) | N/A | N/A | Trigger is on vendor_reviews only; no cross-table side effects |
| Concurrent review inserts race condition on vendor_performance | Low | Low | INSERT … ON CONFLICT DO UPDATE is atomic; concurrent upserts are safe |
| Fake reviews from the same company on multiple POs skewing scores | Low | Medium | One review per PO enforced; company cannot create fake POs without going through full procurement cycle |
| 30-day edit window enforced only in application layer | Low | Medium | Add a Postgres trigger CHECK on updated_at - created_at; reject updates outside the window at DB level |

---

## Best Practices

- Use a database trigger for `vendor_performance` aggregation — never rely on application-level recalculation jobs for aggregate scores
- Store `average_rating` as a generated column, not application-computed — this guarantees mathematical consistency across all review records
- Keep the review form short (5 ratings + optional text) — long forms reduce completion rates for review prompts
- Surface the "Leave a Review" prompt in context (on the PO detail page) rather than as a standalone notification — contextual prompts have higher conversion

---

## Estimated Completion

**3–4 working days.** The database trigger and performance aggregation are the core pieces. The UI (review form, star selector, performance panel) is straightforward component work. Allow extra time for accessibility testing of the interactive star selector.

---

---

# PHASE 25 — NOTIFICATION SYSTEM

---

## Overview

| Field | Value |
|---|---|
| Phase Number | 25 |
| Phase Name | Notification System |
| Milestone | M6 — Analytics & Insights |
| PRD Reference | Module 29 — Notification Center, Module 30 — Email, Module 31 — In-App |
| DESIGN Reference | Section 3 (Notification Bell, Notification Center Page), F01, F03 |
| Estimated Duration | 4–5 days |
| Prerequisite Phases | Phases 15–24 (procurement lifecycle complete — all notification trigger points exist) |

---

## Purpose

Phase 25 implements the full notification system: in-app notifications delivered in real time via Supabase Realtime and email notifications sent via Resend. Notifications are generated by procurement lifecycle events across all previous phases (PR submitted, RFQ received, quotation submitted, PO created, shipment updated, GRN confirmed, invoice submitted, payment completed, review received). This phase retroactively wires all the notification stubs left in Phases 15–24 to the live notification infrastructure.

---

## Business Goal

Timely notifications eliminate the need for users to manually check the platform for status changes. A Procurement Officer should be told when a vendor submits a quotation — not discover it on their next login. A vendor should know immediately when their PO is accepted. Without proactive notifications, procurement delays accumulate: approvals are missed, deadlines pass unchecked, and payments are delayed. Phase 25 makes the platform self-alerting, reducing procurement cycle times and ensuring no critical event goes unnoticed.

---

## Dependencies

- Phases 15–24 complete (all lifecycle tables exist; notification triggers span all phases)
- Resend account configured; `RESEND_API_KEY` in Edge Function secrets
- Phase 4 complete (`profiles` — email addresses for notification recipients)
- Phase 2 `NotificationBell`, `NotificationCenter` components (built here)
- Supabase Realtime enabled on `notifications` table

---

## Database Tables

Migration: `0028_create_notifications.sql`

```sql
-- ============================================================
-- Migration: 0028_create_notifications
-- Description: In-app and email notification system
-- ============================================================

create table public.notifications (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references public.profiles(id) on delete cascade,
  type            text not null,     -- 'pr_submitted', 'rfq_received', 'po_accepted', etc.
  title           text not null,
  body            text not null,
  action_url      text,              -- deep link to the relevant record
  reference_type  text,              -- 'purchase_request', 'rfq', 'purchase_order', etc.
  reference_id    uuid,              -- FK to the referenced record
  is_read         boolean not null default false,
  is_email_sent   boolean not null default false,
  channel         text not null default 'in_app'
                    check (channel in ('in_app', 'email', 'both')),
  created_at      timestamptz not null default now(),
  read_at         timestamptz
);

create index idx_notifications_user_id    on public.notifications(user_id);
create index idx_notifications_is_read    on public.notifications(user_id, is_read);
create index idx_notifications_created_at on public.notifications(created_at desc);
create index idx_notifications_type       on public.notifications(type);

-- Notification preferences per user
create table public.notification_preferences (
  user_id         uuid primary key references public.profiles(id) on delete cascade,
  -- Channel preferences per event type (JSONB for flexibility)
  preferences     jsonb not null default '{
    "pr_submitted":      {"in_app": true, "email": true},
    "pr_approved":       {"in_app": true, "email": true},
    "pr_rejected":       {"in_app": true, "email": true},
    "rfq_received":      {"in_app": true, "email": true},
    "rfq_closed":        {"in_app": true, "email": false},
    "quotation_received":{"in_app": true, "email": true},
    "po_created":        {"in_app": true, "email": true},
    "po_accepted":       {"in_app": true, "email": true},
    "po_rejected":       {"in_app": true, "email": true},
    "shipment_updated":  {"in_app": true, "email": false},
    "delivery_confirmed":{"in_app": true, "email": true},
    "invoice_submitted": {"in_app": true, "email": true},
    "invoice_approved":  {"in_app": true, "email": true},
    "invoice_rejected":  {"in_app": true, "email": true},
    "payment_completed": {"in_app": true, "email": true},
    "review_received":   {"in_app": true, "email": false}
  }'::jsonb,
  updated_at      timestamptz not null default now()
);

-- RLS
alter table public.notifications             enable row level security;
alter table public.notification_preferences  enable row level security;

create policy "notifications_own_read"
  on public.notifications for select
  using (user_id = auth.uid());

create policy "notifications_own_update"
  on public.notifications for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Only Edge Functions (service role) can insert notifications
create policy "notifications_service_insert"
  on public.notifications for insert
  with check (false);  -- blocked for all anon/authenticated roles; service role bypasses RLS

create policy "notification_preferences_own"
  on public.notification_preferences for all
  using (user_id = auth.uid());
```

---

## Relationships

```
public.profiles (1)
  ├── public.notifications (N)            — one row per notification event
  └── public.notification_preferences (1) — per-user channel settings

public.notifications
  └── reference_id → any table (purchase_requests, rfqs, purchase_orders, etc.)
      via reference_type discriminator
```

---

## API Endpoints

| Operation | Method | Implementation | Notes |
|---|---|---|---|
| Get my notifications | Server Component / Realtime | `supabase.from('notifications').select('*').eq('user_id', uid)` | Ordered by created_at desc |
| Mark notification read | Client mutation | `supabase.from('notifications').update({ is_read: true, read_at: now() })` | Own notifications only |
| Mark all read | Client mutation | `supabase.from('notifications').update({ is_read: true })` | All unread for user |
| Delete notification | Client mutation | `supabase.from('notifications').delete()` | Own only |
| Get unread count | Server Component | `.eq('is_read', false).count()` | Powers the bell badge |
| Get preferences | Server Component | `supabase.from('notification_preferences').select()` | Own only |
| Update preferences | Client mutation | `supabase.from('notification_preferences').upsert()` | Own only |
| Send notification | Edge Function | `send-notification` | Called by other Edge Functions; inserts row + optionally sends email |

**`supabase/functions/send-notification/index.ts`** (shared utility):

```typescript
interface NotificationPayload {
  user_id:       string
  type:          string
  title:         string
  body:          string
  action_url?:   string
  reference_type?: string
  reference_id?:   string
  channel?:      'in_app' | 'email' | 'both'
}

// 1. Load user's notification_preferences for this event type
// 2. Determine channel: if user has preference, use it; otherwise use payload.channel
// 3. If channel includes 'in_app': insert notifications row (service role)
// 4. If channel includes 'email':
//    a. Load user.email from profiles
//    b. Render email template for notification type
//    c. Call Resend API to send email
//    d. Update notifications.is_email_sent = true
// Returns: { notification_id }
```

---

## Supabase Services Used

```
Supabase Database:
  - public.notifications             — in-app notification rows
  - public.notification_preferences  — per-user channel settings

Supabase Realtime:
  - LISTEN on notifications table (filtered by user_id)
  - Powers the live notification bell badge and dropdown

Supabase Edge Functions:
  - send-notification    — shared utility; inserts notification row; sends email
  - Called by all other Edge Functions (create-purchase-order, respond-to-po,
    send-rfq, submit-quotation, confirm-grn, approve-invoice, razorpay-webhook, etc.)
```

---

## Folder Structure

```
src/
├── app/
│   └── notifications/
│       └── page.tsx                            [Full notification center page]
├── components/
│   ├── layout/
│   │   └── notification-bell.tsx               [Header bell icon with unread badge]
│   └── modules/
│       └── notifications/
│           ├── notification-center.tsx          [Dropdown + full page notifications]
│           ├── notification-item.tsx            [Single notification row]
│           ├── notification-preferences-form.tsx
│           └── index.ts
└── hooks/
    └── use-notifications.ts                    [Realtime subscription + TanStack Query]
```

---

## UI Screens

### Screen 25.1 — Notification Bell (Header — All Pages)

A bell icon in the global navigation header. Shows a red badge with unread count when unread > 0. Clicking opens a dropdown with the last 10 notifications. Footer link: "View all notifications →". "Mark all read" button at the top of the dropdown.

---

### Screen 25.2 — Notification Center (`/notifications`)

`PageHeader`: title "Notifications".

**Filter tabs**: All / Unread / Procurement / Finance / Orders / System

`DataList` (not a DataTable): each row is a `NotificationItem`. Grouped by date (Today, Yesterday, This Week, Earlier).

**Actions per item**: mark read, delete.

"Mark all as read" button (top right).

---

### Screen 25.3 — Notification Preferences (`/settings/notifications`)

`PageHeader`: title "Notification Preferences".

Table grid of event types (rows) × channels (columns: In-App, Email). Toggle switches in each cell. "Save Preferences" button.

Event type groups:
- Procurement (PR submitted, approved, rejected)
- RFQ (received, closed)
- Quotations (received, revised)
- Purchase Orders (created, accepted, rejected)
- Delivery (shipment updated, delivery confirmed)
- Finance (invoice submitted, approved, rejected, payment completed)
- Vendor (review received)

---

## Components

### `NotificationBell`

```typescript
interface NotificationBellProps {
  userId: string
}
```

Subscribes to Supabase Realtime on the `notifications` table filtered by `user_id`. Displays unread count badge. On new notification: increments badge count and shows a toast (`sonner` toast from Phase 3) with the notification title and action link. Clicking the bell opens the `NotificationCenter` dropdown.

### `NotificationCenter`

```typescript
interface NotificationCenterProps {
  mode:      'dropdown' | 'page'
  userId:    string
  limit?:    number
}
```

In `dropdown` mode: renders last 10 notifications in a popover. In `page` mode: renders paginated full list with filter tabs.

### `NotificationItem`

```typescript
interface NotificationItemProps {
  notification: Notification
  onMarkRead:   (id: string) => void
  onDelete:     (id: string) => void
}
```

Single notification row. Unread rows have a blue left border and bold title. Title, body (truncated to 2 lines), relative time, action link. Clicking marks it read and navigates to `action_url`.

### `NotificationPreferencesForm`

```typescript
interface NotificationPreferencesFormProps {
  preferences: NotificationPreferences
  onSave:      (data: NotificationPreferences) => Promise<void>
}
```

Grid of toggle switches. Grouped by event category. "Save Preferences" at the bottom.

---

## Forms

### Form 25.1 — Notification Preferences Form

Matrix form: no standard fields. Each cell is a boolean toggle (in_app + email per event type). Values stored as a JSONB object in `notification_preferences.preferences`.

---

## Tables

### Notification Center List

Not a DataTable. A scrollable list with date groupings. Items sorted newest-first. Each item is a `NotificationItem` component.

---

## Permissions

```
Read own notifications:
  - All authenticated users can read own notifications (user_id = auth.uid())

Mark read / delete:
  - Own notifications only

Send notification:
  - Edge Functions (service role) only. No client-side path to insert notifications.
  - Prevents users from injecting fake notifications into their own or others' feeds.

Update preferences:
  - Own preferences only (user_id = auth.uid())

Admin: read any notification:
  - Platform Admin only (for support and moderation purposes)
```

---

## Validation Rules

```
Notification insert (service role only):
  - user_id must reference a valid profile
  - type must be from the predefined list of event types
  - title: max 100 chars
  - body: max 500 chars
  - action_url: valid relative URL (starts with '/')
  - reference_type: must match a known table name

Preferences:
  - preferences JSONB must conform to the expected schema
  - Unknown event types in preferences JSONB are ignored
  - Changing preferences takes effect on the next notification (no backfill)

Notification retention:
  - Notifications older than 90 days are automatically deleted by a pg_cron job
  - Unread notifications older than 90 days are also deleted (no exception)
```

---

## Business Rules

```
BR-25.1  All notification insertions go through the send-notification Edge Function
         using service role. No client-side path exists to insert notifications.
         This ensures every notification is genuine and tied to a real system event.

BR-25.2  User preferences are respected on a per-event-type basis. If a user turns
         off email for 'shipment_updated', they still receive in-app notifications
         for that event. Channels are independently configurable per event type.

BR-25.3  If a user has no preference row in notification_preferences, the system uses
         the default preferences defined in the table column default (all events:
         in_app = true, email = true for critical events).

BR-25.4  In-app notifications are delivered in real time via Supabase Realtime.
         Email notifications are sent asynchronously by the send-notification function.
         There is no guaranteed ordering between in-app and email delivery.

BR-25.5  The notification bell badge shows the count of unread notifications capped
         at 99+. It does not distinguish between event types.

BR-25.6  Clicking a notification marks it as read immediately (optimistic update)
         and navigates to action_url. If the user is already on the action_url page,
         only the read mark is applied without navigation.

BR-25.7  Notifications are scoped to individual users (user_id). There are no
         "company-wide" notifications — each relevant user receives their own row.
         E.g., all Procurement Managers in a company receive a notification when an
         invoice is submitted; they each get a separate notifications row.
```

---

## Security

```
- The notifications table insert policy blocks all non-service-role inserts.
  Users cannot inject fake notifications or notifications for other users.

- Realtime subscription is filtered by user_id = auth.uid() via Postgres RLS.
  A user cannot subscribe to another user's notification stream.

- Email addresses are read inside the Edge Function from profiles.email — they
  are never passed in by the client. A caller cannot redirect a notification
  email to an arbitrary address.

- The RESEND_API_KEY is stored as a Supabase secret and never returned to clients.

- Notification body content is plain text (no HTML rendering in-app).
  Email templates are server-side React Email components — no user-supplied
  HTML can be injected into notification emails.

- 90-day retention policy limits personal data exposure in the notifications table.
  pg_cron handles deletion; no user action required.
```

---

## State Management

```typescript
// Realtime notifications hook
export function useNotifications(userId: string) {
  const supabase = useSupabase()
  const queryClient = useQueryClient()

  // Fetch initial notification list
  const query = useQuery({
    queryKey: ['notifications', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50)
      if (error) throw error
      return data ?? []
    },
    staleTime: 30 * 1000,
  })

  // Realtime subscription — prepend new notifications
  useEffect(() => {
    const channel = supabase
      .channel(`notifications-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          queryClient.setQueryData(
            ['notifications', userId],
            (old: Notification[]) => [payload.new as Notification, ...(old ?? [])]
          )
        }
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [userId, supabase, queryClient])

  return query
}

// Unread count
export function useUnreadCount(userId: string) {
  const supabase = useSupabase()
  return useQuery({
    queryKey: ['notifications-unread', userId],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_read', false)
      if (error) throw error
      return count ?? 0
    },
    staleTime: 10 * 1000,
  })
}
```

---

## Development Tasks

### Task 25.1 — Migration
Apply migration `0028_create_notifications.sql`. Verify `notifications`, `notification_preferences` tables, RLS, and Realtime replication enabled. Regenerate `database.ts` types.

### Task 25.2 — send-notification Edge Function
Implement the shared notification utility. Wire preference lookup, in-app insert, and Resend email dispatch. Test with each notification type.

### Task 25.3 — Wire All Lifecycle Stubs
Update all Edge Functions from Phases 15–24 that contain notification stubs to call `send-notification`. Implement for each event type: PR submitted/approved/rejected, RFQ received, quotation received, PO created/accepted/rejected, shipment updated, delivery confirmed, invoice submitted/approved/rejected, payment completed, review received.

### Task 25.4 — NotificationBell Component
Implement Realtime subscription, unread badge, dropdown, toast on new notification. Wire into global layout header.

### Task 25.5 — NotificationCenter (Dropdown + Page)
Implement `notification-center.tsx` with dropdown and full-page modes. Implement `notification-item.tsx` with mark-read and delete. Wire to `useNotifications` hook.

### Task 25.6 — Notification Center Page
Implement `/notifications/page.tsx` with filter tabs and date grouping.

### Task 25.7 — Notification Preferences Page
Implement `/settings/notifications/page.tsx` with `NotificationPreferencesForm`. Wire upsert mutation.

### Task 25.8 — React Email Templates
Create email templates for all 16 notification types using `@react-email/components`. Test each template renders correctly with sample data.

### Task 25.9 — 90-Day Retention Cron
Configure pg_cron job: `DELETE FROM notifications WHERE created_at < now() - interval '90 days'`. Schedule daily at 02:00 UTC.

---

## Testing Checklist

```
✓ Migration 0028: notifications, notification_preferences tables and RLS active
✓ Realtime enabled on notifications table
✓ Client cannot insert notifications directly (RLS policy blocks)
✓ send-notification inserts in-app row correctly
✓ send-notification sends email via Resend (verified in Resend logs)
✓ Preference lookup: user with email=false for event type gets no email
✓ User with no preference row gets default preferences
✓ Realtime: new notification appears in bell dropdown without page refresh
✓ Bell badge: unread count updates immediately on new notification
✓ Toast: shown when notification arrives while user is on any page
✓ Mark single read: is_read = true, read_at set
✓ Mark all read: all unread for user set to is_read = true
✓ Delete notification: row removed; does not affect other users
✓ All 16 event types trigger correct notifications in end-to-end tests
✓ Preferences page: toggle saves correctly; next notification respects new preference
✓ 90-day retention cron: deletes old notifications in test
✓ RLS: user cannot read another user's notifications
✓ pnpm build: zero TypeScript errors; pnpm lint: zero warnings
```

---

## Acceptance Criteria

```
AC-25.1  Migration 0028 applied; notifications and preferences tables active with RLS
AC-25.2  send-notification inserts in-app rows and sends emails per user preference
AC-25.3  All 16 lifecycle events from Phases 15–24 trigger correct notifications
AC-25.4  Realtime subscription delivers new notifications without page refresh
AC-25.5  Bell badge shows correct unread count; updates on new notification
AC-25.6  Notification Center shows paginated history with filter tabs
AC-25.7  Mark read (single + all) works correctly
AC-25.8  User can configure per-event channel preferences
AC-25.9  90-day retention cron deletes old notifications
AC-25.10 Client insert blocked by RLS; only service role can insert
```

---

## Definition of Done

Phase 25 is complete when all Acceptance Criteria above are met AND:

- [ ] All TypeScript checks pass (zero errors)
- [ ] All ESLint checks pass (zero warnings)
- [ ] Migration 0028 applied and committed; `database.ts` regenerated
- [ ] Realtime replication enabled on notifications table in Supabase dashboard
- [ ] `send-notification` Edge Function deployed and tested for all 16 event types
- [ ] All lifecycle Edge Functions updated to call `send-notification` (stubs wired)
- [ ] React Email templates implemented for all 16 event types
- [ ] 90-day retention pg_cron job configured
- [ ] `RESEND_API_KEY` configured in Edge Function secrets
- [ ] PR merged to `develop` with at least 1 reviewer approval
- [ ] `feature/25-notification-system` branch merged and deleted

---

## Risk Factors

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Edge Function calling send-notification adds latency to main operation | Low | Low | Call send-notification asynchronously using EdgeRuntime.waitUntil() or fire-and-forget after main operation commits |
| Realtime subscription reconnect flooding on mobile network changes | Low | Low | Supabase Realtime handles reconnect with exponential backoff; no custom retry logic needed |
| Email rate limits from Resend on high-traffic events | Low | Medium | Batch digest emails for high-frequency events (e.g. shipment updates) in Phase 31 |
| User preferences JSONB schema drift over time | Medium | Low | Validate preferences shape on read; merge with defaults for missing keys |
| 16 event types create maintenance overhead when adding new events | Medium | Low | Define event types as a TypeScript enum; extend the preferences default in a single place |

---

## Best Practices

- Call `send-notification` asynchronously after the main operation commits — never let notification failure block the primary business operation
- Use typed notification event constants (TypeScript enum or const object) rather than magic strings for all `type` values
- Keep email templates in `supabase/functions/_shared/email-templates/` so they are co-located with the Edge Functions that use them
- Cap in-app notifications fetched per user at 50 in the initial load; older history is paginated — this prevents large notification backlogs from slowing the UI
- Implement preference defaults centrally and merge with stored preferences on read; this allows adding new event types without migrating existing preference rows

---

## Estimated Completion

**4–5 working days.** The most time-consuming task is wiring all 16 lifecycle event stubs across Phases 15–24 and creating React Email templates for each. The Realtime integration and bell component are straightforward. Allow one full day for email template creation and testing.

---

---

# PHASE 26 — AUDIT LOGS

---

## Overview

| Field | Value |
|---|---|
| Phase Number | 26 |
| Phase Name | Audit Logs |
| Milestone | M6 — Analytics & Insights |
| PRD Reference | Module 38 — Audit Logs |
| DESIGN Reference | Section 3 (Admin — Audit Logs), F01 |
| Estimated Duration | 3–4 days |
| Prerequisite Phases | Phases 4–25 complete (all user activities to be logged exist) |

---

## Purpose

Phase 26 implements the platform-wide audit log system. Every significant user action — authentication events, role changes, permission updates, procurement activities, invoice and payment operations, vendor management, and settings changes — is recorded with actor identity, timestamp, IP address, and a structured before/after payload. Audit logs are immutable: once written they cannot be edited or deleted by any user, including platform admins. They are accessible to Platform Admins for compliance review and to Company Admins for their own workspace audit trail.

---

## Business Goal

Enterprise software in the procurement and finance domain requires a complete, tamper-proof audit trail for regulatory compliance, internal audits, and dispute resolution. When a purchase order's delivery date is disputed, the audit log shows who changed it and when. When an invoice is approved suspiciously quickly, the audit log shows the approver's IP and session. Phase 26 transforms VendorFlow from an operational tool into a compliant enterprise system capable of passing external security and financial audits.

---

## Dependencies

- Phases 4–25 complete (all auditable event sources exist)
- Phase 4 complete (authentication events — login, logout, password reset)
- Phase 6 complete (IAM — role and permission changes)
- Phase 2 `DataTable`, `PageHeader` components

---

## Database Tables

Migration: `0029_create_audit_logs.sql`

```sql
-- ============================================================
-- Migration: 0029_create_audit_logs
-- Description: Immutable audit log for all significant actions
-- ============================================================

create table public.audit_logs (
  id             uuid primary key default gen_random_uuid(),
  -- Actor
  actor_id       uuid references public.profiles(id) on delete set null,
  actor_email    text,               -- denormalised; preserved even if profile deleted
  actor_role     text,               -- denormalised role at time of action
  actor_ip       inet,               -- client IP from request headers
  -- Action
  action         text not null,      -- 'pr.submitted', 'po.sent', 'invoice.approved', etc.
  entity_type    text not null,      -- 'purchase_request', 'purchase_order', 'invoice', etc.
  entity_id      uuid,               -- UUID of the affected record
  entity_label   text,               -- human-readable label (e.g. 'PR-2026-0001')
  -- Workspace context
  company_id     uuid references public.companies(id) on delete set null,
  vendor_id      uuid references public.vendors(id) on delete set null,
  -- Change payload
  before_state   jsonb,              -- record state before change (null for creates)
  after_state    jsonb,              -- record state after change (null for deletes)
  metadata       jsonb,              -- additional context (e.g. { reason: '...' })
  -- Timestamp
  created_at     timestamptz not null default now()
  -- NOTE: No updated_at — audit logs are IMMUTABLE
);

create index idx_audit_logs_actor_id    on public.audit_logs(actor_id);
create index idx_audit_logs_company_id  on public.audit_logs(company_id);
create index idx_audit_logs_vendor_id   on public.audit_logs(vendor_id);
create index idx_audit_logs_action      on public.audit_logs(action);
create index idx_audit_logs_entity      on public.audit_logs(entity_type, entity_id);
create index idx_audit_logs_created_at  on public.audit_logs(created_at desc);

-- Immutability: revoke UPDATE and DELETE from all roles including service_role
-- Only INSERT is permitted (and only via service_role)
revoke update on public.audit_logs from authenticated, anon, service_role;
revoke delete on public.audit_logs from authenticated, anon, service_role;
-- Re-grant INSERT only to service_role
grant insert on public.audit_logs to service_role;

-- RLS
alter table public.audit_logs enable row level security;

-- Platform Admins can read all audit logs
create policy "audit_logs_platform_admin_read"
  on public.audit_logs for select
  using (public.is_platform_admin());

-- Company Admins can read audit logs for their company
create policy "audit_logs_company_admin_read"
  on public.audit_logs for select
  using (
    company_id = public.get_my_company_id()
    and public.has_permission('audit_logs', 'view')
  );
```

---

## Relationships

```
public.audit_logs
  ├── actor_id → public.profiles (nullable; denormalised email preserved)
  ├── company_id → public.companies (nullable)
  └── vendor_id → public.vendors (nullable)
  
Audit log entries are written by:
  - Postgres triggers (for direct DB changes)
  - Edge Functions (for multi-step operations)
  - Supabase Auth hooks (for authentication events)
```

---

## API Endpoints

| Operation | Method | Implementation | Notes |
|---|---|---|---|
| List audit logs (company) | Server Component | `supabase.from('audit_logs').select('*').eq('company_id', id)` | Company Admin only |
| List audit logs (platform) | Server Component | `supabase.from('audit_logs').select('*')` | Platform Admin only |
| Filter by entity | Server Component | `.eq('entity_type', t).eq('entity_id', id)` | Activity log for a specific record |
| Filter by actor | Server Component | `.eq('actor_id', uid)` | All actions by a user |
| Filter by action | Server Component | `.ilike('action', 'po.%')` | All PO-related actions |
| Filter by date range | Server Component | `.gte('created_at', from).lte('created_at', to)` | |
| Export audit logs | Edge Function | `export-audit-logs` | Generates CSV; returns download link |
| Write audit log | Edge Function (internal) | `write-audit-log` | Called by other Edge Functions; uses service role |

**`supabase/functions/write-audit-log/index.ts`** (internal utility):

```typescript
interface AuditLogPayload {
  actor_id?:     string
  actor_email?:  string
  actor_role?:   string
  actor_ip?:     string
  action:        string
  entity_type:   string
  entity_id?:    string
  entity_label?: string
  company_id?:   string
  vendor_id?:    string
  before_state?: Record<string, unknown>
  after_state?:  Record<string, unknown>
  metadata?:     Record<string, unknown>
}
// Inserts a single row into audit_logs using service role
// Never throws — audit log failures must not block the primary operation
// Uses try/catch; on failure: logs to stderr only
```

---

## Supabase Services Used

```
Supabase Database:
  - public.audit_logs    — immutable event log; INSERT only

Supabase Edge Functions:
  - write-audit-log      — internal utility; called by all other Edge Functions
  - export-audit-logs    — generates CSV export for compliance download

Postgres Triggers (for direct DB mutations not via Edge Functions):
  - trg_audit_profile_role_change    — fires on profiles.role UPDATE
  - trg_audit_permission_change      — fires on role_permissions INSERT/DELETE
  - trg_audit_vendor_status_change   — fires on vendors.verification_status UPDATE
```

---

## Folder Structure

```
src/
├── app/
│   ├── admin/
│   │   └── audit-logs/
│   │       └── page.tsx                    [Platform Admin: all audit logs]
│   └── (company)/
│       └── settings/
│           └── audit-logs/
│               └── page.tsx                [Company Admin: company audit logs]
└── components/
    └── modules/
        └── audit/
            ├── audit-log-table.tsx
            ├── audit-log-filters.tsx
            ├── audit-log-detail-panel.tsx
            └── index.ts
```

---

## UI Screens

### Screen 26.1 — Company Audit Logs (`/company/settings/audit-logs`)

`PageHeader`: title "Audit Log", breadcrumb Settings → Audit Log.

`AuditLogFilters`: date range picker, action type dropdown (multi-select grouped by category), entity type dropdown, user dropdown.

`AuditLogTable`: `DataTable` showing logs for the company. Default sort: newest first.

Clicking a row opens `AuditLogDetailPanel` (Sheet) showing full before/after JSON diff.

---

### Screen 26.2 — Platform Admin Audit Logs (`/admin/audit-logs`)

Same layout as 26.1 but with an additional Company filter dropdown (all companies). Platform Admins can see all audit logs across all workspaces.

---

## Components

### `AuditLogTable`

```typescript
interface AuditLogTableProps {
  companyId?:  string    // null = all companies (platform admin)
  entityId?:   string    // filter to specific record
  entityType?: string
}
```

`DataTable` with columns: timestamp, actor (email + role), action (badge), entity label, IP address. Clicking row opens detail panel.

### `AuditLogDetailPanel`

```typescript
interface AuditLogDetailPanelProps {
  log: AuditLog
}
```

Sheet showing full log entry: all fields from the row + a JSON diff view comparing `before_state` and `after_state` (colour-coded: added = green, removed = red, changed = amber).

### `AuditLogFilters`

Date range, action multi-select, entity type, actor user — all with clear-all button. Filter state managed locally; applied as query params.

---

## Forms

No forms in Phase 26. Audit logs are read-only and write-only.

---

## Tables

### Audit Log Table

| Column | Sortable | Filterable |
|---|---|---|
| Timestamp | Yes (default desc) | Yes (date range) |
| Actor | No | Yes (user select) |
| Role | No | Yes |
| Action | Yes | Yes (multi-select) |
| Entity | No | Yes (entity type) |
| IP Address | No | No |
| Details | No | No |

---

## Permissions

```
View company audit logs:
  - Permission: has_permission('audit_logs', 'view')
  - Roles: Company Super Admin only

View all audit logs:
  - Platform Admin role only

Write audit logs:
  - Service role only (Edge Functions + Postgres triggers)
  - No authenticated or anon role can INSERT, UPDATE, or DELETE audit_logs

Export audit logs:
  - Same permissions as view; generates CSV via export-audit-logs Edge Function
```

---

## Validation Rules

```
Audit log write:
  - action must be a non-empty string (format: 'entity_type.action_name')
  - entity_type must be non-empty
  - created_at is always set by the DB (default now()); clients cannot override it
  - actor_email is denormalised at write time from the JWT claims

Immutability:
  - UPDATE is revoked at Postgres level — no role can update an audit log row
  - DELETE is revoked at Postgres level — no role can delete an audit log row
  - Even Platform Admins and service_role cannot update or delete audit logs
  - This is enforced via Postgres REVOKE statements, not RLS
```

---

## Business Rules

```
BR-26.1  Audit log writes must never block the primary operation. write-audit-log
         is called with fire-and-forget semantics inside Edge Functions. A failure
         to write the audit log is logged to stderr but does not cause the primary
         operation to fail or roll back.

BR-26.2  Sensitive fields (passwords, bank account numbers, RAZORPAY_KEY_SECRET)
         are never written to before_state or after_state. Before writing, these
         fields are redacted (replaced with '[REDACTED]') in the payload.

BR-26.3  Audit logs have no retention limit in v1. All logs are kept indefinitely.
         Phase 31 will implement a configurable retention policy for compliance
         with GDPR or local data protection requirements.

BR-26.4  Authentication events (login, logout, password reset, failed login) are
         captured via Supabase Auth hooks and written to audit_logs with
         entity_type = 'auth'. These events do not have before/after state.

BR-26.5  Every Edge Function that performs a significant state change calls
         write-audit-log. The list of auditable actions is maintained in a shared
         constants file: `supabase/functions/_shared/audit-actions.ts`.

BR-26.6  The activity log shown on individual records (PR detail, PO detail, etc.)
         in previous phases is powered by querying audit_logs filtered by
         entity_type and entity_id. This is the single source of truth for
         per-record activity history.
```

---

## Security

```
- Immutability enforced at Postgres level via REVOKE — this cannot be bypassed
  by any application-layer trick or JWT claim. The only way to modify an audit
  log is to have direct database access, which is outside VendorFlow's threat model.

- Sensitive field redaction happens inside write-audit-log before the INSERT.
  A list of REDACTED_FIELDS is maintained in _shared/audit-actions.ts.

- actor_ip is extracted from the request headers inside the Edge Function.
  The platform trusts the 'X-Forwarded-For' header only when behind a known
  proxy (Supabase's edge network). This is noted as a known limitation.

- Audit log export (CSV) is generated server-side and stored temporarily in a
  private bucket. The download link expires after 15 minutes.

- Company Admins can only read their own company's logs (company_id RLS).
  They cannot read vendor workspace audit logs or another company's logs.
```

---

## State Management

```typescript
// Audit logs for a company
export function useAuditLogs(filters: AuditLogFilters) {
  const supabase = useSupabase()
  return useQuery({
    queryKey: ['audit-logs', filters],
    queryFn: async () => {
      let query = supabase
        .from('audit_logs')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .limit(50)

      if (filters.companyId) query = query.eq('company_id', filters.companyId)
      if (filters.actorId)   query = query.eq('actor_id', filters.actorId)
      if (filters.action)    query = query.eq('action', filters.action)
      if (filters.entityType) query = query.eq('entity_type', filters.entityType)
      if (filters.dateFrom)  query = query.gte('created_at', filters.dateFrom)
      if (filters.dateTo)    query = query.lte('created_at', filters.dateTo)

      const { data, error, count } = await query
      if (error) throw error
      return { logs: data ?? [], total: count ?? 0 }
    },
    staleTime: 60 * 1000,   // 1 minute
  })
}
```

---

## Development Tasks

### Task 26.1 — Migration
Apply migration `0029_create_audit_logs.sql`. Verify REVOKE statements, indexes, and RLS. Verify INSERT succeeds with service role; UPDATE and DELETE fail for all roles. Regenerate `database.ts` types.

### Task 26.2 — write-audit-log Edge Function
Implement the shared utility with redaction logic and fire-and-forget semantics. Add `REDACTED_FIELDS` constant. Test insert succeeds; test failure does not throw.

### Task 26.3 — Wire Audit Log Calls
Add `write-audit-log` calls to all Edge Functions from Phases 4–25 that perform significant state changes. Target list: ~40 actions across all phases.

### Task 26.4 — Postgres Trigger Audit Logs
Implement `trg_audit_profile_role_change`, `trg_audit_permission_change`, and `trg_audit_vendor_status_change` triggers. Test each fires correctly.

### Task 26.5 — AuditLogTable Component
Implement `DataTable` with columns and expandable row. Implement `AuditLogDetailPanel` with JSON diff view.

### Task 26.6 — Company Audit Log Page
Implement `/company/settings/audit-logs/page.tsx` with filters and `AuditLogTable`. Wire permission gate.

### Task 26.7 — Platform Admin Audit Log Page
Implement `/admin/audit-logs/page.tsx` with additional company filter. Accessible only to `is_platform_admin()` users.

### Task 26.8 — export-audit-logs Edge Function
Implement CSV generation and temporary signed URL delivery.

---

## Testing Checklist

```
✓ Migration 0029: audit_logs table, REVOKE statements, RLS active
✓ INSERT via service role: succeeds
✓ UPDATE via service role: fails (permission denied)
✓ DELETE via service role: fails (permission denied)
✓ UPDATE via authenticated role: fails
✓ Sensitive field redaction: bank_details and password fields replaced with '[REDACTED]'
✓ write-audit-log: failure does not throw or block primary operation
✓ PR submitted: audit log entry written with correct action, entity_id, actor
✓ PO accepted: audit log entry written
✓ Invoice approved: audit log entry written with before/after state
✓ Role change trigger: fires on profiles.role update
✓ Company Admin reads own company logs; cannot read other company (RLS)
✓ Platform Admin reads all logs
✓ AuditLogDetailPanel: JSON diff displays correctly for before/after state
✓ Export CSV: generates correct CSV with all filtered results
✓ Export signed URL: expires after 15 minutes
✓ pnpm build: zero TypeScript errors; pnpm lint: zero warnings
```

---

## Acceptance Criteria

```
AC-26.1  Migration 0029 applied; audit_logs table immutable (UPDATE/DELETE revoked)
AC-26.2  All ~40 significant actions across Phases 4–25 write audit log entries
AC-26.3  Postgres triggers fire for role/permission/vendor status changes
AC-26.4  Sensitive fields redacted before storage
AC-26.5  Company Admin reads own company logs; Platform Admin reads all
AC-26.6  AuditLogTable with filters functional on both company and admin pages
AC-26.7  JSON diff view in AuditLogDetailPanel shows before/after changes
AC-26.8  CSV export generates and delivers via expiring signed URL
```

---

## Definition of Done

Phase 26 is complete when all Acceptance Criteria above are met AND:

- [ ] All TypeScript checks pass (zero errors)
- [ ] All ESLint checks pass (zero warnings)
- [ ] Migration 0029 applied; REVOKE statements verified at DB level
- [ ] `write-audit-log` Edge Function deployed and tested
- [ ] All ~40 action wiring points completed across prior Edge Functions
- [ ] Postgres triggers deployed and tested
- [ ] Immutability verified: UPDATE and DELETE both fail for all roles including service_role
- [ ] PR merged to `develop` with at least 1 reviewer approval
- [ ] `feature/26-audit-logs` branch merged and deleted

---

## Risk Factors

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Audit log write failure cascading to block primary operation | Low | High | wrap write-audit-log in try/catch; never await it in the critical path; use EdgeRuntime.waitUntil() |
| Sensitive data (bank account, GST) accidentally written to before/after state | Medium | High | Maintain REDACTED_FIELDS list; add a unit test that asserts redacted fields are absent from sample payloads |
| audit_logs table grows very large over time | Medium | Low | Add a pg_cron-based archival job in Phase 31 to move logs > 1 year old to a cold storage table |
| IP address spoofed via X-Forwarded-For header | Low | Low | Document as a known limitation; trusted proxy range is Supabase's edge network |

---

## Best Practices

- Always call `write-audit-log` after the primary operation succeeds — never before, so the log reflects the actual committed state
- Denormalise `actor_email` and `actor_role` at write time — if a user's profile is later deleted, the audit trail remains legible
- Use a typed `AUDIT_ACTIONS` constant object to prevent action string typos across 40+ call sites
- Keep `before_state` and `after_state` as partial objects — include only the fields that changed, not the entire row, to limit storage and improve diff readability

---

## Estimated Completion

**3–4 working days.** The migration and `write-audit-log` function are straightforward. The bulk of the time is spent wiring ~40 audit log calls across all previous Edge Functions. The Postgres trigger implementations are simple but require careful testing.

---

---

# PHASE 27 — PLATFORM ADMINISTRATION

---

## Overview

| Field | Value |
|---|---|
| Phase Number | 27 |
| Phase Name | Platform Administration |
| Milestone | M7 — Operations & Hardening |
| PRD Reference | Module 42 — System Administration |
| DESIGN Reference | Section 3 (Admin Panel), F01 |
| Estimated Duration | 4–5 days |
| Prerequisite Phases | Phases 4–26 complete (all entities to be administered exist) |

---

## Purpose

Phase 27 implements the Platform Administration panel — the internal control center for VendorFlow's operators. Platform Admins can manage all company workspaces, all vendor accounts, review and action vendor verification requests, moderate flagged content, manually trigger analytics refreshes, view system health metrics, manage the product category taxonomy (already functional from Phase 13), and access the full cross-workspace audit log (Phase 26). This phase also implements the `is_platform_admin()` gating function and the admin layout that separates the admin panel from company and vendor workspaces.

---

## Business Goal

Without an administrative panel, managing a multi-tenant SaaS platform requires direct database access for every operational task. Phase 27 creates a purpose-built tool for the VendorFlow operations team: vendor verification is the daily task (approving or rejecting new vendor applications), workspace monitoring ensures no company is stuck waiting for support, and the ability to manually refresh analytics or inspect audit logs gives operators the tools to investigate and resolve user issues without writing SQL queries.

---

## Dependencies

- All previous phases (all entities administered here exist)
- Phase 10 complete (`vendors` — verification workflow)
- Phase 23 complete (`analytics` — manual refresh)
- Phase 26 complete (`audit_logs` — cross-workspace audit)
- Phase 13 complete (`product_categories` — category management in admin panel)
- Phase 2 `DataTable`, `PageHeader`, `KPICard`, `Sheet`, `StatusBadge` components

---

## Database Tables

Migration: `0030_create_platform_admin.sql`

```sql
-- ============================================================
-- Migration: 0030_create_platform_admin
-- Description: Platform administration support tables
-- ============================================================

-- Platform admin flag (already exists via profiles.role = 'platform_admin')
-- This migration adds support tables for admin operations

-- System settings (platform-level configuration)
create table public.system_settings (
  key         text primary key,
  value       jsonb not null,
  description text,
  updated_by  uuid references public.profiles(id),
  updated_at  timestamptz not null default now()
);

-- Seed initial system settings
insert into public.system_settings (key, value, description) values
  ('analytics_last_refresh', '"never"', 'Timestamp of last analytics materialized view refresh'),
  ('vendor_approval_email',  '"admin@vendorflow.in"', 'Email for vendor verification notifications'),
  ('maintenance_mode',       'false', 'Puts the platform in maintenance mode when true'),
  ('max_file_upload_mb',     '20', 'Maximum file upload size in megabytes'),
  ('pr_approval_threshold',  '50000', 'PR budget above this amount (INR) requires Finance Manager approval');

-- Platform health checks log
create table public.health_checks (
  id          uuid primary key default gen_random_uuid(),
  check_name  text not null,
  status      text not null check (status in ('ok', 'warning', 'error')),
  message     text,
  checked_at  timestamptz not null default now()
);

create index idx_health_checks_name    on public.health_checks(check_name);
create index idx_health_checks_at      on public.health_checks(checked_at desc);

-- Vendor verification queue view
create or replace view public.vendor_verification_queue as
select
  v.id as vendor_id,
  v.name as vendor_name,
  v.slug,
  v.email,
  v.verification_status,
  v.created_at as registered_at,
  p.full_name as owner_name,
  p.email as owner_email,
  count(vd.id) as document_count
from public.vendors v
join public.profiles p on p.vendor_id = v.id and p.role = 'vendor_user'
left join public.vendor_documents vd on vd.vendor_id = v.id
where v.verification_status in ('pending', 'under_review')
group by v.id, v.name, v.slug, v.email, v.verification_status,
         v.created_at, p.full_name, p.email;

-- RLS
alter table public.system_settings enable row level security;
alter table public.health_checks   enable row level security;

create policy "system_settings_admin_rw"
  on public.system_settings for all
  using (public.is_platform_admin());

create policy "health_checks_admin_read"
  on public.health_checks for select
  using (public.is_platform_admin());
```

---

## Relationships

```
public.system_settings    — key-value platform configuration
public.health_checks      — periodic system health check results

public.vendor_verification_queue (view)
  └── derived from public.vendors + public.profiles + public.vendor_documents

Platform Admin operates on:
  └── public.companies     — read all workspaces
  └── public.vendors       — verify, suspend, or reactivate vendors
  └── public.profiles      — user management (deactivate, role change)
  └── public.audit_logs    — cross-workspace audit trail (Phase 26)
  └── public.product_categories — category management (Phase 13)
  └── public.vendor_reviews     — moderation (Phase 24)
```

---

## API Endpoints

| Operation | Method | Implementation | Notes |
|---|---|---|---|
| List all companies | Server Component | `supabase.from('companies').select('*, profiles(count)')` | Platform Admin only |
| Get company detail | Server Component | `supabase.from('companies').select('*, profiles(*)')` | |
| List vendor verification queue | Server Component | `supabase.from('vendor_verification_queue').select('*')` | Pending + under_review |
| Approve vendor | Edge Function | `verify-vendor` | Sets verification_status = 'verified'; notifies vendor |
| Reject vendor | Edge Function | `verify-vendor` | Sets verification_status = 'rejected'; sends rejection email |
| Suspend vendor | Edge Function | `suspend-vendor` | Sets verification_status = 'suspended'; blocks vendor access |
| List all vendors | Server Component | `supabase.from('vendors').select('*')` | Platform Admin only |
| List system settings | Server Component | `supabase.from('system_settings').select('*')` | |
| Update system setting | Client mutation | `supabase.from('system_settings').update()` | Platform Admin only |
| Refresh analytics | Edge Function | `refresh-analytics` | Calls refresh_analytics_views() |
| Get health checks | Server Component | `supabase.from('health_checks').select('*').order('checked_at', { ascending: false })` | |
| Moderate flagged review | Edge Function | `moderate-review` | Unflag or delete flagged vendor_reviews |
| Deactivate user | Edge Function | `deactivate-user` | Sets profiles.is_active = false; revokes sessions |

---

## Supabase Services Used

```
Supabase Database:
  - public.system_settings          — platform configuration
  - public.health_checks            — system health check log
  - public.vendor_verification_queue — view for vendor approval workflow
  - All other tables (read-only for company/vendor monitoring)

Supabase Auth (Admin API):
  - supabase.auth.admin.getUserById() — load user details for deactivation
  - supabase.auth.admin.deleteUser()  — used inside deactivate-user Edge Function

Supabase Edge Functions:
  - verify-vendor      — approve or reject a vendor application
  - suspend-vendor     — suspend an active vendor
  - refresh-analytics  — trigger materialized view refresh
  - moderate-review    — unflag or delete a vendor review
  - deactivate-user    — deactivate a platform user
  - run-health-checks  — runs system health checks; inserts into health_checks
```

---

## Folder Structure

```
src/
├── app/
│   └── admin/
│       ├── layout.tsx                          [Admin layout — separate from company/vendor shells]
│       ├── page.tsx                            [Admin dashboard overview]
│       ├── companies/
│       │   ├── page.tsx                        [All company workspaces]
│       │   └── [id]/
│       │       └── page.tsx                    [Company detail]
│       ├── vendors/
│       │   ├── page.tsx                        [All vendors + verification queue]
│       │   └── [id]/
│       │       └── page.tsx                    [Vendor detail + verification actions]
│       ├── audit-logs/
│       │   └── page.tsx                        [Cross-workspace audit log (Phase 26)]
│       ├── reviews/
│       │   └── page.tsx                        [Flagged review moderation]
│       ├── categories/
│       │   └── page.tsx                        [Product category management (Phase 13)]
│       └── settings/
│           └── page.tsx                        [System settings]
└── components/
    └── modules/
        └── admin/
            ├── admin-stats-grid.tsx
            ├── company-table.tsx
            ├── vendor-verification-table.tsx
            ├── vendor-verification-panel.tsx
            ├── system-settings-form.tsx
            ├── health-status-panel.tsx
            └── index.ts
```

---

## UI Screens

### Screen 27.1 — Admin Dashboard (`/admin`)

`PageHeader`: title "Platform Administration".

**Stats Grid** (6 cards):

| KPI Card | Value |
|---|---|
| Total Companies | Count of all companies |
| Active Vendors | Count with verification_status = 'verified' |
| Pending Verification | Count in vendor_verification_queue |
| Active Users | Count of profiles created in last 30 days |
| Total POs (platform) | Cross-workspace PO count (current month) |
| Flagged Reviews | Count with is_flagged = true |

**Quick Links**: Verification Queue, Flagged Reviews, Audit Logs, Analytics Refresh, System Settings.

---

### Screen 27.2 — Companies (`/admin/companies`)

`PageHeader`: title "Company Workspaces".

`CompanyTable`: DataTable of all companies with columns: name, slug, employee count, PO count, created at, status (active / inactive). Actions: view detail.

---

### Screen 27.3 — Company Detail (`/admin/companies/[id]`)

`PageHeader`: title "[Company Name]", breadcrumb Admin → Companies → [Name].

Three panels:
1. **Company Info**: name, slug, GSTIN, address, created at.
2. **Users**: list of employees with role and last login.
3. **Activity Summary**: KPI cards (PO count, total spend, invoice count, payment count) + link to audit log filtered by company_id.

---

### Screen 27.4 — Vendors (`/admin/vendors`)

`PageHeader`: title "Vendors".

**Tabs**: Verification Queue | All Vendors | Suspended

**Verification Queue tab** (`VendorVerificationTable`): shows pending and under_review vendors with document count, registered date, owner email. Actions per row: "Review" opens `VendorVerificationPanel` Sheet.

**All Vendors tab**: full DataTable of all vendors.

---

### Screen 27.5 — Vendor Detail (`/admin/vendors/[id]`)

`PageHeader`: title "[Vendor Name]", verification status badge.

Three panels:
1. **Vendor Info**: name, email, category, GSTIN, address, created at.
2. **Documents**: list of uploaded vendor documents with download links.
3. **Verification Actions**: "Approve", "Reject", "Suspend" buttons (status-conditional). Each opens a confirmation dialog with optional notes.

---

### Screen 27.6 — System Settings (`/admin/settings`)

`PageHeader`: title "System Settings".

`SystemSettingsForm`: editable key-value table. Each row: setting key (read-only), description, value (editable input type varies by value type). "Save All Changes" button.

---

### Screen 27.7 — Flagged Reviews (`/admin/reviews`)

`PageHeader`: title "Flagged Reviews".

`DataTable` of flagged vendor reviews. Columns: vendor name, reviewer company, rating, review text (truncated), flagged at. Actions: "Unflag" (sets is_flagged = false), "Delete" (hard deletes the review — irrecoverable).

---

## Components

### `AdminStatsGrid`

```typescript
interface AdminStatsGridProps {
  stats: {
    company_count:         number
    active_vendor_count:   number
    pending_verification:  number
    active_users:          number
    monthly_po_count:      number
    flagged_review_count:  number
  }
}
```

Six `KPICard` components in a 3×2 grid. Red colouring for `pending_verification > 0` and `flagged_review_count > 0`.

### `VendorVerificationPanel`

```typescript
interface VendorVerificationPanelProps {
  vendor:     Vendor
  documents:  VendorDocument[]
  onApprove:  (notes?: string) => Promise<void>
  onReject:   (reason: string) => Promise<void>
  onClose:    () => void
}
```

Sheet with vendor details, document download links, and approve/reject action buttons. Reject requires a reason (min 20 chars).

### `SystemSettingsForm`

```typescript
interface SystemSettingsFormProps {
  settings:  SystemSetting[]
  onSave:    (updated: SystemSetting[]) => Promise<void>
}
```

Renders each setting as an editable row. Value type inferred from the JSON type: boolean → toggle, number → number input, string → text input. Validation before save.

### `HealthStatusPanel`

```typescript
interface HealthStatusPanelProps {
  checks: HealthCheck[]
}
```

Grid showing the most recent result per check_name. Status colour: ok = green, warning = amber, error = red. "Run Checks Now" button calls `run-health-checks` Edge Function.

---

## Forms

### Form 27.1 — Vendor Rejection Form

| Field | Type | Validation |
|---|---|---|
| Rejection reason | textarea | Required, min 20 chars, max 500 chars |

### Form 27.2 — Vendor Suspension Form

| Field | Type | Validation |
|---|---|---|
| Suspension reason | textarea | Required, min 20 chars, max 500 chars |

### Form 27.3 — System Setting Edit

| Field | Type | Validation |
|---|---|---|
| Value | dynamic (type-inferred) | Required; type-specific validation |

---

## Tables

### Company Table

| Column | Sortable | Filterable |
|---|---|---|
| Company Name | Yes | Yes (search) |
| Slug | No | No |
| Employee Count | Yes | No |
| PO Count | Yes | No |
| Created At | Yes | Yes (date range) |
| Status | Yes | Yes |

### Vendor Verification Table

| Column | Sortable | Filterable |
|---|---|---|
| Vendor Name | Yes | Yes (search) |
| Owner Email | No | No |
| Documents | No | No |
| Status | Yes | Yes |
| Registered At | Yes | Yes |
| Actions | No | No |

---

## Permissions

```
All /admin/* routes:
  - Restricted to profiles.role = 'platform_admin'
  - Enforced in the admin layout Server Component via is_platform_admin() check
  - Any non-admin user navigating to /admin/* is redirected to their workspace home

Vendor verification (approve/reject/suspend):
  - Platform Admin only; via Edge Functions with service role

User deactivation:
  - Platform Admin only; uses Supabase Auth Admin API

System settings update:
  - Platform Admin only

Flagged review moderation (unflag/delete):
  - Platform Admin only
```

---

## Validation Rules

```
Vendor approval:
  - Vendor must have at least 1 uploaded document (informational warning, not hard block)
  - Approval notification sent to vendor's registered email

Vendor rejection:
  - Rejection reason required (min 20 chars)
  - Rejection notification sent with reason

Vendor suspension:
  - Suspension reason required (min 20 chars)
  - Suspended vendors cannot log in (auth blocked via deactivate-user)
  - All active RFQ invitations for the vendor are cancelled
  - All active POs remain (to be resolved by company)

System settings:
  - pr_approval_threshold: numeric, min 0
  - max_file_upload_mb: integer, min 1, max 100
  - maintenance_mode: boolean
```

---

## Business Rules

```
BR-27.1  The admin panel is accessible only to profiles with role = 'platform_admin'.
         The admin layout checks this server-side; no client-side role check is
         sufficient on its own.

BR-27.2  Platform Admins can read all data across all companies and vendors.
         They cannot modify company or vendor procurement data (POs, invoices,
         payments) — admin read-only on financial records. Exceptions: vendor
         verification, user deactivation, review moderation, system settings.

BR-27.3  Vendor approval transitions verification_status from 'pending' or
         'under_review' to 'verified'. The vendor receives an email notification
         and can now appear in the marketplace and receive RFQs.

BR-27.4  Vendor rejection sets verification_status = 'rejected'. The vendor owner
         receives an email with the rejection reason. Rejected vendors can re-apply
         by contacting support in v1 (no automated re-application workflow).

BR-27.5  Platform Admin actions are recorded in audit_logs with entity_type = 'admin'.
         Vendor approvals, rejections, suspensions, and user deactivations are
         all logged with the admin's actor_id and reason.

BR-27.6  Maintenance mode (system_settings.maintenance_mode = true) serves a
         maintenance page to all non-admin users. Platform Admins retain full access.
         This is enforced in the root layout middleware.
```

---

## Security

```
- Admin layout enforces is_platform_admin() server-side via Server Component.
  A non-admin cannot access any /admin route regardless of their profile.

- verify-vendor, suspend-vendor, deactivate-user use service role internally
  but verify is_platform_admin() from the calling JWT first. A non-admin JWT
  cannot trigger these functions even if they know the function URL.

- Supabase Auth Admin API (used in deactivate-user) requires service role.
  The service role key is stored in Edge Function secrets only.

- System settings that affect security (maintenance_mode, approval thresholds)
  are audited: every update writes an audit_log entry.

- Platform Admin accounts are not visible in the company or vendor user lists.
  Their profiles exist in public.profiles but with role = 'platform_admin' —
  a distinct role that has no company_id or vendor_id association.
```

---

## State Management

```typescript
// Admin: companies overview
export function useAdminCompanies() {
  const supabase = useSupabase()
  return useQuery({
    queryKey: ['admin', 'companies'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('companies')
        .select('*, profiles(count)')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data ?? []
    },
    staleTime: 2 * 60 * 1000,
  })
}

// Admin: vendor verification queue
export function useVendorVerificationQueue() {
  const supabase = useSupabase()
  return useQuery({
    queryKey: ['admin', 'vendor-verification-queue'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vendor_verification_queue')
        .select('*')
        .order('registered_at', { ascending: true })
      if (error) throw error
      return data ?? []
    },
    staleTime: 60 * 1000,
  })
}
```

After verify-vendor, invalidate `['admin', 'vendor-verification-queue']` and `['admin', 'companies']`.

---

## Development Tasks

### Task 27.1 — Migration
Apply migration `0030_create_platform_admin.sql`. Verify `system_settings`, `health_checks`, and `vendor_verification_queue` view. Seed initial system settings. Regenerate `database.ts` types.

### Task 27.2 — Admin Layout and Route Guard
Implement `/admin/layout.tsx` as a Server Component that calls `is_platform_admin()`. If false, redirect to `/dashboard`. Apply to all `/admin/*` routes.

### Task 27.3 — Admin Dashboard Overview
Implement `/admin/page.tsx` with `AdminStatsGrid` and quick links. Wire stats from cross-workspace counts.

### Task 27.4 — Companies List and Detail
Implement `/admin/companies/page.tsx` with `CompanyTable`. Implement `/admin/companies/[id]/page.tsx` with three panels.

### Task 27.5 — Vendors + Verification Queue
Implement `/admin/vendors/page.tsx` with tabbed layout. Implement `VendorVerificationPanel` Sheet. Wire `verify-vendor` Edge Function.

### Task 27.6 — verify-vendor Edge Function
Implement: status transition; notifications to vendor; audit log; handle both approval and rejection.

### Task 27.7 — suspend-vendor and deactivate-user Edge Functions
Implement with reason storage, Auth Admin API session revocation, and audit log.

### Task 27.8 — Flagged Review Moderation Page
Implement `/admin/reviews/page.tsx`. Wire unflag and delete actions to `moderate-review` Edge Function.

### Task 27.9 — System Settings Page
Implement `/admin/settings/page.tsx` with `SystemSettingsForm`. Wire upsert mutation.

### Task 27.10 — run-health-checks Edge Function
Implement checks: DB connection, storage buckets reachable, pg_cron last run, Edge Functions reachable. Insert results into `health_checks`. Expose "Run Checks" button in admin dashboard.

---

## Testing Checklist

```
✓ Migration 0030: system_settings, health_checks, vendor_verification_queue created
✓ Admin layout: non-admin user redirected from /admin to /dashboard
✓ Admin dashboard: all 6 KPI stats populate correctly
✓ Companies table: all companies listed with correct employee count
✓ Vendor verification queue: shows only pending and under_review vendors
✓ Approve vendor: verification_status = 'verified'; vendor receives email
✓ Reject vendor: verification_status = 'rejected'; vendor receives email with reason
✓ Reject without reason: blocked with validation error
✓ Suspend vendor: verification_status = 'suspended'; vendor sessions revoked
✓ Flagged review: moderation page shows correct count
✓ Unflag review: is_flagged = false; review reappears in public view
✓ Delete review: row removed; vendor_performance score recalculates
✓ System settings: pr_approval_threshold updated; reflected in Phase 15 approval logic
✓ maintenance_mode = true: non-admin users see maintenance page
✓ Health checks: run-health-checks inserts results; statuses displayed
✓ All admin actions write audit_log entries
✓ pnpm build: zero TypeScript errors; pnpm lint: zero warnings
```

---

## Acceptance Criteria

```
AC-27.1  Migration 0030 applied; system_settings seeded; admin layout guard active
AC-27.2  Admin dashboard shows correct platform-wide stats
AC-27.3  Companies list and detail pages functional
AC-27.4  Vendor verification queue shows pending/under_review vendors
AC-27.5  Approve, reject, and suspend actions work correctly with notifications
AC-27.6  Flagged review moderation (unflag + delete) functional
AC-27.7  System settings editable; changes persist and take effect
AC-27.8  Health check panel shows system status; run-now triggers fresh check
AC-27.9  All admin actions logged in audit_logs
AC-27.10 Non-admin user cannot access any /admin route (server-side redirect)
```

---

## Definition of Done

Phase 27 is complete when all Acceptance Criteria above are met AND:

- [ ] All TypeScript checks pass (zero errors)
- [ ] All ESLint checks pass (zero warnings)
- [ ] Migration 0030 applied and committed; `database.ts` regenerated
- [ ] Admin layout server-side route guard tested with non-admin account
- [ ] `verify-vendor`, `suspend-vendor`, `deactivate-user` Edge Functions deployed
- [ ] `moderate-review`, `run-health-checks` Edge Functions deployed
- [ ] System settings `maintenance_mode` tested end-to-end
- [ ] All admin actions verified in audit_logs
- [ ] PR merged to `develop` with at least 1 reviewer approval
- [ ] `feature/27-platform-administration` branch merged and deleted

---

## Risk Factors

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Platform Admin accidentally deletes a review instead of unflagging | Low | Low | Require explicit "Type DELETE to confirm" text input for review deletion in the UI |
| system_settings misconfiguration (e.g. threshold = 0) breaking approval logic | Low | Medium | Validate system setting values on write; add range constraints |
| Admin route guard bypassed by Next.js middleware caching | Low | High | Enforce guard in Server Component (not just middleware); Server Components are never cached at the auth level |
| run-health-checks Edge Function timing out if a service is unresponsive | Low | Low | Implement per-check timeout of 5 seconds; mark that check as 'error' and continue |

---

## Best Practices

- Enforce the admin route guard in a Server Component layout file — middleware guards can be bypassed by direct client-side navigation in some Next.js configurations
- Keep Platform Admin actions minimal and well-audited — admins should not be able to modify financial records (POs, invoices, payments) to prevent internal fraud
- Provide confirmation dialogs for destructive admin actions (delete review, suspend vendor, deactivate user) and log all confirmations in audit_logs
- Run health checks on a schedule (pg_cron) and alert if any check returns 'error' — proactive monitoring prevents silent failures

---

## Estimated Completion

**4–5 working days.** The admin layout guard and the companies/vendors pages are the bulk of the work. The Edge Functions (`verify-vendor`, `suspend-vendor`, `deactivate-user`) are straightforward but require careful testing because their effects are not easily reversible.

---

---

**** END OF PART 5 ****


# PHASE 28 — AI MODULES

---

## Overview

| Field | Value |
|---|---|
| Phase Number | 28 |
| Phase Name | AI Modules |
| Milestone | M7 — Operations & Hardening |
| PRD Reference | Module 43 — AI Vendor Recommendation, Module 44 — AI Quotation Comparison, Module 45 — AI Procurement Insights, Module 46 — AI Vendor Performance, Module 47 — AI Risk Analysis |
| DESIGN Reference | Section 3 (AI Panels, Recommendation Cards, Insight Widgets), F01, F03 |
| Estimated Duration | 6–8 days |
| Prerequisite Phases | Phases 15–27 complete (full transaction history and analytics data required) |

---

## Purpose

Phase 28 implements the AI-powered feature layer across VendorFlow. This includes smart vendor recommendations during RFQ creation, intelligent quotation scoring with natural-language explanations, procurement spend insights generated from transaction history, vendor risk scoring derived from performance and activity patterns, and AI-assisted purchase request descriptions. The AI layer is built on OpenAI's API and operates as an optional enhancement layer — every AI-powered surface degrades gracefully to a non-AI state when the API is unavailable or a user opts out.

---

## Business Goal

Procurement decisions are data-rich but insight-poor — there is plenty of historical data, but drawing actionable conclusions from it requires time that procurement teams rarely have. The AI modules solve three specific problems: they reduce the time to identify the best vendor for an RFQ (by scoring and ranking vendors automatically), they reduce the cognitive load of quotation comparison (by summarising differences in plain language), and they surface spend patterns that would otherwise require a data analyst to discover. The AI layer turns VendorFlow from a record-keeping system into an active procurement advisor.

---

## Dependencies

- Phases 15–27 complete (transaction data required for all AI features)
- Phase 23 complete (`spend_by_vendor`, `spend_by_category` materialized views — AI insights use these)
- Phase 24 complete (`vendor_performance` table — vendor scoring input)
- OpenAI API access: `OPENAI_API_KEY` in Supabase Edge Function secrets
- Phase 2 AI-themed components: `AIInsightCard`, `AISuggestionBadge` (built in this phase)

---

## Database Tables

Migration: `0031_create_ai_tables.sql`

```sql
-- ============================================================
-- Migration: 0031_create_ai_tables
-- Description: AI feature support tables and cache
-- ============================================================

-- Cache for AI-generated content (avoid re-calling OpenAI for identical inputs)
create table public.ai_cache (
  id            uuid primary key default gen_random_uuid(),
  cache_key     text not null unique,    -- hash of (feature + input params)
  feature       text not null,           -- 'vendor_recommendation', 'quote_summary', etc.
  input_hash    text not null,           -- SHA-256 of serialised input
  output        jsonb not null,          -- AI response stored as structured JSON
  model         text not null,           -- e.g. 'gpt-4o-mini'
  tokens_used   integer,
  created_at    timestamptz not null default now(),
  expires_at    timestamptz not null     -- TTL varies by feature
);

create index idx_ai_cache_key     on public.ai_cache(cache_key);
create index idx_ai_cache_expires on public.ai_cache(expires_at);

-- AI vendor recommendation results per RFQ
create table public.ai_vendor_recommendations (
  id              uuid primary key default gen_random_uuid(),
  rfq_id          uuid not null references public.rfqs(id) on delete cascade,
  company_id      uuid not null references public.companies(id),
  recommendations jsonb not null,    -- ranked list: [{vendor_id, score, reason, tags}]
  model           text not null,
  generated_at    timestamptz not null default now(),
  constraint ai_vendor_rec_rfq_unique unique (rfq_id)
);

create index idx_ai_vendor_rec_rfq_id    on public.ai_vendor_recommendations(rfq_id);
create index idx_ai_vendor_rec_company   on public.ai_vendor_recommendations(company_id);

-- AI quotation comparison summaries per RFQ
create table public.ai_quotation_summaries (
  id             uuid primary key default gen_random_uuid(),
  rfq_id         uuid not null references public.rfqs(id) on delete cascade,
  company_id     uuid not null references public.companies(id),
  summary        text not null,     -- plain-language comparison summary
  recommendation text,              -- which vendor AI recommends and why
  key_differences jsonb,            -- structured diff: [{dimension, best_vendor, detail}]
  model          text not null,
  generated_at   timestamptz not null default now(),
  constraint ai_quote_summary_rfq_unique unique (rfq_id)
);

-- AI procurement insights per company
create table public.ai_procurement_insights (
  id           uuid primary key default gen_random_uuid(),
  company_id   uuid not null references public.companies(id),
  insight_type text not null,   -- 'spend_anomaly', 'vendor_risk', 'category_trend', etc.
  title        text not null,
  body         text not null,
  severity     text not null default 'info'
                 check (severity in ('info', 'warning', 'critical')),
  action_url   text,
  is_dismissed boolean not null default false,
  generated_at timestamptz not null default now(),
  expires_at   timestamptz
);

create index idx_ai_insights_company on public.ai_procurement_insights(company_id);
create index idx_ai_insights_type    on public.ai_procurement_insights(insight_type);

-- RLS
alter table public.ai_cache                   enable row level security;
alter table public.ai_vendor_recommendations  enable row level security;
alter table public.ai_quotation_summaries     enable row level security;
alter table public.ai_procurement_insights    enable row level security;

-- ai_cache: service role only (no direct client access)
create policy "ai_cache_service_only"
  on public.ai_cache for all using (false);

-- Company-scoped AI tables
create policy "ai_vendor_rec_company_read"
  on public.ai_vendor_recommendations for select
  using (company_id = public.get_my_company_id());

create policy "ai_quote_summary_company_read"
  on public.ai_quotation_summaries for select
  using (company_id = public.get_my_company_id());

create policy "ai_insights_company_rw"
  on public.ai_procurement_insights for all
  using (company_id = public.get_my_company_id());
```

---

## Relationships

```
public.rfqs (1)
  ├── public.ai_vendor_recommendations (1)   — per-RFQ vendor ranking
  └── public.ai_quotation_summaries (1)      — per-RFQ quote comparison summary

public.companies (1)
  └── public.ai_procurement_insights (N)     — ongoing insight feed

public.ai_cache
  └── keyed by feature + input_hash; shared across all companies
      (only non-sensitive aggregates are cached)
```

---

## API Endpoints

| Operation | Method | Implementation | Notes |
|---|---|---|---|
| Generate vendor recommendations | Edge Function | `ai-recommend-vendors` | Called when RFQ is being created; returns ranked vendor list |
| Get saved recommendations | Server Component | `supabase.from('ai_vendor_recommendations').select('*').eq('rfq_id', id)` | |
| Generate quotation summary | Edge Function | `ai-summarise-quotations` | Called after at least 2 quotations received |
| Get saved quotation summary | Server Component | `supabase.from('ai_quotation_summaries').select('*').eq('rfq_id', id)` | |
| Generate procurement insights | Edge Function | `ai-generate-insights` | Scheduled nightly; or on-demand from analytics page |
| Get active insights | Server Component | `supabase.from('ai_procurement_insights').select('*').eq('company_id', id).eq('is_dismissed', false)` | |
| Dismiss insight | Client mutation | `supabase.from('ai_procurement_insights').update({ is_dismissed: true })` | |
| AI PR description assist | Edge Function | `ai-assist-pr-description` | Called on-demand from PR form; returns suggested description |
| AI vendor risk score | Edge Function | `ai-vendor-risk-score` | Called on vendor profile page; generates risk signal |

**`supabase/functions/ai-recommend-vendors/index.ts`** (key logic):

```typescript
// 1. Authenticate company user
// 2. Load RFQ items (categories, specifications)
// 3. Load verified vendors with matching categories + their performance scores
// 4. Load company's historical PO data with those vendors (spend, lead time, rating)
// 5. Build OpenAI prompt:
//    System: "You are a procurement advisor. Rank vendors for this RFQ..."
//    User: JSON of RFQ items + vendor profiles + performance data
// 6. Call OpenAI chat completions API (model: gpt-4o-mini)
// 7. Parse structured JSON response: [{vendor_id, score, reason, tags}]
// 8. Cache result in ai_cache (expires 24 hours)
// 9. Upsert into ai_vendor_recommendations
// 10. Return ranked list
```

**`supabase/functions/ai-summarise-quotations/index.ts`** (key logic):

```typescript
// 1. Load RFQ + rfq_items + all submitted quotations + quotation_items
// 2. Load vendor performance scores for each submitting vendor
// 3. Build OpenAI prompt with structured quotation comparison data
// 4. Request: JSON summary + recommendation + key_differences array
// 5. Parse and validate OpenAI response
// 6. Cache (expires 1 hour — quotations can be revised)
// 7. Upsert ai_quotation_summaries
// 8. Return summary
```

---

## Supabase Services Used

```
Supabase Database:
  - public.ai_cache                   — response cache with TTL
  - public.ai_vendor_recommendations  — per-RFQ vendor rankings
  - public.ai_quotation_summaries     — per-RFQ comparison summaries
  - public.ai_procurement_insights    — company-level insight feed

Supabase Edge Functions:
  - ai-recommend-vendors      — vendor recommendation for RFQ creation
  - ai-summarise-quotations   — quotation comparison summary
  - ai-generate-insights      — nightly procurement insight generation
  - ai-assist-pr-description  — PR form description assistant
  - ai-vendor-risk-score      — vendor risk signal generation

External API:
  - OpenAI Chat Completions API (model: gpt-4o-mini for cost efficiency)
  - OPENAI_API_KEY stored as Supabase Edge Function secret
```

---

## Folder Structure

```
src/
├── app/
│   └── (company)/
│       ├── procurement/
│       │   └── rfqs/
│       │       └── [id]/
│       │           └── compare/
│       │               └── page.tsx     [AI summary panel added to Phase 17 compare page]
│       └── analytics/
│           └── page.tsx                 [AI insights widget added to Phase 23 dashboard]
└── components/
    └── modules/
        └── ai/
            ├── ai-vendor-recommendation-panel.tsx
            ├── ai-quotation-summary-panel.tsx
            ├── ai-insight-card.tsx
            ├── ai-insight-feed.tsx
            ├── ai-pr-description-assistant.tsx
            ├── ai-vendor-risk-badge.tsx
            ├── ai-loading-skeleton.tsx
            └── index.ts
```

---

## UI Screens

### Screen 28.1 — AI Vendor Recommendations (within RFQ creation — Screen 16.2)

A collapsible `AIVendorRecommendationPanel` is added to the vendor selector section of the Create RFQ page. After RFQ items are entered, a "Get AI Recommendations" button calls `ai-recommend-vendors`. The panel shows:

- Ranked list of up to 5 recommended vendors
- Per-vendor: score badge (out of 10), reason text, tag pills ("Fast delivery", "Lowest cost historically", "High rating")
- "Add to RFQ" button per recommendation
- Disclaimer: "AI recommendations are based on historical data and should be reviewed before use."

---

### Screen 28.2 — AI Quotation Summary (within Phase 17 Comparison Page)

A `AIQuotationSummaryPanel` is added above the comparison grid on the quotation comparison page. After 2+ quotations are received, an "Summarise with AI" button calls `ai-summarise-quotations`. The panel shows:

- 2–3 paragraph plain-language comparison summary
- "AI recommends:" vendor name with reason
- Key differences table: price, delivery, risk factors
- "Generated [timestamp] — Regenerate" link

---

### Screen 28.3 — AI Insight Feed (within Analytics Dashboard — Screen 23.1)

A `AIInsightFeed` widget is added to the analytics overview page. Shows up to 5 active, non-dismissed insights. Each `AIInsightCard` displays:

- Severity icon (info/warning/critical)
- Title and body text
- Action link (navigates to relevant record)
- "Dismiss" button

---

### Screen 28.4 — AI PR Description Assistant (within PR Form — Screen 15.2)

A "Suggest Description" button next to the description textarea in the PR form. Clicking calls `ai-assist-pr-description` with the PR title and line items. Inserts the suggested text into the description field. User can accept, edit, or discard.

---

### Screen 28.5 — AI Vendor Risk Badge (within Vendor Profile — Phase 10)

A `AIVendorRiskBadge` component added to the vendor profile header. Shows one of: Low Risk / Medium Risk / High Risk / Insufficient Data. Tooltip on hover shows the contributing factors (delivery rate, invoice dispute rate, age of last activity).

---

## Components

### `AIVendorRecommendationPanel`

```typescript
interface AIVendorRecommendationPanelProps {
  rfqId?:          string
  rfqItems:        RFQItem[]
  onAddVendor:     (vendorId: string) => void
  selectedVendors: string[]
}
```

Collapsible panel. Shows loading skeleton while AI is generating. Shows error state with retry button if API fails. Never blocks the RFQ creation flow — always optional.

### `AIQuotationSummaryPanel`

```typescript
interface AIQuotationSummaryPanelProps {
  rfqId:       string
  quotations:  Quotation[]
}
```

Disabled when fewer than 2 quotations received. Shows cached summary if available. "Regenerate" re-calls the Edge Function and refreshes the panel.

### `AIInsightCard`

```typescript
interface AIInsightCardProps {
  insight:    AIProcurementInsight
  onDismiss:  (id: string) => void
}
```

Card with severity colour border (info=blue, warning=amber, critical=red). Title bold, body truncated to 3 lines with "Read more" expand. Action link rendered as a button.

### `AIInsightFeed`

```typescript
interface AIInsightFeedProps {
  companyId: string
  limit?:    number    // default 5
}
```

Uses `useAIInsights(companyId)` hook. Empty state: "No active insights — your procurement is on track."

### `AIPRDescriptionAssistant`

```typescript
interface AIPRDescriptionAssistantProps {
  title:     string
  items:     PurchaseRequestItem[]
  onApply:   (suggestion: string) => void
}
```

"Suggest Description" button. Disabled when title is empty or no items added. Shows suggestion in a preview box with "Apply" and "Discard" actions.

### `AIVendorRiskBadge`

```typescript
interface AIVendorRiskBadgeProps {
  vendorId:  string
}
```

Fetches risk score from `ai_vendor_recommendations` or a dedicated risk score record. Renders badge. On hover: tooltip with contributing factors.

### `AILoadingSkeleton`

Animated shimmer placeholder used inside all AI panels while API call is in progress.

---

## Forms

No dedicated forms in Phase 28. All AI interactions are button-triggered (no form submission required).

---

## Tables

No DataTables in Phase 28. AI output is presented in panels and cards, not tabular form.

---

## Permissions

```
Use AI features (vendor recommendations, quotation summary):
  - Permission: has_permission('ai', 'use')
  - Roles: Procurement Manager, Finance Manager
  - Employee role: no access to AI features

View AI insights:
  - Same as analytics view permission (Phase 23)

Dismiss AI insights:
  - All users who can view them

AI PR description assist:
  - Any user who can create a PR (Employee + above)

Generate AI vendor risk score:
  - Users who can view vendor profile (all company users)
```

---

## Validation Rules

```
AI vendor recommendation:
  - RFQ must have at least 1 line item before AI can generate recommendations
  - If fewer than 3 verified vendors exist for the RFQ's categories, AI returns
    a "Insufficient vendor data" result with available vendors ranked

AI quotation summary:
  - At least 2 submitted quotations required
  - Quotations must be for the same RFQ

OpenAI response validation:
  - Response must be valid JSON matching the expected schema
  - If parsing fails: return error; do not store malformed data
  - Retry once on API error (5xx from OpenAI); surface error to user on second failure

Cache TTL:
  - Vendor recommendations: 24 hours (vendor pool changes slowly)
  - Quotation summary: 1 hour (quotations can be revised)
  - Procurement insights: 24 hours (generated nightly)
  - PR description: not cached (generated per-request; no cache needed)

Token limits:
  - Maximum input context: 4000 tokens per request
  - If input exceeds limit: truncate to most recent/relevant data with a note
```

---

## Business Rules

```
BR-28.1  All AI features are strictly advisory. No AI output is used to automatically
         make procurement decisions. The platform never auto-awards an RFQ, auto-approves
         a PR, or auto-pays an invoice based on AI output.

BR-28.2  AI features degrade gracefully. If the OpenAI API is unavailable, all AI
         panels show an "AI temporarily unavailable" message and hide the loading state.
         All core procurement workflows remain fully functional without AI.

BR-28.3  AI-generated content is always labelled as such. Every AI panel, badge, and
         insight card displays a "Generated by AI" disclaimer. This is non-negotiable
         to comply with enterprise transparency requirements.

BR-28.4  No PII or sensitive financial data is sent to OpenAI. The AI prompt includes
         only: item names/descriptions, vendor names, aggregate performance metrics,
         category names, and spend totals. No GSTIN, bank details, user emails,
         or specific PO amounts are included in prompts.

BR-28.5  AI cache keys are based on a SHA-256 hash of the serialised input data.
         Identical input always returns the cached output within the TTL. This
         reduces API costs and ensures deterministic responses for repeated queries.

BR-28.6  The nightly `ai-generate-insights` job runs after the analytics materialized
         view refresh (Phase 23 cron at 01:00 UTC). Insights run at 02:00 UTC.

BR-28.7  Dismissed insights are soft-deleted (is_dismissed = true). They are not
         regenerated in the next nightly cycle unless the underlying data changes
         significantly (defined as > 20% change in the triggering metric).
```

---

## Security

```
- OPENAI_API_KEY stored as a Supabase Edge Function secret. Never returned to clients.

- AI prompts are assembled server-side in Edge Functions. Clients send only:
  rfq_id, company_id, or pr_id. The Edge Function loads all data from the DB
  and constructs the prompt. Users cannot inject content into AI prompts
  by manipulating API payloads.

- PII and sensitive fields are explicitly excluded from AI prompt construction.
  A PROMPT_SAFE_FIELDS allowlist controls which fields are included.

- ai_cache stores only non-sensitive aggregate data. Even if the cache table
  were exposed, no PII or financial sensitive data would be present.

- AI output is stored in JSONB columns. On read, the application validates
  the stored JSONB against a TypeScript schema before rendering. Malformed
  cached responses are discarded and regenerated.

- Rate limiting: each user can trigger at most 5 on-demand AI calls per minute.
  Enforced in the Edge Function via a sliding window counter in ai_cache.
```

---

## State Management

```typescript
// AI vendor recommendations for an RFQ
export function useAIVendorRecommendations(rfqId: string) {
  const supabase = useSupabase()
  return useQuery({
    queryKey: ['ai-vendor-recommendations', rfqId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_vendor_recommendations')
        .select('*')
        .eq('rfq_id', rfqId)
        .maybeSingle()
      if (error) throw error
      return data
    },
    staleTime: 10 * 60 * 1000,  // 10 minutes
  })
}

// Company AI insights
export function useAIInsights(companyId: string) {
  const supabase = useSupabase()
  return useQuery({
    queryKey: ['ai-insights', companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_procurement_insights')
        .select('*')
        .eq('company_id', companyId)
        .eq('is_dismissed', false)
        .order('severity', { ascending: false })
        .order('generated_at', { ascending: false })
        .limit(10)
      if (error) throw error
      return data ?? []
    },
    staleTime: 5 * 60 * 1000,
  })
}
```

---

## Development Tasks

### Task 28.1 — Migration
Apply migration `0031_create_ai_tables.sql`. Verify all four tables and RLS. Regenerate `database.ts` types.

### Task 28.2 — OpenAI SDK Setup
Install `openai` npm package in Edge Function shared utilities. Create `_shared/openai.ts` helper wrapping `new OpenAI({ apiKey: Deno.env.get('OPENAI_API_KEY') })`. Implement `callWithCache()` function.

### Task 28.3 — ai-recommend-vendors Edge Function
Implement with prompt assembly, OpenAI call, response parsing, caching, and upsert. Test with 3 vendors and 5 items.

### Task 28.4 — AIVendorRecommendationPanel Component
Implement with loading skeleton, error state, and recommendation cards. Wire into RFQ creation page (Phase 16 Screen 16.2).

### Task 28.5 — ai-summarise-quotations Edge Function
Implement. Test with 3 vendors' quotations for the same RFQ.

### Task 28.6 — AIQuotationSummaryPanel Component
Implement with regenerate button. Wire into Phase 17 compare page.

### Task 28.7 — ai-generate-insights Edge Function
Implement nightly insight generation: spend anomaly detection, overdue payment alert, low-performing vendor flag, category overspend detection.

### Task 28.8 — AIInsightFeed and AIInsightCard
Implement components. Wire into Phase 23 analytics dashboard.

### Task 28.9 — ai-assist-pr-description Edge Function
Implement prompt: "Write a concise procurement description for [title] requiring [items]." Wire to Phase 15 PR form.

### Task 28.10 — AIVendorRiskBadge
Implement risk scoring from vendor_performance table. Wire into Phase 10 vendor profile.

### Task 28.11 — pg_cron for ai-generate-insights
Schedule nightly at 02:00 UTC (after analytics refresh at 01:00 UTC).

---

## Testing Checklist

```
✓ Migration 0031: all tables and RLS active
✓ ai-recommend-vendors: returns ranked JSON list for an RFQ with items and vendors
✓ AI recommendation panel: renders correctly; loading skeleton shown during API call
✓ AI recommendation error state: shows retry button when OpenAI returns 5xx
✓ AI graceful degradation: all procurement workflows function when OPENAI_API_KEY absent
✓ ai-summarise-quotations: blocked when fewer than 2 quotations
✓ Quotation summary panel: shows cached summary if within 1-hour TTL
✓ ai-generate-insights: generates spend anomaly insight for test data
✓ Insight card: dismiss sets is_dismissed = true; card disappears from feed
✓ PR description assistant: generates relevant description for test items
✓ Vendor risk badge: renders "Low Risk" for high-performing vendor
✓ "Generated by AI" disclaimer: present on all AI panels
✓ No PII in prompt: verified by logging sanitised prompt during test run
✓ Cache: identical inputs return cached output (no second OpenAI call)
✓ Rate limiting: 6th call in 1 minute returns 429
✓ pnpm build: zero TypeScript errors; pnpm lint: zero warnings
```

---

## Acceptance Criteria

```
AC-28.1  Migration 0031 applied; AI tables active with RLS
AC-28.2  ai-recommend-vendors returns ranked vendor list for RFQ
AC-28.3  ai-summarise-quotations returns plain-language summary for 2+ quotations
AC-28.4  ai-generate-insights generates insights nightly via pg_cron
AC-28.5  All AI panels degrade gracefully when OpenAI API is unavailable
AC-28.6  "Generated by AI" disclaimer visible on every AI-generated surface
AC-28.7  No PII or sensitive data included in OpenAI prompts (verified in tests)
AC-28.8  AI cache prevents duplicate API calls within TTL
AC-28.9  PR description assistant available in Phase 15 PR form
AC-28.10 Vendor risk badge renders correctly on Phase 10 vendor profile
```

---

## Definition of Done

Phase 28 is complete when all Acceptance Criteria above are met AND:

- [ ] All TypeScript checks pass (zero errors)
- [ ] All ESLint checks pass (zero warnings)
- [ ] Migration 0031 applied and committed; `database.ts` regenerated
- [ ] All 5 AI Edge Functions deployed and tested against real OpenAI API
- [ ] pg_cron job for nightly insight generation configured and tested
- [ ] PII exclusion from prompts verified in integration test
- [ ] Graceful degradation tested: all procurement flows work with OPENAI_API_KEY removed
- [ ] PR merged to `develop` with at least 1 reviewer approval
- [ ] `feature/28-ai-modules` branch merged and deleted

---

## Risk Factors

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| OpenAI API latency (2–5 seconds) degrading perceived page performance | Medium | Medium | All AI calls are on-demand (button-triggered); never on page load; use loading skeletons |
| OpenAI API cost overrun from excessive calls | Medium | Medium | Cache aggressively; rate-limit per user; monitor token usage in ai_cache.tokens_used |
| Hallucinated vendor recommendations misleading procurement decisions | Low | Medium | All AI output labelled as advisory; human approval always required before vendor selection |
| Prompt injection via item names or vendor descriptions | Low | Medium | Sanitise all string fields before prompt assembly; use structured JSON format (not free-text interpolation) |
| OpenAI model deprecation requiring prompt updates | Medium | Low | Abstract model name to a constant; test with new models before updating |

---

## Best Practices

- Never call OpenAI on page load — always gate behind a user-triggered button to control costs and latency
- Cache AI responses aggressively with appropriate TTLs — procurement data changes slowly; re-generating hourly is wasteful
- Build prompts with structured JSON rather than free-text interpolation to prevent injection and improve response consistency
- Always validate and type-check AI JSON responses before storing or rendering — never trust that the model returned the exact schema you requested
- Keep AI as an advisory layer only — no AI output should flow directly into a write operation without user review and confirmation

---

## Estimated Completion

**6–8 working days.** The Edge Functions are moderately complex due to prompt engineering, response validation, and caching logic. The UI components are relatively simple (panels and cards). Allow extra time for prompt iteration — getting reliable structured JSON output from the model often requires 2–3 rounds of prompt refinement.

---

---

# PHASE 29 — SYSTEM SETTINGS

---

## Overview

| Field | Value |
|---|---|
| Phase Number | 29 |
| Phase Name | System Settings |
| Milestone | M7 — Operations & Hardening |
| PRD Reference | Module 39 — Settings Management |
| DESIGN Reference | Section 3 (Settings Pages — Company, Vendor, User), F01, F03 |
| Estimated Duration | 3–4 days |
| Prerequisite Phases | Phases 4–28 complete (all configurable features exist) |

---

## Purpose

Phase 29 consolidates all settings surfaces into a coherent, complete settings system. This phase covers three settings contexts: user-level (profile, password, notification preferences), company-level (workspace settings, approval thresholds, branding, department management), and vendor-level (business profile, bank details, catalog preferences). It also wires all settings that were stubbed or partially implemented in earlier phases — most notably the company approval thresholds from Phase 15 and the notification preferences from Phase 25 — into a unified, navigable settings interface.

---

## Business Goal

Settings are the control layer of the platform. Without a complete settings system, companies cannot configure their approval workflows, users cannot personalise their experience, and platform operators cannot adjust behaviour without code changes. Phase 29 ensures every configurable parameter across all 28 previous phases is exposed in a consistent, well-organised settings UI — reducing support requests, increasing platform adoption, and enabling companies to self-serve configuration changes that would otherwise require admin intervention.

---

## Dependencies

- All previous phases (settings for every feature are assembled here)
- Phase 5 complete (`company_settings` table — partially used in Phases 15, 27)
- Phase 8 complete (`vendor_settings` — business profile settings)
- Phase 25 complete (notification preferences — settings page built here)
- Phase 2 `FormSection`, `PageHeader`, `Sheet`, `Switch`, `Select` components

---

## Database Tables

Migration: `0032_create_settings.sql`

```sql
-- ============================================================
-- Migration: 0032_create_settings
-- Description: Unified settings tables for company and vendor
-- ============================================================

-- Company-level settings (extends company_settings from Phase 5)
-- Add columns not yet present:
alter table public.company_settings
  add column if not exists approval_threshold_1     numeric(15,2) default 50000,
  add column if not exists approval_threshold_2     numeric(15,2) default 500000,
  add column if not exists require_two_approvers    boolean not null default false,
  add column if not exists default_payment_terms    text default 'Net 30',
  add column if not exists default_currency         text not null default 'INR',
  add column if not exists fiscal_year_start_month  integer not null default 4
                             check (fiscal_year_start_month between 1 and 12),
  add column if not exists po_number_prefix         text default 'PO',
  add column if not exists pr_number_prefix         text default 'PR',
  add column if not exists rfq_number_prefix        text default 'RFQ',
  add column if not exists invoice_due_days         integer not null default 30,
  add column if not exists auto_close_rfq_days      integer not null default 7,
  add column if not exists enable_ai_features       boolean not null default true,
  add column if not exists timezone                 text not null default 'Asia/Kolkata',
  add column if not exists date_format              text not null default 'DD/MM/YYYY',
  add column if not exists updated_at               timestamptz not null default now();

-- Vendor-level settings (extends vendor workspace from Phase 8)
alter table public.vendors
  add column if not exists default_payment_terms  text,
  add column if not exists default_lead_time_days integer,
  add column if not exists auto_accept_pos        boolean not null default false,
  add column if not exists invoice_prefix         text default 'INV',
  add column if not exists enable_ai_features     boolean not null default true,
  add column if not exists timezone               text not null default 'Asia/Kolkata';

-- User profile settings (extends profiles from Phase 4)
alter table public.profiles
  add column if not exists display_name  text,
  add column if not exists avatar_url    text,
  add column if not exists timezone      text default 'Asia/Kolkata',
  add column if not exists locale        text default 'en-IN',
  add column if not exists date_format   text default 'DD/MM/YYYY',
  add column if not exists theme         text not null default 'system'
                             check (theme in ('light', 'dark', 'system'));

-- Trigger for company_settings updated_at
create or replace trigger trg_company_settings_updated_at
  before update on public.company_settings
  for each row execute function public.handle_updated_at();
```

---

## Relationships

```
public.company_settings (1 per company)
  └── governs: PR approval thresholds, PO/PR/RFQ number prefixes,
               currency, fiscal year, payment terms, AI toggle

public.vendors
  └── extended with: payment terms, lead time, auto-accept, AI toggle

public.profiles
  └── extended with: display name, avatar, timezone, locale, theme

Settings cross-references:
  - approval_threshold_1/2 → used in submit-purchase-request (Phase 15)
  - invoice_due_days → used in create-invoice (Phase 21)
  - auto_close_rfq_days → used in pg_cron RFQ close job (Phase 16)
  - enable_ai_features → gates AI panel rendering (Phase 28)
  - number prefixes → used in all number-generation Edge Functions
```

---

## API Endpoints

| Operation | Method | Implementation | Notes |
|---|---|---|---|
| Get company settings | Server Component | `supabase.from('company_settings').select('*').eq('company_id', id).single()` | |
| Update company settings | Client mutation | `supabase.from('company_settings').update()` | Company Admin only |
| Get vendor settings | Server Component | `supabase.from('vendors').select('id, default_payment_terms, ...')` | Vendor only |
| Update vendor settings | Client mutation | `supabase.from('vendors').update()` | Vendor user only |
| Get user profile settings | Server Component | `supabase.from('profiles').select('*').eq('id', uid).single()` | |
| Update user profile | Client mutation | `supabase.from('profiles').update()` | Own profile only |
| Upload avatar | Client | `supabase.storage.from('avatars').upload()` | Public bucket |
| Update password | Client | `supabase.auth.updateUser({ password })` | Supabase Auth |
| Get notification preferences | Server Component | `supabase.from('notification_preferences').select('*')` | Phase 25 |
| Update notification preferences | Client mutation | `supabase.from('notification_preferences').upsert()` | Phase 25 |

---

## Supabase Services Used

```
Supabase Database:
  - public.company_settings   — company-level configuration (extended)
  - public.vendors            — vendor-level configuration (extended)
  - public.profiles           — user profile settings (extended)
  - public.notification_preferences — Phase 25 (settings page lives here)

Supabase Auth:
  - supabase.auth.updateUser()  — password change
  - supabase.auth.updateUser({ data: { display_name } }) — user metadata sync

Supabase Storage:
  - avatars bucket   — public; user profile pictures
  - Path: avatars/[user_id]/avatar.[ext]
```

---

## Folder Structure

```
src/
└── app/
    ├── (company)/
    │   └── settings/
    │       ├── layout.tsx                    [Company settings layout with sidebar nav]
    │       ├── page.tsx                      [Redirect to /settings/workspace]
    │       ├── workspace/
    │       │   └── page.tsx                  [Company workspace settings]
    │       ├── approval/
    │       │   └── page.tsx                  [PR approval thresholds]
    │       ├── numbering/
    │       │   └── page.tsx                  [PR/PO/RFQ number prefixes]
    │       ├── departments/
    │       │   └── page.tsx                  [Department management — Phase 7]
    │       ├── notifications/
    │       │   └── page.tsx                  [Notification preferences — Phase 25]
    │       └── integrations/
    │           └── page.tsx                  [Razorpay + future integrations]
    ├── (vendor)/
    │   └── settings/
    │       ├── layout.tsx                    [Vendor settings layout]
    │       ├── profile/
    │       │   └── page.tsx                  [Business profile — Phase 8]
    │       ├── catalog/
    │       │   └── page.tsx                  [Catalog preferences]
    │       ├── finance/
    │       │   └── page.tsx                  [Bank details, payment terms]
    │       └── notifications/
    │           └── page.tsx                  [Notification preferences — Phase 25]
    └── settings/
        ├── layout.tsx                        [User settings layout]
        ├── profile/
        │   └── page.tsx                      [User profile + avatar]
        ├── password/
        │   └── page.tsx                      [Change password]
        ├── appearance/
        │   └── page.tsx                      [Theme, locale, timezone]
        └── notifications/
            └── page.tsx                      [User notification preferences]
```

---

## UI Screens

### Screen 29.1 — Company Workspace Settings (`/company/settings/workspace`)

`PageHeader`: title "Workspace Settings".

`FormSection` panels:

1. **General**: company display name, timezone, locale, date format, default currency.
2. **Fiscal Year**: fiscal year start month (January–December select).
3. **Procurement Defaults**: default payment terms (free text), invoice due days (number), auto-close RFQ after N days.
4. **Feature Flags**: Enable AI Features (toggle with description).

---

### Screen 29.2 — Approval Settings (`/company/settings/approval`)

`PageHeader`: title "Approval Settings".

`FormSection` panels:

1. **Approval Thresholds**: Threshold 1 (INR) — requires Procurement Manager. Threshold 2 (INR) — additionally requires Finance Manager.
2. **Two-Approver Rule**: toggle to require both approvers even below threshold 2.
3. **Approval Timeout**: number of days before auto-escalating an unanswered approval (future feature note, displayed as informational only in v1).

---

### Screen 29.3 — Numbering Settings (`/company/settings/numbering`)

`PageHeader`: title "Document Numbering".

Three rows: PO prefix, PR prefix, RFQ prefix. Each row: text input (max 10 chars, alphanumeric) + preview: "e.g. [PREFIX]-2026-0001". Warning: "Changing prefixes affects new documents only. Existing document numbers are not retroactively updated."

---

### Screen 29.4 — User Profile Settings (`/settings/profile`)

`PageHeader`: title "My Profile".

`FormSection` panels:

1. **Personal Info**: display name, email (read-only — managed by Auth), phone.
2. **Profile Picture**: avatar uploader (circular crop; stored in avatars bucket).
3. **Timezone & Locale**: timezone select, locale select, date format select.

---

### Screen 29.5 — Appearance Settings (`/settings/appearance`)

`PageHeader`: title "Appearance".

Theme selector: Light / Dark / System (three toggle cards with preview thumbnails). Changes applied immediately via `next-themes` without page reload.

---

### Screen 29.6 — Change Password (`/settings/password`)

`PageHeader`: title "Change Password".

Form: current password, new password (min 8 chars), confirm new password. "Update Password" calls `supabase.auth.updateUser({ password })`.

---

### Screen 29.7 — Vendor Finance Settings (`/vendor/settings/finance`)

`PageHeader`: title "Finance Settings".

`FormSection` panels:

1. **Bank Details**: account holder name, bank name, account number (shown masked after save), IFSC, branch.
2. **Invoice Defaults**: invoice number prefix, default payment terms.
3. **Auto-Accept POs**: toggle to automatically accept all incoming POs (not recommended — informational note shown).

---

## Components

### `SettingsSidebarNav`

```typescript
interface SettingsSidebarNavProps {
  context: 'company' | 'vendor' | 'user'
}
```

Vertical sidebar navigation for settings pages. Renders appropriate links based on context. Active link highlighted. Used in all three settings layouts.

### `CompanySettingsForm`

```typescript
interface CompanySettingsFormProps {
  defaultValues: CompanySettings
  onSubmit:      (data: CompanySettings) => Promise<void>
  isLoading?:    boolean
}
```

Renders all company workspace settings fields with section grouping. "Save Changes" footer button.

### `ApprovalThresholdsForm`

```typescript
interface ApprovalThresholdsFormProps {
  defaultValues: ApprovalSettings
  onSubmit:      (data: ApprovalSettings) => Promise<void>
}
```

Two threshold inputs with INR prefix, two-approver toggle.

### `NumberingSettingsForm`

Three text inputs with real-time preview labels. Validates alphanumeric only.

### `UserProfileForm`

```typescript
interface UserProfileFormProps {
  profile:    Profile
  onSubmit:   (data: ProfileUpdateData) => Promise<void>
}
```

Fields: display_name, phone. Avatar uploader integrated inline.

### `AvatarUploader`

```typescript
interface AvatarUploaderProps {
  currentUrl?: string
  userId:      string
  onUpload:    (url: string) => void
}
```

Circular crop preview. Upload to `avatars/[userId]/avatar.[ext]`. Replaces existing file. Shows current avatar with "Change Photo" overlay on hover.

### `ThemeSelector`

Three card options (Light / Dark / System). Calls `setTheme()` from `next-themes` on selection. No form submission required — instant effect.

### `ChangePasswordForm`

```typescript
interface ChangePasswordFormProps {
  onSubmit:  (data: PasswordData) => Promise<void>
}
```

Current password, new password, confirm new password. Zod schema validates min length and match. Calls `supabase.auth.updateUser()`.

---

## Forms

### Form 29.1 — Company Workspace Settings Form

| Field | Type | Validation |
|---|---|---|
| Display name | text input | Required, min 2, max 100 |
| Timezone | select | Required; IANA timezone list |
| Locale | select | Required; en-IN, en-US, hi-IN |
| Date format | select | DD/MM/YYYY, MM/DD/YYYY, YYYY-MM-DD |
| Default currency | select | INR, USD, EUR |
| Default payment terms | text input | Optional, max 100 chars |
| Invoice due days | integer input | Required, min 1, max 365 |
| Auto-close RFQ days | integer input | Required, min 1, max 90 |
| Enable AI features | toggle | Boolean |

---

### Form 29.2 — Approval Thresholds Form

| Field | Type | Validation |
|---|---|---|
| Threshold 1 (INR) | currency input | Required, min 0 |
| Threshold 2 (INR) | currency input | Required, must be > Threshold 1 |
| Require two approvers | toggle | Boolean |

---

### Form 29.3 — User Profile Form

| Field | Type | Validation |
|---|---|---|
| Display name | text input | Required, min 2, max 100 |
| Phone | tel input | Optional, E.164 format |
| Timezone | select | Optional; IANA list |

---

### Form 29.4 — Change Password Form

| Field | Type | Validation |
|---|---|---|
| Current password | password input | Required |
| New password | password input | Required, min 8 chars, 1 uppercase, 1 number |
| Confirm password | password input | Required, must match new password |

```typescript
const changePasswordSchema = z.object({
  current_password: z.string().min(1),
  new_password: z.string()
    .min(8, 'Minimum 8 characters')
    .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Must contain at least one number'),
  confirm_password: z.string(),
}).refine(d => d.new_password === d.confirm_password, {
  message: 'Passwords do not match',
  path: ['confirm_password'],
})
```

---

## Tables

Settings pages contain no DataTables. Department management (list of departments with edit actions) is a `DataList` already built in Phase 7.

---

## Permissions

```
Company settings (all tabs):
  - Permission: has_permission('settings', 'edit')
  - Roles: Company Super Admin only

Company settings (read):
  - All company members can read workspace settings (timezone, date format, etc.)

Approval threshold settings:
  - Company Super Admin only

User profile settings:
  - Own profile only (all authenticated users)

Vendor settings:
  - Vendor Admin role for own vendor workspace

Change password:
  - All authenticated users (own account only)
```

---

## Validation Rules

```
Number prefixes:
  - Alphanumeric only: /^[A-Z0-9]{1,10}$/i
  - Cannot be empty
  - Max 10 characters

Threshold 2 > Threshold 1:
  - If require_two_approvers = true, both thresholds must be defined
  - Threshold 1: min 0 (0 means all PRs require Procurement Manager approval)
  - Threshold 2: must be strictly greater than Threshold 1

Timezone:
  - Must be a valid IANA timezone identifier
  - Validated against a static list of ~500 common IANA timezones

Avatar:
  - Max 5 MB
  - Allowed types: JPEG, PNG, WebP
  - Minimum dimensions: 80×80px
  - Cropped to square before upload

AI feature toggle:
  - When disabled: all AI panels in Phases 28 are hidden for all users in that workspace
  - Toggle is workspace-level, not per-user
```

---

## Business Rules

```
BR-29.1  Settings changes take effect immediately for new operations. They do not
         retroactively modify existing records. Changing the invoice_due_days
         setting does not update the due_date on already-created invoices.

BR-29.2  Changing a number prefix (PO, PR, RFQ) affects only new documents
         created after the change. All existing documents retain their original
         numbers. A warning is shown in the UI before saving.

BR-29.3  Approval threshold changes take effect on the next PR submission. PRs
         already in the approval workflow are not affected by threshold changes.

BR-29.4  The `enable_ai_features` toggle is workspace-level. When disabled, no
         AI features are displayed to any user in that company workspace.
         This allows companies to opt out of AI features entirely.

BR-29.5  Bank details in vendor finance settings are the same bank_details JSONB
         stored on the vendor record. They are pre-populated in the invoice form
         (Phase 21) and can be updated here. Changing bank details does not
         retroactively update previously submitted invoices.

BR-29.6  Theme preference is stored per-user in profiles.theme. It is applied
         via next-themes on page load using the stored value as the initial theme.
         The system theme option reads the OS colour scheme preference.
```

---

## Security

```
- Company settings are protected by RLS: company_id = get_my_company_id()
  and an additional permission gate (has_permission('settings', 'edit')).

- Avatar images are stored in a public bucket (avatars).
  Files are served via Supabase's CDN. The path includes the user_id as a
  subfolder to prevent filename collisions. Users can only write to their
  own subfolder (RLS on storage enforced via bucket policy).

- Password change uses Supabase Auth's updateUser() — current password
  verification is handled by Supabase Auth internally when re-authentication
  is required.

- Bank details (account numbers) are masked in the vendor finance settings UI
  (show last 4 digits only) after initial save. They are stored in full in
  the vendor record and only used in invoice form pre-population.

- The `auto_accept_pos` toggle is audited when changed (audit log entry).
  This flag reduces vendor security review, so its activation is recorded.
```

---

## State Management

```typescript
// Company settings
export function useCompanySettings(companyId: string) {
  const supabase = useSupabase()
  return useQuery({
    queryKey: ['company-settings', companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('company_settings')
        .select('*')
        .eq('company_id', companyId)
        .single()
      if (error) throw error
      return data
    },
    staleTime: 10 * 60 * 1000,   // 10 minutes — settings change rarely
  })
}

// User profile settings
export function useUserProfile(userId: string) {
  const supabase = useSupabase()
  return useQuery({
    queryKey: ['user-profile', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
      if (error) throw error
      return data
    },
    staleTime: 5 * 60 * 1000,
  })
}
```

After any settings mutation, invalidate the relevant query key. Settings queries have long stale times (5–10 minutes) because they change very rarely.

---

## Development Tasks

### Task 29.1 — Migration
Apply migration `0032_create_settings.sql`. Add new columns to `company_settings`, `vendors`, and `profiles`. Verify existing data is unaffected (all new columns have defaults). Regenerate `database.ts` types.

### Task 29.2 — Company Settings Layout and Sidebar Nav
Implement the company settings layout with `SettingsSidebarNav`. Verify all six tabs route correctly. Add redirect from `/company/settings` to `/company/settings/workspace`.

### Task 29.3 — Company Workspace Settings Page
Implement `/company/settings/workspace/page.tsx` with `CompanySettingsForm`. Wire save mutation with query invalidation.

### Task 29.4 — Approval Settings Page
Implement `/company/settings/approval/page.tsx` with `ApprovalThresholdsForm`. Wire to `company_settings`. Test that changes are picked up by `submit-purchase-request` (Phase 15).

### Task 29.5 — Numbering Settings Page
Implement `/company/settings/numbering/page.tsx` with prefix inputs and preview labels. Wire save. Verify next PR number uses new prefix.

### Task 29.6 — User Settings Layout and Pages
Implement user settings layout. Implement profile, appearance, and password pages. Wire avatar uploader to `avatars` bucket.

### Task 29.7 — Vendor Finance Settings Page
Implement `/vendor/settings/finance/page.tsx`. Pre-populate bank details from `vendors.bank_details`. Wire masked account number display.

### Task 29.8 — Theme Integration
Verify `next-themes` is wired to `profiles.theme`. Load initial theme from DB on app start. Persist theme on `ThemeSelector` change.

### Task 29.9 — Notifications Settings Pages (Wire Phase 25)
Verify `/company/settings/notifications`, `/vendor/settings/notifications`, and `/settings/notifications` routes load the Phase 25 `NotificationPreferencesForm` correctly.

### Task 29.10 — Integrations Page Stub
Implement `/company/settings/integrations/page.tsx` showing Razorpay connection status (connected/not connected) and a note about future integrations. No editable form in v1 — Razorpay credentials are managed via admin secrets.

---

## Testing Checklist

```
✓ Migration 0032: all new columns added with correct defaults; existing data intact
✓ Company settings: all fields save and persist correctly
✓ Approval threshold change: next PR submission uses updated thresholds
✓ Number prefix change: next PO uses new prefix; existing POs retain old prefix
✓ Invoice due days change: new invoice due_date reflects new setting
✓ AI feature toggle: disabling hides all AI panels for all company users
✓ User profile: display_name and phone save correctly
✓ Avatar upload: image stored in avatars/[userId]; URL saved to profiles.avatar_url
✓ Avatar type/size validation: >5 MB rejected; non-image type rejected
✓ Theme: Light/Dark/System applied immediately; persists across page reload
✓ Change password: valid change succeeds; mismatched passwords blocked
✓ Bank details: account number masked after save; last 4 digits visible
✓ auto_accept_pos toggle: change audited in audit_logs
✓ RLS: Company B Admin cannot read Company A's settings
✓ pnpm build: zero TypeScript errors; pnpm lint: zero warnings
```

---

## Acceptance Criteria

```
AC-29.1  Migration 0032 applied; all setting columns added with correct defaults
AC-29.2  Company workspace settings page saves and applies all settings
AC-29.3  Approval thresholds configure PR approval workflow correctly
AC-29.4  Number prefix changes take effect on next generated document
AC-29.5  User profile (name, avatar, theme) saves and applies immediately
AC-29.6  Password change works via Supabase Auth updateUser
AC-29.7  Vendor finance settings persist bank details and invoice defaults
AC-29.8  Notification preferences pages functional (Phase 25 components wired)
AC-29.9  AI feature toggle disables all AI panels when set to false
AC-29.10 All settings pages inaccessible to unauthorised roles
```

---

## Definition of Done

Phase 29 is complete when all Acceptance Criteria above are met AND:

- [ ] All TypeScript checks pass (zero errors)
- [ ] All ESLint checks pass (zero warnings)
- [ ] Migration 0032 applied and committed; `database.ts` regenerated
- [ ] All settings pages functional across company, vendor, and user contexts
- [ ] Approval threshold integration tested end-to-end with Phase 15
- [ ] Number prefix change tested end-to-end with document generation
- [ ] Theme persistence verified across browser reload and new session
- [ ] PR merged to `develop` with at least 1 reviewer approval
- [ ] `feature/29-system-settings` branch merged and deleted

---

## Risk Factors

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Migration ALTER TABLE locks large tables briefly | Low | Low | Run during off-hours; all new columns have DEFAULT values so no row rewrite needed |
| Approval threshold change breaks in-flight PRs | Low | Medium | Threshold check only at PR submission; in-flight PRs use the approval chain already created |
| Number prefix collision if prefix changed while documents are being created | Low | Low | Sequence is per-company per-year; prefix is prepended at generation time; no collision possible |
| Theme stored in DB but `next-themes` uses localStorage by default | Low | Low | Override next-themes defaultTheme from profile.theme on server render to prevent flash |

---

## Best Practices

- Store all configurable settings in the database, not in environment variables, so they can be changed without a redeploy
- Validate settings server-side before saving even when client-side validation exists — settings mutations should go through the same Zod schemas on both sides
- Show preview examples (e.g. "PO-2026-0001") for settings whose effect is not immediately obvious to users
- Separate settings into logical groups (Workspace, Approval, Numbering) rather than a single long form — shorter forms have higher completion rates

---

## Estimated Completion

**3–4 working days.** The migration and the component implementation are straightforward. The most important integration tests are the approval threshold change affecting Phase 15 and the number prefix change affecting all document generation Edge Functions. These must be verified end-to-end before marking Phase 29 done.

---

---

# PHASE 30 — TESTING & QUALITY ASSURANCE

---

## Overview

| Field | Value |
|---|---|
| Phase Number | 30 |
| Phase Name | Testing & Quality Assurance |
| Milestone | M7 — Operations & Hardening |
| PRD Reference | (Cross-cutting — applies to all modules) |
| DESIGN Reference | (Cross-cutting) |
| Estimated Duration | 6–8 days |
| Prerequisite Phases | All feature phases (1–29) complete |

---

## Purpose

Phase 30 establishes the complete automated testing infrastructure for VendorFlow and executes a full quality assurance pass across all 29 previous phases. This phase introduces unit tests for all utility functions and hooks, integration tests for all Supabase interactions and Edge Functions, end-to-end tests for all critical user journeys, accessibility audits for all pages, and a performance baseline for Core Web Vitals. It also formalises the test coverage thresholds and CI gate requirements that will govern all future development.

---

## Business Goal

Enterprise software used for financial transactions and procurement commitments cannot ship with untested code. A single bug in the payment webhook handler or the inventory reservation logic can result in double charges, negative stock, or data loss — all of which directly damage business relationships and create legal liability. Phase 30 ensures every critical path is covered by automated tests before production deployment, and establishes the testing practices that keep quality high throughout the product's lifetime.

---

## Dependencies

- All feature phases (1–29) complete
- Testing stack (already in tech stack from Phase 3):
  - **Unit/Integration**: Vitest
  - **E2E**: Playwright
  - **Component testing**: Vitest + React Testing Library
  - **Accessibility**: axe-core via `@axe-core/playwright`
  - **Performance**: Lighthouse CI

---

## Database Tables

No new database tables. Phase 30 creates a dedicated test Supabase project (or uses local Supabase via `supabase start`) for isolated test execution.

```
Test infrastructure setup (not DB tables — configuration):

supabase/tests/
  setup.ts           — seed test data for all test suites
  teardown.ts        — cleanup after test runs
  fixtures/
    company.ts       — test company fixture
    vendor.ts        — test vendor fixture
    users.ts         — test user fixtures (admin, procurement manager, employee, vendor)
    rfq.ts           — test RFQ with items
    quotation.ts     — test quotation fixture
    purchase_order.ts
    invoice.ts
    payment.ts
```

---

## Relationships

```
Phase 30 tests cross all entity relationships defined in Phases 1–29.
Test suites are organized by domain:

tests/
  unit/             — pure functions, hooks, utilities
  integration/      — Supabase RLS, Edge Functions, DB triggers
  e2e/              — full user journeys in Playwright
  accessibility/    — axe-core scans per page
  performance/      — Lighthouse CI per route
```

---

## API Endpoints

No new API endpoints. Phase 30 tests all existing endpoints.

**Test coverage targets per endpoint category:**

| Category | Unit | Integration | E2E |
|---|---|---|---|
| Edge Functions | — | 100% | Key flows |
| RLS policies | — | 100% | — |
| RPC functions | — | 100% | — |
| DB triggers | — | 100% | — |
| Client mutations | 80% | 80% | Key flows |
| Server Components | — | 80% | Key flows |

---

## Supabase Services Used

```
Local Supabase (supabase start):
  - Used for all integration and E2E tests
  - Migrations applied fresh before each test run
  - Seeds applied after migrations

Supabase CLI:
  - supabase db reset  — resets local DB between test suite runs
  - supabase functions serve — serves Edge Functions locally for integration tests
```

---

## Folder Structure

```
├── tests/
│   ├── unit/
│   │   ├── utils/
│   │   │   ├── currency.test.ts
│   │   │   ├── date.test.ts
│   │   │   ├── slugify.test.ts
│   │   │   ├── validation.test.ts
│   │   │   └── gst-split.test.ts           [CGST/SGST/IGST split logic]
│   │   ├── hooks/
│   │   │   ├── use-vendor-inventory.test.ts
│   │   │   ├── use-notifications.test.ts
│   │   │   └── use-purchase-requests.test.ts
│   │   └── components/
│   │       ├── vendor-rating-stars.test.tsx
│   │       ├── stock-status-badge.test.tsx
│   │       ├── purchase-request-form.test.tsx
│   │       └── quotation-items-editor.test.tsx
│   ├── integration/
│   │   ├── rls/
│   │   │   ├── purchase-requests.rls.test.ts
│   │   │   ├── rfqs.rls.test.ts
│   │   │   ├── quotations.rls.test.ts
│   │   │   ├── purchase-orders.rls.test.ts
│   │   │   ├── invoices.rls.test.ts
│   │   │   ├── payments.rls.test.ts
│   │   │   ├── inventory.rls.test.ts
│   │   │   ├── audit-logs.rls.test.ts
│   │   │   └── notifications.rls.test.ts
│   │   ├── edge-functions/
│   │   │   ├── submit-purchase-request.test.ts
│   │   │   ├── send-rfq.test.ts
│   │   │   ├── submit-quotation.test.ts
│   │   │   ├── select-vendor.test.ts
│   │   │   ├── create-purchase-order.test.ts
│   │   │   ├── respond-to-po.test.ts
│   │   │   ├── update-shipment-status.test.ts
│   │   │   ├── confirm-grn.test.ts
│   │   │   ├── create-invoice.test.ts
│   │   │   ├── approve-invoice.test.ts
│   │   │   ├── create-payment-order.test.ts
│   │   │   ├── razorpay-webhook.test.ts
│   │   │   └── write-audit-log.test.ts
│   │   └── triggers/
│   │       ├── inventory-auto-create.test.ts
│   │       ├── vendor-performance-trigger.test.ts
│   │       └── audit-log-immutability.test.ts
│   ├── e2e/
│   │   ├── auth/
│   │   │   ├── registration.spec.ts
│   │   │   └── login.spec.ts
│   │   ├── procurement/
│   │   │   ├── full-procurement-cycle.spec.ts   [PR → RFQ → Quotation → PO → GRN → Invoice → Payment]
│   │   │   ├── purchase-request.spec.ts
│   │   │   ├── rfq-creation.spec.ts
│   │   │   ├── vendor-quotation.spec.ts
│   │   │   ├── quotation-comparison.spec.ts
│   │   │   └── po-vendor-response.spec.ts
│   │   ├── vendor/
│   │   │   ├── vendor-onboarding.spec.ts
│   │   │   ├── product-catalog.spec.ts
│   │   │   └── inventory-management.spec.ts
│   │   └── finance/
│   │       ├── invoice-workflow.spec.ts
│   │       └── payment-flow.spec.ts
│   ├── accessibility/
│   │   └── a11y-audit.spec.ts               [axe-core scans for all key pages]
│   └── performance/
│       └── lighthouse.config.js             [Lighthouse CI configuration]
├── vitest.config.ts
├── playwright.config.ts
└── lighthouserc.js
```

---

## UI Screens

No new UI screens. Phase 30 tests all existing screens.

**E2E test coverage per critical screen:**

| Screen | E2E Test | Status |
|---|---|---|
| Registration + Onboarding | `auth/registration.spec.ts` | Required |
| PR Create + Submit + Approve | `procurement/purchase-request.spec.ts` | Required |
| RFQ Create + Send | `procurement/rfq-creation.spec.ts` | Required |
| Vendor quotation submission | `procurement/vendor-quotation.spec.ts` | Required |
| Quotation comparison + selection | `procurement/quotation-comparison.spec.ts` | Required |
| PO create + vendor accept | `procurement/po-vendor-response.spec.ts` | Required |
| GRN creation + confirmation | Part of full cycle spec | Required |
| Invoice create + approve | `finance/invoice-workflow.spec.ts` | Required |
| Payment initiation | `finance/payment-flow.spec.ts` | Required |
| Full procurement cycle | `procurement/full-procurement-cycle.spec.ts` | Required |

---

## Components

### Test Utilities

```typescript
// tests/utils/supabase-test-client.ts
export function createTestClient(role: 'company_admin' | 'vendor_user' | 'employee' | 'anon') {
  // Returns a Supabase client authenticated as the specified test user
  // Uses pre-seeded test users from fixtures/users.ts
}

// tests/utils/assert-rls.ts
export async function assertCanRead(client: SupabaseClient, table: string, id: string): Promise<void>
export async function assertCannotRead(client: SupabaseClient, table: string, id: string): Promise<void>
export async function assertCannotWrite(client: SupabaseClient, table: string, payload: object): Promise<void>
```

---

## Forms

No new forms. All existing form components are tested via component tests in `tests/unit/components/`.

---

## Tables

### Test Coverage Summary Table (maintained as a living document)

| Phase | Unit Coverage | Integration Coverage | E2E Coverage | A11y Passed |
|---|---|---|---|---|
| Phase 4 — Auth | ≥80% | ✓ RLS | ✓ | ✓ |
| Phase 5 — Company | ≥80% | ✓ RLS + triggers | ✓ | ✓ |
| Phase 6 — IAM | ≥80% | ✓ RLS | ✓ | ✓ |
| Phase 7 — Employees | ≥80% | ✓ RLS | ✓ | ✓ |
| Phase 8 — Vendor WS | ≥80% | ✓ RLS | ✓ | ✓ |
| Phase 9 — Marketplace | ≥80% | ✓ RLS | ✓ | ✓ |
| Phase 10 — Vendor Profile | ≥80% | ✓ | ✓ | ✓ |
| Phase 11 — Documents | ≥80% | ✓ RLS | ✓ | ✓ |
| Phase 12 — Products | ≥80% | ✓ RLS | ✓ | ✓ |
| Phase 13 — Categories | ≥80% | ✓ | ✓ | ✓ |
| Phase 14 — Inventory | ≥80% | ✓ RLS + triggers | ✓ | ✓ |
| Phase 15 — PRs | ≥80% | ✓ Edge Fn | ✓ | ✓ |
| Phase 16 — RFQs | ≥80% | ✓ Edge Fn | ✓ | ✓ |
| Phase 17 — Comparison | ≥80% | ✓ Edge Fn | ✓ | ✓ |
| Phase 18 — POs | ≥80% | ✓ Edge Fn | ✓ | ✓ |
| Phase 19 — Tracking | ≥80% | ✓ Edge Fn | ✓ | ✓ |
| Phase 20 — GRN | ≥80% | ✓ Edge Fn | ✓ | ✓ |
| Phase 21 — Invoices | ≥80% | ✓ Edge Fn | ✓ | ✓ |
| Phase 22 — Payments | ≥80% | ✓ Webhook | ✓ | ✓ |
| Phase 23 — Analytics | ≥80% | ✓ RPC | — | ✓ |
| Phase 24 — Reviews | ≥80% | ✓ triggers | ✓ | ✓ |
| Phase 25 — Notifications | ≥80% | ✓ Realtime | — | ✓ |
| Phase 26 — Audit Logs | ≥80% | ✓ immutability | — | ✓ |
| Phase 27 — Admin | ≥80% | ✓ Edge Fn | ✓ | ✓ |
| Phase 28 — AI | ≥80% | ✓ mock OpenAI | — | ✓ |
| Phase 29 — Settings | ≥80% | ✓ | ✓ | ✓ |

---

## Permissions

No new permissions. Testing validates all existing permission rules.

**Key permission tests:**

```
Cross-company RLS tests (in tests/integration/rls/):
  - Company A user cannot read Company B's: PRs, RFQs, POs, invoices, payments, audit logs
  - Vendor A cannot read Vendor B's: inventory, quotations, shipments, invoices
  - Employee cannot read: audit logs, analytics, payment records
  - Anon cannot read: any non-public table

Edge Function auth tests:
  - All Edge Functions reject requests without valid JWT
  - All Edge Functions reject correct JWT but wrong company_id
  - Platform Admin functions reject non-admin JWT
```

---

## Validation Rules

**Coverage thresholds (enforced in CI):**

```
Unit test coverage:
  - Lines:     ≥ 80%
  - Functions: ≥ 80%
  - Branches:  ≥ 75%

Integration tests:
  - All RLS policies: 100% covered
  - All Edge Functions: 100% covered (unit or integration)
  - All DB triggers: 100% covered

E2E tests:
  - All P0 (critical) user journeys: 100% pass rate
  - All P1 (major) user journeys: 100% pass rate

Accessibility (axe-core):
  - Zero critical violations on any page
  - Zero serious violations on any page

Performance (Lighthouse CI):
  - Performance score: ≥ 80 on all key routes
  - Accessibility score: ≥ 95 on all key routes
  - Best Practices score: ≥ 90
  - LCP: ≤ 2.5s
  - CLS: ≤ 0.1
  - FID/INP: ≤ 200ms
```

---

## Business Rules

```
BR-30.1  No feature phase is considered "done" until its tests pass in CI.
         The PR merge gate requires: pnpm test (unit + integration) to pass,
         pnpm test:e2e (relevant E2E specs) to pass, and pnpm lint to pass.

BR-30.2  The full-procurement-cycle.spec.ts E2E test is the most critical test
         in the suite. It must pass on every commit to develop. It exercises
         the complete flow: company registration → PR → RFQ → quotation →
         vendor selection → PO → vendor accept → shipment → delivery → GRN →
         invoice → payment. Any regression in this test blocks the release.

BR-30.3  RLS integration tests use the local Supabase instance with test users.
         They must verify both that authorised users CAN perform an operation
         AND that unauthorised users CANNOT. Testing only the positive case
         is insufficient.

BR-30.4  OpenAI API calls in Phase 28 tests use a mock implementation.
         Tests must never make real OpenAI API calls to avoid cost and
         non-determinism. The mock returns fixture responses from
         tests/fixtures/ai-responses/.

BR-30.5  Razorpay webhook tests simulate the webhook payload and HMAC signature
         locally using the test RAZORPAY_WEBHOOK_SECRET. No real Razorpay
         API calls are made in the test suite.

BR-30.6  Accessibility tests run against the running Next.js dev server.
         axe-core scans are performed via Playwright after each page navigation.
         Results are reported in CI with zero tolerance for critical or serious
         violations.
```

---

## Security

```
- Test users (created in seeds) use disposable email addresses and
  known-test passwords. These credentials are never used in production.

- The test Supabase project (or local instance) uses a separate set of
  API keys that are only valid for the test environment.
  Production keys are never used in tests.

- Webhook secrets in tests use fixed test values stored in .env.test
  (not committed to git). CI reads these from GitHub Actions secrets.

- Test seeds must not contain real PII, real GSTIN numbers, real bank
  account details, or real company/vendor names from actual businesses.
```

---

## State Management

No new state management. Phase 30 tests existing state management patterns.

**Key state management test cases:**

```typescript
// Example: RLS test pattern
describe('purchase_requests RLS', () => {
  it('company A user cannot read company B PRs', async () => {
    const clientA = createTestClient('company_admin_a')
    const { data } = await clientA
      .from('purchase_requests')
      .select('*')
      .eq('company_id', COMPANY_B_ID)
    expect(data).toHaveLength(0)
  })

  it('vendor user cannot read any purchase_requests', async () => {
    const vendorClient = createTestClient('vendor_user')
    const { data } = await vendorClient
      .from('purchase_requests')
      .select('*')
    expect(data).toHaveLength(0)
  })
})

// Example: Edge Function test pattern
describe('confirm-grn Edge Function', () => {
  it('sets grn.status = confirmed when all items accepted', async () => {
    const result = await invokeFunction('confirm-grn', { grn_id: TEST_GRN_ID })
    expect(result.status).toBe('confirmed')
  })

  it('updates inventory.quantity_on_hand after confirmation', async () => {
    const before = await getInventoryBalance(TEST_PRODUCT_ID)
    await invokeFunction('confirm-grn', { grn_id: TEST_GRN_ID })
    const after = await getInventoryBalance(TEST_PRODUCT_ID)
    expect(after.quantity_on_hand).toBe(before.quantity_on_hand - ACCEPTED_QTY)
  })
})
```

---

## Development Tasks

### Task 30.1 — Test Infrastructure Setup
Configure `vitest.config.ts`, `playwright.config.ts`, `lighthouserc.js`. Create `tests/utils/` helpers. Set up local Supabase test database. Create seed script with all test fixtures. Verify `pnpm test` and `pnpm test:e2e` run end-to-end.

### Task 30.2 — Unit Tests: Utilities and Hooks
Write unit tests for all utility functions: currency formatting, date utilities, slugify, GST split logic, Zod schema validators. Write hook tests using `renderHook` from React Testing Library.

### Task 30.3 — Unit Tests: Critical Components
Write component tests for: `PurchaseRequestForm`, `QuotationItemsEditor`, `VendorRatingStars`, `GRNItemsEditor`, `InventoryEditForm`, `PaymentCheckoutButton`. Focus on validation behaviour and user interaction.

### Task 30.4 — Integration Tests: RLS
Write RLS tests for all tables in Phases 14–29. Use `assertCanRead`, `assertCannotRead`, `assertCannotWrite` utilities. Priority: payment, invoice, audit_log, inventory tables.

### Task 30.5 — Integration Tests: Edge Functions
Write integration tests for all 30+ Edge Functions. Use local Supabase function serving. Mock external APIs (Razorpay, Resend, OpenAI) with interceptors.

### Task 30.6 — Integration Tests: DB Triggers
Write tests for: inventory auto-create trigger, vendor performance trigger, audit log immutability (UPDATE/DELETE rejection).

### Task 30.7 — E2E: Auth and Onboarding
Write Playwright specs for: company registration, vendor registration, login, password reset, company onboarding wizard, vendor onboarding wizard.

### Task 30.8 — E2E: Full Procurement Cycle
Write `full-procurement-cycle.spec.ts`. This is the most important test. Cover all 8 steps. Test both company and vendor perspectives using two parallel browser contexts.

### Task 30.9 — E2E: Finance Flows
Write `invoice-workflow.spec.ts` and `payment-flow.spec.ts`. Simulate Razorpay webhook using a local interceptor.

### Task 30.10 — Accessibility Audit
Write `a11y-audit.spec.ts` using axe-core via Playwright. Cover all 50+ key pages. Fix all critical and serious violations found. Document any informational violations as known issues.

### Task 30.11 — Lighthouse CI Setup
Configure `lighthouserc.js` with performance thresholds. Run against key routes (home, dashboard, RFQ list, analytics, vendor profile). Fix any routes failing thresholds.

### Task 30.12 — CI Pipeline Test Gate
Update GitHub Actions workflow: add `pnpm test`, `pnpm test:e2e`, `pnpm test:a11y`, `pnpm lint`, `pnpm typecheck` as required gates before PR merge.

---

## Testing Checklist

```
✓ vitest.config.ts: unit and integration tests run with pnpm test
✓ playwright.config.ts: E2E tests run with pnpm test:e2e
✓ Local Supabase: supabase start; migrations apply; seeds load correctly
✓ Test fixtures: all 8 fixture files create consistent test data
✓ Unit coverage: ≥ 80% lines, functions, branches (vitest --coverage)
✓ RLS tests: all company-isolation tests pass
✓ RLS tests: all vendor-isolation tests pass
✓ RLS tests: all role-based access tests pass
✓ Edge Function tests: all 30+ functions pass integration tests
✓ Trigger tests: inventory auto-create, vendor performance, audit immutability
✓ E2E: full-procurement-cycle.spec.ts passes end-to-end
✓ E2E: all auth flows pass
✓ E2E: invoice and payment flows pass
✓ A11y: zero critical or serious axe violations on all tested pages
✓ Lighthouse: all key routes score ≥ 80 performance
✓ CI pipeline: all gates pass on a clean branch
✓ Test run time: full test suite completes in < 15 minutes in CI
```

---

## Acceptance Criteria

```
AC-30.1  Test infrastructure configured; pnpm test and pnpm test:e2e run in CI
AC-30.2  Unit test coverage ≥ 80% lines and functions across all modules
AC-30.3  100% of RLS policies covered by integration tests
AC-30.4  100% of Edge Functions covered by integration tests (with API mocks)
AC-30.5  full-procurement-cycle.spec.ts E2E test passes end-to-end
AC-30.6  All other P0 E2E tests pass
AC-30.7  Zero axe-core critical or serious violations on all tested pages
AC-30.8  All Lighthouse CI thresholds met on key routes
AC-30.9  CI pipeline gates enforce all test requirements before PR merge
AC-30.10 Test suite completes in ≤ 15 minutes in CI
```

---

## Definition of Done

Phase 30 is complete when all Acceptance Criteria above are met AND:

- [ ] All TypeScript checks pass (zero errors)
- [ ] All ESLint checks pass (zero warnings)
- [ ] `pnpm test` passes with ≥ 80% coverage
- [ ] `pnpm test:e2e` passes including full-procurement-cycle
- [ ] `pnpm test:a11y` passes with zero critical/serious violations
- [ ] Lighthouse CI passes all thresholds
- [ ] CI pipeline updated with all test gates
- [ ] Test seed script committed and documented
- [ ] PR merged to `develop` with at least 1 reviewer approval
- [ ] `feature/30-testing-qa` branch merged and deleted

---

## Risk Factors

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Full-procurement-cycle E2E test is fragile due to timing | Medium | High | Use explicit Playwright waitForResponse() and network idle waits; avoid fixed delays |
| Local Supabase diverges from hosted Supabase behaviour | Low | Medium | Run integration tests against both local and a staging Supabase project |
| Test suite exceeds 15-minute CI time limit | Medium | Low | Parallelise Playwright E2E tests across 4 workers; run unit and integration tests in separate jobs |
| Accessibility fixes require significant UI rework | Low | Medium | Audit early (not at Phase 30) — run axe-core on new pages as they are built |
| OpenAI mock responses drift from actual API response shape | Low | Low | Keep mock responses in typed fixture files validated against the AI response Zod schema |

---

## Best Practices

- Write RLS tests as a separate suite from unit tests — they require a live DB connection and should not be mixed with pure function tests
- Use Playwright's multi-page context feature to simulate two users (company and vendor) simultaneously in E2E tests rather than switching sessions
- Keep test seeds minimal and deterministic — seed only the data needed for tests, not a full production-like dataset
- Test the negative path (what should be rejected) as thoroughly as the positive path — procurement security bugs almost always manifest in the negative paths
- Run Lighthouse CI in mobile simulation mode as well as desktop — many procurement users are on mobile devices in the field

---

## Estimated Completion

**6–8 working days.** Writing the full RLS integration test suite and the E2E test for the complete procurement cycle are the most time-intensive tasks. Allow 2 full days for accessibility remediation after the initial a11y audit, as this commonly surfaces multiple UI issues across all pages.

---

---

# PHASE 31 — DEPLOYMENT & DEVOPS

---

## Overview

| Field | Value |
|---|---|
| Phase Number | 31 |
| Phase Name | Deployment & DevOps |
| Milestone | M8 — Launch |
| PRD Reference | (Cross-cutting — infrastructure and operations) |
| DESIGN Reference | (Cross-cutting) |
| Estimated Duration | 4–5 days |
| Prerequisite Phases | Phase 30 complete (all tests passing) |

---

## Purpose

Phase 31 establishes the complete deployment pipeline and infrastructure for VendorFlow. This covers the CI/CD pipeline from code commit to production deployment, environment management (local, staging, production), Supabase production project configuration, Vercel production deployment with custom domain, environment variable management, database migration strategy for production, Edge Function deployment automation, monitoring and alerting setup, and operational runbooks for common deployment and incident scenarios.

---

## Business Goal

A well-configured deployment pipeline is the difference between a team that ships confidently and one that fears deployments. Unreliable deployments create release anxiety, reduce deployment frequency, and accumulate technical debt. Phase 31 ensures every deployment to production is automated, repeatable, zero-downtime, and reversible. It also ensures the operations team has the monitoring and alerting needed to detect and respond to production issues within minutes — not hours.

---

## Dependencies

- Phase 30 complete (full test suite passing)
- Vercel account configured (project created)
- Supabase production project created (separate from development project)
- Custom domain registered and DNS manageable
- GitHub repository with branch protection rules
- Resend production domain verified

---

## Database Tables

No new application tables. Phase 31 creates operations infrastructure tables:

```sql
-- ============================================================
-- Migration: 0033_create_ops_tables.sql
-- Description: Operations and deployment support tables
-- ============================================================

-- Deployment log (tracks which migrations and deployments have run)
create table public.deployment_log (
  id             uuid primary key default gen_random_uuid(),
  version        text not null,           -- semantic version: 1.0.0
  deployed_at    timestamptz not null default now(),
  deployed_by    text,                    -- GitHub Actions runner or manual
  migration_hash text,                    -- SHA of migrations applied
  git_sha        text,                    -- Git commit SHA
  environment    text not null check (environment in ('staging', 'production')),
  notes          text
);

-- Feature flags table (runtime feature toggling without redeploy)
create table public.feature_flags (
  key          text primary key,
  enabled      boolean not null default false,
  description  text,
  updated_by   uuid references public.profiles(id),
  updated_at   timestamptz not null default now()
);

-- Seed initial feature flags
insert into public.feature_flags (key, enabled, description) values
  ('ai_vendor_recommendations', true,  'Phase 28: AI vendor recommendations in RFQ'),
  ('ai_quotation_summary',      true,  'Phase 28: AI quotation comparison summary'),
  ('ai_insights',               true,  'Phase 28: AI procurement insights feed'),
  ('razorpay_live_mode',        false, 'Phase 22: Use Razorpay live keys (false = test mode)'),
  ('maintenance_mode',          false, 'Phase 27: Show maintenance page to non-admins');

-- RLS
alter table public.deployment_log  enable row level security;
alter table public.feature_flags   enable row level security;

create policy "deployment_log_admin_read"
  on public.deployment_log for select
  using (public.is_platform_admin());

create policy "feature_flags_admin_rw"
  on public.feature_flags for all
  using (public.is_platform_admin());

create policy "feature_flags_authenticated_read"
  on public.feature_flags for select
  to authenticated
  using (true);
```

---

## Relationships

```
public.feature_flags   — read by all authenticated users; managed by Platform Admin
public.deployment_log  — written by CI/CD pipeline; readable by Platform Admin only
```

---

## API Endpoints

| Operation | Method | Implementation | Notes |
|---|---|---|---|
| Get feature flags | Server Component | `supabase.from('feature_flags').select('key, enabled')` | All authenticated users |
| Update feature flag | Client mutation | `supabase.from('feature_flags').update({ enabled })` | Platform Admin only |
| List deployments | Server Component | `supabase.from('deployment_log').select('*').order('deployed_at', { ascending: false })` | Platform Admin only |
| Health check | GET `/api/health` | Next.js route handler | Returns DB connectivity + build version |

**`src/app/api/health/route.ts`:**

```typescript
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = createClient()
    const { error } = await supabase.from('feature_flags').select('key').limit(1)
    if (error) throw error
    return NextResponse.json({
      status: 'ok',
      version: process.env.NEXT_PUBLIC_APP_VERSION ?? 'unknown',
      db: 'connected',
      timestamp: new Date().toISOString(),
    })
  } catch (err) {
    return NextResponse.json({ status: 'error', db: 'disconnected' }, { status: 503 })
  }
}
```

---

## Supabase Services Used

```
Supabase Production Project:
  - Separate project from development (different project ID, URL, keys)
  - Same schema applied via migrations
  - Row Level Security: same policies as development
  - Realtime: enabled on notifications table
  - Storage: all buckets created with same RLS policies
  - Edge Functions: deployed via supabase functions deploy

Supabase Secrets (production):
  - RAZORPAY_KEY_ID
  - RAZORPAY_KEY_SECRET
  - RAZORPAY_WEBHOOK_SECRET
  - RESEND_API_KEY
  - OPENAI_API_KEY
  - SUPABASE_SERVICE_ROLE_KEY  (internal to Edge Functions only)

Supabase CLI (used in CI/CD):
  - supabase db push           — applies pending migrations to production
  - supabase functions deploy  — deploys Edge Functions
  - supabase gen types         — regenerates database.ts after migration
```

---

## Folder Structure

```
├── .github/
│   └── workflows/
│       ├── ci.yml                  [PR validation: lint, typecheck, test]
│       ├── staging.yml             [Push to staging: migrate + deploy]
│       └── production.yml          [Push to main: migrate + deploy]
├── scripts/
│   ├── deploy-check.sh             [Pre-deployment health check script]
│   ├── rollback.sh                 [Emergency rollback script]
│   └── seed-production.sh          [Seed platform admin user on first deploy]
├── supabase/
│   ├── migrations/                 [All 33+ migration files]
│   ├── functions/                  [All Edge Functions]
│   ├── seeds/                      [Production-safe seeds: categories, system_settings]
│   └── config.toml                 [Local Supabase configuration]
├── .env.example                    [Template for all environment variables]
├── .env.local                      [Local development (gitignored)]
├── .env.staging                    [Staging values (gitignored; CI reads from GitHub secrets)]
└── vercel.json                     [Vercel deployment configuration]
```

---

## UI Screens

### Screen 31.1 — Feature Flags Page (Admin — `/admin/feature-flags`)

`PageHeader`: title "Feature Flags".

Simple `DataTable` with columns: flag key, description, enabled (toggle switch), last updated, updated by. Platform Admin can toggle any flag. Changes take effect on next page load for all users (no restart required — flags are read from DB on each request).

---

### Screen 31.2 — Deployment Log (Admin — `/admin/deployments`)

`PageHeader`: title "Deployment History".

`DataTable`: version, environment, deployed at, git SHA (truncated, links to GitHub commit), migration hash, notes. Read-only.

---

## Components

### `FeatureFlagToggle`

```typescript
interface FeatureFlagToggleProps {
  flagKey:    string
  enabled:    boolean
  onChange:   (key: string, enabled: boolean) => Promise<void>
}
```

Toggle switch with label and description. Confirms before disabling critical flags (e.g. `razorpay_live_mode`).

### `useFeatureFlag`

```typescript
export function useFeatureFlag(key: string): boolean {
  const flags = useContext(FeatureFlagsContext)
  return flags[key] ?? false
}
```

React context populated at the root layout level from a server-side fetch of all `feature_flags` rows. Components call `useFeatureFlag('ai_vendor_recommendations')` to conditionally render features.

---

## Forms

### Form 31.1 — Feature Flag Toggle

No form fields beyond the toggle. Description is read-only. Changes are applied immediately on toggle with an optimistic update.

---

## Tables

### Feature Flags Table

| Column | Sortable | Filterable |
|---|---|---|
| Flag Key | Yes | Yes (search) |
| Description | No | No |
| Enabled | Yes | Yes |
| Last Updated | Yes | No |
| Updated By | No | No |

### Deployment Log Table

| Column | Sortable | Filterable |
|---|---|---|
| Version | Yes | No |
| Environment | Yes | Yes |
| Deployed At | Yes (default desc) | Yes (date range) |
| Git SHA | No | No |
| Notes | No | No |

---

## Permissions

```
Feature flags read:
  - All authenticated users (needed by useFeatureFlag hook)

Feature flags write:
  - Platform Admin only

Deployment log read:
  - Platform Admin only

/api/health:
  - Public (no authentication required — used by uptime monitors)

CI/CD pipeline:
  - GitHub Actions service account with Supabase access token
  - Vercel deploy token
  - No human user credentials in CI
```

---

## Validation Rules

```
Feature flag key:
  - Must match an existing row in feature_flags
  - New flag keys can only be added via migration, not via the UI

Database migrations:
  - Must be applied in sequence (0001, 0002, ... 0033)
  - No migration can be skipped
  - Rollback migrations must be tested in staging before production

Vercel environment variables:
  - All vars in .env.example must be present in the Vercel project
  - Build fails if NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY missing

Health check:
  - /api/health must return 200 within 3 seconds for deployment to be marked healthy
  - Vercel uses /api/health as the deployment health check URL
```

---

## Business Rules

```
BR-31.1  No direct database edits are permitted in production. All schema changes
         must be applied via numbered migration files through the CI/CD pipeline.
         Direct psql access to production is restricted to emergency rollback only.

BR-31.2  Production deployments follow a blue-green pattern on Vercel:
         - New deployment is built and tested in a preview environment
         - Health check at /api/health must pass
         - Traffic is switched to the new deployment only after health check passes
         - Previous deployment is retained for 1 hour for instant rollback

BR-31.3  Database migrations are applied before the application code is deployed.
         If a migration fails, the application deployment is cancelled. This
         ensures the application and database schema are always in sync.

BR-31.4  Feature flags allow disabling any Phase 28 AI feature in production
         without a code deployment. This is the primary mechanism for managing
         OpenAI cost overruns or API instability.

BR-31.5  The razorpay_live_mode feature flag controls whether the application
         uses Razorpay test keys or live keys. It is set to false by default
         and switched to true only after full end-to-end payment testing
         in the staging environment with real payment flows.

BR-31.6  Every production deployment triggers a Slack notification (or email)
         to the engineering team with the version, git SHA, and a link to the
         deployment log in the VendorFlow admin panel.

BR-31.7  The staging environment mirrors production exactly: same Supabase project
         tier, same Vercel region, same Edge Function configuration.
         Staging is the final validation gate before production.
```

---

## Security

```
- All secrets (Supabase keys, Razorpay, Resend, OpenAI) are stored in:
  * GitHub Actions secrets (for CI/CD)
  * Vercel environment variables (for Next.js)
  * Supabase Edge Function secrets (for Edge Functions)
  Never in .env files committed to the repository.

- The .env.example file lists all required variable names with placeholder values
  and is the only environment file committed to git.

- Vercel preview deployments (generated for every PR) use staging Supabase
  credentials, not production. This prevents PRs from touching production data.

- The Supabase production anon key is safe to expose in NEXT_PUBLIC_ variables
  because all data access is controlled by RLS. The service role key is never
  exposed to the client under any circumstances.

- Branch protection rules on `main`:
  * Require PR with at least 1 approver
  * Require CI to pass (lint, typecheck, unit tests, E2E)
  * No direct push to main
  * No force push

- Production Supabase project: disable email confirmations in Auth only
  after production validation; keep enabled for security.

- Supabase production project has Point-in-Time Recovery (PITR) enabled
  with a 7-day retention window.
```

---

## State Management

```typescript
// Feature flags context — loaded server-side at root layout
// src/app/layout.tsx
export default async function RootLayout({ children }) {
  const supabase = createClient()
  const { data: flags } = await supabase
    .from('feature_flags')
    .select('key, enabled')

  const flagMap = Object.fromEntries(
    (flags ?? []).map(f => [f.key, f.enabled])
  )

  return (
    <FeatureFlagsProvider value={flagMap}>
      {children}
    </FeatureFlagsProvider>
  )
}

// Usage in any component
const isAIEnabled = useFeatureFlag('ai_vendor_recommendations')
```

Feature flags are loaded once per request at the root layout level (Server Component). They are passed through React context to all client components. No client-side re-fetch is needed — feature flag changes require a page reload to take effect.

---

## Development Tasks

### Task 31.1 — Migration and Ops Table Setup
Apply migration `0033_create_ops_tables.sql`. Seed feature flags. Regenerate `database.ts` types.

### Task 31.2 — CI Pipeline: PR Validation (ci.yml)
Configure GitHub Actions workflow: checkout, pnpm install, `pnpm lint`, `pnpm typecheck`, `pnpm test` (unit + integration with local Supabase). Runs on every PR opened or updated.

### Task 31.3 — CI Pipeline: Staging Deployment (staging.yml)
Configure workflow on push to `develop`: apply migrations to staging Supabase (`supabase db push`), deploy Edge Functions (`supabase functions deploy`), deploy to Vercel staging (`vercel --prod --target staging`), run health check, run E2E smoke test on staging.

### Task 31.4 — CI Pipeline: Production Deployment (production.yml)
Configure workflow on push to `main`: same as staging but targets production Supabase and Vercel production. Insert deployment_log row after success.

### Task 31.5 — Environment Variable Configuration
Document all required environment variables in `.env.example`. Configure all variables in Vercel (production + staging). Configure all secrets in GitHub Actions. Configure all Edge Function secrets in Supabase (production + staging).

### Task 31.6 — Custom Domain Setup
Configure custom domain in Vercel. Set up DNS records. Enable HTTPS (automatic via Vercel). Configure Supabase Auth allowed redirect URLs for the production domain.

### Task 31.7 — Feature Flags Infrastructure
Implement `FeatureFlagsProvider` context. Implement `useFeatureFlag` hook. Wire into root layout. Implement Feature Flags admin page with `FeatureFlagToggle` components.

### Task 31.8 — Health Check Endpoint
Implement `/api/health/route.ts`. Register as Vercel health check URL. Test that it correctly returns 503 when DB is unreachable.

### Task 31.9 — Monitoring Setup
Configure Vercel Analytics for Core Web Vitals monitoring. Set up Supabase's built-in metrics dashboard. Configure uptime monitoring (e.g. UptimeRobot or Better Uptime) pointed at `/api/health`. Set up Resend email delivery monitoring.

### Task 31.10 — Rollback Runbook
Write `scripts/rollback.sh`. Document: how to revert a failed Vercel deployment (instant traffic switch), how to rollback a database migration (supabase db reset to previous version), how to disable a feature flag in production without a deployment.

### Task 31.11 — Razorpay Live Mode Switch
Test payment flow on staging with Razorpay test credentials. Document the checklist for switching `razorpay_live_mode` flag to true. Perform UAT on staging. Switch flag to true in production only after UAT passes.

---

## Testing Checklist

```
✓ Migration 0033: deployment_log, feature_flags tables created with RLS
✓ Feature flags seeded: all 5 initial flags present with correct defaults
✓ useFeatureFlag('ai_vendor_recommendations') returns true/false correctly
✓ Feature flag toggle: Platform Admin can enable/disable; change reflected on next reload
✓ ci.yml: PR validation workflow runs and all gates pass
✓ staging.yml: push to develop triggers migration + deployment to staging
✓ production.yml: push to main triggers migration + deployment to production
✓ /api/health: returns 200 with correct JSON when DB connected
✓ /api/health: returns 503 when DB connection fails (simulated)
✓ Custom domain: HTTPS active; Supabase Auth redirects working on production domain
✓ Environment variables: all vars present in Vercel production and staging
✓ NEXT_PUBLIC_SUPABASE_ANON_KEY: present in browser; service role key absent from browser
✓ Branch protection: direct push to main rejected
✓ Uptime monitor: pinging /api/health every 60 seconds; alerting configured
✓ Rollback: Vercel instant rollback tested in staging
✓ Feature flag: disabling ai_insights hides AI insight feed on next page load
✓ razorpay_live_mode: test mode confirmed in staging before production switch
```

---

## Acceptance Criteria

```
AC-31.1  Migration 0033 applied; feature_flags and deployment_log tables active
AC-31.2  ci.yml, staging.yml, production.yml workflows operational
AC-31.3  Push to develop auto-deploys to staging with migration applied first
AC-31.4  Push to main auto-deploys to production with migration applied first
AC-31.5  /api/health returns 200 with correct version and DB status
AC-31.6  Custom domain live with HTTPS; Auth redirects functioning
AC-31.7  Feature flags admin page functional; toggles take effect on page reload
AC-31.8  Uptime monitoring configured; alert fires on 503 from /api/health
AC-31.9  Rollback procedure documented and tested in staging
AC-31.10 All production secrets configured; none committed to git
```

---

## Definition of Done

Phase 31 is complete when all Acceptance Criteria above are met AND:

- [ ] All TypeScript checks pass (zero errors)
- [ ] All ESLint checks pass (zero warnings)
- [ ] Migration 0033 applied; `database.ts` regenerated
- [ ] ci.yml, staging.yml, production.yml merged to `main` and operational
- [ ] Staging deployment fully functional end-to-end
- [ ] Production deployment fully functional end-to-end
- [ ] Custom domain live with HTTPS
- [ ] Uptime monitoring configured with alert recipient
- [ ] Rollback runbook documented in `docs/RUNBOOK.md`
- [ ] Razorpay live mode checklist completed on staging before production switch
- [ ] PR merged to `main` with at least 1 reviewer approval

---

## Risk Factors

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Production migration fails mid-deployment | Low | Critical | Apply migrations as separate CI step before code deploy; test every migration in staging first |
| Vercel deployment has stale env vars after secret rotation | Low | Medium | Document secret rotation runbook; Vercel redeploys automatically when env vars change |
| Supabase PITR restoration slow during incident | Low | High | Practice PITR restoration in staging quarterly; document recovery time objective |
| CI pipeline takes > 20 minutes blocking developer velocity | Medium | Medium | Parallelise test jobs; cache pnpm dependencies; use Vercel build cache |
| razorpay_live_mode accidentally set to true before UAT | Low | Critical | Require two-person confirmation (admin + one approver) to enable razorpay_live_mode in production |

---

## Best Practices

- Apply migrations before deploying application code — a new code version must never run against an old schema
- Use feature flags for any feature that requires a production kill switch — Razorpay live mode and AI features are the two most critical in VendorFlow
- Keep the CI pipeline fast (< 15 minutes) by parallelising test jobs — slow pipelines lead developers to skip CI and merge untested code
- Document every production incident, its root cause, and its resolution in a shared incident log — this builds institutional knowledge and prevents repeat incidents
- Test the rollback procedure in staging at least once before going live — rollbacks that have never been rehearsed often fail in the moment they are needed most

---

## Estimated Completion

**4–5 working days.** The CI/CD pipeline configuration is the most time-intensive task due to the Supabase CLI and Vercel CLI integration. Environment variable configuration across three environments (local, staging, production) also takes longer than expected. Allow a full day for the Razorpay live mode UAT and switch.

---

---

# PHASE 32 — PRODUCTION READINESS

---

## Overview

| Field | Value |
|---|---|
| Phase Number | 32 |
| Phase Name | Production Readiness |
| Milestone | M8 — Launch |
| PRD Reference | (Cross-cutting — launch preparation) |
| DESIGN Reference | (Cross-cutting) |
| Estimated Duration | 5–6 days |
| Prerequisite Phases | Phase 31 complete (deployment pipeline operational) |

---

## Purpose

Phase 32 is the final pre-launch gate. It covers all activities required to make VendorFlow ready for real users and real transactions: legal and compliance checklist (Privacy Policy, Terms of Service, Cookie Policy), user acceptance testing (UAT) with real pilot users, data migration tooling for companies bringing their existing vendor data onto the platform, error tracking and observability setup (Sentry), rate limiting and abuse protection, final security review, performance optimisation pass, and the launch-day runbook. This phase ends with the platform being declared production-ready and the first company onboarding beginning.

---

## Business Goal

Going live on an enterprise procurement platform means real money changes hands and real procurement decisions are recorded. A platform that crashes on launch day, leaks data, or accepts fraudulent payments destroys trust that takes years to rebuild. Phase 32 ensures that every risk identified across all previous phases has a documented mitigation, that the system has been validated by real users before broad launch, that legal compliance is established, and that the engineering team has a clear, rehearsed plan for handling the first 48 hours of production traffic.

---

## Dependencies

- Phase 31 complete (production deployment pipeline operational, custom domain live)
- Phase 30 complete (all tests passing)
- Legal: Privacy Policy and Terms of Service documents (external — provided by legal counsel)
- Pilot user cohort: 2–3 early-access company accounts and their vendor contacts

---

## Database Tables

Migration: `0034_create_production_readiness.sql`

```sql
-- ============================================================
-- Migration: 0034_create_production_readiness
-- Description: Production readiness support tables
-- ============================================================

-- Error log for production exceptions (Sentry is primary; this is secondary)
create table public.error_logs (
  id           uuid primary key default gen_random_uuid(),
  error_type   text not null,
  message      text not null,
  stack        text,
  user_id      uuid references public.profiles(id) on delete set null,
  company_id   uuid references public.companies(id) on delete set null,
  path         text,
  metadata     jsonb,
  created_at   timestamptz not null default now()
);

create index idx_error_logs_type       on public.error_logs(error_type);
create index idx_error_logs_created_at on public.error_logs(created_at desc);

-- Rate limiting counters (short TTL; cleaned by pg_cron)
create table public.rate_limit_counters (
  key        text not null,      -- e.g. 'ai_call:user_id:minute:2026-07-08T12:00'
  count      integer not null default 0,
  window_end timestamptz not null,
  primary key (key)
);

create index idx_rate_limit_window on public.rate_limit_counters(window_end);

-- UAT feedback (pilot users)
create table public.uat_feedback (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references public.profiles(id),
  page         text,
  feedback     text not null,
  rating       smallint check (rating between 1 and 5),
  browser      text,
  created_at   timestamptz not null default now()
);

-- RLS
alter table public.error_logs          enable row level security;
alter table public.rate_limit_counters enable row level security;
alter table public.uat_feedback        enable row level security;

create policy "error_logs_admin_read"
  on public.error_logs for select
  using (public.is_platform_admin());

-- rate_limit_counters: service role only (managed by Edge Functions)
create policy "rate_limit_service_only"
  on public.rate_limit_counters for all using (false);

create policy "uat_feedback_own_write"
  on public.uat_feedback for insert
  with check (user_id = auth.uid());

create policy "uat_feedback_admin_read"
  on public.uat_feedback for select
  using (public.is_platform_admin());

-- pg_cron: clean up expired rate limit counters hourly
-- select cron.schedule('clean-rate-limits', '0 * * * *',
--   'DELETE FROM public.rate_limit_counters WHERE window_end < now()');
```

---

## Relationships

```
public.error_logs         — application exceptions; linked to user/company when available
public.rate_limit_counters — short-TTL counters for API rate limiting
public.uat_feedback        — pilot user feedback during pre-launch testing
```

---

## API Endpoints

| Operation | Method | Implementation | Notes |
|---|---|---|---|
| Submit UAT feedback | Client mutation | `supabase.from('uat_feedback').insert()` | Own user only |
| List UAT feedback | Server Component | `supabase.from('uat_feedback').select('*')` | Platform Admin only |
| Log client error | POST `/api/errors` | Next.js route handler | Accepts client-side errors; inserts to error_logs |
| Get rate limit status | Edge Function internal | Reads rate_limit_counters | Not a public endpoint |

**`src/app/api/errors/route.ts`** (client-side error reporting):

```typescript
export async function POST(req: Request) {
  const { error_type, message, stack, path, metadata } = await req.json()
  const supabase = createServiceClient()
  await supabase.from('error_logs').insert({
    error_type, message, stack, path, metadata,
    // user_id and company_id populated from auth context if available
  })
  return new Response(null, { status: 204 })
}
```

---

## Supabase Services Used

```
Supabase Database:
  - public.error_logs           — server-side and client-side error capture
  - public.rate_limit_counters  — API rate limiting state
  - public.uat_feedback         — pilot user feedback collection

External Services:
  - Sentry (primary error tracking and performance monitoring)
  - Vercel Analytics (Core Web Vitals)
  - Vercel Speed Insights (real-user monitoring)
  - UptimeRobot or Better Uptime (availability monitoring — Phase 31)
  - Resend (transactional email)
```

---

## Folder Structure

```
├── docs/
│   ├── RUNBOOK.md                  [Operations runbook — Phase 31]
│   ├── LAUNCH_CHECKLIST.md         [Production readiness checklist]
│   ├── UAT_PLAN.md                 [UAT test scenarios for pilot users]
│   └── DATA_MIGRATION_GUIDE.md     [Guide for importing existing vendor data]
├── scripts/
│   ├── import-vendors.ts           [Bulk vendor data importer from CSV]
│   ├── import-products.ts          [Bulk product data importer from CSV]
│   └── validate-production.ts      [Post-deploy validation script]
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── errors/
│   │   │       └── route.ts
│   │   └── (company)/
│   │       └── feedback/
│   │           └── page.tsx        [UAT feedback submission page]
│   └── components/
│       └── layout/
│           └── feedback-widget.tsx [Floating UAT feedback button]
└── public/
    ├── privacy-policy.html         [Linked from footer and sign-up flow]
    └── terms-of-service.html
```

---

## UI Screens

### Screen 32.1 — UAT Feedback Widget (Floating — All Pages during UAT period)

A small floating feedback button in the bottom-right corner of all pages during UAT. Clicking opens a `Sheet` with:

- Page/feature selector (auto-populated from current route)
- Star rating (1–5)
- Free-text feedback textarea
- "Submit" button

Hidden in production after UAT period ends (controlled via feature flag `uat_feedback_enabled`).

---

### Screen 32.2 — Privacy Policy Page (`/privacy`)

Static page rendering `public/privacy-policy.html`. Linked from the registration page footer and the platform footer. No login required.

---

### Screen 32.3 — Terms of Service Page (`/terms`)

Static page rendering `public/terms-of-service.html`. Same access pattern as Privacy Policy. Presented as a checkbox agreement during company and vendor registration (wired to the onboarding flows in Phases 5 and 8).

---

### Screen 32.4 — UAT Feedback Admin (`/admin/uat-feedback`)

`PageHeader`: title "UAT Feedback".

`DataTable`: user email, page, rating (stars), feedback text, submitted at. Read-only. Platform Admin only.

---

### Screen 32.5 — Data Import (Admin — `/admin/import`)

`PageHeader`: title "Data Import".

Two sections:

1. **Vendor Import**: CSV upload (vendor name, email, category, phone, address). Preview table of parsed rows before import. "Import" button calls `import-vendors.ts` script via an Edge Function.

2. **Product Import**: CSV upload (vendor email, product name, SKU, category, price, UOM). Same preview-and-import pattern.

---

## Components

### `FeedbackWidget`

```typescript
interface FeedbackWidgetProps {
  currentPath: string
}
```

Floating "Feedback" button positioned `fixed bottom-4 right-4`. Only rendered when `useFeatureFlag('uat_feedback_enabled')` returns true.

### `UATFeedbackForm`

```typescript
interface UATFeedbackFormProps {
  currentPath: string
  onSubmit:    (data: FeedbackData) => Promise<void>
}
```

Sheet form with star rating and textarea.

### `DataImportPanel`

```typescript
interface DataImportPanelProps {
  type:         'vendor' | 'product'
  onImport:     (rows: ParsedRow[]) => Promise<ImportResult>
}
```

CSV file input + `Papa.parse` for client-side parsing + preview DataTable + import trigger. Shows per-row success/error after import.

### `ErrorBoundary`

```typescript
interface ErrorBoundaryProps {
  children:  React.ReactNode
  fallback?: React.ReactNode
}
```

React error boundary. On caught error: renders a user-friendly error card ("Something went wrong. Please refresh the page."), calls `/api/errors` to log the error, and forwards to Sentry if configured.

---

## Forms

### Form 32.1 — UAT Feedback Form

| Field | Type | Validation |
|---|---|---|
| Rating | star selector | Required, 1–5 |
| Feedback | textarea | Required, min 10 chars, max 1000 chars |

---

## Tables

### UAT Feedback Admin Table

| Column | Sortable | Filterable |
|---|---|---|
| User Email | No | Yes (search) |
| Page | No | Yes |
| Rating | Yes | Yes (min rating) |
| Feedback | No | No |
| Submitted At | Yes (default desc) | Yes (date range) |

### Data Import Preview Table

| Column | Sortable | Filterable |
|---|---|---|
| Row # | No | No |
| Name | No | No |
| Email | No | No |
| Status | No | No (valid/error) |
| Error Message | No | No |

---

## Permissions

```
UAT feedback submit:
  - All authenticated users (during UAT period)
  - Controlled by uat_feedback_enabled feature flag

UAT feedback read:
  - Platform Admin only

Data import:
  - Platform Admin only

Privacy Policy / Terms of Service:
  - Public (no authentication required)

Error log read:
  - Platform Admin only

Rate limit counters:
  - Service role only (Edge Functions)
```

---

## Validation Rules

```
Privacy Policy acceptance:
  - Company registration flow (Phase 5): terms_accepted boolean required = true
  - Vendor registration flow (Phase 8): same requirement
  - Stored as a column on companies and vendors tables:
    ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS terms_accepted_at timestamptz;
    ALTER TABLE public.vendors ADD COLUMN IF NOT EXISTS terms_accepted_at timestamptz;

Data import CSV validation:
  - Max 500 rows per import
  - Required columns validated per import type
  - Email format validated for vendor imports
  - Duplicate detection: rows with existing email are skipped with warning
  - Category names must match existing product_categories.name

Rate limiting:
  - AI Edge Function calls: max 5 per user per minute
  - PR/RFQ/PO creation: max 10 per user per minute
  - Auth operations: max 5 per IP per minute (handled by Supabase Auth)
  - Counters use sliding window algorithm; stored in rate_limit_counters

Sentry:
  - Only non-PII context sent to Sentry
  - user.id (not email) included in Sentry events for correlation
  - Stack traces always included
  - Environment tag set to 'production' or 'staging'
```

---

## Business Rules

```
BR-32.1  Terms of Service and Privacy Policy acceptance is required at company
         registration and vendor registration. The acceptance timestamp is stored.
         Users cannot complete registration without accepting both documents.

BR-32.2  UAT feedback is collected during a defined UAT period (typically 2 weeks
         before public launch). After the UAT period, the feedback widget is hidden
         by setting the uat_feedback_enabled feature flag to false.

BR-32.3  The UAT plan covers all 32 phases across 5 test scenarios:
         1. Full procurement cycle from PR to payment
         2. Vendor management (onboarding, catalog, inventory)
         3. Approval workflow at different budget thresholds
         4. Notification delivery (in-app + email)
         5. Admin operations (verify vendor, view audit log)
         UAT must be signed off by at least 2 pilot company users and
         1 pilot vendor user before production launch is approved.

BR-32.4  Data import is a one-time migration tool for new customers bringing
         existing vendor lists onto VendorFlow. It creates vendor records and
         sends invitation emails to each vendor. It does not import historical
         transaction data (POs, invoices — these start fresh on VendorFlow).

BR-32.5  The launch checklist (LAUNCH_CHECKLIST.md) must be completed and
         signed off by the project lead before the production URL is shared
         with any external users. The checklist covers all 32 phases.

BR-32.6  Rate limiting protects against both abuse and accidental loops.
         Users who hit the rate limit receive a `429 Too Many Requests` response
         with a `Retry-After` header indicating the window reset time.
         Legitimate users are unlikely to hit these limits during normal use.

BR-32.7  Post-launch, the first 48 hours require a team member on-call to monitor
         Sentry, Supabase metrics, Vercel analytics, and the uptime monitor.
         All P0 incidents (data loss, payment failure, auth failure) must be
         escalated within 15 minutes of detection.
```

---

## Security

```
Final pre-launch security checklist:
  □ All RLS policies reviewed by a second developer
  □ All Edge Functions reviewed for: JWT verification, input sanitisation,
    sensitive data logging, error handling
  □ No secrets in git history (run git-secrets or truffleHog scan)
  □ Supabase Auth: email confirmation enabled, session duration set to 7 days
  □ All storage buckets: correct public/private settings verified
  □ CORS headers: Next.js API routes only accept requests from production domain
  □ Content Security Policy headers: configured in next.config.js
  □ Rate limiting: active for all public-facing Edge Functions
  □ Razorpay: live mode tested and HMAC webhook verified with production secret
  □ PITR: Supabase Point-in-Time Recovery enabled on production project
  □ Admin panel: /admin/* accessible only to platform_admin role (tested)
  □ Privacy Policy and Terms of Service: linked from registration and footer
  □ Cookie consent: GDPR-compliant cookie banner if targeting EU users

Content Security Policy (next.config.js):
  headers: [{
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' https://checkout.razorpay.com",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
      "img-src 'self' data: https://*.supabase.co",
      "frame-src https://api.razorpay.com",
    ].join('; ')
  }]
```

---

## State Management

```typescript
// Global error boundary with Sentry integration
// src/app/global-error.tsx
'use client'
import * as Sentry from '@sentry/nextjs'
import { useEffect } from 'react'

export default function GlobalError({ error, reset }: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <html>
      <body>
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-semibold">Something went wrong</h1>
            <p className="mt-2 text-muted-foreground">
              Our team has been notified. Please try refreshing the page.
            </p>
            <button onClick={reset} className="mt-4 btn-primary">
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}
```

---

## Development Tasks

### Task 32.1 — Migration
Apply migration `0034_create_production_readiness.sql`. Add `terms_accepted_at` columns to `companies` and `vendors`. Regenerate `database.ts` types.

### Task 32.2 — Terms Acceptance in Registration Flows
Add terms acceptance checkbox to company onboarding (Phase 5) and vendor onboarding (Phase 8). Store `terms_accepted_at` on submit. Test: registration blocked without acceptance.

### Task 32.3 — Sentry Setup
Install `@sentry/nextjs`. Configure `sentry.client.config.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts`. Add `SENTRY_DSN` and `SENTRY_AUTH_TOKEN` to environment variables. Wire `global-error.tsx`. Test that a thrown error appears in Sentry dashboard.

### Task 32.4 — Error Boundary Component
Implement `ErrorBoundary` component with `/api/errors` reporting. Wrap all major page sections. Test with a deliberately thrown error.

### Task 32.5 — Rate Limiting
Implement rate limiting utility in `supabase/functions/_shared/rate-limit.ts`. Wire into AI Edge Functions and document creation functions. Test: 6th call in 1 minute returns 429.

### Task 32.6 — UAT Feedback Widget
Implement `FeedbackWidget` and `UATFeedbackForm`. Add `uat_feedback_enabled` feature flag to `0033` seeds. Wire into root layout (company + vendor). Test submission.

### Task 32.7 — Data Import Scripts
Implement `import-vendors.ts` and `import-products.ts` scripts with Papa.parse, validation, and batch insert via Edge Function. Implement admin import page.

### Task 32.8 — Privacy Policy and Terms of Service Pages
Create static `/privacy` and `/terms` pages. Add links to registration pages and platform footer. Test links from onboarding flows.

### Task 32.9 — Sentry Performance Monitoring
Configure Sentry performance tracing: trace all API routes and Edge Functions. Set sampling rate to 10% in production (100% in staging). Verify traces appear in Sentry performance dashboard.

### Task 32.10 — Launch Checklist Execution
Work through every item in `LAUNCH_CHECKLIST.md`. Document sign-off for each item. Fix any open items. Final sign-off required from project lead.

### Task 32.11 — Content Security Policy Headers
Configure CSP headers in `next.config.js`. Test that Razorpay checkout still functions under CSP. Test that Supabase Realtime WebSocket connects under CSP.

### Task 32.12 — UAT Execution with Pilot Users
Onboard 2–3 pilot companies and 1–2 pilot vendors. Guide them through the UAT plan scenarios. Collect feedback via the UAT widget. Triage and fix P0/P1 issues found during UAT. Obtain sign-off.

---

## Testing Checklist

```
✓ Migration 0034: error_logs, rate_limit_counters, uat_feedback tables active
✓ terms_accepted_at: company registration blocked without terms acceptance
✓ terms_accepted_at: vendor registration blocked without terms acceptance
✓ Sentry: test exception captured and visible in Sentry dashboard
✓ Sentry: user.id (not email) attached to Sentry events
✓ global-error.tsx: renders correctly on unhandled error; Sentry called
✓ ErrorBoundary: wraps page sections; graceful fallback rendered on component error
✓ Rate limiting: 5th AI call succeeds; 6th returns 429 with Retry-After header
✓ Feedback widget: visible when uat_feedback_enabled = true
✓ Feedback widget: hidden when uat_feedback_enabled = false
✓ Feedback form: submission saved; visible in admin UAT feedback page
✓ Data import: CSV with 10 vendors parsed, previewed, imported correctly
✓ Data import: duplicate email skipped with warning; valid rows imported
✓ /privacy page: accessible without login; correct content renders
✓ /terms page: accessible without login; correct content renders
✓ CSP headers: present on all page responses
✓ CSP: Razorpay checkout loads correctly under CSP
✓ CSP: Supabase Realtime WebSocket connects under CSP
✓ Launch checklist: all items checked and signed off
✓ UAT: at least 2 pilot users complete full procurement cycle without P0 issues
✓ pnpm build: zero TypeScript errors; pnpm lint: zero warnings
```

---

## Acceptance Criteria

```
AC-32.1  Migration 0034 applied; all production readiness tables active
AC-32.2  Terms acceptance required at both company and vendor registration
AC-32.3  Sentry configured; errors captured in production and staging dashboards
AC-32.4  Rate limiting active on AI and document creation endpoints
AC-32.5  UAT feedback widget functional and admin readable
AC-32.6  Data import (vendors + products) functional with CSV preview
AC-32.7  Privacy Policy and Terms of Service pages live and linked
AC-32.8  CSP headers configured; Razorpay and Supabase Realtime functional under CSP
AC-32.9  Launch checklist completed and signed off by project lead
AC-32.10 UAT signed off by 2+ pilot company users and 1+ pilot vendor users
```

---

## Definition of Done

Phase 32 is complete when all Acceptance Criteria above are met AND:

- [ ] All TypeScript checks pass (zero errors)
- [ ] All ESLint checks pass (zero warnings)
- [ ] Migration 0034 applied and committed; `database.ts` regenerated
- [ ] Sentry DSN configured in production Vercel environment
- [ ] CSP headers tested in production environment
- [ ] Rate limiting tested in staging environment
- [ ] Launch checklist signed off and committed to `docs/LAUNCH_CHECKLIST.md`
- [ ] UAT plan executed; feedback reviewed; P0/P1 issues resolved
- [ ] UAT sign-off documented
- [ ] Platform declared production-ready by project lead
- [ ] PR merged to `main`; production deployment tagged as `v1.0.0`

---

## Risk Factors

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| UAT reveals P0 bugs requiring significant rework | Medium | High | Run UAT with simulated data first; only engage real pilot users after internal smoke test passes |
| CSP headers break Razorpay checkout in production | Medium | High | Test CSP in a production-identical staging environment with real Razorpay test flows before go-live |
| Sentry SDK version incompatible with Next.js App Router | Low | Medium | Pin Sentry SDK version; test in staging before production config |
| Rate limiting false positives blocking legitimate users | Low | Medium | Set rate limits conservatively high; monitor Sentry for 429 errors in the first 48 hours post-launch |
| Pilot user finds fundamental UX flaw requiring design change | Low | High | Run internal team walkthrough before pilot UAT; treat any Severity 1 UX finding as a launch blocker |

---

## Best Practices

- Execute the full launch checklist in order — do not skip items even when under time pressure
- Monitor Sentry in real time during the first 48 hours post-launch; assign an on-call engineer
- Keep the UAT pilot group small (2–3 companies) but representative — include one enterprise company and one SMB to validate that both scale configurations work
- Use the data import tool to onboard pilot companies' existing vendor lists before UAT begins — this makes the UAT more realistic and valuable
- Tag the production deployment `v1.0.0` in git immediately after launch — this creates a rollback point and starts the semantic versioning history

---

## Estimated Completion

**5–6 working days.** Sentry setup, CSP configuration, and rate limiting are the technical tasks. The launch checklist execution and UAT coordination with pilot users are the time-variable tasks — UAT duration depends on pilot user availability and the severity of issues found. Allow a full buffer week between UAT start and the public launch date to handle any issues discovered.

---

---

---

# OVERALL PROJECT TIMELINE

---

## Phase Summary Table

| Phase | Name | Milestone | Estimated Duration | Key Deliverable |
|---|---|---|---|---|
| 1 | Project Foundation | M1 | 2–3 days | Repo, tooling, folder structure, linting, Supabase connection |
| 2 | UI Foundation | M1 | 3–4 days | Design system, component library, tokens, Storybook |
| 3 | Backend Foundation | M1 | 2–3 days | DB schema scaffold, shared Edge Function utilities, storage buckets |
| 4 | Authentication | M2 | 3–4 days | Email + Google login, onboarding flow, JWT session, profiles table |
| 5 | Company Workspace | M2 | 3–4 days | Company creation, settings, onboarding wizard |
| 6 | IAM | M2 | 3–4 days | Role engine, permission matrix, has_permission() function |
| 7 | Employee Management | M2 | 2–3 days | Invite flow, department management, employee directory |
| 8 | Vendor Workspace | M2 | 3–4 days | Vendor onboarding, profile settings, workspace |
| 9 | Vendor Marketplace | M2 | 3–4 days | Vendor discovery, search, filters, connect |
| 10 | Vendor Profile | M2 | 2–3 days | Public profile, ratings panel, documents, products tab |
| 11 | Vendor Documents | M3 | 3–4 days | Document upload, verification status, expiry tracking |
| 12 | Product Catalog | M3 | 4–5 days | Product CRUD, image upload, vendor catalog, company browse |
| 13 | Product Categories | M3 | 2–3 days | Category tree, two-level hierarchy, CategorySelect |
| 14 | Inventory Management | M3 | 3–4 days | Stock levels, movement log, reorder alerts, availability view |
| 15 | Procurement Requests | M4 | 4–5 days | PR create/submit/approve, approval chain, attachments |
| 16 | Vendor Quotations | M4 | 5–6 days | RFQ create/send, vendor quotation submit/revise, pg_cron deadline |
| 17 | Quotation Comparison | M4 | 3–4 days | Side-by-side grid, vendor selection, atomic award |
| 18 | Purchase Orders | M4 | 5–6 days | PO create, inventory reserve, vendor accept/reject, PDF, email |
| 19 | Order Tracking | M4 | 3–4 days | Shipment status stepper, event log, forward-only transitions |
| 20 | Goods Receipt (GRN) | M4 | 3–4 days | GRN create/confirm, inventory update, 3-way match |
| 21 | Invoice Management | M5 | 4–5 days | GST invoice, approval workflow, PDF, email |
| 22 | Payment Management | M5 | 4–5 days | Razorpay integration, webhook, receipt PDF |
| 23 | Procurement Analytics | M6 | 5–6 days | Materialized views, KPI cards, spend charts, department table |
| 24 | Vendor Performance | M6 | 3–4 days | Star ratings, performance trigger, reviews list |
| 25 | Notification System | M6 | 4–5 days | In-app Realtime, email via Resend, preferences, 16 event types |
| 26 | Audit Logs | M6 | 3–4 days | Immutable log, REVOKE, per-record activity, CSV export |
| 27 | Platform Administration | M7 | 4–5 days | Admin panel, vendor verification, moderation, system settings |
| 28 | AI Modules | M7 | 6–8 days | Vendor recommendations, quotation summary, insights, risk badge |
| 29 | System Settings | M7 | 3–4 days | Company/vendor/user settings consolidation, approval thresholds |
| 30 | Testing & QA | M7 | 6–8 days | Unit, integration, E2E, a11y, Lighthouse CI |
| 31 | Deployment & DevOps | M8 | 4–5 days | CI/CD pipelines, feature flags, production deploy, custom domain |
| 32 | Production Readiness | M8 | 5–6 days | Sentry, UAT, launch checklist, terms/privacy, rate limiting |

---

## Total Estimated Development Duration

| Estimate Basis | Working Days | Calendar Weeks |
|---|---|---|
| Sum of all phase minimums | 113 days | ~23 weeks |
| Sum of all phase maximums | 140 days | ~28 weeks |
| **Realistic estimate (with integration overhead, reviews, rework)** | **160–180 days** | **32–36 weeks** |

**Recommended project timeline: 8–9 months from Phase 1 kick-off to v1.0.0 production launch.**

This accounts for:
- Code review and PR merge cycles (+10%)
- Bug fixing and rework between phases (+10%)
- Stakeholder reviews and design iterations (+5%)
- Infrastructure setup and third-party account configuration (+5%)
- UAT coordination with pilot users (+2 weeks fixed)

---

## Suggested Milestone Plan

### Milestone 1 — Foundation (Weeks 1–3)
**Goal:** Working development environment with authentication.

Phases: 1 (Project Foundation), 2 (UI Foundation), 3 (Backend Foundation), 4 (Authentication)

**Deliverables:**
- Monorepo set up with Supabase, Next.js, TypeScript, Tailwind, Vitest, Playwright
- Design tokens and base component library implemented
- Authentication flow: register, login, Google OAuth, email verification, password reset
- User profile created on registration

**Exit Criteria:** Any developer can clone the repo, run `supabase start` and `pnpm dev`, create a test account, and log in within 30 minutes.

---

### Milestone 2 — Workspace Infrastructure (Weeks 4–8)
**Goal:** Both company and vendor workspaces fully operational with IAM.

Phases: 5 (Company Workspace), 6 (IAM), 7 (Employee Management), 8 (Vendor Workspace), 9 (Vendor Marketplace), 10 (Vendor Profile)

**Deliverables:**
- Company workspace creation and settings
- Full IAM with permission matrix
- Employee invite and department management
- Vendor onboarding and profile
- Vendor marketplace search and discovery

**Exit Criteria:** A company can be created, employees invited, and a vendor can register and appear in the marketplace.

---

### Milestone 3 — Vendor & Product Ecosystem (Weeks 9–13)
**Goal:** Vendors can publish a complete catalog with inventory.

Phases: 11 (Documents), 12 (Product Catalog), 13 (Categories), 14 (Inventory)

**Deliverables:**
- Vendor document upload and verification workflow
- Full product catalog with images, categories, UOM
- Category taxonomy (15 root categories seeded)
- Inventory tracking with reorder alerts and availability view

**Exit Criteria:** A verified vendor has a complete product catalog with stock levels, visible to company buyers.

---

### Milestone 4 — Core Procurement Lifecycle (Weeks 14–22)
**Goal:** Full procurement cycle from PR to GRN operational.

Phases: 15 (PRs), 16 (RFQs), 17 (Comparison), 18 (POs), 19 (Order Tracking), 20 (GRN)

**Deliverables:**
- Purchase Request workflow with approval chain
- RFQ creation, vendor invitation, quotation submission and revision
- Quotation comparison and vendor selection
- Purchase Order generation with inventory reservation, PDF, vendor response
- Shipment tracking with status updates
- Goods Receipt Note with inventory reconciliation

**Exit Criteria:** A company completes a full procurement cycle from PR creation to GRN confirmation with a live vendor on the platform.

---

### Milestone 5 — Finance (Weeks 23–26)
**Goal:** Complete invoice-to-payment cycle.

Phases: 21 (Invoice Management), 22 (Payment Management)

**Deliverables:**
- GST-compliant invoice creation, approval, and PDF generation
- Razorpay payment integration with webhook verification
- Payment receipt generation and email delivery

**Exit Criteria:** A vendor generates a GST invoice, the company approves it, and a test payment is completed via Razorpay.

---

### Milestone 6 — Analytics & Intelligence (Weeks 27–33)
**Goal:** Platform-wide analytics, notifications, audit, and AI features.

Phases: 23 (Analytics), 24 (Vendor Performance), 25 (Notifications), 26 (Audit Logs), 27 (Admin), 28 (AI)

**Deliverables:**
- Procurement analytics dashboard with spend charts
- Vendor performance reviews and aggregate scores
- Full in-app and email notification system (16 event types)
- Immutable audit log with cross-workspace access for Platform Admin
- Admin panel with vendor verification, moderation, and system settings
- AI vendor recommendations, quotation summary, and procurement insights

**Exit Criteria:** Platform Admin can verify vendors, audit all activity, and company users receive correct notifications. AI features return results for an RFQ with 3 vendors.

---

### Milestone 7 — Operations & Hardening (Weeks 34–38)
**Goal:** System settings consolidated, full test coverage, and operational readiness.

Phases: 29 (System Settings), 30 (Testing & QA)

**Deliverables:**
- All settings surfaces unified (company, vendor, user)
- ≥80% unit test coverage
- 100% RLS and Edge Function integration test coverage
- Full E2E test suite including full procurement cycle
- Zero axe-core critical/serious accessibility violations
- All Lighthouse CI thresholds met

**Exit Criteria:** `pnpm test`, `pnpm test:e2e`, `pnpm test:a11y`, and Lighthouse CI all pass cleanly in CI.

---

### Milestone 8 — Launch (Weeks 39–43)
**Goal:** Production-ready platform live with pilot users.

Phases: 31 (Deployment & DevOps), 32 (Production Readiness)

**Deliverables:**
- CI/CD pipeline operational (PR → staging → production)
- Custom domain live with HTTPS
- Sentry error tracking configured
- Feature flags operational
- UAT completed and signed off
- Launch checklist completed
- v1.0.0 tagged and deployed to production

**Exit Criteria:** At least 2 pilot companies and 1 pilot vendor have completed the full procurement cycle on the production platform. Project lead has signed off on the launch checklist.

---

## Parallel Development Opportunities

Several phases have independent work streams that can be developed simultaneously by separate developers to compress the calendar timeline:

| Parallel Stream A | Parallel Stream B | Weeks |
|---|---|---|
| Phase 5 — Company Workspace | Phase 8 — Vendor Workspace | Weeks 4–5 |
| Phase 6 — IAM | Phase 9 — Vendor Marketplace | Weeks 5–6 |
| Phase 12 — Product Catalog | Phase 13 — Categories | Weeks 9–10 |
| Phase 14 — Inventory | Phase 11 — Documents | Weeks 11–12 |
| Phase 15 — PRs | Phase 16 — RFQs (items/UI) | Weeks 14–16 |
| Phase 21 — Invoices | Phase 22 — Payments (setup) | Weeks 23–24 |
| Phase 23 — Analytics | Phase 24 — Vendor Performance | Weeks 27–28 |
| Phase 25 — Notifications | Phase 26 — Audit Logs | Weeks 29–30 |
| Phase 28 — AI Modules | Phase 29 — System Settings | Weeks 34–35 |
| Phase 31 — DevOps | Phase 30 — Testing (unit layer) | Weeks 34–36 |

**Team sizing for parallel development:**
- 2 developers: compress M4 procurement cycle from 9 to 6 weeks
- 3 developers: compress M6 analytics/notifications/audit from 7 to 4 weeks
- Minimum viable team for planned timeline: 2 full-stack developers

---

## Critical Path

The critical path defines the sequence of phases where delay in any one phase delays the final launch. All other phases can be delayed up to their float without affecting the launch date.

```
Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5 → Phase 6
  └→ Phase 7 → Phase 8
        └→ Phase 12 → Phase 15 → Phase 16 → Phase 17 → Phase 18
                  └→ Phase 14         └→ Phase 19 → Phase 20
                                             └→ Phase 21 → Phase 22
                                                    └→ Phase 30 → Phase 31 → Phase 32
```

**Critical path phases (no float — delay = launch delay):**
Phase 1, 2, 3, 4, 5, 6, 12, 15, 16, 17, 18, 19, 20, 21, 22, 30, 31, 32

**Non-critical path phases (have float):**
Phase 7 (±1 week), Phase 8 (±1 week), Phase 9 (±2 weeks), Phase 10 (±2 weeks), Phase 11 (±1 week), Phase 13 (±1 week), Phase 14 (±1 week), Phase 23–28 (±2 weeks collectively), Phase 29 (±1 week)

---

## Release Strategy

### v0.1.0 — Internal Alpha (Milestone 2 complete)
- Internal team only
- Company + vendor workspaces functional
- No production data
- Purpose: validate architecture and onboarding flows

### v0.5.0 — Private Beta (Milestone 4 complete)
- Invite-only: 2–3 pilot companies and their vendors
- Full procurement cycle: PR → RFQ → Quotation → PO → GRN
- No payment integration yet (manual offline payment)
- Purpose: validate procurement UX with real users

### v0.8.0 — Closed Beta (Milestone 5 complete)
- Expand to 5–10 companies
- Full invoice and payment integration active (Razorpay test mode → live)
- Analytics and notifications live
- Purpose: validate financial workflows and scale

### v1.0.0 — General Availability (Milestone 8 complete)
- Public launch
- All 32 phases complete
- Full test coverage
- Production-hardened with monitoring and error tracking
- AI features available (with feature flag controls)

### Post-v1.0.0 Patch Releases (v1.x.x)
- Bug fixes and minor improvements
- Released on a 2-week cycle
- Require: full CI pass, at least 1 reviewer, regression test on staging

### Minor Releases (v1.y.0) — Quarterly
- New features from the expansion roadmap
- Full Phase-style documentation before development begins
- Require: UAT sign-off and updated DEVELOPMENT_PHASES.md section

---

## Post-Launch Maintenance Plan

### First 30 Days
- On-call engineer rostered for P0 incident response (15-minute escalation SLA)
- Daily review of Sentry error trends
- Daily review of Supabase metrics (DB connections, query performance, storage usage)
- Weekly UAT feedback review and triage
- Weekly production health check and deployment log review
- Bug fix releases as needed (no feature work in first 30 days)

### Months 2–3
- Bi-weekly retrospective on stability metrics
- Address all P1 issues from pilot user feedback
- Baseline performance benchmarks established
- Database query optimisation pass (identify slow queries from Supabase logs)
- Begin planning v1.1.0 feature set based on user feedback

### Ongoing (Monthly)
- Review Supabase storage growth; plan for tier upgrades if needed
- Review Resend email delivery rates; investigate failed deliveries
- Review OpenAI API costs; adjust caching TTLs or model selection if over budget
- Review audit log table growth; implement archival policy if approaching limits
- Review Razorpay transaction success rate; investigate failed payments
- Rotate secrets (Razorpay, Resend, OpenAI keys) on the first Monday of each quarter

### Database Maintenance
- pg_cron jobs monitored: analytics refresh (01:00 UTC), notification retention (02:00 UTC), rate limit cleanup (hourly)
- Monthly: VACUUM ANALYZE on high-write tables (notifications, inventory_movements, audit_logs, shipment_events)
- Quarterly: Review and REINDEX high-churn indexes
- Annually: Review materialized view definitions as data volume grows

---

## Technical Debt Guidelines

Technical debt is tracked in a `docs/TECHNICAL_DEBT.md` file and reviewed at each quarterly planning session. The following categories are used:

### Category A — Deferred Features (Planned)
Items explicitly deferred to post-v1.0 in the PRD or this document. These are tracked with their originating phase reference and an estimated effort. Examples:
- Multi-invoice per PO (Phase 21 BR-21.3)
- Partial-delivery re-PO flow (Phase 20 BR-20.7)
- Email notifications for bulk events (Phase 25)
- AI-powered purchase request suggestions beyond description (Phase 28)

### Category B — Known Shortcuts (Must Resolve Before v2.0)
Technical compromises made to meet the v1.0 timeline that must be cleaned up before significant scale:
- Analytics polling instead of Realtime (Phase 23) — acceptable to 10k POs; needs Realtime at scale
- Single-region Supabase deployment — adequate for Indian market launch; add second region for global expansion
- Manual vendor re-invitation after decline (Phase 16 BR-16.4) — add self-service re-invite flow
- procurement_summary_monthly populated by nightly cron — add real-time incremental updates at scale

### Category C — Accepted Limitations (Permanent v1 Scope)
Items explicitly out of scope per the PRD that will not be revisited unless the PRD is updated:
- Mobile apps (native iOS/Android)
- ERP integrations (SAP, Oracle, Tally)
- Offline mode
- Multi-currency conversion
- AI auto-decisions (auto-award, auto-approve)

### Debt Tracking Rule
No new technical debt can be introduced without a corresponding entry in `TECHNICAL_DEBT.md`. PRs adding known shortcuts must include a TECHNICAL_DEBT.md update in the same PR.

---

## Future Expansion Strategy

### v1.1 — Communication Center (Q2 post-launch)
Implement PRD Module 32 — in-platform messaging between companies and vendors, threaded discussions per RFQ and PO, file attachments in chat. Replaces email-based negotiation entirely.

### v1.2 — Document Management (Q3 post-launch)
Implement PRD Module 33 — structured document vault with version history, access permissions, and document categories. Extends Phase 11 vendor documents to all procurement documents.

### v1.3 — Global Search (Q3 post-launch)
Implement PRD Module 41 — cross-entity search (products, vendors, POs, invoices, RFQs, employees) with pg_trgm full-text search and a unified search results page.

### v1.4 — Subscription & Billing (Q4 post-launch)
Implement PRD Module 48 — company subscription plans, billing history, plan upgrades/downgrades via Razorpay Subscriptions.

### v2.0 — Multi-Language & Global Expansion (Year 2)
- Add Hindi (hi-IN) and other regional Indian language support
- Multi-currency with real-time conversion via an FX API
- Multi-region Supabase deployment (Singapore + Mumbai)
- Compliance adapters for GST e-invoicing (IRN/QR code via NIC API)
- ERP integration framework (Tally, Zoho Books, QuickBooks adapter pattern)

### v3.0 — AI-First Procurement (Year 3)
Implement PRD AI modules (43–47) as full production features (not advisory):
- AI vendor matching with confidence scores replacing manual vendor selection in low-risk RFQs
- AI-generated RFQ from a PR description (zero-touch sourcing for commodity items)
- AI spend forecasting with budget alert system
- AI vendor risk scoring integrated into vendor verification workflow
- AI-powered purchase request auto-approval for low-value, repeat orders

---

## AI Readiness Roadmap

The AI modules in Phase 28 are intentionally scoped as advisory features. The following roadmap describes how AI deepens over each major version:

### v1.0 — AI Advisory Layer (Phase 28)
- AI recommends vendors (human selects)
- AI summarises quotations (human decides)
- AI surfaces procurement insights (human acts or dismisses)
- AI assists PR description (human accepts or edits)
- All AI output labelled; zero autonomous actions

### v1.x — AI Workflow Integration
- AI pre-ranks comparison grid (human still selects winner)
- AI flags suspicious invoices (unusually high amounts, duplicate reference numbers)
- AI predicts delivery delays based on vendor lead time history
- AI generates RFQ description from approved PR items
- All AI outputs stored with model version for auditability

### v2.0 — AI-Augmented Procurement
- AI auto-populates RFQ from PR (human reviews before sending)
- AI identifies preferred vendor list per category from historical performance
- AI generates draft PO from awarded quotation (human reviews before sending)
- AI spend forecasting feeds into company budget planning module
- Human-in-the-loop required for all AI-initiated document generation

### v3.0 — AI-First Procurement (for qualifying use cases)
- Autonomous RFQ → award → PO flow for commodity items below threshold
  (human sets the rules; AI executes within the rules)
- AI negotiation assistant: suggests counter-offers based on market pricing
- AI anomaly detection: real-time vendor risk alerts during active RFQ
- AI compliance checker: flags PRs or POs that violate procurement policy
- Full auditability: every AI decision logged with model, version, and input hash

**AI governance principles (applied across all versions):**
1. Every AI action is logged with model name, version, and input hash (ai_cache table)
2. Every AI-generated surface displays a "Generated by AI" label
3. Users can always override AI suggestions without friction
4. AI features can be disabled per workspace via feature flags
5. No personal data (email, name, GSTIN) is sent to external AI APIs
6. AI feature costs are monitored monthly; circuit breakers disable features if cost exceeds budget

---

---

**** END OF DEVELOPMENT_PHASES.md ****
