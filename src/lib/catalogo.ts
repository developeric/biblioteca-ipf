import { LIBROS } from '@/data/libros';
import type { Libro } from '@/types';

const PATRON_ISBN = /^\d{13}$/;

export function esIsbnValido(valor: string): boolean {
  return PATRON_ISBN.test(valor);
}

// Quita espacios y guiones de lo que la persona escribe a mano ("978-0-13-235088-4").
export function normalizarIsbn(texto: string): string {
  return texto.replace(/[\s-]/g, '');
}

export function buscarLibroPorIsbn(isbn: string): Libro | undefined {
  return LIBROS.find((libro) => libro.isbn === isbn);
}

export function librosDelCatalogo(): readonly Libro[] {
  return LIBROS;
}
