import { colour, radius, space, typography } from "@/tokens";
import {
  ScrollView,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { NumericKeypad } from "./numeric-keypad";
import type { Category, ExpenseData, PaymentMethod } from "./types";

interface FormStageProps {
  data: ExpenseData;
  categories: Category[];
  paymentMethods: PaymentMethod[];
  onDataChange: (updates: Partial<ExpenseData>) => void;
  onCategorySelect: () => void;
  onConfirm: () => void;
  focusedField: string | null;
  setFocusedField: (field: string | null) => void;
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

export function FormStage({
  data,
  categories,
  paymentMethods,
  onDataChange,
  onCategorySelect,
  onConfirm,
  focusedField,
  setFocusedField,
}: FormStageProps) {
  const amountDisplay = data.amountRaw
    ? `R ${formatAmount(data.amountRaw)}`
    : "R 0.00";
  const isValid = data.amountRaw && data.vendor && data.categoryIdx !== null;

  const handleKeyPress = (key: string) => {
    if (key === "⌫") {
      onDataChange({ amountRaw: data.amountRaw.slice(0, -1) });
    } else if (key === "." && data.amountRaw.includes(".")) {
      return;
    } else {
      onDataChange({ amountRaw: data.amountRaw + key });
    }
  };

  const selectedCategory =
    data.categoryIdx !== null ? categories[data.categoryIdx] : null;

  return (
    <View style={{ flex: 1, backgroundColor: colour.white }}>
      {/* ── Amount header ────────────────────────────────────────────────────── */}
      <View
        style={{
          backgroundColor: colour.primary,
          paddingVertical: space.xl,
          paddingHorizontal: space.xl,
        }}
      >
        <Text
          style={{
            ...typography.labelS,
            color: colour.primary100,
            marginBottom: space.sm,
          }}
        >
          AMOUNT
        </Text>
        <Text style={{ ...typography.amountXL, color: colour.onPrimary }}>
          {amountDisplay}
        </Text>
      </View>

      {/* ── Form body ────────────────────────────────────────────────────────── */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: space.xl }}
      >
        {/* Numeric keypad */}
        <View style={{ marginBottom: 18 }}>
          <NumericKeypad onKeyPress={handleKeyPress} />
        </View>

        {/* ── Vendor ─────────────────────────────────────────────────────────── */}
        <View style={{ marginBottom: 14 }}>
          <Text
            style={{
              ...typography.labelS,
              color: colour.primary,
              marginBottom: space.sm,
            }}
          >
            VENDOR / SUPPLIER
          </Text>
          <View
            style={{
              backgroundColor: colour.white,
              borderRadius: radius.md,
              borderWidth: 1.5,
              borderColor:
                focusedField === "vendor" ? colour.primary : colour.borderLight,
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: 14,
              paddingVertical: 13,
            }}
          >
            <Text style={{ fontSize: 18, marginRight: space.sm }}>🏪</Text>
            <TextInput
              value={data.vendor}
              onChangeText={(vendor) => onDataChange({ vendor })}
              onFocus={() => setFocusedField("vendor")}
              onBlur={() => setFocusedField(null)}
              placeholder="e.g. Incredible Connection"
              placeholderTextColor={colour.textHint}
              style={{ ...typography.bodyM, flex: 1, color: colour.text }}
            />
            {data.vendor ? (
              <TouchableOpacity onPress={() => onDataChange({ vendor: "" })}>
                <Text style={{ fontSize: 18, color: colour.textSub }}>×</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        {/* ── Date ───────────────────────────────────────────────────────────── */}
        <View style={{ marginBottom: 14 }}>
          <Text
            style={{
              ...typography.labelS,
              color: colour.primary,
              marginBottom: space.sm,
            }}
          >
            DATE
          </Text>
          <View
            style={{
              backgroundColor: colour.white,
              borderRadius: radius.md,
              borderWidth: 1.5,
              borderColor: colour.borderLight,
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: 14,
              paddingVertical: 13,
            }}
          >
            <Text style={{ fontSize: 18, marginRight: space.sm }}>📅</Text>
            <TextInput
              value={data.dateStr}
              onChangeText={(dateStr) => onDataChange({ dateStr })}
              placeholder="DD MMM YYYY"
              placeholderTextColor={colour.textHint}
              style={{ ...typography.bodyM, flex: 1, color: colour.text }}
            />
            <Text style={{ ...typography.actionS, color: colour.primary }}>
              Today
            </Text>
          </View>
        </View>

        {/* ── Category ───────────────────────────────────────────────────────── */}
        <View style={{ marginBottom: 14 }}>
          <Text
            style={{
              ...typography.labelS,
              color: colour.primary,
              marginBottom: space.sm,
            }}
          >
            ITR12 CATEGORY
          </Text>
          <TouchableOpacity
            style={{
              backgroundColor: colour.white,
              borderRadius: radius.md,
              borderWidth: 1.5,
              borderColor: selectedCategory
                ? selectedCategory.color
                : colour.borderLight,
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: 14,
              paddingVertical: 13,
            }}
            onPress={onCategorySelect}
          >
            {selectedCategory ? (
              <>
                <Text style={{ fontSize: 18, marginRight: space.sm }}>
                  {selectedCategory.icon}
                </Text>
                <Text
                  style={{
                    ...typography.labelM,
                    flex: 1,
                    color: colour.text,
                  }}
                >
                  {selectedCategory.label}
                </Text>
                <View
                  style={{
                    backgroundColor: selectedCategory.color + "20",
                    borderRadius: radius.pill,
                    paddingHorizontal: space.sm,
                    paddingVertical: 3,
                  }}
                >
                  <Text
                    style={{
                      ...typography.micro,
                      fontWeight: "700",
                      color: selectedCategory.color,
                    }}
                  >
                    {selectedCategory.code}
                  </Text>
                </View>
              </>
            ) : (
              <>
                <Text style={{ fontSize: 18, marginRight: space.sm }}>🏷️</Text>
                <Text
                  style={{ ...typography.bodyM, flex: 1, color: colour.textHint }}
                >
                  Select category…
                </Text>
                <Text style={{ ...typography.bodyL, color: colour.primary }}>
                  ›
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* ── Payment method ─────────────────────────────────────────────────── */}
        <View style={{ marginBottom: 14 }}>
          <Text
            style={{
              ...typography.labelS,
              color: colour.primary,
              marginBottom: space.sm,
            }}
          >
            PAYMENT METHOD
          </Text>
          <View style={{ flexDirection: "row", gap: space.sm }}>
            {paymentMethods.map((pm, i) => {
              const selected = data.paymentMethodIdx === i;
              return (
                <TouchableOpacity
                  key={i}
                  style={{
                    flex: 1,
                    alignItems: "center",
                    paddingVertical: space.md,
                    paddingHorizontal: space.sm,
                    borderRadius: radius.md,
                    backgroundColor: selected ? colour.primary50 : colour.white,
                    borderWidth: 1.5,
                    borderColor: selected ? colour.primary : colour.borderLight,
                  }}
                  onPress={() => onDataChange({ paymentMethodIdx: i })}
                >
                  <Text style={{ fontSize: 20, marginBottom: space.xs }}>
                    {pm.icon}
                  </Text>
                  <Text
                    style={{
                      ...typography.micro,
                      fontWeight: "600",
                      textAlign: "center",
                      color: selected ? colour.primary : colour.textSub,
                    }}
                  >
                    {pm.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ── Deductible toggle ──────────────────────────────────────────────── */}
        <View style={{ marginBottom: 14 }}>
          <View
            style={{
              backgroundColor: colour.white,
              borderRadius: radius.md,
              borderWidth: 1.5,
              borderColor: colour.borderLight,
              paddingHorizontal: space.lg,
              paddingVertical: 14,
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm, flex: 1 }}>
              <Text style={{ fontSize: 20 }}>💡</Text>
              <View>
                <Text style={{ ...typography.labelM, color: colour.text }}>
                  Tax Deductible
                </Text>
                <Text style={{ ...typography.bodyXS, color: colour.textSub }}>
                  Mark for ITR12 deduction
                </Text>
              </View>
            </View>
            <Switch
              value={data.isDeductible}
              onValueChange={(isDeductible) => onDataChange({ isDeductible })}
              trackColor={{ false: colour.border, true: colour.primary }}
              thumbColor={colour.white}
            />
          </View>
        </View>

        {/* ── Note ───────────────────────────────────────────────────────────── */}
        <View style={{ marginBottom: 14 }}>
          <Text
            style={{
              ...typography.labelS,
              color: colour.primary,
              marginBottom: space.sm,
            }}
          >
            NOTE{" "}
            <Text style={{ ...typography.bodyXS, color: colour.textHint }}>
              (optional)
            </Text>
          </Text>
          <View
            style={{
              backgroundColor: colour.white,
              borderRadius: radius.md,
              borderWidth: 1.5,
              minHeight: 80,
              borderColor:
                focusedField === "note" ? colour.primary : colour.borderLight,
              paddingHorizontal: 14,
              paddingVertical: 13,
            }}
          >
            <TextInput
              value={data.note}
              onChangeText={(note) => onDataChange({ note })}
              onFocus={() => setFocusedField("note")}
              onBlur={() => setFocusedField(null)}
              placeholder="e.g. Client meeting at Vida e Caffè"
              placeholderTextColor={colour.textHint}
              multiline
              style={{ ...typography.bodyM, flex: 1, color: colour.text }}
            />
          </View>
        </View>

        {/* ── Attach receipt hint ────────────────────────────────────────────── */}
        <TouchableOpacity
          style={{
            backgroundColor: colour.primary50,
            borderRadius: radius.md,
            paddingVertical: 12,
            paddingHorizontal: space.lg,
            flexDirection: "row",
            alignItems: "center",
            marginBottom: 22,
            borderWidth: 1.5,
            borderStyle: "dashed",
            borderColor: colour.primary100,
          }}
        >
          <View
            style={{
              width: 36,
              height: 36,
              borderRadius: radius.sm,
              backgroundColor: colour.primary100,
              alignItems: "center",
              justifyContent: "center",
              marginRight: space.md,
            }}
          >
            <Text style={{ fontSize: 18 }}>📸</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ ...typography.labelM, color: colour.primary }}>
              Attach Receipt
            </Text>
            <Text style={{ ...typography.bodyXS, color: colour.textSub }}>
              Scan or upload for full ITR12 compliance
            </Text>
          </View>
          <Text style={{ ...typography.h4, color: colour.primary }}>+</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* ── Submit button ─────────────────────────────────────────────────────── */}
      <View style={{ padding: space.xl }}>
        <TouchableOpacity
          style={{
            backgroundColor: isValid ? colour.primary : colour.surface2,
            borderRadius: radius.pill,
            paddingVertical: 16,
            alignItems: "center",
            opacity: isValid ? 1 : 0.6,
          }}
          onPress={onConfirm}
          disabled={!isValid}
        >
          <Text
            style={{
              ...typography.btnL,
              color: isValid ? colour.onPrimary : colour.textDisabled,
            }}
          >
            Review Expense →
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
