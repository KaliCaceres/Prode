-- ============================================================
-- PRODE MUNDIAL 2026 - Schema Supabase
-- Ejecutar en Supabase > SQL Editor
-- ============================================================

-- Partidos oficiales (se actualizan con el cron de ESPN)
CREATE TABLE IF NOT EXISTS partidos_oficiales (
  id              TEXT PRIMARY KEY,   -- ej: "A1", "B3", "L6"
  grupo           TEXT NOT NULL,
  jornada         INT NOT NULL,       -- 1, 2 o 3
  local           TEXT NOT NULL,
  visitante       TEXT NOT NULL,
  fecha_utc       TIMESTAMPTZ,
  goles_local     INT,                -- NULL = no jugado
  goles_visita    INT,
  finalizado      BOOLEAN DEFAULT FALSE,
  actualizado_en  TIMESTAMPTZ DEFAULT NOW()
);

-- Prodes de los participantes
CREATE TABLE IF NOT EXISTS prodes (
  id              TEXT PRIMARY KEY,   -- ej: "GARCIA-JUAN-A3X9"
  nombre          TEXT NOT NULL,
  apellido        TEXT NOT NULL,
  resultados      JSONB NOT NULL,     -- { "A1": {"h":1,"a":0}, ... }
  creado_en       TIMESTAMPTZ DEFAULT NOW(),
  editado_en      TIMESTAMPTZ DEFAULT NOW(),
  bloqueado       BOOLEAN DEFAULT FALSE
);

-- Puntuaciones cacheadas (se recalculan tras cada sync)
CREATE TABLE IF NOT EXISTS puntuaciones (
  prode_id        TEXT PRIMARY KEY REFERENCES prodes(id) ON DELETE CASCADE,
  puntos          INT DEFAULT 0,
  exactos         INT DEFAULT 0,
  ganadores       INT DEFAULT 0,
  partidos_jugados INT DEFAULT 0,
  actualizado_en  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- DATOS INICIALES - Los 72 partidos del fixture oficial
-- ============================================================
INSERT INTO partidos_oficiales (id, grupo, jornada, local, visitante, fecha_utc) VALUES
  -- GRUPO A
  ('A1','A',1,'México','Sudáfrica','2026-06-11T19:00Z'),
  ('A2','A',1,'Corea del Sur','Rep. Checa','2026-06-12T01:00Z'),
  ('A3','A',2,'Rep. Checa','Sudáfrica','2026-06-18T16:00Z'),
  ('A4','A',2,'México','Corea del Sur','2026-06-19T01:00Z'),
  ('A5','A',3,'Rep. Checa','México','2026-06-25T21:00Z'),
  ('A6','A',3,'Sudáfrica','Corea del Sur','2026-06-25T21:00Z'),
  -- GRUPO B
  ('B1','B',1,'Canadá','Bosnia','2026-06-12T21:00Z'),
  ('B2','B',1,'Qatar','Suiza','2026-06-13T18:00Z'),
  ('B3','B',2,'Suiza','Bosnia','2026-06-18T21:00Z'),
  ('B4','B',2,'Canadá','Qatar','2026-06-19T18:00Z'),
  ('B5','B',3,'Bosnia','Qatar','2026-06-24T21:00Z'),
  ('B6','B',3,'Suiza','Canadá','2026-06-24T21:00Z'),
  -- GRUPO C
  ('C1','C',1,'Estados Unidos','Paraguay','2026-06-13T02:00Z'),
  ('C2','C',1,'Australia','Turquía','2026-06-14T21:00Z'),
  ('C3','C',2,'Estados Unidos','Australia','2026-06-19T21:00Z'),
  ('C4','C',2,'Turquía','Paraguay','2026-06-20T18:00Z'),
  ('C5','C',3,'Paraguay','Australia','2026-06-26T01:00Z'),
  ('C6','C',3,'Turquía','Estados Unidos','2026-06-26T01:00Z'),
  -- GRUPO D
  ('D1','D',1,'Brasil','Marruecos','2026-06-13T23:00Z'),
  ('D2','D',1,'Haití','Escocia','2026-06-14T02:00Z'),
  ('D3','D',2,'Escocia','Marruecos','2026-06-19T23:00Z'),
  ('D4','D',2,'Brasil','Haití','2026-06-20T02:00Z'),
  ('D5','D',3,'Marruecos','Haití','2026-06-24T23:00Z'),
  ('D6','D',3,'Escocia','Brasil','2026-06-25T02:00Z'),
  -- GRUPO E
  ('E1','E',1,'Alemania','Curazao','2026-06-14T19:00Z'),
  ('E2','E',1,'Costa de Marfil','Ecuador','2026-06-14T22:00Z'),
  ('E3','E',2,'Alemania','Costa de Marfil','2026-06-20T21:00Z'),
  ('E4','E',2,'Ecuador','Curazao','2026-06-21T18:00Z'),
  ('E5','E',3,'Curazao','Costa de Marfil','2026-06-25T19:00Z'),
  ('E6','E',3,'Ecuador','Alemania','2026-06-25T19:00Z'),
  -- GRUPO F
  ('F1','F',1,'Países Bajos','Japón','2026-06-14T22:00Z'),
  ('F2','F',1,'Suecia','Túnez','2026-06-15T19:00Z'),
  ('F3','F',2,'Países Bajos','Suecia','2026-06-20T21:00Z'),
  ('F4','F',2,'Túnez','Japón','2026-06-21T21:00Z'),
  ('F5','F',3,'Japón','Suecia','2026-06-25T23:00Z'),
  ('F6','F',3,'Túnez','Países Bajos','2026-06-25T23:00Z'),
  -- GRUPO G
  ('G1','G',1,'España','Cabo Verde','2026-06-15T19:00Z'),
  ('G2','G',1,'Arabia Saudita','Uruguay','2026-06-15T22:00Z'),
  ('G3','G',2,'España','Arabia Saudita','2026-06-21T21:00Z'),
  ('G4','G',2,'Uruguay','Cabo Verde','2026-06-21T23:00Z'),
  ('G5','G',3,'Cabo Verde','Arabia Saudita','2026-06-27T01:00Z'),
  ('G6','G',3,'Uruguay','España','2026-06-27T01:00Z'),
  -- GRUPO H
  ('H1','H',1,'Bélgica','Egipto','2026-06-15T23:00Z'),
  ('H2','H',1,'Irán','Nueva Zelanda','2026-06-16T19:00Z'),
  ('H3','H',2,'Bélgica','Irán','2026-06-21T19:00Z'),
  ('H4','H',2,'Nueva Zelanda','Egipto','2026-06-22T19:00Z'),
  ('H5','H',3,'Egipto','Irán','2026-06-27T21:00Z'),
  ('H6','H',3,'Nueva Zelanda','Bélgica','2026-06-27T21:00Z'),
  -- GRUPO I
  ('I1','I',1,'Francia','Senegal','2026-06-16T22:00Z'),
  ('I2','I',1,'Irak','Noruega','2026-06-16T01:00Z'),
  ('I3','I',2,'Francia','Irak','2026-06-22T22:00Z'),
  ('I4','I',2,'Noruega','Senegal','2026-06-23T19:00Z'),
  ('I5','I',3,'Noruega','Francia','2026-06-26T21:00Z'),
  ('I6','I',3,'Senegal','Irak','2026-06-26T21:00Z'),
  -- GRUPO J
  ('J1','J',1,'Argentina','Argelia','2026-06-17T19:00Z'),
  ('J2','J',1,'Austria','Jordania','2026-06-17T22:00Z'),
  ('J3','J',2,'Argentina','Austria','2026-06-22T19:00Z'),
  ('J4','J',2,'Jordania','Argelia','2026-06-23T01:00Z'),
  ('J5','J',3,'Argelia','Austria','2026-06-28T01:00Z'),
  ('J6','J',3,'Jordania','Argentina','2026-06-28T01:00Z'),
  -- GRUPO K
  ('K1','K',1,'Portugal','Rep. D. Congo','2026-06-17T23:00Z'),
  ('K2','K',1,'Uzbekistán','Colombia','2026-06-18T02:00Z'),
  ('K3','K',2,'Portugal','Uzbekistán','2026-06-23T22:00Z'),
  ('K4','K',2,'Colombia','Rep. D. Congo','2026-06-24T01:00Z'),
  ('K5','K',3,'Colombia','Portugal','2026-06-27T23:00Z'),
  ('K6','K',3,'Rep. D. Congo','Uzbekistán','2026-06-27T23:00Z'),
  -- GRUPO L
  ('L1','L',1,'Inglaterra','Croacia','2026-06-17T23:00Z'),
  ('L2','L',1,'Ghana','Panamá','2026-06-18T02:00Z'),
  ('L3','L',2,'Inglaterra','Ghana','2026-06-23T19:00Z'),
  ('L4','L',2,'Panamá','Croacia','2026-06-23T22:00Z'),
  ('L5','L',3,'Croacia','Ghana','2026-06-27T19:00Z'),
  ('L6','L',3,'Panamá','Inglaterra','2026-06-27T19:00Z')
ON CONFLICT (id) DO NOTHING;

-- Índices
CREATE INDEX IF NOT EXISTS idx_puntuaciones_puntos ON puntuaciones(puntos DESC);
CREATE INDEX IF NOT EXISTS idx_prodes_apellido ON prodes(apellido);

-- RLS: desactivado para simplificar (usamos service key solo en el servidor)
ALTER TABLE partidos_oficiales ENABLE ROW LEVEL SECURITY;
ALTER TABLE prodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE puntuaciones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public read partidos" ON partidos_oficiales FOR SELECT USING (true);
CREATE POLICY "public read prodes" ON prodes FOR SELECT USING (true);
CREATE POLICY "public read puntuaciones" ON puntuaciones FOR SELECT USING (true);
CREATE POLICY "service insert prodes" ON prodes FOR INSERT WITH CHECK (true);
CREATE POLICY "service update prodes" ON prodes FOR UPDATE USING (true);
CREATE POLICY "service upsert puntuaciones" ON puntuaciones FOR ALL USING (true);
CREATE POLICY "service update partidos" ON partidos_oficiales FOR UPDATE USING (true);
