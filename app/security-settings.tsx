import { MXBackHeader } from "@/components/MXBackHeader";
import {
    authenticateWithBiometrics,
    clearBiometricSession,
    getBiometricLabel,
    isBiometricAvailable,
    isBiometricEnabled,
    saveBiometricSession,
    setBiometricEnabled,
} from "@/services/biometricService";
import { useAuthStore } from "@/stores/authStore";
import { colour, radius, space, typography } from "@/tokens";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    Alert,
    ScrollView,
    StatusBar,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

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

// ─── Row with toggle ─────────────────────────────────────────────────────────
function ToggleRow({
  icon,
  label,
  sub,
  value,
  onToggle,
  disabled = false,
}: {
  icon: string;
  label: string;
  sub: string;
  value: boolean;
  onToggle: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: space.lg,
        paddingVertical: space.md,
        borderBottomWidth: 1,
        borderBottomColor: colour.border,
        backgroundColor: colour.bgCard,
        opacity: disabled ? 0.45 : 1,
      }}
    >
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: radius.sm,
          backgroundColor: colour.primary50,
          alignItems: "center",
          justifyContent: "center",
          marginRight: space.md,
        }}
      >
        <Text style={{ fontSize: 20 }}>{icon}</Text>
      </View>
      <View style={{ flex: 1, marginRight: space.sm }}>
        <Text style={{ ...typography.labelM, color: colour.text }}>
          {label}
        </Text>
        <Text
          style={{ ...typography.bodyXS, color: colour.textSub, marginTop: 2 }}
        >
          {sub}
        </Text>
      </View>
      <Switch
        value={value}
        onValueChange={disabled ? undefined : onToggle}
        disabled={disabled}
        trackColor={{ false: colour.border, true: colour.primary }}
        thumbColor={colour.white}
      />
    </View>
  );
}

// ─── Tappable row ─────────────────────────────────────────────────────────────
function ActionRow({
  icon,
  label,
  sub,
  onPress,
  danger = false,
}: {
  icon: string;
  label: string;
  sub?: string;
  onPress: () => void;
  danger?: boolean;
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
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: radius.sm,
          backgroundColor: danger ? colour.dangerBg : colour.primary50,
          alignItems: "center",
          justifyContent: "center",
          marginRight: space.md,
        }}
      >
        <Text style={{ fontSize: 20 }}>{icon}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text
          style={{
            ...typography.labelM,
            color: danger ? colour.danger : colour.text,
          }}
        >
          {label}
        </Text>
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
      <Text style={{ color: colour.textSub, fontSize: 18 }}>›</Text>
    </TouchableOpacity>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function SecuritySettingsScreen() {
  const router = useRouter();
  const { user } = useAuthStore();

  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricEnabled, setBiometricEnabledState] = useState(false);
  const [biometricLabel, setBiometricLabel] = useState("Biometrics");

  useEffect(() => {
    (async () => {
      const available = await isBiometricAvailable();
      const enabled = await isBiometricEnabled();
      const label = await getBiometricLabel();
      setBiometricAvailable(available);
      setBiometricEnabledState(enabled);
      setBiometricLabel(label);
    })();
  }, []);

  const handleBiometricToggle = async (value: boolean) => {
    if (value) {
      const success = await authenticateWithBiometrics(
        `Enable ${biometricLabel} for MyExpense`,
      );
      if (!success) return;

      try {
        const { supabase } = await import("@/lib/supabase");
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (
          !session?.access_token ||
          !session?.refresh_token ||
          !session?.user?.email
        ) {
          Alert.alert(
            "Error",
            "Could not enable biometrics. Please sign in again.",
          );
          return;
        }
        await saveBiometricSession(
          session.user.email,
          session.access_token,
          session.refresh_token,
        );
        await setBiometricEnabled(true);
        setBiometricEnabledState(true);
        Alert.alert("Enabled", `${biometricLabel} sign-in is now active.`);
      } catch (e: any) {
        Alert.alert("Error", e?.message ?? "Something went wrong.");
      }
    } else {
      Alert.alert(
        `Disable ${biometricLabel}?`,
        "You will need to use your password to sign in.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Disable",
            style: "destructive",
            onPress: async () => {
              await clearBiometricSession();
              await setBiometricEnabled(false);
              setBiometricEnabledState(false);
            },
          },
        ],
      );
    }
  };

  const handleChangePassword = () => {
    router.push("/forgot-password");
  };

  const handleSignOutAllDevices = () => {
    Alert.alert(
      "Sign out of all devices?",
      "This will revoke all active sessions. You will need to sign in again on this device.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Sign out all",
          style: "destructive",
          onPress: async () => {
            try {
              const { supabase } = await import("@/lib/supabase");
              await supabase.auth.signOut({ scope: "global" });
              router.replace("/sign-in");
            } catch (e: any) {
              Alert.alert("Error", e?.message ?? "Could not sign out.");
            }
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView
      edges={["top"]}
      style={{ flex: 1, backgroundColor: colour.primary }}
    >
      <StatusBar barStyle="light-content" backgroundColor={colour.primary} />
      <MXBackHeader title="Security" />

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
        {/* Biometrics */}
        <SectionHeader title="Biometrics" />
        <View
          style={{
            borderTopWidth: 1,
            borderBottomWidth: 1,
            borderColor: colour.border,
          }}
        >
          <ToggleRow
            icon="🪪"
            label={biometricLabel}
            sub={
              biometricAvailable
                ? `Use ${biometricLabel} to unlock the app`
                : "Not available on this device"
            }
            value={biometricEnabled}
            onToggle={handleBiometricToggle}
            disabled={!biometricAvailable}
          />
        </View>

        {/* Password */}
        <SectionHeader title="Password" />
        <View
          style={{
            borderTopWidth: 1,
            borderBottomWidth: 1,
            borderColor: colour.border,
          }}
        >
          <ActionRow
            icon="🔑"
            label="Change password"
            sub="Send a password reset link to your email"
            onPress={handleChangePassword}
          />
        </View>

        {/* Account email (read-only info) */}
        <SectionHeader title="Account" />
        <View
          style={{
            borderTopWidth: 1,
            borderBottomWidth: 1,
            borderColor: colour.border,
            backgroundColor: colour.bgCard,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: space.lg,
              paddingVertical: space.md,
              borderBottomWidth: 1,
              borderBottomColor: colour.border,
            }}
          >
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: radius.sm,
                backgroundColor: colour.primary50,
                alignItems: "center",
                justifyContent: "center",
                marginRight: space.md,
              }}
            >
              <Text style={{ fontSize: 20 }}>📧</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ ...typography.labelM, color: colour.text }}>
                Email address
              </Text>
              <Text
                style={{
                  ...typography.bodyS,
                  color: colour.textSub,
                  marginTop: 2,
                }}
                numberOfLines={1}
              >
                {user?.email ?? "—"}
              </Text>
            </View>
          </View>

          <ActionRow
            icon="🚪"
            label="Sign out of all devices"
            sub="Revoke all active sessions globally"
            onPress={handleSignOutAllDevices}
            danger
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
