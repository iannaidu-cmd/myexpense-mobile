import { IconSymbol } from "@/components/ui/icon-symbol";
import { colour } from "@/tokens";
import { Tabs } from "expo-router";
import React from "react";
import { Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

function TabBarWrapper({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export default function TabLayout() {
  const insets = useSafeAreaInsets();

  // Android with gesture nav: insets.bottom = 0 but we need padding above nav bar
  // Android with 3-button nav: insets.bottom > 0
  // iOS: insets.bottom = 34 (home indicator)
  const bottomPadding = Platform.OS === "ios"
    ? insets.bottom
    : Math.max(insets.bottom, 8);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colour.navBg,
          borderTopWidth: 1,
          borderTopColor: colour.surface2,
          height: 56 + bottomPadding,
          paddingBottom: bottomPadding,
          paddingTop: 8,
          elevation: 8,
        },
        tabBarActiveTintColor: colour.primary,
        tabBarInactiveTintColor: colour.navInactive,
        tabBarLabelStyle: {
          fontSize: 10,
          fontFamily: "Inter_500Medium",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => (
            <IconSymbol name="house.fill" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="add-expense"
        options={{
          title: "Add",
          tabBarIcon: ({ color }) => (
            <IconSymbol name="plus.circle.fill" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="scan"
        options={{
          title: "Scan",
          tabBarIcon: ({ color }) => (
            <IconSymbol name="camera.fill" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="reports"
        options={{
          title: "Reports",
          tabBarIcon: ({ color }) => (
            <IconSymbol name="chart.bar.fill" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color }) => (
            <IconSymbol name="gearshape.fill" size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
