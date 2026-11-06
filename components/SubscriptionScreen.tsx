// ─── SubscriptionScreen ───────────────────────────────────────────────────────
// The one Subscription screen, shown for both /paywall-upgrade (every "upgrade"
// and limit-reached entry point) and /subscription-manage (settings, billing
// banner). It draws itself from live data:
//   - Free:  "N of FREE_USE_LIMIT free uses left" from countFreeUses()
//   - Pro:   billing period + next payment date from the RevenueCat
//            entitlement, falling back to profiles.subscription_expires_at
//   - Promo: free plan view with the promo end date and an upgrade path
// Which view to show comes from hasPaidSubscription (Supabase) and isPro
// (RevenueCat), never from isPremium: isPremium also covers the sign-up
// promo, and a promo user must still be able to buy Pro.
// The bottom tab bar is always on screen.
// ─────────────────────────────────────────────────────────────────────────────

import { MXTabBar } from "@/components/MXTabBar";
import { showNotice } from "@/components/NoticeHost";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { FREE_USE_LIMIT } from "@/constants/freeTier";
import { useAppForeground } from "@/hooks/use-app-foreground";
import { logPaywallViewed } from "@/lib/analytics";
import { safeBack } from "@/lib/navigation";
import { openStoreSubscription, storeNameFor } from "@/lib/storeSubscriptions";
import { countFreeUses } from "@/services/freeUsageService";
import { errorText, trackFunnel } from "@/services/funnelService";
import { profileService } from "@/services/profileService";
import { useAuthStore } from "@/stores/authStore";
import {
  ENTITLEMENT_PRO,
  PACKAGE_ANNUAL,
  PACKAGE_MONTHLY,
  useSubscriptionStore,
} from "@/stores/subscriptionStore";
import { colour, radius, space, typography } from "@/tokens";
import type { Profile } from "@/types/database";
import * as Sentry from "@sentry/react-native";
import * as Haptics from "expo-haptics";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  InteractionManager,
  Platform,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { type PurchasesPackage } from "react-native-purchases";
import { SafeAreaView } from "react-native-safe-area-context";

type Plan = "monthly" | "annual";

const FEATURES = [
  "Unlimited receipt scanning",
  "Unlimited mileage trips and logbook",
  "Tax-ready reports by expense type",
  "Unlimited exports, anytime",
];

// Shown only until the store prices load. Must match the real Play Console /
// App Store Connect prices: R99/month, R1,099/year.
const FALLBACK_PRICE: Record<Plan, string> = { monthly: "R99", annual: "R1,099" };

// The webhook syncs profiles.subscription shortly after a purchase, not at the
// same moment, check once now and once more after a short wait.
async function syncPremiumStatus(): Promise<void> {
  await useAuthStore.getState().refreshPremiumStatus().catch(() => {});
  if (!useAuthStore.getState().hasPaidSubscription) {
    await new Promise((resolve) => setTimeout(resolve, 2000));
    await useAuthStore.getState().refreshPremiumStatus().catch(() => {});
  }
}

// Pro access comes from Supabase, not RevenueCat. If the store still has a
// subscription running but Pro is off (e.g. after a refund), it won't sell the
// same subscription again, send them to the store instead.
function showStillInStoreNotice() {
  const info = useSubscriptionStore.getState().customerInfo;
  const storeName = storeNameFor(info);
  const ent = info?.entitlements?.active?.[ENTITLEMENT_PRO];
  // Cancelled (or refunded) in the store: it can't be turned back on there,
  // and the store won't sell it again until the old one runs out.
  if (ent && !ent.willRenew) {
    const ends = formatDate(ent.expirationDate);
    showNotice({
      title: "You can buy Pro again soon",
      message: `Your old MyExpense subscription in ${storeName} is cancelled${
        ends ? ` and ends on ${ends}` : ""
      }. ${storeLabel(storeName)} won't let you buy it again until then. After that date, you can upgrade here.`,
      tone: "info",
      icon: "calendar",
      confirmLabel: "OK",
    });
    return;
  }
  showNotice({
    title: "Your subscription is still in the store",
    message: `Pro is off for this account, but ${storeName} still has a MyExpense subscription running, so you can't buy it again here. Open ${storeName} to check it. If you turn it back on there, Pro comes back here by itself.`,
    tone: "info",
    icon: "crown.fill",
    confirmLabel: `Go to ${storeName}`,
    cancelLabel: "Not now",
    onConfirm: () => openStoreSubscription(info),
  });
}

function formatDate(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("en-ZA", { day: "numeric", month: "long", year: "numeric" });
}

// "the App Store" reads badly on a button, drop the article there.
function storeLabel(storeName: string) {
  return storeName.replace(/^the /, "");
}

// ── Small building blocks ────────────────────────────────────────────────────

const cardStyle = {
  backgroundColor: colour.white,
  borderWidth: 1,
  borderColor: colour.surface2,
  borderRadius: radius.lg,
  shadowColor: colour.text,
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.06,
  shadowRadius: 2,
  elevation: 1,
} as const;

function Chip({ label, check }: { label: string; check?: boolean }) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: space.xs,
        backgroundColor: colour.background,
        borderWidth: 1,
        borderColor: colour.border,
        paddingVertical: space.xs,
        paddingHorizontal: 10,
        borderRadius: radius.pill,
      }}
    >
      {check && <IconSymbol name="checkmark" size={14} color={colour.textMid} />}
      <Text style={{ ...typography.labelM, fontFamily: typography.h1.fontFamily, color: colour.textMid }}>
        {label}
      </Text>
    </View>
  );
}

function ProgressBar({ fill }: { fill: number }) {
  const pct = Math.max(0, Math.min(1, fill)) * 100;
  return (
    <View style={{ height: 10, borderRadius: radius.pill, backgroundColor: colour.borderLight, overflow: "hidden" }}>
      <View style={{ width: `${pct}%`, height: 10, borderRadius: radius.pill, backgroundColor: colour.primary }} />
    </View>
  );
}

function InfoTile({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <View style={{ ...cardStyle, flex: 1, padding: 14, gap: space.xs }}>
      <Text style={{ ...typography.rowKey, fontFamily: typography.labelM.fontFamily, color: colour.textSub }}>{label}</Text>
      <Text style={{ ...typography.amountM, fontFamily: typography.h1.fontFamily, color: colour.text }} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      <Text style={{ ...typography.bodyS, color: colour.textSub }}>{sub}</Text>
    </View>
  );
}

function PlanOption({
  label,
  price,
  period,
  selected,
  onPress,
}: {
  label: string;
  price: string;
  period: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      style={{
        ...cardStyle,
        flex: 1,
        padding: 14,
        gap: space.xs,
        borderColor: selected ? colour.primary : colour.surface2,
        borderWidth: selected ? 1.5 : 1,
      }}
    >
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <Text style={{ ...typography.rowKey, fontFamily: typography.labelM.fontFamily, color: colour.textSub }}>{label}</Text>
        {selected ? (
          <View
            style={{
              width: 20,
              height: 20,
              borderRadius: 10,
              backgroundColor: colour.primary,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colour.white }} />
          </View>
        ) : (
          <View style={{ width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: colour.border }} />
        )}
      </View>
      <Text style={{ ...typography.amountM, fontFamily: typography.h1.fontFamily, color: colour.text }} numberOfLines={1} adjustsFontSizeToFit>
        {price}
      </Text>
      <Text style={{ ...typography.bodyS, color: colour.textSub }}>{period}</Text>
    </TouchableOpacity>
  );
}

function LinkButton({ label, onPress, disabled, tone = "primary" }: { label: string; onPress: () => void; disabled?: boolean; tone?: "primary" | "danger" }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
      style={{ height: 44, alignItems: "center", justifyContent: "center", opacity: disabled ? 0.4 : 1 }}
    >
      <Text style={{ ...typography.actionL, fontSize: 15, color: tone === "danger" ? colour.danger : colour.accentDeep }}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

// ── Screen ───────────────────────────────────────────────────────────────────

export function SubscriptionScreen({ defaultFrom }: { defaultFrom: string }) {
  const router = useRouter();
  const { user, isDevUser, hasPaidSubscription, isPromo, promoExpiresAt, billingIssueDetectedAt, refreshPremiumStatus } =
    useAuthStore();
  const { customerInfo, isPro, packages, loading, purchasePackage, restorePurchases, refresh } =
    useSubscriptionStore();

  const [selectedPlan, setSelectedPlan] = useState<Plan>("annual");
  const [usesSpent, setUsesSpent] = useState<number | null>(null);
  const [usesError, setUsesError] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);

  // ── Funnel tracking (free users only) ────────────────────────────────────
  // One paywall_viewed and one paywall_closed per visit. Android hardware back
  // and iOS swipe-back bypass the buttons, so anything unrecorded is "back".
  const params = useLocalSearchParams<{ from?: string }>();
  const from = (Array.isArray(params.from) ? params.from[0] : params.from) || defaultFrom;
  const tracked = useRef(!hasPaidSubscription && !isDevUser);
  const openedAt = useRef(Date.now());
  const viewedSent = useRef(false);
  const closeVia = useRef("back");
  const planRef = useRef(selectedPlan);
  planRef.current = selectedPlan;

  useEffect(() => {
    return () => {
      if (!tracked.current) return;
      if (!viewedSent.current) {
        trackFunnel("paywall_viewed", { from, prices_from_store: "pending" });
        logPaywallViewed(from);
      }
      trackFunnel("paywall_closed", {
        via: closeVia.current,
        seconds: Math.round((Date.now() - openedAt.current) / 1000),
        plan: planRef.current,
      });
    };
  }, []);

  // ── Load store + access state ────────────────────────────────────────────
  // Access state is otherwise only read at launch, so re-check it here. If the
  // store has a subscription running but Supabase says free, give the webhook
  // a moment to catch up before telling them.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      await Promise.all([
        refresh(hasPaidSubscription ? "subscription_manage" : "paywall").catch(console.warn),
        refreshPremiumStatus().catch(() => {}),
      ]);
      if (!cancelled && tracked.current && !viewedSent.current) {
        viewedSent.current = true;
        const loaded = useSubscriptionStore.getState().packages;
        const hasMonthly = loaded.some((p) => p.identifier === PACKAGE_MONTHLY);
        const hasAnnual = loaded.some((p) => p.identifier === PACKAGE_ANNUAL);
        trackFunnel("paywall_viewed", { from, prices_from_store: hasMonthly && hasAnnual });
        logPaywallViewed(from);
        if (!hasMonthly || !hasAnnual) {
          trackFunnel("paywall_prices_fallback", {
            from,
            missing: !hasMonthly && !hasAnnual ? "both" : !hasMonthly ? "monthly" : "annual",
          });
        }
      }
      const auth = useAuthStore.getState();
      if (cancelled || !useSubscriptionStore.getState().isPro || auth.hasPaidSubscription || auth.isDevUser) return;
      await syncPremiumStatus();
      if (cancelled || useAuthStore.getState().hasPaidSubscription) return;
      // A cancelled store subscription is explained on the card itself, only
      // pop up when one is still set to renew.
      const ent = useSubscriptionStore.getState().customerInfo?.entitlements?.active?.[ENTITLEMENT_PRO];
      if (ent?.willRenew) showStillInStoreNotice();
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Cancelling or renewing happens in the store, outside the app, re-check
  // on return so the dates and plan switch without a restart.
  useAppForeground(() => {
    refresh("subscription_manage_foreground").catch(console.warn);
    refreshPremiumStatus().catch(console.warn);
  });

  // Free uses: recounted on every visit, never cached, it must be current.
  const loadUsage = useCallback(() => {
    if (!user) return;
    countFreeUses(user.id)
      .then((n) => {
        setUsesSpent(n);
        setUsesError(false);
      })
      .catch(() => setUsesError(true));
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      loadUsage();
    }, [loadUsage]),
  );

  // Profile: subscription_expires_at fallback and promo_expires_at.
  useEffect(() => {
    if (!user) return;
    profileService
      .getProfile(user.id)
      .then((p) => setProfile(p))
      .catch(() => {});
  }, [user, hasPaidSubscription]);

  // ── Purchase / restore in progress ───────────────────────────────────────
  const [inFlight, setInFlight] = useState(false);

  // Notices go up only once any screen transition has settled.
  const notifyAfterInteractions = (notice: Parameters<typeof showNotice>[0]) => {
    InteractionManager.runAfterInteractions(() => {
      setTimeout(() => {
        Sentry.addBreadcrumb({ category: "paywall", message: "notice shown", data: { title: notice.title } });
        showNotice(notice);
      }, 300);
    });
  };

  // ── Derived data ─────────────────────────────────────────────────────────
  const monthlyPkg = packages.find((p) => p.identifier === PACKAGE_MONTHLY);
  const annualPkg = packages.find((p) => p.identifier === PACKAGE_ANNUAL);
  const priceFor = (plan: Plan) =>
    (plan === "monthly" ? monthlyPkg : annualPkg)?.product.priceString ?? FALLBACK_PRICE[plan];

  const entitlement = customerInfo?.entitlements?.active?.[ENTITLEMENT_PRO];
  const storeName = storeNameFor(customerInfo);
  const deviceStore = Platform.OS === "ios" ? "the App Store" : "Google Play";

  // Which plan they pay for: match the store product, else judge by the
  // length of the current billing period.
  const paidPlan: Plan | null = (() => {
    if (!entitlement) return null;
    // Android ids are "subscription:base-plan"; the entitlement may carry the
    // plan separately as productPlanIdentifier.
    const planPart = entitlement.productPlanIdentifier;
    const pid = planPart && !entitlement.productIdentifier.includes(":")
      ? `${entitlement.productIdentifier}:${planPart}`
      : entitlement.productIdentifier;
    if (monthlyPkg?.product.identifier === pid) return "monthly";
    if (annualPkg?.product.identifier === pid) return "annual";
    if (/year|annual/i.test(pid)) return "annual";
    if (/month/i.test(pid)) return "monthly";
    if (entitlement.latestPurchaseDate && entitlement.expirationDate) {
      const days =
        (new Date(entitlement.expirationDate).getTime() - new Date(entitlement.latestPurchaseDate).getTime()) / 86_400_000;
      return days > 60 ? "annual" : "monthly";
    }
    return null;
  })();

  const nextDateIso = entitlement?.expirationDate ?? profile?.subscription_expires_at ?? null;
  const nextDate = formatDate(nextDateIso);
  const willRenew = entitlement ? entitlement.willRenew : !profile?.refunded_at;

  // Store has it running but Supabase says Pro is off (e.g. after a refund).
  const storeOnlyPro = !isDevUser && isPro && !hasPaidSubscription;
  const promoEnds = formatDate(promoExpiresAt);

  const usesLeft = usesSpent === null ? null : Math.max(0, FREE_USE_LIMIT - usesSpent);

  // ── Actions ──────────────────────────────────────────────────────────────
  const handleBack = () => {
    closeVia.current = "close";
    safeBack(router, "/(tabs)/settings");
  };

  const handlePurchase = async () => {
    if (storeOnlyPro) {
      showStillInStoreNotice();
      return;
    }
    let pkg: PurchasesPackage | undefined = selectedPlan === "monthly" ? monthlyPkg : annualPkg;
    let retriedOfferings = false;
    if (!pkg) {
      // Offerings may have failed on open (no network, store hiccup), the
      // store never retries on its own, so fetch again before giving up.
      retriedOfferings = true;
      await refresh("paywall_retry").catch(() => {});
      const id = selectedPlan === "monthly" ? PACKAGE_MONTHLY : PACKAGE_ANNUAL;
      pkg = useSubscriptionStore.getState().packages.find((p) => p.identifier === id);
    }
    if (!pkg) {
      const storeError = useSubscriptionStore.getState().error;
      trackFunnel("prices_unavailable_shown", {
        plan: selectedPlan,
        error: storeError ? errorText(storeError) : null,
      });
      showNotice({
        title: "Couldn't load prices",
        message: "We couldn't reach the store. Check your internet connection and try again.",
        tone: "info",
      });
      return;
    }
    trackFunnel("purchase_started", {
      plan: selectedPlan,
      product_id: pkg.product.identifier,
      retried_offerings: retriedOfferings,
    });
    setInFlight(true);
    const success = await purchasePackage(pkg);
    if (!success) {
      setInFlight(false);
      const { error, alreadyOwned } = useSubscriptionStore.getState();
      if (alreadyOwned) showStillInStoreNotice();
      else if (error) showNotice({ title: "Payment didn't go through", message: error, tone: "info" });
      return;
    }
    await syncPremiumStatus();
    const paidNow = useAuthStore.getState().hasPaidSubscription;
    trackFunnel("pro_synced", { via: "purchase", is_premium: paidNow });
    Sentry.addBreadcrumb({ category: "paywall", message: "purchase success", data: { is_premium: paidNow } });
    closeVia.current = "purchased";
    setInFlight(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    notifyAfterInteractions({
      title: "Welcome to Pro!",
      message: "You can now use every MyExpense feature, as much as you like.",
      tone: "success",
      icon: "crown.fill",
      confirmLabel: "Let's go",
    });
  };

  const handleRestore = async () => {
    setInFlight(true);
    const restored = await restorePurchases();
    if (restored) {
      await syncPremiumStatus();
      const paidNow = useAuthStore.getState().hasPaidSubscription;
      trackFunnel("pro_synced", { via: "restore", is_premium: paidNow });
      trackFunnel("restore_result", { outcome: paidNow ? "restored" : "still_in_store" });
      setInFlight(false);
      if (!paidNow) {
        showStillInStoreNotice();
        return;
      }
      closeVia.current = "restored";
      notifyAfterInteractions({
        title: "Pro restored",
        message: "Your Pro subscription is back on.",
        tone: "success",
        icon: "crown.fill",
      });
    } else {
      setInFlight(false);
      const storeError = useSubscriptionStore.getState().error;
      trackFunnel("restore_result", {
        outcome: storeError ? "failed" : "nothing",
        ...(storeError ? { error: errorText(storeError) } : {}),
      });
      showNotice({
        title: "Nothing to restore",
        message: "We couldn't find a Pro subscription for this account.",
        tone: "info",
      });
    }
  };

  const handleManage = () => openStoreSubscription(customerInfo);

  // Apps can't cancel store subscriptions, open this exact subscription in
  // the store, where cancelling is one tap. They keep Pro until the date.
  const handleCancel = () => {
    showNotice({
      title: "Cancel your subscription?",
      message: `We'll open ${storeName}, where you can cancel. You keep Pro${
        nextDate ? ` until ${nextDate}` : " until the end of the time you've paid for"
      }, and you won't be charged again.`,
      icon: "calendar",
      confirmLabel: `Go to ${storeLabel(storeName)}`,
      cancelLabel: "Keep Pro",
      destructive: true,
      onConfirm: handleManage,
    });
  };

  const selectPlan = (plan: Plan) => {
    trackFunnel("plan_selected", { plan });
    setSelectedPlan(plan);
  };

  const busy = loading || inFlight;

  // ── Pieces of copy that depend on the state ──────────────────────────────
  // Pro member view: paying (Supabase) or a dev account. Promo users get the
  // free plan view so they can upgrade.
  const showPro = hasPaidSubscription || isDevUser;
  const headline = isDevUser ? "You have developer access" : showPro ? "You're on Pro" : "You're on the free plan";

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: colour.background }}>
      <StatusBar barStyle="dark-content" backgroundColor={colour.background} />

      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          paddingHorizontal: space.xl,
          paddingTop: space.lg,
          paddingBottom: space.xxl,
          gap: space.xl,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: space.md, height: 48 }}>
          <TouchableOpacity
            onPress={handleBack}
            accessibilityLabel="Back"
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              borderWidth: 1,
              borderColor: colour.border,
              backgroundColor: colour.white,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <IconSymbol name="chevron.left" size={20} color={colour.text} />
          </TouchableOpacity>
          <Text style={{ ...typography.h2, color: colour.text }}>Subscription</Text>
        </View>

        <Text style={{ ...typography.h1, lineHeight: 30, color: colour.text }}>{headline}</Text>

        {/* Plan card */}
        <View style={{ ...cardStyle, padding: space.xl, gap: space.md }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <Text style={{ ...typography.rowKey, fontFamily: typography.labelM.fontFamily, color: colour.textSub }}>Your plan</Text>
            {isDevUser ? (
              <Chip label="Developer" check />
            ) : showPro ? (
              <Chip label="Paid" check />
            ) : isPromo ? (
              <Chip label="Free trial" />
            ) : (
              <Chip label="Free" />
            )}
          </View>

          {showPro ? (
            <>
              <Text style={{ ...typography.h1, fontSize: 22, lineHeight: 28, color: colour.text }}>Unlimited uses</Text>
              <ProgressBar fill={1} />
              <Text style={{ ...typography.bodyM, lineHeight: 21, color: colour.textSub }}>
                Scan, add, track and export as much as you need. Thank you for supporting MyExpense.
              </Text>
            </>
          ) : isPromo ? (
            <>
              <Text style={{ ...typography.h1, fontSize: 22, lineHeight: 28, color: colour.text }}>
                {promoEnds ? `Unlimited until ${promoEnds}` : "Unlimited for now"}
              </Text>
              <Text style={{ ...typography.bodyM, lineHeight: 21, color: colour.textSub }}>
                {`Your free Pro access ends on ${promoEnds ?? "the end of your trial"}. After that, the free plan gives you ${FREE_USE_LIMIT} uses in total${
                  usesSpent !== null ? `, and you've used ${usesSpent} so far` : ""
                }. Upgrade to keep unlimited use.`}
              </Text>
            </>
          ) : (
            <>
              {usesLeft === null ? (
                usesError ? (
                  <TouchableOpacity onPress={loadUsage} activeOpacity={0.7}>
                    <Text style={{ ...typography.h3, color: colour.text }}>{"Couldn't load your free uses"}</Text>
                    <Text style={{ ...typography.bodyM, color: colour.accentDeep, marginTop: space.xs }}>Tap to try again</Text>
                  </TouchableOpacity>
                ) : (
                  <View style={{ height: 28, justifyContent: "center", alignItems: "flex-start" }}>
                    <ActivityIndicator color={colour.primary} />
                  </View>
                )
              ) : (
                <Text style={{ ...typography.h1, fontSize: 22, lineHeight: 28, color: colour.text }}>
                  {usesLeft === 0
                    ? `You've used all ${FREE_USE_LIMIT} free uses`
                    : `${usesLeft} of ${FREE_USE_LIMIT} free ${usesLeft === 1 ? "use" : "uses"} left`}
                </Text>
              )}
              <ProgressBar fill={usesSpent === null ? 0 : usesSpent / FREE_USE_LIMIT} />
              <Text style={{ ...typography.bodyM, lineHeight: 21, color: colour.textSub }}>
                {storeOnlyPro
                  ? entitlement && !entitlement.willRenew
                    ? `Your old subscription in ${storeName} is cancelled${nextDate ? ` and ends on ${nextDate}` : ""}. You can buy Pro again here after that date.`
                    : `Pro is off, but ${storeName} still has a subscription running. Manage it there.`
                  :"Scans, expenses, trips, bank imports and exports all count. Free uses do not reset."}
              </Text>
            </>
          )}
        </View>

        {/* Features */}
        <View style={{ gap: space.md }}>
          <Text style={{ ...typography.h3, fontSize: 17, color: colour.text }}>
            {showPro ? "Your Pro plan includes" : "Pro gives you"}
          </Text>
          <View style={{ gap: 10 }}>
            {FEATURES.map((f) => (
              <View key={f} style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <IconSymbol name="checkmark" size={20} color={colour.primary} />
                <Text style={{ ...typography.bodyL, fontSize: 15, color: colour.text }}>{f}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Plans (free) / billing (paid) */}
        {storeOnlyPro ? (
          <View style={{ flexDirection: "row", gap: space.md }}>
            <InfoTile
              label={`In ${storeLabel(storeName)}`}
              value={paidPlan === "annual" ? "Annual" : paidPlan === "monthly" ? "Monthly" : "Pro"}
              sub={entitlement?.willRenew ? "Still renewing" : "Cancelled"}
            />
            <InfoTile
              label={entitlement?.willRenew ? "Renews" : "Ends"}
              value={nextDate ?? "Not available"}
              sub={entitlement?.willRenew ? "Manage it in the store" : "Buy Pro again after this"}
            />
          </View>
        ) : !showPro ? (
          <View style={{ flexDirection: "row", gap: space.md }}>
            <PlanOption
              label="Monthly"
              price={priceFor("monthly")}
              period="per month"
              selected={selectedPlan === "monthly"}
              onPress={() => selectPlan("monthly")}
            />
            <PlanOption
              label="Annual"
              price={priceFor("annual")}
              period="per year"
              selected={selectedPlan === "annual"}
              onPress={() => selectPlan("annual")}
            />
          </View>
        ) : isDevUser ? null : (
          <View style={{ flexDirection: "row", gap: space.md }}>
            <InfoTile
              label="Billing"
              value={paidPlan === "annual" ? "Annual" : paidPlan === "monthly" ? "Monthly" : "Pro"}
              sub={paidPlan ? `${priceFor(paidPlan)} per ${paidPlan === "annual" ? "year" : "month"}` : `Through ${storeLabel(storeName)}`}
            />
            <InfoTile
              label={willRenew ? "Next payment" : "Pro ends"}
              value={nextDate ?? (loading ? "Loading" : "Not available")}
              sub={
                billingIssueDetectedAt
                  ? "Payment didn't go through"
                  : willRenew
                  ? "Renews automatically"
                  : "Won't renew"
              }
            />
          </View>
        )}

        {billingIssueDetectedAt && entitlement && !isDevUser && (
          <Text style={{ ...typography.bodyM, color: colour.danger }}>
            {`Your last payment didn't go through. Update your payment details in ${storeName} to keep Pro.`}
          </Text>
        )}

        <View style={{ flexGrow: 1 }} />

        {/* Actions */}
        {!isDevUser && (
          <View style={{ gap: space.md }}>
            {!showPro && !storeOnlyPro ? (
              <TouchableOpacity
                onPress={handlePurchase}
                disabled={busy}
                activeOpacity={0.85}
                style={{
                  height: 56,
                  borderRadius: radius.pill,
                  backgroundColor: colour.primary,
                  alignItems: "center",
                  justifyContent: "center",
                  opacity: busy ? 0.6 : 1,
                }}
              >
                {busy ? (
                  <ActivityIndicator color={colour.onPrimary} />
                ) : (
                  <Text style={{ ...typography.btnL, fontSize: 17, fontFamily: typography.h2.fontFamily, color: colour.onPrimary }}>
                    Upgrade to Pro
                  </Text>
                )}
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={handleManage}
                activeOpacity={0.85}
                style={{
                  height: 56,
                  borderRadius: radius.pill,
                  borderWidth: 2,
                  borderColor: colour.primary,
                  backgroundColor: colour.white,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text style={{ ...typography.btnL, fontSize: 17, fontFamily: typography.h2.fontFamily, color: colour.accentDeep }}>
                  Manage on {storeLabel(storeName)}
                </Text>
              </TouchableOpacity>
            )}

            <LinkButton label="Restore purchases" onPress={handleRestore} disabled={busy} />

            {showPro && entitlement?.willRenew && (
              <LinkButton label="Cancel my subscription" onPress={handleCancel} tone="danger" />
            )}

            <Text style={{ ...typography.bodyS, color: colour.textSub, textAlign: "center" }}>
              Billed through {entitlement ? storeName : deviceStore}. Cancel anytime.
            </Text>

            {!showPro && !storeOnlyPro && (
              <Text style={{ ...typography.bodyS, color: colour.textSub, textAlign: "center", lineHeight: 18 }}>
                Renews automatically until cancelled. By upgrading you agree to our{" "}
                <Text style={{ color: colour.accentDeep, textDecorationLine: "underline" }} onPress={() => router.push("/terms" as any)}>
                  Terms
                </Text>{" "}
                and{" "}
                <Text style={{ color: colour.accentDeep, textDecorationLine: "underline" }} onPress={() => router.push("/privacy" as any)}>
                  Privacy Policy
                </Text>
                .
              </Text>
            )}
          </View>
        )}
      </ScrollView>

      <MXTabBar />
    </SafeAreaView>
  );
}
