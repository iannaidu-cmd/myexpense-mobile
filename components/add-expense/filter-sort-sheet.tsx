import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useThemeColor } from "@/hooks/use-theme-color";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";

interface FilterSortSheetProps {
  onApplyFilters?: (filters: { sortBy: string; filterBy: string }) => void;
  onCancel?: () => void;
}

export function FilterSortSheet({
  onApplyFilters,
  onCancel,
}: FilterSortSheetProps) {
  const [sortBy, setSortBy] = useState("date");
  const [filterBy, setFilterBy] = useState("all");

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

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor,
    },
    header: {
      paddingHorizontal: 24,
      paddingTop: 20,
      paddingBottom: 24,
      backgroundColor: "rgba(21, 101, 192, 0.95)",
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: "700",
      color: "#fff",
    },
    closeButton: {
      fontSize: 24,
      color: "rgba(255,255,255,0.65)",
    },
    content: {
      flex: 1,
      padding: 20,
    },
    section: {
      marginBottom: 28,
    },
    sectionTitle: {
      fontSize: 14,
      fontWeight: "700",
      color: textColor,
      marginBottom: 12,
      letterSpacing: 0.5,
    },
    optionContainer: {
      backgroundColor: cardBackground,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: borderColor,
      overflow: "hidden",
    },
    option: {
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: borderColor,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    optionLast: {
      borderBottomWidth: 0,
    },
    optionText: {
      fontSize: 15,
      fontWeight: "600",
      color: textColor,
    },
    optionSelected: {
      backgroundColor: "rgba(59, 191, 173, 0.08)",
    },
    checkmark: {
      fontSize: 16,
      color: accentColor,
    },
    buttonContainer: {
      flexDirection: "row",
      gap: 12,
      paddingHorizontal: 20,
      paddingVertical: 20,
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
    applyButton: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 12,
      backgroundColor: accentColor,
      alignItems: "center",
    },
    buttonText: {
      fontSize: 14,
      fontWeight: "700",
      color: textColor,
    },
    applyButtonText: {
      color: "#0D47A1",
    },
  });

  const sortOptions = [
    { id: "date", label: "📅 Date (Newest)" },
    { id: "amount", label: "💵 Amount (Highest)" },
    { id: "vendor", label: "🏢 Vendor (A-Z)" },
  ];

  const filterOptions = [
    { id: "all", label: "All expenses" },
    { id: "deductible", label: "✓ Deductible only" },
    { id: "non-deductible", label: "✗ Non-deductible" },
    { id: "month", label: "📅 This month" },
  ];

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedText style={styles.headerTitle}>Filter & sort</ThemedText>
        <Pressable onPress={onCancel}>
          <ThemedText style={styles.closeButton}>✕</ThemedText>
        </Pressable>
      </ThemedView>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Sort Section */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Sort by</ThemedText>
          <View style={styles.optionContainer}>
            {sortOptions.map((option, index) => (
              <Pressable
                key={option.id}
                onPress={() => setSortBy(option.id)}
                style={[
                  styles.option,
                  index === sortOptions.length - 1 && styles.optionLast,
                  sortBy === option.id && styles.optionSelected,
                ]}
              >
                <ThemedText style={styles.optionText}>
                  {option.label}
                </ThemedText>
                {sortBy === option.id && (
                  <ThemedText style={styles.checkmark}>✓</ThemedText>
                )}
              </Pressable>
            ))}
          </View>
        </View>

        {/* Filter Section */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Filter by</ThemedText>
          <View style={styles.optionContainer}>
            {filterOptions.map((option, index) => (
              <Pressable
                key={option.id}
                onPress={() => setFilterBy(option.id)}
                style={[
                  styles.option,
                  index === filterOptions.length - 1 && styles.optionLast,
                  filterBy === option.id && styles.optionSelected,
                ]}
              >
                <ThemedText style={styles.optionText}>
                  {option.label}
                </ThemedText>
                {filterBy === option.id && (
                  <ThemedText style={styles.checkmark}>✓</ThemedText>
                )}
              </Pressable>
            ))}
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        <Pressable style={styles.cancelButton} onPress={onCancel}>
          <ThemedText style={styles.buttonText}>Cancel</ThemedText>
        </Pressable>
        <Pressable
          style={styles.applyButton}
          onPress={() => {
            onApplyFilters?.({ sortBy, filterBy });
            onCancel?.();
          }}
        >
          <ThemedText style={[styles.buttonText, styles.applyButtonText]}>
            Apply
          </ThemedText>
        </Pressable>
      </View>
    </ThemedView>
  );
}
