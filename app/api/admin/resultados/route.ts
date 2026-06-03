import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, calcularPuntos } from '@/lib/supabase'
import { getSession } from '@/lib/auth'

const ADMINS = ['dmartini', 'ccaceres']

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getSession()
  if (!session || !ADMINS.includes(session.usuario)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }
  const db = supabaseAdmin()
  const { data: partidos } = await db
    .from('partidos_oficiales')
    .select('*')
    .order('fecha_utc')
  return NextResponse.json({ partidos: partidos || [] })
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session || !ADMINS.includes(session.usuario)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const { partido_id, goles_local, goles_visita, finalizado } = await req.json()
  if (!partido_id || goles_local === undefined || goles_visita === undefined) {
    return NextResponse.json({ error: 'Faltan datos' }, { status: 400 })
  }

  const db = supabaseAdmin()

  const { error } = await db
    .from('partidos_oficiales')
    .update({
      goles_local: parseInt(goles_local),
      goles_visita: parseInt(goles_visita),
      finalizado: finalizado ?? true,
      actualizado_en: new Date().toISOString()
    })
    .eq('id', partido_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Recalcular puntuaciones
  const { data: prodes } = await db.from('prodes').select('id, resultados')
  const { data: partidos } = await db.from('partidos_oficiales').select('*').eq('finalizado', true)

  if (prodes && partidos) {
    const upserts = prodes.map(prode => {
      let puntos = 0, exactos = 0, ganadores = 0
      for (const p of partidos) {
        const pron = prode.resultados[p.id]
        if (!pron || p.goles_local === null || p.goles_visita === null) continue
        const r = calcularPuntos(pron, { h: p.goles_local, a: p.goles_visita })
        puntos += r.puntos
        if (r.tipo === 'exacto') exactos++
        if (r.tipo === 'ganador') ganadores++
      }
      return { prode_id: prode.id, puntos, exactos, ganadores, partidos_jugados: partidos.length, actualizado_en: new Date().toISOString() }
    })
    await db.from('puntuaciones').upsert(upserts)
  }

  return NextResponse.json({ ok: true })
}
