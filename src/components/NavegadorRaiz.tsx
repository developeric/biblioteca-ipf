import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';

import { useBiblioteca } from '@/hooks/useBiblioteca';

// Stack raíz de la app. Lo renderiza src/app/_layout.tsx dentro del Provider,
// porque necesita leer la sesión del Context para las rutas protegidas.
export function NavegadorRaiz() {
  const { listo, sesion } = useBiblioteca();

  useEffect(() => {
    if (listo) SplashScreen.hide();
  }, [listo]);

  // Mientras se cargan los datos guardados sigue visible la pantalla de carga: la app no se ve vacía.
  if (!listo) return null;

  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="buscar" options={{ title: 'Buscar' }} />
      <Stack.Screen
        name="reservar/[isbn]"
        options={{ presentation: 'modal', title: 'Confirmar reserva' }}
      />
      <Stack.Screen
        name="permisos/[recurso]"
        options={{ presentation: 'modal', title: 'Permiso' }}
      />
      <Stack.Screen name="reserva" options={{ headerShown: false }} />
      <Stack.Screen name="+not-found" options={{ title: 'Página no encontrada' }} />
      {/* Al iniciar sesión el login deja de existir y se reemplaza por el mostrador. */}
      <Stack.Protected guard={!sesion} redirectTo="/mostrador">
        <Stack.Screen
          name="login"
          options={{ presentation: 'modal', title: 'Ingreso del personal' }}
        />
      </Stack.Protected>
      <Stack.Protected guard={sesion}>
        <Stack.Screen name="mostrador" options={{ title: 'Mostrador' }} />
      </Stack.Protected>
    </Stack>
  );
}
