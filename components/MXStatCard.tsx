import { colour, radius, space, typography } from "@/tokens";
import { Platform, Text, View, ViewStyle } from "react-native";

// ─── MXStatCard ───────────────────────────────────────────────────────────────
// A small stat display card used on the Home screen header overlap row.
//
// Usage:
//   <MXStatCard label="Total Expenses" value="R 24 850" />
//   <MXStatCard label="Deductions" value="R 8 420" valueColor={colour.success} />
// ─────────────────────────────────────────────────────────────────────────────

interface MXStatCardProps {
  label: string;
  value: string;
  valueColor?: string;
  style?: ViewStyle;
}

export default function MXStatCard({
  label,
  value,
  valueColor,
  style,
}: MXStatCardProps) {
  const shadow =
    Platform.OS === "ios"
      ? {
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.08,
          shadowRadius: 8,
        }
      : Platform.OS === "android"
        ? { elevation: 4 }
        : { boxShadow: "0px 2px 8px rgba(0,0,0,0.08)" };

  return (
    <View
      style={[
        {
          backgroundColor: colour.white,
          borderRadius: radius.md,
          padding: space.md,
          borderWidth: 1,
          borderColor: colour.borderLight,
          ...shadow,
        },
        style,
      ]}
    >
      <Text
        style={{
          ...typography.bodyXS,
          color: colour.textHint,
          marginBottom: space.xxs,
        }}
        numberOfLines={1}
      >
        {label}
      </Text>
      <Text
        style={{
          ...typography.h4,
          color: valueColor ?? colour.text,
        }}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {value}
      </Text>
    </View>
  );
}
