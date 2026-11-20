import { StyleSheet, Text, View } from 'react-native';

import { USUARIO_ACTUAL } from '@/constants/biblioteca';
import { ESPACIO, RADIO, TAMANIO, TAMANIO_TEXTO } from '@/constants/tema';
import { useEstilos } from '@/hooks/useEstilos';
import { crearHojas } from '@/lib/estilos';
import { contar } from '@/lib/textos';
import type { Libro } from '@/types';
import type { LibroEnEspera } from '@/types/biblioteca';

import { Boton } from './Boton';

type Props = {
  item: LibroEnEspera;
  onEntregar: (libro: Libro) => void;
};

const hojas = crearHojas((c) =>
  StyleSheet.create({
    tarjeta: {
      gap: ESPACIO.sm,
      padding: ESPACIO.lg,
      borderRadius: RADIO.normal,
      borderWidth: TAMANIO.bordeFino,
      borderColor: c.borde,
      backgroundColor: c.superficie,
    },
    titulo: {
      color: c.texto,
      fontSize: TAMANIO_TEXTO.subtitulo,
      fontWeight: '600',
    },
    dato: {
      color: c.textoSuave,
      fontSize: TAMANIO_TEXTO.normal,
    },
  }),
);

export function FilaMostrador({ item, onEntregar }: Props) {
  const estilos = useEstilos(hojas);
  const frente =
    item.frente === USUARIO_ACTUAL ? 'Vos (la persona que usa esta app)' : item.frente;

  return (
    <View style={estilos.tarjeta}>
      <Text style={estilos.titulo}>{item.libro.titulo}</Text>
      <Text style={estilos.dato}>Al frente: {frente}</Text>
      <Text style={estilos.dato}>Esperan: {contar(item.cantidad, 'persona', 'personas')}</Text>
      <Boton
        titulo="Entregar al siguiente"
        icono="hand-right-outline"
        pista={`Entrega un ejemplar de ${item.libro.titulo} a la primera persona de la lista`}
        onPress={() => onEntregar(item.libro)}
      />
    </View>
  );
}
