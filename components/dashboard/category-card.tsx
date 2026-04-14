import type { Category } from "@/components/dashboard/types";
import { colour, radius, typography } from "@/tokens";
import { Text, View } from "react-native";

interface CategoryCardProps {
  category: Category;
}

export function CategoryCard({ category }: CategoryCardProps) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        borderRadius: radius.lg,
        padding: 12,
        marginBottom: 8,
        backgroundColor: colour.white,
      }}
    >
      {/* Icon */}
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: radius.md,
          backgroundColor: category.color + "20",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Text style={{ fontSize: 18 }}>{category.icon}</Text>
      </View>

      {/* Content */}
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}>
          <Text style={{ ...typography.labelM, color: colour.text }}>{category.name}</Text>
          <Text style={{ ...typography.labelM, color: colour.primary }}>
            R{category.amount.toLocaleString()}
          </Text>
        </View>
        <View
          style={{
            height: 6,
            borderRadius: radius.pill,
            backgroundColor: colour.surface1,
            overflow: "hidden",
            marginBottom: 6,
          }}
        >
          <View
            style={{
              width: `${category.pct}%` as any,
              height: "100%",
              borderRadius: radius.pill,
              backgroundColor: category.color,
            }}
          />
        </View>
      </View>

      {/* Percentage */}
      <Text
        style={{
          ...typography.bodyXS,
          color: colour.textSub,
          fontWeight: "600",
          minWidth: 30,
          textAlign: "right",
        }}
      >
        {category.pct}%
      </Text>
    </View>
  );
}
