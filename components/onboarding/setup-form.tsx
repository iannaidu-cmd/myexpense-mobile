import { ThemedText } from "@/components/themed-text";
import {
    ScrollView,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import type { OnboardingData, WorkType } from "./types";

interface SetupFormProps {
  data: OnboardingData;
  workTypes: WorkType[];
  onChange: (updates: Partial<OnboardingData>) => void;
  onContinue: () => void;
  logoUri: string;
}

export function SetupForm({
  data,
  workTypes,
  onChange,
  onContinue,
  logoUri,
}: SetupFormProps) {
  const isValid = data.name.trim().length > 0 && data.workTypeIdx !== null;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <ThemedText style={styles.logo}>{logoUri}</ThemedText>
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
            placeholderTextColor="rgba(139, 136, 187, 0.4)"
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
            placeholderTextColor="rgba(139, 136, 187, 0.4)"
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
                      data.workTypeIdx === i ? "rgba(21,101,192,0.08)" : "#fff",
                    borderColor: data.workTypeIdx === i ? "#1565C0" : "#F5F5F5",
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
                    {
                      color: data.workTypeIdx === i ? "#1565C0" : "#757575",
                    },
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
    backgroundColor: "#F5F5F5",
    flexDirection: "column",
  },
  header: {
    backgroundColor: "#1565C0",
    paddingVertical: 20,
    paddingHorizontal: 24,
  },
  logo: {
    height: 30,
    marginBottom: 20,
  },
  title: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 6,
  },
  subtitle: {
    color: "#9E9E9E",
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
    backgroundColor: "#0288D1",
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
    color: "#1565C0",
    marginBottom: 8,
  },
  optional: {
    color: "#757575",
    fontWeight: "400",
  },
  textInput: {
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#E0E0E0",
    paddingVertical: 13,
    paddingHorizontal: 16,
    fontSize: 14,
    color: "#0D47A1",
    backgroundColor: "#fff",
  },
  fieldHint: {
    fontSize: 11,
    color: "#757575",
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
    backgroundColor: "#1565C0",
    alignItems: "center",
    justifyContent: "center",
  },
  checkmarkIcon: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "800",
  },
  footer: {
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  continueButton: {
    backgroundColor: "#0288D1",
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  continueButtonText: {
    color: "#0D47A1",
    fontWeight: "800",
    fontSize: 15,
  },
});
