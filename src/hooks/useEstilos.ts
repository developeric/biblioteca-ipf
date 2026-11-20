import type { Hojas } from '@/lib/estilos';

import { useEsquema } from './useEsquema';

export function useEstilos<T>(hojas: Hojas<T>): T {
  return hojas[useEsquema()];
}
