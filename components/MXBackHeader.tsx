import { colour, space, typography } from "@/tokens";
import { useRouter } from "expo-router";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

// ─── MXBackHeader ─────────────────────────────────────────────────────────────
// Drop-in back-navigation header for all non-tab screens.
// Renders inside the blue SafeAreaView header zone.
//
// Usage:
//   <MXBackHeader title="Screen Title" />
//   <MXBackHeader title="Screen Title" rightElement={<SomeButton />} />
//
// Safe fallback: if there is no navigation stack entry to go back to,
// navigates home instead of crashing.
// ─────────────────────────────────────────────────────────────────────────────

interface MXBackHeaderProps {
  title?: string;
  subtitle?: string;
  rightElement?: React.ReactNode;
  onBack?: () => void; // override default back behaviour if needed
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
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: space.lg,
        paddingTop: space.sm,
        paddingBottom: space.lg,
        minHeight: 56,
      }}
    >
      {/* ← Back button */}
      <TouchableOpacity
        onPress={handleBack}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        style={{
          width: 36,
          height: 36,
          borderRadius: 18,
          backgroundColor: "rgba(255,255,255,0.18)",
          alignItems: "center",
          justifyContent: "center",
          marginRight: space.sm,
        }}
      >
        <Text style={{ color: colour.white, fontSize: 20, lineHeight: 22, marginTop: -1 }}>
          ‹
        </Text>
      </TouchableOpacity>

      {/* Title block */}
      <View style={{ flex: 1 }}>
        {title ? (
          <Text
            style={{
              ...typography.h3,
              color: colour.white,
              fontFamily: "Inter_700Bold",
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
              color: "rgba(255,255,255,0.75)",
              marginTop: 2,
            }}
            numberOfLines={1}
          >
            {subtitle}
          </Text>
        ) : null}
      </View>

      {/* Optional right element (e.g. Edit button, Done button) */}
      {rightElement ? (
        <View style={{ marginLeft: space.sm }}>{rightElement}</View>
      ) : null}
    </View>
  );
}
