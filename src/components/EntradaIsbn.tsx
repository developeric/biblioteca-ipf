import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { ESPACIO, RADIO, TAMANIO, TAMANIO_TEXTO } from '@/constants/tema';
import { useColores } from '@/hooks/useColores';
import { useEstilos } from '@/hooks/useEstilos';
import { buscarLibroPorIsbn, esIsbnValido, normalizarIsbn } from '@/lib/catalogo';
import { crearHojas } from '@/lib/estilos';

import { Boton } from './Boton';

type Props = {
  onIsbnEncontrado: (isbn: string) => void;
};

const hojas = crearHojas((c) =>
  StyleSheet.create({
    contenedor: {
      gap: ESPACIO.sm,
    },
    etiqueta: {
      color: c.texto,
      fontSize: TAMANIO_TEXTO.normal,
      fontWeight: '600',
    },
    campo: {
      minHeight: TAMANIO.areaTactilMinima,
      paddingHorizontal: ESPACIO.md,
      borderRadius: RADIO.normal,
      borderWidth: TAMANIO.bordeFino,
      borderColor: c.borde,
      backgroundColor: c.superficie,
      color: c.texto,
      fontSize: TAMANIO_TEXTO.normal,
    },
    error: {
      color: c.peligro,
      fontSize: TAMANIO_TEXTO.chico,
    },
  }),
);

// Siempre disponible: es la alternativa cuando no hay cámara.
export function EntradaIsbn({ onIsbnEncontrado }: Props) {
  const estilos = useEstilos(hojas);
  const colores = useColores();
  const [texto, setTexto] = useState('');
  const [error, setError] = useState<string | null>(null);

  function abrir() {
    const isbn = normalizarIsbn(texto);
    if (!esIsbnValido(isbn)) {
      setError('El ISBN tiene que tener 13 números (los guiones no cuentan).');
      return;
    }
    if (!buscarLibroPorIsbn(isbn)) {
      setError(`No encontramos ningún libro con el ISBN ${isbn} en el catálogo.`);
      return;
    }
    setError(null);
    onIsbnEncontrado(isbn);
  }

  return (
    <View style={estilos.contenedor}>
      <Text style={estilos.etiqueta} nativeID="etiqueta-isbn">
        Escribir el ISBN a mano
      </Text>
      <TextInput
        style={estilos.campo}
        value={texto}
        onChangeText={setTexto}
        onSubmitEditing={abrir}
        placeholder="Ej.: 978-0-13-235088-4"
        placeholderTextColor={colores.textoSuave}
        keyboardType="numbers-and-punctuation"
        returnKeyType="go"
        accessibilityLabelledBy="etiqueta-isbn"
        accessibilityLabel="ISBN del libro"
      />
      {error ? (
        <Text style={estilos.error} accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : null}
      <Boton titulo="Abrir libro" variante="secundario" onPress={abrir} />
    </View>
  );
}
