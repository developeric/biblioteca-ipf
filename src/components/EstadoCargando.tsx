import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { ESPACIO, TAMANIO_TEXTO } from '@/constants/tema';
import { useColores } from '@/hooks/useColores';
import { useEstilos } from '@/hooks/useEstilos';
import { crearHojas } from '@/lib/estilos';

type Props = {
  mensaje: string;
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

export function EstadoCargando({ mensaje }: Props) {
  const estilos = useEstilos(hojas);
  const colores = useColores();

  return (
    <View style={estilos.contenedor} accessibilityRole="progressbar" accessibilityLabel={mensaje}>
      <ActivityIndicator size="large" color={colores.primario} />
      <Text style={estilos.texto}>{mensaje}</Text>
    </View>
  );
}
