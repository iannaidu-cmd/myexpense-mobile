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

  // ── Mockup type roles (MyExpense Screens Redesign) ─────────────────────────
  // Exact sizes/weights/tracking from the mockup's CSS, named by role rather
  // than by size, so screens compare against the design doc directly instead
  // of guessing at "close enough" values from the generic scale above.
  eyebrow:     { fontFamily: F.bold,     fontSize: 10.5, lineHeight: 14, letterSpacing: 1.68 } satisfies TextStyle, // .eyebrow
  cardTitle:   { fontFamily: F.bold,     fontSize: 15,   lineHeight: 19, letterSpacing: -0.23 } satisfies TextStyle, // .h2
  mSub:        { fontFamily: F.medium,   fontSize: 12,   lineHeight: 17 } satisfies TextStyle, // .sub
  chipText:    { fontFamily: F.bold,     fontSize: 11.5, lineHeight: 14, letterSpacing: -0.06 } satisfies TextStyle, // .chip
  rowKey:      { fontFamily: F.medium,   fontSize: 13,   lineHeight: 16 } satisfies TextStyle, // .row .k
  rowValue:    { fontFamily: F.semiBold, fontSize: 14,   lineHeight: 17, letterSpacing: -0.14 } satisfies TextStyle, // .row .v
  mBtn:        { fontFamily: F.bold,     fontSize: 15,   lineHeight: 20, letterSpacing: -0.15 } satisfies TextStyle, // .btn
  mTbtn:       { fontFamily: F.semiBold, fontSize: 13.5, lineHeight: 19 } satisfies TextStyle, // .tbtn
  fieldLabel:  { fontFamily: F.semiBold, fontSize: 11,   lineHeight: 14, letterSpacing: 0.22 } satisfies TextStyle, // .field .lab
  fieldValue:  { fontFamily: F.semiBold, fontSize: 15,   lineHeight: 19, letterSpacing: -0.15 } satisfies TextStyle, // .field .val
  searchText:  { fontFamily: F.medium,   fontSize: 14,   lineHeight: 18 } satisfies TextStyle, // .search span
  fchipText:   { fontFamily: F.semiBold, fontSize: 12.5, lineHeight: 16 } satisfies TextStyle, // .fchip
  itemTitle:   { fontFamily: F.bold,     fontSize: 13.5, lineHeight: 16, letterSpacing: -0.2 } satisfies TextStyle, // .item .t1
  itemSub:     { fontFamily: F.medium,   fontSize: 11.5, lineHeight: 14 } satisfies TextStyle, // .item .t2
  itemAmount:  { fontFamily: F.bold,     fontSize: 14,   lineHeight: 17, letterSpacing: -0.28 } satisfies TextStyle, // .item .amt
  noteText:    { fontFamily: F.medium,   fontSize: 11.5, lineHeight: 17 } satisfies TextStyle, // .note .nt
  // Line-heights below are given extra headroom over the mockup's CSS
  // (which used line-height:1) — React Native Text clips glyph
  // descenders (e.g. the tail on a "," in "0,00") when lineHeight is at
  // or below fontSize, unlike a browser's line box.
  heroAmount:  { fontFamily: F.extraBold, fontSize: 46,  lineHeight: 54, letterSpacing: -2.07 } satisfies TextStyle, // .amtbig
  claimValue:  { fontFamily: F.extraBold, fontSize: 22,  lineHeight: 28, letterSpacing: -0.66 } satisfies TextStyle, // .claim .cv
  statLabel:   { fontFamily: F.bold,     fontSize: 10.5, lineHeight: 14, letterSpacing: 1.26 } satisfies TextStyle, // .stat .sk
  statValue:   { fontFamily: F.extraBold, fontSize: 17,  lineHeight: 22, letterSpacing: -0.595 } satisfies TextStyle, // .stat .sv
  hintText:    { fontFamily: F.medium,   fontSize: 11,   lineHeight: 15 } satisfies TextStyle, // .hint
  groupKey:    { fontFamily: F.medium,   fontSize: 13,   lineHeight: 16 } satisfies TextStyle, // .group .grow .gk
  groupValue:  { fontFamily: F.semiBold, fontSize: 13.5, lineHeight: 16 } satisfies TextStyle, // .group .grow .gv
  totalKey:    { fontFamily: F.bold,     fontSize: 13.5, lineHeight: 16 } satisfies TextStyle, // .group .tot .gk
  totalValue:  { fontFamily: F.extraBold, fontSize: 15,  lineHeight: 18, letterSpacing: -0.3 } satisfies TextStyle, // .group .tot .gv
  navTitle:    { fontFamily: F.bold,     fontSize: 16,   lineHeight: 20, letterSpacing: -0.32 } satisfies TextStyle, // .nav .ttl .t
  navSubtitle: { fontFamily: F.medium,   fontSize: 12,   lineHeight: 15 } satisfies TextStyle, // .nav .ttl .s
  aminiText:   { fontFamily: F.semiBold, fontSize: 12,   lineHeight: 15 } satisfies TextStyle, // .acc .amini
  progressLabel: { fontFamily: F.bold,   fontSize: 11.5, lineHeight: 14 } satisfies TextStyle, // .prog .pl
} as const;

export type TypographyKey = keyof typeof typography;
