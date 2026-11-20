import { StyleSheet, Text, View } from 'react-native';

import { ESPACIO, TAMANIO_TEXTO } from '@/constants/tema';
import { useEstilos } from '@/hooks/useEstilos';
import { crearHojas } from '@/lib/estilos';
import { contar } from '@/lib/textos';
import type { Libro } from '@/types';

type Props = {
  libro: Libro;
  disponibles: number;
  enEspera: number;
};

const hojas = crearHojas((c) =>
  StyleSheet.create({
    ficha: {
      gap: ESPACIO.sm,
    },
    titulo: {
      color: c.texto,
      fontSize: TAMANIO_TEXTO.titulo,
      fontWeight: '700',
    },
    dato: {
      color: c.textoSuave,
      fontSize: TAMANIO_TEXTO.normal,
    },
    destacado: {
      color: c.texto,
      fontSize: TAMANIO_TEXTO.normal,
      fontWeight: '600',
    },
  }),
);

function textoEspera(cantidad: number): string {
  if (cantidad === 0) return 'Nadie en lista de espera';
  return `${contar(cantidad, 'persona', 'personas')} en lista de espera`;
}

export function FichaLibro({ libro, disponibles, enEspera }: Props) {
  const estilos = useEstilos(hojas);

  return (
    <View style={estilos.ficha}>
      <Text style={estilos.titulo} accessibilityRole="header">
        {libro.titulo}
      </Text>
      <Text style={estilos.dato}>Autor: {libro.autor}</Text>
      <Text style={estilos.dato}>Año: {libro.anio}</Text>
      <Text style={estilos.dato}>ISBN: {libro.isbn}</Text>
      <Text style={estilos.destacado}>
        {disponibles > 0
          ? contar(disponibles, 'ejemplar disponible', 'ejemplares disponibles')
          : 'No hay ejemplares disponibles'}
      </Text>
      <Text style={estilos.destacado}>{textoEspera(enEspera)}</Text>
    </View>
  );
}
