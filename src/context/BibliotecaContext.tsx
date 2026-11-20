import { createContext, useCallback, useEffect, useMemo, useReducer, type ReactNode } from 'react';

import {
  DEMORA_GUARDADO_MS,
  DIAS_PRESTAMO,
  MAX_RECIENTES,
  USUARIO_ACTUAL,
} from '@/constants/biblioteca';
import * as biblioteca from '@/lib/biblioteca';
import { librosDelCatalogo } from '@/lib/catalogo';
import { formatearFecha, sumarDias } from '@/lib/fechas';
import {
  avisarEntrega,
  cancelarRecordatorio,
  idsProgramados,
  notificacionesPermitidas,
  programarRecordatorio,
} from '@/lib/notificaciones';
import { cargarEstado, guardarEstado } from '@/lib/persistencia';
import type { Libro } from '@/types';
import type {
  Aviso,
  EstadoReserva,
  LibroEnEspera,
  Prestamo,
  ResultadoReserva,
} from '@/types/biblioteca';

export type ValorBiblioteca = {
  listo: boolean;
  sesion: boolean;
  prestamos: Prestamo[];
  avisos: Aviso[];
  recientes: string[];
  misEsperas: { isbn: string; posicion: number }[];
  librosEnEspera: LibroEnEspera[];
  disponibles: (libro: Libro) => number;
  personasEnEspera: (isbn: string) => number;
  estadoReserva: (isbn: string) => EstadoReserva;
  reservar: (libro: Libro) => ResultadoReserva;
  devolver: (isbn: string) => Promise<void>;
  activarRecordatorio: (libro: Libro) => Promise<boolean>;
  desactivarRecordatorio: (isbn: string) => Promise<void>;
  registrarVisto: (isbn: string) => void;
  iniciarSesion: (usuario: string, clave: string) => boolean;
  cerrarSesion: () => void;
  entregarAlSiguiente: (libro: Libro) => Promise<string | null>;
  descartarAviso: (id: string) => void;
};

export const BibliotecaContext = createContext<ValorBiblioteca | null>(null);

type Props = {
  children: ReactNode;
};

export function BibliotecaProvider({ children }: Props) {
  const [estado, dispatch] = useReducer(
    biblioteca.reductorBiblioteca,
    undefined,
    biblioteca.crearEstadoInicial,
  );

  // Carga lo guardado y lo reconcilia con las notificaciones que el sistema todavía tiene programadas.
  useEffect(() => {
    let activo = true;
    async function hidratar() {
      const [guardado, programados] = await Promise.all([cargarEstado(), idsProgramados()]);
      if (activo) dispatch({ tipo: 'hidratar', guardado, idsProgramados: programados });
    }
    hidratar();
    return () => {
      activo = false;
    };
  }, []);

  useEffect(() => {
    if (!estado.listo) return;
    const temporizador = setTimeout(() => {
      guardarEstado(biblioteca.aPersistido(estado));
    }, DEMORA_GUARDADO_MS);
    return () => clearTimeout(temporizador);
  }, [estado]);

  const reservar = useCallback(
    (libro: Libro): ResultadoReserva => {
      if (biblioteca.estadoReserva(estado, libro.isbn).tipo !== 'ninguna') {
        return { tipo: 'repetida' };
      }
      if (biblioteca.disponibles(estado, libro) > 0) {
        const vence = sumarDias(Date.now(), DIAS_PRESTAMO);
        dispatch({ tipo: 'prestar', isbn: libro.isbn, vence, origen: 'estante' });
        return { tipo: 'prestamo', vence };
      }
      dispatch({ tipo: 'encolar', isbn: libro.isbn, persona: USUARIO_ACTUAL });
      return { tipo: 'espera', posicion: biblioteca.personasEnEspera(estado, libro.isbn) + 1 };
    },
    [estado],
  );

  const devolver = useCallback(
    async (isbn: string) => {
      const prestamo = estado.prestamos.find((p) => p.isbn === isbn);
      if (prestamo?.notificacionId) await cancelarRecordatorio(prestamo.notificacionId);
      dispatch({ tipo: 'devolver', isbn });
    },
    [estado.prestamos],
  );

  const activarRecordatorio = useCallback(
    async (libro: Libro): Promise<boolean> => {
      if (!(await notificacionesPermitidas())) return false;
      const anterior = estado.prestamos.find((p) => p.isbn === libro.isbn)?.notificacionId;
      if (anterior) await cancelarRecordatorio(anterior);
      try {
        const id = await programarRecordatorio(libro.titulo);
        dispatch({ tipo: 'asignarNotificacion', isbn: libro.isbn, id });
        return true;
      } catch {
        return false;
      }
    },
    [estado.prestamos],
  );

  const desactivarRecordatorio = useCallback(
    async (isbn: string) => {
      const id = estado.prestamos.find((p) => p.isbn === isbn)?.notificacionId;
      if (id) await cancelarRecordatorio(id);
      dispatch({ tipo: 'asignarNotificacion', isbn, id: null });
    },
    [estado.prestamos],
  );

  const entregarAlSiguiente = useCallback(
    async (libro: Libro): Promise<string | null> => {
      const frente = estado.esperas[libro.isbn]?.verFrente();
      if (frente === undefined) return null;
      const vence = sumarDias(Date.now(), DIAS_PRESTAMO);
      dispatch({ tipo: 'entregar', isbn: libro.isbn, vence });
      if (frente !== USUARIO_ACTUAL) return frente;

      let medio: 'notificacion' | 'aviso';
      try {
        medio = await avisarEntrega(libro.titulo);
      } catch {
        medio = 'aviso';
      }
      if (medio === 'aviso') {
        dispatch({
          tipo: 'agregarAviso',
          aviso: {
            id: `${libro.isbn}-${Date.now()}`,
            texto: `¡Ya podés retirar “${libro.titulo}” en el mostrador! Lo tenés en préstamo hasta el ${formatearFecha(vence)}.`,
          },
        });
      }
      return frente;
    },
    [estado.esperas],
  );

  const registrarVisto = useCallback((isbn: string) => {
    dispatch({ tipo: 'registrarVisto', isbn });
  }, []);

  const iniciarSesion = useCallback((usuario: string, clave: string) => {
    const valido = biblioteca.sonCredencialesValidas(usuario, clave);
    if (valido) dispatch({ tipo: 'iniciarSesion' });
    return valido;
  }, []);

  const cerrarSesion = useCallback(() => {
    dispatch({ tipo: 'cerrarSesion' });
  }, []);

  const descartarAviso = useCallback((id: string) => {
    dispatch({ tipo: 'descartarAviso', id });
  }, []);

  const valor = useMemo<ValorBiblioteca>(
    () => ({
      listo: estado.listo,
      sesion: estado.sesion,
      prestamos: estado.prestamos,
      avisos: estado.avisos,
      recientes: biblioteca.ultimosVistos(estado, MAX_RECIENTES),
      misEsperas: biblioteca.misEsperas(estado),
      librosEnEspera: biblioteca.librosEnEspera(estado, librosDelCatalogo()),
      disponibles: (libro) => biblioteca.disponibles(estado, libro),
      personasEnEspera: (isbn) => biblioteca.personasEnEspera(estado, isbn),
      estadoReserva: (isbn) => biblioteca.estadoReserva(estado, isbn),
      reservar,
      devolver,
      activarRecordatorio,
      desactivarRecordatorio,
      registrarVisto,
      iniciarSesion,
      cerrarSesion,
      entregarAlSiguiente,
      descartarAviso,
    }),
    [
      estado,
      reservar,
      devolver,
      activarRecordatorio,
      desactivarRecordatorio,
      registrarVisto,
      iniciarSesion,
      cerrarSesion,
      entregarAlSiguiente,
      descartarAviso,
    ],
  );

  return <BibliotecaContext.Provider value={valor}>{children}</BibliotecaContext.Provider>;
}
