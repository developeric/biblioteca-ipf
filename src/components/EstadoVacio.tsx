import { Ionicons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { ESPACIO, TAMANIO, TAMANIO_TEXTO } from '@/constants/tema';
import { useColores } from '@/hooks/useColores';
import { useEstilos } from '@/hooks/useEstilos';
import { crearHojas } from '@/lib/estilos';
import type { NombreIcono } from '@/types/iconos';

type Props = {
  mensaje: string;
  icono?: NombreIcono;
  children?: ReactNode;
};

const hojas = crearHojas((c) =>
  StyleSheet.create({
    contenedor: {
      alignItems: 'center',
      gap: ESPACIO.md,
      padding: ESPACIO.xl,
    },
    texto: {
      color: c.textoSuave,
      fontSize: TAMANIO_TEXTO.normal,
      textAlign: 'center',
    },
  }),
);

export function EstadoVacio({ mensaje, icono = 'book-outline', children }: Props) {
  const estilos = useEstilos(hojas);
  const colores = useColores();

  return (
    <View style={estilos.contenedor}>
      <Ionicons name={icono} size={TAMANIO.iconoGrande} color={colores.textoSuave} />
      <Text style={estilos.texto}>{mensaje}</Text>
      {children}
    </View>
  );
}
