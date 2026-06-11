import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "@/lib/supabase";
import {
  useAuthStore,
  SUPABASE_CV_BACKUP_KEY,
  getMemPkceVerifier,
  clearMemPkceVerifier,
} from "@/stores/authStore";
import { colour } from "@/tokens";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useEffect, useState } from "react";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";

WebBrowser.maybeCompleteAuthSession();

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;
const PROJECT_REF = new URL(SUPABASE_URL).hostname.split(".")[0];
const CV_KEY = `sb-${PROJECT_REF}-auth-token-code-verifier`;
const SESSION_KEY = `sb-${PROJECT_REF}-auth-token`;

// Bypass supabase.auth.exchangeCodeForSession() because it calls _acquireLock(),
// which blocks behind the session-recovery lock that Supabase acquires when the
// app returns to foreground. With no active session (user is waiting to confirm),
// that lock can be held for the full lockAcquireTimeout — causing an infinite
// "Signing in..." screen. Instead: raw fetch to the token endpoint, write the
// session to AsyncStorage directly, and update authStore without the lock.
async function directPkceExchange(authCode: string): Promise<{ error: string | null }> {
  if (useAuthStore.getState().isAuthenticated) return { error: null };

  // Source of truth priority (highest → lowest):
  //   1. In-memory module variable — set in authStore.signUp(), immune to
  //      _removeSession() and to initialise() re-populating CV_KEY with stale
  //      verifiers from earlier sessions.
  //   2. AsyncStorage backup — survives app restart mid-flow.
  //   3. CV_KEY — last resort; may hold a stale value restored by initialise().
  let codeVerifier: string | null = getMemPkceVerifier();

  if (!codeVerifier) {
    const backup = await AsyncStorage.getItem(SUPABASE_CV_BACKUP_KEY).catch(() => null);
    codeVerifier = backup ?? null;
  }

  if (!codeVerifier) {
    const stored = await AsyncStorage.getItem(CV_KEY).catch(() => null);
    codeVerifier = stored ?? null;
  }

  // Strip the /recovery suffix (password-reset flow) if present
  codeVerifier = codeVerifier?.split("/")[0] ?? null;

  // Clean up backup and memory copy — one-shot
  clearMemPkceVerifier();
  await AsyncStorage.removeItem(SUPABASE_CV_BACKUP_KEY).catch(() => {});

  if (!codeVerifier) {
    return { error: "PKCE verifier missing — please sign in again." };
  }

  let response: Response;
  try {
    const controller = new AbortController();
    const abort = setTimeout(() => controller.abort(), 30_000);
    response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=pkce`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ auth_code: authCode, code_verifier: codeVerifier }),
      signal: controller.signal,
    });
    clearTimeout(abort);
  } catch (e: any) {
    return {
      error:
        e.name === "AbortError"
          ? "Sign-in timed out — please try again."
          : (e.message ?? "Network error during sign-in."),
    };
  }

  if (!response.ok) {
    const rawText = await response.text().catch(() => "");
    let body: any = {};
    try { body = JSON.parse(rawText); } catch {}
    return {
      error:
        body.error_description ??
        body.error ??
        `[${response.status}] ${rawText.slice(0, 200) || "(empty body)"}`,
    };
  }

  const tokens = await response.json();
  const userId: string | undefined = tokens.user?.id;
  const userEmail: string = tokens.user?.email ?? "";

  if (!userId) {
    return { error: "Invalid token response — no user ID in response." };
  }

  // Remove the used verifier
  await AsyncStorage.removeItem(CV_KEY).catch(() => {});

  // Write session to AsyncStorage so gotrue-js picks it up on the next
  // __loadSession() call without needing to go through the lock.
  const session = {
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    expires_in: tokens.expires_in ?? 3600,
    expires_at:
      tokens.expires_at ??
      Math.round(Date.now() / 1000) + (tokens.expires_in ?? 3600),
    token_type: tokens.token_type ?? "bearer",
    user: tokens.user,
  };
  await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(session)).catch(() => {});

  useAuthStore.setState({
    user: { id: userId, email: userEmail },
    isAuthenticated: true,
    pendingEmailVerification: null,
  });

  return { error: null };
}

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
      try {
        if (!code) {
          // No code — poll for a session (covers implicit-flow OAuth)
          let pollCount = 0;
          const interval = setInterval(async () => {
            pollCount++;
            const { data: { session } } = await supabase.auth.getSession();
            const emailConfirmed =
              session?.user && (!session.user.email || !!session.user.email_confirmed_at);
            if (emailConfirmed && active) {
              clearInterval(interval);
              useAuthStore.setState({
                user: { id: session!.user.id, email: session!.user.email ?? "" },
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

        const { error } = await directPkceExchange(code);

        if (!active) return;
        if (error) setErrorMsg(error);
        // On success: authStore.user is set → useEffect([user]) navigates to tabs
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
