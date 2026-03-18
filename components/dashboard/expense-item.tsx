import type { Expense } from "@/components/dashboard/types";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { StyleSheet, View } from "react-native";

interface ExpenseItemProps {
  expense: Expense;
}

export function ExpenseItem({ expense }: ExpenseItemProps) {
  return (
    <ThemedView style={styles.card}>
      <View style={styles.iconContainer}>
        <ThemedText style={styles.icon}>{expense.icon}</ThemedText>
      </View>

      <View style={styles.content}>
        <ThemedText type="defaultSemiBold" style={styles.name}>
          {expense.name}
        </ThemedText>
        <ThemedText style={styles.meta}>
          {expense.category} · {expense.date}
        </ThemedText>
      </View>

      <View style={styles.rightContent}>
        <ThemedText type="defaultSemiBold" style={styles.amount}>
          R{expense.amount.toLocaleString()}
        </ThemedText>
        {expense.deductible && (
          <View style={styles.deductibleBadge}>
            <ThemedText style={styles.deductibleText}>✓ TAX</ThemedText>
          </View>
        )}
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 16,
    padding: 14,
    marginBottom: 8,
  },
  iconContainer: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: "#F5F5F5",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  icon: {
    fontSize: 20,
  },
  content: {
    flex: 1,
  },
  name: {
    fontSize: 13,
    marginBottom: 2,
  },
  meta: {
    fontSize: 11,
    color: "#757575",
  },
  rightContent: {
    alignItems: "flex-end",
    gap: 4,
  },
  amount: {
    fontSize: 14,
    color: "#1565C0",
  },
  deductibleBadge: {
    paddingVertical: 2,
    paddingHorizontal: 7,
    borderRadius: 20,
    backgroundColor: "#0288D120",
    borderWidth: 1,
    borderColor: "#0288D144",
  },
  deductibleText: {
    fontSize: 9,
    fontWeight: "700",
    color: "#1A8A7A",
  },
});
