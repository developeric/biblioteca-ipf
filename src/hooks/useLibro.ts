import { buscarLibroPorIsbn, esIsbnValido } from '@/lib/catalogo';
import type { Libro } from '@/types';

export type ResultadoLibro =
  | { estado: 'encontrado'; libro: Libro }
  | { estado: 'invalido' }
  | { estado: 'inexistente' };

// Valida el parámetro de la ruta (llega siempre como string, o como array si se repite).
export function useLibro(parametro: string | string[] | undefined): ResultadoLibro {
  const isbn = Array.isArray(parametro) ? parametro[0] : parametro;
  if (!isbn || !esIsbnValido(isbn)) return { estado: 'invalido' };
  const libro = buscarLibroPorIsbn(isbn);
  return libro ? { estado: 'encontrado', libro } : { estado: 'inexistente' };
}
