import { IconSymbol } from "@/components/ui/icon-symbol";
import { MXHeader } from "@/components/MXHeader";
import { MXTabBar } from "@/components/MXTabBar";
import { expenseService } from "@/services/expenseService";
import { incomeService } from "@/services/incomeService";
import { getMarginalRate, medicalTaxCreditForYear, raDeductionCap } from "@/lib/taxRules";
import { profileService } from "@/services/profileService";
import { taxLiabilityService } from "@/services/taxLiabilityService";
import { taxService } from "@/services/taxService";
import { useAuthStore } from "@/stores/authStore";
import { useExpenseStore } from "@/stores/expenseStore";
import { colour, radius, space } from "@/tokens";
import { useFocusEffect, useRouter } from "expo-router";
import { useAppForeground } from "@/hooks/use-app-foreground";
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
        <IconSymbol name={icon as any} size={18} color={colour.accentDeep} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 14, fontWeight: "600", color: colour.text }}>
          {label}
        </Text>
        <Text style={{ fontSize: 12, color: colour.textSub, marginTop: 2 }}>
          {sub}
        </Text>
      </View>
      <IconSymbol name="chevron.right" size={14} color={colour.textSub} />
    </TouchableOpacity>
  );
}

const fmt = (n: number) =>
  `R ${n.toLocaleString("en-ZA", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

const fmtPct = (n: number) => `${Math.round(n)}%`;


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
  const [medicalAidDependants, setMedicalAidDependants] = useState(0);
  const [medicalAidMonthly, setMedicalAidMonthly] = useState(0);
  const [hasDisability, setHasDisability] = useState(false);

  const loadData = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    setLoading(true);
    try {
      const [expenseTotals, incomeTotals, breakdown, summary, profile] =
        await Promise.all([
          expenseService.getTotals(user.id, activeTaxYear),
          incomeService.getTotals(user.id, activeTaxYear),
          expenseService.getByCategory(user.id, activeTaxYear),
          taxService.recalculateSummary(user.id, activeTaxYear),
          profileService.getProfile(user.id),
        ]);

      setTotalExpenses(expenseTotals.totalExpenses);
      setTotalDeductions(expenseTotals.totalDeductions);
      setTotalIncome(incomeTotals.totalIncome);
      setCategoryBreakdown(breakdown);
      setItr12Readiness(summary.itr12_readiness_pct ?? 0);
      setMedicalAidDependants(profile?.medical_aid_dependants ?? 0);
      setMedicalAidMonthly(profile?.medical_aid_monthly ?? 0);
      setHasDisability(profile?.has_disability ?? false);
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
  useAppForeground(loadData);

  const marginalRate = getMarginalRate(totalIncome);
  const estTaxSaving = Math.round(totalDeductions * marginalRate);

  // Medical Aid Tax Credit (MTC) — SARS S6A, persisted from tax profile
  const medAidInExpenses = categoryBreakdown["Medical Aid"] ?? 0;
  const annualMTC = medicalTaxCreditForYear(medicalAidDependants, activeTaxYear);

  // RA: total RA contributions from expenses, cap = 27.5% of income up to the
  // tax year's absolute S11F cap (lib/taxRules.ts — previously hardcoded to
  // the 2025/26 figure of R350,000 regardless of the active tax year).
  const raContributions = categoryBreakdown["Retirement Annuity"] ?? 0;
  const raCap = raDeductionCap(totalIncome, activeTaxYear);
  const raDeductible = Math.min(raContributions, raCap);
  const deductionRate =
    totalExpenses > 0 ? Math.round((totalDeductions / totalExpenses) * 100) : 0;

  // Build category rows sorted by amount descending
  const categoryRows = Object.entries(categoryBreakdown)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8);
  const maxCatAmount = Math.max(...categoryRows.map(([, v]) => v), 1);

  // Routes to the summary if an estimate already exists for this tax year,
  // otherwise to the inputs screen to create one — see app/tax-liability-*.
  const handleTaxLiabilityPress = async () => {
    if (!user) return;
    const existing = await taxLiabilityService.getEstimate(user.id, activeTaxYear);
    router.push((existing ? "/tax-liability-summary" : "/tax-liability-inputs") as any);
  };

  // Days to SARS non-provisional filing deadline, derived from the active tax year
  const deadlineYear = parseInt(activeTaxYear.split("/")[0]) + 1;
  const deadlineDate = new Date(deadlineYear, 9, 23); // Oct 23 of the second year
  const today = new Date();
  const daysToDeadline = Math.max(
    0,
    Math.ceil((deadlineDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)),
  );

  // SARS key dates for the tax year being viewed — derived the same way as
  // deadlineDate above, so this stays correct as activeTaxYear changes and
  // never goes stale the way hardcoded literals previously did.
  const fmtKeyDate = (d: Date) =>
    d.toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" });
  const taxYearEndDate = new Date(deadlineYear, 1, 28); // 28 Feb
  const autoAssessmentStartDate = new Date(deadlineYear, 6, 1); // 1 Jul
  const efilingOpensDate = new Date(deadlineYear, 6, 13); // 13 Jul
  const provisionalDate = new Date(deadlineYear + 1, 0, 22); // 22 Jan, following year
  const sarsKeyDates = [
    { label: "Tax year end", date: fmtKeyDate(taxYearEndDate), done: today > taxYearEndDate },
    { label: "Auto-assessment notices", date: fmtKeyDate(autoAssessmentStartDate), done: today > autoAssessmentStartDate },
    { label: "eFiling opens", date: fmtKeyDate(efilingOpensDate), done: today > efilingOpensDate },
    { label: "Non-provisional filing", date: fmtKeyDate(deadlineDate), done: today > deadlineDate },
    { label: "Provisional (auto)", date: fmtKeyDate(provisionalDate), done: today > provisionalDate },
  ];

  // Format the large hero amount with space separator
  const heroAmount = estTaxSaving.toLocaleString("en-ZA", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

  return (
    <SafeAreaView
      edges={["top"]}
      style={{ flex: 1, backgroundColor: colour.background }}
    >
      <StatusBar barStyle="dark-content" backgroundColor={colour.background} />

      <MXHeader
        title="Tax summary"
        showBack
        right={
          <View
            style={{
              backgroundColor: colour.primary50,
              borderRadius: 10,
              paddingHorizontal: 12,
              paddingVertical: 6,
            }}
          >
            <Text
              style={{
                color: colour.accentDeep,
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
              {/* ── Hero card (periwinkle gradient) ─────────────────────── */}
              <View
                style={{
                  marginHorizontal: space.md,
                  marginTop: space.lg,
                  borderRadius: radius.lg,
                  overflow: "hidden",
                  marginBottom: space.md,
                }}
              >
                {/* Gradient background */}
                <View
                  style={{
                    backgroundColor: colour.primary,
                    padding: space.xl,
                    paddingBottom: 0,
                  }}
                >
                  {/* Decorative orbs */}
                  <View
                    style={{
                      position: "absolute",
                      width: 180,
                      height: 180,
                      borderRadius: 90,
                      backgroundColor: "rgba(255,255,255,0.12)",
                      top: -60,
                      right: -40,
                    }}
                  />
                  <View
                    style={{
                      position: "absolute",
                      width: 100,
                      height: 100,
                      borderRadius: 50,
                      backgroundColor: "rgba(255,255,255,0.06)",
                      bottom: 20,
                      left: -20,
                    }}
                  />

                  {/* Top row: label + deadline badge */}
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: space.sm,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 11,
                        fontFamily: "Inter_600SemiBold",
                        color: "rgba(255,255,255,0.7)",
                        letterSpacing: 0.8,
                      }}
                    >
                      ESTIMATED TAX SAVING
                    </Text>
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 5,
                      }}
                    >
                      <View
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: 3,
                          backgroundColor: colour.success,
                        }}
                      />
                      <Text
                        style={{
                          fontSize: 11,
                          fontFamily: "Inter_600SemiBold",
                          color: "rgba(255,255,255,0.8)",
                        }}
                      >
                        {daysToDeadline} d to deadline
                      </Text>
                    </View>
                  </View>

                  {/* Big amount */}
                  <Text
                    style={{
                      fontSize: 52,
                      fontFamily: "Inter_800ExtraBold",
                      color: colour.onPrimary,
                      letterSpacing: -2,
                      lineHeight: 56,
                      marginBottom: 6,
                    }}
                  >
                    <Text style={{ fontSize: 32, fontFamily: "Inter_700Bold" }}>R</Text>
                    {heroAmount}
                  </Text>

                  <Text
                    style={{
                      fontSize: 12,
                      fontFamily: "Inter_400Regular",
                      color: "rgba(255,255,255,0.6)",
                      marginBottom: space.xl,
                    }}
                  >
                    Based on logged income, expenses and mileage - {activeTaxYear}
                  </Text>

                  {/* Stat pills */}
                  <View
                    style={{
                      flexDirection: "row",
                      gap: space.sm,
                      marginBottom: space.xl,
                    }}
                  >
                    <View
                      style={{
                        flex: 1,
                        backgroundColor: "rgba(255,255,255,0.12)",
                        borderRadius: radius.md,
                        padding: space.sm,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 9,
                          fontFamily: "Inter_600SemiBold",
                          color: "rgba(255,255,255,0.55)",
                          letterSpacing: 0.5,
                          marginBottom: 4,
                        }}
                      >
                        DEDUCTIONS
                      </Text>
                      <Text
                        style={{
                          fontSize: 14,
                          fontFamily: "Inter_800ExtraBold",
                          color: colour.onPrimary,
                        }}
                      >
                        {fmt(totalDeductions)}
                      </Text>
                    </View>
                    <View
                      style={{
                        flex: 1,
                        backgroundColor: "rgba(255,255,255,0.12)",
                        borderRadius: radius.md,
                        padding: space.sm,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 9,
                          fontFamily: "Inter_600SemiBold",
                          color: "rgba(255,255,255,0.55)",
                          letterSpacing: 0.5,
                          marginBottom: 4,
                        }}
                      >
                        EXPENSES
                      </Text>
                      <Text
                        style={{
                          fontSize: 14,
                          fontFamily: "Inter_800ExtraBold",
                          color: colour.onPrimary,
                        }}
                      >
                        {fmt(totalExpenses)}
                      </Text>
                    </View>
                    <View
                      style={{
                        flex: 1,
                        backgroundColor: "rgba(255,255,255,0.12)",
                        borderRadius: radius.md,
                        padding: space.sm,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 9,
                          fontFamily: "Inter_600SemiBold",
                          color: "rgba(255,255,255,0.55)",
                          letterSpacing: 0.5,
                          marginBottom: 4,
                        }}
                      >
                        INCOME
                      </Text>
                      <Text
                        style={{
                          fontSize: 14,
                          fontFamily: "Inter_800ExtraBold",
                          color: colour.onPrimary,
                        }}
                      >
                        {fmt(totalIncome)}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* ── eFiling disclaimer (noir banner) ────────────────────── */}
              <View
                style={{
                  marginHorizontal: space.md,
                  backgroundColor: colour.noir,
                  borderRadius: radius.md,
                  padding: space.md,
                  marginBottom: space.md,
                  flexDirection: "row",
                  gap: space.md,
                  alignItems: "flex-start",
                }}
              >
                <View
                  style={{
                    backgroundColor: colour.primary,
                    borderRadius: radius.sm,
                    width: 32,
                    height: 32,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <IconSymbol name="info.circle" size={16} color={colour.onPrimary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: 12,
                      fontFamily: "Inter_600SemiBold",
                      color: colour.onNoir,
                      marginBottom: 2,
                    }}
                  >
                    eFiling reminder
                  </Text>
                  <Text
                    style={{
                      fontSize: 12,
                      fontFamily: "Inter_400Regular",
                      color: colour.onNoir2,
                      lineHeight: 18,
                    }}
                  >
                    MyExpense prepares your ITR12 data. You must file via SARS eFiling or a registered tax practitioner.
                  </Text>
                </View>
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
                      color: colour.success,
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
                      backgroundColor: colour.success,
                      borderRadius: 4,
                    }}
                  />
                </View>
                <Text style={{ fontSize: 11, color: colour.textSub }}>
                  {itr12Readiness < 100
                    ? `${100 - Math.round(itr12Readiness)}% of expenses still need receipts attached`
                    : "All expenses have receipts - ready to export!"}
                </Text>
                <TouchableOpacity
                  onPress={() => router.push("/itr12-export-setup")}
                  style={{
                    marginTop: 12,
                    backgroundColor: colour.primary,
                    borderRadius: radius.pill,
                    padding: 14,
                    alignItems: "center",
                    flexDirection: "row",
                    justifyContent: "center",
                    gap: space.sm,
                  }}
                >
                  <IconSymbol name="square.and.arrow.up" size={16} color={colour.onPrimary} />
                  <Text
                    style={{
                      color: colour.onPrimary,
                      fontSize: 14,
                      fontFamily: "Inter_600SemiBold",
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
                  backgroundColor: colour.noir,
                  borderRadius: radius.lg,
                  padding: space.md,
                  marginBottom: space.md,
                  overflow: "hidden",
                }}
              >
                <View
                  style={{
                    position: "absolute",
                    width: 120,
                    height: 120,
                    borderRadius: 60,
                    backgroundColor: colour.primary,
                    opacity: 0.2,
                    top: -40,
                    right: -30,
                  }}
                />
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 8,
                    marginBottom: 14,
                  }}
                >
                  <IconSymbol name="calendar" size={16} color={colour.onNoir} />
                  <Text
                    style={{
                      color: colour.onNoir,
                      fontSize: 13,
                      fontWeight: "700",
                    }}
                  >
                    SARS Key Dates - {activeTaxYear}
                  </Text>
                </View>
                {sarsKeyDates.map((d, i) => (
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
                          : colour.primary200,
                        marginRight: 10,
                      }}
                    />
                    <Text
                      style={{
                        flex: 1,
                        fontSize: 12,
                        color: d.done ? colour.onNoir2 : colour.onNoir,
                      }}
                    >
                      {d.label}
                    </Text>
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: "600",
                        color: d.done ? colour.onNoir2 : colour.primary100,
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
                    { label: `Cap (27.5% of R${totalIncome.toLocaleString("en-ZA")}, max R${raCap.toLocaleString("en-ZA")})`, value: fmt(raCap) },
                    { label: "Deductible amount", value: fmt(raDeductible) },
                  ].map((row, i) => (
                    <View key={i} style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}>
                      <Text style={{ fontSize: 12, color: colour.textSub, flex: 1, marginRight: 8 }} numberOfLines={2}>{row.label}</Text>
                      <Text style={{ fontSize: 12, fontWeight: "700", color: colour.primary }}>{row.value}</Text>
                    </View>
                  ))}
                  {raContributions > raCap && (
                    <Text style={{ fontSize: 11, color: colour.danger, marginTop: 4 }}>
                      Contributions exceed your annual cap by {fmt(raContributions - raCap)}. The excess rolls over to the next tax year.
                    </Text>
                  )}
                </View>
              )}

              {/* Medical Aid Tax Credits */}
              {(medAidInExpenses > 0 || medicalAidMonthly > 0 || medicalAidDependants > 0) && (
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
                  <Text style={{ fontSize: 11, color: colour.success, marginBottom: 12, backgroundColor: colour.successBg, borderRadius: 6, padding: 8 }}>
                    Medical Aid is a tax credit (reduces your tax bill directly), not a deduction from income. It is NOT included in your total deductions above.
                  </Text>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}>
                    <Text style={{ fontSize: 12, color: colour.textSub, flex: 1, marginRight: 8 }} numberOfLines={2}>
                      Annual MTC · {medicalAidDependants === 0 ? "main member only" : `${medicalAidDependants} dependant${medicalAidDependants > 1 ? "s" : ""}`}
                    </Text>
                    <Text style={{ fontSize: 14, fontWeight: "800", color: colour.success }}>{fmt(annualMTC)}</Text>
                  </View>
                  {hasDisability && (
                    <View style={{ backgroundColor: colour.primary50, borderRadius: 6, padding: 8, marginBottom: 6 }}>
                      <Text style={{ fontSize: 11, color: colour.accentDeep, fontWeight: "600" }}>
                        Disability: out-of-pocket medical expenses fully deductible (no 7.5% floor). Attach ITR-DD.
                      </Text>
                    </View>
                  )}
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 }}>
                    <Text style={{ fontSize: 11, color: colour.textHint, flex: 1 }}>
                      Enter this on your ITR12 under "Medical tax credits". Update dependants in My Profile → Tax profile.
                    </Text>
                  </View>
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
                          height: 6,
                          backgroundColor: colour.surface2,
                          borderRadius: 3,
                        }}
                      >
                        <View
                          style={{
                            width: `${(amount / maxCatAmount) * 100}%`,
                            height: 6,
                            backgroundColor: colour.primary,
                            borderRadius: 3,
                            opacity: 1 - i * 0.12,
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
                  icon="dollarsign.circle.fill"
                  label="Tax Refund or Bill"
                  sub="What you owe SARS or get back"
                  onPress={handleTaxLiabilityPress}
                />
                <NavRow
                  icon="square.and.arrow.up"
                  label="ITR12 export setup"
                  sub="Configure and export your return"
                  onPress={() => router.push("/itr12-export-setup")}
                />
                <NavRow
                  icon="tag.fill"
                  label="Category breakdown"
                  sub="Detailed ITR12 category analysis"
                  onPress={() => router.push("/category-breakdown")}
                />
                <NavRow
                  icon="book.fill"
                  label="Deductibility guide"
                  sub="Which expenses qualify under SARS"
                  onPress={() => router.push("/deductibility-guide")}
                />
                <NavRow
                  icon="crown.fill"
                  label="Government concessions"
                  sub="S12C · SBC · S10(1)(o) · TFSA"
                  onPress={() => router.push("/government-concessions" as any)}
                />
                <NavRow
                  icon="calendar"
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
