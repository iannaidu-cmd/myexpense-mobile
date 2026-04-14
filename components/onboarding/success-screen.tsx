import { colour, radius, space, typography } from "@/tokens";
import { Text, TouchableOpacity, View } from "react-native";
import type { OnboardingData, WorkType } from "./types";

interface SuccessScreenProps {
  data: OnboardingData;
  workTypes: WorkType[];
  onComplete: () => void;
}

export function SuccessScreen({
  data,
  workTypes,
  onComplete,
}: SuccessScreenProps) {
  const selectedWorkType =
    data.workTypeIdx !== null ? workTypes[data.workTypeIdx]?.label : "Not set";
  const taxYear = "2026 (1 Mar – 28 Feb)";

  const summaryRows = [
    { label: "Work type",   value: selectedWorkType          },
    { label: "Tax number",  value: data.taxNumber || "Not added yet" },
    { label: "Tax year",    value: taxYear                   },
  ];

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colour.white,
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 40,
        paddingHorizontal: 28,
      }}
    >
      {/* Success circle */}
      <View
        style={{
          width: 100,
          height: 100,
          borderRadius: 50,
          backgroundColor: colour.primary,
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 28,
        }}
      >
        <Text style={{ fontSize: 48, color: colour.white, fontWeight: "900" }}>
          ✓
        </Text>
      </View>

      <Text
        style={{
          ...typography.h2,
          color: colour.text,
          marginBottom: 10,
          textAlign: "center",
        }}
      >
        Welcome to MyExpense{data.name ? `, ${data.name}` : ""}!
      </Text>

      <Text
        style={{
          ...typography.bodyM,
          color: colour.textSub,
          lineHeight: 22,
          marginBottom: 36,
          textAlign: "center",
        }}
      >
        Your account is ready. Start scanning receipts and we'll handle the tax
        categorisation.
      </Text>

      {/* Summary card */}
      <View
        style={{
          backgroundColor: colour.surface1,
          borderRadius: radius.lg,
          paddingVertical: 20,
          paddingHorizontal: 24,
          width: "100%",
          marginBottom: 32,
          borderWidth: 1,
          borderColor: colour.surface2,
        }}
      >
        {summaryRows.map((row, i) => (
          <View
            key={i}
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              paddingVertical: 9,
              ...(i < summaryRows.length - 1
                ? { borderBottomWidth: 1, borderBottomColor: colour.surface2 }
                : {}),
            }}
          >
            <Text style={{ ...typography.bodyS, color: colour.textHint }}>
              {row.label}
            </Text>
            <Text
              style={{
                ...typography.bodyM,
                color: colour.text,
                fontWeight: "600",
              }}
            >
              {row.value}
            </Text>
          </View>
        ))}
      </View>

      {/* Go to dashboard */}
      <TouchableOpacity
        style={{
          backgroundColor: colour.primary,
          borderRadius: radius.pill,
          paddingVertical: 16,
          paddingHorizontal: 16,
          width: "100%",
          alignItems: "center",
          justifyContent: "center",
        }}
        onPress={onComplete}
        accessibilityRole="button"
        accessibilityLabel="Go to dashboard"
      >
        <Text
          style={{ ...typography.btnL, color: colour.white, fontWeight: "800" }}
        >
          Go to Dashboard →
        </Text>
      </TouchableOpacity>
    </View>
  );
}
