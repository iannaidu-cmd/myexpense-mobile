import { NavigationProp } from "@react-navigation/native";
import React, { useEffect, useRef, useState } from "react";
import { Animated, Easing, Text, TouchableOpacity, View } from "react-native";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Props {
  navigation?: NavigationProp<any>;
  /** What the user was trying to do when connectivity dropped */
  actionContext?: string;
  onRetry?: () => void;
  onGoOffline?: () => void;
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
    <View style={{ flex: 1, backgroundColor: C.bgLighter }}>
      <View style={{ flex: 1 }}>{children}</View>
      <View
        style={{
          flexDirection: "row",
          backgroundColor: C.white,
          borderTopWidth: 1,
          borderTopColor: C.border,
          paddingBottom: 8,
          paddingTop: 6,
        }}
      >
        {tabs.map((t) => (
          <TouchableOpacity
            key={t.key}
            onPress={() => navigation?.navigate(t.key)}
            style={{ flex: 1, alignItems: "center" }}
          >
            <Text style={{ fontSize: 20, color: C.textSub }}>{t.icon}</Text>
            <Text style={{ fontSize: 10, marginTop: 2, color: C.textSub }}>
              {t.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

// ─── Animated Signal Icon ─────────────────────────────────────────────────────
function NoSignalIllustration() {
  const pulse = useRef(new Animated.Value(1)).current;
  const shake = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Pulse the outer ring
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.08,
          duration: 1000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 1.0,
          duration: 1000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    ).start();

    // Subtle sway on the icon
    Animated.loop(
      Animated.sequence([
        Animated.timing(shake, {
          toValue: 4,
          duration: 600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(shake, {
          toValue: -4,
          duration: 600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(shake, {
          toValue: 0,
          duration: 600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.delay(2000),
      ]),
    ).start();
  }, []);

  return (
    <Animated.View style={{ transform: [{ scale: pulse }] }}>
      {/* Outer ring */}
      <View
        style={{
          width: 120,
          height: 120,
          borderRadius: 60,
          backgroundColor: "#FEF0EF",
          borderWidth: 2,
          borderColor: `${C.danger}30`,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* Inner circle */}
        <View
          style={{
            width: 84,
            height: 84,
            borderRadius: 42,
            backgroundColor: "#FDD9D7",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Animated.Text
            style={{ fontSize: 38, transform: [{ translateX: shake }] }}
          >
            📡
          </Animated.Text>
        </View>
      </View>

      {/* Strikethrough line */}
      <View
        style={{
          position: "absolute",
          top: "50%",
          left: -4,
          right: -4,
          height: 3,
          backgroundColor: C.danger,
          borderRadius: 2,
          transform: [{ rotate: "-35deg" }],
          opacity: 0.7,
        }}
      />
    </Animated.View>
  );
}

// ─── Offline Capability Badge ─────────────────────────────────────────────────
function OfflineBadge({ label }: { label: string }) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: C.bgLight,
        borderRadius: 20,
        paddingHorizontal: 12,
        paddingVertical: 5,
        marginRight: 8,
        marginBottom: 8,
      }}
    >
      <View
        style={{
          width: 6,
          height: 6,
          borderRadius: 3,
          backgroundColor: C.teal,
          marginRight: 6,
        }}
      />
      <Text style={{ fontSize: 12, color: C.text, fontWeight: "500" }}>
        {label}
      </Text>
    </View>
  );
}

// ─── SCREEN: Error — No Internet ─────────────────────────────────────────────
export default function ErrorNoInternetScreen({
  navigation,
  actionContext = "sync your expenses",
  onRetry,
  onGoOffline,
}: Props) {
  const [retrying, setRetrying] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const spinAnim = useRef(new Animated.Value(0)).current;

  const handleRetry = () => {
    if (retrying) return;
    setRetrying(true);
    setRetryCount((c) => c + 1);

    Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 800,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ).start();

    // Simulate retry attempt
    setTimeout(() => {
      spinAnim.stopAnimation();
      spinAnim.setValue(0);
      setRetrying(false);
    }, 2000);

    onRetry?.();
  };

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const handleOffline = onGoOffline ?? (() => navigation?.navigate("Home"));

  return (
    <PhoneShell navigation={navigation}>
      {/* Minimal header — no back button, user is stuck */}
      <View
        style={{
          backgroundColor: C.navy,
          paddingTop: 52,
          paddingBottom: 28,
          paddingHorizontal: 20,
        }}
      >
        <Text
          style={{
            color: `${C.white}60`,
            fontSize: 12,
            fontWeight: "600",
            letterSpacing: 1,
          }}
        >
          MYEXPENSE
        </Text>
        <Text
          style={{
            color: C.white,
            fontSize: 22,
            fontWeight: "800",
            marginTop: 4,
            opacity: 0.6,
          }}
        >
          No Connection
        </Text>
      </View>

      {/* Body */}
      <View
        style={{
          flex: 1,
          backgroundColor: C.bgLighter,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          marginTop: -16,
          alignItems: "center",
          justifyContent: "center",
          paddingHorizontal: 28,
          paddingBottom: 32,
        }}
      >
        {/* Illustration */}
        <View style={{ marginBottom: 32 }}>
          <NoSignalIllustration />
        </View>

        {/* Copy */}
        <Text
          style={{
            fontSize: 22,
            fontWeight: "800",
            color: C.text,
            textAlign: "center",
            marginBottom: 10,
          }}
        >
          No Internet Connection
        </Text>
        <Text
          style={{
            fontSize: 14,
            color: C.textSub,
            textAlign: "center",
            lineHeight: 22,
            marginBottom: 8,
          }}
        >
          MyExpense couldn't connect to the server to {actionContext}.
        </Text>
        <Text
          style={{
            fontSize: 13,
            color: C.textSub,
            textAlign: "center",
            lineHeight: 20,
            marginBottom: 32,
          }}
        >
          Check your Wi-Fi or mobile data and try again.
        </Text>

        {/* Retry Button */}
        <TouchableOpacity
          onPress={handleRetry}
          disabled={retrying}
          style={{
            backgroundColor: retrying ? C.bgLight : C.navy,
            borderRadius: 14,
            paddingVertical: 15,
            width: "100%",
            alignItems: "center",
            flexDirection: "row",
            justifyContent: "center",
            marginBottom: 12,
          }}
        >
          {retrying ? (
            <Animated.Text
              style={{
                fontSize: 18,
                marginRight: 10,
                transform: [{ rotate: spin }],
              }}
            >
              ↻
            </Animated.Text>
          ) : (
            <Text style={{ fontSize: 18, marginRight: 10 }}>↻</Text>
          )}
          <Text
            style={{
              color: retrying ? C.textSub : C.white,
              fontSize: 15,
              fontWeight: "700",
            }}
          >
            {retrying ? "Retrying..." : "Try Again"}
          </Text>
        </TouchableOpacity>

        {/* Offline mode */}
        <TouchableOpacity
          onPress={handleOffline}
          style={{
            borderWidth: 2,
            borderColor: C.teal,
            borderRadius: 14,
            paddingVertical: 14,
            width: "100%",
            alignItems: "center",
          }}
        >
          <Text style={{ color: C.teal, fontSize: 15, fontWeight: "700" }}>
            Work Offline
          </Text>
        </TouchableOpacity>

        {retryCount > 1 && (
          <Text
            style={{
              fontSize: 12,
              color: C.textSub,
              marginTop: 12,
              textAlign: "center",
            }}
          >
            Still not working? Check your network settings or try again later.
          </Text>
        )}

        {/* Offline capabilities */}
        <View
          style={{
            width: "100%",
            marginTop: 28,
            backgroundColor: C.white,
            borderRadius: 14,
            padding: 16,
            borderWidth: 1,
            borderColor: C.border,
          }}
        >
          <Text
            style={{
              fontSize: 12,
              fontWeight: "700",
              color: C.textSub,
              letterSpacing: 0.6,
              marginBottom: 12,
              textTransform: "uppercase",
            }}
          >
            Available Offline
          </Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
            {[
              "View expenses",
              "Add expenses",
              "Scan receipts",
              "Edit records",
            ].map((item) => (
              <OfflineBadge key={item} label={item} />
            ))}
          </View>
          <Text
            style={{
              fontSize: 11,
              color: C.textSub,
              marginTop: 8,
              lineHeight: 16,
            }}
          >
            Changes will sync automatically when your connection is restored.
          </Text>
        </View>
      </View>
    </PhoneShell>
  );
}
