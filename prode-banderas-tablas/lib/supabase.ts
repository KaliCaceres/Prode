import { createClient } from '@supabase/supabase-js'
import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export function createBrowserSupabase() {
  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}

export function supabaseAdmin() {
  const serviceKey = process.env.SUPABASE_SERVICE_KEY!
  return createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  })
}

export type Resultado = { h: number; a: number }
export type Resultados = Record<string, Resultado>

export interface Prode {
  id: string
  usuario_id: string
  nombre: string
  apellido: string
  resultados: Resultados
  creado_en: string
  editado_en: string
  bloqueado: boolean
}

export interface PartidoOficial {
  id: string
  grupo: string
  jornada: number
  local: string
  visitante: string
  fecha_utc: string
  goles_local: number | null
  goles_visita: number | null
  finalizado: boolean
}

export interface Puntuacion {
  prode_id: string
  puntos: number
  exactos: number
  ganadores: number
  partidos_jugados: number
}

export function calcularPuntos(
  pronostico: Resultado,
  oficial: Resultado
): { puntos: number; tipo: 'exacto' | 'ganador' | 'miss' } {
  if (pronostico.h === oficial.h && pronostico.a === oficial.a) {
    return { puntos: 2, tipo: 'exacto' }
  }
  const g = (r: Resultado) => r.h > r.a ? 'L' : r.h < r.a ? 'V' : 'E'
  if (g(pronostico) === g(oficial)) return { puntos: 1, tipo: 'ganador' }
  return { puntos: 0, tipo: 'miss' }
}

export function generarId(nombre: string, apellido: string): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let sufijo = ''
  for (let i = 0; i < 4; i++) sufijo += chars[Math.floor(Math.random() * chars.length)]
  const n = nombre.toUpperCase().replace(/[^A-Z]/g, '').substring(0, 8)
  const a = apellido.toUpperCase().replace(/[^A-Z]/g, '').substring(0, 10)
  return `${a}-${n}-${sufijo}`
}

export const GRUPOS = [
  {
    letra: 'A',
    equipos: ['México', 'Sudáfrica', 'Corea del Sur', 'Rep. Checa'],
    partidos: [
      { id: 'A1', local: 'México', visitante: 'Sudáfrica' },
      { id: 'A2', local: 'Corea del Sur', visitante: 'Rep. Checa' },
      { id: 'A3', local: 'Rep. Checa', visitante: 'Sudáfrica' },
      { id: 'A4', local: 'México', visitante: 'Corea del Sur' },
      { id: 'A5', local: 'Rep. Checa', visitante: 'México' },
      { id: 'A6', local: 'Sudáfrica', visitante: 'Corea del Sur' },
    ],
  },
  {
    letra: 'B',
    equipos: ['Canadá', 'Bosnia', 'Qatar', 'Suiza'],
    partidos: [
      { id: 'B1', local: 'Canadá', visitante: 'Bosnia' },
      { id: 'B2', local: 'Qatar', visitante: 'Suiza' },
      { id: 'B3', local: 'Suiza', visitante: 'Bosnia' },
      { id: 'B4', local: 'Canadá', visitante: 'Qatar' },
      { id: 'B5', local: 'Bosnia', visitante: 'Qatar' },
      { id: 'B6', local: 'Suiza', visitante: 'Canadá' },
    ],
  },
  {
    letra: 'C',
    equipos: ['Estados Unidos', 'Paraguay', 'Australia', 'Turquía'],
    partidos: [
      { id: 'C1', local: 'Estados Unidos', visitante: 'Paraguay' },
      { id: 'C2', local: 'Australia', visitante: 'Turquía' },
      { id: 'C3', local: 'Estados Unidos', visitante: 'Australia' },
      { id: 'C4', local: 'Turquía', visitante: 'Paraguay' },
      { id: 'C5', local: 'Paraguay', visitante: 'Australia' },
      { id: 'C6', local: 'Turquía', visitante: 'Estados Unidos' },
    ],
  },
  {
    letra: 'D',
    equipos: ['Brasil', 'Marruecos', 'Haití', 'Escocia'],
    partidos: [
      { id: 'D1', local: 'Brasil', visitante: 'Marruecos' },
      { id: 'D2', local: 'Haití', visitante: 'Escocia' },
      { id: 'D3', local: 'Escocia', visitante: 'Marruecos' },
      { id: 'D4', local: 'Brasil', visitante: 'Haití' },
      { id: 'D5', local: 'Marruecos', visitante: 'Haití' },
      { id: 'D6', local: 'Escocia', visitante: 'Brasil' },
    ],
  },
  {
    letra: 'E',
    equipos: ['Alemania', 'Ecuador', 'Costa de Marfil', 'Curazao'],
    partidos: [
      { id: 'E1', local: 'Alemania', visitante: 'Curazao' },
      { id: 'E2', local: 'Costa de Marfil', visitante: 'Ecuador' },
      { id: 'E3', local: 'Alemania', visitante: 'Costa de Marfil' },
      { id: 'E4', local: 'Ecuador', visitante: 'Curazao' },
      { id: 'E5', local: 'Curazao', visitante: 'Costa de Marfil' },
      { id: 'E6', local: 'Ecuador', visitante: 'Alemania' },
    ],
  },
  {
    letra: 'F',
    equipos: ['Países Bajos', 'Japón', 'Suecia', 'Túnez'],
    partidos: [
      { id: 'F1', local: 'Países Bajos', visitante: 'Japón' },
      { id: 'F2', local: 'Suecia', visitante: 'Túnez' },
      { id: 'F3', local: 'Países Bajos', visitante: 'Suecia' },
      { id: 'F4', local: 'Túnez', visitante: 'Japón' },
      { id: 'F5', local: 'Japón', visitante: 'Suecia' },
      { id: 'F6', local: 'Túnez', visitante: 'Países Bajos' },
    ],
  },
  {
    letra: 'G',
    equipos: ['España', 'Uruguay', 'Arabia Saudita', 'Cabo Verde'],
    partidos: [
      { id: 'G1', local: 'España', visitante: 'Cabo Verde' },
      { id: 'G2', local: 'Arabia Saudita', visitante: 'Uruguay' },
      { id: 'G3', local: 'España', visitante: 'Arabia Saudita' },
      { id: 'G4', local: 'Uruguay', visitante: 'Cabo Verde' },
      { id: 'G5', local: 'Cabo Verde', visitante: 'Arabia Saudita' },
      { id: 'G6', local: 'Uruguay', visitante: 'España' },
    ],
  },
  {
    letra: 'H',
    equipos: ['Bélgica', 'Egipto', 'Irán', 'Nueva Zelanda'],
    partidos: [
      { id: 'H1', local: 'Bélgica', visitante: 'Egipto' },
      { id: 'H2', local: 'Irán', visitante: 'Nueva Zelanda' },
      { id: 'H3', local: 'Bélgica', visitante: 'Irán' },
      { id: 'H4', local: 'Nueva Zelanda', visitante: 'Egipto' },
      { id: 'H5', local: 'Egipto', visitante: 'Irán' },
      { id: 'H6', local: 'Nueva Zelanda', visitante: 'Bélgica' },
    ],
  },
  {
    letra: 'I',
    equipos: ['Francia', 'Senegal', 'Noruega', 'Irak'],
    partidos: [
      { id: 'I1', local: 'Francia', visitante: 'Senegal' },
      { id: 'I2', local: 'Irak', visitante: 'Noruega' },
      { id: 'I3', local: 'Francia', visitante: 'Irak' },
      { id: 'I4', local: 'Noruega', visitante: 'Senegal' },
      { id: 'I5', local: 'Noruega', visitante: 'Francia' },
      { id: 'I6', local: 'Senegal', visitante: 'Irak' },
    ],
  },
  {
    letra: 'J',
    equipos: ['Argentina', 'Argelia', 'Austria', 'Jordania'],
    partidos: [
      { id: 'J1', local: 'Argentina', visitante: 'Argelia' },
      { id: 'J2', local: 'Austria', visitante: 'Jordania' },
      { id: 'J3', local: 'Argentina', visitante: 'Austria' },
      { id: 'J4', local: 'Jordania', visitante: 'Argelia' },
      { id: 'J5', local: 'Argelia', visitante: 'Austria' },
      { id: 'J6', local: 'Jordania', visitante: 'Argentina' },
    ],
  },
  {
    letra: 'K',
    equipos: ['Portugal', 'Colombia', 'Uzbekistán', 'Rep. D. Congo'],
    partidos: [
      { id: 'K1', local: 'Portugal', visitante: 'Rep. D. Congo' },
      { id: 'K2', local: 'Uzbekistán', visitante: 'Colombia' },
      { id: 'K3', local: 'Portugal', visitante: 'Uzbekistán' },
      { id: 'K4', local: 'Colombia', visitante: 'Rep. D. Congo' },
      { id: 'K5', local: 'Colombia', visitante: 'Portugal' },
      { id: 'K6', local: 'Rep. D. Congo', visitante: 'Uzbekistán' },
    ],
  },
  {
    letra: 'L',
    equipos: ['Inglaterra', 'Croacia', 'Ghana', 'Panamá'],
    partidos: [
      { id: 'L1', local: 'Inglaterra', visitante: 'Croacia' },
      { id: 'L2', local: 'Ghana', visitante: 'Panamá' },
      { id: 'L3', local: 'Inglaterra', visitante: 'Ghana' },
      { id: 'L4', local: 'Panamá', visitante: 'Croacia' },
      { id: 'L5', local: 'Croacia', visitante: 'Ghana' },
      { id: 'L6', local: 'Panamá', visitante: 'Inglaterra' },
    ],
  },
]

// Cambiado a 10 de junio
export const MUNDIAL_START = new Date('2026-06-10T23:59:00Z')

export function mundialEmpezado(): boolean {
  return new Date() >= MUNDIAL_START
}

// ============================================================
// LÓGICA DE TABLA DE POSICIONES DE GRUPO
// ============================================================
export interface PosicionEquipo {
  equipo: string
  pts: number
  pj: number
  pg: number
  pe: number
  pp: number
  gf: number
  gc: number
  dif: number
}

export function calcularPosicionesGrupo(
  equipos: string[],
  partidos: { id: string; local: string; visitante: string }[],
  resultados: Resultados
): PosicionEquipo[] {
  const tabla: Record<string, PosicionEquipo> = {}

  equipos.forEach(e => {
    tabla[e] = { equipo: e, pts: 0, pj: 0, pg: 0, pe: 0, pp: 0, gf: 0, gc: 0, dif: 0 }
  })

  partidos.forEach(p => {
    const r = resultados[p.id]
    if (!r || (r.h === 0 && r.a === 0)) return
    // Solo contar si al menos uno metió gol o es un empate explícito
    const loc = tabla[p.local]
    const vis = tabla[p.visitante]
    if (!loc || !vis) return

    loc.pj++; vis.pj++
    loc.gf += r.h; loc.gc += r.a
    vis.gf += r.a; vis.gc += r.h
    loc.dif = loc.gf - loc.gc
    vis.dif = vis.gf - vis.gc

    if (r.h > r.a) {
      loc.pg++; loc.pts += 3
      vis.pp++
    } else if (r.h < r.a) {
      vis.pg++; vis.pts += 3
      loc.pp++
    } else {
      loc.pe++; loc.pts++
      vis.pe++; vis.pts++
    }
  })

  return Object.values(tabla).sort((a, b) => {
    if (b.pts !== a.pts) return b.pts - a.pts
    if (b.dif !== a.dif) return b.dif - a.dif
    return b.gf - a.gf
  })
}
