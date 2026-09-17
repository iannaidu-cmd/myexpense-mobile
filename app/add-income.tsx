import { IconSymbol } from "@/components/ui/icon-symbol";
import { MXHeader } from "@/components/MXHeader";
import { MXTabBar } from "@/components/MXTabBar";
import { SuccessModal } from "@/components/SuccessModal";
import {
  validateAmount,
  validateDate,
  validateIncomeSource,
  validateNote,
} from "@/lib/validation";
import { formatDateInputDDMMYYYY, isoToDisplayDate } from "@/lib/dateInput";
import { taxYearForDate } from "@/lib/taxRules";
import { incomeService } from "@/services/incomeService";
import { useAuthStore } from "@/stores/authStore";
import { colour, radius, space, typography } from "@/tokens";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
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

// ─── Income Categories ────────────────────────────────────────────────────────
const QUICK_PICKS = [
  { label: "Salary / Wage",   source: "Income of Employment (Salary / Wage)"          },
  { label: "Freelance",       source: "Fees from Companies / CC for Services Rendered" },
  { label: "Commission",      source: "Commission"                                      },
  { label: "Rental Income",   source: "Rental Income"                                  },
  { label: "Other",           source: "Other"                                           },
];

const FULL_CATEGORIES = [
  { label: "Commission"                                       },
  { label: "Consulting"                                       },
  { label: "Cost of Goods Sold"                              },
  { label: "Delivery Expenses"                               },
  { label: "Interest Received"                               },
  { label: "Petrol Allowance"                                },
  { label: "Car Allowance"                                   },
  { label: "Income of Employment (Salary / Wage)"            },
  { label: "Bonuses"                                         },
  { label: "Overtime"                                        },
  { label: "Fringe Benefits"                                 },
  { label: "Income or Profits (Beneficiary of a Trust)"     },
  { label: "Cell Phone Allowance"                            },
  { label: "Fees from Companies / CC for Services Rendered" },
  { label: "Investment Income"                               },
  { label: "Rental Income"                                   },
  { label: "Income of Royalties"                             },
  { label: "Annuities"                                       },
];

function FieldLabel({ label }: { label: string }) {
  return (
    <Text
      style={{
        ...typography.fieldLabel,
        color: colour.textSub,
        marginBottom: space.xs,
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

export default function AddIncomeScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const isEditing = !!id;

  const [amount, setAmount] = useState("");
  const [source, setSource] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(isoToDisplayDate(new Date().toISOString().split("T")[0]));
  const [showFullList, setShowFullList] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadingExisting, setLoadingExisting] = useState(isEditing);
  const [successVisible, setSuccessVisible] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // Pre-fill form when editing
  useEffect(() => {
    if (!id) return;
    incomeService.getIncomeById(id).then((entry) => {
      setAmount(String(entry.amount));
      setSource(entry.source);
      setCategory(entry.category ?? "");
      setDescription(entry.description ?? "");
      setDate(isoToDisplayDate(entry.date));
    }).catch(console.error).finally(() => setLoadingExisting(false));
  }, [id]);

  const canSave = !!amount && parseFloat(amount) > 0 && !!source;

  const selectSource = (s: string, label?: string) => {
    setSource(s);
    setCategory(label ?? s);
    setShowFullList(false);
  };

  const handleSave = async () => {
    if (!user) return;

    let incomeDate = date;
    if (date.includes("/")) {
      const parts = date.split("/");
      if (parts.length === 3) {
        incomeDate = `${parts[2]}-${parts[1].padStart(2, "0")}-${parts[0].padStart(2, "0")}`;
      }
    }

    const amountErr = validateAmount(amount);
    const sourceErr = validateIncomeSource(source);
    const dateErr = validateDate(incomeDate, { fieldName: "Income date", allowFuture: false });
    const noteErr = validateNote(description);
    const firstErr = amountErr ?? sourceErr ?? dateErr ?? noteErr;
    if (firstErr) {
      Alert.alert("Invalid input", firstErr);
      return;
    }

    setSaving(true);
    try {
      if (isEditing && id) {
        await incomeService.updateIncome(id, {
          amount: parseFloat(amount),
          source: source.trim(),
          description: description.trim() || undefined,
          date: incomeDate,
          tax_year: taxYearForDate(incomeDate),
        });
        setSuccessMessage(`Income updated successfully.`);
      } else {
        await incomeService.addIncome(user.id, {
          amount: parseFloat(amount),
          source: source.trim(),
          category: category.trim() || undefined,
          description: description.trim() || undefined,
          date: incomeDate,
          tax_year: taxYearForDate(incomeDate),
        });
        setAmount("");
        setSource("");
        setCategory("");
        setDescription("");
        setDate(isoToDisplayDate(new Date().toISOString().split("T")[0]));
        setSuccessMessage(`R ${parseFloat(amount).toLocaleString("en-ZA", { minimumFractionDigits: 2 })} from ${source} has been saved.`);
      }
      setSuccessVisible(true);
    } catch (e: any) {
      Alert.alert(isEditing ? "Error updating income" : "Error saving income", e.message);
    } finally {
      setSaving(false);
    }
  };

  if (loadingExisting) {
    return (
      <SafeAreaView edges={["top", "bottom"]} style={{ flex: 1, backgroundColor: colour.background }}>
        <StatusBar barStyle="dark-content" backgroundColor={colour.background} />
        <MXHeader title="Edit income" subtitle="Update your income entry" showBack />
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color={colour.primary} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      edges={["top"]}
      style={{ flex: 1, backgroundColor: colour.background }}
    >
      <StatusBar barStyle="dark-content" backgroundColor={colour.background} />

      <MXHeader
        title={isEditing ? "Edit income" : "Add income"}
        subtitle={isEditing ? "Update your income entry" : "Track your earnings for ITR12"}
        showBack
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
      <ScrollView
        style={{ flex: 1, backgroundColor: colour.background }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: space.xxxl }}
      >
        {/* Amount received hero */}
        <View
          style={{
            marginHorizontal: space.lg,
            marginTop: space.lg,
            marginBottom: space.md,
            backgroundColor: colour.white,
            borderRadius: radius.card,
            borderWidth: 1,
            borderColor: colour.border,
            padding: space.xl,
            alignItems: "center",
          }}
        >
          <Text
            style={{
              ...typography.eyebrow,
              color: colour.textSub,
              textTransform: "uppercase",
            }}
          >
            Amount received
          </Text>
          <View
            style={{
              flexDirection: "row",
              alignItems: "baseline",
              gap: space.xs,
              marginTop: space.sm,
            }}
          >
            <Text
              style={{
                fontSize: 24,
                fontWeight: "600",
                color: amount ? colour.text : colour.textHint,
              }}
            >
              R
            </Text>
            <TextInput
              value={amount}
              onChangeText={setAmount}
              placeholder="0,00"
              placeholderTextColor={colour.textHint}
              keyboardType="decimal-pad"
              style={{
                ...typography.amountXL,
                fontSize: 44,
                fontWeight: "800",
                letterSpacing: -2,
                color: amount ? colour.text : colour.textHint,
                minWidth: 120,
                textAlign: "center",
              }}
            />
          </View>
          <Text style={{ ...typography.mSub, color: colour.textSub, marginTop: space.sm }}>
            Gross, before any tax was taken off
          </Text>
        </View>

        {/* Quick pick */}
        <View
          style={{
            paddingHorizontal: space.lg,
            paddingTop: isEditing ? space.lg : 0,
            marginBottom: space.md,
          }}
        >
          <Text
            style={{
              ...typography.eyebrow,
              color: colour.textSub,
              textTransform: "uppercase",
              marginBottom: space.sm,
            }}
          >
            Quick select
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={{ flexDirection: "row", gap: space.sm }}>
              {QUICK_PICKS.map((q) => (
                <TouchableOpacity
                  key={q.label}
                  onPress={() => selectSource(q.source, q.label)}
                  style={{
                    paddingHorizontal: space.md,
                    paddingVertical: space.sm,
                    borderRadius: radius.pill,
                    backgroundColor:
                      source === q.source ? colour.primary : colour.surface2,
                    borderWidth: 1.5,
                    borderColor:
                      source === q.source ? colour.primary : colour.border,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: space.xs,
                  }}
                >
                  <Text
                    style={{
                      ...typography.fchipText,
                      color:
                        source === q.source ? colour.onPrimary : colour.text,
                    }}
                  >
                    {q.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Income details */}
        <View
          style={{
            marginHorizontal: space.lg,
            backgroundColor: colour.white,
            borderRadius: radius.card,
            padding: space.lg,
            borderWidth: 1,
            borderColor: colour.border,
            marginBottom: space.md,
          }}
        >
          <Text
            style={{
              ...typography.cardTitle,
              color: colour.text,
              marginBottom: space.lg,
            }}
          >
            Income details
          </Text>

          {/* Income source */}
          <FieldLabel label="Income source" />
          <TouchableOpacity
            onPress={() => setShowFullList((v) => !v)}
            style={{
              borderBottomWidth: 1.5,
              borderBottomColor: source ? colour.primary : colour.border,
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
                color: source ? colour.text : colour.textHint,
              }}
            >
              {source || "Select income source…"}
            </Text>
            <Text style={{ color: colour.textSub, fontSize: 16 }}>
              {showFullList ? "∨" : "›"}
            </Text>
          </TouchableOpacity>

          {source ? (
            <View
              style={{
                backgroundColor: colour.brandTeal + "2E",
                borderRadius: radius.pill,
                paddingHorizontal: space.sm,
                paddingVertical: 4,
                marginBottom: space.md,
                alignSelf: "flex-start",
              }}
            >
              <Text
                style={{
                  ...typography.chipText,
                  color: colour.text,
                }}
              >
                ITR12 Income ✓
              </Text>
            </View>
          ) : null}

          {showFullList && (
            <View style={{ marginBottom: space.md }}>
              <Text
                style={{
                  ...typography.fieldLabel,
                  color: colour.textSub,
                  marginBottom: space.sm,
                }}
              >
                All categories
              </Text>
              {FULL_CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat.label}
                  onPress={() => selectSource(cat.label)}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingVertical: space.md,
                    borderBottomWidth: 1,
                    borderBottomColor: colour.borderLight,
                  }}
                >
                  <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colour.primary, marginRight: space.md }} />
                  <Text
                    style={{ flex: 1, ...typography.bodyM, color: colour.text }}
                  >
                    {cat.label}
                  </Text>
                  {source === cat.label && (
                    <Text style={{ color: colour.primary, fontWeight: "800" }}>
                      ✓
                    </Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}

          <FieldLabel label="Date (DD/MM/YYYY)" />
          <UnderlineInput
            value={date}
            onChangeText={(t) => setDate(formatDateInputDDMMYYYY(t))}
            placeholder="DD/MM/YYYY"
            keyboardType="number-pad"
          />

          <FieldLabel label="Description (optional)" />
          <UnderlineInput
            value={description}
            onChangeText={setDescription}
            placeholder="e.g. Invoice #001, monthly retainer…"
            multiline
          />
        </View>

        {/* IRP5 / employment income note */}
        {!isEditing && (
          <View
            style={{
              flexDirection: "row",
              gap: space.sm,
              marginHorizontal: space.lg,
              marginBottom: space.md,
              backgroundColor: colour.primary + "17",
              borderWidth: 1,
              borderColor: colour.primary + "29",
              borderRadius: radius.note,
              padding: space.md,
            }}
          >
            <IconSymbol name="doc.text.fill" size={15} color={colour.primary} />
            <Text style={{ ...typography.noteText, color: colour.text, flex: 1 }}>
              <Text style={{ fontWeight: "700" }}>Adding IRP5 income? </Text>
              Use the IRP5 form instead so source codes and PAYE land on your ITR12.{" "}
              <Text
                style={{ fontWeight: "700", color: colour.accentDeep }}
                onPress={() => router.push("/add-irp5-income" as any)}
              >
                Open IRP5 form
              </Text>
            </Text>
          </View>
        )}

        {/* Save */}
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
            marginBottom: !canSave && !isEditing ? space.xxs : space.sm,
          }}
        >
          {saving ? (
            <ActivityIndicator color={colour.onPrimary} />
          ) : (
            <Text
              style={{
                ...typography.mBtn,
                color: canSave ? colour.onPrimary : colour.textSub,
              }}
            >
              {isEditing ? "Save changes" : "Add income"}
            </Text>
          )}
        </TouchableOpacity>

        {!isEditing && !canSave && !saving && (
          <Text
            style={{
              fontSize: 12,
              fontWeight: "600",
              color: colour.textHint,
              textAlign: "center",
              marginBottom: space.sm,
            }}
          >
            Enter an amount and pick a source
          </Text>
        )}

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
      <MXTabBar />

      <SuccessModal
        visible={successVisible}
        title={isEditing ? "Income updated" : "Income saved"}
        message={successMessage}
        primaryLabel={isEditing ? "Back to details" : "Go to dashboard"}
        onPrimary={() => {
          setSuccessVisible(false);
          isEditing ? router.back() : router.replace("/(tabs)");
        }}
        secondaryLabel={isEditing ? undefined : "Add another"}
        onSecondary={isEditing ? undefined : () => setSuccessVisible(false)}
      />
    </SafeAreaView>
  );
}
