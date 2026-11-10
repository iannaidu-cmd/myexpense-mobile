import { SubscriptionScreen } from "@/components/SubscriptionScreen";
import React from "react";

// Every upgrade and limit-reached entry point lands here. Same screen as
// /subscription-manage: it shows the free or Pro view from live data.
export default function PaywallUpgradeScreen() {
  return <SubscriptionScreen defaultFrom="unknown" />;
}
