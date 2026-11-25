import React from "react";
import { Text } from "react-native";
import { Stack } from "expo-router";
import { renderRouter, screen, act } from "expo-router/testing-library";

jest.mock("@/components/ui/icon-symbol", () => ({ IconSymbol: () => null }));
const TabsLayout = require("@/app/(tabs)/_layout").default;
const TrackTab = require("@/app/(tabs)/add-expense").default;
const ScanTab = require("@/app/(tabs)/scan").default;
const S = (name: string) => () => <Text testID="screen">{name}</Text>;

it("landing on home with the real redirect tabs", async () => {
  const r = await renderRouter({
    _layout: () => <Stack screenOptions={{ headerShown: false }} />,
    "(tabs)/_layout": TabsLayout,
    "(tabs)/index": S("home"),
    "(tabs)/add-expense": TrackTab,
    "(tabs)/scan": ScanTab,
    "(tabs)/reports": S("reports"),
    "(tabs)/settings": S("settings"),
    "add-expense-manual": S("add-expense-manual"),
    "scan-receipt-camera": S("scan-camera"),
    "mileage-tracker": S("mileage"),
  }, { initialUrl: "/" });
  for (let i = 0; i < 5; i++) await act(async () => {});
  console.log("pathname after load:", r.getPathname(), "| rendered:", screen.queryAllByTestId("screen").map((n) => n.props.children).join(","));
  expect(r.getPathname()).toBe("/");
}, 60000);
