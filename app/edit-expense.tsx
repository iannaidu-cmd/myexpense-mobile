import { expenseService } from "@/services/expenseService";
import { MXTabBar } from "@/components/MXTabBar";
import { colour, radius, space, typography } from "@/tokens";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const ITR12_CATEGORIES = [
  { name: "Advertising & Marketing",        section: "S11(a)", deductible: true  },
  { name: "Bank Charges",                   section: "S11(a)", deductible: true  },
  { name: "Computer & IT Equipment",        section: "S11(e)", deductible: true  },
  { name: "Courier & Delivery",             section: "S11(a)", deductible: true  },
  { name: "Fuel & Oil",                     section: "S11(a)", deductible: true  },
  { name: "Home Office",                    section: "S11(a)", deductible: true  },
  { name: "Insurance - Business",           section: "S11(a)", deductible: true  },
  { name: "Legal & Professional Fees",      section: "S11(a)", deductible: true  },
  { name: "Motor Vehicle Expenses",         section: "S11(a)", deductible: true  },
  { name: "Office Rental",                  section: "S11(a)", deductible: true  },
  { name: "Phone & Internet",               section: "S11(a)", deductible: true  },
  { name: "Printing & Stationery",          section: "S11(a)", deductible: true  },
  { name: "Professional Development",       section: "S11(a)", deductible: true  },
  { name: "Repairs & Maintenance",          section: "S11(a)", deductible: true  },
  { name: "Software & Subscriptions",       section: "S11(a)", deductible: true  },
  { name: "Staff Costs",                    section: "S11(a)", deductible: true  },
  { name: "Travel - Business",              section: "S11(a)", deductible: true  },
  { name: "Uniforms & Protective Clothing", section: "S11(a)", deductible: true  },
  { name: "Utilities - Business Share",     section: "S11(a)", deductible: true  },
  { name: "Meals - Client Entertainment",   section: "S11(a)", deductible: false },
];

export default function EditExpenseScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [loadingExpense, setLoadingExpense] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [expenseType, setExpenseType] = useState<"business" | "personal">("business");
  const [amount,       setAmount]       = useState("");
  const [vendor,       setVendor]       = useState("");
  const [date,         setDate]         = useState("");
  const [category,     setCategory]     = useState("");
  const [notes,        setNotes]        = useState("");
  const [showCatModal, setShowCatModal] = useState(false);

  // Load existing expense on mount
  useEffect(() => {
    if (!id) return;
    expenseService.getExpenseById(id).then((expense) => {
      setAmount(String(expense.amount));
      setVendor(expense.vendor ?? "");
      setDate(expense.expense_date ?? "");
      setCategory(expense.category ?? "");
      setNotes(expense.notes ?? "");
      // Derive toggle state from saved is_deductible flag
      setExpenseType(expense.is_deductible ? "business" : "personal");
      setLoadingExpense(false);
    }).catch((e) => {
      Alert.alert("Error", e.message);
      setLoadingExpense(false);
    });
  }, [id]);

  const selectedCat = ITR12_CATEGORIES.find((c) => c.name === category);

  // Personal toggle overrides category deductibility
  const isDeductible = expenseType === "business"
    ? (selectedCat?.deductible ?? false)
    : false;

  const handleSave = async () => {
    if (!amount || !category) {
      setError("Amount and category are required.");
      return;
    }
    if (isNaN(Number(amount)) || Number(amount) <= 0) {
      setError("Please enter a valid amount.");
      return;
    }
    setError("");
    setSaving(true);
    try {
      await expenseService.updateExpense({
        id: id!,
        amount:        parseFloat(amount),
        vendor:        vendor.trim(),
        expense_date:  date,
        category:      category,
        itr12_code:    expenseType === "personal" ? null : (selectedCat?.section ?? null),
        is_deductible: isDeductible,
        notes:         notes.trim() || undefined,
      });
      Alert.alert(
        "Saved",
        "Your expense has been updated.",
        [{ text: "OK", onPress: () => router.back() }]
      );
    } catch (e: any) {
      setError(e.message ?? "Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loadingExpense) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colour.primary, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color={colour.onPrimary} size="large" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colour.primary }}>
      <StatusBar barStyle="light-content" backgroundColor={colour.primary} />

      {/* Header */}
      <View style={{ paddingHorizontal: space.lg, paddingTop: 3, paddingBottom: space["3xl"] }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: space.md }}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Text style={{ color: colour.textOnPrimary, fontSize: 26, lineHeight: 30 }}>
              {String.fromCharCode(8249)}
            </Text>
          </TouchableOpacity>
          <Text style={{ ...typography.labelM, color: "rgba(255,255,255,0.85)" }}>Edit expense</Text>
          <View style={{ width: 40 }} />
        </View>
        <Text style={{ ...typography.h3, color: colour.textOnPrimary }}>Update details</Text>
      </View>

      {/* Form */}
      <ScrollView
        style={{
          flex: 1,
          backgroundColor: colour.bgCard,
          borderTopLeftRadius: radius.xl,
          borderTopRightRadius: radius.xl,
        }}
        contentContainerStyle={{ padding: space.lg, paddingBottom: 100 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Business / Personal toggle */}
        <Text style={{ ...typography.labelM, color: colour.textSecondary, marginBottom: space.xs }}>
          Expense type
        </Text>
        <View style={{
          flexDirection: "row",
          backgroundColor: colour.surface1,
          borderRadius: radius.md,
          padding: 3,
          marginBottom: space.lg,
        }}>
          {(["business", "personal"] as const).map((t) => (
            <TouchableOpacity
              key={t}
              onPress={() => setExpenseType(t)}
              style={{
                flex: 1,
                paddingVertical: space.sm,
                borderRadius: radius.sm,
                backgroundColor: expenseType === t ? colour.primary : "transparent",
                alignItems: "center",
              }}
            >
              <Text style={{
                ...typography.labelM,
                color: expenseType === t ? colour.onPrimary : colour.textSub,
              }}>
                {t === "business" ? "Business" : "Personal"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Personal notice */}
        {expenseType === "personal" && (
          <View style={{
            backgroundColor: colour.warningBg,
            borderRadius: radius.sm,
            padding: space.sm,
            marginBottom: space.lg,
          }}>
            <Text style={{ ...typography.bodyXS, color: colour.warning }}>
              Personal expenses are not deductible and will not be included in your ITR12 calculations.
            </Text>
          </View>
        )}

        {/* Amount */}
        <Text style={{ ...typography.labelM, color: colour.textSecondary, marginBottom: space.xs }}>
          Amount (ZAR) *
        </Text>
        <View style={{
          flexDirection: "row",
          alignItems: "center",
          borderBottomWidth: 1.5,
          borderBottomColor: colour.border,
          marginBottom: space.lg,
        }}>
          <Text style={{ ...typography.bodyL, color: colour.textSecondary, marginRight: space.xs }}>R</Text>
          <TextInput
            value={amount}
            onChangeText={setAmount}
            placeholder="0.00"
            placeholderTextColor={colour.textHint}
            keyboardType="decimal-pad"
            style={{ ...typography.amountM, flex: 1, color: colour.textPrimary, paddingVertical: space.sm }}
          />
        </View>

        {/* Category */}
        <Text style={{ ...typography.labelM, color: colour.textSecondary, marginBottom: space.xs }}>
          ITR12 category *
        </Text>
        <TouchableOpacity
          onPress={() => setShowCatModal(true)}
          style={{
            borderBottomWidth: 1.5,
            borderBottomColor: category ? colour.primary : colour.border,
            paddingVertical: space.sm,
            marginBottom: space.lg,
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Text style={{ ...typography.bodyM, color: category ? colour.textPrimary : colour.textHint }}>
            {category || "Select SARS ITR12 category"}
          </Text>
          <Text style={{ color: colour.textSecondary, fontSize: 18 }}>
            {String.fromCharCode(8250)}
          </Text>
        </TouchableOpacity>

        {/* Deductibility badge — reflects both toggle and category */}
        {selectedCat && (
          <View style={{
            backgroundColor: isDeductible ? colour.successLight : colour.dangerBg,
            borderRadius: radius.sm,
            padding: space.sm,
            marginBottom: space.lg,
          }}>
            <Text style={{ ...typography.bodyS, color: isDeductible ? colour.success : colour.danger }}>
              {isDeductible ? "Deductible" : "Non-deductible"}{" "}
              {expenseType === "personal"
                ? "(personal expense)"
                : selectedCat.section}
            </Text>
          </View>
        )}

        {/* Vendor */}
        <Text style={{ ...typography.labelM, color: colour.textSecondary, marginBottom: space.xs }}>
          Vendor / supplier
        </Text>
        <TextInput
          value={vendor}
          onChangeText={setVendor}
          placeholder="e.g. Telkom SA"
          placeholderTextColor={colour.textHint}
          style={{
            ...typography.bodyM,
            color: colour.textPrimary,
            borderBottomWidth: 1.5,
            borderBottomColor: colour.border,
            paddingVertical: space.sm,
            marginBottom: space.lg,
          }}
        />

        {/* Date */}
        <Text style={{ ...typography.labelM, color: colour.textSecondary, marginBottom: space.xs }}>
          Date (YYYY-MM-DD)
        </Text>
        <TextInput
          value={date}
          onChangeText={setDate}
          placeholder="YYYY-MM-DD"
          placeholderTextColor={colour.textHint}
          style={{
            ...typography.bodyM,
            color: colour.textPrimary,
            borderBottomWidth: 1.5,
            borderBottomColor: colour.border,
            paddingVertical: space.sm,
            marginBottom: space.lg,
          }}
        />

        {/* Notes */}
        <Text style={{ ...typography.labelM, color: colour.textSecondary, marginBottom: space.xs }}>
          Notes (optional)
        </Text>
        <TextInput
          value={notes}
          onChangeText={setNotes}
          placeholder="Any additional notes..."
          placeholderTextColor={colour.textHint}
          multiline
          numberOfLines={3}
          style={{
            ...typography.bodyM,
            color: colour.textPrimary,
            borderBottomWidth: 1.5,
            borderBottomColor: colour.border,
            paddingVertical: space.sm,
            marginBottom: space["2xl"],
            minHeight: 72,
          }}
        />

        {/* Error */}
        {error ? (
          <View style={{
            backgroundColor: colour.dangerLight,
            borderRadius: radius.sm,
            padding: space.md,
            marginBottom: space.lg,
          }}>
            <Text style={{ ...typography.bodyS, color: colour.danger }}>{error}</Text>
          </View>
        ) : null}

        {/* Save */}
        <TouchableOpacity
          onPress={handleSave}
          disabled={saving}
          style={{
            backgroundColor: saving ? colour.border : colour.primary,
            borderRadius: radius.pill,
            height: 52,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {saving
            ? <ActivityIndicator color={colour.textOnPrimary} />
            : <Text style={{ ...typography.btnL, color: colour.textOnPrimary }}>Save changes</Text>
          }
        </TouchableOpacity>
      </ScrollView>

      {/* Category Modal */}
      <Modal visible={showCatModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={{ flex: 1, backgroundColor: colour.bgCard }}>
          <View style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            padding: space.lg,
            borderBottomWidth: 1,
            borderBottomColor: colour.border,
          }}>
            <Text style={{ ...typography.h4, color: colour.textPrimary }}>Select category</Text>
            <TouchableOpacity onPress={() => setShowCatModal(false)}>
              <Text style={{ ...typography.labelM, color: colour.primary }}>Done</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={ITR12_CATEGORIES}
            keyExtractor={(item) => item.name}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => { setCategory(item.name); setShowCatModal(false); }}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: space.lg,
                  borderBottomWidth: 1,
                  borderBottomColor: colour.border,
                  backgroundColor: category === item.name ? colour.primaryLight : colour.bgCard,
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text style={{ ...typography.bodyM, color: colour.textPrimary }}>{item.name}</Text>
                  <Text style={{ ...typography.caption, color: colour.textSecondary }}>
                    {item.section} · {item.deductible ? "Deductible" : "Non-deductible"}
                  </Text>
                </View>
                {category === item.name && (
                  <Text style={{ color: colour.primary, fontSize: 16 }}>✓</Text>
                )}
              </TouchableOpacity>
            )}
          />
        </SafeAreaView>
      </Modal>
      <MXTabBar />
    </SafeAreaView>
  );
}
