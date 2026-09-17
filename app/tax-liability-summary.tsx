import { MXButton } from "@/components/MXButton";
import { MXHeader } from "@/components/MXHeader";
import { MXTabBar } from "@/components/MXTabBar";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { calculateTaxLiability, TaxLiabilityResult } from "@/lib/taxLiability";
import { expenseService } from "@/services/expenseService";
import { incomeService } from "@/services/incomeService";
import { profileService } from "@/services/profileService";
import { taxLiabilityService } from "@/services/taxLiabilityService";
import { useAuthStore } from "@/stores/authStore";
import { useExpenseStore } from "@/stores/expenseStore";
import { ConfirmModal } from "@/components/ConfirmModal";
import { colour, radius, space } from "@/tokens";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import { ActivityIndicator, ScrollView, StatusBar, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// ─── Tax Liability — Summary ──────────────────────────────────────────────────
// Shows the calculation breakdown for the active tax year's estimate, ending
// in a single "Estimated amount owing / refund" figure. Recalculates on
// every load (mirrors app/tax-summary.tsx's recalculateSummary-on-load
// pattern) so the estimate always reflects the latest logged income/expenses.
// ───────────────────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  `R ${Math.abs(n).toLocaleString("en-ZA", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

function Row({ label, value, bold = false }: { label: string; value: string; bold?: boolean }) {
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
      <Text
        style={{
          fontSize: bold ? 13 : 12,
          fontWeight: bold ? "700" : "400",
          color: bold ? colour.text : colour.textSub,
          flex: 1,
          marginRight: space.sm,
        }}
      >
        {label}
      </Text>
      <Text style={{ fontSize: bold ? 13 : 12, fontWeight: "700", color: bold ? colour.text : colour.primary }}>
        {value}
      </Text>
    </View>
  );
}

export default function TaxLiabilitySummaryScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { activeTaxYear } = useExpenseStore();

  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<TaxLiabilityResult | null>(null);
  const [businessTaxableIncome, setBusinessTaxableIncome] = useState(0);
  const [otherIncome, setOtherIncome] = useState(0);
  const [showWhyModal, setShowWhyModal] = useState(false);

  const loadData = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    setLoading(true);
    try {
      const existing = await taxLiabilityService.getEstimate(user.id, activeTaxYear);
      if (!existing) {
        router.replace("/tax-liability-inputs" as any);
        return;
      }

      const profile = await profileService.getProfile(user.id);
      const [expenseTotals, incomeTotals] = await Promise.all([
        expenseService.getTotals(user.id, activeTaxYear, profile?.vat_registered ?? false),
        incomeService.getTotals(user.id, activeTaxYear),
      ]);
      const income = Math.max(0, incomeTotals.totalIncome - expenseTotals.totalDeductions);

      const calcInput = {
        taxYear: activeTaxYear,
        businessTaxableIncome: income,
        otherTaxableIncome: existing.other_taxable_income,
        dateOfBirth: profile?.date_of_birth ?? null,
        retirementAnnuityContributions: existing.retirement_annuity_contributions,
        medicalAidDependants: profile?.medical_aid_dependants ?? 0,
        donationsYtd: existing.donations_ytd ?? 0,
        taxAlreadyPaid: existing.tax_already_paid,
        retirementSeveranceLumpSum: existing.retirement_severance_lump_sum,
        priorRetirementSeveranceLumpSums: existing.prior_retirement_severance_lump_sums,
      };

      // Keep the persisted row fresh (same "recalculate on every view" habit
      // as services/taxService.ts's tax_summary), then use the full result
      // (age/rebate/RA breakdown) for display.
      await taxLiabilityService.recalculateEstimate(user.id, activeTaxYear, {
        tax_year: activeTaxYear,
        other_taxable_income: existing.other_taxable_income,
        retirement_annuity_contributions: existing.retirement_annuity_contributions,
        tax_already_paid: existing.tax_already_paid,
        donations_ytd: existing.donations_ytd,
        retirement_severance_lump_sum: existing.retirement_severance_lump_sum,
        prior_retirement_severance_lump_sums: existing.prior_retirement_severance_lump_sums,
        businessTaxableIncome: income,
        dateOfBirth: profile?.date_of_birth ?? null,
        medicalAidDependants: profile?.medical_aid_dependants ?? 0,
      });

      setResult(calculateTaxLiability(calcInput));
      setBusinessTaxableIncome(income);
      setOtherIncome(existing.other_taxable_income);
    } catch (e) {
      console.error("TaxLiabilitySummary load error:", e);
    } finally {
      setLoading(false);
    }
  }, [user, activeTaxYear, router]);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  const owing = result ? result.finalLiability > 0 : false;
  const refund = result ? result.finalLiability < 0 : false;

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: colour.background }}>
      <StatusBar barStyle="dark-content" backgroundColor={colour.background} />
      <MXHeader
        title="Tax refund or bill"
        subtitle={`For ${activeTaxYear}`}
        showBack
        right={
          <TouchableOpacity onPress={() => router.push("/tax-liability-inputs" as any)}>
            <Text style={{ fontSize: 13, fontWeight: "600", color: colour.primary }}>Edit</Text>
          </TouchableOpacity>
        }
      />

      {loading || !result ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color={colour.primary} />
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: space.lg, paddingBottom: space["5xl"] }}
        >
          {/* Hero card */}
          <View
            style={{
              backgroundColor: colour.heroDark,
              borderRadius: radius.hero,
              padding: space.xl,
              marginBottom: space.md,
            }}
          >
            <Text style={{ fontSize: 11, color: colour.onNoir2, letterSpacing: 0.8, marginBottom: space.sm }}>
              {owing ? "YOU OWE SARS" : refund ? "SARS OWES YOU" : "YOU DON'T OWE ANYTHING"}
            </Text>
            <Text
              style={{
                fontSize: 54,
                fontWeight: "800",
                letterSpacing: -2,
                lineHeight: 58,
                color: owing ? colour.danger : refund ? colour.brandTeal : colour.onNoir,
                marginBottom: 4,
              }}
            >
              {fmt(result.finalLiability)}
            </Text>
            <Text style={{ fontSize: 13, color: colour.onNoir2, lineHeight: 18 }}>
              {owing
                ? "This is based on what you've added so far for " + activeTaxYear
                : refund
                  ? "You should get this money back from SARS for " + activeTaxYear
                  : "You don't owe anything, and there's no refund, based on what you've added so far"}
            </Text>

            <View
              style={{
                marginTop: space.md,
                paddingTop: space.md,
                borderTopWidth: 1,
                borderTopColor: "rgba(255,255,255,0.14)",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Text style={{ fontSize: 11, color: colour.onNoir2, flex: 1, marginRight: space.sm }}>
                Estimate only. It moves as you add more.
              </Text>
              <TouchableOpacity
                onPress={() => setShowWhyModal(true)}
                style={{
                  backgroundColor: "rgba(255,255,255,0.12)",
                  borderRadius: radius.pill,
                  paddingHorizontal: space.sm,
                  paddingVertical: 4,
                }}
              >
                <Text style={{ fontSize: 11, fontWeight: "700", color: colour.onNoir }}>Why</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Breakdown */}
          <View
            style={{
              backgroundColor: colour.white,
              borderRadius: radius.card,
              padding: space.md,
              borderWidth: 1,
              borderColor: colour.borderLight,
              marginBottom: space.md,
            }}
          >
            <Text
              style={{
                fontSize: 10.5,
                fontWeight: "700",
                letterSpacing: 1.8,
                textTransform: "uppercase",
                color: colour.textSub,
                marginBottom: 14,
              }}
            >
              How this was calculated
            </Text>

            <Row label="Income added in MyExpense" value={fmt(businessTaxableIncome)} />
            <Text style={{ fontSize: 11, color: colour.textHint, marginBottom: 8, lineHeight: 16 }}>
              Your freelance income and expenses, plus any salary you added using Add Income or Add IRP5 Income.
            </Text>
            <Row label="Other income" value={fmt(otherIncome)} />
            <Row label="Less: Retirement annuity" value={`− ${fmt(result.retirementAnnuityDeductible)}`} />
            <View style={{ height: 1, backgroundColor: colour.borderLight, marginVertical: 8 }} />
            <Row label="Income SARS will tax" value={fmt(result.taxableIncome)} bold />

            <View style={{ height: space.sm }} />
            <Row label="Tax on that income" value={fmt(result.grossTax)} />
            <Row
              label={
                result.tertiaryRebate > 0
                  ? "Less: Age discount (65 and 75+)"
                  : result.secondaryRebate > 0
                    ? "Less: Age discount (65+)"
                    : "Less: Standard discount"
              }
              value={`− ${fmt(result.rebatesApplied)}`}
            />
            <Row label="Less: Medical aid discount" value={`− ${fmt(result.medicalCreditApplied)}`} />
            <View style={{ height: 1, backgroundColor: colour.borderLight, marginVertical: 8 }} />
            <Row label="Tax on your normal income" value={fmt(result.taxAfterCredits)} bold />

            {result.lumpSumEntries.length > 0 && (
              <>
                <View style={{ height: space.sm }} />
                {result.lumpSumEntries.length > 1 && (
                  <Row label="Retirement / severance lump sums" value={fmt(result.retirementSeveranceLumpSum)} />
                )}
                {result.lumpSumEntries.map((entry, i) => (
                  <React.Fragment key={i}>
                    <Row
                      label={result.lumpSumEntries.length > 1 ? `Lump sum ${i + 1}` : "Retirement / severance lump sum"}
                      value={fmt(entry.grossAmount)}
                    />
                    <Text style={{ fontSize: 11, color: colour.textHint, marginBottom: 8, lineHeight: 16 }}>
                      {entry.isActual
                        ? "Taxed separately from your normal income, from your SARS tax directive."
                        : "Taxed separately from your normal income, with the first R550,000 (lifetime) tax-free."}
                    </Text>
                    <Row
                      label={result.lumpSumEntries.length > 1 ? `Tax on lump sum ${i + 1}` : "Tax on the lump sum"}
                      value={fmt(entry.tax)}
                    />
                  </React.Fragment>
                ))}
                {result.lumpSumEntries.length > 1 && (
                  <>
                    <View style={{ height: 1, backgroundColor: colour.borderLight, marginVertical: 8 }} />
                    <Row label="Total tax on the lump sums" value={fmt(result.lumpSumTax)} bold />
                  </>
                )}
              </>
            )}

            <View style={{ height: 1, backgroundColor: colour.borderLight, marginVertical: 8 }} />
            <Row
              label="Tax you owe before payments"
              value={fmt(result.taxAfterCredits + result.lumpSumTax)}
              bold
            />
            <Text style={{ fontSize: 11, color: colour.textHint, marginBottom: 8, lineHeight: 16 }}>
              This is what you owe based on your income alone. If you already paid SARS more than this, you get the difference back as a refund.
            </Text>

            <View style={{ height: space.sm }} />
            <Row label="Less: Tax you already paid" value={`− ${fmt(result.taxAlreadyPaid)}`} />
            <View style={{ height: 1, backgroundColor: colour.borderLight, marginVertical: 8 }} />
            <Row
              label={owing ? "You owe SARS" : refund ? "You get back" : "No amount owing or refund"}
              value={fmt(result.finalLiability)}
              bold
            />
          </View>

          {/* Disclaimer note */}
          <View
            style={{
              flexDirection: "row",
              gap: space.sm,
              alignItems: "flex-start",
              padding: space.md,
              borderRadius: radius.note,
              backgroundColor: colour.primary + "17",
              borderWidth: 1,
              borderColor: colour.primary + "29",
              marginBottom: space.md,
            }}
          >
            <IconSymbol name="exclamationmark.triangle.fill" size={15} color={colour.primary} style={{ marginTop: 1 } as any} />
            <Text style={{ fontSize: 11.5, lineHeight: 16, color: colour.text, flex: 1 }}>
              Rare cases, like selling a house, are not covered here. Speak to a practitioner before you file if one applies.
            </Text>
          </View>

          <MXButton
            variant="primary"
            label="Continue to ITR12 export"
            onPress={() => router.push("/itr12-export-setup")}
            size="L"
            fullWidth
          />
          <View style={{ height: space.sm }} />
          <MXButton
            variant="secondary"
            label="Change my figures"
            onPress={() => router.push("/tax-liability-inputs" as any)}
            size="L"
            fullWidth
          />
        </ScrollView>
      )}
      <ConfirmModal
        visible={showWhyModal}
        title="Why this is an estimate"
        message="This figure is based on everything you've logged in MyExpense so far. It updates automatically as you add more income, expenses, or details to your Tax refund or bill inputs."
        confirmLabel="Got it"
        destructive={false}
        icon="info.circle.fill"
        hideCancel
        onConfirm={() => setShowWhyModal(false)}
        onCancel={() => setShowWhyModal(false)}
      />
      <MXTabBar />
    </SafeAreaView>
  );
}
