// ─── MXHeader ────────────────────────────────────────────────────────────────
// Single source of truth for screen headers across the entire app.
// Used by ALL screens — tab and non-tab — for pixel-perfect alignment.
//
// Standard values (do not override):
//   paddingTop:        space.lg   (16)
//   paddingBottom:     space["4xl"] (48)
//   paddingHorizontal: space.lg   (16)
//
// Usage examples:
//   <MXHeader title="Reports" />
//   <MXHeader title="Tax Summary" subtitle="SARS ITR12 · 2024/25" />
//   <MXHeader title="Expense Detail" showBack />
//   <MXHeader title="Category" showBack backLabel="Tax & ITR12" />
//   <MXHeader title="Reports" right={<TouchableOpacity>...</TouchableOpacity>} />

import { colour, space, typography } from "@/tokens";
import { useRouter } from "expo-router";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

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
        paddingTop: space.lg,
        paddingBottom: space["4xl"],
      }}
    >
      {/* Top row — back button + optional right content */}
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
              <Text style={{ color: colour.onPrimary, fontSize: 26, lineHeight: 30 }}>‹</Text>
              {backLabel ? (
                <Text style={{ ...typography.labelM, color: "rgba(255,255,255,0.85)", marginLeft: 4 }}>
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
        <Text style={{ ...typography.bodyS, color: "rgba(255,255,255,0.7)", marginTop: 2 }}>
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}
