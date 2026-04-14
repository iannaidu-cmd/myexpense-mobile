import { colour, radius, space, typography } from "@/tokens";
import { useState } from "react";
import {
  Pressable,
  ScrollView,
  Switch,
  Text,
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
  { label: "Travel & Transport",    icon: "🚗", color: colour.primary,  code: "TRAVEL"   },
  { label: "Office & Stationery",   icon: "📁", color: colour.navyDark, code: "OFFICE"   },
  { label: "Software & Tech",       icon: "💻", color: colour.midNavy2, code: "SOFTWARE" },
  { label: "Meals & Entertainment", icon: "🍽️", color: colour.warning,  code: "MEALS"    },
  { label: "Professional Services", icon: "📋", color: colour.info,     code: "PROF"     },
  { label: "Home Office",           icon: "🏠", color: colour.teal,     code: "HOME"     },
  { label: "Vehicle & Fuel",        icon: "⛽", color: colour.success,  code: "FUEL"     },
  { label: "Other",                 icon: "📦", color: colour.textSub,  code: "OTHER"    },
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
  const [selectedCatCode, setSelectedCatCode] = useState(expenseData.categoryCode);
  const [isDeductible, setIsDeductible] = useState(expenseData.isDeductible);
  const [showCategorySheet, setShowCategorySheet] = useState(false);
  const [saved, setSaved] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

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

  // ── Saved confirmation state ─────────────────────────────────────────────────
  if (saved) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colour.primary,
          alignItems: "center",
          justifyContent: "center",
          padding: space.xl,
        }}
      >
        <View
          style={{
            width: 80,
            height: 80,
            borderRadius: 40,
            backgroundColor: colour.teal,
            alignItems: "center",
            justifyContent: "center",
            marginBottom: space.xl,
          }}
        >
          <Text style={{ fontSize: 38, color: colour.white }}>✓</Text>
        </View>
        <Text style={{ ...typography.h3, color: colour.white, marginBottom: space.sm }}>
          Changes Saved!
        </Text>
        <Text style={{ ...typography.bodyM, color: colour.primary100, textAlign: "center" }}>
          Your expense has been updated.
        </Text>
      </View>
    );
  }

  // ── Input field component ────────────────────────────────────────────────────
  const InputField = ({
    fieldKey,
    label,
    value,
    onChange,
    placeholder,
    multiline,
  }: {
    fieldKey: string;
    label: string;
    value: string;
    onChange: (v: string) => void;
    placeholder: string;
    multiline?: boolean;
  }) => {
    const focused = focusedField === fieldKey;
    return (
      <View style={{ marginBottom: space.xl }}>
        <Text style={{ ...typography.labelM, color: colour.textSub, marginBottom: space.xs }}>
          {label}
        </Text>
        <View
          style={{
            backgroundColor: colour.surface1,
            borderRadius: radius.md,
            borderWidth: 1.5,
            borderColor: focused ? colour.primary : colour.border,
            paddingHorizontal: space.lg,
            paddingVertical: space.md,
          }}
        >
          <TextInput
            style={{
              ...typography.bodyM,
              color: colour.text,
              ...(multiline ? { minHeight: 60, textAlignVertical: "top" } : {}),
            }}
            value={value}
            onChangeText={onChange}
            onFocus={() => setFocusedField(fieldKey)}
            onBlur={() => setFocusedField(null)}
            placeholder={placeholder}
            placeholderTextColor={colour.textHint}
            multiline={multiline}
            numberOfLines={multiline ? 3 : 1}
          />
        </View>
      </View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: colour.white }}>
      {/* Header */}
      <View
        style={{
          paddingHorizontal: space.xl,
          paddingTop: space.xl,
          paddingBottom: space.xl,
          backgroundColor: colour.primary,
        }}
      >
        <Text style={{ ...typography.h3, color: colour.white, marginBottom: space.xs }}>
          Edit Expense
        </Text>
        <Text style={{ ...typography.bodyS, color: colour.primary100 }}>
          Update the expense details
        </Text>
      </View>

      <ScrollView
        style={{ flex: 1, padding: space.xl }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        <InputField
          fieldKey="vendor"
          label="Vendor"
          value={vendor}
          onChange={setVendor}
          placeholder="Business or supplier name"
        />
        <InputField
          fieldKey="amount"
          label="Amount (R)"
          value={amount}
          onChange={setAmount}
          placeholder="0.00"
        />
        <InputField
          fieldKey="date"
          label="Date"
          value={date}
          onChange={setDate}
          placeholder="DD MMM YYYY"
        />
        <InputField
          fieldKey="note"
          label="Note"
          value={note}
          onChange={setNote}
          placeholder="Add notes about this expense"
          multiline
        />

        {/* Category selector */}
        <View style={{ marginBottom: space.xl }}>
          <Text style={{ ...typography.labelM, color: colour.textSub, marginBottom: space.xs }}>
            Category
          </Text>
          <Pressable
            onPress={() => setShowCategorySheet(!showCategorySheet)}
            style={{
              backgroundColor: colour.surface1,
              borderRadius: radius.md,
              borderWidth: 1.5,
              borderColor: colour.primary,
              paddingHorizontal: space.lg,
              paddingVertical: space.md,
              flexDirection: "row",
              alignItems: "center",
              gap: space.md,
            }}
          >
            <Text style={{ fontSize: 24 }}>{selectedCategory.icon}</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ ...typography.labelM, color: colour.text }}>
                {selectedCategory.label}
              </Text>
              <Text style={{ ...typography.bodyXS, color: colour.textHint }}>
                Tap to change
              </Text>
            </View>
          </Pressable>

          {showCategorySheet && (
            <View
              style={{
                marginTop: space.sm,
                borderRadius: radius.md,
                borderWidth: 1,
                borderColor: colour.border,
                overflow: "hidden",
              }}
            >
              {CATEGORIES.map((cat) => (
                <Pressable
                  key={cat.code}
                  onPress={() => {
                    setSelectedCatCode(cat.code);
                    setShowCategorySheet(false);
                  }}
                  style={{
                    paddingHorizontal: space.lg,
                    paddingVertical: space.md,
                    borderBottomWidth: 1,
                    borderBottomColor: colour.border,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: space.md,
                    backgroundColor:
                      selectedCatCode === cat.code ? colour.primary50 : colour.white,
                  }}
                >
                  <Text style={{ fontSize: 24 }}>{cat.icon}</Text>
                  <Text style={{ ...typography.bodyM, color: colour.text }}>
                    {cat.label}
                  </Text>
                  {selectedCatCode === cat.code && (
                    <Text style={{ marginLeft: "auto", color: colour.primary }}>✓</Text>
                  )}
                </Pressable>
              ))}
            </View>
          )}
        </View>

        {/* Deductible toggle */}
        <View style={{ marginBottom: space.xl }}>
          <Text style={{ ...typography.labelM, color: colour.textSub, marginBottom: space.xs }}>
            Tax Deductible
          </Text>
          <View
            style={{
              backgroundColor: colour.surface1,
              borderRadius: radius.md,
              borderWidth: 1.5,
              borderColor: colour.border,
              paddingHorizontal: space.lg,
              paddingVertical: space.md,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <View style={{ flex: 1 }}>
              <Text style={{ ...typography.labelM, color: colour.text }}>
                Mark as deductible
              </Text>
              <Text style={{ ...typography.bodyXS, color: colour.textSub, marginTop: 2 }}>
                {isDeductible
                  ? "This expense can reduce your tax"
                  : "Non-deductible expense"}
              </Text>
            </View>
            <Switch
              value={isDeductible}
              onValueChange={setIsDeductible}
              trackColor={{ false: colour.border, true: colour.primary }}
              thumbColor={colour.white}
            />
          </View>
        </View>

        {/* Action buttons */}
        <View style={{ flexDirection: "row", gap: space.md }}>
          <Pressable
            style={{
              flex: 1,
              backgroundColor: colour.primary,
              borderRadius: radius.md,
              paddingVertical: 14,
              alignItems: "center",
            }}
            onPress={handleSave}
          >
            <Text style={{ ...typography.btnL, color: colour.onPrimary }}>
              💾 Save Changes
            </Text>
          </Pressable>
          <Pressable
            style={{
              paddingVertical: 14,
              paddingHorizontal: space.lg,
              borderRadius: radius.md,
              borderWidth: 1.5,
              borderColor: colour.danger,
              alignItems: "center",
            }}
            onPress={onDelete}
          >
            <Text style={{ ...typography.btnL, color: colour.danger }}>
              🗑️
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}
