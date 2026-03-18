import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import type { Category, ExpenseData, PaymentMethod } from "./types";

interface ConfirmStageProps {
  data: ExpenseData;
  categories: Category[];
  paymentMethods: PaymentMethod[];
  onBack: () => void;
  onConfirm: () => void;
}

function formatAmount(raw: string): string {
  const num = raw.replace(/[^0-9]/g, "");
  if (!num) return "0.00";
  const cents = parseInt(num);
  return (cents / 100).toLocaleString("en-ZA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function ConfirmStage({
  data,
  categories,
  paymentMethods,
  onBack,
  onConfirm,
}: ConfirmStageProps) {
  const amountDisplay = `R ${formatAmount(data.amountRaw)}`;
  const amountNum = parseInt(data.amountRaw.replace(/[^0-9]/g, "")) / 100;
  const vatAmount = ((amountNum * 0.15) / 1.15).toFixed(2);
  const selectedCategory =
    data.categoryIdx !== null ? categories[data.categoryIdx] : null;
  const selectedPayment = paymentMethods[data.paymentMethodIdx];

  const summaryRows = [
    { label: "Vendor", value: data.vendor },
    { label: "Date", value: data.dateStr },
    { label: "Amount", value: amountDisplay, bold: true },
    { label: "VAT (incl.)", value: `R ${vatAmount}` },
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
    ...(data.note ? [{ label: "Note", value: data.note }] : []),
  ];

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <ThemedText style={styles.backArrow}>←</ThemedText>
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle}>Confirm Expense</ThemedText>
        <View style={{ width: 30 }} />
      </View>

      {/* Amount display */}
      <View style={styles.amountSection}>
        <ThemedText style={styles.amountLabel}>Amount</ThemedText>
        <ThemedText style={styles.amount}>{amountDisplay}</ThemedText>
        {data.isDeductible && (
          <View style={styles.deductibleBadge}>
            <View style={styles.deductibleDot} />
            <ThemedText style={styles.deductibleText}>
              Tax Deductible
            </ThemedText>
          </View>
        )}
      </View>

      {/* Summary */}
      <ScrollView style={styles.scrollContainer}>
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
              <ThemedText
                style={[
                  styles.summaryValue,
                  row.bold && styles.summaryValueBold,
                ]}
              >
                {row.value}
              </ThemedText>
            </View>
          ))}
        </View>

        {/* Tax saving info */}
        {data.isDeductible && (
          <View style={styles.taxInfo}>
            <ThemedText style={styles.taxInfoIcon}>💡</ThemedText>
            <View style={styles.taxInfoContent}>
              <ThemedText style={styles.taxInfoTitle}>
                Estimated tax saving
              </ThemedText>
              <ThemedText style={styles.taxInfoValue}>
                R {(amountNum * 0.45).toFixed(2)}
              </ThemedText>
              <ThemedText style={styles.taxInfoSubtitle}>
                Based on 45% marginal tax rate
              </ThemedText>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Footer buttons */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.confirmButton} onPress={onConfirm}>
          <ThemedText style={styles.confirmButtonText}>
            ✓ Confirm & Save Expense
          </ThemedText>
        </TouchableOpacity>
        <ThemedText style={styles.footerNote}>
          This will be added to your ITR12 records
        </ThemedText>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    backgroundColor: "#1565C0",
    paddingVertical: 20,
    paddingHorizontal: 24,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  backButton: {
    width: 30,
    alignItems: "center",
  },
  backArrow: {
    fontSize: 22,
    fontWeight: "600",
    color: "#757575",
  },
  headerTitle: {
    fontSize: 12,
    color: "#757575",
    fontWeight: "600",
  },
  amountSection: {
    backgroundColor: "#1565C0",
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  amountLabel: {
    fontSize: 12,
    color: "#757575",
    marginBottom: 8,
  },
  amount: {
    fontSize: 40,
    fontWeight: "900",
    color: "#0288D1",
    marginBottom: 10,
  },
  deductibleBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(2,136,209,0.18)",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 4,
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: "rgba(2,136,209,0.35)",
  },
  deductibleDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#0288D1",
  },
  deductibleText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#0288D1",
  },
  scrollContainer: {
    flex: 1,
    padding: 20,
  },
  summaryCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    marginBottom: 16,
    overflow: "hidden",
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  summaryRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "#F5F5F5",
  },
  summaryLabel: {
    fontSize: 12,
    color: "#757575",
  },
  summaryValue: {
    fontSize: 13,
    fontWeight: "600",
    color: "#0D47A1",
  },
  summaryValueBold: {
    fontSize: 16,
    fontWeight: "800",
    color: "#1565C0",
  },
  taxInfo: {
    backgroundColor: "rgba(2,136,209,0.10)",
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 18,
    flexDirection: "row",
    gap: 14,
    marginBottom: 20,
    borderWidth: 1.5,
    borderColor: "rgba(2,136,209,0.25)",
  },
  taxInfoIcon: {
    fontSize: 28,
  },
  taxInfoContent: {
    flex: 1,
  },
  taxInfoTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0288D1",
    marginBottom: 2,
  },
  taxInfoValue: {
    fontSize: 13,
    fontWeight: "800",
    color: "#1565C0",
  },
  taxInfoSubtitle: {
    fontSize: 11,
    color: "#757575",
    marginTop: 2,
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  confirmButton: {
    backgroundColor: "#1565C0",
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 10,
  },
  confirmButtonText: {
    fontWeight: "700",
    fontSize: 15,
    color: "#fff",
  },
  footerNote: {
    textAlign: "center",
    fontSize: 12,
    color: "#757575",
  },
});
