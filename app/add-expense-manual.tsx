import { InfoBanner } from "@/components/InfoBanner";
import { MXHeader } from "@/components/MXHeader";
import { MXTabBar } from "@/components/MXTabBar";
import { SuccessModal } from "@/components/SuccessModal";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { CATEGORIES } from "@/constants/categories";
import { expenseService } from "@/services/expenseService";
import { useAuthStore } from "@/stores/authStore";
import { floorRatio, useHomeOfficeStore } from "@/stores/homeOfficeStore";
import { colour } from "@/tokens";
import { SARS_RATE_PER_KM, taxYearForDate } from "@/lib/taxRules";
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

interface Props {}

const NAV = { Home: "⊞", Scan: "⊡", Reports: "◈", Settings: "⚙" };

function PhoneShell({ children }: { children: React.ReactNode }) {
  return (
    <View style={{ flex: 1, backgroundColor: colour.surface1 }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
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
  examples: c.examples,
}));

export default function AddExpenseScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { setting: homeOfficeSetting, load: loadHomeOffice } = useHomeOfficeStore();
  React.useEffect(() => { if (user) loadHomeOffice(user.id); }, [user]);
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
  const [insuranceSubType, setInsuranceSubType] = useState<"business" | "property_contents">("business");
  const [interestSubType, setInterestSubType] = useState<"business_loan" | "bond" | "personal">("business_loan");
  const [saving, setSaving] = useState(false);
  const [successVisible, setSuccessVisible] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

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
      const ratio = homeOfficeSetting ? floorRatio(homeOfficeSetting) : 1;
      const HOME_OFFICE_CATS = ["Home Office", "Utilities", "Repairs & Maintenance"];
      let pct = 1;
      let overrideDeductible: boolean | undefined;

      if (category === "Telephone & Cell" || category === "Telephone & Internet") {
        pct = Math.min(Math.max(parseFloat(businessUsePct) || 100, 0), 100) / 100;
      } else if (HOME_OFFICE_CATS.includes(category)) {
        pct = ratio;
      } else if (category === "Insurance") {
        pct = insuranceSubType === "property_contents"
          ? ratio
          : Math.min(Math.max(parseFloat(businessUsePct) || 100, 0), 100) / 100;
      } else if (category === "Interest & Finance Charges") {
        if (interestSubType === "personal") {
          overrideDeductible = false;
        } else if (interestSubType === "bond") {
          pct = ratio;
        }
      }

      const savedAmount = parseFloat((rawAmount * pct).toFixed(2));

      await expenseService.addExpense(user.id, {
        vendor: vendor.trim(),
        amount: savedAmount,
        category,
        itr12_code: selectedCat?.code ?? null,
        tax_year: taxYearForDate(expenseDate),
        expense_date: expenseDate,
        is_deductible: overrideDeductible ?? (expType === "business"),
        vat_amount: vatAmount ? parseFloat(vatAmount) : undefined,
        notes: note.trim() || undefined,
      });

      setAmount("");
      setVendor("");
      setCategory("");
      setVatAmount("");
      setNote("");
      setBusinessUsePct("100");

      setSuccessMessage(`R ${savedAmount.toLocaleString("en-ZA", { minimumFractionDigits: 2 })} at ${vendor.trim()} has been saved.`);
      setSuccessVisible(true);
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
              <View style={{ backgroundColor: colour.infoLight, borderRadius: 8, padding: 10, marginBottom: 10 }}>
                <Text style={{ fontSize: 12, color: colour.info, lineHeight: 18 }}>
                  What percentage of your phone is used for work? Enter that number below — we'll only claim that portion as a deduction.
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
          {(category === "Home Office" || category === "Utilities" || category === "Repairs & Maintenance") && (
            <InfoBanner
              icon="house.fill"
              title={
                homeOfficeSetting
                  ? `Your home office takes up ${(floorRatio(homeOfficeSetting) * 100).toFixed(1)}% of your home`
                  : "Home office size not set up yet"
              }
              body={
                homeOfficeSetting
                  ? `Only ${(floorRatio(homeOfficeSetting) * 100).toFixed(1)}% of this expense can be claimed (${homeOfficeSetting.officeM2}m² ÷ ${homeOfficeSetting.totalM2}m²).${amount && parseFloat(amount) > 0 ? ` Claimable amount: R ${Math.round(parseFloat(amount) * floorRatio(homeOfficeSetting)).toLocaleString("en-ZA")}` : ""}`
                  : "Go to Settings → Tax setup → Home office to enter your room sizes. We'll automatically work out the claimable portion."
              }
              style={{ marginBottom: 10 }}
            />
          )}
          {category === "Equipment & Tools" && !!amount && parseFloat(amount) > 7000 && (
            <View style={{ backgroundColor: colour.infoLight, borderRadius: 8, padding: 10, marginBottom: 10 }}>
              <Text style={{ fontSize: 12, color: colour.info, lineHeight: 18 }}>
                Big-ticket items like this may need to be claimed over a few years instead of all at once (e.g. 3 years for computers, 6 years for furniture). Check with your tax practitioner.
              </Text>
            </View>
          )}
          {category === "Vehicle Expenses" && (
            <InfoBanner
              icon="car.fill"
              body={`Only the work portion counts. Divide your work km by your total km for the year to find the claimable percentage — your mileage logbook tracks this. A flat rate of R${SARS_RATE_PER_KM}/km is tracked separately under Mileage.`}
              style={{ marginBottom: 10 }}
            />
          )}
          {category === "Retirement Annuity" && (
            <View style={{ backgroundColor: colour.noir, borderRadius: 8, padding: 10, marginBottom: 10 }}>
              <Text style={{ fontSize: 12, color: colour.onNoir2, lineHeight: 18 }}>
                You can claim up to 27.5% of your income (max R350,000/year) for RA contributions. You'll need a certificate (IT3a) from your RA provider to submit with your tax return.
              </Text>
            </View>
          )}
          {category === "Meals & Entertainment" && (
            <View style={{ backgroundColor: colour.infoLight, borderRadius: 8, padding: 10, marginBottom: 10 }}>
              <Text style={{ fontSize: 12, color: colour.info, lineHeight: 18 }}>
                SARS only allows 80% of meals and entertainment to be claimed. We apply this limit automatically when you save.
              </Text>
            </View>
          )}
          {category === "Insurance" && (
            <>
              <FieldLabel label="Insurance type" />
              <View style={{ flexDirection: "row", backgroundColor: colour.surface2, borderRadius: 10, padding: 3, marginBottom: 14 }}>
                <TouchableOpacity
                  onPress={() => setInsuranceSubType("business")}
                  style={{ flex: 1, paddingVertical: 8, borderRadius: 8, backgroundColor: insuranceSubType === "business" ? colour.primary : "transparent", alignItems: "center" }}
                >
                  <Text style={{ fontSize: 11, fontWeight: "600", color: insuranceSubType === "business" ? colour.onPrimary : colour.textSub }}>
                    Business policy
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setInsuranceSubType("property_contents")}
                  style={{ flex: 1, paddingVertical: 8, borderRadius: 8, backgroundColor: insuranceSubType === "property_contents" ? colour.primary : "transparent", alignItems: "center" }}
                >
                  <Text style={{ fontSize: 11, fontWeight: "600", color: insuranceSubType === "property_contents" ? colour.onPrimary : colour.textSub }}>
                    Property / contents
                  </Text>
                </TouchableOpacity>
              </View>
              {insuranceSubType === "business" ? (
                <>
                  <InfoBanner
                    icon="shield.fill"
                    body="If the policy is purely for your business (e.g. professional indemnity), enter 100%. If it covers both personal and business use, enter just the work percentage."
                    style={{ marginBottom: 10 }}
                  />
                  <FieldLabel label="Business use %" />
                  <UnderlineInput
                    value={businessUsePct}
                    onChangeText={setBusinessUsePct}
                    placeholder="e.g. 60"
                    keyboardType="decimal-pad"
                  />
                </>
              ) : (
                <InfoBanner
                  icon="house.fill"
                  title={homeOfficeSetting ? `We'll claim ${(floorRatio(homeOfficeSetting) * 100).toFixed(1)}% based on your home office size` : "Home office size not set up yet"}
                  body={homeOfficeSetting
                    ? `Your home office takes up ${(floorRatio(homeOfficeSetting) * 100).toFixed(1)}% of your home (${homeOfficeSetting.officeM2}m² ÷ ${homeOfficeSetting.totalM2}m²), so we'll claim that portion of this insurance.${amount && parseFloat(amount) > 0 ? ` Claimable amount: R ${Math.round(parseFloat(amount) * floorRatio(homeOfficeSetting)).toLocaleString("en-ZA")}` : ""}`
                    : "Go to Settings → Tax setup → Home office to enter your room sizes."}
                  style={{ marginBottom: 10 }}
                />
              )}
            </>
          )}
          {category === "Interest & Finance Charges" && (
            <>
              <FieldLabel label="Interest type" />
              <View style={{ flexDirection: "row", backgroundColor: colour.surface2, borderRadius: 10, padding: 3, marginBottom: 14 }}>
                {([
                  { key: "business_loan" as const, label: "Business" },
                  { key: "bond" as const, label: "Bond" },
                  { key: "personal" as const, label: "Personal" },
                ]).map((opt) => (
                  <TouchableOpacity
                    key={opt.key}
                    onPress={() => setInterestSubType(opt.key)}
                    style={{ flex: 1, paddingVertical: 8, borderRadius: 8, backgroundColor: interestSubType === opt.key ? colour.primary : "transparent", alignItems: "center" }}
                  >
                    <Text style={{ fontSize: 11, fontWeight: "600", color: interestSubType === opt.key ? colour.onPrimary : colour.textSub }}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              {interestSubType === "business_loan" && (
                <InfoBanner
                  icon="creditcard.fill"
                  body="All the interest on a business loan can be claimed, as long as the loan was used to run your business."
                  style={{ marginBottom: 10 }}
                />
              )}
              {interestSubType === "bond" && (
                <InfoBanner
                  icon="house.fill"
                  title={homeOfficeSetting ? `We'll claim ${(floorRatio(homeOfficeSetting) * 100).toFixed(1)}% based on your home office size` : "Home office size not set up yet"}
                  body={homeOfficeSetting
                    ? `Only the home office portion of your bond interest can be claimed. Your office takes up ${(floorRatio(homeOfficeSetting) * 100).toFixed(1)}% of your home (${homeOfficeSetting.officeM2}m² ÷ ${homeOfficeSetting.totalM2}m²).${amount && parseFloat(amount) > 0 ? ` Claimable amount: R ${Math.round(parseFloat(amount) * floorRatio(homeOfficeSetting)).toLocaleString("en-ZA")}` : ""}`
                    : "Go to Settings → Tax setup → Home office to enter your room sizes."}
                  style={{ marginBottom: 10 }}
                />
              )}
              {interestSubType === "personal" && (
                <InfoBanner
                  icon="xmark.circle.fill"
                  body="Personal interest like credit cards or personal loans can't be claimed as a tax deduction. This expense will be saved as non-deductible."
                  style={{ marginBottom: 10 }}
                />
              )}
            </>
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
                    alignItems: "flex-start",
                    paddingVertical: 11,
                    borderBottomWidth: 1,
                    borderBottomColor: colour.border,
                  }}
                >
                  <IconSymbol name={cat.icon as any} size={18} color={colour.primary} style={{ marginRight: 12, marginTop: 1 } as any} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, color: colour.text }}>
                      {cat.label}
                    </Text>
                    <Text style={{ fontSize: 11, color: colour.textSub, marginTop: 2 }} numberOfLines={1}>
                      {cat.examples}
                    </Text>
                  </View>
                  <Text
                    style={{
                      fontSize: 11,
                      color: colour.accent,
                      fontWeight: "600",
                      marginLeft: 8,
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

      <SuccessModal
        visible={successVisible}
        title="Expense saved"
        message={successMessage}
        primaryLabel="Go to dashboard"
        onPrimary={() => { setSuccessVisible(false); router.replace("/(tabs)" as any); }}
        secondaryLabel="Add another"
        onSecondary={() => setSuccessVisible(false)}
      />
    </SafeAreaView>
  );
}
