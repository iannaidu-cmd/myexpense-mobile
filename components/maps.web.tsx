// components/maps.web.tsx
// ─── Web stub for react-native-maps ──────────────────────────────────────────
// react-native-maps is native-only. On web we render a placeholder box.
// Expo's platform-specific extensions (.web.tsx) mean this file is loaded
// instead of react-native-maps on web automatically.

import { colour, space, typography } from "@/tokens";
import React from "react";
import { Text, View } from "react-native";

const placeholder = (name: string) => () => (
  <View
    style={{
      flex: 1,
      backgroundColor: colour.surface1,
      alignItems: "center",
      justifyContent: "center",
      minHeight: 200,
    }}
  >
    <Text style={{ fontSize: 32, marginBottom: space.sm }}>🗺️</Text>
    <Text style={{ ...typography.bodyS, color: colour.textSub }}>
      Map unavailable on web
    </Text>
    <Text
      style={{ ...typography.bodyXS, color: colour.textHint, marginTop: 4 }}
    >
      {name} · Use the mobile app for live tracking
    </Text>
  </View>
);

export default {
  Marker: placeholder("Marker"),
  Polyline: placeholder("Polyline"),
};
export const Marker = placeholder("Marker");
export const Polyline = placeholder("Polyline");
export const PROVIDER_GOOGLE = undefined;
