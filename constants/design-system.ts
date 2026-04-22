/**
 * MyExpense Design System — warm cream + periwinkle palette.
 * Delegates to /tokens/colours.ts as single source of truth.
 */

import { colour, radius } from '@/tokens';

export const COLORS = {
  // Primary periwinkle
  primary:       colour.primary,       // #6B6AD8
  dark:          colour.accentDeep,    // #4E4DB8
  mid:           colour.accent2,       // #8A89E8
  light:         colour.primary200,    // #A8A7F0

  // Backgrounds
  background:    colour.background,    // #F2EDE3 cream canvas
  surface:       colour.surface1,      // #F7F3E9

  // Text
  text:          colour.text,          // #0F0F1E
  textSecondary: colour.textSub,       // #6B6880
  textLight:     'rgba(255,255,255,0.65)',

  // Accents & States
  accent:        colour.accent,        // #6B6AD8
  success:       colour.success,       // #4CAF7A
  error:         colour.danger,        // #ED3241
  warning:       colour.warning,       // #E8B16A

  // Borders & Dividers
  border:        colour.border,        // #D6CFBC
  divider:       colour.borderLight,   // #E3DDCD

  // Semantic greys → mapped to warm palette
  grey50:        colour.background,    // #F2EDE3
  grey100:       colour.surface1,      // #F7F3E9
  grey200:       colour.surface2,      // #F7F3E9
  grey300:       colour.borderLight,   // #E3DDCD
  grey400:       colour.border,        // #D6CFBC
  grey500:       colour.navInactive,   // #9A97B0
  grey600:       colour.textSub,       // #6B6880
  grey700:       colour.textMid,       // #2A2840
  grey800:       colour.text,          // #0F0F1E
  grey900:       colour.text,          // #0F0F1E

  // Interactive elements
  buttonBase:     colour.primary,
  buttonHover:    colour.accent2,
  buttonActive:   colour.accentDeep,
  buttonDisabled: colour.navInactive,

  // Overlay transparency
  overlayLight: 'rgba(107,106,216,0.06)',
  overlayDark:  'rgba(107,106,216,0.12)',
};

export const STYLES = {
  headerGradient: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 24,
  },

  buttonFilled: {
    borderRadius: radius.pill,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: COLORS.primary,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },

  buttonOutline: {
    borderRadius: radius.pill,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: COLORS.primary,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },

  inputUnderline: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingVertical: 8,
    fontSize: 16,
    color: COLORS.text,
  },

  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: COLORS.primary,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },

  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
  },

  togglePill: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 24,
    borderWidth: 1.5,
  },
};
