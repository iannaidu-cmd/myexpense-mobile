// ─── Colour Tokens ────────────────────────────────────────────────────────────
// Full Figma kit palette for MyExpense

export const colour = {
  // ── Highlight (Primary Blue) ──────────────────────────
  primary: "#006FFD", // main CTA, active icons, links
  primary300: "#2897FF", // hover/pressed state
  primary200: "#6FBAFF", // focus ring, soft accents
  primary100: "#B4D8FF", // selected backgrounds
  primary50: "#EAF2FF", // chip backgrounds, tinted cards

  // ── Neutral Dark (Text) ───────────────────────────────
  text: "#1F2024", // headings, body text
  textMid: "#2F3036", // secondary headings
  textSub: "#494A50", // labels, captions
  textHint: "#71727A", // placeholder, disabled
  textDisabled: "#9095A0", // ghost text

  // ── Neutral Light (Surfaces) ─────────────────────────
  border: "#C5C6CC", // input borders, dividers (strong)
  borderLight: "#D4D6DD", // card borders (medium)
  surface2: "#E8E9F1", // card border, inner divider (soft)
  surface1: "#F8F9FE", // inner section background
  white: "#FFFFFF", // card backgrounds

  // ── Page Background ───────────────────────────────────
  background: "#EEEFF2", // all screen backgrounds

  // ── Support — Success ─────────────────────────────────
  success: "#298267", // dark success text/icon
  successMid: "#3AC0A0", // teal accent (MyExpense brand continuity)
  successBg: "#E7F4E8", // success chip / banner background

  // ── Support — Warning ─────────────────────────────────
  warning: "#E86339", // orange warning
  warningMid: "#FFB37C", // soft orange
  warningBg: "#FFF4E4", // warning banner background

  // ── Support — Error ───────────────────────────────────
  danger: "#ED3241", // error red
  dangerMid: "#FF618D", // soft red
  dangerBg: "#FFE2E5", // error banner background

  // ── Accent/Brand ──────────────────────────────────────
  accent: "#3AC0A0", // teal accent (brand)
  onPrimary: "#FFFFFF", // text/icon on primary
} as const;

export type ColourKey = keyof typeof colour;
