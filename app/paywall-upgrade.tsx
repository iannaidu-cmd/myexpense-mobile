import { MXButton } from "@/components/MXButton";
import { MXCard } from "@/components/MXCard";
import { MXTabBar } from "@/components/MXTabBar";
import { colour, radius, space, typography } from "@/tokens";
import { useRouter } from "expo-router";
import React from "react";
import {
    Platform,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
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

  // R99/month · annual = R99 × 12 × 0.8 = R950/yr (save 20%)
  const MONTHLY_PRICE = 99;
  const ANNUAL_PRICE = Math.round(MONTHLY_PRICE * 12 * 0.8);
  const ANNUAL_SAVING = Math.round(MONTHLY_PRICE * 12 - ANNUAL_PRICE);

  return (
    <SafeAreaView
      edges={["top"]}
      style={{ flex: 1, backgroundColor: colour.white }}
    >
      {/* Header */}
      <View
        style={{
          backgroundColor: colour.white,
          paddingHorizontal: space.xl,
          paddingTop: space.md,
          paddingBottom: space.md,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottomWidth: 1,
          borderBottomColor: colour.borderLight,
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Text style={{ ...typography.actionM, color: colour.textSub }}>
            ← Back
          </Text>
        </TouchableOpacity>
        <Text
          style={{ ...typography.h4, color: colour.text, fontWeight: "700" }}
        >
          Upgrade
        </Text>
        <TouchableOpacity
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Text style={{ ...typography.actionS, color: colour.primary }}>
            Restore
          </Text>
        </TouchableOpacity>
      </View>

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
          <Text style={{ fontSize: 36, lineHeight: 42 }}>⚡</Text>
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

        {/* Price block */}
        <MXCard noBorder padding={0}>
          <View
            style={{
              backgroundColor: colour.primary50,
              borderRadius: radius.lg,
              padding: space.lg,
              alignItems: "center",
              gap: space.xs,
            }}
          >
            {/* Most Popular pill */}
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
                Most popular
              </Text>
            </View>

            {/* Price */}
            <View
              style={{ flexDirection: "row", alignItems: "flex-start", gap: 2 }}
            >
              <Text
                style={{
                  ...typography.bodyM,
                  color: colour.primary,
                  fontWeight: "700",
                  marginTop: 8,
                }}
              >
                R
              </Text>
              <Text
                style={{
                  ...typography.amountXL,
                  color: colour.primary,
                  fontWeight: "800",
                  fontSize: 52,
                  lineHeight: 60,
                }}
              >
                {MONTHLY_PRICE}
              </Text>
              <Text
                style={{
                  ...typography.bodyS,
                  color: colour.textSub,
                  marginTop: 16,
                }}
              >
                /month
              </Text>
            </View>

            <Text style={{ ...typography.bodyS, color: colour.textSub }}>
              Billed monthly · Cancel anytime
            </Text>

            {/* Annual nudge */}
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
                💡 Save 20% with annual billing — R{ANNUAL_PRICE}/yr (save R
                {ANNUAL_SAVING})
              </Text>
            </View>
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
          <Text style={{ fontSize: 28 }}>🧾</Text>
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
            ),
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
          label={`Upgrade to Premium — R${MONTHLY_PRICE}/month`}
          variant="primary"
          size="L"
          onPress={() => {
            // TODO: PayFast flow — activate when merchant account is ready
          }}
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
          Secure payment via PayFast · No hidden fees · Cancel anytime
        </Text>
      </View>

      <MXTabBar />
    </SafeAreaView>
  );
}
