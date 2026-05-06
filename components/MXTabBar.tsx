// ─── MXTabBar ─────────────────────────────────────────────────────────────────
// Persistent bottom navigation bar for screens outside the (tabs) group.
// Mirrors the CustomTabBar defined in app/(tabs)/_layout.tsx exactly.

import { IconSymbol } from "@/components/ui/icon-symbol";
import { colour } from "@/tokens";
import { usePathname, useRouter } from "expo-router";
import React, { useState } from "react";
import { Modal, Platform, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const TABS = [
  { name: "Home",    route: "/(tabs)",             icon: "house.fill"     as const },
  { name: "Track",   route: "/mileage-tracker",    icon: "car.fill"       as const },
  { name: "Add",     route: "/scan-receipt-camera", icon: "plus"          as const, isFab: true },
  { name: "Reports", route: "/(tabs)/reports",      icon: "chart.bar.fill" as const },
  { name: "Me",      route: "/(tabs)/settings",     icon: "person.fill"   as const },
] as const;

const FAB_ACTIONS = [
  { label: "Scan receipt", subtitle: "Camera or gallery",      icon: "camera.fill"           as const, route: "/scan-receipt-camera" },
  { label: "Add expense",  subtitle: "Scan or enter manually", icon: "creditcard.fill"        as const, route: "/add-expense-manual" },
  { label: "Add income",   subtitle: "Invoice or payment",     icon: "dollarsign.circle.fill" as const, route: "/add-income" },
];

export function MXTabBar() {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const bp = Platform.OS === "ios" ? insets.bottom : Math.max(insets.bottom, 8);
  const [fabOpen, setFabOpen] = useState(false);

  const isActive = (route: string) => {
    if (route === "/(tabs)") return pathname === "/" || pathname === "/(tabs)" || pathname === "/index";
    if (route === "/mileage-tracker") return pathname === "/mileage-tracker";
    return pathname.startsWith(route.replace("/(tabs)", ""));
  };

  const fabShadow =
    Platform.OS === "ios"
      ? { shadowColor: colour.primary, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.45, shadowRadius: 16 }
      : { elevation: 10 };

  const handleFabAction = (route: string) => {
    setFabOpen(false);
    router.push(route as any);
  };

  return (
    <>
      <Modal
        visible={fabOpen}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setFabOpen(false)}
      >
        <View style={{ flex: 1 }}>
          {/* Backdrop */}
          <TouchableOpacity
            style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.45)" }}
            activeOpacity={1}
            onPress={() => setFabOpen(false)}
          />

          {/* Speed dial actions */}
          <View
            style={{
              position: "absolute",
              bottom: 86 + bp,
              left: 16,
              right: 16,
              backgroundColor: colour.white,
              borderRadius: 20,
              overflow: "hidden",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.12,
              shadowRadius: 24,
              elevation: 12,
            }}
          >
            {FAB_ACTIONS.map((action, index) => (
              <TouchableOpacity
                key={action.route}
                onPress={() => handleFabAction(action.route)}
                activeOpacity={0.7}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                  gap: 14,
                  borderTopWidth: index > 0 ? 1 : 0,
                  borderTopColor: colour.borderLight,
                }}
              >
                <View
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 10,
                    backgroundColor: colour.primary,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <IconSymbol name={action.icon} size={20} color={colour.white} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: "Inter_500Medium", fontSize: 15, color: colour.text }}>
                    {action.label}
                  </Text>
                  <Text style={{ fontFamily: "Inter_500Medium", fontSize: 12, color: colour.navInactive, marginTop: 2 }}>
                    {action.subtitle}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* Close button overlaid on the FAB position */}
          <View
            style={{
              position: "absolute",
              bottom: 22 + bp,
              alignSelf: "center",
            }}
          >
            <TouchableOpacity
              onPress={() => setFabOpen(false)}
              activeOpacity={0.85}
              style={{
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
              <IconSymbol name="xmark" size={22} color={colour.white} />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

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

          if ("isFab" in tab && tab.isFab) {
            return (
              <View key={tab.name} style={{ flex: 1, alignItems: "center", overflow: "visible" }}>
                <TouchableOpacity
                  onPress={() => setFabOpen(true)}
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
                  <IconSymbol name="camera.aperture" size={22} color={colour.white} />
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
    </>
  );
}
