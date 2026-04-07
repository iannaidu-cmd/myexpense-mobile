import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useThemeColor } from "@/hooks/use-theme-color";
import { colour } from "@/tokens";
import { useState } from "react";
import { ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";

interface ReportHomeScreenProps {
  navigation?: any;
}

interface ReportItem {
  icon: string;
  title: string;
  description: string;
  badge?: string;
  screen: string;
}

// ─── Metric Card Component ───────────────────────────────────────────────────
interface MetricCardProps {
  label: string;
  value: string;
  sub?: string;
  color?: string;
  onPress?: () => void;
}

function MetricCard({ label, value, sub, color, onPress }: MetricCardProps) {
  const textColor = useThemeColor({}, "text");
  const backgroundColor = useThemeColor({}, "background");
  const borderColor = colour.border;

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.metricCard,
        {
          backgroundColor,
          borderColor,
          shadowColor: textColor,
        },
      ]}
    >
      <ThemedText style={[styles.metricLabel, { color: "#757575" }]}>
        {label}
      </ThemedText>
      <ThemedText style={[styles.metricValue, { color: color || textColor }]}>
        {value}
      </ThemedText>
      {sub ? (
        <ThemedText style={[styles.metricSub, { color: "#757575" }]}>
          {sub}
        </ThemedText>
      ) : null}
    </TouchableOpacity>
  );
}

// ─── Report Nav Card Component ───────────────────────────────────────────────
interface ReportNavCardProps {
  icon: string;
  title: string;
  description: string;
  badge?: string;
  onPress?: () => void;
}

function ReportNavCard({
  icon,
  title,
  description,
  badge,
  onPress,
}: ReportNavCardProps) {
  const backgroundColor = useThemeColor({}, "background");
  const borderColor = colour.border;
  const textColor = useThemeColor({}, "text");

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.reportNavCard,
        {
          backgroundColor,
          borderColor,
          shadowColor: textColor,
        },
      ]}
    >
      <View style={[styles.iconBox, { backgroundColor: "#F5F5F5" }]}>
        <ThemedText style={styles.navIcon}>{icon}</ThemedText>
      </View>
      <View style={styles.navContent}>
        <ThemedText type="defaultSemiBold" style={styles.navTitle}>
          {title}
        </ThemedText>
        <ThemedText style={[styles.navDescription, { color: "#757575" }]}>
          {description}
        </ThemedText>
      </View>
      {badge ? (
        <View style={[styles.badge, { backgroundColor: "#0288D1" }]}>
          <ThemedText style={styles.badgeText}>{badge}</ThemedText>
        </View>
      ) : null}
      <ThemedText style={styles.navArrow}>›</ThemedText>
    </TouchableOpacity>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────
export function ReportHomeScreen({ navigation }: ReportHomeScreenProps) {
  const [period, setPeriod] = useState("This month");
  const periods = ["This month", "This quarter", "This year"];

  const primaryColor = useThemeColor({}, "text");
  const bgColor = useThemeColor({}, "background");
  const headerBg = "#1565C0";
  const accentColor = "#0288D1";

  const summary = {
    totalExpenses: "R 18 420",
    taxDeductible: "R 11 750",
    deductionRate: "63.8%",
    pendingReceipts: "4",
  };

  const reports: ReportItem[] = [
    {
      icon: "🏷",
      title: "Spending by category",
      description: "ITR12 category breakdown",
      screen: "SpendingByCategory",
    },
    {
      icon: "📈",
      title: "Monthly trend",
      description: "Month-by-month spending patterns",
      screen: "MonthlyTrend",
    },
    {
      icon: "🎯",
      title: "Budget vs actual",
      description: "Track spend against your budget",
      badge: "2 over",
      screen: "BudgetVsActual",
    },
    {
      icon: "🏪",
      title: "Top vendors",
      description: "Your most frequent suppliers",
      screen: "TopVendors",
    },
    {
      icon: "🔮",
      title: "Deduction forecast",
      description: "Projected SARS ITR12 deductions",
      badge: "New",
      screen: "DeductionForecast",
    },
  ];

  return (
    <ThemedView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: headerBg }]}>
          <View style={styles.headerTop}>
            <View>
              <ThemedText style={[styles.headerLabel, { color: accentColor }]}>
                REPORTS & ANALYTICS
              </ThemedText>
              <ThemedText style={styles.headerTitle}>
                Financial Overview
              </ThemedText>
            </View>
            <TouchableOpacity
              style={[styles.exportButton, { backgroundColor: "#1976D2" }]}
            >
              <ThemedText style={styles.exportButtonText}>Export</ThemedText>
            </TouchableOpacity>
          </View>

          {/* Period Selector */}
          <View style={[styles.periodSelector, { backgroundColor: "#0D47A1" }]}>
            {periods.map((p) => (
              <TouchableOpacity
                key={p}
                onPress={() => setPeriod(p)}
                style={[
                  styles.periodButton,
                  {
                    backgroundColor: period === p ? accentColor : "transparent",
                  },
                ]}
              >
                <ThemedText
                  style={[
                    styles.periodButtonText,
                    {
                      color: period === p ? "#FFFFFF" : "#757575",
                    },
                  ]}
                >
                  {p}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Content */}
        <View style={[styles.content, { backgroundColor: bgColor }]}>
          {/* Summary Metrics */}
          <ThemedText style={styles.sectionTitle}>
            Summary — {period}
          </ThemedText>
          <View style={styles.metricsRow}>
            <MetricCard
              label="Total expenses"
              value={summary.totalExpenses}
              sub="All categories"
              color={headerBg}
            />
            <MetricCard
              label="Tax deductible"
              value={summary.taxDeductible}
              sub="ITR12 eligible"
              color="#27AE60"
            />
          </View>
          <View style={styles.metricsRow}>
            <MetricCard
              label="Deduction rate"
              value={summary.deductionRate}
              sub="Of total spend"
              color={accentColor}
            />
            <MetricCard
              label="Pending receipts"
              value={summary.pendingReceipts}
              sub="Needs attention"
              color="#F39C12"
            />
          </View>

          {/* ITR12 Progress */}
          <ThemedView style={styles.progressCard}>
            <View style={styles.progressHeader}>
              <ThemedText type="defaultSemiBold">ITR12 Readiness</ThemedText>
              <ThemedText
                style={[styles.progressPercent, { color: accentColor }]}
              >
                78%
              </ThemedText>
            </View>
            <View style={[styles.progressBar, { backgroundColor: "#F5F5F5" }]}>
              <View
                style={[
                  styles.progressFill,
                  { width: "78%", backgroundColor: accentColor },
                ]}
              />
            </View>
            <ThemedText style={[styles.progressNote, { color: "#757575" }]}>
              4 receipts unmatched · 2 categories need review
            </ThemedText>
          </ThemedView>

          {/* Detailed Reports */}
          <ThemedText style={styles.sectionTitle}>Detailed Reports</ThemedText>
          {reports.map((r) => (
            <ReportNavCard
              key={r.screen}
              icon={r.icon}
              title={r.title}
              description={r.description}
              badge={r.badge}
              onPress={() => navigation?.navigate(r.screen)}
            />
          ))}

          {/* Tax Year Footer */}
          <View style={[styles.taxYearCard, { backgroundColor: headerBg }]}>
            <ThemedText style={styles.taxYearIcon}>🗓</ThemedText>
            <View style={styles.taxYearContent}>
              <ThemedText style={styles.taxYearTitle}>
                Tax Year 2024 / 2025
              </ThemedText>
              <ThemedText
                style={[styles.taxYearSubtitle, { color: "#757575" }]}
              >
                Filing deadline: 31 October 2025
              </ThemedText>
            </View>
            <TouchableOpacity
              style={[styles.prepareButton, { backgroundColor: accentColor }]}
            >
              <ThemedText style={styles.prepareButtonText}>Prepare</ThemedText>
            </TouchableOpacity>
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
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 18,
  },
  headerLabel: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "800",
    marginTop: 4,
    color: "#FFFFFF",
  },
  exportButton: {
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  exportButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  periodSelector: {
    flexDirection: "row",
    borderRadius: 10,
    padding: 3,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 8,
    alignItems: "center",
  },
  periodButtonText: {
    fontSize: 11,
    fontWeight: "600",
  },
  content: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -16,
    paddingTop: 20,
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 10,
  },
  metricsRow: {
    flexDirection: "row",
    marginHorizontal: -5,
    marginBottom: 6,
  },
  metricCard: {
    flex: 1,
    borderRadius: 14,
    padding: 14,
    margin: 5,
    borderWidth: 1,
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 2,
  },
  metricLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: "800",
  },
  metricSub: {
    fontSize: 11,
    marginTop: 2,
  },
  progressCard: {
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  progressPercent: {
    fontSize: 13,
    fontWeight: "700",
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: 8,
    borderRadius: 4,
  },
  progressNote: {
    fontSize: 11,
    marginTop: 8,
  },
  reportNavCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  navIcon: {
    fontSize: 22,
  },
  navContent: {
    flex: 1,
  },
  navTitle: {
    fontSize: 14,
  },
  navDescription: {
    fontSize: 12,
    marginTop: 2,
  },
  badge: {
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginRight: 8,
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "700",
  },
  navArrow: {
    fontSize: 18,
    fontWeight: "300",
    color: "#1976D2",
  },
  taxYearCard: {
    borderRadius: 14,
    padding: 16,
    marginTop: 6,
    flexDirection: "row",
    alignItems: "center",
  },
  taxYearIcon: {
    fontSize: 22,
    marginRight: 12,
  },
  taxYearContent: {
    flex: 1,
  },
  taxYearTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  taxYearSubtitle: {
    fontSize: 11,
    marginTop: 2,
  },
  prepareButton: {
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  prepareButtonText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
