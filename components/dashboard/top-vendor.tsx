// ─── top-vendor.tsx ───────────────────────────────────────────────────────────
import { colour, radius, space, typography } from "@/tokens";
import { useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";

interface VendorItem {
  name: string; icon: string; category: string;
  total: number; visits: number; lastDate: string;
  deductible: boolean; itr12: string | null; avgPerVisit: number;
}

const VENDORS: VendorItem[] = [
  { name: "Eskom",            icon: "⚡", category: "Utilities",  total: 3240, visits: 6,  lastDate: "12 Mar 2025", deductible: true,  itr12: "S11(a)", avgPerVisit: 540 },
  { name: "Takealot",         icon: "📦", category: "Equipment",  total: 2850, visits: 4,  lastDate: "8 Mar 2025",  deductible: true,  itr12: "S11(e)", avgPerVisit: 712 },
  { name: "Garage 4 Cars",    icon: "🚗", category: "Travel",     total: 2640, visits: 8,  lastDate: "15 Mar 2025", deductible: true,  itr12: "S11(a)", avgPerVisit: 330 },
  { name: "Checkers",         icon: "🛒", category: "Personal",   total: 2100, visits: 9,  lastDate: "14 Mar 2025", deductible: false, itr12: null,     avgPerVisit: 233 },
  { name: "Microsoft 365",    icon: "💼", category: "Software",   total: 1980, visits: 6,  lastDate: "1 Mar 2025",  deductible: true,  itr12: "S11(a)", avgPerVisit: 330 },
  { name: "Discovery Health", icon: "🏥", category: "Medical",    total: 1760, visits: 6,  lastDate: "1 Mar 2025",  deductible: false, itr12: null,     avgPerVisit: 293 },
  { name: "Incredible Conn.", icon: "🖥",  category: "Equipment",  total: 1550, visits: 2,  lastDate: "22 Feb 2025", deductible: true,  itr12: "S11(e)", avgPerVisit: 775 },
  { name: "Standard Bank",    icon: "🏦", category: "Bank Fees",  total: 1200, visits: 6,  lastDate: "28 Feb 2025", deductible: true,  itr12: "S11(a)", avgPerVisit: 200 },
  { name: "Uber",             icon: "🚕", category: "Travel",     total: 980,  visits: 12, lastDate: "13 Mar 2025", deductible: true,  itr12: "S11(a)", avgPerVisit: 82  },
  { name: "BP Garage",        icon: "⛽", category: "Travel",     total: 870,  visits: 7,  lastDate: "11 Mar 2025", deductible: true,  itr12: "S11(a)", avgPerVisit: 124 },
];

const GRAND_TOTAL  = VENDORS.reduce((s, v) => s + v.total, 0);
const RANK_COLOURS = [colour.gold, "#C0C0C0", "#CD7F32"]; // gold / silver / bronze

function VendorCard({ item, rank, onPress }: { item: VendorItem; rank: number; onPress: () => void }) {
  const pct          = ((item.total / GRAND_TOTAL) * 100).toFixed(1);
  const rankBg       = rank <= 3 ? RANK_COLOURS[rank - 1] : colour.surface1;
  const rankTextColor = rank <= 3 ? colour.text : colour.textSub;

  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: colour.border,
        backgroundColor: colour.white,
      }}
    >
      {/* Rank badge */}
      <View
        style={{
          width: 28,
          height: 28,
          borderRadius: radius.sm,
          backgroundColor: rankBg,
          alignItems: "center",
          justifyContent: "center",
          marginRight: 12,
        }}
      >
        <Text style={{ fontSize: 12, fontWeight: "800", color: rankTextColor }}>{rank}</Text>
      </View>

      {/* Icon */}
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: radius.sm,
          backgroundColor: colour.surface2,
          alignItems: "center",
          justifyContent: "center",
          marginRight: 12,
        }}
      >
        <Text style={{ fontSize: 18 }}>{item.icon}</Text>
      </View>

      {/* Info */}
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Text style={{ ...typography.labelM, color: colour.text, flex: 1 }}>{item.name}</Text>
          {item.deductible && (
            <View
              style={{
                backgroundColor: colour.successBg,
                borderRadius: radius.sm,
                paddingHorizontal: 6,
                paddingVertical: 2,
              }}
            >
              <Text style={{ ...typography.micro, color: colour.success, fontWeight: "700" }}>ITR12</Text>
            </View>
          )}
        </View>
        <Text style={{ ...typography.bodyXS, color: colour.textSub, marginTop: 1 }}>
          {item.category} · {item.visits} transactions · avg R{item.avgPerVisit}
        </Text>
        <View
          style={{
            height: 4,
            backgroundColor: colour.surface1,
            borderRadius: 2,
            marginTop: 6,
            overflow: "hidden",
          }}
        >
          <View
            style={{
              width: `${pct}%` as any,
              height: 4,
              borderRadius: 2,
              backgroundColor: item.deductible ? colour.info : colour.border,
            }}
          />
        </View>
      </View>

      {/* Amount */}
      <View style={{ alignItems: "flex-end", marginLeft: 12 }}>
        <Text style={{ ...typography.labelM, color: colour.primary }}>R {item.total.toLocaleString()}</Text>
        <Text style={{ ...typography.bodyXS, color: colour.textSub }}>{pct}%</Text>
      </View>
    </TouchableOpacity>
  );
}

interface TopVendorScreenProps { navigation?: any; }

export function TopVendorScreen({ navigation }: TopVendorScreenProps) {
  const [filter, setFilter] = useState("All");
  const [sortBy, setSortBy] = useState("Spend");
  const FILTERS = ["All", "Deductible", "Personal"];
  const SORTS   = ["Spend", "Visits", "Avg"];

  const deductTotal = VENDORS.filter((v) => v.deductible).reduce((s, v) => s + v.total, 0);

  const filtered = VENDORS.filter((v) => {
    if (filter === "Deductible") return v.deductible;
    if (filter === "Personal")   return !v.deductible;
    return true;
  }).sort((a, b) => {
    if (sortBy === "Visits") return b.visits - a.visits;
    if (sortBy === "Avg")    return b.avgPerVisit - a.avgPerVisit;
    return b.total - a.total;
  });

  return (
    <View style={{ flex: 1, backgroundColor: colour.white }}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View
          style={{ backgroundColor: colour.primary, paddingTop: 52, paddingBottom: 28, paddingHorizontal: 20 }}
        >
          <TouchableOpacity onPress={() => navigation?.goBack()}>
            <Text style={{ color: colour.teal, fontSize: 13, marginBottom: 10 }}>‹ Reports</Text>
          </TouchableOpacity>
          <Text style={{ color: colour.teal, fontSize: 12, fontWeight: "600", letterSpacing: 1 }}>
            TOP VENDORS
          </Text>
          <Text style={{ color: colour.white, fontSize: 22, fontWeight: "800", marginTop: 4 }}>
            Supplier Spending
          </Text>
          <Text style={{ color: colour.textSub, fontSize: 12, marginTop: 4 }}>
            {VENDORS.length} vendors · March 2025
          </Text>
        </View>

        {/* Body */}
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
            <View style={{ flex: 1, borderRadius: radius.md, padding: 14, backgroundColor: colour.primary }}>
              <Text style={{ ...typography.bodyXS, color: colour.primary100 }}>Total Spend</Text>
              <Text style={{ ...typography.amountS, color: colour.white, marginTop: 4 }}>R {GRAND_TOTAL.toLocaleString()}</Text>
              <Text style={{ ...typography.micro, color: colour.primary100, marginTop: 4 }}>{VENDORS.length} vendors</Text>
            </View>
            <View style={{ flex: 1, borderRadius: radius.md, padding: 14, backgroundColor: colour.white, borderWidth: 1, borderColor: colour.border }}>
              <Text style={{ ...typography.bodyXS, color: colour.textSub }}>Deductible</Text>
              <Text style={{ ...typography.amountS, color: colour.success, marginTop: 4 }}>R {deductTotal.toLocaleString()}</Text>
              <Text style={{ ...typography.micro, color: colour.textSub, marginTop: 4 }}>
                {((deductTotal / GRAND_TOTAL) * 100).toFixed(0)}% of total
              </Text>
            </View>
          </View>

          {/* Top 3 podium */}
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
            <Text style={{ ...typography.labelM, color: colour.text, marginBottom: 12 }}>Top 3 Vendors</Text>
            <View style={{ flexDirection: "row", gap: 8 }}>
              {VENDORS.slice(0, 3).map((v, i) => {
                const medals = ["🥇", "🥈", "🥉"];
                return (
                  <View
                    key={i}
                    style={{
                      flex: 1,
                      alignItems: "center",
                      borderRadius: radius.sm,
                      padding: 12,
                      backgroundColor: colour.surface1,
                    }}
                  >
                    <Text style={{ fontSize: 22 }}>{medals[i]}</Text>
                    <Text style={{ fontSize: 20, marginTop: 4 }}>{v.icon}</Text>
                    <Text style={{ ...typography.labelS, marginTop: 4, textAlign: "center" }} numberOfLines={1}>
                      {v.name}
                    </Text>
                    <Text style={{ ...typography.labelS, color: colour.primary, marginTop: 4 }}>
                      R{(v.total / 1000).toFixed(1)}k
                    </Text>
                  </View>
                );
              })}
            </View>

            {/* Filter + sort */}
            <View
              style={{
                flexDirection: "row",
                backgroundColor: colour.surface2,
                borderRadius: radius.sm,
                padding: 3,
                marginTop: 16,
                marginBottom: 8,
              }}
            >
              {FILTERS.map((f) => (
                <TouchableOpacity
                  key={f}
                  onPress={() => setFilter(f)}
                  style={{
                    flex: 1,
                    paddingVertical: 7,
                    borderRadius: radius.sm,
                    backgroundColor: filter === f ? colour.primary : "transparent",
                    alignItems: "center",
                  }}
                >
                  <Text style={{ ...typography.labelS, color: filter === f ? colour.onPrimary : colour.textSub }}>{f}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Text style={{ ...typography.bodyS, color: colour.textSub, marginRight: 8 }}>Sort by:</Text>
              {SORTS.map((s) => (
                <TouchableOpacity
                  key={s}
                  onPress={() => setSortBy(s)}
                  style={{
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                    borderRadius: radius.pill,
                    marginRight: 6,
                    backgroundColor: sortBy === s ? colour.info : colour.surface2,
                  }}
                >
                  <Text style={{ ...typography.labelS, color: sortBy === s ? colour.white : colour.textSub }}>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Vendor list */}
          <View
            style={{
              borderRadius: radius.md,
              overflow: "hidden",
              borderWidth: 1,
              borderColor: colour.border,
              marginBottom: 16,
            }}
          >
            {filtered.map((v, i) => (
              <VendorCard
                key={i}
                item={v}
                rank={VENDORS.indexOf(v) + 1}
                onPress={() => navigation?.navigate("ExpenseHistory", { vendor: v.name })}
              />
            ))}
          </View>

          {/* Export note */}
          <View
            style={{
              backgroundColor: colour.surface2,
              borderRadius: radius.md,
              padding: 14,
              flexDirection: "row",
              alignItems: "center",
            }}
          >
            <Text style={{ fontSize: 18, marginRight: 10 }}>📤</Text>
            <Text style={{ ...typography.bodyXS, color: colour.textSub, flex: 1, lineHeight: 16 }}>
              Vendors tagged with ITR12 contribute to your Section 11(a) deductions.
              Export this report for your tax practitioner.
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
