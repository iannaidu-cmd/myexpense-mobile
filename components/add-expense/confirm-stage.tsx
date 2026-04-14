import { colour, radius, space, typography } from "@/tokens";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
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
  const amountNum =
    parseInt(data.amountRaw.replace(/[^0-9]/g, "")) / 100;
  const vatAmount = ((amountNum * 0.15) / 1.15).toFixed(2);

  const selectedCategory =
    data.categoryIdx !== null ? categories[data.categoryIdx] : null;
  const selectedPayment = paymentMethods[data.paymentMethodIdx];

  const summaryRows = [
    { label: "Vendor",   value: data.vendor,        bold: false },
    { label: "Date",     value: data.dateStr,        bold: false },
    { label: "Amount",   value: amountDisplay,       bold: true  },
    { label: "VAT (incl.)", value: `R ${vatAmount}`, bold: false },
    {
      label: "Category",
      value: selectedCategory
        ? `${selectedCategory.icon} ${selectedCategory.label}`
        : "—",
      bold: false,
    },
    {
      label: "Payment",
      value: `${selectedPayment.icon} ${selectedPayment.label}`,
      bold: false,
    },
    ...(data.note ? [{ label: "Note", value: data.note, bold: false }] : []),
  ];

  return (
    <View style={{ flex: 1, backgroundColor: colour.white }}>
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <View
        style={{
          backgroundColor: colour.primary,
          paddingVertical: space.xl,
          paddingHorizontal: space.xl,
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <TouchableOpacity onPress={onBack} style={{ width: 30, alignItems: "center" }}>
          <Text
            style={{ ...typography.h4, color: colour.onPrimary }}
          >
            ←
          </Text>
        </TouchableOpacity>
        <Text style={{ ...typography.labelM, color: colour.onPrimary }}>
          Confirm Expense
        </Text>
        <View style={{ width: 30 }} />
      </View>

      {/* ── Amount hero ─────────────────────────────────────────────────────── */}
      <View
        style={{
          backgroundColor: colour.primary,
          paddingHorizontal: space.xl,
          paddingBottom: space.xl,
        }}
      >
        <Text style={{ ...typography.caption, color: colour.primary100, marginBottom: space.sm }}>
          Amount
        </Text>
        <Text style={{ ...typography.amountXL, color: colour.onPrimary, marginBottom: space.md }}>
          {amountDisplay}
        </Text>
        {data.isDeductible && (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: space.sm,
              backgroundColor: "rgba(255,255,255,0.18)",
              borderRadius: radius.pill,
              paddingHorizontal: 14,
              paddingVertical: 4,
              alignSelf: "flex-start",
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.3)",
            }}
          >
            <View
              style={{
                width: 6,
                height: 6,
                borderRadius: 3,
                backgroundColor: colour.teal,
              }}
            />
            <Text style={{ ...typography.labelS, color: colour.onPrimary }}>
              Tax Deductible
            </Text>
          </View>
        )}
      </View>

      {/* ── Summary scroll ──────────────────────────────────────────────────── */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: space.xl }}
      >
        {/* Summary card */}
        <View
          style={{
            backgroundColor: colour.white,
            borderRadius: radius.lg,
            borderWidth: 1,
            borderColor: colour.borderLight,
            marginBottom: space.lg,
            overflow: "hidden",
          }}
        >
          {summaryRows.map((row, i) => (
            <View
              key={i}
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                paddingHorizontal: space.lg,
                paddingVertical: space.md,
                ...(i < summaryRows.length - 1
                  ? { borderBottomWidth: 1, borderBottomColor: colour.borderLight }
                  : {}),
              }}
            >
              <Text style={{ ...typography.bodyS, color: colour.textSub }}>
                {row.label}
              </Text>
              <Text
                style={{
                  ...(row.bold ? typography.amountS : typography.labelM),
                  color: row.bold ? colour.primary : colour.text,
                }}
              >
                {row.value}
              </Text>
            </View>
          ))}
        </View>

        {/* Tax saving info */}
        {data.isDeductible && (
          <View
            style={{
              backgroundColor: colour.primary50,
              borderRadius: radius.md,
              paddingVertical: 14,
              paddingHorizontal: space.lg,
              flexDirection: "row",
              gap: 14,
              marginBottom: space.xl,
              borderWidth: 1,
              borderColor: colour.primary100,
            }}
          >
            <Text style={{ fontSize: 28 }}>💡</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ ...typography.labelM, color: colour.primary, marginBottom: 2 }}>
                Estimated tax saving
              </Text>
              <Text style={{ ...typography.amountS, color: colour.primary }}>
                R {(amountNum * 0.45).toFixed(2)}
              </Text>
              <Text style={{ ...typography.bodyXS, color: colour.textHint, marginTop: 2 }}>
                Based on 45% marginal tax rate
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* ── Footer ──────────────────────────────────────────────────────────── */}
      <View
        style={{
          paddingHorizontal: space.xl,
          paddingVertical: space.lg,
          borderTopWidth: 1,
          borderTopColor: colour.borderLight,
        }}
      >
        <TouchableOpacity
          style={{
            backgroundColor: colour.primary,
            borderRadius: radius.pill,
            paddingVertical: 16,
            alignItems: "center",
            marginBottom: space.sm,
          }}
          onPress={onConfirm}
        >
          <Text style={{ ...typography.btnL, color: colour.onPrimary }}>
            ✓ Confirm & Save Expense
          </Text>
        </TouchableOpacity>
        <Text
          style={{
            ...typography.bodyXS,
            color: colour.textHint,
            textAlign: "center",
          }}
        >
          This will be added to your ITR12 records
        </Text>
      </View>
    </View>
  );
}
