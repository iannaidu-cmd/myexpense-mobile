import { colour, radius, space, typography } from "@/tokens";
import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

interface VATCategory {
  name: string; icon: string; bg: string; color: string;
  amount: number; vat: number; items: number;
}

interface ITR12VATSummaryProps {
  categories?: VATCategory[];
  onPeriodChange?: (period: string) => void;
}

const DEFAULT_CATEGORIES: VATCategory[] = [
  { name: "Software & Tech",       icon: "💻", color: colour.midNavy2, bg: colour.primary50, amount: 12400, vat: 1617, items: 28 },
  { name: "Travel & Transport",    icon: "🚗", color: colour.info,     bg: colour.primary50, amount: 9200,  vat: 1200, items: 34 },
  { name: "Office & Stationery",   icon: "📁", color: colour.primary,  bg: colour.primary50, amount: 7800,  vat: 1017, items: 19 },
  { name: "Professional Services", icon: "📋", color: colour.teal,     bg: colour.tealLight, amount: 6100,  vat: 795,  items: 8  },
  { name: "Meals & Entertainment", icon: "🍽️", color: colour.danger,   bg: colour.dangerBg,  amount: 3400,  vat: 443,  items: 22 },
  { name: "Home Office",           icon: "🏠", color: colour.info,     bg: colour.primary50, amount: 2100,  vat: 274,  items: 12 },
];

const PERIODS = [
  ["this_month", "This month"],
  ["last_month", "Last month"],
  ["tax_year",   "Tax year"  ],
] as const;

export function ITR12VATSummaryScreen({
  categories = DEFAULT_CATEGORIES,
  onPeriodChange,
}: ITR12VATSummaryProps) {
  const [period, setPeriod] = useState("this_month");
  const totalVAT = categories.reduce((s, c) => s + c.vat, 0);

  const handlePeriodChange = (newPeriod: string) => {
    setPeriod(newPeriod);
    onPeriodChange?.(newPeriod);
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colour.background }}>

      {/* Header */}
      <View
        style={{
          paddingHorizontal: 24,
          paddingTop: 20,
          paddingBottom: 28,
          backgroundColor: colour.primary,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 16 }}>
          <Pressable style={{ padding: 4 }}>
            <Text style={{ color: "rgba(255,255,255,0.65)", fontSize: 22 }}>←</Text>
          </Pressable>
          <Text style={{ ...typography.labelM, color: colour.white, marginLeft: 8 }}>MyExpense</Text>
        </View>
        <Text style={{ ...typography.h3, color: colour.white, marginBottom: 6 }}>VAT Summary</Text>
        <Text style={{ ...typography.bodyS, color: "rgba(255,255,255,0.5)" }}>
          Input tax tracker · 15% VAT
        </Text>
        <View
          style={{
            flexDirection: "row",
            marginTop: 18,
            paddingTop: 16,
            borderTopWidth: 1,
            borderTopColor: "rgba(255,255,255,0.15)",
          }}
        >
          {[
            { label: "Total input VAT", value: `R ${totalVAT.toLocaleString()}` },
            { label: "VAT receipts",    value: "111"                            },
            { label: "VAT rate",        value: "15%"                            },
          ].map((s, i) => (
            <View
              key={i}
              style={{
                flex: 1,
                ...(i > 0 ? { borderLeftWidth: 1, borderLeftColor: "rgba(255,255,255,0.2)", paddingLeft: 16 } : {}),
              }}
            >
              <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: 10, marginBottom: 2 }}>{s.label}</Text>
              <Text style={{ color: colour.white, fontSize: 20, fontWeight: "900" }}>{s.value}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Period filter */}
      <View style={{ flexDirection: "row", gap: space.sm, paddingHorizontal: 20, paddingVertical: 16, flexWrap: "wrap" }}>
        {PERIODS.map(([val, lbl]) => (
          <Pressable
            key={val}
            onPress={() => handlePeriodChange(val)}
            style={{
              paddingVertical: 7,
              paddingHorizontal: 14,
              borderRadius: radius.pill,
              borderWidth: 1.5,
              borderColor: period === val ? colour.primary : colour.border,
              backgroundColor: period === val ? colour.primary : colour.white,
            }}
          >
            <Text
              style={{
                ...typography.labelS,
                color: period === val ? colour.onPrimary : colour.textSub,
              }}
            >
              {lbl}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Info card */}
      <View
        style={{
          marginHorizontal: 20,
          marginBottom: 14,
          backgroundColor: colour.primary50,
          borderWidth: 1.5,
          borderColor: colour.primary100,
          borderRadius: radius.md,
          paddingVertical: 14,
          paddingHorizontal: 16,
        }}
      >
        <Text style={{ ...typography.labelS, color: colour.primary, marginBottom: 4 }}>
          What is Input VAT?
        </Text>
        <Text style={{ ...typography.bodyXS, color: colour.textSub, lineHeight: 18 }}>
          Input VAT is the 15% VAT embedded in your business expenses. If you are VAT-registered,
          you can claim this back from SARS. MyExpense automatically extracts VAT from your receipts.
        </Text>
      </View>

      {/* Category breakdown */}
      <Text
        style={{
          ...typography.labelS,
          color: colour.primary,
          letterSpacing: 0.5,
          paddingHorizontal: 20,
          paddingTop: 20,
          paddingBottom: 10,
        }}
      >
        VAT BY CATEGORY
      </Text>
      {categories.map((cat, i) => (
        <View
          key={i}
          style={{
            marginHorizontal: 20,
            marginBottom: 8,
            backgroundColor: colour.white,
            borderRadius: radius.md,
            paddingVertical: 13,
            paddingHorizontal: 16,
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
            borderWidth: 1,
            borderColor: colour.border,
          }}
        >
          <View
            style={{
              width: 36,
              height: 36,
              borderRadius: radius.sm,
              backgroundColor: cat.bg,
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Text style={{ fontSize: 17 }}>{cat.icon}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ ...typography.labelM, color: colour.primary }}>{cat.name}</Text>
            <Text style={{ ...typography.micro, color: colour.textSub, marginTop: 2 }}>
              Gross: R {cat.amount.toLocaleString()} · {cat.items} receipts
            </Text>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={{ ...typography.labelM, color: cat.color }}>
              R {cat.vat.toLocaleString()}
            </Text>
            <Text style={{ ...typography.micro, color: colour.textSub }}>Input VAT</Text>
          </View>
        </View>
      ))}

      {/* Calculation example */}
      <View
        style={{
          marginHorizontal: 20,
          marginTop: 10,
          marginBottom: 8,
          backgroundColor: colour.white,
          borderRadius: radius.md,
          paddingVertical: 10,
          paddingHorizontal: 16,
          borderTopWidth: 1,
          borderTopColor: colour.surface1,
          borderWidth: 1,
          borderColor: colour.border,
        }}
      >
        <Text style={{ ...typography.micro, color: colour.textSub }}>
          R {categories[0].amount.toLocaleString()} ÷ 1.15 × 0.15 ={" "}
          <Text style={{ color: categories[0].color }}>R {categories[0].vat.toLocaleString()}</Text>
        </Text>
      </View>

      {/* Total card */}
      <View
        style={{
          marginHorizontal: 20,
          marginTop: 8,
          marginBottom: 12,
          backgroundColor: colour.primary,
          borderRadius: radius.lg,
          paddingVertical: 16,
          paddingHorizontal: 18,
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <View style={{ flex: 1 }}>
          <Text style={{ color: "rgba(255,255,255,0.6)", fontSize: 11, marginBottom: 4 }}>Total Input VAT</Text>
          <Text style={{ ...typography.amountS, color: colour.white }}>R {totalVAT.toLocaleString()}</Text>
          <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, marginTop: 2 }}>Tax Year 2026</Text>
        </View>
        <View style={{ alignItems: "flex-end" }}>
          <Text style={{ color: "rgba(255,255,255,0.6)", fontSize: 11, marginBottom: 4 }}>If VAT registered</Text>
          <Text style={{ ...typography.labelM, color: colour.teal, fontSize: 16, fontWeight: "800" }}>
            Claimable →
          </Text>
        </View>
      </View>

      {/* Registration note */}
      <View
        style={{
          marginHorizontal: 20,
          backgroundColor: colour.surface1,
          borderWidth: 1.5,
          borderColor: colour.border,
          borderStyle: "dashed",
          borderRadius: radius.md,
          paddingVertical: 12,
          paddingHorizontal: 16,
        }}
      >
        <Text style={{ ...typography.labelS, color: colour.primary, marginBottom: 4 }}>
          Not VAT registered?
        </Text>
        <Text style={{ ...typography.bodyXS, color: colour.textSub, lineHeight: 18 }}>
          If you earn under R1 million/year, VAT registration is optional. The VAT you pay is included
          in the gross expense deduction under Section 11(a).
        </Text>
      </View>

      <View style={{ height: 24 }} />
    </ScrollView>
  );
}
