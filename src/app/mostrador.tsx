import { router } from 'expo-router';
import { useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';

import { Boton } from '@/components/Boton';
import { EstadoVacio } from '@/components/EstadoVacio';
import { FilaMostrador } from '@/components/FilaMostrador';
import { USUARIO_ACTUAL } from '@/constants/biblioteca';
import { ESPACIO, RADIO, TAMANIO_TEXTO } from '@/constants/tema';
import { useBiblioteca } from '@/hooks/useBiblioteca';
import { useEstilos } from '@/hooks/useEstilos';
import { crearHojas } from '@/lib/estilos';
import type { Libro } from '@/types';

const hojas = crearHojas((c) =>
  StyleSheet.create({
    lista: {
      backgroundColor: c.fondo,
    },
    contenido: {
      padding: ESPACIO.lg,
      gap: ESPACIO.md,
    },
    mensaje: {
      padding: ESPACIO.md,
      borderRadius: RADIO.normal,
      backgroundColor: c.avisoFondo,
      color: c.avisoTexto,
      fontSize: TAMANIO_TEXTO.normal,
    },
    pie: {
      paddingTop: ESPACIO.lg,
    },
  }),
);

function textoEntrega(libro: Libro, persona: string | null): string {
  if (persona === null) return 'No hay nadie esperando este libro.';
  if (persona === USUARIO_ACTUAL) {
    return `Entregaste “${libro.titulo}” a la persona que usa esta app: le llega el aviso.`;
  }
  return `Entregaste “${libro.titulo}” a ${persona}.`;
}

export default function Mostrador() {
  const estilos = useEstilos(hojas);
  const { librosEnEspera, entregarAlSiguiente, cerrarSesion } = useBiblioteca();
  const [mensaje, setMensaje] = useState<string | null>(null);

  // Simula que se devolvió un ejemplar: se desencola a la persona del frente.
  async function entregar(libro: Libro) {
    const persona = await entregarAlSiguiente(libro);
    setMensaje(textoEntrega(libro, persona));
  }

  // Primero vuelve al Catálogo y después cierra la sesión: Stack.Protected quita el mostrador del
  // historial sin tener que redirigir (una redirección haría replace y duplicaría las pestañas).
  function salir() {
    router.dismissTo('/');
    cerrarSesion();
  }

  return (
    <FlatList
      style={estilos.lista}
      contentContainerStyle={estilos.contenido}
      data={librosEnEspera}
      keyExtractor={(item) => item.libro.isbn}
      renderItem={({ item }) => <FilaMostrador item={item} onEntregar={entregar} />}
      ListHeaderComponent={
        mensaje ? (
          <Text style={estilos.mensaje} accessibilityLiveRegion="polite">
            {mensaje}
          </Text>
        ) : undefined
      }
      ListEmptyComponent={
        <EstadoVacio icono="checkmark-done-outline" mensaje="No hay libros con lista de espera." />
      }
      ListFooterComponent={
        <View style={estilos.pie}>
          <Boton
            titulo="Cerrar sesión"
            icono="log-out-outline"
            variante="peligro"
            onPress={salir}
          />
        </View>
      }
    />
  );
}
