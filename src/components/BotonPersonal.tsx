import { Link } from 'expo-router';
import { StyleSheet } from 'react-native';

import { ESPACIO, TAMANIO, TAMANIO_TEXTO } from '@/constants/tema';
import { useBiblioteca } from '@/hooks/useBiblioteca';
import { useEstilos } from '@/hooks/useEstilos';
import { crearHojas } from '@/lib/estilos';

const hojas = crearHojas((c) =>
  StyleSheet.create({
    enlace: {
      minHeight: TAMANIO.areaTactilMinima,
      minWidth: TAMANIO.areaTactilMinima,
      paddingHorizontal: ESPACIO.sm,
      paddingVertical: ESPACIO.md,
      color: c.primario,
      fontSize: TAMANIO_TEXTO.normal,
      fontWeight: '600',
    },
  }),
);

// Link "Personal" del header: sin sesión abre el login; con sesión, el mostrador.
export function BotonPersonal() {
  const estilos = useEstilos(hojas);
  const { sesion } = useBiblioteca();

  return (
    <Link
      href={sesion ? '/mostrador' : '/login'}
      style={estilos.enlace}
      accessibilityHint={sesion ? 'Abre el mostrador' : 'Abre el ingreso del personal'}>
      Personal
    </Link>
  );
}
