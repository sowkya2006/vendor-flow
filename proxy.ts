import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'
import { createServerClient } from '@supabase/ssr'
import type { Database } from '@/lib/supabase/types'

// ── Company dashboard protected routes ───────────────────────
const PROTECTED_PREFIXES = [
  '/dashboard',
  '/vendors',
  '/rfqs',
  '/purchase-orders',
  '/procurement',
  '/inventory',
  '/products',
  '/payments',
  '/analytics',
  '/settings',
  '/onboarding',
  '/approvals',
  '/approval-workflows',
  '/quotations',
  '/audit-log',
]

// Routes that need authentication but NOT workspace setup
const PUBLIC_AUTH_NEEDED = ['/workspace/setup']

// Routes only accessible when NOT authenticated (company side)
const AUTH_ONLY_PREFIXES = ['/login', '/signup', '/forgot-password', '/company/login']

// ── Vendor portal protected routes ───────────────────────────
const VENDOR_PROTECTED_PREFIXES = [
  '/vendor/dashboard',
  '/vendor/profile',
  '/vendor/rfqs',
  '/vendor/quotations',
  '/vendor/purchase-orders',
  '/vendor/invoices',
  '/vendor/payments',
  '/vendor/notifications',
]

// ── Role → allowed route prefixes ────────────────────────────
// Only used to block access to modules; not every nested route.
const ROLE_BLOCKED_PREFIXES: Record<string, string[]> = {
  warehouse_manager: ['/payments', '/vendors', '/rfqs', '/quotations', '/audit-log'],
  finance_manager:   ['/inventory', '/vendors', '/rfqs', '/quotations', '/approval-workflows'],
  procurement_officer: ['/payments', '/inventory'],
  viewer:            ['/payments', '/settings', '/vendors', '/inventory'],
}

// Build supabase client without cookie writes (read-only in middleware)
function makeClient(request: NextRequest) {
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setAll: (_c: any) => {},
      },
    },
  )
}

async function isVendorUser(request: NextRequest, userId: string): Promise<boolean> {
  const supabase = makeClient(request)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase as any)
    .from('vendor_users')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle()
  return !!data
}

async function getUserRole(request: NextRequest, userId: string): Promise<string | null> {
  const supabase = makeClient(request)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase as any)
    .from('users')
    .select('role, company_id')
    .eq('id', userId)
    .single()
  if (!data) return null
  return (data as { role: string }).role ?? null
}

async function isWorkspaceSetup(request: NextRequest, userId: string): Promise<boolean> {
  const supabase = makeClient(request)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: userRow } = await (supabase as any)
    .from('users').select('company_id').eq('id', userId).single()
  const companyId = (userRow as { company_id: string } | null)?.company_id
  if (!companyId) return false
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: co } = await (supabase as any)
    .from('companies').select('setup_complete').eq('id', companyId).single()
  return !!(co as { setup_complete: boolean } | null)?.setup_complete
}

export async function proxy(request: NextRequest) {
  const { supabaseResponse, user } = await updateSession(request)
  const { pathname } = request.nextUrl

  // ── Vendor portal ───────────────────────────────────────────
  const isVendorProtected = VENDOR_PROTECTED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(p + '/'),
  )
  const isVendorLogin = pathname === '/vendor/login'

  if (isVendorLogin && user) {
    const isVU = await isVendorUser(request, user.id)
    if (isVU) {
      const url = request.nextUrl.clone()
      url.pathname = '/vendor/dashboard'
      return NextResponse.redirect(url)
    }
    return supabaseResponse
  }

  if (isVendorProtected) {
    if (!user) {
      const url = request.nextUrl.clone()
      url.pathname = '/vendor/login'
      url.searchParams.set('redirectTo', pathname)
      return NextResponse.redirect(url)
    }
    const isVU = await isVendorUser(request, user.id)
    if (!isVU) {
      const url = request.nextUrl.clone()
      url.pathname = '/vendor/login'
      return NextResponse.redirect(url)
    }
    return supabaseResponse
  }

  // ── Workspace setup route — must be logged in ───────────────
  if (pathname === '/workspace/setup') {
    if (!user) {
      const url = request.nextUrl.clone()
      url.pathname = '/company/login'
      return NextResponse.redirect(url)
    }
    return supabaseResponse
  }

  // ── Company dashboard routes ────────────────────────────────
  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p))
  const isAuthOnly = AUTH_ONLY_PREFIXES.some((p) => pathname.startsWith(p))

  if (!user && isProtected) {
    const url = request.nextUrl.clone()
    url.pathname = '/company/login'
    url.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(url)
  }

  // Redirect authenticated company users away from login pages
  if (user && isAuthOnly && !pathname.startsWith('/vendor/')) {
    // Don't redirect if also a vendor user
    const isVU = await isVendorUser(request, user.id)
    if (!isVU) {
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard'
      return NextResponse.redirect(url)
    }
  }

  // ── Workspace setup check for company dashboard routes ──────
  if (user && isProtected) {
    const hasWorkspace = await isWorkspaceSetup(request, user.id)
    if (!hasWorkspace && !pathname.startsWith('/workspace')) {
      const url = request.nextUrl.clone()
      url.pathname = '/workspace/setup'
      return NextResponse.redirect(url)
    }

    // ── Role-based route blocking ───────────────────────────
    const role = await getUserRole(request, user.id)
    if (role && role !== 'administrator' && role !== 'admin') {
      const blocked = ROLE_BLOCKED_PREFIXES[role] ?? []
      const isBlocked = blocked.some((b) => pathname.startsWith(b))
      if (isBlocked) {
        const url = request.nextUrl.clone()
        url.pathname = '/403'
        return NextResponse.redirect(url)
      }
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
