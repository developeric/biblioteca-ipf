import type { PermissionResponse } from 'expo';

import type { EstadoPermiso, Recurso } from '@/types/biblioteca';

const RECURSOS: readonly Recurso[] = ['camara', 'notificaciones'];

export function esRecurso(valor: string): valor is Recurso {
  return RECURSOS.some((recurso) => recurso === valor);
}

// cargando → concedido → preguntable → bloqueado
export function estadoDePermiso(respuesta: PermissionResponse | null): EstadoPermiso {
  if (!respuesta) return 'cargando';
  if (respuesta.granted) return 'concedido';
  return respuesta.canAskAgain ? 'preguntable' : 'bloqueado';
}
