import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, generarId, Resultados, GRUPOS } from '@/lib/supabase'

// POST /api/prodes — crear un nuevo prode
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { nombre, apellido, resultados } = body

    if (!nombre?.trim() || !apellido?.trim()) {
      return NextResponse.json({ error: 'Nombre y apellido son obligatorios' }, { status: 400 })
    }

    // Validar que vengan todos los 72 partidos
    const partidosEsperados = GRUPOS.flatMap(g => g.partidos.map(p => p.id))
    for (const pid of partidosEsperados) {
      const r = resultados[pid]
      if (r === undefined || r.h === undefined || r.a === undefined) {
        return NextResponse.json({ error: `Falta el resultado del partido ${pid}` }, { status: 400 })
      }
    }

    const db = supabaseAdmin()
    const id = generarId(nombre.trim(), apellido.trim())

    // Verificar colisión de ID (muy improbable pero por las dudas)
    const { data: existing } = await db.from('prodes').select('id').eq('id', id).single()
    if (existing) {
      // Reintentar con otro sufijo
      const id2 = generarId(nombre.trim(), apellido.trim())
      const { error } = await db.from('prodes').insert({
        id: id2, nombre: nombre.trim(), apellido: apellido.trim(),
        resultados, bloqueado: false
      })
      if (error) throw error
      return NextResponse.json({ id: id2 })
    }

    const { error } = await db.from('prodes').insert({
      id, nombre: nombre.trim(), apellido: apellido.trim(),
      resultados, bloqueado: false
    })
    if (error) throw error

    // Inicializar puntuación en 0
    await db.from('puntuaciones').upsert({ prode_id: id, puntos: 0, exactos: 0, ganadores: 0, partidos_jugados: 0 })

    return NextResponse.json({ id })
  } catch (e: any) {
    console.error(e)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
