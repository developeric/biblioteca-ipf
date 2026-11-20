import * as Notifications from 'expo-notifications';
import { AndroidImportance } from 'expo-notifications';
import { Platform } from 'react-native';

import { CANAL_PRESTAMOS, SEGUNDOS_RECORDATORIO } from '@/constants/biblioteca';

// Muestra las notificaciones también cuando la app está abierta.
export function configurarNotificaciones(): void {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

// En Android 13+ el canal tiene que existir antes de pedir el permiso.
// Si el canal no se puede crear, igual se intenta pedir el permiso.
export async function prepararCanal(): Promise<void> {
  if (Platform.OS !== 'android') return;
  try {
    await Notifications.setNotificationChannelAsync(CANAL_PRESTAMOS, {
      name: 'Préstamos',
      description: 'Recordatorios de devolución y avisos de libros listos para retirar.',
      importance: AndroidImportance.HIGH,
    });
  } catch {
    // Sin canal propio Android usa el canal por defecto.
  }
}

// Consulta el permiso en este momento: la persona puede cambiarlo en Ajustes cuando quiera.
// Si no se puede consultar, se trata como no permitido y los avisos van dentro de la app.
export async function notificacionesPermitidas(): Promise<boolean> {
  try {
    const respuesta = await Notifications.getPermissionsAsync();
    return respuesta.granted;
  } catch {
    return false;
  }
}

export async function programarRecordatorio(titulo: string): Promise<string> {
  return Notifications.scheduleNotificationAsync({
    content: {
      title: 'Recordatorio de devolución',
      body: `Acordate de devolver “${titulo}” a la biblioteca.`,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: SEGUNDOS_RECORDATORIO,
      channelId: CANAL_PRESTAMOS,
    },
  });
}

export async function cancelarRecordatorio(id: string): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(id);
  } catch {
    // Si ya no existe (porque se mostró), no hay nada que cancelar.
  }
}

// null si no se pudo consultar (en ese caso no se toca ningún identificador guardado).
export async function idsProgramados(): Promise<string[] | null> {
  try {
    const programadas = await Notifications.getAllScheduledNotificationsAsync();
    return programadas.map((notificacion) => notificacion.identifier);
  } catch {
    return null;
  }
}

// Decide entre una notificación del sistema y un aviso dentro de la app.
export async function avisarEntrega(titulo: string): Promise<'notificacion' | 'aviso'> {
  if (await notificacionesPermitidas()) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '¡Tu libro está listo!',
        body: `Ya podés retirar “${titulo}” en el mostrador de la biblioteca.`,
      },
      trigger: { channelId: CANAL_PRESTAMOS },
    });
    return 'notificacion';
  }
  return 'aviso';
}
