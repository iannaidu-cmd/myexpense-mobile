import * as Application from "expo-application";
import { Linking, Platform } from "react-native";
import { type CustomerInfo } from "react-native-purchases";

import { ENTITLEMENT_PRO } from "@/stores/subscriptionStore";

// ─── Store subscription pages ─────────────────────────────────────────────────
// Apps can't cancel, restart or change store subscriptions themselves, so
// anything like that sends the user to the store the subscription was bought
// from. Falls back to this device's store when RevenueCat doesn't know.
// ─────────────────────────────────────────────────────────────────────────────

function proEntitlement(info: CustomerInfo | null) {
  return info?.entitlements?.active?.[ENTITLEMENT_PRO];
}

function boughtOn(info: CustomerInfo | null): "apple" | "google" | null {
  const store = proEntitlement(info)?.store;
  if (store === "APP_STORE" || store === "MAC_APP_STORE") return "apple";
  if (store === "PLAY_STORE") return "google";
  return null;
}

export function storeNameFor(info: CustomerInfo | null): string {
  const store = boughtOn(info) ?? (Platform.OS === "ios" ? "apple" : "google");
  return store === "apple" ? "the App Store" : "Google Play";
}

/** Opens this exact subscription in the store it was bought from. */
export function openStoreSubscription(info: CustomerInfo | null) {
  const entitlement = proEntitlement(info);
  const store = boughtOn(info);
  if (store === "google" && entitlement) {
    const sku = entitlement.productIdentifier.split(":")[0];
    const pkg = Application.applicationId ?? "co.za.myexpense.myapp";
    Linking.openURL(
      `https://play.google.com/store/account/subscriptions?sku=${encodeURIComponent(sku)}&package=${encodeURIComponent(pkg)}`,
    );
  } else if (store === "apple") {
    Linking.openURL("https://apps.apple.com/account/subscriptions");
  } else if (info?.managementURL) {
    Linking.openURL(info.managementURL);
  } else {
    Linking.openURL(
      Platform.OS === "ios"
        ? "https://apps.apple.com/account/subscriptions"
        : "https://play.google.com/store/account/subscriptions",
    );
  }
}
