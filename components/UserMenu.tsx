'use client'

import { useEffect, useState } from 'react'
import { createBrowserSupabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'

export default function UserMenu() {
  const [user, setUser] = useState<User | null>(null)
  const [prodeId, setProdeId] = useState<string | null>(null)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const supabase = createBrowserSupabase()
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
      if (user) {
        supabase.from('prodes').select('id').eq('user_id', user.id).single()
          .then(({ data }) => { if (data) setProdeId(data.id) })
      }
    })
  }, [])

  async function logout() {
    const supabase = createBrowserSupabase()
    await supabase.auth.signOut()
    window.location.href = '/auth/login'
  }

  if (!user) return null

  const nombre = user.user_metadata?.full_name?.split(' ')[0] || user.email?.split('@')[0] || 'Usuario'
  const avatar = user.user_metadata?.avatar_url

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          background: 'transparent', border: '1px solid rgba(255,255,255,0.2)',
          borderRadius: '20px', padding: '4px 12px 4px 4px',
          color: '#fff', cursor: 'pointer', fontSize: '13px', fontFamily: 'inherit'
        }}
      >
        {avatar ? (
          <img src={avatar} alt="" width={26} height={26} style={{ borderRadius: '50%' }} />
        ) : (
          <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'var(--verde)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700 }}>
            {nombre[0].toUpperCase()}
          </div>
        )}
        {nombre}
        <span style={{ opacity: 0.6, fontSize: '10px' }}>{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div style={{
          position: 'absolute', right: 0, top: '40px',
          background: '#fff', border: '1px solid var(--gris-borde)',
          borderRadius: 'var(--radio)', boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
          minWidth: '180px', overflow: 'hidden', zIndex: 200
        }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--gris-borde)' }}>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--texto)' }}>{user.user_metadata?.full_name || nombre}</div>
            <div style={{ fontSize: '11px', color: 'var(--texto-suave)', marginTop: '2px' }}>{user.email}</div>
          </div>
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

      {open && (
        <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 199 }} />
      )}
    </div>
  )
}
