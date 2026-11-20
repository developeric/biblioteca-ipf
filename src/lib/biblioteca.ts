import {
  CREDENCIALES_PERSONAL,
  MAX_HISTORIAL_RECIENTES,
  USUARIO_ACTUAL,
} from '@/constants/biblioteca';
import { ESPERAS_INICIALES } from '@/data/esperas';
import { Cola } from '@/estructuras/Cola';
import { Pila } from '@/estructuras/Pila';
import type { Libro } from '@/types';
import type {
  Aviso,
  EstadoPersistido,
  EstadoReserva,
  LibroEnEspera,
  OrigenPrestamo,
  Prestamo,
} from '@/types/biblioteca';

export type EstadoBiblioteca = {
  listo: boolean;
  prestamos: Prestamo[];
  esperas: Record<string, Cola<string>>;
  recientes: Pila<string>;
  sesion: boolean;
  avisos: Aviso[];
};

export type AccionBiblioteca =
  | { tipo: 'hidratar'; guardado: EstadoPersistido | null; idsProgramados: string[] | null }
  | { tipo: 'prestar'; isbn: string; vence: number; origen: OrigenPrestamo }
  | { tipo: 'encolar'; isbn: string; persona: string }
  | { tipo: 'entregar'; isbn: string; vence: number }
  | { tipo: 'devolver'; isbn: string }
  | { tipo: 'asignarNotificacion'; isbn: string; id: string | null }
  | { tipo: 'registrarVisto'; isbn: string }
  | { tipo: 'iniciarSesion' }
  | { tipo: 'cerrarSesion' }
  | { tipo: 'agregarAviso'; aviso: Aviso }
  | { tipo: 'descartarAviso'; id: string };

function colasDesde(listas: Record<string, string[]>): Record<string, Cola<string>> {
  const colas: Record<string, Cola<string>> = {};
  for (const [isbn, personas] of Object.entries(listas)) {
    if (personas.length > 0) colas[isbn] = Cola.desde(personas);
  }
  return colas;
}

export function crearEstadoInicial(): EstadoBiblioteca {
  return {
    listo: false,
    prestamos: [],
    esperas: colasDesde(ESPERAS_INICIALES),
    recientes: new Pila<string>(),
    sesion: false,
    avisos: [],
  };
}

function conPrestamo(estado: EstadoBiblioteca, prestamo: Prestamo): EstadoBiblioteca {
  if (estado.prestamos.some((p) => p.isbn === prestamo.isbn)) return estado;
  return { ...estado, prestamos: [...estado.prestamos, prestamo] };
}

// Función pura: nunca modifica una Cola o Pila que ya está en el estado; trabaja sobre copias.
export function reductorBiblioteca(
  estado: EstadoBiblioteca,
  accion: AccionBiblioteca,
): EstadoBiblioteca {
  switch (accion.tipo) {
    case 'hidratar': {
      if (!accion.guardado) return { ...estado, listo: true };
      const programados = accion.idsProgramados;
      const prestamos = accion.guardado.prestamos.map((p) =>
        programados && p.notificacionId && !programados.includes(p.notificacionId)
          ? { ...p, notificacionId: null }
          : p,
      );
      return {
        ...estado,
        listo: true,
        prestamos,
        esperas: colasDesde(accion.guardado.esperas),
        recientes: Pila.desde(accion.guardado.recientes),
        avisos: accion.guardado.avisos,
      };
    }
    case 'prestar':
      return conPrestamo(estado, {
        isbn: accion.isbn,
        vence: accion.vence,
        origen: accion.origen,
        notificacionId: null,
      });
    case 'encolar': {
      const actual = estado.esperas[accion.isbn] ?? new Cola<string>();
      if (actual.incluye(accion.persona)) return estado;
      const copia = actual.clonar();
      copia.encolar(accion.persona);
      return { ...estado, esperas: { ...estado.esperas, [accion.isbn]: copia } };
    }
    case 'entregar': {
      const actual = estado.esperas[accion.isbn];
      if (!actual || actual.estaVacia()) return estado;
      const copia = actual.clonar();
      const persona = copia.desencolar();
      const esperas = { ...estado.esperas };
      if (copia.estaVacia()) {
        delete esperas[accion.isbn];
      } else {
        esperas[accion.isbn] = copia;
      }
      const siguiente = { ...estado, esperas };
      if (persona !== USUARIO_ACTUAL) return siguiente;
      return conPrestamo(siguiente, {
        isbn: accion.isbn,
        vence: accion.vence,
        origen: 'mostrador',
        notificacionId: null,
      });
    }
    case 'devolver':
      return { ...estado, prestamos: estado.prestamos.filter((p) => p.isbn !== accion.isbn) };
    case 'asignarNotificacion':
      return {
        ...estado,
        prestamos: estado.prestamos.map((p) =>
          p.isbn === accion.isbn ? { ...p, notificacionId: accion.id } : p,
        ),
      };
    case 'registrarVisto': {
      if (estado.recientes.verTope() === accion.isbn) return estado;
      const copia = estado.recientes.clonar();
      copia.apilar(accion.isbn);
      const recientes =
        copia.tamanio > MAX_HISTORIAL_RECIENTES
          ? Pila.desde(copia.aArray().slice(-MAX_HISTORIAL_RECIENTES))
          : copia;
      return { ...estado, recientes };
    }
    case 'iniciarSesion':
      return { ...estado, sesion: true };
    case 'cerrarSesion':
      return { ...estado, sesion: false };
    case 'agregarAviso':
      return { ...estado, avisos: [accion.aviso, ...estado.avisos] };
    case 'descartarAviso':
      return { ...estado, avisos: estado.avisos.filter((a) => a.id !== accion.id) };
  }
}

export function disponibles(estado: EstadoBiblioteca, libro: Libro): number {
  const prestados = estado.prestamos.filter(
    (p) => p.isbn === libro.isbn && p.origen === 'estante',
  ).length;
  return Math.max(0, libro.ejemplares - prestados);
}

export function personasEnEspera(estado: EstadoBiblioteca, isbn: string): number {
  return estado.esperas[isbn]?.tamanio ?? 0;
}

export function estadoReserva(estado: EstadoBiblioteca, isbn: string): EstadoReserva {
  const prestamo = estado.prestamos.find((p) => p.isbn === isbn);
  if (prestamo) return { tipo: 'prestamo', prestamo };
  const posicion = estado.esperas[isbn]?.posicionDe(USUARIO_ACTUAL) ?? 0;
  if (posicion > 0) return { tipo: 'espera', posicion };
  return { tipo: 'ninguna' };
}

// Los ISBN del tope hacia abajo, sin repetir, hasta `maximo`.
export function ultimosVistos(estado: EstadoBiblioteca, maximo: number): string[] {
  const resultado: string[] = [];
  for (const isbn of estado.recientes.aArray().reverse()) {
    if (!resultado.includes(isbn)) resultado.push(isbn);
    if (resultado.length === maximo) break;
  }
  return resultado;
}

export function misEsperas(estado: EstadoBiblioteca): { isbn: string; posicion: number }[] {
  return Object.entries(estado.esperas)
    .map(([isbn, cola]) => ({ isbn, posicion: cola.posicionDe(USUARIO_ACTUAL) }))
    .filter((espera) => espera.posicion > 0);
}

export function librosEnEspera(
  estado: EstadoBiblioteca,
  libros: readonly Libro[],
): LibroEnEspera[] {
  const resultado: LibroEnEspera[] = [];
  for (const libro of libros) {
    const cola = estado.esperas[libro.isbn];
    const frente = cola?.verFrente();
    if (cola && frente !== undefined) {
      resultado.push({ libro, frente, cantidad: cola.tamanio });
    }
  }
  return resultado;
}

export function aPersistido(estado: EstadoBiblioteca): EstadoPersistido {
  const esperas: Record<string, string[]> = {};
  for (const [isbn, cola] of Object.entries(estado.esperas)) {
    esperas[isbn] = cola.aArray();
  }
  return {
    prestamos: estado.prestamos,
    esperas,
    recientes: estado.recientes.aArray(),
    avisos: estado.avisos,
  };
}

export function sonCredencialesValidas(usuario: string, clave: string): boolean {
  return (
    usuario.trim().toLowerCase() === CREDENCIALES_PERSONAL.usuario &&
    clave === CREDENCIALES_PERSONAL.clave
  );
}
