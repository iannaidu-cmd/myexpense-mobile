import { Platform } from "react-native";
import { MMKV } from "react-native-mmkv";

// ─── Google Analytics 4 (Firebase) ───────────────────────────────────────────
// Mirrors the key funnel moments (sign-up, first receipt, paywall, purchase)
// into GA4 next to the Meta events (metaAttribution.ts) and our own
// funnel_events rows (funnelService.ts). The native module is required lazily:
// if its pod is ever left out of a build (iOS autolink drops pods whose
// minimum is above our target, see playInAppUpdate.ts), a top-level import
// would crash every launch. Instead analytics just switches itself off.
// Every call is wrapped: analytics must never break the app.
// ─────────────────────────────────────────────────────────────────────────────

type AnalyticsApi = typeof import("@react-native-firebase/analytics");
type Ga = { api: AnalyticsApi; instance: ReturnType<AnalyticsApi["getAnalytics"]> };

let _ga: Ga | null | undefined;

function ga(): Ga | null {
  if (_ga !== undefined) return _ga;
  _ga = null;
  if (Platform.OS !== "ios" && Platform.OS !== "android") return null;
  try {
    const api: AnalyticsApi = require("@react-native-firebase/analytics");
    _ga = { api, instance: api.getAnalytics() };
  } catch (e) {
    // Expo Go, or a build without the Firebase native module.
    if (__DEV__) console.warn("[GA4] unavailable", e);
  }
  return _ga;
}

function log(name: string, params?: Record<string, string | number | boolean | null>) {
  const g = ga();
  if (!g) return;
  try {
    Promise.resolve(g.api.logEvent(g.instance, name, params as any)).catch(() => {});
  } catch (e) {
    if (__DEV__) console.warn(`[GA4] ${name} failed`, e);
  }
}

/** GA4 recommended sign_up event, for a new account. */
export function logSignUp(method: string) {
  log("sign_up", { method });
}

/** GA4 recommended login event, for a returning user signing in. */
export function logLogin(method: string) {
  log("login", { method });
}

/** A bank import sends one event for the batch, with how many were created. */
export function logExpenseCreated(source: "manual" | "receipt_scan" | "bank_import", count = 1) {
  log("expense_created", { source, count });
}

const storage = new MMKV({ id: "myexpense-analytics" });
const FIRST_RECEIPT_KEY = "first_receipt_scanned_sent";

/** Once per install, on the first receipt saved from a scan. */
export function logFirstReceiptScanned() {
  try {
    if (storage.getBoolean(FIRST_RECEIPT_KEY)) return;
    storage.set(FIRST_RECEIPT_KEY, true);
    log("first_receipt_scanned");
  } catch {
    // never let tracking throw
  }
}

export function logPaywallViewed(from: string) {
  log("paywall_viewed", { from });
}

/**
 * A completed subscription purchase. A free intro offer is logged as
 * trial_started (no revenue yet); anything else as the GA4 purchase event,
 * with the price in the store's currency (ZAR for South African accounts).
 */
export function logSubscriptionPurchase(p: {
  plan: string;
  productId: string;
  price: number;
  currency: string;
  freeTrial: boolean;
}) {
  if (p.freeTrial) {
    log("trial_started", { plan: p.plan, item_id: p.productId });
    return;
  }
  log("purchase", {
    plan: p.plan,
    item_id: p.productId,
    value: p.price,
    currency: p.currency,
  });
}

/** Screen views are logged by hand (automatic reporting is off in firebase.json). */
export function logScreen(name: string) {
  log("screen_view", { screen_name: name, screen_class: name });
}
