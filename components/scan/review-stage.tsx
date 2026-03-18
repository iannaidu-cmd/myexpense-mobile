import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { colour } from "@/tokens";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import type { Category, Receipt } from "./types";

interface ReviewStageProps {
  receipt: Receipt;
  categories: Category[];
  selectedCatIdx: number;
  onBack: () => void;
  onCategorySelect: (idx: number) => void;
  onSave: () => void;
}

interface DetailRow {
  label: string;
  value: string;
  editable: boolean;
  highlight?: boolean;
}

export function ReviewStageComponent({
  receipt,
  categories,
  selectedCatIdx,
  onBack,
  onCategorySelect,
  onSave,
}: ReviewStageProps) {
  const selectedCat = categories[selectedCatIdx];
  const details: DetailRow[] = [
    { label: "Vendor", value: receipt.vendor, editable: true },
    { label: "Date", value: receipt.date, editable: true },
    {
      label: "Total",
      value: `R ${receipt.total.toLocaleString()}`,
      editable: true,
      highlight: true,
    },
    {
      label: "VAT (15%)",
      value: `R ${receipt.vat.toLocaleString()}`,
      editable: false,
    },
  ];

  return (
    <>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={onBack}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <ThemedText style={styles.backButton}>←</ThemedText>
        </TouchableOpacity>

        <ThemedText type="subtitle" style={styles.title}>
          Review Receipt
        </ThemedText>

        {/* Confidence badge */}
        <View style={styles.confidenceBadge}>
          <View style={styles.confidenceDot} />
          <ThemedText style={styles.confidenceText}>
            {receipt.confidence}% confidence match
          </ThemedText>
        </View>
      </View>

      <View style={styles.content}>
        {/* Extracted Details Card */}
        <ThemedView style={styles.detailsCard}>
          <View style={styles.detailsHeader}>
            <ThemedText type="defaultSemiBold" style={styles.detailsTitle}>
              Extracted Details
            </ThemedText>
            <ThemedText style={styles.editHint}>Tap to edit</ThemedText>
          </View>

          <View style={styles.detailsList}>
            {details.map((row, i) => (
              <View key={i} style={styles.detailRow}>
                <ThemedText style={styles.detailLabel}>{row.label}</ThemedText>
                <View
                  style={[
                    styles.detailValue,
                    row.editable && styles.detailValueEditable,
                  ]}
                >
                  <ThemedText
                    style={[
                      row.highlight
                        ? styles.detailValueHighlight
                        : styles.detailValueNormal,
                    ]}
                  >
                    {row.value}
                  </ThemedText>
                  {row.editable && (
                    <ThemedText style={styles.editIcon}>✏️</ThemedText>
                  )}
                </View>
              </View>
            ))}

            {/* Line Items */}
            <View style={styles.itemsSection}>
              <ThemedText style={styles.itemsLabel}>Line Items</ThemedText>
              {receipt.items.map((item, i) => (
                <View key={i} style={styles.itemRow}>
                  <View style={styles.itemBullet} />
                  <ThemedText style={styles.itemText}>
                    {item.description} × {item.quantity}
                  </ThemedText>
                </View>
              ))}
            </View>
          </View>
        </ThemedView>

        {/* Category Selection */}
        <ThemedView style={styles.categoryCard}>
          <ThemedText type="defaultSemiBold" style={styles.categoryTitle}>
            ITR12 Category
          </ThemedText>
          <View style={styles.categoryGrid}>
            {categories.map((cat, i) => (
              <TouchableOpacity
                key={cat.code}
                style={[
                  styles.categoryOption,
                  {
                    backgroundColor:
                      selectedCatIdx === i ? `${cat.color}18` : colour.surface1,
                    borderColor:
                      selectedCatIdx === i ? cat.color : "transparent",
                    borderWidth: 1.5,
                  },
                ]}
                onPress={() => onCategorySelect(i)}
                accessibilityRole="button"
                accessibilityState={{ selected: selectedCatIdx === i }}
              >
                <ThemedText style={styles.categoryIcon}>{cat.icon}</ThemedText>
                <ThemedText
                  style={[
                    styles.categoryLabel,
                    {
                      color: selectedCatIdx === i ? cat.color : colour.textHint,
                    },
                  ]}
                >
                  {cat.label}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </View>
        </ThemedView>

        {/* Deductibility Badge */}
        {receipt.deductible && (
          <View style={styles.deductibleBadge}>
            <ThemedText style={styles.deductibleIcon}>✅</ThemedText>
            <View>
              <ThemedText type="defaultSemiBold" style={styles.deductibleTitle}>
                Tax Deductible
              </ThemedText>
              <ThemedText style={styles.deductibleSubtitle}>
                Qualifies for ITR12 deduction under Section 11(a)
              </ThemedText>
            </View>
          </View>
        )}

        {/* Confirm Button */}
        <TouchableOpacity
          style={styles.confirmButton}
          onPress={onSave}
          accessibilityRole="button"
          accessibilityLabel={`Save expense for R ${receipt.total}`}
        >
          <ThemedText style={styles.confirmText}>
            ✓ Save Expense — R {receipt.total.toLocaleString()}
          </ThemedText>
        </TouchableOpacity>

        <ThemedText style={styles.rescanText}>Rescan receipt</ThemedText>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    gap: 12,
  },
  backButton: {
    fontSize: 22,
    opacity: 0.7,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    marginTop: 14,
  },
  confidenceBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
    backgroundColor: colour.successBg,
    borderRadius: 20,
    paddingVertical: 4,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: colour.successMid,
    alignSelf: "flex-start",
  },
  confidenceDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: colour.accent,
  },
  confidenceText: {
    color: colour.accent,
    fontSize: 12,
    fontWeight: "700",
  },
  content: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  detailsCard: {
    borderRadius: 20,
    overflow: "hidden",
    marginBottom: 16,
  },
  detailsHeader: {
    backgroundColor: colour.primary,
    paddingVertical: 12,
    paddingHorizontal: 18,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  detailsTitle: {
    color: colour.onPrimary,
    fontSize: 13,
  },
  editHint: {
    color: colour.primary200,
    fontSize: 11,
    fontWeight: "600",
  },
  detailsList: {
    paddingVertical: 16,
    paddingHorizontal: 18,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colour.surface2,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: "500",
    opacity: 0.6,
  },
  detailValue: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  detailValueEditable: {
    backgroundColor: colour.surface1,
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  detailValueNormal: {
    fontSize: 13,
    fontWeight: "600",
  },
  detailValueHighlight: {
    fontSize: 16,
    fontWeight: "800",
  },
  editIcon: {
    fontSize: 11,
    opacity: 0.8,
  },
  itemsSection: {
    marginTop: 12,
  },
  itemsLabel: {
    fontSize: 12,
    fontWeight: "500",
    opacity: 0.6,
    marginBottom: 8,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  itemBullet: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: colour.primary,
  },
  itemText: {
    fontSize: 13,
  },
  categoryCard: {
    borderRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 18,
    marginBottom: 16,
  },
  categoryTitle: {
    fontSize: 13,
    marginBottom: 14,
  },
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  categoryOption: {
    flex: 1,
    minWidth: "45%",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
  },
  categoryIcon: {
    fontSize: 16,
  },
  categoryLabel: {
    fontSize: 11,
    fontWeight: "600",
    lineHeight: 1.2,
    flex: 1,
  },
  deductibleBadge: {
    flexDirection: "row",
    gap: 14,
    backgroundColor: colour.primary50,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 18,
    marginBottom: 20,
    borderWidth: 1.5,
    borderColor: colour.primary100,
    alignItems: "center",
  },
  deductibleIcon: {
    fontSize: 28,
  },
  deductibleTitle: {
    color: colour.success,
    fontSize: 13,
    marginBottom: 2,
  },
  deductibleSubtitle: {
    color: colour.primary,
    fontSize: 11,
  },
  confirmButton: {
    backgroundColor: colour.primary,
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  confirmText: {
    color: colour.onPrimary,
    fontWeight: "700",
    fontSize: 15,
    textAlign: "center",
  },
  rescanText: {
    textAlign: "center",
    fontSize: 12,
    opacity: 0.6,
    paddingBottom: 8,
  },
});
