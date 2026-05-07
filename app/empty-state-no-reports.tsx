/**
 * EmptyStateNoReportsScreen.tsx
 * Route: app/empty-state-no-reports.tsx  (or rendered inline inside Reports screen)
 *
 * Shown when the user has no data to generate a report for the selected period.
 * Provides quick-action shortcuts to start adding expenses.
 */

import { MXTabBar } from "@/components/MXTabBar";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { colour, radius, space, typography } from "@/tokens";
import { useRouter } from "expo-router";
import React from "react";
import {
  Platform,
  SafeAreaView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// ─── Illustration ─────────────────────────────────────────────────────────────
// Simple SVG-style inline illustration using View primitives

function EmptyIllustration() {
  return (
    <View
      style={{
        alignItems: "center",
        justifyContent: "center",
        marginBottom: space.xl,
      }}
    >
      {/* Outer circle */}
      <View
        style={{
          width: 120,
          height: 120,
          borderRadius: 60,
          backgroundColor: colour.primary100,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* Chart bars */}
        <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 6 }}>
          {[40, 60, 30, 55].map((h, i) => (
            <View
              key={i}
              style={{
                width: 14,
                height: h * 0.55,
                borderRadius: 3,
                backgroundColor:
                  i === 1
                    ? colour.primary
                    : i === 3
                      ? colour.primary300
                      : colour.primary200,
                opacity: i % 2 === 0 ? 0.6 : 1,
              }}
            />
          ))}
        </View>
        {/* X-axis line */}
        <View
          style={{
            position: "absolute",
            bottom: 24,
            left: 18,
            right: 18,
            height: 1.5,
            backgroundColor: colour.primary300,
            opacity: 0.4,
          }}
        />
      </View>

      {/* Dashed circle ring */}
      <View
        style={{
          position: "absolute",
          width: 148,
          height: 148,
          borderRadius: 74,
          borderWidth: 1.5,
          borderColor: colour.primary200,
          borderStyle: "dashed",
          opacity: 0.5,
        }}
      />
    </View>
  );
}

// ─── Quick action row ─────────────────────────────────────────────────────────

function QuickAction({
  icon,
  label,
  onPress,
}: {
  icon: string;
  label: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={{
        flex: 1,
        backgroundColor: colour.surface1,
        borderRadius: radius.md,
        alignItems: "center",
        paddingVertical: space.md,
        paddingHorizontal: space.xs,
        marginHorizontal: space.xxs,
        borderWidth: 1,
        borderColor: colour.borderLight,
      }}
    >
      <Text style={{ fontSize: 24, marginBottom: space.xs }}>{icon}</Text>
      <Text
        style={{
          ...typography.bodyXS,
          color: colour.textMid,
          textAlign: "center",
          fontWeight: "500",
        }}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

// ─── Main screen ─────────────────────────────────────────────────────────────

export default function EmptyStateNoReportsScreen() {
  const router = useRouter();

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
          <TouchableOpacity
            onPress={() => router.back()}
            style={{ marginBottom: space.sm }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text
              style={{ color: colour.onPrimary, fontSize: 26, lineHeight: 28 }}
            >
              ‹
            </Text>
          </TouchableOpacity>
          <Text
            style={{ ...typography.bodyS, color: "rgba(255,255,255,0.75)" }}
          >
            Reports & Analytics
          </Text>
          <Text
            style={{ ...typography.h2, color: colour.onPrimary, marginTop: 2 }}
          >
            No Reports Yet
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
        <EmptyIllustration />

        <Text
          style={{
            ...typography.h3,
            color: colour.text,
            textAlign: "center",
            marginBottom: space.sm,
          }}
        >
          Nothing to report yet
        </Text>

        <Text
          style={{
            ...typography.bodyM,
            color: colour.textSub,
            textAlign: "center",
            lineHeight: 22,
            marginBottom: space.xxl,
            maxWidth: 280,
          }}
        >
          Once you've added expenses for this period, your reports and tax
          deduction summary will appear here.
        </Text>

        {/* Tax year indicator */}
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
          <IconSymbol name="calendar" size={14} color={colour.primary} style={{ marginRight: space.xs } as any} />
          <Text
            style={{
              ...typography.bodyS,
              color: colour.primary,
              fontWeight: "600",
            }}
          >
            Tax year: 1 Mar 2025 – 28 Feb 2026
          </Text>
        </View>

        {/* Quick actions */}
        <Text
          style={{
            ...typography.labelM,
            color: colour.textMid,
            alignSelf: "flex-start",
            marginBottom: space.sm,
          }}
        >
          Get started
        </Text>
        <View
          style={{
            flexDirection: "row",
            width: "100%",
            marginBottom: space.xl,
          }}
        >
          <QuickAction
            icon="📷"
            label={"Scan\nReceipt"}
            onPress={() => router.push("/scan-receipt-camera")}
          />
          <QuickAction
            icon="✏️"
            label={"Add\nExpense"}
            onPress={() => router.push("/(tabs)/add-expense")}
          />
          <QuickAction
            icon="📤"
            label={"Upload\nGallery"}
            onPress={() => router.push("/upload-from-gallery")}
          />
        </View>

        {/* Primary CTA */}
        <TouchableOpacity
          activeOpacity={0.88}
          onPress={() => router.push("/(tabs)/add-expense")}
          style={{
            backgroundColor: colour.primary,
            borderRadius: radius.pill,
            paddingVertical: space.md,
            paddingHorizontal: space.xxl,
            alignItems: "center",
            width: "100%",
            ...(Platform.OS === "ios"
              ? {
                  shadowColor: colour.primary,
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                }
              : Platform.OS === "android"
                ? { elevation: 4 }
                : { boxShadow: "0 4px 12px rgba(0,111,253,0.3)" }),
          }}
        >
          <Text style={{ ...typography.actionM, color: colour.onPrimary }}>
            Add Your First Expense
          </Text>
        </TouchableOpacity>
      </View>
      <MXTabBar />
    </View>
  );
}
