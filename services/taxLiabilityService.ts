import { supabase } from "@/lib/supabase";
import { calculateTaxLiability } from "@/lib/taxLiability";
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
    });

    const row = {
      user_id: userId,
      tax_year: taxYear,
      other_taxable_income: inputs.other_taxable_income,
      retirement_annuity_contributions: inputs.retirement_annuity_contributions,
      tax_already_paid: inputs.tax_already_paid,
      donations_ytd: inputs.donations_ytd ?? null,
      taxable_income: result.taxableIncome,
      gross_tax: result.grossTax,
      rebates_applied: result.rebatesApplied,
      medical_credit_applied: result.medicalCreditApplied,
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
