// Regression: in Expo Router 58, router.navigate() from a pushed screen no
// longer pops back to the tabs, so MXTabBar's Home left the paywall in the
// history and "back" from Add Expense returned to it. MXTabBar now uses
// dismissTo. Rendered with the real MXTabBar and tab layout.
import React from "react";
import { Text } from "react-native";
import { Stack, router } from "expo-router";
import { renderRouter, act, fireEvent, screen } from "expo-router/testing-library";
import { safeBack } from "@/lib/navigation";
import { MXTabBar } from "@/components/MXTabBar";

jest.mock("@/components/ui/icon-symbol", () => ({ IconSymbol: () => null }));
const TabsLayout = require("@/app/(tabs)/_layout").default;
const S = (name: string) => () => <Text testID="screen">{name}</Text>;
const WithBar = (name: string) => () => (<><Text testID="screen">{name}</Text><MXTabBar /></>);
const routes = {
  _layout: () => <Stack screenOptions={{ headerShown: false }} />,
  "(tabs)/_layout": TabsLayout,
  "(tabs)/index": S("home"), "(tabs)/add-expense": S("t"), "(tabs)/scan": S("s"),
  "(tabs)/reports": S("reports"), "(tabs)/settings": S("settings"),
  "add-expense-manual": WithBar("add-expense-manual"),
  "paywall-upgrade": WithBar("paywall"),
  "mileage-tracker": WithBar("mileage"),
  "vehicle-form": WithBar("vehicle-form"),
};
const tap = async (label: string) => {
  await act(async () => { fireEvent.press(screen.getAllByText(label).at(-1)!); });
};
const go = async (fn: () => void) => { await act(async () => { fn(); }); };

it("paywall -> MXTabBar Home -> add expense -> back never returns to the paywall", async () => {
  const r = await renderRouter(routes, { initialUrl: "/" });
  await go(() => router.navigate("/settings"));
  await go(() => router.push("/paywall-upgrade?from=settings"));
  await tap("Home");
  expect(r.getPathname()).toBe("/");
  await go(() => router.push("/add-expense-manual"));
  await go(() => safeBack(router as any));
  expect(r.getPathname()).toBe("/");
  expect(router.canGoBack()).toBe(false);
}, 60000);

it("MXTabBar Track returns to a tracker already in the history instead of opening a second one", async () => {
  const r = await renderRouter(routes, { initialUrl: "/" });
  await go(() => router.push("/mileage-tracker"));
  await go(() => router.push("/vehicle-form"));
  await tap("Track");
  expect(r.getPathname()).toBe("/mileage-tracker");
  await go(() => safeBack(router as any));
  expect(r.getPathname()).toBe("/");
}, 60000);

it("'Go to dashboard' (dismissTo) from a deep stack lands on Home with nothing to swipe back to", async () => {
  const r = await renderRouter(routes, { initialUrl: "/" });
  await go(() => router.navigate("/reports"));
  await go(() => router.push("/mileage-tracker"));
  await go(() => router.push("/add-expense-manual"));
  await go(() => router.dismissTo("/(tabs)" as any));
  expect(r.getPathname()).toBe("/");
  expect(router.canGoBack()).toBe(false);
}, 60000);
