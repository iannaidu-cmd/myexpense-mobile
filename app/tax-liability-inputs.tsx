import { MXButton } from "@/components/MXButton";
import { MXHeader } from "@/components/MXHeader";
import { MXInput } from "@/components/MXInput";
import { MXTabBar } from "@/components/MXTabBar";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { displayDateToISO, formatDateInputDDMMYYYY, isoToDisplayDate } from "@/lib/dateInput";
import { firstError, validateDateOfBirth, validateNonNegativeAmount } from "@/lib/validation";
import { expenseService } from "@/services/expenseService";
import { incomeService } from "@/services/incomeService";
import { profileService } from "@/services/profileService";
import { taxLiabilityService } from "@/services/taxLiabilityService";
import { useAuthStore } from "@/stores/authStore";
import { useExpenseStore } from "@/stores/expenseStore";
import { irp5TotalPAYE, useIRP5Store } from "@/stores/irp5Store";
import { colour, radius, space, typography } from "@/tokens";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// ─── Tax Liability — Inputs ───────────────────────────────────────────────────
// Collects everything lib/taxLiability.ts needs beyond logged income/expenses:
// date of birth, other income, medical aid, retirement annuity contributions
// (pre-filled from the "Retirement Annuity" expense category if logged),
// and tax already paid. Date of birth / medical aid fields are the same
// Supabase profile columns as My Profile's "Tax profile" section — editing
// either place updates both.
// ───────────────────────────────────────────────────────────────────────────

interface LumpSumEntryState {
  id: number;
  amount: string;
  useActualTax: boolean;
  actualTax: string;
}

const emptyLumpSumEntry = (id: number): LumpSumEntryState => ({ id, amount: "", useActualTax: false, actualTax: "" });

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View
      style={{
        backgroundColor: colour.white,
        borderRadius: radius.md,
        padding: space.md,
        borderWidth: 1,
        borderColor: colour.borderLight,
        marginBottom: space.md,
        gap: space.sm,
      }}
    >
      <Text style={{ fontSize: 13, fontWeight: "700", color: colour.text }}>{title}</Text>
      {children}
    </View>
  );
}

// Collapsed-by-default accordion step, matching the mockup's staged wizard:
// a compact summary row (checkmark once filled, step number while empty) that
// expands to the full fields/hint on tap. Sections start expanded if empty,
// collapsed if already filled — same "done" signal the progress bar uses.
function AccordionSection({
  title,
  summary,
  done,
  stepNumber,
  expanded,
  onToggle,
  children,
}: {
  title: string;
  summary?: string;
  done: boolean;
  stepNumber: number;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <View
      style={{
        backgroundColor: colour.white,
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: colour.borderLight,
        marginBottom: space.md,
        overflow: "hidden",
      }}
    >
      <TouchableOpacity
        onPress={onToggle}
        activeOpacity={0.7}
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          padding: space.md,
          gap: space.sm,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm, flex: 1 }}>
          <View
            style={{
              width: 26,
              height: 26,
              borderRadius: 13,
              backgroundColor: done ? colour.brandTeal + "38" : colour.surface2,
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            {done ? (
              <IconSymbol name="checkmark" size={12} color={colour.text} />
            ) : (
              <Text style={{ fontSize: 11, fontWeight: "800", color: colour.textSub }}>{stepNumber}</Text>
            )}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 13.5, fontWeight: "700", color: colour.text }}>{title}</Text>
            {!expanded && summary ? (
              <Text style={{ fontSize: 12, fontWeight: "600", color: colour.textSub, marginTop: 2 }}>
                {summary}
              </Text>
            ) : null}
          </View>
        </View>
        {expanded ? (
          <View
            style={{
              backgroundColor: colour.primary50,
              borderRadius: radius.pill,
              paddingHorizontal: space.sm,
              paddingVertical: 4,
            }}
          >
            <Text style={{ fontSize: 11, fontWeight: "700", color: colour.accentDeep }}>Open</Text>
          </View>
        ) : (
          <IconSymbol name="chevron.right" size={14} color={colour.textHint} />
        )}
      </TouchableOpacity>
      {expanded && (
        <View style={{ paddingHorizontal: space.md, paddingBottom: space.md, gap: space.sm }}>
          {children}
        </View>
      )}
    </View>
  );
}

export default function TaxLiabilityInputsScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { activeTaxYear } = useExpenseStore();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [dateOfBirth, setDateOfBirth] = useState("");
  const [otherIncome, setOtherIncome] = useState("");
  const [medicalAidMonthly, setMedicalAidMonthly] = useState("");
  const [medicalAidDependants, setMedicalAidDependants] = useState(0);
  const [vatRegistered, setVatRegistered] = useState(false);
  const [raContributions, setRaContributions] = useState("");
  const [raPrefilled, setRaPrefilled] = useState(false);
  const [taxAlreadyPaid, setTaxAlreadyPaid] = useState("");
  const [paidPrefilled, setPaidPrefilled] = useState(false);
  const [lumpSumEntries, setLumpSumEntries] = useState<LumpSumEntryState[]>([emptyLumpSumEntry(0)]);
  const nextLumpSumId = useRef(1);
  const [priorLumpSums, setPriorLumpSums] = useState("");

  // Accordion state for the staged wizard — starts expanded for whichever
  // sections are still empty, collapsed for ones already filled. Set once
  // after the initial load, not recomputed on every keystroke, so a section
  // doesn't collapse under the user's finger while they're still typing.
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const expansionInitialised = useRef(false);
  const toggleSection = (key: string) =>
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));

  const updateLumpSumEntry = useCallback((id: number, patch: Partial<LumpSumEntryState>) => {
    setLumpSumEntries((entries) => entries.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  }, []);
  const addLumpSumEntry = useCallback(() => {
    setLumpSumEntries((entries) => [...entries, emptyLumpSumEntry(nextLumpSumId.current++)]);
  }, []);
  const removeLumpSumEntry = useCallback((id: number) => {
    setLumpSumEntries((entries) => (entries.length <= 1 ? entries : entries.filter((e) => e.id !== id)));
  }, []);

  const { load: loadIRP5 } = useIRP5Store();

  const loadData = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    setLoading(true);
    try {
      await loadIRP5();
      const profile = await profileService.getProfile(user.id);
      const vatRegistered = profile?.vat_registered ?? false;
      const [existing, breakdown] = await Promise.all([
        taxLiabilityService.getEstimate(user.id, activeTaxYear),
        expenseService.getByCategory(user.id, activeTaxYear, vatRegistered),
      ]);

      setDateOfBirth(profile?.date_of_birth ? isoToDisplayDate(profile.date_of_birth) : "");
      setMedicalAidMonthly(profile?.medical_aid_monthly ? String(profile.medical_aid_monthly) : "");
      setMedicalAidDependants(profile?.medical_aid_dependants ?? 0);
      setVatRegistered(profile?.vat_registered ?? false);

      // IRP5 gross salary is already counted automatically (it's saved into
      // the income table when logged via Add IRP5 Income — see
      // app/add-irp5-income.tsx), but the PAYE withheld from it isn't pulled
      // in anywhere else, so it's the natural pre-fill source for "tax
      // already paid" — same idea as pre-filling RA from logged expenses.
      const payeFromIRP5 = irp5TotalPAYE(useIRP5Store.getState().entries, activeTaxYear);

      if (existing) {
        // Returning to edit a previously-calculated estimate — use its
        // saved values rather than re-deriving from expenses/IRP5.
        setOtherIncome(existing.other_taxable_income ? String(existing.other_taxable_income) : "");
        setRaContributions(
          existing.retirement_annuity_contributions ? String(existing.retirement_annuity_contributions) : "",
        );
        setTaxAlreadyPaid(existing.tax_already_paid ? String(existing.tax_already_paid) : "");

        const primaryEntry: LumpSumEntryState = {
          id: 0,
          amount: existing.retirement_severance_lump_sum ? String(existing.retirement_severance_lump_sum) : "",
          useActualTax: existing.actual_lump_sum_tax != null,
          actualTax: existing.actual_lump_sum_tax != null ? String(existing.actual_lump_sum_tax) : "",
        };
        const additionalEntries: LumpSumEntryState[] = (existing.additional_lump_sums ?? []).map((entry, i) => ({
          id: i + 1,
          amount: entry.grossAmount != null ? String(entry.grossAmount) : "",
          useActualTax: entry.actualTax != null,
          actualTax: entry.actualTax != null ? String(entry.actualTax) : "",
        }));
        nextLumpSumId.current = additionalEntries.length + 1;
        setLumpSumEntries([primaryEntry, ...additionalEntries]);

        setPriorLumpSums(
          existing.prior_retirement_severance_lump_sums ? String(existing.prior_retirement_severance_lump_sums) : "",
        );
        setRaPrefilled(false);
        setPaidPrefilled(false);
      } else {
        const raFromExpenses = breakdown["Retirement Annuity"] ?? 0;
        setRaContributions(raFromExpenses > 0 ? String(raFromExpenses) : "");
        setRaPrefilled(raFromExpenses > 0);
        setTaxAlreadyPaid(payeFromIRP5 > 0 ? String(payeFromIRP5) : "");
        setPaidPrefilled(payeFromIRP5 > 0);
        nextLumpSumId.current = 1;
        setLumpSumEntries([emptyLumpSumEntry(0)]);
      }
    } catch (e) {
      console.error("TaxLiabilityInputs load error:", e);
    } finally {
      setLoading(false);
    }
  }, [user, activeTaxYear, loadIRP5]);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  const handleCalculate = async () => {
    if (!user) return;

    const dobIso = dateOfBirth ? displayDateToISO(dateOfBirth) : "";
    const otherIncomeNorm = otherIncome.trim() || "0";
    const medMonthlyNorm = medicalAidMonthly.trim() || "0";
    const raNorm = raContributions.trim() || "0";
    const paidNorm = taxAlreadyPaid.trim() || "0";
    const priorLumpSumsNorm = priorLumpSums.trim() || "0";

    const normalisedLumpSumEntries = lumpSumEntries.map((entry) => ({
      ...entry,
      amountNorm: entry.amount.trim() || "0",
      actualTaxNorm: entry.actualTax.trim() || "0",
    }));

    const lumpSumErrors = normalisedLumpSumEntries.flatMap((entry, i) => {
      const label = i === 0 ? "Lump sum received this year" : `Lump sum ${i + 1} amount`;
      const errors = [validateNonNegativeAmount(entry.amountNorm, label)];
      if (entry.useActualTax) {
        errors.push(
          validateNonNegativeAmount(
            entry.actualTaxNorm,
            i === 0 ? "Actual tax from the directive" : `Lump sum ${i + 1} actual tax`,
          ),
        );
      }
      return errors;
    });

    const error = firstError(
      validateDateOfBirth(dobIso),
      validateNonNegativeAmount(otherIncomeNorm, "Other income"),
      validateNonNegativeAmount(medMonthlyNorm, "Medical aid monthly contribution"),
      validateNonNegativeAmount(raNorm, "Retirement annuity contributions"),
      validateNonNegativeAmount(paidNorm, "Tax already paid"),
      ...lumpSumErrors,
      validateNonNegativeAmount(priorLumpSumsNorm, "Earlier retirement or severance lump sums"),
    );
    if (error) {
      Alert.alert("Check your entries", error);
      return;
    }

    setSaving(true);
    try {
      const [expenseTotals, incomeTotals] = await Promise.all([
        expenseService.getTotals(user.id, activeTaxYear, vatRegistered),
        incomeService.getTotals(user.id, activeTaxYear),
        profileService.updateProfile(user.id, {
          date_of_birth: dobIso,
          medical_aid_monthly: parseFloat(medMonthlyNorm),
          medical_aid_dependants: medicalAidDependants,
        }),
      ]);
      const businessTaxableIncome = Math.max(0, incomeTotals.totalIncome - expenseTotals.totalDeductions);

      const [primaryLumpSum, ...additionalLumpSumEntries] = normalisedLumpSumEntries;

      await taxLiabilityService.recalculateEstimate(user.id, activeTaxYear, {
        tax_year: activeTaxYear,
        other_taxable_income: parseFloat(otherIncomeNorm),
        retirement_annuity_contributions: parseFloat(raNorm),
        tax_already_paid: parseFloat(paidNorm),
        donations_ytd: null,
        retirement_severance_lump_sum: parseFloat(primaryLumpSum.amountNorm),
        prior_retirement_severance_lump_sums: parseFloat(priorLumpSumsNorm),
        actual_lump_sum_tax: primaryLumpSum.useActualTax ? parseFloat(primaryLumpSum.actualTaxNorm) : null,
        additional_lump_sums: additionalLumpSumEntries
          .filter((entry) => parseFloat(entry.amountNorm) > 0)
          .map((entry) => ({
            grossAmount: parseFloat(entry.amountNorm),
            actualTax: entry.useActualTax ? parseFloat(entry.actualTaxNorm) : null,
          })),
        businessTaxableIncome,
        dateOfBirth: dobIso,
        medicalAidDependants,
      });

      router.replace("/tax-liability-summary" as any);
    } catch (e: any) {
      Alert.alert("Error", e.message ?? "Could not calculate your tax liability.");
    } finally {
      setSaving(false);
    }
  };

  // Simple completion heuristic for the progress indicator — VAT registration
  // is read-only/informational here (see app/vat-summary.tsx) so it always
  // counts as done; every other section counts once its value is non-empty.
  const personalDone = !!dateOfBirth;
  const otherIncomeDone = otherIncome.trim() !== "";
  const medicalAidDone = medicalAidMonthly.trim() !== "";
  const retirementAnnuityDone = raContributions.trim() !== "";
  const lumpSumDone = lumpSumEntries.some((e) => e.amount.trim() !== "") || priorLumpSums.trim() !== "";
  const taxPaidDone = taxAlreadyPaid.trim() !== "";
  const sectionsDone = [personalDone, true, otherIncomeDone, medicalAidDone, retirementAnnuityDone, lumpSumDone, taxPaidDone]
    .filter(Boolean).length;
  const totalSections = 7;

  // Expand whatever's still empty, collapse whatever's already filled — once,
  // right after the initial load finishes (see the accordion state comment
  // above for why this doesn't run on every render).
  useEffect(() => {
    if (loading || expansionInitialised.current) return;
    expansionInitialised.current = true;
    setExpanded({
      personal: !personalDone,
      otherIncome: !otherIncomeDone,
      medicalAid: !medicalAidDone,
      retirementAnnuity: !retirementAnnuityDone,
      lumpSum: !lumpSumDone,
      taxPaid: !taxPaidDone,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: colour.background }}>
      <StatusBar barStyle="dark-content" backgroundColor={colour.background} />
      <MXHeader title="Tax refund or bill" subtitle={`For ${activeTaxYear}`} showBack />

      {!loading && (
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: space.md,
            paddingHorizontal: space.lg,
            paddingBottom: space.sm,
          }}
        >
          <View style={{ flex: 1, height: 6, borderRadius: 3, backgroundColor: colour.borderLight, overflow: "hidden" }}>
            <View
              style={{
                width: `${(sectionsDone / totalSections) * 100}%`,
                height: "100%",
                backgroundColor: colour.brandTeal,
                borderRadius: 3,
              }}
            />
          </View>
          <Text style={{ ...typography.labelS, color: colour.textSub }} numberOfLines={1}>
            {sectionsDone} of {totalSections} done
          </Text>
        </View>
      )}

      {loading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color={colour.primary} />
        </View>
      ) : (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ padding: space.lg, paddingBottom: space["5xl"] }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <AccordionSection
              title="Personal details"
              summary={dateOfBirth ? `Born ${dateOfBirth}` : undefined}
              done={personalDone}
              stepNumber={1}
              expanded={!!expanded.personal}
              onToggle={() => toggleSection("personal")}
            >
              <MXInput
                label="Date of birth"
                value={dateOfBirth}
                onChangeText={(t) => setDateOfBirth(formatDateInputDDMMYYYY(t))}
                placeholder="DD/MM/YYYY"
                keyboardType="number-pad"
                hint="Older people pay less tax. This is also saved in My Profile."
              />
            </AccordionSection>

            <SectionCard title="VAT registration">
              <TouchableOpacity
                onPress={() => router.push("/vat-summary" as any)}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  paddingVertical: space.xs,
                }}
              >
                <View style={{ flex: 1, marginRight: space.md }}>
                  <Text style={{ fontSize: 13, fontWeight: "600", color: colour.text }}>
                    {vatRegistered ? "VAT registered" : "Not VAT registered"}
                  </Text>
                  <Text style={{ fontSize: 11, color: colour.textSub, marginTop: 2, lineHeight: 15 }}>
                    As a registered vendor you claim VAT back separately via VAT201, so your business expenses are
                    deducted excluding VAT — this changes the refund or bill estimate below. Manage your
                    registration in the VAT area.
                  </Text>
                </View>
                <IconSymbol name="chevron.right" size={16} color={colour.textHint} />
              </TouchableOpacity>
            </SectionCard>

            <AccordionSection
              title="Other income"
              summary={`R ${otherIncome.trim() || "0"}`}
              done={otherIncomeDone}
              stepNumber={3}
              expanded={!!expanded.otherIncome}
              onToggle={() => toggleSection("otherIncome")}
            >
              <MXInput
                label="Other income"
                value={otherIncome}
                onChangeText={setOtherIncome}
                placeholder="0"
                keyboardType="decimal-pad"
                hint="Money you earned that is NOT already in this app — for example rental income, or money from another country. If you already added a salary using Add Income or Add IRP5 Income, do not add it again here."
              />
            </AccordionSection>

            <AccordionSection
              title="Medical aid"
              summary={medicalAidMonthly.trim() ? `R ${medicalAidMonthly}/month` : undefined}
              done={medicalAidDone}
              stepNumber={4}
              expanded={!!expanded.medicalAid}
              onToggle={() => toggleSection("medicalAid")}
            >
              <MXInput
                label="Monthly medical aid contribution"
                value={medicalAidMonthly}
                onChangeText={setMedicalAidMonthly}
                placeholder="0"
                keyboardType="decimal-pad"
                hint="How much you pay each month. This is also saved in My Profile."
              />
              <View>
                <Text style={{ ...typography.actionS, color: colour.text, marginBottom: space.xs }}>
                  People on your medical aid (not counting you)
                </Text>
                <View style={{ flexDirection: "row", alignItems: "center", gap: space.md }}>
                  <TouchableOpacity
                    onPress={() => setMedicalAidDependants((v) => Math.max(0, v - 1))}
                    style={{
                      width: 36, height: 36, borderRadius: 18,
                      backgroundColor: colour.surface2,
                      alignItems: "center", justifyContent: "center",
                    }}
                  >
                    <Text style={{ fontSize: 20, color: colour.text, lineHeight: 24 }}>−</Text>
                  </TouchableOpacity>
                  <Text style={{ fontSize: 20, fontWeight: "700", color: colour.text, minWidth: 28, textAlign: "center" }}>
                    {medicalAidDependants}
                  </Text>
                  <TouchableOpacity
                    onPress={() => setMedicalAidDependants((v) => Math.min(10, v + 1))}
                    style={{
                      width: 36, height: 36, borderRadius: 18,
                      backgroundColor: colour.surface2,
                      alignItems: "center", justifyContent: "center",
                    }}
                  >
                    <Text style={{ fontSize: 20, color: colour.text, lineHeight: 24 }}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </AccordionSection>

            <AccordionSection
              title="Retirement annuity"
              summary={raContributions.trim() ? `R ${raContributions} this year` : undefined}
              done={retirementAnnuityDone}
              stepNumber={5}
              expanded={!!expanded.retirementAnnuity}
              onToggle={() => toggleSection("retirementAnnuity")}
            >
              <MXInput
                label="Retirement annuity contributions"
                value={raContributions}
                onChangeText={setRaContributions}
                placeholder="0"
                keyboardType="decimal-pad"
                hint={
                  raPrefilled
                    ? "We filled this in using your Retirement Annuity expenses. You can change it if it's wrong."
                    : "How much money you paid into your retirement annuity this year."
                }
              />
            </AccordionSection>

            <AccordionSection
              title="Retirement or severance lump sum"
              summary={lumpSumEntries[0]?.amount.trim() ? `R ${lumpSumEntries[0].amount}` : undefined}
              done={lumpSumDone}
              stepNumber={6}
              expanded={!!expanded.lumpSum}
              onToggle={() => toggleSection("lumpSum")}
            >
              <Text style={{ fontSize: 12, color: colour.textSub, lineHeight: 17 }}>
                A once-off payout from retirement, retrenchment (severance), or death — look for IRP5 source code
                3901 (retirement), 3907 or 3922 (severance), or 3915 (death benefit). SARS taxes this on its own
                separate table, with the first R550,000 (lifetime) tax-free, so keep it out of Other income above.
              </Text>

              {lumpSumEntries.map((entry, index) => (
                <View
                  key={entry.id}
                  style={{
                    gap: space.sm,
                    paddingTop: index === 0 ? 0 : space.md,
                    marginTop: index === 0 ? 0 : space.xs,
                    borderTopWidth: index === 0 ? 0 : 1,
                    borderTopColor: colour.borderLight,
                  }}
                >
                  {lumpSumEntries.length > 1 && (
                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                      <Text style={{ fontSize: 12, fontWeight: "700", color: colour.textSub }}>
                        Lump sum {index + 1}
                      </Text>
                      <TouchableOpacity onPress={() => removeLumpSumEntry(entry.id)}>
                        <Text style={{ fontSize: 12, fontWeight: "600", color: colour.danger }}>Remove</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                  <MXInput
                    label={index === 0 ? "Lump sum received this year" : "Amount"}
                    value={entry.amount}
                    onChangeText={(t) => updateLumpSumEntry(entry.id, { amount: t })}
                    placeholder="0"
                    keyboardType="decimal-pad"
                    hint="The GROSS amount before tax was taken off — the figure next to the source code on your IRP5, not the amount that actually landed in your bank account."
                  />
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                      paddingVertical: space.xs,
                    }}
                  >
                    <View style={{ flex: 1, marginRight: space.md }}>
                      <Text style={{ fontSize: 13, fontWeight: "600", color: colour.text }}>
                        I know the actual tax from a SARS directive
                      </Text>
                      <Text style={{ fontSize: 11, color: colour.textSub, marginTop: 2, lineHeight: 15 }}>
                        Retirement/severance lump sums usually come with a SARS tax directive (form IRP3(a)) — a
                        letter from SARS to your employer or fund saying exactly how much tax to deduct. If you have
                        one, switch this on and enter that exact amount instead of using our R550,000-table estimate
                        — the directive is more accurate because SARS can see things this app cannot, like every
                        lump sum you have ever received.
                      </Text>
                    </View>
                    <Switch
                      value={entry.useActualTax}
                      onValueChange={(v) => updateLumpSumEntry(entry.id, { useActualTax: v })}
                      trackColor={{ false: colour.border, true: colour.accent }}
                      thumbColor={colour.white}
                    />
                  </View>
                  {entry.useActualTax && (
                    <MXInput
                      label="Actual tax from the directive"
                      value={entry.actualTax}
                      onChangeText={(t) => updateLumpSumEntry(entry.id, { actualTax: t })}
                      placeholder="0"
                      keyboardType="decimal-pad"
                      hint="The exact 'tax on lump sum' figure shown on your SARS tax directive (IRP3(a)) or IRP5 — not the amount you received after tax was already deducted."
                    />
                  )}
                </View>
              ))}

              <TouchableOpacity onPress={addLumpSumEntry} style={{ paddingVertical: space.xs }}>
                <Text style={{ fontSize: 13, fontWeight: "600", color: colour.primary }}>
                  + Add another lump sum
                </Text>
              </TouchableOpacity>

              <MXInput
                label="Earlier lump sums (if any)"
                value={priorLumpSums}
                onChangeText={setPriorLumpSums}
                placeholder="0"
                keyboardType="decimal-pad"
                hint="Total of any retirement, retrenchment, or death benefit lump sums you received in previous years. The R550,000 tax-free amount is a lifetime total, not per payout, so this affects how much of it is left for this year's lump sum(s). Leave as 0 if this is your first."
              />
            </AccordionSection>

            <AccordionSection
              title="Tax already paid"
              summary={taxAlreadyPaid.trim() ? `R ${taxAlreadyPaid} paid` : undefined}
              done={taxPaidDone}
              stepNumber={7}
              expanded={!!expanded.taxPaid}
              onToggle={() => toggleSection("taxPaid")}
            >
              <MXInput
                label="Tax already paid"
                value={taxAlreadyPaid}
                onChangeText={setTaxAlreadyPaid}
                placeholder="0"
                keyboardType="decimal-pad"
                hint={
                  paidPrefilled
                    ? "We used the tax already taken from your salary. If you also paid SARS directly, add that too. You can change this number."
                    : "Tax already taken from your pay, or tax you paid to SARS yourself. This is not VAT — VAT is shown in VAT Summary."
                }
              />
            </AccordionSection>

            <MXButton
              label="Calculate my estimate"
              onPress={handleCalculate}
              loading={saving}
              fullWidth
              size="L"
            />
          </ScrollView>
        </KeyboardAvoidingView>
      )}
      <MXTabBar />
    </SafeAreaView>
  );
}
