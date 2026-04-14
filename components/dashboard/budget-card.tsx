import { colour, radius, typography } from "@/tokens";
import { Text, View } from "react-native";

interface BudgetCardProps {
  spent: number;
  budget: number;
  percentage: number;
}

export function BudgetCard({ spent, budget, percentage }: BudgetCardProps) {
  const remaining  = budget - spent;
  const barColor   = percentage > 100 ? colour.danger : colour.primary;
  const remColor   = remaining > 0     ? colour.primary : colour.danger;

  return (
    <View
      style={{
        backgroundColor: "rgba(255,255,255,0.10)",
        borderRadius: radius.lg,
        paddingVertical: 18,
        paddingHorizontal: 22,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.15)",
      }}
    >
      {/* Header */}
      <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 12 }}>
        <Text style={{ ...typography.labelM, color: colour.white }}>Monthly Budget</Text>
        <Text style={{ ...typography.bodyS, color: colour.primary200 }}>
          R{spent.toLocaleString()} / R{budget.toLocaleString()}
        </Text>
      </View>

      {/* Progress bar */}
      <View
        style={{
          height: 10,
          borderRadius: radius.pill,
          backgroundColor: colour.surface2,
          overflow: "hidden",
          marginBottom: 12,
        }}
      >
        <View
          style={{
            width: `${Math.min(percentage, 100)}%` as any,
            height: "100%",
            borderRadius: radius.pill,
            backgroundColor: barColor,
          }}
        />
      </View>

      {/* Footer */}
      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <Text style={{ ...typography.bodyXS, color: colour.textDisabled }}>
          {percentage}% used
        </Text>
        <Text style={{ ...typography.bodyXS, fontWeight: "700", color: remColor }}>
          R{remaining.toLocaleString()}{" "}
          {remaining > 0 ? "remaining" : "over budget"}
        </Text>
      </View>
    </View>
  );
}
