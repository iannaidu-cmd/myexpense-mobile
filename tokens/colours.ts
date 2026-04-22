// ─── Colour Tokens ────────────────────────────────────────────────────────────
// Full design-system palette for MyExpense — warm cream + periwinkle theme.
// Import via the barrel:  import { colour } from '@/tokens';

export const colour = {
  // ── Primary (Periwinkle) ──────────────────────────────────────────────────
  primary: "#6B6AD8", // main CTA, active icons, links
  primary300: "#8A89E8", // hover/pressed state  (= accent2)
  primary200: "#A8A7F0", // focus ring, soft accents
  primary100: "#D8D7F5", // selected backgrounds  (= accentSoft)
  primary50: "#E8E7FA", // chip backgrounds, tinted cards  (= accentSoft2)

  // ── Ink (Text) ────────────────────────────────────────────────────────────
  text: "#0F0F1E", // headings, body text
  textMid: "#2A2840", // secondary headings
  textSub: "#6B6880", // labels, captions
  textHint: "#6B6880", // placeholder, disabled
  textDisabled: "#9A97B0", // ghost text

  // ── Warm Surfaces ─────────────────────────────────────────────────────────
  border: "#D6CFBC", // input borders, dividers (strong)
  borderLight: "#E3DDCD", // card borders (medium)
  surface2: "#F7F3E9", // card border, inner divider (soft)
  surface1: "#F7F3E9", // inner section background
  white: "#FFFFFF", // pure white surface

  // ── Page Background ───────────────────────────────────────────────────────
  background: "#F2EDE3", // all screen backgrounds

  // ── Support – Success ─────────────────────────────────────────────────────
  success: "#4CAF7A", // dark success text/icon
  successMid: "#4CAF7A", // green accent
  successBg: "#DDF0E4", // success chip / banner background

  // ── Support – Warning ─────────────────────────────────────────────────────
  warning: "#E8B16A", // warm warning
  warningMid: "#E8B16A", // soft warm
  warningBg: "#FCEAD9", // warning banner background

  // ── Support – Error ───────────────────────────────────────────────────────
  danger: "#ED3241", // error red (unchanged)
  dangerMid: "#FF618D", // soft red (unchanged)
  dangerBg: "#FFE2E5", // error banner background (unchanged)

  // ── Accent/Brand ──────────────────────────────────────────────────────────
  accent: "#6B6AD8", // periwinkle accent (brand)
  accent2: "#8A89E8", // lighter periwinkle
  accentSoft: "#D8D7F5", // very soft periwinkle tint
  accentSoft2: "#E8E7FA", // ultra-soft periwinkle tint
  accentDeep: "#4E4DB8", // deep periwinkle
  onPrimary: "#FFFFFF", // text/icon on primary

  // ── Noir (Hero Cards) ─────────────────────────────────────────────────────
  noir: "#171629", // hero card background
  noir2: "#1F1D34", // hero card secondary surface
  onNoir: "#FFFFFF", // primary text on noir
  onNoir2: "#A9A5BD", // secondary text on noir

  // ── Info ──────────────────────────────────────────────────────────────────
  info: "#6B6AD8", // info (periwinkle)
  infoLight: "#E8E7FA", // info background

  // ── Teal (legacy — mapped to green) ───────────────────────────────────────
  teal: "#4CAF7A", // mapped to success green
  tealLight: "#DDF0E4", // mapped to successBg

  // ── Semantic aliases (used across screens) ────────────────────────────────
  textPrimary: "#0F0F1E", // alias for text
  textSecondary: "#6B6880", // alias for textSub
  textOnPrimary: "#FFFFFF", // alias for onPrimary
  bgCard: "#FFFFFF", // card backgrounds
  bgPage: "#F2EDE3", // screen backgrounds
  primaryLight: "#E8E7FA", // alias for primary50
  successLight: "#DDF0E4", // alias for successBg
  dangerLight: "#FFE2E5", // alias for dangerBg
  warningLight: "#FCEAD9", // alias for warningBg

  // ── Brand Teal (logo smile arc) ───────────────────────────────────────────
  brandTeal: "#4DC9C4", // teal/cyan — logo smile arc

  // ── Navigation bar ────────────────────────────────────────────────────────
  navBg: "#F2EDE3", // tab bar background (matches page bg)
  navInactive: "#9A97B0", // inactive tab icon/label

  // ── Legacy / screen aliases ────────────────────────────────────────────────
  navy: "#6B6AD8", // alias for primary
  bgLight: "#F7F3E9", // alias for surface1
  bgLighter: "#F2EDE3", // alias for background (page bg)
  skelBase: "#E3DDCD", // skeleton loading base colour
  skelShine: "#F7F3E9", // skeleton loading shimmer
  midNavy2: "#8A89E8", // mid periwinkle accent
  navyDark: "#4E4DB8", // deep periwinkle
  gold: "#E8B16A", // warm amber / gold accent
} as const;

export type ColourKey = keyof typeof colour;
