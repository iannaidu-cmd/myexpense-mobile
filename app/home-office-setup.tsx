import { showNotice } from "@/components/NoticeHost";
import { ConfirmModal } from "@/components/ConfirmModal";
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
import { formatRatio, HOME_OFFICE_CATEGORY, pctFromRatio } from "@/lib/homeOffice";
import { expenseService } from "@/services/expenseService";
import { homeOfficeService } from "@/services/homeOfficeService";
import { useAuthStore } from "@/stores/authStore";
import { ACTIVE_TAX_YEAR } from "@/types/database";
import { colour, radius, space, typography } from "@/tokens";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
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
import { safeBack } from "@/lib/navigation";

const fmt = (n: number) =>
  `R ${n.toLocaleString("en-ZA", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

const ARRANGEMENTS: { key: ArrangementType; label: string; desc: string }[] = [
  { key: "owned", label: "Owned (bond/mortgage)", desc: "Claim proportional bond interest paid" },
  { key: "renting", label: "Renting", desc: "Claim proportional monthly rent paid" },
  { key: "none", label: "Neither", desc: "Utilities, rates & repairs still deductible at this ratio" },
];

const APPLIES_TO = [
  { icon: "house.fill", label: "Home office rent / bond interest", note: "Floor ratio" },
  { icon: "bolt.fill", label: "Electricity & utilities", note: "Floor ratio" },
  { icon: "wrench.fill", label: "Repairs & maintenance", note: "Floor ratio" },
  { icon: "building.2.fill", label: "Levies & rates", note: "Floor ratio" },
];

export default function HomeOfficeSetupScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { setting, load, save, clear } = useHomeOfficeStore();

  const [officeM2, setOfficeM2] = useState("");
  const [totalM2, setTotalM2] = useState("");
  const [arrangementType, setArrangementType] = useState<ArrangementType>("none");
  const [annualCost, setAnnualCost] = useState("");
  const [saving, setSaving] = useState(false);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  // Deductible Home Office expenses already logged this tax year. When there
  // are any, they are the claim and the setup cost is not added (no double count).
  const [loggedCount, setLoggedCount] = useState<number | null>(null);
  // After saving with a new floor %: existing expenses it would change.
  const [reapply, setReapply] = useState<{ ratio: number; updatable: number; unknown: number } | null>(null);
  const [reapplying, setReapplying] = useState(false);

  useEffect(() => {
    if (!user) return;
    load(user.id);
    expenseService
      .getExpenses(user.id, ACTIVE_TAX_YEAR)
      .then((rows) => setLoggedCount(rows.filter((e) => e.is_deductible && e.category === HOME_OFFICE_CATEGORY).length))
      .catch(() => setLoggedCount(null));
  }, [user]);

  // Separate from the load effect above: `load()` updates the store
  // asynchronously, so prefilling inside its .then() would read `setting`
  // from a stale render closure (still null) instead of the loaded value.
  // Reacting to `setting` itself always sees the current value.
  useEffect(() => {
    if (setting) {
      setOfficeM2(String(setting.officeM2));
      setTotalM2(String(setting.totalM2));
      setArrangementType(setting.arrangementType);
      // Rent is entered per month but stored per year. Prefilling the yearly
      // figure into the monthly field made a re-save claim 12 times the rent.
      const shown = setting.arrangementType === "renting" ? setting.annualCost / 12 : setting.annualCost;
      setAnnualCost(shown > 0 ? String(Math.round(shown * 100) / 100) : "");
    }
  }, [setting]);

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
          annualCost: arrangementType === "none" ? 0 : arrangementType === "renting" ? annualRent : cost,
          costTaxYear: ACTIVE_TAX_YEAR,
        }
      : null;

  const ratio = floorRatio(previewSetting);
  const ratioPct = (ratio * 100).toFixed(1);
  const deductible = annualDeductible(previewSetting);
  // Saved before the tax year was recorded: the cost claims nothing until re-saved.
  const needsResave = !!setting && setting.annualCost > 0 && !setting.costTaxYear;

  const canSave = office > 0 && total > 0 && office <= total;

  const handleSave = async () => {
    if (!canSave || !user || !previewSetting) {
      if (!canSave) showNotice({ title: "Check your measurements", message: "Your office can't be bigger than your whole home." });
      return;
    }
    const previousRatio = setting ? floorRatio(setting) : null;
    setSaving(true);
    try {
      await save(user.id, previewSetting);
    } catch {
      showNotice({ title: "Couldn't save your setup", message: "Please check your internet connection and try again." });
      setSaving(false);
      return;
    }
    try {
      // A new or changed floor % doesn't change expenses already saved, so
      // offer to update them.
      if (previousRatio === null || pctFromRatio(previousRatio) !== pctFromRatio(ratio)) {
        const { updatable, unknownCount } = await homeOfficeService.getReapplyCandidates(user.id, ACTIVE_TAX_YEAR, ratio);
        if (updatable.length > 0 || unknownCount > 0) {
          setReapply({ ratio, updatable: updatable.length, unknown: unknownCount });
          return;
        }
      }
      safeBack(router);
    } catch {
      // The setup itself saved; only the check of existing expenses failed.
      safeBack(router);
    } finally {
      setSaving(false);
    }
  };

  const confirmReapply = async () => {
    if (!user || !reapply || reapplying) return;
    if (reapply.updatable === 0) {
      setReapply(null);
      safeBack(router);
      return;
    }
    setReapplying(true);
    try {
      const n = await homeOfficeService.reapplyRatio(user.id, ACTIVE_TAX_YEAR, reapply.ratio);
      setReapply(null);
      showNotice({
        title: "Expenses updated",
        message: `${n} ${n === 1 ? "expense now claims" : "expenses now claim"} ${formatRatio(reapply.ratio)}.`,
        tone: "success",
      });
      safeBack(router);
    } catch {
      setReapply(null);
      showNotice({ title: "Couldn't update your expenses", message: "Your setup is saved. Please check your internet connection and save it again to retry." });
    } finally {
      setReapplying(false);
    }
  };

  const reapplyMessage = (() => {
    if (!reapply) return "";
    const pct = formatRatio(reapply.ratio);
    const older =
      reapply.unknown > 0
        ? ` ${reapply.unknown} older ${reapply.unknown === 1 ? "expense was" : "expenses were"} saved before we kept the full amount, so we can't update ${reapply.unknown === 1 ? "it" : "them"}. Open ${reapply.unknown === 1 ? "it" : "each one"} and check the amount.`
        : "";
    if (reapply.updatable === 0) {
      return `Your home office now claims ${pct}.${older}`;
    }
    return `${reapply.updatable} home office, utilities and repairs ${reapply.updatable === 1 ? "expense" : "expenses"} this tax year will be updated to claim ${pct}. Check any home contents insurance or bond interest expenses yourself.${older}`;
  })();

  const handleClear = () => {
    if (!user) return;
    setShowRemoveConfirm(true);
  };

  const confirmClear = async () => {
    if (!user) return;
    setShowRemoveConfirm(false);
    await clear(user.id);
    safeBack(router);
  };

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: colour.background }}>
      <StatusBar barStyle="dark-content" backgroundColor={colour.background} />
      <MXHeader
        title="Home office setup"
        subtitle="Claim the share of your home you work in"
        showBack
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: space.lg, paddingBottom: space["5xl"] }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {needsResave && (
            <InfoBanner
              icon="exclamationmark.triangle.fill"
              title="Save your setup again"
              body={`Your ${setting?.arrangementType === "owned" ? "bond interest" : "rent"} isn't being claimed yet. Check the details below and tap Save to add it to your ${ACTIVE_TAX_YEAR} tax year.`}
              style={{ marginBottom: space.md }}
            />
          )}

          <InfoBanner
            icon="house.fill"
            title="Home office deduction"
            body="Your office must be used only for work, and used regularly. You can claim the same share of your home costs as your office takes up of your home: office m² ÷ whole home m²."
            style={{ marginBottom: space.xl }}
          />

          {/* ── Floor area inputs ─────────────────────────────────────── */}
          <Text style={{ ...typography.labelM, color: colour.textSub, marginBottom: space.sm }}>
            Floor area
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
            Do you own or rent?
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
                {arrangementType === "owned" ? "Bond interest for the year" : "Monthly rent"}
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
                <Text style={{ ...typography.bodyXS, color: colour.textSub }}>
                  Only the interest, not the amount you pay off the loan. Your yearly bond statement shows the split.
                </Text>
              )}
              {arrangementType === "renting" && cost > 0 && (
                <Text style={{ ...typography.bodyXS, color: colour.textSub }}>
                  Rent for the year: {fmt(annualRent)} ({fmt(cost)} × 12 months)
                </Text>
              )}
              <Text style={{ ...typography.bodyXS, color: colour.textSub, marginTop: space.xxs, marginBottom: space.xl }}>
                For the {ACTIVE_TAX_YEAR} tax year
              </Text>
            </>
          )}

          {/* ── Deduction preview ─────────────────────────────────────── */}
          {previewSetting && (
            <>
              <Text
                style={{ ...typography.labelM, color: colour.textSub, marginBottom: space.sm }}
              >
                Estimated deduction
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

              {/* Where the claimable amount goes. Logged Home Office expenses
                  win over the setup cost, so it is never counted twice. */}
              {arrangementType !== "none" && deductible > 0 && loggedCount !== null && (
                <InfoBanner
                  body={
                    loggedCount > 0
                      ? `You've logged ${loggedCount} home office ${loggedCount === 1 ? "expense" : "expenses"} this tax year, so we claim ${loggedCount === 1 ? "that" : "those"} instead of the amount above.`
                      : `We'll add ${fmt(deductible)} to your home office claim for the ${ACTIVE_TAX_YEAR} tax year.`
                  }
                  style={{ marginBottom: space.xl }}
                />
              )}
            </>
          )}

          {/* ── Applies to ────────────────────────────────────────────── */}
          <Text style={{ ...typography.labelM, color: colour.textSub, marginBottom: space.sm }}>
            This percentage applies to
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
            label={saving ? "Saving..." : "Save home office setup"}
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

      <ConfirmModal
        visible={showRemoveConfirm}
        title="Remove home office setup"
        message="New expenses will be claimed in full and your rent or bond interest will no longer be claimed. Existing expenses keep their current amounts."
        confirmLabel="Remove"
        cancelLabel="Cancel"
        destructive
        onConfirm={confirmClear}
        onCancel={() => setShowRemoveConfirm(false)}
      />

      <ConfirmModal
        visible={!!reapply}
        title={reapply && reapply.updatable === 0 ? "Check your older expenses" : "Update your existing expenses?"}
        message={reapplyMessage}
        confirmLabel={reapplying ? "Updating..." : reapply && reapply.updatable === 0 ? "Got it" : "Update expenses"}
        cancelLabel="Not now"
        hideCancel={!!reapply && reapply.updatable === 0}
        destructive={false}
        icon="house.fill"
        onConfirm={confirmReapply}
        onCancel={() => {
          setReapply(null);
          safeBack(router);
        }}
      />
    </SafeAreaView>
  );
}
