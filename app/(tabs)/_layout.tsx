import { IconSymbol } from "@/components/ui/icon-symbol";
import { colour, radius, space } from "@/tokens";
import { Tabs, useRouter } from "expo-router";
import React, { useState } from "react";
import { Modal, Platform, Pressable, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const TAB_CONFIG: {
  name: string;
  label: string | null;
  icon: string;
  isFab?: boolean;
}[] = [
  { name: "index",       label: "Home",    icon: "house.fill"           },
  { name: "add-expense", label: "Track",   icon: "car.fill"             },
  { name: "scan",        label: null,      icon: "camera.fill", isFab: true },
  { name: "reports",     label: "Reports", icon: "chart.bar.fill"       },
  { name: "settings",    label: "Me",      icon: "person.fill"          },
];

function CustomTabBar({
  state,
  navigation,
  fabOpen,
  onFabPress,
}: {
  state: any;
  navigation: any;
  fabOpen: boolean;
  onFabPress: () => void;
}) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const bp = Platform.OS === "ios" ? insets.bottom : Math.max(insets.bottom, 8);

  const fabShadow =
    Platform.OS === "ios"
      ? {
          shadowColor: colour.primary,
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.45,
          shadowRadius: 16,
        }
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
      {(state.routes as any[]).map((route: any, index: number) => {
        const tab = TAB_CONFIG.find((t) => t.name === route.name);
        if (!tab) return null;
        const isFocused = state.index === index;

        const onPress = () => {
          if (tab.isFab) {
            onFabPress();
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
                  backgroundColor: fabOpen ? colour.accentDeep : colour.primary,
                  alignItems: "center",
                  justifyContent: "center",
                  borderWidth: 4,
                  borderColor: colour.white,
                  ...fabShadow,
                }}
              >
                {fabOpen ? (
                  <IconSymbol name="xmark" size={20} color={colour.white} />
                ) : (
                  <IconSymbol name="camera.fill" size={22} color={colour.white} />
                )}
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
  );
}

function FabMenu({
  visible,
  onClose,
  tabBarHeight,
}: {
  visible: boolean;
  onClose: () => void;
  tabBarHeight: number;
}) {
  const router = useRouter();

  const handleAddExpense = () => {
    onClose();
    router.push("/(tabs)/add-expense" as any);
  };

  const handleAddIncome = () => {
    onClose();
    router.push("/add-income" as any);
  };

  const menuShadow =
    Platform.OS === "ios"
      ? { shadowColor: "#000", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.18, shadowRadius: 24 }
      : { elevation: 16 };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable
        style={{ flex: 1 }}
        onPress={onClose}
      >
        <View style={{ flex: 1, justifyContent: "flex-end" }}>
          {/* Popover card */}
          <Pressable
            onPress={(e) => e.stopPropagation()}
            style={{
              position: "absolute",
              bottom: tabBarHeight + 16,
              alignSelf: "center",
              width: 260,
              backgroundColor: colour.white,
              borderRadius: radius.xl,
              overflow: "hidden",
              ...menuShadow,
            }}
          >
            {/* Add expense row */}
            <TouchableOpacity
              onPress={handleAddExpense}
              activeOpacity={0.75}
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingVertical: 16,
                paddingHorizontal: 18,
                gap: 14,
                borderBottomWidth: 1,
                borderBottomColor: colour.borderLight,
              }}
            >
              <View style={{
                width: 40, height: 40, borderRadius: 12,
                backgroundColor: colour.primary50,
                alignItems: "center", justifyContent: "center",
              }}>
                <IconSymbol name="plus" size={20} color={colour.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: "600", color: colour.text }}>
                  Add expense
                </Text>
                <Text style={{ fontSize: 11, color: colour.textSub, marginTop: 1 }}>
                  Scan or enter manually
                </Text>
              </View>
            </TouchableOpacity>

            {/* Add income row */}
            <TouchableOpacity
              onPress={handleAddIncome}
              activeOpacity={0.75}
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingVertical: 16,
                paddingHorizontal: 18,
                gap: 14,
              }}
            >
              <View style={{
                width: 40, height: 40, borderRadius: 12,
                backgroundColor: colour.successBg,
                alignItems: "center", justifyContent: "center",
              }}>
                <IconSymbol name="plus" size={20} color={colour.success} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: "600", color: colour.text }}>
                  Add income
                </Text>
                <Text style={{ fontSize: 11, color: colour.textSub, marginTop: 1 }}>
                  Invoice or payment
                </Text>
              </View>
            </TouchableOpacity>
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
}

export default function TabLayout() {
  const [fabOpen, setFabOpen] = useState(false);
  const insets = useSafeAreaInsets();
  const bp = Platform.OS === "ios" ? insets.bottom : Math.max(insets.bottom, 8);
  const tabBarHeight = 56 + bp;

  return (
    <>
      <Tabs
        tabBar={(props) => (
          <CustomTabBar
            {...props}
            fabOpen={fabOpen}
            onFabPress={() => setFabOpen((v) => !v)}
          />
        )}
        screenOptions={{ headerShown: false }}
      >
        <Tabs.Screen name="index" />
        <Tabs.Screen name="add-expense" />
        <Tabs.Screen name="scan" />
        <Tabs.Screen name="reports" />
        <Tabs.Screen name="settings" />
      </Tabs>
      <FabMenu
        visible={fabOpen}
        onClose={() => setFabOpen(false)}
        tabBarHeight={tabBarHeight}
      />
    </>
  );
}
