import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { ESPACIO, RADIO, TAMANIO, TAMANIO_TEXTO } from '@/constants/tema';
import { useColores } from '@/hooks/useColores';
import { useEstilos } from '@/hooks/useEstilos';
import { crearHojas } from '@/lib/estilos';
import type { Aviso } from '@/types/biblioteca';

import { BotonIcono } from './BotonIcono';

type Props = {
  aviso: Aviso;
  onDescartar: (id: string) => void;
};

const hojas = crearHojas((c) =>
  StyleSheet.create({
    tarjeta: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: ESPACIO.md,
      paddingVertical: ESPACIO.sm,
      paddingLeft: ESPACIO.lg,
      paddingRight: ESPACIO.xs,
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

// Aviso dentro de la app: lo que se muestra cuando no hay permiso de notificaciones.
export function TarjetaAviso({ aviso, onDescartar }: Props) {
  const estilos = useEstilos(hojas);
  const colores = useColores();

  return (
    <View style={estilos.tarjeta} accessibilityLiveRegion="polite">
      <Ionicons name="notifications" size={TAMANIO.icono} color={colores.avisoTexto} />
      <Text style={estilos.texto}>{aviso.texto}</Text>
      <BotonIcono icono="close" etiqueta="Descartar aviso" onPress={() => onDescartar(aviso.id)} />
    </View>
  );
}
