// ─── MXScreenHeader ───────────────────────────────────────────────────────────
// white (default) or tinted (primary50 #EAF2FF) variant, back button

import { colour, space } from "@/tokens";
import React from "react";
import {
    Platform,
    StatusBar,
    TouchableOpacity,
    View
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
  const bg = variant === "tinted" ? colour.primary50 : "#FFFFFF";

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
          >
            {/* Icon here */}
          </TouchableOpacity>
        )}
        {/* ...rest of component... */}
      </View>
    </View>
  );
}
