// ─── MXTabBar ─────────────────────────────────────────────────────────────────
// Persistent bottom navigation bar for screens outside the (tabs) group.
// Mirrors the CustomTabBar defined in app/(tabs)/_layout.tsx exactly.

import { IconSymbol } from "@/components/ui/icon-symbol";
import { colour } from "@/tokens";
import { usePathname, useRouter } from "expo-router";
import React from "react";
import { Platform, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const TABS = [
  { name: "Home",    route: "/(tabs)",           icon: "house.fill"      as const },
  { name: "Track",   route: "/mileage-tracker",  icon: "car.fill"        as const },
  { name: "Scan",    route: "/(tabs)/scan",       icon: "camera.fill"     as const, isFab: true },
  { name: "Reports", route: "/(tabs)/reports",    icon: "chart.bar.fill"  as const },
  { name: "Me",      route: "/(tabs)/settings",   icon: "person.fill"     as const },
] as const;

export function MXTabBar() {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const bp = Platform.OS === "ios" ? insets.bottom : Math.max(insets.bottom, 8);

  const isActive = (route: string) => {
    if (route === "/(tabs)") return pathname === "/" || pathname === "/(tabs)" || pathname === "/index";
    if (route === "/mileage-tracker") return pathname === "/mileage-tracker";
    return pathname.startsWith(route.replace("/(tabs)", ""));
  };

  const fabShadow =
    Platform.OS === "ios"
      ? { shadowColor: colour.primary, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.45, shadowRadius: 16 }
      : { elevation: 10 };

  return (
    <View
      style={{
        backgroundColor: colour.white,
        borderTopWidth: 1,
        borderTopColor: colour.borderLight,
        flexDirection: "row",
        paddingBottom: bp,
        height: 56 + bp,
        overflow: "visible",
      }}
    >
      {TABS.map((tab) => {
        const active = isActive(tab.route);

        if (tab.isFab) {
          return (
            <View key={tab.name} style={{ flex: 1, alignItems: "center", overflow: "visible" }}>
              <TouchableOpacity
                onPress={() => router.push(tab.route as any)}
                activeOpacity={0.85}
                style={{
                  position: "absolute",
                  top: -18,
                  width: 52,
                  height: 52,
                  borderRadius: 26,
                  backgroundColor: colour.primary,
                  alignItems: "center",
                  justifyContent: "center",
                  borderWidth: 4,
                  borderColor: colour.white,
                  ...fabShadow,
                }}
              >
                <IconSymbol name="camera.fill" size={22} color={colour.white} />
              </TouchableOpacity>
            </View>
          );
        }

        return (
          <TouchableOpacity
            key={tab.name}
            onPress={() => router.push(tab.route as any)}
            activeOpacity={0.7}
            style={{
              flex: 1,
              alignItems: "center",
              justifyContent: "center",
              paddingTop: 8,
            }}
          >
            <IconSymbol
              name={tab.icon}
              size={20}
              color={active ? colour.primary : colour.navInactive}
            />
            <Text
              style={{
                fontSize: 10,
                fontFamily: "Inter_500Medium",
                color: active ? colour.text : colour.navInactive,
                marginTop: 3,
              }}
            >
              {tab.name}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
