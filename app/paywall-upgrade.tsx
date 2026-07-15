import { MXButton } from "@/components/MXButton";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useAuthStore } from "@/stores/authStore";
import {
  PRODUCT_ANNUAL,
  PRODUCT_MONTHLY,
  useSubscriptionStore,
} from "@/stores/subscriptionStore";
import { colour, space, typography } from "@/tokens";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import { Alert, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { type PurchasesPackage } from "react-native-purchases";
import { SafeAreaView } from "react-native-safe-area-context";

const FEATURES: { label: string; icon: "camera.fill" | "car.fill" | "chart.bar.fill" | "square.and.arrow.up" }[] = [
  { label: "Unlimited receipt scanning & OCR", icon: "camera.fill" },
  { label: "Automatic mileage tracking", icon: "car.fill" },
  { label: "ITR12-ready category reports", icon: "chart.bar.fill" },
  { label: "Unlimited exports, anytime", icon: "square.and.arrow.up" },
];

// The RevenueCat webhook (supabase/functions/revenuecat-webhook) syncs
// profiles.subscription shortly after a purchase, but not synchronously with
// the purchase call returning — refresh once immediately, then once more
// after a short delay in case the webhook hasn't landed yet.
async function syncPremiumStatus(): Promise<void> {
  await useAuthStore.getState().refreshPremiumStatus().catch(() => {});
  if (!useAuthStore.getState().isPremium) {
    await new Promise((resolve) => setTimeout(resolve, 2000));
    await useAuthStore.getState().refreshPremiumStatus().catch(() => {});
  }
}

function FeatureRow({ label, icon }: { label: string; icon: (typeof FEATURES)[number]["icon"] }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: space.md }}>
      <View
        style={{
          width: 30,
          height: 30,
          borderRadius: 9,
          backgroundColor: `${colour.primary}40`,
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <IconSymbol name={icon} size={15} color={colour.onNoir} />
      </View>
      <Text style={{ ...typography.labelM, color: colour.onNoir, fontWeight: "600" }}>{label}</Text>
    </View>
  );
}

function PlanRow({
  active,
  name,
  sub,
  priceDisplay,
  period,
  savingPercent,
  onPress,
}: {
  active: boolean;
  name: string;
  sub: string;
  priceDisplay: string;
  period: string;
  savingPercent?: number;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={{
        borderWidth: 1.5,
        borderColor: active ? colour.primary300 : `${colour.onNoir}24`,
        backgroundColor: active ? `${colour.primary}24` : "transparent",
        borderRadius: 18,
        paddingVertical: space.md,
        paddingHorizontal: space.lg,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", flexShrink: 1 }}>
        <View
          style={{
            width: 20,
            height: 20,
            borderRadius: 10,
            borderWidth: 2,
            borderColor: active ? colour.primary300 : `${colour.onNoir}59`,
            backgroundColor: active ? colour.primary300 : "transparent",
            alignItems: "center",
            justifyContent: "center",
            marginRight: space.md,
            flexShrink: 0,
          }}
        >
          {active && (
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colour.noir }} />
          )}
        </View>
        <View style={{ flexShrink: 1 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm }}>
            <Text style={{ ...typography.labelM, color: colour.onNoir, fontWeight: "700" }}>{name}</Text>
            {!!savingPercent && savingPercent > 0 && (
              <View
                style={{
                  backgroundColor: colour.success,
                  borderRadius: 100,
                  paddingHorizontal: space.sm,
                  paddingVertical: 2,
                }}
              >
                <Text style={{ fontSize: 10, fontWeight: "700", color: colour.text }}>
                  Save {savingPercent}%
                </Text>
              </View>
            )}
          </View>
          <Text style={{ ...typography.bodyXS, color: colour.onNoir2, fontWeight: "500", marginTop: 3 }}>
            {sub}
          </Text>
        </View>
      </View>
      <View style={{ alignItems: "flex-end", flexShrink: 0 }}>
        <Text style={{ ...typography.labelM, color: colour.onNoir, fontWeight: "800" }}>{priceDisplay}</Text>
        <Text style={{ ...typography.bodyXS, color: colour.onNoir2, fontWeight: "500" }}>{period}</Text>
      </View>
    </TouchableOpacity>
  );
}

export default function PaywallUpgradeScreen() {
  const router = useRouter();
  const { isPremium } = useAuthStore();
  const { packages, loading, isPro, purchasePackage, restorePurchases, refresh } = useSubscriptionStore();

  const [selectedPlan, setSelectedPlan] = useState<"monthly" | "annual">("monthly");

  useEffect(() => {
    refresh().catch(console.warn);
  }, []);

  // ── Dev / premium bypass — skip paywall entirely ──────────────────────────
  useEffect(() => {
    if (isPremium) {
      router.replace("/(tabs)/settings" as any);
    }
  }, [isPremium]);

  // If already Pro via RevenueCat (e.g. restored), go back
  useEffect(() => {
    if (isPro) {
      Alert.alert("You're on Pro!", "Premium is already active on this account.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    }
  }, [isPro]);

  if (isPremium) return null;

  const monthlyPkg = packages.find((p) => p.product.identifier === PRODUCT_MONTHLY);
  const annualPkg = packages.find((p) => p.product.identifier === PRODUCT_ANNUAL);
  const selectedPkg: PurchasesPackage | undefined = selectedPlan === "monthly" ? monthlyPkg : annualPkg;

  // Fall back to hardcoded prices if RevenueCat packages aren't loaded yet
  const MONTHLY_PRICE = monthlyPkg?.product.price ?? 99;
  const ANNUAL_PRICE = annualPkg?.product.price ?? Math.round(99 * 12 * 0.8);
  const ANNUAL_SAVING = Math.round(MONTHLY_PRICE * 12 - ANNUAL_PRICE);
  const ANNUAL_SAVING_PCT = MONTHLY_PRICE > 0 ? Math.round((ANNUAL_SAVING / (MONTHLY_PRICE * 12)) * 100) : 0;

  const displayMonthly = monthlyPkg?.product.priceString ?? `R${MONTHLY_PRICE.toFixed(2)}`;
  const displayAnnual = annualPkg?.product.priceString ?? `R${ANNUAL_PRICE.toFixed(2)}`;

  const handlePurchase = async () => {
    if (!selectedPkg) {
      Alert.alert("Not available", "Products are still loading. Please try again in a moment.");
      return;
    }
    const success = await purchasePackage(selectedPkg);
    if (success) {
      await syncPremiumStatus();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        "Welcome to Pro! ⚡",
        "You now have unlimited access to all MyExpense features.",
        [{ text: "Let's go", onPress: () => router.back() }]
      );
    }
  };

  const handleRestore = async () => {
    const restored = await restorePurchases();
    if (restored) {
      await syncPremiumStatus();
      Alert.alert("Purchases restored", "Your Pro subscription has been restored.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } else {
      Alert.alert("Nothing to restore", "No active Pro subscription was found on this account.");
    }
  };

  return (
    <SafeAreaView edges={["top", "bottom"]} style={{ flex: 1, backgroundColor: colour.noir }}>
      <StatusBar style="light" />

      <View pointerEvents="none" style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}>
        <View
          style={{
            position: "absolute",
            width: 220,
            height: 220,
            borderRadius: 110,
            backgroundColor: `${colour.primary}8C`,
            top: -70,
            right: -70,
          }}
        />
        <View
          style={{
            position: "absolute",
            width: 160,
            height: 160,
            borderRadius: 80,
            backgroundColor: `${colour.primary}40`,
            top: 120,
            left: -70,
          }}
        />
      </View>

      <View style={{ flexDirection: "row", justifyContent: "flex-end", paddingHorizontal: space.lg, paddingTop: space.xs }}>
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={{
            width: 32,
            height: 32,
            borderRadius: 16,
            backgroundColor: `${colour.onNoir}1F`,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <IconSymbol name="xmark" size={14} color={colour.onNoir} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: space.xxl, paddingBottom: space.xxl }}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={{
            width: 52,
            height: 52,
            borderRadius: 16,
            backgroundColor: `${colour.onNoir}1F`,
            alignItems: "center",
            justifyContent: "center",
            marginTop: space.sm,
            marginBottom: space.lg,
          }}
        >
          <IconSymbol name="crown.fill" size={24} color={colour.onNoir} />
        </View>

        <Text style={{ ...typography.h2, fontWeight: "800", color: colour.onNoir, lineHeight: 34 }}>
          Go <Text style={{ color: colour.primary300 }}>Pro</Text> with{"\n"}MyExpense.
        </Text>
        <Text
          style={{
            ...typography.bodyM,
            color: colour.onNoir2,
            fontWeight: "500",
            lineHeight: 21,
            marginTop: space.sm,
            marginBottom: space.xxl,
          }}
        >
          Unlimited receipt scanning, automatic ITR12 categorisation and full SARS-ready reports.
        </Text>

        <View style={{ gap: space.md, marginBottom: space.xxl }}>
          {FEATURES.map((f) => (
            <FeatureRow key={f.label} {...f} />
          ))}
        </View>

        <View style={{ gap: space.sm, marginBottom: space.lg }}>
          <PlanRow
            active={selectedPlan === "annual"}
            name="Annual"
            sub="Billed once a year"
            priceDisplay={displayAnnual}
            period="/year"
            savingPercent={ANNUAL_SAVING_PCT}
            onPress={() => setSelectedPlan("annual")}
          />
          <PlanRow
            active={selectedPlan === "monthly"}
            name="Monthly"
            sub="Billed every month"
            priceDisplay={displayMonthly}
            period="/month"
            onPress={() => setSelectedPlan("monthly")}
          />
        </View>

        <MXButton
          label={loading ? "Loading..." : "Continue"}
          variant="primary"
          size="L"
          onPress={handlePurchase}
          fullWidth
        />

        <Text
          style={{
            ...typography.bodyXS,
            color: colour.onNoir2,
            opacity: 0.85,
            textAlign: "center",
            lineHeight: 17,
            marginTop: space.md,
            marginBottom: space.lg,
          }}
        >
          Cancel anytime. Renews automatically until cancelled.{"\n"}By continuing you agree to our{" "}
          <Text style={{ color: colour.onNoir2, textDecorationLine: "underline" }} onPress={() => router.push("/terms" as any)}>
            Terms
          </Text>{" "}
          and{" "}
          <Text style={{ color: colour.onNoir2, textDecorationLine: "underline" }} onPress={() => router.push("/privacy" as any)}>
            Privacy Policy
          </Text>
          .
        </Text>

        <View style={{ flexDirection: "row", justifyContent: "center", gap: space.xxl }}>
          <Text
            style={{ ...typography.bodyXS, color: colour.onNoir2, opacity: 0.85, fontWeight: "500" }}
            onPress={loading ? undefined : handleRestore}
          >
            Restore purchase
          </Text>
          <Text
            style={{ ...typography.bodyXS, color: colour.onNoir2, opacity: 0.85, fontWeight: "500" }}
            onPress={() => router.back()}
          >
            Maybe later
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
