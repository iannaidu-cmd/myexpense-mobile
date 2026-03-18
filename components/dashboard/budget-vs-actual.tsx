import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useThemeColor } from "@/hooks/use-theme-color";
import { useState } from "react";
import { ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";

interface BudgetVsActualScreenProps {
  navigation?: any;
}

interface BudgetItem {
  category: string;
  icon: string;
  budget: number;
  actual: number;
  deductible: boolean;
}

// ─── Mock Budget Data ────────────────────────────────────────────────────────
const BUDGETS: BudgetItem[] = [
  {
    category: "Travel & Transport",
    icon: "🚗",
    budget: 4000,
    actual: 4200,
    deductible: true,
  },
  {
    category: "Home Office",
    icon: "🏠",
    budget: 3500,
    actual: 3100,
    deductible: true,
  },
  {
    category: "Equipment & Tools",
    icon: "🔧",
    budget: 2000,
    actual: 2800,
    deductible: true,
  },
  {
    category: "Meals & Entertain.",
    icon: "🍽",
    budget: 2000,
    actual: 1950,
    deductible: true,
  },
  {
    category: "Software & Subscr.",
    icon: "💻",
    budget: 1500,
    actual: 1640,
    deductible: true,
  },
  {
    category: "Professional Fees",
    icon: "📋",
    budget: 1500,
    actual: 1200,
    deductible: true,
  },
  {
    category: "Utilities",
    icon: "⚡",
    budget: 1000,
    actual: 980,
    deductible: true,
  },
  {
    category: "Personal / Other",
    icon: "👤",
    budget: 2000,
    actual: 2550,
    deductible: false,
  },
];

const TOTAL_BUDGET = BUDGETS.reduce((s, b) => s + b.budget, 0);
const TOTAL_ACTUAL = BUDGETS.reduce((s, b) => s + b.actual, 0);
const OVER_BUDGET = BUDGETS.filter((b) => b.actual > b.budget);

// ─── Budget Row Component ───────────────────────────────────────────────────
interface BudgetRowProps {
  item: BudgetItem;
}

function BudgetRow({ item }: BudgetRowProps) {
  const borderColor = "#E0E0E0";
  const over = item.actual > item.budget;
  const pct = Math.min((item.actual / item.budget) * 100, 100);
  const diff = item.actual - item.budget;
  const barColor = over
    ? "#E74C3C"
    : item.actual / item.budget > 0.85
      ? "#F39C12"
      : "#27AE60";

  return (
    <View style={[styles.budgetRow, { borderBottomColor: borderColor }]}>
      <View style={styles.budgetRowHeader}>
        <ThemedText style={styles.budgetIcon}>{item.icon}</ThemedText>
        <View style={styles.budgetInfo}>
          <ThemedText type="defaultSemiBold" style={styles.budgetCategory}>
            {item.category}
          </ThemedText>
          <ThemedText style={[styles.budgetBudgetLabel, { color: "#757575" }]}>
            Budget: R {item.budget.toLocaleString()}
          </ThemedText>
        </View>
        <View style={styles.budgetAmount}>
          <ThemedText
            style={[
              styles.budgetActual,
              { color: over ? "#E74C3C" : "#1565C0" },
            ]}
          >
            R {item.actual.toLocaleString()}
          </ThemedText>
          {over ? (
            <ThemedText style={[styles.budgetDiff, { color: "#E74C3C" }]}>
              +R {Math.abs(diff).toLocaleString()} over
            </ThemedText>
          ) : (
            <ThemedText style={[styles.budgetDiff, { color: "#27AE60" }]}>
              R {Math.abs(diff).toLocaleString()} left
            </ThemedText>
          )}
        </View>
      </View>
      {/* Progress Bar */}
      <View style={[styles.progressBar, { backgroundColor: "#F5F5F5" }]}>
        <View
          style={[
            styles.progressFill,
            { width: `${pct}%`, backgroundColor: barColor },
          ]}
        />
      </View>
      <ThemedText style={[styles.progressLabel, { color: "#757575" }]}>
        {pct.toFixed(0)}% of budget used
      </ThemedText>
    </View>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────
export function BudgetVsActualScreen({
  navigation,
}: BudgetVsActualScreenProps) {
  const [filterMode, setFilterMode] = useState("All");
  const filters = ["All", "Over Budget", "Under Budget"];

  const bgColor = useThemeColor({}, "background");
  const borderColor = "#E0E0E0";
  const headerBg = "#1565C0";
  const accentColor = "#0288D1";

  const filtered = BUDGETS.filter((b) => {
    if (filterMode === "Over Budget") return b.actual > b.budget;
    if (filterMode === "Under Budget") return b.actual <= b.budget;
    return true;
  });

  const totalDiff = TOTAL_ACTUAL - TOTAL_BUDGET;
  const overallPct = ((TOTAL_ACTUAL / TOTAL_BUDGET) * 100).toFixed(1);

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
            BUDGET VS ACTUAL
          </ThemedText>
          <ThemedText style={styles.headerTitle}>
            Monthly Budget Tracker
          </ThemedText>
          <ThemedText style={[styles.headerSubtitle, { color: "#757575" }]}>
            March 2025
          </ThemedText>
        </View>

        {/* Content */}
        <View style={[styles.content, { backgroundColor: bgColor }]}>
          {/* Over-budget alert */}
          {OVER_BUDGET.length > 0 && (
            <View style={[styles.alertCard, { borderLeftColor: "#E74C3C" }]}>
              <ThemedText style={styles.alertIcon}>⚠️</ThemedText>
              <View style={styles.alertContent}>
                <ThemedText style={[styles.alertTitle, { color: "#E74C3C" }]}>
                  {OVER_BUDGET.length} Categories Over Budget
                </ThemedText>
                <ThemedText style={[styles.alertText, { color: "#757575" }]}>
                  {OVER_BUDGET.map((b) => b.category.split(" ")[0]).join(", ")}
                </ThemedText>
              </View>
            </View>
          )}

          {/* Summary Cards */}
          <View style={styles.summaryRow}>
            <View style={[styles.summaryCard, { backgroundColor: headerBg }]}>
              <ThemedText style={[styles.summaryLabel, { color: "#757575" }]}>
                Total Budget
              </ThemedText>
              <ThemedText style={[styles.summaryValue, { color: "#FFFFFF" }]}>
                R {TOTAL_BUDGET.toLocaleString()}
              </ThemedText>
            </View>
            <View
              style={[
                styles.summaryCard,
                {
                  backgroundColor: totalDiff > 0 ? "#FEF0EF" : "#E8F8F3",
                  borderColor: totalDiff > 0 ? "#E74C3C" : "#27AE60",
                  borderWidth: 1,
                },
              ]}
            >
              <ThemedText style={[styles.summaryLabel, { color: "#757575" }]}>
                Total Actual
              </ThemedText>
              <ThemedText
                style={[
                  styles.summaryValue,
                  {
                    color: totalDiff > 0 ? "#E74C3C" : "#27AE60",
                  },
                ]}
              >
                R {TOTAL_ACTUAL.toLocaleString()}
              </ThemedText>
            </View>
          </View>

          {/* Overall Progress */}
          <ThemedView style={[styles.progressCard, { borderColor }]}>
            <View style={styles.progressCardHeader}>
              <ThemedText style={styles.progressCardTitle}>
                Overall Budget Usage
              </ThemedText>
              <ThemedText
                style={[
                  styles.progressCardPercent,
                  {
                    color: totalDiff > 0 ? "#E74C3C" : "#27AE60",
                  },
                ]}
              >
                {overallPct}%
              </ThemedText>
            </View>
            <View
              style={[styles.progressBarLarge, { backgroundColor: "#F5F5F5" }]}
            >
              <View
                style={[
                  styles.progressFillLarge,
                  {
                    width: `${Math.min(parseFloat(overallPct), 100)}%`,
                    backgroundColor: totalDiff > 0 ? "#E74C3C" : accentColor,
                  },
                ]}
              />
            </View>
            <View style={styles.progressLegend}>
              <ThemedText
                style={[styles.progressLegendMin, { color: "#757575" }]}
              >
                R 0
              </ThemedText>
              <ThemedText
                style={[
                  styles.progressLegendDiff,
                  {
                    color: totalDiff > 0 ? "#E74C3C" : "#27AE60",
                  },
                ]}
              >
                {totalDiff > 0
                  ? `R ${totalDiff.toLocaleString()} over`
                  : `R ${Math.abs(totalDiff).toLocaleString()} under`}
              </ThemedText>
              <ThemedText
                style={[styles.progressLegendMax, { color: "#757575" }]}
              >
                R {TOTAL_BUDGET.toLocaleString()}
              </ThemedText>
            </View>
          </ThemedView>

          {/* Filter Tabs */}
          <View style={styles.filterContainer}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.filterScroll}
            >
              <View style={styles.filterRow}>
                {filters.map((f) => (
                  <TouchableOpacity
                    key={f}
                    onPress={() => setFilterMode(f)}
                    style={[
                      styles.filterButton,
                      {
                        backgroundColor:
                          filterMode === f ? headerBg : "#F5F5F5",
                      },
                    ]}
                  >
                    <ThemedText
                      style={[
                        styles.filterButtonText,
                        {
                          color: filterMode === f ? "#FFFFFF" : "#757575",
                        },
                      ]}
                    >
                      {f}
                      {f === "Over Budget" ? ` (${OVER_BUDGET.length})` : ""}
                    </ThemedText>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>

          {/* Budget Rows */}
          <View style={[styles.budgetList, { borderColor }]}>
            {filtered.map((item, i) => (
              <BudgetRow key={i} item={item} />
            ))}
          </View>

          {/* Adjust Budgets CTA */}
          <TouchableOpacity
            style={[styles.ctaButton, { backgroundColor: accentColor }]}
          >
            <ThemedText style={styles.ctaButtonText}>
              ✏️ Adjust Monthly Budgets
            </ThemedText>
          </TouchableOpacity>
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
  content: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -16,
    paddingTop: 20,
    paddingHorizontal: 16,
    paddingBottom: 30,
  },
  alertCard: {
    marginBottom: 16,
    backgroundColor: "#FEF0EF",
    borderRadius: 12,
    padding: 14,
    borderLeftWidth: 4,
    flexDirection: "row",
    alignItems: "center",
  },
  alertIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 13,
    fontWeight: "700",
  },
  alertText: {
    fontSize: 11,
    marginTop: 2,
  },
  summaryRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 16,
  },
  summaryCard: {
    flex: 1,
    borderRadius: 14,
    padding: 14,
  },
  summaryLabel: {
    fontSize: 11,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: "800",
    marginTop: 4,
  },
  progressCard: {
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  progressCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  progressCardTitle: {
    fontSize: 13,
    fontWeight: "700",
  },
  progressCardPercent: {
    fontSize: 13,
    fontWeight: "700",
  },
  progressBarLarge: {
    height: 10,
    borderRadius: 5,
    overflow: "hidden",
  },
  progressFillLarge: {
    height: 10,
    borderRadius: 5,
  },
  progressLegend: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  progressLegendMin: {
    fontSize: 11,
  },
  progressLegendDiff: {
    fontSize: 11,
    fontWeight: "600",
  },
  progressLegendMax: {
    fontSize: 11,
  },
  filterContainer: {
    paddingHorizontal: 0,
    marginBottom: 8,
  },
  filterScroll: {
    flexGrow: 0,
  },
  filterRow: {
    flexDirection: "row",
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
  },
  filterButtonText: {
    fontSize: 12,
    fontWeight: "600",
  },
  budgetList: {
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 1,
    marginBottom: 16,
  },
  budgetRow: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  budgetRowHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  budgetIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  budgetInfo: {
    flex: 1,
  },
  budgetCategory: {
    fontSize: 13,
  },
  budgetBudgetLabel: {
    fontSize: 11,
    marginTop: 2,
  },
  budgetAmount: {
    alignItems: "flex-end",
  },
  budgetActual: {
    fontSize: 13,
    fontWeight: "700",
  },
  budgetDiff: {
    fontSize: 11,
    fontWeight: "600",
    marginTop: 2,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: 6,
    borderRadius: 3,
  },
  progressLabel: {
    fontSize: 10,
    marginTop: 4,
    textAlign: "right",
  },
  ctaButton: {
    borderRadius: 14,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  ctaButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
});
