import AsyncStorage from '@react-native-async-storage/async-storage';

import { CLAVE_ALMACENAMIENTO } from '@/constants/biblioteca';
import type { EstadoPersistido } from '@/types/biblioteca';

function esObjeto(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === 'object' && valor !== null;
}

function esListaDeTextos(valor: unknown): valor is string[] {
  return Array.isArray(valor) && valor.every((item) => typeof item === 'string');
}

// Validación mínima: si lo guardado no tiene la forma esperada, se ignora y la app arranca de cero.
function esEstadoPersistido(valor: unknown): valor is EstadoPersistido {
  if (!esObjeto(valor)) return false;
  const { prestamos, esperas, recientes, avisos } = valor;
  return (
    Array.isArray(prestamos) &&
    prestamos.every((p) => esObjeto(p) && typeof p.isbn === 'string' && typeof p.vence === 'number') &&
    esObjeto(esperas) &&
    Object.values(esperas).every(esListaDeTextos) &&
    esListaDeTextos(recientes) &&
    Array.isArray(avisos) &&
    avisos.every((a) => esObjeto(a) && typeof a.id === 'string' && typeof a.texto === 'string')
  );
}

export async function cargarEstado(): Promise<EstadoPersistido | null> {
  try {
    const texto = await AsyncStorage.getItem(CLAVE_ALMACENAMIENTO);
    if (!texto) return null;
    const valor: unknown = JSON.parse(texto);
    return esEstadoPersistido(valor) ? valor : null;
  } catch {
    return null;
  }
}

export async function guardarEstado(estado: EstadoPersistido): Promise<void> {
  try {
    await AsyncStorage.setItem(CLAVE_ALMACENAMIENTO, JSON.stringify(estado));
  } catch {
    // Si no se puede guardar, la app sigue funcionando con los datos en memoria.
  }
}
