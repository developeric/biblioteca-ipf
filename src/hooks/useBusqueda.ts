import { useCallback, useEffect, useState } from 'react';

import { DEMORA_BUSQUEDA_MS } from '@/constants/biblioteca';
import { buscarLibros } from '@/lib/api';
import type { Libro } from '@/types';

type Respuesta = {
  clave: string;
  libros: Libro[];
};

const MENSAJE_ERROR = 'No pudimos buscar en este momento. Intentá de nuevo.';

// Busca `q` con debounce. Solo devuelve resultados de la última búsqueda pedida.
export function useBusqueda(q: string) {
  const consulta = q.trim();
  const [intento, setIntento] = useState(0);
  const [respuesta, setRespuesta] = useState<Respuesta | null>(null);
  const [fallo, setFallo] = useState<string | null>(null);
  const clave = `${consulta}#${intento}`;

  useEffect(() => {
    if (!consulta) return;
    let vigente = true;
    const temporizador = setTimeout(async () => {
      try {
        const libros = await buscarLibros(consulta);
        if (vigente) setRespuesta({ clave, libros });
      } catch {
        if (vigente) setFallo(clave);
      }
    }, DEMORA_BUSQUEDA_MS);
    return () => {
      vigente = false;
      clearTimeout(temporizador);
    };
  }, [consulta, clave]);

  const reintentar = useCallback(() => setIntento((n) => n + 1), []);

  // Todo se deriva de la clave actual: una respuesta de otra búsqueda nunca se muestra.
  const resultados = respuesta?.clave === clave ? respuesta.libros : [];
  const error = fallo === clave ? MENSAJE_ERROR : null;
  const cargando = consulta !== '' && !error && respuesta?.clave !== clave;

  return { consulta, resultados, cargando, error, reintentar };
}
