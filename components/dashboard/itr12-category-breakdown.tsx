import { ThemedText } from "@/components/themed-text";
import { useThemeColor } from "@/hooks/use-theme-color";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

interface CategoryData {
  name: string;
  icon: string;
  color: string;
  bg: string;
  amount: number;
  vat: number;
  items: number;
  pct: number;
  expenses?: Array<{ vendor: string; amount: number; date: string }>;
}

interface ITR12CategoryBreakdownProps {
  categories?: CategoryData[];
}

const DEFAULT_CATEGORIES: CategoryData[] = [
  {
    name: "Software & Tech",
    icon: "💻",
    color: "#1976D2",
    bg: "rgba(25,118,210,0.10)",
    amount: 12400,
    vat: 1617,
    items: 28,
    pct: 30,
    expenses: [
      { vendor: "Incredible Connection", amount: 1249, date: "12 Mar" },
      { vendor: "Adobe Creative Cloud", amount: 649, date: "7 Mar" },
      { vendor: "Dion Wired", amount: 3200, date: "3 Mar" },
      { vendor: "Takealot", amount: 899, date: "28 Feb" },
    ],
  },
  {
    name: "Travel & Transport",
    icon: "🚗",
    color: "#0288D1",
    bg: "rgba(2,136,209,0.10)",
    amount: 9200,
    vat: 1200,
    items: 34,
    pct: 22,
  },
  {
    name: "Office & Stationery",
    icon: "📁",
    color: "#1565C0",
    bg: "rgba(21,101,192,0.08)",
    amount: 7800,
    vat: 1017,
    items: 19,
    pct: 19,
  },
  {
    name: "Professional Services",
    icon: "📋",
    color: "#48D1C0",
    bg: "rgba(72,209,192,0.10)",
    amount: 6100,
    vat: 795,
    items: 8,
    pct: 15,
  },
  {
    name: "Meals & Entertainment",
    icon: "🍽️",
    color: "#E07060",
    bg: "rgba(224,112,96,0.10)",
    amount: 3400,
    vat: 443,
    items: 22,
    pct: 8,
  },
  {
    name: "Home Office",
    icon: "🏠",
    color: "#0288D1",
    bg: "rgba(2,136,209,0.10)",
    amount: 2100,
    vat: 274,
    items: 12,
    pct: 5,
  },
];

export function ITR12CategoryBreakdownScreen({
  categories = DEFAULT_CATEGORIES,
}: ITR12CategoryBreakdownProps) {
  const [selectedCat, setSelectedCat] = useState(0);
  const backgroundColor = useThemeColor({}, "background");
  const cat = categories[selectedCat];

  const taxSaved = Math.round(cat.amount * 0.45);
  const mockExpenses = cat.expenses || [
    { vendor: "Sample Vendor", amount: 1000, date: "Today" },
  ];

  return (
    <ScrollView style={[styles.container, { backgroundColor }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Pressable style={styles.backButton}>
            <Text style={styles.backButtonText}>←</Text>
          </Pressable>
          <ThemedText style={styles.headerTitle}>MyExpense</ThemedText>
        </View>
        <ThemedText style={styles.headerMain}>Category Breakdown</ThemedText>
        <ThemedText style={styles.headerSub}>
          Drill into each ITR12 expense category
        </ThemedText>
      </View>

      {/* Category selector — horizontal scroll */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categorySelector}
        contentContainerStyle={styles.categorySelectorContent}
      >
        {categories.map((c, i) => (
          <Pressable
            key={i}
            onPress={() => setSelectedCat(i)}
            style={[
              styles.categoryTab,
              selectedCat === i && styles.categoryTabActive,
              {
                borderColor: selectedCat === i ? c.color : "#E0E0E0",
                backgroundColor: selectedCat === i ? c.color + "18" : "#fff",
              },
            ]}
          >
            <Text style={styles.categoryTabIcon}>{c.icon}</Text>
            <ThemedText
              style={[
                styles.categoryTabLabel,
                selectedCat === i && { color: c.color },
              ]}
            >
              {c.name.split(" ")[0]}
            </ThemedText>
          </Pressable>
        ))}
      </ScrollView>

      {/* Selected category hero */}
      <View
        style={[
          styles.hero,
          {
            backgroundColor: cat.color,
          },
        ]}
      >
        <View style={styles.heroContent}>
          <View style={styles.heroIcon}>
            <Text style={styles.heroIconText}>{cat.icon}</Text>
          </View>
          <View style={styles.heroTitle}>
            <ThemedText style={styles.heroTitleText}>{cat.name}</ThemedText>
            <Text style={styles.heroSubtitle}>
              Section 11(a) · {cat.items} expenses
            </Text>
          </View>
        </View>
        <View style={styles.heroMetrics}>
          {[
            { label: "Total Gross", value: `R ${cat.amount.toLocaleString()}` },
            { label: "VAT (15%)", value: `R ${cat.vat.toLocaleString()}` },
            {
              label: "Tax Saved",
              value: `R ${taxSaved.toLocaleString()}`,
            },
          ].map((s, i) => (
            <View key={i} style={styles.heroMetricItem}>
              <Text style={styles.heroMetricLabel}>{s.label}</Text>
              <Text style={styles.heroMetricValue}>{s.value}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Donut chart placeholder */}
      <View style={styles.chartCard}>
        <View style={styles.chartContainer}>
          <View style={styles.chartSvg}>
            <Text style={styles.chartPercent}>{cat.pct}%</Text>
          </View>
        </View>
        <View style={styles.chartLabel}>
          <ThemedText style={styles.chartLabelText}>
            Share of total spend
          </ThemedText>
          <Text style={styles.chartDescription}>
            {cat.name} represents {cat.pct}% of your total deductible expenses
            this tax year.
          </Text>
        </View>
      </View>

      {/* Month trend mini bars */}
      <View style={styles.trendCard}>
        <ThemedText style={styles.trendTitle}>Monthly spend</ThemedText>
        <View style={styles.trendBars}>
          {[40, 65, 30, 80, 55, 90, 45, 70, 35, 60, 85, 50].map((h, i) => (
            <View key={i} style={styles.trendBarItem}>
              <View
                style={[
                  styles.trendBar,
                  {
                    height: Math.round(h * 0.44),
                    backgroundColor: i === 2 ? cat.color : cat.color + "40",
                  },
                ]}
              />
              <Text style={styles.trendBarLabel}>{"AJSONDFJM AMJJ"[i]}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Expense list for selected category */}
      <Text style={styles.expenseListLabel}>
        TOP EXPENSES — {cat.name.toUpperCase()}
      </Text>
      <View style={styles.expenseList}>
        {mockExpenses.map((exp, i) => (
          <Pressable key={i} style={styles.expenseItem}>
            <View style={[styles.expenseIcon, { backgroundColor: cat.bg }]}>
              <Text style={styles.expenseIconEmoji}>{cat.icon}</Text>
            </View>
            <View style={styles.expenseContent}>
              <ThemedText style={styles.expenseVendor}>{exp.vendor}</ThemedText>
              <Text style={styles.expenseDate}>
                {exp.date} · {cat.name}
              </Text>
            </View>
            <View style={styles.expenseAmount}>
              <ThemedText style={styles.expenseAmountValue}>
                R {exp.amount.toLocaleString()}
              </ThemedText>
              <Text style={styles.expenseDeductible}>✓ DEDUCTIBLE</Text>
            </View>
          </Pressable>
        ))}
      </View>

      <View style={{ height: 24 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 24,
    backgroundColor: "#1565C0",
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  backButton: {
    padding: 4,
  },
  backButtonText: {
    color: "rgba(255,255,255,0.65)",
    fontSize: 22,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
    color: "#fff",
  },
  headerMain: {
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 6,
    color: "#fff",
  },
  headerSub: {
    fontSize: 12,
    color: "rgba(255,255,255,0.5)",
  },
  categorySelector: {
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  categorySelectorContent: {
    gap: 8,
  },
  categoryTab: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  categoryTabActive: {},
  categoryTabIcon: {
    fontSize: 16,
  },
  categoryTabLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#757575",
  },
  hero: {
    marginHorizontal: 20,
    borderRadius: 20,
    paddingVertical: 18,
    paddingHorizontal: 20,
  },
  heroContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 14,
  },
  heroIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  heroIconText: {
    fontSize: 26,
  },
  heroTitle: {
    flex: 1,
  },
  heroTitleText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#fff",
  },
  heroSubtitle: {
    color: "rgba(255,255,255,0.65)",
    fontSize: 11,
    marginTop: 2,
  },
  heroMetrics: {
    flexDirection: "row",
  },
  heroMetricItem: {
    flex: 1,
    paddingLeft: 0,
    borderLeftWidth: 0,
  },
  heroMetricLabel: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 10,
    marginBottom: 3,
  },
  heroMetricValue: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "800",
  },
  chartCard: {
    marginHorizontal: 20,
    marginTop: 14,
    backgroundColor: "#fff",
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
  },
  chartContainer: {
    flexShrink: 0,
  },
  chartSvg: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#F5F5F5",
    alignItems: "center",
    justifyContent: "center",
  },
  chartPercent: {
    fontSize: 14,
    fontWeight: "800",
  },
  chartLabel: {
    flex: 1,
  },
  chartLabelText: {
    fontSize: 12,
    fontWeight: "700",
    marginBottomB: 4,
  },
  chartDescription: {
    fontSize: 11,
    color: "#757575",
    lineHeight: 1.5,
  },
  trendCard: {
    marginHorizontal: 20,
    marginTop: 14,
    backgroundColor: "#fff",
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 18,
  },
  trendTitle: {
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 12,
  },
  trendBars: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 5,
    height: 50,
  },
  trendBarItem: {
    flex: 1,
    alignItems: "center",
    gap: 3,
  },
  trendBar: {
    width: "100%",
    borderRadius: 3,
  },
  trendBarLabel: {
    fontSize: 7,
    color: "#757575",
  },
  expenseListLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#1565C0",
    letterSpacing: 0.5,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 10,
  },
  expenseList: {
    paddingHorizontal: 20,
  },
  expenseItem: {
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  expenseIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  expenseIconEmoji: {
    fontSize: 16,
  },
  expenseContent: {
    flex: 1,
  },
  expenseVendor: {
    fontSize: 13,
    fontWeight: "600",
    color: "#0D47A1",
  },
  expenseDate: {
    fontSize: 11,
    color: "#757575",
  },
  expenseAmount: {
    alignItems: "flex-end",
  },
  expenseAmountValue: {
    fontSize: 13,
    fontWeight: "800",
    color: "#1565C0",
  },
  expenseDeductible: {
    fontSize: 9,
    fontWeight: "700",
    color: "#0288D1",
  },
});
