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

const QUICK_REPORTS = [
  {
    id: "1",
    icon: "📊",
    title: "Income vs Expenses",
    sub: "Monthly comparison",
    route: "/expense-history",
  },
  {
    id: "2",
    icon: "💰",
    title: "Tax Savings Report",
    sub: "ITR12 deduction summary",
    route: "/tax-summary",
  },
  {
    id: "3",
    icon: "🗂️",
    title: "Category Breakdown",
    sub: "Expenses by SARS category",
    route: "/category-breakdown",
  },
  {
    id: "4",
    icon: "📤",
    title: "Export Centre",
    sub: "PDF · CSV · ITR12",
    route: "/itr12-export-setup",
  },
  {
    id: "5",
    icon: "🧾",
    title: "VAT Summary",
    sub: "Input tax claimable",
    route: "/vat-summary",
  },
];

const fmtShort = (n: number) => {
  if (n >= 1_000_000) return `R ${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `R ${(n / 1_000).toFixed(1)}k`;
  return `R ${n.toFixed(0)}`;
};
const fmt = (n: number) =>
  `R ${n.toLocaleString("en-ZA", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

export default function ReportsDashboardScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { activeTaxYear } = useExpenseStore();

  const [loading, setLoading] = useState(true);
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [totalDeductions, setTotalDeductions] = useState(0);
  const [monthlyData, setMonthlyData] = useState<
    { month: string; income: number; expense: number }[]
  >([]);

  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [incomeTotals, expenseTotals, allExpenses, allIncome] =
        await Promise.all([
          incomeService.getTotals(user.id),
          expenseService.getTotals(user.id, activeTaxYear),
          expenseService.getExpenses(user.id, activeTaxYear),
          incomeService.getIncome(user.id),
        ]);
      setTotalIncome(incomeTotals.totalIncome);
      setTotalExpenses(expenseTotals.totalExpenses);
      setTotalDeductions(expenseTotals.totalDeductions);

      const now = new Date();
      const months = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const month = d.toLocaleString("en-ZA", { month: "short" });
        const monthStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        const income = allIncome
          .filter((e) => e.date.startsWith(monthStr))
          .reduce((s, e) => s + Number(e.amount), 0);
        const expense = allExpenses
          .filter((e) => e.expense_date.startsWith(monthStr))
          .reduce((s, e) => s + Number(e.amount), 0);
        months.push({ month, income, expense });
      }
      setMonthlyData(months);
    } catch (e) {
      console.error("ReportsDashboard load error:", e);
    } finally {
      setLoading(false);
    }
  }, [user, activeTaxYear]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData]),
  );

  const estTaxSaving = Math.round(totalDeductions * 0.31);
  const maxVal = Math.max(
    ...monthlyData.flatMap((d) => [d.income, d.expense]),
    1,
  );

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
              FY {activeTaxYear} ›
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
        {loading ? (
          <View style={{ alignItems: "center", paddingTop: space["5xl"] }}>
            <ActivityIndicator color={colour.primary} size="large" />
          </View>
        ) : (
          <>
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
                  value: fmtShort(totalIncome),
                  accent: colour.primary,
                },
                {
                  label: "Expenses",
                  value: fmtShort(totalExpenses),
                  accent: colour.danger,
                },
                {
                  label: "Claimable",
                  value: fmtShort(totalDeductions),
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
                  <Text
                    style={[typography.micro, { color: colour.textSecondary }]}
                  >
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
              {monthlyData.every((d) => d.income === 0 && d.expense === 0) ? (
                <View
                  style={{ alignItems: "center", paddingVertical: space.lg }}
                >
                  <Text
                    style={[typography.bodyS, { color: colour.textSecondary }]}
                  >
                    No data for this period
                  </Text>
                </View>
              ) : (
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "flex-end",
                    height: 80,
                    gap: space.xs,
                  }}
                >
                  {monthlyData.map((d) => (
                    <View
                      key={d.month}
                      style={{ flex: 1, alignItems: "center" }}
                    >
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
                            height: Math.max(
                              (d.income / maxVal) * 60,
                              d.income > 0 ? 3 : 0,
                            ),
                            backgroundColor: colour.primary,
                            borderRadius: 2,
                            opacity: 0.85,
                          }}
                        />
                        <View
                          style={{
                            width: "100%",
                            height: Math.max(
                              (d.expense / maxVal) * 60,
                              d.expense > 0 ? 3 : 0,
                            ),
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
              )}
              <View
                style={{
                  flexDirection: "row",
                  gap: space.lg,
                  marginTop: space.sm,
                }}
              >
                {[
                  { c: colour.primary, l: "Income" },
                  { c: colour.danger, l: "Expenses" },
                ].map((item) => (
                  <View
                    key={item.l}
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
                        backgroundColor: item.c,
                      }}
                    />
                    <Text
                      style={[
                        typography.micro,
                        { color: colour.textSecondary },
                      ]}
                    >
                      {item.l}
                    </Text>
                  </View>
                ))}
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
                  Based on 31% marginal rate
                </Text>
              </View>
              <Text style={[typography.amountM, { color: colour.success }]}>
                {fmt(estTaxSaving)}
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
                onPress={() => router.push(r.route as any)}
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
                  <Text
                    style={[typography.labelM, { color: colour.textPrimary }]}
                  >
                    {r.title}
                  </Text>
                  <Text
                    style={[
                      typography.caption,
                      { color: colour.textSecondary },
                    ]}
                  >
                    {r.sub}
                  </Text>
                </View>
                <Text style={{ color: colour.textSecondary, fontSize: 18 }}>
                  ›
                </Text>
              </TouchableOpacity>
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
