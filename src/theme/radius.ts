export const radius = {
  xs: 6,
  sm: 8,
  md: 12,
  card: 18,
  sheet: 20,
  round: 999
} as const;

export type AppRadius = keyof typeof radius;
