// app/auth/callback.tsx
// Handles the OAuth redirect after Google sign-in.
// On Android, openAuthSessionAsync may navigate here directly via deep link.
// We extract the PKCE code from the URL params and exchange it for a session.

import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/authStore";
import { colour } from "@/tokens";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useEffect } from "react";
import { ActivityIndicator, Text, View } from "react-native";

// Required to complete the auth session on Android
WebBrowser.maybeCompleteAuthSession();

export default function AuthCallbackScreen() {
  const router = useRouter();
  const { initialise } = useAuthStore();
  const params = useLocalSearchParams<{ code?: string }>();

  useEffect(() => {
    const handle = async () => {
      // If the deep link carried a PKCE code, exchange it for a session
      if (params.code) {
        try {
          await supabase.auth.exchangeCodeForSession(
            `myexpense://auth/callback?code=${params.code}`,
          );
        } catch {
          // Exchange failed — fall through to re-initialise from stored session
        }
      }

      // Re-initialise the auth store to pick up the new session
      await initialise();

      // Small delay to ensure auth state propagates before navigation
      setTimeout(() => {
        router.replace("/(tabs)");
      }, 500);
    };
    handle();
  }, []);

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colour.primary,
        alignItems: "center",
        justifyContent: "center",
        gap: 16,
      }}
    >
      <ActivityIndicator color={colour.onPrimary} size="large" />
      <Text
        style={{ color: colour.onPrimary, fontSize: 16, fontWeight: "600" }}
      >
        Signing you in…
      </Text>
    </View>
  );
}
