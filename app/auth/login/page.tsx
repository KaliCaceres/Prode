'use client'

import { useState } from 'react'
import { createBrowserSupabase } from '@/lib/supabase'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [cargando, setCargando] = useState(false)
  const [enviado, setEnviado] = useState(false)
  const [error, setError] = useState('')

  async function enviarLink() {
    if (!email.trim()) { setError('Ingresá tu email.'); return }
    setCargando(true)
    setError('')
    const supabase = createBrowserSupabase()
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (error) { setError(error.message); setCargando(false); return }
    setEnviado(true)
    setCargando(false)
  }

  return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{
        background: '#fff', border: '1px solid var(--gris-borde)',
        borderRadius: 'var(--radio)', padding: '48px 40px',
        textAlign: 'center', maxWidth: '380px', width: '100%'
      }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚽</div>
        <h1 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '8px' }}>Prode Mundial 2026</h1>

        {!enviado ? (
          <>
            <p style={{ color: 'var(--texto-suave)', fontSize: '14px', marginBottom: '28px', lineHeight: 1.5 }}>
              Ingresá tu email y te mandamos un link para entrar. Sin contraseña.
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

            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && enviarLink()}
              placeholder="tu@email.com"
              style={{ marginBottom: '12px', textAlign: 'center' }}
              autoFocus
            />

            <button
              onClick={enviarLink}
              disabled={cargando}
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center' }}
            >
              {cargando ? <><span className="spinner" /> Enviando...</> : '✉ Enviar link de acceso'}
            </button>

            <p style={{ fontSize: '12px', color: 'var(--texto-suave)', marginTop: '20px' }}>
              Solo usamos tu email para identificarte.
            </p>
          </>
        ) : (
          <>
            <div style={{
              background: 'var(--verde-claro)', border: '1px solid var(--verde-borde)',
              borderRadius: 'var(--radio-sm)', padding: '20px',
              marginBottom: '20px'
            }}>
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>📬</div>
              <p style={{ fontSize: '15px', fontWeight: 600, color: 'var(--verde)', marginBottom: '6px' }}>
                ¡Revisá tu email!
              </p>
              <p style={{ fontSize: '13px', color: 'var(--texto-suave)' }}>
                Te mandamos un link a <strong>{email}</strong>. Clickealo para entrar.
              </p>
            </div>
            <button
              onClick={() => { setEnviado(false); setEmail('') }}
              className="btn btn-secondary"
              style={{ width: '100%', justifyContent: 'center' }}
            >
              Usar otro email
            </button>
          </>
        )}
      </div>
    </div>
  )
}
