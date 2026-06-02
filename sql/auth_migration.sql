-- ============================================================
-- MIGRACIÓN: Auth Magic Link
-- ============================================================

TRUNCATE TABLE puntuaciones CASCADE;
TRUNCATE TABLE prodes CASCADE;

ALTER TABLE prodes ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE prodes ADD COLUMN IF NOT EXISTS email TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_prodes_user_id ON prodes(user_id);

-- Borrar TODAS las políticas posibles
DROP POLICY IF EXISTS "public read partidos" ON partidos_oficiales;
DROP POLICY IF EXISTS "public read prodes" ON prodes;
DROP POLICY IF EXISTS "service insert prodes" ON prodes;
DROP POLICY IF EXISTS "service update prodes" ON prodes;
DROP POLICY IF EXISTS "public read puntuaciones" ON puntuaciones;
DROP POLICY IF EXISTS "service upsert puntuaciones" ON puntuaciones;
DROP POLICY IF EXISTS "lectura publica prodes" ON prodes;
DROP POLICY IF EXISTS "insertar propio prode" ON prodes;
DROP POLICY IF EXISTS "editar propio prode" ON prodes;
DROP POLICY IF EXISTS "lectura publica puntuaciones" ON puntuaciones;
DROP POLICY IF EXISTS "lectura publica partidos" ON partidos_oficiales;
DROP POLICY IF EXISTS "service update partidos" ON partidos_oficiales;

-- Crear políticas nuevas
CREATE POLICY "lectura publica prodes" ON prodes FOR SELECT USING (true);
CREATE POLICY "insertar propio prode" ON prodes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "editar propio prode" ON prodes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "lectura publica puntuaciones" ON puntuaciones FOR SELECT USING (true);
CREATE POLICY "service upsert puntuaciones" ON puntuaciones FOR ALL USING (true);
CREATE POLICY "lectura publica partidos" ON partidos_oficiales FOR SELECT USING (true);
CREATE POLICY "service update partidos" ON partidos_oficiales FOR UPDATE USING (true);
