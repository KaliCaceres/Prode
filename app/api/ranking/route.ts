import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET() {
  const db = supabaseAdmin()

  const { data: usuarios } = await db
    .from('usuarios')
    .select('id, usuario, nombre, apellido')
    .order('apellido')

  const { data: prodes } = await db
    .from('prodes')
    .select('id, usuario_id')

  const { data: puntuaciones } = await db
    .from('puntuaciones')
    .select('prode_id, puntos, exactos, ganadores, partidos_jugados')

  const ranking = (usuarios || []).map((u: any) => {
    const prode = (prodes || []).find((p: any) => p.usuario_id === u.id)
    const pts = prode ? (puntuaciones || []).find((p: any) => p.prode_id === prode.id) : null
    return {
      usuario_id: u.id,
      usuario: u.usuario,
      nombre: u.nombre,
      apellido: u.apellido,
      prode_id: prode?.id || null,
      tiene_prode: !!prode,
      puntos: pts?.puntos ?? 0,
      exactos: pts?.exactos ?? 0,
      ganadores: pts?.ganadores ?? 0,
      partidos_jugados: pts?.partidos_jugados ?? 0,
    }
  })

  ranking.sort((a: any, b: any) => {
    if (a.tiene_prode && !b.tiene_prode) return -1
    if (!a.tiene_prode && b.tiene_prode) return 1
    if (b.puntos !== a.puntos) return b.puntos - a.puntos
    return b.exactos - a.exactos
  })

  return NextResponse.json({ ranking }, {
    headers: { 'Cache-Control': 'no-store' }
  })
}
