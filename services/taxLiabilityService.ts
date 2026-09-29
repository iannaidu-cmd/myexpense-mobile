import { supabase } from "@/lib/supabase";
import { calculateTaxLiability, type TaxLiabilityInput } from "@/lib/taxLiability";
import { expenseService } from "@/services/expenseService";
import { incomeService } from "@/services/incomeService";
import { profileService } from "@/services/profileService";
import type { NewTaxLiabilityEstimate, TaxLiabilityEstimate } from "@/types/database";

export interface RecalculateEstimateInputs extends NewTaxLiabilityEstimate {
  businessTaxableIncome: number;
  dateOfBirth: string | null;
  medicalAidDependants: number;
}

export const taxLiabilityService = {
  getEstimate: async (userId: string, taxYear: string): Promise<TaxLiabilityEstimate | null> => {
    const { data, error } = await supabase
      .from("tax_liability_estimates")
      .select("*")
      .eq("user_id", userId)
      .eq("tax_year", taxYear)
      .single();

    if (error && error.code !== "PGRST116") throw new Error(error.message);
    return data ?? null;
  },

  // Runs the pure lib/taxLiability.ts engine and upserts the raw inputs +
  // computed outputs together, so a tax year's estimate is self-contained.
  recalculateEstimate: async (
    userId: string,
    taxYear: string,
    inputs: RecalculateEstimateInputs,
  ): Promise<TaxLiabilityEstimate> => {
    const result = calculateTaxLiability({
      taxYear,
      businessTaxableIncome: inputs.businessTaxableIncome,
      otherTaxableIncome: inputs.other_taxable_income,
      dateOfBirth: inputs.dateOfBirth,
      retirementAnnuityContributions: inputs.retirement_annuity_contributions,
      medicalAidDependants: inputs.medicalAidDependants,
      donationsYtd: inputs.donations_ytd ?? 0,
      taxAlreadyPaid: inputs.tax_already_paid,
      retirementSeveranceLumpSum: inputs.retirement_severance_lump_sum,
      priorRetirementSeveranceLumpSums: inputs.prior_retirement_severance_lump_sums,
      actualLumpSumTax: inputs.actual_lump_sum_tax ?? undefined,
      additionalLumpSums: inputs.additional_lump_sums?.map((entry) => ({
        grossAmount: entry.grossAmount,
        actualTax: entry.actualTax ?? undefined,
      })),
    });

    const row = {
      user_id: userId,
      tax_year: taxYear,
      other_taxable_income: inputs.other_taxable_income,
      retirement_annuity_contributions: inputs.retirement_annuity_contributions,
      tax_already_paid: inputs.tax_already_paid,
      donations_ytd: inputs.donations_ytd ?? null,
      retirement_severance_lump_sum: inputs.retirement_severance_lump_sum,
      prior_retirement_severance_lump_sums: inputs.prior_retirement_severance_lump_sums,
      actual_lump_sum_tax: inputs.actual_lump_sum_tax ?? null,
      additional_lump_sums: inputs.additional_lump_sums ?? [],
      taxable_income: result.taxableIncome,
      gross_tax: result.grossTax,
      rebates_applied: result.rebatesApplied,
      medical_credit_applied: result.medicalCreditApplied,
      lump_sum_tax: result.lumpSumTax,
      final_liability: result.finalLiability,
      last_calculated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("tax_liability_estimates")
      .upsert(row, { onConflict: "user_id,tax_year" })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  // Re-run an existing estimate against the CURRENT income and deductions
  // (every expense row, incl. mileage-derived ones like wear & tear), keeping
  // the user's saved inputs. Returns null if they haven't set one up yet.
  // Used wherever the stored figure is shown (Home, the summary screen) and
  // after anything that changes deductions behind the scenes, so the Home
  // "refund or bill" figure never lags behind the expenses it's built from.
  refreshEstimate: async (
    userId: string,
    taxYear: string,
  ): Promise<{ estimate: TaxLiabilityEstimate; input: TaxLiabilityInput } | null> => {
    const existing = await taxLiabilityService.getEstimate(userId, taxYear);
    if (!existing) return null;

    const profile = await profileService.getProfile(userId);
    const [expenseTotals, incomeTotals] = await Promise.all([
      expenseService.getTotals(userId, taxYear, profile?.vat_registered ?? false),
      incomeService.getTotals(userId, taxYear),
    ]);
    const businessTaxableIncome = Math.max(0, incomeTotals.totalIncome - expenseTotals.totalDeductions);

    const input: TaxLiabilityInput = {
      taxYear,
      businessTaxableIncome,
      otherTaxableIncome: existing.other_taxable_income,
      dateOfBirth: profile?.date_of_birth ?? null,
      retirementAnnuityContributions: existing.retirement_annuity_contributions,
      medicalAidDependants: profile?.medical_aid_dependants ?? 0,
      donationsYtd: existing.donations_ytd ?? 0,
      taxAlreadyPaid: existing.tax_already_paid,
      retirementSeveranceLumpSum: existing.retirement_severance_lump_sum,
      priorRetirementSeveranceLumpSums: existing.prior_retirement_severance_lump_sums,
      actualLumpSumTax: existing.actual_lump_sum_tax ?? undefined,
      additionalLumpSums: existing.additional_lump_sums?.map((entry) => ({
        grossAmount: entry.grossAmount,
        actualTax: entry.actualTax ?? undefined,
      })),
    };

    // Passes EVERY saved input back through. The summary screen's old inline
    // version dropped actual_lump_sum_tax / additional_lump_sums, which wiped
    // them on every view.
    const estimate = await taxLiabilityService.recalculateEstimate(userId, taxYear, {
      tax_year: taxYear,
      other_taxable_income: existing.other_taxable_income,
      retirement_annuity_contributions: existing.retirement_annuity_contributions,
      tax_already_paid: existing.tax_already_paid,
      donations_ytd: existing.donations_ytd,
      retirement_severance_lump_sum: existing.retirement_severance_lump_sum,
      prior_retirement_severance_lump_sums: existing.prior_retirement_severance_lump_sums,
      actual_lump_sum_tax: existing.actual_lump_sum_tax,
      additional_lump_sums: existing.additional_lump_sums,
      businessTaxableIncome,
      dateOfBirth: profile?.date_of_birth ?? null,
      medicalAidDependants: profile?.medical_aid_dependants ?? 0,
    });
    return { estimate, input };
  },

  getOrCreate: async (
    userId: string,
    taxYear: string,
    fallbackInputs: RecalculateEstimateInputs,
  ): Promise<TaxLiabilityEstimate> => {
    const existing = await taxLiabilityService.getEstimate(userId, taxYear);
    if (existing) return existing;
    return taxLiabilityService.recalculateEstimate(userId, taxYear, fallbackInputs);
  },
};
