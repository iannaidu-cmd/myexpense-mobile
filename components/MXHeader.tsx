import { IconSymbol } from "@/components/ui/icon-symbol";
import { colour, space, typography } from "@/tokens";
import { useRouter } from "expo-router";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

interface MXHeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  /** @deprecated no longer displayed — kept for call-site compatibility */
  backLabel?: string;
  onBack?: () => void;
  right?: React.ReactNode;
  children?: React.ReactNode;
}

export function MXHeader({
  title,
  subtitle,
  showBack = false,
  onBack,
  right,
  children,
}: MXHeaderProps) {
  const router = useRouter();
  const handleBack = onBack ?? (() => router.back());

  return (
    <View style={{ paddingHorizontal: space.lg, paddingVertical: 6, marginBottom: 4 }}>
      {/* Three-column header row */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          minHeight: 44,
        }}
      >
        {/* Left: circle back button or spacer */}
        {showBack ? (
          <TouchableOpacity
            onPress={handleBack}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={{
              width: 38,
              height: 38,
              borderRadius: 19,
              backgroundColor: colour.white,
              borderWidth: 1,
              borderColor: colour.border,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <IconSymbol name="chevron.left" size={18} color={colour.text} />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 38 }} />
        )}

        {/* Center: title */}
        <View style={{ flex: 1, alignItems: "center", paddingHorizontal: space.sm }}>
          <Text
            style={{
              fontSize: 14,
              fontWeight: "600",
              color: colour.text,
              textAlign: "center",
              letterSpacing: -0.1,
            }}
            numberOfLines={1}
          >
            {title}
          </Text>
          {subtitle ? (
            <Text
              style={{
                ...typography.bodyXS,
                color: colour.textSub,
                textAlign: "center",
                marginTop: 1,
              }}
            >
              {subtitle}
            </Text>
          ) : null}
        </View>

        {/* Right: optional action or spacer */}
        {right != null ? right : <View style={{ width: 38 }} />}
      </View>

      {/* Optional extra content below header row */}
      {children ?? null}
    </View>
  );
}
