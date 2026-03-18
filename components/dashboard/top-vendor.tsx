import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useThemeColor } from "@/hooks/use-theme-color";
import { useState } from "react";
import { ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";

interface TopVendorScreenProps {
  navigation?: any;
}

interface VendorItem {
  name: string;
  icon: string;
  category: string;
  total: number;
  visits: number;
  lastDate: string;
  deductible: boolean;
  itr12: string | null;
  avgPerVisit: number;
}

// ─── Mock Vendor Data ────────────────────────────────────────────────────────
const VENDORS: VendorItem[] = [
  {
    name: "Eskom",
    icon: "⚡",
    category: "Utilities",
    total: 3240,
    visits: 6,
    lastDate: "12 Mar 2025",
    deductible: true,
    itr12: "S11(a)",
    avgPerVisit: 540,
  },
  {
    name: "Takealot",
    icon: "📦",
    category: "Equipment",
    total: 2850,
    visits: 4,
    lastDate: "8 Mar 2025",
    deductible: true,
    itr12: "S11(e)",
    avgPerVisit: 712,
  },
  {
    name: "Garage 4 Cars",
    icon: "🚗",
    category: "Travel",
    total: 2640,
    visits: 8,
    lastDate: "15 Mar 2025",
    deductible: true,
    itr12: "S11(a)",
    avgPerVisit: 330,
  },
  {
    name: "Checkers",
    icon: "🛒",
    category: "Personal",
    total: 2100,
    visits: 9,
    lastDate: "14 Mar 2025",
    deductible: false,
    itr12: null,
    avgPerVisit: 233,
  },
  {
    name: "Microsoft 365",
    icon: "💼",
    category: "Software",
    total: 1980,
    visits: 6,
    lastDate: "1 Mar 2025",
    deductible: true,
    itr12: "S11(a)",
    avgPerVisit: 330,
  },
  {
    name: "Discovery Health",
    icon: "🏥",
    category: "Medical",
    total: 1760,
    visits: 6,
    lastDate: "1 Mar 2025",
    deductible: false,
    itr12: null,
    avgPerVisit: 293,
  },
  {
    name: "Incredible Conn.",
    icon: "🖥",
    category: "Equipment",
    total: 1550,
    visits: 2,
    lastDate: "22 Feb 2025",
    deductible: true,
    itr12: "S11(e)",
    avgPerVisit: 775,
  },
  {
    name: "Standard Bank",
    icon: "🏦",
    category: "Bank Fees",
    total: 1200,
    visits: 6,
    lastDate: "28 Feb 2025",
    deductible: true,
    itr12: "S11(a)",
    avgPerVisit: 200,
  },
  {
    name: "Uber",
    icon: "🚕",
    category: "Travel",
    total: 980,
    visits: 12,
    lastDate: "13 Mar 2025",
    deductible: true,
    itr12: "S11(a)",
    avgPerVisit: 82,
  },
  {
    name: "BP Garage",
    icon: "⛽",
    category: "Travel",
    total: 870,
    visits: 7,
    lastDate: "11 Mar 2025",
    deductible: true,
    itr12: "S11(a)",
    avgPerVisit: 124,
  },
];

const GRAND_TOTAL = VENDORS.reduce((s, v) => s + v.total, 0);

// ─── Vendor Card Component ────────────────────────────────────────────────────
interface VendorCardProps {
  item: VendorItem;
  rank: number;
  onPress: () => void;
}

function VendorCard({ item, rank, onPress }: VendorCardProps) {
  const pct = ((item.total / GRAND_TOTAL) * 100).toFixed(1);
  const rankColors = ["#FFD700", "#C0C0C0", "#CD7F32"];
  const rankBg = rank <= 3 ? rankColors[rank - 1] : "#F5F5F5";
  const rankTextColor = rank <= 3 ? "#333" : "#757575";

  return (
    <TouchableOpacity onPress={onPress} style={styles.vendorCard}>
      {/* Rank badge */}
      <View style={[styles.rankBadge, { backgroundColor: rankBg }]}>
        <ThemedText style={[styles.rankText, { color: rankTextColor }]}>
          {rank}
        </ThemedText>
      </View>

      {/* Icon + Name */}
      <View style={styles.vendorIcon}>
        <ThemedText style={styles.vendorIconEmoji}>{item.icon}</ThemedText>
      </View>

      <View style={styles.vendorInfo}>
        <View style={styles.vendorNameRow}>
          <ThemedText type="defaultSemiBold" style={styles.vendorName}>
            {item.name}
          </ThemedText>
          {item.deductible && (
            <View style={styles.itr12Badge}>
              <ThemedText style={styles.itr12BadgeText}>ITR12</ThemedText>
            </View>
          )}
        </View>
        <ThemedText style={[styles.vendorCategory, { color: "#757575" }]}>
          {item.category} · {item.visits} transactions · avg R{item.avgPerVisit}
        </ThemedText>
        <View style={styles.vendorProgressBar}>
          <View
            style={[
              styles.vendorProgressFill,
              {
                width: `${pct}%`,
                backgroundColor: item.deductible ? "#0288D1" : "#E0E0E0",
              } as any,
            ]}
          />
        </View>
      </View>

      <View style={styles.vendorAmount}>
        <ThemedText type="defaultSemiBold" style={styles.vendorTotal}>
          R {item.total.toLocaleString()}
        </ThemedText>
        <ThemedText style={[styles.vendorPercent, { color: "#757575" }]}>
          {pct}%
        </ThemedText>
      </View>
    </TouchableOpacity>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export function TopVendorScreen({ navigation }: TopVendorScreenProps) {
  const [filter, setFilter] = useState("All");
  const [sortBy, setSortBy] = useState("Spend");
  const filters = ["All", "Deductible", "Personal"];
  const sorts = ["Spend", "Visits", "Avg"];

  const bgColor = useThemeColor({}, "background");
  const headerBg = "#1565C0";
  const accentColor = "#0288D1";

  const filtered = VENDORS.filter((v) => {
    if (filter === "Deductible") return v.deductible;
    if (filter === "Personal") return !v.deductible;
    return true;
  }).sort((a, b) => {
    if (sortBy === "Visits") return b.visits - a.visits;
    if (sortBy === "Avg") return b.avgPerVisit - a.avgPerVisit;
    return b.total - a.total;
  });

  const deductTotal = VENDORS.filter((v) => v.deductible).reduce(
    (s, v) => s + v.total,
    0,
  );

  return (
    <ThemedView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: headerBg }]}>
          <TouchableOpacity onPress={() => navigation?.goBack()}>
            <ThemedText style={[styles.backButton, { color: accentColor }]}>
              ‹ Reports
            </ThemedText>
          </TouchableOpacity>
          <ThemedText style={[styles.headerLabel, { color: accentColor }]}>
            TOP VENDORS
          </ThemedText>
          <ThemedText style={styles.headerTitle}>Supplier Spending</ThemedText>
          <ThemedText style={[styles.headerSubtitle, { color: "#757575" }]}>
            {VENDORS.length} vendors · March 2025
          </ThemedText>
        </View>

        {/* Content */}
        <View style={[styles.content, { backgroundColor: bgColor }]}>
          {/* Summary Cards */}
          <View style={styles.summaryRow}>
            <View style={[styles.summaryCard, { backgroundColor: headerBg }]}>
              <ThemedText style={[styles.summaryLabel, { color: "#757575" }]}>
                Total Spend
              </ThemedText>
              <ThemedText style={[styles.summaryValue, { color: "#FFFFFF" }]}>
                R {GRAND_TOTAL.toLocaleString()}
              </ThemedText>
              <ThemedText style={[styles.summaryDetail, { color: "#757575" }]}>
                {VENDORS.length} vendors
              </ThemedText>
            </View>
            <View
              style={[
                styles.summaryCard,
                { borderColor: "#E0E0E0", borderWidth: 1 },
              ]}
            >
              <ThemedText style={[styles.summaryLabel, { color: "#757575" }]}>
                Deductible
              </ThemedText>
              <ThemedText style={[styles.summaryValue, { color: "#27AE60" }]}>
                R {deductTotal.toLocaleString()}
              </ThemedText>
              <ThemedText style={[styles.summaryDetail, { color: "#757575" }]}>
                {((deductTotal / GRAND_TOTAL) * 100).toFixed(0)}% of total
              </ThemedText>
            </View>
          </View>

          {/* Top 3 Podium */}
          <ThemedView style={styles.podiumCard}>
            <ThemedText type="defaultSemiBold" style={styles.podiumTitle}>
              Top 3 Vendors
            </ThemedText>
            <View style={styles.podiumRow}>
              {VENDORS.slice(0, 3).map((v, i) => {
                const medals = ["🥇", "🥈", "🥉"];
                return (
                  <View
                    key={i}
                    style={[styles.podiumItem, { backgroundColor: "#F5F5F5" }]}
                  >
                    <ThemedText style={styles.podiumMedal}>
                      {medals[i]}
                    </ThemedText>
                    <ThemedText style={styles.podiumIcon}>{v.icon}</ThemedText>
                    <ThemedText style={[styles.podiumName]} numberOfLines={1}>
                      {v.name}
                    </ThemedText>
                    <ThemedText
                      type="defaultSemiBold"
                      style={styles.podiumAmount}
                    >
                      R{(v.total / 1000).toFixed(1)}k
                    </ThemedText>
                  </View>
                );
              })}
            </View>
          </ThemedView>

          {/* Filter & Sort */}
          <View style={styles.filterContainer}>
            <View style={styles.filterTabRow}>
              {filters.map((f) => (
                <TouchableOpacity
                  key={f}
                  onPress={() => setFilter(f)}
                  style={[
                    styles.filterTab,
                    {
                      backgroundColor: filter === f ? headerBg : "#E8EAF6",
                    },
                  ]}
                >
                  <ThemedText
                    style={[
                      styles.filterTabText,
                      {
                        color: filter === f ? "#FFFFFF" : "#757575",
                      },
                    ]}
                  >
                    {f}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.sortRow}>
              <ThemedText style={[styles.sortLabel, { color: "#757575" }]}>
                Sort by:
              </ThemedText>
              {sorts.map((s) => (
                <TouchableOpacity
                  key={s}
                  onPress={() => setSortBy(s)}
                  style={[
                    styles.sortButton,
                    {
                      backgroundColor: sortBy === s ? accentColor : "#E8EAF6",
                    },
                  ]}
                >
                  <ThemedText
                    style={[
                      styles.sortButtonText,
                      {
                        color: sortBy === s ? "#FFFFFF" : "#757575",
                      },
                    ]}
                  >
                    {s}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Vendor List */}
          <View style={[styles.vendorList, { borderColor: "#E0E0E0" }]}>
            {filtered.map((v, i) => (
              <VendorCard
                key={i}
                item={v}
                rank={VENDORS.indexOf(v) + 1}
                onPress={() =>
                  navigation?.navigate("ExpenseHistory", {
                    vendor: v.name,
                  })
                }
              />
            ))}
          </View>

          {/* Export Note */}
          <View style={[styles.exportNote, { backgroundColor: "#E8EAF6" }]}>
            <ThemedText style={styles.exportIcon}>📤</ThemedText>
            <ThemedText style={[styles.exportText, { color: "#757575" }]}>
              Vendors tagged with ITR12 contribute to your Section 11(a)
              deductions. Export this report for your tax practitioner.
            </ThemedText>
          </View>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 52,
    paddingBottom: 28,
    paddingHorizontal: 20,
  },
  backButton: {
    fontSize: 13,
    marginBottom: 10,
  },
  headerLabel: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "800",
    marginTop: 4,
    color: "#FFFFFF",
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 4,
  },
  content: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -16,
    paddingTop: 20,
    paddingHorizontal: 16,
    paddingBottom: 30,
  },
  summaryRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 16,
  },
  summaryCard: {
    flex: 1,
    borderRadius: 14,
    padding: 14,
  },
  summaryLabel: {
    fontSize: 11,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: "800",
    marginTop: 4,
  },
  summaryDetail: {
    fontSize: 10,
    marginTop: 4,
  },
  podiumCard: {
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    marginBottom: 16,
  },
  podiumTitle: {
    fontSize: 13,
    marginBottom: 12,
  },
  podiumRow: {
    flexDirection: "row",
    gap: 8,
  },
  podiumItem: {
    flex: 1,
    alignItems: "center",
    borderRadius: 10,
    padding: 12,
  },
  podiumMedal: {
    fontSize: 22,
  },
  podiumIcon: {
    fontSize: 20,
    marginTop: 4,
  },
  podiumName: {
    fontSize: 11,
    fontWeight: "700",
    marginTop: 4,
    textAlign: "center",
  },
  podiumAmount: {
    fontSize: 12,
    color: "#1565C0",
    marginTop: 4,
  },
  filterContainer: {
    paddingHorizontal: 0,
    marginBottom: 8,
  },
  filterTabRow: {
    flexDirection: "row",
    backgroundColor: "#E8EAF6",
    borderRadius: 10,
    padding: 3,
    marginBottom: 8,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 8,
    alignItems: "center",
  },
  filterTabText: {
    fontSize: 11,
    fontWeight: "600",
  },
  sortRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  sortLabel: {
    fontSize: 12,
    marginRight: 8,
  },
  sortButton: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    marginRight: 6,
  },
  sortButtonText: {
    fontSize: 11,
    fontWeight: "600",
  },
  vendorList: {
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 1,
    marginBottom: 16,
  },
  vendorCard: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  rankBadge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  rankText: {
    fontSize: 12,
    fontWeight: "800",
  },
  vendorIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#E8EAF6",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  vendorIconEmoji: {
    fontSize: 18,
  },
  vendorInfo: {
    flex: 1,
  },
  vendorNameRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  vendorName: {
    fontSize: 13,
    flex: 1,
  },
  itr12Badge: {
    backgroundColor: "#E8F8F3",
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  itr12BadgeText: {
    fontSize: 9,
    color: "#27AE60",
    fontWeight: "700",
  },
  vendorCategory: {
    fontSize: 11,
    marginTop: 1,
  },
  vendorProgressBar: {
    height: 4,
    backgroundColor: "#F5F5F5",
    borderRadius: 2,
    marginTop: 6,
    overflow: "hidden",
  },
  vendorProgressFill: {
    height: 4,
    borderRadius: 2,
  },
  vendorAmount: {
    alignItems: "flex-end",
    marginLeft: 12,
  },
  vendorTotal: {
    fontSize: 14,
    color: "#1565C0",
  },
  vendorPercent: {
    fontSize: 11,
  },
  exportNote: {
    borderRadius: 12,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
  },
  exportIcon: {
    fontSize: 18,
    marginRight: 10,
  },
  exportText: {
    flex: 1,
    fontSize: 11,
    lineHeight: 16,
  },
});
