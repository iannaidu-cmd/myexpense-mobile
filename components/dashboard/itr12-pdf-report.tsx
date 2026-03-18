import { ThemedText } from "@/components/themed-text";
import { useThemeColor } from "@/hooks/use-theme-color";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

interface DeductionCategory {
  icon: string;
  name: string;
  amount: number;
}

interface ITR12PDFReportProps {
  taxpayerName?: string;
  taxNumber?: string;
  workType?: string;
  categories?: DeductionCategory[];
  totalDeductible?: number;
  totalVAT?: number;
  taxSavedPercent?: number;
  onDownload?: () => void;
  onShare?: () => void;
}

const DEFAULT_CATEGORIES: DeductionCategory[] = [
  { icon: "💻", name: "Software & Tech", amount: 12400 },
  { icon: "🚗", name: "Travel & Transport", amount: 9200 },
  { icon: "📁", name: "Office & Stationery", amount: 7800 },
  { icon: "📋", name: "Professional Services", amount: 6100 },
  { icon: "🍽️", name: "Meals & Entertainment", amount: 3400 },
  { icon: "🏠", name: "Home Office", amount: 2100 },
];

export function ITR12PDFReportScreen({
  taxpayerName = "Ian Naidu",
  taxNumber = "1234567890",
  workType = "Sole Proprietor",
  categories = DEFAULT_CATEGORIES,
  totalDeductible = 41000,
  totalVAT = 5346,
  taxSavedPercent = 45,
  onDownload,
  onShare,
}: ITR12PDFReportProps) {
  const backgroundColor = useThemeColor({}, "background");

  const taxSaved = Math.round(totalDeductible * (taxSavedPercent / 100));

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
        <ThemedText style={styles.headerMain}>ITR12 PDF Report</ThemedText>
        <ThemedText style={styles.headerSub}>
          Tax Year 2026 · Generated 12 Mar 2026
        </ThemedText>
      </View>

      {/* PDF Preview mock */}
      <View style={styles.pdfContainer}>
        {/* PDF header */}
        <View style={styles.pdfHeader}>
          <Text style={styles.pdfHeaderLabel}>MYEXPENSE — OFFICIAL REPORT</Text>
          <ThemedText style={styles.pdfTitle}>
            ITR12 Expense Deduction Report
          </ThemedText>
          <Text style={styles.pdfTaxYear}>
            Tax Year: 1 March 2025 – 28 February 2026
          </Text>
        </View>

        {/* Taxpayer info */}
        <View style={styles.pdfSection}>
          <Text style={styles.pdfSectionLabel}>TAXPAYER DETAILS</Text>
          {[
            { label: "Full Name", value: taxpayerName },
            { label: "Tax Number", value: taxNumber },
            { label: "Work Type", value: workType },
            { label: "Report Date", value: "12 March 2026" },
          ].map((r, i) => (
            <View key={i} style={styles.pdfRow}>
              <ThemedText style={styles.pdfRowLabel}>{r.label}</ThemedText>
              <ThemedText style={styles.pdfRowValue}>{r.value}</ThemedText>
            </View>
          ))}
        </View>

        {/* Summary table */}
        <View style={styles.pdfSection}>
          <Text style={styles.pdfSectionLabel}>
            SECTION 11(a) DEDUCTIONS SUMMARY
          </Text>
          {categories.map((cat, i) => (
            <View
              key={i}
              style={[
                styles.pdfRow,
                i < categories.length - 1 && styles.pdfRowBorder,
              ]}
            >
              <View style={styles.pdfRowCat}>
                <Text style={styles.pdfRowIcon}>{cat.icon}</Text>
                <ThemedText style={styles.pdfRowCatName}>{cat.name}</ThemedText>
              </View>
              <ThemedText style={styles.pdfRowAmount}>
                R {cat.amount.toLocaleString()}
              </ThemedText>
            </View>
          ))}
          <View style={styles.pdfRowTotal}>
            <ThemedText style={styles.pdfRowTotalLabel}>
              TOTAL DEDUCTIBLE
            </ThemedText>
            <Text style={styles.pdfRowTotalValue}>
              R {totalDeductible.toLocaleString()}
            </Text>
          </View>
        </View>

        {/* Tax impact */}
        <View style={styles.pdfTaxImpact}>
          <Text style={styles.pdfSectionLabel}>ESTIMATED TAX IMPACT</Text>
          {[
            {
              label: "Total deductible expenses",
              value: `R ${totalDeductible.toLocaleString()}`,
            },
            {
              label: "VAT input tax (15%)",
              value: `R ${totalVAT.toLocaleString()}`,
            },
            {
              label: `Estimated tax saving @ ${taxSavedPercent}%`,
              value: `R ${taxSaved.toLocaleString()}`,
              highlight: true,
            },
          ].map((r, i) => (
            <View key={i} style={styles.pdfTaxRow}>
              <ThemedText style={styles.pdfTaxLabel}>{r.label}</ThemedText>
              <ThemedText
                style={[
                  styles.pdfTaxValue,
                  r.highlight && styles.pdfTaxValueHighlight,
                ]}
              >
                {r.value}
              </ThemedText>
            </View>
          ))}
        </View>
      </View>

      {/* Page count badge */}
      <View style={styles.pageInfo}>
        <Text style={styles.pageInfoText}>📄 6 pages · 2.4 MB · PDF</Text>
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <Pressable
          style={[styles.actionButton, styles.actionButtonPrimary]}
          onPress={onDownload}
        >
          <Text style={styles.actionButtonText}>📥 Download PDF</Text>
        </Pressable>
        <Pressable
          style={[styles.actionButton, styles.actionButtonSecondary]}
          onPress={onShare}
        >
          <Text style={styles.actionButtonText}>📤 Share</Text>
        </Pressable>
      </View>

      {/* Email option */}
      <Pressable style={styles.emailOption}>
        <View style={styles.emailIcon}>
          <Text style={styles.emailIconText}>📧</Text>
        </View>
        <View style={styles.emailContent}>
          <ThemedText style={styles.emailLabel}>Email to accountant</ThemedText>
          <Text style={styles.emailSub}>Send directly from the app</Text>
        </View>
        <Text style={styles.emailArrow}>›</Text>
      </Pressable>

      {/* SARS note */}
      <View style={styles.sarsNote}>
        <ThemedText style={styles.sarsNoteText}>
          ⚠️ This report is for tax planning purposes. Please consult a
          registered tax practitioner before submitting to SARS.
        </ThemedText>
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
  pdfContainer: {
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 16,
    backgroundColor: "#fff",
    borderRadius: 20,
    overflow: "hidden",
  },
  pdfHeader: {
    backgroundColor: "#0D47A1",
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  pdfHeaderLabel: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 10,
    letterSpacing: 1,
  },
  pdfTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
    marginTop: 4,
  },
  pdfTaxYear: {
    color: "#0288D1",
    fontSize: 11,
    marginTop: 2,
  },
  pdfSection: {
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  pdfSectionLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#757575",
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  pdfRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
  },
  pdfRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  pdfRowLabel: {
    fontSize: 11,
    color: "#757575",
  },
  pdfRowValue: {
    fontSize: 11,
    fontWeight: "700",
    color: "#0D47A1",
  },
  pdfRowCat: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  pdfRowIcon: {
    fontSize: 13,
  },
  pdfRowCatName: {
    fontSize: 11,
    color: "#0D47A1",
    fontWeight: "500",
  },
  pdfRowAmount: {
    fontSize: 12,
    fontWeight: "700",
    color: "#1565C0",
  },
  pdfRowTotal: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 10,
    borderTopWidth: 1.5,
    borderTopColor: "#E0E0E0",
    marginTop: 4,
  },
  pdfRowTotalLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#0D47A1",
  },
  pdfRowTotalValue: {
    fontSize: 14,
    fontWeight: "900",
    color: "#0288D1",
  },
  pdfTaxImpact: {
    paddingHorizontal: 18,
    paddingVertical: 14,
    backgroundColor: "rgba(59,191,173,0.06)",
  },
  pdfTaxRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
  },
  pdfTaxLabel: {
    fontSize: 11,
    color: "#757575",
  },
  pdfTaxValue: {
    fontSize: 12,
    fontWeight: "700",
    color: "#1565C0",
  },
  pdfTaxValueHighlight: {
    color: "#0288D1",
    fontWeight: "900",
  },
  pageInfo: {
    alignItems: "center",
    marginVertical: 8,
  },
  pageInfoText: {
    fontSize: 11,
    color: "#757575",
  },
  actions: {
    flexDirection: "row",
    gap: 10,
    marginHorizontal: 20,
  },
  actionButton: {
    flex: 1,
    borderRadius: 28,
    paddingVertical: 14,
    alignItems: "center",
  },
  actionButtonPrimary: {
    backgroundColor: "#1565C0",
  },
  actionButtonSecondary: {
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: "#1565C0",
  },
  actionButtonText: {
    fontWeight: "700",
    fontSize: 14,
    color: "#FFFFFF",
  },
  emailOption: {
    marginHorizontal: 20,
    marginTop: 12,
    backgroundColor: "#fff",
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#E0E0E0",
  },
  emailIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: "rgba(21,101,192,0.06)",
    alignItems: "center",
    justifyContent: "center",
  },
  emailIconText: {
    fontSize: 18,
  },
  emailContent: {
    flex: 1,
    marginLeft: 12,
  },
  emailLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  emailSub: {
    fontSize: 11,
    color: "#757575",
  },
  emailArrow: {
    color: "#0288D1",
    fontSize: 18,
  },
  sarsNote: {
    marginHorizontal: 20,
    marginTop: 12,
    backgroundColor: "rgba(46,46,122,0.04)",
    borderWidth: 1.5,
    borderColor: "#E0E0E0",
    borderStyle: "dashed",
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  sarsNoteText: {
    fontSize: 11,
    color: "#757575",
    lineHeight: 1.5,
  },
});
