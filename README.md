# Prode Mundial 2026

Web app para hacer el prode del Mundial 2026. Cargás tus 72 resultados, obtenés un ID único, y seguís tu puntuación en tiempo real mientras se juegan los partidos.

## Stack
- **Next.js 14** (App Router) — frontend + API
- **Supabase** — base de datos PostgreSQL
- **Vercel** — hosting + cron job automático
- **ESPN API** — resultados oficiales (gratis, sin auth)

## Sistema de puntaje
| Resultado | Puntos |
|-----------|--------|
| Marcador exacto | **2 pts** |
| Acertó ganador o empate | **1 pt** |
| Erró | 0 pts |

---

## Setup (seguir en orden)

### 1. Supabase — crear tablas

1. Ir a [supabase.com](https://supabase.com) → tu proyecto → **SQL Editor**
2. Pegar el contenido de `sql/schema.sql` y ejecutar
3. Ir a **Settings → API** y copiar:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_KEY` ⚠️ nunca exponerla en el cliente

### 2. Variables de entorno locales

Crear el archivo `.env.local` (no lo subas a GitHub):

```
NEXT_PUBLIC_SUPABASE_URL=https://sqmzwmtysiozupcpdyuc.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key
SUPABASE_SERVICE_KEY=tu_service_role_key
CRON_SECRET=inventate_una_clave_larga_random
NEXT_PUBLIC_MUNDIAL_START=2026-06-11T19:00:00Z
```

### 3. Correr localmente

```bash
npm install
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000)

### 4. Subir a GitHub

```bash
git add .
git commit -m "proyecto inicial"
git push
```

### 5. Deploy en Vercel

1. Ir a [vercel.com](https://vercel.com) → **Add New Project**
2. Importar el repo `KaliCaceres/Prode`
3. En **Environment Variables** agregar las 5 variables del paso 2
4. Click **Deploy**

### 6. Configurar el Cron en Vercel

El archivo `vercel.json` ya tiene el cron configurado para correr cada hora.
Vercel lo activa automáticamente en el plan Hobby (gratis).

Para que el cron esté autorizado, agregar en las env vars de Vercel:
```
CRON_SECRET=la_misma_clave_que_pusiste_arriba
```

### 7. Forzar sync manual (opcional)

Para actualizar resultados en cualquier momento sin esperar el cron:

```
https://tu-dominio.vercel.app/api/sync?secret=TU_CRON_SECRET
```

---

## Estructura del proyecto

```
app/
  page.tsx                  → Formulario de carga del prode
  layout.tsx                → Header y layout global
  globals.css               → Estilos base
  prode/[id]/page.tsx       → Ver prode + puntuación
  ranking/page.tsx          → Tabla de posiciones
  api/
    prodes/route.ts         → POST: crear prode
    prodes/[id]/route.ts    → PUT: editar prode
    puntuaciones/[id]/route.ts → GET: puntuación de un prode
    ranking/route.ts        → GET: tabla completa
    sync/route.ts           → GET: cron de ESPN (cada hora)
lib/
  supabase.ts               → Cliente DB, tipos, fixture, lógica de puntaje
sql/
  schema.sql                → Tablas e insert inicial de los 72 partidos
```

## Notas

- El prode se puede editar hasta el 11 de junio de 2026 (inicio del Mundial)
- El ID del prode es la "contraseña": quien lo tiene puede ver y editar el prode
- El sync de ESPN matchea por nombre de equipo; si ESPN cambia los nombres puede fallar
- El cron corre cada hora; después de un partido tarda máximo 1 hora en actualizar
