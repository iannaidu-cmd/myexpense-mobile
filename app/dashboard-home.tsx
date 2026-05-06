import { MXCard } from "@/components/MXCard";
import MXLogo from "@/components/MXLogo";
import { MXTabBar } from "@/components/MXTabBar";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { colour, radius, space, typography } from "@/tokens";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ScrollView,
    StatusBar,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface Props {
  navigation?: any;
}

// ── Quick Action button ────────────────────────────────────────────────────────
function QuickAction({
  icon,
  label,
  onPress,
  accent = false,
}: {
  icon: string;
  label: string;
  onPress: () => void;
  accent?: boolean;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{ flex: 1, alignItems: "center" }}
    >
      <View
        style={{
          width: 52,
          height: 52,
          borderRadius: radius.lg,
          backgroundColor: accent ? colour.primary : colour.surface2,
          alignItems: "center",
          justifyContent: "center",
          marginBottom: space.sm,
        }}
      >
        <IconSymbol name={icon as any} size={22} color={accent ? colour.onPrimary : colour.textSub} />
      </View>
      <Text
        style={{
          ...typography.actionS,
          color: colour.text,
          textAlign: "center",
        }}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

// ── Recent expense row ─────────────────────────────────────────────────────────
function RecentRow({
  icon,
  vendor,
  category,
  amount,
  date,
  onPress,
  isLast,
}: {
  icon: string;
  vendor: string;
  category: string;
  amount: string;
  date: string;
  onPress: () => void;
  isLast?: boolean;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: space.lg,
        paddingVertical: space.md,
        borderBottomWidth: isLast ? 0 : 1,
        borderBottomColor: colour.surface2,
      }}
    >
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: radius.md,
          backgroundColor: colour.primary50,
          alignItems: "center",
          justifyContent: "center",
          marginRight: space.md,
        }}
      >
        <IconSymbol name={icon as any} size={18} color={colour.accentDeep} />
      </View>
      <View style={{ flex: 1 }}>
        <Text
          style={{
            ...typography.bodyM,
            fontWeight: "600",
            color: colour.text,
          }}
        >
          {vendor}
        </Text>
        <Text
          style={{
            ...typography.bodyS,
            color: colour.textHint,
            marginTop: 2,
          }}
        >
          {category} · {date}
        </Text>
      </View>
      <Text
        style={{
          ...typography.bodyM,
          fontWeight: "700",
          color: colour.danger,
        }}
      >
        -{amount}
      </Text>
    </TouchableOpacity>
  );
}

// ── SCREEN: Dashboard Home ─────────────────────────────────────────────────────
export default function DashboardHomeScreen() {
  const router = useRouter();
  const [greeting, setGreeting] = useState("Good morning");

  useEffect(() => {
    const h = new Date().getHours();
    if (h >= 12 && h < 17) setGreeting("Good afternoon");
    else if (h >= 17) setGreeting("Good evening");
  }, []);

  const stats = {
    totalExpenses: "R 18,420",
    deductible: "R 11,750",
    transactions: "34",
    itr12Pct: 78,
  };

  const recentExpenses = [
    {
      icon: "car.fill",
      vendor: "Engen Fuel",
      category: "Travel",
      amount: "R 650",
      date: "15 Mar",
    },
    {
      icon: "laptopcomputer",
      vendor: "Microsoft 365",
      category: "Software",
      amount: "R 330",
      date: "14 Mar",
    },
    {
      icon: "house.fill",
      vendor: "Home Office",
      category: "Home Office",
      amount: "R 1,200",
      date: "12 Mar",
    },
    {
      icon: "fork.knife",
      vendor: "Business Lunch",
      category: "Meals",
      amount: "R 480",
      date: "11 Mar",
    },
  ];

  return (
    <SafeAreaView
      edges={["top"]}
      style={{ flex: 1, backgroundColor: colour.background }}
    >
      <StatusBar barStyle="dark-content" backgroundColor={colour.background} />

      {/* ── Header ── */}
      <View
        style={{
          backgroundColor: colour.primary,
          paddingHorizontal: space.lg,
          paddingTop: 9,
          paddingBottom: space.xl,
        }}
      >
        <View
          style={{ flexDirection: "row", alignItems: "center", gap: space.md }}
        >
          <View style={{ flex: 1 }}>
            <Text style={{ ...typography.h3, color: colour.onPrimary }}>
              {greeting}, Ian
            </Text>
            <Text
              style={{
                ...typography.bodyXS,
                color: "rgba(255,255,255,0.7)",
                marginTop: 2,
              }}
            >
              Tax year 2024/25
            </Text>
          </View>
          <TouchableOpacity
            style={{
              width: 56,
              height: 56,
              borderRadius: radius.md,
              backgroundColor: colour.primary50,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <MXLogo size={30} variant="light" />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Scrollable body ── */}
      <ScrollView
        style={{
          flex: 1,
          backgroundColor: colour.background,
          borderTopLeftRadius: radius.xl,
          borderTopRightRadius: radius.xl,
        }}
        contentContainerStyle={{ paddingBottom: space.xxxl }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Summary Card ── */}
        <MXCard
          style={{
            margin: space.lg,
            backgroundColor: colour.primary,
            padding: space.xl,
            overflow: "hidden",
          }}
        >
          {/* Decorative circle */}
          <View
            style={{
              position: "absolute",
              top: -20,
              right: -20,
              width: 100,
              height: 100,
              borderRadius: 50,
              backgroundColor: colour.primary100,
            }}
          />
          <Text
            style={{
              ...typography.bodyS,
              color: colour.textHint,
              marginBottom: 4,
            }}
          >
            This Month · Total Expenses
          </Text>
          <Text style={{ ...typography.h1, color: colour.onPrimary }}>
            {stats.totalExpenses}
          </Text>
          <View
            style={{
              flexDirection: "row",
              marginTop: space.xl,
              gap: space.lg,
              alignItems: "center",
            }}
          >
            <View>
              <Text style={{ ...typography.h3, color: colour.successMid }}>
                {stats.deductible}
              </Text>
              <Text
                style={{
                  ...typography.bodyS,
                  color: colour.textHint,
                  marginTop: 2,
                }}
              >
                Tax Deductible
              </Text>
            </View>
            <View
              style={{
                width: 1,
                height: 32,
                backgroundColor: colour.primary200,
              }}
            />
            <View>
              <Text style={{ ...typography.h3, color: colour.onPrimary }}>
                {stats.transactions}
              </Text>
              <Text
                style={{
                  ...typography.bodyS,
                  color: colour.textHint,
                  marginTop: 2,
                }}
              >
                Transactions
              </Text>
            </View>
          </View>
        </MXCard>

        {/* ── Quick Actions ── */}
        <MXCard
          style={{
            marginHorizontal: space.lg,
            marginBottom: space.lg,
          }}
        >
          <Text
            style={{
              ...typography.bodyM,
              fontWeight: "700",
              color: colour.text,
              marginBottom: space.lg,
            }}
          >
            Quick Actions
          </Text>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
            }}
          >
            <QuickAction
              icon="plus"
              label="Add expense"
              onPress={() => router.push("/add-expense-manual" as any)}
              accent
            />
            <QuickAction
              icon="camera.fill"
              label="Scan receipt"
              onPress={() => router.push("/scan-receipt-camera" as any)}
            />
            <QuickAction
              icon="chart.bar.fill"
              label="Reports"
              onPress={() => router.push("/(tabs)/reports" as any)}
            />
            <QuickAction
              icon="doc.text.fill"
              label="ITR12"
              onPress={() => router.push("/tax-summary" as any)}
            />
          </View>
        </MXCard>

        {/* ── Period Selector ── */}
        <TouchableOpacity
          onPress={() => router.push("/tax-year-selector" as any)}
          style={{
            marginHorizontal: space.lg,
            backgroundColor: colour.primary50,
            borderRadius: radius.md,
            padding: space.md,
            flexDirection: "row",
            alignItems: "center",
            marginBottom: space.lg,
          }}
        >
          <IconSymbol name="calendar" size={18} color={colour.primary} style={{ marginRight: 10 } as any} />
          <Text
            style={{
              flex: 1,
              ...typography.bodyM,
              fontWeight: "600",
              color: colour.text,
            }}
          >
            March 2025
          </Text>
          <Text style={{ ...typography.bodyS, color: colour.primary }}>
            Change period ›
          </Text>
        </TouchableOpacity>

        {/* ── Recent Expenses ── */}
        <View style={{ marginHorizontal: space.lg }}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: space.sm,
            }}
          >
            <Text
              style={{
                ...typography.bodyM,
                fontWeight: "700",
                color: colour.text,
              }}
            >
              Recent Expenses
            </Text>
            <TouchableOpacity
              onPress={() => router.push("/expense-history" as any)}
            >
              <Text style={{ ...typography.actionS, color: colour.primary }}>
                See all ›
              </Text>
            </TouchableOpacity>
          </View>
          <MXCard style={{ padding: 0, overflow: "hidden" }}>
            {recentExpenses.map((e, i) => (
              <RecentRow
                key={i}
                {...e}
                isLast={i === recentExpenses.length - 1}
                onPress={() => router.push(`/expense-detail?id=${i}` as any)}
              />
            ))}
          </MXCard>
        </View>

        {/* ── Deduction tip ── */}
        <MXCard
          style={{
            margin: space.lg,
            backgroundColor: colour.successMid,
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          <IconSymbol name="lightbulb.fill" size={22} color={colour.onPrimary} style={{ marginRight: 12 } as any} />
          <View style={{ flex: 1 }}>
            <Text
              style={{
                ...typography.bodyM,
                fontWeight: "700",
                color: colour.onPrimary,
              }}
            >
              Tip: Log travel daily
            </Text>
            <Text
              style={{
                ...typography.bodyS,
                color: colour.textHint,
                marginTop: 3,
                lineHeight: 17,
              }}
            >
              Travel logs strengthen your Section 11(a) claim.
            </Text>
          </View>
        </MXCard>
      </ScrollView>
      <MXTabBar />
    </SafeAreaView>
  );
}
