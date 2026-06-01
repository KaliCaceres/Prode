import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, mundialEmpezado, GRUPOS } from '@/lib/supabase'

// PUT /api/prodes/[id] — editar prode (solo antes del Mundial)
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    if (mundialEmpezado()) {
      return NextResponse.json({ error: 'El Mundial ya empezó, no se puede editar el prode' }, { status: 403 })
    }

    const body = await req.json()
    const { resultados } = body

    const partidosEsperados = GRUPOS.flatMap(g => g.partidos.map(p => p.id))
    for (const pid of partidosEsperados) {
      const r = resultados[pid]
      if (r === undefined || r.h === undefined || r.a === undefined) {
        return NextResponse.json({ error: `Falta el resultado del partido ${pid}` }, { status: 400 })
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
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
