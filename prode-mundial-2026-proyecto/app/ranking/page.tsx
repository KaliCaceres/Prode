'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface Entry {
  prode_id: string
  puntos: number
  exactos: number
  ganadores: number
  partidos_jugados: number
  prodes: { nombre: string; apellido: string }
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
    const nombre = `${e.prodes?.apellido} ${e.prodes?.nombre}`.toLowerCase()
    return nombre.includes(busqueda.toLowerCase()) || e.prode_id.toLowerCase().includes(busqueda.toLowerCase())
  })

  const medal = (i: number) => i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}`

  return (
    <div>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '26px', fontWeight: 700, marginBottom: '6px' }}>Ranking general</h1>
        <p style={{ color: 'var(--texto-suave)', fontSize: '14px' }}>
          {ranking.length} participantes · Se actualiza automáticamente después de cada partido.
        </p>
      </div>

      {/* Buscar */}
      <div style={{ marginBottom: '20px' }}>
        <input
          type="text"
          placeholder="Buscar por nombre o ID..."
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          style={{ maxWidth: '360px' }}
        />
      </div>

      {cargando ? (
        <p style={{ color: 'var(--texto-suave)', textAlign: 'center', padding: '48px 0' }}>Cargando ranking...</p>
      ) : filtrado.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--texto-suave)' }}>
          {ranking.length === 0
            ? 'Todavía no hay prodes cargados. ¡Sé el primero!'
            : 'No se encontraron participantes.'}
          <div style={{ marginTop: '16px' }}>
            <button className="btn btn-primary" onClick={() => router.push('/')}>Cargar mi prode</button>
          </div>
        </div>
      ) : (
        <div style={{ background: '#fff', border: '1px solid var(--gris-borde)', borderRadius: 'var(--radio)', overflow: 'hidden' }}>
          {/* Header */}
          <div style={{
            display: 'grid', gridTemplateColumns: '48px 1fr 80px 80px 80px 80px',
            padding: '10px 16px', background: 'var(--gris-bg)',
            borderBottom: '1px solid var(--gris-borde)',
            fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--texto-suave)', fontWeight: 600
          }}>
            <span>#</span>
            <span>Participante</span>
            <span style={{ textAlign: 'center' }}>Puntos</span>
            <span style={{ textAlign: 'center' }}>Exactos</span>
            <span style={{ textAlign: 'center' }}>Ganadores</span>
            <span style={{ textAlign: 'center' }}>Jugados</span>
          </div>

          {filtrado.map((entry, i) => {
            const realIndex = ranking.indexOf(entry)
            return (
              <div
                key={entry.prode_id}
                onClick={() => router.push(`/prode/${entry.prode_id}`)}
                style={{
                  display: 'grid', gridTemplateColumns: '48px 1fr 80px 80px 80px 80px',
                  padding: '12px 16px', borderBottom: '1px solid #f0efec',
                  cursor: 'pointer', alignItems: 'center',
                  background: realIndex < 3 ? (realIndex === 0 ? '#fffdf0' : realIndex === 1 ? '#f8f8f8' : '#fff8f2') : undefined,
                  transition: 'background 0.1s'
                }}
                onMouseEnter={e => (e.currentTarget.style.background = '#f8f8f6')}
                onMouseLeave={e => (e.currentTarget.style.background = realIndex < 3 ? (realIndex === 0 ? '#fffdf0' : realIndex === 1 ? '#f8f8f8' : '#fff8f2') : '')}
              >
                <span style={{ fontSize: realIndex < 3 ? '18px' : '14px', fontWeight: 600, color: 'var(--texto-suave)' }}>
                  {medal(realIndex)}
                </span>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '14px' }}>
                    {entry.prodes?.apellido}, {entry.prodes?.nombre}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--texto-suave)', fontFamily: 'monospace', marginTop: '1px' }}>
                    {entry.prode_id}
                  </div>
                </div>
                <span style={{ textAlign: 'center', fontWeight: 700, fontSize: '18px', color: 'var(--verde)' }}>{entry.puntos}</span>
                <span style={{ textAlign: 'center', fontSize: '14px', color: '#0a7c3e' }}>{entry.exactos}</span>
                <span style={{ textAlign: 'center', fontSize: '14px', color: '#3b5ec6' }}>{entry.ganadores}</span>
                <span style={{ textAlign: 'center', fontSize: '14px', color: 'var(--texto-suave)' }}>{entry.partidos_jugados}</span>
              </div>
            )
          })}
        </div>
      )}

      {!cargando && ranking.length > 0 && (
        <p style={{ fontSize: '11px', color: 'var(--texto-suave)', textAlign: 'right', marginTop: '8px' }}>
          Hacé click en cualquier fila para ver el prode completo.
        </p>
      )}
    </div>
  )
}
