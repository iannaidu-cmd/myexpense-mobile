import { MXBackHeader } from "@/components/MXBackHeader";
import { MXTabBar } from "@/components/MXTabBar";
import { expenseService } from "@/services/expenseService";
import { incomeService } from "@/services/incomeService";
import { useAuthStore } from "@/stores/authStore";
import { colour, radius, space, typography } from "@/tokens";
import { useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StatusBar,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Circle, G } from "react-native-svg";

// ── helpers ────────────────────────────────────────────────────────────────────

function monthKey(dateStr: string | null | undefined): string {
  if (!dateStr) return "__none__";
  const parts = dateStr.substring(0, 10).split("-");
  if (parts.length < 2 || !parts[1]) return "__none__";
  return `${parts[0]}-${parts[1]}`;
}

function buildRecentMonths(count: number) {
  const result: {
    key: string;
    label: string;
    yearBadge: string;
    fullLabel: string;
  }[] = [];
  const now = new Date();
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthShort = d.toLocaleString("en-ZA", { month: "short" });
    result.push({
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      label: monthShort.charAt(0).toUpperCase() + monthShort.slice(1),
      yearBadge: `${monthShort.toUpperCase()} ${d.getFullYear()}`,
      fullLabel: d.toLocaleString("en-ZA", { month: "long", year: "numeric" }),
    });
  }
  return result;
}

const fmt = (n: number) =>
  `R ${n.toLocaleString("en-ZA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

// ── Donut chart ────────────────────────────────────────────────────────────────

function DonutChart({
  income,
  expenses,
}: {
  income: number;
  expenses: number;
}) {
  const SIZE = 116;
  const STROKE = 15;
  const R = (SIZE - STROKE) / 2;
  const C = 2 * Math.PI * R;

  const isEmpty = income === 0 && expenses === 0;
  const spendPct =
    income > 0 ? Math.min(expenses / income, 1) : expenses > 0 ? 1 : 0;
  const expenseLen = spendPct * C;

  return (
    <View
      style={{
        width: SIZE,
        height: SIZE,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Svg width={SIZE} height={SIZE}>
        <G rotation="-90" origin={`${SIZE / 2},${SIZE / 2}`}>
          {/* Track */}
          <Circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={R}
            stroke={isEmpty ? colour.border : colour.successBg}
            strokeWidth={STROKE}
            fill="none"
          />
          {/* Income arc — full green ring when income exists */}
          {income > 0 && (
            <Circle
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={R}
              stroke={colour.success}
              strokeWidth={STROKE}
              fill="none"
              strokeDasharray={`${C} ${C}`}
            />
          )}
          {/* Expense arc — red fill proportional to spend ratio */}
          {expenses > 0 && (
            <Circle
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={R}
              stroke={colour.danger}
              strokeWidth={STROKE}
              fill="none"
              strokeDasharray={`${expenseLen} ${C}`}
            />
          )}
        </G>
      </Svg>
      <View
        style={{
          position: "absolute",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {isEmpty ? (
          <Text
            style={{
              fontSize: 11,
              fontWeight: "500",
              color: colour.textHint,
            }}
          >
            Empty
          </Text>
        ) : (
          <Text
            style={{ fontSize: 13, fontWeight: "700", color: colour.text }}
          >
            {Math.round(spendPct * 100)}%
          </Text>
        )}
      </View>
    </View>
  );
}

// ── Month card ─────────────────────────────────────────────────────────────────

function MonthCard({
  label,
  income,
  expenses,
  net,
}: {
  label: string;
  income: number;
  expenses: number;
  net: number;
}) {
  const hasData = income > 0 || expenses > 0;

  const shadow = Platform.select({
    ios: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06,
      shadowRadius: 4,
    },
    android: { elevation: 2 },
  });

  return (
    <View
      style={{
        backgroundColor: colour.white,
        borderRadius: radius.lg,
        marginHorizontal: space.lg,
        marginBottom: space.sm,
        paddingHorizontal: space.md,
        paddingVertical: 14,
        flexDirection: "row",
        alignItems: "center",
        ...shadow,
      }}
    >
      {/* Month badge */}
      <View
        style={{
          width: 50,
          height: 50,
          borderRadius: radius.md,
          backgroundColor: hasData ? colour.successBg : colour.surface1,
          alignItems: "center",
          justifyContent: "center",
          marginRight: space.md,
          flexShrink: 0,
        }}
      >
        <Text
          style={{
            fontSize: 13,
            fontWeight: "700",
            color: hasData ? colour.success : colour.textHint,
          }}
        >
          {label}
        </Text>
      </View>

      {/* Middle text */}
      <View style={{ flex: 1 }}>
        {hasData ? (
          <>
            <Text
              style={{ fontSize: 13, fontWeight: "600", color: colour.success }}
            >
              +{fmt(income)}
            </Text>
            <Text
              style={{ fontSize: 12, color: colour.danger, marginTop: 2 }}
            >
              -{fmt(expenses)}
            </Text>
          </>
        ) : (
          <Text style={{ fontSize: 13, color: colour.textHint }}>
            No transactions
          </Text>
        )}
      </View>

      {/* Net */}
      <Text
        style={{
          fontSize: 14,
          fontWeight: "700",
          color: net >= 0 ? colour.success : colour.danger,
        }}
      >
        {net >= 0 ? "+" : ""}
        {fmt(net)}
      </Text>
    </View>
  );
}

// ── Screen ─────────────────────────────────────────────────────────────────────

export default function IncomeVsExpensesScreen() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [currentIncome, setCurrentIncome] = useState(0);
  const [currentExpenses, setCurrentExpenses] = useState(0);
  const [currentYearBadge, setCurrentYearBadge] = useState("");
  const [recentMonths, setRecentMonths] = useState<
    { label: string; income: number; expenses: number; net: number }[]
  >([]);

  useFocusEffect(
    useCallback(() => {
      if (!user) return;
      setLoading(true);
      setError(null);

      const months = buildRecentMonths(6); // current + 5 previous
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

          const current = months[months.length - 1];
          setCurrentYearBadge(current.yearBadge);
          setCurrentIncome(incomeByMonth[current.key]);
          setCurrentExpenses(expenseByMonth[current.key]);

          setRecentMonths(
            months.slice(0, 5).map((m) => ({
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

  const heroShadow = Platform.select({
    ios: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 10,
    },
    android: { elevation: 3 },
  });

  const isEmpty = currentIncome === 0 && currentExpenses === 0;

  return (
    <SafeAreaView
      edges={["top"]}
      style={{ flex: 1, backgroundColor: colour.background }}
    >
      <StatusBar barStyle="dark-content" backgroundColor={colour.background} />
      <MXBackHeader title="Income vs Expenses" />

      <ScrollView
        style={{ flex: 1 }}
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
            {/* Date badge */}
            <View style={{ alignItems: "center", paddingVertical: space.md }}>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: colour.surface1,
                  borderRadius: radius.pill,
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  gap: 8,
                }}
              >
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: "700",
                    color: colour.text,
                    letterSpacing: 0.4,
                  }}
                >
                  {currentYearBadge}
                </Text>
                <View
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: 4,
                    backgroundColor: colour.success,
                  }}
                />
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: "500",
                    color: colour.textSub,
                  }}
                >
                  Current
                </Text>
              </View>
            </View>

            {/* Hero card */}
            <View
              style={{
                marginHorizontal: space.lg,
                marginBottom: space.lg,
                backgroundColor: colour.white,
                borderRadius: radius.xl,
                padding: space.lg,
                ...heroShadow,
              }}
            >
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: space.lg }}
              >
                {/* Donut */}
                <DonutChart
                  income={currentIncome}
                  expenses={currentExpenses}
                />

                {/* Breakdown */}
                <View style={{ flex: 1 }}>
                  {isEmpty && (
                    <Text
                      style={{
                        fontSize: 12,
                        color: colour.textHint,
                        lineHeight: 18,
                        marginBottom: space.md,
                      }}
                    >
                      No activity yet.{"\n"}Start tracking to see your summary.
                    </Text>
                  )}

                  {/* Income row */}
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 6,
                      marginBottom: 4,
                    }}
                  >
                    <View
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: colour.success,
                      }}
                    />
                    <Text
                      style={{
                        fontSize: 10,
                        fontWeight: "700",
                        color: colour.success,
                        letterSpacing: 0.8,
                      }}
                    >
                      INCOME
                    </Text>
                  </View>
                  <Text
                    style={{
                      fontSize: 20,
                      fontWeight: "800",
                      color: colour.text,
                      letterSpacing: -0.5,
                      marginBottom: space.sm,
                    }}
                  >
                    {fmt(currentIncome)}
                  </Text>

                  {/* Divider */}
                  <View
                    style={{
                      height: 1,
                      backgroundColor: colour.borderLight,
                      marginBottom: space.sm,
                    }}
                  />

                  {/* Expenses row */}
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 6,
                      marginBottom: 4,
                    }}
                  >
                    <View
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: colour.danger,
                      }}
                    />
                    <Text
                      style={{
                        fontSize: 10,
                        fontWeight: "700",
                        color: colour.danger,
                        letterSpacing: 0.8,
                      }}
                    >
                      EXPENSES
                    </Text>
                  </View>
                  <Text
                    style={{
                      fontSize: 20,
                      fontWeight: "800",
                      color: colour.text,
                      letterSpacing: -0.5,
                    }}
                  >
                    {fmt(currentExpenses)}
                  </Text>
                </View>
              </View>
            </View>

            {/* Previous months header */}
            <Text
              style={{
                fontSize: 11,
                fontWeight: "700",
                color: colour.textSub,
                letterSpacing: 1,
                textTransform: "uppercase",
                paddingHorizontal: space.lg,
                paddingBottom: space.sm,
              }}
            >
              Previous months
            </Text>

            {/* Month cards */}
            {recentMonths.map((m) => (
              <MonthCard
                key={m.label}
                label={m.label}
                income={m.income}
                expenses={m.expenses}
                net={m.net}
              />
            ))}

            {/* Tip */}
            <View
              style={{
                marginHorizontal: space.lg,
                marginTop: space.sm,
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
                Expenses are grouped by their expense date, not the date you
                entered them. If a scanned receipt has an older date, check the
                relevant month above.
              </Text>
            </View>
          </>
        )}
      </ScrollView>
      <MXTabBar />
    </SafeAreaView>
  );
}
