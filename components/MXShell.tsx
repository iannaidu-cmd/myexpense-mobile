// ─── MXShell ──────────────────────────────────────────────────────────────────
// App shell — cream background, white bottom tab bar, periwinkle active indicator

import { colour, space } from "@/tokens";
import React, { useState } from "react";
import {
    Platform,
    SafeAreaView,
    StatusBar,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

// ── Tab definition ─────────────────────────────────────────────────────────────
export interface MXTab {
  key: string;
  label: string;
  icon: (active: boolean) => React.ReactNode;
  screen: React.ReactNode;
}

interface MXShellProps {
  tabs: MXTab[];
  initialTab?: string;
}

const STATUS_BAR_HEIGHT =
  Platform.OS === "android" ? (StatusBar.currentHeight ?? 24) : 0;

export function MXShell({ tabs, initialTab }: MXShellProps) {
  const [activeKey, setActiveKey] = useState(initialTab ?? tabs[0]?.key);

  const activeTab = tabs.find((t) => t.key === activeKey) ?? tabs[0];

  return (
    <View style={{ flex: 1, backgroundColor: colour.background }}>
      {/* Status bar spacer on Android */}
      {Platform.OS === "android" && (
        <View
          style={{ height: STATUS_BAR_HEIGHT, backgroundColor: colour.white }}
        />
      )}

      {/* Screen content */}
      <View style={{ flex: 1 }}>{activeTab?.screen}</View>

      {/* Bottom tab bar */}
      <SafeAreaView style={{ backgroundColor: colour.white }}>
        <View
          style={{
            flexDirection: "row",
            backgroundColor: colour.white,
            borderTopWidth: 1,
            borderTopColor: colour.surface2,
            paddingTop: space.sm,
            paddingBottom: Platform.OS === "ios" ? 0 : space.sm,
          }}
        >
          {tabs.map((tab) => {
            const isActive = tab.key === activeKey;
            return (
              <TouchableOpacity
                key={tab.key}
                onPress={() => setActiveKey(tab.key)}
                style={{ flex: 1, alignItems: "center" }}
              >
                {tab.icon(isActive)}
                <Text
                  style={{ color: isActive ? colour.primary : colour.textHint }}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </SafeAreaView>
    </View>
  );
}
