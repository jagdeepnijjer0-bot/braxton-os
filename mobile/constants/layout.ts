import { Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

export const Layout = {
  window: { width, height },
  isSmallDevice: width < 375,

  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
    xxxl: 64,
  },

  borderRadius: {
    sm: 6,
    md: 12,
    lg: 18,
    xl: 24,
    card: 32,
    full: 999,
  },

  fontSize: {
    xs: 10,
    sm: 12,
    md: 14,
    base: 16,
    lg: 18,
    xl: 22,
    xxl: 28,
    xxxl: 36,
    hero: 48,
  },

  letterSpacing: {
    tight: 0.03,
    normal: 0.08,
    wide: 0.12,
    wider: 0.16,
  },

  headerHeight: 64,
  drawerWidth: 0.85,
} as const;
