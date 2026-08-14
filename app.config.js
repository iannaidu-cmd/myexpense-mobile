// Dynamic config so secrets (e.g. Google Maps API key) can be injected via
// EAS secrets or a local .env without ever appearing in source control.
// This is the sole Expo config file — do not reintroduce app.json alongside it.

/** @type {import('expo/config').ExpoConfig} */
const config = {
  name: "MyExpense",
  slug: "MyExpense",
  version: "1.0.2",
  orientation: "portrait",
  icon: "./assets/images/icon.png",
  scheme: "myexpense",
  newArchEnabled: true,
  ios: {
    supportsTablet: true,
    requiresFullScreen: true,
    bundleIdentifier: "co.za.myexpense",
    buildNumber: "62",
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
      NSCameraUsageDescription:
        "MyExpense uses the camera to scan receipts for expense records.",
      NSPhotoLibraryUsageDescription:
        "MyExpense accesses your photo library to import receipt images.",
      NSFaceIDUsageDescription:
        "MyExpense uses Face ID to secure access to your financial data.",
      NSLocationWhenInUseUsageDescription:
        "MyExpense records the GPS coordinates of your trip's start and end points when you start and stop mileage tracking, so it can calculate the distance travelled for your SARS business mileage deduction. Location is only recorded while you are actively tracking a trip.",
      UIBackgroundModes: ["remote-notification"],
      LSApplicationQueriesSchemes: ["myexpense"],
    },
  },
  android: {
    package: "co.za.myexpense.myapp",
    versionCode: 23,
    config: {
      googleMaps: {
        apiKey: process.env.GOOGLE_MAPS_API_KEY,
      },
    },
    adaptiveIcon: {
      foregroundImage: "./assets/images/adaptive-icon.png",
      backgroundColor: "#FFFFFF",
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
      {
        action: "VIEW",
        autoVerify: true,
        data: [
          {
            scheme: "https",
            host: "www.myexpense.co.za",
            pathPrefix: "/auth/callback",
          },
        ],
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
        imageWidth: 211,
        resizeMode: "contain",
        backgroundColor: "#F2EDE3",
      },
    ],
    [
      "expo-location",
      {
        locationAlwaysAndWhenInUsePermission:
          "MyExpense records the GPS coordinates of your trip's start and end points when you start and stop mileage tracking, so it can calculate the distance travelled for your SARS business mileage deduction. Location is only recorded while you are actively tracking a trip.",
      },
    ],
    "expo-font",
    "expo-secure-store",
    [
      "expo-notifications",
      {
        icon: "./assets/images/adaptive-icon.png",
        color: "#2B2B7A",
        defaultChannel: "default",
      },
    ],
    "expo-web-browser",
    "expo-apple-authentication",
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
