'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface Entry {
  usuario_id: string
  usuario: string
  nombre: string
  apellido: string
  prode_id: string | null
  tiene_prode: boolean
  puntos: number
  exactos: number
  ganadores: number
  partidos_jugados: number
}

export default function RankingPage() {
  const [ranking, setRanking] = useState<Entry[]>([])
  const [cargando, setCargando] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const router = useRouter()

  useEffect(() => {
    fetch('/api/ranking')
      .then(r => r.json())
      .then(d => setRanking(d.ranking || []))
      .finally(() => setCargando(false))
  }, [])

  const filtrado = ranking.filter(e => {
    const nombre = `${e.apellido} ${e.nombre} ${e.usuario}`.toLowerCase()
    return nombre.includes(busqueda.toLowerCase())
  })

  const conProde = ranking.filter(e => e.tiene_prode).length
  const sinProde = ranking.filter(e => !e.tiene_prode).length

  const medal = (i: number, entry: Entry) => {
    if (!entry.tiene_prode) return '-'
    if (i === 0) return '🥇'
    if (i === 1) return '🥈'
    if (i === 2) return '🥉'
    return `${i + 1}`
  }

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '26px', fontWeight: 700, marginBottom: '6px' }}>Ranking general</h1>
        <div style={{ display: 'flex', gap: '16px', fontSize: '14px', color: 'var(--texto-suave)', flexWrap: 'wrap' }}>
          <span>👥 {ranking.length} participantes</span>
          <span style={{ color: 'var(--verde)', fontWeight: 600 }}>✓ {conProde} con prode cargado</span>
          {sinProde > 0 && <span style={{ color: 'var(--error)' }}>✗ {sinProde} sin cargar</span>}
        </div>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <input
          type="text"
          placeholder="Buscar participante..."
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          style={{ maxWidth: '320px' }}
        />
      </div>

      {cargando ? (
        <p style={{ color: 'var(--texto-suave)', textAlign: 'center', padding: '48px 0' }}>Cargando ranking...</p>
      ) : (
        <div style={{ background: '#fff', border: '1px solid var(--gris-borde)', borderRadius: 'var(--radio)', overflow: 'hidden' }}>
          {/* Header */}
          <div style={{
            display: 'grid', gridTemplateColumns: '48px 1fr 80px 70px 70px 100px',
            padding: '10px 16px', background: 'var(--gris-bg)',
            borderBottom: '1px solid var(--gris-borde)',
            fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.07em',
            color: 'var(--texto-suave)', fontWeight: 600
          }}>
            <span>#</span>
            <span>Participante</span>
            <span style={{ textAlign: 'center' }}>Puntos</span>
            <span style={{ textAlign: 'center' }}>Exactos</span>
            <span style={{ textAlign: 'center' }}>Ganados</span>
            <span style={{ textAlign: 'center' }}>Estado</span>
          </div>

          {filtrado.map((entry, i) => (
            <div
              key={entry.usuario_id}
              onClick={() => entry.prode_id && router.push(`/prode/${entry.prode_id}`)}
              style={{
                display: 'grid', gridTemplateColumns: '48px 1fr 80px 70px 70px 100px',
                padding: '12px 16px', borderBottom: '1px solid #f0efec',
                cursor: entry.prode_id ? 'pointer' : 'default',
                alignItems: 'center',
                background: !entry.tiene_prode ? '#fafaf8' : i < 3 ? (i === 0 ? '#fffdf0' : '#f8f8f8') : undefined,
                opacity: entry.tiene_prode ? 1 : 0.7,
              }}
            >
              <span style={{ fontSize: i < 3 && entry.tiene_prode ? '18px' : '14px', fontWeight: 600, color: 'var(--texto-suave)' }}>
                {medal(i, entry)}
              </span>
              <div>
                <div style={{ fontWeight: 600, fontSize: '14px' }}>
                  {entry.apellido}, {entry.nombre}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--texto-suave)', marginTop: '1px' }}>
                  @{entry.usuario}
                </div>
              </div>
              <span style={{ textAlign: 'center', fontWeight: 700, fontSize: '18px', color: entry.tiene_prode ? 'var(--verde)' : '#ccc' }}>
                {entry.tiene_prode ? entry.puntos : '-'}
              </span>
              <span style={{ textAlign: 'center', fontSize: '14px', color: '#0a7c3e' }}>
                {entry.tiene_prode ? entry.exactos : '-'}
              </span>
              <span style={{ textAlign: 'center', fontSize: '14px', color: '#3b5ec6' }}>
                {entry.tiene_prode ? entry.ganadores : '-'}
              </span>
              <span style={{ textAlign: 'center' }}>
                {entry.tiene_prode
                  ? <span style={{ background: 'var(--verde-claro)', color: 'var(--verde)', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 600 }}>✓ Cargado</span>
                  : <span style={{ background: 'var(--error-bg)', color: 'var(--error)', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 600 }}>✗ Pendiente</span>
                }
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
