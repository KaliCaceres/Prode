import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type')
  const error = searchParams.get('error')

  // Si hay error en la URL, volver al login con el mensaje
  if (error) {
    return NextResponse.redirect(`${origin}/auth/login?error=${error}`)
  }

  const cookieStore = cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )

  let user = null

  // Magic link manda token_hash + type=magiclink
  if (token_hash && type) {
    const { data, error: verifyError } = await supabase.auth.verifyOtp({
      token_hash,
      type: type as any,
    })
    if (!verifyError) user = data.user
  }

  // OAuth (Google etc) manda code
  if (code && !user) {
    const { data, error: sessionError } = await supabase.auth.exchangeCodeForSession(code)
    if (!sessionError) user = data.user
  }

  if (user) {
    const { data: prode } = await supabase
      .from('prodes').select('id').eq('user_id', user.id).single()
    if (prode) return NextResponse.redirect(`${origin}/prode/${prode.id}`)
    return NextResponse.redirect(`${origin}/`)
  }

  return NextResponse.redirect(`${origin}/auth/login?error=auth`)
}
