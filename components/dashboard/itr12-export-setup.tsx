import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useThemeColor } from "@/hooks/use-theme-color";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Switch, View } from "react-native";

interface TaxYear {
  label: string;
  range: string;
  current: boolean;
}

interface ExportCategory {
  name: string;
  icon: string;
  color: string;
  amount: number;
  included: boolean;
  note?: string;
}

interface ExportFormat {
  id: string;
  label: string;
  icon: string;
  description: string;
}

type ExportStep = "year" | "categories" | "format" | "options";

interface ITR12ExportSetupProps {
  onExport?: (config: ITR12ExportConfig) => void;
  onCancel?: () => void;
}

interface ITR12ExportConfig {
  taxYear: string;
  categories: ExportCategory[];
  format: string;
  includeVAT: boolean;
  includeReceipts: boolean;
  totalAmount: number;
}

const TAX_YEARS: TaxYear[] = [
  { label: "2026", range: "1 Mar 2025 – 28 Feb 2026", current: true },
  { label: "2025", range: "1 Mar 2024 – 28 Feb 2025", current: false },
  { label: "2024", range: "1 Mar 2023 – 28 Feb 2024", current: false },
];

const EXPORT_CATEGORIES: ExportCategory[] = [
  {
    name: "Software & Tech",
    icon: "💻",
    color: "#1976D2",
    amount: 12400,
    included: true,
  },
  {
    name: "Travel & Transport",
    icon: "🚗",
    color: "#0288D1",
    amount: 9200,
    included: true,
  },
  {
    name: "Office & Stationery",
    icon: "📁",
    color: "#1565C0",
    amount: 7800,
    included: true,
  },
  {
    name: "Professional Services",
    icon: "📋",
    color: "#48D1C0",
    amount: 6100,
    included: true,
  },
  {
    name: "Meals & Entertainment",
    icon: "🍽️",
    color: "#E07060",
    amount: 3400,
    included: true,
    note: "50% only",
  },
  {
    name: "Home Office",
    icon: "🏠",
    color: "#0288D1",

const EXPORT_FORMATS: ExportFormat[] = [
  {
    id: "pdf",
    label: "PDF Report",
    icon: "📄",
    description: "Formatted for SARS submission",
  },
  {
    id: "csv",
    label: "CSV Export",
    icon: "📊",
    description: "Spreadsheet-compatible format",
  },
  {
    id: "itr12",
    label: "ITR12 Summary",
    icon: "🏛️",
    description: "SARS field-mapped breakdown",
  },
];

export function ITR12ExportSetupScreen({ onExport, onCancel }: ITR12ExportSetupProps) {
  const [currentStep, setCurrentStep] = useState<ExportStep>("year");
  const [selectedYear, setSelectedYear] = useState(0);
  const [categories, setCategories] = useState(EXPORT_CATEGORIES);
  const [selectedFormat, setSelectedFormat] = useState("pdf");
  const [includeVAT, setIncludeVAT] = useState(true);
  const [includeReceipts, setIncludeReceipts] = useState(true);

  const backgroundColor = useThemeColor(
    { light: "#F5F5F5", dark: "#0D47A1" },
    "background",
  );
  const cardBackground = useThemeColor(
    { light: "#F5F5F5", dark: "#1565C0" },
    "background",
  );
  const textColor = useThemeColor({}, "text");
  const mutedColor = useThemeColor(
    { light: "#757575", dark: "#9E9E9E" },
    "text",
  );
  const borderColor = useThemeColor(
    { light: "#E0E0E0", dark: "#1976D2" },
    "text",
  );
  const accentColor = "#0288D1";

  const toggleCategory = (index: number) => {
    setCategories((prev) =>
      prev.map((cat, i) =>
        i === index ? { ...cat, included: !cat.included } : cat,
      ),
    );
  };

  const calculateTotal = () => {
    return categories.reduce((sum, cat) => {
      if (!cat.included) return sum;
      const amount = cat.note ? Math.round(cat.amount * 0.5) : cat.amount;
      return sum + amount;
    }, 0);
  };

  const totalAmount = calculateTotal();

  const handleExport = () => {
    const config: ITR12ExportConfig = {
      taxYear: TAX_YEARS[selectedYear].label,
      categories,
      format: selectedFormat,
      includeVAT,
      includeReceipts,
      totalAmount,
    };
    onExport?.(config);
  };

  const steps: Array<{ id: ExportStep; label: string }> = [
    { id: "year", label: "Tax Year" },
    { id: "categories", label: "Categories" },
    { id: "format", label: "Format" },
    { id: "options", label: "Options" },
  ];

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
      gap: 12,
      marginBottom: 16,
    },
    backButton: {
      fontSize: 22,
      color: "rgba(255, 255, 255, 0.65)",
    },
    headerTitle: {
      fontSize: 22,
      fontWeight: "800",
      color: "#fff",
      marginBottom: 6,
    },
    headerSubtext: {
      fontSize: 12,
      color: "rgba(255, 255, 255, 0.5)",
      marginBottom: 10,
    },
    totalBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      backgroundColor: "rgba(59, 191, 173, 0.18)",
      borderRadius: 20,
      paddingHorizontal: 14,
      paddingVertical: 5,
      borderWidth: 1,
      borderColor: "rgba(59, 191, 173, 0.35)",
      alignSelf: "flex-start",
    },
    totalBadgeText: {
      color: accentColor,
      fontSize: 11,
      fontWeight: "700",
    },
    content: {
      flex: 1,
    },
    stepsContainer: {
      flexDirection: "row",
      gap: 8,
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: borderColor,
    },
    stepButton: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 6,
      backgroundColor: "transparent",
      borderWidth: 1,
      borderColor: borderColor,
    },
    stepButtonActive: {
      backgroundColor: accentColor,
      borderColor: accentColor,
    },
    stepButtonText: {
      fontSize: 12,
      fontWeight: "600",
      color: mutedColor,
    },
    stepButtonTextActive: {
      color: "#FFFFFF",
    },
    stepContent: {
      padding: 20,
    },
    stepTitle: {
      fontSize: 14,
      fontWeight: "700",
      color: textColor,
      marginBottom: 16,
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    yearOption: {
      backgroundColor: cardBackground,
      borderRadius: 12,
      borderWidth: 2,
      paddingHorizontal: 16,
      paddingVertical: 14,
      marginBottom: 10,
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    yearOptionSelected: {
      borderColor: accentColor,
      backgroundColor: "rgba(59, 191, 173, 0.08)",
    },
    yearOptionUnselected: {
      borderColor: borderColor,
    },
    yearLabel: {
      fontSize: 16,
      fontWeight: "700",
      color: textColor,
    },
    yearBadge: {
      backgroundColor: accentColor,
      borderRadius: 4,
      paddingHorizontal: 6,
      paddingVertical: 2,
      marginLeft: 8,
    },
    yearBadgeText: {
      fontSize: 10,
      fontWeight: "700",
      color: "#FFFFFF",
    },
    yearRange: {
      fontSize: 12,
      color: mutedColor,
      marginTop: 4,
      flex: 1,
    },
    categoryItem: {
      backgroundColor: cardBackground,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: borderColor,
      paddingHorizontal: 14,
      paddingVertical: 12,
      marginBottom: 10,
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    categoryCheckbox: {
      width: 24,
      height: 24,
      borderRadius: 6,
      borderWidth: 2,
      borderColor: borderColor,
      alignItems: "center",
      justifyContent: "center",
    },
    categoryCheckboxChecked: {
      backgroundColor: accentColor,
      borderColor: accentColor,
    },
    categoryIcon: {
      fontSize: 18,
    },
    categoryInfo: {
      flex: 1,
    },
    categoryName: {
      fontSize: 13,
      fontWeight: "600",
      color: textColor,
    },
    categoryAmount: {
      fontSize: 12,
      color: mutedColor,
      marginTop: 2,
    },
    categoryNote: {
      fontSize: 10,
      fontWeight: "600",
      color: accentColor,
      marginTop: 2,
    },
    formatOption: {
      backgroundColor: cardBackground,
      borderRadius: 12,
      borderWidth: 2,
      paddingHorizontal: 16,
      paddingVertical: 14,
      marginBottom: 10,
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    formatOptionSelected: {
      borderColor: accentColor,
      backgroundColor: "rgba(59, 191, 173, 0.08)",
    },
    formatOptionUnselected: {
      borderColor: borderColor,
    },
    formatIcon: {
      fontSize: 24,
    },
    formatInfo: {
      flex: 1,
    },
    formatLabel: {
      fontSize: 14,
      fontWeight: "700",
      color: textColor,
    },
    formatDescription: {
      fontSize: 12,
      color: mutedColor,
      marginTop: 2,
    },
    optionRow: {
      backgroundColor: cardBackground,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: borderColor,
      paddingHorizontal: 16,
      paddingVertical: 14,
      marginBottom: 10,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    optionLabel: {
      fontSize: 14,
      fontWeight: "600",
      color: textColor,
    },
    optionSubtext: {
      fontSize: 12,
      color: mutedColor,
      marginTop: 2,
    },
    navigationContainer: {
      flexDirection: "row",
      gap: 12,
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderTopWidth: 1,
      borderTopColor: borderColor,
    },
    cancelButton: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 12,
      borderWidth: 1.5,
      borderColor: borderColor,
      alignItems: "center",
    },
    cancelButtonText: {
      fontSize: 14,
      fontWeight: "700",
      color: textColor,
    },
    nextButton: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 12,
      backgroundColor: accentColor,
      alignItems: "center",
    },
    nextButtonText: {
      fontSize: 14,
      fontWeight: "700",
      color: "#FFFFFF",
    },
    exportButton: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 12,
      backgroundColor: accentColor,
      alignItems: "center",
    },
    exportButtonText: {
      fontSize: 14,
      fontWeight: "700",
      color: "#FFFFFF",
    },
    bottomSpacing: {
      height: 20,
    },
  });

  const renderStepContent = () => {
    switch (currentStep) {
      case "year":
        return (
          <View>
            <ThemedText style={styles.stepTitle}>Select Tax Year</ThemedText>
            {TAX_YEARS.map((year, index) => (
              <Pressable
                key={year.label}
                onPress={() => setSelectedYear(index)}
                style={[
                  styles.yearOption,
                  selectedYear === index
                    ? styles.yearOptionSelected
                    : styles.yearOptionUnselected,
                ]}
              >
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <ThemedText style={styles.yearLabel}>
                      {year.label}
                    </ThemedText>
                    {year.current && (
                      <View style={styles.yearBadge}>
                        <ThemedText style={styles.yearBadgeText}>
                          Current
                        </ThemedText>
                      </View>
                    )}
                  </View>
                  <ThemedText style={styles.yearRange}>{year.range}</ThemedText>
                </View>
                <View
                  style={[
                    styles.categoryCheckbox,
                    selectedYear === index && styles.categoryCheckboxChecked,
                  ]}
                >
                  {selectedYear === index && (
                    <ThemedText style={{ color: "#fff", fontSize: 14 }}>
                      ✓
                    </ThemedText>
                  )}
                </View>
              </Pressable>
            ))}
          </View>
        );

      case "categories":
        return (
          <View>
            <ThemedText style={styles.stepTitle}>Select Categories</ThemedText>
            {categories.map((cat, index) => (
              <Pressable
                key={cat.name}
                onPress={() => toggleCategory(index)}
                style={styles.categoryItem}
              >
                <View
                  style={[
                    styles.categoryCheckbox,
                    cat.included && styles.categoryCheckboxChecked,
                  ]}
                >
                  {cat.included && (
                    <ThemedText style={{ color: "#fff", fontSize: 12 }}>
                      ✓
                    </ThemedText>
                  )}
                </View>
                <ThemedText style={styles.categoryIcon}>{cat.icon}</ThemedText>
                <View style={styles.categoryInfo}>
                  <ThemedText style={styles.categoryName}>
                    {cat.name}
                  </ThemedText>
                  <ThemedText style={styles.categoryAmount}>
                    R {cat.amount.toLocaleString()}
                  </ThemedText>
                  {cat.note && (
                    <ThemedText style={styles.categoryNote}>
                      {cat.note}
                    </ThemedText>
                  )}
                </View>
              </Pressable>
            ))}
          </View>
        );

      case "format":
        return (
          <View>
            <ThemedText style={styles.stepTitle}>
              Choose Export Format
            </ThemedText>
            {EXPORT_FORMATS.map((format) => (
              <Pressable
                key={format.id}
                onPress={() => setSelectedFormat(format.id)}
                style={[
                  styles.formatOption,
                  selectedFormat === format.id
                    ? styles.formatOptionSelected
                    : styles.formatOptionUnselected,
                ]}
              >
                <ThemedText style={styles.formatIcon}>{format.icon}</ThemedText>
                <View style={styles.formatInfo}>
                  <ThemedText style={styles.formatLabel}>
                    {format.label}
                  </ThemedText>
                  <ThemedText style={styles.formatDescription}>
                    {format.description}
                  </ThemedText>
                </View>
                <View
                  style={[
                    styles.categoryCheckbox,
                    selectedFormat === format.id &&
                      styles.categoryCheckboxChecked,
                  ]}
                >
                  {selectedFormat === format.id && (
                    <ThemedText style={{ color: "#fff", fontSize: 14 }}>
                      ✓
                    </ThemedText>
                  )}
                </View>
              </Pressable>
            ))}
          </View>
        );

      case "options":
        return (
          <View>
            <ThemedText style={styles.stepTitle}>Export Options</ThemedText>
            <View style={styles.optionRow}>
              <View>
                <ThemedText style={styles.optionLabel}>Include VAT</ThemedText>
                <ThemedText style={styles.optionSubtext}>
                  Add VAT amounts to report
                </ThemedText>
              </View>
              <Switch value={includeVAT} onValueChange={setIncludeVAT} />
            </View>
            <View style={styles.optionRow}>
              <View>
                <ThemedText style={styles.optionLabel}>
                  Include Receipts
                </ThemedText>
                <ThemedText style={styles.optionSubtext}>
                  Attach receipt files to export
                </ThemedText>
              </View>
              <Switch
                value={includeReceipts}
                onValueChange={setIncludeReceipts}
              />
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  const stepIndex = steps.findIndex((s) => s.id === currentStep);
  const isLastStep = stepIndex === steps.length - 1;

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <ThemedView style={styles.header}>
        <View style={styles.headerTop}>
          <Pressable onPress={onCancel}>
            <ThemedText style={styles.backButton}>←</ThemedText>
          </Pressable>
        </View>
        <ThemedText style={styles.headerTitle}>ITR12 Export Setup</ThemedText>
        <ThemedText style={styles.headerSubtext}>
          Configure your SARS expense report
        </ThemedText>
        <View style={styles.totalBadge}>
          <ThemedText style={styles.totalBadgeText}>
            Total to export: R {totalAmount.toLocaleString()}
          </ThemedText>
        </View>
      </ThemedView>

      {/* Step Buttons */}
      <View style={styles.stepsContainer}>
        {steps.map((step) => (
          <Pressable
            key={step.id}
            onPress={() => setCurrentStep(step.id)}
            style={[
              styles.stepButton,
              currentStep === step.id && styles.stepButtonActive,
            ]}
          >
            <ThemedText
              style={[
                styles.stepButtonText,
                currentStep === step.id && styles.stepButtonTextActive,
              ]}
            >
              {step.label}
            </ThemedText>
          </Pressable>
        ))}
      </View>

      {/* Step Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.stepContent}>{renderStepContent()}</View>
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Navigation Buttons */}
      <View style={styles.navigationContainer}>
        <Pressable style={styles.cancelButton} onPress={onCancel}>
          <ThemedText style={styles.cancelButtonText}>Cancel</ThemedText>
        </Pressable>
        {isLastStep ? (
          <Pressable style={styles.exportButton} onPress={handleExport}>
            <ThemedText style={styles.exportButtonText}>📤 Export</ThemedText>
          </Pressable>
        ) : (
          <Pressable
            style={styles.nextButton}
            onPress={() => {
              const nextIndex = stepIndex + 1;
              if (nextIndex < steps.length) {
                setCurrentStep(steps[nextIndex].id);
              }
            }}
          >
            <ThemedText style={styles.nextButtonText}>Next →</ThemedText>
          </Pressable>
        )}
      </View>
    </ThemedView>
  );
}
