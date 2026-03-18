interface TaxCategory {
  name: string;
  icon: string;
  color: string;
  amount: number;
  percentage: number;
  itemCount: number;
  itr12Section: string;
}
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useThemeColor } from "@/hooks/use-theme-color";
import {
    FlatList,
    Pressable,
    ScrollView,
    StyleSheet,
    View,
} from "react-native";

interface TaxSummaryData {
  taxYear: number;
  periodStart: string;
  periodEnd: string;
  totalTaxSaved: string;
  daysUntilDeadline: number;
  categories: TaxCategory[];
  projectedAnnualSaving: string;
  monthsRemaining: number;
}

interface TaxSummaryScreenProps {
  data?: TaxSummaryData;
  onExport?: () => void;
  onCategoryPress?: (category: TaxCategory) => void;
  onBack?: () => void;
}

const DEFAULT_DATA: TaxSummaryData = {
  taxYear: 2026,
  periodStart: "1 Mar 2025",
  periodEnd: "28 Feb 2026",
  totalTaxSaved: "R 34,892.50",
  daysUntilDeadline: 47,
  categories: [
    {
      name: "Software & Tech",
      icon: "💻",
      color: "#1976D2",
      amount: 12400,
      percentage: 81,
      itemCount: 28,
      itr12Section: "Section 11(a)",
    },
    {
      name: "Travel & Transport",
      icon: "🚗",
      color: "#0288D1",
      amount: 9200,
      percentage: 65,
      itemCount: 34,
      itr12Section: "Section 11(a)",
    },
    {
      name: "Office & Stationery",
      icon: "📁",
      color: "#1565C0",
      amount: 7800,
      percentage: 54,
      itemCount: 19,
      itr12Section: "Section 11(a)",
    },
    {
      name: "Professional Services",
      icon: "📋",
      color: "#1976D2",
      amount: 6100,
      percentage: 44,
      itemCount: 8,
      itr12Section: "Section 11(a)",
    },
    {
      name: "Meals & Entertainment",
      icon: "🍽️",
      color: "#E07060",
      amount: 3400,
      percentage: 24,
      itemCount: 22,
      itr12Section: "50% deductible",
    },
    {
      name: "Home Office",
      icon: "🏠",
      color: "#0288D1",
      amount: 2100,
      percentage: 15,
      itemCount: 12,
      itr12Section: "Section 11(a)",
    },
  ],
  projectedAnnualSaving: "R 24,600",
  monthsRemaining: 3,
};

export function TaxSummaryScreen({
  data = DEFAULT_DATA,
  onExport,
  onCategoryPress,
  onBack,
}: TaxSummaryScreenProps) {
  const backgroundColor = useThemeColor(
    { light: "#FFFFFF", dark: "#121212" },
    "background",
  );
  const cardBackground = useThemeColor(
    { light: "#F5F5F5", dark: "#1E1E1E" },
    "background",
  );
  const textColor = useThemeColor({}, "text");
  const mutedColor = useThemeColor(
    { light: "#757575", dark: "#9E9E9E" },
    "text",
  );
  const borderColor = useThemeColor(
    { light: "#E0E0E0", dark: "#424242" },
    "text",
  );
  const accentColor = "#0288D1";

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor,
    },
    header: {
      paddingHorizontal: 24,
      paddingTop: 20,
      paddingBottom: 28,
      backgroundColor: "rgba(21, 101, 192, 0.95)",
      borderBottomWidth: 1,
      borderBottomColor: "rgba(0, 0, 0, 0.1)",
    },
    headerTop: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      marginBottom: 16,
    },
    backButton: {
      fontSize: 22,
      color: "rgba(255, 255, 255, 0.65)",
    },
    headerTitle: {
      fontSize: 22,
      fontWeight: "800",
      color: "#fff",
      marginBottom: 6,
      lineHeight: 1.2,
    },
    headerSubtext: {
      fontSize: 12,
      color: "rgba(255, 255, 255, 0.5)",
      marginBottom: 10,
    },
    deadlineBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      backgroundColor: "rgba(2, 136, 209, 0.18)",
      borderRadius: 20,
      paddingHorizontal: 14,
      paddingVertical: 5,
      borderWidth: 1,
      borderColor: "rgba(2, 136, 209, 0.35)",
      alignSelf: "flex-start",
    },
    deadlineDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: accentColor,
    },
    deadlineText: {
      fontSize: 11,
      fontWeight: "700",
      color: accentColor,
    },
    content: {
      flex: 1,
    },
    heroCard: {
      margin: 16,
      marginTop: 16,
      marginBottom: 0,
      borderRadius: 20,
      paddingHorizontal: 20,
      paddingVertical: 20,
      backgroundColor: "#1565C0",
    },
    heroLabel: {
      fontSize: 11,
      fontWeight: "600",
      color: "rgba(255, 255, 255, 0.6)",
      marginBottom: 4,
      letterSpacing: 0.5,
      textTransform: "uppercase",
    },
    heroAmount: {
      fontSize: 36,
      fontWeight: "900",
      color: "#fff",
      marginBottom: 4,
      lineHeight: 1,
    },
    heroSubtext: {
      fontSize: 11,
      color: "rgba(255, 255, 255, 0.55)",
      marginTop: 8,
    },
    sectionTitle: {
      fontSize: 12,
      fontWeight: "700",
      color: mutedColor,
      paddingHorizontal: 20,
      paddingVertical: 16,
      paddingTop: 20,
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    categoryCard: {
      marginHorizontal: 20,
      marginVertical: 10,
      borderRadius: 16,
      padding: 14,
      backgroundColor: cardBackground,
      borderWidth: 1,
      borderColor: borderColor,
    },
    categoryHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      marginBottom: 10,
    },
    categoryIcon: {
      width: 36,
      height: 36,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
      fontSize: 18,
    },
    categoryInfo: {
      flex: 1,
    },
    categoryName: {
      fontSize: 13,
      fontWeight: "600",
      color: textColor,
    },
    categorySubtext: {
      fontSize: 10,
      color: mutedColor,
      marginTop: 1,
    },
    categoryAmount: {
      // Only valid ViewStyle properties here
    },
    categoryValue: {
      fontSize: 14,
      fontWeight: "800",
      color: "#1565C0",
      marginBottom: 2,
    },
    categoryPercentage: {
      fontSize: 10,
      fontWeight: "700",
    },
    progressBar: {
      height: 5,
      borderRadius: 100,
      overflow: "hidden",
    },
    progressFill: {
      height: "100%",
      borderRadius: 100,
    },
    forecastCard: {
      marginHorizontal: 20,
      marginVertical: 16,
      borderRadius: 18,
      paddingHorizontal: 16,
      paddingVertical: 16,
      backgroundColor: "rgba(2, 136, 209, 0.08)",
      borderWidth: 1.5,
      borderColor: "rgba(2, 136, 209, 0.25)",
      flexDirection: "row",
      alignItems: "center",
      gap: 16,
    },
    forecastIcon: {
      fontSize: 28,
    },
    forecastContent: {
      flex: 1,
    },
    forecastLabel: {
      fontSize: 12,
      fontWeight: "600",
      color: "#0288D1",
      marginBottom: 2,
    },
    forecastAmount: {
      fontSize: 20,
      fontWeight: "900",
      color: textColor,
    },
    forecastSubtext: {
      fontSize: 11,
      color: mutedColor,
      marginTop: 2,
    },
    exportButton: {
      marginHorizontal: 20,
      marginVertical: 16,
      borderRadius: 18,
      paddingVertical: 16,
      backgroundColor: "#1565C0",
      alignItems: "center",
    },
    exportButtonText: {
      fontWeight: "700",
      fontSize: 15,
      color: "#fff",
    },
    bottomSpacing: {
      height: 40,
    },
  });

  const renderCategoryCard = ({ item }: { item: TaxCategory }) => (
    <Pressable
      style={styles.categoryCard}
      onPress={() => onCategoryPress?.(item)}
    >
      <View style={styles.categoryHeader}>
        <View
          style={[styles.categoryIcon, { backgroundColor: item.color + "15" }]}
        >
          <ThemedText>{item.icon}</ThemedText>
        </View>
        <View style={styles.categoryInfo}>
          <ThemedText style={styles.categoryName}>{item.name}</ThemedText>
          <ThemedText style={styles.categorySubtext}>
            {item.itemCount} expenses · {item.itr12Section}
          </ThemedText>
        </View>
        <View
          style={{
            ...styles.categoryAmount /* textAlign removed; not valid for ViewStyle */,
          }}
        >
          <ThemedText style={styles.categoryValue}>
            R {item.amount.toLocaleString()}
          </ThemedText>
          <ThemedText
            style={[styles.categoryPercentage, { color: item.color }]}
          >
            {item.percentage}% of target
          </ThemedText>
        </View>
      </View>
      <View style={[styles.progressBar, { backgroundColor: borderColor }]}>
        <View
          style={[
            styles.progressFill,
            {
              width: `${Math.min(item.percentage, 100)}%`,
              backgroundColor: item.color,
            },
          ]}
        />
      </View>
    </Pressable>
  );

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <ThemedView style={styles.header}>
        <View style={styles.headerTop}>
          <Pressable onPress={onBack}>
            <ThemedText style={styles.backButton}>←</ThemedText>
          </Pressable>
        </View>

        <ThemedText style={styles.headerTitle}>Tax Summary</ThemedText>
        <ThemedText style={styles.headerSubtext}>
          Tax Year {data.taxYear} · {data.periodStart} – {data.periodEnd}
        </ThemedText>

        <View style={styles.deadlineBadge}>
          <View style={styles.deadlineDot} />
          <ThemedText style={styles.deadlineText}>
            {data.daysUntilDeadline} days until ITR12 deadline
          </ThemedText>
        </View>
      </ThemedView>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Hero Card - Total Tax Saved */}
        <View style={styles.heroCard}>
          <ThemedText style={styles.heroLabel}>
            Total Tax Saved (Est.)
          </ThemedText>
          <ThemedText style={styles.heroAmount}>
            {data.totalTaxSaved}
          </ThemedText>
          <ThemedText style={styles.heroSubtext}>
            Based on current deductible expenses
          </ThemedText>
        </View>

        {/* Category Breakdown */}
        <ThemedText style={styles.sectionTitle}>
          ITR12 Category Breakdown
        </ThemedText>

        <FlatList
          data={data.categories}
          renderItem={renderCategoryCard}
          keyExtractor={(item) => item.name}
          scrollEnabled={false}
          nestedScrollEnabled={false}
        />

        {/* Forecast Card */}
        <View style={styles.forecastCard}>
          <ThemedText style={styles.forecastIcon}>💡</ThemedText>
          <View style={styles.forecastContent}>
            <ThemedText style={styles.forecastLabel}>
              Projected annual saving
            </ThemedText>
            <ThemedText style={styles.forecastAmount}>
              {data.projectedAnnualSaving}
            </ThemedText>
            <ThemedText style={styles.forecastSubtext}>
              At current pace · {data.monthsRemaining} months remaining
            </ThemedText>
          </View>
        </View>

        {/* Export Button */}
        <Pressable style={styles.exportButton} onPress={onExport}>
          <ThemedText style={styles.exportButtonText}>
            📤 Export ITR12 Report
          </ThemedText>
        </Pressable>

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </ThemedView>
  );
}
