import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { ESPACIO, TAMANIO, TAMANIO_TEXTO } from '@/constants/tema';
import { useColores } from '@/hooks/useColores';
import { useEstilos } from '@/hooks/useEstilos';
import { crearHojas } from '@/lib/estilos';

import { Boton } from './Boton';

type Props = {
  mensaje: string;
  textoAccion: string;
  onAccion: () => void;
};

const hojas = crearHojas((c) =>
  StyleSheet.create({
    contenedor: {
      alignItems: 'center',
      gap: ESPACIO.md,
      padding: ESPACIO.xl,
    },
    texto: {
      color: c.texto,
      fontSize: TAMANIO_TEXTO.normal,
      textAlign: 'center',
    },
  }),
);

export function EstadoError({ mensaje, textoAccion, onAccion }: Props) {
  const estilos = useEstilos(hojas);
  const colores = useColores();

  return (
    <View style={estilos.contenedor} accessibilityLiveRegion="polite">
      <Ionicons name="cloud-offline-outline" size={TAMANIO.iconoGrande} color={colores.peligro} />
      <Text style={estilos.texto}>{mensaje}</Text>
      <Boton titulo={textoAccion} icono="refresh" onPress={onAccion} />
    </View>
  );
}
