import { ThemedText } from "@/components/themed-text";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import type { OnboardingData, WorkType } from "./types";

interface SuccessScreenProps {
  data: OnboardingData;
  workTypes: WorkType[];
  onComplete: () => void;
}

export function SuccessScreen({
  data,
  workTypes,
  onComplete,
}: SuccessScreenProps) {
  const selectedWorkType =
    data.workTypeIdx !== null ? workTypes[data.workTypeIdx]?.label : "Not set";
  const taxYear = "2026 (1 Mar – 28 Feb)";

  const summaryRows = [
    { label: "Work type", value: selectedWorkType },
    { label: "Tax number", value: data.taxNumber || "Not added yet" },
    { label: "Tax year", value: taxYear },
  ];

  return (
    <View style={styles.container}>
      {/* Success circle */}
      <View style={styles.successCircle}>
        <ThemedText style={styles.checkmark}>✓</ThemedText>
      </View>

      <ThemedText style={styles.heading}>
        Welcome to MyExpense{data.name ? `, ${data.name}` : ""}!
      </ThemedText>

      <ThemedText style={styles.subtitle}>
        Your account is ready. Start scanning receipts and we'll handle the tax
        categorisation.
      </ThemedText>

      {/* Summary card */}
      <View style={styles.summaryCard}>
        {summaryRows.map((row, i) => (
          <View
            key={i}
            style={[
              styles.summaryRow,
              i < summaryRows.length - 1 && styles.summaryRowBorder,
            ]}
          >
            <ThemedText style={styles.summaryLabel}>{row.label}</ThemedText>
            <ThemedText style={styles.summaryValue}>{row.value}</ThemedText>
          </View>
        ))}
      </View>

      {/* Go to dashboard button */}
      <TouchableOpacity
        style={styles.dashboardButton}
        onPress={onComplete}
        accessibilityRole="button"
        accessibilityLabel="Go to dashboard"
      >
        <ThemedText style={styles.dashboardButtonText}>
          Go to Dashboard →
        </ThemedText>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    paddingHorizontal: 28,
  },
  successCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#006FFD",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 28,
  },
  // Checkmark stays white — it's on the blue circle
  checkmark: {
    fontSize: 48,
    color: "#FFFFFF",
    fontWeight: "900",
  },
  heading: {
    color: "#1F2024",
    fontSize: 26,
    fontWeight: "800",
    marginBottom: 10,
    textAlign: "center",
  },
  subtitle: {
    color: "#494A50",
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 36,
    textAlign: "center",
  },
  // FIX: was rgba(255,255,255,0.05) near-invisible on dark — now clean card on white
  summaryCard: {
    backgroundColor: "#F8F9FE",
    borderRadius: 20,
    paddingVertical: 20,
    paddingHorizontal: 24,
    width: "100%",
    marginBottom: 32,
    borderWidth: 1,
    borderColor: "#E8E9F1",
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 9,
  },
  summaryRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "#E8E9F1",
  },
  summaryLabel: {
    color: "#71727A",
    fontSize: 12,
  },
  summaryValue: {
    color: "#1F2024",
    fontSize: 13,
    fontWeight: "600",
  },
  dashboardButton: {
    backgroundColor: "#006FFD",
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 16,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  dashboardButtonText: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 15,
  },
});
