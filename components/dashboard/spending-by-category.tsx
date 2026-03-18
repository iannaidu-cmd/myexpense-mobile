import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useThemeColor } from "@/hooks/use-theme-color";
import { useState } from "react";
import { ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";

interface SpendingByCategoryScreenProps {
  navigation?: any;
}

interface Category {
  category: string;
  itr12Code: string;
  amount: number;
  color: string;
  deductible: boolean;
}

// ─── Mock Data ───────────────────────────────────────────────────────────────
const CATEGORIES: Category[] = [
  {
    category: "Travel & Transport",
    itr12Code: "ITR12 – S11(a)",
    amount: 4200,
    color: "#1565C0",
    deductible: true,
  },
  {
    category: "Home Office",
    itr12Code: "ITR12 – S11(a)",
    amount: 3100,
    color: "#0288D1",
    deductible: true,
  },
  {
    category: "Equipment & Tools",
    itr12Code: "ITR12 – S11(e)",
    amount: 2800,
    color: "#1976D2",
    deductible: true,
  },
  {
    category: "Meals & Entertain.",
    itr12Code: "ITR12 – S11(a)",
    amount: 1950,
    color: "#F39C12",
    deductible: true,
  },
  {
    category: "Software & Subscr.",
    itr12Code: "ITR12 – S11(a)",
    amount: 1640,
    color: "#27AE60",
    deductible: true,
  },
  {
    category: "Professional Fees",
    itr12Code: "ITR12 – S11(a)",
    amount: 1200,
    color: "#E74C3C",
    deductible: true,
  },
  {
    category: "Utilities",
    itr12Code: "ITR12 – S11(a)",
    amount: 980,
    color: "#8E44AD",
    deductible: true,
  },
  {
    category: "Personal / Other",
    itr12Code: "Non-deductible",
    amount: 2550,
    color: "#BDC3C7",
    deductible: false,
  },
];

const TOTAL = CATEGORIES.reduce((s, c) => s + c.amount, 0);
const TAX_TOTAL = CATEGORIES.filter((c) => c.deductible).reduce(
  (s, c) => s + c.amount,
  0,
);

// ─── Donut Chart Component ───────────────────────────────────────────────────
interface DonutChartProps {
  data: Category[];
  total: number;
}

function DonutChart({ data, total }: DonutChartProps) {
  const CHART_SIZE = 160;
  const items = data.slice(0, 6);

  return (
    <View style={styles.chartContainer}>
      <View
        style={[styles.chartCircle, { width: CHART_SIZE, height: CHART_SIZE }]}
      >
        <View
          style={[
            styles.chartInnerRing,
            { width: CHART_SIZE, height: CHART_SIZE },
          ]}
        />
        {items.map((item, i) => {
          const pct = (item.amount / total) * 100;
          return (
            <View
              key={i}
              style={[
                styles.chartSegment,
                {
                  height: `${pct}%`,
                  backgroundColor: item.color,
                },
              ]}
            />
          );
        })}
      </View>
      <View
        style={[styles.chartCenter, { width: CHART_SIZE, height: CHART_SIZE }]}
      >
        <ThemedText style={styles.chartLabel}>Total</ThemedText>
        <ThemedText style={styles.chartValue}>
          R{(total / 1000).toFixed(1)}k
        </ThemedText>
      </View>
      {/* Legend */}
      <View style={styles.legendContainer}>
        {items.map((c, i) => (
          <View key={i} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: c.color }]} />
            <ThemedText style={styles.legendText} numberOfLines={1}>
              {c.category.split(" ")[0]}
            </ThemedText>
          </View>
        ))}
      </View>
    </View>
  );
}

// ─── Category Row Component ──────────────────────────────────────────────────
interface CategoryRowProps {
  item: Category;
  total: number;
  onPress?: () => void;
}

function CategoryRow({ item, total, onPress }: CategoryRowProps) {
  const pct = ((item.amount / total) * 100).toFixed(1);
  const bgColor = useThemeColor({}, "background");
  const borderColor = useThemeColor({}, "border");

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.categoryRow,
        {
          backgroundColor: bgColor,
          borderBottomColor: borderColor,
        },
      ]}
    >
      <View style={[styles.categoryDot, { backgroundColor: item.color }]} />
      <View style={styles.categoryInfo}>
        <ThemedText type="defaultSemiBold" style={styles.categoryName}>
          {item.category}
        </ThemedText>
        <ThemedText style={[styles.categoryCode, { color: "#757575" }]}>
          {item.itr12Code}
        </ThemedText>
        <View
          style={[styles.categoryProgressBar, { backgroundColor: "#F5F5F5" }]}
        >
          <View
            style={[
              styles.categoryProgressFill,
              {
                width: `${pct}%`,
                backgroundColor: item.color,
              },
            ]}
          />
        </View>
      </View>
      <View style={styles.categoryAmount}>
        <ThemedText style={[styles.categoryValue, { color: "#1565C0" }]}>
          R {item.amount.toLocaleString()}
        </ThemedText>
        <ThemedText style={[styles.categoryPercent, { color: "#757575" }]}>
          {pct}%
        </ThemedText>
        {item.deductible ? (
          <ThemedText style={[styles.categoryDeductible, { color: "#27AE60" }]}>
            ✓ Deductible
          </ThemedText>
        ) : (
          <ThemedText style={[styles.categoryPersonal, { color: "#757575" }]}>
            Personal
          </ThemedText>
        )}
      </View>
    </TouchableOpacity>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────
export function SpendingByCategoryScreen({
  navigation,
}: SpendingByCategoryScreenProps) {
  const [sort, setSort] = useState("Amount");
  const [viewMode, setViewMode] = useState("All");

  const sorts = ["Amount", "Category", "Deductible"];
  const views = ["All", "Deductible", "Personal"];

  const bgColor = useThemeColor({}, "background");
  const borderColor = useThemeColor({}, "border");
  const headerBg = "#1565C0";
  const accentColor = "#0288D1";

  const filtered = CATEGORIES.filter((c) => {
    if (viewMode === "Deductible") return c.deductible;
    if (viewMode === "Personal") return !c.deductible;
    return true;
  }).sort((a, b) => {
    if (sort === "Amount") return b.amount - a.amount;
    if (sort === "Category") return a.category.localeCompare(b.category);
    return b.deductible === a.deductible ? 0 : b.deductible ? -1 : 1;
  });

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
            SPENDING BY CATEGORY
          </ThemedText>
          <ThemedText style={styles.headerTitle}>Category Breakdown</ThemedText>
          <ThemedText style={[styles.headerSubtitle, { color: "#757575" }]}>
            March 2025 · ITR12 mapped
          </ThemedText>
        </View>

        {/* Content */}
        <View style={[styles.content, { backgroundColor: bgColor }]}>
          {/* Summary Cards */}
          <View style={styles.summaryRow}>
            <View style={[styles.summaryCard, { backgroundColor: headerBg }]}>
              <ThemedText style={[styles.summaryLabel, { color: "#757575" }]}>
                Total Spend
              </ThemedText>
              <ThemedText style={[styles.summaryValue, { color: "#FFFFFF" }]}>
                R {TOTAL.toLocaleString()}
              </ThemedText>
            </View>
            <View
              style={[
                styles.summaryCard,
                { backgroundColor: bgColor, borderColor, borderWidth: 1 },
              ]}
            >
              <ThemedText style={[styles.summaryLabel, { color: "#757575" }]}>
                Deductible
              </ThemedText>
              <ThemedText style={[styles.summaryValue, { color: "#27AE60" }]}>
                R {TAX_TOTAL.toLocaleString()}
              </ThemedText>
            </View>
          </View>

          {/* Chart */}
          <ThemedView
            style={[
              styles.chartCard,
              { backgroundColor: bgColor, borderColor },
            ]}
          >
            <ThemedText style={styles.chartTitle}>
              Spend Distribution
            </ThemedText>
            <DonutChart data={CATEGORIES} total={TOTAL} />
          </ThemedView>

          {/* View Toggle */}
          <View style={styles.viewToggleContainer}>
            <View style={[styles.viewToggle, { backgroundColor: "#F5F5F5" }]}>
              {views.map((v) => (
                <TouchableOpacity
                  key={v}
                  onPress={() => setViewMode(v)}
                  style={[
                    styles.viewButton,
                    {
                      backgroundColor:
                        viewMode === v ? headerBg : "transparent",
                    },
                  ]}
                >
                  <ThemedText
                    style={[
                      styles.viewButtonText,
                      {
                        color: viewMode === v ? "#FFFFFF" : "#757575",
                      },
                    ]}
                  >
                    {v}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Sort Row */}
          <View style={styles.sortRow}>
            <ThemedText style={[styles.sortLabel, { color: "#757575" }]}>
              Sort:
            </ThemedText>
            {sorts.map((s) => (
              <TouchableOpacity
                key={s}
                onPress={() => setSort(s)}
                style={[
                  styles.sortButton,
                  {
                    backgroundColor: sort === s ? accentColor : "#F5F5F5",
                  },
                ]}
              >
                <ThemedText
                  style={[
                    styles.sortButtonText,
                    {
                      color: sort === s ? "#FFFFFF" : "#757575",
                    },
                  ]}
                >
                  {s}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </View>

          {/* Category List */}
          <View
            style={[
              styles.categoryList,
              { backgroundColor: bgColor, borderColor },
            ]}
          >
            {filtered.map((item, i) => (
              <CategoryRow
                key={i}
                item={item}
                total={TOTAL}
                onPress={() =>
                  navigation?.navigate("ExpenseHistory", {
                    category: item.category,
                  })
                }
              />
            ))}
          </View>

          {/* ITR12 Note */}
          <View style={[styles.noteCard, { backgroundColor: "#F5F5F5" }]}>
            <ThemedText style={styles.noteIcon}>ℹ️</ThemedText>
            <ThemedText style={[styles.noteText, { color: "#757575" }]}>
              Categories tagged "Deductible" are mapped to SARS ITR12 Section
              11(a) and related provisions. Keep receipts for 5 years per SARS
              requirements.
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
  content: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -16,
    paddingTop: 20,
    paddingHorizontal: 16,
    paddingBottom: 30,
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
    marginTop: 2,
  },
  chartCard: {
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  chartTitle: {
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 4,
  },
  chartContainer: {
    alignItems: "center",
    marginVertical: 10,
  },
  chartCircle: {
    borderRadius: 80,
    overflow: "hidden",
    backgroundColor: "#F5F5F5",
    transform: [{ rotate: "-90deg" }],
  },
  chartInnerRing: {
    position: "absolute",
    borderRadius: 80,
    borderWidth: 28,
    borderColor: "#F5F5F5",
    zIndex: 10,
  },
  chartSegment: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    opacity: 0.85,
  },
  chartCenter: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  chartLabel: {
    fontSize: 11,
    color: "#757575",
  },
  chartValue: {
    fontSize: 16,
    fontWeight: "800",
    color: "#1565C0",
  },
  legendContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 8,
    justifyContent: "center",
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    width: "50%",
    marginBottom: 6,
    paddingHorizontal: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  legendText: {
    fontSize: 10,
    color: "#757575",
    flex: 1,
  },
  viewToggleContainer: {
    paddingHorizontal: 0,
    marginBottom: 8,
  },
  viewToggle: {
    flexDirection: "row",
    borderRadius: 10,
    padding: 3,
  },
  viewButton: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 8,
    alignItems: "center",
  },
  viewButtonText: {
    fontSize: 11,
    fontWeight: "600",
  },
  sortRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    paddingHorizontal: 0,
  },
  sortLabel: {
    fontSize: 12,
    marginRight: 8,
  },
  sortButton: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    marginRight: 6,
  },
  sortButtonText: {
    fontSize: 11,
    fontWeight: "600",
  },
  categoryList: {
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 1,
  },
  categoryRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  categoryDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 13,
  },
  categoryCode: {
    fontSize: 11,
    marginTop: 2,
  },
  categoryProgressBar: {
    height: 4,
    borderRadius: 2,
    marginTop: 6,
    overflow: "hidden",
  },
  categoryProgressFill: {
    height: 4,
    borderRadius: 2,
  },
  categoryAmount: {
    alignItems: "flex-end",
    marginLeft: 12,
  },
  categoryValue: {
    fontSize: 13,
    fontWeight: "700",
  },
  categoryPercent: {
    fontSize: 11,
    marginTop: 2,
  },
  categoryDeductible: {
    fontSize: 10,
    fontWeight: "600",
    marginTop: 2,
  },
  categoryPersonal: {
    fontSize: 10,
    marginTop: 2,
  },
  noteCard: {
    borderRadius: 12,
    padding: 14,
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 16,
  },
  noteIcon: {
    fontSize: 18,
    marginRight: 10,
  },
  noteText: {
    flex: 1,
    fontSize: 11,
    lineHeight: 16,
  },
});
