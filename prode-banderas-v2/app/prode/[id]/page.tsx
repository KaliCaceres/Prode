'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { GRUPOS, Resultados, mundialEmpezado, calcularPosicionesGrupo } from '@/lib/supabase'
import { banderaUrl } from '@/lib/banderas'

interface Puntuacion { puntos: number; exactos: number; ganadores: number; partidos_jugados: number }
interface Detalle { [id: string]: { puntos: number; tipo: 'exacto' | 'ganador' | 'miss' } }
interface Prode { id: string; nombre: string; apellido: string; resultados: Resultados }

function Flag({ equipo, size = 20 }: { equipo: string; size?: number }) {
  const src = banderaUrl(equipo)
  if (!src) return null
  return <img src={src} alt={equipo} width={size} height={Math.round(size * 0.75)} style={{ borderRadius: '2px', verticalAlign: 'middle', display: 'inline-block' }} />
}

function badgeStyle(tipo?: string) {
  if (tipo === 'exacto') return { background: '#e8f5ee', color: '#0a7c3e', padding: '1px 7px', borderRadius: '12px', fontSize: '11px', fontWeight: 600 }
  if (tipo === 'ganador') return { background: '#e8f0fb', color: '#3b5ec6', padding: '1px 7px', borderRadius: '12px', fontSize: '11px', fontWeight: 600 }
  if (tipo === 'miss') return { background: '#fdf2f2', color: '#c0392b', padding: '1px 7px', borderRadius: '12px', fontSize: '11px', fontWeight: 600 }
  return { background: '#f0f0ee', color: '#888', padding: '1px 7px', borderRadius: '12px', fontSize: '11px', fontWeight: 600 }
}

function badgeLabel(tipo?: string) {
  if (tipo === 'exacto') return '+2'
  if (tipo === 'ganador') return '+1'
  if (tipo === 'miss') return '✗'
  return '–'
}

function TablaGrupo({ grupo, resultados }: { grupo: typeof GRUPOS[0]; resultados: Resultados }) {
  const posiciones = calcularPosicionesGrupo(grupo.equipos, grupo.partidos, resultados)
  return (
    <div style={{ borderTop: '1px solid #f0efec' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
        <thead>
          <tr style={{ background: '#f8f8f6' }}>
            {['#','Equipo','PJ','G','E','P','GF','GC','Dif','Pts'].map((h, i) => (
              <th key={h} style={{ padding: '4px 6px', textAlign: i <= 1 ? 'left' : 'center', fontWeight: 600, color: 'var(--texto-suave)' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {posiciones.map((p, i) => (
            <tr key={p.equipo} style={{ background: i < 2 ? '#f0faf4' : undefined, borderTop: '1px solid #f0efec' }}>
              <td style={{ padding: '4px 6px', color: i < 2 ? 'var(--verde)' : 'var(--texto-suave)', fontWeight: i < 2 ? 700 : 400 }}>{i + 1}</td>
              <td style={{ padding: '4px 6px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Flag equipo={p.equipo} size={16} />{p.equipo}
              </td>
              <td style={{ padding: '4px 6px', textAlign: 'center', color: 'var(--texto-suave)' }}>{p.pj}</td>
              <td style={{ padding: '4px 6px', textAlign: 'center', color: 'var(--texto-suave)' }}>{p.pg}</td>
              <td style={{ padding: '4px 6px', textAlign: 'center', color: 'var(--texto-suave)' }}>{p.pe}</td>
              <td style={{ padding: '4px 6px', textAlign: 'center', color: 'var(--texto-suave)' }}>{p.pp}</td>
              <td style={{ padding: '4px 6px', textAlign: 'center', color: 'var(--texto-suave)' }}>{p.gf}</td>
              <td style={{ padding: '4px 6px', textAlign: 'center', color: 'var(--texto-suave)' }}>{p.gc}</td>
              <td style={{ padding: '4px 6px', textAlign: 'center', color: p.dif > 0 ? 'var(--verde)' : p.dif < 0 ? 'var(--error)' : 'var(--texto-suave)' }}>{p.dif > 0 ? '+' : ''}{p.dif}</td>
              <td style={{ padding: '4px 6px', textAlign: 'center', fontWeight: 700 }}>{p.pts}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
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
  const [esMio, setEsMio] = useState(false)
  const [generandoPDF, setGenerandoPDF] = useState(false)
  const [mostrarTablas, setMostrarTablas] = useState(true)

  const puedeEditar = !mundialEmpezado() && esMio

  useEffect(() => {
    Promise.all([
      fetch(`/api/puntuaciones/${params.id}`).then(r => r.json()),
      fetch('/api/auth/me').then(r => r.json()),
    ]).then(([data, me]) => {
      if (data.error) { setNoEncontrado(true); return }
      setProde(data.prode)
      setPuntuacion(data.puntuacion)
      setDetalle(data.detalle || {})
      setPosicion(data.posicion)
      setTotalParticipantes(data.total_participantes)
      setResultadosEdit(data.prode.resultados)
      setEsMio(me.prode_id === params.id)
    }).finally(() => setCargando(false))
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
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
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

  async function descargarPDF() {
    setGenerandoPDF(true)
    try {
      const { jsPDF } = await import('jspdf')
      const nombre = prode?.nombre || '', apellido = prode?.apellido || ''
      const fecha = new Date().toLocaleString('es-AR', { dateStyle: 'long', timeStyle: 'short' })
      const nombreCompleto = `${nombre} ${apellido}`
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const PW = 210, PH = 297, M = 12, COL_GAP = 5, COL_W = (PW - M * 2 - COL_GAP) / 2
      const short = (s: string, max: number) => s.length > max ? s.substring(0, max - 1) + '.' : s
      doc.setFillColor(30, 30, 26); doc.rect(0, 0, PW, 30, 'F')
      doc.setTextColor(255, 255, 255); doc.setFontSize(18); doc.setFont('helvetica', 'bold')
      doc.text('PRODE MUNDIAL 2026', M, 13)
      doc.setFontSize(9); doc.setFont('helvetica', 'normal')
      doc.text(`${nombreCompleto}   ·   ${fecha}`, M, 22)
      let leftY = 38, rightY = 38, col = 0
      const MATCH_H = 6.5, GH = 9, GP = 3
      const bh = (g: typeof GRUPOS[0]) => GH + g.partidos.length * MATCH_H + GP
      const newPage = () => {
        doc.addPage(); doc.setFillColor(30, 30, 26); doc.rect(0, 0, PW, 16, 'F')
        doc.setTextColor(255, 255, 255); doc.setFontSize(8); doc.setFont('helvetica', 'normal')
        doc.text(`PRODE MUNDIAL 2026  ·  ${nombreCompleto}`, M, 10)
        leftY = 22; rightY = 22; col = 0
      }
      const resultadosActivos = editando ? resultadosEdit : (prode?.resultados || {})
      GRUPOS.forEach(g => {
        const h = bh(g); const drawY = col === 0 ? leftY : rightY
        if (drawY + h > PH - 68) newPage()
        const dx = M + col * (COL_W + COL_GAP); const dy = col === 0 ? leftY : rightY
        doc.setFillColor(244, 244, 242); doc.roundedRect(dx, dy, COL_W, h, 2, 2, 'F')
        doc.setFillColor(55, 55, 50); doc.roundedRect(dx, dy, COL_W, GH, 2, 2, 'F')
        doc.setFillColor(55, 55, 50); doc.rect(dx, dy + GH - 2, COL_W, 2, 'F')
        doc.setTextColor(255, 255, 255); doc.setFontSize(8); doc.setFont('helvetica', 'bold')
        doc.text(`GRUPO ${g.letra}`, dx + 3, dy + 6)
        doc.setFontSize(5.5); doc.setFont('helvetica', 'normal')
        doc.text(g.equipos.map(e => short(e, 9)).join(' · '), dx + COL_W - 2, dy + 6, { align: 'right' })
        g.partidos.forEach((partido, mi) => {
          const ry = dy + GH + mi * MATCH_H
          const r = resultadosActivos[partido.id] || { h: 0, a: 0 }
          const d = detalle[partido.id]
          if (mi > 0) { doc.setDrawColor(224, 224, 220); doc.setLineWidth(0.2); doc.line(dx + 2, ry, dx + COL_W - 2, ry) }
          if (d?.tipo === 'exacto') { doc.setFillColor(232, 245, 238); doc.rect(dx + 1, ry, COL_W - 2, MATCH_H, 'F') }
          else if (d?.tipo === 'ganador') { doc.setFillColor(232, 240, 251); doc.rect(dx + 1, ry, COL_W - 2, MATCH_H, 'F') }
          else if (d?.tipo === 'miss') { doc.setFillColor(253, 242, 242); doc.rect(dx + 1, ry, COL_W - 2, MATCH_H, 'F') }
          doc.setTextColor(55, 55, 50); doc.setFontSize(6.5); doc.setFont('helvetica', 'normal')
          doc.text(short(partido.local, 14), dx + 2, ry + 4.2)
          doc.text(short(partido.visitante, 14), dx + COL_W - 2, ry + 4.2, { align: 'right' })
          doc.setFontSize(7); doc.setFont('helvetica', 'bold'); doc.setTextColor(10, 10, 8)
          doc.text(`${r.h} - ${r.a}`, dx + COL_W / 2, ry + 4.2, { align: 'center' })
        })
        if (col === 0) { leftY = dy + h + 4; col = 1 } else { rightY = Math.max(leftY, dy + h + 4); leftY = rightY; col = 0 }
      })
      let finalY = Math.max(leftY, rightY) + 8
      if (finalY + 30 > PH) { newPage(); finalY = leftY }
      if (puntuacion) {
        doc.setFillColor(244, 244, 242); doc.roundedRect(M, finalY, PW - M * 2, 24, 2, 2, 'F')
        doc.setFontSize(8); doc.setFont('helvetica', 'bold'); doc.setTextColor(30, 30, 26)
        doc.text('PUNTUACIÓN', M + 4, finalY + 7)
        doc.setFontSize(11); doc.setTextColor(10, 124, 62)
        doc.text(`${puntuacion.puntos} pts`, PW / 2, finalY + 10, { align: 'center' })
        doc.setFontSize(7); doc.setFont('helvetica', 'normal'); doc.setTextColor(80, 80, 76)
        doc.text(`${puntuacion.exactos} exactos · ${puntuacion.ganadores} ganadores · Posición ${posicion}° de ${totalParticipantes}`, PW / 2, finalY + 17, { align: 'center' })
        doc.setFontSize(7); doc.setTextColor(130, 130, 126)
        doc.text(`Generado el ${fecha}`, PW / 2, finalY + 22, { align: 'center' })
      }
      const totalPages = doc.getNumberOfPages()
      for (let p = 1; p <= totalPages; p++) {
        doc.setPage(p); doc.setFontSize(6.5); doc.setFont('helvetica', 'normal'); doc.setTextColor(160, 160, 156)
        doc.text(`Página ${p} de ${totalPages}`, PW - M, PH - 6, { align: 'right' })
      }
      doc.save(`prode-${apellido.toLowerCase()}-${nombre.toLowerCase()}.pdf`)
    } catch (e) { console.error(e); alert('Error al generar el PDF') }
    finally { setGenerandoPDF(false) }
  }

  if (cargando) return <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--texto-suave)' }}>Cargando...</div>
  if (noEncontrado) return (
    <div style={{ textAlign: 'center', padding: '80px 0' }}>
      <p style={{ fontSize: '18px', marginBottom: '12px' }}>Prode no encontrado</p>
      <button className="btn btn-primary" onClick={() => router.push('/')}>Ir al inicio</button>
    </div>
  )

  const resultadosActivos = editando ? resultadosEdit : (prode?.resultados || {})

  return (
    <div>
      <div style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 700 }}>{prode?.nombre} {prode?.apellido}</h1>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button className="btn btn-secondary" onClick={copiarLink} style={{ fontSize: '13px', padding: '8px 14px' }}>
              {copiado ? '✓ Copiado' : '🔗 Compartir'}
            </button>
            <button className="btn btn-secondary" onClick={descargarPDF} disabled={generandoPDF} style={{ fontSize: '13px', padding: '8px 14px' }}>
              {generandoPDF ? 'Generando...' : '↓ PDF'}
            </button>
            <button onClick={() => setMostrarTablas(!mostrarTablas)}
              style={{ background: 'none', border: '1px solid var(--gris-borde)', borderRadius: 'var(--radio-sm)', padding: '8px 14px', cursor: 'pointer', fontSize: '13px', color: 'var(--verde)', fontFamily: 'inherit' }}>
              {mostrarTablas ? '▲ Ocultar tablas' : '▼ Tablas'}
            </button>
            {puedeEditar && !editando && (
              <button className="btn btn-ghost" onClick={() => setEditando(true)} style={{ fontSize: '13px', padding: '8px 14px' }}>✏ Editar</button>
            )}
            {editando && (
              <>
                <button className="btn btn-secondary" onClick={() => { setEditando(false); setResultadosEdit(prode!.resultados) }} style={{ fontSize: '13px', padding: '8px 14px' }}>Cancelar</button>
                <button className="btn btn-primary" onClick={guardarEdicion} disabled={guardando} style={{ fontSize: '13px', padding: '8px 14px' }}>
                  {guardando ? 'Guardando...' : '✓ Guardar'}
                </button>
              </>
            )}
          </div>
        </div>
        {puedeEditar && !editando && (
          <div style={{ marginTop: '10px', background: '#fff8e1', border: '1px solid #ffe082', borderRadius: 'var(--radio-sm)', padding: '8px 14px', fontSize: '13px', color: '#7a5c00' }}>
            ⏰ Podés editar tu prode hasta el 10 de junio.
          </div>
        )}
      </div>

      {puntuacion !== null && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '32px' }}>
          {[
            { val: puntuacion.puntos, lbl: 'Puntos', color: 'var(--verde)' },
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

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(440px, 1fr))', gap: '18px' }}>
        {GRUPOS.map(grupo => (
          <div key={grupo.letra} style={{ background: '#fff', border: '1px solid var(--gris-borde)', borderRadius: 'var(--radio)', overflow: 'hidden' }}>
            <div style={{ background: 'var(--gris-header)', color: '#fff', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '15px', fontWeight: 700 }}>Grupo {grupo.letra}</span>
              <span style={{ display: 'flex', gap: '4px' }}>
                {grupo.equipos.map(e => <img key={e} src={banderaUrl(e)} alt={e} width={20} height={15} style={{ borderRadius: '2px' }} title={e} />)}
              </span>
            </div>
            {grupo.partidos.map(partido => {
              const r = resultadosActivos[partido.id] || { h: 0, a: 0 }
              const d = detalle[partido.id]
              return (
                <div key={partido.id} style={{
                  display: 'grid',
                  gridTemplateColumns: editando ? '1fr 76px 1fr' : '1fr 56px 1fr 36px',
                  alignItems: 'center', gap: '6px', padding: '7px 14px',
                  borderBottom: '1px solid #f0efec',
                  background: d?.tipo === 'exacto' ? '#e8f5ee' : d?.tipo === 'ganador' ? '#eef1fc' : d?.tipo === 'miss' ? '#fdf2f2' : undefined
                }}>
                  <span style={{ fontSize: '12px', textAlign: 'right', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '5px' }}>
                    {partido.local}<Flag equipo={partido.local} />
                  </span>
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
                  <span style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Flag equipo={partido.visitante} />{partido.visitante}
                  </span>
                  {!editando && <span style={badgeStyle(d?.tipo)}>{badgeLabel(d?.tipo)}</span>}
                </div>
              )
            })}
            {mostrarTablas && <TablaGrupo grupo={grupo} resultados={resultadosActivos} />}
          </div>
        ))}
      </div>
    </div>
  )
}
