import { Link, type Href } from 'expo-router';
import { StyleSheet } from 'react-native';

import { ESPACIO, TAMANIO, TAMANIO_TEXTO } from '@/constants/tema';
import { useEstilos } from '@/hooks/useEstilos';
import { crearHojas } from '@/lib/estilos';

type Props = {
  href: Href;
  texto: string;
};

const hojas = crearHojas((c) =>
  StyleSheet.create({
    enlace: {
      minHeight: TAMANIO.areaTactilMinima,
      paddingVertical: ESPACIO.md,
      paddingHorizontal: ESPACIO.sm,
      color: c.primario,
      fontSize: TAMANIO_TEXTO.normal,
      fontWeight: '600',
      textDecorationLine: 'underline',
      textAlign: 'center',
    },
  }),
);

// Vuelve a una pantalla que ya está en la pila (si no está, la abre).
export function Enlace({ href, texto }: Props) {
  const estilos = useEstilos(hojas);

  return (
    <Link href={href} dismissTo style={estilos.enlace}>
      {texto}
    </Link>
  );
}
