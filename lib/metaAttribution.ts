import Constants from "expo-constants";
import { AppEventsLogger, Settings } from "react-native-fbsdk-next";
import Purchases from "react-native-purchases";

// ─── Meta (Facebook) ad attribution ──────────────────────────────────────────
// The Meta SDK auto-logs installs / app activations. Here we:
//   • hand RevenueCat the Meta anonymous ID + device identifiers, so its Meta
//     integration can attribute trials and purchases to the ad that drove them
//   • log CompleteRegistration, so Meta campaigns can optimise for sign-ups
// Everything is a no-op when the build has no Meta config (see app.config.js)
// and every call is wrapped: attribution must never break the app.
// ─────────────────────────────────────────────────────────────────────────────

const enabled = !!Constants.expoConfig?.extra?.facebookEnabled;

/** Call after RevenueCat is configured or switched to a new app user ID. */
export async function linkMetaToRevenueCat() {
  if (!enabled) return;
  try {
    Settings.initializeSDK();
    await Purchases.collectDeviceIdentifiers();
    const anonId = await AppEventsLogger.getAnonymousID();
    if (anonId) await Purchases.setFBAnonymousID(anonId);
  } catch (e) {
    if (__DEV__) console.warn("[Meta] attribution link failed", e);
  }
}

/** Standard Meta "CompleteRegistration" event for a new account. */
export function logMetaRegistration(method: string) {
  if (!enabled) return;
  try {
    AppEventsLogger.logEvent(AppEventsLogger.AppEvents.CompletedRegistration, {
      [AppEventsLogger.AppEventParams.RegistrationMethod]: method,
    });
  } catch (e) {
    if (__DEV__) console.warn("[Meta] registration event failed", e);
  }
}
