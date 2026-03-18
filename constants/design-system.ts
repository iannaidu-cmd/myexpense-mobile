/**
 * MyExpense Design System Color Palette
 * Updated to match screenshot design language
 */

export const COLORS = {
  // Primary blue palette (updated from navy)
  primary: "#1565C0", // Main brand color
  dark: "#0D47A1", // Dark blue for headers
  mid: "#1976D2", // Mid blue
  light: "#42A5F5", // Light blue

  // Backgrounds
  background: "#FFFFFF", // White background (was #E8EAF6)
  surface: "#F5F5F5", // Surface/card background

  // Text colors
  text: "#0D47A1", // Dark text (was #1A1A5C)
  textSecondary: "#757575", // Muted text (was #8888BB)
  textLight: "rgba(255,255,255,0.65)",

  // Accents & States
  accent: "#0288D1", // Accent color (light blue)
  success: "#4CAF50",
  error: "#F44336",
  warning: "#FF9800",

  // Borders & Dividers
  border: "#E0E0E0", // Border color (was #D0D3F0)
  divider: "#E0E0E0",

  // Semantic greys
  grey50: "#FAFAFA",
  grey100: "#F5F5F5",
  grey200: "#EEEEEE",
  grey300: "#E0E0E0",
  grey400: "#BDBDBD",
  grey500: "#9E9E9E",
  grey600: "#757575",
  grey700: "#616161",
  grey800: "#424242",
  grey900: "#212121",

  // Interactive elements
  buttonBase: "#1565C0",
  buttonHover: "#1976D2",
  buttonActive: "#0D47A1",
  buttonDisabled: "#BDBDBD",

  // Overlay transparency
  overlayLight: "rgba(21,101,192,0.06)",
  overlayDark: "rgba(13,71,161,0.12)",
};

export const STYLES = {
  // Header styling
  headerGradient: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 24,
  },

  // Button styling - filled (pill-shaped)
  buttonFilled: {
    borderRadius: 28,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },

  // Button styling - outline (pill-shaped)
  buttonOutline: {
    borderRadius: 28,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },

  // Input styling - underline only
  inputUnderline: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingVertical: 8,
    fontSize: 16,
    color: COLORS.text,
  },

  // Radio button
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },

  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
  },

  // Toggle pill
  togglePill: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 24,
    borderWidth: 1.5,
  },
};
