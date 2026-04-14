import { colour, radius, space, typography } from "@/tokens";
import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

interface TaxYear {
  label: string; range: string; current: boolean;
  expenses: number; saved: string; total: string;
  status: string; statusColor: string;
}

interface ITR12TaxYearSelectorProps {
  years?: TaxYear[];
  onYearSelect?: (year: string) => void;
}

const DEFAULT_YEARS: TaxYear[] = [
  { label: "2026", range: "1 Mar 2025 – 28 Feb 2026", current: true,  expenses: 143, saved: "R 18,450", total: "R 41,000", status: "In progress", statusColor: colour.info    },
  { label: "2025", range: "1 Mar 2024 – 28 Feb 2025", current: false, expenses: 187, saved: "R 22,100", total: "R 49,200", status: "Filed",       statusColor: colour.success },
  { label: "2024", range: "1 Mar 2023 – 28 Feb 2024", current: false, expenses: 154, saved: "R 17,800", total: "R 39,500", status: "Filed",       statusColor: colour.success },
  { label: "2023", range: "1 Mar 2022 – 28 Feb 2023", current: false, expenses: 98,  saved: "R 12,600", total: "R 28,000", status: "Filed",       statusColor: colour.success },
];

export function ITR12TaxYearSelectorScreen({
  years = DEFAULT_YEARS,
  onYearSelect,
}: ITR12TaxYearSelectorProps) {
  const [selected, setSelected] = useState(0);
  const sel = years[selected];

  const handleSelect = (index: number) => {
    setSelected(index);
    onYearSelect?.(years[index].label);
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colour.background }}>

      {/* Header */}
      <View
        style={{ backgroundColor: colour.primary, paddingHorizontal: 24, paddingTop: 20, paddingBottom: 24 }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 16 }}>
          <Pressable style={{ padding: 4 }}>
            <Text style={{ color: "rgba(255,255,255,0.65)", fontSize: 22 }}>←</Text>
          </Pressable>
          <Text style={{ ...typography.labelM, color: colour.white, marginLeft: 8 }}>MyExpense</Text>
        </View>
        <Text style={{ ...typography.h3, color: colour.white, marginBottom: 6 }}>Tax Year Selector</Text>
        <Text style={{ ...typography.bodyS, color: "rgba(255,255,255,0.5)" }}>
          Switch between SARS financial years
        </Text>
      </View>

      {/* Info card */}
      <View
        style={{
          marginHorizontal: 20,
          marginTop: 16,
          marginBottom: 20,
          backgroundColor: colour.tealLight,
          borderWidth: 1.5,
          borderColor: colour.teal + "40",
          borderRadius: radius.md,
          paddingVertical: 14,
          paddingHorizontal: 16,
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
        }}
      >
        <Text style={{ fontSize: 24 }}>📅</Text>
        <View style={{ flex: 1 }}>
          <Text style={{ ...typography.labelM, color: colour.teal }}>South African Tax Year</Text>
          <Text style={{ ...typography.bodyXS, color: colour.textSub, marginTop: 2 }}>
            Runs from 1 March to 28/29 February each year
          </Text>
        </View>
      </View>

      {/* Year list */}
      <Text
        style={{
          ...typography.labelS,
          color: colour.primary,
          letterSpacing: 0.5,
          paddingHorizontal: 20,
          paddingBottom: 10,
        }}
      >
        SELECT TAX YEAR
      </Text>

      {years.map((yr, i) => (
        <Pressable
          key={i}
          onPress={() => handleSelect(i)}
          style={{
            marginHorizontal: 20,
            marginBottom: 10,
            backgroundColor: colour.white,
            borderRadius: radius.md,
            borderWidth: 1.5,
            borderColor: selected === i ? colour.info : colour.border,
            paddingVertical: 15,
            paddingHorizontal: 16,
          }}
        >
          {/* Top row */}
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: 14,
                borderWidth: 1.5,
                borderColor: selected === i ? colour.info : colour.border,
                backgroundColor: selected === i ? colour.primary50 : colour.surface1,
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Text
                style={{
                  ...typography.labelM,
                  color: selected === i ? colour.info : colour.primary,
                }}
              >
                {yr.label}
              </Text>
              {yr.current && (
                <Text style={{ ...typography.micro, fontWeight: "700", color: colour.info }}>NOW</Text>
              )}
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 2 }}>
                <Text style={{ ...typography.labelM, color: colour.primary }}>
                  Tax Year {yr.label}
                </Text>
                <View
                  style={{
                    borderRadius: radius.pill,
                    paddingVertical: 2,
                    paddingHorizontal: 8,
                    backgroundColor: yr.statusColor + "18",
                  }}
                >
                  <Text style={{ ...typography.micro, fontWeight: "700", color: yr.statusColor }}>
                    {yr.status}
                  </Text>
                </View>
              </View>
              <Text style={{ ...typography.bodyXS, color: colour.textSub }}>{yr.range}</Text>
            </View>
            <View
              style={{
                width: 22,
                height: 22,
                borderRadius: 11,
                flexShrink: 0,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: selected === i ? colour.info : colour.border,
              }}
            >
              {selected === i && (
                <Text style={{ color: colour.white, fontSize: 11, fontWeight: "700" }}>✓</Text>
              )}
            </View>
          </View>

          {/* Mini stats */}
          <View
            style={{
              flexDirection: "row",
              marginTop: 12,
              paddingTop: 12,
              borderTopWidth: 1,
              borderTopColor: colour.borderLight,
            }}
          >
            {[
              { label: "Expenses", value: String(yr.expenses) },
              { label: "Tax saved", value: yr.saved },
              { label: "Total",     value: yr.total },
            ].map((s, j) => (
              <View
                key={j}
                style={{
                  flex: 1,
                  ...(j > 0 ? { borderLeftWidth: 1, borderLeftColor: colour.borderLight, paddingLeft: 12 } : {}),
                }}
              >
                <Text style={{ ...typography.micro, color: colour.textSub, marginBottom: 2 }}>{s.label}</Text>
                <Text
                  style={{
                    ...typography.labelS,
                    color: j === 1 ? colour.info : colour.primary,
                  }}
                >
                  {s.value}
                </Text>
              </View>
            ))}
          </View>
        </Pressable>
      ))}

      {/* View button */}
      <Pressable
        style={{
          marginHorizontal: 20,
          marginTop: 8,
          backgroundColor: colour.primary,
          borderRadius: radius.pill,
          paddingVertical: 16,
          alignItems: "center",
        }}
      >
        <Text style={{ ...typography.btnL, color: colour.white }}>
          View {sel.label} Tax Summary →
        </Text>
      </Pressable>

      {/* Compare note */}
      <View
        style={{
          marginHorizontal: 20,
          marginTop: 12,
          backgroundColor: colour.surface1,
          borderWidth: 1.5,
          borderColor: colour.border,
          borderStyle: "dashed",
          borderRadius: radius.md,
          paddingVertical: 12,
          paddingHorizontal: 16,
          flexDirection: "row",
          alignItems: "center",
          gap: 10,
        }}
      >
        <Text style={{ fontSize: 18 }}>📊</Text>
        <Text style={{ ...typography.bodyXS, color: colour.textSub, flex: 1 }}>
          Compare year-on-year tax savings in Reports → Monthly Trend
        </Text>
      </View>

      <View style={{ height: 24 }} />
    </ScrollView>
  );
}
