// ─── Typography Tokens ────────────────────────────────────────────────────────
// Inter font scale for MyExpense — matches repo exactly.
// Import via the barrel:  import { typography } from '@/tokens';

export type TextStyle = {
  fontFamily: string;
  fontSize: number;
  lineHeight: number;
  fontWeight?: '400' | '500' | '600' | '700' | '800';
  letterSpacing?: number;
};

const F = {
  regular:   'Inter_400Regular',
  medium:    'Inter_500Medium',
  semiBold:  'Inter_600SemiBold',
  bold:      'Inter_700Bold',
  extraBold: 'Inter_800ExtraBold',
} as const;

export const typography = {
  // ── Headings ───────────────────────────────────────────────────────────────
  h1:       { fontFamily: F.extraBold, fontSize: 24, lineHeight: 32 } satisfies TextStyle,
  h2:       { fontFamily: F.bold,      fontSize: 20, lineHeight: 28 } satisfies TextStyle,
  h3:       { fontFamily: F.bold,      fontSize: 18, lineHeight: 24 } satisfies TextStyle,
  h4:       { fontFamily: F.bold,      fontSize: 16, lineHeight: 22 } satisfies TextStyle,
  h5:       { fontFamily: F.bold,      fontSize: 12, lineHeight: 16 } satisfies TextStyle,
  // ── Body ───────────────────────────────────────────────────────────────────
  bodyXL:   { fontFamily: F.regular,   fontSize: 18, lineHeight: 26 } satisfies TextStyle,
  bodyL:    { fontFamily: F.regular,   fontSize: 16, lineHeight: 24 } satisfies TextStyle,
  bodyM:    { fontFamily: F.regular,   fontSize: 14, lineHeight: 20 } satisfies TextStyle,
  bodyS:    { fontFamily: F.regular,   fontSize: 12, lineHeight: 18 } satisfies TextStyle,
  bodyXS:   { fontFamily: F.regular,   fontSize: 10, lineHeight: 14 } satisfies TextStyle,
  // ── Action (Buttons / CTAs) ────────────────────────────────────────────────
  actionL:  { fontFamily: F.semiBold,  fontSize: 16, lineHeight: 24, letterSpacing: 0.2 } satisfies TextStyle,
  actionM:  { fontFamily: F.semiBold,  fontSize: 14, lineHeight: 20, letterSpacing: 0.2 } satisfies TextStyle,
  actionS:  { fontFamily: F.semiBold,  fontSize: 12, lineHeight: 16, letterSpacing: 0.2 } satisfies TextStyle,
  // ── Caption ────────────────────────────────────────────────────────────────
  captionM: { fontFamily: F.semiBold,  fontSize: 12, lineHeight: 16, letterSpacing: 0.4 } satisfies TextStyle,
  // ── Heading aliases ────────────────────────────────────────────────────────
  heading2: { fontFamily: F.bold,      fontSize: 20, lineHeight: 28 } satisfies TextStyle,
  heading3: { fontFamily: F.bold,      fontSize: 18, lineHeight: 24 } satisfies TextStyle,
  heading4: { fontFamily: F.bold,      fontSize: 16, lineHeight: 22 } satisfies TextStyle,
  // ── Label ──────────────────────────────────────────────────────────────────
  labelM:   { fontFamily: F.semiBold,  fontSize: 12, lineHeight: 16, letterSpacing: 0.2 } satisfies TextStyle,
  labelS:   { fontFamily: F.semiBold,  fontSize: 11, lineHeight: 14, letterSpacing: 0.2 } satisfies TextStyle,
  // ── Caption alias ──────────────────────────────────────────────────────────
  caption:  { fontFamily: F.semiBold,  fontSize: 12, lineHeight: 16, letterSpacing: 0.4 } satisfies TextStyle,
  // ── Micro ──────────────────────────────────────────────────────────────────
  micro:    { fontFamily: F.regular,   fontSize: 10, lineHeight: 14 } satisfies TextStyle,
  // ── Amount display ─────────────────────────────────────────────────────────
  amountXL: { fontFamily: F.bold,      fontSize: 32, lineHeight: 40 } satisfies TextStyle,
  amountM:  { fontFamily: F.bold,      fontSize: 20, lineHeight: 28 } satisfies TextStyle,
  amountS:  { fontFamily: F.semiBold,  fontSize: 16, lineHeight: 22 } satisfies TextStyle,
  // ── Button aliases ─────────────────────────────────────────────────────────
  btnL:     { fontFamily: F.semiBold,  fontSize: 16, lineHeight: 24, letterSpacing: 0.2 } satisfies TextStyle,
  btnM:     { fontFamily: F.semiBold,  fontSize: 14, lineHeight: 20, letterSpacing: 0.2 } satisfies TextStyle,
} as const;

export type TypographyKey = keyof typeof typography;
