import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useThemeColor } from "@/hooks/use-theme-color";
import { useState } from "react";
import { Pressable, StyleSheet, TextInput, View } from "react-native";

interface DeleteConfirmationProps {
  vendorName?: string;
  amount?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
}

export function DeleteConfirmationScreen({
  vendorName = "Incredible Connection",
  amount = "R 1,249.00",
  onConfirm,
  onCancel,
}: DeleteConfirmationProps) {
  const [step, setStep] = useState<"confirm" | "deleting" | "deleted">(
    "confirm",
  );
  const [typed, setTyped] = useState("");

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
  const errorColor = "#E53935";

  const confirmText = `DELETE ${vendorName.toUpperCase()}`;
  const isConfirmed = typed === confirmText;

  const handleDelete = () => {
    setStep("deleting");
    setTimeout(() => {
      setStep("deleted");
      setTimeout(() => {
        onConfirm?.();
      }, 800);
    }, 600);
  };

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
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: "700",
      color: "#fff",
      marginBottom: 4,
    },
    headerSubtitle: {
      fontSize: 13,
      color: "rgba(255, 255, 255, 0.55)",
    },
    content: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      padding: 28,
    },
    warningIcon: {
      fontSize: 60,
      marginBottom: 20,
    },
    title: {
      fontSize: 22,
      fontWeight: "800",
      color: textColor,
      marginBottom: 8,
      textAlign: "center",
    },
    message: {
      fontSize: 14,
      color: mutedColor,
      marginBottom: 24,
      textAlign: "center",
      lineHeight: 1.6,
    },
    expenseBox: {
      backgroundColor: cardBackground,
      borderRadius: 12,
      borderWidth: 1.5,
      borderColor: borderColor,
      paddingHorizontal: 16,
      paddingVertical: 12,
      width: "100%",
      marginBottom: 28,
    },
    expenseLabel: {
      fontSize: 12,
      color: mutedColor,
      marginBottom: 4,
      fontWeight: "600",
    },
    expenseValue: {
      fontSize: 16,
      fontWeight: "700",
      color: errorColor,
    },
    inputContainer: {
      backgroundColor: cardBackground,
      borderRadius: 12,
      borderWidth: 1.5,
      borderColor: borderColor,
      paddingHorizontal: 16,
      paddingVertical: 12,
      width: "100%",
      marginBottom: 12,
    },
    inputLabel: {
      fontSize: 12,
      color: mutedColor,
      marginBottom: 6,
      fontWeight: "600",
    },
    input: {
      fontSize: 15,
      fontWeight: "600",
      color: isConfirmed ? "#2E9E8F" : textColor,
      fontFamily: "monospace",
    },
    inputPlaceholder: {
      fontSize: 12,
      color: mutedColor,
      fontWeight: "600",
    },
    buttonContainer: {
      flexDirection: "row",
      gap: 12,
      width: "100%",
      marginTop: 20,
    },
    cancelButton: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 12,
      borderWidth: 1.5,
      borderColor: borderColor,
      alignItems: "center",
    },
    deleteButton: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 12,
      backgroundColor: isConfirmed ? errorColor : "rgba(229, 57, 53, 0.3)",
      alignItems: "center",
    },
    cancelButtonText: {
      fontSize: 14,
      fontWeight: "700",
      color: textColor,
    },
    deleteButtonText: {
      fontSize: 14,
      fontWeight: "700",
      color: "#fff",
    },
    deletingContainer: {
      alignItems: "center",
      justifyContent: "center",
    },
    deletingText: {
      fontSize: 18,
      fontWeight: "700",
      color: textColor,
      marginBottom: 24,
    },
    spinner: {
      width: 40,
      height: 40,
      borderRadius: 20,
      borderWidth: 3,
      borderColor: borderColor,
      borderTopColor: errorColor,
    },
    deletedContainer: {
      alignItems: "center",
      justifyContent: "center",
    },
    deletedIcon: {
      fontSize: 60,
      marginBottom: 20,
    },
    deletedTitle: {
      fontSize: 22,
      fontWeight: "800",
      color: textColor,
      marginBottom: 8,
      textAlign: "center",
    },
    deletedMessage: {
      fontSize: 14,
      color: mutedColor,
      textAlign: "center",
    },
  });

  if (step === "deleting") {
    return (
      <ThemedView style={styles.container}>
        <ThemedView style={styles.header}>
          <ThemedText style={styles.headerTitle}>Deleting...</ThemedText>
        </ThemedView>
        <View style={[styles.content, styles.deletingContainer]}>
          <ThemedText style={styles.deletingText}>Removing expense</ThemedText>
          <View style={styles.spinner} />
        </View>
      </ThemedView>
    );
  }

  if (step === "deleted") {
    return (
      <ThemedView style={styles.container}>
        <ThemedView style={styles.header}>
          <ThemedText style={styles.headerTitle}>Deleted</ThemedText>
        </ThemedView>
        <View style={[styles.content, styles.deletedContainer]}>
          <ThemedText style={styles.deletedIcon}>✓</ThemedText>
          <ThemedText style={styles.deletedTitle}>Expense Removed</ThemedText>
          <ThemedText style={styles.deletedMessage}>
            The expense has been permanently deleted from your records.
          </ThemedText>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedText style={styles.headerTitle}>Delete Expense?</ThemedText>
        <ThemedText style={styles.headerSubtitle}>
          This action cannot be undone
        </ThemedText>
      </ThemedView>

      <View style={styles.content}>
        <ThemedText style={styles.warningIcon}>⚠️</ThemedText>
        <ThemedText style={styles.title}>
          Permanently delete this expense?
        </ThemedText>
        <ThemedText style={styles.message}>
          You are about to remove this transaction from your expense records.
          This action cannot be reversed.
        </ThemedText>

        <View style={styles.expenseBox}>
          <ThemedText style={styles.expenseLabel}>Expense details</ThemedText>
          <ThemedText style={styles.expenseValue}>
            {vendorName} • {amount}
          </ThemedText>
        </View>

        <View style={styles.inputContainer}>
          <ThemedText style={styles.inputLabel}>
            Type "{confirmText}" to confirm deletion
          </ThemedText>
          <TextInput
            style={styles.input}
            value={typed}
            onChangeText={setTyped}
            placeholder={confirmText}
            placeholderTextColor={mutedColor}
            autoCapitalize="characters"
          />
        </View>

        <ThemedText
          style={[
            styles.inputLabel,
            { marginBottom: 24, opacity: isConfirmed ? 1 : 0.5 },
          ]}
        >
          {isConfirmed ? "✓ Confirmed" : "Awaiting confirmation..."}
        </ThemedText>

        <View style={styles.buttonContainer}>
          <Pressable style={styles.cancelButton} onPress={onCancel}>
            <ThemedText style={styles.cancelButtonText}>Cancel</ThemedText>
          </Pressable>
          <Pressable
            style={styles.deleteButton}
            onPress={handleDelete}
            disabled={!isConfirmed}
          >
            <ThemedText style={styles.deleteButtonText}>
              {isConfirmed ? "🗑️ Delete" : "Delete"}
            </ThemedText>
          </Pressable>
        </View>
      </View>
    </ThemedView>
  );
}
