import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { ESPACIO, RADIO, TAMANIO, TAMANIO_TEXTO } from '@/constants/tema';
import { useColores } from '@/hooks/useColores';
import { useEstilos } from '@/hooks/useEstilos';
import { crearHojas } from '@/lib/estilos';
import { formatearFecha } from '@/lib/fechas';
import type { EstadoReserva } from '@/types/biblioteca';

type Props = {
  reserva: Exclude<EstadoReserva, { tipo: 'ninguna' }>;
};

const hojas = crearHojas((c) =>
  StyleSheet.create({
    caja: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: ESPACIO.md,
      padding: ESPACIO.md,
      borderRadius: RADIO.normal,
      backgroundColor: c.avisoFondo,
    },
    texto: {
      flex: 1,
      color: c.avisoTexto,
      fontSize: TAMANIO_TEXTO.normal,
    },
  }),
);

export function EstadoMiReserva({ reserva }: Props) {
  const estilos = useEstilos(hojas);
  const colores = useColores();
  const texto =
    reserva.tipo === 'prestamo'
      ? `Ya tenés este libro en préstamo. Lo devolvés el ${formatearFecha(reserva.prestamo.vence)}.`
      : `Ya estás en la lista de espera de este libro, en la posición ${reserva.posicion}.`;

  return (
    <View style={estilos.caja} accessibilityRole="text">
      <Ionicons name="checkmark-circle-outline" size={TAMANIO.icono} color={colores.avisoTexto} />
      <Text style={estilos.texto}>{texto}</Text>
    </View>
  );
}
