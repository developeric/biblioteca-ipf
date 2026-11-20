import { useColorScheme } from 'react-native';

import type { Esquema } from '@/constants/tema';

export function useEsquema(): Esquema {
  return useColorScheme() === 'dark' ? 'oscuro' : 'claro';
}
