// Real AuthGate + expo-router 58, driven by a stand-in auth store. Records
// every pathname so a one-frame flash to onboarding/sign-up shows up.
import React, { useEffect } from "react";
import { Text } from "react-native";
import { Stack, usePathname, router } from "expo-router";
import { renderRouter, act } from "expo-router/testing-library";
import { create } from "zustand";

type S = {
  user: { id: string; email: string } | null;
  isInitialised: boolean;
  pendingEmailVerification: string | null;
  isAccessBlocked: boolean;
  isPendingDeletion: boolean;
};
const mockStore = create<S>(() => ({
  user: null, isInitialised: false, pendingEmailVerification: null,
  isAccessBlocked: false, isPendingDeletion: false,
}));
jest.mock("@/stores/authStore", () => ({ useAuthStore: (...a: any[]) => (mockStore as any)(...a) }));
jest.mock("@/components/ui/icon-symbol", () => ({ IconSymbol: () => null }));

const { AuthGate } = require("@/components/AuthGate");
const TabsLayout = require("@/app/(tabs)/_layout").default;

let visited: string[] = [];
function PathLog() {
  const p = usePathname();
  useEffect(() => { if (visited.at(-1) !== p) visited.push(p); }, [p]);
  return null;
}
const Sc = (n: string) => () => <Text>{n}</Text>;
const routes = {
  _layout: () => (<><AuthGate /><PathLog /><Stack screenOptions={{ headerShown: false }} /></>),
  "(tabs)/_layout": TabsLayout,
  "(tabs)/index": Sc("home"), "(tabs)/add-expense": Sc("t"), "(tabs)/scan": Sc("s"),
  "(tabs)/reports": Sc("reports"), "(tabs)/settings": Sc("settings"),
  "onboarding-step-1": Sc("onboarding"), "sign-up": Sc("sign-up"), "sign-in": Sc("sign-in"),
  "add-expense-manual": Sc("add"), "profile-setup": Sc("ps"),
};
const flush = async () => { for (let i = 0; i < 6; i++) await act(async () => { jest.advanceTimersByTime(100); }); };
const set = async (p: Partial<S>) => { await act(async () => { mockStore.setState(p); }); await flush(); };
const user = { id: "u1", email: "a@b.c" };

beforeEach(() => {
  visited = [];
  mockStore.setState({ user: null, isInitialised: false, pendingEmailVerification: null, isAccessBlocked: false, isPendingDeletion: false });
});

it("cold start, signed in: never leaves home", async () => {
  await renderRouter(routes, { initialUrl: "/" });
  await flush();
  await set({ isInitialised: true, user });
  console.log("cold start signed in:", visited.join(" -> "));
  expect(visited).toEqual(["/"]);
}, 60000);

it("token refresh (new user object, same id) while on home: no navigation", async () => {
  await renderRouter(routes, { initialUrl: "/" });
  await set({ isInitialised: true, user });
  for (let i = 0; i < 3; i++) await set({ user: { ...user } });
  console.log("token refresh:", visited.join(" -> "));
  expect(visited).toEqual(["/"]);
}, 60000);

it("browsing tabs and a pushed screen while signed in: no auth screens", async () => {
  await renderRouter(routes, { initialUrl: "/" });
  await set({ isInitialised: true, user });
  await act(async () => { router.navigate("/settings"); }); await flush();
  await act(async () => { router.push("/add-expense-manual"); }); await flush();
  await act(async () => { router.back(); }); await flush();
  await act(async () => { router.navigate("/"); }); await flush();
  console.log("browsing:", visited.join(" -> "));
  expect(visited.some((p) => /onboarding|sign-up|sign-in/.test(p))).toBe(false);
}, 60000);

it("sign in from the sign-in screen goes straight to home", async () => {
  await renderRouter(routes, { initialUrl: "/onboarding-step-1" });
  await set({ isInitialised: true });
  await act(async () => { router.replace("/sign-in"); }); await flush();
  await set({ user });
  console.log("sign in:", visited.join(" -> "));
  expect(visited.at(-1)).toBe("/");
  expect(visited.slice(visited.indexOf("/sign-in") + 1)).toEqual(["/"]);
}, 60000);
