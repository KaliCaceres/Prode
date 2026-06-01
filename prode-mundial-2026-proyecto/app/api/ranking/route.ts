import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  const { data, error } = await supabase
    .from('puntuaciones')
    .select('prode_id, puntos, exactos, ganadores, partidos_jugados, prodes(nombre, apellido)')
    .order('puntos', { ascending: false })
    .order('exactos', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ranking: data || [] })
}
