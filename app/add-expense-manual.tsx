import { MXHeader } from "@/components/MXHeader";
import { MXTabBar } from "@/components/MXTabBar";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { CATEGORIES } from "@/constants/categories";
import { expenseService } from "@/services/expenseService";
import { useAuthStore } from "@/stores/authStore";
import { colour } from "@/tokens";
import { ACTIVE_TAX_YEAR } from "@/types/database";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StatusBar,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface Props {}

const NAV = { Home: "⊞", Scan: "⊡", Reports: "◈", Settings: "⚙" };

function PhoneShell({ children }: { children: React.ReactNode }) {
  return (
    <View style={{ flex: 1, backgroundColor: colour.surface1 }}>
      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {children}
      </ScrollView>
      <MXTabBar />
    </View>
  );
}

function FieldLabel({ label }: { label: string }) {
  return (
    <Text
      style={{
        fontSize: 11,
        fontWeight: "700",
        color: colour.textSub,
        letterSpacing: 0.5,
        marginBottom: 8,
      }}
    >
      {label}
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
      placeholderTextColor={colour.textSub}
      keyboardType={keyboardType}
      multiline={multiline}
      textAlignVertical={multiline ? "top" : "auto"}
      style={{
        fontSize: 15,
        color: colour.text,
        borderBottomWidth: 1,
        borderBottomColor: colour.border,
        paddingBottom: 10,
        paddingTop: 4,
        marginBottom: 20,
        minHeight: multiline ? 60 : undefined,
      }}
    />
  );
}

// Derived from shared canonical list — names must match category-breakdown and receipt-review.
const ITR12_CATEGORIES = CATEGORIES.map((c) => ({
  label: c.label,
  icon: c.icon,
  code: c.code,
}));

export default function AddExpenseScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [amount, setAmount] = useState("");
  const [vendor, setVendor] = useState("");
  const [date, setDate] = useState(
    new Date().toLocaleDateString("en-ZA", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }),
  );
  const [category, setCategory] = useState("");
  const [expType, setExpType] = useState<"business" | "personal">("business");
  const [vatNumber, setVatNumber] = useState("");
  const [vatAmount, setVatAmount] = useState("");
  const [note, setNote] = useState("");
  const [showCatPicker, setShowCatPicker] = useState(false);
  const [businessUsePct, setBusinessUsePct] = useState("100");
  const [saving, setSaving] = useState(false);

  const selectedCat = ITR12_CATEGORIES.find((c) => c.label === category);
  const canSave = !!amount && parseFloat(amount) > 0 && !!vendor && !!category;

  const handleSave = async () => {
    if (!canSave || !user) return;

    // Parse DD/MM/YYYY → YYYY-MM-DD
    let expenseDate = date;
    if (date.includes("/")) {
      const parts = date.split("/");
      if (parts.length === 3) {
        expenseDate = `${parts[2]}-${parts[1].padStart(2, "0")}-${parts[0].padStart(2, "0")}`;
      }
    }

    setSaving(true);
    try {
      const rawAmount = parseFloat(amount);
      const pct = category === "Telephone & Cell" ? Math.min(Math.max(parseFloat(businessUsePct) || 100, 0), 100) / 100 : 1;
      const savedAmount = parseFloat((rawAmount * pct).toFixed(2));

      await expenseService.addExpense(user.id, {
        vendor: vendor.trim(),
        amount: savedAmount,
        category,
        itr12_code: selectedCat?.code ?? null,
        tax_year: ACTIVE_TAX_YEAR,
        expense_date: expenseDate,
        is_deductible: expType === "business",
        vat_amount: vatAmount ? parseFloat(vatAmount) : undefined,
        notes: note.trim() || undefined,
      });

      setAmount("");
      setVendor("");
      setCategory("");
      setVatAmount("");
      setNote("");
      setBusinessUsePct("100");

      Alert.alert(
        "Expense Saved ✓",
        `R ${savedAmount.toLocaleString("en-ZA", { minimumFractionDigits: 2 })} at ${vendor.trim()} has been saved.`,
        [
          { text: "Add another", style: "cancel" },
          { text: "Go home", onPress: () => router.replace("/(tabs)" as any) },
        ],
      );
    } catch (e: any) {
      Alert.alert("Error saving expense", e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: colour.surface1 }}>
      <StatusBar barStyle="dark-content" backgroundColor={colour.surface1} />
      <MXHeader title="Add expense" showBack />
      <PhoneShell>

      <View
        style={{
          backgroundColor: colour.surface1,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          marginTop: -16,
          paddingBottom: 30,
        }}
      >
        {/* Receipt capture shortcuts */}
        <View
          style={{
            flexDirection: "row",
            paddingHorizontal: 16,
            paddingTop: 20,
            gap: 10,
            marginBottom: 20,
          }}
        >
          <TouchableOpacity
            onPress={() => router.push("/scan-receipt-camera" as any)}
            style={{
              flex: 1,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: colour.primary,
              borderRadius: 12,
              padding: 12,
              gap: 8,
            }}
          >
            <IconSymbol name="camera.fill" size={18} color={colour.onPrimary} />
            <Text
              style={{
                fontSize: 13,
                fontWeight: "700",
                color: colour.onPrimary,
              }}
            >
              Scan receipt
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push("/upload-from-gallery" as any)}
            style={{
              flex: 1,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: colour.surface2,
              borderRadius: 12,
              padding: 12,
              gap: 8,
              borderWidth: 1,
              borderColor: colour.border,
            }}
          >
            <IconSymbol name="photo.fill" size={18} color={colour.text} />
            <Text
              style={{ fontSize: 13, fontWeight: "700", color: colour.text }}
            >
              From gallery
            </Text>
          </TouchableOpacity>
        </View>

        <View
          style={{
            marginHorizontal: 16,
            backgroundColor: colour.surface2,
            borderRadius: 14,
            padding: 20,
            borderWidth: 1,
            borderColor: colour.border,
            marginBottom: 12,
          }}
        >
          <Text
            style={{
              fontSize: 13,
              fontWeight: "700",
              color: colour.text,
              marginBottom: 18,
            }}
          >
            Expense details
          </Text>

          {/* Business / Personal toggle */}
          <FieldLabel label="Expense type" />
          <View
            style={{
              flexDirection: "row",
              backgroundColor: colour.surface2,
              borderRadius: 10,
              padding: 3,
              marginBottom: 20,
            }}
          >
            {(["business", "personal"] as const).map((t) => (
              <TouchableOpacity
                key={t}
                onPress={() => setExpType(t)}
                style={{
                  flex: 1,
                  paddingVertical: 8,
                  borderRadius: 8,
                  backgroundColor:
                    expType === t ? colour.primary : "transparent",
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: "600",
                    color: expType === t ? colour.onPrimary : colour.textSub,
                  }}
                >
                  {t === "business" ? "Business" : "Personal"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Amount */}
          <FieldLabel label="Amount (ZAR)" />
          <UnderlineInput
            value={amount}
            onChangeText={setAmount}
            placeholder="0.00"
            keyboardType="decimal-pad"
          />

          {/* Vendor */}
          <FieldLabel label="Vendor / supplier" />
          <UnderlineInput
            value={vendor}
            onChangeText={setVendor}
            placeholder="e.g. Engen, Microsoft, Checkers"
          />

          {/* Date */}
          <FieldLabel label="Date" />
          <UnderlineInput
            value={date}
            onChangeText={setDate}
            placeholder="DD/MM/YYYY"
            keyboardType="numeric"
          />

          {/* Category */}
          <FieldLabel label="ITR12 category" />
          <TouchableOpacity
            onPress={() => setShowCatPicker((v) => !v)}
            style={{
              borderBottomWidth: 1,
              borderBottomColor: colour.border,
              paddingBottom: 10,
              marginBottom: 8,
              flexDirection: "row",
              alignItems: "center",
            }}
          >
            <Text
              style={{
                flex: 1,
                fontSize: 15,
                color: category ? colour.text : colour.textSub,
              }}
            >
              {selectedCat ? selectedCat.label : "Select a category…"}
            </Text>
            <Text style={{ color: colour.primary, fontSize: 16 }}>
              {showCatPicker ? "∨" : "›"}
            </Text>
          </TouchableOpacity>
          {selectedCat && (
            <View
              style={{
                backgroundColor: colour.surface2,
                borderRadius: 8,
                paddingHorizontal: 10,
                paddingVertical: 5,
                marginBottom: 16,
                alignSelf: "flex-start",
              }}
            >
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: "700",
                  color: colour.accent,
                }}
              >
                ITR12 {selectedCat.code} — Deductible
              </Text>
            </View>
          )}
          {/* Contextual notes per category */}
          {category === "Telephone & Cell" && (
            <View>
              <View style={{ backgroundColor: "#FFF8E1", borderRadius: 8, padding: 10, marginBottom: 10 }}>
                <Text style={{ fontSize: 12, color: "#7B5800", lineHeight: 18 }}>
                  SARS requires a stated business-use percentage. Enter the % of this device used for business. The deductible amount will be adjusted accordingly.
                </Text>
              </View>
              <FieldLabel label="Business use %" />
              <UnderlineInput
                value={businessUsePct}
                onChangeText={setBusinessUsePct}
                placeholder="e.g. 80"
                keyboardType="decimal-pad"
              />
            </View>
          )}
          {(category === "Home Office" || category === "Utilities") && (
            <View style={{ backgroundColor: "#E8F5E9", borderRadius: 8, padding: 10, marginBottom: 10 }}>
              <Text style={{ fontSize: 12, color: "#1B5E20", lineHeight: 18 }}>
                Only the office portion is deductible. Formula: office m² ÷ total property m² × total cost. Enter the proportional amount only (e.g. 15m² ÷ 120m² = 12.5%).
              </Text>
            </View>
          )}
          {category === "Equipment & Tools" && !!amount && parseFloat(amount) > 7000 && (
            <View style={{ backgroundColor: "#FFF3E0", borderRadius: 8, padding: 10, marginBottom: 10 }}>
              <Text style={{ fontSize: 12, color: "#BF360C", lineHeight: 18 }}>
                Items over R7,000 may be subject to SARS wear & tear schedules (e.g. computers 3 years, furniture 6 years) rather than being expensed in full. Consult your tax practitioner.
              </Text>
            </View>
          )}
          {category === "Vehicle Expenses" && (
            <View style={{ backgroundColor: "#E3F2FD", borderRadius: 8, padding: 10, marginBottom: 10 }}>
              <Text style={{ fontSize: 12, color: "#0D47A1", lineHeight: 18 }}>
                Actual cost method: only the business proportion is deductible (business km ÷ total annual km × total vehicle costs). Check your mileage logbook for this ratio. The deemed cost method (R4.84/km) is tracked separately under Mileage.
              </Text>
            </View>
          )}
          {category === "Retirement Annuity" && (
            <View style={{ backgroundColor: "#F3E5F5", borderRadius: 8, padding: 10, marginBottom: 10 }}>
              <Text style={{ fontSize: 12, color: "#4A148C", lineHeight: 18 }}>
                RA deductions are capped at the greater of 27.5% of taxable income or remuneration, up to R350,000/year. SARS requires an IT3(a) certificate from your RA provider.
              </Text>
            </View>
          )}
          {category === "Meals & Entertainment" && (
            <View style={{ backgroundColor: "#FFF8E1", borderRadius: 8, padding: 10, marginBottom: 10 }}>
              <Text style={{ fontSize: 12, color: "#7B5800", lineHeight: 18 }}>
                Only 80% of meals & entertainment is deductible under S23(o). MyExpense applies this cap automatically.
              </Text>
            </View>
          )}

          {showCatPicker && (
            <View style={{ marginBottom: 16 }}>
              {ITR12_CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat.label}
                  onPress={() => {
                    setCategory(cat.label);
                    setShowCatPicker(false);
                  }}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingVertical: 11,
                    borderBottomWidth: 1,
                    borderBottomColor: colour.border,
                  }}
                >
                  <IconSymbol name={cat.icon as any} size={18} color={colour.primary} style={{ marginRight: 12 } as any} />
                  <Text style={{ flex: 1, fontSize: 14, color: colour.text }}>
                    {cat.label}
                  </Text>
                  <Text
                    style={{
                      fontSize: 11,
                      color: colour.accent,
                      fontWeight: "600",
                    }}
                  >
                    {cat.code}
                  </Text>
                  {category === cat.label && (
                    <Text
                      style={{
                        color: colour.accent,
                        marginLeft: 8,
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

        {/* VAT Section */}
        <View
          style={{
            marginHorizontal: 16,
            backgroundColor: colour.surface2,
            borderRadius: 14,
            padding: 20,
            borderWidth: 1,
            borderColor: colour.border,
            marginBottom: 12,
          }}
        >
          <Text
            style={{
              fontSize: 13,
              fontWeight: "700",
              color: colour.text,
              marginBottom: 18,
            }}
          >
            VAT details (optional)
          </Text>
          <FieldLabel label="Supplier VAT number" />
          <UnderlineInput
            value={vatNumber}
            onChangeText={setVatNumber}
            placeholder="e.g. 4123456789"
            keyboardType="numeric"
          />
          <FieldLabel label="VAT Amount (R)" />
          <UnderlineInput
            value={vatAmount}
            onChangeText={setVatAmount}
            placeholder="0.00"
            keyboardType="decimal-pad"
          />
        </View>

        {/* Note */}
        <View
          style={{
            marginHorizontal: 16,
            backgroundColor: colour.background,
            borderRadius: 14,
            padding: 20,
            borderWidth: 1,
            borderColor: colour.border,
            marginBottom: 20,
          }}
        >
          <Text
            style={{
              fontSize: 13,
              fontWeight: "700",
              color: colour.text,
              marginBottom: 18,
            }}
          >
            Notes
          </Text>
          <FieldLabel label="Description / Note" />
          <UnderlineInput
            value={note}
            onChangeText={setNote}
            placeholder="Optional description or memo…"
            multiline
          />
        </View>

        {/* Save */}
        <TouchableOpacity
          onPress={handleSave}
          disabled={!canSave || saving}
          style={{
            marginHorizontal: 16,
            backgroundColor:
              canSave && !saving ? colour.accent : colour.surface2,
            borderRadius: 14,
            padding: 16,
            alignItems: "center",
            marginBottom: 10,
          }}
        >
          {saving ? (
            <ActivityIndicator color={colour.onPrimary} />
          ) : (
            <Text
              style={{
                color: canSave ? colour.onPrimary : colour.textSub,
                fontSize: 15,
                fontWeight: "700",
              }}
            >
              {canSave ? "Save expense" : "Fill in required fields"}
            </Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ alignItems: "center", paddingVertical: 8 }}
        >
          <Text style={{ color: colour.textSub, fontSize: 13 }}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </PhoneShell>
    </SafeAreaView>
  );
}
