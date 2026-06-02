'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [usuario, setUsuario] = useState('')
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)

  async function entrar() {
    if (!usuario.trim() || !pin.trim()) { setError('Ingresá usuario y PIN'); return }
    setCargando(true)
    setError('')
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuario: usuario.trim(), pin: pin.trim() })
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error); return }
      if (data.prode_id) router.push(`/prode/${data.prode_id}`)
      else router.push('/')
    } catch {
      setError('Error de conexión')
    } finally {
      setCargando(false)
    }
  }

  return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{
        background: '#fff', border: '1px solid var(--gris-borde)',
        borderRadius: 'var(--radio)', padding: '48px 40px',
        textAlign: 'center', maxWidth: '360px', width: '100%'
      }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚽</div>
        <h1 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '8px' }}>Prode Mundial 2026</h1>
        <p style={{ color: 'var(--texto-suave)', fontSize: '14px', marginBottom: '28px' }}>
          Ingresá con tu usuario y PIN.
        </p>

        {error && (
          <div style={{
            background: 'var(--error-bg)', border: '1px solid var(--error-borde)',
            borderRadius: 'var(--radio-sm)', padding: '10px 14px',
            fontSize: '13px', color: 'var(--error)', marginBottom: '16px'
          }}>
            {error}
          </div>
        )}

        <div style={{ marginBottom: '12px', textAlign: 'left' }}>
          <label style={{ display: 'block', fontSize: '12px', color: 'var(--texto-suave)', marginBottom: '5px', fontWeight: 500 }}>
            Usuario
          </label>
          <input
            type="text"
            value={usuario}
            onChange={e => setUsuario(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && entrar()}
            placeholder="tu usuario"
            autoFocus
            autoCapitalize="none"
            autoComplete="username"
          />
        </div>

        <div style={{ marginBottom: '20px', textAlign: 'left' }}>
          <label style={{ display: 'block', fontSize: '12px', color: 'var(--texto-suave)', marginBottom: '5px', fontWeight: 500 }}>
            PIN
          </label>
          <input
            type="password"
            value={pin}
            onChange={e => setPin(e.target.value.replace(/\D/g, '').substring(0, 4))}
            onKeyDown={e => e.key === 'Enter' && entrar()}
            placeholder="••••"
            inputMode="numeric"
            autoComplete="current-password"
            style={{ textAlign: 'center', fontSize: '24px', letterSpacing: '8px' }}
          />
        </div>

        <button
          onClick={entrar}
          disabled={cargando}
          className="btn btn-primary"
          style={{ width: '100%', justifyContent: 'center' }}
        >
          {cargando ? <><span className="spinner" /> Entrando...</> : 'Entrar'}
        </button>
      </div>
    </div>
  )
}
