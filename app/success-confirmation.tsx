/**
 * SuccessConfirmationScreen.tsx
 * Route: app/success-confirmation.tsx
 *
 * Generic success screen shown after key user actions (expense saved, receipt scanned,
 * report exported, subscription activated, etc.).
 *
 * Accepts route params to customise the message and next action:
 *   - title:    string   — e.g. "Expense Saved!"
 *   - subtitle: string   — e.g. "Your receipt has been categorised under S11(a)."
 *   - context:  string   — e.g. "expense" | "receipt" | "report" | "subscription"
 *   - nextRoute: string  — route to push on the primary CTA (defaults to dashboard)
 *   - nextLabel: string  — primary CTA label (defaults to "Go to Dashboard")
 */

import { MXTabBar } from "@/components/MXTabBar";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { colour, radius, space, typography } from "@/tokens";
import { ACTIVE_TAX_YEAR } from "@/types/database";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef } from "react";
import {
    Animated,
    Platform,
    SafeAreaView,
    StatusBar,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

// ─── Context-aware config ─────────────────────────────────────────────────────

type SuccessContext =
  | "expense"
  | "receipt"
  | "report"
  | "subscription"
  | "generic";

const CONTEXT_CONFIG: Record<
  SuccessContext,
  {
    icon: string;
    defaultTitle: string;
    defaultSubtitle: string;
    accentColour: string;
  }
> = {
  expense: {
    icon: "✅",
    defaultTitle: "Expense saved!",
    defaultSubtitle:
      "Your expense has been recorded and categorised for ITR12.",
    accentColour: colour.success,
  },
  receipt: {
    icon: "🧾",
    defaultTitle: "Receipt scanned!",
    defaultSubtitle:
      "Your receipt was processed and matched to an ITR12 category.",
    accentColour: colour.primary,
  },
  report: {
    icon: "📊",
    defaultTitle: "Report exported!",
    defaultSubtitle:
      "Your tax summary report is ready to share with your accountant.",
    accentColour: colour.teal,
  },
  subscription: {
    icon: "⭐",
    defaultTitle: "You're on Pro!",
    defaultSubtitle:
      "Welcome to MyExpense Pro. All premium features are now unlocked.",
    accentColour: colour.warning,
  },
  generic: {
    icon: "🎉",
    defaultTitle: "Done!",
    defaultSubtitle: "Your action was completed successfully.",
    accentColour: colour.success,
  },
};

// ─── Animated checkmark circle ───────────────────────────────────────────────

function SuccessCircle({
  icon,
  accentColour,
}: {
  icon: string;
  accentColour: string;
}) {
  const scale = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: 1,
        tension: 60,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={{
        opacity,
        transform: [{ scale }],
        alignItems: "center",
        justifyContent: "center",
        marginBottom: space.xl,
      }}
    >
      {/* Outer pulse ring */}
      <View
        style={{
          position: "absolute",
          width: 152,
          height: 152,
          borderRadius: 76,
          borderWidth: 1.5,
          borderColor: accentColour,
          opacity: 0.2,
        }}
      />
      {/* Inner circle */}
      <View
        style={{
          width: 120,
          height: 120,
          borderRadius: 60,
          backgroundColor: accentColour + "1A", // 10% opacity
          alignItems: "center",
          justifyContent: "center",
          borderWidth: 2,
          borderColor: accentColour + "33", // 20% opacity
        }}
      >
        <Text style={{ fontSize: 44 }}>{icon}</Text>
      </View>
    </Animated.View>
  );
}

// ─── Detail chip ──────────────────────────────────────────────────────────────

function DetailChip({ label, value }: { label: string; value: string }) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: space.sm,
        borderBottomWidth: 1,
        borderBottomColor: colour.borderLight,
      }}
    >
      <Text style={{ ...typography.bodyS, color: colour.textSub }}>
        {label}
      </Text>
      <Text
        style={{ ...typography.bodyS, color: colour.text, fontWeight: "600" }}
      >
        {value}
      </Text>
    </View>
  );
}

// ─── Main screen ─────────────────────────────────────────────────────────────

export default function SuccessConfirmationScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    title?: string;
    subtitle?: string;
    context?: SuccessContext;
    nextRoute?: string;
    nextLabel?: string;
    // Optional detail chips passed as JSON string
    details?: string; // JSON: Array<{ label: string; value: string }>
  }>();

  const ctx: SuccessContext = (params.context as SuccessContext) ?? "generic";
  const config = CONTEXT_CONFIG[ctx] ?? CONTEXT_CONFIG.generic;

  const title = params.title ?? config.defaultTitle;
  const subtitle = params.subtitle ?? config.defaultSubtitle;
  const nextRoute = params.nextRoute ?? "/";
  const nextLabel = params.nextLabel ?? "Go to dashboard";
  const details: Array<{ label: string; value: string }> = params.details
    ? JSON.parse(params.details)
    : [];

  const accentColour = config.accentColour;

  return (
    <View style={{ flex: 1, backgroundColor: colour.background }}>
      <StatusBar barStyle="dark-content" backgroundColor={colour.background} />

      {/* ── Blue header ── */}
      <View
        style={{
          backgroundColor: colour.primary,
          paddingTop: 52,
          paddingHorizontal: space.lg,
          paddingBottom: space.xxl,
        }}
      >
        <SafeAreaView>
          <Text
            style={{ ...typography.bodyS, color: "rgba(255,255,255,0.75)" }}
          >
            MyExpense
          </Text>
          <Text
            style={{ ...typography.h2, color: colour.onPrimary, marginTop: 2 }}
          >
            Action Complete
          </Text>
        </SafeAreaView>
      </View>

      {/* ── White card body ── */}
      <View
        style={{
          flex: 1,
          backgroundColor: colour.white,
          borderTopLeftRadius: radius.xl,
          borderTopRightRadius: radius.xl,
          marginTop: -space.lg,
          alignItems: "center",
          paddingHorizontal: space.xl,
          paddingTop: space.xxxl,
        }}
      >
        <SuccessCircle icon={config.icon} accentColour={accentColour} />

        <Text
          style={{
            ...typography.h2,
            color: colour.text,
            textAlign: "center",
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
            lineHeight: 22,
            marginBottom: space.xl,
            maxWidth: 300,
          }}
        >
          {subtitle}
        </Text>

        {/* Optional detail chips */}
        {details.length > 0 && (
          <View
            style={{
              width: "100%",
              backgroundColor: colour.surface1,
              borderRadius: radius.md,
              padding: space.md,
              marginBottom: space.xl,
              borderWidth: 1,
              borderColor: colour.borderLight,
            }}
          >
            {details.map((d, i) => (
              <DetailChip key={i} label={d.label} value={d.value} />
            ))}
          </View>
        )}

        {/* SARS ITR12 note for expense/receipt contexts */}
        {(ctx === "expense" || ctx === "receipt") && (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: colour.primary50,
              borderRadius: radius.pill,
              paddingVertical: space.xs,
              paddingHorizontal: space.md,
              marginBottom: space.xxl,
            }}
          >
            <IconSymbol name="building.columns.fill" size={14} color={colour.primary} style={{ marginRight: space.xs } as any} />
            <Text
              style={{
                ...typography.bodyXS,
                color: colour.primary,
                fontWeight: "600",
              }}
            >
              Categorised for SARS ITR12 · {ACTIVE_TAX_YEAR} tax year
            </Text>
          </View>
        )}

        {/* Primary CTA */}
        <TouchableOpacity
          activeOpacity={0.88}
          onPress={() => router.replace(nextRoute as any)}
          style={{
            backgroundColor: colour.primary,
            borderRadius: radius.pill,
            paddingVertical: space.md,
            paddingHorizontal: space.xxl,
            alignItems: "center",
            width: "100%",
            marginBottom: space.sm,
            ...(Platform.OS === "ios"
              ? {
                  shadowColor: colour.primary,
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.28,
                  shadowRadius: 8,
                }
              : Platform.OS === "android"
                ? { elevation: 4 }
                : { boxShadow: "0 4px 12px rgba(0,111,253,0.28)" }),
          }}
        >
          <Text style={{ ...typography.actionM, color: colour.onPrimary }}>
            {nextLabel}
          </Text>
        </TouchableOpacity>

        {/* Secondary: add another */}
        {(ctx === "expense" || ctx === "receipt") && (
          <TouchableOpacity
            onPress={() => router.replace("/add-expense")}
            style={{
              borderWidth: 1.5,
              borderColor: colour.primary,
              borderRadius: radius.pill,
              paddingVertical: space.md,
              paddingHorizontal: space.xxl,
              alignItems: "center",
              width: "100%",
            }}
          >
            <Text style={{ ...typography.actionM, color: colour.primary }}>
              Add Another Expense
            </Text>
          </TouchableOpacity>
        )}
      </View>
      <MXTabBar />
    </View>
  );
}
