import { ThemedText } from "@/components/themed-text";
import {
    Image,
    ScrollView,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import type { OnboardingData, WorkType } from "./types";

// ─── SetupForm ────────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────

interface SetupFormProps {
  data: OnboardingData;
  workTypes: WorkType[];
  onChange: (updates: Partial<OnboardingData>) => void;
  onContinue: () => void;
  logoSource: number | { uri: string };
}

export function SetupForm({
  data,
  workTypes,
  onChange,
  onContinue,
  logoSource,
}: SetupFormProps) {
  const isValid = data.name.trim().length > 0 && data.workTypeIdx !== null;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Image
          source={logoSource}
          style={styles.logoImage}
          resizeMode="contain"
        />
        <ThemedText style={styles.title}>Let's set you up</ThemedText>
        <ThemedText style={styles.subtitle}>
          Just 3 quick steps — takes under a minute
        </ThemedText>

        {/* Progress dots */}
        <View style={styles.progressDots}>
          {[0, 1, 2].map((i) => (
            <View
              key={i}
              style={[
                styles.progressDot,
                {
                  width: i === 0 ? 24 : 8,
                  opacity: i === 0 ? 1 : 0.3,
                },
              ]}
            />
          ))}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        scrollEventThrottle={16}
      >
        {/* Name field */}
        <View style={styles.formGroup}>
          <ThemedText style={styles.fieldLabel}>YOUR NAME</ThemedText>
          <TextInput
            value={data.name}
            onChangeText={(name) => onChange({ name })}
            placeholder="e.g. Ian van der Merwe"
            style={styles.textInput}
            placeholderTextColor="#C5C6CC"
          />
        </View>

        {/* Tax number field */}
        <View style={styles.formGroup}>
          <ThemedText style={styles.fieldLabel}>
            SARS TAX NUMBER{" "}
            <ThemedText style={styles.optional}>(optional)</ThemedText>
          </ThemedText>
          <TextInput
            value={data.taxNumber}
            onChangeText={(taxNumber) => onChange({ taxNumber })}
            placeholder="e.g. 1234567890"
            style={styles.textInput}
            placeholderTextColor="#C5C6CC"
          />
          <ThemedText style={styles.fieldHint}>
            Used to pre-fill your ITR12 export
          </ThemedText>
        </View>

        {/* Work type selection */}
        <View style={styles.formGroup}>
          <ThemedText style={styles.fieldLabel}>HOW DO YOU WORK?</ThemedText>
          <View style={styles.workTypeGrid}>
            {workTypes.map((workType, i) => (
              <TouchableOpacity
                key={i}
                style={[
                  styles.workTypeOption,
                  {
                    backgroundColor:
                      data.workTypeIdx === i ? "#EAF2FF" : "#FFFFFF",
                    borderColor: data.workTypeIdx === i ? "#006FFD" : "#E8E9F1",
                  },
                ]}
                onPress={() => onChange({ workTypeIdx: i })}
                accessibilityRole="button"
                accessibilityState={{ selected: data.workTypeIdx === i }}
              >
                <ThemedText style={styles.workTypeIcon}>
                  {workType.icon}
                </ThemedText>
                <ThemedText
                  style={[
                    styles.workTypeLabel,
                    { color: data.workTypeIdx === i ? "#006FFD" : "#494A50" },
                  ]}
                >
                  {workType.label}
                </ThemedText>
                {data.workTypeIdx === i && (
                  <View style={styles.checkmark}>
                    <ThemedText style={styles.checkmarkIcon}>✓</ThemedText>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Continue button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.continueButton, !isValid && styles.buttonDisabled]}
          onPress={onContinue}
          disabled={!isValid}
          accessibilityRole="button"
          accessibilityLabel="Continue to next setup step"
        >
          <ThemedText style={styles.continueButtonText}>Continue →</ThemedText>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FE",
    flexDirection: "column",
  },
  header: {
    backgroundColor: "#FFFFFF",
    paddingTop: 52,
    paddingBottom: 20,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: "#E8E9F1",
  },
  logoImage: {
    width: "55%",
    height: 32,
    marginBottom: 20,
  },
  title: {
    color: "#1F2024",
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 6,
  },
  subtitle: {
    color: "#494A50",
    fontSize: 13,
    marginBottom: 16,
  },
  progressDots: {
    flexDirection: "row",
    gap: 6,
  },
  progressDot: {
    height: 4,
    borderRadius: 2,
    backgroundColor: "#006FFD",
  },
  scrollContent: {
    paddingVertical: 24,
    paddingHorizontal: 22,
  },
  formGroup: {
    marginBottom: 24,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#006FFD",
    marginBottom: 8,
  },
  optional: {
    color: "#9E9E9E",
    fontWeight: "400",
  },
  textInput: {
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#D4D6DD",
    paddingVertical: 13,
    paddingHorizontal: 16,
    fontSize: 14,
    color: "#1F2024",
    backgroundColor: "#FFFFFF",
  },
  fieldHint: {
    fontSize: 11,
    color: "#71727A",
    marginTop: 6,
    paddingLeft: 4,
  },
  workTypeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    justifyContent: "space-between",
  },
  workTypeOption: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    width: "48%",
    paddingVertical: 14,
    paddingHorizontal: 10,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  workTypeIcon: {
    fontSize: 24,
    marginBottom: 6,
  },
  workTypeLabel: {
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
  },
  checkmark: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#006FFD",
    alignItems: "center",
    justifyContent: "center",
  },
  checkmarkIcon: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "800",
  },
  footer: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E8E9F1",
  },
  continueButton: {
    backgroundColor: "#006FFD",
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  continueButtonText: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 15,
  },
});
