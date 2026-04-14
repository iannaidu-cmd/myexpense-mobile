// ─── tax-summary.tsx (dashboard component) ────────────────────────────────────
import { colour, radius, space, typography } from "@/tokens";
import { FlatList, Pressable, ScrollView, Text, View } from "react-native";

interface TaxCategory {
  name: string; icon: string; color: string;
  amount: number; percentage: number; itemCount: number; itr12Section: string;
}

interface TaxSummaryData {
  taxYear: number; periodStart: string; periodEnd: string;
  totalTaxSaved: string; daysUntilDeadline: number; categories: TaxCategory[];
  projectedAnnualSaving: string; monthsRemaining: number;
}

interface TaxSummaryScreenProps {
  data?: TaxSummaryData;
  onExport?: () => void;
  onCategoryPress?: (category: TaxCategory) => void;
  onBack?: () => void;
}

const DEFAULT_DATA: TaxSummaryData = {
  taxYear: 2026, periodStart: "1 Mar 2025", periodEnd: "28 Feb 2026",
  totalTaxSaved: "R 34,892.50", daysUntilDeadline: 47,
  categories: [
    { name: "Software & Tech",       icon: "💻", color: colour.midNavy2, amount: 12400, percentage: 81, itemCount: 28, itr12Section: "Section 11(a)" },
    { name: "Travel & Transport",    icon: "🚗", color: colour.info,     amount: 9200,  percentage: 65, itemCount: 34, itr12Section: "Section 11(a)" },
    { name: "Office & Stationery",   icon: "📁", color: colour.primary,  amount: 7800,  percentage: 54, itemCount: 19, itr12Section: "Section 11(a)" },
    { name: "Professional Services", icon: "📋", color: colour.midNavy2, amount: 6100,  percentage: 44, itemCount: 8,  itr12Section: "Section 11(a)" },
    { name: "Meals & Entertainment", icon: "🍽️", color: colour.danger,   amount: 3400,  percentage: 24, itemCount: 22, itr12Section: "50% deductible" },
    { name: "Home Office",           icon: "🏠", color: colour.info,     amount: 2100,  percentage: 15, itemCount: 12, itr12Section: "Section 11(a)" },
  ],
  projectedAnnualSaving: "R 24,600", monthsRemaining: 3,
};

export function TaxSummaryScreen({
  data = DEFAULT_DATA, onExport, onCategoryPress, onBack,
}: TaxSummaryScreenProps) {

  const renderCategoryCard = ({ item }: { item: TaxCategory }) => (
    <Pressable
      style={{
        marginHorizontal: 20,
        marginVertical: 10,
        borderRadius: radius.md,
        padding: 14,
        backgroundColor: colour.surface1,
        borderWidth: 1,
        borderColor: colour.border,
      }}
      onPress={() => onCategoryPress?.(item)}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 10 }}>
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: radius.sm,
            backgroundColor: item.color + "15",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ fontSize: 18 }}>{item.icon}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ ...typography.labelM, color: colour.text }}>{item.name}</Text>
          <Text style={{ ...typography.micro, color: colour.textSub, marginTop: 1 }}>
            {item.itemCount} expenses · {item.itr12Section}
          </Text>
        </View>
        <View style={{ alignItems: "flex-end" }}>
          <Text style={{ ...typography.labelM, color: colour.primary }}>
            R {item.amount.toLocaleString()}
          </Text>
          <Text style={{ ...typography.micro, fontWeight: "700", color: item.color }}>
            {item.percentage}% of target
          </Text>
        </View>
      </View>
      <View style={{ height: 5, borderRadius: 100, backgroundColor: colour.border, overflow: "hidden" }}>
        <View
          style={{
            width: `${Math.min(item.percentage, 100)}%` as any,
            height: "100%",
            borderRadius: 100,
            backgroundColor: item.color,
          }}
        />
      </View>
    </Pressable>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colour.white }}>
      {/* Header */}
      <View
        style={{
          paddingHorizontal: 24,
          paddingTop: 20,
          paddingBottom: 28,
          backgroundColor: colour.primary,
        }}
      >
        <View style={{ marginBottom: 16 }}>
          <Pressable onPress={onBack}>
            <Text style={{ fontSize: 22, color: "rgba(255,255,255,0.65)" }}>←</Text>
          </Pressable>
        </View>
        <Text style={{ ...typography.h3, color: colour.white, marginBottom: 6 }}>Tax Summary</Text>
        <Text style={{ ...typography.bodyS, color: "rgba(255,255,255,0.5)", marginBottom: 10 }}>
          Tax Year {data.taxYear} · {data.periodStart} – {data.periodEnd}
        </Text>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
            backgroundColor: "rgba(2, 136, 209, 0.18)",
            borderRadius: radius.pill,
            paddingHorizontal: 14,
            paddingVertical: 5,
            borderWidth: 1,
            borderColor: "rgba(2, 136, 209, 0.35)",
            alignSelf: "flex-start",
          }}
        >
          <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colour.info }} />
          <Text style={{ fontSize: 11, fontWeight: "700", color: colour.info }}>
            {data.daysUntilDeadline} days until ITR12 deadline
          </Text>
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View
          style={{
            margin: 16,
            marginBottom: 0,
            borderRadius: radius.lg,
            paddingHorizontal: 20,
            paddingVertical: 20,
            backgroundColor: colour.primary,
          }}
        >
          <Text style={{ fontSize: 11, fontWeight: "600", color: "rgba(255,255,255,0.6)", marginBottom: 4, letterSpacing: 0.5 }}>
            Total Tax Saved (Est.)
          </Text>
          <Text style={{ fontSize: 36, fontWeight: "900", color: colour.white, marginBottom: 4 }}>
            {data.totalTaxSaved}
          </Text>
          <Text style={{ fontSize: 11, color: "rgba(255,255,255,0.55)", marginTop: 8 }}>
            Based on current deductible expenses
          </Text>
        </View>

        {/* Category breakdown */}
        <Text
          style={{
            fontSize: 12,
            fontWeight: "700",
            color: colour.textSub,
            paddingHorizontal: 20,
            paddingTop: 20,
            paddingBottom: 16,
            letterSpacing: 0.5,
          }}
        >
          ITR12 CATEGORY BREAKDOWN
        </Text>

        <FlatList
          data={data.categories}
          renderItem={renderCategoryCard}
          keyExtractor={(item) => item.name}
          scrollEnabled={false}
          nestedScrollEnabled={false}
        />

        {/* Forecast */}
        <View
          style={{
            marginHorizontal: 20,
            marginVertical: 16,
            borderRadius: radius.md,
            paddingHorizontal: 16,
            paddingVertical: 16,
            backgroundColor: colour.primary50,
            borderWidth: 1.5,
            borderColor: colour.primary100,
            flexDirection: "row",
            alignItems: "center",
            gap: 16,
          }}
        >
          <Text style={{ fontSize: 28 }}>💡</Text>
          <View style={{ flex: 1 }}>
            <Text style={{ ...typography.labelS, color: colour.primary, marginBottom: 2 }}>
              Projected annual saving
            </Text>
            <Text style={{ fontSize: 20, fontWeight: "900", color: colour.text }}>
              {data.projectedAnnualSaving}
            </Text>
            <Text style={{ ...typography.bodyXS, color: colour.textSub, marginTop: 2 }}>
              At current pace · {data.monthsRemaining} months remaining
            </Text>
          </View>
        </View>

        {/* Export button */}
        <Pressable
          style={{
            marginHorizontal: 20,
            marginVertical: 16,
            borderRadius: radius.pill,
            paddingVertical: 16,
            backgroundColor: colour.primary,
            alignItems: "center",
          }}
          onPress={onExport}
        >
          <Text style={{ ...typography.btnL, color: colour.white }}>📤 Export ITR12 Report</Text>
        </Pressable>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}
