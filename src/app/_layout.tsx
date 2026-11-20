import { ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';

import { NavegadorRaiz } from '@/components/NavegadorRaiz';
import { TEMA_NAVEGACION } from '@/constants/navegacion';
import { BibliotecaProvider } from '@/context/BibliotecaContext';
import { useEsquema } from '@/hooks/useEsquema';
import { configurarNotificaciones } from '@/lib/notificaciones';

// La pantalla de carga queda visible hasta que se recuperan los datos guardados.
SplashScreen.preventAutoHideAsync();
configurarNotificaciones();

// Un deep link a una ruta de la pila raíz (por ejemplo /buscar) deja las pestañas debajo.
export const unstable_settings = {
  anchor: '(tabs)',
};

export default function LayoutRaiz() {
  const esquema = useEsquema();

  return (
    <ThemeProvider value={TEMA_NAVEGACION[esquema]}>
      <BibliotecaProvider>
        <NavegadorRaiz />
      </BibliotecaProvider>
    </ThemeProvider>
  );
}
