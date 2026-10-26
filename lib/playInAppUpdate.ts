import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import { trackFunnel } from "@/services/funnelService";

// ─── Google Play in-app updates (Android only) ────────────────────────────────
// On launch, ask Google Play whether a newer version is published. If so,
// show Google's full-screen "Update available" prompt. It is optional: the X
// closes it and the app carries on. We use the immediate flow because the
// flexible one restarts the app as soon as the download finishes, which
// could interrupt someone mid-entry. A skipped version is not offered again
// for SNOOZE_DAYS. iOS has no equivalent and keeps the Home update banner.
// Only works on installs from Google Play (not sideloaded or dev builds).
//
// expo-in-app-updates is required lazily, inside the Android branch, never
// imported at the top. Its iOS pod needs iOS 16.4 but the app targets 15.1, so
// Expo autolinking leaves it out of iOS builds. The package's JS calls
// requireNativeModule() as soon as it's loaded, which throws when the native
// module is missing, and this file is imported by app/_layout.tsx. A top-level
// import therefore crashed every iOS launch (App Review rejection of 1.2.13).
// ─────────────────────────────────────────────────────────────────────────────

const SNOOZE_DAYS = 3;
const snoozeKey = (storeVersion: string) => `@myexpense:play_update_skipped_${storeVersion}`;

export async function promptPlayUpdateIfAvailable(): Promise<void> {
  if (Platform.OS !== "android" || __DEV__) return;
  try {
    const { addUpdateListener, checkForUpdate, startUpdate } =
      require("expo-in-app-updates") as typeof import("expo-in-app-updates");
    const info = await checkForUpdate();
    if (!info.updateAvailable || !info.immediateAllowed) return;

    const key = snoozeKey(info.storeVersion);
    const skippedAt = Number(await AsyncStorage.getItem(key).catch(() => null));
    if (skippedAt && Date.now() - skippedAt < SNOOZE_DAYS * 86_400_000) return;

    // Snooze from the moment the prompt shows: anyone who accepts ends up on
    // the new version, so the key only ever matters to people who skipped.
    await AsyncStorage.setItem(key, String(Date.now())).catch(() => {});
    const removeListener = addUpdateListener("updateCancelled", () => {
      removeListener();
      trackFunnel("play_update_skipped", { store_version: info.storeVersion });
    });
    const shown = await startUpdate(true);
    if (shown) trackFunnel("play_update_prompt", { store_version: info.storeVersion });
    else removeListener();
  } catch (e) {
    // Not installed from Play, Play Store unavailable, or offline: expected.
    if (__DEV__) console.warn("[PlayUpdate]", e);
  }
}
