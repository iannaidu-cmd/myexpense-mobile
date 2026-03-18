// ─── MXBadge ──────────────────────────────────────────────────────────────────
// Pill chip: primary / success / warning / danger / neutral variants

import { colour, typography } from "@/tokens";
import React from "react";
import { Text, View } from "react-native";

export type BadgeVariant =
  | "primary"
  | "success"
  | "warning"
  | "danger"
  | "neutral";

interface MXBadgeProps {
  label: string;
  variant?: BadgeVariant;
  dot?: boolean; // show coloured dot instead of filled bg
}

const BADGE_STYLES: Record<
  BadgeVariant,
  { bg: string; text: string; dot: string }
> = {
  primary: {
    bg: colour.primary50,
    text: colour.primary,
    dot: colour.primary,
  },
  success: {
    bg: "#E8F5F1",
    text: colour.success,
    dot: colour.successMid,
  },
  warning: {
    bg: "#FEF3ED",
    text: colour.warning,
    dot: colour.warning,
  },
  danger: {
    bg: "#FDEDEF",
    text: colour.danger,
    dot: colour.danger,
  },
  neutral: {
    bg: colour.surface2,
    text: colour.textHint,
    dot: colour.textHint,
  },
};

export function MXBadge({
  label,
  variant = "primary",
  dot = false,
}: MXBadgeProps) {
  const styles = BADGE_STYLES[variant];

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        alignSelf: "flex-start",
        backgroundColor: styles.bg,
        borderRadius: 100,
        paddingHorizontal: dot ? 8 : 12,
        paddingVertical: 4,
        gap: 6,
      }}
    >
      {dot && (
        <View
          style={{
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: styles.dot,
          }}
        />
      )}
      {!dot && (
        <Text
          style={{
            ...typography.captionM,
            color: styles.text,
            fontWeight: "700",
            letterSpacing: 0.2,
          }}
        >
          {label}
        </Text>
      )}
    </View>
  );
}
