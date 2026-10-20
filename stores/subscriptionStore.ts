import Purchases, {
    type CustomerInfo,
    type PurchasesPackage,
} from "react-native-purchases";
import { create } from "zustand";
import { errorText, trackFunnel } from "@/services/funnelService";

// ─── Subscription Store ───────────────────────────────────────────────────────
// Wraps RevenueCat state. Import anywhere with:
//   const { isPro, packages, purchasePackage, restorePurchases } = useSubscriptionStore();
//
// Entitlement IDs (must match RevenueCat dashboard exactly):
export const ENTITLEMENT_PRO = "pro";
//
// RevenueCat package identifiers (auto-assigned for the standard monthly/
// annual package types within an offering) — platform-agnostic, use these
// to find packages instead of product.identifier.
export const PACKAGE_MONTHLY = "$rc_monthly";
export const PACKAGE_ANNUAL = "$rc_annual";
// ─────────────────────────────────────────────────────────────────────────────

interface SubscriptionState {
  isPro: boolean;
  customerInfo: CustomerInfo | null;
  packages: PurchasesPackage[];
  loading: boolean;
  error: string | null;
  /** True when the last purchase failed because the store already has this
   *  subscription running for the user (stores block buying it twice). */
  alreadyOwned: boolean;

  /** Call after RevenueCat is configured (on auth change or app focus).
   *  source names the caller in the offerings_loaded funnel event. */
  refresh: (source: OfferingsSource) => Promise<void>;
  /** Purchase a package; resolves true on success, false on cancellation */
  purchasePackage: (pkg: PurchasesPackage) => Promise<boolean>;
  /** Restore previous purchases */
  restorePurchases: () => Promise<boolean>;
}

function isProFromCustomerInfo(info: CustomerInfo): boolean {
  return typeof info.entitlements.active[ENTITLEMENT_PRO] !== "undefined";
}

export type OfferingsSource =
  | "launch"
  | "paywall"
  | "paywall_retry"
  | "access_blocked"
  | "subscription_manage"
  | "subscription_manage_foreground";

export function planForPackage(pkg: PurchasesPackage | undefined): "monthly" | "annual" | "other" {
  if (pkg?.identifier === PACKAGE_MONTHLY) return "monthly";
  if (pkg?.identifier === PACKAGE_ANNUAL) return "annual";
  return "other";
}

// RevenueCat errors carry a numeric code plus, for store failures, the
// underlying Google / Apple reason. Kept short for funnel_events props.
function purchaseErrorProps(e: any) {
  return {
    error_code: e?.code ?? null,
    error: errorText(e),
    underlying_error: e?.readableErrorCode ?? e?.underlyingErrorMessage ?? null,
  };
}

export const useSubscriptionStore = create<SubscriptionState>((set, get) => ({
  isPro: false,
  customerInfo: null,
  packages: [],
  loading: false,
  error: null,
  alreadyOwned: false,

  refresh: async (source) => {
    set({ loading: true, error: null });
    let stage: "customer_info" | "offerings" = "customer_info";
    try {
      // Fetch current customer info
      const info = await Purchases.getCustomerInfo();
      const isPro = isProFromCustomerInfo(info);
      set({ customerInfo: info, isPro });

      // Fetch available offerings/packages
      stage = "offerings";
      const offerings = await Purchases.getOfferings();
      const current = offerings.current;
      if (current) {
        set({ packages: current.availablePackages });
      }
      const pkgs = current?.availablePackages ?? [];
      trackFunnel("offerings_loaded", {
        source,
        stage: "done",
        ok: pkgs.length > 0,
        no_current_offering: !current,
        package_count: pkgs.length,
        has_monthly: pkgs.some((p) => p.identifier === PACKAGE_MONTHLY),
        has_annual: pkgs.some((p) => p.identifier === PACKAGE_ANNUAL),
        currency: pkgs[0]?.product.currencyCode ?? null,
      });
    } catch (e: any) {
      trackFunnel("offerings_loaded", {
        source,
        stage,
        ok: false,
        package_count: get().packages.length,
        error_code: e?.code ?? null,
        error: errorText(e),
      });
      set({ error: e?.message ?? "Failed to load subscription info" });
    } finally {
      set({ loading: false });
    }
  },

  purchasePackage: async (pkg: PurchasesPackage): Promise<boolean> => {
    set({ loading: true, error: null, alreadyOwned: false });
    const plan = planForPackage(pkg);
    try {
      const { customerInfo } = await Purchases.purchasePackage(pkg);
      const isPro = isProFromCustomerInfo(customerInfo);
      set({ customerInfo, isPro });
      // no_entitlement: the store sheet completed but RevenueCat does not
      // report Pro as active, which the paywall currently shows nothing for.
      trackFunnel("purchase_result", { plan, outcome: isPro ? "ok" : "no_entitlement" });
      return isPro;
    } catch (e: any) {
      // User cancelled — not a real error
      if (e?.userCancelled) {
        trackFunnel("purchase_result", { plan, outcome: "cancelled" });
        set({ loading: false });
        return false;
      }
      const alreadyOwned = e?.code === Purchases.PURCHASES_ERROR_CODE.PRODUCT_ALREADY_PURCHASED_ERROR;
      trackFunnel("purchase_result", {
        plan,
        outcome: alreadyOwned ? "already_owned" : "failed",
        ...purchaseErrorProps(e),
      });
      set({
        error: e?.message ?? "Purchase failed",
        alreadyOwned,
      });
      return false;
    } finally {
      set({ loading: false });
    }
  },

  restorePurchases: async (): Promise<boolean> => {
    set({ loading: true, error: null });
    try {
      const info = await Purchases.restorePurchases();
      const isPro = isProFromCustomerInfo(info);
      set({ customerInfo: info, isPro });
      return isPro;
    } catch (e: any) {
      set({ error: e?.message ?? "Restore failed" });
      return false;
    } finally {
      set({ loading: false });
    }
  },
}));
