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

    // First try the RPC (works for company users)
    const { data, error } = await db.rpc('get_user_portal', { p_user_id: userId })

    if (!error && data) {
      const result = typeof data === 'string' ? JSON.parse(data) : data
      if (result?.portal) {
        return {
          portal: result.portal as Portal,
          role:   result.role  ?? 'viewer',
          setup:  result.setup ?? false,
        }
      }
    }

    // RPC returned nothing — check vendor tables directly.
    // This handles self-registered vendors who are NOT in public.users.
    const [vcRes, vuRes] = await Promise.all([
      db.from('vendor_companies').select('id').eq('user_id', userId).maybeSingle(),
      db.from('vendor_users').select('id').eq('user_id', userId).maybeSingle(),
    ])

    if (vcRes.data || vuRes.data) {
      return { portal: 'vendor', role: 'vendor', setup: true }
    }

    if (error) {
      console.error('[proxy] RPC error:', error.message)
    } else {
      console.warn('[proxy] no portal for userId:', userId)
    }
    return null
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

// Vendor onboarding routes — require auth but profile not yet complete
const VENDOR_ONBOARDING = [
  '/vendor/complete-profile',
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

function allow(base: NextResponse, portalCookie?: Portal, currentCookie?: Portal | null): NextResponse {
  // Always nuke the old cache cookie
  base.cookies.delete('vf_ctx')
  // Only set the portal cookie if it's different from what's already there.
  // This prevents the cookie from being overwritten on every request,
  // which would cause cross-tab interference when both portals are open.
  if (portalCookie && portalCookie !== currentCookie) {
    setPortalCookie(base, portalCookie)
  }
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
  const isVendorOnboarding = isUnder(pathname, VENDOR_ONBOARDING)
  const isWorkspace    = pathname === '/workspace/setup' || pathname.startsWith('/workspace/')

  if (!isCompanyAuth && !isCompanyRoute && !isVendorAuth && !isVendorRoute && !isVendorOnboarding && !isWorkspace) {
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
    const res = NextResponse.next(supabaseResponse)
    clearPortalCookie(res)
    if (user && portalCookie === 'company') {
      return go(request, '/dashboard', true)
    }
    return res
  }

  // ─────────────────────────────────────────────────────────────────────────
  // VENDOR AUTH PAGES  (/vendor/login, /vendor/register)
  // ─────────────────────────────────────────────────────────────────────────
  if (isVendorAuth) {
    const res = NextResponse.next(supabaseResponse)
    clearPortalCookie(res)
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
    return allow(supabaseResponse, 'company', portalCookie)
  }

  // ─────────────────────────────────────────────────────────────────────────
  // VENDOR ONBOARDING (/vendor/complete-profile)
  // Requires auth + is_vendor. Does not require vendor_companies to exist yet.
  // ─────────────────────────────────────────────────────────────────────────
  if (isVendorOnboarding) {
    if (!user) return go(request, '/vendor/login')
    // Must be a vendor user
    if (!user.user_metadata?.is_vendor) return go(request, '/company/login')
    return allow(supabaseResponse, 'vendor', portalCookie)
  }

  // ─────────────────────────────────────────────────────────────────────────
  // VENDOR PORTAL ROUTES — Always verify from DB, never trust cookie alone
  // ─────────────────────────────────────────────────────────────────────────
  if (isVendorRoute) {
    if (!user) return goWithReturn(request, '/vendor/login')

    // ALWAYS check the DB — do not fast-path on cookie alone.
    const ctx = await getPortalFromDB(user.id, request)

    if (!ctx) {
      // No vendor record and not a company user — send to complete profile
      // if user has is_vendor metadata, they just need to fill profile
      if (user.user_metadata?.is_vendor === true) {
        if (pathname !== '/vendor/complete-profile') {
          return go(request, '/vendor/complete-profile')
        }
        return allow(supabaseResponse, 'vendor', portalCookie)
      }
      return go(request, '/vendor/login', true)
    }

    if (ctx.portal === 'vendor') {
      return allow(supabaseResponse, 'vendor', portalCookie)
    }

    // Company user on vendor route
    const url = request.nextUrl.clone()
    url.pathname = '/vendor/login'
    url.search = '?error=wrong_account&hint=Please+sign+in+to+your+vendor+account'
    const res = NextResponse.redirect(url)
    clearPortalCookie(res)
    return res
  }

  // ─────────────────────────────────────────────────────────────────────────
  // COMPANY PORTAL ROUTES
  // ─────────────────────────────────────────────────────────────────────────
  if (!isCompanyRoute) return allow(supabaseResponse, undefined, portalCookie)
  if (!user) return goWithReturn(request, '/company/login')

  // If user has is_vendor metadata, they shouldn't be on company routes
  if (user.user_metadata?.is_vendor === true) {
    return go(request, '/vendor/dashboard', true)
  }

  // Trust vf_portal=company cookie — it's set by our server-side API (httpOnly)
  // only after verifying the user exists in public.users with a company_id.
  if (portalCookie === 'company') {
    const previewRole = request.cookies.get('vf_preview_role')?.value
    if (previewRole && previewRole !== 'administrator' && previewRole !== 'admin') {
      const blocked = ROLE_BLOCKED[previewRole] ?? []
      if (blocked.some(b => pathname === b || pathname.startsWith(b + '/'))) {
        return go(request, '/403')
      }
    }
    return allow(supabaseResponse, 'company', portalCookie)
  }

  // No portal cookie — must check DB to determine portal
  const ctx = await getPortalFromDB(user.id, request)
  if (!ctx) return goWithReturn(request, '/company/login')

  if (ctx.portal === 'vendor') return go(request, '/vendor/dashboard', true)

  // Valid company user — workspace setup check
  if (!ctx.setup && (ctx.role === 'administrator' || ctx.role === 'admin') && !pathname.startsWith('/workspace')) {
    return go(request, '/workspace/setup')
  }

  // Role blocking
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

  return allow(supabaseResponse, 'company', portalCookie)
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
