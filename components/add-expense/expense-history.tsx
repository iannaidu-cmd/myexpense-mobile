import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useThemeColor } from "@/hooks/use-theme-color";
import { useState } from "react";
import { FlatList, Pressable, StyleSheet, View } from "react-native";

interface ExpenseItem {
  id: string;
  vendor: string;
  amount: string;
  date: string;
  category: string;
  categoryIcon: string;
  deductible: boolean;
}

interface ExpenseHistoryProps {
  expenses?: ExpenseItem[];
  onSelectExpense?: (expense: ExpenseItem) => void;
  onFilterChange?: (filter: string) => void;
}

const MOCK_EXPENSES: ExpenseItem[] = [
  {
    id: "1",
    vendor: "Incredible Connection",
    amount: "R 1,249",
    date: "12 Mar",
    category: "Software & Tech",
    categoryIcon: "💻",
    deductible: true,
  },
  {
    id: "2",
    vendor: "Engen Forecourt",
    amount: "R 850",
    date: "11 Mar",
    category: "Vehicle & Fuel",
    categoryIcon: "⛽",
    deductible: true,
  },
  {
    id: "3",
    vendor: "Vida e Caffè",
    amount: "R 218",
    date: "11 Mar",
    category: "Meals & Entertainment",
    categoryIcon: "🍽️",
    deductible: true,
  },
  {
    id: "4",
    vendor: "Checkers Hyper",
    amount: "R 1,842",
    date: "10 Mar",
    category: "Home Office",
    categoryIcon: "🏠",
    deductible: false,
  },
  {
    id: "5",
    vendor: "Takealot",
    amount: "R 399",
    date: "9 Mar",
    category: "Office & Stationery",
    categoryIcon: "📁",
    deductible: true,
  },
  {
    id: "6",
    vendor: "Cape Town Parking",
    amount: "R 60",
    date: "8 Mar",
    category: "Travel & Transport",
    categoryIcon: "🚗",
    deductible: true,
  },
];

export function ExpenseHistoryScreen({
  expenses = MOCK_EXPENSES,
  onSelectExpense,
  onFilterChange,
}: ExpenseHistoryProps) {
  const [sortBy, setSortBy] = useState<"date" | "amount">("date");
  const [filterDeductible, setFilterDeductible] = useState<
    "all" | "deductible" | "non-deductible"
  >("all");

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

  const filteredExpenses = expenses.filter((e) => {
    if (filterDeductible === "deductible") return e.deductible;
    if (filterDeductible === "non-deductible") return !e.deductible;
    return true;
  });

  const sortedExpenses = [...filteredExpenses].sort((a, b) => {
    if (sortBy === "amount") {
      return (
        parseFloat(b.amount.replace(/[^\d.-]/g, "")) -
        parseFloat(a.amount.replace(/[^\d.-]/g, ""))
      );
    }
    return 0;
  });

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor,
    },
    header: {
      paddingHorizontal: 24,
      paddingTop: 20,
      paddingBottom: 24,
      backgroundColor: "rgba(21, 101, 192, 0.95)",
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: "700",
      color: "#fff",
      marginBottom: 4,
    },
    headerSubtitle: {
      fontSize: 13,
      color: "rgba(255, 255, 255, 0.55)",
    },
    controls: {
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: borderColor,
    },
    filterRow: {
      flexDirection: "row",
      gap: 8,
      marginBottom: 12,
    },
    filterButton: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 100,
      borderWidth: 1,
      borderColor: borderColor,
      backgroundColor: "transparent",
    },
    filterButtonActive: {
      backgroundColor: accentColor,
      borderColor: accentColor,
    },
    filterButtonText: {
      fontSize: 12,
      fontWeight: "600",
      color: mutedColor,
    },
    filterButtonTextActive: {
      color: "#FFFFFF",
    },
    sortRow: {
      flexDirection: "row",
      gap: 8,
    },
    sortButton: {
      flex: 1,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 100,
      borderWidth: 1,
      borderColor: borderColor,
      backgroundColor: "transparent",
      alignItems: "center",
    },
    sortButtonActive: {
      backgroundColor: "#1565C0",
      borderColor: "#1565C0",
    },
    sortButtonText: {
      fontSize: 12,
      fontWeight: "600",
      color: mutedColor,
    },
    sortButtonTextActive: {
      color: "#fff",
    },
    content: {
      flex: 1,
    },
    expenseItem: {
      backgroundColor: cardBackground,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: borderColor,
      paddingHorizontal: 16,
      paddingVertical: 12,
      marginHorizontal: 20,
      marginVertical: 8,
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    iconContainer: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: "rgba(59, 191, 173, 0.1)",
      alignItems: "center",
      justifyContent: "center",
    },
    icon: {
      fontSize: 20,
    },
    expenseContent: {
      flex: 1,
    },
    vendorName: {
      fontSize: 14,
      fontWeight: "600",
      color: textColor,
      marginBottom: 2,
    },
    categoryName: {
      fontSize: 12,
      color: mutedColor,
    },
    expenseAmount: {
      fontSize: 14,
      fontWeight: "700",
      color: accentColor,
      marginBottom: 4,
    },
    expenseDate: {
      fontSize: 12,
      color: mutedColor,
    },
    deductibleBadge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
      backgroundColor: "rgba(59, 191, 173, 0.15)",
    },
    deductibleBadgeText: {
      fontSize: 10,
      fontWeight: "700",
      color: accentColor,
    },
    emptyContainer: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 40,
    },
    emptyIcon: {
      fontSize: 52,
      marginBottom: 16,
    },
    emptyTitle: {
      fontSize: 16,
      fontWeight: "700",
      color: textColor,
      marginBottom: 6,
    },
    emptySubtext: {
      fontSize: 13,
      color: mutedColor,
      textAlign: "center",
    },
  });

  const renderExpenseItem = ({ item }: { item: ExpenseItem }) => (
    <Pressable
      style={styles.expenseItem}
      onPress={() => onSelectExpense?.(item)}
    >
      <View style={styles.iconContainer}>
        <ThemedText style={styles.icon}>{item.categoryIcon}</ThemedText>
      </View>
      <View style={styles.expenseContent}>
        <ThemedText style={styles.vendorName}>{item.vendor}</ThemedText>
        <ThemedText style={styles.categoryName}>{item.category}</ThemedText>
      </View>
      <View style={{ alignItems: "flex-end" }}>
        <ThemedText style={styles.expenseAmount}>{item.amount}</ThemedText>
        <ThemedText style={styles.expenseDate}>{item.date}</ThemedText>
        {item.deductible && (
          <View style={styles.deductibleBadge}>
            <ThemedText style={styles.deductibleBadgeText}>
              ✓ Deductible
            </ThemedText>
          </View>
        )}
      </View>
    </Pressable>
  );

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedText style={styles.headerTitle}>Expense History</ThemedText>
        <ThemedText style={styles.headerSubtitle}>
          View and manage your transactions
        </ThemedText>
      </ThemedView>

      <ThemedView style={styles.controls}>
        <ThemedText
          style={{
            fontSize: 12,
            fontWeight: "600",
            color: mutedColor,
            marginBottom: 8,
          }}
        >
          Filter
        </ThemedText>
        <View style={styles.filterRow}>
          {[
            { id: "all", label: "All" },
            { id: "deductible", label: "✓ Deductible" },
            { id: "non-deductible", label: "✗ Non-deductible" },
          ].map((filter) => (
            <Pressable
              key={filter.id}
              style={[
                styles.filterButton,
                filterDeductible === filter.id && styles.filterButtonActive,
              ]}
              onPress={() => {
                setFilterDeductible(filter.id as any);
                onFilterChange?.(filter.id);
              }}
            >
              <ThemedText
                style={[
                  styles.filterButtonText,
                  filterDeductible === filter.id &&
                    styles.filterButtonTextActive,
                ]}
              >
                {filter.label}
              </ThemedText>
            </Pressable>
          ))}
        </View>

        <ThemedText
          style={{
            fontSize: 12,
            fontWeight: "600",
            color: mutedColor,
            marginBottom: 8,
          }}
        >
          Sort by
        </ThemedText>
        <View style={styles.sortRow}>
          {[
            { id: "date", label: "📅 Date" },
            { id: "amount", label: "💵 Amount" },
          ].map((sort) => (
            <Pressable
              key={sort.id}
              style={[
                styles.sortButton,
                sortBy === sort.id && styles.sortButtonActive,
              ]}
              onPress={() => setSortBy(sort.id as any)}
            >
              <ThemedText
                style={[
                  styles.sortButtonText,
                  sortBy === sort.id && styles.sortButtonTextActive,
                ]}
              >
                {sort.label}
              </ThemedText>
            </Pressable>
          ))}
        </View>
      </ThemedView>

      {sortedExpenses.length > 0 ? (
        <FlatList
          data={sortedExpenses}
          scrollEnabled={false}
          renderItem={renderExpenseItem}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={<View style={{ height: 8 }} />}
          ListFooterComponent={<View style={{ height: 100 }} />}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <ThemedText style={styles.emptyIcon}>📭</ThemedText>
          <ThemedText style={styles.emptyTitle}>No expenses found</ThemedText>
          <ThemedText style={styles.emptySubtext}>
            Try adjusting your filters
          </ThemedText>
        </View>
      )}
    </ThemedView>
  );
}
