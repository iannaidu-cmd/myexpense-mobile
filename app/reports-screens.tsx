// ─── ReportsScreens ───────────────────────────────────────────────────────────
// This file is in app/ which means Expo Router treats it as a route.
// It needs a default export to avoid the "missing required default export" warning.
//
// If this file contains shared components (not a screen), move it to:
//   components/dashboard/ReportsScreens.tsx
// and delete this file.
//
// If it IS meant to be a screen route, replace this with your screen component.
// ─────────────────────────────────────────────────────────────────────────────

import { MXTabBar } from "@/components/MXTabBar";
import { colour, typography } from "@/tokens";
import { Text, View } from "react-native";

export default function ReportsScreensRoute() {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colour.background,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text style={{ ...typography.bodyM, color: colour.textHint }}>
        Reports
      </Text>
      <MXTabBar />
    </View>
  );
}
