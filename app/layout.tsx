import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Prode Mundial 2026',
  description: 'Cargá tu prode del Mundial 2026 y seguí tu puntuación en tiempo real',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <header style={{
          background: '#1e1e1c', color: '#fff',
          padding: '0 24px', height: '56px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          position: 'sticky', top: 0, zIndex: 100
        }}>
          <a href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 700, fontSize: '16px' }}>
            ⚽ Prode Mundial 2026
          </a>
          <nav style={{ display: 'flex', gap: '20px', alignItems: 'center', fontSize: '14px' }}>
            <a href="/ranking" style={{ opacity: 0.7 }}>Ranking</a>
            <UserMenu />
          </nav>
        </header>
        <main style={{ maxWidth: '960px', margin: '0 auto', padding: '32px 20px 80px' }}>
          {children}
        </main>
      </body>
    </html>
  )
}

// Componente client-side para el menú de usuario
function UserMenu() {
  return <UserMenuClient />
}

// Se importa dinámicamente para evitar SSR issues
import dynamic from 'next/dynamic'
const UserMenuClient = dynamic(() => import('@/components/UserMenu'), { ssr: false })
