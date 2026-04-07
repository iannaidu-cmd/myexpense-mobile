/**
 * ErrorNoInternetScreen.tsx
 * Route: app/error-no-internet.tsx  (or rendered inline as a conditional overlay)
 *
 * Shown when the app detects no network connection.
 * Includes a retry action and guidance on offline-capable features.
 */

import { colour, radius, space, typography } from "@/tokens";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
    ActivityIndicator,
    Platform,
    SafeAreaView,
    StatusBar,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

// ─── Illustration ─────────────────────────────────────────────────────────────

function NoInternetIllustration() {
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
          backgroundColor: colour.dangerBg,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* WiFi arc layers */}
        {[56, 38, 22].map((size, i) => (
          <View
            key={i}
            style={{
              position: "absolute",
              width: size,
              height: size / 2,
              borderTopLeftRadius: size / 2,
              borderTopRightRadius: size / 2,
              borderWidth: 3,
              borderBottomWidth: 0,
              borderColor:
                i === 0
                  ? colour.dangerMid
                  : i === 1
                    ? colour.danger
                    : colour.danger,
              opacity: i === 0 ? 0.3 : i === 1 ? 0.6 : 1,
              top: 32 + i * 10,
            }}
          />
        ))}
        {/* Dot */}
        <View
          style={{
            position: "absolute",
            bottom: 30,
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: colour.danger,
          }}
        />
        {/* Strike-through */}
        <View
          style={{
            position: "absolute",
            width: 60,
            height: 3,
            backgroundColor: colour.danger,
            borderRadius: 2,
            transform: [{ rotate: "-45deg" }],
            opacity: 0.7,
          }}
        />
      </View>

      {/* Dashed ring */}
      <View
        style={{
          position: "absolute",
          width: 148,
          height: 148,
          borderRadius: 74,
          borderWidth: 1.5,
          borderColor: colour.dangerMid,
          borderStyle: "dashed",
          opacity: 0.4,
        }}
      />
    </View>
  );
}

// ─── Offline feature chip ─────────────────────────────────────────────────────

function OfflineChip({ label }: { label: string }) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: colour.successBg,
        borderRadius: radius.pill,
        paddingVertical: space.xxs,
        paddingHorizontal: space.sm,
        marginBottom: space.xs,
        alignSelf: "flex-start",
      }}
    >
      <Text style={{ fontSize: 12, marginRight: 4 }}>✓</Text>
      <Text
        style={{
          ...typography.bodyXS,
          color: colour.success,
          fontWeight: "600",
        }}
      >
        {label}
      </Text>
    </View>
  );
}

// ─── Main screen ─────────────────────────────────────────────────────────────

export default function ErrorNoInternetScreen() {
  const router = useRouter();
  const [retrying, setRetrying] = useState(false);

  const handleRetry = async () => {
    setRetrying(true);
    // Simulate a connectivity check (replace with real NetInfo check)
    await new Promise((resolve) => setTimeout(resolve, 1800));
    setRetrying(false);
    // TODO: if connected, navigate back or pop to previous screen
  };

  return (
    <View style={{ flex: 1, backgroundColor: colour.background }}>
      <StatusBar barStyle="light-content" backgroundColor={colour.danger} />

      {/* ── Red-tinted header ── */}
      <View
        style={{
          backgroundColor: colour.danger,
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
            Connection Error
          </Text>
          <Text
            style={{ ...typography.h2, color: colour.onPrimary, marginTop: 2 }}
          >
            No Internet
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
        <NoInternetIllustration />

        <Text
          style={{
            ...typography.h3,
            color: colour.text,
            textAlign: "center",
            marginBottom: space.sm,
          }}
        >
          You're offline
        </Text>

        <Text
          style={{
            ...typography.bodyM,
            color: colour.textSub,
            textAlign: "center",
            lineHeight: 22,
            marginBottom: space.xl,
            maxWidth: 280,
          }}
        >
          MyExpense needs a connection to sync your data and generate reports.
          Please check your Wi-Fi or mobile data and try again.
        </Text>

        {/* Offline capabilities */}
        <View
          style={{
            width: "100%",
            backgroundColor: colour.surface1,
            borderRadius: radius.md,
            padding: space.md,
            marginBottom: space.xxl,
            borderWidth: 1,
            borderColor: colour.borderLight,
          }}
        >
          <Text
            style={{
              ...typography.labelM,
              color: colour.textMid,
              marginBottom: space.sm,
            }}
          >
            Available offline:
          </Text>
          <OfflineChip label="View saved expenses" />
          <OfflineChip label="Add expenses (syncs when reconnected)" />
          <OfflineChip label="Scan receipts locally" />
        </View>

        {/* Retry button */}
        <TouchableOpacity
          activeOpacity={0.88}
          onPress={handleRetry}
          disabled={retrying}
          style={{
            backgroundColor: retrying ? colour.primary300 : colour.primary,
            borderRadius: radius.pill,
            paddingVertical: space.md,
            paddingHorizontal: space.xxl,
            alignItems: "center",
            width: "100%",
            flexDirection: "row",
            justifyContent: "center",
            marginBottom: space.sm,
            ...(Platform.OS === "ios"
              ? {
                  shadowColor: colour.primary,
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.25,
                  shadowRadius: 8,
                }
              : Platform.OS === "android"
                ? { elevation: 3 }
                : { boxShadow: "0 4px 10px rgba(0,111,253,0.25)" }),
          }}
        >
          {retrying && (
            <ActivityIndicator
              size="small"
              color={colour.onPrimary}
              style={{ marginRight: space.sm }}
            />
          )}
          <Text style={{ ...typography.actionM, color: colour.onPrimary }}>
            {retrying ? "Checking connection…" : "Try again"}
          </Text>
        </TouchableOpacity>

        {/* Go offline link */}
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ paddingVertical: space.sm }}
        >
          <Text style={{ ...typography.actionS, color: colour.textSub }}>
            Continue offline
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
