import { Tabs } from 'expo-router/js-tabs';

import { IconoPestania } from '@/components/IconoPestania';
import { useColores } from '@/hooks/useColores';

export const unstable_settings = {
  anchor: '(catalogo)',
};

type PropsIcono = {
  focused: boolean;
  size: number;
};

function iconoCatalogo({ focused, size }: PropsIcono) {
  return <IconoPestania nombre="library-outline" enfocada={focused} tamanio={size} />;
}

function iconoReservas({ focused, size }: PropsIcono) {
  return <IconoPestania nombre="bookmarks-outline" enfocada={focused} tamanio={size} />;
}

export default function LayoutTabs() {
  const colores = useColores();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colores.primario,
        tabBarInactiveTintColor: colores.textoSuave,
      }}>
      <Tabs.Screen
        name="(catalogo)"
        options={{ title: 'Catálogo', headerShown: false, tabBarIcon: iconoCatalogo }}
      />
      <Tabs.Screen
        name="reservas"
        options={{ title: 'Mis reservas', tabBarIcon: iconoReservas }}
      />
    </Tabs>
  );
}
