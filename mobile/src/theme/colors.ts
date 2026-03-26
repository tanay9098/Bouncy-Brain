export const colors = {
  // Background layers
  bg: '#0f0f13',
  surface: '#18181f',
  surfaceAlt: '#1e1e28',
  card: '#22222e',
  border: '#2a2a38',

  // Brand / accent
  violet: '#7c3aed',
  violetLight: '#8b5cf6',
  violetDim: '#4c1d95',
  green: '#22c55e',
  greenDim: '#166534',
  amber: '#f59e0b',
  amberDim: '#92400e',
  red: '#ef4444',
  redDim: '#7f1d1d',
  blue: '#3b82f6',
  blueDim: '#1e3a5f',
  pink: '#ec4899',
  gold: '#eab308',

  // Text
  textPrimary: '#f0f0f8',
  textSecondary: '#a0a0b8',
  textMuted: '#606078',

  // Semantic
  success: '#22c55e',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6',

  // Energy colors
  energy: ['#ef4444', '#f97316', '#f59e0b', '#22c55e', '#7c3aed'],

  // White / black
  white: '#ffffff',
  black: '#000000',
  transparent: 'transparent',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const typography = {
  h1: { fontSize: 28, fontWeight: '700' as const, color: colors.textPrimary },
  h2: { fontSize: 22, fontWeight: '700' as const, color: colors.textPrimary },
  h3: { fontSize: 18, fontWeight: '600' as const, color: colors.textPrimary },
  body: { fontSize: 15, fontWeight: '400' as const, color: colors.textPrimary },
  bodySmall: { fontSize: 13, fontWeight: '400' as const, color: colors.textSecondary },
  caption: { fontSize: 11, fontWeight: '500' as const, color: colors.textMuted },
  label: { fontSize: 13, fontWeight: '600' as const, color: colors.textSecondary },
};
