import { colour, radius, space, typography } from "@/tokens";
import { Text, TouchableOpacity, View } from "react-native";
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
  const amountNum =
    parseInt(data.amountRaw.replace(/[^0-9]/g, "")) / 100;

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
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 40,
        paddingHorizontal: 28,
        backgroundColor: colour.white,
      }}
    >
      {/* Success icon */}
      <View
        style={{
          width: 96,
          height: 96,
          borderRadius: 48,
          backgroundColor: colour.primary,
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 28,
        }}
      >
        <Text style={{ fontSize: 46, color: colour.white, fontWeight: "900" }}>
          ✓
        </Text>
      </View>

      {/* Message */}
      <Text
        style={{
          ...typography.h2,
          color: colour.text,
          marginBottom: space.sm,
          textAlign: "center",
        }}
      >
        Expense Added!
      </Text>
      <Text
        style={{
          ...typography.bodyS,
          color: colour.textSub,
          marginBottom: 36,
          textAlign: "center",
        }}
      >
        {data.vendor} — {amountDisplay} has been logged and mapped to your
        ITR12 records.
      </Text>

      {/* Summary card */}
      <View
        style={{
          width: "100%",
          backgroundColor: colour.surface1,
          borderRadius: radius.lg,
          paddingVertical: space.xl,
          paddingHorizontal: space.xl,
          marginBottom: 32,
          borderWidth: 1,
          borderColor: colour.borderLight,
        }}
      >
        {summaryRows.map((row, i) => (
          <View
            key={i}
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              paddingVertical: 9,
              ...(i < summaryRows.length - 1
                ? { borderBottomWidth: 1, borderBottomColor: colour.border }
                : {}),
            }}
          >
            <Text style={{ ...typography.bodyS, color: colour.textSub }}>
              {row.label}
            </Text>
            <Text style={{ ...typography.labelM, color: colour.text }}>
              {row.value}
            </Text>
          </View>
        ))}
      </View>

      {/* Action buttons */}
      <View style={{ width: "100%", gap: space.md }}>
        <TouchableOpacity
          style={{
            backgroundColor: colour.primary,
            borderRadius: radius.pill,
            paddingVertical: 16,
            paddingHorizontal: space.lg,
            alignItems: "center",
          }}
          onPress={onAddAnother}
        >
          <Text style={{ ...typography.btnL, color: colour.onPrimary }}>
            + Add Another Expense
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={{ alignItems: "center", paddingVertical: space.sm }}
          onPress={onViewDashboard}
        >
          <Text style={{ ...typography.actionM, color: colour.primary }}>
            View Dashboard →
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
