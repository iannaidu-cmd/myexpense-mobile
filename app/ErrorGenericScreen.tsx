import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { colour, space } from "@/tokens";
import { NavigationProp } from "@react-navigation/native";
import React, { useEffect, useRef, useState } from "react";
import {
    Animated,
    Easing,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

// ─── Types ────────────────────────────────────────────────────────────────────
type ErrorSeverity = "warning" | "error" | "critical";

interface Props {
  navigation?: NavigationProp<any>;
  /** Controls icon colour and urgency language */
  severity?: ErrorSeverity;
  /** Short title shown under icon */
  title?: string;
  /** Descriptive message */
  message?: string;
  /** Internal error code for support reference */
  errorCode?: string;
  /** Whether to show a "Contact Support" option */
  showSupport?: boolean;
  onRetry?: () => void;
  onGoHome?: () => void;
  onContactSupport?: () => void;
}

// ─── Brand Colours ────────────────────────────────────────────────────────────

const NAV_ICONS = { Home: "⊞", Scan: "⊡", Reports: "◈", Settings: "⚙" };

function PhoneShell({
  children,
  navigation,
}: {
  children: React.ReactNode;
  navigation?: NavigationProp<any>;
}) {
  const tabs = [
    { key: "Home", label: "Home", icon: NAV_ICONS.Home },
    { key: "Scan", label: "Scan", icon: NAV_ICONS.Scan },
    { key: "Reports", label: "Reports", icon: NAV_ICONS.Reports },
    { key: "Settings", label: "Settings", icon: NAV_ICONS.Settings },
  ];
  return (
    <ThemedView style={{ flex: 1, backgroundColor: colour.surface1 }}>
      <View style={{ flex: 1 }}>{children}</View>
      <View
        style={{
          flexDirection: "row",
          backgroundColor: colour.background,
          borderTopWidth: 1,
          borderTopColor: colour.border,
          paddingBottom: space.xs,
          paddingTop: space.xxs,
        }}
      >
        {tabs.map((t) => (
          <TouchableOpacity
            key={t.key}
            onPress={() => navigation?.navigate(t.key)}
            style={{ flex: 1, alignItems: "center" }}
          >
            <ThemedText style={{ fontSize: 20, color: colour.textSub }}>
              {t.icon}
            </ThemedText>
            <ThemedText
              style={{ fontSize: 10, marginTop: 2, color: colour.textSub }}
            >
              {t.label}
            </ThemedText>
          </TouchableOpacity>
        ))}
      </View>
    </ThemedView>
  );
}

// ─── Error Illustration ───────────────────────────────────────────────────────
function ErrorIllustration({ severity }: { severity: ErrorSeverity }) {
  const bounce = useRef(new Animated.Value(0)).current;

  const bgColour =
    severity === "warning"
      ? colour.warningLight
      : severity === "critical"
        ? colour.dangerLight
        : colour.surface2;
  const ringColour = severity === "warning" ? colour.warning : colour.danger;
  const innerColour = severity === "warning" ? colour.warning : colour.danger;
  const emoji =
    severity === "warning" ? "⚠️" : severity === "critical" ? "🔥" : "😕";

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(bounce, {
          toValue: -6,
          duration: 900,
          easing: Easing.out(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(bounce, {
          toValue: 0,
          duration: 900,
          easing: Easing.in(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.delay(1200),
      ]),
    ).start();
  }, []);

  return (
    <Animated.View style={{ transform: [{ translateY: bounce }] }}>
      <View
        style={{
          width: 120,
          height: 120,
          borderRadius: 60,
          backgroundColor: bgColour,
          borderWidth: 2,
          borderColor: ringColour,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <View
          style={{
            width: 84,
            height: 84,
            borderRadius: 42,
            backgroundColor: innerColour,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <ThemedText style={{ fontSize: 40 }}>{emoji}</ThemedText>
        </View>
      </View>
    </Animated.View>
  );
}

// ─── Expandable Technical Detail ──────────────────────────────────────────────
function TechnicalDetail({ errorCode }: { errorCode: string }) {
  const [open, setOpen] = useState(false);
  return (
    <ThemedView
      style={{
        width: "100%",
        backgroundColor: colour.surface2,
        borderRadius: space.md,
        overflow: "hidden",
        marginTop: space.md,
      }}
    >
      <TouchableOpacity
        onPress={() => setOpen((v) => !v)}
        style={{
          flexDirection: "row",
          alignItems: "center",
          padding: 12,
        }}
      >
        <ThemedText
          style={{
            flex: 1,
            fontSize: 12,
            color: colour.textSub,
            fontWeight: "600",
          }}
        >
          Technical Details
        </ThemedText>
        <ThemedText style={{ color: colour.textSub, fontSize: 14 }}>
          {open ? "∨" : "›"}
        </ThemedText>
      </TouchableOpacity>
      {open && (
        <ThemedView
          style={{
            paddingHorizontal: 12,
            paddingBottom: 12,
            borderTopWidth: 1,
            borderTopColor: colour.border,
          }}
        >
          <ThemedText
            style={{
              fontSize: 11,
              color: colour.textSub,
              fontFamily: "monospace",
              marginTop: 8,
            }}
          >
            Error Code: {errorCode}
          </ThemedText>
          <ThemedText
            style={{ fontSize: 11, color: colour.textSub, marginTop: 4 }}
          >
            Timestamp: {new Date().toISOString()}
          </ThemedText>
          <TouchableOpacity
            style={{
              marginTop: space.md,
              backgroundColor: colour.background,
              borderRadius: space.xxs,
              padding: space.xxs,
              alignItems: "center",
            }}
          >
            <ThemedText
              style={{ fontSize: 11, color: colour.primary, fontWeight: "600" }}
            >
              Copy to Clipboard
            </ThemedText>
          </TouchableOpacity>
        </ThemedView>
      )}
    </ThemedView>
  );
}

// ─── SCREEN: Error — Generic ─────────────────────────────────────────────────
export default function ErrorGenericScreen({
  navigation,
  severity = "error",
  title,
  message,
  errorCode,
  showSupport = true,
  onRetry,
  onGoHome,
  onContactSupport,
}: Props) {
  const severityDefaults: Record<
    ErrorSeverity,
    { title: string; message: string; cta: string }
  > = {
    warning: {
      title: "Something Needs Attention",
      message:
        "There was a minor issue processing your request. Your data is safe — please try again.",
      cta: "Try Again",
    },
    error: {
      title: "Something Went Wrong",
      message:
        "An unexpected error occurred. We've logged the issue and our team will look into it.",
      cta: "Retry",
    },
    critical: {
      title: "Critical Error",
      message:
        "A critical error has occurred. Please restart the app. If the issue persists, contact support.",
      cta: "Restart App",
    },
  };

  const defaults = severityDefaults[severity];
  const displayTitle = title ?? defaults.title;
  const displayMessage = message ?? defaults.message;

  const handleRetry = onRetry ?? (() => navigation?.goBack());
  const handleHome = onGoHome ?? (() => navigation?.navigate("Home"));
  const handleSupport =
    onContactSupport ?? (() => navigation?.navigate("HelpSupport"));

  const accentColour = severity === "warning" ? C.warning : C.danger;

  return (
    <PhoneShell navigation={navigation}>
      {/* Header */}
      <ThemedView
        style={{
          backgroundColor: colour.primary,
          paddingTop: space.xxl,
          paddingBottom: space.xl,
          paddingHorizontal: space.lg,
        }}
      >
        <ThemedText
          style={{
            color: colour.primary200,
            fontSize: 12,
            fontWeight: "600",
            letterSpacing: 1,
          }}
        >
          MYEXPENSE
        </ThemedText>
        <ThemedText
          style={{
            color: colour.onPrimary,
            fontSize: 22,
            fontWeight: "800",
            marginTop: 4,
          }}
        >
          {severity === "warning" ? "Warning" : "Error"}
        </ThemedText>
      </ThemedView>

      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          backgroundColor: colour.surface1,
          borderTopLeftRadius: space.xl,
          borderTopRightRadius: space.xl,
          marginTop: -16,
          alignItems: "center",
          justifyContent: "center",
          paddingHorizontal: space.lg,
          paddingVertical: space.xl,
        }}
      >
        {/* Severity stripe */}
        <View
          style={{
            width: "100%",
            height: 4,
            borderRadius: 2,
            backgroundColor:
              severity === "warning" ? colour.warning : colour.danger,
            marginBottom: space.xl,
            opacity: 0.6,
          }}
        />

        {/* Illustration */}
        <View style={{ marginBottom: space.xl }}>
          <ErrorIllustration severity={severity} />
        </View>

        {/* Copy */}
        <ThemedText
          style={{
            fontSize: 22,
            fontWeight: "800",
            color: colour.text,
            textAlign: "center",
            marginBottom: space.md,
          }}
        >
          {displayTitle}
        </ThemedText>
        <ThemedText
          style={{
            fontSize: 14,
            color: colour.textSub,
            textAlign: "center",
            lineHeight: 22,
            marginBottom: space.xl,
          }}
        >
          {displayMessage}
        </ThemedText>

        {/* Primary CTA */}
        <TouchableOpacity
          onPress={handleRetry}
          style={{
            backgroundColor: colour.primary,
            borderRadius: space.md,
            paddingVertical: space.md,
            width: "100%",
            alignItems: "center",
            marginBottom: space.md,
          }}
        >
          <ThemedText
            style={{ color: colour.onPrimary, fontSize: 15, fontWeight: "700" }}
          >
            {defaults.cta}
          </ThemedText>
        </TouchableOpacity>

        {/* Go Home */}
        <TouchableOpacity
          onPress={handleHome}
          style={{
            borderWidth: 2,
            borderColor: colour.accent,
            borderRadius: space.md,
            paddingVertical: space.md,
            width: "100%",
            alignItems: "center",
            marginBottom: showSupport ? space.md : 0,
          }}
        >
          <ThemedText
            style={{ color: colour.accent, fontSize: 15, fontWeight: "700" }}
          >
            Go to Home
          </ThemedText>
        </TouchableOpacity>

        {/* Contact Support */}
        {showSupport && (
          <TouchableOpacity
            onPress={handleSupport}
            style={{ marginTop: space.xxs }}
          >
            <ThemedText
              style={{ color: colour.textSub, fontSize: 13, fontWeight: "600" }}
            >
              Contact Support
            </ThemedText>
          </TouchableOpacity>
        )}

        {/* Technical details (collapsible) */}
        {errorCode && <TechnicalDetail errorCode={errorCode} />}

        {/* What was preserved note */}
        <View
          style={{
            width: "100%",
            marginTop: 24,
            backgroundColor: C.white,
            borderRadius: 12,
            padding: 14,
            borderWidth: 1,
            borderColor: C.border,
            flexDirection: "row",
            alignItems: "flex-start",
          }}
        >
          <Text style={{ fontSize: 18, marginRight: 10 }}>💾</Text>
          <Text
            style={{ flex: 1, fontSize: 12, color: C.textSub, lineHeight: 18 }}
          >
            Your data is safe. MyExpense saves your work locally, so nothing was
            lost due to this error.
          </Text>
        </View>
      </ScrollView>
    </PhoneShell>
  );
}
