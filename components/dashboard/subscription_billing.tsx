import React, { useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { colour } from "@/tokens";

// ─── Colour aliases mapped to design tokens ───────────────────────────────────
const C = {
  navy: colour.primary,
  navyDark: colour.navyDark,
  teal: colour.teal,
  midNavy: colour.midNavy2,
  midNavy2: colour.midNavy2,
  bgLight: colour.surface2,
  bgLighter: colour.background,
  white: colour.white,
  text: colour.text,
  textSub: colour.textSub,
  border: colour.borderLight,
  success: colour.success,
  warning: colour.warning,
  danger: colour.danger,
};

const NAV = { Home: "⊞", Scan: "⊡", Reports: "◈", Settings: "⚙" };

function PhoneShell({
  children,
  activeTab = "Settings",
  navigation,
}: {
  children: React.ReactNode;
  activeTab?: string;
  navigation?: any;
}) {
  const tabs = [
    { key: "Home", label: "Home", icon: NAV.Home },
    { key: "Scan", label: "Scan", icon: NAV.Scan },
    { key: "Reports", label: "Reports", icon: NAV.Reports },
    { key: "Settings", label: "Settings", icon: NAV.Settings },
  ];
  return (
    <View style={{ flex: 1, backgroundColor: C.bgLighter }}>
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        {children}
      </ScrollView>
      <View
        style={{
          flexDirection: "row",
          backgroundColor: C.white,
          borderTopWidth: 1,
          borderTopColor: C.border,
          paddingBottom: 8,
          paddingTop: 6,
        }}
      >
        {tabs.map((t) => (
          <TouchableOpacity
            key={t.key}
            onPress={() => navigation?.navigate(t.key)}
            style={{ flex: 1, alignItems: "center" }}
          >
            <Text
              style={{
                fontSize: 20,
                color: activeTab === t.key ? C.teal : C.textSub,
              }}
            >
              {t.icon}
            </Text>
            <Text
              style={{
                fontSize: 10,
                marginTop: 2,
                color: activeTab === t.key ? C.teal : C.textSub,
                fontWeight: activeTab === t.key ? "700" : "400",
              }}
            >
              {t.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

// ─── Plan Card ────────────────────────────────────────────────────────────────
function PlanCard({
  name,
  price,
  period,
  features,
  current,
  recommended,
  onSelect,
}: {
  name: string;
  price: string;
  period: string;
  features: string[];
  current?: boolean;
  recommended?: boolean;
  onSelect?: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onSelect}
      style={{
        backgroundColor: current ? C.navy : C.white,
        borderRadius: 14,
        padding: 18,
        marginBottom: 12,
        borderWidth: current ? 0 : 2,
        borderColor: recommended ? C.teal : C.border,
        shadowColor: C.navy,
        shadowOpacity: 0.08,
        shadowRadius: 6,
        elevation: 2,
      }}
    >
      {/* Header row */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 10,
        }}
      >
        <View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Text
              style={{
                fontSize: 16,
                fontWeight: "800",
                color: current ? C.white : C.text,
              }}
            >
              {name}
            </Text>
            {current && (
              <View
                style={{
                  backgroundColor: C.teal,
                  borderRadius: 6,
                  paddingHorizontal: 8,
                  paddingVertical: 3,
                }}
              >
                <Text
                  style={{ color: C.white, fontSize: 10, fontWeight: "700" }}
                >
                  CURRENT
                </Text>
              </View>
            )}
            {recommended && !current && (
              <View
                style={{
                  backgroundColor: C.teal,
                  borderRadius: 6,
                  paddingHorizontal: 8,
                  paddingVertical: 3,
                }}
              >
                <Text
                  style={{ color: C.white, fontSize: 10, fontWeight: "700" }}
                >
                  POPULAR
                </Text>
              </View>
            )}
          </View>
          <Text
            style={{
              color: current ? C.textSub : C.textSub,
              fontSize: 12,
              marginTop: 2,
            }}
          >
            Per {period}
          </Text>
        </View>
        <Text
          style={{
            fontSize: 22,
            fontWeight: "900",
            color: current ? C.teal : C.navy,
          }}
        >
          {price}
        </Text>
      </View>

      {/* Feature list */}
      {features.map((f, i) => (
        <View
          key={i}
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginBottom: 5,
          }}
        >
          <Text style={{ color: C.teal, fontSize: 13, marginRight: 8 }}>✓</Text>
          <Text
            style={{ fontSize: 12, color: current ? C.white : C.text, flex: 1 }}
          >
            {f}
          </Text>
        </View>
      ))}
    </TouchableOpacity>
  );
}

// ─── Billing History Row ──────────────────────────────────────────────────────
function BillingRow({
  date,
  description,
  amount,
  status,
}: {
  date: string;
  description: string;
  amount: string;
  status: string;
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: C.border,
      }}
    >
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 13, fontWeight: "600", color: C.text }}>
          {description}
        </Text>
        <Text style={{ fontSize: 11, color: C.textSub, marginTop: 2 }}>
          {date}
        </Text>
      </View>
      <View style={{ alignItems: "flex-end" }}>
        <Text style={{ fontSize: 13, fontWeight: "700", color: C.navy }}>
          {amount}
        </Text>
        <View
          style={{
            marginTop: 4,
            backgroundColor: status === "Paid" ? colour.successBg : colour.dangerBg,
            borderRadius: 6,
            paddingHorizontal: 6,
            paddingVertical: 2,
          }}
        >
          <Text
            style={{
              fontSize: 10,
              fontWeight: "700",
              color: status === "Paid" ? C.success : C.danger,
            }}
          >
            {status}
          </Text>
        </View>
      </View>
    </View>
  );
}

// ─── SCREEN: Subscription & Billing ──────────────────────────────────────────
export default function SubscriptionBillingScreen({
  navigation,
}: {
  navigation?: any;
}) {
  const [billingCycle, setBillingCycle] = useState("monthly");

  const plans = [
    {
      name: "Free",
      price: "R 0",
      period: "month",
      features: [
        "Up to 20 expenses/month",
        "Basic ITR12 categories",
        "Manual receipt capture",
      ],
      current: false,
      recommended: false,
    },
    {
      name: "Pro",
      price: billingCycle === "monthly" ? "R 99" : "R 79",
      period: "month",
      features: [
        "Unlimited expenses",
        "OCR receipt scanning",
        "Full ITR12 category suite",
        "Monthly trend reports",
        "Budget tracking",
        "Deduction forecasting",
      ],
      current: true,
      recommended: true,
    },
  ];

  const billingHistory = [
    {
      date: "1 Mar 2025",
      description: "Pro Plan — Monthly",
      amount: "R 99.00",
      status: "Paid",
    },
    {
      date: "1 Feb 2025",
      description: "Pro Plan — Monthly",
      amount: "R 99.00",
      status: "Paid",
    },
    {
      date: "1 Jan 2025",
      description: "Pro Plan — Monthly",
      amount: "R 99.00",
      status: "Paid",
    },
    {
      date: "1 Dec 2024",
      description: "Pro Plan — Monthly",
      amount: "R 99.00",
      status: "Paid",
    },
  ];

  return (
    <PhoneShell activeTab="Settings" navigation={navigation}>
      {/* Header */}
      <View
        style={{
          backgroundColor: C.navy,
          paddingTop: 52,
          paddingBottom: 28,
          paddingHorizontal: 20,
        }}
      >
        <TouchableOpacity
          onPress={() => navigation?.goBack()}
          style={{ marginBottom: 10 }}
        >
          <Text style={{ color: C.teal, fontSize: 13 }}>‹ Settings</Text>
        </TouchableOpacity>
        <Text
          style={{
            color: C.teal,
            fontSize: 12,
            fontWeight: "600",
            letterSpacing: 1,
          }}
        >
          SETTINGS
        </Text>
        <Text
          style={{
            color: C.white,
            fontSize: 22,
            fontWeight: "800",
            marginTop: 4,
          }}
        >
          Subscription & Billing
        </Text>
      </View>

      <View
        style={{
          backgroundColor: C.bgLighter,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          marginTop: -16,
          paddingTop: 20,
          paddingBottom: 30,
        }}
      >
        {/* Current Plan Banner */}
        <View
          style={{
            marginHorizontal: 16,
            marginBottom: 16,
            backgroundColor: C.teal,
            borderRadius: 14,
            padding: 16,
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          <Text style={{ fontSize: 24, marginRight: 12 }}>⭐</Text>
          <View style={{ flex: 1 }}>
            <Text style={{ color: C.white, fontSize: 14, fontWeight: "700" }}>
              You're on the Pro Plan
            </Text>
            <Text
              style={{
                color: C.white,
                fontSize: 12,
                opacity: 0.85,
                marginTop: 2,
              }}
            >
              Next billing: 1 April 2025 · R 99.00
            </Text>
          </View>
        </View>

        {/* Billing Cycle Toggle */}
        <View style={{ paddingHorizontal: 16, marginBottom: 16 }}>
          <View
            style={{
              flexDirection: "row",
              backgroundColor: C.bgLight,
              borderRadius: 10,
              padding: 3,
            }}
          >
            {["monthly", "annual"].map((cycle) => (
              <TouchableOpacity
                key={cycle}
                onPress={() => setBillingCycle(cycle)}
                style={{
                  flex: 1,
                  paddingVertical: 8,
                  borderRadius: 8,
                  backgroundColor:
                    billingCycle === cycle ? C.navy : "transparent",
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: "600",
                    color: billingCycle === cycle ? C.white : C.textSub,
                  }}
                >
                  {cycle === "monthly" ? "Monthly" : "Annual  (Save 20%)"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Plan Cards */}
        <View style={{ paddingHorizontal: 16, marginBottom: 16 }}>
          {plans.map((plan, i) => (
            <PlanCard key={i} {...plan} onSelect={() => {}} />
          ))}
        </View>

        {/* Payment Method */}
        <View
          style={{
            backgroundColor: C.white,
            marginHorizontal: 16,
            borderRadius: 14,
            padding: 16,
            borderWidth: 1,
            borderColor: C.border,
            marginBottom: 16,
          }}
        >
          <Text
            style={{
              fontSize: 13,
              fontWeight: "700",
              color: C.text,
              marginBottom: 12,
            }}
          >
            Payment Method
          </Text>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: C.bgLighter,
              borderRadius: 10,
              padding: 12,
            }}
          >
            <Text style={{ fontSize: 24, marginRight: 12 }}>💳</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, fontWeight: "600", color: C.text }}>
                Visa ending 4242
              </Text>
              <Text style={{ fontSize: 11, color: C.textSub, marginTop: 2 }}>
                Expires 09/27
              </Text>
            </View>
            <TouchableOpacity
              style={{
                backgroundColor: C.bgLight,
                borderRadius: 8,
                paddingHorizontal: 10,
                paddingVertical: 6,
              }}
            >
              <Text
                style={{ fontSize: 12, color: C.midNavy2, fontWeight: "600" }}
              >
                Update
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Billing History */}
        <View
          style={{
            backgroundColor: C.white,
            marginHorizontal: 16,
            borderRadius: 14,
            overflow: "hidden",
            borderWidth: 1,
            borderColor: C.border,
            marginBottom: 16,
          }}
        >
          <View
            style={{
              padding: 16,
              borderBottomWidth: 1,
              borderBottomColor: C.border,
            }}
          >
            <Text style={{ fontSize: 13, fontWeight: "700", color: C.text }}>
              Billing History
            </Text>
          </View>
          {billingHistory.map((row, i) => (
            <BillingRow key={i} {...row} />
          ))}
          <TouchableOpacity style={{ padding: 14, alignItems: "center" }}>
            <Text style={{ color: C.teal, fontSize: 13, fontWeight: "600" }}>
              Download All Invoices
            </Text>
          </TouchableOpacity>
        </View>

        {/* Cancel */}
        <TouchableOpacity
          style={{
            marginHorizontal: 16,
            borderWidth: 1,
            borderColor: C.danger,
            borderRadius: 14,
            padding: 14,
            alignItems: "center",
          }}
        >
          <Text style={{ color: C.danger, fontSize: 14, fontWeight: "600" }}>
            Cancel Subscription
          </Text>
        </TouchableOpacity>

        <Text
          style={{
            textAlign: "center",
            fontSize: 11,
            color: C.textSub,
            marginTop: 12,
            marginHorizontal: 24,
            lineHeight: 16,
          }}
        >
          Cancellations take effect at end of current billing period. Data is
          retained for 30 days after cancellation.
        </Text>
      </View>
    </PhoneShell>
  );
}
