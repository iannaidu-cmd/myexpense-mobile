import { InfoBanner } from "@/components/InfoBanner";
import { MXButton } from "@/components/MXButton";
import { MXHeader } from "@/components/MXHeader";
import { MXTabBar } from "@/components/MXTabBar";
import { IconSymbol } from "@/components/ui/icon-symbol";
import {
  annualDeductible,
  ArrangementType,
  floorRatio,
  HomeOfficeSetting,
  useHomeOfficeStore,
} from "@/stores/homeOfficeStore";
import { colour, radius, space, typography } from "@/tokens";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
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

const fmt = (n: number) =>
  `R ${n.toLocaleString("en-ZA", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

const ARRANGEMENTS: { key: ArrangementType; label: string; desc: string }[] = [
  { key: "owned", label: "Owned (bond/mortgage)", desc: "Claim proportional bond interest paid" },
  { key: "renting", label: "Renting", desc: "Claim proportional monthly rent paid" },
  { key: "none", label: "Neither", desc: "Utilities, rates & repairs still deductible at this ratio" },
];

const APPLIES_TO = [
  { icon: "house.fill", label: "Home Office rent / bond interest", note: "100% at floor ratio" },
  { icon: "bolt.fill", label: "Electricity & utilities", note: "Floor ratio" },
  { icon: "wrench.fill", label: "Repairs & maintenance", note: "Floor ratio" },
  { icon: "building.2.fill", label: "Levies & rates", note: "Floor ratio" },
];

export default function HomeOfficeSetupScreen() {
  const router = useRouter();
  const { setting, load, save, clear } = useHomeOfficeStore();

  const [officeM2, setOfficeM2] = useState("");
  const [totalM2, setTotalM2] = useState("");
  const [arrangementType, setArrangementType] = useState<ArrangementType>("none");
  const [annualCost, setAnnualCost] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    load().then(() => {
      if (setting) {
        setOfficeM2(String(setting.officeM2));
        setTotalM2(String(setting.totalM2));
        setArrangementType(setting.arrangementType);
        setAnnualCost(setting.annualCost > 0 ? String(setting.annualCost) : "");
      }
    });
  }, []);

  const office = parseFloat(officeM2) || 0;
  const total = parseFloat(totalM2) || 0;
  const cost = parseFloat(annualCost) || 0;
  const monthlyRent = arrangementType === "renting" && cost > 0 ? cost : 0;
  const annualRent = monthlyRent * 12;

  const previewSetting: HomeOfficeSetting | null =
    office > 0 && total > 0
      ? {
          officeM2: office,
          totalM2: total,
          arrangementType,
          annualCost: arrangementType === "renting" ? annualRent : cost,
        }
      : null;

  const ratio = floorRatio(previewSetting);
  const ratioPct = (ratio * 100).toFixed(1);
  const deductible = annualDeductible(previewSetting);

  const canSave = office > 0 && total > 0 && office <= total;

  const handleSave = async () => {
    if (!canSave) {
      Alert.alert("Check your measurements", "Office area cannot exceed total property area.");
      return;
    }
    setSaving(true);
    try {
      await save({
        officeM2: office,
        totalM2: total,
        arrangementType,
        annualCost: arrangementType === "renting" ? annualRent : cost,
      });
      router.back();
    } finally {
      setSaving(false);
    }
  };

  const handleClear = () => {
    Alert.alert(
      "Remove home office setup",
      "This will clear your floor area ratio and disable the proportional calculation.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            await clear();
            router.back();
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: colour.background }}>
      <StatusBar barStyle="dark-content" backgroundColor={colour.background} />
      <MXHeader
        title="Home office setup"
        subtitle="Proportional deduction · S11(a)"
        showBack
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: space.lg, paddingBottom: space["5xl"] }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <InfoBanner
            icon="house.fill"
            title="SARS S11(a) — Home office deduction"
            body="Your office must be used exclusively and regularly for trade. The deductible portion is calculated as: office m² ÷ total property m² × qualifying costs."
            style={{ marginBottom: space.xl }}
          />

          {/* ── Floor area inputs ─────────────────────────────────────── */}
          <Text style={{ ...typography.labelM, color: colour.textSub, marginBottom: space.sm }}>
            FLOOR AREA
          </Text>

          <View style={{ flexDirection: "row", gap: space.md, marginBottom: space.md }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 11, color: colour.textSub, marginBottom: 4 }}>
                Office area
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: colour.white,
                  borderRadius: radius.md,
                  borderWidth: 1.5,
                  borderColor: officeM2 ? colour.primary : colour.border,
                  paddingHorizontal: space.md,
                  height: 48,
                }}
              >
                <TextInput
                  value={officeM2}
                  onChangeText={setOfficeM2}
                  placeholder="0"
                  placeholderTextColor={colour.textHint}
                  keyboardType="decimal-pad"
                  style={{ flex: 1, fontSize: 16, color: colour.text }}
                />
                <Text style={{ fontSize: 13, color: colour.textSub }}>m²</Text>
              </View>
            </View>

            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 11, color: colour.textSub, marginBottom: 4 }}>
                Total property
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: colour.white,
                  borderRadius: radius.md,
                  borderWidth: 1.5,
                  borderColor: totalM2 ? colour.primary : colour.border,
                  paddingHorizontal: space.md,
                  height: 48,
                }}
              >
                <TextInput
                  value={totalM2}
                  onChangeText={setTotalM2}
                  placeholder="0"
                  placeholderTextColor={colour.textHint}
                  keyboardType="decimal-pad"
                  style={{ flex: 1, fontSize: 16, color: colour.text }}
                />
                <Text style={{ fontSize: 13, color: colour.textSub }}>m²</Text>
              </View>
            </View>
          </View>

          {/* Ratio pill */}
          {office > 0 && total > 0 && (
            <View
              style={{
                backgroundColor: office > total ? colour.dangerBg : colour.primary,
                borderRadius: radius.md,
                padding: space.md,
                alignItems: "center",
                marginBottom: space.xl,
              }}
            >
              <Text
                style={{
                  fontSize: 36,
                  fontWeight: "800",
                  color: office > total ? colour.danger : colour.onPrimary,
                  letterSpacing: -1,
                }}
              >
                {office > total ? "!" : `${ratioPct}%`}
              </Text>
              <Text
                style={{
                  fontSize: 12,
                  color: office > total ? colour.danger : "rgba(255,255,255,0.75)",
                  marginTop: 2,
                }}
              >
                {office > total
                  ? "Office cannot be larger than total property"
                  : `${office}m² office ÷ ${total}m² total property`}
              </Text>
            </View>
          )}

          {/* ── Arrangement type ──────────────────────────────────────── */}
          <Text
            style={{
              ...typography.labelM,
              color: colour.textSub,
              marginBottom: space.sm,
              marginTop: office > 0 && total > 0 ? 0 : space.md,
            }}
          >
            ARRANGEMENT TYPE
          </Text>

          <View
            style={{
              backgroundColor: colour.white,
              borderRadius: radius.md,
              borderWidth: 1,
              borderColor: colour.borderLight,
              overflow: "hidden",
              marginBottom: space.xl,
            }}
          >
            {ARRANGEMENTS.map((opt, i) => (
              <TouchableOpacity
                key={opt.key}
                onPress={() => setArrangementType(opt.key)}
                activeOpacity={0.7}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  padding: space.md,
                  backgroundColor:
                    arrangementType === opt.key ? colour.primary50 : "transparent",
                  borderBottomWidth: i < ARRANGEMENTS.length - 1 ? 1 : 0,
                  borderBottomColor: colour.borderLight,
                }}
              >
                <View
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: 10,
                    borderWidth: 2,
                    borderColor:
                      arrangementType === opt.key ? colour.primary : colour.border,
                    backgroundColor:
                      arrangementType === opt.key ? colour.primary : "transparent",
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: space.md,
                  }}
                >
                  {arrangementType === opt.key && (
                    <View
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: colour.onPrimary,
                      }}
                    />
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, fontWeight: "600", color: colour.text }}>
                    {opt.label}
                  </Text>
                  <Text style={{ fontSize: 11, color: colour.textSub, marginTop: 1 }}>
                    {opt.desc}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* ── Cost input ────────────────────────────────────────────── */}
          {arrangementType !== "none" && (
            <>
              <Text
                style={{ ...typography.labelM, color: colour.textSub, marginBottom: space.sm }}
              >
                {arrangementType === "owned" ? "ANNUAL BOND INTEREST" : "MONTHLY RENT"}
              </Text>

              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: colour.white,
                  borderRadius: radius.md,
                  borderWidth: 1.5,
                  borderColor: annualCost ? colour.primary : colour.border,
                  paddingHorizontal: space.md,
                  height: 52,
                  marginBottom: space.xs,
                }}
              >
                <Text style={{ fontSize: 16, color: colour.textSub, marginRight: 4 }}>R</Text>
                <TextInput
                  value={annualCost}
                  onChangeText={setAnnualCost}
                  placeholder="0"
                  placeholderTextColor={colour.textHint}
                  keyboardType="decimal-pad"
                  style={{ flex: 1, fontSize: 18, fontWeight: "600", color: colour.text }}
                />
              </View>

              {arrangementType === "owned" && (
                <Text style={{ fontSize: 11, color: colour.textSub, marginBottom: space.xl }}>
                  Bond interest only — not capital repayments. Get the split from your annual bond statement.
                </Text>
              )}
              {arrangementType === "renting" && cost > 0 && (
                <Text style={{ fontSize: 11, color: colour.textSub, marginBottom: space.xl }}>
                  Annual rent = R {fmt(annualRent)} (R {fmt(cost)} × 12 months)
                </Text>
              )}
              {arrangementType === "renting" && cost === 0 && (
                <View style={{ marginBottom: space.xl }} />
              )}
            </>
          )}

          {/* ── Deduction preview ─────────────────────────────────────── */}
          {previewSetting && (
            <>
              <Text
                style={{ ...typography.labelM, color: colour.textSub, marginBottom: space.sm }}
              >
                ESTIMATED DEDUCTION
              </Text>

              <View
                style={{
                  backgroundColor: colour.noir,
                  borderRadius: radius.md,
                  padding: space.lg,
                  marginBottom: space.xl,
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    marginBottom: space.sm,
                  }}
                >
                  <Text style={{ fontSize: 12, color: colour.onNoir2 }}>Floor ratio</Text>
                  <Text style={{ fontSize: 12, fontWeight: "700", color: colour.onNoir }}>
                    {ratioPct}%
                  </Text>
                </View>

                {arrangementType !== "none" && (
                  <>
                    <View
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        marginBottom: space.sm,
                      }}
                    >
                      <Text style={{ fontSize: 12, color: colour.onNoir2 }}>
                        Annual {arrangementType === "renting" ? "rent" : "bond interest"}
                      </Text>
                      <Text style={{ fontSize: 12, fontWeight: "700", color: colour.onNoir }}>
                        {fmt(arrangementType === "renting" ? annualRent : cost)}
                      </Text>
                    </View>

                    <View
                      style={{
                        height: 1,
                        backgroundColor: "rgba(255,255,255,0.1)",
                        marginBottom: space.sm,
                      }}
                    />

                    <View
                      style={{ flexDirection: "row", justifyContent: "space-between" }}
                    >
                      <Text
                        style={{ fontSize: 14, fontWeight: "700", color: colour.primary }}
                      >
                        Claimable ({ratioPct}%)
                      </Text>
                      <Text
                        style={{ fontSize: 14, fontWeight: "800", color: colour.primary }}
                      >
                        {fmt(deductible)}
                      </Text>
                    </View>
                  </>
                )}

                <View
                  style={{
                    backgroundColor: "rgba(255,255,255,0.07)",
                    borderRadius: radius.sm,
                    padding: space.sm,
                    marginTop: space.md,
                  }}
                >
                  <Text style={{ fontSize: 11, color: colour.onNoir2, lineHeight: 16 }}>
                    Utilities, electricity, levies, rates & repairs also deductible at the {ratioPct}% ratio when added as expenses.
                  </Text>
                </View>
              </View>
            </>
          )}

          {/* ── Applies to ────────────────────────────────────────────── */}
          <Text style={{ ...typography.labelM, color: colour.textSub, marginBottom: space.sm }}>
            THIS RATIO APPLIES TO
          </Text>

          <View
            style={{
              backgroundColor: colour.white,
              borderRadius: radius.md,
              borderWidth: 1,
              borderColor: colour.borderLight,
              overflow: "hidden",
              marginBottom: space.xl,
            }}
          >
            {APPLIES_TO.map((item, i) => (
              <View
                key={item.label}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  padding: space.md,
                  borderBottomWidth: i < APPLIES_TO.length - 1 ? 1 : 0,
                  borderBottomColor: colour.borderLight,
                }}
              >
                <View
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: radius.sm,
                    backgroundColor: colour.primary50,
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: space.md,
                  }}
                >
                  <IconSymbol name={item.icon as any} size={15} color={colour.accentDeep} />
                </View>
                <Text style={{ flex: 1, fontSize: 13, color: colour.text }}>{item.label}</Text>
                <Text style={{ fontSize: 11, color: colour.textSub }}>{item.note}</Text>
              </View>
            ))}
          </View>

          <InfoBanner
            icon="exclamationmark.triangle.fill"
            title="SARS requirement"
            body="The workspace must be used exclusively and regularly for trade. A shared lounge or bedroom used occasionally does not qualify."
            style={{ marginBottom: space.xl }}
          />

          {/* Save */}
          <MXButton
            label={saving ? "Saving…" : "Save home office setup"}
            variant="primary"
            size="L"
            onPress={handleSave}
            fullWidth
          />

          {setting && (
            <TouchableOpacity
              onPress={handleClear}
              style={{ alignItems: "center", marginTop: space.lg }}
            >
              <Text style={{ fontSize: 13, color: colour.danger }}>Remove home office setup</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      <MXTabBar />
    </SafeAreaView>
  );
}
