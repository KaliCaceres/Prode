// Códigos ISO 3166-1 alpha-2 para flagcdn.com
export const CODIGOS: Record<string, string> = {
  'México': 'mx', 'Sudáfrica': 'za', 'Corea del Sur': 'kr', 'Rep. Checa': 'cz',
  'Canadá': 'ca', 'Bosnia': 'ba', 'Qatar': 'qa', 'Suiza': 'ch',
  'Estados Unidos': 'us', 'Paraguay': 'py', 'Australia': 'au', 'Turquía': 'tr',
  'Brasil': 'br', 'Marruecos': 'ma', 'Haití': 'ht', 'Escocia': 'gb-sct',
  'Alemania': 'de', 'Ecuador': 'ec', 'Costa de Marfil': 'ci', 'Curazao': 'cw',
  'Países Bajos': 'nl', 'Japón': 'jp', 'Suecia': 'se', 'Túnez': 'tn',
  'España': 'es', 'Uruguay': 'uy', 'Arabia Saudita': 'sa', 'Cabo Verde': 'cv',
  'Bélgica': 'be', 'Egipto': 'eg', 'Irán': 'ir', 'Nueva Zelanda': 'nz',
  'Francia': 'fr', 'Senegal': 'sn', 'Noruega': 'no', 'Irak': 'iq',
  'Argentina': 'ar', 'Argelia': 'dz', 'Austria': 'at', 'Jordania': 'jo',
  'Portugal': 'pt', 'Colombia': 'co', 'Uzbekistán': 'uz', 'Rep. D. Congo': 'cd',
  'Inglaterra': 'gb-eng', 'Croacia': 'hr', 'Ghana': 'gh', 'Panamá': 'pa',
}

export function banderaUrl(equipo: string): string {
  const codigo = CODIGOS[equipo]
  if (!codigo) return ''
  return `https://flagcdn.com/20x15/${codigo}.png`
}

// Componente inline para usar en JSX — devuelve props para un <img>
export function banderaImg(equipo: string): { src: string; alt: string; width: number; height: number; style: object } | null {
  const src = banderaUrl(equipo)
  if (!src) return null
  return { src, alt: equipo, width: 20, height: 15, style: { borderRadius: '2px', verticalAlign: 'middle', display: 'inline-block' } }
}
