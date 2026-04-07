import { ThemedText } from "@/components/themed-text";
import { useThemeColor } from "@/hooks/use-theme-color";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

interface TaxYear {
  label: string;
  range: string;
  current: boolean;
  expenses: number;
  saved: string;
  total: string;
  status: string;
  statusColor: string;
}

interface ITR12TaxYearSelectorProps {
  years?: TaxYear[];
  onYearSelect?: (year: string) => void;
}

const DEFAULT_YEARS: TaxYear[] = [
  {
    label: "2026",
    range: "1 Mar 2025 – 28 Feb 2026",
    current: true,
    expenses: 143,
    saved: "R 18,450",
    total: "R 41,000",
    status: "In progress",
    statusColor: "#0288D1",
  },
  {
    label: "2025",
    range: "1 Mar 2024 – 28 Feb 2025",
    current: false,
    expenses: 187,
    saved: "R 22,100",
    total: "R 49,200",
    status: "Filed",
    statusColor: "#0288D1",
  },
  {
    label: "2024",
    range: "1 Mar 2023 – 28 Feb 2024",
    current: false,
    expenses: 154,
    saved: "R 17,800",
    total: "R 39,500",
    status: "Filed",
    statusColor: "#0288D1",
  },
  {
    label: "2023",
    range: "1 Mar 2022 – 28 Feb 2023",
    current: false,
    expenses: 98,
    saved: "R 12,600",
    total: "R 28,000",
    status: "Filed",
    statusColor: "#0288D1",
  },
];

export function ITR12TaxYearSelectorScreen({
  years = DEFAULT_YEARS,
  onYearSelect,
}: ITR12TaxYearSelectorProps) {
  const [selected, setSelected] = useState(0);
  const backgroundColor = useThemeColor({}, "background");
  const sel = years[selected];

  const handleSelect = (index: number) => {
    setSelected(index);
    if (typeof onYearSelect === "function") {
      onYearSelect(years[index].label);
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Pressable style={styles.backButton}>
            <Text style={styles.backButtonText}>←</Text>
          </Pressable>
          <ThemedText style={styles.headerTitle}>MyExpense</ThemedText>
        </View>
        <ThemedText style={styles.headerMain}>Tax Year Selector</ThemedText>
        <ThemedText style={styles.headerSub}>
          Switch between SARS financial years
        </ThemedText>
      </View>

      {/* SARS year info */}
      <View style={styles.infoCard}>
        <Text style={styles.infoCardIcon}>📅</Text>
        <View style={styles.infoCardContent}>
          <ThemedText style={styles.infoCardTitle}>
            South African Tax Year
          </ThemedText>
          <Text style={styles.infoCardSub}>
            Runs from 1 March to 28/29 February each year
          </Text>
        </View>
      </View>

      {/* Year list */}
      <Text style={styles.yearListLabel}>SELECT TAX YEAR</Text>
      {years.map((yr, i) => (
        <Pressable
          key={i}
          onPress={() => handleSelect(i)}
          style={[
            styles.yearCard,
            {
              borderColor: selected === i ? "#0288D1" : "#E0E0E0",
            },
          ]}
        >
          <View style={styles.yearCardTop}>
            <View
              style={[
                styles.yearBadge,
                {
                  backgroundColor:
                    selected === i ? "rgba(2,136,209,0.12)" : "#F5F5F5",
                  borderColor: selected === i ? "#0288D1" : "#E0E0E0",
                },
              ]}
            >
              <ThemedText
                style={[
                  styles.yearBadgeNumber,
                  selected === i && styles.yearBadgeNumberActive,
                ]}
              >
                {yr.label}
              </ThemedText>
              {yr.current && <Text style={styles.yearBadgeCurrent}>NOW</Text>}
            </View>
            <View style={styles.yearInfo}>
              <View style={styles.yearStatus}>
                <ThemedText style={styles.yearTitle}>
                  Tax Year {yr.label}
                </ThemedText>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: yr.statusColor + "18" },
                  ]}
                >
                  <Text
                    style={[styles.statusBadgeText, { color: yr.statusColor }]}
                  >
                    {yr.status}
                  </Text>
                </View>
              </View>
              <Text style={styles.yearRange}>{yr.range}</Text>
            </View>
            <View
              style={[
                styles.selectRadio,
                { backgroundColor: selected === i ? "#0288D1" : "#E0E0E0" },
              ]}
            >
              {selected === i && <Text style={styles.selectRadioCheck}>✓</Text>}
            </View>
          </View>

          {/* Mini stats */}
          <View style={styles.yearStats}>
            {[
              { label: "Expenses", value: yr.expenses },
              { label: "Tax saved", value: yr.saved },
              { label: "Total", value: yr.total },
            ].map((s, j) => (
              <View
                key={j}
                style={[styles.yearStat, j > 0 && styles.yearStatBorder]}
              >
                <Text style={styles.yearStatLabel}>{s.label}</Text>
                <ThemedText
                  style={[
                    styles.yearStatValue,
                    j === 1 && styles.yearStatValueHighlight,
                  ]}
                >
                  {typeof s.value === "number" ? s.value : s.value}
                </ThemedText>
              </View>
            ))}
          </View>
        </Pressable>
      ))}

      {/* View selected year */}
      <Pressable style={styles.viewButton}>
        <Text style={styles.viewButtonText}>
          View {sel.label} Tax Summary →
        </Text>
      </Pressable>

      {/* Compare note */}
      <View style={styles.compareNote}>
        <Text style={styles.compareNoteIcon}>📊</Text>
        <Text style={styles.compareNoteText}>
          Compare year-on-year tax savings in Reports → Monthly Trend
        </Text>
      </View>

      <View style={{ height: 24 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 24,
    backgroundColor: "#1565C0",
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  backButton: {
    padding: 4,
  },
  backButtonText: {
    color: "rgba(255,255,255,0.65)",
    fontSize: 22,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
    color: "#fff",
  },
  headerMain: {
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 6,
    color: "#fff",
  },
  headerSub: {
    fontSize: 12,
    color: "rgba(255,255,255,0.5)",
  },
  infoCard: {
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 20,
    backgroundColor: "rgba(59,191,173,0.08)",
    borderWidth: 1.5,
    borderColor: "rgba(59,191,173,0.25)",
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  infoCardIcon: {
    fontSize: 24,
  },
  infoCardContent: {
    flex: 1,
  },
  infoCardTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#1A8A7A",
  },
  infoCardSub: {
    fontSize: 11,
    color: "#757575",
    marginTop: 2,
  },
  yearListLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#1565C0",
    letterSpacing: 0.5,
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  yearCard: {
    marginHorizontal: 20,
    marginBottom: 10,
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1.5,
    paddingVertical: 15,
    paddingHorizontal: 16,
  },
  yearCardTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  yearBadge: {
    width: 48,
    height: 48,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  yearBadgeNumber: {
    fontSize: 14,
    fontWeight: "900",
    color: "#1565C0",
  },
  yearBadgeNumberActive: {
    color: "#0288D1",
  },
  yearBadgeCurrent: {
    fontSize: 8,
    fontWeight: "700",
    color: "#0288D1",
  },
  yearInfo: {
    flex: 1,
  },
  yearStatus: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 2,
  },
  yearTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0D47A1",
  },
  statusBadge: {
    borderRadius: 20,
    paddingVertical: 2,
    paddingHorizontal: 8,
  },
  statusBadgeText: {
    fontSize: 9,
    fontWeight: "700",
  },
  yearRange: {
    fontSize: 11,
    color: "#757575",
  },
  selectRadio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    flexShrink: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  selectRadioCheck: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
  },
  yearStats: {
    flexDirection: "row",
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F5F5F5",
  },
  yearStat: {
    flex: 1,
  },
  yearStatBorder: {
    borderLeftWidth: 1,
    borderLeftColor: "#F5F5F5",
    paddingLeft: 12,
  },
  yearStatLabel: {
    fontSize: 9,
    color: "#757575",
    marginBottom: 2,
  },
  yearStatValue: {
    fontSize: 12,
    fontWeight: "800",
    color: "#1565C0",
  },
  yearStatValueHighlight: {
    color: "#0288D1",
  },
  viewButton: {
    marginHorizontal: 20,
    marginTop: 8,
    backgroundColor: "#1565C0",
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: "center",
  },
  viewButtonText: {
    fontWeight: "700",
    fontSize: 15,
    color: "#fff",
  },
  compareNote: {
    marginHorizontal: 20,
    marginTop: 12,
    backgroundColor: "rgba(21,101,192,0.04)",
    borderWidth: 1.5,
    borderColor: "#E0E0E0",
    borderStyle: "dashed",
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  compareNoteIcon: {
    fontSize: 18,
  },
  compareNoteText: {
    fontSize: 11,
    color: "#757575",
    flex: 1,
  },
});
