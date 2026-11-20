import type { PermissionResponse } from 'expo';
import { useCameraPermissions } from 'expo-camera';
import * as Notifications from 'expo-notifications';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { AppState, Linking } from 'react-native';

import { prepararCanal } from '@/lib/notificaciones';
import { estadoDePermiso } from '@/lib/permisos';
import type { Recurso } from '@/types/biblioteca';

export function usePermiso(recurso: Recurso) {
  // La cámara usa el hook de expo-camera; solo tomamos sus funciones para consultar y pedir.
  const [, pedirCamara, obtenerCamara] = useCameraPermissions({ get: false });
  const [respuesta, setRespuesta] = useState<PermissionResponse | null>(null);

  // Nunca rechaza: si no se puede consultar, devuelve null y se mantiene el último estado conocido.
  const consultar = useCallback(async (): Promise<PermissionResponse | null> => {
    try {
      return recurso === 'camara' ? await obtenerCamara() : await Notifications.getPermissionsAsync();
    } catch {
      return null;
    }
  }, [recurso, obtenerCamara]);

  // Al ganar el foco (también al montarse): volver de otra pestaña o de la pantalla previa.
  useFocusEffect(
    useCallback(() => {
      let activo = true;
      consultar().then((nueva) => {
        if (activo && nueva) setRespuesta(nueva);
      });
      return () => {
        activo = false;
      };
    }, [consultar]),
  );

  // Al volver a primer plano: por ejemplo, después de cambiar el permiso en Ajustes.
  useEffect(() => {
    let activo = true;
    const suscripcion = AppState.addEventListener('change', (estadoApp) => {
      if (estadoApp !== 'active') return;
      consultar().then((nueva) => {
        if (activo && nueva) setRespuesta(nueva);
      });
    });
    return () => {
      activo = false;
      suscripcion.remove();
    };
  }, [consultar]);

  const pedir = useCallback(async (): Promise<PermissionResponse> => {
    if (recurso === 'notificaciones') await prepararCanal();
    const nueva =
      recurso === 'camara' ? await pedirCamara() : await Notifications.requestPermissionsAsync();
    setRespuesta(nueva);
    return nueva;
  }, [recurso, pedirCamara]);

  const abrirAjustes = useCallback(() => {
    Linking.openSettings();
  }, []);

  return { estado: estadoDePermiso(respuesta), pedir, abrirAjustes };
}
