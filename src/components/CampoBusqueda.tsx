import { StyleSheet, TextInput } from 'react-native';

import { ESPACIO, RADIO, TAMANIO, TAMANIO_TEXTO } from '@/constants/tema';
import { useColores } from '@/hooks/useColores';
import { useEstilos } from '@/hooks/useEstilos';
import { crearHojas } from '@/lib/estilos';

type Props = {
  valorInicial: string;
  onCambiar: (texto: string) => void;
};

const hojas = crearHojas((c) =>
  StyleSheet.create({
    campo: {
      minHeight: TAMANIO.areaTactilMinima,
      marginBottom: ESPACIO.sm,
      paddingHorizontal: ESPACIO.md,
      borderRadius: RADIO.normal,
      borderWidth: TAMANIO.bordeFino,
      borderColor: c.borde,
      backgroundColor: c.superficie,
      color: c.texto,
      fontSize: TAMANIO_TEXTO.normal,
    },
  }),
);

// No controlado: el texto vive en la URL (?q=), así que no hay una segunda copia en el estado.
export function CampoBusqueda({ valorInicial, onCambiar }: Props) {
  const estilos = useEstilos(hojas);
  const colores = useColores();

  return (
    <TextInput
      style={estilos.campo}
      defaultValue={valorInicial}
      onChangeText={onCambiar}
      placeholder="Título o autor"
      placeholderTextColor={colores.textoSuave}
      accessibilityLabel="Buscar por título o autor"
      autoCorrect={false}
      autoFocus={valorInicial === ''}
      returnKeyType="search"
      clearButtonMode="while-editing"
    />
  );
}
