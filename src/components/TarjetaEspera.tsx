import { StyleSheet, Text, View } from 'react-native';

import { ESPACIO, RADIO, TAMANIO, TAMANIO_TEXTO } from '@/constants/tema';
import { useEstilos } from '@/hooks/useEstilos';
import { crearHojas } from '@/lib/estilos';
import { contar } from '@/lib/textos';
import type { Libro } from '@/types';

type Props = {
  libro: Libro;
  posicion: number;
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
    etiqueta: {
      color: c.avisoTexto,
      fontSize: TAMANIO_TEXTO.chico,
      fontWeight: '700',
      textTransform: 'uppercase',
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

export function TarjetaEspera({ libro, posicion }: Props) {
  const estilos = useEstilos(hojas);
  const delante = posicion - 1;

  return (
    <View style={estilos.tarjeta}>
      <Text style={estilos.etiqueta}>En lista de espera</Text>
      <Text style={estilos.titulo}>{libro.titulo}</Text>
      <Text style={estilos.dato}>Tu posición: {posicion}</Text>
      <Text style={estilos.dato}>
        {delante === 0
          ? 'Sos la próxima persona en recibirlo.'
          : `Antes que vos hay ${contar(delante, 'persona', 'personas')}.`}
      </Text>
    </View>
  );
}
