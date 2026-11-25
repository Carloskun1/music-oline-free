import { Platform } from 'react-native';
/**
 * Escenario Neón: oscuridad de estudio nocturno, azul profundo con
 * acentos de morado neón. La portada del álbum es la protagonista.
 */
export const Colors = {
  light: {
    text: '#E6EAFB',
    background: '#0A0E2A',
    backgroundElement: '#141A45',
    backgroundSelected: '#1D2560',
    textSecondary: '#8A93C4',
    accent: '#9B5CFF',
    heading: '#7DD3FF',
    border: '#232B63',
    danger: '#FF6B81',
  },
  dark: {
    text: '#E6EAFB',
    background: '#0A0E2A',
    backgroundElement: '#141A45',
    backgroundSelected: '#1D2560',
    textSecondary: '#8A93C4',
    accent: '#9B5CFF',
    heading: '#7DD3FF',
    border: '#232B63',
    danger: '#FF6B81',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    display: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    display: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-sans)',
    display: 'var(--font-display)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const Radius = { md: 12, lg: 16 } as const;
export const TouchTarget = 44;
export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
