import { jest } from '@jest/globals';

// Módulos nativos reemplazados por versiones de prueba: en Node no hay cámara ni notificaciones.

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

jest.mock('expo-splash-screen', () => ({
  preventAutoHideAsync: jest.fn(async () => true),
  hide: jest.fn(),
}));

jest.mock('expo-notifications', () => {
  const concedido = { status: 'granted', granted: true, canAskAgain: true, expires: 'never' };
  return {
    AndroidImportance: { HIGH: 4 },
    SchedulableTriggerInputTypes: { TIME_INTERVAL: 'timeInterval' },
    setNotificationHandler: jest.fn(),
    setNotificationChannelAsync: jest.fn(async () => null),
    getPermissionsAsync: jest.fn(async () => concedido),
    requestPermissionsAsync: jest.fn(async () => concedido),
    scheduleNotificationAsync: jest.fn(async () => 'id-de-prueba'),
    cancelScheduledNotificationAsync: jest.fn(async () => undefined),
    getAllScheduledNotificationsAsync: jest.fn(async () => []),
  };
});

jest.mock('expo-camera', () => {
  const concedido = { status: 'granted', granted: true, canAskAgain: true, expires: 'never' };
  const pedir = async () => concedido;
  return {
    CameraView: () => null,
    useCameraPermissions: () => [concedido, pedir, pedir],
  };
});
