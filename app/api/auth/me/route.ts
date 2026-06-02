export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const db = supabaseAdmin()
  const { data: prode } = await db
    .from('prodes').select('id').eq('usuario_id', session.id).single()

  return NextResponse.json({
    id: session.id,
    usuario: session.usuario,
    nombre: session.nombre,
    apellido: session.apellido,
    prode_id: prode?.id || null,
  })
}

