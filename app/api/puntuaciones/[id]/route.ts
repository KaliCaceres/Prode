import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, calcularPuntos, GRUPOS } from '@/lib/supabase'

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    const db = supabaseAdmin()

    const { data: prode, error: e1 } = await db
      .from('prodes')
      .select('*')
      .eq('id', params.id)
      .single()

    if (e1 || !prode) {
      return NextResponse.json({ error: 'Prode no encontrado' }, { status: 404 })
    }

    const { data: partidos } = await db
      .from('partidos_oficiales')
      .select('*')
      .eq('finalizado', true)

    const detalle: Record<string, { puntos: number; tipo: string }> = {}
    let puntos = 0, exactos = 0, ganadores = 0

    for (const p of partidos || []) {
      const pron = prode.resultados[p.id]
      if (!pron || p.goles_local === null || p.goles_visita === null) continue
      const resultado = calcularPuntos(pron, { h: p.goles_local, a: p.goles_visita })
      detalle[p.id] = { puntos: resultado.puntos, tipo: resultado.tipo }
      puntos += resultado.puntos
      if (resultado.tipo === 'exacto') exactos++
      if (resultado.tipo === 'ganador') ganadores++
    }

    const { data: ranking } = await db
      .from('puntuaciones')
      .select('prode_id, puntos')
      .order('puntos', { ascending: false })

    const posicion = (ranking || []).findIndex(r => r.prode_id === params.id) + 1

    return NextResponse.json({
      prode,
      puntuacion: { puntos, exactos, ganadores, partidos_jugados: Object.keys(detalle).length },
      detalle,
      posicion,
      total_participantes: ranking?.length || 0
    })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
