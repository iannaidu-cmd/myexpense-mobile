// ─── Colour Tokens ────────────────────────────────────────────────────────────
// Full Figma kit palette for MyExpense — matches repo exactly.
// Import via the barrel:  import { colour } from '@/tokens';

export const colour = {
  // ── Highlight (Primary Blue) ──────────────────────────────────────────────
  primary: "#006FFD", // main CTA, active icons, links
  primary300: "#2897FF", // hover/pressed state
  primary200: "#6FBAFF", // focus ring, soft accents
  primary100: "#B4D8FF", // selected backgrounds
  primary50: "#EAF2FF", // chip backgrounds, tinted cards

  // ── Neutral Dark (Text) ───────────────────────────────────────────────────
  text: "#1F2024", // headings, body text
  textMid: "#2F3036", // secondary headings
  textSub: "#494A50", // labels, captions
  textHint: "#71727A", // placeholder, disabled
  textDisabled: "#9095A0", // ghost text

  // ── Neutral Light (Surfaces) ──────────────────────────────────────────────
  border: "#C5C6CC", // input borders, dividers (strong)
  borderLight: "#D4D6DD", // card borders (medium)
  surface2: "#E8E9F1", // card border, inner divider (soft)
  surface1: "#F8F9FE", // inner section background
  white: "#FFFFFF", // card backgrounds

  // ── Page Background ───────────────────────────────────────────────────────
  background: "#EEEFF2", // all screen backgrounds

  // ── Support – Success ─────────────────────────────────────────────────────
  success: "#298267", // dark success text/icon
  successMid: "#3AC0A0", // teal accent
  successBg: "#E7F4E8", // success chip / banner background

  // ── Support – Warning ─────────────────────────────────────────────────────
  warning: "#E86339", // orange warning
  warningMid: "#FFB37C", // soft orange
  warningBg: "#FFF4E4", // warning banner background

  // ── Support – Error ───────────────────────────────────────────────────────
  danger: "#ED3241", // error red
  dangerMid: "#FF618D", // soft red
  dangerBg: "#FFE2E5", // error banner background

  // ── Accent/Brand ──────────────────────────────────────────────────────────
  accent: "#3AC0A0", // teal accent (brand)
  onPrimary: "#FFFFFF", // text/icon on primary

  // ── Info ──────────────────────────────────────────────────────────────────
  info: "#0288D1", // info blue
  infoLight: "#E3F2FD", // info background

  // ── Teal ──────────────────────────────────────────────────────────────────
  teal: "#3AC0A0", // alias for accent
  tealLight: "#E4F7F5", // light teal background

  // ── Semantic aliases (used across screens) ────────────────────────────────
  textPrimary: "#1F2024", // alias for text
  textSecondary: "#494A50", // alias for textSub
  textOnPrimary: "#FFFFFF", // alias for onPrimary
  bgCard: "#FFFFFF", // alias for white – card backgrounds
  bgPage: "#EEEFF2", // alias for background – screen backgrounds
  primaryLight: "#EAF2FF", // alias for primary50
  successLight: "#E7F4E8", // alias for successBg
  dangerLight: "#FFE2E5", // alias for dangerBg
  warningLight: "#FFF4E4", // alias for warningBg

  // ── Navigation bar ────────────────────────────────────────────────────────
  navBg: "#FFFFFF", // tab bar background
  navInactive: "#9095A0", // inactive tab icon/label

  // ── Legacy / screen aliases ────────────────────────────────────────────────
  navy: "#006FFD", // alias for primary — used by older screens
  bgLight: "#F8F9FE", // alias for surface1
  bgLighter: "#EEEFF2", // alias for background (page bg)
  skelBase: "#E8E9F1", // skeleton loading base colour (= surface2)
  skelShine: "#F8F9FE", // skeleton loading shimmer (= surface1)
  midNavy2: "#1976D2", // mid-blue accent
  navyDark: "#0D47A1", // deep navy
  gold: "#F59E0B", // amber / gold accent
} as const;

export type ColourKey = keyof typeof colour;
