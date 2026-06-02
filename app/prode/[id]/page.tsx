'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { GRUPOS, Resultados, mundialEmpezado } from '@/lib/supabase'

interface Puntuacion { puntos: number; exactos: number; ganadores: number; partidos_jugados: number }
interface Detalle { [id: string]: { puntos: number; tipo: 'exacto' | 'ganador' | 'miss' } }
interface Prode { id: string; nombre: string; apellido: string; resultados: Resultados }

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

  async function descargarPDF() {
    setGenerandoPDF(true)
    try {
      const jspdfModule = await import('jspdf')
      const { jsPDF } = jspdfModule

      const nombre = prode?.nombre || ''
      const apellido = prode?.apellido || ''
      const fecha = new Date().toLocaleString('es-AR', { dateStyle: 'long', timeStyle: 'short' })
      const nombreCompleto = `${nombre} ${apellido}`

      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const PW = 210, PH = 297, M = 12, COL_GAP = 5
      const COL_W = (PW - M * 2 - COL_GAP) / 2

      const short = (s: string, max: number) => s.length > max ? s.substring(0, max - 1) + '.' : s

      doc.setFillColor(30, 30, 26)
      doc.rect(0, 0, PW, 30, 'F')
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(18); doc.setFont('helvetica', 'bold')
      doc.text('PRODE MUNDIAL 2026', M, 13)
      doc.setFontSize(9); doc.setFont('helvetica', 'normal')
      doc.text(`${nombreCompleto}   ·   ${fecha}`, M, 22)

      let leftY = 38, rightY = 38, col = 0
      const MATCH_H = 6.5, GH = 9, GP = 3

      const bh = (g: typeof GRUPOS[0]) => GH + g.partidos.length * MATCH_H + GP

      const newPage = () => {
        doc.addPage()
        doc.setFillColor(30, 30, 26)
        doc.rect(0, 0, PW, 16, 'F')
        doc.setTextColor(255, 255, 255)
        doc.setFontSize(8); doc.setFont('helvetica', 'normal')
        doc.text(`PRODE MUNDIAL 2026  ·  ${nombreCompleto}`, M, 10)
        leftY = 22; rightY = 22; col = 0
      }

      const resultadosActivos = editando ? resultadosEdit : (prode?.resultados || {})

      GRUPOS.forEach((g, gi) => {
        const h = bh(g)
        const maxY = PH - 68
        const drawY = col === 0 ? leftY : rightY

        if (drawY + h > maxY) newPage()

        const dx = M + col * (COL_W + COL_GAP)
        const dy = col === 0 ? leftY : rightY

        doc.setFillColor(244, 244, 242)
        doc.roundedRect(dx, dy, COL_W, h, 2, 2, 'F')
        doc.setFillColor(55, 55, 50)
        doc.roundedRect(dx, dy, COL_W, GH, 2, 2, 'F')
        doc.setFillColor(55, 55, 50)
        doc.rect(dx, dy + GH - 2, COL_W, 2, 'F')

        doc.setTextColor(255, 255, 255)
        doc.setFontSize(8); doc.setFont('helvetica', 'bold')
        doc.text(`GRUPO ${g.letra}`, dx + 3, dy + 6)
        doc.setFontSize(5.5); doc.setFont('helvetica', 'normal')
        doc.text(g.equipos.map(e => short(e, 9)).join(' · '), dx + COL_W - 2, dy + 6, { align: 'right' })

        g.partidos.forEach((partido, mi) => {
          const ry = dy + GH + mi * MATCH_H
          const r = resultadosActivos[partido.id] || { h: 0, a: 0 }
          const d = detalle[partido.id]

          if (mi > 0) {
            doc.setDrawColor(224, 224, 220)
            doc.setLineWidth(0.2)
            doc.line(dx + 2, ry, dx + COL_W - 2, ry)
          }

          // Color de fondo según resultado
          if (d?.tipo === 'exacto') { doc.setFillColor(232, 245, 238); doc.rect(dx + 1, ry, COL_W - 2, MATCH_H, 'F') }
          else if (d?.tipo === 'ganador') { doc.setFillColor(232, 240, 251); doc.rect(dx + 1, ry, COL_W - 2, MATCH_H, 'F') }
          else if (d?.tipo === 'miss') { doc.setFillColor(253, 242, 242); doc.rect(dx + 1, ry, COL_W - 2, MATCH_H, 'F') }

          doc.setTextColor(55, 55, 50)
          doc.setFontSize(6.5); doc.setFont('helvetica', 'normal')
          doc.text(short(partido.local, 14), dx + 2, ry + 4.2)
          doc.text(short(partido.visitante, 14), dx + COL_W - 2, ry + 4.2, { align: 'right' })
          doc.setFontSize(7); doc.setFont('helvetica', 'bold')
          doc.setTextColor(10, 10, 8)
          doc.text(`${r.h} - ${r.a}`, dx + COL_W / 2, ry + 4.2, { align: 'center' })
        })

        if (col === 0) { leftY = dy + h + 4; col = 1 }
        else { rightY = Math.max(leftY, dy + h + 4); leftY = rightY; col = 0 }
      })

      // Puntuación al final
      let finalY = Math.max(leftY, rightY) + 8
      if (finalY + 30 > PH) { newPage(); finalY = leftY }

      if (puntuacion) {
        doc.setFillColor(244, 244, 242)
        doc.roundedRect(M, finalY, PW - M * 2, 24, 2, 2, 'F')
        doc.setFontSize(8); doc.setFont('helvetica', 'bold'); doc.setTextColor(30, 30, 26)
        doc.text('PUNTUACIÓN', M + 4, finalY + 7)
        doc.setFontSize(11); doc.setTextColor(10, 124, 62)
        doc.text(`${puntuacion.puntos} pts`, PW / 2, finalY + 10, { align: 'center' })
        doc.setFontSize(7); doc.setFont('helvetica', 'normal'); doc.setTextColor(80, 80, 76)
        doc.text(`${puntuacion.exactos} exactos  ·  ${puntuacion.ganadores} ganadores  ·  Posición ${posicion}° de ${totalParticipantes}`, PW / 2, finalY + 17, { align: 'center' })
        doc.setFontSize(7); doc.setTextColor(130, 130, 126)
        doc.text(`Generado el ${fecha}`, PW / 2, finalY + 22, { align: 'center' })
      }

      // Numeración
      const totalPages = doc.getNumberOfPages()
      for (let p = 1; p <= totalPages; p++) {
        doc.setPage(p)
        doc.setFontSize(6.5); doc.setFont('helvetica', 'normal'); doc.setTextColor(160, 160, 156)
        doc.text(`Página ${p} de ${totalPages}`, PW - M, PH - 6, { align: 'right' })
      }

      doc.save(`prode-${apellido.toLowerCase()}-${nombre.toLowerCase()}.pdf`)
    } catch (e) {
      console.error(e)
      alert('Error al generar el PDF')
    } finally {
      setGenerandoPDF(false)
    }
  }

  if (cargando) return (
    <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--texto-suave)' }}>Cargando...</div>
  )

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
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 700 }}>{prode?.nombre} {prode?.apellido}</h1>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button className="btn btn-secondary" onClick={copiarLink} style={{ fontSize: '13px', padding: '8px 14px' }}>
              {copiado ? '✓ Copiado' : '🔗 Compartir'}
            </button>
            <button className="btn btn-secondary" onClick={descargarPDF} disabled={generandoPDF} style={{ fontSize: '13px', padding: '8px 14px' }}>
              {generandoPDF ? 'Generando...' : '↓ PDF'}
            </button>
            {puedeEditar && !editando && (
              <button className="btn btn-ghost" onClick={() => setEditando(true)} style={{ fontSize: '13px', padding: '8px 14px' }}>
                ✏ Editar
              </button>
            )}
            {editando && (
              <>
                <button className="btn btn-secondary" onClick={() => { setEditando(false); setResultadosEdit(prode!.resultados) }} style={{ fontSize: '13px', padding: '8px 14px' }}>
                  Cancelar
                </button>
                <button className="btn btn-primary" onClick={guardarEdicion} disabled={guardando} style={{ fontSize: '13px', padding: '8px 14px' }}>
                  {guardando ? 'Guardando...' : '✓ Guardar'}
                </button>
              </>
            )}
          </div>
        </div>
        {puedeEditar && !editando && (
          <div style={{ marginTop: '10px', background: '#fff8e1', border: '1px solid #ffe082', borderRadius: 'var(--radio-sm)', padding: '8px 14px', fontSize: '13px', color: '#7a5c00' }}>
            ⏰ Podés editar tu prode hasta el 11 de junio cuando arranque el Mundial.
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
                  gridTemplateColumns: editando ? '1fr 76px 1fr' : '1fr 56px 1fr 36px',
                  alignItems: 'center', gap: '6px', padding: '7px 14px',
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
