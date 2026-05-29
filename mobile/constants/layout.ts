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
    full: 999,
  },

  fontSize: {
    xs: 11,
    sm: 13,
    md: 15,
    base: 16,
    lg: 18,
    xl: 22,
    xxl: 28,
    xxxl: 36,
    hero: 48,
  },

  tabBarHeight: 80,
  headerHeight: 56,
} as const;
