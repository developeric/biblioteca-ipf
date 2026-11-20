import { Stack } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { ESPACIO } from '@/constants/tema';
import { useEstilos } from '@/hooks/useEstilos';
import { crearHojas } from '@/lib/estilos';

import { Enlace } from './Enlace';
import { EstadoVacio } from './EstadoVacio';

type Props = {
  motivo: 'invalido' | 'inexistente';
};

const hojas = crearHojas((c) =>
  StyleSheet.create({
    pantalla: {
      flex: 1,
      justifyContent: 'center',
      padding: ESPACIO.lg,
      backgroundColor: c.fondo,
    },
  }),
);

const MENSAJES: Record<Props['motivo'], string> = {
  invalido: 'Este enlace no corresponde a un libro del catálogo: el ISBN tiene que tener 13 números.',
  inexistente: 'Este enlace no corresponde a un libro del catálogo.',
};

export function MensajeLibroInexistente({ motivo }: Props) {
  const estilos = useEstilos(hojas);

  return (
    <View style={estilos.pantalla}>
      <Stack.Screen options={{ title: 'Libro no encontrado' }} />
      <EstadoVacio icono="alert-circle-outline" mensaje={MENSAJES[motivo]}>
        <Enlace href="/" texto="Ir al catálogo" />
      </EstadoVacio>
    </View>
  );
}
