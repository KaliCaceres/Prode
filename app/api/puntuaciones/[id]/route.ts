import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, calcularPuntos } from '@/lib/supabase'
import { getSession } from '@/lib/auth'

const PUBLICOS = ['dmartini', 'ccaceres']

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    const db = supabaseAdmin()

    const { data: prode, error: e1 } = await db
      .from('prodes').select('*').eq('id', params.id).single()

    if (e1 || !prode) return NextResponse.json({ error: 'Prode no encontrado' }, { status: 404 })

    // Buscar el usuario dueño del prode
    const { data: dueno } = await db
      .from('usuarios').select('usuario').eq('id', prode.usuario_id).single()

    const esDueno = prode.usuario_id === session.id
    const esPublico = PUBLICOS.includes(dueno?.usuario || '')

    if (!esDueno && !esPublico) {
      return NextResponse.json({ error: 'No tenés permiso para ver este prode' }, { status: 403 })
    }

    const { data: partidos } = await db
      .from('partidos_oficiales').select('*').eq('finalizado', true)

    const detalle: Record<string, { puntos: number; tipo: string }> = {}
    let puntos = 0, exactos = 0, ganadores = 0

    for (const p of partidos || []) {
      const pron = prode.resultados[p.id]
      if (!pron || p.goles_local === null || p.goles_visita === null) continue
      const r = calcularPuntos(pron, { h: p.goles_local, a: p.goles_visita })
      detalle[p.id] = { puntos: r.puntos, tipo: r.tipo }
      puntos += r.puntos
      if (r.tipo === 'exacto') exactos++
      if (r.tipo === 'ganador') ganadores++
    }

    const { data: ranking } = await db
      .from('puntuaciones').select('prode_id, puntos').order('puntos', { ascending: false })

    const posicion = (ranking || []).findIndex(r => r.prode_id === params.id) + 1

    return NextResponse.json({
      prode,
      puntuacion: { puntos, exactos, ganadores, partidos_jugados: Object.keys(detalle).length },
      detalle,
      posicion,
      total_participantes: ranking?.length || 0,
    })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
