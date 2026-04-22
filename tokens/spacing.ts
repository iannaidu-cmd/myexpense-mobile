// ─── Spacing & Radius Tokens ──────────────────────────────────────────────────
// Consistent spatial scale for MyExpense — matches repo exactly.
// Import via the barrel:  import { space, radius } from '@/tokens';

export const space = {
  xxs:   2,
  xs:    4,
  sm:    8,
  md:    12,
  lg:    16,
  xl:    20,
  xxl:   24,
  xxxl:  32,
  // Extended scale (bracket-notation aliases)
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  '5xl': 48,
} as const;

export type SpaceKey = keyof typeof space;

export const radius = {
  /** 10px – inputs, small cards */
  sm:   10,
  /** 14px – standard cards */
  md:   14,
  /** 20px – large cards, modals */
  lg:   20,
  /** 28px – large radius for bottom-sheet cards */
  xl:   28,
  /** 100px – pill buttons */
  pill: 100,
  /** 100px – alias for pill, fully rounded */
  full: 100,
} as const;

export type RadiusKey = keyof typeof radius;
