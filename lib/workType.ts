// ─── Work type ────────────────────────────────────────────────────────────────
// profiles.work_type holds the id picked on Profile setup. It decides which
// SARS rules apply to vehicle travel:
//
// • sole / freelancer / contractor (and "other" or unset, the app's default):
//   trading in their own name under s11(a). They claim actual vehicle costs ×
//   logbook business-use %, plus s11(e) wear & tear.
// • employed: a salaried employee can't deduct vehicle costs this way. Travel
//   is only claimable against a travel allowance from the employer (s8(1)(b)),
//   which MyExpense doesn't support yet, so no vehicle deduction is created.
// ─────────────────────────────────────────────────────────────────────────────

export const WORK_TYPES = [
  { id: "sole", label: "Sole proprietor" },
  { id: "freelancer", label: "Freelancer" },
  { id: "contractor", label: "Independent contractor" },
  { id: "employed", label: "Salaried employee" },
  { id: "other", label: "Other" },
] as const;

export function workTypeLabel(workType: string | null | undefined): string {
  return WORK_TYPES.find((w) => w.id === workType)?.label ?? workType ?? "Sole proprietor";
}

export function claimsVehicleCostsAsBusiness(workType: string | null | undefined): boolean {
  return workType !== "employed";
}

export const EMPLOYEE_VEHICLE_NOTE =
  "As an employee, you can't claim your vehicle costs or wear & tear. You can only claim work travel if your employer pays you a travel allowance. Your logbook still keeps a record of your trips.";
