export const DIAS_PRESTAMO = 7;

// Modo demostración: el recordatorio llega a los 15 segundos en lugar de días antes del vencimiento.
export const SEGUNDOS_RECORDATORIO = 15;

export const CANAL_PRESTAMOS = 'prestamos';

export const MAX_RECIENTES = 3;

// Tope de libros que se guardan en la pila de recientes para que no crezca sin límite.
export const MAX_HISTORIAL_RECIENTES = 20;

export const DEMORA_BUSQUEDA_MS = 300;

export const DEMORA_GUARDADO_MS = 250;

export const USUARIO_ACTUAL = 'Vos';

// Credenciales fijas del personal de biblioteca (consigna del TP: no hay servidor de autenticación).
export const CREDENCIALES_PERSONAL = {
  usuario: 'biblioteca',
  clave: 'ipf2026',
} as const;

export const CLAVE_ALMACENAMIENTO = 'biblioteca-ipf/estado-v1';
