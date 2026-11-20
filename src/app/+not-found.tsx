import { usePathname } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { Enlace } from '@/components/Enlace';
import { EstadoVacio } from '@/components/EstadoVacio';
import { ESPACIO, TAMANIO_TEXTO } from '@/constants/tema';
import { useEstilos } from '@/hooks/useEstilos';
import { crearHojas } from '@/lib/estilos';

const hojas = crearHojas((c) =>
  StyleSheet.create({
    pantalla: {
      flex: 1,
      justifyContent: 'center',
      padding: ESPACIO.lg,
      backgroundColor: c.fondo,
    },
    ruta: {
      color: c.texto,
      fontSize: TAMANIO_TEXTO.normal,
      fontWeight: '700',
      textAlign: 'center',
    },
  }),
);

export default function PaginaNoEncontrada() {
  const estilos = useEstilos(hojas);
  const ruta = usePathname();

  return (
    <View style={estilos.pantalla}>
      <EstadoVacio icono="help-circle-outline" mensaje="No encontramos esta página:">
        <Text style={estilos.ruta} selectable>
          {ruta}
        </Text>
      </EstadoVacio>
      <Enlace href="/" texto="Ir al catálogo" />
    </View>
  );
}
