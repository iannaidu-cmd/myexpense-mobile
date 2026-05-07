import { MXButton } from "@/components/MXButton";
import { MXCard } from "@/components/MXCard";
import { MXHeader } from "@/components/MXHeader";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { MXTabBar } from "@/components/MXTabBar";
import { useAuthStore } from "@/stores/authStore";
import {
  PRODUCT_ANNUAL,
  PRODUCT_MONTHLY,
  useSubscriptionStore,
} from "@/stores/subscriptionStore";
import { colour, radius, space, typography } from "@/tokens";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { type PurchasesPackage } from "react-native-purchases";
import { SafeAreaView } from "react-native-safe-area-context";

const PREMIUM_FEATURES = [
  "Unlimited OCR receipt scanning",
  "Full SARS ITR12 categorisation (S11(a), S11(e) & more)",
  "Automated deduction optimisation",
  "Export-ready tax reports (PDF & CSV)",
  "Multi-device sync",
  "Priority support",
  "POPIA-compliant data storage",
];

const FREE_FEATURES = [
  "Up to 10 receipts per month",
  "Basic ITR12 expense categories",
  "Manual expense entry",
  "Monthly summary report",
];

function SectionLabel({ children }: { children: string }) {
  return (
    <Text
      style={{
        ...typography.labelS,
        color: colour.textHint,
        letterSpacing: 0.8,
        marginBottom: space.xs,
      }}
    >
      {children}
    </Text>
  );
}

function FeatureRow({
  label,
  muted = false,
}: {
  label: string;
  muted?: boolean;
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "flex-start",
        gap: space.sm,
        paddingVertical: space.xs,
      }}
    >
      <View
        style={{
          width: 22,
          height: 22,
          borderRadius: 11,
          backgroundColor: muted ? colour.surface2 : colour.successBg,
          alignItems: "center",
          justifyContent: "center",
          marginTop: 1,
          flexShrink: 0,
        }}
      >
        <Text
          style={{
            fontSize: 12,
            fontWeight: "700",
            color: muted ? colour.textDisabled : colour.successMid,
            lineHeight: 16,
          }}
        >
          ✓
        </Text>
      </View>
      <Text
        style={{
          ...typography.bodyM,
          color: muted ? colour.textDisabled : colour.text,
          flex: 1,
        }}
      >
        {label}
      </Text>
    </View>
  );
}

export default function PaywallUpgradeScreen() {
  const router = useRouter();
  const { isPremium } = useAuthStore();
  const {
    packages,
    loading,
    isPro,
    purchasePackage,
    restorePurchases,
    refresh,
  } = useSubscriptionStore();

  const [selectedPlan, setSelectedPlan] = useState<"monthly" | "annual">(
    "monthly"
  );

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
      Alert.alert(
        "You're on Pro!",
        "Premium is already active on this account.",
        [{ text: "OK", onPress: () => router.back() }]
      );
    }
  }, [isPro]);

  if (isPremium) return null;

  const monthlyPkg = packages.find(
    (p) => p.product.identifier === PRODUCT_MONTHLY
  );
  const annualPkg = packages.find(
    (p) => p.product.identifier === PRODUCT_ANNUAL
  );
  const selectedPkg: PurchasesPackage | undefined =
    selectedPlan === "monthly" ? monthlyPkg : annualPkg;

  // Fall back to hardcoded prices if RevenueCat packages aren't loaded yet
  const MONTHLY_PRICE = monthlyPkg?.product.price ?? 99;
  const ANNUAL_PRICE = annualPkg?.product.price ?? Math.round(99 * 12 * 0.8);
  const ANNUAL_SAVING = Math.round(MONTHLY_PRICE * 12 - ANNUAL_PRICE);

  const handlePurchase = async () => {
    if (!selectedPkg) {
      Alert.alert(
        "Not available",
        "Products are still loading. Please try again in a moment."
      );
      return;
    }
    const success = await purchasePackage(selectedPkg);
    if (success) {
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
      Alert.alert(
        "Purchases restored",
        "Your Pro subscription has been restored.",
        [{ text: "OK", onPress: () => router.back() }]
      );
    } else {
      Alert.alert(
        "Nothing to restore",
        "No active Pro subscription was found on this account."
      );
    }
  };

  const displayMonthly = monthlyPkg?.product.priceString ?? `R${MONTHLY_PRICE}`;
  const displayAnnual = annualPkg?.product.priceString ?? `R${ANNUAL_PRICE}`;

  return (
    <SafeAreaView
      edges={["top"]}
      style={{ flex: 1, backgroundColor: colour.white }}
    >
      <MXHeader
        title="Upgrade"
        showBack
        right={
          <TouchableOpacity
            onPress={handleRestore}
            disabled={loading}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={{ ...typography.actionS, color: colour.primary }}>
              Restore
            </Text>
          </TouchableOpacity>
        }
      />

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: space.lg,
          paddingTop: space.xl,
          paddingBottom: space.xxxl,
          gap: space.lg,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <View style={{ alignItems: "center", gap: space.xs }}>
          <IconSymbol name="bolt.fill" size={36} color={colour.primary} />
          <Text
            style={{
              ...typography.h2,
              fontWeight: "800",
              color: colour.text,
              textAlign: "center",
            }}
          >
            Unlock Premium
          </Text>
          <Text
            style={{
              ...typography.bodyM,
              color: colour.textSub,
              textAlign: "center",
              lineHeight: 22,
            }}
          >
            Claim every deduction you're entitled to.{"\n"}
            Let MyExpense handle the SARS heavy lifting.
          </Text>
        </View>

        {/* Plan selector */}
        <MXCard noBorder padding={0}>
          {/* Toggle row */}
          <View
            style={{
              flexDirection: "row",
              backgroundColor: colour.surface1,
              borderRadius: radius.md,
              padding: 4,
              marginBottom: space.md,
            }}
          >
            {(["monthly", "annual"] as const).map((plan) => (
              <TouchableOpacity
                key={plan}
                onPress={() => setSelectedPlan(plan)}
                style={{
                  flex: 1,
                  paddingVertical: space.sm,
                  borderRadius: radius.sm,
                  alignItems: "center",
                  backgroundColor:
                    selectedPlan === plan ? colour.white : "transparent",
                  ...(selectedPlan === plan && Platform.OS === "ios"
                    ? { shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } }
                    : selectedPlan === plan && Platform.OS === "android"
                    ? { elevation: 2 }
                    : {}),
                }}
              >
                <Text
                  style={{
                    ...typography.labelM,
                    color:
                      selectedPlan === plan ? colour.primary : colour.textSub,
                    fontWeight: selectedPlan === plan ? "700" : "500",
                  }}
                >
                  {plan === "monthly" ? "Monthly" : "Annual"}
                </Text>
                {plan === "annual" && ANNUAL_SAVING > 0 && (
                  <Text
                    style={{
                      ...typography.bodyXS,
                      color: colour.success,
                      fontWeight: "600",
                    }}
                  >
                    Save R{ANNUAL_SAVING}
                  </Text>
                )}
              </TouchableOpacity>
            ))}
          </View>

          {/* Price display */}
          <View
            style={{
              backgroundColor: colour.primary50,
              borderRadius: radius.lg,
              padding: space.lg,
              alignItems: "center",
              gap: space.xs,
            }}
          >
            <View
              style={{
                backgroundColor: colour.primary,
                borderRadius: radius.pill,
                paddingHorizontal: space.md,
                paddingVertical: space.xxs,
                marginBottom: space.xs,
              }}
            >
              <Text
                style={{
                  ...typography.labelS,
                  color: colour.onPrimary,
                  fontWeight: "700",
                  letterSpacing: 0.6,
                }}
              >
                {selectedPlan === "monthly" ? "Most popular" : "Best value"}
              </Text>
            </View>

            <Text
              style={{
                ...typography.amountXL,
                color: colour.primary,
                fontWeight: "800",
                fontSize: 52,
                lineHeight: 60,
              }}
            >
              {selectedPlan === "monthly" ? displayMonthly : displayAnnual}
            </Text>
            <Text style={{ ...typography.bodyS, color: colour.textSub }}>
              {selectedPlan === "monthly"
                ? "Billed monthly · Cancel anytime"
                : `Billed annually · ${displayMonthly}/mo equivalent`}
            </Text>

            {selectedPlan === "monthly" && ANNUAL_SAVING > 0 && (
              <View
                style={{
                  backgroundColor: colour.successBg,
                  borderRadius: radius.sm,
                  paddingHorizontal: space.md,
                  paddingVertical: space.xxs,
                  marginTop: space.xs,
                }}
              >
                <Text
                  style={{
                    ...typography.bodyXS,
                    color: colour.success,
                    fontWeight: "600",
                  }}
                >
                  💡 Save 20% with annual — R{ANNUAL_SAVING}/yr savings
                </Text>
              </View>
            )}
          </View>
        </MXCard>

        {/* Feature comparison */}
        <MXCard>
          <SectionLabel>Premium — everything you need</SectionLabel>
          {PREMIUM_FEATURES.map((f) => (
            <FeatureRow key={f} label={f} />
          ))}

          <View
            style={{
              height: 1,
              backgroundColor: colour.borderLight,
              marginVertical: space.md,
            }}
          />

          <SectionLabel>Free plan — what you have now</SectionLabel>
          {FREE_FEATURES.map((f) => (
            <FeatureRow key={f} label={f} muted />
          ))}
        </MXCard>

        {/* Value callout */}
        <View
          style={{
            backgroundColor: colour.primary50,
            borderRadius: radius.md,
            padding: space.md,
            flexDirection: "row",
            alignItems: "center",
            gap: space.md,
          }}
        >
          <IconSymbol name="doc.text.fill" size={28} color={colour.primary} />
          <View style={{ flex: 1 }}>
            <Text style={{ ...typography.labelM, color: colour.primary }}>
              Less than one accountant visit
            </Text>
            <Text
              style={{
                ...typography.bodyXS,
                color: colour.textSub,
                marginTop: 2,
              }}
            >
              At R99/month, MyExpense costs less than a single hour with a tax
              practitioner — and works year-round.
            </Text>
          </View>
        </View>

        {/* Trust badges */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "center",
            flexWrap: "wrap",
            gap: space.sm,
          }}
        >
          {["🔒 POPIA Compliant", "🇿🇦 SARS Aligned", "✕ Cancel Anytime"].map(
            (badge) => (
              <View
                key={badge}
                style={{
                  backgroundColor: colour.surface1,
                  borderRadius: radius.pill,
                  paddingHorizontal: space.md,
                  paddingVertical: space.xxs,
                  borderWidth: 1,
                  borderColor: colour.borderLight,
                }}
              >
                <Text
                  style={{
                    ...typography.bodyXS,
                    color: colour.textSub,
                    fontWeight: "500",
                  }}
                >
                  {badge}
                </Text>
              </View>
            )
          )}
        </View>
      </ScrollView>

      {/* Pinned CTA footer */}
      <View
        style={{
          backgroundColor: colour.white,
          paddingHorizontal: space.lg,
          paddingTop: space.md,
          paddingBottom: space.lg,
          borderTopWidth: 1,
          borderTopColor: colour.borderLight,
          ...Platform.select({
            ios: {
              shadowOffset: { width: 0, height: -4 },
              shadowOpacity: 0.06,
              shadowRadius: 12,
            },
            android: { elevation: 8 },
            default: { boxShadow: "0px -4px 12px rgba(0,0,0,0.06)" },
          }),
        }}
      >
        <MXButton
          label={
            loading
              ? "Loading..."
              : selectedPlan === "monthly"
                ? `Start Pro — ${displayMonthly}/month`
                : `Start Pro — ${displayAnnual}/year`
          }
          variant="primary"
          size="L"
          onPress={handlePurchase}
          fullWidth
        />
        <Text
          style={{
            ...typography.bodyXS,
            color: colour.textHint,
            textAlign: "center",
            marginTop: space.xs,
          }}
        >
          Subscription managed by{" "}
          {Platform.OS === "ios" ? "Apple" : "Google"} · Cancel anytime
        </Text>
      </View>

      <MXTabBar />
    </SafeAreaView>
  );
}
