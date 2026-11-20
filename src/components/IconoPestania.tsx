import { Ionicons } from '@expo/vector-icons';

import { useColores } from '@/hooks/useColores';
import type { NombreIcono } from '@/types/iconos';

type Props = {
  nombre: NombreIcono;
  enfocada: boolean;
  tamanio: number;
};

export function IconoPestania({ nombre, enfocada, tamanio }: Props) {
  const colores = useColores();
  return (
    <Ionicons name={nombre} size={tamanio} color={enfocada ? colores.primario : colores.textoSuave} />
  );
}
