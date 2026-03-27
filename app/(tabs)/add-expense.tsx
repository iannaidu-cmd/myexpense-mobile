import { expenseService } from "@/services/expenseService";
import { scheduleReceiptReminder } from "@/services/notificationService";
import { useAuthStore } from "@/stores/authStore";
import { colour, radius, space, typography } from "@/tokens";
import { ACTIVE_TAX_YEAR } from "@/types/database";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const CATEGORIES = [
  { label: "Travel & Transport", icon: "🚗", code: "S11(a)", deductible: true },
  { label: "Home Office", icon: "🏠", code: "S11(a)", deductible: true },
  { label: "Equipment & Tools", icon: "🔧", code: "S11(e)", deductible: true },
  {
    label: "Software & Subscriptions",
    icon: "💻",
    code: "S11(a)",
    deductible: true,
  },
  {
    label: "Meals & Entertainment",
    icon: "🍽",
    code: "S11(a)",
    deductible: true,
  },
  { label: "Professional Fees", icon: "📋", code: "S11(a)", deductible: true },
  { label: "Telephone & Cell", icon: "📱", code: "S11(a)", deductible: true },
  {
    label: "Marketing & Advertising",
    icon: "📣",
    code: "S11(a)",
    deductible: true,
  },
  { label: "Bank Charges", icon: "🏦", code: "S11(a)", deductible: true },
  { label: "Insurance", icon: "🛡️", code: "S11(a)", deductible: true },
  { label: "Rent", icon: "🏢", code: "S11(a)", deductible: true },
  {
    label: "Repairs & Maintenance",
    icon: "🔨",
    code: "S11(a)",
    deductible: true,
  },
  { label: "Education", icon: "📚", code: "S11(a)", deductible: true },
  { label: "Medical Aid", icon: "💊", code: "S11(a)", deductible: true },
  { label: "Vehicle Expenses", icon: "🚘", code: "Page 24", deductible: true },
  {
    label: "Personal / Non-deductible",
    icon: "👤",
    code: "N/A",
    deductible: false,
  },
];

function FieldLabel({ label }: { label: string }) {
  return (
    <Text
      style={{
        ...typography.labelS,
        color: colour.textSub,
        letterSpacing: 0.5,
        marginBottom: space.xs,
      }}
    >
      {label.toUpperCase()}
    </Text>
  );
}

function UnderlineInput({
  value,
  onChangeText,
  placeholder,
  keyboardType,
  multiline,
}: {
  value: string;
  onChangeText: (v: string) => void;
  placeholder: string;
  keyboardType?: any;
  multiline?: boolean;
}) {
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={colour.textHint}
      keyboardType={keyboardType}
      multiline={multiline}
      textAlignVertical={multiline ? "top" : "auto"}
      style={{
        ...typography.bodyM,
        color: colour.text,
        borderBottomWidth: 1.5,
        borderBottomColor: colour.border,
        paddingBottom: space.sm,
        paddingTop: space.xxs,
        marginBottom: space.lg,
        minHeight: multiline ? 60 : undefined,
      }}
    />
  );
}

export default function AddExpenseTab() {
  const router = useRouter();
  const { user } = useAuthStore();

  const [amount, setAmount] = useState("");
  const [vendor, setVendor] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [category, setCategory] = useState("");
  const [vatAmount, setVatAmount] = useState("");
  const [note, setNote] = useState("");
  const [showCatPicker, setShowCatPicker] = useState(false);
  const [saving, setSaving] = useState(false);

  const selectedCat = CATEGORIES.find((c) => c.label === category);
  const canSave = !!amount && !!vendor && !!category && parseFloat(amount) > 0;

  const handleSave = async () => {
    if (!canSave || !user) return;

    // Parse date from DD/MM/YYYY or YYYY-MM-DD
    let expenseDate = date;
    if (date.includes("/")) {
      const parts = date.split("/");
      if (parts.length === 3) {
        expenseDate = `${parts[2]}-${parts[1].padStart(2, "0")}-${parts[0].padStart(2, "0")}`;
      }
    }

    setSaving(true);
    try {
      const savedExpense = await expenseService.addExpense(user.id, {
        vendor: vendor.trim(),
        amount: parseFloat(amount),
        category,
        itr12_code: selectedCat?.code ?? null,
        tax_year: ACTIVE_TAX_YEAR,
        expense_date: expenseDate,
        is_deductible: selectedCat?.deductible ?? false,
        vat_amount: vatAmount ? parseFloat(vatAmount) : undefined,
        notes: note.trim() || undefined,
      });

      // Schedule receipt reminder if no receipt attached and expense is deductible
      if (savedExpense?.id && selectedCat?.deductible) {
        try {
          await scheduleReceiptReminder(
            savedExpense.id,
            vendor.trim(),
            parseFloat(amount),
          );
        } catch (e) {
          // Non-critical — don't block the save flow
          console.warn("Receipt reminder scheduling failed:", e);
        }
      }

      // Reset form
      setAmount("");
      setVendor("");
      setDate(new Date().toISOString().split("T")[0]);
      setCategory("");
      setVatAmount("");
      setNote("");

      Alert.alert(
        "Expense Saved ✓",
        `${vendor} — R ${parseFloat(amount).toLocaleString("en-ZA", { minimumFractionDigits: 2 })} has been saved.`,
        [
          { text: "Add Another", style: "cancel" },
          { text: "Go Home", onPress: () => router.replace("/(tabs)") },
        ],
      );
    } catch (e: any) {
      Alert.alert("Error saving expense", e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colour.primary }}>
      <StatusBar barStyle="light-content" backgroundColor={colour.primary} />

      {/* Header */}
      <View
        style={{
          paddingHorizontal: space.lg,
          paddingTop: space.lg,
          paddingBottom: space["4xl"],
        }}
      >
        <Text style={{ ...typography.h3, color: colour.onPrimary }}>
          Add Expense
        </Text>
        <Text
          style={{
            ...typography.bodyS,
            color: "rgba(255,255,255,0.7)",
            marginTop: 2,
          }}
        >
          Track your tax deductions
        </Text>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          style={{
            flex: 1,
            backgroundColor: colour.surface1,
            borderTopLeftRadius: radius.xl,
            borderTopRightRadius: radius.xl,
          }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: space.xxxl }}
        >
          {/* Scan shortcuts */}
          <View
            style={{
              flexDirection: "row",
              paddingHorizontal: space.lg,
              paddingTop: space.lg,
              gap: space.sm,
              marginBottom: space.lg,
            }}
          >
            <TouchableOpacity
              onPress={() => router.push("/scan-receipt-camera")}
              style={{
                flex: 1,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: colour.primary,
                borderRadius: radius.md,
                padding: space.md,
                gap: space.sm,
              }}
            >
              <Text style={{ fontSize: 18 }}>📷</Text>
              <Text style={{ ...typography.actionS, color: colour.onPrimary }}>
                Scan Receipt
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.push("/upload-from-gallery")}
              style={{
                flex: 1,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: colour.surface2,
                borderRadius: radius.md,
                padding: space.md,
                gap: space.sm,
                borderWidth: 1,
                borderColor: colour.border,
              }}
            >
              <Text style={{ fontSize: 18 }}>🖼️</Text>
              <Text style={{ ...typography.actionS, color: colour.text }}>
                From Gallery
              </Text>
            </TouchableOpacity>
          </View>

          {/* Expense Details */}
          <View
            style={{
              marginHorizontal: space.lg,
              backgroundColor: colour.white,
              borderRadius: radius.lg,
              padding: space.lg,
              borderWidth: 1,
              borderColor: colour.border,
              marginBottom: space.md,
            }}
          >
            <Text
              style={{
                ...typography.bodyM,
                fontWeight: "700",
                color: colour.text,
                marginBottom: space.lg,
              }}
            >
              Expense Details
            </Text>

            <FieldLabel label="Amount (ZAR)" />
            <UnderlineInput
              value={amount}
              onChangeText={setAmount}
              placeholder="0.00"
              keyboardType="decimal-pad"
            />

            <FieldLabel label="Vendor / Supplier" />
            <UnderlineInput
              value={vendor}
              onChangeText={setVendor}
              placeholder="e.g. Engen, Microsoft, Checkers"
            />

            <FieldLabel label="Date (YYYY-MM-DD)" />
            <UnderlineInput
              value={date}
              onChangeText={setDate}
              placeholder="YYYY-MM-DD"
            />

            {/* Category picker */}
            <FieldLabel label="ITR12 Category" />
            <TouchableOpacity
              onPress={() => setShowCatPicker((v) => !v)}
              style={{
                borderBottomWidth: 1.5,
                borderBottomColor: colour.border,
                paddingBottom: space.sm,
                marginBottom: space.xs,
                flexDirection: "row",
                alignItems: "center",
              }}
            >
              <Text
                style={{
                  flex: 1,
                  ...typography.bodyM,
                  color: category ? colour.text : colour.textHint,
                }}
              >
                {selectedCat
                  ? `${selectedCat.icon}  ${selectedCat.label}`
                  : "Select a category…"}
              </Text>
              <Text style={{ color: colour.textSub, fontSize: 16 }}>
                {showCatPicker ? "∨" : "›"}
              </Text>
            </TouchableOpacity>

            {selectedCat && (
              <View
                style={{
                  backgroundColor: colour.surface2,
                  borderRadius: radius.sm,
                  paddingHorizontal: space.sm,
                  paddingVertical: 4,
                  marginBottom: space.md,
                  alignSelf: "flex-start",
                }}
              >
                <Text
                  style={{
                    ...typography.bodyXS,
                    fontWeight: "700",
                    color: colour.primary,
                  }}
                >
                  ITR12 {selectedCat.code} —{" "}
                  {selectedCat.deductible ? "Deductible ✓" : "Non-deductible"}
                </Text>
              </View>
            )}

            {showCatPicker && (
              <View style={{ marginBottom: space.md }}>
                {CATEGORIES.map((cat) => (
                  <TouchableOpacity
                    key={cat.label}
                    onPress={() => {
                      setCategory(cat.label);
                      setShowCatPicker(false);
                    }}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      paddingVertical: space.md,
                      borderBottomWidth: 1,
                      borderBottomColor: colour.borderLight,
                    }}
                  >
                    <Text style={{ fontSize: 18, marginRight: space.md }}>
                      {cat.icon}
                    </Text>
                    <Text
                      style={{ flex: 1, ...typography.bodyM, color: colour.text }}
                    >
                      {cat.label}
                    </Text>
                    <Text
                      style={{
                        ...typography.bodyXS,
                        color: colour.primary,
                        fontWeight: "600",
                      }}
                    >
                      {cat.code}
                    </Text>
                    {category === cat.label && (
                      <Text
                        style={{
                          color: colour.success,
                          marginLeft: space.sm,
                          fontWeight: "800",
                        }}
                      >
                        ✓
                      </Text>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* VAT */}
          <View
            style={{
              marginHorizontal: space.lg,
              backgroundColor: colour.white,
              borderRadius: radius.lg,
              padding: space.lg,
              borderWidth: 1,
              borderColor: colour.border,
              marginBottom: space.md,
            }}
          >
            <Text
              style={{
                ...typography.bodyM,
                fontWeight: "700",
                color: colour.text,
                marginBottom: space.lg,
              }}
            >
              VAT Details (optional)
            </Text>
            <FieldLabel label="VAT Amount (R)" />
            <UnderlineInput
              value={vatAmount}
              onChangeText={setVatAmount}
              placeholder="0.00"
              keyboardType="decimal-pad"
            />
          </View>

          {/* Notes */}
          <View
            style={{
              marginHorizontal: space.lg,
              backgroundColor: colour.white,
              borderRadius: radius.lg,
              padding: space.lg,
              borderWidth: 1,
              borderColor: colour.border,
              marginBottom: space.lg,
            }}
          >
            <Text
              style={{
                ...typography.bodyM,
                fontWeight: "700",
                color: colour.text,
                marginBottom: space.lg,
              }}
            >
              Notes (optional)
            </Text>
            <FieldLabel label="Description / Note" />
            <UnderlineInput
              value={note}
              onChangeText={setNote}
              placeholder="Optional description or memo…"
              multiline
            />
          </View>

          {/* Save button */}
          <TouchableOpacity
            onPress={handleSave}
            disabled={!canSave || saving}
            style={{
              marginHorizontal: space.lg,
              backgroundColor: canSave ? colour.primary : colour.surface2,
              borderRadius: radius.lg,
              height: 52,
              alignItems: "center",
              justifyContent: "center",
              marginBottom: space.sm,
            }}
          >
            {saving ? (
              <ActivityIndicator color={colour.onPrimary} />
            ) : (
              <Text
                style={{
                  ...typography.btnL,
                  color: canSave ? colour.onPrimary : colour.textSub,
                }}
              >
                {canSave ? "Save Expense" : "Fill in required fields"}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.back()}
            style={{ alignItems: "center", paddingVertical: space.sm }}
          >
            <Text style={{ ...typography.bodyS, color: colour.textSub }}>
              Cancel
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
