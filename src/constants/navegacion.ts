import { DarkTheme, DefaultTheme, type Theme } from 'expo-router';

import { COLORES, type Esquema } from './tema';

export const TEMA_NAVEGACION: Record<Esquema, Theme> = {
  claro: {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      primary: COLORES.claro.primario,
      background: COLORES.claro.fondo,
      card: COLORES.claro.superficie,
      text: COLORES.claro.texto,
      border: COLORES.claro.borde,
    },
  },
  oscuro: {
    ...DarkTheme,
    colors: {
      ...DarkTheme.colors,
      primary: COLORES.oscuro.primario,
      background: COLORES.oscuro.fondo,
      card: COLORES.oscuro.superficie,
      text: COLORES.oscuro.texto,
      border: COLORES.oscuro.borde,
    },
  },
};
