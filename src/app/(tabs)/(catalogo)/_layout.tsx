import { Stack } from 'expo-router';

import { BotonPersonal } from '@/components/BotonPersonal';

// Un deep link a /libro/... o /escanear deja el Catálogo debajo en esta pila.
export const unstable_settings = {
  anchor: 'index',
};

function botonDelHeader() {
  return <BotonPersonal />;
}

export default function LayoutCatalogo() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Catálogo', headerRight: botonDelHeader }} />
      <Stack.Screen name="libro/[isbn]" options={{ title: 'Libro' }} />
      <Stack.Screen name="escanear" options={{ title: 'Escanear' }} />
    </Stack>
  );
}
