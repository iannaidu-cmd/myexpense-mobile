import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useThemeColor } from "@/hooks/use-theme-color";
import { useState } from "react";
import {
    FlatList,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";

interface ExportCategory {
  name: string;
  icon: string;
  color: string;
  gross: number;
  vat: number;
  net: number;
  items: number;
  note?: boolean;
}

interface ITR12ExportPreviewProps {
  categories?: ExportCategory[];
  taxYear?: string;
  format?: string;
  includeVAT?: boolean;
  includeReceipts?: boolean;
  onGenerate?: () => void;
  onEditSetup?: () => void;
  onDownload?: () => void;
  onShare?: () => void;
}

const DEFAULT_CATEGORIES: ExportCategory[] = [
  {
    name: "Software & Tech",
    icon: "💻",
    color: "#1976D2",
    gross: 12400,
    vat: 1617,
    net: 10783,
    items: 28,
  },
  {
    name: "Travel & Transport",
    icon: "🚗",
    color: "#0288D1",
    gross: 9200,
    vat: 1200,
    net: 8000,
    items: 34,
  },
  {
    name: "Office & Stationery",
    icon: "📁",
    color: "#1565C0",
    gross: 7800,
    vat: 1017,
    net: 6783,
    items: 19,
  },
  {
    name: "Professional Services",
    icon: "📋",
    color: "#48D1C0",
    gross: 6100,
    vat: 795,
    net: 5305,
    items: 8,
  },
  {
    name: "Meals (50% rule)",
    icon: "🍽️",
    color: "#E07060",
    gross: 3400,
    vat: 443,
    net: 1479,
    items: 22,
    note: true,
  },
];

export function ITR12ExportPreviewScreen({
  categories = DEFAULT_CATEGORIES,
  taxYear = "2026 (Mar 2025 – Feb 2026)",
  format = "📄 PDF Report",
  includeVAT = true,
  includeReceipts = true,
  onGenerate,
  onEditSetup,
  onDownload,
  onShare,
}: ITR12ExportPreviewProps) {
  const [generating, setGenerating] = useState(false);
  const [done, setDone] = useState(false);

  const textColor = useThemeColor({}, "text");
  const backgroundColor = useThemeColor({}, "background");
  const tintColor = useThemeColor({}, "tint");

  const totalGross = categories.reduce((s, c) => s + c.gross, 0);
  const totalVAT = categories.reduce((s, c) => s + c.vat, 0);
  const totalNet = categories.reduce((s, c) => s + c.net, 0);
  const taxSaved = Math.round(totalNet * 0.45);

  const handleGenerate = () => {
    setGenerating(true);
    setTimeout(() => {
      setGenerating(false);
      setDone(true);
      if (typeof onGenerate === "function") onGenerate();
    }, 2000);
  };

  if (done) {
    return (
      <ScrollView
        style={[styles.container, { backgroundColor }]}
        contentContainerStyle={styles.successContent}
      >
        <View style={styles.successIcon}>
          <Text style={styles.successCheckmark}>✓</Text>
        </View>

        <ThemedText style={styles.successTitle}>Report Generated!</ThemedText>

        <ThemedText style={styles.successSubtitle}>
          Your ITR12 expense report is ready.{"\n"}
          Tax Year 2026 · PDF format
        </ThemedText>

        <View style={styles.successSummary}>
          {[
            {
              label: "Total deductions",
              value: `R ${totalNet.toLocaleString()}`,
            },
            {
              label: "VAT input tax",
              value: `R ${totalVAT.toLocaleString()}`,
            },
            {
              label: "Estimated tax saving",
              value: `R ${taxSaved.toLocaleString()}`,
              highlight: true,
            },
            { label: "Expenses included", value: "111 receipts" },
          ].map((r, i) => (
            <View key={i} style={styles.successRow}>
              <ThemedText style={styles.successRowLabel}>{r.label}</ThemedText>
              <ThemedText
                style={[
                  styles.successRowValue,
                  r.highlight && styles.successRowValueHighlight,
                ]}
              >
                {r.value}
              </ThemedText>
            </View>
          ))}
        </View>

        <View style={styles.successActions}>
          <Pressable
            style={[styles.successButton, styles.successButtonPrimary]}
            onPress={onDownload}
          >
            <Text style={styles.successButtonText}>📥 Download PDF</Text>
          </Pressable>
          <Pressable
            style={[styles.successButton, styles.successButtonSecondary]}
            onPress={onShare}
          >
            <Text style={styles.successButtonText}>📤 Share</Text>
          </Pressable>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Pressable style={styles.backButton}>
            <Text style={styles.backButtonText}>←</Text>
          </Pressable>
          <ThemedText style={styles.headerTitle}>MyExpense</ThemedText>
          <Pressable style={styles.editButton} onPress={onEditSetup}>
            <Text style={styles.editButtonText}>Edit Setup</Text>
          </Pressable>
        </View>
        <ThemedText style={styles.headerMain}>Export Preview</ThemedText>
        <ThemedText style={styles.headerSub}>
          Review before generating your ITR12 report
        </ThemedText>
      </View>

      {/* Report meta card */}
      <View style={styles.metaCard}>
        <ThemedView style={styles.metaCardHeader}>
          <ThemedText style={styles.metaCardTitle}>
            Report Configuration
          </ThemedText>
        </ThemedView>
        <View style={styles.metaCardContent}>
          {[
            { label: "Tax Year", value: taxYear },
            { label: "Format", value: format },
            { label: "Generated", value: "12 Mar 2026, 09:41" },
            { label: "VAT included", value: includeVAT ? "Yes (15%)" : "No" },
            {
              label: "Receipts",
              value: includeReceipts ? "Thumbnails attached" : "Not included",
            },
          ].map((r, i) => (
            <View key={i} style={styles.metaRow}>
              <ThemedText style={styles.metaLabel}>{r.label}</ThemedText>
              <ThemedText style={styles.metaValue}>{r.value}</ThemedText>
            </View>
          ))}
        </View>
      </View>

      {/* Summary totals */}
      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>EXPORT TOTALS</Text>
        <View style={styles.summaryGrid}>
          {[
            {
              label: "Gross Expenses",
              value: `R ${totalGross.toLocaleString()}`,
            },
            { label: "VAT (Input)", value: `R ${totalVAT.toLocaleString()}` },
            {
              label: "Net Deductible",
              value: `R ${totalNet.toLocaleString()}`,
            },
          ].map((s, i) => (
            <View key={i} style={styles.summaryColumn}>
              <Text style={styles.summaryColumnLabel}>{s.label}</Text>
              <Text style={styles.summaryColumnValue}>{s.value}</Text>
            </View>
          ))}
        </View>
        <View style={styles.summaryFooter}>
          <Text style={styles.summaryFooterLabel}>
            Estimated tax saving @ 45%
          </Text>
          <Text style={styles.summaryFooterValue}>
            R {taxSaved.toLocaleString()}
          </Text>
        </View>
      </View>

      {/* Category-level preview table */}
      <View>
        <Text style={styles.categoryHeaderLabel}>
          CATEGORY BREAKDOWN PREVIEW
        </Text>
        <View style={styles.categoryTable}>
          <View style={styles.categoryTableHeader}>
            {["Category", "Gross", "Net Ded."].map((h, i) => (
              <Text
                key={i}
                style={[
                  styles.categoryTableHeaderCell,
                  i === 0 && styles.categoryTableHeaderCellFlex2,
                ]}
              >
                {h}
              </Text>
            ))}
          </View>

          <FlatList
            data={categories}
            keyExtractor={(_, i) => `cat-${i}`}
            scrollEnabled={false}
            renderItem={({ item: cat, index: i }) => (
              <View
                style={[
                  styles.categoryRow,
                  i < categories.length - 1 && styles.categoryRowBorder,
                ]}
              >
                <View style={styles.categoryNameColumn}>
                  <Text style={styles.categoryIcon}>{cat.icon}</Text>
                  <View style={styles.categoryNameText}>
                    <ThemedText style={styles.categoryName}>
                      {cat.name}
                    </ThemedText>
                    {cat.note && (
                      <Text style={styles.categoryNote}>50% rule applied</Text>
                    )}
                  </View>
                </View>
                <ThemedText style={styles.categoryGross}>
                  R {cat.gross.toLocaleString()}
                </ThemedText>
                <ThemedText style={styles.categoryNet}>
                  R {cat.net.toLocaleString()}
                </ThemedText>
              </View>
            )}
          />

          <View style={styles.categoryFooter}>
            <ThemedText style={styles.categoryFooterLabel}>TOTAL</ThemedText>
            <Text style={styles.categoryFooterGross}>
              R {totalGross.toLocaleString()}
            </Text>
            <Text style={styles.categoryFooterNet}>
              R {totalNet.toLocaleString()}
            </Text>
          </View>
        </View>
      </View>

      {/* Generate CTA */}
      <Pressable
        style={[
          styles.generateButton,
          generating && styles.generateButtonLoading,
        ]}
        onPress={handleGenerate}
        disabled={generating}
      >
        <Text style={styles.generateButtonText}>
          {generating ? "⏳ Generating report…" : "✓ Generate ITR12 Report"}
        </Text>
      </Pressable>

      <ThemedText style={styles.editHint}>
        ← Edit setup · Changes will require a new preview
      </ThemedText>

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
  editButton: {
    marginLeft: "auto",
  },
  editButtonText: {
    color: "#0288D1",
    fontSize: 12,
    fontWeight: "700",
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
  metaCard: {
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 20,
    overflow: "hidden",
  },
  metaCardHeader: {
    backgroundColor: "#1976D2",
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  metaCardTitle: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 13,
  },
  metaCardContent: {
    backgroundColor: "#fff",
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: "#F5F5F5",
  },
  metaLabel: {
    fontSize: 12,
    color: "#757575",
  },
  metaValue: {
    fontSize: 12,
    fontWeight: "600",
    color: "#0D47A1",
  },
  summaryCard: {
    marginHorizontal: 20,
    marginTop: 14,
    backgroundColor: "#1565C0",
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  summaryLabel: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 11,
    fontWeight: "600",
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  summaryGrid: {
    flexDirection: "row",
    gap: 0,
  },
  summaryColumn: {
    flex: 1,
    paddingLeft: 0,
  },
  summaryColumnLabel: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 10,
    marginBottom: 3,
  },
  summaryColumnValue: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "800",
  },
  summaryFooter: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.2)",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  summaryFooterLabel: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 12,
  },
  summaryFooterValue: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "900",
  },
  categoryHeaderLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#1565C0",
    letterSpacing: 0.5,
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingBottom: 10,
  },
  categoryTable: {
    marginHorizontal: 20,
    backgroundColor: "#fff",
    borderRadius: 18,
    overflow: "hidden",
  },
  categoryTableHeader: {
    backgroundColor: "#1565C0",
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  categoryTableHeaderCell: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
    flex: 1,
  },
  categoryTableHeaderCellFlex2: {
    flex: 2,
  },
  categoryRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 11,
  },
  categoryRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "#F5F5F5",
  },
  categoryNameColumn: {
    flex: 2,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  categoryIcon: {
    fontSize: 15,
  },
  categoryNameText: {
    flex: 1,
  },
  categoryName: {
    fontSize: 11,
    fontWeight: "600",
    color: "#0D47A1",
    lineHeight: 1.2,
  },
  categoryNote: {
    fontSize: 9,
    color: "#E07060",
    fontWeight: "600",
  },
  categoryGross: {
    flex: 1,
    fontSize: 12,
    fontWeight: "600",
    color: "#757575",
    textAlign: "right",
  },
  categoryNet: {
    flex: 1,
    fontSize: 12,
    fontWeight: "800",
    color: "#1565C0",
    textAlign: "right",
  },
  categoryFooter: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#F5F5F5",
  },
  categoryFooterLabel: {
    flex: 2,
    fontSize: 12,
    fontWeight: "700",
    color: "#0D47A1",
  },
  categoryFooterGross: {
    flex: 1,
    fontSize: 12,
    fontWeight: "800",
    color: "#1565C0",
    textAlign: "right",
  },
  categoryFooterNet: {
    flex: 1,
    fontSize: 12,
    fontWeight: "900",
    color: "#0288D1",
    textAlign: "right",
  },
  generateButton: {
    marginHorizontal: 20,
    marginTop: 16,
    backgroundColor: "#1565C0",
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: "center",
  },
  generateButtonLoading: {
    backgroundColor: "#0D47A1",
  },
  generateButtonText: {
    fontWeight: "700",
    fontSize: 15,
    color: "#fff",
  },
  editHint: {
    textAlign: "center",
    fontSize: 12,
    color: "#757575",
    marginTop: 10,
  },
  // Success screen styles
  successContent: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
    paddingVertical: 40,
  },
  successIcon: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: "#2E9E8F",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  successCheckmark: {
    fontSize: 44,
    color: "#fff",
  },
  successTitle: {
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 8,
    color: "#fff",
    textAlign: "center",
  },
  successSubtitle: {
    fontSize: 13,
    color: "rgba(255,255,255,0.55)",
    marginBottom: 32,
    lineHeight: 1.6,
    textAlign: "center",
  },
  successSummary: {
    backgroundColor: "rgba(255,255,255,0.10)",
    borderRadius: 20,
    paddingVertical: 18,
    paddingHorizontal: 22,
    width: "100%",
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  successRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
  },
  successRowLabel: {
    fontSize: 12,
    color: "rgba(255,255,255,0.45)",
  },
  successRowValue: {
    fontSize: 13,
    fontWeight: "700",
    color: "#fff",
  },
  successRowValueHighlight: {
    color: "#0288D1",
  },
  successActions: {
    flexDirection: "row",
    gap: 10,
    width: "100%",
  },
  successButton: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
  },
  successButtonPrimary: {
    backgroundColor: "#0288D1",
  },
  successButtonSecondary: {
    backgroundColor: "rgba(255,255,255,0.12)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  successButtonText: {
    fontWeight: "700",
    fontSize: 14,
    color: "#FFFFFF",
  },
});
