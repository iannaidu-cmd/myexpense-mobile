// ─── Spacing & Radius Tokens ──────────────────────────────────────────────────
// Consistent spatial scale for MyExpense

export const space = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  pill: 100,
} as const;

export type SpaceKey = keyof typeof space;
export type RadiusKey = keyof typeof radius;
