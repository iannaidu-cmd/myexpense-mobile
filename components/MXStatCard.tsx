// ─── MXStatCard ───────────────────────────────────────────────────────────────
// Metric card: icon, UPPERCASE label, large value, sub text

import { colour, radius, space, typography } from "@/tokens";
import React from "react";
import { Text, View } from "react-native";
import { MXCard } from "./MXCard";

interface MXStatCardProps {
  icon: React.ReactNode;
  label: string; // shown UPPERCASE
  value: string; // e.g. "R 12,450"
  subText?: string; // e.g. "vs last month ↑ 8%"
  accentColor?: string; // icon container bg tint, defaults to primary50
  onPress?: () => void;
}

export function MXStatCard({
  icon,
  label,
  value,
  subText,
  accentColor = colour.primary50,
}: MXStatCardProps) {
  return (
    <MXCard style={{ gap: space.sm }}>
      {/* Icon pill */}
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: radius.md,
          backgroundColor: accentColor,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {icon}
      </View>

      {/* Label */}
      <Text
        style={{
          ...typography.captionM,
          color: colour.textHint,
          textTransform: "uppercase",
          letterSpacing: 0.8,
        }}
      >
        {label}
      </Text>

      {/* Value */}
      <Text
        style={{
          ...typography.h2,
          color: colour.text,
          marginTop: -space.xs,
        }}
        numberOfLines={1}
      >
        {value}
      </Text>

      {/* Sub text */}
      {subText && (
        <Text style={{ ...typography.captionM, color: colour.textHint }}>
          {subText}
        </Text>
      )}
    </MXCard>
  );
}
