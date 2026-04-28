import { MXHeader } from "@/components/MXHeader";
import { MXTabBar } from "@/components/MXTabBar";
import { calculateAnnualMTC } from "@/constants/tax";
import { expenseService } from "@/services/expenseService";
import { incomeService } from "@/services/incomeService";
import { taxService } from "@/services/taxService";
import { useAuthStore } from "@/stores/authStore";
import { useExpenseStore } from "@/stores/expenseStore";
import { colour, radius, space } from "@/tokens";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
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

function StatCard({
  label,
  value,
  sub,
  color = colour.primary,
}: {
  label: string;
  value: string;
  sub?: string;
  color?: string;
}) {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colour.white,
        borderRadius: radius.md,
        padding: 14,
        borderWidth: 1,
        borderColor: colour.borderLight,
        margin: 5,
      }}
    >
      <Text style={{ fontSize: 11, color: colour.textHint, marginBottom: 4 }}>
        {label}
      </Text>
      <Text style={{ fontSize: 20, fontWeight: "800", color }}>{value}</Text>
      {sub ? (
        <Text style={{ fontSize: 10, color: colour.textHint, marginTop: 3 }}>
          {sub}
        </Text>
      ) : null}
    </View>
  );
}

function NavRow({
  icon,
  label,
  sub,
  onPress,
}: {
  icon: string;
  label: string;
  sub: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: space.md,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: colour.borderLight,
        backgroundColor: colour.white,
      }}
    >
      <View
        style={{
          width: 42,
          height: 42,
          borderRadius: 12,
          backgroundColor: colour.primary50,
          alignItems: "center",
          justifyContent: "center",
          marginRight: 14,
        }}
      >
        <Text style={{ fontSize: 20 }}>{icon}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 14, fontWeight: "600", color: colour.text }}>
          {label}
        </Text>
        <Text style={{ fontSize: 12, color: colour.textSub, marginTop: 2 }}>
          {sub}
        </Text>
      </View>
      <Text style={{ color: colour.primary, fontSize: 18 }}>›</Text>
    </TouchableOpacity>
  );
}

const fmt = (n: number) =>
  `R ${n.toLocaleString("en-ZA", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

const fmtPct = (n: number) => `${Math.round(n)}%`;

// SARS 2024/25 individual tax brackets (income year ending 28 Feb 2025)
function getMarginalRate(income: number): number {
  if (income <= 237100) return 0.18;
  if (income <= 370500) return 0.26;
  if (income <= 512800) return 0.31;
  if (income <= 673000) return 0.36;
  if (income <= 857900) return 0.39;
  if (income <= 1817000) return 0.41;
  return 0.45;
}

export default function TaxSummaryScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { activeTaxYear } = useExpenseStore();

  const [loading, setLoading] = useState(true);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [totalDeductions, setTotalDeductions] = useState(0);
  const [totalIncome, setTotalIncome] = useState(0);
  const [categoryBreakdown, setCategoryBreakdown] = useState<
    Record<string, number>
  >({});
  const [itr12Readiness, setItr12Readiness] = useState(0);
  const [medDependants, setMedDependants] = useState(0);

  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [expenseTotals, incomeTotals, breakdown, summary] =
        await Promise.all([
          expenseService.getTotals(user.id, activeTaxYear),
          incomeService.getTotals(user.id),
          expenseService.getByCategory(user.id, activeTaxYear),
          taxService.recalculateSummary(user.id, activeTaxYear),
        ]);

      setTotalExpenses(expenseTotals.totalExpenses);
      setTotalDeductions(expenseTotals.totalDeductions);
      setTotalIncome(incomeTotals.totalIncome);
      setCategoryBreakdown(breakdown);
      setItr12Readiness(summary.itr12_readiness_pct ?? 0);
    } catch (e) {
      console.error("TaxSummary load error:", e);
    } finally {
      setLoading(false);
    }
  }, [user, activeTaxYear]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData]),
  );

  const marginalRate = getMarginalRate(totalIncome);
  const estTaxSaving = Math.round(totalDeductions * marginalRate);

  const medAidInExpenses = categoryBreakdown["Medical Aid"] ?? 0;
  const annualMTC = calculateAnnualMTC(medDependants);

  // RA: total RA contributions from expenses, cap = 27.5% of income, max R350,000
  const raContributions = categoryBreakdown["Retirement Annuity"] ?? 0;
  const raCap = Math.min(Math.round(totalIncome * 0.275), 350000);
  const raDeductible = Math.min(raContributions, raCap);
  const deductionRate =
    totalExpenses > 0 ? Math.round((totalDeductions / totalExpenses) * 100) : 0;

  // Build category rows sorted by amount descending
  const categoryRows = Object.entries(categoryBreakdown)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8);
  const maxCatAmount = Math.max(...categoryRows.map(([, v]) => v), 1);

  return (
    <SafeAreaView
      edges={["top"]}
      style={{ flex: 1, backgroundColor: colour.background }}
    >
      <StatusBar barStyle="dark-content" backgroundColor={colour.background} />

      <MXHeader
        title="Tax summary"
        subtitle="Your ITR12 deduction overview"
        showBack
        backLabel="Tax & ITR12"
        right={
          <View
            style={{
              backgroundColor: "rgba(255,255,255,0.15)",
              borderRadius: 10,
              paddingHorizontal: 12,
              paddingVertical: 6,
            }}
          >
            <Text
              style={{
                color: colour.onPrimary,
                fontSize: 12,
                fontWeight: "600",
              }}
            >
              {activeTaxYear}
            </Text>
          </View>
        }
      />

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Content */}
        <View
          style={{
            backgroundColor: colour.background,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            paddingBottom: 30,
          }}
        >
          {loading ? (
            <View style={{ alignItems: "center", paddingTop: space["5xl"] }}>
              <ActivityIndicator color={colour.primary} size="large" />
            </View>
          ) : (
            <>
              {/* Key Stats */}
              <View
                style={{
                  flexDirection: "row",
                  flexWrap: "wrap",
                  paddingHorizontal: 11,
                  paddingTop: 16,
                  marginBottom: 8,
                }}
              >
                <StatCard
                  label="Total Deductions"
                  value={fmt(totalDeductions)}
                  sub="Deductible expenses"
                  color={colour.success}
                />
                <StatCard
                  label="Est. Tax Saving"
                  value={fmt(estTaxSaving)}
                  sub={`At ${Math.round(marginalRate * 100)}% marginal rate`}
                  color={colour.accent}
                />
                <StatCard
                  label="Total Expenses"
                  value={fmt(totalExpenses)}
                  sub="All categories"
                  color={colour.primary}
                />
                <StatCard
                  label="Total Income"
                  value={fmt(totalIncome)}
                  sub="All sources"
                  color={colour.teal}
                />
              </View>

              {/* eFiling disclaimer */}
              <View
                style={{
                  marginHorizontal: space.md,
                  backgroundColor: "#FFF8E1",
                  borderRadius: radius.md,
                  padding: 12,
                  marginBottom: space.md,
                  borderWidth: 1,
                  borderColor: "#FFE082",
                }}
              >
                <Text style={{ fontSize: 12, color: "#7B5800", lineHeight: 18 }}>
                  MyExpense prepares your ITR12 data. You must file via SARS eFiling or a registered tax practitioner — MyExpense does not submit to SARS on your behalf.
                </Text>
              </View>

              {/* Deduction rate bar */}
              <View
                style={{
                  marginHorizontal: space.md,
                  backgroundColor: colour.white,
                  borderRadius: radius.md,
                  padding: space.md,
                  borderWidth: 1,
                  borderColor: colour.borderLight,
                  marginBottom: space.md,
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    marginBottom: 8,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: "700",
                      color: colour.text,
                    }}
                  >
                    Deduction rate
                  </Text>
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: "700",
                      color: colour.primary,
                    }}
                  >
                    {fmtPct(deductionRate)}
                  </Text>
                </View>
                <View
                  style={{
                    height: 8,
                    backgroundColor: colour.surface2,
                    borderRadius: 4,
                    marginBottom: 6,
                  }}
                >
                  <View
                    style={{
                      width: `${deductionRate}%`,
                      height: 8,
                      backgroundColor: colour.primary,
                      borderRadius: 4,
                    }}
                  />
                </View>
                <Text style={{ fontSize: 11, color: colour.textSub }}>
                  {fmtPct(deductionRate)} of total spend is deductible
                </Text>
              </View>

              {/* ITR12 Readiness */}
              <View
                style={{
                  marginHorizontal: space.md,
                  backgroundColor: colour.white,
                  borderRadius: radius.md,
                  padding: space.md,
                  borderWidth: 1,
                  borderColor: colour.borderLight,
                  marginBottom: space.md,
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    marginBottom: 10,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: "700",
                      color: colour.text,
                    }}
                  >
                    ITR12 readiness
                  </Text>
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: "700",
                      color: colour.accent,
                    }}
                  >
                    {fmtPct(itr12Readiness)}
                  </Text>
                </View>
                <View
                  style={{
                    height: 8,
                    backgroundColor: colour.surface2,
                    borderRadius: 4,
                    marginBottom: 8,
                  }}
                >
                  <View
                    style={{
                      width: `${itr12Readiness}%`,
                      height: 8,
                      backgroundColor: colour.accent,
                      borderRadius: 4,
                    }}
                  />
                </View>
                <Text style={{ fontSize: 11, color: colour.textSub }}>
                  {itr12Readiness < 100
                    ? `${100 - Math.round(itr12Readiness)}% of expenses still need receipts attached`
                    : "All expenses have receipts — ready to export!"}
                </Text>
                <TouchableOpacity
                  onPress={() => router.push("/itr12-export-setup")}
                  style={{
                    marginTop: 12,
                    backgroundColor: colour.primary,
                    borderRadius: 10,
                    padding: 12,
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{
                      color: colour.onPrimary,
                      fontSize: 13,
                      fontWeight: "700",
                    }}
                  >
                    Prepare ITR12 export
                  </Text>
                </TouchableOpacity>
              </View>

              {/* SARS Key Dates */}
              <View
                style={{
                  marginHorizontal: space.md,
                  backgroundColor: colour.primary,
                  borderRadius: radius.md,
                  padding: space.md,
                  marginBottom: space.md,
                }}
              >
                <Text
                  style={{
                    color: colour.onPrimary,
                    fontSize: 13,
                    fontWeight: "700",
                    marginBottom: 12,
                  }}
                >
                  📅 SARS Key Dates — 2024/25
                </Text>
                {[
                  { label: "Tax year end", date: "28 Feb 2025", done: true },
                  { label: "eFiling opens", date: "1 Jul 2025", done: false },
                  {
                    label: "Non-provisional filing",
                    date: "21 Oct 2025",
                    done: false,
                  },
                  {
                    label: "Provisional (auto)",
                    date: "20 Jan 2026",
                    done: false,
                  },
                ].map((d, i) => (
                  <View
                    key={i}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      marginBottom: 8,
                    }}
                  >
                    <View
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: d.done
                          ? colour.successMid
                          : colour.accent,
                        marginRight: 10,
                      }}
                    />
                    <Text
                      style={{
                        flex: 1,
                        fontSize: 12,
                        color: d.done ? colour.primary200 : colour.onPrimary,
                      }}
                    >
                      {d.label}
                    </Text>
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: "600",
                        color: d.done ? colour.primary200 : colour.primary100,
                      }}
                    >
                      {d.date}
                    </Text>
                  </View>
                ))}
              </View>

              {/* Retirement Annuity */}
              {raContributions > 0 && (
                <View
                  style={{
                    marginHorizontal: space.md,
                    backgroundColor: colour.white,
                    borderRadius: radius.md,
                    padding: space.md,
                    borderWidth: 1,
                    borderColor: colour.borderLight,
                    marginBottom: space.md,
                  }}
                >
                  <Text style={{ fontSize: 13, fontWeight: "700", color: colour.text, marginBottom: 10 }}>
                    Retirement Annuity (S11F)
                  </Text>
                  {[
                    { label: "RA contributions", value: fmt(raContributions) },
                    { label: `Cap (27.5% of R${totalIncome.toLocaleString("en-ZA")}, max R350,000)`, value: fmt(raCap) },
                    { label: "Deductible amount", value: fmt(raDeductible) },
                  ].map((row, i) => (
                    <View key={i} style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}>
                      <Text style={{ fontSize: 12, color: colour.textSub, flex: 1, marginRight: 8 }} numberOfLines={2}>{row.label}</Text>
                      <Text style={{ fontSize: 12, fontWeight: "700", color: colour.primary }}>{row.value}</Text>
                    </View>
                  ))}
                  {raContributions > raCap && (
                    <Text style={{ fontSize: 11, color: "#BF360C", marginTop: 4 }}>
                      Contributions exceed your annual cap by {fmt(raContributions - raCap)}. The excess rolls over to the next tax year.
                    </Text>
                  )}
                </View>
              )}

              {/* Medical Aid Tax Credits */}
              {medAidInExpenses > 0 && (
                <View
                  style={{
                    marginHorizontal: space.md,
                    backgroundColor: colour.white,
                    borderRadius: radius.md,
                    padding: space.md,
                    borderWidth: 1,
                    borderColor: colour.borderLight,
                    marginBottom: space.md,
                  }}
                >
                  <Text style={{ fontSize: 13, fontWeight: "700", color: colour.text, marginBottom: 4 }}>
                    Medical Aid Tax Credits (S6A)
                  </Text>
                  <Text style={{ fontSize: 11, color: "#1B5E20", marginBottom: 12, backgroundColor: "#E8F5E9", borderRadius: 6, padding: 8 }}>
                    Medical Aid is a tax credit (reduces your tax bill directly), not a deduction from income. It is NOT included in your total deductions above.
                  </Text>
                  <Text style={{ fontSize: 12, color: colour.textSub, marginBottom: 8 }}>
                    Number of dependants (excluding yourself)
                  </Text>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 12 }}>
                    <TouchableOpacity
                      onPress={() => setMedDependants((v) => Math.max(0, v - 1))}
                      style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: colour.surface2, alignItems: "center", justifyContent: "center" }}
                    >
                      <Text style={{ fontSize: 18, color: colour.text }}>−</Text>
                    </TouchableOpacity>
                    <Text style={{ fontSize: 18, fontWeight: "700", color: colour.text, minWidth: 24, textAlign: "center" }}>{medDependants}</Text>
                    <TouchableOpacity
                      onPress={() => setMedDependants((v) => v + 1)}
                      style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: colour.surface2, alignItems: "center", justifyContent: "center" }}
                    >
                      <Text style={{ fontSize: 18, color: colour.text }}>+</Text>
                    </TouchableOpacity>
                  </View>
                  {[
                    { label: "Annual MTC (R364 + dependants × R246) × 12", value: fmt(annualMTC) },
                  ].map((row, i) => (
                    <View key={i} style={{ flexDirection: "row", justifyContent: "space-between" }}>
                      <Text style={{ fontSize: 12, color: colour.textSub, flex: 1, marginRight: 8 }} numberOfLines={2}>{row.label}</Text>
                      <Text style={{ fontSize: 14, fontWeight: "800", color: "#2E7D32" }}>{row.value}</Text>
                    </View>
                  ))}
                  <Text style={{ fontSize: 11, color: colour.textHint, marginTop: 6 }}>
                    Enter this amount on your ITR12 under "Medical tax credits" — do not include it in expense deductions.
                  </Text>
                </View>
              )}

              {/* Deductions by Category */}
              <View
                style={{
                  marginHorizontal: space.md,
                  backgroundColor: colour.white,
                  borderRadius: radius.md,
                  padding: space.md,
                  borderWidth: 1,
                  borderColor: colour.borderLight,
                  marginBottom: space.md,
                }}
              >
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: "700",
                    color: colour.text,
                    marginBottom: 14,
                  }}
                >
                  Deductions by category
                </Text>
                {categoryRows.length === 0 ? (
                  <Text
                    style={{
                      fontSize: 12,
                      color: colour.textSub,
                      textAlign: "center",
                      paddingVertical: space.lg,
                    }}
                  >
                    No deductible expenses yet. Add expenses to see the
                    breakdown.
                  </Text>
                ) : (
                  categoryRows.map(([category, amount], i) => (
                    <View key={i} style={{ marginBottom: 12 }}>
                      <View
                        style={{
                          flexDirection: "row",
                          justifyContent: "space-between",
                          marginBottom: 4,
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 12,
                            fontWeight: "600",
                            color: colour.text,
                            flex: 1,
                            marginRight: 8,
                          }}
                          numberOfLines={1}
                        >
                          {category}
                        </Text>
                        <Text
                          style={{
                            fontSize: 12,
                            fontWeight: "700",
                            color: colour.primary,
                          }}
                        >
                          {fmt(amount)}
                        </Text>
                      </View>
                      <View
                        style={{
                          height: 5,
                          backgroundColor: colour.surface2,
                          borderRadius: 3,
                        }}
                      >
                        <View
                          style={{
                            width: `${(amount / maxCatAmount) * 100}%`,
                            height: 5,
                            backgroundColor: colour.accent,
                            borderRadius: 3,
                          }}
                        />
                      </View>
                    </View>
                  ))
                )}
              </View>

              {/* Tools nav */}
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: "700",
                  color: colour.textHint,
                  letterSpacing: 0.8,
                  paddingHorizontal: space.md,
                  marginBottom: 8,
                }}
              >
                Tools
              </Text>
              <View
                style={{
                  borderTopWidth: 1,
                  borderBottomWidth: 1,
                  borderColor: colour.borderLight,
                  overflow: "hidden",
                }}
              >
                <NavRow
                  icon="📤"
                  label="ITR12 export setup"
                  sub="Configure and export your return"
                  onPress={() => router.push("/itr12-export-setup")}
                />
                <NavRow
                  icon="🏷"
                  label="Category breakdown"
                  sub="Detailed ITR12 category analysis"
                  onPress={() => router.push("/category-breakdown")}
                />
                <NavRow
                  icon="📖"
                  label="Deductibility guide"
                  sub="Which expenses qualify under SARS"
                  onPress={() => router.push("/deductibility-guide")}
                />
                <NavRow
                  icon="📅"
                  label="Tax year selector"
                  sub="Switch between tax years"
                  onPress={() => router.push("/tax-year-selector")}
                />
              </View>
            </>
          )}
        </View>
      </ScrollView>
      <MXTabBar />
    </SafeAreaView>
  );
}
