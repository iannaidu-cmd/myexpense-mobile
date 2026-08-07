import { InfoBanner } from "@/components/InfoBanner";
import { MXButton } from "@/components/MXButton";
import { MXHeader } from "@/components/MXHeader";
import { calculateTaxLiability, TaxLiabilityResult } from "@/lib/taxLiability";
import { expenseService } from "@/services/expenseService";
import { incomeService } from "@/services/incomeService";
import { profileService } from "@/services/profileService";
import { taxLiabilityService } from "@/services/taxLiabilityService";
import { useAuthStore } from "@/stores/authStore";
import { useExpenseStore } from "@/stores/expenseStore";
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

  const loadData = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    setLoading(true);
    try {
      const existing = await taxLiabilityService.getEstimate(user.id, activeTaxYear);
      if (!existing) {
        router.replace("/tax-liability-inputs" as any);
        return;
      }

      const [profile, expenseTotals, incomeTotals] = await Promise.all([
        profileService.getProfile(user.id),
        expenseService.getTotals(user.id, activeTaxYear),
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
        title="Tax Refund or Bill"
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
              backgroundColor: colour.noir,
              borderRadius: radius.lg,
              padding: space.xl,
              marginBottom: space.md,
            }}
          >
            <Text style={{ fontSize: 11, color: colour.onNoir2, letterSpacing: 0.8, marginBottom: space.sm }}>
              {owing ? "YOU OWE SARS" : refund ? "SARS OWES YOU" : "YOU DON'T OWE ANYTHING"}
            </Text>
            <Text
              style={{
                fontSize: 44,
                fontWeight: "800",
                letterSpacing: -1.5,
                color: owing ? colour.danger : refund ? colour.success : colour.onNoir,
                marginBottom: 4,
              }}
            >
              {fmt(result.finalLiability)}
            </Text>
            <Text style={{ fontSize: 12, color: colour.onNoir2 }}>
              {owing
                ? "This is based on what you've added so far for " + activeTaxYear
                : refund
                  ? "You should get this money back from SARS for " + activeTaxYear
                  : "You don't owe anything, and there's no refund, based on what you've added so far"}
            </Text>
          </View>

          <InfoBanner
            icon="exclamationmark.triangle.fill"
            title="This is only a guess"
            body="This does not cover rare cases, like selling a house or a big retirement payout. This number will change as you add more information during the year."
            style={{ marginBottom: space.md }}
          />

          {/* Breakdown */}
          <View
            style={{
              backgroundColor: colour.white,
              borderRadius: radius.md,
              padding: space.md,
              borderWidth: 1,
              borderColor: colour.borderLight,
              marginBottom: space.md,
            }}
          >
            <Text style={{ fontSize: 13, fontWeight: "700", color: colour.text, marginBottom: 12 }}>
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
            <Row label="Tax you owe before payments" value={fmt(result.taxAfterCredits)} bold />
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

          <MXButton
            variant="secondary"
            label="Continue to ITR12 export"
            onPress={() => router.push("/itr12-export-setup")}
            fullWidth
          />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
