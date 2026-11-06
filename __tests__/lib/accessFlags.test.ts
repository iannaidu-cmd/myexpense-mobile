import { deriveProfileFlags, GRACE_PERIOD_DAYS, SIGNED_OUT_FLAGS } from "@/lib/accessFlags";

const NOW = Date.parse("2026-11-06T12:00:00Z");
const DAY = 86_400_000;
const iso = (ms: number) => new Date(ms).toISOString();

describe("deriveProfileFlags", () => {
  it("promo user: full access, not paying, so offered an upgrade", () => {
    const f = deriveProfileFlags({ subscription: "free", promo_expires_at: iso(NOW + 14 * DAY), work_type: "freelancer" }, NOW);
    expect(f.isPremium).toBe(true); // scanning etc. stays unlimited
    expect(f.hasPaidSubscription).toBe(false); // upgrade button + paywall shown
    expect(f.isPromo).toBe(true);
    expect(f.promoExpiresAt).toBe(iso(NOW + 14 * DAY));
  });

  it("free user after the promo ends: no access, offered an upgrade", () => {
    const f = deriveProfileFlags({ subscription: "free", promo_expires_at: iso(NOW - DAY) }, NOW);
    expect(f.isPremium).toBe(false); // free limit enforced
    expect(f.hasPaidSubscription).toBe(false);
    expect(f.isPromo).toBe(false);
  });

  it("paid user: access and paying, no upgrade offered", () => {
    const f = deriveProfileFlags({ subscription: "pro" }, NOW);
    expect(f.isPremium).toBe(true);
    expect(f.hasPaidSubscription).toBe(true);
    expect(f.isPromo).toBe(false);
  });

  it("paid user who also has a promo date is treated as paying, not promo", () => {
    const f = deriveProfileFlags({ subscription: "pro", promo_expires_at: iso(NOW + DAY) }, NOW);
    expect(f.hasPaidSubscription).toBe(true);
    expect(f.isPromo).toBe(false);
  });

  it("dev user: unchanged, full access and never a promo", () => {
    const f = deriveProfileFlags({ is_dev_user: true, subscription: "free", promo_expires_at: iso(NOW + DAY) }, NOW);
    expect(f.isDevUser).toBe(true);
    expect(f.isPremium).toBe(true);
    expect(f.isPromo).toBe(false);
  });

  it("failed payment inside the grace period keeps access and counts as paying", () => {
    const f = deriveProfileFlags({ subscription: "pro", billing_issue_detected_at: iso(NOW - 2 * DAY) }, NOW);
    expect(f.isPremium).toBe(true);
    expect(f.hasPaidSubscription).toBe(true);
    expect(f.billingIssueDetectedAt).not.toBeNull();
    expect(f.isAccessBlocked).toBe(false);
  });

  it("failed payment past the grace period blocks access and stops counting as paying", () => {
    const f = deriveProfileFlags(
      { subscription: "pro", billing_issue_detected_at: iso(NOW - (GRACE_PERIOD_DAYS + 1) * DAY) },
      NOW,
    );
    expect(f.isPremium).toBe(false);
    expect(f.hasPaidSubscription).toBe(false);
    expect(f.isAccessBlocked).toBe(true);
  });

  it("a missing row gives signed-out style flags and no profile-setup redirect", () => {
    expect(deriveProfileFlags(null, NOW)).toEqual(SIGNED_OUT_FLAGS);
  });
});
