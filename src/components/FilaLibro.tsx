import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ESPACIO, OPACIDAD, RADIO, TAMANIO, TAMANIO_TEXTO } from '@/constants/tema';
import { useEstilos } from '@/hooks/useEstilos';
import { crearHojas } from '@/lib/estilos';
import type { Libro } from '@/types';

type Props = {
  libro: Libro;
  disponibles: number;
};

const hojas = crearHojas((c) =>
  StyleSheet.create({
    fila: {
      minHeight: TAMANIO.areaTactilMinima,
      flexDirection: 'row',
      alignItems: 'center',
      gap: ESPACIO.md,
      padding: ESPACIO.md,
      borderRadius: RADIO.normal,
      backgroundColor: c.superficie,
      borderWidth: TAMANIO.bordeFino,
      borderColor: c.borde,
    },
    presionada: {
      opacity: OPACIDAD.presionado,
    },
    datos: {
      flex: 1,
      gap: ESPACIO.xs,
    },
    titulo: {
      color: c.texto,
      fontSize: TAMANIO_TEXTO.normal,
      fontWeight: '600',
    },
    autor: {
      color: c.textoSuave,
      fontSize: TAMANIO_TEXTO.chico,
    },
    hay: {
      color: c.exito,
      fontSize: TAMANIO_TEXTO.chico,
      fontWeight: '600',
    },
    noHay: {
      color: c.peligro,
      fontSize: TAMANIO_TEXTO.chico,
      fontWeight: '600',
    },
  }),
);

export function FilaLibro({ libro, disponibles }: Props) {
  const estilos = useEstilos(hojas);
  const disponibilidad = disponibles > 0 ? `${disponibles} disponibles` : 'Sin ejemplares';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${libro.titulo}, de ${libro.autor}. ${disponibilidad}.`}
      accessibilityHint="Abre la ficha del libro"
      onPress={() => router.push({ pathname: '/libro/[isbn]', params: { isbn: libro.isbn } })}
      style={({ pressed }) => [estilos.fila, pressed && estilos.presionada]}>
      <View style={estilos.datos}>
        <Text style={estilos.titulo}>{libro.titulo}</Text>
        <Text style={estilos.autor}>
          {libro.autor} · {libro.anio}
        </Text>
      </View>
      <Text style={disponibles > 0 ? estilos.hay : estilos.noHay}>{disponibilidad}</Text>
    </Pressable>
  );
}
