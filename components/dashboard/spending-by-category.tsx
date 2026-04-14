import { colour, radius, space, typography } from "@/tokens";
import { useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";

interface SpendingByCategoryScreenProps {
  navigation?: any;
}

interface Category {
  category: string;
  itr12Code: string;
  amount: number;
  color: string;
  deductible: boolean;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────
const CATEGORIES: Category[] = [
  { category: "Travel & Transport",  itr12Code: "ITR12 – S11(a)", amount: 4200, color: colour.primary,    deductible: true  },
  { category: "Home Office",         itr12Code: "ITR12 – S11(a)", amount: 3100, color: colour.info,       deductible: true  },
  { category: "Equipment & Tools",   itr12Code: "ITR12 – S11(e)", amount: 2800, color: colour.midNavy2,   deductible: true  },
  { category: "Meals & Entertain.",  itr12Code: "ITR12 – S11(a)", amount: 1950, color: colour.warning,    deductible: true  },
  { category: "Software & Subscr.",  itr12Code: "ITR12 – S11(a)", amount: 1640, color: colour.success,    deductible: true  },
  { category: "Professional Fees",   itr12Code: "ITR12 – S11(a)", amount: 1200, color: colour.danger,     deductible: true  },
  { category: "Utilities",           itr12Code: "ITR12 – S11(a)", amount: 980,  color: colour.accent,     deductible: true  },
  { category: "Personal / Other",    itr12Code: "Non-deductible",  amount: 2550, color: colour.textDisabled, deductible: false },
];

const TOTAL     = CATEGORIES.reduce((s, c) => s + c.amount, 0);
const TAX_TOTAL = CATEGORIES.filter((c) => c.deductible).reduce((s, c) => s + c.amount, 0);

// ─── Category Row ─────────────────────────────────────────────────────────────
function CategoryRow({
  item,
  total,
  onPress,
}: {
  item: Category;
  total: number;
  onPress?: () => void;
}) {
  const pct = ((item.amount / total) * 100).toFixed(1);

  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: colour.border,
        backgroundColor: colour.white,
      }}
    >
      <View
        style={{
          width: 12,
          height: 12,
          borderRadius: 6,
          backgroundColor: item.color,
          marginRight: 12,
        }}
      />
      <View style={{ flex: 1 }}>
        <Text style={{ ...typography.labelM, color: colour.text }}>
          {item.category}
        </Text>
        <Text style={{ ...typography.bodyXS, color: colour.textSub, marginTop: 2 }}>
          {item.itr12Code}
        </Text>
        <View
          style={{
            height: 4,
            borderRadius: 2,
            backgroundColor: colour.surface1,
            marginTop: 6,
            overflow: "hidden",
          }}
        >
          <View
            style={{
              width: `${pct}%` as any,
              height: 4,
              borderRadius: 2,
              backgroundColor: item.color,
            }}
          />
        </View>
      </View>
      <View style={{ alignItems: "flex-end", marginLeft: 12 }}>
        <Text style={{ ...typography.labelM, color: colour.primary }}>
          R {item.amount.toLocaleString()}
        </Text>
        <Text style={{ ...typography.bodyXS, color: colour.textSub, marginTop: 2 }}>
          {pct}%
        </Text>
        {item.deductible ? (
          <Text
            style={{ ...typography.micro, color: colour.success, fontWeight: "600", marginTop: 2 }}
          >
            ✓ Deductible
          </Text>
        ) : (
          <Text style={{ ...typography.micro, color: colour.textSub, marginTop: 2 }}>
            Personal
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export function SpendingByCategoryScreen({ navigation }: SpendingByCategoryScreenProps) {
  const [sort, setSort]         = useState("Amount");
  const [viewMode, setViewMode] = useState("All");

  const SORTS = ["Amount", "Category", "Deductible"];
  const VIEWS = ["All", "Deductible", "Personal"];

  const filtered = CATEGORIES.filter((c) => {
    if (viewMode === "Deductible") return c.deductible;
    if (viewMode === "Personal")   return !c.deductible;
    return true;
  }).sort((a, b) => {
    if (sort === "Amount")     return b.amount - a.amount;
    if (sort === "Category")   return a.category.localeCompare(b.category);
    return b.deductible === a.deductible ? 0 : b.deductible ? -1 : 1;
  });

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
            SPENDING BY CATEGORY
          </Text>
          <Text style={{ color: colour.white, fontSize: 22, fontWeight: "800", marginTop: 4 }}>
            Category Breakdown
          </Text>
          <Text style={{ color: colour.textSub, fontSize: 12, marginTop: 4 }}>
            March 2025 · ITR12 mapped
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
          {/* Summary cards */}
          <View style={{ flexDirection: "row", gap: 10, marginBottom: 16 }}>
            <View
              style={{
                flex: 1,
                borderRadius: radius.md,
                padding: 14,
                backgroundColor: colour.primary,
              }}
            >
              <Text style={{ ...typography.bodyXS, color: colour.primary100 }}>
                Total Spend
              </Text>
              <Text style={{ ...typography.amountS, color: colour.white, marginTop: 2 }}>
                R {TOTAL.toLocaleString()}
              </Text>
            </View>
            <View
              style={{
                flex: 1,
                borderRadius: radius.md,
                padding: 14,
                backgroundColor: colour.white,
                borderWidth: 1,
                borderColor: colour.border,
              }}
            >
              <Text style={{ ...typography.bodyXS, color: colour.textSub }}>
                Deductible
              </Text>
              <Text style={{ ...typography.amountS, color: colour.success, marginTop: 2 }}>
                R {TAX_TOTAL.toLocaleString()}
              </Text>
            </View>
          </View>

          {/* Chart — simplified colour-coded legend */}
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
            <Text style={{ ...typography.labelM, color: colour.text, marginBottom: 4 }}>
              Spend Distribution
            </Text>
            {/* Stacked bar */}
            <View
              style={{
                flexDirection: "row",
                height: 12,
                borderRadius: radius.pill,
                overflow: "hidden",
                marginVertical: 10,
              }}
            >
              {CATEGORIES.slice(0, 6).map((c, i) => (
                <View
                  key={i}
                  style={{
                    flex: c.amount / TOTAL,
                    backgroundColor: c.color,
                    opacity: 0.85,
                  }}
                />
              ))}
            </View>
            {/* Legend */}
            <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
              {CATEGORIES.slice(0, 6).map((c, i) => (
                <View
                  key={i}
                  style={{ flexDirection: "row", alignItems: "center", width: "50%", marginBottom: 6, paddingHorizontal: 4 }}
                >
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: c.color, marginRight: 6 }} />
                  <Text style={{ ...typography.micro, color: colour.textSub, flex: 1 }} numberOfLines={1}>
                    {c.category.split(" ")[0]}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* View toggle */}
          <View style={{ marginBottom: 8 }}>
            <View
              style={{
                flexDirection: "row",
                backgroundColor: colour.surface1,
                borderRadius: radius.md,
                padding: 3,
              }}
            >
              {VIEWS.map((v) => (
                <TouchableOpacity
                  key={v}
                  onPress={() => setViewMode(v)}
                  style={{
                    flex: 1,
                    paddingVertical: 7,
                    borderRadius: radius.sm,
                    backgroundColor: viewMode === v ? colour.primary : "transparent",
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{
                      ...typography.labelS,
                      color: viewMode === v ? colour.onPrimary : colour.textSub,
                    }}
                  >
                    {v}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Sort row */}
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
            <Text style={{ ...typography.bodyS, color: colour.textSub, marginRight: 8 }}>
              Sort:
            </Text>
            {SORTS.map((s) => (
              <TouchableOpacity
                key={s}
                onPress={() => setSort(s)}
                style={{
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                  borderRadius: radius.pill,
                  marginRight: 6,
                  backgroundColor: sort === s ? colour.primary : colour.surface1,
                }}
              >
                <Text
                  style={{
                    ...typography.labelS,
                    color: sort === s ? colour.onPrimary : colour.textSub,
                  }}
                >
                  {s}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Category list */}
          <View
            style={{
              backgroundColor: colour.white,
              borderRadius: radius.md,
              overflow: "hidden",
              borderWidth: 1,
              borderColor: colour.border,
            }}
          >
            {filtered.map((item, i) => (
              <CategoryRow
                key={i}
                item={item}
                total={TOTAL}
                onPress={() =>
                  navigation?.navigate("ExpenseHistory", { category: item.category })
                }
              />
            ))}
          </View>

          {/* ITR12 note */}
          <View
            style={{
              backgroundColor: colour.infoLight,
              borderRadius: radius.md,
              padding: 14,
              flexDirection: "row",
              alignItems: "flex-start",
              marginTop: 16,
            }}
          >
            <Text style={{ fontSize: 18, marginRight: 10 }}>ℹ️</Text>
            <Text style={{ ...typography.bodyXS, color: colour.info, flex: 1, lineHeight: 16 }}>
              Categories tagged "Deductible" are mapped to SARS ITR12 Section
              11(a) and related provisions. Keep receipts for 5 years per SARS
              requirements.
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
