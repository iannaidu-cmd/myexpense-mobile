import { colour, radius, space, typography } from "@/tokens";
import { useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import type { Month } from "./types";

const MONTHS: Month[] = [
  { month: "Mar", year: 2026, expenses: 18, amount: 18640, saved: 4280 },
  { month: "Feb", year: 2026, expenses: 22, amount: 24180, saved: 5200 },
  { month: "Jan", year: 2026, expenses: 15, amount: 13220, saved: 2980 },
  { month: "Dec", year: 2025, expenses: 29, amount: 31500, saved: 7100 },
  { month: "Nov", year: 2025, expenses: 18, amount: 16800, saved: 3780 },
  { month: "Oct", year: 2025, expenses: 21, amount: 20400, saved: 4590 },
  { month: "Sep", year: 2025, expenses: 17, amount: 15900, saved: 3580 },
  { month: "Aug", year: 2025, expenses: 24, amount: 22700, saved: 5100 },
  { month: "Jul", year: 2025, expenses: 19, amount: 18200, saved: 4100 },
  { month: "Jun", year: 2025, expenses: 13, amount: 11800, saved: 2660 },
  { month: "May", year: 2025, expenses: 20, amount: 19400, saved: 4370 },
  { month: "Apr", year: 2025, expenses: 16, amount: 14600, saved: 3290 },
];

interface PeriodSelectorProps { onClose: () => void; }

export function PeriodSelector({ onClose }: PeriodSelectorProps) {
  const [selectedMonth, setSelectedMonth] = useState(0);
  const [view, setView] = useState<"month" | "year" | "custom">("month");

  const selected   = MONTHS[selectedMonth];
  const maxAmount  = Math.max(...MONTHS.map((m) => m.amount));

  return (
    <View style={{ flex: 1, backgroundColor: colour.white }}>
      {/* Header */}
      <View style={{ backgroundColor: colour.navyDark, paddingVertical: 28, paddingHorizontal: 20 }}>
        <Text style={{ ...typography.h3, color: colour.white, marginBottom: 8 }}>Period Selector</Text>
        <Text style={{ ...typography.bodyM, color: "rgba(255,255,255,0.55)", lineHeight: 22 }}>
          Switch between tax months or years to review your expenses.
        </Text>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 16 }} showsVerticalScrollIndicator={false}>

        {/* View toggle */}
        <View
          style={{
            flexDirection: "row",
            backgroundColor: colour.primary50,
            borderRadius: radius.md,
            padding: 4,
            gap: 4,
            marginBottom: 16,
          }}
        >
          {(["month", "year", "custom"] as const).map((v) => (
            <TouchableOpacity
              key={v}
              style={{
                flex: 1,
                paddingVertical: 9,
                borderRadius: radius.sm,
                backgroundColor: view === v ? colour.white : "transparent",
                alignItems: "center",
              }}
              onPress={() => setView(v)}
            >
              <Text style={{ ...typography.labelS, color: view === v ? colour.primary : colour.textSub, textAlign: "center" }}>
                {v === "month" ? "Monthly" : v === "year" ? "Tax Year" : "Custom"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Summary card */}
        <View
          style={{
            backgroundColor: colour.info,
            borderRadius: radius.lg,
            padding: 18,
            marginBottom: 20,
          }}
        >
          <Text style={{ ...typography.labelS, color: "rgba(255,255,255,0.6)", marginBottom: 4 }}>
            SELECTED PERIOD
          </Text>
          <Text style={{ ...typography.h3, color: colour.white, marginBottom: 14 }}>
            {selected.month} {selected.year}
          </Text>
          <View style={{ flexDirection: "row" }}>
            {[
              { label: "Total Expenses", value: `R ${selected.amount.toLocaleString()}` },
              { label: "Tax Saved",      value: `R ${selected.saved.toLocaleString()}`  },
              { label: "Receipts",       value: String(selected.expenses)               },
            ].map((s, i) => (
              <View
                key={i}
                style={{
                  flex: 1,
                  ...(i > 0 ? { borderLeftWidth: 1, borderLeftColor: "rgba(255,255,255,0.2)", paddingLeft: 14 } : {}),
                }}
              >
                <Text style={{ fontSize: 10, color: "rgba(255,255,255,0.55)", marginBottom: 3 }}>{s.label}</Text>
                <Text style={{ ...typography.labelM, color: colour.white }}>{s.value}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Monthly mini chart + list */}
        {view === "month" && (
          <>
            <Text style={{ ...typography.labelS, color: colour.primary, marginBottom: 14, letterSpacing: 0.5 }}>
              2025 – 2026 TAX YEAR
            </Text>

            {/* Mini bar chart */}
            <View
              style={{
                backgroundColor: colour.white,
                borderRadius: radius.lg,
                padding: 16,
                marginBottom: 16,
                borderWidth: 1,
                borderColor: colour.border,
              }}
            >
              <Text style={{ ...typography.bodyXS, color: colour.textSub, marginBottom: 12 }}>Monthly spend overview</Text>
              <View style={{ flexDirection: "row", alignItems: "flex-end", height: 80, gap: 4 }}>
                {MONTHS.slice().reverse().map((m, i) => {
                  const height   = (m.amount / maxAmount) * 60;
                  const idx      = MONTHS.length - 1 - i;
                  const isSel    = idx === selectedMonth;
                  return (
                    <TouchableOpacity
                      key={i}
                      style={{ flex: 1, alignItems: "center", gap: 4 }}
                      onPress={() => setSelectedMonth(idx)}
                    >
                      <View
                        style={{
                          width: "100%",
                          height,
                          borderRadius: 4,
                          backgroundColor: isSel ? colour.info : colour.primary50,
                        }}
                      />
                      <Text
                        style={{
                          fontSize: 8,
                          fontWeight: isSel ? "800" : "600",
                          color: isSel ? colour.primary : colour.textSub,
                        }}
                      >
                        {m.month.slice(0, 1)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Month list */}
            <View style={{ gap: 8 }}>
              {MONTHS.map((m, i) => (
                <TouchableOpacity
                  key={i}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    backgroundColor: colour.white,
                    borderRadius: radius.md,
                    padding: 12,
                    borderWidth: 1.5,
                    borderColor: selectedMonth === i ? colour.info : colour.border,
                  }}
                  onPress={() => setSelectedMonth(i)}
                >
                  <View
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: radius.md,
                      justifyContent: "center",
                      alignItems: "center",
                      marginRight: 12,
                      borderWidth: 1.5,
                      borderColor: selectedMonth === i ? colour.info : colour.border,
                      backgroundColor: selectedMonth === i ? colour.primary50 : colour.surface1,
                    }}
                  >
                    <Text
                      style={{
                        ...typography.labelM,
                        color: selectedMonth === i ? colour.info : colour.primary,
                      }}
                    >
                      {m.month}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ ...typography.labelS, color: colour.primary, marginBottom: 2 }}>{m.year}</Text>
                    <Text style={{ ...typography.bodyXS, color: colour.textSub }}>
                      R {m.amount.toLocaleString()} • {m.expenses} receipts
                    </Text>
                  </View>
                  <Text style={{ ...typography.labelS, color: colour.info, marginLeft: 8 }}>
                    +R {m.saved.toLocaleString()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}
