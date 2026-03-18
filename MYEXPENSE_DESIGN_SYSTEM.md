# MyExpense — Design System & Migration Guide

## Based on: Mobile Apps Prototyping Kit (Figma Community)

### Design Reference: `figma.com/community/file/WkCw2CeRrqdu2kIHRIpPSy`

---

## 1. Design Language Overview

The target aesthetic is **clean, light, and trustworthy** — exactly what a South African expense & tax app needs.
White cards float on a soft grey canvas. A single confident blue drives all CTAs and active states.
Inter type, generous spacing, and pill-shaped buttons make the UI feel modern without being loud.

| Principle        | Implementation                                        |
| ---------------- | ----------------------------------------------------- |
| Background       | `#EEEFF2` page canvas (never white)                   |
| Cards            | `#FFFFFF` with `1px #E8E9F1` border, `radius 16`      |
| Primary action   | `#006FFD` pill buttons, full-width at bottom of forms |
| Text hierarchy   | `#1F2024` body → `#71727A` subtext → `#9095A0` hint   |
| Accent / success | `#3AC0A0` (teal, close to original brand)             |
| Headers          | White background, no heavy navy bars                  |
| Font             | Inter everywhere                                      |

---

## 2. Design Tokens — Colours

These are exact hex values from the Figma kit Styles page.

```ts
// tokens/colours.ts
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
} as const;
```

---

## 3. Design Tokens — Typography

Font: **Inter** (via `@expo-google-fonts/inter`)

```ts
// tokens/typography.ts
export const font = {
  family: "Inter",

  // ── Headings ─────────────────────────────────────────
  h1: { fontSize: 24, fontWeight: "800", lineHeight: 32 }, // Extra Bold
  h2: { fontSize: 18, fontWeight: "800", lineHeight: 26 }, // Extra Bold
  h3: { fontSize: 16, fontWeight: "800", lineHeight: 24 }, // Extra Bold
  h4: { fontSize: 14, fontWeight: "700", lineHeight: 20 }, // Bold
  h5: { fontSize: 12, fontWeight: "700", lineHeight: 18 }, // Bold

  // ── Body ─────────────────────────────────────────────
  bodyXL: { fontSize: 18, fontWeight: "400", lineHeight: 26 }, // Regular
  bodyL: { fontSize: 16, fontWeight: "400", lineHeight: 24 }, // Regular
  bodyM: { fontSize: 14, fontWeight: "400", lineHeight: 20 }, // Regular
  bodyS: { fontSize: 12, fontWeight: "400", lineHeight: 18 }, // Regular
  bodyXS: { fontSize: 10, fontWeight: "500", lineHeight: 14 }, // Medium

  // ── Action (Buttons / Labels) ─────────────────────────
  actionL: { fontSize: 14, fontWeight: "600", lineHeight: 20 }, // Semi Bold
  actionM: { fontSize: 12, fontWeight: "600", lineHeight: 18 }, // Semi Bold
  actionS: { fontSize: 10, fontWeight: "600", lineHeight: 14 }, // Semi Bold

  // ── Caption ───────────────────────────────────────────
  captionM: { fontSize: 10, fontWeight: "600", lineHeight: 14 }, // Semi Bold
} as const;
```

---

## 4. Design Tokens — Spacing & Radius

```ts
export const space = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const radius = {
  sm: 8, // chips, small badges
  md: 12, // input fields, small cards
  lg: 16, // main cards
  xl: 20, // large cards, modals
  pill: 100, // buttons (true pill shape)
} as const;
```

---

## 5. Colour Migration Cheatsheet

Every old `const C = {...}` token → new token

| Old `C.*`     | Old value | → New token         | New value |
| ------------- | --------- | ------------------- | --------- |
| `C.navy`      | `#2E2E7A` | `colour.primary`    | `#006FFD` |
| `C.navyDark`  | `#1A1A5C` | `colour.text`       | `#1F2024` |
| `C.teal`      | `#3BBFAD` | `colour.successMid` | `#3AC0A0` |
| `C.midNavy`   | `#3D3D9E` | `colour.primary300` | `#2897FF` |
| `C.midNavy2`  | `#5B5BB8` | `colour.primary200` | `#6FBAFF` |
| `C.bgLight`   | `#E8EAF6` | `colour.surface1`   | `#F8F9FE` |
| `C.bgLighter` | `#F5F6FF` | `colour.background` | `#EEEFF2` |
| `C.white`     | `#FFFFFF` | `colour.white`      | `#FFFFFF` |
| `C.text`      | `#1A1A2E` | `colour.text`       | `#1F2024` |
| `C.textSub`   | `#6B6B9E` | `colour.textHint`   | `#71727A` |
| `C.border`    | `#D0D3F0` | `colour.surface2`   | `#E8E9F1` |
| `C.success`   | `#27AE60` | `colour.success`    | `#298267` |
| `C.warning`   | `#F39C12` | `colour.warning`    | `#E86339` |
| `C.danger`    | `#E74C3C` | `colour.danger`     | `#ED3241` |

---

## 6. Component Library — MX Components

These are drop-in replacements using React Native StyleSheet (no extra library required).
They implement the Figma kit's exact visual language.

### 6.1 MXButton

```tsx
// components/MXButton.tsx
import React from "react";
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { colour, font, radius, space } from "../tokens";

type Variant = "primary" | "secondary" | "tertiary";
type Size = "L" | "M" | "S";

interface MXButtonProps {
  label: string;
  onPress: () => void;
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
  loading?: boolean;
  disabled?: boolean;
  icon?: string;
}

const sizeMap = {
  L: { paddingVertical: 16, paddingHorizontal: 24, ...font.actionL },
  M: { paddingVertical: 12, paddingHorizontal: 20, ...font.actionM },
  S: { paddingVertical: 8, paddingHorizontal: 16, ...font.actionS },
};

export function MXButton({
  label,
  onPress,
  variant = "primary",
  size = "L",
  fullWidth = false,
  loading = false,
  disabled = false,
  icon,
}: MXButtonProps) {
  const sz = sizeMap[size];
  const isDisabled = disabled || loading;

  const containerStyle = [
    styles.base,
    {
      paddingVertical: sz.paddingVertical,
      paddingHorizontal: sz.paddingHorizontal,
    },
    variant === "primary" && styles.primary,
    variant === "secondary" && styles.secondary,
    variant === "tertiary" && styles.tertiary,
    fullWidth && styles.fullWidth,
    isDisabled && styles.disabled,
  ];

  const textStyle = [
    {
      fontSize: sz.fontSize,
      fontWeight: sz.fontWeight,
      lineHeight: sz.lineHeight,
    },
    variant === "primary" && { color: colour.white },
    variant === "secondary" && { color: colour.primary },
    variant === "tertiary" && { color: colour.primary },
    isDisabled && { color: colour.textDisabled },
  ];

  return (
    <TouchableOpacity
      style={containerStyle}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === "primary" ? colour.white : colour.primary}
          size="small"
        />
      ) : (
        <>
          {icon ? (
            <Text style={[textStyle[0], { marginRight: 6 }]}>{icon}</Text>
          ) : null}
          <Text style={textStyle}>{label}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.pill,
    gap: 6,
  },
  primary: {
    backgroundColor: colour.primary,
  },
  secondary: {
    backgroundColor: "transparent",
    borderWidth: 1.5,
    borderColor: colour.primary,
  },
  tertiary: {
    backgroundColor: "transparent",
  },
  fullWidth: {
    width: "100%",
  },
  disabled: {
    backgroundColor: colour.surface1,
    borderColor: colour.surface2,
  },
});
```

### 6.2 MXCard

```tsx
// components/MXCard.tsx
import React from "react";
import { View, StyleSheet, ViewStyle } from "react-native";
import { colour, radius, space } from "../tokens";

interface MXCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  padding?: number;
}

export function MXCard({ children, style, padding = space.lg }: MXCardProps) {
  return <View style={[styles.card, { padding }, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colour.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colour.surface2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
});
```

### 6.3 MXInput

```tsx
// components/MXInput.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TextInputProps,
} from "react-native";
import { colour, font, radius, space } from "../tokens";

interface MXInputProps extends TextInputProps {
  label?: string;
  hint?: string;
  error?: string;
  leftIcon?: string;
  rightIcon?: string;
}

export function MXInput({
  label,
  hint,
  error,
  leftIcon,
  rightIcon,
  style,
  ...props
}: MXInputProps) {
  const [focused, setFocused] = useState(false);

  const borderColor = error
    ? colour.danger
    : focused
      ? colour.primary
      : colour.surface2;

  return (
    <View style={styles.wrapper}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={[styles.inputRow, { borderColor }, style]}>
        {leftIcon ? <Text style={styles.icon}>{leftIcon}</Text> : null}
        <TextInput
          style={styles.input}
          placeholderTextColor={colour.textHint}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          {...props}
        />
        {rightIcon ? <Text style={styles.icon}>{rightIcon}</Text> : null}
      </View>
      {error ? (
        <Text style={styles.error}>{error}</Text>
      ) : hint ? (
        <Text style={styles.hint}>{hint}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: space.lg },
  label: {
    ...font.actionS,
    color: colour.textSub,
    marginBottom: space.xs,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderRadius: radius.md,
    backgroundColor: colour.white,
    paddingHorizontal: space.md,
    paddingVertical: space.md,
  },
  input: {
    flex: 1,
    ...font.bodyM,
    color: colour.text,
  },
  icon: { fontSize: 16, marginHorizontal: 4 },
  hint: { ...font.bodyXS, color: colour.textHint, marginTop: space.xs },
  error: { ...font.bodyXS, color: colour.danger, marginTop: space.xs },
});
```

### 6.4 MXStatCard

```tsx
// components/MXStatCard.tsx
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { colour, font, radius, space } from "../tokens";

interface MXStatCardProps {
  label: string;
  value: string;
  sub?: string;
  valueColor?: string;
  icon?: string;
}

export function MXStatCard({
  label,
  value,
  sub,
  valueColor = colour.text,
  icon,
}: MXStatCardProps) {
  return (
    <View style={styles.card}>
      {icon ? <Text style={styles.icon}>{icon}</Text> : null}
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.value, { color: valueColor }]}>{value}</Text>
      {sub ? <Text style={styles.sub}>{sub}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colour.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colour.surface2,
    padding: space.lg,
    margin: 5,
    minWidth: 140,
  },
  icon: { fontSize: 18, marginBottom: space.sm },
  label: {
    ...font.captionM,
    color: colour.textHint,
    marginBottom: space.xs,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  value: { ...font.h2 },
  sub: { ...font.bodyXS, color: colour.textHint, marginTop: space.xs },
});
```

### 6.5 MXScreenHeader

```tsx
// components/MXScreenHeader.tsx
import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
} from "react-native";
import { colour, font, space } from "../tokens";
import { NavigationProp } from "@react-navigation/native";

interface MXScreenHeaderProps {
  title: string;
  subtitle?: string;
  navigation?: NavigationProp<any>;
  rightElement?: React.ReactNode;
  tinted?: boolean; // true = primary50 tint, false = white
}

export function MXScreenHeader({
  title,
  subtitle,
  navigation,
  rightElement,
  tinted = false,
}: MXScreenHeaderProps) {
  const bg = tinted ? colour.primary50 : colour.white;

  return (
    <View style={[styles.header, { backgroundColor: bg }]}>
      <StatusBar barStyle="dark-content" backgroundColor={bg} />
      {navigation ? (
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
        >
          <Text style={styles.backText}>‹ Back</Text>
        </TouchableOpacity>
      ) : null}
      <View style={styles.titleRow}>
        <View style={{ flex: 1 }}>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
          <Text style={styles.title}>{title}</Text>
        </View>
        {rightElement}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: 56,
    paddingBottom: space.xl,
    paddingHorizontal: space.lg,
    borderBottomWidth: 1,
    borderBottomColor: colour.surface2,
  },
  backBtn: { marginBottom: space.sm },
  backText: { ...font.actionM, color: colour.primary },
  titleRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  subtitle: {
    ...font.captionM,
    color: colour.primary,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 4,
  },
  title: { ...font.h1, color: colour.text },
});
```

### 6.6 MXNavRow

```tsx
// components/MXNavRow.tsx
import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { colour, font, radius, space } from "../tokens";

interface MXNavRowProps {
  icon: string;
  label: string;
  sub: string;
  onPress: () => void;
  badge?: string;
}

export function MXNavRow({ icon, label, sub, onPress, badge }: MXNavRowProps) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.row} activeOpacity={0.7}>
      <View style={styles.iconBox}>
        <Text style={styles.iconText}>{icon}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.sub}>{sub}</Text>
      </View>
      {badge ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
      ) : null}
      <Text style={styles.chevron}>›</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
    borderBottomWidth: 1,
    borderBottomColor: colour.surface2,
    backgroundColor: colour.white,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colour.primary50,
    alignItems: "center",
    justifyContent: "center",
    marginRight: space.md,
  },
  iconText: { fontSize: 20 },
  label: { ...font.actionM, color: colour.text },
  sub: { ...font.bodyXS, color: colour.textHint, marginTop: 2 },
  badge: {
    backgroundColor: colour.primary50,
    borderRadius: radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginRight: space.sm,
  },
  badgeText: { ...font.captionM, color: colour.primary },
  chevron: { fontSize: 18, color: colour.textHint },
});
```

### 6.7 MXBadge

```tsx
// components/MXBadge.tsx
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { colour, font, radius } from "../tokens";

type BadgeVariant = "primary" | "success" | "warning" | "danger" | "neutral";

const variantMap: Record<BadgeVariant, { bg: string; text: string }> = {
  primary: { bg: colour.primary50, text: colour.primary },
  success: { bg: colour.successBg, text: colour.success },
  warning: { bg: colour.warningBg, text: colour.warning },
  danger: { bg: colour.dangerBg, text: colour.danger },
  neutral: { bg: colour.surface1, text: colour.textSub },
};

export function MXBadge({
  label,
  variant = "primary",
}: {
  label: string;
  variant?: BadgeVariant;
}) {
  const { bg, text } = variantMap[variant];
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={[styles.text, { color: text }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: "flex-start",
  },
  text: { ...font.captionM },
});
```

### 6.8 MXShell (replaces PhoneShell in every screen)

```tsx
// components/MXShell.tsx
import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colour, font, space } from "../tokens";
import { NavigationProp } from "@react-navigation/native";

const TABS = [
  { key: "Home", label: "Home", icon: "⊞" },
  { key: "Scan", label: "Scan", icon: "⊡" },
  { key: "Reports", label: "Reports", icon: "◈" },
  { key: "Settings", label: "Settings", icon: "⚙" },
];

export function MXShell({
  children,
  activeTab,
  navigation,
  scrollable = true,
}: {
  children: React.ReactNode;
  activeTab?: string;
  navigation?: NavigationProp<any>;
  scrollable?: boolean;
}) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.shell, { paddingBottom: 0 }]}>
      {scrollable ? (
        <ScrollView
          style={styles.content}
          contentContainerStyle={{ paddingBottom: space.xxxl }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
      ) : (
        <View style={styles.content}>{children}</View>
      )}
      <View
        style={[
          styles.tabBar,
          { paddingBottom: Math.max(insets.bottom, space.sm) },
        ]}
      >
        {TABS.map((tab) => {
          const active = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={styles.tabItem}
              onPress={() => navigation?.navigate(tab.key)}
              activeOpacity={0.7}
            >
              {active && <View style={styles.tabIndicator} />}
              <Text style={[styles.tabIcon, active && styles.tabIconActive]}>
                {tab.icon}
              </Text>
              <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: { flex: 1, backgroundColor: colour.background },
  content: { flex: 1 },
  tabBar: {
    flexDirection: "row",
    backgroundColor: colour.white,
    borderTopWidth: 1,
    borderTopColor: colour.surface2,
    paddingTop: space.sm,
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    position: "relative",
    paddingBottom: 4,
  },
  tabIcon: { fontSize: 22, color: colour.textHint },
  tabIconActive: { color: colour.primary },
  tabLabel: {
    ...font.captionM,
    color: colour.textHint,
    marginTop: 2,
    fontWeight: "400",
  },
  tabLabelActive: { color: colour.primary, fontWeight: "600" },
  tabIndicator: {
    position: "absolute",
    top: -8,
    width: 20,
    height: 3,
    backgroundColor: colour.primary,
    borderRadius: 2,
  },
});
```

---

## 7. Screen-by-Screen Redesign Brief

### Rules for every screen

1. Replace `const C = {...}` with `import { colour } from '../tokens'`
2. Replace `PhoneShell` with `MXShell`
3. Replace all page headers with `MXScreenHeader`
4. Wrap content sections in `MXCard` instead of bare inline-styled `View`
5. Replace all buttons with `MXButton`
6. Replace all `TextInput` usages with `MXInput`
7. Replace `NavRow` with `MXNavRow`
8. Replace `StatCard` with `MXStatCard`

### Key visual changes per screen

| Screen                                     | Before                           | After                                                              |
| ------------------------------------------ | -------------------------------- | ------------------------------------------------------------------ |
| **DashboardHomeScreen**                    | Navy header block, teal greeting | White/tinted header, `colour.text` title, `colour.primary` accents |
| **AddExpenseScreen**                       | Navy header + underline inputs   | White header, `MXInput` rounded borders, `MXBadge` for ITR12 codes |
| **TaxSummaryScreen**                       | NavyDark SARS dates card         | `MXCard` with `primary50` tint, `colour.primary` for dates         |
| **ITR12ExportSetupScreen**                 | Navy CTA button                  | `MXButton` variant="primary" fullWidth                             |
| **ScanReceiptCameraScreen**                | Camera overlay                   | Keep dark overlay, replace bottom with white `MXCard` + `MXButton` |
| **PaywallUpgradeScreen**                   | Navy header                      | White header, `primary50` feature cards, full-width primary button |
| **OnboardingScreen**                       | Any colour                       | White bg, Inter headings, full-width primary CTA at bottom         |
| **SuccessConfirmationScreen**              | Any colour                       | White + `successMid` icon circle, `MXButton` "Done"                |
| **ErrorScreens**                           | Any colour                       | `dangerBg` tint, `MXButton` "Try Again"                            |
| **CategoryBreakdown / DeductibilityGuide** | Navy header                      | `MXScreenHeader` tinted=true, `MXCard` content blocks              |
| **VATSummary**                             | Navy header                      | `MXScreenHeader`, blue progress bars using `colour.primary`        |

### ITR12 colour treatment

Replace all dark `navyDark` (`#1A1A5C`) blocks with `MXCard` using `backgroundColor: colour.primary50`. This keeps the "authoritative tax" feel with the kit's blue palette instead of heavy navy.

---

## 8. Migration Session Plan

| Session  | Date               | Focus                                                                                                                                 |
| -------- | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------- |
| **DS-1** | Mon 18 Mar         | Create `app/tokens/` folder + all token files. Create all MX components. Load Inter font in `_layout.tsx`.                            |
| **DS-2** | Tue 19 Mar         | Migrate `DashboardHomeScreen`, `AddExpenseScreen`, `QuickAddExpenseScreen`.                                                           |
| **DS-3** | Wed 20 Mar (2–4pm) | Migrate `TaxSummaryScreen`, all ITR12 screens, `CategoryBreakdownScreen`.                                                             |
| **DS-4** | Thu 21 Mar         | Migrate Scan screens, `ReceiptReviewScreen`, `RecentActivityFeedScreen`, `DeductibilityGuideScreen`, `VATSummary`, `TaxYearSelector`. |
| **DS-5** | Mon 24 Mar         | Migrate Onboarding, Auth, Paywall, Success/Error/Loading states. Final QA + screenshot review.                                        |

---

## 9. Quick Start Checklist

```
□ npm install @expo-google-fonts/inter expo-font
□ Create app/tokens/colours.ts
□ Create app/tokens/typography.ts
□ Create app/tokens/spacing.ts
□ Create app/tokens/index.ts  (re-exports: colour, font, space, radius)
□ Create app/components/MXButton.tsx
□ Create app/components/MXCard.tsx
□ Create app/components/MXInput.tsx
□ Create app/components/MXStatCard.tsx
□ Create app/components/MXScreenHeader.tsx
□ Create app/components/MXNavRow.tsx
□ Create app/components/MXBadge.tsx
□ Create app/components/MXShell.tsx
□ Create app/components/index.ts  (re-exports all MX components)
□ Load Inter in app/_layout.tsx via useFonts hook
□ Migrate DashboardHomeScreen — smoke test on device/sim
□ Migrate remaining screens one by one (DS-2 through DS-5)
□ Search codebase for "const C = {" — confirm zero results
□ Screenshot QA: every screen vs Figma kit aesthetic
```
