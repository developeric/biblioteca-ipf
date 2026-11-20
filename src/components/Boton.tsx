import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text } from 'react-native';

import { ESPACIO, OPACIDAD, RADIO, TAMANIO, TAMANIO_TEXTO } from '@/constants/tema';
import { useColores } from '@/hooks/useColores';
import { useEstilos } from '@/hooks/useEstilos';
import { crearHojas } from '@/lib/estilos';
import type { NombreIcono } from '@/types/iconos';

type Variante = 'primario' | 'secundario' | 'peligro';

type Props = {
  titulo: string;
  onPress: () => void;
  variante?: Variante;
  icono?: NombreIcono;
  deshabilitado?: boolean;
  pista?: string;
};

const hojas = crearHojas((c) =>
  StyleSheet.create({
    base: {
      minHeight: TAMANIO.areaTactilMinima,
      minWidth: TAMANIO.areaTactilMinima,
      paddingHorizontal: ESPACIO.lg,
      paddingVertical: ESPACIO.sm,
      borderRadius: RADIO.normal,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: ESPACIO.sm,
      borderWidth: TAMANIO.bordeFino,
    },
    primario: {
      backgroundColor: c.primario,
      borderColor: c.primario,
    },
    secundario: {
      backgroundColor: c.superficie,
      borderColor: c.primario,
    },
    peligro: {
      backgroundColor: c.superficie,
      borderColor: c.peligro,
    },
    deshabilitado: {
      backgroundColor: c.superficie,
      borderColor: c.deshabilitado,
    },
    presionado: {
      opacity: OPACIDAD.presionado,
    },
    texto: {
      fontSize: TAMANIO_TEXTO.normal,
      fontWeight: '600',
    },
    textoprimario: {
      color: c.textoSobrePrimario,
    },
    textosecundario: {
      color: c.primario,
    },
    textopeligro: {
      color: c.peligro,
    },
    textoDeshabilitado: {
      color: c.deshabilitado,
    },
  }),
);

export function Boton({
  titulo,
  onPress,
  variante = 'primario',
  icono,
  deshabilitado = false,
  pista,
}: Props) {
  const estilos = useEstilos(hojas);
  const colores = useColores();
  const colorPorVariante: Record<Variante, string> = {
    primario: colores.textoSobrePrimario,
    secundario: colores.primario,
    peligro: colores.peligro,
  };
  const colorTexto = deshabilitado ? colores.deshabilitado : colorPorVariante[variante];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityHint={pista}
      accessibilityState={{ disabled: deshabilitado }}
      disabled={deshabilitado}
      onPress={onPress}
      style={({ pressed }) => [
        estilos.base,
        deshabilitado ? estilos.deshabilitado : estilos[variante],
        pressed && estilos.presionado,
      ]}>
      {icono ? <Ionicons name={icono} size={TAMANIO.icono} color={colorTexto} /> : null}
      <Text
        style={[
          estilos.texto,
          deshabilitado ? estilos.textoDeshabilitado : estilos[`texto${variante}`],
        ]}>
        {titulo}
      </Text>
    </Pressable>
  );
}
