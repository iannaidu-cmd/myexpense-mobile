import { MXBackHeader } from "@/components/MXBackHeader";
import { MXButton } from "@/components/MXButton";
import { MXTabBar } from "@/components/MXTabBar";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useAuthStore } from "@/stores/authStore";
import { useSubscriptionStore } from "@/stores/subscriptionStore";
import { colour, radius, space, typography } from "@/tokens";
import { useRouter } from "expo-router";
import React, { useEffect } from "react";
import { Alert, Linking, Platform, ScrollView, StatusBar, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function SubscriptionManageScreen() {
  const router = useRouter();
  const { isPremium, isDevUser, subscription } = useAuthStore();
  const { customerInfo, loading, restorePurchases, refresh } = useSubscriptionStore();

  useEffect(() => {
    refresh().catch(console.warn);
  }, []);

  const planLabel =
    isDevUser ? "Developer account" :
    subscription === "pro" ? "Pro plan" :
    subscription === "business" ? "Business plan" : "Free plan";

  const entitlement = customerInfo?.entitlements?.active?.["pro"];
  const expiryDate = entitlement?.expirationDate
    ? new Date(entitlement.expirationDate).toLocaleDateString("en-ZA", {
        day: "numeric", month: "long", year: "numeric",
      })
    : null;

  const handleManage = () => {
    const url = customerInfo?.managementURL;
    if (url) {
      Linking.openURL(url);
    } else {
      const storeUrl =
        Platform.OS === "ios"
          ? "https://apps.apple.com/account/subscriptions"
          : "https://play.google.com/store/account/subscriptions";
      Linking.openURL(storeUrl);
    }
  };

  const handleRestore = async () => {
    const restored = await restorePurchases();
    if (restored) {
      Alert.alert("Purchases restored", "Your Pro subscription has been restored.");
    } else {
      Alert.alert("Nothing to restore", "No active purchases found on this account.");
    }
  };

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: colour.background }}>
      <StatusBar barStyle="dark-content" backgroundColor={colour.background} />
      <MXBackHeader title="Subscription" onBack={() => router.back()} />

      <ScrollView contentContainerStyle={{ padding: space.lg, gap: space.lg }}>
        {/* Plan status card */}
        <View
          style={{
            backgroundColor: colour.surface,
            borderRadius: radius.lg,
            padding: space.lg,
            gap: space.sm,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm }}>
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: colour.primary + "22",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <IconSymbol name="crown.fill" size={20} color={colour.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ ...typography.labelM, color: colour.text }}>{planLabel}</Text>
              <Text style={{ ...typography.bodyS, color: colour.textSecondary }}>
                {isDevUser
                  ? "All features unlocked · Developer access"
                  : isPremium
                  ? "Active · All features unlocked"
                  : "Upgrade to unlock all features"}
              </Text>
            </View>
          </View>

          {expiryDate && !isDevUser && (
            <View
              style={{
                borderTopWidth: 1,
                borderTopColor: colour.border,
                paddingTop: space.sm,
              }}
            >
              <Text style={{ ...typography.bodyS, color: colour.textHint }}>
                Renews {expiryDate}
              </Text>
            </View>
          )}
        </View>

        {/* Actions */}
        {!isDevUser && (
          <View style={{ gap: space.sm }}>
            <MXButton
              label={`Manage on ${Platform.OS === "ios" ? "App Store" : "Google Play"}`}
              onPress={handleManage}
              variant="primary"
              loading={loading}
            />
            <MXButton
              label="Restore purchases"
              onPress={handleRestore}
              variant="ghost"
              loading={loading}
            />
          </View>
        )}

        <Text
          style={{
            ...typography.bodyXS,
            color: colour.textHint,
            textAlign: "center",
          }}
        >
          Subscription managed by {Platform.OS === "ios" ? "Apple" : "Google"} · Cancel anytime
        </Text>
      </ScrollView>

      <MXTabBar />
    </SafeAreaView>
  );
}
