import { colour, radius, space, typography } from "@/tokens";
import { useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";

interface BudgetVsActualScreenProps {
  navigation?: any;
}

interface BudgetItem {
  category: string;
  icon: string;
  budget: number;
  actual: number;
  deductible: boolean;
}

const BUDGETS: BudgetItem[] = [
  { category: "Travel & Transport",  icon: "🚗", budget: 4000, actual: 4200, deductible: true  },
  { category: "Home Office",         icon: "🏠", budget: 3500, actual: 3100, deductible: true  },
  { category: "Equipment & Tools",   icon: "🔧", budget: 2000, actual: 2800, deductible: true  },
  { category: "Meals & Entertain.",  icon: "🍽",  budget: 2000, actual: 1950, deductible: true  },
  { category: "Software & Subscr.",  icon: "💻", budget: 1500, actual: 1640, deductible: true  },
  { category: "Professional Fees",   icon: "📋", budget: 1500, actual: 1200, deductible: true  },
  { category: "Utilities",           icon: "⚡", budget: 1000, actual: 980,  deductible: true  },
  { category: "Personal / Other",    icon: "👤", budget: 2000, actual: 2550, deductible: false },
];

const TOTAL_BUDGET = BUDGETS.reduce((s, b) => s + b.budget, 0);
const TOTAL_ACTUAL = BUDGETS.reduce((s, b) => s + b.actual, 0);
const OVER_BUDGET  = BUDGETS.filter((b) => b.actual > b.budget);

// ─── Budget Row ───────────────────────────────────────────────────────────────
function BudgetRow({ item }: { item: BudgetItem }) {
  const over    = item.actual > item.budget;
  const pct     = Math.min((item.actual / item.budget) * 100, 100);
  const diff    = item.actual - item.budget;
  const barColor = over
    ? colour.danger
    : item.actual / item.budget > 0.85
      ? colour.warning
      : colour.success;

  return (
    <View
      style={{
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: colour.border,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
        <Text style={{ fontSize: 20, marginRight: 10 }}>{item.icon}</Text>
        <View style={{ flex: 1 }}>
          <Text style={{ ...typography.labelM, color: colour.text }}>
            {item.category}
          </Text>
          <Text style={{ ...typography.bodyXS, color: colour.textSub, marginTop: 2 }}>
            Budget: R {item.budget.toLocaleString()}
          </Text>
        </View>
        <View style={{ alignItems: "flex-end" }}>
          <Text
            style={{
              ...typography.labelM,
              color: over ? colour.danger : colour.primary,
            }}
          >
            R {item.actual.toLocaleString()}
          </Text>
          <Text
            style={{
              ...typography.bodyXS,
              fontWeight: "600",
              marginTop: 2,
              color: over ? colour.danger : colour.success,
            }}
          >
            {over
              ? `+R ${Math.abs(diff).toLocaleString()} over`
              : `R ${Math.abs(diff).toLocaleString()} left`}
          </Text>
        </View>
      </View>
      {/* Progress bar */}
      <View
        style={{
          height: 6,
          borderRadius: 3,
          backgroundColor: colour.surface1,
          overflow: "hidden",
        }}
      >
        <View
          style={{ width: `${pct}%`, height: 6, borderRadius: 3, backgroundColor: barColor }}
        />
      </View>
      <Text style={{ ...typography.micro, color: colour.textSub, marginTop: 4, textAlign: "right" }}>
        {pct.toFixed(0)}% of budget used
      </Text>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export function BudgetVsActualScreen({ navigation }: BudgetVsActualScreenProps) {
  const [filterMode, setFilterMode] = useState("All");
  const filters = ["All", "Over budget", "Under budget"];

  const filtered = BUDGETS.filter((b) => {
    if (filterMode === "Over budget")   return b.actual > b.budget;
    if (filterMode === "Under budget")  return b.actual <= b.budget;
    return true;
  });

  const totalDiff  = TOTAL_ACTUAL - TOTAL_BUDGET;
  const overallPct = ((TOTAL_ACTUAL / TOTAL_BUDGET) * 100).toFixed(1);

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
            BUDGET VS ACTUAL
          </Text>
          <Text style={{ color: colour.white, fontSize: 22, fontWeight: "800", marginTop: 4 }}>
            Monthly Budget Tracker
          </Text>
          <Text style={{ color: colour.textSub, fontSize: 12, marginTop: 4 }}>
            March 2025
          </Text>
        </View>

        {/* Body card */}
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
          {/* Over-budget alert */}
          {OVER_BUDGET.length > 0 && (
            <View
              style={{
                marginBottom: 16,
                backgroundColor: colour.dangerBg,
                borderRadius: radius.md,
                padding: 14,
                borderLeftWidth: 4,
                borderLeftColor: colour.danger,
                flexDirection: "row",
                alignItems: "center",
              }}
            >
              <Text style={{ fontSize: 20, marginRight: 10 }}>⚠️</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ ...typography.labelM, color: colour.danger }}>
                  {OVER_BUDGET.length} Categories Over Budget
                </Text>
                <Text style={{ ...typography.bodyXS, color: colour.danger, marginTop: 2 }}>
                  {OVER_BUDGET.map((b) => b.category.split(" ")[0]).join(", ")}
                </Text>
              </View>
            </View>
          )}

          {/* Summary cards */}
          <View style={{ flexDirection: "row", gap: 10, marginBottom: 16 }}>
            <View
              style={{ flex: 1, borderRadius: radius.md, padding: 14, backgroundColor: colour.primary }}
            >
              <Text style={{ ...typography.bodyXS, color: colour.primary100 }}>Total Budget</Text>
              <Text style={{ ...typography.amountS, color: colour.white, marginTop: 4 }}>
                R {TOTAL_BUDGET.toLocaleString()}
              </Text>
            </View>
            <View
              style={{
                flex: 1,
                borderRadius: radius.md,
                padding: 14,
                backgroundColor: totalDiff > 0 ? colour.dangerBg : colour.successBg,
                borderWidth: 1,
                borderColor: totalDiff > 0 ? colour.danger : colour.success,
              }}
            >
              <Text style={{ ...typography.bodyXS, color: colour.textSub }}>Total Actual</Text>
              <Text
                style={{
                  ...typography.amountS,
                  color: totalDiff > 0 ? colour.danger : colour.success,
                  marginTop: 4,
                }}
              >
                R {TOTAL_ACTUAL.toLocaleString()}
              </Text>
            </View>
          </View>

          {/* Overall progress */}
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
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 10 }}>
              <Text style={{ ...typography.labelM, color: colour.text }}>Overall Budget Usage</Text>
              <Text
                style={{
                  ...typography.labelM,
                  color: totalDiff > 0 ? colour.danger : colour.success,
                }}
              >
                {overallPct}%
              </Text>
            </View>
            <View
              style={{ height: 10, borderRadius: 5, backgroundColor: colour.surface1, overflow: "hidden" }}
            >
              <View
                style={{
                  width: `${Math.min(parseFloat(overallPct), 100)}%`,
                  height: 10,
                  borderRadius: 5,
                  backgroundColor: totalDiff > 0 ? colour.danger : colour.primary,
                }}
              />
            </View>
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 8 }}>
              <Text style={{ ...typography.micro, color: colour.textSub }}>R 0</Text>
              <Text
                style={{
                  ...typography.micro,
                  fontWeight: "600",
                  color: totalDiff > 0 ? colour.danger : colour.success,
                }}
              >
                {totalDiff > 0
                  ? `R ${totalDiff.toLocaleString()} over`
                  : `R ${Math.abs(totalDiff).toLocaleString()} under`}
              </Text>
              <Text style={{ ...typography.micro, color: colour.textSub }}>
                R {TOTAL_BUDGET.toLocaleString()}
              </Text>
            </View>
          </View>

          {/* Filter tabs */}
          <View style={{ marginBottom: 8 }}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={{ flexDirection: "row", gap: space.sm }}>
                {filters.map((f) => (
                  <TouchableOpacity
                    key={f}
                    onPress={() => setFilterMode(f)}
                    style={{
                      paddingHorizontal: 14,
                      paddingVertical: 7,
                      borderRadius: radius.pill,
                      backgroundColor: filterMode === f ? colour.primary : colour.surface1,
                    }}
                  >
                    <Text
                      style={{
                        ...typography.labelS,
                        color: filterMode === f ? colour.onPrimary : colour.textSub,
                      }}
                    >
                      {f}{f === "Over budget" ? ` (${OVER_BUDGET.length})` : ""}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>

          {/* Budget rows */}
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
            {filtered.map((item, i) => (
              <BudgetRow key={i} item={item} />
            ))}
          </View>

          {/* CTA */}
          <TouchableOpacity
            style={{
              backgroundColor: colour.primary,
              borderRadius: radius.md,
              padding: 16,
              alignItems: "center",
            }}
          >
            <Text style={{ ...typography.btnL, color: colour.onPrimary }}>
              ✏️ Adjust Monthly Budgets
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
