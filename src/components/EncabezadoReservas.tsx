import { StyleSheet, Text, View } from 'react-native';

import { TEXTOS_PERMISO } from '@/constants/permisos';
import { ESPACIO, TAMANIO_TEXTO } from '@/constants/tema';
import { useEstilos } from '@/hooks/useEstilos';
import { crearHojas } from '@/lib/estilos';
import type { Aviso, EstadoPermiso } from '@/types/biblioteca';

import { TarjetaAviso } from './TarjetaAviso';

type Props = {
  avisos: Aviso[];
  permisoNotificaciones: EstadoPermiso;
  onDescartarAviso: (id: string) => void;
};

const hojas = crearHojas((c) =>
  StyleSheet.create({
    contenedor: {
      gap: ESPACIO.md,
      paddingBottom: ESPACIO.sm,
    },
    estadoPermiso: {
      color: c.textoSuave,
      fontSize: TAMANIO_TEXTO.chico,
    },
  }),
);

const TEXTO_CONCEDIDO = 'Notificaciones activadas: te avisamos aunque la app esté cerrada.';

export function EncabezadoReservas({ avisos, permisoNotificaciones, onDescartarAviso }: Props) {
  const estilos = useEstilos(hojas);
  const textos = TEXTOS_PERMISO.notificaciones;
  const textoPermiso: Record<EstadoPermiso, string> = {
    cargando: '',
    concedido: TEXTO_CONCEDIDO,
    preguntable: textos.preguntable,
    bloqueado: textos.bloqueado,
  };

  return (
    <View style={estilos.contenedor}>
      {avisos.map((aviso) => (
        <TarjetaAviso key={aviso.id} aviso={aviso} onDescartar={onDescartarAviso} />
      ))}
      {permisoNotificaciones === 'cargando' ? null : (
        <Text style={estilos.estadoPermiso}>{textoPermiso[permisoNotificaciones]}</Text>
      )}
    </View>
  );
}
