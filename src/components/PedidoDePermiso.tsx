import { Ionicons } from '@expo/vector-icons';
import { router, Stack } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { TEXTOS_PERMISO } from '@/constants/permisos';
import { ESPACIO, TAMANIO, TAMANIO_TEXTO } from '@/constants/tema';
import { useBiblioteca } from '@/hooks/useBiblioteca';
import { useColores } from '@/hooks/useColores';
import { useEstilos } from '@/hooks/useEstilos';
import { usePermiso } from '@/hooks/usePermiso';
import { buscarLibroPorIsbn } from '@/lib/catalogo';
import { crearHojas } from '@/lib/estilos';
import type { Recurso } from '@/types/biblioteca';

import { Boton } from './Boton';
import { EstadoCargando } from './EstadoCargando';

type Props = {
  recurso: Recurso;
  isbn?: string; // libro cuyo recordatorio se quiere activar (solo para notificaciones)
};

const hojas = crearHojas((c) =>
  StyleSheet.create({
    pantalla: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      gap: ESPACIO.xl,
      padding: ESPACIO.xl,
      backgroundColor: c.fondo,
    },
    beneficio: {
      color: c.texto,
      fontSize: TAMANIO_TEXTO.subtitulo,
      textAlign: 'center',
    },
    bloqueado: {
      color: c.textoSuave,
      fontSize: TAMANIO_TEXTO.normal,
      textAlign: 'center',
    },
  }),
);

// Pantalla previa al diálogo del sistema: el beneficio en una frase y un único botón.
export function PedidoDePermiso({ recurso, isbn }: Props) {
  const estilos = useEstilos(hojas);
  const colores = useColores();
  const { estado, pedir, abrirAjustes } = usePermiso(recurso);
  const { activarRecordatorio } = useBiblioteca();
  const textos = TEXTOS_PERMISO[recurso];
  const [procesando, setProcesando] = useState(false);
  const [fallo, setFallo] = useState(false);

  // Si el sistema rechaza el pedido o falla la programación, se muestra un mensaje en vez de
  // dejar escapar el error: la app sigue funcionando con los avisos dentro de la app.
  async function continuar() {
    setProcesando(true);
    try {
      const concedido = estado === 'concedido' || (await pedir()).granted;
      const libro = isbn ? buscarLibroPorIsbn(isbn) : undefined;
      if (concedido && recurso === 'notificaciones' && libro) {
        await activarRecordatorio(libro);
      }
      router.back();
    } catch {
      setFallo(true);
    } finally {
      setProcesando(false);
    }
  }

  return (
    <View style={estilos.pantalla}>
      <Stack.Screen options={{ title: textos.titulo }} />
      <Ionicons name={textos.icono} size={TAMANIO.iconoGrande} color={colores.primario} />
      <Text style={estilos.beneficio}>{textos.beneficio}</Text>
      {fallo ? (
        <>
          <Text style={estilos.bloqueado} accessibilityLiveRegion="polite">
            {textos.fallo}
          </Text>
          <Boton titulo="Volver" variante="secundario" onPress={() => router.back()} />
        </>
      ) : null}
      {!fallo && estado === 'cargando' ? <EstadoCargando mensaje="Revisando el permiso…" /> : null}
      {!fallo && estado === 'bloqueado' ? (
        <>
          <Text style={estilos.bloqueado}>{textos.bloqueado}</Text>
          <Boton titulo="Abrir Ajustes" icono="settings-outline" onPress={abrirAjustes} />
        </>
      ) : null}
      {!fallo && (estado === 'preguntable' || estado === 'concedido') ? (
        <Boton titulo="Continuar" onPress={continuar} deshabilitado={procesando} />
      ) : null}
    </View>
  );
}
