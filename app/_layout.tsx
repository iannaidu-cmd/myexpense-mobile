import { ErrorBoundary } from "@/components/ErrorBoundary";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { configurePurchases } from "@/lib/purchases";
import * as Sentry from "@sentry/react-native";
import {
    registerForPushNotifications,
    savePushToken,
    scheduleMonthlyReportReminder,
    scheduleSARSDeadlineReminders,
    scheduleWeeklyExpenseReminder,
    setupNotificationResponseHandler,
} from "@/services/notificationService";
import { useAuthStore } from "@/stores/authStore";
import { useSubscriptionStore } from "@/stores/subscriptionStore";
import { colour } from "@/tokens";
import {
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
    useFonts,
} from "@expo-google-fonts/inter";
import {
    DarkTheme,
    DefaultTheme,
    ThemeProvider,
} from "@react-navigation/native";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef, useState } from "react";
import { Animated, Image, Linking, LogBox, View } from "react-native";
import "react-native-reanimated";
import "react-native-url-polyfill/auto";
import { supabase } from "@/lib/supabase";

// Supabase internally console.errors when a stored refresh token is stale.
// We handle this gracefully in authStore (signOut + redirect), so suppress
// the LogBox overlay here to avoid alarming users with a red error screen.
LogBox.ignoreLogs([
  "AuthApiError: Invalid Refresh Token",
  "Unable to activate keep awake",
]);

Sentry.init({
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
  // JS errors captured in Expo Go; native crashes captured in dev/prod builds
  enabled: !!process.env.EXPO_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.2,
});

SplashScreen.preventAutoHideAsync();

// ── Auth gate ─────────────────────────────────────────────────────────────────
function AuthGate() {
  const router = useRouter();
  const segments = useSegments();
  const { user, isInitialised, pendingEmailVerification } = useAuthStore();

  useEffect(() => {
    if (!isInitialised) return;

    // Email confirmation pending — route to verification screen. This runs
    // inside AuthGate so there is no race between a screen's router.replace
    // call and segments updating.
    if (
      pendingEmailVerification &&
      !user &&
      segments[0] !== "email-verification" &&
      segments[0] !== "auth"
    ) {
      router.replace(
        `/email-verification?email=${encodeURIComponent(pendingEmailVerification)}` as any
      );
      return;
    }

    const inAuthGroup =
      segments[0] === "auth" ||
      segments[0] === "sign-in" ||
      segments[0] === "sign-up" ||
      segments[0] === "forgot-password" ||
      segments[0] === "email-verification";

    const inProfileSetup = segments[0] === "profile-setup";
    const inOnboarding = segments[0] === "onboarding-step-1";
    const inLegal = segments[0] === "terms" || segments[0] === "privacy";

    if (!user && !inAuthGroup && !inOnboarding && !inLegal && !inProfileSetup) {
      router.replace("/onboarding-step-1");
    } else if (user && (inAuthGroup || inOnboarding)) {
      router.replace("/(tabs)");
    }
  }, [user, isInitialised, segments, pendingEmailVerification]);

  return null;
}

// ── OAuth deep-link handler ───────────────────────────────────────────────────
// Two cases:
//   1. PKCE code via HTTPS App Link — when openAuthSessionAsync returns "cancel"
//      because the OS routed the intent separately, the Linking event fires with
//      the HTTPS callback URL. Extract the code and push to auth/callback.
//   2. Implicit-flow hash tokens — password-reset magic links.
function OAuthHandler() {
  const router = useRouter();
  useEffect(() => {
    const handle = async (url: string | null) => {
      if (!url) return;

      // Custom scheme: email confirmation and OAuth callbacks
      if (url.startsWith("myexpense://auth/callback")) {
        const codeMatch = url.match(/[?&]code=([^&#]+)/);
        if (codeMatch) {
          router.replace(`/auth/callback?code=${codeMatch[1]}` as any);
          return;
        }
      }

      // HTTPS App Link fallback (when OS routes the intent separately)
      if (url.includes("myexpense.co.za/auth/callback")) {
        const codeMatch = url.match(/[?&]code=([^&#]+)/);
        if (codeMatch) {
          router.replace(`/auth/callback?code=${codeMatch[1]}` as any);
          return;
        }
      }

      // Implicit-flow hash tokens (password-reset magic links)
      const hashIdx = url.indexOf("#");
      const hash = hashIdx >= 0 ? url.slice(hashIdx + 1) : "";
      if (!hash) return;
      const p = new URLSearchParams(hash);
      const at = p.get("access_token");
      const rt = p.get("refresh_token");
      if (at && rt) {
        try {
          const { data: { session: existing } } = await supabase.auth.getSession();
          if (existing) return;
          await supabase.auth.setSession({ access_token: at, refresh_token: rt });
        } catch {
          // Silent
        }
      }
    };
    Linking.getInitialURL().then(handle);
    const sub = Linking.addEventListener("url", ({ url }) => handle(url));
    return () => sub.remove();
  }, []);
  return null;
}

// ── RevenueCat setup ─────────────────────────────────────────────────────────
function PurchasesSetup() {
  const { user } = useAuthStore();
  const { refresh } = useSubscriptionStore();

  useEffect(() => {
    configurePurchases(user?.id);
    // Refresh subscription state whenever auth changes
    refresh().catch(console.warn);
  }, [user?.id]);

  return null;
}

// ── Push notification setup ───────────────────────────────────────────────────
function NotificationSetup() {
  const router = useRouter();
  const { user } = useAuthStore();

  useEffect(() => {
    if (!user) return;

    let responseSub: ReturnType<
      typeof setupNotificationResponseHandler
    > | null = null;

    const setup = async () => {
      try {
        const token = await registerForPushNotifications();
        if (token) await savePushToken(user.id, token);
      } catch (e) {
        console.warn(
          "Push token registration skipped (works in production build):",
          e,
        );
      }

      try {
        await scheduleWeeklyExpenseReminder();
        await scheduleMonthlyReportReminder();
        await scheduleSARSDeadlineReminders();
      } catch (e) {
        console.warn("Local notification scheduling failed:", e);
      }

      try {
        responseSub = setupNotificationResponseHandler((route) => {
          router.push(route as any);
        });
      } catch (e) {
        console.warn("Notification tap handler setup failed:", e);
      }
    };

    setup();
    return () => {
      responseSub?.remove();
    };
  }, [user?.id]);

  return null;
}

const SPLASH_MIN_MS = 4000;
const SPLASH_MAX_MS = 15000;

// Overlay opacity is controlled by RootLayout so it can fade out smoothly.
// InlineSplash only handles the logo entrance animation.
function InlineSplash({ opacity }: { opacity: Animated.Value }) {
  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  useEffect(() => {
    Animated.spring(scaleAnim, { toValue: 1, delay: 200, useNativeDriver: true, tension: 60, friction: 8 }).start();
  }, []);
  return (
    <Animated.View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: colour.background, alignItems: "center", justifyContent: "center", opacity }}>
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <Image source={require("@/assets/images/sm_logo.gif")} style={{ width: 211, height: 211, resizeMode: "contain" }} />
      </Animated.View>
    </Animated.View>
  );
}

function RootLayout() {
  const colorScheme = useColorScheme();
  const { initialise } = useAuthStore();
  const [splashDone, setSplashDone] = useState(false);
  const splashOpacity = useRef(new Animated.Value(1)).current;
  useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
  });

  useEffect(() => {
    const startMs = Date.now();
    SplashScreen.hideAsync();
    const timeout = new Promise<void>((resolve) => setTimeout(resolve, SPLASH_MAX_MS));
    Promise.race([initialise(), timeout]).then(() => {
      const elapsed = Date.now() - startMs;
      const remaining = Math.max(0, SPLASH_MIN_MS - elapsed);
      setTimeout(() => {
        Animated.timing(splashOpacity, { toValue: 0, duration: 500, useNativeDriver: true })
          .start(() => setSplashDone(true));
      }, remaining);
    });
  }, []);

  return (
    <ErrorBoundary>
    <View style={{ flex: 1 }}>
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <AuthGate />
      <OAuthHandler />
      <PurchasesSetup />
      <NotificationSetup />
      <Stack>
        {/* ── Entry ── */}
        <Stack.Screen
          name="onboarding-step-1"
          options={{ headerShown: false }}
        />
        {/* ── Auth ── */}
        <Stack.Screen name="auth" options={{ headerShown: false }} />
        <Stack.Screen name="sign-in" options={{ headerShown: false }} />
        <Stack.Screen name="sign-up" options={{ headerShown: false }} />
        <Stack.Screen name="profile-setup" options={{ headerShown: false }} />
        <Stack.Screen name="auth/callback" options={{ headerShown: false }} />
        <Stack.Screen name="forgot-password" options={{ headerShown: false }} />
        <Stack.Screen name="reset-password" options={{ headerShown: false }} />
        <Stack.Screen
          name="email-verification"
          options={{ headerShown: false }}
        />
        {/* ── Legal (accessible without login) ── */}
        <Stack.Screen name="terms" options={{ headerShown: false }} />
        <Stack.Screen name="privacy" options={{ headerShown: false }} />
        <Stack.Screen name="terms-accept" options={{ headerShown: false }} />
        {/* ── Main tabs ── */}
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        {/* ── Income ── */}
        <Stack.Screen name="add-income" options={{ headerShown: false }} />
        <Stack.Screen name="add-irp5-income" options={{ headerShown: false }} />
        <Stack.Screen name="provisional-tax" options={{ headerShown: false }} />
        <Stack.Screen name="income-history" options={{ headerShown: false }} />
        <Stack.Screen name="income-detail" options={{ headerShown: false }} />
        <Stack.Screen
          name="income-vs-expenses"
          options={{ headerShown: false }}
        />
        {/* ── Expense Management ── */}
        <Stack.Screen name="add-expense-manual" options={{ headerShown: false }} />
        <Stack.Screen name="quick-add-expense" options={{ headerShown: false }} />
        <Stack.Screen name="expense-detail" options={{ headerShown: false }} />
        <Stack.Screen name="expense-history" options={{ headerShown: false }} />
        <Stack.Screen name="edit-expense" options={{ headerShown: false }} />
        <Stack.Screen name="receipt-review" options={{ headerShown: false }} />
        <Stack.Screen name="scan-receipt-camera" options={{ headerShown: false }} />
        <Stack.Screen name="scan-receipt-processing" options={{ headerShown: false }} />
        <Stack.Screen name="recent-activity-feed" options={{ headerShown: false }} />
        <Stack.Screen
          name="upload-from-gallery"
          options={{ headerShown: false }}
        />
        <Stack.Screen name="filter-sort" options={{ headerShown: false }} />
        <Stack.Screen
          name="delete-confirmation"
          options={{ headerShown: false }}
        />
        {/* ── Tax & ITR12 ── */}
        <Stack.Screen name="tax-summary" options={{ headerShown: false }} />
        <Stack.Screen name="government-concessions" options={{ headerShown: false }} />
        <Stack.Screen
          name="itr12-export-setup"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="itr12-export-preview"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="itr12-pdf-report"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="itr12-efiling-guide"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="category-breakdown"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="deductibility-guide"
          options={{ headerShown: false }}
        />
        <Stack.Screen name="vat-summary" options={{ headerShown: false }} />
        <Stack.Screen
          name="tax-year-selector"
          options={{ headerShown: false }}
        />
        {/* ── Reports ── */}
        <Stack.Screen
          name="reports-dashboard"
          options={{ headerShown: false }}
        />
        <Stack.Screen name="mileage-tracker" options={{ headerShown: false }} />
        <Stack.Screen name="mileage-history" options={{ headerShown: false }} />
        <Stack.Screen
          name="mileage-trip-summary"
          options={{ headerShown: false }}
        />
        {/* ── Settings ── */}
        <Stack.Screen name="home-office-setup" options={{ headerShown: false }} />
        <Stack.Screen name="bank-accounts" options={{ headerShown: false }} />
        <Stack.Screen name="bank-import" options={{ headerShown: false }} />
        <Stack.Screen name="profile" options={{ headerShown: false }} />
        <Stack.Screen
          name="notifications-settings"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="security-settings"
          options={{ headerShown: false }}
        />
        <Stack.Screen name="help-support" options={{ headerShown: false }} />
        {/* ── Paywall ── */}
        <Stack.Screen
          name="paywall-upgrade"
          options={{
            headerShown: false,
            presentation: "modal",
          }}
        />
        <Stack.Screen
          name="subscription-manage"
          options={{ headerShown: false }}
        />
        {/* ── Utility ── */}
        <Stack.Screen
          name="success-confirmation"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="loading-skeleton"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="empty-state-no-expenses"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="empty-state-no-reports"
          options={{ headerShown: false }}
        />
        <Stack.Screen name="error-generic" options={{ headerShown: false }} />
        <Stack.Screen
          name="error-no-internet"
          options={{ headerShown: false }}
        />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
    {!splashDone && <InlineSplash opacity={splashOpacity} />}
    </View>
    </ErrorBoundary>
  );
}

export default Sentry.wrap(RootLayout);
