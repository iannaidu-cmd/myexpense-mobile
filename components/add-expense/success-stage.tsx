import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import type { Category, ExpenseData, PaymentMethod } from "./types";

interface SuccessStageProps {
  data: ExpenseData;
  categories: Category[];
  paymentMethods: PaymentMethod[];
  amountDisplay: string;
  onAddAnother: () => void;
  onViewDashboard: () => void;
}

export function SuccessStage({
  data,
  categories,
  paymentMethods,
  amountDisplay,
  onAddAnother,
  onViewDashboard,
}: SuccessStageProps) {
  const selectedCategory =
    data.categoryIdx !== null ? categories[data.categoryIdx] : null;
  const selectedPayment = paymentMethods[data.paymentMethodIdx];
  const amountNum = parseInt(data.amountRaw.replace(/[^0-9]/g, "")) / 100;

  const summaryRows = [
    {
      label: "Category",
      value: selectedCategory
        ? `${selectedCategory.icon} ${selectedCategory.label}`
        : "—",
    },
    {
      label: "Payment",
      value: `${selectedPayment.icon} ${selectedPayment.label}`,
    },
    {
      label: "Deductible",
      value: data.isDeductible ? "✓ Yes — Section 11(a)" : "✗ No",
    },
    {
      label: "Tax saved (est.)",
      value: data.isDeductible
        ? `R ${(amountNum * 0.45).toFixed(2)}`
        : "R 0.00",
    },
  ];

  return (
    <ThemedView style={styles.container}>
      {/* Success icon */}
      <View style={styles.successCircle}>
        <ThemedText style={styles.checkmark}>✓</ThemedText>
      </View>

      {/* Message */}
      <ThemedText style={styles.heading}>Expense Added!</ThemedText>
      <ThemedText style={styles.subtitle}>
        {data.vendor} — {amountDisplay} has been logged and mapped to your ITR12
        records.
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

      {/* Action buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.primaryButton} onPress={onAddAnother}>
          <ThemedText style={styles.primaryButtonText}>
            + Add Another Expense
          </ThemedText>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={onViewDashboard}
        >
          <ThemedText style={styles.secondaryButtonText}>
            View Dashboard →
          </ThemedText>
        </TouchableOpacity>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    paddingHorizontal: 28,
  },
  successCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "#0288D1",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 28,
  },
  checkmark: {
    fontSize: 46,
    color: "#fff",
    fontWeight: "900",
  },
  heading: {
    fontSize: 24,
    fontWeight: "800",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 13,
    color: "#757575",
    marginBottom: 36,
    textAlign: "center",
  },
  summaryCard: {
    width: "100%",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 20,
    paddingVertical: 20,
    paddingHorizontal: 24,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: "#1976D2",
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 9,
  },
  summaryRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "#1976D2",
  },
  summaryLabel: {
    fontSize: 12,
    color: "#757575",
  },
  summaryValue: {
    fontSize: 13,
    fontWeight: "600",
    color: "#fff",
  },
  buttonContainer: {
    width: "100%",
    gap: 12,
  },
  primaryButton: {
    backgroundColor: "#0288D1",
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 16,
    alignItems: "center",
    marginBottom: 12,
  },
  primaryButtonText: {
    fontWeight: "800",
    fontSize: 15,
    color: "#0D47A1",
  },
  secondaryButton: {
    alignItems: "center",
  },
  secondaryButtonText: {
    fontWeight: "600",
    fontSize: 13,
    color: "#0288D1",
  },
});
