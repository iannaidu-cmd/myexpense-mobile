import { MXTabBar } from "@/components/MXTabBar";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { colour, radius, space, typography } from "@/tokens";
import { ACTIVE_TAX_YEAR } from "@/types/database";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef } from "react";
import {
    Animated,
    StatusBar,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

type SuccessContext = "expense" | "receipt" | "report" | "subscription" | "generic";

const CONTEXT_CONFIG: Record<
  SuccessContext,
  {
    icon: string;
    accentColour: string;
    defaultTitle: string;
    defaultSubtitle: string;
  }
> = {
  expense: {
    icon: "checkmark",
    accentColour: colour.primary,
    defaultTitle: "Expense saved",
    defaultSubtitle: "Your expense has been recorded and categorised for ITR12.",
  },
  receipt: {
    icon: "doc.text.fill",
    accentColour: colour.primary,
    defaultTitle: "Receipt scanned",
    defaultSubtitle: "Your receipt was processed and matched to an ITR12 category.",
  },
  report: {
    icon: "chart.bar.fill",
    accentColour: colour.teal,
    defaultTitle: "Report exported",
    defaultSubtitle: "Your tax summary report is ready to share with your accountant.",
  },
  subscription: {
    icon: "star.fill",
    accentColour: colour.warning,
    defaultTitle: "You're on Pro",
    defaultSubtitle: "Welcome to MyExpense Pro. All premium features are now unlocked.",
  },
  generic: {
    icon: "checkmark",
    accentColour: colour.primary,
    defaultTitle: "Done",
    defaultSubtitle: "Your action was completed successfully.",
  },
};


export default function SuccessConfirmationScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    title?: string;
    subtitle?: string;
    context?: string;
    nextRoute?: string;
    nextLabel?: string;
    details?: string;
  }>();

  const ctx = (params.context as SuccessContext) ?? "generic";
  const config = CONTEXT_CONFIG[ctx] ?? CONTEXT_CONFIG.generic;
  const title = params.title ?? config.defaultTitle;
  const subtitle = params.subtitle ?? config.defaultSubtitle;
  const nextRoute = params.nextRoute ?? "/";
  const nextLabel = params.nextLabel ?? "Go to dashboard";
  const details: Array<{ label: string; value: string }> = params.details
    ? JSON.parse(params.details)
    : [];
  const accent = config.accentColour;

  // Staggered entrance animations
  const iconScale = useRef(new Animated.Value(0)).current;
  const iconOpacity = useRef(new Animated.Value(0)).current;
  const contentY = useRef(new Animated.Value(24)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const buttonsY = useRef(new Animated.Value(16)).current;
  const buttonsOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.spring(iconScale, { toValue: 1, tension: 65, friction: 7, useNativeDriver: true }),
        Animated.timing(iconOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(contentOpacity, { toValue: 1, duration: 240, useNativeDriver: true }),
        Animated.spring(contentY, { toValue: 0, tension: 70, friction: 10, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(buttonsOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.spring(buttonsY, { toValue: 0, tension: 70, friction: 10, useNativeDriver: true }),
      ]),
    ]).start();
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: colour.background }}>
      <StatusBar barStyle="dark-content" backgroundColor={colour.background} />

      {/* Main centred content */}
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: space.xl }}>

        {/* Icon */}
        <Animated.View
          style={{
            opacity: iconOpacity,
            transform: [{ scale: iconScale }],
            alignItems: "center",
            marginBottom: space.xxl,
          }}
        >
          {/* Outer ring */}
          <View
            style={{
              position: "absolute",
              width: 128,
              height: 128,
              borderRadius: 64,
              backgroundColor: accent,
              opacity: 0.08,
            }}
          />
          {/* Mid ring */}
          <View
            style={{
              position: "absolute",
              width: 104,
              height: 104,
              borderRadius: 52,
              backgroundColor: accent,
              opacity: 0.12,
            }}
          />
          {/* Icon circle */}
          <View
            style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: accent,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <IconSymbol name={config.icon as any} size={34} color={colour.onPrimary} />
          </View>
        </Animated.View>

        {/* Text + details */}
        <Animated.View
          style={{
            opacity: contentOpacity,
            transform: [{ translateY: contentY }],
            alignItems: "center",
            width: "100%",
          }}
        >
          <Text
            style={{
              fontSize: 30,
              fontWeight: "700",
              color: colour.text,
              textAlign: "center",
              letterSpacing: -0.8,
              marginBottom: space.sm,
            }}
          >
            {title}
          </Text>

          <Text
            style={{
              ...typography.bodyM,
              color: colour.textSub,
              textAlign: "center",
              lineHeight: 23,
              maxWidth: 300,
              marginBottom: details.length > 0 ? space.xl : 0,
            }}
          >
            {subtitle}
          </Text>

          {/* Detail rows */}
          {details.length > 0 && (
            <View
              style={{
                width: "100%",
                backgroundColor: colour.noir,
                borderRadius: radius.lg,
                paddingHorizontal: space.lg,
                paddingVertical: space.sm,
                marginBottom: space.lg,
              }}
            >
              {details.map((d, i) => (
                <View
                  key={i}
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    paddingVertical: space.sm,
                    borderBottomWidth: i < details.length - 1 ? 1 : 0,
                    borderBottomColor: "rgba(255,255,255,0.08)",
                  }}
                >
                  <Text style={{ ...typography.bodyS, color: colour.onNoir2 }}>{d.label}</Text>
                  <Text style={{ ...typography.bodyS, color: colour.onNoir, fontWeight: "600" }}>{d.value}</Text>
                </View>
              ))}
            </View>
          )}

          {/* SARS badge */}
          {(ctx === "expense" || ctx === "receipt") && (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: colour.primary50,
                borderRadius: radius.pill,
                paddingVertical: 6,
                paddingHorizontal: space.md,
              }}
            >
              <IconSymbol
                name="building.columns.fill"
                size={13}
                color={colour.primary}
                style={{ marginRight: 6 } as any}
              />
              <Text style={{ ...typography.bodyXS, color: colour.primary, fontWeight: "600" }}>
                Categorised for SARS ITR12 · {ACTIVE_TAX_YEAR}
              </Text>
            </View>
          )}
        </Animated.View>
      </View>

      {/* Buttons pinned to bottom */}
      <Animated.View
        style={{
          opacity: buttonsOpacity,
          transform: [{ translateY: buttonsY }],
          paddingHorizontal: space.lg,
          paddingBottom: space.md,
        }}
      >
        <TouchableOpacity
          activeOpacity={0.88}
          onPress={() => router.replace(nextRoute as any)}
          style={{
            backgroundColor: colour.primary,
            borderRadius: radius.pill,
            height: 54,
            alignItems: "center",
            justifyContent: "center",
            marginBottom: (ctx === "expense" || ctx === "receipt") ? space.sm : 0,
          }}
        >
          <Text style={{ ...typography.btnL, color: colour.onPrimary }}>
            {nextLabel}
          </Text>
        </TouchableOpacity>

        {(ctx === "expense" || ctx === "receipt") && (
          <TouchableOpacity
            onPress={() => router.replace("/(tabs)/add-expense" as any)}
            style={{
              borderWidth: 1.5,
              borderColor: colour.primary,
              borderRadius: radius.pill,
              height: 54,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ ...typography.btnL, color: colour.primary }}>
              Add another expense
            </Text>
          </TouchableOpacity>
        )}
      </Animated.View>

      <MXTabBar />
    </View>
  );
}
