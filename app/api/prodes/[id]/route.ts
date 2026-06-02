import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { supabaseAdmin, mundialEmpezado, GRUPOS } from '@/lib/supabase'

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    if (mundialEmpezado()) {
      return NextResponse.json({ error: 'El Mundial ya empezó, no se puede editar' }, { status: 403 })
    }

    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
          },
        },
      }
    )

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    const { data: prode } = await supabase.from('prodes').select('user_id').eq('id', params.id).single()
    if (!prode || prode.user_id !== user.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const body = await req.json()
    const { resultados } = body

    const partidosEsperados = GRUPOS.flatMap(g => g.partidos.map(p => p.id))
    for (const pid of partidosEsperados) {
      const r = resultados[pid]
      if (!r || r.h === undefined || r.a === undefined) {
        return NextResponse.json({ error: `Falta el partido ${pid}` }, { status: 400 })
      }
    }

    const db = supabaseAdmin()
    const { error } = await db
      .from('prodes')
      .update({ resultados, editado_en: new Date().toISOString() })
      .eq('id', params.id)

    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    console.error(e)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
