import { MXBackHeader } from "@/components/MXBackHeader";
import { colour, radius, space, typography } from "@/tokens";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useState } from "react";
import {
    ScrollView,
    StatusBar,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const STORAGE_KEY = "mx_appearance_prefs";

type ThemeOption = "light" | "system";
type TextSizeOption = "small" | "medium" | "large";

interface AppearancePrefs {
  theme: ThemeOption;
  textSize: TextSizeOption;
  compactCards: boolean;
}

const DEFAULTS: AppearancePrefs = {
  theme: "light",
  textSize: "medium",
  compactCards: false,
};

// ─── Section Header ───────────────────────────────────────────────────────────
function SectionHeader({ title }: { title: string }) {
  return (
    <Text
      style={{
        ...typography.captionM,
        color: colour.textSub,
        letterSpacing: 0.8,
        paddingHorizontal: space.lg,
        paddingTop: space.lg,
        paddingBottom: space.sm,
        textTransform: "uppercase",
      }}
    >
      {title}
    </Text>
  );
}

// ─── Option Tile ──────────────────────────────────────────────────────────────
function OptionTile({
  label,
  sub,
  selected,
  onPress,
  badge,
}: {
  label: string;
  sub?: string;
  selected: boolean;
  onPress: () => void;
  badge?: string;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: space.lg,
        paddingVertical: space.md,
        borderBottomWidth: 1,
        borderBottomColor: colour.border,
        backgroundColor: colour.bgCard,
      }}
    >
      <View style={{ flex: 1 }}>
        <View
          style={{ flexDirection: "row", alignItems: "center", gap: space.sm }}
        >
          <Text
            style={{
              ...typography.labelM,
              color: selected ? colour.primary : colour.text,
            }}
          >
            {label}
          </Text>
          {badge ? (
            <View
              style={{
                backgroundColor: colour.surface2,
                borderRadius: radius.pill,
                paddingHorizontal: space.sm,
                paddingVertical: 2,
              }}
            >
              <Text style={{ ...typography.micro, color: colour.textHint }}>
                {badge}
              </Text>
            </View>
          ) : null}
        </View>
        {sub ? (
          <Text
            style={{
              ...typography.bodyXS,
              color: colour.textSub,
              marginTop: 2,
            }}
          >
            {sub}
          </Text>
        ) : null}
      </View>
      <View
        style={{
          width: 22,
          height: 22,
          borderRadius: 11,
          borderWidth: 2,
          borderColor: selected ? colour.primary : colour.border,
          backgroundColor: selected ? colour.primary : "transparent",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {selected ? (
          <View
            style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: colour.white,
            }}
          />
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function AppearanceSettingsScreen() {
  const [prefs, setPrefs] = useState<AppearancePrefs>(DEFAULTS);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (raw) setPrefs({ ...DEFAULTS, ...JSON.parse(raw) });
    });
  }, []);

  const save = (next: AppearancePrefs) => {
    setPrefs(next);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  return (
    <SafeAreaView
      edges={["top"]}
      style={{ flex: 1, backgroundColor: colour.background }}
    >
      <StatusBar barStyle="dark-content" backgroundColor={colour.background} />
      <MXBackHeader title="Appearance" />

      <ScrollView
        style={{
          flex: 1,
          backgroundColor: colour.background,
          borderTopLeftRadius: radius.xl,
          borderTopRightRadius: radius.xl,
        }}
        contentContainerStyle={{ paddingBottom: space["5xl"] }}
        showsVerticalScrollIndicator={false}
      >
        {/* Theme */}
        <SectionHeader title="Theme" />
        <View
          style={{
            borderTopWidth: 1,
            borderBottomWidth: 1,
            borderColor: colour.border,
          }}
        >
          <OptionTile
            label="Light"
            sub="Always use the light theme"
            selected={prefs.theme === "light"}
            onPress={() => save({ ...prefs, theme: "light" })}
          />
          <OptionTile
            label="System default"
            sub="Follows your device's dark/light setting"
            selected={prefs.theme === "system"}
            onPress={() => save({ ...prefs, theme: "system" })}
          />
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: space.lg,
              paddingVertical: space.md,
              backgroundColor: colour.bgCard,
            }}
          >
            <View style={{ flex: 1 }}>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: space.sm,
                }}
              >
                <Text
                  style={{ ...typography.labelM, color: colour.textDisabled }}
                >
                  Dark
                </Text>
                <View
                  style={{
                    backgroundColor: colour.primary50,
                    borderRadius: radius.pill,
                    paddingHorizontal: space.sm,
                    paddingVertical: 2,
                  }}
                >
                  <Text style={{ ...typography.micro, color: colour.primary }}>
                    Coming soon
                  </Text>
                </View>
              </View>
              <Text
                style={{
                  ...typography.bodyXS,
                  color: colour.textDisabled,
                  marginTop: 2,
                }}
              >
                Full dark mode — available in a future update
              </Text>
            </View>
            <View
              style={{
                width: 22,
                height: 22,
                borderRadius: 11,
                borderWidth: 2,
                borderColor: colour.surface2,
                backgroundColor: "transparent",
              }}
            />
          </View>
        </View>

        {/* Text size */}
        <SectionHeader title="Text size" />
        <View
          style={{
            borderTopWidth: 1,
            borderBottomWidth: 1,
            borderColor: colour.border,
          }}
        >
          {(
            [
              {
                value: "small",
                label: "Small",
                sub: "Compact — fits more on screen",
              },
              {
                value: "medium",
                label: "Medium",
                sub: "Default size — recommended",
              },
              { value: "large", label: "Large", sub: "Easier to read" },
            ] as const
          ).map((opt) => (
            <OptionTile
              key={opt.value}
              label={opt.label}
              sub={opt.sub}
              selected={prefs.textSize === opt.value}
              onPress={() => save({ ...prefs, textSize: opt.value })}
            />
          ))}
        </View>

        {/* Cards */}
        <SectionHeader title="Cards" />
        <View
          style={{
            borderTopWidth: 1,
            borderBottomWidth: 1,
            borderColor: colour.border,
          }}
        >
          <OptionTile
            label="Standard cards"
            sub="Full detail with icons and subtitles"
            selected={!prefs.compactCards}
            onPress={() => save({ ...prefs, compactCards: false })}
          />
          <OptionTile
            label="Compact cards"
            sub="Condensed rows — show more items at once"
            selected={prefs.compactCards}
            onPress={() => save({ ...prefs, compactCards: true })}
          />
        </View>

        {/* Note */}
        <View
          style={{
            marginHorizontal: space.lg,
            marginTop: space.lg,
            backgroundColor: colour.surface1,
            borderRadius: radius.md,
            padding: space.md,
          }}
        >
          <Text style={{ ...typography.bodyS, color: colour.textHint }}>
            Some display changes apply after restarting the app.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
