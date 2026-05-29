import { IconSymbol } from "@/components/ui/icon-symbol";
import { MXHeader } from "@/components/MXHeader";
import { SA_MARGINAL_TAX_RATE } from "@/constants/tax";
import { expenseService } from "@/services/expenseService";
import { useAuthStore } from "@/stores/authStore";
import { useExpenseStore } from "@/stores/expenseStore";
import { colour, radius, space } from "@/tokens";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type TaxYear = {
  id: string;
  label: string;
  period: string;
  status: "current" | "filing" | "closed";
};

const TAX_YEARS: TaxYear[] = [
  {
    id: "fy2026",
    label: "2025/26",
    period: "1 Mar 2025 \u2013 28 Feb 2026",
    status: "current",
  },
  {
    id: "fy2025",
    label: "2024/25",
    period: "1 Mar 2024 \u2013 28 Feb 2025",
    status: "filing",
  },
  {
    id: "fy2024",
    label: "2023/24",
    period: "1 Mar 2023 \u2013 29 Feb 2024",
    status: "closed",
  },
  {
    id: "fy2023",
    label: "2022/23",
    period: "1 Mar 2022 \u2013 28 Feb 2023",
    status: "closed",
  },
  {
    id: "fy2022",
    label: "2021/22",
    period: "1 Mar 2021 \u2013 28 Feb 2022",
    status: "closed",
  },
];

const STATUS_BADGE: Record<
  TaxYear["status"],
  { label: string; bg: string; text: string } | null
> = {
  current: null, // shown in hero, not in list
  filing: { label: "Filing open", bg: colour.warningBg, text: colour.warning },
  closed: { label: "Closed", bg: colour.surface2, text: colour.textSub },
};

const fmt = (n: number) =>
  `R ${n.toLocaleString("en-ZA", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

export default function TaxYearSelectorScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { activeTaxYear, setActiveTaxYear } = useExpenseStore();

  const [selected, setSelected] = useState(
    () => TAX_YEARS.find((y) => y.label === activeTaxYear)?.id ?? "fy2026",
  );
  const [loadingTotals, setLoadingTotals] = useState(true);
  const [totals, setTotals] = useState<
    Record<string, { expenses: number; claimable: number }>
  >({});

  const loadTotals = useCallback(async () => {
    if (!user) {
      setLoadingTotals(false);
      return;
    }
    setLoadingTotals(true);
    try {
      const results = await Promise.all(
        TAX_YEARS.map((y) => expenseService.getTotals(user.id, y.label)),
      );
      const map: Record<string, { expenses: number; claimable: number }> = {};
      TAX_YEARS.forEach((y, i) => {
        map[y.id] = {
          expenses: results[i].totalExpenses,
          claimable: results[i].totalDeductions,
        };
      });
      setTotals(map);
    } catch (e) {
      console.error("TaxYearSelector load error:", e);
    } finally {
      setLoadingTotals(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      loadTotals();
    }, [loadTotals]),
  );

  const handleSelect = (year: TaxYear) => {
    setSelected(year.id);
    setActiveTaxYear(year.label);
    setTimeout(() => router.back(), 150);
  };

  // Active year data for hero
  const activeYear = TAX_YEARS.find((y) => y.id === selected);
  const activeData = totals[selected];
  const activeSaving = activeData
    ? Math.round(activeData.claimable * SA_MARGINAL_TAX_RATE)
    : 0;

  return (
    <SafeAreaView
      edges={["top"]}
      style={{ flex: 1, backgroundColor: colour.background }}
    >
      <StatusBar barStyle="dark-content" backgroundColor={colour.background} />

      <MXHeader title="Tax year" showBack />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: space["4xl"] }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Active year hero (periwinkle) ─────────────────────────────── */}
        {activeYear && (
          <View
            style={{
              marginHorizontal: space.lg,
              marginTop: space.sm,
              marginBottom: space.lg,
              backgroundColor: colour.primary,
              borderRadius: radius.lg,
              padding: space.xl,
              overflow: "hidden",
            }}
          >
            <View
              style={{
                position: "absolute",
                width: 140,
                height: 140,
                borderRadius: 70,
                backgroundColor: "rgba(255,255,255,0.1)",
                top: -50,
                right: -30,
              }}
            />

            <Text
              style={{
                fontSize: 10,
                fontFamily: "Inter_600SemiBold",
                color: "rgba(255,255,255,0.6)",
                letterSpacing: 0.8,
                marginBottom: 6,
              }}
            >
              ACTIVE YEAR
            </Text>

            {/* Status badge */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 4,
                backgroundColor: "rgba(255,255,255,0.18)",
                borderRadius: radius.pill,
                paddingHorizontal: 10,
                paddingVertical: 3,
                alignSelf: "flex-start",
                marginBottom: space.md,
              }}
            >
              <View
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor:
                    activeYear.status === "current"
                      ? colour.success
                      : activeYear.status === "filing"
                        ? colour.warning
                        : colour.textSub,
                }}
              />
              <Text
                style={{
                  fontSize: 10,
                  fontFamily: "Inter_600SemiBold",
                  color: colour.onPrimary,
                }}
              >
                {activeYear.status === "current"
                  ? "Current year"
                  : activeYear.status === "filing"
                    ? "Filing open"
                    : "Closed"}
              </Text>
            </View>

            <Text
              style={{
                fontSize: 32,
                fontFamily: "Inter_800ExtraBold",
                color: colour.onPrimary,
                letterSpacing: -1,
                marginBottom: 2,
              }}
            >
              FY {activeYear.label}
            </Text>
            <Text
              style={{
                fontSize: 12,
                fontFamily: "Inter_400Regular",
                color: "rgba(255,255,255,0.55)",
                marginBottom: space.lg,
              }}
            >
              {activeYear.period}
            </Text>

            {/* Stat pills */}
            <View style={{ flexDirection: "row", gap: space.sm }}>
              {[
                {
                  label: "EXPENSES",
                  value: loadingTotals
                    ? "\u2014"
                    : fmt(activeData?.expenses ?? 0),
                },
                {
                  label: "CLAIMABLE",
                  value: loadingTotals
                    ? "\u2014"
                    : fmt(activeData?.claimable ?? 0),
                },
                {
                  label: "TAX SAVING",
                  value: loadingTotals ? "\u2014" : fmt(activeSaving),
                },
              ].map((stat) => (
                <View
                  key={stat.label}
                  style={{
                    flex: 1,
                    backgroundColor: "rgba(255,255,255,0.12)",
                    borderRadius: radius.sm,
                    padding: 10,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 8,
                      fontFamily: "Inter_600SemiBold",
                      color: "rgba(255,255,255,0.5)",
                      letterSpacing: 0.5,
                      marginBottom: 3,
                    }}
                  >
                    {stat.label}
                  </Text>
                  <Text
                    style={{
                      fontSize: 14,
                      fontFamily: "Inter_700Bold",
                      color: colour.onPrimary,
                    }}
                  >
                    {stat.value}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ── Switch year list ──────────────────────────────────────────── */}
        <Text
          style={{
            fontSize: 10,
            fontFamily: "Inter_700Bold",
            color: colour.textSub,
            letterSpacing: 1,
            marginHorizontal: space.lg,
            marginBottom: 10,
          }}
        >
          SWITCH YEAR
        </Text>

        <View
          style={{
            marginHorizontal: space.lg,
            backgroundColor: colour.white,
            borderRadius: radius.md,
            borderWidth: 1,
            borderColor: colour.borderLight,
            overflow: "hidden",
          }}
        >
          {TAX_YEARS.map((year, i) => {
            const isSelected = selected === year.id;
            const badge = STATUS_BADGE[year.status];
            const yearData = totals[year.id];

            return (
              <TouchableOpacity
                key={year.id}
                onPress={() => handleSelect(year)}
                activeOpacity={0.7}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingVertical: 14,
                  paddingHorizontal: space.lg,
                  backgroundColor: isSelected
                    ? colour.primary50
                    : "transparent",
                  borderBottomWidth: i < TAX_YEARS.length - 1 ? 1 : 0,
                  borderBottomColor: colour.borderLight,
                }}
              >
                {/* Left: year info */}
                <View style={{ flex: 1 }}>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 6,
                      marginBottom: 2,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 15,
                        fontFamily: "Inter_700Bold",
                        color: colour.text,
                      }}
                    >
                      FY {year.label}
                    </Text>
                    {badge && (
                      <View
                        style={{
                          backgroundColor: badge.bg,
                          borderRadius: radius.pill,
                          paddingHorizontal: 8,
                          paddingVertical: 2,
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 9,
                            fontFamily: "Inter_600SemiBold",
                            color: badge.text,
                          }}
                        >
                          {badge.label}
                        </Text>
                      </View>
                    )}
                  </View>
                  <Text
                    style={{
                      fontSize: 11,
                      fontFamily: "Inter_400Regular",
                      color: colour.textSub,
                    }}
                  >
                    {year.period}
                  </Text>
                </View>

                {/* Right: claimable amount + radio/check */}
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <View style={{ alignItems: "flex-end" }}>
                    <Text
                      style={{
                        fontSize: 13,
                        fontFamily: "Inter_700Bold",
                        color: colour.text,
                      }}
                    >
                      {loadingTotals
                        ? "\u2014"
                        : fmt(yearData?.claimable ?? 0)}
                    </Text>
                    <Text
                      style={{
                        fontSize: 9,
                        fontFamily: "Inter_400Regular",
                        color: colour.textSub,
                      }}
                    >
                      claimable
                    </Text>
                  </View>

                  {isSelected ? (
                    <View
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: 11,
                        backgroundColor: colour.primary,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <IconSymbol
                        name="checkmark"
                        size={12}
                        color={colour.onPrimary}
                      />
                    </View>
                  ) : (
                    <View
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: 11,
                        borderWidth: 2,
                        borderColor: colour.borderLight,
                      }}
                    />
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ── Info banner (noir) ────────────────────────────────────────── */}
        <View
          style={{
            marginHorizontal: space.lg,
            marginTop: space.lg,
            backgroundColor: colour.noir,
            borderRadius: radius.md,
            padding: space.md,
            flexDirection: "row",
            gap: space.md,
            alignItems: "flex-start",
          }}
        >
          <View
            style={{
              backgroundColor: colour.primary,
              borderRadius: radius.sm,
              width: 28,
              height: 28,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <IconSymbol
              name="info.circle"
              size={14}
              color={colour.onPrimary}
            />
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
              SA tax year
            </Text>
            <Text
              style={{
                fontSize: 11,
                fontFamily: "Inter_400Regular",
                color: colour.onNoir2,
                lineHeight: 16,
              }}
            >
              Runs 1 March to end of February. ITR12 filing typically opens in
              July each year. SARS requires 5 years of records.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
