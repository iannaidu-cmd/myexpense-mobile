import { IconSymbol } from "@/components/ui/icon-symbol";
import { colour } from "@/tokens";
import { Tabs, useRouter } from "expo-router";
import React, { useState } from "react";
import { Modal, Platform, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const TAB_CONFIG: {
  name: string;
  label: string | null;
  icon: string;
  isFab?: boolean;
}[] = [
  { name: "index",       label: "Home",    icon: "house.fill"            },
  { name: "add-expense", label: "Track",   icon: "car.fill"              },
  { name: "scan",        label: null,      icon: "plus",       isFab: true },
  { name: "reports",     label: "Reports", icon: "chart.bar.fill"        },
  { name: "settings",    label: "Me",      icon: "person.fill"           },
];

const FAB_ACTIONS = [
  { label: "Scan receipt", subtitle: "Camera or gallery",      icon: "camera.fill"           as const, route: "/scan-receipt-camera" },
  { label: "Add expense",  subtitle: "Scan or enter manually", icon: "creditcard.fill"        as const, route: "/add-expense-manual" },
  { label: "Add income",   subtitle: "Invoice or payment",     icon: "dollarsign.circle.fill" as const, route: "/add-income" },
];

function CustomTabBar({
  state,
  navigation,
}: {
  state: any;
  navigation: any;
}) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const bp = Platform.OS === "ios" ? insets.bottom : Math.max(insets.bottom, 8);
  const [fabOpen, setFabOpen] = useState(false);

  const fabShadow =
    Platform.OS === "ios"
      ? {
          shadowColor: colour.primary,
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.45,
          shadowRadius: 16,
        }
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
        {(state.routes as any[]).map((route: any, index: number) => {
          const tab = TAB_CONFIG.find((t) => t.name === route.name);
          if (!tab) return null;
          const isFocused = state.index === index;

          const onPress = () => {
            if (tab.isFab) {
              setFabOpen(true);
              return;
            }
            if (tab.name === "add-expense") {
              router.push("/mileage-tracker" as any);
              return;
            }
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          if (tab.isFab) {
            return (
              <View
                key={route.key}
                style={{ flex: 1, alignItems: "center", overflow: "visible" }}
              >
                <TouchableOpacity
                  onPress={onPress}
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
              key={route.key}
              onPress={onPress}
              activeOpacity={0.7}
              style={{
                flex: 1,
                alignItems: "center",
                justifyContent: "center",
                paddingTop: 8,
              }}
            >
              <IconSymbol
                name={tab.icon as any}
                size={20}
                color={isFocused ? colour.primary : colour.navInactive}
              />
              <Text
                style={{
                  fontSize: 10,
                  fontFamily: "Inter_500Medium",
                  color: isFocused ? colour.text : colour.navInactive,
                  marginTop: 3,
                }}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="add-expense" />
      <Tabs.Screen name="scan" />
      <Tabs.Screen name="reports" />
      <Tabs.Screen name="settings" />
    </Tabs>
  );
}
