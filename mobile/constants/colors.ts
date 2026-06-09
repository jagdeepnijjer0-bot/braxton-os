export const Colors = {
  background: '#000000',
  surface: '#252525',
  surfaceElevated: '#1A1A1A',
  border: '#2A2A2A',
  borderSubtle: '#1E1E1E',
  borderCard: 'rgba(255,255,255,0.15)',
  borderCardStrong: 'rgba(255,255,255,0.25)',

  gold: '#D4AF37',
  goldLight: '#E8CB5C',
  goldDark: '#A88B28',

  white: '#FFFFFF',
  textPrimary: '#FFFFFF',
  textSecondary: 'rgba(255,255,255,0.6)',
  textMuted: 'rgba(255,255,255,0.4)',

  success: '#4CAF84',
  error: '#E05555',
  warning: '#E0A055',
  info: '#5599E0',

  overlay: 'rgba(0,0,0,0.6)',
  overlayHeavy: 'rgba(0,0,0,0.85)',
} as const;

export type ColorKey = keyof typeof Colors;
