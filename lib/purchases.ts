import { Platform } from "react-native";
import Purchases, { LOG_LEVEL } from "react-native-purchases";

// ─── RevenueCat configuration ─────────────────────────────────────────────────
// Keys are injected via .env:
//   EXPO_PUBLIC_REVENUECAT_IOS_KEY     — "appl_..." key from RevenueCat dashboard
//   EXPO_PUBLIC_REVENUECAT_ANDROID_KEY — "goog_..." key from RevenueCat dashboard
//
// Call configurePurchases() once at app launch (inside RootLayout useEffect),
// AFTER the user ID is known so RevenueCat can link purchases to the account.
// ─────────────────────────────────────────────────────────────────────────────

const IOS_KEY = process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY ?? "";
const ANDROID_KEY = process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY ?? "";

let _configured = false;

export function configurePurchases(userId?: string) {
  if (_configured) {
    // If user ID changes (sign-in/sign-out), update the app user ID
    if (userId) {
      Purchases.logIn(userId).catch(console.warn);
    } else {
      Purchases.logOut().catch(console.warn);
    }
    return;
  }

  const apiKey = Platform.OS === "ios" ? IOS_KEY : ANDROID_KEY;

  if (!apiKey) {
    console.warn(
      "[RevenueCat] API key not set. Add EXPO_PUBLIC_REVENUECAT_IOS_KEY / EXPO_PUBLIC_REVENUECAT_ANDROID_KEY to .env",
    );
    return;
  }

  if (__DEV__) {
    Purchases.setLogLevel(LOG_LEVEL.DEBUG);
  }

  Purchases.configure({ apiKey, appUserID: userId ?? null });
  _configured = true;
}
