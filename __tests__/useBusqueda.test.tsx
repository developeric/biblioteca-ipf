import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { act, renderHook } from '@testing-library/react-native';

import { useBusqueda } from '@/hooks/useBusqueda';
import { buscarLibros } from '@/lib/api';
import type { Libro } from '@/types';

jest.mock('@/lib/api', () => ({ buscarLibros: jest.fn() }));

const buscarSimulado = jest.mocked(buscarLibros);

const FICCIONES: Libro = {
  isbn: '9789507310003',
  titulo: 'Ficciones',
  autor: 'Jorge Luis Borges',
  anio: 1944,
  ejemplares: 2,
};
const LA_BORRA: Libro = {
  isbn: '9789507310034',
  titulo: 'La borra del café',
  autor: 'Mario Benedetti',
  anio: 1992,
  ejemplares: 1,
};

describe('useBusqueda (B2: condición de carrera)', () => {
  // Cada búsqueda queda pendiente hasta que la prueba decide resolverla.
  const pendientes: Record<string, (libros: Libro[]) => void> = {};

  beforeEach(() => {
    jest.useFakeTimers();
    buscarSimulado.mockImplementation(
      (q) =>
        new Promise<Libro[]>((resolver) => {
          pendientes[q] = resolver;
        }),
    );
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('muestra solo la última búsqueda aunque la respuesta vieja llegue después', async () => {
    const { result, rerender } = await renderHook((q: string) => useBusqueda(q), {
      initialProps: 'bor',
    });
    await act(async () => {
      jest.advanceTimersByTime(300); // sale el pedido de "bor"
    });
    await rerender('borges');
    await act(async () => {
      jest.advanceTimersByTime(300); // sale el pedido de "borges"
    });
    expect(result.current.cargando).toBe(true);

    await act(async () => pendientes.borges([FICCIONES]));
    expect(result.current.resultados).toEqual([FICCIONES]);

    await act(async () => pendientes.bor([FICCIONES, LA_BORRA]));
    expect(result.current.resultados).toEqual([FICCIONES]);
    expect(result.current.cargando).toBe(false);
  });

  it('con debounce, escribir rápido no llega a pedir la búsqueda intermedia', async () => {
    buscarSimulado.mockClear();
    const { rerender } = await renderHook((q: string) => useBusqueda(q), { initialProps: 'bor' });
    await act(async () => {
      jest.advanceTimersByTime(200);
    });
    await rerender('borges');
    await act(async () => {
      jest.advanceTimersByTime(300);
    });
    expect(buscarSimulado).toHaveBeenCalledTimes(1);
    expect(buscarSimulado).toHaveBeenCalledWith('borges');
  });
});
