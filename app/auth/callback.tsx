// app/auth/callback.tsx
// Handles the OAuth redirect after Google sign-in
// Expo Router automatically routes myexpense://auth/callback here

import { useAuthStore } from "@/stores/authStore";
import { colour } from "@/tokens";
import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useEffect } from "react";
import { ActivityIndicator, Text, View } from "react-native";

// Required to complete the auth session on Android
WebBrowser.maybeCompleteAuthSession();

export default function AuthCallbackScreen() {
  const router = useRouter();
  const { initialise } = useAuthStore();

  useEffect(() => {
    // Re-initialise auth store to pick up the new session
    const handle = async () => {
      await initialise();
      // Small delay to ensure session is set
      setTimeout(() => {
        router.replace("/(tabs)");
      }, 500);
    };
    handle();
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: colour.primary, alignItems: "center", justifyContent: "center", gap: 16 }}>
      <ActivityIndicator color={colour.onPrimary} size="large" />
      <Text style={{ color: colour.onPrimary, fontSize: 16, fontWeight: "600" }}>
        Signing you in…
      </Text>
    </View>
  );
}
