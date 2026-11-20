import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router/js-tabs';

import { useColores } from '@/hooks/useColores';

export const unstable_settings = {
  anchor: '(catalogo)',
};

type PropsIcono = {
  color: string;
  size: number;
};

function iconoCatalogo({ color, size }: PropsIcono) {
  return <Ionicons name="library-outline" color={color} size={size} />;
}

function iconoReservas({ color, size }: PropsIcono) {
  return <Ionicons name="bookmarks-outline" color={color} size={size} />;
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
