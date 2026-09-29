import AsyncStorage from "@react-native-async-storage/async-storage";
import { MXHeader } from "@/components/MXHeader";
import { MXTabBar } from "@/components/MXTabBar";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { expenseService } from "@/services/expenseService";
import { profileService } from "@/services/profileService";
import { useAuthStore } from "@/stores/authStore";
import { useExpenseStore } from "@/stores/expenseStore";
import { floorRatio, useHomeOfficeStore } from "@/stores/homeOfficeStore";
import { logbookBusinessUse, useVehicleStore } from "@/stores/vehicleStore";
import type { MileageTrip } from "@/services/mileageService";
import { colour, radius, space, typography } from "@/tokens";
import { useFocusEffect, useRouter } from "expo-router";
import { useAppForeground } from "@/hooks/use-app-foreground";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const C = colour;

// ─── Category meta ────────────────────────────────────────────────────────────
// All colours now reference token values. Where no exact token exists for a
// unique categorical hue (e.g. purple for Education, orange for Marketing),
// we use the closest semantic token so the palette remains consistent and
// updatable from one place.
const CATEGORY_META: Record<
  string,
  { icon: string; color: string; itr12Code: string; deductiblePct?: number }
> = {
  "Travel & Transport":         { icon: "car.fill",             color: C.primary,      itr12Code: "S11(a)" },
  "Home Office":                { icon: "house.fill",           color: C.accentDeep,   itr12Code: "S11(a)" },
  "Equipment & Tools":          { icon: "wrench.fill",          color: C.midNavy2,     itr12Code: "S11(e)" },
  "Software & Subscriptions":   { icon: "gearshape.fill",       color: C.primary100,   itr12Code: "S11(a)" },
  "Meals & Entertainment":      { icon: "fork.knife",           color: C.warning,      itr12Code: "S11(a)", deductiblePct: 0.8 },
  "Professional Fees":          { icon: "doc.text.fill",        color: C.danger,       itr12Code: "S11(a)" },
  "Utilities":                  { icon: "bolt.fill",            color: C.primary200,   itr12Code: "S11(a)" },
  "Telephone & Internet":       { icon: "phone.fill",           color: C.accent,       itr12Code: "S11(a)" },
  "Marketing & Advertising":    { icon: "megaphone.fill",       color: C.warning,      itr12Code: "S11(a)" },
  "Bank Charges":               { icon: "building.columns.fill",color: C.navyDark,     itr12Code: "S11(a)" },
  "Interest & Finance Charges": { icon: "percent",              color: C.brandTeal,    itr12Code: "S11(a)" },
  "Insurance":                  { icon: "shield.fill",          color: C.dangerMid,    itr12Code: "S11(a)" },
  "Rent":                       { icon: "building.2.fill",      color: C.accentSoft,   itr12Code: "S11(a)" },
  "Repairs & Maintenance":      { icon: "wrench.fill",          color: C.warning,      itr12Code: "S11(a)" },
  "Training & Education":       { icon: "book.fill",            color: C.accent,       itr12Code: "S11(a)" },
  "Vehicle Expenses":           { icon: "car.fill",             color: C.navyDark,     itr12Code: "Page 24" },
  "Retirement Annuity":         { icon: "chart.bar.fill",       color: C.primary300,   itr12Code: "S11F" },
  "Personal / Other":           { icon: "person.fill",          color: C.textDisabled, itr12Code: "N/A" },
};

const DEFAULT_META = { icon: "briefcase.fill", color: C.primary, itr12Code: "S11(a)" };

const fmt = (n: number) =>
  `R ${Number(n).toLocaleString("en-ZA", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;

type Filter = "All" | "Deductible" | "Personal";

export default function CategoryBreakdownScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { activeTaxYear } = useExpenseStore();
  const [loading, setLoading] = useState(true);
  const [breakdown, setBreakdown] = useState<Record<string, number>>({});
  const [totalDeductions, setTotalDeductions] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("All");

  // Vehicle logbook — the business-use % comes from the vehicles' opening and
  // closing odometer readings (vehicle_odometer_readings) once they exist.
  // Until then (e.g. mid-year, before the closing reading) the user can enter
  // an estimated total km, kept per tax year on the device as before.
  const [tripsForYear, setTripsForYear] = useState<MileageTrip[]>([]);
  const [totalKmStr, setTotalKmStr] = useState('');
  const totalKmKey = `@mx_total_km:${activeTaxYear}`;
  const { readings: odometerReadings, load: loadVehicles } = useVehicleStore();
  const businessKm = tripsForYear.reduce((s, t) => s + Number(t.distance_km), 0);
  const fromOdometer = logbookBusinessUse(tripsForYear, odometerReadings);
  const estimateTotalKm = parseFloat(totalKmStr);
  const vehicleRatio: number | null = fromOdometer
    ? fromOdometer.ratio
    : !isNaN(estimateTotalKm) && estimateTotalKm > 0 && businessKm > 0
      ? Math.min(businessKm / estimateTotalKm, 1)
      : null;

  // Home office — the real, single source of truth (also used by
  // add-expense-manual.tsx and home-office-setup.tsx). This panel used to
  // keep its own separate AsyncStorage figures, which meant it showed a
  // different ratio than the rest of the app and never affected real totals.
  const { setting: homeOfficeSetting, load: loadHomeOffice } = useHomeOfficeStore();
  useEffect(() => { if (user) loadHomeOffice(user.id); }, [user]);

  // Load persisted total km on mount / tax year change
  useEffect(() => {
    AsyncStorage.getItem(totalKmKey).then((v) => setTotalKmStr(v ?? ''));
  }, [totalKmKey]);

  // Fetch logbook trips + odometer readings when Vehicle Expenses is selected
  useEffect(() => {
    if (selected !== 'Vehicle Expenses' || !user) return;
    (async () => {
      try {
        const { mileageService } = await import('@/services/mileageService');
        const [trips] = await Promise.all([
          mileageService.getTrips(user.id, activeTaxYear),
          loadVehicles(user.id, activeTaxYear, true),
        ]);
        setTripsForYear(trips);
      } catch { /* non-fatal */ }
    })();
  }, [selected, user, activeTaxYear]);

  // Persist the computed business-use % so add-expense-manual.tsx can
  // suggest it as a default when logging new Vehicle Expenses — this is
  // what actually wires the calculator into real deduction totals, since
  // the ratio is applied at entry time (same pattern as Telephone/Insurance/
  // Home Office) rather than retroactively rewriting saved expense amounts.
  useEffect(() => {
    if (vehicleRatio == null || vehicleRatio <= 0) return;
    const pct = Math.round(vehicleRatio * 100);
    AsyncStorage.setItem(`@mx_vehicle_business_pct:${activeTaxYear}`, String(pct));
  }, [vehicleRatio, activeTaxYear]);

  const loadData = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    setLoading(true);
    try {
      const profile = await profileService.getProfile(user.id);
      const vatRegistered = profile?.vat_registered ?? false;
      const [byCategory, totals] = await Promise.all([
        expenseService.getByCategory(user.id, activeTaxYear, vatRegistered),
        expenseService.getTotals(user.id, activeTaxYear, vatRegistered),
      ]);
      setBreakdown(byCategory);
      setTotalDeductions(totals.totalDeductions);
    } catch (e) {
      console.error("CategoryBreakdown load error:", e);
    } finally {
      setLoading(false);
    }
  }, [user, activeTaxYear]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData]),
  );
  useAppForeground(loadData);

  const categories = Object.entries(breakdown)
    .map(([name, amount]) => {
      const meta = CATEGORY_META[name] ?? DEFAULT_META;
      return {
        name,
        amount,
        ...meta,
        deductible: name !== "Personal / Other",
      };
    })
    .sort((a, b) => b.amount - a.amount);

  const filtered = categories.filter((c) => {
    if (filter === "Deductible") return c.deductible;
    if (filter === "Personal") return !c.deductible;
    return true;
  });

  const totalSpend = categories.reduce((s, c) => s + c.amount, 0);
  const selectedCat = categories.find((c) => c.name === selected);

  return (
    <SafeAreaView
      edges={["top"]}
      style={{ flex: 1, backgroundColor: C.background }}
    >
      <StatusBar barStyle="dark-content" backgroundColor={C.background} />
      <MXHeader
        title="Category breakdown"
        subtitle={`SARS ITR12 · Tax Year ${activeTaxYear}`}
        showBack
        backLabel="Tax & ITR12"
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
      <ScrollView
        style={{ flex: 1, backgroundColor: C.background }}
        contentContainerStyle={{ paddingBottom: 30 }}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={{ alignItems: "center", paddingTop: space["4xl"] }}>
            <ActivityIndicator color={C.primary} size="large" />
          </View>
        ) : (
          <>
            {/* ── Summary row ──────────────────────────────────────────────── */}
            <View
              style={{
                flexDirection: "row",
                paddingHorizontal: space.md,
                paddingTop: space.lg,
                gap: space.sm,
                marginBottom: space.md,
              }}
            >
              <View
                style={{
                  flex: 1,
                  backgroundColor: C.primary,
                  borderRadius: radius.md,
                  padding: space.md,
                }}
              >
                <Text
                  style={{
                    ...typography.caption,
                    color: "rgba(255,255,255,0.7)",
                  }}
                >
                  Total spend
                </Text>
                <Text
                  style={{
                    ...typography.amountS,
                    color: C.onPrimary,
                    marginTop: 4,
                  }}
                >
                  {fmt(totalSpend)}
                </Text>
              </View>
              <View
                style={{
                  flex: 1,
                  backgroundColor: C.white,
                  borderRadius: radius.md,
                  padding: space.md,
                  borderWidth: 1,
                  borderColor: C.border,
                }}
              >
                <Text
                  style={{ ...typography.caption, color: C.textSecondary }}
                >
                  Deductible
                </Text>
                <Text
                  style={{
                    ...typography.amountS,
                    color: C.success,
                    marginTop: 4,
                  }}
                >
                  {fmt(totalDeductions)}
                </Text>
              </View>
            </View>

            {/* ── Filter tabs ───────────────────────────────────────────────── */}
            <View
              style={{ paddingHorizontal: space.md, marginBottom: space.md }}
            >
              <View
                style={{
                  flexDirection: "row",
                  backgroundColor: C.bgCard,
                  borderRadius: radius.md,
                  padding: 3,
                  borderWidth: 1,
                  borderColor: C.border,
                }}
              >
                {(["All", "Deductible", "Personal"] as Filter[]).map((f) => (
                  <TouchableOpacity
                    key={f}
                    onPress={() => setFilter(f)}
                    style={{
                      flex: 1,
                      paddingVertical: 7,
                      borderRadius: radius.sm,
                      backgroundColor:
                        filter === f ? C.primary : "transparent",
                      alignItems: "center",
                    }}
                  >
                    <Text
                      style={{
                        ...typography.labelS,
                        color: filter === f ? C.onPrimary : C.textSecondary,
                      }}
                    >
                      {f}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* ── Selected category detail panel ────────────────────────────── */}
            {selectedCat && (
              <View
                style={{
                  marginHorizontal: space.md,
                  backgroundColor: C.primary,
                  borderRadius: radius.md,
                  padding: space.md,
                  marginBottom: space.md,
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginBottom: space.sm,
                  }}
                >
                  <IconSymbol name={selectedCat.icon as any} size={24} color={C.onPrimary} style={{ marginRight: space.sm } as any} />
                  <Text
                    style={{
                      ...typography.labelM,
                      color: C.onPrimary,
                      flex: 1,
                    }}
                  >
                    {selectedCat.name}
                  </Text>
                  <TouchableOpacity onPress={() => setSelected(null)}>
                    <IconSymbol name="xmark" size={16} color="rgba(255,255,255,0.5)" />
                  </TouchableOpacity>
                </View>
                <View style={{ flexDirection: "row", gap: space.lg }}>
                  {[
                    { l: "Total spend", v: fmt(selectedCat.amount) },
                    {
                      l: "Status",
                      v: selectedCat.deductible ? "Deductible" : "Non-deductible",
                    },
                    { l: "ITR12 code", v: selectedCat.itr12Code },
                  ].map((s, i) => (
                    <View key={i}>
                      <Text
                        style={{
                          ...typography.micro,
                          color: "rgba(255,255,255,0.6)",
                        }}
                      >
                        {s.l}
                      </Text>
                      <Text
                        style={{
                          ...typography.labelS,
                          color: C.onPrimary,
                          marginTop: 2,
                        }}
                      >
                        {s.v}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* ── Meals & Entertainment 80% cap notice ─────────────────────── */}
            {selected === 'Meals & Entertainment' && selectedCat && (
              <View style={{ marginHorizontal: space.md, backgroundColor: C.warning + "38", borderRadius: radius.md, padding: space.md, marginBottom: space.md }}>
                <Text style={{ ...typography.labelS, color: C.text, marginBottom: space.xs }}>
                  SARS S23(o) — 80% cap applies
                </Text>
                <Text style={{ ...typography.micro, color: C.textSecondary, marginBottom: space.sm }}>
                  Only 80% of meals & entertainment is deductible. SARS disallows the remainder under S23(o).
                </Text>
                <View style={{ flexDirection: 'row', gap: space.xl }}>
                  <View>
                    <Text style={{ ...typography.micro, color: C.textHint }}>Total spend</Text>
                    <Text style={{ ...typography.labelM, color: C.textPrimary }}>{fmt(selectedCat.amount / 0.8)}</Text>
                  </View>
                  <View>
                    <Text style={{ ...typography.micro, color: C.textHint }}>Deductible (80%)</Text>
                    <Text style={{ ...typography.labelM, color: C.accentDeep }}>{fmt(selectedCat.amount)}</Text>
                  </View>
                </View>
              </View>
            )}

            {/* ── Vehicle Expenses logbook panel ───────────────────────────── */}
            {selected === 'Vehicle Expenses' && selectedCat && (
              <View style={{ marginHorizontal: space.md, backgroundColor: C.white, borderRadius: radius.md, padding: space.md, marginBottom: space.md, borderWidth: 1, borderColor: C.border }}>
                <Text style={{ ...typography.labelM, color: C.textPrimary, marginBottom: space.xs }}>
                  Logbook deduction calculator
                </Text>
                <Text style={{ ...typography.micro, color: C.textSecondary, marginBottom: space.sm }}>
                  You claim the work share of your vehicle costs: your work km compared to all your km
                </Text>
                {fromOdometer ? (
                  <View style={{ flexDirection: 'row', gap: space.md, marginBottom: space.sm }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ ...typography.micro, color: C.textHint, marginBottom: 4 }}>Work km (logbook)</Text>
                      <Text style={{ ...typography.labelM, color: C.primary }}>{fromOdometer.businessKm.toFixed(1)} km</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ ...typography.micro, color: C.textHint, marginBottom: 4 }}>Total km (from your km readings)</Text>
                      <Text style={{ ...typography.labelM, color: C.textPrimary }}>{fromOdometer.totalKm.toFixed(1)} km</Text>
                    </View>
                  </View>
                ) : (
                  <>
                    <View style={{ flexDirection: 'row', gap: space.md, marginBottom: space.sm }}>
                      <View style={{ flex: 1 }}>
                        <Text style={{ ...typography.micro, color: C.textHint, marginBottom: 4 }}>Work km (GPS tracked)</Text>
                        <Text style={{ ...typography.labelM, color: C.primary }}>{businessKm.toFixed(1)} km</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ ...typography.micro, color: C.textHint, marginBottom: 4 }}>Total km (estimate)</Text>
                        <TextInput
                          value={totalKmStr}
                          onChangeText={setTotalKmStr}
                          onBlur={() => AsyncStorage.setItem(totalKmKey, totalKmStr)}
                          keyboardType="numeric"
                          placeholder="e.g. 15000"
                          placeholderTextColor={C.textHint}
                          style={{ borderWidth: 1, borderColor: C.border, borderRadius: radius.sm, paddingHorizontal: space.sm, paddingVertical: 6, fontSize: 14, color: C.textPrimary }}
                        />
                      </View>
                    </View>
                    <TouchableOpacity onPress={() => router.push('/vehicles')} style={{ marginBottom: space.sm }}>
                      <Text style={{ ...typography.micro, color: C.primary, fontWeight: '600' }}>
                        Add your start and end of year km readings →
                      </Text>
                    </TouchableOpacity>
                  </>
                )}
                {(() => {
                  if (vehicleRatio == null || vehicleRatio <= 0) return null;
                  const ratio = vehicleRatio;
                  return (
                    <View style={{ backgroundColor: C.successBg, borderRadius: radius.sm, padding: space.sm }}>
                      <Text style={{ ...typography.micro, color: C.success }}>
                        Work use: {(ratio * 100).toFixed(1)}% · you can claim {fmt(selectedCat.amount)} so far this year
                      </Text>
                      <Text style={{ ...typography.micro, color: C.textSecondary, marginTop: 4 }}>
                        This % will be suggested automatically next time you log a Vehicle Expense — it only applies to expenses logged from now on, not ones already saved.
                      </Text>
                    </View>
                  );
                })()}
              </View>
            )}

            {/* ── Home Office m² panel ─────────────────────────────────────── */}
            {selected === 'Home Office' && selectedCat && (
              <View style={{ marginHorizontal: space.md, backgroundColor: C.white, borderRadius: radius.md, padding: space.md, marginBottom: space.md, borderWidth: 1, borderColor: C.border }}>
                <Text style={{ ...typography.labelM, color: C.textPrimary, marginBottom: space.xs }}>
                  Home office deduction
                </Text>
                <Text style={{ ...typography.micro, color: C.textSecondary, marginBottom: space.sm }}>
                  SARS S11(a): (office m² ÷ total property m²) × home costs
                </Text>
                {homeOfficeSetting && homeOfficeSetting.totalM2 > 0 ? (
                  <View style={{ backgroundColor: C.successBg, borderRadius: radius.sm, padding: space.sm }}>
                    <Text style={{ ...typography.micro, color: C.success }}>
                      Home office: {(floorRatio(homeOfficeSetting) * 100).toFixed(1)}% ({homeOfficeSetting.officeM2}m² ÷ {homeOfficeSetting.totalM2}m²) · claimable so far this year: {fmt(selectedCat.amount)}
                    </Text>
                    <TouchableOpacity onPress={() => router.push('/home-office-setup' as any)} style={{ marginTop: space.xs }}>
                      <Text style={{ ...typography.micro, color: C.primary, fontWeight: '600' }}>Edit room sizes</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={{ backgroundColor: C.warningLight, borderRadius: radius.sm, padding: space.sm }}>
                    <Text style={{ ...typography.micro, color: C.textSecondary, marginBottom: space.xs }}>
                      Home office size not set up yet.
                    </Text>
                    <TouchableOpacity onPress={() => router.push('/home-office-setup' as any)}>
                      <Text style={{ ...typography.micro, color: C.primary, fontWeight: '600' }}>Set up home office →</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}

            {/* ── Category list ─────────────────────────────────────────────── */}
            {filtered.length === 0 ? (
              <View style={{ alignItems: "center", paddingTop: space["4xl"] }}>
                <IconSymbol name="chart.bar.fill" size={40} color={C.textHint} style={{ marginBottom: space.md } as any} />
                <Text style={{ ...typography.h4, color: C.textPrimary }}>
                  No expenses yet
                </Text>
              </View>
            ) : (
              <View
                style={{
                  marginHorizontal: space.md,
                  backgroundColor: C.white,
                  borderRadius: radius.md,
                  overflow: "hidden",
                  borderWidth: 1,
                  borderColor: C.border,
                }}
              >
                {filtered.map((cat, i) => {
                  const barPct =
                    totalSpend > 0 ? (cat.amount / totalSpend) * 100 : 0;
                  return (
                    <TouchableOpacity
                      key={i}
                      onPress={() =>
                        setSelected(selected === cat.name ? null : cat.name)
                      }
                      style={{
                        paddingHorizontal: space.md,
                        paddingVertical: 13,
                        borderBottomWidth: i < filtered.length - 1 ? 1 : 0,
                        borderBottomColor: C.border,
                        backgroundColor:
                          selected === cat.name ? C.bgPage : C.white,
                      }}
                    >
                      {/* Row header */}
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          marginBottom: 6,
                        }}
                      >
                        <View
                          style={{
                            width: 10,
                            height: 10,
                            borderRadius: 3,
                            backgroundColor: cat.color,
                            marginRight: space.sm,
                          }}
                        />
                        <Text
                          style={{
                            ...typography.labelM,
                            color: C.textPrimary,
                            flex: 1,
                          }}
                        >
                          {cat.name}
                        </Text>
                        <Text
                          style={{
                            ...typography.labelM,
                            color: cat.deductible
                              ? C.primary
                              : C.textSecondary,
                          }}
                        >
                          {fmt(cat.amount)}
                        </Text>
                      </View>

                      {/* Badges row */}
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          marginBottom: 6,
                        }}
                      >
                        <Text
                          style={{
                            ...typography.micro,
                            color: C.textSecondary,
                            marginRight: space.sm,
                          }}
                        >
                          ITR12 {cat.itr12Code}
                        </Text>
                        <View
                          style={{
                            backgroundColor: cat.deductible
                              ? C.successBg
                              : C.bgPage,
                            borderRadius: 6,
                            paddingHorizontal: 6,
                            paddingVertical: 2,
                          }}
                        >
                          <Text
                            style={{
                              fontSize: 9,
                              fontWeight: "700",
                              color: cat.deductible
                                ? C.success
                                : C.textSecondary,
                            }}
                          >
                            {cat.deductible ? "Deductible" : "Non-deductible"}
                          </Text>
                        </View>
                        {cat.deductiblePct !== undefined && cat.deductiblePct < 1 && (
                          <View style={{ backgroundColor: C.warningBg, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2, marginLeft: 4 }}>
                            <Text style={{ fontSize: 9, fontWeight: "700", color: C.warning }}>
                              {Math.round(cat.deductiblePct * 100)}% cap
                            </Text>
                          </View>
                        )}
                      </View>

                      {/* Progress bar */}
                      <View
                        style={{
                          height: 4,
                          backgroundColor: C.bgPage,
                          borderRadius: 2,
                        }}
                      >
                        <View
                          style={{
                            width: `${barPct}%`,
                            height: 4,
                            backgroundColor: cat.color,
                            borderRadius: 2,
                            opacity: 0.7,
                          }}
                        />
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {/* ── Footer nav ────────────────────────────────────────────────── */}
            <TouchableOpacity
              onPress={() => router.push("/deductibility-guide")}
              style={{
                margin: space.md,
                backgroundColor: C.bgCard,
                borderRadius: radius.md,
                padding: space.md,
                flexDirection: "row",
                alignItems: "center",
                borderWidth: 1,
                borderColor: C.border,
              }}
            >
              <IconSymbol name="books.vertical.fill" size={18} color={C.primary} style={{ marginRight: space.sm } as any} />
              <Text
                style={{
                  ...typography.labelM,
                  color: C.textPrimary,
                  flex: 1,
                }}
              >
                View deductibility guide
              </Text>
              <Text style={{ color: C.textSecondary, fontSize: 16 }}>›</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
      </KeyboardAvoidingView>
      <MXTabBar />
    </SafeAreaView>
  );
}
