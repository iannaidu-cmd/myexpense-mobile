import { MXHeader } from "@/components/MXHeader";
import { useAuthStore } from "@/stores/authStore";
import { colour, radius, space, typography } from "@/tokens";
import { useRouter } from "expo-router";
import React, { useState } from "react";
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
    period: "1 Mar 2025 – 28 Feb 2026",
    status: "current",
  },
  {
    id: "fy2025",
    label: "2024/25",
    period: "1 Mar 2024 – 28 Feb 2025",
    status: "filing",
  },
  {
    id: "fy2024",
    label: "2023/24",
    period: "1 Mar 2023 – 29 Feb 2024",
    status: "closed",
  },
  {
    id: "fy2023",
    label: "2022/23",
    period: "1 Mar 2022 – 28 Feb 2023",
    status: "closed",
  },
  {
    id: "fy2022",
    label: "2021/22",
    period: "1 Mar 2021 – 28 Feb 2022",
    status: "closed",
  },
];

const STATUS_CONFIG = {
  current: {
    label: "Current Year",
    bg: colour.primaryLight,
    text: colour.primary,
    border: colour.primary,
  },
  filing: {
    label: "Filing Open",
    bg: colour.warningLight,
    text: colour.warning,
    border: colour.warning,
  },
  closed: {
    label: "Closed",
    bg: colour.border,
    text: colour.textSecondary,
    border: colour.border,
  },
} as const;

export default function TaxYearSelectorScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { activeTaxYear, setActiveTaxYear } = useExpenseStore();

  // Initialise selected from the store's active tax year
  const [selected, setSelected] = useState(
    () => TAX_YEARS.find((y) => y.label === activeTaxYear)?.id ?? "fy2025",
  );
  const [loadingTotals, setLoadingTotals] = useState(true);
  const [totals, setTotals] = useState<
    Record<string, { expenses: number; claimable: number }>
  >({});

  const loadTotals = useCallback(async () => {
    if (!user) return;
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

  const fmt = (n: number) => `R ${n.toLocaleString("en-ZA")}`;

  return (
    <SafeAreaView
      edges={["top"]}
      style={{ flex: 1, backgroundColor: colour.primary }}
    >
      <StatusBar barStyle="light-content" backgroundColor={colour.primary} />

      <MXHeader
        title="Select Tax Year"
        subtitle="SARS tax year runs 1 March – 28/29 February"
        showBack
        backLabel="Tax & ITR12"
      />

      {/* Card */}
      <ScrollView
        style={{
          flex: 1,
          backgroundColor: colour.bgCard,
          borderTopLeftRadius: radius.xl,
          borderTopRightRadius: radius.xl,
        }}
        contentContainerStyle={{
          padding: space.lg,
          paddingBottom: space["4xl"],
        }}
      >
        {/* Info banner */}
        <View
          style={{
            backgroundColor: colour.infoLight,
            borderRadius: radius.md,
            padding: space.md,
            marginBottom: space.xl,
          }}
        >
          <Text style={[typography.bodyS, { color: colour.info }]}>
            📅 The South African tax year runs from{" "}
            <Text style={{ fontWeight: "600" }}>
              1 March to the last day of February
            </Text>
            . ITR12 submissions for individuals typically open in July each
            year.
          </Text>
        </View>

        {/* Year list */}
        {TAX_YEARS.map((year) => {
          const cfg = STATUS_CONFIG[year.status];
          const isSelected = selected === year.id;
          return (
            <TouchableOpacity
              key={year.id}
              onPress={() => handleSelect(year)}
              style={{
                borderRadius: radius.md,
                borderWidth: isSelected ? 2 : 1,
                borderColor: isSelected ? colour.primary : colour.border,
                backgroundColor: isSelected
                  ? colour.primaryLight
                  : colour.bgCard,
                padding: space.lg,
                marginBottom: space.md,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: space.sm,
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: space.sm,
                  }}
                >
                  <Text
                    style={[typography.heading4, { color: colour.textPrimary }]}
                  >
                    FY {year.label}
                  </Text>
                  <View
                    style={{
                      backgroundColor: cfg.bg,
                      borderRadius: radius.full,
                      paddingHorizontal: space.sm,
                      paddingVertical: 2,
                    }}
                  >
                    <Text
                      style={[
                        typography.micro,
                        { color: cfg.text, fontWeight: "600" },
                      ]}
                    >
                      {cfg.label}
                    </Text>
                  </View>
                </View>
                {isSelected && (
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
                    <Text
                      style={{
                        color: colour.textOnPrimary,
                        fontSize: 12,
                        fontWeight: "700",
                      }}
                    >
                      ✓
                    </Text>
                  </View>
                )}
              </View>

              <Text
                style={[
                  typography.caption,
                  { color: colour.textSecondary, marginBottom: space.md },
                ]}
              >
                {year.period}
              </Text>

              <View style={{ flexDirection: "row", gap: space.md }}>
                <View style={{ flex: 1 }}>
                  <Text
                    style={[typography.micro, { color: colour.textSecondary }]}
                  >
                    Total Expenses
                  </Text>
                  <Text
                    style={[typography.labelM, { color: colour.textPrimary }]}
                  >
                    {loadingTotals ? "—" : fmt(totals[year.id]?.expenses ?? 0)}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={[typography.micro, { color: colour.textSecondary }]}
                  >
                    ITR12 Claimable
                  </Text>
                  <Text style={[typography.labelM, { color: colour.success }]}>
                    {loadingTotals ? "—" : fmt(totals[year.id]?.claimable ?? 0)}
                  </Text>
                </View>
              </View>

              {year.status === "filing" && (
                <View
                  style={{
                    backgroundColor: colour.warningLight,
                    borderRadius: radius.sm,
                    padding: space.sm,
                    marginTop: space.md,
                  }}
                >
                  <Text style={[typography.bodyS, { color: colour.warning }]}>
                    ⚠️ ITR12 filing is currently open for this tax year. Submit
                    before 23 October 2025.
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}
