import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useThemeColor } from "@/hooks/use-theme-color";
import { useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, View } from "react-native";

interface Category {
  label: string;
  icon: string;
  color: string;
}

interface ExpenseDetailData {
  id: string;
  vendor: string;
  amount: string;
  vat: string;
  date: string;
  category: Category;
  payment: string;
  deductible: boolean;
  reference: string;
  note: string;
  taxSaving: string;
  itr12Section: string;
  scanned: boolean;
  confidence: number;
  items: string[];
  receiptDate?: string;
  receiptSize?: string;
}

interface ExpenseDetailScreenProps {
  expense?: ExpenseDetailData;
  onEdit?: () => void;
  onExport?: () => void;
  onDuplicate?: () => void;
  onDelete?: () => void;
  onBack?: () => void;
}

const DEFAULT_EXPENSE: ExpenseDetailData = {
  id: "exp_1",
  vendor: "Incredible Connection",
  amount: "R 1,249.00",
  vat: "R 162.87",
  date: "12 March 2026",
  category: { label: "Software & Tech", icon: "💻", color: "#1976D2" },
  payment: "💳 Credit Card",
  deductible: true,
  reference: "EXP-2026-03-0041",
  note: "USB-C Hub and HDMI cables for home office setup",
  taxSaving: "R 561.88",
  itr12Section: "Section 11(a)",
  scanned: true,
  confidence: 94,
  items: ["USB-C Hub × 1 — R 849.00", "HDMI Cable × 2 — R 400.00"],
  receiptDate: "12 Mar 2026",
  receiptSize: "1.2 MB",
};

export function ExpenseDetailScreen({
  expense = DEFAULT_EXPENSE,
  onEdit,
  onExport,
  onDuplicate,
  onDelete,
  onBack,
}: ExpenseDetailScreenProps) {
  const [showActionSheet, setShowActionSheet] = useState(false);

  const backgroundColor = useThemeColor(
    { light: "#FFFFFF", dark: "#121212" },
    "background",
  );
  const cardBackground = useThemeColor(
    { light: "#F5F5F5", dark: "#1E1E1E" },
    "background",
  );
  const textColor = useThemeColor({}, "text");
  const mutedColor = useThemeColor(
    { light: "#757575", dark: "#9E9E9E" },
    "text",
  );
  const borderColor = useThemeColor(
    { light: "#E0E0E0", dark: "#424242" },
    "text",
  );
  const accentColor = "#0288D1";
  const errorColor = "#E53935";

  const actions = [
    { icon: "✏️", label: "Edit Expense", color: "#1565C0", onPress: onEdit },
    {
      icon: "📤",
      label: "Export to ITR12",
      color: accentColor,
      onPress: onExport,
    },
    { icon: "📋", label: "Duplicate", color: "#1976D2", onPress: onDuplicate },
    {
      icon: "🗑️",
      label: "Delete Expense",
      color: errorColor,
      onPress: onDelete,
    },
  ];

  const handleAction = (action: any) => {
    setShowActionSheet(false);
    action.onPress?.();
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor,
    },
    header: {
      paddingHorizontal: 24,
      paddingTop: 20,
      paddingBottom: 28,
      backgroundColor: "rgba(21, 101, 192, 0.95)",
      borderBottomWidth: 1,
      borderBottomColor: "rgba(0, 0, 0, 0.1)",
    },
    headerTop: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 18,
    },
    backButton: {
      fontSize: 22,
      color: "rgba(255, 255, 255, 0.65)",
    },
    menuButton: {
      backgroundColor: "rgba(255, 255, 255, 0.15)",
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 6,
    },
    menuButtonText: {
      fontSize: 20,
      color: "#fff",
    },
    categoryBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      paddingHorizontal: 14,
      paddingVertical: 5,
      borderRadius: 20,
      marginBottom: 12,
      borderWidth: 1,
    },
    categoryIcon: {
      fontSize: 16,
    },
    categoryLabel: {
      fontSize: 12,
      fontWeight: "700",
      color: "#fff",
    },
    headerTitle: {
      fontSize: 28,
      fontWeight: "800",
      color: "#fff",
      marginBottom: 4,
    },
    headerSubtext: {
      fontSize: 13,
      color: "rgba(255, 255, 255, 0.55)",
    },
    content: {
      flex: 1,
      padding: 20,
    },
    section: {
      backgroundColor: cardBackground,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: borderColor,
      paddingHorizontal: 18,
      paddingVertical: 14,
      marginBottom: 16,
    },
    sectionHeader: {
      fontSize: 12,
      fontWeight: "700",
      color: mutedColor,
      marginBottom: 10,
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    detailRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: borderColor,
    },
    detailRowLast: {
      borderBottomWidth: 0,
    },
    detailLabel: {
      fontSize: 13,
      color: mutedColor,
      fontWeight: "600",
    },
    detailValue: {
      fontSize: 14,
      fontWeight: "700",
      color: textColor,
    },
    detailValueHighlight: {
      color: accentColor,
    },
    itemsList: {
      paddingVertical: 12,
    },
    listItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: backgroundColor,
    },
    listItemLast: {
      borderBottomWidth: 0,
    },
    listItemDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: accentColor,
    },
    listItemText: {
      fontSize: 13,
      color: textColor,
      flex: 1,
    },
    receiptBox: {
      backgroundColor: "#fff",
      borderRadius: 16,
      paddingHorizontal: 18,
      paddingVertical: 14,
      marginBottom: 20,
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
      borderWidth: 1,
      borderColor: borderColor,
    },
    receiptIcon: {
      width: 52,
      height: 64,
      borderRadius: 10,
      backgroundColor: backgroundColor,
      alignItems: "center",
      justifyContent: "center",
      fontSize: 26,
    },
    receiptContent: {
      flex: 1,
    },
    receiptTitle: {
      fontSize: 13,
      fontWeight: "600",
      color: textColor,
      marginBottom: 4,
    },
    receiptSubtext: {
      fontSize: 11,
      color: mutedColor,
    },
    receiptAction: {
      color: accentColor,
      fontWeight: "700",
      fontSize: 13,
    },
    buttonContainer: {
      flexDirection: "row",
      gap: 10,
      marginTop: 16,
    },
    editButton: {
      flex: 1,
      backgroundColor: "#1565C0",
      borderRadius: 16,
      paddingVertical: 14,
      alignItems: "center",
    },
    editButtonText: {
      fontWeight: "700",
      fontSize: 14,
      color: "#fff",
    },
    exportButton: {
      flex: 1,
      backgroundColor: cardBackground,
      borderRadius: 16,
      paddingVertical: 14,
      alignItems: "center",
      borderWidth: 1.5,
      borderColor: borderColor,
    },
    exportButtonText: {
      fontWeight: "700",
      fontSize: 14,
      color: textColor,
    },
    // Action sheet styles
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(26, 26, 92, 0.55)",
      justifyContent: "flex-end",
    },
    actionSheet: {
      backgroundColor: cardBackground,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      paddingTop: 20,
      paddingHorizontal: 20,
      paddingBottom: 40,
    },
    sheetHandle: {
      width: 40,
      height: 4,
      borderRadius: 100,
      backgroundColor: borderColor,
      alignSelf: "center",
      marginBottom: 20,
    },
    sheetTitle: {
      fontSize: 16,
      fontWeight: "700",
      color: textColor,
      marginBottom: 16,
    },
    actionOption: {
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderRadius: 14,
      marginBottom: 8,
      backgroundColor: "#fff",
      borderWidth: 1.5,
      borderColor: borderColor,
    },
    actionIcon: {
      width: 38,
      height: 38,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
      fontSize: 18,
    },
    actionLabel: {
      fontSize: 14,
      fontWeight: "600",
      flex: 1,
    },
    actionArrow: {
      fontSize: 16,
      color: mutedColor,
    },
  });

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <ThemedView style={styles.header}>
        <View style={styles.headerTop}>
          <Pressable onPress={onBack}>
            <ThemedText style={styles.backButton}>←</ThemedText>
          </Pressable>
          <Pressable
            style={styles.menuButton}
            onPress={() => setShowActionSheet(true)}
          >
            <ThemedText style={styles.menuButtonText}>⋯</ThemedText>
          </Pressable>
        </View>

        {/* Category Badge */}
        <View
          style={[
            styles.categoryBadge,
            {
              backgroundColor: expense.category.color + "30",
              borderColor: expense.category.color + "60",
            },
          ]}
        >
          <ThemedText style={styles.categoryIcon}>
            {expense.category.icon}
          </ThemedText>
          <ThemedText style={styles.categoryLabel}>
            {expense.category.label}
          </ThemedText>
        </View>

        <ThemedText style={styles.headerTitle}>{expense.amount}</ThemedText>
        <ThemedText style={styles.headerSubtext}>
          {expense.vendor} • {expense.date}
        </ThemedText>
      </ThemedView>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Expense Details Section */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionHeader}>Expense Details</ThemedText>
          <View style={styles.detailRow}>
            <ThemedText style={styles.detailLabel}>Reference</ThemedText>
            <ThemedText style={styles.detailValue}>
              {expense.reference}
            </ThemedText>
          </View>
          <View style={styles.detailRow}>
            <ThemedText style={styles.detailLabel}>Payment Method</ThemedText>
            <ThemedText style={styles.detailValue}>
              {expense.payment}
            </ThemedText>
          </View>
          <View style={[styles.detailRow, styles.detailRowLast]}>
            <ThemedText style={styles.detailLabel}>Deductible</ThemedText>
            <ThemedText
              style={[
                styles.detailValue,
                expense.deductible && styles.detailValueHighlight,
              ]}
            >
              {expense.deductible ? "✓ Yes" : "✗ No"}
            </ThemedText>
          </View>
        </View>

        {/* Financial Summary */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionHeader}>
            Financial Summary
          </ThemedText>
          <View style={styles.detailRow}>
            <ThemedText style={styles.detailLabel}>Subtotal</ThemedText>
            <ThemedText style={styles.detailValue}>{expense.amount}</ThemedText>
          </View>
          <View style={styles.detailRow}>
            <ThemedText style={styles.detailLabel}>VAT (15%)</ThemedText>
            <ThemedText style={styles.detailValue}>{expense.vat}</ThemedText>
          </View>
          <View style={[styles.detailRow, styles.detailRowLast]}>
            <ThemedText style={styles.detailLabel}>
              Estimated Tax Saving
            </ThemedText>
            <ThemedText
              style={[styles.detailValue, styles.detailValueHighlight]}
            >
              {expense.taxSaving}
            </ThemedText>
          </View>
        </View>

        {/* Items */}
        {expense.items.length > 0 && (
          <View style={styles.section}>
            <ThemedText style={styles.sectionHeader}>Items</ThemedText>
            <View style={styles.itemsList}>
              {expense.items.map((item, i) => (
                <View
                  key={i}
                  style={[
                    styles.listItem,
                    i === expense.items.length - 1 && styles.listItemLast,
                  ]}
                >
                  <View style={styles.listItemDot} />
                  <ThemedText style={styles.listItemText}>{item}</ThemedText>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Tax Information */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionHeader}>Tax Information</ThemedText>
          <View style={styles.detailRow}>
            <ThemedText style={styles.detailLabel}>ITR12 Section</ThemedText>
            <ThemedText style={styles.detailValue}>
              {expense.itr12Section}
            </ThemedText>
          </View>
          <View style={[styles.detailRow, styles.detailRowLast]}>
            <ThemedText style={styles.detailLabel}>OCR Confidence</ThemedText>
            <ThemedText style={styles.detailValue}>
              {expense.scanned ? `${expense.confidence}%` : "Manual Entry"}
            </ThemedText>
          </View>
        </View>

        {/* Note */}
        {expense.note && (
          <View style={styles.section}>
            <ThemedText style={styles.sectionHeader}>Note</ThemedText>
            <ThemedText
              style={{ fontSize: 13, color: textColor, lineHeight: 1.6 }}
            >
              {expense.note}
            </ThemedText>
          </View>
        )}

        {/* Receipt */}
        {expense.scanned && (
          <Pressable style={styles.receiptBox}>
            <ThemedText style={styles.receiptIcon}>🧾</ThemedText>
            <View style={styles.receiptContent}>
              <ThemedText style={styles.receiptTitle}>
                Receipt Attached
              </ThemedText>
              <ThemedText style={styles.receiptSubtext}>
                Scanned {expense.receiptDate} · {expense.receiptSize}
              </ThemedText>
            </View>
            <ThemedText style={styles.receiptAction}>View</ThemedText>
          </Pressable>
        )}

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <Pressable style={styles.editButton} onPress={onEdit}>
            <ThemedText style={styles.editButtonText}>✏️ Edit</ThemedText>
          </Pressable>
          <Pressable style={styles.exportButton} onPress={onExport}>
            <ThemedText style={styles.exportButtonText}>📤 Export</ThemedText>
          </Pressable>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Action Sheet Modal */}
      <Modal
        visible={showActionSheet}
        transparent
        animationType="slide"
        onRequestClose={() => setShowActionSheet(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowActionSheet(false)}
        >
          <Pressable
            style={styles.actionSheet}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.sheetHandle} />
            <ThemedText style={styles.sheetTitle}>Expense Actions</ThemedText>

            {actions.map((action, i) => (
              <Pressable
                key={i}
                style={styles.actionOption}
                onPress={() => handleAction(action)}
              >
                <View
                  style={[
                    styles.actionIcon,
                    { backgroundColor: action.color + "15" },
                  ]}
                >
                  <ThemedText style={{ fontSize: 18 }}>
                    {action.icon}
                  </ThemedText>
                </View>
                <ThemedText
                  style={[styles.actionLabel, { color: action.color }]}
                >
                  {action.label}
                </ThemedText>
                <ThemedText style={styles.actionArrow}>›</ThemedText>
              </Pressable>
            ))}
          </Pressable>
        </Pressable>
      </Modal>
    </ThemedView>
  );
}
