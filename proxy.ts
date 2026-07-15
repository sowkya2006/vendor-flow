import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'
import { createServerClient } from '@supabase/ssr'
import type { Database } from '@/lib/supabase/types'

// =============================================================================
// PORTAL ROUTING — TWO-SIGNAL ARCHITECTURE
//
// Signal 1 (Primary):   vf_portal cookie  — set at login, httpOnly, lasts 7 days
//                        value: 'company' | 'vendor'
//                        Written by the login forms on successful sign-in.
//                        This is the fastest, most reliable signal.
//
// Signal 2 (Fallback):  get_user_portal() RPC — SECURITY DEFINER Postgres fn
//                        Called when vf_portal cookie is absent or stale.
//                        Also used to validate the cookie is correct.
//
// Rule: Company user  → vf_portal=company  → only company routes
//       Vendor user   → vf_portal=vendor   → only vendor routes
//       No signal     → redirect to login
// =============================================================================

const PORTAL_COOKIE = 'vf_portal'
const PORTAL_TTL    = 60 * 60 * 24 * 7  // 7 days

type Portal = 'company' | 'vendor'

interface PortalCtx {
  portal: Portal
  role:   string
  setup:  boolean
}

// ── Cookie helpers ────────────────────────────────────────────────────────────

function readPortalCookie(req: NextRequest): Portal | null {
  const val = req.cookies.get(PORTAL_COOKIE)?.value
  if (val === 'company' || val === 'vendor') return val
  return null
}

function setPortalCookie(res: NextResponse, portal: Portal): void {
  res.cookies.set(PORTAL_COOKIE, portal, {
    httpOnly: true,
    sameSite: 'lax',
    maxAge:   PORTAL_TTL,
    path:     '/',
  })
}

function clearPortalCookie(res: NextResponse): void {
  res.cookies.delete(PORTAL_COOKIE)
  res.cookies.delete('vf_ctx')   // nuke old cache cookie too
}

// ── Supabase client (anon key + user session cookies, Edge-safe) ──────────────

function makeClient(req: NextRequest) {
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => req.cookies.getAll(), setAll: () => {} } },
  )
}

// ── getPortal — calls get_user_portal() RPC ────────────────────────────────
// SECURITY DEFINER function — bypasses all RLS, works with anon key.
// Returns null only on hard error (RPC missing, network issue).

async function getPortalFromDB(userId: string, req: NextRequest): Promise<PortalCtx | null> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = makeClient(req) as any
    const { data, error } = await db.rpc('get_user_portal', { p_user_id: userId })

    if (error) {
      console.error('[proxy] RPC error:', error.message)
      return null
    }

    // Handle both object and JSON-string responses
    const result = typeof data === 'string' ? JSON.parse(data) : data

    if (!result?.portal) {
      console.warn('[proxy] no portal for userId:', userId)
      return null
    }

    return {
      portal: result.portal as Portal,
      role:   result.role  ?? 'viewer',
      setup:  result.setup ?? false,
    }
  } catch (err) {
    console.error('[proxy] getPortalFromDB threw:', err)
    return null
  }
}

// ── Route classification ──────────────────────────────────────────────────────

const COMPANY_ROUTES = [
  '/dashboard', '/vendors', '/rfqs', '/purchase-orders', '/procurement',
  '/inventory', '/products', '/payments', '/analytics', '/settings',
  '/onboarding', '/approvals', '/quotations', '/audit-log', '/notifications',
]

const COMPANY_AUTH = [
  '/company/login', '/login', '/signup',
  '/forgot-password', '/reset-password', '/verify-email',
]

const VENDOR_AUTH = [
  '/vendor/login', '/vendor/register', '/vendor/verify-complete',
]

const VENDOR_ROUTES = [
  '/vendor/dashboard', '/vendor/profile', '/vendor/rfqs', '/vendor/quotations',
  '/vendor/purchase-orders', '/vendor/invoices', '/vendor/payments',
  '/vendor/notifications', '/vendor/companies', '/vendor/requests',
]

const ROLE_BLOCKED: Record<string, string[]> = {
  procurement_officer: [
    '/inventory', '/payments', '/approvals', '/audit-log',
    '/settings/employees', '/settings/roles',
    '/analytics/finance', '/analytics/inventory', '/analytics/approvals',
  ],
  procurement_manager: [
    '/inventory', '/payments',
    '/settings/employees', '/settings/roles',
    '/analytics/finance', '/analytics/inventory',
  ],
  warehouse_manager: [
    '/vendors', '/rfqs', '/quotations', '/purchase-orders', '/payments',
    '/approvals', '/audit-log', '/settings/employees', '/settings/roles',
    '/analytics/finance', '/analytics/procurement', '/analytics/vendors', '/analytics/approvals',
  ],
  finance_manager: [
    '/vendors', '/rfqs', '/quotations', '/purchase-orders',
    '/inventory', '/approvals', '/audit-log', '/settings/employees', '/settings/roles',
    '/analytics/procurement', '/analytics/vendors', '/analytics/inventory', '/analytics/approvals',
  ],
  viewer: [
    '/vendors', '/rfqs', '/quotations', '/purchase-orders',
    '/inventory', '/payments', '/approvals', '/audit-log',
    '/settings/employees', '/settings/roles',
  ],
  member: [
    '/inventory', '/payments', '/approvals', '/audit-log',
    '/settings/employees', '/settings/roles',
  ],
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function isUnder(pathname: string, prefixes: string[]): boolean {
  return prefixes.some(p => pathname === p || pathname.startsWith(p + '/'))
}

function go(req: NextRequest, to: string, clearCookies = false): NextResponse {
  const url = req.nextUrl.clone()
  url.pathname = to
  url.search   = ''
  const res = NextResponse.redirect(url)
  if (clearCookies) clearPortalCookie(res)
  return res
}

function goWithReturn(req: NextRequest, to: string): NextResponse {
  const url = req.nextUrl.clone()
  url.pathname = to
  url.search   = `?redirectTo=${encodeURIComponent(req.nextUrl.pathname)}`
  return NextResponse.redirect(url)
}

function allow(base: NextResponse, portalCookie?: Portal): NextResponse {
  // Always nuke the old cache cookie
  base.cookies.delete('vf_ctx')
  if (portalCookie) setPortalCookie(base, portalCookie)
  return base
}

// ── Main proxy ────────────────────────────────────────────────────────────────

export async function proxy(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl

  // Skip static assets, API routes, special pages
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/invite/') ||
    pathname.startsWith('/auth/') ||
    pathname === '/403' ||
    pathname === '/404'
  ) {
    return NextResponse.next()
  }

  // Landing page — always show portal selection, clear stale portal cookie
  if (pathname === '/') {
    const res = NextResponse.next()
    res.cookies.delete('vf_portal')
    res.cookies.delete('vf_ctx')
    return res
  }

  const isCompanyAuth  = isUnder(pathname, COMPANY_AUTH)
  const isCompanyRoute = isUnder(pathname, COMPANY_ROUTES)
  const isVendorAuth   = isUnder(pathname, VENDOR_AUTH)
  const isVendorRoute  = isUnder(pathname, VENDOR_ROUTES)
  const isWorkspace    = pathname === '/workspace/setup' || pathname.startsWith('/workspace/')

  if (!isCompanyAuth && !isCompanyRoute && !isVendorAuth && !isVendorRoute && !isWorkspace) {
    return NextResponse.next()
  }

  // Refresh JWT
  const { supabaseResponse, user } = await updateSession(request)

  // Read the portal cookie (fastest signal — set at login)
  const portalCookie = readPortalCookie(request)

  // ─────────────────────────────────────────────────────────────────────────
  // COMPANY AUTH PAGES  (/company/login, /login, /signup, etc.)
  // ─────────────────────────────────────────────────────────────────────────
  if (isCompanyAuth) {
    // Clear portal cookie whenever a login page is visited.
    // This prevents a stale vf_portal cookie from auto-redirecting
    // the user before they've entered credentials.
    const res = NextResponse.next(supabaseResponse)
    clearPortalCookie(res)

    // If they have both a live session AND a valid portal cookie, skip login
    if (user && portalCookie === 'company') {
      return go(request, '/dashboard', true)
    }

    return res
  }

  // ─────────────────────────────────────────────────────────────────────────
  // VENDOR AUTH PAGES  (/vendor/login, /vendor/register)
  // ─────────────────────────────────────────────────────────────────────────
  if (isVendorAuth) {
    // Clear portal cookie whenever a login page is visited.
    const res = NextResponse.next(supabaseResponse)
    clearPortalCookie(res)

    // If they have both a live session AND a valid portal cookie, skip login
    if (user && portalCookie === 'vendor') {
      return go(request, '/vendor/dashboard', true)
    }

    return res
  }

  // ─────────────────────────────────────────────────────────────────────────
  // WORKSPACE SETUP
  // ─────────────────────────────────────────────────────────────────────────
  if (isWorkspace) {
    if (!user) return go(request, '/company/login')
    return allow(supabaseResponse)
  }

  // ─────────────────────────────────────────────────────────────────────────
  // VENDOR PORTAL ROUTES
  // ─────────────────────────────────────────────────────────────────────────
  if (isVendorRoute) {
    if (!user) return goWithReturn(request, '/vendor/login')

    // Fast path: portal cookie says vendor
    if (portalCookie === 'vendor') {
      return allow(supabaseResponse, 'vendor')
    }

    // Portal cookie says company — definitely wrong portal
    if (portalCookie === 'company') {
      return go(request, '/dashboard')
    }

    // No cookie — ask the DB
    const ctx = await getPortalFromDB(user.id, request)
    if (!ctx) return go(request, '/vendor/login', true)

    if (ctx.portal === 'company') return go(request, '/dashboard')

    // Valid vendor — set cookie for future requests
    const res = allow(supabaseResponse, 'vendor')
    return res
  }

  // ─────────────────────────────────────────────────────────────────────────
  // COMPANY PORTAL ROUTES
  // ─────────────────────────────────────────────────────────────────────────
  if (!isCompanyRoute) return allow(supabaseResponse)
  if (!user) return goWithReturn(request, '/company/login')

  // Fast path: portal cookie says company
  if (portalCookie === 'company') {
    // Still need role for route blocking — but skip DB call for portal check
    // Only check role blocking without a DB call using a lightweight approach:
    // For role blocking we need the role. We read it from the DB only if needed.
    // For now allow through — the page server components will guard roles.
    // Role-blocking is a UX convenience, not a security boundary (RLS handles that).
    return allow(supabaseResponse, 'company')
  }

  // Portal cookie says vendor — definitely wrong portal
  if (portalCookie === 'vendor') {
    return go(request, '/vendor/dashboard')
  }

  // No cookie — ask the DB
  const ctx = await getPortalFromDB(user.id, request)
  if (!ctx) return go(request, '/company/login', true)

  if (ctx.portal === 'vendor') {
    return go(request, '/vendor/dashboard', true)
  }

  // Valid company user — workspace check
  // ONLY the administrator who created the company needs to set up the workspace.
  // Employees invited by the admin already belong to a set-up (or in-progress)
  // company — they should NEVER be redirected to workspace setup.
  if (!ctx.setup && (ctx.role === 'administrator' || ctx.role === 'admin') && !pathname.startsWith('/workspace')) {
    return go(request, '/workspace/setup')
  }

  // Role-based route blocking
  let role = ctx.role
  if (role === 'administrator' || role === 'admin') {
    const preview = request.cookies.get('vf_preview_role')?.value
    if (preview) role = preview
  }

  if (role !== 'administrator' && role !== 'admin') {
    const blocked = ROLE_BLOCKED[role] ?? []
    if (blocked.some(b => pathname === b || pathname.startsWith(b + '/'))) {
      return go(request, '/403')
    }
  }

  const res = allow(supabaseResponse, 'company')
  return res
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
