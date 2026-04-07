// ─── BiometricToggle ──────────────────────────────────────────────────────────
// Drop this into the Settings screen Preferences section.
// Shows a toggle to enable/disable biometric login.

import {
    authenticateWithBiometrics,
    clearBiometricSession,
    getBiometricLabel,
    isBiometricAvailable,
    isBiometricEnabled,
    saveBiometricSession,
    setBiometricEnabled,
} from "@/services/biometricService";
import { colour, radius, space, typography } from "@/tokens";
import { useEffect, useState } from "react";
import { Alert, Switch, Text, View } from "react-native";

export function BiometricToggle() {
  const [available, setAvailable] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [label, setLabel] = useState("Biometrics");

  useEffect(() => {
    (async () => {
      const a = await isBiometricAvailable();
      const e = await isBiometricEnabled();
      const l = await getBiometricLabel();
      setAvailable(a);
      setEnabled(e);
      setLabel(l);
    })();
  }, []);

  const handleToggle = async (value: boolean) => {
    if (value) {
      // Verify with biometrics before enabling
      const success = await authenticateWithBiometrics(
        `Enable ${label} for MyExpense`,
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
        setEnabled(true);
        Alert.alert("Enabled", `${label} sign-in is now active.`);
      } catch (e: any) {
        Alert.alert("Error", e.message);
      }
    } else {
      Alert.alert(
        `Disable ${label}?`,
        "You will need to use your password to sign in.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Disable",
            style: "destructive",
            onPress: async () => {
              await clearBiometricSession();
              await setBiometricEnabled(false);
              setEnabled(false);
            },
          },
        ],
      );
    }
  };

  if (!available) return null;

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        padding: space.lg,
        backgroundColor: colour.bgCard,
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: colour.border,
        marginBottom: space.sm,
      }}
    >
      <View style={{ flex: 1 }}>
        <Text style={{ ...typography.labelM, color: colour.textPrimary }}>
          {label === "Face ID" ? "🔐" : "👆"} {label} Sign-In
        </Text>
        <Text
          style={{
            ...typography.caption,
            color: colour.textSecondary,
            marginTop: 2,
          }}
        >
          {enabled
            ? `Sign in with ${label} instead of your password`
            : `Enable ${label} for faster sign-in`}
        </Text>
      </View>
      <Switch
        value={enabled}
        onValueChange={handleToggle}
        trackColor={{ false: colour.border, true: colour.primary }}
        thumbColor={colour.white}
      />
    </View>
  );
}
