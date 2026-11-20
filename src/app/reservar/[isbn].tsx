import { router, useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, Text } from 'react-native';

import { Boton } from '@/components/Boton';
import { EstadoMiReserva } from '@/components/EstadoMiReserva';
import { MensajeLibroInexistente } from '@/components/MensajeLibroInexistente';
import { DIAS_PRESTAMO } from '@/constants/biblioteca';
import { ESPACIO, TAMANIO_TEXTO } from '@/constants/tema';
import { useBiblioteca } from '@/hooks/useBiblioteca';
import { useEstilos } from '@/hooks/useEstilos';
import { useLibro } from '@/hooks/useLibro';
import { crearHojas } from '@/lib/estilos';
import { contar } from '@/lib/textos';
import type { Libro } from '@/types';

const hojas = crearHojas((c) =>
  StyleSheet.create({
    pantalla: {
      backgroundColor: c.fondo,
    },
    contenido: {
      gap: ESPACIO.lg,
      padding: ESPACIO.xl,
    },
    titulo: {
      color: c.texto,
      fontSize: TAMANIO_TEXTO.titulo,
      fontWeight: '700',
    },
    explicacion: {
      color: c.texto,
      fontSize: TAMANIO_TEXTO.subtitulo,
    },
  }),
);

export default function ConfirmarReserva() {
  const estilos = useEstilos(hojas);
  const { isbn } = useLocalSearchParams<{ isbn: string }>();
  const resultado = useLibro(isbn);
  const { estadoReserva, disponibles, personasEnEspera, reservar } = useBiblioteca();

  if (resultado.estado !== 'encontrado') {
    return <MensajeLibroInexistente motivo={resultado.estado} />;
  }

  const { libro } = resultado;
  const reserva = estadoReserva(libro.isbn);
  const hay = disponibles(libro);

  function confirmar(elegido: Libro) {
    reservar(elegido);
    // Vuelve a las pestañas y abre "Mis reservas": la confirmación no queda en el historial.
    router.dismissTo('/reservas');
  }

  if (reserva.tipo !== 'ninguna') {
    return (
      <ScrollView style={estilos.pantalla} contentContainerStyle={estilos.contenido}>
        <Text style={estilos.titulo}>{libro.titulo}</Text>
        <EstadoMiReserva reserva={reserva} />
        <Boton titulo="Ver mis reservas" onPress={() => router.dismissTo('/reservas')} />
      </ScrollView>
    );
  }

  return (
    <ScrollView style={estilos.pantalla} contentContainerStyle={estilos.contenido}>
      <Text style={estilos.titulo}>{libro.titulo}</Text>
      <Text style={estilos.explicacion}>
        {hay > 0
          ? `Hay ${contar(hay, 'ejemplar', 'ejemplares')} en el estante. Te lo prestamos por ${DIAS_PRESTAMO} días: retiralo en el mostrador.`
          : `No hay ejemplares disponibles. Vas a entrar a la lista de espera en la posición ${personasEnEspera(libro.isbn) + 1} y te avisamos cuando te toque.`}
      </Text>
      <Boton
        titulo={hay > 0 ? 'Confirmar préstamo' : 'Anotarme en la lista de espera'}
        icono="checkmark"
        onPress={() => confirmar(libro)}
      />
      <Boton titulo="Cancelar" variante="secundario" onPress={() => router.back()} />
    </ScrollView>
  );
}
