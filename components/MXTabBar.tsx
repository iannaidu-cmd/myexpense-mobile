// ─── MXTabBar ─────────────────────────────────────────────────────────────────
// Persistent bottom navigation bar for screens outside the (tabs) group.
// Mirrors the native tab bar defined in app/(tabs)/_layout.tsx.

import { IconSymbol } from "@/components/ui/icon-symbol";
import { colour } from "@/tokens";
import { usePathname, useRouter } from "expo-router";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const TABS = [
  { name: "Home", route: "/(tabs)", icon: "house.fill" as const },
  {
    name: "Add",
    route: "/(tabs)/add-expense",
    icon: "plus.circle.fill" as const,
  },
  { name: "Scan", route: "/(tabs)/scan", icon: "camera.fill" as const },
  {
    name: "Reports",
    route: "/(tabs)/reports",
    icon: "chart.bar.fill" as const,
  },
  {
    name: "Settings",
    route: "/(tabs)/settings",
    icon: "gearshape.fill" as const,
  },
] as const;

export function MXTabBar() {
  const router = useRouter();
  const pathname = usePathname();
  const { bottom } = useSafeAreaInsets();

  const isActive = (route: string) =>
    route === "/(tabs)"
      ? pathname === "/" || pathname === "/(tabs)" || pathname === "/index"
      : pathname.startsWith(route.replace("/(tabs)", ""));

  return (
    <View
      style={{
        backgroundColor: colour.navBg,
        borderTopWidth: 1,
        borderTopColor: colour.surface2,
        paddingBottom: bottom,
      }}
    >
      <View style={{ flexDirection: "row", height: 56 }}>
        {TABS.map((tab) => {
          const active = isActive(tab.route);
          const color = active ? colour.primary : colour.navInactive;
          return (
            <TouchableOpacity
              key={tab.name}
              onPress={() => router.push(tab.route)}
              activeOpacity={0.7}
              style={{
                flex: 1,
                alignItems: "center",
                justifyContent: "center",
                gap: 2,
              }}
            >
              <IconSymbol name={tab.icon} size={24} color={color} />
              <Text
                style={{
                  fontSize: 10,
                  lineHeight: 14,
                  color,
                  fontFamily: "Inter_500Medium",
                }}
              >
                {tab.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}
