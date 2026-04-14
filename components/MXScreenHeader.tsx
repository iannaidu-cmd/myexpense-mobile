// ─── MXScreenHeader ───────────────────────────────────────────────────────────
// white (default) or tinted (primary50 #EAF2FF) variant, back button

import { IconSymbol } from "@/components/ui/icon-symbol";
import { colour, space } from "@/tokens";
import React from "react";
import {
    Platform,
    StatusBar,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

type HeaderVariant = "white" | "tinted";

interface MXScreenHeaderProps {
  title: string;
  variant?: HeaderVariant;
  onBack?: () => void; // renders back button when provided
  rightAction?: React.ReactNode; // optional right side element
  subtitle?: string;
}

const STATUS_BAR_HEIGHT =
  Platform.OS === "android" ? (StatusBar.currentHeight ?? 24) : 0;

export function MXScreenHeader({
  title,
  variant = "white",
  onBack,
  rightAction,
  subtitle,
}: MXScreenHeaderProps) {
  const bg = variant === "tinted" ? colour.primary50 : colour.white;

  return (
    <View
      style={{
        backgroundColor: bg,
        paddingTop: STATUS_BAR_HEIGHT + space.md,
        paddingBottom: space.md,
        paddingHorizontal: space.lg,
        borderBottomWidth: variant === "white" ? 1 : 0,
        borderBottomColor: colour.surface2,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          minHeight: 36,
        }}
      >
        {/* Back button */}
        {onBack && (
          <TouchableOpacity
            onPress={onBack}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={{ marginRight: space.sm }}
          >
            <IconSymbol name="chevron.left" size={22} color={colour.text} />
          </TouchableOpacity>
        )}
        {/* Title + subtitle */}
        <View style={{ flex: 1 }}>
          <Text
            style={{ fontSize: 16, fontWeight: "600", color: colour.text }}
            numberOfLines={1}
          >
            {title}
          </Text>
          {subtitle ? (
            <Text
              style={{ fontSize: 12, color: colour.textHint, marginTop: 2 }}
              numberOfLines={1}
            >
              {subtitle}
            </Text>
          ) : null}
        </View>
        {/* Right action */}
        {rightAction ? (
          <View style={{ marginLeft: space.sm }}>{rightAction}</View>
        ) : null}
      </View>
    </View>
  );
}
