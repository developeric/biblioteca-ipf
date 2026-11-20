import { router, useLocalSearchParams } from 'expo-router';

import { Boton } from '@/components/Boton';
import { EstadoVacio } from '@/components/EstadoVacio';
import { PedidoDePermiso } from '@/components/PedidoDePermiso';
import { esRecurso } from '@/lib/permisos';

export default function PantallaPreviaPermiso() {
  const { recurso, isbn } = useLocalSearchParams<{ recurso: string; isbn?: string }>();

  if (!esRecurso(recurso)) {
    return (
      <EstadoVacio icono="help-circle-outline" mensaje="Esta app no usa ese permiso.">
        <Boton titulo="Volver" variante="secundario" onPress={() => router.back()} />
      </EstadoVacio>
    );
  }

  return <PedidoDePermiso recurso={recurso} isbn={isbn} />;
}
