// ─── MXNavRow ─────────────────────────────────────────────────────────────────
// List row: icon box (primary50 bg), label, sub text, optional badge, chevron

import { colour, radius, space } from "@/tokens";
import React from "react";
import { TouchableOpacity, View } from "react-native";
import type { BadgeVariant } from "./MXBadge";

interface MXNavRowProps {
  icon: React.ReactNode;
  label: string;
  subText?: string;
  badge?: string;
  badgeVariant?: BadgeVariant;
  onPress?: () => void;
  iconBg?: string; // defaults to primary50
  showChevron?: boolean;
  dangerous?: boolean; // renders label in danger colour
}

export function MXNavRow({
  icon,
  label,
  subText,
  badge,
  badgeVariant = "primary",
  onPress,
  iconBg = colour.primary50,
  showChevron = true,
  dangerous = false,
}: MXNavRowProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.65}
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: space.md,
        paddingHorizontal: space.lg,
        gap: space.md,
        backgroundColor: "#FFFFFF",
      }}
    >
      {/* Icon box */}
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: radius.md,
          backgroundColor: iconBg,
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        {icon}
      </View>
      {/* ...rest of component... */}
    </TouchableOpacity>
  );
}
