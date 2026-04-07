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
  { name: "Travel & transport", code: "S11(a)", deductible: true },
  { name: "Home office", code: "S11(a)", deductible: true },
  { name: "Equipment & tools", code: "S11(e)", deductible: true },
  { name: "Software & subscriptions", code: "S11(a)", deductible: true },
  { name: "Meals & entertainment", code: "S11(a)", deductible: true },
  { name: "Professional fees", code: "S11(a)", deductible: true },
  { name: "Telephone & cell", code: "S11(a)", deductible: true },
  { name: "Marketing & advertising", code: "S11(a)", deductible: true },
  { name: "Bank charges", code: "S11(a)", deductible: true },
  { name: "Insurance", code: "S11(a)", deductible: true },
  { name: "Rent", code: "S11(a)", deductible: true },
  { name: "Repairs & maintenance", code: "S11(a)", deductible: true },
  { name: "Education", code: "S11(a)", deductible: true },
  { name: "Vehicle expenses", code: "Page 24", deductible: true },
  { name: "Personal / non-deductible", code: "N/A", deductible: false },
];

const LOW_CONFIDENCE_THRESHOLD = 0.7;

function fieldBorderColour(isOcr: boolean, isLowConf: boolean): string {
  if (!isOcr) return colour.border;
  if (isLowConf) return colour.warning;
  return colour.teal;
}

function FieldLabel({
  label,
  extracted,
  lowConfidence,
}: {
  label: string;
  extracted?: boolean;
  lowConfidence?: boolean;
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        marginBottom: space.xs,
      }}
    >
      <Text
        style={{
          ...typography.labelS,
          color: colour.textSub,
          letterSpacing: 0.5,
        }}
      >
        {label}
      </Text>
      {extracted && !lowConfidence && (
        <View
          style={{
            marginLeft: space.xs,
            backgroundColor: colour.tealLight,
            borderRadius: 4,
            paddingHorizontal: 5,
            paddingVertical: 1,
          }}
        >
          <Text style={{ fontSize: 9, fontWeight: "700", color: colour.teal }}>
            AI
          </Text>
        </View>
      )}
      {extracted && lowConfidence && (
        <View
          style={{
            marginLeft: space.xs,
            backgroundColor: colour.warningBg,
            borderRadius: 4,
            paddingHorizontal: 5,
            paddingVertical: 1,
          }}
        >
          <Text
            style={{ fontSize: 9, fontWeight: "700", color: colour.warning }}
          >
            Check
          </Text>
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
    vendorConf: string;
    amountConf: string;
    dateConf: string;
    vatAmountConf: string;
    categoryConf: string;
  }>();

  const [expenseType, setExpenseType] = useState<"business" | "personal">(
    "business",
  );
  const [amount, setAmount] = useState(params.amount ?? "");
  const [vendor, setVendor] = useState(params.vendor ?? "");
  const [date, setDate] = useState(
    params.date || new Date().toISOString().split("T")[0],
  );
  const [vatAmount, setVatAmount] = useState(params.vatAmount ?? "");
  const [category, setCategory] = useState(params.category ?? "");
  const [notes, setNotes] = useState(params.notes ?? "");
  const [showCatPicker, setShowCatPicker] = useState(false);
  const [saving, setSaving] = useState(false);

  const selectedCat = CATEGORIES.find((c) => c.name === category);

  // Personal toggle overrides category deductibility
  const isDeductible =
    expenseType === "business" ? (selectedCat?.deductible ?? false) : false;

  const canSave = !!amount && parseFloat(amount) > 0 && !!vendor && !!category;
  const hasReceipt = !!params.receiptUrl && params.receiptUrl !== "";

  const ocrFields = {
    vendor: !!params.vendor,
    amount: !!params.amount,
    date: !!params.date,
    vatAmount: !!params.vatAmount,
    category: !!params.category,
    notes: !!params.notes,
  };

  const conf = {
    vendor: parseFloat(params.vendorConf ?? "1"),
    amount: parseFloat(params.amountConf ?? "1"),
    date: parseFloat(params.dateConf ?? "1"),
    vatAmount: parseFloat(params.vatAmountConf ?? "1"),
    category: parseFloat(params.categoryConf ?? "1"),
  };

  const lowConf = {
    vendor: ocrFields.vendor && conf.vendor < LOW_CONFIDENCE_THRESHOLD,
    amount: ocrFields.amount && conf.amount < LOW_CONFIDENCE_THRESHOLD,
    date: ocrFields.date && conf.date < LOW_CONFIDENCE_THRESHOLD,
    vatAmount: ocrFields.vatAmount && conf.vatAmount < LOW_CONFIDENCE_THRESHOLD,
    category: ocrFields.category && conf.category < LOW_CONFIDENCE_THRESHOLD,
  };

  const anyOcr = Object.values(ocrFields).some(Boolean);
  const anyLowConf = Object.values(lowConf).some(Boolean);

  const handleSave = async () => {
    if (!canSave || !user) return;
    setSaving(true);
    try {
      let receiptUrl: string | undefined;
      if (params.storagePath) {
        const { supabase } = await import("@/lib/supabase");
        const { data: signedData } = await supabase.storage
          .from("receipts")
          .createSignedUrl(params.storagePath, 60 * 60 * 24 * 365);
        receiptUrl = signedData?.signedUrl ?? undefined;
      }

      await expenseService.addExpense(user.id, {
        vendor: vendor.trim(),
        amount: parseFloat(amount),
        category,
        itr12_code:
          expenseType === "personal" ? null : (selectedCat?.code ?? null),
        tax_year: ACTIVE_TAX_YEAR,
        expense_date: date,
        is_deductible: isDeductible,
        vat_amount: vatAmount ? parseFloat(vatAmount) : undefined,
        notes: notes.trim() || undefined,
        receipt_url: receiptUrl,
        storage_path: params.storagePath || undefined,
      });

      if (params.storagePath) {
        const { supabase } = await import("@/lib/supabase");
        await supabase
          .from("receipts")
          .update({ ocr_status: "done" })
          .eq("storage_path", params.storagePath);
      }

      Alert.alert(
        "Expense saved ✓",
        `${vendor} — R ${parseFloat(amount).toLocaleString("en-ZA", { minimumFractionDigits: 2 })} saved${hasReceipt ? " with receipt" : ""}.`,
        [{ text: "Done", onPress: () => router.replace("/(tabs)") }],
      );
    } catch (e: any) {
      Alert.alert("Error", e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView
      edges={["top"]}
      style={{ flex: 1, backgroundColor: colour.primary }}
    >
      <StatusBar barStyle="light-content" backgroundColor={colour.primary} />

      {/* Header */}
      <View
        style={{
          paddingHorizontal: space.lg,
          paddingTop: 3,
          paddingBottom: space["3xl"],
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: space.md,
          }}
        >
          <TouchableOpacity
            onPress={() => router.back()}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Text
              style={{ color: colour.onPrimary, fontSize: 26, lineHeight: 30 }}
            >
              ‹
            </Text>
          </TouchableOpacity>
          <Text
            style={{ ...typography.labelM, color: "rgba(255,255,255,0.85)" }}
          >
            Review receipt
          </Text>
          <View style={{ width: 40 }} />
        </View>
        <Text style={{ ...typography.h3, color: colour.onPrimary }}>
          Confirm details
        </Text>
        <Text
          style={{
            ...typography.bodyS,
            color: "rgba(255,255,255,0.7)",
            marginTop: 2,
          }}
        >
          {anyOcr
            ? anyLowConf
              ? "⚠️ Some fields need your attention — highlighted in amber"
              : "✨ AI extracted these details — please verify before saving"
            : hasReceipt
              ? "Receipt uploaded · Fill in the expense details"
              : "No receipt · Enter details manually"}
        </Text>
      </View>

      <ScrollView
        style={{
          flex: 1,
          backgroundColor: colour.background,
          borderTopLeftRadius: radius.xl,
          borderTopRightRadius: radius.xl,
        }}
        contentContainerStyle={{ padding: space.lg, paddingBottom: 120 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Receipt preview */}
        {hasReceipt && (
          <View
            style={{
              marginBottom: space.lg,
              borderRadius: radius.lg,
              overflow: "hidden",
              borderWidth: 1,
              borderColor: colour.borderLight,
            }}
          >
            <Image
              source={{ uri: decodeURIComponent(params.receiptUrl) }}
              style={{ width: "100%", height: 180 }}
              resizeMode="cover"
            />
            <View
              style={{
                backgroundColor: colour.successBg,
                padding: space.sm,
                flexDirection: "row",
                alignItems: "center",
                gap: space.xs,
              }}
            >
              <Text style={{ fontSize: 14 }}>🧾</Text>
              <Text
                style={{
                  ...typography.bodyXS,
                  color: colour.success,
                  fontWeight: "600",
                }}
              >
                Receipt uploaded ·{" "}
                {anyOcr
                  ? "AI auto-filled fields below"
                  : "Fill in details manually"}
              </Text>
            </View>
          </View>
        )}

        {/* Low confidence warning */}
        {anyLowConf && (
          <View
            style={{
              backgroundColor: colour.warningBg,
              borderRadius: radius.md,
              padding: space.md,
              marginBottom: space.md,
              flexDirection: "row",
              gap: space.sm,
            }}
          >
            <Text style={{ fontSize: 16 }}>⚠️</Text>
            <Text
              style={{
                ...typography.bodyXS,
                color: colour.warning,
                flex: 1,
                lineHeight: 18,
              }}
            >
              Fields marked <Text style={{ fontWeight: "700" }}>Check</Text> had
              low OCR confidence. Please review them carefully before saving.
            </Text>
          </View>
        )}

        {/* Form */}
        <View
          style={{
            backgroundColor: colour.white,
            borderRadius: radius.lg,
            padding: space.lg,
            borderWidth: 1,
            borderColor: colour.borderLight,
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
            Expense details
          </Text>

          {/* Business / Personal toggle */}
          <Text
            style={{
              ...typography.labelS,
              color: colour.textSub,
              letterSpacing: 0.5,
              marginBottom: space.xs,
            }}
          >
            Expense type
          </Text>
          <View
            style={{
              flexDirection: "row",
              backgroundColor: colour.surface1,
              borderRadius: radius.md,
              padding: 3,
              marginBottom: space.lg,
            }}
          >
            {(["business", "personal"] as const).map((t) => (
              <TouchableOpacity
                key={t}
                onPress={() => setExpenseType(t)}
                style={{
                  flex: 1,
                  paddingVertical: space.sm,
                  borderRadius: radius.sm,
                  backgroundColor:
                    expenseType === t ? colour.primary : "transparent",
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    ...typography.labelM,
                    color:
                      expenseType === t ? colour.onPrimary : colour.textSub,
                  }}
                >
                  {t === "business" ? "💼 Business" : "👤 Personal"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Personal notice */}
          {expenseType === "personal" && (
            <View
              style={{
                backgroundColor: colour.warningBg,
                borderRadius: radius.sm,
                padding: space.sm,
                marginBottom: space.lg,
              }}
            >
              <Text style={{ ...typography.bodyXS, color: colour.warning }}>
                Personal expenses are not deductible and will not be included in
                your ITR12 calculations.
              </Text>
            </View>
          )}

          {/* Amount */}
          <FieldLabel
            label="Amount (ZAR) *"
            extracted={ocrFields.amount}
            lowConfidence={lowConf.amount}
          />
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              borderBottomWidth: 1.5,
              borderBottomColor: fieldBorderColour(
                ocrFields.amount,
                lowConf.amount,
              ),
              marginBottom: space.lg,
              backgroundColor: lowConf.amount
                ? colour.warningBg
                : "transparent",
              borderRadius: lowConf.amount ? 4 : 0,
              paddingHorizontal: lowConf.amount ? space.xs : 0,
            }}
          >
            <Text
              style={{
                ...typography.bodyL,
                color: colour.textSub,
                marginRight: space.xs,
              }}
            >
              R
            </Text>
            <TextInput
              value={amount}
              onChangeText={setAmount}
              placeholder="0.00"
              placeholderTextColor={colour.textHint}
              keyboardType="decimal-pad"
              style={{
                ...typography.amountM,
                flex: 1,
                color: colour.text,
                paddingVertical: space.sm,
              }}
            />
          </View>

          {/* Vendor */}
          <FieldLabel
            label="Vendor / supplier *"
            extracted={ocrFields.vendor}
            lowConfidence={lowConf.vendor}
          />
          <TextInput
            value={vendor}
            onChangeText={setVendor}
            placeholder="e.g. Engen, Telkom, Checkers"
            placeholderTextColor={colour.textHint}
            style={{
              ...typography.bodyM,
              color: colour.text,
              borderBottomWidth: 1.5,
              borderBottomColor: fieldBorderColour(
                ocrFields.vendor,
                lowConf.vendor,
              ),
              paddingVertical: space.sm,
              marginBottom: space.lg,
              backgroundColor: lowConf.vendor
                ? colour.warningBg
                : "transparent",
              borderRadius: lowConf.vendor ? 4 : 0,
              paddingHorizontal: lowConf.vendor ? space.xs : 0,
            }}
          />

          {/* Date */}
          <FieldLabel
            label="Date (YYYY-MM-DD)"
            extracted={ocrFields.date}
            lowConfidence={lowConf.date}
          />
          <TextInput
            value={date}
            onChangeText={setDate}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={colour.textHint}
            style={{
              ...typography.bodyM,
              color: colour.text,
              borderBottomWidth: 1.5,
              borderBottomColor: fieldBorderColour(
                ocrFields.date,
                lowConf.date,
              ),
              paddingVertical: space.sm,
              marginBottom: space.lg,
              backgroundColor: lowConf.date ? colour.warningBg : "transparent",
              borderRadius: lowConf.date ? 4 : 0,
              paddingHorizontal: lowConf.date ? space.xs : 0,
            }}
          />

          {/* VAT */}
          <FieldLabel
            label="VAT amount (optional)"
            extracted={ocrFields.vatAmount}
            lowConfidence={lowConf.vatAmount}
          />
          <TextInput
            value={vatAmount}
            onChangeText={setVatAmount}
            placeholder="0.00"
            placeholderTextColor={colour.textHint}
            keyboardType="decimal-pad"
            style={{
              ...typography.bodyM,
              color: colour.text,
              borderBottomWidth: 1.5,
              borderBottomColor: fieldBorderColour(
                ocrFields.vatAmount,
                lowConf.vatAmount,
              ),
              paddingVertical: space.sm,
              marginBottom: space.lg,
            }}
          />

          {/* Category */}
          <FieldLabel
            label="ITR12 category *"
            extracted={ocrFields.category}
            lowConfidence={lowConf.category}
          />
          <TouchableOpacity
            onPress={() => setShowCatPicker((v) => !v)}
            style={{
              borderBottomWidth: 1.5,
              borderBottomColor: category
                ? fieldBorderColour(ocrFields.category, lowConf.category)
                : colour.border,
              paddingVertical: space.sm,
              marginBottom: space.xs,
              flexDirection: "row",
              justifyContent: "space-between",
              backgroundColor: lowConf.category
                ? colour.warningBg
                : "transparent",
              borderRadius: lowConf.category ? 4 : 0,
              paddingHorizontal: lowConf.category ? space.xs : 0,
            }}
          >
            <Text
              style={{
                ...typography.bodyM,
                color: category ? colour.text : colour.textHint,
              }}
            >
              {category || "Select category…"}
            </Text>
            <Text style={{ color: colour.textSub }}>
              {showCatPicker ? "∨" : "›"}
            </Text>
          </TouchableOpacity>

          {selectedCat && (
            <View
              style={{
                backgroundColor: isDeductible
                  ? colour.successBg
                  : colour.dangerBg,
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
                  color: isDeductible ? colour.success : colour.danger,
                }}
              >
                {expenseType === "personal" ? "N/A" : selectedCat.code} ·{" "}
                {isDeductible ? "Deductible ✓" : "Non-deductible"}
              </Text>
            </View>
          )}

          {showCatPicker && (
            <View style={{ marginBottom: space.md }}>
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat.name}
                  onPress={() => {
                    setCategory(cat.name);
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
                  <View style={{ flex: 1 }}>
                    <Text style={{ ...typography.bodyM, color: colour.text }}>
                      {cat.name}
                    </Text>
                    <Text
                      style={{ ...typography.bodyXS, color: colour.textSub }}
                    >
                      {cat.code}
                    </Text>
                  </View>
                  {category === cat.name && (
                    <Text style={{ color: colour.success }}>✓</Text>
                  )}
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
            style={{
              ...typography.bodyM,
              color: colour.text,
              borderBottomWidth: 1.5,
              borderBottomColor: ocrFields.notes ? colour.teal : colour.border,
              paddingVertical: space.sm,
              minHeight: 60,
            }}
          />
        </View>

        {/* AI legend */}
        {anyOcr && (
          <View
            style={{
              backgroundColor: colour.tealLight,
              borderRadius: radius.md,
              padding: space.md,
              marginBottom: space.md,
              flexDirection: "row",
              gap: space.sm,
            }}
          >
            <Text style={{ fontSize: 16 }}>✨</Text>
            <Text
              style={{
                ...typography.bodyXS,
                color: colour.teal,
                flex: 1,
                lineHeight: 18,
              }}
            >
              Fields marked <Text style={{ fontWeight: "700" }}>AI</Text> were
              auto-filled by Claude with high confidence. Fields marked{" "}
              <Text style={{ fontWeight: "700", color: colour.warning }}>
                Check
              </Text>{" "}
              had lower confidence — please verify carefully.
            </Text>
          </View>
        )}

        {/* Save */}
        <TouchableOpacity
          onPress={handleSave}
          disabled={!canSave || saving}
          style={{
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
              {canSave ? "Save expense" : "Fill in required fields"}
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.replace("/(tabs)")}
          style={{ alignItems: "center", paddingVertical: space.sm }}
        >
          <Text style={{ ...typography.bodyS, color: colour.textSub }}>
            Discard & go home
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
