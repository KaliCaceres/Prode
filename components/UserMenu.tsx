'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function UserMenu() {
  const router = useRouter()
  const [nombre, setNombre] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const [prodeId, setProdeId] = useState<string | null>(null)

  useEffect(() => {
    // Leer nombre del cookie (no httpOnly) o de la API
    fetch('/api/auth/me').then(r => r.json()).then(d => {
      if (d.nombre) { setNombre(d.nombre); setProdeId(d.prode_id) }
    }).catch(() => {})
  }, [])

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/auth/login')
  }

  if (!nombre) return null

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          background: 'transparent', border: '1px solid rgba(255,255,255,0.2)',
          borderRadius: '20px', padding: '6px 14px',
          color: '#fff', cursor: 'pointer', fontSize: '13px', fontFamily: 'inherit'
        }}
      >
        {nombre}
        <span style={{ opacity: 0.6, fontSize: '10px' }}>{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div style={{
          position: 'absolute', right: 0, top: '40px',
          background: '#fff', border: '1px solid var(--gris-borde)',
          borderRadius: 'var(--radio)', boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
          minWidth: '160px', overflow: 'hidden', zIndex: 200
        }}>
          {prodeId && (
            <a href={`/prode/${prodeId}`} onClick={() => setOpen(false)} style={{
              display: 'block', padding: '10px 16px', fontSize: '13px',
              color: 'var(--texto)', borderBottom: '1px solid var(--gris-borde)'
            }}>
              Mi prode
            </a>
          )}
          <button onClick={logout} style={{
            width: '100%', padding: '10px 16px', fontSize: '13px',
            color: 'var(--error)', background: 'transparent', border: 'none',
            cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit'
          }}>
            Cerrar sesión
          </button>
        </div>
      )}
      {open && <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 199 }} />}
    </div>
  )
}
