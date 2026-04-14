import { colour, radius, space, typography } from "@/tokens";
import { useState } from "react";
import { Dimensions, ScrollView, Text, TouchableOpacity, View } from "react-native";

const { width } = Dimensions.get("window");

interface MonthlyTrendScreenProps { navigation?: any; }

interface MonthData {
  month: string;
  expenses: number;
  deductible: number;
  income: number;
}

interface MetricOption {
  key: "expenses" | "deductible" | "income";
  label: string;
  color: string;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────
const MONTHLY: MonthData[] = [
  { month: "Oct", expenses: 11200, deductible: 7100,  income: 28000 },
  { month: "Nov", expenses: 13800, deductible: 8900,  income: 31000 },
  { month: "Dec", expenses: 9400,  deductible: 5600,  income: 22000 },
  { month: "Jan", expenses: 15200, deductible: 9800,  income: 34000 },
  { month: "Feb", expenses: 12600, deductible: 8200,  income: 29000 },
  { month: "Mar", expenses: 18420, deductible: 11750, income: 38000 },
];

const MAX_VAL = Math.max(...MONTHLY.map((m) => Math.max(m.expenses, m.income)));

const METRICS: MetricOption[] = [
  { key: "expenses",   label: "Expenses",   color: colour.primary },
  { key: "deductible", label: "Deductible", color: colour.success },
  { key: "income",     label: "Income",     color: colour.teal    },
];

// ─── Bar chart ────────────────────────────────────────────────────────────────
function BarChart({
  data,
  metric,
  color,
}: {
  data: MonthData[];
  metric: "expenses" | "deductible" | "income";
  color: string;
}) {
  const BAR_HEIGHT = 160;

  return (
    <View style={{ flexDirection: "row", alignItems: "flex-end", height: BAR_HEIGHT + 30 }}>
      {data.map((item, i) => {
        const val    = item[metric];
        const barH   = Math.max((val / MAX_VAL) * BAR_HEIGHT, 4);
        const isLast = i === data.length - 1;

        return (
          <View key={i} style={{ flex: 1, alignItems: "center" }}>
            {isLast && (
              <View
                style={{
                  position: "absolute",
                  backgroundColor: color,
                  borderRadius: 6,
                  paddingHorizontal: 6,
                  paddingVertical: 2,
                  marginBottom: 8,
                  bottom: barH + 30,
                }}
              >
                <Text style={{ color: colour.white, fontSize: 9, fontWeight: "700" }}>
                  R{(val / 1000).toFixed(1)}k
                </Text>
              </View>
            )}
            <View
              style={{
                width: 20,
                height: barH,
                borderRadius: 4,
                backgroundColor: isLast ? color : `${color}60`,
                marginBottom: 6,
              }}
            />
            <Text style={{ fontSize: 9, color: colour.textSub }}>{item.month}</Text>
          </View>
        );
      })}
    </View>
  );
}

// ─── Insight row ──────────────────────────────────────────────────────────────
function InsightRow({
  icon,
  label,
  value,
  delta,
  positive,
}: {
  icon: string;
  label: string;
  value: string;
  delta: string;
  positive: boolean;
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: colour.border,
      }}
    >
      <Text style={{ fontSize: 20, marginRight: 12 }}>{icon}</Text>
      <View style={{ flex: 1 }}>
        <Text style={{ ...typography.labelM, color: colour.text }}>{label}</Text>
        <Text style={{ ...typography.bodyXS, color: colour.textSub, marginTop: 2 }}>{value}</Text>
      </View>
      <View
        style={{
          borderRadius: radius.sm,
          paddingHorizontal: space.sm,
          paddingVertical: 4,
          backgroundColor: positive ? colour.successBg : colour.dangerBg,
        }}
      >
        <Text
          style={{
            ...typography.micro,
            fontWeight: "700",
            color: positive ? colour.success : colour.danger,
          }}
        >
          {delta}
        </Text>
      </View>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export function MonthlyTrendScreen({ navigation }: MonthlyTrendScreenProps) {
  const [metric, setMetric] = useState<"expenses" | "deductible" | "income">("expenses");

  const active = METRICS.find((m) => m.key === metric)!;

  const avgExpenses = (
    MONTHLY.reduce((s, m) => s + m.expenses, 0) / MONTHLY.length
  ).toFixed(0);

  const latestVsPrev = (
    ((MONTHLY[5].expenses - MONTHLY[4].expenses) / MONTHLY[4].expenses) * 100
  ).toFixed(1);

  const deductRate = (
    (MONTHLY[5].deductible / MONTHLY[5].expenses) * 100
  ).toFixed(1);

  return (
    <View style={{ flex: 1, backgroundColor: colour.white }}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View
          style={{
            backgroundColor: colour.primary,
            paddingTop: 52,
            paddingBottom: 28,
            paddingHorizontal: 20,
          }}
        >
          <TouchableOpacity onPress={() => navigation?.goBack()}>
            <Text style={{ color: colour.teal, fontSize: 13, marginBottom: 10 }}>
              ‹ Reports
            </Text>
          </TouchableOpacity>
          <Text style={{ color: colour.teal, fontSize: 12, fontWeight: "600", letterSpacing: 1 }}>
            MONTHLY TREND
          </Text>
          <Text style={{ color: colour.white, fontSize: 22, fontWeight: "800", marginTop: 4 }}>
            6-Month Overview
          </Text>
          <Text style={{ color: colour.textSub, fontSize: 12, marginTop: 4 }}>
            Oct 2024 – Mar 2025
          </Text>

          {/* Metric tabs */}
          <View
            style={{
              flexDirection: "row",
              backgroundColor: colour.navyDark,
              borderRadius: radius.md,
              padding: 3,
              marginTop: 16,
            }}
          >
            {METRICS.map((m) => (
              <TouchableOpacity
                key={m.key}
                onPress={() => setMetric(m.key)}
                style={{
                  flex: 1,
                  paddingVertical: 7,
                  borderRadius: radius.sm,
                  backgroundColor: metric === m.key ? m.color : "transparent",
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    ...typography.labelS,
                    color: metric === m.key ? colour.white : colour.textSub,
                  }}
                >
                  {m.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Body */}
        <View
          style={{
            backgroundColor: colour.background,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            marginTop: -16,
            paddingTop: 20,
            paddingHorizontal: 16,
            paddingBottom: 30,
          }}
        >
          {/* Bar chart card */}
          <View
            style={{
              backgroundColor: colour.white,
              borderRadius: radius.md,
              padding: 16,
              borderWidth: 1,
              borderColor: colour.border,
              marginBottom: 16,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                marginBottom: 12,
                alignItems: "center",
              }}
            >
              <Text style={{ ...typography.labelM, color: colour.text }}>
                {active.label} — Monthly
              </Text>
              <View
                style={{
                  backgroundColor: colour.surface1,
                  borderRadius: radius.sm,
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                }}
              >
                <Text style={{ ...typography.bodyXS, color: colour.textSub }}>6 months ▾</Text>
              </View>
            </View>
            <BarChart data={MONTHLY} metric={metric} color={active.color} />
          </View>

          {/* Quick stats */}
          <View style={{ flexDirection: "row", gap: 10, marginBottom: 16 }}>
            {[
              { label: "Monthly Avg",  value: `R ${parseInt(avgExpenses).toLocaleString()}`, color: colour.primary },
              { label: "This Month",   value: `R ${MONTHLY[5].expenses.toLocaleString()}`,   color: colour.info    },
              { label: "Deduct. Rate", value: `${deductRate}%`,                               color: colour.success },
            ].map((s, i) => (
              <View
                key={i}
                style={{
                  flex: 1,
                  borderRadius: radius.md,
                  padding: 12,
                  borderWidth: 1,
                  borderColor: colour.border,
                  alignItems: "center",
                  backgroundColor: colour.white,
                }}
              >
                <Text style={{ ...typography.bodyXS, color: colour.textSub, textAlign: "center" }}>
                  {s.label}
                </Text>
                <Text style={{ ...typography.labelM, color: s.color, marginTop: 4 }}>{s.value}</Text>
              </View>
            ))}
          </View>

          {/* Month-by-month table */}
          <View
            style={{
              backgroundColor: colour.white,
              borderRadius: radius.md,
              overflow: "hidden",
              borderWidth: 1,
              borderColor: colour.border,
              marginBottom: 16,
            }}
          >
            {/* Header */}
            <View
              style={{
                flexDirection: "row",
                paddingVertical: 10,
                paddingHorizontal: 16,
                backgroundColor: colour.surface1,
              }}
            >
              {["Month", "Expenses", "Deductible", "Income"].map((h) => (
                <Text
                  key={h}
                  style={{
                    flex: 1,
                    ...typography.labelS,
                    color: colour.textSub,
                    textAlign: h === "Month" ? "left" : "right",
                  }}
                >
                  {h}
                </Text>
              ))}
            </View>

            {MONTHLY.map((row, i) => {
              const isLatest = i === MONTHLY.length - 1;
              return (
                <View
                  key={i}
                  style={{
                    flexDirection: "row",
                    paddingVertical: 11,
                    paddingHorizontal: 16,
                    borderTopWidth: 1,
                    borderTopColor: colour.borderLight,
                    backgroundColor: isLatest ? colour.primary50 : colour.white,
                  }}
                >
                  <Text
                    style={{
                      flex: 1,
                      ...typography.bodyM,
                      color: colour.text,
                      fontWeight: isLatest ? "700" : "500",
                    }}
                  >
                    {row.month}{isLatest ? " ←" : ""}
                  </Text>
                  <Text
                    style={{ flex: 1, ...typography.bodyM, color: colour.primary, textAlign: "right" }}
                  >
                    R{(row.expenses  / 1000).toFixed(1)}k
                  </Text>
                  <Text
                    style={{ flex: 1, ...typography.bodyM, color: colour.success, textAlign: "right" }}
                  >
                    R{(row.deductible / 1000).toFixed(1)}k
                  </Text>
                  <Text
                    style={{ flex: 1, ...typography.bodyM, color: colour.teal, textAlign: "right" }}
                  >
                    R{(row.income    / 1000).toFixed(1)}k
                  </Text>
                </View>
              );
            })}
          </View>

          {/* Insights */}
          <View
            style={{
              backgroundColor: colour.white,
              borderRadius: radius.md,
              overflow: "hidden",
              borderWidth: 1,
              borderColor: colour.border,
            }}
          >
            <View
              style={{
                padding: 16,
                borderBottomWidth: 1,
                borderBottomColor: colour.border,
              }}
            >
              <Text style={{ ...typography.labelM, color: colour.text }}>Insights</Text>
            </View>
            <InsightRow
              icon="📈"
              label="Spend vs last month"
              value="Expenses increased in March"
              delta={`+${latestVsPrev}%`}
              positive={false}
            />
            <InsightRow
              icon="✅"
              label="Deduction consistency"
              value="Avg 62% deductibility maintained"
              delta="+2.1%"
              positive={true}
            />
            <InsightRow
              icon="💡"
              label="Highest month"
              value="January — R15,200 total spend"
              delta="Jan"
              positive={false}
            />
            <InsightRow
              icon="🎯"
              label="On-track for tax year"
              value="Projected R138k total deductions"
              delta="On Track"
              positive={true}
            />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
