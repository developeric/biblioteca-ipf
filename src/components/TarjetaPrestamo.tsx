import { StyleSheet, Switch, Text, View } from 'react-native';

import { ESPACIO, RADIO, TAMANIO, TAMANIO_TEXTO } from '@/constants/tema';
import { useColores } from '@/hooks/useColores';
import { useEstilos } from '@/hooks/useEstilos';
import { crearHojas } from '@/lib/estilos';
import { formatearFecha } from '@/lib/fechas';
import type { Libro } from '@/types';
import type { Prestamo } from '@/types/biblioteca';

import { Boton } from './Boton';

type Props = {
  libro: Libro;
  prestamo: Prestamo;
  onCambiarRecordatorio: (libro: Libro, activo: boolean) => void;
  onDevolver: (isbn: string) => void;
};

const hojas = crearHojas((c) =>
  StyleSheet.create({
    tarjeta: {
      gap: ESPACIO.sm,
      padding: ESPACIO.lg,
      borderRadius: RADIO.normal,
      borderWidth: TAMANIO.bordeFino,
      borderColor: c.borde,
      backgroundColor: c.superficie,
    },
    etiqueta: {
      color: c.exito,
      fontSize: TAMANIO_TEXTO.chico,
      fontWeight: '700',
      textTransform: 'uppercase',
    },
    titulo: {
      color: c.texto,
      fontSize: TAMANIO_TEXTO.subtitulo,
      fontWeight: '600',
    },
    dato: {
      color: c.textoSuave,
      fontSize: TAMANIO_TEXTO.normal,
    },
    fila: {
      minHeight: TAMANIO.areaTactilMinima,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    textoFila: {
      color: c.texto,
      fontSize: TAMANIO_TEXTO.normal,
    },
  }),
);

export function TarjetaPrestamo({ libro, prestamo, onCambiarRecordatorio, onDevolver }: Props) {
  const estilos = useEstilos(hojas);
  const colores = useColores();
  const recordatorioActivo = prestamo.notificacionId !== null;

  return (
    <View style={estilos.tarjeta}>
      <Text style={estilos.etiqueta}>Préstamo</Text>
      <Text style={estilos.titulo}>{libro.titulo}</Text>
      <Text style={estilos.dato}>Devolución: {formatearFecha(prestamo.vence)}</Text>
      <View style={estilos.fila}>
        <Text style={estilos.textoFila} nativeID={`recordarme-${libro.isbn}`}>
          Recordarme
        </Text>
        <Switch
          value={recordatorioActivo}
          onValueChange={(activo) => onCambiarRecordatorio(libro, activo)}
          trackColor={{ true: colores.primario, false: colores.borde }}
          accessibilityLabel={`Recordarme la devolución de ${libro.titulo}`}
          accessibilityLabelledBy={`recordarme-${libro.isbn}`}
        />
      </View>
      <Boton
        titulo="Devolver"
        icono="return-down-back"
        variante="peligro"
        onPress={() => onDevolver(libro.isbn)}
      />
    </View>
  );
}
