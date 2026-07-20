import Purchases, {
    type CustomerInfo,
    type PurchasesPackage,
} from "react-native-purchases";
import { create } from "zustand";

// ─── Subscription Store ───────────────────────────────────────────────────────
// Wraps RevenueCat state. Import anywhere with:
//   const { isPro, packages, purchasePackage, restorePurchases } = useSubscriptionStore();
//
// Entitlement IDs (must match RevenueCat dashboard exactly):
export const ENTITLEMENT_PRO = "pro";
//
// Product identifiers (must match App Store Connect / Play Console).
// Reference only — do NOT match packages against these directly. Android
// subscriptions with a Play base plan come back from RevenueCat as
// "myexpense_pro_monthly:monthly-autorenew" (base plan ID appended), so an
// exact-match against the bare product ID silently fails on Android while
// working fine on iOS. Match on the package identifiers below instead,
// which RevenueCat keeps consistent across every platform.
export const PRODUCT_MONTHLY = "myexpense_pro_monthly";
export const PRODUCT_ANNUAL = "myexpense_pro_annual";

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

  /** Call after RevenueCat is configured (on auth change or app focus) */
  refresh: () => Promise<void>;
  /** Purchase a package; resolves true on success, false on cancellation */
  purchasePackage: (pkg: PurchasesPackage) => Promise<boolean>;
  /** Restore previous purchases */
  restorePurchases: () => Promise<boolean>;
}

function isProFromCustomerInfo(info: CustomerInfo): boolean {
  return typeof info.entitlements.active[ENTITLEMENT_PRO] !== "undefined";
}

export const useSubscriptionStore = create<SubscriptionState>((set, get) => ({
  isPro: false,
  customerInfo: null,
  packages: [],
  loading: false,
  error: null,

  refresh: async () => {
    set({ loading: true, error: null });
    try {
      // Fetch current customer info
      const info = await Purchases.getCustomerInfo();
      const isPro = isProFromCustomerInfo(info);
      set({ customerInfo: info, isPro });

      // Fetch available offerings/packages
      const offerings = await Purchases.getOfferings();
      const current = offerings.current;
      if (current) {
        set({ packages: current.availablePackages });
      }
    } catch (e: any) {
      set({ error: e?.message ?? "Failed to load subscription info" });
    } finally {
      set({ loading: false });
    }
  },

  purchasePackage: async (pkg: PurchasesPackage): Promise<boolean> => {
    set({ loading: true, error: null });
    try {
      const { customerInfo } = await Purchases.purchasePackage(pkg);
      const isPro = isProFromCustomerInfo(customerInfo);
      set({ customerInfo, isPro });
      return isPro;
    } catch (e: any) {
      // User cancelled — not a real error
      if (e?.userCancelled) {
        set({ loading: false });
        return false;
      }
      set({ error: e?.message ?? "Purchase failed" });
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
