import { colour, radius, space, typography } from "@/tokens";
import { useState } from "react";
import { FlatList, Pressable, Text, View } from "react-native";

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

const FILTER_OPTIONS = [
  { id: "all",            label: "All" },
  { id: "deductible",     label: "✓ Deductible" },
  { id: "non-deductible", label: "✗ Non-deductible" },
] as const;

const SORT_OPTIONS = [
  { id: "date",   label: "📅 Date" },
  { id: "amount", label: "💵 Amount" },
] as const;

export function ExpenseHistoryScreen({
  expenses = MOCK_EXPENSES,
  onSelectExpense,
  onFilterChange,
}: ExpenseHistoryProps) {
  const [sortBy, setSortBy] = useState<"date" | "amount">("date");
  const [filterDeductible, setFilterDeductible] = useState<
    "all" | "deductible" | "non-deductible"
  >("all");

  const filteredExpenses = expenses.filter((e) => {
    if (filterDeductible === "deductible")     return e.deductible;
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

  const renderExpenseItem = ({ item }: { item: ExpenseItem }) => (
    <Pressable
      onPress={() => onSelectExpense?.(item)}
      style={{
        backgroundColor: colour.white,
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: colour.border,
        paddingHorizontal: space.lg,
        paddingVertical: space.md,
        marginHorizontal: space.xl,
        marginVertical: space.sm,
        flexDirection: "row",
        alignItems: "center",
        gap: space.md,
      }}
    >
      {/* Icon */}
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: colour.tealLight,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text style={{ fontSize: 20 }}>{item.categoryIcon}</Text>
      </View>

      {/* Content */}
      <View style={{ flex: 1 }}>
        <Text style={{ ...typography.labelM, color: colour.text, marginBottom: 2 }}>
          {item.vendor}
        </Text>
        <Text style={{ ...typography.bodyXS, color: colour.textSub }}>
          {item.category}
        </Text>
      </View>

      {/* Right side */}
      <View style={{ alignItems: "flex-end" }}>
        <Text style={{ ...typography.amountS, color: colour.primary, marginBottom: space.xs }}>
          {item.amount}
        </Text>
        <Text style={{ ...typography.bodyXS, color: colour.textSub }}>
          {item.date}
        </Text>
        {item.deductible && (
          <View
            style={{
              paddingHorizontal: space.sm,
              paddingVertical: 2,
              borderRadius: radius.sm,
              backgroundColor: colour.tealLight,
              marginTop: 2,
            }}
          >
            <Text style={{ ...typography.micro, color: colour.teal, fontWeight: "700" }}>
              ✓ Deductible
            </Text>
          </View>
        )}
      </View>
    </Pressable>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colour.white }}>
      {/* Header */}
      <View
        style={{
          paddingHorizontal: space.xl,
          paddingTop: space.xl,
          paddingBottom: space.xl,
          backgroundColor: colour.primary,
        }}
      >
        <Text style={{ ...typography.h3, color: colour.white, marginBottom: space.xs }}>
          Expense History
        </Text>
        <Text style={{ ...typography.bodyS, color: colour.primary100 }}>
          View and manage your transactions
        </Text>
      </View>

      {/* Controls */}
      <View
        style={{
          paddingHorizontal: space.xl,
          paddingVertical: space.lg,
          borderBottomWidth: 1,
          borderBottomColor: colour.border,
          backgroundColor: colour.white,
        }}
      >
        {/* Filter row */}
        <Text style={{ ...typography.labelS, color: colour.textSub, marginBottom: space.sm }}>
          Filter
        </Text>
        <View style={{ flexDirection: "row", gap: space.sm, marginBottom: space.md }}>
          {FILTER_OPTIONS.map((filter) => {
            const active = filterDeductible === filter.id;
            return (
              <Pressable
                key={filter.id}
                style={{
                  paddingHorizontal: space.md,
                  paddingVertical: space.xs,
                  borderRadius: radius.pill,
                  borderWidth: 1,
                  borderColor: active ? colour.primary : colour.border,
                  backgroundColor: active ? colour.primary : "transparent",
                }}
                onPress={() => {
                  setFilterDeductible(filter.id as any);
                  onFilterChange?.(filter.id);
                }}
              >
                <Text
                  style={{
                    ...typography.labelS,
                    color: active ? colour.onPrimary : colour.textSub,
                  }}
                >
                  {filter.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Sort row */}
        <Text style={{ ...typography.labelS, color: colour.textSub, marginBottom: space.sm }}>
          Sort by
        </Text>
        <View style={{ flexDirection: "row", gap: space.sm }}>
          {SORT_OPTIONS.map((sort) => {
            const active = sortBy === sort.id;
            return (
              <Pressable
                key={sort.id}
                style={{
                  flex: 1,
                  paddingHorizontal: space.md,
                  paddingVertical: space.xs,
                  borderRadius: radius.pill,
                  borderWidth: 1,
                  borderColor: active ? colour.primary : colour.border,
                  backgroundColor: active ? colour.primary : "transparent",
                  alignItems: "center",
                }}
                onPress={() => setSortBy(sort.id as any)}
              >
                <Text
                  style={{
                    ...typography.labelS,
                    color: active ? colour.onPrimary : colour.textSub,
                  }}
                >
                  {sort.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* List */}
      {sortedExpenses.length > 0 ? (
        <FlatList
          data={sortedExpenses}
          scrollEnabled={false}
          renderItem={renderExpenseItem}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={<View style={{ height: space.sm }} />}
          ListFooterComponent={<View style={{ height: 100 }} />}
        />
      ) : (
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            paddingVertical: 40,
          }}
        >
          <Text style={{ fontSize: 52, marginBottom: space.lg }}>📭</Text>
          <Text style={{ ...typography.h4, color: colour.text, marginBottom: space.sm }}>
            No expenses found
          </Text>
          <Text style={{ ...typography.bodyM, color: colour.textSub }}>
            Try adjusting your filters
          </Text>
        </View>
      )}
    </View>
  );
}
