-- ============================================================
-- MIGRACIÓN: Reemplazar auth de Supabase por usuario + PIN
-- ============================================================

-- 1. Tabla de usuarios del prode
CREATE TABLE IF NOT EXISTS usuarios (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario     TEXT UNIQUE NOT NULL,  -- ej: "kali", "juan"
  pin         TEXT NOT NULL,         -- 4 dígitos, guardado como hash
  nombre      TEXT NOT NULL,
  apellido    TEXT NOT NULL,
  creado_en   TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Modificar prodes para usar id de usuarios en lugar de auth.users
ALTER TABLE prodes DROP COLUMN IF EXISTS user_id;
ALTER TABLE prodes DROP COLUMN IF EXISTS email;
ALTER TABLE prodes ADD COLUMN IF NOT EXISTS usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE;

-- 3. Índice único: un prode por usuario
DROP INDEX IF EXISTS idx_prodes_user_id;
CREATE UNIQUE INDEX IF NOT EXISTS idx_prodes_usuario_id ON prodes(usuario_id);

-- 4. Limpiar políticas viejas
DROP POLICY IF EXISTS "lectura publica prodes" ON prodes;
DROP POLICY IF EXISTS "insertar propio prode" ON prodes;
DROP POLICY IF EXISTS "editar propio prode" ON prodes;

-- 5. RLS simple: lectura pública, escritura via service key (desde el server)
CREATE POLICY "lectura publica prodes" ON prodes FOR SELECT USING (true);
CREATE POLICY "service insert prodes" ON prodes FOR INSERT WITH CHECK (true);
CREATE POLICY "service update prodes" ON prodes FOR UPDATE USING (true);

-- RLS en usuarios
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
CREATE POLICY "lectura publica usuarios" ON usuarios FOR SELECT USING (true);

-- 6. Cargar usuarios de ejemplo (cambiá los PINs antes de usar)
-- INSERT INTO usuarios (usuario, pin, nombre, apellido) VALUES
--   ('kali',   '1234', 'Kali',   'Caceres'),
--   ('juan',   '5678', 'Juan',   'García'),
--   ('maria',  '9012', 'María',  'López');
