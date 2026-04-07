import { ThemedText } from "@/components/themed-text";
import { useThemeColor } from "@/hooks/use-theme-color";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

interface VATCategory {
  name: string;
  icon: string;
  bg: string;
  color: string;
  amount: number;
  vat: number;
  items: number;
}

interface ITR12VATSummaryProps {
  categories?: VATCategory[];
  onPeriodChange?: (period: string) => void;
}

const DEFAULT_CATEGORIES: VATCategory[] = [
  {
    name: "Software & Tech",
    icon: "💻",
    color: "#1976D2",
    bg: "rgba(25,118,210,0.10)",
    amount: 12400,
    vat: 1617,
    items: 28,
  },
  {
    name: "Travel & Transport",
    icon: "🚗",
    color: "#0288D1",
    bg: "rgba(2,136,209,0.10)",
    amount: 9200,
    vat: 1200,
    items: 34,
  },
  {
    name: "Office & Stationery",
    icon: "📁",
    color: "#1565C0",
    bg: "rgba(21,101,192,0.08)",
    amount: 7800,
    vat: 1017,
    items: 19,
  },
  {
    name: "Professional Services",
    icon: "📋",
    color: "#48D1C0",
    bg: "rgba(72,209,192,0.10)",
    amount: 6100,
    vat: 795,
    items: 8,
  },
  {
    name: "Meals & Entertainment",
    icon: "🍽️",
    color: "#E07060",
    bg: "rgba(224,112,96,0.10)",
    amount: 3400,
    vat: 443,
    items: 22,
  },
  {
    name: "Home Office",
    icon: "🏠",
    color: "#0288D1",
    bg: "rgba(2,136,209,0.10)",
    amount: 2100,
    vat: 274,
    items: 12,
  },
];

export function ITR12VATSummaryScreen({
  categories = DEFAULT_CATEGORIES,
  onPeriodChange,
}: ITR12VATSummaryProps) {
  const [period, setPeriod] = useState("this_month");
  const backgroundColor = useThemeColor({}, "background");

  const totalVAT = categories.reduce((s, c) => s + c.vat, 0);

  const handlePeriodChange = (newPeriod: string) => {
    setPeriod(newPeriod);
    if (typeof onPeriodChange === "function") {
      onPeriodChange(newPeriod);
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
        <ThemedText style={styles.headerMain}>VAT Summary</ThemedText>
        <ThemedText style={styles.headerSub}>
          Input tax tracker · 15% VAT
        </ThemedText>
        <View style={styles.headerStats}>
          {[
            {
              label: "Total input VAT",
              value: `R ${totalVAT.toLocaleString()}`,
            },
            { label: "VAT receipts", value: "111" },
            { label: "VAT rate", value: "15%" },
          ].map((s, i) => (
            <View
              key={i}
              style={[styles.headerStat, i > 0 && styles.headerStatBorder]}
            >
              <Text style={styles.headerStatLabel}>{s.label}</Text>
              <Text style={styles.headerStatValue}>{s.value}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Period filter */}
      <View style={styles.periodFilter}>
        {[
          ["this_month", "This month"],
          ["last_month", "Last month"],
          ["tax_year", "Tax year"],
        ].map(([val, lbl]) => (
          <Pressable
            key={val}
            onPress={() => handlePeriodChange(val as string)}
            style={[
              styles.periodButton,
              period === val && styles.periodButtonActive,
              {
                backgroundColor: period === val ? "#1565C0" : "#fff",
              },
            ]}
          >
            <Text
              style={[
                styles.periodButtonText,
                period === val && styles.periodButtonTextActive,
              ]}
            >
              {lbl}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* VAT info card */}
      <View style={styles.infoCard}>
        <ThemedText style={styles.infoCardTitle}>What is Input VAT?</ThemedText>
        <Text style={styles.infoCardText}>
          Input VAT is the 15% VAT embedded in your business expenses. If you
          are VAT-registered, you can claim this back from SARS. MyExpense
          automatically extracts VAT from your receipts.
        </Text>
      </View>

      {/* VAT by category */}
      <Text style={styles.categoryLabel}>VAT BY CATEGORY</Text>
      {categories.map((cat, i) => (
        <View key={i} style={styles.categoryItem}>
          <View style={[styles.categoryIcon, { backgroundColor: cat.bg }]}>
            <Text style={styles.categoryIconEmoji}>{cat.icon}</Text>
          </View>
          <View style={styles.categoryContent}>
            <ThemedText style={styles.categoryName}>{cat.name}</ThemedText>
            <Text style={styles.categoryMeta}>
              Gross: R {cat.amount.toLocaleString()} · {cat.items} receipts
            </Text>
          </View>
          <View style={styles.categoryVAT}>
            <Text style={[styles.categoryVATAmount, { color: cat.color }]}>
              R {cat.vat.toLocaleString()}
            </Text>
            <Text style={styles.categoryVATLabel}>Input VAT</Text>
          </View>
        </View>
      ))}

      {/* VAT calculation breakdown */}
      {categories.slice(0, 1).map((cat, i) => (
        <View key={i} style={styles.breakdownCard}>
          <Text style={styles.breakdownLabel}>
            R {cat.amount.toLocaleString()} ÷ 1.15 × 0.15 ={" "}
            <Text style={[{ color: cat.color }]}>
              R {cat.vat.toLocaleString()}
            </Text>
          </Text>
        </View>
      ))}

      {/* VAT total card */}
      <View style={styles.totalCard}>
        <View style={styles.totalContent}>
          <Text style={styles.totalLabel}>Total Input VAT</Text>
          <ThemedText style={styles.totalAmount}>
            R {totalVAT.toLocaleString()}
          </ThemedText>
          <Text style={styles.totalYear}>Tax Year 2026</Text>
        </View>
        <View style={styles.totalClaimable}>
          <Text style={styles.totalClaimableLabel}>If VAT registered</Text>
          <Text style={styles.totalClaimableText}>Claimable →</Text>
        </View>
      </View>

      {/* VAT registration note */}
      <View style={styles.registrationNote}>
        <ThemedText style={styles.registrationNoteTitle}>
          Not VAT registered?
        </ThemedText>
        <Text style={styles.registrationNoteText}>
          If you earn under R1 million/year, VAT registration is optional. The
          VAT you pay is included in the gross expense deduction under Section
          11(a).
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
    paddingBottom: 28,
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
  headerStats: {
    flexDirection: "row",
    marginTop: 18,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.15)",
  },
  headerStat: {
    flex: 1,
  },
  headerStatBorder: {
    borderLeftWidth: 1,
    borderLeftColor: "rgba(255,255,255,0.2)",
    paddingLeft: 16,
  },
  headerStatLabel: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 10,
    marginBottom: 2,
  },
  headerStatValue: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "900",
  },
  periodFilter: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexWrap: "wrap",
  },
  periodButton: {
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 100,
    borderWidth: 1.5,
    borderColor: "#E0E0E0",
  },
  periodButtonActive: {
    borderColor: "#1565C0",
  },
  periodButtonText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#757575",
  },
  periodButtonTextActive: {
    color: "#fff",
  },
  infoCard: {
    marginHorizontal: 20,
    marginBottom: 14,
    backgroundColor: "rgba(2,136,209,0.08)",
    borderWidth: 1.5,
    borderColor: "rgba(2,136,209,0.25)",
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  infoCardTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#0288D1",
    marginBottom: 4,
  },
  infoCardText: {
    fontSize: 11,
    color: "#757575",
    lineHeight: 1.5,
  },
  categoryLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#1565C0",
    letterSpacing: 0.5,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  categoryItem: {
    marginHorizontal: 20,
    marginBottom: 8,
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingVertical: 13,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  categoryIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  categoryIconEmoji: {
    fontSize: 17,
  },
  categoryContent: {
    flex: 1,
  },
  categoryName: {
    fontSize: 13,
    fontWeight: "600",
    color: "#0D47A1",
  },
  categoryMeta: {
    fontSize: 11,
    color: "#757575",
    marginTop: 2,
  },
  categoryVAT: {
    alignItems: "flex-end",
  },
  categoryVATAmount: {
    fontSize: 14,
    fontWeight: "800",
  },
  categoryVATLabel: {
    fontSize: 10,
    color: "#757575",
  },
  breakdownCard: {
    marginHorizontal: 20,
    marginTop: 10,
    marginBottom: 8,
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: "#F5F5F5",
  },
  breakdownLabel: {
    fontSize: 10,
    color: "#757575",
  },
  totalCard: {
    marginHorizontal: 20,
    marginTop: 8,
    marginBottom: 12,
    backgroundColor: "#1565C0",
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 18,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  totalContent: {
    flex: 1,
  },
  totalLabel: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 11,
    marginBottom: 4,
  },
  totalAmount: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "900",
  },
  totalYear: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 11,
    marginTop: 2,
  },
  totalClaimable: {
    alignItems: "flex-end",
  },
  totalClaimableLabel: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 11,
    marginBottom: 4,
  },
  totalClaimableText: {
    color: "#0288D1",
    fontSize: 16,
    fontWeight: "800",
  },
  registrationNote: {
    marginHorizontal: 20,
    backgroundColor: "rgba(46,46,122,0.04)",
    borderWidth: 1.5,
    borderColor: "#E0E0E0",
    borderStyle: "dashed",
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  registrationNoteTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: "#1565C0",
    marginBottom: 4,
  },
  registrationNoteText: {
    fontSize: 11,
    color: "#757575",
    lineHeight: 1.5,
  },
});
