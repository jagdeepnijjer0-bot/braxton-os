export const Colors = {
  background: '#0A0A0A',
  surface: '#141414',
  surfaceElevated: '#1E1E1E',
  border: '#2A2A2A',
  borderSubtle: '#1E1E1E',

  gold: '#C9A84C',
  goldLight: '#E2C87A',
  goldDark: '#A07830',

  white: '#FFFFFF',
  textPrimary: '#F5F5F5',
  textSecondary: '#9A9A9A',
  textMuted: '#5A5A5A',

  success: '#4CAF84',
  error: '#E05555',
  warning: '#E0A055',
  info: '#5599E0',

  overlay: 'rgba(0,0,0,0.6)',
  overlayHeavy: 'rgba(0,0,0,0.85)',
} as const;

export type ColorKey = keyof typeof Colors;
