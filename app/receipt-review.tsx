import { expenseService } from "@/services/expenseService";
import { useAuthStore } from "@/stores/authStore";
import { colour, radius, space, typography } from "@/tokens";
import { ACTIVE_TAX_YEAR } from "@/types/database";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const CATEGORIES = [
  { name: "Travel & Transport",       code: "S11(a)", deductible: true },
  { name: "Home Office",              code: "S11(a)", deductible: true },
  { name: "Equipment & Tools",        code: "S11(e)", deductible: true },
  { name: "Software & Subscriptions", code: "S11(a)", deductible: true },
  { name: "Meals & Entertainment",    code: "S11(a)", deductible: true },
  { name: "Professional Fees",        code: "S11(a)", deductible: true },
  { name: "Telephone & Cell",         code: "S11(a)", deductible: true },
  { name: "Marketing & Advertising",  code: "S11(a)", deductible: true },
  { name: "Bank Charges",             code: "S11(a)", deductible: true },
  { name: "Insurance",                code: "S11(a)", deductible: true },
  { name: "Rent",                     code: "S11(a)", deductible: true },
  { name: "Repairs & Maintenance",    code: "S11(a)", deductible: true },
  { name: "Education",                code: "S11(a)", deductible: true },
  { name: "Vehicle Expenses",         code: "Page 24", deductible: true },
  { name: "Personal / Non-deductible",code: "N/A",    deductible: false },
];

function FieldLabel({ label, extracted }: { label: string; extracted?: boolean }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", marginBottom: space.xs }}>
      <Text style={{ ...typography.labelS, color: colour.textSub, letterSpacing: 0.5 }}>
        {label.toUpperCase()}
      </Text>
      {extracted && (
        <View style={{ marginLeft: space.xs, backgroundColor: colour.tealLight, borderRadius: 4, paddingHorizontal: 5, paddingVertical: 1 }}>
          <Text style={{ fontSize: 9, fontWeight: "700", color: colour.teal }}>AI</Text>
        </View>
      )}
    </View>
  );
}

export default function ReceiptReviewScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const params = useLocalSearchParams<{
    receiptUrl: string;
    storagePath: string;
    vendor: string;
    amount: string;
    date: string;
    vatAmount: string;
    category: string;
    notes: string;
  }>();

  // Pre-fill from OCR — user can edit any field
  const [amount,    setAmount]    = useState(params.amount    ?? "");
  const [vendor,    setVendor]    = useState(params.vendor    ?? "");
  const [date,      setDate]      = useState(params.date      || new Date().toISOString().split("T")[0]);
  const [vatAmount, setVatAmount] = useState(params.vatAmount ?? "");
  const [category,  setCategory]  = useState(params.category  ?? "");
  const [notes,     setNotes]     = useState(params.notes     ?? "");
  const [showCatPicker, setShowCatPicker] = useState(false);
  const [saving, setSaving] = useState(false);

  const selectedCat = CATEGORIES.find(c => c.name === category);
  const canSave = !!amount && parseFloat(amount) > 0 && !!vendor && !!category;
  const hasReceipt = !!params.receiptUrl && params.receiptUrl !== "";

  // Track which fields were auto-filled by OCR
  const ocrFields = {
    vendor:    !!params.vendor,
    amount:    !!params.amount,
    date:      !!params.date,
    vatAmount: !!params.vatAmount,
    category:  !!params.category,
    notes:     !!params.notes,
  };

  const anyOcr = Object.values(ocrFields).some(Boolean);

  const handleSave = async () => {
    if (!canSave || !user) return;
    setSaving(true);
    try {
      await expenseService.addExpense(user.id, {
        vendor: vendor.trim(),
        amount: parseFloat(amount),
        category,
        itr12_code: selectedCat?.code ?? null,
        tax_year: ACTIVE_TAX_YEAR,
        expense_date: date,
        is_deductible: selectedCat?.deductible ?? false,
        vat_amount: vatAmount ? parseFloat(vatAmount) : undefined,
        notes: notes.trim() || undefined,
      });

      // Update receipt OCR status
      if (params.storagePath) {
        const { supabase } = await import("@/lib/supabase");
        await supabase
          .from("receipts")
          .update({ ocr_status: "done" })
          .eq("storage_path", params.storagePath);
      }

      Alert.alert(
        "Expense Saved ✓",
        `${vendor} — R ${parseFloat(amount).toLocaleString("en-ZA", { minimumFractionDigits: 2 })} saved${hasReceipt ? " with receipt" : ""}.`,
        [{ text: "Done", onPress: () => router.replace("/(tabs)") }]
      );
    } catch (e: any) {
      Alert.alert("Error", e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: colour.primary }}>
      <StatusBar barStyle="light-content" backgroundColor={colour.primary} />

      {/* Header */}
      <View style={{ paddingHorizontal: space.lg, paddingTop: 3, paddingBottom: space["3xl"] }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: space.md }}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Text style={{ color: colour.onPrimary, fontSize: 26, lineHeight: 30 }}>‹</Text>
          </TouchableOpacity>
          <Text style={{ ...typography.labelM, color: "rgba(255,255,255,0.85)" }}>Review Receipt</Text>
          <View style={{ width: 40 }} />
        </View>
        <Text style={{ ...typography.h3, color: colour.onPrimary }}>Confirm details</Text>
        <Text style={{ ...typography.bodyS, color: "rgba(255,255,255,0.7)", marginTop: 2 }}>
          {anyOcr
            ? "✨ AI extracted these details — please verify before saving"
            : hasReceipt
              ? "Receipt uploaded · Fill in the expense details"
              : "No receipt · Enter details manually"}
        </Text>
      </View>

      <ScrollView
        style={{ flex: 1, backgroundColor: colour.background, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl }}
        contentContainerStyle={{ padding: space.lg, paddingBottom: 120 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Receipt preview */}
        {hasReceipt && (
          <View style={{ marginBottom: space.lg, borderRadius: radius.lg, overflow: "hidden", borderWidth: 1, borderColor: colour.borderLight }}>
            <Image
              source={{ uri: decodeURIComponent(params.receiptUrl) }}
              style={{ width: "100%", height: 180 }}
              resizeMode="cover"
            />
            <View style={{ backgroundColor: colour.successBg, padding: space.sm, flexDirection: "row", alignItems: "center", gap: space.xs }}>
              <Text style={{ fontSize: 14 }}>🧾</Text>
              <Text style={{ ...typography.bodyXS, color: colour.success, fontWeight: "600" }}>
                Receipt uploaded · {anyOcr ? "AI auto-filled fields below" : "Fill in details manually"}
              </Text>
            </View>
          </View>
        )}

        {/* Form */}
        <View style={{ backgroundColor: colour.white, borderRadius: radius.lg, padding: space.lg, borderWidth: 1, borderColor: colour.borderLight, marginBottom: space.md }}>
          <Text style={{ ...typography.bodyM, fontWeight: "700", color: colour.text, marginBottom: space.lg }}>
            Expense Details
          </Text>

          {/* Amount */}
          <FieldLabel label="Amount (ZAR) *" extracted={ocrFields.amount} />
          <View style={{ flexDirection: "row", alignItems: "center", borderBottomWidth: 1.5, borderBottomColor: ocrFields.amount ? colour.teal : colour.border, marginBottom: space.lg }}>
            <Text style={{ ...typography.bodyL, color: colour.textSub, marginRight: space.xs }}>R</Text>
            <TextInput
              value={amount}
              onChangeText={setAmount}
              placeholder="0.00"
              placeholderTextColor={colour.textHint}
              keyboardType="decimal-pad"
              style={{ ...typography.amountM, flex: 1, color: colour.text, paddingVertical: space.sm }}
            />
          </View>

          {/* Vendor */}
          <FieldLabel label="Vendor / Supplier *" extracted={ocrFields.vendor} />
          <TextInput
            value={vendor}
            onChangeText={setVendor}
            placeholder="e.g. Engen, Telkom, Checkers"
            placeholderTextColor={colour.textHint}
            style={{ ...typography.bodyM, color: colour.text, borderBottomWidth: 1.5, borderBottomColor: ocrFields.vendor ? colour.teal : colour.border, paddingVertical: space.sm, marginBottom: space.lg }}
          />

          {/* Date */}
          <FieldLabel label="Date (YYYY-MM-DD)" extracted={ocrFields.date} />
          <TextInput
            value={date}
            onChangeText={setDate}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={colour.textHint}
            style={{ ...typography.bodyM, color: colour.text, borderBottomWidth: 1.5, borderBottomColor: ocrFields.date ? colour.teal : colour.border, paddingVertical: space.sm, marginBottom: space.lg }}
          />

          {/* VAT */}
          <FieldLabel label="VAT Amount (optional)" extracted={ocrFields.vatAmount} />
          <TextInput
            value={vatAmount}
            onChangeText={setVatAmount}
            placeholder="0.00"
            placeholderTextColor={colour.textHint}
            keyboardType="decimal-pad"
            style={{ ...typography.bodyM, color: colour.text, borderBottomWidth: 1.5, borderBottomColor: ocrFields.vatAmount ? colour.teal : colour.border, paddingVertical: space.sm, marginBottom: space.lg }}
          />

          {/* Category */}
          <FieldLabel label="ITR12 Category *" extracted={ocrFields.category} />
          <TouchableOpacity
            onPress={() => setShowCatPicker(v => !v)}
            style={{ borderBottomWidth: 1.5, borderBottomColor: category ? (ocrFields.category ? colour.teal : colour.primary) : colour.border, paddingVertical: space.sm, marginBottom: space.xs, flexDirection: "row", justifyContent: "space-between" }}
          >
            <Text style={{ ...typography.bodyM, color: category ? colour.text : colour.textHint }}>
              {category || "Select category…"}
            </Text>
            <Text style={{ color: colour.textSub }}>{showCatPicker ? "∨" : "›"}</Text>
          </TouchableOpacity>

          {selectedCat && (
            <View style={{ backgroundColor: selectedCat.deductible ? colour.successBg : colour.dangerBg, borderRadius: radius.sm, paddingHorizontal: space.sm, paddingVertical: 4, marginBottom: space.md, alignSelf: "flex-start" }}>
              <Text style={{ ...typography.bodyXS, fontWeight: "700", color: selectedCat.deductible ? colour.success : colour.danger }}>
                {selectedCat.code} · {selectedCat.deductible ? "Deductible ✓" : "Non-deductible"}
              </Text>
            </View>
          )}

          {showCatPicker && (
            <View style={{ marginBottom: space.md }}>
              {CATEGORIES.map(cat => (
                <TouchableOpacity
                  key={cat.name}
                  onPress={() => { setCategory(cat.name); setShowCatPicker(false); }}
                  style={{ flexDirection: "row", alignItems: "center", paddingVertical: space.md, borderBottomWidth: 1, borderBottomColor: colour.borderLight }}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={{ ...typography.bodyM, color: colour.text }}>{cat.name}</Text>
                    <Text style={{ ...typography.bodyXS, color: colour.textSub }}>{cat.code}</Text>
                  </View>
                  {category === cat.name && <Text style={{ color: colour.success }}>✓</Text>}
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Notes */}
          <FieldLabel label="Notes (optional)" extracted={ocrFields.notes} />
          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder="Any additional notes…"
            placeholderTextColor={colour.textHint}
            multiline
            style={{ ...typography.bodyM, color: colour.text, borderBottomWidth: 1.5, borderBottomColor: ocrFields.notes ? colour.teal : colour.border, paddingVertical: space.sm, minHeight: 60 }}
          />
        </View>

        {/* AI note */}
        {anyOcr && (
          <View style={{ backgroundColor: colour.tealLight, borderRadius: radius.md, padding: space.md, marginBottom: space.md, flexDirection: "row", gap: space.sm }}>
            <Text style={{ fontSize: 16 }}>✨</Text>
            <Text style={{ ...typography.bodyXS, color: colour.teal, flex: 1, lineHeight: 18 }}>
              Fields marked with <Text style={{ fontWeight: "700" }}>AI</Text> were auto-filled by Claude. Please verify amounts and dates before saving.
            </Text>
          </View>
        )}

        {/* Save */}
        <TouchableOpacity
          onPress={handleSave}
          disabled={!canSave || saving}
          style={{ backgroundColor: canSave ? colour.primary : colour.surface2, borderRadius: radius.lg, height: 52, alignItems: "center", justifyContent: "center", marginBottom: space.sm }}
        >
          {saving
            ? <ActivityIndicator color={colour.onPrimary} />
            : <Text style={{ ...typography.btnL, color: canSave ? colour.onPrimary : colour.textSub }}>
                {canSave ? "Save Expense" : "Fill in required fields"}
              </Text>
          }
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.replace("/(tabs)")}
          style={{ alignItems: "center", paddingVertical: space.sm }}
        >
          <Text style={{ ...typography.bodyS, color: colour.textSub }}>Discard & go home</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
