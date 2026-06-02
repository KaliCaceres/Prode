'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { GRUPOS, Resultados } from '@/lib/supabase'

function initResultados(): Resultados {
  const r: Resultados = {}
  GRUPOS.forEach(g => g.partidos.forEach(p => { r[p.id] = { h: 0, a: 0 } }))
  return r
}

export default function Home() {
  const router = useRouter()
  const [nombre, setNombre] = useState('')
  const [apellido, setApellido] = useState('')
  const [resultados, setResultados] = useState<Resultados>(initResultados)
  const [errores, setErrores] = useState<string[]>([])
  const [cargando, setCargando] = useState(false)
  const [verificando, setVerificando] = useState(true)

  const totalPartidos = GRUPOS.reduce((acc, g) => acc + g.partidos.length, 0)
  const modificados = Object.values(resultados).filter(r => r.h !== 0 || r.a !== 0).length

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(data => {
      if (data.error) { router.push('/auth/login'); return }
      setNombre(data.nombre || '')
      setApellido(data.apellido || '')
      if (data.prode_id) { router.push(`/prode/${data.prode_id}`); return }
      setVerificando(false)
    }).catch(() => router.push('/auth/login'))
  }, [])

  function setScore(id: string, side: 'h' | 'a', raw: string) {
    let v = parseInt(raw)
    if (isNaN(v) || v < 0) v = 0
    if (v > 99) v = 99
    setResultados(prev => ({ ...prev, [id]: { ...prev[id], [side]: v } }))
  }

  function validar(): boolean {
    const errs: string[] = []
    if (!nombre.trim()) errs.push('Ingresá tu nombre.')
    if (!apellido.trim()) errs.push('Ingresá tu apellido.')
    setErrores(errs)
    return errs.length === 0
  }

  async function enviar() {
    if (!validar()) { window.scrollTo({ top: 0, behavior: 'smooth' }); return }
    setCargando(true)
    try {
      const res = await fetch('/api/prodes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: nombre.trim(), apellido: apellido.trim(), resultados })
      })
      const data = await res.json()
      if (!res.ok) { setErrores([data.error || 'Error al guardar']); return }
      router.push(`/prode/${data.id}`)
    } catch {
      setErrores(['Error de conexión. Intentá de nuevo.'])
    } finally {
      setCargando(false)
    }
  }

  function limpiar() {
    if (!confirm('¿Resetear todos los resultados a 0-0?')) return
    setResultados(initResultados())
  }

  if (verificando) return (
    <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--texto-suave)' }}>Cargando...</div>
  )

  return (
    <div>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '26px', fontWeight: 700, marginBottom: '6px' }}>Cargá tu prode</h1>
        <p style={{ color: 'var(--texto-suave)', fontSize: '14px' }}>
          72 partidos · Fase de grupos · Podés editar hasta el 11 de junio.
        </p>
      </div>

      {errores.length > 0 && (
        <div className="card" style={{ borderColor: 'var(--error-borde)', background: 'var(--error-bg)', marginBottom: '24px', color: 'var(--error)' }}>
          {errores.map((e, i) => <p key={i} style={{ fontSize: '14px' }}>⚠ {e}</p>)}
        </div>
      )}

      <div className="card" style={{ marginBottom: '24px' }}>
        <p style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--texto-suave)', fontWeight: 600, marginBottom: '16px' }}>Tus datos</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', color: 'var(--texto-suave)', marginBottom: '5px', fontWeight: 500 }}>Nombre</label>
            <input type="text" value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Tu nombre" maxLength={40} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '12px', color: 'var(--texto-suave)', marginBottom: '5px', fontWeight: 500 }}>Apellido</label>
            <input type="text" value={apellido} onChange={e => setApellido(e.target.value)} placeholder="Tu apellido" maxLength={40} />
          </div>
        </div>
      </div>

      <div style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--texto-suave)', marginBottom: '6px' }}>
          <span>{modificados} de {totalPartidos} partidos modificados</span>
          <span>{Math.round(modificados / totalPartidos * 100)}%</span>
        </div>
        <div style={{ height: '5px', background: '#e8e8e5', borderRadius: '3px', overflow: 'hidden' }}>
          <div style={{ height: '100%', background: 'var(--verde)', borderRadius: '3px', width: `${Math.round(modificados / totalPartidos * 100)}%`, transition: 'width 0.3s' }} />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(440px, 1fr))', gap: '18px', marginBottom: '32px' }}>
        {GRUPOS.map(grupo => (
          <div key={grupo.letra} style={{ background: '#fff', border: '1px solid var(--gris-borde)', borderRadius: 'var(--radio)', overflow: 'hidden' }}>
            <div style={{ background: 'var(--gris-header)', color: '#fff', padding: '10px 16px', display: 'flex', alignItems: 'baseline', gap: '10px' }}>
              <span style={{ fontSize: '16px', fontWeight: 700 }}>Grupo {grupo.letra}</span>
              <span style={{ fontSize: '11px', opacity: 0.6 }}>{grupo.equipos.join(' · ')}</span>
            </div>
            {grupo.partidos.map(partido => {
              const r = resultados[partido.id]
              const modificado = r.h !== 0 || r.a !== 0
              return (
                <div key={partido.id} style={{
                  display: 'grid', gridTemplateColumns: '1fr 76px 1fr',
                  alignItems: 'center', gap: '8px', padding: '7px 14px',
                  borderBottom: '1px solid #f0efec',
                  background: modificado ? 'var(--verde-claro)' : undefined
                }}>
                  <span style={{ fontSize: '12px', textAlign: 'right' }}>{partido.local}</span>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                    <input type="number" min={0} max={99} value={r.h}
                      onChange={e => setScore(partido.id, 'h', e.target.value)}
                      onFocus={e => e.target.select()}
                      style={{ width: '34px', height: '32px', padding: 0, textAlign: 'center', fontSize: '15px', fontWeight: 600 }} />
                    <span style={{ color: '#aaa', fontWeight: 600, fontSize: '13px' }}>:</span>
                    <input type="number" min={0} max={99} value={r.a}
                      onChange={e => setScore(partido.id, 'a', e.target.value)}
                      onFocus={e => e.target.select()}
                      style={{ width: '34px', height: '32px', padding: 0, textAlign: 'center', fontSize: '15px', fontWeight: 600 }} />
                  </div>
                  <span style={{ fontSize: '12px' }}>{partido.visitante}</span>
                </div>
              )
            })}
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
        <button className="btn btn-secondary" onClick={limpiar}>↺ Resetear todo</button>
        <button className="btn btn-primary" onClick={enviar} disabled={cargando}>
          {cargando ? <><span className="spinner" /> Guardando...</> : '✓ Guardar mi prode'}
        </button>
      </div>
    </div>
  )
}
