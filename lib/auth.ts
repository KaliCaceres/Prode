import { jwtVerify } from 'jose'
import { cookies } from 'next/headers'

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'prode2026secret')

export interface UserSession {
  id: string
  usuario: string
  nombre: string
  apellido: string
}

export async function getSession(): Promise<UserSession | null> {
  try {
    const cookieStore = cookies()
    const token = cookieStore.get('prode_token')?.value
    if (!token) return null
    const { payload } = await jwtVerify(token, SECRET)
    return payload as unknown as UserSession
  } catch {
    return null
  }
}
