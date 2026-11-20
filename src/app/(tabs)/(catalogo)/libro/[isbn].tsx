import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { ScrollView, StyleSheet } from 'react-native';

import { Boton } from '@/components/Boton';
import { EstadoMiReserva } from '@/components/EstadoMiReserva';
import { FichaLibro } from '@/components/FichaLibro';
import { MensajeLibroInexistente } from '@/components/MensajeLibroInexistente';
import { ESPACIO } from '@/constants/tema';
import { useBiblioteca } from '@/hooks/useBiblioteca';
import { useEstilos } from '@/hooks/useEstilos';
import { useLibro } from '@/hooks/useLibro';
import { crearHojas } from '@/lib/estilos';

const hojas = crearHojas((c) =>
  StyleSheet.create({
    pantalla: {
      backgroundColor: c.fondo,
    },
    contenido: {
      gap: ESPACIO.xl,
      padding: ESPACIO.lg,
    },
  }),
);

export default function DetalleLibro() {
  const estilos = useEstilos(hojas);
  const { isbn } = useLocalSearchParams<{ isbn: string }>();
  const resultado = useLibro(isbn);
  const { registrarVisto, disponibles, personasEnEspera, estadoReserva } = useBiblioteca();
  const libro = resultado.estado === 'encontrado' ? resultado.libro : null;

  // Cada vez que se abre un detalle, push en la Pila de recientes (el reductor ignora si ya está en el tope).
  useEffect(() => {
    if (libro) registrarVisto(libro.isbn);
  }, [libro, registrarVisto]);

  if (resultado.estado !== 'encontrado') {
    return <MensajeLibroInexistente motivo={resultado.estado} />;
  }

  const { libro: encontrado } = resultado;
  const reserva = estadoReserva(encontrado.isbn);

  return (
    <ScrollView style={estilos.pantalla} contentContainerStyle={estilos.contenido}>
      <Stack.Screen options={{ title: encontrado.titulo }} />
      <FichaLibro
        libro={encontrado}
        disponibles={disponibles(encontrado)}
        enEspera={personasEnEspera(encontrado.isbn)}
      />
      {reserva.tipo === 'ninguna' ? (
        <Boton
          titulo="Reservar"
          icono="bookmark-outline"
          onPress={() =>
            router.push({ pathname: '/reservar/[isbn]', params: { isbn: encontrado.isbn } })
          }
        />
      ) : (
        <>
          <EstadoMiReserva reserva={reserva} />
          <Boton
            titulo="Ver mis reservas"
            variante="secundario"
            onPress={() => router.navigate('/reservas')}
          />
        </>
      )}
    </ScrollView>
  );
}
