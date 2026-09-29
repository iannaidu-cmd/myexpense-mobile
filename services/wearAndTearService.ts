import { localISODate } from '@/lib/dateInput';
import { invalidatePrefix } from '@/lib/queryCache';
import { supabase } from '@/lib/supabase';
import {
  monthsInUse,
  purchaseVatCanBeClaimed,
  saleOutcome,
  VEHICLE_WRITE_OFF_YEARS,
  wearAndTearAllowance,
  wearAndTearClaim,
  wearAndTearCostBase,
  type SaleResult,
} from '@/lib/wearAndTear';
import { claimsVehicleCostsAsBusiness } from '@/lib/workType';
import { taxYearForDate } from '@/lib/taxRules';
import { mileageService, type MileageTrip } from '@/services/mileageService';
import { profileService } from '@/services/profileService';
import {
  odometerTotalKm,
  vehicleService,
  type OdometerReading,
  type Vehicle,
} from '@/services/vehicleService';

// ─── Wear & Tear Service ──────────────────────────────────────────────────────
// Keeps one system-managed "Vehicle Expenses" row per vehicle per tax year in
// `expenses` (marked by wear_and_tear_vehicle_id) holding that year's s11(e)
// claim, and, in the tax year a vehicle is sold, one `income` row (marked by
// recoupment_vehicle_id) for any s8(4)(a) recoupment. Writing them as normal
// rows means they flow into every existing total, report and export with no
// special-casing. Recomputed whenever the inputs can change (vehicle details,
// odometer readings, trips, work type). See lib/wearAndTear.ts for the rules.
// ─────────────────────────────────────────────────────────────────────────────

// 'employee': salaried employees can't claim wear & tear (see lib/workType.ts).
export type WearAndTearGap = 'price' | 'date' | 'odometer' | 'employee';

export interface VehicleSale extends SaleResult {
  lifetimeBusinessRatio: number | null; // null if no year has both odometer readings
}

export interface VehicleWearAndTear {
  vehicleId: string;
  costBase: number | null;
  writeOffYears: number;
  monthsInUse: number;
  allowance: number;            // before business-use %
  businessRatio: number | null; // null until both odometer readings exist
  claim: number | null;         // what's deducted; null if it can't be worked out yet
  missing: WearAndTearGap[];
  sale: VehicleSale | null;     // set once the vehicle has a sale date and price
}

const fmtR = (n: number) =>
  `R${n.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

// Business-use % for ONE vehicle in one tax year: its logbook km ÷ its odometer km.
function vehicleBusinessRatio(vehicleId: string, trips: MileageTrip[], reading: OdometerReading | undefined): number | null {
  const totalKm = odometerTotalKm(reading);
  if (totalKm == null || totalKm <= 0) return null;
  const businessKm = trips
    .filter((t) => t.vehicle_id === vehicleId)
    .reduce((s, t) => s + Number(t.distance_km), 0);
  return Math.min(businessKm / totalKm, 1);
}

// Business-use % over the whole time the vehicle was owned: business km ÷
// odometer km, over the tax years that have both readings (IN60 Example 1).
function lifetimeBusinessRatio(trips: MileageTrip[], readings: OdometerReading[]): number | null {
  const years = new Set<string>();
  let totalKm = 0;
  for (const r of readings) {
    const km = odometerTotalKm(r);
    if (km != null && km > 0) {
      totalKm += km;
      years.add(r.taxYear);
    }
  }
  if (totalKm <= 0) return null;
  const businessKm = trips
    .filter((t) => years.has(t.tax_year))
    .reduce((s, t) => s + Number(t.distance_km), 0);
  return Math.min(businessKm / totalKm, 1);
}

export function computeWearAndTear(
  v: Vehicle,
  taxYear: string,
  trips: MileageTrip[],
  reading: OdometerReading | undefined,
  isEmployee = false,
  lifetime: { trips: MileageTrip[]; readings: OdometerReading[] } | null = null,
): VehicleWearAndTear {
  const missing: WearAndTearGap[] = [];
  if (isEmployee) missing.push('employee');
  if (v.purchasePrice == null || v.purchasePrice <= 0) missing.push('price');
  if (!v.acquiredDate) missing.push('date');
  const businessRatio = vehicleBusinessRatio(v.id, trips, reading);
  if (businessRatio == null) missing.push('odometer');

  const costBase = v.purchasePrice != null && v.purchasePrice > 0
    ? wearAndTearCostBase(v.purchasePrice, v.vatClaimed && purchaseVatCanBeClaimed(v.vehicleType))
    : null;
  const asset = costBase != null && v.acquiredDate
    ? { cost: costBase, acquiredDate: v.acquiredDate, type: v.vehicleType, soldDate: v.soldDate }
    : null;
  const allowance = asset ? wearAndTearAllowance({ ...asset, taxYear }) : 0;

  let sale: VehicleSale | null = null;
  if (asset && v.soldDate && v.salePrice != null) {
    const ratio = lifetime ? lifetimeBusinessRatio(lifetime.trips, lifetime.readings) : null;
    sale = {
      ...saleOutcome({ ...asset, soldDate: v.soldDate }, v.salePrice, ratio ?? 0),
      lifetimeBusinessRatio: ratio,
    };
  }

  return {
    vehicleId: v.id,
    costBase,
    writeOffYears: VEHICLE_WRITE_OFF_YEARS[v.vehicleType],
    monthsInUse: v.acquiredDate ? monthsInUse(v.acquiredDate, taxYear, v.soldDate) : 0,
    allowance,
    businessRatio,
    claim: missing.length === 0 ? wearAndTearClaim(allowance, businessRatio!) : null,
    missing,
    sale,
  };
}

// Last day of the tax year, or today if the year is still running.
function expenseDateFor(taxYear: string): string {
  const end = parseInt(taxYear.slice(0, 4), 10) + 1;
  const leap = (end % 4 === 0 && end % 100 !== 0) || end % 400 === 0;
  const yearEnd = `${end}-02-${leap ? 29 : 28}`;
  const today = localISODate(new Date());
  return today < yearEnd ? today : yearEnd;
}

const vehicleName = (v: Vehicle) => `${v.year} ${v.make} ${v.model} (${v.registration})`;

export const wearAndTearService = {

  // Recompute every vehicle's claim (and any sale recoupment) for the tax
  // year and write/remove the matching rows. Returns the breakdown for display.
  sync: async (userId: string, taxYear: string): Promise<VehicleWearAndTear[]> => {
    const [vehicles, readings, trips, profile] = await Promise.all([
      vehicleService.getVehicles(userId),
      vehicleService.getOdometerReadings(userId, taxYear),
      mileageService.getTrips(userId, taxYear),
      profileService.getProfile(userId),
    ]);
    // Follows the work type picked on Profile setup: switching to "Salaried
    // employee" removes the rows on the next sync, switching back restores them.
    const isEmployee = !claimsVehicleCostsAsBusiness(profile?.work_type);
    const readingByVehicle = Object.fromEntries(readings.map((r) => [r.vehicleId, r]));

    // Lifetime logbook data, only needed for vehicles sold in this tax year.
    const soldThisYear = vehicles.filter((v) => v.soldDate && taxYearForDate(v.soldDate) === taxYear);
    const lifetimeByVehicle = Object.fromEntries(
      await Promise.all(
        soldThisYear.map(async (v) => [
          v.id,
          {
            trips: await mileageService.getTripsForVehicle(userId, v.id),
            readings: await vehicleService.getAllReadingsForVehicle(userId, v.id),
          },
        ] as const),
      ),
    );

    const results = vehicles.map((v) =>
      computeWearAndTear(v, taxYear, trips, readingByVehicle[v.id], isEmployee, lifetimeByVehicle[v.id] ?? null),
    );

    for (const r of results) {
      const v = vehicles.find((x) => x.id === r.vehicleId)!;

      // ── Wear & tear expense row ──
      if (r.claim != null && r.claim > 0) {
        const pct = (r.businessRatio! * 100).toFixed(1);
        const date = v.soldDate && taxYearForDate(v.soldDate) === taxYear ? v.soldDate : expenseDateFor(taxYear);
        const { error } = await supabase.from('expenses').upsert(
          {
            user_id: userId,
            wear_and_tear_vehicle_id: v.id,
            vehicle_id: v.id,
            tax_year: taxYear,
            vendor: `Wear & tear: ${vehicleName(v)}`,
            amount: r.claim,
            gross_amount: r.allowance,
            business_use_pct: Number(pct),
            currency: 'ZAR',
            category: 'Vehicle Expenses',
            itr12_code: 'S11(e)',
            expense_date: date,
            is_deductible: true,
            vat_amount: null,
            notes:
              `Worked out for you. Price ${fmtR(r.costBase!)} spread over ${r.writeOffYears} years` +
              `${r.monthsInUse < 12 ? `, for the ${r.monthsInUse} months you had it` : ''}, is ${fmtR(r.allowance)} for this year.` +
              ` You claim ${pct}% of that, the share of your driving that was for work.`,
          },
          { onConflict: 'wear_and_tear_vehicle_id,tax_year' },
        );
        if (error) throw new Error(error.message);
      } else {
        const { error } = await supabase
          .from('expenses')
          .delete()
          .eq('user_id', userId)
          .eq('tax_year', taxYear)
          .eq('wear_and_tear_vehicle_id', v.id);
        if (error) throw new Error(error.message);
      }

      // ── Recoupment income row (tax year of sale only) ──
      const sale = r.sale;
      const recoup =
        !isEmployee && sale && sale.saleTaxYear === taxYear && sale.lifetimeBusinessRatio != null
          ? sale.recoupment
          : 0;
      if (recoup > 0) {
        const { error } = await supabase.from('income').upsert(
          {
            user_id: userId,
            recoupment_vehicle_id: v.id,
            tax_year: taxYear,
            amount: recoup,
            source: `Added back on sale: ${vehicleName(v)}`,
            category: 'Other',
            date: v.soldDate,
            description:
              `Worked out for you. You sold the vehicle for ${fmtR(v.salePrice!)}` +
              `${v.salePrice! > r.costBase! ? ` (we count no more than the ${fmtR(r.costBase!)} you paid)` : ''}.` +
              ` Its value left for tax was ${fmtR(sale!.taxValue)}, so you got ${fmtR(sale!.grossRecoupment)} more.` +
              ` The work share of that (${(sale!.lifetimeBusinessRatio! * 100).toFixed(1)}% of all the km you drove in it) is added back to your income.`,
          },
          { onConflict: 'recoupment_vehicle_id,tax_year' },
        );
        if (error) throw new Error(error.message);
      } else {
        const { error } = await supabase
          .from('income')
          .delete()
          .eq('user_id', userId)
          .eq('tax_year', taxYear)
          .eq('recoupment_vehicle_id', v.id);
        if (error) throw new Error(error.message);
      }
    }

    invalidatePrefix('exp:');
    invalidatePrefix('inc:');
    return results;
  },
};
