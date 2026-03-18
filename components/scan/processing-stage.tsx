import { ThemedText } from "@/components/themed-text";
import { colour } from "@/tokens";
import { StyleSheet, View } from "react-native";

interface ProcessingStageProps {
  scanProgress: number;
  scanLine: number;
}

interface ProcessStep {
  label: string;
  threshold: number;
}

const PROCESSING_STEPS: ProcessStep[] = [
  { label: "Detecting edges", threshold: 33 },
  { label: "Extracting text", threshold: 66 },
  { label: "Matching category", threshold: 100 },
];

export function ProcessingStageComponent({
  scanProgress,
  scanLine,
}: ProcessingStageProps) {
  return (
    <View style={styles.container}>
      {/* Receipt being scanned */}
      <View style={styles.receiptCard}>
        {/* Receipt lines */}
        {[30, 50, 70, 90, 110, 130, 150, 170, 190, 210].map((y, i) => (
          <View
            key={i}
            style={[
              styles.receiptLine,
              {
                top: y,
                width: i % 3 === 0 ? "60%" : i % 2 === 0 ? "80%" : "90%",
              },
            ]}
          />
        ))}

        {/* Scan line */}
        <View
          style={[
            styles.scanLine,
            {
              top: scanLine * 2.6,
            },
          ]}
        />

        {/* Teal overlay as scanned */}
        <View
          style={[
            styles.scannedOverlay,
            {
              height: scanLine * 2.6,
            },
          ]}
        />
      </View>

      <ThemedText type="title" style={styles.heading}>
        Reading Receipt...
      </ThemedText>
      <ThemedText style={styles.subtitle}>
        OCR extraction in progress
      </ThemedText>

      {/* Progress bar */}
      <View style={styles.progressBarContainer}>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${scanProgress}%` as any,
              },
            ]}
          />
        </View>
        <ThemedText style={styles.percentageText}>{scanProgress}%</ThemedText>
      </View>

      {/* Processing steps */}
      <View style={styles.stepsContainer}>
        {PROCESSING_STEPS.map((step, i) => (
          <View
            key={i}
            style={[
              styles.step,
              {
                opacity: scanProgress > step.threshold - 33 ? 1 : 0.3,
              },
            ]}
          >
            <View style={styles.stepCircle}>
              {scanProgress > step.threshold - 33 ? (
                <ThemedText style={styles.stepCheck}>✓</ThemedText>
              ) : (
                <View style={styles.stepDot} />
              )}
            </View>
            <ThemedText style={styles.stepLabel}>{step.label}</ThemedText>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 600,
    paddingVertical: 40,
    paddingHorizontal: 32,
  },
  receiptCard: {
    width: 200,
    height: 260,
    backgroundColor: colour.white,
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  receiptLine: {
    position: "absolute",
    height: 8,
    marginHorizontal: 20,
    backgroundColor: colour.surface1,
    borderRadius: 4,
  },
  scanLine: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: colour.primary,
    opacity: 0.8,
  },
  scannedOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: colour.primary50,
    opacity: 0.4,
  },
  heading: {
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    color: colour.textHint,
    fontSize: 13,
    marginBottom: 28,
    textAlign: "center",
  },
  progressBarContainer: {
    width: "100%",
    alignItems: "center",
    marginBottom: 12,
  },
  progressBar: {
    width: "100%",
    height: 8,
    backgroundColor: colour.surface1,
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 12,
  },
  progressFill: {
    height: "100%",
    backgroundColor: colour.primary,
    borderRadius: 4,
  },
  percentageText: {
    color: colour.primary,
    fontWeight: "700",
    fontSize: 14,
  },
  stepsContainer: {
    marginTop: 32,
    width: "100%",
    gap: 10,
  },
  step: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  stepCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colour.primary50,
    alignItems: "center",
    justifyContent: "center",
  },
  stepDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colour.primary,
  },
  stepCheck: {
    color: colour.primary,
    fontWeight: "700",
    fontSize: 12,
  },
  stepLabel: {
    fontSize: 13,
    fontWeight: "500",
  },
});
