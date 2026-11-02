// lib/analytics.ts is imported by app/_layout.tsx, so it must never throw on
// load or on a call when the Firebase native module is missing (Expo Go, or a
// pod left out of an iOS build, see playInAppUpdate.test.ts).
jest.mock("@react-native-firebase/analytics", () => {
  throw new Error("Native module RNFBAppModule not found");
});
jest.mock("react-native-mmkv", () => ({
  MMKV: jest.fn().mockImplementation(() => ({
    getBoolean: jest.fn(),
    set: jest.fn(),
  })),
}));
jest.mock("react-native", () => ({ Platform: { OS: "ios" } }));

describe("analytics without the Firebase native module", () => {
  it("imports without loading @react-native-firebase/analytics", () => {
    expect(() => require("@/lib/analytics")).not.toThrow();
  });

  it("turns every event into a no-op", () => {
    const a = require("@/lib/analytics");
    expect(() => {
      a.logSignUp("email");
      a.logLogin("google");
      a.logExpenseAdded("manual");
      a.logFirstReceiptScanned();
      a.logPaywallViewed("home");
      a.logSubscriptionPurchase({
        plan: "annual",
        productId: "pro_annual",
        price: 499,
        currency: "ZAR",
        freeTrial: false,
      });
      a.logScreen("(tabs)/reports");
    }).not.toThrow();
  });
});
