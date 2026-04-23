import AsyncStorage from "@react-native-async-storage/async-storage";
import { MXHeader } from "@/components/MXHeader";
import { MXTabBar } from "@/components/MXTabBar";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { expenseService } from "@/services/expenseService";
import { useAuthStore } from "@/stores/authStore";
import { useExpenseStore } from "@/stores/expenseStore";
import { colour, radius, space, typography } from "@/tokens";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
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
  "Home Office":                { icon: "house.fill",           color: C.teal,         itr12Code: "S11(a)" },
  "Equipment & Tools":          { icon: "wrench.fill",          color: C.midNavy2,     itr12Code: "S11(e)" },
  "Software & Subscriptions":   { icon: "gearshape.fill",       color: C.success,      itr12Code: "S11(a)" },
  "Meals & Entertainment":      { icon: "fork.knife",           color: C.warning,      itr12Code: "S11(a)", deductiblePct: 0.8 },
  "Professional Fees":          { icon: "doc.text.fill",        color: C.danger,       itr12Code: "S11(a)" },
  "Utilities":                  { icon: "bolt.fill",            color: C.teal,         itr12Code: "S11(a)" },
  "Telephone & Cell":           { icon: "phone.fill",           color: C.accent,       itr12Code: "S11(a)" },
  "Marketing & Advertising":    { icon: "megaphone.fill",       color: C.warningMid,   itr12Code: "S11(a)" },
  "Bank Charges":               { icon: "building.columns.fill",color: C.navyDark,     itr12Code: "S11(a)" },
  "Insurance":                  { icon: "shield.fill",          color: C.successMid,   itr12Code: "S11(a)" },
  "Rent":                       { icon: "building.2.fill",      color: C.info,         itr12Code: "S11(a)" },
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

  // Vehicle logbook
  const [businessKm, setBusinessKm] = useState(0);
  const [totalKmStr, setTotalKmStr] = useState('');

  // Home office
  const [officeSqmStr, setOfficeSqmStr] = useState('');
  const [propertySqmStr, setPropertySqmStr] = useState('');

  // Load persisted values from AsyncStorage on mount
  useEffect(() => {
    AsyncStorage.multiGet(['@mx_total_km', '@mx_office_sqm', '@mx_property_sqm']).then(pairs => {
      setTotalKmStr(pairs[0][1] ?? '');
      setOfficeSqmStr(pairs[1][1] ?? '');
      setPropertySqmStr(pairs[2][1] ?? '');
    });
  }, []);

  // Fetch GPS business km when Vehicle Expenses is selected
  useEffect(() => {
    if (selected !== 'Vehicle Expenses' || !user) return;
    (async () => {
      try {
        const { supabase } = await import('@/lib/supabase');
        const { data } = await supabase
          .from('mileage_trips')
          .select('distance_km')
          .eq('user_id', user.id)
          .eq('tax_year', activeTaxYear);
        const km = (data ?? []).reduce((s: number, t: any) => s + Number(t.distance_km), 0);
        setBusinessKm(km);
      } catch { /* non-fatal */ }
    })();
  }, [selected, user, activeTaxYear]);

  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [byCategory, totals] = await Promise.all([
        expenseService.getByCategory(user.id, activeTaxYear),
        expenseService.getTotals(user.id, activeTaxYear),
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
              <View style={{ marginHorizontal: space.md, backgroundColor: C.warningBg, borderRadius: radius.md, padding: space.md, marginBottom: space.md, borderWidth: 1, borderColor: C.warningMid }}>
                <Text style={{ ...typography.labelS, color: C.warning, marginBottom: space.xs }}>
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
                    <Text style={{ ...typography.labelM, color: C.success }}>{fmt(selectedCat.amount)}</Text>
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
                  SARS: (business km ÷ total km) × vehicle costs
                </Text>
                <View style={{ flexDirection: 'row', gap: space.md, marginBottom: space.sm }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ ...typography.micro, color: C.textHint, marginBottom: 4 }}>Business km (GPS tracked)</Text>
                    <Text style={{ ...typography.labelM, color: C.primary }}>{businessKm.toFixed(1)} km</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ ...typography.micro, color: C.textHint, marginBottom: 4 }}>Total km (annual odometer)</Text>
                    <TextInput
                      value={totalKmStr}
                      onChangeText={setTotalKmStr}
                      onBlur={() => AsyncStorage.setItem('@mx_total_km', totalKmStr)}
                      keyboardType="numeric"
                      placeholder="e.g. 15000"
                      placeholderTextColor={C.textHint}
                      style={{ borderWidth: 1, borderColor: C.border, borderRadius: radius.sm, paddingHorizontal: space.sm, paddingVertical: 6, fontSize: 14, color: C.textPrimary }}
                    />
                  </View>
                </View>
                {(() => {
                  const totalKm = parseFloat(totalKmStr);
                  if (!totalKmStr || isNaN(totalKm) || totalKm <= 0 || businessKm <= 0) return null;
                  const ratio = Math.min(businessKm / totalKm, 1);
                  return (
                    <View style={{ backgroundColor: C.successBg, borderRadius: radius.sm, padding: space.sm }}>
                      <Text style={{ ...typography.micro, color: C.success }}>
                        Business use: {(ratio * 100).toFixed(1)}% → Deductible: {fmt(selectedCat.amount * ratio)}
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
                  Home office deduction calculator
                </Text>
                <Text style={{ ...typography.micro, color: C.textSecondary, marginBottom: space.sm }}>
                  SARS S11(a): (office m² ÷ total property m²) × home costs
                </Text>
                <View style={{ flexDirection: 'row', gap: space.md, marginBottom: space.sm }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ ...typography.micro, color: C.textHint, marginBottom: 4 }}>Office area (m²)</Text>
                    <TextInput
                      value={officeSqmStr}
                      onChangeText={setOfficeSqmStr}
                      onBlur={() => AsyncStorage.setItem('@mx_office_sqm', officeSqmStr)}
                      keyboardType="numeric"
                      placeholder="e.g. 15"
                      placeholderTextColor={C.textHint}
                      style={{ borderWidth: 1, borderColor: C.border, borderRadius: radius.sm, paddingHorizontal: space.sm, paddingVertical: 6, fontSize: 14, color: C.textPrimary }}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ ...typography.micro, color: C.textHint, marginBottom: 4 }}>Total property (m²)</Text>
                    <TextInput
                      value={propertySqmStr}
                      onChangeText={setPropertySqmStr}
                      onBlur={() => AsyncStorage.setItem('@mx_property_sqm', propertySqmStr)}
                      keyboardType="numeric"
                      placeholder="e.g. 120"
                      placeholderTextColor={C.textHint}
                      style={{ borderWidth: 1, borderColor: C.border, borderRadius: radius.sm, paddingHorizontal: space.sm, paddingVertical: 6, fontSize: 14, color: C.textPrimary }}
                    />
                  </View>
                </View>
                {(() => {
                  const officeSqm = parseFloat(officeSqmStr);
                  const propertySqm = parseFloat(propertySqmStr);
                  if (!officeSqmStr || !propertySqmStr || isNaN(officeSqm) || isNaN(propertySqm) || propertySqm <= 0 || officeSqm <= 0) return null;
                  const ratio = Math.min(officeSqm / propertySqm, 1);
                  return (
                    <View style={{ backgroundColor: C.successBg, borderRadius: radius.sm, padding: space.sm }}>
                      <Text style={{ ...typography.micro, color: C.success }}>
                        Home office: {(ratio * 100).toFixed(1)}% → Deductible: {fmt(selectedCat.amount * ratio)}
                      </Text>
                    </View>
                  );
                })()}
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
      <MXTabBar />
    </SafeAreaView>
  );
}
