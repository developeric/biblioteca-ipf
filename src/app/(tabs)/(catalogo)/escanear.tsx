import { CameraView, type BarcodeScanningResult } from 'expo-camera';
import { router, useIsFocused } from 'expo-router';
import { useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { EntradaIsbn } from '@/components/EntradaIsbn';
import { EstadoCargando } from '@/components/EstadoCargando';
import { PanelPermiso } from '@/components/PanelPermiso';
import { TEXTOS_PERMISO } from '@/constants/permisos';
import { ESPACIO, RADIO, TAMANIO, TAMANIO_TEXTO } from '@/constants/tema';
import { useEstilos } from '@/hooks/useEstilos';
import { usePermiso } from '@/hooks/usePermiso';
import { buscarLibroPorIsbn, esIsbnValido } from '@/lib/catalogo';
import { crearHojas } from '@/lib/estilos';

const hojas = crearHojas((c) =>
  StyleSheet.create({
    pantalla: {
      backgroundColor: c.fondo,
    },
    contenido: {
      gap: ESPACIO.lg,
      padding: ESPACIO.lg,
    },
    marcoCamara: {
      height: TAMANIO.alturaCamara,
      borderRadius: RADIO.grande,
      overflow: 'hidden',
    },
    camara: {
      flex: 1,
    },
    indicacion: {
      color: c.textoSuave,
      fontSize: TAMANIO_TEXTO.chico,
      textAlign: 'center',
    },
    aviso: {
      padding: ESPACIO.md,
      borderRadius: RADIO.normal,
      backgroundColor: c.avisoFondo,
      color: c.avisoTexto,
      fontSize: TAMANIO_TEXTO.normal,
    },
  }),
);

export default function Escanear() {
  const estilos = useEstilos(hojas);
  const { estado, abrirAjustes } = usePermiso('camara');
  const enfocada = useIsFocused();
  const [aviso, setAviso] = useState<string | null>(null);
  // Refs y no estado: se leen y escriben al instante, aunque lleguen varios cuadros seguidos.
  const navegado = useRef(false);
  const ultimoDesconocido = useRef<string | null>(null);

  function abrirLibro(isbn: string) {
    navegado.current = true;
    router.replace({ pathname: '/libro/[isbn]', params: { isbn } });
  }

  function alLeerCodigo({ data }: BarcodeScanningResult) {
    if (navegado.current || !esIsbnValido(data)) return;
    if (!buscarLibroPorIsbn(data)) {
      if (ultimoDesconocido.current !== data) {
        ultimoDesconocido.current = data;
        setAviso(
          `El código ${data} no corresponde a ningún libro del catálogo. Probá con otro o escribí el ISBN a mano.`,
        );
      }
      return;
    }
    abrirLibro(data);
  }

  return (
    <ScrollView
      style={estilos.pantalla}
      contentContainerStyle={estilos.contenido}
      keyboardShouldPersistTaps="handled">
      {estado === 'cargando' ? <EstadoCargando mensaje="Revisando el permiso de la cámara…" /> : null}
      {estado === 'concedido' ? (
        <>
          <View style={estilos.marcoCamara}>
            <CameraView
              style={estilos.camara}
              active={enfocada}
              barcodeScannerSettings={{ barcodeTypes: ['ean13'] }}
              onBarcodeScanned={alLeerCodigo}
              accessibilityLabel="Vista de la cámara para leer el código de barras"
            />
          </View>
          <Text style={estilos.indicacion}>
            Apuntá al código de barras de la contratapa del libro.
          </Text>
        </>
      ) : null}
      {estado === 'preguntable' ? (
        <PanelPermiso
          icono="camera-outline"
          mensaje={TEXTOS_PERMISO.camara.preguntable}
          textoBoton="Usar la cámara"
          onPress={() =>
            router.push({ pathname: '/permisos/[recurso]', params: { recurso: 'camara' } })
          }
        />
      ) : null}
      {estado === 'bloqueado' ? (
        <PanelPermiso
          icono="lock-closed-outline"
          mensaje={TEXTOS_PERMISO.camara.bloqueado}
          textoBoton="Abrir Ajustes"
          onPress={abrirAjustes}
        />
      ) : null}
      {aviso ? (
        <Text style={estilos.aviso} accessibilityLiveRegion="polite">
          {aviso}
        </Text>
      ) : null}
      <EntradaIsbn onIsbnEncontrado={abrirLibro} />
    </ScrollView>
  );
}
