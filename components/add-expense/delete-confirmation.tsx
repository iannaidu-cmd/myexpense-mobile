import { colour, radius, space, typography } from "@/tokens";
import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";

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

  // ── Deleting state ──────────────────────────────────────────────────────────
  if (step === "deleting") {
    return (
      <View style={{ flex: 1, backgroundColor: colour.white }}>
        <View
          style={{
            paddingHorizontal: space.xl,
            paddingTop: space.xl,
            paddingBottom: space.xl,
            backgroundColor: colour.dangerBg,
          }}
        >
          <Text style={{ ...typography.h3, color: colour.danger }}>
            Deleting...
          </Text>
        </View>
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ ...typography.h4, color: colour.text, marginBottom: space.xl }}>
            Removing expense
          </Text>
          {/* Spinner ring */}
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              borderWidth: 3,
              borderColor: colour.borderLight,
              borderTopColor: colour.danger,
            }}
          />
        </View>
      </View>
    );
  }

  // ── Deleted state ───────────────────────────────────────────────────────────
  if (step === "deleted") {
    return (
      <View style={{ flex: 1, backgroundColor: colour.white }}>
        <View
          style={{
            paddingHorizontal: space.xl,
            paddingTop: space.xl,
            paddingBottom: space.xl,
            backgroundColor: colour.successBg,
          }}
        >
          <Text style={{ ...typography.h3, color: colour.success }}>
            Deleted
          </Text>
        </View>
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: space.xl,
          }}
        >
          <Text style={{ fontSize: 60, marginBottom: space.xl }}>✓</Text>
          <Text style={{ ...typography.h3, color: colour.text, marginBottom: space.sm, textAlign: "center" }}>
            Expense Removed
          </Text>
          <Text style={{ ...typography.bodyM, color: colour.textSub, textAlign: "center" }}>
            The expense has been permanently deleted from your records.
          </Text>
        </View>
      </View>
    );
  }

  // ── Confirm state ───────────────────────────────────────────────────────────
  return (
    <View style={{ flex: 1, backgroundColor: colour.white }}>
      {/* Header */}
      <View
        style={{
          paddingHorizontal: space.xl,
          paddingTop: space.xl,
          paddingBottom: space.xl,
          backgroundColor: colour.dangerBg,
          borderBottomWidth: 1,
          borderBottomColor: colour.dangerMid,
        }}
      >
        <Text style={{ ...typography.h3, color: colour.danger, marginBottom: space.xs }}>
          Delete Expense?
        </Text>
        <Text style={{ ...typography.bodyS, color: colour.danger }}>
          This action cannot be undone
        </Text>
      </View>

      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          padding: 28,
        }}
      >
        <Text style={{ fontSize: 60, marginBottom: space.xl }}>⚠️</Text>
        <Text
          style={{
            ...typography.h4,
            color: colour.text,
            marginBottom: space.sm,
            textAlign: "center",
          }}
        >
          Permanently delete this expense?
        </Text>
        <Text
          style={{
            ...typography.bodyM,
            color: colour.textSub,
            marginBottom: space.xl,
            textAlign: "center",
            lineHeight: 22,
          }}
        >
          You are about to remove this transaction from your expense records.
          This action cannot be reversed.
        </Text>

        {/* Expense summary box */}
        <View
          style={{
            backgroundColor: colour.surface1,
            borderRadius: radius.md,
            borderWidth: 1.5,
            borderColor: colour.border,
            paddingHorizontal: space.lg,
            paddingVertical: space.md,
            width: "100%",
            marginBottom: space.xl,
          }}
        >
          <Text style={{ ...typography.labelS, color: colour.textSub, marginBottom: space.xs }}>
            Expense details
          </Text>
          <Text style={{ ...typography.labelM, color: colour.danger }}>
            {vendorName} • {amount}
          </Text>
        </View>

        {/* Confirmation input */}
        <View
          style={{
            backgroundColor: colour.surface1,
            borderRadius: radius.md,
            borderWidth: 1.5,
            borderColor: isConfirmed ? colour.danger : colour.border,
            paddingHorizontal: space.lg,
            paddingVertical: space.md,
            width: "100%",
            marginBottom: space.sm,
          }}
        >
          <Text style={{ ...typography.labelS, color: colour.textSub, marginBottom: space.sm }}>
            Type "{confirmText}" to confirm deletion
          </Text>
          <TextInput
            style={{
              ...typography.bodyM,
              color: isConfirmed ? colour.danger : colour.text,
              fontFamily: "monospace",
            }}
            value={typed}
            onChangeText={setTyped}
            placeholder={confirmText}
            placeholderTextColor={colour.textHint}
            autoCapitalize="characters"
          />
        </View>

        <Text
          style={{
            ...typography.labelS,
            color: isConfirmed ? colour.danger : colour.textHint,
            marginBottom: space.xl,
            opacity: isConfirmed ? 1 : 0.5,
          }}
        >
          {isConfirmed ? "✓ Confirmed" : "Awaiting confirmation..."}
        </Text>

        {/* Buttons */}
        <View
          style={{
            flexDirection: "row",
            gap: space.md,
            width: "100%",
          }}
        >
          <Pressable
            style={{
              flex: 1,
              paddingVertical: 12,
              borderRadius: radius.md,
              borderWidth: 1.5,
              borderColor: colour.border,
              alignItems: "center",
            }}
            onPress={onCancel}
          >
            <Text style={{ ...typography.labelM, color: colour.text }}>
              Cancel
            </Text>
          </Pressable>
          <Pressable
            style={{
              flex: 1,
              paddingVertical: 12,
              borderRadius: radius.md,
              backgroundColor: isConfirmed
                ? colour.danger
                : colour.dangerBg,
              alignItems: "center",
            }}
            onPress={handleDelete}
            disabled={!isConfirmed}
          >
            <Text
              style={{
                ...typography.labelM,
                color: isConfirmed ? colour.white : colour.dangerMid,
              }}
            >
              {isConfirmed ? "🗑️ Delete" : "Delete"}
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
