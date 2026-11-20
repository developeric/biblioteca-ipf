export type Colores = {
  fondo: string;
  superficie: string;
  borde: string;
  texto: string;
  textoSuave: string;
  primario: string;
  textoSobrePrimario: string;
  peligro: string;
  exito: string;
  avisoFondo: string;
  avisoTexto: string;
  deshabilitado: string;
};

export type Esquema = 'claro' | 'oscuro';

export const COLORES: Record<Esquema, Colores> = {
  claro: {
    fondo: '#F5F7FB',
    superficie: '#FFFFFF',
    borde: '#D5DBE7',
    texto: '#111827',
    textoSuave: '#4B5563',
    primario: '#1E3A8A',
    textoSobrePrimario: '#FFFFFF',
    peligro: '#B91C1C',
    exito: '#166534',
    avisoFondo: '#FEF3C7',
    avisoTexto: '#78350F',
    deshabilitado: '#9CA3AF',
  },
  oscuro: {
    fondo: '#0B1120',
    superficie: '#172036',
    borde: '#2C3A57',
    texto: '#F3F4F6',
    textoSuave: '#B6C0D4',
    primario: '#93B4FF',
    textoSobrePrimario: '#0B1120',
    peligro: '#FCA5A5',
    exito: '#86EFAC',
    avisoFondo: '#3B2F0A',
    avisoTexto: '#FDE68A',
    deshabilitado: '#5B6476',
  },
};

export const ESPACIO = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const TAMANIO_TEXTO = {
  chico: 13,
  normal: 16,
  subtitulo: 18,
  titulo: 22,
} as const;

export const RADIO = {
  chico: 6,
  normal: 10,
  grande: 16,
} as const;

export const OPACIDAD = {
  presionado: 0.7,
} as const;

export const TAMANIO = {
  areaTactilMinima: 44,
  icono: 24,
  iconoGrande: 48,
  alturaCamara: 320,
  bordeFino: 1,
} as const;
