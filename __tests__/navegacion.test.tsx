import AsyncStorage from '@react-native-async-storage/async-storage';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { PermissionStatus } from 'expo';
import * as Notifications from 'expo-notifications';
import { fireEvent, renderRouter, screen, testRouter, waitFor } from 'expo-router/testing-library';

// API sin demora ni fallos al azar, para que las pruebas sean repetibles.
jest.mock('@/lib/api', () => {
  const { LIBROS } = jest.requireActual<typeof import('@/data/libros')>('@/data/libros');
  return {
    obtenerLibros: async () => LIBROS.map((libro) => ({ ...libro })),
    buscarLibros: async () => [],
  };
});

const APP = './src/app';
const CLEAN_CODE = '9780132350884';

describe('Navegación de Biblioteca IPF', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('muestra el Catálogo en /', async () => {
    await renderRouter(APP, { initialUrl: '/' });
    expect(await screen.findByText('Clean Code')).toBeTruthy();
    expect(screen.getByText('Vistos recientemente')).toBeTruthy();
    await waitFor(() => expect(screen).toHavePathname('/'));
  });

  it('/reserva redirige a /reservas', async () => {
    await renderRouter(APP, { initialUrl: '/reserva' });
    expect(await screen.findByText('Todavía no reservaste ningún libro.')).toBeTruthy();
    await waitFor(() => expect(screen).toHavePathname('/reservas'));
  });

  it('/mostrador sin sesión lleva al Catálogo', async () => {
    await renderRouter(APP, { initialUrl: '/mostrador' });
    expect(await screen.findByText('Clean Code')).toBeTruthy();
    await waitFor(() => expect(screen).toHavePathname('/'));
  });

  it('/libro/123 muestra un mensaje con link al Catálogo', async () => {
    await renderRouter(APP, { initialUrl: '/libro/123' });
    expect(await screen.findByText(/el ISBN tiene que tener 13 números/)).toBeTruthy();
    expect(screen.getByText('Ir al catálogo')).toBeTruthy();
  });

  it('una URL inexistente muestra la 404 con la ruta', async () => {
    await renderRouter(APP, { initialUrl: '/libros/viejos' });
    expect(await screen.findByText('/libros/viejos')).toBeTruthy();
  });

  it('confirmar una reserva lleva a /reservas y atrás no vuelve a la confirmación', async () => {
    await renderRouter(APP, { initialUrl: `/libro/${CLEAN_CODE}` });
    await fireEvent.press(await screen.findByText('Reservar'));
    await waitFor(() => expect(screen).toHavePathname(`/reservar/${CLEAN_CODE}`));

    await fireEvent.press(await screen.findByText('Confirmar préstamo'));
    await waitFor(() => expect(screen).toHavePathname('/reservas'));
    expect(await screen.findByText('Devolver')).toBeTruthy();

    await testRouter.back(`/libro/${CLEAN_CODE}`);
    expect(await screen.findByText(/Ya tenés este libro en préstamo/)).toBeTruthy();

    // Tocar la pestaña que ya está enfocada vuelve al inicio de su pila.
    await fireEvent.press(screen.getByText('Catálogo'));
    await waitFor(() => expect(screen).toHavePathname('/'));
  });

  it('un deep link a /buscar deja las pestañas debajo', async () => {
    await renderRouter(APP, { initialUrl: '/buscar?q=borges' });
    await waitFor(() => expect(screen).toHavePathname('/buscar'));
    await testRouter.back('/');
    expect(await screen.findByText('Clean Code')).toBeTruthy();
  });

  it('el login se cierra solo, lleva al mostrador y cerrar sesión no deja historial', async () => {
    await renderRouter(APP, { initialUrl: '/' });
    await fireEvent.press(await screen.findByText('Personal'));
    await fireEvent.changeText(await screen.findByLabelText('Usuario'), 'biblioteca');
    await fireEvent.changeText(screen.getByLabelText('Clave'), 'ipf2026');
    await fireEvent.press(screen.getByText('Ingresar'));
    await waitFor(() => expect(screen).toHavePathname('/mostrador'));
    expect(await screen.findByText('Al frente: Lucía Benítez')).toBeTruthy();
    await fireEvent.press(screen.getAllByText('Entregar al siguiente')[0]);
    expect(await screen.findByText('Entregaste “Design Patterns” a Lucía Benítez.')).toBeTruthy();
    expect(screen.getByText('Al frente: Martín Ríos')).toBeTruthy();

    await fireEvent.press(screen.getByText('Cerrar sesión'));
    expect(await screen.findByText('Clean Code')).toBeTruthy();
    await waitFor(() => expect(screen).toHavePathname('/'));
    // Ni el login ni el mostrador quedan en la pila: no hay a dónde volver.
    expect(testRouter.canGoBack()).toBe(false);
  });

  it('con la clave incorrecta muestra un mensaje y sigue en el login', async () => {
    await renderRouter(APP, { initialUrl: '/login' });
    await fireEvent.changeText(await screen.findByLabelText('Usuario'), 'biblioteca');
    await fireEvent.changeText(screen.getByLabelText('Clave'), 'otra');
    await fireEvent.press(screen.getByText('Ingresar'));
    expect(await screen.findByText(/Usuario o clave incorrectos/)).toBeTruthy();
    await waitFor(() => expect(screen).toHavePathname('/login'));
  });

  it('si el sistema falla al pedir notificaciones, muestra un mensaje y no rompe la app', async () => {
    const consultar = jest.mocked(Notifications.getPermissionsAsync);
    const original = consultar.getMockImplementation();
    consultar.mockResolvedValue({
      status: PermissionStatus.UNDETERMINED,
      granted: false,
      canAskAgain: true,
      expires: 'never',
    });
    jest
      .mocked(Notifications.requestPermissionsAsync)
      .mockRejectedValueOnce(new Error('falla nativa simulada'));
    try {
      await renderRouter(APP, { initialUrl: `/permisos/notificaciones?isbn=${CLEAN_CODE}` });
      await fireEvent.press(await screen.findByText('Continuar'));
      expect(await screen.findByText(/No pudimos activar los recordatorios/)).toBeTruthy();
      expect(screen.getByText('Volver')).toBeTruthy();
    } finally {
      if (original) consultar.mockImplementation(original);
    }
  });

  // Va al final porque deja el permiso de notificaciones simulado como denegado.
  it('sin permiso de notificaciones, la entrega desde el mostrador llega como aviso', async () => {
    jest.mocked(Notifications.getPermissionsAsync).mockResolvedValue({
      status: PermissionStatus.DENIED,
      granted: false,
      canAskAgain: true,
      expires: 'never',
    });
    const EL_ALEPH = '9789507310010'; // 0 ejemplares y nadie esperando

    await renderRouter(APP, { initialUrl: `/reservar/${EL_ALEPH}` });
    expect(await screen.findByText(/en la posición 1/)).toBeTruthy();
    await fireEvent.press(screen.getByText('Anotarme en la lista de espera'));
    expect(await screen.findByText('Tu posición: 1')).toBeTruthy();
    expect(screen.getByText(/te avisamos acá adentro/)).toBeTruthy();

    await testRouter.push('/login');
    await fireEvent.changeText(await screen.findByLabelText('Usuario'), 'biblioteca');
    await fireEvent.changeText(screen.getByLabelText('Clave'), 'ipf2026');
    await fireEvent.press(screen.getByText('Ingresar'));
    await waitFor(() => expect(screen).toHavePathname('/mostrador'));
    expect(await screen.findByText('Al frente: Vos (la persona que usa esta app)')).toBeTruthy();
    await fireEvent.press(screen.getAllByText('Entregar al siguiente')[2]);
    expect(await screen.findByText(/Entregaste “El Aleph” a la persona que usa esta app/)).toBeTruthy();
    expect(Notifications.scheduleNotificationAsync).not.toHaveBeenCalledWith(
      expect.objectContaining({ content: expect.objectContaining({ title: '¡Tu libro está listo!' }) }),
    );

    await testRouter.navigate('/reservas');
    expect(await screen.findByText(/Ya podés retirar “El Aleph” en el mostrador/)).toBeTruthy();
    expect(screen.getByText('Devolver')).toBeTruthy();
  });
});
