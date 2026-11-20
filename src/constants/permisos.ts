import type { Recurso } from '@/types/biblioteca';
import type { NombreIcono } from '@/types/iconos';

type TextosPermiso = {
  titulo: string;
  icono: NombreIcono;
  beneficio: string;
  preguntable: string;
  bloqueado: string;
  fallo: string;
};

export const TEXTOS_PERMISO: Record<Recurso, TextosPermiso> = {
  camara: {
    titulo: 'Cámara',
    icono: 'camera-outline',
    beneficio:
      'Usamos tu cámara para leer el código de barras del libro y abrir su ficha sin escribir el ISBN.',
    preguntable:
      'Para leer el código de barras necesitamos usar la cámara. También podés escribir el ISBN abajo.',
    bloqueado:
      'La cámara está bloqueada para esta app. Podés habilitarla en Ajustes o escribir el ISBN abajo.',
    fallo: 'No pudimos usar la cámara en este teléfono. Podés escribir el ISBN a mano.',
  },
  notificaciones: {
    titulo: 'Notificaciones',
    icono: 'notifications-outline',
    beneficio:
      'Usamos las notificaciones para recordarte cuándo devolver un libro y avisarte cuando el que esperás está listo.',
    preguntable: 'Las notificaciones están desactivadas: te avisamos acá adentro.',
    bloqueado:
      'Las notificaciones están bloqueadas para esta app. Podés habilitarlas en Ajustes; mientras tanto te avisamos acá adentro.',
    fallo:
      'No pudimos activar los recordatorios en este teléfono. Igual te avisamos dentro de la app, en Mis reservas.',
  },
};
