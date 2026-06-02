-- ============================================================
-- MIGRACIÓN: Agregar auth de Google
-- Ejecutar en Supabase > SQL Editor
-- ============================================================

-- 1. Limpiar datos de prueba
TRUNCATE TABLE puntuaciones CASCADE;
TRUNCATE TABLE prodes CASCADE;

-- 2. Agregar columna user_id a prodes (vincula con auth.users de Supabase)
ALTER TABLE prodes ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE prodes ADD COLUMN IF NOT EXISTS email TEXT;

-- 3. Índice único: un prode por usuario
CREATE UNIQUE INDEX IF NOT EXISTS idx_prodes_user_id ON prodes(user_id);

-- 4. Actualizar RLS — ahora cada usuario solo puede ver/editar su propio prode
-- Primero, borrar políticas viejas
DROP POLICY IF EXISTS "public read prodes" ON prodes;
DROP POLICY IF EXISTS "service insert prodes" ON prodes;
DROP POLICY IF EXISTS "service update prodes" ON prodes;
DROP POLICY IF EXISTS "public read puntuaciones" ON puntuaciones;
DROP POLICY IF EXISTS "service upsert puntuaciones" ON puntuaciones;

-- Prodes: lectura pública (para ver el prode de otros en el ranking)
CREATE POLICY "lectura publica prodes" ON prodes
  FOR SELECT USING (true);

-- Prodes: solo el dueño puede insertar/actualizar
CREATE POLICY "insertar propio prode" ON prodes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "editar propio prode" ON prodes
  FOR UPDATE USING (auth.uid() = user_id);

-- Puntuaciones: lectura pública, escritura solo service role
CREATE POLICY "lectura publica puntuaciones" ON puntuaciones
  FOR SELECT USING (true);

CREATE POLICY "service upsert puntuaciones" ON puntuaciones
  FOR ALL USING (true);

-- Partidos: lectura pública
DROP POLICY IF EXISTS "public read partidos" ON partidos_oficiales;
CREATE POLICY "lectura publica partidos" ON partidos_oficiales
  FOR SELECT USING (true);
