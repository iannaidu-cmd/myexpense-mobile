import { InfoBanner } from "@/components/InfoBanner";
import { MXButton } from "@/components/MXButton";
import { MXHeader } from "@/components/MXHeader";
import { MXInput } from "@/components/MXInput";
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
import React, { useCallback, useRef, useState } from "react";
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
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

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

export default function TaxLiabilityInputsScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { activeTaxYear } = useExpenseStore();
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [dateOfBirth, setDateOfBirth] = useState("");
  const [otherIncome, setOtherIncome] = useState("");
  const [medicalAidMonthly, setMedicalAidMonthly] = useState("");
  const [medicalAidDependants, setMedicalAidDependants] = useState(0);
  const [raContributions, setRaContributions] = useState("");
  const [raPrefilled, setRaPrefilled] = useState(false);
  const [taxAlreadyPaid, setTaxAlreadyPaid] = useState("");
  const [paidPrefilled, setPaidPrefilled] = useState(false);
  const [lumpSumEntries, setLumpSumEntries] = useState<LumpSumEntryState[]>([emptyLumpSumEntry(0)]);
  const nextLumpSumId = useRef(1);
  const [priorLumpSums, setPriorLumpSums] = useState("");

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
      const [profile, existing, breakdown] = await Promise.all([
        profileService.getProfile(user.id),
        taxLiabilityService.getEstimate(user.id, activeTaxYear),
        expenseService.getByCategory(user.id, activeTaxYear),
      ]);

      setDateOfBirth(profile?.date_of_birth ? isoToDisplayDate(profile.date_of_birth) : "");
      setMedicalAidMonthly(profile?.medical_aid_monthly ? String(profile.medical_aid_monthly) : "");
      setMedicalAidDependants(profile?.medical_aid_dependants ?? 0);

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
        expenseService.getTotals(user.id, activeTaxYear),
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

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: colour.background }}>
      <StatusBar barStyle="dark-content" backgroundColor={colour.background} />
      <MXHeader title="Tax refund or bill" subtitle={`For ${activeTaxYear}`} showBack />

      {loading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color={colour.primary} />
        </View>
      ) : (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ padding: space.lg, paddingBottom: insets.bottom + space["5xl"] }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <InfoBanner
              icon="exclamationmark.triangle.fill"
              title="This is only a guess"
              body={`This shows what you may owe SARS, or what SARS may pay back to you, for ${activeTaxYear}. It does not cover rare cases, like selling a house. The number will change as you add more information.`}
              style={{ marginBottom: space.lg }}
            />

            <SectionCard title="Personal details">
              <MXInput
                label="Date of birth"
                value={dateOfBirth}
                onChangeText={(t) => setDateOfBirth(formatDateInputDDMMYYYY(t))}
                placeholder="DD/MM/YYYY"
                keyboardType="number-pad"
                hint="Older people pay less tax. This is also saved in My Profile."
              />
            </SectionCard>

            <SectionCard title="Other income">
              <MXInput
                label="Other income"
                value={otherIncome}
                onChangeText={setOtherIncome}
                placeholder="0"
                keyboardType="decimal-pad"
                hint="Money you earned that is NOT already in this app — for example rental income, or money from another country. If you already added a salary using Add Income or Add IRP5 Income, do not add it again here."
              />
            </SectionCard>

            <SectionCard title="Medical aid">
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
            </SectionCard>

            <SectionCard title="Retirement annuity">
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
            </SectionCard>

            <SectionCard title="Retirement or severance lump sum">
              <Text style={{ fontSize: 12, color: colour.textSub, lineHeight: 17 }}>
                A once-off payout from retirement, retrenchment (severance), or a death benefit — for example the
                &quot;Severance Pay&quot; line on a payslip or a tax directive. SARS taxes this on its own separate
                table, with the first R550,000 (lifetime) tax-free, so keep it out of Other income above.
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
                        If SARS (or your employer/fund) has already issued a formal tax directive for this lump sum,
                        entering the actual tax amount here will be more accurate than our estimate.
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
                      hint="The tax amount SARS's directive actually charged on this lump sum — not the amount you received after tax."
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
            </SectionCard>

            <SectionCard title="Tax already paid">
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
            </SectionCard>

            <MXButton
              label="Calculate"
              onPress={handleCalculate}
              loading={saving}
              fullWidth
              size="L"
            />
          </ScrollView>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}
