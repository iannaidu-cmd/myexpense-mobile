import { SubscriptionScreen } from "@/components/SubscriptionScreen";
import React from "react";

// Settings, Help and the billing-issue banner land here. Same screen as
// /paywall-upgrade: it shows the free or Pro view from live data.
export default function SubscriptionManageScreen() {
  return <SubscriptionScreen defaultFrom="subscription_manage" />;
}
