import { MXBackHeader } from "@/components/MXBackHeader";
import { expenseService } from "@/services/expenseService";
import { incomeService } from "@/services/incomeService";
import { useAuthStore } from "@/stores/authStore";
import { colour, radius, space, typography } from "@/tokens";
import { useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import {
    ActivityIndicator,
    ScrollView,
    StatusBar,
    Text,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

function monthKey(dateStr: string): string {
  const parts = dateStr.substring(0, 10).split("-");
  return `${parts[0]}-${parts[1]}`;
}

function buildRecentMonths(
  count: number,
): { key: string; label: string; fullLabel: string }[] {
  const result = [];
  const now = new Date();
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    result.push({
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      label: d.toLocaleString("en-ZA", { month: "short" }),
      fullLabel: d.toLocaleString("en-ZA", { month: "long", year: "numeric" }),
    });
  }
  return result;
}

const fmt = (n: number) =>
  `R ${n.toLocaleString("en-ZA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function statusConfig(income: number, expenses: number) {
  if (income === 0 && expenses === 0)
    return {
      dot: colour.textHint,
      color: colour.textHint,
      label: "No data yet",
      bg: colour.surface1,
    };
  if (income === 0)
    return {
      dot: colour.warning,
      color: colour.warning,
      label: "No income logged",
      bg: colour.warningBg,
    };
  const pct = expenses / income;
  if (pct <= 0.7)
    return {
      dot: colour.success,
      color: colour.success,
      label: "Looking good",
      bg: colour.successBg,
    };
  if (pct <= 1.0)
    return {
      dot: colour.warning,
      color: colour.warning,
      label: "Spending is high",
      bg: colour.warningBg,
    };
  return {
    dot: colour.danger,
    color: colour.danger,
    label: "Spending exceeds income",
    bg: colour.dangerBg,
  };
}

export default function IncomeVsExpensesScreen() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [currentIncome, setCurrentIncome] = useState(0);
  const [currentExpenses, setCurrentExpenses] = useState(0);
  const [currentLabel, setCurrentLabel] = useState("");
  const [recentMonths, setRecentMonths] = useState<
    { label: string; income: number; expenses: number; net: number }[]
  >([]);

  useFocusEffect(
    useCallback(() => {
      if (!user) return;
      setLoading(true);
      setError(null);

      const months = buildRecentMonths(4); // current + 3 previous
      const validKeys = new Set(months.map((m) => m.key));

      Promise.all([
        incomeService.getIncome(user.id),
        expenseService.getAllExpenses(user.id),
      ])
        .then(([incomeEntries, expenseEntries]) => {
          const incomeByMonth: Record<string, number> = {};
          const expenseByMonth: Record<string, number> = {};
          for (const { key } of months) {
            incomeByMonth[key] = 0;
            expenseByMonth[key] = 0;
          }
          for (const e of incomeEntries) {
            const k = monthKey(e.date);
            if (validKeys.has(k)) incomeByMonth[k] += Number(e.amount);
          }
          for (const e of expenseEntries) {
            const k = monthKey(e.expense_date);
            if (validKeys.has(k)) expenseByMonth[k] += Number(e.amount);
          }

          // Current month is last in array
          const current = months[months.length - 1];
          setCurrentLabel(current.fullLabel);
          setCurrentIncome(incomeByMonth[current.key]);
          setCurrentExpenses(expenseByMonth[current.key]);

          // Previous 3 months
          setRecentMonths(
            months.slice(0, 3).map((m) => ({
              label: m.label,
              income: incomeByMonth[m.key],
              expenses: expenseByMonth[m.key],
              net: incomeByMonth[m.key] - expenseByMonth[m.key],
            })),
          );
        })
        .catch((e) => setError(e?.message ?? "Could not load data"))
        .finally(() => setLoading(false));
    }, [user?.id]),
  );

  const net = currentIncome - currentExpenses;
  const spendPct =
    currentIncome > 0 ? Math.min(currentExpenses / currentIncome, 1) : 0;
  const status = statusConfig(currentIncome, currentExpenses);

  return (
    <SafeAreaView
      edges={["top"]}
      style={{ flex: 1, backgroundColor: colour.background }}
    >
      <StatusBar barStyle="dark-content" backgroundColor={colour.background} />
      <MXBackHeader title="Income vs Expenses" />

      <ScrollView
        style={{
          flex: 1,
          backgroundColor: colour.background,
          borderTopLeftRadius: radius.xl,
          borderTopRightRadius: radius.xl,
        }}
        contentContainerStyle={{ paddingBottom: space["5xl"] }}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={{ alignItems: "center", paddingTop: 80 }}>
            <ActivityIndicator color={colour.primary} size="large" />
          </View>
        ) : error ? (
          <View
            style={{
              alignItems: "center",
              paddingTop: 80,
              paddingHorizontal: space.lg,
            }}
          >
            <Text
              style={{
                ...typography.bodyM,
                color: colour.danger,
                textAlign: "center",
              }}
            >
              {error}
            </Text>
          </View>
        ) : (
          <>
            {/* -- This month hero card ------------------------------- */}
            <View
              style={{
                margin: space.lg,
                backgroundColor: colour.bgCard,
                borderRadius: radius.lg,
                padding: space.lg,
                borderWidth: 1,
                borderColor: colour.border,
              }}
            >
              <Text
                style={{
                  ...typography.captionM,
                  color: colour.textHint,
                  textTransform: "uppercase",
                  letterSpacing: 0.8,
                }}
              >
                {currentLabel}
              </Text>

              {/* Plain-language summary */}
              <View
                style={{
                  backgroundColor: status.bg,
                  borderRadius: radius.md,
                  padding: space.md,
                  marginTop: space.md,
                }}
              >
                <View
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 5,
                    backgroundColor: status.dot,
                    marginBottom: space.sm,
                  }}
                />
                {currentIncome === 0 && currentExpenses === 0 ? (
                  <Text style={{ ...typography.bodyM, color: colour.textHint }}>
                    No income or expenses logged for this month yet.
                  </Text>
                ) : (
                  <Text
                    style={{
                      ...typography.bodyM,
                      color: colour.text,
                      lineHeight: 24,
                    }}
                  >
                    You earned{" "}
                    <Text style={{ fontWeight: "700", color: colour.success }}>
                      {fmt(currentIncome)}
                    </Text>{" "}
                    and spent{" "}
                    <Text style={{ fontWeight: "700", color: colour.danger }}>
                      {fmt(currentExpenses)}
                    </Text>
                    {"."}
                    {"\n"}
                    {net >= 0 ? (
                      <>
                        You{"'"}re{" "}
                        <Text
                          style={{ fontWeight: "700", color: colour.primary }}
                        >
                          {fmt(net)} ahead
                        </Text>{" "}
                        this month.
                      </>
                    ) : (
                      <>
                        You{"'"}re{" "}
                        <Text
                          style={{ fontWeight: "700", color: colour.danger }}
                        >
                          {fmt(Math.abs(net))} over
                        </Text>{" "}
                        your income this month.
                      </>
                    )}
                  </Text>
                )}
                <Text
                  style={{
                    ...typography.labelS,
                    color: status.color,
                    marginTop: space.sm,
                  }}
                >
                  {status.label}
                </Text>
              </View>

              {/* Spending bar */}
              {currentIncome > 0 && (
                <View style={{ marginTop: space.md }}>
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      marginBottom: space.xs,
                    }}
                  >
                    <Text
                      style={{ ...typography.bodyXS, color: colour.textSub }}
                    >
                      Expenses as % of income
                    </Text>
                    <Text
                      style={{ ...typography.bodyXS, color: colour.textSub }}
                    >
                      {Math.round(spendPct * 100)}%
                    </Text>
                  </View>
                  <View
                    style={{
                      height: 10,
                      backgroundColor: colour.surface2,
                      borderRadius: radius.pill,
                      overflow: "hidden",
                    }}
                  >
                    <View
                      style={{
                        height: 10,
                        width: `${Math.round(spendPct * 100)}%`,
                        backgroundColor:
                          spendPct <= 0.7
                            ? colour.success
                            : spendPct <= 1
                              ? colour.warning
                              : colour.danger,
                        borderRadius: radius.pill,
                      }}
                    />
                  </View>
                </View>
              )}

              {/* Income / Expenses row */}
              <View
                style={{
                  flexDirection: "row",
                  gap: space.md,
                  marginTop: space.lg,
                }}
              >
                <View style={{ flex: 1, alignItems: "center" }}>
                  <Text
                    style={{
                      ...typography.captionM,
                      color: colour.success,
                      textTransform: "uppercase",
                      letterSpacing: 0.6,
                    }}
                  >
                    Income
                  </Text>
                  <Text
                    style={{
                      ...typography.h4,
                      color: colour.success,
                      fontWeight: "700",
                      marginTop: 2,
                    }}
                  >
                    {fmt(currentIncome)}
                  </Text>
                </View>
                <View style={{ width: 1, backgroundColor: colour.border }} />
                <View style={{ flex: 1, alignItems: "center" }}>
                  <Text
                    style={{
                      ...typography.captionM,
                      color: colour.danger,
                      textTransform: "uppercase",
                      letterSpacing: 0.6,
                    }}
                  >
                    Expenses
                  </Text>
                  <Text
                    style={{
                      ...typography.h4,
                      color: colour.danger,
                      fontWeight: "700",
                      marginTop: 2,
                    }}
                  >
                    {fmt(currentExpenses)}
                  </Text>
                </View>
              </View>
            </View>

            {/* -- Previous 3 months --------------------------------- */}
            <Text
              style={{
                ...typography.captionM,
                color: colour.textSub,
                letterSpacing: 0.8,
                textTransform: "uppercase",
                paddingHorizontal: space.lg,
                paddingBottom: space.sm,
              }}
            >
              Previous months
            </Text>
            <View
              style={{
                borderTopWidth: 1,
                borderBottomWidth: 1,
                borderColor: colour.border,
              }}
            >
              {recentMonths.map((m, i) => {
                const s = statusConfig(m.income, m.expenses);
                return (
                  <View
                    key={m.label}
                    style={{
                      backgroundColor: colour.bgCard,
                      paddingHorizontal: space.lg,
                      paddingVertical: space.md,
                      borderBottomWidth: i < recentMonths.length - 1 ? 1 : 0,
                      borderBottomColor: colour.border,
                      flexDirection: "row",
                      alignItems: "center",
                    }}
                  >
                    <View
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: 5,
                        backgroundColor: s.dot,
                        marginRight: space.md,
                        flexShrink: 0,
                      }}
                    />
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{ ...typography.labelM, color: colour.text }}
                      >
                        {m.label}
                      </Text>
                      <Text
                        style={{
                          ...typography.bodyXS,
                          color: colour.textSub,
                          marginTop: 2,
                        }}
                      >
                        Earned {fmt(m.income)} · Spent {fmt(m.expenses)}
                      </Text>
                    </View>
                    <Text
                      style={{
                        ...typography.labelM,
                        color: m.net >= 0 ? colour.primary : colour.danger,
                        fontWeight: "700",
                      }}
                    >
                      {m.net >= 0 ? "+" : "-"}
                      {fmt(Math.abs(m.net))}
                    </Text>
                  </View>
                );
              })}
            </View>

            {/* Tip */}
            <View
              style={{
                margin: space.lg,
                backgroundColor: colour.primary50,
                borderRadius: radius.md,
                padding: space.md,
                flexDirection: "row",
                gap: space.sm,
              }}
            >
              <View
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: colour.primary,
                  marginTop: 7,
                  flexShrink: 0,
                }}
              />
              <Text
                style={{
                  ...typography.bodyS,
                  color: colour.primary,
                  flex: 1,
                  lineHeight: 20,
                }}
              >
                Keep your expenses below 70% of your income to maintain a
                healthy buffer and maximise your SARS deduction benefit.
              </Text>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
