import { IconSymbol } from "@/components/ui/icon-symbol";
import { MXHeader } from "@/components/MXHeader";
import { expenseService } from "@/services/expenseService";
import { incomeService } from "@/services/incomeService";
import { mileageService } from "@/services/mileageService";
import { taxLiabilityService } from "@/services/taxLiabilityService";
import { useAuthStore } from "@/stores/authStore";
import { useExpenseStore } from "@/stores/expenseStore";
import type { TaxLiabilityEstimate } from "@/types/database";
import { colour, radius, space } from "@/tokens";
import { useFocusEffect, useRouter } from "expo-router";
import { useAppForeground } from "@/hooks/use-app-foreground";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { G, Rect, Text as SvgText } from "react-native-svg";

type Period = "1M" | "3M" | "6M" | "YTD" | "FY";
const PERIODS: Period[] = ["1M", "3M", "6M", "YTD", "FY"];

const REPORT_LINKS: { icon: string; label: string; sub: string; route: string }[] = [
  { icon: "chart.bar.fill",  label: "Income vs expenses",  sub: "Monthly comparison",       route: "/income-vs-expenses" },
  { icon: "checkmark",       label: "Tax savings",          sub: "Year-to-date breakdown",   route: "/tax-summary"        },
  { icon: "list.bullet",     label: "Category breakdown",   sub: "Where your money goes",    route: "/category-breakdown" },
  { icon: "doc.text.fill",   label: "VAT summary",          sub: "Input vs output VAT",      route: "/vat-summary"        },
  { icon: "calendar",        label: "Provisional tax",        sub: "IRP6 deadlines & estimate",    route: "/provisional-tax"          },
  { icon: "crown.fill",     label: "Government concessions", sub: "S12C · SBC · S10(1)(o) · TFSA", route: "/government-concessions" },
];

const fmtSignedAmount = (n: number) =>
  `R ${Math.abs(n).toLocaleString("en-ZA", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

const fmtAmount = (n: number) =>
  `R ${n.toLocaleString("en-ZA", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

const fmtShort = (n: number) => {
  if (n >= 1_000_000) return `R ${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `R ${(n / 1_000).toFixed(0)}k`;
  return `R ${n.toFixed(0)}`;
};

// Days to the NEXT real SARS non-provisional deadline — independent of
// which tax year is selected in the picker. Previously derived from the
// selected activeTaxYear's own end year, so viewing the still-open current
// tax year showed a deadline over a year away instead of the one that's
// actually imminent right now for whichever year is in its filing window.
function getDaysToDeadline(): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const thisCalendarYearDeadline = new Date(today.getFullYear(), 9, 23); // Oct 23
  const deadline =
    today > thisCalendarYearDeadline
      ? new Date(today.getFullYear() + 1, 9, 23)
      : thisCalendarYearDeadline;
  return Math.ceil((deadline.getTime() - today.getTime()) / 86400000);
}

// ── Stacked bar chart ─────────────────────────────────────────────────────────

function StackedBarChart({
  data,
}: {
  data: { label: string; income: number; expense: number; highlight: boolean }[];
}) {
  const CHART_W = 300;
  const BAR_H = 120;
  const LABEL_H = 18;
  const TOOLTIP_H = 24;
  const TOTAL_H = BAR_H + LABEL_H + TOOLTIP_H; // 162
  const GAP = 5;
  const n = data.length;
  if (n === 0) return null;
  const barW = (CHART_W - GAP * (n - 1)) / n;
  const maxVal = Math.max(...data.map((d) => d.income + d.expense), 1);
  const hlIdx = data.findIndex((d) => d.highlight);

  // Wrap in a View with aspectRatio so the SVG gets an explicit height on
  // Android — without this the SVG collapses to 0px and no bars are visible.
  return (
    <View style={{ width: "100%", aspectRatio: CHART_W / TOTAL_H }}>
      <Svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${CHART_W} ${TOTAL_H}`}
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
              {isHl && d.income > 0 && (
                <>
                  <Rect
                    x={x + barW / 2 - 24}
                    y={TOOLTIP_H - 20}
                    width={48}
                    height={16}
                    rx={4}
                    fill={colour.text}
                  />
                  <SvgText
                    x={x + barW / 2}
                    y={TOOLTIP_H - 8}
                    textAnchor="middle"
                    fontSize={7}
                    fontWeight="700"
                    fill={colour.white}
                  >
                    {fmtShort(d.income)}
                  </SvgText>
                </>
              )}
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
              <Rect
                x={x}
                y={barTop + expH}
                width={barW}
                height={incH}
                rx={3}
                fill={colour.primary}
                opacity={isHl ? 1 : 0.65}
              />
              <SvgText
                x={x + barW / 2}
                y={TOOLTIP_H + BAR_H + 14}
                textAnchor="middle"
                fontSize={9}
                fill={isHl ? colour.text : colour.textSub}
                fontWeight={isHl ? "700" : "400"}
              >
                {d.label}
              </SvgText>
            </G>
          );
        })}
      </Svg>
    </View>
  );
}

type MonthRow = { label: string; monthStr: string; income: number; expense: number };

export default function ReportsTabScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { activeTaxYear } = useExpenseStore();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<Period>("6M");
  const [monthlyData, setMonthlyData] = useState<MonthRow[]>([]);
  const [fyDeductions, setFyDeductions] = useState(0);
  const [receiptCount, setReceiptCount] = useState(0);
  const [totalKm, setTotalKm] = useState(0);
  const [tripCount, setTripCount] = useState(0);
  const [categoryCount, setCategoryCount] = useState(0);
  const [taxLiability, setTaxLiability] = useState<TaxLiabilityEstimate | null>(null);

  const isFetching = useRef(false);
  const hasLoaded = useRef(false);

  const loadData = useCallback(
    async (silent = false) => {
      if (!user) { setLoading(false); return; }
      if (isFetching.current) return;
      isFetching.current = true;
      if (!silent) setLoading(true);
      try {
        const [expenseTotals, allExpenses, allIncome, mileageTrips, byCategory, liabilityEstimate] =
          await Promise.all([
            expenseService.getTotals(user.id, activeTaxYear),
            expenseService.getExpenses(user.id, activeTaxYear),
            incomeService.getIncome(user.id, activeTaxYear),
            mileageService.getTrips(user.id, activeTaxYear),
            expenseService.getByCategory(user.id, activeTaxYear),
            taxLiabilityService.getEstimate(user.id, activeTaxYear).catch(() => null),
          ]);

        setFyDeductions(expenseTotals.totalDeductions);
        setReceiptCount(expenseTotals.receiptCount);
        setTotalKm(Math.round(mileageTrips.reduce((s, t) => s + Number(t.distance_km), 0)));
        setTripCount(mileageTrips.length);
        setCategoryCount(
          Object.keys(byCategory).filter((k) => k !== "Personal / Non-deductible").length,
        );
        setTaxLiability(liabilityEstimate);

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
        setRefreshing(false);
        isFetching.current = false;
      }
    },
    [user?.id, activeTaxYear],
  );

  // Fire when user becomes available while screen is already focused
  useEffect(() => { loadData(hasLoaded.current); }, [loadData]);

  useFocusEffect(
    useCallback(() => { loadData(hasLoaded.current); }, [loadData]),
  );

  useAppForeground(() => loadData(true));

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData(true);
  }, [loadData]);

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
  const prevNet = prevIncome - prevExpenses;
  const incomeTrend = prevIncome > 0 ? Math.round(((periodIncome - prevIncome) / prevIncome) * 100) : null;
  const expenseTrend = prevExpenses > 0 ? Math.round(((periodExpenses - prevExpenses) / prevExpenses) * 100) : null;
  const netTrend = prevNet !== 0 ? Math.round(((periodNet - prevNet) / Math.abs(prevNet)) * 100) : null;

  // Chart highlight: month with highest income
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
    return periodMonths.length === 1 ? first : `${first} \u2192 ${last}`;
  })();

  const chartTitle = (() => {
    switch (selectedPeriod) {
      case "1M": return "1-month overview";
      case "3M": return "3-month overview";
      case "6M": return "6-month overview";
      case "YTD": return "Year to date";
      case "FY": return "Full year";
    }
  })();

  const daysToDeadline = getDaysToDeadline();
  const hasChartData = periodMonths.some((m) => m.income > 0 || m.expense > 0);

  // Routes to the summary if an estimate already exists for this tax year,
  // otherwise to the inputs screen to create one — same pattern as the entry
  // points on app/tax-summary.tsx and app/category-breakdown.tsx.
  const handleTaxLiabilityPress = () => {
    router.push((taxLiability ? "/tax-liability-summary" : "/tax-liability-inputs") as any);
  };

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
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colour.primary}
            colors={[colour.primary]}
          />
        }
      >
        {loading ? (
          <View style={{ alignItems: "center", paddingTop: 80 }}>
            <ActivityIndicator color={colour.primary} size="large" />
          </View>
        ) : (
          <>
            {/* ── 1. Overview chart card (white) ─────────────────────────── */}
            {hasChartData && (
              <View style={{
                backgroundColor: colour.white,
                borderRadius: radius.xl,
                padding: 18,
                marginTop: 12,
                marginBottom: 14,
                borderWidth: 1,
                borderColor: colour.borderLight,
              }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                  <Text style={{ fontSize: 10, fontWeight: "700", color: colour.textSub, letterSpacing: 1, textTransform: "uppercase" }}>
                    {chartTitle}
                  </Text>
                  <View style={{ flexDirection: "row", gap: 12 }}>
                    {[
                      { c: colour.primary, l: "Income" },
                      { c: colour.danger,  l: "Expenses" },
                    ].map((item) => (
                      <View key={item.l} style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                        <View style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: item.c }} />
                        <Text style={{ fontSize: 9.5, color: colour.textSub, fontWeight: "500" }}>{item.l}</Text>
                      </View>
                    ))}
                  </View>
                </View>

                <Text style={{ fontSize: 28, fontWeight: "800", color: colour.text, letterSpacing: -1, marginBottom: 2 }}>
                  {fmtAmount(periodNet)}
                </Text>
                <Text style={{ fontSize: 11, color: colour.textSub, marginBottom: 18 }}>
                  Net · {periodRangeLabel}
                </Text>

                <StackedBarChart data={chartData} />
              </View>
            )}

            {/* ── 2. Period tabs ──────────────────────────────────────────── */}
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

            {/* ── 3. Snapshot row (Income / Expenses / Net) ──────────────── */}
            <View style={{ flexDirection: "row", gap: 8, marginBottom: 14 }}>
              {[
                {
                  label: "Income",
                  amount: periodIncome,
                  trend: incomeTrend,
                  trendGood: (t: number) => t >= 0,
                },
                {
                  label: "Expenses",
                  amount: periodExpenses,
                  trend: expenseTrend,
                  trendGood: (t: number) => t <= 0,
                },
                {
                  label: "Net",
                  amount: periodNet,
                  trend: netTrend,
                  amountColour: periodNet >= 0 ? colour.success : colour.danger,
                  trendGood: (t: number) => t >= 0,
                },
              ].map((card) => (
                <View key={card.label} style={{
                  flex: 1,
                  backgroundColor: colour.white,
                  borderRadius: radius.md,
                  padding: 14,
                  borderWidth: 1,
                  borderColor: colour.borderLight,
                }}>
                  <Text style={{
                    fontSize: 9, fontWeight: "600", color: colour.textSub,
                    letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 6,
                  }}>
                    {card.label}
                  </Text>
                  <Text style={{
                    fontSize: 17, fontWeight: "800", letterSpacing: -0.5,
                    color: (card as any).amountColour ?? colour.text,
                    marginBottom: 2,
                  }}>
                    {fmtShort(Math.abs(card.amount))}
                  </Text>
                  {card.trend !== null && (
                    <View style={{
                      flexDirection: "row", alignItems: "center",
                      backgroundColor: card.trendGood(card.trend!) ? colour.successBg : colour.dangerBg,
                      paddingHorizontal: 5, paddingVertical: 2, borderRadius: 6,
                      alignSelf: "flex-start",
                    }}>
                      <Text style={{
                        fontSize: 9, fontWeight: "700",
                        color: card.trendGood(card.trend!) ? colour.success : colour.danger,
                      }}>
                        {card.trend! >= 0 ? "\u25B2" : "\u25BC"} {Math.abs(card.trend!)}%
                      </Text>
                    </View>
                  )}
                </View>
              ))}
            </View>

            {/* ── 4. Total deductions strip (periwinkle) ──────────────────── */}
            <View style={{
              backgroundColor: colour.primary,
              borderRadius: radius.md,
              padding: 16,
              paddingHorizontal: 18,
              marginBottom: 14,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              overflow: "hidden",
            }}>
              <View style={{
                position: "absolute", width: 100, height: 100, borderRadius: 50,
                backgroundColor: "rgba(255,255,255,0.12)", top: -30, right: -20,
              }} />
              <View>
                <Text style={{ fontSize: 10, fontWeight: "600", color: "rgba(255,255,255,0.6)", letterSpacing: 0.5, marginBottom: 4 }}>
                  TOTAL DEDUCTIONS · {activeTaxYear}
                </Text>
                <Text style={{ fontSize: 24, fontWeight: "800", color: colour.white, letterSpacing: -1 }}>
                  {fmtAmount(fyDeductions)}
                </Text>
                {daysToDeadline > 0 && (
                  <Text style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", marginTop: 2 }}>
                    {daysToDeadline} days to deadline
                  </Text>
                )}
              </View>
              <View style={{ alignItems: "flex-end", gap: 4 }}>
                <View style={{ backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 8, padding: 6, paddingHorizontal: 10 }}>
                  <Text style={{ fontSize: 11, fontWeight: "700", color: colour.white }}>{receiptCount}</Text>
                  <Text style={{ fontSize: 8, color: "rgba(255,255,255,0.55)", marginTop: 1 }}>RECEIPTS</Text>
                </View>
                <View style={{ backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 8, padding: 6, paddingHorizontal: 10 }}>
                  <Text style={{ fontSize: 11, fontWeight: "700", color: colour.white }}>{totalKm} km</Text>
                  <Text style={{ fontSize: 8, color: "rgba(255,255,255,0.55)", marginTop: 1 }}>MILEAGE</Text>
                </View>
              </View>
            </View>

            {/* ── 4b. Tax Refund or Bill (noir) — what you actually owe/get back,
                as distinct from the deduction-based estimate above ────────── */}
            <TouchableOpacity
              onPress={handleTaxLiabilityPress}
              activeOpacity={0.85}
              style={{
                backgroundColor: colour.noir,
                borderRadius: radius.md,
                padding: 16,
                paddingHorizontal: 18,
                marginBottom: 14,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                overflow: "hidden",
              }}
            >
              <View style={{
                position: "absolute", width: 100, height: 100, borderRadius: 50,
                backgroundColor: colour.primary, opacity: 0.35, top: -30, right: -20,
              }} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 10, fontWeight: "600", color: colour.onNoir2, letterSpacing: 0.5, marginBottom: 4 }}>
                  {taxLiability
                    ? taxLiability.final_liability > 0
                      ? "YOU OWE SARS"
                      : taxLiability.final_liability < 0
                        ? "SARS OWES YOU"
                        : "TAX REFUND OR BILL"
                    : "TAX REFUND OR BILL"}
                </Text>
                {taxLiability ? (
                  <Text style={{
                    fontSize: 24, fontWeight: "800", letterSpacing: -1,
                    color: taxLiability.final_liability > 0 ? colour.danger : taxLiability.final_liability < 0 ? colour.success : colour.onNoir,
                  }}>
                    {fmtSignedAmount(taxLiability.final_liability)}
                  </Text>
                ) : (
                  <Text style={{ fontSize: 15, fontWeight: "700", color: colour.onNoir, letterSpacing: -0.3 }}>
                    See what you owe or get back
                  </Text>
                )}
                <Text style={{ fontSize: 10, color: colour.onNoir2, marginTop: 4 }}>
                  {taxLiability ? "Tap to see the details" : "Tap to find out what you owe or get back"}
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

            {/* ── 5. Quick links ──────────────────────────────────────────── */}
            <Text style={{
              fontSize: 11, color: colour.textSub,
              letterSpacing: 0.8, marginBottom: 10, marginLeft: 2, fontWeight: "600",
            }}>
              Quick links
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

            {/* ── 6. Export ITR12 CTA ─────────────────────────────────────── */}
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
