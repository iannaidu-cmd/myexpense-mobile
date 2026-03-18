import type { Category } from "@/components/dashboard/types";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { StyleSheet, View } from "react-native";

interface CategoryCardProps {
  category: Category;
}

export function CategoryCard({ category }: CategoryCardProps) {
  return (
    <ThemedView style={styles.card}>
      <View
        style={[
          styles.iconContainer,
          { backgroundColor: category.color + "20" },
        ]}
      >
        <ThemedText style={styles.icon}>{category.icon}</ThemedText>
      </View>

      <View style={styles.content}>
        <View style={styles.nameRow}>
          <ThemedText type="defaultSemiBold">{category.name}</ThemedText>
          <ThemedText type="defaultSemiBold" style={styles.amount}>
            R{category.amount.toLocaleString()}
          </ThemedText>
        </View>

        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${category.pct}%` as any,
                  backgroundColor: category.color,
                },
              ]}
            />
          </View>
        </View>
      </View>

      <ThemedText style={styles.percentage}>{category.pct}%</ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 16,
    padding: 12,
    marginBottom: 8,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  icon: {
    fontSize: 18,
  },
  content: {
    flex: 1,
  },
  nameRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  amount: {
    color: "#1565C0",
  },
  progressContainer: {
    marginBottom: 6,
  },
  progressBar: {
    height: 6,
    borderRadius: 100,
    backgroundColor: "#F5F5F5",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 100,
  },
  percentage: {
    fontSize: 11,
    color: "#757575",
    fontWeight: "600",
    minWidth: 30,
    textAlign: "right",
  },
});
