import { router } from 'expo-router';
import { FlatList, StyleSheet } from 'react-native';

import { EncabezadoReservas } from '@/components/EncabezadoReservas';
import { Enlace } from '@/components/Enlace';
import { EstadoVacio } from '@/components/EstadoVacio';
import { TarjetaEspera } from '@/components/TarjetaEspera';
import { TarjetaPrestamo } from '@/components/TarjetaPrestamo';
import { ESPACIO } from '@/constants/tema';
import { useBiblioteca } from '@/hooks/useBiblioteca';
import { useEstilos } from '@/hooks/useEstilos';
import { usePermiso } from '@/hooks/usePermiso';
import { buscarLibroPorIsbn } from '@/lib/catalogo';
import { crearHojas } from '@/lib/estilos';
import type { Libro } from '@/types';
import type { ItemReserva } from '@/types/biblioteca';

const hojas = crearHojas((c) =>
  StyleSheet.create({
    lista: {
      backgroundColor: c.fondo,
    },
    contenido: {
      padding: ESPACIO.lg,
      gap: ESPACIO.md,
    },
  }),
);

export default function MisReservas() {
  const estilos = useEstilos(hojas);
  const {
    prestamos,
    misEsperas,
    avisos,
    descartarAviso,
    devolver,
    activarRecordatorio,
    desactivarRecordatorio,
  } = useBiblioteca();
  // Solo consulta el estado (para el texto de arriba); no pide nada.
  const { estado: permisoNotificaciones } = usePermiso('notificaciones');

  const items: ItemReserva[] = [];
  for (const prestamo of prestamos) {
    const libro = buscarLibroPorIsbn(prestamo.isbn);
    if (libro) items.push({ tipo: 'prestamo', libro, prestamo });
  }
  for (const espera of misEsperas) {
    const libro = buscarLibroPorIsbn(espera.isbn);
    if (libro) items.push({ tipo: 'espera', libro, posicion: espera.posicion });
  }

  // El permiso se pide únicamente acá, al activar "Recordarme" (con la pantalla previa).
  async function cambiarRecordatorio(libro: Libro, activo: boolean) {
    if (!activo) {
      await desactivarRecordatorio(libro.isbn);
      return;
    }
    const programado = await activarRecordatorio(libro);
    if (!programado) {
      router.push({
        pathname: '/permisos/[recurso]',
        params: { recurso: 'notificaciones', isbn: libro.isbn },
      });
    }
  }

  return (
    <FlatList
      style={estilos.lista}
      contentContainerStyle={estilos.contenido}
      data={items}
      keyExtractor={(item) => item.libro.isbn}
      renderItem={({ item }) =>
        item.tipo === 'prestamo' ? (
          <TarjetaPrestamo
            libro={item.libro}
            prestamo={item.prestamo}
            onCambiarRecordatorio={cambiarRecordatorio}
            onDevolver={devolver}
          />
        ) : (
          <TarjetaEspera libro={item.libro} posicion={item.posicion} />
        )
      }
      ListHeaderComponent={
        <EncabezadoReservas
          avisos={avisos}
          permisoNotificaciones={permisoNotificaciones}
          onDescartarAviso={descartarAviso}
        />
      }
      ListEmptyComponent={
        <EstadoVacio icono="bookmarks-outline" mensaje="Todavía no reservaste ningún libro.">
          <Enlace href="/" texto="Ir al catálogo" />
        </EstadoVacio>
      }
    />
  );
}
