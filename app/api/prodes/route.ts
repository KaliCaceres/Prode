import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { supabaseAdmin, generarId, GRUPOS } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
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

    const body = await req.json()
    const { nombre, apellido, resultados } = body

    if (!nombre?.trim() || !apellido?.trim()) {
      return NextResponse.json({ error: 'Nombre y apellido son obligatorios' }, { status: 400 })
    }

    const partidosEsperados = GRUPOS.flatMap(g => g.partidos.map(p => p.id))
    for (const pid of partidosEsperados) {
      const r = resultados[pid]
      if (!r || r.h === undefined || r.a === undefined) {
        return NextResponse.json({ error: `Falta el partido ${pid}` }, { status: 400 })
      }
    }

    const db = supabaseAdmin()

    const { data: existing } = await db.from('prodes').select('id').eq('user_id', user.id).single()
    if (existing) {
      return NextResponse.json({ error: 'Ya tenés un prode cargado', id: existing.id }, { status: 409 })
    }

    const id = generarId(nombre.trim(), apellido.trim())

    const { error } = await db.from('prodes').insert({
      id,
      user_id: user.id,
      email: user.email,
      nombre: nombre.trim(),
      apellido: apellido.trim(),
      resultados,
      bloqueado: false
    })
    if (error) throw error

    await db.from('puntuaciones').upsert({
      prode_id: id, puntos: 0, exactos: 0, ganadores: 0, partidos_jugados: 0
    })

    return NextResponse.json({ id })
  } catch (e: any) {
    console.error(e)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
