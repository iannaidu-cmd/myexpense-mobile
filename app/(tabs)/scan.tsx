import { ProcessingStageComponent } from "@/components/scan/processing-stage";
import { ReviewStageComponent } from "@/components/scan/review-stage";
import { ScanStageComponent } from "@/components/scan/scan-stage";
import { SuccessStageComponent } from "@/components/scan/success-stage";
import type { Category, Receipt, ScanStage } from "@/components/scan/types";
import { UploadGalleryScreen } from "@/components/scan/upload-gallery";
import { ThemedView } from "@/components/themed-view";
import { useThemeColor } from "@/hooks/use-theme-color";
import { useEffect, useState } from "react";
import { ScrollView, StyleSheet } from "react-native";

import { colour } from "@/tokens";

export const CATEGORIES: Category[] = [
  {
    code: "TRAVEL",
    label: "Travel & Transport",
    icon: "🚗",
    color: colour.primary,
  },
  {
    code: "OFFICE",
    label: "Office & Stationery",
    icon: "💼",
    color: colour.primary,
  },
  {
    code: "SOFTWARE",
    label: "Software & Tech",
    icon: "💻",
    color: colour.primary,
  },
  {
    code: "MEALS",
    label: "Meals & Entertainment",
    icon: "🍽️",
    color: colour.accent,
  },
  {
    code: "PROF",
    label: "Professional Services",
    icon: "📋",
    color: colour.primary,
  },
  { code: "OTHER", label: "Other", icon: "📦", color: colour.primary50 },
];

export function CameraScanScreen() {
  const [stage, setStage] = useState<ScanStage>("scan");
  const [selectedCatIdx, setSelectedCatIdx] = useState(2); // Software by default
  const [scanProgress, setScanProgress] = useState(0);
  const [scanLine, setScanLine] = useState(0);
  const [pulseRing, setPulseRing] = useState(false);

  const backgroundColor = useThemeColor({}, "background");

  // Mock receipt - replace with real data from API
  const mockReceipt: Receipt = {
    id: "rec_1",
    vendor: "Incredible Connection",
    date: "12 Mar 2026",
    total: 1249,
    vat: 162.87,
    items: [
      { description: "USB-C Hub", quantity: 1 },
      { description: "HDMI Cable", quantity: 2 },
    ],
    categoryCode: CATEGORIES[selectedCatIdx].code,
    categoryLabel: CATEGORIES[selectedCatIdx].label,
    confidence: 94,
    deductible: true,
  };

  // Animate scan line during processing
  useEffect(() => {
    if (stage !== "processing") return;
    let p = 0;
    const interval = setInterval(() => {
      p += 2;
      setScanProgress(p);
      setScanLine(p % 100);
      if (p >= 100) {
        clearInterval(interval);
        setTimeout(() => setStage("review"), 400);
      }
    }, 30);
    return () => clearInterval(interval);
  }, [stage]);

  // Pulse animation for camera button
  useEffect(() => {
    const timer = setInterval(() => setPulseRing((p) => !p), 1400);
    return () => clearInterval(timer);
  }, []);

  const handleBack = () => {
    if (stage === "review") setStage("scan");
    else if (stage === "done") setStage("scan");
  };

  const handleSave = () => {
    setStage("done");
  };

  const handleStartOver = () => {
    setScanProgress(0);
    setScanLine(0);
    setSelectedCatIdx(2);
    setStage("scan");
  };

  return (
    <ThemedView style={[styles.container, { backgroundColor }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled={true}
      >
        {stage === "scan" && (
          <ScanStageComponent
            pulseRing={pulseRing}
            onCapture={() => setStage("processing")}
          />
        )}

        {stage === "processing" && (
          <ProcessingStageComponent
            scanProgress={scanProgress}
            scanLine={scanLine}
          />
        )}

        {stage === "review" && (
          <ReviewStageComponent
            receipt={mockReceipt}
            categories={CATEGORIES}
            selectedCatIdx={selectedCatIdx}
            onBack={handleBack}
            onCategorySelect={setSelectedCatIdx}
            onSave={handleSave}
          />
        )}

        {stage === "done" && (
          <SuccessStageComponent
            receipt={mockReceipt}
            onStartOver={handleStartOver}
          />
        )}
      </ScrollView>
    </ThemedView>
  );
}

export function ScanTab() {
  return <UploadGalleryScreen />;
}

export default ScanTab;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
});
