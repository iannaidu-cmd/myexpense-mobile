import { MXCard } from "@/components/MXCard";
import { colour, radius, space, typography } from "@/tokens";
import React, { useEffect, useState } from "react";
import {
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

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
        <Text style={{ fontSize: 22 }}>{icon}</Text>
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
        <Text style={{ fontSize: 18 }}>{icon}</Text>
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
export default function DashboardHomeScreen({ navigation }: Props) {
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
      icon: "🚗",
      vendor: "Engen Fuel",
      category: "Travel",
      amount: "R 650",
      date: "15 Mar",
    },
    {
      icon: "💻",
      vendor: "Microsoft 365",
      category: "Software",
      amount: "R 330",
      date: "14 Mar",
    },
    {
      icon: "🏠",
      vendor: "Home Office",
      category: "Home Office",
      amount: "R 1,200",
      date: "12 Mar",
    },
    {
      icon: "🍽",
      vendor: "Business Lunch",
      category: "Meals",
      amount: "R 480",
      date: "11 Mar",
    },
  ];

  const STATUS_BAR_HEIGHT =
    Platform.OS === "android" ? (StatusBar.currentHeight ?? 24) : 0;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colour.primary }}>
      <StatusBar barStyle="light-content" backgroundColor={colour.primary} />

      {/* ── Header ── */}
      <View
        style={{
          backgroundColor: colour.primary,
          paddingTop:
            Platform.OS === "android" ? STATUS_BAR_HEIGHT + space.md : space.md,
          paddingBottom: space.xxl,
          paddingHorizontal: space.xl,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          <View>
            <Text
              style={{
                ...typography.captionM,
                color: colour.successMid,
                letterSpacing: 1.2,
              }}
            >
              MYEXPENSE
            </Text>
            <Text
              style={{
                ...typography.h2,
                color: colour.onPrimary,
                marginTop: space.xs,
              }}
            >
              {greeting}, Ian 👋
            </Text>
            <Text
              style={{
                ...typography.bodyS,
                color: colour.textHint,
                marginTop: 2,
              }}
            >
              March 2025 · Tax Year 2024/25
            </Text>
          </View>

          <View style={{ flexDirection: "row", gap: space.sm }}>
            <TouchableOpacity
              onPress={() => navigation?.navigate("NotificationsCentre")}
              style={{
                width: 38,
                height: 38,
                borderRadius: radius.md,
                backgroundColor: colour.primary50,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ fontSize: 18, color: colour.primary }}>🔔</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => navigation?.navigate("GlobalSearch")}
              style={{
                width: 38,
                height: 38,
                borderRadius: radius.md,
                backgroundColor: colour.primary50,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ fontSize: 18, color: colour.primary }}>🔍</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* ── Scrollable body ── */}
      <ScrollView
        style={{ flex: 1, backgroundColor: colour.background }}
        contentContainerStyle={{ paddingBottom: space.xxxl }}
        showsVerticalScrollIndicator={false}
      >
        {/* Curved top overlap */}
        <View
          style={{
            backgroundColor: colour.primary,
            height: 24,
            marginTop: -1,
          }}
        />
        <View
          style={{
            backgroundColor: colour.background,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            marginTop: -24,
          }}
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
                icon="➕"
                label="Add Expense"
                onPress={() => navigation?.navigate("AddExpense")}
                accent
              />
              <QuickAction
                icon="📷"
                label="Scan Receipt"
                onPress={() => navigation?.navigate("ScanReceiptCamera")}
              />
              <QuickAction
                icon="📊"
                label="Reports"
                onPress={() => navigation?.navigate("ReportsHome")}
              />
              <QuickAction
                icon="📋"
                label="ITR12"
                onPress={() => navigation?.navigate("TaxSummary")}
              />
            </View>
          </MXCard>

          {/* ── Period Selector ── */}
          <TouchableOpacity
            onPress={() => navigation?.navigate("PeriodSelector")}
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
            <Text style={{ fontSize: 18, marginRight: 10 }}>🗓</Text>
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
                onPress={() => navigation?.navigate("ExpenseHistory")}
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
                  onPress={() =>
                    navigation?.navigate("ExpenseDetail", { id: i })
                  }
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
            <Text style={{ fontSize: 22, marginRight: 12 }}>💡</Text>
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
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
