import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { ESPACIO, RADIO, TAMANIO, TAMANIO_TEXTO } from '@/constants/tema';
import { useColores } from '@/hooks/useColores';
import { useEstilos } from '@/hooks/useEstilos';
import { crearHojas } from '@/lib/estilos';
import type { Aviso } from '@/types/biblioteca';

import { Boton } from './Boton';

type Props = {
  aviso: Aviso;
  onDescartar: (id: string) => void;
};

const hojas = crearHojas((c) =>
  StyleSheet.create({
    tarjeta: {
      gap: ESPACIO.md,
      padding: ESPACIO.lg,
      borderRadius: RADIO.normal,
      backgroundColor: c.avisoFondo,
    },
    fila: {
      flexDirection: 'row',
      gap: ESPACIO.md,
    },
    texto: {
      flex: 1,
      color: c.avisoTexto,
      fontSize: TAMANIO_TEXTO.normal,
    },
  }),
);

// Aviso dentro de la app: lo que se muestra cuando no hay permiso de notificaciones.
export function TarjetaAviso({ aviso, onDescartar }: Props) {
  const estilos = useEstilos(hojas);
  const colores = useColores();

  return (
    <View style={estilos.tarjeta} accessibilityLiveRegion="polite">
      <View style={estilos.fila}>
        <Ionicons name="notifications" size={TAMANIO.icono} color={colores.avisoTexto} />
        <Text style={estilos.texto}>{aviso.texto}</Text>
      </View>
      <Boton titulo="Entendido" variante="secundario" onPress={() => onDescartar(aviso.id)} />
    </View>
  );
}
