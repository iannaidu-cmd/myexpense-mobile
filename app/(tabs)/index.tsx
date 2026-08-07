import { AnnouncementModal } from "@/components/AnnouncementModal";
import MXLogo from "@/components/MXLogo";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { SA_MARGINAL_TAX_RATE } from "@/constants/tax";
import { expenseService } from "@/services/expenseService";
import { incomeService } from "@/services/incomeService";
import { profileService } from "@/services/profileService";
import { GRACE_PERIOD_DAYS, useAuthStore } from "@/stores/authStore";
import { useExpenseStore } from "@/stores/expenseStore";
import { colour, radius, space, typography } from "@/tokens";
import { Expense } from "@/types/database";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  AppState,
  Platform,
  RefreshControl,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const formatZAR = (amount: number) =>
  `R ${amount.toLocaleString("en-ZA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
  return date.toLocaleDateString("en-ZA", { day: "numeric", month: "short" });
};

// ── Once-off dashboard popups ─────────────────────────────────────────────────
// Two separate notices in chronological order. Dates + keys are specific to
// the current cycle and must be hand-updated (with bumped keys) each year:
// - period2: provisional tax period 2 for the 2026/27 tax year (see
//   lib/taxRules.ts and app/provisional-tax.tsx for the same figures).
// - taxSeasonOpen: SARS eFiling opening for the 2025/26 tax year (the one
//   that just ended) — this is a *different*, already-completed tax year
//   from the one period2 is tracking, which is why its date (13 Jul 2026)
//   falls before it rather than after.
// A "period1" notice (tax year started 1 Mar) used to exist here too, but
// was removed: every new user installing after 1 Mar sees it as already due,
// so it fired back-to-back with taxSeasonOpen on first launch for anyone
// who signs up after mid-year — not just a testing artifact.
type PopupKind = "taxSeasonOpen" | "period2" | "billingIssue";

// Module-level (not component state) so it survives the Home screen
// remounting within the same app run — e.g. navigating to another stack
// screen and back — without waiting on the AsyncStorage write in
// markPopupSeen to flush. AsyncStorage remains the source of truth across
// app restarts; this only closes the gap within a single session.
const dismissedThisSession = new Set<PopupKind>();

const TAX_SEASON_TRIGGER_DATE = new Date(2026, 6, 13); // 13 Jul 2026 — eFiling opens for manual submissions (not 1 Jul, which is only auto-assessment notices)
const TAX_SEASON_POPUP_KEY = "@myexpense:seen_tax_season_popup_v3_2026";

const PERIOD2_TRIGGER_DATE = new Date(2026, 8, 1); // 1 Sep 2026
const PERIOD2_POPUP_KEY = "@myexpense:seen_period2_popup_v2_2026";

// Keyed by the exact billing_issue_detected_at timestamp (not a static key
// like the two above) so a resolved-then-recurring billing issue re-shows
// the warning instead of staying silently suppressed by an old dismissal.
function billingIssuePopupKey(detectedAtIso: string): string {
  return `@myexpense:seen_billing_issue_popup:${detectedAtIso}`;
}

type PopupContent = {
  icon: string;
  iconColour: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  rows: { label: string; value: string }[];
  primaryLabel: string;
};

const POPUP_CONTENT: Record<Exclude<PopupKind, "billingIssue">, PopupContent> = {
  taxSeasonOpen: {
    icon: "doc.text.fill",
    iconColour: colour.primary,
    eyebrow: "Tax season 2026/27",
    title: "Tax season is open",
    subtitle: "SARS eFiling is open for manual submissions. Start on your ITR12 now, so October doesn't sneak up on you.",
    rows: [
      { label: "eFiling opened", value: "13 Jul 2026" },
      { label: "Non-provisional deadline", value: "23 Oct 2026" },
      { label: "Provisional & trusts deadline", value: "22 Jan 2027" },
    ],
    primaryLabel: "Start preparing",
  },
  period2: {
    icon: "calendar",
    iconColour: colour.warning,
    eyebrow: "Period 2 of 2",
    title: "Your second period has started",
    subtitle: "Halfway through the tax year. Keep logging so your next estimate stays accurate.",
    rows: [
      { label: "Track expenses from", value: "1 Sep 2026" },
      { label: "Track expenses until", value: "28 Feb 2027" },
      { label: "Pay your estimate by", value: "28 Feb 2027" },
    ],
    primaryLabel: "Continue tracking",
  },
};

// billingIssue's rows depend on billingIssueDetectedAt (when the card
// failure happened), so it can't live in the static POPUP_CONTENT table
// above — resolved at render/check time instead.
function getPopupContent(kind: PopupKind, billingIssueDetectedAt: string | null): PopupContent {
  if (kind !== "billingIssue") return POPUP_CONTENT[kind];

  const deadline = billingIssueDetectedAt
    ? new Date(new Date(billingIssueDetectedAt).getTime() + GRACE_PERIOD_DAYS * 86_400_000)
    : null;
  return {
    icon: "exclamationmark.triangle.fill",
    iconColour: colour.danger,
    eyebrow: "Payment issue",
    title: "We couldn't charge your card",
    subtitle: `Your last renewal payment didn't go through. Your Pro access keeps working for now — update your payment method before the deadline below to avoid losing it.`,
    rows: deadline
      ? [{ label: "Access blocked if unresolved by", value: deadline.toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" }) }]
      : [],
    primaryLabel: "Update payment method",
  };
}

function PeriodCard({ rows }: { rows: { label: string; value: string }[] }) {
  return (
    <View
      style={{
        borderRadius: 14,
        overflow: "hidden",
        marginBottom: 18,
        width: "100%",
        gap: 1,
      }}
    >
      {rows.map((row, i) => (
        <View
          key={i}
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "baseline",
            paddingVertical: 11,
            paddingHorizontal: 14,
            backgroundColor: colour.noir2,
          }}
        >
          <Text style={{ fontSize: 11.5, color: colour.onNoir2, fontWeight: "600" }}>
            {row.label}
          </Text>
          <Text style={{ fontSize: 12.5, color: colour.onNoir, fontWeight: "700", textAlign: "right" }}>
            {row.value}
          </Text>
        </View>
      ))}
    </View>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const { user, billingIssueDetectedAt } = useAuthStore();
  const { activeTaxYear } = useExpenseStore();

  const [firstName, setFirstName] = useState("");
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [totalDeductions, setTotalDeductions] = useState(0);
  const [totalIncome, setTotalIncome] = useState(0);
  const [recentExpenses, setRecentExpenses] = useState<Expense[]>([]);
  const [recentIncome, setRecentIncome] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showRefreshHint, setShowRefreshHint] = useState(false);
  const [duePopup, setDuePopup] = useState<PopupKind | null>(null);
  const isFetching = useRef(false);
  const hasLoaded = useRef(false);
  const appStateRef = useRef(AppState.currentState);

  const now = new Date();
  const hour = now.getHours();
  const dayName = DAY_NAMES[now.getDay()];
  const greeting = hour < 12 ? "Morning" : hour < 17 ? "Afternoon" : "Evening";
  const estimatedSaving = Math.round(totalDeductions * SA_MARGINAL_TAX_RATE);

  const loadData = useCallback(async (silent = false) => {
    if (!user) { setLoading(false); setRefreshing(false); return; }
    if (isFetching.current) return;
    isFetching.current = true;
    if (!silent) setLoading(true);
    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("timeout")), 25_000),
    );
    try {
      const [profile, totals, incomeTotals, recent, recentInc] = await Promise.race([
        Promise.all([
          profileService.getProfile(user.id),
          expenseService.getTotals(user.id, activeTaxYear),
          incomeService.getTotals(user.id, activeTaxYear),
          expenseService.getRecentExpenses(user.id, 5),
          incomeService.getRecentIncome(user.id, 5, activeTaxYear),
        ]),
        timeout,
      ]);
      if (profile?.full_name) setFirstName(profile.full_name.split(" ")[0]);
      setTotalExpenses(totals.totalExpenses);
      setTotalDeductions(totals.totalDeductions);
      setTotalIncome(incomeTotals.totalIncome);
      setRecentExpenses(recent);
      setRecentIncome(recentInc);
      hasLoaded.current = true;
      setShowRefreshHint(false);
    } catch (e) {
      console.warn("HomeScreen load error:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
      isFetching.current = false;
    }
  }, [user?.id, activeTaxYear]);

  // Fire when auth initialises (user changes null → User)
  useEffect(() => { loadData(); }, [loadData]);

  // Re-fire silently when tab gains focus — don't re-show spinner if data exists
  useFocusEffect(
    useCallback(() => { loadData(hasLoaded.current); }, [loadData])
  );

  // Show refresh hint + attempt auto-reload when app returns from background
  useEffect(() => {
    const sub = AppState.addEventListener('change', (next) => {
      if (appStateRef.current.match(/inactive|background/) && next === 'active') {
        setShowRefreshHint(true);
        loadData(true);
      }
      appStateRef.current = next;
    });
    return () => sub.remove();
  }, [loadData]);

  // Show each once-off popup at most once, gated by an AsyncStorage flag so
  // dismissing it (or reopening the app) never shows it again. Only ONE
  // <AnnouncementModal> is ever rendered — on Android, mounting a second
  // <Modal> while the first is closing caused touch events to bleed through
  // to the wrong popup's handler (the popup would flash and immediately
  // navigate using the *previous* popup's action). A single shared modal
  // whose content is keyed off `duePopup` makes that class of bug
  // structurally impossible.
  const checkDuePopup = useCallback(async (): Promise<PopupKind | null> => {
    // Billing issue checked first — a payment problem is more urgent/
    // actionable than the seasonal reminders below.
    if (billingIssueDetectedAt) {
      const seenBilling = await AsyncStorage.getItem(billingIssuePopupKey(billingIssueDetectedAt));
      if (!seenBilling) return "billingIssue";
    }
    const [seenTaxSeason, seenP2] = await Promise.all([
      AsyncStorage.getItem(TAX_SEASON_POPUP_KEY),
      AsyncStorage.getItem(PERIOD2_POPUP_KEY),
    ]);
    const now = new Date();
    // Checked in chronological trigger-date order: 13 Jul → 1 Sep.
    if (!seenTaxSeason && now >= TAX_SEASON_TRIGGER_DATE) return "taxSeasonOpen";
    if (!seenP2 && now >= PERIOD2_TRIGGER_DATE) return "period2";
    return null;
  }, [billingIssueDetectedAt]);

  useEffect(() => {
    if (!user) return;
    checkDuePopup().then((due) => {
      if (due && !dismissedThisSession.has(due)) setDuePopup((current) => current ?? due);
    });
    // authStore recreates the `user` object on every Supabase auth event
    // (token refresh, INITIAL_SESSION, ...), not just on real login/logout.
    // Depending on `user` here reran this check — and could re-summon an
    // already-dismissed popup — on refresh events unrelated to auth state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, checkDuePopup]);

  const markPopupSeen = useCallback(async (kind: PopupKind) => {
    if (kind === "billingIssue") {
      if (billingIssueDetectedAt) await AsyncStorage.setItem(billingIssuePopupKey(billingIssueDetectedAt), "1");
      return;
    }
    const key = kind === "period2" ? PERIOD2_POPUP_KEY : TAX_SEASON_POPUP_KEY;
    await AsyncStorage.setItem(key, "1");
  }, [billingIssueDetectedAt]);

  // Dismiss via X/backdrop — stays on the dashboard. If another popup is
  // already due, it opens after a short delay so the modal's close
  // animation finishes first instead of instantly swapping content.
  const dismissPopup = useCallback(() => {
    const kind = duePopup;
    setDuePopup(null);
    if (!kind) return;
    dismissedThisSession.add(kind);
    (async () => {
      await markPopupSeen(kind);
      const next = await checkDuePopup();
      if (next) setTimeout(() => setDuePopup(next), 400);
    })();
  }, [duePopup, markPopupSeen, checkDuePopup]);

  // billingIssue's primary action needs to navigate (to subscription
  // management) in addition to dismissing — the other two kinds just dismiss.
  const handlePopupPrimary = useCallback(() => {
    const kind = duePopup;
    dismissPopup();
    if (kind === "billingIssue") router.push("/subscription-manage" as any);
  }, [duePopup, dismissPopup, router]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setShowRefreshHint(false);
    loadData(true);
  }, [loadData]);

  const recentActivity = useMemo(() => {
    const expenses = recentExpenses.map(e => ({
      type: 'expense' as const,
      id: e.id,
      label: e.vendor,
      sublabel: e.category ?? "Expense",
      date: e.expense_date,
      amount: e.amount,
      isDeductible: e.is_deductible,
    }));
    const income = recentIncome.map(i => ({
      type: 'income' as const,
      id: i.id,
      label: i.source,
      sublabel: i.description ?? "Income",
      date: i.date,
      amount: i.amount,
      isDeductible: undefined,
    }));
    return [...expenses, ...income]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 6);
  }, [recentExpenses, recentIncome]);

  const cardShadow =
    Platform.OS === "ios"
      ? { shadowColor: "#0F0F1E", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3 }
      : { elevation: 1 };

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: colour.background }}>
      <StatusBar barStyle="dark-content" backgroundColor={colour.background} />

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 18, paddingTop: 8, paddingBottom: space.xxxl }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colour.primary}
            colors={[colour.primary]}
          />
        }
      >
        {/* ── Header row ── */}
        <View style={{
          flexDirection: "row", justifyContent: "space-between",
          alignItems: "center", marginBottom: 14, marginTop: 6,
        }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <View style={{
              width: 38, height: 38, borderRadius: 11,
              borderWidth: 1, borderColor: colour.borderLight,
              alignItems: "center", justifyContent: "center", overflow: "hidden",
            }}>
              <MXLogo size={26} variant="dark" />
            </View>
            <View>
              <Text style={{ fontSize: 11, color: colour.textSub, fontWeight: "500" }}>{dayName}</Text>
              <Text style={{ fontSize: 16, fontWeight: "700", color: colour.text, letterSpacing: -0.3, marginTop: 1 }}>
                {greeting}{firstName ? `, ${firstName}` : ""}
              </Text>
            </View>
          </View>

          {/* Bell button */}
          <TouchableOpacity
            onPress={() => router.push("/notifications-settings" as any)}
            style={{ position: "relative" }}
          >
            <View style={{
              width: 38, height: 38, borderRadius: 19,
              backgroundColor: colour.white, borderWidth: 1, borderColor: colour.borderLight,
              alignItems: "center", justifyContent: "center",
            }}>
              <IconSymbol name="bell.fill" size={16} color={colour.text} />
            </View>
          </TouchableOpacity>
        </View>

        {showRefreshHint && !loading && (
          <TouchableOpacity
            onPress={() => { setShowRefreshHint(false); loadData(false); }}
            activeOpacity={0.8}
            style={{
              flexDirection: "row", alignItems: "center", justifyContent: "center",
              gap: 6, backgroundColor: colour.primary, borderRadius: 20,
              paddingHorizontal: 16, paddingVertical: 8,
              alignSelf: "center", marginBottom: 12,
            }}
          >
            <IconSymbol name="arrow.clockwise" size={13} color={colour.white} />
            <Text style={{ color: colour.white, fontSize: 13, fontWeight: "600" }}>
              Tap to refresh
            </Text>
          </TouchableOpacity>
        )}

        {loading ? (
          <View style={{ alignItems: "center", paddingTop: space["5xl"] }}>
            <ActivityIndicator color={colour.primary} size="large" />
          </View>
        ) : (
          <>
            {/* ── Noir hero card ── */}
            <View style={{
              backgroundColor: colour.noir, borderRadius: radius.xl,
              padding: 24, paddingBottom: 28, marginBottom: 10, overflow: "hidden",
            }}>
              {/* Periwinkle blob top-right */}
              <View style={{
                position: "absolute", width: 200, height: 200, borderRadius: 100,
                backgroundColor: colour.primary, opacity: 0.55, top: -70, right: -50,
              }} />
              {/* Periwinkle blob bottom-left */}
              <View style={{
                position: "absolute", width: 120, height: 120, borderRadius: 60,
                backgroundColor: colour.primary, opacity: 0.25, bottom: -40, left: -20,
              }} />

              <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colour.primary }} />
                <Text style={{ fontSize: 12, color: colour.onNoir2, fontWeight: "500" }}>
                  Tax saved so far
                </Text>
              </View>

              <Text style={{ fontSize: 56, lineHeight: 58, letterSpacing: -2.5, fontWeight: "800", color: colour.onNoir, marginBottom: 6 }}>
                <Text style={{ color: colour.primary }}>R </Text>
                {Math.round(estimatedSaving).toLocaleString("en-ZA")}
              </Text>

              <Text style={{ fontSize: 12, color: colour.onNoir2, fontWeight: "400", marginBottom: 20, opacity: 0.7 }}>
                estimated tax refund · {activeTaxYear}
              </Text>

              <View style={{
                flexDirection: "row", paddingTop: 16,
                borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.10)",
              }}>
                <TouchableOpacity
                  style={{ flex: 1 }}
                  activeOpacity={0.75}
                  onPress={() => router.push("/income-history" as any)}
                >
                  <Text style={{ fontSize: 11, color: colour.onNoir2, fontWeight: "500", marginBottom: 6 }}>
                    Income
                  </Text>
                  <Text style={{ fontSize: 18, fontWeight: "700", color: colour.onNoir, letterSpacing: -0.5 }}>
                    {formatZAR(totalIncome)}
                  </Text>
                </TouchableOpacity>
                <View style={{ width: 1, backgroundColor: "rgba(255,255,255,0.10)" }} />
                <TouchableOpacity
                  style={{ flex: 1, paddingLeft: 16 }}
                  activeOpacity={0.75}
                  onPress={() => router.push("/expense-history" as any)}
                >
                  <Text style={{ fontSize: 11, color: colour.onNoir2, fontWeight: "500", marginBottom: 6 }}>
                    Expenses
                  </Text>
                  <Text style={{ fontSize: 18, fontWeight: "700", color: colour.onNoir, letterSpacing: -0.5 }}>
                    {formatZAR(totalExpenses)}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* ── Shortcut row ── */}
            <View style={{ flexDirection: "row", gap: 10, marginBottom: 10 }}>
              <TouchableOpacity
                onPress={() => router.push("/add-income" as any)}
                style={{
                  flex: 1, backgroundColor: colour.white, borderRadius: radius.md,
                  padding: 12, paddingHorizontal: 14, borderWidth: 1, borderColor: colour.borderLight,
                  flexDirection: "row", alignItems: "center", gap: 10, ...cardShadow,
                }}
              >
                <View style={{
                  width: 28, height: 28, borderRadius: 8,
                  backgroundColor: colour.successBg, alignItems: "center", justifyContent: "center",
                }}>
                  <Text style={{ fontSize: 14, color: colour.success }}>+</Text>
                </View>
                <Text style={{ fontSize: 13, fontWeight: "600", color: colour.text }}>Add income</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => router.push("/(tabs)/add-expense")}
                style={{
                  flex: 1, backgroundColor: colour.white, borderRadius: radius.md,
                  padding: 12, paddingHorizontal: 14, borderWidth: 1, borderColor: colour.borderLight,
                  flexDirection: "row", alignItems: "center", gap: 10, ...cardShadow,
                }}
              >
                <View style={{
                  width: 28, height: 28, borderRadius: 8,
                  backgroundColor: colour.primary50, alignItems: "center", justifyContent: "center",
                }}>
                  <Text style={{ fontSize: 14, color: colour.accentDeep }}>−</Text>
                </View>
                <Text style={{ fontSize: 13, fontWeight: "600", color: colour.text }}>Add expense</Text>
              </TouchableOpacity>
            </View>

            {/* ── Scan CTA banner ── */}
            <TouchableOpacity
              onPress={() => router.push("/scan-receipt-camera" as any)}
              style={{
                backgroundColor: colour.primary, borderRadius: radius.lg,
                paddingVertical: 28, paddingHorizontal: 18, flexDirection: "row",
                alignItems: "center", gap: 16, marginBottom: 14, overflow: "hidden",
              }}
            >
              <View style={{
                position: "absolute", width: 180, height: 180, borderRadius: 90,
                backgroundColor: "rgba(255,255,255,0.12)", top: -70, right: -50,
              }} />
              {/* Receipt illustration */}
              <View style={{
                width: 60, height: 64, alignItems: "center", justifyContent: "center",
              }}>
                {/* Receipt body */}
                <View style={{
                  width: 38, height: 48, backgroundColor: "rgba(255,255,255,0.95)",
                  borderRadius: 5, justifyContent: "center", alignItems: "center",
                  paddingHorizontal: 5,
                }}>
                  {/* Receipt lines */}
                  <View style={{ width: "80%", height: 2.5, backgroundColor: "rgba(107,106,216,0.4)", borderRadius: 2, marginBottom: 4 }} />
                  <View style={{ width: "60%", height: 2.5, backgroundColor: "rgba(107,106,216,0.25)", borderRadius: 2, marginBottom: 4 }} />
                  <View style={{ width: "80%", height: 2.5, backgroundColor: "rgba(107,106,216,0.25)", borderRadius: 2, marginBottom: 4 }} />
                  <View style={{ width: "50%", height: 2.5, backgroundColor: "rgba(107,106,216,0.4)", borderRadius: 2 }} />
                </View>
                {/* Scan corner brackets */}
                {/* top-left */}
                <View style={{ position: "absolute", top: 0, left: 2, width: 10, height: 10, borderTopWidth: 2.5, borderLeftWidth: 2.5, borderColor: colour.white, borderTopLeftRadius: 3 }} />
                {/* top-right */}
                <View style={{ position: "absolute", top: 0, right: 2, width: 10, height: 10, borderTopWidth: 2.5, borderRightWidth: 2.5, borderColor: colour.white, borderTopRightRadius: 3 }} />
                {/* bottom-left */}
                <View style={{ position: "absolute", bottom: 0, left: 2, width: 10, height: 10, borderBottomWidth: 2.5, borderLeftWidth: 2.5, borderColor: colour.white, borderBottomLeftRadius: 3 }} />
                {/* bottom-right */}
                <View style={{ position: "absolute", bottom: 0, right: 2, width: 10, height: 10, borderBottomWidth: 2.5, borderRightWidth: 2.5, borderColor: colour.white, borderBottomRightRadius: 3 }} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 18, fontWeight: "700", color: colour.onNoir, letterSpacing: -0.3 }}>
                  Scan a receipt
                </Text>
                <Text style={{ fontSize: 12, color: "rgba(255,255,255,0.85)", marginTop: 4, fontWeight: "500" }}>
                  Auto-filled in 2 seconds
                </Text>
              </View>
              <View style={{
                width: 34, height: 34, borderRadius: 17,
                backgroundColor: "rgba(255,255,255,0.20)", alignItems: "center", justifyContent: "center",
              }}>
                <Text style={{ color: colour.onNoir, fontSize: 18 }}>›</Text>
              </View>
            </TouchableOpacity>

            {/* ── Recent activity ── */}
            <View style={{
              flexDirection: "row", justifyContent: "space-between",
              alignItems: "baseline", marginBottom: 8, marginHorizontal: 2,
            }}>
              <Text style={{ fontSize: 14, fontWeight: "600", color: colour.text, letterSpacing: -0.2 }}>
                Recent
              </Text>
              <TouchableOpacity onPress={() => router.push("/expense-history" as any)}>
                <Text style={{ fontSize: 12, fontWeight: "600", color: colour.primary }}>See all</Text>
              </TouchableOpacity>
            </View>

            {recentActivity.length === 0 ? (
              <View style={{
                backgroundColor: colour.white, borderRadius: radius.md,
                borderWidth: 1, borderColor: colour.borderLight,
                padding: 24, alignItems: "center",
              }}>
                <IconSymbol name="doc.text.fill" size={28} color={colour.textHint} style={{ marginBottom: 8 } as any} />
                <Text style={{ ...typography.bodyS, color: colour.textSub, textAlign: "center" }}>
                  No activity yet.{"\n"}Add your first expense or income to get started.
                </Text>
              </View>
            ) : (
              recentActivity.map((item) => (
                <TouchableOpacity
                  key={`${item.type}-${item.id}`}
                  onPress={() => router.push(
                    item.type === 'income'
                      ? `/income-detail?id=${item.id}` as any
                      : `/expense-detail?id=${item.id}` as any
                  )}
                  style={{
                    backgroundColor: colour.white, borderRadius: radius.md,
                    borderWidth: 1, borderColor: colour.borderLight,
                    padding: 10, paddingHorizontal: 12,
                    flexDirection: "row", alignItems: "center", gap: 10,
                    marginBottom: 7, ...cardShadow,
                  }}
                >
                  <View style={{
                    width: 32, height: 32, borderRadius: 10,
                    backgroundColor: item.type === 'income' ? colour.successBg : colour.surface1,
                    alignItems: "center", justifyContent: "center",
                  }}>
                    {item.type === 'income' ? (
                      <IconSymbol name="arrow.down.circle.fill" size={16} color={colour.success} />
                    ) : (
                      <Text style={{ fontSize: 13, fontWeight: "600", color: colour.textMid }}>
                        {item.sublabel?.charAt(0)?.toUpperCase() ?? "?"}
                      </Text>
                    )}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 13, fontWeight: "600", color: colour.text }}>
                      {item.label}
                    </Text>
                    <Text style={{ fontSize: 11, color: colour.textSub, marginTop: 1, fontWeight: "500" }}>
                      {item.type === 'income' ? "Income" : item.sublabel} · {formatDate(item.date)}
                    </Text>
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={{ fontSize: 13, fontWeight: "700", color: item.type === 'income' ? colour.success : colour.text }}>
                      {item.type === 'income' ? "+" : ""}{formatZAR(item.amount)}
                    </Text>
                    {item.type === 'expense' && item.isDeductible && (
                      <Text style={{ fontSize: 11, color: colour.success, fontWeight: "500", marginTop: 1 }}>
                        deductible
                      </Text>
                    )}
                    {item.type === 'income' && (
                      <Text style={{ fontSize: 11, color: colour.success, fontWeight: "500", marginTop: 1 }}>
                        income
                      </Text>
                    )}
                  </View>
                </TouchableOpacity>
              ))
            )}

            {/* ── ITR12 Filing Season ── */}
            <TouchableOpacity
              onPress={() => router.push("/itr12-export-setup")}
              activeOpacity={0.85}
              style={{
                backgroundColor: colour.noir, borderRadius: radius.lg,
                padding: 16, paddingHorizontal: 18,
                flexDirection: "row", alignItems: "center", gap: 14,
                marginTop: space.md, overflow: "hidden",
              }}
            >
              <View style={{
                position: "absolute", width: 120, height: 120, borderRadius: 60,
                backgroundColor: colour.primary, opacity: 0.35, top: -40, right: -30,
              }} />
              <View style={{
                width: 42, height: 42, borderRadius: 12,
                backgroundColor: "rgba(255,255,255,0.15)",
                alignItems: "center", justifyContent: "center",
              }}>
                <IconSymbol name="doc.text.fill" size={20} color={colour.white} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 15, fontWeight: "700", color: colour.onNoir, letterSpacing: -0.3 }}>
                  ITR12 filing season
                </Text>
                <Text style={{ fontSize: 11, color: colour.onNoir2, marginTop: 2 }}>
                  {activeTaxYear} · Prepare your SARS-ready export
                </Text>
              </View>
              <View style={{
                width: 32, height: 32, borderRadius: 16,
                backgroundColor: "rgba(255,255,255,0.15)",
                alignItems: "center", justifyContent: "center",
              }}>
                <IconSymbol name="chevron.right" size={14} color={colour.white} />
              </View>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>

      {duePopup && (() => {
        const content = getPopupContent(duePopup, billingIssueDetectedAt);
        return (
          <AnnouncementModal
            visible
            icon={content.icon}
            iconColour={content.iconColour}
            eyebrow={content.eyebrow}
            title={content.title}
            subtitle={content.subtitle}
            primaryLabel={content.primaryLabel}
            onPrimary={handlePopupPrimary}
            secondaryLabel="Remind me later"
            onClose={dismissPopup}
          >
            {content.rows.length > 0 ? <PeriodCard rows={content.rows} /> : null}
          </AnnouncementModal>
        );
      })()}
    </SafeAreaView>
  );
}
