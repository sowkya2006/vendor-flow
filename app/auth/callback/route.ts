import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      // Check if workspace is set up
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: userRow } = await (supabase as any)
          .from('users')
          .select('company_id')
          .eq('id', user.id)
          .single()
        const companyId = (userRow as { company_id: string } | null)?.company_id

        if (companyId) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { data: company } = await (supabase as any)
            .from('companies')
            .select('setup_complete')
            .eq('id', companyId)
            .single()
          const isSetup = (company as { setup_complete: boolean } | null)?.setup_complete
          if (!isSetup) {
            return NextResponse.redirect(`${origin}/workspace/setup`)
          }
        }
      }
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/company/login?error=auth_callback_failed`)
}
