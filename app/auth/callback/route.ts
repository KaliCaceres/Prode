import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          },
        },
      }
    )

    const { data: { user }, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && user) {
      // Verificar si ya tiene un prode
      const { data: prode } = await supabase
        .from('prodes')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (prode) {
        // Ya tiene prode → ir directo
        return NextResponse.redirect(`${origin}/prode/${prode.id}`)
      } else {
        // No tiene prode → cargar uno
        return NextResponse.redirect(`${origin}/`)
      }
    }
  }

  return NextResponse.redirect(`${origin}/auth/login?error=auth`)
}
