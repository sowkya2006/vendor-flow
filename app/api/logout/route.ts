import { NextResponse } from 'next/server'

// Redirect to the canonical logout endpoint at /api/auth/logout
// This keeps any old /api/logout links working
export async function GET(request: Request) {
  const { origin } = new URL(request.url)
  return NextResponse.redirect(`${origin}/api/auth/logout`)
}
