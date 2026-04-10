import { MXHeader } from "@/components/MXHeader";
import { incomeService } from "@/services/incomeService";
import { useAuthStore } from "@/stores/authStore";
import { colour, radius, space, typography } from "@/tokens";
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

// ─── Income Categories ────────────────────────────────────────────────────────
const QUICK_PICKS = [
  {
    label: "Salary / Wage",
    icon: "💵",
    source: "Income of Employment (Salary / Wage)",
  },
  {
    label: "Freelance",
    icon: "💼",
    source: "Fees from Companies / CC for Services Rendered",
  },
  { label: "Commission", icon: "🤝", source: "Commission" },
  { label: "Rental Income", icon: "🏠", source: "Rental Income" },
  { label: "Other", icon: "📋", source: "Other" },
];

const FULL_CATEGORIES = [
  { label: "Commission", icon: "🤝" },
  { label: "Consulting", icon: "💼" },
  { label: "Cost of Goods Sold", icon: "📦" },
  { label: "Delivery Expenses", icon: "🚚" },
  { label: "Interest Received", icon: "💹" },
  { label: "Petrol Allowance", icon: "⛽" },
  { label: "Car Allowance", icon: "🚗" },
  { label: "Income of Employment (Salary / Wage)", icon: "💵" },
  { label: "Bonuses", icon: "🎉" },
  { label: "Overtime", icon: "⏱️" },
  { label: "Fridge Benefits", icon: "❄️" },
  { label: "Income or Profits (Beneficiary of a Trust)", icon: "📑" },
  { label: "Cell Phone Allowance", icon: "📱" },
  { label: "Fees from Companies / CC for Services Rendered", icon: "🏢" },
  { label: "Investment Income", icon: "📈" },
  { label: "Rental Income", icon: "🏠" },
  { label: "Income of Royalties", icon: "©️" },
  { label: "Annuities", icon: "📋" },
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

  const [amount, setAmount] = useState("");
  const [source, setSource] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [showFullList, setShowFullList] = useState(false);
  const [saving, setSaving] = useState(false);

  const canSave = !!amount && parseFloat(amount) > 0 && !!source;

  const selectSource = (s: string) => {
    setSource(s);
    setShowFullList(false);
  };

  const handleSave = async () => {
    if (!canSave || !user) return;

    let incomeDate = date;
    if (date.includes("/")) {
      const parts = date.split("/");
      if (parts.length === 3) {
        incomeDate = `${parts[2]}-${parts[1].padStart(2, "0")}-${parts[0].padStart(2, "0")}`;
      }
    }

    setSaving(true);
    try {
      await incomeService.addIncome(user.id, {
        amount: parseFloat(amount),
        source: source.trim(),
        description: description.trim() || undefined,
        date: incomeDate,
      });

      setAmount("");
      setSource("");
      setDescription("");
      setDate(new Date().toISOString().split("T")[0]);

      Alert.alert(
        "Income Saved ✓",
        `R ${parseFloat(amount).toLocaleString("en-ZA", { minimumFractionDigits: 2 })} from ${source} has been saved.`,
        [
          { text: "Add another", style: "cancel" },
          { text: "Go home", onPress: () => router.replace("/(tabs)") },
        ],
      );
    } catch (e: any) {
      Alert.alert("Error saving income", e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView
      edges={["top"]}
      style={{ flex: 1, backgroundColor: colour.success }}
    >
      <StatusBar barStyle="light-content" backgroundColor={colour.success} />

      <MXHeader
        title="Add income"
        subtitle="Track your earnings for ITR12"
        showBack
      />

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
        {/* Quick pick */}
        <View
          style={{
            paddingHorizontal: space.lg,
            paddingTop: space.lg,
            marginBottom: space.md,
          }}
        >
          <Text
            style={{
              ...typography.labelM,
              color: colour.textSub,
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
                  onPress={() => selectSource(q.source)}
                  style={{
                    paddingHorizontal: space.md,
                    paddingVertical: space.sm,
                    borderRadius: radius.pill,
                    backgroundColor:
                      source === q.source ? colour.success : colour.surface2,
                    borderWidth: 1.5,
                    borderColor:
                      source === q.source ? colour.success : colour.border,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: space.xs,
                  }}
                >
                  <Text style={{ fontSize: 14 }}>{q.icon}</Text>
                  <Text
                    style={{
                      ...typography.bodyS,
                      fontWeight: "600",
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
            Income details
          </Text>

          <FieldLabel label="Amount (ZAR)" />
          <UnderlineInput
            value={amount}
            onChangeText={setAmount}
            placeholder="0.00"
            keyboardType="decimal-pad"
          />

          {/* Income source */}
          <FieldLabel label="Income source" />
          <TouchableOpacity
            onPress={() => setShowFullList((v) => !v)}
            style={{
              borderBottomWidth: 1.5,
              borderBottomColor: source ? colour.success : colour.border,
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
                backgroundColor: colour.successBg,
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
                  color: colour.success,
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
                  ...typography.labelS,
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
                  <Text style={{ fontSize: 18, marginRight: space.md }}>
                    {cat.icon}
                  </Text>
                  <Text
                    style={{ flex: 1, ...typography.bodyM, color: colour.text }}
                  >
                    {cat.label}
                  </Text>
                  {source === cat.label && (
                    <Text style={{ color: colour.success, fontWeight: "800" }}>
                      ✓
                    </Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}

          <FieldLabel label="Date (YYYY-MM-DD)" />
          <UnderlineInput
            value={date}
            onChangeText={setDate}
            placeholder="YYYY-MM-DD"
          />

          <FieldLabel label="Description (optional)" />
          <UnderlineInput
            value={description}
            onChangeText={setDescription}
            placeholder="e.g. Invoice #001, monthly retainer…"
            multiline
          />
        </View>

        {/* Save */}
        <TouchableOpacity
          onPress={handleSave}
          disabled={!canSave || saving}
          style={{
            marginHorizontal: space.lg,
            backgroundColor: canSave ? colour.success : colour.surface2,
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
              {canSave ? "Save income" : "Fill in required fields"}
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
    </SafeAreaView>
  );
}
