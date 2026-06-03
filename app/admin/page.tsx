'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { GRUPOS } from '@/lib/supabase'
import { banderaUrl } from '@/lib/banderas'

const ADMINS = ['dmartini', 'ccaceres']

interface Partido {
  id: string
  grupo: string
  local: string
  visitante: string
  fecha_utc: string
  goles_local: number | null
  goles_visita: number | null
  finalizado: boolean
}

interface EditState {
  goles_local: string
  goles_visita: string
  finalizado: boolean
}

function Flag({ equipo }: { equipo: string }) {
  const src = banderaUrl(equipo)
  if (!src) return null
  return <img src={src} alt={equipo} width={20} height={15} style={{ borderRadius: '2px', verticalAlign: 'middle' }} />
}

export default function AdminPage() {
  const router = useRouter()
  const [partidos, setPartidos] = useState<Partido[]>([])
  const [cargando, setCargando] = useState(true)
  const [edits, setEdits] = useState<Record<string, EditState>>({})
  const [guardando, setGuardando] = useState<string | null>(null)
  const [guardado, setGuardado] = useState<string | null>(null)
  const [grupoActivo, setGrupoActivo] = useState('A')

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(me => {
      if (!me.usuario || !ADMINS.includes(me.usuario)) {
        router.push('/')
        return
      }
      cargarPartidos()
    })
  }, [])

  async function cargarPartidos() {
    const res = await fetch('/api/admin/resultados', { cache: 'no-store' })
    const data = await res.json()
    const ps: Partido[] = data.partidos || []
    setPartidos(ps)
    // Inicializar edits con valores actuales
    const e: Record<string, EditState> = {}
    ps.forEach(p => {
      e[p.id] = {
        goles_local: p.goles_local !== null ? String(p.goles_local) : '',
        goles_visita: p.goles_visita !== null ? String(p.goles_visita) : '',
        finalizado: p.finalizado
      }
    })
    setEdits(e)
    setCargando(false)
  }

  async function guardar(partido: Partido) {
    const edit = edits[partido.id]
    if (!edit) return
    setGuardando(partido.id)
    try {
      const res = await fetch('/api/admin/resultados', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          partido_id: partido.id,
          goles_local: edit.goles_local === '' ? 0 : edit.goles_local,
          goles_visita: edit.goles_visita === '' ? 0 : edit.goles_visita,
          finalizado: edit.finalizado
        })
      })
      if (res.ok) {
        setGuardado(partido.id)
        setTimeout(() => setGuardado(null), 2000)
        await cargarPartidos()
      }
    } finally {
      setGuardando(null)
    }
  }

  function setEdit(id: string, field: keyof EditState, value: string | boolean) {
    setEdits(prev => ({ ...prev, [id]: { ...prev[id], [field]: value } }))
  }

  const grupos = GRUPOS.map(g => g.letra)
  const partidosGrupo = partidos.filter(p => p.grupo === grupoActivo)
  const jugados = partidos.filter(p => p.finalizado).length

  if (cargando) return <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--texto-suave)' }}>Cargando...</div>

  return (
    <div>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '26px', fontWeight: 700, marginBottom: '6px' }}>⚙ Panel de resultados</h1>
        <p style={{ color: 'var(--texto-suave)', fontSize: '14px' }}>
          {jugados} de {partidos.length} partidos cargados · Las puntuaciones se recalculan automáticamente al guardar.
        </p>
      </div>

      {/* Tabs de grupos */}
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '24px' }}>
        {grupos.map(g => {
          const psG = partidos.filter(p => p.grupo === g)
          const jugadosG = psG.filter(p => p.finalizado).length
          return (
            <button
              key={g}
              onClick={() => setGrupoActivo(g)}
              style={{
                padding: '6px 14px', borderRadius: '6px', border: 'none', cursor: 'pointer',
                fontFamily: 'inherit', fontSize: '13px', fontWeight: 600,
                background: grupoActivo === g ? 'var(--gris-header)' : '#fff',
                color: grupoActivo === g ? '#fff' : 'var(--texto)',
                outline: grupoActivo === g ? 'none' : '1px solid var(--gris-borde)',
                position: 'relative'
              }}
            >
              {g}
              <span style={{
                marginLeft: '6px', fontSize: '10px', fontWeight: 400,
                color: grupoActivo === g ? 'rgba(255,255,255,0.7)' : 'var(--texto-suave)'
              }}>
                {jugadosG}/{psG.length}
              </span>
            </button>
          )
        })}
      </div>

      {/* Partidos del grupo activo */}
      <div style={{ background: '#fff', border: '1px solid var(--gris-borde)', borderRadius: 'var(--radio)', overflow: 'hidden', marginBottom: '32px' }}>
        <div style={{ background: 'var(--gris-header)', color: '#fff', padding: '12px 20px', fontWeight: 700 }}>
          Grupo {grupoActivo}
        </div>
        {partidosGrupo.map((partido, i) => {
          const edit = edits[partido.id] || { goles_local: '', goles_visita: '', finalizado: false }
          const isGuardando = guardando === partido.id
          const isGuardado = guardado === partido.id
          const fecha = new Date(partido.fecha_utc).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })

          return (
            <div key={partido.id} style={{
              padding: '14px 20px',
              borderBottom: i < partidosGrupo.length - 1 ? '1px solid #f0efec' : 'none',
              background: partido.finalizado ? '#f8fdf9' : undefined
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>

                {/* Fecha */}
                <span style={{ fontSize: '11px', color: 'var(--texto-suave)', minWidth: '90px' }}>{fecha}</span>

                {/* Local */}
                <span style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '5px', minWidth: '130px', justifyContent: 'flex-end' }}>
                  {partido.local} <Flag equipo={partido.local} />
                </span>

                {/* Score inputs */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <input
                    type="number" min={0} max={99}
                    value={edit.goles_local}
                    onChange={e => setEdit(partido.id, 'goles_local', e.target.value)}
                    onFocus={e => e.target.select()}
                    placeholder="–"
                    style={{ width: '40px', height: '36px', textAlign: 'center', fontSize: '16px', fontWeight: 700, borderRadius: '6px', border: '1px solid var(--gris-borde)', padding: 0 }}
                  />
                  <span style={{ fontWeight: 700, color: 'var(--texto-suave)' }}>:</span>
                  <input
                    type="number" min={0} max={99}
                    value={edit.goles_visita}
                    onChange={e => setEdit(partido.id, 'goles_visita', e.target.value)}
                    onFocus={e => e.target.select()}
                    placeholder="–"
                    style={{ width: '40px', height: '36px', textAlign: 'center', fontSize: '16px', fontWeight: 700, borderRadius: '6px', border: '1px solid var(--gris-borde)', padding: 0 }}
                  />
                </div>

                {/* Visitante */}
                <span style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '5px', minWidth: '130px' }}>
                  <Flag equipo={partido.visitante} /> {partido.visitante}
                </span>

                {/* Toggle finalizado */}
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--texto-suave)', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={edit.finalizado}
                    onChange={e => setEdit(partido.id, 'finalizado', e.target.checked)}
                    style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                  />
                  Finalizado
                </label>

                {/* Botón guardar */}
                <button
                  onClick={() => guardar(partido)}
                  disabled={isGuardando}
                  style={{
                    padding: '7px 16px', borderRadius: '6px', border: 'none', cursor: 'pointer',
                    fontFamily: 'inherit', fontSize: '13px', fontWeight: 600,
                    background: isGuardado ? 'var(--verde)' : 'var(--gris-header)',
                    color: '#fff', marginLeft: 'auto', transition: 'background 0.2s'
                  }}
                >
                  {isGuardando ? '...' : isGuardado ? '✓ Guardado' : 'Guardar'}
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

