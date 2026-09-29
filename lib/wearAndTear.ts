import { VAT_RATE } from "@/lib/taxRules";

// ─── Vehicle wear-and-tear (s11(e)) ──────────────────────────────────────────
// Part of a self-employed taxpayer's actual-cost vehicle claim.
// Source: SARS Interpretation Note 47 (Issue 5, 9 Feb 2021) and BGR 7
// (Issue 4). Re-verify against those if SARS reissues them.
//
//   claim = (cost ÷ write-off years × months in use ÷ 12) × business-use %
//
// • Write-off periods (IN47 annexure): passenger cars 5 years, delivery
//   vehicles 4, motorcycles 4.
// • Apportioned on a time basis in the year the vehicle is acquired and
//   brought into use (IN47 §4.3.8). The acquisition month counts as a full
//   month, so a car bought in December has 3 months (Dec–Feb) in that year.
// • Apportioned for private use (IN47 §4.3.7). The write-off period still runs
//   on the full cost, so private use is lost rather than deferred (IN47's own
//   example: a 5-year asset used privately for 3 years only gets years 4–5).
// • Items costing less than R7 000 may be written off in full in the year
//   acquired and brought into use (IN47 "small items").
// • Cost excludes VAT only if the taxpayer is a registered vendor AND was
//   entitled to deduct that input tax (s23C), i.e. actually claimed it back.
// • Selling: the allowance stops at the sale (IN47 §4.3.8). If the proceeds,
//   capped at cost, exceed the tax value (cost − allowances, IGNORING private
//   use), the excess is recouped as income under s8(4)(a). Private use is
//   taken out using lifetime logbook km, the method SARS IN60 (Issue 2)
//   Example 1 uses for the matching loss (s11(o)), since only allowances
//   actually allowed can be recouped. The sale month counts as a month of use.
// • No value cap applies under s11(e). The R800 000-style limit is part of the
//   s8(1)(b) deemed-cost table for travel allowances, which doesn't apply here.
// ─────────────────────────────────────────────────────────────────────────────

export type VehicleType = "passenger" | "double_cab" | "delivery" | "motorcycle";

// Double cabs: neither IN47 nor BGR 7 says whether a double cab is a
// "passenger car" (5 years) or a "delivery vehicle" (4 years), and writing an
// asset off faster than the Annexure needs a motivated application to SARS
// before the return is filed. The only SARS definition that names double cabs
// (the VAT Act's "motor car", quoted in IN82) groups them with passenger cars.
// So they're treated as passenger cars: 5 years, which can't over-claim.
export const VEHICLE_WRITE_OFF_YEARS: Record<VehicleType, number> = {
  passenger: 5,
  double_cab: 5,
  delivery: 4,
  motorcycle: 4,
};

// VAT on buying a "motor car" can never be claimed (VAT Act s1 definition,
// VAT 404 §8.5.3, IN82). That definition expressly includes sedans, SUVs,
// station wagons, minibuses and double-cab LDVs. Single cabs and panel vans
// are tested case by case; motorcycles aren't motor cars (fewer than three
// wheels). Where it can't be claimed, the price always includes the VAT.
export function purchaseVatCanBeClaimed(type: VehicleType): boolean {
  return type === "delivery" || type === "motorcycle";
}

export const SMALL_ITEM_LIMIT = 7000; // full write-off if cost is LESS than this

const round2 = (n: number) => Math.round(n * 100) / 100;

// "2026/27" → 2026
const taxYearStartYear = (taxYear: string) => parseInt(taxYear.slice(0, 4), 10);

// ISO "YYYY-MM-DD" → tax year start year (parsed from the string, not a Date,
// so the device time zone can't shift it across a month boundary).
function acquisitionTaxYearStart(acquiredIso: string): number {
  const [y, m] = acquiredIso.split("-").map(Number);
  return m >= 3 ? y : y - 1;
}

export function wearAndTearCostBase(purchasePrice: number, vatClaimed: boolean): number {
  return vatClaimed ? round2(purchasePrice / (1 + VAT_RATE)) : purchasePrice;
}

// Month index of an ISO date relative to March of the tax year (0 = March).
function monthIndexIn(iso: string, taxYear: string): number {
  const [y, m] = iso.split("-").map(Number);
  return (y - taxYearStartYear(taxYear)) * 12 + (m - 3);
}

const taxYearLabel = (startYear: number) => `${startYear}/${String(startYear + 1).slice(-2)}`;

// Months of the given tax year the vehicle was held (0–12). The acquisition
// month and the sale month both count.
export function monthsInUse(acquiredIso: string, taxYear: string, soldIso?: string | null): number {
  const start = Math.max(monthIndexIn(acquiredIso, taxYear), 0);
  const end = Math.min(soldIso ? monthIndexIn(soldIso, taxYear) : 11, 11);
  return Math.max(end - start + 1, 0);
}

export interface WearAndTearAsset {
  cost: number;
  acquiredDate: string; // ISO YYYY-MM-DD
  type: VehicleType;
  soldDate?: string | null;
}

// Allowance per tax year (before business-use %), from acquisition until the
// cost is written off or the vehicle is sold.
function allowanceSchedule(asset: WearAndTearAsset): Map<number, number> {
  const { cost, acquiredDate, type, soldDate } = asset;
  const schedule = new Map<number, number>();
  if (!(cost > 0)) return schedule;
  const first = acquisitionTaxYearStart(acquiredDate);

  if (cost < SMALL_ITEM_LIMIT) {
    schedule.set(first, cost);
    return schedule;
  }

  const last = soldDate ? acquisitionTaxYearStart(soldDate) : Infinity;
  const annual = cost / VEHICLE_WRITE_OFF_YEARS[type];
  let remaining = cost;
  for (let y = first; y <= last && remaining > 0.005; y++) {
    const allowance = Math.min((annual * monthsInUse(acquiredDate, taxYearLabel(y), soldDate)) / 12, remaining);
    schedule.set(y, allowance);
    remaining -= allowance;
  }
  return schedule;
}

// Wear-and-tear allowance for one tax year BEFORE the business-use %.
export function wearAndTearAllowance(opts: WearAndTearAsset & { taxYear: string }): number {
  const allowance = allowanceSchedule(opts).get(taxYearStartYear(opts.taxYear)) ?? 0;
  return round2(Math.max(allowance, 0));
}

// Cost less every allowance up to and including the given tax year,
// ignoring private use (IN60 Example 1).
export function taxValueAfter(asset: WearAndTearAsset, taxYear: string): number {
  const target = taxYearStartYear(taxYear);
  let claimed = 0;
  for (const [y, a] of allowanceSchedule(asset)) if (y <= target) claimed += a;
  return round2(Math.max(asset.cost - claimed, 0));
}

export interface SaleResult {
  saleTaxYear: string;
  taxValue: number;         // at the date of sale
  grossRecoupment: number;  // before taking out private use
  recoupment: number;       // included in income (s8(4)(a))
  grossLoss: number;        // before taking out private use
  loss: number;             // s11(o) — shown, not yet claimed by the app
}

// Outcome of selling the vehicle. lifetimeBusinessRatio = total business km ÷
// total km over the whole period the vehicle was owned (IN60 Example 1).
export function saleOutcome(
  asset: WearAndTearAsset & { soldDate: string },
  salePrice: number,
  lifetimeBusinessRatio: number,
): SaleResult {
  const saleTaxYear = taxYearLabel(acquisitionTaxYearStart(asset.soldDate));
  const taxValue = taxValueAfter(asset, saleTaxYear);
  const grossRecoupment = Math.max(Math.min(salePrice, asset.cost) - taxValue, 0);
  const grossLoss = Math.max(taxValue - salePrice, 0);
  const ratio = Math.min(Math.max(lifetimeBusinessRatio, 0), 1);
  return {
    saleTaxYear,
    taxValue,
    grossRecoupment: round2(grossRecoupment),
    recoupment: round2(grossRecoupment * ratio),
    grossLoss: round2(grossLoss),
    loss: round2(grossLoss * ratio),
  };
}

// The deductible claim for the year: allowance × business-use % (0–1).
export function wearAndTearClaim(allowance: number, businessRatio: number): number {
  return round2(allowance * Math.min(Math.max(businessRatio, 0), 1));
}
