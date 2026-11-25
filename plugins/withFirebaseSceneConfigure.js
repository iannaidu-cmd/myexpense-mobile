// Inserts FirebaseApp.configure() into the SDK 58 scene-based AppDelegate.
//
// The @react-native-firebase/app 26.x config plugin looks for
// `factory.startReactNative(` to anchor the call, and that line moved to
// SceneDelegate in Expo SDK 58 (iOS 27 scene life cycle). So it logs a warning
// and leaves Firebase unconfigured, and analytics never starts on iOS.
// RNFB 27.2 fixed this by also anchoring on `return super.application(...)`
// (invertase/react-native-firebase#9331), but RNFB 27 is SPM-only and we stay
// on 26 for static frameworks. This plugin does the same thing as the 27.2 fix.
// Remove it when moving to RNFB 27+.
const { withAppDelegate, WarningAggregator } = require("expo/config-plugins");

const CALL = "FirebaseApp.configure()";
const ANCHOR =
  /^([ \t]*)return\s+super\.application\(\s*application\s*,\s*didFinishLaunchingWithOptions:\s*launchOptions\s*\)/m;

function addFirebaseConfigure(contents) {
  if (contents.includes(CALL)) return contents;
  if (!ANCHOR.test(contents)) {
    WarningAggregator.addWarningIOS(
      "withFirebaseSceneConfigure",
      "No `return super.application(...)` line in AppDelegate.swift; FirebaseApp.configure() not added.",
    );
    return contents;
  }
  if (!/^[ \t]*import\s+FirebaseCore[ \t]*$/m.test(contents)) {
    contents = contents.replace(
      /^([ \t]*(?:internal\s+)?import\s+Expo[ \t]*)$/m,
      "$1\nimport FirebaseCore",
    );
  }
  return contents.replace(ANCHOR, (line, indent) => `${indent}${CALL}\n${line}`);
}

module.exports = function withFirebaseSceneConfigure(config) {
  return withAppDelegate(config, (cfg) => {
    if (cfg.modResults.language === "swift") {
      cfg.modResults.contents = addFirebaseConfigure(cfg.modResults.contents);
    }
    return cfg;
  });
};
module.exports.addFirebaseConfigure = addFirebaseConfigure;
