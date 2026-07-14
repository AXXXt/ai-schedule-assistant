export const spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
  screenX: 20,
  screenY: 16,
  touchTarget: 48
} as const;

export type AppSpacing = keyof typeof spacing;
