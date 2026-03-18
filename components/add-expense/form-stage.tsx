import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import {
    ScrollView,
    StyleSheet,
    Switch,
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
    <ThemedView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <ThemedText style={styles.amountLabel}>AMOUNT</ThemedText>
          <ThemedText style={styles.amountValue}>{amountDisplay}</ThemedText>
        </View>
      </View>

      {/* Scrollable form */}
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Numeric keypad */}
        <View style={styles.keypadContainer}>
          <NumericKeypad onKeyPress={handleKeyPress} />
        </View>

        {/* Vendor field */}
        <View style={styles.fieldGroup}>
          <ThemedText style={styles.fieldLabel}>VENDOR / SUPPLIER</ThemedText>
          <View
            style={[
              styles.inputContainer,
              focusedField === "vendor" && styles.inputFocused,
            ]}
          >
            <ThemedText style={styles.fieldIcon}>🏪</ThemedText>
            <TextInput
              value={data.vendor}
              onChangeText={(vendor) => onDataChange({ vendor })}
              onFocus={() => setFocusedField("vendor")}
              onBlur={() => setFocusedField(null)}
              placeholder="e.g. Incredible Connection"
              placeholderTextColor="#AAAACC"
              style={styles.textInput}
            />
            {data.vendor && (
              <TouchableOpacity onPress={() => onDataChange({ vendor: "" })}>
                <ThemedText style={styles.clearIcon}>×</ThemedText>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Date field */}
        <View style={styles.fieldGroup}>
          <ThemedText style={styles.fieldLabel}>DATE</ThemedText>
          <View style={styles.inputContainer}>
            <ThemedText style={styles.fieldIcon}>📅</ThemedText>
            <TextInput
              value={data.dateStr}
              onChangeText={(dateStr) => onDataChange({ dateStr })}
              placeholder="DD MMM YYYY"
              placeholderTextColor="#AAAACC"
              style={styles.textInput}
            />
            <ThemedText style={styles.todayBadge}>Today</ThemedText>
          </View>
        </View>

        {/* Category selector */}
        <View style={styles.fieldGroup}>
          <ThemedText style={styles.fieldLabel}>ITR12 CATEGORY</ThemedText>
          <TouchableOpacity
            style={[
              styles.inputContainer,
              selectedCategory && { borderColor: selectedCategory.color },
            ]}
            onPress={onCategorySelect}
          >
            {selectedCategory ? (
              <>
                <ThemedText style={styles.fieldIcon}>
                  {selectedCategory.icon}
                </ThemedText>
                <ThemedText style={styles.categoryLabel}>
                  {selectedCategory.label}
                </ThemedText>
                <View
                  style={[
                    styles.categoryBadge,
                    { backgroundColor: selectedCategory.color + "20" },
                  ]}
                >
                  <ThemedText
                    style={[
                      styles.categoryCode,
                      { color: selectedCategory.color },
                    ]}
                  >
                    {selectedCategory.code}
                  </ThemedText>
                </View>
              </>
            ) : (
              <>
                <ThemedText style={styles.fieldIcon}>🏷️</ThemedText>
                <ThemedText style={styles.placeholder}>
                  Select category…
                </ThemedText>
                <ThemedText style={styles.chevron}>›</ThemedText>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Payment method */}
        <View style={styles.fieldGroup}>
          <ThemedText style={styles.fieldLabel}>PAYMENT METHOD</ThemedText>
          <View style={styles.paymentGrid}>
            {paymentMethods.map((pm, i) => (
              <TouchableOpacity
                key={i}
                style={[
                  styles.paymentOption,
                  data.paymentMethodIdx === i && styles.paymentSelected,
                ]}
                onPress={() => onDataChange({ paymentMethodIdx: i })}
              >
                <ThemedText style={styles.paymentIcon}>{pm.icon}</ThemedText>
                <ThemedText style={styles.paymentLabel}>{pm.label}</ThemedText>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Deductible toggle */}
        <View style={styles.fieldGroup}>
          <View style={styles.deductibleContainer}>
            <View style={styles.deductibleLeft}>
              <ThemedText style={styles.deductibleIcon}>💡</ThemedText>
              <View>
                <ThemedText style={styles.deductibleTitle}>
                  Tax Deductible
                </ThemedText>
                <ThemedText style={styles.deductibleSubtitle}>
                  Mark for ITR12 deduction
                </ThemedText>
              </View>
            </View>
            <Switch
              value={data.isDeductible}
              onValueChange={(isDeductible) => onDataChange({ isDeductible })}
              trackColor={{ false: "#E0E0E0", true: "#0288D1" }}
              thumbColor="#fff"
            />
          </View>
        </View>

        {/* Note field */}
        <View style={styles.fieldGroup}>
          <ThemedText style={styles.fieldLabel}>
            NOTE <ThemedText style={styles.optional}>(optional)</ThemedText>
          </ThemedText>
          <View
            style={[
              styles.inputContainer,
              { minHeight: 80 },
              focusedField === "note" && styles.inputFocused,
            ]}
          >
            <TextInput
              value={data.note}
              onChangeText={(note) => onDataChange({ note })}
              onFocus={() => setFocusedField("note")}
              onBlur={() => setFocusedField(null)}
              placeholder="e.g. Client meeting at Vida e Caffè"
              placeholderTextColor="#AAAACC"
              multiline
              style={styles.textArea}
            />
          </View>
        </View>

        {/* Attach receipt hint */}
        <TouchableOpacity style={styles.attachReceipt}>
          <ThemedText style={styles.attachIcon}>📸</ThemedText>
          <View style={styles.attachText}>
            <ThemedText style={styles.attachTitle}>Attach Receipt</ThemedText>
            <ThemedText style={styles.attachSubtitle}>
              Scan or upload for full ITR12 compliance
            </ThemedText>
          </View>
          <ThemedText style={styles.attachPlus}>+</ThemedText>
        </TouchableOpacity>
      </ScrollView>

      {/* Submit button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.submitButton, !isValid && styles.submitDisabled]}
          onPress={onConfirm}
          disabled={!isValid}
        >
          <ThemedText style={styles.submitText}>Review Expense →</ThemedText>
        </TouchableOpacity>
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
  },
  amountLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#757575",
    marginBottom: 8,
  },
  amountValue: {
    fontSize: 48,
    fontWeight: "900",
    color: "#0288D1",
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  keypadContainer: {
    marginBottom: 18,
  },
  fieldGroup: {
    marginBottom: 14,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#1565C0",
    marginBottom: 8,
  },
  optional: {
    color: "#757575",
    fontWeight: "400",
  },
  inputContainer: {
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#F5F5F5",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  inputFocused: {
    borderColor: "#1565C0",
  },
  fieldIcon: {
    fontSize: 18,
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: "#0D47A1",
    paddingVertical: 0,
  },
  textArea: {
    flex: 1,
    fontSize: 14,
    color: "#0D47A1",
    textAlignVertical: "top",
  },
  clearIcon: {
    fontSize: 18,
    color: "#757575",
  },
  todayBadge: {
    fontSize: 12,
    fontWeight: "600",
    color: "#0288D1",
  },
  categoryLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    color: "#0D47A1",
  },
  categoryBadge: {
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  categoryCode: {
    fontSize: 10,
    fontWeight: "700",
  },
  placeholder: {
    flex: 1,
    fontSize: 14,
    color: "#757575",
  },
  chevron: {
    fontSize: 18,
    color: "#0288D1",
  },
  paymentGrid: {
    flexDirection: "row",
    gap: 8,
  },
  paymentOption: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 12,
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderColor: "#F5F5F5",
  },
  paymentSelected: {
    backgroundColor: "#F5F5F5",
    borderColor: "#1565C0",
  },
  paymentIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  paymentLabel: {
    fontSize: 9,
    fontWeight: "600",
    textAlign: "center",
  },
  deductibleContainer: {
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#F5F5F5",
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  deductibleLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  deductibleIcon: {
    fontSize: 20,
  },
  deductibleTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#0D47A1",
  },
  deductibleSubtitle: {
    fontSize: 11,
    color: "#757575",
  },
  attachReceipt: {
    backgroundColor: "rgba(21,101,192,0.05)",
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 22,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: "#E0E0E0",
  },
  attachIcon: {
    fontSize: 18,
    width: 36,
    height: 36,
    backgroundColor: "rgba(2,136,209,0.15)",
    textAlign: "center",
    textAlignVertical: "center",
    borderRadius: 10,
    marginRight: 12,
  },
  attachText: {
    flex: 1,
  },
  attachTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1565C0",
  },
  attachSubtitle: {
    fontSize: 11,
    color: "#757575",
  },
  attachPlus: {
    color: "#0288D1",
    fontSize: 18,
  },
  footer: {
    padding: 20,
  },
  submitButton: {
    backgroundColor: "#1565C0",
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: "center",
  },
  submitDisabled: {
    opacity: 0.5,
  },
  submitText: {
    fontWeight: "700",
    fontSize: 15,
    color: "#fff",
  },
});
