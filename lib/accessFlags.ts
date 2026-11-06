// ─── Access flags ─────────────────────────────────────────────────────────────
// Turns a profiles row into the flags authStore exposes. Kept pure (no
// Supabase, no React) so the rules can be unit tested.
//
// Two separate questions, answered by two separate flags:
//   isPremium            Can they use everything? (dev, active promo, or paid)
//   hasPaidSubscription  Do they actually pay? Decides whether to offer an
//                        upgrade. A promo user is NOT paying and must be able
//                        to buy Pro.
// ─────────────────────────────────────────────────────────────────────────────

// Failed-renewal payments get this many days of continued access before
// isAccessBlocked flips true. Only applies to users who already have a paid
// subscription with an unresolved billing issue, never to dev users or
// active promo_expires_at grants.
export const GRACE_PERIOD_DAYS = 7;

export type ProfileRow = {
  is_dev_user?: boolean | null;
  subscription?: string | null;
  terms_accepted_at?: string | null;
  promo_expires_at?: string | null;
  billing_issue_detected_at?: string | null;
  deletion_requested_at?: string | null;
  work_type?: string | null;
};

export type ProfileFlags = {
  isDevUser: boolean;
  /** Decides feature ACCESS. Never use it to decide whether to offer an upgrade. */
  isPremium: boolean;
  /** Paid plan ("pro" or "business") whose grace period hasn't run out. */
  hasPaidSubscription: boolean;
  /** Sign-up promo running: promo active, no paid plan, not a dev user. */
  isPromo: boolean;
  /** When the promo ends (ISO), or null if there is none. */
  promoExpiresAt: string | null;
  /** A paid subscription's renewal failed 7+ days ago and hasn't recovered. */
  isAccessBlocked: boolean;
  /** ISO timestamp of an unresolved billing issue still within its grace
   *  window (access not yet blocked), null otherwise. */
  billingIssueDetectedAt: string | null;
  deletionRequestedAt: string | null;
  isPendingDeletion: boolean;
  termsAccepted: boolean;
  needsProfileSetup: boolean;
};

/** Profile-derived fields for a signed-out user. */
export const SIGNED_OUT_FLAGS: ProfileFlags = {
  isDevUser: false,
  isPremium: false,
  hasPaidSubscription: false,
  isPromo: false,
  promoExpiresAt: null,
  isAccessBlocked: false,
  billingIssueDetectedAt: null,
  deletionRequestedAt: null,
  isPendingDeletion: false,
  termsAccepted: false,
  needsProfileSetup: false,
};

export function deriveProfileFlags(data: ProfileRow | null | undefined, nowMs: number = Date.now()): ProfileFlags {
  const isDevUser = data?.is_dev_user === true;
  const promoActive = data?.promo_expires_at ? new Date(data.promo_expires_at).getTime() > nowMs : false;
  const hasPaidPlan = data?.subscription === "pro" || data?.subscription === "business";

  const graceDeadlineMs = data?.billing_issue_detected_at
    ? new Date(data.billing_issue_detected_at).getTime() + GRACE_PERIOD_DAYS * 86_400_000
    : null;
  const graceExpired = graceDeadlineMs !== null && nowMs > graceDeadlineMs;

  // Access: dev users, active promos and paid plans all get everything.
  const isPremium = isDevUser || promoActive || (hasPaidPlan && !graceExpired);
  // Paying: decides whether to offer an upgrade.
  const hasPaidSubscription = hasPaidPlan && !graceExpired;
  const isPromo = promoActive && !hasPaidSubscription && !isDevUser;
  const promoExpiresAt = data?.promo_expires_at ?? null;
  const isAccessBlocked = !isDevUser && !promoActive && hasPaidPlan && graceExpired;
  const billingIssueDetectedAt =
    !isDevUser && !promoActive && hasPaidPlan && data?.billing_issue_detected_at && !graceExpired
      ? data.billing_issue_detected_at
      : null;
  const deletionRequestedAt = data?.deletion_requested_at ?? null;

  return {
    isDevUser,
    isPremium,
    hasPaidSubscription,
    isPromo,
    promoExpiresAt,
    isAccessBlocked,
    billingIssueDetectedAt,
    deletionRequestedAt,
    isPendingDeletion: deletionRequestedAt !== null,
    termsAccepted: !!data?.terms_accepted_at,
    // Only when the row actually loaded: a failed fetch shouldn't send anyone
    // to Profile setup.
    needsProfileSetup: data ? !data.work_type : false,
  };
}
