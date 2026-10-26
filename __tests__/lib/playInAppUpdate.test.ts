// expo-in-app-updates isn't linked into iOS builds (its pod needs iOS 16.4,
// the app targets 15.1), and its JS throws on load when the native module is
// missing. lib/playInAppUpdate.ts is imported by app/_layout.tsx, so loading
// the package from iOS crashed every launch (App Review, 1.2.13 build 96).
jest.mock("expo-in-app-updates", () => {
  throw new Error("Cannot find native module 'ExpoInAppUpdates'");
});
jest.mock("@/services/funnelService", () => ({ trackFunnel: jest.fn() }));
jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

describe("playInAppUpdate on iOS", () => {
  it("imports without loading expo-in-app-updates", () => {
    expect(() => require("@/lib/playInAppUpdate")).not.toThrow();
  });

  it("is a no-op that never touches the native module", async () => {
    const { promptPlayUpdateIfAvailable } = require("@/lib/playInAppUpdate");
    await expect(promptPlayUpdateIfAvailable()).resolves.toBeUndefined();
  });
});
