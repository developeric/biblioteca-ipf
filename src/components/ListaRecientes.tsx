import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ESPACIO, OPACIDAD, RADIO, TAMANIO, TAMANIO_TEXTO } from '@/constants/tema';
import { useBiblioteca } from '@/hooks/useBiblioteca';
import { useEstilos } from '@/hooks/useEstilos';
import { buscarLibroPorIsbn } from '@/lib/catalogo';
import { crearHojas } from '@/lib/estilos';
import type { Libro } from '@/types';

const hojas = crearHojas((c) =>
  StyleSheet.create({
    seccion: {
      gap: ESPACIO.sm,
    },
    titulo: {
      color: c.texto,
      fontSize: TAMANIO_TEXTO.subtitulo,
      fontWeight: '700',
    },
    vacio: {
      color: c.textoSuave,
      fontSize: TAMANIO_TEXTO.chico,
    },
    item: {
      minHeight: TAMANIO.areaTactilMinima,
      justifyContent: 'center',
      paddingHorizontal: ESPACIO.md,
      borderRadius: RADIO.normal,
      borderWidth: TAMANIO.bordeFino,
      borderColor: c.borde,
      backgroundColor: c.superficie,
    },
    presionado: {
      opacity: OPACIDAD.presionado,
    },
    textoItem: {
      color: c.primario,
      fontSize: TAMANIO_TEXTO.normal,
    },
  }),
);

// "Vistos recientemente": los 3 del tope de la Pila, del más reciente al más antiguo.
export function ListaRecientes() {
  const estilos = useEstilos(hojas);
  const { recientes } = useBiblioteca();
  const libros = recientes
    .map((isbn) => buscarLibroPorIsbn(isbn))
    .filter((libro): libro is Libro => libro !== undefined);

  return (
    <View style={estilos.seccion}>
      <Text style={estilos.titulo} accessibilityRole="header">
        Vistos recientemente
      </Text>
      {libros.length === 0 ? (
        <Text style={estilos.vacio}>Todavía no abriste ningún libro.</Text>
      ) : (
        libros.map((libro) => (
          <Pressable
            key={libro.isbn}
            accessibilityRole="button"
            accessibilityHint="Abre la ficha del libro"
            onPress={() => router.push({ pathname: '/libro/[isbn]', params: { isbn: libro.isbn } })}
            style={({ pressed }) => [estilos.item, pressed && estilos.presionado]}>
            <Text style={estilos.textoItem} numberOfLines={1}>
              {libro.titulo}
            </Text>
          </Pressable>
        ))
      )}
    </View>
  );
}
