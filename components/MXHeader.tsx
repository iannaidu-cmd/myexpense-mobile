// ─── MXHeader ────────────────────────────────────────────────────────────────
// Single source of truth for ALL screen headers in the app.
//
// Standard layout (do not override per-screen):
//   paddingTop:        space.lg   (16)
//   paddingBottom:     space["4xl"] (40)
//   paddingHorizontal: space.lg   (16)
//
// Props:
//   title        — primary heading (h3, white)
//   subtitle     — secondary line below title (bodyS, 70% white)
//   showBack     — renders a ‹ back chevron above the title row
//   backLabel    — optional label next to the back chevron (e.g. "Reports")
//   right        — element placed inline on the right of the title (e.g. FY selector, save button)
//   children     — optional content injected below the subtitle (e.g. progress bars, kpi rows)
// ─────────────────────────────────────────────────────────────────────────────

import { colour, space, typography } from "@/tokens";
import { useRouter } from "expo-router";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

interface MXHeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  backLabel?: string;
  onBack?: () => void;
  right?: React.ReactNode;
  children?: React.ReactNode;
}

export function MXHeader({
  title,
  subtitle,
  showBack = false,
  backLabel,
  onBack,
  right,
  children,
}: MXHeaderProps) {
  const router = useRouter();
  const handleBack = onBack ?? (() => router.back());

  return (
    <View
      style={{
        paddingHorizontal: space.lg,
        paddingTop: space.lg,
        paddingBottom: space["4xl"],
      }}
    >
      {/* Back button row — shown above title when navigating into a sub-screen */}
      {showBack && (
        <TouchableOpacity
          onPress={handleBack}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginBottom: space.sm,
          }}
        >
          <Text
            style={{ color: colour.onPrimary, fontSize: 26, lineHeight: 30 }}
          >
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
      )}

      {/* Title + subtitle block, with right element vertically centred against both */}
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <View style={{ flex: 1 }}>
          <Text
            style={{ ...typography.h3, color: colour.onPrimary }}
            numberOfLines={1}
          >
            {title}
          </Text>
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
        {right ?? null}
      </View>

      {/* Extra content (progress bars, KPI rows, etc.) */}
      {children ?? null}
    </View>
  );
}
