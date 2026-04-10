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
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { G, Path, Rect, Text as SvgText } from "react-native-svg";

// ─── SVG Bar Chart ────────────────────────────────────────────────────────────

const CHART_W = 320;
const BAR_AREA_H = 100;
const CHART_H = BAR_AREA_H + 20;
const BAR_GAP = 4;

function BarChart({
  data,
  maxVal,
}: {
  data: { month: string; income: number; expense: number }[];
  maxVal: number;
}) {
  const n = data.length;
  const groupW = n > 0 ? (CHART_W - BAR_GAP * (n - 1)) / n : 0;
  const barW = (groupW - BAR_GAP) / 2;

  return (
    <Svg
      width="100%"
      viewBox={`0 0 ${CHART_W} ${CHART_H}`}
      style={{ overflow: "visible" }}
    >
      {data.map((d, i) => {
        const x = i * (groupW + BAR_GAP);
        const incH = Math.max(
          (d.income / maxVal) * BAR_AREA_H,
          d.income > 0 ? 3 : 0,
        );
        const expH = Math.max(
          (d.expense / maxVal) * BAR_AREA_H,
          d.expense > 0 ? 3 : 0,
        );
        return (
          <G key={d.month}>
            <Rect
              x={x}
              y={BAR_AREA_H - incH}
              width={barW}
              height={incH || 0}
              rx={3}
              fill="#006FFD"
              opacity={0.85}
            />
            <Rect
              x={x + barW + BAR_GAP}
              y={BAR_AREA_H - expH}
              width={barW}
              height={expH || 0}
              rx={3}
              fill="#FF4757"
              opacity={0.7}
            />
            <SvgText
              x={x + groupW / 2}
              y={BAR_AREA_H + 16}
              textAnchor="middle"
              fontSize={9}
              fill="#9BA1B0"
            >
              {d.month}
            </SvgText>
          </G>
        );
      })}
    </Svg>
  );
}

// ─── SVG Donut Chart ──────────────────────────────────────────────────────────

function polarToCartesian(cx: number, cy: number, r: number, deg: number) {
  const rad = ((deg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function arcPath(
  cx: number,
  cy: number,
  r: number,
  startDeg: number,
  endDeg: number,
  ir: number,
): string {
  const s = polarToCartesian(cx, cy, r, endDeg);
  const e = polarToCartesian(cx, cy, r, startDeg);
  const is = polarToCartesian(cx, cy, ir, endDeg);
  const ie = polarToCartesian(cx, cy, ir, startDeg);
  const large = endDeg - startDeg > 180 ? 1 : 0;
  return [
    `M ${s.x} ${s.y}`,
    `A ${r} ${r} 0 ${large} 0 ${e.x} ${e.y}`,
    `L ${ie.x} ${ie.y}`,
    `A ${ir} ${ir} 0 ${large} 1 ${is.x} ${is.y}`,
    "Z",
  ].join(" ");
}

function DonutChart({
  slices,
  total,
}: {
  slices: { label: string; amount: number; color: string }[];
  total: number;
}) {
  const SIZE = 180;
  const cx = SIZE / 2;
  const cy = SIZE / 2;
  const R = 78;
  const IR = 52;

  let cursor = 0;
  const paths = slices.map((s) => {
    const sweep = total > 0 ? (s.amount / total) * 358 : 0; // 358 to avoid full-circle glitch
    const path = arcPath(cx, cy, R, cursor, cursor + sweep, IR);
    cursor += sweep;
    return { ...s, path };
  });

  const centerLabel =
    total >= 1_000_000
      ? `R${(total / 1_000_000).toFixed(1)}M`
      : total >= 1_000
        ? `R${(total / 1_000).toFixed(1)}k`
        : `R${total.toFixed(0)}`;

  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
      <Svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
        {paths.map((s, i) => (
          <Path key={i} d={s.path} fill={s.color} />
        ))}
        <SvgText
          x={cx}
          y={cy - 6}
          textAnchor="middle"
          fontSize={11}
          fill="#9BA1B0"
        >
          Total
        </SvgText>
        <SvgText
          x={cx}
          y={cy + 10}
          textAnchor="middle"
          fontSize={13}
          fontWeight="bold"
          fill="#1a1a2e"
        >
          {centerLabel}
        </SvgText>
      </Svg>
      <View style={{ flex: 1, gap: 6 }}>
        {slices.slice(0, 6).map((s, i) => (
          <View
            key={i}
            style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
          >
            <View
              style={{
                width: 8,
                height: 8,
                borderRadius: 2,
                backgroundColor: s.color,
              }}
            />
            <Text
              style={{ flex: 1, fontSize: 10, color: "#555" }}
              numberOfLines={1}
            >
              {s.label}
            </Text>
            <Text style={{ fontSize: 10, fontWeight: "700", color: "#1a1a2e" }}>
              {total > 0 ? `${Math.round((s.amount / total) * 100)}%` : "0%"}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const QUICK_REPORTS = [
  {
    id: "1",
    icon: "📊",
    title: "Income vs expenses",
    sub: "Monthly comparison",
    route: "/expense-history",
  },
  {
    id: "2",
    icon: "💰",
    title: "Tax savings report",
    sub: "ITR12 deduction summary",
    route: "/tax-summary",
  },
  {
    id: "3",
    icon: "🗂️",
    title: "Category breakdown",
    sub: "Expenses by SARS category",
    route: "/category-breakdown",
  },
  {
    id: "4",
    icon: "📤",
    title: "Export centre",
    sub: "PDF · CSV · ITR12",
    route: "/itr12-export-setup",
  },
  {
    id: "5",
    icon: "🧾",
    title: "VAT summary",
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
  const [categoryBreakdown, setCategoryBreakdown] = useState<
    { label: string; amount: number; color: string }[]
  >([]);

  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [incomeTotals, expenseTotals, allExpenses, allIncome, byCategory] =
        await Promise.all([
          incomeService.getTotals(user.id),
          expenseService.getTotals(user.id, activeTaxYear),
          expenseService.getExpenses(user.id, activeTaxYear),
          incomeService.getIncome(user.id),
          expenseService.getByCategory(user.id, activeTaxYear),
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

      // Build donut chart slices from category breakdown
      const CHART_COLORS = [
        "#006FFD",
        "#00C9A7",
        "#FFB800",
        "#FF4757",
        "#7B68EE",
        "#FF6B81",
        "#2ED573",
        "#1E90FF",
        "#FFA502",
        "#747D8C",
      ];
      const catEntries = Object.entries(byCategory)
        .filter(
          ([k]) => k !== "Personal / Non-deductible" && k !== "Non-deductible",
        )
        .sort(([, a], [, b]) => b - a)
        .slice(0, 8);
      setCategoryBreakdown(
        catEntries.map(([label, amount], i) => ({
          label,
          amount,
          color: CHART_COLORS[i % CHART_COLORS.length],
        })),
      );
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
    <SafeAreaView
      edges={["top"]}
      style={{ flex: 1, backgroundColor: colour.primary }}
    >
      <StatusBar barStyle="light-content" backgroundColor={colour.primary} />

      <MXHeader
        title="Reports"
        showBack
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

            {/* SVG Bar chart — Income vs Expenses last 6 months */}
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
                <BarChart data={monthlyData} maxVal={maxVal} />
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

            {/* Donut chart — deductible category breakdown */}
            {categoryBreakdown.length > 0 && (
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
                  Deductible by Category
                </Text>
                <DonutChart
                  slices={categoryBreakdown}
                  total={totalDeductions}
                />
              </View>
            )}

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
