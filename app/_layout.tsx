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
import { useEffect } from "react";
import { LogBox } from "react-native";
import "react-native-reanimated";
import "react-native-url-polyfill/auto";

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

export const unstable_settings = { anchor: "splash" };

// ── Auth gate ─────────────────────────────────────────────────────────────────
function AuthGate() {
  const router = useRouter();
  const segments = useSegments();
  const { user, isInitialised } = useAuthStore();

  useEffect(() => {
    if (!isInitialised) return;

    const inAuthGroup =
      segments[0] === "auth" ||
      segments[0] === "sign-in" ||
      segments[0] === "sign-up" ||
      segments[0] === "forgot-password" ||
      segments[0] === "email-verification";
    // reset-password is intentionally excluded: the Supabase recovery code
    // creates a temporary session, and we must not redirect the user away
    // from the form while they still need to submit their new password.

    // profile-setup is NOT in inAuthGroup so authenticated users can access it
    const inProfileSetup = segments[0] === "profile-setup";

    const inOnboarding =
      segments[0] === "onboarding-step-1" ||
      segments[0] === "onboarding-step-2" ||
      segments[0] === "onboarding-step-3" ||
      segments[0] === "splash";

    // Legal screens are always accessible regardless of auth state
    const inLegal = segments[0] === "terms" || segments[0] === "privacy";

    if (!user && !inAuthGroup && !inOnboarding && !inLegal && !inProfileSetup) {
      router.replace("/onboarding-step-1");
    } else if (user && (inAuthGroup || inOnboarding)) {
      router.replace("/(tabs)");
    }
  }, [user, isInitialised, segments]);

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

function RootLayout() {
  const colorScheme = useColorScheme();
  const { initialise } = useAuthStore();
  useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
  });

  useEffect(() => {
    SplashScreen.hideAsync();
    initialise();
  }, []);

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <AuthGate />
      <PurchasesSetup />
      <NotificationSetup />
      <Stack>
        {" "}
        {/* ── Entry ── */}
        <Stack.Screen name="splash" options={{ headerShown: false }} />
        <Stack.Screen
          name="onboarding-step-1"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="onboarding-step-2"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="onboarding-step-3"
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
        {/* ── Main tabs ── */}
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        {/* ── Income ── */}
        <Stack.Screen name="add-income" options={{ headerShown: false }} />
        <Stack.Screen name="income-history" options={{ headerShown: false }} />
        <Stack.Screen
          name="income-vs-expenses"
          options={{ headerShown: false }}
        />
        {/* ── Expense Management ── */}
        <Stack.Screen
          name="add-expense-manual"
          options={{ title: "Add Expense", headerBackTitle: "Back" }}
        />
        <Stack.Screen
          name="quick-add-expense"
          options={{ title: "Quick Add", headerBackTitle: "Back" }}
        />
        <Stack.Screen name="expense-detail" options={{ headerShown: false }} />
        <Stack.Screen name="expense-history" options={{ headerShown: false }} />
        <Stack.Screen name="edit-expense" options={{ headerShown: false }} />
        <Stack.Screen
          name="receipt-review"
          options={{ title: "Review Receipt", headerBackTitle: "Back" }}
        />
        <Stack.Screen
          name="scan-receipt-camera"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="scan-receipt-processing"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="recent-activity-feed"
          options={{ title: "Recent Activity", headerBackTitle: "Back" }}
        />
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
        <Stack.Screen name="bank-accounts" options={{ headerShown: false }} />
        <Stack.Screen name="profile" options={{ headerShown: false }} />
        <Stack.Screen
          name="notifications-settings"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="appearance-settings"
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
        {/* ── Stubs ── */}
        <Stack.Screen name="reports-screens" options={{ headerShown: false }} />
        <Stack.Screen
          name="settings-screens"
          options={{ headerShown: false }}
        />
        {/* ── Modal ── */}
        <Stack.Screen name="modal" options={{ presentation: "modal" }} />
      </Stack>
      <StatusBar style="auto" />


    </ThemeProvider>
  );
}

export default Sentry.wrap(RootLayout);
