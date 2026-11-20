import { EstadoCargando } from './EstadoCargando';
import { EstadoError } from './EstadoError';
import { EstadoVacio } from './EstadoVacio';

type Props = {
  cargando: boolean;
  error: string | null;
  onReintentar: () => void;
  mensajeCargando: string;
  mensajeVacio: string;
};

// Lo que muestra una lista cuando no tiene filas: cargando, error (con salida) o vacío.
export function EstadoLista({
  cargando,
  error,
  onReintentar,
  mensajeCargando,
  mensajeVacio,
}: Props) {
  if (cargando) return <EstadoCargando mensaje={mensajeCargando} />;
  if (error) {
    return <EstadoError mensaje={error} textoAccion="Reintentar" onAccion={onReintentar} />;
  }
  return <EstadoVacio mensaje={mensajeVacio} />;
}
