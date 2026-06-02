import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { SignJWT } from 'jose'

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'prode2026secret')

export async function POST(req: NextRequest) {
  try {
    const { usuario, pin } = await req.json()

    if (!usuario?.trim() || !pin?.trim()) {
      return NextResponse.json({ error: 'Ingresá usuario y PIN' }, { status: 400 })
    }

    const db = supabaseAdmin()
    const { data: user, error } = await db
      .from('usuarios')
      .select('*')
      .eq('usuario', usuario.trim().toLowerCase())
      .eq('pin', pin.trim())
      .single()

    if (error || !user) {
      return NextResponse.json({ error: 'Usuario o PIN incorrecto' }, { status: 401 })
    }

    const token = await new SignJWT({
      id: user.id,
      usuario: user.usuario,
      nombre: user.nombre,
      apellido: user.apellido,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('30d')
      .sign(SECRET)

    const { data: prode } = await db
      .from('prodes')
      .select('id')
      .eq('usuario_id', user.id)
      .single()

    const response = NextResponse.json({
      ok: true,
      prode_id: prode?.id || null,
      nombre: user.nombre,
    })

    response.cookies.set('prode_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30,
      path: '/',
    })

    return response
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
