import type { Libro } from './index';

export type OrigenPrestamo = 'estante' | 'mostrador';

export type Prestamo = {
  isbn: string;
  vence: number; // fecha de devolución en milisegundos
  origen: OrigenPrestamo;
  notificacionId: string | null;
};

export type Aviso = {
  id: string;
  texto: string;
};

export type EstadoReserva =
  | { tipo: 'ninguna' }
  | { tipo: 'prestamo'; prestamo: Prestamo }
  | { tipo: 'espera'; posicion: number };

export type ResultadoReserva =
  | { tipo: 'prestamo'; vence: number }
  | { tipo: 'espera'; posicion: number }
  | { tipo: 'repetida' };

export type LibroEnEspera = {
  libro: Libro;
  frente: string;
  cantidad: number;
};

// Una fila de "Mis reservas": un libro no puede estar a la vez en préstamo y en espera.
export type ItemReserva =
  | { tipo: 'prestamo'; libro: Libro; prestamo: Prestamo }
  | { tipo: 'espera'; libro: Libro; posicion: number };

export type EstadoPersistido = {
  prestamos: Prestamo[];
  esperas: Record<string, string[]>;
  recientes: string[];
  avisos: Aviso[];
};

export type Recurso = 'camara' | 'notificaciones';

export type EstadoPermiso = 'cargando' | 'concedido' | 'preguntable' | 'bloqueado';
