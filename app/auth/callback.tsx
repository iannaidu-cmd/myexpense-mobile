import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "@/lib/supabase";
import { useAuthStore, SUPABASE_CV_BACKUP_KEY } from "@/stores/authStore";
import { colour } from "@/tokens";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useEffect, useState } from "react";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";

WebBrowser.maybeCompleteAuthSession();

// Supabase storage key for the PKCE code verifier
const PROJECT_REF = new URL(process.env.EXPO_PUBLIC_SUPABASE_URL!).hostname.split(".")[0];
const CV_KEY = `sb-${PROJECT_REF}-auth-token-code-verifier`;

export default function AuthCallbackScreen() {
  const router = useRouter();
  const { user, isInitialised } = useAuthStore();
  const params = useLocalSearchParams<{ code?: string }>();
  const rawCode = Array.isArray(params.code) ? params.code[0] : params.code;
  const code = rawCode?.split("#")[0] || undefined;
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Dismiss the Chrome Custom Tab as soon as the callback screen mounts.
  useEffect(() => {
    WebBrowser.dismissBrowser();
  }, []);

  useEffect(() => {
    if (!isInitialised) return;

    let active = true;

    const doExchange = async () => {
      if (useAuthStore.getState().isAuthenticated) return;
      try {
        if (!code) {
          // No code — poll for a session (covers implicit-flow OAuth)
          let pollCount = 0;
          const interval = setInterval(async () => {
            pollCount++;
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user && active) {
              clearInterval(interval);
              useAuthStore.setState({
                user: { id: session.user.id, email: session.user.email ?? "" },
                isAuthenticated: true,
                pendingEmailVerification: null,
              });
            } else if (pollCount > 10) {
              clearInterval(interval);
              if (active)
                setErrorMsg("Sign-in timed out — no code received from provider.");
            }
          }, 1000);
          return;
        }

        // auth-js v2.105+ _removeSession() also deletes the code verifier when
        // the temporary unconfirmed session expires. Restore it from our backup
        // (saved in authStore.signUp() before any removal can happen) so the
        // challenge still matches what was sent to Supabase during sign-up.
        const existing = await AsyncStorage.getItem(CV_KEY).catch(() => null);
        if (!existing) {
          const backup = await AsyncStorage.getItem(SUPABASE_CV_BACKUP_KEY).catch(() => null);
          if (backup) {
            await AsyncStorage.setItem(CV_KEY, backup).catch(() => {});
          }
        }

        const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

        // Clean up backup regardless of outcome
        await AsyncStorage.removeItem(SUPABASE_CV_BACKUP_KEY).catch(() => {});

        if (!active) return;

        if (exchangeError) {
          setErrorMsg(exchangeError.message);
          return;
        }

        if (data.session?.user) {
          WebBrowser.dismissBrowser();
          // onAuthStateChange will also fire SIGNED_IN, but set directly too
          // so navigation happens immediately without waiting for the event.
          useAuthStore.setState({
            user: { id: data.session.user.id, email: data.session.user.email ?? "" },
            isAuthenticated: true,
            pendingEmailVerification: null,
          });
        }
      } catch (e: any) {
        if (active) setErrorMsg(e?.message ?? "Unexpected error during sign-in.");
      }
    };

    doExchange();
    return () => { active = false; };
  }, [code, isInitialised]);

  useEffect(() => {
    if (user) {
      WebBrowser.dismissBrowser();
      router.replace("/(tabs)");
    }
  }, [user]);

  if (errorMsg) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colour.primary,
          alignItems: "center",
          justifyContent: "center",
          gap: 16,
          padding: 32,
        }}
      >
        <Text
          style={{
            color: colour.onPrimary,
            fontSize: 14,
            fontWeight: "600",
            textAlign: "center",
          }}
        >
          {errorMsg}
        </Text>
        <TouchableOpacity
          onPress={() => router.replace("/sign-in")}
          style={{
            backgroundColor: colour.onPrimary,
            paddingVertical: 12,
            paddingHorizontal: 24,
            borderRadius: 8,
            marginTop: 8,
          }}
        >
          <Text style={{ color: colour.primary, fontWeight: "700", fontSize: 15 }}>
            Back to Sign In
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colour.primary,
        alignItems: "center",
        justifyContent: "center",
        gap: 16,
        padding: 32,
      }}
    >
      <ActivityIndicator color={colour.onPrimary} size="large" />
      <Text
        style={{
          color: colour.onPrimary,
          fontSize: 13,
          fontWeight: "600",
          textAlign: "center",
        }}
      >
        Signing in…
      </Text>
    </View>
  );
}
