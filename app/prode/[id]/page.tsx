'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { GRUPOS, Resultados, mundialEmpezado } from '@/lib/supabase'

interface Puntuacion {
  puntos: number; exactos: number; ganadores: number; partidos_jugados: number
}
interface Detalle { [id: string]: { puntos: number; tipo: 'exacto' | 'ganador' | 'miss' } }
interface Prode { id: string; nombre: string; apellido: string; resultados: Resultados; editado_en: string }

function badgeStyle(tipo?: string) {
  if (tipo === 'exacto') return { background: '#e8f5ee', color: '#0a7c3e', padding: '1px 7px', borderRadius: '12px', fontSize: '11px', fontWeight: 600 }
  if (tipo === 'ganador') return { background: '#e8f0fb', color: '#3b5ec6', padding: '1px 7px', borderRadius: '12px', fontSize: '11px', fontWeight: 600 }
  if (tipo === 'miss') return { background: '#fdf2f2', color: '#c0392b', padding: '1px 7px', borderRadius: '12px', fontSize: '11px', fontWeight: 600 }
  return { background: '#f0f0ee', color: '#888', padding: '1px 7px', borderRadius: '12px', fontSize: '11px', fontWeight: 600 }
}

function badgeLabel(tipo?: string) {
  if (tipo === 'exacto') return '+2 exacto'
  if (tipo === 'ganador') return '+1 ganador'
  if (tipo === 'miss') return '0 puntos'
  return 'pendiente'
}

export default function ProdePage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [prode, setProde] = useState<Prode | null>(null)
  const [puntuacion, setPuntuacion] = useState<Puntuacion | null>(null)
  const [detalle, setDetalle] = useState<Detalle>({})
  const [posicion, setPosicion] = useState(0)
  const [totalParticipantes, setTotalParticipantes] = useState(0)
  const [cargando, setCargando] = useState(true)
  const [noEncontrado, setNoEncontrado] = useState(false)
  const [editando, setEditando] = useState(false)
  const [resultadosEdit, setResultadosEdit] = useState<Resultados>({})
  const [guardando, setGuardando] = useState(false)
  const [copiado, setCopiado] = useState(false)

  const puedeEditar = !mundialEmpezado()

  useEffect(() => {
    fetch(`/api/puntuaciones/${params.id}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) { setNoEncontrado(true); return }
        setProde(data.prode)
        setPuntuacion(data.puntuacion)
        setDetalle(data.detalle || {})
        setPosicion(data.posicion)
        setTotalParticipantes(data.total_participantes)
        setResultadosEdit(data.prode.resultados)
      })
      .finally(() => setCargando(false))
  }, [params.id])

  function setScore(id: string, side: 'h' | 'a', raw: string) {
    let v = parseInt(raw)
    if (isNaN(v) || v < 0) v = 0
    if (v > 99) v = 99
    setResultadosEdit(prev => ({ ...prev, [id]: { ...prev[id], [side]: v } }))
  }

  async function guardarEdicion() {
    setGuardando(true)
    try {
      const res = await fetch(`/api/prodes/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resultados: resultadosEdit })
      })
      const data = await res.json()
      if (!res.ok) { alert(data.error); return }
      setProde(p => p ? { ...p, resultados: resultadosEdit } : p)
      setEditando(false)
    } catch { alert('Error al guardar') }
    finally { setGuardando(false) }
  }

  function copiarLink() {
    navigator.clipboard.writeText(window.location.href)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  if (cargando) return (
    <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--texto-suave)' }}>
      Cargando tu prode...
    </div>
  )

  if (noEncontrado) return (
    <div style={{ textAlign: 'center', padding: '80px 0' }}>
      <p style={{ fontSize: '18px', marginBottom: '12px' }}>Prode no encontrado</p>
      <p style={{ color: 'var(--texto-suave)', marginBottom: '24px' }}>El ID <code>{params.id}</code> no existe.</p>
      <button className="btn btn-primary" onClick={() => router.push('/')}>Cargar mi prode</button>
    </div>
  )

  const resultadosActivos = editando ? resultadosEdit : (prode?.resultados || {})

  return (
    <div>
      {/* Header del prode */}
      <div style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 700 }}>{prode?.nombre} {prode?.apellido}</h1>
            <p style={{ color: 'var(--texto-suave)', fontSize: '13px', marginTop: '3px' }}>
              ID: <code style={{ background: '#f0f0ee', padding: '1px 6px', borderRadius: '4px', fontFamily: 'monospace' }}>{params.id}</code>
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn btn-secondary" onClick={copiarLink} style={{ fontSize: '13px', padding: '8px 14px' }}>
              {copiado ? '✓ Copiado' : '🔗 Compartir link'}
            </button>
            {puedeEditar && !editando && (
              <button className="btn btn-ghost" onClick={() => setEditando(true)} style={{ fontSize: '13px', padding: '8px 14px' }}>
                ✏ Editar prode
              </button>
            )}
            {editando && (
              <>
                <button className="btn btn-secondary" onClick={() => { setEditando(false); setResultadosEdit(prode!.resultados) }} style={{ fontSize: '13px', padding: '8px 14px' }}>
                  Cancelar
                </button>
                <button className="btn btn-primary" onClick={guardarEdicion} disabled={guardando} style={{ fontSize: '13px', padding: '8px 14px' }}>
                  {guardando ? 'Guardando...' : '✓ Guardar cambios'}
                </button>
              </>
            )}
          </div>
        </div>
        {puedeEditar && (
          <div style={{ marginTop: '10px', background: '#fff8e1', border: '1px solid #ffe082', borderRadius: 'var(--radio-sm)', padding: '8px 14px', fontSize: '13px', color: '#7a5c00' }}>
            ⏰ El Mundial arranca el 11 de junio. Podés editar tu prode hasta ese día.
          </div>
        )}
      </div>

      {/* Tarjetas de puntuación */}
      {puntuacion !== null && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '32px' }}>
          {[
            { val: puntuacion.puntos, lbl: 'Puntos totales', color: 'var(--verde)' },
            { val: puntuacion.exactos, lbl: 'Exactos (+2)', color: '#0a7c3e' },
            { val: puntuacion.ganadores, lbl: 'Ganadores (+1)', color: '#3b5ec6' },
            { val: posicion > 0 ? `${posicion}°/${totalParticipantes}` : '-', lbl: 'Posición', color: 'var(--texto)' },
          ].map(({ val, lbl, color }) => (
            <div key={lbl} style={{ background: '#fff', border: '1px solid var(--gris-borde)', borderRadius: 'var(--radio)', padding: '16px', textAlign: 'center' }}>
              <div style={{ fontSize: '26px', fontWeight: 700, color, lineHeight: 1 }}>{val}</div>
              <div style={{ fontSize: '11px', color: 'var(--texto-suave)', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{lbl}</div>
            </div>
          ))}
        </div>
      )}

      {/* Grupos */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(440px, 1fr))', gap: '18px' }}>
        {GRUPOS.map(grupo => (
          <div key={grupo.letra} style={{ background: '#fff', border: '1px solid var(--gris-borde)', borderRadius: 'var(--radio)', overflow: 'hidden' }}>
            <div style={{ background: 'var(--gris-header)', color: '#fff', padding: '10px 16px', display: 'flex', alignItems: 'baseline', gap: '10px' }}>
              <span style={{ fontSize: '15px', fontWeight: 700 }}>Grupo {grupo.letra}</span>
              <span style={{ fontSize: '11px', opacity: 0.6 }}>{grupo.equipos.join(' · ')}</span>
            </div>
            {grupo.partidos.map(partido => {
              const r = resultadosActivos[partido.id] || { h: 0, a: 0 }
              const d = detalle[partido.id]
              return (
                <div key={partido.id} style={{
                  display: 'grid',
                  gridTemplateColumns: editando ? '1fr 76px 1fr' : '1fr 60px 1fr auto',
                  alignItems: 'center', gap: '8px', padding: '7px 14px',
                  borderBottom: '1px solid #f0efec',
                  background: d?.tipo === 'exacto' ? '#e8f5ee' : d?.tipo === 'ganador' ? '#eef1fc' : d?.tipo === 'miss' ? '#fdf2f2' : undefined
                }}>
                  <span style={{ fontSize: '12px', textAlign: 'right' }}>{partido.local}</span>
                  {editando ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                      <input type="number" min={0} max={99} value={r.h}
                        onChange={e => setScore(partido.id, 'h', e.target.value)}
                        onFocus={e => e.target.select()}
                        style={{ width: '34px', height: '30px', padding: 0, textAlign: 'center', fontSize: '14px', fontWeight: 600 }} />
                      <span style={{ color: '#aaa', fontSize: '13px' }}>:</span>
                      <input type="number" min={0} max={99} value={r.a}
                        onChange={e => setScore(partido.id, 'a', e.target.value)}
                        onFocus={e => e.target.select()}
                        style={{ width: '34px', height: '30px', padding: 0, textAlign: 'center', fontSize: '14px', fontWeight: 600 }} />
                    </div>
                  ) : (
                    <span style={{ textAlign: 'center', fontWeight: 700, fontSize: '14px' }}>{r.h} - {r.a}</span>
                  )}
                  <span style={{ fontSize: '12px' }}>{partido.visitante}</span>
                  {!editando && <span style={badgeStyle(d?.tipo)}>{badgeLabel(d?.tipo)}</span>}
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}
