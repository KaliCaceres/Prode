export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, generarId, GRUPOS } from '@/lib/supabase'
import { getSession } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    const body = await req.json()
    const { nombre, apellido, resultados } = body

    if (!nombre?.trim() || !apellido?.trim())
      return NextResponse.json({ error: 'Nombre y apellido son obligatorios' }, { status: 400 })

    const partidosEsperados = GRUPOS.flatMap(g => g.partidos.map(p => p.id))
    for (const pid of partidosEsperados) {
      const r = resultados[pid]
      if (!r || r.h === undefined || r.a === undefined)
        return NextResponse.json({ error: `Falta el partido ${pid}` }, { status: 400 })
    }

    const db = supabaseAdmin()
    const { data: existing } = await db.from('prodes').select('id').eq('usuario_id', session.id).single()
    if (existing) return NextResponse.json({ error: 'Ya tenés un prode', id: existing.id }, { status: 409 })

    const id = generarId(nombre.trim(), apellido.trim())
    const { error } = await db.from('prodes').insert({
      id, usuario_id: session.id,
      nombre: nombre.trim(), apellido: apellido.trim(),
      resultados, bloqueado: false
    })
    if (error) throw error

    await db.from('puntuaciones').upsert({ prode_id: id, puntos: 0, exactos: 0, ganadores: 0, partidos_jugados: 0 })
    return NextResponse.json({ id })
  } catch (e: any) {
    console.error(e)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

