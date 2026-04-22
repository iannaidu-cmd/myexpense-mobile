import { IconSymbol } from "@/components/ui/icon-symbol";
import { colour, space, typography } from "@/tokens";
import { useRouter } from "expo-router";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

interface MXBackHeaderProps {
  title?: string;
  subtitle?: string;
  rightElement?: React.ReactNode;
  onBack?: () => void;
}

export function MXBackHeader({
  title,
  subtitle,
  rightElement,
  onBack,
}: MXBackHeaderProps) {
  const router = useRouter();

  const handleBack = () => {
    if (onBack) {
      onBack();
      return;
    }
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/(tabs)");
    }
  };

  return (
    <View style={{ paddingHorizontal: space.lg, paddingVertical: 6, marginBottom: 4 }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          minHeight: 44,
        }}
      >
        {/* Circle back button */}
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

        {/* Centered title */}
        <View style={{ flex: 1, alignItems: "center", paddingHorizontal: space.sm }}>
          {title ? (
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
          ) : null}
          {subtitle ? (
            <Text
              style={{
                ...typography.bodyXS,
                color: colour.textSub,
                textAlign: "center",
                marginTop: 1,
              }}
              numberOfLines={1}
            >
              {subtitle}
            </Text>
          ) : null}
        </View>

        {/* Optional right element or spacer */}
        {rightElement != null ? (
          <View style={{ marginLeft: space.sm }}>{rightElement}</View>
        ) : (
          <View style={{ width: 38 }} />
        )}
      </View>
    </View>
  );
}
