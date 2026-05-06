// Dynamic config so secrets (e.g. Google Maps API key) can be injected via
// EAS secrets or a local .env without ever appearing in source control.
// This file supersedes app.json — Expo reads app.config.js first when present.

/** @type {import('expo/config').ExpoConfig} */
const config = {
  name: "MyExpense",
  slug: "MyExpense",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/images/icon.png",
  scheme: "myexpense",
  newArchEnabled: true,
  ios: {
    supportsTablet: true,
    bundleIdentifier: "co.za.myexpense",
    buildNumber: "1",
    infoPlist: {
      NSCameraUsageDescription:
        "MyExpense uses the camera to scan receipts for expense records.",
      NSPhotoLibraryUsageDescription:
        "MyExpense accesses your photo library to import receipt images.",
      NSPhotoLibraryAddUsageDescription:
        "MyExpense saves exported tax reports to your photo library.",
      NSFaceIDUsageDescription:
        "MyExpense uses Face ID to secure access to your financial data.",
      NSLocationWhenInUseUsageDescription:
        "MyExpense tracks business travel distance for SARS mileage deductions.",
      UIBackgroundModes: ["remote-notification"],
      LSApplicationQueriesSchemes: ["myexpense"],
    },
  },
  android: {
    package: "co.za.myexpense",
    versionCode: 1,
    config: {
      googleMaps: {
        apiKey: process.env.GOOGLE_MAPS_API_KEY,
      },
    },
    adaptiveIcon: {
      backgroundColor: "#E6F4FE",
      foregroundImage: "./assets/images/android-icon-foreground.png",
      backgroundImage: "./assets/images/android-icon-background.png",
      monochromeImage: "./assets/images/android-icon-monochrome.png",
    },
    edgeToEdgeEnabled: true,
    predictiveBackGestureEnabled: false,
    intentFilters: [
      {
        action: "VIEW",
        autoVerify: true,
        data: [{ scheme: "myexpense" }],
        category: ["BROWSABLE", "DEFAULT"],
      },
    ],
    permissions: [
      "android.permission.ACCESS_COARSE_LOCATION",
      "android.permission.ACCESS_FINE_LOCATION",
    ],
  },
  web: {
    output: "static",
    favicon: "./assets/images/favicon.png",
  },
  plugins: [
    "expo-router",
    [
      "expo-splash-screen",
      {
        image: "./assets/images/splash-icon.png",
        resizeMode: "contain",
        backgroundColor: "#F2EDE3",
      },
    ],
    [
      "expo-location",
      {
        locationAlwaysAndWhenInUsePermission:
          "MyExpense uses your location to track business travel distance for SARS tax compliance.",
      },
    ],
    "expo-font",
    "expo-secure-store",
    [
      "expo-notifications",
      {
        icon: "./assets/images/android-icon-monochrome.png",
        color: "#006FFD",
        defaultChannel: "default",
      },
    ],
    "expo-web-browser",
    [
      "@sentry/react-native/expo",
      {
        url: "https://sentry.io/",
        project: "react-native",
        organization: "myexpense",
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
  extra: {
    router: {},
    eas: {
      projectId: "3cc2675f-d248-4f36-ba9b-401f7d55d8be",
    },
  },
  runtimeVersion: {
    policy: "appVersion",
  },
  updates: {
    url: "https://u.expo.dev/3cc2675f-d248-4f36-ba9b-401f7d55d8be",
  },
};

module.exports = { expo: config };
