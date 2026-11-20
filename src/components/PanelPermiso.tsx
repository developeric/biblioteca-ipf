import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { ESPACIO, RADIO, TAMANIO, TAMANIO_TEXTO } from '@/constants/tema';
import { useColores } from '@/hooks/useColores';
import { useEstilos } from '@/hooks/useEstilos';
import { crearHojas } from '@/lib/estilos';
import type { NombreIcono } from '@/types/iconos';

import { Boton } from './Boton';

type Props = {
  icono: NombreIcono;
  mensaje: string;
  textoBoton: string;
  onPress: () => void;
};

const hojas = crearHojas((c) =>
  StyleSheet.create({
    panel: {
      alignItems: 'center',
      gap: ESPACIO.md,
      padding: ESPACIO.xl,
      borderRadius: RADIO.grande,
      borderWidth: TAMANIO.bordeFino,
      borderColor: c.borde,
      backgroundColor: c.superficie,
    },
    texto: {
      color: c.texto,
      fontSize: TAMANIO_TEXTO.normal,
      textAlign: 'center',
    },
  }),
);

export function PanelPermiso({ icono, mensaje, textoBoton, onPress }: Props) {
  const estilos = useEstilos(hojas);
  const colores = useColores();

  return (
    <View style={estilos.panel}>
      <Ionicons name={icono} size={TAMANIO.iconoGrande} color={colores.textoSuave} />
      <Text style={estilos.texto}>{mensaje}</Text>
      <Boton titulo={textoBoton} onPress={onPress} />
    </View>
  );
}
