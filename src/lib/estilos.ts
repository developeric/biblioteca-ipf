import { COLORES, type Colores, type Esquema } from '@/constants/tema';

export type Hojas<T> = Record<Esquema, T>;

// Crea las hojas de estilo una sola vez por esquema (claro y oscuro), a nivel de módulo.
export function crearHojas<T>(crear: (colores: Colores) => T): Hojas<T> {
  return {
    claro: crear(COLORES.claro),
    oscuro: crear(COLORES.oscuro),
  };
}
