import { COLORES, type Colores } from '@/constants/tema';

import { useEsquema } from './useEsquema';

export function useColores(): Colores {
  return COLORES[useEsquema()];
}
