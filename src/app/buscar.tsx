import { router, useLocalSearchParams } from 'expo-router';
import { FlatList, StyleSheet } from 'react-native';

import { CampoBusqueda } from '@/components/CampoBusqueda';
import { EstadoLista } from '@/components/EstadoLista';
import { EstadoVacio } from '@/components/EstadoVacio';
import { FilaLibro } from '@/components/FilaLibro';
import { ESPACIO } from '@/constants/tema';
import { useBiblioteca } from '@/hooks/useBiblioteca';
import { useBusqueda } from '@/hooks/useBusqueda';
import { useEstilos } from '@/hooks/useEstilos';
import { crearHojas } from '@/lib/estilos';

const hojas = crearHojas((c) =>
  StyleSheet.create({
    lista: {
      backgroundColor: c.fondo,
    },
    contenido: {
      padding: ESPACIO.lg,
      gap: ESPACIO.sm,
    },
  }),
);

export default function Buscar() {
  const estilos = useEstilos(hojas);
  const { q = '' } = useLocalSearchParams<{ q?: string }>();
  const { consulta, resultados, cargando, error, reintentar } = useBusqueda(q);
  const { disponibles } = useBiblioteca();

  return (
    <FlatList
      style={estilos.lista}
      contentContainerStyle={estilos.contenido}
      keyboardShouldPersistTaps="handled"
      data={resultados}
      keyExtractor={(libro) => libro.isbn}
      renderItem={({ item }) => <FilaLibro libro={item} disponibles={disponibles(item)} />}
      ListHeaderComponent={
        // setParams cambia ?q= en la ruta actual sin apilar pantallas nuevas.
        <CampoBusqueda valorInicial={q} onCambiar={(texto) => router.setParams({ q: texto })} />
      }
      ListEmptyComponent={
        consulta === '' ? (
          <EstadoVacio icono="search" mensaje="Escribí un título o un autor para buscar." />
        ) : (
          <EstadoLista
            cargando={cargando}
            error={error}
            onReintentar={reintentar}
            mensajeCargando="Buscando…"
            mensajeVacio={`No encontramos libros para “${consulta}”.`}
          />
        )
      }
    />
  );
}
