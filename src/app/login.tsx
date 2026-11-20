import { useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, type TextInputInstance } from 'react-native';

import { Boton } from '@/components/Boton';
import { ESPACIO, RADIO, TAMANIO, TAMANIO_TEXTO } from '@/constants/tema';
import { useBiblioteca } from '@/hooks/useBiblioteca';
import { useColores } from '@/hooks/useColores';
import { useEstilos } from '@/hooks/useEstilos';
import { crearHojas } from '@/lib/estilos';

const hojas = crearHojas((c) =>
  StyleSheet.create({
    pantalla: {
      backgroundColor: c.fondo,
    },
    contenido: {
      gap: ESPACIO.md,
      padding: ESPACIO.xl,
    },
    explicacion: {
      color: c.textoSuave,
      fontSize: TAMANIO_TEXTO.normal,
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
      fontSize: TAMANIO_TEXTO.normal,
    },
  }),
);

export default function Login() {
  const estilos = useEstilos(hojas);
  const colores = useColores();
  const { iniciarSesion } = useBiblioteca();
  const [usuario, setUsuario] = useState('');
  const [clave, setClave] = useState('');
  const [error, setError] = useState<string | null>(null);
  const campoClave = useRef<TextInputInstance>(null);

  // Si los datos son correctos, Stack.Protected quita esta pantalla: el login se cierra solo.
  function ingresar() {
    if (iniciarSesion(usuario, clave)) return;
    setError('Usuario o clave incorrectos. Revisalos e intentá de nuevo.');
    setClave('');
    campoClave.current?.focus();
  }

  return (
    <ScrollView
      style={estilos.pantalla}
      contentContainerStyle={estilos.contenido}
      keyboardShouldPersistTaps="handled">
      <Text style={estilos.explicacion}>
        Solo para el personal de la biblioteca: desde el mostrador se entregan los libros
        reservados.
      </Text>
      <Text style={estilos.etiqueta} nativeID="etiqueta-usuario">
        Usuario
      </Text>
      <TextInput
        style={estilos.campo}
        value={usuario}
        onChangeText={setUsuario}
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="username"
        returnKeyType="next"
        onSubmitEditing={() => campoClave.current?.focus()}
        placeholderTextColor={colores.textoSuave}
        accessibilityLabel="Usuario"
        accessibilityLabelledBy="etiqueta-usuario"
      />
      <Text style={estilos.etiqueta} nativeID="etiqueta-clave">
        Clave
      </Text>
      <TextInput
        ref={campoClave}
        style={estilos.campo}
        value={clave}
        onChangeText={setClave}
        secureTextEntry
        autoComplete="password"
        returnKeyType="go"
        onSubmitEditing={ingresar}
        accessibilityLabel="Clave"
        accessibilityLabelledBy="etiqueta-clave"
      />
      {error ? (
        <Text style={estilos.error} accessibilityLiveRegion="assertive">
          {error}
        </Text>
      ) : null}
      <Boton titulo="Ingresar" icono="log-in-outline" onPress={ingresar} />
    </ScrollView>
  );
}
