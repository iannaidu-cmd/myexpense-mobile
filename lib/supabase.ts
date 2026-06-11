import "./crypto-polyfill";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import { AppState, Platform } from "react-native";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

// Timeout for Supabase requests. AbortController can silently fail on some
// Android devices, so Promise.race is used as a reliable fallback that
// rejects regardless of the underlying fetch state.
// Auth token exchange (Facebook/Google OAuth) routes through the provider's
// token endpoint server-side and can legitimately take 30-60 s, so it gets
// a longer budget than ordinary database/storage requests.
const fetchWithTimeout: typeof fetch = (url, options) => {
  const isAuthToken = String(url).includes("/auth/v1/token");
  const timeoutMs = isAuthToken ? 60_000 : 30_000;
  const controller = new AbortController();
  const abortTimer = setTimeout(() => controller.abort(), timeoutMs);
  const raceTimer = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error("Request timed out")), timeoutMs),
  );
  return Promise.race([
    fetch(url, { ...options, signal: controller.signal }).finally(() =>
      clearTimeout(abortTimer),
    ),
    raceTimer,
  ]) as Promise<Response>;
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: Platform.OS !== "web" ? AsyncStorage : undefined,
    autoRefreshToken: true,
    persistSession: Platform.OS !== "web",
    detectSessionInUrl: Platform.OS === "web",
    flowType: "implicit",
  },
  global: { fetch: fetchWithTimeout },
});

// When the app is backgrounded the JS thread pauses, stopping Supabase's
// internal token-refresh timer. Without this listener, the first query after
// a long idle triggers an inline refresh that can stall screens for up to
// 60 s. Calling startAutoRefresh() on foreground immediately re-arms the
// timer so the token is fresh before any screen loads data.
if (Platform.OS !== "web") {
  AppState.addEventListener("change", (state) => {
    if (state === "active") {
      supabase.auth.startAutoRefresh();
    } else {
      supabase.auth.stopAutoRefresh();
    }
  });
}
