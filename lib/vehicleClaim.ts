// ─── Vehicle running costs: actual cost × logbook business-use % ─────────────
// Freelancers and sole proprietors claim actual vehicle costs × the share of
// their driving that was for work, worked out from the mileage logbook:
// logged km ÷ km on the odometer for the tax year (opening to closing
// reading). No per-km rate.
//
// Applied when totals and exports are worked out, not when an expense is
// saved, so it always uses the current logbook (a trip or odometer reading
// added later updates every figure) and every entry path (typed, scanned,
// bank import) gets the same %. Decided by Ian on 2026-11-25:
// • until there is a second odometer reading the running costs claim R0,
//   the same rule wear & tear already follows;
// • once it can be worked out it replaces any % typed in by hand;
// • during the year the "closing" field holds the latest reading the user
//   entered, giving a running estimate (SARS only asks for the readings on
//   1 March and the end of February, not one per trip). A reading saved
//   before the tax year ended is treated as that, and figures say they are
//   an estimate until the year-end reading is in.
// The yearly wear & tear row already holds its logbook share and is left alone.
// Salaried employees claim no vehicle costs (lib/workType.ts).
// ─────────────────────────────────────────────────────────────────────────────

export const VEHICLE_CATEGORY = "Vehicle Expenses";
// "Fuel & Oil" is an old name still on some saved rows (see LEGACY_CATEGORY_ALIASES).
const VEHICLE_CATEGORY_NAMES = [VEHICLE_CATEGORY, "Fuel & Oil"];

export interface VehicleLogbook {
  /** Business-use ratio (0-1) per vehicle with both odometer readings. */
  byVehicle: Record<string, number>;
  /** All vehicles together, or null when no vehicle has both readings. */
  overall: number | null;
  /** False for salaried employees: no vehicle deduction at all. */
  claimsVehicleCosts: boolean;
  /** Date (YYYY-MM-DD) of the latest reading used, when it was saved before
   *  the tax year ended: the shares are a running estimate. Null when final. */
  estimateFrom: string | null;
  /** Last day of the tax year (YYYY-MM-DD), when known. */
  yearEnd: string | null;
}

/** Last day of the tax year, e.g. "2026/27" → "2027-02-28" (29th in a leap year). */
export function taxYearEndISO(taxYear: string): string {
  const end = parseInt(taxYear.split("/")[0], 10) + 1;
  const febDays = new Date(end, 2, 0).getDate();
  return `${end}-02-${String(febDays).padStart(2, "0")}`;
}

interface TripLike { vehicle_id: string | null; distance_km: number | string }
interface ReadingLike { vehicleId: string; openingKm: number | null; closingKm: number | null; updatedAt?: string | null }

const kmOnOdometer = (r: ReadingLike) =>
  r.openingKm == null || r.closingKm == null ? null : Math.max(r.closingKm - r.openingKm, 0);

/** Logbook shares for one tax year, from its trips and odometer readings. */
export function vehicleLogbook(
  trips: TripLike[],
  readings: ReadingLike[],
  claimsVehicleCosts: boolean,
  /** Without it, every reading is taken as final. */
  taxYear?: string,
): VehicleLogbook {
  const byVehicle: Record<string, number> = {};
  let totalKm = 0;
  let businessKm = 0;
  let estimateFrom: string | null = null;
  const yearEnd = taxYear ? taxYearEndISO(taxYear) : null;
  for (const r of readings) {
    const km = kmOnOdometer(r);
    if (km == null || km <= 0) continue;
    const savedOn = r.updatedAt ? r.updatedAt.slice(0, 10) : null;
    if (yearEnd && savedOn && savedOn < yearEnd && (!estimateFrom || savedOn > estimateFrom)) estimateFrom = savedOn;
    const vKm = trips.filter((t) => t.vehicle_id === r.vehicleId).reduce((s, t) => s + Number(t.distance_km), 0);
    byVehicle[r.vehicleId] = Math.min(vKm / km, 1);
    totalKm += km;
    businessKm += vKm;
  }
  return { byVehicle, overall: totalKm > 0 ? Math.min(businessKm / totalKm, 1) : null, claimsVehicleCosts, estimateFrom, yearEnd };
}

interface RowLike {
  category: string;
  amount: number | string;
  gross_amount?: number | string | null;
  business_use_pct?: number | string | null;
  vehicle_id?: string | null;
  wear_and_tear_vehicle_id?: string | null;
}

/** A vehicle running cost (fuel, services, licence...), not the wear & tear row. */
export const isVehicleRunningCost = (e: Pick<RowLike, "category" | "wear_and_tear_vehicle_id">) =>
  VEHICLE_CATEGORY_NAMES.includes((e.category ?? "").trim()) && !e.wear_and_tear_vehicle_id;

/** The business-use ratio that applies to this row (0 until it can be worked out). */
export function logbookRatioFor(e: Pick<RowLike, "vehicle_id">, logbook: VehicleLogbook): number {
  if (!logbook.claimsVehicleCosts) return 0;
  const own = e.vehicle_id != null ? logbook.byVehicle[e.vehicle_id] : undefined;
  return own ?? logbook.overall ?? 0;
}

/** The full cost paid, before any business-use share was taken off. */
export const fullCost = (e: Pick<RowLike, "amount" | "gross_amount">) => Number(e.gross_amount ?? e.amount);

/**
 * The row as it should be claimed: vehicle running costs get the logbook
 * share of their full cost (and that share of the VAT, via business_use_pct);
 * every other row comes back unchanged.
 */
export function withLogbookShare<T extends RowLike>(e: T, logbook: VehicleLogbook): T {
  if (!isVehicleRunningCost(e)) return e;
  const ratio = logbookRatioFor(e, logbook);
  const full = fullCost(e);
  return {
    ...e,
    amount: Math.round(full * ratio * 100) / 100,
    gross_amount: full,
    business_use_pct: Math.round(ratio * 10000) / 100,
  };
}

/** Running costs that claim R0 only because the logbook isn't finished yet. */
export function waitingForLogbook(expenses: (RowLike & { is_deductible: boolean })[], logbook: VehicleLogbook): { amount: number; count: number } {
  if (!logbook.claimsVehicleCosts) return { amount: 0, count: 0 };
  const rows = expenses.filter(
    (e) => e.is_deductible && isVehicleRunningCost(e) &&
      (e.vehicle_id == null || logbook.byVehicle[e.vehicle_id] == null) && logbook.overall == null,
  );
  return { amount: rows.reduce((s, e) => s + fullCost(e), 0), count: rows.length };
}

const longDate = (iso: string) =>
  new Date(`${iso}T12:00:00`).toLocaleDateString("en-ZA", { day: "numeric", month: "long", year: "numeric" });

/**
 * The one line every screen shows about the vehicle claim, or null when there
 * is nothing to say (no vehicle costs, a final logbook, or an employee).
 */
export function vehicleClaimNote(
  expenses: (RowLike & { is_deductible: boolean })[],
  logbook: VehicleLogbook,
  taxYear: string,
): string | null {
  if (!logbook.claimsVehicleCosts) return null;
  if (!expenses.some((e) => e.is_deductible && isVehicleRunningCost(e))) return null;
  const waiting = waitingForLogbook(expenses, logbook);
  if (waiting.count > 0) {
    const rands = `R ${Math.round(waiting.amount).toLocaleString("en-ZA")}`;
    return `${rands} of vehicle costs isn't included yet. Add your latest odometer reading on your vehicle to include an estimate.`;
  }
  if (logbook.estimateFrom) {
    return `Your vehicle claim is an estimate from your odometer reading on ${longDate(logbook.estimateFrom)}. The final amount depends on your reading on ${longDate(taxYearEndISO(taxYear))}.`;
  }
  return null;
}
