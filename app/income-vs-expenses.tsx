import { IconSymbol } from "@/components/ui/icon-symbol";
import { MXBackHeader } from "@/components/MXBackHeader";
import { MXTabBar } from "@/components/MXTabBar";
import { expenseService } from "@/services/expenseService";
import { incomeService } from "@/services/incomeService";
import { useAuthStore } from "@/stores/authStore";
import { colour, radius, space, typography } from "@/tokens";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { G, Rect, Text as SvgText } from "react-native-svg";

// ── Helpers ────────────────────────────────────────────────────────────────────

function monthKey(dateStr: string | null | undefined): string {
  if (!dateStr) return "__none__";
  const parts = dateStr.substring(0, 10).split("-");
  if (parts.length < 2 || !parts[1]) return "__none__";
  return `${parts[0]}-${parts[1]}`;
}

function buildRecentMonths(count: number) {
  const result: {
    key: string;
    label: string;
    shortLabel: string;
    fullLabel: string;
  }[] = [];
  const now = new Date();
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthShort = d.toLocaleString("en-ZA", { month: "short" });
    result.push({
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      label: monthShort.charAt(0).toUpperCase() + monthShort.slice(1),
      shortLabel: monthShort.substring(0, 3),
      fullLabel: d.toLocaleString("en-ZA", { month: "long", year: "numeric" }),
    });
  }
  return result;
}

const fmt = (n: number) =>
  `R ${n.toLocaleString("en-ZA", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

const fmtCompact = (n: number) => {
  if (n >= 1_000_000) return `R ${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `R ${Math.round(n / 1_000)}k`;
  return `R ${Math.round(n)}`;
};

const platformShadow =
  Platform.select({
    ios: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06,
      shadowRadius: 4,
    },
    android: { elevation: 2 },
    default: {},
  }) ?? {};

// ── Side-by-side bar chart ────────────────────────────────────────────────────

function SideBySideBarChart({
  data,
}: {
  data: { label: string; income: number; expense: number; highlight: boolean }[];
}) {
  const CHART_W = 300;
  const BAR_H = 100;
  const LABEL_H = 18;
  const TOTAL_H = BAR_H + LABEL_H;
  const GROUP_GAP = 8;
  const BAR_GAP = 2;
  const n = data.length;
  if (n === 0) return null;
  const groupW = (CHART_W - GROUP_GAP * (n - 1)) / n;
  const barW = (groupW - BAR_GAP) / 2;
  const maxVal = Math.max(...data.map((d) => Math.max(d.income, d.expense)), 1);

  return (
    <Svg
      width="100%"
      viewBox={`0 0 ${CHART_W} ${TOTAL_H}`}
      style={{ overflow: "visible" }}
    >
      {data.map((d, i) => {
        const groupX = i * (groupW + GROUP_GAP);
        const incH = Math.max((d.income / maxVal) * BAR_H, d.income > 0 ? 3 : 0);
        const expH = Math.max((d.expense / maxVal) * BAR_H, d.expense > 0 ? 3 : 0);

        return (
          <G key={i}>
            <Rect
              x={groupX}
              y={BAR_H - incH}
              width={barW}
              height={incH}
              rx={3}
              fill={colour.primary}
              opacity={d.highlight ? 1 : 0.6}
            />
            <Rect
              x={groupX + barW + BAR_GAP}
              y={BAR_H - expH}
              width={barW}
              height={expH}
              rx={3}
              fill={colour.danger}
              opacity={0.75}
            />
            <SvgText
              x={groupX + groupW / 2}
              y={BAR_H + 14}
              textAnchor="middle"
              fontSize={9}
              fill={d.highlight ? colour.text : colour.textSub}
              fontWeight={d.highlight ? "700" : "400"}
            >
              {d.label}
            </SvgText>
          </G>
        );
      })}
    </Svg>
  );
}

// ── Insight card ──────────────────────────────────────────────────────────────

type InsightType = "positive" | "warning" | "info";

function InsightCard({
  type,
  title,
  body,
  action,
  onAction,
}: {
  type: InsightType;
  title: string;
  body: string;
  action?: string;
  onAction?: () => void;
}) {
  const iconConfig = {
    positive: { bg: colour.successBg,  colour: colour.success, icon: "arrow.up" as const },
    warning:  { bg: colour.warningBg,  colour: colour.warning, icon: "exclamationmark.triangle" as const },
    info:     { bg: colour.primary50,  colour: colour.primary, icon: "checkmark" as const },
  }[type];

  return (
    <View style={{
      backgroundColor: colour.white,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colour.borderLight,
      padding: 14,
      paddingHorizontal: 16,
      marginHorizontal: space.lg,
      marginBottom: 10,
      flexDirection: "row",
      gap: 12,
      alignItems: "flex-start",
    }}>
      <View style={{
        width: 32, height: 32, borderRadius: 10,
        backgroundColor: iconConfig.bg,
        alignItems: "center", justifyContent: "center",
      }}>
        <IconSymbol name={iconConfig.icon} size={14} color={iconConfig.colour} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 12, fontWeight: "700", color: colour.text, marginBottom: 2 }}>
          {title}
        </Text>
        <Text style={{ fontSize: 11, color: colour.textSub, lineHeight: 16 }}>
          {body}
        </Text>
        {action && onAction && (
          <TouchableOpacity onPress={onAction} activeOpacity={0.7}>
            <Text style={{ fontSize: 11, fontWeight: "600", color: colour.primary, marginTop: 4 }}>
              {action} \u2192
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

// ── Types ──────────────────────────────────────────────────────────────────────

type MonthData = {
  key: string;
  label: string;
  income: number;
  expenses: number;
  net: number;
};

// ── Screen ─────────────────────────────────────────────────────────────────────

export default function IncomeVsExpensesScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [currentMonth, setCurrentMonth] = useState<MonthData | null>(null);
  const [allMonths, setAllMonths] = useState<MonthData[]>([]);
  const [topCategory, setTopCategory] = useState<{ name: string; amount: number } | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (!user) { setLoading(false); return; }
      setLoading(true);
      setError(null);

      const months = buildRecentMonths(6);
      const validKeys = new Set(months.map((m) => m.key));

      Promise.all([
        incomeService.getIncome(user.id),
        expenseService.getAllExpenses(user.id),
      ])
        .then(([incomeEntries, expenseEntries]) => {
          const incomeByMonth: Record<string, number> = {};
          const expenseByMonth: Record<string, number> = {};
          const categoryTotals: Record<string, number> = {};

          for (const { key } of months) {
            incomeByMonth[key] = 0;
            expenseByMonth[key] = 0;
          }
          for (const e of incomeEntries) {
            const k = monthKey(e.date);
            if (validKeys.has(k)) incomeByMonth[k] += Number(e.amount);
          }
          for (const e of expenseEntries) {
            const k = monthKey(e.expense_date);
            if (validKeys.has(k)) expenseByMonth[k] += Number(e.amount);
            // Category totals for insights (last 6 months)
            if (validKeys.has(k) && e.category) {
              categoryTotals[e.category] = (categoryTotals[e.category] ?? 0) + Number(e.amount);
            }
          }

          const monthData: MonthData[] = months.map((m) => ({
            key: m.key,
            label: m.label,
            income: incomeByMonth[m.key],
            expenses: expenseByMonth[m.key],
            net: incomeByMonth[m.key] - expenseByMonth[m.key],
          }));

          setAllMonths(monthData);
          setCurrentMonth(monthData[monthData.length - 1]);

          // Find top expense category
          const sorted = Object.entries(categoryTotals).sort(([, a], [, b]) => b - a);
          if (sorted.length > 0) {
            setTopCategory({ name: sorted[0][0], amount: sorted[0][1] });
          }
        })
        .catch((e) => setError(e?.message ?? "Could not load data"))
        .finally(() => setLoading(false));
    }, [user?.id]),
  );

  // Derived data
  const totalIncome = allMonths.reduce((s, m) => s + m.income, 0);
  const totalExpenses = allMonths.reduce((s, m) => s + m.expenses, 0);
  const totalNet = totalIncome - totalExpenses;
  const keepPct = totalIncome > 0 ? Math.round((totalNet / totalIncome) * 100) : 0;
  const expenseRatio = totalIncome > 0 ? Math.round((totalExpenses / totalIncome) * 100) : 0;
  const incomeBarPct = totalIncome + totalExpenses > 0 ? (totalIncome / (totalIncome + totalExpenses)) * 100 : 50;

  // Trend: current month vs previous
  const prevMonth = allMonths.length >= 2 ? allMonths[allMonths.length - 2] : null;
  const incomeTrend = prevMonth && prevMonth.income > 0
    ? Math.round(((currentMonth!.income - prevMonth.income) / prevMonth.income) * 100)
    : null;

  // Chart data
  const chartData = allMonths.map((m, i) => ({
    label: m.label,
    income: m.income,
    expense: m.expenses,
    highlight: i === allMonths.length - 1,
  }));

  // Build insights
  type Insight = { type: InsightType; title: string; body: string; action?: string; route?: string };
  const insights: Insight[] = [];

  if (incomeTrend !== null && incomeTrend > 0) {
    insights.push({
      type: "positive",
      title: `Income up ${incomeTrend}% vs last month`,
      body: currentMonth
        ? `${currentMonth.label} brought in ${fmt(currentMonth.income)}, your strongest month recently.`
        : "",
    });
  } else if (incomeTrend !== null && incomeTrend < -10) {
    insights.push({
      type: "warning",
      title: `Income down ${Math.abs(incomeTrend)}% vs last month`,
      body: "Consider reviewing your invoicing pipeline or following up on outstanding payments.",
    });
  }

  if (topCategory && totalExpenses > 0) {
    const catPct = Math.round((topCategory.amount / totalExpenses) * 100);
    insights.push({
      type: "warning",
      title: `${topCategory.name} is your top spend`,
      body: `${fmt(topCategory.amount)} (${catPct}% of all expenses) over the last 6 months. Worth reviewing if this is optimised.`,
      action: "View category breakdown",
      route: "/category-breakdown",
    });
  }

  if (expenseRatio <= 50 && totalIncome > 0) {
    insights.push({
      type: "info",
      title: "Expense ratio healthy",
      body: `You're spending ${expenseRatio}% of income on business costs, well below the 60% threshold.`,
    });
  } else if (expenseRatio > 60 && totalIncome > 0) {
    insights.push({
      type: "warning",
      title: "Expense ratio high",
      body: `You're spending ${expenseRatio}% of income on business costs. Consider reviewing recurring expenses.`,
      action: "View category breakdown",
      route: "/category-breakdown",
    });
  }

  return (
    <SafeAreaView
      edges={["top"]}
      style={{ flex: 1, backgroundColor: colour.background }}
    >
      <StatusBar barStyle="dark-content" backgroundColor={colour.background} />
      <MXBackHeader title="Income vs expenses" />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: space["5xl"] }}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={{ alignItems: "center", paddingTop: 80 }}>
            <ActivityIndicator color={colour.primary} size="large" />
          </View>
        ) : error ? (
          <View style={{ alignItems: "center", paddingTop: 80, paddingHorizontal: space.lg }}>
            <Text style={{ ...typography.bodyM, color: colour.danger, textAlign: "center" }}>
              {error}
            </Text>
          </View>
        ) : (
          <>
            {/* ── Net position hero ──────────────────────────────────────── */}
            <View style={{
              marginHorizontal: space.lg,
              marginTop: space.md,
              marginBottom: space.md,
              backgroundColor: colour.white,
              borderRadius: radius.lg,
              padding: space.xl,
              borderWidth: 1,
              borderColor: colour.borderLight,
              ...platformShadow,
            }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                <Text style={{ fontSize: 10, fontWeight: "600", color: colour.textSub, letterSpacing: 0.8 }}>
                  NET POSITION
                </Text>
                {currentMonth && (
                  <View style={{
                    backgroundColor: colour.primary50,
                    borderRadius: radius.pill,
                    paddingHorizontal: 10, paddingVertical: 4,
                  }}>
                    <Text style={{ fontSize: 10, fontWeight: "600", color: colour.accentDeep }}>
                      {currentMonth.label} {new Date().getFullYear()}
                    </Text>
                  </View>
                )}
              </View>

              <Text style={{
                fontSize: 36, fontWeight: "800",
                color: totalNet >= 0 ? colour.success : colour.danger,
                letterSpacing: -1.5, lineHeight: 42, marginBottom: 2,
              }}>
                {totalNet >= 0 ? "+" : ""}{fmt(totalNet)}
              </Text>
              <Text style={{ fontSize: 11, color: colour.textSub, marginBottom: space.md }}>
                You kept {keepPct}% of your income over 6 months
              </Text>

              {/* Proportional bar */}
              <View style={{
                flexDirection: "row", height: 10, borderRadius: 5, overflow: "hidden", marginBottom: space.md,
              }}>
                <View style={{ width: `${incomeBarPct}%`, backgroundColor: colour.primary, borderRadius: 5 }} />
                <View style={{ flex: 1, backgroundColor: colour.danger }} />
              </View>

              {/* Legend */}
              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <View style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: colour.primary }} />
                  <Text style={{ fontSize: 10, color: colour.textSub }}>Income</Text>
                  <Text style={{ fontSize: 13, fontWeight: "700", color: colour.text }}>{fmt(totalIncome)}</Text>
                </View>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <View style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: colour.danger }} />
                  <Text style={{ fontSize: 10, color: colour.textSub }}>Expenses</Text>
                  <Text style={{ fontSize: 13, fontWeight: "700", color: colour.text }}>{fmt(totalExpenses)}</Text>
                </View>
              </View>
            </View>

            {/* ── 6-month trend chart ────────────────────────────────────── */}
            <View style={{
              marginHorizontal: space.lg,
              marginBottom: space.md,
              backgroundColor: colour.white,
              borderRadius: radius.lg,
              borderWidth: 1,
              borderColor: colour.borderLight,
              overflow: "hidden",
            }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 16, paddingBottom: 0 }}>
                <Text style={{ fontSize: 12, fontWeight: "700", color: colour.text }}>
                  6-month trend
                </Text>
                <View style={{ flexDirection: "row", gap: 10 }}>
                  {[
                    { c: colour.primary, l: "Income" },
                    { c: colour.danger,  l: "Expenses" },
                  ].map((item) => (
                    <View key={item.l} style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                      <View style={{ width: 6, height: 6, borderRadius: 1, backgroundColor: item.c }} />
                      <Text style={{ fontSize: 9, color: colour.textSub, fontWeight: "500" }}>{item.l}</Text>
                    </View>
                  ))}
                </View>
              </View>
              <View style={{ padding: 16, paddingTop: 12 }}>
                <SideBySideBarChart data={chartData} />
              </View>
            </View>

            {/* ── Insights ───────────────────────────────────────────────── */}
            {insights.length > 0 && (
              <>
                <Text style={{
                  fontSize: 10, fontWeight: "700", color: colour.textSub,
                  letterSpacing: 1, textTransform: "uppercase",
                  paddingHorizontal: space.lg, marginBottom: 8,
                }}>
                  Insights
                </Text>
                {insights.map((insight, i) => (
                  <InsightCard
                    key={i}
                    type={insight.type}
                    title={insight.title}
                    body={insight.body}
                    action={insight.action}
                    onAction={insight.route ? () => router.push(insight.route as any) : undefined}
                  />
                ))}
              </>
            )}

            {/* ── Monthly breakdown ──────────────────────────────────────── */}
            <Text style={{
              fontSize: 10, fontWeight: "700", color: colour.textSub,
              letterSpacing: 1, textTransform: "uppercase",
              paddingHorizontal: space.lg, marginTop: 4, marginBottom: 8,
            }}>
              Monthly breakdown
            </Text>

            <View style={{ marginHorizontal: space.lg }}>
              {[...allMonths].reverse().map((m, i) => {
                const hasData = m.income > 0 || m.expenses > 0;
                const expRatio = m.income > 0 ? Math.round((m.expenses / m.income) * 100) : 0;

                return (
                  <View key={m.key} style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingVertical: 12,
                    paddingHorizontal: space.md,
                    backgroundColor: colour.white,
                    borderWidth: 1,
                    borderColor: colour.borderLight,
                    borderTopWidth: i === 0 ? 1 : 0,
                    borderTopLeftRadius: i === 0 ? radius.md : 0,
                    borderTopRightRadius: i === 0 ? radius.md : 0,
                    borderBottomLeftRadius: i === allMonths.length - 1 ? radius.md : 0,
                    borderBottomRightRadius: i === allMonths.length - 1 ? radius.md : 0,
                  }}>
                    {/* Month badge */}
                    <View style={{
                      width: 40, height: 40, borderRadius: 10,
                      backgroundColor: hasData ? colour.surface2 : colour.surface1,
                      alignItems: "center", justifyContent: "center", marginRight: 12,
                    }}>
                      <Text style={{ fontSize: 12, fontWeight: "700", color: colour.text }}>
                        {m.label}
                      </Text>
                    </View>

                    {/* Income / Expense + mini bar */}
                    <View style={{ flex: 1 }}>
                      {hasData ? (
                        <>
                          <Text style={{ fontSize: 12, fontWeight: "600", color: colour.success }}>
                            +{fmt(m.income)}
                          </Text>
                          <Text style={{ fontSize: 11, color: colour.danger, marginTop: 1 }}>
                            -{fmt(m.expenses)}
                          </Text>
                          <View style={{ height: 3, backgroundColor: colour.surface2, borderRadius: 2, marginTop: 6 }}>
                            <View style={{
                              width: `${Math.min(expRatio, 100)}%`,
                              height: 3, borderRadius: 2, backgroundColor: colour.danger,
                            }} />
                          </View>
                        </>
                      ) : (
                        <Text style={{ fontSize: 12, color: colour.textHint }}>No transactions</Text>
                      )}
                    </View>

                    {/* Net */}
                    <Text style={{
                      fontSize: 13, fontWeight: "700",
                      color: m.net >= 0 ? colour.success : colour.danger,
                      marginLeft: 12,
                    }}>
                      {m.net >= 0 ? "+" : ""}{fmt(m.net)}
                    </Text>
                  </View>
                );
              })}
            </View>

            {/* ── Tip banner (noir) ──────────────────────────────────────── */}
            <View style={{
              marginHorizontal: space.lg,
              marginTop: space.md,
              backgroundColor: colour.noir,
              borderRadius: radius.md,
              padding: space.md,
              flexDirection: "row",
              gap: space.md,
              alignItems: "flex-start",
            }}>
              <View style={{
                backgroundColor: colour.primary,
                borderRadius: radius.sm,
                width: 28, height: 28,
                alignItems: "center", justifyContent: "center",
              }}>
                <IconSymbol name="info.circle" size={14} color={colour.onPrimary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{
                  fontSize: 12, fontFamily: "Inter_600SemiBold",
                  color: colour.onNoir, marginBottom: 2,
                }}>
                  How this works
                </Text>
                <Text style={{
                  fontSize: 11, fontFamily: "Inter_400Regular",
                  color: colour.onNoir2, lineHeight: 16,
                }}>
                  Expenses are grouped by their receipt date, not the date you entered them. If a scanned receipt has an older date, it appears in the relevant month above.
                </Text>
              </View>
            </View>
          </>
        )}
      </ScrollView>
      <MXTabBar />
    </SafeAreaView>
  );
}
