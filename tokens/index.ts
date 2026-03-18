// ─── Design Tokens — Barrel Export ───────────────────────────────────────────
// Import everything from one place:
//   import { colour, typography, space, radius } from '@/tokens';

export { colour } from "./colours";
export type { ColourKey } from "./colours";

export { typography } from "./typography";
export type { TextStyle, TypographyKey } from "./typography";

export { radius, space } from "./spacing";
export type { RadiusKey, SpaceKey } from "./spacing";

