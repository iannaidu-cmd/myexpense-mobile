import { colour, radius, space, typography } from "@/tokens";
import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

interface CategoryData {
  name: string;
  icon: string;
  color: string;
  bg: string;
  amount: number;
  vat: number;
  items: number;
  pct: number;
  expenses?: Array<{ vendor: string; amount: number; date: string }>;
}

interface ITR12CategoryBreakdownProps {
  categories?: CategoryData[];
}

const DEFAULT_CATEGORIES: CategoryData[] = [
  {
    name: "Software & Tech",      icon: "💻", color: colour.midNavy2, bg: colour.primary50,
    amount: 12400, vat: 1617, items: 28, pct: 30,
    expenses: [
      { vendor: "Incredible Connection", amount: 1249, date: "12 Mar" },
      { vendor: "Adobe Creative Cloud",  amount: 649,  date: "7 Mar"  },
      { vendor: "Dion Wired",            amount: 3200, date: "3 Mar"  },
      { vendor: "Takealot",              amount: 899,  date: "28 Feb" },
    ],
  },
  { name: "Travel & Transport",    icon: "🚗", color: colour.info,     bg: colour.primary50, amount: 9200,  vat: 1200, items: 34, pct: 22 },
  { name: "Office & Stationery",   icon: "📁", color: colour.primary,  bg: colour.primary50, amount: 7800,  vat: 1017, items: 19, pct: 19 },
  { name: "Professional Services", icon: "📋", color: colour.teal,     bg: colour.tealLight, amount: 6100,  vat: 795,  items: 8,  pct: 15 },
  { name: "Meals & Entertainment", icon: "🍽️", color: colour.danger,   bg: colour.dangerBg,  amount: 3400,  vat: 443,  items: 22, pct: 8  },
  { name: "Home Office",           icon: "🏠", color: colour.info,     bg: colour.primary50, amount: 2100,  vat: 274,  items: 12, pct: 5  },
];

export function ITR12CategoryBreakdownScreen({
  categories = DEFAULT_CATEGORIES,
}: ITR12CategoryBreakdownProps) {
  const [selectedCat, setSelectedCat] = useState(0);
  const cat = categories[selectedCat];

  const taxSaved    = Math.round(cat.amount * 0.45);
  const mockExpenses = cat.expenses || [{ vendor: "Sample Vendor", amount: 1000, date: "Today" }];

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colour.background }}>

      {/* Header */}
      <View
        style={{
          paddingHorizontal: 24,
          paddingTop: 20,
          paddingBottom: 24,
          backgroundColor: colour.primary,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 16 }}>
          <Pressable style={{ padding: 4 }}>
            <Text style={{ color: "rgba(255,255,255,0.65)", fontSize: 22 }}>←</Text>
          </Pressable>
          <Text style={{ ...typography.labelM, color: colour.white, marginLeft: 8 }}>
            MyExpense
          </Text>
        </View>
        <Text style={{ ...typography.h3, color: colour.white, marginBottom: 6 }}>
          Category Breakdown
        </Text>
        <Text style={{ ...typography.bodyS, color: "rgba(255,255,255,0.5)" }}>
          Drill into each ITR12 expense category
        </Text>
      </View>

      {/* Category selector */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ paddingVertical: 16, paddingHorizontal: 20 }}
        contentContainerStyle={{ gap: 8 }}
      >
        {categories.map((c, i) => (
          <Pressable
            key={i}
            onPress={() => setSelectedCat(i)}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
              paddingVertical: 10,
              paddingHorizontal: 14,
              borderRadius: radius.md,
              borderWidth: 1.5,
              borderColor: selectedCat === i ? c.color : colour.border,
              backgroundColor: selectedCat === i ? c.color + "18" : colour.white,
            }}
          >
            <Text style={{ fontSize: 16 }}>{c.icon}</Text>
            <Text
              style={{
                ...typography.labelS,
                color: selectedCat === i ? c.color : colour.textSub,
              }}
            >
              {c.name.split(" ")[0]}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Selected category hero */}
      <View
        style={{
          marginHorizontal: 20,
          borderRadius: radius.lg,
          paddingVertical: 18,
          paddingHorizontal: 20,
          backgroundColor: cat.color,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 14 }}>
          <View
            style={{
              width: 52,
              height: 52,
              borderRadius: 16,
              backgroundColor: "rgba(255,255,255,0.18)",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ fontSize: 26 }}>{cat.icon}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ ...typography.h4, color: colour.white }}>{cat.name}</Text>
            <Text style={{ fontSize: 11, color: "rgba(255,255,255,0.65)", marginTop: 2 }}>
              Section 11(a) · {cat.items} expenses
            </Text>
          </View>
        </View>
        <View style={{ flexDirection: "row" }}>
          {[
            { label: "Total Gross", value: `R ${cat.amount.toLocaleString()}` },
            { label: "VAT (15%)",   value: `R ${cat.vat.toLocaleString()}`    },
            { label: "Tax Saved",   value: `R ${taxSaved.toLocaleString()}`   },
          ].map((s, i) => (
            <View key={i} style={{ flex: 1 }}>
              <Text style={{ color: "rgba(255,255,255,0.55)", fontSize: 10, marginBottom: 3 }}>
                {s.label}
              </Text>
              <Text style={{ color: colour.white, fontSize: 14, fontWeight: "800" }}>
                {s.value}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* % share card */}
      <View
        style={{
          marginHorizontal: 20,
          marginTop: 14,
          backgroundColor: colour.white,
          borderRadius: radius.lg,
          paddingVertical: 16,
          paddingHorizontal: 18,
          flexDirection: "row",
          alignItems: "center",
          gap: 20,
          borderWidth: 1,
          borderColor: colour.border,
        }}
      >
        <View
          style={{
            width: 72,
            height: 72,
            borderRadius: 36,
            backgroundColor: colour.surface1,
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Text style={{ ...typography.labelM, color: colour.text }}>{cat.pct}%</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ ...typography.labelM, color: colour.text, marginBottom: 4 }}>
            Share of total spend
          </Text>
          <Text style={{ ...typography.bodyXS, color: colour.textSub, lineHeight: 16 }}>
            {cat.name} represents {cat.pct}% of your total deductible expenses this tax year.
          </Text>
        </View>
      </View>

      {/* Mini trend bars */}
      <View
        style={{
          marginHorizontal: 20,
          marginTop: 14,
          backgroundColor: colour.white,
          borderRadius: radius.lg,
          paddingVertical: 16,
          paddingHorizontal: 18,
          borderWidth: 1,
          borderColor: colour.border,
        }}
      >
        <Text style={{ ...typography.labelM, color: colour.text, marginBottom: 12 }}>
          Monthly spend
        </Text>
        <View style={{ flexDirection: "row", alignItems: "flex-end", height: 50, gap: 5 }}>
          {[40, 65, 30, 80, 55, 90, 45, 70, 35, 60, 85, 50].map((h, i) => (
            <View key={i} style={{ flex: 1, alignItems: "center", gap: 3 }}>
              <View
                style={{
                  width: "100%",
                  height: Math.round(h * 0.44),
                  borderRadius: 3,
                  backgroundColor: i === 2 ? cat.color : cat.color + "40",
                }}
              />
              <Text style={{ fontSize: 7, color: colour.textSub }}>
                {"AJSONDFJM AMJJ"[i]}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* Expense list */}
      <Text
        style={{
          ...typography.labelS,
          color: colour.primary,
          letterSpacing: 0.5,
          paddingHorizontal: 20,
          paddingTop: 16,
          paddingBottom: 10,
        }}
      >
        Top expenses — {cat.name}
      </Text>
      <View style={{ paddingHorizontal: 20 }}>
        {mockExpenses.map((exp, i) => (
          <Pressable
            key={i}
            style={{
              backgroundColor: colour.white,
              borderRadius: radius.md,
              paddingVertical: 12,
              paddingHorizontal: 16,
              marginBottom: 8,
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
              <Text style={{ fontSize: 16 }}>{cat.icon}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ ...typography.labelM, color: colour.primary }}>{exp.vendor}</Text>
              <Text style={{ ...typography.bodyXS, color: colour.textSub }}>
                {exp.date} · {cat.name}
              </Text>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={{ ...typography.labelM, color: colour.primary }}>
                R {exp.amount.toLocaleString()}
              </Text>
              <Text style={{ ...typography.micro, color: colour.info }}>✓ DEDUCTIBLE</Text>
            </View>
          </Pressable>
        ))}
      </View>

      <View style={{ height: 24 }} />
    </ScrollView>
  );
}
