import { colour, radius, space, typography } from "@/tokens";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
    SafeAreaView,
    ScrollView,
    StatusBar,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

const SUMMARY = {
  income: 84500,
  expenses: 48320,
  claimable: 36240,
  taxSaving: 9060,
};

const QUICK_REPORTS = [
  {
    id: "1",
    icon: "📊",
    title: "Income vs Expenses",
    sub: "Monthly comparison",
    screen: "IncomeVsExpensesScreen",
  },
  {
    id: "2",
    icon: "📈",
    title: "Monthly Trends",
    sub: "12-month overview",
    screen: "MonthlyTrendsScreen",
  },
  {
    id: "3",
    icon: "💰",
    title: "Tax Savings Report",
    sub: "ITR12 deduction summary",
    screen: "TaxSavingsReportScreen",
  },
  {
    id: "4",
    icon: "🗂️",
    title: "Category Breakdown",
    sub: "Expenses by SARS category",
    screen: "CategoryBreakdownScreen",
  },
  {
    id: "5",
    icon: "📤",
    title: "Export Centre",
    sub: "PDF · CSV · ITR12",
    screen: "ExportCentreScreen",
  },
];

const BAR_DATA = [
  { month: "Oct", income: 14200, expense: 7800 },
  { month: "Nov", income: 13500, expense: 8200 },
  { month: "Dec", income: 12000, expense: 9500 },
  { month: "Jan", income: 15800, expense: 7200 },
  { month: "Feb", income: 14900, expense: 8100 },
  { month: "Mar", income: 14100, expense: 7520 },
];

const SCREEN_TO_ROUTE: Record<string, string> = {
  IncomeVsExpensesScreen: "/expense-history",
  MonthlyTrendsScreen: "/tax-summary",
  TaxSavingsReportScreen: "/tax-summary",
  CategoryBreakdownScreen: "/category-breakdown",
  ExportCentreScreen: "/itr12-export-setup",
};

export default function ReportsDashboardScreen() {
  const router = useRouter();
  const [activeYear, setActiveYear] = useState("2025/26");
  const maxVal = Math.max(...BAR_DATA.flatMap((d) => [d.income, d.expense]));
  const fmt = (n: number) => `R ${n.toLocaleString("en-ZA")}`;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colour.primary }}>
      <StatusBar barStyle="light-content" backgroundColor={colour.primary} />

      {/* Header */}
      <View
        style={{
          paddingHorizontal: space.lg,
          paddingTop: 3,
          paddingBottom: space["3xl"],
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: space.md,
          }}
        >
          <TouchableOpacity
            onPress={() => router.back()}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Text
              style={{
                color: colour.textOnPrimary,
                fontSize: 26,
                lineHeight: 30,
              }}
            >
              ‹
            </Text>
          </TouchableOpacity>
          <Text
            style={[typography.labelM, { color: "rgba(255,255,255,0.85)" }]}
          >
            Reports & Analytics
          </Text>
          <TouchableOpacity
            onPress={() => router.push("/tax-year-selector" as any)}
          >
            <Text style={[typography.labelS, { color: colour.textOnPrimary }]}>
              FY {activeYear} ›
            </Text>
          </TouchableOpacity>
        </View>
        <Text style={[typography.heading3, { color: colour.textOnPrimary }]}>
          Reports
        </Text>
      </View>

      {/* Card */}
      <ScrollView
        style={{
          flex: 1,
          backgroundColor: colour.bgCard,
          borderTopLeftRadius: radius.xl,
          borderTopRightRadius: radius.xl,
        }}
        contentContainerStyle={{
          padding: space.lg,
          paddingBottom: space["4xl"],
        }}
      >
        {/* KPI row */}
        <View
          style={{
            flexDirection: "row",
            gap: space.sm,
            marginBottom: space.xl,
          }}
        >
          {[
            {
              label: "Income",
              value: fmt(SUMMARY.income),
              accent: colour.primary,
            },
            {
              label: "Expenses",
              value: fmt(SUMMARY.expenses),
              accent: colour.danger,
            },
            {
              label: "Claimable",
              value: fmt(SUMMARY.claimable),
              accent: colour.success,
            },
          ].map((k) => (
            <View
              key={k.label}
              style={{
                flex: 1,
                backgroundColor: colour.bgPage,
                borderRadius: radius.md,
                padding: space.md,
                borderLeftWidth: 3,
                borderLeftColor: k.accent,
              }}
            >
              <Text style={[typography.micro, { color: colour.textSecondary }]}>
                {k.label}
              </Text>
              <Text
                style={[
                  typography.labelM,
                  { color: colour.textPrimary, marginTop: 2 },
                ]}
              >
                {k.value}
              </Text>
            </View>
          ))}
        </View>

        {/* Mini bar chart */}
        <View
          style={{
            backgroundColor: colour.bgPage,
            borderRadius: radius.md,
            padding: space.lg,
            marginBottom: space.xl,
          }}
        >
          <Text
            style={[
              typography.labelM,
              { color: colour.textPrimary, marginBottom: space.md },
            ]}
          >
            6-Month Overview
          </Text>
          <View
            style={{
              flexDirection: "row",
              alignItems: "flex-end",
              height: 80,
              gap: space.xs,
            }}
          >
            {BAR_DATA.map((d) => (
              <View key={d.month} style={{ flex: 1, alignItems: "center" }}>
                <View
                  style={{
                    width: "100%",
                    gap: 2,
                    justifyContent: "flex-end",
                    height: 64,
                  }}
                >
                  <View
                    style={{
                      width: "100%",
                      height: (d.income / maxVal) * 60,
                      backgroundColor: colour.primary,
                      borderRadius: 2,
                      opacity: 0.85,
                    }}
                  />
                  <View
                    style={{
                      width: "100%",
                      height: (d.expense / maxVal) * 60,
                      backgroundColor: colour.danger,
                      borderRadius: 2,
                      opacity: 0.7,
                    }}
                  />
                </View>
                <Text
                  style={[
                    typography.micro,
                    { color: colour.textSecondary, marginTop: space.xs },
                  ]}
                >
                  {d.month}
                </Text>
              </View>
            ))}
          </View>
          <View
            style={{ flexDirection: "row", gap: space.lg, marginTop: space.sm }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: space.xs,
              }}
            >
              <View
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 2,
                  backgroundColor: colour.primary,
                }}
              />
              <Text style={[typography.micro, { color: colour.textSecondary }]}>
                Income
              </Text>
            </View>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: space.xs,
              }}
            >
              <View
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 2,
                  backgroundColor: colour.danger,
                }}
              />
              <Text style={[typography.micro, { color: colour.textSecondary }]}>
                Expenses
              </Text>
            </View>
          </View>
        </View>

        {/* Tax saving callout */}
        <View
          style={{
            backgroundColor: colour.successLight,
            borderRadius: radius.md,
            padding: space.lg,
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: space.xl,
          }}
        >
          <View>
            <Text style={[typography.labelM, { color: colour.success }]}>
              Estimated Tax Saving
            </Text>
            <Text style={[typography.caption, { color: colour.success }]}>
              Based on 25% effective rate
            </Text>
          </View>
          <Text style={[typography.amountM, { color: colour.success }]}>
            {fmt(SUMMARY.taxSaving)}
          </Text>
        </View>

        {/* Quick report tiles */}
        <Text
          style={[
            typography.labelM,
            { color: colour.textSecondary, marginBottom: space.sm },
          ]}
        >
          REPORTS
        </Text>
        {QUICK_REPORTS.map((r) => (
          <TouchableOpacity
            key={r.id}
            onPress={() =>
              router.push(
                (SCREEN_TO_ROUTE[r.screen] ?? "/(tabs)/reports") as any,
              )
            }
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingVertical: space.md,
              borderBottomWidth: 1,
              borderBottomColor: colour.border,
            }}
          >
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: radius.sm,
                backgroundColor: colour.primaryLight,
                alignItems: "center",
                justifyContent: "center",
                marginRight: space.md,
              }}
            >
              <Text style={{ fontSize: 22 }}>{r.icon}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[typography.labelM, { color: colour.textPrimary }]}>
                {r.title}
              </Text>
              <Text
                style={[typography.caption, { color: colour.textSecondary }]}
              >
                {r.sub}
              </Text>
            </View>
            <Text style={{ color: colour.textSecondary, fontSize: 18 }}>›</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
