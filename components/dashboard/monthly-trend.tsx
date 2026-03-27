import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useThemeColor } from "@/hooks/use-theme-color";
import { colour } from "@/tokens";
import { useState } from "react";
import {
    Dimensions,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
} from "react-native";

const { width } = Dimensions.get("window");
const CHART_WIDTH = width - 64;

interface MonthlyTrendScreenProps {
  navigation?: any;
}

interface MonthData {
  month: string;
  expenses: number;
  deductible: number;
  income: number;
}

interface MetricOption {
  key: "expenses" | "deductible" | "income";
  label: string;
  color: string;
}

// ─── Mock Monthly Data ───────────────────────────────────────────────────────
const MONTHLY: MonthData[] = [
  { month: "Oct", expenses: 11200, deductible: 7100, income: 28000 },
  { month: "Nov", expenses: 13800, deductible: 8900, income: 31000 },
  { month: "Dec", expenses: 9400, deductible: 5600, income: 22000 },
  { month: "Jan", expenses: 15200, deductible: 9800, income: 34000 },
  { month: "Feb", expenses: 12600, deductible: 8200, income: 29000 },
  { month: "Mar", expenses: 18420, deductible: 11750, income: 38000 },
];

const MAX_VAL = Math.max(...MONTHLY.map((m) => Math.max(m.expenses, m.income)));

// ─── Bar Chart Component ─────────────────────────────────────────────────────
interface BarChartProps {
  data: MonthData[];
  metric: "expenses" | "deductible" | "income";
  color: string;
}

function BarChart({ data, metric, color }: BarChartProps) {
  const BAR_HEIGHT = 160;
  const bgColor = useThemeColor({}, "background");

  return (
    <View style={[styles.barChartContainer, { height: BAR_HEIGHT + 30 }]}>
      {data.map((item, i) => {
        const val = item[metric];
        const barH = Math.max((val / MAX_VAL) * BAR_HEIGHT, 4);
        const isLast = i === data.length - 1;

        return (
          <View key={i} style={styles.barColumn}>
            {isLast && (
              <View style={[styles.barLabel, { backgroundColor: color }]}>
                <ThemedText style={styles.barLabelText}>
                  R{(val / 1000).toFixed(1)}k
                </ThemedText>
              </View>
            )}
            <View
              style={[
                styles.bar,
                {
                  height: barH,
                  backgroundColor: isLast ? color : `${color}60`,
                },
              ]}
            />
            <ThemedText style={styles.barMonth}>{item.month}</ThemedText>
          </View>
        );
      })}
    </View>
  );
}

// ─── Insight Row Component ───────────────────────────────────────────────────
interface InsightRowProps {
  icon: string;
  label: string;
  value: string;
  delta: string;
  positive: boolean;
}

function InsightRow({ icon, label, value, delta, positive }: InsightRowProps) {
  const borderColor = colour.border;

  return (
    <View style={[styles.insightRow, { borderBottomColor: borderColor }]}>
      <ThemedText style={styles.insightIcon}>{icon}</ThemedText>
      <View style={styles.insightContent}>
        <ThemedText type="defaultSemiBold" style={styles.insightLabel}>
          {label}
        </ThemedText>
        <ThemedText style={[styles.insightValue, { color: "#757575" }]}>
          {value}
        </ThemedText>
      </View>
      <View
        style={[
          styles.insightBadge,
          {
            backgroundColor: positive ? "#E8F8F3" : "#FEF0EF",
          },
        ]}
      >
        <ThemedText
          style={[
            styles.insightDelta,
            {
              color: positive ? "#27AE60" : "#E74C3C",
            },
          ]}
        >
          {delta}
        </ThemedText>
      </View>
    </View>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────
export function MonthlyTrendScreen({ navigation }: MonthlyTrendScreenProps) {
  const [metric, setMetric] = useState<"expenses" | "deductible" | "income">(
    "expenses",
  );

  const bgColor = useThemeColor({}, "background");
  const borderColor = colour.border;
  const headerBg = "#1565C0";
  const accentColor = "#0288D1";

  const metrics: MetricOption[] = [
    { key: "expenses", label: "Expenses", color: headerBg },
    { key: "deductible", label: "Deductible", color: accentColor },
    { key: "income", label: "Income", color: "#27AE60" },
  ];

  const active = metrics.find((m) => m.key === metric)!;

  const avgExpenses = (
    MONTHLY.reduce((s, m) => s + m.expenses, 0) / MONTHLY.length
  ).toFixed(0);

  const latestVsPrev = (
    ((MONTHLY[5].expenses - MONTHLY[4].expenses) / MONTHLY[4].expenses) *
    100
  ).toFixed(1);

  const deductRate = (
    (MONTHLY[5].deductible / MONTHLY[5].expenses) *
    100
  ).toFixed(1);

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
            MONTHLY TREND
          </ThemedText>
          <ThemedText style={styles.headerTitle}>6-Month Overview</ThemedText>
          <ThemedText style={[styles.headerSubtitle, { color: "#757575" }]}>
            Oct 2024 – Mar 2025
          </ThemedText>

          {/* Metric Tabs */}
          <View style={[styles.metricTabs, { backgroundColor: "#0D47A1" }]}>
            {metrics.map((m) => (
              <TouchableOpacity
                key={m.key}
                onPress={() => setMetric(m.key)}
                style={[
                  styles.metricTab,
                  {
                    backgroundColor: metric === m.key ? m.color : "transparent",
                  },
                ]}
              >
                <ThemedText
                  style={[
                    styles.metricTabText,
                    {
                      color: metric === m.key ? "#FFFFFF" : "#757575",
                    },
                  ]}
                >
                  {m.label}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Content */}
        <View style={[styles.content, { backgroundColor: bgColor }]}>
          {/* Bar Chart */}
          <ThemedView style={[styles.chartCard, { borderColor }]}>
            <View style={styles.chartHeader}>
              <ThemedText style={styles.chartTitle}>
                {active.label} — Monthly
              </ThemedText>
              <TouchableOpacity
                style={[styles.timeframeButton, { backgroundColor: "#F5F5F5" }]}
              >
                <ThemedText
                  style={[styles.timeframeText, { color: "#757575" }]}
                >
                  6 months ▾
                </ThemedText>
              </TouchableOpacity>
            </View>
            <BarChart data={MONTHLY} metric={metric} color={active.color} />
          </ThemedView>

          {/* Quick Stats */}
          <View style={styles.quickStatsRow}>
            {[
              {
                label: "Monthly Avg",
                value: `R ${parseInt(avgExpenses).toLocaleString()}`,
                color: headerBg,
              },
              {
                label: "This Month",
                value: `R ${MONTHLY[5].expenses.toLocaleString()}`,
                color: accentColor,
              },
              {
                label: "Deduct. Rate",
                value: `${deductRate}%`,
                color: "#27AE60",
              },
            ].map((s, i) => (
              <ThemedView key={i} style={[styles.statCard, { borderColor }]}>
                <ThemedText style={[styles.statLabel, { color: "#757575" }]}>
                  {s.label}
                </ThemedText>
                <ThemedText style={[styles.statValue, { color: s.color }]}>
                  {s.value}
                </ThemedText>
              </ThemedView>
            ))}
          </View>

          {/* Month-by-Month Table */}
          <ThemedView style={[styles.tableCard, { borderColor }]}>
            {/* Table Header */}
            <View style={[styles.tableHeader, { backgroundColor: "#F5F5F5" }]}>
              {["Month", "Expenses", "Deductible", "Income"].map((h) => (
                <ThemedText
                  key={h}
                  style={[
                    styles.tableHeaderCell,
                    {
                      textAlign: h === "Month" ? "left" : "right",
                    },
                  ]}
                >
                  {h}
                </ThemedText>
              ))}
            </View>

            {/* Table Rows */}
            {MONTHLY.map((row, i) => {
              const isLatest = i === MONTHLY.length - 1;
              return (
                <View
                  key={i}
                  style={[
                    styles.tableRow,
                    {
                      backgroundColor: isLatest ? "#F5F5F5" : bgColor,
                      borderTopColor: borderColor,
                    },
                  ]}
                >
                  <ThemedText
                    style={[
                      styles.tableCell,
                      {
                        fontWeight: isLatest ? "700" : "500",
                      },
                    ]}
                  >
                    {row.month}
                    {isLatest ? " ←" : ""}
                  </ThemedText>
                  <ThemedText
                    style={[
                      styles.tableCell,
                      styles.tableCellRight,
                      { color: headerBg },
                    ]}
                  >
                    R{(row.expenses / 1000).toFixed(1)}k
                  </ThemedText>
                  <ThemedText
                    style={[
                      styles.tableCell,
                      styles.tableCellRight,
                      { color: "#27AE60" },
                    ]}
                  >
                    R{(row.deductible / 1000).toFixed(1)}k
                  </ThemedText>
                  <ThemedText
                    style={[
                      styles.tableCell,
                      styles.tableCellRight,
                      { color: accentColor },
                    ]}
                  >
                    R{(row.income / 1000).toFixed(1)}k
                  </ThemedText>
                </View>
              );
            })}
          </ThemedView>

          {/* Insights */}
          <ThemedView style={[styles.insightsCard, { borderColor }]}>
            <View
              style={[
                styles.insightsHeader,
                { borderBottomColor: borderColor },
              ]}
            >
              <ThemedText type="defaultSemiBold" style={styles.insightsTitle}>
                Insights
              </ThemedText>
            </View>
            <InsightRow
              icon="📈"
              label="Spend vs Last Month"
              value="Expenses increased in March"
              delta={`+${latestVsPrev}%`}
              positive={false}
            />
            <InsightRow
              icon="✅"
              label="Deduction Consistency"
              value="Avg 62% deductibility maintained"
              delta="+2.1%"
              positive={true}
            />
            <InsightRow
              icon="💡"
              label="Highest Month"
              value="January — R15,200 total spend"
              delta="Jan"
              positive={false}
            />
            <View style={{ borderBottomWidth: 0 }}>
              <InsightRow
                icon="🎯"
                label="On-Track for Tax Year"
                value="Projected R138k total deductions"
                delta="On Track"
                positive={true}
              />
            </View>
          </ThemedView>
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
  metricTabs: {
    flexDirection: "row",
    borderRadius: 10,
    padding: 3,
    marginTop: 16,
  },
  metricTab: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 8,
    alignItems: "center",
  },
  metricTabText: {
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
  chartCard: {
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  chartHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
    alignItems: "center",
  },
  chartTitle: {
    fontSize: 13,
    fontWeight: "700",
  },
  timeframeButton: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  timeframeText: {
    fontSize: 11,
  },
  barChartContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
  },
  barColumn: {
    flex: 1,
    alignItems: "center",
  },
  barLabel: {
    position: "absolute",
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginBottom: 8,
  },
  barLabelText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "700",
  },
  bar: {
    width: 20,
    backgroundColor: "#1565C0",
    borderRadius: 4,
    marginBottom: 6,
  },
  barMonth: {
    fontSize: 9,
    color: "#757575",
  },
  quickStatsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    alignItems: "center",
  },
  statLabel: {
    fontSize: 10,
    textAlign: "center",
  },
  statValue: {
    fontSize: 14,
    fontWeight: "800",
    marginTop: 4,
  },
  tableCard: {
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 1,
    marginBottom: 16,
  },
  tableHeader: {
    flexDirection: "row",
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  tableHeaderCell: {
    flex: 1,
    fontSize: 10,
    fontWeight: "700",
    color: "#757575",
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 11,
    paddingHorizontal: 16,
    borderTopWidth: 1,
  },
  tableCell: {
    flex: 1,
    fontSize: 12,
  },
  tableCellRight: {
    textAlign: "right",
  },
  insightsCard: {
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 1,
  },
  insightsHeader: {
    padding: 16,
    borderBottomWidth: 1,
  },
  insightsTitle: {
    fontSize: 13,
  },
  insightRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  insightIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  insightContent: {
    flex: 1,
  },
  insightLabel: {
    fontSize: 13,
  },
  insightValue: {
    fontSize: 11,
    marginTop: 2,
  },
  insightBadge: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  insightDelta: {
    fontSize: 11,
    fontWeight: "700",
  },
});
