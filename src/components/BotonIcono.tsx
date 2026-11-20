import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet } from 'react-native';

import { OPACIDAD, RADIO, TAMANIO } from '@/constants/tema';
import { useColores } from '@/hooks/useColores';
import { useEstilos } from '@/hooks/useEstilos';
import { crearHojas } from '@/lib/estilos';
import type { NombreIcono } from '@/types/iconos';

type Props = {
  icono: NombreIcono;
  etiqueta: string; // obligatoria: es lo que lee el lector de pantalla
  onPress: () => void;
};

const hojas = crearHojas(() =>
  StyleSheet.create({
    boton: {
      minWidth: TAMANIO.areaTactilMinima,
      minHeight: TAMANIO.areaTactilMinima,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: RADIO.normal,
    },
    presionado: {
      opacity: OPACIDAD.presionado,
    },
  }),
);

export function BotonIcono({ icono, etiqueta, onPress }: Props) {
  const estilos = useEstilos(hojas);
  const colores = useColores();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={etiqueta}
      onPress={onPress}
      style={({ pressed }) => [estilos.boton, pressed && estilos.presionado]}>
      <Ionicons name={icono} size={TAMANIO.icono} color={colores.primario} />
    </Pressable>
  );
}
