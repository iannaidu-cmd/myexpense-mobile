import { ThemedText } from "@/components/themed-text";
import { colour } from "@/tokens";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import type { Receipt } from "./types";

interface SuccessStageProps {
  receipt: Receipt;
  onStartOver: () => void;
}

export function SuccessStageComponent({
  receipt,
  onStartOver,
}: SuccessStageProps) {
  return (
    <View style={styles.container}>
      {/* Success Circle */}
      <View style={styles.successCircle}>
        <ThemedText style={styles.successIcon}>✓</ThemedText>
      </View>

      <ThemedText type="title" style={styles.heading}>
        Expense Saved
      </ThemedText>

      <ThemedText style={styles.subtitle}>
        Your receipt has been successfully processed and added to your
        dashboard.
      </ThemedText>

      {/* Details Summary */}
      <View style={styles.summaryBox}>
        <SummaryRow label="Vendor" value={receipt.vendor} highlight={false} />
        <SummaryRow
          label="Amount"
          value={`R ${receipt.total.toLocaleString()}`}
          highlight={true}
        />
        <SummaryRow
          label="Category"
          value={receipt.categoryLabel}
          highlight={false}
        />
        <SummaryRow
          label="Status"
          value="✓ Tax Deductible"
          highlight={false}
          isDeductible={true}
        />
      </View>

      {/* Action Buttons */}
      <TouchableOpacity
        style={styles.viewButton}
        accessibilityRole="button"
        accessibilityLabel="View on dashboard"
      >
        <ThemedText style={styles.viewButtonText}>📊 View Dashboard</ThemedText>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.scanAgainButton}
        onPress={onStartOver}
        accessibilityRole="button"
        accessibilityLabel="Scan another receipt"
      >
        <ThemedText style={styles.scanAgainText}>📸 Scan Another</ThemedText>
      </TouchableOpacity>
    </View>
  );
}

interface SummaryRowProps {
  label: string;
  value: string;
  highlight?: boolean;
  isDeductible?: boolean;
}

function SummaryRow({
  label,
  value,
  highlight = false,
  isDeductible = false,
}: SummaryRowProps) {
  return (
    <View style={styles.summaryRow}>
      <ThemedText style={styles.summaryLabel}>{label}</ThemedText>
      <ThemedText
        style={[
          styles.summaryValue,
          highlight && styles.summaryValueHighlight,
          isDeductible && styles.summaryValueDeductible,
        ]}
      >
        {value}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 700,
    paddingVertical: 40,
    paddingHorizontal: 32,
  },
  successCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: colour.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  successIcon: {
    fontSize: 42,
    color: colour.onPrimary,
    fontWeight: "900",
  },
  heading: {
    marginBottom: 12,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    textAlign: "center",
    opacity: 0.65,
    marginBottom: 28,
    lineHeight: 1.5,
  },
  summaryBox: {
    width: "100%",
    backgroundColor: colour.surface1,
    borderRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 18,
    marginBottom: 28,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: "500",
    opacity: 0.65,
  },
  summaryValue: {
    fontSize: 13,
    fontWeight: "600",
  },
  summaryValueHighlight: {
    fontSize: 16,
    fontWeight: "800",
  },
  summaryValueDeductible: {
    color: colour.primary,
  },
  viewButton: {
    width: "100%",
    backgroundColor: colour.primary,
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  viewButtonText: {
    color: colour.onPrimary,
    fontWeight: "700",
    fontSize: 15,
    textAlign: "center",
  },
  scanAgainButton: {
    width: "100%",
    backgroundColor: "transparent",
    borderRadius: 18,
    borderWidth: 2,
    borderColor: colour.primary,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  scanAgainText: {
    color: colour.primary,
    fontWeight: "700",
    fontSize: 15,
    textAlign: "center",
  },
});
