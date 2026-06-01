import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, calcularPuntos } from '@/lib/supabase'

// Este endpoint lo llama Vercel Cron cada hora
// También se puede llamar manualmente con ?secret=CRON_SECRET
export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get('secret')
  const cronHeader = req.headers.get('authorization')

  const isVercelCron = cronHeader === `Bearer ${process.env.CRON_SECRET}`
  const isManual = secret === process.env.CRON_SECRET

  if (!isVercelCron && !isManual) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const db = supabaseAdmin()

    // Traer resultados de ESPN
    const espnRes = await fetch(
      'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard?limit=100',
      { next: { revalidate: 0 } }
    )
    if (!espnRes.ok) throw new Error('ESPN API error')
    const espnData = await espnRes.json()

    const events = espnData.events || []
    let actualizados = 0

    for (const event of events) {
      const season = event?.season?.slug
      if (season !== 'group-stage') continue

      const comp = event.competitions?.[0]
      if (!comp) continue

      const status = comp.status?.type
      const finalizado = status?.completed === true

      if (!finalizado) continue

      const home = comp.competitors?.find((c: any) => c.homeAway === 'home')
      const away = comp.competitors?.find((c: any) => c.homeAway === 'away')

      if (!home || !away) continue

      const goles_local = parseInt(home.score)
      const goles_visita = parseInt(away.score)

      if (isNaN(goles_local) || isNaN(goles_visita)) continue

      const homeTeam = home.team?.displayName
      const awayTeam = away.team?.displayName

      // Buscar el partido en nuestra DB por equipos
      const { data: partido } = await db
        .from('partidos_oficiales')
        .select('id, finalizado')
        .eq('local', homeTeam)
        .eq('visitante', awayTeam)
        .single()

      // Intentar con nombres en español si no matchea
      if (!partido) continue
      if (partido.finalizado) continue // ya estaba actualizado

      await db
        .from('partidos_oficiales')
        .update({ goles_local, goles_visita, finalizado: true, actualizado_en: new Date().toISOString() })
        .eq('id', partido.id)

      actualizados++
    }

    if (actualizados > 0) {
      // Recalcular puntuaciones de todos los prodes
      await recalcularTodos(db)
    }

    return NextResponse.json({ ok: true, partidos_actualizados: actualizados })
  } catch (e: any) {
    console.error(e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

async function recalcularTodos(db: ReturnType<typeof supabaseAdmin>) {
  const { data: prodes } = await db.from('prodes').select('id, resultados')
  const { data: partidos } = await db.from('partidos_oficiales').select('*').eq('finalizado', true)

  if (!prodes || !partidos) return

  const upserts = prodes.map(prode => {
    let puntos = 0, exactos = 0, ganadores = 0

    for (const p of partidos) {
      const pron = prode.resultados[p.id]
      if (!pron || p.goles_local === null || p.goles_visita === null) continue
      const r = calcularPuntos(pron, { h: p.goles_local, a: p.goles_visita })
      puntos += r.puntos
      if (r.tipo === 'exacto') exactos++
      if (r.tipo === 'ganador') ganadores++
    }

    return {
      prode_id: prode.id,
      puntos,
      exactos,
      ganadores,
      partidos_jugados: partidos.length,
      actualizado_en: new Date().toISOString()
    }
  })

  await db.from('puntuaciones').upsert(upserts)
}
