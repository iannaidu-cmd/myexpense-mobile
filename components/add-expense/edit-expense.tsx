import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useThemeColor } from "@/hooks/use-theme-color";
import { useState } from "react";
import {
    Pressable,
    ScrollView,
    StyleSheet,
    Switch,
    TextInput,
    View,
} from "react-native";

interface Category {
  label: string;
  icon: string;
  color: string;
  code: string;
}

interface ExpenseData {
  id: string;
  vendor: string;
  amount: string;
  date: string;
  note: string;
  categoryCode: string;
  isDeductible: boolean;
}

const CATEGORIES: Category[] = [
  { label: "Travel & Transport", icon: "🚗", color: "#0288D1", code: "TRAVEL" },
  {
    label: "Office & Stationery",
    icon: "📁",
    color: "#1565C0",
    code: "OFFICE",
  },
  { label: "Software & Tech", icon: "💻", color: "#1976D2", code: "SOFTWARE" },
  {
    label: "Meals & Entertainment",
    icon: "🍽️",
    color: "#0D47A1",
    code: "MEALS",
  },
  {
    label: "Professional Services",
    icon: "📋",
    color: "#1565C0",
    code: "PROF",
  },
  { label: "Home Office", icon: "🏠", color: "#0288D1", code: "HOME" },
  { label: "Vehicle & Fuel", icon: "⛽", color: "#1976D2", code: "FUEL" },
  { label: "Other", icon: "📦", color: "#90CAF9", code: "OTHER" },
];

interface EditExpenseScreenProps {
  expenseData?: ExpenseData;
  onSave?: (data: ExpenseData) => void;
  onDelete?: () => void;
  onCancel?: () => void;
}

export function EditExpenseScreen({
  expenseData = {
    id: "1",
    vendor: "Incredible Connection",
    amount: "1249.00",
    date: "12 Mar 2026",
    note: "USB-C Hub and HDMI cables for home office setup",
    categoryCode: "SOFTWARE",
    isDeductible: true,
  },
  onSave,
  onDelete,
  onCancel,
}: EditExpenseScreenProps) {
  const [vendor, setVendor] = useState(expenseData.vendor);
  const [amount, setAmount] = useState(expenseData.amount);
  const [date, setDate] = useState(expenseData.date);
  const [note, setNote] = useState(expenseData.note);
  const [selectedCatCode, setSelectedCatCode] = useState(
    expenseData.categoryCode,
  );
  const [isDeductible, setIsDeductible] = useState(expenseData.isDeductible);
  const [showCategorySheet, setShowCategorySheet] = useState(false);
  const [saved, setSaved] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const backgroundColor = useThemeColor(
    { light: "#FFFFFF", dark: "#121212" },
    "background",
  );
  const cardBackground = useThemeColor(
    { light: "#F5F5F5", dark: "#1E1E1E" },
    "background",
  );
  const textColor = useThemeColor({}, "text");
  const mutedColor = useThemeColor(
    { light: "#757575", dark: "#9E9E9E" },
    "text",
  );
  const borderColor = useThemeColor(
    { light: "#E0E0E0", dark: "#424242" },
    "text",
  );
  const accentColor = "#0288D1";
  const accentDark = "#0D47A1";
  const errorColor = "#E53935";

  const selectedCategory =
    CATEGORIES.find((c) => c.code === selectedCatCode) || CATEGORIES[2];

  const handleSave = () => {
    const updatedData: ExpenseData = {
      ...expenseData,
      vendor,
      amount,
      date,
      note,
      categoryCode: selectedCatCode,
      isDeductible,
    };
    onSave?.(updatedData);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor,
    },
    header: {
      paddingHorizontal: 24,
      paddingTop: 20,
      paddingBottom: 24,
      backgroundColor: "rgba(21, 101, 192, 0.95)",
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: "700",
      color: "#fff",
      marginBottom: 4,
    },
    headerSubtitle: {
      fontSize: 13,
      color: "rgba(255, 255, 255, 0.55)",
    },
    content: {
      flex: 1,
      padding: 20,
    },
    formSection: {
      marginBottom: 24,
    },
    sectionLabel: {
      fontSize: 12,
      fontWeight: "600",
      color: mutedColor,
      marginBottom: 10,
      letterSpacing: 0.5,
    },
    inputContainer: {
      backgroundColor: cardBackground,
      borderRadius: 12,
      borderWidth: 1.5,
      borderColor: borderColor,
      paddingHorizontal: 16,
      paddingVertical: 12,
      marginBottom: 12,
    },
    inputContainerFocused: {
      borderColor: accentColor,
      backgroundColor: "rgba(2, 136, 209, 0.05)",
    },
    input: {
      fontSize: 16,
      color: textColor,
      fontWeight: "500",
    },
    inputLabel: {
      fontSize: 12,
      color: mutedColor,
      marginBottom: 4,
      fontWeight: "600",
    },
    categoryButton: {
      backgroundColor: cardBackground,
      borderRadius: 12,
      borderWidth: 1.5,
      borderColor: borderColor,
      paddingHorizontal: 16,
      paddingVertical: 12,
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    categoryButtonSelected: {
      borderColor: accentColor,
      backgroundColor: "rgba(2, 136, 209, 0.05)",
    },
    categoryIcon: {
      fontSize: 24,
    },
    categoryLabel: {
      fontSize: 16,
      fontWeight: "600",
      color: textColor,
      flex: 1,
    },
    categorySubtext: {
      fontSize: 12,
      color: mutedColor,
      marginTop: 2,
    },
    deductibleRow: {
      backgroundColor: cardBackground,
      borderRadius: 12,
      borderWidth: 1.5,
      borderColor: borderColor,
      paddingHorizontal: 16,
      paddingVertical: 12,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 12,
    },
    deductibleLabel: {
      fontSize: 16,
      fontWeight: "600",
      color: textColor,
    },
    deductibleSubtext: {
      fontSize: 12,
      color: mutedColor,
      marginTop: 2,
    },
    deductibleContainer: {
      flexDirection: "column",
      flex: 1,
    },
    buttonRow: {
      flexDirection: "row",
      gap: 12,
      marginTop: 24,
    },
    saveButton: {
      flex: 1,
      backgroundColor: accentColor,
      borderRadius: 12,
      paddingVertical: 14,
      alignItems: "center",
    },
    saveButtonText: {
      fontWeight: "700",
      fontSize: 15,
      color: "#FFFFFF",
    },
    deleteButton: {
      paddingVertical: 14,
      paddingHorizontal: 16,
      borderRadius: 12,
      borderWidth: 1.5,
      borderColor: errorColor,
      alignItems: "center",
    },
    deleteButtonText: {
      fontWeight: "700",
      fontSize: 15,
      color: errorColor,
    },
    successIcon: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: accentColor,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 20,
    },
    successTitle: {
      fontSize: 22,
      fontWeight: "800",
      color: "#fff",
      marginBottom: 8,
    },
    successMessage: {
      fontSize: 13,
      color: "rgba(255, 255, 255, 0.55)",
      marginBottom: 32,
      textAlign: "center",
    },
    categorySheet: {
      maxHeight: "80%",
    },
    categoryOption: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: borderColor,
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    categoryOptionIcon: {
      fontSize: 24,
    },
    categoryOptionText: {
      fontSize: 15,
      fontWeight: "600",
      color: textColor,
    },
  });

  if (saved) {
    return (
      <ThemedView style={styles.container}>
        <ThemedView
          style={[
            styles.content,
            {
              justifyContent: "center",
              alignItems: "center",
              // background property removed; not valid for ViewStyle
              // Removed invalid linear-gradient string; not valid for ViewStyle
            },
          ]}
        >
          <View style={styles.successIcon}>
            <ThemedText style={{ fontSize: 38 }}>✓</ThemedText>
          </View>
          <ThemedText style={styles.successTitle}>Changes Saved!</ThemedText>
          <ThemedText style={styles.successMessage}>
            Your expense has been updated.
          </ThemedText>
        </ThemedView>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedText style={styles.headerTitle}>Edit Expense</ThemedText>
        <ThemedText style={styles.headerSubtitle}>
          Update the expense details
        </ThemedText>
      </ThemedView>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Vendor */}
        <View style={styles.formSection}>
          <ThemedText style={styles.sectionLabel}>Vendor</ThemedText>
          <View
            style={[
              styles.inputContainer,
              focusedField === "vendor" && styles.inputContainerFocused,
            ]}
          >
            <ThemedText style={styles.inputLabel}>
              Business or supplier name
            </ThemedText>
            <TextInput
              style={styles.input}
              value={vendor}
              onChangeText={setVendor}
              onFocus={() => setFocusedField("vendor")}
              onBlur={() => setFocusedField(null)}
              placeholder="Enter vendor name"
              placeholderTextColor={mutedColor}
            />
          </View>
        </View>

        {/* Amount */}
        <View style={styles.formSection}>
          <ThemedText style={styles.sectionLabel}>Amount</ThemedText>
          <View
            style={[
              styles.inputContainer,
              focusedField === "amount" && styles.inputContainerFocused,
            ]}
          >
            <ThemedText style={styles.inputLabel}>
              Transaction amount (R)
            </ThemedText>
            <TextInput
              style={styles.input}
              value={amount}
              onChangeText={setAmount}
              onFocus={() => setFocusedField("amount")}
              onBlur={() => setFocusedField(null)}
              placeholder="0.00"
              placeholderTextColor={mutedColor}
              keyboardType="decimal-pad"
            />
          </View>
        </View>

        {/* Date */}
        <View style={styles.formSection}>
          <ThemedText style={styles.sectionLabel}>Date</ThemedText>
          <View
            style={[
              styles.inputContainer,
              focusedField === "date" && styles.inputContainerFocused,
            ]}
          >
            <ThemedText style={styles.inputLabel}>Transaction date</ThemedText>
            <TextInput
              style={styles.input}
              value={date}
              onChangeText={setDate}
              onFocus={() => setFocusedField("date")}
              onBlur={() => setFocusedField(null)}
              placeholder="DD MMM YYYY"
              placeholderTextColor={mutedColor}
            />
          </View>
        </View>

        {/* Note */}
        <View style={styles.formSection}>
          <ThemedText style={styles.sectionLabel}>Note</ThemedText>
          <View
            style={[
              styles.inputContainer,
              focusedField === "note" && styles.inputContainerFocused,
            ]}
          >
            <ThemedText style={styles.inputLabel}>Optional details</ThemedText>
            <TextInput
              style={[
                styles.input,
                { minHeight: 60, textAlignVertical: "top" },
              ]}
              value={note}
              onChangeText={setNote}
              onFocus={() => setFocusedField("note")}
              onBlur={() => setFocusedField(null)}
              placeholder="Add notes about this expense"
              placeholderTextColor={mutedColor}
              multiline
              numberOfLines={3}
            />
          </View>
        </View>

        {/* Category */}
        <View style={styles.formSection}>
          <ThemedText style={styles.sectionLabel}>Category</ThemedText>
          <Pressable
            onPress={() => setShowCategorySheet(!showCategorySheet)}
            style={[styles.categoryButton, styles.categoryButtonSelected]}
          >
            <ThemedText style={styles.categoryIcon}>
              {selectedCategory.icon}
            </ThemedText>
            <View style={{ flex: 1 }}>
              <ThemedText style={styles.categoryLabel}>
                {selectedCategory.label}
              </ThemedText>
              <ThemedText style={styles.categorySubtext}>
                Tap to change
              </ThemedText>
            </View>
          </Pressable>

          {showCategorySheet && (
            <View style={{ marginTop: 12 }}>
              {CATEGORIES.map((cat) => (
                <Pressable
                  key={cat.code}
                  onPress={() => {
                    setSelectedCatCode(cat.code);
                    setShowCategorySheet(false);
                  }}
                  style={styles.categoryOption}
                >
                  <ThemedText style={styles.categoryOptionIcon}>
                    {cat.icon}
                  </ThemedText>
                  <ThemedText style={styles.categoryOptionText}>
                    {cat.label}
                  </ThemedText>
                </Pressable>
              ))}
            </View>
          )}
        </View>

        {/* Deductible */}
        <View style={styles.formSection}>
          <ThemedText style={styles.sectionLabel}>Tax Deductible</ThemedText>
          <View style={styles.deductibleRow}>
            <View style={styles.deductibleContainer}>
              <ThemedText style={styles.deductibleLabel}>
                Mark as deductible
              </ThemedText>
              <ThemedText style={styles.deductibleSubtext}>
                {isDeductible
                  ? "This expense can reduce your tax"
                  : "Non-deductible expense"}
              </ThemedText>
            </View>
            <Switch value={isDeductible} onValueChange={setIsDeductible} />
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonRow}>
          <Pressable style={styles.saveButton} onPress={handleSave}>
            <ThemedText style={styles.saveButtonText}>
              💾 Save Changes
            </ThemedText>
          </Pressable>
          <Pressable style={styles.deleteButton} onPress={onDelete}>
            <ThemedText style={styles.deleteButtonText}>🗑️</ThemedText>
          </Pressable>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </ThemedView>
  );
}
