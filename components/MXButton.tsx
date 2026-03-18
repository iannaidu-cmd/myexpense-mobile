// ─── MXButton ─────────────────────────────────────────────────────────────────
// Variants: primary (solid pill), secondary (outlined), tertiary (text-only)

import { colour, radius, space, typography } from "@/tokens";
import React from "react";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";

type Variant = "primary" | "secondary" | "tertiary";
type Size = "L" | "M" | "S";

interface MXButtonProps {
  label: string;
  onPress: () => void;
  variant?: Variant;
  size?: Size;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode; // optional leading icon
  fullWidth?: boolean;
}

const HEIGHT: Record<Size, number> = { L: 56, M: 48, S: 36 };
const H_PAD: Record<Size, number> = { L: 24, M: 20, S: 16 };

export function MXButton({
  label,
  onPress,
  variant = "primary",
  size = "M",
  disabled = false,
  loading = false,
  icon,
  fullWidth = false,
}: MXButtonProps) {
  const isDisabled = disabled || loading;

  // ── Container style ────────────────────────────────────────────────────────
  const containerStyle: object = {
    height: HEIGHT[size],
    paddingHorizontal: H_PAD[size],
    borderRadius: radius.pill,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: space.xs,
    alignSelf: fullWidth ? "stretch" : "flex-start",
    opacity: isDisabled ? 0.4 : 1,

    ...(variant === "primary" && {
      backgroundColor: colour.primary,
    }),
    ...(variant === "secondary" && {
      backgroundColor: "transparent",
      borderWidth: 1.5,
      borderColor: colour.primary,
    }),
    ...(variant === "tertiary" && {
      backgroundColor: "transparent",
    }),
  };

  // ── Label style ───────────────────────────────────────────────────────────
  const labelStyle: object = {
    ...typography.actionM,
    color: variant === "primary" ? "#FFFFFF" : colour.primary,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.2,
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.7}
      style={containerStyle}
    >
      {icon && <View style={{ marginRight: 8 }}>{icon}</View>}
      {loading ? (
        <ActivityIndicator
          color={variant === "primary" ? "#FFF" : colour.primary}
        />
      ) : (
        <Text style={labelStyle}>{label}</Text>
      )}
    </TouchableOpacity>
  );
}
