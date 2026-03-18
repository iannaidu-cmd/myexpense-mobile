import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useThemeColor } from "@/hooks/use-theme-color";
import { StyleSheet, View } from "react-native";

interface BudgetCardProps {
  spent: number;
  budget: number;
  percentage: number;
}

export function BudgetCard({ spent, budget, percentage }: BudgetCardProps) {
  const textColor = useThemeColor({}, "text");
  const remaining = budget - spent;

  return (
    <ThemedView style={styles.card}>
      <View style={styles.header}>
        <ThemedText type="defaultSemiBold">Monthly Budget</ThemedText>
        <ThemedText style={styles.amount}>
          R{spent.toLocaleString()} / R{budget.toLocaleString()}
        </ThemedText>
      </View>

      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${Math.min(percentage, 100)}%` as any,
                backgroundColor: percentage > 100 ? "#FF6B6B" : "#0288D1",
              },
            ]}
          />
        </View>
      </View>

      <View style={styles.footer}>
        <ThemedText style={styles.percentageText}>
          {percentage}% used
        </ThemedText>
        <ThemedText
          style={[
            styles.remainingText,
            { color: remaining > 0 ? "#0288D1" : "#FF6B6B" },
          ]}
        >
          R{remaining.toLocaleString()}{" "}
          {remaining > 0 ? "remaining" : "over budget"}
        </ThemedText>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  amount: {
    fontSize: 13,
    color: "#1976D2",
  },
  progressContainer: {
    marginBottom: 12,
  },
  progressBar: {
    height: 10,
    borderRadius: 100,
    backgroundColor: "#F5F5F5",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 100,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  percentageText: {
    fontSize: 11,
    color: "#757575",
  },
  remainingText: {
    fontSize: 11,
    fontWeight: "700",
  },
});
