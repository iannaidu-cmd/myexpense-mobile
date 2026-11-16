// ─── Store free trials ───────────────────────────────────────────────────────
// Pure helpers for the paywall's free trial wording. The trial itself is set
// up as an introductory offer in App Store Connect and Play Console. The app
// only reads it from the store, so the length is never hardcoded here.
//
//   - iPhone: product.introPrice at price 0, shown only when RevenueCat's
//     intro eligibility check says ELIGIBLE (unknown means no trial wording,
//     as RevenueCat advises).
//   - Android: the package's defaultOption.freePhase. Google Play only returns
//     offers the person qualifies for, and purchasePackage buys defaultOption,
//     so what is shown is what they get.
//
// No trial found means null, and the paywall looks exactly as it did before.
// Types are structural so this file never loads react-native-purchases.
// ─────────────────────────────────────────────────────────────────────────────

export type TrialUnit = "DAY" | "WEEK" | "MONTH" | "YEAR";

export interface TrialPeriod {
  unit: TrialUnit;
  count: number;
}

export type BillingPlan = "monthly" | "annual";
export type StorePlatform = "ios" | "android";

const UNITS: readonly string[] = ["DAY", "WEEK", "MONTH", "YEAR"];

function toTrial(unit: string | null | undefined, count: number | null | undefined): TrialPeriod | null {
  if (!unit || !UNITS.includes(unit)) return null;
  if (typeof count !== "number" || !Number.isFinite(count) || count <= 0) return null;
  return { unit: unit as TrialUnit, count: Math.round(count) };
}

/** iPhone: the intro offer is a trial only if it is free and the person qualifies. */
export function trialFromIosIntro(
  intro: { price: number; periodUnit: string; periodNumberOfUnits: number; cycles: number } | null | undefined,
  eligible: boolean,
): TrialPeriod | null {
  if (!intro || !eligible || intro.price !== 0) return null;
  const cycles = intro.cycles > 0 ? intro.cycles : 1;
  return toTrial(intro.periodUnit, intro.periodNumberOfUnits * cycles);
}

/** Android: the free phase of the option that purchasePackage will buy. */
export function trialFromAndroidOption(
  option:
    | {
        freePhase: {
          billingPeriod: { unit: string; value: number };
          billingCycleCount: number | null;
        } | null;
      }
    | null
    | undefined,
): TrialPeriod | null {
  const phase = option?.freePhase;
  if (!phase) return null;
  const cycles = phase.billingCycleCount && phase.billingCycleCount > 0 ? phase.billingCycleCount : 1;
  return toTrial(phase.billingPeriod?.unit, (phase.billingPeriod?.value ?? 0) * cycles);
}

/** "7 days", "1 month", "1 year". Weeks read as days, the way trials are usually described. */
export function formatTrialLength(trial: TrialPeriod): string {
  const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;
  switch (trial.unit) {
    case "DAY":
      return plural(trial.count, "day");
    case "WEEK":
      return plural(trial.count * 7, "day");
    case "MONTH":
      return plural(trial.count, "month");
    case "YEAR":
      return plural(trial.count, "year");
  }
}

function perPeriod(plan: BillingPlan): string {
  return plan === "annual" ? "per year" : "per month";
}

/** "7 days free, then R99 per month" */
export function trialHeadline(trial: TrialPeriod, priceString: string, plan: BillingPlan): string {
  return `${formatTrialLength(trial)} free, then ${priceString} ${perPeriod(plan)}`;
}

/**
 * The auto-renew terms shown under the button before purchase: trial length,
 * the price and billing period afterwards, that it renews until cancelled,
 * and where to cancel (Apple Schedule 2 and Google Play subscription policy).
 */
export function trialTerms(trial: TrialPeriod, priceString: string, plan: BillingPlan, platform: StorePlatform): string {
  const start = `Free for ${formatTrialLength(trial)}, then ${priceString} ${perPeriod(plan)}. Your subscription renews automatically until you cancel.`;
  const cancel =
    platform === "ios"
      ? "To avoid being charged, cancel at least 24 hours before the trial ends in your App Store settings."
      : "To avoid being charged, cancel before the trial ends in Google Play, under Payments and subscriptions.";
  return `${start} ${cancel}`;
}

/** True while a store subscription is in its free trial (RevenueCat entitlement periodType). */
export function isStoreTrial(entitlement: { periodType?: string | null } | null | undefined): boolean {
  return entitlement?.periodType === "TRIAL";
}

/** Whole days of trial, for tracking (null when there is no trial). */
export function trialDays(trial: TrialPeriod | null | undefined): number | null {
  if (!trial) return null;
  switch (trial.unit) {
    case "DAY":
      return trial.count;
    case "WEEK":
      return trial.count * 7;
    case "MONTH":
      return trial.count * 30;
    case "YEAR":
      return trial.count * 365;
  }
}
