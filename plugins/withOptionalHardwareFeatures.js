// Marks hardware features the app doesn't strictly need as optional, so Google
// Play doesn't hide the app from devices without them (Play Console flagged
// these on 1.2.23):
//   - android.hardware.screen.portrait: implied by orientation "portrait"
//   - android.hardware.wifi: implied by a Wi-Fi permission from a library
// tools:replace makes our required="false" win over any library manifest.
const { withAndroidManifest } = require("expo/config-plugins");

const OPTIONAL_FEATURES = ["android.hardware.screen.portrait", "android.hardware.wifi"];

module.exports = function withOptionalHardwareFeatures(config) {
  return withAndroidManifest(config, (cfg) => {
    const manifest = cfg.modResults.manifest;
    manifest.$ = manifest.$ ?? {};
    manifest.$["xmlns:tools"] = manifest.$["xmlns:tools"] ?? "http://schemas.android.com/tools";

    const features = manifest["uses-feature"] ?? [];
    for (const name of OPTIONAL_FEATURES) {
      const existing = features.find((f) => f.$?.["android:name"] === name);
      const attrs = { "android:name": name, "android:required": "false", "tools:replace": "android:required" };
      if (existing) existing.$ = { ...existing.$, ...attrs };
      else features.push({ $: attrs });
    }
    manifest["uses-feature"] = features;
    return cfg;
  });
};
