import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useThemeColor } from "@/hooks/use-theme-color";
import { useState } from "react";
import { ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";

interface DeductionForecastScreenProps {
  navigation?: any;
}

interface ForecastMonth {
  month: string;
  deduct: number;
  actual: boolean;
}

interface CategoryForecast {
  category: string;
  ytd: number;
  projected: number;
  itr12: string;
  color: string;
}

// ─── Tax Brackets (2024/25 SARS) ──────────────────────────────────────────────
const TAX_BRACKETS = [
  { min: 0, max: 237100, rate: 0.18, base: 0 },
  { min: 237100, max: 370500, rate: 0.26, base: 42678 },
  { min: 370500, max: 512800, rate: 0.31, base: 77362 },
  { min: 512800, max: 673000, rate: 0.36, base: 121475 },
  { min: 673000, max: 857900, rate: 0.39, base: 179147 },
  { min: 857900, max: 1817000, rate: 0.41, base: 251258 },
  { min: 1817000, max: Infinity, rate: 0.45, base: 644489 },
];

const PRIMARY_REBATE = 17235;

function calcTax(income: number): number {
  const bracket =
    TAX_BRACKETS.find((b) => income >= b.min && income < b.max) ||
    TAX_BRACKETS[TAX_BRACKETS.length - 1];
  const tax = bracket.base + (income - bracket.min) * bracket.rate;
  return Math.max(tax - PRIMARY_REBATE, 0);
}

// ─── Mock YTD Data ────────────────────────────────────────────────────────────
const MONTHS_ELAPSED = 6;
const MONTHS_REMAINING = 6;
const YTD_INCOME = 182000;
const YTD_DEDUCTIBLE = 47840;
const MONTHLY_AVG_DEDUCT = YTD_DEDUCTIBLE / MONTHS_ELAPSED;
const PROJECTED_DEDUCT = YTD_DEDUCTIBLE + MONTHLY_AVG_DEDUCT * MONTHS_REMAINING;
const PROJECTED_INCOME = (YTD_INCOME / MONTHS_ELAPSED) * 12;

const TAX_WITHOUT = calcTax(PROJECTED_INCOME);
const TAX_WITH = calcTax(PROJECTED_INCOME - PROJECTED_DEDUCT);
const TAX_SAVING = TAX_WITHOUT - TAX_WITH;

// ─── Monthly Forecast Data ────────────────────────────────────────────────────
const FORECAST_MONTHS: ForecastMonth[] = [
  { month: "Oct", deduct: 7100, actual: true },
  { month: "Nov", deduct: 8900, actual: true },
  { month: "Dec", deduct: 5600, actual: true },
  { month: "Jan", deduct: 9800, actual: true },
  { month: "Feb", deduct: 8200, actual: true },
  { month: "Mar", deduct: 8240, actual: true },
  { month: "Apr", deduct: MONTHLY_AVG_DEDUCT, actual: false },
  { month: "May", deduct: MONTHLY_AVG_DEDUCT, actual: false },
  { month: "Jun", deduct: MONTHLY_AVG_DEDUCT, actual: false },
  { month: "Jul", deduct: MONTHLY_AVG_DEDUCT, actual: false },
  { month: "Aug", deduct: MONTHLY_AVG_DEDUCT, actual: false },
  { month: "Sep", deduct: MONTHLY_AVG_DEDUCT, actual: false },
];

const MAX_DEDUCT = Math.max(...FORECAST_MONTHS.map((m) => m.deduct));

// ─── Category Forecast ────────────────────────────────────────────────────────
const CATEGORY_FORECAST: CategoryForecast[] = [
  {
    category: "Travel & Transport",
    ytd: 8400,
    projected: 16800,
    itr12: "S11(a)",
    color: "#1565C0",
  },
  {
    category: "Home Office",
    ytd: 6200,
    projected: 12400,
    itr12: "S11(a)",
    color: "#0288D1",
  },
  {
    category: "Equipment & Tools",
    ytd: 5600,
    projected: 7800,
    itr12: "S11(e)",
    color: "#1976D2",
  },
  {
    category: "Software & Subscr.",
    ytd: 3280,
    projected: 6560,
    itr12: "S11(a)",
    color: "#27AE60",
  },
  {
    category: "Professional Fees",
    ytd: 2400,
    projected: 4800,
    itr12: "S11(a)",
    color: "#F39C12",
  },
  {
    category: "Other Deductible",
    ytd: 21960,
    projected: 43920,
    itr12: "S11(a)",
    color: "#E74C3C",
  },
];

// ─── Forecast Category Row Component ──────────────────────────────────────────
interface ForecastCatRowProps {
  item: CategoryForecast;
}

function ForecastCatRow({ item }: ForecastCatRowProps) {
  const pct = ((item.projected / PROJECTED_DEDUCT) * 100).toFixed(0);

  return (
    <View style={[styles.categoryRow, { borderBottomColor: "#E0E0E0" }]}>
      <View style={styles.categoryRowHeader}>
        <View style={[styles.categoryDot, { backgroundColor: item.color }]} />
        <ThemedText style={styles.categoryName}>{item.category}</ThemedText>
        <ThemedText style={[styles.categoryITR12, { color: "#757575" }]}>
          {item.itr12}
        </ThemedText>
      </View>
      <View style={styles.categoryRowValues}>
        <ThemedText style={[styles.categoryYTD, { color: "#757575" }]}>
          YTD: R {item.ytd.toLocaleString()}
        </ThemedText>
        <ThemedText
          type="defaultSemiBold"
          style={[styles.categoryProjected, { color: item.color }]}
        >
          Proj: R {item.projected.toLocaleString()}
        </ThemedText>
      </View>
      <View style={styles.categoryProgressBar}>
        <View
          style={{
            height: 5,
            borderRadius: 3,
            width: `${pct}%` as any,
            backgroundColor: item.color,
          }}
        />
      </View>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export function DeductionForecastScreen({
  navigation,
}: DeductionForecastScreenProps) {
  const [scenario, setScenario] = useState("Realistic");
  const scenarios = ["Conservative", "Realistic", "Optimistic"];

  const scenarioMultiplier: Record<string, number> = {
    Conservative: 0.85,
    Realistic: 1.0,
    Optimistic: 1.15,
  };

  const bgColor = useThemeColor({}, "background");
  const headerBg = "#1565C0";
  const accentColor = "#0288D1";

  const mult = scenarioMultiplier[scenario] || 1.0;
  const scenarioDeduc = PROJECTED_DEDUCT * mult;
  const scenarioTax = calcTax(PROJECTED_INCOME - scenarioDeduc);
  const scenarioSave = TAX_WITHOUT - scenarioTax;

  return (
    <ThemedView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: headerBg }]}>
          <TouchableOpacity onPress={() => navigation?.goBack()}>
            <ThemedText style={[styles.backButton, { color: accentColor }]}>
              ‹ Reports
            </ThemedText>
          </TouchableOpacity>
          <ThemedText style={[styles.headerLabel, { color: accentColor }]}>
            DEDUCTION FORECAST
          </ThemedText>
          <ThemedText style={styles.headerTitle}>
            ITR12 Tax Projection
          </ThemedText>
          <ThemedText style={[styles.headerSubtitle, { color: "#757575" }]}>
            Tax Year 2024/25 · 6 months remaining
          </ThemedText>

          {/* Scenario Selector */}
          <View style={styles.scenarioContainer}>
            {scenarios.map((s) => (
              <TouchableOpacity
                key={s}
                onPress={() => setScenario(s)}
                style={[
                  styles.scenarioButton,
                  {
                    backgroundColor: scenario === s ? accentColor : "#0D47A1",
                  },
                ]}
              >
                <ThemedText
                  style={[
                    styles.scenarioButtonText,
                    {
                      color: "#FFFFFF",
                    },
                  ]}
                >
                  {s}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Content */}
        <View style={[styles.content, { backgroundColor: bgColor }]}>
          {/* Savings Hero Card */}
          <View style={styles.heroCard}>
            <View style={[styles.heroCardTop, { backgroundColor: headerBg }]}>
              <ThemedText
                style={[styles.heroLabel, { color: "#FFFFFF", opacity: 0.85 }]}
              >
                Projected Tax Saving ({scenario})
              </ThemedText>
              <ThemedText style={[styles.heroAmount, { color: "#FFFFFF" }]}>
                R {Math.round(scenarioSave).toLocaleString()}
              </ThemedText>
              <ThemedText
                style={[styles.heroCaption, { color: "#FFFFFF", opacity: 0.8 }]}
              >
                vs. filing without deductions
              </ThemedText>
            </View>
            <View style={styles.heroCardBottom}>
              <View
                style={[styles.heroMetric, { borderRightColor: "#1A3A5C" }]}
              >
                <ThemedText
                  style={[styles.heroMetricLabel, { color: "#757575" }]}
                >
                  Proj. Deductions
                </ThemedText>
                <ThemedText
                  type="defaultSemiBold"
                  style={[styles.heroMetricValue, { color: "#FFFFFF" }]}
                >
                  R {Math.round(scenarioDeduc).toLocaleString()}
                </ThemedText>
              </View>
              <View
                style={[styles.heroMetric, { borderRightColor: "#1A3A5C" }]}
              >
                <ThemedText
                  style={[styles.heroMetricLabel, { color: "#757575" }]}
                >
                  Proj. Tax Payable
                </ThemedText>
                <ThemedText
                  type="defaultSemiBold"
                  style={[styles.heroMetricValue, { color: accentColor }]}
                >
                  R {Math.round(scenarioTax).toLocaleString()}
                </ThemedText>
              </View>
              <View style={styles.heroMetric}>
                <ThemedText
                  style={[styles.heroMetricLabel, { color: "#757575" }]}
                >
                  Tax Without
                </ThemedText>
                <ThemedText
                  type="defaultSemiBold"
                  style={[styles.heroMetricValue, { color: "#E74C3C" }]}
                >
                  R {Math.round(TAX_WITHOUT).toLocaleString()}
                </ThemedText>
              </View>
            </View>
          </View>

          {/* YTD Progress */}
          <ThemedView style={styles.progressCard}>
            <View style={styles.progressCardHeader}>
              <ThemedText
                type="defaultSemiBold"
                style={styles.progressCardTitle}
              >
                Year-to-Date Progress
              </ThemedText>
              <ThemedText
                type="defaultSemiBold"
                style={[styles.progressPercent, { color: accentColor }]}
              >
                {((YTD_DEDUCTIBLE / scenarioDeduc) * 100).toFixed(0)}%
              </ThemedText>
            </View>
            <View style={[styles.progressBar, { backgroundColor: "#F5F5F5" }]}>
              <View
                style={{
                  height: 10,
                  borderRadius: 5,
                  width: `${(YTD_DEDUCTIBLE / scenarioDeduc) * 100}%` as any,
                  backgroundColor: accentColor,
                }}
              />
            </View>
            <View style={styles.progressLegend}>
              <ThemedText
                style={[styles.progressLegendText, { color: "#757575" }]}
              >
                R {YTD_DEDUCTIBLE.toLocaleString()} recorded
              </ThemedText>
              <ThemedText
                style={[styles.progressLegendText, { color: "#757575" }]}
              >
                Target: R {Math.round(scenarioDeduc).toLocaleString()}
              </ThemedText>
            </View>
          </ThemedView>

          {/* Monthly Forecast Chart */}
          <ThemedView style={styles.chartCard}>
            <ThemedText type="defaultSemiBold" style={styles.chartTitle}>
              Monthly Deduction Timeline
            </ThemedText>
            <View style={styles.chartBars}>
              {FORECAST_MONTHS.map((m, i) => {
                const barH = Math.max((m.deduct / MAX_DEDUCT) * 90, 4);
                return (
                  <View key={i} style={styles.chartBar}>
                    <View
                      style={[
                        styles.barFill,
                        {
                          height: barH,
                          backgroundColor: m.actual
                            ? accentColor
                            : `${accentColor}44`,
                          borderColor: accentColor,
                        },
                      ]}
                    />
                    <ThemedText style={styles.barLabel}>{m.month}</ThemedText>
                  </View>
                );
              })}
            </View>
            <View style={styles.chartLegend}>
              <View style={styles.chartLegendItem}>
                <View
                  style={[
                    styles.chartLegendBox,
                    { backgroundColor: accentColor },
                  ]}
                />
                <ThemedText
                  style={[styles.chartLegendLabel, { color: "#757575" }]}
                >
                  Actual
                </ThemedText>
              </View>
              <View style={styles.chartLegendItem}>
                <View
                  style={[
                    styles.chartLegendBox,
                    {
                      backgroundColor: `${accentColor}44`,
                      borderWidth: 1,
                      borderColor: accentColor,
                    },
                  ]}
                />
                <ThemedText
                  style={[styles.chartLegendLabel, { color: "#757575" }]}
                >
                  Forecast
                </ThemedText>
              </View>
            </View>
          </ThemedView>

          {/* Category Breakdown Forecast */}
          <ThemedView style={styles.categoryCard}>
            <View style={styles.categoryCardHeader}>
              <ThemedText
                type="defaultSemiBold"
                style={styles.categoryCardTitle}
              >
                Category Projections
              </ThemedText>
              <ThemedText
                style={[styles.categoryCardSubtitle, { color: "#757575" }]}
              >
                Full-year estimates based on 6-month trend
              </ThemedText>
            </View>
            {CATEGORY_FORECAST.map((c, i) => (
              <ForecastCatRow key={i} item={c} />
            ))}
          </ThemedView>

          {/* Tips */}
          <View style={[styles.tipsCard, { backgroundColor: "#0D47A1" }]}>
            <ThemedText style={[styles.tipsTitle, { color: accentColor }]}>
              🔮 Maximise Your Deductions
            </ThemedText>
            {[
              "Capture all home-office receipts — you're 23% below category average.",
              "Travel logs strengthen your Section 11(a) claim. Log each trip.",
              'Review "Personal" spend — R2,550 may include deductible items.',
              "File before 31 Oct 2025 to avoid penalties.",
            ].map((tip, i) => (
              <View key={i} style={styles.tipRow}>
                <ThemedText style={[styles.tipBullet, { color: accentColor }]}>
                  •
                </ThemedText>
                <ThemedText style={[styles.tipText, { color: "#FFFFFF" }]}>
                  {tip}
                </ThemedText>
              </View>
            ))}
          </View>

          {/* Disclaimer */}
          <View style={styles.disclaimerContainer}>
            <ThemedText style={[styles.disclaimerText, { color: "#757575" }]}>
              ⚠ This forecast is an estimate based on recorded expenses. Consult
              a registered tax practitioner for your final ITR12 submission.
              SARS tax brackets for 2024/25 applied.
            </ThemedText>
          </View>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 52,
    paddingBottom: 28,
    paddingHorizontal: 20,
  },
  backButton: {
    fontSize: 13,
    marginBottom: 10,
  },
  headerLabel: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "800",
    marginTop: 4,
    color: "#FFFFFF",
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 4,
  },
  scenarioContainer: {
    flexDirection: "row",
    backgroundColor: "#0D47A1",
    borderRadius: 10,
    padding: 3,
    marginTop: 16,
  },
  scenarioButton: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 8,
    alignItems: "center",
  },
  scenarioButtonText: {
    fontSize: 11,
    fontWeight: "600",
  },
  content: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -16,
    paddingTop: 20,
    paddingHorizontal: 16,
    paddingBottom: 30,
  },
  heroCard: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: "hidden",
  },
  heroCardTop: {
    padding: 20,
    alignItems: "center",
  },
  heroLabel: {
    fontSize: 13,
    fontWeight: "600",
  },
  heroAmount: {
    fontSize: 36,
    fontWeight: "900",
    marginTop: 4,
  },
  heroCaption: {
    fontSize: 11,
    marginTop: 4,
  },
  heroCardBottom: {
    backgroundColor: "#0D47A1",
    flexDirection: "row",
  },
  heroMetric: {
    flex: 1,
    padding: 14,
    alignItems: "center",
    borderRightWidth: 1,
  },
  heroMetricLabel: {
    fontSize: 10,
  },
  heroMetricValue: {
    fontSize: 15,
    marginTop: 4,
  },
  progressCard: {
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    marginBottom: 16,
  },
  progressCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  progressCardTitle: {
    fontSize: 13,
  },
  progressPercent: {
    fontSize: 13,
  },
  progressBar: {
    height: 10,
    borderRadius: 5,
    overflow: "hidden",
  },
  progressLegend: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  progressLegendText: {
    fontSize: 11,
  },
  chartCard: {
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    marginBottom: 16,
  },
  chartTitle: {
    fontSize: 13,
    marginBottom: 12,
  },
  chartBars: {
    flexDirection: "row",
    alignItems: "flex-end",
    height: 100,
    marginBottom: 8,
  },
  chartBar: {
    flex: 1,
    alignItems: "center",
  },
  barFill: {
    width: "75%",
    borderRadius: 3,
    borderWidth: 1,
  },
  barLabel: {
    fontSize: 8,
    color: "#757575",
    marginTop: 4,
  },
  chartLegend: {
    flexDirection: "row",
    gap: 16,
  },
  chartLegendItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  chartLegendBox: {
    width: 12,
    height: 8,
    borderRadius: 2,
    marginRight: 6,
  },
  chartLegendLabel: {
    fontSize: 10,
  },
  categoryCard: {
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    marginBottom: 16,
  },
  categoryCardHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  categoryCardTitle: {
    fontSize: 13,
  },
  categoryCardSubtitle: {
    fontSize: 11,
    marginTop: 2,
  },
  categoryRow: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  categoryRowHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  categoryDot: {
    width: 10,
    height: 10,
    borderRadius: 3,
    marginRight: 8,
  },
  categoryName: {
    fontSize: 12,
    fontWeight: "600",
    flex: 1,
  },
  categoryITR12: {
    fontSize: 11,
  },
  categoryRowValues: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  categoryYTD: {
    fontSize: 11,
  },
  categoryProjected: {
    fontSize: 12,
  },
  categoryProgressBar: {
    height: 5,
    backgroundColor: "#F5F5F5",
    borderRadius: 3,
  },
  tipsCard: {
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
  },
  tipsTitle: {
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 12,
  },
  tipRow: {
    flexDirection: "row",
    marginBottom: 10,
  },
  tipBullet: {
    fontSize: 13,
    marginRight: 8,
  },
  tipText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
  },
  disclaimerContainer: {
    marginHorizontal: 0,
    marginTop: 10,
  },
  disclaimerText: {
    fontSize: 10,
    textAlign: "center",
    lineHeight: 15,
  },
});
