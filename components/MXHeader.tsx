import { colour, space, typography } from "@/tokens";
import { useRouter } from "expo-router";
import React from "react";
import { Platform, StatusBar, Text, TouchableOpacity, View } from "react-native";

// Extra top padding to clear the status bar on Android.
// SafeAreaView edges={["top"]} handles the inset at the container level,
// but we need additional breathing room so content doesn't crowd the top edge.
const ANDROID_EXTRA_TOP = Platform.OS === "android"
  ? Math.max((StatusBar.currentHeight ?? 24) - 16, 0)
  : 0;

interface MXHeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  backLabel?: string;
  right?: React.ReactNode;
}

export function MXHeader({
  title,
  subtitle,
  showBack = false,
  backLabel,
  right,
}: MXHeaderProps) {
  const router = useRouter();

  return (
    <View
      style={{
        paddingHorizontal: space.lg,
        paddingTop: space.lg + ANDROID_EXTRA_TOP,
        paddingBottom: space["4xl"],
      }}
    >
      {/* Top row — back button or right element */}
      {(showBack || right) && (
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: space.md,
          }}
        >
          {showBack ? (
            <TouchableOpacity
              onPress={() => router.back()}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              style={{ flexDirection: "row", alignItems: "center" }}
            >
              <Text style={{ color: colour.onPrimary, fontSize: 26, lineHeight: 30 }}>
                ‹
              </Text>
              {backLabel ? (
                <Text
                  style={{
                    ...typography.labelM,
                    color: "rgba(255,255,255,0.85)",
                    marginLeft: 4,
                  }}
                >
                  {backLabel}
                </Text>
              ) : null}
            </TouchableOpacity>
          ) : (
            <View />
          )}
          {right ?? <View style={{ width: 40 }} />}
        </View>
      )}

      {/* Title */}
      <Text style={{ ...typography.h3, color: colour.onPrimary }}>
        {title}
      </Text>

      {/* Subtitle */}
      {subtitle ? (
        <Text
          style={{
            ...typography.bodyS,
            color: "rgba(255,255,255,0.7)",
            marginTop: 2,
          }}
        >
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}
