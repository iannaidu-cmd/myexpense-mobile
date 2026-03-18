import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useState } from "react";
import { ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import type { Month } from "./types";

const MONTHS: Month[] = [
  { month: "Mar", year: 2026, expenses: 18, amount: 18640, saved: 4280 },
  { month: "Feb", year: 2026, expenses: 22, amount: 24180, saved: 5200 },
  { month: "Jan", year: 2026, expenses: 15, amount: 13220, saved: 2980 },
  { month: "Dec", year: 2025, expenses: 29, amount: 31500, saved: 7100 },
  { month: "Nov", year: 2025, expenses: 18, amount: 16800, saved: 3780 },
  { month: "Oct", year: 2025, expenses: 21, amount: 20400, saved: 4590 },
  { month: "Sep", year: 2025, expenses: 17, amount: 15900, saved: 3580 },
  { month: "Aug", year: 2025, expenses: 24, amount: 22700, saved: 5100 },
  { month: "Jul", year: 2025, expenses: 19, amount: 18200, saved: 4100 },
  { month: "Jun", year: 2025, expenses: 13, amount: 11800, saved: 2660 },
  { month: "May", year: 2025, expenses: 20, amount: 19400, saved: 4370 },
  { month: "Apr", year: 2025, expenses: 16, amount: 14600, saved: 3290 },
];

interface PeriodSelectorProps {
  onClose: () => void;
}

export function PeriodSelector({ onClose }: PeriodSelectorProps) {
  const [selectedMonth, setSelectedMonth] = useState(0);
  const [view, setView] = useState<"month" | "year" | "custom">("month");

  const selected = MONTHS[selectedMonth];
  const maxAmount = Math.max(...MONTHS.map((m) => m.amount));

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText style={styles.title}>Period Selector</ThemedText>
        <ThemedText style={styles.subtitle}>
          Switch between tax months or years to review your expenses.
        </ThemedText>
      </View>

      <ScrollView
        style={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* View toggle */}
        <View style={styles.viewToggle}>
          {["month", "year", "custom"].map((v) => (
            <TouchableOpacity
              key={v}
              style={[
                styles.viewTabButton,
                view === v && styles.viewTabButtonActive,
              ]}
              onPress={() => setView(v as "month" | "year" | "custom")}
            >
              <ThemedText
                style={[
                  styles.viewTabText,
                  view === v && styles.viewTabTextActive,
                ]}
              >
                {v === "month"
                  ? "Monthly"
                  : v === "year"
                    ? "Tax Year"
                    : "Custom"}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </View>

        {/* Summary card */}
        <View style={styles.summaryCard}>
          <ThemedText style={styles.summaryLabel}>SELECTED PERIOD</ThemedText>
          <ThemedText style={styles.summaryTitle}>
            {selected.month} {selected.year}
          </ThemedText>

          {/* Stats row */}
          <View style={styles.statsRow}>
            <View style={styles.statCol}>
              <ThemedText style={styles.statLabel}>Total Expenses</ThemedText>
              <ThemedText style={styles.statValue}>
                R {selected.amount.toLocaleString()}
              </ThemedText>
            </View>
            <View style={[styles.statCol, styles.statColBordered]}>
              <ThemedText style={styles.statLabel}>Tax Saved</ThemedText>
              <ThemedText style={styles.statValue}>
                R {selected.saved.toLocaleString()}
              </ThemedText>
            </View>
            <View style={[styles.statCol, styles.statColBordered]}>
              <ThemedText style={styles.statLabel}>Receipts</ThemedText>
              <ThemedText style={styles.statValue}>
                {selected.expenses}
              </ThemedText>
            </View>
          </View>
        </View>

        {/* Monthly view */}
        {view === "month" && (
          <View style={styles.monthSection}>
            <ThemedText style={styles.sectionLabel}>
              2025 – 2026 TAX YEAR
            </ThemedText>

            {/* Mini bar chart */}
            <View style={styles.chartContainer}>
              <ThemedText style={styles.chartTitle}>
                Monthly spend overview
              </ThemedText>
              <View style={styles.chart}>
                {MONTHS.slice()
                  .reverse()
                  .map((m, i) => {
                    const height = (m.amount / maxAmount) * 60;
                    const idx = MONTHS.length - 1 - i;
                    const isSelected = idx === selectedMonth;
                    return (
                      <TouchableOpacity
                        key={i}
                        style={styles.chartBar}
                        onPress={() => setSelectedMonth(idx)}
                      >
                        <View
                          style={[
                            styles.bar,
                            {
                              height,
                              backgroundColor: isSelected
                                ? "#0288D1"
                                : "rgba(21,101,192,0.12)",
                            },
                          ]}
                        />
                        <ThemedText
                          style={[
                            styles.barLabel,
                            isSelected && styles.barLabelSelected,
                          ]}
                        >
                          {m.month.slice(0, 1)}
                        </ThemedText>
                      </TouchableOpacity>
                    );
                  })}
              </View>
            </View>

            {/* Month list */}
            <View style={styles.monthList}>
              {MONTHS.map((m, i) => (
                <TouchableOpacity
                  key={i}
                  style={[
                    styles.monthItem,
                    selectedMonth === i && styles.monthItemSelected,
                  ]}
                  onPress={() => setSelectedMonth(i)}
                >
                  <View
                    style={[
                      styles.monthItemIcon,
                      selectedMonth === i && styles.monthItemIconSelected,
                    ]}
                  >
                    <ThemedText
                      style={[
                        styles.monthItemMonth,
                        selectedMonth === i && styles.monthItemMonthSelected,
                      ]}
                    >
                      {m.month}
                    </ThemedText>
                  </View>
                  <View style={styles.monthItemInfo}>
                    <ThemedText style={styles.monthItemYear}>
                      {m.year}
                    </ThemedText>
                    <ThemedText style={styles.monthItemStats}>
                      R {m.amount.toLocaleString()} • {m.expenses} receipts
                    </ThemedText>
                  </View>
                  <ThemedText style={styles.monthItemSaved}>
                    +R {m.saved.toLocaleString()}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    backgroundColor: "#0D47A1",
    paddingVertical: 28,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: "#fff",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 13,
    color: "rgba(255,255,255,0.55)",
    lineHeight: 1.6,
  },
  scrollContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  viewToggle: {
    flexDirection: "row",
    backgroundColor: "rgba(21,101,192,0.06)",
    borderRadius: 14,
    padding: 4,
    gap: 4,
    marginBottom: 16,
  },
  viewTabButton: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 11,
  },
  viewTabButtonActive: {
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  viewTabText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#757575",
    textAlign: "center",
  },
  viewTabTextActive: {
    color: "#1565C0",
  },
  summaryCard: {
    backgroundColor: "#0288D1",
    borderRadius: 20,
    padding: 18,
    marginBottom: 20,
    shadowColor: "#0288D1",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  summaryLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "rgba(255,255,255,0.6)",
    marginBottom: 4,
  },
  summaryTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#fff",
    marginBottom: 14,
  },
  statsRow: {
    flexDirection: "row",
    gap: 0,
  },
  statCol: {
    flex: 1,
  },
  statColBordered: {
    borderLeftWidth: 1,
    borderLeftColor: "rgba(255,255,255,0.2)",
    paddingLeft: 14,
  },
  statLabel: {
    fontSize: 10,
    color: "rgba(255,255,255,0.55)",
    marginBottom: 3,
  },
  statValue: {
    fontSize: 14,
    fontWeight: "800",
    color: "#fff",
  },
  monthSection: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#1565C0",
    marginBottom: 14,
    letterSpacing: 0.5,
  },
  chartContainer: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  chartTitle: {
    fontSize: 11,
    fontWeight: "600",
    color: "#757575",
    marginBottom: 12,
  },
  chart: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 4,
    height: 80,
  },
  chartBar: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },
  bar: {
    width: "100%",
    borderRadius: 4,
    shadowColor: "#0288D1",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  barLabel: {
    fontSize: 8,
    fontWeight: "600",
    color: "#757575",
  },
  barLabelSelected: {
    color: "#1565C0",
    fontWeight: "800",
  },
  monthList: {
    gap: 8,
  },
  monthItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 12,
    borderWidth: 1.5,
    borderColor: "#E0E0E0",
  },
  monthItemSelected: {
    borderColor: "#0288D1",
    shadowColor: "#0288D1",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  monthItemIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "rgba(21,101,192,0.05)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    borderWidth: 1.5,
    borderColor: "#E0E0E0",
  },
  monthItemIconSelected: {
    backgroundColor: "rgba(2,136,209,0.12)",
    borderColor: "#0288D1",
  },
  monthItemMonth: {
    fontSize: 12,
    fontWeight: "800",
    color: "#1565C0",
  },
  monthItemMonthSelected: {
    color: "#0288D1",
  },
  monthItemInfo: {
    flex: 1,
  },
  monthItemYear: {
    fontSize: 11,
    fontWeight: "600",
    color: "#1565C0",
    marginBottom: 2,
  },
  monthItemStats: {
    fontSize: 11,
    color: "#757575",
  },
  monthItemSaved: {
    fontSize: 12,
    fontWeight: "700",
    color: "#0288D1",
    marginLeft: 8,
  },
});
