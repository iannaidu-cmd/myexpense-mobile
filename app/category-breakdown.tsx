import { MXHeader } from "@/components/MXHeader";
import { MXTabBar } from "@/components/MXTabBar";
import { expenseService } from "@/services/expenseService";
import { useAuthStore } from "@/stores/authStore";
import { useExpenseStore } from "@/stores/expenseStore";
import { colour, radius, space, typography } from "@/tokens";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StatusBar,
  Text,
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
  { icon: string; color: string; itr12Code: string }
> = {
  "Travel & Transport":         { icon: "🚗", color: C.primary,    itr12Code: "S11(a)" },
  "Home Office":                { icon: "🏠", color: C.teal,       itr12Code: "S11(a)" },
  "Equipment & Tools":          { icon: "🔧", color: C.midNavy2,   itr12Code: "S11(e)" },
  "Software & Subscriptions":   { icon: "💻", color: C.success,    itr12Code: "S11(a)" },
  "Meals & Entertainment":      { icon: "🍽",  color: C.warning,    itr12Code: "S11(a)" },
  "Professional Fees":          { icon: "📋", color: C.danger,     itr12Code: "S11(a)" },
  "Telephone & Cell":           { icon: "📱", color: C.accent,     itr12Code: "S11(a)" },
  "Marketing & Advertising":    { icon: "📣", color: C.warningMid, itr12Code: "S11(a)" },
  "Bank Charges":               { icon: "🏦", color: C.navyDark,   itr12Code: "S11(a)" },
  Insurance:                    { icon: "🛡️", color: C.successMid, itr12Code: "S11(a)" },
  Rent:                         { icon: "🏢", color: C.info,       itr12Code: "S11(a)" },
  "Repairs & Maintenance":      { icon: "🔨", color: C.warning,    itr12Code: "S11(a)" },
  Education:                    { icon: "📚", color: C.accent,     itr12Code: "S11(a)" },
  "Vehicle Expenses":           { icon: "🚙", color: C.navyDark,   itr12Code: "Page 24" },
  "Personal / Non-deductible":  { icon: "👤", color: C.textDisabled, itr12Code: "N/A" },
};

const DEFAULT_META = { icon: "💼", color: C.primary, itr12Code: "S11(a)" };

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
        deductible: name !== "Personal / Non-deductible",
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
      style={{ flex: 1, backgroundColor: C.primary }}
    >
      <StatusBar barStyle="light-content" backgroundColor={C.primary} />
      <MXHeader
        title="Category breakdown"
        subtitle={`SARS ITR12 · Tax Year ${activeTaxYear}`}
        showBack
        backLabel="Tax & ITR12"
      />

      <ScrollView
        style={{
          flex: 1,
          backgroundColor: C.bgPage,
          borderTopLeftRadius: radius.xl,
          borderTopRightRadius: radius.xl,
        }}
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
                  <Text style={{ fontSize: 24, marginRight: space.sm }}>
                    {selectedCat.icon}
                  </Text>
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
                    <Text
                      style={{ color: "rgba(255,255,255,0.5)", fontSize: 16 }}
                    >
                      ✕
                    </Text>
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

            {/* ── Category list ─────────────────────────────────────────────── */}
            {filtered.length === 0 ? (
              <View style={{ alignItems: "center", paddingTop: space["4xl"] }}>
                <Text style={{ fontSize: 40, marginBottom: space.md }}>📊</Text>
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
              <Text style={{ fontSize: 18, marginRight: space.sm }}>📖</Text>
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
