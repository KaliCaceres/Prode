import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, mundialEmpezado, GRUPOS } from '@/lib/supabase'
import { getSession } from '@/lib/auth'

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    if (mundialEmpezado())
      return NextResponse.json({ error: 'El Mundial ya empezó' }, { status: 403 })

    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    const db = supabaseAdmin()
    const { data: prode } = await db.from('prodes').select('usuario_id').eq('id', params.id).single()
    if (!prode || prode.usuario_id !== session.id)
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

    const { resultados } = await req.json()
    const partidosEsperados = GRUPOS.flatMap(g => g.partidos.map(p => p.id))
    for (const pid of partidosEsperados) {
      const r = resultados[pid]
      if (!r || r.h === undefined || r.a === undefined)
        return NextResponse.json({ error: `Falta el partido ${pid}` }, { status: 400 })
    }

    const { error } = await db.from('prodes')
      .update({ resultados, editado_en: new Date().toISOString() }).eq('id', params.id)
    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
