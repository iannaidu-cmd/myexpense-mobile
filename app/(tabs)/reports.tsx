import { IconSymbol } from "@/components/ui/icon-symbol";
import { MXHeader } from "@/components/MXHeader";
import { SA_MARGINAL_TAX_RATE } from "@/constants/tax";
import { expenseService } from "@/services/expenseService";
import { incomeService } from "@/services/incomeService";
import { useAuthStore } from "@/stores/authStore";
import { useExpenseStore } from "@/stores/expenseStore";
import { colour, radius, space } from "@/tokens";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const REPORT_LINKS: {
  icon: string;
  label: string;
  sub: string;
  route: string;
}[] = [
  { icon: "chart.bar.fill",   label: "Income vs Expenses",   sub: "Monthly comparison",           route: "/income-vs-expenses"   },
  { icon: "checkmark",        label: "Tax Savings",          sub: "Year-to-date breakdown",        route: "/tax-summary"          },
  { icon: "list.bullet",      label: "Category Breakdown",   sub: "Where your money goes",         route: "/category-breakdown"   },
  { icon: "doc.text.fill",    label: "VAT Summary",          sub: "Input vs output VAT",           route: "/vat-summary"          },
];

const fmt = (n: number) =>
  `R ${n.toLocaleString("en-ZA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

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
    useCallback(() => { loadData(); }, [loadData]),
  );

  const estTaxSaving = Math.round(totalDeductions * SA_MARGINAL_TAX_RATE);
  const deductPct = totalExpenses > 0
    ? Math.round((totalDeductions / totalExpenses) * 100)
    : 0;
  const maxVal = Math.max(...monthlyData.flatMap((d) => [d.income, d.expense]), 1);

  const KPIS = [
    { label: "Total income",  value: fmtShort(totalIncome),    trend: null },
    { label: "Total expenses",value: fmtShort(totalExpenses),  trend: null },
    { label: "Tax saved",     value: fmtShort(estTaxSaving),   trend: null },
    { label: "Deductible %",  value: `${deductPct}%`,          trend: null },
  ];

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: colour.background }}>
      <StatusBar barStyle="dark-content" backgroundColor={colour.background} />

      <MXHeader
        title="Reports"
        showBack
        right={
          <TouchableOpacity
            onPress={() => router.push("/tax-year-selector" as any)}
            style={{
              flexDirection: "row", alignItems: "center", gap: 6,
              paddingHorizontal: 10, paddingVertical: 5, borderRadius: 100,
              backgroundColor: colour.primary50,
            }}
          >
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colour.primary }} />
            <Text style={{ fontSize: 11, fontWeight: "600", color: colour.accentDeep }}>
              FY {activeTaxYear}
            </Text>
            <IconSymbol name="chevron.right" size={10} color={colour.accentDeep} />
          </TouchableOpacity>
        }
      />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: space["5xl"] }}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={{ alignItems: "center", paddingTop: space["5xl"] }}>
            <ActivityIndicator color={colour.primary} size="large" />
          </View>
        ) : (
          <>
            {/* KPI 2×2 grid */}
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 14, marginBottom: 14 }}>
              {KPIS.map((k) => (
                <View
                  key={k.label}
                  style={{
                    width: "47.5%",
                    backgroundColor: colour.white,
                    borderRadius: radius.md,
                    padding: 12, paddingHorizontal: 14,
                    borderWidth: 1, borderColor: colour.borderLight,
                  }}
                >
                  <Text style={{ fontSize: 10.5, color: colour.textSub, fontWeight: "500", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>
                    {k.label}
                  </Text>
                  <Text style={{ fontSize: 20, fontWeight: "700", letterSpacing: -0.5, color: colour.text }}>
                    {k.value}
                  </Text>
                </View>
              ))}
            </View>

            {/* Mini bar chart in noir card */}
            {monthlyData.some((d) => d.income > 0 || d.expense > 0) && (
              <View style={{
                backgroundColor: colour.noir, borderRadius: radius.xl,
                padding: 16, marginBottom: 14, overflow: "hidden",
              }}>
                <View style={{
                  position: "absolute", width: 120, height: 120, borderRadius: 60,
                  backgroundColor: colour.primary, opacity: 0.3, top: -40, right: -30,
                }} />
                <Text style={{ fontSize: 11, color: colour.onNoir2, fontWeight: "500", marginBottom: 2 }}>
                  6-month overview
                </Text>
                <Text style={{ fontSize: 20, fontWeight: "700", color: colour.onNoir, letterSpacing: -0.5, marginBottom: 10 }}>
                  {fmt(totalIncome)}
                </Text>
                <View style={{ flexDirection: "row", alignItems: "flex-end", height: 72, gap: 6 }}>
                  {monthlyData.map((d, i) => (
                    <View key={d.label} style={{ flex: 1, alignItems: "center" }}>
                      <View style={{ width: "100%", gap: 2, height: 60, justifyContent: "flex-end" }}>
                        <View style={{
                          width: "100%",
                          height: Math.max((d.income / maxVal) * 52, d.income > 0 ? 3 : 0),
                          backgroundColor: colour.primary,
                          borderRadius: 3, opacity: i === monthlyData.length - 1 ? 1 : 0.55,
                        }} />
                        <View style={{
                          width: "100%",
                          height: Math.max((d.expense / maxVal) * 52, d.expense > 0 ? 3 : 0),
                          backgroundColor: colour.danger,
                          borderRadius: 3, opacity: 0.7,
                        }} />
                      </View>
                      <Text style={{ fontSize: 9, color: colour.onNoir2, fontWeight: "500", marginTop: 4 }}>
                        {d.label}
                      </Text>
                    </View>
                  ))}
                </View>
                <View style={{ flexDirection: "row", gap: 14, marginTop: 8 }}>
                  {[
                    { c: colour.primary, l: "Income" },
                    { c: colour.danger,  l: "Expenses" },
                  ].map((item) => (
                    <View key={item.l} style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
                      <View style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: item.c }} />
                      <Text style={{ fontSize: 10, color: colour.onNoir2, fontWeight: "500" }}>{item.l}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Quick links */}
            <Text style={{
              fontSize: 11, textTransform: "uppercase", color: colour.textSub,
              letterSpacing: 0.8, marginBottom: 10, marginLeft: 2, fontWeight: "600",
            }}>
              Quick links
            </Text>
            <View style={{
              backgroundColor: colour.white, borderRadius: radius.md,
              borderWidth: 1, borderColor: colour.borderLight, overflow: "hidden",
              marginBottom: 16,
            }}>
              {REPORT_LINKS.map((r, i) => (
                <TouchableOpacity
                  key={r.label}
                  onPress={() => router.push(r.route as any)}
                  activeOpacity={0.7}
                  style={{
                    flexDirection: "row", alignItems: "center",
                    padding: 12, paddingHorizontal: 14,
                    borderBottomWidth: i < REPORT_LINKS.length - 1 ? 1 : 0,
                    borderBottomColor: colour.borderLight,
                  }}
                >
                  <View style={{
                    width: 30, height: 30, borderRadius: radius.pill,
                    backgroundColor: colour.primary50,
                    alignItems: "center", justifyContent: "center", marginRight: 12,
                  }}>
                    <IconSymbol name={r.icon as any} size={14} color={colour.accentDeep} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 13, fontWeight: "600", color: colour.text }}>{r.label}</Text>
                    <Text style={{ fontSize: 11, color: colour.textSub, marginTop: 1, fontWeight: "500" }}>{r.sub}</Text>
                  </View>
                  <IconSymbol name="chevron.right" size={14} color={colour.textSub} />
                </TouchableOpacity>
              ))}
            </View>

            {/* Export CTA */}
            <TouchableOpacity
              onPress={() => router.push("/itr12-export-setup" as any)}
              style={{
                backgroundColor: colour.noir, borderRadius: radius.lg,
                padding: 16, paddingHorizontal: 18, flexDirection: "row",
                alignItems: "center", gap: 14, marginBottom: 10, overflow: "hidden",
              }}
            >
              <View style={{
                position: "absolute", width: 120, height: 120, borderRadius: 60,
                backgroundColor: colour.primary, opacity: 0.4, top: -40, right: -30,
              }} />
              <View style={{
                width: 42, height: 42, borderRadius: 12,
                backgroundColor: "rgba(255,255,255,0.15)",
                alignItems: "center", justifyContent: "center",
              }}>
                <IconSymbol name="square.and.arrow.up" size={20} color={colour.white} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 15, fontWeight: "700", color: colour.onNoir, letterSpacing: -0.3 }}>
                  Export ITR12
                </Text>
                <Text style={{ fontSize: 11, color: colour.onNoir2, marginTop: 2, fontWeight: "500" }}>
                  PDF · CSV · SARS-ready
                </Text>
              </View>
              <View style={{
                width: 30, height: 30, borderRadius: 15,
                backgroundColor: "rgba(255,255,255,0.15)", alignItems: "center", justifyContent: "center",
              }}>
                <IconSymbol name="chevron.right" size={14} color={colour.white} />
              </View>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
