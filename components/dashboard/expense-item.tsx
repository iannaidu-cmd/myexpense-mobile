import type { Expense } from "@/components/dashboard/types";
import { colour, radius, typography } from "@/tokens";
import { Text, View } from "react-native";

interface ExpenseItemProps {
  expense: Expense;
}

export function ExpenseItem({ expense }: ExpenseItemProps) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        borderRadius: radius.lg,
        padding: 14,
        marginBottom: 8,
        backgroundColor: colour.white,
      }}
    >
      {/* Icon */}
      <View
        style={{
          width: 42,
          height: 42,
          borderRadius: 14,
          backgroundColor: colour.surface1,
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Text style={{ fontSize: 20 }}>{expense.icon}</Text>
      </View>

      {/* Content */}
      <View style={{ flex: 1 }}>
        <Text style={{ ...typography.labelM, color: colour.text, marginBottom: 2 }}>
          {expense.name}
        </Text>
        <Text style={{ ...typography.bodyXS, color: colour.textSub }}>
          {expense.category} · {expense.date}
        </Text>
      </View>

      {/* Right side */}
      <View style={{ alignItems: "flex-end", gap: 4 }}>
        <Text style={{ ...typography.labelM, color: colour.primary }}>
          R{expense.amount.toLocaleString()}
        </Text>
        {expense.deductible && (
          <View
            style={{
              paddingVertical: 2,
              paddingHorizontal: 7,
              borderRadius: radius.pill,
              backgroundColor: colour.tealLight,
              borderWidth: 1,
              borderColor: colour.teal + "44",
            }}
          >
            <Text style={{ ...typography.micro, fontWeight: "700", color: colour.teal }}>
              ✓ TAX
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}
