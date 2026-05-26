import { IconSymbol } from "@/components/ui/icon-symbol";
import { MXHeader } from "@/components/MXHeader";
import { SA_MARGINAL_TAX_RATE } from "@/constants/tax";
import { expenseService } from "@/services/expenseService";
import { incomeService } from "@/services/incomeService";
import { mileageService } from "@/services/mileageService";
import { useAuthStore } from "@/stores/authStore";
import { useExpenseStore } from "@/stores/expenseStore";
import { colour, radius } from "@/tokens";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useRef, useState } from "react";
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

type Period = "1M" | "3M" | "6M" | "YTD" | "FY";
const PERIODS: Period[] = ["1M", "3M", "6M", "YTD", "FY"];

const REPORT_LINKS: { icon: string; label: string; sub: string; route: string }[] = [
  { icon: "chart.bar.fill", label: "Income vs Expenses", sub: "Monthly comparison",    route: "/income-vs-expenses" },
  { icon: "checkmark",      label: "Tax Savings",        sub: "Year-to-date breakdown", route: "/tax-summary"        },
  { icon: "list.bullet",    label: "Category Breakdown", sub: "Where your money goes",  route: "/category-breakdown" },
  { icon: "doc.text.fill",  label: "VAT Summary",        sub: "Input vs output VAT",    route: "/vat-summary"        },
];

const fmtAmount = (n: number) =>
  `R ${n.toLocaleString("en-ZA", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

const fmtShort = (n: number) => {
  if (n >= 1_000_000) return `R ${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `R ${(n / 1_000).toFixed(0)}k`;
  return `R ${n.toFixed(0)}`;
};

function getDaysToDeadline(activeTaxYear: string): number {
  const match = activeTaxYear.match(/\d{4}\/(\d{2})/);
  const endYear = match ? 2000 + parseInt(match[1], 10) : new Date().getFullYear();
  const deadline = new Date(endYear, 10, 23); // Nov 23
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.ceil((deadline.getTime() - today.getTime()) / 86400000);
}

function Sparkline({
  data,
  color,
  width = 100,
  height = 28,
}: {
  data: number[];
  color: string;
  width?: number;
  height?: number;
}) {
  if (data.length < 2) return <View style={{ width, height }} />;
  const max = Math.max(...data, 0.01);
  const min = Math.min(...data, 0);
  const range = max - min || 0.01;
  const stepX = width / (data.length - 1);
  const pts = data.map((v, i) => ({
    x: i * stepX,
    y: height - 2 - ((v - min) / range) * (height - 4),
  }));
  const d = pts
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(" ");
  return (
    <Svg width={width} height={height} style={{ overflow: "visible" }}>
      <Path
        d={d}
        stroke={color}
        strokeWidth={1.5}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function StackedBarChart({
  data,
}: {
  data: { label: string; income: number; expense: number; highlight: boolean }[];
}) {
  const CHART_W = 300;
  const BAR_H = 100;
  const LABEL_H = 16;
  const TOOLTIP_H = 22;
  const TOTAL_H = BAR_H + LABEL_H + TOOLTIP_H;
  const GAP = 5;
  const n = data.length;
  if (n === 0) return null;
  const barW = (CHART_W - GAP * (n - 1)) / n;
  const maxVal = Math.max(...data.map((d) => d.income + d.expense), 1);
  const hlIdx = data.findIndex((d) => d.highlight);

  return (
    <Svg
      width="100%"
      viewBox={`0 0 ${CHART_W} ${TOTAL_H}`}
      style={{ overflow: "visible" }}
    >
      {data.map((d, i) => {
        const x = i * (barW + GAP);
        const incH = Math.max((d.income / maxVal) * BAR_H, d.income > 0 ? 3 : 0);
        const expH = Math.max((d.expense / maxVal) * BAR_H, d.expense > 0 ? 3 : 0);
        const totalH = incH + expH;
        const isHl = i === hlIdx;
        const barTop = TOOLTIP_H + BAR_H - totalH;

        return (
          <G key={i}>
            {/* Tooltip */}
            {isHl && d.income > 0 && (
              <>
                <Rect
                  x={x + barW / 2 - 24}
                  y={TOOLTIP_H - 18}
                  width={48}
                  height={15}
                  rx={4}
                  fill={colour.text}
                />
                <SvgText
                  x={x + barW / 2}
                  y={TOOLTIP_H - 7}
                  textAnchor="middle"
                  fontSize={7}
                  fontWeight="700"
                  fill={colour.white}
                >
                  {fmtShort(d.income)}
                </SvgText>
              </>
            )}
            {/* Expense cap (red, sits on top) */}
            {expH > 0 && (
              <Rect
                x={x}
                y={barTop}
                width={barW}
                height={expH}
                rx={3}
                fill={colour.danger}
                opacity={0.85}
              />
            )}
            {/* Income bar (purple, below expense) */}
            <Rect
              x={x}
              y={barTop + expH}
              width={barW}
              height={incH}
              rx={3}
              fill={colour.primary}
              opacity={isHl ? 1 : 0.6}
            />
            {/* Month label */}
            <SvgText
              x={x + barW / 2}
              y={TOOLTIP_H + BAR_H + 13}
              textAnchor="middle"
              fontSize={9}
              fill={isHl ? colour.onNoir : colour.onNoir2}
              fontWeight={isHl ? "700" : "400"}
            >
              {d.label}
            </SvgText>
          </G>
        );
      })}
    </Svg>
  );
}

type MonthRow = { label: string; monthStr: string; income: number; expense: number };

export default function ReportsTabScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { activeTaxYear } = useExpenseStore();

  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<Period>("6M");
  const [monthlyData, setMonthlyData] = useState<MonthRow[]>([]);
  const [fyDeductions, setFyDeductions] = useState(0);
  const [receiptCount, setReceiptCount] = useState(0);
  const [totalKm, setTotalKm] = useState(0);
  const [tripCount, setTripCount] = useState(0);
  const [categoryCount, setCategoryCount] = useState(0);

  const isFetching = useRef(false);
  const hasLoaded = useRef(false);

  const loadData = useCallback(
    async (silent = false) => {
      if (!user) { setLoading(false); return; }
      if (isFetching.current) return;
      isFetching.current = true;
      if (!silent) setLoading(true);
      try {
        const [expenseTotals, allExpenses, allIncome, mileageTrips, byCategory] =
          await Promise.all([
            expenseService.getTotals(user.id, activeTaxYear),
            expenseService.getExpenses(user.id, activeTaxYear),
            incomeService.getIncome(user.id),
            mileageService.getTrips(user.id, activeTaxYear),
            expenseService.getByCategory(user.id, activeTaxYear),
          ]);

        setFyDeductions(expenseTotals.totalDeductions);
        setReceiptCount(expenseTotals.receiptCount);
        setTotalKm(Math.round(mileageTrips.reduce((s, t) => s + Number(t.distance_km), 0)));
        setTripCount(mileageTrips.length);
        setCategoryCount(
          Object.keys(byCategory).filter((k) => k !== "Personal / Non-deductible").length,
        );

        const now = new Date();
        const months: MonthRow[] = Array.from({ length: 12 }, (_, k) => {
          const d = new Date(now.getFullYear(), now.getMonth() - (11 - k), 1);
          const label = d.toLocaleString("en-ZA", { month: "short" });
          const monthStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
          const income = allIncome
            .filter((e) => e.date.startsWith(monthStr))
            .reduce((s, e) => s + Number(e.amount), 0);
          const expense = allExpenses
            .filter((e) => e.expense_date.startsWith(monthStr))
            .reduce((s, e) => s + Number(e.amount), 0);
          return { label, monthStr, income, expense };
        });
        setMonthlyData(months);
        hasLoaded.current = true;
      } catch (e) {
        console.warn("Reports load error:", e);
      } finally {
        setLoading(false);
        isFetching.current = false;
      }
    },
    [user?.id, activeTaxYear],
  );

  useFocusEffect(
    useCallback(() => { loadData(hasLoaded.current); }, [loadData]),
  );

  // Period slice
  const periodMonths = (() => {
    const now = new Date();
    switch (selectedPeriod) {
      case "1M": return monthlyData.slice(-1);
      case "3M": return monthlyData.slice(-3);
      case "6M": return monthlyData.slice(-6);
      case "YTD": {
        const yr = now.getFullYear();
        return monthlyData.filter((m) => m.monthStr.startsWith(`${yr}-`));
      }
      case "FY": {
        const [startYearStr] = activeTaxYear.split("/");
        const startYear = parseInt(startYearStr, 10);
        const fyStart = `${startYear}-03`;
        const fyEnd = `${startYear + 1}-02`;
        return monthlyData.filter((m) => m.monthStr >= fyStart && m.monthStr <= fyEnd);
      }
    }
  })();

  const periodIncome = periodMonths.reduce((s, m) => s + m.income, 0);
  const periodExpenses = periodMonths.reduce((s, m) => s + m.expense, 0);
  const periodNet = periodIncome - periodExpenses;

  // Trend vs previous equivalent period
  const periodLen = periodMonths.length;
  const prevMonths =
    selectedPeriod === "1M" || selectedPeriod === "3M" || selectedPeriod === "6M"
      ? monthlyData.slice(-(periodLen * 2), -periodLen)
      : [];
  const prevIncome = prevMonths.reduce((s, m) => s + m.income, 0);
  const prevExpenses = prevMonths.reduce((s, m) => s + m.expense, 0);
  const incomeTrend = prevIncome > 0 ? Math.round(((periodIncome - prevIncome) / prevIncome) * 100) : null;
  const expenseTrend = prevExpenses > 0 ? Math.round(((periodExpenses - prevExpenses) / prevExpenses) * 100) : null;

  // Chart highlight: month with highest income (fallback: last)
  const hlIdx =
    periodMonths.length > 0
      ? periodMonths.reduce(
          (best, m, i) => (m.income > periodMonths[best].income ? i : best),
          periodMonths.length - 1,
        )
      : 0;
  const chartData = periodMonths.map((m, i) => ({ ...m, highlight: i === hlIdx }));

  const periodRangeLabel = (() => {
    if (periodMonths.length === 0) return "";
    const first = periodMonths[0].label;
    const last = periodMonths[periodMonths.length - 1].label;
    return periodMonths.length === 1 ? first : `${first} → ${last}`;
  })();

  const chartTitle = (() => {
    switch (selectedPeriod) {
      case "1M": return "1-MONTH OVERVIEW";
      case "3M": return "3-MONTH OVERVIEW";
      case "6M": return "6-MONTH OVERVIEW";
      case "YTD": return "YEAR TO DATE";
      case "FY": return "FULL YEAR";
    }
  })();

  const estRefund = Math.round(fyDeductions * SA_MARGINAL_TAX_RATE);
  const daysToDeadline = getDaysToDeadline(activeTaxYear);
  const hasChartData = periodMonths.some((m) => m.income > 0 || m.expense > 0);

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
              paddingHorizontal: 10, paddingVertical: 5,
              borderRadius: 100, backgroundColor: colour.primary50,
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
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={{ alignItems: "center", paddingTop: 80 }}>
            <ActivityIndicator color={colour.primary} size="large" />
          </View>
        ) : (
          <>
            {/* ── Hero card ──────────────────────────────────────────────── */}
            <View style={{
              backgroundColor: colour.primary,
              borderRadius: radius.xl,
              padding: 18,
              marginTop: 12,
              marginBottom: 14,
              overflow: "hidden",
            }}>
              <View style={{
                position: "absolute", width: 180, height: 180, borderRadius: 90,
                backgroundColor: "rgba(255,255,255,0.1)", top: -60, right: -50,
              }} />
              <View style={{
                position: "absolute", width: 80, height: 80, borderRadius: 40,
                backgroundColor: "rgba(255,255,255,0.07)", bottom: 12, left: -20,
              }} />

              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <Text style={{ fontSize: 10, fontWeight: "700", color: "rgba(255,255,255,0.65)", letterSpacing: 1, textTransform: "uppercase" }}>
                  Estimated Refund
                </Text>
                {daysToDeadline > 0 && (
                  <View style={{
                    flexDirection: "row", alignItems: "center", gap: 5,
                    backgroundColor: "rgba(255,255,255,0.18)",
                    paddingHorizontal: 9, paddingVertical: 4, borderRadius: 20,
                  }}>
                    <View style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: colour.white }} />
                    <Text style={{ fontSize: 10, fontWeight: "600", color: colour.white }}>
                      {daysToDeadline} d to deadline
                    </Text>
                  </View>
                )}
              </View>

              <Text style={{ fontSize: 46, fontWeight: "800", color: colour.white, letterSpacing: -2, lineHeight: 54, marginBottom: 4 }}>
                {fmtAmount(estRefund)}
              </Text>
              <Text style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", marginBottom: 16, lineHeight: 16 }}>
                Based on logged income, expenses and mileage · {activeTaxYear}
              </Text>

              <View style={{ flexDirection: "row", gap: 8 }}>
                {[
                  { label: "RECEIPTS",   value: `${receiptCount}`,  sub: "scanned"       },
                  { label: "MILEAGE",    value: `${totalKm} km`,    sub: `${tripCount} trips` },
                  { label: "CATEGORIES", value: `${categoryCount}`, sub: "SARS sections"  },
                ].map((chip) => (
                  <View key={chip.label} style={{
                    flex: 1,
                    backgroundColor: "rgba(255,255,255,0.14)",
                    borderRadius: 10,
                    padding: 10,
                  }}>
                    <Text style={{ fontSize: 7.5, fontWeight: "700", color: "rgba(255,255,255,0.55)", letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 3 }}>
                      {chip.label}
                    </Text>
                    <Text style={{ fontSize: 14, fontWeight: "700", color: colour.white, letterSpacing: -0.3 }}>
                      {chip.value}
                    </Text>
                    <Text style={{ fontSize: 9, color: "rgba(255,255,255,0.55)", marginTop: 1 }}>
                      {chip.sub}
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            {/* ── Period tabs ────────────────────────────────────────────── */}
            <View style={{
              flexDirection: "row",
              backgroundColor: colour.white,
              borderRadius: 100,
              padding: 3,
              marginBottom: 14,
              borderWidth: 1,
              borderColor: colour.borderLight,
            }}>
              {PERIODS.map((p) => (
                <TouchableOpacity
                  key={p}
                  onPress={() => setSelectedPeriod(p)}
                  style={{
                    flex: 1, alignItems: "center", paddingVertical: 7,
                    borderRadius: 100,
                    backgroundColor: selectedPeriod === p ? colour.primary : "transparent",
                  }}
                >
                  <Text style={{
                    fontSize: 12, fontWeight: "600",
                    color: selectedPeriod === p ? colour.white : colour.textSub,
                  }}>
                    {p}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* ── Mini income + expenses cards ───────────────────────────── */}
            <View style={{ flexDirection: "row", gap: 10, marginBottom: 14 }}>
              {[
                {
                  key: "income",
                  label: "Income",
                  amount: periodIncome,
                  trend: incomeTrend,
                  data: periodMonths.map((m) => m.income),
                  lineColor: colour.primary,
                  trendGood: (t: number) => t >= 0,
                },
                {
                  key: "expenses",
                  label: "Expenses",
                  amount: periodExpenses,
                  trend: expenseTrend,
                  data: periodMonths.map((m) => m.expense),
                  lineColor: colour.danger,
                  trendGood: (t: number) => t <= 0,
                },
              ].map((card) => (
                <View key={card.key} style={{
                  flex: 1,
                  backgroundColor: colour.white,
                  borderRadius: radius.md,
                  padding: 14,
                  borderWidth: 1,
                  borderColor: colour.borderLight,
                }}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <Text style={{ fontSize: 10, fontWeight: "700", color: colour.textSub, textTransform: "uppercase", letterSpacing: 0.8 }}>
                      {card.label}
                    </Text>
                    {card.trend !== null && (
                      <View style={{
                        flexDirection: "row", alignItems: "center", gap: 2,
                        backgroundColor: card.trendGood(card.trend!) ? colour.successBg : colour.dangerBg,
                        paddingHorizontal: 5, paddingVertical: 2, borderRadius: 6,
                      }}>
                        <Text style={{ fontSize: 9, fontWeight: "700", color: card.trendGood(card.trend!) ? colour.success : colour.danger }}>
                          {card.trend! >= 0 ? "▲" : "▼"} {Math.abs(card.trend!)}%
                        </Text>
                      </View>
                    )}
                  </View>
                  <Text style={{ fontSize: 19, fontWeight: "700", color: colour.text, letterSpacing: -0.5, marginTop: 4 }}>
                    {fmtAmount(card.amount)}
                  </Text>
                  <View style={{ marginTop: 10 }}>
                    <Sparkline data={card.data} color={card.lineColor} width={110} height={28} />
                  </View>
                </View>
              ))}
            </View>

            {/* ── Overview bar chart ─────────────────────────────────────── */}
            {hasChartData && (
              <View style={{
                backgroundColor: colour.noir,
                borderRadius: radius.xl,
                padding: 18,
                marginBottom: 14,
                overflow: "hidden",
              }}>
                <View style={{
                  position: "absolute", width: 150, height: 150, borderRadius: 75,
                  backgroundColor: colour.primary, opacity: 0.18, top: -55, right: -45,
                }} />
                <Text style={{ fontSize: 10, fontWeight: "700", color: colour.onNoir2, letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 }}>
                  {chartTitle}
                </Text>
                <Text style={{ fontSize: 28, fontWeight: "800", color: colour.onNoir, letterSpacing: -1, marginBottom: 2 }}>
                  {fmtAmount(periodNet)}
                </Text>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
                  <Text style={{ fontSize: 11, color: colour.onNoir2 }}>
                    Net · {periodRangeLabel}
                  </Text>
                  <View style={{ flexDirection: "row", gap: 12 }}>
                    {[
                      { c: colour.primary, l: "Income"   },
                      { c: colour.danger,  l: "Expenses" },
                    ].map((item) => (
                      <View key={item.l} style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                        <View style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: item.c }} />
                        <Text style={{ fontSize: 9.5, color: colour.onNoir2, fontWeight: "500" }}>{item.l}</Text>
                      </View>
                    ))}
                  </View>
                </View>
                <StackedBarChart data={chartData} />
              </View>
            )}

            {/* ── Quick links ────────────────────────────────────────────── */}
            <Text style={{
              fontSize: 11, textTransform: "uppercase", color: colour.textSub,
              letterSpacing: 0.8, marginBottom: 10, marginLeft: 2, fontWeight: "600",
            }}>
              Quick Links
            </Text>
            <View style={{
              backgroundColor: colour.white,
              borderRadius: radius.md,
              borderWidth: 1,
              borderColor: colour.borderLight,
              overflow: "hidden",
              marginBottom: 14,
            }}>
              {REPORT_LINKS.map((r, i) => (
                <TouchableOpacity
                  key={r.label}
                  onPress={() => router.push(r.route as any)}
                  activeOpacity={0.7}
                  style={{
                    flexDirection: "row", alignItems: "center",
                    padding: 13, paddingHorizontal: 14,
                    borderBottomWidth: i < REPORT_LINKS.length - 1 ? 1 : 0,
                    borderBottomColor: colour.borderLight,
                  }}
                >
                  <View style={{
                    width: 32, height: 32, borderRadius: 10,
                    backgroundColor: colour.primary50,
                    alignItems: "center", justifyContent: "center", marginRight: 12,
                  }}>
                    <IconSymbol name={r.icon as any} size={14} color={colour.accentDeep} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 13.5, fontWeight: "600", color: colour.text }}>{r.label}</Text>
                    <Text style={{ fontSize: 11, color: colour.textSub, marginTop: 1 }}>{r.sub}</Text>
                  </View>
                  <IconSymbol name="chevron.right" size={13} color={colour.textSub} />
                </TouchableOpacity>
              ))}
            </View>

            {/* ── Export ITR12 CTA ───────────────────────────────────────── */}
            <TouchableOpacity
              onPress={() => router.push("/itr12-export-setup" as any)}
              activeOpacity={0.85}
              style={{
                backgroundColor: colour.noir,
                borderRadius: radius.lg,
                padding: 16, paddingHorizontal: 18,
                flexDirection: "row", alignItems: "center", gap: 14,
                overflow: "hidden",
              }}
            >
              <View style={{
                position: "absolute", width: 120, height: 120, borderRadius: 60,
                backgroundColor: colour.primary, opacity: 0.35, top: -40, right: -30,
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
                <Text style={{ fontSize: 11, color: colour.onNoir2, marginTop: 2 }}>
                  PDF · CSV · SARS-ready
                </Text>
              </View>
              <View style={{
                width: 32, height: 32, borderRadius: 16,
                backgroundColor: "rgba(255,255,255,0.15)",
                alignItems: "center", justifyContent: "center",
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
