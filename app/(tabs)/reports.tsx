import { MXHeader } from "@/components/MXHeader";
import { expenseService } from "@/services/expenseService";
import { incomeService } from "@/services/incomeService";
import { useAuthStore } from "@/stores/authStore";
import { useExpenseStore } from "@/stores/expenseStore";
import { colour, radius, space, typography } from "@/tokens";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
    ActivityIndicator,
    SafeAreaView,
    ScrollView,
    StatusBar,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

const REPORT_TILES = [
  {
    icon: "📊",
    title: "Income vs Expenses",
    sub: "Monthly comparison",
    route: "/expense-history",
    accent: colour.primary,
  },
  {
    icon: "💰",
    title: "Tax Savings",
    sub: "ITR12 deduction summary",
    route: "/tax-summary",
    accent: colour.success,
  },
  {
    icon: "🗂️",
    title: "Category Breakdown",
    sub: "Expenses by SARS category",
    route: "/category-breakdown",
    accent: colour.warning,
  },
  {
    icon: "📤",
    title: "Export Centre",
    sub: "PDF · CSV · ITR12",
    route: "/itr12-export-setup",
    accent: colour.danger,
  },
  {
    icon: "🧾",
    title: "VAT Summary",
    sub: "Input tax claimable",
    route: "/vat-summary",
    accent: colour.info,
  },
  {
    icon: "🚗",
    title: "Mileage Tracker",
    sub: "Logbook & travel claims",
    route: "/mileage-tracker",
    accent: colour.teal,
  },
];

const fmt = (n: number) =>
  `R ${n.toLocaleString("en-ZA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const fmtShort = (n: number) => {
  if (n >= 1_000_000) return `R ${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `R ${(n / 1_000).toFixed(1)}k`;
  return `R ${n.toFixed(0)}`;
};

export default function ReportsTabScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { activeTaxYear } = useExpenseStore();

  const [loading, setLoading] = useState(true);
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [totalDeductions, setTotalDeductions] = useState(0);
  const [monthlyData, setMonthlyData] = useState<
    { label: string; income: number; expense: number }[]
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

      const months: { label: string; income: number; expense: number }[] = [];
      const now = new Date();
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const label = d.toLocaleString("en-ZA", { month: "short" });
        const monthStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        const incomeTotal = allIncome
          .filter((e) => e.date.startsWith(monthStr))
          .reduce((s, e) => s + Number(e.amount), 0);
        const expenseTotal = allExpenses
          .filter((e) => e.expense_date.startsWith(monthStr))
          .reduce((s, e) => s + Number(e.amount), 0);
        months.push({ label, income: incomeTotal, expense: expenseTotal });
      }
      setMonthlyData(months);
    } catch (e) {
      console.error("Reports load error:", e);
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
    <SafeAreaView
      edges={["top"]}
      style={{ flex: 1, backgroundColor: colour.primary }}
    >
      <StatusBar barStyle="light-content" backgroundColor={colour.primary} />

      <MXHeader
        title="Reports"
        right={
          <TouchableOpacity
            onPress={() => router.push("/tax-year-selector" as any)}
          >
            <Text style={{ ...typography.labelS, color: colour.onPrimary }}>
              FY {activeTaxYear} ›
            </Text>
          </TouchableOpacity>
        }
      />

      <ScrollView
        style={{
          flex: 1,
          backgroundColor: colour.bgPage,
          borderTopLeftRadius: radius.xl,
          borderTopRightRadius: radius.xl,
        }}
        contentContainerStyle={{ paddingBottom: space["5xl"] }}
        showsVerticalScrollIndicator={false}
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
                padding: space.lg,
                paddingBottom: 0,
              }}
            >
              {[
                {
                  label: "Income",
                  value: fmtShort(totalIncome),
                  accent: colour.success,
                },
                {
                  label: "Expenses",
                  value: fmtShort(totalExpenses),
                  accent: colour.danger,
                },
                {
                  label: "Claimable",
                  value: fmtShort(totalDeductions),
                  accent: colour.primary,
                },
              ].map((k) => (
                <View
                  key={k.label}
                  style={{
                    flex: 1,
                    backgroundColor: colour.bgCard,
                    borderRadius: radius.md,
                    padding: space.sm,
                    borderLeftWidth: 3,
                    borderLeftColor: k.accent,
                    borderWidth: 1,
                    borderColor: colour.border,
                  }}
                >
                  <Text
                    style={{ ...typography.micro, color: colour.textSecondary }}
                  >
                    {k.label}
                  </Text>
                  <Text
                    style={{
                      ...typography.labelS,
                      color: colour.textPrimary,
                      marginTop: 2,
                    }}
                  >
                    {k.value}
                  </Text>
                </View>
              ))}
            </View>

            {/* Bar chart */}
            <View
              style={{
                margin: space.lg,
                backgroundColor: colour.bgCard,
                borderRadius: radius.md,
                padding: space.lg,
                borderWidth: 1,
                borderColor: colour.border,
              }}
            >
              <Text
                style={{
                  ...typography.labelM,
                  color: colour.textPrimary,
                  marginBottom: space.md,
                }}
              >
                6-month overview
              </Text>
              {monthlyData.every((d) => d.income === 0 && d.expense === 0) ? (
                <View
                  style={{ alignItems: "center", paddingVertical: space.xl }}
                >
                  <Text
                    style={{ ...typography.bodyS, color: colour.textSecondary }}
                  >
                    No data yet for this period
                  </Text>
                </View>
              ) : (
                <>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "flex-end",
                      height: 72,
                      gap: space.xs,
                    }}
                  >
                    {monthlyData.map((d) => (
                      <View
                        key={d.label}
                        style={{ flex: 1, alignItems: "center" }}
                      >
                        <View
                          style={{
                            width: "100%",
                            gap: 2,
                            height: 60,
                            justifyContent: "flex-end",
                          }}
                        >
                          <View
                            style={{
                              width: "100%",
                              height: Math.max(
                                (d.income / maxVal) * 56,
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
                                (d.expense / maxVal) * 56,
                                d.expense > 0 ? 3 : 0,
                              ),
                              backgroundColor: colour.danger,
                              borderRadius: 2,
                              opacity: 0.7,
                            }}
                          />
                        </View>
                        <Text
                          style={{
                            ...typography.micro,
                            color: colour.textSecondary,
                            marginTop: space.xs,
                          }}
                        >
                          {d.label}
                        </Text>
                      </View>
                    ))}
                  </View>
                  <View
                    style={{
                      flexDirection: "row",
                      gap: space.xl,
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
                          style={{
                            ...typography.micro,
                            color: colour.textSecondary,
                          }}
                        >
                          {item.l}
                        </Text>
                      </View>
                    ))}
                  </View>
                </>
              )}
            </View>

            {/* Tax saving callout */}
            <View
              style={{
                marginHorizontal: space.lg,
                marginBottom: space.lg,
                backgroundColor: colour.successLight,
                borderRadius: radius.md,
                padding: space.lg,
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                borderWidth: 1,
                borderColor: colour.success + "40",
              }}
            >
              <View>
                <Text style={{ ...typography.labelM, color: colour.success }}>
                  Estimated tax saving
                </Text>
                <Text style={{ ...typography.caption, color: colour.success }}>
                  Based on 31% marginal rate
                </Text>
              </View>
              <Text style={{ ...typography.amountM, color: colour.success }}>
                {fmt(estTaxSaving)}
              </Text>
            </View>

            {/* Report tiles */}
            <View style={{ paddingHorizontal: space.lg }}>
              <Text
                style={{
                  ...typography.labelM,
                  color: colour.textSecondary,
                  marginBottom: space.sm,
                }}
              >
                ALL REPORTS
              </Text>
              <View
                style={{
                  backgroundColor: colour.bgCard,
                  borderRadius: radius.md,
                  borderWidth: 1,
                  borderColor: colour.border,
                }}
              >
                {REPORT_TILES.map((r, i) => (
                  <TouchableOpacity
                    key={r.title}
                    onPress={() => router.push(r.route as any)}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      padding: space.lg,
                      borderBottomWidth: i < REPORT_TILES.length - 1 ? 1 : 0,
                      borderBottomColor: colour.border,
                    }}
                  >
                    <View
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: radius.sm,
                        backgroundColor: r.accent + "18",
                        alignItems: "center",
                        justifyContent: "center",
                        marginRight: space.md,
                      }}
                    >
                      <Text style={{ fontSize: 22 }}>{r.icon}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          ...typography.labelM,
                          color: colour.textPrimary,
                        }}
                      >
                        {r.title}
                      </Text>
                      <Text
                        style={{
                          ...typography.caption,
                          color: colour.textSecondary,
                        }}
                      >
                        {r.sub}
                      </Text>
                    </View>
                    <Text style={{ color: colour.textSecondary, fontSize: 18 }}>
                      ›
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
